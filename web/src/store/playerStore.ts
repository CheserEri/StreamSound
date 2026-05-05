import { create } from 'zustand';
import { getServerUrl, STORAGE_KEYS, getString, setString, deleteKey } from '../services/api';
import { reportPlayHistory } from '../services/api';
import type { TrackListItem, PlayMode } from '../types';

const HISTORY_REPORT_THRESHOLD = 30;
const PLAY_MODES: PlayMode[] = ['sequential', 'shuffle', 'repeat'];

// Singleton audio element
let audio: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (!audio) {
    audio = new Audio();
    audio.preload = 'metadata';
  }
  return audio;
}

function getStoredPlayMode(): PlayMode {
  const modeIndex = parseInt(localStorage.getItem(STORAGE_KEYS.PLAY_MODE) || '0', 10);
  return PLAY_MODES[modeIndex] ?? 'sequential';
}

interface PlayerState {
  queue: TrackListItem[];
  currentIndex: number;
  mode: PlayMode;
  isPlaying: boolean;
  progress: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  reportedTracks: Set<number>;
  isInitialized: boolean;

  setQueue: (tracks: TrackListItem[], startIndex?: number) => void;
  appendToQueue: (tracks: TrackListItem[]) => void;
  play: () => void;
  pause: () => void;
  skipToNext: () => void;
  skipToPrevious: () => void;
  seekTo: (position: number) => void;
  toggleMode: () => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  initialize: () => void;
}

let progressInterval: ReturnType<typeof setInterval> | null = null;

function startProgressPolling(get: () => PlayerState, set: (partial: Partial<PlayerState>) => void) {
  stopProgressPolling();
  progressInterval = setInterval(() => {
    const a = getAudio();
    const { currentIndex: idx, queue: q, reportedTracks: reported } = get();
    const progress = a.currentTime;
    const duration = a.duration || 0;

    set({ progress, duration });

    if (idx >= 0 && idx < q.length && !reported.has(q[idx].id)) {
      const shouldReport = progress >= HISTORY_REPORT_THRESHOLD || (duration > 0 && progress >= duration - 1);
      if (shouldReport) {
        reportPlayHistory(q[idx].id);
        set({ reportedTracks: new Set([...reported, q[idx].id]) });
      }
    }
  }, 250);
}

function stopProgressPolling() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  mode: getStoredPlayMode(),
  isPlaying: false,
  progress: 0,
  duration: 0,
  volume: 1,
  isMuted: false,
  reportedTracks: new Set<number>(),
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) return;
    const a = getAudio();

    a.addEventListener('ended', () => {
      get().skipToNext();
    });

    a.addEventListener('play', () => {
      set({ isPlaying: true });
      startProgressPolling(get, set);
    });

    a.addEventListener('pause', () => {
      set({ isPlaying: false });
      stopProgressPolling();
    });

    a.addEventListener('loadedmetadata', () => {
      set({ duration: a.duration });
    });

    set({ isInitialized: true });
  },

  setQueue: (tracks: TrackListItem[], startIndex = 0) => {
    const a = getAudio();
    const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
    const serverUrl = getServerUrl();
    const track = tracks[startIndex];

    a.src = `${serverUrl}/stream/${track.id}`;
    if (token) {
      // For streaming with auth, we need to set headers - use fetch + blob URL approach
      // But HTMLAudioElement doesn't support custom headers directly
      // We'll use a workaround: append token as query param (server needs to support this)
      // OR we can use the fetch API to get the audio as a blob
      // For simplicity, we'll pass token via URL
      a.src = `${serverUrl}/stream/${track.id}?token=${encodeURIComponent(token)}`;
    }

    a.play().catch(() => {});
    set({
      queue: tracks,
      currentIndex: startIndex,
      isPlaying: true,
      progress: 0,
      reportedTracks: new Set(),
    });
    startProgressPolling(get, set);
  },

  appendToQueue: (tracks: TrackListItem[]) => {
    set((state) => ({ queue: [...state.queue, ...tracks] }));
  },

  play: () => {
    const a = getAudio();
    a.play().catch(() => {});
    set({ isPlaying: true });
    startProgressPolling(get, set);
  },

  pause: () => {
    const a = getAudio();
    a.pause();
    set({ isPlaying: false });
    stopProgressPolling();
  },

  skipToNext: () => {
    const { queue, currentIndex, mode } = get();
    if (queue.length === 0) return;
    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (mode === 'repeat') nextIndex = 0;
      else if (mode === 'shuffle') nextIndex = Math.floor(Math.random() * queue.length);
      else { get().pause(); return; }
    }
    get().setQueue(queue, nextIndex);
  },

  skipToPrevious: () => {
    const { currentIndex, progress, queue } = get();
    if (progress > 3) {
      getAudio().currentTime = 0;
      set({ progress: 0 });
      return;
    }
    if (currentIndex <= 0) return;
    get().setQueue(queue, currentIndex - 1);
  },

  seekTo: (position: number) => {
    getAudio().currentTime = position;
    set({ progress: position });
  },

  toggleMode: () => {
    const { mode } = get();
    const nextIndex = (PLAY_MODES.indexOf(mode) + 1) % PLAY_MODES.length;
    const nextMode = PLAY_MODES[nextIndex];
    localStorage.setItem(STORAGE_KEYS.PLAY_MODE, nextIndex.toString());
    set({ mode: nextMode });
  },

  setVolume: (volume: number) => {
    getAudio().volume = volume;
    set({ volume });
  },

  toggleMute: () => {
    const a = getAudio();
    a.muted = !a.muted;
    set({ isMuted: a.muted });
  },
}));

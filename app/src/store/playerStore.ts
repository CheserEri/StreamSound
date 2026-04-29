import { create } from 'zustand';
import TrackPlayer, {
  State,
  Event,
  RepeatMode,
  Capability,
  AppKilledPlaybackBehavior,
  type Track as RNTPTrack,
} from 'react-native-track-player';
import {
  getNumber,
  setNumber,
  getString,
  STORAGE_KEYS,
  getPersistedQueue,
  setPersistedQueue,
  clearPersistedQueue,
} from '../services/storage';
import { getServerUrl, reportPlayHistory } from '../services/api';
import type { TrackListItem, PlayMode } from '../types';

// Report history after 30 seconds of playback
const HISTORY_REPORT_THRESHOLD = 30;
const PLAY_MODES: PlayMode[] = ['sequential', 'shuffle', 'repeat'];

function getStoredPlayMode(): PlayMode {
  const modeIndex = getNumber(STORAGE_KEYS.PLAY_MODE) ?? 0;
  return PLAY_MODES[modeIndex] ?? 'sequential';
}

// Debounced queue persistence
let persistTimeout: ReturnType<typeof setTimeout> | null = null;
function persistQueueDebounced(queue: TrackListItem[], index: number) {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    setPersistedQueue(queue, index);
  }, 300);
}

interface PlayerState {
  queue: TrackListItem[];
  currentIndex: number;
  mode: PlayMode;
  isPlaying: boolean;
  progress: number;
  duration: number;
  reportedTracks: Set<number>;

  setQueue: (tracks: TrackListItem[], startIndex?: number) => Promise<void>;
  appendToQueue: (tracks: TrackListItem[]) => Promise<void>;
  play: () => Promise<void>;
  pause: () => Promise<void>;
  skipToNext: () => Promise<void>;
  skipToPrevious: () => Promise<void>;
  seekTo: (position: number) => Promise<void>;
  toggleMode: () => Promise<void>;
  syncWithTrackPlayer: () => Promise<void>;
  setupPlayer: () => Promise<void>;
}

function mapTrackToRNTP(track: TrackListItem): RNTPTrack {
  const serverUrl = getServerUrl();
  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);

  return {
    id: track.id.toString(),
    url: `${serverUrl}/stream/${track.id}`,
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    title: track.title,
    artist: track.artist || undefined,
    artwork: track.hasCover ? `${serverUrl}/covers/${track.id}` : undefined,
    duration: track.duration || undefined,
  };
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  mode: getStoredPlayMode(),
  isPlaying: false,
  progress: 0,
  duration: 0,
  reportedTracks: new Set<number>(),

  setupPlayer: async () => {
    try {
      await TrackPlayer.setupPlayer({
        autoHandleInterruptions: true,
      });

      await TrackPlayer.updateOptions({
        android: {
          appKilledPlaybackBehavior:
            AppKilledPlaybackBehavior.ContinuePlayback,
        },
        capabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
          Capability.SeekTo,
          Capability.Stop,
        ],
        compactCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
        ],
        notificationCapabilities: [
          Capability.Play,
          Capability.Pause,
          Capability.SkipToNext,
          Capability.SkipToPrevious,
        ],
      });

      // Restore play mode
      const savedMode = getStoredPlayMode();
      if (savedMode === 'repeat') {
        await TrackPlayer.setRepeatMode(RepeatMode.Track);
      }

      // Restore persisted queue
      const persisted = getPersistedQueue();
      if (persisted && persisted.queue.length > 0) {
        const { queue, index } = persisted;
        const rntpTracks = queue.map(mapTrackToRNTP);
        await TrackPlayer.add(rntpTracks);
        const safeIndex = Math.min(index, queue.length - 1);
        await TrackPlayer.skip(safeIndex);
        set({ queue, currentIndex: safeIndex });
      }

      // Listen for state changes
      TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
        set({ isPlaying: event.state === State.Playing });
      });

      TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
        set({ progress: event.position, duration: event.duration });

        // Report history after threshold or when track completes
        const { currentIndex: idx, queue: q, reportedTracks: reported } = get();
        if (idx >= 0 && idx < q.length && !reported.has(q[idx].id)) {
          const shouldReport =
            event.position >= HISTORY_REPORT_THRESHOLD ||
            (event.duration > 0 && event.position >= event.duration - 1);
          if (shouldReport) {
            reportPlayHistory(q[idx].id);
            set({ reportedTracks: new Set([...reported, q[idx].id]) });
          }
        }
      });

      TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
        if (event.index !== undefined) {
          set({ currentIndex: event.index });
          persistQueueDebounced(get().queue, event.index);
        }
      });

      TrackPlayer.addEventListener(Event.PlaybackPlayWhenReadyChanged, (event) => {
        set({ isPlaying: event.playWhenReady });
      });
    } catch (error) {
      console.error('Failed to setup player:', error);
    }
  },

  setQueue: async (tracks: TrackListItem[], startIndex = 0) => {
    const rntpTracks = tracks.map(mapTrackToRNTP);
    await TrackPlayer.reset();
    await TrackPlayer.add(rntpTracks);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
    set({ queue: tracks, currentIndex: startIndex, isPlaying: true, reportedTracks: new Set() });
    persistQueueDebounced(tracks, startIndex);
  },

  appendToQueue: async (tracks: TrackListItem[]) => {
    const rntpTracks = tracks.map(mapTrackToRNTP);
    await TrackPlayer.add(rntpTracks);
    set((state) => {
      const newQueue = [...state.queue, ...tracks];
      persistQueueDebounced(newQueue, state.currentIndex);
      return { queue: newQueue };
    });
  },

  play: async () => {
    await TrackPlayer.play();
    set({ isPlaying: true });
  },

  pause: async () => {
    await TrackPlayer.pause();
    set({ isPlaying: false });
  },

  skipToNext: async () => {
    const { queue, currentIndex, mode } = get();
    if (queue.length === 0) return;

    let nextIndex = currentIndex + 1;
    if (nextIndex >= queue.length) {
      if (mode === 'repeat') {
        nextIndex = 0;
      } else if (mode === 'shuffle') {
        nextIndex = Math.floor(Math.random() * queue.length);
      } else {
        return;
      }
    }

    await TrackPlayer.skip(nextIndex);
    await TrackPlayer.play();
    set({ currentIndex: nextIndex, isPlaying: true });
    persistQueueDebounced(queue, nextIndex);
  },

  skipToPrevious: async () => {
    const { currentIndex, progress } = get();

    // If more than 3 seconds into the song, restart it
    if (progress > 3) {
      await TrackPlayer.seekTo(0);
      set({ progress: 0 });
      return;
    }

    if (currentIndex <= 0) return;

    const prevIndex = currentIndex - 1;
    await TrackPlayer.skip(prevIndex);
    await TrackPlayer.play();
    set({ currentIndex: prevIndex, isPlaying: true });
    persistQueueDebounced(get().queue, prevIndex);
  },

  seekTo: async (position: number) => {
    await TrackPlayer.seekTo(position);
    set({ progress: position });
  },

  toggleMode: async () => {
    const { mode } = get();
    const nextIndex = (PLAY_MODES.indexOf(mode) + 1) % PLAY_MODES.length;
    const nextMode = PLAY_MODES[nextIndex];

    setNumber(STORAGE_KEYS.PLAY_MODE, nextIndex);

    if (nextMode === 'repeat') {
      await TrackPlayer.setRepeatMode(RepeatMode.Track);
    } else {
      await TrackPlayer.setRepeatMode(RepeatMode.Off);
    }

    set({ mode: nextMode });
  },

  syncWithTrackPlayer: async () => {
    try {
      const index = await TrackPlayer.getActiveTrackIndex();
      const state = await TrackPlayer.getState();
      const progress = await TrackPlayer.getProgress();

      set({
        currentIndex: index ?? -1,
        isPlaying: state === State.Playing,
        progress: progress.position,
        duration: progress.duration,
      });
    } catch {
      // Player not ready
    }
  },
}));

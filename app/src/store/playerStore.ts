/**
 * 播放器状态管理
 * 使用 Zustand 管理播放器状态，包括队列、播放模式、进度等
 */
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
import { cacheTrackAudio, getCachedAudioUrl } from '../services/audioCache';
import type { TrackListItem, PlayMode } from '../types';

// 播放历史上报阈值（播放超过30秒才上报）
const HISTORY_REPORT_THRESHOLD = 30;
// 播放模式列表
const PLAY_MODES: PlayMode[] = ['sequential', 'shuffle', 'repeat'];
// 播放器初始化 Promise（用于防止重复初始化）
let setupPromise: Promise<void> | null = null;
// 进度轮询定时器
let progressInterval: ReturnType<typeof setInterval> | null = null;

/**
 * 获取存储的播放模式
 */
function getStoredPlayMode(): PlayMode {
  const modeIndex = getNumber(STORAGE_KEYS.PLAY_MODE) ?? 0;
  return PLAY_MODES[modeIndex] ?? 'sequential';
}

// 防抖队列持久化定时器
let persistTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 防抖持久化队列
 */
function persistQueueDebounced(queue: TrackListItem[], index: number) {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    setPersistedQueue(queue, index);
  }, 300);
}

/**
 * 启动进度轮询
 */
function startProgressPolling(get: () => PlayerState, set: (partial: Partial<PlayerState>) => void) {
  stopProgressPolling();
  progressInterval = setInterval(async () => {
    try {
      const progress = await TrackPlayer.getProgress();
      const { currentIndex: idx, queue: q, reportedTracks: reported } = get();

      // 流式音频可能延迟报告 duration，使用元数据作为兜底
      let duration = progress.duration;
      if ((!duration || duration <= 0) && idx >= 0 && idx < q.length) {
        duration = q[idx].duration || 0;
      }

      set({ progress: progress.position, duration });

      // 播放历史上报
      if (idx >= 0 && idx < q.length && !reported.has(q[idx].id)) {
        const shouldReport =
          progress.position >= HISTORY_REPORT_THRESHOLD ||
          (progress.duration > 0 && progress.position >= progress.duration - 1);
        if (shouldReport) {
          reportPlayHistory(q[idx].id);
          set({ reportedTracks: new Set([...reported, q[idx].id]) });
        }
      }
    } catch {
      // 播放器未就绪，忽略
    }
  }, 250);
}

/**
 * 停止进度轮询
 */
function stopProgressPolling() {
  if (progressInterval) {
    clearInterval(progressInterval);
    progressInterval = null;
  }
}

/**
 * 播放器状态接口
 */
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

/**
 * 将歌曲信息转换为 RNTP 格式
 */
async function mapTrackToRNTP(track: TrackListItem): Promise<RNTPTrack> {
  const serverUrl = getServerUrl();
  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
  const cachedUrl = await getCachedAudioUrl(track.id);

  return {
    id: track.id.toString(),
    url: cachedUrl || `${serverUrl}/stream/${track.id}`,
    headers: cachedUrl ? undefined : token ? { Authorization: `Bearer ${token}` } : undefined,
    title: track.title,
    artist: track.artist || undefined,
    artwork: track.hasCover ? `${serverUrl}/covers/${track.id}` : undefined,
    duration: track.duration || undefined,
  };
}

function cacheTrackInBackground(track?: TrackListItem): void {
  if (!track) return;
  cacheTrackAudio(track.id);
}

/**
 * 播放器状态 Store
 */
export const usePlayerStore = create<PlayerState>((set, get) => ({
  queue: [],
  currentIndex: -1,
  mode: getStoredPlayMode(),
  isPlaying: false,
  progress: 0,
  duration: 0,
  reportedTracks: new Set<number>(),

  /**
   * 初始化播放器
   */
  setupPlayer: async () => {
    if (setupPromise) {
      return setupPromise;
    }

    setupPromise = (async () => {
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

        // 恢复播放模式
        const savedMode = getStoredPlayMode();
        if (savedMode === 'repeat') {
          await TrackPlayer.setRepeatMode(RepeatMode.Track);
        }

        // 恢复持久化队列
        const persisted = getPersistedQueue();
        if (persisted && persisted.queue.length > 0) {
          const { queue, index } = persisted;
          const rntpTracks = await Promise.all(queue.map(mapTrackToRNTP));
          await TrackPlayer.add(rntpTracks);
          const safeIndex = Math.min(index, queue.length - 1);
          await TrackPlayer.skip(safeIndex);
          set({ queue, currentIndex: safeIndex });
          cacheTrackInBackground(queue[safeIndex]);
        }

        // 监听当前播放歌曲变化
        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
          if (event.index !== undefined) {
            set({ currentIndex: event.index });
            persistQueueDebounced(get().queue, event.index);
            const q = get().queue;
            if (event.index >= 0 && event.index < q.length) {
              const metaDuration = q[event.index].duration || 0;
              set({ progress: 0, duration: metaDuration });
              cacheTrackInBackground(q[event.index]);
            }
          }
        });

        // 监听播放准备状态变化
        TrackPlayer.addEventListener(Event.PlaybackPlayWhenReadyChanged, (event) => {
          const isNowPlaying = event.playWhenReady;
          set({ isPlaying: isNowPlaying });
          if (isNowPlaying) {
            startProgressPolling(get, set);
          } else {
            stopProgressPolling();
          }
        });

        // 监听播放状态变化（补充：处理缓冲等中间状态）
        TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
          const playing = event.state === State.Playing;
          const { isPlaying: current } = get();
          if (playing !== current) {
            set({ isPlaying: playing });
          }
          if (playing && !progressInterval) {
            startProgressPolling(get, set);
          } else if (!playing && event.state !== State.Buffering) {
            stopProgressPolling();
          }
        });

        // 检查当前是否已在播放（恢复场景），启动轮询
        try {
          const state = await TrackPlayer.getState();
          if (state === State.Playing) {
            set({ isPlaying: true });
            startProgressPolling(get, set);
          }
        } catch {
          // 播放器未就绪
        }
      } catch (error) {
        console.error('Failed to setup player:', error);
        setupPromise = null;
      }
    })();

    return setupPromise;
  },

  /**
   * 设置播放队列
   */
  setQueue: async (tracks: TrackListItem[], startIndex = 0) => {
    const rntpTracks = await Promise.all(tracks.map(mapTrackToRNTP));
    await TrackPlayer.reset();
    await TrackPlayer.add(rntpTracks);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
    set({ queue: tracks, currentIndex: startIndex, isPlaying: true, reportedTracks: new Set() });
    startProgressPolling(get, set);
    persistQueueDebounced(tracks, startIndex);
    cacheTrackInBackground(tracks[startIndex]);
  },

  /**
   * 追加到播放队列
   */
  appendToQueue: async (tracks: TrackListItem[]) => {
    const rntpTracks = await Promise.all(tracks.map(mapTrackToRNTP));
    await TrackPlayer.add(rntpTracks);
    set((state) => {
      const newQueue = [...state.queue, ...tracks];
      persistQueueDebounced(newQueue, state.currentIndex);
      return { queue: newQueue };
    });
  },

  /**
   * 播放
   */
  play: async () => {
    await TrackPlayer.play();
    set({ isPlaying: true });
    startProgressPolling(get, set);
  },

  /**
   * 暂停
   */
  pause: async () => {
    await TrackPlayer.pause();
    set({ isPlaying: false });
    stopProgressPolling();
  },

  /**
   * 跳转到下一首
   */
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
    startProgressPolling(get, set);
    persistQueueDebounced(queue, nextIndex);
    cacheTrackInBackground(queue[nextIndex]);
  },

  /**
   * 跳转到上一首
   */
  skipToPrevious: async () => {
    const { currentIndex, progress } = get();

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
    startProgressPolling(get, set);
    persistQueueDebounced(get().queue, prevIndex);
    cacheTrackInBackground(get().queue[prevIndex]);
  },

  /**
   * 跳转到指定位置
   */
  seekTo: async (position: number) => {
    await TrackPlayer.seekTo(position);
    set({ progress: position });
  },

  /**
   * 切换播放模式
   */
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

  /**
   * 同步状态与 TrackPlayer
   */
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
      // 播放器未就绪
    }
  },
}));

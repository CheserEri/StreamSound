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
import type { TrackListItem, PlayMode } from '../types';

// 播放历史上报阈值（播放超过30秒才上报）
const HISTORY_REPORT_THRESHOLD = 30;
// 播放模式列表
const PLAY_MODES: PlayMode[] = ['sequential', 'shuffle', 'repeat'];
// 播放器初始化 Promise（用于防止重复初始化）
let setupPromise: Promise<void> | null = null;

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
 * @param queue 队列数据
 * @param index 当前索引
 */
function persistQueueDebounced(queue: TrackListItem[], index: number) {
  if (persistTimeout) clearTimeout(persistTimeout);
  persistTimeout = setTimeout(() => {
    setPersistedQueue(queue, index);
  }, 300);
}

/**
 * 播放器状态接口
 */
interface PlayerState {
  queue: TrackListItem[];              // 播放队列
  currentIndex: number;                // 当前播放索引
  mode: PlayMode;                      // 播放模式
  isPlaying: boolean;                  // 是否正在播放
  progress: number;                    // 当前进度（秒）
  duration: number;                    // 歌曲时长（秒）
  reportedTracks: Set<number>;         // 已上报历史的歌曲ID集合

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
        // 初始化 TrackPlayer
        await TrackPlayer.setupPlayer({
          autoHandleInterruptions: true,
        });

        // 更新播放器配置
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
          const rntpTracks = queue.map(mapTrackToRNTP);
          await TrackPlayer.add(rntpTracks);
          const safeIndex = Math.min(index, queue.length - 1);
          await TrackPlayer.skip(safeIndex);
          set({ queue, currentIndex: safeIndex });
        }

        // 监听播放状态变化
        TrackPlayer.addEventListener(Event.PlaybackState, (event) => {
          set({ isPlaying: event.state === State.Playing });
        });

        // 监听播放进度更新
        TrackPlayer.addEventListener(Event.PlaybackProgressUpdated, (event) => {
          const { currentIndex: idx, queue: q, reportedTracks: reported } = get();
          // 流式音频可能延迟报告 duration，使用元数据作为兜底
          let duration = event.duration;
          if ((!duration || duration <= 0) && idx >= 0 && idx < q.length) {
            duration = q[idx].duration || 0;
          }
          set({ progress: event.position, duration });
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

        // 监听当前播放歌曲变化
        TrackPlayer.addEventListener(Event.PlaybackActiveTrackChanged, (event) => {
          if (event.index !== undefined) {
            set({ currentIndex: event.index });
            persistQueueDebounced(get().queue, event.index);
          }
        });

        // 监听播放准备状态变化
        TrackPlayer.addEventListener(Event.PlaybackPlayWhenReadyChanged, (event) => {
          set({ isPlaying: event.playWhenReady });
        });
      } catch (error) {
        console.error('Failed to setup player:', error);
        setupPromise = null;
      }
    })();

    return setupPromise;
  },

  /**
   * 设置播放队列
   * @param tracks 歌曲列表
   * @param startIndex 开始播放索引
   */
  setQueue: async (tracks: TrackListItem[], startIndex = 0) => {
    const rntpTracks = tracks.map(mapTrackToRNTP);
    await TrackPlayer.reset();
    await TrackPlayer.add(rntpTracks);
    await TrackPlayer.skip(startIndex);
    await TrackPlayer.play();
    set({ queue: tracks, currentIndex: startIndex, isPlaying: true, reportedTracks: new Set() });
    persistQueueDebounced(tracks, startIndex);
  },

  /**
   * 追加到播放队列
   * @param tracks 要追加的歌曲列表
   */
  appendToQueue: async (tracks: TrackListItem[]) => {
    const rntpTracks = tracks.map(mapTrackToRNTP);
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
  },

  /**
   * 暂停
   */
  pause: async () => {
    await TrackPlayer.pause();
    set({ isPlaying: false });
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
    persistQueueDebounced(queue, nextIndex);
  },

  /**
   * 跳转到上一首
   * 如果播放超过3秒，重新播放当前歌曲
   */
  skipToPrevious: async () => {
    const { currentIndex, progress } = get();

    // 如果播放超过3秒，重新播放当前歌曲
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

  /**
   * 跳转到指定位置
   * @param position 位置（秒）
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

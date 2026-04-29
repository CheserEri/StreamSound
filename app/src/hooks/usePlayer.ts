/**
 * 播放器 Hook
 * 封装播放器状态和操作方法，提供简洁的接口供组件使用
 */
import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store';
import type { TrackListItem } from '../types';

// 初始化标记
let playerInitialized = false;

/**
 * 轻量级播放器操作 Hook
 * 只返回稳定的操作函数引用，不订阅 progress/duration 等高频变化的状态
 * 适用于不需要进度显示的组件（列表页、搜索页等），避免每秒重渲染
 */
export function usePlayerActions() {
  const setQueue = usePlayerStore((s) => s.setQueue);
  const appendToQueue = usePlayerStore((s) => s.appendToQueue);
  const play = usePlayerStore((s) => s.play);
  const pause = usePlayerStore((s) => s.pause);
  const skipToNext = usePlayerStore((s) => s.skipToNext);
  const skipToPrevious = usePlayerStore((s) => s.skipToPrevious);
  const seekTo = usePlayerStore((s) => s.seekTo);
  const toggleMode = usePlayerStore((s) => s.toggleMode);
  const setupPlayer = usePlayerStore((s) => s.setupPlayer);
  const queue = usePlayerStore((s) => s.queue);

  useEffect(() => {
    if (!playerInitialized) {
      playerInitialized = true;
      setupPlayer();
    }
  }, [setupPlayer]);

  const playTracks = useCallback(
    async (tracks: TrackListItem[], startIndex = 0) => {
      await setQueue(tracks, startIndex);
    },
    [setQueue],
  );

  const addAndPlay = useCallback(
    async (tracks: TrackListItem[]) => {
      if (queue.length === 0) {
        await playTracks(tracks, 0);
      } else {
        await appendToQueue(tracks);
      }
    },
    [queue.length, playTracks, appendToQueue],
  );

  return {
    playTracks,
    addAndPlay,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleMode,
  };
}

/**
 * 完整播放器 Hook
 * 包含所有状态（含 progress/duration），仅用于需要进度显示的组件（PlayerScreen）
 */
export function usePlayer() {
  const {
    queue,
    currentIndex,
    mode,
    isPlaying,
    progress,
    duration,
    setQueue,
    appendToQueue,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleMode,
    setupPlayer,
  } = usePlayerStore();

  useEffect(() => {
    if (!playerInitialized) {
      playerInitialized = true;
      setupPlayer();
    }
  }, [setupPlayer]);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const playTracks = useCallback(
    async (tracks: TrackListItem[], startIndex = 0) => {
      await setQueue(tracks, startIndex);
    },
    [setQueue],
  );

  const playSingle = useCallback(
    async (track: TrackListItem, tracks?: TrackListItem[]) => {
      if (tracks) {
        const index = tracks.findIndex((t) => t.id === track.id);
        await playTracks(tracks, index >= 0 ? index : 0);
      } else {
        await playTracks([track], 0);
      }
    },
    [playTracks],
  );

  const addAndPlay = useCallback(
    async (tracks: TrackListItem[]) => {
      if (queue.length === 0) {
        await playTracks(tracks, 0);
      } else {
        await appendToQueue(tracks);
      }
    },
    [queue.length, playTracks, appendToQueue],
  );

  return {
    queue,
    currentIndex,
    currentTrack,
    mode,
    isPlaying,
    progress,
    duration,
    playTracks,
    playSingle,
    addAndPlay,
    play,
    pause,
    skipToNext,
    skipToPrevious,
    seekTo,
    toggleMode,
  };
}

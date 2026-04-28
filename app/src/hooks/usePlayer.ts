import { useEffect, useCallback } from 'react';
import { usePlayerStore } from '../store';
import type { TrackListItem } from '../types';
import { getStreamUrl } from '../services/player';
import TrackPlayer, { type Track } from 'react-native-track-player';

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
    setupPlayer();
  }, []);

  const currentTrack = currentIndex >= 0 ? queue[currentIndex] : null;

  const playTracks = useCallback(
    async (tracks: TrackListItem[], startIndex = 0) => {
      const rntpTracks: Track[] = tracks.map((t) => ({
        id: t.id.toString(),
        url: getStreamUrl(t.id),
        title: t.title,
        artist: t.artist || undefined,
        duration: t.duration || undefined,
      }));
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

import TrackPlayer, { type Track } from 'react-native-track-player';
import { getServerUrl } from './api';
import { getString, STORAGE_KEYS } from './storage';

export function getStreamUrl(trackId: number): string {
  const serverUrl = getServerUrl();
  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
  return `${serverUrl}/stream/${trackId}`;
}

export function getCoverUrl(trackId: number): string {
  const serverUrl = getServerUrl();
  return `${serverUrl}/covers/${trackId}`;
}

export async function addTracks(tracks: Track[], startIndex = 0): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(startIndex);
}

export async function playTrack(trackId: number): Promise<void> {
  const queue = await TrackPlayer.getQueue();
  const index = queue.findIndex((t) => t.id === trackId.toString());
  if (index >= 0) {
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
  }
}

/**
 * 播放器服务
 * 提供与 TrackPlayer 相关的辅助函数
 */
import TrackPlayer, { type Track } from 'react-native-track-player';
import { getServerUrl } from './api';
import { getString, STORAGE_KEYS } from './storage';

/**
 * 获取歌曲流播放 URL
 * @param trackId 歌曲ID
 * @returns 带认证信息的流播放URL
 */
export function getStreamUrl(trackId: number): string {
  const serverUrl = getServerUrl();
  const token = getString(STORAGE_KEYS.ACCESS_TOKEN);
  return `${serverUrl}/stream/${trackId}`;
}

/**
 * 获取封面图片 URL
 * @param trackId 歌曲ID
 * @returns 封面图片URL
 */
export function getCoverUrl(trackId: number): string {
  const serverUrl = getServerUrl();
  return `${serverUrl}/covers/${trackId}`;
}

/**
 * 添加歌曲到播放队列并开始播放
 * @param tracks 歌曲列表
 * @param startIndex 开始播放的索引，默认为 0
 */
export async function addTracks(tracks: Track[], startIndex = 0): Promise<void> {
  await TrackPlayer.reset();
  await TrackPlayer.add(tracks);
  await TrackPlayer.skip(startIndex);
}

/**
 * 播放指定歌曲
 * 在当前队列中查找并播放指定 ID 的歌曲
 * @param trackId 歌曲ID
 */
export async function playTrack(trackId: number): Promise<void> {
  const queue = await TrackPlayer.getQueue();
  const index = queue.findIndex((t) => t.id === trackId.toString());
  if (index >= 0) {
    await TrackPlayer.skip(index);
    await TrackPlayer.play();
  }
}

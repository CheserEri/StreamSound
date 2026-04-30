/**
 * 播放器后台服务
 * 处理来自通知栏/锁屏/耳机的远程控制事件
 * 通过 Zustand store 转发，以正确处理播放模式（随机/单曲循环等）
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export default async function () {
  // 延迟导入避免循环依赖
  const { usePlayerStore } = await import('../store');
  const store = usePlayerStore.getState();

  TrackPlayer.addEventListener(Event.RemotePlay, () => store.play());
  TrackPlayer.addEventListener(Event.RemotePause, () => store.pause());
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());
  TrackPlayer.addEventListener(Event.RemoteNext, () => store.skipToNext());
  TrackPlayer.addEventListener(Event.RemotePrevious, () => store.skipToPrevious());
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => store.seekTo(event.position));
  TrackPlayer.addEventListener(Event.RemoteDuck, (event) => {
    if (event.paused) store.pause();
    else if (event.permanent) TrackPlayer.stop();
    else store.play();
  });
}

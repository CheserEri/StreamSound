/**
 * 播放器后台服务
 * 处理来自通知栏/锁屏/耳机的远程控制事件
 * react-native-track-player 要求在 index.js 中注册此服务
 */
import TrackPlayer, { Event } from 'react-native-track-player';

export default async function () {
  // 监听远程播放
  TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());

  // 监听远程暂停
  TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());

  // 监听远程停止
  TrackPlayer.addEventListener(Event.RemoteStop, () => TrackPlayer.stop());

  // 监听远程下一曲
  TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());

  // 监听远程上一曲
  TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());

  // 监听远程 seek
  TrackPlayer.addEventListener(Event.RemoteSeek, (event) => {
    TrackPlayer.seekTo(event.position);
  });

  // 监听远程跳转到指定曲目（锁屏控制台）
  TrackPlayer.addEventListener(Event.RemoteDuck, (event) => {
    if (event.paused) {
      TrackPlayer.pause();
    } else if (event.permanent) {
      TrackPlayer.stop();
    } else {
      TrackPlayer.play();
    }
  });
};

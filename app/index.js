import 'react-native-gesture-handler';
import TrackPlayer from 'react-native-track-player';
import {AppRegistry} from 'react-native';
import {name as appName} from './app.json';

// 注册播放器后台服务 (通知栏/锁屏/耳机控制)
// playbackService 使用 module.exports，require() 直接返回函数
TrackPlayer.registerPlaybackService(() => require('./src/services/playbackService'));

AppRegistry.registerComponent(appName, () => require('./src/App').default);

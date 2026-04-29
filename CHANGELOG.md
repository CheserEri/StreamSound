# Changelog

All notable changes to StreamSound are documented in this file.

## [0.2.0-alpha.1] - 2026-04-29

### Added
- MiniPlayer: 底部迷你播放控制栏，类似网易云音乐风格
  - 浅色背景、轻微阴影、圆角矩形设计
  - 左侧圆形专辑封面，中间歌曲信息，右侧播放控制
  - 支持点击展开完整播放器、播放/暂停、播放列表
- MiniPlayer 已集成到音乐库、文件夹、收藏、历史、搜索等主要页面

### Fixed
- 修复专辑图片加载失败的问题：FastImage 请求现在携带认证 token
- 改进歌词显示：无歌词时显示更友好的提示信息

## [0.1.0-alpha.4] - 2026-04-29

### Fixed
- Fixed Android native component registration by aligning `MainActivity` with the JavaScript app name `StreamSound`.
- Fixed Metro release bundle setup by declaring `@react-native/metro-config`.
- Reduced misleading `AppRegistry` startup errors by delaying the root `App` import until registration.
- Made React Native Track Player setup idempotent to avoid duplicate native player initialization.

### Changed
- Added `bundle:android` verification script for Android release JavaScript bundle checks.

## [0.1.0-alpha.3] - 2026-04-29

### Fixed
- Fixed Android APK startup failure caused by missing bundled JavaScript assets when the app is opened without Metro.
- Fixed frontend TypeScript errors for navigation types, slider dependency, and react-native-track-player v4 exports/events.
- Fixed server production startup by copying `src/db/schema.sql` into `dist/db/schema.sql` during build.
- Fixed boolean environment parsing so values such as `SCAN_ON_START=false` are handled correctly.

### Changed
- Added explicit Android packaging scripts: `apk:debug`, `apk:release`, and `android:release`.
- Bumped app and server package versions to `0.1.0-alpha.3`.

# Changelog

All notable changes to StreamSound are documented in this file.

## [0.2.0-alpha.5] - 2026-04-30

### Added
- 全新应用启动图标：液态玻璃风格音符设计
  - 半透明渐变填充，非实心玻璃质感
  - 折射高光 + 边缘光线 + 玻璃气泡装饰
  - 已生成 mdpi/hdpi/xhdpi/xxhdpi/xxxhdpi 全密度 PNG
- 新增 README.md 项目文档

## [0.2.0-alpha.4] - 2026-04-30

### Fixed
- 修复播放进度条无法正确显示歌曲时长的问题：流式音频场景下 RNTP 延迟报告 duration，改用元数据时长作为兜底
- 修复 `formatProgress` 在传入 `NaN`/`Infinity`/负数时显示异常的问题
- 修复 Slider `maximumValue` 在 duration 为 0 时退化为 1 的问题，增加歌曲元数据时长兜底

## [0.2.0-alpha.3] - 2026-04-30

### Fixed
- Fixed Android HTTP cleartext traffic blocked by default: added `android:usesCleartextTraffic="true"` to AndroidManifest.xml, enabling HTTP connections to local server
- Fixed default server IP from `192.168.1.100` to `192.168.31.184` in api.ts, LoginScreen.tsx, SettingsScreen.tsx

## [0.2.0-alpha.2] - 2026-04-30

### Security
- Auth plugin: added missing `return` after error responses — handlers no longer fall through on auth failure
- FTS5 search query injection prevention (keyword now quoted)
- Retry interceptor limited to idempotent methods (GET/HEAD/OPTIONS) — no more duplicate POST/DELETE

### Fixed
- Global error handler + 404 handler with structured error format (no more stack trace leaks)
- Covers route: structured 404 response instead of bare empty body
- PlayerScreen: AbortController prevents race condition on rapid track changes
- useSearch: debounce timer + AbortController cleanup on unmount
- FavoritesScreen, HistoryScreen, FolderScreen: AbortController for unmount cleanup
- Replaced sync `statSync`/`existsSync` with async `fs.promises` in stream, covers, admin routes

### Changed
- **Performance**: New `usePlayerActions()` hook eliminates per-second re-renders across 6 screens
- **Performance**: Scanner folder cache (Map) eliminates N+1 `getOrCreateFolder` queries
- **Performance**: `updateFolderCounts` uses single GROUP BY query instead of per-folder COUNT
- **Performance**: List endpoints use specific columns instead of `SELECT *` (excludes lyrics text)
- **Performance**: `TrackItem` wrapped in `React.memo`
- New shared utils: `server/src/utils/pagination.ts`, `server/src/utils/params.ts`
- New shared utils: `app/src/utils/format.ts` (formatDuration, formatProgress, formatRelativeTime, getModeIcon, getModeLabel)
- Deduplicated formatDuration (6 files), getModeIcon, getModeLabel across screens

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

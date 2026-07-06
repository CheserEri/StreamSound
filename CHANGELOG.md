# Changelog

All notable changes to StreamSound are documented in this file.

## [0.3.0-alpha.1] - 2026-07-07

### Added
- **Compose Multiplatform 客户端** (`composeApp/`) — 全新 KMP + Jetpack Compose Multiplatform 实现
  - 使用 [Salt UI](https://github.com/Moriafly/SaltUI) 组件库构建全部 10 个页面
  - 页面: 登录、音乐库、文件夹、播放器、队列、搜索、收藏、历史、设置、管理
  - Navigation 3 类型安全导航
  - Ktor Client 网络层 + Bearer token 自动刷新
  - StateFlow 响应式状态管理
- **Media3 系统级播放控制**
  - ExoPlayer 实际音频播放（替代模拟进度）
  - MediaSessionService 通知栏/锁屏/蓝牙 AVRCP 控制
  - 音频焦点管理（其他应用播放时自动暂停）
  - 耳机拔出自动暂停
  - OkHttp 数据源 + 动态 Bearer token 注入
- **音频缓存**
  - SimpleCache + LRU 淘汰策略
  - 可配置缓存上限（128/256/512/1024 MB）
- **Android 适配**（参照 Salt UI）
  - `edgeToEdge()` 全面屏适配（刘海屏、透明系统栏）
  - `safeMainCompat` 小米 HyperOS 导航栏闪烁兼容
  - Cupertino 风格弹性滚动
  - 状态栏前景色控制
  - `windowBackground=null` 主题优化
- **播放器增强**
  - 封面主色自适应渐变背景（`generatePlayerGradient`）
  - 播放模式同步到 ExoPlayer（顺序/随机/单曲循环）
  - 歌词/封面点击切换
  - 心形收藏弹跳动画
- **交互完善**
  - 注册成功反馈 + 自动切换登录模式
  - 播放队列删除功能
  - 服务器地址设置内可编辑
  - 文件夹列表分页加载（无限滚动）

### Changed
- `PlayerStateFlow` 从模拟进度轮询改为委托给 PlatformPlayer
- `App.kt` 主题从硬编码深色改为动态读取 SettingsStateFlow
- `formatProgress` 标记为 `@Deprecated`，委托给 `formatDuration`

### Fixed
- 播放模式（随机/单曲循环）未同步到实际播放器
- 缓存设置 UI 存在但无实际实现
- `coverDominantColor` 获取后未用于播放器背景
- AnimatedHeartButton 点击无动画效果
- PlaybackService + PlayerConnector 双重事件监听

## [0.2.0-alpha.14] - 2026-05-02

### Reverted
- 撤回 FLAC seek 修复和唱片背景封面联动改动

## [0.2.0-alpha.13] - 2026-05-02

### Fixed
- 修复进度条无法拖拽控制播放进度的问题：`Gesture.Pan().activeOffsetX([-10,10])` 与父级水平 ScrollView 手势冲突，改为 `activeOffsetX(0)` + `Gesture.Tap()` 组合，Pan 优先于 Tap 和 ScrollView
- 进度条 fill 和 thumb 改为 `useAnimatedStyle` 驱动，拖拽时实时跟随手指位置（UI 线程动画，无 JS 线程瓶颈）

### Changed
- **播放页背景氛围增强**: 模糊专辑封面效果从不可见调整为明显沉浸感
  - `blurRadius`: 80 → 30（更清晰的封面轮廓）
  - `opacity`: 0.25 → 0.4（更明显的封面色彩）
  - `scale`: 2.5 → 1.3（合理的放大倍率）
  - 暗色遮罩: `rgba(0,0,0,0.5)` → `rgba(0,0,0,0.35)`（更多封面色彩透出）

## [0.2.0-alpha.12] - 2026-05-02

### Reverted
- 撤回澎湃OS2全面屏手势提示线沉浸式适配（edge-to-edge 模式），恢复原有状态栏/导航栏行为

## [0.2.0-alpha.11] - 2026-05-02

### Fixed
- 修复播放进度条不随音乐播放移动、歌词不随播放滚动的根本问题
- **根因**: `playerStore.ts` 在事件回调中调用 `usePlayerStore()`（React Hook），违反 React 规则导致状态更新链断裂
- **修复方案**: 移除不可靠的 `Event.PlaybackProgressUpdated` 事件监听，改用 `setInterval` + `TrackPlayer.getProgress()` 每 250ms 轮询进度
- 播放时启动轮询，暂停时停止轮询（节省性能）
- `Event.PlaybackState` 监听器中修复 `usePlayerStore()` 调用为 `get()` + `set()`
- 保留 `Event.PlaybackActiveTrackChanged` 和 `Event.PlaybackPlayWhenReadyChanged` 事件监听（可靠）
- 恢复播放场景自动检测并启动轮询

## [0.2.0-alpha.10] - 2026-05-02

### Changed
- **UI 重构**: 参考 Spotify 设计理念（沉浸感 + 极简 + 音乐优先），全应用前端系统性优化
- **主题系统重构**: 颜色 Token 从 20 个扩展到 50+ 个，覆盖播放器、歌词、唱片、滑块等全部场景；新增 `getPlayerGradient()` 提供 8 套深色氛围渐变色板；消除全代码库硬编码颜色
- **播放页重设计**: 动态渐变背景（8 套色板按曲目自动切换）+ 模糊专辑封面氛围层（`blurRadius` + 暗色遮罩）+ 无封面回退渐变 + 触觉反馈
- **GlowSlider**: 新增真实发光效果（进度条光晕 + 拖拽滑块发光动画）
- **DiscCover**: 唱片外环阴影 + 黑胶刻纹纹理（同心圆细线）
- **LyricsView**: 当前行文字阴影增强视觉焦点
- **MiniPlayer**: 进度条主题 Token + 封面阴影层次
- **AnimatedPlayButton**: 新增 `backgroundColor` 属性，发光阴影跟随背景色
- **列表页统一**: FolderScreen 当前曲目左侧强调色边框；FavoritesScreen/HistoryScreen 空状态图标 + 当前播放高亮；全部错误/重试按钮改用主题 Token
- **AnimatedHeartButton**: 集成主题系统（红色心形通过 Token 保持）
- **CoverImage**: 加载指示器颜色改用主题 Token
- **RootNavigator**: PlayerScreen 模态动画改为 `slide_from_bottom`
- 15 个文件修改，+507 行，-328 行

## [0.2.0-alpha.6] - 2026-04-30

### Fixed
- 修复点击音乐文件夹后应用闪退的问题：新 UI 提交引入了 `react-native-reanimated` 和 `react-native-svg` 原生依赖，但未执行 `npm install` 导致模块缺失
- 修复 `playbackService.ts` 导出格式不匹配的问题：`module.exports` 改为 `export default`，修复通知栏/锁屏控制服务无法注册

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

# StreamSound 开发进度

## 当前版本: `0.3.0-alpha.1`

> **Note**: React Native 客户端 (`app/`) 已被 Compose Multiplatform 客户端 (`composeApp/`) 替代并移除。

---

## 已完成

### Phase 0 — Compose Multiplatform 重写 ✅
- [x] `composeApp/` — KMP + Jetpack Compose Multiplatform 客户端
- [x] Salt UI 组件库集成
- [x] 全部 10 个页面实现（登录、音乐库、文件夹、播放器、队列、搜索、收藏、历史、设置、管理）
- [x] Media3 ExoPlayer 实际音频播放
- [x] MediaSessionService 系统级媒体控制（通知栏/锁屏/蓝牙）
- [x] 音频缓存（SimpleCache + LRU 淘汰）
- [x] Android 全面屏适配 + 小米 HyperOS 兼容
- [x] 播放模式同步、封面主色渐变、注册反馈、队列删除、分页加载

### Phase 0b — 项目脚手架（旧版，已弃用）
- [x] `.gitignore` 配置
- [x] `server/package.json` — 依赖声明 (fastify, better-sqlite3, music-metadata, bcrypt, zod 等)
- [x] `server/tsconfig.json` — TypeScript 配置 (ES2022, NodeNext, strict)
- [x] `server/.env.example` — 环境变量模板
- [x] `server/src/db/schema.sql` — 数据库 Schema (5 tables + FTS5 + triggers)
- [x] `server/src/config.ts` — Zod 校验环境变量
- [x] `server/src/types/index.ts` — 类型定义 (DB rows, API DTOs, JWT, ScanState)

### Phase 1a — 数据库 + 插件 ✅
- [x] `server/src/db/client.ts` — SQLite 单例, WAL 模式
- [x] `server/src/plugins/auth.ts` — JWT 鉴权插件 (requireAuth/requireAdmin)
- [x] `server/src/plugins/cors.ts` — CORS 配置
- [x] `server/src/types/errors.ts` — 21 个错误码 + HTTP 状态映射

### Phase 1b — 认证路由 ✅
- [x] `server/src/routes/auth.ts` — 注册(首个用户自动admin), 登录, 刷新Token

### Phase 1c — 服务层 ✅
- [x] `server/src/services/metadata.ts` — music-metadata 元数据提取
- [x] `server/src/services/lyrics.ts` — .lrc 文件查找 + LRC 解析
- [x] `server/src/services/scanner.ts` — 递归扫描, 增量更新, 清理已删文件
- [x] `server/src/services/scheduler.ts` — node-cron 定时扫描

### Phase 1d — 业务路由 + 入口 ✅
- [x] `server/src/routes/library.ts` — 文件夹列表, 曲目列表(分页), 曲目详情
- [x] `server/src/routes/stream.ts` — HTTP Range 流式传输
- [x] `server/src/routes/covers.ts` — 封面图服务
- [x] `server/src/routes/search.ts` — FTS5 全文搜索 + 高亮
- [x] `server/src/routes/favorites.ts` — 收藏增删查
- [x] `server/src/routes/history.ts` — 播放历史 (50条上限, 去重)
- [x] `server/src/routes/admin.ts` — 扫描触发/状态, 用户列表/审核
- [x] `server/src/index.ts` — Fastify 启动, 插件/路由注册, 优雅关闭

### Phase 2a — 前端项目初始化 ✅
- [x] `app/package.json` — React Native 依赖 (track-player, zustand, axios, mmkv 等)
- [x] `app/tsconfig.json` — TypeScript 配置
- [x] `app/src/types/index.ts` — 前端类型定义

### Phase 2b — 状态管理 + API 服务层 ✅
- [x] `app/src/services/storage.ts` — MMKV 本地存储封装
- [x] `app/src/services/api.ts` — Axios 实例 + Token 自动刷新拦截器
- [x] `app/src/services/player.ts` — 播放器服务 (URL 生成)
- [x] `app/src/store/authStore.ts` — 登录态管理 (login/register/logout)
- [x] `app/src/store/playerStore.ts` — 播放状态 (queue/mode/progress)
- [x] `app/src/store/settingsStore.ts` — 用户设置 (serverUrl/lyricsSize/theme)
- [x] `app/src/hooks/usePlayer.ts` — 播放器 hook
- [x] `app/src/hooks/useSearch.ts` — 搜索防抖 hook
- [x] `app/src/hooks/useLyrics.ts` — 歌词同步 hook

### Phase 2c — 导航 + 基础页面 ✅
- [x] `app/src/navigation/RootNavigator.tsx` — React Navigation 路由配置
- [x] `app/src/screens/LoginScreen.tsx` — 登录/注册页 (含服务器地址配置)
- [x] `app/src/screens/LibraryScreen.tsx` — 音乐库首页 (文件夹列表 + 快捷入口)
- [x] `app/src/screens/FolderScreen.tsx` — 文件夹详情 (曲目列表 + 播放)
- [x] `app/src/screens/PlayerScreen.tsx` — 全屏播放器 (封面/进度/控制)
- [x] `app/src/screens/QueueScreen.tsx` — 播放队列
- [x] `app/src/screens/SearchScreen.tsx` — 搜索页 (实时搜索 + 高亮)
- [x] `app/src/screens/FavoritesScreen.tsx` — 收藏列表
- [x] `app/src/screens/HistoryScreen.tsx` — 最近播放
- [x] `app/src/screens/SettingsScreen.tsx` — 设置页
- [x] `app/src/components/MiniPlayer.tsx` — 底部迷你播放条
- [x] `app/src/components/TrackItem.tsx` — 曲目列表项
- [x] `app/src/components/CoverImage.tsx` — 封面图组件
- [x] `app/src/components/LyricsView.tsx` — 歌词滚动组件
- [x] `app/src/App.tsx` — 根组件

### Phase 3a — 歌词展示增强 ✅
- [x] `app/src/components/LyricsView.tsx` — 逐行高亮滚动 + 点击跳转 + 距离衰减效果
- [x] `app/src/screens/PlayerScreen.tsx` — 封面+歌词并排布局 + seekTo 集成

### Phase 3b — 播放队列增强 ✅
- [x] `app/src/screens/QueueScreen.tsx` — 编辑模式 + 上下移动 + 删除 + 播放模式切换

### Phase 3c — 后台播放 + 播放模式 ✅
- [x] `app/src/store/playerStore.ts` — Android 后台播放 + 通知栏控制 + 播放模式持久化
- [x] `app/src/store/playerStore.ts` — skipToPrevious 3秒内重置逻辑
- [x] `app/src/store/playerStore.ts` — shuffle 随机下一首

### Phase 3d — 迷你播放条增强 ✅
- [x] `app/src/components/MiniPlayer.tsx` — 进度条 + 下一曲按钮

### Phase 4a — 搜索/收藏/历史联调 ✅
- [x] `app/src/components/FavoriteButton.tsx` — 乐观更新收藏按钮
- [x] `app/src/components/ErrorModal.tsx` — 可复用错误弹窗组件
- [x] `app/src/screens/SearchScreen.tsx` — SectionList 三段分类 (歌曲/艺术家/专辑)
- [x] `app/src/services/api.ts` — 播放历史上报函数 (reportPlayHistory)
- [x] `app/src/store/playerStore.ts` — 播放 30s 或完成时自动上报历史

### Phase 4b — 管理员控制台 ✅
- [x] `app/src/screens/AdminScreen.tsx` — 扫描触发/状态 + 用户审核管理
- [x] `app/src/navigation/RootNavigator.tsx` — 添加 Admin 路由
- [x] `app/src/screens/SettingsScreen.tsx` — 管理员入口按钮

### Phase 5a — 后端歌词格式修复 ✅
- [x] `server/src/services/lyrics.ts` — 新增 syncTextToLRC()，将 iTunes 同步歌词格式转为 LRC
- [x] `server/src/services/metadata.ts` — 处理对象格式歌词（syncText），不再丢弃 iTunes 格式

### Phase 5b — 网络错误重试 ✅
- [x] `app/src/services/api.ts` — Axios 重试拦截器（1s/2s/4s 退避，最多3次，网络错误+5xx）
- [x] `app/src/hooks/useSearch.ts` — AbortController 取消过期搜索请求，防止竞态
- [x] `app/src/screens/PlayerScreen.tsx` — track detail 请求添加 .catch() 错误处理

### Phase 5c — 歌词离线缓存 ✅
- [x] `app/src/services/storage.ts` — MMKV 歌词缓存（最多200条，LRU淘汰）
- [x] `app/src/screens/PlayerScreen.tsx` — 缓存优先策略：先展示缓存，再异步刷新

### Phase 5d — 播放列表持久化 ✅
- [x] `app/src/services/storage.ts` — 队列持久化辅助函数（上限500首）
- [x] `app/src/store/playerStore.ts` — 防抖300ms写入MMKV，启动时恢复队列

### Phase 5e — 封面图组件重构 ✅
- [x] `app/src/components/CoverImage.tsx` — 增强：加载态、错误降级、React.memo、cache:immutable
- [x] 替换7个文件的内联封面代码：PlayerScreen, FolderScreen, SearchScreen, FavoritesScreen, HistoryScreen, TrackItem, MiniPlayer
### Phase 5f - APK/package stability fixes
- [x] `app/android/app/build.gradle` - package JS bundle into APK builds so the app can start without Metro.
- [x] `app/package.json` - add Android release/APK packaging scripts and slider dependency.
- [x] `app/src/types/index.ts` / navigation/player files - fix TypeScript compatibility with navigation and react-native-track-player v4.
- [x] `server/package.json` / `server/scripts/copy-assets.mjs` - copy SQL schema into `dist` during production build.
- [x] `server/src/config.ts` - parse boolean env values such as `SCAN_ON_START=false` correctly.
### Phase 5g - Android startup stability fixes
- [x] `app/android/app/src/main/java/com/streamsound/MainActivity.kt` - align native component name with `app.json` (`StreamSound`).
- [x] `app/index.js` - delay root App import until registration to surface module load errors correctly.
- [x] `app/package.json` - add Metro config dependency and Android bundle verification script.
- [x] `app/src/navigation/RootNavigator.tsx` - wrap navigation with `SafeAreaProvider`.
- [x] `app/src/store/playerStore.ts` / `app/src/hooks/usePlayer.ts` - make player setup idempotent and remove redundant TrackPlayer imports.

### Phase 6 — Code quality & performance optimization (v0.2.0-alpha.2)
- [x] **Backend critical fixes:**
  - Auth plugin: added missing `return` after error responses (handlers no longer fall through)
  - Global error handler + 404 handler with structured error format
  - Replaced sync `statSync`/`existsSync` with async `fs.promises` in stream.ts, covers.ts, admin.ts
  - FTS5 query injection prevention in search.ts (keyword quoted)
  - Covers route: proper Content-Type detection (jpeg/png/webp) + structured 404 response
- [x] **Backend DB optimization:**
  - Scanner: folder cache (Map) eliminates N+1 `getOrCreateFolder` queries
  - `updateFolderCounts`: single GROUP BY query replaces per-folder COUNT queries
  - Replaced `SELECT *` with specific columns (excludes lyrics) in list endpoints
  - New shared utils: `parsePagination()`, `parseId()`, `isValidId()` — deduplicated across 5 route files
- [x] **Frontend performance — usePlayer mass re-render fix:**
  - New `usePlayerActions()` hook: subscribes only to stable action functions, no progress/duration
  - FavoritesScreen, HistoryScreen, SearchScreen switched to `usePlayerActions` (no longer re-render every second)
  - FolderScreen, QueueScreen, MiniPlayer use individual `usePlayerStore` selectors (no progress subscription)
  - `TrackItem` wrapped in `React.memo`
- [x] **Frontend code deduplication:**
  - New `app/src/utils/format.ts`: `formatDuration`, `formatProgress`, `formatRelativeTime`, `getModeIcon`, `getModeLabel`
  - Replaced 6+ duplicate `formatDuration` definitions across screens
  - Replaced duplicate `formatTime`, `getModeIcon`, `getModeLabel` in PlayerScreen/QueueScreen
- [x] **Frontend network fixes:**
  - Retry interceptor now only retries GET/HEAD/OPTIONS (no more duplicate POST/DELETE)
  - PlayerScreen: AbortController prevents race condition on rapid track changes
  - useSearch: debounce timer + AbortController cleanup on unmount
  - FavoritesScreen, HistoryScreen, FolderScreen: AbortController for unmount cleanup

---

## 技术栈

| 组件 | 技术 |
|------|------|
| 后端 | Node.js + Fastify (TypeScript) |
| 数据库 | SQLite (better-sqlite3) |
| 音频元数据 | music-metadata |
| 认证 | JWT (Access 1h + Refresh 30d) |
| 前端 | React Native (TypeScript) |
| 播放器 | react-native-track-player |
| 状态管理 | Zustand |

---

## 启动方式

```bash
cd server
cp .env.example .env  # 配置 JWT_SECRET 和 MUSIC_ROOT
npm install
npm run dev
```

---

## 下一步规划 (Phase 6)

### 功能增强
- [ ] 歌词搜索/匹配优化
- [ ] 均衡器 / 音效设置
- [ ] 跨设备同步播放进度
- [ ] 车载模式 / Android Auto

---

*最后更新: 2026-04-30 (0.2.0-alpha.2 Phase 6 code quality & performance optimization)*

# StreamSound 开发进度

## 当前版本: `0.1.0-alpha.1`

---

## 已完成

### Phase 0 — 项目脚手架 ✅
- [x] 创建 Monorepo 目录结构 (`server/`, `app/`, `docs/`)
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

## 下一步规划 (Phase 5)

### 体验优化
- [ ] 歌词离线缓存
- [ ] 封面图本地缓存
- [ ] 播放列表持久化
- [ ] 网络错误重试机制

### 功能增强
- [ ] 歌词搜索/匹配优化
- [ ] 均衡器 / 音效设置
- [ ] 跨设备同步播放进度
- [ ] 车载模式 / Android Auto

---

*最后更新: 2026-04-29 (Phase 4 完成)*

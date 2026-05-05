# StreamSound

一个自托管的音乐串流服务，支持从本地文件夹扫描音乐库并通过网络串流播放。

## 功能特性

- **音乐库管理** - 自动扫描指定文件夹，提取元数据（标题、艺术家、专辑、时长等）
- **串流播放** - HTTP 串流，支持进度拖拽、上/下一首
- **播放模式** - 顺序播放、随机播放、单曲循环
- **收藏与播放历史** - 记录喜好和播放记录
- **歌词显示** - 支持 LRC 格式歌词同步显示
- **文件夹浏览** - 按目录结构浏览音乐文件
- **搜索** - 全文搜索歌曲、艺术家、专辑
- **迷你播放器** - 底部播放控制栏
- **多端支持** - Android / iOS 移动端 + Web 浏览器端

## 技术栈

### 服务端 (server/)
- Fastify 5（HTTP 框架）
- better-sqlite3（SQLite 数据库，WAL 模式）
- music-metadata（音频元数据提取）
- node-cron（定时扫描调度）
- Zod（配置校验）

### 移动端 (app/)
- React Native 0.76
- react-native-track-player（音频播放）
- Zustand（状态管理）
- @react-navigation/native（导航）
- MMKV（本地持久化）

### Web 端 (web/)
- React 18 + TypeScript
- Vite 6（构建工具）
- React Router 7（路由）
- Zustand（状态管理）
- HTML5 Audio API（音频播放）

## 项目结构

```
StreamSound/
├── server/          # 后端服务
│   └── src/
│       ├── routes/      # API 路由（auth, library, stream, search, favorites, history, admin）
│       ├── services/    # 业务服务（scanner, metadata, lyrics, scheduler）
│       ├── plugins/     # Fastify 插件（auth, cors）
│       ├── db/          # 数据库（schema.sql, client.ts）
│       ├── types/       # 类型定义和错误码
│       └── utils/       # 工具函数
├── app/             # React Native 移动端
│   └── src/
│       ├── screens/     # 页面（Login, Library, Folder, Player, Queue, Search 等）
│       ├── components/  # 组件（MiniPlayer, TrackItem, CoverImage, LyricsView 等）
│       ├── store/       # Zustand 状态管理
│       ├── hooks/       # 自定义 Hooks
│       ├── services/    # API 客户端、存储服务
│       └── theme/       # 主题颜色系统
├── web/             # Web 前端
│   └── src/
│       ├── pages/       # 页面（Login, Library, Folder, Player, Queue, Search 等）
│       ├── components/  # 组件（Layout, MiniPlayer, TrackItem, CoverImage, LyricsView 等）
│       ├── store/       # Zustand 状态管理
│       ├── services/    # API 客户端
│       ├── theme/       # Apple Music 风格主题
│       └── utils/       # 工具函数
└── assets/          # 静态资源
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9
- Android Studio（仅移动端开发需要）

### 1. 启动服务端

```bash
cd server
npm install
# 复制并编辑环境变量配置
cp .env.example .env
# 修改 .env 中的 JWT_SECRET 和 MUSIC_ROOT
npm run dev
```

服务端默认监听 `http://0.0.0.0:3000`，启动后会自动扫描音乐库。

#### 服务端环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `3000` |
| `HOST` | 监听地址 | `0.0.0.0` |
| `MUSIC_ROOT` | 音乐文件根目录 | `/music` |
| `DB_PATH` | 数据库文件路径 | `./data/streamsound.db` |
| `JWT_SECRET` | JWT 签名密钥（必填） | - |
| `JWT_ACCESS_EXPIRES` | Access Token 有效期 | `1h` |
| `JWT_REFRESH_EXPIRES` | Refresh Token 有效期 | `30d` |
| `SCAN_CRON` | 定时扫描 Cron 表达式 | `0 * * * *`（每小时） |
| `SCAN_ON_START` | 启动时是否扫描 | `true` |
| `REQUIRE_APPROVAL` | 新用户是否需要管理员审核 | `false` |

#### 服务端构建

```bash
cd server
npm run build    # TypeScript 编译
npm start        # 运行编译后的代码
```

### 2. 启动 Web 端

```bash
cd web
npm install
npm run dev      # 开发服务器，默认 http://localhost:5173
```

打开浏览器访问 `http://localhost:5173`，在登录页面输入服务端地址（如 `http://192.168.x.x:3000`）即可连接。

#### Web 端构建

```bash
cd web
npm run build    # 生产构建，输出到 dist/
npm run preview  # 预览生产构建
```

#### Web 端特性

- Apple Music 风格 UI，支持深色/浅色主题切换
- 响应式设计：桌面端侧边栏导航，移动端底部 Tab 导航
- HTML5 Audio 播放器，支持进度拖拽、播放模式切换、音量控制
- LRC 歌词同步滚动显示
- 搜索高亮、收藏管理、播放历史

### 3. 启动移动端

```bash
cd app
npm install
npm run android   # 连接 Android 设备或启动模拟器
```

#### 构建 APK

```bash
cd app
npm run apk:debug    # Debug 版本
npm run apk:release  # Release 版本
```

#### 移动端配置

首次打开 App 时需要输入服务端地址（如 `http://192.168.x.x:3000`），后续可在设置页面修改。

## API 接口

服务端提供 RESTful API，详细文档参见 [streamsound_api_spec.md](./streamsound_api_spec.md)。

| 模块 | 端点 | 说明 |
|------|------|------|
| 认证 | `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh` | 注册、登录、Token 刷新 |
| 音乐库 | `GET /library/folders`, `GET /library/folders/:id/tracks`, `GET /library/tracks/:id` | 文件夹浏览、曲目列表、曲目详情 |
| 音频流 | `GET /stream/:id` | HTTP Range 断点续传 |
| 封面 | `GET /covers/:id` | 封面图片 |
| 搜索 | `GET /search?q=` | FTS5 全文搜索 |
| 收藏 | `GET /favorites`, `POST /favorites/:id`, `DELETE /favorites/:id` | 收藏管理 |
| 历史 | `GET /history`, `POST /history/:id` | 播放历史 |
| 管理员 | `POST /admin/scan`, `GET /admin/scan/status`, `GET /admin/users` | 扫描、用户管理 |

## 版本

| 模块 | 版本 |
|------|------|
| 服务端 | `0.2.0-alpha.6` |
| 移动端 | `0.2.0-alpha.13` |
| Web 端 | `0.1.0` |

## 许可证

MIT

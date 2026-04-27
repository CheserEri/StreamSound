# StreamSound · 系统架构文档

---

## 1. 整体架构概览

```
┌─────────────────────────────────────────────────┐
│                  客户端层                         │
│                                                  │
│   React Native App（Android / iOS）              │
│   TypeScript · react-native-track-player         │
└──────────────┬──────────────────────────────────┘
               │ HTTP/HTTPS  (局域网 / IPv6)
               │ REST API + Range 音频流
┌──────────────▼──────────────────────────────────┐
│                  服务端层                         │
│                                                  │
│   Node.js + Fastify（TypeScript）                │
│   ┌────────────┐  ┌──────────┐  ┌─────────────┐ │
│   │  API 路由  │  │  音频流  │  │  扫描任务   │ │
│   │  /auth     │  │  /stream │  │  定时/手动  │ │
│   │  /library  │  │  Range   │  │  music-meta │ │
│   │  /search   │  │  支持    │  │  data       │ │
│   └─────┬──────┘  └──────────┘  └──────┬──────┘ │
│         │                              │         │
│   ┌─────▼──────────────────────────────▼──────┐  │
│   │              数据访问层                    │  │
│   │         better-sqlite3 (同步)              │  │
│   └────────────────────┬───────────────────────┘  │
└────────────────────────┼────────────────────────┘
                         │
┌────────────────────────▼────────────────────────┐
│                  数据持久层                       │
│                                                  │
36→│   SQLite 数据库文件          本地音乐文件系统     │
37→│   ~/streamsound/data.db         /music/**/*          │
└─────────────────────────────────────────────────┘
```

---

## 2. 目录结构

### 2.1 后端（`streamsound-server`）

```
streamsound-server/
├── src/
│   ├── index.ts                 # 入口，Fastify 实例初始化
│   ├── config.ts                # 环境变量读取与校验
│   ├── db/
│   │   ├── client.ts            # better-sqlite3 连接单例
│   │   ├── schema.sql           # 建表 SQL
│   │   └── migrations/          # 数据库迁移脚本
│   ├── routes/
│   │   ├── auth.ts              # 注册 / 登录 / 刷新 Token
│   │   ├── library.ts           # 文件夹列表 / 曲目详情
│   │   ├── stream.ts            # 音频流（Range 支持）
│   │   ├── search.ts            # 模糊搜索
│   │   ├── favorites.ts         # 收藏增删查
│   │   ├── history.ts           # 播放历史
│   │   └── admin.ts             # 管理员接口
│   ├── services/
│   │   ├── scanner.ts           # 音乐库扫描主逻辑
│   │   ├── metadata.ts          # music-metadata 元数据提取
│   │   ├── lyrics.ts            # 歌词解析（LRC / 内嵌）
│   │   └── scheduler.ts         # 定时扫描任务
│   ├── plugins/
│   │   ├── auth.ts              # JWT 鉴权 Fastify 插件
│   │   └── cors.ts              # CORS 配置
│   └── types/
│       └── index.ts             # 共享 TypeScript 类型定义
├── .env.example                 # 环境变量模板
├── tsconfig.json
└── package.json
```

### 2.2 前端（`streamsound-app`）

```
streamsound-app/
├── src/
│   ├── App.tsx                  # 根组件，导航初始化
│   ├── navigation/
│   │   └── RootNavigator.tsx    # React Navigation 路由配置
│   ├── screens/
│   │   ├── LoginScreen.tsx
│   │   ├── LibraryScreen.tsx    # 音乐库首页（文件夹列表）
│   │   ├── FolderScreen.tsx     # 文件夹详情（曲目列表）
│   │   ├── PlayerScreen.tsx     # 全屏播放页
│   │   ├── QueueScreen.tsx      # 播放队列
│   │   ├── SearchScreen.tsx
│   │   ├── FavoritesScreen.tsx
│   │   ├── HistoryScreen.tsx
│   │   └── SettingsScreen.tsx
│   ├── components/
│   │   ├── MiniPlayer.tsx       # 底部迷你播放条
│   │   ├── TrackItem.tsx        # 曲目列表项
│   │   ├── LyricsView.tsx       # 歌词滚动组件
│   │   └── CoverImage.tsx       # 封面图（带缓存）
│   ├── store/
│   │   ├── index.ts             # Zustand store 入口
│   │   ├── playerStore.ts       # 播放状态（队列、模式、进度）
│   │   ├── authStore.ts         # 登录态、Token 管理
│   │   └── settingsStore.ts     # 用户设置（服务器地址等）
│   ├── services/
│   │   ├── api.ts               # Axios 实例 + 拦截器（Token 刷新）
│   │   ├── player.ts            # react-native-track-player 封装
│   │   └── storage.ts           # MMKV 本地持久化封装
│   ├── hooks/
│   │   ├── usePlayer.ts         # 播放器状态 hook
│   │   ├── useSearch.ts         # 搜索防抖 hook
│   │   └── useLyrics.ts         # 歌词同步 hook
│   └── types/
│       └── index.ts             # 共享类型定义
├── tsconfig.json
└── package.json
```

---

## 3. 数据库设计

### 3.1 Schema

```sql
-- 用户表
CREATE TABLE users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    username    TEXT    NOT NULL UNIQUE,
    password    TEXT    NOT NULL,           -- bcrypt hash
    role        TEXT    NOT NULL DEFAULT 'user', -- 'user' | 'admin'
    approved    INTEGER NOT NULL DEFAULT 1, -- 0: 待审核, 1: 已激活
    created_at  INTEGER NOT NULL            -- Unix timestamp
);

-- 音乐文件夹表
CREATE TABLE folders (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    path        TEXT    NOT NULL UNIQUE,    -- 绝对路径
    parent_id   INTEGER REFERENCES folders(id),
    track_count INTEGER NOT NULL DEFAULT 0
);

-- 曲目表
CREATE TABLE tracks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    path        TEXT    NOT NULL UNIQUE,    -- 绝对路径，唯一标识
    folder_id   INTEGER NOT NULL REFERENCES folders(id),
    title       TEXT    NOT NULL,
    artist      TEXT,
    album       TEXT,
    duration    INTEGER,                   -- 秒
    bitrate     INTEGER,                   -- kbps
    sample_rate INTEGER,
    cover_path  TEXT,                      -- 封面缓存路径（可为空，用内嵌流）
    has_lyrics  INTEGER NOT NULL DEFAULT 0,
    lyrics      TEXT,                      -- LRC 原文
    file_size   INTEGER,
    mime_type   TEXT,
    scanned_at  INTEGER NOT NULL           -- 最后扫描时间
);

-- 收藏表
CREATE TABLE favorites (
    user_id     INTEGER NOT NULL REFERENCES users(id),
    track_id    INTEGER NOT NULL REFERENCES tracks(id),
    created_at  INTEGER NOT NULL,
    PRIMARY KEY (user_id, track_id)
);

-- 播放历史表
CREATE TABLE play_history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id     INTEGER NOT NULL REFERENCES users(id),
    track_id    INTEGER NOT NULL REFERENCES tracks(id),
    played_at   INTEGER NOT NULL           -- Unix timestamp
);

-- 索引
CREATE INDEX idx_tracks_folder    ON tracks(folder_id);
CREATE INDEX idx_tracks_title     ON tracks(title);
CREATE INDEX idx_tracks_artist    ON tracks(artist);
CREATE INDEX idx_history_user     ON play_history(user_id, played_at DESC);
CREATE INDEX idx_favorites_user   ON favorites(user_id, created_at DESC);
```

### 3.2 全文搜索

SQLite 内置 FTS5 扩展，搜索性能优于 `LIKE` 查询：

```sql
-- 全文搜索虚拟表
CREATE VIRTUAL TABLE tracks_fts USING fts5(
    title,
    artist,
    album,
    content='tracks',
    content_rowid='id'
);

-- 在扫描入库时同步写入 FTS
INSERT INTO tracks_fts(rowid, title, artist, album)
    VALUES (new_track_id, title, artist, album);
```

---

## 4. 核心模块设计

### 4.1 认证流程

```
App                         Server
 │                             │
 ├─── POST /auth/login ───────►│
 │    { username, password }   │  验证密码（bcrypt.compare）
 │                             │  生成 Access Token（1h）
 │                             │  生成 Refresh Token（30d）
 │◄── { accessToken,          │
 │      refreshToken } ────────┤
 │                             │
 │  [Token 存入 MMKV]          │
 │                             │
 ├─── 业务请求（附 Bearer）────►│
 │    Authorization: Bearer xx │  验证 JWT 签名与过期
 │◄── 响应数据 ────────────────┤
 │                             │
 │  [Access Token 过期]        │
 ├─── POST /auth/refresh ─────►│
 │    { refreshToken }         │  验证 Refresh Token
 │◄── { accessToken } ─────────┤  下发新 Access Token
```

Axios 拦截器自动处理 Token 过期：响应 401 时静默刷新，刷新成功后重放原请求，刷新失败则跳转登录页。

### 4.2 音频流传输

服务端通过 HTTP Range 请求实现可寻址流式传输：

```
App                              Server
 │                                  │
 ├─── GET /stream/:id ─────────────►│
 │    Range: bytes=0-               │  读取文件大小
 │                                  │  返回 206 Partial Content
 │◄── Content-Range: bytes 0-N/Total│
 │    Content-Type: audio/mpeg      │
 │    [音频数据流] ─────────────────┤
 │                                  │
 │  [用户拖动进度条到 60%]           │
 ├─── GET /stream/:id ─────────────►│
 │    Range: bytes=M-               │  直接定位到文件偏移量 M
 │◄── 206 + 数据流 ─────────────────┤
```

react-native-track-player 原生支持 Range 请求，无需额外处理。

### 4.3 音乐库扫描流程

```
触发扫描（启动 / 定时 / 手动）
        │
        ▼
递归遍历 /music 目录树
        │
        ▼
过滤音频文件（按扩展名）
        │
        ├── 文件路径已在 tracks 表中？
        │       │
        │     是 └── 文件 mtime 未变 → 跳过（增量扫描）
        │             文件 mtime 已变 → 重新提取元数据并更新
        │
        └── 新文件 → music-metadata 提取元数据
                        │
                        ▼
                  写入 tracks 表 + tracks_fts
                  更新 folders 表（不存在则创建）
                  更新 folders.track_count

扫描完成 → 检测已删除文件（路径不再存在）→ 从数据库移除
```

### 4.4 状态管理（前端）

前端使用 Zustand 管理全局状态，分三个独立 store：

```
authStore
├── user: User | null
├── accessToken: string | null
├── login(username, password) → Promise
├── logout()
└── refreshToken() → Promise

playerStore
├── queue: Track[]
├── currentIndex: number
├── mode: 'sequential' | 'shuffle' | 'repeat'
├── isPlaying: boolean
├── progress: number
├── setQueue(tracks, startIndex)
├── appendToQueue(tracks)
├── toggleMode()
└── syncWithTrackPlayer()   ← 与 RNTP 状态同步

settingsStore
├── serverUrl: string
├── lyricsSize: 'sm' | 'md' | 'lg'
├── theme: 'light' | 'dark'
└── setServerUrl(url)
```

---

## 5. 关键依赖

### 5.1 后端

| 包名 | 版本要求 | 用途 |
|------|---------|------|
| fastify | ^5.x | HTTP 框架 |
| @fastify/jwt | ^9.x | JWT 鉴权插件 |
| @fastify/cors | ^10.x | CORS 处理 |
| @fastify/static | ^8.x | 静态文件（封面图） |
| better-sqlite3 | ^11.x | SQLite 驱动（同步） |
| music-metadata | ^10.x | 音频元数据解析 |
| bcrypt | ^5.x | 密码哈希 |
| node-cron | ^3.x | 定时扫描任务 |
| zod | ^3.x | 请求参数校验 |
| tsx | ^4.x | TypeScript 直接运行（开发） |

### 5.2 前端

| 包名 | 版本要求 | 用途 |
|------|---------|------|
| react-native | ^0.76.x | 框架本体 |
| react-native-track-player | ^4.x | 音频播放 + 后台 + 通知栏 |
| @react-navigation/native | ^7.x | 页面导航 |
| zustand | ^5.x | 状态管理 |
| axios | ^1.x | HTTP 客户端 |
| react-native-mmkv | ^3.x | 高性能本地持久化 |
| react-native-fast-image | ^8.x | 封面图缓存加载 |
| @shopify/flash-list | ^1.x | 高性能长列表 |

---

## 6. 环境变量（后端 `.env`）

```env
# 服务器
PORT=3000
HOST=0.0.0.0

# 音乐库
MUSIC_ROOT=/music

# 数据库
DB_PATH=/var/lib/streamsound/data.db

# JWT
JWT_SECRET=your-secret-key-change-this
JWT_ACCESS_EXPIRES=1h
JWT_REFRESH_EXPIRES=30d

# 扫描
SCAN_CRON=0 * * * *          # 每小时扫描一次
SCAN_ON_START=true            # 启动时全量扫描

# 注册审核（true = 新用户需管理员审批）
REQUIRE_APPROVAL=false
```

---

## 7. 部署说明（宿主机直跑）

### 7.1 环境要求

- Node.js >= 20 LTS
- Ubuntu 20.04 LTS 及以上
- 音乐目录读权限

### 7.2 启动步骤

```bash
# 1. 安装依赖
cd harmonia-server
npm install

# 2. 编译 TypeScript
npm run build

# 3. 配置环境变量
cp .env.example .env
vi .env   # 修改 JWT_SECRET 和 MUSIC_ROOT

# 4. 初始化数据库（首次运行自动建表）
npm run start
```

### 7.3 使用 systemd 保持后台运行

创建 `/etc/systemd/system/streamsound.service`：

```ini
[Unit]
Description=StreamSound Music Server
After=network.target

[Service]
Type=simple
User=streamsound
WorkingDirectory=/opt/streamsound-server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=/opt/streamsound-server/.env

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable streamsound
sudo systemctl start streamsound
sudo systemctl status streamsound
```

### 7.4 防火墙

```bash
# 开放端口（局域网访问）
sudo ufw allow 3000/tcp

# IPv6 通常随 IPv4 规则一并生效，如需单独放行：
sudo ufw allow in on eth0 to any port 3000 proto tcp
```

---

*Harmonia · 系统架构文档 · 内部文档*

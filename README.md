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
- **迷你播放器** - 类似网易云音乐的底部播放控制栏

## 技术栈

### 客户端 (app/)
- React Native 0.76
- react-native-track-player（音频播放）
- Zustand（状态管理）
- @react-navigation/native（导航）

### 服务端 (server/)
- Fastify（HTTP 框架）
- better-sqlite3（数据库）
- music-metadata（音频元数据提取）

## 快速开始

### 服务端

```bash
cd server
npm install
# 配置 .env（参考 .env.example）
npm run dev
```

### 客户端

```bash
cd app
npm install
npm run android
```

### 构建 APK

```bash
cd app
npm run apk:debug   # Debug 版本
npm run apk:release # Release 版本
```

## 配置

服务端通过 `.env` 文件配置：

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `PORT` | 监听端口 | `3000` |
| `MUSIC_DIR` | 音乐文件目录 | `./music` |
| `JWT_SECRET` | JWT 密钥 | - |
| `SCAN_ON_START` | 启动时扫描 | `true` |

## 版本

当前版本：`0.2.0-alpha.5`

## 许可证

MIT

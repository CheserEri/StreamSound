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
- **系统级媒体控制** - 通知栏、锁屏、蓝牙耳机控制
- **音频缓存** - LRU 淘汰策略的本地音频缓存

## 技术栈

### Compose 客户端 (composeApp/) — 推荐

- Kotlin Multiplatform + Jetpack Compose Multiplatform
- [Salt UI](https://github.com/Moriafly/SaltUI) 组件库
- Media3 ExoPlayer（音频播放 + MediaSession）
- Navigation 3（导航）
- Ktor Client（网络请求）
- Coil（图片加载）
- multiplatform-settings（本地存储）

### React Native 客户端 (app/)

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

### Compose 客户端（推荐）

用 Android Studio 打开项目根目录，运行 `composeApp` 模块。

```bash
# 或命令行构建
./gradlew :composeApp:assembleDebug
```

### React Native 客户端

```bash
cd app
npm install
npm run android
```

## 项目结构

```
StreamSound/
├── composeApp/          # Compose Multiplatform 客户端（Kotlin）
│   ├── src/commonMain/  # 跨平台代码
│   │   ├── model/       # 数据模型
│   │   ├── navigation/  # 路由定义
│   │   ├── network/     # API 客户端
│   │   ├── playback/    # 播放器接口
│   │   ├── service/     # 本地存储
│   │   ├── store/       # 状态管理 (StateFlow)
│   │   ├── ui/component/# 可复用组件
│   │   ├── ui/screen/   # 页面
│   │   └── util/        # 工具函数
│   └── src/androidMain/ # Android 平台代码
│       └── playback/    # Media3 播放服务
├── app/                 # React Native 客户端
├── server/              # Node.js 服务端
└── gradle/              # Gradle 版本目录
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

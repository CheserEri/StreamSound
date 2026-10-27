# StreamSound（流声）

自托管音乐串流系统：服务端扫描并索引本地音乐，桌面客户端通过 HTTP 串流播放。桌面端完整内置了莱茵生命终端风格的 Qt/RHI 界面，不依赖任何外部 UI 仓库或在线音乐平台。

## 功能

- 本地音乐扫描与元数据解析（标题、艺术家、专辑、时长、封面、内嵌歌词）
- 全文搜索（SQLite FTS5）、文件夹浏览、收藏、播放历史
- HTTP 音频串流，支持 `Range` 断点续播、拖动进度
- 封面提取与主色计算、LRC 歌词同步
- 局域网免登录：桌面端只需配置一次服务器地址，服务端接口不做鉴权
- 桌面端四栏目：搜索曲目、喜欢的歌曲、文件夹、播放历史

## 架构

```text
┌──────────────────────────────────────────────┐
│ 桌面端 desktop/（Qt 6.12 + C++）              │
│  Native HUD + RHI 3D 场景 + QML 输入层        │
│        │  stdin/stdout 逐行 JSON              │
│  MusicBridge/（Node 内置模块，无第三方依赖）   │
│        │  HTTP + 本机媒体代理                 │
└────────┼─────────────────────────────────────┘
         │
┌────────▼─────────────────────────────────────┐
│ 服务端 server/（Node + Fastify + SQLite）     │
│  扫描 / 检索 / 收藏 / 历史 / 音频流 / 封面     │
└──────────────────────────────────────────────┘
```

服务端不做鉴权，局域网内直接访问。音频与封面经桥接进程在 `127.0.0.1` 随机端口启动的本地代理转发，路径内含随机 secret 并透传 `Range`，播放器只访问回环地址，不直接暴露服务器地址。

## 目录结构

```text
StreamSound/
├── server/                 # Node.js + Fastify + better-sqlite3 服务端
│   ├── src/
│   │   ├── routes/         # library / search / stream / covers / scan ...
│   │   ├── services/       # 扫描、元数据、歌词、封面配色
│   │   └── db/             # Schema、迁移、SQLite 客户端
│   └── scripts/
├── desktop/                # Qt 桌面客户端（UI 完全封装在本仓库）
│   ├── Qt/src/             # C++：HUD、RHI 场景、业务模型、播放器
│   ├── Qt/qml/             # QML：文本输入与弹窗层
│   ├── MusicBridge/        # Node 桥接：streamsound.cjs + 本地媒体代理
│   ├── Assets/             # 字体、模型、着色资源
│   ├── Resources/          # 场景槽位与启动字标
│   └── scripts/            # 资源导出、打包、安装器
├── docs/
│   ├── technical/          # 架构、API、部署、错误处理
│   └── plan/               # 路线图、桌面端方案与任务清单
└── LICENSE
```

## 快速开始

### 1. 服务端

要求 Node.js 20+。

```powershell
cd server
Copy-Item .env.example .env
# 编辑 .env：至少设置 MUSIC_ROOT、DB_PATH
npm install
npm run dev
```

桌面端默认连接 `http://<server-ip>:8080`，可通过设置页「服务器地址」或环境变量 `STREAMSOUND_SERVER` 改成自己的服务端。完整环境变量见 [部署文档](docs/technical/deployment.md)。

### 2. 桌面端（Windows）

要求 Qt 6.12 `msvc2022_64`、MSVC 2022/2026 工具集、CMake 3.24+、Python 3、Node.js（开发期桥接回退系统 `node`）。

```powershell
cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 `
  -DCMAKE_PREFIX_PATH="<Qt 6.12 msvc2022_64 路径>" -DRHINE_ENABLE_FIDELITYFX=OFF
cmake --build desktop/build --config Release
```

构建后需部署 Qt 运行库与运行资源（否则会报缺少 `Qt6Widgets.dll`）：

```powershell
cd desktop
python scripts/export-assets.py
python scripts/bake-archive-lighting.py
<Qt>\bin\windeployqt.exe --release --qmldir Qt\qml build\Release\RhineMusicDatabase.exe
```

将 `desktop/output/resources` 复制为 `desktop/build/Release/resources` 后即可直接运行：

```powershell
desktop\build\Release\RhineMusicDatabase.exe
```

服务器地址可通过偏好项 `streamsound-server` 或环境变量 `STREAMSOUND_SERVER` 覆盖。完整打包由 `node desktop/scripts/build.cjs` 负责。

## 文档

- [系统架构](docs/technical/architecture.md)
- [HTTP API](docs/technical/api.md)
- [部署与发布](docs/technical/deployment.md)
- [错误处理](docs/technical/error-handling.md)
- [路线图](docs/plan/roadmap.md)
- [桌面端方案](docs/plan/desktop-client.md)
- [任务清单](docs/plan/desktop-tasks.md)

## 许可

- 服务端与仓库根目录：[LICENSE](LICENSE)（MPL-2.0）
- 桌面端界面基于 Rhine Music Database（MIT），许可与第三方声明见 [desktop/LICENSE](desktop/LICENSE) 与 [desktop/NOTICE](desktop/NOTICE)

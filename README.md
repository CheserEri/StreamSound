# StreamSound（流声）

自托管音乐串流系统：服务端扫描并索引本地音乐，桌面客户端通过 HTTP 串流播放。桌面端完整内置了莱茵生命终端风格的 Qt/RHI 界面，不依赖任何外部 UI 仓库或在线音乐平台。

## 从这里开始

日常使用只需要根目录的两个入口，不必进入 `desktop/` 或 `server/`：

| 想做什么 | 操作 |
| --- | --- |
| 打开客户端 | 双击 `start.cmd`：先确认 Ubuntu 服务端在线（必要时 SSH 拉起），再启动桌面端 |
| 更新/重启服务端 | 双击 `deploy.cmd`：本地编译 → 上传 `dist` → 依赖变化时远程安装 → 重启 → 健康检查 |
| 只确认服务端 | `powershell -ExecutionPolicy Bypass -File tools\start.ps1 -ServerOnly` |
| 查看远程状态 | `python tools\remote.py info` |

服务器地址、SSH 账号与音乐目录都在 `tools/deploy.env` 中配置（含密码，已被 gitignore），示例值见模板：

```powershell
Copy-Item tools\deploy.env.example tools\deploy.env   # 新环境首次使用
python -m pip install paramiko                       # SSH 助手依赖
```

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
├── start.cmd                 入口①：确认服务端在线并打开客户端
├── deploy.cmd                入口②：部署服务端到 Ubuntu 并重启
├── tools/                    本机运维脚本（配置、SSH 助手、启动/部署实现）
│   ├── deploy.env            目标主机、账号、路径（gitignore，自行填写）
│   ├── deploy.env.example    配置模板
│   ├── remote.py             SSH 执行 / 上传助手
│   ├── config.ps1            配置读取与健康检查
│   ├── start.ps1             start.cmd 的实现
│   └── deploy.ps1            deploy.cmd 的实现
├── server/                   服务端：Node + Fastify + SQLite
│   ├── src/                  路由、扫描/元数据服务、数据库
│   ├── scripts/              构建时拷贝 schema 等资源
│   ├── .env                  本机开发配置（gitignore）
│   └── dist/                 编译产物（gitignore，由 deploy.cmd 上传）
├── desktop/                  桌面端：Qt 6.12 + C++ + QML
│   ├── Qt/                   C++ 业务/HUD/RHI 场景与 QML 输入层
│   ├── MusicBridge/          Node 桥接、本地媒体代理
│   ├── build/Release/        可直接运行的成品（start.cmd 启动这里）
│   ├── output/               导出的运行资源，复制到 build/Release/resources
│   ├── Assets/ Resources/    字体、模型、场景槽位、启动字标
│   ├── vendor/ third_party/  FFmpeg、Node、TagLib、DXC 等依赖
│   └── scripts/              资源导出、打包、安装器
├── docs/                     架构、API、部署、错误处理
├── .toolchain/               本地测试工具链与测试音乐（gitignore）
└── .screenshots/             界面截图与调试产物
```

日常只需要记住：**根目录两个 `.cmd` 是入口，`server/` 是服务端源码，`desktop/build/Release/` 是客户端成品**；其余目录大多是构建依赖、生成物或文档，不需要进入。

## 快速开始

> 日常使用直接双击 `start.cmd` 即可。本节仅用于开发调试或首次重新构建。

### 1. 服务端

正式实例运行在 Ubuntu（自定目录，systemd 服务名默认 `streamsound`）。改完 `server/src` 后执行根目录 `deploy.cmd` 即可，无需手动登录服务器。

仅在本机调试时：

```powershell
cd server
Copy-Item .env.example .env
# 编辑 .env：至少设置 MUSIC_ROOT、DB_PATH（本机可指向 .toolchain/testdata/music）
npm install
npm run dev
```

桌面端默认连接 `http://127.0.0.1:8080`；首次在设置页填写服务器地址，或由 `start.cmd` 从 `tools/deploy.env` 注入 `STREAMSOUND_SERVER`。完整环境变量见 [部署文档](docs/technical/deployment.md)。

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

将 `desktop/output/resources` 复制为 `desktop/build/Release/resources` 后即可运行；日常直接双击根目录 `start.cmd`：

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

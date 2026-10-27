# StreamSound 系统架构

## 1. 总览

StreamSound 由两个可独立运行的部分组成：

| 部分 | 位置 | 职责 |
| --- | --- | --- |
| 服务端 | `server/` | 扫描音乐目录、维护 SQLite 索引、搜索、收藏/历史、音频流、封面与歌词（无鉴权） |
| 桌面端 | `desktop/` | Qt 6 原生界面与播放器；通过桥接进程访问服务端 HTTP API |

桌面端不使用在线音乐平台的 SDK 或接口，也不依赖外部 UI 仓库。界面代码、场景资源、字体与桥接逻辑全部位于 `desktop/` 内。

```text
┌────────────────────────────── desktop/ ──────────────────────────────┐
│  Native HUD (C++/QPainter)      RHI 3D 场景 (Qt RHI)                 │
│  MusicLibrary / MusicPlayer     QML Overlay（设置项输入）            │
│         │ QProcess stdin/stdout（逐行 JSON）                          │
│  MusicBridge（Node，内置 http/crypto/readline）                       │
│         ├─ /native/streamsound/*  业务调用                            │
│         └─ 127.0.0.1:<random>/<secret>/stream|cover  媒体代理         │
└────────────────────────────────┬─────────────────────────────────────┘
                                 │ HTTP / JSON / Range
┌────────────────────────────────▼─────────────────────────────────────┐
│  Fastify 5 + TypeScript                                              │
│  routes: health / library / search / favorites / history / stream /  │
│          covers / scan                                               │
│  services: scanner / metadata / lyrics / colorExtractor / scheduler  │
│  SQLite（better-sqlite3，WAL + FTS5）                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## 2. 服务端

### 2.1 技术栈

- Node.js 20+，Fastify 5，TypeScript
- better-sqlite3（WAL 模式，FTS5 全文索引）
- 无鉴权：不引入用户体系，接口仅在局域网内开放
- music-metadata（标签解析）、sharp（封面处理与配色）、node-cron（定时扫描）

### 2.2 模块

```text
server/src/
├── index.ts              # 启动、注册插件与路由
├── config.ts             # 环境变量与默认值
├── db/                   # schema.sql、迁移、连接
├── plugins/              # cors
├── routes/               # health、library、search、favorites、history、
│                         # stream、covers、scan
├── services/             # scanner、metadata、lyrics、colorExtractor、scheduler
├── types/                # 错误码与共享类型
└── utils/                # 分页、参数解析
```

### 2.3 数据模型

- `songs`：文件路径、标题、艺术家、专辑、时长、格式、封面、歌词、主色
- `favorites`：全局收藏关系（仅记录 `track_id`，无用户维度）
- `history`：全局播放记录（含播放时间）
- FTS5 虚表：由 `songs` 同步，支持中英文分词检索

### 2.4 音频与封面

- `GET /stream/:id` 返回音频流，支持 `Range`（206 Partial Content）
- `GET /covers/:id` 返回提取出的封面，带缓存与 ETag
- 扫描时解析内嵌封面、LRC 歌词与主色，落库后由客户端按需读取

## 3. 桌面端

### 3.1 技术栈

- Qt 6.12（Core / Gui / Qml / Quick / Network / Concurrent / Multimedia / ShaderTools）
- C++20；原生自绘 HUD + Qt RHI 3D 场景；少量 QML 仅用于输入层
- TagLib（标签读取）、utfcpp（编码转换）
- Node.js 桥接进程（仅使用内置模块，无 npm 依赖）

### 3.2 关键模块

| 文件 | 职责 |
| --- | --- |
| `Qt/src/NativeHud*.cpp` | HUD 绘制、列表、弹窗、输入与命中测试 |
| `Qt/src/NativeScene*.cpp`、`RhiScene.cpp` | 3D 档案场景、相机、后处理 |
| `Qt/src/MusicLibrary.cpp`、`MusicAccount.cpp`、`MusicMutation.cpp` | 栏目、分页、收藏与历史 |
| `Qt/src/MusicPlayer.cpp`、`AudioPlayer.cpp` | 播放状态机、队列、进度与音量 |
| `Qt/src/Host.cpp`、`MusicApi.cpp` | 桥接子进程管理、provider 路由、请求缓存、服务器地址偏好 |
| `Qt/qml/Overlay.qml` | 服务器地址输入框与回车提交 |
| `MusicBridge/streamsound.cjs` | 协议实现、媒体代理 |

### 3.3 桥接协议

- 父进程通过 `QProcess` 启动 `node worker.cjs`，工作目录为应用资源中的 `MusicBridge`
- 每行一个 JSON 请求：`{"id": "...", "op": "...", "args": {...}}`
- 每行一个 JSON 响应：`{"id": "...", "body": {"code": 200, "value": ...}}`
- `body.code` 为 HTTP 语义状态码；网络失败由桥接映射为 503，不存在 401 重试
- 响应不携带 `cookies`；客户端不持久化任何凭据，仅保存服务器地址偏好

### 3.4 操作映射

| 桥接操作 | 服务端接口 |
| --- | --- |
| `server` | `GET /health`（连通性探测，返回服务器地址） |
| `search` | `/search` |
| `songs` / `detail` | `/library/tracks/:id` |
| `likedIDs` / `likedSongs` | `/favorites` |
| `folders` | `/library/folders` |
| `history` / `report` | `/history`、`POST /history/:id` |
| `playback` | `/stream/:id`（经本地代理） |
| `lyrics` / `wiki` | `/library/tracks/:id` 的 `lyrics` 字段 |
| `like` | `/favorites/:id`（重复收藏的 409 视为成功） |
| `preview` | `/covers/:id`（经本地代理） |

桥接返回的是已解析的条目对象，而不是服务端原始 JSON：

```js
{
  kind, id, title, artist, artists, albumID, album, cover,
  duration, trackCount, description, date, provider, key
}
```

### 3.5 栏目映射

服务端没有歌手/专辑/歌单/推荐概念，桌面端将四类可用内容映射到场景栏目：

| 栏目 | 数据来源 |
| --- | --- |
| 搜索曲目 | `/search` |
| 喜欢的歌曲 | `/favorites` |
| 文件夹 | `/library/folders` + `/library/tracks` |
| 播放历史 | `/history` |
| 不可用 | 歌手 / 专辑 / 推荐 / 排行榜（仅占位提示） |

## 4. 安全边界

- 服务端无鉴权，客户端不持有任何令牌或 Cookie
- 桌面端只保存一个服务器地址偏好 `streamsound-server`
- 媒体代理监听 `127.0.0.1:0`（随机端口），URL 路径含随机 secret；代理不注入 `Authorization`，仅透传 `Range`
- 播放器与封面加载器只访问回环地址
- 安全边界完全依赖可信局域网；部署时用防火墙限制来源（如 `ufw allow 8080/tcp`），必要时叠加反向代理或 VPN

## 5. 构建与运行

- 服务端：`npm run dev`（tsx watch）或 `npm run build && npm start`
- 桌面端：CMake 配置 + 构建 + `windeployqt` + 资源导出；完整发布包由 `desktop/scripts/build.cjs` 生成
- FidelityFX / FSR3 为可选依赖，默认通过 `-DRHINE_ENABLE_FIDELITYFX=OFF` 关闭；子模块未初始化不影响构建

## 6. UI 归属

- 全部界面源码（C++ HUD、RHI 场景、QML 输入层）、着色器、字体、模型与场景数据均位于 `desktop/`
- 运行时不加载 `Rhine-Music-Database` 或任何外部资源目录
- 上游 Rhine Music Database 的 MIT 许可与第三方声明保留在 `desktop/LICENSE`、`desktop/NOTICE`

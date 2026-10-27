# StreamSound 桌面客户端（路线 A）实施规格

## 1. 目标

以 Rhine-Music-Database（Qt 6.12 / C++ / RHI）为外壳，保留其 3D 场景与自绘 HUD，把数据层整体替换为 StreamSound 自建 HTTP 服务，交互按“本地音乐播放器”逻辑组织。

首版范围（曲库核心版）：

| 能力 | 说明 |
| --- | --- |
| 服务器 | 服务器地址配置与连通性探测 |
| 曲库 | 文件夹列表、文件夹内曲目、曲目详情 |
| 搜索 | 服务端 FTS5 搜索 |
| 收藏 | 收藏列表、加/取消收藏 |
| 历史 | 播放历史列表、播放上报 |
| 播放 | 队列、上一首/下一首、进度、音量、暂停恢复 |
| 歌词 | 内嵌/LRC 歌词解析与滚动 |
| 封面 | 曲目封面加载与主色 |

非目标（首版不做）：歌手页、专辑页、歌单编辑、每日推荐、排行榜、评论、云盘、下载、多音质切换。

## 2. 现状事实（已核实）

- Rhine 的界面不是 QML：`desktop/Qt/src` 下无任何 `.qml`/`.js`，界面由 `NativeHud*.cpp`（自绘 HUD）+ `RhiScene.cpp`（RHI 3D）完成，因此只能整工程 Fork，无法只搬 UI。
- 数据入口只有两个：
  - `MusicApi::call(op, args)` → 路由 `/native/<provider>/<op>`，参数 `{args: [...]}`，响应 `body.code` + `body.value`（`desktop/Qt/src/MusicApi.cpp:58-67`）。
  - `MusicApi::request(route, params)` → NetEase 风格路由，非 netease provider 加 `/<provider>` 前缀（`MusicApi.cpp:69-81`）。
- `MusicData::parse` 要求 `id` 为纯数字字符串、`name` 为字符串，并消费 NetEase 结构（`ar`/`al`/`dt` 等）（`desktop/Qt/src/MusicData.cpp:39-60`）。
- `Host::routeProvider` 对 `/native/xxx/...` 已能通用返回 `xxx`（`desktop/Qt/src/Host.cpp:34-42`）。
- 桥接子进程启动方式：`<root>/MusicBridge/node.exe` + 参数 `worker.cjs`，环境变量白名单，stdin/stdout 逐行 JSON（`Host.cpp:323-371`）。
- 凭据持久化：已移除；桌面端只保存 `streamsound-server` 地址偏好。
- 封面加载 `Host::loadCover` 有域名白名单，仅允许网易/QQ/酷狗域名（`Host.cpp:690-730`），需加入 `127.0.0.1`。
- 服务端接口（`server/src/routes`）：
  - `GET /health` → `data:{...}`（连通性探测，桥接返回服务器地址）；服务端无鉴权、无 `/auth` 路由。
  - `GET /library/folders`、`GET /library/folders/:id/tracks`、`GET /library/tracks/:id`（曲目详情含 `hasLyrics`、`lyrics`）。
  - `GET /search?q=`、`GET /favorites`、`POST|DELETE /favorites/:id`、`GET /history`、`POST /history/:id`。
  - `GET /stream/:id`（Range）、`GET /covers/:id`。
- 工具链：Qt 6.12.0 msvc2022_64 已解压至 `.toolchain/Qt/6.12.0/msvc2022_64`；MSVC 14.51.36231（VS 18 BuildTools）已安装；CMake 4.4.4；生成器 `Visual Studio 18 2026`。
- FidelityFX 是可选的：`CMakeLists.txt:93` 无条件 `include(cmake/FidelityFX.cmake)`，但 `CMakeLists.txt:232` 用 `if(TARGET FidelityFX::SDK)` 才链接。不放入 FidelityFX 子模块即可跳过 FSR3，FSR1 的 GLSL 着色器仍可编译。

## 3. 架构决策

### D1：新增 provider `streamsound`
不伪装成 netease。所有 provider 白名单点加入 `streamsound`，缓存、provider 隔离等既有机制原样复用。

### D2：适配层放在桥接，输出 NetEase 形状 JSON
`streamsound.cjs` 把服务端字段映射为 `MusicData::parse` 已能消费的结构：
`{id, name, ar:[{id,name}], al:{id,name,picUrl}, dt, ...}`。
理由：`MusicData`/`MusicLibrary`/`NativeHud`/`RhiScene` 的解析与布局全部不需要改，改动面收敛在桥接 + 少量 provider 分支。

### D3：只持久化服务器地址
桌面端仅保存一个偏好项 `streamsound-server`，不保存任何令牌、Cookie 或账号信息。桥接每次请求直接使用该地址，服务端无鉴权。

### D4：媒体与封面走桥接内置 127.0.0.1 代理
桥接启动时监听 `127.0.0.1:0`（随机端口），URL 形如
`http://127.0.0.1:<port>/<sessionSecret>/stream/<id>` 与 `.../covers/<id>`。
代理不注入任何认证头，透传 `Range` 与状态码，仅监听回环地址。
理由：播放器只访问回环地址，`Host::loadCover` 只需把 `127.0.0.1` 加入白名单。

### D5：移除在线平台
`MusicBridge/worker.cjs` 由 StreamSound 实现替换；删除 `qq.cjs`、`kugou.cjs`、`upstream/`、`client/`、`node_modules` 与 `package.json` 中的 NetEase/QQ/酷狗依赖。保留 `lyrics-format.cjs`（歌词归一化，纯本地逻辑）。
不放入 FidelityFX/glslang 子模块，首版不启用 FSR3。

### D6：五列映射
| 列 | 内容 | 操作 |
| --- | --- | --- |
| 0 | 搜索 | `search` |
| 1 | 收藏 | `likedIDs` → `songs`；写操作 `/streamsound/like` |
| 2 | 文件夹 | `folders`（列表项为 playlist 形状）；详情走 `/streamsound/playlist/detail` |
| 3 | 历史 | `history`（直接返回歌曲数组） |
| 4 | 禁用 | `hasMore[4]=false`，提示“此来源不提供该栏目” |

## 4. 桥接契约（`desktop/MusicBridge/streamsound.cjs`）

输入（stdin，每行一条）：
```json
{"id":"uuid","route":"/native/streamsound/search","params":{"args":["关键词"]}}
```
输出（stdout，每行一条）：
```json
{"id":"uuid","body":{"code":200,"value":[...]}}
```
约束：日志必须静默（`console.*` 置空）；单条响应上限 32MB（与 `Host` 一致）。

操作表：

| route | 参数 | 上游 | 输出 `value` |
| --- | --- | --- | --- |
| `/native/streamsound/server` | `[]` | `GET /health` | 服务器地址 |
| `/native/streamsound/search` | `[q, page?, limit?]` | `GET /search?q=&limit=&offset=` | 歌曲数组 |
| `/native/streamsound/songs` | `[[id...]]` | `GET /library/tracks/:id`（并发 4） | 歌曲数组（保持入参顺序） |
| `/native/streamsound/likedIDs` | `[]` | `GET /favorites` | `["id", ...]` |
| `/native/streamsound/likedSongs` | `[cursor]` | `GET /favorites` | 歌曲数组（`limit=100, offset=cursor`） |
| `/native/streamsound/folders` | `[cursor]` | `GET /library/folders` | playlist 形状数组 |
| `/native/streamsound/history` | `[cursor]` | `GET /history` | 歌曲数组 |
| `/native/streamsound/playback` | `[track]` | 生成本地代理 URL | `{url, level:"lossless", trial:false}` |
| `/native/streamsound/lyrics` | `[id]` | `GET /library/tracks/:id` 的 `lyrics` | `{lrc:{lyric}, tlyric:{lyric:""}}` |
| `/native/streamsound/wiki` | `[id]` | — | `""` |
| `/native/streamsound/detail` | `[item]` | 视 `kind` 取曲目/文件夹 | `[item, songs, ids]` |
| `/streamsound/playlist/detail` | `{id, ...}` | `GET /library/folders/:id/tracks` | `[playlist, songs, ids]` |
| `/streamsound/like` | `{id, like}` | `POST|DELETE /favorites/:id` | `{}` |
| `/streamsound/history` | `{id}` | `POST /history/:id` | `{}` |

错误映射：网络失败 → `{code:503, message:"音乐服务不可达"}`；业务错误透传 `message`。

歌曲映射（服务端 → 桥接）：
```js
{ id: String(t.id), name: t.title, ar: [{ id: String(t.artist||""), name: t.artist||"未知" }],
  al: { id: String(t.album||""), name: t.album||"", picUrl: t.hasCover ? proxyCover(t.id) : "" },
  dt: (t.duration||0) * 1000, fee: 0, noCopyrightRcmd: null }
```
（`duration` 服务端为秒，`MusicPlayer` 按毫秒处理，必须乘 1000。）

## 5. C++ 改动清单

| 文件 | 位置 | 改动 |
| --- | --- | --- |
| `Qt/src/Host.cpp` | `routeProvider` L34 | 增加 `/streamsound/` 前缀 → `"streamsound"` |
| `Qt/src/Host.cpp` | `lifetime` L95 | 增加 streamsound 分支：`server` 0、`likedIDs` 0、`search` 300、`songs/detail` 86400 |
| `Qt/src/Host.cpp` | `setProvider` L524 | 白名单加入 `"streamsound"` |
| `Qt/src/Host.cpp` | `loadCover` L690 | 主机白名单加入 `127.0.0.1` |
| `Qt/src/Host.cpp` | `send` L369 | 子进程脚本仍为 `worker.cjs`（内容已替换为 StreamSound 实现）；`node.exe` 缺失时回退 PATH 中的 `node` |
| `Qt/src/MusicApi.cpp` | `providerName` L10 | 增加 `"streamsound"` → “流声” |
| `Qt/src/MusicApi.cpp` | `request` L77 | provider 为 streamsound 时前缀 `/streamsound` |
| `Qt/src/MusicLibrary.cpp` | 构造函数 L20 | 白名单加入 `"streamsound"`，缺省 provider 改为 streamsound |
| `Qt/src/MusicLibrary.cpp` | `loadMoreSource` L731 | 按 D6 分支：lane1 `likedIDs`、lane2 `folders`、lane3 `history`、lane4 禁用 |
| `Qt/src/MusicLibrary.cpp` | `loadLikedIDs` L725 | 条件由 `provider=="netease"` 改为 `netease|streamsound` |
| `Qt/src/MusicLibrary.cpp` | `sourceOrder`/`sourceMessage` L144/L94 | streamsound 只保留 1/2/3/0；空库文案改为曲库文案 |
| `Qt/src/MusicAccount.cpp` | `switchProvider` L193 | 白名单加入 `"streamsound"` |
| `Qt/src/AudioPlayer.cpp` | L296-328 | 主机校验放行 `127.0.0.1`（本地代理） |
| `Qt/src/LyricsController.cpp` | L11/L208 | provider 列表加入 `streamsound` |
| `Qt/src/NativeHudMusic.cpp` | L199-208 | 移除 NetEase/QQ/酷狗项目链接，改为 StreamSound 仓库链接 |

## 6. 移除项

- `desktop/MusicBridge/`：删除 `qq.cjs`、`kugou.cjs`、`upstream/`、`client/`、`node_modules/`、`package-lock.json`；`package.json` 清空依赖，仅保留 `{name, private, type:"commonjs"}`。
- `desktop/MusicBridge/worker.cjs`：整体替换为 StreamSound IPC 实现（保留文件名以免改 `Host.cpp` 的启动参数）。
- `desktop/FidelityFX-SDK/`、`desktop/third_party/`：不放入子模块源码（目录保留为空或删除）；CMake 因缺少目标自动跳过 FSR3。
- `desktop/Qt/src/MusicDiscover*`、`MusicDirectory*`：保留但只服务 lane2 文件夹详情，不接入推荐/排行榜。

## 7. 验证

1. 桥接单测（不需要 GUI）：
   ```
   node desktop/MusicBridge/streamsound.cjs < IPC样本.jsonl
   ```
   覆盖：服务器探测、搜索、songs、收藏、历史、playback URL、歌词。
2. 服务端联调：`npm run dev`（`server/`），走一遍全部接口（无需账号）。
3. 构建：
   ```
   cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 \
     -DCMAKE_PREFIX_PATH="<Qt 路径>"
   cmake --build desktop/build --config Debug
   ```
4. 手工验收：服务器地址配置 → 五列内容 → 搜索 → 收藏/取消 → 播放/进度/音量/切歌 → 歌词滚动 → 封面显示 → 历史新增。
5. 回归：`RHINE_VISUAL_TESTS=OFF` 下现有单元测试通过；确认无 NetEase/QQ/酷狗域名请求（抓包或日志检查）。

## 8. 风险与对策

| 风险 | 对策 |
| --- | --- |
| `MusicData::parse` 拒绝非数字 id | StreamSound 使用自增整数主键，映射时 `String(id)` |
| 时长单位（秒/毫秒）不一致 | 桥接统一乘 1000 |
| 本地代理端口冲突 | 监听端口 0 由系统分配，URL 由桥接生成，C++ 不感知端口 |
| FSR3 缺失影响 3D 视觉 | FSR1（EASU/RCAS）仍在，仅高性能超分不可用；后续可再接 FidelityFX |

## 9. 需批准

请确认以上范围、provider 命名（`streamsound` / 显示名“流声”）、五列映射与移除项。批准后按 [desktop-tasks.md](desktop-tasks.md) 执行。

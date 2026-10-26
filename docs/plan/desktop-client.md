# StreamSound 桌面客户端（路线 A）实施规格

## 1. 目标

以 Rhine-Music-Database（Qt 6.12 / C++ / RHI）为外壳，保留其 3D 场景与自绘 HUD，把数据层整体替换为 StreamSound 自建 HTTP 服务，交互按“本地音乐播放器”逻辑组织。

首版范围（曲库核心版）：

| 能力 | 说明 |
| --- | --- |
| 账号 | 用户名 + 密码登录，令牌自动刷新，退出登录 |
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
- 凭据持久化：桥接响应 `cookies` 数组经 `Host::acceptCookies` 写入 `cookies` 对象并落盘（`Host.cpp:478-500`）；`Host::hasCredential`/`logout` 按 provider 白名单分支（`Host.cpp:511-601`）。
- 封面加载 `Host::loadCover` 有域名白名单，仅允许网易/QQ/酷狗域名（`Host.cpp:690-730`），需加入 `127.0.0.1`。
- 服务端接口（`server/src/routes`）：
  - `POST /auth/login` → `data:{accessToken, refreshToken, user:{id,username,role}}`；`POST /auth/refresh`；无 `/auth/me`。
  - `GET /library/folders`、`GET /library/folders/:id/tracks`、`GET /library/tracks/:id`（曲目详情含 `hasLyrics`、`lyrics`）。
  - `GET /search?q=`、`GET /favorites`、`POST|DELETE /favorites/:id`、`GET /history`、`POST /history/:id`。
  - `GET /stream/:id`（Bearer + Range）、`GET /covers/:id`（Bearer）。
- 工具链：Qt 6.12.0 msvc2022_64 已解压至 `.toolchain/Qt/6.12.0/msvc2022_64`；MSVC 14.51.36231（VS 18 BuildTools）已安装；CMake 4.4.4；生成器 `Visual Studio 18 2026`。
- FidelityFX 是可选的：`CMakeLists.txt:93` 无条件 `include(cmake/FidelityFX.cmake)`，但 `CMakeLists.txt:232` 用 `if(TARGET FidelityFX::SDK)` 才链接。不放入 FidelityFX 子模块即可跳过 FSR3，FSR1 的 GLSL 着色器仍可编译。

## 3. 架构决策

### D1：新增 provider `streamsound`
不伪装成 netease。所有 provider 白名单点加入 `streamsound`，缓存、凭据、账号代数按 provider 隔离的既有机制原样复用。

### D2：适配层放在桥接，输出 NetEase 形状 JSON
`streamsound.cjs` 把服务端字段映射为 `MusicData::parse` 已能消费的结构：
`{id, name, ar:[{id,name}], al:{id,name,picUrl}, dt, ...}`。
理由：`MusicData`/`MusicLibrary`/`NativeHud`/`RhiScene` 的解析与布局全部不需要改，改动面收敛在桥接 + 少量 provider 分支。

### D3：令牌以 cookie 形式持久化
登录成功后桥接返回 `cookies` 数组：
`streamsound_access`、`streamsound_refresh`、`streamsound_user`（JSON：`{id,username,role}`）。
C++ 侧 `Host::acceptCookies` 原样落盘；桥接每次请求从 `cookies` 读取并在 401 时用 refresh 换新，随响应回传新 cookie。`account` 操作直接读 `streamsound_user`，避免依赖不存在的 `/auth/me`。

### D4：媒体与封面走桥接内置 127.0.0.1 代理
桥接启动时监听 `127.0.0.1:0`（随机端口），URL 形如
`http://127.0.0.1:<port>/<sessionSecret>/stream/<id>` 与 `.../covers/<id>`。
代理注入 `Authorization: Bearer`，透传 `Range` 与状态码，仅监听回环地址。
理由：不改 `AudioPlayer`/`HttpAudioStream` 的鉴权逻辑，也不会把令牌发给外部 CDN；`Host::loadCover` 只需把 `127.0.0.1` 加入白名单。

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
{"id":"uuid","route":"/native/streamsound/search","params":{"args":["关键词"]},"cookies":{"streamsound_access":"..."}}
```
输出（stdout，每行一条）：
```json
{"id":"uuid","body":{"code":200,"value":[...]},"cookies":["streamsound_access=...; Path=/"]}
```
约束：日志必须静默（`console.*` 置空）；不得把令牌写入日志；单条响应上限 32MB（与 `Host` 一致）。

操作表：

| route | 参数 | 上游 | 输出 `value` |
| --- | --- | --- | --- |
| `/native/streamsound/account` | `[]` | 读 `streamsound_user` cookie | `[id, username]` |
| `/native/streamsound/search` | `[q, page?, limit?]` | `GET /search?q=&limit=&offset=` | 歌曲数组 |
| `/native/streamsound/songs` | `[[id...]]` | `GET /library/tracks/:id`（并发 4） | 歌曲数组（保持入参顺序） |
| `/native/streamsound/likedIDs` | `[user]` | `GET /favorites` | `["id", ...]` |
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
| `/native/streamsound/login` | `[username, password]` | `POST /auth/login` | `[id, username]` + 令牌 cookie |
| `/native/streamsound/logout` | `[]` | 清空 cookie | `null` |

错误映射：HTTP 401/403 → `{code:401, authExpired:true}`；网络失败 → `{code:503, message:"音乐服务不可达"}`；业务错误透传 `message`。

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
| `Qt/src/Host.cpp` | `requestJson` L244 | 为 streamsound 取 `cookies["streamsound_access"]` 作为 scope |
| `Qt/src/Host.cpp` | `lifetime` L95 | 增加 streamsound 分支：`account` 0、`likedIDs` 0、`search` 300、`songs/detail` 86400 |
| `Qt/src/Host.cpp` | `hasCredential` L511 | 允许 `"streamsound"`：`cookies["streamsound_access"]` 非空 |
| `Qt/src/Host.cpp` | `setProvider` L524 | 白名单加入 `"streamsound"` |
| `Qt/src/Host.cpp` | `logout` L567 | streamsound 分支：清三个 cookie 并重启子进程 |
| `Qt/src/Host.cpp` | `loadCover` L690 | 主机白名单加入 `127.0.0.1` |
| `Qt/src/Host.cpp` | `send` L369 | 子进程脚本仍为 `worker.cjs`（内容已替换为 StreamSound 实现）；`node.exe` 缺失时回退 PATH 中的 `node` |
| `Qt/src/MusicApi.cpp` | `providerName` L10 | 增加 `"streamsound"` → “流声” |
| `Qt/src/MusicApi.cpp` | `request` L77 | provider 为 streamsound 时前缀 `/streamsound` |
| `Qt/src/MusicLibrary.cpp` | 构造函数 L20 | 白名单加入 `"streamsound"`，缺省 provider 改为 streamsound |
| `Qt/src/MusicLibrary.cpp` | `loadMoreSource` L731 | 按 D6 分支：lane1 `likedIDs`、lane2 `folders`、lane3 `history`、lane4 禁用 |
| `Qt/src/MusicLibrary.cpp` | `loadLikedIDs` L725 | 条件由 `provider=="netease"` 改为 `netease|streamsound` |
| `Qt/src/MusicLibrary.cpp` | `sourceOrder`/`sourceMessage` L144/L94 | streamsound 只保留 1/2/3/0；空库文案改为曲库文案 |
| `Qt/src/MusicAccount.cpp` | `switchProvider` L193 | 白名单加入 `"streamsound"` |
| `Qt/src/MusicAccount.cpp` | `startLogin` L390 附近 | streamsound 走 `loginMethod="password"`，不启动二维码轮询 |
| `Qt/src/MusicAccount.cpp` | 新增 `passwordLogin(username,password)` | 调 `api.call("login", {username,password})`，成功写 uid/nickname 并 `restoreAccount()` |
| `Qt/src/MusicLibrary.h` | L91 附近 | 声明 `passwordLogin` |
| `Qt/src/NativeHudController.cpp` | `form` L121 | `let modal=="login" && loginMethod=="password"` 时校验 `account`/`password` 并调用 `passwordLogin` |
| `Qt/src/NativeHudMusic.cpp` | L212-236 | `login`/`login-method` 分支允许 `"password"` |
| `Qt/src/NativeHudLibrary.cpp` | L265 | 登录弹窗对 `password` 渲染用户名/密码两个输入框 |
| `Qt/src/Engine.cpp` | L456 | 回车提交条件加入 `password` |
| `Qt/src/AudioPlayer.cpp` | L296-328 | 主机校验放行 `127.0.0.1`（本地代理） |
| `Qt/src/LyricsController.cpp` | L11/L208 | provider 列表加入 `streamsound` |
| `Qt/src/NativeHudMusic.cpp` | L199-208 | 移除 NetEase/QQ/酷狗项目链接，改为 StreamSound 仓库链接 |

登录弹窗字段：`account`（用户名）、`password`（密码，需掩码显示）；提交走 `NativeHud::form`。

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
   覆盖：登录成功/失败、搜索、songs、收藏、历史、playback URL、歌词、401 自动刷新。
2. 服务端联调：`npm run dev`（`server/`），用测试账号走一遍全部接口。
3. 构建：
   ```
   cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 \
     -DCMAKE_PREFIX_PATH="<repo>\.toolchain\Qt\6.12.0\msvc2022_64"
   cmake --build desktop/build --config Debug
   ```
4. 手工验收：登录 → 五列内容 → 搜索 → 收藏/取消 → 播放/进度/音量/切歌 → 歌词滚动 → 封面显示 → 历史新增 → 退出登录后凭据清除。
5. 回归：`RHINE_VISUAL_TESTS=OFF` 下现有单元测试通过；确认无 NetEase/QQ/酷狗域名请求（抓包或日志检查）。

## 8. 风险与对策

| 风险 | 对策 |
| --- | --- |
| `MusicData::parse` 拒绝非数字 id | StreamSound 使用自增整数主键，映射时 `String(id)` |
| 时长单位（秒/毫秒）不一致 | 桥接统一乘 1000 |
| 登录弹窗是 C++ 自绘，字段布局改动大 | 复用现有 `form` 字段机制，仅新增 `password` 分支与掩码绘制 |
| 本地代理端口冲突 | 监听端口 0 由系统分配，URL 由桥接生成，C++ 不感知端口 |
| 令牌泄露到外部请求 | 令牌只注入回环代理；`AudioPlayer` 仅放行 `127.0.0.1` |
| FSR3 缺失影响 3D 视觉 | FSR1（EASU/RCAS）仍在，仅高性能超分不可用；后续可再接 FidelityFX |

## 9. 需批准

请确认以上范围、provider 命名（`streamsound` / 显示名“流声”）、五列映射与移除项。批准后按 [desktop-tasks.md](desktop-tasks.md) 执行。

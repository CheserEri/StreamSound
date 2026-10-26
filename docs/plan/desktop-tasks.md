# StreamSound 桌面客户端（路线 A）任务清单

依赖：[desktop-client.md](desktop-client.md) 第 3-6 节。任务按顺序执行，前一项验收通过再进入下一项。

## T0 构建基线（工具链）

- [x] T0.1 复制子模块（可选）：仅当需要 FSR3 时，把 `.toolchain/submodules/*` 复制到 `desktop/FidelityFX-SDK`、`desktop/third_party/glslang`、`.../External/spirv-tools`、`.../External/spirv-headers`，去除 `.git`。首版跳过。
- [x] T0.2 CMake 配置：
  `cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 -DCMAKE_PREFIX_PATH="<repo>\.toolchain\Qt\6.12.0\msvc2022_64" -DRHINE_ENABLE_FIDELITYFX=OFF`
- [x] T0.3 编译未修改的 Rhine 基线，记录缺失项。
  验收：`desktop/build/**/RhineMusicDatabase.exe` 生成。
- [x] T0.4 在 `.gitignore` 追加 `.toolchain/`、`desktop/build/`、`desktop/MusicBridge/node_modules/`。

## T1 桥接实现（Node 侧，可独立测试）

- [x] T1.1 新建 `desktop/MusicBridge/streamsound.cjs`：
  - 逐行读 stdin，按 [desktop-client.md](desktop-client.md) 第 4 节操作表分派；
  - 使用 Node 内置 `fetch`，无第三方依赖；
  - 令牌存取与 401 自动 refresh（并发请求共享一次 refresh）；
  - 本地媒体代理（`http.createServer`，监听 `127.0.0.1:0`，路径含随机 secret，注入 Bearer，透传 Range）；
  - `console.*` 置空。
- [x] T1.2 用 `worker.cjs` 同名替换：删除旧内容，改为 `require('./streamsound.cjs')`（保持 `Host.cpp` 启动参数不变）。
- [x] T1.3 删除 `qq.cjs`、`kugou.cjs`、`upstream/`、`client/`、`node_modules/`、`package-lock.json`；重写 `package.json`。
- [x] T1.4 准备 `IPC样本.jsonl`（临时文件，不入库）覆盖登录/搜索/收藏/历史/歌词/播放。
  验收：`node desktop/MusicBridge/streamsound.cjs < IPC样本.jsonl` 输出每行含 `id`、`body.code`，无日志污染。

## T2 C++ provider 接线

- [x] T2.1 `Host.cpp`：`routeProvider` 增加 `/streamsound/`；`requestJson` scope 用 `streamsound_access`；`lifetime` 增补分支；`hasCredential`、`setProvider`、`logout` 白名单；`loadCover` 放行 `127.0.0.1`。
- [x] T2.2 `MusicApi.cpp`：`providerName` 增加“流声”；`request` 为 streamsound 加 `/streamsound` 前缀。
- [x] T2.3 `MusicLibrary.cpp/.h`：构造函数白名单与缺省 provider；`loadMoreSource` 按 D6 分支；`loadLikedIDs` 条件放宽；`sourceOrder`、`sourceMessage` 文案。
- [x] T2.4 `AudioPlayer.cpp`：主机校验放行 `127.0.0.1`。
- [x] T2.5 `LyricsController.cpp`：provider 列表加入 `streamsound`。
  验收：编译通过；离线启动不触发 NetEase 域名请求。

## T3 登录（账号密码）

- [x] T3.1 `MusicLibrary::passwordLogin(username, password)`：调 `api.call("login", {username,password})`，成功写 `uid`、`nickname`，失败写 `status`/`m_accountError`，随后 `restoreAccount()`。
- [x] T3.2 `MusicAccount.cpp::startLogin`：streamsound 直接设 `loginMethod="password"`，不启动二维码。
- [x] T3.3 `NativeHudController::form`：处理 `password` 模式的 `account`/`password`。
- [x] T3.4 `NativeHudLibrary.cpp` 登录弹窗：渲染两个输入框，密码掩码。
- [x] T3.5 `NativeHudMusic.cpp`：`login`/`login-method` 允许 `password`；移除在线平台项目链接。
- [x] T3.6 `Engine.cpp:456`：回车提交条件加入 `password`。
  验收：正确账号可登录并恢复；错误密码提示；退出登录后 `streamsound_*` cookie 清空。

## T4 五列与播放链路

- [x] T4.1 收藏：列表、红心状态、加/取消（`/streamsound/like`）。
- [x] T4.2 文件夹：列表项、进入目录、曲目分页（`/streamsound/playlist/detail`）。
- [x] T4.3 历史：列表、播放上报（`/streamsound/history`）。
- [x] T4.4 搜索：FTS 结果、翻页。
- [x] T4.5 播放：代理 URL、Range 续播、进度/音量同步、切歌。
- [x] T4.6 歌词与封面：`lyrics` 输出接入 `LyricsController`；封面与主色显示。
  验收：第 7 节手工验收全流程通过。

## T5 构建与发布

- [x] T5.1 生成 Release 构建；确认 `MusicBridge/node.exe` 随包（开发期回退系统 `node`）。
- [x] T5.2 更新 `desktop/README.md`：服务器地址配置（`Host::preference("streamsound-server")`，默认 `http://127.0.0.1:8080`）、账号来源、构建步骤。
- [x] T5.3 保留 MIT `LICENSE`/`NOTICE`，补充 StreamSound 修改说明。

## 验收门槛

- 编译零错误；桥接单测全绿；手工验收全流程通过；无在线平台域名请求。

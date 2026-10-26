# StreamSound 部署与发布

## 1. 服务端

### 1.1 环境要求

- Node.js 20+（与 better-sqlite3 预编译包匹配）
- 可读的音乐目录（本地磁盘、挂载盘或 NAS 挂载点均可）
- 可写的数据目录（SQLite、封面缓存）

### 1.2 环境变量

在 `server/.env` 中配置：

| 变量 | 默认值 | 说明 |
| --- | --- | --- |
| `PORT` | `3000` | 监听端口；桌面端默认连接 `8080`，建议设为 `8080` |
| `HOST` | `0.0.0.0` | 监听地址；仅本机使用时设为 `127.0.0.1` |
| `MUSIC_ROOT` | `/music` | 音乐库根目录 |
| `DB_PATH` | `./data/streamsound.db` | SQLite 文件路径 |
| `JWT_SECRET` | 无 | 必填，使用随机长字符串 |
| `JWT_ACCESS_EXPIRES` | `1h` | Access Token 有效期 |
| `JWT_REFRESH_EXPIRES` | `30d` | Refresh Token 有效期 |
| `SCAN_CRON` | `0 * * * *` | 定时扫描表达式 |
| `SCAN_ON_START` | `true` | 启动时是否立即扫描 |
| `REQUIRE_APPROVAL` | `false` | 新注册用户是否需要管理员审批 |

### 1.3 安装与运行

```bash
cd server
cp .env.example .env
# 编辑 .env
npm ci
npm run build
npm start
```

开发模式：

```bash
npm run dev
```

### 1.4 systemd

```ini
[Unit]
Description=StreamSound server
After=network.target

[Service]
Type=simple
User=streamsound
WorkingDirectory=/opt/streamsound/server
EnvironmentFile=/opt/streamsound/server/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable --now streamsound
sudo journalctl -u streamsound -f
```

### 1.5 反向代理与 TLS

```nginx
server {
    listen 443 ssl http2;
    server_name music.example.com;

    ssl_certificate     /etc/letsencrypt/live/music.example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/music.example.com/privkey.pem;

    client_max_body_size 16m;

    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_request_buffering off;
    }
}
```

流媒体依赖 `Range` 透传，`proxy_buffering off` 可降低首包延迟。

### 1.6 扫描与备份

- 定时扫描由 `SCAN_CRON` 控制；也可调用 `POST /admin/scan` 手动触发
- 备份 SQLite 时使用在线备份，避免复制到写入中的 WAL：

```bash
sqlite3 /var/lib/streamsound/data.db ".backup '/var/backups/streamsound-$(date +%F).db'"
```

- 封面缓存位于数据目录下，可随数据库一起备份

## 2. 桌面端（Windows）

### 2.1 构建

要求 Qt 6.12 `msvc2022_64`、MSVC 2022/2026、CMake 3.24+、Python 3。

```powershell
cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 `
  -DCMAKE_PREFIX_PATH="<Qt>" -DRHINE_ENABLE_FIDELITYFX=OFF
cmake --build desktop/build --config Release
```

### 2.2 部署运行库与资源

```powershell
cd desktop
python scripts/export-assets.py
python scripts/bake-archive-lighting.py
<Qt>\bin\windeployqt.exe --release --qmldir Qt\qml build\Release\RhineMusicDatabase.exe
```

将 `desktop/output/resources` 复制为 `desktop/build/Release/resources`。资源目录中必须包含：

- `slots.json`、`boot-lettering-art.json`
- `*.bin` 场景几何与光照数据
- `MusicBridge/`（`worker.cjs`、`streamsound.cjs`、`lyrics-format.cjs`、`lyrics-source.json`）
- `quality/` 与字体文件

### 2.3 完整打包

```powershell
cd desktop
$env:QT_ROOT = "<Qt>"
$env:RHINE_NODE_BINARY = "<官方 node 独立分发包>/node.exe"
$env:RHINE_NODE_LICENSE = "<官方 node 分发包>/LICENSE"
node scripts/build.cjs
```

脚本会串行执行：资源导出、Qt 构建、`windeployqt`、MSVC 运行库、官方 Node 复制、桥接单文件打包，并按平台生成安装器（Windows 使用 `scripts/windows-installer.iss`）。

开发期若未提供官方 Node，客户端会回退到系统 `node`。

### 2.4 安装后的目录

```text
RhineMusicDatabase/
├── RhineMusicDatabase.exe
├── Qt6*.dll
├── platforms/、imageformats/、multimedia/、qml/
├── resources/
│   ├── slots.json ...
│   └── MusicBridge/node.exe ...
└── data/                # settings.ini、DPAPI 凭据、缓存
```

- 服务器地址：偏好项 `streamsound-server`，默认 `http://127.0.0.1:8080`
- 登录态：`data/account.dpapi`（DPAPI 加密），退出登录时清除

### 2.5 其他平台

`desktop/scripts/build.cjs` 同时支持 macOS 与 Linux 打包分支（Qt 部署、签名、AppImage 等），但当前仅 Windows 构建经过验证。

## 3. 常见问题

| 现象 | 原因与处理 |
| --- | --- |
| 启动报缺少 `Qt6Widgets.dll` | 未执行 `windeployqt`，按 2.2 部署 |
| 界面空白/无栏目 | 资源目录未就位，检查 `resources/slots.json` 与 `MusicBridge/` |
| 登录提示连接失败 | 服务端未启动或 `streamsound-server` 地址/端口不一致 |
| 无法播放 | 未登录、音频文件不可读，或代理端口被防火墙拦截 |
| 封面 404 | 音频文件没有内嵌封面，属正常现象 |

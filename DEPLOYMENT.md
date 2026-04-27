# StreamSound · 部署操作手册

---

## 目录

1. [环境要求](#1-环境要求)
2. [首次部署 Checklist](#2-首次部署-checklist)
3. [后端部署](#3-后端部署)
4. [HTTPS 自签名证书配置](#4-https-自签名证书配置)
5. [防火墙与网络配置](#5-防火墙与网络配置)
6. [Android App 侧载安装](#6-android-app-侧载安装)
7. [数据库备份方案](#7-数据库备份方案)
8. [日常运维](#8-日常运维)
9. [升级流程](#9-升级流程)
10. [故障排查](#10-故障排查)

---

## 1. 环境要求

| 项目 | 要求 |
|------|------|
| 操作系统 | Ubuntu 20.04 LTS 及以上 |
| Node.js | >= 20 LTS（推荐 20.x） |
| 磁盘空间 | 音乐文件大小 + 至少 1GB 余量 |
| 内存 | >= 512MB 可用内存 |
| 网络 | 局域网静态 IP（必须）；IPv6 全球单播地址（可选） |

---

## 2. 首次部署 Checklist

按序执行，全部打勾后服务方可上线：

```
[ ] 1. Node.js 20 LTS 已安装
[ ] 2. 创建专用系统用户 streamsound
[ ] 3. 音乐目录权限已配置
[ ] 4. 仓库已克隆，后端依赖已安装
[ ] 5. .env 文件已配置（JWT_SECRET 已生成）
[ ] 6. 数据库首次初始化成功
[ ] 7. 自签名证书已生成，App 端证书已导入
[ ] 8. systemd 服务已启用并正常运行
[ ] 9. 防火墙端口已放行
[ ] 10. 服务器静态 IP 已配置
[ ] 11. 管理员账号已注册
[ ] 12. 手机 App 已安装，可正常连接并播放音乐
```

---

## 3. 后端部署

### 3.1 安装 Node.js 20 LTS

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node -v   # 确认输出 v20.x.x
```

### 3.2 创建专用系统用户

不使用 root 运行服务，降低安全风险：

```bash
sudo useradd --system --no-create-home --shell /usr/sbin/nologin streamsound
```

### 3.3 配置音乐目录权限

```bash
# 确保 streamsound 用户对音乐目录有读取权限
sudo chown -R streamsound:streamsound /music
sudo chmod -R 755 /music

# 创建数据库存储目录
sudo mkdir -p /var/lib/streamsound
sudo chown streamsound:streamsound /var/lib/streamsound
```

### 3.4 部署后端代码

```bash
# 克隆仓库
sudo mkdir -p /opt/streamsound
sudo chown streamsound:streamsound /opt/streamsound
cd /opt/streamsound
git clone <仓库地址> .

# 安装依赖并编译
cd server
npm ci --omit=dev
npm run build
```

### 3.5 配置环境变量

```bash
cp .env.example .env
sudo nano .env
```

**必须修改的字段：**

```env
# 生成安全的 JWT_SECRET（至少 64 位随机字符串）
# 运行以下命令生成，复制输出结果填入
# openssl rand -base64 64

JWT_SECRET=<粘贴生成的随机字符串>

# 音乐目录绝对路径
MUSIC_ROOT=/music

# 数据库路径
DB_PATH=/var/lib/streamsound/data.db

# 是否启用 HTTPS（配置证书后改为 true）
HTTPS_ENABLED=false
HTTPS_CERT=/opt/streamsound/certs/cert.pem
HTTPS_KEY=/opt/streamsound/certs/key.pem

# 新用户是否需要管理员审核
REQUIRE_APPROVAL=false
```

**生成 JWT_SECRET 命令：**

```bash
openssl rand -base64 64
```

> **安全要求**：JWT_SECRET 长度不低于 64 字节，不得使用默认值，不得提交到 Git 仓库。

### 3.6 配置 systemd 服务

创建服务文件：

```bash
sudo nano /etc/systemd/system/streamsound.service
```

写入以下内容：

```ini
[Unit]
Description=StreamSound Music Server
After=network.target

[Service]
Type=simple
User=streamsound
WorkingDirectory=/opt/streamsound/server
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure
RestartSec=5
EnvironmentFile=/opt/streamsound/server/.env

# 资源限制
MemoryMax=512M
LimitNOFILE=65536

[Install]
WantedBy=multi-user.target
```

启用并启动：

```bash
sudo systemctl daemon-reload
sudo systemctl enable streamsound
sudo systemctl start streamsound

# 确认运行状态
sudo systemctl status streamsound
```

正常输出应包含 `Active: active (running)`。

### 3.7 验证服务启动

```bash
# 查看实时日志
sudo journalctl -u streamsound -f

# 测试 API 可达（HTTP）
curl http://localhost:3000/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
# 预期返回 AUTH_002 错误（说明服务正常响应）
```

---

## 4. HTTPS 自签名证书配置

局域网内无法使用 Let's Encrypt，使用自签名证书加密传输。

### 4.1 生成证书

```bash
sudo mkdir -p /opt/streamsound/certs
cd /opt/streamsound/certs

# 生成私钥和自签名证书（有效期 10 年）
sudo openssl req -x509 -newkey rsa:4096 -sha256 -days 3650 \
  -nodes \
  -keyout key.pem \
  -out cert.pem \
  -subj "/CN=StreamSound" \
  -addext "subjectAltName=IP:192.168.1.100,IP:::1"
```

> 将 `192.168.1.100` 替换为服务器实际局域网 IP。如需支持 IPv6，同步填入 IPv6 地址（`IP:::1` 为示例）。

```bash
# 设置权限，仅 streamsound 用户可读
sudo chown streamsound:streamsound /opt/streamsound/certs/*.pem
sudo chmod 600 /opt/streamsound/certs/key.pem
sudo chmod 644 /opt/streamsound/certs/cert.pem
```

### 4.2 启用 HTTPS

修改 `.env`：

```env
HTTPS_ENABLED=true
HTTPS_CERT=/opt/streamsound/certs/cert.pem
HTTPS_KEY=/opt/streamsound/certs/key.pem
```

重启服务：

```bash
sudo systemctl restart streamsound

# 验证 HTTPS
curl -k https://localhost:3000/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 4.3 将证书导入 Android 设备

自签名证书需手动信任，否则 App 的 HTTPS 请求会被系统拒绝。

**导出证书到手机：**

```bash
# 方式一：通过 ADB 推送
adb push /opt/streamsound/certs/cert.pem /sdcard/streamsound-cert.pem

# 方式二：将 cert.pem 通过局域网共享或邮件发送到手机
```

**在 Android 上安装证书：**

```
设置 → 安全 → 更多安全设置 → 加密与凭据 → 安装证书
→ 选择「CA 证书」→ 找到 streamsound-cert.pem → 安装
```

> 不同 Android 版本菜单路径略有差异，关键词为「安装证书」或「从存储设备安装」。

### 4.4 配置 React Native 信任自签名证书

在 App 的 `android/app/src/main/res/xml/` 目录下创建网络安全配置文件：

**`network_security_config.xml`**

```xml
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <domain-config>
        <domain includeSubdomains="false">192.168.1.100</domain>
        <trust-anchors>
            <certificates src="@raw/streamsound_cert"/>
        </trust-anchors>
    </domain-config>
</network-security-config>
```

将 `cert.pem` 复制到 `android/app/src/main/res/raw/streamsound_cert.pem`，并在 `AndroidManifest.xml` 中引用：

```xml
<application
    android:networkSecurityConfig="@xml/network_security_config"
    ...>
```

---

## 5. 防火墙与网络配置

### 5.1 服务器静态 IP

编辑 Netplan 配置（Ubuntu 20.04+）：

```bash
sudo nano /etc/netplan/00-installer-config.yaml
```

```yaml
network:
  version: 2
  ethernets:
    eth0:
      addresses:
        - 192.168.1.100/24      # 替换为你的目标静态 IP
      gateway4: 192.168.1.1     # 替换为路由器 IP
      nameservers:
        addresses: [8.8.8.8, 8.8.4.4]
```

```bash
sudo netplan apply
```

### 5.2 UFW 防火墙放行

```bash
# 放行服务端口（默认 3000）
sudo ufw allow 3000/tcp comment 'StreamSound'

# 查看规则确认
sudo ufw status verbose
```

### 5.3 IPv6 访问配置（可选）

确认服务器已有全球单播 IPv6 地址（`2xxx:` 或 `3xxx:` 开头）：

```bash
ip -6 addr show scope global
```

路由器端需开放 IPv6 防火墙或配置 IPv6 端口转发规则（各路由器操作界面不同，参考对应型号文档）。

---

## 6. Android App 侧载安装

### 6.1 构建 APK

在开发机上执行：

```bash
cd app/android
./gradlew assembleRelease
```

APK 输出路径：`app/android/app/build/outputs/apk/release/app-release.apk`

> 首次构建前需在 `android/app/build.gradle` 中配置签名信息（keystore）。

**生成 Keystore（仅首次）：**

```bash
keytool -genkeypair -v \
  -keystore streamsound.keystore \
  -alias streamsound \
  -keyalg RSA -keysize 2048 \
  -validity 10000
```

将 `streamsound.keystore` 保存在安全位置，**不要提交到 Git**。

### 6.2 通过 ADB 安装

```bash
# 手机开启开发者模式 → USB 调试
# 连接 USB 后确认设备已识别
adb devices

# 安装 APK
adb install app/android/app/build/outputs/apk/release/app-release.apk

# 更新安装（保留数据）
adb install -r app/android/app/build/outputs/apk/release/app-release.apk
```

### 6.3 通过局域网无线安装

```bash
# 先通过 USB 连接一次，开启无线调试
adb tcpip 5555
adb connect 192.168.1.101:5555   # 替换为手机 IP

# 拔掉 USB，确认仍然连接
adb devices

# 安装
adb install app-release.apk
```

### 6.4 直接传输 APK 安装

将 APK 文件通过以下任一方式传到手机，点击文件直接安装：
- 局域网文件共享（`python3 -m http.server 8080`，手机浏览器下载）
- USB 数据线拷贝到手机存储
- 即时通讯工具传输

> 安装前需在手机「设置 → 安全」中开启「允许安装未知来源应用」。

---

## 7. 数据库备份方案

StreamSound 使用单文件 SQLite 数据库，备份即复制文件。

### 7.1 手动备份

```bash
# SQLite 安全备份命令（使用内置 .backup，避免复制中损坏）
sqlite3 /var/lib/streamsound/data.db ".backup /var/lib/streamsound/backup/data.db.$(date +%Y%m%d_%H%M%S)"
```

### 7.2 自动定期备份（cron）

创建备份脚本：

```bash
sudo nano /opt/streamsound/scripts/backup.sh
```

```bash
#!/bin/bash

BACKUP_DIR="/var/lib/streamsound/backup"
DB_PATH="/var/lib/streamsound/data.db"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/data.db.$TIMESTAMP"
KEEP_DAYS=30   # 保留最近 30 天的备份

mkdir -p "$BACKUP_DIR"

# 使用 SQLite 安全备份
sqlite3 "$DB_PATH" ".backup $BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "[$TIMESTAMP] 备份成功：$BACKUP_FILE"
    # 删除 30 天前的备份
    find "$BACKUP_DIR" -name "data.db.*" -mtime +$KEEP_DAYS -delete
else
    echo "[$TIMESTAMP] 备份失败" >&2
fi
```

```bash
sudo chmod +x /opt/streamsound/scripts/backup.sh
sudo chown streamsound:streamsound /opt/streamsound/scripts/backup.sh
```

注册 cron 任务（每天凌晨 3 点备份）：

```bash
sudo crontab -u streamsound -e
```

添加：

```
0 3 * * * /opt/streamsound/scripts/backup.sh >> /var/log/streamsound-backup.log 2>&1
```

### 7.3 备份验证

每次备份后建议定期验证备份文件完整性：

```bash
# 验证备份文件可正常读取
sqlite3 /var/lib/streamsound/backup/data.db.20251015_030000 "SELECT COUNT(*) FROM tracks;"
```

### 7.4 从备份恢复

```bash
# 停止服务
sudo systemctl stop streamsound

# 替换数据库文件
sudo cp /var/lib/streamsound/data.db /var/lib/streamsound/data.db.broken
sudo cp /var/lib/streamsound/backup/data.db.<目标时间戳> /var/lib/streamsound/data.db
sudo chown streamsound:streamsound /var/lib/streamsound/data.db

# 重启服务
sudo systemctl start streamsound
sudo systemctl status streamsound
```

---

## 8. 日常运维

### 8.1 常用命令速查

```bash
# 查看服务状态
sudo systemctl status streamsound

# 启动 / 停止 / 重启
sudo systemctl start streamsound
sudo systemctl stop streamsound
sudo systemctl restart streamsound

# 实时查看日志
sudo journalctl -u streamsound -f

# 查看最近 100 行日志
sudo journalctl -u streamsound -n 100

# 查看今天的日志
sudo journalctl -u streamsound --since today
```

### 8.2 手动触发音乐库扫描

```bash
# 通过 API 触发（需要管理员 Token）
curl -X POST https://localhost:3000/admin/scan \
  -k \
  -H "Authorization: Bearer <adminToken>"
```

### 8.3 查看备份状态

```bash
# 查看备份文件列表
ls -lh /var/lib/streamsound/backup/

# 查看备份日志
tail -20 /var/log/streamsound-backup.log
```

---

## 9. 升级流程

### 9.1 后端升级

```bash
# 1. 备份数据库
sudo -u streamsound sqlite3 /var/lib/streamsound/data.db \
  ".backup /var/lib/streamsound/backup/pre-upgrade.db"

# 2. 拉取新代码
cd /opt/streamsound
git pull

# 3. 更新依赖并重新编译
cd server
npm ci --omit=dev
npm run build

# 4. 重启服务
sudo systemctl restart streamsound
sudo systemctl status streamsound

# 5. 验证 API 正常响应
curl -k https://localhost:3000/auth/login \
  -X POST -H "Content-Type: application/json" \
  -d '{"username":"test","password":"test"}'
```

### 9.2 App 升级

重新构建 APK 后，通过 ADB 覆盖安装：

```bash
adb install -r app-release.apk
```

`-r` 参数保留用户数据（登录态、设置），无需重新配置服务器地址。

### 9.3 MAJOR 版本升级注意事项

对应版本号规则中的 MAJOR 升级（如 `1.x → 2.0.0`）：

- 后端 API 路径变更为 `/v2/...`，旧版 `/v1/...` 保留至少一个 MINOR 周期
- App 与后端需同步升级，升级前确认兼容性矩阵
- 升级前必须执行完整数据库备份

---

## 10. 故障排查

### 服务无法启动

```bash
# 查看详细错误
sudo journalctl -u streamsound -n 50 --no-pager

# 常见原因：
# - .env 文件不存在或字段缺失
# - 端口 3000 被占用：sudo lsof -i :3000
# - 数据库目录权限不足：ls -la /var/lib/streamsound/
# - Node.js 版本不符：node -v
```

### App 无法连接服务器

```bash
# 1. 确认服务正在运行
sudo systemctl status streamsound

# 2. 在服务器上测试本地可达
curl -k https://localhost:3000/auth/login -X POST \
  -H "Content-Type: application/json" -d '{"username":"x","password":"x"}'

# 3. 从手机所在网段测试可达（在另一台电脑上执行）
curl -k https://192.168.1.100:3000/auth/login -X POST \
  -H "Content-Type: application/json" -d '{"username":"x","password":"x"}'

# 4. 确认防火墙规则
sudo ufw status verbose | grep 3000
```

### 音乐扫描后曲目未入库

```bash
# 查看扫描日志
sudo journalctl -u streamsound | grep -i scan

# 确认音乐目录权限
sudo -u streamsound ls /music

# 手动触发扫描并观察日志
curl -X POST https://localhost:3000/admin/scan -k \
  -H "Authorization: Bearer <adminToken>"
sudo journalctl -u streamsound -f
```

### 数据库损坏

```bash
# 检查数据库完整性
sqlite3 /var/lib/streamsound/data.db "PRAGMA integrity_check;"
# 输出 "ok" 表示正常，否则从备份恢复（见 7.4）
```

---

*StreamSound · 部署操作手册 · 内部文档*

# 一键部署服务端到 Ubuntu：本地编译 -> 上传 dist -> 依赖变更时远程安装 -> 重启 -> 健康检查
# 用法：
#   .\tools\deploy.ps1              完整部署
#   .\tools\deploy.ps1 -Plan        只检查环境并打印将要执行的动作
#   .\tools\deploy.ps1 -ForceInstall 强制远程 npm install（依赖已变时会自动触发）

param(
    [switch]$Plan,
    [switch]$ForceInstall
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'config.ps1')
$root = Split-Path $PSScriptRoot -Parent
$serverDir = Join-Path $root 'server'
$config = Import-StreamSoundConfig
Assert-StreamSoundConfig -Config $config
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$remoteArchive = "/tmp/streamsound-$stamp.tar.gz"
$remoteDir = $config.RemoteDir

function Invoke-Remote {
    param([string]$Command)
    & python (Join-Path $PSScriptRoot 'remote.py') run $Command | Out-Host
    return $LASTEXITCODE
}

function Invoke-RemoteSudo {
    param([string]$Command)
    & python (Join-Path $PSScriptRoot 'remote.py') sudo $Command | Out-Host
    return $LASTEXITCODE
}

function Get-RemoteOutput {
    param([string]$Command)
    $output = & python (Join-Path $PSScriptRoot 'remote.py') run $Command 2>$null
    return (($output | Out-String).Trim())
}

Write-Host "[部署目标] $($config.User)@$($config.Host):$remoteDir  服务 $($config.Service)"
Write-Host "[音乐目录] $($config.MusicRoot)"
Write-Host "[服务地址] $(Get-StreamSoundServerUrl -Config $config)"

Write-Host '[检查] SSH 连通性 ...'
if ((Invoke-Remote 'echo ok') -ne 0) { throw 'SSH 连接失败，请检查 tools\deploy.env。' }

Write-Host '[检查] 远端 Node / npm ...'
if ((Invoke-Remote 'node --version && npm --version') -ne 0) { throw '远端缺少 node/npm。' }

Write-Host '[检查] 远端音乐目录 ...'
[void](Invoke-Remote "test -d '$($config.MusicRoot)' && echo 'music root ok' || echo 'music root missing'")

if (-not (Test-Path (Join-Path $serverDir 'node_modules'))) {
    throw '缺少 server\node_modules，请先执行：cd server; npm install'
}

Write-Host '[构建] 本地编译服务端 ...'
Push-Location $serverDir
try {
    & npm run build
    if ($LASTEXITCODE -ne 0) { throw '本地构建失败，未触碰远端。' }
} finally {
    Pop-Location
}

$localLock = (Get-FileHash (Join-Path $serverDir 'package-lock.json') -Algorithm SHA256).Hash.ToLower()
$remoteLock = (Get-RemoteOutput "cat '$remoteDir/.deploy-lock-hash' 2>/dev/null").ToLower()
$needInstall = $ForceInstall -or ($remoteLock -ne $localLock)
Write-Host "[依赖] $(if ($needInstall) { 'package-lock 变化，将远程安装' } else { '未变化，跳过安装' })"

$archive = Join-Path $env:TEMP "streamsound-server-$stamp.tar.gz"
Push-Location $serverDir
try {
    & tar -czf $archive dist src scripts package.json package-lock.json tsconfig.json .env.example
    if ($LASTEXITCODE -ne 0) { throw '打包服务端产物失败。' }
} finally {
    Pop-Location
}
Write-Host "[打包] $archive"

if ($Plan) {
    Write-Host '[计划] 上传后执行：'
    Write-Host "  rm -rf $remoteDir/dist && tar -xzf $remoteArchive -C $remoteDir"
    if ($needInstall) { Write-Host '  npm install --omit=dev --no-audit --no-fund' }
    Write-Host "  sudo systemctl restart $($config.Service)"
    Remove-Item -LiteralPath $archive -Force
    exit 0
}

Write-Host "[上传] -> $remoteArchive"
& python (Join-Path $PSScriptRoot 'remote.py') upload $archive $remoteArchive
if ($LASTEXITCODE -ne 0) {
    Remove-Item -LiteralPath $archive -Force
    throw '上传失败。'
}

$installStep = if ($needInstall) { 'npm install --omit=dev --no-audit --no-fund' } else { 'true' }
$deployCommand = "set -e; mkdir -p '$remoteDir'; " +
    "if [ -d '$remoteDir/dist' ]; then rm -rf '$remoteDir/dist.bak'; cp -a '$remoteDir/dist' '$remoteDir/dist.bak'; fi; " +
    "rm -rf '$remoteDir/dist'; tar -xzf '$remoteArchive' -C '$remoteDir'; cd '$remoteDir'; $installStep"

Write-Host '[应用] 远端替换产物 ...'
if ((Invoke-Remote $deployCommand) -ne 0) {
    Write-Warning '远端应用失败，正在恢复旧版本 ...'
    [void](Invoke-Remote "cd '$remoteDir' && rm -rf dist && { [ ! -d dist.bak ] || mv dist.bak dist; }")
    & python (Join-Path $PSScriptRoot 'remote.py') run "rm -f '$remoteArchive'"
    Remove-Item -LiteralPath $archive -Force
    exit 1
}

Write-Host '[服务] 重启 ...'
if ((Invoke-RemoteSudo "systemctl restart $($config.Service)") -ne 0) {
    Write-Warning '重启失败，请检查 systemd 单元或 sudo 权限。'
    exit 1
}

$healthy = $false
for ($i = 0; $i -lt 30; $i++) {
    Start-Sleep -Milliseconds 500
    if (Test-StreamSoundHealth -Config $config) { $healthy = $true; break }
}

if (-not $healthy) {
    Write-Warning '新版本未恢复健康，正在回滚 ...'
    [void](Invoke-Remote "cd '$remoteDir' && rm -rf dist && mv dist.bak dist")
    [void](Invoke-RemoteSudo "systemctl restart $($config.Service)")
    Start-Sleep -Seconds 2
    Write-Host "[回滚] $(if (Test-StreamSoundHealth -Config $config) { '旧版本已恢复在线' } else { '仍不健康，请查看日志' })"
    Write-Host "  日志：python tools/remote.py run 'tail -n 50 $remoteDir/server.log'"
    Remove-Item -LiteralPath $archive -Force
    exit 1
}

[void](Invoke-Remote "printf '%s' '$localLock' > '$remoteDir/.deploy-lock-hash'; rm -f '$remoteArchive'; rm -rf '$remoteDir/dist.bak'")
Remove-Item -LiteralPath $archive -Force
Write-Host '[完成] 服务端已更新并在线。'

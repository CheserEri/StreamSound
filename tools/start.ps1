# 根目录一键启动：确保 Ubuntu 服务端在线，然后打开桌面客户端
# 用法：
#   .\tools\start.ps1                 启动服务端（如未运行）+ 客户端
#   .\tools\start.ps1 -ClientOnly     只启动客户端
#   .\tools\start.ps1 -ServerOnly     只确保服务端在线
#   .\tools\start.ps1 -NoRemote       不通过 SSH 拉起远程服务

param(
    [switch]$ClientOnly,
    [switch]$ServerOnly,
    [switch]$NoRemote
)

$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'config.ps1')
$root = Split-Path $PSScriptRoot -Parent
$config = Import-StreamSoundConfig
$hasServer = [bool]$config.Host
if (-not $hasServer -and -not $ClientOnly) {
    throw '缺少连接配置：请复制 tools\deploy.env.example 为 tools\deploy.env 并填写。'
}

$url = if ($hasServer) { Get-StreamSoundServerUrl -Config $config } else { '' }
$health = $false
if ($hasServer) {
    $health = Test-StreamSoundHealth -Config $config
    Write-Host "[服务端] $url -> $(if ($health) { '在线' } else { '未响应' })"
} else {
    Write-Warning '未配置服务器地址，按客户端本地偏好启动。'
}

if ($hasServer -and -not $health -and -not $ClientOnly) {
    if ($NoRemote) {
        Write-Warning '服务端未响应，且已指定 -NoRemote，跳过远程启动。'
    } else {
        Assert-StreamSoundConfig -Config $config
        Write-Host "[服务端] 通过 SSH $($config.User)@$($config.Host) 启动 $($config.Service) ..."
        & python (Join-Path $PSScriptRoot 'remote.py') sudo "systemctl start $($config.Service)"
        if ($LASTEXITCODE -ne 0) {
            Write-Warning '远程启动失败，请检查 Ubuntu 主机、SSH 凭据或 tools\deploy.env。'
        } else {
            for ($i = 0; $i -lt 20; $i++) {
                Start-Sleep -Milliseconds 500
                if (Test-StreamSoundHealth -Config $config) { $health = $true; break }
            }
            Write-Host "[服务端] $(if ($health) { '已恢复在线' } else { '启动后仍无响应' })"
        }
    }
}

if ($ServerOnly) {
    if ($health) { exit 0 }
    exit 1
}

$exe = Join-Path $root 'desktop\build\Release\RhineMusicDatabase.exe'
if (-not (Test-Path -LiteralPath $exe)) {
    Write-Host ''
    Write-Warning '找不到桌面端可执行文件：desktop\build\Release\RhineMusicDatabase.exe'
    Write-Host '请先构建一次（详见 README「桌面端构建」）：'
    Write-Host '  cmake -S desktop -B desktop/build -G "Visual Studio 18 2026" -A x64 -DCMAKE_PREFIX_PATH="<Qt 6.12 msvc2022_64>" -DRHINE_ENABLE_FIDELITYFX=OFF'
    Write-Host '  cmake --build desktop/build --config Release'
    exit 1
}

$resources = Join-Path (Split-Path $exe -Parent) 'resources\slots.json'
if (-not (Test-Path -LiteralPath $resources)) {
    Write-Warning '运行资源缺失（resources\slots.json），界面可能空白。请执行 desktop\scripts\export-assets.py 并复制 output\resources。'
}

if (-not $health) {
    Write-Warning '服务端仍不可用，客户端会以离线状态启动；可在设置页修改服务器地址。'
}

Write-Host "[客户端] 启动 $exe"
if ($hasServer) { $env:STREAMSOUND_SERVER = $url }
Start-Process -FilePath $exe -WorkingDirectory (Split-Path $exe -Parent)

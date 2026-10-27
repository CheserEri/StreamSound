# StreamSound 本地连接配置读取（start.ps1 / deploy.ps1 共用）

function Import-StreamSoundConfig {
    param([string]$Path = (Join-Path $PSScriptRoot 'deploy.env'))

    $config = @{
        Host       = ''
        Port       = '22'
        User       = ''
        Password   = ''
        Key        = ''
        RemoteDir  = ''
        Service    = 'streamsound'
        MusicRoot  = ''
        ServerPort = '8080'
    }

    if (Test-Path -LiteralPath $Path) {
        foreach ($line in Get-Content -LiteralPath $Path -Encoding UTF8) {
            $text = $line.Trim()
            if (-not $text -or $text.StartsWith('#') -or -not $text.Contains('=')) { continue }
            $key, $value = $text.Split('=', 2)
            $value = $value.Trim().Trim('"').Trim("'")
            switch ($key.Trim()) {
                'STREAMSOUND_SSH_HOST'    { $config.Host = $value }
                'STREAMSOUND_SSH_PORT'    { $config.Port = $value }
                'STREAMSOUND_SSH_USER'    { $config.User = $value }
                'STREAMSOUND_SSH_PASSWORD'{ $config.Password = $value }
                'STREAMSOUND_SSH_KEY'     { $config.Key = $value }
                'STREAMSOUND_REMOTE_DIR'  { $config.RemoteDir = $value }
                'STREAMSOUND_SERVICE'     { $config.Service = $value }
                'STREAMSOUND_MUSIC_ROOT'  { $config.MusicRoot = $value }
                'STREAMSOUND_PORT'        { $config.ServerPort = $value }
            }
        }
    }

    return $config
}

function Assert-StreamSoundConfig {
    param([hashtable]$Config)

    $missing = @()
    if (-not $Config.Host) { $missing += 'STREAMSOUND_SSH_HOST' }
    if (-not $Config.User) { $missing += 'STREAMSOUND_SSH_USER' }
    if (-not $Config.RemoteDir) { $missing += 'STREAMSOUND_REMOTE_DIR' }
    if ($missing.Count -gt 0) {
        throw "缺少连接配置（$($missing -join '、')）：请复制 tools\deploy.env.example 为 tools\deploy.env 并填写。"
    }
}

function Get-StreamSoundServerUrl {
    param([hashtable]$Config)
    return "http://$($Config.Host):$($Config.ServerPort)"
}

function Test-StreamSoundHealth {
    param([hashtable]$Config, [int]$TimeoutSec = 3)

    $url = "$(Get-StreamSoundServerUrl -Config $Config)/health"
    try {
        $response = Invoke-RestMethod -Uri $url -TimeoutSec $TimeoutSec -ErrorAction Stop
        return $response.status -eq 'ok'
    } catch {
        return $false
    }
}

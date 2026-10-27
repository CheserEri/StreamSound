@echo off
setlocal
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0tools\deploy.ps1" %*
set "CODE=%ERRORLEVEL%"
pause
endlocal & exit /b %CODE%

@echo off
chcp 65001 >nul

REM Diary Sync Server starter for Windows
REM Double-click this file to run the server

set SYNC_API_KEY=95042681194a5296f5eaea3cbd7519c53944f130a293ade96ae90df3b31d4c86
set PORT=3456

cd /d "%~dp0"

echo Starting Diary Sync Server...
echo Server URL: http://0.0.0.0:%PORT%
echo Tailscale URL: http://100.105.113.121:%PORT%
echo.

node dist\index.js

echo.
echo Server stopped.
pause

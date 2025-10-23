@echo off
chcp 65001 >nul
echo ========================================
echo 🎬 在线影院直播系统 - 启动脚本
echo ========================================
echo.

REM 检查 Node.js 是否安装
where node >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ 错误: 未检测到 Node.js
    echo 请先安装 Node.js: https://nodejs.org/
    pause
    exit /b 1
)

echo ✓ 已检测到 Node.js
node --version
echo.

REM 检查是否已安装依赖
if not exist "node_modules" (
    echo 📦 首次运行，正在安装依赖...
    echo.
    call npm install
    if %errorlevel% neq 0 (
        echo ❌ 依赖安装失败
        pause
        exit /b 1
    )
    echo.
)

echo 🚀 启动服务器...
echo.
echo ========================================
echo 📍 访问地址: http://localhost:3000
echo 💬 聊天服务: ws://localhost:3000
echo ========================================
echo.
echo 按 Ctrl+C 停止服务器
echo.

node server.js

pause


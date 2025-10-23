#!/bin/bash

echo "========================================"
echo "🎬 在线影院直播系统 - 启动脚本"
echo "========================================"
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误: 未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✓ 已检测到 Node.js"
node --version
echo ""

# 检查是否已安装依赖
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    echo ""
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo ""
fi

echo "🚀 启动服务器..."
echo ""
echo "========================================"
echo "📍 访问地址: http://localhost:3000"
echo "💬 聊天服务: ws://localhost:3000"
echo "========================================"
echo ""
echo "按 Ctrl+C 停止服务器"
echo ""

node server.js


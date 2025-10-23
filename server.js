const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 存储连接的用户
const clients = new Map();
let userIdCounter = 0;

// WebSocket连接处理
wss.on('connection', (ws) => {
    const userId = ++userIdCounter;
    const userInfo = {
        id: userId,
        ws: ws,
        nickname: `观众${userId}`
    };
    
    clients.set(userId, userInfo);
    console.log(`新用户连接: ${userInfo.nickname} (ID: ${userId})`);
    
    // 发送欢迎消息
    ws.send(JSON.stringify({
        type: 'system',
        message: `欢迎来到影院！您的昵称是: ${userInfo.nickname}`,
        userId: userId,
        nickname: userInfo.nickname
    }));
    
    // 广播在线人数
    broadcastOnlineCount();
    
    // 接收消息
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data);
            
            switch (message.type) {
                case 'chat':
                    // 广播聊天消息
                    const chatMessage = {
                        type: 'chat',
                        userId: userId,
                        nickname: userInfo.nickname,
                        message: message.message,
                        timestamp: new Date().toISOString()
                    };
                    broadcast(chatMessage);
                    console.log(`[${userInfo.nickname}]: ${message.message}`);
                    break;
                    
                case 'nickname':
                    // 更新昵称
                    const oldNickname = userInfo.nickname;
                    userInfo.nickname = message.nickname;
                    broadcast({
                        type: 'system',
                        message: `${oldNickname} 改名为 ${message.nickname}`
                    });
                    console.log(`用户改名: ${oldNickname} -> ${message.nickname}`);
                    break;
                    
                default:
                    console.log('未知消息类型:', message.type);
            }
        } catch (error) {
            console.error('消息处理错误:', error);
        }
    });
    
    // 断开连接
    ws.on('close', () => {
        console.log(`用户断开连接: ${userInfo.nickname} (ID: ${userId})`);
        clients.delete(userId);
        broadcast({
            type: 'system',
            message: `${userInfo.nickname} 离开了影院`
        });
        broadcastOnlineCount();
    });
    
    // 错误处理
    ws.on('error', (error) => {
        console.error(`WebSocket错误 (用户 ${userId}):`, error);
    });
});

// 广播消息给所有客户端
function broadcast(message) {
    const messageStr = JSON.stringify(message);
    clients.forEach((client) => {
        if (client.ws.readyState === WebSocket.OPEN) {
            client.ws.send(messageStr);
        }
    });
}

// 广播在线人数
function broadcastOnlineCount() {
    broadcast({
        type: 'online_count',
        count: clients.size
    });
}

// 首页路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// 健康检查
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        onlineUsers: clients.size,
        uptime: process.uptime()
    });
});

// 启动服务器
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`========================================`);
    console.log(`🎬 影院直播系统已启动`);
    console.log(`🌐 访问地址: http://localhost:${PORT}`);
    console.log(`💬 WebSocket服务: ws://localhost:${PORT}`);
    console.log(`========================================`);
});


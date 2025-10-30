# 在线直播系统

一个完整的在线观影直播系统，支持放映员通过 OBS 推流到 SRS 服务器，观众通过网页观看直播并实时聊天。

## 功能

- 🎥 **直播推流**：支持 OBS 推送电影画面和声音到云端 SRS 服务器
- 📺 **多格式支持**：支持 HTTP-FLV 和 HLS 两种直播流格式
- 💬 **实时聊天**：基于 WebSocket 的实时聊天系统
- 👥 **多人观看**：支持多人同时在线观看和交流
- ⚡ **低延迟**：针对直播场景优化，延迟控制在 1-3 秒
- 🐳 **Docker 支持**：一键部署，简单快捷

## 📋 系统架构

```
放映员电脑 (OBS) 
    ↓ RTMP推流
云端SRS服务器 (端口1935)
    ↓ HTTP-FLV/HLS分发
观众浏览器 ← WebSocket聊天 → Node.js聊天服务器
```

## 快速开始

### 方式一：Docker 部署（推荐）

1. **安装 Docker 和 Docker Compose**
   - Windows: 下载 [Docker Desktop](https://www.docker.com/products/docker-desktop)
   - Linux: `sudo apt-get install docker docker-compose`

2. **启动服务**
   ```bash
   # 克隆或下载项目
   cd cinema
   
   # 使用 Docker Compose 启动所有服务
   docker-compose up -d
   ```

3. **访问系统**
   - 打开浏览器访问: `http://localhost:3000`
   - SRS 推流地址: `rtmp://服务器IP:1935/live/房间名`
   - 直播观看地址: `http://服务器IP:8080/live/房间名.flv`

### 方式二：手动部署

#### 1. 部署 SRS 流媒体服务器

**在 Linux 服务器上：**

```bash
# 下载 SRS
wget https://github.com/ossrs/srs/releases/download/v5.0-r0/SRS-CentOS7-x86_64-5.0.187.tar.gz
tar -xzf SRS-CentOS7-x86_64-5.0.187.tar.gz
cd SRS-CentOS7-x86_64-5.0.187

# 使用项目提供的配置文件
cp /path/to/cinema/srs.conf ./conf/

# 启动 SRS
./objs/srs -c conf/srs.conf
```

**或使用 Docker：**

```bash
docker run -d \
  --name srs \
  -p 1935:1935 \
  -p 1985:1985 \
  -p 8080:8080 \
  -v $(pwd)/srs.conf:/usr/local/srs/conf/srs.conf \
  ossrs/srs:5
```

#### 2. 部署 Node.js 聊天服务器

```bash
# 安装依赖
npm install

# 启动服务器
npm start

# 或使用 PM2 守护进程
npm install -g pm2
pm2 start server.js --name cinema-chat
```

## 🎬 使用指南

### 一、放映员推流设置（OBS）

#### 1. 下载安装 OBS
- 访问 [OBS 官网](https://obsproject.com/) 下载并安装

#### 2. 配置推流设置

1. **打开 OBS，点击 "设置"**

2. **进入 "推流" 选项卡**
   - 服务：选择 "自定义"
   - 服务器：`rtmp://你的服务器IP:1935/live`
   - 串流密钥：`room`（可以自定义房间名）

3. **视频设置建议**（设置 → 视频）
   - 基础分辨率：1920x1080
   - 输出分辨率：1920x1080 或 1280x720
   - 帧率：25 或 30 FPS

4. **输出设置建议**（设置 → 输出）
   - 输出模式：简单
   - 视频比特率：2500-4000 Kbps（根据网络调整）
   - 编码器：x264
   - 音频比特率：128 Kbps

#### 3. 添加播放源

1. **在 "来源" 区域点击 "+"**
2. **选择 "窗口捕获" 或 "显示器捕获"**
   - 窗口捕获：捕获特定播放器窗口（推荐）
   - 显示器捕获：捕获整个屏幕
3. **添加 "音频输出捕获"** 来捕获系统声音

#### 4. 开始推流

1. **点击 "开始推流" 按钮**
2. **在本地播放器播放电影**
3. **观众即可通过网页观看**

### 二、观众观看和聊天

#### 1. 打开网页
访问：`http://服务器IP:3000`

#### 2. 输入直播流地址

在页面顶部输入框中输入：
- **HTTP-FLV（推荐，低延迟）**：
  ```
  http://服务器IP:8080/live/room.flv
  ```
- **HLS（兼容性好）**：
  ```
  http://服务器IP:8080/live/room.m3u8
  ```

> 注意：`room` 是房间名，需要与 OBS 推流的串流密钥一致

#### 3. 点击播放

点击 "▶ 开始播放" 按钮即可观看直播

#### 4. 实时聊天

1. **设置昵称**：在聊天区域输入昵称并点击 "设置"
2. **发送消息**：在消息框输入内容，按回车或点击 "发送"
3. **查看在线人数**：页面右上角显示当前在线人数

## 🔧 配置说明

### SRS 配置文件 (`srs.conf`)

```conf
listen              1935;           # RTMP 推流端口
http_server.listen  8080;           # HTTP-FLV/HLS 拉流端口
http_api.listen     1985;           # HTTP API 端口

vhost __defaultVhost__ {
    http_remux.enabled  on;         # 启用 HTTP-FLV
    hls.enabled         on;         # 启用 HLS
    gop_cache           on;         # GOP 缓存，减少首屏等待
    min_latency         on;         # 低延迟模式
}
```

### Node.js 服务器配置

在 `server.js` 中可以修改端口：
```javascript
const PORT = process.env.PORT || 3000;
```

或通过环境变量设置：
```bash
PORT=8000 npm start
```

## 📊 端口说明

| 端口 | 协议 | 用途 |
|------|------|------|
| 1935 | RTMP | OBS 推流端口 |
| 8080 | HTTP | 直播流分发端口 (FLV/HLS) |
| 1985 | HTTP | SRS API 管理端口 |
| 3000 | HTTP/WebSocket | Web 界面和聊天服务 |

## 🌐 云服务器部署建议

### 1. 服务器配置推荐

- **基础配置**：2核 4GB 内存，5Mbps 带宽
- **中等配置**：4核 8GB 内存，10Mbps 带宽（支持 5-10 人同时观看）
- **高级配置**：8核 16GB 内存，20Mbps+ 带宽（支持 20+ 人同时观看）

### 2. 云服务商推荐

- 阿里云 ECS
- 腾讯云 CVM
- 华为云 ECS
- AWS EC2
- Azure VM

### 3. 防火墙设置

确保开放以下端口：
```bash
# CentOS/RHEL
firewall-cmd --permanent --add-port=1935/tcp
firewall-cmd --permanent --add-port=8080/tcp
firewall-cmd --permanent --add-port=1985/tcp
firewall-cmd --permanent --add-port=3000/tcp
firewall-cmd --reload

# Ubuntu/Debian
ufw allow 1935/tcp
ufw allow 8080/tcp
ufw allow 1985/tcp
ufw allow 3000/tcp
```

### 4. 域名配置（可选）

如果有域名，可以配置 Nginx 反向代理：

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Web 界面
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }

    # 直播流
    location /live/ {
        proxy_pass http://localhost:8080/live/;
    }
}
```

## 常见问题

### 1. 推流失败

**问题**：OBS 提示 "连接失败" 或 "无法连接到服务器"

**解决**：
- 检查服务器 IP 地址是否正确
- 确认 1935 端口已开放
- 检查 SRS 服务是否正常运行：`ps aux | grep srs`

### 2. 网页无法播放

**问题**：点击播放后没有画面

**解决**：
- 确认直播流地址格式正确
- 检查放映员是否已经开始推流
- 打开浏览器控制台查看错误信息
- 尝试更换直播流格式（FLV ↔ HLS）

### 3. 聊天功能不工作

**问题**：无法发送消息或显示 "未连接"

**解决**：
- 检查 Node.js 服务器是否运行
- 确认 3000 端口已开放
- 查看浏览器控制台 WebSocket 连接状态

### 4. 延迟太高

**问题**：直播延迟超过 5 秒

**解决**：
- 使用 HTTP-FLV 代替 HLS（HLS 延迟通常 10-30 秒）
- 在 `srs.conf` 中启用 `min_latency on`
- 降低 OBS 的缓冲设置
- 检查网络带宽是否充足

### 5. 画面卡顿

**问题**：播放时画面卡顿或马赛克

**解决**：
- 降低 OBS 视频比特率（推荐 2500 Kbps）
- 降低输出分辨率（使用 720p 代替 1080p）
- 检查服务器带宽是否充足
- 检查推流端网络是否稳定

## 📖 技术栈

- **前端**：HTML5, CSS3, JavaScript (ES6+)
- **后端**：Node.js, Express, WebSocket (ws)
- **流媒体**：SRS (Simple Realtime Server)
- **视频播放**：flv.js, hls.js
- **推流工具**：OBS (Open Broadcaster Software)

## 直播流格式对比

| 格式 | 延迟 | 兼容性 | 推荐场景 |
|------|------|--------|----------|
| HTTP-FLV | 1-3秒 | 需要 flv.js | 低延迟要求，PC 端 |
| HLS | 10-30秒 | 最好，原生支持 | 移动端，兼容性优先 |

## 💡 更多帮助

如有问题，请查看：
- [SRS 官方文档](https://ossrs.net/)
- [OBS 使用指南](https://obsproject.com/wiki/)
- [flv.js GitHub](https://github.com/bilibili/flv.js)

---

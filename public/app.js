// WebSocket 连接
let ws = null;
let userId = null;
let currentNickname = null;
let flvPlayer = null;
let hlsPlayer = null;

// DOM 元素
const elements = {
    videoPlayer: document.getElementById('videoPlayer'),
    videoOverlay: document.getElementById('videoOverlay'),
    streamUrl: document.getElementById('streamUrl'),
    playBtn: document.getElementById('playBtn'),
    stopBtn: document.getElementById('stopBtn'),
    chatMessages: document.getElementById('chatMessages'),
    messageInput: document.getElementById('messageInput'),
    sendBtn: document.getElementById('sendBtn'),
    nicknameInput: document.getElementById('nicknameInput'),
    setNicknameBtn: document.getElementById('setNicknameBtn'),
    onlineCount: document.getElementById('onlineCount'),
    statusText: document.getElementById('statusText'),
    connectionStatus: document.getElementById('connectionStatus'),
    themeToggle: document.getElementById('themeToggle')
};

// 初始化
function init() {
    connectWebSocket();
    setupEventListeners();
    setupTheme();
}

// 主题切换
function setupTheme() {
    const themeToggle = elements.themeToggle;
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const docElement = document.documentElement;

    const applyTheme = (theme) => {
        docElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        themeIcon.textContent = theme === 'dark' ? '🌙' : '🌞';
    };

    // 页面加载时应用保存的主题
    const savedTheme = localStorage.getItem('theme') || 'light';
    applyTheme(savedTheme);

    // 点击切换主题
    themeToggle.addEventListener('click', () => {
        const currentTheme = docElement.getAttribute('data-theme');
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        applyTheme(newTheme);
    });
}

// 连接 WebSocket
function connectWebSocket() {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    try {
        ws = new WebSocket(wsUrl);
        
        ws.onopen = () => {
            console.log('WebSocket 连接成功');
            updateConnectionStatus('connected');
            elements.messageInput.disabled = false;
            elements.sendBtn.disabled = false;
            addSystemMessage('已连接到聊天服务器');
        };
        
        ws.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);
                handleWebSocketMessage(data);
            } catch (error) {
                console.error('消息解析错误:', error);
            }
        };
        
        ws.onclose = () => {
            console.log('WebSocket 连接关闭');
            updateConnectionStatus('disconnected');
            elements.messageInput.disabled = true;
            elements.sendBtn.disabled = true;
            addSystemMessage('与服务器断开连接，5秒后重连...');
            
            // 5秒后重连
            setTimeout(connectWebSocket, 5000);
        };
        
        ws.onerror = (error) => {
            console.error('WebSocket 错误:', error);
            updateConnectionStatus('disconnected');
        };
        
    } catch (error) {
        console.error('WebSocket 连接失败:', error);
        updateConnectionStatus('disconnected');
    }
}

// 处理 WebSocket 消息
function handleWebSocketMessage(data) {
    switch (data.type) {
        case 'system':
            addSystemMessage(data.message);
            if (data.userId && !userId) {
                userId = data.userId;
                currentNickname = data.nickname;
                elements.nicknameInput.value = currentNickname;
            }
            break;
            
        case 'chat':
            addChatMessage(data);
            break;
            
        case 'online_count':
            elements.onlineCount.textContent = data.count;
            break;
            
        default:
            console.log('未知消息类型:', data.type);
    }
}

// 更新连接状态
function updateConnectionStatus(status) {
    const statusDot = elements.connectionStatus.querySelector('.status-dot');
    statusDot.className = 'status-dot ' + status;
    
    const statusTexts = {
        connected: '已连接',
        disconnected: '未连接',
        connecting: '连接中...'
    };
    
    elements.statusText.textContent = statusTexts[status] || '未知状态';
}

// 添加系统消息
function addSystemMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'system-message';
    messageDiv.textContent = message;
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 添加聊天消息
function addChatMessage(data) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    
    const time = new Date(data.timestamp).toLocaleTimeString('zh-CN', {
        hour: '2-digit',
        minute: '2-digit'
    });
    
    messageDiv.innerHTML = `
        <div class="message-header">
            <span class="message-nickname">${escapeHtml(data.nickname)}</span>
            <span class="message-time">${time}</span>
        </div>
        <div class="message-content">${escapeHtml(data.message)}</div>
    `;
    
    elements.chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// 滚动到底部
function scrollToBottom() {
    elements.chatMessages.scrollTop = elements.chatMessages.scrollHeight;
}

// 转义 HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 发送聊天消息
function sendMessage() {
    const message = elements.messageInput.value.trim();
    
    if (!message) {
        return;
    }
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('未连接到服务器，无法发送消息');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'chat',
        message: message
    }));
    
    elements.messageInput.value = '';
}

// 设置昵称
function setNickname() {
    const nickname = elements.nicknameInput.value.trim();
    
    if (!nickname) {
        alert('请输入昵称');
        return;
    }
    
    if (nickname.length > 20) {
        alert('昵称不能超过20个字符');
        return;
    }
    
    if (!ws || ws.readyState !== WebSocket.OPEN) {
        alert('未连接到服务器');
        return;
    }
    
    ws.send(JSON.stringify({
        type: 'nickname',
        nickname: nickname
    }));
    
    currentNickname = nickname;
    addSystemMessage(`昵称已设置为: ${nickname}`);
}

// 播放视频
function playVideo() {
    const url = elements.streamUrl.value.trim();
    
    if (!url) {
        alert('请输入直播流地址');
        return;
    }
    
    // 停止之前的播放
    stopVideo();
    
    try {
        // 根据URL判断使用FLV还是HLS
        if (url.endsWith('.flv') || url.includes('.flv?')) {
            // 使用 flv.js 播放 FLV
            playFlvStream(url);
        } else if (url.endsWith('.m3u8') || url.includes('.m3u8?')) {
            // 使用 hls.js 播放 HLS
            playHlsStream(url);
        } else {
            // 尝试原生播放
            playNativeStream(url);
        }
        
        elements.videoOverlay.classList.add('hidden');
        elements.playBtn.disabled = true;
        elements.stopBtn.disabled = false;
        addSystemMessage('开始播放直播流');
        
    } catch (error) {
        console.error('播放失败:', error);
        alert('播放失败: ' + error.message);
    }
}

// 播放 FLV 流
function playFlvStream(url) {
    if (!flvjs.isSupported()) {
        throw new Error('您的浏览器不支持 FLV 播放');
    }
    
    flvPlayer = flvjs.createPlayer({
        type: 'flv',
        url: url,
        isLive: true,
        hasAudio: true,
        hasVideo: true
    }, {
        enableWorker: false,
        enableStashBuffer: false,
        stashInitialSize: 128,
        autoCleanupSourceBuffer: true
    });
    
    flvPlayer.attachMediaElement(elements.videoPlayer);
    flvPlayer.load();
    flvPlayer.play();
    
    flvPlayer.on(flvjs.Events.ERROR, (errorType, errorDetail, errorInfo) => {
        console.error('FLV播放错误:', errorType, errorDetail, errorInfo);
        addSystemMessage('视频播放出错，请检查直播流地址');
    });
}

// 播放 HLS 流
function playHlsStream(url) {
    if (Hls.isSupported()) {
        hlsPlayer = new Hls({
            enableWorker: true,
            lowLatencyMode: true
        });
        
        hlsPlayer.loadSource(url);
        hlsPlayer.attachMedia(elements.videoPlayer);
        
        hlsPlayer.on(Hls.Events.MANIFEST_PARSED, () => {
            elements.videoPlayer.play();
        });
        
        hlsPlayer.on(Hls.Events.ERROR, (event, data) => {
            console.error('HLS播放错误:', data);
            if (data.fatal) {
                addSystemMessage('视频播放出错，请检查直播流地址');
            }
        });
    } else if (elements.videoPlayer.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari 原生支持 HLS
        elements.videoPlayer.src = url;
        elements.videoPlayer.play();
    } else {
        throw new Error('您的浏览器不支持 HLS 播放');
    }
}

// 原生播放
function playNativeStream(url) {
    elements.videoPlayer.src = url;
    elements.videoPlayer.play();
}

// 停止视频
function stopVideo() {
    // 停止 FLV 播放器
    if (flvPlayer) {
        flvPlayer.pause();
        flvPlayer.unload();
        flvPlayer.detachMediaElement();
        flvPlayer.destroy();
        flvPlayer = null;
    }
    
    // 停止 HLS 播放器
    if (hlsPlayer) {
        hlsPlayer.destroy();
        hlsPlayer = null;
    }
    
    // 停止原生播放
    elements.videoPlayer.pause();
    elements.videoPlayer.src = '';
    
    elements.videoOverlay.classList.remove('hidden');
    elements.playBtn.disabled = false;
    elements.stopBtn.disabled = true;
    addSystemMessage('已停止播放');
}

// 设置事件监听器
function setupEventListeners() {
    // 发送消息
    elements.sendBtn.addEventListener('click', sendMessage);
    elements.messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    // 设置昵称
    elements.setNicknameBtn.addEventListener('click', setNickname);
    elements.nicknameInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            setNickname();
        }
    });
    
    // 播放/停止视频
    elements.playBtn.addEventListener('click', playVideo);
    elements.stopBtn.addEventListener('click', stopVideo);
    
    // 直播流地址输入框回车播放
    elements.streamUrl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            playVideo();
        }
    });
}

// 页面加载完成后初始化
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}


// 增强版主脚本 - 集成实时视觉检测

// 扩展原script.js的功能
const EnhancedSystem = {
    // 初始化增强系统
    async init() {
        console.log('初始化增强系统...');

        // 等待原系统初始化
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 初始化真实检测器
        await this.initRealDetector();

        // 设置增强事件监听器
        this.setupEnhancedListeners();

        console.log('增强系统初始化完成');
    },

    // 初始化真实检测器
    async initRealDetector() {
        try {
            this.realDetector = await initRealDetector();

            if (this.realDetector.isModelLoaded) {
                this.showModelStatus('success', 'AI视觉模型已加载');
            } else {
                this.showModelStatus('warning', '使用模拟检测模式');
            }
        } catch (error) {
            console.error('初始化真实检测器失败:', error);
            this.showModelStatus('error', '检测器初始化失败');
        }
    },

    // 显示模型状态
    showModelStatus(type, message) {
        const statusElement = document.createElement('div');
        statusElement.className = `model-status model-status-${type}`;
        statusElement.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' :
                type === 'warning' ? 'exclamation-triangle' : 'exclamation-circle'}"></i>
            <span>${message}</span>
        `;

        // 添加到导航栏
        const navActions = document.querySelector('.nav-actions');
        navActions.insertBefore(statusElement, navActions.firstChild);

        // 5秒后自动隐藏
        setTimeout(() => {
            statusElement.style.opacity = '0';
            setTimeout(() => statusElement.remove(), 500);
        }, 5000);
    },

    // 设置增强事件监听器
    setupEnhancedListeners() {
        // 替换原startDetection函数
        const originalStartDetection = window.startDetection;

        window.startDetection = async function () {
            if (!videoSource) {
                showToast('请先选择视频源', 'warning');
                return;
            }

            // 尝试获取视频元素
            const videoElement = await EnhancedSystem.setupVideoSource();
            if (!videoElement) {
                showToast('无法获取视频流', 'error');
                return;
            }

            // 更新UI状态
            isDetecting = true;
            document.getElementById('start-btn').disabled = true;
            document.getElementById('stop-btn').disabled = false;
            document.getElementById('status-indicator').className = 'status online';
            document.getElementById('connection-status').textContent = '检测中';

            // 启动真实检测器
            if (EnhancedSystem.realDetector) {
                const success = await EnhancedSystem.realDetector.start(videoElement);
                if (!success) {
                    showToast('启动AI检测失败，使用模拟模式', 'warning');
                    // 降级到模拟检测
                    startDetectionSimulation();
                }
            } else {
                // 使用模拟检测
                startDetectionSimulation();
            }

            addLog('检测系统', 'info', '开始实时视觉检测');
            showToast('实时检测已开始', 'success');
        };

        // 替换原stopDetection函数
        const originalStopDetection = window.stopDetection;

        window.stopDetection = function () {
            if (!isDetecting) return;

            isDetecting = false;

            // 停止真实检测器
            if (EnhancedSystem.realDetector) {
                EnhancedSystem.realDetector.stop();
            }

            // 停止模拟检测
            stopDetectionSimulation();

            // 更新UI状态
            document.getElementById('start-btn').disabled = false;
            document.getElementById('stop-btn').disabled = true;
            document.getElementById('status-indicator').className = 'status offline';
            document.getElementById('connection-status').textContent = '离线';

            addLog('检测系统', 'info', '检测已停止');
            showToast('检测已停止', 'info');
        };

        // 增强视频源设置
        this.setupEnhancedVideoSource();
    },

    // 设置增强视频源
    setupEnhancedVideoSource() {
        // 监听视频源变化
        document.querySelectorAll('.source-option').forEach(option => {
            option.addEventListener('click', async function () {
                videoSource = this.getAttribute('data-source');

                // 尝试设置视频源
                await EnhancedSystem.setupVideoSource();
            });
        });
    },

    // 设置视频源
    async setupVideoSource() {
        try {
            const canvas = document.getElementById('video-canvas');
            if (!canvas) return null;

            let stream = null;

            switch (videoSource) {
                case 'camera':
                    stream = await this.getCameraStream();
                    break;
                case 'video':
                    stream = await this.getVideoStream();
                    break;
                case 'url':
                    stream = await this.getUrlStream();
                    break;
                default:
                    return null;
            }

            if (!stream) return null;

            // 创建视频元素（隐藏）
            let videoElement = document.getElementById('real-video');
            if (!videoElement) {
                videoElement = document.createElement('video');
                videoElement.id = 'real-video';
                videoElement.style.display = 'none';
                videoElement.autoplay = true;
                videoElement.playsInline = true;
                document.body.appendChild(videoElement);
            }

            videoElement.srcObject = stream;

            // 等待视频就绪
            await new Promise(resolve => {
                videoElement.onloadedmetadata = () => {
                    videoElement.play();
                    resolve();
                };
            });

            return videoElement;
        } catch (error) {
            console.error('设置视频源失败:', error);
            return null;
        }
    },

    // 获取摄像头流
    async getCameraStream() {
        try {
            const constraints = {
                video: {
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                    facingMode: 'environment'
                }
            };

            return await navigator.mediaDevices.getUserMedia(constraints);
        } catch (error) {
            console.error('获取摄像头失败:', error);
            return null;
        }
    },

    // 获取视频文件流
    async getVideoStream() {
        const fileInput = document.getElementById('video-file');
        if (!fileInput.files || fileInput.files.length === 0) {
            return null;
        }

        const file = fileInput.files[0];
        const url = URL.createObjectURL(file);

        // 创建视频元素来播放文件
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;

        // 创建CanvasCaptureMediaStream
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        video.onloadedmetadata = () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;

            // 开始绘制循环
            function drawFrame() {
                if (video.paused || video.ended) return;

                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                requestAnimationFrame(drawFrame);
            }

            video.play();
            drawFrame();
        };

        // 返回Canvas的MediaStream
        return canvas.captureStream();
    },

    // 获取网络流
    async getUrlStream() {
        const urlInput = document.getElementById('stream-url');
        const url = urlInput.value.trim();

        if (!url) return null;

        // 创建视频元素来播放网络流
        const video = document.createElement('video');
        video.src = url;
        video.muted = true;

        // 对于真正的流媒体，可能需要使用专门的库
        // 这里简化处理

        return null;
    },

    // 增强视频帧绘制
    enhanceVideoFrame() {
        const originalSimulateVideoFrame = window.simulateVideoFrame;

        window.simulateVideoFrame = function () {
            const canvas = document.getElementById('video-canvas');
            const ctx = canvas.getContext('2d');

            // 设置画布大小
            if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
                canvas.width = canvas.clientWidth;
                canvas.height = canvas.clientHeight;
            }

            // 尝试绘制真实视频
            const videoElement = document.getElementById('real-video');
            if (videoElement && videoElement.srcObject && !videoElement.paused) {
                try {
                    ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
                    return;
                } catch (error) {
                    console.warn('绘制真实视频失败:', error);
                }
            }

            // 降级到模拟绘制
            originalSimulateVideoFrame.call(this);
        };
    }
};

// 在DOM加载后初始化增强系统
document.addEventListener('DOMContentLoaded', async function () {
    // 等待原系统初始化
    setTimeout(async () => {
        await EnhancedSystem.init();
    }, 2000);
});
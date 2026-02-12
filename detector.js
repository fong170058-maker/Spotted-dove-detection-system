// 检测逻辑模块（模拟版本）
const Detector = {
    // 检测状态
    isRunning: false,
    videoSource: null,
    detectionMode: 'optimized',

    // 配置参数
    config: {
        confidenceThreshold: 0.4,
        minArea: 300,
        maxArea: 5000,
        showBoxes: true,
        showTrails: true,
        showLabels: true,
        showConfidence: true
    },

    // 初始化检测器
    init(config = {}) {
        this.config = { ...this.config, ...config };
        console.log('检测器初始化完成');
    },

    // 开始检测
    start(source) {
        if (this.isRunning) {
            console.warn('检测器已在运行中');
            return false;
        }

        this.videoSource = source;
        this.isRunning = true;

        console.log(`检测开始 - 模式: ${this.detectionMode}, 源: ${source}`);
        return true;
    },

    // 停止检测
    stop() {
        if (!this.isRunning) {
            console.warn('检测器未在运行');
            return false;
        }

        this.isRunning = false;
        this.videoSource = null;

        console.log('检测已停止');
        return true;
    },

    // 处理视频帧（模拟）
    processFrame(frameData) {
        if (!this.isRunning) return null;

        // 模拟检测逻辑
        const detections = this.simulateDetections();

        // 应用配置
        const processedDetections = detections.map(det => {
            // 应用信心阈值
            if (det.confidence < this.config.confidenceThreshold) {
                return null;
            }

            // 应用面积过滤
            if (det.area < this.config.minArea || det.area > this.config.maxArea) {
                return null;
            }

            return det;
        }).filter(det => det !== null);

        return {
            timestamp: new Date().toISOString(),
            detections: processedDetections,
            count: processedDetections.length,
            averageConfidence: processedDetections.length > 0 ?
                processedDetections.reduce((sum, d) => sum + d.confidence, 0) / processedDetections.length : 0
        };
    },

    // 模拟检测结果
    simulateDetections() {
        // 生成随机数量的检测
        const count = Math.floor(Math.random() * 8) + 1;
        const detections = [];

        for (let i = 0; i < count; i++) {
            detections.push({
                id: i + 1,
                confidence: 0.5 + Math.random() * 0.5, // 0.5-1.0
                bbox: {
                    x: Math.random() * 600,
                    y: Math.random() * 400,
                    width: 50 + Math.random() * 100,
                    height: 40 + Math.random() * 80
                },
                area: 0,
                center: { x: 0, y: 0 },
                color: this.getRandomColor()
            });

            // 计算面积和中心点
            const bbox = detections[i].bbox;
            detections[i].area = bbox.width * bbox.height;
            detections[i].center.x = bbox.x + bbox.width / 2;
            detections[i].center.y = bbox.y + bbox.height / 2;
        }

        return detections;
    },

    // 获取随机颜色
    getRandomColor() {
        const colors = [
            '#3498db', // 蓝色
            '#2ecc71', // 绿色
            '#e74c3c', // 红色
            '#f39c12', // 橙色
            '#9b59b6', // 紫色
            '#1abc9c', // 青色
            '#d35400', // 棕色
            '#c0392b'  // 深红
        ];

        return colors[Math.floor(Math.random() * colors.length)];
    },

    // 更新配置
    updateConfig(newConfig) {
        this.config = { ...this.config, ...newConfig };
        console.log('检测器配置已更新', this.config);
    },

    // 获取当前配置
    getConfig() {
        return { ...this.config };
    },

    // 设置检测模式
    setDetectionMode(mode) {
        const validModes = ['optimized', 'yolo', 'simple', 'motion'];
        if (validModes.includes(mode)) {
            this.detectionMode = mode;
            console.log(`检测模式已更改为: ${mode}`);
            return true;
        }
        console.error(`无效的检测模式: ${mode}`);
        return false;
    },

    // 执行系统校准
    calibrate() {
        console.log('开始系统校准...');

        // 模拟校准过程
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('系统校准完成');
                resolve({
                    success: true,
                    samples: 30,
                    accuracyImprovement: '20-30%',
                    features: ['颜色', '形状', '纹理']
                });
            }, 2000);
        });
    },

    // 重置检测器
    reset() {
        this.stop();
        this.videoSource = null;
        this.detectionMode = 'optimized';
        console.log('检测器已重置');
    }
};

// 导出为全局变量
window.Detector = Detector;

// 初始化检测器
Detector.init();
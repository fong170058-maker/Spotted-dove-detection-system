// 高级生物统计联动引擎 - 网站 B 核心逻辑
class ConnectedAnalyticsEngine {
    constructor() {
        this.isActive = false;
        this.totalFramesReceived = 0;
        this.anomaliesCount = 0;
        
        // 创建相同的跨标签网络管道
        this.receiverChannel = new BroadcastChannel('dove_analytics_pipeline');
        
        // 动态图标数据高速缓存区
        this.timeLabels = [];
        this.confidenceHistory = []; 
        this.countHistory = [];      
        this.chartInstance = null;
    }

    init() {
        this.setupChart();
        this.startPipelineListener();
        this.bindEvents();
    }

    setupChart() {
        const ctx = document.getElementById('analytics-chart').getContext('2d');
        
        // 预填充20个数据点占位，保证平滑滚动横轴
        for(let i = 19; i >= 0; i--) { 
            this.timeLabels.push(`T-${i}s`); 
            this.confidenceHistory.push(0); 
            this.countHistory.push(0); 
        }

        this.chartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.timeLabels,
                datasets: [
                    {
                        label: '瞬时最大匹配置信度 (Live Max Confidence)',
                        data: this.confidenceHistory,
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        fill: true,
                        tension: 0.3,
                        yAxisID: 'y'
                    },
                    {
                        label: '当前画面斑鸠数量 (Current Bird Count)',
                        data: this.countHistory,
                        borderColor: '#9b59b6',
                        borderDash: [5, 5],
                        fill: false,
                        tension: 0.1,
                        yAxisID: 'y1'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        min: 0,
                        max: 1.0,
                        title: { display: true, text: '置信度百分比' }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        min: 0,
                        max: 10,
                        grid: { drawOnChartArea: false }, // 避免双网格线重叠混乱
                        title: { display: true, text: '生物数量 (只)' }
                    }
                }
            }
        });
    }

    startPipelineListener() {
        // 拦截来自网站 A 发出的每一帧数据心跳
        this.receiverChannel.onmessage = (event) => {
            const data = event.data;
            
            // 首次收到数据，切换连接状态UI
            if (!this.isActive) {
                this.isActive = true;
                this.toggleConnectionUI(true);
            }

            this.processTelemetryTick(data);
        };
    }

    toggleConnectionUI(connected) {
        const linkStatus = document.getElementById('link-status');
        const sysStatus = document.getElementById('system-status');
        const statusBox = document.querySelector('.status-box');

        if (connected) {
            linkStatus.textContent = "已成功建立数据联动总线";
            linkStatus.className = "text-success";
            statusBox.style.borderLeftColor = "#2ecc71";
            sysStatus.textContent = "联动的分析中";
            sysStatus.className = "text-success";
            this.addLog("✅ 跨域数据总线绑定成功。接收数据流中...", "system");
        }
    }

    processTelemetryTick(payload) {
        this.totalFramesReceived++;
        
        // 1. 刷新卡片核心指标数据
        document.getElementById('stat-total-samples').textContent = payload.totalDetections.toLocaleString();
        document.getElementById('stat-tps').textContent = `${payload.fps.toFixed(1)} FPS`;

        // 2. 检测低置信度异常值事件 (有鸟但置信度低于系统的设定阈值范围0.45)
        if (payload.currentDetections > 0 && payload.confidencePeak < 0.45) {
            this.anomaliesCount++;
            document.getElementById('stat-anomalies').textContent = this.anomaliesCount;
            this.addLog(`⚠️ 置信度边缘异常告警! 画面捕捉到生物但模型把握度较低 (仅 ${(payload.confidencePeak * 100).toFixed(1)}%)`, "anomaly");
        } else if (payload.currentDetections > 0) {
            this.addLog(`🕊️ 捕获目标: 当前画面出现 ${payload.currentDetections} 隻鸟类，最高置信度: ${(payload.confidencePeak * 100).toFixed(1)}%`);
        }

        // 3. 滚动并推入图表数组
        this.timeLabels.shift();
        this.timeLabels.push(payload.timestamp);

        this.confidenceHistory.shift();
        this.confidenceHistory.push(payload.confidencePeak);

        this.countHistory.shift();
        this.countHistory.push(payload.currentDetections);

        // 更新 Chart 实例 (使用 'none' 参数关闭冗余动画，确保高速更新时不卡顿)
        this.chartInstance.update('none');

        // 4. 高级统计指标数学计算
        this.calculateDescriptiveStats();
    }

    calculateDescriptiveStats() {
        // 过滤掉所有未发现鸟类的 0 值帧，计算真正的鸟类平均表现
        const activeSamples = this.confidenceHistory.filter(v => v > 0);
        if (activeSamples.length === 0) return;

        // 算术平均数
        const mean = activeSamples.reduce((a, b) => a + b, 0) / activeSamples.length;
        
        // 中位数
        const sorted = [...activeSamples].sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)];
        
        // 方差
        const variance = activeSamples.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / activeSamples.length;

        document.getElementById('tbl-mean').textContent = `${(mean * 100).toFixed(2)}%`;
        document.getElementById('tbl-median').textContent = `${(median * 100).toFixed(1)}%`;
        document.getElementById('tbl-variance').textContent = variance.toFixed(5);

        // 动态修改方差偏离状态
        const varStatus = document.getElementById('tbl-var-status');
        if (variance > 0.02) {
            varStatus.textContent = "环境震荡/不稳定";
            varStatus.className = "text-danger";
        } else {
            varStatus.textContent = "分布高度收敛";
            varStatus.className = "text-success";
        }
    }

    bindEvents() {
        document.getElementById('export-btn').addEventListener('click', () => {
            const dumpData = {
                exportedAt: new Date().toISOString(),
                totalFramesProcessed: this.totalFramesReceived,
                lowConfidenceEvents: this.anomaliesCount,
                bufferedConfidenceDataset: this.confidenceHistory
            };
            
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dumpData, null, 2));
            const downloadAnchor = document.createElement('a');
            downloadAnchor.setAttribute("href", dataStr);
            downloadAnchor.setAttribute("download", `spotted_dove_stat_report_${Date.now()}.json`);
            document.body.appendChild(downloadAnchor);
            downloadAnchor.click();
            downloadAnchor.remove();
        });
    }

    addLog(message, type = "") {
        const stream = document.getElementById('log-stream');
        if (!stream) return;
        const item = document.createElement('div');
        item.className = `log-item ${type}`;
        item.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        stream.appendChild(item);
        stream.scrollTop = stream.scrollHeight;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const app = new ConnectedAnalyticsEngine();
    app.init();
});
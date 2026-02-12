// 数据管理模块
const DataManager = {
    // 模拟数据库
    database: {
        sessions: [],
        detections: [],
        settings: {},
        logs: []
    },

    // 初始化
    init() {
        this.loadFromStorage();
        this.seedDemoData();
    },

    // 从本地存储加载
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('doveSystemData');
            if (saved) {
                this.database = JSON.parse(saved);
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
    },

    // 保存到本地存储
    saveToStorage() {
        try {
            localStorage.setItem('doveSystemData', JSON.stringify(this.database));
        } catch (e) {
            console.error('保存数据失败:', e);
        }
    },

    // 种子数据（演示用）
    seedDemoData() {
        if (this.database.sessions.length === 0) {
            const now = new Date();

            // 创建演示会话
            for (let i = 0; i < 30; i++) {
                const date = new Date(now);
                date.setDate(date.getDate() - Math.floor(Math.random() * 30));
                date.setHours(Math.floor(Math.random() * 24));
                date.setMinutes(Math.floor(Math.random() * 60));

                this.database.sessions.push({
                    id: `session_${i + 1}`,
                    timestamp: date.toISOString(),
                    duration: 1800 + Math.random() * 3600,
                    detectionCount: Math.floor(Math.random() * 50) + 10,
                    trackCount: Math.floor(Math.random() * 30) + 5,
                    totalCount: Math.floor(Math.random() * 200) + 50,
                    fps: 25 + Math.random() * 10,
                    confidence: 0.7 + Math.random() * 0.3,
                    mode: ['optimized', 'yolo', 'simple'][Math.floor(Math.random() * 3)],
                    fileSize: (500 + Math.random() * 1500) * 1024
                });
            }

            // 创建演示检测记录
            for (let i = 0; i < 100; i++) {
                const date = new Date(now);
                date.setMinutes(date.getMinutes() - Math.floor(Math.random() * 1440));

                this.database.detections.push({
                    id: `det_${i + 1}`,
                    sessionId: `session_${Math.floor(Math.random() * 30) + 1}`,
                    timestamp: date.toISOString(),
                    confidence: 0.6 + Math.random() * 0.4,
                    bbox: {
                        x: Math.random() * 600,
                        y: Math.random() * 400,
                        w: 50 + Math.random() * 100,
                        h: 40 + Math.random() * 80
                    },
                    trackId: Math.floor(Math.random() * 20),
                    imageData: null
                });
            }

            this.saveToStorage();
        }
    },

    // 添加新会话
    addSession(sessionData) {
        const session = {
            id: `session_${Date.now()}`,
            timestamp: new Date().toISOString(),
            ...sessionData
        };

        this.database.sessions.push(session);
        this.saveToStorage();
        return session;
    },

    // 获取所有会话
    getAllSessions() {
        return [...this.database.sessions].sort((a, b) =>
            new Date(b.timestamp) - new Date(a.timestamp)
        );
    },

    // 根据时间范围获取会话
    getSessionsByDateRange(startDate, endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);

        return this.database.sessions.filter(session => {
            const sessionDate = new Date(session.timestamp);
            return sessionDate >= start && sessionDate <= end;
        });
    },

    // 根据模式获取会话
    getSessionsByMode(mode) {
        if (mode === 'all') return this.getAllSessions();
        return this.database.sessions.filter(session => session.mode === mode);
    },

    // 获取会话统计
    getSessionStats() {
        const sessions = this.database.sessions;
        if (sessions.length === 0) return null;

        const totalDetections = sessions.reduce((sum, s) => sum + s.detectionCount, 0);
        const avgFps = sessions.reduce((sum, s) => sum + s.fps, 0) / sessions.length;
        const avgConfidence = sessions.reduce((sum, s) => sum + s.confidence, 0) / sessions.length;
        const totalDuration = sessions.reduce((sum, s) => sum + s.duration, 0);
        const totalCount = sessions.reduce((sum, s) => sum + s.totalCount, 0);

        return {
            totalSessions: sessions.length,
            totalDetections,
            avgFps: avgFps.toFixed(1),
            avgConfidence: avgConfidence.toFixed(2),
            totalDuration: Math.round(totalDuration / 3600),
            totalCount
        };
    },

    // 导出数据
    exportData(format = 'csv', options = {}) {
        let data = '';
        let sessions = this.database.sessions;

        // 应用过滤器
        if (options.startDate && options.endDate) {
            sessions = this.getSessionsByDateRange(options.startDate, options.endDate);
        }

        if (options.mode && options.mode !== 'all') {
            sessions = sessions.filter(s => s.mode === options.mode);
        }

        switch (format) {
            case 'csv':
                data = this.toCSV(sessions);
                break;
            case 'json':
                data = JSON.stringify({
                    metadata: {
                        exportTime: new Date().toISOString(),
                        recordCount: sessions.length,
                        format: 'json',
                        version: '4.0.0'
                    },
                    data: sessions
                }, null, 2);
                break;
            case 'excel':
                // 简化版，实际应用中可能需要库
                data = this.toCSV(sessions);
                break;
            default:
                data = JSON.stringify(sessions);
        }

        return {
            data,
            count: sessions.length,
            size: new Blob([data]).size
        };
    },

    // 转换为CSV
    toCSV(sessions) {
        const headers = ['ID', '时间戳', '时长(秒)', '检测数', '追踪数', '累计总数', '帧率', '平均信心', '模式'];
        const rows = sessions.map(s => [
            s.id,
            new Date(s.timestamp).toLocaleString('zh-CN'),
            s.duration,
            s.detectionCount,
            s.trackCount,
            s.totalCount,
            s.fps.toFixed(2),
            s.confidence.toFixed(3),
            s.mode
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    // 清空数据
    clearData() {
        if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
            this.database.sessions = [];
            this.database.detections = [];
            this.saveToStorage();
            return true;
        }
        return false;
    },

    // 添加日志
    addLog(module, level, message) {
        const log = {
            id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString(),
            module,
            level,
            message
        };

        this.database.logs.push(log);

        // 限制日志数量
        if (this.database.logs.length > 10000) {
            this.database.logs = this.database.logs.slice(-5000);
        }

        this.saveToStorage();
        return log;
    },

    // 获取最近日志
    getRecentLogs(count = 100) {
        return [...this.database.logs]
            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
            .slice(0, count);
    }
};

// 初始化数据管理器
DataManager.init();
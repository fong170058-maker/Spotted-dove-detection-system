// 图表管理模块
const ChartManager = {
    trendChart: null,
    distributionChart: null,

    // 初始化图表
    init() {
        this.createTrendChart();
        this.createDistributionChart();
        this.updateDataTables();
    },

    // 创建趋势图表
    createTrendChart() {
        const ctx = document.getElementById('trend-chart').getContext('2d');

        this.trendChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '累计总数',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: '当前数量',
                        data: [],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    intersect: false
                },
                scales: {
                    x: {
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            maxTicksLimit: 10
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            display: true,
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                return `${context.dataset.label}: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        });
    },

    // 创建分布图表
    createDistributionChart() {
        const ctx = document.getElementById('distribution-chart').getContext('2d');

        this.distributionChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['0-2', '3-5', '6-8', '9-11', '12+'],
                datasets: [{
                    label: '检测数量',
                    data: [12, 19, 8, 5, 3],
                    backgroundColor: [
                        'rgba(231, 76, 60, 0.8)',
                        'rgba(241, 196, 15, 0.8)',
                        'rgba(52, 152, 219, 0.8)',
                        'rgba(155, 89, 182, 0.8)',
                        'rgba(46, 204, 113, 0.8)'
                    ],
                    borderColor: [
                        '#e74c3c',
                        '#f1c40f',
                        '#3498db',
                        '#9b59b6',
                        '#2ecc71'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    x: {
                        grid: {
                            display: false
                        }
                    },
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        }
                    }
                },
                plugins: {
                    legend: {
                        display: false
                    }
                }
            }
        });
    },

    // 更新图表数据
    updateCharts() {
        if (!window.currentStats) return;

        // 更新趋势图表
        const history = window.detectionHistory || [];
        if (history.length > 0) {
            const labels = history.map(h => h.timestamp.split(':').slice(0, 2).join(':'));
            const totalData = history.map(h => h.total);
            const currentData = history.map(h => h.detections);

            this.trendChart.data.labels = labels;
            this.trendChart.data.datasets[0].data = totalData;
            this.trendChart.data.datasets[1].data = currentData;
            this.trendChart.update('none');
        }

        // 更新分布图表（模拟数据）
        const distribution = this.calculateDistribution(history);
        this.distributionChart.data.datasets[0].data = distribution;
        this.distributionChart.update('none');
    },

    // 计算分布
    calculateDistribution(history) {
        const counts = [0, 0, 0, 0, 0]; // 5个区间

        history.forEach(h => {
            const detections = h.detections;
            if (detections <= 2) counts[0]++;
            else if (detections <= 5) counts[1]++;
            else if (detections <= 8) counts[2]++;
            else if (detections <= 11) counts[3]++;
            else counts[4]++;
        });

        return counts;
    },

    // 更新数据表格
    updateDataTables() {
        this.updateStatsTable();
        this.updateDataTable();
    },

    // 更新统计表格
    updateStatsTable() {
        const tbody = document.getElementById('stats-table-body');
        const history = window.detectionHistory || [];

        // 只显示最近10条记录
        const recentHistory = history.slice(-10).reverse();

        let html = '';
        recentHistory.forEach((record, index) => {
            html += `
                <tr>
                    <td>${record.timestamp}</td>
                    <td>${record.detections}</td>
                    <td>${Math.floor(record.detections * 0.7)}</td>
                    <td>${record.total}</td>
                    <td>${record.detections}</td>
                    <td>${record.fps.toFixed(1)}</td>
                    <td>${(0.7 + Math.random() * 0.3).toFixed(2)}</td>
                    <td>
                        <button class="table-btn" onclick="viewDetails('${record.timestamp}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="8" class="empty-message">暂无数据</td></tr>';
    },

    // 更新数据表格
    updateDataTable() {
        const tbody = document.getElementById('data-table-body');
        const sessions = DataManager.getAllSessions().slice(0, 20); // 只显示前20条

        let html = '';
        sessions.forEach(session => {
            const date = new Date(session.timestamp);
            const timeStr = date.toLocaleString('zh-CN');

            html += `
                <tr>
                    <td><input type="checkbox" class="data-checkbox" value="${session.id}"></td>
                    <td>${session.id}</td>
                    <td>${timeStr}</td>
                    <td><span class="mode-badge ${session.mode}">${session.mode}</span></td>
                    <td>${session.detectionCount}</td>
                    <td>${session.trackCount}</td>
                    <td>${session.totalCount}</td>
                    <td>${session.fps.toFixed(1)}</td>
                    <td>${session.confidence.toFixed(2)}</td>
                    <td>${(session.fileSize / 1024).toFixed(1)} KB</td>
                    <td>
                        <div class="table-actions">
                            <button class="table-btn" title="查看" onclick="viewSession('${session.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="table-btn" title="导出" onclick="exportSession('${session.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="table-btn danger" title="删除" onclick="deleteSession('${session.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="11" class="empty-message">暂无数据</td></tr>';

        // 更新摘要
        this.updateSummary(sessions);

        // 设置全选复选框事件
        document.getElementById('select-all').addEventListener('change', function () {
            const checkboxes = document.querySelectorAll('.data-checkbox');
            checkboxes.forEach(cb => cb.checked = this.checked);
        });
    },

    // 更新摘要信息
    updateSummary(sessions) {
        if (sessions.length === 0) {
            document.getElementById('total-records').textContent = '0';
            document.getElementById('total-detections').textContent = '0';
            document.getElementById('avg-fps').textContent = '0.0';
            document.getElementById('avg-confidence').textContent = '0.00';
            return;
        }

        const totalDetections = sessions.reduce((sum, s) => sum + s.detectionCount, 0);
        const avgFps = sessions.reduce((sum, s) => sum + s.fps, 0) / sessions.length;
        const avgConfidence = sessions.reduce((sum, s) => sum + s.confidence, 0) / sessions.length;

        document.getElementById('total-records').textContent = sessions.length;
        document.getElementById('total-detections').textContent = totalDetections;
        document.getElementById('avg-fps').textContent = avgFps.toFixed(1);
        document.getElementById('avg-confidence').textContent = avgConfidence.toFixed(2);
    },

    // 应用过滤器
    applyFilters() {
        const startDate = document.getElementById('start-date').value;
        const endDate = document.getElementById('end-date').value;
        const mode = document.getElementById('filter-mode').value;

        let sessions = DataManager.getAllSessions();

        if (startDate && endDate) {
            sessions = DataManager.getSessionsByDateRange(startDate, endDate);
        }

        if (mode !== 'all') {
            sessions = sessions.filter(s => s.mode === mode);
        }

        this.updateTableWithSessions(sessions);
    },

    // 使用过滤后的会话更新表格
    updateTableWithSessions(sessions) {
        const tbody = document.getElementById('data-table-body');

        let html = '';
        sessions.forEach(session => {
            const date = new Date(session.timestamp);
            const timeStr = date.toLocaleString('zh-CN');

            html += `
                <tr>
                    <td><input type="checkbox" class="data-checkbox" value="${session.id}"></td>
                    <td>${session.id}</td>
                    <td>${timeStr}</td>
                    <td><span class="mode-badge ${session.mode}">${session.mode}</span></td>
                    <td>${session.detectionCount}</td>
                    <td>${session.trackCount}</td>
                    <td>${session.totalCount}</td>
                    <td>${session.fps.toFixed(1)}</td>
                    <td>${session.confidence.toFixed(2)}</td>
                    <td>${(session.fileSize / 1024).toFixed(1)} KB</td>
                    <td>
                        <div class="table-actions">
                            <button class="table-btn" title="查看" onclick="viewSession('${session.id}')">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="table-btn" title="导出" onclick="exportSession('${session.id}')">
                                <i class="fas fa-download"></i>
                            </button>
                            <button class="table-btn danger" title="删除" onclick="deleteSession('${session.id}')">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });

        tbody.innerHTML = html || '<tr><td colspan="11" class="empty-message">没有找到匹配的记录</td></tr>';
        this.updateSummary(sessions);
    },

    // 导出选中的数据
    exportSelected() {
        const selected = Array.from(document.querySelectorAll('.data-checkbox:checked'))
            .map(cb => cb.value);

        if (selected.length === 0) {
            alert('请先选择要导出的记录');
            return;
        }

        const sessions = DataManager.getAllSessions().filter(s =>
            selected.includes(s.id)
        );

        const csv = this.sessionsToCSV(sessions);
        this.downloadCSV(csv, `selected_sessions_${new Date().toISOString().slice(0, 10)}.csv`);
    },

    // 会话转CSV
    sessionsToCSV(sessions) {
        const headers = ['ID', '时间戳', '时长(秒)', '检测数', '追踪数', '累计总数', '帧率', '信心', '模式', '文件大小'];
        const rows = sessions.map(s => [
            s.id,
            new Date(s.timestamp).toLocaleString('zh-CN'),
            s.duration,
            s.detectionCount,
            s.trackCount,
            s.totalCount,
            s.fps.toFixed(2),
            s.confidence.toFixed(3),
            s.mode,
            `${(s.fileSize / 1024).toFixed(1)} KB`
        ]);

        return [headers, ...rows].map(row => row.join(',')).join('\n');
    },

    // 下载CSV文件
    downloadCSV(content, filename) {
        const blob = new Blob(['\uFEFF' + content], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        link.click();
    }
};

// 工具函数供其他脚本使用
function viewSession(sessionId) {
    alert(`查看会话 ${sessionId}`);
}

function exportSession(sessionId) {
    const session = DataManager.getAllSessions().find(s => s.id === sessionId);
    if (session) {
        const csv = ChartManager.sessionsToCSV([session]);
        ChartManager.downloadCSV(csv, `session_${sessionId}.csv`);
        alert(`会话 ${sessionId} 已导出`);
    }
}

function deleteSession(sessionId) {
    if (confirm(`确定要删除会话 ${sessionId} 吗？`)) {
        DataManager.database.sessions = DataManager.database.sessions.filter(s => s.id !== sessionId);
        DataManager.saveToStorage();
        ChartManager.updateDataTable();
        alert(`会话 ${sessionId} 已删除`);
    }
}

function viewDetails(timestamp) {
    alert(`查看详情: ${timestamp}`);
}

// 初始化图表
ChartManager.init();
// 简化的图表更新函数 - 添加到现有的charts.js文件中
function updateRealTimeCharts(detectionHistory) {
    if (!detectionHistory || detectionHistory.length === 0) return;

    // 更新趋势图表数据
    const labels = detectionHistory.map(h => h.timestamp.split(':').slice(0, 2).join(':'));
    const counts = detectionHistory.map(h => h.count);
    const totals = detectionHistory.map(h => h.total);

    // 更新图表
    if (window.trendChart && window.trendChart.data) {
        window.trendChart.data.labels = labels.slice(-20); // 只显示最近20个点
        window.trendChart.data.datasets[0].data = totals.slice(-20);
        window.trendChart.data.datasets[1].data = counts.slice(-20);
        window.trendChart.update();
    }

    // 更新统计表格
    updateStatsTable(detectionHistory);
}

// 更新统计表格
function updateStatsTable(detectionHistory) {
    const tbody = document.getElementById('stats-table-body');
    if (!tbody) return;

    // 只显示最近10条记录
    const recentHistory = detectionHistory.slice(-10).reverse();

    let html = '';
    recentHistory.forEach((record, index) => {
        html += `
            <tr>
                <td>${record.timestamp}</td>
                <td>${record.count}</td>
                <td>${Math.floor(record.count * 0.7)}</td>
                <td>${record.total}</td>
                <td>${record.count}</td>
                <td>${record.fps}</td>
                <td>${record.details && record.details.length > 0 ?
                (record.details[0].confidence * 100).toFixed(1) + '%' : '0%'}</td>
                <td>
                    <button class="table-btn" onclick="viewDetails('${record.timestamp}')">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });

    tbody.innerHTML = html || '<tr><td colspan="8" class="empty-message">暂无数据</td></tr>';
}

// 导出到全局
window.updateCharts = updateRealTimeCharts;
window.updateStatsTable = updateStatsTable;
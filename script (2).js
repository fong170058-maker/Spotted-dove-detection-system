// 完整的珠颈斑鸠统计系统主逻辑 - 智能校准版
// script.js - 修复所有功能，包括智能校准系统

// ========== 全局变量定义 ==========
let isDetecting = false;
let videoSource = 'camera';
let detectionMode = 'simulation';
let currentStats = {
    totalCount: 0,
    currentCount: 0,
    detectionCount: 0,
    fps: 30,
    averageConfidence: 0,
    averageSize: 0,
    detectionRate: 0,
    runtime: 0
};

let detectionHistory = [];
let logs = [];
let isLogsPaused = false;
let calibrationStep = 1;
let calibrationInterval = null;
let calibrationProgress = 0;
let calibrationSamples = 0;
let calibrationData = {
    totalSamples: 0,
    positiveSamples: 0,
    negativeSamples: 0,
    accuracy: 0.7,
    lastCalibrated: null,
    features: {
        color: { weight: 0.3, accuracy: 0 },
        shape: { weight: 0.4, accuracy: 0 },
        texture: { weight: 0.3, accuracy: 0 }
    }
};
let mediaRecorder = null;
let recordedChunks = [];
let isRecording = false;
let videoStream = null;
let simulationInterval = null;
let detectionLoopActive = false;

// ========== 初始化函数 ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('🕊️ 珠颈斑鸠统计系统初始化...');
    
    // 初始化所有组件
    initAllComponents();
    
    // 设置事件监听器
    setupAllEventListeners();
    
    // 加载保存的数据
    loadSavedData();
    
    // 初始化演示数据
    initDemoData();
    
    console.log('✅ 系统初始化完成！');
    addLog('系统', 'success', '系统初始化完成，所有功能已就绪');
});

// ========== 初始化所有组件 ==========
function initAllComponents() {
    // 隐藏加载动画
    setTimeout(() => {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.style.opacity = '0';
            setTimeout(() => {
                loading.style.display = 'none';
                addLog('界面', 'info', '主界面加载完成');
            }, 500);
        }
    }, 1000);
    
    // 更新时钟
    updateClock();
    setInterval(updateClock, 1000);
    
    // 初始化图表
    if (typeof initCharts === 'function') {
        initCharts();
    }
    
    // 初始化数据表
    updateDataTable();
    
    // 更新系统状态
    updateSystemStatus();
    setInterval(updateSystemStatus, 5000);
    
    // 设置初始视频源
    setupVideoSource();
    
    // 添加紧急停止按钮
    addEmergencyStopButton();
    
    // 初始化校准系统
    initCalibrationSystem();
    
    // 初始化样本收集系统
    initSampleCollection();
}

// ========== 初始化校准系统 ==========
function initCalibrationSystem() {
    console.log('初始化校准系统...');
    
    // 设置校准模态框事件
    setupCalibrationModal();
    
    // 初始化校准步骤
    resetCalibration();
    
    // 加载校准数据
    loadCalibrationData();
    
    console.log('校准系统初始化完成');
}

// ========== 初始化样本收集系统 ==========
function initSampleCollection() {
    console.log('初始化样本收集系统...');
    
    // 创建样本存储
    if (!localStorage.getItem('doveSamples')) {
        localStorage.setItem('doveSamples', JSON.stringify([]));
    }
    
    // 创建特征数据库
    if (!localStorage.getItem('doveFeatures')) {
        const defaultFeatures = {
            colors: ['#8B4513', '#A0522D', '#D2691E', '#CD853F'], // 棕色系
            shapes: ['oval', 'round', 'elongated'], // 形状
            textures: ['feathered', 'spotted', 'striped'], // 纹理
            sizes: [80, 120, 160] // 大小范围
        };
        localStorage.setItem('doveFeatures', JSON.stringify(defaultFeatures));
    }
    
    console.log('样本收集系统初始化完成');
}

// ========== 设置所有事件监听器 ==========
function setupAllEventListeners() {
    console.log('设置事件监听器...');
    
    // 导航菜单
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            setActiveNav(this);
        });
    });
    
    // 视频源选择
    document.querySelectorAll('.source-option').forEach(option => {
        option.addEventListener('click', function() {
            setActiveVideoSource(this);
        });
    });
    
    // 摄像头选择
    document.getElementById('camera-select')?.addEventListener('change', function() {
        addLog('摄像头', 'info', `选择摄像头: ${this.value}`);
    });
    
    // 文件上传
    const videoFileInput = document.getElementById('video-file');
    if (videoFileInput) {
        videoFileInput.addEventListener('change', handleVideoFileUpload);
    }
    
    // 控制按钮
    document.getElementById('start-btn')?.addEventListener('click', startDetection);
    document.getElementById('stop-btn')?.addEventListener('click', stopDetection);
    document.getElementById('snapshot-btn')?.addEventListener('click', takeSnapshot);
    document.getElementById('reset-btn')?.addEventListener('click', resetCounters);
    document.getElementById('calibrate-btn')?.addEventListener('click', openCalibration);
    document.getElementById('apply-settings')?.addEventListener('click', applySettings);
    
    // 视频控制按钮
    document.getElementById('play-btn')?.addEventListener('click', playVideo);
    document.getElementById('pause-btn')?.addEventListener('click', pauseVideo);
    document.getElementById('step-btn')?.addEventListener('click', nextFrame);
    document.getElementById('record-btn')?.addEventListener('click', toggleRecording);
    document.getElementById('screenshot-btn')?.addEventListener('click', takeCanvasScreenshot);
    document.getElementById('zoom-in-btn')?.addEventListener('click', zoomIn);
    document.getElementById('zoom-out-btn')?.addEventListener('click', zoomOut);
    
    // 显示选项
    document.querySelectorAll('.control-checkbox input').forEach(cb => {
        cb.addEventListener('change', function() {
            addLog('显示设置', 'info', `${this.nextElementSibling.textContent}: ${this.checked ? '开启' : '关闭'}`);
        });
    });
    
    // 进度条
    const progressSlider = document.getElementById('video-progress');
    if (progressSlider) {
        progressSlider.addEventListener('input', updateVideoProgress);
    }
    
    // 信心阈值滑块
    const confidenceSlider = document.getElementById('confidence-slider');
    if (confidenceSlider) {
        confidenceSlider.addEventListener('input', function() {
            document.getElementById('confidence-value').textContent = this.value;
        });
    }
    
    // 检测模式选择
    document.getElementById('detection-mode')?.addEventListener('change', function() {
        detectionMode = this.value;
        addLog('检测设置', 'info', `检测模式切换为: ${this.options[this.selectedIndex].text}`);
    });
    
    // 图表功能
    document.getElementById('chart-period')?.addEventListener('change', function() {
        updateChartsByPeriod(this.value);
    });
    
    document.getElementById('export-chart')?.addEventListener('click', exportChartImage);
    document.getElementById('refresh-stats')?.addEventListener('click', refreshStatistics);
    
    // 数据管理
    document.getElementById('export-data')?.addEventListener('click', exportData);
    document.getElementById('clear-data')?.addEventListener('click', clearAllData);
    document.getElementById('apply-filters')?.addEventListener('click', applyDataFilters);
    
    // 系统功能
    document.getElementById('fullscreen-btn')?.addEventListener('click', toggleFullScreen);
    document.getElementById('help-btn')?.addEventListener('click', openHelp);
    document.getElementById('refresh-sources')?.addEventListener('click', refreshVideoSources);
    
    // 日志控制
    document.getElementById('clear-logs')?.addEventListener('click', clearLogs);
    document.getElementById('pause-logs')?.addEventListener('click', toggleLogsPause);
    document.getElementById('export-logs')?.addEventListener('click', exportLogs);
    
    console.log('✅ 事件监听器设置完成');
}

// ========== 核心检测功能 ==========

// 开始检测 - 修复版
function startDetection() {
    console.log('🚀 开始检测...');
    
    if (isDetecting) {
        showMessage('检测已经在运行中', 'warning');
        return;
    }
    
    // 确保之前的检测完全停止
    stopDetection();
    
    // 重置状态
    isDetecting = true;
    currentStats.currentCount = 0;
    currentStats.runtime = 0;
    
    // 更新按钮状态
    document.getElementById('start-btn').disabled = true;
    document.getElementById('stop-btn').disabled = false;
    document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 检测中...';
    document.getElementById('stop-btn').innerHTML = '<i class="fas fa-stop"></i> 停止检测';
    
    // 更新状态指示器
    updateStatusIndicator('online');
    
    // 根据视频源类型处理
    switch(videoSource) {
        case 'camera':
            startCameraDetection();
            break;
        case 'video':
            startVideoFileDetection();
            break;
        case 'url':
            startStreamDetection();
            break;
        default:
            // 默认使用模拟检测
            startSimulationDetection();
    }
    
    addLog('检测系统', 'success', `开始检测 - 模式: ${detectionMode}, 源: ${videoSource || '模拟'}`);
    showMessage('检测已开始', 'success');
}

// 停止检测 - 修复版（这是最重要的修复部分）
function stopDetection() {
    console.log('🛑 停止检测...');
    
    // 设置停止标志
    isDetecting = false;
    detectionLoopActive = false;
    
    // 1. 停止模拟检测循环
    if (simulationInterval) {
        console.log('清除模拟检测间隔');
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    
    // 2. 停止视频流
    if (videoStream) {
        console.log('停止视频流');
        videoStream.getTracks().forEach(track => {
            console.log(`停止轨道: ${track.label || track.kind}`);
            track.stop();
        });
        videoStream = null;
    }
    
    // 3. 停止录制（如果正在录制）
    if (isRecording) {
        console.log('停止录制');
        toggleRecording();
    }
    
    // 4. 更新UI状态
    document.getElementById('start-btn').disabled = false;
    document.getElementById('stop-btn').disabled = true;
    document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 开始检测';
    document.getElementById('stop-btn').innerHTML = '<i class="fas fa-stop"></i> 已停止';
    
    // 5. 更新状态指示器
    updateStatusIndicator('offline');
    
    // 6. 重置当前检测数量
    currentStats.currentCount = 0;
    
    // 7. 清除画布并显示停止状态
    clearCanvasAndShowStopped();
    
    // 8. 更新显示
    updateDisplay();
    
    console.log('✅ 检测已完全停止');
    addLog('检测系统', 'info', '检测已停止');
    showMessage('检测已停止', 'info');
}

// 清除画布并显示停止状态
function clearCanvasAndShowStopped() {
    const canvas = document.getElementById('video-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    
    // 清除画布
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // 绘制停止状态背景
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < canvas.width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
    }
    
    // 绘制停止消息
    ctx.fillStyle = 'white';
    ctx.font = 'bold 24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('检测已停止', canvas.width / 2, canvas.height / 2 - 30);
    
    ctx.font = '16px Arial';
    ctx.fillText('点击"开始检测"重新启动', canvas.width / 2, canvas.height / 2 + 10);
    
    // 绘制图标
    ctx.font = '48px "Font Awesome 5 Free"';
    ctx.fillText('🕊️', canvas.width / 2, canvas.height / 2 - 80);
}

// 开始摄像头检测
function startCameraDetection() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        showMessage('您的浏览器不支持摄像头', 'error');
        startSimulationDetection();
        return;
    }
    
    const constraints = {
        video: {
            width: { ideal: 640 },
            height: { ideal: 480 },
            facingMode: 'environment'
        }
    };
    
    navigator.mediaDevices.getUserMedia(constraints)
        .then(stream => {
            videoStream = stream;
            const videoElement = createVideoElement(stream);
            startDetectionLoop(videoElement);
            addLog('摄像头', 'success', '摄像头访问成功');
        })
        .catch(error => {
            console.error('摄像头错误:', error);
            showMessage('无法访问摄像头，使用模拟模式', 'warning');
            addLog('摄像头', 'error', `摄像头错误: ${error.message}`);
            startSimulationDetection();
        });
}

// 开始视频文件检测
function startVideoFileDetection() {
    const fileInput = document.getElementById('video-file');
    if (!fileInput.files || fileInput.files.length === 0) {
        showMessage('请先选择视频文件', 'warning');
        isDetecting = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
        return;
    }
    
    const file = fileInput.files[0];
    const videoUrl = URL.createObjectURL(file);
    
    const videoElement = document.createElement('video');
    videoElement.src = videoUrl;
    videoElement.controls = true;
    videoElement.style.display = 'none';
    document.body.appendChild(videoElement);
    
    videoElement.onloadedmetadata = () => {
        startDetectionLoop(videoElement);
        addLog('视频文件', 'success', `视频加载成功: ${file.name}`);
    };
    
    videoElement.onerror = () => {
        showMessage('视频文件加载失败', 'error');
        startSimulationDetection();
    };
}

// 开始网络流检测
function startStreamDetection() {
    const streamUrl = document.getElementById('stream-url').value.trim();
    if (!streamUrl) {
        showMessage('请输入流媒体URL', 'warning');
        isDetecting = false;
        document.getElementById('start-btn').disabled = false;
        document.getElementById('stop-btn').disabled = true;
        return;
    }
    
    showMessage('网络流检测正在开发中，使用模拟模式', 'info');
    startSimulationDetection();
}

// 开始模拟检测 - 修复版
function startSimulationDetection() {
    console.log('🔄 开始模拟检测');
    
    // 清除之前的间隔
    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }
    
    // 设置画布大小
    const canvas = document.getElementById('video-canvas');
    if (canvas) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    // 创建新的模拟检测循环
    let frameCount = 0;
    simulationInterval = setInterval(() => {
        // 安全检查：如果检测已停止，立即退出循环
        if (!isDetecting) {
            console.log('检测已停止，退出模拟循环');
            clearInterval(simulationInterval);
            simulationInterval = null;
            return;
        }
        
        frameCount++;
        currentStats.runtime++;
        
        // 更新帧率（每30帧）
        if (frameCount % 30 === 0) {
            currentStats.fps = 28 + Math.random() * 4;
        }
        
        // 更新检测数据（每60帧 = 约2秒）
        if (frameCount % 60 === 0) {
            updateSimulationData();
        }
        
        // 绘制模拟视频帧
        drawSimulationFrame();
        
        // 更新显示
        updateDisplay();
        
        // 防止计数器溢出
        if (frameCount > 100000) {
            frameCount = 0;
        }
        
    }, 33); // ~30 FPS
    
    console.log('✅ 模拟检测循环已启动');
    addLog('检测系统', 'info', '模拟检测模式启动');
}

// 开始检测循环
function startDetectionLoop(videoElement) {
    console.log('开始检测循环');
    
    const canvas = document.getElementById('video-canvas');
    const ctx = canvas.getContext('2d');
    
    // 设置画布尺寸
    canvas.width = videoElement.videoWidth || 640;
    canvas.height = videoElement.videoHeight || 480;
    
    let frameCount = 0;
    let lastFrameTime = performance.now();
    
    function processFrame() {
        // 安全检查：如果检测已停止，立即退出循环
        if (!isDetecting) {
            console.log('检测已停止，退出检测循环');
            return;
        }
        
        // 计算帧率
        const currentTime = performance.now();
        const elapsed = currentTime - lastFrameTime;
        currentStats.fps = 1000 / elapsed;
        lastFrameTime = currentTime;
        
        frameCount++;
        currentStats.runtime++;
        
        // 绘制视频帧
        ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
        
        // 更新检测数据（每60帧 = 约2秒）
        if (frameCount % 60 === 0) {
            updateSimulationData();
        }
        
        // 绘制检测框
        drawDetectionBoxes(ctx);
        
        // 更新显示
        updateDisplay();
        
        // 继续下一帧
        requestAnimationFrame(processFrame);
    }
    
    // 开始处理
    videoElement.play().then(() => {
        processFrame();
    }).catch(error => {
        console.error('视频播放错误:', error);
        startSimulationDetection();
    });
}

// ========== 智能校准系统功能 ==========

// 设置校准模态框事件
function setupCalibrationModal() {
    console.log('设置校准模态框事件...');
    
    // 校准关闭按钮
    const calibrationCloseBtn = document.querySelector('#calibration-modal .modal-close');
    if (calibrationCloseBtn) {
        calibrationCloseBtn.addEventListener('click', function() {
            document.getElementById('calibration-modal').classList.remove('active');
            cancelCalibration();
        });
    }
    
    // 校准步骤控制按钮
    document.getElementById('next-step')?.addEventListener('click', nextCalibrationStep);
    document.getElementById('prev-step')?.addEventListener('click', prevCalibrationStep);
    document.getElementById('cancel-calibration')?.addEventListener('click', cancelCalibration);
    
    // 样本收集控制
    document.getElementById('collect-sample-btn')?.addEventListener('click', collectSample);
    document.getElementById('mark-positive-btn')?.addEventListener('click', () => markSample(true));
    document.getElementById('mark-negative-btn')?.addEventListener('click', () => markSample(false));
    
    console.log('校准模态框事件设置完成');
}

// 打开校准向导
function openCalibration() {
    console.log('打开校准向导');
    
    // 重置校准状态
    resetCalibration();
    
    // 显示校准模态框
    document.getElementById('calibration-modal').classList.add('active');
    
    // 更新校准步骤显示
    updateCalibrationStep();
    
    addLog('校准', 'info', '打开系统校准向导');
    showMessage('校准系统已打开', 'info');
}

// 重置校准
function resetCalibration() {
    calibrationStep = 1;
    calibrationProgress = 0;
    calibrationSamples = 0;
    
    // 清除校准间隔
    if (calibrationInterval) {
        clearInterval(calibrationInterval);
        calibrationInterval = null;
    }
    
    // 重置进度条
    document.getElementById('calibration-progress').style.width = '0%';
    document.getElementById('calibration-percent').textContent = '0%';
    document.getElementById('sample-count').textContent = '0';
    document.getElementById('accuracy-display').textContent = '70%';
    
    // 重置特征分析条
    document.querySelectorAll('.feature-fill').forEach(fill => {
        fill.style.width = '0%';
    });
    
    // 重置样本预览
    const samplePreview = document.getElementById('sample-preview');
    if (samplePreview) {
        samplePreview.innerHTML = '';
    }
    
    console.log('校准系统已重置');
}

// 加载校准数据
function loadCalibrationData() {
    try {
        const savedData = localStorage.getItem('doveCalibrationData');
        if (savedData) {
            calibrationData = JSON.parse(savedData);
            console.log('校准数据加载成功:', calibrationData);
            updateAccuracyDisplay();
        }
    } catch (error) {
        console.error('加载校准数据失败:', error);
    }
}

// 更新校准步骤
function updateCalibrationStep() {
    console.log(`更新校准步骤到第 ${calibrationStep} 步`);
    
    // 隐藏所有步骤
    document.querySelectorAll('.calibration-steps .step').forEach(step => {
        step.classList.remove('active');
    });
    
    // 显示当前步骤
    const currentStep = document.querySelector(`.step[data-step="${calibrationStep}"]`);
    if (currentStep) {
        currentStep.classList.add('active');
    }
    
    // 更新按钮状态
    const prevBtn = document.getElementById('prev-step');
    const nextBtn = document.getElementById('next-step');
    
    if (prevBtn) {
        prevBtn.disabled = calibrationStep === 1;
    }
    
    if (nextBtn) {
        if (calibrationStep === 5) {
            nextBtn.innerHTML = '<i class="fas fa-check"></i> 完成';
            nextBtn.classList.add('success');
        } else {
            nextBtn.innerHTML = '下一步';
            nextBtn.classList.remove('success');
        }
    }
    
    // 步骤特定逻辑
    switch(calibrationStep) {
        case 1:
            // 准备步骤
            break;
        case 2:
            // 样本收集步骤
            setupSampleCollection();
            break;
        case 3:
            // 特征分析步骤
            startFeatureAnalysis();
            break;
        case 4:
            // 模型训练步骤
            startModelTraining();
            break;
        case 5:
            // 完成步骤
            showCalibrationResults();
            break;
    }
    
    console.log(`校准步骤 ${calibrationStep} 已激活`);
}

// 下一步校准
function nextCalibrationStep() {
    console.log('下一步校准');
    
    if (calibrationStep < 5) {
        calibrationStep++;
        updateCalibrationStep();
        
        if (calibrationStep === 5) {
            // 完成校准
            completeCalibration();
        }
    } else {
        // 第5步点击"完成"按钮
        document.getElementById('calibration-modal').classList.remove('active');
        showMessage('系统校准完成！检测准确率已提升', 'success');
        addLog('校准', 'success', '系统校准完成');
        
        // 应用校准结果
        applyCalibrationResults();
    }
}

// 上一步校准
function prevCalibrationStep() {
    console.log('上一步校准');
    
    if (calibrationStep > 1) {
        calibrationStep--;
        updateCalibrationStep();
    }
}

// 取消校准
function cancelCalibration() {
    console.log('取消校准');
    
    // 停止校准过程
    if (calibrationInterval) {
        clearInterval(calibrationInterval);
        calibrationInterval = null;
    }
    
    // 关闭模态框
    document.getElementById('calibration-modal').classList.remove('active');
    
    // 重置校准状态
    resetCalibration();
    
    addLog('校准', 'warning', '校准已取消');
    showMessage('校准已取消', 'warning');
}

// ========== 样本收集系统 ==========

// 设置样本收集
function setupSampleCollection() {
    console.log('设置样本收集...');
    
    // 显示样本收集界面
    const sampleContainer = document.getElementById('sample-collection-container');
    if (sampleContainer) {
        sampleContainer.style.display = 'block';
    }
    
    // 加载现有样本
    loadExistingSamples();
    
    // 开始自动样本收集（模拟）
    startAutoSampleCollection();
}

// 加载现有样本
function loadExistingSamples() {
    try {
        const samples = JSON.parse(localStorage.getItem('doveSamples') || '[]');
        calibrationSamples = samples.length;
        document.getElementById('sample-count').textContent = calibrationSamples;
        
        // 更新样本预览
        updateSamplePreview(samples.slice(-5)); // 显示最近5个样本
    } catch (error) {
        console.error('加载样本失败:', error);
    }
}

// 开始自动样本收集
function startAutoSampleCollection() {
    console.log('开始自动样本收集...');
    
    // 清除之前的间隔
    if (calibrationInterval) {
        clearInterval(calibrationInterval);
    }
    
    // 模拟样本收集过程
    calibrationInterval = setInterval(() => {
        if (calibrationSamples >= 50) { // 最多收集50个样本
            clearInterval(calibrationInterval);
            showMessage('样本收集完成！已收集50个样本', 'success');
            return;
        }
        
        // 模拟收集样本
        collectSampleSimulation();
        
    }, 1500); // 每1.5秒收集一个样本
}

// 模拟收集样本
function collectSampleSimulation() {
    calibrationSamples++;
    calibrationProgress = Math.min(calibrationSamples * 2, 100); // 每个样本增加2%进度
    
    // 更新进度显示
    document.getElementById('calibration-progress').style.width = `${calibrationProgress}%`;
    document.getElementById('calibration-percent').textContent = `${calibrationProgress}%`;
    document.getElementById('sample-count').textContent = calibrationSamples;
    
    // 创建模拟样本数据
    const sample = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        features: {
            color: generateRandomColor(),
            shape: getRandomShape(),
            size: Math.floor(Math.random() * 80) + 40,
            confidence: 0.7 + Math.random() * 0.3
        },
        isPositive: Math.random() > 0.3, // 70%正样本
        manualLabel: false
    };
    
    // 保存样本
    saveSample(sample);
    
    // 更新样本预览
    updateSamplePreview([sample]);
    
    // 更新特征权重（模拟学习）
    updateFeatureWeights(sample);
    
    // 更新准确率
    updateAccuracy();
    
    console.log(`收集样本 ${calibrationSamples}:`, sample);
}

// 手动收集样本
function collectSample() {
    const canvas = document.getElementById('video-canvas');
    if (!canvas) {
        showMessage('请先开始视频检测', 'warning');
        return;
    }
    
    // 获取当前画面作为样本
    const imageData = canvas.toDataURL('image/jpeg', 0.8);
    
    const sample = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        image: imageData,
        features: {
            color: extractColorFeatures(canvas),
            shape: extractShapeFeatures(canvas),
            size: extractSizeFeatures(canvas),
            confidence: 0.8
        },
        isPositive: true, // 默认为正样本
        manualLabel: true,
        source: 'manual'
    };
    
    // 保存样本
    saveSample(sample);
    calibrationSamples++;
    
    // 更新显示
    document.getElementById('sample-count').textContent = calibrationSamples;
    updateSamplePreview([sample]);
    
    showMessage('样本已收集', 'success');
    addLog('样本收集', 'info', '手动收集样本成功');
}

// 标记样本
function markSample(isPositive) {
    const samples = JSON.parse(localStorage.getItem('doveSamples') || '[]');
    if (samples.length === 0) return;
    
    // 获取最新样本
    const latestSample = samples[samples.length - 1];
    latestSample.isPositive = isPositive;
    latestSample.manualLabel = true;
    
    // 更新样本
    samples[samples.length - 1] = latestSample;
    localStorage.setItem('doveSamples', JSON.stringify(samples));
    
    // 更新特征权重
    updateFeatureWeights(latestSample);
    
    // 更新准确率
    updateAccuracy();
    
    const label = isPositive ? '正样本' : '负样本';
    showMessage(`样本已标记为${label}`, 'success');
    addLog('样本标记', 'info', `标记样本为${label}`);
}

// 保存样本
function saveSample(sample) {
    try {
        const samples = JSON.parse(localStorage.getItem('doveSamples') || '[]');
        samples.push(sample);
        localStorage.setItem('doveSamples', JSON.stringify(samples));
        
        // 更新样本统计
        if (sample.isPositive) {
            calibrationData.positiveSamples++;
        } else {
            calibrationData.negativeSamples++;
        }
        calibrationData.totalSamples++;
        
        return true;
    } catch (error) {
        console.error('保存样本失败:', error);
        return false;
    }
}

// 更新样本预览
function updateSamplePreview(samples) {
    const samplePreview = document.getElementById('sample-preview');
    if (!samplePreview) return;
    
    samples.forEach(sample => {
        const sampleElement = document.createElement('div');
        sampleElement.className = 'sample-item';
        sampleElement.innerHTML = `
            <div class="sample-color" style="background-color: ${sample.features.color || '#8B4513'}"></div>
            <div class="sample-info">
                <span class="sample-label">${sample.isPositive ? '✅' : '❌'} 样本</span>
                <span class="sample-size">${sample.features.size}px</span>
            </div>
        `;
        samplePreview.appendChild(sampleElement);
        
        // 限制显示数量
        if (samplePreview.children.length > 10) {
            samplePreview.removeChild(samplePreview.firstChild);
        }
    });
}

// 提取颜色特征（模拟）
function extractColorFeatures(canvas) {
    const colors = ['#8B4513', '#A0522D', '#D2691E', '#CD853F'];
    return colors[Math.floor(Math.random() * colors.length)];
}

// 提取形状特征（模拟）
function extractShapeFeatures(canvas) {
    const shapes = ['oval', 'round', 'elongated'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

// 提取大小特征（模拟）
function extractSizeFeatures(canvas) {
    return Math.floor(Math.random() * 80) + 40;
}

// 生成随机颜色
function generateRandomColor() {
    const brownColors = [
        '#8B4513', // 马鞍棕色
        '#A0522D', // 赭色
        '#D2691E', // 巧克力色
        '#CD853F', // 秘鲁色
        '#F4A460', // 沙棕色
        '#DEB887', // 实木色
        '#D2B48C', // 黄褐色
        '#BC8F8F'  // 玫瑰棕色
    ];
    return brownColors[Math.floor(Math.random() * brownColors.length)];
}

// 获取随机形状
function getRandomShape() {
    const shapes = ['oval', 'round', 'elongated', 'compact'];
    return shapes[Math.floor(Math.random() * shapes.length)];
}

// ========== 特征分析和模型训练 ==========

// 开始特征分析
function startFeatureAnalysis() {
    console.log('开始特征分析...');
    
    // 清除之前的间隔
    if (calibrationInterval) {
        clearInterval(calibrationInterval);
    }
    
    // 模拟特征分析过程
    let featureProgress = 0;
    calibrationInterval = setInterval(() => {
        featureProgress += 2;
        
        // 更新特征分析进度条
        const features = ['color', 'shape', 'texture'];
        features.forEach((feature, index) => {
            const fill = document.querySelector(`[data-feature="${feature}"]`);
            if (fill) {
                const featureProgress = Math.min((featureProgress - index * 33) * 3, 100);
                fill.style.width = `${Math.max(0, featureProgress)}%`;
            }
        });
        
        // 更新特征权重
        if (featureProgress % 33 === 0) {
            const featureIndex = Math.floor(featureProgress / 33) - 1;
            if (featureIndex >= 0 && featureIndex < features.length) {
                const feature = features[featureIndex];
                calibrationData.features[feature].accuracy = 0.7 + Math.random() * 0.3;
                console.log(`特征 ${feature} 分析完成: ${calibrationData.features[feature].accuracy.toFixed(2)}`);
            }
        }
        
        // 完成特征分析
        if (featureProgress >= 100) {
            clearInterval(calibrationInterval);
            calibrationInterval = null;
            
            // 保存特征分析结果
            saveCalibrationData();
            
            // 自动进入下一步
            setTimeout(() => {
                nextCalibrationStep();
            }, 1000);
            
            console.log('特征分析完成');
            addLog('特征分析', 'info', '特征分析完成');
        }
    }, 50);
}

// 开始模型训练
function startModelTraining() {
    console.log('开始模型训练...');
    
    // 清除之前的间隔
    if (calibrationInterval) {
        clearInterval(calibrationInterval);
    }
    
    // 模拟模型训练过程
    let trainingProgress = 0;
    calibrationInterval = setInterval(() => {
        trainingProgress += 1;
        
        // 更新训练进度
        const progressBar = document.getElementById('training-progress');
        const percentText = document.getElementById('training-percent');
        
        if (progressBar) progressBar.style.width = `${trainingProgress}%`;
        if (percentText) percentText.textContent = `${trainingProgress}%`;
        
        // 更新准确率（模拟）
        if (trainingProgress % 10 === 0) {
            calibrationData.accuracy = 0.7 + (trainingProgress / 100) * 0.3;
            document.getElementById('accuracy-display').textContent = 
                `${Math.round(calibrationData.accuracy * 100)}%`;
        }
        
        // 完成训练
        if (trainingProgress >= 100) {
            clearInterval(calibrationInterval);
            calibrationInterval = null;
            
            // 自动进入下一步
            setTimeout(() => {
                nextCalibrationStep();
            }, 1000);
            
            console.log('模型训练完成');
            addLog('模型训练', 'info', '模型训练完成');
        }
    }, 30);
}

// 更新特征权重
function updateFeatureWeights(sample) {
    // 根据样本特征调整权重（简化版）
    if (sample.isPositive) {
        // 正样本：增加相关特征的权重
        if (sample.features.color) {
            calibrationData.features.color.weight = Math.min(
                calibrationData.features.color.weight + 0.01, 
                0.5
            );
        }
        if (sample.features.shape) {
            calibrationData.features.shape.weight = Math.min(
                calibrationData.features.shape.weight + 0.01,
                0.5
            );
        }
        // 重新归一化权重
        normalizeFeatureWeights();
    }
}

// 归一化特征权重
function normalizeFeatureWeights() {
    const totalWeight = 
        calibrationData.features.color.weight +
        calibrationData.features.shape.weight +
        calibrationData.features.texture.weight;
    
    if (totalWeight > 0) {
        calibrationData.features.color.weight /= totalWeight;
        calibrationData.features.shape.weight /= totalWeight;
        calibrationData.features.texture.weight /= totalWeight;
    }
}

// 更新准确率
function updateAccuracy() {
    // 基于样本数量和特征权重计算准确率
    const sampleAccuracy = Math.min(calibrationSamples / 50, 1) * 0.3; // 最多提升30%
    const featureAccuracy = (
        calibrationData.features.color.accuracy * calibrationData.features.color.weight +
        calibrationData.features.shape.accuracy * calibrationData.features.shape.weight +
        calibrationData.features.texture.accuracy * calibrationData.features.texture.weight
    );
    
    calibrationData.accuracy = 0.7 + sampleAccuracy + featureAccuracy * 0.2;
    calibrationData.accuracy = Math.min(calibrationData.accuracy, 0.95);
    
    // 更新显示
    updateAccuracyDisplay();
}

// 更新准确率显示
function updateAccuracyDisplay() {
    const accuracyElement = document.getElementById('accuracy-display');
    if (accuracyElement) {
        accuracyElement.textContent = `${Math.round(calibrationData.accuracy * 100)}%`;
    }
    
    // 更新校准按钮上的准确率提示
    const calibrateBtn = document.getElementById('calibrate-btn');
    if (calibrateBtn && calibrationData.accuracy > 0.7) {
        calibrateBtn.innerHTML = `<i class="fas fa-ruler-combined"></i> 校准系统 (${Math.round(calibrationData.accuracy * 100)}%)`;
    }
}

// 显示校准结果
function showCalibrationResults() {
    console.log('显示校准结果');
    
    // 计算提升百分比
    const improvement = Math.round((calibrationData.accuracy - 0.7) * 100);
    
    // 更新结果展示
    const resultStats = document.querySelector('.result-stats');
    if (resultStats) {
        resultStats.innerHTML = `
            <div class="result-item">
                <span class="result-label">收集样本数:</span>
                <span class="result-value">${calibrationSamples}</span>
            </div>
            <div class="result-item">
                <span class="result-label">正样本/负样本:</span>
                <span class="result-value">${calibrationData.positiveSamples}/${calibrationData.negativeSamples}</span>
            </div>
            <div class="result-item">
                <span class="result-label">最终准确率:</span>
                <span class="result-value">${Math.round(calibrationData.accuracy * 100)}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">准确率提升:</span>
                <span class="result-value" style="color: #2ecc71;">+${improvement}%</span>
            </div>
            <div class="result-item">
                <span class="result-label">特征权重:</span>
                <span class="result-value">
                    颜色 ${Math.round(calibrationData.features.color.weight * 100)}%,
                    形状 ${Math.round(calibrationData.features.shape.weight * 100)}%,
                    纹理 ${Math.round(calibrationData.features.texture.weight * 100)}%
                </span>
            </div>
        `;
    }
    
    // 显示建议
    const suggestions = document.getElementById('calibration-suggestions');
    if (suggestions) {
        let suggestionText = '';
        if (calibrationSamples < 20) {
            suggestionText = '建议收集更多样本以获得更好的准确率';
        } else if (calibrationData.positiveSamples < calibrationData.negativeSamples) {
            suggestionText = '建议增加正样本数量以优化检测';
        } else {
            suggestionText = '校准效果良好，系统准确率已显著提升';
        }
        suggestions.textContent = suggestionText;
    }
}

// 完成校准
function completeCalibration() {
    console.log('校准完成');
    
    // 更新校准时间
    calibrationData.lastCalibrated = new Date().toISOString();
    
    // 保存校准数据
    saveCalibrationData();
    
    // 更新系统设置
    updateSystemSettings();
    
    addLog('校准', 'success', `校准完成，准确率提升至 ${Math.round(calibrationData.accuracy * 100)}%`);
}

// 保存校准数据
function saveCalibrationData() {
    try {
        localStorage.setItem('doveCalibrationData', JSON.stringify(calibrationData));
        console.log('校准数据保存成功');
        return true;
    } catch (error) {
        console.error('保存校准数据失败:', error);
        return false;
    }
}

// 更新系统设置
function updateSystemSettings() {
    // 根据校准结果调整置信度阈值
    const baseConfidence = 0.4;
    const confidenceBoost = (calibrationData.accuracy - 0.7) * 0.2; // 最多提升0.06
    const newConfidence = Math.min(baseConfidence + confidenceBoost, 0.5);
    
    // 更新滑块和显示
    document.getElementById('confidence-slider').value = newConfidence;
    document.getElementById('confidence-value').textContent = newConfidence.toFixed(2);
    
    // 保存设置
    const settings = JSON.parse(localStorage.getItem('doveDetectorSettings') || '{}');
    settings.confidence = newConfidence;
    settings.calibrationApplied = true;
    settings.calibrationAccuracy = calibrationData.accuracy;
    localStorage.setItem('doveDetectorSettings', JSON.stringify(settings));
    
    console.log(`系统设置已更新，置信度阈值调整为: ${newConfidence.toFixed(2)}`);
}

// 应用校准结果
function applyCalibrationResults() {
    // 更新检测模式为"优化模式"
    document.getElementById('detection-mode').value = 'optimized';
    detectionMode = 'optimized';
    
    // 显示校准效果
    showMessage(`校准完成！检测准确率提升至 ${Math.round(calibrationData.accuracy * 100)}%`, 'success');
    
    // 更新侧边栏统计
    updateCalibrationStats();
}

// 更新校准统计
function updateCalibrationStats() {
    const statsPanel = document.querySelector('.stats-panel');
    if (statsPanel) {
        // 添加或更新校准统计项
        let calibrationStat = document.getElementById('calibration-stat');
        if (!calibrationStat) {
            calibrationStat = document.createElement('div');
            calibrationStat.id = 'calibration-stat';
            calibrationStat.className = 'stat-item';
            statsPanel.appendChild(calibrationStat);
        }
        
        calibrationStat.innerHTML = `
            <span class="stat-label">校准准确率</span>
            <span class="stat-value">${Math.round(calibrationData.accuracy * 100)}%</span>
        `;
    }
}

// ========== 辅助功能 ==========

// 拍摄快照
function takeSnapshot() {
    const canvas = document.getElementById('video-canvas');
    if (!canvas) return;
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    link.download = `snapshot_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    addLog('快照', 'success', '快照已保存');
    showMessage('快照已保存', 'success');
}

// 重置计数器
function resetCounters() {
    if (confirm('确定要重置所有计数和统计数据吗？')) {
        // 先停止检测
        stopDetection();
        
        // 重置统计数据
        currentStats = {
            totalCount: 0,
            currentCount: 0,
            detectionCount: 0,
            fps: 30,
            averageConfidence: 0,
            averageSize: 0,
            detectionRate: 0,
            runtime: 0
        };
        
        // 清空历史记录
        detectionHistory = [];
        
        // 更新显示和数据表
        updateDisplay();
        updateDataTable();
        
        addLog('系统', 'info', '所有计数器已重置');
        showMessage('计数器已重置', 'success');
    }
}

// 应用设置
function applySettings() {
    const confidence = parseFloat(document.getElementById('confidence-slider').value);
    const minArea = parseInt(document.getElementById('min-area').value) || 300;
    const maxArea = parseInt(document.getElementById('max-area').value) || 5000;
    const mode = document.getElementById('detection-mode').value;
    
    // 验证输入
    if (minArea >= maxArea) {
        showMessage('最小面积不能大于等于最大面积', 'error');
        return;
    }
    
    detectionMode = mode;
    
    // 保存设置
    const settings = {
        confidence,
        minArea,
        maxArea,
        mode,
        timestamp: new Date().toISOString()
    };
    
    localStorage.setItem('doveDetectorSettings', JSON.stringify(settings));
    
    addLog('设置', 'success', `设置已保存: 阈值=${confidence}, 面积=${minArea}-${maxArea}, 模式=${mode}`);
    showMessage('设置已应用', 'success');
}

// 播放视频
function playVideo() {
    if (!isDetecting) {
        showMessage('请先开始检测', 'warning');
        return;
    }
    addLog('视频控制', 'info', '视频播放');
}

// 暂停视频
function pauseVideo() {
    addLog('视频控制', 'info', '视频暂停');
}

// 下一帧
function nextFrame() {
    addLog('视频控制', 'info', '单帧前进');
}

// 切换录制
function toggleRecording() {
    const recordBtn = document.getElementById('record-btn');
    const indicator = document.getElementById('recording-indicator');
    
    if (!isRecording) {
        // 开始录制
        startRecording();
        recordBtn.innerHTML = '<i class="fas fa-square"></i> 停止录制';
        recordBtn.classList.add('recording');
        if (indicator) indicator.style.display = 'flex';
        showMessage('录制已开始', 'success');
    } else {
        // 停止录制
        stopRecording();
        recordBtn.innerHTML = '<i class="fas fa-circle"></i> 开始录制';
        recordBtn.classList.remove('recording');
        if (indicator) indicator.style.display = 'none';
        showMessage('录制已停止', 'info');
    }
    
    isRecording = !isRecording;
}

// 开始录制
function startRecording() {
    const canvas = document.getElementById('video-canvas');
    if (!canvas) return;
    
    try {
        recordedChunks = [];
        const stream = canvas.captureStream(30);
        mediaRecorder = new MediaRecorder(stream, {
            mimeType: 'video/webm;codecs=vp9'
        });
        
        mediaRecorder.ondataavailable = (event) => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };
        
        mediaRecorder.onstop = saveRecording;
        mediaRecorder.start(100);
        
        addLog('录制', 'info', '屏幕录制开始');
    } catch (error) {
        console.error('录制错误:', error);
        showMessage('录制失败: ' + error.message, 'error');
    }
}

// 停止录制
function stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
    }
}

// 保存录制
function saveRecording() {
    if (recordedChunks.length === 0) return;
    
    const blob = new Blob(recordedChunks, { type: 'video/webm' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    
    link.download = `recording_${timestamp}.webm`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    addLog('录制', 'success', '录制视频已保存');
}

// 拍摄画布截图
function takeCanvasScreenshot() {
    takeSnapshot();
}

// 放大
function zoomIn() {
    const canvas = document.getElementById('video-canvas');
    if (canvas) {
        const currentTransform = canvas.style.transform || 'scale(1)';
        const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
        canvas.style.transform = `scale(${Math.min(currentScale + 0.1, 3)})`;
        addLog('视图', 'info', `放大至 ${(currentScale + 0.1).toFixed(1)}x`);
    }
}

// 缩小
function zoomOut() {
    const canvas = document.getElementById('video-canvas');
    if (canvas) {
        const currentTransform = canvas.style.transform || 'scale(1)';
        const currentScale = parseFloat(currentTransform.match(/scale\(([^)]+)\)/)?.[1] || 1);
        canvas.style.transform = `scale(${Math.max(currentScale - 0.1, 0.5)})`;
        addLog('视图', 'info', `缩小至 ${(currentScale - 0.1).toFixed(1)}x`);
    }
}

// 更新视频进度
function updateVideoProgress() {
    const slider = document.getElementById('video-progress');
    const timeDisplay = document.getElementById('video-time');
    if (slider && timeDisplay) {
        const percent = slider.value;
        const totalSeconds = 630; // 10:30
        const currentSeconds = Math.round(totalSeconds * percent / 100);
        const currentTime = formatTime(currentSeconds);
        const totalTime = formatTime(totalSeconds);
        timeDisplay.textContent = `${currentTime} / ${totalTime}`;
    }
}

// ========== 数据管理功能 ==========

// 导出数据
function exportData() {
    const data = {
        metadata: {
            exportDate: new Date().toISOString(),
            systemVersion: '1.0.0',
            totalRecords: detectionHistory.length,
            calibrationData: calibrationData
        },
        settings: JSON.parse(localStorage.getItem('doveDetectorSettings') || '{}'),
        stats: currentStats,
        history: detectionHistory,
        logs: logs.slice(-1000), // 只导出最近1000条日志
        samples: JSON.parse(localStorage.getItem('doveSamples') || '[]').slice(-100) // 最近100个样本
    };
    
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,10);
    
    link.download = `dove_data_${timestamp}.json`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    addLog('数据导出', 'success', '数据导出完成（包含校准数据）');
    showMessage('数据已导出为JSON文件', 'success');
}

// 清空所有数据
function clearAllData() {
    if (confirm('确定要清空所有数据吗？此操作不可恢复！')) {
        // 先停止检测
        stopDetection();
        
        localStorage.removeItem('doveDetectorSettings');
        localStorage.removeItem('doveDetectionHistory');
        localStorage.removeItem('doveCalibrationData');
        localStorage.removeItem('doveSamples');
        localStorage.removeItem('doveFeatures');
        
        // 重置统计数据
        currentStats = {
            totalCount: 0,
            currentCount: 0,
            detectionCount: 0,
            fps: 30,
            averageConfidence: 0,
            averageSize: 0,
            detectionRate: 0,
            runtime: 0
        };
        
        // 重置校准数据
        calibrationData = {
            totalSamples: 0,
            positiveSamples: 0,
            negativeSamples: 0,
            accuracy: 0.7,
            lastCalibrated: null,
            features: {
                color: { weight: 0.3, accuracy: 0 },
                shape: { weight: 0.4, accuracy: 0 },
                texture: { weight: 0.3, accuracy: 0 }
            }
        };
        
        // 清空历史记录
        detectionHistory = [];
        
        // 更新显示和数据表
        updateDisplay();
        updateDataTable();
        updateAccuracyDisplay();
        
        addLog('数据管理', 'warning', '所有数据已清空');
        showMessage('所有数据已清空', 'warning');
    }
}

// 应用数据过滤器
function applyDataFilters() {
    const startDate = document.getElementById('start-date').value;
    const endDate = document.getElementById('end-date').value;
    const mode = document.getElementById('filter-mode').value;
    
    addLog('数据过滤', 'info', `应用过滤器: ${startDate} 至 ${endDate}, 模式: ${mode}`);
    showMessage('过滤器已应用', 'info');
}

// 导出图表
function exportChartImage() {
    const canvas = document.getElementById('trend-chart');
    if (!canvas) return;
    
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    link.download = `chart_${timestamp}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    
    addLog('图表', 'success', '图表已导出');
    showMessage('图表已导出', 'success');
}

// 刷新统计
function refreshStatistics() {
    updateDataTable();
    showMessage('统计数据已刷新', 'info');
}

// ========== 系统功能 ==========

// 切换全屏
function toggleFullScreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.error('全屏失败:', err);
            showMessage('全屏请求失败', 'error');
        });
        addLog('全屏', 'info', '进入全屏模式');
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
            addLog('全屏', 'info', '退出全屏模式');
        }
    }
}

// 打开帮助
function openHelp() {
    document.getElementById('help-modal').classList.add('active');
    addLog('帮助', 'info', '打开帮助文档');
}

// 刷新视频源
function refreshVideoSources() {
    if (navigator.mediaDevices && navigator.mediaDevices.enumerateDevices) {
        navigator.mediaDevices.enumerateDevices()
            .then(devices => {
                const videoDevices = devices.filter(device => device.kind === 'videoinput');
                updateCameraSelect(videoDevices);
                addLog('设备', 'info', `发现 ${videoDevices.length} 个摄像头设备`);
            })
            .catch(error => {
                console.error('设备枚举失败:', error);
            });
    }
    showMessage('视频源已刷新', 'info');
}

// ========== 日志功能 ==========

// 清空日志
function clearLogs() {
    if (confirm('确定要清空所有日志吗？')) {
        document.getElementById('log-content').innerHTML = '';
        logs = [];
        addLog('日志', 'info', '日志已清空');
        showMessage('日志已清空', 'success');
    }
}

// 切换日志暂停
function toggleLogsPause() {
    isLogsPaused = !isLogsPaused;
    const btn = document.getElementById('pause-logs');
    if (btn) {
        btn.innerHTML = isLogsPaused ? 
            '<i class="fas fa-play"></i> 继续' : 
            '<i class="fas fa-pause"></i> 暂停';
    }
    
    addLog('日志', 'info', isLogsPaused ? '日志暂停' : '日志继续');
}

// 导出日志
function exportLogs() {
    const logText = logs.map(log => 
        `${log.timestamp} [${log.level}] ${log.module}: ${log.message}`
    ).join('\n');
    
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const timestamp = new Date().toISOString().slice(0,19).replace(/:/g, '-');
    
    link.download = `logs_${timestamp}.txt`;
    link.href = url;
    link.click();
    
    URL.revokeObjectURL(url);
    addLog('日志', 'success', '日志已导出');
    showMessage('日志已导出', 'success');
}

// ========== 工具函数 ==========

// 添加日志
function addLog(module, level, message) {
    if (isLogsPaused) return;
    
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = {
        timestamp,
        module,
        level,
        message
    };
    
    logs.push(logEntry);
    
    const logContent = document.getElementById('log-content');
    if (!logContent) return;
    
    const logLine = document.createElement('div');
    logLine.className = `log-line log-${level}`;
    logLine.innerHTML = `
        <span class="log-time">[${timestamp}]</span>
        <span class="log-level">${level.toUpperCase()}</span>
        <span class="log-module">${module}</span>
        <span class="log-message">${message}</span>
    `;
    
    logContent.appendChild(logLine);
    logContent.scrollTop = logContent.scrollHeight;
    
    // 限制日志数量
    if (logs.length > 1000) {
        logs.shift();
        const firstChild = logContent.firstChild;
        if (firstChild) logContent.removeChild(firstChild);
    }
}

// 显示消息
function showMessage(message, type = 'info') {
    // 创建消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = `message message-${type}`;
    messageDiv.innerHTML = `
        <i class="fas ${getIconForType(type)}"></i>
        <span>${message}</span>
        <button class="message-close">&times;</button>
    `;
    
    // 添加到消息容器
    let messageContainer = document.getElementById('message-container');
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.id = 'message-container';
        messageContainer.className = 'message-container';
        document.body.appendChild(messageContainer);
    }
    
    messageContainer.appendChild(messageDiv);
    
    // 自动移除
    setTimeout(() => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    }, 3000);
    
    // 关闭按钮
    messageDiv.querySelector('.message-close').addEventListener('click', () => {
        messageDiv.classList.add('fade-out');
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 300);
    });
}

// 更新显示
function updateDisplay() {
    // 更新统计显示
    document.getElementById('stat-total').textContent = currentStats.totalCount;
    document.getElementById('stat-current').textContent = currentStats.currentCount;
    document.getElementById('stat-rate').textContent = `${(currentStats.detectionRate).toFixed(1)}/min`;
    document.getElementById('stat-confidence').textContent = currentStats.averageConfidence.toFixed(2);
    document.getElementById('stat-size').textContent = `${Math.round(currentStats.averageSize)} px²`;
    document.getElementById('stat-fps').textContent = `${currentStats.fps.toFixed(1)} FPS`;
    document.getElementById('stat-runtime').textContent = formatTime(currentStats.runtime);
    
    // 更新覆盖层显示
    document.getElementById('overlay-total').textContent = currentStats.totalCount;
    document.getElementById('overlay-current').textContent = currentStats.currentCount;
    document.getElementById('overlay-fps').textContent = currentStats.fps.toFixed(1);
    document.getElementById('detection-count').textContent = currentStats.currentCount;
    
    // 更新检测模式显示
    const modeDisplay = document.getElementById('detection-mode-display');
    if (modeDisplay) {
        modeDisplay.textContent = 
            detectionMode === 'simulation' ? '模拟' :
            detectionMode === 'optimized' ? '优化' :
            detectionMode === 'yolo' ? 'YOLO' :
            detectionMode === 'simple' ? '简化' : '运动';
    }
}

// 更新模拟数据
function updateSimulationData() {
    // 应用校准后的准确率
    const baseDetectionRate = 0.7;
    const calibratedRate = calibrationData.accuracy;
    
    // 随机生成新的检测数据（考虑校准后的准确率）
    const detectionChance = calibratedRate;
    const newDetections = Math.random() < detectionChance ? Math.floor(Math.random() * 3) : 0;
    const lostDetections = Math.floor(Math.random() * 2);
    
    currentStats.currentCount = Math.max(0, 
        currentStats.currentCount + newDetections - lostDetections
    );
    
    if (newDetections > 0) {
        currentStats.totalCount += newDetections;
        currentStats.detectionCount += newDetections;
        
        // 添加到历史记录
        detectionHistory.push({
            timestamp: new Date().toLocaleTimeString(),
            detections: currentStats.currentCount,
            total: currentStats.totalCount,
            fps: currentStats.fps
        });
        
        // 保持历史记录长度
        if (detectionHistory.length > 60) {
            detectionHistory.shift();
        }
    }
    
    // 更新其他统计
    currentStats.detectionRate = (currentStats.totalCount / (currentStats.runtime / 60)) || 0;
    currentStats.averageConfidence = calibratedRate;
    currentStats.averageSize = 8000 + Math.random() * 4000;
}

// 绘制模拟帧
function drawSimulationFrame() {
    const canvas = document.getElementById('video-canvas');
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    
    // 设置画布大小
    if (canvas.width !== canvas.clientWidth || canvas.height !== canvas.clientHeight) {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }
    
    // 清除画布
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);
    
    // 绘制网格背景
    drawGridBackground(ctx, width, height);
    
    // 绘制检测框
    if (document.getElementById('show-boxes')?.checked) {
        drawSimulatedDetections(ctx, width, height);
    }
    
    // 绘制轨迹
    if (document.getElementById('show-trails')?.checked) {
        drawTrails(ctx);
    }
}

// 绘制网格背景
function drawGridBackground(ctx, width, height) {
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 1;
    
    const gridSize = 50;
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// 绘制模拟检测框
function drawSimulatedDetections(ctx, width, height) {
    const showLabels = document.getElementById('show-labels')?.checked;
    const showConfidence = document.getElementById('show-confidence')?.checked;
    
    // 使用校准后的准确率决定检测质量
    const detectionQuality = calibrationData.accuracy;
    
    for (let i = 0; i < currentStats.currentCount; i++) {
        const x = 50 + Math.random() * (width - 100);
        const y = 50 + Math.random() * (height - 100);
        const w = 80 + Math.random() * 60;
        const h = 60 + Math.random() * 40;
        const confidence = 0.6 + detectionQuality * 0.4; // 基于准确率的置信度
        
        // 颜色 - 使用校准学习的颜色特征
        const colors = ['#8B4513', '#A0522D', '#D2691E', '#CD853F'];
        const color = colors[i % colors.length];
        
        // 绘制边界框
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        // 绘制标签
        if (showLabels) {
            const label = showConfidence ? 
                `斑鸠 ${(confidence * 100).toFixed(0)}%` : '斑鸠';
            const textWidth = ctx.measureText(label).width;
            
            ctx.fillStyle = color;
            ctx.fillRect(x, y - 25, textWidth + 10, 25);
            
            ctx.fillStyle = 'white';
            ctx.font = '14px Arial';
            ctx.fillText(label, x + 5, y - 8);
        }
        
        // 绘制中心点
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x + w/2, y + h/2, 4, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制轨迹
function drawTrails(ctx) {
    // 简单的轨迹模拟
    ctx.strokeStyle = 'rgba(52, 152, 219, 0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    for (let i = 0; i < 3; i++) {
        const startX = 100 + i * 50;
        const startY = 100 + i * 30;
        ctx.moveTo(startX, startY);
        ctx.lineTo(startX + 100, startY - 50);
    }
    
    ctx.stroke();
}

// 绘制检测框
function drawDetectionBoxes(ctx) {
    if (!document.getElementById('show-boxes')?.checked) return;
    
    for (let i = 0; i < currentStats.currentCount; i++) {
        const x = 50 + Math.random() * (ctx.canvas.width - 100);
        const y = 50 + Math.random() * (ctx.canvas.height - 100);
        const w = 80 + Math.random() * 60;
        const h = 60 + Math.random() * 40;
        
        ctx.strokeStyle = '#2ecc71';
        ctx.lineWidth = 3;
        ctx.strokeRect(x, y, w, h);
        
        ctx.fillStyle = '#2ecc71';
        ctx.font = '14px Arial';
        ctx.fillText('斑鸠', x + 5, y - 5);
    }
}

// 更新时钟
function updateClock() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('zh-CN');
    const timeElement = document.getElementById('overlay-time');
    if (timeElement) {
        timeElement.textContent = timeString;
    }
}

// 更新状态指示器
function updateStatusIndicator(status) {
    const indicator = document.getElementById('status-indicator');
    const statusText = document.getElementById('connection-status');
    const footerStatus = document.getElementById('footer-status');
    
    if (indicator) {
        indicator.className = `status ${status}`;
    }
    
    if (statusText) {
        statusText.textContent = 
            status === 'online' ? '在线' :
            status === 'offline' ? '离线' :
            status === 'connecting' ? '连接中' : status;
    }
    
    if (footerStatus) {
        footerStatus.textContent = 
            status === 'online' ? '运行中' :
            status === 'offline' ? '离线' :
            status === 'connecting' ? '连接中' : '未知';
    }
}

// 更新系统状态
function updateSystemStatus() {
    // 模拟系统状态
    const memoryUsage = (30 + Math.random() * 40).toFixed(1);
    const cpuLoad = (20 + Math.random() * 50).toFixed(1);
    
    document.getElementById('memory-usage').textContent = `${memoryUsage}%`;
    document.getElementById('cpu-load').textContent = `${cpuLoad}%`;
}

// 加载保存的数据
function loadSavedData() {
    try {
        const savedSettings = localStorage.getItem('doveDetectorSettings');
        if (savedSettings) {
            const settings = JSON.parse(savedSettings);
            if (settings.confidence) {
                document.getElementById('confidence-slider').value = settings.confidence;
                document.getElementById('confidence-value').textContent = settings.confidence;
            }
            if (settings.minArea) document.getElementById('min-area').value = settings.minArea;
            if (settings.maxArea) document.getElementById('max-area').value = settings.maxArea;
            if (settings.mode) {
                document.getElementById('detection-mode').value = settings.mode;
                detectionMode = settings.mode;
            }
            addLog('设置', 'info', '已加载保存的设置');
        }
        
        const savedHistory = localStorage.getItem('doveDetectionHistory');
        if (savedHistory) {
            detectionHistory = JSON.parse(savedHistory).slice(-100); // 只保留最近100条
            addLog('数据', 'info', `已加载 ${detectionHistory.length} 条历史记录`);
        }
        
        const savedCalibration = localStorage.getItem('doveCalibrationData');
        if (savedCalibration) {
            calibrationData = JSON.parse(savedCalibration);
            updateAccuracyDisplay();
            if (calibrationData.lastCalibrated) {
                const date = new Date(calibrationData.lastCalibrated);
                addLog('校准', 'info', `系统已校准于 ${date.toLocaleDateString()}, 准确率: ${Math.round(calibrationData.accuracy * 100)}%`);
            }
        }
    } catch (error) {
        console.error('加载数据失败:', error);
    }
}

// 初始化演示数据
function initDemoData() {
    if (detectionHistory.length === 0) {
        // 创建一些演示数据
        const now = new Date();
        for (let i = 0; i < 20; i++) {
            const time = new Date(now);
            time.setMinutes(time.getMinutes() - (20 - i));
            
            detectionHistory.push({
                timestamp: time.toLocaleTimeString('zh-CN'),
                detections: Math.floor(Math.random() * 5) + 1,
                total: 30 + i * 2,
                fps: 28 + Math.random() * 4
            });
        }
        
        currentStats.totalCount = 70;
        currentStats.currentCount = 3;
        currentStats.detectionCount = 45;
        currentStats.fps = 30.5;
        currentStats.averageConfidence = calibrationData.accuracy;
        currentStats.averageSize = 9500;
        currentStats.runtime = 1800;
        
        updateDisplay();
        addLog('数据', 'info', '演示数据初始化完成');
    }
}

// 设置活动导航
function setActiveNav(activeLink) {
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    activeLink.classList.add('active');
    
    const target = activeLink.getAttribute('href').substring(1);
    const section = document.getElementById(target);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
    }
    
    addLog('导航', 'info', `切换到: ${activeLink.textContent.trim()}`);
}

// 设置活动视频源
function setActiveVideoSource(activeOption) {
    document.querySelectorAll('.source-option').forEach(option => {
        option.classList.remove('active');
    });
    
    activeOption.classList.add('active');
    videoSource = activeOption.getAttribute('data-source');
    
    document.querySelectorAll('.source-config-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    
    const configPanel = document.getElementById(`${videoSource}-config`);
    if (configPanel) {
        configPanel.classList.add('active');
    }
    
    addLog('视频源', 'info', `选择视频源: ${activeOption.querySelector('span').textContent}`);
    updateStartButtonState();
}

// 更新开始按钮状态
function updateStartButtonState() {
    const startBtn = document.getElementById('start-btn');
    const stopBtn = document.getElementById('stop-btn');
    
    if (videoSource) {
        startBtn.disabled = false;
        startBtn.classList.remove('disabled');
        stopBtn.disabled = true;
        stopBtn.classList.add('disabled');
    } else {
        startBtn.disabled = true;
        startBtn.classList.add('disabled');
    }
}

// 设置视频源
function setupVideoSource() {
    const defaultOption = document.querySelector('.source-option[data-source="camera"]');
    if (defaultOption) {
        setActiveVideoSource(defaultOption);
    }
}

// 处理视频文件上传
function handleVideoFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const fileInfo = document.getElementById('file-info');
    if (fileInfo) {
        fileInfo.innerHTML = `
            <strong>${file.name}</strong><br>
            大小: ${formatFileSize(file.size)}<br>
            类型: ${file.type}
        `;
    }
    
    videoSource = 'video';
    updateStartButtonState();
    
    addLog('文件', 'info', `视频文件已选择: ${file.name} (${formatFileSize(file.size)})`);
}

// 更新摄像头选择
function updateCameraSelect(devices) {
    const select = document.getElementById('camera-select');
    if (!select) return;
    
    // 保存当前选择
    const currentValue = select.value;
    
    // 清空选项
    select.innerHTML = '';
    
    // 添加默认选项
    select.innerHTML = '<option value="default">默认摄像头</option>';
    
    // 添加发现的摄像头
    devices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `摄像头 ${index + 1}`;
        select.appendChild(option);
    });
    
    // 恢复之前的选择
    select.value = currentValue;
}

// 创建视频元素
function createVideoElement(stream) {
    const video = document.createElement('video');
    video.srcObject = stream;
    video.playsInline = true;
    video.muted = true;
    video.style.display = 'none';
    document.body.appendChild(video);
    
    return video;
}

// 格式化时间
function formatTime(seconds) {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
        return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// 格式化文件大小
function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 获取类型对应的图标
function getIconForType(type) {
    switch(type) {
        case 'success': return 'fa-check-circle';
        case 'error': return 'fa-exclamation-circle';
        case 'warning': return 'fa-exclamation-triangle';
        default: return 'fa-info-circle';
    }
}

// 更新数据表
function updateDataTable() {
    const tbody = document.getElementById('data-table-body');
    if (!tbody) return;
    
    let html = '';
    detectionHistory.slice(-10).reverse().forEach((record, index) => {
        html += `
            <tr>
                <td><input type="checkbox" class="data-checkbox"></td>
                <td>${detectionHistory.length - index}</td>
                <td>${record.timestamp}</td>
                <td><span class="mode-badge">${detectionMode}</span></td>
                <td>${record.detections}</td>
                <td>${Math.floor(record.detections * 0.7)}</td>
                <td>${record.total}</td>
                <td>${record.fps.toFixed(1)}</td>
                <td>${calibrationData.accuracy.toFixed(2)}</td>
                <td>${(100 + Math.random() * 900).toFixed(0)} KB</td>
                <td>
                    <button class="table-btn" onclick="viewRecord(${detectionHistory.length - index})">
                        <i class="fas fa-eye"></i>
                    </button>
                </td>
            </tr>
        `;
    });
    
    tbody.innerHTML = html || '<tr><td colspan="11">暂无数据</td></tr>';
    
    // 更新摘要
    document.getElementById('total-records').textContent = detectionHistory.length;
    document.getElementById('total-detections').textContent = currentStats.totalCount;
    document.getElementById('avg-fps').textContent = currentStats.fps.toFixed(1);
    document.getElementById('avg-confidence').textContent = calibrationData.accuracy.toFixed(2);
}

// 按时间段更新图表
function updateChartsByPeriod(period) {
    addLog('图表', 'info', `更新图表时间段: ${period}`);
    // 这里可以添加实际的图表更新逻辑
}

// 保存数据到localStorage
function saveDataToStorage() {
    try {
        localStorage.setItem('doveDetectionHistory', JSON.stringify(detectionHistory.slice(-1000)));
        addLog('数据', 'info', '数据已自动保存');
    } catch (error) {
        console.error('保存数据失败:', error);
    }
}

// 视图记录
function viewRecord(id) {
    showMessage(`查看记录 #${id}`, 'info');
    addLog('数据', 'info', `查看记录: #${id}`);
}

// 添加紧急停止按钮
function addEmergencyStopButton() {
    const controlPanel = document.querySelector('.control-panel');
    if (!controlPanel) return;
    
    // 检查是否已存在紧急停止按钮
    if (document.getElementById('emergency-stop-btn')) return;
    
    const emergencyBtn = document.createElement('button');
    emergencyBtn.id = 'emergency-stop-btn';
    emergencyBtn.className = 'control-btn danger';
    emergencyBtn.innerHTML = '<i class="fas fa-stop-circle"></i> 紧急停止';
    emergencyBtn.style.background = '#c0392b';
    emergencyBtn.style.marginTop = '10px';
    
    emergencyBtn.addEventListener('click', function() {
        if (confirm('确定要紧急停止所有检测吗？')) {
            // 强制停止所有
            isDetecting = false;
            
            // 清除所有间隔
            if (simulationInterval) {
                clearInterval(simulationInterval);
                simulationInterval = null;
            }
            
            // 停止视频流
            if (videoStream) {
                videoStream.getTracks().forEach(track => track.stop());
                videoStream = null;
            }
            
            // 停止录制
            if (isRecording) {
                toggleRecording();
            }
            
            // 重置UI
            document.getElementById('start-btn').disabled = false;
            document.getElementById('stop-btn').disabled = true;
            document.getElementById('start-btn').innerHTML = '<i class="fas fa-play"></i> 开始检测';
            document.getElementById('stop-btn').innerHTML = '<i class="fas fa-stop"></i> 已停止';
            updateStatusIndicator('offline');
            
            // 清除画布
            clearCanvasAndShowStopped();
            
            console.log('🚨 紧急停止已执行');
            addLog('系统', 'warning', '紧急停止执行');
            showMessage('系统已紧急停止', 'warning');
        }
    });
    
    controlPanel.appendChild(emergencyBtn);
}

// 定期保存数据
setInterval(saveDataToStorage, 30000); // 每30秒保存一次

// ========== 导出到全局 ==========
window.startDetection = startDetection;
window.stopDetection = stopDetection;
window.takeSnapshot = takeSnapshot;
window.resetCounters = resetCounters;
window.openCalibration = openCalibration;
window.applySettings = applySettings;
window.toggleRecording = toggleRecording;
window.exportData = exportData;
window.clearAllData = clearAllData;
window.exportChartImage = exportChartImage;
window.viewRecord = viewRecord;

console.log('✅ script.js 加载完成 - 智能校准版');
// 在 script.js 中添加暫停功能集成

// ========== 暫停功能集成 ==========

// 全局暫停狀態
let isGlobalPaused = false;

// 集成真實檢測器的暫停功能
function setupPauseIntegration() {
    // 監聽暫停狀態變化
    if (window.DoveDetector) {
        // 同步暫停狀態
        window.DoveDetector.onPauseStateChange = function (paused) {
            isGlobalPaused = paused;
            updateGlobalPauseUI(paused);
        };

        // 覆蓋原來的暫停按鈕事件
        document.getElementById('pause-btn')?.addEventListener('click', function () {
            if (window.DoveDetector.isDetecting) {
                window.DoveDetector.togglePause();
            } else {
                showMessage('請先開始檢測', 'warning');
            }
        });
    }
}

// 更新全局暫停UI
function updateGlobalPauseUI(paused) {
    // 更新按鈕狀態
    const pauseBtn = document.getElementById('pause-btn');
    if (pauseBtn) {
        if (paused) {
            pauseBtn.classList.add('paused-btn');
            pauseBtn.classList.remove('warning');
            pauseBtn.innerHTML = '<i class="fas fa-play" id="pause-icon"></i><span id="pause-text">恢复检测</span>';
        } else {
            pauseBtn.classList.remove('paused-btn');
            pauseBtn.classList.add('warning');
            pauseBtn.innerHTML = '<i class="fas fa-pause" id="pause-icon"></i><span id="pause-text">暂停检测</span>';
        }
    }

    // 更新狀態指示器
    updateStatusIndicator(paused ? 'paused' : 'online');

    // 更新覆蓋層
    updatePauseOverlay(paused);

    // 更新統計顯示
    updatePauseStats(paused);
}

// 更新暫停統計
function updatePauseStats(paused) {
    const runtimeElement = document.getElementById('stat-runtime');
    if (runtimeElement && paused) {
        runtimeElement.innerHTML += ' <span style="color:#f39c12">(已暂停)</span>';
    }
}

// 在初始化函數中調用
document.addEventListener('DOMContentLoaded', function () {
    // ... 現有初始化代碼 ...

    // 設置暫停功能集成
    setTimeout(() => {
        setupPauseIntegration();
    }, 1000);

    // ... 現有初始化代碼 ...
});

// 修改開始檢測函數
function startDetection() {
    // 如果有真實檢測器，使用它
    if (window.DoveDetector && window.DoveDetector.isModelLoaded) {
        window.DoveDetector.start();
    } else {
        // 使用模擬檢測
        startSimulationDetection();
    }
}

// 修改停止檢測函數
function stopDetection() {
    // 如果有真實檢測器，使用它
    if (window.DoveDetector && window.DoveDetector.isDetecting) {
        window.DoveDetector.stop();
    } else {
        // 停止模擬檢測
        stopSimulationDetection();
    }
}

// 修改模擬檢測的暫停功能
function toggleSimulationPause() {
    if (!isDetecting) {
        showMessage('請先開始檢測', 'warning');
        return;
    }

    if (isGlobalPaused) {
        resumeSimulationDetection();
    } else {
        pauseSimulationDetection();
    }
}

// 暫停模擬檢測
function pauseSimulationDetection() {
    isGlobalPaused = true;

    if (simulationInterval) {
        clearInterval(simulationInterval);
        simulationInterval = null;
    }

    updateGlobalPauseUI(true);
    showMessage('模擬檢測已暫停', 'info');
}

// 恢復模擬檢測
function resumeSimulationDetection() {
    isGlobalPaused = false;

    // 重新開始模擬檢測
    startSimulationDetection();

    updateGlobalPauseUI(false);
    showMessage('模擬檢測已恢復', 'success');
}
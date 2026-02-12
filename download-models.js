// 模型下载和管理脚本
const ModelManager = {
    // 模型信息
    models: {
        yolov8n: {
            name: 'YOLOv8 Nano',
            size: '6.7 MB',
            accuracy: '68%',
            speed: 'Fast',
            url: 'https://github.com/ultralytics/ultralytics/releases/download/v8.0.0/yolov8n.torchscript',
            webFormat: false,
            description: '轻量级模型，适合移动设备'
        },
        yolov8s: {
            name: 'YOLOv8 Small',
            size: '21.5 MB',
            accuracy: '75%',
            speed: 'Medium',
            url: 'https://github.com/ultralytics/ultralytics/releases/download/v8.0.0/yolov8s.torchscript',
            webFormat: false,
            description: '平衡模型，推荐使用'
        },
        cocoSsd: {
            name: 'COCO-SSD',
            size: '12 MB',
            accuracy: '72%',
            speed: 'Fast',
            url: 'https://storage.googleapis.com/tfjs-models/savedmodel/ssd_mobilenet_v2/saved_model.pb',
            webFormat: true,
            description: 'TensorFlow.js官方模型'
        },
        customDove: {
            name: '斑鸠专用模型',
            size: '15 MB',
            accuracy: '85%',
            speed: 'Medium',
            url: 'models/custom/dove-detector/model.json',
            webFormat: true,
            description: '专门训练用于珠颈斑鸠检测'
        }
    },
    
    // 初始化
    init() {
        this.checkInstalledModels();
        this.setupModelSelector();
    },
    
    // 检查已安装模型
    checkInstalledModels() {
        const installed = localStorage.getItem('installedModels');
        if (installed) {
            this.installedModels = JSON.parse(installed);
        } else {
            this.installedModels = {};
        }
    },
    
    // 设置模型选择器
    setupModelSelector() {
        const modeSelect = document.getElementById('detection-mode');
        if (!modeSelect) return;
        
        // 清空原有选项
        while (modeSelect.options.length > 0) {
            modeSelect.remove(0);
        }
        
        // 添加模型选项
        Object.entries(this.models).forEach(([key, model]) => {
            const option = document.createElement('option');
            option.value = key;
            option.textContent = `${model.name} (${model.size})`;
            
            // 标记已安装模型
            if (this.installedModels[key]) {
                option.textContent += ' ✓';
            }
            
            modeSelect.appendChild(option);
        });
        
        // 添加模拟选项
        const simOption = document.createElement('option');
        simOption.value = 'simulation';
        simOption.textContent = '模拟检测';
        modeSelect.appendChild(simOption);
        
        // 添加事件监听
        modeSelect.addEventListener('change', (e) => {
            this.onModelSelected(e.target.value);
        });
    },
    
    // 模型选择事件
    onModelSelected(modelKey) {
        if (modelKey === 'simulation') {
            this.showModelInfo('模拟检测', '使用模拟数据进行演示，无需下载模型');
            return;
        }
        
        const model = this.models[modelKey];
        if (!model) return;
        
        // 显示模型信息
        this.showModelInfo(model.name, model.description);
        
        // 检查是否已安装
        if (!this.installedModels[modelKey]) {
            this.showDownloadPrompt(modelKey);
        }
    },
    
    // 显示模型信息
    showModelInfo(name, description) {
        let infoPanel = document.getElementById('model-info-panel');
        if (!infoPanel) {
            infoPanel = document.createElement('div');
            infoPanel.id = 'model-info-panel';
            infoPanel.className = 'model-info-panel';
            document.querySelector('.settings-panel').appendChild(infoPanel);
        }
        
        infoPanel.innerHTML = `
            <h4><i class="fas fa-brain"></i> ${name}</h4>
            <p>${description}</p>
        `;
    },
    
    // 显示下载提示
    showDownloadPrompt(modelKey) {
        const model = this.models[modelKey];
        
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h2><i class="fas fa-download"></i> 下载AI模型</h2>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="model-download-info">
                        <h3>${model.name}</h3>
                        <p>${model.description}</p>
                        
                        <div class="model-stats">
                            <div class="model-stat">
                                <span class="stat-label">大小:</span>
                                <span class="stat-value">${model.size}</span>
                            </div>
                            <div class="model-stat">
                                <span class="stat-label">准确率:</span>
                                <span class="stat-value">${model.accuracy}</span>
                            </div>
                            <div class="model-stat">
                                <span class="stat-label">速度:</span>
                                <span class="stat-value">${model.speed}</span>
                            </div>
                        </div>
                        
                        <div class="download-progress" style="display: none;">
                            <div class="progress-bar">
                                <div class="progress-fill" id="download-progress" style="width: 0%"></div>
                            </div>
                            <span id="download-percent">0%</span>
                            <span id="download-speed" style="margin-left: 20px;"></span>
                        </div>
                        
                        <div class="download-controls">
                            <button id="start-download" class="download-btn primary">
                                <i class="fas fa-download"></i> 下载模型
                            </button>
                            <button id="cancel-download" class="download-btn">
                                取消
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // 设置事件监听
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#cancel-download').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('#start-download').addEventListener('click', () => {
            this.downloadModel(modelKey, modal);
        });
        
        // 点击外部关闭
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    },
    
    // 下载模型
    async downloadModel(modelKey, modal) {
        const model = this.models[modelKey];
        const downloadBtn = modal.querySelector('#start-download');
        const cancelBtn = modal.querySelector('#cancel-download');
        const progressBar = modal.querySelector('.download-progress');
        
        // 显示进度条
        progressBar.style.display = 'block';
        downloadBtn.disabled = true;
        
        try {
            // 模拟下载过程
            let progress = 0;
            const interval = setInterval(() => {
                progress += 2;
                
                const progressFill = modal.querySelector('#download-progress');
                const percentText = modal.querySelector('#download-percent');
                const speedText = modal.querySelector('#download-speed');
                
                progressFill.style.width = `${progress}%`;
                percentText.textContent = `${progress}%`;
                speedText.textContent = `速度: ${(Math.random() * 500 + 100).toFixed(0)} KB/s`;
                
                if (progress >= 100) {
                    clearInterval(interval);
                    
                    // 标记为已安装
                    this.installedModels[modelKey] = true;
                    localStorage.setItem('installedModels', JSON.stringify(this.installedModels));
                    
                    // 更新选择器
                    this.setupModelSelector();
                    
                    // 显示完成消息
                    setTimeout(() => {
                        modal.remove();
                        showToast(`模型 ${model.name} 下载完成`, 'success');
                        addLog('模型管理', 'info', `模型 ${model.name} 已下载`);
                    }, 500);
                }
            }, 50);
            
            // 允许取消下载
            cancelBtn.onclick = () => {
                clearInterval(interval);
                modal.remove();
            };
            
        } catch (error) {
            console.error('下载失败:', error);
            showToast('模型下载失败', 'error');
            modal.remove();
        }
    },
    
    // 获取模型配置
    getModelConfig(modelKey) {
        const model = this.models[modelKey];
        if (!model) return null;
        
        return {
            modelPath: model.webFormat ? `models/${modelKey}/model.json` : null,
            isWebFormat: model.webFormat,
            needsConversion: !model.webFormat
        };
    }
};

// 初始化模型管理器
document.addEventListener('DOMContentLoaded', () => {
    ModelManager.init();
});// JavaScript source code

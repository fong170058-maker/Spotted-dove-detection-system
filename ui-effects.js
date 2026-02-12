// UI交互效果和动画
document.addEventListener('DOMContentLoaded', function () {
    // 主题切换
    const themeToggle = document.getElementById('theme-toggle');
    const themePanel = document.getElementById('theme-panel');
    const closeThemePanel = document.querySelector('.close-panel');
    const themeOptions = document.querySelectorAll('.theme-option');

    if (themeToggle) {
        themeToggle.addEventListener('click', function () {
            themePanel.classList.toggle('active');
        });
    }

    if (closeThemePanel) {
        closeThemePanel.addEventListener('click', function () {
            themePanel.classList.remove('active');
        });
    }

    themeOptions.forEach(option => {
        option.addEventListener('click', function () {
            themeOptions.forEach(opt => opt.classList.remove('active'));
            this.classList.add('active');

            const theme = this.dataset.theme;
            document.body.setAttribute('data-theme', theme);

            // 保存主题选择
            localStorage.setItem('theme', theme);

            setTimeout(() => {
                themePanel.classList.remove('active');
            }, 500);
        });
    });

    // 加载保存的主题
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.setAttribute('data-theme', savedTheme);
        themeOptions.forEach(opt => {
            if (opt.dataset.theme === savedTheme) {
                opt.classList.add('active');
            }
        });
    }

    // 视频源选择
    const sourceBtns = document.querySelectorAll('.source-btn');
    sourceBtns.forEach(btn => {
        btn.addEventListener('click', function () {
            sourceBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');

            const source = this.dataset.source;
            // 这里可以添加切换视频源的逻辑
            console.log(`切换到视频源: ${source}`);
        });
    });

    // 切换按钮状态
    const toggleButtons = document.querySelectorAll('.toggle-item input');
    toggleButtons.forEach(button => {
        button.addEventListener('change', function () {
            const label = this.nextElementSibling.nextElementSibling;
            if (this.checked) {
                label.style.opacity = '1';
            } else {
                label.style.opacity = '0.6';
            }
        });
    });

    // 工具提示初始化
    function initTooltips() {
        const tooltips = document.querySelectorAll('[data-tooltip]');
        tooltips.forEach(el => {
            el.addEventListener('mouseenter', function (e) {
                const tooltip = document.createElement('div');
                tooltip.className = 'tooltip';
                tooltip.textContent = this.dataset.tooltip;
                document.body.appendChild(tooltip);

                const rect = this.getBoundingClientRect();
                tooltip.style.position = 'fixed';
                tooltip.style.left = rect.left + rect.width / 2 + 'px';
                tooltip.style.top = rect.top - 10 + 'px';
                tooltip.style.transform = 'translateX(-50%) translateY(-100%)';
            });

            el.addEventListener('mouseleave', function () {
                const tooltip = document.querySelector('.tooltip');
                if (tooltip) {
                    tooltip.remove();
                }
            });
        });
    }

    // 卡片悬停效果
    const cards = document.querySelectorAll('.glass-card');
    cards.forEach(card => {
        card.addEventListener('mouseenter', function () {
            this.style.transform = 'translateY(-5px) scale(1.01)';
        });

        card.addEventListener('mouseleave', function () {
            this.style.transform = 'translateY(0) scale(1)';
        });
    });

    // 按钮点击效果
    const buttons = document.querySelectorAll('.control-button, .action-btn, .icon-button');
    buttons.forEach(button => {
        button.addEventListener('click', function (e) {
            if (this.disabled) return;

            const ripple = document.createElement('span');
            const rect = this.getBoundingClientRect();
            const size = Math.max(rect.width, rect.height);
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                background: rgba(255, 255, 255, 0.6);
                transform: scale(0);
                animation: ripple 0.6s linear;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                pointer-events: none;
            `;

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });

    // 添加涟漪动画样式
    const style = document.createElement('style');
    style.textContent = `
        @keyframes ripple {
            to {
                transform: scale(4);
                opacity: 0;
            }
        }
        
        .tooltip {
            position: fixed;
            background: rgba(31, 41, 55, 0.95);
            color: white;
            padding: 0.5rem 0.75rem;
            border-radius: 0.375rem;
            font-size: 0.75rem;
            white-space: nowrap;
            z-index: 1000;
            pointer-events: none;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
    `;
    document.head.appendChild(style);

    // 实时更新系统状态
    function updateSystemStatus() {
        // 模拟系统状态更新
        const cpuLoad = Math.floor(Math.random() * 40) + 5;
        const memoryUsage = Math.floor(Math.random() * 50) + 20;

        document.getElementById('cpu-load').textContent = cpuLoad + '%';
        document.getElementById('memory-usage').textContent = memoryUsage + '%';
        document.getElementById('system-load').textContent = Math.max(cpuLoad, memoryUsage) + '%';
        document.getElementById('load-bar').style.width = Math.max(cpuLoad, memoryUsage) + '%';

        // 更新会话时间
        const sessionTime = document.getElementById('session-time');
        if (sessionTime) {
            const time = sessionTime.textContent.split(':').map(Number);
            time[2]++;
            if (time[2] >= 60) {
                time[2] = 0;
                time[1]++;
            }
            if (time[1] >= 60) {
                time[1] = 0;
                time[0]++;
            }
            sessionTime.textContent = time.map(t => t.toString().padStart(2, '0')).join(':');
        }

        // 更新最后更新时间
        document.getElementById('last-update').textContent = '刚刚';
    }

    // 每5秒更新一次系统状态
    setInterval(updateSystemStatus, 5000);
    updateSystemStatus(); // 初始化

    // 初始化所有交互效果
    initTooltips();

    console.log('🎨 UI交互效果已加载');
});
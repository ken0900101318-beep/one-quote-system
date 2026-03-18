/**
 * ONE桌遊報價系統 - Toast 通知系統
 * 版本：1.0.0
 * 日期：2026-03-19
 */
const Toast = {
    container: null,
    
    // 初始化容器
    init() {
        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                gap: 10px;
                pointer-events: none;
            `;
            document.body.appendChild(this.container);
        }
    },
    
    // 顯示通知
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.style.cssText = `
            display: flex;
            align-items: center;
            gap: 10px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            opacity: 0;
            transform: translateX(400px);
            transition: all 0.3s;
            min-width: 250px;
            max-width: 400px;
            pointer-events: auto;
            cursor: pointer;
        `;
        
        const colors = {
            success: '#48bb78',
            error: '#f56565',
            warning: '#ed8936',
            info: '#4299e1'
        };
        toast.style.background = colors[type] || colors.info;
        
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        
        toast.innerHTML = `
            <span style="font-size: 1.2em;">${icons[type] || icons.info}</span>
            <span style="flex: 1;">${Utils.escapeHtml(message)}</span>
        `;
        
        // 點擊關閉
        toast.addEventListener('click', () => {
            this.hide(toast);
        });
        
        this.container.appendChild(toast);
        
        // 淡入動畫
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // 自動關閉
        if (duration > 0) {
            setTimeout(() => {
                this.hide(toast);
            }, duration);
        }
    },
    
    // 隱藏通知
    hide(toast) {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(400px)';
        setTimeout(() => toast.remove(), 300);
    },
    
    // 快捷方法
    success(message, duration = 3000) {
        this.show(message, 'success', duration);
    },
    
    error(message, duration = 5000) {
        this.show(message, 'error', duration);
    },
    
    warning(message, duration = 4000) {
        this.show(message, 'warning', duration);
    },
    
    info(message, duration = 3000) {
        this.show(message, 'info', duration);
    }
};

// 行動裝置樣式調整
if (window.matchMedia('(max-width: 768px)').matches) {
    const style = document.createElement('style');
    style.textContent = `
        .toast-container {
            top: auto !important;
            bottom: 20px !important;
            right: 10px !important;
            left: 10px !important;
        }
        .toast-container > div {
            min-width: auto !important;
            max-width: 100% !important;
        }
    `;
    document.head.appendChild(style);
}

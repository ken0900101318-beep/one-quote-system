/**
 * ONE桌遊報價系統 - 通用工具
 * 版本：1.0.0
 * 日期：2026-03-19
 */
const Utils = {
    // HTML 跳脫函數 - 防止 XSS 攻擊
    escapeHtml(text) {
        if (!text && text !== 0) return '';
        const div = document.createElement('div');
        div.textContent = String(text);
        return div.innerHTML;
    },
    
    // 格式化金額
    formatPrice(price) {
        return `$${Number(price || 0).toLocaleString()}`;
    },
    
    // 格式化日期
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-TW');
    },
    
    // 格式化日期時間
    formatDateTime(date) {
        if (!date) return '-';
        const d = new Date(date);
        return d.toLocaleDateString('zh-TW') + ' ' + d.toLocaleTimeString('zh-TW', {hour: '2-digit', minute: '2-digit'});
    },
    
    // 驗證手機號碼（台灣格式：09 開頭，10 位數字）
    validatePhone(phone) {
        return /^09\d{8}$/.test(phone);
    },
    
    // 驗證電子信箱
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // 安全的 JSON.parse
    parseJSON(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`讀取 ${key} 失敗:`, error);
            localStorage.removeItem(key); // 清除損壞的資料
            return defaultValue;
        }
    },
    
    // 安全的 JSON.stringify
    saveJSON(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error(`儲存 ${key} 失敗:`, error);
            return false;
        }
    },
    
    // 防抖函數（debounce）
    debounce(func, delay = 300) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(this, args), delay);
        };
    },
    
    // 產生專案編號（日期 + 隨機數）
    generateProjectNo() {
        const today = new Date();
        const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
        const randomStr = Math.random().toString(36).substring(2, 8).toUpperCase();
        return `${dateStr}-${randomStr}`;
    },
    
    // 複製到剪貼簿
    async copyToClipboard(text) {
        try {
            await navigator.clipboard.writeText(text);
            return true;
        } catch (error) {
            console.error('複製失敗:', error);
            return false;
        }
    },
    
    // 表單驗證
    validateForm(formId) {
        const form = document.getElementById(formId);
        if (!form) return false;
        
        const inputs = form.querySelectorAll('input[required], textarea[required], select[required]');
        for (const input of inputs) {
            if (!input.value.trim()) {
                input.focus();
                return false;
            }
        }
        return true;
    },
    
    // 數字範圍驗證
    validateNumber(value, min = 0, max = Number.MAX_SAFE_INTEGER) {
        const num = Number(value);
        return !isNaN(num) && num >= min && num <= max;
    }
};

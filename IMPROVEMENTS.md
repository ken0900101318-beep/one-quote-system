# ONE桌遊報價系統 - 程式碼改善實作指南

本文件提供具體的程式碼改善範例，可直接複製使用。

---

## 🚀 快速開始：最小改動版本

如果時間有限，優先實作這些最小改動：

### 1. 修正 XSS 漏洞（10 分鐘）

在每個 HTML 檔案的 `<head>` 加入：

```html
<script>
// HTML 跳脫函數
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
</script>
```

然後修改所有 `innerHTML` 使用 `escapeHtml()`：

```javascript
// ❌ 修改前
tbody.innerHTML = projects.map(p => `
    <td>${p.customerName || '-'}</td>
`).join('');

// ✅ 修改後
tbody.innerHTML = projects.map(p => `
    <td>${escapeHtml(p.customerName) || '-'}</td>
`).join('');
```

### 2. 加入 JSON.parse 錯誤處理（5 分鐘）

```javascript
// ❌ 修改前
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));

// ✅ 修改後
let currentUser;
try {
    currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
} catch (error) {
    console.error('讀取使用者資料失敗:', error);
    localStorage.removeItem('oneCurrentUser');
    location.href = '../one-management-portal/index.html';
}
```

### 3. 電話格式驗證（5 分鐘）

在 `create-quote-simple.html` 的表單提交事件中加入：

```javascript
// 在第 120 行附近（表單提交處理）加入
const phone = document.getElementById('phone').value.trim();
if (!/^09\d{8}$/.test(phone)) {
    alert('❌ 請輸入正確的手機號碼（例如：0912345678）');
    return;
}
```

---

## 📦 建立共用檔案

### 第一步：建立 utils.js

建立 `/Users/ken/.openclaw/workspace/one-quote-system/utils.js`：

```javascript
/**
 * ONE桌遊報價系統 - 通用工具
 */
const Utils = {
    // HTML 跳脫
    escapeHtml(text) {
        if (!text) return '';
        const div = document.createElement('div');
        div.textContent = text;
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
    
    // 驗證手機號碼
    validatePhone(phone) {
        return /^09\d{8}$/.test(phone);
    },
    
    // 安全的 JSON.parse
    parseJSON(key, defaultValue = null) {
        try {
            const value = localStorage.getItem(key);
            return value ? JSON.parse(value) : defaultValue;
        } catch (error) {
            console.error(`讀取 ${key} 失敗:`, error);
            return defaultValue;
        }
    }
};
```

然後在每個 HTML 的 `<head>` 中加入：

```html
<script src="utils.js"></script>
```

### 第二步：建立 auth.js

建立 `/Users/ken/.openclaw/workspace/one-quote-system/auth.js`：

```javascript
/**
 * ONE桌遊報價系統 - 認證工具
 */
const Auth = {
    getCurrentUser() {
        return Utils.parseJSON('oneCurrentUser');
    },
    
    requireLogin() {
        const user = this.getCurrentUser();
        if (!user) {
            location.href = '../one-management-portal/index.html';
            return null;
        }
        return user;
    },
    
    logout() {
        if (confirm('確定要登出嗎？')) {
            localStorage.removeItem('oneCurrentUser');
            localStorage.removeItem('currentUser');
            location.href = '../one-management-portal/index.html';
        }
    }
};
```

然後在每個需要登入的頁面加入：

```html
<script src="utils.js"></script>
<script src="auth.js"></script>
<script>
    // 檢查登入
    const currentUser = Auth.requireLogin();
    if (!currentUser) return;
</script>
```

### 第三步：建立 toast.js

建立 `/Users/ken/.openclaw/workspace/one-quote-system/toast.js`：

```javascript
/**
 * ONE桌遊報價系統 - Toast 通知
 */
const Toast = {
    container: null,
    
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
            `;
            document.body.appendChild(this.container);
        }
    },
    
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
        
        this.container.appendChild(toast);
        
        setTimeout(() => {
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        setTimeout(() => {
            toast.style.opacity = '0';
            toast.style.transform = 'translateX(400px)';
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};
```

使用範例：

```javascript
// ❌ 修改前
alert('✅ 報價已儲存！');

// ✅ 修改後
Toast.success('報價已儲存！');
```

---

## 🔧 具體檔案修改

### dashboard-simple.html

#### 修改 1：引入共用檔案

在 `<head>` 中加入：

```html
<script src="utils.js"></script>
<script src="auth.js"></script>
<script src="toast.js"></script>
```

#### 修改 2：簡化登入檢查

```javascript
// ❌ 修改前（第 48-52 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}

// ✅ 修改後
const currentUser = Auth.requireLogin();
if (!currentUser) return;
```

#### 修改 3：加入 Loading 狀態

```javascript
// 修改 loadProjects 函數（第 57 行）
async function loadProjects() {
    const tbody = document.getElementById('projectList');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">⏳ 載入中...</td></tr>';
    
    try {
        const result = await QuoteAPI.getProjects();
        
        if (result.success) {
            allProjects = result.projects || [];
            filterProjects();
        } else {
            Toast.error('載入失敗：' + result.error);
            tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">❌ 載入失敗</td></tr>';
        }
    } catch (error) {
        console.error('載入專案失敗:', error);
        Toast.error('連線失敗：' + error.message);
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">❌ 連線失敗</td></tr>';
    }
}
```

#### 修改 4：修正 XSS 漏洞

```javascript
// 修改 renderProjects 函數（第 96 行）
function renderProjects(projects) {
    const tbody = document.getElementById('projectList');
    
    if (projects.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" style="text-align: center; padding: 40px;">
                    📭 暫無專案資料<br>
                    <button class="btn btn-primary" onclick="location.href='create-quote-simple.html'" style="margin-top: 15px;">
                        ➕ 新增第一個報價
                    </button>
                </td>
            </tr>
        `;
        return;
    }
    
    tbody.innerHTML = projects.map(p => `
        <tr>
            <td>${Utils.escapeHtml(p.projectNumber) || '-'}</td>
            <td>${Utils.escapeHtml(p.customerName) || '-'}</td>
            <td>${Utils.escapeHtml(p.phone) || '-'}</td>
            <td>${Utils.formatPrice(p.totalPrice)}</td>
            <td><span class="status-badge status-${p.status}">${statusNames[p.status] || p.status}</span></td>
            <td>${Utils.formatDate(p.createdAt)}</td>
            <td>
                <button class="btn btn-sm btn-secondary" onclick="viewProject('${p.id}')">檢視</button>
                <button class="btn btn-sm btn-danger" onclick="deleteProject('${p.id}')">刪除</button>
            </td>
        </tr>
    `).join('');
}
```

#### 修改 5：改善刪除功能

```javascript
// 修改 deleteProject 函數（第 117 行）
async function deleteProject(id) {
    const project = allProjects.find(p => p.id === id);
    if (!project) return;
    
    if (!confirm(`確定要刪除專案「${project.customerName}」嗎？\n\n此操作無法復原！`)) {
        return;
    }
    
    // 樂觀更新：先從前端移除
    allProjects = allProjects.filter(p => p.id !== id);
    filterProjects();
    
    try {
        const result = await QuoteAPI.deleteProject(id);
        
        if (result.success) {
            Toast.success(result.message);
        } else {
            Toast.error(result.error);
            // 失敗時重新載入
            await loadProjects();
        }
    } catch (error) {
        Toast.error('連線失敗：' + error.message);
        await loadProjects();
    }
}
```

#### 修改 6：改善登出功能

```javascript
// 修改 logout 函數（第 137 行）
function logout() {
    Auth.logout();
}
```

---

### create-quote-simple.html

#### 修改 1：引入共用檔案

```html
<script src="utils.js"></script>
<script src="auth.js"></script>
<script src="toast.js"></script>
```

#### 修改 2：簡化登入檢查

```javascript
// ❌ 修改前（第 91-95 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}

// ✅ 修改後
const currentUser = Auth.requireLogin();
if (!currentUser) return;
```

#### 修改 3：改善專案編號產生

```javascript
// 修改 generateProjectNumber 函數（第 17 行）
function generateProjectNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    return `ONE${year}${month}${date}-${hours}${minutes}${seconds}`;
}
// 範例：ONE20260319-144530
```

#### 修改 4：加強表單驗證

```javascript
// 修改表單提交處理（第 116 行）
document.getElementById('quoteForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // 收集基本資料
    const customerName = document.getElementById('customerName').value.trim();
    const phone = document.getElementById('phone').value.trim();
    
    // 驗證客戶姓名
    if (!customerName) {
        Toast.error('請輸入客戶姓名');
        document.getElementById('customerName').focus();
        return;
    }
    
    // 驗證電話格式
    if (!Utils.validatePhone(phone)) {
        Toast.error('請輸入正確的手機號碼（例如：0912345678）');
        document.getElementById('phone').focus();
        return;
    }
    
    // 收集項目資料
    const itemsData = [];
    let total = 0;
    let hasError = false;
    
    items.forEach((id, index) => {
        const name = document.getElementById(`itemName${id}`)?.value.trim() || '';
        const qty = parseInt(document.getElementById(`itemQty${id}`)?.value || 0);
        const price = parseFloat(document.getElementById(`itemPrice${id}`)?.value || 0);
        const desc = document.getElementById(`itemDesc${id}`)?.value.trim() || '';
        
        // 驗證項目名稱
        if (!name) {
            Toast.error(`項目 ${index + 1} 請輸入名稱`);
            document.getElementById(`itemName${id}`).focus();
            hasError = true;
            return;
        }
        
        // 驗證數量
        if (qty <= 0 || qty > 10000) {
            Toast.error(`項目 ${index + 1} 數量必須在 1-10000 之間`);
            document.getElementById(`itemQty${id}`).focus();
            hasError = true;
            return;
        }
        
        // 驗證單價
        if (price < 0 || price > 10000000) {
            Toast.error(`項目 ${index + 1} 單價必須在 0-10000000 之間`);
            document.getElementById(`itemPrice${id}`).focus();
            hasError = true;
            return;
        }
        
        const subtotal = Math.round(qty * price);
        itemsData.push({ name, qty, price, desc, subtotal });
        total += subtotal;
    });
    
    if (hasError) return;
    
    if (itemsData.length === 0) {
        Toast.error('請至少新增一個報價項目');
        return;
    }
    
    // 準備資料
    const projectData = {
        projectNumber: document.getElementById('projectNumber').value,
        customerName: customerName,
        phone: phone,
        status: document.getElementById('status').value,
        createdBy: currentUser.name,
        items: itemsData,
        totalPrice: total
    };
    
    // 儲存
    const submitBtn = document.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = '⏳ 儲存中...';
    
    try {
        console.log('準備儲存:', projectData);
        const result = await QuoteAPI.addProject(projectData);
        
        if (result.success) {
            Toast.success('報價已儲存！');
            submitBtn.textContent = '✅ 儲存成功！';
            setTimeout(() => {
                location.href = 'dashboard-simple.html';
            }, 800);
        } else {
            Toast.error(result.error);
            submitBtn.disabled = false;
            submitBtn.textContent = '💾 儲存報價';
        }
    } catch (error) {
        console.error('儲存失敗:', error);
        Toast.error('連線失敗：' + error.message);
        submitBtn.disabled = false;
        submitBtn.textContent = '💾 儲存報價';
    }
});
```

#### 修改 5：改善移除項目確認

```javascript
// 修改 removeItem 函數（第 81 行）
function removeItem(id) {
    const name = document.getElementById(`itemName${id}`)?.value.trim();
    if (name && !confirm(`確定要移除「${name}」嗎？`)) {
        return;
    }
    
    const itemDiv = document.getElementById(`item${id}`);
    if (itemDiv) {
        itemDiv.remove();
        items = items.filter(i => i !== id);
        calculateTotal();
    }
}
```

---

### view-quote.html

#### 修改 1：引入共用檔案

```html
<script src="utils.js"></script>
<script src="auth.js"></script>
<script src="toast.js"></script>
```

#### 修改 2：簡化登入檢查

```javascript
// ❌ 修改前（第 21-25 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}

// ✅ 修改後
const currentUser = Auth.requireLogin();
if (!currentUser) return;
```

#### 修改 3：改善錯誤處理

```javascript
// 修改 ID 檢查（第 35-39 行）
const urlParams = new URLSearchParams(window.location.search);
const projectId = urlParams.get('id');

if (!projectId) {
    document.getElementById('quoteContent').innerHTML = `
        <div style="text-align: center; padding: 60px; color: #dc3545;">
            <h2>❌ 缺少專案 ID</h2>
            <p>請從專案列表選擇報價單</p>
            <button class="btn btn-primary" onclick="location.href='dashboard-simple.html'">返回列表</button>
        </div>
    `;
}

// 修改 loadProject 函數（第 42 行）
async function loadProject() {
    const container = document.getElementById('quoteContent');
    container.innerHTML = '<div style="text-align: center; padding: 60px;">⏳ 載入中...</div>';
    
    try {
        const result = await QuoteAPI.getProject(projectId);
        
        if (result.success) {
            renderQuote(result.project);
        } else {
            Toast.error(result.error);
            container.innerHTML = `
                <div style="text-align: center; padding: 60px; color: #dc3545;">
                    <h2>❌ 載入失敗</h2>
                    <p>${Utils.escapeHtml(result.error)}</p>
                    <button class="btn btn-primary" onclick="location.href='dashboard-simple.html'">返回列表</button>
                </div>
            `;
        }
    } catch (error) {
        console.error('載入失敗:', error);
        Toast.error('連線失敗：' + error.message);
        container.innerHTML = `
            <div style="text-align: center; padding: 60px; color: #dc3545;">
                <h2>❌ 連線失敗</h2>
                <p>${Utils.escapeHtml(error.message)}</p>
                <button class="btn btn-primary" onclick="loadProject()">重試</button>
                <button class="btn btn-secondary" onclick="location.href='dashboard-simple.html'">返回列表</button>
            </div>
        `;
    }
}
```

#### 修改 4：修正 XSS 漏洞

```javascript
// 修改 renderQuote 函數（第 57 行）
function renderQuote(project) {
    const container = document.getElementById('quoteContent');
    
    let itemsHTML = '';
    if (project.items && project.items.length > 0) {
        itemsHTML = `
            <h3 style="margin-top: 30px;">報價項目</h3>
            <table class="table">
                <thead>
                    <tr>
                        <th>項目名稱</th>
                        <th>數量</th>
                        <th>單價</th>
                        <th>小計</th>
                    </tr>
                </thead>
                <tbody>
                    ${project.items.map(item => `
                        <tr>
                            <td>
                                <strong>${Utils.escapeHtml(item.name)}</strong>
                                ${item.desc ? `<br><small style="color: #666;">${Utils.escapeHtml(item.desc)}</small>` : ''}
                            </td>
                            <td>${item.qty}</td>
                            <td>${Utils.formatPrice(item.price)}</td>
                            <td>${Utils.formatPrice(item.subtotal)}</td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    } else {
        itemsHTML = '<p style="color: #999; padding: 20px; text-align: center;">此報價單沒有項目</p>';
    }
    
    container.innerHTML = `
        <div style="border: 2px solid #000; padding: 30px; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="margin: 0;">ONE桌遊</h1>
                <h2 style="margin: 10px 0; color: #666;">報價單</h2>
            </div>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px;">
                <div>
                    <p><strong>專案編號：</strong>${Utils.escapeHtml(project.projectNumber) || '-'}</p>
                    <p><strong>客戶姓名：</strong>${Utils.escapeHtml(project.customerName) || '-'}</p>
                    <p><strong>聯絡電話：</strong>${Utils.escapeHtml(project.phone) || '-'}</p>
                </div>
                <div>
                    <p><strong>狀態：</strong><span class="status-badge status-${project.status}">${statusNames[project.status] || project.status}</span></p>
                    <p><strong>建立日期：</strong>${Utils.formatDate(project.createdAt)}</p>
                    <p><strong>建立人：</strong>${Utils.escapeHtml(project.createdBy) || '-'}</p>
                </div>
            </div>
            
            ${itemsHTML}
            
            <div style="margin-top: 30px; padding: 20px; background: #f8f9fa; border-radius: 5px; text-align: right;">
                <h2 style="margin: 0; color: #28a745;">總計：${Utils.formatPrice(project.totalPrice)}</h2>
            </div>
        </div>
    `;
}
```

---

### api-quote.js

#### 修改 1：改善錯誤處理

```javascript
// 修改 request 方法（第 7-24 行）
async request(action, params = {}) {
    try {
        const queryParams = new URLSearchParams({
            action: action,
            _t: Date.now(),
            ...params
        });
        
        const url = `${QUOTE_API.endpoint}?${queryParams.toString()}`;
        console.log('API 請求:', action, params);
        
        const response = await fetch(url);
        
        // 檢查 HTTP 狀態碼
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        console.log('API 回應:', result);
        return result;
    } catch (error) {
        console.error('API 錯誤:', error);
        
        // 更詳細的錯誤訊息
        if (error.message.includes('Failed to fetch')) {
            throw new Error('網路連線失敗，請檢查網路狀態');
        } else if (error.message.includes('JSON')) {
            throw new Error('伺服器回應格式錯誤');
        } else {
            throw error;
        }
    }
}
```

---

## 📱 行動裝置樣式改善

### style.css 加入以下內容：

```css
/* 行動裝置表格優化 */
@media (max-width: 768px) {
    .table thead {
        display: none;
    }
    
    .table tbody tr {
        display: block;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
        background: white;
    }
    
    .table tbody td {
        display: block;
        text-align: right;
        padding: 8px 10px;
        border: none;
        position: relative;
    }
    
    .table tbody td::before {
        content: attr(data-label);
        float: left;
        font-weight: bold;
        color: #666;
    }
    
    .table tbody td:last-child {
        display: flex;
        justify-content: flex-end;
        gap: 5px;
        margin-top: 10px;
    }
}
```

### dashboard-simple.html 表格加入 data-label：

```javascript
// 修改 renderProjects 函數
tbody.innerHTML = projects.map(p => `
    <tr>
        <td data-label="專案編號">${Utils.escapeHtml(p.projectNumber) || '-'}</td>
        <td data-label="客戶姓名">${Utils.escapeHtml(p.customerName) || '-'}</td>
        <td data-label="聯絡電話">${Utils.escapeHtml(p.phone) || '-'}</td>
        <td data-label="總價">${Utils.formatPrice(p.totalPrice)}</td>
        <td data-label="狀態"><span class="status-badge status-${p.status}">${statusNames[p.status] || p.status}</span></td>
        <td data-label="建立時間">${Utils.formatDate(p.createdAt)}</td>
        <td>
            <button class="btn btn-sm btn-secondary" onclick="viewProject('${p.id}')">檢視</button>
            <button class="btn btn-sm btn-danger" onclick="deleteProject('${p.id}')">刪除</button>
        </td>
    </tr>
`).join('');
```

---

## ✅ 完成檢查清單

複製到你的專案，逐項勾選完成：

### 第一階段：緊急修正（1-2 小時）
- [ ] 建立 utils.js
- [ ] 建立 auth.js  
- [ ] 建立 toast.js
- [ ] 所有 HTML 引入共用檔案
- [ ] 替換所有 `JSON.parse` 為 `Utils.parseJSON`
- [ ] 替換所有 `alert()` 為 `Toast.*`
- [ ] 所有 `innerHTML` 使用 `Utils.escapeHtml()`

### 第二階段：表單驗證（1 小時）
- [ ] create-quote-simple.html 加入客戶姓名驗證
- [ ] create-quote-simple.html 加入電話格式驗證
- [ ] create-quote-simple.html 加入項目名稱驗證
- [ ] create-quote-simple.html 加入數量範圍驗證
- [ ] create-quote-simple.html 加入單價範圍驗證

### 第三階段：使用者體驗（2 小時）
- [ ] dashboard-simple.html 加入 Loading 狀態
- [ ] create-quote-simple.html 加入儲存中狀態
- [ ] view-quote.html 加入 Loading 狀態
- [ ] dashboard-simple.html 改善刪除流程（樂觀更新）
- [ ] 行動裝置表格樣式改善

### 第四階段：錯誤處理（1 小時）
- [ ] api-quote.js 加入 HTTP 狀態碼檢查
- [ ] api-quote.js 改善錯誤訊息
- [ ] view-quote.html 改善錯誤畫面
- [ ] dashboard-simple.html 加入載入失敗處理

### 測試
- [ ] 測試所有表單驗證
- [ ] 測試 XSS 攻擊（輸入 `<script>alert('test')</script>`）
- [ ] 測試手機瀏覽
- [ ] 測試網路斷線情境
- [ ] 測試大量資料載入

---

## 🎯 預期成果

完成以上改善後，系統將達到：

✅ **安全性：** 防止 XSS 攻擊  
✅ **穩定性：** 完整的錯誤處理  
✅ **易用性：** 友善的通知系統  
✅ **維護性：** 共用代碼，易於擴充  
✅ **行動友善：** 手機也能流暢使用  

預估總時間：**5-6 小時**（分成 2-3 天完成）

---

**最後更新：** 2026-03-19  
**適用版本：** ONE桌遊報價系統 v1.0

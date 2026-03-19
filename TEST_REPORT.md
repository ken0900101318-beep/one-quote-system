# ONE桌遊報價系統 - 深度測試報告

**測試日期：** 2026-03-19  
**測試範圍：** 前端功能、API 整合、程式碼品質、使用者體驗  
**測試人員：** AI 子代理  

---

## 📊 執行摘要

### 整體評分
- **功能完整度：** ⭐⭐⭐⭐ 4/5
- **程式碼品質：** ⭐⭐⭐⭐ 4/5  
- **使用者體驗：** ⭐⭐⭐⭐ 4/5
- **錯誤處理：** ⭐⭐⭐ 3/5
- **安全性：** ⭐⭐⭐ 3/5

### 關鍵發現
✅ **優點：**
- 介面簡潔清晰，易於上手
- 基本 CRUD 功能完整
- 樣式設計美觀且一致
- 響應式設計基礎良好

⚠️ **需改善：**
- 缺少表單驗證（電話格式、空白檢查）
- 錯誤處理不夠完善
- 無 Loading 狀態提示
- 資料驗證不足
- 安全性風險（XSS、無權限控制）

---

## 1️⃣ 前端功能測試

### 1.1 index.html - 登入跳轉邏輯

**測試項目：**
- ✅ 讀取 localStorage 登入狀態
- ✅ 未登入時跳轉到員工管理系統
- ✅ 已登入時跳轉到 dashboard

**發現問題：**

#### 🔴 **P1 - 使用者體驗問題：alert() 不友善**
```javascript
// 問題代碼（第 17 行）
alert('請先在員工管理系統登入');
```
**影響：** alert() 會中斷使用者體驗，且不美觀

**建議：** 使用 Toast 通知或直接跳轉，不需要 alert

```javascript
// 改善建議
// 直接跳轉，不要 alert
if (currentUser) {
    window.location.href = 'dashboard-simple.html';
} else {
    // 靜默跳轉，或顯示友善提示
    window.location.href = '../one-management-portal/index.html';
}
```

#### 🟡 **P2 - 缺少載入動畫時間控制**
目前「正在跳轉」畫面會閃一下，使用者體驗不佳

**建議：** 加入最小顯示時間（300-500ms）

---

### 1.2 dashboard-simple.html - 專案列表功能

**測試項目：**
- ✅ 讀取專案列表
- ✅ 狀態篩選功能
- ✅ 關鍵字搜尋功能
- ✅ 刪除專案功能

**發現問題：**

#### 🔴 **P1 - 無 Loading 狀態提示**
```javascript
// 問題：loadProjects() 沒有 loading 狀態
async function loadProjects() {
    try {
        const result = await QuoteAPI.getProjects();
        // ...
    }
}
```

**影響：** 使用者不知道系統正在載入，可能以為卡住

**建議：**
```javascript
async function loadProjects() {
    const tbody = document.getElementById('projectList');
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">⏳ 載入中...</td></tr>';
    
    try {
        const result = await QuoteAPI.getProjects();
        // ...
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px; color: #dc3545;">❌ 載入失敗，請重試</td></tr>';
    }
}
```

#### 🔴 **P1 - 刪除後重新載入延遲不合理**
```javascript
// 問題代碼（第 96 行）
setTimeout(loadProjects, 1000);
```

**影響：** 使用者刪除後要等 1 秒才看到結果，體驗不佳

**建議：** 改為立即重新整理，或使用樂觀更新（先從前端移除，API 失敗才還原）

```javascript
// 建議 1：立即重新整理
if (result.success) {
    alert('✅ ' + result.message);
    await loadProjects(); // 立即重新整理
}

// 建議 2：樂觀更新（更好）
async function deleteProject(id) {
    const project = allProjects.find(p => p.id === id);
    if (!project) return;
    
    if (!confirm(`確定要刪除專案「${project.customerName}」嗎？\n\n此操作無法復原！`)) {
        return;
    }
    
    // 先從前端移除（樂觀更新）
    allProjects = allProjects.filter(p => p.id !== id);
    filterProjects();
    
    try {
        const result = await QuoteAPI.deleteProject(id);
        
        if (!result.success) {
            // 失敗時還原
            alert('❌ ' + result.error);
            await loadProjects();
        }
    } catch (error) {
        alert('❌ 連線失敗：' + error.message);
        await loadProjects();
    }
}
```

#### 🟡 **P2 - 搜尋功能可以加入防抖（debounce）**
```javascript
// 目前：每按一個鍵都立即搜尋
onkeyup="filterProjects()"
```

**建議：** 加入 300ms 防抖，避免頻繁執行

```javascript
let searchTimeout;
function handleSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(filterProjects, 300);
}

// HTML 改為
onkeyup="handleSearch()"
```

#### 🟡 **P3 - 空狀態訊息可以更友善**
```javascript
tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">暫無專案資料</td></tr>';
```

**建議：** 加入引導動作

```javascript
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
```

---

### 1.3 create-quote-simple.html - 新增報價表單

**測試項目：**
- ✅ 表單欄位顯示
- ✅ 動態新增/移除項目
- ✅ 價格計算邏輯
- ✅ 表單提交

**發現問題：**

#### 🔴 **P1 - 表單驗證不足**

**1. 電話格式未驗證**
```html
<input type="tel" id="phone" required>
```

**影響：** 使用者可以輸入任意內容（例如：「abc123」）

**建議：**
```html
<input type="tel" id="phone" required 
       pattern="[0-9]{10}" 
       placeholder="0912345678"
       title="請輸入 10 碼手機號碼">
```

或用 JavaScript 驗證：
```javascript
const phone = document.getElementById('phone').value.trim();
if (!/^09\d{8}$/.test(phone)) {
    alert('❌ 請輸入正確的手機號碼（例如：0912345678）');
    return;
}
```

**2. 客戶姓名未檢查空白**
```javascript
customerName: document.getElementById('customerName').value.trim(),
```

**問題：** 雖然有 `trim()`，但沒有檢查是否為空白

**建議：**
```javascript
const customerName = document.getElementById('customerName').value.trim();
if (!customerName) {
    alert('❌ 請輸入客戶姓名');
    return;
}
```

**3. 項目名稱未檢查空白**
目前只檢查 `name` 是否存在，但沒有 trim

**建議：**
```javascript
const name = document.getElementById(`itemName${id}`)?.value.trim() || '';
if (!name) {
    alert(`❌ 項目 ${index + 1} 請輸入名稱`);
    return;
}
```

#### 🔴 **P1 - 計算邏輯的浮點數問題**
```javascript
// 問題代碼（第 101-102 行）
const qty = parseInt(document.getElementById(`itemQty${id}`)?.value || 0);
const price = parseInt(document.getElementById(`itemPrice${id}`)?.value || 0);
```

**影響：** 使用 `parseInt` 會截斷小數，如果有小數價格（例如 $99.5）會變成 $99

**建議：** 改用 `parseFloat` 並四捨五入

```javascript
const qty = parseInt(document.getElementById(`itemQty${id}`)?.value || 0);
const price = parseFloat(document.getElementById(`itemPrice${id}`)?.value || 0);
const subtotal = Math.round(qty * price); // 四捨五入到整數
```

#### 🟡 **P2 - 專案編號可能重複**
```javascript
// 問題代碼（第 16 行）
const random = String(Math.floor(Math.random() * 1000)).padStart(3, '0');
return `ONE${year}${month}${date}${random}`;
```

**影響：** 同一天內，有 1/1000 機率產生重複編號

**建議：** 加入時間戳或使用 UUID

```javascript
function generateProjectNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const date = String(now.getDate()).padStart(2, '0');
    const time = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    return `ONE${year}${month}${date}-${time}`;
}
// 範例：ONE20260319-1445
```

或使用隨機 UUID：
```javascript
function generateProjectNumber() {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const uuid = crypto.randomUUID().slice(0, 8).toUpperCase();
    return `ONE${dateStr}-${uuid}`;
}
// 範例：ONE20260319-A3F2D1B4
```

#### 🟡 **P3 - 移除項目後沒有確認**
```javascript
function removeItem(id) {
    const itemDiv = document.getElementById(`item${id}`);
    if (itemDiv) {
        itemDiv.remove();
        // ...
    }
}
```

**建議：** 如果已填寫資料，應該確認

```javascript
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

#### 🟢 **P4 - 表單提交成功但可以改善回饋**
```javascript
// 目前代碼（第 146-149 行）
if (result.success) {
    alert('✅ 報價已儲存！');
    location.href = 'dashboard-simple.html';
}
```

**建議：** 加入儲存中狀態

```javascript
const submitBtn = document.querySelector('button[type="submit"]');
submitBtn.disabled = true;
submitBtn.textContent = '⏳ 儲存中...';

try {
    const result = await QuoteAPI.addProject(projectData);
    
    if (result.success) {
        submitBtn.textContent = '✅ 儲存成功！';
        setTimeout(() => {
            location.href = 'dashboard-simple.html';
        }, 500);
    }
} finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '💾 儲存報價';
}
```

---

### 1.4 view-quote.html - 報價單顯示

**測試項目：**
- ✅ 讀取專案資料
- ✅ 顯示報價單
- ✅ 列印功能

**發現問題：**

#### 🔴 **P1 - 缺少錯誤處理：ID 不存在時的體驗**
```javascript
// 問題代碼（第 26-29 行）
if (!projectId) {
    alert('缺少專案 ID');
    location.href = 'dashboard-simple.html';
}
```

**問題：** 使用 `alert()` 會中斷跳轉，使用者體驗不佳

**建議：**
```javascript
if (!projectId) {
    document.getElementById('quoteContent').innerHTML = `
        <div style="text-align: center; padding: 60px; color: #dc3545;">
            <h2>❌ 缺少專案 ID</h2>
            <p>請從專案列表選擇報價單</p>
            <button class="btn btn-primary" onclick="location.href='dashboard-simple.html'">返回列表</button>
        </div>
    `;
    return;
}
```

#### 🟡 **P2 - 載入中沒有提示**
```javascript
async function loadProject() {
    try {
        const result = await QuoteAPI.getProject(projectId);
        // ...
    }
}
```

**建議：**
```javascript
async function loadProject() {
    const container = document.getElementById('quoteContent');
    container.innerHTML = '<div style="text-align: center; padding: 60px;">⏳ 載入中...</div>';
    
    try {
        const result = await QuoteAPI.getProject(projectId);
        // ...
    }
}
```

#### 🟢 **P4 - 列印樣式可以優化**
目前列印樣式只隱藏按鈕，但可以加入：
- 列印專屬的頁眉/頁尾
- QR Code（掃描查看報價單）
- 公司聯絡資訊

---

### 1.5 api-quote.js - API 呼叫邏輯

**測試項目：**
- ✅ 所有 API 方法都已定義
- ✅ 錯誤處理基本完整

**發現問題：**

#### 🔴 **P1 - 網路錯誤處理不足**
```javascript
// 問題代碼（第 20-21 行）
const response = await fetch(url);
const result = await response.json();
```

**問題：** 沒有檢查 HTTP 狀態碼，如果 API 回傳 500/404，會直接失敗

**建議：**
```javascript
const response = await fetch(url);

if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
}

const result = await response.json();
```

#### 🟡 **P2 - 快取策略缺失**
每次都重新抓取資料，可以加入快取減少 API 呼叫

**建議：**
```javascript
const QuoteAPI = {
    cache: {},
    cacheTime: 5 * 60 * 1000, // 5 分鐘
    
    async getProjects() {
        const cacheKey = 'projects';
        const cached = this.cache[cacheKey];
        
        if (cached && (Date.now() - cached.time < this.cacheTime)) {
            console.log('使用快取資料');
            return cached.data;
        }
        
        const result = await this.request('getProjects');
        this.cache[cacheKey] = { data: result, time: Date.now() };
        return result;
    },
    
    // 清除快取（新增/刪除專案後）
    clearCache() {
        this.cache = {};
    }
};
```

#### 🟢 **P4 - 可以加入重試機制**
網路不穩定時，自動重試 2-3 次

**建議：**
```javascript
async request(action, params = {}, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            // ... fetch 邏輯
            return result;
        } catch (error) {
            if (i === retries - 1) throw error;
            console.log(`重試 ${i + 1}/${retries - 1}`);
            await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
        }
    }
}
```

---

### 1.6 style.css - 樣式和排版

**測試項目：**
- ✅ 響應式設計基礎良好
- ✅ 顏色系統一致
- ✅ 排版清晰

**發現問題：**

#### 🟡 **P2 - 行動裝置表格過寬**
```css
@media (max-width: 768px) {
    .table {
        font-size: 0.9em;
    }
}
```

**問題：** 表格欄位太多，在手機上會橫向滾動

**建議：** 行動版改為卡片式設計

```css
@media (max-width: 768px) {
    .table thead {
        display: none;
    }
    
    .table tr {
        display: block;
        margin-bottom: 15px;
        border: 1px solid #ddd;
        border-radius: 8px;
        padding: 10px;
    }
    
    .table td {
        display: block;
        text-align: right;
        padding: 8px;
        border: none;
    }
    
    .table td::before {
        content: attr(data-label);
        float: left;
        font-weight: bold;
    }
}
```

HTML 需要加入 `data-label`：
```html
<td data-label="專案編號">${p.projectNumber}</td>
```

#### 🟢 **P4 - 深色模式支援**
可以加入深色模式支援

```css
@media (prefers-color-scheme: dark) {
    :root {
        --light: #2d3748;
        --dark: #f7fafc;
        --border: #4a5568;
    }
    
    body {
        background: #1a202c;
        color: #e2e8f0;
    }
    
    .card {
        background: #2d3748;
    }
}
```

---

## 2️⃣ API 整合測試（模擬）

由於無法實際執行，我進行程式碼分析模擬測試：

### 2.1 getProjects - 列出所有專案

**預期行為：**
```javascript
{
  "success": true,
  "projects": [
    {
      "id": "xxx",
      "projectNumber": "ONE20260319001",
      "customerName": "王小明",
      "phone": "0912345678",
      "status": "quoted",
      "totalPrice": 50000,
      "createdAt": "2026-03-19T10:30:00Z",
      "createdBy": "張店長"
    }
  ]
}
```

**邊界測試：**

#### 🔴 **測試案例 1：空陣列回傳**
```javascript
// API 回傳
{ "success": true, "projects": [] }

// 前端處理
allProjects = result.projects || [];
filterProjects(); // ✅ 正確處理
```

#### 🔴 **測試案例 2：API 回傳錯誤**
```javascript
// API 回傳
{ "success": false, "error": "資料庫連線失敗" }

// 前端處理
alert('❌ 載入失敗：資料庫連線失敗'); // ✅ 正確處理
```

#### 🔴 **測試案例 3：網路斷線**
```javascript
// Fetch 拋出錯誤
catch (error) {
    console.error('載入專案失敗:', error);
    alert('❌ 連線失敗：' + error.message); // ✅ 正確處理
}
```

**結論：** ✅ 錯誤處理完整

---

### 2.2 getProject - 單一專案

**預期行為：**
```javascript
{
  "success": true,
  "project": {
    "id": "xxx",
    "projectNumber": "ONE20260319001",
    "customerName": "王小明",
    "phone": "0912345678",
    "status": "quoted",
    "totalPrice": 50000,
    "items": [
      {
        "name": "桌遊收納櫃",
        "qty": 2,
        "price": 15000,
        "desc": "3層式，白色",
        "subtotal": 30000
      }
    ],
    "createdAt": "2026-03-19T10:30:00Z",
    "createdBy": "張店長"
  }
}
```

**邊界測試：**

#### 🔴 **測試案例 1：ID 不存在**
```javascript
// API 回傳
{ "success": false, "error": "找不到此專案" }

// 前端處理
alert('❌ 找不到此專案');
location.href = 'dashboard-simple.html'; // ✅ 正確處理
```

#### 🟡 **測試案例 2：items 為空陣列**
```javascript
// API 回傳
{ "success": true, "project": { ..., "items": [] } }

// 前端處理
if (project.items && project.items.length > 0) {
    // 顯示項目
} else {
    // ⚠️ 沒有特別處理，會顯示空表格
}
```

**建議：** 加入空狀態提示

```javascript
if (!project.items || project.items.length === 0) {
    itemsHTML = '<p style="color: #999; padding: 20px;">此報價單沒有項目</p>';
}
```

---

### 2.3 addProject - 新增專案

**預期行為：**
```javascript
// 請求資料
{
  "projectNumber": "ONE20260319001",
  "customerName": "王小明",
  "phone": "0912345678",
  "status": "quoted",
  "createdBy": "張店長",
  "items": [...],
  "totalPrice": 50000
}

// API 回應
{ "success": true, "message": "報價已儲存", "id": "xxx" }
```

**邊界測試：**

#### 🔴 **測試案例 1：空值輸入**
```javascript
// 測試資料
{
  "customerName": "",  // 空字串
  "phone": "",
  "items": []
}
```

**前端處理：**
```javascript
// ⚠️ 問題：customerName.trim() 會是空字串，但沒有檢查
if (projectData.items.length === 0) {
    alert('請至少新增一個報價項目！'); // ✅ 有檢查項目
    return;
}
```

**建議：** 加入更完整的驗證

```javascript
// 驗證客戶資料
if (!projectData.customerName || !projectData.phone) {
    alert('❌ 請填寫客戶姓名和電話');
    return;
}

// 驗證項目
if (projectData.items.length === 0) {
    alert('❌ 請至少新增一個報價項目');
    return;
}

// 驗證總價
if (projectData.totalPrice <= 0) {
    alert('❌ 總價必須大於 0');
    return;
}
```

#### 🔴 **測試案例 2：特殊字元（XSS 攻擊）**
```javascript
// 測試資料
{
  "customerName": "<script>alert('XSS')</script>",
  "phone": "0912345678"
}
```

**前端處理：**
- ⚠️ **沒有過濾特殊字元**，直接顯示在頁面上
- 雖然使用 `innerHTML`，但沒有跳脫 HTML

**建議：** 加入 HTML 跳脫函數

```javascript
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 使用時
<td>${escapeHtml(p.customerName)}</td>
```

或使用 `textContent` 取代 `innerHTML`：
```javascript
const nameCell = document.createElement('td');
nameCell.textContent = p.customerName;
```

#### 🔴 **測試案例 3：超大數字**
```javascript
// 測試資料
{
  "items": [
    {
      "qty": 999999999,
      "price": 999999999
    }
  ]
}
```

**前端處理：**
```javascript
const subtotal = qty * price; // ⚠️ 可能超過 JavaScript 安全整數範圍
```

**建議：** 加入範圍檢查

```javascript
const MAX_PRICE = 10000000; // 1000 萬
const MAX_QTY = 10000;

if (price > MAX_PRICE || qty > MAX_QTY) {
    alert('❌ 數量或單價超過合理範圍');
    return;
}
```

---

### 2.4 deleteProject - 刪除專案

**預期行為：**
```javascript
// 請求
{ "id": "xxx" }

// API 回應
{ "success": true, "message": "專案已刪除" }
```

**邊界測試：**

#### 🔴 **測試案例 1：刪除不存在的 ID**
```javascript
// API 回傳
{ "success": false, "error": "找不到此專案" }

// 前端處理
alert('❌ 找不到此專案'); // ✅ 正確處理
```

#### 🟡 **測試案例 2：連點刪除按鈕**
目前沒有防止重複點擊

**建議：**
```javascript
async function deleteProject(id) {
    const btn = event.target;
    if (btn.disabled) return; // 防止重複點擊
    
    // ...
    
    btn.disabled = true;
    btn.textContent = '刪除中...';
    
    try {
        const result = await QuoteAPI.deleteProject(id);
        // ...
    } finally {
        btn.disabled = false;
        btn.textContent = '刪除';
    }
}
```

---

## 3️⃣ 程式碼品質檢查

### 3.1 重複代碼

#### 🟡 **P2 - 登入檢查重複**
所有頁面都有相同的登入檢查代碼：

```javascript
// dashboard-simple.html（第 48-52 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}

// create-quote-simple.html（第 91-95 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}

// view-quote.html（第 21-25 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
if (!currentUser) {
    alert('請先登入');
    location.href = '../one-management-portal/index.html';
}
```

**建議：** 建立共用的 auth.js

```javascript
// auth.js
const Auth = {
    getCurrentUser() {
        const user = localStorage.getItem('oneCurrentUser');
        return user ? JSON.parse(user) : null;
    },
    
    requireLogin() {
        const user = this.getCurrentUser();
        if (!user) {
            location.href = '../one-management-portal/index.html';
            return false;
        }
        return user;
    },
    
    logout() {
        localStorage.removeItem('oneCurrentUser');
        localStorage.removeItem('currentUser');
        location.href = '../one-management-portal/index.html';
    }
};

// 使用時
const currentUser = Auth.requireLogin();
if (!currentUser) return;
```

#### 🟡 **P2 - 狀態名稱對應重複**
```javascript
// dashboard-simple.html（第 11-16 行）
const statusNames = {
    'quoted': '已報價',
    'signed': '已簽約',
    'construction': '施工中',
    'completed': '已完工'
};

// view-quote.html（第 27-32 行）
const statusNames = {
    'quoted': '已報價',
    'signed': '已簽約',
    'construction': '施工中',
    'completed': '已完工'
};
```

**建議：** 建立共用的 constants.js

```javascript
// constants.js
const STATUS_NAMES = {
    'quoted': '已報價',
    'signed': '已簽約',
    'construction': '施工中',
    'completed': '已完工'
};

const STATUS_OPTIONS = [
    { value: 'quoted', label: '已報價' },
    { value: 'signed', label: '已簽約' },
    { value: 'construction', label: '施工中' },
    { value: 'completed', label: '已完工' }
];
```

---

### 3.2 未使用的代碼

#### 🟢 **P4 - CSS 中有未使用的樣式**

```css
/* style.css（第 89-102 行）- 登入頁面樣式 */
.login-page { ... }
.login-container { ... }
.login-box { ... }
```

**分析：** 這些樣式只在員工管理系統使用，報價系統不需要

**建議：** 
- 選項 1：移除這些樣式
- 選項 2：拆分 CSS（common.css + dashboard.css + login.css）

#### 🟢 **P4 - Modal 樣式未使用**
```css
/* style.css（第 269-359 行）- Modal 樣式 */
.modal { ... }
.modal-content { ... }
```

**分析：** 目前沒有任何頁面使用 Modal

**建議：** 如果未來不打算使用，可以移除

---

### 3.3 錯誤處理完整性

#### 🔴 **P1 - JSON.parse 沒有 try-catch**
```javascript
// dashboard-simple.html（第 48 行）
const currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
```

**風險：** 如果 localStorage 資料損壞，會直接報錯

**建議：**
```javascript
let currentUser;
try {
    currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
} catch (error) {
    console.error('讀取使用者資料失敗:', error);
    localStorage.removeItem('oneCurrentUser');
    location.href = '../one-management-portal/index.html';
}
```

或使用輔助函數：
```javascript
// utils.js
function getJSON(key, defaultValue = null) {
    try {
        const value = localStorage.getItem(key);
        return value ? JSON.parse(value) : defaultValue;
    } catch (error) {
        console.error(`讀取 ${key} 失敗:`, error);
        return defaultValue;
    }
}

// 使用時
const currentUser = getJSON('oneCurrentUser');
```

---

### 3.4 安全性問題

#### 🔴 **P1 - XSS 攻擊風險**
所有使用 `innerHTML` 的地方都有 XSS 風險：

```javascript
// dashboard-simple.html（第 80-90 行）
tbody.innerHTML = projects.map(p => `
    <tr>
        <td>${p.projectNumber || '-'}</td>
        <td>${p.customerName || '-'}</td>  <!-- ⚠️ XSS 風險 -->
        <!-- ... -->
    </tr>
`).join('');
```

**攻擊範例：**
```javascript
{
  "customerName": "<img src=x onerror='alert(\"XSS\")'>"
}
```

**建議：** 使用 HTML 跳脫或 `textContent`

```javascript
// 方法 1：HTML 跳脫
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
}

tbody.innerHTML = projects.map(p => `
    <tr>
        <td>${escapeHtml(p.projectNumber || '-')}</td>
        <td>${escapeHtml(p.customerName || '-')}</td>
        <!-- ... -->
    </tr>
`).join('');

// 方法 2：使用 DOM API（更安全）
const tr = document.createElement('tr');
const tdName = document.createElement('td');
tdName.textContent = p.customerName || '-';
tr.appendChild(tdName);
```

#### 🟡 **P2 - 無權限控制**
目前只要有 `oneCurrentUser` 就可以操作，沒有權限檢查

**建議：**
```javascript
// 檢查使用者角色
const currentUser = Auth.requireLogin();
if (!currentUser.permissions.includes('quote.delete')) {
    // 隱藏刪除按鈕
    deleteBtn.style.display = 'none';
}
```

#### 🟡 **P2 - localStorage 沒有加密**
敏感資料直接存在 localStorage，可以被檢視和修改

**建議：**
- 使用 JWT token 取代完整使用者資料
- 定期驗證 token 有效性
- 敏感操作需要重新驗證

---

## 4️⃣ 使用者體驗評估

### 4.1 載入速度

#### ✅ **優點：**
- 沒有大型圖片/影片
- CSS/JS 檔案很小
- 無外部依賴（除了 Google Fonts）

#### 🟡 **可改善：**
1. **加入 Loading 動畫**
   - 目前無任何載入提示
   - 使用者不知道系統正在處理

2. **骨架屏（Skeleton Screen）**
   ```html
   <div class="skeleton-row">
       <div class="skeleton-cell"></div>
       <div class="skeleton-cell"></div>
   </div>
   ```

3. **資源預載**
   ```html
   <link rel="preconnect" href="https://script.google.com">
   <link rel="dns-prefetch" href="https://script.google.com">
   ```

---

### 4.2 錯誤提示

#### 🔴 **P1 - alert() 不友善**
所有錯誤都使用 `alert()`，體驗不佳

**建議：** 建立 Toast 通知系統

```javascript
// toast.js
const Toast = {
    show(message, type = 'info', duration = 3000) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message) { this.show(message, 'success'); },
    error(message) { this.show(message, 'error'); },
    warning(message) { this.show(message, 'warning'); }
};

// CSS
.toast {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 15px 20px;
    border-radius: 8px;
    color: white;
    opacity: 0;
    transform: translateX(400px);
    transition: all 0.3s;
    z-index: 9999;
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast-success { background: #48bb78; }
.toast-error { background: #f56565; }
.toast-warning { background: #ed8936; }

// 使用
Toast.success('報價已儲存！');
Toast.error('連線失敗，請重試');
```

---

### 4.3 操作流程

#### ✅ **優點：**
1. 流程清晰：登入 → 列表 → 新增/檢視
2. 按鈕位置合理
3. 返回按鈕明確

#### 🟡 **可改善：**

1. **確認對話框不友善**
   ```javascript
   // 目前
   if (!confirm('確定要刪除專案「${project.customerName}」嗎？\n\n此操作無法復原！')) {
       return;
   }
   ```
   
   **建議：** 建立自訂對話框
   ```javascript
   // modal-confirm.js
   function confirmDelete(projectName) {
       return new Promise((resolve) => {
           const modal = document.createElement('div');
           modal.className = 'modal show';
           modal.innerHTML = `
               <div class="modal-content" style="max-width: 400px;">
                   <h3 style="color: #dc3545;">⚠️ 確定要刪除？</h3>
                   <p>專案：<strong>${projectName}</strong></p>
                   <p style="color: #666;">此操作無法復原！</p>
                   <div style="display: flex; gap: 10px; margin-top: 20px;">
                       <button class="btn btn-secondary" onclick="this.closest('.modal').remove(); arguments[0](false)">取消</button>
                       <button class="btn btn-danger" onclick="this.closest('.modal').remove(); arguments[0](true)">確定刪除</button>
                   </div>
               </div>
           `;
           modal.onclick = (e) => {
               if (e.target === modal) {
                   modal.remove();
                   resolve(false);
               }
           };
           document.body.appendChild(modal);
       });
   }
   ```

2. **表單未儲存提示**
   使用者填寫一半離開頁面時，應該提示

   ```javascript
   let formDirty = false;
   
   document.getElementById('quoteForm').addEventListener('input', () => {
       formDirty = true;
   });
   
   window.addEventListener('beforeunload', (e) => {
       if (formDirty) {
           e.preventDefault();
           e.returnValue = '';
       }
   });
   ```

3. **快捷鍵支援**
   ```javascript
   // 例如：Ctrl+S 儲存
   document.addEventListener('keydown', (e) => {
       if (e.ctrlKey && e.key === 's') {
           e.preventDefault();
           document.getElementById('quoteForm').dispatchEvent(new Event('submit'));
       }
   });
   ```

---

### 4.4 改善空間

#### 🟡 **短期改善（1-2 天可完成）**

1. ✅ **加入 Loading 狀態**
   - 所有 API 呼叫加入載入提示
   - 按鈕加入 disabled 狀態

2. ✅ **表單驗證加強**
   - 電話格式檢查
   - 空白檢查
   - 數字範圍檢查

3. ✅ **Toast 通知取代 alert**
   - 建立 toast.js
   - 替換所有 alert()

4. ✅ **HTML 跳脫防止 XSS**
   - 建立 escapeHtml() 函數
   - 處理所有 innerHTML

5. ✅ **共用代碼抽取**
   - 建立 auth.js
   - 建立 constants.js
   - 建立 utils.js

#### 🚀 **長期改善（1-2 週）**

1. **權限管理系統**
   - 角色定義（管理員、店長、員工）
   - 權限檢查（新增、刪除、檢視）
   - 操作記錄

2. **報價單進階功能**
   - 匯出 PDF
   - 匯出 Excel
   - Email 發送
   - WhatsApp 分享

3. **資料分析**
   - 報價統計（總金額、平均金額）
   - 轉換率（報價 → 簽約）
   - 圖表顯示

4. **離線支援**
   - Service Worker
   - IndexedDB 快取
   - 離線新增報價（同步機制）

5. **效能優化**
   - 虛擬滾動（大量資料）
   - 分頁載入
   - 圖片 lazy loading

---

## 📋 問題清單（優先級排序）

### 🔴 **P1 - 必須立即修正**

| # | 問題 | 位置 | 影響 | 預估時間 |
|---|------|------|------|----------|
| 1 | XSS 攻擊風險 | 所有 innerHTML | 安全性嚴重漏洞 | 2 小時 |
| 2 | 表單驗證不足 | create-quote-simple.html | 可儲存錯誤資料 | 1 小時 |
| 3 | JSON.parse 沒有 try-catch | 所有頁面 | 可能導致系統崩潰 | 30 分鐘 |
| 4 | 網路錯誤處理不足 | api-quote.js | API 錯誤無法正確處理 | 1 小時 |
| 5 | 無 Loading 狀態 | 所有頁面 | 使用者體驗差 | 2 小時 |

### 🟡 **P2 - 應盡快改善**

| # | 問題 | 位置 | 影響 | 預估時間 |
|---|------|------|------|----------|
| 6 | 重複代碼（登入檢查） | 所有頁面 | 維護困難 | 1 小時 |
| 7 | 專案編號可能重複 | create-quote-simple.html | 資料管理混亂 | 30 分鐘 |
| 8 | alert() 不友善 | 所有頁面 | 使用者體驗差 | 3 小時 |
| 9 | 行動裝置表格過寬 | style.css | 手機使用困難 | 2 小時 |
| 10 | 刪除後延遲重新整理 | dashboard-simple.html | 使用者體驗差 | 15 分鐘 |

### 🟢 **P3 - 建議改善**

| # | 問題 | 位置 | 影響 | 預估時間 |
|---|------|------|------|----------|
| 11 | 搜尋無防抖 | dashboard-simple.html | 效能浪費 | 30 分鐘 |
| 12 | 移除項目無確認 | create-quote-simple.html | 誤操作風險 | 15 分鐘 |
| 13 | 未使用的 CSS | style.css | 檔案過大 | 1 小時 |
| 14 | 無權限控制 | 全系統 | 安全風險 | 4 小時 |
| 15 | 表單未儲存提示 | create-quote-simple.html | 資料遺失風險 | 30 分鐘 |

---

## 🚀 優化建議

### 短期優化（1-3 天）

#### 第一天：安全性修正
1. ✅ 修正所有 XSS 風險（建立 escapeHtml 函數）
2. ✅ 加入 JSON.parse try-catch
3. ✅ 加強表單驗證

#### 第二天：使用者體驗改善
1. ✅ 建立 Toast 通知系統
2. ✅ 加入 Loading 狀態
3. ✅ 優化行動裝置樣式

#### 第三天：程式碼重構
1. ✅ 抽取共用代碼（auth.js, constants.js, utils.js）
2. ✅ 移除未使用的代碼
3. ✅ 加入程式碼註解

### 長期優化（1-2 週）

#### 功能擴充
- 匯出 PDF/Excel
- Email 發送報價單
- 報價單範本系統
- 客戶管理（整合客戶資料）

#### 效能優化
- API 快取機制
- 分頁載入（大量資料）
- Service Worker（離線支援）

#### 進階功能
- 權限管理系統
- 操作記錄（Audit Log）
- 資料統計分析
- 多語言支援

---

## 📝 程式碼改善建議

### 建議建立的新檔案

#### 1. auth.js - 認證工具
```javascript
/**
 * ONE桌遊報價系統 - 認證工具
 */
const Auth = {
    getCurrentUser() {
        try {
            const user = localStorage.getItem('oneCurrentUser');
            return user ? JSON.parse(user) : null;
        } catch (error) {
            console.error('讀取使用者資料失敗:', error);
            localStorage.removeItem('oneCurrentUser');
            return null;
        }
    },
    
    requireLogin(redirectUrl = '../one-management-portal/index.html') {
        const user = this.getCurrentUser();
        if (!user) {
            location.href = redirectUrl;
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
    },
    
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user || !user.permissions) return false;
        return user.permissions.includes(permission);
    }
};
```

#### 2. utils.js - 通用工具
```javascript
/**
 * ONE桌遊報價系統 - 通用工具
 */
const Utils = {
    // HTML 跳脫
    escapeHtml(text) {
        if (!text) return '';
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return String(text).replace(/[&<>"']/g, m => map[m]);
    },
    
    // 格式化金額
    formatPrice(price) {
        return `$${Number(price || 0).toLocaleString()}`;
    },
    
    // 格式化日期
    formatDate(date) {
        if (!date) return '-';
        return new Date(date).toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
        });
    },
    
    // 格式化日期時間
    formatDateTime(date) {
        if (!date) return '-';
        return new Date(date).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    },
    
    // 防抖
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },
    
    // 節流
    throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },
    
    // 驗證手機號碼
    validatePhone(phone) {
        return /^09\d{8}$/.test(phone);
    },
    
    // 驗證 Email
    validateEmail(email) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    
    // 產生 UUID
    generateUUID() {
        return crypto.randomUUID();
    }
};
```

#### 3. toast.js - Toast 通知
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
            document.body.appendChild(this.container);
        }
    },
    
    show(message, type = 'info', duration = 3000) {
        this.init();
        
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        }[type] || 'ℹ️';
        
        toast.innerHTML = `
            <span class="toast-icon">${icon}</span>
            <span class="toast-message">${Utils.escapeHtml(message)}</span>
        `;
        
        this.container.appendChild(toast);
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, duration);
    },
    
    success(message, duration) { this.show(message, 'success', duration); },
    error(message, duration) { this.show(message, 'error', duration); },
    warning(message, duration) { this.show(message, 'warning', duration); },
    info(message, duration) { this.show(message, 'info', duration); }
};

// CSS (加入 style.css)
/*
.toast-container {
    position: fixed;
    top: 20px;
    right: 20px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 10px;
}

.toast {
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
}

.toast.show {
    opacity: 1;
    transform: translateX(0);
}

.toast-icon {
    font-size: 1.2em;
}

.toast-message {
    flex: 1;
}

.toast-success { background: #48bb78; }
.toast-error { background: #f56565; }
.toast-warning { background: #ed8936; }
.toast-info { background: #4299e1; }
*/
```

#### 4. constants.js - 常數定義
```javascript
/**
 * ONE桌遊報價系統 - 常數定義
 */
const Constants = {
    // 狀態定義
    STATUS: {
        QUOTED: 'quoted',
        SIGNED: 'signed',
        CONSTRUCTION: 'construction',
        COMPLETED: 'completed'
    },
    
    // 狀態名稱
    STATUS_NAMES: {
        'quoted': '已報價',
        'signed': '已簽約',
        'construction': '施工中',
        'completed': '已完工'
    },
    
    // 狀態選項（用於下拉選單）
    STATUS_OPTIONS: [
        { value: 'quoted', label: '已報價' },
        { value: 'signed', label: '已簽約' },
        { value: 'construction', label: '施工中' },
        { value: 'completed', label: '已完工' }
    ],
    
    // 數字限制
    MAX_PRICE: 10000000,  // 1000 萬
    MAX_QTY: 10000,
    
    // 快取時間
    CACHE_TIME: 5 * 60 * 1000,  // 5 分鐘
    
    // API 重試次數
    API_RETRY: 3,
    
    // Toast 顯示時間
    TOAST_DURATION: {
        SHORT: 2000,
        MEDIUM: 3000,
        LONG: 5000
    }
};
```

#### 5. loading.js - Loading 狀態管理
```javascript
/**
 * ONE桌遊報價系統 - Loading 狀態管理
 */
const Loading = {
    overlay: null,
    
    init() {
        if (!this.overlay) {
            this.overlay = document.createElement('div');
            this.overlay.className = 'loading-overlay';
            this.overlay.innerHTML = `
                <div class="loading-spinner">
                    <div class="spinner"></div>
                    <div class="loading-text">載入中...</div>
                </div>
            `;
            document.body.appendChild(this.overlay);
        }
    },
    
    show(message = '載入中...') {
        this.init();
        this.overlay.querySelector('.loading-text').textContent = message;
        this.overlay.classList.add('show');
    },
    
    hide() {
        if (this.overlay) {
            this.overlay.classList.remove('show');
        }
    }
};

// CSS (加入 style.css)
/*
.loading-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9998;
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s;
}

.loading-overlay.show {
    opacity: 1;
    visibility: visible;
}

.loading-spinner {
    text-align: center;
    color: white;
}

.spinner {
    width: 50px;
    height: 50px;
    border: 5px solid rgba(255, 255, 255, 0.3);
    border-top-color: white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin: 0 auto 15px;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

.loading-text {
    font-size: 1.1em;
}
*/
```

---

## 📊 總結

### ✅ 系統優點
1. **介面設計清晰美觀** - 使用者容易上手
2. **基本功能完整** - CRUD 都已實作
3. **響應式設計基礎良好** - 支援行動裝置
4. **程式碼結構清晰** - 職責分離明確

### ⚠️ 必須改善
1. **安全性問題** - XSS 攻擊、無權限控制
2. **表單驗證不足** - 電話、空白、數字範圍
3. **錯誤處理不完善** - alert 不友善、無 Loading
4. **程式碼重複** - 登入檢查、狀態定義

### 🎯 優先改善項目（依重要性排序）
1. 🔴 修正 XSS 漏洞（2 小時）
2. 🔴 加強表單驗證（1 小時）
3. 🔴 加入 JSON.parse try-catch（30 分鐘）
4. 🔴 建立 Toast 通知系統（3 小時）
5. 🔴 加入 Loading 狀態（2 小時）
6. 🟡 抽取共用代碼（2 小時）
7. 🟡 優化行動裝置樣式（2 小時）

### 📈 評估結論
整體系統功能完整且可用，但在**安全性**和**使用者體驗**方面有明顯改善空間。建議優先處理 P1 問題（約 1 天），再進行 P2 改善（約 2-3 天），即可達到生產環境標準。

---

**報告產生時間：** 2026-03-19 05:57  
**測試人員：** AI 子代理  
**下一步：** 請 Ken 確認優先改善項目，開始實作修正

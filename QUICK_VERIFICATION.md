# ONE桌遊報價系統 - 快速驗證指南

**版本：** v1.2.0  
**預計時間：** 5 分鐘

---

## 🚀 快速驗證（5 步驟）

### 1️⃣ 檢查檔案是否存在

```bash
cd one-quote-system

# 檢查新增的共用檔案
ls -l utils.js auth.js toast.js

# 應該看到 3 個檔案，每個檔案大小 > 1KB
```

**✅ 通過條件：** 3 個檔案都存在

---

### 2️⃣ 檢查 HTML 是否引入共用檔案

```bash
# 檢查 dashboard-simple.html
grep -n "utils.js\|auth.js\|toast.js" dashboard-simple.html

# 應該看到：
# XX:    <script src="utils.js"></script>
# XX:    <script src="auth.js"></script>
# XX:    <script src="toast.js"></script>
```

**✅ 通過條件：** 3 個檔案都有引入

---

### 3️⃣ 檢查 XSS 防護

```bash
# 搜尋 innerHTML（應該都有使用 escapeHtml）
grep -n "innerHTML" dashboard-simple.html create-quote-simple.html view-quote.html

# 應該看到類似：
# XX:    tbody.innerHTML = projects.map(p => `
# XX:        <td>${Utils.escapeHtml(p.customerName) || '-'}</td>
```

**✅ 通過條件：** 所有 `innerHTML` 都使用 `Utils.escapeHtml()`

---

### 4️⃣ 檢查 Toast 替換 alert

```bash
# 搜尋 alert（應該只在確認對話框使用 confirm，不使用 alert）
grep -n "alert(" dashboard-simple.html create-quote-simple.html view-quote.html index.html

# 應該沒有結果，或只有 confirm()
```

**✅ 通過條件：** 沒有使用 `alert()`，都改用 `Toast`

---

### 5️⃣ 檢查 Git 提交

```bash
# 查看最新提交
git log -1 --oneline

# 應該看到：
# 1805733 修復 P1 和 P2 問題 - v1.2.0

# 查看 GitHub 遠端狀態
git status

# 應該看到：
# Your branch is up to date with 'origin/main'.
```

**✅ 通過條件：** 代碼已推送到 GitHub

---

## 🌐 線上驗證（開啟瀏覽器）

### 步驟 1：清除快取
- **Chrome/Edge：** Ctrl+Shift+R（或 Cmd+Shift+R）
- **Safari：** Cmd+Option+R

### 步驟 2：開啟開發者工具
- F12（或 Cmd+Option+I）
- 切換到「Console」標籤

### 步驟 3：驗證共用工具載入
在 Console 執行：
```javascript
// 驗證工具是否載入
console.log('Utils:', typeof Utils);
console.log('Auth:', typeof Auth);
console.log('Toast:', typeof Toast);

// 應該全部顯示 "object"
```

**✅ 通過條件：** 3 個都顯示 `object`

### 步驟 4：測試 XSS 防護
在 Console 執行：
```javascript
// 測試 escapeHtml
Utils.escapeHtml('<script>alert("XSS")</script>');

// 應該回傳：
// "&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"
```

**✅ 通過條件：** HTML 標籤被跳脫

### 步驟 5：測試 Toast 通知
在 Console 執行：
```javascript
Toast.success('測試成功通知');
Toast.error('測試錯誤通知');
Toast.warning('測試警告通知');
Toast.info('測試資訊通知');
```

**✅ 通過條件：** 依序出現 4 個顏色不同的通知

---

## 🧪 功能驗證（3 個關鍵功能）

### ✅ 功能 1：新增報價（含驗證）
1. 點擊「新增報價」
2. 姓名輸入 `王`（1 個字）→ 應顯示錯誤
3. 電話輸入 `0812345678`（不是 09）→ 應顯示錯誤
4. 修正後儲存 → 應顯示「報價已成功儲存」

**✅ 通過條件：** 驗證攔截無效輸入、成功儲存顯示 Toast

### ✅ 功能 2：XSS 攻擊測試
1. 新增報價
2. 姓名輸入 `<script>alert('XSS')</script>`
3. 儲存後檢視報價
4. 頁面不應執行腳本，應顯示純文字

**✅ 通過條件：** 不執行惡意腳本

### ✅ 功能 3：刪除報價（樂觀更新）
1. 在列表點擊「刪除」
2. 確認後，專案應立即從列表消失
3. 不需要等待 API 回應

**✅ 通過條件：** 立即更新 UI

---

## 📊 驗證結果

### 檔案檢查
- [ ] ✅ 共用檔案存在
- [ ] ✅ HTML 引入共用檔案
- [ ] ✅ XSS 防護已實作
- [ ] ✅ Toast 替換 alert
- [ ] ✅ Git 已推送

### 線上驗證
- [ ] ✅ 共用工具載入成功
- [ ] ✅ XSS 防護運作正常
- [ ] ✅ Toast 通知顯示正常

### 功能驗證
- [ ] ✅ 表單驗證運作正常
- [ ] ✅ XSS 攻擊被攔截
- [ ] ✅ 樂觀更新運作正常

---

## 🎯 總結

### 全部通過 ✅
**系統已達生產環境標準！**
- 安全性：XSS 防護、表單驗證
- 穩定性：錯誤處理、JSON 安全解析
- 體驗：Toast 通知、Loading 狀態、樂觀更新

### 部分通過 ⚠️
**需要修正問題後再次驗證**
- 檢查「問題回報」區塊
- 修正後重新執行驗證

### 未通過 ❌
**請聯繫開發人員**
- 提供錯誤訊息截圖
- 說明問題發生步驟

---

**驗證人員：** __________  
**驗證時間：** __________  
**結果：** ✅ 通過 / ⚠️ 部分通過 / ❌ 未通過

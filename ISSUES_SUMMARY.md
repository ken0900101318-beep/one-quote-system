# ONE桌遊報價系統 - 問題清單摘要

**測試日期：** 2026-03-19  
**狀態：** 🟡 可用但需改善

---

## 🔴 P1 - 必須立即修正（預估 6.5 小時）

| # | 問題 | 檔案 | 行數 | 預估時間 | 優先度 |
|---|------|------|------|----------|--------|
| 1 | **XSS 攻擊風險** - 所有使用 innerHTML 的地方未跳脫 HTML | dashboard-simple.html<br>create-quote-simple.html<br>view-quote.html | 多處 | 2 小時 | 🔴🔴🔴 |
| 2 | **表單驗證不足** - 電話、姓名、項目名稱、數字範圍 | create-quote-simple.html | 116-160 | 1 小時 | 🔴🔴 |
| 3 | **JSON.parse 無錯誤處理** - localStorage 資料損壞會崩潰 | 所有頁面 | 多處 | 30 分鐘 | 🔴🔴 |
| 4 | **網路錯誤處理不足** - API 回傳 500/404 無法正確處理 | api-quote.js | 20-21 | 1 小時 | 🔴🔴 |
| 5 | **無 Loading 狀態** - 使用者不知道系統正在載入 | dashboard-simple.html<br>create-quote-simple.html<br>view-quote.html | 多處 | 2 小時 | 🔴 |

**總時間：6.5 小時** ⏱️

---

## 🟡 P2 - 應盡快改善（預估 7.75 小時）

| # | 問題 | 檔案 | 行數 | 預估時間 |
|---|------|------|------|----------|
| 6 | **重複代碼（登入檢查）** - 每個頁面都重複相同代碼 | 所有頁面 | 多處 | 1 小時 |
| 7 | **專案編號可能重複** - 同一天有 1/1000 機率重複 | create-quote-simple.html | 16-21 | 30 分鐘 |
| 8 | **alert() 不友善** - 應改用 Toast 通知 | 所有頁面 | 多處 | 3 小時 |
| 9 | **行動裝置表格過寬** - 手機上需要橫向滾動 | style.css<br>dashboard-simple.html | 多處 | 2 小時 |
| 10 | **刪除後延遲重新整理** - 使用者要等 1 秒 | dashboard-simple.html | 96 | 15 分鐘 |
| 11 | **搜尋無防抖** - 每按一個鍵都執行搜尋 | dashboard-simple.html | 15 | 30 分鐘 |
| 12 | **移除項目無確認** - 誤操作風險 | create-quote-simple.html | 81-88 | 15 分鐘 |
| 13 | **計算邏輯用 parseInt** - 小數價格會被截斷 | create-quote-simple.html | 101-102 | 15 分鐘 |

**總時間：7.75 小時** ⏱️

---

## 🟢 P3 - 建議改善（預估 5.5 小時）

| # | 問題 | 預估時間 |
|---|------|----------|
| 14 | 未使用的 CSS（登入頁面、Modal） | 1 小時 |
| 15 | 無權限控制（所有人都能新增/刪除） | 4 小時 |
| 16 | 表單未儲存提示（離開前提醒） | 30 分鐘 |

**總時間：5.5 小時** ⏱️

---

## 📊 總結

### 發現問題數量
- 🔴 **P1（緊急）：** 5 個
- 🟡 **P2（重要）：** 8 個  
- 🟢 **P3（建議）：** 3 個
- **總計：** 16 個問題

### 預估修正時間
- 🔴 **P1：** 6.5 小時（約 1 工作天）
- 🟡 **P2：** 7.75 小時（約 1 工作天）
- 🟢 **P3：** 5.5 小時（約 0.75 工作天）
- **總計：** 19.75 小時（約 2.5 工作天）

### 建議處理順序

#### 第一天（6.5 小時）：安全性修正
1. ✅ 建立共用檔案（utils.js, auth.js, toast.js）
2. ✅ 修正所有 XSS 漏洞
3. ✅ 加入 JSON.parse 錯誤處理
4. ✅ 加強表單驗證
5. ✅ 改善 API 錯誤處理

#### 第二天（7.75 小時）：使用者體驗改善
1. ✅ 替換所有 alert() 為 Toast
2. ✅ 加入 Loading 狀態
3. ✅ 優化行動裝置樣式
4. ✅ 改善刪除流程（樂觀更新）
5. ✅ 加入搜尋防抖
6. ✅ 改善移除項目確認
7. ✅ 修正計算邏輯

#### 第三天（5.5 小時）：程式碼優化
1. ✅ 移除未使用的代碼
2. ✅ 加入權限控制
3. ✅ 加入表單未儲存提示

---

## 🚀 快速修正（最小改動）

如果時間有限，優先修正這 3 個（30 分鐘）：

### 1. 修正 XSS 漏洞（10 分鐘）
在每個 HTML 加入：
```javascript
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
```

然後所有 `innerHTML` 使用 `escapeHtml()`

### 2. 加入 JSON.parse 錯誤處理（10 分鐘）
```javascript
let currentUser;
try {
    currentUser = JSON.parse(localStorage.getItem('oneCurrentUser'));
} catch (error) {
    console.error('讀取失敗:', error);
    localStorage.removeItem('oneCurrentUser');
    location.href = '../one-management-portal/index.html';
}
```

### 3. 電話格式驗證（10 分鐘）
在 create-quote-simple.html 表單提交前加入：
```javascript
const phone = document.getElementById('phone').value.trim();
if (!/^09\d{8}$/.test(phone)) {
    alert('❌ 請輸入正確的手機號碼（例如：0912345678）');
    return;
}
```

---

## 📁 相關檔案

- **詳細測試報告：** `TEST_REPORT.md`（35 KB）
- **程式碼改善指南：** `IMPROVEMENTS.md`（23 KB）
- **本摘要：** `ISSUES_SUMMARY.md`（本檔案）

---

**測試人員：** AI 子代理  
**最後更新：** 2026-03-19 05:57

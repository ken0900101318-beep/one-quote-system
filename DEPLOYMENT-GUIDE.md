# 報價系統整合部署指南

**版本**: v2.0 (雲端整合版)
**日期**: 2026-03-19

---

## 🎯 部署目標

整合新舊版本，建立一個：
- ✅ 完整可用的報價系統
- ✅ 統一的入口（Management Portal）
- ✅ 雲端同步（Google Sheets）
- ✅ 分類管理功能
- ✅ 跨裝置使用

---

## 📋 部署前檢查

### 1. 確認環境
- [ ] Google Apps Script 存取權限
- [ ] Google Sheets 存取權限
- [ ] GitHub 存取權限
- [ ] 測試環境可用

### 2. 備份資料
```bash
# 備份 Google Sheets
# 1. 開啟報價系統 Sheets
#    https://docs.google.com/spreadsheets/d/1HCRbR2s8Zz5931hhE-Egsp7M8jpclygKi2hwE8rFcrw
# 2. 檔案 → 建立副本
# 3. 命名：「報價系統備份 - 2026-03-19」

# 備份程式碼
git branch backup-before-integration
git push origin backup-before-integration
```

---

## 🚀 部署步驟

### 步驟 1：更新後端 GAS

#### 1.1 開啟 Google Apps Script
```
https://script.google.com/home
```

找到「ONE桌遊報價系統」專案

#### 1.2 更新 backend-quote.gs

**方法 A：完整替換（推薦）**
1. 開啟本地檔案 `one-quote-system/backend-quote.gs`
2. 全選複製（Cmd+A, Cmd+C）
3. 貼到 GAS 編輯器（Cmd+V）
4. 儲存（Cmd+S）

**方法 B：手動新增**
如果只想新增分類管理功能：
1. 找到 `doPost` 函數的 `switch` 區塊
2. 在 `deletePriceItem` 後面加入：
```javascript
case 'addCategory':
  result = addCategory(data.category || {});
  break;
  
case 'updateCategory':
  result = updateCategory(data.id, data.category || {});
  break;
  
case 'deleteCategory':
  result = deleteCategory(data.id);
  break;
```

3. 找到 `doGet` 函數的 `switch` 區塊
4. 在 `deleteProject` 後面加入：
```javascript
case 'addCategory':
  result = addCategory(JSON.parse(e.parameter.data));
  break;
case 'updateCategory':
  result = updateCategory(e.parameter.id, JSON.parse(e.parameter.data));
  break;
case 'deleteCategory':
  result = deleteCategory(e.parameter.id);
  break;
```

5. 在檔案最後加入三個新函數（從 backend-quote.gs 複製）

#### 1.3 部署新版本
1. 點擊「部署」→「新增部署作業」
2. 類型：「網頁應用程式」
3. 執行身分：「我」
4. 存取權限：「所有人」
5. 點擊「部署」
6. **重要**：複製新的網頁應用程式 URL

#### 1.4 測試後端 API
開啟瀏覽器測試：
```
新的 Web App URL + ?action=test
```

預期回應：
```json
{
  "success": true,
  "message": "ONE桌遊報價系統 API 正常運作",
  "timestamp": "..."
}
```

---

### 步驟 2：更新前端 API 端點（如果 URL 有變）

如果步驟 1.3 的 URL 跟舊的不同：

#### 2.1 更新 config-api.js
```javascript
// 找到這行
const QUOTE_API = {
    endpoint: 'https://script.google.com/macros/s/YOUR_NEW_URL/exec'
};
```

更換為新的 URL

---

### 步驟 3：推送前端程式碼到 GitHub

#### 3.1 檢查變更
```bash
cd ~/path/to/your/project
git status
```

應該看到：
- `one-quote-system/backend-quote.gs` (modified)
- `one-quote-system/category-management-cloud.html` (new file)
- `one-quote-system/dashboard-simple.html` (modified)
- `one-quote-system/api-quote.js` (modified)
- `one-management-portal/menu.html` (modified)

#### 3.2 提交變更
```bash
# 加入所有變更
git add one-quote-system/
git add one-management-portal/menu.html

# 提交
git commit -m "feat: 報價系統整合 - 新增雲端分類管理功能

- 新增 category-management-cloud.html（分類管理頁面）
- 更新 backend-quote.gs（新增分類 CRUD API）
- 更新 api-quote.js（新增分類管理 API）
- 修正 Management Portal 連結（導向 dashboard-simple.html）
- 在 dashboard-simple.html 加入分類管理入口
- 完整支援 Google Sheets 雲端同步
- 完整支援跨裝置使用"

# 推送到 GitHub
git push origin main
```

#### 3.3 檢查 GitHub Pages
如果使用 GitHub Pages：
1. 前往 GitHub repository
2. 檢查 Actions 是否成功部署
3. 測試網站是否正常

---

### 步驟 4：初始化 Google Sheets

如果是全新部署，需要初始化工作表：

#### 4.1 執行初始化函數
在 GAS 編輯器：
1. 選擇函數：`initializeSheets`
2. 點擊「執行」
3. 授權存取權限
4. 等待執行完成

#### 4.2 檢查 Sheets
開啟報價系統 Google Sheets：
```
https://docs.google.com/spreadsheets/d/1HCRbR2s8Zz5931hhE-Egsp7M8jpclygKi2hwE8rFcrw
```

確認有以下工作表：
- ✅ 專案報價
- ✅ 價目表
- ✅ 分類（應該包含 4 個預設分類）

---

### 步驟 5：測試驗收

按照 `INTEGRATION-TEST-REPORT.md` 執行所有測試：

#### 5.1 基本功能測試
1. [ ] 登入流程
2. [ ] 進入分類管理
3. [ ] 新增分類
4. [ ] 編輯分類
5. [ ] 刪除分類（未使用）
6. [ ] 刪除分類（已使用，應該失敗）

#### 5.2 整合測試
7. [ ] 新增報價（使用分類）
8. [ ] 編輯報價
9. [ ] 刪除報價

#### 5.3 跨裝置測試
10. [ ] Mac 新增分類
11. [ ] 手機查看分類
12. [ ] 確認資料同步

---

## ⚠️ 常見問題排查

### 問題 1：API 連線失敗
**症狀**: 顯示「連線失敗」或「無法載入」

**檢查**:
1. 檢查 `config-api.js` 的 API 端點是否正確
2. 檢查 GAS 部署是否成功
3. 檢查 GAS 存取權限是否設定為「所有人」
4. 開啟瀏覽器開發者工具 → Network → 查看錯誤訊息

**解決**:
```bash
# 測試 API
curl "YOUR_API_URL?action=test"
```

---

### 問題 2：分類無法載入
**症狀**: 分類列表顯示「暫無分類」

**檢查**:
1. 開啟 Google Sheets → 「分類」工作表
2. 確認有資料（至少標題列）
3. 檢查 `getCategories` 函數是否正常

**解決**:
1. 在 GAS 執行 `initializeSheets()`
2. 重新整理網頁

---

### 問題 3：刪除分類失敗
**症狀**: 刪除時顯示「找不到分類」

**檢查**:
1. 檢查 ID 格式是否正確
2. 檢查 Google Sheets 資料是否存在

**解決**:
1. 重新載入分類列表
2. 檢查開發者工具 Console 錯誤訊息

---

### 問題 4：權限錯誤
**症狀**: 顯示「您沒有權限」

**檢查**:
1. 檢查 `currentUser.role`
2. 確認權限控制邏輯

**解決**:
- viewer 角色無法編輯分類（預期行為）
- 如需開放權限，修改 `category-management-cloud.html` 權限檢查

---

## 📊 部署完成檢查清單

部署完成後，確認以下項目：

### 後端
- [ ] GAS 程式碼已更新
- [ ] 新版本已部署
- [ ] API 測試端點正常
- [ ] Google Sheets 工作表正常

### 前端
- [ ] 程式碼已推送到 GitHub
- [ ] GitHub Pages 部署成功（如適用）
- [ ] 所有頁面正常載入

### 功能
- [ ] Management Portal 連結正確
- [ ] Dashboard 顯示分類管理按鈕
- [ ] 分類管理 CRUD 正常
- [ ] 報價功能正常
- [ ] 跨裝置同步正常

### 資料
- [ ] 舊資料未遺失
- [ ] 新舊資料相容
- [ ] 備份已建立

---

## 🎉 部署完成

恭喜！報價系統整合完成。

**下一步**:
1. 通知所有使用者系統已更新
2. 提供簡短教學（如何使用分類管理）
3. 收集使用者回饋
4. 持續優化功能

---

## 📝 版本記錄

| 版本 | 日期 | 變更內容 |
|------|------|----------|
| v2.0 | 2026-03-19 | 整合新舊版本，新增雲端分類管理 |
| v1.1 | 2026-03-15 | 改進 API 錯誤處理 |
| v1.0 | 2026-03-01 | 初始版本 |

---

**部署人員**: _待填寫_
**部署日期**: _待填寫_
**驗收人員**: _待填寫_
**驗收日期**: _待填寫_

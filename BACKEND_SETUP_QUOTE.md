# ONE桌遊報價系統 - Google Sheets 後端設定

## 💡 架構說明

**員工資料**：使用員工管理系統的 Google Sheets（已存在）
**報價資料**：新建專用的 Google Sheets（專案、價目表、分類）

## 📋 步驟 1：建立 Google Sheets（報價系統專用）

1. 前往 https://sheets.google.com/
2. 建立新試算表
3. 命名：`ONE桌遊報價系統`
4. 複製 Sheets ID（網址中的那段）

---

## 📋 步驟 2：部署 Apps Script

1. **擴充功能 → Apps Script**

2. **貼上 backend-quote.gs 的代碼**

3. **修改 QUOTE_SHEET_ID**：
   ```javascript
   const QUOTE_SHEET_ID = '你的報價系統 Sheets ID';
   ```
   
   **USER_SHEET_ID 已經設定好**（使用員工管理系統）

4. **執行 initializeSheets**：
   - 函式選單 → initializeSheets
   - 點擊執行 ▶️
   - 授權

5. **確認資料表建立**：
   - 回到 Google Sheets
   - 應該有 3 個工作表：
     * 專案報價
     * 價目表
     * 分類
   - **員工資料從員工管理系統讀取，不需要建立**

6. **部署為網路應用程式**：
   - 部署 → 新增部署作業
   - 類型：網路應用程式
   - 執行身分：我
   - 存取權：所有人
   - 複製網址

---

## 📋 步驟 3：測試 API

訪問（替換網址）：
```
https://script.google.com/macros/s/你的ID/exec?action=test
```

應該看到：
```json
{
  "success": true,
  "message": "ONE桌遊報價系統 API 正常運作"
}
```

---

## 📋 步驟 4：告訴我部署網址

把 GAS 部署網址傳給我，我會：
1. 建立測試頁面
2. 確認所有功能正常
3. 更新報價系統前端

---

**完成後傳給我部署網址！**

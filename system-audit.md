# ONE桌遊報價系統 - 功能完整性檢查

## 1. 專案管理 (Projects)
- ✅ 新增專案 (create-quote.html)
- ✅ 編輯專案基本資料 (project.html - editModal)
- ✅ 修改狀態 (project.html - statusModal)
- ❌ **缺少：刪除專案**

## 2. 報價明細 (Quote Items)
- ✅ 建立報價 (create-quote.html)
- ✅ 修改報價數量和單價 (project.html - quoteEditModal)
- ❌ **缺少：刪除報價中的某個項目**
- ❌ **缺少：新增項目到現有報價**

## 3. 收款記錄 (Payments)
- ✅ 新增收款 (project.html - paymentModal)
- ✅ 編輯收款 (project.html - editPayment)
- ✅ 刪除收款 (project.html - deletePayment)

## 4. 施工進度 (Progress)
- ✅ 新增/更新進度 (project.html - progressModal)
- ❌ **缺少：刪除進度記錄（如果記錄錯誤）**

## 5. 價格表 (Price Table)
- ✅ 新增項目 (prices.html)
- ✅ 編輯項目 (prices.html)
- ✅ 刪除項目 (prices.html)

## 6. 使用者管理 (Users)
- ❌ **缺少：新增使用者**
- ❌ **缺少：編輯使用者**
- ❌ **缺少：刪除使用者**
- 目前：只有 data.js 中的固定 5 個使用者

## 7. 報價版本 (Quote Versions)
- ✅ 建立新版本（修改報價時自動）
- ❌ **缺少：刪除錯誤版本**
- ❌ **缺少：回復到舊版本**

---

## 需要新增的功能（7 項）：

### 高優先級（必須）：
1. **刪除專案** - 誤建或測試專案需要刪除
2. **報價中刪除項目** - 報錯項目需要移除
3. **報價中新增項目** - 漏報項目需要補上

### 中優先級（建議）：
4. **刪除進度記錄** - 誤記錄需要刪除
5. **刪除報價版本** - 錯誤版本需要刪除

### 低優先級（未來）：
6. **使用者管理** - 新增/編輯/刪除員工帳號
7. **回復報價版本** - 誤改後回到舊版本

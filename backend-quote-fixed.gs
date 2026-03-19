/**
 * ONE桌遊報價系統 - Google Sheets 後端（安全加固版）
 * 修正項目：
 * #17 - 後端輸入驗證
 * #18 - 並發控制
 * #19 - 專案編號唯一性
 * #20 - Sheets 存在性檢查
 * #21 - 刪除索引修正
 */

// 報價系統專用 Google Sheets ID
const QUOTE_SHEET_ID = '1HCRbR2s8Zz5931hhE-Egsp7M8jpclygKi2hwE8rFcrw';

// 員工管理系統的 Google Sheets ID（已存在）
const USER_SHEET_ID = '1VAn00P6UwTd95cC-UCtQcJcHLIFhSzC9b_2q-hHE_NQ';

// 工作表名稱
const SHEETS = {
  USERS: '員工資料',        // 從員工管理系統讀取
  PROJECTS: '專案報價',     // 報價系統
  PRICE_TABLE: '價目表',    // 報價系統
  CATEGORIES: '分類'        // 報價系統
};

/**
 * 修正 #19: 產生唯一專案 ID
 * 使用 Date.now() + 隨機字串，避免並發衝突
 */
function generateProjectId() {
  return 'P' + Date.now() + '-' + Math.random().toString(36).substr(2, 6);
}

/**
 * 修正 #20: 取得 Sheet 並自動重建（如果不存在）
 */
function getSheet(name, sheetId) {
  sheetId = sheetId || QUOTE_SHEET_ID;
  const ss = SpreadsheetApp.openById(sheetId);
  let sheet = ss.getSheetByName(name);
  
  if (!sheet) {
    // 自動重建
    Logger.log(`工作表 ${name} 不存在，自動建立...`);
    initializeSheets();
    sheet = ss.getSheetByName(name);
  }
  
  return sheet;
}

/**
 * 初始化 Google Sheets（報價系統專用）
 */
function initializeSheets() {
  const ss = SpreadsheetApp.openById(QUOTE_SHEET_ID);
  
  // 1. 專案報價
  let projectsSheet = ss.getSheetByName(SHEETS.PROJECTS);
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet(SHEETS.PROJECTS);
    projectsSheet.appendRow(['ID', '專案編號', '客戶姓名', '聯絡電話', '狀態', '總價', '建立人', '建立時間', '更新時間', '資料JSON']);
  }
  
  // 2. 價目表
  let priceSheet = ss.getSheetByName(SHEETS.PRICE_TABLE);
  if (!priceSheet) {
    priceSheet = ss.insertSheet(SHEETS.PRICE_TABLE);
    priceSheet.appendRow(['ID', '分類', '項目名稱', '單價', '單位', '子分類', '建立時間']);
  } else {
    // 更新現有工作表的標題
    priceSheet.getRange(1, 6).setValue('子分類');
  }
  
  // 3. 分類
  let categoriesSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(SHEETS.CATEGORIES);
    categoriesSheet.appendRow(['ID', '分類名稱', 'Icon', '建立時間']);
    
    // 初始分類
    const categories = [
      ['CAT001', '桌遊設備', '🎲', new Date()],
      ['CAT002', '裝潢工程', '🏗️', new Date()],
      ['CAT003', '家具家電', '🛋️', new Date()],
      ['CAT004', '其他費用', '📋', new Date()]
    ];
    categories.forEach(c => categoriesSheet.appendRow(c));
  }
  
  return '✅ 初始化完成';
}

/**
 * 處理 POST 請求（改進版）
 */
function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action || 'importPriceTable';
    
    let result;
    
    switch (action) {
      case 'importPriceTable':
        result = importPriceTable(data.items || []);
        break;
        
      case 'addProject':
        result = addProject(data.project || {});
        break;
        
      case 'updateProject':
        result = updateProject(data.id, data.project || {});
        break;
        
      case 'addPriceItem':
        result = addPriceItem(data.item || {});
        break;
        
      case 'updatePriceItem':
        result = updatePriceItem(data.id, data.item || {});
        break;
        
      case 'deletePriceItem':
        result = deletePriceItem(data.id);
        break;
        
      default:
        result = { success: false, error: '不支援的操作' };
    }
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (error) {
    return ContentService
      .createTextOutput(JSON.stringify({ 
        success: false, 
        error: error.toString() 
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * 處理 GET 請求
 */
function doGet(e) {
  const action = e.parameter.action || 'test';
  
  if (action === 'test') {
    return ContentService
      .createTextOutput(JSON.stringify({
        success: true,
        message: 'ONE桌遊報價系統 API 正常運作',
        timestamp: new Date()
      }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  
  let result;
  
  switch (action) {
    case 'getUsers':
      result = getUsers();
      break;
    case 'getProjects':
      result = getProjects();
      break;
    case 'getProject':
      result = getProject(e.parameter.id);
      break;
    case 'getPriceTable':
      result = getPriceTable();
      break;
    case 'getCategories':
      result = getCategories();
      break;
    case 'addProject':
      result = addProject(JSON.parse(e.parameter.data));
      break;
    case 'updateProject':
      result = updateProject(e.parameter.id, JSON.parse(e.parameter.data));
      break;
    case 'deleteProject':
      result = handleDeleteProject(e.parameter.id);
      break;
    default:
      result = { success: false, error: '不支援的操作' };
  }
  
  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * 取得所有員工（從員工管理系統讀取）
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function getUsers() {
  try {
    const sheet = getSheet(SHEETS.USERS, USER_SHEET_ID);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const users = [];
    for (let i = 1; i < data.length; i++) {
      users.push({
        id: data[i][0],
        avatar: data[i][1],
        name: data[i][2],
        username: data[i][3],
        role: data[i][5]  // 員工管理系統的欄位順序
      });
    }
    
    return { success: true, users };
  } catch (error) {
    Logger.log('getUsers error: ' + error);
    return { success: false, error: '讀取員工資料失敗' };
  }
}

/**
 * 取得所有專案
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function getProjects() {
  try {
    const sheet = getSheet(SHEETS.PROJECTS);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const projects = [];
    for (let i = 1; i < data.length; i++) {
      const projectData = data[i][9] ? JSON.parse(data[i][9]) : {};
      
      // 相容多種欄位名稱
      const customerName = data[i][2] || projectData.storeName || projectData.customerName || '';
      const phone = data[i][3] || projectData.contact || projectData.phone || '';
      const totalPrice = data[i][5] || projectData.totalAmount || projectData.paidAmount || 0;
      
      projects.push({
        id: data[i][0],
        projectNumber: data[i][1] || projectData.id,
        customerName: customerName,
        phone: phone,
        status: data[i][4],
        totalPrice: totalPrice,
        createdBy: data[i][6],
        createdAt: data[i][7],
        updatedAt: data[i][8],
        ...projectData
      });
    }
    
    return { success: true, projects };
  } catch (error) {
    Logger.log('getProjects error: ' + error);
    return { success: false, error: '讀取專案列表失敗' };
  }
}

/**
 * 取得單一專案
 * @param {string} id - 可以是內部 ID (P1710123456789) 或專案編號 (P-2025001)
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function getProject(id) {
  try {
    const sheet = getSheet(SHEETS.PROJECTS);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      // 支援用內部 ID 或專案編號查詢
      if (data[i][0] === id || data[i][1] === id) {
        const projectData = data[i][9] ? JSON.parse(data[i][9]) : {};
        
        // 相容多種欄位名稱
        const customerName = data[i][2] || projectData.storeName || projectData.customerName || '';
        const phone = data[i][3] || projectData.contact || projectData.phone || '';
        const totalPrice = data[i][5] || projectData.totalAmount || projectData.paidAmount || 0;
        
        return {
          success: true,
          project: {
            id: data[i][0],
            projectNumber: data[i][1] || projectData.id,
            customerName: customerName,
            phone: phone,
            status: data[i][4],
            totalPrice: totalPrice,
            createdBy: data[i][6],
            createdAt: data[i][7],
            updatedAt: data[i][8],
            ...projectData
          }
        };
      }
    }
    
    return { success: false, error: '找不到專案' };
  } catch (error) {
    Logger.log('getProject error: ' + error);
    return { success: false, error: '讀取專案失敗' };
  }
}

/**
 * 取得價目表
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function getPriceTable() {
  try {
    const sheet = getSheet(SHEETS.PRICE_TABLE);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const items = [];
    for (let i = 1; i < data.length; i++) {
      items.push({
        id: data[i][0],
        category: data[i][1],
        name: data[i][2],
        price: data[i][3],
        unit: data[i][4],
        subCategory: data[i][5]
      });
    }
    
    return { success: true, items };
  } catch (error) {
    Logger.log('getPriceTable error: ' + error);
    return { success: false, error: '讀取價目表失敗' };
  }
}

/**
 * 取得分類
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function getCategories() {
  try {
    const sheet = getSheet(SHEETS.CATEGORIES);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    const categories = [];
    for (let i = 1; i < data.length; i++) {
      categories.push({
        id: data[i][0],
        name: data[i][1],
        icon: data[i][2]
      });
    }
    
    return { success: true, categories };
  } catch (error) {
    Logger.log('getCategories error: ' + error);
    return { success: false, error: '讀取分類失敗' };
  }
}

/**
 * 新增專案
 * 修正 #17: 後端輸入驗證
 * 修正 #18: 並發控制
 * 修正 #19: 使用唯一 ID 產生器
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function addProject(project) {
  // #17 - 輸入驗證
  if (!project || typeof project !== 'object') {
    return { success: false, error: '無效的專案資料' };
  }
  
  if (!project.customerName && !project.storeName) {
    return { success: false, error: '缺少客戶姓名' };
  }
  
  if (!project.phone && !project.contact) {
    return { success: false, error: '缺少聯絡電話' };
  }
  
  if (!project.items || !Array.isArray(project.items) || project.items.length === 0) {
    return { success: false, error: '至少需要一個報價項目' };
  }
  
  // #18 - 並發控制
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000); // 等待最多 10 秒
    
    // #20 - 確保工作表存在
    const sheet = getSheet(SHEETS.PROJECTS);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    // #19 - 使用唯一 ID 產生器
    const id = project.id || generateProjectId();
    const now = new Date();
    
    // 支援多種欄位名稱
    const customerName = project.customerName || project.storeName || '';
    const phone = project.phone || project.contact || '';
    const projectNumber = project.projectNumber || project.id || '';
    
    sheet.appendRow([
      id,
      projectNumber,
      customerName,
      phone,
      project.status || 'quoted',
      project.totalPrice || project.totalAmount || project.paidAmount || 0,
      project.createdBy || project.assignee || '',
      project.createdDate || now,
      now,
      JSON.stringify(project)
    ]);
    
    return { success: true, message: '專案已新增', id };
    
  } catch (error) {
    Logger.log('addProject error: ' + error);
    return { success: false, error: '系統忙碌中，請稍後再試' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 更新專案
 * 修正 #17: 後端輸入驗證
 * 修正 #18: 並發控制
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function updateProject(id, project) {
  // #17 - 輸入驗證
  if (!id) {
    return { success: false, error: '缺少專案 ID' };
  }
  
  if (!project || typeof project !== 'object') {
    return { success: false, error: '無效的專案資料' };
  }
  
  // #18 - 並發控制
  const lock = LockService.getScriptLock();
  
  try {
    lock.waitLock(10000); // 等待最多 10 秒
    
    // #20 - 確保工作表存在
    const sheet = getSheet(SHEETS.PROJECTS);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        const customerName = project.customerName || project.storeName || data[i][2];
        const phone = project.phone || project.contact || data[i][3];
        const totalPrice = project.totalPrice || project.totalAmount || project.paidAmount || data[i][5];
        
        sheet.getRange(i + 1, 2).setValue(project.projectNumber || data[i][1]);
        sheet.getRange(i + 1, 3).setValue(customerName);
        sheet.getRange(i + 1, 4).setValue(phone);
        sheet.getRange(i + 1, 5).setValue(project.status || data[i][4]);
        sheet.getRange(i + 1, 6).setValue(totalPrice);
        sheet.getRange(i + 1, 9).setValue(new Date());
        sheet.getRange(i + 1, 10).setValue(JSON.stringify(project));
        
        return { success: true, message: '專案已更新' };
      }
    }
    
    return { success: false, error: '找不到專案' };
    
  } catch (error) {
    Logger.log('updateProject error: ' + error);
    return { success: false, error: '系統忙碌中，請稍後再試' };
  } finally {
    lock.releaseLock();
  }
}

/**
 * 刪除專案（舊版，保留相容性）
 * 已棄用，請使用 handleDeleteProject
 */
function deleteProject(id) {
  return handleDeleteProject(id);
}

/**
 * 刪除專案
 * 修正 #21: 從後往前刪除，避免索引錯位
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function handleDeleteProject(id) {
  if (!id) {
    return { success: false, error: '缺少專案 ID' };
  }
  
  try {
    const sheet = getSheet(SHEETS.PROJECTS);
    if (!sheet) {
      return { success: false, error: '系統錯誤' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // #21 - 從後往前找，避免索引問題
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: '專案已刪除' };
      }
    }
    
    return { success: false, error: '找不到該專案' };
  } catch (error) {
    Logger.log('handleDeleteProject error: ' + error);
    return { success: false, error: '刪除失敗' };
  }
}

/**
 * 批次匯入價目表
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function importPriceTable(items) {
  try {
    const sheet = getSheet(SHEETS.PRICE_TABLE);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    // 清空現有資料（保留標題）
    const lastRow = sheet.getLastRow();
    if (lastRow > 1) {
      sheet.deleteRows(2, lastRow - 1);
    }
    
    // 批次寫入
    const rows = items.map(item => [
      item.id,
      item.category || '',
      item.name,
      item.price || 0,
      item.unit || '',
      item.subCategory || '',
      new Date()
    ]);
    
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, 7).setValues(rows);
    }
    
    return { 
      success: true, 
      message: `已匯入 ${items.length} 項價目`,
      count: items.length
    };
  } catch (error) {
    Logger.log('importPriceTable error: ' + error);
    return { success: false, error: '匯入失敗' };
  }
}

/**
 * 新增價目項目
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function addPriceItem(item) {
  try {
    const sheet = getSheet(SHEETS.PRICE_TABLE);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const id = item.id || ('ITEM' + Date.now());
    
    sheet.appendRow([
      id,
      item.category || '',
      item.name || '',
      item.price || 0,
      item.unit || '',
      item.subCategory || '',
      new Date()
    ]);
    
    return { success: true, message: '項目已新增', id };
  } catch (error) {
    Logger.log('addPriceItem error: ' + error);
    return { success: false, error: '新增失敗' };
  }
}

/**
 * 更新價目項目
 * 修正 #20: 使用 getSheet() 確保工作表存在
 */
function updatePriceItem(id, item) {
  try {
    const sheet = getSheet(SHEETS.PRICE_TABLE);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    for (let i = 1; i < data.length; i++) {
      if (data[i][0] === id) {
        sheet.getRange(i + 1, 2).setValue(item.category || data[i][1]);
        sheet.getRange(i + 1, 3).setValue(item.name || data[i][2]);
        sheet.getRange(i + 1, 4).setValue(item.price !== undefined ? item.price : data[i][3]);
        sheet.getRange(i + 1, 5).setValue(item.unit || data[i][4]);
        sheet.getRange(i + 1, 6).setValue(item.subCategory || data[i][5]);
        
        return { success: true, message: '項目已更新' };
      }
    }
    
    return { success: false, error: '找不到項目' };
  } catch (error) {
    Logger.log('updatePriceItem error: ' + error);
    return { success: false, error: '更新失敗' };
  }
}

/**
 * 刪除價目項目
 * 修正 #20: 使用 getSheet() 確保工作表存在
 * 修正 #21: 從後往前刪除，避免索引錯位
 */
function deletePriceItem(id) {
  try {
    const sheet = getSheet(SHEETS.PRICE_TABLE);
    if (!sheet) {
      return { success: false, error: '系統錯誤，請聯絡管理員' };
    }
    
    const data = sheet.getDataRange().getValues();
    
    // #21 - 從後往前找，避免索引問題
    for (let i = data.length - 1; i >= 1; i--) {
      if (data[i][0] === id) {
        sheet.deleteRow(i + 1);
        return { success: true, message: '項目已刪除' };
      }
    }
    
    return { success: false, error: '找不到項目' };
  } catch (error) {
    Logger.log('deletePriceItem error: ' + error);
    return { success: false, error: '刪除失敗' };
  }
}

/**
 * ONE桌遊報價系統 - Google Sheets 後端
 * 儲存：專案、價目表、分類
 * 員工資料使用員工管理系統的 Google Sheets
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
        
      case 'addCategory':
        result = addCategory(data.category || {});
        break;
        
      case 'updateCategory':
        result = updateCategory(data.id, data.category || {});
        break;
        
      case 'deleteCategory':
        result = deleteCategory(data.id);
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
      result = deleteProject(e.parameter.id);
      break;
    case 'addCategory':
      result = addCategory(JSON.parse(e.parameter.data));
      break;
    case 'updateCategory':
      result = updateCategory(e.parameter.id, JSON.parse(e.parameter.data));
      break;
    case 'deleteCategory':
      result = deleteCategory(e.parameter.id);
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
 */
function getUsers() {
  const sheet = SpreadsheetApp.openById(USER_SHEET_ID).getSheetByName(SHEETS.USERS);
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
}

/**
 * 取得所有專案
 */
function getProjects() {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
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
}

/**
 * 取得單一專案
 * @param {string} id - 可以是內部 ID (P1710123456789) 或專案編號 (P-2025001)
 */
function getProject(id) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
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
}

/**
 * 取得價目表
 */
function getPriceTable() {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
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
}

/**
 * 取得分類
 */
function getCategories() {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.CATEGORIES);
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
}

/**
 * 新增專案
 */
function addProject(project) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  
  const id = project.id || ('P' + Date.now());
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
}

/**
 * 更新專案
 */
function updateProject(id, project) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
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
}

/**
 * 刪除專案
 */
function deleteProject(id) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '專案已刪除' };
    }
  }
  
  return { success: false, error: '找不到專案' };
}

/**
 * 批次匯入價目表
 */
function importPriceTable(items) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  
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
}

/**
 * 新增價目項目
 */
function addPriceItem(item) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  
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
}

/**
 * 更新價目項目
 */
function updatePriceItem(id, item) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
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
}

/**
 * 刪除價目項目
 */
function deletePriceItem(id) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '項目已刪除' };
    }
  }
  
  return { success: false, error: '找不到項目' };
}

/**
 * 新增分類
 */
function addCategory(category) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.CATEGORIES);
  
  const id = category.id || ('CAT' + Date.now());
  
  sheet.appendRow([
    id,
    category.name || '',
    category.icon || '📋',
    new Date()
  ]);
  
  return { success: true, message: '分類已新增', id };
}

/**
 * 更新分類
 */
function updateCategory(id, category) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.CATEGORIES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(category.name || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(category.icon || data[i][2]);
      
      return { success: true, message: '分類已更新' };
    }
  }
  
  return { success: false, error: '找不到分類' };
}

/**
 * 刪除分類
 */
function deleteCategory(id) {
  // 先檢查是否有價目表項目使用此分類
  const priceSheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const priceData = priceSheet.getDataRange().getValues();
  
  // 找到分類名稱
  const categorySheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.CATEGORIES);
  const categoryData = categorySheet.getDataRange().getValues();
  
  let categoryName = '';
  let rowIndex = -1;
  
  for (let i = 1; i < categoryData.length; i++) {
    if (categoryData[i][0] === id) {
      categoryName = categoryData[i][1];
      rowIndex = i + 1;
      break;
    }
  }
  
  if (rowIndex === -1) {
    return { success: false, error: '找不到分類' };
  }
  
  // 檢查是否被使用
  for (let i = 1; i < priceData.length; i++) {
    if (priceData[i][1] === categoryName) {
      return { 
        success: false, 
        error: '此分類正在被使用，無法刪除',
        inUse: true
      };
    }
  }
  
  // 沒有被使用，可以刪除
  categorySheet.deleteRow(rowIndex);
  return { success: true, message: '分類已刪除' };
}

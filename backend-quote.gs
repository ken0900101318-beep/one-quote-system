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
    priceSheet.appendRow(['ID', '分類', '項目名稱', '單價', '單位', '說明', '建立時間']);
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
    case 'importPriceTable':
      result = importPriceTable(JSON.parse(e.parameter.items));
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
    projects.push({
      id: data[i][0],
      projectNumber: data[i][1],
      customerName: data[i][2],
      phone: data[i][3],
      status: data[i][4],
      totalPrice: data[i][5],
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
 */
function getProject(id) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const projectData = data[i][9] ? JSON.parse(data[i][9]) : {};
      return {
        success: true,
        project: {
          id: data[i][0],
          projectNumber: data[i][1],
          customerName: data[i][2],
          phone: data[i][3],
          status: data[i][4],
          totalPrice: data[i][5],
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
      description: data[i][5]
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
  
  const id = 'P' + Date.now();
  const now = new Date();
  
  sheet.appendRow([
    id,
    project.projectNumber,
    project.customerName,
    project.phone,
    project.status || 'quoted',
    project.totalPrice || 0,
    project.createdBy,
    now,
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
      sheet.getRange(i + 1, 2).setValue(project.projectNumber || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(project.customerName || data[i][2]);
      sheet.getRange(i + 1, 4).setValue(project.phone || data[i][3]);
      sheet.getRange(i + 1, 5).setValue(project.status || data[i][4]);
      sheet.getRange(i + 1, 6).setValue(project.totalPrice || data[i][5]);
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

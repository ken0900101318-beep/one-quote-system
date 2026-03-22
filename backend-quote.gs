/**
 * ONE桌遊報價系統 - Google Sheets 後端
 * 儲存：專案、價目表、分類、收款記錄
 * 員工資料使用員工管理系統的 Google Sheets
 */

const QUOTE_SHEET_ID = '1HCRbR2s8Zz5931hhE-Egsp7M8jpclygKi2hwE8rFcrw';
const USER_SHEET_ID = '1VAn00P6UwTd95cC-UCtQcJcHLIFhSzC9b_2q-hHE_NQ';

const SHEETS = {
  USERS: '員工資料',
  PROJECTS: '專案報價',
  PRICE_TABLE: '價目表',
  CATEGORIES: '分類',
  PAYMENTS: '收款記錄',
  CONTRACTORS: '工程行',
  PROGRESS: '工班進度'
};

const PAYMENT_METHODS = ['現金', '匯款', '支票', '刷卡', 'LINE Pay', '其他'];
const PRICE_LIST_CATEGORIES = ['麻將桌', '冷氣', '水電配線', '輕隔間', '包廂門', '智能門鎖', '其他設備'];
const PRICE_LIST_HEADERS = ['ID', '分類', '項目名稱', '規格說明', '單價', '單位', '備註', '狀態', '建立日期', '更新日期'];

const PROGRESS_STAGE_DEFINITIONS = [
  { key: 'site_survey', name: '現場勘查', order: 1, defaultDueDays: 3, requiredFields: [] },
  { key: 'partition', name: '隔間工程', order: 2, defaultDueDays: 7, requiredFields: ['contractorName'] },
  { key: 'electrical', name: '水電工程', order: 3, defaultDueDays: 10, requiredFields: ['contractorName'] },
  { key: 'wallpaper', name: '壁紙工程', order: 4, defaultDueDays: 14, requiredFields: ['contractorName'] },
  { key: 'aircon', name: '冷氣安裝', order: 5, defaultDueDays: 18, requiredFields: ['contractorName', 'installItems'] },
  { key: 'mahjong', name: '麻將桌安裝', order: 6, defaultDueDays: 21, requiredFields: ['contractorName', 'installItems'] },
  { key: 'acceptance', name: '驗收交付', order: 7, defaultDueDays: 24, requiredFields: ['acceptanceResult'] }
];
const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed', 'delayed'];
const PROGRESS_HEADERS = ['ID', '專案ID', '階段Key', '階段名稱', '排序', '狀態', '進度%', '預計日期', '實際日期', '逾期天數', '工程行', '安裝項目', '驗收結果', '備註', '照片(JSON)', '更新人', '建立時間', '更新時間'];

function initializeSheets() {
  const ss = SpreadsheetApp.openById(QUOTE_SHEET_ID);

  let projectsSheet = ss.getSheetByName(SHEETS.PROJECTS);
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet(SHEETS.PROJECTS);
    projectsSheet.appendRow(['ID', '專案編號', '客戶姓名', '聯絡電話', '狀態', '總價', '建立人', '建立時間', '更新時間', '資料JSON']);
  }

  ensurePriceTableSheet_(ss);

  let categoriesSheet = ss.getSheetByName(SHEETS.CATEGORIES);
  if (!categoriesSheet) {
    categoriesSheet = ss.insertSheet(SHEETS.CATEGORIES);
    categoriesSheet.appendRow(['ID', '分類名稱', 'Icon', '建立時間']);
    const categories = [
      ['CAT001', '桌遊設備', '🎲', new Date()],
      ['CAT002', '裝潢工程', '🏗️', new Date()],
      ['CAT003', '家具家電', '🛋️', new Date()],
      ['CAT004', '其他費用', '📋', new Date()]
    ];
    categoriesSheet.getRange(2, 1, categories.length, 4).setValues(categories);
  }

  ensurePaymentSheet_(ss);
  ensureContractorSheet_(ss);
  ensureProgressSheet_(ss);
  return { success: true, message: '✅ 初始化完成', priceListCategories: PRICE_LIST_CATEGORIES };
}

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents || '{}');
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
      case 'initializeSheets':
        result = initializeSheets();
        break;
      case 'seedPriceList':
        result = seedPriceList(data.options || {});
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
      case 'addPayment':
        result = addPayment(data.payment || {});
        break;
      case 'updatePayment':
        result = updatePayment(data.id, data.payment || {});
        break;
      case 'deletePayment':
        result = deletePayment(data.id);
        break;
      case 'addContractor':
        result = addContractor(data.contractor || {});
        break;
      case 'updateContractor':
        result = updateContractor(data.id, data.contractor || {});
        break;
      case 'deleteContractor':
        result = deleteContractor(data.id);
        break;
      case 'seedContractors':
        result = seedContractors(data.options || {});
        break;
      case 'getProjectProgress':
        result = getProjectProgress(data.projectId || data.id);
        break;
      case 'updateProgress':
        result = updateProgress(data.data || data.progress || data || {});
        break;
      case 'getProgressAlerts':
        result = getProgressAlerts(data.options || data || {});
        break;
      case 'seedProgressData':
        result = seedProgressData(data.options || data || {});
        break;
      default:
        result = { success: false, error: '不支援的操作' };
    }

    return jsonOutput_(result);
  } catch (error) {
    return jsonOutput_({ success: false, error: error.toString() });
  }
}

function doOptions() {
  return ContentService.createTextOutput('');
}

function doGet(e) {
  const action = e.parameter.action || 'test';

  if (action === 'test') {
    return jsonOutput_({
      success: true,
      message: 'ONE桌遊報價系統 API 正常運作',
      timestamp: new Date()
    });
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
    case 'getProjectPayments':
      result = getProjectPayments(e.parameter.projectId || e.parameter.id);
      break;
    case 'getPriceTable':
      result = getPriceTable();
      break;
    case 'getPriceListCategories':
      result = getPriceListCategories();
      break;
    case 'initializeSheets':
      result = initializeSheets();
      break;
    case 'seedPriceList':
      result = seedPriceList();
      break;
    case 'getCategories':
      result = getCategories();
      break;
    case 'getContractors':
      result = getContractors(e.parameter || {});
      break;
    case 'getContractor':
      result = getContractor(e.parameter.id);
      break;
    case 'getContractorProjects':
      result = getContractorProjects(e.parameter.id || e.parameter.contractorId);
      break;
    case 'seedContractors':
      result = seedContractors(e.parameter || {});
      break;
    case 'getProjectProgress':
      result = getProjectProgress(e.parameter.projectId || e.parameter.id);
      break;
    case 'updateProgress':
      result = updateProgress(parseJsonSafe_(e.parameter.data, {}));
      break;
    case 'getProgressAlerts':
      result = getProgressAlerts(e.parameter || {});
      break;
    case 'seedProgressData':
      result = seedProgressData(e.parameter || {});
      break;
    case 'getStatisticsOverview':
      result = getStatisticsOverview(e.parameter || {});
      break;
    case 'getMonthlyStatistics':
      result = getMonthlyStatistics(e.parameter || {});
      break;
    case 'getProjectStatusDistribution':
      result = getProjectStatusDistribution(e.parameter || {});
      break;
    case 'getRevenueChart':
      result = getRevenueChart(e.parameter || {});
      break;
    case 'getTopCustomers':
      result = getTopCustomers(e.parameter || {});
      break;
    case 'getTopEmployees':
      result = getTopEmployees(e.parameter || {});
      break;
    case 'addProject':
      result = addProject(parseJsonSafe_(e.parameter.data, {}));
      break;
    case 'updateProject':
      result = updateProject(e.parameter.id, parseJsonSafe_(e.parameter.data, {}));
      break;
    case 'deleteProject':
      result = deleteProject(e.parameter.id);
      break;
    case 'addCategory':
      result = addCategory(parseJsonSafe_(e.parameter.data, {}));
      break;
    case 'updateCategory':
      result = updateCategory(e.parameter.id, parseJsonSafe_(e.parameter.data, {}));
      break;
    case 'deleteCategory':
      result = deleteCategory(e.parameter.id);
      break;
    default:
      result = { success: false, error: '不支援的操作' };
  }

  return jsonOutput_(result);
}

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
      role: data[i][5]
    });
  }

  return { success: true, users };
}

function getProjects() {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  const paymentMap = getPaymentMap_();
  const projects = [];

  for (let i = 1; i < data.length; i++) {
    const project = buildProjectFromRow_(data[i], paymentMap);
    projects.push(project);
  }

  return { success: true, projects };
}

function getProject(id) {
  if (!id) {
    return { success: false, error: '缺少專案 ID' };
  }

  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();
  const paymentMap = getPaymentMap_();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id || data[i][1] === id) {
      return {
        success: true,
        project: buildProjectFromRow_(data[i], paymentMap)
      };
    }
  }

  return { success: false, error: '找不到專案' };
}

function getProjectPayments(projectId) {
  if (!projectId) {
    return { success: false, error: '缺少專案 ID' };
  }

  const projectResult = getProject(projectId);
  if (!projectResult.success) {
    return projectResult;
  }

  const payments = getPaymentsByProjectId_(projectResult.project.id);
  const summary = buildPaymentSummary_(projectResult.project.totalPrice, payments);

  return {
    success: true,
    projectId: projectResult.project.id,
    projectNumber: projectResult.project.projectNumber,
    totalPrice: Number(projectResult.project.totalPrice || 0),
    payments,
    summary
  };
}

function getPriceTable() {
  const sheet = ensurePriceTableSheet_();
  const data = sheet.getDataRange().getValues();
  const items = [];

  for (let i = 1; i < data.length; i++) {
    const item = mapPriceItemRow_(data[i]);
    if (!item.id || !item.name) continue;
    items.push(item);
  }

  items.sort(function(a, b) {
    const categoryCompare = PRICE_LIST_CATEGORIES.indexOf(a.category) - PRICE_LIST_CATEGORIES.indexOf(b.category);
    if (categoryCompare !== 0) return categoryCompare;
    return String(a.name || '').localeCompare(String(b.name || ''), 'zh-Hant');
  });

  return { success: true, items: items, categories: PRICE_LIST_CATEGORIES };
}

function getPriceListCategories() {
  return {
    success: true,
    categories: PRICE_LIST_CATEGORIES.map(function(name, index) {
      return { id: 'PLCAT' + (index + 1), name: name };
    })
  };
}

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

function addProject(project) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const id = project.id || ('P' + Date.now());
  const now = new Date();
  const customerName = project.customerName || project.storeName || '';
  const phone = project.phone || project.contact || '';
  const projectNumber = project.projectNumber || project.id || id;
  const normalizedProject = enrichProjectContractor_(Object.assign({}, project, { id: id }), false);

  sheet.appendRow([
    id,
    projectNumber,
    customerName,
    phone,
    normalizedProject.status || 'quoted',
    normalizeNumber_(normalizedProject.totalPrice || normalizedProject.totalAmount || normalizedProject.paidAmount || 0),
    normalizedProject.createdBy || normalizedProject.assignee || '',
    normalizedProject.createdDate || now,
    now,
    JSON.stringify(normalizedProject)
  ]);

  return { success: true, message: '專案已新增', id };
}

function updateProject(id, project) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const existingProject = parseJsonSafe_(data[i][9], {});
      const mergedProject = enrichProjectContractor_(Object.assign({}, existingProject, project || {}, { id: id }), true);
      const customerName = mergedProject.customerName || mergedProject.storeName || data[i][2];
      const phone = mergedProject.phone || mergedProject.contact || data[i][3];
      const totalPrice = normalizeNumber_(mergedProject.totalPrice || mergedProject.totalAmount || mergedProject.paidAmount || data[i][5]);

      sheet.getRange(i + 1, 2).setValue(mergedProject.projectNumber || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(customerName);
      sheet.getRange(i + 1, 4).setValue(phone);
      sheet.getRange(i + 1, 5).setValue(mergedProject.status || data[i][4]);
      sheet.getRange(i + 1, 6).setValue(totalPrice);
      sheet.getRange(i + 1, 9).setValue(new Date());
      sheet.getRange(i + 1, 10).setValue(JSON.stringify(mergedProject));

      return { success: true, message: '專案已更新' };
    }
  }

  return { success: false, error: '找不到專案' };
}

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

function importPriceTable(items) {
  const sheet = ensurePriceTableSheet_();
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  const now = new Date();
  const rows = [];
  for (let i = 0; i < items.length; i++) {
    const normalized = validateAndNormalizePriceItem_(items[i], true, now);
    if (!normalized.success) {
      return { success: false, error: '第 ' + (i + 1) + ' 筆資料錯誤：' + normalized.error };
    }
    rows.push(priceItemToRow_(normalized.item));
  }

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, PRICE_LIST_HEADERS.length).setValues(rows);
  }

  return { success: true, message: '已匯入 ' + items.length + ' 項價目', count: items.length };
}

function addPriceItem(item) {
  const sheet = ensurePriceTableSheet_();
  const normalized = validateAndNormalizePriceItem_(item, true);
  if (!normalized.success) {
    return normalized;
  }

  sheet.appendRow(priceItemToRow_(normalized.item));
  return { success: true, message: '項目已新增', id: normalized.item.id, item: normalized.item };
}

function updatePriceItem(id, item) {
  const sheet = ensurePriceTableSheet_();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    const current = mapPriceItemRow_(data[i]);
    if (current.id === id) {
      const merged = mergePriceItem_(current, item || {});
      const normalized = validateAndNormalizePriceItem_(merged, false, current.createdAt || new Date());
      if (!normalized.success) {
        return normalized;
      }
      sheet.getRange(i + 1, 1, 1, PRICE_LIST_HEADERS.length).setValues([priceItemToRow_(normalized.item)]);
      return { success: true, message: '項目已更新', item: normalized.item };
    }
  }

  return { success: false, error: '找不到項目' };
}

function deletePriceItem(id) {
  const sheet = ensurePriceTableSheet_();
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '項目已刪除' };
    }
  }

  return { success: false, error: '找不到項目' };
}

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

function deleteCategory(id) {
  const priceSheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const priceData = priceSheet.getDataRange().getValues();
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

  for (let j = 1; j < priceData.length; j++) {
    if (priceData[j][1] === categoryName) {
      return { success: false, error: '此分類正在被使用，無法刪除', inUse: true };
    }
  }

  categorySheet.deleteRow(rowIndex);
  return { success: true, message: '分類已刪除' };
}

function addPayment(payment) {
  const normalized = validateAndNormalizePayment_(payment, true);
  if (!normalized.success) {
    return normalized;
  }

  const paymentSheet = getPaymentSheet_();
  const record = normalized.payment;
  paymentSheet.appendRow([
    record.id,
    record.projectId,
    record.projectNumber,
    record.paymentDate,
    record.amount,
    record.method,
    record.receiverId,
    record.receiverName,
    record.note,
    record.createdAt,
    record.updatedAt
  ]);

  const payments = getPaymentsByProjectId_(record.projectId);
  const project = getProject(record.projectId);
  const summary = buildPaymentSummary_(project.success ? project.project.totalPrice : 0, payments);

  return {
    success: true,
    message: '收款記錄已新增',
    id: record.id,
    payment: record,
    summary
  };
}

function updatePayment(id, payment) {
  const paymentSheet = getPaymentSheet_();
  const data = paymentSheet.getDataRange().getValues();
  let row = -1;
  let existing = null;

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      row = i + 1;
      existing = mapPaymentRow_(data[i]);
      break;
    }
  }

  if (row === -1) {
    return { success: false, error: '找不到收款記錄' };
  }

  const normalized = validateAndNormalizePayment_(mergePayment_(existing, payment), false);
  if (!normalized.success) {
    return normalized;
  }

  const record = normalized.payment;
  paymentSheet.getRange(row, 1, 1, 11).setValues([[
    record.id,
    record.projectId,
    record.projectNumber,
    record.paymentDate,
    record.amount,
    record.method,
    record.receiverId,
    record.receiverName,
    record.note,
    existing.createdAt || record.createdAt,
    new Date()
  ]]);

  const payments = getPaymentsByProjectId_(record.projectId);
  const project = getProject(record.projectId);
  const summary = buildPaymentSummary_(project.success ? project.project.totalPrice : 0, payments);

  return { success: true, message: '收款記錄已更新', payment: record, summary };
}

function deletePayment(id) {
  const paymentSheet = getPaymentSheet_();
  const data = paymentSheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const payment = mapPaymentRow_(data[i]);
      paymentSheet.deleteRow(i + 1);
      const payments = getPaymentsByProjectId_(payment.projectId);
      const project = getProject(payment.projectId);
      const summary = buildPaymentSummary_(project.success ? project.project.totalPrice : 0, payments);
      return { success: true, message: '收款記錄已刪除', summary };
    }
  }

  return { success: false, error: '找不到收款記錄' };
}



function ensureProgressSheet_(ss) {
  const spreadsheet = ss || SpreadsheetApp.openById(QUOTE_SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEETS.PROGRESS);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.PROGRESS);
    sheet.getRange(1, 1, 1, PROGRESS_HEADERS.length).setValues([PROGRESS_HEADERS]);
  } else {
    const headers = sheet.getLastColumn() > 0 ? sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), PROGRESS_HEADERS.length)).getValues()[0] : [];
    const valid = String(headers[0] || '') === 'ID' && String(headers[1] || '') === '專案ID' && String(headers[14] || '') === '照片(JSON)';
    if (!valid && sheet.getLastRow() <= 1) {
      sheet.clear();
      sheet.getRange(1, 1, 1, PROGRESS_HEADERS.length).setValues([PROGRESS_HEADERS]);
    }
  }
  if (sheet.getFrozenRows() < 1) sheet.setFrozenRows(1);
  return sheet;
}

function getProgressSheet_() {
  return ensureProgressSheet_(SpreadsheetApp.openById(QUOTE_SHEET_ID));
}

function getProgressStageDefinitions_() {
  return PROGRESS_STAGE_DEFINITIONS.map(function(stage) {
    return Object.assign({}, stage);
  });
}

function buildDefaultProgressStage_(projectId, baseProject, stage) {
  const project = baseProject || {};
  const contractorName = String(project.contractorName || '').trim();
  const installItems = extractInstallItemsFromProject_(project);
  const createdAt = parseDateValue_(project.createdAt) || new Date();
  const dueDate = new Date(createdAt.getTime());
  dueDate.setDate(dueDate.getDate() + Number(stage.defaultDueDays || 0));
  return {
    id: 'PRG' + Date.now() + '_' + stage.order + '_' + Math.floor(Math.random() * 1000),
    projectId: String(projectId || '').trim(),
    stageKey: stage.key,
    stageName: stage.name,
    order: Number(stage.order || 0),
    status: 'not_started',
    progressPercent: 0,
    dueDate: normalizeDateInput_(dueDate),
    actualDate: '',
    overdueDays: 0,
    contractorName: contractorName,
    installItems: installItems,
    acceptanceResult: '',
    note: '',
    photos: [],
    updatedBy: '',
    createdAt: createdAt,
    updatedAt: createdAt
  };
}

function getDefaultProgressStages_(projectId, baseProject) {
  return getProgressStageDefinitions_().map(function(stage) {
    return buildDefaultProgressStage_(projectId, baseProject, stage);
  });
}

function mergeProgressRowsWithDefinitions_(projectId, project, rows) {
  const definitions = getProgressStageDefinitions_();
  const existingByStage = {};
  (Array.isArray(rows) ? rows : []).forEach(function(item) {
    if (!item || !item.stageKey || existingByStage[item.stageKey]) return;
    existingByStage[item.stageKey] = item;
  });
  return definitions.map(function(stage) {
    const fallback = buildDefaultProgressStage_(projectId, project, stage);
    const existing = existingByStage[stage.key] || {};
    const merged = Object.assign({}, fallback, existing, {
      projectId: String(projectId || '').trim(),
      stageKey: stage.key,
      stageName: stage.name,
      order: Number(stage.order || fallback.order || 0)
    });
    merged.status = normalizeProgressStatus_(merged.status);
    merged.progressPercent = merged.status === 'completed' ? 100 : clampProgressPercent_(merged.progressPercent);
    merged.dueDate = normalizeDateInput_(merged.dueDate);
    merged.actualDate = normalizeDateInput_(merged.actualDate);
    merged.contractorName = String(merged.contractorName || '').trim().slice(0, 100);
    merged.installItems = String(merged.installItems || '').trim().slice(0, 500);
    merged.acceptanceResult = String(merged.acceptanceResult || '').trim().slice(0, 100);
    merged.note = String(merged.note || '').trim().slice(0, 1000);
    merged.updatedBy = String(merged.updatedBy || '').trim().slice(0, 100);
    merged.photos = Array.isArray(merged.photos) ? merged.photos.map(function(photo) {
      return sanitizeProgressPhoto_(photo);
    }).filter(function(photo) { return !!photo; }).slice(0, 6) : [];
    merged.overdueDays = calculateOverdueDays_(merged.dueDate, merged.actualDate, merged.status);
    merged.isOverdue = merged.overdueDays > 0 && normalizeProgressStatus_(merged.status) !== 'completed';
    merged.requirements = stage.requiredFields || [];
    return merged;
  }).sort(function(a, b) { return a.order - b.order; });
}

function mapProgressRow_(row) {
  const photos = parseJsonSafe_(row[14], []);
  const normalizedPhotos = Array.isArray(photos) ? photos.map(function(item) {
    return sanitizeProgressPhoto_(item);
  }).filter(function(item) { return !!item; }).slice(0, 6) : [];
  return {
    id: String(row[0] || '').trim(),
    projectId: String(row[1] || '').trim(),
    stageKey: String(row[2] || '').trim(),
    stageName: String(row[3] || '').trim(),
    order: Number(row[4] || 0),
    status: normalizeProgressStatus_(row[5]),
    progressPercent: clampProgressPercent_(row[6]),
    dueDate: normalizeDateInput_(row[7]),
    actualDate: normalizeDateInput_(row[8]),
    overdueDays: Math.max(0, Number(row[9] || 0)),
    contractorName: String(row[10] || '').trim(),
    installItems: String(row[11] || '').trim(),
    acceptanceResult: String(row[12] || '').trim(),
    note: String(row[13] || '').trim(),
    photos: normalizedPhotos,
    updatedBy: String(row[15] || '').trim(),
    createdAt: row[16] || '',
    updatedAt: row[17] || ''
  };
}

function progressToRow_(progress) {
  return [
    progress.id,
    progress.projectId,
    progress.stageKey,
    progress.stageName,
    progress.order,
    progress.status,
    progress.progressPercent,
    progress.dueDate,
    progress.actualDate,
    progress.overdueDays,
    progress.contractorName,
    progress.installItems,
    progress.acceptanceResult,
    progress.note,
    JSON.stringify(progress.photos || []),
    progress.updatedBy,
    progress.createdAt,
    progress.updatedAt
  ];
}

function sanitizeProgressPhoto_(photo) {
  if (!photo) return null;
  if (typeof photo === 'string') {
    const trimmed = photo.trim();
    if (!trimmed) return null;
    return { name: 'photo', url: trimmed.slice(0, 12000), thumbnailUrl: trimmed.slice(0, 12000) };
  }
  const url = String(photo.url || photo.src || '').trim();
  const thumbnailUrl = String(photo.thumbnailUrl || photo.thumb || url).trim();
  if (!url && !thumbnailUrl) return null;
  return {
    name: String(photo.name || 'photo').trim().slice(0, 100),
    url: (url || thumbnailUrl).slice(0, 12000),
    thumbnailUrl: (thumbnailUrl || url).slice(0, 12000),
    type: String(photo.type || '').trim().slice(0, 100),
    size: Number(photo.size || 0) || 0
  };
}

function normalizeProgressStatus_(status) {
  const value = String(status || '').trim();
  if (PROGRESS_STATUSES.indexOf(value) >= 0) return value;
  return 'not_started';
}

function clampProgressPercent_(value) {
  var percent = Number(value || 0);
  if (isNaN(percent)) percent = 0;
  return Math.max(0, Math.min(100, Math.round(percent)));
}

function extractInstallItemsFromProject_(project) {
  const items = Array.isArray(project.items) ? project.items : [];
  const keywords = ['冷氣', '麻將桌', '安裝', '設備'];
  const matched = items.map(function(item) {
    const name = String((item || {}).name || '').trim();
    const category = String((item || {}).category || '').trim();
    const desc = String((item || {}).desc || (item || {}).spec || '').trim();
    const hay = [name, category, desc].join(' ');
    const hit = keywords.some(function(keyword) { return hay.indexOf(keyword) !== -1; });
    return hit ? name : '';
  }).filter(Boolean);
  return matched.join('、').slice(0, 500);
}

function normalizeProgressRow_(progress, isCreate, createdAtOverride) {
  const now = new Date();
  const stageKey = String(progress.stageKey || progress.key || '').trim();
  const stageDefinition = getProgressStageDefinitions_().filter(function(item) { return item.key === stageKey; })[0];
  if (!stageDefinition) {
    return { success: false, error: '無效的施工階段' };
  }
  const status = normalizeProgressStatus_(progress.status);
  const progressPercent = clampProgressPercent_(progress.progressPercent);
  const dueDate = normalizeDateInput_(progress.dueDate);
  const actualDate = normalizeDateInput_(progress.actualDate);
  const contractorName = String(progress.contractorName || '').trim().slice(0, 100);
  const installItems = String(progress.installItems || '').trim().slice(0, 500);
  const acceptanceResult = String(progress.acceptanceResult || '').trim().slice(0, 100);
  const note = String(progress.note || '').trim().slice(0, 1000);
  const updatedBy = String(progress.updatedBy || '').trim().slice(0, 100);
  const photos = Array.isArray(progress.photos) ? progress.photos.map(function(item) { return sanitizeProgressPhoto_(item); }).filter(function(item) { return !!item; }).slice(0, 6) : [];
  if (!String(progress.projectId || '').trim()) return { success: false, error: '缺少專案 ID' };
  const shouldValidateRequiredFields = status !== 'not_started';
  if (shouldValidateRequiredFields && (stageDefinition.requiredFields || []).indexOf('contractorName') >= 0 && !contractorName) {
    return { success: false, error: '此階段需要填寫工程行' };
  }
  if (shouldValidateRequiredFields && (stageDefinition.requiredFields || []).indexOf('installItems') >= 0 && !installItems) {
    return { success: false, error: '此階段需要填寫安裝項目' };
  }
  if (shouldValidateRequiredFields && (stageDefinition.requiredFields || []).indexOf('acceptanceResult') >= 0 && !acceptanceResult) {
    return { success: false, error: '此階段需要填寫驗收結果' };
  }
  return {
    success: true,
    progress: {
      id: String(progress.id || (isCreate ? ('PRG' + Date.now() + '_' + stageDefinition.order) : '')).trim(),
      projectId: String(progress.projectId || '').trim(),
      stageKey: stageDefinition.key,
      stageName: stageDefinition.name,
      order: Number(stageDefinition.order || progress.order || 0),
      status: status,
      progressPercent: status === 'completed' ? 100 : progressPercent,
      dueDate: dueDate,
      actualDate: status === 'completed' ? (actualDate || normalizeDateInput_(new Date())) : actualDate,
      overdueDays: 0,
      contractorName: contractorName,
      installItems: installItems,
      acceptanceResult: acceptanceResult,
      note: note,
      photos: photos,
      updatedBy: updatedBy,
      createdAt: createdAtOverride || progress.createdAt || now,
      updatedAt: now
    }
  };
}

function ensureProjectProgressRows_(projectId, project) {
  const sheet = getProgressSheet_();
  const data = sheet.getDataRange().getValues();
  const existingRows = [];
  for (var i = 1; i < data.length; i++) {
    const item = mapProgressRow_(data[i]);
    if (item.projectId === projectId) existingRows.push(item);
  }

  const merged = mergeProgressRowsWithDefinitions_(projectId, project || {}, existingRows);
  const existingStageKeys = {};
  existingRows.forEach(function(item) {
    if (item && item.stageKey && !existingStageKeys[item.stageKey]) {
      existingStageKeys[item.stageKey] = true;
    }
  });

  const missing = merged.filter(function(item) {
    return !existingStageKeys[item.stageKey];
  });

  if (missing.length) {
    const values = missing.map(function(item) { return progressToRow_(item); });
    sheet.getRange(sheet.getLastRow() + 1, 1, values.length, PROGRESS_HEADERS.length).setValues(values);
  }

  return merged;
}

function calculateOverdueDays_(dueDate, actualDate, status) {
  const due = parseDateValue_(dueDate);
  if (!due) return 0;
  const endDate = parseDateValue_(actualDate) || new Date();
  if (normalizeProgressStatus_(status) === 'completed' && parseDateValue_(actualDate) && endDate.getTime() <= due.getTime()) {
    return 0;
  }
  const diff = endDate.getTime() - due.getTime();
  return diff > 0 ? Math.floor(diff / 86400000) : 0;
}

function buildProjectProgressSummary_(rows) {
  const list = mergeProgressRowsWithDefinitions_('', {}, Array.isArray(rows) ? rows : []);
  const total = PROGRESS_STAGE_DEFINITIONS.length;
  const completed = list.filter(function(item) { return normalizeProgressStatus_(item.status) === 'completed'; }).length;
  const percent = total ? Math.round((completed / total) * 100) : 0;
  let currentStage = null;
  let nextStage = null;
  let overdueCount = 0;
  list.forEach(function(item) {
    const overdueDays = calculateOverdueDays_(item.dueDate, item.actualDate, item.status);
    item.overdueDays = overdueDays;
    item.isOverdue = overdueDays > 0 && normalizeProgressStatus_(item.status) !== 'completed';
    if (item.isOverdue) overdueCount += 1;
    if (!currentStage && normalizeProgressStatus_(item.status) !== 'completed') currentStage = item;
  });
  if (currentStage) {
    const index = list.findIndex(function(item) { return item.stageKey === currentStage.stageKey; });
    nextStage = list[index + 1] || null;
  }
  const latestUpdatedAt = list.reduce(function(latest, item) {
    const current = parseDateValue_(item.updatedAt);
    if (!current) return latest;
    if (!latest) return current;
    return current.getTime() > latest.getTime() ? current : latest;
  }, null);
  return {
    overallPercent: percent,
    completedStages: completed,
    totalStages: total,
    currentStage: currentStage,
    nextStage: nextStage,
    overdueCount: overdueCount,
    hasAlerts: overdueCount > 0,
    latestUpdatedAt: latestUpdatedAt ? latestUpdatedAt.toISOString() : ''
  };
}

function getProjectProgress(projectId) {
  if (!projectId) return { success: false, error: '缺少專案 ID' };
  const projectResult = getProject(projectId);
  if (!projectResult.success) return projectResult;
  const definitions = getProgressStageDefinitions_();
  const rows = mergeProgressRowsWithDefinitions_(projectId, projectResult.project, ensureProjectProgressRows_(projectId, projectResult.project));
  const summary = buildProjectProgressSummary_(rows);
  return { success: true, projectId: projectId, progress: rows, summary: summary, stageDefinitions: definitions };
}

function updateProgress(data) {
  const payload = data || {};
  const projectId = String(payload.projectId || '').trim();
  const stageKey = String(payload.stageKey || '').trim();
  if (!projectId) return { success: false, error: '缺少專案 ID' };
  if (!stageKey) return { success: false, error: '缺少階段 Key' };
  const projectResult = getProject(projectId);
  if (!projectResult.success) return projectResult;
  const existingRows = ensureProjectProgressRows_(projectId, projectResult.project);
  const target = existingRows.filter(function(item) { return item.stageKey === stageKey; })[0];
  if (!target) return { success: false, error: '找不到施工階段' };
  const merged = Object.assign({}, target, payload);
  if (!merged.contractorName) merged.contractorName = String(projectResult.project.contractorName || '').trim();
  if (!merged.installItems) merged.installItems = extractInstallItemsFromProject_(projectResult.project);
  const normalized = normalizeProgressRow_(merged, false, target.createdAt || new Date());
  if (!normalized.success) return normalized;
  normalized.progress.overdueDays = calculateOverdueDays_(normalized.progress.dueDate, normalized.progress.actualDate, normalized.progress.status);
  const sheet = getProgressSheet_();
  const values = sheet.getDataRange().getValues();
  for (var i = 1; i < values.length; i++) {
    if (String(values[i][1]) === projectId && String(values[i][2]) === stageKey) {
      sheet.getRange(i + 1, 1, 1, PROGRESS_HEADERS.length).setValues([progressToRow_(normalized.progress)]);
      break;
    }
  }
  const refreshed = getProjectProgress(projectId);
  return { success: true, message: '施工進度已更新', stage: normalized.progress, progress: refreshed.progress, summary: refreshed.summary };
}

function getProgressAlerts(options) {
  const sheet = getProgressSheet_();
  const data = sheet.getDataRange().getValues();
  const alerts = [];
  const limit = Math.max(1, Math.min(100, Number((options || {}).limit || 20)));
  for (var i = 1; i < data.length; i++) {
    const item = mapProgressRow_(data[i]);
    const overdueDays = calculateOverdueDays_(item.dueDate, item.actualDate, item.status);
    const needsAttention = overdueDays > 0 || (normalizeProgressStatus_(item.status) === 'in_progress' && item.progressPercent < 100);
    if (!needsAttention || normalizeProgressStatus_(item.status) === 'completed') continue;
    const projectResult = getProject(item.projectId);
    const project = projectResult.success ? projectResult.project : {};
    alerts.push({
      projectId: item.projectId,
      projectNumber: project.projectNumber || item.projectId,
      customerName: project.customerName || '',
      stageKey: item.stageKey,
      stageName: item.stageName,
      dueDate: item.dueDate,
      overdueDays: overdueDays,
      status: item.status,
      progressPercent: item.progressPercent,
      contractorName: item.contractorName || project.contractorName || '',
      isOverdue: overdueDays > 0
    });
  }
  alerts.sort(function(a, b) { return b.overdueDays - a.overdueDays; });
  return { success: true, alerts: alerts.slice(0, limit), count: alerts.length };
}

function seedProgressData(options) {
  const projectsResult = getProjects();
  if (!projectsResult.success) return projectsResult;
  const projects = projectsResult.projects || [];
  let createdProjects = 0;
  projects.forEach(function(project) {
    const rows = ensureProjectProgressRows_(project.id, project);
    if (rows && rows.length) createdProjects += 1;
  });
  return { success: true, message: '工班進度 seed 完成', count: createdProjects, stagesPerProject: PROGRESS_STAGE_DEFINITIONS.length };
}

function ensureContractorSheet_(ss) {
  let sheet = ss.getSheetByName(SHEETS.CONTRACTORS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.CONTRACTORS);
    sheet.appendRow(['ID', '公司名稱', '聯絡人', '電話', 'Email', 'LINE ID', 'LINE 連結', '專長(JSON)', '評價', '狀態', '地址', '備註', '建立時間', '更新時間']);
  }
  return sheet;
}

function getContractorSheet_() {
  const ss = SpreadsheetApp.openById(QUOTE_SHEET_ID);
  const sheet = ensureContractorSheet_(ss);
  ensureUniqueContractorIds_(sheet);
  return sheet;
}

function generateEntityId_(prefix) {
  return String(prefix || 'ID') + '_' + Utilities.getUuid().replace(/-/g, '').slice(0, 12);
}

function ensureUniqueContractorIds_(sheet) {
  const targetSheet = sheet || ensureContractorSheet_(SpreadsheetApp.openById(QUOTE_SHEET_ID));
  const lastRow = targetSheet.getLastRow();
  if (lastRow <= 1) return;
  const idRange = targetSheet.getRange(2, 1, lastRow - 1, 1);
  const idValues = idRange.getValues();
  const seen = {};
  let changed = false;

  for (var i = 0; i < idValues.length; i++) {
    var currentId = String(idValues[i][0] || '').trim();
    if (!currentId || seen[currentId]) {
      currentId = generateEntityId_('CTR');
      while (seen[currentId]) {
        currentId = generateEntityId_('CTR');
      }
      idValues[i][0] = currentId;
      changed = true;
    }
    seen[currentId] = true;
  }

  if (changed) {
    idRange.setValues(idValues);
  }
}

function mapContractorRow_(row) {
  const specialties = parseJsonSafe_(row[7], []);
  const rating = normalizeNumber_(row[8]);
  const status = String(row[9] || 'active').trim() || 'active';
  const contractor = {
    id: String(row[0] || ''),
    companyName: String(row[1] || ''),
    contactName: String(row[2] || ''),
    phone: String(row[3] || ''),
    email: String(row[4] || ''),
    lineId: String(row[5] || ''),
    lineUrl: String(row[6] || ''),
    specialties: Array.isArray(specialties) ? specialties : [],
    rating: Math.max(0, Math.min(5, rating)),
    status: status,
    address: String(row[10] || ''),
    note: String(row[11] || ''),
    createdAt: row[12] || '',
    updatedAt: row[13] || ''
  };
  contractor.statusLabel = contractor.status === 'inactive' ? '停用' : '合作中';
  return contractor;
}

function contractorToRow_(contractor) {
  return [
    contractor.id,
    contractor.companyName,
    contractor.contactName,
    contractor.phone,
    contractor.email,
    contractor.lineId,
    contractor.lineUrl,
    JSON.stringify(contractor.specialties || []),
    contractor.rating,
    contractor.status,
    contractor.address,
    contractor.note,
    contractor.createdAt,
    contractor.updatedAt
  ];
}

function normalizePhone_(phone) {
  return String(phone || '').replace(/[^0-9]/g, '');
}

function isValidPhone_(phone) {
  return /^0\d{8,9}$/.test(phone);
}

function isValidEmail_(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim());
}

function normalizeSpecialties_(specialties) {
  if (!specialties) return [];
  if (Object.prototype.toString.call(specialties) === '[object Array]') {
    return specialties.map(function(item) { return String(item || '').trim(); }).filter(Boolean);
  }
  return String(specialties).split(',').map(function(item) { return String(item || '').trim(); }).filter(Boolean);
}

function buildLineUrl_(contractor) {
  const direct = String(contractor.lineUrl || '').trim();
  if (direct) return direct;
  const lineId = String(contractor.lineId || '').trim().replace(/^@/, '');
  return lineId ? 'https://line.me/R/ti/p/@' + encodeURIComponent(lineId) : '';
}

function validateAndNormalizeContractor_(contractor, isCreate, createdAt) {
  const now = new Date();
  const phone = normalizePhone_(contractor.phone || '');
  const email = String(contractor.email || '').trim();
  const rating = Math.max(0, Math.min(5, normalizeNumber_(contractor.rating)));
  const companyName = String(contractor.companyName || '').trim();
  const contactName = String(contractor.contactName || '').trim();
  const status = String(contractor.status || 'active').trim() === 'inactive' ? 'inactive' : 'active';
  const specialties = normalizeSpecialties_(contractor.specialties);

  if (!companyName) return { success: false, error: '請輸入公司名稱' };
  if (!contactName) return { success: false, error: '請輸入聯絡人' };
  if (!phone || !isValidPhone_(phone)) return { success: false, error: '請輸入正確電話（市話或手機）' };
  if (email && !isValidEmail_(email)) return { success: false, error: 'Email 格式不正確' };

  const normalized = {
    id: String(contractor.id || (isCreate ? generateEntityId_('CTR') : '')).trim(),
    companyName: companyName,
    contactName: contactName,
    phone: phone,
    email: email,
    lineId: String(contractor.lineId || '').trim(),
    lineUrl: '',
    specialties: specialties,
    rating: Math.round(rating * 10) / 10,
    status: status,
    address: String(contractor.address || '').trim(),
    note: String(contractor.note || '').trim(),
    createdAt: createdAt || contractor.createdAt || now,
    updatedAt: now
  };
  normalized.lineUrl = buildLineUrl_(Object.assign({}, contractor, normalized));
  return { success: true, contractor: normalized };
}

function getContractors(filters) {
  const sheet = getContractorSheet_();
  const data = sheet.getDataRange().getValues();
  const contractors = [];
  const params = filters || {};
  const query = String(params.query || params.search || '').trim().toLowerCase();
  const status = String(params.status || '').trim();
  const minRating = normalizeNumber_(params.minRating || params.rating || 0);
  const specialties = normalizeSpecialties_(params.specialties || params.specialty || '');

  for (let i = 1; i < data.length; i++) {
    const contractor = mapContractorRow_(data[i]);
    contractor.id = String(contractor.id || contractor.contractorId || '').trim();
    if (query) {
      const haystack = [
        contractor.companyName,
        contractor.contactName,
        contractor.phone,
        contractor.email,
        contractor.address,
        contractor.note,
        (contractor.specialties || []).join(' ')
      ].join(' ').toLowerCase();
      if (haystack.indexOf(query) === -1) continue;
    }
    if (status && contractor.status !== status) continue;
    if (minRating && contractor.rating < minRating) continue;
    if (specialties.length) {
      const hit = specialties.every(function(s) { return contractor.specialties.indexOf(s) !== -1; });
      if (!hit) continue;
    }
    contractors.push(contractor);
  }

  contractors.sort(function(a, b) {
    return String(a.companyName || '').localeCompare(String(b.companyName || ''), 'zh-Hant');
  });
  return { success: true, contractors: contractors };
}

function getContractor(id) {
  if (!id) return { success: false, error: '缺少工程行 ID' };
  const sheet = getContractorSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const contractor = mapContractorRow_(data[i]);
    if (contractor.id === id) {
      return { success: true, contractor: contractor };
    }
  }
  return { success: false, error: '找不到工程行' };
}

function addContractor(contractor) {
  const sheet = getContractorSheet_();
  const normalized = validateAndNormalizeContractor_(contractor, true);
  if (!normalized.success) return normalized;
  sheet.appendRow(contractorToRow_(normalized.contractor));
  return { success: true, message: '工程行已新增', id: normalized.contractor.id, contractor: normalized.contractor };
}

function updateContractor(id, contractor) {
  if (!id) return { success: false, error: '缺少工程行 ID' };
  const sheet = getContractorSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    const current = mapContractorRow_(data[i]);
    if (current.id === id) {
      const merged = Object.assign({}, current, contractor || {}, { id: id });
      const normalized = validateAndNormalizeContractor_(merged, false, current.createdAt || new Date());
      if (!normalized.success) return normalized;
      sheet.getRange(i + 1, 1, 1, 14).setValues([contractorToRow_(normalized.contractor)]);
      return { success: true, message: '工程行已更新', contractor: normalized.contractor };
    }
  }
  return { success: false, error: '找不到工程行' };
}

function deleteContractor(id) {
  if (!id) return { success: false, error: '缺少工程行 ID' };
  const projectsResult = getContractorProjects(id);
  if (projectsResult.success && (projectsResult.projects || []).length > 0) {
    return { success: false, error: '此工程行已有關聯專案，請先解除指派後再刪除' };
  }
  const sheet = getContractorSheet_();
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][0]) === String(id)) {
      sheet.deleteRow(i + 1);
      return { success: true, message: '工程行已刪除' };
    }
  }
  return { success: false, error: '找不到工程行' };
}

function getContractorProjects(contractorId) {
  if (!contractorId) return { success: false, error: '缺少工程行 ID' };
  const projectsResult = getProjects();
  if (!projectsResult.success) return projectsResult;
  const projects = (projectsResult.projects || []).filter(function(project) {
    return String(project.contractorId || '') === String(contractorId);
  }).map(function(project) {
    return {
      id: project.id,
      projectNumber: project.projectNumber || '',
      customerName: project.customerName || '',
      totalPrice: normalizeNumber_(project.totalPrice),
      completedDate: project.completedDate || project.updatedAt || project.createdAt || '',
      status: project.status || '',
      contractorId: contractorId
    };
  });
  return { success: true, projects: projects };
}

function seedContractors(options) {
  const params = options || {};
  const force = String(params.force || '') === 'true' || params.force === true;
  const sheet = getContractorSheet_();
  const existingRows = Math.max(sheet.getLastRow() - 1, 0);
  if (existingRows > 0 && !force) {
    return { success: true, message: '工程行資料已存在，略過 seed', count: existingRows };
  }
  if (existingRows > 0 && force) {
    sheet.deleteRows(2, existingRows);
  }

  const seeds = [
    { companyName: '信義水電工程', contactName: '陳信宏', phone: '0911222333', email: 'service@xinyi-waterpower.tw', lineId: '@xinyi-water', specialties: ['水電配線', '燈具安裝', '弱電'], rating: 4.8, status: 'active', address: '台北市信義區松仁路 88 號', note: '擅長現場估價與急修。' },
    { companyName: '大安冷氣行', contactName: '林志安', phone: '0922333444', email: 'daan.cooling@example.com', lineId: '@daan-ac', specialties: ['冷氣', '空調保養', '排水'], rating: 4.6, status: 'active', address: '台北市大安區復興南路二段 120 號', note: '可配合夜間施工。' },
    { companyName: '永和輕隔間', contactName: '張雅文', phone: '0933444555', email: 'partition@yh-space.tw', lineId: '@yonghe-wall', specialties: ['輕隔間', '木作', '天花板'], rating: 4.5, status: 'active', address: '新北市永和區中正路 210 號', note: '擅長小坪數包廂規劃。' },
    { companyName: '專業麻將桌安裝', contactName: '吳柏翰', phone: '0944555666', email: 'mahjong.install@example.com', lineId: '@mj-table-pro', specialties: ['麻將桌', '設備安裝', '維修'], rating: 4.9, status: 'active', address: '桃園市蘆竹區南山路一段 66 號', note: '含運送、組裝、教育訓練。' },
    { companyName: '綜合工程行', contactName: '黃美玲', phone: '0955666777', email: 'service@total-engineering.tw', lineId: '@total-build', specialties: ['統包', '水電配線', '冷氣', '輕隔間'], rating: 4.4, status: 'inactive', address: '新北市板橋區文化路一段 300 號', note: '可做整體統包，但目前合作暫停。' }
  ];

  const rows = seeds.map(function(seed) {
    return contractorToRow_(validateAndNormalizeContractor_(seed, true).contractor);
  });
  if (rows.length) {
    sheet.getRange(2, 1, rows.length, 14).setValues(rows);
  }
  return { success: true, message: '工程行 seed 完成', count: rows.length };
}

function ensurePaymentSheet_(ss) {
  let sheet = ss.getSheetByName(SHEETS.PAYMENTS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.PAYMENTS);
    sheet.appendRow(['ID', '專案ID', '專案編號', '收款日期', '金額', '方式', '收款人ID', '收款人', '備註', '建立時間', '更新時間']);
  }
  return sheet;
}

function getPaymentSheet_() {
  const ss = SpreadsheetApp.openById(QUOTE_SHEET_ID);
  return ensurePaymentSheet_(ss);
}

function getPaymentsByProjectId_(projectId) {
  const paymentSheet = getPaymentSheet_();
  const data = paymentSheet.getDataRange().getValues();
  const payments = [];

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]) === String(projectId)) {
      payments.push(mapPaymentRow_(data[i]));
    }
  }

  payments.sort(function(a, b) {
    return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
  });
  return payments;
}

function getPaymentMap_() {
  const paymentSheet = getPaymentSheet_();
  const data = paymentSheet.getDataRange().getValues();
  const paymentMap = {};

  for (let i = 1; i < data.length; i++) {
    const payment = mapPaymentRow_(data[i]);
    if (!paymentMap[payment.projectId]) {
      paymentMap[payment.projectId] = [];
    }
    paymentMap[payment.projectId].push(payment);
  }

  Object.keys(paymentMap).forEach(function(projectId) {
    paymentMap[projectId].sort(function(a, b) {
      return new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime();
    });
  });

  return paymentMap;
}

function getContractorMap_() {
  const result = getContractors();
  const map = {};
  if (result.success) {
    (result.contractors || []).forEach(function(contractor) {
      map[contractor.id] = contractor;
    });
  }
  return map;
}

function enrichProjectContractor_(project, keepExistingName) {
  const data = Object.assign({}, project || {});
  const contractorId = String(data.contractorId || '').trim();
  if (!contractorId) {
    data.contractorId = '';
    data.contractorName = keepExistingName ? String(data.contractorName || '').trim() : '';
    return data;
  }
  const contractorResult = getContractor(contractorId);
  if (contractorResult.success) {
    data.contractorId = contractorId;
    data.contractorName = contractorResult.contractor.companyName;
    data.contractorPhone = contractorResult.contractor.phone;
    data.contractorLineUrl = contractorResult.contractor.lineUrl;
    data.contractorContactName = contractorResult.contractor.contactName;
  }
  return data;
}

function buildProjectFromRow_(row, paymentMap) {
  const projectData = parseJsonSafe_(row[9], {});
  const customerName = row[2] || projectData.storeName || projectData.customerName || '';
  const phone = row[3] || projectData.contact || projectData.phone || '';
  const totalPrice = normalizeNumber_(row[5] || projectData.totalAmount || projectData.totalPrice || projectData.paidAmount || 0);
  const projectId = row[0];
  const payments = paymentMap[projectId] || [];
  const paymentSummary = buildPaymentSummary_(totalPrice, payments);
  const contractor = projectData.contractorId ? getContractor(projectData.contractorId) : null;
  const contractorInfo = contractor && contractor.success ? contractor.contractor : null;
  const progressRows = ensureProjectProgressRows_(projectId, Object.assign({}, projectData, { id: projectId, createdAt: row[7] }));
  const progressSummary = buildProjectProgressSummary_(progressRows);

  return Object.assign({}, projectData, {
    id: row[0],
    projectNumber: row[1] || projectData.id || row[0],
    customerName: customerName,
    phone: phone,
    status: row[4],
    totalPrice: totalPrice,
    createdBy: row[6],
    createdAt: row[7],
    updatedAt: row[8],
    contractorId: projectData.contractorId || '',
    contractorName: (contractorInfo && contractorInfo.companyName) || projectData.contractorName || '',
    contractorPhone: (contractorInfo && contractorInfo.phone) || projectData.contractorPhone || '',
    contractorLineUrl: (contractorInfo && contractorInfo.lineUrl) || projectData.contractorLineUrl || '',
    contractorContactName: (contractorInfo && contractorInfo.contactName) || projectData.contractorContactName || '',
    payments: payments,
    paymentSummary: paymentSummary,
    totalPaid: paymentSummary.totalPaid,
    pendingAmount: paymentSummary.pendingAmount,
    paymentProgress: paymentSummary.progressPercent,
    paymentsCount: paymentSummary.paymentsCount,
    progressSummary: progressSummary
  });
}

function buildPaymentSummary_(totalPrice, payments) {
  const safeTotal = normalizeNumber_(totalPrice);
  const totalPaid = payments.reduce(function(sum, payment) {
    return sum + normalizeNumber_(payment.amount);
  }, 0);
  const pendingAmount = Math.max(safeTotal - totalPaid, 0);
  const progressRaw = safeTotal > 0 ? (totalPaid / safeTotal) * 100 : 0;
  const progressPercent = Math.min(100, Math.max(0, Math.round(progressRaw * 100) / 100));

  return {
    totalPrice: safeTotal,
    totalPaid: totalPaid,
    pendingAmount: pendingAmount,
    progressPercent: progressPercent,
    paymentsCount: payments.length,
    isFullyPaid: safeTotal > 0 && totalPaid >= safeTotal
  };
}

function validateAndNormalizePayment_(payment, isCreate) {
  const projectId = String(payment.projectId || '').trim();
  if (!projectId) {
    return { success: false, error: '缺少專案 ID' };
  }

  const projectResult = getProject(projectId);
  if (!projectResult.success) {
    return { success: false, error: '找不到專案' };
  }

  const receiverId = String(payment.receiverId || '').trim();
  if (!receiverId) {
    return { success: false, error: '請選擇收款人' };
  }

  const usersResult = getUsers();
  const receiver = (usersResult.users || []).filter(function(user) {
    return String(user.id) === receiverId;
  })[0];
  if (!receiver) {
    return { success: false, error: '收款人不存在' };
  }

  const paymentDate = String(payment.paymentDate || '').trim();
  if (!paymentDate) {
    return { success: false, error: '請輸入收款日期' };
  }

  const amount = normalizeNumber_(payment.amount);
  if (!(amount > 0)) {
    return { success: false, error: '收款金額必須大於 0' };
  }

  const method = String(payment.method || '').trim();
  if (!method) {
    return { success: false, error: '請選擇收款方式' };
  }

  const note = String(payment.note || '').trim().slice(0, 500);
  const now = new Date();
  const existingId = String(payment.id || '').trim();

  return {
    success: true,
    payment: {
      id: existingId || ('PAY' + Date.now()),
      projectId: projectResult.project.id,
      projectNumber: projectResult.project.projectNumber || '',
      paymentDate: paymentDate,
      amount: amount,
      method: PAYMENT_METHODS.indexOf(method) >= 0 ? method : method,
      receiverId: receiver.id,
      receiverName: receiver.name || '',
      note: note,
      createdAt: isCreate ? now : (payment.createdAt || now),
      updatedAt: now
    }
  };
}

function mergePayment_(existing, patch) {
  return {
    id: existing.id,
    projectId: patch.projectId || existing.projectId,
    paymentDate: patch.paymentDate || existing.paymentDate,
    amount: patch.amount !== undefined ? patch.amount : existing.amount,
    method: patch.method || existing.method,
    receiverId: patch.receiverId || existing.receiverId,
    note: patch.note !== undefined ? patch.note : existing.note,
    createdAt: existing.createdAt,
    projectNumber: patch.projectNumber || existing.projectNumber
  };
}

function mapPaymentRow_(row) {
  return {
    id: row[0],
    projectId: row[1],
    projectNumber: row[2],
    paymentDate: formatSheetDate_(row[3]),
    amount: normalizeNumber_(row[4]),
    method: row[5] || '',
    receiverId: row[6] || '',
    receiverName: row[7] || '',
    note: row[8] || '',
    createdAt: row[9] || '',
    updatedAt: row[10] || ''
  };
}

function ensurePriceTableSheet_(ss) {
  const spreadsheet = ss || SpreadsheetApp.openById(QUOTE_SHEET_ID);
  let sheet = spreadsheet.getSheetByName(SHEETS.PRICE_TABLE);
  if (!sheet) {
    sheet = spreadsheet.insertSheet(SHEETS.PRICE_TABLE);
  }

  const headerRange = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), PRICE_LIST_HEADERS.length));
  const currentHeaders = sheet.getLastColumn() > 0 ? headerRange.getValues()[0] : [];
  const hasNewHeader = String(currentHeaders[3] || '') === '規格說明' && String(currentHeaders[7] || '') === '狀態';

  if (!hasNewHeader) {
    if (sheet.getLastRow() <= 1) {
      sheet.clear();
      sheet.getRange(1, 1, 1, PRICE_LIST_HEADERS.length).setValues([PRICE_LIST_HEADERS]);
    } else {
      migrateLegacyPriceTable_(sheet, currentHeaders);
    }
  }

  if (sheet.getFrozenRows() < 1) {
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function migrateLegacyPriceTable_(sheet, headers) {
  const lastRow = sheet.getLastRow();
  const lastColumn = Math.max(sheet.getLastColumn(), 7);
  const data = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, lastColumn).getValues() : [];
  const normalizedRows = data.map(function(row) {
    return priceItemToRow_(mapLegacyPriceItemRow_(row, headers));
  });
  sheet.clear();
  sheet.getRange(1, 1, 1, PRICE_LIST_HEADERS.length).setValues([PRICE_LIST_HEADERS]);
  if (normalizedRows.length > 0) {
    sheet.getRange(2, 1, normalizedRows.length, PRICE_LIST_HEADERS.length).setValues(normalizedRows);
  }
}

function mapLegacyPriceItemRow_(row, headers) {
  const headerText = (headers || []).map(function(value) { return String(value || '').trim(); });
  const hasNamedColumns = headerText.indexOf('分類') >= 0 && headerText.indexOf('項目名稱') >= 0;
  if (hasNamedColumns) {
    const obj = {};
    for (let i = 0; i < headerText.length; i++) {
      obj[headerText[i]] = row[i];
    }
    return {
      id: obj['ID'] || ('ITEM' + Date.now()),
      category: obj['分類'] || '',
      name: obj['項目名稱'] || '',
      spec: obj['規格說明'] || '',
      price: obj['單價'] || 0,
      unit: obj['單位'] || '',
      note: obj['備註'] || obj['子分類'] || '',
      status: obj['狀態'] || '啟用',
      createdAt: obj['建立日期'] || obj['建立時間'] || new Date(),
      updatedAt: obj['更新日期'] || obj['更新時間'] || new Date()
    };
  }

  return {
    id: row[0] || ('ITEM' + Date.now()),
    category: row[1] || '',
    name: row[2] || '',
    spec: '',
    price: row[3] || 0,
    unit: row[4] || '',
    note: row[5] || '',
    status: '啟用',
    createdAt: row[6] || new Date(),
    updatedAt: new Date()
  };
}

function mapPriceItemRow_(row) {
  return {
    id: String(row[0] || '').trim(),
    category: String(row[1] || '').trim(),
    name: String(row[2] || '').trim(),
    spec: String(row[3] || '').trim(),
    price: normalizeNumber_(row[4]),
    unit: String(row[5] || '').trim(),
    note: String(row[6] || '').trim(),
    status: normalizePriceStatus_(row[7]),
    createdAt: row[8] || '',
    updatedAt: row[9] || '',
    description: String(row[3] || '').trim(),
    remark: String(row[6] || '').trim(),
    subCategory: String(row[6] || '').trim(),
    isActive: normalizePriceStatus_(row[7]) === '啟用'
  };
}

function validateAndNormalizePriceItem_(item, isCreate, createdAtOverride) {
  const now = new Date();
  const category = String(item.category || '').trim();
  const name = String(item.name || '').trim();
  const spec = String(item.spec || item.description || '').trim().slice(0, 200);
  const unit = String(item.unit || '').trim().slice(0, 20);
  const note = String(item.note || item.remark || item.subCategory || '').trim().slice(0, 500);
  const price = normalizeNumber_(item.price);
  const status = normalizePriceStatus_(item.status || (item.isActive === false ? '停用' : '啟用'));

  if (PRICE_LIST_CATEGORIES.indexOf(category) === -1) {
    return { success: false, error: '分類不正確' };
  }
  if (!name) {
    return { success: false, error: '請輸入項目名稱' };
  }
  if (name.length > 100) {
    return { success: false, error: '項目名稱不可超過 100 字' };
  }
  if (price < 0) {
    return { success: false, error: '單價不可小於 0' };
  }

  return {
    success: true,
    item: {
      id: String(item.id || '').trim() || ('ITEM' + Date.now()),
      category: category,
      name: name.slice(0, 100),
      spec: spec,
      price: price,
      unit: unit,
      note: note,
      status: status,
      createdAt: isCreate ? (createdAtOverride || now) : (createdAtOverride || item.createdAt || now),
      updatedAt: now,
      description: spec,
      remark: note,
      subCategory: note,
      isActive: status === '啟用'
    }
  };
}

function mergePriceItem_(existing, patch) {
  return {
    id: existing.id,
    category: patch.category !== undefined ? patch.category : existing.category,
    name: patch.name !== undefined ? patch.name : existing.name,
    spec: patch.spec !== undefined ? patch.spec : (patch.description !== undefined ? patch.description : existing.spec),
    price: patch.price !== undefined ? patch.price : existing.price,
    unit: patch.unit !== undefined ? patch.unit : existing.unit,
    note: patch.note !== undefined ? patch.note : (patch.remark !== undefined ? patch.remark : (patch.subCategory !== undefined ? patch.subCategory : existing.note)),
    status: patch.status !== undefined ? patch.status : existing.status,
    createdAt: existing.createdAt
  };
}

function priceItemToRow_(item) {
  return [
    item.id,
    item.category,
    item.name,
    item.spec || '',
    normalizeNumber_(item.price),
    item.unit || '',
    item.note || '',
    normalizePriceStatus_(item.status),
    item.createdAt || new Date(),
    item.updatedAt || new Date()
  ];
}

function normalizePriceStatus_(value) {
  const text = String(value || '').trim();
  return (text === '停用' || text.toLowerCase() === 'inactive') ? '停用' : '啟用';
}

function seedPriceList(options) {
  const sheet = ensurePriceTableSheet_();
  const existing = getPriceTable();
  const existingKeys = {};
  (existing.items || []).forEach(function(item) {
    existingKeys[item.category + '::' + item.name] = true;
  });

  const seedItems = buildSeedPriceItems_();
  const rows = [];
  seedItems.forEach(function(item) {
    const key = item.category + '::' + item.name;
    if (!existingKeys[key]) {
      const normalized = validateAndNormalizePriceItem_(item, true);
      if (normalized.success) {
        rows.push(priceItemToRow_(normalized.item));
      }
    }
  });

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, PRICE_LIST_HEADERS.length).setValues(rows);
  }

  return {
    success: true,
    message: rows.length > 0 ? ('已新增測試資料 ' + rows.length + ' 筆') : '測試資料已存在，未新增',
    insertedCount: rows.length,
    totalSeedCount: seedItems.length,
    categories: PRICE_LIST_CATEGORIES,
    note: '此 seed function 採補齊模式，不會清空既有正式資料。'
  };
}

function buildSeedPriceItems_() {
  return [
    { category: '麻將桌', name: '電動麻將桌 M1', spec: '四口機種，含基本安裝', price: 28000, unit: '台', note: '標準門市款', status: '啟用' },
    { category: '麻將桌', name: '折疊麻將椅', spec: '皮革坐墊', price: 1200, unit: '張', note: '可與桌組搭配', status: '啟用' },
    { category: '麻將桌', name: '桌面防刮墊', spec: '客製尺寸', price: 1800, unit: '組', note: '含裁切', status: '啟用' },
    { category: '冷氣', name: '變頻分離式冷氣 5kW', spec: '含銅管 5 米', price: 36500, unit: '台', note: '含基本安裝', status: '啟用' },
    { category: '冷氣', name: '冷氣排水工程', spec: 'PVC 排水配置', price: 4500, unit: '式', note: '依現場調整', status: '啟用' },
    { category: '冷氣', name: '室外機吊架', spec: '鍍鋅防鏽', price: 2800, unit: '組', note: '不含高空作業', status: '啟用' },
    { category: '水電配線', name: '插座新增', spec: '含線材與面板', price: 1800, unit: '處', note: '110V', status: '啟用' },
    { category: '水電配線', name: '迴路配線', spec: '2.0mm 線材', price: 3500, unit: '迴路', note: '含無熔絲開關', status: '啟用' },
    { category: '水電配線', name: '弱電網路佈線', spec: 'CAT6', price: 2200, unit: '點', note: '含資訊面板', status: '啟用' },
    { category: '輕隔間', name: '輕鋼架隔間', spec: '雙面石膏板', price: 3800, unit: '坪', note: '含批土打磨', status: '啟用' },
    { category: '輕隔間', name: '隔音棉加強', spec: '高密度隔音棉', price: 1200, unit: '坪', note: '加購項目', status: '啟用' },
    { category: '輕隔間', name: '玻璃觀景窗開孔', spec: '含框料收邊', price: 6800, unit: '處', note: '不含玻璃', status: '啟用' },
    { category: '包廂門', name: '包廂木門', spec: '含門框五金', price: 12500, unit: '樘', note: '標準尺寸', status: '啟用' },
    { category: '包廂門', name: '門弓器', spec: '緩衝回彈', price: 1800, unit: '組', note: '可搭配木門', status: '啟用' },
    { category: '包廂門', name: '門牌燈', spec: 'LED 客製編號', price: 2200, unit: '組', note: '含安裝', status: '啟用' },
    { category: '智能門鎖', name: '指紋密碼鎖', spec: '含卡片與密碼', price: 9800, unit: '組', note: '標準銀色', status: '啟用' },
    { category: '智能門鎖', name: '門鎖連網模組', spec: 'Wi-Fi 遠端管理', price: 3200, unit: '組', note: '需現場 Wi-Fi', status: '啟用' },
    { category: '智能門鎖', name: '門鎖安裝校正', spec: '舊門扇調整', price: 1800, unit: '次', note: '維護服務', status: '啟用' },
    { category: '其他設備', name: '藍牙喇叭', spec: '吸頂式', price: 2600, unit: '顆', note: '含配線', status: '啟用' },
    { category: '其他設備', name: '監視器鏡頭', spec: '500 萬畫素', price: 4200, unit: '支', note: '不含主機', status: '啟用' },
    { category: '其他設備', name: '招牌燈箱', spec: '雙面無接縫', price: 18500, unit: '式', note: '含基本安裝', status: '停用' }
  ];
}


function getStatisticsOverview(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    overview: stats.overview,
    generatedAt: stats.generatedAt
  };
}

function getMonthlyStatistics(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    monthlyStatistics: stats.monthlyStatistics,
    generatedAt: stats.generatedAt
  };
}

function getProjectStatusDistribution(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    distribution: stats.projectStatusDistribution,
    generatedAt: stats.generatedAt
  };
}

function getRevenueChart(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    revenueChart: stats.revenueChart,
    generatedAt: stats.generatedAt
  };
}

function getTopCustomers(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    customers: stats.topCustomers,
    generatedAt: stats.generatedAt
  };
}

function getTopEmployees(filters) {
  const stats = getStatisticsDataset_(filters || {});
  return {
    success: true,
    filters: stats.filters,
    employees: stats.topEmployees,
    generatedAt: stats.generatedAt
  };
}

function getStatisticsDataset_(rawFilters) {
  const filters = normalizeStatisticsFilters_(rawFilters || {});
  const cacheKey = 'quote_stats_' + Utilities.base64EncodeWebSafe(JSON.stringify(filters)).slice(0, 120);
  const cache = CacheService.getScriptCache();
  const cached = cache.get(cacheKey);
  if (cached) {
    const parsed = JSON.parse(cached);
    parsed.cacheHit = true;
    return parsed;
  }

  const projectsResult = getProjects();
  const usersResult = getUsers();
  const projects = (projectsResult.projects || []);
  const users = (usersResult.users || []);
  const usersById = {};
  users.forEach(function(user) {
    usersById[String(user.id)] = user;
  });

  const filteredProjects = projects.filter(function(project) {
    return matchStatisticsProjectFilters_(project, filters);
  });

  const totalRevenue = filteredProjects.reduce(function(sum, project) {
    return sum + normalizeNumber_(project.totalPrice);
  }, 0);
  const totalPaid = filteredProjects.reduce(function(sum, project) {
    return sum + normalizeNumber_(project.totalPaid || (project.paymentSummary || {}).totalPaid);
  }, 0);
  const pendingAmount = Math.max(totalRevenue - totalPaid, 0);
  const collectionRate = totalRevenue > 0 ? Math.round((totalPaid / totalRevenue) * 10000) / 100 : 0;

  const result = {
    filters: filters,
    generatedAt: new Date().toISOString(),
    overview: {
      totalRevenue: totalRevenue,
      totalPaid: totalPaid,
      pendingAmount: pendingAmount,
      projectCount: filteredProjects.length,
      collectionRate: collectionRate,
      collectionRateColor: getCollectionRateColor_(collectionRate)
    },
    monthlyStatistics: buildMonthlyStatistics_(filteredProjects, 6),
    projectStatusDistribution: buildProjectStatusDistribution_(filteredProjects),
    revenueChart: buildRevenueChart_(filteredProjects, 12),
    topCustomers: buildTopCustomers_(filteredProjects, 5),
    topEmployees: buildTopEmployees_(filteredProjects, usersById, 5)
  };

  cache.put(cacheKey, JSON.stringify(result), 300);
  return result;
}

function normalizeStatisticsFilters_(filters) {
  return {
    dateStart: normalizeDateInput_(filters.dateStart || filters.startDate || ''),
    dateEnd: normalizeDateInput_(filters.dateEnd || filters.endDate || ''),
    assignee: String(filters.assignee || '').trim(),
    status: String(filters.status || '').trim()
  };
}

function matchStatisticsProjectFilters_(project, filters) {
  if (filters.assignee) {
    const assignee = String(project.assignee || project.createdBy || '').trim();
    if (assignee !== filters.assignee) {
      return false;
    }
  }

  if (filters.status) {
    if (String(project.status || '').trim() !== filters.status) {
      return false;
    }
  }

  if (filters.dateStart || filters.dateEnd) {
    const createdAt = parseDateValue_(project.createdAt || project.createdDate || project.signDate || project.updatedAt);
    if (!createdAt) {
      return false;
    }
    if (filters.dateStart) {
      const start = parseDateValue_(filters.dateStart);
      if (start && createdAt.getTime() < start.getTime()) {
        return false;
      }
    }
    if (filters.dateEnd) {
      const end = parseDateValue_(filters.dateEnd);
      if (end && createdAt.getTime() > end.getTime() + 86399999) {
        return false;
      }
    }
  }

  return true;
}

function buildMonthlyStatistics_(projects, monthCount) {
  const monthKeys = buildRecentMonthKeys_(monthCount);
  const buckets = {};

  monthKeys.forEach(function(monthKey) {
    buckets[monthKey] = {
      monthKey: monthKey,
      month: formatMonthLabel_(monthKey),
      newProjects: 0,
      totalRevenue: 0,
      totalPaid: 0,
      collectionRate: 0
    };
  });

  projects.forEach(function(project) {
    const createdMonth = getMonthKey_(project.createdAt || project.createdDate || project.signDate || project.updatedAt);
    if (createdMonth && buckets[createdMonth]) {
      buckets[createdMonth].newProjects += 1;
      buckets[createdMonth].totalRevenue += normalizeNumber_(project.totalPrice);
    }

    (project.payments || []).forEach(function(payment) {
      const paymentMonth = getMonthKey_(payment.paymentDate || payment.date || payment.createdAt);
      if (paymentMonth && buckets[paymentMonth]) {
        buckets[paymentMonth].totalPaid += normalizeNumber_(payment.amount);
      }
    });
  });

  return monthKeys.map(function(monthKey) {
    const item = buckets[monthKey];
    item.collectionRate = item.totalRevenue > 0 ? Math.round((item.totalPaid / item.totalRevenue) * 10000) / 100 : 0;
    return item;
  });
}

function buildRevenueChart_(projects, monthCount) {
  const monthly = buildMonthlyStatistics_(projects, monthCount);
  return {
    labels: monthly.map(function(item) { return item.month; }),
    totalRevenue: monthly.map(function(item) { return item.totalRevenue; }),
    totalPaid: monthly.map(function(item) { return item.totalPaid; })
  };
}

function buildProjectStatusDistribution_(projects) {
  const counts = {};
  projects.forEach(function(project) {
    const status = String(project.status || 'unknown');
    counts[status] = (counts[status] || 0) + 1;
  });

  return Object.keys(counts).sort().map(function(status) {
    return {
      status: status,
      label: getStatusLabel_(status),
      count: counts[status]
    };
  });
}

function buildTopCustomers_(projects, limit) {
  const totals = {};
  projects.forEach(function(project) {
    const customer = String(project.customerName || project.storeName || '未命名客戶').trim() || '未命名客戶';
    if (!totals[customer]) {
      totals[customer] = {
        customerName: customer,
        totalPaid: 0,
        totalRevenue: 0,
        projectCount: 0
      };
    }
    totals[customer].totalPaid += normalizeNumber_(project.totalPaid || (project.paymentSummary || {}).totalPaid);
    totals[customer].totalRevenue += normalizeNumber_(project.totalPrice);
    totals[customer].projectCount += 1;
  });

  return Object.keys(totals).map(function(key) {
    return totals[key];
  }).sort(function(a, b) {
    return b.totalPaid - a.totalPaid;
  }).slice(0, limit || 5);
}

function buildTopEmployees_(projects, usersById, limit) {
  const totals = {};
  projects.forEach(function(project) {
    const rawAssignee = String(project.assignee || project.createdBy || '').trim();
    const user = usersById[rawAssignee];
    const label = user ? (user.name || rawAssignee) : (rawAssignee || '未指派');
    const key = rawAssignee || label;
    if (!totals[key]) {
      totals[key] = {
        employeeId: rawAssignee || '',
        employeeName: label,
        projectCount: 0,
        totalRevenue: 0,
        totalPaid: 0
      };
    }
    totals[key].projectCount += 1;
    totals[key].totalRevenue += normalizeNumber_(project.totalPrice);
    totals[key].totalPaid += normalizeNumber_(project.totalPaid || (project.paymentSummary || {}).totalPaid);
  });

  return Object.keys(totals).map(function(key) {
    return totals[key];
  }).sort(function(a, b) {
    return b.projectCount - a.projectCount || b.totalPaid - a.totalPaid;
  }).slice(0, limit || 5);
}

function buildRecentMonthKeys_(count) {
  const months = [];
  const today = new Date();
  const base = new Date(today.getFullYear(), today.getMonth(), 1);
  for (var i = count - 1; i >= 0; i--) {
    const current = new Date(base.getFullYear(), base.getMonth() - i, 1);
    months.push(Utilities.formatDate(current, Session.getScriptTimeZone(), 'yyyy-MM'));
  }
  return months;
}

function getMonthKey_(value) {
  const date = parseDateValue_(value);
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM');
}

function formatMonthLabel_(monthKey) {
  if (!monthKey || monthKey.indexOf('-') === -1) return monthKey || '';
  var parts = monthKey.split('-');
  return parts[0] + '/' + parts[1];
}

function parseDateValue_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return value;
  }
  var parsed = new Date(value);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function normalizeDateInput_(value) {
  if (!value) return '';
  var date = parseDateValue_(value);
  if (!date) return '';
  return Utilities.formatDate(date, Session.getScriptTimeZone(), 'yyyy-MM-dd');
}

function getCollectionRateColor_(rate) {
  if (rate > 70) return '#10b981';
  if (rate >= 50) return '#f59e0b';
  return '#ef4444';
}

function getStatusLabel_(status) {
  var labels = {
    draft: '草稿中',
    quoted: '已報價',
    signed: '已簽約',
    construction: '施工中',
    completed: '已完工',
    paid: '已結清',
    unknown: '未分類'
  };
  return labels[status] || status;
}

function normalizeNumber_(value) {
  const num = Number(value || 0);
  return isNaN(num) ? 0 : num;
}

function parseJsonSafe_(value, defaultValue) {
  if (!value) return defaultValue;
  try {
    return JSON.parse(value);
  } catch (error) {
    return defaultValue;
  }
}

function formatSheetDate_(value) {
  if (!value) return '';
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value.getTime())) {
    return Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
  }
  return String(value);
}

function jsonOutput_(result) {
  const output = ContentService.createTextOutput(JSON.stringify(result));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

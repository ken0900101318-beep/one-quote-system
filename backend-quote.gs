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
  PAYMENTS: '收款記錄'
};

const PAYMENT_METHODS = ['現金', '匯款', '支票', '刷卡', 'LINE Pay', '其他'];

function initializeSheets() {
  const ss = SpreadsheetApp.openById(QUOTE_SHEET_ID);

  let projectsSheet = ss.getSheetByName(SHEETS.PROJECTS);
  if (!projectsSheet) {
    projectsSheet = ss.insertSheet(SHEETS.PROJECTS);
    projectsSheet.appendRow(['ID', '專案編號', '客戶姓名', '聯絡電話', '狀態', '總價', '建立人', '建立時間', '更新時間', '資料JSON']);
  }

  let priceSheet = ss.getSheetByName(SHEETS.PRICE_TABLE);
  if (!priceSheet) {
    priceSheet = ss.insertSheet(SHEETS.PRICE_TABLE);
    priceSheet.appendRow(['ID', '分類', '項目名稱', '單價', '單位', '子分類', '建立時間']);
  } else {
    priceSheet.getRange(1, 6).setValue('子分類');
  }

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
  return '✅ 初始化完成';
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
    case 'getCategories':
      result = getCategories();
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

  sheet.appendRow([
    id,
    projectNumber,
    customerName,
    phone,
    project.status || 'quoted',
    normalizeNumber_(project.totalPrice || project.totalAmount || project.paidAmount || 0),
    project.createdBy || project.assignee || '',
    project.createdDate || now,
    now,
    JSON.stringify(project)
  ]);

  return { success: true, message: '專案已新增', id };
}

function updateProject(id, project) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PROJECTS);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      const customerName = project.customerName || project.storeName || data[i][2];
      const phone = project.phone || project.contact || data[i][3];
      const totalPrice = normalizeNumber_(project.totalPrice || project.totalAmount || project.paidAmount || data[i][5]);

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
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const lastRow = sheet.getLastRow();
  if (lastRow > 1) {
    sheet.deleteRows(2, lastRow - 1);
  }

  const rows = items.map(function(item) {
    return [
      item.id,
      item.category || '',
      item.name,
      normalizeNumber_(item.price || 0),
      item.unit || '',
      item.subCategory || '',
      new Date()
    ];
  });

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, 7).setValues(rows);
  }

  return { success: true, message: '已匯入 ' + items.length + ' 項價目', count: items.length };
}

function addPriceItem(item) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const id = item.id || ('ITEM' + Date.now());

  sheet.appendRow([
    id,
    item.category || '',
    item.name || '',
    normalizeNumber_(item.price || 0),
    item.unit || '',
    item.subCategory || '',
    new Date()
  ]);

  return { success: true, message: '項目已新增', id };
}

function updatePriceItem(id, item) {
  const sheet = SpreadsheetApp.openById(QUOTE_SHEET_ID).getSheetByName(SHEETS.PRICE_TABLE);
  const data = sheet.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.getRange(i + 1, 2).setValue(item.category || data[i][1]);
      sheet.getRange(i + 1, 3).setValue(item.name || data[i][2]);
      sheet.getRange(i + 1, 4).setValue(item.price !== undefined ? normalizeNumber_(item.price) : data[i][3]);
      sheet.getRange(i + 1, 5).setValue(item.unit || data[i][4]);
      sheet.getRange(i + 1, 6).setValue(item.subCategory || data[i][5]);
      return { success: true, message: '項目已更新' };
    }
  }

  return { success: false, error: '找不到項目' };
}

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

function buildProjectFromRow_(row, paymentMap) {
  const projectData = parseJsonSafe_(row[9], {});
  const customerName = row[2] || projectData.storeName || projectData.customerName || '';
  const phone = row[3] || projectData.contact || projectData.phone || '';
  const totalPrice = normalizeNumber_(row[5] || projectData.totalAmount || projectData.totalPrice || projectData.paidAmount || 0);
  const projectId = row[0];
  const payments = paymentMap[projectId] || [];
  const paymentSummary = buildPaymentSummary_(totalPrice, payments);

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
    payments: payments,
    paymentSummary: paymentSummary,
    totalPaid: paymentSummary.totalPaid,
    pendingAmount: paymentSummary.pendingAmount,
    paymentProgress: paymentSummary.progressPercent,
    paymentsCount: paymentSummary.paymentsCount
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

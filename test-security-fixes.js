/**
 * ONE桌遊報價系統 - 安全修正測試腳本
 * 測試 5 個關鍵修正項目
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbyaZiYDGTbeCxe9HYRCREsrWEMVLNpJYZaV7Jw7aV_dO7yU8XsGCUEqPQfafrgx2uHe/exec';

// 測試結果
const results = {
  passed: 0,
  failed: 0,
  tests: []
};

/**
 * 測試工具函數
 */
function logTest(name, passed, message) {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} - ${name}: ${message}`);
  results.tests.push({ name, passed, message });
  if (passed) results.passed++;
  else results.failed++;
}

/**
 * 測試 #17: 後端輸入驗證
 */
async function testInputValidation() {
  console.log('\n🧪 測試 #17: 後端輸入驗證\n');
  
  // 測試 1: 空白專案
  try {
    const res1 = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addProject',
        project: {}
      })
    });
    const data1 = await res1.json();
    logTest(
      '空白專案應被拒絕',
      !data1.success && data1.error.includes('客戶姓名'),
      data1.error || '無錯誤訊息'
    );
  } catch (error) {
    logTest('空白專案應被拒絕', false, error.message);
  }
  
  // 測試 2: 缺少電話
  try {
    const res2 = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addProject',
        project: {
          customerName: '測試客戶'
        }
      })
    });
    const data2 = await res2.json();
    logTest(
      '缺少電話應被拒絕',
      !data2.success && data2.error.includes('電話'),
      data2.error || '無錯誤訊息'
    );
  } catch (error) {
    logTest('缺少電話應被拒絕', false, error.message);
  }
  
  // 測試 3: 缺少報價項目
  try {
    const res3 = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addProject',
        project: {
          customerName: '測試客戶',
          phone: '0912345678',
          items: []
        }
      })
    });
    const data3 = await res3.json();
    logTest(
      '缺少報價項目應被拒絕',
      !data3.success && data3.error.includes('報價項目'),
      data3.error || '無錯誤訊息'
    );
  } catch (error) {
    logTest('缺少報價項目應被拒絕', false, error.message);
  }
  
  // 測試 4: 有效專案應該通過
  try {
    const res4 = await fetch(API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'addProject',
        project: {
          customerName: '測試客戶',
          phone: '0912345678',
          items: [{ name: '測試項目', price: 1000 }]
        }
      })
    });
    const data4 = await res4.json();
    logTest(
      '有效專案應該通過',
      data4.success,
      data4.message || data4.error || '無訊息'
    );
  } catch (error) {
    logTest('有效專案應該通過', false, error.message);
  }
}

/**
 * 測試 #19: 專案編號唯一性
 */
async function testUniqueProjectId() {
  console.log('\n🧪 測試 #19: 專案編號唯一性\n');
  
  const ids = [];
  
  // 快速連續新增 10 個專案
  for (let i = 0; i < 10; i++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addProject',
          project: {
            customerName: `測試客戶 ${i + 1}`,
            phone: '0912345678',
            items: [{ name: '測試項目', price: 1000 }]
          }
        })
      });
      const data = await res.json();
      if (data.success && data.id) {
        ids.push(data.id);
      }
    } catch (error) {
      console.log(`新增專案 ${i + 1} 失敗:`, error.message);
    }
  }
  
  // 檢查是否有重複
  const uniqueIds = new Set(ids);
  logTest(
    '10 個專案的 ID 應該都不重複',
    uniqueIds.size === ids.length,
    `產生了 ${ids.length} 個 ID，其中 ${uniqueIds.size} 個唯一`
  );
  
  // 檢查格式
  const validFormat = ids.every(id => /^P\d+-[a-z0-9]{6}$/.test(id));
  logTest(
    'ID 格式應該是 P{timestamp}-{random}',
    validFormat,
    `格式範例: ${ids[0] || '無'}`
  );
}

/**
 * 測試 #21: 刪除索引修正
 */
async function testDeleteIndexFix() {
  console.log('\n🧪 測試 #21: 刪除索引修正\n');
  
  // 新增 3 個測試專案
  const testIds = [];
  for (let i = 0; i < 3; i++) {
    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addProject',
          project: {
            customerName: `刪除測試 ${i + 1}`,
            phone: '0912345678',
            items: [{ name: '測試項目', price: 1000 }]
          }
        })
      });
      const data = await res.json();
      if (data.success && data.id) {
        testIds.push(data.id);
      }
    } catch (error) {
      console.log(`新增測試專案失敗:`, error.message);
    }
  }
  
  console.log(`已新增 ${testIds.length} 個測試專案`);
  
  // 刪除第 2 個專案
  if (testIds.length >= 2) {
    try {
      const res = await fetch(`${API_URL}?action=deleteProject&id=${testIds[1]}`);
      const data = await res.json();
      logTest(
        '刪除中間的專案應該成功',
        data.success,
        data.message || data.error || '無訊息'
      );
    } catch (error) {
      logTest('刪除中間的專案應該成功', false, error.message);
    }
  }
  
  // 確認其他專案還在
  if (testIds.length >= 3) {
    try {
      const res = await fetch(`${API_URL}?action=getProject&id=${testIds[2]}`);
      const data = await res.json();
      logTest(
        '後面的專案應該還存在',
        data.success && data.project,
        data.project ? `找到專案 ${data.project.customerName}` : '找不到專案'
      );
    } catch (error) {
      logTest('後面的專案應該還存在', false, error.message);
    }
  }
  
  // 清理測試專案
  for (const id of testIds) {
    try {
      await fetch(`${API_URL}?action=deleteProject&id=${id}`);
    } catch (error) {
      // 忽略清理錯誤
    }
  }
}

/**
 * 測試 #20: Sheets 存在性檢查
 */
async function testSheetExistenceCheck() {
  console.log('\n🧪 測試 #20: Sheets 存在性檢查\n');
  
  // 測試讀取資料（如果 sheet 不存在會自動重建）
  try {
    const res = await fetch(`${API_URL}?action=getProjects`);
    const data = await res.json();
    logTest(
      '讀取專案列表應該成功（自動重建 sheet）',
      data.success,
      data.error || `找到 ${data.projects?.length || 0} 個專案`
    );
  } catch (error) {
    logTest('讀取專案列表應該成功', false, error.message);
  }
  
  try {
    const res = await fetch(`${API_URL}?action=getPriceTable`);
    const data = await res.json();
    logTest(
      '讀取價目表應該成功（自動重建 sheet）',
      data.success,
      data.error || `找到 ${data.items?.length || 0} 個項目`
    );
  } catch (error) {
    logTest('讀取價目表應該成功', false, error.message);
  }
  
  try {
    const res = await fetch(`${API_URL}?action=getCategories`);
    const data = await res.json();
    logTest(
      '讀取分類應該成功（自動重建 sheet）',
      data.success,
      data.error || `找到 ${data.categories?.length || 0} 個分類`
    );
  } catch (error) {
    logTest('讀取分類應該成功', false, error.message);
  }
}

/**
 * 測試 #18: 並發控制（模擬）
 */
async function testConcurrencyControl() {
  console.log('\n🧪 測試 #18: 並發控制（模擬）\n');
  
  // 同時發送 5 個請求
  const promises = [];
  for (let i = 0; i < 5; i++) {
    promises.push(
      fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'addProject',
          project: {
            customerName: `並發測試 ${i + 1}`,
            phone: '0912345678',
            items: [{ name: '測試項目', price: 1000 }]
          }
        })
      }).then(res => res.json())
    );
  }
  
  try {
    const results = await Promise.all(promises);
    const successCount = results.filter(r => r.success).length;
    logTest(
      '5 個並發請求應該都成功',
      successCount === 5,
      `${successCount}/5 個請求成功`
    );
    
    // 檢查 ID 是否都不重複
    const ids = results.filter(r => r.success).map(r => r.id);
    const uniqueIds = new Set(ids);
    logTest(
      '並發產生的 ID 應該都不重複',
      uniqueIds.size === ids.length,
      `${ids.length} 個 ID，${uniqueIds.size} 個唯一`
    );
  } catch (error) {
    logTest('並發測試', false, error.message);
  }
}

/**
 * 執行所有測試
 */
async function runAllTests() {
  console.log('🚀 開始執行安全修正測試\n');
  console.log('API URL:', API_URL);
  console.log('='.repeat(60));
  
  await testInputValidation();
  await testUniqueProjectId();
  await testConcurrencyControl();
  await testDeleteIndexFix();
  await testSheetExistenceCheck();
  
  console.log('\n' + '='.repeat(60));
  console.log(`\n📊 測試結果:`);
  console.log(`✅ 通過: ${results.passed}`);
  console.log(`❌ 失敗: ${results.failed}`);
  console.log(`📋 總計: ${results.passed + results.failed}`);
  console.log(`\n✨ 成功率: ${Math.round(results.passed / (results.passed + results.failed) * 100)}%`);
  
  if (results.failed === 0) {
    console.log('\n🎉 所有測試通過！');
  } else {
    console.log('\n⚠️  有測試失敗，請檢查上方詳細結果');
  }
}

// 執行測試
runAllTests().catch(error => {
  console.error('測試執行失敗:', error);
  process.exit(1);
});

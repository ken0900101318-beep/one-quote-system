// 🔧 確保數據已初始化（解決手機無數據問題）
function ensureDataInitialized() {
    const projects = localStorage.getItem('projects');
    const priceTable = localStorage.getItem('priceTable');
    const users = localStorage.getItem('users');
    
    // 如果任一核心數據不存在，觸發初始化
    if (!projects || !priceTable || !users) {
        console.log('⚠️ 數據缺失，正在初始化...');
        
        // 確保 initializeData 函數存在並執行
        if (typeof initializeData === 'function') {
            // 移除舊標記，強制重新初始化
            localStorage.removeItem('quoteSystemInitialized');
            initializeData();
            console.log('✅ 數據初始化完成');
            return true; // 返回 true 表示執行了初始化
        } else {
            console.error('❌ initializeData 函數不存在！請確認 data.js 已載入。');
            alert('系統數據載入失敗，請重新整理頁面！');
            return false;
        }
    }
    return true; // 數據已存在
}

// 頁面載入時自動檢查
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        ensureDataInitialized();
    });
}

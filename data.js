// ONE桌遊報價系統 - 初始數據

// 初始化數據到 localStorage
function initializeData() {
    // 檢查是否已初始化
    if (localStorage.getItem('quoteSystemInitialized')) {
        return;
    }

    // 價格表數據
    const priceTable = [
        // 木工類
        { id: 'ITEM-001', name: '輕隔間(15MM石膏板＋60Ｋ延綿)', price: 3700, cost: 3000, friendPrice: 3300, unit: '坪', category: '工班', subCategory: '木工' },
        { id: 'ITEM-002', name: '輕隔間(15MM石膏板＋100Ｋ延綿)', price: 3800, cost: 0, friendPrice: 0, unit: '坪', category: '工班', subCategory: '木工' },
        { id: 'ITEM-003', name: '輕隔間樓層搬運費', price: 5000, cost: 5000, friendPrice: 0, unit: '次', category: '工班', subCategory: '木工' },
        { id: 'ITEM-004', name: '輕鋼架', price: 1400, cost: 1000, friendPrice: 1200, unit: '坪', category: '工班', subCategory: '木工' },
        { id: 'ITEM-005', name: '輕鋼架隔音（60Ｋ延綿）', price: 650, cost: 550, friendPrice: 600, unit: '坪', category: '工班', subCategory: '木工' },
        { id: 'ITEM-006', name: '更換輕鋼架板子', price: 950, cost: 0, friendPrice: 0, unit: '片', category: '工班', subCategory: '木工' },
        
        // 地板類
        { id: 'ITEM-007', name: '入門款地板', price: 1400, cost: 1000, friendPrice: 1200, unit: '坪', category: '工班', subCategory: '地板' },
        { id: 'ITEM-008', name: '高階款地板', price: 1500, cost: 1100, friendPrice: 1300, unit: '坪', category: '工班', subCategory: '地板' },
        
        // 壁紙類
        { id: 'ITEM-009', name: '一般壁紙+補土（輕隔間雙面）', price: 900, cost: 600, friendPrice: 800, unit: '坪', category: '工班', subCategory: '壁紙' },
        { id: 'ITEM-010', name: '一般壁紙+補土（原牆面）', price: 900, cost: 600, friendPrice: 800, unit: '坪', category: '工班', subCategory: '壁紙' },
        
        // 系統設備
        { id: 'ITEM-011', name: '加盟費用', price: 300000, cost: 0, friendPrice: 283200, unit: '式', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-012', name: '智能門鎖', price: 7000, cost: 5500, friendPrice: 6500, unit: '組', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-013', name: 'ONE客製木門含探視孔', price: 8000, cost: 6500, friendPrice: 7500, unit: '組', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-014', name: '智能控電箱', price: 3000, cost: 2400, friendPrice: 2800, unit: '組', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-015', name: '藍芽喇叭', price: 2000, cost: 1600, friendPrice: 1800, unit: '組', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-016', name: '門牌燈', price: 800, cost: 600, friendPrice: 700, unit: '組', category: 'ONE桌遊', subCategory: '系統設備' },
        { id: 'ITEM-017', name: '桌遊Ｂ', price: 11800, cost: 9000, friendPrice: 11000, unit: '套', category: 'ONE桌遊', subCategory: '桌遊' },
        
        // 冷氣設備
        { id: 'ITEM-018', name: '冷氣2.3kw變頻冷暖', price: 22500, cost: 18000, friendPrice: 21000, unit: '台', category: '新系統', subCategory: '冷氣' },
        { id: 'ITEM-019', name: '冷氣2.9kw變頻冷暖', price: 24500, cost: 20000, friendPrice: 23000, unit: '台', category: '新系統', subCategory: '冷氣' },
        { id: 'ITEM-020', name: '冷氣3.6kw變頻冷暖', price: 28500, cost: 24000, friendPrice: 27000, unit: '台', category: '新系統', subCategory: '冷氣' },
        { id: 'ITEM-021', name: '冷氣4.1kw變頻冷暖', price: 31500, cost: 27000, friendPrice: 30000, unit: '台', category: '新系統', subCategory: '冷氣' },
        { id: 'ITEM-022', name: '冷氣5.0kw變頻冷暖', price: 36000, cost: 32000, friendPrice: 34500, unit: '台', category: '新系統', subCategory: '冷氣' },
        { id: 'ITEM-023', name: '排水器', price: 1800, cost: 1500, friendPrice: 1700, unit: '顆', category: '新系統', subCategory: '冷氣配件' },
        { id: 'ITEM-024', name: '銅管(5.0kw以下)', price: 400, cost: 300, friendPrice: 350, unit: '米', category: '新系統', subCategory: '冷氣配件' },
        { id: 'ITEM-025', name: '銅管(6.3kw以上)', price: 500, cost: 400, friendPrice: 450, unit: '米', category: '新系統', subCategory: '冷氣配件' },
        
        // 其他設備
        { id: 'ITEM-026', name: '循環扇', price: 1200, cost: 900, friendPrice: 1100, unit: '台', category: '新系統', subCategory: '循環扇' },
        { id: 'ITEM-027', name: '室內監視器WIFI類型(含配電+安裝)', price: 8000, cost: 6000, friendPrice: 7500, unit: '台', category: '新系統', subCategory: '監視器' },
        { id: 'ITEM-028', name: '室外監視器WIFI類型(含配電+安裝)', price: 10000, cost: 8000, friendPrice: 9500, unit: '台', category: '新系統', subCategory: '監視器' },
        { id: 'ITEM-029', name: '麻將桌', price: 45000, cost: 38000, friendPrice: 43000, unit: '台', category: '新系統', subCategory: '麻將桌' },
        { id: 'ITEM-030', name: '緊急出口燈+方向燈', price: 1500, cost: 1200, friendPrice: 1400, unit: '組', category: '新系統', subCategory: '消防' },
        { id: 'ITEM-031', name: '雙面指示燈', price: 800, cost: 600, friendPrice: 750, unit: '個', category: '新系統', subCategory: '消防' },
        { id: 'ITEM-032', name: '緊急照明', price: 1200, cost: 900, friendPrice: 1100, unit: '組', category: '新系統', subCategory: '消防' },
        { id: 'ITEM-033', name: '滅火器', price: 600, cost: 450, friendPrice: 550, unit: '支', category: '新系統', subCategory: '消防' },
        { id: 'ITEM-034', name: '煙霧偵測', price: 800, cost: 600, friendPrice: 750, unit: '個', category: '新系統', subCategory: '消防' },
        { id: 'ITEM-035', name: '麻將桌備品', price: 5000, cost: 4000, friendPrice: 4500, unit: '套', category: '新系統', subCategory: '麻將桌' }
    ];

    // 使用者數據
    const users = [
        { id: 'U001', name: '阿建', role: 'admin', password: 'admin123', avatar: '👨‍💼' },
        { id: 'U002', name: '建佑', role: 'admin', password: 'admin123', avatar: '👨‍💼' },
        { id: 'U003', name: '小圓', role: 'staff', password: 'staff123', avatar: '👩‍💻' },
        { id: 'U004', name: '尼克', role: 'staff', password: 'staff123', avatar: '👨‍💻' },
        { id: 'U005', name: '會計', role: 'viewer', password: 'view123', avatar: '👩‍💼' }
    ];

    // 範例專案（高雄左營）
    const projects = [
        {
            id: 'P-2024001',
            storeName: '高雄左營',
            address: '高雄市左營區至真路230號2F',
            contact: '王小明',
            phone: '0912-345-678',
            lineId: '@kaohsiung_left',
            rooms: 13,
            area: 65,
            status: 'construction', // draft/quoted/signed/construction/completed/paid
            assignee: 'U001', // 阿建
            createdDate: '2026-03-01',
            quoteDate: '2026-03-01',
            signDate: '2026-03-05',
            startDate: '2026-03-08',
            expectedEndDate: '2026-03-20',
            completedDate: null,
            totalAmount: 856800,
            paidAmount: 300000,
            
            // 報價版本
            quoteVersions: [
                {
                    version: 'v1',
                    date: '2026-03-01',
                    totalAmount: 856800,
                    operator: 'U001',
                    reason: '初次報價',
                    note: '標準配置',
                    items: [
                        { itemId: 'ITEM-011', name: '加盟費用', quantity: 1, price: 283200, total: 283200, note: '老客戶優惠' },
                        { itemId: 'ITEM-012', name: '智能門鎖', quantity: 13, price: 7000, total: 91000, note: '贈送10組' },
                        { itemId: 'ITEM-013', name: 'ONE客製木門含探視孔', quantity: 13, price: 8000, total: 104000, note: '贈送10組' },
                        { itemId: 'ITEM-014', name: '智能控電箱', quantity: 8, price: 3000, total: 24000, note: '贈送10組，多8組' },
                        { itemId: 'ITEM-015', name: '藍芽喇叭', quantity: 8, price: 2000, total: 16000, note: '贈送10組，多8組' },
                        { itemId: 'ITEM-016', name: '門牌燈', quantity: 8, price: 800, total: 6400, note: '贈送10組，多8組' },
                        { itemId: 'ITEM-017', name: '桌遊Ｂ', quantity: 1, price: 11800, total: 11800, note: '' },
                        { itemId: 'ITEM-020', name: '冷氣3.6kw變頻冷暖', quantity: 10, price: 28500, total: 285000, note: '政府補助$20,000' },
                        { itemId: 'ITEM-022', name: '冷氣5.0kw變頻冷暖', quantity: 2, price: 36000, total: 72000, note: '政府補助$4,000' }
                    ]
                }
            ],
            
            // 收款記錄
            payments: [
                {
                    id: 'PAY-001',
                    date: '2026-03-05',
                    type: '訂金',
                    amount: 200000,
                    method: '銀行轉帳',
                    bankAccount: '012-****-1234',
                    receiver: 'U005',
                    invoice: 'INV-20260305-001',
                    note: '簽約訂金'
                },
                {
                    id: 'PAY-002',
                    date: '2026-03-07',
                    type: '開工款',
                    amount: 100000,
                    method: '現金',
                    receiver: 'U001',
                    invoice: 'INV-20260307-002',
                    note: '開工款'
                }
            ],
            
            // 施工進度
            progress: [
                { item: '輕隔間施工', progress: 100, status: 'completed', updateDate: '2026-03-12', operator: 'U001', note: '已完成' },
                { item: '地板鋪設', progress: 50, status: 'inProgress', updateDate: '2026-03-13', operator: 'U001', note: '預計明天完成' },
                { item: '壁紙施工', progress: 0, status: 'pending', updateDate: null, operator: null, note: '待開始' },
                { item: '冷氣安裝', progress: 0, status: 'pending', updateDate: null, operator: null, note: '待開始' },
                { item: '驗收', progress: 0, status: 'pending', updateDate: null, operator: null, note: '待開始' }
            ],
            
            // 狀態變更記錄
            statusLogs: [
                { date: '2026-03-01', status: '報價建立', operator: 'U001', note: '初次報價 $856,800' },
                { date: '2026-03-05', status: '簽約成功', operator: 'U001', note: '合約編號: C-2024001, 訂金收訖: $200,000' },
                { date: '2026-03-07', status: '第二期款', operator: 'U005', note: '開工款: $100,000, 累計收款: $300,000 (35%)' },
                { date: '2026-03-08', status: '開始施工', operator: 'U001', note: '工班進場，開始輕隔間施工' },
                { date: '2026-03-12', status: '施工進度更新', operator: 'U001', note: '輕隔間完成 100%' },
                { date: '2026-03-13', status: '施工進度更新', operator: 'U001', note: '地板完成 50%, 整體進度: 75%' }
            ]
        }
    ];

    // 儲存到 localStorage
    localStorage.setItem('priceTable', JSON.stringify(priceTable));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('quoteSystemInitialized', 'true');
    localStorage.setItem('nextProjectId', '2');
    localStorage.setItem('nextPaymentId', '3');

    console.log('✅ 數據初始化完成');
}

// 頁面載入時初始化
if (typeof window !== 'undefined') {
    initializeData();
}

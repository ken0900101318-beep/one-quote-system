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
        
        // 公司設備
        { id: 'ITEM-011', name: '加盟費用', price: 300000, cost: 0, friendPrice: 283200, unit: '式', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-012', name: '智能門鎖', price: 7000, cost: 5500, friendPrice: 6500, unit: '組', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-013', name: 'ONE客製木門含探視孔', price: 8000, cost: 6500, friendPrice: 7500, unit: '組', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-014', name: '智能控電箱', price: 3000, cost: 2400, friendPrice: 2800, unit: '組', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-015', name: '藍芽喇叭', price: 2000, cost: 1600, friendPrice: 1800, unit: '組', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-016', name: '門牌燈', price: 800, cost: 600, friendPrice: 700, unit: '組', category: '公司', subCategory: '系統設備' },
        { id: 'ITEM-017', name: '桌遊Ｂ', price: 11800, cost: 9000, friendPrice: 11000, unit: '套', category: '公司', subCategory: '桌遊' },
        
        // 冷氣設備（工班）
        { id: 'ITEM-018', name: '冷氣2.3kw變頻冷暖', price: 22500, cost: 18000, friendPrice: 21000, unit: '台', category: '工班', subCategory: '冷氣' },
        { id: 'ITEM-019', name: '冷氣2.9kw變頻冷暖', price: 24500, cost: 20000, friendPrice: 23000, unit: '台', category: '工班', subCategory: '冷氣' },
        { id: 'ITEM-020', name: '冷氣3.6kw變頻冷暖', price: 28500, cost: 24000, friendPrice: 27000, unit: '台', category: '工班', subCategory: '冷氣' },
        { id: 'ITEM-021', name: '冷氣4.1kw變頻冷暖', price: 31500, cost: 27000, friendPrice: 30000, unit: '台', category: '工班', subCategory: '冷氣' },
        { id: 'ITEM-022', name: '冷氣5.0kw變頻冷暖', price: 36000, cost: 32000, friendPrice: 34500, unit: '台', category: '工班', subCategory: '冷氣' },
        { id: 'ITEM-023', name: '排水器', price: 1800, cost: 1500, friendPrice: 1700, unit: '顆', category: '工班', subCategory: '冷氣配件' },
        { id: 'ITEM-024', name: '銅管(5.0kw以下)', price: 400, cost: 300, friendPrice: 350, unit: '米', category: '工班', subCategory: '冷氣配件' },
        { id: 'ITEM-025', name: '銅管(6.3kw以上)', price: 500, cost: 400, friendPrice: 450, unit: '米', category: '工班', subCategory: '冷氣配件' },
        
        // 其他設備（公司）
        { id: 'ITEM-026', name: '循環扇', price: 1200, cost: 900, friendPrice: 1100, unit: '台', category: '公司', subCategory: '循環扇' },
        { id: 'ITEM-027', name: '室內監視器WIFI類型(含配電+安裝)', price: 8000, cost: 6000, friendPrice: 7500, unit: '台', category: '公司', subCategory: '監視器' },
        { id: 'ITEM-028', name: '室外監視器WIFI類型(含配電+安裝)', price: 10000, cost: 8000, friendPrice: 9500, unit: '台', category: '公司', subCategory: '監視器' },
        { id: 'ITEM-029', name: '麻將桌', price: 45000, cost: 38000, friendPrice: 43000, unit: '台', category: '公司', subCategory: '麻將桌' },
        { id: 'ITEM-030', name: '緊急出口燈+方向燈', price: 1500, cost: 1200, friendPrice: 1400, unit: '組', category: '公司', subCategory: '消防' },
        { id: 'ITEM-031', name: '雙面指示燈', price: 800, cost: 600, friendPrice: 750, unit: '個', category: '公司', subCategory: '消防' },
        { id: 'ITEM-032', name: '緊急照明', price: 1200, cost: 900, friendPrice: 1100, unit: '組', category: '公司', subCategory: '消防' },
        { id: 'ITEM-033', name: '滅火器', price: 600, cost: 450, friendPrice: 550, unit: '支', category: '公司', subCategory: '消防' },
        { id: 'ITEM-034', name: '煙霧偵測', price: 800, cost: 600, friendPrice: 750, unit: '個', category: '公司', subCategory: '消防' },
        { id: 'ITEM-035', name: '麻將桌備品', price: 5000, cost: 4000, friendPrice: 4500, unit: '套', category: '公司', subCategory: '麻將桌' }
    ];

    // 使用者數據
    const users = [
        { id: 'U001', name: '阿建', role: 'admin', password: 'admin123', avatar: '👨‍💼' },
        { id: 'U002', name: '建佑', role: 'admin', password: 'admin123', avatar: '👨‍💼' },
        { id: 'U003', name: '小圓', role: 'staff', password: 'staff123', avatar: '👩‍💻' },
        { id: 'U004', name: '尼克', role: 'staff', password: 'staff123', avatar: '👨‍💻' },
        { id: 'U005', name: '會計', role: 'viewer', password: 'view123', avatar: '👩‍💼' }
    ];

    // 專案數據（從 Excel 同步，共 8 個）
    // 1-6: 已完工 ✅ | 7-8: 施工中 🔨
    const projects = [
        // 專案 1: 威勝桌遊 (已完工) ✅
        {
            id: 'P-2025001',
            storeName: '威勝桌遊',
            address: '高雄市左營區至真路230號2F',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 13,
            openSeats: 0,
            area: 65,
            status: 'paid',
            assignee: 'U001',
            createdDate: '2025-10-01',
            quoteDate: '2025-10-09',
            signDate: '2025-10-12',
            startDate: '2025-10-15',
            expectedEndDate: '2025-11-05',
            completedDate: '2025-11-02',
            totalAmount: 3073080,
            paidAmount: 3073080,
            quoteVersions: [{
                version: 'v1',
                date: '2025-10-09',
                totalAmount: 3073080,
                operator: 'U001',
                reason: '初次報價',
                note: '13間包廂',
                items: []
            }],
            payments: [
                { id: 'PAY-001', date: '2025-10-12', type: '訂金', amount: 900000, method: '銀行轉帳', receiver: 'U001', note: '' },
                { id: 'PAY-002', date: '2025-10-20', type: '開工款', amount: 1000000, method: '銀行轉帳', receiver: 'U001', note: '' },
                { id: 'PAY-003', date: '2025-11-02', type: '尾款', amount: 1173080, method: '銀行轉帳', receiver: 'U001', note: '' }
            ],
            progress: [],
            statusLogs: [
                { date: '2025-10-09', status: '報價建立', operator: 'U001', note: '初次報價 $3,073,080' },
                { date: '2025-11-02', status: '結清', operator: 'U001', note: '專案結案' }
            ]
        },
        // 專案 2: 方城 (已完工) ✅
        {
            id: 'P-2025002',
            storeName: '方城',
            address: '台南市永康中正路151之1號2F',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 9,
            openSeats: 0,
            area: 50,
            status: 'paid',
            assignee: 'U002',
            createdDate: '2025-10-20',
            quoteDate: '2025-10-29',
            signDate: '2025-11-01',
            startDate: '2025-11-05',
            expectedEndDate: '2025-11-25',
            completedDate: '2025-11-23',
            totalAmount: 1861300,
            paidAmount: 1861300,
            quoteVersions: [{ version: 'v1', date: '2025-10-29', totalAmount: 1861300, operator: 'U002', reason: '初次報價', note: '9間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2025-11-01', type: '訂金', amount: 600000, method: '銀行轉帳', receiver: 'U002', note: '' },
                { id: 'PAY-002', date: '2025-11-10', type: '開工款', amount: 700000, method: '銀行轉帳', receiver: 'U002', note: '' },
                { id: 'PAY-003', date: '2025-11-23', type: '尾款', amount: 561300, method: '銀行轉帳', receiver: 'U002', note: '' }
            ],
            progress: [],
            statusLogs: [
                { date: '2025-10-29', status: '報價建立', operator: 'U002', note: '初次報價 $1,861,300' },
                { date: '2025-11-23', status: '結清', operator: 'U002', note: '專案結案' }
            ]
        },
        // 專案 3: 揪咖 (已完工) ✅
        {
            id: 'P-2025003',
            storeName: '揪咖',
            address: '新北市永和區中山路一段162號',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 7,
            openSeats: 0,
            area: 40,
            status: 'paid',
            assignee: 'U001',
            createdDate: '2025-11-05',
            quoteDate: '2025-11-12',
            signDate: '2025-11-15',
            startDate: '2025-11-18',
            expectedEndDate: '2025-12-08',
            completedDate: '2025-12-06',
            totalAmount: 2036840,
            paidAmount: 2036840,
            quoteVersions: [{ version: 'v1', date: '2025-11-12', totalAmount: 2036840, operator: 'U001', reason: '初次報價', note: '7間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2025-11-15', type: '訂金', amount: 700000, method: '銀行轉帳', receiver: 'U001', note: '' },
                { id: 'PAY-002', date: '2025-11-20', type: '開工款', amount: 700000, method: '銀行轉帳', receiver: 'U001', note: '' },
                { id: 'PAY-003', date: '2025-12-06', type: '尾款', amount: 636840, method: '銀行轉帳', receiver: 'U001', note: '' }
            ],
            progress: [],
            statusLogs: [
                { date: '2025-11-12', status: '報價建立', operator: 'U001', note: '初次報價 $2,036,840' },
                { date: '2025-12-06', status: '結清', operator: 'U001', note: '專案結案' }
            ]
        },
        // 專案 4: 台北中山(復興北路) (已完工，待收尾款) ✅
        {
            id: 'P-2025004',
            storeName: '台北中山(復興北路)',
            address: '台北市中山區復興北路488巷2弄3號',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 6,
            openSeats: 0,
            area: 35,
            status: 'completed',
            assignee: 'U002',
            createdDate: '2025-11-10',
            quoteDate: '2025-11-17',
            signDate: '2025-11-20',
            startDate: '2025-11-23',
            expectedEndDate: '2025-12-13',
            completedDate: '2025-12-11',
            totalAmount: 1005700,
            paidAmount: 700000,
            quoteVersions: [{ version: 'v1', date: '2025-11-17', totalAmount: 1005700, operator: 'U002', reason: '初次報價', note: '6間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2025-11-20', type: '訂金', amount: 300000, method: '銀行轉帳', receiver: 'U002', note: '' },
                { id: 'PAY-002', date: '2025-11-25', type: '開工款', amount: 400000, method: '銀行轉帳', receiver: 'U002', note: '' }
            ],
            progress: [],
            statusLogs: [
                { date: '2025-11-17', status: '報價建立', operator: 'U002', note: '初次報價 $1,005,700' },
                { date: '2025-12-11', status: '完工', operator: 'U002', note: '待收尾款 $305,700' }
            ]
        },
        // 專案 5: 台北中山(林森北路) (已報價，未開工) 📝
        {
            id: 'P-2025005',
            storeName: '台北中山(林森北路)',
            address: '台北市中山區林森北路416巷3號',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 11,
            openSeats: 0,
            area: 60,
            status: 'quoted',
            assignee: 'U001',
            createdDate: '2025-11-12',
            quoteDate: '2025-11-20',
            signDate: null,
            startDate: null,
            expectedEndDate: null,
            completedDate: null,
            totalAmount: 3086100,
            paidAmount: 100000,
            quoteVersions: [{ version: 'v1', date: '2025-11-20', totalAmount: 3086100, operator: 'U001', reason: '初次報價', note: '11間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2025-11-23', type: '訂金', amount: 100000, method: '銀行轉帳', receiver: 'U001', note: '僅收訂金，未簽約開工' }
            ],
            progress: [],
            statusLogs: [
                { date: '2025-11-20', status: '報價建立', operator: 'U001', note: '初次報價 $3,086,100' },
                { date: '2025-11-23', status: '收訂金', operator: 'U001', note: '收訂金 $100,000，客戶考慮中' }
            ]
        },
        // 專案 6: 士林劍潭店 (已完工) ✅
        {
            id: 'P-2026001',
            storeName: '士林劍潭店',
            address: '台北市士林區通河街163號',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 4,
            openSeats: 0,
            area: 30,
            status: 'paid',
            assignee: 'U002',
            createdDate: '2026-01-08',
            quoteDate: '2026-01-16',
            signDate: '2026-01-19',
            startDate: '2026-01-22',
            expectedEndDate: '2026-02-11',
            completedDate: '2026-02-08',
            totalAmount: 1366510,
            paidAmount: 1366510,
            quoteVersions: [{ version: 'v1', date: '2026-01-16', totalAmount: 1366510, operator: 'U002', reason: '初次報價', note: '4間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2026-01-19', type: '訂金', amount: 500000, method: '銀行轉帳', receiver: 'U002', note: '' },
                { id: 'PAY-002', date: '2026-01-24', type: '開工款', amount: 500000, method: '銀行轉帳', receiver: 'U002', note: '' },
                { id: 'PAY-003', date: '2026-02-08', type: '尾款', amount: 366510, method: '銀行轉帳', receiver: 'U002', note: '' }
            ],
            progress: [],
            statusLogs: [
                { date: '2026-01-16', status: '報價建立', operator: 'U002', note: '初次報價 $1,366,510' },
                { date: '2026-02-08', status: '結清', operator: 'U002', note: '專案結案' }
            ]
        },
        // 專案 7: 台中民權店 (施工中) 🔨
        {
            id: 'P-2026002',
            storeName: '台中民權店',
            address: '台中市西區民權路153號',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 9,
            openSeats: 0,
            area: 50,
            status: 'construction',
            assignee: 'U001',
            createdDate: '2026-01-12',
            quoteDate: '2026-01-19',
            signDate: '2026-01-22',
            startDate: '2026-01-25',
            expectedEndDate: '2026-02-20',
            completedDate: null,
            totalAmount: 1924100,
            paidAmount: 1200000,
            quoteVersions: [{ version: 'v1', date: '2026-01-19', totalAmount: 1924100, operator: 'U001', reason: '初次報價', note: '9間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2026-01-22', type: '訂金', amount: 600000, method: '銀行轉帳', receiver: 'U001', note: '' },
                { id: 'PAY-002', date: '2026-01-27', type: '開工款', amount: 600000, method: '銀行轉帳', receiver: 'U001', note: '' }
            ],
            progress: [
                { item: '輕隔間施工', progress: 80, status: 'inProgress', updateDate: '2026-02-10', operator: 'U001', note: '' },
                { item: '地板鋪設', progress: 50, status: 'inProgress', updateDate: '2026-02-10', operator: 'U001', note: '' },
                { item: '壁紙施工', progress: 30, status: 'inProgress', updateDate: '2026-02-10', operator: 'U001', note: '' },
                { item: '冷氣安裝', progress: 0, status: 'pending', updateDate: '2026-02-10', operator: 'U001', note: '' },
                { item: '驗收', progress: 0, status: 'pending', updateDate: '2026-02-10', operator: 'U001', note: '' }
            ],
            statusLogs: [
                { date: '2026-01-19', status: '報價建立', operator: 'U001', note: '初次報價 $1,924,100' },
                { date: '2026-01-25', status: '施工中', operator: 'U001', note: '施工開始' }
            ]
        },
        // 專案 8: 文山興隆店 (施工中) 🔨
        {
            id: 'P-2026003',
            storeName: '文山興隆店',
            address: '台北市文山區興隆路三段55號2樓',
            contact: '-',
            phone: '-',
            lineId: '',
            rooms: 6,
            openSeats: 0,
            area: 38,
            status: 'construction',
            assignee: 'U002',
            createdDate: '2026-02-28',
            quoteDate: '2026-03-04',
            signDate: '2026-03-07',
            startDate: '2026-03-10',
            expectedEndDate: '2026-03-30',
            completedDate: null,
            totalAmount: 1471100,
            paidAmount: 500000,
            quoteVersions: [{ version: 'v1', date: '2026-03-04', totalAmount: 1471100, operator: 'U002', reason: '初次報價', note: '6間包廂', items: [] }],
            payments: [
                { id: 'PAY-001', date: '2026-03-07', type: '訂金', amount: 500000, method: '銀行轉帳', receiver: 'U002', note: '' }
            ],
            progress: [
                { item: '輕隔間施工', progress: 40, status: 'inProgress', updateDate: '2026-03-13', operator: 'U002', note: '' },
                { item: '地板鋪設', progress: 0, status: 'pending', updateDate: '2026-03-13', operator: 'U002', note: '' },
                { item: '壁紙施工', progress: 0, status: 'pending', updateDate: '2026-03-13', operator: 'U002', note: '' },
                { item: '冷氣安裝', progress: 0, status: 'pending', updateDate: '2026-03-13', operator: 'U002', note: '' },
                { item: '驗收', progress: 0, status: 'pending', updateDate: '2026-03-13', operator: 'U002', note: '' }
            ],
            statusLogs: [
                { date: '2026-03-04', status: '報價建立', operator: 'U002', note: '初次報價 $1,471,100' },
                { date: '2026-03-10', status: '施工中', operator: 'U002', note: '施工開始' }
            ]
        }
        ];

    // 儲存到 localStorage
    localStorage.setItem('priceTable', JSON.stringify(priceTable));
    localStorage.setItem('users', JSON.stringify(users));
    localStorage.setItem('projects', JSON.stringify(projects));
    localStorage.setItem('quoteSystemInitialized', 'true');
    localStorage.setItem('nextProjectId', '4');
    localStorage.setItem('nextPaymentId', '3');

    console.log('✅ 數據初始化完成');
}

// 頁面載入時初始化
if (typeof window !== 'undefined') {
    initializeData();
}

/**
 * ONE桌遊報價系統 - API 工具
 * 版本：1.1.0
 * 日期：2026-03-19
 * 改進：統一錯誤處理、網路超時處理、重試機制
 */

const QuoteAPI = {
    /**
     * 發送請求（改進版）
     */
    async request(action, params = {}, options = {}) {
        const {
            timeout = 30000,  // 30 秒超時
            retries = 1,      // 失敗時重試 1 次
            method = 'GET'
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const queryParams = new URLSearchParams({
                    action: action,
                    _t: Date.now(),
                    ...params
                });
                
                const url = `${QUOTE_API.endpoint}?${queryParams.toString()}`;
                console.log(`API 請求 (嘗試 ${attempt + 1}/${retries + 1}):`, action, params);
                
                // 加入超時控制
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(url, {
                    method,
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                // 檢查 HTTP 狀態碼
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                // 解析 JSON（加入錯誤處理）
                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    console.error('JSON 解析失敗:', parseError);
                    throw new Error('伺服器回應格式錯誤');
                }
                
                console.log('API 回應:', result);
                
                // 檢查業務邏輯錯誤
                if (result.success === false && result.error) {
                    // 不需要重試的錯誤
                    if (result.error.includes('找不到') || 
                        result.error.includes('驗證失敗') ||
                        result.error.includes('權限不足')) {
                        return result;
                    }
                    
                    // 可能需要重試的錯誤
                    throw new Error(result.error);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                // 網路超時
                if (error.name === 'AbortError') {
                    console.error('請求超時:', action);
                    lastError = new Error('連線超時，請檢查網路狀態');
                }
                
                // 網路斷線
                if (error.message.includes('Failed to fetch')) {
                    console.error('網路錯誤:', action);
                    lastError = new Error('無法連線到伺服器，請檢查網路狀態');
                }
                
                // 如果還有重試次數，等待後重試
                if (attempt < retries) {
                    console.log(`等待 ${(attempt + 1) * 1000}ms 後重試...`);
                    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
                    continue;
                }
                
                // 已達最大重試次數
                console.error('API 錯誤（已達最大重試次數）:', lastError);
                break;
            }
        }
        
        // 回傳統一錯誤格式
        return {
            success: false,
            error: lastError.message || '未知錯誤',
            details: lastError
        };
    },
    
    // 讀取所有專案
    async getProjects() {
        return await this.request('getProjects');
    },
    
    // 讀取單一專案
    async getProject(id) {
        if (!id) {
            return { success: false, error: '缺少專案 ID' };
        }
        return await this.request('getProject', { id });
    },
    
    /**
     * 發送 POST 請求（新增）
     */
    async requestPost(action, data, options = {}) {
        const {
            timeout = 30000,
            retries = 1
        } = options;
        
        let lastError;
        
        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                console.log(`API POST 請求 (嘗試 ${attempt + 1}/${retries + 1}):`, action, data);
                
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);
                
                const response = await fetch(QUOTE_API.endpoint, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        action: action,
                        ...data
                    }),
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    throw new Error('伺服器回應格式錯誤');
                }
                
                console.log('API 回應:', result);
                
                if (result.success === false && result.error) {
                    if (result.error.includes('找不到') || 
                        result.error.includes('驗證失敗') ||
                        result.error.includes('權限不足')) {
                        return result;
                    }
                    throw new Error(result.error);
                }
                
                return result;
                
            } catch (error) {
                lastError = error;
                
                if (error.name === 'AbortError') {
                    lastError = new Error('連線超時，請檢查網路狀態');
                }
                
                if (error.message.includes('Failed to fetch')) {
                    lastError = new Error('無法連線到伺服器，請檢查網路狀態');
                }
                
                if (attempt < retries) {
                    console.log(`等待 ${(attempt + 1) * 1000}ms 後重試...`);
                    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
                    continue;
                }
                
                break;
            }
        }
        
        return {
            success: false,
            error: lastError.message || '未知錯誤',
            details: lastError
        };
    },
    
    // 新增專案（改用 POST）
    async addProject(data) {
        if (!data) {
            return { success: false, error: '缺少專案資料' };
        }
        
        if (!data.customerName || !data.phone) {
            return { success: false, error: '缺少客戶姓名或電話' };
        }
        
        return await this.requestPost('addProject', { 
            project: data 
        }, { timeout: 60000 });
    },
    
    // 更新專案（改用 POST）
    async updateProject(id, data) {
        if (!id || !data) {
            return { success: false, error: '缺少專案 ID 或資料' };
        }
        
        return await this.requestPost('updateProject', { 
            id: id,
            project: data 
        }, { timeout: 60000 });
    },
    
    // 刪除專案
    async deleteProject(id) {
        if (!id) {
            return { success: false, error: '缺少專案 ID' };
        }
        
        return await this.request('deleteProject', { id });
    },
    
    // 讀取價目表
    async getPriceTable() {
        return await this.request('getPriceTable');
    },
    
    // 讀取分類
    async getCategories() {
        return await this.request('getCategories');
    },
    
    // 讀取員工
    async getUsers() {
        return await this.request('getUsers');
    },
    
    // 新增價目項目
    async addPriceItem(item) {
        if (!item || !item.name) {
            return { success: false, error: '缺少項目名稱' };
        }
        
        return await this.requestPost('addPriceItem', { item });
    },
    
    // 更新價目項目
    async updatePriceItem(id, item) {
        if (!id || !item) {
            return { success: false, error: '缺少項目 ID 或資料' };
        }
        
        return await this.requestPost('updatePriceItem', { id, item });
    },
    
    // 刪除價目項目
    async deletePriceItem(id) {
        if (!id) {
            return { success: false, error: '缺少項目 ID' };
        }
        
        return await this.requestPost('deletePriceItem', { id });
    },
    
    // 新增分類
    async addCategory(category) {
        if (!category || !category.name) {
            return { success: false, error: '缺少分類名稱' };
        }
        
        return await this.requestPost('addCategory', { category });
    },
    
    // 更新分類
    async updateCategory(id, category) {
        if (!id || !category) {
            return { success: false, error: '缺少分類 ID 或資料' };
        }
        
        return await this.requestPost('updateCategory', { id, category });
    },
    
    // 刪除分類
    async deleteCategory(id) {
        if (!id) {
            return { success: false, error: '缺少分類 ID' };
        }
        
        return await this.requestPost('deleteCategory', { id });
    }
};

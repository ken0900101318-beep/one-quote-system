/**
 * ONE桌遊報價系統 - API 工具
 */

const QuoteAPI = {
    /**
     * 發送請求
     */
    async request(action, params = {}) {
        try {
            const queryParams = new URLSearchParams({
                action: action,
                _t: Date.now(),
                ...params
            });
            
            const url = `${QUOTE_API.endpoint}?${queryParams.toString()}`;
            console.log('API 請求:', action, params);
            
            const response = await fetch(url);
            const result = await response.json();
            
            console.log('API 回應:', result);
            return result;
        } catch (error) {
            console.error('API 錯誤:', error);
            throw error;
        }
    },
    
    // 讀取所有專案
    async getProjects() {
        return await this.request('getProjects');
    },
    
    // 讀取單一專案
    async getProject(id) {
        return await this.request('getProject', { id });
    },
    
    // 新增專案
    async addProject(data) {
        return await this.request('addProject', { 
            data: JSON.stringify(data) 
        });
    },
    
    // 更新專案
    async updateProject(id, data) {
        return await this.request('updateProject', { 
            id, 
            data: JSON.stringify(data) 
        });
    },
    
    // 刪除專案
    async deleteProject(id) {
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
    }
};

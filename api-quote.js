/**
 * ONE桌遊報價系統 - API 工具
 * 版本：1.2.0
 * 日期：2026-03-20
 * 改進：統一錯誤處理、網路超時處理、重試機制、收款記錄 API
 */

const QuoteAPI = {
    async request(action, params = {}, options = {}) {
        const {
            timeout = 30000,
            retries = 1,
            method = 'GET'
        } = options;

        let lastError;

        for (let attempt = 0; attempt <= retries; attempt++) {
            try {
                const queryParams = new URLSearchParams({
                    action,
                    _t: Date.now(),
                    ...params
                });

                const url = `${QUOTE_API.endpoint}?${queryParams.toString()}`;
                console.log(`API 請求 (嘗試 ${attempt + 1}/${retries + 1}):`, action, params);

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(url, { method, signal: controller.signal });
                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                let result;
                try {
                    result = await response.json();
                } catch (parseError) {
                    console.error('JSON 解析失敗:', parseError);
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

                if ((error.message || '').includes('Failed to fetch')) {
                    lastError = new Error('無法連線到伺服器，請檢查網路狀態');
                }

                if (attempt < retries) {
                    console.log(`等待 ${(attempt + 1) * 1000}ms 後重試...`);
                    await new Promise(resolve => setTimeout(resolve, (attempt + 1) * 1000));
                    continue;
                }

                console.error('API 錯誤（已達最大重試次數）:', lastError);
                break;
            }
        }

        return {
            success: false,
            error: lastError.message || '未知錯誤',
            details: lastError
        };
    },

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
                    body: JSON.stringify({ action, ...data }),
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

                if ((error.message || '').includes('Failed to fetch')) {
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

    async getProjects() {
        return await this.request('getProjects');
    },

    async getProject(id) {
        if (!id) {
            return { success: false, error: '缺少專案 ID' };
        }
        return await this.request('getProject', { id });
    },

    async addProject(data) {
        if (!data) {
            return { success: false, error: '缺少專案資料' };
        }
        if (!data.customerName || !data.phone) {
            return { success: false, error: '缺少客戶姓名或電話' };
        }
        return await this.requestPost('addProject', { project: data }, { timeout: 60000 });
    },

    async updateProject(id, data) {
        if (!id || !data) {
            return { success: false, error: '缺少專案 ID 或資料' };
        }
        return await this.requestPost('updateProject', { id, project: data }, { timeout: 60000 });
    },

    async deleteProject(id) {
        if (!id) {
            return { success: false, error: '缺少專案 ID' };
        }
        return await this.request('deleteProject', { id });
    },

    async getPriceTable() {
        return await this.request('getPriceTable');
    },

    async getPriceListCategories() {
        return await this.request('getPriceListCategories');
    },

    async initializeSheets() {
        return await this.requestPost('initializeSheets', {});
    },

    async seedPriceList(options = {}) {
        return await this.requestPost('seedPriceList', { options }, { timeout: 60000 });
    },

    async getCategories() {
        return await this.request('getCategories');
    },

    async getUsers() {
        return await this.request('getUsers');
    },

    async addPriceItem(item) {
        if (!item || !item.name) {
            return { success: false, error: '缺少項目名稱' };
        }
        return await this.requestPost('addPriceItem', { item });
    },

    async updatePriceItem(id, item) {
        if (!id || !item) {
            return { success: false, error: '缺少項目 ID 或資料' };
        }
        return await this.requestPost('updatePriceItem', { id, item });
    },

    async deletePriceItem(id) {
        if (!id) {
            return { success: false, error: '缺少項目 ID' };
        }
        return await this.requestPost('deletePriceItem', { id });
    },

    async addCategory(category) {
        if (!category || !category.name) {
            return { success: false, error: '缺少分類名稱' };
        }
        return await this.requestPost('addCategory', { category });
    },

    async updateCategory(id, category) {
        if (!id || !category) {
            return { success: false, error: '缺少分類 ID 或資料' };
        }
        return await this.requestPost('updateCategory', { id, category });
    },

    async deleteCategory(id) {
        if (!id) {
            return { success: false, error: '缺少分類 ID' };
        }
        return await this.requestPost('deleteCategory', { id });
    },

    async getProjectPayments(projectId) {
        if (!projectId) {
            return { success: false, error: '缺少專案 ID' };
        }
        return await this.request('getProjectPayments', { projectId });
    },

    async addPayment(payment) {
        if (!payment || !payment.projectId) {
            return { success: false, error: '缺少收款資料或專案 ID' };
        }
        return await this.requestPost('addPayment', { payment }, { timeout: 60000 });
    },

    async updatePayment(id, payment) {
        if (!id || !payment) {
            return { success: false, error: '缺少收款記錄 ID 或資料' };
        }
        return await this.requestPost('updatePayment', { id, payment }, { timeout: 60000 });
    },

    async deletePayment(id) {
        if (!id) {
            return { success: false, error: '缺少收款記錄 ID' };
        }
        return await this.requestPost('deletePayment', { id }, { timeout: 60000 });
    },

    async getContractors(filters = {}) {
        return await this.request('getContractors', filters, { timeout: 60000 });
    },

    async getContractor(id) {
        if (!id) {
            return { success: false, error: '缺少工程行 ID' };
        }
        return await this.request('getContractor', { id }, { timeout: 60000 });
    },

    async addContractor(contractor) {
        if (!contractor || !contractor.companyName) {
            return { success: false, error: '缺少工程行資料' };
        }
        return await this.requestPost('addContractor', { contractor }, { timeout: 60000 });
    },

    async updateContractor(id, contractor) {
        if (!id || !contractor) {
            return { success: false, error: '缺少工程行 ID 或資料' };
        }
        return await this.requestPost('updateContractor', { id, contractor }, { timeout: 60000 });
    },

    async deleteContractor(id) {
        if (!id) {
            return { success: false, error: '缺少工程行 ID' };
        }
        return await this.requestPost('deleteContractor', { id }, { timeout: 60000 });
    },

    async getContractorProjects(id) {
        if (!id) {
            return { success: false, error: '缺少工程行 ID' };
        }
        return await this.request('getContractorProjects', { id }, { timeout: 60000 });
    },

    async seedContractors(options = {}) {
        return await this.request('seedContractors', options, { timeout: 60000 });
    },

    async getStatisticsOverview(filters = {}) {
        return await this.request('getStatisticsOverview', filters, { timeout: 60000 });
    },

    async getMonthlyStatistics(filters = {}) {
        return await this.request('getMonthlyStatistics', filters, { timeout: 60000 });
    },

    async getProjectStatusDistribution(filters = {}) {
        return await this.request('getProjectStatusDistribution', filters, { timeout: 60000 });
    },

    async getRevenueChart(filters = {}) {
        return await this.request('getRevenueChart', filters, { timeout: 60000 });
    },

    async getTopCustomers(filters = {}) {
        return await this.request('getTopCustomers', filters, { timeout: 60000 });
    },

    async getTopEmployees(filters = {}) {
        return await this.request('getTopEmployees', filters, { timeout: 60000 });
    }
};

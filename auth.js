/**
 * ONE桌遊報價系統 - 認證工具
 * 版本：1.0.0
 * 日期：2026-03-19
 */
const Auth = {
    // 取得當前使用者
    getCurrentUser() {
        return Utils.parseJSON('oneCurrentUser');
    },
    
    // 檢查登入狀態（必須登入）
    requireLogin() {
        const user = this.getCurrentUser();
        if (!user) {
            console.warn('未登入，轉跳至登入頁面');
            location.href = '../one-management-portal/index.html';
            return null;
        }
        return user;
    },
    
    // 檢查登入狀態（可選）
    checkLogin() {
        return this.getCurrentUser();
    },
    
    // 登出
    logout() {
        if (confirm('確定要登出嗎？')) {
            localStorage.removeItem('oneCurrentUser');
            localStorage.removeItem('currentUser');
            location.href = '../one-management-portal/index.html';
        }
    },
    
    // 更新使用者資料
    updateUser(userData) {
        const currentUser = this.getCurrentUser();
        if (!currentUser) return false;
        
        const updatedUser = { ...currentUser, ...userData };
        return Utils.saveJSON('oneCurrentUser', updatedUser);
    },
    
    // 檢查權限
    hasPermission(permission) {
        const user = this.getCurrentUser();
        if (!user) return false;
        
        // 管理員擁有所有權限
        if (user.role === 'admin') return true;
        
        // 檢查特定權限
        return user.permissions && user.permissions.includes(permission);
    }
};

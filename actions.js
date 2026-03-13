// ONE桌遊報價系統 - 操作功能模組

// ===== 記錄收款 =====
function openPaymentModal(projectId) {
    const modal = document.getElementById('paymentModal');
    if (!modal) return;
    
    document.getElementById('paymentProjectId').value = projectId;
    document.getElementById('paymentDate').value = new Date().toISOString().split('T')[0];
    modal.classList.add('show');
}

function closePaymentModal() {
    const form = document.getElementById('paymentForm');
    delete form.dataset.editIndex;
    form.reset();
    document.getElementById('paymentModal').classList.remove('show');
}

function savePayment() {
    const projectId = document.getElementById('paymentProjectId').value;
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    const form = document.getElementById('paymentForm');
    const editIndex = form.dataset.editIndex;
    const isEdit = editIndex !== undefined && editIndex !== '';
    
    const newPayment = {
        id: isEdit ? project.payments[editIndex].id : 'PAY-' + String((project.payments?.length || 0) + 1).padStart(3, '0'),
        date: document.getElementById('paymentDate').value,
        type: document.getElementById('paymentType').value,
        amount: parseFloat(document.getElementById('paymentAmount').value),
        method: document.getElementById('paymentMethod').value,
        bankAccount: document.getElementById('paymentBank').value || '',
        receiver: JSON.parse(localStorage.getItem('currentUser')).id,
        invoice: document.getElementById('paymentInvoice').value || '',
        note: document.getElementById('paymentNote').value || ''
    };
    
    if (!project.payments) project.payments = [];
    
    if (isEdit) {
        // 編輯模式：調整已收金額
        const oldAmount = project.payments[editIndex].amount;
        const amountDiff = newPayment.amount - oldAmount;
        
        project.payments[editIndex] = newPayment;
        project.paidAmount += amountDiff;
        
        // 添加時間軸記錄
        if (!project.statusLogs) project.statusLogs = [];
        project.statusLogs.push({
            date: new Date().toISOString().split('T')[0],
            status: '修改收款記錄',
            operator: newPayment.receiver,
            note: `${newPayment.type}：$${oldAmount.toLocaleString()} → $${newPayment.amount.toLocaleString()}，累計收款：$${project.paidAmount.toLocaleString()} (${Math.round(project.paidAmount/project.totalAmount*100)}%)`
        });
        
        alert('收款記錄已更新！');
    } else {
        // 新增模式
        project.payments.push(newPayment);
        project.paidAmount += newPayment.amount;
        
        // 添加時間軸記錄
        if (!project.statusLogs) project.statusLogs = [];
        project.statusLogs.push({
            date: newPayment.date,
            status: '收款記錄',
            operator: newPayment.receiver,
            note: `${newPayment.type}：$${newPayment.amount.toLocaleString()}，累計收款：$${project.paidAmount.toLocaleString()} (${Math.round(project.paidAmount/project.totalAmount*100)}%)`
        });
        
        alert('收款記錄成功！');
    }
    
    // 如果全額收款，更新狀態
    if (project.paidAmount >= project.totalAmount && project.status === 'completed') {
        project.status = 'paid';
    }
    
    // 如果已收款小於總額且狀態是已結清，改回已完工
    if (project.paidAmount < project.totalAmount && project.status === 'paid') {
        project.status = 'completed';
    }
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    // 清除編輯索引
    delete form.dataset.editIndex;
    
    closePaymentModal();
    location.reload();
}

// ===== 更新進度 =====
function openProgressModal(projectId) {
    const modal = document.getElementById('progressModal');
    if (!modal) return;
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    document.getElementById('progressProjectId').value = projectId;
    
    // 載入現有進度
    const progressList = document.getElementById('progressList');
    const progressItems = project.progress || [
        { item: '輕隔間施工', progress: 0 },
        { item: '地板鋪設', progress: 0 },
        { item: '壁紙施工', progress: 0 },
        { item: '冷氣安裝', progress: 0 },
        { item: '驗收', progress: 0 }
    ];
    
    progressList.innerHTML = progressItems.map((item, index) => `
        <div style="margin-bottom: 15px;">
            <label>${item.item}</label>
            <input type="range" min="0" max="100" value="${item.progress}" 
                   id="progress-${index}" 
                   oninput="document.getElementById('progress-value-${index}').textContent = this.value + '%'"
                   style="width: 100%;">
            <div style="text-align: center; font-weight: bold;" id="progress-value-${index}">${item.progress}%</div>
        </div>
    `).join('');
    
    modal.classList.add('show');
}

function closeProgressModal() {
    document.getElementById('progressModal').classList.remove('show');
}

function saveProgress() {
    const projectId = document.getElementById('progressProjectId').value;
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    const progressItems = [
        { item: '輕隔間施工', progress: 0 },
        { item: '地板鋪設', progress: 0 },
        { item: '壁紙施工', progress: 0 },
        { item: '冷氣安裝', progress: 0 },
        { item: '驗收', progress: 0 }
    ];
    
    project.progress = progressItems.map((item, index) => {
        const progressValue = parseInt(document.getElementById(`progress-${index}`).value);
        return {
            item: item.item,
            progress: progressValue,
            status: progressValue === 100 ? 'completed' : (progressValue > 0 ? 'inProgress' : 'pending'),
            updateDate: new Date().toISOString().split('T')[0],
            operator: JSON.parse(localStorage.getItem('currentUser')).id,
            note: ''
        };
    });
    
    // 計算整體進度
    const avgProgress = Math.round(project.progress.reduce((sum, p) => sum + p.progress, 0) / project.progress.length);
    
    // 添加時間軸記錄
    if (!project.statusLogs) project.statusLogs = [];
    project.statusLogs.push({
        date: new Date().toISOString().split('T')[0],
        status: '施工進度更新',
        operator: JSON.parse(localStorage.getItem('currentUser')).id,
        note: `整體進度：${avgProgress}%`
    });
    
    // 如果進度到達一定程度，更新狀態
    if (avgProgress >= 10 && project.status === 'signed') {
        project.status = 'construction';
    }
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    alert('進度更新成功！');
    closeProgressModal();
    location.reload();
}

// ===== 標記完工 =====
function markAsCompleted(projectId) {
    if (!confirm('確定要標記此專案為已完工嗎？')) return;
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project) return;
    
    project.status = 'completed';
    project.completedDate = new Date().toISOString().split('T')[0];
    
    if (!project.statusLogs) project.statusLogs = [];
    project.statusLogs.push({
        date: project.completedDate,
        status: '專案完工',
        operator: JSON.parse(localStorage.getItem('currentUser')).id,
        note: '驗收完成，等待收尾款'
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    alert('已標記為完工！');
    location.reload();
}

// ===== 匯出 PDF =====
function exportPDF(projectId) {
    // 使用瀏覽器打印功能
    window.print();
}

// ===== 修改報價 =====
function editQuote(projectId) {
    alert('報價修改功能開發中...\\n\\n將支援：\\n- 修改項目數量\\n- 調整單價\\n- 新增/刪除項目\\n- 版本控制(v2, v3...)');
    // TODO: 實作報價修改功能
}

// Modal 外部點擊關閉
document.addEventListener('DOMContentLoaded', function() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
});

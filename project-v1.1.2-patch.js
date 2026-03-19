// v1.1.2 補丁：修改報價和施工進度功能

// 修改報價項目數量/單價
function editQuoteItem(index) {
    const latestQuote = currentProject.quoteVersions[currentProject.quoteVersions.length - 1];
    const item = latestQuote.items[index];
    
    const newQuantity = prompt(`修改數量（目前：${item.quantity}）:`, item.quantity);
    if (newQuantity === null) return;
    
    const quantity = parseFloat(newQuantity);
    if (isNaN(quantity) || quantity <= 0) {
        alert('請輸入有效的數量！');
        return;
    }
    
    const newPrice = prompt(`修改單價（目前：$${item.price.toLocaleString()}）:`, item.price);
    if (newPrice === null) return;
    
    const price = parseFloat(newPrice);
    if (isNaN(price) || price < 0) {
        alert('請輸入有效的單價！');
        return;
    }
    
    // 更新項目
    const oldTotal = item.total;
    item.quantity = quantity;
    item.price = price;
    item.total = quantity * price;
    
    // 更新總額
    currentProject.totalAmount = currentProject.totalAmount - oldTotal + item.total;
    
    // 儲存
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
        projects[idx] = currentProject;
        localStorage.setItem('projects', JSON.stringify(projects));
    }
    
    loadProjectInfo();
    alert('✅ 已更新');
}

// 施工進度管理
function openProgressModal() {
    document.getElementById('progressModal').classList.add('show');
    
    const progressItems = currentProject.constructionProgress || [
        { item: '現場勘查', progress: 0 },
        { item: '水電配置', progress: 0 },
        { item: '裝潢施工', progress: 0 },
        { item: '設備安裝', progress: 0 },
        { item: '清潔驗收', progress: 0 }
    ];
    
    const html = progressItems.map((p, idx) => `
        <div style="margin-bottom: 20px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 10px;">
                <strong>${p.item}</strong>
                <span id="progress-value-${idx}">${p.progress}%</span>
            </div>
            <input type="range" id="progress-${idx}" min="0" max="100" value="${p.progress}" 
                   style="width: 100%;" 
                   oninput="document.getElementById('progress-value-${idx}').textContent = this.value + '%'">
        </div>
    `).join('');
    
    document.getElementById('progressListEdit').innerHTML = html;
}

function closeProgressModal() {
    document.getElementById('progressModal').classList.remove('show');
}

function saveProgress() {
    const progressItems = currentProject.constructionProgress || [
        { item: '現場勘查', progress: 0 },
        { item: '水電配置', progress: 0 },
        { item: '裝潢施工', progress: 0 },
        { item: '設備安裝', progress: 0 },
        { item: '清潔驗收', progress: 0 }
    ];
    
    progressItems.forEach((p, idx) => {
        const input = document.getElementById(`progress-${idx}`);
        if (input) {
            p.progress = parseInt(input.value);
        }
    });
    
    currentProject.constructionProgress = progressItems;
    
    // 儲存
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const idx = projects.findIndex(p => p.id === currentProjectId);
    if (idx >= 0) {
        projects[idx] = currentProject;
        localStorage.setItem('projects', JSON.stringify(projects));
    }
    
    closeProgressModal();
    loadProgress();
    alert('✅ 進度已更新');
}

// 剩餘功能完整代碼
// 請將這些函數加入到 project.html 的 <script> 區塊中

// ===== 功能 4：刪除施工進度記錄 =====
function deleteProgress(projectId, progressIndex) {
    if (!confirm('確定要刪除此進度記錄嗎？')) return;
    
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.progress || !project.progress[progressIndex]) return;
    
    const deletedItem = project.progress[progressIndex];
    project.progress.splice(progressIndex, 1);
    
    // 記錄到時間軸
    if (!project.statusLogs) project.statusLogs = [];
    project.statusLogs.push({
        date: new Date().toISOString().split('T')[0],
        status: '刪除進度記錄',
        operator: JSON.parse(localStorage.getItem('currentUser')).id,
        note: `刪除「${deletedItem.item}」進度記錄（${deletedItem.progress}%）`
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    alert('✅ 進度記錄已刪除！');
    location.reload();
}

// ===== 功能 5：刪除報價版本 =====
function deleteQuoteVersion(projectId, versionIndex) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.quoteVersions) return;
    
    // 防呆檢查
    if (versionIndex === 0) {
        alert('❌ 不能刪除原始報價（v1）！');
        return;
    }
    
    if (versionIndex === project.quoteVersions.length - 1) {
        alert('❌ 不能刪除最新版本！\n\n請先建立新版本再刪除此版本。');
        return;
    }
    
    const deletedVersion = project.quoteVersions[versionIndex];
    
    if (!confirm(`確定要刪除「${deletedVersion.version}」嗎？\n\n日期：${deletedVersion.date}\n總額：$${deletedVersion.totalAmount.toLocaleString()}\n原因：${deletedVersion.reason}\n\n⚠️ 刪除後無法復原！`)) {
        return;
    }
    
    project.quoteVersions.splice(versionIndex, 1);
    
    // 重新編號版本
    project.quoteVersions.forEach((ver, idx) => {
        ver.version = 'v' + (idx + 1);
    });
    
    // 記錄到時間軸
    if (!project.statusLogs) project.statusLogs = [];
    project.statusLogs.push({
        date: new Date().toISOString().split('T')[0],
        status: '刪除報價版本',
        operator: JSON.parse(localStorage.getItem('currentUser')).id,
        note: `刪除報價版本（原 ${deletedVersion.version}），原因：${deletedVersion.reason}`
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    alert('✅ 報價版本已刪除！\n\n版本編號已重新整理。');
    location.reload();
}

// ===== 功能 7：回復報價版本 =====
function restoreQuoteVersion(projectId, versionIndex) {
    const projects = JSON.parse(localStorage.getItem('projects') || '[]');
    const project = projects.find(p => p.id === projectId);
    
    if (!project || !project.quoteVersions) return;
    
    const targetVersion = project.quoteVersions[versionIndex];
    
    if (!confirm(`確定要回復到「${targetVersion.version}」嗎？\n\n日期：${targetVersion.date}\n總額：$${targetVersion.totalAmount.toLocaleString()}\n原因：${targetVersion.reason}\n\n這會建立一個新版本（v${project.quoteVersions.length + 1}），保留當前報價的歷史記錄。`)) {
        return;
    }
    
    // 建立新版本（複製舊版本的內容）
    const newVersion = {
        version: 'v' + (project.quoteVersions.length + 1),
        date: new Date().toISOString().split('T')[0],
        totalAmount: targetVersion.totalAmount,
        operator: JSON.parse(localStorage.getItem('currentUser')).id,
        reason: `回復到 ${targetVersion.version}`,
        note: `回復報價內容（原版本：${targetVersion.version}，日期：${targetVersion.date}）`,
        items: JSON.parse(JSON.stringify(targetVersion.items)) // 深拷貝
    };
    
    project.quoteVersions.push(newVersion);
    project.totalAmount = newVersion.totalAmount;
    
    // 記錄到時間軸
    if (!project.statusLogs) project.statusLogs = [];
    project.statusLogs.push({
        date: newVersion.date,
        status: '回復報價版本',
        operator: newVersion.operator,
        note: `回復到 ${targetVersion.version}（${targetVersion.date}），總額：$${newVersion.totalAmount.toLocaleString()}`
    });
    
    localStorage.setItem('projects', JSON.stringify(projects));
    
    alert(`✅ 已回復到 ${targetVersion.version}！\n\n建立新版本：${newVersion.version}\n總額：$${newVersion.totalAmount.toLocaleString()}`);
    location.reload();
}

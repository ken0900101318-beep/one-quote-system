window.ProgressManager = (() => {
    const STATUS_LABELS = {
        not_started: '未開始',
        in_progress: '施工中',
        completed: '已完成',
        delayed: '延遲'
    };

    const FIELD_LABELS = {
        contractorName: '工程行',
        installItems: '安裝項目',
        acceptanceResult: '驗收結果'
    };

    const ACCEPTANCE_OPTIONS = ['待驗收', '驗收通過', '驗收未通過', '需補工'];

    let projectId = '';
    let projectData = {};
    let progressData = [];
    let progressSummary = null;
    let stageDefinitions = [];
    let editingStageKey = '';
    let photoDrafts = [];

    function escape(value) {
        return Utils.escapeHtml(value == null ? '' : String(value));
    }

    function statusLabel(status) {
        return STATUS_LABELS[status] || status || '未開始';
    }

    function isOverdue(stage) {
        return Number(stage.overdueDays || 0) > 0 && stage.status !== 'completed';
    }

    function buildBadge(stage) {
        const overdue = isOverdue(stage);
        const statusClass = `progress-badge progress-badge--${escape(stage.status)}`;
        return `
            <span class="${statusClass}">${escape(statusLabel(stage.status))}</span>
            ${overdue ? `<span class="progress-badge progress-badge--overdue">逾期 ${Number(stage.overdueDays || 0)} 天</span>` : ''}
        `;
    }

    function getStageDefinition(stageKey) {
        return stageDefinitions.find(item => item.key === stageKey) || { requiredFields: [] };
    }

    function getRequirementText(stage) {
        const required = getStageDefinition(stage.stageKey).requiredFields || [];
        if (!required.length) return '此階段無額外必填欄位';
        return '必填：' + required.map(key => FIELD_LABELS[key] || key).join('、');
    }


    function buildDefaultStage(definition, index) {
        return {
            id: '',
            projectId,
            stageKey: definition.key,
            stageName: definition.name,
            order: Number(definition.order || index + 1),
            status: 'not_started',
            progressPercent: 0,
            dueDate: '',
            actualDate: '',
            overdueDays: 0,
            contractorName: projectData.contractorName || '',
            installItems: '',
            acceptanceResult: '',
            note: '',
            photos: [],
            updatedBy: '',
            requirements: definition.requiredFields || []
        };
    }

    function normalizeProgressPayload(progressList, definitions) {
        const definitionList = Array.isArray(definitions) && definitions.length ? definitions : [];
        const progressListSafe = Array.isArray(progressList) ? progressList : [];
        if (!definitionList.length) return progressListSafe.slice();
        const progressMap = new Map();
        progressListSafe.forEach(stage => {
            if (!stage || !stage.stageKey || progressMap.has(stage.stageKey)) return;
            progressMap.set(stage.stageKey, stage);
        });
        return definitionList.map((definition, index) => {
            const existing = progressMap.get(definition.key);
            return existing ? {
                ...buildDefaultStage(definition, index),
                ...existing,
                stageKey: existing.stageKey || definition.key,
                stageName: existing.stageName || definition.name,
                order: Number(existing.order || definition.order || index + 1),
                requirements: Array.isArray(existing.requirements) && existing.requirements.length ? existing.requirements : (definition.requiredFields || []),
                photos: Array.isArray(existing.photos) ? existing.photos : []
            } : buildDefaultStage(definition, index);
        });
    }

    function renderSummary() {
        const summaryBox = document.getElementById('progressSummaryBox');
        if (!summaryBox) return;
        const percent = Number((progressSummary && progressSummary.overallPercent) || 0);
        const currentStage = progressSummary && progressSummary.currentStage;
        const nextStage = progressSummary && progressSummary.nextStage;
        const overdueCount = Number((progressSummary && progressSummary.overdueCount) || 0);
        const alertClass = overdueCount > 0 ? '' : ' progress-alert-chip--ok';
        summaryBox.innerHTML = `
            <div class="progress-summary-card">
                <div class="progress-ring-wrap">
                    <div class="progress-ring" style="--progress-deg:${percent * 3.6}deg;">
                        <div class="progress-ring-value">
                            <strong>${percent}%</strong>
                            <span>整體進度</span>
                        </div>
                    </div>
                </div>
                <div class="progress-summary-list">
                    <div class="progress-summary-item">
                        <small>完成階段</small>
                        <strong>${Number((progressSummary && progressSummary.completedStages) || 0)} / ${Number((progressSummary && progressSummary.totalStages) || progressData.length || 7)}</strong>
                    </div>
                    <div class="progress-summary-item">
                        <small>目前階段</small>
                        <strong>${escape(currentStage ? currentStage.stageName : '全部完成')}</strong>
                    </div>
                    <div class="progress-summary-item">
                        <small>下一步建議</small>
                        <strong>${escape(nextStage ? `下一階段：${nextStage.stageName}` : currentStage ? `優先完成：${currentStage.stageName}` : '可安排結案或維運')}</strong>
                    </div>
                    <div class="progress-summary-item">
                        <small>提醒狀態</small>
                        <span class="progress-alert-chip${alertClass}">${overdueCount > 0 ? `⚠️ ${overdueCount} 個逾期階段` : '✅ 目前無逾期'}</span>
                    </div>
                </div>
            </div>
        `;
    }

    function renderTimeline() {
        const timeline = document.getElementById('progressTimeline');
        if (!timeline) return;
        if (!progressData.length) {
            timeline.innerHTML = '<div class="progress-empty">尚無施工進度資料</div>';
            return;
        }
        const currentStageKey = progressSummary && progressSummary.currentStage ? progressSummary.currentStage.stageKey : '';
        timeline.innerHTML = progressData.map((stage, index) => {
            const overdue = isOverdue(stage);
            const photoList = Array.isArray(stage.photos) ? stage.photos : [];
            const stageClass = [
                'progress-stage-card',
                `is-${stage.status}`,
                overdue ? 'is-overdue' : '',
                currentStageKey === stage.stageKey ? 'is-current' : ''
            ].filter(Boolean).join(' ');
            return `
                <div class="${stageClass}">
                    <div class="progress-stage-marker">${index + 1}</div>
                    <div class="progress-stage-main">
                        <h4>${escape(stage.stageName)}</h4>
                        <div class="progress-stage-meta">
                            ${buildBadge(stage)}
                            <span class="progress-badge">進度 ${Number(stage.progressPercent || 0)}%</span>
                        </div>
                        <div class="progress-inline-note">${escape(getRequirementText(stage))}</div>
                        <div class="progress-stage-details" style="margin-top:10px;">
                            <div class="progress-stage-detail"><small>預計日期</small><strong>${escape(stage.dueDate || '-')}</strong></div>
                            <div class="progress-stage-detail"><small>實際日期</small><strong>${escape(stage.actualDate || '-')}</strong></div>
                            <div class="progress-stage-detail"><small>工程行</small><span>${escape(stage.contractorName || projectData.contractorName || '-')}</span></div>
                            <div class="progress-stage-detail"><small>安裝項目</small><span>${escape(stage.installItems || '-')}</span></div>
                            <div class="progress-stage-detail"><small>驗收結果</small><span>${escape(stage.acceptanceResult || '-')}</span></div>
                            <div class="progress-stage-detail"><small>備註</small><span>${escape(stage.note || '-')}</span></div>
                            <div class="progress-stage-detail progress-stage-photos">
                                <small>施工照片</small>
                                ${photoList.length ? `<div class="progress-photo-list">${photoList.map((photo, photoIndex) => `<img src="${escape(photo.thumbnailUrl || photo.url)}" alt="施工照片${photoIndex + 1}" class="progress-photo-thumb" data-photo-url="${escape(photo.url || photo.thumbnailUrl)}">`).join('')}</div>` : '<span>-</span>'}
                            </div>
                        </div>
                    </div>
                    <div class="progress-stage-actions">
                        <button type="button" class="btn btn-secondary btn-sm" data-edit-progress="${escape(stage.stageKey)}">✏️ 編輯</button>
                    </div>
                </div>
            `;
        }).join('');

        timeline.querySelectorAll('[data-edit-progress]').forEach(button => {
            button.addEventListener('click', () => openModal(button.getAttribute('data-edit-progress')));
        });
        timeline.querySelectorAll('.progress-photo-thumb').forEach(img => {
            img.addEventListener('click', () => openLightbox(img.getAttribute('data-photo-url')));
        });
    }

    async function load(projectIdInput, project) {
        projectId = projectIdInput;
        projectData = project || {};
        const result = await QuoteAPI.getProjectProgress(projectId);
        if (!result.success) {
            Toast.error('施工進度載入失敗：' + (result.error || '未知錯誤'));
            return result;
        }
        stageDefinitions = Array.isArray(result.stageDefinitions) ? result.stageDefinitions : [];
        progressData = normalizeProgressPayload(result.progress, stageDefinitions);
        progressSummary = result.summary || null;
        renderSummary();
        renderTimeline();
        return result;
    }

    function ensureModal() {
        if (document.getElementById('progressEditModal')) return;
        const modal = document.createElement('div');
        modal.id = 'progressEditModal';
        modal.className = 'progress-modal';
        modal.innerHTML = `
            <div class="progress-modal-dialog">
                <div class="progress-modal-header">
                    <div>
                        <h3 id="progressModalTitle" style="margin:0;">編輯施工進度</h3>
                        <div class="progress-inline-note" id="progressModalHint"></div>
                    </div>
                    <button type="button" class="btn btn-secondary" id="progressModalCloseBtn">關閉</button>
                </div>
                <form id="progressEditForm">
                    <div class="progress-modal-grid">
                        <div class="form-row">
                            <label>狀態</label>
                            <select id="progressStatus" required>
                                <option value="not_started">未開始</option>
                                <option value="in_progress">施工中</option>
                                <option value="completed">已完成</option>
                                <option value="delayed">延遲</option>
                            </select>
                        </div>
                        <div class="form-row">
                            <label>進度百分比</label>
                            <input type="number" id="progressPercent" min="0" max="100" step="1" required>
                        </div>
                        <div class="form-row">
                            <label>預計日期</label>
                            <input type="date" id="progressDueDate">
                        </div>
                        <div class="form-row">
                            <label>實際日期</label>
                            <input type="date" id="progressActualDate">
                        </div>
                        <div class="form-row full-width" id="fieldContractorNameWrap">
                            <label>工程行</label>
                            <input type="text" id="progressContractorName" maxlength="100" placeholder="例如：王師傅工程行">
                        </div>
                        <div class="form-row full-width" id="fieldInstallItemsWrap">
                            <label>安裝項目</label>
                            <input type="text" id="progressInstallItems" maxlength="500" placeholder="例如：大金冷氣 2 台、麻將桌 6 台">
                        </div>
                        <div class="form-row full-width" id="fieldAcceptanceResultWrap">
                            <label>驗收結果</label>
                            <select id="progressAcceptanceResult">
                                <option value="">請選擇</option>
                                ${ACCEPTANCE_OPTIONS.map(option => `<option value="${escape(option)}">${escape(option)}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-row full-width">
                            <label>備註</label>
                            <textarea id="progressNote" rows="3" maxlength="1000" placeholder="補充說明、現場狀況、待辦事項"></textarea>
                        </div>
                        <div class="form-row full-width">
                            <label>施工照片（最多 3 張，單張壓縮後約 640px）</label>
                            <input type="file" id="progressPhotos" accept="image/*" multiple>
                            <div class="progress-inline-note">採用 Base64 精簡儲存，部署最簡單；為避免 Sheets 儲存格過大，會自動壓縮。</div>
                            <div id="progressPhotoPreviewList" class="progress-photo-preview-list"></div>
                        </div>
                    </div>
                    <div style="margin-top:18px; display:flex; gap:10px; justify-content:flex-end; flex-wrap:wrap;">
                        <button type="button" class="btn btn-secondary" id="progressCancelBtn">取消</button>
                        <button type="submit" class="btn btn-primary" id="progressSaveBtn">💾 儲存進度</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const lightbox = document.createElement('div');
        lightbox.id = 'progressLightbox';
        lightbox.className = 'progress-lightbox';
        lightbox.innerHTML = '<img id="progressLightboxImage" alt="施工照片大圖">';
        document.body.appendChild(lightbox);

        document.getElementById('progressModalCloseBtn').addEventListener('click', closeModal);
        document.getElementById('progressCancelBtn').addEventListener('click', closeModal);
        modal.addEventListener('click', event => {
            if (event.target === modal) closeModal();
        });
        lightbox.addEventListener('click', closeLightbox);
        document.getElementById('progressStatus').addEventListener('change', syncStatusAndPercent);
        document.getElementById('progressPercent').addEventListener('change', syncPercentAndStatus);
        document.getElementById('progressPhotos').addEventListener('change', handlePhotoChange);
        document.getElementById('progressEditForm').addEventListener('submit', submitModal);
    }

    function openModal(stageKey) {
        ensureModal();
        editingStageKey = stageKey;
        const stage = progressData.find(item => item.stageKey === stageKey);
        if (!stage) {
            Toast.error('找不到進度階段');
            return;
        }
        photoDrafts = Array.isArray(stage.photos) ? JSON.parse(JSON.stringify(stage.photos)) : [];
        document.getElementById('progressModalTitle').textContent = `編輯：${stage.stageName}`;
        document.getElementById('progressModalHint').textContent = getRequirementText(stage);
        document.getElementById('progressStatus').value = stage.status || 'not_started';
        document.getElementById('progressPercent').value = Number(stage.progressPercent || 0);
        document.getElementById('progressDueDate').value = stage.dueDate || '';
        document.getElementById('progressActualDate').value = stage.actualDate || '';
        document.getElementById('progressContractorName').value = stage.contractorName || projectData.contractorName || '';
        document.getElementById('progressInstallItems').value = stage.installItems || '';
        document.getElementById('progressAcceptanceResult').value = stage.acceptanceResult || '';
        document.getElementById('progressNote').value = stage.note || '';
        document.getElementById('progressPhotos').value = '';
        applyRequiredFields(stage);
        renderPhotoPreviews();
        document.getElementById('progressEditModal').classList.add('show');
    }

    function closeModal() {
        const modal = document.getElementById('progressEditModal');
        if (modal) modal.classList.remove('show');
    }

    function applyRequiredFields(stage) {
        const required = getStageDefinition(stage.stageKey).requiredFields || [];
        const toggles = [
            ['fieldContractorNameWrap', 'progressContractorName', 'contractorName'],
            ['fieldInstallItemsWrap', 'progressInstallItems', 'installItems'],
            ['fieldAcceptanceResultWrap', 'progressAcceptanceResult', 'acceptanceResult']
        ];
        toggles.forEach(([wrapId, fieldId, key]) => {
            const visible = required.includes(key) || Boolean(stage[key]);
            document.getElementById(wrapId).classList.toggle('progress-hidden', !visible);
            document.getElementById(fieldId).required = required.includes(key);
        });
    }

    function syncStatusAndPercent() {
        const status = document.getElementById('progressStatus').value;
        const percentInput = document.getElementById('progressPercent');
        if (status === 'completed') percentInput.value = 100;
        if (status === 'not_started') percentInput.value = 0;
        if (status === 'in_progress' && Number(percentInput.value || 0) <= 0) percentInput.value = 10;
    }

    function syncPercentAndStatus() {
        const percent = Math.max(0, Math.min(100, Number(document.getElementById('progressPercent').value || 0)));
        document.getElementById('progressPercent').value = percent;
        const statusInput = document.getElementById('progressStatus');
        if (percent >= 100) statusInput.value = 'completed';
        else if (percent <= 0 && statusInput.value === 'completed') statusInput.value = 'not_started';
        else if (percent > 0 && statusInput.value === 'not_started') statusInput.value = 'in_progress';
    }

    async function handlePhotoChange(event) {
        const files = Array.from(event.target.files || []).slice(0, 3);
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const photo = await compressImage(file);
            photoDrafts.push(photo);
            if (photoDrafts.length >= 3) break;
        }
        photoDrafts = photoDrafts.slice(0, 3);
        renderPhotoPreviews();
        event.target.value = '';
    }

    function compressImage(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const img = new Image();
                img.onload = () => {
                    const maxSize = 640;
                    let { width, height } = img;
                    if (width > height && width > maxSize) {
                        height = Math.round(height * (maxSize / width));
                        width = maxSize;
                    } else if (height >= width && height > maxSize) {
                        width = Math.round(width * (maxSize / height));
                        height = maxSize;
                    }
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.58);
                    resolve({
                        name: file.name,
                        url: dataUrl,
                        thumbnailUrl: dataUrl,
                        type: 'image/jpeg',
                        size: file.size
                    });
                };
                img.onerror = reject;
                img.src = reader.result;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    function renderPhotoPreviews() {
        const wrap = document.getElementById('progressPhotoPreviewList');
        if (!wrap) return;
        if (!photoDrafts.length) {
            wrap.innerHTML = '';
            return;
        }
        wrap.innerHTML = photoDrafts.map((photo, index) => `
            <div class="progress-photo-preview">
                <img src="${escape(photo.thumbnailUrl || photo.url)}" alt="施工照片預覽${index + 1}">
                <button type="button" class="progress-photo-remove" data-remove-photo="${index}">✕</button>
            </div>
        `).join('');
        wrap.querySelectorAll('[data-remove-photo]').forEach(button => {
            button.addEventListener('click', () => {
                photoDrafts.splice(Number(button.getAttribute('data-remove-photo')), 1);
                renderPhotoPreviews();
            });
        });
    }

    async function submitModal(event) {
        event.preventDefault();
        const stage = progressData.find(item => item.stageKey === editingStageKey);
        if (!stage) {
            Toast.error('找不到要更新的進度');
            return;
        }
        const payload = {
            projectId,
            stageKey: editingStageKey,
            status: document.getElementById('progressStatus').value,
            progressPercent: Number(document.getElementById('progressPercent').value || 0),
            dueDate: document.getElementById('progressDueDate').value,
            actualDate: document.getElementById('progressActualDate').value,
            contractorName: document.getElementById('progressContractorName').value.trim(),
            installItems: document.getElementById('progressInstallItems').value.trim(),
            acceptanceResult: document.getElementById('progressAcceptanceResult').value.trim(),
            note: document.getElementById('progressNote').value.trim(),
            photos: photoDrafts,
            updatedBy: (window.currentUser && (window.currentUser.name || window.currentUser.username)) || ''
        };
        const required = getStageDefinition(editingStageKey).requiredFields || [];
        for (const field of required) {
            if (!payload[field]) {
                Toast.error(`請填寫${FIELD_LABELS[field] || field}`);
                return;
            }
        }
        const saveBtn = document.getElementById('progressSaveBtn');
        saveBtn.disabled = true;
        saveBtn.textContent = '儲存中...';
        const result = await QuoteAPI.updateProgress(payload);
        saveBtn.disabled = false;
        saveBtn.textContent = '💾 儲存進度';
        if (!result.success) {
            Toast.error('儲存失敗：' + (result.error || '未知錯誤'));
            return;
        }
        progressData = normalizeProgressPayload(result.progress, stageDefinitions);
        progressSummary = result.summary || progressSummary;
        renderSummary();
        renderTimeline();
        closeModal();
        Toast.success('施工進度已更新');
        if (typeof window.onProgressUpdated === 'function') {
            window.onProgressUpdated({ progress: progressData, summary: progressSummary, stage: result.stage });
        }
    }

    function openLightbox(url) {
        const lightbox = document.getElementById('progressLightbox');
        const image = document.getElementById('progressLightboxImage');
        if (!lightbox || !image) return;
        image.src = url || '';
        lightbox.classList.add('show');
    }

    function closeLightbox() {
        const lightbox = document.getElementById('progressLightbox');
        if (lightbox) lightbox.classList.remove('show');
    }

    function getState() {
        return {
            progress: progressData,
            summary: progressSummary,
            stageDefinitions
        };
    }

    return {
        load,
        openModal,
        getState
    };
})();

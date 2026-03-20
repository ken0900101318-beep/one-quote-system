window.PriceListPicker = (function() {
    const CATEGORIES = ['麻將桌', '冷氣', '水電配線', '輕隔間', '包廂門', '智能門鎖', '其他設備'];
    const modalId = 'priceListPickerModal';
    let state = {
        items: [],
        filtered: [],
        currentCategory: CATEGORIES[0],
        currentItemId: null,
        onSelect: null,
        search: ''
    };

    function ensureModal() {
        if (document.getElementById(modalId)) return;
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'price-picker-modal';
        modal.innerHTML = `
            <div class="price-picker-dialog">
                <div class="price-picker-header">
                    <div>
                        <h3>從價目表選擇</h3>
                        <p>先選分類，再點選項目自動帶入名稱 / 單價 / 單位</p>
                    </div>
                    <button type="button" class="price-picker-close" aria-label="關閉">&times;</button>
                </div>
                <div class="price-picker-toolbar">
                    <input type="text" id="pricePickerSearch" placeholder="搜尋項目名稱、規格或備註">
                </div>
                <div class="price-picker-tabs" id="pricePickerTabs"></div>
                <div class="price-picker-list" id="pricePickerList"></div>
            </div>
        `;
        document.body.appendChild(modal);

        modal.addEventListener('click', (event) => {
            if (event.target === modal) close();
        });
        modal.querySelector('.price-picker-close').addEventListener('click', close);
        modal.querySelector('#pricePickerSearch').addEventListener('input', (event) => {
            state.search = event.target.value.trim().toLowerCase();
            renderList();
        });

        injectStyles();
    }

    function injectStyles() {
        if (document.getElementById('pricePickerStyles')) return;
        const style = document.createElement('style');
        style.id = 'pricePickerStyles';
        style.textContent = `
            .price-picker-modal { position: fixed; inset: 0; background: rgba(15, 23, 42, 0.55); display: none; align-items: center; justify-content: center; z-index: 2000; padding: 16px; }
            .price-picker-modal.open { display: flex; }
            .price-picker-dialog { width: min(980px, 100%); max-height: 90vh; overflow: hidden; background: #fff; border-radius: 16px; box-shadow: 0 24px 60px rgba(15, 23, 42, 0.24); display: flex; flex-direction: column; }
            .price-picker-header { display: flex; justify-content: space-between; gap: 16px; align-items: start; padding: 20px 24px 12px; border-bottom: 1px solid #e2e8f0; }
            .price-picker-header h3 { margin: 0 0 6px; }
            .price-picker-header p { margin: 0; color: #64748b; font-size: 14px; }
            .price-picker-close { border: none; background: none; font-size: 28px; cursor: pointer; color: #64748b; }
            .price-picker-toolbar { padding: 16px 24px 0; }
            .price-picker-toolbar input { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 10px; }
            .price-picker-tabs { display: flex; gap: 10px; flex-wrap: wrap; padding: 16px 24px; border-bottom: 1px solid #e2e8f0; }
            .price-picker-tab { border: 1px solid #cbd5e1; background: #f8fafc; color: #334155; padding: 8px 14px; border-radius: 999px; cursor: pointer; }
            .price-picker-tab.active { background: #2563eb; color: #fff; border-color: #2563eb; }
            .price-picker-list { padding: 20px 24px 24px; overflow: auto; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 12px; }
            .price-picker-empty { grid-column: 1 / -1; text-align: center; color: #94a3b8; padding: 36px 12px; border: 1px dashed #cbd5e1; border-radius: 12px; }
            .price-picker-card { border: 1px solid #dbe2ea; border-radius: 14px; padding: 14px; cursor: pointer; transition: transform .15s ease, box-shadow .15s ease, border-color .15s ease; background: #fff; }
            .price-picker-card:hover { transform: translateY(-1px); border-color: #2563eb; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.12); }
            .price-picker-card h4 { margin: 0 0 8px; font-size: 16px; color: #0f172a; }
            .price-picker-meta { display: flex; justify-content: space-between; gap: 8px; align-items: center; margin-bottom: 8px; font-size: 13px; color: #475569; }
            .price-picker-price { font-weight: 700; color: #2563eb; }
            .price-picker-note { margin: 0; color: #64748b; font-size: 13px; line-height: 1.5; min-height: 19px; }
            .price-picker-badge { display: inline-flex; align-items: center; gap: 6px; padding: 4px 8px; border-radius: 999px; font-size: 12px; }
            .price-picker-badge.active { background: #dcfce7; color: #166534; }
            .price-picker-badge.inactive { background: #fee2e2; color: #991b1b; }
            @media (max-width: 640px) { .price-picker-dialog { max-height: 95vh; } .price-picker-list { grid-template-columns: 1fr; padding: 16px; } .price-picker-header, .price-picker-toolbar, .price-picker-tabs { padding-left: 16px; padding-right: 16px; } }
        `;
        document.head.appendChild(style);
    }

    function setItems(items) {
        state.items = Array.isArray(items) ? items.slice() : [];
        if (!state.items.some(item => item.category === state.currentCategory)) {
            state.currentCategory = CATEGORIES.find(category => state.items.some(item => item.category === category)) || CATEGORIES[0];
        }
    }

    function open(itemId, options = {}) {
        ensureModal();
        state.currentItemId = itemId;
        state.onSelect = typeof options.onSelect === 'function' ? options.onSelect : null;
        state.search = '';
        document.getElementById('pricePickerSearch').value = '';
        if (options.defaultCategory && CATEGORIES.includes(options.defaultCategory)) {
            state.currentCategory = options.defaultCategory;
        }
        renderTabs();
        renderList();
        document.getElementById(modalId).classList.add('open');
    }

    function close() {
        const modal = document.getElementById(modalId);
        if (modal) modal.classList.remove('open');
        state.currentItemId = null;
    }

    function renderTabs() {
        const tabs = document.getElementById('pricePickerTabs');
        if (!tabs) return;
        tabs.innerHTML = CATEGORIES.map(category => `
            <button type="button" class="price-picker-tab ${category === state.currentCategory ? 'active' : ''}" data-category="${Utils.escapeHtml(category)}">
                ${Utils.escapeHtml(category)}
            </button>
        `).join('');
        tabs.querySelectorAll('[data-category]').forEach(button => {
            button.addEventListener('click', () => {
                state.currentCategory = button.getAttribute('data-category') || CATEGORIES[0];
                renderTabs();
                renderList();
            });
        });
    }

    function renderList() {
        const list = document.getElementById('pricePickerList');
        if (!list) return;
        const filtered = state.items.filter(item => item.category === state.currentCategory)
            .filter(item => {
                if (!state.search) return true;
                const source = `${item.name || ''} ${item.spec || item.description || ''} ${item.note || item.remark || ''}`.toLowerCase();
                return source.includes(state.search);
            })
            .filter(item => (item.status || '啟用') === '啟用');

        if (filtered.length === 0) {
            list.innerHTML = '<div class="price-picker-empty">此分類目前沒有可選項目</div>';
            return;
        }

        list.innerHTML = filtered.map(item => `
            <button type="button" class="price-picker-card" data-id="${Utils.escapeHtml(item.id)}">
                <div class="price-picker-meta">
                    <span class="price-picker-badge ${(item.status || '啟用') === '啟用' ? 'active' : 'inactive'}">${Utils.escapeHtml(item.status || '啟用')}</span>
                    <span class="price-picker-price">${Utils.formatPrice(item.price)} / ${Utils.escapeHtml(item.unit || '式')}</span>
                </div>
                <h4>${Utils.escapeHtml(item.name || '')}</h4>
                <p class="price-picker-note">${Utils.escapeHtml(item.spec || item.description || '—')}</p>
                <p class="price-picker-note">備註：${Utils.escapeHtml(item.note || item.remark || '—')}</p>
            </button>
        `).join('');

        list.querySelectorAll('[data-id]').forEach(button => {
            button.addEventListener('click', () => {
                const item = filtered.find(entry => entry.id === button.getAttribute('data-id'));
                if (item && state.onSelect) {
                    state.onSelect(item, state.currentItemId);
                }
                close();
            });
        });
    }

    return {
        categories: CATEGORIES,
        setItems,
        open,
        close
    };
})();

/* Players Module - VĐV management with avatar support */
const Players = {
    _pendingAvatar: null, // temp base64 for current modal

    render() {
        const container = H.$('#tab-players');
        const players = Store.get('players') || [];
        const sheetUrl = Store.get('googleSheetUrl');
        container.innerHTML = `
            <div class="section-header">
                <div>
                    <h2 style="font-family:var(--font-heading);font-size:var(--fs-xl);margin-bottom:var(--space-1)">Danh Sách VĐV</h2>
                    <p class="text-muted" style="font-size:var(--fs-sm)">${players.length} vận động viên đã đăng ký</p>
                </div>
                <div class="section-header-actions">
                    <button class="btn btn-secondary" id="btn-gsheet-import" title="Import từ Google Sheet">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="8" y1="13" x2="16" y2="13"/><line x1="8" y1="17" x2="16" y2="17"/></svg>
                        Google Sheet
                    </button>
                    <button class="btn btn-secondary" id="btn-import-players">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                        Import Text
                    </button>
                    <button class="btn btn-primary" id="btn-add-player">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                        Thêm VĐV
                    </button>
                </div>
            </div>
            ${sheetUrl ? `<div class="toolbar mb-4" style="justify-content:space-between">
                <span style="font-size:var(--fs-xs);color:var(--text-secondary)">📊 Kết nối: Google Sheet</span>
                <button class="btn btn-sm btn-primary" id="btn-resync-sheet">↻ Đồng bộ lại</button>
            </div>` : ''}
            <div class="player-grid" id="player-grid"></div>
        `;
        this._renderGrid(players);
        H.$('#btn-add-player').addEventListener('click', () => this.showAddModal());
        H.$('#btn-import-players').addEventListener('click', () => this.showImportModal());
        H.$('#btn-gsheet-import').addEventListener('click', () => this.showGSheetModal());
        H.$('#btn-resync-sheet')?.addEventListener('click', () => this._fetchGSheet(Store.get('googleSheetUrl')));
    },

    _avatarHtml(p) {
        if (p.avatar) {
            return `<img src="${p.avatar}" alt="${p.name}" class="player-avatar player-avatar-img">`;
        }
        return `<div class="player-avatar" style="background:linear-gradient(135deg,${H.ratingColor(p.rating)},var(--primary-light))">${H.initials(p.name)}</div>`;
    },

    _renderGrid(players) {
        const grid = H.$('#player-grid');
        if (!players.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>
                <p>Chưa có VĐV nào</p><p class="mt-2">Bấm <strong>Thêm VĐV</strong> hoặc <strong>Import</strong> để bắt đầu</p>
            </div>`;
            return;
        }
        grid.innerHTML = players.map((p, i) => `
            <div class="player-card animate-card-enter" style="animation-delay:${i * 50}ms">
                ${this._avatarHtml(p)}
                <div class="player-info">
                    <div class="player-name">${p.name}</div>
                    <div class="player-dept">${p.department || 'Ban Kỹ Thuật'}</div>
                </div>
                <div class="player-rating" title="Điểm: ${p.rating}/5.0">
                    <span style="color:${H.ratingColor(p.rating)}">${p.rating.toFixed(1)}</span>
                    <svg viewBox="0 0 24 24" fill="${H.ratingColor(p.rating)}" width="14" height="14"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                </div>
                <div class="player-actions">
                    <button class="btn-icon" data-edit="${p.id}" title="Sửa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                    <button class="btn-icon" data-delete="${p.id}" title="Xóa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div>
            </div>
        `).join('');

        grid.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => this.showEditModal(btn.dataset.edit)));
        grid.querySelectorAll('[data-delete]').forEach(btn => btn.addEventListener('click', () => this.deletePlayer(btn.dataset.delete)));
    },

    _avatarUploadHtml(existingAvatar) {
        const preview = existingAvatar
            ? `<img src="${existingAvatar}" alt="Avatar" class="avatar-upload-preview">`
            : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="opacity:0.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
        return `
            <div class="avatar-upload-area" id="avatar-upload-area">
                <div class="avatar-upload-circle" id="avatar-preview">${preview}</div>
                <div class="avatar-upload-info">
                    <span style="font-size:var(--fs-sm);font-weight:var(--fw-medium)">Ảnh đại diện</span>
                    <span style="font-size:var(--fs-xs);color:var(--text-muted)">Bấm để chọn ảnh (tùy chọn)</span>
                </div>
                <input type="file" id="avatar-input" accept="image/*" style="display:none">
                ${existingAvatar ? '<button class="btn btn-sm btn-danger" id="btn-remove-avatar" type="button">Xóa</button>' : ''}
            </div>`;
    },

    _bindAvatarUpload(existingAvatar) {
        this._pendingAvatar = existingAvatar || null;
        const area = H.$('#avatar-upload-area');
        const input = H.$('#avatar-input');
        const preview = H.$('#avatar-preview');

        area.addEventListener('click', (e) => {
            if (e.target.closest('#btn-remove-avatar')) return;
            input.click();
        });

        input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                H.toast('Ảnh quá lớn (tối đa 2MB)', 'warning');
                return;
            }
            this._compressImage(file, (base64) => {
                this._pendingAvatar = base64;
                preview.innerHTML = `<img src="${base64}" alt="Avatar" class="avatar-upload-preview">`;
                // Add remove button if not exists
                if (!H.$('#btn-remove-avatar')) {
                    const rmBtn = H.el('button', { className: 'btn btn-sm btn-danger', id: 'btn-remove-avatar', type: 'button', textContent: 'Xóa' });
                    rmBtn.addEventListener('click', (ev) => { ev.stopPropagation(); this._removeAvatar(preview); });
                    area.appendChild(rmBtn);
                }
            });
        });

        H.$('#btn-remove-avatar')?.addEventListener('click', (e) => {
            e.stopPropagation();
            this._removeAvatar(preview);
        });
    },

    _removeAvatar(previewEl) {
        this._pendingAvatar = null;
        previewEl.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" width="32" height="32" style="opacity:0.5"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><line x1="19" y1="8" x2="19" y2="14"/><line x1="22" y1="11" x2="16" y2="11"/></svg>`;
        const rmBtn = H.$('#btn-remove-avatar');
        if (rmBtn) rmBtn.remove();
    },

    _compressImage(file, cb) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const maxSize = 128;
                let w = img.width, h = img.height;
                if (w > h) { h = (h / w) * maxSize; w = maxSize; }
                else { w = (w / h) * maxSize; h = maxSize; }
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                cb(canvas.toDataURL('image/jpeg', 0.7));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    },

    showAddModal() {
        this._pendingAvatar = null;
        App.showModal('Thêm VĐV Mới', `
            ${this._avatarUploadHtml(null)}
            <div class="input-group"><label for="p-name">Họ và Tên</label><input class="input" id="p-name" placeholder="Nguyễn Văn A" required></div>
            <div class="input-group"><label for="p-dept">Bộ Phận</label><input class="input" id="p-dept" placeholder="Ban Kỹ Thuật" value="Ban Kỹ Thuật"></div>
            <div class="input-group"><label for="p-rating">Điểm Đánh Giá (1 - 10)</label>
                <input class="input" id="p-rating" type="number" min="1" max="10" step="0.5" value="5"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Thêm</button>
            </div>
        `);
        this._bindAvatarUpload(null);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const name = H.$('#p-name').value.trim();
            if (!name) { H.$('#p-name').focus(); return; }
            const players = Store.get('players');
            const newPlayer = {
                id: H.id(), name,
                department: H.$('#p-dept').value.trim() || 'Ban Kỹ Thuật',
                rating: Math.min(10, Math.max(1, parseFloat(H.$('#p-rating').value) || 5))
            };
            if (this._pendingAvatar) newPlayer.avatar = this._pendingAvatar;
            players.push(newPlayer);
            Store.set('players', players);
            App.closeModal();
            this.render();
            H.toast(`Đã thêm <strong>${name}</strong>`, 'success');
        };
        H.$('#p-name').focus();
    },

    showEditModal(id) {
        const players = Store.get('players');
        const p = players.find(x => x.id === id);
        if (!p) return;
        this._pendingAvatar = p.avatar || null;
        App.showModal('Sửa Thông Tin VĐV', `
            ${this._avatarUploadHtml(p.avatar)}
            <div class="input-group"><label for="p-name">Họ và Tên</label><input class="input" id="p-name" value="${p.name}"></div>
            <div class="input-group"><label for="p-dept">Bộ Phận</label><input class="input" id="p-dept" value="${p.department}"></div>
            <div class="input-group"><label for="p-rating">Điểm Đánh Giá (1 - 10)</label>
                <input class="input" id="p-rating" type="number" min="1" max="10" step="0.5" value="${p.rating}"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Lưu</button>
            </div>
        `);
        this._bindAvatarUpload(p.avatar);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const name = H.$('#p-name').value.trim();
            if (!name) return;
            p.name = name;
            p.department = H.$('#p-dept').value.trim() || 'Ban Kỹ Thuật';
            p.rating = Math.min(10, Math.max(1, parseFloat(H.$('#p-rating').value) || 5));
            p.avatar = this._pendingAvatar || undefined;
            if (!p.avatar) delete p.avatar;
            Store.set('players', players);
            App.closeModal();
            this.render();
            H.toast('Đã cập nhật', 'success');
        };
    },

    showImportModal() {
        App.showModal('Import Danh Sách VĐV', `
            <p style="font-size:var(--fs-sm);color:var(--text-secondary);margin-bottom:var(--space-2)">
                Mỗi dòng 1 VĐV. Định dạng: <strong>Tên | Bộ phận | Điểm</strong><br>
                Ví dụ: <code style="color:var(--accent)">Nguyễn Văn A | MCC | 3.5</code></p>
            <div class="input-group"><label for="p-import">Danh Sách</label>
                <textarea class="input" id="p-import" rows="8" placeholder="Nguyễn Văn A | MCC | 3.5&#10;Trần Thị B | MOC | 4.0&#10;Lê Văn C | | 2.5"></textarea></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Import</button>
            </div>
        `);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const text = H.$('#p-import').value.trim();
            if (!text) return;
            const players = Store.get('players');
            const lines = text.split('\n').filter(l => l.trim());
            let count = 0;
            lines.forEach(line => {
                const parts = line.split('|').map(s => s.trim());
                const name = parts[0];
                if (!name) return;
                players.push({
                    id: H.id(), name,
                    department: parts[1] || 'Ban Kỹ Thuật',
                    rating: Math.min(10, Math.max(1, parseFloat(parts[2]) || 5))
                });
                count++;
            });
            Store.set('players', players);
            App.closeModal();
            this.render();
            H.toast(`Đã import <strong>${count}</strong> VĐV`, 'success');
        };
    },

    // ===== Google Sheet Import =====

    showGSheetModal() {
        const savedUrl = Store.get('googleSheetUrl') || '';
        App.showModal('Import từ Google Sheet', `
            <div style="margin-bottom:var(--space-4)">
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                    <span style="font-size:24px">📊</span>
                    <div>
                        <p style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">Kết nối Google Sheet</p>
                        <p style="font-size:var(--fs-xs);color:var(--text-muted)">Tự động lấy danh sách VĐV & avatar</p>
                    </div>
                </div>
                <div style="background:rgba(0,0,0,0.2);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--fs-xs);color:var(--text-secondary)">
                    <p style="font-weight:var(--fw-semibold);color:var(--accent);margin-bottom:var(--space-2)">Cấu trúc Google Sheet:</p>
                    <p>Các cột: <strong>STT</strong> | <strong>Người chơi</strong> | <strong>Initial Rating</strong> (1-10) | <strong>Avatar</strong> (link Drive)</p>
                    <p style="margin-top:var(--space-2)">Cách publish: <strong>File → Share → Publish to web → CSV</strong></p>
                    <p style="margin-top:var(--space-2);color:var(--warning)">⚠️ Hoặc dán link bình thường của Sheet (cần chia sẻ quyền xem)</p>
                </div>
            </div>
            <div class="input-group"><label for="gsheet-url">Link Google Sheet</label>
                <input class="input" id="gsheet-url" placeholder="https://docs.google.com/spreadsheets/d/..." value="${savedUrl}"></div>
            <div class="input-group">
                <label style="display:flex;align-items:center;gap:var(--space-2);cursor:pointer">
                    <input type="checkbox" id="gsheet-replace" ${savedUrl ? '' : 'checked'}>
                    <span style="font-size:var(--fs-sm)">Thay thế danh sách hiện tại (bỏ tick = gộp thêm)</span>
                </label>
            </div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Tải Dữ Liệu</button>
            </div>
        `);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const url = H.$('#gsheet-url').value.trim();
            if (!url) { H.toast('Vui lòng dán link Google Sheet', 'warning'); return; }
            this._gsheetReplace = H.$('#gsheet-replace').checked;
            Store.set('googleSheetUrl', url);
            this._fetchGSheet(url);
        };
    },

    _gsheetReplace: true,

    _extractSheetId(url) {
        const match = url.match(/spreadsheets\/d\/([a-zA-Z0-9_-]+)/);
        return match ? match[1] : null;
    },

    _driveDirectUrl(driveUrl) {
        if (!driveUrl || typeof driveUrl !== 'string') return null;
        const url = driveUrl.trim();
        if (!url) return null;

        // Already a direct image URL
        if (url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i)) return url;

        // Google Drive: extract file ID from various formats
        let fileId = null;
        // Format: https://drive.google.com/file/d/FILE_ID/view
        const match1 = url.match(/drive\.google\.com\/file\/d\/([a-zA-Z0-9_-]+)/);
        if (match1) fileId = match1[1];
        // Format: https://drive.google.com/open?id=FILE_ID
        const match2 = url.match(/drive\.google\.com\/open\?id=([a-zA-Z0-9_-]+)/);
        if (match2) fileId = match2[1];
        // Format: https://drive.google.com/uc?id=FILE_ID
        const match3 = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
        if (match3) fileId = match3[1];
        // Format: id=FILE_ID in any URL
        const match4 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
        if (!fileId && match4) fileId = match4[1];

        if (fileId) {
            return `https://lh3.googleusercontent.com/d/${fileId}`;
        }
        // Return as-is if not recognized
        return url;
    },

    _parseCSV(text) {
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        if (lines.length < 2) return []; // need header + at least 1 row

        const rows = [];
        for (let i = 1; i < lines.length; i++) { // skip header
            // Simple CSV parse (handles quoted fields with commas)
            const parts = [];
            let current = '';
            let inQuotes = false;
            for (const ch of lines[i]) {
                if (ch === '"') { inQuotes = !inQuotes; continue; }
                if (ch === ',' && !inQuotes) { parts.push(current.trim()); current = ''; continue; }
                current += ch;
            }
            parts.push(current.trim());

            // Columns: STT | Người chơi | Initial Rating | Avatar
            const name = parts[1]; // column B = Người chơi
            if (!name) continue;
            rows.push({
                name,
                department: 'Ban Kỹ Thuật',
                rating: Math.min(10, Math.max(1, parseFloat(parts[2]) || 5)), // column C = Initial Rating (1-10)
                avatarUrl: parts[3] || '' // column D = Avatar link
            });
        }
        return rows;
    },

    async _fetchGSheet(url) {
        if (!url) return;
        const sheetId = this._extractSheetId(url);
        if (!sheetId) {
            H.toast('Link Google Sheet không hợp lệ', 'danger');
            return;
        }

        // Show loading
        const grid = H.$('#player-grid');
        if (grid) {
            grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-8)">
                <div style="font-size:32px;animation:roulette-spin 0.8s linear infinite;display:inline-block">📊</div>
                <p class="mt-4" style="color:var(--accent);font-family:var(--font-heading)">Đang tải từ Google Sheet...</p>
            </div>`;
        }

        try {
            const csvUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv`;
            const response = await fetch(csvUrl);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const csvText = await response.text();
            const rows = this._parseCSV(csvText);

            if (!rows.length) {
                H.toast('Không tìm thấy dữ liệu trong Sheet', 'warning');
                this.render();
                return;
            }

            let players = this._gsheetReplace ? [] : (Store.get('players') || []);
            let count = 0;
            rows.forEach(row => {
                const avatar = this._driveDirectUrl(row.avatarUrl);
                const player = {
                    id: H.id(),
                    name: row.name,
                    department: row.department,
                    rating: row.rating
                };
                if (avatar) player.avatar = avatar;
                players.push(player);
                count++;
            });

            Store.set('players', players);
            App.closeModal();
            this.render();
            H.toast(`Đã import <strong>${count}</strong> VĐV từ Google Sheet!`, 'success');
        } catch (err) {
            console.error('GSheet fetch error:', err);
            H.toast('Lỗi tải Google Sheet. Kiểm tra Sheet đã publish to web chưa?', 'danger');
            this.render();
        }
    },

    deletePlayer(id) {
        const players = Store.get('players').filter(p => p.id !== id);
        Store.set('players', players);
        this.render();
        H.toast('Đã xóa VĐV', 'danger');
    }
};


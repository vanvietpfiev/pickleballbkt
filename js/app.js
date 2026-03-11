/* App - Main controller */
const App = {
    currentTab: 'dashboard',

    init() {
        this.bindNav();
        this.bindMobile();
        this.bindReset();
        this.bindQuickActions();
        this.bindFirebaseConfig();
        this.updateDashboard();
        this.renderTab('dashboard');

        // Re-render when Firebase syncs data from cloud
        Store.onAny((key) => {
            this.updateDashboard();
            if (key === 'sync') this.renderTab(this.currentTab);
        });
    },

    bindNav() {
        H.$$('.nav-item').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
                // Close mobile sidebar
                H.$('#sidebar').classList.remove('open');
                H.$('#hamburger-btn')?.classList.remove('active');
            });
        });
    },

    bindMobile() {
        const hamburger = H.$('#hamburger-btn');
        const sidebar = H.$('#sidebar');
        if (hamburger) {
            hamburger.addEventListener('click', () => {
                sidebar.classList.toggle('open');
                hamburger.classList.toggle('active');
            });
        }
        // Close sidebar on content click (mobile)
        H.$('#main-content')?.addEventListener('click', () => {
            if (sidebar.classList.contains('open')) {
                sidebar.classList.remove('open');
                hamburger?.classList.remove('active');
            }
        });
    },

    // Default admin password hash (bkt2026)
    _adminHash: null,

    _hashPassword(pw) {
        let hash = 0;
        for (let i = 0; i < pw.length; i++) {
            const ch = pw.charCodeAt(i);
            hash = ((hash << 5) - hash) + ch;
            hash |= 0;
        }
        return 'h_' + Math.abs(hash).toString(36);
    },

    bindReset() {
        H.$('#btn-reset-all')?.addEventListener('click', () => this.showAdminLogin());
    },

    showAdminLogin() {
        App.showModal('Xác Thực Admin', `
            <p style="font-size:var(--fs-sm);color:var(--text-secondary)">Nhập mật khẩu admin để thực hiện thao tác này.</p>
            <div class="input-group"><label for="admin-pw">Mật khẩu</label>
                <input class="input" id="admin-pw" type="password" placeholder="Nhập mật khẩu admin"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-danger" id="modal-save">Reset Giải Đấu</button>
            </div>
            <div style="margin-top:var(--space-4);border-top:1px solid var(--surface-border);padding-top:var(--space-4)">
                <button class="btn btn-sm btn-secondary" id="btn-change-pw" style="width:100%">Đổi Mật Khẩu Admin</button>
            </div>
        `);
        H.$('#admin-pw').focus();
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const pw = H.$('#admin-pw').value;
            const hash = this._hashPassword(pw);
            const savedHash = Store.get('adminHash') || this._hashPassword('bkt2026');
            if (hash === savedHash) {
                // Show confirmation step inside modal (no window.confirm)
                this._showResetConfirm();
            } else {
                H.toast('Sai mật khẩu admin!', 'danger');
                H.$('#admin-pw').value = '';
                H.$('#admin-pw').focus();
            }
        };
        H.$('#admin-pw').addEventListener('keydown', (e) => { if (e.key === 'Enter') H.$('#modal-save').click(); });
        H.$('#btn-change-pw').onclick = () => this._showChangePwModal();
    },

    _showResetConfirm() {
        App.showModal('⚠️ Xác Nhận Reset', `
            <div style="text-align:center;padding:var(--space-4) 0">
                <div style="font-size:48px;margin-bottom:var(--space-4)">🗑️</div>
                <p style="font-size:var(--fs-lg);font-weight:var(--fw-semibold);margin-bottom:var(--space-2)">Xóa toàn bộ dữ liệu giải đấu?</p>
                <p style="font-size:var(--fs-sm);color:var(--danger)">Thao tác này không thể hoàn tác!</p>
                <p style="font-size:var(--fs-xs);color:var(--text-muted);margin-top:var(--space-2)">VĐV, đội, kết quả, bảng đấu — tất cả sẽ bị xóa.</p>
            </div>
            <div class="modal-actions" style="justify-content:center;gap:var(--space-4)">
                <button class="btn btn-secondary btn-lg" id="modal-cancel">Không, giữ lại</button>
                <button class="btn btn-danger btn-lg" id="modal-save">Xóa hết, Reset!</button>
            </div>
        `);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            Store.reset();
            App.closeModal();
            this.switchTab('dashboard');
            H.toast('Đã reset giải đấu thành công!', 'danger');
        };
    },

    _showChangePwModal() {
        App.showModal('Đổi Mật Khẩu Admin', `
            <div class="input-group"><label for="old-pw">Mật khẩu cũ</label>
                <input class="input" id="old-pw" type="password" placeholder="Mật khẩu hiện tại"></div>
            <div class="input-group"><label for="new-pw">Mật khẩu mới</label>
                <input class="input" id="new-pw" type="password" placeholder="Mật khẩu mới"></div>
            <div class="input-group"><label for="confirm-pw">Xác nhận mật khẩu mới</label>
                <input class="input" id="confirm-pw" type="password" placeholder="Nhập lại mật khẩu mới"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Đổi Mật Khẩu</button>
            </div>
        `);
        H.$('#old-pw').focus();
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const oldPw = H.$('#old-pw').value;
            const newPw = H.$('#new-pw').value;
            const confirmPw = H.$('#confirm-pw').value;
            const savedHash = Store.get('adminHash') || this._hashPassword('bkt2026');
            if (this._hashPassword(oldPw) !== savedHash) { H.toast('Sai mật khẩu cũ!', 'danger'); return; }
            if (!newPw || newPw.length < 4) { H.toast('Mật khẩu mới phải >= 4 ký tự', 'warning'); return; }
            if (newPw !== confirmPw) { H.toast('Mật khẩu xác nhận không khớp', 'warning'); return; }
            Store.set('adminHash', this._hashPassword(newPw));
            App.closeModal();
            H.toast('Đã đổi mật khẩu admin!', 'success');
        };
    },

    bindQuickActions() {
        document.addEventListener('click', (e) => {
            const btn = e.target.closest('[data-goto]');
            if (btn) this.switchTab(btn.dataset.goto);
        });
    },

    switchTab(tab) {
        this.currentTab = tab;
        H.$$('.nav-item').forEach(n => n.classList.toggle('active', n.dataset.tab === tab));
        H.$$('.tab-content').forEach(t => t.classList.toggle('active', t.id === `tab-${tab}`));

        const titles = {
            dashboard: ['Tổng Quan', 'Giải Pickleball Ban Kỹ Thuật 2026'],
            players: ['Vận Động Viên', 'Quản lý danh sách VĐV'],
            teams: ['Chia Đội', 'Chia đội theo điểm cân bằng'],
            bracket: ['Bảng Đấu', 'Vòng bảng & vòng loại trực tiếp'],
            scoring: ['Kết Quả', 'Cập nhật tỉ số trận đấu'],
            standings: ['Xếp Hạng', 'Bảng xếp hạng tổng hợp']
        };
        H.$('#page-title').textContent = titles[tab]?.[0] || '';
        H.$('#page-subtitle').textContent = titles[tab]?.[1] || '';

        this.renderTab(tab);
    },

    renderTab(tab) {
        switch(tab) {
            case 'dashboard': this.updateDashboard(); break;
            case 'players': Players.render(); break;
            case 'teams': Teams.render(); break;
            case 'bracket': Bracket.render(); break;
            case 'scoring': Scoring.render(); break;
            case 'standings': Standings.render(); break;
        }
    },

    updateDashboard() {
        const players = Store.get('players') || [];
        const teams = Store.get('teams') || [];
        const matches = Store.get('matches') || [];
        const ko = Store.get('knockoutMatches') || [];
        const allMatches = [...matches, ...ko];
        const done = allMatches.filter(m => m.status === 'done');
        const phase = Store.get('tournamentPhase');

        H.$('#stat-total-players').textContent = players.length;
        H.$('#stat-total-teams').textContent = teams.length;
        H.$('#stat-total-matches').textContent = allMatches.length;
        H.$('#stat-completed-matches').textContent = done.length;

        // Status badge
        const statusEl = H.$('#tournament-status');
        const dotEl = H.$('.badge-dot');
        if (phase === 'setup') { statusEl.textContent = 'Chưa bắt đầu'; }
        else if (phase === 'group') { statusEl.textContent = 'Vòng bảng'; dotEl?.classList.add('active'); }
        else if (phase === 'knockout') { statusEl.textContent = 'Knockout'; dotEl?.classList.add('active'); }
        else if (phase === 'finished') { statusEl.textContent = 'Đã kết thúc'; dotEl?.classList.add('finished'); dotEl?.classList.remove('active'); }

        // Recent results
        const recent = H.$('#recent-results');
        if (recent) {
            const last5 = done.slice(-5).reverse();
            if (!last5.length) {
                recent.innerHTML = '<p class="empty-state">Chưa có kết quả nào</p>';
            } else {
                recent.innerHTML = last5.map(m => {
                    const t1 = teams.find(t=>t.id===m.team1);
                    const t2 = teams.find(t=>t.id===m.team2);
                    const n = (team) => team ? team.members.map(id=>{const p=players.find(x=>x.id===id);return p?p.name.split(' ').pop():'?';}).join(' & ') : '???';
                    const sc = (m.sets||[]).map(s=>`${s[0]}-${s[1]}`).join(', ');
                    return `<div class="result-item">
                        <div class="result-teams"><span${m.winner===m.team1?' style="color:var(--success);font-weight:600"':''}>${n(t1)}</span>
                        <span class="result-score">${sc}</span>
                        <span${m.winner===m.team2?' style="color:var(--success);font-weight:600"':''}>${n(t2)}</span></div></div>`;
                }).join('');
            }
        }
    },

    showModal(title, bodyHtml) {
        H.$('#modal-title').textContent = title;
        H.$('#modal-body').innerHTML = bodyHtml;
        H.$('#modal-overlay').style.display = 'flex';
        H.$('#modal-close').onclick = () => this.closeModal();
        H.$('#modal-overlay').addEventListener('click', (e) => {
            if (e.target === H.$('#modal-overlay')) this.closeModal();
        });
    },

    closeModal() {
        H.$('#modal-overlay').style.display = 'none';
    },

    // ===== Google Apps Script Cloud Config =====
    bindFirebaseConfig() {
        H.$('#btn-firebase-config')?.addEventListener('click', () => this.showCloudConfigModal());
    },

    showCloudConfigModal() {
        const savedUrl = localStorage.getItem('vna_apps_script_url') || '';
        const isConnected = Store.isCloudConnected();
        App.showModal('☁️ Kết Nối Cloud (Google Sheet)', `
            <div style="margin-bottom:var(--space-3)">
                <div style="display:flex;align-items:center;gap:var(--space-2);margin-bottom:var(--space-3)">
                    <span style="font-size:24px">📊</span>
                    <div>
                        <p style="font-size:var(--fs-sm);font-weight:var(--fw-semibold)">Đồng bộ qua Google Sheet</p>
                        <p style="font-size:var(--fs-xs);color:${isConnected ? 'var(--success)' : 'var(--text-muted)'}">${isConnected ? '🟢 Đã kết nối' : '⚪ Chưa kết nối'}</p>
                    </div>
                </div>
                <div style="background:rgba(0,0,0,0.2);border-radius:var(--radius-md);padding:var(--space-3);font-size:var(--fs-xs);color:var(--text-secondary)">
                    <p style="color:var(--accent);font-weight:var(--fw-semibold);margin-bottom:var(--space-2)">Hướng dẫn (chỉ làm 1 lần):</p>
                    <p>1. Mở Google Sheet bất kỳ → <strong>Extensions → Apps Script</strong></p>
                    <p>2. Xóa code mặc định, dán code từ file <strong>google_apps_script.js</strong></p>
                    <p>3. <strong>Deploy → New deployment</strong></p>
                    <p>&nbsp;&nbsp;&nbsp;→ Type: <strong>Web app</strong></p>
                    <p>&nbsp;&nbsp;&nbsp;→ Execute as: <strong>Me</strong></p>
                    <p>&nbsp;&nbsp;&nbsp;→ Who has access: <strong>Anyone</strong></p>
                    <p>4. Copy URL deployment → dán vào bên dưới</p>
                    <p style="margin-top:var(--space-2);color:var(--success)">✅ 100% miễn phí, không giới hạn!</p>
                </div>
            </div>
            <div class="input-group"><label>URL Google Apps Script</label>
                <input class="input" id="gas-url" placeholder="https://script.google.com/macros/s/.../exec" value="${savedUrl}"></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                ${isConnected ? '<button class="btn btn-secondary" id="btn-sync-now">↻ Đồng bộ ngay</button>' : ''}
                <button class="btn btn-primary" id="modal-save">${isConnected ? 'Cập Nhật' : 'Kết Nối'}</button>
            </div>
        `);
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#btn-sync-now')?.addEventListener('click', async () => {
            H.toast('Đang đồng bộ...', 'info');
            await Store.syncNow();
            App.closeModal();
            this.renderTab(this.currentTab);
            H.toast('📡 Đã đồng bộ dữ liệu!', 'success');
        });
        H.$('#modal-save').onclick = async () => {
            const url = H.$('#gas-url').value.trim();
            if (!url || !url.includes('script.google.com')) {
                H.toast('URL không hợp lệ. Phải là link script.google.com', 'warning');
                return;
            }
            Store.setApiUrl(url);
            H.toast('☁️ Đang kết nối...', 'info');
            // Push current data to cloud
            await Store._saveCloud();
            App.closeModal();
            H.toast('✅ Đã kết nối & đồng bộ lên Google Sheet!', 'success');
        };
    }
};

document.addEventListener('DOMContentLoaded', () => App.init());

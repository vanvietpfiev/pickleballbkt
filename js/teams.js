/* Teams Module - Score-balanced team splitting with pre-formed support */
const Teams = {
    render() {
        const container = H.$('#tab-teams');
        const players = Store.get('players') || [];
        const teams = Store.get('teams') || [];
        const preformed = Store.get('preformedPairs') || [];

        container.innerHTML = `
            <div class="section-header">
                <div>
                    <h2 style="font-family:var(--font-heading);font-size:var(--fs-xl);margin-bottom:var(--space-1)">Chia Đội</h2>
                    <p class="text-muted" style="font-size:var(--fs-sm)">${players.length} VĐV | ${preformed.length} cặp ghép sẵn | ${teams.length} đội đã chia</p>
                </div>
                <div class="section-header-actions">
                    <button class="btn btn-secondary" id="btn-preform" ${players.length < 2 ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                        Ghép Sẵn
                    </button>
                    <button class="btn btn-primary" id="btn-draw-teams" ${players.length < 4 ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/></svg>
                        Bốc Thăm Chia Đội
                    </button>
                </div>
            </div>
            ${preformed.length ? `<div class="toolbar mb-4"><span style="font-size:var(--fs-xs);color:var(--text-secondary)">Đội ghép sẵn:</span>
                ${preformed.map(pair => {
                    const p1 = players.find(p => p.id === pair[0]);
                    const p2 = players.find(p => p.id === pair[1]);
                    return p1 && p2 ? `<span class="preformed-badge">${p1.name.split(' ').pop()} & ${p2.name.split(' ').pop()}
                        <span class="chip-close" data-remove-pair="${pair[0]}-${pair[1]}">&times;</span></span>` : '';
                }).join('')}</div>` : ''}
            <div class="team-grid" id="team-grid"></div>
        `;

        this._renderTeams(teams, players);
        H.$('#btn-draw-teams')?.addEventListener('click', () => this.drawTeams());
        H.$('#btn-preform')?.addEventListener('click', () => this.showPreformModal());
        container.querySelectorAll('[data-remove-pair]').forEach(btn => {
            btn.addEventListener('click', () => {
                const [a, b] = btn.dataset.removePair.split('-');
                const pf = Store.get('preformedPairs').filter(p => !(p[0]===a && p[1]===b));
                Store.set('preformedPairs', pf);
                this.render();
            });
        });
    },

    _renderTeams(teams, players) {
        const grid = H.$('#team-grid');
        if (!teams.length) {
            grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
                <p>Chưa chia đội</p><p class="mt-2">Cần ít nhất <strong>4 VĐV</strong> để chia đội đôi</p></div>`;
            return;
        }
        grid.innerHTML = teams.map((t, i) => `
            <div class="team-card animate-card-enter" style="animation-delay:${i*80}ms">
                <div class="team-header">
                    <span class="team-name">Đội ${i+1}</span>
                    <span class="team-rating badge badge-gold">Σ ${t.totalRating.toFixed(1)}</span>
                </div>
                <div class="team-players">
                    ${t.members.map(m => {
                        const p = players.find(x=> x.id === m);
                        return p ? `<div class="team-player"><span>${p.name}</span><span class="team-player-rating">${p.rating.toFixed(1)} ★</span></div>` : '';
                    }).join('')}
                </div>
            </div>
        `).join('');
    },

    showPreformModal() {
        const players = Store.get('players');
        const preformed = Store.get('preformedPairs') || [];
        const pairedIds = preformed.flat();
        const available = players.filter(p => !pairedIds.includes(p.id));
        
        if (available.length < 2) { H.toast('Không đủ VĐV để ghép', 'warning'); return; }

        App.showModal('Ghép Đội Sẵn', `
            <p style="font-size:var(--fs-sm);color:var(--text-secondary)">Chọn 2 VĐV để ghép thành 1 đội cố định</p>
            <div class="input-group"><label>VĐV 1</label>
                <select class="select" id="pair-p1">${available.map(p => `<option value="${p.id}">${p.name} (${p.rating})</option>`).join('')}</select></div>
            <div class="input-group"><label>VĐV 2</label>
                <select class="select" id="pair-p2">${available.map(p => `<option value="${p.id}">${p.name} (${p.rating})</option>`).join('')}</select></div>
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Ghép</button></div>
        `);
        if (available.length > 1) H.$('#pair-p2').selectedIndex = 1;
        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => {
            const a = H.$('#pair-p1').value, b = H.$('#pair-p2').value;
            if (a === b) { H.toast('Chọn 2 người khác nhau', 'warning'); return; }
            preformed.push([a, b]);
            Store.set('preformedPairs', preformed);
            App.closeModal();
            this.render();
            H.toast('Đã ghép đội', 'success');
        };
    },

    async drawTeams() {
        const players = Store.get('players');
        if (players.length < 4) { H.toast('Cần ít nhất 4 VĐV', 'warning'); return; }
        if (players.length % 2 !== 0) { H.toast('Số VĐV phải chẵn để chia đội đôi', 'warning'); return; }

        const grid = H.$('#team-grid');
        grid.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:var(--space-12)">
            <div style="font-size:48px;animation:roulette-spin 0.15s linear infinite;display:inline-block">🎲</div>
            <p class="mt-4" style="color:var(--accent);font-family:var(--font-heading);font-size:var(--fs-lg)">Đang bốc thăm...</p></div>`;
        await H.delay(1500);

        const preformed = Store.get('preformedPairs') || [];
        const teams = this._balancedSplit(players, preformed);
        Store.set('teams', teams);
        this.render();
        H.toast(`Đã chia thành <strong>${teams.length}</strong> đội`, 'success');
    },

    _balancedSplit(players, preformedPairs) {
        const teams = [];
        const used = new Set();

        // 1. Lock pre-formed pairs
        preformedPairs.forEach(pair => {
            const [a, b] = pair;
            if (players.find(p=>p.id===a) && players.find(p=>p.id===b)) {
                const ra = players.find(p=>p.id===a).rating;
                const rb = players.find(p=>p.id===b).rating;
                teams.push({ id: H.id(), members: [a, b], totalRating: ra + rb, locked: true });
                used.add(a); used.add(b);
            }
        });

        // 2. Remaining players sorted by rating desc
        const remaining = players.filter(p => !used.has(p.id)).sort((a,b) => b.rating - a.rating);

        // 3. Greedy pairing: strongest with weakest
        const pool = [...remaining];
        while (pool.length >= 2) {
            const top = pool.shift();
            const bottom = pool.pop();
            teams.push({
                id: H.id(),
                members: [top.id, bottom.id],
                totalRating: top.rating + bottom.rating,
                locked: false
            });
        }

        // Shuffle team order
        return H.shuffle(teams);
    }
};

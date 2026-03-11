/* Scoring Module - Match result entry with pickleball rules */
const Scoring = {
    render() {
        const container = H.$('#tab-scoring');
        const phase = Store.get('tournamentPhase');
        const matches = Store.get('matches') || [];
        const knockoutMatches = Store.get('knockoutMatches') || [];
        const teams = Store.get('teams') || [];
        const players = Store.get('players') || [];

        const allMatches = phase === 'knockout' || phase === 'finished'
            ? [...matches, ...knockoutMatches] : matches;
        const pending = allMatches.filter(m => m.status !== 'done');
        const done = allMatches.filter(m => m.status === 'done');

        container.innerHTML = `
            <div class="section-header"><div>
                <h2 style="font-family:var(--font-heading);font-size:var(--fs-xl);margin-bottom:var(--space-1)">Cập Nhật Kết Quả</h2>
                <p class="text-muted" style="font-size:var(--fs-sm)">${done.length}/${allMatches.length} trận đã hoàn thành</p>
            </div></div>
            ${!allMatches.length ? `<div class="empty-state"><p>Chưa có trận đấu. Hãy tạo bảng đấu trước.</p></div>` : ''}
            ${pending.length ? `<h3 style="font-family:var(--font-heading);color:var(--accent);margin-bottom:var(--space-4)">Trận Chưa Đấu</h3>
            <div class="match-grid mb-6" id="pending-matches"></div>` : ''}
            ${done.length ? `<h3 style="font-family:var(--font-heading);color:var(--text-secondary);margin-bottom:var(--space-4)">Đã Hoàn Thành</h3>
            <div class="match-grid" id="done-matches"></div>` : ''}
        `;

        if (pending.length) this._renderPending(pending, teams, players);
        if (done.length) this._renderDone(done, teams, players);
    },

    _getTeamName(team, players) {
        if (!team) return '???';
        return team.members.map(id => { const p = players.find(x=>x.id===id); return p ? p.name.split(' ').pop() : '?'; }).join(' & ');
    },

    _renderPending(matches, teams, players) {
        const grid = H.$('#pending-matches');
        grid.innerHTML = matches.map(m => {
            const t1 = teams.find(t=>t.id===m.team1);
            const t2 = teams.find(t=>t.id===m.team2);
            return `<div class="match-card">
                <div class="match-header"><span>Trận ${m.matchNum}</span>
                    <span class="badge badge-neutral">${m.round==='knockout'?'Knockout':'Vòng bảng'}</span></div>
                <div class="match-teams">
                    <div class="match-team"><div class="match-team-name">${this._getTeamName(t1, players)}</div></div>
                    <div class="match-vs">VS</div>
                    <div class="match-team"><div class="match-team-name">${this._getTeamName(t2, players)}</div></div>
                </div>
                <div style="text-align:center;margin-top:var(--space-4)">
                    <button class="btn btn-primary" data-enter-score="${m.id}">Nhập Kết Quả</button>
                </div></div>`;
        }).join('');
        grid.querySelectorAll('[data-enter-score]').forEach(btn =>
            btn.addEventListener('click', () => this.showScoreModal(btn.dataset.enterScore)));
    },

    _renderDone(matches, teams, players) {
        const grid = H.$('#done-matches');
        grid.innerHTML = matches.map(m => {
            const t1 = teams.find(t=>t.id===m.team1);
            const t2 = teams.find(t=>t.id===m.team2);
            const n1 = this._getTeamName(t1, players);
            const n2 = this._getTeamName(t2, players);
            const w1 = m.winner === m.team1 ? ' winner' : ' loser';
            const w2 = m.winner === m.team2 ? ' winner' : ' loser';
            const sets = (m.sets||[]).map((s,i)=>`<span class="set-score">S${i+1}: ${s[0]}-${s[1]}</span>`).join('');
            return `<div class="match-card" style="opacity:0.8">
                <div class="match-header"><span>Trận ${m.matchNum}</span><span class="badge badge-success">Xong</span></div>
                <div class="match-teams">
                    <div class="match-team${w1}"><div class="match-team-name">${n1}</div></div>
                    <div class="match-vs">VS</div>
                    <div class="match-team${w2}"><div class="match-team-name">${n2}</div></div>
                </div>
                <div class="match-sets">${sets}</div>
                <div style="text-align:center;margin-top:var(--space-3)">
                    <button class="btn btn-sm btn-secondary" data-edit-score="${m.id}">Sửa</button>
                </div></div>`;
        }).join('');
        grid.querySelectorAll('[data-edit-score]').forEach(btn =>
            btn.addEventListener('click', () => this.showScoreModal(btn.dataset.editScore)));
    },

    showScoreModal(matchId) {
        const matches = Store.get('matches');
        const knockoutMatches = Store.get('knockoutMatches') || [];
        let m = matches.find(x=>x.id===matchId) || knockoutMatches.find(x=>x.id===matchId);
        if (!m) return;
        const teams = Store.get('teams');
        const players = Store.get('players');
        const t1 = teams.find(t=>t.id===m.team1);
        const t2 = teams.find(t=>t.id===m.team2);
        const n1 = this._getTeamName(t1, players);
        const n2 = this._getTeamName(t2, players);
        const s = m.sets || [[], [], []];

        App.showModal(`Trận ${m.matchNum}: ${n1} vs ${n2}`, `
            <p style="font-size:var(--fs-xs);color:var(--text-secondary)">Best of 3 | Pickleball: 11 điểm, cách 2</p>
            ${[0,1,2].map(i => `
                <div style="display:flex;align-items:center;gap:var(--space-3);justify-content:center">
                    <span style="font-size:var(--fs-xs);color:var(--text-secondary);width:30px">Set ${i+1}</span>
                    <input class="score-input" id="s${i}a" type="number" min="0" max="30" value="${(s[i]&&s[i][0])||''}" placeholder="0">
                    <span style="color:var(--text-muted)">-</span>
                    <input class="score-input" id="s${i}b" type="number" min="0" max="30" value="${(s[i]&&s[i][1])||''}" placeholder="0">
                </div>
            `).join('')}
            <div class="modal-actions">
                <button class="btn btn-secondary" id="modal-cancel">Hủy</button>
                <button class="btn btn-primary" id="modal-save">Lưu Kết Quả</button>
            </div>
        `);

        H.$('#modal-cancel').onclick = () => App.closeModal();
        H.$('#modal-save').onclick = () => this._saveScore(matchId);
    },

    _saveScore(matchId) {
        const sets = [];
        let t1Wins = 0, t2Wins = 0;
        for (let i = 0; i < 3; i++) {
            const a = parseInt(H.$(`#s${i}a`).value) || 0;
            const b = parseInt(H.$(`#s${i}b`).value) || 0;
            if (a === 0 && b === 0) continue;
            sets.push([a, b]);
            if (a > b) t1Wins++; else if (b > a) t2Wins++;
        }

        if (sets.length < 2) { H.toast('Nhập ít nhất 2 set', 'warning'); return; }
        if (t1Wins === t2Wins && sets.length < 3) { H.toast('Cần set quyết định', 'warning'); return; }

        const matches = Store.get('matches');
        const knockoutMatches = Store.get('knockoutMatches') || [];
        let m = matches.find(x=>x.id===matchId);
        let isKnockout = false;
        if (!m) { m = knockoutMatches.find(x=>x.id===matchId); isKnockout = true; }
        if (!m) return;

        m.sets = sets;
        m.winner = t1Wins > t2Wins ? m.team1 : m.team2;
        m.status = 'done';

        if (isKnockout) Store.set('knockoutMatches', knockoutMatches);
        else Store.set('matches', matches);

        App.closeModal();
        this.render();
        Bracket.render();
        Standings.render();
        App.updateDashboard();

        // Check if tournament is complete
        if (isKnockout) {
            const allKODone = knockoutMatches.every(km => km.status === 'done');
            if (allKODone) {
                Store.set('tournamentPhase', 'finished');
                Standings.showCelebration();
            }
        }

        H.toast('Đã lưu kết quả!', 'success');
    }
};

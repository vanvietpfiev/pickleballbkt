/* Bracket Module - Round-robin groups + knockout */
const Bracket = {
    render() {
        const container = H.$('#tab-bracket');
        const teams = Store.get('teams') || [];
        const matches = Store.get('matches') || [];
        const phase = Store.get('tournamentPhase');
        const groups = Store.get('groups') || [];
        const knockoutMatches = Store.get('knockoutMatches') || [];
        const players = Store.get('players') || [];

        let html = `<div class="section-header"><div>
            <h2 style="font-family:var(--font-heading);font-size:var(--fs-xl);margin-bottom:var(--space-1)">Bảng Đấu</h2>
            <p class="text-muted" style="font-size:var(--fs-sm)">
                ${phase === 'setup' ? 'Chưa tạo bảng đấu' : phase === 'group' ? 'Vòng bảng' : phase === 'knockout' ? 'Vòng loại trực tiếp' : 'Kết thúc'}
            </p></div>
            <div class="section-header-actions">`;

        if (phase === 'setup' && teams.length >= 4)
            html += `<button class="btn btn-primary" id="btn-create-bracket">Tạo Bảng Đấu</button>`;
        if (phase === 'group') {
            const allDone = matches.every(m => m.status === 'done');
            if (allDone && matches.length > 0)
                html += `<button class="btn btn-primary" id="btn-start-knockout">Vào Vòng Knockout</button>`;
        }
        html += `</div></div>`;

        if (phase === 'setup') {
            html += `<div class="empty-state">
                <svg class="empty-state-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <rect x="2" y="3" width="8" height="4" rx="1"/><rect x="14" y="3" width="8" height="4" rx="1"/>
                <rect x="2" y="17" width="8" height="4" rx="1"/><rect x="14" y="17" width="8" height="4" rx="1"/>
                <path d="M6 7v4h12V7"/><path d="M6 17v-4h12v4"/></svg>
                <p>${teams.length < 4 ? 'Cần chia đội trước (≥4 đội)' : 'Bấm <strong>Tạo Bảng Đấu</strong> để bắt đầu'}</p></div>`;
        }

        if (phase === 'group' || phase === 'knockout' || phase === 'finished') {
            groups.forEach((group, gi) => {
                html += `<div class="group-section"><h3 class="group-title">Bảng ${String.fromCharCode(65+gi)}</h3>`;
                html += this._renderGroupTable(group, matches, teams, players);
                html += `<div class="match-grid mt-4">`;
                const gMatches = matches.filter(m => m.groupIndex === gi);
                gMatches.forEach(m => { html += this._renderMatchCard(m, teams, players); });
                html += `</div></div>`;
            });
        }

        if ((phase === 'knockout' || phase === 'finished') && knockoutMatches.length) {
            html += `<div class="group-section"><h3 class="group-title">Vòng Loại Trực Tiếp</h3>`;
            html += `<div class="match-grid">`;
            knockoutMatches.forEach(m => { html += this._renderMatchCard(m, teams, players); });
            html += `</div></div>`;
        }

        // Visual bracket tree — full tournament overview
        if (phase !== 'setup' && teams.length >= 4) {
            html += this._renderBracketTree(groups, matches, knockoutMatches, teams, players, phase);
        }

        container.innerHTML = html;
        H.$('#btn-create-bracket')?.addEventListener('click', () => this.createBracket());
        H.$('#btn-start-knockout')?.addEventListener('click', () => this.startKnockout());
    },

    _getTeamName(team, players) {
        if (!team) return '???';
        return team.members.map(id => { const p = players.find(x=>x.id===id); return p ? p.name.split(' ').pop() : '?'; }).join(' & ');
    },

    _renderGroupTable(group, matches, teams, players) {
        const standings = this._calcGroupStandings(group, matches, teams, players);
        let html = `<div class="table-wrapper"><table class="table"><thead><tr>
            <th style="width:40px">#</th><th>Đội</th><th style="text-align:center">Trận</th>
            <th style="text-align:center">Thắng</th><th style="text-align:center">Thua</th>
            <th style="text-align:center">HS Set</th><th style="text-align:center">HS Điểm</th>
            <th style="text-align:center">Điểm</th></tr></thead><tbody>`;
        standings.forEach((s, i) => {
            const isQ = i < 2;
            html += `<tr style="${isQ ? 'background:rgba(16,185,129,0.06)' : ''}">
                <td class="rank-cell ${i<3?'rank-'+(i+1):''}">${i+1}</td>
                <td><strong>${s.teamName}</strong></td>
                <td style="text-align:center">${s.played}</td>
                <td style="text-align:center;color:var(--success)">${s.wins}</td>
                <td style="text-align:center;color:var(--danger)">${s.losses}</td>
                <td style="text-align:center">${s.setDiff > 0 ? '+' : ''}${s.setDiff}</td>
                <td style="text-align:center">${s.pointDiff > 0 ? '+' : ''}${s.pointDiff}</td>
                <td style="text-align:center"><strong style="color:var(--accent)">${s.points}</strong></td></tr>`;
        });
        html += `</tbody></table></div>`;
        return html;
    },

    _renderMatchCard(m, teams, players) {
        const t1 = teams.find(t=>t.id===m.team1);
        const t2 = teams.find(t=>t.id===m.team2);
        const n1 = this._getTeamName(t1, players);
        const n2 = this._getTeamName(t2, players);
        const statusBadge = m.status === 'done' ? '<span class="badge badge-success">Xong</span>'
            : m.status === 'playing' ? '<span class="badge badge-info">Đang đấu</span>'
            : '<span class="badge badge-neutral">Chưa đấu</span>';

        let setsHtml = '';
        if (m.sets && m.sets.length) {
            setsHtml = `<div class="match-sets">${m.sets.map((s,i)=>`<span class="set-score">S${i+1}: ${s[0]}-${s[1]}</span>`).join('')}</div>`;
        }

        const w1 = m.winner === m.team1 ? ' winner' : m.winner === m.team2 ? ' loser' : '';
        const w2 = m.winner === m.team2 ? ' winner' : m.winner === m.team1 ? ' loser' : '';

        return `<div class="match-card">
            <div class="match-header"><span>Trận ${m.matchNum || ''}</span>${statusBadge}</div>
            <div class="match-teams">
                <div class="match-team${w1}"><div class="match-team-name">${n1}</div></div>
                <div class="match-vs">VS</div>
                <div class="match-team${w2}"><div class="match-team-name">${n2}</div></div>
            </div>${setsHtml}</div>`;
    },

    createBracket() {
        const teams = Store.get('teams');
        if (teams.length < 4) return;

        const numGroups = teams.length <= 6 ? 2 : teams.length <= 12 ? 3 : 4;
        const shuffled = H.shuffle([...teams]);
        const groups = Array.from({length: numGroups}, () => []);
        shuffled.forEach((t, i) => groups[i % numGroups].push(t.id));

        const matches = [];
        let matchNum = 1;
        groups.forEach((group, gi) => {
            for (let i = 0; i < group.length; i++) {
                for (let j = i+1; j < group.length; j++) {
                    matches.push({
                        id: H.id(), team1: group[i], team2: group[j],
                        groupIndex: gi, sets: [], winner: null, status: 'pending', matchNum: matchNum++
                    });
                }
            }
        });

        Store.set('groups', groups);
        Store.set('matches', matches);
        Store.set('tournamentPhase', 'group');
        this.render();
        H.toast('Đã tạo bảng đấu vòng bảng', 'success');
    },

    _calcGroupStandings(group, matches, teams, players) {
        return group.map(tid => {
            const team = teams.find(t=>t.id===tid);
            const name = this._getTeamName(team, players);
            const ms = matches.filter(m => (m.team1===tid || m.team2===tid) && m.status==='done');
            let wins=0, losses=0, setsWon=0, setsLost=0, pointsFor=0, pointsAgainst=0;
            ms.forEach(m => {
                if (m.winner === tid) wins++; else losses++;
                (m.sets||[]).forEach(s => {
                    const isT1 = m.team1===tid;
                    setsWon += (isT1 ? s[0] : s[1]) > (isT1 ? s[1] : s[0]) ? 1 : 0;
                    setsLost += (isT1 ? s[0] : s[1]) < (isT1 ? s[1] : s[0]) ? 1 : 0;
                    pointsFor += isT1 ? s[0] : s[1];
                    pointsAgainst += isT1 ? s[1] : s[0];
                });
            });
            return { teamId: tid, teamName: name, played: ms.length, wins, losses,
                setDiff: setsWon-setsLost, pointDiff: pointsFor-pointsAgainst, points: wins*3 };
        }).sort((a,b) => b.points-a.points || b.setDiff-a.setDiff || b.pointDiff-a.pointDiff);
    },

    startKnockout() {
        const groups = Store.get('groups');
        const matches = Store.get('matches');
        const teams = Store.get('teams');
        const players = Store.get('players');

        const qualified = [];
        groups.forEach(g => {
            const standings = this._calcGroupStandings(g, matches, teams, players);
            qualified.push(standings[0]?.teamId, standings[1]?.teamId);
        });
        const valid = qualified.filter(Boolean);

        const knockoutMatches = [];
        let matchNum = matches.length + 1;
        for (let i = 0; i < valid.length; i += 2) {
            if (valid[i+1]) {
                knockoutMatches.push({
                    id: H.id(), team1: valid[i], team2: valid[i+1],
                    sets: [], winner: null, status: 'pending', matchNum: matchNum++,
                    round: 'knockout'
                });
            }
        }

        Store.set('knockoutMatches', knockoutMatches);
        Store.set('tournamentPhase', 'knockout');
        this.render();
        H.toast('Đã vào vòng loại trực tiếp!', 'success');
    },

    _renderBracketTree(groups, matches, knockoutMatches, teams, players, phase) {
        let html = `<div class="group-section">
            <h3 class="group-title" style="display:flex;align-items:center;gap:var(--space-2)">
                <svg viewBox="0 0 24 24" fill="none" stroke="var(--accent)" stroke-width="2" width="22" height="22">
                    <rect x="2" y="3" width="8" height="4" rx="1"/><rect x="14" y="3" width="8" height="4" rx="1"/>
                    <rect x="2" y="17" width="8" height="4" rx="1"/><rect x="14" y="17" width="8" height="4" rx="1"/>
                    <path d="M6 7v4h12V7"/><path d="M6 17v-4h12v4"/><line x1="12" y1="11" x2="12" y2="13"/>
                </svg>
                Sơ Đồ Giải Đấu
            </h3>
            <div class="bracket-tree-scroll">
                <div class="bracket-tree">`;

        // COLUMN 1: Group stage results
        html += `<div class="bracket-col">
            <div class="bracket-col-title">VÒNG BẢNG</div>`;
        const qualifiedMap = {};
        groups.forEach((group, gi) => {
            const standings = this._calcGroupStandings(group, matches, teams, players);
            html += `<div class="bt-group">
                <div class="bt-group-label">Bảng ${String.fromCharCode(65 + gi)}</div>`;
            standings.forEach((s, si) => {
                const isQ = si < 2;
                if (isQ) qualifiedMap[s.teamId] = { group: gi, rank: si + 1, name: s.teamName };
                html += `<div class="bt-team-slot ${isQ ? 'bt-qualified' : 'bt-eliminated'}">
                    <span class="bt-team-name">${s.teamName}</span>
                    <span class="bt-team-pts">${s.points}đ</span>
                </div>`;
            });
            html += `</div>`;
        });
        html += `</div>`;

        // COLUMN 2: Connector arrows
        html += `<div class="bracket-col bracket-col-connector">
            <div class="bracket-col-title" style="opacity:0">→</div>`;
        for (let gi = 0; gi < groups.length; gi++) {
            html += `<div class="bt-connector">
                <div class="bt-connector-line"></div>
                <div class="bt-connector-arrow">▶</div>
            </div>`;
        }
        html += `</div>`;

        // COLUMN 3: Knockout matches
        html += `<div class="bracket-col">
            <div class="bracket-col-title">KNOCKOUT</div>`;
        if (knockoutMatches.length > 0) {
            knockoutMatches.forEach(m => {
                const t1 = teams.find(t => t.id === m.team1);
                const t2 = teams.find(t => t.id === m.team2);
                const n1 = this._getTeamName(t1, players);
                const n2 = this._getTeamName(t2, players);
                const sc = m.status === 'done' ? (m.sets || []).map(s => `${s[0]}-${s[1]}`).join(' / ') : '';
                const w1 = m.winner === m.team1 ? ' bt-winner' : m.winner ? ' bt-loser' : '';
                const w2 = m.winner === m.team2 ? ' bt-winner' : m.winner ? ' bt-loser' : '';
                html += `<div class="bt-ko-match">
                    <div class="bt-ko-team${w1}"><span>${n1}</span>${sc ? `<span class="bt-ko-score">${m.winner === m.team1 ? 'W' : 'L'}</span>` : ''}</div>
                    <div class="bt-ko-vs">VS</div>
                    <div class="bt-ko-team${w2}"><span>${n2}</span>${sc ? `<span class="bt-ko-score">${m.winner === m.team2 ? 'W' : 'L'}</span>` : ''}</div>
                    ${sc ? `<div class="bt-ko-sets">${sc}</div>` : '<div class="bt-ko-sets" style="color:var(--text-muted)">Chưa đấu</div>'}
                </div>`;
            });
        } else {
            for (let gi = 0; gi < groups.length; gi++) {
                html += `<div class="bt-ko-match bt-ko-pending">
                    <div class="bt-ko-team"><span>Nhất bảng ${String.fromCharCode(65 + gi)}</span></div>
                    <div class="bt-ko-vs">VS</div>
                    <div class="bt-ko-team"><span>${gi + 1 < groups.length ? 'Nhì bảng ' + String.fromCharCode(66 + gi) : 'Nhì bảng A'}</span></div>
                    <div class="bt-ko-sets" style="color:var(--text-muted)">Chờ vòng bảng</div>
                </div>`;
            }
        }
        html += `</div>`;

        // COLUMN 4: Connector to champion
        html += `<div class="bracket-col bracket-col-connector">
            <div class="bracket-col-title" style="opacity:0">→</div>
            <div class="bt-connector"><div class="bt-connector-line"></div><div class="bt-connector-arrow">▶</div></div>
        </div>`;

        // COLUMN 5: Champion
        const champion = phase === 'finished' && knockoutMatches.length
            ? (() => {
                const lastMatch = knockoutMatches[knockoutMatches.length - 1];
                if (lastMatch && lastMatch.winner) {
                    const wTeam = teams.find(t => t.id === lastMatch.winner);
                    return this._getTeamName(wTeam, players);
                }
                return null;
            })() : null;

        html += `<div class="bracket-col">
            <div class="bracket-col-title">VÔ ĐỊCH</div>
            <div class="bt-champion ${champion ? 'bt-champion-filled animate-glow' : ''}">
                <div class="bt-champion-trophy">${champion ? '🏆' : '🏆'}</div>
                <div class="bt-champion-name">${champion || '???'}</div>
            </div>
        </div>`;

        html += `</div></div></div>`;
        return html;
    }
};

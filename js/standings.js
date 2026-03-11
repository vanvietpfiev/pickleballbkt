/* Standings Module - Rankings + Celebration */
const Standings = {
    render() {
        const container = H.$('#tab-standings');
        const phase = Store.get('tournamentPhase');
        const teams = Store.get('teams') || [];
        const matches = Store.get('matches') || [];
        const knockoutMatches = Store.get('knockoutMatches') || [];
        const players = Store.get('players') || [];

        let html = `<div class="section-header"><div>
            <h2 style="font-family:var(--font-heading);font-size:var(--fs-xl);margin-bottom:var(--space-1)">Bảng Xếp Hạng</h2>
            <p class="text-muted" style="font-size:var(--fs-sm)">${phase === 'finished' ? 'Giải đấu đã kết thúc' : 'Cập nhật realtime'}</p>
        </div>
        ${phase === 'finished' ? `<div class="section-header-actions">
            <button class="btn btn-primary" id="btn-show-celebration">Vinh Danh</button>
        </div>` : ''}</div>`;

        if (phase === 'setup' || !teams.length) {
            html += `<div class="empty-state"><p>Chưa có dữ liệu xếp hạng</p></div>`;
        } else {
            const all = this._getOverallStandings(teams, matches, knockoutMatches, players);
            html += `<div class="table-wrapper"><table class="table"><thead><tr>
                <th style="width:50px">#</th><th>Đội</th><th style="text-align:center">Trận</th>
                <th style="text-align:center">W</th><th style="text-align:center">L</th>
                <th style="text-align:center">HS Set</th><th style="text-align:center">HS Điểm</th>
                <th style="text-align:center">Điểm</th></tr></thead><tbody>`;
            all.forEach((s, i) => {
                const medal = i===0 ? '🥇' : i===1 ? '🥈' : i===2 ? '🥉' : '';
                html += `<tr class="animate-card-enter" style="animation-delay:${i*60}ms;${i<3?'background:rgba(212,168,67,0.04)':''}">
                    <td class="rank-cell ${i<3?'rank-'+(i+1):''}">${medal || i+1}</td>
                    <td><strong>${s.teamName}</strong></td>
                    <td style="text-align:center">${s.played}</td>
                    <td style="text-align:center;color:var(--success)">${s.wins}</td>
                    <td style="text-align:center;color:var(--danger)">${s.losses}</td>
                    <td style="text-align:center">${s.setDiff>0?'+':''}${s.setDiff}</td>
                    <td style="text-align:center">${s.pointDiff>0?'+':''}${s.pointDiff}</td>
                    <td style="text-align:center"><strong style="color:var(--accent)">${s.points}</strong></td></tr>`;
            });
            html += `</tbody></table></div>`;
        }

        container.innerHTML = html;
        H.$('#btn-show-celebration')?.addEventListener('click', () => this.showCelebration());
    },

    _getTeamName(team, players) {
        if (!team) return '???';
        return team.members.map(id => { const p = players.find(x=>x.id===id); return p ? p.name.split(' ').pop() : '?'; }).join(' & ');
    },

    _getOverallStandings(teams, matches, knockoutMatches, players) {
        const allMatches = [...matches, ...knockoutMatches].filter(m => m.status === 'done');
        return teams.map(team => {
            const tid = team.id;
            const name = this._getTeamName(team, players);
            const ms = allMatches.filter(m => m.team1===tid || m.team2===tid);
            let wins=0, losses=0, sW=0, sL=0, pF=0, pA=0;
            ms.forEach(m => {
                if (m.winner===tid) wins++; else losses++;
                (m.sets||[]).forEach(s => {
                    const isT1 = m.team1===tid;
                    sW += (isT1?s[0]:s[1]) > (isT1?s[1]:s[0]) ? 1 : 0;
                    sL += (isT1?s[0]:s[1]) < (isT1?s[1]:s[0]) ? 1 : 0;
                    pF += isT1?s[0]:s[1]; pA += isT1?s[1]:s[0];
                });
            });
            // Knockout wins more valuable
            const koWins = knockoutMatches.filter(m=>m.status==='done'&&m.winner===tid).length;
            return { teamId: tid, teamName: name, played: ms.length, wins, losses,
                setDiff: sW-sL, pointDiff: pF-pA, points: wins*3 + koWins*2 };
        }).sort((a,b) => b.points-a.points || b.setDiff-a.setDiff || b.pointDiff-a.pointDiff);
    },

    showCelebration() {
        const teams = Store.get('teams') || [];
        const matches = Store.get('matches') || [];
        const ko = Store.get('knockoutMatches') || [];
        const players = Store.get('players') || [];
        const standings = this._getOverallStandings(teams, matches, ko, players);
        if (standings.length < 2) return;

        const top3 = standings.slice(0, 3);
        const overlay = H.$('#celebration-overlay');
        const content = H.$('#celebration-content');

        content.innerHTML = `
            <div class="celebration-trophy">🏆</div>
            <h2 class="celebration-title">CHÚC MỪNG!</h2>
            <p class="celebration-subtitle">Giải Pickleball Ban Kỹ Thuật 2026</p>
            <div class="podium">
                ${top3[1] ? `<div class="podium-place podium-2">
                    <div class="podium-team-name">${top3[1].teamName}</div>
                    <div class="podium-bar"><div class="podium-rank">🥈</div><div>Á Quân</div></div>
                </div>` : ''}
                <div class="podium-place podium-1">
                    <div class="podium-team-name">${top3[0].teamName}</div>
                    <div class="podium-bar animate-glow"><div class="podium-rank">🥇</div><div>Vô Địch</div></div>
                </div>
                ${top3[2] ? `<div class="podium-place podium-3">
                    <div class="podium-team-name">${top3[2].teamName}</div>
                    <div class="podium-bar"><div class="podium-rank">🥉</div><div>Hạng Ba</div></div>
                </div>` : ''}
            </div>
            <button class="btn btn-primary btn-lg mt-8" id="btn-close-celebration" style="margin:var(--space-8) auto 0">Đóng</button>
        `;

        overlay.style.display = 'flex';
        this._fireConfetti();
        H.$('#btn-close-celebration').addEventListener('click', () => {
            overlay.style.display = 'none';
            this._stopConfetti();
        });
    },

    _confettiInterval: null,
    _fireConfetti() {
        const canvas = H.$('#confetti-canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        const particles = [];
        const colors = ['#D4A843','#FFD700','#E8C97A','#002855','#10B981','#EF4444','#3B82F6','#F59E0B'];

        for (let i = 0; i < 150; i++) {
            particles.push({
                x: Math.random() * canvas.width, y: Math.random() * -canvas.height,
                w: Math.random()*8+4, h: Math.random()*6+3,
                vx: (Math.random()-0.5)*3, vy: Math.random()*3+2,
                rot: Math.random()*360, vr: (Math.random()-0.5)*8,
                color: colors[Math.floor(Math.random()*colors.length)],
                alpha: 1
            });
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx; p.y += p.vy; p.rot += p.vr;
                if (p.y > canvas.height) { p.y = -10; p.x = Math.random()*canvas.width; }
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rot * Math.PI/180);
                ctx.globalAlpha = p.alpha;
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.w/2, -p.h/2, p.w, p.h);
                ctx.restore();
            });
            this._confettiInterval = requestAnimationFrame(animate);
        };
        animate();
    },

    _stopConfetti() {
        if (this._confettiInterval) cancelAnimationFrame(this._confettiInterval);
        const canvas = H.$('#confetti-canvas');
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
};

/* Helpers - utility functions */
const H = {
    id: () => Date.now().toString(36) + Math.random().toString(36).substr(2, 5),

    $(sel, ctx = document) { return ctx.querySelector(sel); },
    $$(sel, ctx = document) { return [...ctx.querySelectorAll(sel)]; },

    el(tag, attrs = {}, children = []) {
        const e = document.createElement(tag);
        Object.entries(attrs).forEach(([k, v]) => {
            if (k === 'className') e.className = v;
            else if (k === 'innerHTML') e.innerHTML = v;
            else if (k === 'textContent') e.textContent = v;
            else if (k.startsWith('on')) e.addEventListener(k.slice(2).toLowerCase(), v);
            else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
            else e.setAttribute(k, v);
        });
        children.forEach(c => { if (typeof c === 'string') e.appendChild(document.createTextNode(c)); else if (c) e.appendChild(c); });
        return e;
    },

    initials(name) {
        return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
    },

    shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
        return a;
    },

    ratingStars(rating) {
        const full = Math.floor(rating);
        const half = rating % 1 >= 0.5 ? 1 : 0;
        return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - half);
    },

    ratingColor(rating) {
        if (rating >= 8) return '#10B981';
        if (rating >= 5) return '#D4A843';
        if (rating >= 3) return '#F59E0B';
        return '#94A3B8';
    },

    delay(ms) { return new Promise(r => setTimeout(r, ms)); },

    confirm(msg) { return window.confirm(msg); },

    toast(message, type = 'info') {
        const existing = H.$('.toast');
        if (existing) existing.remove();
        const colors = { success: 'var(--success)', danger: 'var(--danger)', info: 'var(--accent)', warning: 'var(--warning)' };
        const toast = H.el('div', {
            className: 'toast',
            innerHTML: message,
            style: {
                position: 'fixed', bottom: '24px', right: '24px', padding: '12px 20px',
                background: 'rgba(10,22,40,0.95)', border: `1px solid ${colors[type] || colors.info}`,
                borderRadius: '10px', color: '#F1F5F9', fontSize: '0.875rem',
                zIndex: '100', backdropFilter: 'blur(12px)', boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                animation: 'slide-in-right 0.3s ease', maxWidth: '360px',
                fontFamily: "'DM Sans', sans-serif"
            }
        });
        document.body.appendChild(toast);
        setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.3s'; setTimeout(() => toast.remove(), 300); }, 3000);
    }
};

/* Store - localStorage-backed state management with observer pattern */
const Store = {
    _data: {},
    _listeners: [],
    _key: 'vna_pickleball_v1',

    init() {
        try {
            const saved = localStorage.getItem(this._key);
            if (saved) this._data = JSON.parse(saved);
        } catch (e) { console.warn('Store load failed:', e); }
        if (!this._data.players) this._data.players = [];
        if (!this._data.teams) this._data.teams = [];
        if (!this._data.preformedPairs) this._data.preformedPairs = [];
        if (!this._data.matches) this._data.matches = [];
        if (!this._data.groups) this._data.groups = [];
        if (!this._data.knockoutMatches) this._data.knockoutMatches = [];
        if (!this._data.tournamentPhase) this._data.tournamentPhase = 'setup';
        if (!this._data.tournamentName) this._data.tournamentName = 'Giải Pickleball Ban Kỹ Thuật 2026';
    },

    get(key) { return this._data[key]; },

    set(key, value) {
        this._data[key] = value;
        this._save();
        this._notify(key);
    },

    _save() {
        try { localStorage.setItem(this._key, JSON.stringify(this._data)); }
        catch (e) { console.warn('Store save failed:', e); }
    },

    _notify(key) { this._listeners.forEach(l => { if (!l.key || l.key === key) l.fn(key, this._data[key]); }); },

    on(key, fn) { this._listeners.push({ key, fn }); },
    onAny(fn) { this._listeners.push({ key: null, fn }); },

    reset() {
        this._data = {};
        localStorage.removeItem(this._key);
        this.init();
        this._listeners.forEach(l => l.fn('reset', null));
    },

    getAll() { return { ...this._data }; }
};

Store.init();

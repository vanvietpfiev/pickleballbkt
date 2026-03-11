/* Store - Google Apps Script (Google Sheets) + localStorage
   Data is synced to Google Sheet via Apps Script Web App.
   localStorage serves as offline cache for instant load.
   100% miễn phí, không cần Firebase. */
const Store = {
    _data: {},
    _listeners: [],
    _key: 'vna_pickleball_v1',
    _apiUrl: null,
    _saving: false,
    _syncInterval: null,

    init() {
        // 1. Load from localStorage (instant, offline)
        try {
            const saved = localStorage.getItem(this._key);
            if (saved) this._data = JSON.parse(saved);
        } catch (e) { console.warn('Store load failed:', e); }
        this._ensureDefaults();

        // 2. Load API URL from localStorage
        this._apiUrl = localStorage.getItem('vna_apps_script_url') || null;

        // 3. If API URL exists, fetch latest data from cloud
        if (this._apiUrl) {
            this._loadCloud();
            // Auto-sync every 30 seconds for viewers
            this._syncInterval = setInterval(() => this._loadCloud(), 30000);
        }
    },

    _ensureDefaults() {
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
        this._saveLocal();
        this._saveCloud();
        this._notify(key);
    },

    _saveLocal() {
        try { localStorage.setItem(this._key, JSON.stringify(this._data)); }
        catch (e) { console.warn('localStorage save failed:', e); }
    },

    async _saveCloud() {
        if (!this._apiUrl || this._saving) return;
        this._saving = true;
        try {
            const resp = await fetch(this._apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: JSON.stringify(this._data)
            });
            if (resp.ok) {
                console.log('☁️ Saved to Google Sheet');
            }
        } catch (e) {
            console.warn('Cloud save failed:', e);
        } finally {
            this._saving = false;
        }
    },

    async _loadCloud() {
        if (!this._apiUrl) return;
        try {
            const resp = await fetch(this._apiUrl);
            if (!resp.ok) return;
            const cloudData = await resp.json();
            if (cloudData && cloudData.players) {
                this._data = cloudData;
                this._ensureDefaults();
                this._saveLocal();
                this._listeners.forEach(l => l.fn('sync', null));
                console.log('📡 Synced from Google Sheet');
            }
        } catch (e) {
            console.warn('Cloud load failed:', e);
        }
    },

    _notify(key) {
        this._listeners.forEach(l => {
            if (!l.key || l.key === key) l.fn(key, this._data[key]);
        });
    },

    on(key, fn) { this._listeners.push({ key, fn }); },
    onAny(fn) { this._listeners.push({ key: null, fn }); },

    reset() {
        this._data = {};
        localStorage.removeItem(this._key);
        this._ensureDefaults();
        this._saveCloud();
        this._listeners.forEach(l => l.fn('reset', null));
    },

    getAll() { return { ...this._data }; },

    isCloudConnected() { return !!this._apiUrl; },

    // Set Google Apps Script URL from UI
    setApiUrl(url) {
        this._apiUrl = url;
        localStorage.setItem('vna_apps_script_url', url);
        // Start auto-sync
        if (this._syncInterval) clearInterval(this._syncInterval);
        this._syncInterval = setInterval(() => this._loadCloud(), 30000);
    },

    // Force sync now
    async syncNow() {
        await this._loadCloud();
    }
};

Store.init();

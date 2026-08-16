window.playerPresence = {
    status: 'online',
    peerId: null,
    tokenHash: null,
    beatTimer: null,
    listTimer: null,

    canPublish() {
        return !!(window.playerProfile && playerProfile.hasRemote() && playerProfile.data && playerProfile.data.remote && playerProfile.data.secret);
    },

    async ensureHash() {
        if (!this.canPublish()) { this.tokenHash = null; return null; }
        this.tokenHash = await playerProfile.sha256(playerProfile.data.secret);
        return this.tokenHash;
    },

    async set(status, peerId) {
        this.status = status || 'online';
        this.peerId = peerId || null;
        if (window.playerDirectory) playerDirectory.announce();
        await this.push();
        this.ensureHeartbeat();
    },

    async push() {
        if (!this.canPublish()) return;
        let hash = await this.ensureHash();
        if (!hash) return;
        try {
            await playerProfile.client().rpc('set_presence', {
                p_tag: playerProfile.getTag(),
                p_token_hash: hash,
                p_peer_id: this.peerId || '',
                p_status: this.status
            });
        } catch (e) {}
    },

    async clear() {
        this.stopHeartbeat();
        if (!this.canPublish()) return;
        let hash = this.tokenHash || await this.ensureHash();
        if (!hash) return;
        let tag = playerProfile.getTag();
        let cfg = playerProfile.getConfig();
        try {
            fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/rpc/clear_presence', {
                method: 'POST',
                headers: {
                    apikey: cfg.anonKey,
                    Authorization: 'Bearer ' + cfg.anonKey,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ p_tag: tag, p_token_hash: hash }),
                keepalive: true
            });
        } catch (e) {}
        this.status = 'online';
        this.peerId = null;
    },

    ensureHeartbeat() {
        if (this.beatTimer) return;
        this.beatTimer = setInterval(() => this.push(), 12000);
    },

    stopHeartbeat() {
        if (this.beatTimer) { clearInterval(this.beatTimer); this.beatTimer = null; }
    },

    onVisibleMenu() {
        this.startListPolling();
        this.set('online', null);
        if (window.playerDirectory) playerDirectory.start();
    },

    startListPolling() {
        this.refreshList();
        if (this.listTimer) return;
        this.listTimer = setInterval(() => {
            let menu = document.getElementById('mode-selection');
            if (menu && menu.style.display !== 'none') this.refreshList();
        }, 8000);
    },

    statusLabel(status) {
        if (status === 'hosting') return 'Hoster';
        if (status === 'in_game') return 'I løp';
        return 'I menyen';
    },

    escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    },

    safePeerId(value) {
        let id = String(value || '').trim();
        return /^[A-Za-z0-9_-]{3,64}$/.test(id) ? id : '';
    },

    mergeRows(rows) {
        let byTag = {};
        (rows || []).forEach(r => {
            if (!r || !r.gamer_tag) return;
            byTag[(r.gamer_tag || '').toLowerCase()] = r;
        });
        return Object.keys(byTag).map(k => byTag[k]);
    },

    async refreshList() {
        let list = document.getElementById('presence-list');
        let hint = document.getElementById('presence-hint');
        if (!list) return;

        let rows = [];
        if (window.playerDirectory) rows = rows.concat(playerDirectory.roster || []);

        if (playerProfile.hasRemote() && playerProfile.data && playerProfile.data.remote) {
            try {
                let { data, error } = await playerProfile.client().rpc('list_online_players');
                if (!error) {
                    if (typeof data === 'string') { try { data = JSON.parse(data); } catch (e) { data = []; } }
                    if (Array.isArray(data)) rows = rows.concat(data);
                }
            } catch (e) {}
        }

        let me = (playerProfile.getTag() || '').toLowerCase();
        let others = this.mergeRows(rows).filter(r => {
            let tag = (r.gamer_tag || '').toLowerCase();
            return tag && tag !== me && !(window.isNoiseGamerTag && window.isNoiseGamerTag(r.gamer_tag));
        });

        if (hint) {
            let dirState = window.playerDirectory ? playerDirectory.state : 'idle';
            if (!playerProfile.getTag()) hint.textContent = 'Opprett en profil for å se andre.';
            else if (!playerProfile.hasRemote()) hint.textContent = 'Supabase er ikke koblet til, så listen er tom.';
            else if (!playerProfile.data || !playerProfile.data.remote) hint.textContent = 'Profilen er ikke synket til Supabase ennå.';
            else if (dirState === 'connecting' && !others.length) hint.textContent = 'Kobler til de andre spillerne…';
            else if (!others.length) hint.textContent = 'Ingen andre er online akkurat nå.';
            else hint.textContent = 'Trykk Bli med på den som hoster — du trenger ikke Host ID.';
        }

        list.innerHTML = others.map(r => {
            let peerId = this.safePeerId(r.peer_id);
            let joinable = !!(peerId && (r.status === 'hosting' || r.status === 'in_game'));
            let joinBtn = joinable
                ? `<button type="button" class="btn btn-green presence-join" data-peer="${peerId}">Bli med</button>`
                : '';
            return `<li>
                <div class="presence-who">
                    <strong>@${this.escapeHtml(r.gamer_tag)}</strong>
                    <span class="presence-status status-${this.escapeHtml(r.status)}">${this.statusLabel(r.status)}</span>
                </div>
                ${joinBtn}
            </li>`;
        }).join('');
    },

    bind() {
        let list = document.getElementById('presence-list');
        if (list) {
            list.addEventListener('click', e => {
                let btn = e.target.closest('.presence-join');
                if (!btn) return;
                let peerId = this.safePeerId(btn.getAttribute('data-peer'));
                if (peerId && typeof initJoiner === 'function') initJoiner(peerId);
            });
        }
        window.addEventListener('pagehide', () => this.clear());
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') this.push();
        });
    },

    init() {
        this.bind();
        if (window.playerDirectory) playerDirectory.onChange(() => this.refreshList());
        if (playerProfile && playerProfile.isReady()) this.onVisibleMenu();
    }
};

window.setGamePresence = function (status, peerId) {
    if (window.playerPresence) return playerPresence.set(status, peerId);
};

window.playerPresence.init();

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

    async refreshList() {
        let list = document.getElementById('presence-list');
        let hint = document.getElementById('presence-hint');
        if (!list) return;

        if (!playerProfile.hasRemote()) {
            if (hint) hint.textContent = 'Koble til Supabase for å se hvem som er online.';
            list.innerHTML = '';
            return;
        }
        if (!playerProfile.data || !playerProfile.data.remote) {
            if (hint) hint.textContent = 'Logg inn med en synket profil for å se andre.';
            list.innerHTML = '';
            return;
        }

        try {
            let { data, error } = await playerProfile.client().rpc('list_online_players');
            if (error) throw error;
            let rows = Array.isArray(data) ? data : [];
            let me = (playerProfile.getTag() || '').toLowerCase();
            let others = rows.filter(r => (r.gamer_tag || '').toLowerCase() !== me);

            if (hint) {
                hint.textContent = others.length
                    ? 'Trykk Bli med på den som hoster — du trenger ikke Host ID.'
                    : 'Ingen andre er online akkurat nå.';
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
        } catch (e) {
            if (hint) hint.textContent = 'Kunne ikke hente hvem som er online. Kjør supabase-schema.sql på nytt (steg 2).';
            list.innerHTML = '';
        }
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
        if (playerProfile && playerProfile.isReady()) this.onVisibleMenu();
    }
};

window.setGamePresence = function (status, peerId) {
    if (window.playerPresence) return playerPresence.set(status, peerId);
};

window.playerPresence.init();

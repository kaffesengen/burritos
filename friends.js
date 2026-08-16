window.playerFriends = {
    tokenHash: null,
    listTimer: null,
    busy: false,

    canUse() {
        return !!(window.playerProfile && playerProfile.hasRemote() && playerProfile.data && playerProfile.data.remote && playerProfile.data.secret);
    },

    async ensureHash() {
        if (!this.canUse()) { this.tokenHash = null; return null; }
        this.tokenHash = await playerProfile.sha256(playerProfile.data.secret);
        return this.tokenHash;
    },

    normalizeQuery(value) {
        let q = String(value || '').trim();
        if (q.charAt(0) === '@') q = q.slice(1);
        return q.trim();
    },

    escapeHtml(value) {
        return String(value == null ? '' : value).replace(/[&<>"']/g, ch => ({
            '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[ch]));
    },

    statusLabel(status) {
        if (status === 'hosting') return 'Hoster';
        if (status === 'in_game') return 'I løp';
        if (status === 'online') return 'I menyen';
        return 'Offline';
    },

    relationButton(relation) {
        if (relation === 'friends') return { label: 'Venn', action: '', disabled: true };
        if (relation === 'outgoing') return { label: 'Sendt', action: '', disabled: true };
        if (relation === 'incoming') return { label: 'Godta', action: 'accept', disabled: false };
        return { label: 'Legg til', action: 'request', disabled: false };
    },

    errorText(code) {
        if (code === 'not_found') return 'Ingen med den taggen.';
        if (code === 'self') return 'Du kan ikke legge til deg selv.';
        if (code === 'already_friends') return 'Dere er allerede venner.';
        if (code === 'already_sent') return 'Forespørsel er allerede sendt.';
        if (code === 'invalid_query') return 'Skriv minst to tegn.';
        if (code === 'not_pending') return 'Ingen ventende forespørsel.';
        if (code === 'invalid') return 'Kunne ikke bekrefte profilen.';
        return 'Noe gikk galt. Kjør supabase-schema.sql på nytt (steg 3).';
    },

    setMsg(id, text) {
        let el = document.getElementById(id);
        if (el) el.textContent = text || '';
    },

    personRow(tag, status, actionsHtml) {
        let extra = status
            ? `<span class="presence-status status-${this.escapeHtml(status)}">${this.statusLabel(status)}</span>`
            : '';
        return `<li>
            <div class="presence-who">
                <strong>@${this.escapeHtml(tag)}</strong>
                ${extra}
            </div>
            <div class="friend-actions">${actionsHtml}</div>
        </li>`;
    },

    actionBtn(tag, action, label, kind) {
        let cls = kind === 'green' ? 'btn btn-green' : 'btn btn-back';
        return `<button type="button" class="${cls} friend-act" data-tag="${this.escapeHtml(tag)}" data-action="${action}">${label}</button>`;
    },

    renderSearch(rows) {
        let list = document.getElementById('friend-search-results');
        if (!list) return;
        if (!rows.length) {
            list.innerHTML = '';
            this.setMsg('friend-search-msg', 'Fant ingen med den taggen.');
            return;
        }
        this.setMsg('friend-search-msg', '');
        list.innerHTML = rows.map(r => {
            let btn = this.relationButton(r.relation);
            let extra = r.relation === 'incoming'
                ? this.actionBtn(r.gamer_tag, 'decline', 'Avslå', 'back')
                : '';
            let peerId = window.playerPresence ? playerPresence.safePeerId(r.peer_id) : '';
            let joinable = !!(peerId && (r.status === 'hosting' || r.status === 'in_game'));
            if (joinable) {
                extra += `<button type="button" class="btn btn-green presence-join" data-peer="${this.escapeHtml(peerId)}">Bli med</button>`;
            }
            let main = this.canUse()
                ? `<button type="button" class="btn ${btn.disabled ? 'btn-back' : 'btn-green'} friend-act" data-tag="${this.escapeHtml(r.gamer_tag)}" data-action="${btn.action}" ${btn.disabled ? 'disabled' : ''}>${btn.label}</button>`
                : '';
            return this.personRow(r.gamer_tag, r.status || null, main + extra);
        }).join('');
    },

    renderLists(data) {
        let incoming = Array.isArray(data.incoming) ? data.incoming : [];
        let friends = Array.isArray(data.friends) ? data.friends : [];
        let outgoing = Array.isArray(data.outgoing) ? data.outgoing : [];

        let incEl = document.getElementById('friend-incoming');
        let incHead = document.getElementById('friend-incoming-head');
        if (incEl) {
            incEl.innerHTML = incoming.map(r => this.personRow(
                r.gamer_tag,
                null,
                this.actionBtn(r.gamer_tag, 'accept', 'Godta', 'green') +
                this.actionBtn(r.gamer_tag, 'decline', 'Avslå', 'back')
            )).join('');
        }
        if (incHead) incHead.textContent = incoming.length ? `Forespørsler (${incoming.length})` : 'Forespørsler';
        let incWrap = document.getElementById('friend-incoming-wrap');
        if (incWrap) incWrap.style.display = incoming.length ? '' : 'none';

        let listEl = document.getElementById('friend-list');
        if (listEl) {
            listEl.innerHTML = friends.length
                ? friends.map(r => this.personRow(
                    r.gamer_tag,
                    r.status || 'offline',
                    this.actionBtn(r.gamer_tag, 'remove', 'Fjern', 'back')
                )).join('')
                : '<li class="friend-empty">Ingen venner ennå. Søk på en gamer-tag.</li>';
        }

        let outEl = document.getElementById('friend-outgoing');
        let outWrap = document.getElementById('friend-outgoing-wrap');
        if (outEl) {
            outEl.innerHTML = outgoing.map(r => this.personRow(
                r.gamer_tag,
                null,
                this.actionBtn(r.gamer_tag, 'cancel', 'Avbryt', 'back')
            )).join('');
        }
        if (outWrap) outWrap.style.display = outgoing.length ? '' : 'none';
    },

    unwrap(data) {
        if (data == null) return null;
        if (typeof data === 'string') {
            try { return JSON.parse(data); } catch (e) { return null; }
        }
        return data;
    },

    async rpc(name, args) {
        let hash = await this.ensureHash();
        if (!hash) return { ok: false, error: 'invalid' };
        let payload = Object.assign({
            p_tag: playerProfile.getTag(),
            p_token_hash: hash
        }, args);
        let { data, error } = await playerProfile.client().rpc(name, payload);
        if (error) return { ok: false, error: 'rpc' };
        return this.unwrap(data) || { ok: false, error: 'rpc' };
    },

    mergeSearch(remoteRows, liveRows) {
        let byTag = {};
        (remoteRows || []).forEach(r => {
            if (r && r.gamer_tag) byTag[r.gamer_tag.toLowerCase()] = r;
        });
        (liveRows || []).forEach(r => {
            if (!r || !r.gamer_tag) return;
            let key = r.gamer_tag.toLowerCase();
            if (!byTag[key]) byTag[key] = { gamer_tag: r.gamer_tag, relation: 'none', status: r.status, peer_id: r.peer_id };
            else {
                byTag[key].status = r.status || byTag[key].status;
                byTag[key].peer_id = r.peer_id || byTag[key].peer_id;
            }
        });
        return Object.keys(byTag).map(k => byTag[k]);
    },

    async search(raw) {
        let q = this.normalizeQuery(raw);
        if (q.length < 2) {
            this.setMsg('friend-search-msg', this.errorText('invalid_query'));
            return;
        }
        this.setMsg('friend-search-msg', 'Søker…');
        let remote = [];
        if (this.canUse()) {
            let result = await this.rpc('search_players', { p_query: q });
            if (result && result.ok && Array.isArray(result.results)) remote = result.results;
        }
        let live = window.playerDirectory ? playerDirectory.find(q) : [];
        let rows = this.mergeSearch(remote, live);
        if (!rows.length) {
            this.setMsg('friend-search-msg', this.canUse()
                ? 'Fant ingen med den taggen. De må ha opprettet profil etter at Supabase ble koblet til.'
                : 'Søk krever at profilen er synket til Supabase.');
            let list = document.getElementById('friend-search-results');
            if (list) list.innerHTML = '';
            return;
        }
        this.renderSearch(rows);
    },

    async refreshLists() {
        let hint = document.getElementById('friends-hint');
        if (!this.canUse()) {
            if (hint) {
                hint.textContent = 'Søk krever at profilen er synket til Supabase.';
            }
            this.renderLists({ friends: [], incoming: [], outgoing: [] });
            let empty = document.getElementById('friend-list');
            if (empty) empty.innerHTML = '';
            return;
        }
        if (hint) hint.textContent = 'Søk på en gamer-tag for å sende forespørsel.';
        let result = await this.rpc('list_friendships');
        if (!result.ok) {
            if (hint) hint.textContent = this.errorText(result.error);
            return;
        }
        this.renderLists(result);
    },

    async act(tag, action) {
        if (this.busy || !action) return;
        this.busy = true;
        this.setMsg('friend-search-msg', '');
        let result;
        try {
            if (action === 'request') result = await this.rpc('send_friend_request', { p_other_tag: tag });
            else result = await this.rpc('respond_friend_request', { p_other_tag: tag, p_action: action });
        } finally {
            this.busy = false;
        }
        if (!result || !result.ok) {
            this.setMsg('friend-search-msg', this.errorText(result && result.error));
            return;
        }
        if (action === 'request') {
            this.setMsg('friend-search-msg', result.status === 'accepted' ? 'Dere er venner nå.' : 'Forespørsel sendt.');
        }
        await this.refreshLists();
        let searchInput = document.getElementById('friend-search-input');
        if (searchInput && this.normalizeQuery(searchInput.value)) await this.search(searchInput.value);
    },

    onVisibleMenu() {
        this.refreshLists();
        if (this.listTimer) return;
        this.listTimer = setInterval(() => {
            let menu = document.getElementById('mode-selection');
            if (menu && menu.style.display !== 'none') this.refreshLists();
        }, 8000);
    },

    bind() {
        let searchBtn = document.getElementById('btn-friend-search');
        let searchInput = document.getElementById('friend-search-input');
        if (searchBtn) searchBtn.addEventListener('click', () => this.search(searchInput && searchInput.value));
        if (searchInput) {
            searchInput.addEventListener('keydown', e => {
                if (e.key === 'Enter') this.search(searchInput.value);
            });
            searchInput.addEventListener('input', () => {
                let q = this.normalizeQuery(searchInput.value);
                if (q.length < 2 || !window.playerDirectory) return;
                let live = playerDirectory.find(q);
                if (live.length) this.renderSearch(this.mergeSearch([], live));
            });
        }
        let panel = document.getElementById('friends-panel');
        if (panel) {
            panel.addEventListener('click', e => {
                let join = e.target.closest('.presence-join');
                if (join) {
                    let peerId = window.playerPresence
                        ? playerPresence.safePeerId(join.getAttribute('data-peer'))
                        : '';
                    if (peerId && typeof initJoiner === 'function') initJoiner(peerId);
                    return;
                }
                let btn = e.target.closest('.friend-act');
                if (!btn || btn.disabled) return;
                let tag = this.normalizeQuery(btn.getAttribute('data-tag'));
                let action = btn.getAttribute('data-action');
                if (tag && action) this.act(tag, action);
            });
        }
    },

    init() {
        this.bind();
        if (playerProfile && playerProfile.isReady()) this.onVisibleMenu();
    }
};

window.playerFriends.init();

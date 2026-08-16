const LOBBY_DIR_ID = 'burritos-dir-v1';

window.isNoiseGamerTag = function (tag) {
    let t = String(tag || '').trim().replace(/^@/, '').toLowerCase();
    if (!t) return false;
    if (t === 'menytest' || t === 'henytest') return true;
    return t.length <= 16 && /test$/.test(t);
};

window.playerDirectory = {
    hubPeer: null,
    clientPeer: null,
    hubConn: null,
    clients: {},
    roster: [],
    isHub: false,
    started: false,
    state: 'idle',
    retryTimer: null,
    helloTimer: null,
    joinTimer: null,
    listeners: [],

    myEntry() {
        let tag = window.playerProfile && window.playerProfile.getTag ? window.playerProfile.getTag() : '';
        if (!tag || window.isNoiseGamerTag(tag)) return null;
        return {
            gamer_tag: tag,
            status: (window.playerPresence && window.playerPresence.status) || 'online',
            peer_id: (window.playerPresence && window.playerPresence.peerId) || null,
            updated: Date.now()
        };
    },

    onChange(fn) {
        this.listeners.push(fn);
    },

    emit() {
        this.listeners.forEach(fn => { try { fn(this.roster); } catch (e) {} });
    },

    find(query) {
        let q = String(query || '').trim().replace(/^@/, '').toLowerCase();
        if (q.length < 2) return [];
        let me = ((window.playerProfile && window.playerProfile.getTag()) || '').toLowerCase();
        return this.roster.filter(r => {
            let tag = (r.gamer_tag || '').toLowerCase();
            return tag !== me && tag.indexOf(q) !== -1 && !window.isNoiseGamerTag(r.gamer_tag);
        });
    },

    start() {
        if (this.started) {
            this.announce();
            return;
        }
        if (typeof Peer === 'undefined') return;
        if (!this.myEntry()) return;
        this.started = true;
        this.state = 'connecting';
        this.emit();
        this.tryHub();
    },

    stop() {
        this.started = false;
        this.isHub = false;
        this.state = 'idle';
        if (this.retryTimer) { clearTimeout(this.retryTimer); this.retryTimer = null; }
        if (this.helloTimer) { clearInterval(this.helloTimer); this.helloTimer = null; }
        if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
        this.cleanupPeers();
        this.roster = [];
        this.emit();
    },

    tryHub() {
        if (!this.started) return;
        this.cleanupPeers();
        this.state = 'connecting';
        let peer = new Peer(LOBBY_DIR_ID);
        let settled = false;
        peer.on('open', () => {
            if (settled) return;
            settled = true;
            this.hubPeer = peer;
            this.isHub = true;
            this.state = 'hub';
            this.serveHub(peer);
            this.mergeSelf();
            this.broadcast();
            this.ensureHelloLoop();
        });
        peer.on('error', err => {
            let type = err && err.type;
            if (settled) {
                if (this.started) this.scheduleReconnect();
                return;
            }
            if (type === 'unavailable-id') {
                settled = true;
                try { peer.destroy(); } catch (e) {}
                this.joinHub();
                return;
            }
            try { peer.destroy(); } catch (e) {}
            this.scheduleReconnect();
        });
    },

    joinHub() {
        if (!this.started) return;
        this.isHub = false;
        this.state = 'connecting';
        if (this.hubPeer) { try { this.hubPeer.destroy(); } catch (e) {} this.hubPeer = null; }
        if (this.clientPeer) { try { this.clientPeer.destroy(); } catch (e) {} this.clientPeer = null; }
        if (this.hubConn) { try { this.hubConn.close(); } catch (e) {} this.hubConn = null; }
        let peer = new Peer();
        this.clientPeer = peer;
        peer.on('open', () => {
            let conn = peer.connect(LOBBY_DIR_ID, { reliable: true });
            this.hubConn = conn;
            if (this.joinTimer) clearTimeout(this.joinTimer);
            this.joinTimer = setTimeout(() => {
                this.joinTimer = null;
                if (this.started && this.state === 'connecting') this.scheduleReconnect();
            }, 5000);
            conn.on('open', () => {
                if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
                this.state = 'client';
                this.announce();
                this.ensureHelloLoop();
            });
            conn.on('data', data => this.onMessage(data));
            conn.on('close', () => this.scheduleReconnect());
            conn.on('error', () => this.scheduleReconnect());
        });
        peer.on('error', () => this.scheduleReconnect());
    },

    serveHub(peer) {
        peer.on('connection', conn => {
            this.clients[conn.peer] = conn;
            conn.on('data', data => this.onHubData(conn, data));
            conn.on('close', () => {
                delete this.clients[conn.peer];
                this.dropByConn(conn.peer);
                this.broadcast();
            });
            conn.on('open', () => this.sendTo(conn, { type: 'roster', players: this.publicRoster() }));
        });
        peer.on('disconnected', () => {
            if (this.started && this.isHub) {
                try { peer.reconnect(); } catch (e) { this.scheduleReconnect(); }
            }
        });
        peer.on('close', () => {
            if (this.started) this.scheduleReconnect();
        });
    },

    onHubData(conn, data) {
        if (!data || data.type !== 'hello') return;
        this.upsert(data.player, conn.peer);
        this.mergeSelf();
        this.broadcast();
    },

    onMessage(data) {
        if (!data || data.type !== 'roster') return;
        this.roster = Array.isArray(data.players) ? data.players : [];
        this.mergeSelf();
        this.emit();
    },

    upsert(player, connId) {
        if (!player || !player.gamer_tag) return;
        if (window.isNoiseGamerTag(player.gamer_tag)) return;
        let tag = String(player.gamer_tag);
        let next = {
            gamer_tag: tag,
            status: player.status || 'online',
            peer_id: player.peer_id || null,
            updated: Date.now(),
            conn: connId || null
        };
        let i = this.roster.findIndex(r => (r.gamer_tag || '').toLowerCase() === tag.toLowerCase());
        if (i >= 0) this.roster[i] = Object.assign({}, this.roster[i], next);
        else this.roster.push(next);
    },

    dropByConn(connId) {
        this.roster = this.roster.filter(r => r.conn !== connId);
    },

    mergeSelf() {
        let me = this.myEntry();
        if (me) this.upsert(me, 'self');
    },

    publicRoster() {
        return this.roster.map(r => ({
            gamer_tag: r.gamer_tag,
            status: r.status,
            peer_id: r.peer_id
        }));
    },

    announce() {
        this.mergeSelf();
        if (this.isHub) {
            this.broadcast();
            return;
        }
        if (this.hubConn && this.hubConn.open) {
            this.sendTo(this.hubConn, { type: 'hello', player: this.myEntry() });
        }
        this.emit();
    },

    broadcast() {
        let payload = { type: 'roster', players: this.publicRoster() };
        Object.keys(this.clients).forEach(id => this.sendTo(this.clients[id], payload));
        this.emit();
    },

    sendTo(conn, data) {
        try { if (conn && conn.open) conn.send(data); } catch (e) {}
    },

    ensureHelloLoop() {
        if (this.helloTimer) return;
        this.helloTimer = setInterval(() => {
            if (this.started) this.announce();
        }, 6000);
    },

    scheduleReconnect() {
        if (!this.started || this.retryTimer) return;
        this.state = 'connecting';
        this.retryTimer = setTimeout(() => {
            this.retryTimer = null;
            this.tryHub();
        }, 1200);
    },

    cleanupPeers() {
        if (this.joinTimer) { clearTimeout(this.joinTimer); this.joinTimer = null; }
        if (this.hubConn) { try { this.hubConn.close(); } catch (e) {} this.hubConn = null; }
        Object.keys(this.clients).forEach(id => {
            try { this.clients[id].close(); } catch (e) {}
        });
        this.clients = {};
        if (this.hubPeer) { try { this.hubPeer.destroy(); } catch (e) {} this.hubPeer = null; }
        if (this.clientPeer) { try { this.clientPeer.destroy(); } catch (e) {} this.clientPeer = null; }
        this.isHub = false;
    }
};

window.addEventListener('pagehide', e => {
    if (e && e.persisted) return;
    if (window.playerDirectory) playerDirectory.stop();
});

window.addEventListener('pageshow', () => {
    if (window.playerProfile && window.playerProfile.isReady() && window.playerDirectory) {
        window.playerDirectory.start();
    }
});

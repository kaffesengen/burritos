const PROFILE_KEY = 'burritos.profile';
const SUPABASE_LS_KEY = 'burritos.supabase';

window.playerProfile = {
    data: null,
    showingRecovery: false,

    getTag() {
        return (this.data && this.data.gamerTag) ? this.data.gamerTag : '';
    },

    isReady() {
        return this.getTag().length > 0;
    },

    getConfig() {
        let fromFile = window.SUPABASE_CONFIG || {};
        let fromLs = null;
        try { fromLs = JSON.parse(localStorage.getItem(SUPABASE_LS_KEY) || 'null'); } catch (e) { fromLs = null; }
        return {
            url: String((fromLs && fromLs.url) || fromFile.url || '').trim(),
            anonKey: String((fromLs && fromLs.anonKey) || fromFile.anonKey || '').trim()
        };
    },

    hasRemote() {
        let c = this.getConfig();
        return !!(c.url && c.anonKey && window.supabase);
    },

    client() {
        let c = this.getConfig();
        return window.supabase.createClient(c.url, c.anonKey);
    },

    validateTag(tag) {
        let t = (tag || '').trim();
        if (t.length < 3 || t.length > 15) return 'Gamer-tag må være 3–15 tegn.';
        if (!/^[A-Za-z0-9_æøåÆØÅ]+$/.test(t)) return 'Bare bokstaver, tall og understrek.';
        return null;
    },

    makeRecoveryCode() {
        const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let bytes = crypto.getRandomValues(new Uint8Array(16));
        let raw = '';
        for (let i = 0; i < 16; i++) raw += alphabet[bytes[i] % alphabet.length];
        return raw.replace(/(.{4})/g, '$1-').slice(0, 19);
    },

    async sha256(text) {
        let buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
        return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
    },

    loadLocal() {
        try {
            this.data = JSON.parse(localStorage.getItem(PROFILE_KEY) || 'null');
        } catch (e) {
            this.data = null;
        }
        if (this.data && !this.data.gamerTag) this.data = null;
    },

    saveLocal() {
        if (this.data) localStorage.setItem(PROFILE_KEY, JSON.stringify(this.data));
        else localStorage.removeItem(PROFILE_KEY);
        this.syncNameField();
    },

    syncNameField() {
        let el = document.getElementById('player-name');
        if (el) el.value = this.getTag();
    },

    setError(id, msg) {
        let el = document.getElementById(id);
        if (el) el.textContent = msg || '';
    },

    async claim(tag) {
        let err = this.validateTag(tag);
        if (err) return { ok: false, error: err };
        let display = tag.trim();
        let secret = this.makeRecoveryCode();

        if (this.hasRemote()) {
            let hash = await this.sha256(secret);
            let { data, error } = await this.client().rpc('claim_gamer_tag', {
                p_tag: display,
                p_token_hash: hash
            });
            if (error) return { ok: false, error: 'Kunne ikke nå serveren. Sjekk Supabase-oppsettet.' };
            if (!data || !data.ok) {
                if (data && data.error === 'taken') return { ok: false, error: 'Den gamer-tagen er opptatt.' };
                if (data && data.error === 'invalid_tag') return { ok: false, error: this.validateTag(display) || 'Ugyldig gamer-tag.' };
                return { ok: false, error: 'Kunne ikke opprette profil.' };
            }
            this.data = { id: data.id, gamerTag: data.gamer_tag, secret: secret, remote: true };
        } else {
            this.data = { id: crypto.randomUUID(), gamerTag: display, secret: secret, remote: false };
        }
        this.saveLocal();
        return { ok: true, secret: secret };
    },

    async login(tag, code) {
        let err = this.validateTag(tag);
        if (err) return { ok: false, error: err };
        let secret = (code || '').trim().toUpperCase();
        if (!secret) return { ok: false, error: 'Skriv inn gjenopprettingskoden.' };

        if (this.hasRemote()) {
            let hash = await this.sha256(secret);
            let { data, error } = await this.client().rpc('login_gamer_tag', {
                p_tag: tag.trim(),
                p_token_hash: hash
            });
            if (error) return { ok: false, error: 'Kunne ikke nå serveren. Sjekk Supabase-oppsettet.' };
            if (!data || !data.ok) return { ok: false, error: 'Feil gamer-tag eller kode.' };
            this.data = { id: data.id, gamerTag: data.gamer_tag, secret: secret, remote: true };
        } else {
            this.data = { id: crypto.randomUUID(), gamerTag: tag.trim(), secret: secret, remote: false };
        }
        this.saveLocal();
        return { ok: true };
    },

    async restore() {
        this.loadLocal();
        if (!this.isReady()) return false;
        if (this.hasRemote() && this.data.secret) {
            try {
                let hash = await this.sha256(this.data.secret);
                let { data } = await this.client().rpc('login_gamer_tag', {
                    p_tag: this.data.gamerTag,
                    p_token_hash: hash
                });
                if (data && data.ok) {
                    this.data.id = data.id;
                    this.data.gamerTag = data.gamer_tag;
                    this.data.remote = true;
                    this.saveLocal();
                    return true;
                }
                this.data.remote = false;
                this.saveLocal();
            } catch (e) {
                this.data.remote = false;
            }
        }
        this.syncNameField();
        return true;
    },

    logout() {
        if (window.playerPresence) window.playerPresence.clear();
        this.data = null;
        this.showingRecovery = false;
        this.saveLocal();
        this.render();
    },

    showBox(id) {
        ['profile-setup', 'profile-recovery', 'profile-manage', 'mode-selection'].forEach(boxId => {
            let el = document.getElementById(boxId);
            if (el) el.style.display = (boxId === id) ? 'block' : 'none';
        });
        let back = document.getElementById('btn-lobby-back');
        if (back) back.style.display = (id === 'profile-manage') ? 'block' : 'none';
    },

    render() {
        if (this.showingRecovery && this.data) {
            let codeEl = document.getElementById('profile-recovery-code');
            if (codeEl) codeEl.textContent = this.data.secret;
            this.showBox('profile-recovery');
            return;
        }
        if (!this.isReady()) {
            this.showBox('profile-setup');
            this.fillServerFields();
            return;
        }
        let tagEl = document.getElementById('profile-tag-display');
        if (tagEl) tagEl.textContent = '@' + this.getTag();
        let manageTag = document.getElementById('profile-manage-tag');
        if (manageTag) manageTag.textContent = '@' + this.getTag();
        let syncEl = document.getElementById('profile-sync-state');
        if (syncEl) {
            syncEl.textContent = this.data.remote
                ? 'Unik tag synket til server'
                : (this.hasRemote()
                    ? 'Kun denne enheten (server avviste koden)'
                    : 'Kun denne enheten — koble til Supabase for unik tag');
        }
        let manageSync = document.getElementById('profile-manage-sync');
        if (manageSync) manageSync.textContent = syncEl ? syncEl.textContent : '';
        let codeShow = document.getElementById('profile-manage-code');
        if (codeShow) codeShow.textContent = this.data.secret || '—';
        this.syncNameField();
        this.showBox('mode-selection');
        if (window.playerPresence) window.playerPresence.onVisibleMenu();
    },

    fillServerFields() {
        let c = this.getConfig();
        let url = document.getElementById('sb-url');
        let key = document.getElementById('sb-key');
        if (url && !url.value) url.value = c.url;
        if (key && !key.value) key.value = c.anonKey;
    },

    saveServerFromForm() {
        let url = document.getElementById('sb-url')?.value.trim() || '';
        let anonKey = document.getElementById('sb-key')?.value.trim() || '';
        if (url && anonKey) localStorage.setItem(SUPABASE_LS_KEY, JSON.stringify({ url, anonKey }));
        else localStorage.removeItem(SUPABASE_LS_KEY);
        this.setError('profile-server-msg', url && anonKey ? 'Server lagret i denne nettleseren.' : 'Server fjernet. Taggen er bare lokal.');
    },

    bind() {
        let createBtn = document.getElementById('btn-profile-create');
        if (createBtn) createBtn.addEventListener('click', async () => {
            this.setError('profile-setup-error', '');
            createBtn.disabled = true;
            let result = await this.claim(document.getElementById('profile-tag-input')?.value);
            createBtn.disabled = false;
            if (!result.ok) { this.setError('profile-setup-error', result.error); return; }
            this.showingRecovery = true;
            this.render();
        });

        let loginBtn = document.getElementById('btn-profile-login');
        if (loginBtn) loginBtn.addEventListener('click', async () => {
            this.setError('profile-login-error', '');
            loginBtn.disabled = true;
            let result = await this.login(
                document.getElementById('profile-login-tag')?.value,
                document.getElementById('profile-login-code')?.value
            );
            loginBtn.disabled = false;
            if (!result.ok) { this.setError('profile-login-error', result.error); return; }
            this.showingRecovery = false;
            this.render();
        });

        let doneBtn = document.getElementById('btn-recovery-done');
        if (doneBtn) doneBtn.addEventListener('click', () => {
            this.showingRecovery = false;
            this.render();
        });

        let copyBtn = document.getElementById('btn-copy-recovery');
        if (copyBtn) copyBtn.addEventListener('click', async () => {
            if (!this.data || !this.data.secret) return;
            try { await navigator.clipboard.writeText(this.data.secret); copyBtn.textContent = 'Kopiert!'; }
            catch (e) { copyBtn.textContent = 'Kopier manuelt'; }
            setTimeout(() => { copyBtn.textContent = 'Kopier kode'; }, 1600);
        });

        let manageBtn = document.getElementById('btn-profile-manage');
        if (manageBtn) manageBtn.addEventListener('click', () => {
            this.showBox('profile-manage');
            let manageTag = document.getElementById('profile-manage-tag');
            if (manageTag) manageTag.textContent = '@' + this.getTag();
            let manageSync = document.getElementById('profile-manage-sync');
            if (manageSync) {
                manageSync.textContent = this.data && this.data.remote
                    ? 'Unik tag synket til server'
                    : 'Kun denne enheten — koble til Supabase for unik tag';
            }
            let codeShow = document.getElementById('profile-manage-code');
            if (codeShow) codeShow.textContent = (this.data && this.data.secret) || '—';
        });

        let logoutBtn = document.getElementById('btn-profile-logout');
        if (logoutBtn) logoutBtn.addEventListener('click', () => this.logout());

        let saveSb = document.getElementById('btn-save-supabase');
        if (saveSb) saveSb.addEventListener('click', () => this.saveServerFromForm());

        let tagInput = document.getElementById('profile-tag-input');
        if (tagInput) tagInput.addEventListener('keydown', e => { if (e.key === 'Enter') createBtn && createBtn.click(); });
        let loginCode = document.getElementById('profile-login-code');
        if (loginCode) loginCode.addEventListener('keydown', e => { if (e.key === 'Enter') loginBtn && loginBtn.click(); });
    },

    async init() {
        this.loadLocal();
        if (!this.isReady()) this.showBox('profile-setup');
        this.bind();
        this.fillServerFields();
        await this.restore();
        if (!this.showingRecovery) this.render();
    }
};

window.playerProfile.init();

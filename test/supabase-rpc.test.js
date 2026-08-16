const assert = require('assert');

function unwrapRpc(data) {
    if (data == null) return null;
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch (e) { return null; }
    }
    return data;
}

const store = {
    profiles: [],
    presence: []
};

function norm(tag) {
    return String(tag || '').trim().toLowerCase().replace(/^@/, '');
}

function claim(tag, hash) {
    const n = norm(tag);
    if (store.profiles.some(p => p.gamer_tag_norm === n)) return { ok: false, error: 'taken' };
    const row = { id: 'id-' + n, gamer_tag: tag.trim(), gamer_tag_norm: n, token_hash: hash };
    store.profiles.push(row);
    return { ok: true, id: row.id, gamer_tag: row.gamer_tag };
}

function login(tag, hash) {
    const row = store.profiles.find(p => p.gamer_tag_norm === norm(tag) && p.token_hash === hash);
    if (!row) return { ok: false, error: 'invalid' };
    return { ok: true, id: row.id, gamer_tag: row.gamer_tag };
}

function search(meTag, meHash, query) {
    const me = store.profiles.find(p => p.gamer_tag_norm === norm(meTag) && p.token_hash === meHash);
    if (!me) return { ok: false, error: 'invalid' };
    const q = norm(query);
    const results = store.profiles
        .filter(p => p.id !== me.id && p.gamer_tag_norm.indexOf(q) !== -1)
        .map(p => ({ gamer_tag: p.gamer_tag, relation: 'none' }));
    return { ok: true, results };
}

const kaffe = unwrapRpc(JSON.stringify(claim('Kaffesengen', 'hash-k')));
const firez = unwrapRpc(JSON.stringify(claim('Firez', 'hash-f')));
assert.strictEqual(kaffe.ok, true);
assert.strictEqual(firez.ok, true);
assert.strictEqual(claim('Firez', 'other').error, 'taken');
assert.strictEqual(login('Kaffesengen', 'hash-k').ok, true);
assert.strictEqual(login('Kaffesengen', 'wrong').ok, false);

const found = search('Kaffesengen', 'hash-k', 'fir');
assert.strictEqual(found.ok, true);
assert.strictEqual(found.results.length, 1);
assert.strictEqual(found.results[0].gamer_tag, 'Firez');

const foundBack = search('Firez', 'hash-f', '@Kaffe');
assert.strictEqual(foundBack.results[0].gamer_tag, 'Kaffesengen');

console.log('supabase-rpc tests ok');

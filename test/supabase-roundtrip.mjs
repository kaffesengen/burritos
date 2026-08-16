import fs from 'fs';
import path from 'path';
import { createHash } from 'crypto';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

function loadConfig() {
    if (process.env.SUPABASE_URL && process.env.SUPABASE_ANON_KEY) {
        return { url: process.env.SUPABASE_URL, anonKey: process.env.SUPABASE_ANON_KEY };
    }
    const src = fs.readFileSync(path.join(root, 'supabase-config.js'), 'utf8');
    const url = (src.match(/url:\s*'([^']*)'/) || [])[1] || '';
    const anonKey = (src.match(/anonKey:\s*'([^']*)'/) || [])[1] || '';
    return { url, anonKey };
}

function sha256(text) {
    return createHash('sha256').update(text).digest('hex');
}

function unwrap(data) {
    if (data == null) return null;
    if (typeof data === 'string') {
        try { return JSON.parse(data); } catch (e) { return null; }
    }
    return data;
}

async function rpc(cfg, name, args) {
    const res = await fetch(cfg.url.replace(/\/$/, '') + '/rest/v1/rpc/' + name, {
        method: 'POST',
        headers: {
            apikey: cfg.anonKey,
            Authorization: 'Bearer ' + cfg.anonKey,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(args)
    });
    const text = await res.text();
    let data = null;
    try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
    if (!res.ok) {
        throw new Error(name + ' HTTP ' + res.status + ' ' + text);
    }
    return unwrap(data);
}

async function main() {
    const cfg = loadConfig();
    if (!cfg.url || !cfg.anonKey) {
        console.log('supabase-roundtrip skipped: no config');
        process.exit(0);
    }
    const suffix = String(Date.now()).slice(-6);
    const aTag = 'Ka' + suffix;
    const bTag = 'Fi' + suffix;
    const aSecret = 'TEST-AAAA-BBBB-CCCC';
    const bSecret = 'TEST-DDDD-EEEE-FFFF';
    const aHash = sha256(aSecret);
    const bHash = sha256(bSecret);

    const claimedA = await rpc(cfg, 'claim_gamer_tag', { p_tag: aTag, p_token_hash: aHash });
    const claimedB = await rpc(cfg, 'claim_gamer_tag', { p_tag: bTag, p_token_hash: bHash });
    if (!claimedA || !claimedA.ok) throw new Error('claim A failed ' + JSON.stringify(claimedA));
    if (!claimedB || !claimedB.ok) throw new Error('claim B failed ' + JSON.stringify(claimedB));

    const found = await rpc(cfg, 'search_players', {
        p_tag: aTag,
        p_token_hash: aHash,
        p_query: bTag.slice(0, 4)
    });
    if (!found || !found.ok) throw new Error('search failed ' + JSON.stringify(found));
    const hit = (found.results || []).find(r => r.gamer_tag === bTag);
    if (!hit) throw new Error('A did not find B: ' + JSON.stringify(found));

    const foundBack = await rpc(cfg, 'search_players', {
        p_tag: bTag,
        p_token_hash: bHash,
        p_query: aTag.slice(0, 4)
    });
    const hitBack = (foundBack.results || []).find(r => r.gamer_tag === aTag);
    if (!hitBack) throw new Error('B did not find A: ' + JSON.stringify(foundBack));

    const presence = await rpc(cfg, 'set_presence', {
        p_tag: bTag,
        p_token_hash: bHash,
        p_peer_id: 'peer-b',
        p_status: 'hosting'
    });
    if (!presence || !presence.ok) throw new Error('presence failed ' + JSON.stringify(presence));

    const online = await rpc(cfg, 'list_online_players', {});
    const onlineRows = Array.isArray(online) ? online : [];
    if (!onlineRows.some(r => r.gamer_tag === bTag && r.status === 'hosting')) {
        throw new Error('online list missing B: ' + JSON.stringify(online));
    }

    console.log('supabase-roundtrip ok', aTag, bTag);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});

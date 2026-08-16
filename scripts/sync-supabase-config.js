#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const envPath = path.join(root, '.env.local');
const outPath = path.join(root, 'supabase-config.js');

function parseEnv(src) {
    const out = {};
    src.split(/\r?\n/).forEach(line => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) return;
        const eq = trimmed.indexOf('=');
        if (eq < 1) return;
        const key = trimmed.slice(0, eq).trim();
        let value = trimmed.slice(eq + 1).trim();
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
        }
        out[key] = value;
    });
    return out;
}

if (!fs.existsSync(envPath)) {
    console.error('Mangler .env.local. Kopier .env.local.example og fyll inn URL + anon-nøkkel.');
    process.exit(1);
}

const env = parseEnv(fs.readFileSync(envPath, 'utf8'));
const url = String(env.SUPABASE_URL || '').trim();
const anonKey = String(env.SUPABASE_ANON_KEY || '').trim();

if (!url || !url.startsWith('https://') || url.includes('xxxx.supabase.co')) {
    console.error('SUPABASE_URL i .env.local ser ikke ut som et ekte prosjekt.');
    process.exit(1);
}
if (!anonKey || anonKey.length < 20) {
    console.error('SUPABASE_ANON_KEY i .env.local mangler. Bruk anon/public-nøkkelen, ikke service_role.');
    process.exit(1);
}

const body = `// Generert fra .env.local. Anon-nøkkelen er ment å ligge i klienten.
window.SUPABASE_CONFIG = {
    url: ${JSON.stringify(url)},
    anonKey: ${JSON.stringify(anonKey)}
};
`;
fs.writeFileSync(outPath, body);
console.log('Skrev supabase-config.js fra .env.local');

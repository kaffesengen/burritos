const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

let created = 0;
const fakeClient = { rpc: async () => ({ data: null, error: null }) };
const windowObj = {
    SUPABASE_CONFIG: { url: 'https://example.supabase.co', anonKey: 'anon' },
    supabase: {
        createClient() {
            created += 1;
            return fakeClient;
        }
    },
    addEventListener() {},
    localStorage: {
        getItem() { return null; },
        setItem() {},
        removeItem() {}
    }
};
const sandbox = {
    window: windowObj,
    document: {
        addEventListener() {},
        getElementById: () => null,
        querySelector: () => null
    },
    localStorage: windowObj.localStorage,
    crypto: { getRandomValues: arr => { arr.fill(1); return arr; }, subtle: { digest: async () => new ArrayBuffer(32) } }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'profile.js'), 'utf8'), sandbox);

const profile = sandbox.window.playerProfile;
const a = profile.client();
const b = profile.client();
const c = profile.client();
assert.strictEqual(created, 1, 'createClient must be called once');
assert.strictEqual(a, b);
assert.strictEqual(b, c);

console.log('supabase-client tests ok');

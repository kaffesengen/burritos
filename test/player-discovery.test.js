const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

function loadDirectory() {
    const code = fs.readFileSync(path.join(__dirname, '..', 'directory.js'), 'utf8');
    const windowObj = {
        addEventListener() {},
        playerProfile: { getTag: () => 'Kaffesengen' }
    };
    const sandbox = {
        window: windowObj,
        Peer: function Peer() {},
        addEventListener() {},
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.playerDirectory;
}

function loadPresence() {
    const code = fs.readFileSync(path.join(__dirname, '..', 'presence.js'), 'utf8');
    const windowObj = {
        addEventListener() {},
        playerProfile: {
            hasRemote: () => false,
            isReady: () => false,
            getTag: () => 'Kaffesengen',
            data: null
        },
        playerDirectory: { onChange() {}, roster: [], state: 'hub' }
    };
    const sandbox = {
        window: windowObj,
        document: { addEventListener() {}, getElementById: () => null },
        playerProfile: windowObj.playerProfile,
        playerDirectory: windowObj.playerDirectory
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.playerPresence;
}

const dir = loadDirectory();
dir.roster = [
    { gamer_tag: 'Kaffesengen', status: 'online' },
    { gamer_tag: 'Firez', status: 'hosting', peer_id: 'abc123' },
    { gamer_tag: 'Mikael', status: 'online' }
];

assert.strictEqual(dir.find('fi').length, 1);
assert.strictEqual(dir.find('fi')[0].gamer_tag, 'Firez');
assert.strictEqual(dir.find('@Firez')[0].gamer_tag, 'Firez');
assert.strictEqual(dir.find('xyz').length, 0);
assert.strictEqual(dir.find('kaffe').length, 0);

dir.roster = [];
dir.upsert({ gamer_tag: 'Firez', status: 'online', peer_id: 'p1' }, 'c1');
dir.upsert({ gamer_tag: 'firez', status: 'hosting', peer_id: 'p2' }, 'c1');
assert.strictEqual(dir.roster.length, 1);
assert.strictEqual(dir.roster[0].status, 'hosting');
assert.strictEqual(dir.roster[0].peer_id, 'p2');

const presence = loadPresence();
const merged = presence.mergeRows([
    { gamer_tag: 'Firez', status: 'online' },
    { gamer_tag: 'firez', status: 'hosting', peer_id: 'host-1' },
    { gamer_tag: 'Kaffesengen', status: 'online' }
]);
assert.strictEqual(merged.length, 2);
const firez = merged.find(r => r.gamer_tag.toLowerCase() === 'firez');
assert.ok(firez);
assert.strictEqual(firez.status, 'hosting');
assert.strictEqual(firez.peer_id, 'host-1');

class MockConn {
    constructor(peerId) {
        this.peer = peerId;
        this.open = false;
        this.handlers = {};
        this._remote = null;
    }
    on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); }
    emit(ev, data) { (this.handlers[ev] || []).forEach(fn => fn(data)); }
    send(data) {
        if (this._remote) {
            const copy = JSON.parse(JSON.stringify(data));
            queueMicrotask(() => this._remote.emit('data', copy));
        }
    }
    close() {
        this.open = false;
        const other = this._remote;
        this._remote = null;
        if (other) {
            other._remote = null;
            other.open = false;
            other.emit('close');
        }
        this.emit('close');
    }
}

class MockPeer {
    static hubs = {};
    static auto = 0;
    static reset() { MockPeer.hubs = {}; MockPeer.auto = 0; }
    constructor(id) {
        this.id = id || ('auto-' + (++MockPeer.auto));
        this.handlers = {};
        this.destroyed = false;
        queueMicrotask(() => {
            if (this.destroyed) return;
            if (id && MockPeer.hubs[id] && MockPeer.hubs[id] !== this) {
                this.emit('error', { type: 'unavailable-id' });
                return;
            }
            if (id) MockPeer.hubs[id] = this;
            this.emit('open', this.id);
        });
    }
    on(ev, fn) { (this.handlers[ev] = this.handlers[ev] || []).push(fn); }
    emit(ev, data) { (this.handlers[ev] || []).forEach(fn => fn(data)); }
    connect(id) {
        const hub = MockPeer.hubs[id];
        const clientConn = new MockConn(this.id);
        const hubConn = new MockConn(this.id);
        clientConn._remote = hubConn;
        hubConn._remote = clientConn;
        queueMicrotask(() => {
            if (!hub || hub.destroyed) {
                clientConn.emit('error', { type: 'peer-unavailable' });
                return;
            }
            clientConn.open = true;
            hubConn.open = true;
            hub.emit('connection', hubConn);
            hubConn.emit('open');
            clientConn.emit('open');
        });
        return clientConn;
    }
    destroy() {
        this.destroyed = true;
        if (MockPeer.hubs[this.id] === this) delete MockPeer.hubs[this.id];
        this.emit('close');
    }
    reconnect() {}
}

function loadLiveDirectory(tag) {
    const code = fs.readFileSync(path.join(__dirname, '..', 'directory.js'), 'utf8');
    const windowObj = {
        addEventListener() {},
        playerProfile: { getTag: () => tag },
        playerPresence: { status: 'online', peerId: tag === 'Firez' ? 'firez-host' : null }
    };
    const sandbox = {
        window: windowObj,
        Peer: MockPeer,
        addEventListener() {},
        setTimeout,
        setInterval,
        clearTimeout,
        clearInterval
    };
    vm.createContext(sandbox);
    vm.runInContext(code, sandbox);
    return sandbox.window.playerDirectory;
}

function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function testTwoPlayersFindEachOther() {
    MockPeer.reset();
    const kaffe = loadLiveDirectory('Kaffesengen');
    const firezDir = loadLiveDirectory('Firez');
    kaffe.start();
    await wait(20);
    firezDir.start();
    await wait(40);
    const foundFirez = kaffe.find('fire');
    const foundKaffe = firezDir.find('kaffe');
    assert.strictEqual(foundFirez.length, 1, 'Kaffesengen should find Firez');
    assert.strictEqual(foundFirez[0].gamer_tag, 'Firez');
    assert.strictEqual(foundKaffe.length, 1, 'Firez should find Kaffesengen');
    assert.strictEqual(foundKaffe[0].gamer_tag, 'Kaffesengen');
    kaffe.stop();
    firezDir.stop();
}

testTwoPlayersFindEachOther().then(() => {
    console.log('player-discovery tests ok');
}).catch(err => {
    console.error(err);
    process.exit(1);
});

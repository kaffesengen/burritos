const assert = require('assert');

function ensureLocalDriver(state) {
    if (state.isSplitScreen) return state;
    if (!state.myId) {
        let existing = Object.keys(state.players)[0];
        if (existing) state.myId = existing;
    }
    if (state.myId && !state.localPlayers.length) {
        state.localPlayers = [{ id: state.myId, gamepad: -1, isKeyboard: true }];
    }
    if (state.myId && state.localPlayers[0] && state.localPlayers[0].id !== state.myId) {
        state.localPlayers[0].id = state.myId;
    }
    if (state.myId && !state.players[state.myId]) {
        state.players[state.myId] = { id: state.myId, name: 'Firez', x: 2100, y: 3200 };
    }
    if (state.localPlayers[0] && !state.players[state.localPlayers[0].id]) {
        let fallback = (state.myId && state.players[state.myId]) ? state.myId : Object.keys(state.players)[0];
        if (fallback) {
            state.localPlayers[0].id = fallback;
            state.myId = fallback;
        }
    }
    return state;
}

function cameraTarget(localPlayers, myId, players, track) {
    let views = localPlayers.length ? localPlayers : (myId ? [{ id: myId }] : []);
    let lp = views[0];
    let p = (lp && players[lp.id]) || players[myId] || Object.values(players)[0];
    if (!p) return { x: track.startX, y: track.startY };
    return { x: p.x, y: p.y };
}

const track = { startX: 2100, startY: 3200 };

let missingLocal = ensureLocalDriver({
    isSplitScreen: false,
    myId: 'peer-host',
    localPlayers: [],
    players: {}
});
assert.strictEqual(missingLocal.localPlayers[0].id, 'peer-host');
assert.ok(missingLocal.players['peer-host']);

let desynced = ensureLocalDriver({
    isSplitScreen: false,
    myId: 'peer-host',
    localPlayers: [{ id: 'stale-id' }],
    players: { 'peer-host': { id: 'peer-host', x: 2100, y: 3200 } }
});
assert.strictEqual(desynced.localPlayers[0].id, 'peer-host');
assert.deepStrictEqual(
    cameraTarget(desynced.localPlayers, desynced.myId, desynced.players, track),
    { x: 2100, y: 3200 }
);

let emptyView = cameraTarget([], null, {}, track);
assert.deepStrictEqual(emptyView, { x: 2100, y: 3200 });

console.log('host-view tests ok');

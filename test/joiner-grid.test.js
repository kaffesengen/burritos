const assert = require('assert');

function shouldDropRemotePlayer(p, now, hasOpenConn) {
    if (!p || p.isAI) return false;
    if (hasOpenConn) return false;
    return (now - (p.lastSeen || 0)) > 8000;
}

function pruneMissingRemotes(store, localIds, netPlayers) {
    if (!netPlayers || !Object.keys(netPlayers).length) return;
    for (let pid in store) {
        if (!localIds.includes(pid) && !netPlayers[pid]) delete store[pid];
    }
}

function gridSlot(index, t) {
    let row = Math.floor(index / 2);
    let col = index % 2 === 0 ? 1 : -1;
    let spacing = 200, lateral = 40;
    return {
        x: t.startX - Math.cos(t.startAngle) * (row * spacing + 60) + Math.sin(t.startAngle) * (col * lateral),
        y: t.startY - Math.sin(t.startAngle) * (row * spacing + 60) - Math.cos(t.startAngle) * (col * lateral),
        angle: t.startAngle
    };
}

function gridOrderIds(players, myId) {
    return Object.keys(players).sort((a, b) => {
        if (a === myId) return -1;
        if (b === myId) return 1;
        if (!!players[a].isAI !== !!players[b].isAI) return players[a].isAI ? 1 : -1;
        return String(a).localeCompare(String(b));
    });
}

function applyGridPose(p, slot) {
    p.x = slot.x;
    p.y = slot.y;
    p.prevX = slot.x;
    p.prevY = slot.y;
    p.angle = slot.angle;
    p.targetX = slot.x;
    p.targetY = slot.y;
}

const now = 20000;
assert.strictEqual(shouldDropRemotePlayer({ lastSeen: 1000 }, now, true), false, 'open connection must stay');
assert.strictEqual(shouldDropRemotePlayer({ lastSeen: 1000, isAI: true }, now, false), false, 'AI must stay');
assert.strictEqual(shouldDropRemotePlayer({ lastSeen: 19000 }, now, false), false, 'fresh lastSeen must stay');
assert.strictEqual(shouldDropRemotePlayer({ lastSeen: 1000 }, now, false), true, 'stale disconnected remote may drop');

const store = { host: { id: 'host' }, joiner: { id: 'joiner' }, me: { id: 'me' } };
pruneMissingRemotes(store, ['me'], {});
assert.ok(store.host && store.joiner && store.me, 'empty state must not wipe the field');
pruneMissingRemotes(store, ['me'], { me: {}, host: {} });
assert.ok(store.me && store.host);
assert.ok(!store.joiner, 'missing remotes are pruned only when snapshot has players');

const t = { startX: 2100, startY: 3200, startAngle: Math.PI };
const hostSlot = gridSlot(0, t);
const joinerSlot = gridSlot(1, t);
assert.ok(Math.hypot(hostSlot.x - t.startX, hostSlot.y - t.startY) > 30, 'P1 is not on the start-line center');
assert.ok(Math.hypot(joinerSlot.x - t.startX, joinerSlot.y - t.startY) > 30, 'P2 is not on the start-line center');
assert.ok(Math.hypot(hostSlot.x - joinerSlot.x, hostSlot.y - joinerSlot.y) > 50, 'grid slots are separated');

const field = {
    'zzz-joiner': { id: 'zzz-joiner', x: t.startX, y: t.startY, prevX: t.startX, prevY: t.startY },
    'aaa-host': { id: 'aaa-host', x: t.startX, y: t.startY, prevX: t.startX, prevY: t.startY }
};
const order = gridOrderIds(field, 'aaa-host');
assert.deepStrictEqual(order, ['aaa-host', 'zzz-joiner']);
order.forEach((pid, i) => applyGridPose(field[pid], gridSlot(i, t)));
assert.strictEqual(field['aaa-host'].x, hostSlot.x);
assert.strictEqual(field['aaa-host'].prevX, hostSlot.x);
assert.strictEqual(field['zzz-joiner'].x, joinerSlot.x);
assert.strictEqual(field['zzz-joiner'].prevX, joinerSlot.x);
assert.ok(field['aaa-host'].x !== t.startX || field['aaa-host'].y !== t.startY, 'host left the start-line center');
assert.ok(
    Math.hypot(field['aaa-host'].x - field['zzz-joiner'].x, field['aaa-host'].y - field['zzz-joiner'].y) > 50,
    'host and joiner stay in different boxes'
);

console.log('joiner-grid tests ok');

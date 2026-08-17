const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { strokeFromCmds, makeProbe } = require('./track-stroke');
const { TRACKS } = require('./track-fixtures');

const sandbox = {
    performance: { now: () => 1000 },
    Date,
    Math,
    vehiclePresets: {
        jaguar: { power: 400, mass: 2200, grip: 1.85, turn: 4.0, l: 52, maxRPM: 13000, ev: true, type: 'jaguar', gears: [0, 9.06] },
        f1: { power: 1050, mass: 798, grip: 3.60, turn: 6.0, l: 64, maxRPM: 15000, type: 'f1', gears: [0, 4.14, 3.10] },
        mx5: { power: 184, mass: 1050, grip: 1.60, turn: 4.5, l: 42, maxRPM: 7500, type: 'mx5', gears: [0, 5.08, 2.99] },
        gokart: { power: 38.5, mass: 180, grip: 2.52, turn: 0.55, l: 24, maxRPM: 14000, type: 'gokart', gears: [0, 2.30, 1.60] }
    }
};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8') + '\nthis.aiManager = aiManager;', sandbox);

const A = sandbox.AIAutonomous;
assert.ok(A, 'AIAutonomous helpers must be exported');
assert.ok(Math.abs(A.wrapAngle(Math.PI + 0.2) + (Math.PI - 0.2)) < 1e-9);
assert.ok(A.circumRadiusWu({ x: 0, y: 0 }, { x: 10, y: 0 }, { x: 5, y: 5 }) > 4);

const circleOn = (x, y) => Math.abs(Math.hypot(x - 2000, y - 2000) - 800) <= 80;
const traced = A.processCenterline(A.traceCenterline(circleOn, 2800, 2000, Math.PI / 2));
assert.ok(traced.length > 80, 'circle trace should close with many points, got ' + traced.length);
assert.ok(traced.every(p => p.halfWidth > 30), 'centerline stays on the ribbon');

const jag = sandbox.vehiclePresets.jaguar;
const f1 = sandbox.vehiclePresets.f1;
const kart = sandbox.vehiclePresets.gokart;
const jagV = A.buildSpeedProfile(traced, jag);
const f1V = A.buildSpeedProfile(traced, f1);
const kartV = A.buildSpeedProfile(traced, kart);
const avg = arr => arr.v.reduce((s, v) => s + v, 0) / arr.v.length;
assert.ok(avg(f1V) > avg(jagV), 'F1 planned speed must exceed Jaguar on the same line');
assert.ok(avg(jagV) > 18, 'Jaguar must not crawl on a wide circle');
assert.ok(avg(kartV) > 12, 'kart still gets a usable circle speed');

const mgr = new sandbox.AIManager();
mgr.driveMode = 'autonomous';
const players = {};
const id = mgr.spawnAI(players, 2800, 2000, Math.PI / 2, 'jaguar');
const track = { id: 'circle', startX: 2800, startY: 2000, startAngle: Math.PI / 2 };
const ctx = { probe: circleOn };
mgr.ensureTrace('circle', track, ctx);
assert.ok(mgr.getTrace(track).points.length > 80, 'manager caches a traced line');

players[id].lapStartTime = 0;
const ai = mgr.aiList[id];
ai.simDt = 1 / 60;
ai.aggression = 0.6;
const inputs = ai.calculateInputs(players[id], [], players, track, ctx, true, sandbox.vehiclePresets);
assert.ok(typeof inputs.steering === 'number');
assert.ok(inputs.throttle !== 0 || inputs.handbrake === false, 'autonomous mode produces drive inputs');

const oval = TRACKS.mini1;
const asphalt = strokeFromCmds(oval.cmds, 160);
const bounds = strokeFromCmds(oval.cmds, 240);
assert.ok(asphalt.contains(oval.startX, oval.startY), 'start is on mini1 asphalt');
const miniTrack = Object.assign({ id: 'mini1' }, oval);
const miniCtx = makeProbe(asphalt, bounds);
const mgr2 = new sandbox.AIManager();
mgr2.ensureTrace('mini1', miniTrack, miniCtx);
const pts = mgr2.getTrace(miniTrack).points;
assert.ok(pts && pts.length > 30, 'mini1 traces, got ' + (pts && pts.length));
const prof = mgr2.getProfile(miniTrack, 'mx5', sandbox.vehiclePresets.mx5);
assert.ok(prof.v.every(v => v >= 8 && v <= 92));

const lobby = {};
assert.ok(sandbox.aiManager.spawnAI(lobby, 10, 20, 0, 'f1'));
assert.strictEqual(sandbox.aiManager.driveMode, 'autonomous');

console.log('autonomous-ai tests ok');

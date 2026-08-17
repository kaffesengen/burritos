import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const { strokeFromCmds, makeProbe } = require('./track-stroke.js');
const { TRACKS } = require('./track-fixtures.js');

const appSrc = fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'app.js'), 'utf8');
const presetMatch = appSrc.match(/const vehiclePresets = window\.vehiclePresets = (\{[\s\S]*?\});/);
if (!presetMatch) throw new Error('could not extract vehiclePresets');
const vehiclePresets = vm.runInNewContext('(' + presetMatch[1] + ')');

const sandbox = { performance: { now: () => 0 }, Date, Math, vehiclePresets };
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'ai.js'), 'utf8'), sandbox);

const DT = 1 / 60;

function createCar(presetId, track) {
    const pre = vehiclePresets[presetId];
    return {
        id: 'sim-' + presetId,
        presetId,
        x: track.startX,
        y: track.startY,
        prevX: track.startX,
        prevY: track.startY,
        vx: 0,
        vy: 0,
        angle: track.startAngle,
        yawRate: 0,
        steer: 0,
        gear: 1,
        rpm: 2500,
        speedKmh: 0,
        fuel: 100,
        lap: 0,
        cp: false,
        lapStartTime: 0,
        finished: false,
        ghostTimer: 0,
        isGhost: false,
        frontSpinSeverity: 0,
        rearSpinSeverity: 0,
        appliesBrake: false
    };
}

function stepPhysics(p, ins, pre, onBounds, dt) {
    const steerTarget = Math.max(-1, Math.min(1, ins.steering || 0));
    p.steer += (steerTarget - p.steer) * 12 * dt;
    const maxRadian = (pre.turn * 10) * (Math.PI / 180);
    const delta = Math.max(-maxRadian, Math.min(maxRadian, p.steer * maxRadian));
    let speed = p.speedKmh / 3.6;
    const throttle = ins.throttle || 0;
    const mu = pre.grip;
    const brakeA = Math.min(18, mu * 9.81 * 0.95);
    const accelPeak = Math.min(13, Math.max(3.2, (pre.power / pre.mass) * 16));
    let a = 0;
    if (throttle < 0) a = throttle * brakeA;
    else a = throttle * accelPeak * Math.max(0.25, 1 - speed / 95);
    if (ins.handbrake) a -= 8;
    speed = Math.max(0, speed + a * dt);

    const L = Math.max(1.15, pre.l / 12);
    const yaw = (speed / L) * Math.tan(delta);
    p.angle += yaw * dt;
    p.vx = Math.cos(p.angle) * speed;
    p.vy = Math.sin(p.angle) * speed;
    p.prevX = p.x;
    p.prevY = p.y;
    p.x += p.vx * 12 * dt;
    p.y += p.vy * 12 * dt;
    p.speedKmh = speed * 3.6;
    p.rpm = 2000 + p.speedKmh * 40;

    let bounced = false;
    if (!onBounds(p.x, p.y)) {
        bounced = true;
        p.x = p.prevX;
        p.y = p.prevY;
        let nx = 0, ny = 0;
        for (let r = 20; r <= 80; r += 20) {
            if (onBounds(p.x + r, p.y)) nx += 1;
            if (onBounds(p.x - r, p.y)) nx -= 1;
            if (onBounds(p.x, p.y + r)) ny += 1;
            if (onBounds(p.x, p.y - r)) ny -= 1;
            if (nx || ny) break;
        }
        let nLen = Math.hypot(nx, ny);
        if (nLen === 0) {
            nx = -Math.sign(p.vx) || 1;
            ny = -Math.sign(p.vy);
            nLen = Math.hypot(nx, ny) || 1;
        }
        nx /= nLen;
        ny /= nLen;
        const tx = -ny, ty = nx;
        const vt = p.vx * tx + p.vy * ty;
        p.vx = tx * vt * 0.96;
        p.vy = ty * vt * 0.96;
        p.x += nx * 4;
        p.y += ny * 4;
        p.speedKmh = Math.hypot(p.vx, p.vy) * 3.6;
    }
    return bounced;
}

function runOne(trackId, presetId, seconds) {
    const trackDef = TRACKS[trackId];
    const asphalt = strokeFromCmds(trackDef.cmds, 160);
    const bounds = strokeFromCmds(trackDef.cmds, 240);
    const ctx = makeProbe(asphalt, bounds);
    const track = Object.assign({ id: trackId }, trackDef);
    const mgr = new sandbox.AIManager();
    mgr.driveMode = 'autonomous';
    const players = {};
    const id = mgr.spawnAI(players, track.startX, track.startY, track.startAngle, presetId);
    const car = Object.assign(players[id], createCar(presetId, track));
    players[id] = car;
    const ai = mgr.aiList[id];
    ai.simDt = DT;
    ai.aggression = 0.7;
    car.lapStartTime = -10000;
    mgr.ensureTrace(trackId, track, ctx);
    const pre = vehiclePresets[presetId];
    const steps = Math.round(seconds / DT);
    let off = 0;
    let bounces = 0;
    let maxSpeed = 0;
    let speedSum = 0;
    let teleports = 0;
    let prevGhost = 0;

    for (let i = 0; i < steps; i++) {
        car.inputs = ai.calculateInputs(car, [], players, track, ctx, true, vehiclePresets);
        const bounced = stepPhysics(car, car.inputs, pre, ctx.boundsProbe, DT);
        if (bounced) bounces++;
        if (!ctx.probe(car.x, car.y)) off++;
        maxSpeed = Math.max(maxSpeed, car.speedKmh);
        speedSum += car.speedKmh;
        if (car.ghostTimer > prevGhost + 1) teleports++;
        prevGhost = car.ghostTimer;

        const dCp = Math.hypot(car.x - track.checkpoint.x, car.y - track.checkpoint.y);
        if (dCp < track.checkpoint.radius) car.cp = true;
        const dFin = Math.hypot(car.x - track.finish.x, car.y - track.finish.y);
        if (car.cp && dFin < track.finish.radius) {
            car.lap++;
            car.cp = false;
        }
    }

    return {
        track: trackId,
        car: presetId,
        laps: car.lap,
        avgSpeed: speedSum / steps,
        maxSpeed,
        offPct: 100 * off / steps,
        bounces,
        teleports,
        x: Math.round(car.x),
        y: Math.round(car.y)
    };
}

const cars = ['jaguar', 'mx5', 'f1', 'gokart', 'kartrace', 'jesko', 'valkyrie', 'type49', 'r34', 'elise'];
const tracks = process.argv[2] ? [process.argv[2]] : ['standard', 'gokart', 'monaco', 'spa', 'mini1', 'mini7', 'monza', 'drift'];
const seconds = Number(process.argv[3] || 55);
const rows = [];

for (const t of tracks) {
    for (const c of cars) {
        const row = runOne(t, c, seconds);
        rows.push(row);
        const flag = row.offPct > 12 || row.teleports > 2 || row.avgSpeed < 30 ? 'WEAK' : 'ok';
        console.log(
            `${flag.padEnd(4)} ${t.padEnd(12)} ${c.padEnd(12)} laps=${row.laps} avg=${row.avgSpeed.toFixed(1)} max=${row.maxSpeed.toFixed(0)} off=${row.offPct.toFixed(1)}% bounce=${row.bounces} tp=${row.teleports}`
        );
    }
}

const weak = rows.filter(r => r.offPct > 12 || r.teleports > 2 || r.avgSpeed < 30);
const avgOff = rows.reduce((s, r) => s + r.offPct, 0) / rows.length;
const avgLap = rows.reduce((s, r) => s + r.laps, 0) / rows.length;
const avgSpd = rows.reduce((s, r) => s + r.avgSpeed, 0) / rows.length;
console.log('---');
console.log(`n=${rows.length} avgLaps=${avgLap.toFixed(2)} avgSpeed=${avgSpd.toFixed(1)} avgOff=${avgOff.toFixed(1)}% weak=${weak.length}`);
if (weak.length) {
    console.log('weak cases:');
    for (const r of weak) console.log('  ', r);
}

const out = path.join('/tmp', 'autonomous-sim.json');
fs.writeFileSync(out, JSON.stringify({ rows, weak, avgLap, avgOff, avgSpd }, null, 2));
console.log('wrote', out);
if (weak.length > rows.length * 0.25) process.exit(2);

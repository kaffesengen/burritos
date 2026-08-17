const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const sandbox = { window: {}, console };
vm.createContext(sandbox);
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
vm.runInContext(app.slice(0, app.indexOf('const gearRatios')), sandbox);
vm.runInContext(fs.readFileSync(path.join(__dirname, '..', 'vehicle-bench.js'), 'utf8'), sandbox);

const bench = sandbox.window.vehicleBench;
const presets = sandbox.window.vehiclePresets;
assert.ok(bench && presets.jaguar && presets.f1 && presets.jesko);

const jag = bench.run(presets.jaguar);
const f1 = bench.run(presets.f1);
const mx5 = bench.run(presets.mx5);
const jesko = bench.run(presets.jesko);
const kart = bench.run(presets.kartrace);
const rent = bench.run(presets.kartrent);

assert.ok(jag.t100 > 3 && jag.t100 < 7, 'I-PACE 0-100 from the sim, got ' + jag.t100);
assert.ok(jag.vmax > 130 && jag.vmax < 170, 'I-PACE is rpm/aero limited, got ' + jag.vmax);

assert.ok(f1.t100 < jag.t100, 'F1 must beat I-PACE to 100');
assert.ok(f1.t100 < mx5.t100, 'F1 must beat MX-5 to 100');
assert.ok(f1.vmax > 180 && f1.vmax < 280, 'F1 is aero-limited in this engine, got ' + f1.vmax);

assert.ok(jesko.t100 != null && jesko.t100 < 6, 'Jesko must reach 100 without skip-shifting, got ' + jesko.t100);
assert.ok(jesko.vmax > 400, 'Jesko top speed must clear 400, got ' + jesko.vmax);
assert.ok(jesko.vmax > f1.vmax, 'Jesko aero is lower than F1, so it should finish faster');

assert.ok(kart.vmax > 120 && kart.vmax < 145, 'race kart is gear-limited near 132, got ' + kart.vmax);
assert.strictEqual(rent.t100, null, 'rental kart never reaches 100');
assert.ok(rent.vmax > 80 && rent.vmax < 120, 'rental kart tops out near 100, got ' + rent.vmax);

const again = bench.result('f1', presets);
assert.strictEqual(again.t100, f1.t100, 'cached result must match');

const src = fs.readFileSync(path.join(__dirname, '..', 'vehicle-bench.js'), 'utf8');
assert.ok(src.includes('nextRpm > maxRpm * 0.38'), 'bench must not skip gears at the limiter');
assert.ok(!src.includes('Math.random'), 'bench must be deterministic');

console.log('vehicle-bench tests ok', { jag, f1, mx5, jesko, kart, rent });

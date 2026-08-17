const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, '..', 'vehicle-garage.js'), 'utf8');
const sandbox = {
    window: { vehiclePresets: {
        jaguar: { power: 400, mass: 2200, drivetrain: 'AWD', grip: 1.85, turn: 4.0, ev: true },
        f1: { power: 1050, mass: 798, drivetrain: 'RWD', grip: 3.60, turn: 6.0, ev: false },
        mx5: { power: 184, mass: 1050, drivetrain: 'RWD', grip: 1.60, turn: 4.5, ev: false }
    } },
    document: {
        getElementById: () => null,
        querySelectorAll: () => []
    }
};
sandbox.window.vehicleGarage = undefined;
vm.createContext(sandbox);
vm.runInContext(code, sandbox);
const garage = sandbox.window.vehicleGarage;

const jag = garage.stats('jaguar');
assert.strictEqual(jag.hk, 400);
assert.strictEqual(jag.kg, 2200);
assert.strictEqual(jag.drivetrain, 'AWD');
assert.ok(Math.abs(jag.hpPerTon - 181.818) < 0.01, 'I-PACE hk/t, got ' + jag.hpPerTon);
assert.ok(Math.abs(jag.latG - 2.59) < 0.001, 'I-PACE lat g is 1.4 * grip, got ' + jag.latG);
assert.strictEqual(jag.steerDeg, 40);
assert.strictEqual(jag.accel, undefined, 'fake 0-100 must be gone');
assert.strictEqual(jag.topSpeed, undefined, 'fake top speed must be gone');
assert.strictEqual(jag.ratings, undefined, '0-10 personality ratings must be gone');

const f1 = garage.stats('f1');
assert.ok(f1.hpPerTon > jag.hpPerTon, 'F1 power-to-weight must beat I-PACE');
assert.ok(f1.latG > jag.latG, 'F1 lateral g must beat I-PACE');
assert.strictEqual(f1.steerDeg, 60);
assert.ok(Math.abs(f1.latG - 5.04) < 0.001);

const mx5 = garage.stats('mx5');
assert.ok(mx5.hpPerTon < f1.hpPerTon);
assert.ok(mx5.latG < jag.latG);
assert.strictEqual(mx5.steerDeg, 45);

assert.ok(garage.barScale(181.8, 1315.8) < 0.2, 'I-PACE bar must be short vs F1 max');
assert.strictEqual(garage.barScale(1315.8, 1315.8), 1);
assert.strictEqual(garage.barScale(0, 10), 0);

assert.ok(garage.catalog.length >= 20);
assert.ok(garage.catalog.every(c => c.id && c.name && c.maker && c.year && c.flag));
assert.strictEqual(garage.carName('r34'), 'Nissan Skyline R34');
assert.strictEqual(garage.carName('unknown-car'), 'unknown-car');

garage.select('f1');
assert.strictEqual(garage.selected, 'f1');
assert.strictEqual(garage.gridBuilt, false, 'select without a grid must not pretend the DOM was built');

const src = fs.readFileSync(path.join(__dirname, '..', 'vehicle-garage.js'), 'utf8');
assert.ok(!src.includes('estimate0100'));
assert.ok(!src.includes('estimateTopSpeed'));
assert.ok(!src.includes('0–100'));

console.log('vehicle-garage tests ok', jag.hpPerTon.toFixed(1), f1.hpPerTon.toFixed(1), jag.latG, f1.steerDeg);

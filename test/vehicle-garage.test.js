const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const code = fs.readFileSync(path.join(__dirname, '..', 'vehicle-garage.js'), 'utf8');
const sandbox = {
    window: { vehiclePresets: {
        jaguar: { power: 400, mass: 2200, drivetrain: 'AWD', grip: 1.85, ev: true },
        f1: { power: 1050, mass: 798, drivetrain: 'RWD', grip: 3.60, ev: false },
        mx5: { power: 184, mass: 1050, drivetrain: 'RWD', grip: 1.60, ev: false }
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
assert.ok(jag.accel >= 3.5 && jag.accel <= 6.5, 'I-PACE 0-100 should be mid-range, got ' + jag.accel);

const f1 = garage.stats('f1');
assert.ok(f1.accel <= 2.6, 'F1 should be very quick, got ' + f1.accel);

const mx5 = garage.stats('mx5');
assert.ok(mx5.accel > f1.accel, 'MX-5 should be slower than F1');
assert.ok(garage.catalog.length >= 20);
assert.ok(garage.catalog.every(c => c.id && c.name && c.maker));

console.log('vehicle-garage tests ok', jag.accel, f1.accel, mx5.accel);

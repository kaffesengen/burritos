const assert = require('assert');
const fs = require('fs');
const path = require('path');

function carsMustHoldGrid(raceState, sandbox, tournamentActive, splitScreen) {
    if (raceState === 0) return false;
    if (sandbox && raceState < 0) return false;
    if (tournamentActive) return true;
    if (splitScreen) return true;
    return raceState > 0;
}

assert.strictEqual(carsMustHoldGrid(-1, false, true, false), true, 'tournament pit: hold on grid');
assert.strictEqual(carsMustHoldGrid(5, false, true, false), true, 'tournament lights: hold on grid');
assert.strictEqual(carsMustHoldGrid(0, false, true, false), false, 'green flag: release');
assert.strictEqual(carsMustHoldGrid(-1, true, false, false), false, 'sandbox roam is allowed');
assert.strictEqual(carsMustHoldGrid(3, true, false, false), true, 'sandbox countdown still holds');
assert.strictEqual(carsMustHoldGrid(-1, false, false, true), true, 'split-screen waits on the grid');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
assert.ok(app.includes('function beginRaceCountdown'), 'countdown must be a shared helper');
assert.ok(app.includes('function scheduleAutoStart'), 'tournament tracks must auto-start lights');
assert.ok(app.includes('scheduleAutoStart(900)'), 'first tournament track auto-starts');
assert.ok(app.includes('scheduleAutoStart(1100)'), 'later tournament tracks auto-start');
assert.ok(app.includes('function carsMustHoldGrid'), 'grid hold must be explicit');
assert.ok(app.includes('let raceIsRunning = (raceState === 0)'), 'AI must not drive before green');

console.log('auto-start-grid tests ok');

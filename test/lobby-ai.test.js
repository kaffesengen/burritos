const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

function canManageLobbyAI(isHost, gameActive) {
    return !!(isHost && !gameActive);
}

assert.strictEqual(canManageLobbyAI(true, false), true, 'host in lobby can add AI');
assert.strictEqual(canManageLobbyAI(true, true), false, 'host cannot add AI mid-race');
assert.strictEqual(canManageLobbyAI(false, false), false, 'joiner cannot add AI');
assert.strictEqual(canManageLobbyAI(false, true), false, 'joiner cannot add AI in race');

function lobbyPlayerSort(a, b, hostId) {
    if (hostId) {
        if (a.id === hostId) return -1;
        if (b.id === hostId) return 1;
    }
    if (!!a.isAI !== !!b.isAI) return a.isAI ? 1 : -1;
    return String(a.id || '').localeCompare(String(b.id || ''));
}

function lobbyPlayerPayload(players, hostId) {
    return Object.values(players)
        .slice()
        .sort((a, b) => lobbyPlayerSort(a, b, hostId))
        .map(p => ({ id: p.id, n: p.name, c: p.color, presetId: p.presetId, isAI: !!p.isAI }));
}

const field = {
    'zzz-human': { id: 'zzz-human', name: 'Bo', color: '#111', presetId: 'mx5', isAI: false },
    'host-1': { id: 'host-1', name: 'Host', color: '#222', presetId: 'jaguar', isAI: false },
    'AI_1': { id: 'AI_1', name: '[AI] Hugo', color: '#333', presetId: 'f1', isAI: true }
};
const payload = lobbyPlayerPayload(field, 'host-1');
assert.strictEqual(payload[0].id, 'host-1', 'host stays at the top');
assert.strictEqual(payload[1].id, 'zzz-human', 'humans come before AI');
assert.strictEqual(payload[2].id, 'AI_1', 'AI sits at the bottom of the list');
assert.strictEqual(payload[2].isAI, true);
assert.strictEqual(payload[2].presetId, 'f1', 'AI car choice is in the lobby payload');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(__dirname, '..', 'style.css'), 'utf8');
const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

assert.ok(html.includes('id="lobby-ai-preset"'), 'lobby must have an AI car selector');
assert.ok(html.includes('id="btn-lobby-add-ai"'), 'lobby must have add-AI');
assert.ok(html.includes('id="btn-lobby-remove-ai"'), 'lobby must have remove-AI');
assert.ok(!html.includes('id="btn-add-ai"'), 'in-race add-AI button must be gone');
assert.ok(!html.includes('id="ai-preset-selector"'), 'in-race AI preset selector must be gone');
assert.ok(html.includes('Velg bil og legg til AI her i lobbyen'));

assert.ok(css.includes('.lobby-ai-row'));
assert.ok(css.includes('.lobby-ai-badge'));
assert.ok(css.includes('.lobby-player-list') && css.includes('overflow-y: auto'));

assert.ok(app.includes('function canManageLobbyAI'));
assert.ok(app.includes('function addLobbyAI'));
assert.ok(app.includes('function fillLobbyAISelector'));
assert.ok(app.includes('vehicleGarage.visibleCars'));
assert.ok(app.includes('isAI: !!p.isAI'));
assert.ok(app.includes("p.isAI ? ' <em class=\"lobby-ai-badge\">AI</em>'"));
assert.ok(!app.includes("getElementById('ai-preset-selector')"));
assert.ok(!app.includes("getElementById('btn-add-ai')"));
assert.ok(app.includes('addLobbyAI(document.getElementById(\'lobby-ai-preset\')?.value)'));
assert.ok(app.includes('function removeLastLobbyAI'));

const sandbox = {
    performance: { now: () => 1000 },
    Date,
    Math,
    vehiclePresets: {
        jaguar: { fuelCap: 100 },
        f1: { fuelCap: 110 },
        mx5: { fuelCap: 50 }
    }
};
vm.createContext(sandbox);
vm.runInContext(
    fs.readFileSync(path.join(__dirname, '..', 'ai.js'), 'utf8') + '\nthis.aiManager = aiManager;',
    sandbox
);

const players = {};
const id = sandbox.aiManager.spawnAI(players, 10, 20, 0, 'f1');
assert.ok(id, 'spawnAI must return an id');
assert.ok(players[id].isAI);
assert.strictEqual(players[id].presetId, 'f1');
assert.ok(String(players[id].name).startsWith('[AI] '));
assert.strictEqual(players[id].x, 10);
assert.ok(sandbox.aiManager.aiList[id]);

const missing = sandbox.aiManager.spawnAI(players, 10, 20, 0, 'not-a-car');
assert.strictEqual(players[missing].presetId, 'jaguar', 'unknown car falls back to jaguar');

assert.strictEqual(sandbox.aiManager.removeAI(players, id), true);
assert.ok(!players[id]);
assert.ok(!sandbox.aiManager.aiList[id]);
assert.strictEqual(sandbox.aiManager.removeAI(players, missing), true);

sandbox.aiManager.maxAI = 1;
const first = sandbox.aiManager.spawnAI(players, 0, 0, 0, 'mx5');
assert.ok(first);
assert.strictEqual(sandbox.aiManager.spawnAI(players, 0, 0, 0, 'mx5'), null, 'cap must block extra AI');

console.log('lobby-ai tests ok');

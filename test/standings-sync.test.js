const fs = require('fs');
const path = require('path');
const assert = require('assert');

const app = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');

assert.ok(
    app.includes('stateMsg.tournament = serializeTournament()'),
    'host state packets must include scores and lastStandings, not just phase'
);
assert.ok(app.includes('function syncTournamentOverlays'), 'joiners must open the overlay from synced tournament phase');
assert.ok(
    /data\.type === 'state'[\s\S]{0,500}applyTournamentFromNet/.test(app),
    'joiner state handler must apply the full tournament payload'
);
assert.ok(
    /tournament\.phase === 'standings'[\s\S]{0,200}syncTournamentOverlays/.test(app),
    'standings phase must keep the overlay visible on every client'
);

function rankingFromScores(scores) {
    return Object.keys(scores).map(id => ({
        id,
        n: scores[id].name,
        points: scores[id].points
    })).sort((a, b) => b.points - a.points || String(a.n).localeCompare(String(b.n)));
}

const rank = rankingFromScores({
    host: { name: 'KAFFESENGEN', points: 3 },
    joiner: { name: 'Firez', points: 5 }
});
assert.strictEqual(rank[0].n, 'Firez');
assert.strictEqual(rank[1].n, 'KAFFESENGEN');

function joinerSeesStandings(t) {
    return !!(t && t.active && t.phase === 'standings');
}
assert.ok(joinerSeesStandings({
    active: true,
    phase: 'standings',
    lastStandings: [{ name: 'KAFFESENGEN', roundPoints: 3, totalPoints: 3 }]
}));
assert.ok(!joinerSeesStandings({ active: true, phase: 'racing' }));
assert.ok(!joinerSeesStandings({ active: false, phase: 'standings' }));

function mergeTournament(local, t) {
    if (!t) return local;
    local.active = !!t.active;
    if (t.phase) local.phase = t.phase;
    if (t.lastStandings) local.lastStandings = t.lastStandings;
    if (t.scores) local.scores = t.scores;
    return local;
}

const joinerTour = mergeTournament(
    { active: true, phase: 'racing', lastStandings: [] },
    {
        active: true,
        phase: 'standings',
        lastStandings: [{ name: 'Firez', totalPoints: 3 }],
        scores: { a: { name: 'Firez', points: 3 } }
    }
);
assert.strictEqual(joinerTour.phase, 'standings');
assert.strictEqual(joinerTour.lastStandings[0].name, 'Firez');
assert.ok(joinerSeesStandings(joinerTour));

console.log('standings-sync tests ok');

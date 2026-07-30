const vehiclePresets = {
    jaguar: { power: 400, mass: 2200, drivetrain: 'AWD', grip: 1.85, turn: 4.0, roll: 0.05, w: 24, l: 52, ev: true, type: 'jaguar', fuelCap: 100 },
    gokart: { power: 30, mass: 150, drivetrain: 'RWD', grip: 2.10, turn: 5.5, roll: 0.02, w: 16, l: 26, ev: false, type: 'gokart', fuelCap: 10 },
    mx5: { power: 184, mass: 1050, drivetrain: 'RWD', grip: 1.60, turn: 4.5, roll: 0.04, w: 20, l: 42, ev: false, type: 'mx5', fuelCap: 50 },
    r34: { power: 330, mass: 1560, drivetrain: 'AWD', grip: 1.85, turn: 3.8, roll: 0.04, w: 22, l: 48, ev: false, type: 'r34', fuelCap: 70 },
    s15: { power: 420, mass: 1240, drivetrain: 'RWD', grip: 1.70, turn: 5.5, roll: 0.04, w: 21, l: 45, ev: false, type: 's15', fuelCap: 65 },
    f1: { power: 1050, mass: 798, drivetrain: 'RWD', grip: 3.60, turn: 6.0, roll: 0.09, w: 26, l: 64, ev: false, type: 'f1', fuelCap: 110 }
};

const gearRatios = [0, 3.5, 2.2, 1.6, 1.2, 0.9];
const finalDrive = 3.8;
const wheelRadius = 0.32;

const tracks = {
    standard: {
        path: (() => { let p = new Path2D(); p.moveTo(4400, 3200); p.lineTo(800, 3200); p.bezierCurveTo(200, 3200, 200, 2600, 600, 2200); p.lineTo(1400, 1400); p.bezierCurveTo(1600, 1200, 2000, 1400, 1800, 1800); p.lineTo(1200, 2400); p.bezierCurveTo(1000, 2600, 1400, 2800, 1800, 2600); p.lineTo(3200, 1600); p.bezierCurveTo(3600, 1400, 3800, 800, 4200, 800); p.bezierCurveTo(4800, 800, 4800, 1600, 4400, 1800); p.lineTo(4600, 2400); p.bezierCurveTo(4800, 2800, 4800, 3200, 4400, 3200); p.closePath(); return p; })(),
        startX: 2100, startY: 3200, startAngle: Math.PI, pit: { x1: 1800, x2: 2400, y1: 3000, y2: 3080 },
        finish: { x1: 2100, y1: 3000, x2: 2100, y2: 3400 }, checkpoint: { x1: 4400, y1: 1600, x2: 4400, y2: 2000 }
    },
    drift: {
        path: (() => { let p = new Path2D(); p.moveTo(2500, 2000); p.bezierCurveTo(1500, 3500, 500, 3000, 500, 2000); p.bezierCurveTo(500, 1000, 1500, 500, 2500, 2000); p.bezierCurveTo(3500, 3500, 4500, 3000, 4500, 2000); p.bezierCurveTo(4500, 1000, 3500, 500, 2500, 2000); p.closePath(); return p; })(),
        startX: 2500, startY: 2000, startAngle: Math.PI/4, pit: { x1: 2300, x2: 2600, y1: 1700, y2: 1800 },
        finish: { x1: 2350, y1: 2150, x2: 2650, y2: 1850 }, checkpoint: { x1: 500, y1: 1800, x2: 500, y2: 2200 }
    },
    gokart: {
        path: (() => { let p = new Path2D(); p.moveTo(1000, 3000); p.bezierCurveTo(500, 3000, 500, 2000, 1000, 2000); p.lineTo(3000, 2000); p.bezierCurveTo(3500, 2000, 3500, 1000, 3000, 1000); p.lineTo(1000, 1000); p.bezierCurveTo(500, 1000, 500, 500, 1000, 500); p.lineTo(4000, 500); p.bezierCurveTo(4500, 500, 4500, 3000, 4000, 3000); p.closePath(); return p; })(),
        startX: 2000, startY: 3000, startAngle: Math.PI, pit: { x1: 1700, x2: 2100, y1: 2800, y2: 2880 },
        finish: { x1: 2000, y1: 2900, x2: 2000, y2: 3100 }, checkpoint: { x1: 3000, y1: 900, x2: 3000, y2: 1100 }
    }
};

let activeTrackId = 'standard'; let activeTrack = tracks[activeTrackId]; let envObjects = [];
let serverSettings = { grip: 1.0, power: 1.0, mass: 1.0, steering: 1.0, caster: 1.0 };

function generateEnvironment() {
    envObjects.length = 0; const canvasCtx = document.createElement('canvas').getContext('2d'); canvasCtx.lineWidth = 350; 
    for(let i=0; i<150; i++) {
        let rx = Math.random() * 5000; let ry = Math.random() * 4000;
        if(!canvasCtx.isPointInStroke(activeTrack.path, rx, ry)) {
            let isHouse = Math.random() > 0.8;
            envObjects.push({ 
                x: rx, y: ry, type: isHouse ? 'house' : 'tree', 
                color: isHouse ? (Math.random() > 0.5 ? '#8d6e63' : '#7f8c8d') : (Math.random() > 0.5 ? '#27ae60' : '#2ecc71'), 
                size: isHouse ? (40 + Math.random()*30) : (15 + Math.random()*20), angle: Math.random() * Math.PI 
            });
        }
    }
}
generateEnvironment();

let peer = null, isHost = true, gameActive = false, myId = null, hostConnection = null;
const connections = {}, players = {}; 
let raceState = -1, totalLaps = 3, raceStartTime = 0;

function createPlayerRecord(id, presetId, name) {
    let safeName = "Gjest";
    if (typeof name === 'string' && name.trim().length > 0) safeName = name.trim().substring(0, 15);
    let cap = vehiclePresets[presetId]?.fuelCap || 100;
    return {
        id: id, name: safeName, presetId: presetId || 'jaguar',
        x: activeTrack.startX, y: activeTrack.startY, prevX: activeTrack.startX, prevY: activeTrack.startY,
        vx: 0, vy: 0, angle: activeTrack.startAngle, yawRate: 0,
        gear: 1, rpm: 1000, steer: 0, targetX: activeTrack.startX, targetY: activeTrack.startY, targetAngle: activeTrack.startAngle,
        inputs: { steering: 0, throttle: 0, handbrake: false },
        frontSpinSeverity: 0, rearSpinSeverity: 0, appliesBrake: false, speedKmh: 0, fuel: cap, maxFuel: cap,
        lastSeen: performance.now(), clutchDump: 0,
        lap: 0, cp: false, lapStartTime: 0, currentLapTime: 0, bestLap: Infinity, totalTime: 0, finished: false
    };
}

function assignGridPositions() {
    let ids = Object.keys(players);
    ids.forEach((pid, index) => {
        let row = Math.floor(index / 2); let col = index % 2 === 0 ? 1 : -1; let spacing = 120, lateral = 40;
        players[pid].x = activeTrack.startX - Math.cos(activeTrack.startAngle) * (row * spacing + 60) + Math.sin(activeTrack.startAngle) * (col * lateral);
        players[pid].y = activeTrack.startY - Math.sin(activeTrack.startAngle) * (row * spacing + 60) - Math.cos(activeTrack.startAngle) * (col * lateral);
        players[pid].angle = activeTrack.startAngle; players[pid].vx = 0; players[pid].vy = 0; players[pid].yawRate = 0;
        players[pid].lap = 0; players[pid].cp = false; players[pid].finished = false; players[pid].totalTime = 0; players[pid].lapStartTime = 0; players[pid].currentLapTime = 0; players[pid].bestLap = Infinity;
    });
}

function linesIntersect(x1,y1, x2,y2, x3,y3, x4,y4) {
    let det = (x1-x2)*(y3-y4) - (y1-y2)*(x3-x4);
    if (det === 0) return false;
    let t = ((x1-x3)*(y3-y4) - (y1-y3)*(x3-x4)) / det;
    let u = -((x1-x2)*(y1-y3) - (y1-y2)*(x1-x3)) / det;
    return (t > 0 && t < 1 && u > 0 && u < 1);
}

const statusMsg = document.getElementById('status-msg');
function showMsg(msg) { statusMsg.innerText = msg; }
function enterGame() {
    gameActive = true; document.getElementById('lobby').style.display = 'none'; document.getElementById('canvas-container').style.display = 'flex';
    if(isHost) { document.getElementById('host-actions').style.display = 'flex'; document.getElementById('sandbox-controls').style.display = 'block'; assignGridPositions(); }
    resize(); requestAnimationFrame(update);
}

let audioCtx, engineOsc, engineGain, squealOsc, squealGain, audioReady = false;
function initAudio() {
    if (audioReady) return;
    try {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        engineOsc = audioCtx.createOscillator(); engineOsc.type = 'sawtooth'; engineGain = audioCtx.createGain(); engineGain.gain.value = 0;
        engineOsc.connect(engineGain); engineGain.connect(audioCtx.destination); engineOsc.start();
        squealOsc = audioCtx.createOscillator(); squealOsc.type = 'triangle'; squealGain = audioCtx.createGain(); squealGain.gain.value = 0;
        squealOsc.connect(squealGain); squealGain.connect(audioCtx.destination); squealOsc.start();
        audioReady = true;
    } catch(e) { console.error("Audio init failed", e); }
}
function resumeAudio() { if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); }
document.body.addEventListener('pointerdown', () => { initAudio(); resumeAudio(); }, { once: true });
document.body.addEventListener('keydown', () => { initAudio(); resumeAudio(); }, { once: true });

function playBeep(freq, duration = 0.3) {
    if (!audioReady || audioCtx.state !== 'running') return;
    let osc = audioCtx.createOscillator(); let gain = audioCtx.createGain();
    osc.frequency.value = freq; osc.connect(gain); gain.connect(audioCtx.destination);
    osc.start(); gain.gain.setValueAtTime(0.5, audioCtx.currentTime); gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + duration); osc.stop(audioCtx.currentTime + duration);
}

['grip', 'power', 'mass', 'steering', 'caster'].forEach(id => {
    document.getElementById(`sb-${id}`).addEventListener('input', (e) => {
        serverSettings[id] = parseFloat(e.target.value); document.getElementById(`val-${id}`).innerText = serverSettings[id].toFixed(1);
    });
});

document.getElementById('btn-sandbox-mode').addEventListener('click', () => {
    myId = 'sandbox'; isHost = true; gameActive = true; let pName = document.getElementById('player-name').value || "Meg";
    players[myId] = createPlayerRecord(myId, document.getElementById('preset-selector').value, pName);
    totalLaps = parseInt(document.getElementById('host-laps').value) || 3; enterGame();
});

document.getElementById('btn-host-mode').addEventListener('click', () => {
    document.getElementById('mode-selection').style.display = 'none'; document.getElementById('host-ui').style.display = 'block'; showMsg('Oppretter Host...');
    peer = new Peer();
    peer.on('open', id => {
        myId = id; isHost = true; document.getElementById('my-host-id').value = id; showMsg('');
        let pName = document.getElementById('player-name').value || "Host";
        players[myId] = createPlayerRecord(myId, document.getElementById('preset-selector').value, pName);
    });
    peer.on('connection', conn => {
        connections[conn.peer] = conn; document.getElementById('player-count').innerText = `Spillere: ${Object.keys(connections).length + 1}`;
        conn.on('data', data => {
            if (data.type === 'join') {
                players[conn.peer] = createPlayerRecord(conn.peer, data.preset, data.name);
                if (gameActive) {
                    if (raceState === 0) {
                        players[conn.peer].x = activeTrack.pit.x1 + 100; players[conn.peer].y = activeTrack.pit.y1 + 40;
                        players[conn.peer].lapStartTime = performance.now();
                    } else { assignGridPositions(); }
                    conn.send({ type: 'init', trackId: activeTrackId, laps: totalLaps });
                    conn.send({ type: 'start', laps: totalLaps }); 
                } else {
                    conn.send({ type: 'init', trackId: activeTrackId, laps: parseInt(document.getElementById('host-laps').value) });
                }
            } else if (data.type === 'inputs' && players[conn.peer]) {
                players[conn.peer].inputs = data.inputs; players[conn.peer].lastSeen = performance.now();
            } else if (data.type === 'changeCar' && players[conn.peer]) {
                players[conn.peer].presetId = data.preset; players[conn.peer].maxFuel = vehiclePresets[data.preset]?.fuelCap || 100;
            }
        });
        conn.on('close', () => { delete connections[conn.peer]; delete players[conn.peer]; document.getElementById('player-count').innerText = `Spillere: ${Object.keys(connections).length + 1}`; });
    });
});

document.getElementById('btn-share-link').addEventListener('click', () => {
    const url = window.location.origin + window.location.pathname + '?join=' + myId;
    if (navigator.share) navigator.share({ url: url }); else { navigator.clipboard.writeText(url); alert('Kopiert!'); }
});

document.getElementById('btn-enter-game').addEventListener('click', () => { 
    totalLaps = parseInt(document.getElementById('host-laps').value) || 3;
    Object.values(connections).forEach(c => c.send({ type: 'start', laps: totalLaps })); enterGame(); 
});

document.getElementById('track-selector').addEventListener('change', (e) => {
    if(!isHost) return; activeTrackId = e.target.value; activeTrack = tracks[activeTrackId]; generateEnvironment();
    assignGridPositions(); raceState = -1; Object.values(connections).forEach(c => c.send({ type: 'init', trackId: activeTrackId, laps: totalLaps }));
});
document.getElementById('btn-reset').addEventListener('click', () => { if(isHost) { assignGridPositions(); raceState = -1; } });

document.getElementById('btn-start-race').addEventListener('click', () => {
    if(!isHost || raceState > 0) return;
    assignGridPositions(); totalLaps = parseInt(document.getElementById('host-laps').value) || 3;
    let count = 5; raceState = count;
    Object.values(connections).forEach(c => c.send({ type: 'state', laps: totalLaps, raceState: raceState, players: {} })); 
    let int = setInterval(() => {
        count--; raceState = count;
        if(count === 0) { 
            let now = performance.now(); raceStartTime = now;
            for(let pid in players) { players[pid].lapStartTime = now; players[pid].lap = 0; players[pid].cp = false; players[pid].finished = false; players[pid].bestLap = Infinity; }
            clearInterval(int); 
        }
    }, 1000);
});

function initJoiner(hostId) {
    document.getElementById('mode-selection').style.display = 'none'; showMsg('Kobler til...');
    peer = new Peer();
    peer.on('open', id => {
        myId = id; isHost = false; hostConnection = peer.connect(hostId);
        hostConnection.on('open', () => {
            showMsg('Tilkoblet! Venter på host...');
            let pName = document.getElementById('player-name').value || "Spiller";
            players[myId] = createPlayerRecord(myId, document.getElementById('preset-selector').value, pName);
            hostConnection.send({ type: 'join', preset: document.getElementById('preset-selector').value, name: pName });
        });
        hostConnection.on('data', data => {
            if (data.type === 'init') { activeTrackId = data.trackId; activeTrack = tracks[activeTrackId]; generateEnvironment(); if(data.laps) totalLaps = data.laps; } 
            else if (data.type === 'start') { if(data.laps) totalLaps = data.laps; enterGame(); } 
            else if (data.type === 'state') {
                if(data.laps) totalLaps = data.laps; if(data.raceState !== undefined) raceState = data.raceState;
                if(data.settings) serverSettings = data.settings;
                for (let pid in data.players) {
                    if (!players[pid]) players[pid] = createPlayerRecord(pid, data.players[pid].presetId, data.players[pid].n);
                    let pData = data.players[pid], p = players[pid];
                    p.targetX = pData.x; p.targetY = pData.y; p.targetAngle = pData.a; p.steer = pData.s; p.name = pData.n;
                    p.frontSpinSeverity = pData.fS; p.rearSpinSeverity = pData.rS; p.gear = pData.g; p.rpm = pData.rpm; 
                    p.speedKmh = pData.v; p.fuel = pData.f; p.presetId = pData.presetId; p.maxFuel = vehiclePresets[pData.presetId]?.fuelCap || 100;
                    p.appliesBrake = pData.b; p.lap = pData.l; p.bestLap = pData.bl; p.finished = pData.fin; p.currentLapTime = pData.cLT; p.lastSeen = performance.now();
                }
                for (let pid in players) { if(pid !== myId && !data.players[pid]) delete players[pid]; }
            }
        });
    });
}

document.getElementById('btn-join-mode').addEventListener('click', () => { const code = document.getElementById('join-code-input').value.trim(); if (code) initJoiner(code); });
const urlParams = new URLSearchParams(window.location.search); 
if (urlParams.get('join')) { document.getElementById('join-code-input').value = urlParams.get('join'); }

document.getElementById('preset-selector').addEventListener('change', (e) => {
    let preset = e.target.value; if(players[myId]) players[myId].presetId = preset;
    if(isHost) players[myId].maxFuel = vehiclePresets[preset]?.fuelCap || 100; else if(hostConnection) hostConnection.send({ type: 'changeCar', preset: preset });
});

const localInputs = { steering: 0, throttle: 0, handbrake: false }; const activeTouchState = { left: null, right: null };
function setupJoystick(zId, sId, key, onC) {
    const z = document.getElementById(zId), s = document.getElementById(sId);
    function move(cX, cY) { if(document.getElementById('input-selector').value==='gamepad') return; const r = z.getBoundingClientRect(); const dx = Math.max(-45, Math.min(cX-(r.left+r.width/2), 45)), dy = Math.max(-45, Math.min(cY-(r.top+r.height/2), 45)); s.style.transform = `translate(${dx}px, ${dy}px)`; onC(dx/45, dy/45); }
    z.addEventListener('touchstart', e => { if(document.getElementById('input-selector').value==='gamepad') return; if(activeTouchState[key]===null){ activeTouchState[key]=e.changedTouches[0].identifier; move(e.changedTouches[0].clientX, e.changedTouches[0].clientY); resumeAudio(); } });
    window.addEventListener('touchmove', e => { if(document.getElementById('input-selector').value==='gamepad') return; for(let t of e.changedTouches) if(t.identifier===activeTouchState[key]) move(t.clientX, t.clientY); });
    window.addEventListener('touchend', e => { for(let t of e.changedTouches) if(t.identifier===activeTouchState[key]){ activeTouchState[key]=null; s.style.transform=`translate(0px, 0px)`; onC(0,0); } });
}
setupJoystick('joystick-left-zone', 'stick-left', 'left', (x, y) => localInputs.steering = x); setupJoystick('joystick-right-zone', 'stick-right', 'right', (x, y) => localInputs.throttle = -y);
const hbBtn = document.getElementById('btn-handbrake'); const hb = s => e => { if(document.getElementById('input-selector').value==='gamepad') return; e.preventDefault(); localInputs.handbrake = s; resumeAudio(); };
hbBtn.addEventListener('touchstart', hb(true), {passive:false}); hbBtn.addEventListener('touchend', hb(false), {passive:false});

window.addEventListener('keydown', e => { if(document.getElementById('input-selector').value==='gamepad') return; if(e.key==='w'||e.key==='ArrowUp') localInputs.throttle=1; if(e.key==='s'||e.key==='ArrowDown') localInputs.throttle=-1; if(e.key==='a'||e.key==='ArrowLeft') localInputs.steering=-1; if(e.key==='d'||e.key==='ArrowRight') localInputs.steering=1; if(e.key===' ') localInputs.handbrake=true; resumeAudio(); });
window.addEventListener('keyup', e => { if(document.getElementById('input-selector').value==='gamepad') return; if(e.key==='w'||e.key==='s'||e.key==='ArrowUp'||e.key==='ArrowDown') localInputs.throttle=0; if(e.key==='a'||e.key==='d'||e.key==='ArrowLeft'||e.key==='ArrowRight') localInputs.steering=0; if(e.key===' ') localInputs.handbrake=false; });

const canvas = document.getElementById('gameCanvas'); const ctx = canvas.getContext('2d', { alpha: false }); 
function resize() { canvas.width = canvas.parentElement.clientWidth || window.innerWidth; canvas.height = canvas.parentElement.clientHeight || window.innerHeight; ctx.setTransform(1,0,0,1,0,0); }
window.addEventListener('resize', resize); document.getElementById('btn-fullscreen').addEventListener('click', () => { const e = document.documentElement; if(!document.fullscreenElement) e.requestFullscreen(); else document.exitFullscreen(); setTimeout(resize,200); });

let lastTime = performance.now(); let lastLightState = -1; const skidmarks = [];
function formatTime(ms) { if(ms === Infinity || !ms || isNaN(ms)) return "-.--"; let total = Math.floor(ms/10); let min = Math.floor(total/6000); let sec = Math.floor((total%6000)/100); let hund = total%100; return `${min>0?min+':':''}${sec.toString().padStart(min>0?2:1,'0')}.${hund.toString().padStart(2,'0')}`; }

function update() {
    if (!gameActive) return;
    const now = performance.now(); const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1)); lastTime = now;

    if (document.getElementById('input-selector').value === 'gamepad') {
        let gp = navigator.getGamepads()[0];
        if (gp) { localInputs.steering = gp.axes[0]; localInputs.throttle = gp.buttons[7].value - gp.buttons[6].value; localInputs.handbrake = gp.buttons[0].pressed; resumeAudio(); }
    }

    if (players[myId]) players[myId].inputs = localInputs;
    if (!isHost && hostConnection && hostConnection.open) hostConnection.send({ type: 'inputs', inputs: localInputs });

    if (isHost) {
        let outState = { type: 'state', raceState: raceState, laps: totalLaps, settings: serverSettings, players: {} };
        let pkeys = Object.keys(players);
        
        for (let pid of pkeys) {
            let p = players[pid]; 
            if (pid !== myId && now - p.lastSeen > 3000) { delete players[pid]; if (connections[pid]) { connections[pid].close(); delete connections[pid]; } document.getElementById('player-count').innerText = `Spillere: ${Object.keys(connections).length + 1}`; continue; }

            let preset = vehiclePresets[p.presetId] || vehiclePresets['jaguar']; let ins = p.inputs || { steering: 0, throttle: 0, handbrake: false };
            if (isNaN(p.x) || isNaN(p.y) || isNaN(p.vx) || isNaN(p.angle)) { p.x = activeTrack.startX; p.y = activeTrack.startY; p.vx=0; p.vy=0; p.angle=activeTrack.startAngle; p.yawRate=0; }
            if (p.finished) { ins.throttle = 0; ins.handbrake = true; }

            if (raceState === 0 && !p.finished) {
                p.currentLapTime = now - p.lapStartTime;
                if (linesIntersect(p.prevX, p.prevY, p.x, p.y, activeTrack.checkpoint.x1, activeTrack.checkpoint.y1, activeTrack.checkpoint.x2, activeTrack.checkpoint.y2)) p.cp = true;
                if (p.cp && linesIntersect(p.prevX, p.prevY, p.x, p.y, activeTrack.finish.x1, activeTrack.finish.y1, activeTrack.finish.x2, activeTrack.finish.y2)) {
                    p.lap++; p.cp = false; let lapTime = now - p.lapStartTime; if (lapTime < p.bestLap) p.bestLap = lapTime; p.lapStartTime = now;
                    if (p.lap >= totalLaps) { p.finished = true; p.totalTime = now; }
                }
            } else if (raceState > 0) { p.currentLapTime = 0; }

            let inPit = (p.x >= activeTrack.pit.x1 && p.x <= activeTrack.pit.x2 && p.y >= activeTrack.pit.y1 && p.y <= activeTrack.pit.y2);
            let aPower = preset.power * serverSettings.power; let aMass = preset.mass * serverSettings.mass;
            
            if (inPit && p.speedKmh < 10) p.fuel = Math.min(preset.fuelCap, p.fuel + 20 * dt); else p.fuel -= Math.abs(ins.throttle) * aPower * 0.00015 * dt;
            if (p.fuel <= 0) { p.fuel = 0; ins.throttle = 0; }

            ctx.lineWidth = 160; const onAsphalt = ctx.isPointInStroke(activeTrack.path, p.x, p.y);
            ctx.lineWidth = 190; const onCurbs = ctx.isPointInStroke(activeTrack.path, p.x, p.y) && !onAsphalt;
            ctx.lineWidth = 240; const onSand = ctx.isPointInStroke(activeTrack.path, p.x, p.y) && !onAsphalt && !onCurbs;
            ctx.lineWidth = 250; const inBounds = ctx.isPointInStroke(activeTrack.path, p.x, p.y);
            let surfaceMu = preset.grip * serverSettings.grip; let rollingResistance = preset.roll;
            if (onCurbs) surfaceMu *= 0.85; else if (onSand) { surfaceMu *= 0.4; rollingResistance = 0.35; } else if (!onAsphalt) { surfaceMu *= 0.55; rollingResistance = 0.15; }

            if (!inBounds && dt > 0) {
                p.x = p.prevX; p.y = p.prevY; let nx = 0, ny = 0;
                for (let r = 20; r <= 80; r += 20) {
                    if (ctx.isPointInStroke(activeTrack.path, p.x + r, p.y)) nx += 1; if (ctx.isPointInStroke(activeTrack.path, p.x - r, p.y)) nx -= 1;
                    if (ctx.isPointInStroke(activeTrack.path, p.x, p.y + r)) ny += 1; if (ctx.isPointInStroke(activeTrack.path, p.x, p.y - r)) ny -= 1;
                    if (nx !== 0 || ny !== 0) break;
                }
                let nLen = Math.hypot(nx, ny); if (nLen === 0) { nx = -Math.sign(p.vx); ny = -Math.sign(p.vy); nLen = Math.hypot(nx, ny); if (nLen === 0) { nx = 1; ny = 0; nLen = 1; } }
                nx /= nLen; ny /= nLen; let vn = p.vx * nx + p.vy * ny;
                if (vn < 0) {
                    let j = -(1 + 0.15) * vn; p.vx += j * nx; p.vy += j * ny; let tx = -ny; let ty = nx; let vt = p.vx * tx + p.vy * ty;
                    let j_friction = -Math.sign(vt) * Math.min(Math.abs(vt), Math.abs(j) * 0.3); p.vx += j_friction * tx; p.vy += j_friction * ty;
                }
                p.x += nx * 4.0; p.y += ny * 4.0;
            }

            let steerInputTarget = Math.abs(ins.steering) > 0.08 ? Math.sign(ins.steering) * ((Math.abs(ins.steering) - 0.08) / 0.92) : 0;
            p.steer += (steerInputTarget - p.steer) * 12.0 * dt; let mThrottle = Math.pow(Math.abs(ins.throttle), 2.5) * Math.sign(ins.throttle);
            let lVx = p.vx * Math.cos(-p.angle) - p.vy * Math.sin(-p.angle); let lVy = p.vx * Math.sin(-p.angle) + p.vy * Math.cos(-p.angle);
            p.speedKmh = Math.abs(lVx * 3.6); p.appliesBrake = mThrottle < 0 && lVx >= 1.0;

            let dForce = 0; let bForce = p.appliesBrake ? aMass * 15.0 * Math.abs(mThrottle) : 0; const isRev = mThrottle < 0 && lVx < 1.0; 

            if (raceState > 0) {
                p.gear = 0; ins.handbrake = true; p.rpm += ((1000 + Math.max(0, mThrottle) * 7000) - p.rpm) * 5 * dt;
            } else {
                if (preset.ev) {
                    p.gear = lVx >= -0.5 ? 'D' : 'R'; p.rpm += (p.speedKmh * 80 - p.rpm) * 12 * dt;
                    if (mThrottle > 0 || isRev) dForce = (aPower * 735.5 * 0.85 * (isRev ? 0.45 : 1.0) / Math.max(Math.abs(lVx), 5.0)) * mThrottle;
                } else {
                    if (p.speedKmh < 1.0 && mThrottle <= 0) p.gear = 1; else if (p.gear === 0 && raceState === 0) { p.gear = 1; p.clutchDump = p.rpm / 7500; }
                    let wheelSpeedRpm = (p.speedKmh / 3.6) / wheelRadius * 9.55; let targetRpm = 1000 + wheelSpeedRpm * gearRatios[p.gear] * finalDrive;
                    if (targetRpm > 7500 && p.gear < 5) p.gear++; else if (targetRpm < 3500 && p.gear > 1 && p.speedKmh > 10) p.gear--;
                    p.rpm += (targetRpm - p.rpm) * 10 * dt;
                    if ((mThrottle > 0 || isRev) && p.gear > 0) {
                        let torque = aPower * 2.0 * Math.max(0.1, 1.0 - Math.pow((p.rpm - 5500)/4500, 2));
                        dForce = (torque * gearRatios[p.gear] * finalDrive / wheelRadius) * mThrottle;
                        if (p.clutchDump > 0) { dForce *= (1.0 + p.clutchDump * 3.5); p.clutchDump -= dt * 2.5; } if (p.clutchDump < 0) p.clutchDump = 0;
                    }
                }
            }

            const maxGrip = (aMass * 9.81 / 2) * surfaceMu; const maxLat = maxGrip * 1.40; 
            let fLongF = preset.drivetrain === 'FWD' ? dForce : (preset.drivetrain === 'AWD' ? dForce*0.5 : 0);
            let fLongR = preset.drivetrain === 'RWD' ? dForce : (preset.drivetrain === 'AWD' ? dForce*0.5 : 0);

            let bDistR = bForce * 0.35; if (ins.handbrake) { bDistR += aMass * 20.0; p.appliesBrake = true; }
            fLongF -= Math.sign(lVx) * (bForce * 0.65); fLongR -= Math.sign(lVx) * bDistR;
            fLongF = Math.max(-maxGrip, Math.min(maxGrip, fLongF)); fLongR = Math.max(-maxGrip, Math.min(maxGrip, fLongR));

            let gripF = maxLat * Math.sqrt(Math.max(0.01, 1.0 - Math.pow(Math.abs(fLongF) / maxGrip, 2) * 0.65));
            let gripR = ins.handbrake ? maxLat * 0.02 : maxLat * Math.sqrt(Math.max(0.01, 1.0 - Math.pow(Math.abs(fLongR) / maxGrip, 2) * 0.85));

            let a = preset.l / 24.0; let b = preset.l / 24.0; let Iz = aMass * (Math.pow(preset.w/12.0, 2) + Math.pow(preset.l/12.0, 2)) / 12.0;
            let slipAngle = p.speedKmh > 10.0 ? Math.atan2(lVy, Math.abs(lVx)) : 0; let maxRadian = (preset.turn * 10 * serverSettings.steering) * (Math.PI / 180); 
            let delta = Math.max(-maxRadian, Math.min(maxRadian, (p.steer - slipAngle*0.45*serverSettings.caster) * maxRadian));

            let vYf = lVy + p.yawRate * a; let vSlipF = vYf * Math.cos(delta) - lVx * Math.sin(delta); let vYr = lVy - p.yawRate * b; let vSlipR = vYr;
            let MeffF = 1.0 / (1.0/aMass + (a*a)/Iz); let MeffR = 1.0 / (1.0/aMass + (b*b)/Iz);
            let Jf = Math.max(-(gripF * dt), Math.min(gripF * dt, -vSlipF * MeffF)); let Jr = Math.max(-(gripR * dt), Math.min(gripR * dt, -vSlipR * MeffR));

            let fLatF = Jf / dt; let fLatR = Jr / dt;
            let fX = fLongF * Math.cos(delta) + fLongR - fLatF * Math.sin(delta) - 0.45 * lVx * Math.abs(lVx) - rollingResistance * aMass * 9.81 * Math.sign(lVx) * 0.1;
            let fY = fLongF * Math.sin(delta) + fLatF * Math.cos(delta) + fLatR - 0.45 * lVy * Math.abs(lVy);
            let torque = (fLongF * Math.sin(delta) + fLatF * Math.cos(delta)) * a - fLatR * b - (1.5 + Math.abs(lVy)*0.3) * p.yawRate * Iz;

            lVx += (fX / aMass) * dt; lVy += (fY / aMass) * dt; p.yawRate += (torque / Iz) * dt;
            p.vx = lVx * Math.cos(p.angle) - lVy * Math.sin(p.angle); p.vy = lVx * Math.sin(p.angle) + lVy * Math.cos(p.angle); p.angle += p.yawRate * dt;
            p.prevX = p.x; p.prevY = p.y; p.x += p.vx * 12.0 * dt; p.y += p.vy * 12.0 * dt;

            p.frontSpinSeverity = Math.abs(-vSlipF * MeffF) > gripF * dt ? Math.min(1.0, (Math.abs(-vSlipF * MeffF)-gripF * dt)/(gripF * dt)) : 0;
            p.rearSpinSeverity = Math.abs(-vSlipR * MeffR) > gripR * dt ? Math.min(1.0, (Math.abs(-vSlipR * MeffR)-gripR * dt)/(gripR * dt)) : 0;
            if (Math.abs(fLongR)/maxGrip > 0.95) p.rearSpinSeverity = 1.0; if (Math.abs(fLongF)/maxGrip > 0.95) p.frontSpinSeverity = 1.0; 

            outState.players[pid] = { x: p.x, y: p.y, a: p.angle, s: p.steer, fS: p.frontSpinSeverity, rS: p.rearSpinSeverity, presetId: p.presetId, g: p.gear, rpm: p.rpm, v: p.speedKmh, f: p.fuel, b: p.appliesBrake, n: p.name, l: p.lap, bl: p.bestLap, fin: p.finished, cLT: p.currentLapTime };
        }

        for(let i=0; i<pkeys.length; i++) {
            for(let j=i+1; j<pkeys.length; j++) {
                let pA = players[pkeys[i]], pB = players[pkeys[j]]; if(!pA || !pB || isNaN(pA.x) || isNaN(pB.x)) continue;
                let dx = pB.x - pA.x, dy = pB.y - pA.y, dist = Math.hypot(dx, dy); let rA = (vehiclePresets[pA.presetId]||vehiclePresets['jaguar']).l/2, rB = (vehiclePresets[pB.presetId]||vehiclePresets['jaguar']).l/2;
                if(dist < rA + rB && dist > 0) {
                    let nx = dx/dist, ny = dy/dist; let velN = (pB.vx - pA.vx)*nx + (pB.vy - pA.vy)*ny; if(velN > 0) continue; 
                    let mA = (vehiclePresets[pA.presetId]||vehiclePresets['jaguar']).mass * serverSettings.mass, mB = (vehiclePresets[pB.presetId]||vehiclePresets['jaguar']).mass * serverSettings.mass;
                    let jImp = -(1 + 0.5) * velN / (1/mA + 1/mB);
                    pA.vx -= (jImp * nx)/mA; pA.vy -= (jImp * ny)/mA; pB.vx += (jImp * nx)/mB; pB.vy += (jImp * ny)/mB;
                    let corr = Math.max(0, (rA+rB - dist) - 1.0) / (1/mA + 1/mB) * 0.8; pA.x -= (nx*corr)/mA; pA.y -= (ny*corr)/mA; pB.x += (nx*corr)/mB; pB.y += (ny*corr)/mB;
                }
            }
        }
        Object.values(connections).forEach(c => c.send(outState));
    } else {
        for (let pid in players) {
            let p = players[pid]; if(isNaN(p.x)||isNaN(p.targetX)) continue;
            p.x += (p.targetX - p.x) * 0.3; p.y += (p.targetY - p.y) * 0.3;
            let d = p.targetAngle - p.angle; while(d < -Math.PI) d+=Math.PI*2; while(d > Math.PI) d-=Math.PI*2; p.angle += d * 0.3;
        }
    }

    if(raceState !== lastLightState) {
        let lightUI = document.getElementById('f1-lights');
        if(raceState === -1 || (raceState === 0 && now - raceStartTime > 2000)) lightUI.style.display = 'none';
        else {
            lightUI.style.display = 'flex'; let lights = lightUI.getElementsByClassName('light');
            for(let i=0; i<5; i++) { lights[i].className = 'light'; if(raceState === 0) lights[i].classList.add('green'); else if(5 - raceState > i) lights[i].classList.add('red'); }
            if(raceState > 0) playBeep(440, 0.2); if(raceState === 0) playBeep(880, 0.8);
        }
        lastLightState = raceState;
    } else if (raceState === 0 && now - raceStartTime > 2000) { document.getElementById('f1-lights').style.display = 'none'; }

    if (players[myId]) {
        let me = players[myId];
        document.getElementById('hud-speed').innerText = Math.round(me.speedKmh || 0);
        document.getElementById('hud-gear').innerText = me.gear === -1 ? 'R' : (me.gear === 0 ? 'N' : me.gear);
        document.getElementById('hud-rpm').innerText = me.rpm < 10 ? 0 : Math.round(me.rpm || 0);
        document.getElementById('fuel-fill').style.width = ((me.fuel || 0) / (me.maxFuel || 100) * 100) + '%';
        document.getElementById('fuel-fill').style.background = me.fuel < me.maxFuel*0.2 ? '#e74c3c' : '#f1c40f';
        document.getElementById('hud-lap').innerText = `${Math.min(me.lap + 1, totalLaps)}/${totalLaps}`;
        document.getElementById('hud-time').innerText = me.finished ? formatTime(me.bestLap) : (raceState === 0 ? formatTime(me.currentLapTime) : "0.00");
        
        if (audioReady) {
            engineOsc.frequency.value = Math.max(0, 40 + (me.rpm / 22)); engineGain.gain.value = me.rpm < 100 ? 0 : 0.08 + (Math.abs(localInputs.throttle) * 0.2);
            let sq = Math.max(me.frontSpinSeverity, me.rearSpinSeverity); if(sq > 0.1 && me.speedKmh>5) { squealGain.gain.value = sq * 0.15; squealOsc.frequency.value = 800 + Math.random()*200; } else squealGain.gain.value = 0;
        }
    }

    let lbArr = Object.values(players).map(p => ({ n: p.name, b: p.bestLap, l: p.lap, fin: p.finished })).sort((a,b) => {
        if(a.fin && !b.fin) return -1; if(!a.fin && b.fin) return 1; if(a.l !== b.l) return b.l - a.l; return a.b - b.b;
    });
    let lbHTML = ""; for(let i=0; i<Math.min(5, lbArr.length); i++) lbHTML += `<li><span>${i+1}. ${lbArr[i].n}</span><span style="color:${lbArr[i].fin?'#2ecc71':'#f1c40f'};">${lbArr[i].fin?'Ferdig':formatTime(lbArr[i].b)}</span></li>`;
    document.getElementById('lb-list').innerHTML = lbHTML;

    ctx.setTransform(1,0,0,1,0,0); ctx.fillStyle = '#2d4c1e'; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.save(); 
    if(players[myId] && !isNaN(players[myId].x)) ctx.translate(canvas.width/2 - players[myId].x, canvas.height/2 - players[myId].y); else ctx.translate(canvas.width/2 - activeTrack.startX, canvas.height/2 - activeTrack.startY);

    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.lineWidth = 250; ctx.strokeStyle = '#1a2e12'; ctx.stroke(activeTrack.path); ctx.lineWidth = 240; ctx.strokeStyle = '#c2b280'; ctx.stroke(activeTrack.path);
    ctx.lineWidth = 190; ctx.strokeStyle = '#fff'; ctx.stroke(activeTrack.path); ctx.strokeStyle = '#e74c3c'; ctx.setLineDash([30,30]); ctx.stroke(activeTrack.path); ctx.setLineDash([]);
    ctx.lineWidth = 160; ctx.strokeStyle = '#2c2c2c'; ctx.stroke(activeTrack.path);
    
    ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; ctx.strokeStyle = '#3498db'; ctx.lineWidth = 4; ctx.setLineDash([10,10]);
    let pb = activeTrack.pit; ctx.fillRect(pb.x1, pb.y1, pb.x2-pb.x1, pb.y2-pb.y1); ctx.strokeRect(pb.x1, pb.y1, pb.x2-pb.x1, pb.y2-pb.y1); ctx.setLineDash([]);
    ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('PIT', pb.x1 + 20, pb.y1 + 30);

    ctx.save(); ctx.translate(activeTrack.startX, activeTrack.startY); ctx.rotate(activeTrack.startAngle);
    let cbW = 10; ctx.fillStyle = '#fff';
    for(let r=-8; r<8; r++) { for(let c=0; c<4; c++) { if((r+c)%2===0) ctx.fillRect(-c*cbW, r*cbW, cbW, cbW); } }
    
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
    for(let i=0; i<8; i++) {
        let row = Math.floor(i / 2); let col = i % 2 === 0 ? 1 : -1; let spacing = 120, lateral = 40; let gx = -(row * spacing + 60); let gy = (col * lateral);
        ctx.beginPath(); ctx.moveTo(gx + 20, gy - 12); ctx.lineTo(gx - 20, gy - 12); ctx.lineTo(gx - 20, gy + 12); ctx.lineTo(gx + 20, gy + 12); ctx.stroke();
    }
    ctx.restore();

    for (let obj of envObjects) {
        ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(obj.angle);
        if (obj.type === 'house') { ctx.fillStyle = obj.color; ctx.fillRect(-obj.size/2, -obj.size/2.5, obj.size, obj.size*0.8); ctx.fillStyle = '#111'; ctx.fillRect(-obj.size/4, -obj.size/2.5, obj.size/2, obj.size*0.8); } 
        else { ctx.fillStyle = obj.color; ctx.beginPath(); ctx.arc(0, 0, obj.size, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#1e8449'; ctx.beginPath(); ctx.arc(0, 0, obj.size*0.6, 0, Math.PI*2); ctx.fill(); }
        ctx.restore();
    }

    for (let pid in players) {
        let p = players[pid], pre = vehiclePresets[p.presetId]||vehiclePresets['jaguar']; let hw = pre.w / 2; let hl = pre.l / 2;
        const fwX = Math.cos(p.angle); const fwY = Math.sin(p.angle); const rX = -Math.sin(p.angle); const rY = Math.cos(p.angle);
        if (p.rearSpinSeverity > 0.1 || p.inputs?.handbrake) skidmarks.push({ x1: p.x + fwX * (-hl + 6) + rX * (-hw + 2), y1: p.y + fwY * (-hl + 6) + rY * (-hw + 2), x2: p.x + fwX * (-hl + 6) + rX * (hw - 2), y2: p.y + fwY * (-hl + 6) + rY * (hw - 2) });
        if (p.frontSpinSeverity > 0.1) skidmarks.push({ x1: p.x + fwX * (hl - 8) + rX * (-hw + 2), y1: p.y + fwY * (hl - 8) + rY * (-hw + 2), x2: p.x + fwX * (hl - 8) + rX * (hw - 2), y2: p.y + fwY * (hl - 8) + rY * (hw - 2) });
    }
    if (skidmarks.length > 5000) skidmarks.splice(0, skidmarks.length - 5000); ctx.fillStyle = 'rgba(15, 15, 15, 0.4)'; ctx.beginPath();
    for (let i = 0; i < skidmarks.length; i++) { let m = skidmarks[i]; ctx.rect(m.x1 - 2, m.y1 - 2, 4, 4); ctx.rect(m.x2 - 2, m.y2 - 2, 4, 4); } ctx.fill();

    for (let pid in players) {
        let p = players[pid], pre = vehiclePresets[p.presetId]||vehiclePresets['jaguar']; ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.angle);
        let hl = pre.l/2, hw = pre.w/2; const wheelW = 14, wheelThick = 6, wheelOffset = hw - 1; let maxRadian = (pre.turn * 10 * serverSettings.steering) * (Math.PI / 180); let delta = Math.max(-maxRadian, Math.min(maxRadian, p.steer * maxRadian));

        if (pre.type !== 'f1' && pre.type !== 'gokart') {
            ctx.fillStyle = '#111'; ctx.fillRect(-hl + 6 - wheelW/2, -wheelOffset - wheelThick/2, wheelW, wheelThick); ctx.fillRect(-hl + 6 - wheelW/2, wheelOffset - wheelThick/2, wheelW, wheelThick);
            ctx.save(); ctx.translate(hl - 8, -wheelOffset); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick/2, wheelW, wheelThick); ctx.restore();
            ctx.save(); ctx.translate(hl - 8, wheelOffset); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick/2, wheelW, wheelThick); ctx.restore();
        }

        if (pre.type === 'f1') { 
            ctx.fillStyle = '#111'; ctx.fillRect(-hl + 8 - wheelW/2, -hw, wheelW, wheelThick*1.5); ctx.fillRect(-hl + 8 - wheelW/2, hw - wheelThick*1.5, wheelW, wheelThick*1.5);
            ctx.save(); ctx.translate(hl - 6, -hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, 0, wheelW, wheelThick*1.5); ctx.restore();
            ctx.save(); ctx.translate(hl - 6, hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick*1.5, wheelW, wheelThick*1.5); ctx.restore();
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.roundRect(-hl + 6, -hw*0.35, pre.l - 12, pre.w*0.7, 4); ctx.fill(); 
            ctx.fillStyle = '#111'; ctx.fillRect(2, -hw*0.25, 10, pre.w*0.5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, 0, 4, 0, Math.PI*2); ctx.fill(); 
            ctx.fillStyle = '#111'; ctx.fillRect(hl - 4, -hw*0.9, 3, pre.w*1.8); ctx.fillRect(-hl, -hw*0.7, 4, pre.w*1.4); 
        } 
        else if (pre.type === 'gokart') { 
            ctx.fillStyle = '#111'; ctx.fillRect(-hl + 4 - wheelW/2, -hw, wheelW, wheelThick); ctx.fillRect(-hl + 4 - wheelW/2, hw - wheelThick, wheelW, wheelThick);
            ctx.save(); ctx.translate(hl - 4, -hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, 0, wheelW, wheelThick); ctx.restore();
            ctx.save(); ctx.translate(hl - 4, hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick, wheelW, wheelThick); ctx.restore();
            ctx.fillStyle = '#7f8c8d'; ctx.beginPath(); ctx.roundRect(-hl+2, -hw*0.5, pre.l-4, pre.w, 2); ctx.fill(); 
            ctx.fillStyle = '#e67e22'; ctx.fillRect(hl - 3, -hw*0.7, 2, pre.w*1.4); 
            ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl + 6, -hw*0.4, 8, pre.w*0.8, 2); ctx.fill(); 
            ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(-hl + 10, 0, 5, 0, Math.PI*2); ctx.fill(); 
        } 
        else if (pre.type === 'mx5') { ctx.fillStyle = '#c0392b'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(-hl*0.1, -hw + 3, pre.l*0.35, pre.w - 6, 4); ctx.fill(); } 
        else if (pre.type === 'r34') { ctx.fillStyle = '#2980b9'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 5); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.05, -hw + 2, pre.l*0.4, pre.w - 4, 3); ctx.fill(); ctx.fillStyle = '#2980b9'; ctx.fillRect(-hl - 3, -hw, 4, pre.w); } 
        else if (pre.type === 's15') { ctx.fillStyle = '#8e44ad'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 6); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.1, -hw + 2, pre.l*0.45, pre.w - 4, 4); ctx.fill(); ctx.fillStyle = '#f39c12'; ctx.fillRect(-hl - 4, -hw - 2, 5, pre.w + 4); } 
        else if (pre.type === 'jaguar') { ctx.fillStyle = '#1abc9c'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.15, -hw + 3, pre.l*0.5, pre.w - 6, 6); ctx.fill(); }

        ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.roundRect(hl - 3, -hw + 3, 4, 5, 2); ctx.roundRect(hl - 3, hw - 8, 4, 5, 2); ctx.fill();
        ctx.fillStyle = p.appliesBrake ? '#ff3333' : '#8b0000'; ctx.shadowColor = p.appliesBrake ? '#ff0000' : 'transparent'; ctx.shadowBlur = p.appliesBrake ? 10 : 0;
        ctx.beginPath(); ctx.roundRect(-hl - 1, -hw + 3, 3, 5, 1); ctx.roundRect(-hl - 1, hw - 8, 3, 5, 1); ctx.fill(); ctx.shadowBlur = 0;

        ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(p.name, 0, -hw-12);
        ctx.restore();
    }
    ctx.restore(); requestAnimationFrame(update);
}

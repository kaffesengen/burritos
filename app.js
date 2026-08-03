const vehiclePresets = {
    ai_standard: { power: 350, mass: 1400, drivetrain: 'AWD', grip: 2.10, turn: 4.8, roll: 0.04, w: 20, l: 45, ev: false, type: 'r34', fuelCap: 100, audio: 'turbo', maxRPM: 7000, gears: [0, 3.5, 2.2, 1.6, 1.2, 0.9], finalDrive: 3.8 },
    jaguar: { power: 400, mass: 2200, drivetrain: 'AWD', grip: 1.85, turn: 4.0, roll: 0.05, w: 24, l: 52, ev: true, type: 'jaguar', fuelCap: 100, audio: 'ev', maxRPM: 13000, gears: [0, 9.06], finalDrive: 1.0 },
    gokart: { power: 22.5, mass: 180, drivetrain: 'RWD', grip: 5.04, turn: 0.55, roll: 0.02, w: 14, l: 24, ev: false, type: 'gokart', fuelCap: 10, audio: 'gokart', maxRPM: 13500, gears: [0, 2.14, 1.71, 1.44, 1.24, 1.09, 0.96], finalDrive: 4.95 },
    mx5: { power: 184, mass: 1050, drivetrain: 'RWD', grip: 1.60, turn: 4.5, roll: 0.04, w: 20, l: 42, ev: false, type: 'mx5', fuelCap: 50, audio: 'i4', maxRPM: 7500, gears: [0, 5.08, 2.99, 2.03, 1.59, 1.29, 1.00], finalDrive: 2.86 },
    r34: { power: 330, mass: 1560, drivetrain: 'AWD', grip: 1.85, turn: 3.8, roll: 0.04, w: 22, l: 48, ev: false, type: 'r34', fuelCap: 70, audio: 'turbo', maxRPM: 8000, gears: [0, 3.82, 2.36, 1.68, 1.31, 1.00, 0.79], finalDrive: 3.54 },
    s15: { power: 420, mass: 1240, drivetrain: 'RWD', grip: 1.70, turn: 5.5, roll: 0.04, w: 21, l: 45, ev: false, type: 's15', fuelCap: 65, audio: 'turbo', maxRPM: 7500, gears: [0, 3.62, 2.20, 1.54, 1.21, 1.00, 0.76], finalDrive: 3.69 },
    f1: { power: 1050, mass: 798, drivetrain: 'RWD', grip: 3.60, turn: 6.0, roll: 0.09, w: 26, l: 64, ev: false, type: 'f1', fuelCap: 110, audio: 'v10', maxRPM: 15000, gears: [0, 4.14, 3.10, 2.45, 1.95, 1.60, 1.35, 1.15, 0.95], finalDrive: 3.0 },
    gt3rs: { power: 525, mass: 1450, drivetrain: 'RWD', grip: 2.20, turn: 5.0, roll: 0.03, w: 20, l: 46, ev: false, type: 'r34', fuelCap: 64, audio: 'v6', maxRPM: 9000, gears: [0, 3.18, 2.25, 1.63, 1.29, 1.06, 0.88, 0.71], finalDrive: 4.18 },
    f40: { power: 478, mass: 1369, drivetrain: 'RWD', grip: 1.70, turn: 4.8, roll: 0.04, w: 20, l: 44, ev: false, type: 'r34', fuelCap: 120, audio: 'v8', maxRPM: 7750, gears: [0, 2.76, 1.88, 1.41, 1.09, 0.88], finalDrive: 3.36 },
    mclarenf1: { power: 627, mass: 1138, drivetrain: 'RWD', grip: 1.80, turn: 5.2, roll: 0.03, w: 19, l: 43, ev: false, type: 'r34', fuelCap: 90, audio: 'v10', maxRPM: 7500, gears: [0, 3.23, 2.19, 1.71, 1.39, 1.16, 0.93], finalDrive: 2.37 },
    mazda787b: { power: 700, mass: 830, drivetrain: 'RWD', grip: 2.80, turn: 5.8, roll: 0.02, w: 20, l: 47, ev: false, type: 'r34', fuelCap: 100, audio: 'rotary', maxRPM: 9000, gears: [0, 2.68, 1.73, 1.30, 1.04, 0.84], finalDrive: 4.30 },
    m3e30: { power: 238, mass: 1200, drivetrain: 'RWD', grip: 1.65, turn: 4.6, roll: 0.04, w: 18, l: 43, ev: false, type: 'r34', fuelCap: 62, audio: 'i4', maxRPM: 7250, gears: [0, 3.71, 2.40, 1.58, 1.19, 1.00], finalDrive: 3.25 },
    elise: { power: 118, mass: 725, drivetrain: 'RWD', grip: 1.90, turn: 5.5, roll: 0.03, w: 17, l: 37, ev: false, type: 'mx5', fuelCap: 40, audio: 'i4', maxRPM: 8000, gears: [0, 3.11, 2.05, 1.48, 1.16, 0.91, 0.81], finalDrive: 4.25 },
    gt40: { power: 485, mass: 1210, drivetrain: 'RWD', grip: 1.60, turn: 4.2, roll: 0.04, w: 19, l: 41, ev: false, type: 'r34', fuelCap: 140, audio: 'v8', maxRPM: 7000, gears: [0, 2.41, 1.48, 1.04, 0.81], finalDrive: 4.22 },
    c8z06: { power: 670, mass: 1560, drivetrain: 'RWD', grip: 2.10, turn: 4.8, roll: 0.03, w: 21, l: 46, ev: false, type: 'r34', fuelCap: 70, audio: 'v8', maxRPM: 8600, gears: [0, 2.90, 1.86, 1.28, 0.93, 0.71, 0.53, 0.40, 0.33], finalDrive: 5.56 },
    quattro: { power: 500, mass: 1090, drivetrain: 'AWD', grip: 2.00, turn: 5.3, roll: 0.03, w: 19, l: 42, ev: false, type: 'r34', fuelCap: 90, audio: 'turbo', maxRPM: 7200, gears: [0, 3.50, 2.13, 1.44, 1.08, 0.88], finalDrive: 3.89 },
    r32: { power: 280, mass: 1430, drivetrain: 'AWD', grip: 1.80, turn: 4.4, roll: 0.04, w: 19, l: 45, ev: false, type: 'r34', fuelCap: 72, audio: 'turbo', maxRPM: 8000, gears: [0, 3.21, 1.92, 1.30, 1.00, 0.75], finalDrive: 4.11 },
    alfa33: { power: 230, mass: 700, drivetrain: 'RWD', grip: 1.60, turn: 5.0, roll: 0.03, w: 17, l: 40, ev: false, type: 'r34', fuelCap: 50, audio: 'v8', maxRPM: 10000, gears: [0, 2.50, 1.70, 1.30, 1.05, 0.85, 0.75], finalDrive: 4.0 },
    amggt: { power: 730, mass: 1615, drivetrain: 'RWD', grip: 2.20, turn: 4.7, roll: 0.03, w: 21, l: 46, ev: false, type: 'r34', fuelCap: 75, audio: 'v8', maxRPM: 7000, gears: [0, 3.08, 2.18, 1.58, 1.19, 0.94, 0.75, 0.60], finalDrive: 3.67 },
    nsxr: { power: 290, mass: 1230, drivetrain: 'RWD', grip: 1.80, turn: 5.1, roll: 0.03, w: 19, l: 44, ev: false, type: 'r34', fuelCap: 70, audio: 'v6', maxRPM: 8300, gears: [0, 3.06, 1.95, 1.42, 1.09, 0.86, 0.68], finalDrive: 4.23 },
    type49: { power: 400, mass: 500, drivetrain: 'RWD', grip: 1.50, turn: 5.6, roll: 0.02, w: 18, l: 40, ev: false, type: 'f1', fuelCap: 60, audio: 'v8', maxRPM: 9000, gears: [0, 2.70, 1.90, 1.45, 1.20, 1.00], finalDrive: 3.50 },
    jesko: { power: 1600, mass: 1420, drivetrain: 'RWD', grip: 2.50, turn: 4.5, roll: 0.03, w: 21, l: 46, ev: false, type: 'r34', fuelCap: 72, audio: 'v8', maxRPM: 8500, gears: [0, 3.17, 2.25, 1.70, 1.35, 1.11, 0.94, 0.81, 0.71, 0.64], finalDrive: 2.80 },
    delta: { power: 210, mass: 1300, drivetrain: 'AWD', grip: 1.80, turn: 4.9, roll: 0.04, w: 18, l: 40, ev: false, type: 'r34', fuelCap: 57, audio: 'turbo', maxRPM: 6500, gears: [0, 3.50, 2.18, 1.52, 1.15, 0.91], finalDrive: 3.11 },
    valkyrie: { power: 1160, mass: 1030, drivetrain: 'RWD', grip: 3.20, turn: 5.8, roll: 0.02, w: 21, l: 45, ev: false, type: 'r34', fuelCap: 65, audio: 'v10', maxRPM: 11100, gears: [0, 3.0, 2.15, 1.65, 1.30, 1.05, 0.88, 0.75], finalDrive: 3.20 },
    yaris: { power: 261, mass: 1280, drivetrain: 'AWD', grip: 1.90, turn: 5.0, roll: 0.04, w: 18, l: 40, ev: false, type: 'r34', fuelCap: 50, audio: 'turbo', maxRPM: 7200, gears: [0, 3.53, 2.23, 1.53, 1.16, 0.97, 0.79], finalDrive: 3.94 },
    porsche917: { power: 630, mass: 800, drivetrain: 'RWD', grip: 2.00, turn: 4.8, roll: 0.02, w: 20, l: 41, ev: false, type: 'r34', fuelCap: 120, audio: 'v10', maxRPM: 8200, gears: [0, 2.45, 1.75, 1.35, 1.10, 0.90], finalDrive: 4.10 },
    caterham: { power: 310, mass: 545, drivetrain: 'RWD', grip: 2.10, turn: 6.0, roll: 0.03, w: 16, l: 32, ev: false, type: 'f1', fuelCap: 36, audio: 'i4', maxRPM: 8500, gears: [0, 3.11, 2.08, 1.53, 1.21, 1.00, 0.87], finalDrive: 3.92 }
};

const gearRatios = [0, 3.5, 2.2, 1.6, 1.2, 0.9];
const finalDrive = 3.8;
const wheelRadius = 0.32;

const tracks = {
    standard: {
        path: (() => { let p = new Path2D(); p.moveTo(4400, 3200); p.lineTo(800, 3200); p.bezierCurveTo(200, 3200, 200, 2600, 600, 2200); p.lineTo(1400, 1400); p.bezierCurveTo(1600, 1200, 2000, 1400, 1800, 1800); p.lineTo(1200, 2400); p.bezierCurveTo(1000, 2600, 1400, 2800, 1800, 2600); p.lineTo(3200, 1600); p.bezierCurveTo(3600, 1400, 3800, 800, 4200, 800); p.bezierCurveTo(4800, 800, 4800, 1600, 4400, 1800); p.lineTo(4600, 2400); p.bezierCurveTo(4800, 2800, 4800, 3200, 4400, 3200); p.closePath(); return p; })(),
        startX: 2100, startY: 3200, startAngle: Math.PI, finish: { x: 2100, y: 3200, radius: 250 }, checkpoint: { x: 4400, y: 1800, radius: 250 }
    },
    drift: {
        path: (() => { let p = new Path2D(); p.moveTo(2500, 2000); p.bezierCurveTo(1500, 3500, 500, 3000, 500, 2000); p.bezierCurveTo(500, 1000, 1500, 500, 2500, 2000); p.bezierCurveTo(3500, 3500, 4500, 3000, 4500, 2000); p.bezierCurveTo(4500, 1000, 3500, 500, 2500, 2000); p.closePath(); return p; })(),
        startX: 2500, startY: 2000, startAngle: Math.PI/4, finish: { x: 2500, y: 2000, radius: 250 }, checkpoint: { x: 500, y: 2000, radius: 250 }
    },
    gokart: {
        path: (() => { let p = new Path2D(); p.moveTo(1000, 3000); p.bezierCurveTo(500, 3000, 500, 2000, 1000, 2000); p.lineTo(3000, 2000); p.bezierCurveTo(3500, 2000, 3500, 1000, 3000, 1000); p.lineTo(1000, 1000); p.bezierCurveTo(500, 1000, 500, 500, 1000, 500); p.lineTo(4000, 500); p.bezierCurveTo(4500, 500, 4500, 3000, 4000, 3000); p.closePath(); return p; })(),
        startX: 2000, startY: 3000, startAngle: Math.PI, finish: { x: 2000, y: 3000, radius: 200 }, checkpoint: { x: 3000, y: 1000, radius: 200 }
    },
    nordschleife: { path: (() => { let p=new Path2D(); p.moveTo(5000,8000); p.lineTo(2000,8000); p.bezierCurveTo(1000,7000,1000,5000,2000,4000); p.lineTo(3000,3000); p.bezierCurveTo(4000,2000,5000,1000,6000,2000); p.lineTo(8000,3000); p.bezierCurveTo(9000,4000,9000,6000,8000,7000); p.closePath(); return p; })(), startX: 4000, startY: 8000, startAngle: Math.PI, finish: {x:4000, y:8000, radius:250}, checkpoint: {x:5500, y:2000, radius:250} },
    spa: { path: (() => { let p=new Path2D(); p.moveTo(3000,7000); p.lineTo(3500,4000); p.bezierCurveTo(3700,2000,5000,1000,6000,1500); p.lineTo(6500,3000); p.bezierCurveTo(7000,4000,6500,6000,5500,7500); p.closePath(); return p; })(), startX: 3250, startY: 5500, startAngle: -1.405, finish: {x:3250, y:5500, radius:250}, checkpoint: {x:6000, y:1500, radius:250} },
    lemans: { path: (() => { let p=new Path2D(); p.moveTo(2000,8000); p.lineTo(1000,5000); p.bezierCurveTo(500,3000,1500,1000,3000,1000); p.lineTo(8000,1000); p.bezierCurveTo(9000,1000,9500,2000,9000,4000); p.lineTo(5000,8000); p.closePath(); return p; })(), startX: 1500, startY: 6500, startAngle: -1.892, finish: {x:1500, y:6500, radius:250}, checkpoint: {x:9000, y:4000, radius:250} },
    suzuka: { path: (() => { let p=new Path2D(); p.moveTo(3000,6000); p.bezierCurveTo(1000,4000,3000,2000,5000,4000); p.lineTo(7000,6000); p.bezierCurveTo(9000,8000,7000,10000,5000,8000); p.closePath(); return p; })(), startX: 3000, startY: 6000, startAngle: -2.356, finish: {x:3000, y:6000, radius:250}, checkpoint: {x:7000, y:6000, radius:250} },
    monaco: { path: (() => { let p=new Path2D(); p.moveTo(4000,6000); p.lineTo(3000,6000); p.bezierCurveTo(2000,6000,2000,4000,3000,4000); p.lineTo(4000,4000); p.bezierCurveTo(5000,4000,6000,5000,5000,6000); p.closePath(); return p; })(), startX: 3500, startY: 6000, startAngle: Math.PI, finish: {x:3500, y:6000, radius:200}, checkpoint: {x:3500, y:4000, radius:200} },
    bathurst: { path: (() => { let p=new Path2D(); p.moveTo(3000,8000); p.lineTo(2000,4000); p.bezierCurveTo(1500,2000,3000,1000,4000,2000); p.bezierCurveTo(5000,3000,5500,2000,6000,4000); p.lineTo(5000,8000); p.closePath(); return p; })(), startX: 2500, startY: 6000, startAngle: -1.815, finish: {x:2500, y:6000, radius:250}, checkpoint: {x:4000, y:2000, radius:250} },
    lagunaseca: { path: (() => { let p=new Path2D(); p.moveTo(4000,7000); p.lineTo(2000,5000); p.bezierCurveTo(1000,3000,3000,1000,5000,2000); p.lineTo(7000,2000); p.bezierCurveTo(7500,3000,6500,4000,7000,5000); p.bezierCurveTo(8000,7000,6000,8000,4000,7000); p.closePath(); return p; })(), startX: 3000, startY: 6000, startAngle: -2.356, finish: {x:3000, y:6000, radius:250}, checkpoint: {x:6000, y:2000, radius:250} },
    silverstone: { path: (() => { let p=new Path2D(); p.moveTo(4000,8000); p.lineTo(2000,6000); p.bezierCurveTo(1000,4000,3000,2000,5000,2000); p.lineTo(8000,4000); p.bezierCurveTo(9000,6000,7000,9000,4000,8000); p.closePath(); return p; })(), startX: 3000, startY: 7000, startAngle: -2.356, finish: {x:3000, y:7000, radius:250}, checkpoint: {x:6500, y:3000, radius:250} },
    monza: { path: (() => { let p=new Path2D(); p.moveTo(3000,7000); p.lineTo(7000,7000); p.bezierCurveTo(9000,7000,9000,4000,7000,3000); p.lineTo(3000,1000); p.bezierCurveTo(1000,0,1000,3000,3000,4000); p.bezierCurveTo(4000,4500,2000,5500,3000,7000); p.closePath(); return p; })(), startX: 5000, startY: 7000, startAngle: 0, finish: {x:5000, y:7000, radius:250}, checkpoint: {x:5000, y:2000, radius:250} },
    targaflorio: { path: (() => { let p=new Path2D(); p.moveTo(5000,9000); p.bezierCurveTo(1000,9000,1000,6000,3000,5000); p.bezierCurveTo(5000,4000,2000,2000,5000,1000); p.bezierCurveTo(8000,0,9000,4000,7000,5000); p.bezierCurveTo(5000,6000,9000,9000,5000,9000); p.closePath(); return p; })(), startX: 5000, startY: 9000, startAngle: Math.PI, finish: {x:5000, y:9000, radius:250}, checkpoint: {x:5000, y:1000, radius:250} },
    mini1: { path: (() => { let p=new Path2D(); p.moveTo(1000,2000); p.lineTo(2000,2000); p.bezierCurveTo(2500,2000,2500,1000,2000,1000); p.lineTo(1000,1000); p.bezierCurveTo(500,1000,500,2000,1000,2000); p.closePath(); return p; })(), startX: 1500, startY: 2000, startAngle: 0, finish: {x:1500, y:2000, radius:200}, checkpoint: {x:1500, y:1000, radius:200} },
    mini2: { path: (() => { let p=new Path2D(); p.moveTo(1000,2000); p.lineTo(2000,2000); p.bezierCurveTo(2500,2000,2500,1500,2000,1500); p.lineTo(1500,1500); p.bezierCurveTo(1000,1500,1000,1000,1500,1000); p.lineTo(2500,1000); p.bezierCurveTo(3000,1000,3000,500,2500,500); p.lineTo(1000,500); p.bezierCurveTo(0,500,0,2000,1000,2000); p.closePath(); return p; })(), startX: 1500, startY: 2000, startAngle: 0, finish: {x:1500, y:2000, radius:200}, checkpoint: {x:2000, y:1000, radius:200} },
    mini3: { path: (() => { let p=new Path2D(); p.moveTo(1000,1000); p.lineTo(2000,1000); p.lineTo(2500,2000); p.lineTo(1500,2500); p.lineTo(500,2000); p.closePath(); return p; })(), startX: 1500, startY: 1000, startAngle: 0, finish: {x:1500, y:1000, radius:200}, checkpoint: {x:1500, y:2500, radius:200} },
    mini4: { path: (() => { let p=new Path2D(); p.moveTo(1500,1500); p.bezierCurveTo(2500,500,3500,1500,2500,2500); p.lineTo(1500,1500); p.bezierCurveTo(500,500,-500,1500,500,2500); p.closePath(); return p; })(), startX: 1500, startY: 1500, startAngle: Math.PI/4, finish: {x:1500, y:1500, radius:200}, checkpoint: {x:2500, y:2500, radius:200} },
    mini5: { path: (() => { let p=new Path2D(); p.moveTo(1500,2000); p.bezierCurveTo(2000,2000,2000,1000,1500,1000); p.bezierCurveTo(1000,1000,1000,2000,1500,2000); p.closePath(); return p; })(), startX: 1500, startY: 2000, startAngle: 0, finish: {x:1500, y:2000, radius:200}, checkpoint: {x:1500, y:1000, radius:200} },
    mini6: { path: (() => { let p=new Path2D(); p.moveTo(1000,2000); p.lineTo(3000,2000); p.bezierCurveTo(3500,2000,3500,1500,3000,1500); p.lineTo(1500,1500); p.bezierCurveTo(1200,1500,1200,1000,1500,1000); p.lineTo(3000,1000); p.bezierCurveTo(3500,1000,3500,500,3000,500); p.lineTo(1000,500); p.bezierCurveTo(500,500,500,2000,1000,2000); p.closePath(); return p; })(), startX: 2000, startY: 2000, startAngle: 0, finish: {x:2000, y:2000, radius:200}, checkpoint: {x:2000, y:1000, radius:200} },
    mini7: { path: (() => { let p=new Path2D(); p.moveTo(1500,500); p.lineTo(2000,1500); p.lineTo(3000,1500); p.lineTo(2200,2200); p.lineTo(2500,3200); p.lineTo(1500,2600); p.lineTo(500,3200); p.lineTo(800,2200); p.lineTo(0,1500); p.lineTo(1000,1500); p.closePath(); return p; })(), startX: 1000, startY: 1500, startAngle: -Math.PI/2, finish: {x:1000, y:1500, radius:200}, checkpoint: {x:2500, y:3200, radius:200} },
    mini8: { path: (() => { let p=new Path2D(); p.moveTo(1000,1000); p.lineTo(1500,2000); p.lineTo(2000,1000); p.lineTo(2500,2000); p.lineTo(3000,1000); p.lineTo(3000,2500); p.lineTo(1000,2500); p.closePath(); return p; })(), startX: 1500, startY: 1000, startAngle: 0, finish: {x:1500, y:1000, radius:200}, checkpoint: {x:2000, y:2500, radius:200} },
    mini9: { path: (() => { let p=new Path2D(); p.moveTo(2000,2000); p.bezierCurveTo(2000,3000,1000,3000,1000,2000); p.bezierCurveTo(1000,1000,3000,1000,3000,2000); p.bezierCurveTo(3000,4000,0,4000,0,2000); p.bezierCurveTo(0,0,4000,0,4000,2000); p.lineTo(2000,2000); p.closePath(); return p; })(), startX: 2000, startY: 2000, startAngle: 0, finish: {x:2000, y:2000, radius:200}, checkpoint: {x:0, y:2000, radius:200} },
    mini10: { path: (() => { let p=new Path2D(); p.moveTo(1000,2000); p.bezierCurveTo(1500,2500,2000,1500,2500,2000); p.lineTo(2500,1000); p.bezierCurveTo(2000,500,1500,1500,1000,1000); p.closePath(); return p; })(), startX: 1000, startY: 2000, startAngle: 0, finish: {x:1000, y:2000, radius:200}, checkpoint: {x:2500, y:1000, radius:200} }
};

for (let tId in tracks) {
    let t = tracks[tId];
    if (!t.pit) {
        t.pit = {
            x: t.startX + Math.cos(t.startAngle - Math.PI/2) * 150,
            y: t.startY + Math.sin(t.startAngle - Math.PI/2) * 150,
            w: 120, l: 450, angle: t.startAngle
        };
    }
}

let activeTrackId = 'standard'; let envObjects = [];
let serverSettings = { grip: 1.0, power: 1.0, mass: 1.0, steering: 1.0, caster: 1.0 };

let deviceType = 'pc'; let cameraZoom = 1.0;
function detectDevice() {
    let w = window.innerWidth; let h = window.innerHeight; let minDim = Math.min(w, h); let maxDim = Math.max(w, h);
    if (minDim > 750) deviceType = 'pc';
    else if (minDim > 500 && maxDim < 1300) deviceType = 'tablet';
    else deviceType = 'phone';
    applyDeviceUIRules();
}

function applyDeviceUIRules() {
    let hamBtn = document.getElementById('btn-hamburger');
    if (deviceType === 'phone') {
        if(hamBtn) hamBtn.style.display = 'block';
    } else {
        if(hamBtn) hamBtn.style.display = 'none';
    }
}

function getTrack() { return tracks[activeTrackId] || tracks['standard']; }

function generateEnvironment() {
    envObjects.length = 0; const canvasCtx = document.createElement('canvas').getContext('2d'); canvasCtx.lineWidth = 350; 
    let t = getTrack();
    for(let i=0; i<150; i++) {
        let rx = Math.random() * 5000; let ry = Math.random() * 4000;
        if(!canvasCtx.isPointInStroke(t.path, rx, ry)) {
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

let isSplitScreen = false;
let localPlayers = []; 

let raceState = -1, totalLaps = 3, raceStartTime = 0;
let gameLoopId = null;
let isRecording = false; let recordedWaypoints = [];

let lastGamepadCount = 0;
function checkGamepadDefault() {
    let gps = navigator.getGamepads ? navigator.getGamepads() : [];
    let activeCount = Array.from(gps).filter(gp => gp && gp.connected).length;
    let inputSel = document.getElementById('input-selector');
    if (inputSel) {
        let parentDiv = inputSel.closest('.control');
        if (parentDiv) parentDiv.style.display = 'block';

        if (activeCount > lastGamepadCount) {
            inputSel.value = 'gamepad';
        }
        lastGamepadCount = activeCount;
    }
}
setInterval(checkGamepadDefault, 500);

const safeAudioResume = () => { 
    if(window.audioManager) {
        window.audioManager.resume(); 
    } 
};
window.addEventListener('click', safeAudioResume, { passive: true });
window.addEventListener('keydown', safeAudioResume, { passive: true });
window.addEventListener('touchstart', safeAudioResume, { passive: true });
window.addEventListener('gamepadconnected', () => { safeAudioResume(); checkGamepadDefault(); });

function createPlayerRecord(id, presetId, name, colorCode) {
    let safeName = "Gjest";
    if (typeof name === 'string' && name.trim().length > 0) safeName = name.trim().substring(0, 15);
    let cap = vehiclePresets[presetId]?.fuelCap || 100;
    let t = getTrack();
    let col = colorCode || document.getElementById('ingame-car-color')?.value || document.getElementById('car-color')?.value || '#3498db';
    return {
        id: id, name: safeName, presetId: presetId || 'jaguar', color: col,
        x: t.startX, y: t.startY, prevX: t.startX, prevY: t.startY,
        vx: 0, vy: 0, angle: t.startAngle, yawRate: 0,
        gear: 1, rpm: 1000, steer: 0, targetX: t.startX, targetY: t.startY, targetAngle: t.startAngle,
        inputs: { steering: 0, throttle: 0, handbrake: false, driftAssist: false, smartAssist: false, shiftUp: false, shiftDown: false },
        frontSpinSeverity: 0, rearSpinSeverity: 0, appliesBrake: false, speedKmh: 0, fuel: cap, maxFuel: cap,
        lastSeen: performance.now(), clutchDump: 0, prevThrottle: 0,
        lap: 0, cp: false, lapStartTime: performance.now(), currentLapTime: 0, bestLap: Infinity, lastLap: 0, totalTime: 0, finished: false,
        manualGear: false, shiftTimer: 0
    };
}

function initLocalPlayer(baseId) {
    isSplitScreen = false;
    localPlayers = [{ id: baseId, gamepad: -1, isKeyboard: true }];
}

function assignGridPositions() {
    let ids = Object.keys(players); let t = getTrack();
    ids.forEach((pid, index) => {
        let row = Math.floor(index / 2); let col = index % 2 === 0 ? 1 : -1; let spacing = 120, lateral = 40;
        players[pid].x = t.startX - Math.cos(t.startAngle) * (row * spacing + 60) + Math.sin(t.startAngle) * (col * lateral);
        players[pid].y = t.startY - Math.sin(t.startAngle) * (row * spacing + 60) - Math.cos(t.startAngle) * (col * lateral);
        players[pid].angle = t.startAngle; players[pid].vx = 0; players[pid].vy = 0; players[pid].yawRate = 0;
        players[pid].lap = 0; players[pid].cp = false; players[pid].finished = false; players[pid].totalTime = 0; 
        players[pid].lapStartTime = performance.now(); players[pid].currentLapTime = 0; players[pid].bestLap = Infinity; players[pid].lastLap = 0;
        players[pid].targetX = players[pid].x; players[pid].targetY = players[pid].y; players[pid].targetAngle = players[pid].angle;
        players[pid].fuel = vehiclePresets[players[pid].presetId]?.fuelCap || 100;
        players[pid].gear = 1; players[pid].rpm = 1000; players[pid].clutchDump = 0; players[pid].prevThrottle = 0; players[pid].shiftTimer = 0;
    });
}

const statusMsg = document.getElementById('status-msg');
function showMsg(msg) { if (statusMsg) statusMsg.innerText = msg; }

function enterGame() {
    if (gameActive) return; 
    gameActive = true; 
    let lobby = document.getElementById('lobby'); if(lobby) lobby.style.display = 'none'; 
    let cCont = document.getElementById('canvas-container'); if(cCont) cCont.style.display = 'flex';
    
    detectDevice();
    if(isHost) { let sbCtrl = document.getElementById('sandbox-controls'); if(sbCtrl) sbCtrl.style.display = 'block'; assignGridPositions(); }
    resize(); 
    if (gameLoopId) cancelAnimationFrame(gameLoopId);
    gameLoopId = requestAnimationFrame(update);
}

function renderSplitScreenCards() {
    let container = document.getElementById('ss-cards-container');
    let countSel = document.getElementById('ss-player-count');
    if(!container || !countSel) return;
    
    let count = parseInt(countSel.value);
    let html = '';
    let presetOptions = document.getElementById('ingame-preset-selector') ? document.getElementById('ingame-preset-selector').innerHTML : '';
    let defaultColors = ['#3498db', '#e74c3c', '#f1c40f', '#2ecc71'];

    for(let i=1; i<=count; i++) {
        html += `
        <div class="ss-card" style="background: #1a1a1a; padding: 15px; border-radius: 8px; border: 1px solid #333;">
            <h3 style="color: #3498db; margin-bottom: 10px;">Spiller ${i}</h3>
            <label style="font-size: 11px; color: #888;">Input:</label>
            <select id="ss-in-${i}" class="input-text" style="padding: 5px; margin-top: 2px; margin-bottom: 10px;">
                <option value="kb" ${i===1 ? 'selected' : ''}>Tastatur / Touch</option>
                <option value="0" ${i===2 ? 'selected' : ''}>Kontroller 1</option>
                <option value="1" ${i===3 ? 'selected' : ''}>Kontroller 2</option>
                <option value="2" ${i===4 ? 'selected' : ''}>Kontroller 3</option>
                <option value="3">Kontroller 4</option>
            </select>
            <label style="font-size: 11px; color: #888;">Kjøretøy:</label>
            <select id="ss-car-${i}" class="input-text" style="padding: 5px; margin-top: 2px; margin-bottom: 10px;">
                ${presetOptions}
            </select>
            <label style="font-size: 11px; color: #888;">Farge:</label>
            <input type="color" id="ss-col-${i}" value="${defaultColors[i-1]}" style="width: 100%; height: 30px; border: none; margin-top: 2px; margin-bottom: 10px; cursor: pointer;">
            <label style="font-size: 11px; color: #888; display: flex; align-items: center; gap: 5px;">
                <input type="checkbox" id="ss-evan-${i}"> Evan-modus PÅ
            </label>
        </div>
        `;
    }
    container.innerHTML = html;
}

let btnSSMode = document.getElementById('btn-splitscreen-mode');
if (btnSSMode) {
    btnSSMode.addEventListener('click', () => {
        document.getElementById('mode-selection').style.display = 'none';
        document.getElementById('splitscreen-setup').style.display = 'block';
        renderSplitScreenCards();
    });
}
let ssCount = document.getElementById('ss-player-count');
if (ssCount) ssCount.addEventListener('change', renderSplitScreenCards);

let btnCancelSS = document.getElementById('btn-cancel-splitscreen');
if (btnCancelSS) {
    btnCancelSS.addEventListener('click', () => {
        document.getElementById('splitscreen-setup').style.display = 'none';
        document.getElementById('mode-selection').style.display = 'block';
    });
}

let btnStartSS = document.getElementById('btn-start-splitscreen');
if (btnStartSS) {
    btnStartSS.addEventListener('click', () => {
        isSplitScreen = true;
        myId = 'host'; isHost = true;
        localPlayers = [];
        
        for(let id in players) delete players[id];

        let count = parseInt(document.getElementById('ss-player-count').value);
        for(let i=1; i<=count; i++) {
            let inVal = document.getElementById(`ss-in-${i}`).value;
            let carVal = document.getElementById(`ss-car-${i}`).value;
            let colVal = document.getElementById(`ss-col-${i}`).value;
            let evanVal = document.getElementById(`ss-evan-${i}`).checked;
            
            let pId = 'local_p' + i;
            localPlayers.push({
                id: pId,
                isKeyboard: inVal === 'kb',
                gamepad: inVal === 'kb' ? -1 : parseInt(inVal)
            });
            
            players[pId] = createPlayerRecord(pId, carVal, "P" + i, colVal);
            players[pId].inputs.smartAssist = evanVal;
        }
        
        let hl = document.getElementById('ss-laps');
        totalLaps = hl ? parseInt(hl.value) : 3;
        
        document.getElementById('splitscreen-setup').style.display = 'none';
        enterGame();
    });
}

let hamBtn = document.getElementById('btn-hamburger');
let menuBtn = document.getElementById('btn-ingame-menu');
let modal = document.getElementById('ingame-modal');
let resumeBtn = document.getElementById('btn-resume');
let exitBtn = document.getElementById('btn-exit');

if (hamBtn && modal) hamBtn.addEventListener('click', () => modal.style.display = 'flex');
if (menuBtn && modal) menuBtn.addEventListener('click', () => modal.style.display = 'flex');
if (resumeBtn && modal) resumeBtn.addEventListener('click', () => modal.style.display = 'none');
if (exitBtn) exitBtn.addEventListener('click', exitToMenu);

let btnClosePodium = document.getElementById('btn-close-podium');
if (btnClosePodium) {
    btnClosePodium.addEventListener('click', () => {
        document.getElementById('podium-overlay').style.display = 'none';
        window.podiumClosed = true;
    });
}

let lP = document.getElementById('preset-selector'), gP = document.getElementById('ingame-preset-selector');
if (lP && gP) { lP.addEventListener('change', e => gP.value = e.target.value); gP.addEventListener('change', e => lP.value = e.target.value); }
let lC = document.getElementById('car-color'), gC = document.getElementById('ingame-car-color');
if (lC && gC) { lC.addEventListener('input', e => gC.value = e.target.value); gC.addEventListener('input', e => lC.value = e.target.value); }

let inputSelector = document.getElementById('input-selector');
if (inputSelector) {
    inputSelector.addEventListener('change', () => {
        inputSelector.dataset.userSet = 'true';
    });
}

function exitToMenu() {
    gameActive = false;
    if(gameLoopId) cancelAnimationFrame(gameLoopId);
    if(hostConnection) { hostConnection.close(); hostConnection = null; }
    for(let id in connections) { connections[id].close(); delete connections[id]; }
    if(peer) { peer.destroy(); peer = null; }
    for(let id in players) delete players[id];
    localPlayers = [];
    isSplitScreen = false;
    raceState = -1;
    
    document.getElementById('canvas-container').style.display = 'none';
    document.getElementById('ingame-modal').style.display = 'none';
    document.getElementById('podium-overlay').style.display = 'none';
    document.getElementById('splitscreen-setup').style.display = 'none';
    document.getElementById('lobby').style.display = 'flex';
    document.getElementById('mode-selection').style.display = 'block';
    document.getElementById('host-ui').style.display = 'none';
    document.getElementById('host-actions').style.display = 'none';
    document.getElementById('sandbox-controls').style.display = 'none';
    
    let pc = document.getElementById('player-count'); if(pc) pc.innerText = `Spillere: 1`;
    showMsg('');
}

['grip', 'power', 'mass', 'steering', 'caster'].forEach(id => {
    let el = document.getElementById(`sb-${id}`);
    if (el) { el.addEventListener('input', (e) => { serverSettings[id] = parseFloat(e.target.value); let valEl = document.getElementById(`val-${id}`); if (valEl) valEl.innerText = serverSettings[id].toFixed(1); }); }
});

let btnSb = document.getElementById('btn-sandbox-mode');
if (btnSb) {
    btnSb.addEventListener('click', () => {
        myId = 'sandbox'; isHost = true; initLocalPlayer(myId);
        let pName = document.getElementById('player-name')?.value || "Meg";
        let selPreset = document.getElementById('ingame-preset-selector')?.value || document.getElementById('preset-selector')?.value || 'jaguar';
        players[myId] = createPlayerRecord(myId, selPreset, pName);
        let hl = document.getElementById('host-laps'); totalLaps = hl ? parseInt(hl.value) : 3; enterGame();
    });
}

let btnHost = document.getElementById('btn-host-mode');
if (btnHost) {
    btnHost.addEventListener('click', () => {
        let mSel = document.getElementById('mode-selection'); if(mSel) mSel.style.display = 'none'; 
        let hUi = document.getElementById('host-ui'); if(hUi) hUi.style.display = 'block'; 
        showMsg('Oppretter Host...');
        peer = new Peer();
        peer.on('open', id => {
            myId = id; isHost = true; initLocalPlayer(myId);
            let hostInput = document.getElementById('my-host-id'); if(hostInput) hostInput.value = id; 
            showMsg('');
            let pName = document.getElementById('player-name')?.value || "Host";
            let selPreset = document.getElementById('ingame-preset-selector')?.value || document.getElementById('preset-selector')?.value || 'jaguar';
            players[myId] = createPlayerRecord(myId, selPreset, pName);
        });
        peer.on('connection', conn => {
            connections[conn.peer] = conn; 
            let pc = document.getElementById('player-count'); if(pc) pc.innerText = `Spillere: ${Object.keys(connections).length + 1}`;
            conn.on('data', data => {
                if (data.type === 'join') {
                    if (!players[conn.peer]) {
                        players[conn.peer] = createPlayerRecord(conn.peer, data.preset, data.name, data.color);
                        let t = getTrack();
                        if (gameActive) {
                            if (raceState === 0) { players[conn.peer].x = t.pit.x; players[conn.peer].y = t.pit.y; } else { assignGridPositions(); }
                            conn.send({ type: 'init', trackId: activeTrackId, laps: totalLaps, yourId: conn.peer });
                            conn.send({ type: 'start', laps: totalLaps, rs: raceState }); 
                        } else {
                            let hl = document.getElementById('host-laps');
                            conn.send({ type: 'init', trackId: activeTrackId, laps: hl ? parseInt(hl.value) : 3, yourId: conn.peer });
                        }
                    }
                } else if (data.type === 'inputs') {
                    if (!players[conn.peer]) {
                        players[conn.peer] = createPlayerRecord(conn.peer, 'jaguar', "Gjest");
                        let t = getTrack();
                        if (gameActive && raceState === 0) { players[conn.peer].x = t.pit.x; players[conn.peer].y = t.pit.y; } else if (gameActive) { assignGridPositions(); }
                        conn.send({ type: 'init', trackId: activeTrackId, laps: totalLaps, yourId: conn.peer });
                        if (gameActive) conn.send({ type: 'start', laps: totalLaps, rs: raceState });
                    }
                    players[conn.peer].inputs = data.inputs; players[conn.peer].lastSeen = performance.now();
                } else if (data.type === 'changeCar') { if (players[conn.peer]) { players[conn.peer].presetId = data.preset; players[conn.peer].maxFuel = vehiclePresets[data.preset]?.fuelCap || 100; } } 
                else if (data.type === 'changeColor') { if (players[conn.peer]) { players[conn.peer].color = data.color; } }
            });
            conn.on('close', () => { delete connections[conn.peer]; delete players[conn.peer]; let pc = document.getElementById('player-count'); if(pc) pc.innerText = `Spillere: ${Object.keys(connections).length + 1}`; });
        });
    });
}

let btnShare = document.getElementById('btn-share-link');
if (btnShare) {
    btnShare.addEventListener('click', () => {
        const url = window.location.origin + window.location.pathname + '?join=' + myId;
        if (navigator.share) navigator.share({ url: url }); else { navigator.clipboard.writeText(url); alert('Kopiert!'); }
    });
}

let btnEnter = document.getElementById('btn-enter-game');
if (btnEnter) { btnEnter.addEventListener('click', () => { let hl = document.getElementById('host-laps'); totalLaps = hl ? parseInt(hl.value) : 3; Object.values(connections).forEach(c => { try { c.send({ type: 'start', laps: totalLaps, rs: raceState }); } catch(e){} }); enterGame(); }); }

let trackSel = document.getElementById('track-selector');
if (trackSel) {
    trackSel.addEventListener('change', (e) => {
        if(!isHost) return; 
        activeTrackId = (e.target.value || 'standard').toLowerCase(); 
        generateEnvironment(); assignGridPositions(); raceState = -1; 
        Object.values(connections).forEach(c => { try { c.send({ type: 'init', trackId: activeTrackId, laps: totalLaps }); } catch(e){} });
    });
}

let btnReset = document.getElementById('btn-reset');
if (btnReset) { btnReset.addEventListener('click', () => { if(isHost) { assignGridPositions(); raceState = -1; } }); }

let btnAddAi = document.getElementById('btn-add-ai');
if (btnAddAi) { btnAddAi.addEventListener('click', () => { if(isHost) { let t = getTrack(); aiManager.spawnAI(players, t.startX, t.startY, t.startAngle); assignGridPositions(); } }); }

let btnForceEnd = document.getElementById('btn-force-end');
if (btnForceEnd) {
    btnForceEnd.addEventListener('click', () => {
        if (isHost && raceState === 0) {
            for (let pid in players) {
                if (!players[pid].finished) {
                    players[pid].finished = true;
                    players[pid].totalTime = performance.now();
                }
            }
        }
    });
}

let btnStart = document.getElementById('btn-start-race');
if (btnStart) {
    btnStart.addEventListener('click', () => {
        if(!isHost || raceState > 0) return;
        assignGridPositions(); 
        let hl = isSplitScreen ? document.getElementById('ss-laps') : document.getElementById('host-laps'); 
        totalLaps = hl ? parseInt(hl.value) : 3;
        
        let count = 5; raceState = count;
        Object.values(connections).forEach(c => { try { c.send({ type: 'state', laps: totalLaps, raceState: raceState, players: {} }); } catch(e){} }); 
        let int = setInterval(() => {
            count--; raceState = count;
            if(count === 0) { 
                let now = performance.now(); raceStartTime = now;
                for(let pid in players) { players[pid].lapStartTime = now; players[pid].lap = 0; players[pid].cp = false; players[pid].finished = false; players[pid].bestLap = Infinity; players[pid].lastLap = 0; }
                clearInterval(int); 
            }
        }, 1000);
    });
}

function initJoiner(hostId) {
    let mSel = document.getElementById('mode-selection'); if (mSel) mSel.style.display = 'none'; 
    showMsg('Kobler til...');
    peer = new Peer();
    peer.on('open', id => {
        myId = id; isHost = false; initLocalPlayer(myId); hostConnection = peer.connect(hostId);
        hostConnection.on('open', () => {
            showMsg('Tilkoblet! Venter på host...');
            let pName = document.getElementById('player-name')?.value || "Spiller";
            let selPreset = document.getElementById('ingame-preset-selector')?.value || document.getElementById('preset-selector')?.value || 'jaguar';
            let selColor = document.getElementById('ingame-car-color')?.value || document.getElementById('car-color')?.value || '#3498db';
            players[myId] = createPlayerRecord(myId, selPreset, pName, selColor);
            
            let joined = false;
            let handshakeLoop = setInterval(() => { if (joined || !hostConnection.open) { clearInterval(handshakeLoop); return; } hostConnection.send({ type: 'join', preset: selPreset, name: pName, color: selColor }); }, 500);

            hostConnection.on('data', data => {
                if (data.type === 'init') { 
                    joined = true; activeTrackId = data.trackId || 'standard'; generateEnvironment(); 
                    if(data.laps) totalLaps = data.laps;
                    if(data.yourId) { myId = data.yourId; localPlayers[0].id = myId; if(!players[myId]) players[myId] = createPlayerRecord(myId, selPreset, pName, selColor); }
                } 
                else if (data.type === 'start') { 
                    joined = true; if(data.laps) totalLaps = data.laps; 
                    if(data.rs === 0) { raceState = 0; raceStartTime = performance.now() - 1000; } 
                    enterGame(); 
                } 
                else if (data.type === 'state') {
                    if(data.laps) totalLaps = data.laps; if(data.raceState !== undefined) raceState = data.raceState;
                    if(data.settings) serverSettings = data.settings;
                    
                    for (let pid in data.players) {
                        let pData = data.players[pid];
                        if (!players[pid]) players[pid] = createPlayerRecord(pid, pData.presetId, pData.n, pData.c);
                        let p = players[pid];
                        
                        if (pData.x !== null && isFinite(pData.x)) p.targetX = pData.x; 
                        if (pData.y !== null && isFinite(pData.y)) p.targetY = pData.y; 
                        if (pData.a !== null && isFinite(pData.a)) p.targetAngle = pData.a; 
                        
                        p.steer = pData.s || 0; p.frontSpinSeverity = pData.fS || 0; p.rearSpinSeverity = pData.rS || 0; 
                        p.gear = pData.g || 1; p.rpm = pData.rpm || 1000; p.speedKmh = pData.v || 0; p.fuel = pData.f || 100;
                        p.appliesBrake = !!pData.b; p.lap = pData.l || 0; p.bestLap = pData.bl || Infinity; p.lastLap = pData.lL || 0; p.finished = !!pData.fin; p.currentLapTime = pData.cLT || 0; p.totalTime = pData.tT || 0; p.lastSeen = performance.now();
                        
                        let isLocal = localPlayers.some(lp => lp.id === pid);
                        if (!isLocal) {
                            p.presetId = pData.presetId || 'jaguar'; p.maxFuel = vehiclePresets[p.presetId]?.fuelCap || 100;
                            p.color = pData.c || '#3498db'; p.name = pData.n || "Gjest";
                        }
                    }
                    for (let pid in players) { let isLocal = localPlayers.some(lp => lp.id === pid); if(!isLocal && !data.players[pid]) delete players[pid]; }
                }
            });
        });
    });
}

let btnJoin = document.getElementById('btn-join-mode');
if (btnJoin) { btnJoin.addEventListener('click', () => { const code = document.getElementById('join-code-input')?.value.trim(); if (code) initJoiner(code); }); }

const urlParams = new URLSearchParams(window.location.search); let joinInp = document.getElementById('join-code-input'); if (joinInp && urlParams.get('join')) { joinInp.value = urlParams.get('join'); }

const localInputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: false, shiftUp: false, shiftDown: false };
const activeTouchState = { left: null, right: null };

function showEvanModeFlash(isOn, pName = "") {
    let el = document.getElementById('evan-flash-msg');
    if (!el) {
        el = document.createElement('div'); el.id = 'evan-flash-msg';
        Object.assign(el.style, { position: 'absolute', top: '25%', left: '50%', transform: 'translate(-50%, -50%)', fontSize: '5vw', fontWeight: '900', textShadow: '4px 4px 10px rgba(0,0,0,1)', zIndex: '9999', pointerEvents: 'none', transition: 'opacity 0.2s ease-out', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase' });
        document.body.appendChild(el);
    }
    el.style.color = isOn ? '#2ecc71' : '#e74c3c'; 
    el.innerText = `Evan-modus PÅ ${pName ? '('+pName+')' : ''}`; 
    if(!isOn) el.innerText = `Evan-modus AV ${pName ? '('+pName+')' : ''}`;
    el.style.opacity = '1';
    clearTimeout(window.evanFlashTimeout); window.evanFlashTimeout = setTimeout(() => el.style.opacity = '0', 2500);
}

function toggleAssist() { 
    localInputs.driftAssist = !localInputs.driftAssist; 
    let lA = document.getElementById('lobby-assist-selector'), gA = document.getElementById('ingame-assist-selector');
    if(lA) lA.value = localInputs.driftAssist ? 'on' : 'off';
    if(gA) gA.value = localInputs.driftAssist ? 'on' : 'off';
}
let lA = document.getElementById('lobby-assist-selector'), gA = document.getElementById('ingame-assist-selector');
if (lA && gA) { 
    lA.addEventListener('change', e => { localInputs.driftAssist = e.target.value === 'on'; gA.value = e.target.value; });
    gA.addEventListener('change', e => { localInputs.driftAssist = e.target.value === 'on'; lA.value = e.target.value; });
}

function setupJoystick(zId, sId, key, onC) {
    const z = document.getElementById(zId), s = document.getElementById(sId); if (!z || !s) return;
    function move(cX, cY) { const r = z.getBoundingClientRect(); const dx = Math.max(-45, Math.min(cX-(r.left+r.width/2), 45)), dy = Math.max(-45, Math.min(cY-(r.top+r.height/2), 45)); s.style.transform = `translate(${dx}px, ${dy}px)`; onC(dx/45, dy/45); }
    z.addEventListener('touchstart', e => { if(activeTouchState[key]===null){ activeTouchState[key]=e.changedTouches[0].identifier; move(e.changedTouches[0].clientX, e.changedTouches[0].clientY); safeAudioResume(); } });
    window.addEventListener('touchmove', e => { for(let t of e.changedTouches) if(t.identifier===activeTouchState[key]) move(t.clientX, t.clientY); });
    window.addEventListener('touchend', e => { for(let t of e.changedTouches) if(t.identifier===activeTouchState[key]){ activeTouchState[key]=null; s.style.transform=`translate(0px, 0px)`; onC(0,0); } });
}
setupJoystick('joystick-left-zone', 'stick-left', 'left', (x, y) => localInputs.steering = x); setupJoystick('joystick-right-zone', 'stick-right', 'right', (x, y) => localInputs.throttle = -y);

const hbBtn = document.getElementById('btn-handbrake'); const hb = s => e => { e.preventDefault(); localInputs.handbrake = s; safeAudioResume(); };
if (hbBtn) { hbBtn.addEventListener('touchstart', hb(true), {passive:false}); hbBtn.addEventListener('touchend', hb(false), {passive:false}); }

let initialThreeFingerY = null; const canvasContainer = document.getElementById('canvas-container');
if(canvasContainer) {
    canvasContainer.addEventListener('touchstart', e => {
        if(e.touches.length === 3) {
            initialThreeFingerY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
        }
    }, {passive: true});

    canvasContainer.addEventListener('touchmove', e => {
        if(e.touches.length === 3 && initialThreeFingerY !== null) {
            let currentAvgY = (e.touches[0].clientY + e.touches[1].clientY + e.touches[2].clientY) / 3;
            let diff = currentAvgY - initialThreeFingerY;
            if(Math.abs(diff) > 20) {
                adjustZoom(diff > 0 ? -0.05 : 0.05);
                initialThreeFingerY = currentAvgY;
            }
        }
    }, {passive: true});

    canvasContainer.addEventListener('touchend', e => {
        if(e.touches.length < 3) initialThreeFingerY = null;
    });
}

function adjustZoom(delta) { cameraZoom = Math.max(0.4, Math.min(2.5, cameraZoom + delta)); }

window.addEventListener('keydown', e => { 
    if(e.key.toLowerCase() === 't') toggleAssist();
    if(e.key === '+' || e.key === '=') adjustZoom(0.15); if(e.key === '-' || e.key === '_') adjustZoom(-0.15);
    if(e.key.toLowerCase() === 'h') { window.pendingSmartAssistToggle = true; }
    
    if(e.key.toLowerCase() === 'k' && isHost) { let botIds = Object.keys(players).filter(id => players[id].isAI); if (botIds.length > 0) { let botToRemove = botIds[botIds.length - 1]; delete players[botToRemove]; } }
    if(e.key.toLowerCase() === 'r') {
        isRecording = !isRecording; let recInd = document.getElementById('recording-indicator'); if (recInd) recInd.style.display = isRecording ? 'block' : 'none';
        if (!isRecording) {
            console.log(`%c--- OPPTAK FULLFØRT FOR BANEN: ${activeTrackId.toUpperCase()} ---`, "color: #2ecc71; font-weight: bold;");
            console.log(`if(!aiManager.waypoints['${activeTrackId}']) aiManager.waypoints['${activeTrackId}'] = [];`);
            console.log(`aiManager.waypoints['${activeTrackId}'].push(${JSON.stringify(recordedWaypoints)});`);
        }
    }
    if(e.key.toLowerCase() === 'c' && !isRecording) { recordedWaypoints = []; console.log("Lagret opptak slettet fra minnet."); }

    if(e.key==='w'||e.key==='ArrowUp') localInputs.throttle=1; if(e.key==='s'||e.key==='ArrowDown') localInputs.throttle=-1; if(e.key==='a'||e.key==='ArrowLeft') localInputs.steering=-1; if(e.key==='d'||e.key==='ArrowRight') localInputs.steering=1; if(e.key===' ') localInputs.handbrake=true; 
    if(e.key.toLowerCase() === 'e') localInputs.shiftUp = true; if(e.key.toLowerCase() === 'q') localInputs.shiftDown = true;
});
window.addEventListener('keyup', e => { 
    if(e.key==='w'||e.key==='s'||e.key==='ArrowUp'||e.key==='ArrowDown') localInputs.throttle=0; if(e.key==='a'||e.key==='d'||e.key==='ArrowLeft'||e.key==='ArrowRight') localInputs.steering=0; if(e.key===' ') localInputs.handbrake=false; 
    if(e.key.toLowerCase() === 'e') localInputs.shiftUp = false; if(e.key.toLowerCase() === 'q') localInputs.shiftDown = false;
});

const canvas = document.getElementById('gameCanvas'); const ctx = canvas ? canvas.getContext('2d', { alpha: false }) : null; 
function resize() { 
    if(!canvas) return; let cw = canvas.parentElement.clientWidth || window.innerWidth || 800; let ch = canvas.parentElement.clientHeight || window.innerHeight || 600;
    canvas.width = cw > 0 ? cw : 800; canvas.height = ch > 0 ? ch : 600; ctx.setTransform(1,0,0,1,0,0); detectDevice();
}
window.addEventListener('resize', resize); 
let btnFull = document.getElementById('btn-fullscreen'); if (btnFull) { btnFull.addEventListener('click', () => { const e = document.documentElement; if(!document.fullscreenElement) e.requestFullscreen(); else document.exitFullscreen(); setTimeout(resize,200); }); }

let lastTime = performance.now(); let lastLightState = -1; const skidmarks = [];
let lastNetUpdate = 0; let lastInputSend = 0; let lastInputString = "";

function formatTime(ms) { if(ms === Infinity || !isFinite(ms)) return "-.--"; let total = Math.floor(ms/10); let min = Math.floor(total/6000); let sec = Math.floor((total%6000)/100); let hund = total%100; return `${min>0?min+':':''}${sec.toString().padStart(min>0?2:1,'0')}.${hund.toString().padStart(2,'0')}`; }

function drawHUD(ctx, p, vx, vy, vw, vh, playerIndex) {
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.roundRect(vx + 10, vy + 10, 180, 75, 6); ctx.fill(); ctx.strokeStyle = '#333'; ctx.lineWidth = 1; ctx.stroke();
    
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 12px monospace';
    ctx.textAlign = 'left';
    
    let speed = Math.round(p.speedKmh || 0);
    let gear = p.gear === -1 ? 'R' : (p.gear === 0 ? 'N' : p.gear);
    let rpm = p.rpm < 10 ? 0 : Math.round(p.rpm || 0);
    let lapStr = `${Math.min(p.lap + 1, totalLaps)}/${totalLaps}`;
    let timeStr = p.finished ? formatTime(p.bestLap) : (raceState === 0 ? formatTime(p.currentLapTime) : "0.00");
    let evanState = p.inputs?.smartAssist ? 'PÅ' : 'AV';
    let evanColor = p.inputs?.smartAssist ? '#2ecc71' : '#e74c3c';
    
    ctx.fillStyle = '#2ecc71'; ctx.fillText(`Fart: ${speed} km/t`, vx + 18, vy + 28);
    ctx.fillStyle = evanColor; ctx.fillText(`Evan: ${evanState}`, vx + 120, vy + 28);
    
    ctx.fillStyle = '#3498db'; ctx.fillText(`Gir: ${gear} | RPM: ${rpm}`, vx + 18, vy + 46);
    ctx.fillStyle = '#f1c40f'; ctx.fillText(`Runde: ${lapStr} | ${timeStr}`, vx + 18, vy + 64);
    
    let fuelPct = (p.fuel || 0) / (p.maxFuel || 100);
    ctx.fillStyle = '#333'; ctx.fillRect(vx + 18, vy + 72, 164, 4);
    ctx.fillStyle = fuelPct < 0.2 ? '#e74c3c' : '#f1c40f'; 
    ctx.fillRect(vx + 18, vy + 72, 164 * fuelPct, 4);
    
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.beginPath(); ctx.roundRect(vx + vw - 45, vy + 10, 35, 35, 6); ctx.fill(); ctx.stroke();
    ctx.fillStyle = p.color; ctx.font = 'bold 18px sans-serif'; ctx.textAlign = 'center';
    
    let pText = isSplitScreen ? `P${playerIndex+1}` : `P`;
    ctx.fillText(pText, vx + vw - 27, vy + 34);
}

function update() {
    if (!gameActive || !canvas || !ctx) return;
    const now = performance.now(); const dt = Math.max(0.001, Math.min((now - lastTime) / 1000, 0.1)); lastTime = now;
    let track = getTrack();

    let gps = navigator.getGamepads ? navigator.getGamepads() : [];
    if (!window.prevGamepadState) window.prevGamepadState = {};

    localPlayers.forEach(lp => {
        let p = players[lp.id];
        if (!p) return;

        let fin = { steering: 0, throttle: 0, handbrake: false, driftAssist: false, smartAssist: p.inputs.smartAssist, shiftUp: false, shiftDown: false };

        let inputMode = document.getElementById('input-selector')?.value || 'touch';
        
        let gpIdx = isSplitScreen ? lp.gamepad : -1;
        let gp = null;
        
        if (!isSplitScreen && inputMode === 'gamepad') {
            let activeGps = Array.from(gps).filter(g => g && g.connected);
            if (activeGps.length > 0) gp = activeGps[0];
            if (gp) gpIdx = gp.index;
        } else if (gpIdx !== -1) {
            gp = gps[gpIdx];
        }

        let hasActiveGamepad = gp && gp.connected;

        if (isSplitScreen) {
            if (lp.isKeyboard) {
                fin.steering = localInputs.steering;
                fin.throttle = localInputs.throttle;
                fin.handbrake = localInputs.handbrake;
                fin.driftAssist = localInputs.driftAssist;
                fin.shiftUp = localInputs.shiftUp;
                fin.shiftDown = localInputs.shiftDown;
            } else if (hasActiveGamepad) {
                fin.steering = gp.axes[0] || 0;
                fin.throttle = (gp.buttons[7]?.value||0) - (gp.buttons[6]?.value||0);
                fin.handbrake = gp.buttons[0]?.pressed||false;
                fin.driftAssist = localInputs.driftAssist;
                if (gp.buttons[4]?.pressed && !window.prevGamepadState[gpIdx+'_4']) fin.shiftDown = true;
                if (gp.buttons[5]?.pressed && !window.prevGamepadState[gpIdx+'_5']) fin.shiftUp = true;
                if (gp.buttons[1]?.pressed && !window.prevGamepadState[gpIdx+'_1']) {
                    fin.smartAssist = !fin.smartAssist;
                    showEvanModeFlash(fin.smartAssist, p.name);
                }
            }
        } else {
            if (inputMode === 'gamepad' && hasActiveGamepad) {
                fin.steering = gp.axes[0] || 0;
                fin.throttle = (gp.buttons[7]?.value||0) - (gp.buttons[6]?.value||0);
                fin.handbrake = gp.buttons[0]?.pressed||false;
                fin.driftAssist = localInputs.driftAssist;
                if (gp.buttons[4]?.pressed && !window.prevGamepadState[gpIdx+'_4']) fin.shiftDown = true;
                if (gp.buttons[5]?.pressed && !window.prevGamepadState[gpIdx+'_5']) fin.shiftUp = true;
                if (gp.buttons[1]?.pressed && !window.prevGamepadState[gpIdx+'_1']) {
                    fin.smartAssist = !fin.smartAssist;
                    showEvanModeFlash(fin.smartAssist, p.name);
                }
            } else {
                fin.steering = localInputs.steering;
                fin.throttle = localInputs.throttle;
                fin.handbrake = localInputs.handbrake;
                fin.driftAssist = localInputs.driftAssist;
                fin.shiftUp = localInputs.shiftUp;
                fin.shiftDown = localInputs.shiftDown;
            }

            if (hasActiveGamepad) {
                if (gp.buttons[3]?.pressed && !window.prevGamepadState[gpIdx+'_3']) { let btnStart = document.getElementById('btn-start-race'); if(isHost && raceState <= 0 && btnStart) btnStart.click(); }
                if (gp.buttons[2]?.pressed && !window.prevGamepadState[gpIdx+'_2']) { if(isHost) { assignGridPositions(); raceState = -1; } }
                if (gp.buttons[14]?.pressed && !window.prevGamepadState[gpIdx+'_14']) adjustZoom(-0.15);
                if (gp.buttons[15]?.pressed && !window.prevGamepadState[gpIdx+'_15']) adjustZoom(0.15);
                if (gp.buttons[12]?.pressed && !window.prevGamepadState[gpIdx+'_12']) {
                    if(isHost) { let t = getTrack(); aiManager.spawnAI(players, t.startX, t.startY, t.startAngle); assignGridPositions(); }
                }
                if (gp.buttons[13]?.pressed && !window.prevGamepadState[gpIdx+'_13']) {
                    if(isHost) {
                        let botIds = Object.keys(players).filter(id => players[id].isAI);
                        if (botIds.length > 0) { let botToRemove = botIds[botIds.length - 1]; delete players[botToRemove]; }
                    }
                }
            }
        }

        if (window.pendingSmartAssistToggle && (lp.isKeyboard || !isSplitScreen)) {
            fin.smartAssist = !fin.smartAssist;
            showEvanModeFlash(fin.smartAssist, p.name);
            window.pendingSmartAssistToggle = false;
        }
        
        if (fin.smartAssist && !p.finished && typeof aiManager !== 'undefined' && aiManager.waypoints[activeTrackId] && aiManager.waypoints[activeTrackId].length > 0) {
            let waypoints = aiManager.waypoints[activeTrackId][0]; 
            let closestDist = Infinity; let closestIdx = 0;
            for (let i = 0; i < waypoints.length; i++) {
                let dist = Math.hypot(p.x - waypoints[i].x, p.y - waypoints[i].y);
                if (dist < closestDist) { closestDist = dist; closestIdx = i; }
            }
            let brakeCheckOffset = Math.floor(p.speedKmh / 5); let upcomingTarget = waypoints[(closestIdx + brakeCheckOffset) % waypoints.length]; let maxSafeSpeed = upcomingTarget.targetSpeed;
            if (p.speedKmh > maxSafeSpeed + 5) { fin.throttle = -0.5; } else if (p.speedKmh > maxSafeSpeed && fin.throttle > 0) { fin.throttle = 0; }
            if (track && ctx && track.path) {
                let rayAngles = [-0.5, 0, 0.5]; let rayDistance = 60 + (p.speedKmh * 0.3); let wallAvoidance = 0;
                ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineWidth = 175;
                rayAngles.forEach(offsetAngle => {
                    let checkAngle = p.angle + offsetAngle; let hitWall = false;
                    for (let i = 1; i <= 3; i++) {
                        let d = (rayDistance / 3) * i; let rayX = p.x + Math.cos(checkAngle) * d; let rayY = p.y + Math.sin(checkAngle) * d;
                        if (!ctx.isPointInStroke(track.path, rayX, rayY)) { hitWall = true; break; }
                    }
                    if (hitWall) wallAvoidance += (offsetAngle <= 0) ? 0.6 : -0.6;
                });
                ctx.restore();
                if (wallAvoidance !== 0) { fin.steering = Math.max(-1.0, Math.min(1.0, fin.steering + wallAvoidance)); }
            }
        }

        p.inputs = fin;
        
        if (!isSplitScreen && lp.id === myId) {
            let pSel = document.getElementById('ingame-preset-selector') || document.getElementById('preset-selector');
            if (pSel && pSel.value && p.presetId !== pSel.value) { p.presetId = pSel.value; p.maxFuel = vehiclePresets[pSel.value]?.fuelCap || 100; if (!isHost && hostConnection && hostConnection.open) { try { hostConnection.send({ type: 'changeCar', preset: pSel.value }); } catch(e){} } }
            let cSel = document.getElementById('ingame-car-color') || document.getElementById('car-color');
            if (cSel && cSel.value && p.color !== cSel.value) { p.color = cSel.value; if (!isHost && hostConnection && hostConnection.open) { try { hostConnection.send({ type: 'changeColor', color: cSel.value }); } catch(e){} } }
        }
        
        if (!isHost && hostConnection && hostConnection.open) {
            let currentInputString = fin.steering + "," + fin.throttle + "," + fin.handbrake + "," + fin.driftAssist + "," + fin.smartAssist + "," + fin.shiftUp + "," + fin.shiftDown;
            if (currentInputString !== lastInputString || now - lastInputSend > 250) { 
                try { hostConnection.send({ type: 'inputs_local', id: lp.id, inputs: fin }); } catch(e){} 
                lastInputString = currentInputString; lastInputSend = now; 
            }
        }
        
        if (lp.isKeyboard || !isSplitScreen) {
            localInputs.shiftUp = false;
            localInputs.shiftDown = false;
        }
    });

    if (isHost) {
        let outState = { players: {} }; let pkeys = Object.keys(players);
        
        for (let pid of pkeys) {
            let p = players[pid]; 
            let isLocal = localPlayers.some(lp => lp.id === pid);
            if (!isLocal && now - p.lastSeen > 3000) { delete players[pid]; if (connections[pid]) { connections[pid].close(); delete connections[pid]; } let pc = document.getElementById('player-count'); if(pc) pc.innerText = `Spillere: ${Object.keys(connections).length + 1}`; continue; }
            if (!isFinite(p.x) || !isFinite(p.y) || !isFinite(p.vx) || !isFinite(p.angle) || !isFinite(p.rpm)) { p.x = track.startX; p.y = track.startY; p.vx=0; p.vy=0; p.angle=track.startAngle; p.yawRate=0; p.rpm=1000; p.speedKmh=0; p.prevThrottle = 0; }

            let preset = vehiclePresets[p.presetId] || vehiclePresets['jaguar']; 
            let ins = p.inputs || { steering: 0, throttle: 0, handbrake: false, driftAssist: false, shiftUp: false, shiftDown: false };
            if (p.finished) { ins.throttle = 0; ins.handbrake = true; }

            let isGokart = preset.type === 'gokart';
            let maxEngineRpm = preset.maxRPM || (isGokart ? 13500 : 7500);
            let shiftUpRpm = maxEngineRpm - (isGokart ? 700 : 300);
            let shiftDownRpm = maxEngineRpm * (isGokart ? 0.48 : 0.45);
            let shiftDelay = isGokart ? 0.02 : (preset.type === 'f1' ? 0.05 : 0.15);
            let aeroDrag = isGokart ? 0.65 : 0.45;
            
            let currentGearRatios = preset.gears || gearRatios;
            let currentFinalDrive = preset.finalDrive || finalDrive; 
            let currentWheelRadius = isGokart ? 0.14 : wheelRadius; 
            let maxGears = currentGearRatios.length - 1;

            if (raceState === 0 && !p.finished) {
                p.currentLapTime = now - p.lapStartTime;
                let distCP = Math.hypot(p.x - track.checkpoint.x, p.y - track.checkpoint.y); if (distCP < track.checkpoint.radius) p.cp = true;
                let distFin = Math.hypot(p.x - track.finish.x, p.y - track.finish.y);
                if (p.cp && distFin < track.finish.radius) {
                    p.lap++; p.cp = false; let lapTime = now - p.lapStartTime; p.lastLap = lapTime; if (lapTime < p.bestLap) p.bestLap = lapTime; p.lapStartTime = now;
                    if (p.lap >= totalLaps) { p.finished = true; p.totalTime = now; }
                }
            } else if (raceState > 0) { p.currentLapTime = 0; }

            let pt = track.pit; let dx = p.x - pt.x; let dy = p.y - pt.y; let pCos = Math.cos(-pt.angle); let pSin = Math.sin(-pt.angle); let lx = dx * pCos - dy * pSin; let ly = dx * pSin + dy * pCos; let inPitBox = Math.abs(lx) <= pt.l/2 && Math.abs(ly) <= pt.w/2;
            let aPower = preset.power * serverSettings.power; let aMass = preset.mass * serverSettings.mass;
            
            if (inPitBox && p.speedKmh < 10) p.fuel = Math.min(preset.fuelCap, p.fuel + 20 * dt); else p.fuel -= Math.abs(ins.throttle) * aPower * 0.00015 * dt;
            if (p.fuel <= 0) { p.fuel = 0; ins.throttle = 0; }

            ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.lineWidth = 160; const onAsphalt = ctx.isPointInStroke(track.path, p.x, p.y) || inPitBox; ctx.lineWidth = 190; const onCurbs = ctx.isPointInStroke(track.path, p.x, p.y) && !onAsphalt; ctx.lineWidth = 240; const onSand = ctx.isPointInStroke(track.path, p.x, p.y) && !onAsphalt && !onCurbs; const inBounds = ctx.isPointInStroke(track.path, p.x, p.y) || inPitBox; ctx.restore();

            let surfaceMu = preset.grip * serverSettings.grip; let rollingResistance = preset.roll;
            if (onCurbs) surfaceMu *= 0.85; else if (onSand) { surfaceMu *= 0.4; rollingResistance = 0.35; } else if (!onAsphalt) { surfaceMu *= 0.55; rollingResistance = 0.15; }

            if (!inBounds && dt > 0) {
                p.x = p.prevX; p.y = p.prevY; let nx = 0, ny = 0;
                for (let r = 20; r <= 80; r += 20) { ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); if (ctx.isPointInStroke(track.path, p.x + r, p.y)) nx += 1; if (ctx.isPointInStroke(track.path, p.x - r, p.y)) nx -= 1; if (ctx.isPointInStroke(track.path, p.x, p.y + r)) ny += 1; if (ctx.isPointInStroke(track.path, p.x, p.y - r)) ny -= 1; ctx.restore(); if (nx !== 0 || ny !== 0) break; }
                let nLen = Math.hypot(nx, ny); if (nLen === 0) { nx = -Math.sign(p.vx); ny = -Math.sign(p.vy); nLen = Math.hypot(nx, ny); if (nLen === 0) { nx = 1; ny = 0; nLen = 1; } }
                nx /= nLen; ny /= nLen; let tx = -ny; let ty = nx; let vt = p.vx * tx + p.vy * ty; 
                p.vx = tx * vt * 0.98; p.vy = ty * vt * 0.98; p.x += nx * 4.0; p.y += ny * 4.0;
            }

            if (isRecording && isLocal) {
                if (recordedWaypoints.length === 0) { recordedWaypoints.push({ x: Math.round(p.x), y: Math.round(p.y), targetSpeed: Math.max(15, Math.round(p.speedKmh)) }); } else {
                    let lastPt = recordedWaypoints[recordedWaypoints.length - 1]; let dist = Math.hypot(p.x - lastPt.x, p.y - lastPt.y);
                    if (dist > 30) { recordedWaypoints.push({ x: Math.round(p.x), y: Math.round(p.y), targetSpeed: Math.max(15, Math.round(p.speedKmh)) }); }
                }
            }
            
            let lVx = p.vx * Math.cos(-p.angle) - p.vy * Math.sin(-p.angle); let lVy = p.vx * Math.sin(-p.angle) + p.vy * Math.cos(-p.angle);
            let slipAngleDeg = 0; if (Math.abs(lVx) > 1.0) { slipAngleDeg = Math.atan2(lVy, Math.abs(lVx)) * (180 / Math.PI); }

            let isSuddenThrottle = (ins.throttle - (p.prevThrottle || 0)) > 0.5; p.prevThrottle = ins.throttle;
            let steerInputTarget = Math.abs(ins.steering) > 0.08 ? Math.sign(ins.steering) * ((Math.abs(ins.steering) - 0.08) / 0.92) : 0; let torqueMultiplier = 1.0;

            if (ins.driftAssist) {
                let isSpinningOut = Math.abs(slipAngleDeg) > 45.0 || (Math.sign(slipAngleDeg) !== Math.sign(ins.steering) && Math.abs(ins.steering) > 0.2);
                if (isSpinningOut) { torqueMultiplier = 0.5; steerInputTarget += -Math.sign(ins.steering) * 0.15; } else { torqueMultiplier = 1.0 + (Math.abs(ins.steering) * 0.2); if (isSuddenThrottle && p.speedKmh > 30.0) { torqueMultiplier *= 1.25; } }
            }
            
            steerInputTarget = Math.max(-1.0, Math.min(1.0, steerInputTarget)); p.steer += (steerInputTarget - p.steer) * 12.0 * dt; 
            let mThrottle = Math.pow(Math.abs(ins.throttle), 2.5) * Math.sign(ins.throttle); mThrottle *= torqueMultiplier;

            p.speedKmh = Math.abs(lVx * 3.6) || 0; p.appliesBrake = mThrottle < 0 && lVx >= 1.0;
            let dForce = 0; let bForce = p.appliesBrake ? aMass * 15.0 * Math.abs(mThrottle) : 0; const isRev = mThrottle < 0 && lVx < 1.0; 

            if (raceState > 0) { 
                p.gear = 0; ins.handbrake = true; p.rpm += ((1000 + Math.max(0, mThrottle) * (maxEngineRpm-500)) - p.rpm) * 5 * dt; 
            } else {
                if (preset.ev) {
                    p.gear = lVx >= -0.5 ? 'D' : 'R'; p.rpm += (p.speedKmh * 80 - p.rpm) * 12 * dt;
                    if (p.rpm > maxEngineRpm) p.rpm = maxEngineRpm;
                    if (mThrottle > 0 || isRev) {
                        let powerMod = Math.max(0.0, 1.0 - Math.pow(p.rpm / maxEngineRpm, 2));
                        dForce = (aPower * 735.5 * 0.85 * (isRev ? 0.45 : 1.0) / Math.max(Math.abs(lVx), 5.0)) * mThrottle * powerMod;
                    }
                } else {
                    if (p.speedKmh < 1.0 && mThrottle <= 0) p.gear = 1; else if (p.gear === 0 && raceState === 0) { p.gear = 1; p.clutchDump = p.rpm / maxEngineRpm; }
                    
                    if (p.shiftTimer > 0) p.shiftTimer -= dt;

                    if (ins.shiftUp && p.gear < maxGears && p.shiftTimer <= 0) { p.gear++; p.shiftTimer = shiftDelay; p.manualGear = true; }
                    if (ins.shiftDown && p.gear > 1 && p.shiftTimer <= 0) { p.gear--; p.shiftTimer = shiftDelay; p.manualGear = true; }

                    let wheelSpeedRpm = (p.speedKmh / 3.6) / currentWheelRadius * 9.55; 
                    let targetRpm = 1000 + wheelSpeedRpm * currentGearRatios[p.gear] * currentFinalDrive;
                    
                    if (isGokart && mThrottle > 0 && p.speedKmh < 60) {
                        let slipRpm = 10500 + (mThrottle * 2000);
                        if (targetRpm < slipRpm) {
                            targetRpm = slipRpm;
                        }
                    } else if (p.speedKmh < 10 && mThrottle > 0) { 
                        targetRpm += Math.abs(mThrottle) * (maxEngineRpm * 0.6) * (1 - p.speedKmh/10); 
                    }
                    
                    if (!p.manualGear) {
                        if (p.rpm > shiftUpRpm && p.gear < maxGears && p.shiftTimer <= 0) { p.gear++; p.shiftTimer = shiftDelay; } 
                        else if (p.rpm < shiftDownRpm && p.gear > 1 && p.speedKmh > 10 && p.shiftTimer <= 0) { p.gear--; p.shiftTimer = shiftDelay; }
                    }

                    if (p.shiftTimer > 0) {
                        p.rpm += mThrottle * 10000 * dt; 
                        targetRpm = p.rpm; 
                    }

                    p.rpm += (targetRpm - p.rpm) * (isGokart ? 20 : 10) * dt;
                    
                    let isRevLimiting = false;
                    if (p.rpm > maxEngineRpm) {
                        p.rpm = maxEngineRpm - 150 - (Math.random() * 150);
                        isRevLimiting = true;
                    }

                    if ((mThrottle > 0 || isRev) && p.gear > 0 && p.shiftTimer <= 0) {
                        let torqueVal = 0;
                        if (isRevLimiting) {
                            torqueVal = -aPower * 0.4;
                        } else if (isGokart) {
                            let tqMul = 0;
                            if (p.rpm < 6000) tqMul = 0.15;
                            else if (p.rpm < 9000) tqMul = 0.15 + ((p.rpm - 6000) / 3000) * 0.25;
                            else if (p.rpm < 11500) tqMul = 0.40 + Math.pow((p.rpm - 9000) / 2500, 2.0) * 0.60;
                            else if (p.rpm < 13500) tqMul = 1.0 - ((p.rpm - 11500) / 2000) * 0.7;
                            else tqMul = 0.1;
                            torqueVal = aPower * 1.8 * tqMul;
                        } else {
                            if (preset.audio === 'turbo' || preset.audio === 'rotary') {
                                torqueVal = aPower * (p.rpm < 4000 ? 0.6 : 2.5 * Math.max(0.1, 1.0 - Math.pow((p.rpm - 6500)/3000, 2)));
                            } else if (preset.audio === 'v8' || preset.audio === 'v10') {
                                torqueVal = aPower * 2.2 * Math.max(0.1, 1.0 - Math.pow((p.rpm - 5000)/4500, 2));
                            } else {
                                torqueVal = aPower * 2.0 * Math.max(0.1, 1.0 - Math.pow((p.rpm - 6000)/3500, 2));
                            }
                        }
                        
                        dForce = (torqueVal * currentGearRatios[p.gear] * currentFinalDrive / currentWheelRadius);
                        if (!isRevLimiting) dForce *= mThrottle;

                        if (p.clutchDump > 0 && !isRevLimiting) { 
                            dForce *= (1.0 + p.clutchDump * 3.5); p.clutchDump -= dt * 2.5; 
                        } 
                        if (p.clutchDump < 0) p.clutchDump = 0;
                    } else if (mThrottle === 0 && p.gear > 0 && p.speedKmh > 5) {
                        dForce = -aPower * 0.08 * currentGearRatios[p.gear] * currentFinalDrive; 
                    }
                }
            }

            let tcsCut = 0;
            if (preset.drivetrain === 'RWD' && mThrottle > 0 && p.speedKmh > 5) {
                if (p.rearSpinSeverity > 0.15) {
                    tcsCut = Math.min(0.85, (p.rearSpinSeverity - 0.15) * 2.5);
                    dForce *= (1.0 - tcsCut);
                }
            }

            const maxGrip = (aMass * 9.81 / 2) * surfaceMu; const maxLat = maxGrip * 1.40; 
            let fLongF = preset.drivetrain === 'FWD' ? dForce : (preset.drivetrain === 'AWD' ? dForce*0.5 : 0); let fLongR = preset.drivetrain === 'RWD' ? dForce : (preset.drivetrain === 'AWD' ? dForce*0.5 : 0);
            let bDistR = bForce * 0.35; if (ins.handbrake) { bDistR += aMass * 20.0; p.appliesBrake = true; }
            fLongF -= Math.sign(lVx) * (bForce * 0.65); fLongR -= Math.sign(lVx) * bDistR; fLongF = Math.max(-maxGrip, Math.min(maxGrip, fLongF)) || 0; fLongR = Math.max(-maxGrip, Math.min(maxGrip, fLongR)) || 0;
            let gripF = maxLat * Math.sqrt(Math.max(0.01, 1.0 - Math.pow(Math.abs(fLongF) / maxGrip, 2) * 0.65)); let gripR = ins.handbrake ? maxLat * 0.02 : maxLat * Math.sqrt(Math.max(0.01, 1.0 - Math.pow(Math.abs(fLongR) / maxGrip, 2) * 0.85));

            let a = preset.l / 24.0; let b = preset.l / 24.0; let Iz = Math.max(1, aMass * (Math.pow(preset.w/12.0, 2) + Math.pow(preset.l/12.0, 2)) / 12.0); let slipAngle = p.speedKmh > 10.0 ? Math.atan2(lVy, Math.abs(lVx)) : 0; let maxRadian = (preset.turn * 10 * serverSettings.steering) * (Math.PI / 180); let delta = Math.max(-maxRadian, Math.min(maxRadian, (p.steer - slipAngle*0.45*serverSettings.caster) * maxRadian));
            let vYf = lVy + p.yawRate * a; let vSlipF = vYf * Math.cos(delta) - lVx * Math.sin(delta); let vYr = lVy - p.yawRate * b; let vSlipR = vYr;
            let MeffF = 1.0 / (1.0/aMass + (a*a)/Iz); let MeffR = 1.0 / (1.0/aMass + (b*b)/Iz);
            let Jf = Math.max(-(gripF * dt), Math.min(gripF * dt, -vSlipF * MeffF)); let Jr = Math.max(-(gripR * dt), Math.min(gripR * dt, -vSlipR * MeffR));

            let fLatF = Jf / dt; let fLatR = Jr / dt; let fX = fLongF * Math.cos(delta) + fLongR - fLatF * Math.sin(delta) - aeroDrag * lVx * Math.abs(lVx) - rollingResistance * aMass * 9.81 * Math.sign(lVx) * 0.1; let fY = fLongF * Math.sin(delta) + fLatF * Math.cos(delta) + fLatR - 0.45 * lVy * Math.abs(lVy); let torque = (fLongF * Math.sin(delta) + fLatF * Math.cos(delta)) * a - fLatR * b - (1.5 + Math.abs(lVy)*0.3) * p.yawRate * Iz;

            lVx += (fX / aMass) * dt; lVy += (fY / aMass) * dt; p.yawRate += (torque / Iz) * dt;
            p.vx = lVx * Math.cos(p.angle) - lVy * Math.sin(p.angle); p.vy = lVx * Math.sin(p.angle) + lVy * Math.cos(p.angle); p.angle += p.yawRate * dt;
            p.prevX = p.x; p.prevY = p.y; p.x += p.vx * 12.0 * dt; p.y += p.vy * 12.0 * dt;

            p.frontSpinSeverity = Math.abs(-vSlipF * MeffF) > gripF * dt ? Math.min(1.0, (Math.abs(-vSlipF * MeffF)-gripF * dt)/(gripF * dt)) : 0; p.rearSpinSeverity = Math.abs(-vSlipR * MeffR) > gripR * dt ? Math.min(1.0, (Math.abs(-vSlipR * MeffR)-gripR * dt)/(gripR * dt)) : 0; if (Math.abs(fLongR)/maxGrip > 0.95) p.rearSpinSeverity = 1.0; if (Math.abs(fLongF)/maxGrip > 0.95) p.frontSpinSeverity = 1.0; 

            outState.players[pid] = { x: p.x, y: p.y, a: p.angle, s: p.steer, fS: p.frontSpinSeverity, rS: p.rearSpinSeverity, presetId: p.presetId, c: p.color, g: p.gear, rpm: p.rpm, v: p.speedKmh, f: p.fuel, b: p.appliesBrake, n: p.name, l: p.lap, bl: p.bestLap === Infinity ? null : p.bestLap, lL: p.lastLap, fin: p.finished, cLT: p.currentLapTime, tT: p.totalTime };
        }

        for(let i=0; i<pkeys.length; i++) {
            for(let j=i+1; j<pkeys.length; j++) {
                let pA = players[pkeys[i]], pB = players[pkeys[j]]; if(!pA || !pB || !isFinite(pA.x) || !isFinite(pB.x)) continue;
                let dx = pB.x - pA.x, dy = pB.y - pA.y, dist = Math.hypot(dx, dy); 
                let preA = vehiclePresets[pA.presetId]||vehiclePresets['jaguar']; let preB = vehiclePresets[pB.presetId]||vehiclePresets['jaguar']; let rA = (preA.l + preA.w) / 4; let rB = (preB.l + preB.w) / 4;
                
                if(dist < rA + rB && dist > 0) {
                    if (pA.isGhost || pB.isGhost) continue;
                    let nx = dx/dist, ny = dy/dist; let velN = (pB.vx - pA.vx)*nx + (pB.vy - pA.vy)*ny; let mA = preA.mass * serverSettings.mass, mB = preB.mass * serverSettings.mass;
                    if (pA.speedKmh < 10 && pB.speedKmh < 10) { let pushAway = 2.0; pA.x -= nx * pushAway; pA.y -= ny * pushAway; pB.x += nx * pushAway; pB.y += ny * pushAway; }
                    if(velN <= 0) { let jImp = -(1 + 0.1) * velN / (1/mA + 1/mB); pA.vx -= (jImp * nx)/mA; pA.vy -= (jImp * ny)/mA; pB.vx += (jImp * nx)/mB; pB.vy += (jImp * ny)/mB; }
                    let corr = Math.max(0, (rA+rB - dist)) / (1/mA + 1/mB) * 0.8; pA.x -= (nx*corr)/mA; pA.y -= (ny*corr)/mA; pB.x += (nx*corr)/mB; pB.y += (ny*corr)/mB;
                }
            }
        }

        let raceIsRunning = (raceState === 0 || raceState === -1);
        if (typeof aiManager !== 'undefined') aiManager.updateAll(players, activeTrackId, track, ctx, raceIsRunning);
        
        if (now - lastNetUpdate > 40) {
            let stateMsg = { type: 'state', raceState: raceState, laps: totalLaps, settings: serverSettings, players: outState.players };
            Object.values(connections).forEach(c => { try { c.send(stateMsg); } catch(e){} });
            lastNetUpdate = now;
        }
        
    } else {
        for (let pid in players) {
            let p = players[pid]; 
            if (isFinite(p.targetX) && isFinite(p.targetY)) {
                p.x += (p.targetX - p.x) * 0.3; p.y += (p.targetY - p.y) * 0.3;
                let d = p.targetAngle - p.angle; while(d < -Math.PI) d+=Math.PI*2; while(d > Math.PI) d-=Math.PI*2; p.angle += d * 0.3;
            }
        }
    }

    if(raceState !== lastLightState) {
        let lightUI = document.getElementById('f1-lights');
        if (lightUI) {
            if(raceState === -1 || (raceState === 0 && now - raceStartTime > 2000)) lightUI.style.display = 'none';
            else { lightUI.style.display = 'flex'; let lights = lightUI.getElementsByClassName('light'); for(let i=0; i<5; i++) { if(lights[i]){ lights[i].className = 'light'; if(raceState === 0) lights[i].classList.add('green'); else if(5 - raceState > i) lights[i].classList.add('red'); } } if(raceState > 0) if(window.audioManager) window.audioManager.playBeep(440, 0.2); if(raceState === 0) if(window.audioManager) window.audioManager.playBeep(880, 0.8); }
        }
        lastLightState = raceState;
    } else if (raceState === 0 && now - raceStartTime > 2000) { let lUI = document.getElementById('f1-lights'); if(lUI) lUI.style.display = 'none'; }

    let trackLines = (typeof aiManager !== 'undefined' && aiManager.waypoints[activeTrackId] && aiManager.waypoints[activeTrackId][0]) ? aiManager.waypoints[activeTrackId][0] : [];
    let totalWp = Math.max(1, trackLines.length);

    let lbArr = Object.values(players).map(p => {
        let closestDist = Infinity; let closestIdx = 0;
        if (trackLines.length > 0 && isFinite(p.x) && isFinite(p.y)) {
            for (let w = 0; w < trackLines.length; w++) {
                let d = Math.hypot(p.x - trackLines[w].x, p.y - trackLines[w].y);
                if (d < closestDist) { closestDist = d; closestIdx = w; }
            }
        }
        
        let trackProgress = (p.lap * totalWp) + closestIdx;
        let isLocal = localPlayers.some(lp => lp.id === p.id);

        return {
            id: p.id, n: p.name, b: p.bestLap, l: p.lap, fin: p.finished,
            progress: trackProgress, last: p.lastLap || 0, isMe: isLocal, totalTime: p.totalTime || 0
        };
    }).sort((a,b) => {
        if(a.fin && b.fin) return a.totalTime - b.totalTime;
        if(a.fin && !b.fin) return -1;
        if(!a.fin && b.fin) return 1;
        return b.progress - a.progress; 
    });

    let displayArr = lbArr;
    if (deviceType === 'phone') {
        let myIndex = lbArr.findIndex(p => p.isMe);
        if (myIndex !== -1) {
            let start = Math.max(0, myIndex - 1);
            let end = Math.min(lbArr.length, myIndex + 2);
            displayArr = lbArr.slice(start, end);
        } else { displayArr = lbArr.slice(0, 3); }
    }

    let lbHTML = ""; 
    displayArr.forEach(p => {
        let actualRank = lbArr.findIndex(x => x.id === p.id) + 1;
        let bestStr = p.b === Infinity || !p.b ? "-.--" : formatTime(p.b);
        let lastStr = p.last === 0 || !p.last ? "-.--" : formatTime(p.last);
        let rowStyle = p.isMe ? 'color:#2ecc71; font-weight:bold;' : (p.fin ? 'color:#f1c40f;' : '');
        lbHTML += `<li style="${rowStyle}">
            <span class="lb-name">${actualRank}. ${p.n}</span>
            <span class="lb-times">B: ${bestStr} | S: ${lastStr}</span>
        </li>`;
    });
    let lbL = document.getElementById('lb-list'); if(lbL) lbL.innerHTML = lbHTML;

    let allFinished = Object.keys(players).length > 0 && Object.values(players).every(p => p.finished);

    if(raceState === 0 && allFinished) {
        if(!window.finishTimer) window.finishTimer = performance.now();
        if(performance.now() - window.finishTimer > 2500 && !window.podiumClosed) {
            let pUI = document.getElementById('podium-overlay');
            if(pUI && pUI.style.display !== 'flex') {
                pUI.style.display = 'flex'; pUI.classList.add('celebrate');
                document.getElementById('podium-1').innerText = "🥇 " + (lbArr[0] ? lbArr[0].n : '-');
                document.getElementById('podium-2').innerText = "🥈 " + (lbArr[1] ? lbArr[1].n : '-');
                document.getElementById('podium-3').innerText = "🥉 " + (lbArr[2] ? lbArr[2].n : '-');
                if(window.audioManager) { window.audioManager.playBeep(600, 0.2); setTimeout(()=>window.audioManager.playBeep(800, 0.4), 200); }
            }
        }
    } else {
        if (raceState !== 0) {
            window.finishTimer = null; window.podiumClosed = false;
            let pUI = document.getElementById('podium-overlay');
            if(pUI) { pUI.style.display = 'none'; pUI.classList.remove('celebrate'); }
        }
    }

    if (localPlayers.length > 0 && players[localPlayers[0].id] && window.audioManager) {
        let me = players[localPlayers[0].id];
        let pInputs = me.inputs || { throttle: 0 };
        let sq = Math.max(me.frontSpinSeverity || 0, me.rearSpinSeverity || 0); 
        let audioProfile = vehiclePresets[me.presetId] ? (vehiclePresets[me.presetId].audio || 'i4') : 'i4';
        
        if (!window.audioManager) {
            if (!window.warnedAudio) {
                console.error("[APP DEBUG] Finner ikke window.audioManager! Sjekk at audio.js er lastet inn FØR app.js i index.html");
                window.warnedAudio = true;
            }
        } else {
            window.audioManager.update(audioProfile, me.rpm, me.speedKmh, pInputs.throttle, sq);
        }
    }

    ctx.setTransform(1,0,0,1,0,0); 
    ctx.fillStyle = '#000'; 
    ctx.fillRect(0,0,canvas.width,canvas.height); 

    let cw = canvas.width; let ch = canvas.height;
    let numViews = isSplitScreen ? localPlayers.length : 1;

    for (let i = 0; i < numViews; i++) {
        let lp = localPlayers[i];
        let p = players[lp.id];
        if (!p) continue;

        let vx = 0, vy = 0, vw = cw, vh = ch;
        if (numViews === 2) { vx = i*(cw/2); vw = cw/2; }
        else if (numViews === 3) {
            if(i < 2) { vx = i*(cw/2); vy = 0; vw = cw/2; vh = ch/2; }
            else { vx = cw/4; vy = ch/2; vw = cw/2; vh = ch/2; }
        }
        else if (numViews === 4) {
            vx = (i%2)*(cw/2); vy = Math.floor(i/2)*(ch/2); vw = cw/2; vh = ch/2;
        }

        ctx.save();
        ctx.beginPath();
        ctx.rect(vx, vy, vw, vh);
        ctx.clip();

        ctx.fillStyle = '#2d4c1e'; 
        ctx.fillRect(vx, vy, vw, vh); 

        ctx.translate(vx + vw / 2, vy + vh / 2); 
        ctx.scale(cameraZoom, cameraZoom);
        if (isFinite(p.x) && isFinite(p.y)) { ctx.translate(-p.x, -p.y); } 
        else { ctx.translate(-track.startX, -track.startY); }

        let pt = track.pit; ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.angle); ctx.fillStyle = '#2c2c2c'; ctx.beginPath(); ctx.roundRect(-pt.l/2 - 40, -pt.w/2, pt.l + 80, pt.w, 40); ctx.fill(); ctx.restore();

        ctx.lineCap = 'round'; ctx.lineJoin = 'round';
        ctx.lineWidth = 250; ctx.strokeStyle = '#1a2e12'; ctx.stroke(track.path); ctx.lineWidth = 240; ctx.strokeStyle = '#c2b280'; ctx.stroke(track.path);
        ctx.lineWidth = 190; ctx.strokeStyle = '#fff'; ctx.stroke(track.path); ctx.strokeStyle = '#e74c3c'; ctx.setLineDash([30,30]); ctx.stroke(track.path); ctx.setLineDash([]);
        ctx.lineWidth = 160; ctx.strokeStyle = '#2c2c2c'; ctx.stroke(track.path);
        
        ctx.save(); ctx.translate(pt.x, pt.y); ctx.rotate(pt.angle);
        ctx.fillStyle = 'rgba(52, 152, 219, 0.3)'; ctx.strokeStyle = '#3498db'; ctx.lineWidth = 4; ctx.setLineDash([10,10]);
        ctx.beginPath(); ctx.roundRect(-pt.l/2, -pt.w/2, pt.l, pt.w, 10); ctx.fill(); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#fff'; ctx.font = '20px sans-serif'; ctx.fillText('PIT', -15, 6); ctx.restore();

        ctx.save(); ctx.translate(track.startX, track.startY); ctx.rotate(track.startAngle);
        let cbW = 10; ctx.fillStyle = '#fff'; for(let r=-8; r<8; r++) { for(let c=0; c<4; c++) { if((r+c)%2===0) ctx.fillRect(-c*cbW, r*cbW, cbW, cbW); } }
        ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
        for(let idx=0; idx<Object.keys(players).length; idx++) { let row = Math.floor(idx / 2); let col = idx % 2 === 0 ? 1 : -1; let spacing = 120, lateral = 40; let gx = -(row * spacing + 60); let gy = (col * lateral); ctx.beginPath(); ctx.moveTo(gx + 20, gy - 12); ctx.lineTo(gx - 20, gy - 12); ctx.lineTo(gx - 20, gy + 12); ctx.lineTo(gx + 20, gy + 12); ctx.stroke(); }
        ctx.restore();

        for (let obj of envObjects) {
            ctx.save(); ctx.translate(obj.x, obj.y); ctx.rotate(obj.angle);
            if (obj.type === 'house') { ctx.fillStyle = obj.color; ctx.fillRect(-obj.size/2, -obj.size/2.5, obj.size, obj.size*0.8); ctx.fillStyle = '#111'; ctx.fillRect(-obj.size/4, -obj.size/2.5, obj.size/2, obj.size*0.8); } 
            else { ctx.fillStyle = obj.color; ctx.beginPath(); ctx.arc(0, 0, obj.size, 0, Math.PI*2); ctx.fill(); ctx.fillStyle = '#1e8449'; ctx.beginPath(); ctx.arc(0, 0, obj.size*0.6, 0, Math.PI*2); ctx.fill(); }
            ctx.restore();
        }

        for (let pid in players) {
            let pData = players[pid], pre = vehiclePresets[pData.presetId]||vehiclePresets['jaguar']; let hw = pre.w / 2; let hl = pre.l / 2;
            if (!isFinite(pData.angle) || !isFinite(pData.x) || !isFinite(pData.y)) continue; 
            const fwX = Math.cos(pData.angle); const fwY = Math.sin(pData.angle); const rX = -Math.sin(pData.angle); const rY = Math.cos(pData.angle);
            if (pData.rearSpinSeverity > 0.1 || pData.inputs?.handbrake) skidmarks.push({ x1: pData.x + fwX * (-hl + 6) + rX * (-hw + 2), y1: pData.y + fwY * (-hl + 6) + rY * (-hw + 2), x2: pData.x + fwX * (-hl + 6) + rX * (hw - 2), y2: pData.y + fwY * (-hl + 6) + rY * (hw - 2) });
            if (pData.frontSpinSeverity > 0.1) skidmarks.push({ x1: pData.x + fwX * (hl - 8) + rX * (-hw + 2), y1: pData.y + fwY * (hl - 8) + rY * (-hw + 2), x2: pData.x + fwX * (hl - 8) + rX * (hw - 2), y2: pData.y + fwY * (hl - 8) + rY * (hw - 2) });
        }
        if (skidmarks.length > 5000) skidmarks.splice(0, skidmarks.length - 5000); ctx.fillStyle = 'rgba(15, 15, 15, 0.4)'; ctx.beginPath();
        
        for (let m = 0; m < skidmarks.length; m++) { 
            let sm = skidmarks[m]; 
            if (isFinite(sm.x1) && isFinite(sm.y1) && isFinite(sm.x2) && isFinite(sm.y2)) { ctx.rect(sm.x1 - 2, sm.y1 - 2, 4, 4); ctx.rect(sm.x2 - 2, sm.y2 - 2, 4, 4); }
        } 
        ctx.fill();

        for (let pid in players) {
            let pData = players[pid], pre = vehiclePresets[pData.presetId]||vehiclePresets['jaguar']; 
            if (!isFinite(pData.x) || !isFinite(pData.y) || !isFinite(pData.angle)) continue;
            
            ctx.save(); ctx.translate(pData.x, pData.y); ctx.rotate(pData.angle);
            if (pData.isGhost) ctx.globalAlpha = 0.45;
            let hl = pre.l/2, hw = pre.w/2; const wheelW = 14, wheelThick = 6, wheelOffset = hw - 1; let maxRadian = (pre.turn * 10 * serverSettings.steering) * (Math.PI / 180); let delta = Math.max(-maxRadian, Math.min(maxRadian, (pData.steer||0) * maxRadian));

            if (pre.type !== 'f1' && pre.type !== 'gokart') {
                ctx.fillStyle = '#111'; ctx.fillRect(-hl + 6 - wheelW/2, -wheelOffset - wheelThick/2, wheelW, wheelThick); ctx.fillRect(-hl + 6 - wheelW/2, wheelOffset - wheelThick/2, wheelW, wheelThick);
                ctx.save(); ctx.translate(hl - 8, -wheelOffset); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick/2, wheelW, wheelThick); ctx.restore();
                ctx.save(); ctx.translate(hl - 8, wheelOffset); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick/2, wheelW, wheelThick); ctx.restore();
            }

            if (pre.type === 'f1') { 
                ctx.fillStyle = '#111'; ctx.fillRect(-hl + 8 - wheelW/2, -hw, wheelW, wheelThick*1.5); ctx.fillRect(-hl + 8 - wheelW/2, hw - wheelThick*1.5, wheelW, wheelThick*1.5);
                ctx.save(); ctx.translate(hl - 6, -hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, 0, wheelW, wheelThick*1.5); ctx.restore();
                ctx.save(); ctx.translate(hl - 6, hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick*1.5, wheelW, wheelThick*1.5); ctx.restore();
                ctx.fillStyle = pData.color || '#e74c3c'; ctx.beginPath(); ctx.roundRect(-hl + 6, -hw*0.35, pre.l - 12, pre.w*0.7, 4); ctx.fill(); 
                ctx.fillStyle = '#111'; ctx.fillRect(2, -hw*0.25, 10, pre.w*0.5); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, 0, 4, 0, Math.PI*2); ctx.fill(); 
                ctx.fillStyle = '#111'; ctx.fillRect(hl - 4, -hw*0.9, 3, pre.w*1.8); ctx.fillRect(-hl, -hw*0.7, 4, pre.w*1.4); 
            } 
            else if (pre.type === 'gokart') { 
                ctx.fillStyle = '#111'; ctx.fillRect(-hl + 4 - wheelW/2, -hw, wheelW, wheelThick); ctx.fillRect(-hl + 4 - wheelW/2, hw - wheelThick, wheelW, wheelThick);
                ctx.save(); ctx.translate(hl - 4, -hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, 0, wheelW, wheelThick); ctx.restore();
                ctx.save(); ctx.translate(hl - 4, hw); ctx.rotate(delta); ctx.fillRect(-wheelW/2, -wheelThick, wheelW, wheelThick); ctx.restore();
                ctx.fillStyle = pData.color || '#7f8c8d'; ctx.beginPath(); ctx.roundRect(-hl+2, -hw*0.5, pre.l-4, pre.w, 2); ctx.fill(); 
                ctx.fillStyle = '#e67e22'; ctx.fillRect(hl - 3, -hw*0.7, 2, pre.w*1.4); 
                ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl + 6, -hw*0.4, 8, pre.w*0.8, 2); ctx.fill(); 
                ctx.fillStyle = '#e74c3c'; ctx.beginPath(); ctx.arc(-hl + 10, 0, 5, 0, Math.PI*2); ctx.fill(); 
            } 
            else if (pre.type === 'mx5') { ctx.fillStyle = pData.color || '#c0392b'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.roundRect(-hl*0.1, -hw + 3, pre.l*0.35, pre.w - 6, 4); ctx.fill(); } 
            else if (pre.type === 'r34') { ctx.fillStyle = pData.color || '#2980b9'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 5); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.05, -hw + 2, pre.l*0.4, pre.w - 4, 3); ctx.fill(); ctx.fillStyle = '#2980b9'; ctx.fillRect(-hl - 3, -hw, 4, pre.w); } 
            else if (pre.type === 's15') { ctx.fillStyle = pData.color || '#8e44ad'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 6); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.1, -hw + 2, pre.l*0.45, pre.w - 4, 4); ctx.fill(); ctx.fillStyle = '#f39c12'; ctx.fillRect(-hl - 4, -hw - 2, 5, pre.w + 4); } 
            else if (pre.type === 'jaguar') { ctx.fillStyle = pData.color || '#1abc9c'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.15, -hw + 3, pre.l*0.5, pre.w - 6, 6); ctx.fill(); }
            else { ctx.fillStyle = pData.color || '#e67e22'; ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill(); ctx.fillStyle = '#111'; ctx.beginPath(); ctx.roundRect(-hl*0.1, -hw + 3, pre.l*0.4, pre.w - 6, 4); ctx.fill(); }

            ctx.fillStyle = '#f1c40f'; ctx.beginPath(); ctx.roundRect(hl - 3, -hw + 3, 4, 5, 2); ctx.roundRect(hl - 3, hw - 8, 4, 5, 2); ctx.fill();
            ctx.fillStyle = pData.appliesBrake ? '#ff3333' : '#8b0000'; ctx.shadowColor = pData.appliesBrake ? '#ff0000' : 'transparent'; ctx.shadowBlur = pData.appliesBrake ? 10 : 0;
            ctx.beginPath(); ctx.roundRect(-hl - 1, -hw + 3, 3, 5, 1); ctx.roundRect(-hl - 1, hw - 8, 3, 5, 1); ctx.fill(); ctx.shadowBlur = 0;

            ctx.fillStyle='rgba(255,255,255,0.8)'; ctx.font='bold 12px sans-serif'; ctx.textAlign='center'; ctx.fillText(pData.name, 0, -hw-12);
            ctx.restore();
        }

        if (recordedWaypoints.length > 0) {
            ctx.save(); ctx.strokeStyle = 'rgba(241, 196, 15, 0.8)'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(recordedWaypoints[0].x, recordedWaypoints[0].y);
            for (let k = 1; k < recordedWaypoints.length; k++) { ctx.lineTo(recordedWaypoints[k].x, recordedWaypoints[k].y); } ctx.stroke();
            ctx.fillStyle = '#e74c3c'; for (let pt of recordedWaypoints) { ctx.fillRect(pt.x - 3, pt.y - 3, 6, 6); } ctx.restore();
        }
        
        ctx.restore(); 

        drawHUD(ctx, p, vx, vy, vw, vh, i);
        ctx.restore(); 
    }

    if (numViews > 1) {
        ctx.setTransform(1,0,0,1,0,0);
        ctx.strokeStyle = '#111'; ctx.lineWidth = 6;
        ctx.beginPath();
        if(numViews === 2) { ctx.moveTo(cw/2, 0); ctx.lineTo(cw/2, ch); }
        if(numViews >= 3) { ctx.moveTo(cw/2, 0); ctx.lineTo(cw/2, numViews===3?ch/2:ch); ctx.moveTo(0, ch/2); ctx.lineTo(cw, ch/2); }
        ctx.stroke();
    }
    
    for (let j = 0; j < 4; j++) {
        let gp = gps[j];
        if (gp) {
            for (let b = 0; b < gp.buttons.length; b++) { 
                window.prevGamepadState[j+'_'+b] = gp.buttons[b].pressed; 
            }
        }
    }

    gameLoopId = requestAnimationFrame(update);
}

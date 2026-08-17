const aiNames = [
    "Evan king", "Liamcho", "Emmacho", "Elenamoren", "Joar Politi", "Jarl", "Martin", "Renate", "Harald",
    "Åshild", "Hugo", "Charlie", "Nando", "Willy", "Linn", "Elisei", "Mario", "Maxi", "Miggi", "Mia",
    "Kristoffer", "Esther", "Egon", "Skjeggefant", "Eggemann"
];

const WORLD_PER_METER = 12;
const ASPHALT_WIDTH = 160;
const BOUNDS_WIDTH = 240;
const TRACE_STEP = 26;
const CAR_MARGIN = 20;
const GRIP_UTIL = 0.80;
const BRAKE_UTIL = 0.92;
const MIN_SPEED_MPS = 8;
const MAX_SPEED_MPS = 92;

function wrapAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
}

function circumRadiusWu(pA, pB, pC) {
    let a = Math.hypot(pB.x - pC.x, pB.y - pC.y);
    let b = Math.hypot(pA.x - pC.x, pA.y - pC.y);
    let c = Math.hypot(pA.x - pB.x, pA.y - pB.y);
    let area = Math.abs(pA.x * (pB.y - pC.y) + pB.x * (pC.y - pA.y) + pC.x * (pA.y - pB.y)) / 2.0;
    if (area < 1.2) return 2400;
    let radius = (a * b * c) / (4.0 * area);
    return Math.max(18, Math.min(2400, radius));
}

function edgeDistance(onTrack, x, y, angle, maxD) {
    if (!onTrack(x, y)) return 0;
    let lo = 0;
    let hi = 8;
    while (hi < maxD && onTrack(x + Math.cos(angle) * hi, y + Math.sin(angle) * hi)) {
        lo = hi;
        hi = Math.min(maxD, hi * 1.7);
    }
    if (hi >= maxD && onTrack(x + Math.cos(angle) * maxD, y + Math.sin(angle) * maxD)) return maxD;
    for (let i = 0; i < 7; i++) {
        let mid = (lo + hi) * 0.5;
        if (onTrack(x + Math.cos(angle) * mid, y + Math.sin(angle) * mid)) lo = mid;
        else hi = mid;
    }
    return lo;
}

function rayDistance(onTrack, x, y, angle, maxD, step) {
    let last = 0;
    let cs = Math.cos(angle);
    let sn = Math.sin(angle);
    for (let d = step; d <= maxD; d += step) {
        if (!onTrack(x + cs * d, y + sn * d)) {
            let lo = last;
            let hi = d;
            for (let i = 0; i < 5; i++) {
                let mid = (lo + hi) * 0.5;
                if (onTrack(x + cs * mid, y + sn * mid)) lo = mid;
                else hi = mid;
            }
            return lo;
        }
        last = d;
    }
    return maxD;
}

function snapToCenter(onTrack, x, y, heading) {
    let frame = localFrame(onTrack, x, y, heading);
    if (!frame) {
        return { x: x, y: y, halfWidth: 16, left: 0, right: 0, heading: heading };
    }
    return frame;
}

function localFrame(onTrack, x, y, headingHint) {
    if (!onTrack(x, y)) {
        let found = searchOnTrack(onTrack, x, y, 90);
        if (!found) return null;
        x = found.x;
        y = found.y;
    }
    let bestA = 0;
    let bestW = 1e9;
    let bestL = 0;
    let bestR = 0;
    for (let i = 0; i < 16; i++) {
        let a = i * Math.PI / 16;
        let l = edgeDistance(onTrack, x, y, a, 145);
        let r = edgeDistance(onTrack, x, y, a + Math.PI, 145);
        let w = l + r;
        if (w < bestW) {
            bestW = w;
            bestA = a;
            bestL = l;
            bestR = r;
        }
    }
    let half = Math.max(14, bestW * 0.5);
    if (bestW > 150) {
        let tan1 = headingHint;
        return { x: x, y: y, heading: tan1, halfWidth: half, left: bestL, right: bestR, wide: true };
    }
    let shift = (bestL - bestR) * 0.5;
    let cx = x + Math.cos(bestA) * shift;
    let cy = y + Math.sin(bestA) * shift;
    if (!onTrack(cx, cy)) {
        cx = x;
        cy = y;
    }
    let tan1 = bestA + Math.PI / 2;
    let tan2 = bestA - Math.PI / 2;
    let heading = Math.abs(wrapAngle(tan1 - headingHint)) <= Math.abs(wrapAngle(tan2 - headingHint)) ? tan1 : tan2;
    return { x: cx, y: cy, heading: heading, halfWidth: half, left: bestL, right: bestR, wide: false };
}

function bestHeading(onTrack, x, y, heading, spread, rays, maxD) {
    let bestA = heading;
    let bestScore = -1e9;
    let bestClear = 0;
    for (let i = 0; i < rays; i++) {
        let t = rays === 1 ? 0 : (i / (rays - 1) - 0.5) * 2;
        let a = heading + t * spread;
        let dist = rayDistance(onTrack, x, y, a, maxD, 16);
        let score = dist - t * t * 90;
        if (score > bestScore) {
            bestScore = score;
            bestA = a;
            bestClear = dist;
        }
    }
    return { heading: bestA, clear: bestClear };
}

function searchOnTrack(onTrack, x, y, maxR) {
    if (onTrack(x, y)) return { x: x, y: y };
    for (let r = 8; r <= maxR; r += 8) {
        for (let k = 0; k < 12; k++) {
            let a = (k / 12) * Math.PI * 2;
            let tx = x + Math.cos(a) * r;
            let ty = y + Math.sin(a) * r;
            if (onTrack(tx, ty)) return { x: tx, y: ty };
        }
    }
    return null;
}

function wrapIndex(i, n, closed) {
    if (closed) return (i % n + n) % n;
    return Math.max(0, Math.min(n - 1, i));
}

function traceCenterline(onTrack, startX, startY, startAngle) {
    let seed = searchOnTrack(onTrack, startX, startY, 90) || { x: startX, y: startY };
    let frame0 = localFrame(onTrack, seed.x, seed.y, startAngle);
    if (!frame0) return [];
    let x = frame0.x;
    let y = frame0.y;
    let heading = frame0.heading;
    let pts = [];
    let closed = false;

    for (let i = 0; i < 1400; i++) {
        let frame = localFrame(onTrack, x, y, heading);
        if (!frame) break;
        x = frame.x;
        y = frame.y;
        let dH = wrapAngle(frame.heading - heading);
        heading += Math.max(-0.38, Math.min(0.38, dH));

        let tight = frame.halfWidth < 42 || rayDistance(onTrack, x, y, heading, 90, 14) < 70;
        let spread = tight ? 1.45 : 0.85;
        let maxTurn = tight ? 0.95 : 0.36;
        let look = bestHeading(onTrack, x, y, heading, spread, tight ? 17 : 13, 420);
        let trialH = heading + Math.max(-maxTurn, Math.min(maxTurn, wrapAngle(look.heading - heading)));
        let stepLen = tight ? 14 : TRACE_STEP;
        let nx = x + Math.cos(trialH) * stepLen;
        let ny = y + Math.sin(trialH) * stepLen;
        let next = localFrame(onTrack, nx, ny, trialH);
        if (!next) {
            look = bestHeading(onTrack, x, y, heading, 1.6, 19, 360);
            trialH = heading + Math.max(-1.05, Math.min(1.05, wrapAngle(look.heading - heading)));
            nx = x + Math.cos(trialH) * TRACE_STEP;
            ny = y + Math.sin(trialH) * TRACE_STEP;
            next = localFrame(onTrack, nx, ny, trialH);
        }
        if (!next) {
            let recovered = null;
            for (let k = 0; k < 12; k++) {
                let sign = k % 2 === 0 ? 1 : -1;
                let mag = 0.45 + Math.floor(k / 2) * 0.28;
                let h = heading + sign * mag;
                let cand = localFrame(onTrack, x + Math.cos(h) * 16, y + Math.sin(h) * 16, h);
                if (cand && Math.hypot(cand.x - x, cand.y - y) > 8) {
                    recovered = cand;
                    look = { heading: h, clear: 40 };
                    break;
                }
            }
            if (!recovered) break;
            next = recovered;
        }

        let stepH = Math.atan2(next.y - y, next.x - x);
        let stepD = Math.hypot(next.x - x, next.y - y);
        if (stepD < 6) {
            look = bestHeading(onTrack, x, y, heading, 1.7, 19, 300);
            trialH = heading + wrapAngle(look.heading - heading);
            next = localFrame(onTrack, x + Math.cos(trialH) * TRACE_STEP, y + Math.sin(trialH) * TRACE_STEP, trialH);
            if (!next) break;
            stepH = Math.atan2(next.y - y, next.x - x);
            stepD = Math.hypot(next.x - x, next.y - y);
            if (stepD < 6) break;
        }
        let turn = wrapAngle(stepH - heading);
        heading += Math.max(-maxTurn, Math.min(maxTurn, turn));
        x = next.x;
        y = next.y;

        let reverse = false;
        if (pts.length > 6) {
            for (let k = pts.length - 6; k < pts.length; k++) {
                if (Math.hypot(x - pts[k].x, y - pts[k].y) < 12) reverse = true;
            }
        }
        if (reverse) {
            x += Math.cos(heading) * 8;
            y += Math.sin(heading) * 8;
        }

        pts.push({
            x: x,
            y: y,
            heading: heading,
            halfWidth: next.halfWidth,
            clear: look.clear
        });

        if (i > 50) {
            let d0 = Math.hypot(x - pts[0].x, y - pts[0].y);
            let ha = Math.abs(wrapAngle(heading - pts[0].heading));
            if (d0 < 90 && ha < 0.95) {
                closed = true;
                break;
            }
        }
    }
    pts.closed = closed;
    return pts;
}

function processCenterline(points) {
    let n = points.length;
    if (n < 12) return points;
    let closed = points.closed !== false;
    let step = 6;
    for (let i = 0; i < n; i++) {
        let pA = points[wrapIndex(i - step, n, closed)];
        let pB = points[i];
        let pC = points[wrapIndex(i + step, n, closed)];
        pB.radiusWu = circumRadiusWu(pA, pB, pC);
        let inx = pB.x - pA.x;
        let iny = pB.y - pA.y;
        let oux = pC.x - pB.x;
        let ouy = pC.y - pB.y;
        pB.turn = Math.atan2(inx * ouy - iny * oux, inx * oux + iny * ouy);
    }
    let radii = points.map(p => p.radiusWu);
    for (let i = 0; i < n; i++) {
        let win = [];
        for (let j = -2; j <= 2; j++) win.push(radii[wrapIndex(i + j, n, closed)]);
        win.sort((a, b) => a - b);
        points[i].radiusWu = win[2];
    }

    for (let i = 0; i < n; i++) {
        let maxTurn = 0;
        let maxK = 8;
        for (let k = 2; k <= 20; k++) {
            let t = points[(i + k) % n].turn;
            if (Math.abs(t) > Math.abs(maxTurn)) {
                maxTurn = t;
                maxK = k;
            }
        }
        let bias = 0;
        if (Math.abs(maxTurn) > 0.035) {
            if (maxK > 11) bias = -Math.sign(maxTurn);
            else if (maxK > 5) bias = Math.sign(maxTurn) * 0.15;
            else bias = Math.sign(maxTurn);
        }
        let usable = Math.max(0, points[i].halfWidth - CAR_MARGIN);
        points[i].lineOffset = bias * usable * 0.36;
    }
    return points;
}

function buildSpeedProfile(points, preset) {
    let n = points.length;
    let v = new Array(n);
    let mu = Math.max(0.9, (preset.grip || 1.6) * GRIP_UTIL);
    let g = 9.81;
    let brakeA = Math.min(18, mu * g * BRAKE_UTIL);
    let maxSteer = (preset.turn || 4) * 10 * Math.PI / 180;
    let wheelbase = Math.max(1.15, (preset.l || 40) / 12);
    let rMin = wheelbase / Math.max(0.09, Math.tan(Math.min(1.15, maxSteer)));
    let lowLock = (preset.turn || 4) < 1.2;

    for (let i = 0; i < n; i++) {
        let rM = Math.max(rMin * (lowLock ? 1.15 : 0.82), points[i].radiusWu / WORLD_PER_METER);
        let speed = Math.sqrt(mu * g * rM);
        if (points[i].halfWidth < 48) speed *= 0.86;
        if (lowLock) speed *= 0.78;
        v[i] = Math.max(MIN_SPEED_MPS, Math.min(MAX_SPEED_MPS, speed));
    }

    let closed = points.closed !== false;
    for (let pass = 0; pass < 2; pass++) {
        for (let i = n - 1; i >= 0; i--) {
            let j = closed ? (i + 1) % n : Math.min(n - 1, i + 1);
            if (j === i) continue;
            let ds = Math.hypot(points[j].x - points[i].x, points[j].y - points[i].y) / WORLD_PER_METER;
            let vMax = Math.sqrt(v[j] * v[j] + 2 * brakeA * Math.max(0.2, ds));
            if (v[i] > vMax) v[i] = vMax;
        }
    }
    return { v: v, brakeA: brakeA, mu: mu };
}

function nearestIndex(points, x, y, heading, hint) {
    let n = points.length;
    if (!n) return 0;
    let best = hint == null ? 0 : ((hint % n) + n) % n;
    let bestScore = Infinity;
    let window = hint == null ? n : 56;
    let start = hint == null ? 0 : hint;
    for (let k = -10; k < window; k++) {
        let i = (start + k + n * 8) % n;
        let p = points[i];
        let d = Math.hypot(x - p.x, y - p.y);
        let ha = Math.abs(wrapAngle(heading - p.heading));
        if (ha > 2.2 && d > 90) continue;
        let score = d + ha * 55;
        if (score < bestScore) {
            bestScore = score;
            best = i;
        }
    }
    return best;
}

function pointAlong(points, idx, lookDist, offsetScale) {
    let n = points.length;
    let acc = 0;
    let i = idx;
    let guard = 0;
    while (acc < lookDist && guard < n) {
        let a = points[i % n];
        let b = points[(i + 1) % n];
        acc += Math.hypot(b.x - a.x, b.y - a.y);
        i++;
        guard++;
    }
    let p = points[i % n];
    let off = (p.lineOffset || 0) * offsetScale;
    return {
        x: p.x + Math.cos(p.heading + Math.PI / 2) * off,
        y: p.y + Math.sin(p.heading + Math.PI / 2) * off,
        index: i % n,
        heading: p.heading
    };
}

function lookaheadSpeed(profile, damp, idx, lookPts) {
    let n = profile.v.length;
    let minV = profile.v[idx] * (damp[idx] || 1);
    let span = Math.max(4, lookPts);
    for (let k = 1; k <= span; k++) {
        let i = (idx + k) % n;
        minV = Math.min(minV, profile.v[i] * (damp[i] || 1));
    }
    return minV;
}

function makeWidthProbe(ctx, path, width) {
    return function onTrack(x, y) {
        ctx.lineWidth = width;
        return ctx.isPointInStroke(path, x, y);
    };
}

function withTrackProbe(ctx, track, width, fn) {
    if (ctx && typeof ctx.probe === 'function') return fn(ctx.probe);
    if (!ctx || !track || !track.path || typeof ctx.isPointInStroke !== 'function') return fn(null);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    try {
        return fn(makeWidthProbe(ctx, track.path, width));
    } finally {
        ctx.restore();
    }
}

function withAsphaltAndBounds(ctx, track, fn) {
    if (ctx && typeof ctx.probe === 'function') return fn(ctx.probe, ctx.boundsProbe || ctx.probe);
    if (!ctx || !track || !track.path || typeof ctx.isPointInStroke !== 'function') return fn(null, null);
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    try {
        return fn(makeWidthProbe(ctx, track.path, ASPHALT_WIDTH), makeWidthProbe(ctx, track.path, BOUNDS_WIDTH));
    } finally {
        ctx.restore();
    }
}

const AIAutonomous = {
    WORLD_PER_METER: WORLD_PER_METER,
    wrapAngle: wrapAngle,
    circumRadiusWu: circumRadiusWu,
    edgeDistance: edgeDistance,
    rayDistance: rayDistance,
    snapToCenter: snapToCenter,
    localFrame: localFrame,
    bestHeading: bestHeading,
    searchOnTrack: searchOnTrack,
    traceCenterline: traceCenterline,
    processCenterline: processCenterline,
    buildSpeedProfile: buildSpeedProfile,
    nearestIndex: nearestIndex,
    pointAlong: pointAlong
};

class AIDriver {
    constructor(id) {
        this.kp = 1.18;
        this.kd = 0.30;
        this.prevSteerError = 0;

        this.id = id;
        this.name = aiNames[Math.floor(Math.random() * aiNames.length)];
        this.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        this.lineIndex = null;
        this.progressIndex = null;

        this.stuckTime = 0;
        this.reverseTime = 0;
        this.failsafeTimer = 0;
        this.recoveryTime = 0;
        this.recoverySteer = 0;
        this.lastUpdate = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
        this.simDt = null;

        this.lateralOffset = 0;
        this.targetOffset = 0;
        this.overtakeTimer = 0;
        this.draftBoost = 0;
        this.aggression = 0.55 + Math.random() * 0.35;
        this.manager = null;
        this.lastIncident = 0;
        this.cleanTime = 0;
        this.vision = null;
        this.visionAge = 999;
    }

    getLookaheadPoint(vehicle, trackLine) {
        let v = vehicle.speedKmh / 3.6;
        let lookaheadDist = Math.max(12, v * 0.75);

        let closestIdx = 0;
        let minDist = Infinity;
        for (let i = 0; i < trackLine.length; i++) {
            let pt = trackLine[i];
            let d = Math.hypot(vehicle.x - pt.x, vehicle.y - pt.y);
            if (d < minDist) {
                minDist = d;
                closestIdx = i;
            }
        }

        let targetPt = trackLine[closestIdx];
        let accumulatedDist = 0;
        for (let i = closestIdx; i < closestIdx + trackLine.length; i++) {
            let curr = trackLine[i % trackLine.length];
            let next = trackLine[(i + 1) % trackLine.length];
            accumulatedDist += Math.hypot(curr.x - next.x, curr.y - next.y);

            if (accumulatedDist >= lookaheadDist) {
                targetPt = next;
                break;
            }
        }
        return targetPt;
    }

    nowMs() {
        return (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
    }

    stepDt() {
        let now = this.nowMs();
        let dt = this.simDt != null ? this.simDt : (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        return Math.max(0.0008, Math.min(0.05, dt));
    }

    applyGears(inputs, vehicle, preset) {
        let maxRpm = preset.maxRPM || 7500;
        if (vehicle.gear < 1) {
            inputs.shiftUp = true;
            inputs.throttle = Math.max(inputs.throttle, 0.6);
            return;
        }
        let shiftUpRpm = preset.type === 'gokart' ? maxRpm - 700 : maxRpm * 0.90;
        let shiftDownRpm = preset.type === 'gokart' ? maxRpm * 0.48 : maxRpm * 0.45;
        if (vehicle.rpm > shiftUpRpm && vehicle.gear < (preset.gears ? preset.gears.length - 1 : 5)) {
            inputs.shiftUp = true;
        } else if (vehicle.rpm < shiftDownRpm && vehicle.gear > 1 && vehicle.speedKmh > 15) {
            inputs.shiftDown = true;
        }
    }

    applyOvertake(vehicle, allPlayers, dt, timeSinceStart, baseSpeedKmh) {
        let sideClearance = { left: true, right: true };
        this.draftBoost = 0;
        let minSpeedAhead = Infinity;
        let isBrakingZone = (baseSpeedKmh < vehicle.speedKmh - 20);

        if (this.overtakeTimer > 0) this.overtakeTimer -= dt;
        else this.targetOffset = 0;

        if (!allPlayers) return minSpeedAhead;

        for (let otherId in allPlayers) {
            if (otherId === this.id) continue;
            let otherCar = allPlayers[otherId];
            if (!otherCar || otherCar.finished || otherCar.isGhost) continue;

            let dist = Math.hypot(otherCar.x - vehicle.x, otherCar.y - vehicle.y);
            if (dist > 250) continue;

            let angleToOther = Math.atan2(otherCar.y - vehicle.y, otherCar.x - vehicle.x);
            let angleDiff = wrapAngle(angleToOther - vehicle.angle);

            if (dist < 80 && Math.abs(angleDiff) > 1.0) {
                if (angleDiff > 0) sideClearance.right = false;
                else sideClearance.left = false;
            }

            if (Math.abs(angleDiff) < 0.4 && dist < 150) {
                if (dist > 40) this.draftBoost = 12;
                if (Math.abs(angleDiff) < 0.25 && dist < 25) {
                    minSpeedAhead = Math.min(minSpeedAhead, otherCar.speedKmh);
                }
                if (dist < 90 && vehicle.speedKmh > otherCar.speedKmh - 5 && this.overtakeTimer <= 0 && !isBrakingZone) {
                    this.overtakeTimer = 2.6;
                    let offsetAmount = 28;
                    if (sideClearance.left && !sideClearance.right) this.targetOffset = -offsetAmount;
                    else if (sideClearance.right && !sideClearance.left) this.targetOffset = offsetAmount;
                    else this.targetOffset = (Math.random() > 0.5) ? offsetAmount : -offsetAmount;
                }
            }
        }

        if (this.targetOffset < 0 && !sideClearance.right) this.overtakeTimer = 0.8;
        if (this.targetOffset > 0 && !sideClearance.left) this.overtakeTimer = 0.8;
        this.lateralOffset += (this.targetOffset - this.lateralOffset) * 2.2 * dt;
        if (timeSinceStart <= 4000) return Infinity;
        return minSpeedAhead;
    }

    applyStuckLogic(inputs, vehicle, dt, raceStarted, onTrack) {
        if (this.reverseTime > 0) {
            this.reverseTime -= dt;
            if (vehicle.gear > -1) {
                inputs.shiftDown = true;
                inputs.throttle = 0;
            } else {
                inputs.throttle = 1.0;
            }
            if (onTrack) {
                let look = bestHeading(onTrack, vehicle.x, vehicle.y, vehicle.angle + Math.PI, 0.9, 9, 140);
                let err = wrapAngle(look.heading - vehicle.angle);
                inputs.steering = err > 0 ? -1 : 1;
            } else {
                inputs.steering = this.recoverySteer || (this.prevSteerError > 0 ? -1 : 1);
            }
            this.recoveryTime = 1.6;
            return true;
        }

        if (raceStarted && vehicle.speedKmh < 4.0 && inputs.throttle > 0) {
            this.stuckTime += dt;
            if (this.stuckTime > 2.2) {
                this.reverseTime = 1.4;
                this.stuckTime = 0;
                this.recoverySteer = (inputs.steering > 0 ? -1.4 : 1.4);
            }
        } else if (vehicle.speedKmh > 14.0) {
            this.stuckTime = 0;
        }
        return false;
    }

    tryFailsafe(vehicle, dt, raceStarted, onTrack, trackMeta) {
        if (raceStarted && vehicle.speedKmh < 4.0) {
            this.failsafeTimer += dt;
            if (this.failsafeTimer > 4.0) {
                let dest = null;
                if (onTrack) dest = searchOnTrack(onTrack, vehicle.x, vehicle.y, 220);
                if (!dest && trackMeta) dest = { x: trackMeta.startX, y: trackMeta.startY };
                if (dest) {
                    vehicle.x = dest.x;
                    vehicle.y = dest.y;
                    if (onTrack) {
                        let look = bestHeading(onTrack, dest.x, dest.y, trackMeta ? trackMeta.startAngle : vehicle.angle, 1.2, 15, 220);
                        vehicle.angle = look.heading;
                    } else if (trackMeta) {
                        vehicle.angle = trackMeta.startAngle;
                    }
                    vehicle.vx = Math.cos(vehicle.angle) * 8;
                    vehicle.vy = Math.sin(vehicle.angle) * 8;
                    vehicle.speedKmh = 28;
                    vehicle.gear = 1;
                    vehicle.ghostTimer = 2.0;
                }
                this.failsafeTimer = 0;
                this.stuckTime = 0;
                this.reverseTime = 0;
                this.progressIndex = null;
                return true;
            }
        } else if (vehicle.speedKmh > 10.0) {
            this.failsafeTimer = 0;
        }
        return false;
    }

    calculateAutonomousInputs(vehicle, allPlayers, track, ctx, raceStarted, vehiclePresets) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true, shiftUp: false, shiftDown: false };
        let dt = this.stepDt();
        let now = this.nowMs();
        let timeSinceStart = (raceStarted && vehicle.lap === 0) ? (now - vehicle.lapStartTime) : 99999;

        if (vehicle.ghostTimer > 0) {
            vehicle.ghostTimer -= dt;
            vehicle.isGhost = true;
        } else {
            vehicle.isGhost = false;
        }

        if (!raceStarted) {
            inputs.throttle = 1.0;
            if (vehicle.gear > 0) inputs.shiftDown = true;
            inputs.handbrake = true;
            return inputs;
        }

        let preset = (vehiclePresets && (vehiclePresets[vehicle.presetId] || vehiclePresets.ai_standard)) || { grip: 1.7, turn: 4.5, l: 44, maxRPM: 7500, type: 'r34' };
        this.applyGears(inputs, vehicle, preset);

        return withAsphaltAndBounds(ctx, track, (onAsphalt, inBounds) => {
            let probe = onAsphalt || inBounds;
            if (this.tryFailsafe(vehicle, dt, raceStarted, inBounds || onAsphalt, track)) return inputs;

            let mgr = this.manager;
            let traced = mgr && track && mgr.getTrace(track);
            let points = traced && traced.points;
            let profile = traced && mgr ? mgr.getProfile(track, vehicle.presetId, preset) : null;
            let damp = traced && mgr ? mgr.getDamp(track) : null;

            if (!probe && (!points || !profile)) return inputs;

            if (this.applyStuckLogic(inputs, vehicle, dt, raceStarted, probe)) return inputs;

            let onA = onAsphalt ? onAsphalt(vehicle.x, vehicle.y) : true;
            let vision = this.senseLocal(probe, vehicle, dt);
            let lineScale = Math.max(0.28, Math.min(1.0, (preset.turn || 4) / 5.0));

            let targetKmh;
            let aimX;
            let aimY;

            let idx = 0;
            if (points && points.length > 12 && profile) {
                this.progressIndex = nearestIndex(points, vehicle.x, vehicle.y, vehicle.angle, this.progressIndex);
                idx = this.progressIndex;
                let lineDist = Math.hypot(vehicle.x - points[idx].x, vehicle.y - points[idx].y);
                if (lineDist > (points[idx].halfWidth || 80) + 36) {
                    points = null;
                }
            }
            if (points && points.length > 12 && profile) {
                let lookWu = Math.max(48, Math.min(340, (vehicle.speedKmh / 3.6) * WORLD_PER_METER * (preset.turn < 1.2 ? 0.72 : 0.56)));
                let aim = pointAlong(points, idx, lookWu, lineScale);
                let half = points[idx].halfWidth;
                let extra = Math.max(-half + CAR_MARGIN, Math.min(half - CAR_MARGIN, this.lateralOffset));
                aimX = aim.x + Math.cos(aim.heading + Math.PI / 2) * extra;
                aimY = aim.y + Math.sin(aim.heading + Math.PI / 2) * extra;
                let lookPts = 2;
                targetKmh = lookaheadSpeed(profile, damp || [], idx, lookPts) * 3.6;
                targetKmh += this.draftBoost + this.aggression * 4;
                if (!onA) targetKmh = Math.min(targetKmh, 48);
                this.noteLearning(mgr, track, idx, vehicle, vision, onA, dt);
            } else if (probe) {
                let look = bestHeading(probe, vehicle.x, vehicle.y, vehicle.angle, 1.15, 17, 280);
                let snap = snapToCenter(probe, vehicle.x, vehicle.y, look.heading);
                let lookWu = Math.max(50, (vehicle.speedKmh / 3.6) * WORLD_PER_METER * 0.55);
                aimX = snap.x + Math.cos(look.heading) * lookWu;
                aimY = snap.y + Math.sin(look.heading) * lookWu;
                let brakeA = Math.min(16, (preset.grip || 1.6) * 9.81 * BRAKE_UTIL);
                let clearM = Math.max(4, look.clear / WORLD_PER_METER);
                targetKmh = Math.sqrt(2 * brakeA * Math.max(6, clearM - 10)) * 3.6;
                targetKmh = Math.max(28, Math.min(210, targetKmh * 0.92 + this.aggression * 4));
            } else {
                return inputs;
            }

            let minAhead = this.applyOvertake(vehicle, allPlayers, dt, timeSinceStart, targetKmh);
            if (isFinite(minAhead)) targetKmh = Math.min(targetKmh, minAhead);

            let err = wrapAngle(Math.atan2(aimY - vehicle.y, aimX - vehicle.x) - vehicle.angle);
            if (this.recoveryTime > 0) {
                this.recoveryTime -= dt;
                err += this.recoverySteer * 0.35;
            }
            let derivative = err - this.prevSteerError;
            this.prevSteerError = err;
            let rawSteer = this.kp * err + this.kd * derivative;

            if (vision) {
                rawSteer += vision.avoid;
                if (vision.wallClose && vehicle.speedKmh > 36) {
                    targetKmh = Math.min(targetKmh, vehicle.speedKmh - 18);
                }
                let stopM = Math.pow(vehicle.speedKmh / 3.6, 2) / (2 * Math.max(8, (preset.grip || 1.6) * 9.81 * BRAKE_UTIL));
                let clearM = vision.forward / WORLD_PER_METER;
                if (clearM < stopM + 9) {
                    targetKmh = Math.min(targetKmh, Math.sqrt(Math.max(4, clearM - 6) * 2 * 12) * 3.6);
                }
            }

            inputs.steering = Math.max(-1, Math.min(1, rawSteer));

            let lateralGrip = Math.abs(inputs.steering);
            let maxLong = 1.0;
            if (lateralGrip > 0.18) maxLong = Math.max(0.28, 1.0 - (lateralGrip * lateralGrip * 0.55));
            if (vehicle.rearSpinSeverity > 0.2) maxLong = Math.min(maxLong, 0.55);

            if (vehicle.speedKmh > targetKmh + 14) {
                inputs.throttle = -1.0;
                inputs.handbrake = vehicle.speedKmh > targetKmh + 28 && lateralGrip < 0.25;
            } else if (vehicle.speedKmh > targetKmh + 5) {
                inputs.throttle = -0.55;
                inputs.handbrake = false;
            } else if (vehicle.speedKmh > targetKmh) {
                inputs.throttle = 0.12 * maxLong;
                inputs.handbrake = false;
            } else {
                let gap = targetKmh - vehicle.speedKmh;
                inputs.throttle = (gap > 16 ? 1.0 : Math.max(0.2, gap / 16)) * maxLong;
                inputs.handbrake = false;
            }

            this.applyStuckLogic(inputs, vehicle, dt, raceStarted, probe);
            return inputs;
        });
    }

    senseLocal(onTrack, vehicle, dt) {
        if (!onTrack) return null;
        this.visionAge += dt;
        if (this.vision && this.visionAge < 0.04) return this.vision;
        let fwd = rayDistance(onTrack, vehicle.x, vehicle.y, vehicle.angle, 360, 18);
        let left = rayDistance(onTrack, vehicle.x, vehicle.y, vehicle.angle - 0.55, 160, 18);
        let right = rayDistance(onTrack, vehicle.x, vehicle.y, vehicle.angle + 0.55, 160, 18);
        let leftN = rayDistance(onTrack, vehicle.x, vehicle.y, vehicle.angle - 1.05, 90, 16);
        let rightN = rayDistance(onTrack, vehicle.x, vehicle.y, vehicle.angle + 1.05, 90, 16);
        let avoid = 0;
        if (left < 42 && left < right) avoid += 0.85;
        if (right < 42 && right < left) avoid -= 0.85;
        if (leftN < 24) avoid += 0.7;
        if (rightN < 24) avoid -= 0.7;
        this.vision = {
            forward: fwd,
            left: left,
            right: right,
            avoid: Math.max(-1.1, Math.min(1.1, avoid)),
            wallClose: Math.min(left, right) < 16
        };
        this.visionAge = 0;
        return this.vision;
    }

    noteLearning(mgr, track, idx, vehicle, vision, onAsphalt, dt) {
        if (!mgr || !track) return;
        if (!onAsphalt || (vision && vision.wallClose)) {
            mgr.punish(track, idx, 0.045);
            this.lastIncident = 0;
            this.cleanTime = 0;
            return;
        }
        this.cleanTime += dt;
        this.lastIncident += dt;
        if (this.cleanTime > 1.6 && Math.abs(this.prevSteerError) < 0.22 && vehicle.speedKmh > 40) {
            mgr.reward(track, idx, 0.006);
            this.cleanTime = 0.4;
        }
    }

    calculateWaypointInputs(vehicle, trackWaypoints, allPlayers, track, ctx, raceStarted, vehiclePresets, useDynamicSpeed = true) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true, shiftUp: false, shiftDown: false };
        let now = this.nowMs();
        let dt = this.simDt != null ? this.simDt : (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        dt = Math.max(0.0008, Math.min(0.05, dt));

        let timeSinceStart = (raceStarted && vehicle.lap === 0) ? (now - vehicle.lapStartTime) : 99999;

        if (vehicle.ghostTimer > 0) {
            vehicle.ghostTimer -= dt;
            vehicle.isGhost = true;
        } else {
            vehicle.isGhost = false;
        }

        if (!trackWaypoints || trackWaypoints.length === 0) return inputs;

        if (!raceStarted) {
            inputs.throttle = 1.0;
            if (vehicle.gear > 0) inputs.shiftDown = true;
            inputs.handbrake = true;
            return inputs;
        }

        let preset = vehiclePresets[vehicle.presetId] || vehiclePresets['ai_standard'];
        let maxRpm = preset.maxRPM || 7500;

        if (raceStarted && vehicle.speedKmh < 4.0) {
            this.failsafeTimer += dt;
            if (this.failsafeTimer > 4.0) {
                let closestDist = Infinity; let closestIdx = 0;
                for (let i = 0; i < trackWaypoints.length; i++) {
                    let dist = Math.hypot(vehicle.x - trackWaypoints[i].x, vehicle.y - trackWaypoints[i].y);
                    if (dist < closestDist) { closestDist = dist; closestIdx = i; }
                }

                let targetPt = trackWaypoints[closestIdx];
                let nextPt = trackWaypoints[(closestIdx + 1) % trackWaypoints.length];

                vehicle.x = targetPt.x;
                vehicle.y = targetPt.y;
                vehicle.angle = Math.atan2(nextPt.y - targetPt.y, nextPt.x - targetPt.x);

                let targetSpeedMpS = targetPt.targetSpeed / 3.6;
                vehicle.vx = Math.cos(vehicle.angle) * targetSpeedMpS;
                vehicle.vy = Math.sin(vehicle.angle) * targetSpeedMpS;
                vehicle.speedKmh = targetPt.targetSpeed;
                vehicle.gear = 1;

                vehicle.ghostTimer = 2.0;
                this.failsafeTimer = 0;
                this.stuckTime = 0;
                this.reverseTime = 0;
                return inputs;
            }
        } else if (vehicle.speedKmh > 10.0) {
            this.failsafeTimer = 0;
        }

        if (this.reverseTime > 0) {
            this.reverseTime -= dt;

            if (vehicle.gear > -1) {
                inputs.shiftDown = true;
                inputs.throttle = 0;
            } else {
                inputs.throttle = 1.0;
            }

            let closestDist = Infinity; let closestIdx = 0;
            for (let i = 0; i < trackWaypoints.length; i++) {
                let dist = Math.hypot(vehicle.x - trackWaypoints[i].x, vehicle.y - trackWaypoints[i].y);
                if (dist < closestDist) { closestDist = dist; closestIdx = i; }
            }
            let targetPt = trackWaypoints[(closestIdx + 3) % trackWaypoints.length];
            let targetAngle = Math.atan2(targetPt.y - vehicle.y, targetPt.x - vehicle.x);
            let angleDiff = wrapAngle(targetAngle - vehicle.angle);

            inputs.steering = angleDiff > 0 ? -1.0 : 1.0;
            this.recoveryTime = 2.0;
            return inputs;
        }

        if (vehicle.gear < 1) {
            inputs.shiftUp = true;
            inputs.throttle = 1.0;
        } else {
            let shiftUpRpm = preset.type === 'gokart' ? maxRpm - 700 : maxRpm * 0.90;
            let shiftDownRpm = preset.type === 'gokart' ? maxRpm * 0.48 : maxRpm * 0.45;

            if (vehicle.rpm > shiftUpRpm && vehicle.gear < (preset.gears ? preset.gears.length - 1 : 5)) {
                inputs.shiftUp = true;
            } else if (vehicle.rpm < shiftDownRpm && vehicle.gear > 1 && vehicle.speedKmh > 15) {
                inputs.shiftDown = true;
            }
        }

        let closestDistSpeed = Infinity;
        let currentPt = trackWaypoints[0];
        for (let i = 0; i < trackWaypoints.length; i++) {
            let dist = Math.hypot(vehicle.x - trackWaypoints[i].x, vehicle.y - trackWaypoints[i].y);
            if (dist < closestDistSpeed) {
                closestDistSpeed = dist;
                currentPt = trackWaypoints[i];
            }
        }
        let baseSpeed = useDynamicSpeed ? (currentPt.physicsSpeed || currentPt.targetSpeed) : currentPt.targetSpeed;

        let minSpeedAhead = this.applyOvertake(vehicle, allPlayers, dt, timeSinceStart, baseSpeed);

        let lookaheadDist = Math.max(15, (vehicle.speedKmh / 3.6) * 0.9);

        let targetPt = trackWaypoints[0];
        let accumulatedDist = 0;
        let cIdx = trackWaypoints.indexOf(currentPt);
        if(cIdx === -1) cIdx = 0;

        for (let i = cIdx; i < cIdx + trackWaypoints.length; i++) {
            let curr = trackWaypoints[i % trackWaypoints.length];
            let next = trackWaypoints[(i + 1) % trackWaypoints.length];
            accumulatedDist += Math.hypot(curr.x - next.x, curr.y - next.y);
            if (accumulatedDist >= lookaheadDist) {
                targetPt = next;
                break;
            }
        }

        let targetIndex = trackWaypoints.indexOf(targetPt);
        if (targetIndex === -1) targetIndex = 0;
        let nextTarget = trackWaypoints[(targetIndex + 1) % trackWaypoints.length];

        let trackAngle = Math.atan2(nextTarget.y - targetPt.y, nextTarget.x - targetPt.x);
        let aimX = targetPt.x + Math.cos(trackAngle + Math.PI/2) * this.lateralOffset;
        let aimY = targetPt.y + Math.sin(trackAngle + Math.PI/2) * this.lateralOffset;

        let targetAimAngle = Math.atan2(aimY - vehicle.y, aimX - vehicle.x);
        let angleDiffSteer = wrapAngle(targetAimAngle - vehicle.angle);

        if (this.recoveryTime > 0) {
            this.recoveryTime -= dt;
            angleDiffSteer += this.recoverySteer;
        }

        let derivative = angleDiffSteer - this.prevSteerError;
        this.prevSteerError = angleDiffSteer;
        let rawSteer = (this.kp * angleDiffSteer) + (this.kd * derivative);

        inputs.steering = Math.max(-1.0, Math.min(1.0, rawSteer));

        if (track && ctx && track.path && !vehicle.isGhost) {
            let rayAngles = [-0.6, 0, 0.6];
            let rayDistance = 70 + (vehicle.speedKmh * 0.4);
            let wallAvoidance = 0;
            let checkSteps = 4;

            ctx.save();
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.lineWidth = 175;

            rayAngles.forEach(offsetAngle => {
                let checkAngle = vehicle.angle + offsetAngle;
                let hitWall = false;

                for (let i = 1; i <= checkSteps; i++) {
                    let d = (rayDistance / checkSteps) * i;
                    let rayX = vehicle.x + Math.cos(checkAngle) * d;
                    let rayY = vehicle.y + Math.sin(checkAngle) * d;

                    if (!ctx.isPointInStroke(track.path, rayX, rayY)) {
                        hitWall = true;
                        break;
                    }
                }
                if (hitWall) wallAvoidance += (offsetAngle <= 0) ? 1.0 : -1.0;
            });
            ctx.restore();

            if (wallAvoidance !== 0) {
                inputs.steering = Math.max(-1.0, Math.min(1.0, inputs.steering + wallAvoidance));
                if (vehicle.speedKmh > 40) inputs.throttle = 0.0;
            }
        }

        let maxSafeSpeed = baseSpeed + this.draftBoost + (this.aggression * 5);
        if (timeSinceStart > 4000) maxSafeSpeed = Math.min(maxSafeSpeed, minSpeedAhead);

        let lateralGrip = Math.abs(inputs.steering);
        let maxLongitudinalGrip = 1.0;

        if (lateralGrip > 0.15) {
            maxLongitudinalGrip = Math.max(0.3, 1.0 - (lateralGrip * lateralGrip * 0.6));
        }

        if (vehicle.speedKmh > maxSafeSpeed) {
            inputs.throttle = -1.0;
            inputs.handbrake = (vehicle.speedKmh > maxSafeSpeed + 15);
        } else {
            inputs.handbrake = false;
            let speedDiff = maxSafeSpeed - vehicle.speedKmh;

            if (speedDiff > 20) {
                inputs.throttle = 1.0;
            } else {
                let rawThrottle = speedDiff > 5 ? 1.0 : (speedDiff / 5.0);
                inputs.throttle = rawThrottle * maxLongitudinalGrip;
            }
        }

        if (raceStarted && vehicle.speedKmh < 4.0 && inputs.throttle > 0) {
            this.stuckTime += dt;
            if (this.stuckTime > 2.5) {
                this.reverseTime = 1.5;
                this.stuckTime = 0;
                this.recoverySteer = (inputs.steering > 0 ? -1.5 : 1.5);
            }
        } else if (vehicle.speedKmh > 15.0) {
            this.stuckTime = 0;
        }

        return inputs;
    }

    calculateInputs(vehicle, trackWaypoints, allPlayers, track, ctx, raceStarted, vehiclePresets, useDynamicSpeed = true) {
        let mode = this.manager && this.manager.driveMode ? this.manager.driveMode : 'autonomous';
        if (mode === 'waypoints') {
            return this.calculateWaypointInputs(vehicle, trackWaypoints, allPlayers, track, ctx, raceStarted, vehiclePresets, useDynamicSpeed);
        }
        return this.calculateAutonomousInputs(vehicle, allPlayers, track, ctx, raceStarted, vehiclePresets || {});
    }
}

class AIManager {
    constructor() {
        this.aiList = {};
        this.maxAI = 20;
        this.waypoints = typeof aiManagerWaypoints !== 'undefined' ? aiManagerWaypoints : {};
        this.processedTracks = {};
        this.useDynamicSpeed = true;
        this.driveMode = 'autonomous';
        this.traces = {};
        this.profiles = {};
        this.learn = {};
    }

    trackKey(track) {
        if (!track) return 'unknown';
        if (track.id) return track.id;
        return String(Math.round(track.startX || 0)) + ':' + String(Math.round(track.startY || 0)) + ':' + String((track.startAngle || 0).toFixed(3));
    }

    ensureTrace(trackId, track, ctx) {
        if (!track) return null;
        let key = trackId || this.trackKey(track);
        if (this.traces[key] && this.traces[key].points) return this.traces[key];
        if (this.traces[key] && this.traces[key].failed) return this.traces[key];

        let traced = withTrackProbe(ctx, track, ASPHALT_WIDTH, (onTrack) => {
            if (!onTrack) return { failed: true, points: null };
            let raw = traceCenterline(onTrack, track.startX, track.startY, track.startAngle);
            if (!raw || raw.length < 16) return { failed: true, points: null };
            return { failed: false, points: processCenterline(raw), key: key };
        });
        this.traces[key] = traced;
        if (traced && traced.points) {
            this.learn[key] = new Array(traced.points.length).fill(1);
        }
        return traced;
    }

    getTrace(track) {
        return this.traces[track.id || this.trackKey(track)] || this.traces[this.trackKey(track)] || null;
    }

    getProfile(track, presetId, preset) {
        let tkey = track.id || this.trackKey(track);
        let pkey = tkey + ':' + (presetId || 'car');
        if (this.profiles[pkey]) return this.profiles[pkey];
        let traced = this.getTrace(track);
        if (!traced || !traced.points) return null;
        let profile = buildSpeedProfile(traced.points, preset || {});
        this.profiles[pkey] = profile;
        return profile;
    }

    getDamp(track) {
        let key = track.id || this.trackKey(track);
        return this.learn[key] || [];
    }

    punish(track, idx, amount) {
        let damp = this.getDamp(track);
        if (!damp.length) return;
        let n = damp.length;
        for (let k = 0; k < 12; k++) {
            let i = (idx - k + n) % n;
            damp[i] = Math.max(0.80, damp[i] - amount * (1 - k / 12));
        }
    }

    reward(track, idx, amount) {
        let damp = this.getDamp(track);
        if (!damp.length) return;
        let n = damp.length;
        for (let k = 0; k < 4; k++) {
            let i = (idx + k) % n;
            damp[i] = Math.min(1.14, damp[i] + amount * (1 - k / 5));
        }
    }

    processTrackGeometry(trackId, baselineGrip = 1.7) {
        if (this.processedTracks[trackId] || !this.waypoints[trackId] || this.waypoints[trackId].length === 0) return;

        let pts = this.waypoints[trackId][0];
        let g = 9.81;
        let step = 3;

        for (let i = 0; i < pts.length; i++) {
            let pA = pts[(i - step + pts.length) % pts.length];
            let pB = pts[i];
            let pC = pts[(i + step) % pts.length];

            let a = Math.hypot(pB.x - pC.x, pB.y - pC.y);
            let b = Math.hypot(pA.x - pC.x, pA.y - pC.y);
            let c = Math.hypot(pA.x - pB.x, pA.y - pB.y);

            let area = Math.abs(pA.x * (pB.y - pC.y) + pB.x * (pC.y - pA.y) + pC.x * (pA.y - pB.y)) / 2.0;

            let radius = Infinity;
            let physicsSpeed = 320;

            if (area > 1.0) {
                radius = (a * b * c) / (4.0 * area);
                if (radius > 500) radius = 500;

                physicsSpeed = Math.sqrt(radius * baselineGrip * g) * 3.6;
            }

            pts[i].physicsSpeed = Math.max(20, physicsSpeed);
        }

        let maxDecel = 7.0;

        for (let loop = 0; loop < 2; loop++) {
            for (let i = pts.length - 1; i >= 0; i--) {
                let curr = pts[i];
                let next = pts[(i + 1) % pts.length];
                let dist = Math.hypot(curr.x - next.x, curr.y - next.y);

                let vNextMpS = next.physicsSpeed / 3.6;
                let vCurrMpS = curr.physicsSpeed / 3.6;

                let maxEntrySpeedMpS = Math.sqrt(vNextMpS * vNextMpS + 2 * maxDecel * dist);

                if (vCurrMpS > maxEntrySpeedMpS) {
                    curr.physicsSpeed = maxEntrySpeedMpS * 3.6;
                }
            }
        }

        this.processedTracks[trackId] = true;
    }

    spawnAI(playersObject, trackStartX, trackStartY, trackStartAngle, presetId = 'jaguar') {
        let currentCount = Object.keys(this.aiList).length;
        if (currentCount >= this.maxAI) return null;

        let safePreset = presetId;
        if (typeof vehiclePresets !== 'undefined' && !vehiclePresets[safePreset]) safePreset = 'jaguar';
        if (!safePreset) safePreset = 'jaguar';

        let aiId = 'AI_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let newAI = new AIDriver(aiId);
        newAI.manager = this;
        this.aiList[aiId] = newAI;

        let record;
        if (typeof createPlayerRecord === 'function') {
            record = createPlayerRecord(aiId, safePreset, "[AI] " + newAI.name, newAI.color);
        } else {
            record = {
                id: aiId, name: "[AI] " + newAI.name, presetId: safePreset, color: newAI.color,
                x: trackStartX, y: trackStartY, prevX: trackStartX, prevY: trackStartY,
                vx: 0, vy: 0, angle: trackStartAngle, yawRate: 0,
                gear: 1, rpm: 1000, steer: 0, targetX: trackStartX, targetY: trackStartY, targetAngle: trackStartAngle,
                inputs: { steering: 0, throttle: 0, handbrake: false, driftAssist: true, shiftUp: false, shiftDown: false },
                frontSpinSeverity: 0, rearSpinSeverity: 0, appliesBrake: false, speedKmh: 0, fuel: 100, maxFuel: 100,
                lastSeen: (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0, clutchDump: 0, prevThrottle: 0,
                lap: 0, cp: false, lapStartTime: (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0, currentLapTime: 0, bestLap: Infinity, lastLap: 0, totalTime: 0, finished: false
            };
        }
        record.name = "[AI] " + newAI.name;
        record.presetId = safePreset;
        record.color = newAI.color;
        record.x = trackStartX;
        record.y = trackStartY;
        record.prevX = trackStartX;
        record.prevY = trackStartY;
        record.angle = trackStartAngle;
        record.targetX = trackStartX;
        record.targetY = trackStartY;
        record.targetAngle = trackStartAngle;
        record.isAI = true;
        record.ghostTimer = 0;
        record.isGhost = false;
        if (record.inputs) record.inputs.driftAssist = true;
        playersObject[aiId] = record;
        return aiId;
    }

    removeAI(playersObject, aiId) {
        if (!aiId) return false;
        delete this.aiList[aiId];
        if (playersObject) delete playersObject[aiId];
        return true;
    }

    clearAI(playersObject) {
        for (let aiId in this.aiList) { delete playersObject[aiId]; }
        this.aiList = {};
    }

    updateAll(playersObject, activeTrackId, track, ctx, raceStarted) {
        if (this.driveMode === 'waypoints') this.processTrackGeometry(activeTrackId);
        if (this.driveMode === 'autonomous' && track) {
            if (!track.id) track.id = activeTrackId;
            this.ensureTrace(activeTrackId, track, ctx);
        }

        let trackLines = this.waypoints[activeTrackId] || [];
        for (let aiId in this.aiList) {
            let aiLogic = this.aiList[aiId];
            let vehicleData = playersObject[aiId];
            if (!aiLogic.manager) aiLogic.manager = this;

            if (vehicleData) {
                if (!vehicleData.finished) {
                    if (aiLogic.lineIndex === null || trackLines.length === 0) {
                        aiLogic.lineIndex = trackLines.length > 0 ? Math.floor(Math.random() * trackLines.length) : 0;
                    }

                    let assignedLine = trackLines[aiLogic.lineIndex] || [];

                    vehicleData.inputs = aiLogic.calculateInputs(vehicleData, assignedLine, playersObject, track, ctx, raceStarted, typeof vehiclePresets !== 'undefined' ? vehiclePresets : {}, this.useDynamicSpeed);
                } else {
                    vehicleData.inputs = { steering: 0, throttle: -1, handbrake: true, driftAssist: false, shiftUp: false, shiftDown: false };
                }
                vehicleData.lastSeen = (typeof performance !== 'undefined' && performance.now) ? performance.now() : 0;
            }
        }
    }
}

const aiManager = new AIManager();

if (typeof globalThis !== 'undefined') {
    globalThis.AIAutonomous = AIAutonomous;
    globalThis.AIDriver = AIDriver;
    globalThis.AIManager = AIManager;
}

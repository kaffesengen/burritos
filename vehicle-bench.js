window.vehicleBench = {
    dt: 1 / 120,
    maxTime: 45,
    defaultGears: [0, 3.5, 2.2, 1.6, 1.2, 0.9],
    defaultFinalDrive: 3.8,
    cache: {},

    aeroDrag(pre) {
        if (pre.type === 'gokart') return 0.70;
        if (pre.type === 'f1') return 0.85;
        return 0.45;
    },

    wheelRadius(pre) {
        return pre.type === 'gokart' ? 0.14 : 0.32;
    },

    shiftDelay(pre) {
        if (pre.type === 'gokart') return 0.02;
        if (pre.type === 'f1') return 0.05;
        return 0.15;
    },

    torqueVal(pre, rpm, maxRpm, isRevLimiting, isGx390, isRaceKart, isGokart) {
        let aPower = pre.power;
        if (isRevLimiting) return -aPower * 0.4;
        if (isGx390) {
            let r = rpm / maxRpm;
            let tqMul;
            if (isRaceKart) {
                if (r < 0.35) tqMul = 0.45;
                else if (r < 0.75) tqMul = 0.45 + ((r - 0.35) / 0.40) * 0.75;
                else tqMul = 1.20 - ((r - 0.75) / 0.25) * 0.30;
            } else {
                if (r < 0.7) tqMul = 1.00;
                else tqMul = 1.00 - ((r - 0.7) / 0.30) * 0.30;
            }
            return aPower * 1.9 * tqMul;
        }
        if (isGokart) {
            let tqMul = 0;
            if (rpm < 6000) tqMul = 0.25;
            else if (rpm < 9000) tqMul = 0.25 + ((rpm - 6000) / 3000) * 0.35;
            else if (rpm < 12000) tqMul = 0.60 + Math.pow((rpm - 9000) / 3000, 1.5) * 0.40;
            else if (rpm < 14000) tqMul = 1.0 - ((rpm - 12000) / 2000) * 0.8;
            else tqMul = 0.1;
            return aPower * 1.9 * tqMul;
        }
        if (pre.audio === 'turbo' || pre.audio === 'rotary') {
            return aPower * (rpm < 4000 ? 0.6 : 2.5 * Math.max(0.1, 1.0 - Math.pow((rpm - 6500) / 3000, 2)));
        }
        if (pre.audio === 'v8' || pre.audio === 'v10') {
            return aPower * 2.2 * Math.max(0.1, 1.0 - Math.pow((rpm - 5000) / 4500, 2));
        }
        return aPower * 2.0 * Math.max(0.1, 1.0 - Math.pow((rpm - 6000) / 3500, 2));
    },

    step(pre, s, dt) {
        let isGokart = pre.type === 'gokart';
        let isRaceKart = pre.sprite === 'kartrace';
        let isGx390 = isRaceKart || pre.sprite === 'kartrent';
        let maxRpm = pre.maxRPM || (isGokart ? 14000 : 7500);
        let gears = pre.gears || this.defaultGears;
        let finalDrive = pre.finalDrive || this.defaultFinalDrive;
        let wheelR = this.wheelRadius(pre);
        let maxGears = gears.length - 1;
        let aMass = pre.mass;
        let aPower = pre.power;
        let aero = this.aeroDrag(pre);
        let roll = pre.roll ?? 0.04;
        let surfaceMu = pre.grip;
        let gasPedal = 1;
        let lVx = s.lVx;
        let speedKmh = Math.abs(lVx * 3.6) || 0;
        let dForce = 0;

        if (s.shiftTimer > 0) s.shiftTimer -= dt;

        if (pre.ev) {
            if (s.gear === 0) s.gear = 1;
            if (s.gear === 0) {
                s.rpm += (1000 - s.rpm) * 12 * dt;
            } else {
                s.rpm += (speedKmh * 80 - s.rpm) * 12 * dt;
                if (s.rpm > maxRpm) s.rpm = maxRpm;
                let powerMod = Math.max(0.0, 1.0 - Math.pow(s.rpm / maxRpm, 2));
                dForce = (aPower * 735.5 * 0.85 / Math.max(Math.abs(lVx), 5.0)) * gasPedal * powerMod;
            }
        } else {
            if (s.gear >= 1) {
                let upRpm = maxRpm * 0.88;
                let downRpm = maxRpm * 0.40;
                let wheelSpeedRpm = (speedKmh / 3.6) / wheelR * 9.55;
                if (s.rpm > upRpm && s.gear < maxGears && s.shiftTimer <= 0 && gasPedal > 0.1) {
                    let nextRatio = gears[s.gear + 1];
                    let nextRpm = 1000 + wheelSpeedRpm * nextRatio * finalDrive;
                    if (nextRpm > maxRpm * 0.38) {
                        s.gear++;
                        s.shiftTimer = this.shiftDelay(pre) + 0.2;
                    }
                } else if (s.rpm < downRpm && s.gear > 1 && s.shiftTimer <= 0) {
                    let nextRatio = gears[s.gear - 1];
                    let currRatio = gears[s.gear];
                    let expectedRpm = s.rpm * (nextRatio / currRatio);
                    if (expectedRpm < maxRpm - 500) {
                        s.gear--;
                        s.shiftTimer = this.shiftDelay(pre) + 0.1;
                    }
                }
            }

            let targetRpm = 1000;
            if (s.gear === 0) {
                targetRpm = 1000 + gasPedal * (maxRpm - 1000);
            } else {
                let wheelSpeedRpm = (speedKmh / 3.6) / wheelR * 9.55;
                let activeRatio = gears[s.gear] || gears[1];
                targetRpm = 1000 + wheelSpeedRpm * activeRatio * finalDrive;
                if (isGx390 && gasPedal > 0 && s.gear > 0) {
                    let biteRpm = (isRaceKart ? 3200 : 1800) + gasPedal * (isRaceKart ? 600 : 300);
                    if (targetRpm < biteRpm) targetRpm = biteRpm;
                } else if (isGokart && gasPedal > 0 && speedKmh < 60 && s.gear > 0) {
                    let slipRpm = maxRpm * 0.75 + (gasPedal * maxRpm * 0.142857);
                    if (targetRpm < slipRpm) targetRpm = slipRpm;
                } else if (speedKmh < 10 && gasPedal > 0) {
                    targetRpm += gasPedal * (maxRpm * 0.6) * (1 - speedKmh / 10);
                }
            }

            if (s.shiftTimer > 0 && s.gear !== 0) {
                s.rpm += gasPedal * 10000 * dt;
                targetRpm = s.rpm;
            }

            s.rpm += (targetRpm - s.rpm) * (isGokart ? 20 : 10) * dt;

            let isRevLimiting = false;
            if (s.rpm > maxRpm) {
                s.rpm = maxRpm - 225;
                isRevLimiting = true;
            }

            if (s.gear !== 0 && s.shiftTimer <= 0) {
                let torqueVal = this.torqueVal(pre, s.rpm, maxRpm, isRevLimiting, isGx390, isRaceKart, isGokart);
                let activeRatio = gears[s.gear] || gears[1];
                dForce = (torqueVal * activeRatio * finalDrive / wheelR);
                if (!isRevLimiting) dForce *= gasPedal;
                if (s.clutchDump > 0 && !isRevLimiting) {
                    dForce *= (1.0 + s.clutchDump * 3.5);
                    s.clutchDump -= dt * 2.5;
                }
            }
            if (s.clutchDump < 0) s.clutchDump = 0;
        }

        if (pre.drivetrain === 'RWD' && gasPedal > 0 && speedKmh > 5 && s.rearSpin > 0.15) {
            dForce *= (1.0 - Math.min(0.85, (s.rearSpin - 0.15) * 2.5));
        }

        let maxGrip = (aMass * 9.81 / 2) * surfaceMu;
        let fLongF = pre.drivetrain === 'FWD' ? dForce : (pre.drivetrain === 'AWD' ? dForce * 0.5 : 0);
        let fLongR = pre.drivetrain === 'RWD' ? dForce : (pre.drivetrain === 'AWD' ? dForce * 0.5 : 0);
        fLongF = Math.max(-maxGrip, Math.min(maxGrip, fLongF)) || 0;
        fLongR = Math.max(-maxGrip, Math.min(maxGrip, fLongR)) || 0;

        let fX = fLongF + fLongR - aero * lVx * Math.abs(lVx) - roll * aMass * 9.81 * Math.sign(lVx) * 0.1;
        s.lVx += (fX / aMass) * dt;
        s.rearSpin = Math.abs(fLongR) / maxGrip > 0.95 ? 1.0 : 0;
        s.speedKmh = Math.abs(s.lVx * 3.6) || 0;
        return s;
    },

    run(pre) {
        if (!pre) return { t100: null, vmax: 0 };
        let s = { lVx: 0, rpm: 1000, gear: 1, shiftTimer: 0, clutchDump: 0, rearSpin: 0, speedKmh: 0 };
        let t100 = null;
        let vmax = 0;
        let markSpeed = 0;
        let markTime = 0;
        let flatSec = 0;
        let t = 0;
        let dt = this.dt;
        let steps = Math.ceil(this.maxTime / dt);

        for (let i = 0; i < steps; i++) {
            this.step(pre, s, dt);
            t += dt;
            if (s.speedKmh > vmax) vmax = s.speedKmh;
            if (t100 == null && s.speedKmh >= 100) t100 = t;
            if (t - markTime >= 1) {
                if (s.speedKmh - markSpeed < 0.5) flatSec += 1;
                else flatSec = 0;
                markSpeed = s.speedKmh;
                markTime = t;
                if (flatSec >= 2 && t > 4) break;
            }
        }

        return {
            t100: t100 == null ? null : Math.round(t100 * 100) / 100,
            vmax: Math.round(vmax)
        };
    },

    result(id, presets) {
        let store = presets || (typeof window !== 'undefined' ? window.vehiclePresets : null);
        if (!store || !store[id]) return { t100: null, vmax: 0 };
        if (this.cache[id]) return this.cache[id];
        this.cache[id] = this.run(store[id]);
        return this.cache[id];
    }
};

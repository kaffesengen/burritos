const aiNames = [
    "Evan king", "Liamcho", "Emmacho", "Elenamoren", "Joar Politi", "Jarl", "Martin", "Renate", "Harald",
    "Åshild", "Hugo", "Charlie", "Nando", "Willy", "Linn", "Elisei", "Mario", "Maxi", "Miggi", "Mia",
    "Kristoffer", "Esther", "Egon", "Skjeggefant", "Eggemann"
];

class AIDriver {
    constructor(id) {
        this.kp = 0.8; 
        this.kd = 0.35; 
        this.prevSteerError = 0;
        
        this.id = id;
        this.name = aiNames[Math.floor(Math.random() * aiNames.length)];
        this.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        this.lineIndex = null;
        
        this.stuckTime = 0;
        this.reverseTime = 0;
        this.failsafeTimer = 0;
        this.recoveryTime = 0;
        this.recoverySteer = 0;
        this.lastUpdate = performance.now();

        this.lateralOffset = 0; 
        this.targetOffset = 0;
        this.overtakeTimer = 0;
        this.draftBoost = 0;
        this.aggression = 0.5 + Math.random() * 0.5;
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
    
    calculateInputs(vehicle, trackWaypoints, allPlayers, track, ctx, raceStarted, vehiclePresets, useDynamicSpeed = true) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true, shiftUp: false, shiftDown: false };
        let now = performance.now();
        let dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;
        
        let timeSinceStart = (raceStarted && vehicle.lap === 0) ? (now - vehicle.lapStartTime) : 99999;

        if (vehicle.ghostTimer > 0) {
            vehicle.ghostTimer -= dt;
            vehicle.isGhost = true;
        } else {
            vehicle.isGhost = false;
        }

        if (!trackWaypoints || trackWaypoints.length === 0) return inputs;

        // --- STARTSTREK-LOGIKK (Før grønt lys) ---
        if (!raceStarted) {
            inputs.throttle = 1.0; 
            if (vehicle.gear > 0) inputs.shiftDown = true;
            inputs.handbrake = true; 
            return inputs;
        }

        let preset = vehiclePresets[vehicle.presetId] || vehiclePresets['ai_standard'];
        let maxRpm = preset.maxRPM || 7500;

        // --- HARD RESET FAILSAFE ---
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

        // --- AKTIV RECOVERY (Rygge) ---
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
            let angleDiff = targetAngle - vehicle.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
            
            inputs.steering = angleDiff > 0 ? -1.0 : 1.0; 
            this.recoveryTime = 2.0;
            return inputs;
        }

        // --- MANUELL GIRING ---
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

        // --- FASE 1 AVLESNING ---
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
        
        // --- FORBIKJØRINGSLOGIKK & KLYNGE ---
        let sideClearance = { left: true, right: true };
        this.draftBoost = 0;
        let minSpeedAhead = Infinity;
        let isBrakingZone = (baseSpeed < vehicle.speedKmh - 20); 

        if (this.overtakeTimer > 0) {
            this.overtakeTimer -= dt;
        } else {
            this.targetOffset = 0;
        }

        for (let otherId in allPlayers) {
            if (otherId === this.id) continue;
            let otherCar = allPlayers[otherId];
            if (otherCar.finished || otherCar.isGhost) continue;

            let dist = Math.hypot(otherCar.x - vehicle.x, otherCar.y - vehicle.y);
            if (dist > 250) continue;

            let angleToOther = Math.atan2(otherCar.y - vehicle.y, otherCar.x - vehicle.x);
            let angleDiff = angleToOther - vehicle.angle;
            while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
            while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

            if (dist < 80 && Math.abs(angleDiff) > 1.0) {
                if (angleDiff > 0) sideClearance.right = false;
                else sideClearance.left = false;
            }

            if (Math.abs(angleDiff) < 0.4 && dist < 150) {
                if (dist > 40) {
                    this.draftBoost = 15;
                }

                if (Math.abs(angleDiff) < 0.25 && dist < 25) {
                    minSpeedAhead = Math.min(minSpeedAhead, otherCar.speedKmh);
                }

                if (dist < 90 && vehicle.speedKmh > otherCar.speedKmh - 5 && this.overtakeTimer <= 0 && !isBrakingZone) {
                    this.overtakeTimer = 3.0; 
                    let offsetAmount = 35; 
                    if (sideClearance.left && !sideClearance.right) this.targetOffset = -offsetAmount;
                    else if (sideClearance.right && !sideClearance.left) this.targetOffset = offsetAmount;
                    else {
                        this.targetOffset = (Math.random() > 0.5) ? offsetAmount : -offsetAmount;
                    }
                }
            }
        }

        if (this.targetOffset < 0 && !sideClearance.right) this.overtakeTimer = 1.0;
        if (this.targetOffset > 0 && !sideClearance.left) this.overtakeTimer = 1.0;

        this.lateralOffset += (this.targetOffset - this.lateralOffset) * 2.0 * dt;

        // --- FASE 2: PURE PURSUIT & PD-STYRING ---
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
        let angleDiffSteer = targetAimAngle - vehicle.angle;
        
        while (angleDiffSteer > Math.PI) angleDiffSteer -= Math.PI * 2;
        while (angleDiffSteer < -Math.PI) angleDiffSteer += Math.PI * 2;

        if (this.recoveryTime > 0) {
            this.recoveryTime -= dt;
            angleDiffSteer += this.recoverySteer;
        }

        let derivative = angleDiffSteer - this.prevSteerError;
        this.prevSteerError = angleDiffSteer;
        let rawSteer = (this.kp * angleDiffSteer) + (this.kd * derivative);

        inputs.steering = Math.max(-1.0, Math.min(1.0, rawSteer));

        // --- PREVENTIV UNNVIKELSE (Whiskers) ---
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

        // --- FASE 3 & 4: KINEMATISK BREMS OG KAMM-SIRKEL ---
        let maxSafeSpeed = baseSpeed + this.draftBoost + (this.aggression * 5);
        
        // Ignorerer avstandsregelen de første 4 sekundene
        if (timeSinceStart > 4000) {
            maxSafeSpeed = Math.min(maxSafeSpeed, minSpeedAhead);
        }

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

        // --- STUCK-DETEKSJON ---
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
}

class AIManager {
    constructor() {
        this.aiList = {};
        this.maxAI = 20;
        this.waypoints = typeof aiManagerWaypoints !== 'undefined' ? aiManagerWaypoints : {}; 
        this.processedTracks = {};
        
        this.useDynamicSpeed = true; 
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
                lastSeen: performance.now(), clutchDump: 0, prevThrottle: 0,
                lap: 0, cp: false, lapStartTime: performance.now(), currentLapTime: 0, bestLap: Infinity, lastLap: 0, totalTime: 0, finished: false
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
        this.processTrackGeometry(activeTrackId);

        let trackLines = this.waypoints[activeTrackId] || [];
        for (let aiId in this.aiList) {
            let aiLogic = this.aiList[aiId];
            let vehicleData = playersObject[aiId];

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
                vehicleData.lastSeen = performance.now();
            }
        }
    }
}

const aiManager = new AIManager();

const aiNames = [
    "Maverick", "Viper", "Iceman", "Goose", "Jester", "Cougar", "Wolfman", "Slider", "Merlin", "Sundown",
    "Hollywood", "Wolf", "Ghost", "Shadow", "Raven", "Phoenix", "Hawk", "Eagle", "Falcon", "Hunter",
    "Striker", "Racer", "Turbo", "Nitro", "Boost", "Drifter", "Skid", "Burnout", "Clutch", "Apex"
];

const aiVehiclePreset = { 
    power: 350, mass: 1400, drivetrain: 'AWD', grip: 2.10, turn: 4.8, roll: 0.04, w: 20, l: 45, ev: false, type: 'r34', fuelCap: 100 
};

class AIDriver {
    constructor(id) {
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
    }

    calculateInputs(vehicle, trackWaypoints, allPlayers, track, ctx, raceStarted) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true };
        let now = performance.now();
        let dt = (now - this.lastUpdate) / 1000;
        this.lastUpdate = now;

        if (vehicle.ghostTimer > 0) {
            vehicle.ghostTimer -= dt;
            vehicle.isGhost = true;
        } else {
            vehicle.isGhost = false;
        }

        if (!trackWaypoints || trackWaypoints.length === 0) return inputs;

        // Trinn 3: Sømløs Failsafe (Hard Reset)
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
                
                vehicle.ghostTimer = 2.0; 
                this.failsafeTimer = 0;
                this.stuckTime = 0;
                this.reverseTime = 0;
                return inputs;
            }
        } else if (vehicle.speedKmh > 10.0) {
            this.failsafeTimer = 0;
        }

        // Trinn 2.1: Gjennomføring av aktiv recovery (Korrektiv rygging)
        if (this.reverseTime > 0) {
            this.reverseTime -= dt;
            inputs.throttle = -1.0;
            
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

        // Veipunkt-Navigasjon
        let closestDist = Infinity; let closestIdx = 0;
        for (let i = 0; i < trackWaypoints.length; i++) {
            let dist = Math.hypot(vehicle.x - trackWaypoints[i].x, vehicle.y - trackWaypoints[i].y);
            if (dist < closestDist) { closestDist = dist; closestIdx = i; }
        }

        let lookAheadOffset = 3 + Math.floor(vehicle.speedKmh / 15); 
        let targetIdx = (closestIdx + lookAheadOffset) % trackWaypoints.length;
        let targetPt = trackWaypoints[targetIdx];

        let targetAngle = Math.atan2(targetPt.y - vehicle.y, targetPt.x - vehicle.x);
        let angleDiff = targetAngle - vehicle.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        if (this.recoveryTime > 0) {
            this.recoveryTime -= dt;
            angleDiff += this.recoverySteer;
        }

        inputs.steering = Math.max(-1.0, Math.min(1.0, angleDiff * 3.0));

        let brakeCheckOffset = Math.floor(vehicle.speedKmh / 5);
        let upcomingTarget = trackWaypoints[(closestIdx + brakeCheckOffset) % trackWaypoints.length];
        let maxSafeSpeed = upcomingTarget.targetSpeed;

        if (vehicle.speedKmh > maxSafeSpeed + 10) inputs.throttle = -1.0; 
        else if (vehicle.speedKmh > maxSafeSpeed) inputs.throttle = -0.5;
        else {
            inputs.throttle = 1.0;
            if (Math.abs(inputs.steering) > 0.6) inputs.throttle = 0.4;
        }

        // Trinn 1: Preventiv Unnvikelse (Raycast Whiskers)
        if (track && ctx && track.path) {
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
            }
        }

        // Trinn 2.0: Deteksjon av manglende fremdrift
        if (raceStarted && vehicle.speedKmh < 4.0 && inputs.throttle > 0) {
            this.stuckTime += dt;
            if (this.stuckTime > 0.8) {
                this.reverseTime = 1.2;
                this.stuckTime = 0;
                this.recoverySteer = (Math.random() > 0.5 ? 1.5 : -1.5);
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
        this.waypoints = {}; // Settes til et tomt objekt her, fylles deretter av waypoints.js
    }

    spawnAI(playersObject, trackStartX, trackStartY, trackStartAngle) {
        let currentCount = Object.keys(this.aiList).length;
        if (currentCount >= this.maxAI) return;

        let aiId = 'AI_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let newAI = new AIDriver(aiId);
        this.aiList[aiId] = newAI;

        playersObject[aiId] = {
            id: aiId, name: "[AI] " + newAI.name, presetId: 'ai_standard', color: newAI.color,
            x: trackStartX, y: trackStartY, prevX: trackStartX, prevY: trackStartY,
            vx: 0, vy: 0, angle: trackStartAngle, yawRate: 0,
            gear: 1, rpm: 1000, steer: 0, targetX: trackStartX, targetY: trackStartY, targetAngle: trackStartAngle,
            inputs: { steering: 0, throttle: 0, handbrake: false, driftAssist: true },
            frontSpinSeverity: 0, rearSpinSeverity: 0, appliesBrake: false, speedKmh: 0, fuel: 100, maxFuel: 100,
            lastSeen: performance.now(), clutchDump: 0, prevThrottle: 0,
            lap: 0, cp: false, lapStartTime: performance.now(), currentLapTime: 0, bestLap: Infinity, totalTime: 0, finished: false,
            isAI: true,
            ghostTimer: 0,
            isGhost: false
        };
    }

    clearAI(playersObject) {
        for (let aiId in this.aiList) {
            delete playersObject[aiId];
        }
        this.aiList = {};
    }

    updateAll(playersObject, activeTrackId, track, ctx, raceStarted) {
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
                    vehicleData.inputs = aiLogic.calculateInputs(vehicleData, assignedLine, playersObject, track, ctx, raceStarted);
                } else {
                    vehicleData.inputs = { steering: 0, throttle: -1, handbrake: true, driftAssist: false };
                }
                vehicleData.lastSeen = performance.now();
            }
        }
    }
}

const aiManager = new AIManager();

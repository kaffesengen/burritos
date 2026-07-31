// Liste med 100 tilfeldige navn for AI-sjåfører
const aiNames = [
    "Maverick", "Viper", "Iceman", "Goose", "Jester", "Cougar", "Wolfman", "Slider", "Merlin", "Sundown",
    "Hollywood", "Wolf", "Ghost", "Shadow", "Raven", "Phoenix", "Hawk", "Eagle", "Falcon", "Hunter",
    "Striker", "Racer", "Turbo", "Nitro", "Boost", "Drifter", "Skid", "Burnout", "Clutch", "Apex",
    "Vector", "Velocity", "Dash", "Rush", "Blitz", "Flash", "Spark", "Bolt", "Thunder", "Storm",
    "Blade", "Edge", "Spike", "Fang", "Claw", "Rex", "Titan", "Goliath", "Colossus", "Hulk",
    "Crusher", "Smasher", "Bruiser", "Brawler", "Fighter", "Warrior", "Knight", "Paladin", "Ranger", "Scout",
    "Sniper", "Shooter", "Gunner", "Bomber", "Tank", "Dozer", "Grinder", "Shredder", "Ripper", "Slasher",
    "Phantom", "Spectre", "Wraith", "Banshee", "Demon", "Devil", "Fiend", "Beast", "Monster", "Mutant",
    "Cyborg", "Robot", "Droid", "Mech", "Engine", "Motor", "Piston", "Rotor", "Gear", "Cog",
    "Wheel", "Tire", "Axle", "Shaft", "Valve", "Sparkplug", "Wire", "Cable", "Circuit", "Chip"
];

// Optimalisert fysikk-preset for AI (Nøytral og forutsigbar balanse)
const aiVehiclePreset = { 
    power: 350, mass: 1400, drivetrain: 'AWD', grip: 2.10, turn: 4.8, roll: 0.04, w: 20, l: 45, ev: false, type: 'r34', fuelCap: 100 
};

// Logikken for én enkelt AI-bil
class AIDriver {
    constructor(id) {
        this.id = id;
        this.name = aiNames[Math.floor(Math.random() * aiNames.length)];
        this.color = '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0');
        
        // PID-variabler for fremtidig navigasjon
        this.lookAheadDistance = 15.0; // Meter foran bilen AI-en ser
        this.targetSpeed = 0;
    }

    /**
     * Beregner input for AI-en. Kalles av oppdateringsløkken i app.js
     * @param {Object} vehicle - Fysikkobjektet fra app.js
     * @param {Array} trackWaypoints - Array med X/Y koordinater for idealsporet
     * @returns {Object} { steering, throttle, handbrake, driftAssist }
     */
    calculateInputs(vehicle, trackWaypoints) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true }; // AI bruker Drift Assist for stabilitet

        if (!trackWaypoints || trackWaypoints.length === 0) {
            // Hvis ingen bane er lastet inn (eller ingen rute er spilt inn), stå i ro.
            inputs.throttle = 0;
            inputs.steering = 0;
            return inputs;
        }

        // --- FASE 2: Navigasjons- og styringslogikk kommer her ---
        // 1. Finn nærmeste veipunkt.
        // 2. Finn veipunktet som er X meter foran (Look-ahead).
        // 3. Beregn vinkelforskjell og sett 'inputs.steering'.
        // 4. Sammenlign nåværende hastighet med veipunktets 'targetSpeed' og sett 'inputs.throttle'.

        return inputs;
    }
}

// Styrer inntil 4 AI-biler
class AIManager {
    constructor() {
        this.aiList = {}; // Inneholder AIDriver-instanser
        this.maxAI = 4;
        this.waypoints = {}; // Vil holde lagrede ruter: { 'monza': [{x,y,speed}, ...] }
    }

    // Legger til en AI hvis det er plass
    spawnAI(playersObject, trackStartX, trackStartY, trackStartAngle) {
        let currentCount = Object.keys(this.aiList).length;
        if (currentCount >= this.maxAI) {
            console.log("Maks antall AI-biler (4) er nådd.");
            return;
        }

        let aiId = 'AI_' + Date.now() + '_' + Math.floor(Math.random() * 1000);
        let newAI = new AIDriver(aiId);
        this.aiList[aiId] = newAI;

        // Opprett spiller-recorden i hovedspillet
        playersObject[aiId] = {
            id: aiId, name: "[AI] " + newAI.name, presetId: 'ai_standard', color: newAI.color,
            x: trackStartX, y: trackStartY, prevX: trackStartX, prevY: trackStartY,
            vx: 0, vy: 0, angle: trackStartAngle, yawRate: 0,
            gear: 1, rpm: 1000, steer: 0, targetX: trackStartX, targetY: trackStartY, targetAngle: trackStartAngle,
            inputs: { steering: 0, throttle: 0, handbrake: false, driftAssist: true },
            frontSpinSeverity: 0, rearSpinSeverity: 0, appliesBrake: false, speedKmh: 0, fuel: 100, maxFuel: 100,
            lastSeen: performance.now(), clutchDump: 0, prevThrottle: 0,
            lap: 0, cp: false, lapStartTime: performance.now(), currentLapTime: 0, bestLap: Infinity, totalTime: 0, finished: false,
            isAI: true
        };

        console.log(`AI Spawned: ${newAI.name}`);
    }

    // Fjerner alle AI
    clearAI(playersObject) {
        for (let aiId in this.aiList) {
            delete playersObject[aiId];
        }
        this.aiList = {};
    }

    // Kjøres hver frame fra app.js for å gi AI-ene gass/styring
    updateAll(playersObject, activeTrackId) {
        let currentWaypoints = this.waypoints[activeTrackId] || [];

        for (let aiId in this.aiList) {
            let aiLogic = this.aiList[aiId];
            let vehicleData = playersObject[aiId];

            if (vehicleData && !vehicleData.finished) {
                // Kalkuler og overskriv inputs
                vehicleData.inputs = aiLogic.calculateInputs(vehicleData, currentWaypoints);
            }
        }
    }
}

// Global instans
const aiManager = new AIManager();

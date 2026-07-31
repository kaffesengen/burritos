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
    }

    /**
     * Beregner input for AI-en. Kalles av oppdateringsløkken i app.js
     * @param {Object} vehicle - Fysikkobjektet fra app.js
     * @param {Array} trackWaypoints - Array med X/Y koordinater for idealsporet
     * @returns {Object} { steering, throttle, handbrake, driftAssist }
     */
    calculateInputs(vehicle, trackWaypoints) {
        let inputs = { steering: 0, throttle: 0, handbrake: false, driftAssist: true };

        if (!trackWaypoints || trackWaypoints.length === 0) {
            inputs.throttle = 0; inputs.steering = 0; return inputs;
        }

        // 1. Finn nærmeste veipunkt (Hvor er vi på banen?)
        let closestDist = Infinity;
        let closestIdx = 0;
        for (let i = 0; i < trackWaypoints.length; i++) {
            let dist = Math.hypot(vehicle.x - trackWaypoints[i].x, vehicle.y - trackWaypoints[i].y);
            if (dist < closestDist) {
                closestDist = dist;
                closestIdx = i;
            }
        }

        // 2. Look-ahead (Sikt fremover)
        // Redusert sikteavstand for å unngå at svinger kuttes.
        // Endret fra /8 til /15 for et strammere og kortere sikte.
        let lookAheadOffset = 3 + Math.floor(vehicle.speedKmh / 15); 
        let targetIdx = (closestIdx + lookAheadOffset) % trackWaypoints.length;
        let targetPt = trackWaypoints[targetIdx];

        // 3. Styring (Kalkuler vinkelen til targetPt)
        let dx = targetPt.x - vehicle.x;
        let dy = targetPt.y - vehicle.y;
        let targetAngle = Math.atan2(dy, dx);
        
        // Normaliser vinkelforskjellen
        let angleDiff = targetAngle - vehicle.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Økt styresensitivitet fra 2.0 til 3.0 for mer aggressiv innstyring
        inputs.steering = Math.max(-1.0, Math.min(1.0, angleDiff * 3.0));

        // 4. Farts- og bremsekontroll
        // Se litt frem i tid for å sjekke om vi må bremse for en sving
        let brakeCheckOffset = Math.floor(vehicle.speedKmh / 5); // Leser lenger frem i høye hastigheter
        let upcomingTarget = trackWaypoints[(closestIdx + brakeCheckOffset) % trackWaypoints.length];
        let maxSafeSpeed = upcomingTarget.targetSpeed;

        if (vehicle.speedKmh > maxSafeSpeed + 10) {
            // Panikkbrems / Hard brems
            inputs.throttle = -1.0; 
        } else if (vehicle.speedKmh > maxSafeSpeed) {
            // Lett brems for å justere fart
            inputs.throttle = -0.5;
        } else {
            // Akselerer
            inputs.throttle = 1.0;
            
            // Unngå full gass mens rattet er i ekstrem posisjon (hindrer spinout)
            if (Math.abs(inputs.steering) > 0.6) {
                inputs.throttle = 0.4;
            }
        }

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
                
                // LØSNING: Oppdater tidsstempelet slik at app.js ikke sletter bilen
                vehicleData.lastSeen = performance.now();
            }
        }
    }
}

// Global instans
const aiManager = new AIManager();

// Lagrede baner (Lim inn dine opptak her)
aiManager.waypoints['standard'] = [{"x":2160,"y":3240,"targetSpeed":15},{"x":2130,"y":3240,"targetSpeed":27},{"x":2098,"y":3240,"targetSpeed":42},{"x":2065,"y":3240,"targetSpeed":55},{"x":2032,"y":3240,"targetSpeed":63},{"x":1998,"y":3240,"targetSpeed":68},{"x":1966,"y":3240,"targetSpeed":74},{"x":1932,"y":3240,"targetSpeed":79},{"x":1900,"y":3240,"targetSpeed":83},{"x":1867,"y":3240,"targetSpeed":87},{"x":1836,"y":3240,"targetSpeed":91},{"x":1805,"y":3240,"targetSpeed":94},{"x":1773,"y":3240,"targetSpeed":97},{"x":1741,"y":3240,"targetSpeed":100},{"x":1707,"y":3240,"targetSpeed":102},{"x":1672,"y":3240,"targetSpeed":105},{"x":1636,"y":3240,"targetSpeed":108},{"x":1606,"y":3240,"targetSpeed":110},{"x":1575,"y":3240,"targetSpeed":112},{"x":1542,"y":3240,"targetSpeed":114},{"x":1511,"y":3240,"targetSpeed":116},{"x":1478,"y":3240,"targetSpeed":119},{"x":1445,"y":3240,"targetSpeed":121},{"x":1411,"y":3240,"targetSpeed":123},{"x":1376,"y":3240,"targetSpeed":125},{"x":1342,"y":3240,"targetSpeed":125},{"x":1307,"y":3240,"targetSpeed":125},{"x":1272,"y":3240,"targetSpeed":125},{"x":1237,"y":3240,"targetSpeed":125},{"x":1203,"y":3239,"targetSpeed":124},{"x":1169,"y":3237,"targetSpeed":124},{"x":1134,"y":3234,"targetSpeed":124},{"x":1100,"y":3231,"targetSpeed":124},{"x":1066,"y":3228,"targetSpeed":122},{"x":1033,"y":3225,"targetSpeed":122},{"x":999,"y":3222,"targetSpeed":121},{"x":965,"y":3219,"targetSpeed":121},{"x":932,"y":3216,"targetSpeed":120},{"x":899,"y":3214,"targetSpeed":120},{"x":866,"y":3211,"targetSpeed":120},{"x":832,"y":3208,"targetSpeed":120},{"x":800,"y":3205,"targetSpeed":119},{"x":767,"y":3202,"targetSpeed":118},{"x":734,"y":3199,"targetSpeed":118},{"x":702,"y":3194,"targetSpeed":117},{"x":670,"y":3187,"targetSpeed":117},{"x":639,"y":3178,"targetSpeed":116},{"x":609,"y":3168,"targetSpeed":115},{"x":579,"y":3156,"targetSpeed":114},{"x":551,"y":3143,"targetSpeed":112},{"x":524,"y":3128,"targetSpeed":111},{"x":499,"y":3111,"targetSpeed":109},{"x":474,"y":3093,"targetSpeed":108},{"x":447,"y":3071,"targetSpeed":105},{"x":422,"y":3047,"targetSpeed":103},{"x":400,"y":3022,"targetSpeed":100},{"x":379,"y":2997,"targetSpeed":97},{"x":361,"y":2970,"targetSpeed":95},{"x":346,"y":2943,"targetSpeed":92},{"x":331,"y":2912,"targetSpeed":90},{"x":319,"y":2880,"targetSpeed":87},{"x":311,"y":2848,"targetSpeed":84},{"x":306,"y":2816,"targetSpeed":81},{"x":304,"y":2785,"targetSpeed":79},{"x":306,"y":2751,"targetSpeed":76},{"x":313,"y":2718,"targetSpeed":74},{"x":323,"y":2687,"targetSpeed":74},{"x":335,"y":2656,"targetSpeed":77},{"x":347,"y":2628,"targetSpeed":80},{"x":360,"y":2599,"targetSpeed":83},{"x":373,"y":2568,"targetSpeed":86},{"x":386,"y":2536,"targetSpeed":89},{"x":398,"y":2508,"targetSpeed":92},{"x":411,"y":2480,"targetSpeed":95},{"x":427,"y":2451,"targetSpeed":98},{"x":445,"y":2423,"targetSpeed":100},{"x":463,"y":2394,"targetSpeed":103},{"x":481,"y":2365,"targetSpeed":106},{"x":497,"y":2340,"targetSpeed":108},{"x":514,"y":2314,"targetSpeed":110},{"x":530,"y":2287,"targetSpeed":112},{"x":547,"y":2260,"targetSpeed":115},{"x":565,"y":2234,"targetSpeed":117},{"x":584,"y":2207,"targetSpeed":119},{"x":605,"y":2181,"targetSpeed":121},{"x":626,"y":2154,"targetSpeed":123},{"x":647,"y":2126,"targetSpeed":125},{"x":668,"y":2099,"targetSpeed":127},{"x":690,"y":2071,"targetSpeed":129},{"x":712,"y":2042,"targetSpeed":130},{"x":734,"y":2013,"targetSpeed":132},{"x":758,"y":1985,"targetSpeed":133},{"x":778,"y":1962,"targetSpeed":135},{"x":803,"y":1934,"targetSpeed":136},{"x":823,"y":1911,"targetSpeed":137},{"x":845,"y":1890,"targetSpeed":138},{"x":868,"y":1869,"targetSpeed":140},{"x":891,"y":1848,"targetSpeed":140},{"x":914,"y":1827,"targetSpeed":139},{"x":937,"y":1806,"targetSpeed":139},{"x":960,"y":1786,"targetSpeed":139},{"x":982,"y":1766,"targetSpeed":135},{"x":1010,"y":1741,"targetSpeed":132},{"x":1036,"y":1717,"targetSpeed":128},{"x":1062,"y":1694,"targetSpeed":124},{"x":1087,"y":1672,"targetSpeed":120},{"x":1111,"y":1650,"targetSpeed":115},{"x":1134,"y":1629,"targetSpeed":111},{"x":1161,"y":1606,"targetSpeed":106},{"x":1186,"y":1583,"targetSpeed":100},{"x":1210,"y":1561,"targetSpeed":95},{"x":1233,"y":1541,"targetSpeed":91},{"x":1259,"y":1517,"targetSpeed":90},{"x":1285,"y":1494,"targetSpeed":89},{"x":1310,"y":1472,"targetSpeed":86},{"x":1334,"y":1449,"targetSpeed":86},{"x":1360,"y":1427,"targetSpeed":86},{"x":1387,"y":1408,"targetSpeed":85},{"x":1416,"y":1392,"targetSpeed":84},{"x":1446,"y":1380,"targetSpeed":84},{"x":1477,"y":1371,"targetSpeed":83},{"x":1509,"y":1366,"targetSpeed":82},{"x":1541,"y":1365,"targetSpeed":82},{"x":1572,"y":1367,"targetSpeed":81},{"x":1603,"y":1374,"targetSpeed":81},{"x":1633,"y":1384,"targetSpeed":80},{"x":1661,"y":1397,"targetSpeed":79},{"x":1687,"y":1413,"targetSpeed":78},{"x":1710,"y":1432,"targetSpeed":78},{"x":1731,"y":1454,"targetSpeed":78},{"x":1750,"y":1477,"targetSpeed":78},{"x":1767,"y":1503,"targetSpeed":77},{"x":1781,"y":1534,"targetSpeed":76},{"x":1790,"y":1565,"targetSpeed":74},{"x":1795,"y":1598,"targetSpeed":74},{"x":1795,"y":1631,"targetSpeed":73},{"x":1790,"y":1663,"targetSpeed":73},{"x":1781,"y":1694,"targetSpeed":73},{"x":1766,"y":1723,"targetSpeed":72},{"x":1750,"y":1750,"targetSpeed":73},{"x":1733,"y":1778,"targetSpeed":74},{"x":1716,"y":1807,"targetSpeed":76},{"x":1700,"y":1833,"targetSpeed":78},{"x":1682,"y":1857,"targetSpeed":80},{"x":1662,"y":1882,"targetSpeed":82},{"x":1642,"y":1907,"targetSpeed":84},{"x":1621,"y":1933,"targetSpeed":86},{"x":1598,"y":1959,"targetSpeed":88},{"x":1574,"y":1984,"targetSpeed":90},{"x":1551,"y":2004,"targetSpeed":92},{"x":1528,"y":2025,"targetSpeed":94},{"x":1504,"y":2047,"targetSpeed":96},{"x":1480,"y":2069,"targetSpeed":98},{"x":1456,"y":2090,"targetSpeed":98},{"x":1432,"y":2112,"targetSpeed":95},{"x":1409,"y":2133,"targetSpeed":92},{"x":1383,"y":2156,"targetSpeed":89},{"x":1358,"y":2178,"targetSpeed":84},{"x":1336,"y":2199,"targetSpeed":77},{"x":1312,"y":2221,"targetSpeed":70},{"x":1289,"y":2241,"targetSpeed":68},{"x":1267,"y":2266,"targetSpeed":67},{"x":1249,"y":2294,"targetSpeed":67},{"x":1235,"y":2325,"targetSpeed":66},{"x":1227,"y":2357,"targetSpeed":67},{"x":1221,"y":2390,"targetSpeed":67},{"x":1217,"y":2423,"targetSpeed":67},{"x":1218,"y":2453,"targetSpeed":67},{"x":1221,"y":2483,"targetSpeed":67},{"x":1230,"y":2512,"targetSpeed":67},{"x":1243,"y":2543,"targetSpeed":68},{"x":1258,"y":2569,"targetSpeed":68},{"x":1277,"y":2594,"targetSpeed":69},{"x":1298,"y":2616,"targetSpeed":70},{"x":1322,"y":2636,"targetSpeed":70},{"x":1349,"y":2653,"targetSpeed":71},{"x":1377,"y":2666,"targetSpeed":72},{"x":1408,"y":2677,"targetSpeed":73},{"x":1440,"y":2683,"targetSpeed":73},{"x":1473,"y":2685,"targetSpeed":75},{"x":1507,"y":2684,"targetSpeed":77},{"x":1537,"y":2679,"targetSpeed":79},{"x":1567,"y":2671,"targetSpeed":81},{"x":1598,"y":2662,"targetSpeed":83},{"x":1629,"y":2653,"targetSpeed":85},{"x":1662,"y":2643,"targetSpeed":88},{"x":1695,"y":2633,"targetSpeed":90},{"x":1724,"y":2623,"targetSpeed":92},{"x":1754,"y":2614,"targetSpeed":94},{"x":1783,"y":2604,"targetSpeed":96},{"x":1814,"y":2593,"targetSpeed":98},{"x":1845,"y":2582,"targetSpeed":100},{"x":1877,"y":2571,"targetSpeed":102},{"x":1909,"y":2560,"targetSpeed":104},{"x":1942,"y":2547,"targetSpeed":106},{"x":1975,"y":2533,"targetSpeed":108},{"x":2003,"y":2521,"targetSpeed":109},{"x":2030,"y":2507,"targetSpeed":111},{"x":2057,"y":2491,"targetSpeed":113},{"x":2083,"y":2473,"targetSpeed":114},{"x":2109,"y":2454,"targetSpeed":116},{"x":2135,"y":2434,"targetSpeed":118},{"x":2161,"y":2414,"targetSpeed":119},{"x":2188,"y":2394,"targetSpeed":121},{"x":2214,"y":2372,"targetSpeed":123},{"x":2241,"y":2350,"targetSpeed":124},{"x":2267,"y":2328,"targetSpeed":126},{"x":2295,"y":2306,"targetSpeed":128},{"x":2322,"y":2283,"targetSpeed":129},{"x":2350,"y":2259,"targetSpeed":131},{"x":2378,"y":2236,"targetSpeed":133},{"x":2401,"y":2217,"targetSpeed":134},{"x":2424,"y":2197,"targetSpeed":135},{"x":2447,"y":2178,"targetSpeed":137},{"x":2471,"y":2158,"targetSpeed":138},{"x":2495,"y":2139,"targetSpeed":139},{"x":2519,"y":2119,"targetSpeed":141},{"x":2543,"y":2098,"targetSpeed":142},{"x":2567,"y":2078,"targetSpeed":143},{"x":2592,"y":2058,"targetSpeed":144},{"x":2617,"y":2037,"targetSpeed":146},{"x":2642,"y":2016,"targetSpeed":147},{"x":2667,"y":1995,"targetSpeed":148},{"x":2693,"y":1974,"targetSpeed":149},{"x":2718,"y":1952,"targetSpeed":151},{"x":2744,"y":1931,"targetSpeed":152},{"x":2770,"y":1909,"targetSpeed":153},{"x":2796,"y":1887,"targetSpeed":154},{"x":2823,"y":1865,"targetSpeed":155},{"x":2850,"y":1842,"targetSpeed":157},{"x":2877,"y":1820,"targetSpeed":158},{"x":2904,"y":1797,"targetSpeed":159},{"x":2931,"y":1775,"targetSpeed":160},{"x":2959,"y":1752,"targetSpeed":161},{"x":2986,"y":1728,"targetSpeed":162},{"x":3014,"y":1705,"targetSpeed":164},{"x":3042,"y":1682,"targetSpeed":165},{"x":3071,"y":1658,"targetSpeed":166},{"x":3099,"y":1635,"targetSpeed":167},{"x":3127,"y":1611,"targetSpeed":168},{"x":3156,"y":1587,"targetSpeed":169},{"x":3185,"y":1563,"targetSpeed":170},{"x":3214,"y":1538,"targetSpeed":171},{"x":3244,"y":1514,"targetSpeed":172},{"x":3273,"y":1489,"targetSpeed":173},{"x":3303,"y":1465,"targetSpeed":174},{"x":3332,"y":1440,"targetSpeed":175},{"x":3362,"y":1415,"targetSpeed":175},{"x":3392,"y":1390,"targetSpeed":174},{"x":3421,"y":1366,"targetSpeed":171},{"x":3450,"y":1342,"targetSpeed":167},{"x":3478,"y":1319,"targetSpeed":164},{"x":3505,"y":1296,"targetSpeed":160},{"x":3532,"y":1273,"targetSpeed":157},{"x":3559,"y":1251,"targetSpeed":156},{"x":3585,"y":1229,"targetSpeed":155},{"x":3612,"y":1207,"targetSpeed":153},{"x":3637,"y":1186,"targetSpeed":149},{"x":3662,"y":1165,"targetSpeed":146},{"x":3687,"y":1145,"targetSpeed":142},{"x":3710,"y":1125,"targetSpeed":138},{"x":3733,"y":1106,"targetSpeed":135},{"x":3761,"y":1082,"targetSpeed":130},{"x":3788,"y":1060,"targetSpeed":126},{"x":3814,"y":1038,"targetSpeed":122},{"x":3840,"y":1017,"targetSpeed":117},{"x":3864,"y":997,"targetSpeed":113},{"x":3887,"y":977,"targetSpeed":108},{"x":3914,"y":955,"targetSpeed":104},{"x":3941,"y":934,"targetSpeed":101},{"x":3969,"y":916,"targetSpeed":100},{"x":3999,"y":901,"targetSpeed":100},{"x":4029,"y":888,"targetSpeed":99},{"x":4061,"y":878,"targetSpeed":99},{"x":4093,"y":871,"targetSpeed":98},{"x":4125,"y":865,"targetSpeed":98},{"x":4157,"y":861,"targetSpeed":98},{"x":4190,"y":859,"targetSpeed":98},{"x":4222,"y":859,"targetSpeed":98},{"x":4255,"y":860,"targetSpeed":98},{"x":4288,"y":862,"targetSpeed":98},{"x":4320,"y":867,"targetSpeed":98},{"x":4351,"y":875,"targetSpeed":97},{"x":4382,"y":886,"targetSpeed":97},{"x":4412,"y":899,"targetSpeed":97},{"x":4440,"y":915,"targetSpeed":97},{"x":4467,"y":933,"targetSpeed":96},{"x":4492,"y":953,"targetSpeed":96},{"x":4515,"y":975,"targetSpeed":96},{"x":4536,"y":999,"targetSpeed":96},{"x":4555,"y":1025,"targetSpeed":96},{"x":4574,"y":1052,"targetSpeed":97},{"x":4590,"y":1079,"targetSpeed":97},{"x":4605,"y":1108,"targetSpeed":97},{"x":4619,"y":1137,"targetSpeed":98},{"x":4631,"y":1168,"targetSpeed":98},{"x":4641,"y":1199,"targetSpeed":99},{"x":4649,"y":1231,"targetSpeed":99},{"x":4655,"y":1263,"targetSpeed":100},{"x":4659,"y":1296,"targetSpeed":100},{"x":4660,"y":1330,"targetSpeed":101},{"x":4658,"y":1364,"targetSpeed":101},{"x":4653,"y":1397,"targetSpeed":102},{"x":4645,"y":1431,"targetSpeed":102},{"x":4635,"y":1463,"targetSpeed":103},{"x":4622,"y":1495,"targetSpeed":104},{"x":4609,"y":1528,"targetSpeed":105},{"x":4596,"y":1561,"targetSpeed":107},{"x":4583,"y":1594,"targetSpeed":108},{"x":4571,"y":1622,"targetSpeed":109},{"x":4560,"y":1650,"targetSpeed":110},{"x":4550,"y":1680,"targetSpeed":111},{"x":4542,"y":1709,"targetSpeed":112},{"x":4535,"y":1740,"targetSpeed":113},{"x":4530,"y":1771,"targetSpeed":114},{"x":4527,"y":1803,"targetSpeed":115},{"x":4527,"y":1835,"targetSpeed":115},{"x":4527,"y":1867,"targetSpeed":116},{"x":4528,"y":1900,"targetSpeed":117},{"x":4531,"y":1932,"targetSpeed":118},{"x":4536,"y":1965,"targetSpeed":119},{"x":4542,"y":1998,"targetSpeed":120},{"x":4550,"y":2031,"targetSpeed":121},{"x":4558,"y":2064,"targetSpeed":122},{"x":4566,"y":2097,"targetSpeed":124},{"x":4574,"y":2130,"targetSpeed":125},{"x":4582,"y":2164,"targetSpeed":126},{"x":4590,"y":2199,"targetSpeed":127},{"x":4599,"y":2233,"targetSpeed":128},{"x":4607,"y":2268,"targetSpeed":129},{"x":4616,"y":2303,"targetSpeed":131},{"x":4624,"y":2339,"targetSpeed":132},{"x":4633,"y":2375,"targetSpeed":133},{"x":4642,"y":2411,"targetSpeed":134},{"x":4650,"y":2447,"targetSpeed":135},{"x":4659,"y":2483,"targetSpeed":132},{"x":4667,"y":2518,"targetSpeed":129},{"x":4676,"y":2553,"targetSpeed":126},{"x":4684,"y":2586,"targetSpeed":124},{"x":4692,"y":2619,"targetSpeed":121},{"x":4699,"y":2651,"targetSpeed":120},{"x":4706,"y":2684,"targetSpeed":119},{"x":4713,"y":2716,"targetSpeed":118},{"x":4718,"y":2748,"targetSpeed":117},{"x":4721,"y":2780,"targetSpeed":116},{"x":4723,"y":2812,"targetSpeed":113},{"x":4723,"y":2842,"targetSpeed":110},{"x":4721,"y":2872,"targetSpeed":108},{"x":4717,"y":2902,"targetSpeed":107},{"x":4710,"y":2937,"targetSpeed":106},{"x":4700,"y":2971,"targetSpeed":104},{"x":4688,"y":3003,"targetSpeed":103},{"x":4674,"y":3033,"targetSpeed":101},{"x":4658,"y":3062,"targetSpeed":99},{"x":4640,"y":3089,"targetSpeed":97},{"x":4620,"y":3114,"targetSpeed":95},{"x":4598,"y":3137,"targetSpeed":94},{"x":4575,"y":3158,"targetSpeed":94},{"x":4550,"y":3177,"targetSpeed":93},{"x":4524,"y":3194,"targetSpeed":92},{"x":4493,"y":3210,"targetSpeed":91},{"x":4465,"y":3221,"targetSpeed":90},{"x":4432,"y":3231,"targetSpeed":90},{"x":4402,"y":3236,"targetSpeed":89},{"x":4367,"y":3239,"targetSpeed":90},{"x":4332,"y":3240,"targetSpeed":91},{"x":4301,"y":3241,"targetSpeed":93},{"x":4270,"y":3241,"targetSpeed":94},{"x":4238,"y":3242,"targetSpeed":95},{"x":4207,"y":3243,"targetSpeed":96},{"x":4174,"y":3244,"targetSpeed":98},{"x":4141,"y":3245,"targetSpeed":99},{"x":4108,"y":3246,"targetSpeed":100},{"x":4074,"y":3246,"targetSpeed":102},{"x":4040,"y":3247,"targetSpeed":103},{"x":4005,"y":3248,"targetSpeed":104},{"x":3970,"y":3249,"targetSpeed":106},{"x":3935,"y":3250,"targetSpeed":107},{"x":3905,"y":3251,"targetSpeed":108},{"x":3875,"y":3252,"targetSpeed":109},{"x":3844,"y":3253,"targetSpeed":110},{"x":3813,"y":3253,"targetSpeed":111},{"x":3782,"y":3254,"targetSpeed":113},{"x":3751,"y":3254,"targetSpeed":114},{"x":3719,"y":3255,"targetSpeed":115},{"x":3687,"y":3255,"targetSpeed":116},{"x":3654,"y":3255,"targetSpeed":117},{"x":3622,"y":3255,"targetSpeed":118},{"x":3588,"y":3255,"targetSpeed":119},{"x":3555,"y":3256,"targetSpeed":121},{"x":3521,"y":3256,"targetSpeed":122},{"x":3487,"y":3256,"targetSpeed":123},{"x":3452,"y":3256,"targetSpeed":124},{"x":3418,"y":3256,"targetSpeed":125},{"x":3383,"y":3257,"targetSpeed":126},{"x":3347,"y":3257,"targetSpeed":128},{"x":3312,"y":3257,"targetSpeed":129},{"x":3275,"y":3257,"targetSpeed":130},{"x":3239,"y":3258,"targetSpeed":131},{"x":3203,"y":3258,"targetSpeed":132},{"x":3166,"y":3258,"targetSpeed":134},{"x":3136,"y":3258,"targetSpeed":134},{"x":3106,"y":3258,"targetSpeed":135},{"x":3076,"y":3259,"targetSpeed":136},{"x":3045,"y":3259,"targetSpeed":137},{"x":3014,"y":3259,"targetSpeed":138},{"x":2983,"y":3259,"targetSpeed":139},{"x":2952,"y":3259,"targetSpeed":140},{"x":2921,"y":3259,"targetSpeed":141},{"x":2890,"y":3260,"targetSpeed":142},{"x":2858,"y":3260,"targetSpeed":143},{"x":2826,"y":3260,"targetSpeed":144},{"x":2794,"y":3260,"targetSpeed":145},{"x":2761,"y":3260,"targetSpeed":146},{"x":2729,"y":3261,"targetSpeed":147},{"x":2696,"y":3261,"targetSpeed":148},{"x":2663,"y":3261,"targetSpeed":149},{"x":2629,"y":3261,"targetSpeed":150},{"x":2596,"y":3261,"targetSpeed":151},{"x":2562,"y":3262,"targetSpeed":152},{"x":2529,"y":3262,"targetSpeed":153},{"x":2494,"y":3262,"targetSpeed":153},{"x":2460,"y":3260,"targetSpeed":154},{"x":2426,"y":3258,"targetSpeed":155},{"x":2391,"y":3255,"targetSpeed":156},{"x":2356,"y":3252,"targetSpeed":157},{"x":2321,"y":3249,"targetSpeed":158},{"x":2286,"y":3246,"targetSpeed":159},{"x":2251,"y":3243,"targetSpeed":160},{"x":2215,"y":3241,"targetSpeed":161},{"x":2179,"y":3240,"targetSpeed":162},{"x":2143,"y":3239,"targetSpeed":163},{"x":2107,"y":3239,"targetSpeed":163},{"x":2070,"y":3239,"targetSpeed":164},{"x":2033,"y":3239,"targetSpeed":165},{"x":1997,"y":3238,"targetSpeed":166},{"x":1960,"y":3238,"targetSpeed":167},{"x":1922,"y":3238,"targetSpeed":168},{"x":1885,"y":3238,"targetSpeed":169},{"x":1847,"y":3238,"targetSpeed":170},{"x":1809,"y":3237,"targetSpeed":171},{"x":1771,"y":3237,"targetSpeed":172},{"x":1733,"y":3237,"targetSpeed":173},{"x":1694,"y":3237,"targetSpeed":174},{"x":1656,"y":3237,"targetSpeed":174},{"x":1617,"y":3236,"targetSpeed":174},{"x":1579,"y":3236,"targetSpeed":173},{"x":1540,"y":3236,"targetSpeed":173},{"x":1502,"y":3236,"targetSpeed":173},{"x":1463,"y":3236,"targetSpeed":173},{"x":1425,"y":3235,"targetSpeed":173},{"x":1386,"y":3235,"targetSpeed":173},{"x":1348,"y":3235,"targetSpeed":172},{"x":1310,"y":3235,"targetSpeed":172},{"x":1271,"y":3235,"targetSpeed":172},{"x":1233,"y":3234,"targetSpeed":172},{"x":1195,"y":3234,"targetSpeed":172}];

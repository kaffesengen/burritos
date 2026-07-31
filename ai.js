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
        let lookAheadOffset = 2 + Math.floor(vehicle.speedKmh / 15); 
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
aiManager.waypoints['standard'] = [{"x":1717,"y":3240,"targetSpeed":99},{"x":1684,"y":3240,"targetSpeed":99},{"x":1650,"y":3240,"targetSpeed":100},{"x":1617,"y":3240,"targetSpeed":100},{"x":1584,"y":3240,"targetSpeed":100},{"x":1550,"y":3240,"targetSpeed":101},{"x":1517,"y":3240,"targetSpeed":101},{"x":1483,"y":3240,"targetSpeed":101},{"x":1449,"y":3240,"targetSpeed":101},{"x":1415,"y":3240,"targetSpeed":101},{"x":1382,"y":3240,"targetSpeed":101},{"x":1349,"y":3240,"targetSpeed":99},{"x":1316,"y":3240,"targetSpeed":98},{"x":1284,"y":3240,"targetSpeed":98},{"x":1251,"y":3240,"targetSpeed":96},{"x":1220,"y":3240,"targetSpeed":94},{"x":1189,"y":3240,"targetSpeed":93},{"x":1158,"y":3240,"targetSpeed":92},{"x":1128,"y":3240,"targetSpeed":92},{"x":1097,"y":3240,"targetSpeed":92},{"x":1067,"y":3240,"targetSpeed":92},{"x":1036,"y":3240,"targetSpeed":92},{"x":1005,"y":3240,"targetSpeed":92},{"x":970,"y":3240,"targetSpeed":91},{"x":940,"y":3239,"targetSpeed":91},{"x":909,"y":3236,"targetSpeed":91},{"x":875,"y":3230,"targetSpeed":91},{"x":846,"y":3222,"targetSpeed":90},{"x":817,"y":3212,"targetSpeed":90},{"x":788,"y":3202,"targetSpeed":90},{"x":755,"y":3191,"targetSpeed":90},{"x":726,"y":3182,"targetSpeed":90},{"x":693,"y":3171,"targetSpeed":90},{"x":660,"y":3160,"targetSpeed":90},{"x":632,"y":3150,"targetSpeed":90},{"x":603,"y":3141,"targetSpeed":90},{"x":572,"y":3127,"targetSpeed":89},{"x":545,"y":3113,"targetSpeed":89},{"x":515,"y":3097,"targetSpeed":89},{"x":489,"y":3082,"targetSpeed":89},{"x":461,"y":3062,"targetSpeed":89},{"x":437,"y":3043,"targetSpeed":89},{"x":413,"y":3020,"targetSpeed":88},{"x":391,"y":2993,"targetSpeed":87},{"x":373,"y":2965,"targetSpeed":86},{"x":358,"y":2935,"targetSpeed":85},{"x":346,"y":2904,"targetSpeed":85},{"x":339,"y":2873,"targetSpeed":84},{"x":335,"y":2840,"targetSpeed":84},{"x":335,"y":2807,"targetSpeed":84},{"x":339,"y":2774,"targetSpeed":86},{"x":344,"y":2740,"targetSpeed":90},{"x":348,"y":2710,"targetSpeed":93},{"x":353,"y":2678,"targetSpeed":95},{"x":357,"y":2646,"targetSpeed":98},{"x":363,"y":2613,"targetSpeed":101},{"x":372,"y":2580,"targetSpeed":103},{"x":384,"y":2547,"targetSpeed":106},{"x":398,"y":2514,"targetSpeed":108},{"x":415,"y":2482,"targetSpeed":110},{"x":430,"y":2455,"targetSpeed":112},{"x":446,"y":2427,"targetSpeed":115},{"x":462,"y":2399,"targetSpeed":117},{"x":479,"y":2371,"targetSpeed":119},{"x":497,"y":2343,"targetSpeed":121},{"x":518,"y":2316,"targetSpeed":122},{"x":539,"y":2289,"targetSpeed":124},{"x":560,"y":2261,"targetSpeed":126},{"x":582,"y":2233,"targetSpeed":128},{"x":604,"y":2205,"targetSpeed":130},{"x":626,"y":2176,"targetSpeed":131},{"x":649,"y":2147,"targetSpeed":133},{"x":672,"y":2117,"targetSpeed":135},{"x":695,"y":2088,"targetSpeed":136},{"x":714,"y":2064,"targetSpeed":138},{"x":734,"y":2041,"targetSpeed":139},{"x":755,"y":2017,"targetSpeed":140},{"x":776,"y":1994,"targetSpeed":141},{"x":797,"y":1970,"targetSpeed":143},{"x":819,"y":1947,"targetSpeed":144},{"x":840,"y":1923,"targetSpeed":145},{"x":862,"y":1899,"targetSpeed":147},{"x":884,"y":1874,"targetSpeed":148},{"x":906,"y":1850,"targetSpeed":149},{"x":929,"y":1825,"targetSpeed":150},{"x":951,"y":1801,"targetSpeed":151},{"x":974,"y":1776,"targetSpeed":150},{"x":996,"y":1751,"targetSpeed":147},{"x":1017,"y":1727,"targetSpeed":144},{"x":1038,"y":1704,"targetSpeed":141},{"x":1059,"y":1682,"targetSpeed":137},{"x":1079,"y":1659,"targetSpeed":135},{"x":1099,"y":1637,"targetSpeed":132},{"x":1123,"y":1610,"targetSpeed":128},{"x":1146,"y":1585,"targetSpeed":123},{"x":1168,"y":1560,"targetSpeed":119},{"x":1190,"y":1537,"targetSpeed":115},{"x":1211,"y":1514,"targetSpeed":110},{"x":1236,"y":1489,"targetSpeed":106},{"x":1262,"y":1465,"targetSpeed":105},{"x":1288,"y":1442,"targetSpeed":105},{"x":1314,"y":1419,"targetSpeed":104},{"x":1340,"y":1396,"targetSpeed":104},{"x":1367,"y":1375,"targetSpeed":104},{"x":1396,"y":1355,"targetSpeed":103},{"x":1426,"y":1339,"targetSpeed":101},{"x":1456,"y":1325,"targetSpeed":99},{"x":1486,"y":1313,"targetSpeed":97},{"x":1517,"y":1305,"targetSpeed":95},{"x":1547,"y":1298,"targetSpeed":93},{"x":1578,"y":1295,"targetSpeed":90},{"x":1611,"y":1293,"targetSpeed":86},{"x":1643,"y":1293,"targetSpeed":80},{"x":1673,"y":1295,"targetSpeed":76},{"x":1705,"y":1300,"targetSpeed":70},{"x":1736,"y":1307,"targetSpeed":63},{"x":1765,"y":1319,"targetSpeed":61},{"x":1793,"y":1336,"targetSpeed":59},{"x":1817,"y":1359,"targetSpeed":59},{"x":1835,"y":1387,"targetSpeed":60},{"x":1847,"y":1415,"targetSpeed":61},{"x":1853,"y":1445,"targetSpeed":62},{"x":1853,"y":1476,"targetSpeed":62},{"x":1850,"y":1509,"targetSpeed":66},{"x":1845,"y":1539,"targetSpeed":69},{"x":1838,"y":1569,"targetSpeed":71},{"x":1831,"y":1601,"targetSpeed":75},{"x":1820,"y":1633,"targetSpeed":76},{"x":1809,"y":1662,"targetSpeed":80},{"x":1797,"y":1691,"targetSpeed":83},{"x":1781,"y":1720,"targetSpeed":86},{"x":1766,"y":1751,"targetSpeed":89},{"x":1751,"y":1777,"targetSpeed":92},{"x":1734,"y":1803,"targetSpeed":93},{"x":1714,"y":1828,"targetSpeed":96},{"x":1694,"y":1854,"targetSpeed":99},{"x":1673,"y":1880,"targetSpeed":101},{"x":1650,"y":1906,"targetSpeed":104},{"x":1626,"y":1931,"targetSpeed":107},{"x":1604,"y":1952,"targetSpeed":109},{"x":1581,"y":1972,"targetSpeed":110},{"x":1557,"y":1991,"targetSpeed":113},{"x":1531,"y":2011,"targetSpeed":115},{"x":1506,"y":2031,"targetSpeed":117},{"x":1480,"y":2051,"targetSpeed":118},{"x":1455,"y":2071,"targetSpeed":117},{"x":1430,"y":2090,"targetSpeed":113},{"x":1405,"y":2109,"targetSpeed":111},{"x":1377,"y":2131,"targetSpeed":106},{"x":1350,"y":2152,"targetSpeed":101},{"x":1325,"y":2172,"targetSpeed":96},{"x":1300,"y":2191,"targetSpeed":92},{"x":1277,"y":2211,"targetSpeed":90},{"x":1253,"y":2235,"targetSpeed":89},{"x":1232,"y":2257,"targetSpeed":89},{"x":1209,"y":2281,"targetSpeed":87},{"x":1185,"y":2306,"targetSpeed":87},{"x":1163,"y":2331,"targetSpeed":86},{"x":1144,"y":2358,"targetSpeed":86},{"x":1127,"y":2387,"targetSpeed":85},{"x":1115,"y":2417,"targetSpeed":84},{"x":1106,"y":2448,"targetSpeed":83},{"x":1100,"y":2479,"targetSpeed":81},{"x":1098,"y":2511,"targetSpeed":80},{"x":1101,"y":2545,"targetSpeed":77},{"x":1107,"y":2578,"targetSpeed":74},{"x":1117,"y":2608,"targetSpeed":70},{"x":1129,"y":2636,"targetSpeed":67},{"x":1146,"y":2663,"targetSpeed":62},{"x":1166,"y":2685,"targetSpeed":61},{"x":1190,"y":2705,"targetSpeed":62},{"x":1217,"y":2721,"targetSpeed":63},{"x":1247,"y":2733,"targetSpeed":65},{"x":1279,"y":2740,"targetSpeed":66},{"x":1312,"y":2742,"targetSpeed":67},{"x":1343,"y":2739,"targetSpeed":68},{"x":1373,"y":2731,"targetSpeed":70},{"x":1402,"y":2719,"targetSpeed":74},{"x":1433,"y":2704,"targetSpeed":78},{"x":1461,"y":2691,"targetSpeed":81},{"x":1490,"y":2677,"targetSpeed":84},{"x":1521,"y":2663,"targetSpeed":87},{"x":1552,"y":2648,"targetSpeed":91},{"x":1580,"y":2634,"targetSpeed":93},{"x":1609,"y":2621,"targetSpeed":96},{"x":1638,"y":2607,"targetSpeed":99},{"x":1669,"y":2592,"targetSpeed":102},{"x":1700,"y":2578,"targetSpeed":105},{"x":1732,"y":2562,"targetSpeed":107},{"x":1759,"y":2549,"targetSpeed":109},{"x":1788,"y":2536,"targetSpeed":112},{"x":1816,"y":2523,"targetSpeed":114},{"x":1845,"y":2509,"targetSpeed":116},{"x":1875,"y":2495,"targetSpeed":118},{"x":1904,"y":2481,"targetSpeed":120},{"x":1935,"y":2466,"targetSpeed":122},{"x":1966,"y":2451,"targetSpeed":124},{"x":1998,"y":2436,"targetSpeed":126},{"x":2030,"y":2421,"targetSpeed":128},{"x":2062,"y":2405,"targetSpeed":130},{"x":2094,"y":2388,"targetSpeed":131},{"x":2126,"y":2370,"targetSpeed":133},{"x":2158,"y":2351,"targetSpeed":134},{"x":2184,"y":2336,"targetSpeed":136},{"x":2211,"y":2321,"targetSpeed":137},{"x":2237,"y":2306,"targetSpeed":138},{"x":2264,"y":2290,"targetSpeed":140},{"x":2291,"y":2274,"targetSpeed":141},{"x":2318,"y":2257,"targetSpeed":142},{"x":2344,"y":2240,"targetSpeed":143},{"x":2372,"y":2223,"targetSpeed":145},{"x":2398,"y":2204,"targetSpeed":146},{"x":2425,"y":2186,"targetSpeed":147},{"x":2452,"y":2167,"targetSpeed":148},{"x":2478,"y":2147,"targetSpeed":150},{"x":2505,"y":2126,"targetSpeed":151},{"x":2532,"y":2106,"targetSpeed":152},{"x":2559,"y":2085,"targetSpeed":153},{"x":2586,"y":2064,"targetSpeed":154},{"x":2613,"y":2043,"targetSpeed":156},{"x":2641,"y":2022,"targetSpeed":157},{"x":2669,"y":2000,"targetSpeed":158},{"x":2696,"y":1978,"targetSpeed":159},{"x":2725,"y":1957,"targetSpeed":160},{"x":2753,"y":1935,"targetSpeed":161},{"x":2781,"y":1912,"targetSpeed":163},{"x":2810,"y":1890,"targetSpeed":164},{"x":2839,"y":1868,"targetSpeed":165},{"x":2868,"y":1845,"targetSpeed":166},{"x":2897,"y":1823,"targetSpeed":167},{"x":2927,"y":1800,"targetSpeed":168},{"x":2957,"y":1777,"targetSpeed":169},{"x":2986,"y":1754,"targetSpeed":170},{"x":3016,"y":1730,"targetSpeed":171},{"x":3046,"y":1705,"targetSpeed":172},{"x":3075,"y":1681,"targetSpeed":173},{"x":3105,"y":1656,"targetSpeed":174},{"x":3134,"y":1631,"targetSpeed":175},{"x":3163,"y":1605,"targetSpeed":175},{"x":3191,"y":1578,"targetSpeed":176},{"x":3220,"y":1551,"targetSpeed":177},{"x":3249,"y":1524,"targetSpeed":178},{"x":3277,"y":1496,"targetSpeed":179},{"x":3299,"y":1475,"targetSpeed":180},{"x":3328,"y":1448,"targetSpeed":180},{"x":3349,"y":1426,"targetSpeed":181},{"x":3369,"y":1404,"targetSpeed":181},{"x":3390,"y":1381,"targetSpeed":181},{"x":3417,"y":1352,"targetSpeed":181},{"x":3437,"y":1329,"targetSpeed":179},{"x":3463,"y":1300,"targetSpeed":176},{"x":3488,"y":1271,"targetSpeed":172},{"x":3513,"y":1244,"targetSpeed":168},{"x":3538,"y":1216,"targetSpeed":165},{"x":3562,"y":1189,"targetSpeed":161},{"x":3585,"y":1163,"targetSpeed":158},{"x":3608,"y":1138,"targetSpeed":154},{"x":3631,"y":1113,"targetSpeed":150},{"x":3654,"y":1090,"targetSpeed":146},{"x":3677,"y":1068,"targetSpeed":143},{"x":3700,"y":1047,"targetSpeed":140},{"x":3722,"y":1025,"targetSpeed":139},{"x":3745,"y":1005,"targetSpeed":137},{"x":3772,"y":979,"targetSpeed":135},{"x":3799,"y":954,"targetSpeed":132},{"x":3826,"y":931,"targetSpeed":128},{"x":3854,"y":910,"targetSpeed":127},{"x":3883,"y":890,"targetSpeed":125},{"x":3913,"y":872,"targetSpeed":123},{"x":3942,"y":856,"targetSpeed":120},{"x":3972,"y":842,"targetSpeed":118},{"x":4002,"y":829,"targetSpeed":117},{"x":4032,"y":819,"targetSpeed":115},{"x":4063,"y":810,"targetSpeed":114},{"x":4094,"y":803,"targetSpeed":113},{"x":4124,"y":799,"targetSpeed":112},{"x":4155,"y":796,"targetSpeed":110},{"x":4191,"y":794,"targetSpeed":109},{"x":4227,"y":796,"targetSpeed":107},{"x":4262,"y":800,"targetSpeed":105},{"x":4296,"y":806,"targetSpeed":103},{"x":4329,"y":815,"targetSpeed":102},{"x":4361,"y":826,"targetSpeed":101},{"x":4392,"y":840,"targetSpeed":100},{"x":4421,"y":855,"targetSpeed":100},{"x":4449,"y":873,"targetSpeed":99},{"x":4475,"y":893,"targetSpeed":98},{"x":4499,"y":915,"targetSpeed":99},{"x":4521,"y":940,"targetSpeed":100},{"x":4542,"y":966,"targetSpeed":100},{"x":4560,"y":995,"targetSpeed":100},{"x":4576,"y":1024,"targetSpeed":101},{"x":4589,"y":1055,"targetSpeed":101},{"x":4599,"y":1087,"targetSpeed":101},{"x":4607,"y":1120,"targetSpeed":102},{"x":4612,"y":1154,"targetSpeed":103},{"x":4614,"y":1188,"targetSpeed":104},{"x":4614,"y":1224,"targetSpeed":105},{"x":4614,"y":1259,"targetSpeed":106},{"x":4611,"y":1294,"targetSpeed":107},{"x":4606,"y":1324,"targetSpeed":108},{"x":4598,"y":1359,"targetSpeed":108},{"x":4589,"y":1388,"targetSpeed":109},{"x":4579,"y":1416,"targetSpeed":110},{"x":4566,"y":1444,"targetSpeed":110},{"x":4553,"y":1472,"targetSpeed":112},{"x":4539,"y":1500,"targetSpeed":113},{"x":4525,"y":1529,"targetSpeed":114},{"x":4511,"y":1557,"targetSpeed":115},{"x":4497,"y":1586,"targetSpeed":116},{"x":4483,"y":1615,"targetSpeed":117},{"x":4471,"y":1645,"targetSpeed":117},{"x":4460,"y":1676,"targetSpeed":118},{"x":4451,"y":1708,"targetSpeed":118},{"x":4444,"y":1740,"targetSpeed":118},{"x":4439,"y":1773,"targetSpeed":119},{"x":4436,"y":1806,"targetSpeed":120},{"x":4435,"y":1839,"targetSpeed":121},{"x":4435,"y":1873,"targetSpeed":121},{"x":4438,"y":1906,"targetSpeed":121},{"x":4443,"y":1940,"targetSpeed":121},{"x":4450,"y":1973,"targetSpeed":121},{"x":4459,"y":2005,"targetSpeed":122},{"x":4469,"y":2037,"targetSpeed":122},{"x":4482,"y":2069,"targetSpeed":123},{"x":4497,"y":2100,"targetSpeed":124},{"x":4513,"y":2130,"targetSpeed":125},{"x":4532,"y":2160,"targetSpeed":125},{"x":4552,"y":2189,"targetSpeed":127},{"x":4572,"y":2218,"targetSpeed":128},{"x":4591,"y":2248,"targetSpeed":129},{"x":4609,"y":2279,"targetSpeed":129},{"x":4625,"y":2311,"targetSpeed":129},{"x":4639,"y":2344,"targetSpeed":130},{"x":4652,"y":2378,"targetSpeed":130},{"x":4662,"y":2413,"targetSpeed":131},{"x":4672,"y":2449,"targetSpeed":132},{"x":4681,"y":2484,"targetSpeed":134},{"x":4689,"y":2513,"targetSpeed":135},{"x":4697,"y":2542,"targetSpeed":136},{"x":4704,"y":2571,"targetSpeed":136},{"x":4712,"y":2600,"targetSpeed":133},{"x":4720,"y":2635,"targetSpeed":128},{"x":4727,"y":2669,"targetSpeed":123},{"x":4733,"y":2701,"targetSpeed":118},{"x":4739,"y":2732,"targetSpeed":113},{"x":4744,"y":2763,"targetSpeed":110},{"x":4748,"y":2798,"targetSpeed":107},{"x":4750,"y":2833,"targetSpeed":104},{"x":4749,"y":2867,"targetSpeed":102},{"x":4746,"y":2901,"targetSpeed":99},{"x":4741,"y":2933,"targetSpeed":97},{"x":4734,"y":2963,"targetSpeed":94},{"x":4724,"y":2993,"targetSpeed":91},{"x":4713,"y":3021,"targetSpeed":89},{"x":4697,"y":3051,"targetSpeed":87},{"x":4679,"y":3079,"targetSpeed":87},{"x":4658,"y":3105,"targetSpeed":86},{"x":4634,"y":3128,"targetSpeed":85},{"x":4608,"y":3149,"targetSpeed":85},{"x":4581,"y":3167,"targetSpeed":84},{"x":4551,"y":3181,"targetSpeed":84},{"x":4521,"y":3192,"targetSpeed":83},{"x":4489,"y":3200,"targetSpeed":83},{"x":4457,"y":3205,"targetSpeed":84},{"x":4424,"y":3208,"targetSpeed":87},{"x":4390,"y":3211,"targetSpeed":89},{"x":4359,"y":3211,"targetSpeed":90},{"x":4324,"y":3211,"targetSpeed":93},{"x":4293,"y":3210,"targetSpeed":95},{"x":4260,"y":3210,"targetSpeed":97},{"x":4228,"y":3209,"targetSpeed":99},{"x":4194,"y":3209,"targetSpeed":101},{"x":4160,"y":3208,"targetSpeed":103},{"x":4125,"y":3207,"targetSpeed":105},{"x":4090,"y":3207,"targetSpeed":107},{"x":4060,"y":3206,"targetSpeed":109},{"x":4029,"y":3206,"targetSpeed":110},{"x":3998,"y":3205,"targetSpeed":112},{"x":3967,"y":3205,"targetSpeed":114},{"x":3935,"y":3204,"targetSpeed":115},{"x":3902,"y":3204,"targetSpeed":117},{"x":3870,"y":3203,"targetSpeed":119},{"x":3836,"y":3203,"targetSpeed":120},{"x":3802,"y":3202,"targetSpeed":122},{"x":3768,"y":3202,"targetSpeed":124},{"x":3733,"y":3201,"targetSpeed":126},{"x":3699,"y":3201,"targetSpeed":127},{"x":3662,"y":3200,"targetSpeed":129},{"x":3626,"y":3200,"targetSpeed":131},{"x":3590,"y":3200,"targetSpeed":132},{"x":3560,"y":3200,"targetSpeed":134},{"x":3522,"y":3200,"targetSpeed":135},{"x":3492,"y":3200,"targetSpeed":137},{"x":3462,"y":3199,"targetSpeed":138},{"x":3431,"y":3199,"targetSpeed":139},{"x":3400,"y":3199,"targetSpeed":140},{"x":3368,"y":3199,"targetSpeed":142},{"x":3337,"y":3199,"targetSpeed":143},{"x":3304,"y":3199,"targetSpeed":144},{"x":3272,"y":3199,"targetSpeed":146},{"x":3239,"y":3199,"targetSpeed":147},{"x":3207,"y":3199,"targetSpeed":148},{"x":3173,"y":3199,"targetSpeed":149},{"x":3140,"y":3198,"targetSpeed":151},{"x":3106,"y":3198,"targetSpeed":152},{"x":3073,"y":3198,"targetSpeed":153},{"x":3038,"y":3198,"targetSpeed":154},{"x":3004,"y":3198,"targetSpeed":155},{"x":2969,"y":3198,"targetSpeed":157},{"x":2933,"y":3198,"targetSpeed":158},{"x":2899,"y":3198,"targetSpeed":159},{"x":2863,"y":3198,"targetSpeed":160},{"x":2827,"y":3198,"targetSpeed":161},{"x":2791,"y":3197,"targetSpeed":162},{"x":2755,"y":3197,"targetSpeed":163},{"x":2719,"y":3197,"targetSpeed":164},{"x":2681,"y":3197,"targetSpeed":166},{"x":2645,"y":3197,"targetSpeed":167},{"x":2607,"y":3197,"targetSpeed":168},{"x":2570,"y":3197,"targetSpeed":169}];

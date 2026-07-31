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

        // 2. Look-ahead (Sikt fremover, ikke rett ned i panseret)
        // Jo fortere bilen kjører, jo lenger frem må den se for å styre jevnt
        let lookAheadOffset = 5 + Math.floor(vehicle.speedKmh / 8); 
        let targetIdx = (closestIdx + lookAheadOffset) % trackWaypoints.length;
        let targetPt = trackWaypoints[targetIdx];

        // 3. Styring (Kalkuler vinkelen til targetPt)
        let dx = targetPt.x - vehicle.x;
        let dy = targetPt.y - vehicle.y;
        let targetAngle = Math.atan2(dy, dx);
        
        // Normaliser vinkelforskjellen slik at AI-en alltid svinger korteste vei
        let angleDiff = targetAngle - vehicle.angle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

        // Sensitivitet på rattutslaget
        inputs.steering = Math.max(-1.0, Math.min(1.0, angleDiff * 2.0));

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

// Global instans
const aiManager = new AIManager();

// Lagrede baner (Lim inn dine opptak her)
aiManager.waypoints['standard'] = [{"x":2160,"y":3240,"targetSpeed":15},{"x":2130,"y":3240,"targetSpeed":31},{"x":2099,"y":3240,"targetSpeed":41},{"x":2068,"y":3240,"targetSpeed":48},{"x":2037,"y":3240,"targetSpeed":53},{"x":2006,"y":3240,"targetSpeed":58},{"x":1975,"y":3240,"targetSpeed":61},{"x":1944,"y":3240,"targetSpeed":65},{"x":1914,"y":3240,"targetSpeed":68},{"x":1883,"y":3240,"targetSpeed":71},{"x":1851,"y":3240,"targetSpeed":73},{"x":1817,"y":3240,"targetSpeed":76},{"x":1783,"y":3240,"targetSpeed":78},{"x":1752,"y":3240,"targetSpeed":80},{"x":1720,"y":3240,"targetSpeed":82},{"x":1688,"y":3240,"targetSpeed":84},{"x":1654,"y":3240,"targetSpeed":86},{"x":1620,"y":3240,"targetSpeed":88},{"x":1585,"y":3240,"targetSpeed":90},{"x":1555,"y":3240,"targetSpeed":92},{"x":1524,"y":3240,"targetSpeed":93},{"x":1492,"y":3240,"targetSpeed":95},{"x":1461,"y":3240,"targetSpeed":96},{"x":1428,"y":3240,"targetSpeed":98},{"x":1395,"y":3240,"targetSpeed":99},{"x":1362,"y":3240,"targetSpeed":100},{"x":1328,"y":3240,"targetSpeed":102},{"x":1294,"y":3240,"targetSpeed":103},{"x":1259,"y":3240,"targetSpeed":105},{"x":1224,"y":3240,"targetSpeed":106},{"x":1194,"y":3240,"targetSpeed":107},{"x":1158,"y":3240,"targetSpeed":108},{"x":1128,"y":3240,"targetSpeed":109},{"x":1097,"y":3240,"targetSpeed":110},{"x":1067,"y":3240,"targetSpeed":111},{"x":1036,"y":3240,"targetSpeed":110},{"x":1005,"y":3240,"targetSpeed":110},{"x":974,"y":3240,"targetSpeed":110},{"x":944,"y":3239,"targetSpeed":110},{"x":913,"y":3236,"targetSpeed":110},{"x":883,"y":3232,"targetSpeed":110},{"x":854,"y":3226,"targetSpeed":109},{"x":824,"y":3218,"targetSpeed":108},{"x":790,"y":3208,"targetSpeed":108},{"x":761,"y":3198,"targetSpeed":108},{"x":727,"y":3187,"targetSpeed":108},{"x":699,"y":3176,"targetSpeed":108},{"x":671,"y":3166,"targetSpeed":108},{"x":643,"y":3154,"targetSpeed":108},{"x":611,"y":3139,"targetSpeed":107},{"x":585,"y":3124,"targetSpeed":107},{"x":556,"y":3104,"targetSpeed":106},{"x":528,"y":3081,"targetSpeed":106},{"x":503,"y":3057,"targetSpeed":106},{"x":479,"y":3030,"targetSpeed":106},{"x":458,"y":3002,"targetSpeed":107},{"x":438,"y":2973,"targetSpeed":107},{"x":421,"y":2948,"targetSpeed":107},{"x":403,"y":2917,"targetSpeed":108},{"x":390,"y":2890,"targetSpeed":107},{"x":378,"y":2862,"targetSpeed":108},{"x":367,"y":2829,"targetSpeed":107},{"x":360,"y":2800,"targetSpeed":107},{"x":354,"y":2770,"targetSpeed":107},{"x":350,"y":2735,"targetSpeed":107},{"x":349,"y":2705,"targetSpeed":107},{"x":351,"y":2669,"targetSpeed":108},{"x":354,"y":2639,"targetSpeed":108},{"x":358,"y":2609,"targetSpeed":109},{"x":364,"y":2579,"targetSpeed":111},{"x":372,"y":2549,"targetSpeed":111},{"x":382,"y":2520,"targetSpeed":112},{"x":392,"y":2490,"targetSpeed":114},{"x":404,"y":2460,"targetSpeed":115},{"x":415,"y":2430,"targetSpeed":116},{"x":426,"y":2400,"targetSpeed":117},{"x":438,"y":2369,"targetSpeed":118},{"x":450,"y":2339,"targetSpeed":119},{"x":463,"y":2308,"targetSpeed":119},{"x":476,"y":2278,"targetSpeed":120},{"x":491,"y":2247,"targetSpeed":121},{"x":508,"y":2218,"targetSpeed":122},{"x":526,"y":2189,"targetSpeed":123},{"x":546,"y":2161,"targetSpeed":124},{"x":568,"y":2134,"targetSpeed":125},{"x":590,"y":2108,"targetSpeed":126},{"x":613,"y":2081,"targetSpeed":126},{"x":637,"y":2055,"targetSpeed":127},{"x":660,"y":2028,"targetSpeed":128},{"x":684,"y":2001,"targetSpeed":129},{"x":708,"y":1974,"targetSpeed":130},{"x":732,"y":1947,"targetSpeed":131},{"x":757,"y":1921,"targetSpeed":132},{"x":783,"y":1895,"targetSpeed":132},{"x":810,"y":1869,"targetSpeed":133},{"x":836,"y":1843,"targetSpeed":134},{"x":863,"y":1817,"targetSpeed":135},{"x":884,"y":1796,"targetSpeed":135},{"x":906,"y":1775,"targetSpeed":136},{"x":928,"y":1753,"targetSpeed":137},{"x":955,"y":1727,"targetSpeed":138},{"x":977,"y":1705,"targetSpeed":138},{"x":999,"y":1684,"targetSpeed":139},{"x":1021,"y":1662,"targetSpeed":139},{"x":1044,"y":1641,"targetSpeed":140},{"x":1066,"y":1619,"targetSpeed":140},{"x":1088,"y":1597,"targetSpeed":140},{"x":1110,"y":1576,"targetSpeed":137},{"x":1137,"y":1550,"targetSpeed":133},{"x":1163,"y":1525,"targetSpeed":129},{"x":1188,"y":1500,"targetSpeed":125},{"x":1212,"y":1477,"targetSpeed":120},{"x":1236,"y":1455,"targetSpeed":115},{"x":1259,"y":1435,"targetSpeed":110},{"x":1286,"y":1413,"targetSpeed":105},{"x":1313,"y":1393,"targetSpeed":99},{"x":1340,"y":1375,"targetSpeed":98},{"x":1369,"y":1359,"targetSpeed":97},{"x":1398,"y":1346,"targetSpeed":95},{"x":1427,"y":1336,"targetSpeed":92},{"x":1456,"y":1329,"targetSpeed":90},{"x":1490,"y":1322,"targetSpeed":86},{"x":1522,"y":1320,"targetSpeed":83},{"x":1554,"y":1320,"targetSpeed":80},{"x":1584,"y":1323,"targetSpeed":78},{"x":1617,"y":1330,"targetSpeed":74},{"x":1647,"y":1341,"targetSpeed":72},{"x":1675,"y":1355,"targetSpeed":69},{"x":1700,"y":1373,"targetSpeed":67},{"x":1724,"y":1395,"targetSpeed":65},{"x":1743,"y":1421,"targetSpeed":64},{"x":1758,"y":1449,"targetSpeed":63},{"x":1767,"y":1479,"targetSpeed":62},{"x":1771,"y":1510,"targetSpeed":62},{"x":1769,"y":1541,"targetSpeed":62},{"x":1762,"y":1572,"targetSpeed":64},{"x":1753,"y":1604,"targetSpeed":67},{"x":1745,"y":1634,"targetSpeed":69},{"x":1738,"y":1665,"targetSpeed":72},{"x":1730,"y":1696,"targetSpeed":74},{"x":1721,"y":1729,"targetSpeed":77},{"x":1713,"y":1758,"targetSpeed":79},{"x":1702,"y":1787,"targetSpeed":81},{"x":1690,"y":1817,"targetSpeed":83},{"x":1678,"y":1847,"targetSpeed":85},{"x":1664,"y":1878,"targetSpeed":87},{"x":1647,"y":1908,"targetSpeed":89},{"x":1628,"y":1937,"targetSpeed":90},{"x":1609,"y":1960,"targetSpeed":92},{"x":1588,"y":1984,"targetSpeed":93},{"x":1567,"y":2007,"targetSpeed":95},{"x":1546,"y":2031,"targetSpeed":96},{"x":1524,"y":2055,"targetSpeed":98},{"x":1502,"y":2079,"targetSpeed":99},{"x":1480,"y":2104,"targetSpeed":101},{"x":1457,"y":2129,"targetSpeed":102},{"x":1435,"y":2155,"targetSpeed":103},{"x":1411,"y":2181,"targetSpeed":104},{"x":1389,"y":2206,"targetSpeed":102},{"x":1367,"y":2231,"targetSpeed":98},{"x":1345,"y":2254,"targetSpeed":94},{"x":1325,"y":2277,"targetSpeed":89},{"x":1304,"y":2302,"targetSpeed":84},{"x":1286,"y":2329,"targetSpeed":83},{"x":1271,"y":2358,"targetSpeed":82},{"x":1259,"y":2387,"targetSpeed":81},{"x":1251,"y":2417,"targetSpeed":80},{"x":1247,"y":2448,"targetSpeed":79},{"x":1246,"y":2479,"targetSpeed":78},{"x":1250,"y":2513,"targetSpeed":78},{"x":1254,"y":2543,"targetSpeed":77},{"x":1263,"y":2576,"targetSpeed":76},{"x":1276,"y":2606,"targetSpeed":75},{"x":1291,"y":2632,"targetSpeed":76},{"x":1313,"y":2659,"targetSpeed":77},{"x":1338,"y":2683,"targetSpeed":78},{"x":1366,"y":2703,"targetSpeed":78},{"x":1396,"y":2719,"targetSpeed":77},{"x":1424,"y":2730,"targetSpeed":77},{"x":1453,"y":2737,"targetSpeed":77},{"x":1483,"y":2741,"targetSpeed":78},{"x":1514,"y":2741,"targetSpeed":79},{"x":1545,"y":2737,"targetSpeed":80},{"x":1576,"y":2730,"targetSpeed":82},{"x":1606,"y":2719,"targetSpeed":83},{"x":1635,"y":2704,"targetSpeed":85},{"x":1664,"y":2687,"targetSpeed":87},{"x":1694,"y":2669,"targetSpeed":89},{"x":1724,"y":2652,"targetSpeed":91},{"x":1751,"y":2637,"targetSpeed":92},{"x":1778,"y":2621,"targetSpeed":94},{"x":1805,"y":2606,"targetSpeed":95},{"x":1833,"y":2590,"targetSpeed":97},{"x":1861,"y":2573,"targetSpeed":98},{"x":1889,"y":2555,"targetSpeed":99},{"x":1916,"y":2537,"targetSpeed":101},{"x":1945,"y":2518,"targetSpeed":102},{"x":1973,"y":2498,"targetSpeed":104},{"x":2002,"y":2479,"targetSpeed":105},{"x":2031,"y":2458,"targetSpeed":106},{"x":2059,"y":2436,"targetSpeed":107},{"x":2087,"y":2414,"targetSpeed":109},{"x":2111,"y":2394,"targetSpeed":110},{"x":2135,"y":2375,"targetSpeed":111},{"x":2159,"y":2356,"targetSpeed":112},{"x":2183,"y":2336,"targetSpeed":113},{"x":2208,"y":2316,"targetSpeed":114},{"x":2233,"y":2296,"targetSpeed":115},{"x":2258,"y":2276,"targetSpeed":116},{"x":2283,"y":2256,"targetSpeed":117},{"x":2309,"y":2235,"targetSpeed":118},{"x":2334,"y":2214,"targetSpeed":119},{"x":2360,"y":2194,"targetSpeed":120},{"x":2386,"y":2173,"targetSpeed":121},{"x":2412,"y":2152,"targetSpeed":122},{"x":2438,"y":2130,"targetSpeed":123},{"x":2465,"y":2109,"targetSpeed":123},{"x":2492,"y":2087,"targetSpeed":124},{"x":2519,"y":2065,"targetSpeed":125},{"x":2546,"y":2043,"targetSpeed":126},{"x":2574,"y":2021,"targetSpeed":127},{"x":2601,"y":1999,"targetSpeed":128},{"x":2629,"y":1977,"targetSpeed":129},{"x":2657,"y":1954,"targetSpeed":130},{"x":2685,"y":1931,"targetSpeed":130},{"x":2714,"y":1908,"targetSpeed":131},{"x":2742,"y":1885,"targetSpeed":132},{"x":2771,"y":1862,"targetSpeed":133},{"x":2800,"y":1839,"targetSpeed":134},{"x":2829,"y":1816,"targetSpeed":135},{"x":2852,"y":1797,"targetSpeed":135},{"x":2876,"y":1778,"targetSpeed":136},{"x":2899,"y":1759,"targetSpeed":137},{"x":2923,"y":1740,"targetSpeed":137},{"x":2947,"y":1720,"targetSpeed":138},{"x":2971,"y":1701,"targetSpeed":138},{"x":2995,"y":1682,"targetSpeed":139},{"x":3019,"y":1662,"targetSpeed":140},{"x":3043,"y":1643,"targetSpeed":140},{"x":3068,"y":1623,"targetSpeed":141},{"x":3092,"y":1603,"targetSpeed":141},{"x":3117,"y":1584,"targetSpeed":142},{"x":3141,"y":1564,"targetSpeed":143},{"x":3166,"y":1543,"targetSpeed":143},{"x":3191,"y":1524,"targetSpeed":144},{"x":3216,"y":1503,"targetSpeed":144},{"x":3241,"y":1483,"targetSpeed":145},{"x":3266,"y":1463,"targetSpeed":146},{"x":3292,"y":1443,"targetSpeed":146},{"x":3317,"y":1422,"targetSpeed":147},{"x":3342,"y":1402,"targetSpeed":147},{"x":3368,"y":1381,"targetSpeed":148},{"x":3394,"y":1360,"targetSpeed":149},{"x":3419,"y":1340,"targetSpeed":149},{"x":3445,"y":1319,"targetSpeed":150},{"x":3471,"y":1298,"targetSpeed":150},{"x":3497,"y":1277,"targetSpeed":151},{"x":3523,"y":1256,"targetSpeed":151},{"x":3549,"y":1235,"targetSpeed":149},{"x":3575,"y":1214,"targetSpeed":145},{"x":3599,"y":1195,"targetSpeed":142},{"x":3623,"y":1175,"targetSpeed":138},{"x":3647,"y":1156,"targetSpeed":135},{"x":3675,"y":1133,"targetSpeed":130},{"x":3702,"y":1111,"targetSpeed":126},{"x":3729,"y":1090,"targetSpeed":121},{"x":3755,"y":1069,"targetSpeed":119},{"x":3780,"y":1049,"targetSpeed":119},{"x":3806,"y":1028,"targetSpeed":119},{"x":3831,"y":1007,"targetSpeed":118},{"x":3856,"y":987,"targetSpeed":115},{"x":3881,"y":968,"targetSpeed":112},{"x":3905,"y":949,"targetSpeed":109},{"x":3934,"y":930,"targetSpeed":105},{"x":3965,"y":912,"targetSpeed":105},{"x":3996,"y":898,"targetSpeed":103},{"x":4028,"y":886,"targetSpeed":102},{"x":4060,"y":876,"targetSpeed":100},{"x":4093,"y":870,"targetSpeed":99},{"x":4125,"y":866,"targetSpeed":98},{"x":4158,"y":865,"targetSpeed":98},{"x":4191,"y":866,"targetSpeed":98},{"x":4224,"y":867,"targetSpeed":99},{"x":4257,"y":868,"targetSpeed":99},{"x":4290,"y":870,"targetSpeed":99},{"x":4323,"y":871,"targetSpeed":100},{"x":4357,"y":873,"targetSpeed":101},{"x":4390,"y":879,"targetSpeed":100},{"x":4422,"y":886,"targetSpeed":100},{"x":4454,"y":897,"targetSpeed":99},{"x":4484,"y":910,"targetSpeed":99},{"x":4513,"y":925,"targetSpeed":98},{"x":4540,"y":943,"targetSpeed":98},{"x":4566,"y":962,"targetSpeed":97},{"x":4590,"y":984,"targetSpeed":97},{"x":4612,"y":1008,"targetSpeed":97},{"x":4631,"y":1034,"targetSpeed":97},{"x":4649,"y":1061,"targetSpeed":97},{"x":4664,"y":1090,"targetSpeed":97},{"x":4676,"y":1120,"targetSpeed":98},{"x":4687,"y":1151,"targetSpeed":99},{"x":4697,"y":1183,"targetSpeed":100},{"x":4707,"y":1215,"targetSpeed":102},{"x":4716,"y":1249,"targetSpeed":103},{"x":4722,"y":1283,"targetSpeed":104},{"x":4726,"y":1317,"targetSpeed":105},{"x":4727,"y":1352,"targetSpeed":106},{"x":4725,"y":1388,"targetSpeed":106},{"x":4720,"y":1423,"targetSpeed":106},{"x":4712,"y":1458,"targetSpeed":106},{"x":4702,"y":1491,"targetSpeed":107},{"x":4691,"y":1519,"targetSpeed":107},{"x":4676,"y":1551,"targetSpeed":107},{"x":4661,"y":1577,"targetSpeed":107},{"x":4644,"y":1602,"targetSpeed":108},{"x":4627,"y":1627,"targetSpeed":109},{"x":4610,"y":1652,"targetSpeed":110},{"x":4593,"y":1678,"targetSpeed":111},{"x":4577,"y":1704,"targetSpeed":111},{"x":4564,"y":1732,"targetSpeed":111},{"x":4552,"y":1761,"targetSpeed":111},{"x":4541,"y":1790,"targetSpeed":111},{"x":4533,"y":1819,"targetSpeed":111},{"x":4526,"y":1849,"targetSpeed":111},{"x":4520,"y":1880,"targetSpeed":112},{"x":4516,"y":1911,"targetSpeed":112},{"x":4514,"y":1942,"targetSpeed":112},{"x":4513,"y":1973,"targetSpeed":113},{"x":4513,"y":2005,"targetSpeed":114},{"x":4515,"y":2036,"targetSpeed":115},{"x":4519,"y":2068,"targetSpeed":115},{"x":4524,"y":2100,"targetSpeed":116},{"x":4529,"y":2132,"targetSpeed":117},{"x":4536,"y":2164,"targetSpeed":118},{"x":4544,"y":2197,"targetSpeed":119},{"x":4551,"y":2229,"targetSpeed":120},{"x":4559,"y":2261,"targetSpeed":121},{"x":4567,"y":2294,"targetSpeed":122},{"x":4577,"y":2327,"targetSpeed":122},{"x":4589,"y":2358,"targetSpeed":122},{"x":4602,"y":2389,"targetSpeed":120},{"x":4617,"y":2418,"targetSpeed":117},{"x":4632,"y":2447,"targetSpeed":117},{"x":4647,"y":2476,"targetSpeed":117},{"x":4662,"y":2504,"targetSpeed":114},{"x":4676,"y":2531,"targetSpeed":110},{"x":4690,"y":2558,"targetSpeed":110},{"x":4702,"y":2586,"targetSpeed":108},{"x":4714,"y":2620,"targetSpeed":106},{"x":4723,"y":2653,"targetSpeed":103},{"x":4730,"y":2686,"targetSpeed":100},{"x":4735,"y":2718,"targetSpeed":98},{"x":4737,"y":2751,"targetSpeed":98},{"x":4736,"y":2784,"targetSpeed":98},{"x":4733,"y":2816,"targetSpeed":97},{"x":4727,"y":2848,"targetSpeed":96},{"x":4719,"y":2878,"targetSpeed":93},{"x":4708,"y":2907,"targetSpeed":92},{"x":4695,"y":2936,"targetSpeed":93},{"x":4680,"y":2963,"targetSpeed":94},{"x":4662,"y":2989,"targetSpeed":94},{"x":4642,"y":3013,"targetSpeed":95},{"x":4620,"y":3036,"targetSpeed":95},{"x":4596,"y":3057,"targetSpeed":97},{"x":4571,"y":3078,"targetSpeed":98},{"x":4545,"y":3098,"targetSpeed":99},{"x":4517,"y":3117,"targetSpeed":100},{"x":4488,"y":3134,"targetSpeed":102},{"x":4457,"y":3149,"targetSpeed":103},{"x":4426,"y":3165,"targetSpeed":104},{"x":4395,"y":3180,"targetSpeed":106},{"x":4362,"y":3195,"targetSpeed":107},{"x":4329,"y":3208,"targetSpeed":108},{"x":4300,"y":3217,"targetSpeed":109},{"x":4271,"y":3224,"targetSpeed":110},{"x":4240,"y":3230,"targetSpeed":110},{"x":4210,"y":3233,"targetSpeed":111},{"x":4179,"y":3236,"targetSpeed":112},{"x":4147,"y":3238,"targetSpeed":113},{"x":4116,"y":3241,"targetSpeed":114},{"x":4084,"y":3243,"targetSpeed":115},{"x":4052,"y":3246,"targetSpeed":116},{"x":4020,"y":3248,"targetSpeed":117},{"x":3987,"y":3249,"targetSpeed":118},{"x":3954,"y":3248,"targetSpeed":118},{"x":3921,"y":3246,"targetSpeed":119},{"x":3888,"y":3244,"targetSpeed":120},{"x":3854,"y":3242,"targetSpeed":121},{"x":3820,"y":3241,"targetSpeed":122},{"x":3786,"y":3239,"targetSpeed":123},{"x":3752,"y":3237,"targetSpeed":124},{"x":3717,"y":3235,"targetSpeed":125},{"x":3682,"y":3233,"targetSpeed":126},{"x":3647,"y":3233,"targetSpeed":127},{"x":3612,"y":3234,"targetSpeed":128},{"x":3576,"y":3234,"targetSpeed":128},{"x":3540,"y":3235,"targetSpeed":129},{"x":3504,"y":3236,"targetSpeed":130},{"x":3468,"y":3236,"targetSpeed":131},{"x":3432,"y":3234,"targetSpeed":131},{"x":3395,"y":3231,"targetSpeed":132},{"x":3358,"y":3228,"targetSpeed":133},{"x":3321,"y":3224,"targetSpeed":134},{"x":3284,"y":3222,"targetSpeed":135},{"x":3254,"y":3221,"targetSpeed":135},{"x":3223,"y":3221,"targetSpeed":136},{"x":3186,"y":3220,"targetSpeed":137},{"x":3155,"y":3220,"targetSpeed":137},{"x":3125,"y":3220,"targetSpeed":138},{"x":3094,"y":3219,"targetSpeed":139},{"x":3063,"y":3219,"targetSpeed":139},{"x":3032,"y":3218,"targetSpeed":140},{"x":3001,"y":3218,"targetSpeed":140},{"x":2969,"y":3218,"targetSpeed":141},{"x":2938,"y":3217,"targetSpeed":142},{"x":2906,"y":3217,"targetSpeed":142},{"x":2874,"y":3217,"targetSpeed":143},{"x":2842,"y":3216,"targetSpeed":144},{"x":2810,"y":3216,"targetSpeed":144},{"x":2778,"y":3215,"targetSpeed":145},{"x":2746,"y":3215,"targetSpeed":145},{"x":2714,"y":3215,"targetSpeed":146},{"x":2681,"y":3214,"targetSpeed":146},{"x":2648,"y":3214,"targetSpeed":147},{"x":2616,"y":3213,"targetSpeed":148},{"x":2583,"y":3213,"targetSpeed":148},{"x":2550,"y":3213,"targetSpeed":149},{"x":2516,"y":3212,"targetSpeed":149},{"x":2483,"y":3212,"targetSpeed":150},{"x":2450,"y":3211,"targetSpeed":150},{"x":2417,"y":3211,"targetSpeed":151},{"x":2383,"y":3211,"targetSpeed":152},{"x":2349,"y":3210,"targetSpeed":152},{"x":2315,"y":3210,"targetSpeed":153},{"x":2281,"y":3209,"targetSpeed":153},{"x":2247,"y":3209,"targetSpeed":154},{"x":2213,"y":3209,"targetSpeed":154},{"x":2178,"y":3208,"targetSpeed":155},{"x":2144,"y":3208,"targetSpeed":155},{"x":2109,"y":3207,"targetSpeed":156},{"x":2074,"y":3207,"targetSpeed":156},{"x":2040,"y":3207,"targetSpeed":157},{"x":2005,"y":3206,"targetSpeed":157},{"x":1970,"y":3206,"targetSpeed":157},{"x":1934,"y":3205,"targetSpeed":157},{"x":1900,"y":3205,"targetSpeed":157},{"x":1865,"y":3204,"targetSpeed":157},{"x":1830,"y":3204,"targetSpeed":157},{"x":1795,"y":3204,"targetSpeed":157},{"x":1761,"y":3203,"targetSpeed":157},{"x":1726,"y":3203,"targetSpeed":157},{"x":1691,"y":3202,"targetSpeed":156},{"x":1656,"y":3202,"targetSpeed":156},{"x":1621,"y":3202,"targetSpeed":156}];

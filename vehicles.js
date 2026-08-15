/* =============================================================================
 *  vehicles.js  —  Kjøretøy-tegning (canvas)
 * =============================================================================
 *
 *  All visuell tegning av bilene bor her, samlet på ett sted. Motoren er
 *  canvas-basert, så dette er canvas-ekvivalenten til en «style-fil kun for
 *  kjøretøyene». Én funksjon per bil, tydelig merket med hvilken bil som er hva.
 *
 *  Koordinatsystem (lokalt, satt opp av app.js før hver bil tegnes):
 *    - Origo (0,0) er midt på bilen.
 *    - +x  = FRAM (nesen).            -x = BAK.
 *    - +y  = HØYRE side.              -y = VENSTRE side.
 *    - Konteksten er allerede translate-t til bilens posisjon og rotert til
 *      bilens vinkel, og skalert av kamera-zoom.
 *
 *  `geom` (g) inneholder ferdig utregnet geometri:
 *    hl          = halv lengde (pre.l / 2)
 *    hw          = halv bredde (pre.w / 2)
 *    wheelW      = hjulbredde (langs x)
 *    wheelThick  = hjultykkelse (langs y)
 *    wheelOffset = sideavstand til hjulene
 *    delta       = forhjulenes styrevinkel (radianer)
 *
 *  Offentlig API:
 *    Vehicles.draw(ctx, pre, pData, geom)
 *      Tegner riktig bil ut fra pre.type, og legger på felles lys til slutt.
 * ========================================================================== */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   *  Felles hjelpere
   * ------------------------------------------------------------------------ */

  // Standard 4 hjul (brukes av gatebilene: mx5, r34, s15, jaguar, generisk).
  // Bakhjulene er faste; forhjulene roterer med styrevinkelen `delta`.
  function drawStandardWheels(ctx, g) {
    const { hl, wheelW, wheelThick, wheelOffset, delta } = g;
    ctx.fillStyle = '#111';
    ctx.fillRect(-hl + 6 - wheelW / 2, -wheelOffset - wheelThick / 2, wheelW, wheelThick);
    ctx.fillRect(-hl + 6 - wheelW / 2, wheelOffset - wheelThick / 2, wheelW, wheelThick);
    ctx.save(); ctx.translate(hl - 8, -wheelOffset); ctx.rotate(delta);
    ctx.fillRect(-wheelW / 2, -wheelThick / 2, wheelW, wheelThick); ctx.restore();
    ctx.save(); ctx.translate(hl - 8, wheelOffset); ctx.rotate(delta);
    ctx.fillRect(-wheelW / 2, -wheelThick / 2, wheelW, wheelThick); ctx.restore();
  }

  // Felles lys, tegnet oppå ALLE biler: gule frontlys (fram) + røde baklys (bak).
  // Baklysene lyser sterkere når bilen bremser (pData.appliesBrake).
  function drawCommonLights(ctx, pre, pData, g) {
    const { hl, hw } = g;
    ctx.fillStyle = '#f1c40f';
    ctx.beginPath();
    ctx.roundRect(hl - 3, -hw + 3, 4, 5, 2);
    ctx.roundRect(hl - 3, hw - 8, 4, 5, 2);
    ctx.fill();
    ctx.fillStyle = pData.appliesBrake ? '#ff3333' : '#8b0000';
    ctx.shadowColor = pData.appliesBrake ? '#ff0000' : 'transparent';
    ctx.shadowBlur = pData.appliesBrake ? 10 : 0;
    ctx.beginPath();
    ctx.roundRect(-hl - 1, -hw + 3, 3, 5, 1);
    ctx.roundRect(-hl - 1, hw - 8, 3, 5, 1);
    ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ==========================================================================
   *  GO-KART            (type: 'gokart')  —  RWD racing-kart
   * --------------------------------------------------------------------------
   *  Detaljert ovenfra-og-ned-kart: chassis, motor + radiator, eksosglød,
   *  fargede sidekasser og nesekåpe (spillerfarge), frontbøyle, sete, og fører
   *  med skuldre, armer, hansker, ratt og hjelm med visir.
   * ======================================================================== */
  function drawGokart(ctx, pre, pData, g) {
    const { hl, hw, delta } = g;
    const body = pData.color || '#e63946'; // fargbart karosseri (sidekasser + nese)

    // ---- Bakaksling (tynn tverrstang bak) ----
    ctx.fillStyle = '#333';
    ctx.fillRect(-hl + 1, -hw - 1, 1.6, hw * 2 + 2);

    // ---- Hjul: bakhjul brede/faste, forhjul smalere og roterer med styringen ----
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.roundRect(-hl + 1, -hw - 2.6, hl * 0.7, 3.2, 1.2); ctx.fill(); // venstre bak
    ctx.beginPath(); ctx.roundRect(-hl + 1, hw - 0.6, hl * 0.7, 3.2, 1.2); ctx.fill();  // høyre bak
    ctx.save(); ctx.translate(hl - 3, -hw - 1); ctx.rotate(delta);
    ctx.beginPath(); ctx.roundRect(-hl * 0.28, -1.3, hl * 0.56, 2.6, 1); ctx.fill(); ctx.restore(); // venstre fram
    ctx.save(); ctx.translate(hl - 3, hw + 1); ctx.rotate(delta);
    ctx.beginPath(); ctx.roundRect(-hl * 0.28, -1.3, hl * 0.56, 2.6, 1); ctx.fill(); ctx.restore(); // høyre fram

    // ---- Gulvplate / chassis (mørk base) ----
    const floor = ctx.createLinearGradient(0, -hw, 0, hw);
    floor.addColorStop(0, '#15161f'); floor.addColorStop(0.5, '#2b2d42'); floor.addColorStop(1, '#15161f');
    ctx.fillStyle = floor;
    ctx.beginPath(); ctx.roundRect(-hl + 2, -hw * 0.65, 2 * hl - 4, hw * 1.3, 2); ctx.fill();

    // ---- Motorblokk bak (forskjøvet til høyre = asymmetrisk, som ekte kart) ----
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.roundRect(-hl + 2, 0.4, hl * 0.5, hw * 0.8, 1.5); ctx.fill();
    const eng = ctx.createLinearGradient(-hl + 2, 0, -hl + 2 + hl * 0.5, 0);
    eng.addColorStop(0, '#444'); eng.addColorStop(0.5, '#666'); eng.addColorStop(1, '#333');
    ctx.fillStyle = eng;
    ctx.beginPath(); ctx.roundRect(-hl + 2.5, 0.9, hl * 0.45, hw * 0.65, 1); ctx.fill();

    // ---- Radiator (venstre side, med kjøleribber) ----
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.roundRect(-hl + 2, -hw * 0.95, hl * 0.35, hw * 0.5, 1); ctx.fill();
    ctx.strokeStyle = '#555'; ctx.lineWidth = 0.4;
    for (let i = 1; i < 4; i++) {
      const yy = -hw * 0.95 + i * (hw * 0.5 / 4);
      ctx.beginPath(); ctx.moveTo(-hl + 2, yy); ctx.lineTo(-hl + 2 + hl * 0.35, yy); ctx.stroke();
    }

    // ---- Eksosrør + glødende eksosflamme (helt bak) ----
    ctx.fillStyle = '#2b2b2b';
    ctx.fillRect(-hl + 0.5, hw * 0.2, 2.5, hw * 0.5);
    const glow = ctx.createRadialGradient(-hl - 0.5, hw * 0.45, 0, -hl - 0.5, hw * 0.45, 3);
    glow.addColorStop(0, 'rgba(255,84,0,0.95)'); glow.addColorStop(1, 'rgba(255,84,0,0)');
    ctx.fillStyle = glow;
    ctx.beginPath(); ctx.arc(-hl - 0.5, hw * 0.45, 3, 0, Math.PI * 2); ctx.fill();

    // ---- Sidekasser (fargede, venstre + høyre) ----
    for (const sign of [-1, 1]) {
      const yc = sign * hw * 0.8;
      const grd = ctx.createRadialGradient(0, yc, 1, 0, yc, hw * 0.9);
      grd.addColorStop(0, body); grd.addColorStop(0.7, body); grd.addColorStop(1, 'rgba(0,0,0,0.35)');
      ctx.fillStyle = grd;
      ctx.beginPath(); ctx.roundRect(-hl * 0.55, yc - hw * 0.32, hl, hw * 0.64, 3); ctx.fill();
    }

    // ---- Nesekåpe (farget, foran) ----
    const nose = ctx.createRadialGradient(hl * 0.7, 0, 1, hl * 0.7, 0, hw * 1.1);
    nose.addColorStop(0, body); nose.addColorStop(0.7, body); nose.addColorStop(1, 'rgba(0,0,0,0.4)');
    ctx.fillStyle = nose;
    ctx.beginPath(); ctx.roundRect(hl * 0.35, -hw * 0.7, hl * 0.7, hw * 1.4, 3.5); ctx.fill();

    // ---- Frontbøyle (bumper hoop) ----
    ctx.strokeStyle = '#3a3a3a'; ctx.lineWidth = 1.6;
    ctx.beginPath(); ctx.arc(hl * 0.55, 0, hw, -0.7, 0.7); ctx.stroke();

    // ---- Sete ----
    ctx.fillStyle = '#141414';
    ctx.beginPath(); ctx.ellipse(-hl * 0.15, 0, hl * 0.32, hw * 0.62, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Fører: skuldre / bryst ----
    const torso = ctx.createRadialGradient(-hl * 0.05, 0, 1, -hl * 0.05, 0, hw * 0.9);
    torso.addColorStop(0, '#0a4fa0'); torso.addColorStop(0.6, '#023e8a'); torso.addColorStop(1, 'rgba(0,29,61,0)');
    ctx.fillStyle = torso;
    ctx.beginPath(); ctx.ellipse(-hl * 0.05, 0, hl * 0.28, hw * 0.7, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Fører: armer (strekker seg fram mot rattet) ----
    ctx.fillStyle = '#023e8a';
    ctx.beginPath(); ctx.ellipse(hl * 0.18, -hw * 0.5, hl * 0.28, hw * 0.22, -0.5, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(hl * 0.18, hw * 0.5, hl * 0.28, hw * 0.22, 0.5, 0, Math.PI * 2); ctx.fill();

    // ---- Ratt + nav ----
    ctx.strokeStyle = '#111'; ctx.lineWidth = 1.4;
    ctx.beginPath(); ctx.arc(hl * 0.32, 0, hw * 0.5, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#555';
    ctx.beginPath(); ctx.arc(hl * 0.32, 0, 1, 0, Math.PI * 2); ctx.fill();

    // ---- Fører: hansker (på rattet) ----
    ctx.fillStyle = '#000';
    ctx.beginPath(); ctx.arc(hl * 0.32, -hw * 0.5, 1.4, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(hl * 0.32, hw * 0.5, 1.4, 0, Math.PI * 2); ctx.fill();

    // ---- Hjelm + visir (visiret peker framover) ----
    const helmR = hw * 0.62;
    const helm = ctx.createRadialGradient(-helmR * 0.3, -helmR * 0.3, 0.5, 0, 0, helmR);
    helm.addColorStop(0, '#ffffff'); helm.addColorStop(0.6, '#e0e0e0'); helm.addColorStop(1, '#9a9a9a');
    ctx.fillStyle = helm;
    ctx.beginPath(); ctx.arc(0, 0, helmR, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#0a0a0a';
    ctx.beginPath(); ctx.ellipse(helmR * 0.55, 0, helmR * 0.35, helmR * 0.6, 0, 0, Math.PI * 2); ctx.fill();
  }

  /* ==========================================================================
   *  FORMEL 1           (type: 'f1')  —  åpen enseter med brede dekk
   * ======================================================================== */
  function drawF1(ctx, pre, pData, g) {
    const { hl, hw, wheelW, wheelThick, delta } = g;
    ctx.fillStyle = '#111';
    ctx.fillRect(-hl + 8 - wheelW / 2, -hw, wheelW, wheelThick * 1.5);
    ctx.fillRect(-hl + 8 - wheelW / 2, hw - wheelThick * 1.5, wheelW, wheelThick * 1.5);
    ctx.save(); ctx.translate(hl - 6, -hw); ctx.rotate(delta);
    ctx.fillRect(-wheelW / 2, 0, wheelW, wheelThick * 1.5); ctx.restore();
    ctx.save(); ctx.translate(hl - 6, hw); ctx.rotate(delta);
    ctx.fillRect(-wheelW / 2, -wheelThick * 1.5, wheelW, wheelThick * 1.5); ctx.restore();
    ctx.fillStyle = pData.color || '#e74c3c';
    ctx.beginPath(); ctx.roundRect(-hl + 6, -hw * 0.35, pre.l - 12, pre.w * 0.7, 4); ctx.fill();
    ctx.fillStyle = '#111'; ctx.fillRect(2, -hw * 0.25, 10, pre.w * 0.5);
    ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, 0, 4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.fillRect(hl - 4, -hw * 0.9, 3, pre.w * 1.8);
    ctx.fillRect(-hl, -hw * 0.7, 4, pre.w * 1.4);
  }

  /* ==========================================================================
   *  MAZDA MX-5         (type: 'mx5')  —  liten RWD roadster
   * ======================================================================== */
  function drawMX5(ctx, pre, pData, g) {
    const { hl, hw } = g;
    drawStandardWheels(ctx, g);
    ctx.fillStyle = pData.color || '#c0392b';
    ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill();
    ctx.fillStyle = '#222';
    ctx.beginPath(); ctx.roundRect(-hl * 0.1, -hw + 3, pre.l * 0.35, pre.w - 6, 4); ctx.fill();
  }

  /* ==========================================================================
   *  NISSAN SKYLINE R34 (type: 'r34')  —  AWD, brukes også av R32
   * ======================================================================== */
  function drawR34(ctx, pre, pData, g) {
    const { hl, hw, delta } = g;
    const body = pData.color || '#20489e'; // fargbart karosseri (default: GT-R-blå)
    const braking = pData.appliesBrake;

    // Boksete GT-R-silhuett: rette flanker, lett avrundede hjørner, flat hekk.
    function bodyPath() {
      const rF = hw * 0.55, rR = hw * 0.32;
      ctx.beginPath();
      ctx.moveTo(hl - rF, hw);
      ctx.lineTo(-hl + rR, hw);
      ctx.quadraticCurveTo(-hl, hw, -hl, hw - rR);
      ctx.lineTo(-hl, -hw + rR);
      ctx.quadraticCurveTo(-hl, -hw, -hl + rR, -hw);
      ctx.lineTo(hl - rF, -hw);
      ctx.quadraticCurveTo(hl, -hw, hl, -hw + rF); // rundet front-hjørne
      ctx.lineTo(hl, hw - rF);
      ctx.quadraticCurveTo(hl, hw, hl - rF, hw);
      ctx.closePath();
    }

    // ---- Hjul (mørke, tucket under karosseriet; forhjul styrer) ----
    const tw = hl * 0.2, tt = 3.2;
    ctx.fillStyle = '#0a0a0a';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(-hl * 0.66, s * hw);
      ctx.beginPath(); ctx.roundRect(-tw / 2, -tt / 2, tw, tt, 1.3); ctx.fill(); ctx.restore();
      ctx.save(); ctx.translate(hl * 0.62, s * hw); ctx.rotate(delta);
      ctx.beginPath(); ctx.roundRect(-tw / 2, -tt / 2, tw, tt, 1.3); ctx.fill(); ctx.restore();
    }

    // ---- Karosseri (spillerfarge) ----
    bodyPath();
    ctx.fillStyle = body;
    ctx.fill();

    // ---- Rund skyggelegging (funker på alle farger) ----
    ctx.save();
    bodyPath(); ctx.clip();
    const shade = ctx.createLinearGradient(0, -hw, 0, hw);
    shade.addColorStop(0, 'rgba(0,0,0,0.40)');
    shade.addColorStop(0.3, 'rgba(255,255,255,0.10)');
    shade.addColorStop(0.5, 'rgba(255,255,255,0.15)');
    shade.addColorStop(0.7, 'rgba(255,255,255,0.10)');
    shade.addColorStop(1, 'rgba(0,0,0,0.40)');
    ctx.fillStyle = shade; ctx.fillRect(-hl, -hw, 2 * hl, 2 * hw);
    ctx.restore();

    // ---- Karosseri-kontur ----
    bodyPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();

    // ---- Panser-scoop (ikonisk, med luftespalter) ----
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath(); ctx.roundRect(hl * 0.5, -hw * 0.24, hl * 0.2, hw * 0.48, 1.5); ctx.fill();
    ctx.strokeStyle = 'rgba(120,120,120,0.5)'; ctx.lineWidth = 0.5;
    for (let i = 1; i < 3; i++) {
      const xx = hl * 0.5 + i * (hl * 0.2 / 3);
      ctx.beginPath(); ctx.moveTo(xx, -hw * 0.22); ctx.lineTo(xx, hw * 0.22); ctx.stroke();
    }

    // ---- Frontgrill-antydning + GT-R-emblem ----
    ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(hl * 0.93, -hw * 0.45); ctx.lineTo(hl * 0.93, hw * 0.45); ctx.stroke();
    ctx.fillStyle = '#c0392b';
    ctx.beginPath(); ctx.ellipse(hl * 0.88, 0, 1.1, 1.8, 0, 0, Math.PI * 2); ctx.fill();

    // ---- Diskré frontlys i hjørnene (ingen store gule prikker) ----
    ctx.fillStyle = 'rgba(240,245,255,0.22)';
    ctx.beginPath(); ctx.roundRect(hl * 0.8, hw * 0.42, hl * 0.09, hw * 0.32, 0.8); ctx.fill();
    ctx.beginPath(); ctx.roundRect(hl * 0.8, -hw * 0.42 - hw * 0.32, hl * 0.09, hw * 0.32, 0.8); ctx.fill();

    // ---- Kupé: mørk frontrute + bakrute, kroppsfarget tak imellom, mørkt sideglass ----
    // Sammenhengende mørkt glass først ...
    ctx.fillStyle = '#0c0e13';
    ctx.beginPath(); ctx.roundRect(-hl * 0.6, -hw * 0.66, hl * 1.05, hw * 1.32, hw * 0.35); ctx.fill();
    // ... så kroppsfarget takplate på midten (deler frontrute/bakrute)
    ctx.fillStyle = body;
    ctx.beginPath(); ctx.roundRect(-hl * 0.16, -hw * 0.6, hl * 0.28, hw * 1.2, hw * 0.2); ctx.fill();
    // lett skygge på taket
    ctx.save();
    ctx.beginPath(); ctx.roundRect(-hl * 0.16, -hw * 0.6, hl * 0.28, hw * 1.2, hw * 0.2); ctx.clip();
    const roofSh = ctx.createLinearGradient(0, -hw * 0.6, 0, hw * 0.6);
    roofSh.addColorStop(0, 'rgba(0,0,0,0.35)'); roofSh.addColorStop(0.5, 'rgba(255,255,255,0.10)'); roofSh.addColorStop(1, 'rgba(0,0,0,0.35)');
    ctx.fillStyle = roofSh; ctx.fillRect(-hl * 0.16, -hw * 0.6, hl * 0.28, hw * 1.2); ctx.restore();
    // glass-refleks
    ctx.strokeStyle = 'rgba(255,255,255,0.08)'; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(hl * 0.35, -hw * 0.2); ctx.lineTo(hl * 0.15, -hw * 0.18); ctx.stroke();

    // ---- Sidespeil (foran, stikker ut) ----
    for (const s of [-1, 1]) {
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(hl * 0.4, s * (hw + 1.3), hl * 0.05, hw * 0.18, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(hl * 0.4, s * (hw + 1.7), hl * 0.03, hw * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ---- Dørskiller ----
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.5;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(-hl * 0.16, s * hw * 0.68); ctx.lineTo(-hl * 0.16, s * hw * 0.98); ctx.stroke();
    }

    // ---- Ikonisk bakvinge: tydelig bak hekken (skygge, stag, blad, endeplater) ----
    ctx.fillStyle = 'rgba(0,0,0,0.28)'; // skygge bak vingen
    ctx.beginPath(); ctx.roundRect(-hl * 1.24, -hw * 1.2, hw * 0.46, hw * 2.4, 2.5); ctx.fill();
    ctx.fillStyle = '#141414'; // stag fra bagasjelokk ut til vingen
    for (const s of [-1, 1]) { ctx.fillRect(-hl * 1.06, s * hw * 0.55 - 1.3, hw * 0.66, 2.6); }
    ctx.fillStyle = body; // vingeblad (litt bredere enn bilen, sitter klart bak hekken)
    ctx.beginPath(); ctx.roundRect(-hl * 1.22, -hw * 1.18, hw * 0.4, hw * 2.36, 2.5); ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.8; ctx.stroke();
    ctx.fillStyle = '#111'; // endeplater (stikker litt ut i sidene)
    ctx.fillRect(-hl * 1.24, -hw * 1.22, hw * 0.48, 2.4);
    ctx.fillRect(-hl * 1.24, hw * 1.22 - 2.4, hw * 0.48, 2.4);

    // ---- Bakre støtfanger + fire runde baklys (på hekken, foran vingen; lyser ved bremsing) ----
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath(); ctx.roundRect(-hl * 0.98, -hw * 0.82, hl * 0.06, hw * 1.64, 1.5); ctx.fill();
    ctx.fillStyle = braking ? '#ff4040' : '#8e2020';
    ctx.shadowColor = braking ? '#ff0000' : 'transparent';
    ctx.shadowBlur = braking ? 9 : 0;
    for (const ly of [-hw * 0.62, -hw * 0.28, hw * 0.28, hw * 0.62]) {
      ctx.beginPath(); ctx.arc(-hl * 0.86, ly, hw * 0.13, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
  }

  /* ==========================================================================
   *  NISSAN SILVIA S15  (type: 's15')  —  RWD drift-bil
   * ======================================================================== */
  function drawS15(ctx, pre, pData, g) {
    const { hl, hw } = g;
    drawStandardWheels(ctx, g);
    ctx.fillStyle = pData.color || '#8e44ad';
    ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 6); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-hl * 0.1, -hw + 2, pre.l * 0.45, pre.w - 4, 4); ctx.fill();
    ctx.fillStyle = '#f39c12';
    ctx.fillRect(-hl - 4, -hw - 2, 5, pre.w + 4); // bakvinge
  }

  /* ==========================================================================
   *  JAGUAR I-PACE      (type: 'jaguar')  —  AWD elbil (standardbil)
   * ======================================================================== */
  function drawJaguar(ctx, pre, pData, g) {
    const { hl, hw, delta } = g;
    const body = pData.color || '#1abc9c'; // fargbart karosseri (spillerfarge)

    // Karosseri-silhuett: rundet nese, full bredde over dørene, avsmalnende hekk.
    function bodyPath() {
      ctx.beginPath();
      ctx.moveTo(hl, 0);
      ctx.bezierCurveTo(hl, hw * 0.6, hl * 0.82, hw, hl * 0.45, hw);       // front-høyre skulder
      ctx.lineTo(-hl * 0.5, hw);                                           // høyre flanke
      ctx.bezierCurveTo(-hl * 0.85, hw, -hl, hw * 0.72, -hl, 0);           // hekk høyre
      ctx.bezierCurveTo(-hl, -hw * 0.72, -hl * 0.85, -hw, -hl * 0.5, -hw); // hekk venstre
      ctx.lineTo(hl * 0.45, -hw);                                          // venstre flanke
      ctx.bezierCurveTo(hl * 0.82, -hw, hl, -hw * 0.6, hl, 0);             // front-venstre skulder
      ctx.closePath();
    }

    // ---- Hjul (mørke, delvis skjult under karosseriet; forhjul styrer) ----
    const tw = hl * 0.2, tt = 3.4; // hjul-lengde (langs x) og -tykkelse (langs y)
    ctx.fillStyle = '#0a0a0a';
    for (const s of [-1, 1]) {
      ctx.save(); ctx.translate(-hl * 0.72, s * hw);
      ctx.beginPath(); ctx.roundRect(-tw / 2, -tt / 2, tw, tt, 1.4); ctx.fill(); ctx.restore(); // bakhjul (faste)
      ctx.save(); ctx.translate(hl * 0.6, s * hw); ctx.rotate(delta);
      ctx.beginPath(); ctx.roundRect(-tw / 2, -tt / 2, tw, tt, 1.4); ctx.fill(); ctx.restore(); // forhjul (styrer)
    }

    // ---- Karosseri (spillerfarge) ----
    bodyPath();
    ctx.fillStyle = body;
    ctx.fill();

    // ---- Rund skyggelegging (lys midt, mørk mot kantene — funker på alle farger) ----
    ctx.save();
    bodyPath(); ctx.clip();
    const shade = ctx.createLinearGradient(0, -hw, 0, hw);
    shade.addColorStop(0, 'rgba(0,0,0,0.42)');
    shade.addColorStop(0.28, 'rgba(255,255,255,0.10)');
    shade.addColorStop(0.5, 'rgba(255,255,255,0.16)');
    shade.addColorStop(0.72, 'rgba(255,255,255,0.10)');
    shade.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = shade; ctx.fillRect(-hl, -hw, 2 * hl, 2 * hw);
    const lg = ctx.createLinearGradient(hl, 0, -hl, 0); // litt mørkere i front/hekk
    lg.addColorStop(0, 'rgba(0,0,0,0.28)');
    lg.addColorStop(0.18, 'rgba(0,0,0,0)');
    lg.addColorStop(0.85, 'rgba(0,0,0,0)');
    lg.addColorStop(1, 'rgba(0,0,0,0.30)');
    ctx.fillStyle = lg; ctx.fillRect(-hl, -hw, 2 * hl, 2 * hw);
    ctx.restore();

    // ---- Karosseri-kontur ----
    bodyPath();
    ctx.strokeStyle = 'rgba(0,0,0,0.55)'; ctx.lineWidth = 0.8; ctx.stroke();

    // ---- Creases på panseret (mot front) ----
    ctx.strokeStyle = 'rgba(0,0,0,0.22)'; ctx.lineWidth = 0.6;
    ctx.beginPath(); ctx.moveTo(hl * 0.5, hw * 0.36); ctx.lineTo(hl * 0.9, hw * 0.24); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(hl * 0.5, -hw * 0.36); ctx.lineTo(hl * 0.9, -hw * 0.24); ctx.stroke();

    // ---- Dørskiller langs sidene ----
    ctx.strokeStyle = 'rgba(0,0,0,0.28)'; ctx.lineWidth = 0.5;
    for (const s of [-1, 1]) {
      ctx.beginPath(); ctx.moveTo(hl * 0.02, s * hw * 0.62); ctx.lineTo(hl * 0.02, s * hw * 0.97); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-hl * 0.28, s * hw * 0.6); ctx.lineTo(-hl * 0.28, s * hw * 0.95); ctx.stroke();
    }

    // ---- Sidespeil (foran, stikker ut) ----
    for (const s of [-1, 1]) {
      ctx.fillStyle = body;
      ctx.beginPath(); ctx.ellipse(hl * 0.44, s * (hw + 1.4), hl * 0.05, hw * 0.16, s * 0.2, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = 0.5; ctx.stroke();
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      ctx.beginPath(); ctx.ellipse(hl * 0.44, s * (hw + 1.9), hl * 0.03, hw * 0.1, 0, 0, Math.PI * 2); ctx.fill();
    }

    // ---- Glasstak (mørkt, sammenhengende: frontrute -> tak -> bakrute) ----
    ctx.beginPath();
    ctx.moveTo(hl * 0.52, 0);
    ctx.bezierCurveTo(hl * 0.46, hw * 0.5, hl * 0.22, hw * 0.62, 0, hw * 0.6);
    ctx.lineTo(-hl * 0.32, hw * 0.55);
    ctx.bezierCurveTo(-hl * 0.52, hw * 0.5, -hl * 0.58, hw * 0.25, -hl * 0.58, 0);
    ctx.bezierCurveTo(-hl * 0.58, -hw * 0.25, -hl * 0.52, -hw * 0.5, -hl * 0.32, -hw * 0.55);
    ctx.lineTo(0, -hw * 0.6);
    ctx.bezierCurveTo(hl * 0.22, -hw * 0.62, hl * 0.46, -hw * 0.5, hl * 0.52, 0);
    ctx.closePath();
    const glass = ctx.createLinearGradient(hl * 0.5, 0, -hl * 0.6, 0);
    glass.addColorStop(0, '#20242c'); glass.addColorStop(0.5, '#0b0d12'); glass.addColorStop(1, '#181c22');
    ctx.fillStyle = glass; ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 0.6; ctx.stroke();

    // ---- Refleks-stripe på taket + antydet frontrute-skille ----
    ctx.strokeStyle = 'rgba(255,255,255,0.10)'; ctx.lineWidth = 1.2;
    ctx.beginPath(); ctx.moveTo(hl * 0.3, -hw * 0.18); ctx.lineTo(-hl * 0.4, -hw * 0.12); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)'; ctx.lineWidth = 0.5;
    ctx.beginPath(); ctx.moveTo(hl * 0.5, hw * 0.42); ctx.lineTo(hl * 0.5, -hw * 0.42); ctx.stroke();

    // ---- Integrerte, diskré frontlys (antydning, ingen store gule prikker) ----
    ctx.fillStyle = 'rgba(255,255,255,0.16)';
    ctx.beginPath(); ctx.roundRect(hl * 0.82, hw * 0.24, hl * 0.09, 1.4, 0.7); ctx.fill();
    ctx.beginPath(); ctx.roundRect(hl * 0.82, -hw * 0.24 - 1.4, hl * 0.09, 1.4, 0.7); ctx.fill();

    // ---- Baklys-stripe over hekken (lyser rødt ved bremsing) ----
    const braking = pData.appliesBrake;
    ctx.fillStyle = braking ? '#ff3b3b' : '#7a1414';
    ctx.shadowColor = braking ? '#ff0000' : 'transparent';
    ctx.shadowBlur = braking ? 9 : 0;
    ctx.beginPath(); ctx.roundRect(-hl * 0.82 - 0.9, -hw * 0.6, 1.8, hw * 1.2, 0.9); ctx.fill();
    ctx.shadowBlur = 0;
  }

  /* ==========================================================================
   *  GENERISK BIL       (alle andre typer uten egen tegning)
   * ======================================================================== */
  function drawGeneric(ctx, pre, pData, g) {
    const { hl, hw } = g;
    drawStandardWheels(ctx, g);
    ctx.fillStyle = pData.color || '#e67e22';
    ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-hl * 0.1, -hw + 3, pre.l * 0.4, pre.w - 6, 4); ctx.fill();
  }

  /* --------------------------------------------------------------------------
   *  Dispatcher — velger riktig tegnefunksjon ut fra pre.type, og legger
   *  til slutt på de felles frontlysene/baklysene på alle biler.
   * ------------------------------------------------------------------------ */
  function draw(ctx, pre, pData, g) {
    switch (pre.type) {
      case 'f1':     drawF1(ctx, pre, pData, g); break;
      case 'gokart': drawGokart(ctx, pre, pData, g); break;
      case 'mx5':    drawMX5(ctx, pre, pData, g); break;
      case 'r34':    drawR34(ctx, pre, pData, g); break;
      case 's15':    drawS15(ctx, pre, pData, g); break;
      case 'jaguar': drawJaguar(ctx, pre, pData, g); break;
      default:       drawGeneric(ctx, pre, pData, g); break;
    }
    // Jaguar og R34 tegner sine egne integrerte lys; øvrige biler bruker felles lys.
    if (pre.type !== 'jaguar' && pre.type !== 'r34') drawCommonLights(ctx, pre, pData, g);
  }

  window.Vehicles = { draw };
})();

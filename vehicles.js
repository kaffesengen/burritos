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
    const { hl, hw } = g;
    drawStandardWheels(ctx, g);
    ctx.fillStyle = pData.color || '#2980b9';
    ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 5); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-hl * 0.05, -hw + 2, pre.l * 0.4, pre.w - 4, 3); ctx.fill();
    ctx.fillStyle = '#2980b9';
    ctx.fillRect(-hl - 3, -hw, 4, pre.w); // bakvinge
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
    const { hl, hw } = g;
    drawStandardWheels(ctx, g);
    ctx.fillStyle = pData.color || '#1abc9c';
    ctx.beginPath(); ctx.roundRect(-hl, -hw, pre.l, pre.w, 8); ctx.fill();
    ctx.fillStyle = '#111';
    ctx.beginPath(); ctx.roundRect(-hl * 0.15, -hw + 3, pre.l * 0.5, pre.w - 6, 6); ctx.fill();
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
    drawCommonLights(ctx, pre, pData, g);
  }

  window.Vehicles = { draw };
})();

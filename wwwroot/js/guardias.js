// guardias.js — escena de la Guardia Real en el mapa (hitbox PEL2) y la pelea.
//
// Igual que obj_boysnightout de Undertale:
//   "¡Ey! ¡Vos! ¡Quieto ahí!" -> RG 01 (conejo) y RG 02 (dragón) llegan caminando
//   desde la derecha, te hablan, te acompañan unos pasos, se dan cuenta de que
//   sos el humano de la remera a rayas... y empieza la pelea (EnemyFight "guardias").
//
// En esta pelea no se puede morir ("WHO DECIDED THAT?") y si tenés menos de LV 12
// aparece "DIOS TE AYUDA" y te sube a 12. Cuando termina, no se repite (ESTADO.guardiaReal).
//
// También arranca la pelea contra Undyne la Inmortal (hitbox PEL3): window.Undyne.iniciar().
//
// Controles del diálogo: Z / ENTER / ESPACIO seguir · X / SHIFT mostrar todo el texto

(function () {
  "use strict";
  const BASE = "/Battle/Guardias/";
  const ATLAS = {"rg/bara02hurt":[0,0,224,210],"rg/bara01hurt":[226,0,224,202],"rg/blconsm":[452,0,99,108],"rg/blconsm2":[553,0,99,108],"rg/barafalchion":[654,0,21,64],"ow/rabbit_l1":[677,0,20,50],"ow/rabbit_l3":[699,0,20,50],"ow/rabbit_r1":[721,0,20,50],"ow/rabbit_r3":[743,0,20,50],"ow/rabbit_l0":[765,0,22,49],"ow/rabbit_l2":[789,0,22,49],"ow/rabbit_r0":[813,0,22,49],"ow/rabbit_r2":[837,0,22,49],"ow/rabbit_d":[861,0,34,48],"ow/dragon_d":[897,0,34,48],"ow/dragon_l1":[933,0,18,48],"ow/dragon_l3":[953,0,18,48],"ow/dragon_r1":[973,0,18,48],"ow/dragon_r3":[993,0,18,48],"rg/barahead2":[0,212,42,47],"ow/dragon_l0":[44,212,22,47],"ow/dragon_l2":[68,212,22,47],"ow/dragon_r0":[92,212,22,47],"ow/dragon_r2":[116,212,22,47],"rg/baraarmor":[140,212,64,45],"rg/greenarmor":[206,212,45,45],"rg/barahead1":[253,212,34,36],"rg/barashirtless":[289,212,48,35],"rg/baralegs":[339,212,53,21],"rg/barafist":[394,212,16,16],"rg/barashoes":[412,212,52,16],"rg/baraball":[466,212,15,15],"rg/carrotshot":[483,212,15,15],"rg/stardrop":[500,212,15,15],"rg/sweat":[517,212,6,6]};
  const img = new Image(); let lista = false;
  img.onload = () => lista = true; img.src = BASE + "guardias.png";

  const ESC = 0.7;            // escala de los sprites (el jugador mide 20 px en vez de los 29 del original)
  const VEL = 4;              // px por cuadro (a 30 fps) cuando caminan
  let activo = false, acc = 0;
  let pasos = [], i = -1, t = 0;
  let dlg = null;             // {pags, n, cur, alPag}
  let guardias = null;        // {conejo, dragon}
  let jugadorCamina = false;

  // ---------- sonido del texto (voz de Undertale) ----------
  let actx = null, voz = null;
  function initAudio() {
    if (actx) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = new AC();
    fetch(BASE + "snd/snd_txt.ogg").then(r => r.arrayBuffer()).then(b => new Promise((ok, er) => actx.decodeAudioData(b, ok, er))).then(d => { voz = d; }).catch(() => { });
  }
  window.addEventListener("keydown", initAudio, { capture: true, once: true });
  function sonarVoz() {
    if (!actx || !voz) return;
    try { const s = actx.createBufferSource(), g = actx.createGain(); g.gain.value = 0.45; s.buffer = voz; s.connect(g); g.connect(actx.destination); s.start(); } catch (e) { }
  }

  // ---------- guardias en el mapa ----------
  function nuevo(tipo, x, y) { return { tipo, x, y, dir: "l", mov: false, fr: 0, ft: 0 }; }
  function sprGuardia(g) {
    if (g.dir === "d") return "ow/" + g.tipo + "_d";
    return "ow/" + g.tipo + "_" + g.dir + (g.mov ? g.fr : 0);
  }
  function pieJugador() { return { x: player.x + player.width / 2, y: player.y + player.height }; }
  function aparecer() {
    const p = pieJugador();
    const x0 = camera.x + canvas.width + 30;
    guardias = { conejo: nuevo("rabbit", x0, p.y - 10), dragon: nuevo("dragon", x0 + 11, p.y + 6) };
    for (const g of lista2()) { g.mov = true; g.vx = -VEL; }
  }
  const lista2 = () => guardias ? [guardias.conejo, guardias.dragon] : [];
  function llegaron() {
    const p = pieJugador();
    if (guardias.dragon.x < p.x + 55 && guardias.conejo.x < p.x + 55) {
      for (const g of lista2()) { g.mov = false; g.vx = 0; g.fr = 0; }
      return true;
    }
    return false;
  }
  function caminarA(dir) { for (const g of lista2()) { g.dir = dir; g.mov = true; g.vx = dir === "r" ? VEL : -VEL; } }
  function frenarGuardias() { for (const g of lista2()) { g.mov = false; g.vx = 0; g.fr = 0; } }

  // ---------- guion (obj_boysnightout) ----------
  function armarGuion() {
    const C = () => guardias.conejo, D = () => guardias.dragon;
    return [
      { dialogo: ["* ¡Ey! ¡Vos!\n* ¡Quieto ahí!"] },
      { fn: aparecer },
      { hasta: llegaron },
      { dialogo: [
        "* Recibimos, o sea, un dato\n  anónimo sobre un humano con\n  una remera a rayas.",
        "* Nos dijeron que andaba dando\n  vueltas por acá ahora\n  mismo...",
        "* Da miedo, ¿no?",
        "* Bueno, tranqui.\n* Te vamos a llevar a un lugar\n  seguro, ¿sí?"] },
      { fn: () => { caminarA("r"); jugadorCamina = true; } },
      { esperar: 30 },
      { fn: frenarGuardias },
      { esperar: 3 },
      { fn: () => { jugadorCamina = false; frameActual = 0; } },
      { esperar: 20 },
      { fn: () => { C().dir = "d"; } },
      { dialogo: ["* ... ¿Eh?\n* ¿Qué pasa, bro?", "* ¿La remera que tiene puesta?", "* ... O sea, ¿qué tiene?"] },
      { fn: () => { C().dir = "l"; D().dir = "l"; } },
      { esperar: 90 },
      { fn: () => { C().dir = "d"; } },
      { dialogo: ["* Bro...", "* ¿Estás pensando...\n* ...lo mismo que yo?", "* Qué garrón.\n* Esto es, o sea...\n* Re vergonzoso.", "* O sea, la verdad que te\n  tenemos que matar y eso."],
        alPag: n => { if (n === 2) C().dir = "r"; if (n === 3) C().dir = "l"; } },
      { esperar: 2 },                                // un cuadro sin el cuadro de texto, para la foto
      { fn: pelear }
    ];
  }
  function siguiente() {
    i++; t = 0; dlg = null;
    if (i >= pasos.length) return;
    const p = pasos[i];
    if (p.fn) { p.fn(); if (activo) siguiente(); return; }
    if (p.dialogo) dlg = { pags: p.dialogo, n: 0, cur: 0, alPag: p.alPag };
  }

  function iniciar(p) {
    if (activo || !window.EnemyFight || window.EnemyFight.activa) return;
    if (typeof ESTADO !== "undefined" && ESTADO.guardiaReal) return;
    activo = true; acc = 0;
    if (typeof frenar === "function") frenar();
    direccionActual = "right"; frameActual = 0;       // mira hacia donde vienen
    guardias = null; jugadorCamina = false;
    pasos = armarGuion(); i = -1;
    siguiente();
  }
  function pelear() {
    activo = false;
    const foto = document.createElement("canvas");
    foto.width = canvas.width; foto.height = canvas.height;
    foto.getContext("2d").drawImage(canvas, 0, 0);
    window.EnemyFight.iniciar(player, "guardias", {
      x: player.x - camera.x + player.width / 2, y: player.y - camera.y + player.height / 2,
      captura: foto, sinAlerta: true, inmortal: true, lvMinimo: 12,
      alTerminar: res => {
        guardias = null;                              // se van del mapa
        if (res !== "murio" && typeof ESTADO !== "undefined") ESTADO.guardiaReal = true;
      }
    });
  }

  // ---------- lógica (a 30 cuadros por segundo, como Undertale) ----------
  function tick() {
    for (const g of lista2()) {
      g.x += g.vx || 0;
      if (g.mov && ++g.ft >= 4) { g.ft = 0; g.fr = (g.fr + 1) % 4; }   // image_speed 0.25
    }
    if (jugadorCamina) {
      moveWithWallCollision(player, VEL, 0);
      direccionActual = "right";
      actualizarFrame(34, true);
    }
    const p = pasos[i]; if (!p) return;
    if (p.esperar !== undefined) { if (++t >= p.esperar) siguiente(); return; }
    if (p.hasta) { if (p.hasta()) siguiente(); return; }
    if (dlg) {
      const txt = dlg.pags[dlg.n];
      if (dlg.cur < txt.length) {
        dlg.cur++;
        const c = txt[dlg.cur - 1];
        if (c !== " " && c !== "\n" && dlg.cur % 2 === 1) sonarVoz();
      }
    }
  }
  function update(dt) {
    acc += Math.min(100, dt) / 1000;
    while (acc >= 1 / 30 && activo) { acc -= 1 / 30; tick(); }
  }

  // ---------- teclado ----------
  window.addEventListener("keydown", (e) => {
    if (!activo) return;
    e.stopPropagation(); e.preventDefault();
    if (e.repeat || !dlg) return;
    const k = e.key.toLowerCase();
    const txt = dlg.pags[dlg.n];
    if (k === "x" || k === "shift") { dlg.cur = txt.length; return; }
    if (k === "z" || k === "enter" || k === " ") {
      if (dlg.cur < txt.length) return;
      dlg.n++;
      if (dlg.n >= dlg.pags.length) { siguiente(); return; }
      dlg.cur = 0;
      if (dlg.alPag) dlg.alPag(dlg.n);
    }
  }, true);

  // ---------- dibujo ----------
  function dibujarGuardia(ctx, cam, g) {
    const r = ATLAS[sprGuardia(g)]; if (!r || !lista) return;
    const w = Math.round(r[2] * ESC), h = Math.round(r[3] * ESC);
    ctx.drawImage(img, r[0], r[1], r[2], r[3], Math.round(g.x - w / 2 - cam.x), Math.round(g.y - h - cam.y), w, h);
  }
  // El cuadro de texto es HTML encima del canvas (no se dibuja en el canvas, que se
  // agranda con píxeles duros y dejaba las letras pixeladas).
  const cajaDom = document.createElement("div");
  cajaDom.setAttribute("aria-live", "polite");
  Object.assign(cajaDom.style, {
    position: "fixed", display: "none", zIndex: "50", pointerEvents: "none", boxSizing: "border-box",
    background: "#000", borderStyle: "solid", borderColor: "#fff", color: "#fff", whiteSpace: "pre",
    fontFamily: '"8bitoperator", monospace', overflow: "hidden"
  });
  document.body.appendChild(cajaDom);
  let textoPuesto = null;
  function dibujarTexto() {
    if (!activo || !dlg) { cajaDom.style.display = "none"; textoPuesto = null; return; }
    const r = canvas.getBoundingClientRect(), sx = r.width / canvas.width, sy = r.height / canvas.height;
    const abajo = (player.y - camera.y) < canvas.height / 2;
    const x = 32, w = canvas.width - 64, h = 152, y = abajo ? canvas.height - h - 16 : 16;
    Object.assign(cajaDom.style, {
      display: "block", left: (r.left + x * sx) + "px", top: (r.top + y * sy) + "px", width: (w * sx) + "px", height: (h * sy) + "px",
      borderWidth: (6 * sy) + "px", fontSize: (26 * sy) + "px", lineHeight: (36 * sy) + "px", padding: (14 * sy) + "px " + (20 * sx) + "px"
    });
    const vis = dlg.pags[dlg.n].slice(0, dlg.cur);
    if (vis !== textoPuesto) { cajaDom.textContent = vis; textoPuesto = vis; }
  }
  // capa: "atras" (antes del jugador), "adelante" (después) o "texto" (arriba de todo)
  function dibujar(ctx, cam, capa) {
    if (capa === "texto") { dibujarTexto(); return; }
    if (!guardias) return;
    const pieY = player.y + player.height;
    for (const g of lista2().sort((a, b) => a.y - b.y)) {
      const atras = g.y <= pieY;
      if ((capa === "atras") === atras) dibujarGuardia(ctx, cam, g);
    }
  }
  if (document.fonts && document.fonts.load) document.fonts.load('26px "8bitoperator"').catch(() => { });

  window.Guardias = { iniciar, update, dibujar, get activo() { return activo; } };

  // ---------- PEL3: Undyne la Inmortal ----------
  // No se puede morir y si tenés menos de LV 8 te sube a 8 ("DIOS TE AYUDA").
  // Cuando la vencés no se repite (ESTADO.undyneVencida).
  window.Undyne = {
    iniciar(p) {
      if (!window.EnemyFight || window.EnemyFight.activa) return;
      if (typeof ESTADO !== "undefined" && ESTADO.undyneVencida) return;
      if (typeof frenar === "function") frenar();
      const foto = document.createElement("canvas");
      foto.width = canvas.width; foto.height = canvas.height;
      foto.getContext("2d").drawImage(canvas, 0, 0);
      window.EnemyFight.iniciar(p, "undyne", {
        x: p.x - camera.x + p.width / 2, y: p.y - camera.y + p.height / 2,
        captura: foto, sinAlerta: true, inmortal: true, lvMinimo: 8,
        alTerminar: res => { if (res === "mato" && typeof ESTADO !== "undefined") ESTADO.undyneVencida = true; }
      });
    }
  };
})();

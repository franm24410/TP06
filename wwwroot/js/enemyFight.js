// enemyFight.js — peleas contra monstruos comunes (encuentros aleatorios)
//
// Recrea el sistema de batalla de Undertale (FIGHT / ACT / ITEM / MERCY) y los
// ataques reales de cada monstruo, sacados del código decompilado del juego
// (obj_1sidegen, blt_flybullet, blt_leapfrog, obj_hoopgen1, obj_iceteeth, ...).
// La lógica corre a 30 cuadros por segundo, como Undertale, así que las
// velocidades de las balas son las mismas que en el original (px por cuadro).
//
// Uso (lo llama site.js):  EnemyFight.iniciar(player, "froggit", {x, y})
//   - {x, y}: dónde está el jugador en la pantalla (para la animación de entrada).
// Al terminar: gana oro (2-5), suma un monstruo para el LV (ver jugador.js).
// Si perdés: el corazón se rompe y volvés al último guardado con el HP lleno.
//
// Controles: flechas / WASD mover · Z / ENTER / ESPACIO confirmar · X / SHIFT volver

(function () {
  "use strict";
  const overlay = document.getElementById("enemyBattle");
  const cvs = document.getElementById("ebCanvas");
  if (!overlay || !cvs) return;
  const ctx = cvs.getContext("2d");
  cvs.width = 640; cvs.height = 480;
  const LW = 640, LH = 480;

  const UI_BASE = "/Battle/SansFight/", EN_BASE = "/Battle/Enemigos/";
  const ATLAS_UI = {"tex/DamageFont":[0,0,528,192],"TargetChoice/Default/0":[530,0,14,128],"TargetChoice/Default/1":[546,0,14,128],"Target/Default/0":[0,194,548,117],"SpeechBubble/Default/0":[550,194,237,104],"SpeechBubble/NoEffects/0":[0,313,237,104],"tex/DefaultFont":[239,313,160,96],"tex/SansFont":[401,313,256,96],"SansBody/HandDown/0":[659,313,64,70],"SansBody/HandDown/1":[725,313,64,70],"SansBody/HandDown/2":[791,313,64,70],"SansBody/HandDown/3":[857,313,64,70],"SansBody/HandUp/0":[923,313,64,70],"SansBody/HandUp/1":[0,419,64,70],"SansBody/HandUp/2":[66,419,64,70],"SansBody/HandUp/3":[132,419,64,70],"SansBody/HandUp/4":[198,419,64,70],"Strike/Default/3":[264,419,8,64],"SansBody/HandLeft/0":[274,419,96,48],"SansBody/HandLeft/1":[372,419,96,48],"SansBody/HandLeft/2":[470,419,96,48],"SansBody/HandLeft/3":[568,419,96,48],"SansBody/HandLeft/4":[666,419,96,48],"SansBody/HandRight/0":[764,419,96,48],"SansBody/HandRight/1":[862,419,96,48],"SansBody/HandRight/2":[0,491,96,48],"SansBody/HandRight/3":[98,491,96,48],"SansBody/HandRight/4":[196,491,96,48],"GasterBlaster/Default/0":[294,491,57,44],"GasterBlaster/Fire/0":[353,491,57,44],"GasterBlaster/Fire/1":[412,491,57,44],"GasterBlaster/Fire/2":[471,491,57,44],"GasterBlaster/Fire/3":[530,491,57,44],"GasterBlaster/Fire/4":[589,491,57,44],"MenuBoneBottom/Default/0":[648,491,14,44],"MenuBoneLeft/Default/0":[664,491,14,44],"Strike/Default/2":[680,491,6,42],"UIAct/Default/0":[688,491,110,42],"UIAct/Highlight/0":[800,491,110,42],"UIFight/Default/0":[912,491,110,42],"UIFight/Highlight/0":[0,541,110,42],"UIItem/Default/0":[112,541,110,42],"UIItem/Highlight/0":[224,541,110,42],"UIMercy/Default/0":[336,541,110,42],"UIMercy/Highlight/0":[448,541,110,42],"Strike/Default/4":[560,541,14,32],"SansHead/BlueEye/0":[576,541,32,30],"SansHead/BlueEye/1":[610,541,32,30],"SansHead/ClosedEyes/0":[644,541,32,30],"SansHead/Default/0":[678,541,32,30],"SansHead/LookLeft/0":[712,541,32,30],"SansHead/NoEyes/0":[746,541,32,30],"SansHead/Tired1/0":[780,541,32,30],"SansHead/Tired2/0":[814,541,32,30],"SansHead/Wink/0":[848,541,32,30],"SansTorso/Default/0":[882,541,54,25],"SansTorso/Shrug/0":[938,541,72,24],"tex/BattleFont":[0,585,96,24],"tex/BoneStabV":[98,585,12,24],"tex/BoneV":[112,585,10,24],"SansLegs/Standing/0":[124,585,44,23],"Strike/Default/1":[170,585,4,22],"PlayerHeart/Split/0":[176,585,16,20],"SansLegs/Sitting/0":[194,585,52,17],"HeartShard/Default/0":[248,585,16,16],"HeartShard/Default/1":[266,585,16,16],"HeartShard/Default/2":[284,585,16,16],"HeartShard/Default/3":[302,585,16,16],"PlayerHeart/Default/0":[320,585,16,16],"tex/BoneStabWarn":[338,585,16,16],"tex/CombatZone":[356,585,16,16],"tex/GasterBlast1":[374,585,16,16],"tex/GasterBlast2":[392,585,16,16],"tex/GasterBlast3":[410,585,16,16],"tex/GasterBlastHit":[428,585,16,16],"tex/HPBackground":[446,585,16,16],"tex/HPBar":[464,585,16,16],"tex/KRBar":[482,585,16,16],"Strike/Default/5":[500,585,14,12],"tex/BoneStabH":[516,585,24,12],"HP/Default/0":[542,585,23,10],"KR/Default/0":[567,585,23,10],"tex/BoneH":[592,585,24,10],"SansSweat/Sweat1/0":[618,585,32,9],"SansSweat/Sweat2/0":[652,585,32,9],"SansSweat/Sweat3/0":[686,585,32,9],"tex/Platform1":[720,585,16,7],"tex/Platform2":[738,585,16,7],"Strike/Default/0":[756,585,4,6]};
  const ATLAS_EN = {"snowdrake/0":[0,0,172,200],"snowdrake/hurt":[174,0,172,200],"icecap/hurt":[348,0,106,174],"icecap/1":[456,0,106,171],"icecap/3":[564,0,106,171],"icecap/0":[672,0,106,169],"icecap/2":[780,0,106,169],"loox/hurt":[888,0,104,120],"loox/0":[0,202,100,116],"loox/1":[102,202,100,116],"loox/2":[204,202,100,116],"loox/3":[306,202,100,116],"loox/4":[408,202,100,116],"froggit/0":[510,202,112,112],"froggit/1":[624,202,112,112],"froggit/hurt":[738,202,112,112],"vegetoid/hurt":[852,202,104,108],"b/blconsm_0":[0,320,99,108],"whimsun/hurt":[101,320,104,104],"vegetoid/0":[207,320,72,104],"vegetoid/1":[281,320,72,104],"vegetoid/2":[355,320,72,104],"vegetoid/3":[429,320,72,104],"whimsun/0":[503,320,90,92],"whimsun/1":[595,320,96,92],"moldsmal/0":[693,320,102,84],"moldsmal/1":[797,320,102,84],"moldsmal/hurt":[901,320,102,84],"b/hatbullet_0":[0,430,50,50],"b/hatbullet_1":[52,430,50,50],"b/smallfrogbullet_0":[104,430,40,40],"b/smallfrogbullet_1":[146,430,40,40],"b/iciclebullet_0":[188,430,40,40],"b/iciclebullet_1":[230,430,40,40],"b/vegbullet_0":[272,430,24,24],"b/vegbullet_1":[298,430,24,24],"b/vegbullet_2":[324,430,24,24],"b/vegbullet_3":[350,430,24,24],"b/vegbullet_4":[376,430,24,24],"b/vegbullet_5":[402,430,24,24],"b/carrotbullet_0":[428,430,24,24],"b/carrotbullet_gr_0":[454,430,24,24],"b/clawbullet_0":[480,430,24,24],"b/clawbullet_1":[506,430,24,24],"b/clawbullet_2":[532,430,24,24],"b/clawbullet_3":[558,430,24,24],"b/rotclawbullet_0":[584,430,24,24],"b/butterflybllt_0":[610,430,20,20],"b/butterflybllt_1":[632,430,20,20],"b/circlebulletmed2_0":[654,430,16,16],"b/circlebulletmd1_0":[672,430,16,16],"b/circlebulletsm_0":[690,430,16,16],"b/bulletgenmd_0":[708,430,16,16],"b/bulletgenmd_1":[726,430,16,16],"b/bulletgenmd_2":[744,430,16,16],"b/flybullet_0":[762,430,12,12],"b/flybullet_1":[776,430,12,12],"b/bulletmd_0":[790,430,12,12],"b/exc_0":[804,430,10,10],"b/bulletsm_0":[816,430,6,6]};

  // =====================================================================
  // Utilidades estilo GameMaker (direcciones en grados, 90 = arriba)
  // =====================================================================
  const D2R = Math.PI / 180;
  const lenX = (l, d) => Math.cos(d * D2R) * l;
  const lenY = (l, d) => -Math.sin(d * D2R) * l;
  const rnd = n => Math.random() * n;
  const irnd = n => Math.round(Math.random() * n);        // round(random(n)) de GML
  const choose = (...a) => a[Math.floor(Math.random() * a.length)];
  const pointDir = (x1, y1, x2, y2) => Math.atan2(-(y2 - y1), x2 - x1) / D2R;
  const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

  // =====================================================================
  // Imágenes: atlas de la interfaz (el de la pelea de Sans) + atlas de monstruos
  // =====================================================================
  const imgUI = new Image(), imgEN = new Image();
  let listas = 0;
  imgUI.onload = () => listas++; imgEN.onload = () => listas++;
  imgUI.src = UI_BASE + "atlas.png"; imgEN.src = EN_BASE + "enemigos.png";
  const tintCache = new Map();
  function fuente(name) { return ATLAS_EN[name] ? [imgEN, ATLAS_EN[name]] : (ATLAS_UI[name] ? [imgUI, ATLAS_UI[name]] : [null, null]); }
  function tinted(img, color) {
    if (!color) return img;
    const k = img.src + "|" + color;
    if (tintCache.has(k)) return tintCache.get(k);
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "multiply"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "destination-in"; g.drawImage(img, 0, 0);
    tintCache.set(k, c);
    return c;
  }
  // Dibuja un sprite. (x,y) = punto de origen; (ox,oy) = origen dentro del sprite en px.
  function spr(name, x, y, opt) {
    const [img, r] = fuente(name); if (!img || listas < 2) return;
    opt = opt || {};
    const w = opt.w ?? r[2], h = opt.h ?? r[3];
    const sx = opt.sx ?? (w / r[2]), sy = opt.sy ?? (h / r[3]);
    ctx.save();
    if (opt.alpha !== undefined) ctx.globalAlpha = Math.max(0, Math.min(1, opt.alpha));
    ctx.translate(Math.round(x), Math.round(y));
    if (opt.ang) ctx.rotate(-opt.ang * D2R);            // ángulo GML (antihorario)
    const ox = (opt.ox || 0) * sx, oy = (opt.oy || 0) * sy;
    ctx.drawImage(tinted(img, opt.tint), r[0], r[1], r[2], r[3], -ox, -oy, r[2] * sx, r[3] * sy);
    ctx.restore();
  }
  function sprSize(name) { const [, r] = fuente(name); return r ? [r[2], r[3]] : [0, 0]; }
  // 9-patch con estiramiento (caja de combate)
  function caja(x, y, w, h) {
    const [img, r] = fuente("tex/CombatZone"); if (!img || listas < 2) return;
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    const m = 5;
    ctx.drawImage(img, r[0], r[1], r[2], m, x, y, w, m);
    ctx.drawImage(img, r[0], r[1] + r[3] - m, r[2], m, x, y + h - m, w, m);
    ctx.drawImage(img, r[0], r[1], m, r[3], x, y, m, h);
    ctx.drawImage(img, r[0] + r[2] - m, r[1], m, r[3], x + w - m, y, m, h);
  }

  // ---------- fuentes pixeladas con tildes, ñ, ¿ ¡ (igual que en sansFight.js) ----------
  function mkFont(tex, cw, ch, defs) { const widths = {}; for (const [chars, w] of defs) for (const c of chars) widths[c] = w; return { tex, cw, ch, widths }; }
  const FONTS = {
    Battle: mkFont("tex/BattleFont", 6, 6, [["!\"#%-/0123456789<=>?ABCDEFGHIJKLNOPQRSTUVXYZ[\\]_", 5], ["\"()<>[]", 4], [" -", 3], ["',.:;", 2]]),
    Damage: mkFont("tex/DamageFont", 33, 32, [["~", 29], ["\"/<>I^j{}", 25], ["(),1[]`", 21], ["!'.:;il|", 17]]),
    Default: mkFont("tex/DefaultFont", 10, 16, [["#%&MWmw~", 9], [" $*+-./0123456789=?@ABCDEFGHIJKLNOPQRSTUVXYZ\\^abcdefghijklnopqrstuvxyz", 8], ["\"<>{}", 7], ["!()[]_", 6], ["`", 5], ["',:;|", 4]])
  };
  const DIAC = {
    "á": ["a", "acute"], "é": ["e", "acute"], "í": ["i", "acute"], "ó": ["o", "acute"], "ú": ["u", "acute"], "ñ": ["n", "tilde"],
    "Á": ["A", "acute"], "É": ["E", "acute"], "Í": ["I", "acute"], "Ó": ["O", "acute"], "Ú": ["U", "acute"], "Ñ": ["N", "tilde"],
    "ü": ["u", "diaer"], "¿": ["?", "inv"], "¡": ["!", "inv"]
  };
  const GLIFO = { Default: { top: { low: 4, up: 2 }, bb: { a: [1, 6], e: [1, 6], i: [1, 6], o: [1, 6], u: [1, 6], n: [1, 6], A: [1, 6], E: [1, 6], I: [1, 6], O: [1, 6], U: [1, 6], N: [1, 6] } } };
  const baseChar = c => DIAC[c] ? DIAC[c][0] : c;
  function charW(f, c) { c = baseChar(c); return f.widths[c] !== undefined ? f.widths[c] : f.cw; }
  function textW(f, s) { let w = 0; for (const c of s) w += charW(f, c); return w; }
  function wrap(f, text, scale, maxW) {
    const out = []; let pos = 0;
    for (const para of text.split("\n")) {
      const words = para.split(" ");
      const sangria = para.startsWith("* ") ? textW(f, "* ") : 0;
      let line = "", lineStart = pos, p = pos, ind = 0;
      for (let i = 0; i < words.length; i++) {
        const wd = words[i];
        const cand = line === "" && i === 0 ? wd : line + " " + wd;
        if (line !== "" && maxW && (textW(f, cand) + ind) * scale > maxW) { out.push({ txt: line, start: lineStart, ind }); line = wd; lineStart = p; ind = sangria; }
        else line = cand;
        p += wd.length + 1;
      }
      out.push({ txt: line, start: lineStart, ind });
      pos += para.length + 1;
    }
    return out;
  }
  function drawText(fontName, text, x, y, scale, tint, maxW, shown, alpha) {
    const f = FONTS[fontName]; if (listas < 2) return;
    const [img, r] = fuente(f.tex); const src = tinted(img, tint);
    const lines = wrap(f, text, scale, maxW);
    if (shown === undefined) shown = text.length;
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    let yy = Math.round(y);
    for (const ln of lines) {
      const n = Math.max(0, Math.min(ln.txt.length, shown - ln.start));
      let xx = Math.round(x + (ln.ind || 0) * scale);
      for (let i = 0; i < n; i++) {
        const c = ln.txt[i], d = DIAC[c], b = d ? d[0] : c, code = b.charCodeAt(0) - 32;
        if (code > 0 && code < 96) {
          const col = code % 16, row = Math.floor(code / 16);
          const sx = r[0] + col * f.cw, sy = r[1] + row * f.ch;
          if ((row + 1) * f.ch <= r[3]) {
            const g = GLIFO[fontName];
            if (d && d[1] === "inv") {
              ctx.save(); ctx.translate(xx + charW(f, b) * scale, yy + f.ch * scale); ctx.rotate(Math.PI);
              ctx.drawImage(src, sx, sy, f.cw, f.ch, 0, 0, f.cw * scale, f.ch * scale); ctx.restore();
            } else if (d && b === "i" && g) {
              const t = g.top.low;
              ctx.drawImage(src, sx, sy + t, f.cw, f.ch - t, xx, yy + t * scale, f.cw * scale, (f.ch - t) * scale);
            } else ctx.drawImage(src, sx, sy, f.cw, f.ch, xx, yy, f.cw * scale, f.ch * scale);
            if (d && d[1] !== "inv" && g && g.bb[b]) {
              const [x0, x1] = g.bb[b]; const up = b === b.toUpperCase();
              const t = up ? g.top.up : g.top.low, gap = up ? 0 : 1, cx = Math.floor((x0 + x1) / 2);
              let px = [];
              if (d[1] === "acute") px = [[cx, t - 1 - gap], [cx + 1, t - 1 - gap], [cx + 1, t - 2 - gap], [cx + 2, t - 2 - gap]];
              if (d[1] === "tilde") px = [[x0 + 1, t - 2 - gap], [x0 + 2, t - 2 - gap], [x1, t - 2 - gap], [x0, t - 1 - gap], [x0 + 3, t - 1 - gap], [x0 + 4, t - 1 - gap]];
              if (d[1] === "diaer") px = [[x0, t - 1 - gap], [x0 + 1, t - 1 - gap], [x1 - 1, t - 1 - gap], [x1, t - 1 - gap]];
              ctx.fillStyle = tint || "#fff";
              for (const [ax, ay] of px) ctx.fillRect(xx + ax * scale, yy + ay * scale, scale, scale);
            }
          }
        }
        xx += charW(f, c) * scale;
      }
      yy += f.ch * scale;
    }
    ctx.restore();
  }

  // =====================================================================
  // Audio
  // =====================================================================
  const SND = {
    txt: UI_BASE + "snd/BattleText.ogg", cursor: UI_BASE + "snd/MenuCursor.ogg", select: UI_BASE + "snd/MenuSelect.ogg",
    fight: UI_BASE + "snd/PlayerFight.ogg", split: UI_BASE + "snd/HeartSplit.ogg", shatter: UI_BASE + "snd/HeartShatter.ogg",
    hurt: EN_BASE + "snd/snd_hurt1.ogg", ehurt: EN_BASE + "snd/snd_ehurt1.ogg", dragon: EN_BASE + "snd/snd_hurtdragon.ogg",
    damage: EN_BASE + "snd/snd_damage.ogg", dust: EN_BASE + "snd/snd_vaporized.ogg", noise: EN_BASE + "snd/snd_noise.ogg",
    fall: EN_BASE + "snd/snd_battlefall.ogg", heal: EN_BASE + "snd/snd_heal_c.ogg", escaped: EN_BASE + "snd/snd_escaped.ogg",
    levelup: EN_BASE + "snd/snd_levelup.ogg", item: EN_BASE + "snd/snd_item.ogg", bell: EN_BASE + "snd/snd_bell.ogg"
  };
  let actx = null, master = null; const buffers = {}; const vivos = new Set();
  function initAudio() {
    if (actx) { if (actx.state === "suspended") actx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    actx = new AC(); master = actx.createGain(); master.gain.value = 0.6; master.connect(actx.destination);
    for (const k in SND) fetch(SND[k]).then(r => r.arrayBuffer()).then(b => new Promise((ok, er) => actx.decodeAudioData(b, ok, er))).then(buf => { buffers[k] = buf; }).catch(() => { });
  }
  function precargar() {
    window.removeEventListener("keydown", precargar, true); window.removeEventListener("pointerdown", precargar, true);
    initAudio(); musicaObj();
  }
  window.addEventListener("keydown", precargar, true); window.addEventListener("pointerdown", precargar, true);
  function sonar(k) {
    if (!actx || !buffers[k]) return;
    try { const s = actx.createBufferSource(); s.buffer = buffers[k]; s.connect(master); s.start(); vivos.add(s); s.onended = () => vivos.delete(s); } catch (e) { }
  }
  let musica = null;
  function musicaObj() { if (!musica) { musica = new Audio(EN_BASE + "snd/mus_battle1.ogg"); musica.loop = true; musica.volume = 0.45; musica.preload = "auto"; } return musica; }
  function musicaPlay() { const m = musicaObj(); m.currentTime = 0; m.play().catch(() => { }); }
  function pararTodo() { for (const s of vivos) { try { s.stop(); } catch (e) { } } vivos.clear(); if (musica) musica.pause(); }

  // =====================================================================
  // Input
  // =====================================================================
  const KEYMAP = { arrowup: "Up", w: "Up", arrowdown: "Down", s: "Down", arrowleft: "Left", a: "Left", arrowright: "Right", d: "Right", z: "Confirm", enter: "Confirm", " ": "Confirm", x: "Cancel", shift: "Cancel" };
  const held = {}, pulsado = {};
  const pad = { Up: 0, Down: 0, Left: 0, Right: 0, Confirm: 0, Cancel: 0 }, last = { ...pad };
  window.addEventListener("keydown", (e) => {
    if (!activa) return;
    const b = KEYMAP[e.key.toLowerCase()];
    if (b) { if (!e.repeat) { held[b] = true; pulsado[b] = true; } e.preventDefault(); }
    e.stopPropagation();
  }, true);
  window.addEventListener("keyup", (e) => { const b = KEYMAP[e.key.toLowerCase()]; if (b) held[b] = false; }, true);
  window.addEventListener("blur", () => { for (const k in held) held[k] = false; });
  function leerPad() { for (const k in pad) { last[k] = pad[k]; pad[k] = (held[k] || pulsado[k]) ? 1 : 0; pulsado[k] = false; } }
  const presiona = k => pad[k] > last[k];

  // =====================================================================
  // Datos de los monstruos (stats, textos y ACT de Undertale, en castellano)
  // =====================================================================
  // hp/atk/def: de scr_monstersetup. mercymod: valor inicial del original.
  // Se puede perdonar cuando  hp - AT + def - mercymod < 0  (scr_mercystandard).
  const MONSTRUOS = {
    froggit: {
      nombre: "Froggit", hp: 30, atk: 4, def: 4, mercymod: 30, caja: 3, anim: 3, hurtSnd: "ehurt",
      entrada: "* ¡Froggit te ataca!",
      check: "* FROGGIT - ATQ 4 DEF 5\n* La vida es difícil para\n  este enemigo.",
      dialogos: ["Ribbit,\nribbit.", "Croac,\ncroac.", "Hop,\nhop.", "Miau."],
      flavor: ["* Froggit no parece saber\n  por qué está acá.", "* Froggit salta de acá\n  para allá.", "* El campo de batalla huele\n  a semillas de mostaza.", "* Te intimida la fuerza bruta\n  de Froggit.\n* Mentira."],
      flavorPerdon: "* Froggit parece no querer\n  pelear con vos.",
      flavorDebil: "* Froggit está tratando de\n  escaparse.",
      acts: [
        { n: "Cumplido", t: "* Froggit no entendió lo que\n  dijiste, pero se sintió\n  halagado igual.", mercy: 30, dlg: "(Se pone\nrojo.)\nRibbit.." },
        { n: "Amenazar", t: "* Froggit no entendió lo que\n  dijiste, pero se asustó\n  igual.", mercy: 30, dlg: "Tiembla,\ntiembla." }
      ],
      ataques: ["froggitSalto", "froggitMoscas"]
    },
    whimsun: {
      nombre: "Whimsun", hp: 10, atk: 4, def: 0, mercymod: 99, caja: 3, anim: 3, flota: true, hurtSnd: "ehurt",
      entrada: "* ¡Whimsun se acercó con\n  timidez!",
      check: "* WHIMSUN - ATQ 5 DEF 0\n* Este monstruo es demasiado\n  sensible para pelear...",
      dialogos: ["Perdón...", "No tengo\nopción..", "Perdoname\n...", "*snif\nsnif*"],
      flavor: ["* Whimsun evita mirarte a\n  los ojos.", "* Whimsun sigue murmurando\n  disculpas.", "* Whimsun está aleteando.", "* Empieza a oler a lavanda\n  y naftalina."],
      flavorDebil: "* A Whimsun le cuesta volar.",
      acts: [
        { n: "Consolar", t: "* A mitad de tu primera\n  palabra, Whimsun se pone a\n  llorar y se va volando.", huye: true },
        { n: "Asustar", t: "* Levantás los brazos y\n  movés los dedos.\n* ¡Whimsun se asusta!", mercy: 101, dlg: "No puedo\ncon\nesto..." }
      ],
      ataques: ["whimsunAnillo", "whimsunPolillas"]
    },
    moldsmal: {
      nombre: "Moldsmal", hp: 50, atk: 4, def: 0, mercymod: 99, caja: 3, anim: 2, hurtSnd: "ehurt",
      entrada: "* ¡Moldsmal bloquea el\n  camino!",
      check: "* MOLDSMAL - ATQ 6 DEF 0\n* Estereotipo: curvilíneo\n  y atractivo, pero sin\n  cerebro...",
      dialogos: ["Blub\nblub...", "Squorch\n...", "*Ruidos\nde\ngelatina*", "*Meneo\nsexy*"],
      flavor: ["* Moldsmal burbujea bajito.", "* Moldsmal espera pensativo.", "* Moldsmal está rumiando.", "* Se siente olor a gelatina\n  de lima."],
      flavorDebil: "* Moldsmal se empezó a\n  echar a perder.",
      acts: [
        { n: "Imitar", t: "* Te quedás inmóvil con\n  Moldsmal.\n* Sentís que entendés un poco\n  mejor el mundo.", mercy: 101 },
        { n: "Coquetear", t: "* Movés las caderas.\n* Moldsmal se menea también.\n* ¡Qué conversación profunda!", mercy: 101 }
      ],
      ataques: ["moldsmalPolen", "moldsmalAstillas"]
    },
    loox: {
      nombre: "Loox", hp: 50, atk: 5, def: 4, mercymod: 4, caja: 6, anim: 4, hurtSnd: "ehurt",
      entrada: "* ¡Loox se acercó!",
      check: "* LOOX - ATQ 6 DEF 6\n* No lo molestes.\n* Apellido: Ojoandante",
      dialogos: ["Te tengo\nen la\nmira.", "No me\napuntes\ncon eso.", "Dejá de\nmirarme.", "¡Qué\nmolestia\nvisual!", "¿Jugamos\nun duelo\nde\nmiradas?"],
      flavor: ["* Loox te está mirando.", "* Loox te mira fijo.", "* Loox rechina los dientes.", "* Huele a gotas para los\n  ojos."],
      flavorPerdon: "* A Loox ya no le importa\n  pelear.",
      flavorDebil: "* A Loox se le llenan los\n  ojos de lágrimas.",
      acts: [
        { n: "Molestar", t: "* Te burlás de Loox.\n* ¡Loox se enoja!", mercy: -100, dlg: "¡Qué\ngrosero!" },
        { n: "No molestar", t: "* No te burlás de Loox.\n* Loox parece contento.", mercy: 100, dlg: "¡Al fin\nalguien\nme\nentiende!" }
      ],
      ataques: ["looxAros", "looxRebote"]
    },
    vegetoid: {
      nombre: "Vegetoid", hp: 72, atk: 5, def: 0, mercymod: 7, caja: 3, anim: 4, hurtSnd: "ehurt",
      entrada: "* ¡Vegetoid salió de la\n  tierra!",
      check: "* VEGETOID - ATQ 6 DEF 6\n* Tamaño de porción:\n  1 monstruo.",
      dialogos: ["Contiene\nvitamina\nA", "Parte de\nun buen\ndesayuno", "Cultivo\nlocal,\nmuuuy\nlocal", "Sabor\nfresco de\nmañana"],
      flavor: ["* Vegetoid sonríe con\n  misterio.", "* Vegetoid se ríe bajito.", "* Vegetoid está acá por tu\n  salud.", "* Huele a zanahorias y\n  arvejas al vapor."],
      flavorPerdon: "* Vegetoid está contento de\n  que comas sano.",
      flavorDebil: "* Vegetoid parece medio\n  magullado.",
      acts: [
        { n: "Hablar", t: "* Tratás de hablar con\n  Vegetoid.\n* No parece muy conversador.", dlg: "Las\nplantas\nno\nhablan,\ntonto" },
        { n: "Cenar", t: "* Te tocás la panza.\n* Vegetoid te ofrece una\n  comida sana.", come: true, dlg: "Comé tus\nverduras" }
      ],
      ataques: ["vegetoidZanahorias", "vegetoidVerduras"]
    },
    snowdrake: {
      nombre: "Snowdrake", hp: 74, atk: 6, def: 2, mercymod: 5, caja: 6, anim: 0, hurtSnd: "dragon",
      entrada: "* ¡Snowdrake revolotea hacia\n  vos!",
      check: "* SNOWDRAKE - ATQ 12 DEF 7\n* Este comediante adolescente\n  lucha por tener público.",
      dialogos: ["Es un\nhielo\nverte.", "Los\nchistes\nfríos son\nlo mío.", "¡No te\ncongeles\nahora!", "¡Tomalo\ncon\nfrío!", "¡Me\nderrito\nde risa!"],
      flavor: ["* Snowdrake evalúa al\n  público.", "* Snowdrake ensaya su\n  próximo chiste.", "* Snowdrake se ríe de su\n  propio chiste malo.", "* Huele a almohada mojada."],
      flavorPerdon: "* Snowdrake está contento con\n  su chiste \"genial\".",
      flavorDebil: "* Snowdrake se está\n  descascarando.",
      acts: [
        { n: "Reír", t: "* Te reís del chiste de\n  Snowdrake.", mercy: 80, dlg: "¡Por fin\nalguien\nse ríe!" },
        { n: "Abuchear", t: "* Le decís a Snowdrake que\n  no es gracioso.", mercy: -10, dlg: "Hmph..." },
        { n: "Chiste", t: "* Hacés un chiste malo sobre\n  el hielo.", dlg: "¡Ese me\nlo robo!" }
      ],
      ataques: ["snowdrakeGarras", "snowdrakeGarrasCurvas"]
    },
    icecap: {
      nombre: "Ice Cap", hp: 48, atk: 6, def: 0, mercymod: 10, caja: 3, anim: 3, hurtSnd: "ehurt",
      entrada: "* ¡Ice Cap se acercó!",
      check: "* ICE CAP - ATQ 11 DEF 4\n* Se pregunta por qué no se\n  llama 'Ice Hat'.",
      dialogos: ["¿Y TU\nsombrero?", "Tu cabeza\nse ve tan\n...PELADA", "¡Qué\nsombrero!\n(El mío)", "¡Amo mi\nsombrero!\n¿OK?"],
      flavor: ["* Está nevando caspa.", "* Ice Cap también quiere un\n  sombrero para la nariz.", "* Ice Cap se fija que su\n  sombrero siga ahí.", "* Huele a ropa nueva."],
      flavorPerdon: "* Ice Cap está orgulloso de\n  su sombrero.",
      flavorDebil: "* El sombrero de Ice Cap\n  está flojo.",
      acts: [
        { n: "Ignorar", t: "* Lográs dejar de mirar el\n  sombrero de Ice Cap.", ignora: true, dlg: "¡OK! ¡Yo\nte ignoro\ntambién!" },
        { n: "Cumplido", t: "* ¡Le decís a Ice Cap que\n  tiene un sombrero genial!", mercy: 100, dlg: "¡¿Viste?!\n¡Es lo\nmejor!" },
        { n: "Robar", t: "* Tratás de robarle el\n  sombrero a Ice Cap...\n* No pasa nada.", dlg: "¡¡EY!!" }
      ],
      ataques: ["icecapDientes", "icecapSombreros"]
    }
  };

  // =====================================================================
  // Estado
  // =====================================================================
  let activa = false, jugadorRef = null, cerrando = false;
  let frame = 0;                                    // cuadros (30 fps)
  let mon = null;                                   // monstruo en pelea
  let fase = "intro", faseT = 0;
  let objs = [];                                    // generadores y balas
  let turntimer = 0, ataqueActual = null;
  let heart = { x: 0, y: 0, visible: false, invc: 0, split: false, azulado: false };
  let shards = [];
  const MENU_BOX = { l: 32, r: 602, t: 250, b: 385 };
  const BORDES = { 3: { l: 237, r: 397, t: 250, b: 385 }, 6: { l: 227, r: 407, t: 250, b: 385 }, 7: { l: 227, r: 407, t: 200, b: 385 } };
  let box = { ...MENU_BOX }, boxObj = { ...MENU_BOX };
  let texto = null;                                 // {full, cur, onDone, espera}
  let burbuja = null;                               // {txt, cur, t}
  let menuSel = 0, subItems = [], subSel = 0, subTipo = "";
  let target = null;                                // barra de ataque
  let efectos = [];                                 // corte, números de daño, etc.
  let turnos = 0;
  let intro = null;
  let uiSel = -1;
  let dust = null;
  const UIB = [
    { id: 0, x: 32, y: 432, n: "UIFight" }, { id: 1, x: 184, y: 432, n: "UIAct" },
    { id: 2, x: 344, y: 432, n: "UIItem" }, { id: 3, x: 496, y: 432, n: "UIMercy" }
  ];

  const J = () => window.Jugador;
  const statsJ = () => J().stats();
  function perdonable() { return mon.hp - J().at() + mon.def - mon.mercymod < 0; }

  // =====================================================================
  // Motor de objetos estilo GameMaker
  // =====================================================================
  // Cada objeto: x,y (origen), vx,vy, grav, gdir, fric, alarm[], step(o), alarma(o,n),
  // spr, frames, img (índice), imgSpd, ox,oy, w,h (hitbox), borde: "parent"|"noborder"|"none"
  function crear(o) {
    const b = Object.assign({ x: 0, y: 0, vx: 0, vy: 0, grav: 0, gdir: 270, fric: 0, alarm: [], dmg: mon ? mon.atk : 1, img: 0, imgSpd: 0, ox: 0, oy: 0, alpha: 1, ang: 0, borde: "parent", vivo: true, bala: true, xprev: 0, yprev: 0 }, o);
    b.xstart = b.x; b.ystart = b.y; b.xprev = b.x; b.yprev = b.y;
    if (b.spr && !b.w) { const [w, h] = sprSize(Array.isArray(b.spr) ? b.spr[0] : b.spr); b.w = w; b.h = h; }
    objs.push(b);
    return b;
  }
  const velocidad = b => Math.hypot(b.vx, b.vy);
  const direccion = b => Math.atan2(-b.vy, b.vx) / D2R;
  function movimiento(b, dir, spd) { b.vx = lenX(spd, dir); b.vy = lenY(spd, dir); }
  function hacia(b, x, y, spd) { movimiento(b, pointDir(b.x, b.y, x, y), spd); }
  function bbox(b) { return { l: b.x - b.ox, t: b.y - b.oy, r: b.x - b.ox + b.w, b: b.y - b.oy + b.h }; }
  function hitbox(b) {
    const r = bbox(b); const m = Math.min(b.w, b.h) * 0.18;
    return { l: r.l + m, t: r.t + m, r: r.r - m, b: r.b - m };
  }
  function heartBox() { return { l: heart.x + 3, t: heart.y + 3, r: heart.x + 13, b: heart.y + 13 }; }
  // bordes de la caja (como obj_uborder/dborder/lborder/rborder)
  function bordes() {
    return {
      u: { l: box.l, r: box.r, t: box.t - 2, b: box.t + 5 }, d: { l: box.l, r: box.r, t: box.b - 5, b: box.b + 2 },
      L: { l: box.l - 2, r: box.l + 5, t: box.t, b: box.b }, R: { l: box.r - 5, r: box.r + 2, t: box.t, b: box.b }
    };
  }
  // SCR_BORDER de Undertale
  function scrBorder(lado, arg) {
    if (lado === 0) return [irnd(box.r - box.l) + box.l, box.t];
    if (lado === 1) return [irnd(box.r - box.l) + box.l, box.b - arg];
    if (lado === 2) return [box.l, irnd(box.b - box.t) + box.t];
    return [box.r - arg, irnd(box.b - box.t) + box.t];
  }
  function danarJugador(dmg, inv) {
    if (heart.invc > 0) return false;
    let d = Math.round(dmg - J().df() / 5);
    if (d < 1) d = 1;
    J().danar(d);
    sonar("hurt");
    heart.invc = inv || 20;
    if (statsJ().hp <= 0) morir();
    return true;
  }
  function pasoObjetos() {
    for (const b of objs.slice()) {
      if (!b.vivo) continue;
      b.xprev = b.x; b.yprev = b.y;
      // alarmas
      for (let n = 0; n < b.alarm.length; n++) {
        if (b.alarm[n] > 0) { b.alarm[n]--; if (b.alarm[n] === 0 && b.alarma) b.alarma(b, n); }
      }
      if (!b.vivo) continue;
      if (b.step) b.step(b);
      if (!b.vivo) continue;
      // movimiento (fricción, gravedad, posición)
      if (b.fric) {
        const s = velocidad(b);
        if (s > 0) { let ns = s - b.fric; if (b.fric > 0 && ns < 0) ns = 0; const k = ns / s; b.vx *= k; b.vy *= k; }
      }
      if (b.grav) { b.vx += lenX(b.grav, b.gdir); b.vy += lenY(b.grav, b.gdir); }
      b.x += b.vx; b.y += b.vy;
      if (b.imgSpd) b.img += b.imgSpd;
      if (!b.bala) continue;
      // bordes (blt_parent: se destruye si toca un borde yendo hacia afuera)
      if (b.borde === "parent") {
        const r = bbox(b), B = bordes();
        if (b.alBorde) b.alBorde(b, r, B);
        else {
          if (overlap(r, B.u) && b.vy < 0) b.vivo = false;
          if (overlap(r, B.d) && b.vy > 0) b.vivo = false;
          if (overlap(r, B.L) && b.vx < 0) b.vivo = false;
          if (overlap(r, B.R) && b.vx > 0) b.vivo = false;
        }
      }
      // corazón
      if (b.vivo && heart.visible && !b.intangible && b.dmg > 0 && overlap(hitbox(b), heartBox())) {
        if (b.alTocar) b.alTocar(b);
        else if (danarJugador(b.dmg) && !b.persiste) b.vivo = false;
      }
      // fuera de la pantalla
      const r = bbox(b);
      if (r.r < -100 || r.l > LW + 100 || r.b < -100 || r.t > LH + 100) b.vivo = false;
    }
    objs = objs.filter(b => b.vivo);
  }

  // =====================================================================
  // Ataques (uno por cada generador/bala del original)
  // =====================================================================
  function generador(rate, fn) {
    // obj_1sidegen: dispara al cuadro 1 y después cada "rate" cuadros
    return crear({ bala: false, alarm: [0, 1], alarma: (g, n) => { if (n === 1 || n === 0) { fn(g); g.alarm[0] = Math.max(1, Math.round(rate)); } } });
  }
  function destello(x, y) {  // blt_gen: el "chispazo" donde nace una bala
    crear({ bala: false, spr: ["b/bulletgenmd_0", "b/bulletgenmd_1", "b/bulletgenmd_2"], x, y, imgSpd: 0.5, dmg: 0, step: g => { if (g.img >= 3) g.vivo = false; } });
  }
  const ATAQUES = {
    // ---- Froggit ----
    froggitSalto() {           // blt_leapfrog
      turntimer = 100;
      crear({
        spr: ["b/smallfrogbullet_0", "b/smallfrogbullet_1"], x: box.r - 40, y: box.b - 40, alarm: [30 + Math.floor(rnd(30))], dmg: mon.atk,
        alarma: (b) => { movimiento(b, 145 - rnd(20), 7 + rnd(3)); b.gdir = 280; b.grav = 0.4; b.img = 1; b.dmg = mon.atk * 1.8; }
      });
    },
    froggitMoscas() {          // obj_1sidegen tipo 1 + blt_flybullet
      turntimer = 100;
      generador(20, () => {
        const [x, y] = scrBorder(0, 6);
        destello(x - 2, y - 2);
        const f = crear({ spr: ["b/flybullet_0", "b/flybullet_1"], x, y, imgSpd: 0.5, alarm: [30, 45] });
        hacia(f, heart.x + 2, heart.y + 2, 2.5);
        f.alarma = (b, n) => {
          if (n === 0) { b.vx = 0; b.vy = 0; }
          if (n === 1) { b.alarm[0] = 30; b.alarm[1] = 45; hacia(b, heart.x + 2, heart.y + 2, 3); }
        };
      });
    },
    // ---- Whimsun ----
    whimsunAnillo() {          // scr_rotategen(10, 20, blt_butterfly1)
      turntimer = 100;
      let x = heart.x, y = heart.y + 42, angle = 0; const add = 36;
      while (angle < 360) {
        const a0 = angle;
        crear({
          spr: ["b/butterflybllt_0", "b/butterflybllt_1"], x, y, imgSpd: 0.25, ox: 10, oy: 10, borde: "none",
          angle: a0,
          step: b => { b.ang = b.angle; movimiento(b, b.angle, 2); b.angle += 3; if (turntimer <= 4) b.vivo = false; }
        });
        x += lenX(20, angle); y += lenY(20, angle); angle += add;
      }
    },
    whimsunPolillas() {        // obj_butterfly2gen + blt_butterfly2
      turntimer = 100;
      const g = crear({ bala: false, alarm: [1] });
      g.alarma = () => {
        g.alarm[0] = 7 + Math.floor(rnd(3));
        for (const dx of [-40, 40]) {
          const x = heart.x + dx; if (x < box.l || x > box.r - 16) continue;
          crear({
            spr: ["b/butterflybllt_0", "b/butterflybllt_1"], x, y: box.b - 4, vy: -(0.2 + rnd(2)), fric: -0.1, imgSpd: 0.25, ang: 90, ox: 0, oy: 0,
            step: b => { if (b.x < box.l || b.x > box.r - 16 || b.y < box.t) b.vivo = false; }
          });
        }
      };
    },
    // ---- Moldsmal ----
    moldsmalPolen() {          // obj_1sidegen tipo 3 + blt_pollendrop
      turntimer = 120;
      generador(15, () => {
        let [x, y] = scrBorder(0, 6);
        if (x > box.r - 20) x -= 20; if (x < box.l + 6) x += 6;
        crear({ spr: "b/bulletmd_0", x, y, vx: 1.5, vy: 1.2, grav: 0.02, alarm: [10], alarma: b => { b.vx = -b.vx; b.alarm[0] = 20; } });
      });
    },
    moldsmalAstillas() {       // obj_1sidegen tipo 2 + blt_splinterbig
      turntimer = 120;
      generador(30, () => {
        let [x, y] = scrBorder(0, 6);
        if (x > box.r - 6) x -= 6; if (x < box.l + 10) x += 10;
        crear({
          spr: "b/bulletmd_0", x, y, vy: 2, alarm: [20 + Math.floor(rnd(20))],
          alarma: b => {
            for (let i = 0; i < 9; i++) {
              const s = crear({ spr: "b/bulletsm_0", x: b.x + 3, y: b.y + 3, alpha: 0, intangible: true, step: q => { if (q.alpha < 1) q.alpha = Math.min(1, q.alpha + 0.1); else q.intangible = false; } });
              movimiento(s, i * 40, 1.5);
            }
            b.vivo = false;
          }
        });
      });
    },
    // ---- Loox ----
    looxAros() {               // obj_hoopgen1 tipo 0 + blt_hoopbullet1
      turntimer = 110;
      let rate = 13; if (mon.mercymod < 0) rate -= 6; if (mon.mercymod > 6) rate += 5;
      generador(rate, () => {
        const [x, y] = scrBorder(Math.round(rnd(1)) + 2, 2);
        aro(x, y, 0, null);
      });
    },
    looxRebote() {             // obj_hoopgen1 tipo 1 + blt_hoopbullet2
      turntimer = 110;
      let rate = 15; if (mon.mercymod < 0) rate -= 6; if (mon.mercymod > 6) rate += 5;
      generador(rate, () => {
        if (objs.filter(o => o.tipo === "hoop2").length > 5) return;
        const [x, y] = scrBorder(Math.round(rnd(3)), 8);
        crear({
          tipo: "hoop2", spr: "b/circlebulletmd1_0", ox: 8, oy: 8, x: x + 5, y, vx: rnd(1) < 0.5 ? 1 : -1, vy: rnd(1) < 0.5 ? 1 : -1, fric: -0.042,
          alpha: 0, intangible: true,
          step: b => { if (b.alpha < 0.9) b.alpha += 0.1; else { b.alpha = 1; b.intangible = false; } },
          alBorde: (b, r, B) => {
            if (overlap(r, B.u)) { b.y += 6; b.vy = -b.vy; }
            if (overlap(r, B.d)) { b.y -= 6; b.vy = -b.vy; }
            // (en el original los rebotes laterales no hacen nada: se escapan por los costados)
          }
        });
      });
    },
    // ---- Vegetoid ----
    vegetoidZanahorias() {     // obj_1sidegen tipo 6 + blt_gravbullet
      turntimer = 110;
      let num = 0;
      generador(6, () => {
        num++;
        let [x, y] = scrBorder(0, 40); x -= 20; y += 5;
        const verde = num === 4 && mon.come;
        const b = crear({ spr: verde ? "b/carrotbullet_gr_0" : "b/carrotbullet_0", x: x < box.l + 15 ? x + 15 : x, y: y - 8, vy: -0.5, grav: 0.25, borde: "noborder", verde });
        if (verde) b.alTocar = zanahoriaVerde;
      });
    },
    vegetoidVerduras() {       // obj_1sidegen tipo 5 + blt_vegbullet
      turntimer = 110;
      let num = 0;
      generador(18, () => {
        num++;
        let [x, y] = scrBorder(0, 40); x -= 20; y += 5;
        if (x < box.l + 20) x += 20;
        const verde = num === 3 && mon.come;
        const b = crear({
          spr: "b/vegbullet_" + Math.round(rnd(5)), x, y: y - 8, vx: rnd(1) < 0.5 ? 2 + rnd(0.2) : -2 - rnd(0.2), grav: 0.2, verde,
          tint: verde ? "rgb(0,255,0)" : null,
          alBorde: (b, r, B) => {
            if (overlap(r, B.L) || overlap(r, B.R)) { b.x = b.xprev; b.vx = -b.vx; }
            if (overlap(r, B.d) && b.vy > 0) { b.y = b.yprev; b.vy = -b.vy / 1.2; }
            if (overlap(r, B.u) && b.vy < 0) b.vivo = false;
          }
        });
        if (verde) b.alTocar = zanahoriaVerde;
      });
    },
    // ---- Snowdrake ----
    snowdrakeGarras() {        // obj_4sidegen tipo 1 + blt_4sidebullet
      turntimer = 120;
      generador(16, () => garra(false));
    },
    snowdrakeGarrasCurvas() {  // obj_4sidegen tipo 0 + blt_clawbullet_white
      turntimer = 120;
      generador(24, () => garra(true));
    },
    // ---- Ice Cap ----
    icecapDientes() {          // obj_iceteeth
      turntimer = 100;
      const y0 = box.t + (box.b - box.t - 40) / 2;
      const t = {
        bala: false, y: y0 - 120 + rnd(40), vy: 4.2, fric: 0.1, toothspeed: -0.1, toothdist: 265, seed: rnd(40), xs: [], dmg: mon.atk
      };
      for (let i = 0; box.l + i * 5 < box.r; i++) t.xs.push(box.l + i * 5);
      t.factor = (Math.PI * 4) / (t.xs.length - 1);
      t.step = d => {
        d.toothdist -= d.vy * 2.15;
        if (d.toothspeed < 2.4) d.toothspeed += 0.08;
        for (let i = 0; i < d.xs.length; i++) {
          d.xs[i] += d.toothspeed;
          if (d.xs[i] > box.r) d.xs[i] = box.l;
          if (d.xs[i] < box.l) d.xs[i] = box.l;
        }
        // choque con alguna línea
        if (!heart.visible) return;
        const hb = heartBox();
        for (let i = 0; i < d.xs.length; i++) {
          const x = d.xs[i]; if (x < hb.l || x > hb.r) continue;
          const yy = d.y + Math.sin(d.seed + i * d.factor) * 30;
          if (hb.t < yy - 3 && yy > box.t) { danarJugador(d.dmg, 40); break; }
          if (hb.b > yy + d.toothdist + 3 && yy + d.toothdist < box.b) { danarJugador(d.dmg, 40); break; }
        }
      };
      t.dibujar = d => {
        ctx.save(); ctx.fillStyle = "#fff";
        for (let i = 0; i < d.xs.length; i++) {
          const yy = d.y + Math.sin(d.seed + i * d.factor) * 30, x = Math.round(d.xs[i]);
          if (yy > box.t) ctx.fillRect(x, box.t, 1, Math.round(yy - box.t));
          if (yy + d.toothdist < box.b) ctx.fillRect(x, Math.round(yy + d.toothdist), 1, Math.round(box.b - (yy + d.toothdist)));
        }
        ctx.restore();
      };
      crear(t);
    },
    icecapSombreros() {        // obj_1sidegen tipo 11 + blt_hat + blt_icicle
      turntimer = 150;
      generador(33, () => {
        let x = irnd(box.r - box.l - 30 - 50) + box.l + 30;
        // se acomoda debajo del corazón, como el original
        if (rnd(1) < 0.7) x = 6 + heart.x - 25;
        crear({
          spr: ["b/hatbullet_0", "b/hatbullet_1"], x, y: box.b + 2, vy: -1.5, borde: "noborder", alarm: [0, 0, 0, 0, 0, 0, 20], alpha: 0.5,
          alarma: (b, n) => {
            if (n === 6) { b.vy = 0; b.alarm[7] = 20; b.imgSpd = 0.25; }
            if (n === 7) {
              for (const dx of [-2, 12, 5]) crear({ tipo: "icicle", spr: ["b/iciclebullet_0", "b/iciclebullet_1"], x: b.x + dx, y: b.y + 30, vy: -6.5, grav: 0.13, borde: "noborder", dmg: mon.atk - 1, step: q => { q.img = q.vy > 0 ? 0 : 1; if (q.y > box.b + 60) q.vivo = false; } });
              b.alarm[8] = 20; b.img = 1; b.imgSpd = 0;
            }
            if (n === 8) b.vy = 4;
          }
        });
      });
    }
  };
  function aro(x, y, tipo, padre) {
    const sprs = ["b/circlebulletmed2_0", "b/circlebulletmd1_0", "b/circlebulletsm_0"];
    const b = crear({
      spr: sprs[tipo], ox: 8, oy: 8, x, y, vx: x < box.l + 20 ? 2 : -2,
      grav: padre ? padre.gravStart : 0.1 + rnd(0.2), gdir: padre ? padre.gdir : (Math.round(rnd(1)) === 0 ? 270 : 90), wave: 1, visible: !!padre
    });
    b.gravStart = b.grav;
    if (!padre) {
      if (b.y > box.b - 20) b.y -= 20; if (b.y < box.t + 20) b.y += 20;
      b.xstart = b.x; b.ystart = b.y;
      b.alarm = [0, 1, 4, 8];
      b.alarma = (q, n) => {
        if (n === 1) { q.visible = true; }
        if (n === 2 || n === 3) {
          const c = aro(q.xstart, q.ystart, n === 2 ? 1 : 2, q);
          c.vx = q.vx;
        }
      };
    }
    b.step = q => { q.grav -= q.wave * 0.1; if (Math.abs(q.grav) > 0.5) q.wave = -q.wave; };
    return b;
  }
  function zanahoriaVerde(b) {
    b.vivo = false;
    sonar("heal");
    J().curar(1);
    mon.mercymod = 90; mon.comio = true;
  }
  function garra(curva) {
    const lado = Math.floor(rnd(4));
    const wid = box.r - box.l, het = box.b - box.t;
    let x, y, dir;
    if (curva) {
      if (lado === 0) { x = irnd(wid - 50 - 24) + box.l + 50; y = box.t - 14; }
      if (lado === 1) { x = irnd(wid - 50 - 24) + box.l + 50; y = box.b; }
      if (lado === 2) { y = irnd(het - 50 - 24) + box.t + 25; x = box.l - 14; }
      if (lado === 3) { y = irnd(het - 50 - 24) + box.t + 25; x = box.r; }
    } else {
      const where = Math.floor(1 + rnd(6)) / 8;
      if (lado === 0) { x = wid * where - 24 + box.l; y = box.t - 14; }
      if (lado === 1) { x = wid * where - 24 + box.l; y = box.b; }
      if (lado === 2) { y = het * where - 24 + box.t; x = box.l - 14; }
      if (lado === 3) { y = het * where - 24 + box.t; x = box.r; }
    }
    dir = [270, 90, 0, 180][lado];
    const spd = curva ? 1.5 + rnd(0.5) : 2 + rnd(1.5);
    let rot = 0;
    if (curva) rot = rnd(1) < 0.5 ? 1 + rnd(1) : -1 - rnd(1);
    const limite = curva ? 4 + Math.round(rnd(3)) : 2;
    const hacer = (xx, yy) => crear({
      spr: curva ? "b/rotclawbullet_0" : ["b/clawbullet_0", "b/clawbullet_1", "b/clawbullet_2", "b/clawbullet_3"],
      ox: curva ? 12 : 0, oy: curva ? 14 : 0, x: xx - (curva ? 12 : 0), y: yy - (curva ? 12 : 0), imgSpd: curva ? 0 : 0.5, borde: "noborder", alpha: 0,
      fric: curva ? -0.1 : 0, dir, rot,
      step: b => {
        b.alpha = Math.min(1, b.alpha + 0.1);
        b.dir += b.rot; const s = Math.max(velocidad(b), spd); movimiento(b, b.dir, s); if (curva) b.ang = b.dir;
        // scr_bordercross: se va al cruzar el borde opuesto
        const r = bbox(b);
        if ((dir === 270 && r.t > box.b + 12) || (dir === 90 && r.b < box.t - 12) || (dir === 0 && r.l > box.r + 12) || (dir === 180 && r.r < box.l - 12)) b.vivo = false;
      }
    });
    const primera = hacer(x, y); movimiento(primera, dir, spd);
    let l = 0;
    const g = crear({
      bala: false, alarm: [0, 0, 0, 0, curva ? 6 : 26],
      alarma: (q) => { l++; const c = hacer(x, y); movimiento(c, dir, spd); if (l < limite) q.alarm[4] = curva ? 6 : 26; else q.vivo = false; }
    });
    return g;
  }

  // =====================================================================
  // Textos
  // =====================================================================
  function decir(full, onDone, espera = true) {
    texto = { full, cur: 0, onDone, espera, t: 0 };
  }
  function textoTick() {
    if (!texto) return;
    if (texto.cur < texto.full.length) {
      texto.cur++;
      const c = texto.full[texto.cur - 1];
      if (c !== " " && c !== "\n" && texto.cur % 2 === 1) sonar("txt");
      if (presiona("Cancel")) texto.cur = texto.full.length;
      return;
    }
    if (!texto.espera) return;
    if (presiona("Confirm")) { const f = texto.onDone; texto = null; if (f) f(); }
  }

  // =====================================================================
  // Flujo de la pelea
  // =====================================================================
  function iniciar(p, id, pantalla) {
    if (activa || !window.Jugador) return;
    const def = MONSTRUOS[id] || MONSTRUOS.froggit;
    activa = true; cerrando = false; jugadorRef = p;
    if (typeof frenar === "function") frenar();
    initAudio();
    for (const k in held) held[k] = false; for (const k in pad) { pad[k] = 0; last[k] = 0; pulsado[k] = false; }
    mon = Object.assign({ id, maxhp: def.hp, frame: 0, shudder: 0, hurtT: 0, alpha: 1, yoff: 0, come: false, comio: false, ignora: 0, dlgExtra: null, hpVis: def.hp }, def);
    mon.hp = def.hp;
    objs = []; efectos = []; shards = []; texto = null; burbuja = null; target = null; dust = null;
    box = { ...MENU_BOX }; boxObj = { ...MENU_BOX };
    turnos = 0; frame = 0; uiSel = -1; menuSel = 0;
    heart = { x: 0, y: 0, visible: true, invc: 0, split: false };
    const px = pantalla ? pantalla.x : 320, py = pantalla ? pantalla.y : 240;
    intro = { t: 0, fx: px - 8, fy: py - 8, tx: UIB[0].x + 8, ty: UIB[0].y + 13, mundo: pantalla && pantalla.captura };
    heart.visible = false;
    fase = "intro"; faseT = 0;
    overlay.classList.remove("eb-saliendo");
    overlay.classList.add("abierta");
    prevTs = 0; acc = 0;
    requestAnimationFrame(loop);
  }

  let flavorActual = "";
  function irAlMenu(textoFlavor, repetir) {
    fase = "menu"; faseT = 0;
    boxObj = { ...MENU_BOX };
    heart.visible = true;
    uiSel = menuSel;
    if (!repetir) flavorActual = textoFlavor || elegirFlavor();
    decir(flavorActual, null, false);
    if (repetir) texto.cur = texto.full.length;
  }
  function elegirFlavor() {
    if (mon.hp < mon.maxhp / 3 && mon.flavorDebil) return mon.flavorDebil;
    if (perdonable() && mon.flavorPerdon && turnos > 0) return mon.flavorPerdon;
    return choose(...mon.flavor);
  }
  function abrirSub(tipo) {
    subTipo = tipo; subSel = 0; subItems = [];
    const nombreMon = { t: "* " + mon.nombre, amarillo: perdonable() };
    if (tipo === "fight" || tipo === "act") subItems = [nombreMon];
    if (tipo === "acts") subItems = [{ t: "* Revisar" }].concat(mon.acts.map(a => ({ t: "* " + a.n })));
    if (tipo === "item") subItems = statsJ().mochila.map(id => ({ t: "* " + J().ITEMS[id].corto }));
    if (tipo === "mercy") subItems = [{ t: "* Perdonar", amarillo: perdonable() }, { t: "* Huir" }];
    if (!subItems.length) { sonar("select"); return false; }
    fase = "sub"; texto = null;
    return true;
  }
  function posItem(i) { return { x: 64 + (i % 2) * 256, y: 270 + Math.floor(i / 2) * 32 }; }

  function menuTick() {
    uiSel = menuSel;
    if (presiona("Right")) { menuSel = (menuSel + 1) % 4; sonar("cursor"); }
    else if (presiona("Left")) { menuSel = (menuSel + 3) % 4; sonar("cursor"); }
    else if (presiona("Confirm")) {
      sonar("select");
      if (menuSel === 0) abrirSub("fight");
      if (menuSel === 1) abrirSub("act");
      if (menuSel === 2) abrirSub("item");
      if (menuSel === 3) abrirSub("mercy");
    }
    const b = UIB[menuSel]; heart.x = b.x + 8; heart.y = b.y + 13;
  }
  function subTick() {
    const n = subItems.length;
    if (presiona("Right") && subSel % 2 === 0 && subSel + 1 < n) { subSel++; sonar("cursor"); }
    else if (presiona("Left") && subSel % 2 === 1) { subSel--; sonar("cursor"); }
    else if (presiona("Down") && subSel + 2 < n) { subSel += 2; sonar("cursor"); }
    else if (presiona("Up") && subSel - 2 >= 0) { subSel -= 2; sonar("cursor"); }
    else if (presiona("Cancel")) {
      sonar("select");
      if (subTipo === "acts") { abrirSub("act"); return; }
      irAlMenu(null, true);
      return;
    } else if (presiona("Confirm")) {
      sonar("select");
      elegirSub(subSel);
      return;
    }
    const p = posItem(subSel); heart.x = p.x; heart.y = p.y + 4;
  }
  function elegirSub(i) {
    if (subTipo === "fight") { empezarAtaque(); return; }
    if (subTipo === "act") { abrirSub("acts"); return; }
    if (subTipo === "acts") { hacerAct(i); return; }
    if (subTipo === "item") {
      const t = J().usarItem(i);
      sonar("heal");
      fase = "texto"; heart.visible = false;
      decir(t, turnoEnemigo);
      return;
    }
    if (subTipo === "mercy") {
      if (i === 0) {
        if (perdonable()) { perdonar(); return; }
        fase = "texto"; heart.visible = false;
        turnoEnemigo();
      } else huir();
    }
  }
  function hacerAct(i) {
    fase = "texto"; heart.visible = false;
    if (i === 0) { decir(mon.check, turnoEnemigo); return; }
    const a = mon.acts[i - 1];
    if (a.mercy !== undefined) mon.mercymod = a.mercy;
    if (a.come) mon.come = true;
    if (a.ignora) { mon.ignora++; if (mon.ignora >= 2) mon.mercymod = 100; }
    mon.dlgExtra = a.dlg || null;
    if (a.huye) { decir(a.t, () => ganar("huyo")); return; }
    decir(a.t, turnoEnemigo);
  }
  function huir() {
    const prob = 50 + turnos * 10;
    fase = "texto"; heart.visible = false;
    if (Math.random() * 100 < prob) {
      sonar("escaped");
      decir("* Te escapaste...", () => terminar());
    } else turnoEnemigo();
  }
  function perdonar() {
    fase = "texto"; heart.visible = false;
    mon.perdonado = true; sonar("dust");
    ganar("perdon");
  }

  // ---------- FIGHT ----------
  function empezarAtaque() {
    fase = "target"; heart.visible = false; texto = null;
    const izq = Math.random() < 0.5;
    target = { w: 548, h: 117, x: 320, y: 318, op: 1, estado: 0, cx: izq ? box.l + 5 : box.r - 5, dir: izq ? 1 : -1, t: 0 };
  }
  function targetTick() {
    const t = target; if (!t) return;
    if (t.estado === 0) {
      t.cx += t.dir * 12;                        // 12 px por cuadro a 30 fps (360 px/s)
      if ((t.dir > 0 && t.cx > box.r) || (t.dir < 0 && t.cx < box.l)) { t.estado = 2; golpear(null); return; }
      if (presiona("Confirm")) {
        t.estado = 1; t.t = 0;
        const dist = Math.abs(t.cx - 320);
        let dmg = J().at() - mon.def + rnd(2);
        if (dist <= 12) dmg = Math.round(dmg * 2.2);
        else dmg = Math.round(dmg * ((t.w - dist) / t.w) * 2);
        if (dmg < 0) dmg = 0;
        golpear(dmg);
      }
    } else t.t++;
    if (t.estado === 2) { t.w -= 32; t.op -= 0.08; if (t.op <= 0) target = null; }
  }
  function golpear(dmg) {
    fase = "golpe"; faseT = 0;
    const m = posMon();
    if (dmg === null) {
      efectos.push({ tipo: "num", txt: "FALLASTE", x: m.cx, y: m.top - 30, t: 0, gris: true });
      setTimeout0(20, () => { target && (target.estado = 2); despuesDelGolpe(); });
      return;
    }
    sonar("fight");
    efectos.push({ tipo: "corte", x: m.cx, y: m.top + m.h / 2 - 50, t: 0 });
    setTimeout0(20, () => {
      sonar(mon.hurtSnd || "ehurt"); sonar("damage");
      const antes = mon.hp;
      mon.hp = Math.max(0, mon.hp - dmg);
      mon.hurtT = 30; mon.shudder = 16;
      efectos.push({ tipo: "num", txt: String(dmg), x: m.cx, y: m.top - 30, t: 0, barra: true, desde: antes, hasta: mon.hp });
      setTimeout0(40, () => { if (target) target.estado = 2; despuesDelGolpe(); });
    });
  }
  function despuesDelGolpe() {
    if (mon.hp <= 0) { matar(); return; }
    turnoEnemigo();
  }
  function matar() {
    fase = "polvo"; faseT = 0;
    sonar("dust");
    const m = posMon();
    dust = { y: 0, h: m.h, particulas: [] };
    ganarLuego = true;
  }
  let ganarLuego = false;

  // ---------- turno del monstruo ----------
  function turnoEnemigo() {
    texto = null; target = null;
    fase = "burbuja"; faseT = 0;
    turnos++;
    let d = mon.dlgExtra || choose(...mon.dialogos);
    mon.dlgExtra = null;
    burbuja = { txt: d, cur: 0, t: 0 };
    boxObj = { ...BORDES[mon.caja] };
  }
  function burbujaTick() {
    const b = burbuja; if (!b) return;
    if (b.cur < b.txt.length) { b.cur++; if (b.cur % 2 === 1) sonar("txt"); if (presiona("Confirm")) b.cur = b.txt.length; return; }
    b.t++;
    if (b.t > 60 || (b.t > 5 && presiona("Confirm"))) {
      burbuja = null;
      fase = "caja"; faseT = 0;
    }
  }
  function cajaLista() { return box.l === boxObj.l && box.r === boxObj.r && box.t === boxObj.t && box.b === boxObj.b; }
  function empezarTurno() {
    fase = "turno"; faseT = 0;
    heart.x = Math.round((box.l + box.r) / 2) - 8; heart.y = Math.round((box.t + box.b) / 2) - 8;
    heart.visible = true;
    const cual = Math.random() < 0.5 ? 0 : 1;
    ataqueActual = mon.ataques[cual];
    ATAQUES[ataqueActual]();
  }
  function turnoTick() {
    // corazón
    const v = 4;
    let dx = 0, dy = 0;
    if (pad.Left) dx -= v; if (pad.Right) dx += v; if (pad.Up) dy -= v; if (pad.Down) dy += v;
    heart.x = Math.max(box.l + 5, Math.min(box.r - 5 - 16, heart.x + dx));
    heart.y = Math.max(box.t + 5, Math.min(box.b - 5 - 16, heart.y + dy));
    pasoObjetos();
    turntimer--;
    if (turntimer < 1 && fase === "turno") {
      objs = [];
      heart.visible = true;
      boxObj = { ...MENU_BOX };
      fase = "cajaVuelta"; faseT = 0;
    }
  }

  // ---------- fin ----------
  function ganar(como) {
    const oro = 2 + Math.floor(Math.random() * 4);          // 2 a 5
    J().darOro(oro);
    const subio = J().sumarMonstruo();
    let t = "* ¡GANASTE!\n* Conseguiste " + oro + " de oro.";
    if (como === "huyo") t = "* " + mon.nombre + " se fue.\n* Conseguiste " + oro + " de oro.";
    if (subio > 0) { t += "\n* ¡Tu LV subió!"; setTimeout0(2, () => sonar("levelup")); }
    fase = "victoria"; heart.visible = false; objs = [];
    boxObj = { ...MENU_BOX };
    pararMusica();
    decir(t, () => terminar());
  }
  function pararMusica() { if (musica) musica.pause(); }
  function terminar() {
    fase = "saliendo";
    salirConFundido();
  }
  function morir() {
    if (fase === "muerte") return;
    fase = "muerte"; faseT = 0;
    objs = []; texto = null; burbuja = null;
    pararTodo();
    heart.visible = true; heart.split = false;
    setTimeout0(20, () => {
      heart.split = true; sonar("split");
      setTimeout0(40, () => {
        heart.visible = false; sonar("shatter");
        for (let i = 0; i < 6; i++) { const a = rnd(360); shards.push({ x: heart.x + 8, y: heart.y + 8, vx: lenX(6, a), vy: lenY(6, a), t: 0 }); }
        setTimeout0(60, () => { fase = "saliendo"; salirConFundido(reubicarTrasDerrota); });
      });
    });
  }

  // temporizadores en cuadros
  let esperas = [];
  function setTimeout0(n, fn) { esperas.push({ n, fn }); }

  // =====================================================================
  // Paso de simulación (30 fps)
  // =====================================================================
  function paso() {
    frame++; faseT++;
    leerPad();
    for (const e of esperas.slice()) { e.n--; if (e.n <= 0) { esperas.splice(esperas.indexOf(e), 1); e.fn(); } }
    if (!activa) return;
    if (heart.invc > 0) heart.invc--;
    // caja (se agranda / achica 15 px por cuadro)
    for (const k of ["l", "r", "t", "b"]) {
      const d = boxObj[k] - box[k];
      box[k] += Math.sign(d) * Math.min(Math.abs(d), 15);
    }
    // monstruo
    if (mon.hurtT > 0) mon.hurtT--;
    if (mon.shudder !== 0 && frame % 2 === 0) mon.shudder = mon.shudder < 0 ? -(mon.shudder + 2) : -mon.shudder;
    for (const e of efectos) e.t++;
    efectos = efectos.filter(e => e.t < (e.tipo === "corte" ? 18 : 50));
    for (const s of shards) { s.vy += 0.33; s.x += s.vx; s.y += s.vy; s.t++; }

    if (fase === "intro") introTick();
    else if (fase === "menu") { textoTick(); menuTick(); }
    else if (fase === "sub") subTick();
    else if (fase === "texto" || fase === "victoria") textoTick();
    else if (fase === "target") targetTick();
    else if (fase === "golpe") { if (target) targetTick(); }
    else if (fase === "burbuja") burbujaTick();
    else if (fase === "caja") { if (cajaLista()) empezarTurno(); }
    else if (fase === "turno") turnoTick();
    else if (fase === "cajaVuelta") { if (cajaLista()) irAlMenu(); }
    else if (fase === "polvo") polvoTick();
  }
  // Entrada como en Undertale: "!" sobre el jugador, pantalla negra con el alma
  // parpadeando 3 veces y el alma que cae hasta el botón FIGHT.
  function introTick() {
    const it = intro; it.t++;
    if (it.t < 15) { heart.visible = false; return; }
    if (it.t < 39) {
      const k = it.t - 15;
      heart.visible = Math.floor(k / 4) % 2 === 0;
      heart.x = it.fx; heart.y = it.fy;
      if (k === 0 || k === 8 || k === 16) sonar("noise");
    } else if (it.t === 39) { sonar("fall"); heart.visible = true; }
    else if (it.t <= 55) {
      const k = (it.t - 39) / 16;
      heart.x = it.fx + (it.tx - it.fx) * k; heart.y = it.fy + (it.ty - it.fy) * k;
    } else {
      musicaPlay();
      irAlMenu(mon.entrada);
    }
  }
  function polvoTick() {
    const d = dust;
    d.y += 3;                                      // se desarma de arriba hacia abajo
    const m = posMon();
    for (let i = 0; i < 6; i++) d.particulas.push({ x: m.left + rnd(m.w), y: m.top + d.y, vx: 0.5 + rnd(1.5), vy: -1 - rnd(1), t: 0 });
    for (const p of d.particulas) { p.x += p.vx; p.y += p.vy; p.t++; }
    d.particulas = d.particulas.filter(p => p.t < 30);
    if (d.y > d.h + 30) { dust = null; ganar("mato"); }
  }

  // =====================================================================
  // Dibujo
  // =====================================================================
  function posMon() {
    const f = sprMon();
    const [w, h] = sprSize(f);
    const cx = 320, bottom = 240 + (mon.yoff || 0);
    return { cx, left: Math.round(cx - w / 2), top: Math.round(bottom - h), w, h, spr: f };
  }
  function sprMon() {
    if (mon.hurtT > 0) return mon.id + "/hurt";
    const n = { froggit: 2, whimsun: 2, moldsmal: 2, loox: 5, vegetoid: 4, snowdrake: 1, icecap: 4 }[mon.id] || 1;
    const i = mon.anim ? Math.floor(frame / (30 / mon.anim)) % n : 0;
    return mon.id + "/" + i;
  }
  function dibujarMon() {
    if (!mon || fase === "intro") return;
    const m = posMon();
    let x = m.left + mon.shudder, y = m.top;
    if (mon.flota) y += Math.round(Math.sin(frame / 12) * 6);
    if (dust) {
      // parte que todavía no se desarmó
      const [img, r] = fuente(m.spr);
      const visibleDesde = Math.min(m.h, dust.y);
      if (visibleDesde < m.h) ctx.drawImage(img, r[0], r[1] + visibleDesde, r[2], r[3] - visibleDesde, x, y + visibleDesde, r[2], r[3] - visibleDesde);
      ctx.fillStyle = "#ddd";
      for (const p of dust.particulas) { ctx.globalAlpha = 1 - p.t / 30; ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 2); }
      ctx.globalAlpha = 1;
      return;
    }
    if (fase === "victoria" && !mon.perdonado) return;
    spr(m.spr, x, y, { alpha: mon.perdonado ? 0.5 : 1 });
  }
  function dibujarBurbuja() {
    if (!burbuja) return;
    const m = posMon();
    const bx = m.left + m.w + 4, by = m.top + 6;
    spr("b/blconsm_0", bx, by);
    drawText("Default", burbuja.txt, bx + 20, by + 10, 1, "rgb(0,0,0)", 0, burbuja.cur);
  }
  function dibujarHUD() {
    const s = statsJ(); const max = J().maxHP();
    drawText("Battle", J().nombre().toUpperCase() + "   LV " + s.lv, 30, 403, 3, null, 0);
    spr("HP/Default/0", 244, 416, { oy: 10 });
    const w = Math.round(max * 1.2);
    ctx.fillStyle = "rgb(255,0,0)"; ctx.fillRect(275, 400, w, 21);
    ctx.fillStyle = "rgb(255,255,0)"; ctx.fillRect(275, 400, Math.round(w * Math.max(0, s.hp) / max), 21);
    drawText("Battle", String(Math.max(0, s.hp)).padStart(2, "0") + " / " + max, 275 + w + 14, 400, 3, null, 0);
    for (const b of UIB) spr(b.n + "/" + (uiSel === b.id && (fase === "menu" || fase === "sub") ? "Highlight" : "Default") + "/0", b.x, b.y);
  }
  function dibujarMenuTextos() {
    if (texto && (fase === "menu" || fase === "texto" || fase === "victoria")) drawText("Default", texto.full, 52, 270, 2, null, 540, texto.cur);
    if (fase === "sub") {
      subItems.forEach((it, i) => {
        const p = posItem(i);
        drawText("Default", it.t, p.x + 32, p.y, 2, it.amarillo ? "rgb(255,255,0)" : null, 0);
        if ((subTipo === "fight" || subTipo === "act") && i === 0 && subTipo === "fight") {
          const bw = 100, x = p.x + 32 + textW(FONTS.Default, it.t) * 2 + 24;
          ctx.fillStyle = "rgb(255,0,0)"; ctx.fillRect(x, p.y + 8, bw, 17);
          ctx.fillStyle = "rgb(0,255,0)"; ctx.fillRect(x, p.y + 8, Math.round(bw * mon.hp / mon.maxhp), 17);
        }
      });
    }
  }
  function dibujarEfectos() {
    for (const e of efectos) {
      if (e.tipo === "corte") {
        const fr = Math.min(5, Math.floor(e.t / 3));
        const hot = [[-1, 5.66667], [-0.5, 1.36364], [0, 0.428571], [0, 0.15625], [0, -0.75], [-0.142857, -4]][fr];
        const nm = "Strike/Default/" + fr, [w, h] = sprSize(nm);
        spr(nm, e.x, e.y, { w: w * 2, h: h * 2, ox: hot[0] * w, oy: hot[1] * h });
      }
      if (e.tipo === "num") {
        const f = FONTS.Damage, tw = textW(f, e.txt);
        const salto = e.t < 10 ? -Math.sin(e.t / 10 * Math.PI) * 14 : 0;
        drawText("Damage", e.txt, e.x - tw / 2, e.y - 34 + salto, 1, e.gris ? "rgb(191,191,191)" : "rgb(255,0,0)", 0);
        if (e.barra) {
          const k = Math.min(1, e.t / 15), hp = e.desde + (e.hasta - e.desde) * k;
          const bw = Math.max(100, Math.round(mon.maxhp * 1.2)), x = Math.round(e.x - bw / 2);
          ctx.fillStyle = "rgb(64,64,64)"; ctx.fillRect(x, e.y + 4, bw, 13);
          ctx.fillStyle = "rgb(0,255,0)"; ctx.fillRect(x, e.y + 4, Math.round(bw * Math.max(0, hp) / mon.maxhp), 13);
        }
      }
    }
  }
  function dibujarTarget() {
    const t = target; if (!t) return;
    spr("Target/Default/0", t.x - Math.max(0, t.w) / 2, t.y - t.h / 2, { w: Math.max(0, t.w), h: t.h, alpha: t.op });
    if (t.estado !== 2) {
      const fr = t.estado === 1 ? (Math.floor(t.t / 2) % 2) : 0;
      spr("TargetChoice/Default/" + fr, t.cx - 7, t.y - 64);
    }
  }
  function dibujarObjs() {
    ctx.save();
    ctx.beginPath(); ctx.rect(box.l + 3, box.t + 3, box.r - box.l - 6, box.b - box.t - 6); ctx.clip();
    for (const b of objs) {
      if (b.dibujar) { b.dibujar(b); continue; }
      if (!b.spr || b.visible === false) continue;
      const nm = Array.isArray(b.spr) ? b.spr[Math.floor(b.img) % b.spr.length] : b.spr;
      spr(nm, b.x, b.y, { ox: b.ox, oy: b.oy, ang: b.ang, alpha: b.alpha, tint: b.tint });
    }
    ctx.restore();
  }
  function dibujarCorazon() {
    if (!heart.visible) return;
    if (heart.invc > 0 && Math.floor(heart.invc / 2) % 2 === 0) return;
    if (heart.split) spr("PlayerHeart/Split/0", heart.x + 8, heart.y + 8, { ox: 8, oy: 10, ang: -90, tint: "rgb(255,0,0)" });
    else spr("PlayerHeart/Default/0", heart.x + 8, heart.y + 8, { ox: 8, oy: 8, ang: -90, tint: "rgb(255,0,0)" });
  }
  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH);
    if (listas < 2) return;
    if (fase === "intro") {
      if (intro.t < 15) {
        if (intro.mundo) ctx.drawImage(intro.mundo, 0, 0, LW, LH);
        spr("b/exc_0", intro.fx + 8, intro.fy - 18, { w: 20, h: 20, ox: 5, oy: 10 });
      }
      dibujarCorazon();
      return;
    }
    if (fase === "muerte" || (fase === "saliendo" && !heart.visible && shards.length)) {
      dibujarCorazon();
      for (const s of shards) spr("HeartShard/Default/" + (Math.floor(s.t / 2) % 4), s.x, s.y, { ox: 8, oy: 8 });
      return;
    }
    dibujarMon();
    dibujarBurbuja();
    dibujarHUD();
    caja(box.l, box.t, box.r - box.l, box.b - box.t);
    dibujarMenuTextos();
    dibujarTarget();
    dibujarObjs();
    dibujarEfectos();
    dibujarCorazon();
  }

  // =====================================================================
  // Bucle (render a la frecuencia del monitor, lógica fija a 30 fps)
  // =====================================================================
  let prevTs = 0, acc = 0;
  function loop(ts) {
    if (!activa) return;
    const dt = prevTs ? Math.min(0.1, (ts - prevTs) / 1000) : 1 / 30;
    prevTs = ts; acc += dt;
    while (acc >= 1 / 30) { acc -= 1 / 30; paso(); if (!activa) break; }
    dibujar();
    if (activa) requestAnimationFrame(loop);
  }

  // =====================================================================
  // Salida
  // =====================================================================
  function salirConFundido(despues) {
    if (cerrando) return;
    cerrando = true;
    overlay.classList.add("eb-saliendo");
    setTimeout(() => {
      activa = false;
      pararTodo();
      overlay.classList.remove("abierta");
      overlay.classList.remove("eb-saliendo");
      esperas = []; objs = [];
      if (despues) despues();
      cerrando = false;
      if (typeof window.alTerminarPelea === "function") window.alTerminarPelea();
    }, 550);
  }
  async function reubicarTrasDerrota() {
    const p = jugadorRef;
    J().curarTodo();
    const guardado = (typeof ESTADO !== "undefined") ? ESTADO.ultimoGuardado : null;
    try {
      if (guardado) {
        if (guardado.mapa && typeof currentMapName !== "undefined" && guardado.mapa !== currentMapName) await loadMap(guardado.mapa);
        p.x = guardado.x; p.y = guardado.y;
      } else if (typeof getDefaultSpawn === "function") {
        const sp = getDefaultSpawn();
        p.x = Math.round(sp.x - p.width / 2); p.y = Math.round(sp.y - p.height / 2);
      }
    } catch (e) { console.error("No se pudo reubicar tras la derrota:", e); }
    if (typeof ESTADO !== "undefined") ESTADO.jugador = { x: p.x, y: p.y };
  }

  window.EnemyFight = {
    iniciar, MONSTRUOS,
    get activa() { return activa; }
  };
})();

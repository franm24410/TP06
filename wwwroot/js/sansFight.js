// sansFight.js — pelea contra Sans, recreación de "Bad Time Simulator" (jcw87/c2-sans-fight)
//
// Sprites, sonidos y guiones de ataque son los del proyecto original de jcw87
// (wwwroot/Battle/SansFight/ + js/sansAttacks.js). Este archivo es un motor en JS
// que reproduce la lógica de sus "event sheets" de Construct 2: línea de tiempo de
// ataques, huesos, blasters, plataformas, alma azul, KARMA, menú FIGHT/ACT/ITEM/MERCY...
//
// Activación (igual que antes):
// - MapRender.js busca objetos "PELx" y llama a window.SansFight.iniciar(player).
// - site.js corta su propio update() mientras SansFight.activa es true.
// - Ganar guarda ESTADO.peleasGanadas.PEL1 = true (se persiste al guardar en un GUA).
// - Perder te saca de la pelea (con fundido) y te manda a ESTADO.ultimoGuardado
//   (mapa+posición del último GUA usado) o, si nunca guardaste, al objeto "Spawn".
//
// Controles (los del original): flechas / WASD mover · Z / ENTER / ESPACIO confirmar ·
// X / SHIFT volver (mantenerlo apretado en un ataque te hace ir más lento).

(function () {
  "use strict";
  const overlay = document.getElementById("sansBattle");
  const cvs = document.getElementById("sbCanvas");
  if (!overlay || !cvs) { console.warn("sansFight.js: falta el HTML de #sansBattle en la vista."); return; }
  const ctx = cvs.getContext("2d");
  cvs.width = 640; cvs.height = 480;

  const BASE = "/Battle/SansFight/";
  const ATLAS = {"tex/DamageFont":[0,0,528,192],"TargetChoice/Default/0":[530,0,14,128],"TargetChoice/Default/1":[546,0,14,128],"Target/Default/0":[0,194,548,117],"SpeechBubble/Default/0":[550,194,237,104],"SpeechBubble/NoEffects/0":[0,313,237,104],"tex/DefaultFont":[239,313,160,96],"tex/SansFont":[401,313,256,96],"SansBody/HandDown/0":[659,313,64,70],"SansBody/HandDown/1":[725,313,64,70],"SansBody/HandDown/2":[791,313,64,70],"SansBody/HandDown/3":[857,313,64,70],"SansBody/HandUp/0":[923,313,64,70],"SansBody/HandUp/1":[0,419,64,70],"SansBody/HandUp/2":[66,419,64,70],"SansBody/HandUp/3":[132,419,64,70],"SansBody/HandUp/4":[198,419,64,70],"Strike/Default/3":[264,419,8,64],"SansBody/HandLeft/0":[274,419,96,48],"SansBody/HandLeft/1":[372,419,96,48],"SansBody/HandLeft/2":[470,419,96,48],"SansBody/HandLeft/3":[568,419,96,48],"SansBody/HandLeft/4":[666,419,96,48],"SansBody/HandRight/0":[764,419,96,48],"SansBody/HandRight/1":[862,419,96,48],"SansBody/HandRight/2":[0,491,96,48],"SansBody/HandRight/3":[98,491,96,48],"SansBody/HandRight/4":[196,491,96,48],"GasterBlaster/Default/0":[294,491,57,44],"GasterBlaster/Fire/0":[353,491,57,44],"GasterBlaster/Fire/1":[412,491,57,44],"GasterBlaster/Fire/2":[471,491,57,44],"GasterBlaster/Fire/3":[530,491,57,44],"GasterBlaster/Fire/4":[589,491,57,44],"MenuBoneBottom/Default/0":[648,491,14,44],"MenuBoneLeft/Default/0":[664,491,14,44],"Strike/Default/2":[680,491,6,42],"UIAct/Default/0":[688,491,110,42],"UIAct/Highlight/0":[800,491,110,42],"UIFight/Default/0":[912,491,110,42],"UIFight/Highlight/0":[0,541,110,42],"UIItem/Default/0":[112,541,110,42],"UIItem/Highlight/0":[224,541,110,42],"UIMercy/Default/0":[336,541,110,42],"UIMercy/Highlight/0":[448,541,110,42],"Strike/Default/4":[560,541,14,32],"SansHead/BlueEye/0":[576,541,32,30],"SansHead/BlueEye/1":[610,541,32,30],"SansHead/ClosedEyes/0":[644,541,32,30],"SansHead/Default/0":[678,541,32,30],"SansHead/LookLeft/0":[712,541,32,30],"SansHead/NoEyes/0":[746,541,32,30],"SansHead/Tired1/0":[780,541,32,30],"SansHead/Tired2/0":[814,541,32,30],"SansHead/Wink/0":[848,541,32,30],"SansTorso/Default/0":[882,541,54,25],"SansTorso/Shrug/0":[938,541,72,24],"tex/BattleFont":[0,585,96,24],"tex/BoneStabV":[98,585,12,24],"tex/BoneV":[112,585,10,24],"SansLegs/Standing/0":[124,585,44,23],"Strike/Default/1":[170,585,4,22],"PlayerHeart/Split/0":[176,585,16,20],"SansLegs/Sitting/0":[194,585,52,17],"HeartShard/Default/0":[248,585,16,16],"HeartShard/Default/1":[266,585,16,16],"HeartShard/Default/2":[284,585,16,16],"HeartShard/Default/3":[302,585,16,16],"PlayerHeart/Default/0":[320,585,16,16],"tex/BoneStabWarn":[338,585,16,16],"tex/CombatZone":[356,585,16,16],"tex/GasterBlast1":[374,585,16,16],"tex/GasterBlast2":[392,585,16,16],"tex/GasterBlast3":[410,585,16,16],"tex/GasterBlastHit":[428,585,16,16],"tex/HPBackground":[446,585,16,16],"tex/HPBar":[464,585,16,16],"tex/KRBar":[482,585,16,16],"Strike/Default/5":[500,585,14,12],"tex/BoneStabH":[516,585,24,12],"HP/Default/0":[542,585,23,10],"KR/Default/0":[567,585,23,10],"tex/BoneH":[592,585,24,10],"SansSweat/Sweat1/0":[618,585,32,9],"SansSweat/Sweat2/0":[652,585,32,9],"SansSweat/Sweat3/0":[686,585,32,9],"tex/Platform1":[720,585,16,7],"tex/Platform2":[738,585,16,7],"Strike/Default/0":[756,585,4,6]};
  const LW = 640, LH = 480;

  // =====================================================================
  // Utilidades estilo Construct 2
  // =====================================================================
  const D2R = Math.PI / 180;
  const sinD = a => Math.sin(a * D2R), cosD = a => Math.cos(a * D2R);
  function flt(v) { if (typeof v === "number") return v; const f = parseFloat(v); return isNaN(f) ? 0 : f; }
  function int(v) { if (typeof v === "number") return Math.floor(v); const i = parseInt(v, 10); return isNaN(i) ? 0 : i; }
  function str(v) { return v === undefined || v === null ? "" : String(v); }
  function angleTo(x1, y1, x2, y2) { return Math.atan2(y2 - y1, x2 - x1) / D2R; }
  function withinAngle(a, tol, b) { let d = ((a - b) % 360 + 540) % 360 - 180; return Math.abs(d) <= tol; }
  function choose(...a) { return a[Math.floor(Math.random() * a.length)]; }
  function overlap(a, b) { return a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t; }
  function inRect(px, py, r) { return px >= r.l && px <= r.r && py >= r.t && py <= r.b; }

  // =====================================================================
  // Imágenes (atlas) y teñido (efecto "Tint" = multiplicar color)
  // =====================================================================
  const atlasImg = new Image();
  let atlasListo = false;
  atlasImg.onload = () => { atlasListo = true; };
  atlasImg.src = BASE + "atlas.png";
  const tintCache = {};
  function atlasTint(color) {
    if (!color) return atlasImg;
    if (tintCache[color]) return tintCache[color];
    const c = document.createElement("canvas");
    c.width = atlasImg.naturalWidth; c.height = atlasImg.naturalHeight;
    const g = c.getContext("2d");
    g.drawImage(atlasImg, 0, 0);
    g.globalCompositeOperation = "multiply"; g.fillStyle = color; g.fillRect(0, 0, c.width, c.height);
    g.globalCompositeOperation = "destination-in"; g.drawImage(atlasImg, 0, 0);
    tintCache[color] = c;
    return c;
  }
  const COL = {
    red: "rgb(255,0,0)", blue: "rgb(0,60,255)",            // alma roja / azul
    boneBlue: "rgb(20,169,255)", boneOrange: "rgb(255,160,64)",
    grey: "rgb(191,191,191)", black: "rgb(0,0,0)", magenta: "rgb(255,0,255)"
  };
  // Dibuja el sprite `name` con su "hotspot" (hx,hy normalizados) en (x,y), tamaño w×h, ángulo en grados.
  function spr(name, x, y, w, h, hx, hy, ang, tint, alpha) {
    const r = ATLAS[name]; if (!r || !atlasListo) return;
    const src = atlasTint(tint);
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
    ctx.translate(Math.round(x), Math.round(y));
    if (ang) ctx.rotate(ang * D2R);
    ctx.drawImage(src, r[0], r[1], r[2], r[3], -hx * w, -hy * h, w, h);
    ctx.restore();
  }
  function sprSize(name) { const r = ATLAS[name]; return r ? [r[2], r[3]] : [0, 0]; }
  // 9-patch (CombatZone, huesos, plataformas...). mode "tile" o "stretch".
  function nine(name, x, y, w, h, m, mode, tint, alpha) {
    const r = ATLAS[name]; if (!r || !atlasListo || w <= 0 || h <= 0) return;
    const src = atlasTint(tint);
    const [ml, mr, mt, mb] = m;
    const sx = r[0], sy = r[1], sw = r[2], sh = r[3];
    x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
    ctx.save();
    if (alpha !== undefined) ctx.globalAlpha = alpha;
    // columnas y filas de origen/destino
    const cw = sw - ml - mr, ch = sh - mt - mb;
    let dl = ml, dr = mr, dt = mt, db = mb;
    if (dl + dr > w) { dl = Math.floor(w / 2); dr = w - dl; }
    if (dt + db > h) { dt = Math.floor(h / 2); db = h - dt; }
    const dw = w - dl - dr, dh = h - dt - db;
    const cols = [[sx, ml, x, dl], [sx + ml, cw, x + dl, dw], [sx + sw - mr, mr, x + w - dr, dr]];
    const rows = [[sy, mt, y, dt], [sy + mt, ch, y + dt, dh], [sy + sh - mb, mb, y + h - db, db]];
    for (let ri = 0; ri < 3; ri++) {
      const [ry, rh, dy, ddh] = rows[ri]; if (rh <= 0 || ddh <= 0) continue;
      for (let ci = 0; ci < 3; ci++) {
        const [cx, cwid, dx, ddw] = cols[ci]; if (cwid <= 0 || ddw <= 0) continue;
        const tileX = mode === "tile" && ci === 1, tileY = mode === "tile" && ri === 1;
        if (!tileX && !tileY) {
          // esquinas recortadas si el destino es más chico que el margen
          const uw = Math.min(cwid, ddw), uh = Math.min(rh, ddh);
          if (ci !== 1 && ri !== 1) ctx.drawImage(src, ci === 2 ? cx + cwid - uw : cx, ri === 2 ? ry + rh - uh : ry, uw, uh, dx, dy, uw, uh);
          else ctx.drawImage(src, cx, ry, cwid, rh, dx, dy, ddw, ddh);
          continue;
        }
        const stepX = tileX ? cwid : ddw, stepY = tileY ? rh : ddh;
        for (let ty = 0; ty < ddh; ty += stepY) {
          const hh = tileY ? Math.min(rh, ddh - ty) : rh, dhh = tileY ? hh : ddh;
          for (let tx = 0; tx < ddw; tx += stepX) {
            const ww = tileX ? Math.min(cwid, ddw - tx) : cwid, dww = tileX ? ww : ddw;
            ctx.drawImage(src, cx, ry, ww, hh, dx + tx, dy + ty, dww, dhh);
          }
        }
      }
    }
    ctx.restore();
  }

  // =====================================================================
  // Fuentes de sprites (Spritefont2) con anchos por carácter
  // =====================================================================
  function mkFont(tex, cw, ch, defs) {
    const widths = {};
    for (const [chars, w] of defs) for (const c of chars) widths[c] = w;
    return { tex, cw, ch, widths };
  }
  const FONTS = {
    Battle: mkFont("tex/BattleFont", 6, 6, [["!\"#%-/0123456789<=>?ABCDEFGHIJKLNOPQRSTUVXYZ[\\]_", 5], ["\"()<>[]", 4], [" -", 3], ["',.:;", 2]]),
    Damage: mkFont("tex/DamageFont", 33, 32, [["~", 29], ["\"/<>I^j{}", 25], ["(),1[]`", 21], ["!'.:;il|", 17]]),
    Default: mkFont("tex/DefaultFont", 10, 16, [["#%&MWmw~", 9], [" $*+-./0123456789=?@ABCDEFGHIJKLNOPQRSTUVXYZ\\^abcdefghijklnopqrstuvxyz", 8], ["\"<>{}", 7], ["!()[]_", 6], ["`", 5], ["',:;|", 4]]),
    Sans: mkFont("tex/SansFont", 16, 16, [["W", 15], ["@", 14], ["%Q", 13], ["MO", 12], ["#&GNVX_", 11], [" $ACHJSTUYZmw", 10], ["247?BDEKdxy~", 9], ["*+/0135689FILR\\^abcefghknopqrtuvz", 8], ["-=Pjs{}", 7], ["()<>[]", 6], ["\";`", 5], ["!',.:il|", 4]])
  };
  // Las fuentes originales solo traen ASCII: las letras con tilde, la ñ y ¿ ¡ se arman
  // dibujando la letra base y agregándole el acento con píxeles.
  const DIAC = {
    "á": ["a", "acute"], "é": ["e", "acute"], "í": ["i", "acute"], "ó": ["o", "acute"], "ú": ["u", "acute"], "ñ": ["n", "tilde"],
    "Á": ["A", "acute"], "É": ["E", "acute"], "Í": ["I", "acute"], "Ó": ["O", "acute"], "Ú": ["U", "acute"], "Ñ": ["N", "tilde"],
    "ü": ["u", "diaer"], "¿": ["?", "inv"], "¡": ["!", "inv"]
  };
  // arriba de cada letra (en píxeles de la fuente): [xMin, xMax] y dónde empieza la minúscula/mayúscula
  const GLIFO = {
    Default: { top: { low: 4, up: 2 }, bb: { a: [1, 6], e: [1, 6], i: [1, 6], o: [1, 6], u: [1, 6], n: [1, 6], A: [1, 6], E: [1, 6], I: [1, 6], O: [1, 6], U: [1, 6], N: [1, 6] } },
    Sans: { top: { low: 5, up: 2 }, bb: { a: [1, 6], e: [1, 6], i: [1, 2], o: [1, 6], u: [1, 6], n: [1, 6], A: [1, 8], E: [1, 7], I: [1, 6], O: [1, 10], U: [1, 8], N: [1, 9] } }
  };
  const baseChar = c => DIAC[c] ? DIAC[c][0] : c;
  function charW(f, c) { c = baseChar(c); return f.widths[c] !== undefined ? f.widths[c] : f.cw; }
  function textW(f, s) { let w = 0; for (const c of s) w += charW(f, c); return w; }
  // Corta el texto en líneas (word wrap) y devuelve [{txt, start}]
  function wrap(f, text, scale, maxW) {
    const out = [];
    let pos = 0;
    for (const para of text.split("\n")) {
      const words = para.split(" ");
      // si el renglón empieza con "* ", lo que sigue en el próximo renglón queda alineado después del asterisco
      const sangria = para.startsWith("* ") ? textW(f, "* ") : 0;
      let line = "", lineStart = pos, p = pos, ind = 0;
      for (let i = 0; i < words.length; i++) {
        const wd = words[i];
        const cand = line === "" && i === 0 ? wd : line + " " + wd;
        if (line !== "" && maxW && (textW(f, cand) + ind) * scale > maxW) {
          out.push({ txt: line, start: lineStart, ind });
          line = wd; lineStart = p; ind = sangria;
        } else line = cand;
        p += wd.length + 1;
      }
      out.push({ txt: line, start: lineStart, ind });
      pos += para.length + 1;
    }
    return out;
  }
  function drawText(fontName, text, x, y, scale, tint, maxW, shown, alpha) {
    const f = FONTS[fontName]; if (!atlasListo) return;
    const r = ATLAS[f.tex]; const src = atlasTint(tint);
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
              // ¿ ¡ = ? ! dados vuelta
              ctx.save(); ctx.translate(xx + charW(f, b) * scale, yy + f.ch * scale); ctx.rotate(Math.PI);
              ctx.drawImage(src, sx, sy, f.cw, f.ch, 0, 0, f.cw * scale, f.ch * scale);
              ctx.restore();
            } else if (d && b === "i" && g) {
              // í sin el puntito de la i
              const t = g.top.low;
              ctx.drawImage(src, sx, sy + t, f.cw, f.ch - t, xx, yy + t * scale, f.cw * scale, (f.ch - t) * scale);
            } else ctx.drawImage(src, sx, sy, f.cw, f.ch, xx, yy, f.cw * scale, f.ch * scale);
            if (d && d[1] !== "inv" && g && g.bb[b]) {
              const [x0, x1] = g.bb[b];
              const up = b === b.toUpperCase();
              const t = up ? g.top.up : g.top.low, gap = up ? 0 : 1;
              const cx = Math.floor((x0 + x1) / 2);
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
  // Audio (Web Audio para efectos, <audio> para la música)
  // =====================================================================
  const SONIDOS = ["BattleText", "BoneStab", "Ding", "Flash", "GasterBlast", "GasterBlast2", "GasterBlaster", "HeartShatter",
    "HeartSplit", "MenuCursor", "MenuSelect", "PlayerDamaged", "PlayerFight", "PlayerHeal", "SansSpeak", "Slam", "Warning"];
  let actx = null, master = null;
  const buffers = {};
  const tagged = {};      // tag -> [sources]
  const vivos = new Set();
  function initAudio() {
    if (actx) { if (actx.state === "suspended") actx.resume().catch(() => { }); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    actx = new AC();
    master = actx.createGain(); master.gain.value = 0.6; master.connect(actx.destination);
    for (const n of SONIDOS) {
      fetch(BASE + "snd/" + n + ".ogg").then(r => r.arrayBuffer())
        .then(b => new Promise((ok, err) => actx.decodeAudioData(b, ok, err)))
        .then(buf => { buffers[n] = buf; }).catch(() => { });
    }
  }
  // El navegador solo deja arrancar el audio después de una tecla/clic del jugador:
  // se prepara con la primera tecla que se toque en el juego (mucho antes de llegar a Sans).
  function precargar() {
    window.removeEventListener("keydown", precargar, true);
    window.removeEventListener("pointerdown", precargar, true);
    initAudio(); musicaObj();
  }
  window.addEventListener("keydown", precargar, true);
  window.addEventListener("pointerdown", precargar, true);
  function sonar(name, rate, tag) {
    if (!actx || !buffers[name]) return;
    try {
      const s = actx.createBufferSource();
      s.buffer = buffers[name];
      if (rate) s.playbackRate.value = rate;
      s.connect(master); s.start();
      vivos.add(s);
      s.onended = () => { vivos.delete(s); if (tag && tagged[tag]) tagged[tag] = tagged[tag].filter(x => x !== s); };
      if (tag) (tagged[tag] = tagged[tag] || []).push(s);
    } catch (e) { }
  }
  function pararTag(tag) { for (const s of (tagged[tag] || [])) { try { s.stop(); } catch (e) { } } tagged[tag] = []; }
  let musica = null;
  function musicaObj() {
    if (!musica) { musica = new Audio(BASE + "snd/mus_zz_megalovania.ogg"); musica.loop = true; musica.volume = 0.5; musica.preload = "auto"; }
    return musica;
  }
  let musicaSonando = false;
  function musicaPlay() { const m = musicaObj(); m.currentTime = 0; m.play().catch(() => { }); musicaSonando = true; }
  function musicaPausa(p) { if (!musica || !musicaSonando) return; if (p) musica.pause(); else musica.play().catch(() => { }); }
  function pararTodo() {
    for (const s of vivos) { try { s.stop(); } catch (e) { } }
    vivos.clear(); for (const k in tagged) tagged[k] = [];
    if (musica) { musica.pause(); musicaSonando = false; }
  }

  // =====================================================================
  // Input (VPad del original)
  // =====================================================================
  const KEYMAP = {
    arrowup: "Up", w: "Up", arrowdown: "Down", s: "Down", arrowleft: "Left", a: "Left", arrowright: "Right", d: "Right",
    z: "Confirm", enter: "Confirm", " ": "Confirm", x: "Cancel", shift: "Cancel"
  };
  const held = {}, pulsado = {};
  const pad = { Up: 0, Down: 0, Left: 0, Right: 0, Confirm: 0, Cancel: 0 };
  const last = { Up: 0, Down: 0, Left: 0, Right: 0, Confirm: 0, Cancel: 0 };
  // captura: si la pelea está activa, el resto del juego (site.js) no ve las teclas
  window.addEventListener("keydown", (e) => {
    if (!activa) return;
    const b = KEYMAP[e.key.toLowerCase()];
    if (b) { if (!e.repeat) { held[b] = true; pulsado[b] = true; } e.preventDefault(); }
    e.stopPropagation();
  }, true);
  window.addEventListener("keyup", (e) => {
    const b = KEYMAP[e.key.toLowerCase()];
    if (b) held[b] = false;
  }, true);
  window.addEventListener("blur", () => { for (const k in held) held[k] = false; });
  function leerPad() {
    for (const k in pad) { last[k] = pad[k]; pad[k] = (held[k] || pulsado[k]) ? 1 : 0; pulsado[k] = false; }
  }
  const presiona = k => pad[k] > last[k];
  const suelta = k => pad[k] < last[k];

  // =====================================================================
  // Estado de la batalla
  // =====================================================================
  let activa = false, jugadorRef = null, cerrando = false;
  let tiempo = 0;                       // "time" de C2
  let HP = 92, MaxHP = 92, KR = 0, KR_T = 0;
  let LV = 19;                          // el LV real del jugador (jugador.js); a Sans se llega con 19 o más
  const nombreJugador = () => (window.Jugador ? window.Jugador.nombre() : "Chara");
  let overlayTransparent = true;
  let waits = [];                       // System.Wait
  function esperar(seg, fn) { waits.push({ t: seg, fn }); }

  const zone = { l: 32, t: 240, r: 608, b: 384, tl: 33, tt: 251, tr: 608, tb: 391, visible: false, info: "" };
  let resizeSpeed = 480, endResize = "";

  const heart = { x: 320, y: 320, dx: 0, dy: 0, angle: 90, mode: 0, visible: false, moveOn: false, slammed: false, slamDamage: false, split: false, overlay: false };
  let maxFallSpeed = 750;

  const sans = {
    x: 320, y: 224, xSpeed: 0, anim: "", legs: true, torso: "Default", tT: 0, tOX: 0, tOY: 0,
    head: "ClosedEyes", hFrame: 0, hT: 0, hOX: 0, hOY: 0,
    body: null, bodyT: 0, sweat: 0,
    nextAttack: 0, hitAttempts: 0, dodgeState: 0, dodgeTimer: 0
  };

  // objetos de ataque
  let bonesH = [], bonesV = [], stabs = [], warns = [], platforms = [], blasters = [];
  let menuBonesLeft = [], menuBonesBottom = [], bottomBones = 0, bottomBoneTimer = 0, bottomBoneAlt = 0;
  let shards = [];
  // UI
  let texts = [];                       // RPGText (DefaultFont, SansFont, DamageFont)
  let bubbles = [];
  let target = null, targetChoice = null, strikes = [];
  let menuState = 0, menuStack = [[0, ""]], menuItems = [];
  const UIB = [
    { id: 0, x: 32, y: 432, n: "UIFight", action: "MenuFight" },
    { id: 1, x: 184, y: 432, n: "UIAct", action: "MenuAct" },
    { id: 2, x: 344, y: 432, n: "UIItem", action: "MenuItem" },
    { id: 3, x: 496, y: 432, n: "UIMercy", action: "MenuMercy" }
  ];
  let uibHighlight = -1;
  // ítems: [tipo, cura, nombre, nombreCorto]
  const ITEMDB = [[0, 99, "la Tarta de caramelo", "Tarta"], [0, 90, "los Fideos instantáneos", "Fideos"], [0, 60, "el Filete facial", "Filete"], [0, 40, "el Héroe legendario", "Héroe L."]];
  let playerItems = [];
  let shake = { intensity: 0, timer: 0, x: 0, y: 0 };

  const menuBack = () => menuStack[menuStack.length - 1][0];

  // =====================================================================
  // Línea de tiempo (intérprete de los .csv)
  // =====================================================================
  const TL = { running: 0, line: 0, T: 0, lines: [], labels: {}, vars: {}, cur: [] };
  function TLPlay(text) {
    TL.lines = text.split("\n");
    TL.labels = {}; TL.vars = { pi: Math.PI };
    TL.lines.forEach((lt, i) => { const tok = str(lt.split(",")[1]); if (tok[0] === ":") TL.labels[tok.slice(1)] = i + 1; });
    TL.T = 0; TL.line = 1; TLLoadLine(); TL.running = 1;
  }
  function TLLoadLine() {
    const text = TL.lines[TL.line - 1];
    TL.cur = [];
    if (text === undefined) { TL.cur = ["0"]; return; }
    for (const tok of text.split(",")) TL.cur.push(tok[0] === "$" ? (TL.vars[tok.slice(1)] ?? 0) : tok);
  }
  function TLStop() { TL.lines = []; TL.cur = []; TL.running = 0; }
  function TLTick(dt) {
    let runCount = 0;
    while (TL.running > 0 && TL.line > 0 && TL.line <= TL.lines.length && TL.T >= flt(TL.cur[0])) {
      const fn = str(TL.cur[1]);
      if (fn[0] !== ":") llamar(fn, TL.cur.slice(2, 11));
      TL.T -= flt(TL.cur[0]);
      TL.line++;
      TLLoadLine();
      runCount++;
      if (runCount >= 1000) { TL.running = 0; console.warn("Sans: bucle infinito en la línea " + TL.line); FN.EndAttack(); }
    }
    if (TL.running > 0) TL.T += dt;
  }
  function jmpAbs(p) {
    const s = str(p);
    if (/^[0-9]+$/.test(s)) TL.line = int(s) - 1;
    else if (TL.labels[s] !== undefined) TL.line = TL.labels[s] - 1;
    else { TL.running = 0; console.warn("Sans: etiqueta " + s + " no existe"); FN.EndAttack(); }
  }
  function setVar(n, v) { TL.vars[str(n)] = v; }

  // =====================================================================
  // Funciones (las mismas que llaman los .csv y el event sheet)
  // =====================================================================
  const FN = {
    // --- CPU ---
    SET: (p) => setVar(p[0], p[1]),
    ADD: (p) => setVar(p[0], flt(p[1]) + flt(p[2])),
    SUB: (p) => setVar(p[0], flt(p[1]) - flt(p[2])),
    MUL: (p) => setVar(p[0], flt(p[1]) * flt(p[2])),
    DIV: (p) => setVar(p[0], flt(p[1]) / flt(p[2])),
    MOD: (p) => setVar(p[0], flt(p[1]) % flt(p[2])),
    FLOOR: (p) => setVar(p[0], Math.floor(flt(p[1]))),
    DEG: (p) => setVar(p[0], flt(p[1]) * 180 / Math.PI),
    RAD: (p) => setVar(p[0], flt(p[1]) * Math.PI / 180),
    SIN: (p) => setVar(p[0], sinD(flt(p[1]))),
    COS: (p) => setVar(p[0], cosD(flt(p[1]))),
    ANGLE: (p) => setVar(p[0], angleTo(flt(p[1]), flt(p[2]), flt(p[3]), flt(p[4]))),
    RND: (p) => setVar(p[0], Math.floor(Math.random() * int(p[1]))),
    JMPABS: (p) => jmpAbs(p[0]),
    JMPREL: (p) => { TL.line += int(p[0]) - 1; },
    JMPZ: (p) => { if (flt(p[1]) === 0) jmpAbs(p[0]); },
    JMPNZ: (p) => { if (flt(p[1]) !== 0) jmpAbs(p[0]); },
    JMPE: (p) => { if (flt(p[1]) === flt(p[2])) jmpAbs(p[0]); },
    JMPNE: (p) => { if (flt(p[1]) !== flt(p[2])) jmpAbs(p[0]); },
    JMPL: (p) => { if (flt(p[1]) < flt(p[2])) jmpAbs(p[0]); },
    JMPNL: (p) => { if (flt(p[1]) >= flt(p[2])) jmpAbs(p[0]); },
    JMPG: (p) => { if (flt(p[1]) > flt(p[2])) jmpAbs(p[0]); },
    JMPNG: (p) => { if (flt(p[1]) <= flt(p[2])) jmpAbs(p[0]); },
    GetHeartPos: (p) => { setVar(p[0], heart.x); setVar(p[1], heart.y); },
    Debug: () => { },
    TLPause: () => { TL.running = 0; },
    TLResume: () => { TL.running = 1; },

    // --- generales ---
    Sound: (p) => sonar(str(p[0]), str(p[1]) !== "" ? flt(p[1]) : 0),
    Music: () => musicaPlay(),
    BlackScreen: (p) => {
      if (int(p[0]) === 1) {
        overlayTransparent = false; zone.visible = false; musicaPausa(true);
        blasters = []; menuBonesLeft = []; menuBonesBottom = [];
        bonesH = []; bonesV = []; stabs = []; warns = []; platforms = [];
      } else if (int(p[0]) === 0) {
        overlayTransparent = true; musicaPausa(false); zone.visible = true;
      }
    },
    EndAttack: () => endAttack(),

    // --- Sans ---
    SansAnimation: (p) => { sans.body = null; sans.legs = true; sans.anim = str(p[0]); },
    SansBody: (p) => { sans.anim = ""; sans.legs = false; sans.body = str(p[0]); sans.bodyT = 0; },
    SansTorso: (p) => { sans.body = null; sans.legs = true; sans.torso = str(p[0]); },
    SansHead: (p) => { sans.head = str(p[0]); sans.hFrame = 0; },
    SansSweat: (p) => { sans.sweat = Math.max(0, int(p[0])); },
    SansX: (p) => { sans.x = int(p[0]); },
    SansRepeat: () => { sans.xSpeed = -900; },
    SansEndRepeat: () => { sans.xSpeed = 0; },
    SansText: (p) => sansText(str(p[0]), str(p[1])),
    EndSansText: () => { bubbles = []; TL.running = 1; },

    // --- ataques ---
    BoneH: (p) => bonesH.push({ x: int(p[0]), y: int(p[1]), w: int(p[2]), h: 10, dir: int(p[3]), speed: int(p[4]), color: int(p[5]), damage: 1, karma: 6 }),
    BoneV: (p) => bonesV.unshift({ x: int(p[0]), y: int(p[1]), w: 10, h: int(p[2]), dir: int(p[3]), speed: int(p[4]), color: int(p[5]), damage: 1, karma: 6 }),
    BoneHRepeat: (p) => repeatir(p, "BoneH"),
    BoneVRepeat: (p) => repeatir(p, "BoneV"),
    SineBones: (p) => {
      const count = int(p[0]), spacing = int(p[1]), speed = int(p[2]), height = int(p[3]);
      for (let i = 0; i <= count - 1; i++) {
        let X = 0, dir = 0;
        if (spacing > 0) { X = zone.r + spacing * i; dir = 2; }
        if (spacing < 0) { X = zone.l + spacing * i; dir = 0; }
        const sine = Math.floor(sinD(i / 3 * 180 / Math.PI) * 28);
        let Y = zone.t + 6;
        FN.BoneV([X, Y, height + sine, dir, speed]);
        Y = zone.t + 6 + height + sine + 39;
        FN.BoneV([X, Y, zone.b - 5 - Y, dir, speed]);
      }
    },
    BoneStab: (p) => {
      if (!(flt(p[0]) >= 0 && flt(p[0]) <= 3)) return;
      const w = { dir: int(p[0]), dist: int(p[1]), warn: flt(p[2]), stay: flt(p[3]), x: 0, y: 0, w: 16, h: 16 };
      sonar("Warning");
      const zw = zone.r - zone.l, zh = zone.b - zone.t;
      if (w.dir === 0) { w.w = w.dist - 3; w.h = zh - 16; w.x = zone.r - w.w - 8; w.y = zone.t + 8; }
      if (w.dir === 1) { w.w = zw - 16; w.h = w.dist - 3; w.x = zone.l + 8; w.y = zone.b - w.h - 8; }
      if (w.dir === 2) { w.w = w.dist - 3; w.h = zh - 16; w.x = zone.l + 8; w.y = zone.t + 8; }
      if (w.dir === 3) { w.w = zw - 16; w.h = w.dist - 3; w.x = zone.l + 8; w.y = zone.t + 8; }
      warns.push(w);
    },
    GasterBlaster: (p) => {
      const size = int(p[0]);
      const g = {
        x: int(p[1]), y: int(p[2]), endX: int(p[3]), endY: int(p[4]), endAng: int(p[5]), ang: 90, angle: 90,
        timer: flt(p[6]), state: 0, w: 57, h: 44, fire: false, fireT: 0, leave: 0,
        beam: { visible: false, blastTime: flt(p[7]), timer: 0, base: 0, sine: 0, opacity: 100, hit: false }
      };
      pararTag("GasterBlaster"); sonar("GasterBlaster", 1.2, "GasterBlaster");
      if (g.x === g.endX && g.y === g.endY) { g.ang = g.endAng; g.angle = g.ang; }
      if (size === 0) g.w = 114;
      if (size === 1) { g.w = 114; g.h = 88; }
      if (size === 2) { g.w = 171; g.h = 132; }
      blasters.push(g);
    },
    Platform: (p) => {
      const pl = { x: int(p[0]), y: int(p[1]), w: int(p[2]), h: 7, dir: int(p[3]), speed: int(p[4]), reverse: int(p[5]) > 0 };
      pl.dx = cosD(pl.dir * 90) * pl.speed; pl.dy = sinD(pl.dir * 90) * pl.speed;
      platforms.unshift(pl);
    },
    PlatformRepeat: (p) => repeatir(p, "Platform"),
    HeartMode: (p) => {
      const m = int(p[0]);
      if (m === 0) { heart.mode = 0; heart.angle = 90; }
      if (m === 1) { heart.mode = 1; heart.angle = 90; }
    },
    HeartTeleport: (p) => { heart.x = int(p[0]); heart.y = int(p[1]); heart.visible = true; },
    HeartMaxFallSpeed: (p) => { maxFallSpeed = int(p[0]); },
    SansSlam: (p) => {
      if (!(flt(p[0]) >= 0 && flt(p[0]) <= 3)) return;
      FN.HeartMode([1]);
      heart.slammed = true;
      heart.angle = Math.floor(flt(p[0])) * 90;
      heart.dx = cosD(heart.angle) * maxFallSpeed;
      heart.dy = sinD(heart.angle) * maxFallSpeed;
    },
    SansSlamDamage: (p) => { heart.slamDamage = int(p[0]) !== 0; },
    SansShake: (p) => { shake.intensity = int(p[0]); shake.timer = 0; },
    CombatZoneSpeed: (p) => { resizeSpeed = int(p[0]); },
    CombatZoneResize: (p) => {
      zone.tl = flt(p[0]); zone.tt = flt(p[1]); zone.tr = flt(p[2]); zone.tb = flt(p[3]);
      endResize = str(p[4]); zone.visible = true;
    },
    CombatZoneResizeInstant: (p) => {
      zone.tl = flt(p[0]); zone.tt = flt(p[1]); zone.tr = flt(p[2]); zone.tb = flt(p[3]);
      zone.l = zone.tl; zone.t = zone.tt; zone.r = zone.tr; zone.b = zone.tb;
      zoneTick(0); zone.visible = true;
    },
    CombatZoneResizeAuto: (p) => FN.CombatZoneResizeInstant(p),

    // --- menú ---
    MenuBattle: () => menuBattle(),
    MenuFight: () => menuFight(), MenuFightEnemy: () => menuFightEnemy(),
    MenuAct: () => menuAct(), MenuActEnemy: () => menuActEnemy(),
    MenuCheckSans: () => menuCheckSans(), MenuCheckSans2: () => menuCheckSans2(),
    MenuItem: () => menuItem(), MenuUseItem: () => menuUseItem(),
    MenuMercy: () => menuMercy(), MenuSpare: () => menuSpare(),
    StartAttack: () => startAttack(),
    Win1: () => sansText("bueno, supongo\nque ganaste.", "Win2"),
    Win2: () => ganar()
  };
  function llamar(nombre, params) {
    const f = FN[nombre];
    if (f) f(params || []);
    else if (nombre) console.warn("Sans: función desconocida " + nombre);
  }
  function repeatir(p, fn) {
    const sx = flt(p[0]), sy = flt(p[1]), a = p[2], dir = flt(p[3]), sp = p[4], count = int(p[5]), spacing = int(p[6]);
    for (let i = 0; i <= count - 1; i++) {
      const X = sx - cosD(dir * 90) * spacing * i, Y = sy - sinD(dir * 90) * spacing * i;
      FN[fn]([X, Y, a, dir, sp]);
    }
  }

  // =====================================================================
  // Textos (RPGText)
  // =====================================================================
  function nuevoTexto(o) {
    const t = Object.assign({ font: "Default", x: 0, y: 0, scale: 2, w: 544, text: "", full: "", cur: 0, T: 0, voice: "", interactive: false, endFunc: "", timeout: 0, name: "", tint: null, layer: "cz" }, o);
    texts.push(t); return t;
  }
  function destruirTexto(t) {
    const i = texts.indexOf(t); if (i < 0) return;
    texts.splice(i, 1);
    if (t.endFunc) llamar(t.endFunc);
  }
  function destruirDefaultFont() { for (const t of texts.filter(t => t.font === "Default")) destruirTexto(t); }
  function textoInfo(full, endFunc, interactive) {
    return nuevoTexto({ font: "Default", x: 48, y: 272, scale: 2, w: 544, full, voice: "BattleText", name: "InfoText", endFunc: endFunc || "", interactive: !!interactive, layer: "cz" });
  }
  function sansText(texto, endFunc) {
    const bx = sans.x + 64, by = sans.y - 128;
    bubbles.push({ x: bx, y: by });
    nuevoTexto({ font: "Sans", x: bx + 32, y: by + 16, scale: 1, w: 256, full: texto, voice: "SansSpeak", interactive: true, endFunc: endFunc || "EndSansText", tint: COL.black, layer: "enemies" });
    TL.running = 0;
  }
  function textosTick(dt) {
    for (const t of texts.slice()) {
      t.T += dt;
      if (t.cur < t.full.length && t.T >= 1 / 30) {
        t.T -= 1 / 30; t.cur++;
        t.text = t.full.slice(0, t.cur);
        if (t.voice) sonar(t.voice);
      }
    }
    for (const t of texts.slice()) {
      if (!texts.includes(t)) continue;
      if (t.interactive) {
        if (presiona("Confirm") && t.cur === t.full.length) { destruirTexto(t); continue; }
        if (presiona("Cancel")) { t.cur = t.full.length; t.text = t.full; t.T = 0; }
      } else if (t.cur === t.full.length && t.timeout > 0) {
        t.timeout -= Math.min(dt, t.timeout);
        if (t.timeout === 0) destruirTexto(t);
      }
    }
  }

  // =====================================================================
  // Menú de batalla
  // =====================================================================
  function crearMenuItem(x, y, id, text, action) {
    menuItems.push({ x, y, id, text, action });
    nuevoTexto({ font: "Default", x: x + 32, y, scale: 2, w: 512, text, full: "", cur: 0, name: "Menu" + id, layer: "bg" });
  }
  function menuBackAction(a) { menuStack[menuStack.length - 1][1] = a; }
  function battleMenuEnable(on) {
    if (on !== 0) {
      menuStack = [[menuStack[0][0], menuStack[0][1]]];
      menuState = 1;
      FN.CombatZoneResize([33, 251, 608, 391, "MenuBattle"]);
    } else menuState = 0;
  }
  function menuBattle() {
    menuItems = []; destruirDefaultFont();
    menuBackAction("");
    menuState = 2;
    textoInfo(zone.info);
    for (const b of UIB) menuItems.push({ x: b.x, y: b.y, id: b.id, text: "", action: b.action, ui: true });
  }
  function menuEnemyList() {
    let action = "";
    if (menuStack[0][0] === 0) action = "MenuFightEnemy";
    if (menuStack[0][0] === 1) action = "MenuActEnemy";
    crearMenuItem(64, 272, 0, "* Sans", action);
  }
  function menuFight() { menuItems = []; destruirDefaultFont(); menuBackAction("MenuBattle"); menuState = 3; menuEnemyList(); }
  function menuFightEnemy() {
    menuItems = []; destruirDefaultFont();
    menuState = 0; heart.visible = false;
    target = { x: 320, y: 320, w: 548, h: 117, state: 0, opacity: 100 };
    if (Math.floor(Math.random() * 2) === 0) targetChoice = { x: zone.l, y: 320, dir: 0, anim: false, t: 0 };
    else targetChoice = { x: zone.r, y: 320, dir: 2, anim: false, t: 0 };
  }
  function menuAct() { menuItems = []; destruirDefaultFont(); menuBackAction("MenuBattle"); menuState = 3; menuEnemyList(); }
  function menuActEnemy() { menuItems = []; destruirDefaultFont(); menuBackAction("MenuAct"); menuState = 3; crearMenuItem(64, 272, 0, "* Revisar", "MenuCheckSans"); }
  function menuCheckSans() {
    menuItems = []; destruirDefaultFont();
    menuState = 0;
    textoInfo("* SANS 1 ATQ 1 DEF\n* El enemigo más fácil.\n* Solo puede hacer 1 de daño.", sans.hitAttempts > 0 ? "MenuCheckSans2" : "StartAttack", true);
    heart.visible = false;
  }
  function menuCheckSans2() { textoInfo("* No puede esquivar para\n  siempre.\n* Seguí atacando.", "StartAttack", true); }
  function menuItem() {
    if (playerItems.length === 0) { menuStack.pop(); return; }
    menuItems = []; destruirDefaultFont(); menuBackAction("MenuBattle"); menuState = 3;
    nuevoTexto({ font: "Default", x: 384, y: 336, scale: 2, w: 256, text: "PÁGINA 1", name: "Page", layer: "cz" });
    for (let i = 0; i <= Math.min(3, playerItems.length - 1); i++)
      crearMenuItem(64 + (i % 2) * 256, 272 + Math.floor(i / 2) * 32, i, "* " + ITEMDB[playerItems[i]][3], "MenuUseItem");
    for (let i = 0; i <= playerItems.length - 4 - 1; i++)
      crearMenuItem(640 + 64 + (i % 2) * 256, 272 + Math.floor(i / 2) * 32, i + 4, "* " + ITEMDB[playerItems[i + 4]][3], "MenuUseItem");
  }
  function menuUseItem() {
    menuItems = []; destruirDefaultFont(); heart.visible = false;
    menuState = 0;
    const slot = menuStack[menuStack.length - 2][0];
    const id = playerItems[slot];
    if (ITEMDB[id][0] === 0) {
      HP += ITEMDB[id][1];
      sonar("PlayerHeal");
      textoInfo("* Te comiste " + ITEMDB[id][2] + ".\n* ¡Recuperaste " + ITEMDB[id][1] + " HP!", "StartAttack", true);
      playerItems.splice(slot, 1);
    }
  }
  function menuMercy() { menuItems = []; destruirDefaultFont(); menuBackAction("MenuBattle"); menuState = 3; crearMenuItem(64, 272, 0, "* Perdonar", "MenuSpare"); }
  function menuSpare() { menuItems = []; destruirDefaultFont(); menuState = 0; heart.visible = false; startAttack(); }

  function menuSelect(dir) {
    const sel = menuItems.find(m => m.id === menuBack()); if (!sel) return;
    let targetId = -1, targetDist = Infinity;
    for (const m of menuItems) {
      if (m.id === sel.id) continue;
      const ang = angleTo(sel.x, sel.y, m.x, m.y);
      if (withinAngle(ang, 0.5, dir * 90)) { const d = Math.hypot(m.x - sel.x, m.y - sel.y); if (d < targetDist) { targetDist = d; targetId = m.id; } }
    }
    if (targetId === -1) {
      targetDist = -Infinity;
      for (const m of menuItems) {
        if (m.id === sel.id) continue;
        const ang = angleTo(sel.x, sel.y, m.x, m.y);
        if (withinAngle(ang, 0.5, dir * 90 - 180)) { const d = Math.hypot(m.x - sel.x, m.y - sel.y); if (d > targetDist) { targetDist = d; targetId = m.id; } }
      }
    }
    if (targetId !== -1) { menuStack[menuStack.length - 1][0] = targetId; sonar("MenuCursor"); }
  }
  function runMenu() {
    const sel = menuItems.find(m => m.id === menuBack());
    if (presiona("Confirm") && sel && sel.action) {
      menuStack.push([0, ""]);
      llamar(sel.action);
      sonar("MenuSelect");
    } else if (presiona("Cancel") && menuStack[menuStack.length - 1][1] !== "") {
      const fn = menuStack[menuStack.length - 1][1];
      menuStack.pop();
      llamar(fn);
      sonar("MenuSelect");
    } else if (presiona("Right")) menuSelect(0);
    else if (presiona("Down")) menuSelect(1);
    else if (presiona("Left")) menuSelect(2);
    else if (presiona("Up")) menuSelect(3);
    for (const m of menuItems) { const t = texts.find(t => t.name === "Menu" + m.id); if (t) { t.x = m.x + 32; t.y = m.y; } }
  }
  function menuTick(dt) {
    // barra de ataque (FIGHT)
    if (target && target.state === 0 && targetChoice) {
      targetChoice.x += cosD(targetChoice.dir * 90) * dt * 360;
      if (targetChoice.dir === 0 && targetChoice.x > zone.r) {
        targetChoice = null; target.state = 2; mostrarMiss(272, 76, 1); startAttack();
      } else if (targetChoice.dir === 2 && targetChoice.x < zone.l) {
        targetChoice = null; target.state = 2; mostrarMiss(272, 76, 1); startAttack();
      } else if (presiona("Confirm")) {
        target.state = 1; targetChoice.anim = true; targetChoice.t = 0;
        strikes.push({ x: sans.x, y: sans.y - 96, t: 0 });
        sonar("PlayerFight");
        sans.dodgeState = 1;
      }
    }
    if (target && target.state === 2) {
      target.w -= dt * 960; target.opacity -= dt * 240;
      if (target.opacity <= 0) target = null;
    }
    if (targetChoice && targetChoice.anim) targetChoice.t += dt;
    for (const s of strikes) s.t += dt;
    strikes = strikes.filter(s => s.t < 6 / 10);

    if (menuState >= 2) runMenu();
    if (menuState === 3 && menuStack[0][0] === 2) {
      const sel = menuItems.find(m => m.id === menuBack());
      if (sel && sel.x > 640) for (const m of menuItems) m.x -= 640;
      if (sel && sel.x < 0) for (const m of menuItems) m.x += 640;
      const pg = texts.find(t => t.name === "Page"); if (pg) pg.text = "PÁGINA " + (Math.floor(menuBack() / 4) + 1);
      for (const m of menuItems) { const t = texts.find(t => t.name === "Menu" + m.id); if (t) t.x = m.x + 32; }
    }
    if (menuState === 0) uibHighlight = -1;
    if (menuState === 1) { const b = UIB[menuBack()]; if (b) { heart.x = b.x + 16; heart.y = b.y + 21; } }
    if (menuState === 2) { uibHighlight = menuBack(); const b = UIB[menuBack()]; if (b) { heart.x = b.x + 16; heart.y = b.y + 21; } }
    if (menuState === 3) { const m = menuItems.find(m => m.id === menuBack()); if (m) { heart.x = m.x + 8; heart.y = m.y + 12; } }
  }
  function mostrarMiss(x, y, timeout) {
    const txt = "FALLASTE";   // (la fuente grande no tiene tildes)
    const cx = x + textW(FONTS.Damage, "MISS") / 2;   // mismo centro que el "MISS" original
    nuevoTexto({ font: "Damage", x: Math.round(cx - textW(FONTS.Damage, txt) / 2), y, scale: 1, w: 0, text: txt, full: "", timeout, tint: COL.grey, layer: "enemies" });
  }

  // =====================================================================
  // Inicio / fin de ataques
  // =====================================================================
  function resetVars() {
    resizeSpeed = 480;
    FN.HeartMode([heart.mode]);
    maxFallSpeed = 750;
    heart.slamDamage = false;
    sans.xSpeed = 0; sans.x = 320;
  }
  function runAttack(n) { TLPlay(window.SANS_ATTACKS[n]); }
  function startAttack() {
    heart.moveOn = true; heart.dx = 0; heart.dy = 0;
    resetVars();
    // MenuBonesOff
    for (const b of menuBonesLeft) b.destroy = true;
    bottomBones = 0;
    const h = sans.hitAttempts, na = sans.nextAttack;
    if (h < 13) {
      const seq = ["sans_intro", "sans_bonegap1", "sans_bluebone", "sans_bonegap2", "sans_platforms1", "sans_platforms2", "sans_platforms3",
        "sans_platforms4", "sans_platformblaster", "sans_platforms4hard", "sans_bonegap1fast", "sans_boneslideh", "sans_bonegap2", "sans_platformblasterfast"];
      if (na < 14) { runAttack(seq[na]); sans.nextAttack++; }
      else runAttack(choose("sans_bonegap1fast", "sans_bonegap2", "sans_boneslideh", "sans_platformblasterfast"));
    }
    if (h === 13) {
      runAttack("sans_spare"); FN.SansSweat([2]); sans.nextAttack = 0; musicaPausa(true);
    }
    if (h > 13 && h <= 22) {
      const seq = ["sans_multi1", "sans_randomblaster1", "sans_multi2", "sans_bonestab1", "sans_bonestab2", "sans_randomblaster2", "sans_boneslidev", "sans_multi3", "sans_bonestab3"];
      if (na < 9) { runAttack(seq[na]); sans.nextAttack++; }
      else runAttack(choose("sans_bonestab3", "sans_multi3", "sans_randomblaster2"));
    }
    if (h > 22) runAttack("sans_final");
  }
  function endAttack() {
    bonesH = []; bonesV = []; stabs = []; warns = []; platforms = [];
    blasters = []; menuBonesLeft = []; menuBonesBottom = [];
    battleMenuEnable(1);
    heart.visible = true; heart.moveOn = false;
    resetVars();
    overlayTransparent = true;
    FN.SansAnimation(["Idle"]); sans.head = "Default"; sans.torso = "Default";
    if (KR >= 0) zone.info = "* Sentís tus pecados trepando\n  por tu espalda.";
    if (KR >= 10) zone.info = "* Sentís tus pecados pesando\n  sobre tu cuello.";
    if (KR >= 20) zone.info = "* El KARMA te recorre las\n  venas.";
    const h = sans.hitAttempts;
    if (h < 13 && sans.nextAttack === 1) {
      zone.info = "* Sentís que la vas a pasar\n  muy mal.";
      if (!musicaSonando) musicaPlay();
    }
    if (h !== 13) musicaPausa(false);
    if (h === 13) zone.info = "* Sans se está tomando un\n  descanso.";
    if (h === 15) zone.info = "* Por fin empieza la batalla\n  de VERDAD.";
    if (h === 19) zone.info = "* Leer esto no parece el mejor\n  uso de tu tiempo.";
    if (h === 20) zone.info = "* Sans empieza a verse muy\n  cansado.";
    if (h === 21) zone.info = "* Sans está preparando algo.";
    if (h === 22) zone.info = "* Sans se prepara para usar su\n  ataque especial.";
    if (h > 22) {
      battleMenuEnable(0);
      FN.CombatZoneResize([zone.l, zone.t, zone.r, zone.b]);
      FN.SansAnimation(["Tired"]); sans.head = "Tired2";
      pararTodo();
      sansText("uf... uf...", "Win1");
    }
    if (h > 13 && h !== 16 && h !== 17 && h <= 22) menuBonesLeft.push({ x: -10, y: 270, timer: 0, destroy: false, damage: 1, karma: 0 });
    if (h > 15 && h <= 22) { bottomBones = 1; bottomBoneTimer = 0; bottomBoneAlt = 0; }
  }

  // =====================================================================
  // Movimiento del corazón (CustomMovement "horizontal y luego vertical", 1px)
  // =====================================================================
  const HEART_JUMP = 180, HEART_CUTOFF = 30;
  const hb = (ox, oy) => ({ l: heart.x - 8 + (ox || 0), r: heart.x + 8 + (ox || 0), t: heart.y - 8 + (oy || 0), b: heart.y + 8 + (oy || 0) });
  function bordes() {
    return [
      { l: zone.l, t: zone.t, r: zone.r, b: zone.t + 5 }, { l: zone.l, t: zone.t, r: zone.l + 5, b: zone.b },
      { l: zone.l, t: zone.b - 5, r: zone.r, b: zone.b }, { l: zone.r - 5, t: zone.t, r: zone.r, b: zone.b }
    ];
  }
  const within = (a, b) => withinAngle(a, 0.5, b);
  function heartCheckSolid(ox, oy) {
    const box = hb(ox, oy);
    for (const w of bordes()) if (overlap(box, w)) return true;
    const me = hb(0, 0);
    for (const p of platforms) {
      const pr = { l: p.x, t: p.y, r: p.x + p.w, b: p.y + p.h };
      if (!overlap(box, pr)) continue;
      const a = heart.angle;
      if (within(a, 0) && p.x > heart.x && heart.dx >= p.dx && me.r <= pr.l + 2) return true;
      if (within(a, 90) && p.y > heart.y && heart.dy >= p.dy && me.b <= pr.t + 2) return true;
      if (within(a, 180) && p.x < heart.x && heart.dx <= p.dx && me.l >= pr.r - 2) return true;
      if (within(a, 270) && p.y < heart.y && heart.dy <= p.dy && me.t >= pr.b - 2) return true;
    }
    return false;
  }
  function alChocar(eje) {
    const v = eje === "x" ? heart.dx : heart.dy;
    if (heart.slammed) {
      heart.slammed = false;
      if (Math.abs(v) >= 330) {
        sonar("PlayerDamaged"); sonar("Slam");
        FN.SansShake([Math.floor(Math.abs(v) / 30 / 3)]);
        if (heart.slamDamage && HP > 1) HP -= 1;
      }
    }
  }
  function moverCorazon(dt) {
    if (!heart.moveOn) return;
    const mx = heart.dx * dt, my = heart.dy * dt;
    // horizontal
    if (mx !== 0) {
      const n = Math.ceil(Math.abs(mx)), st = mx / n;
      for (let i = 0; i < n; i++) {
        const ox = heart.x; heart.x += st;
        if (heartCheckSolid(0, 0)) { alChocar("x"); heart.x = ox; heart.dx = 0; break; }
      }
    }
    if (my !== 0) {
      const n = Math.ceil(Math.abs(my)), st = my / n;
      for (let i = 0; i < n; i++) {
        const oy = heart.y; heart.y += st;
        if (heartCheckSolid(0, 0)) { alChocar("y"); heart.y = oy; heart.dy = 0; break; }
      }
    }
  }
  function controlCorazon(dt) {
    if (!heart.moveOn) return;
    const speed = pad.Cancel ? 75 : 150;
    if (heart.mode === 0) {
      if (pad.Up === pad.Down) heart.dy = 0; else { if (pad.Up) heart.dy = -speed; if (pad.Down) heart.dy = speed; }
      if (pad.Left === pad.Right) heart.dx = 0; else { if (pad.Left) heart.dx = -speed; if (pad.Right) heart.dx = speed; }
    } else if (heart.mode === 1) {
      let down = 0, grav = 0;
      const a = heart.angle;
      if (within(a, 0)) {
        if (presiona("Left")) saltar();
        if (suelta("Left") && heart.dx < -HEART_CUTOFF) heart.dx = -HEART_CUTOFF;
        down = heart.dx;
      }
      if (within(a, 90)) {
        if (presiona("Up")) saltar();
        if (suelta("Up") && heart.dy < -HEART_CUTOFF) heart.dy = -HEART_CUTOFF;
        down = heart.dy;
      }
      if (within(a, 180)) {
        if (presiona("Right")) saltar();
        if (suelta("Right") && heart.dx > HEART_CUTOFF) heart.dx = HEART_CUTOFF;
        down = -heart.dx;
      }
      if (within(a, 270)) {
        if (presiona("Down")) saltar();
        if (suelta("Down") && heart.dy > HEART_CUTOFF) heart.dy = HEART_CUTOFF;
        down = -heart.dy;
      }
      if (down < 240 && down > 15) grav = 540;
      if (down <= 15 && down > -30) grav = 180;
      if (down <= -30 && down > -120) grav = 450;
      if (down <= -120) grav = 180;
      const X = cosD(a), Y = sinD(a);
      if (!heartCheckSolid(X * 0.2, Y * 0.2)) {
        heart.dx += X * grav * dt; heart.dy += Y * grav * dt;
        if (within(a, 0) && heart.dx > maxFallSpeed) heart.dx = maxFallSpeed;
        if (within(a, 90) && heart.dy > maxFallSpeed) heart.dy = maxFallSpeed;
        if (within(a, 180) && heart.dx < -maxFallSpeed) heart.dx = -maxFallSpeed;
        if (within(a, 270) && heart.dy < -maxFallSpeed) heart.dy = -maxFallSpeed;
      }
      if (within(a, 0) || within(a, 180)) {
        heart.dy = 0;
        const box = hb(X * 0.2, Y * 0.2);
        const p = platforms.find(p => overlap(box, { l: p.x, t: p.y, r: p.x + p.w, b: p.y + p.h }));
        if (p) { heart.dx = p.dx; heart.dy = p.dy; }
        if (pad.Up !== pad.Down) { if (pad.Up) heart.dy -= speed; if (pad.Down) heart.dy += speed; }
      }
      if (within(a, 90) || within(a, 270)) {
        heart.dx = 0;
        const box = hb(X * 0.5, Y * 0.5), me = hb(0, 0);
        for (const p of platforms) {
          const pr = { l: p.x, t: p.y, r: p.x + p.w, b: p.y + p.h };
          if (!overlap(box, pr)) continue;
          if (within(a, 90) && p.y > heart.y && heart.dy >= p.dy && me.b <= pr.t + 2) { heart.dx = p.dx; heart.dy = p.dy; heart.y = pr.t - 8.05; }
          if (within(a, 270) && p.y < heart.y && heart.dy <= p.dy && me.t >= pr.b - 2) { heart.dx = p.dx; heart.dy = p.dy; heart.y = pr.b + 8.05; }
        }
        if (pad.Left !== pad.Right) { if (pad.Left) heart.dx -= speed; if (pad.Right) heart.dx += speed; }
      }
    }
  }
  function saltar() {
    if (heart.mode !== 1) return;
    const X = cosD(heart.angle), Y = sinD(heart.angle);
    if (heartCheckSolid(X, Y)) { heart.dx -= X * HEART_JUMP; heart.dy -= Y * HEART_JUMP; }
  }

  // =====================================================================
  // Tick de objetos de ataque
  // =====================================================================
  function fueraLayout(r) { return r.r < 0 || r.l > LW || r.b < 0 || r.t > LH; }
  function ataquesTick(dt) {
    // plataformas (dar vuelta en los bordes si son "Reverse")
    for (const p of platforms) {
      if (!p.reverse) continue;
      if (p.dir === 0 && p.x + p.w >= zone.r) cambiarDir(p, 2);
      else if (p.dir === 1 && p.y + p.h >= zone.b) cambiarDir(p, 3);
      else if (p.dir === 2 && p.x <= zone.l) cambiarDir(p, 0);
      else if (p.dir === 3 && p.y <= zone.t) cambiarDir(p, 1);
    }
    // huesos
    for (const b of bonesH.concat(bonesV)) { b.x += cosD(b.dir * 90) * dt * b.speed; b.y += sinD(b.dir * 90) * dt * b.speed; }
    const vivo = b => !((b.dir === 0 && b.x > LW) || (b.dir === 1 && b.y > LH) || (b.dir === 2 && b.x < -b.w) || (b.dir === 3 && b.y < -b.h));
    bonesH = bonesH.filter(vivo); bonesV = bonesV.filter(vivo);
    // bone stab: aviso -> huesos
    for (const w of warns.slice()) {
      if (w.warn === 0) {
        sonar("BoneStab");
        warns.splice(warns.indexOf(w), 1);
        const zw = zone.r - zone.l, zh = zone.b - zone.t;
        const s = { dir: w.dir, dist: w.dist, stay: w.stay, reverse: false, damage: 1, karma: 6, x: 0, y: 0, w: 0, h: 0, vert: w.dir === 1 || w.dir === 3 };
        if (s.vert) {
          s.x = zone.l; s.w = zw; s.h = w.dist + 8; s.destX = s.x;
          if (w.dir === 1) { s.y = zone.b - 5; s.destY = zone.b - 5 - w.dist; }
          if (w.dir === 3) { s.y = zone.t + 5 - s.h; s.destY = zone.t + 5 - s.h + w.dist; }
        } else {
          s.y = zone.t; s.w = w.dist + 8; s.h = zh; s.destY = s.y;
          if (w.dir === 0) { s.x = zone.r - 5; s.destX = zone.r - 5 - w.dist; }
          if (w.dir === 2) { s.x = zone.l + 5 - s.w; s.destX = zone.l + 5 - s.w + w.dist; }
        }
        stabs.unshift(s);
      }
    }
    for (const w of warns) if (w.warn > 0) w.warn -= Math.min(dt, w.warn);
    for (const s of stabs) {
      const sp = s.dist * 10;
      if (s.reverse) { s.x += cosD(s.dir * 90) * dt * sp; s.y += sinD(s.dir * 90) * dt * sp; }
      else {
        s.x -= cosD(s.dir * 90) * dt * sp; s.y -= sinD(s.dir * 90) * dt * sp;
        if (withinAngle(s.dir * 90, 0.5, angleTo(s.x, s.y, s.destX, s.destY))) { s.x = s.destX; s.y = s.destY; }
        if (s.x === s.destX && s.y === s.destY) {
          s.stay -= Math.min(dt, s.stay);
          if (s.stay === 0) s.reverse = true;
        }
      }
    }
    stabs = stabs.filter(s => !fueraLayout({ l: s.x, t: s.y, r: s.x + s.w, b: s.y + s.h }));
    // gaster blasters
    for (const g of blasters.slice()) {
      if (g.timer > 0 && (g.state === 1 || g.state === 2)) g.timer -= Math.min(dt, g.timer);
      if (g.state === 0) {
        if (Math.abs(g.x - g.endX) >= 3) g.x += (g.endX - g.x) * dt * 10;
        if (Math.abs(g.x - g.endX) < 3) g.x = g.endX;
        if (Math.abs(g.y - g.endY) >= 3) g.y += (g.endY - g.y) * dt * 10;
        if (Math.abs(g.y - g.endY) < 3) g.y = g.endY;
        if (Math.abs(g.ang - g.endAng) >= 3) { g.ang += (g.endAng - g.ang) * dt * 10; g.angle = g.ang; }
        if (Math.abs(g.ang - g.endAng) < 3) { g.ang = g.endAng; g.angle = g.ang; }
        if (g.x === g.endX && g.y === g.endY && g.ang === g.endAng) g.state = 1;
      }
      if (g.state === 1 && g.timer === 0) { g.fire = true; g.fireT = 0; g.state = 2; g.timer = 0.1; }
      if (g.state === 2 && g.timer === 0) {
        g.state = 3;
        g.beam.visible = true; g.beam.hit = true; g.karma = 10;
        pararTag("GasterBlast"); pararTag("GasterBlast2");
        sonar("GasterBlast", 1.2, "GasterBlast"); sonar("GasterBlast2", 1.2, "GasterBlast2");
        if (g.h > 44) FN.SansShake([5]);
      }
      if (g.state === 3) {
        g.leave += 30;
        const rr = Math.max(g.w, g.h) / 2;
        if (fueraLayout({ l: g.x - rr, r: g.x + rr, t: g.y - rr, b: g.y + rr })) g.leave = 0;
        g.x -= cosD(g.angle) * dt * g.leave; g.y -= sinD(g.angle) * dt * g.leave;
      }
      if (g.fire) g.fireT += dt;
      const bm = g.beam;
      if (bm.visible) {
        bm.timer += dt;
        const escala = g.h / 44;
        if (bm.timer < 4 / 30) bm.base += Math.floor(35 * escala / 4) * dt * 30;
        if (bm.timer >= 4 / 30 && bm.timer < 4 / 30 + dt) bm.base = 35 * escala;
        if (bm.timer > 5 / 30 + bm.blastTime) {
          bm.base = bm.base * Math.pow(0.8, dt * 30);
          bm.opacity = Math.max(0, Math.min(100, 100 - ((bm.timer - bm.blastTime) * 30 - 5) * 10));
          if (bm.base <= 2) { blasters.splice(blasters.indexOf(g), 1); continue; }
        }
        if (bm.opacity <= 80) bm.hit = false;
        bm.sine = sinD(bm.timer * 30 / 1.5 * 180 / Math.PI) * bm.base / 4;
      }
    }
    // huesos del menú
    for (const b of menuBonesLeft) { b.timer += dt; b.x = -30 + Math.abs(sinD(600 * b.timer / Math.PI)) * 105; }
    for (const b of menuBonesLeft) if (b.x > 64) b.timer -= dt * 0.72;
    menuBonesLeft = menuBonesLeft.filter(b => !(b.destroy && b.x <= -8));
    if (bottomBones === 1) {
      bottomBoneTimer += dt;
      if (bottomBoneTimer >= 0.6) {
        bottomBoneTimer -= 0.6;
        for (const btn of [0 + bottomBoneAlt, 2 + bottomBoneAlt]) {
          const u = UIB[btn];
          menuBonesBottom.push({ x: u.x + 110, y: LH, state: 0, button: btn, damage: 1, karma: 0 });
        }
        bottomBoneAlt = bottomBoneAlt === 0 ? 1 : 0;
      }
    }
    for (const b of menuBonesBottom) {
      if (b.state === 0) { b.y -= 300 * dt; if (b.y <= 440) { b.y = 440; b.state = 1; } }
      else if (b.state === 1) { b.x -= 150 * dt; const u = UIB[b.button]; if (b.x <= u.x - 14) { b.x = u.x - 14; b.state = 2; } }
      else if (b.state === 2) b.y += 300 * dt;
    }
    menuBonesBottom = menuBonesBottom.filter(b => b.y <= LH);
  }
  function cambiarDir(p, d) { p.dir = d; p.dx = cosD(d * 90) * p.speed; p.dy = sinD(d * 90) * p.speed; }

  // =====================================================================
  // Caja de combate
  // =====================================================================
  function zoneTick(dt) {
    const s = resizeSpeed * dt;
    const step = (v, t) => v < t ? Math.min(t, v + s) : v > t ? Math.max(t, v - s) : v;
    zone.l = step(zone.l, zone.tl); zone.t = step(zone.t, zone.tt);
    zone.r = step(zone.r, zone.tr); zone.b = step(zone.b, zone.tb);
    if (endResize !== "" && zone.l === zone.tl && zone.t === zone.tt && zone.r === zone.tr && zone.b === zone.tb) {
      const f = endResize; endResize = ""; llamar(f);
    }
    const h = hb(0, 0);
    if (overlap(h, zone)) {
      if (zone.l + 5 > h.l) heart.x = zone.l + 5 + 8;
      if (zone.t + 5 > h.t) heart.y = zone.t + 5 + 8;
      if (zone.r - 5 < h.r) heart.x = zone.r - 5 - 8;
      if (zone.b - 5 < h.b) heart.y = zone.b - 5 - 8;
    }
  }

  // =====================================================================
  // Sans (animación + esquive)
  // =====================================================================
  function sansTick(dt) {
    if (sans.xSpeed !== 0) {
      sans.y = zone.t - 16;
      sans.x += sans.xSpeed * dt;
      sans.xSpeed -= 45 * dt;
      if (sans.x < -100) {
        sans.x = 740;
        sans.head = choose("Default", "LookLeft", "Wink", "ClosedEyes", "NoEyes");
        sans.torso = choose("Default", "Default", "Default", "Shrug");
      }
    } else sans.y = zone.tt - 16;
    if (sans.dodgeState !== 0) sans.dodgeTimer += dt;
    if (sans.dodgeState === 1) {
      sans.x = 320 - sinD(sans.dodgeTimer * 225) * 100;
      if (sans.dodgeTimer >= 0.4) {
        sans.x = 220; sans.dodgeState = 2; sans.dodgeTimer = 0;
        esperar(0.6, () => mostrarMiss(272, 50, 1.5));
      }
    } else if (sans.dodgeState === 2) {
      if (sans.dodgeTimer >= 1.1) { sans.dodgeState = 3; sans.dodgeTimer = 0; }
    } else if (sans.dodgeState === 3) {
      sans.x = 320 - cosD(sans.dodgeTimer * 225) * 100;
      if (sans.dodgeTimer >= 0.4) {
        sans.x = 320; sans.dodgeState = 0; sans.dodgeTimer = 0;
        sans.hitAttempts++;
        targetChoice = null;
        if (target) target.state = 2;
        startAttack();
      }
    }
    if (sans.anim !== "") { sans.tT += dt; sans.hT += dt; }
    if (sans.anim === "Idle") {
      if (sans.tT > 1.2) sans.tT -= 1.2;
      if (sans.hT > 1.2) sans.hT -= 1.2;
      sans.tOX = sinD(360 * sans.tT / 1.2); sans.tOY = sinD(720 * sans.tT / 1.2);
      sans.hOY = -sinD(720 * sans.hT / 1.2) * 0.4;
    } else if (sans.anim === "HeadBob") {
      if (sans.hT > 1.1) sans.hT -= 1.1;
      sans.hOX = sinD(360 * sans.hT / 1.1); sans.hOY = sinD(720 * sans.hT / 1.1);
    } else if (sans.anim === "Tired") {
      if (sans.tT > 3.8) sans.tT -= 3.8;
      if (sans.hT > 3.8) sans.hT -= 3.8;
      sans.tOY = sinD(360 * sans.tT / 3.8); sans.hOY = sinD(360 * sans.hT / 3.8);
    } else if (sans.anim === "") {
      sans.tT = sans.tOX = sans.tOY = sans.hT = sans.hOX = sans.hOY = 0;
    }
    if (sans.head === "BlueEye") sans.hFrame = Math.floor(Math.random() * 2);
    if (sans.body) sans.bodyT += dt;
  }

  // =====================================================================
  // Daño, KARMA, HP
  // =====================================================================
  let lastDamageTime = -1;
  function danar(d, k) { lastDamageTime = tiempo; HP -= d; KR += k; sonar("PlayerDamaged"); }
  function puntoEnBeam(g) {
    const sc = g.h / 44 / 2, a = g.angle * D2R;
    const ox = g.x + Math.cos(a) * 70 * sc, oy = g.y + Math.sin(a) * 70 * sc;
    const dx = heart.x - ox, dy = heart.y - oy;
    const lx = dx * Math.cos(a) + dy * Math.sin(a), ly = -dx * Math.sin(a) + dy * Math.cos(a);
    return lx >= 0 && lx <= 1000 && Math.abs(ly) <= g.beam.base * 3 / 4 / 2;
  }
  function danoTick(dt) {
    if (lastDamageTime < tiempo - 0.033 && heart.mode >= 0) {
      const px = heart.x, py = heart.y;
      // sprites (huesos del menú)
      if (heart.visible) {
        const hits = menuBonesLeft.concat(menuBonesBottom).filter(b => b.damage > 0 && inRect(px, py, { l: b.x, t: b.y, r: b.x + 14, b: b.y + 44 }));
        if (hits.length) { danar(hits[0].damage, hits[0].karma); if (HP <= 0) HP = 1; }
      }
      // rayos de los blasters
      const beams = blasters.filter(g => g.beam.visible && g.beam.hit && puntoEnBeam(g));
      if (beams.length) { danar(1, beams[0].karma); for (const g of beams) if (g.karma >= 3) g.karma = 2; }
      // 9-patch (huesos, bone stab)
      const moving = heart.dx !== 0 || heart.dy !== 0;
      const all = bonesH.concat(bonesV, stabs).filter(b => b.damage > 0 && inRect(px, py, { l: b.x, t: b.y, r: b.x + b.w, b: b.y + b.h }));
      for (const col of [0, 1, 2]) {
        const hs = all.filter(b => (b.color || 0) === col);
        if (!hs.length) continue;
        if (col === 1 && !moving) continue;
        if (col === 2 && moving) continue;
        danar(hs[0].damage, hs[0].karma);
        for (const b of hs) if (b.karma >= 3) b.karma = 2;
      }
    }
    if (KR > 40) KR = 40;
    if (KR >= HP) KR = HP - 1;
    if (KR > 0 && HP > 1) {
      KR_T += dt;
      if (KR >= 40 && KR_T >= 0.033) { KR--; HP--; KR_T = 0; }
      if (KR >= 30 && KR_T >= 0.066) { KR--; HP--; KR_T = 0; }
      if (KR >= 20 && KR_T >= 0.166) { KR--; HP--; KR_T = 0; }
      if (KR >= 10 && KR_T >= 0.5) { KR--; HP--; KR_T = 0; }
      if (KR_T >= 1) { KR--; HP--; KR_T = 0; }
    }
    if (HP > MaxHP) HP = MaxHP;
    if (HP <= 0 && heart.mode >= 0) revivir();
  }
  // "WHO DECIDED THAT?": cada vez que el jugador llegaría a 0 HP, en vez de morir
  // aparece el cartel en el centro, la barra de vida se pone de colores y se rellena.
  const REVIVIR_DUR = 1.6;
  let revivirT = 0;             // > 0 mientras dura el efecto
  function revivir() {
    HP = MaxHP; KR = 0; KR_T = 0;
    revivirT = REVIVIR_DUR;
    sonar("PlayerHeal");
  }
  function morir() {
    heart.mode = -1; heart.moveOn = false; heart.angle = 90; heart.overlay = true;
    TLStop();
    FN.BlackScreen([1]);
    pararTodo();
    blasters = []; menuBonesLeft = []; menuBonesBottom = []; bottomBones = 0;
    texts = []; bubbles = []; target = null; targetChoice = null; menuItems = []; menuState = 0;
    esperar(20 / 30, () => {
      heart.split = true; sonar("HeartSplit");
      esperar(40 / 30, () => {
        heart.visible = false; sonar("HeartShatter");
        for (let i = 0; i < 6; i++) {
          const a = Math.random() * 360;
          shards.push({ x: heart.x, y: heart.y, vx: cosD(a) * 180, vy: sinD(a) * 180, t: 0 });
        }
        esperar(2, () => perder());
      });
    });
  }

  function revivirTick(dt) {
    if (revivirT > 0) revivirT = Math.max(0, revivirT - dt);
    if (diosT > 0) diosT = Math.max(0, diosT - dt);
  }
  // "DIOS TE AYUDA": si llegás a Sans con menos de LV 19, te sube a 19
  const DIOS_DUR = 2.4;
  let diosT = 0;
  function shakeTick(dt) {
    if (shake.intensity > 0) shake.timer += dt;
    else { shake.x = 0; shake.y = 0; }
    if (shake.timer >= 1 / 30) {
      shake.timer -= 1 / 30; shake.intensity--;
      shake.x = shake.intensity * choose(1, -1); shake.y = shake.intensity * choose(1, -1);
    }
  }

  // =====================================================================
  // Dibujo
  // =====================================================================
  function tintBone(c) { return c === 1 ? COL.boneBlue : c === 2 ? COL.boneOrange : null; }
  function dibujarTexto(t) {
    drawText(t.font, t.full ? t.full : t.text, t.x, t.y, t.scale, t.tint, t.w, t.full ? t.cur : undefined);
  }
  function dibujarSans() {
    const legsH = 46;
    let headX, headY;
    if (sans.legs) {
      spr("SansLegs/Standing/0", sans.x, sans.y, 88, 46, 0.477273, 1);
      const tx = sans.x + sans.tOX, ty = sans.y - legsH + sans.tOY;
      const tor = sans.torso === "Shrug" ? "SansTorso/Shrug/0" : "SansTorso/Default/0";
      const [tw, th] = sprSize(tor);
      spr(tor, tx, ty, tw * 2, th * 2, 0.5, 1);
      const hp = sans.torso === "Shrug" ? 0.208333 : 0.24;
      headX = tx + sans.hOX; headY = ty - th * 2 + hp * th * 2 + sans.hOY;
    } else {
      const n = sans.body;
      const frames = { HandDown: 4, HandUp: 5, HandRight: 5, HandLeft: 5 }[n] || 1;
      const fr = Math.min(frames - 1, Math.floor(sans.bodyT * 15));
      const nm = "SansBody/" + n + "/" + fr;
      const [bw, bh] = sprSize(nm);
      const W = bw * 2, Hh = bh * 2;
      const hsx = { HandDown: 0.46875, HandUp: 0.46875, HandRight: 0.34375, HandLeft: 0.34375 }[n] || 0.46875;
      spr(nm, sans.x, sans.y, W, Hh, hsx, 1);
      const pts = {
        HandDown: [[0.46875, 0.4], [0.46875, 0.385714], [0.46875, 0.428571], [0.46875, 0.442857]],
        HandUp: [[0.46875, 0.428571], [0.46875, 0.442857], [0.46875, 0.4], [0.46875, 0.385714], [0.46875, 0.4]],
        HandRight: [[0.34375, 0.125], [0.322917, 0.125], [0.3125, 0.125], [0.375, 0.125], [0.354167, 0.125]],
        HandLeft: [[0.354167, 0.125], [0.375, 0.125], [0.3125, 0.125], [0.322917, 0.125], [0.34375, 0.125]]
      }[n];
      const pt = pts ? pts[fr] : [0.5, 0.4];
      headX = sans.x - hsx * W + pt[0] * W; headY = sans.y - Hh + pt[1] * Hh;
    }
    const hn = "SansHead/" + sans.head + "/" + (sans.head === "BlueEye" ? sans.hFrame : 0);
    spr(ATLAS[hn] ? hn : "SansHead/Default/0", headX, headY, 64, 60, 0.5, 1);
    if (sans.sweat > 0) spr("SansSweat/Sweat" + sans.sweat + "/0", headX, headY - 60, 64, 18, 0.5, 0);
  }
  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH);
    if (!atlasListo) return;
    ctx.save();
    ctx.translate(-shake.x, -shake.y);
    // ---- Background: nombre, HP, KR ----
    drawText("Battle", nombreJugador().toUpperCase() + "   LV " + LV, 32, 402, 3, null, 0);
    spr("HP/Default/0", 224, 416, 23, 10, 0, 1);
    const bgW = Math.floor(MaxHP * 1.2);
    ctx.fillStyle = "rgb(255,0,0)"; ctx.fillRect(256, 400, bgW, 21);
    if (revivirT > 0) {
      // barra de colores que se mueve
      const off = (tiempo * 220) % bgW;
      const g = ctx.createLinearGradient(256 - off, 0, 256 - off + bgW * 2, 0);
      const cols = ["#ff3b3b", "#ff9a2e", "#ffe100", "#3bff5c", "#3bd6ff", "#7a5cff", "#ff3bd6"];
      for (let i = 0; i <= 14; i++) g.addColorStop(i / 14, cols[i % 7]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = "rgb(255,255,0)";
    ctx.fillRect(256, 400, Math.round(bgW * HP / MaxHP), 21);
    if (KR > 0) { ctx.fillStyle = "rgb(255,0,255)"; ctx.fillRect(Math.round(256 + bgW * (HP - KR) / MaxHP), 400, Math.ceil(bgW * KR / MaxHP), 21); }
    spr("KR/Default/0", 400, 416, 23, 10, 1, 1);
    drawText("Battle", String(Math.max(0, HP)).padStart(2, "0") + " / " + MaxHP, 416, 400, 3, KR > 0 ? COL.magenta : null, 0);
    for (const t of texts) if (t.layer === "bg") dibujarTexto(t);
    // ---- Enemies ----
    dibujarSans();
    for (const b of bubbles) spr("SpeechBubble/Default/0", b.x, b.y, 237, 104, 0, 0);
    for (const t of texts) if (t.layer === "enemies") dibujarTexto(t);
    for (const s of strikes) {
      const fr = Math.min(5, Math.floor(s.t * 10));
      const hot = [[-1, 5.66667], [-0.5, 1.36364], [0, 0.428571], [0, 0.15625], [0, -0.75], [-0.142857, -4]][fr];
      const nm = "Strike/Default/" + fr, [w, h] = sprSize(nm);
      spr(nm, s.x, s.y, w * 1.5, h * 1.5, hot[0], hot[1]);
    }
    // ---- Buttons ----
    for (const b of UIB) spr(b.n + "/" + (uibHighlight === b.id ? "Highlight" : "Default") + "/0", b.x, b.y, 110, 42, 0, 0);
    // ---- CombatZone ----
    for (const p of platforms) {
      nine("tex/Platform1", p.x, p.y, p.w, 7, [4, 4, 2, 2], "stretch");
      nine("tex/Platform2", p.x, p.y - 4, p.w, 7, [4, 4, 2, 2], "stretch");
    }
    if (heart.visible && !heart.overlay) dibujarCorazon();
    for (const b of bonesH) nine("tex/BoneH", b.x, b.y, b.w, 10, [6, 6, 0, 0], "tile", tintBone(b.color));
    for (const w of warns) nine("tex/BoneStabWarn", w.x, w.y, w.w, w.h, [4, 4, 4, 4], "stretch");
    for (const g of blasters) dibujarBlaster(g);
    if (target) spr("Target/Default/0", target.x, target.y, Math.max(0, target.w), target.h, 0.5, 0.504274, 0, null, target.opacity / 100);
    if (targetChoice) {
      const fr = targetChoice.anim ? ((targetChoice.t % (5 / 30)) < 3 / 30 ? 0 : 1) : 0;
      spr("TargetChoice/Default/" + fr, targetChoice.x, targetChoice.y, 14, 128, 0.5, 0.5);
    }
    for (const t of texts) if (t.layer === "cz") dibujarTexto(t);
    for (const b of menuBonesLeft) spr("MenuBoneLeft/Default/0", b.x, b.y, 14, 44, 0, 0);
    for (const b of menuBonesBottom) spr("MenuBoneBottom/Default/0", b.x, b.y, 14, 44, 0, 0);
    // ---- CombatZoneClipped ----
    ctx.save();
    ctx.beginPath(); ctx.rect(Math.round(zone.l), Math.round(zone.t), Math.round(zone.r - zone.l), Math.round(zone.b - zone.t)); ctx.clip();
    for (let i = bonesV.length - 1; i >= 0; i--) { const b = bonesV[i]; if (b.h > 0) nine("tex/BoneV", b.x, b.y, 10, b.h, [0, 0, 6, 6], "tile", tintBone(b.color)); }
    for (let i = stabs.length - 1; i >= 0; i--) {
      const s = stabs[i];
      if (s.vert) nine("tex/BoneStabV", s.x, s.y, s.w, s.h, [0, 0, 6, 6], "tile");
      else nine("tex/BoneStabH", s.x, s.y, s.w, s.h, [6, 6, 0, 0], "tile");
    }
    ctx.restore();
    // ---- Overlay ----
    if (!overlayTransparent) { ctx.fillStyle = "#000"; ctx.fillRect(-20, -20, LW + 40, LH + 40); }
    if (zone.visible) nine("tex/CombatZone", zone.l, zone.t, zone.r - zone.l, zone.b - zone.t, [5, 5, 5, 5], "stretch");
    if (heart.visible && heart.overlay) dibujarCorazon();
    for (const s of shards) spr("HeartShard/Default/" + (Math.floor(s.t * 15) % 4), s.x, s.y, 16, 16, 0.5, 0.5);
    ctx.restore();
    if (revivirT > 0) dibujarCartel("WHO DECIDED THAT?", revivirT, REVIVIR_DUR);
    else if (diosT > 0) dibujarCartel("DIOS TE AYUDA", diosT, DIOS_DUR);
  }
  // Cartel grande en el centro de la pantalla ("WHO DECIDED THAT?", "DIOS TE AYUDA")
  function dibujarCartel(txt, restante, dur) {
    const t = dur - restante;                               // tiempo desde que apareció
    let esc = 1, alpha = 1;
    if (t < 0.12) esc = 0.4 + (t / 0.12) * 0.8;              // "pop" de entrada
    else if (t < 0.22) esc = 1.2 - ((t - 0.12) / 0.1) * 0.2;
    if (restante < 0.4) alpha = restante / 0.4;              // se desvanece al final
    const w = textW(FONTS.Damage, txt), h = FONTS.Damage.ch;
    ctx.save();
    ctx.translate(LW / 2, LH / 2);
    ctx.scale(esc, esc);
    // contorno negro para que se lea aunque haya rayos blancos detrás
    for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]])
      drawText("Damage", txt, -w / 2 + ox, -h / 2 + oy, 1, COL.black, 0, undefined, alpha);
    drawText("Damage", txt, -w / 2, -h / 2, 1, null, 0, undefined, alpha);
    ctx.restore();
  }
  function dibujarCorazon() {
    const tint = heart.mode === 1 ? COL.blue : COL.red;
    if (heart.split) spr("PlayerHeart/Split/0", heart.x, heart.y, 16, 20, 0.5, 0.5, heart.angle, tint);
    else spr("PlayerHeart/Default/0", heart.x, heart.y, 16, 16, 0.5, 0.5, heart.angle, tint);
  }
  function dibujarBlaster(g) {
    const fr = g.fire ? "GasterBlaster/Fire/" + (Math.floor(g.fireT * 30) % 5) : "GasterBlaster/Default/0";
    spr(fr, g.x, g.y, g.w, g.h, g.fire ? 0.508772 : 0.491228, 0.5, g.angle);
    const bm = g.beam;
    if (!bm.visible) return;
    const sc = g.h / 44 / 2;
    ctx.save();
    ctx.globalAlpha = Math.max(0, Math.min(1, bm.opacity / 100));
    ctx.fillStyle = "#fff";
    ctx.translate(g.x, g.y); ctx.rotate(g.angle * D2R);
    const h1 = bm.base + bm.sine, h2 = bm.base / 1.25 + bm.sine, h3 = bm.base / 2 + bm.sine;
    if (h1 > 0) ctx.fillRect(70 * sc, -h1 / 2, 1000, h1);
    if (h2 > 0) ctx.fillRect(60 * sc, -h2 / 2, 10 * sc, h2);
    if (h3 > 0) ctx.fillRect(50 * sc, -h3 / 2, 20 * sc, h3);
    ctx.restore();
  }

  // =====================================================================
  // Bucle
  // =====================================================================
  let prevTs = 0;
  function tick(dt) {
    tiempo += dt;
    leerPad();
    for (const w of waits.slice()) { w.t -= dt; if (w.t <= 0) { waits.splice(waits.indexOf(w), 1); w.fn(); } }
    if (!activa) return;
    // movimiento de "behaviors" (antes que los eventos, como en Construct 2)
    moverCorazon(dt);
    for (const p of platforms) { p.x += p.dx * dt; p.y += p.dy * dt; }
    for (const s of shards) { s.vy += 300 * dt; s.x += s.vx * dt; s.y += s.vy * dt; s.t += dt; }
    TLTick(dt);
    textosTick(dt);
    menuTick(dt);
    controlCorazon(dt);
    ataquesTick(dt);
    zoneTick(dt);
    sansTick(dt);
    danoTick(dt);
    revivirTick(dt);
    shakeTick(dt);
  }
  function loop(ts) {
    if (!activa) return;
    let dt = prevTs ? (ts - prevTs) / 1000 : 1 / 60;
    prevTs = ts;
    dt = Math.min(dt, 1 / 30);
    if (dt > 0) tick(dt);
    dibujar();
    if (activa) requestAnimationFrame(loop);
  }

  // =====================================================================
  // Ciclo de vida (misma API que antes)
  // =====================================================================
  function resetBatalla() {
    tiempo = 0; HP = MaxHP; KR = 0; KR_T = 0; lastDamageTime = -1;
    overlayTransparent = true; waits = [];
    Object.assign(zone, { l: 32, t: 240, r: 608, b: 384, tl: 33, tt: 251, tr: 608, tb: 391, visible: false, info: "" });
    resizeSpeed = 480; endResize = "";
    Object.assign(heart, { x: 320, y: 320, dx: 0, dy: 0, angle: 90, mode: 0, visible: false, moveOn: false, slammed: false, slamDamage: false, split: false, overlay: false });
    maxFallSpeed = 750;
    Object.assign(sans, { x: 320, y: 224, xSpeed: 0, anim: "", legs: true, torso: "Default", tT: 0, tOX: 0, tOY: 0, head: "ClosedEyes", hFrame: 0, hT: 0, hOX: 0, hOY: 0, body: null, bodyT: 0, sweat: 0, nextAttack: 0, hitAttempts: 0, dodgeState: 0, dodgeTimer: 0 });
    bonesH = []; bonesV = []; stabs = []; warns = []; platforms = []; blasters = [];
    menuBonesLeft = []; menuBonesBottom = []; bottomBones = 0; shards = [];
    texts = []; bubbles = []; target = null; targetChoice = null; strikes = [];
    menuState = 0; menuStack = [[0, ""]]; menuItems = []; uibHighlight = -1;
    playerItems = [0, 1, 2, 3, 3, 3, 3, 3];
    shake = { intensity: 0, timer: 0, x: 0, y: 0 };
    TLStop();
    for (const k in held) held[k] = false;
    for (const k in pad) { pad[k] = 0; last[k] = 0; pulsado[k] = false; }
  }

  function iniciar(p) {
    if (activa) return;
    if (typeof ESTADO !== "undefined" && ESTADO.peleasGanadas && ESTADO.peleasGanadas.PEL1) return;
    activa = true; cerrando = false; jugadorRef = p;
    if (typeof frenar === "function") frenar();
    initAudio();
    musicaObj();
    // LV del jugador: si es menor a 19, "DIOS TE AYUDA" y sube a 19
    let subio = false;
    if (window.Jugador) {
      if (window.Jugador.stats().lv < 19) subio = window.Jugador.subirA(19);
      LV = window.Jugador.stats().lv;
    } else LV = 19;
    MaxHP = 16 + 4 * LV;                  // LV 19 = 92 HP, como en el original
    resetBatalla();
    diosT = 0;
    if (subio) {
      diosT = DIOS_DUR;
      try { const a = new Audio("/Battle/Enemigos/snd/snd_levelup.ogg"); a.volume = 0.6; a.play().catch(() => { }); } catch (e) { }
    }
    overlay.classList.remove("sb-saliendo");
    overlay.classList.add("abierta");
    // "On start of layout" del original
    FN.SansAnimation([""]); sans.head = "ClosedEyes";
    startAttack();
    prevTs = 0;
    requestAnimationFrame(loop);
  }

  function cerrarBatalla() {
    activa = false;
    pararTodo();
    overlay.classList.remove("abierta");
  }
  // Cierra con un fundido (como el de cruzar una puerta) en vez de cortar en seco.
  function salirConFundido(despues) {
    if (cerrando) return;
    cerrando = true;
    overlay.classList.add("sb-saliendo");
    setTimeout(() => {
      cerrarBatalla();
      overlay.classList.remove("sb-saliendo");
      if (despues) despues();
      cerrando = false;
    }, 550);
  }
  function ganar() {
    if (typeof ESTADO !== "undefined") {
      if (!ESTADO.peleasGanadas) ESTADO.peleasGanadas = {};
      ESTADO.peleasGanadas.PEL1 = true;
    }
    bubbles = [];
    salirConFundido();
  }
  function perder() { salirConFundido(reubicarTrasDerrota); }

  // Te lleva al último punto guardado (mapa + posición) o, si nunca guardaste, al
  // objeto "Spawn" del mapa actual. Usa las globales de MapRender.js/site.js.
  async function reubicarTrasDerrota() {
    const p = jugadorRef;
    const guardado = (typeof ESTADO !== "undefined") ? ESTADO.ultimoGuardado : null;
    try {
      if (guardado) {
        if (guardado.mapa && typeof currentMapName !== "undefined" && guardado.mapa !== currentMapName) {
          await loadMap(guardado.mapa);
        }
        p.x = guardado.x; p.y = guardado.y;
      } else if (typeof getDefaultSpawn === "function") {
        const spawn = getDefaultSpawn();
        p.x = Math.round(spawn.x - p.width / 2);
        p.y = Math.round(spawn.y - p.height / 2);
      }
    } catch (e) { console.error("No se pudo reubicar tras la derrota:", e); }
    if (typeof ESTADO !== "undefined") ESTADO.jugador = { x: p.x, y: p.y };
  }

  window.SansFight = { iniciar, get activa() { return activa; } };
})();

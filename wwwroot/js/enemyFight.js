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

  const UI_BASE = "/Battle/SansFight/", EN_BASE = "/Battle/Enemigos/", RG_BASE = "/Battle/Guardias/", UX_BASE = "/Battle/Undyne/";
  const ATLAS_UI = {"tex/DamageFont":[0,0,528,192],"TargetChoice/Default/0":[530,0,14,128],"TargetChoice/Default/1":[546,0,14,128],"Target/Default/0":[0,194,548,117],"SpeechBubble/Default/0":[550,194,237,104],"SpeechBubble/NoEffects/0":[0,313,237,104],"tex/DefaultFont":[239,313,160,96],"tex/SansFont":[401,313,256,96],"SansBody/HandDown/0":[659,313,64,70],"SansBody/HandDown/1":[725,313,64,70],"SansBody/HandDown/2":[791,313,64,70],"SansBody/HandDown/3":[857,313,64,70],"SansBody/HandUp/0":[923,313,64,70],"SansBody/HandUp/1":[0,419,64,70],"SansBody/HandUp/2":[66,419,64,70],"SansBody/HandUp/3":[132,419,64,70],"SansBody/HandUp/4":[198,419,64,70],"Strike/Default/3":[264,419,8,64],"SansBody/HandLeft/0":[274,419,96,48],"SansBody/HandLeft/1":[372,419,96,48],"SansBody/HandLeft/2":[470,419,96,48],"SansBody/HandLeft/3":[568,419,96,48],"SansBody/HandLeft/4":[666,419,96,48],"SansBody/HandRight/0":[764,419,96,48],"SansBody/HandRight/1":[862,419,96,48],"SansBody/HandRight/2":[0,491,96,48],"SansBody/HandRight/3":[98,491,96,48],"SansBody/HandRight/4":[196,491,96,48],"GasterBlaster/Default/0":[294,491,57,44],"GasterBlaster/Fire/0":[353,491,57,44],"GasterBlaster/Fire/1":[412,491,57,44],"GasterBlaster/Fire/2":[471,491,57,44],"GasterBlaster/Fire/3":[530,491,57,44],"GasterBlaster/Fire/4":[589,491,57,44],"MenuBoneBottom/Default/0":[648,491,14,44],"MenuBoneLeft/Default/0":[664,491,14,44],"Strike/Default/2":[680,491,6,42],"UIAct/Default/0":[688,491,110,42],"UIAct/Highlight/0":[800,491,110,42],"UIFight/Default/0":[912,491,110,42],"UIFight/Highlight/0":[0,541,110,42],"UIItem/Default/0":[112,541,110,42],"UIItem/Highlight/0":[224,541,110,42],"UIMercy/Default/0":[336,541,110,42],"UIMercy/Highlight/0":[448,541,110,42],"Strike/Default/4":[560,541,14,32],"SansHead/BlueEye/0":[576,541,32,30],"SansHead/BlueEye/1":[610,541,32,30],"SansHead/ClosedEyes/0":[644,541,32,30],"SansHead/Default/0":[678,541,32,30],"SansHead/LookLeft/0":[712,541,32,30],"SansHead/NoEyes/0":[746,541,32,30],"SansHead/Tired1/0":[780,541,32,30],"SansHead/Tired2/0":[814,541,32,30],"SansHead/Wink/0":[848,541,32,30],"SansTorso/Default/0":[882,541,54,25],"SansTorso/Shrug/0":[938,541,72,24],"tex/BattleFont":[0,585,96,24],"tex/BoneStabV":[98,585,12,24],"tex/BoneV":[112,585,10,24],"SansLegs/Standing/0":[124,585,44,23],"Strike/Default/1":[170,585,4,22],"PlayerHeart/Split/0":[176,585,16,20],"SansLegs/Sitting/0":[194,585,52,17],"HeartShard/Default/0":[248,585,16,16],"HeartShard/Default/1":[266,585,16,16],"HeartShard/Default/2":[284,585,16,16],"HeartShard/Default/3":[302,585,16,16],"PlayerHeart/Default/0":[320,585,16,16],"tex/BoneStabWarn":[338,585,16,16],"tex/CombatZone":[356,585,16,16],"tex/GasterBlast1":[374,585,16,16],"tex/GasterBlast2":[392,585,16,16],"tex/GasterBlast3":[410,585,16,16],"tex/GasterBlastHit":[428,585,16,16],"tex/HPBackground":[446,585,16,16],"tex/HPBar":[464,585,16,16],"tex/KRBar":[482,585,16,16],"Strike/Default/5":[500,585,14,12],"tex/BoneStabH":[516,585,24,12],"HP/Default/0":[542,585,23,10],"KR/Default/0":[567,585,23,10],"tex/BoneH":[592,585,24,10],"SansSweat/Sweat1/0":[618,585,32,9],"SansSweat/Sweat2/0":[652,585,32,9],"SansSweat/Sweat3/0":[686,585,32,9],"tex/Platform1":[720,585,16,7],"tex/Platform2":[738,585,16,7],"Strike/Default/0":[756,585,4,6]};
  const ATLAS_EN = {"snowdrake/0":[0,0,172,200],"snowdrake/hurt":[174,0,172,200],"icecap/hurt":[348,0,106,174],"icecap/1":[456,0,106,171],"icecap/3":[564,0,106,171],"icecap/0":[672,0,106,169],"icecap/2":[780,0,106,169],"loox/hurt":[888,0,104,120],"loox/0":[0,202,100,116],"loox/1":[102,202,100,116],"loox/2":[204,202,100,116],"loox/3":[306,202,100,116],"loox/4":[408,202,100,116],"froggit/0":[510,202,112,112],"froggit/1":[624,202,112,112],"froggit/hurt":[738,202,112,112],"vegetoid/hurt":[852,202,104,108],"b/blconsm_0":[0,320,99,108],"whimsun/hurt":[101,320,104,104],"vegetoid/0":[207,320,72,104],"vegetoid/1":[281,320,72,104],"vegetoid/2":[355,320,72,104],"vegetoid/3":[429,320,72,104],"whimsun/0":[503,320,90,92],"whimsun/1":[595,320,96,92],"moldsmal/0":[693,320,102,84],"moldsmal/1":[797,320,102,84],"moldsmal/hurt":[901,320,102,84],"b/hatbullet_0":[0,430,50,50],"b/hatbullet_1":[52,430,50,50],"b/smallfrogbullet_0":[104,430,40,40],"b/smallfrogbullet_1":[146,430,40,40],"b/iciclebullet_0":[188,430,40,40],"b/iciclebullet_1":[230,430,40,40],"b/vegbullet_0":[272,430,24,24],"b/vegbullet_1":[298,430,24,24],"b/vegbullet_2":[324,430,24,24],"b/vegbullet_3":[350,430,24,24],"b/vegbullet_4":[376,430,24,24],"b/vegbullet_5":[402,430,24,24],"b/carrotbullet_0":[428,430,24,24],"b/carrotbullet_gr_0":[454,430,24,24],"b/clawbullet_0":[480,430,24,24],"b/clawbullet_1":[506,430,24,24],"b/clawbullet_2":[532,430,24,24],"b/clawbullet_3":[558,430,24,24],"b/rotclawbullet_0":[584,430,24,24],"b/butterflybllt_0":[610,430,20,20],"b/butterflybllt_1":[632,430,20,20],"b/circlebulletmed2_0":[654,430,16,16],"b/circlebulletmd1_0":[672,430,16,16],"b/circlebulletsm_0":[690,430,16,16],"b/bulletgenmd_0":[708,430,16,16],"b/bulletgenmd_1":[726,430,16,16],"b/bulletgenmd_2":[744,430,16,16],"b/flybullet_0":[762,430,12,12],"b/flybullet_1":[776,430,12,12],"b/bulletmd_0":[790,430,12,12],"b/exc_0":[804,430,10,10],"b/bulletsm_0":[816,430,6,6]};
  const ATLAS_RG = {"rg/bara02hurt":[0,0,224,210],"rg/bara01hurt":[226,0,224,202],"rg/blconsm":[452,0,99,108],"rg/blconsm2":[553,0,99,108],"rg/barafalchion":[654,0,21,64],"ow/rabbit_l1":[677,0,20,50],"ow/rabbit_l3":[699,0,20,50],"ow/rabbit_r1":[721,0,20,50],"ow/rabbit_r3":[743,0,20,50],"ow/rabbit_l0":[765,0,22,49],"ow/rabbit_l2":[789,0,22,49],"ow/rabbit_r0":[813,0,22,49],"ow/rabbit_r2":[837,0,22,49],"ow/rabbit_d":[861,0,34,48],"ow/dragon_d":[897,0,34,48],"ow/dragon_l1":[933,0,18,48],"ow/dragon_l3":[953,0,18,48],"ow/dragon_r1":[973,0,18,48],"ow/dragon_r3":[993,0,18,48],"rg/barahead2":[0,212,42,47],"ow/dragon_l0":[44,212,22,47],"ow/dragon_l2":[68,212,22,47],"ow/dragon_r0":[92,212,22,47],"ow/dragon_r2":[116,212,22,47],"rg/baraarmor":[140,212,64,45],"rg/greenarmor":[206,212,45,45],"rg/barahead1":[253,212,34,36],"rg/barashirtless":[289,212,48,35],"rg/baralegs":[339,212,53,21],"rg/barafist":[394,212,16,16],"rg/barashoes":[412,212,52,16],"rg/baraball":[466,212,15,15],"rg/carrotshot":[483,212,15,15],"rg/stardrop":[500,212,15,15],"rg/sweat":[517,212,6,6]};
  const ATLAS_UX = {"ux/melt_0":[0,0,196,286],"ux/melt_1":[198,0,196,286],"ux/smear_0":[396,0,303,135],"ux/leftarm":[701,0,46,76],"ux/whitespear":[749,0,60,60],"ux/risespear":[811,0,24,60],"ux/followspear":[837,0,60,60],"ux/torso":[899,0,79,58],"ux/rightarm":[980,0,19,44],"ux/legs":[0,288,40,42],"ux/face_laugh_0":[42,288,37,32],"ux/face1":[81,288,37,31],"ux/face_damage":[120,288,37,31],"ux/face_laugh_1":[159,288,37,31],"ux/hair":[198,288,17,30],"ux/test_d_0":[217,288,24,30],"ux/test_d_1":[243,288,24,30],"ux/pants":[269,288,39,27],"ux/test_u_0":[310,288,24,26],"ux/test_u_1":[336,288,24,26],"ux/test_l_0":[362,288,28,24],"ux/test_l_1":[392,288,28,24],"ux/test_r_0":[422,288,27,24],"ux/test_r_1":[451,288,27,24],"ux/testx_0":[480,288,25,24],"ux/testx_1":[507,288,25,24],"ux/testx_2":[534,288,25,24],"ux/testx_3":[561,288,25,24],"ux/eyebeam":[588,288,151,23],"ux/heartgreen_0":[741,288,16,16]};

  // =====================================================================
  // Utilidades estilo GameMaker (direcciones en grados, 90 = arriba)
  // =====================================================================
  const D2R = Math.PI / 180;
  const lenX = (l, d) => Math.cos(d * D2R) * l;
  const lenY = (l, d) => -Math.sin(d * D2R) * l;
  const rnd = n => Math.random() * n;
  // Daño del jugador (más bajo que en Undertale para que no se mate de un golpe):
  //   golpe perfecto (centro)  = (AT - DEF + azar 0..2) * DANO_MULT
  //   un golpe nunca saca más de DANO_MAX_PCT de la vida máxima del monstruo
  //   (así siempre hacen falta al menos 2 golpes, en cualquier nivel)
  const DANO_MULT = 1.6;       // Undertale usa 2.2
  const DANO_MAX_PCT = 0.6;
  const irnd = n => Math.round(Math.random() * n);        // round(random(n)) de GML
  const choose = (...a) => a[Math.floor(Math.random() * a.length)];
  const pointDir = (x1, y1, x2, y2) => Math.atan2(-(y2 - y1), x2 - x1) / D2R;
  const overlap = (a, b) => a.l < b.r && a.r > b.l && a.t < b.b && a.b > b.t;

  // =====================================================================
  // Imágenes: atlas de la interfaz (el de la pelea de Sans) + atlas de monstruos
  // =====================================================================
  const imgUI = new Image(), imgEN = new Image(), imgRG = new Image(), imgUX = new Image();
  let listas = 0; const LISTAS = 4;
  imgUI.onload = () => listas++; imgEN.onload = () => listas++; imgRG.onload = () => listas++; imgUX.onload = () => listas++;
  imgUI.src = UI_BASE + "atlas.png"; imgEN.src = EN_BASE + "enemigos.png"; imgRG.src = RG_BASE + "guardias.png"; imgUX.src = UX_BASE + "undyne.png";
  const tintCache = new Map();
  function fuente(name) { return ATLAS_EN[name] ? [imgEN, ATLAS_EN[name]] : ATLAS_RG[name] ? [imgRG, ATLAS_RG[name]] : ATLAS_UX[name] ? [imgUX, ATLAS_UX[name]] : (ATLAS_UI[name] ? [imgUI, ATLAS_UI[name]] : [null, null]); }
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
    const [img, r] = fuente(name); if (!img || listas < LISTAS) return;
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
    const [img, r] = fuente("tex/CombatZone"); if (!img || listas < LISTAS) return;
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
    const f = FONTS[fontName]; if (listas < LISTAS) return;
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
    levelup: EN_BASE + "snd/snd_levelup.ogg", item: EN_BASE + "snd/snd_item.ogg", bell: EN_BASE + "snd/snd_bell.ogg",
    grab: RG_BASE + "snd/snd_grab.ogg",
    lanza: UX_BASE + "snd/snd_spearappear.ogg", flecha: UX_BASE + "snd/snd_arrow.ogg", sube: UX_BASE + "snd/snd_spearrise.ogg",
    tajo: UX_BASE + "snd/snd_swipe.ogg"
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
  function musicaObj(src) {
    src = src || EN_BASE + "snd/mus_battle1.ogg";
    if (!musica || musica.dataset.src !== src) { if (musica) musica.pause(); musica = new Audio(src); musica.dataset.src = src; musica.loop = true; musica.volume = 0.45; musica.preload = "auto"; }
    return musica;
  }
  function musicaPlay() { const m = musicaObj(grupo && grupo.musica); m.currentTime = 0; m.play().catch(() => { }); }
  let musica2 = null;                               // música de la confesión (Guardia Real)
  function musicaConfesion(on) {
    if (on) { if (!musica2) { musica2 = new Audio(RG_BASE + "snd/mus_confession.ogg"); musica2.loop = true; musica2.volume = 0.5; } musica2.currentTime = 0; musica2.play().catch(() => { }); }
    else if (musica2) musica2.pause();
  }
  function pararTodo() { for (const s of vivos) { try { s.stop(); } catch (e) { } } vivos.clear(); if (musica) musica.pause(); musicaConfesion(false); }

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
    },
    // ---- Guardia Real (pelea de a dos: ver GRUPOS.guardias) ----
    rg01: {
      nombre: "RG 01", hp: 150, atk: 8, def: 4, mercymod: -9999, hurtSnd: "ehurt",
      check: "* RG 01 - ATQ 30 DEF 20\n* Miembro de la Guardia Real\n  con armadura brillante y\n  bien lustrada.",
      acts: [{ n: "Susurrar" }, { n: "Limpiar armadura" }],
      dialogos: ["..."], flavor: ["* 01 hace guardia."]
    },
    undyne: {
      nombre: "Undyne", hp: 23000, atk: 12, def: 5, mercymod: -9999999999, hurtSnd: "ehurt",
      check: "", acts: [], dialogos: [], flavor: ["* El viento aúlla..."]
    },
    rg02: {
      nombre: "RG 02", hp: 150, atk: 8, def: 4, mercymod: -9999, hurtSnd: "ehurt",
      check: "* RG 02 - ATQ 30 DEF 20\n* Miembro de la Guardia Real\n  con una armadura muy\n  sofocante.",
      acts: [{ n: "Susurrar" }, { n: "Limpiar armadura" }],
      dialogos: ["..."], flavor: ["* 02 observa tus movimientos."]
    }
  };

  // =====================================================================
  // Estado
  // =====================================================================
  let activa = false, jugadorRef = null, cerrando = false;
  let frame = 0;                                    // cuadros (30 fps)
  let mons = [];                                    // monstruos en la pelea (1 o más)
  let mon = null;                                   // el elegido (FIGHT / ACT); con uno solo, es ese
  let grupo = null;                                 // GRUPOS[id] si es una pelea de varios (ej. Guardia Real)
  let opciones = {}, resultado = null;
  let fase = "intro", faseT = 0;
  let objs = [];                                    // generadores y balas
  let turntimer = 0, ataqueActual = null;
  let heart = { x: 0, y: 0, visible: false, invc: 0, split: false, azulado: false };
  let shards = [];
  const MENU_BOX = { l: 32, r: 602, t: 250, b: 385 };
  const BORDES = { 3: { l: 237, r: 397, t: 250, b: 385 }, 6: { l: 227, r: 407, t: 250, b: 385 }, 7: { l: 227, r: 407, t: 200, b: 385 } };
  let box = { ...MENU_BOX }, boxObj = { ...MENU_BOX };
  let texto = null;                                 // {full, cur, onDone, espera}
  let burbujas = [];                                // globos de diálogo [{m, txt, cur}]
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
  function perdonable(m) { m = m || mon; return m.hp - J().at() + m.def - m.mercymod < 0; }

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
    if (b.hb) return { l: b.x + b.hb[0], t: b.y + b.hb[1], r: b.x + b.hb[2], b: b.y + b.hb[3] };
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
  function danarJugador(dmg, inv, noMata) {
    if (heart.invc > 0) return false;
    let d = Math.round(dmg - J().df() / 5);
    if (d < 1) d = 1;
    if (noMata && statsJ().hp > 1) d = Math.min(d, statsJ().hp - 1);   // (lanzas que no pueden matar)
    J().danar(d);
    sonar("hurt");
    heart.invc = inv || 20;
    if (statsJ().hp <= 0) {
      if (opciones.inmortal) revivir();
      else morir();
    }
    return true;
  }
  // "WHO DECIDED THAT?" (peleas de jefes): en vez de morir, cartel en el centro,
  // la barra de vida se pone de colores y se rellena. Igual que en la de Sans.
  const REVIVIR_DUR = 48, DIOS_DUR = 72;          // en cuadros (30 fps)
  let revivirT = 0, diosT = 0, diosPendiente = false;
  function revivir() {
    J().curarTodo();
    revivirT = REVIVIR_DUR;
    sonar("heal");
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
  // Grupos de monstruos: Guardia Real (RG 01 = conejo, RG 02 = dragón)
  // =====================================================================
  // Sacado de obj_bara01, obj_bara02, obj_barabody, obj_carrotstargen,
  // obj_carrotshot, obj_stardrop y obj_greenarmor del código de Undertale.
  //
  // Ruta pacifista (como en el juego):
  //   1) ACT "Limpiar armadura" a RG 02  -> en su ataque aparece su armadura verde;
  //      tocala con el alma (cada toque la calienta) hasta que se ponga roja.
  //   2) RG 02 se saca la armadura ("¡QUEMA!") y RG 01 se pone nervioso.
  //   3) ACT "Susurrar" a RG 01 (le decís que sea sincero) -> se le declara a 02.
  //   4) Los dos quedan en amarillo: MERCY -> Perdonar.
  const RG_POS = { rg01: { x: 18, y: 34 }, rg02: { x: 432, y: 34 } };
  // Origen de cada parte dentro de su PNG (el PNG viene recortado al contenido)
  const RG_ORIG = {
    "rg/baraball": [0, 0], "rg/barafist": [8, 8], "rg/barafalchion": [12, 54],
    "rg/barahead1": [-15, -5], "rg/barahead2": [-11, 0], "rg/baralegs": [27, 0], "rg/barashoes": [26, 0],
    "rg/baraarmor": [0, 0], "rg/barashirtless": [-8, -10]
  };
  let rg = {};
  function rgParte(n, x, y, sx, sy, ang, alpha) {
    const o = RG_ORIG[n] || [0, 0];
    spr(n, x, y, { sx: sx ?? 2, sy: sy ?? 2, ox: o[0], oy: o[1], ang: ang || 0, alpha });
  }
  // obj_barabody: el cuerpo armado por partes que se balancea
  function rgCuerpo(m) {
    const P = RG_POS[m.id], alpha = m.perdonado ? 0.5 : 1;
    if (m.hurtT > 0) { spr(m.id === "rg01" ? "rg/bara01hurt" : "rg/bara02hurt", P.x + m.shudder, P.y, { alpha }); return; }
    const bx = P.x + 28 + (m.jitter || 0), by = P.y + 32;
    const S = Math.sin(m.siner / 4), C = Math.cos(m.siner / 4);
    const heady = by - 30, armory = by + 10, pantsy = by + 100, shoesy = by + 142, arm1 = by + 40, arm2 = by + 60, hand = by + 80;
    rgParte("rg/baraball", bx + 110, arm1 + S * 3, 2, 2, 0, alpha);
    rgParte("rg/baraball", bx + 120, arm2 + C * 2, 2, 2, 0, alpha);
    rgParte("rg/barafalchion", bx + 140, hand + C * 4 + 16, 2, 2, S * 4 - 30, alpha);
    rgParte("rg/baraball", bx - 10, arm1 + S * 3, 2, 2, 0, alpha);
    rgParte("rg/baraball", bx - 20, arm2 + C * 2, 2, 2, 0, alpha);
    rgParte("rg/barafist", bx - 10, hand + C * 4 + 16, 2, 2, S * 4, alpha);
    rgParte("rg/baralegs", bx + 64, pantsy + S, 2 + S * 0.05, 2 - S * 0.05, 0, alpha);
    rgParte("rg/barashoes", bx + 64, shoesy, 2 + S * 0.1, 2 - S * 0.05, 0, alpha);
    rgParte(m.cuerpo, bx, armory + S * 2, 2, 2, 0, alpha);
    rgParte(m.cabeza, bx, heady + S * 4, 2, 2, 0, alpha);
    for (const g of m.sudor) spr("rg/sweat", g.x, g.y, { ox: 3, oy: 3, alpha: g.a * alpha });
  }
  // Balas: obj_carrotshot (espadita) y obj_stardrop (estrella), a escala 2
  function rgBala(tipo, x, y, dmg, shake) {
    const zan = tipo === "zanahoria";
    const b = crear({
      spr: zan ? "rg/carrotshot" : "rg/stardrop", x, y, w: 30, h: 30, escala: 2, borde: "noborder", dmg,
      hb: zan ? [8, 8, 18, 24] : [10, 10, 22, 22], siner: 0, shake: !!shake,
      alarm: shake ? [2] : [],
      alarma: q => { if (zan) q.vx += (rnd(2) + 2) * choose(-1, 1); else q.vx = rnd(4) - 2; },
      step: q => {
        if (zan && !q.shake) {                       // rebota contra las paredes de la caja
          if (q.x > box.r - 30) { q.x = q.xprev; q.vx = -q.vx; }
          if (q.x < box.l) { q.x = q.xprev; q.vx = -q.vx; }
        }
        if (q.y > LH || q.y < 0) q.vivo = false;
        if (q.shake) { q.x += Math.sin(q.siner / 2) * 2; q.ang += Math.sin(q.siner / 2) * 2; q.siner++; }
      }
    });
    return b;
  }
  // obj_carrotstargen: alarma 0 = espaditas que caen / suben; alarma 1 = lluvia de estrellas
  function rgGenerador(tipo, rate, modo, dmg, shake) {
    let lado = 0, viejo = 0;
    crear({
      bala: false, alarm: [8],
      alarma: g => {
        if (tipo === "zanahoria") {
          const c = rgBala("zanahoria", 305, box.t, dmg, shake);
          c.vx = rnd(4) - 2; c.grav = 0.15; c.gdir = 270;
          g.alarm[0] = Math.round(rate / 3);
          if (modo) {
            const c2 = rgBala("zanahoria", 305, box.b, dmg, false);
            c2.grav = 0.15; c2.gdir = 90; c2.vx = -c.vx;
            g.alarm[0] = rate;
          }
        } else {
          lado = Math.floor(rnd(3)); if (lado === viejo) lado++; if (lado >= 3) lado = 0; viejo = lado;
          const c = rgBala("estrella", 276 + lado * 30, box.t, dmg, shake);
          c.vy = 2 + rnd(3); c.grav = 0.06; c.gdir = 270;
          g.alarm[0] = Math.round(rate / 2);
          if (modo) {
            const c2 = rgBala("estrella", 336 - lado * 30, box.b, dmg, false);
            c2.vy = -(2 + rnd(3)); c2.grav = 0.06; c2.gdir = 90; c2.vx = -c.vx;
            g.alarm[0] = rate;
          }
        }
      }
    });
  }
  // obj_greenarmor: la armadura de 02 flotando; cada toque del alma la calienta
  function rgArmadura(r02) {
    rg.armadura = crear({
      bala: false, spr: "rg/greenarmor", x: 305, y: 160, siner: 0, inv: 0, gv: r02.armor, rv: 255 - r02.armor,
      step: o => {
        o.y += Math.sin(o.siner / 20) * 2; o.x += Math.cos(o.siner / 10) * 6; o.siner++; o.inv--;
        if (heart.visible && o.inv <= 0 && overlap({ l: o.x, t: o.y + 9, r: o.x + 45, b: o.y + 40 }, heartBox())) {
          sonar("bell"); o.gv -= 21; o.rv += 21; o.inv = 20;
        }
        o.tint = "rgb(" + Math.max(0, Math.min(255, o.rv)) + "," + Math.max(0, Math.min(255, o.gv)) + ",0)";
      }
    });
    rg.armadura.tint = "rgb(" + rg.armadura.rv + "," + rg.armadura.gv + ",0)";
  }
  const vivo = m => m && !m.muerto && !m.perdonado;

  function rgDialogo(m) {
    const mc = m.mycommand = Math.round(rnd(100));
    const pop = activos().length;
    let t;
    if (m.id === "rg01") {
      t = "O sea,\ndanos\nel alma,\nbro.";
      if (mc >= 25) t = "O sea,\n\"estás\nmuerto\"\ny eso.";
      if (mc >= 50) t = "O sea,\npreparate\npara\nmorir,\n¿sí?";
      if (mc >= 75) t = "O sea,\nperecé\ny todo\neso.";
      if (m.shake) t = "B...\nBro...";
      if (!m.turn0) t = "O sea,\n¡ataque\nen\nequipo!";
      m.turn0 = 1;
      if (m.wh === 3) { t = "O sea...\n¿qué?\nNo\nentiendo."; if (m.toldhim) t = "Yo...\nyo..."; }
      if (m.wh === 1) t = "O sea,\nlas\nmanos\nquietas.";
      if (m.wh === 12) t = "¡¡E-EY,\nBASTA!!";
      if (pop < 2) {
        t = ["02...\nesto es,\no sea,\npor vos.", "O sea,\n02...", "02...\n¿de\nverdad\nvos...?", "..."][Math.min(3, Math.floor(mc / 25))];
        if (!m.freshdeath) t = "02...\nnunca\nle dije\n...";
        m.freshdeath = 1; m.mercymod = -99999;
      }
    } else {
      t = "...\n...\n...\n(suspiro)";
      if (mc >= 25) t = "...\n...\nje.";
      if (mc >= 50) t = "...\n...\n¿qué?";
      if (mc >= 75) t = "...\n...\nhmph.";
      if (!m.turn0) t = "...\nataque\nen\nequipo.";
      m.turn0 = 1;
      if (m.wh === 3) t = "...\nno voy\na\ncontar.";
      if (m.wh === 1) t = m.shirtless ? "...\nhola." : "...\nme da\n...\ncalor.";
      if (pop < 2) {
        t = "...";
        if (!m.freshdeath) t = "01...\n¡vos...!\n..!!!!";
        m.freshdeath = 1; m.mercymod = -99999;
      }
    }
    return t;
  }
  function rgAct(m, i) {
    const es01 = m.id === "rg01";
    if (i === 0) return m.check;
    if (i === 1) {                                   // Susurrar
      m.wh = 3;
      if (!es01) return "* Le contás a RG 02 tu secreto\n  favorito.";
      if (m.shake) m.toldhim = 1;
      return "* Le decís a RG 01 que sea\n  sincero con lo que siente.";
    }
    m.wh = 1;                                        // Limpiar armadura
    if (es01) return "* Intentás tocar la armadura de\n  RG 01.\n* Se te resbalan las manos.";
    let t = "* Limpiás la armadura de RG 02.\n* La tierra que la enfriaba\n  empieza a salir.";
    if (activos().length < 2) t = "* Te rechazó.";
    if (m.shirtless) {
      t = "* Le das palmaditas en el pecho\n  a RG 02 como si fuera un\n  bongó musculoso.";
      const r01 = buscarMon("rg01"); if (vivo(r01)) r01.wh = 12;
    }
    return t;
  }
  function rgAtaque() {
    const pop = activos().length;
    const r02 = buscarMon("rg02");
    const quien = vivo(r02) ? r02 : activos()[0];   // con los dos vivos, el ataque lo arma 02
    let mc = quien.mycommand, armadura = false;
    if (quien === r02 && r02.wh === 1 && r02.con === 0 && pop > 1) { mc = 80; armadura = true; }
    const shake = vivo(r02) && r02.con > 6 && pop === 2;
    turntimer = 180;
    if (mc <= 50) rgGenerador("zanahoria", 25, pop > 1, quien.atk, shake);
    else rgGenerador("estrella", armadura ? 35 : 20, pop > 1, quien.atk, shake);
    if (armadura) rgArmadura(r02);
    // texto para el menú que sigue
    let f;
    if (pop > 1) {
      f = "* A 02 le chorrea sudor de la\n  armadura.";
      if (mc >= 25) f = "* 01 se está lustrando la cara.";
      if (mc >= 50) f = "* 01 hace guardia.";
      if (mc >= 75) f = "* 02 observa tus movimientos.";
      if (mc >= 90) f = "* Huele a zoológico militar.";
    } else if (quien.id === "rg01") {
      f = ["* 01 se agarra la cabeza con\n  las manos.", "* Salen ruidos angustiados de\n  la armadura de 01.", "* 01 se queda quieto.", "* 01 no sabe qué hacer."][Math.min(3, Math.floor(mc / 25))];
    } else {
      f = ["* 02 aprieta y afloja los\n  puños.", "* 02 niega con la cabeza.", "* 02 golpea la espada contra\n  el piso.", "* 02 tose."][Math.min(3, Math.floor(mc / 25))];
    }
    if (quien.hp < 30) f = "* La respiración de " + quien.nombre.slice(3) + " se\n  acelera.";
    rg.flavor = f;
    for (const m of mons) m.wh = -1;
  }
  // 02 se saca la armadura (obj_bara02, mnfight 5)
  function rgEscenaCalor(r02) {
    const r01 = buscarMon("rg01");
    r02.con = 1;
    boxObj = { ...MENU_BOX };
    empezarGuion([
      { esperar: 15 },
      { b: r02, pags: ["...\nno\n...\naguanto.", "...\nla\narmadura\n...\n¡¡QUEMA!!"] },
      { fn: () => { sonar("grab"); r02.cuerpo = "rg/barashirtless"; } },
      { esperar: 60 },
      { fn: () => { if (vivo(r01)) r01.shaker = 1; } },
      { b: r02, pags: ["...\nmucho\nmejor."] },
      { fn: () => { r02.shirtless = 1; r02.con = 7; if (vivo(r01)) r01.shake = 1; } }
    ], () => irAlMenu("* RG 01 parece molesto por\n  algo."));
  }
  // 01 se le declara a 02 (obj_bara01, mnfight 5)
  function rgEscenaConfesion(r01, r02) {
    r01.con = 1;
    boxObj = { ...MENU_BOX };
    if (musica) musica.pause();
    empezarGuion([
      { esperar: 20 },
      { b: r01, pags: ["B-bro\n...", "No\npuedo\n...", "¡No\naguanto\nmás\nesto!", "¡¡Así\nno!!"] },
      { fn: () => { r01.shaker = 0; musicaConfesion(true); } },
      { b: r01, pags: ["O sea,\n¡02!\nMe...", "Me, o\nsea,\nGUSTÁS,\nbro.", "Cómo\npeleás...\nCómo\nhablás...", "Me\nencanta\nhacer\nataques\nen equipo\ncon vos.", "Me\nencanta\nestar acá\ncon vos,", "saltando\ny\nmoviendo\nlas armas\njuntos...", "02...\nquiero\nque esto\ndure\npara\nsiempre..."] },
      { fn: () => musicaConfesion(false) },
      { b: r02, pags: ["...", "...."] },
      { fn: () => { r01.shaker = 1; } },
      { b: r01, pags: ["Eh...", "O sea,\neh...", "¡Mentira!\n¡Te\nagarré,\nbro!\n¡Jaja!"] },
      { b: r02, pags: ["...\n01."] },
      { fn: () => { r01.shaker = 2; } },
      { b: r01, pags: ["¿S-sí,\nbro?"] },
      { fn: () => { r01.shaker = 0; } },
      { b: r02, pags: ["...", "...\n¿querés\n...", "...\nir a\ntomar un\nhelado\n...", "...\ndespués\nde esto?"] },
      { b: r01, pags: ["¡Obvio,\nbro!\n¡Jaja!"] },
      { fn: () => { for (const m of [r01, r02]) { m.mercymod = 999; m.def = -999; } r01.con = 11; } }
    ], () => irAlMenu("* 01 y 02 se miran felices."));
  }

  const GRUPOS = {
    guardias: {
      mons: ["rg01", "rg02"],
      entrada: "* ¡Ataca la Guardia Real!",
      cajaHabla: { l: 270, r: 370, t: 250, b: 385 },   // border 15
      cajaAtaque: { l: 270, r: 370, t: 50, b: 385 },   // border 16: el pasillo entre los dos
      iniciar() {
        rg = { flavor: null, armadura: null };
        for (const m of mons) Object.assign(m, {
          wh: -1, turn0: 0, shake: 0, toldhim: 0, freshdeath: 0, con: 0, mycommand: 0,
          armor: 255, shirtless: 0, siner: 0, shaker: 0, jitter: 0, sudor: [], sudorT: 0,
          cabeza: m.id === "rg01" ? "rg/barahead1" : "rg/barahead2", cuerpo: "rg/baraarmor"
        });
      },
      flavor() { return rg.flavor || "* La Guardia Real te bloquea\n  el paso."; },
      dialogo: rgDialogo,
      alAct: rgAct,
      ataque: rgAtaque,
      turnoTick() {
        const r01 = buscarMon("rg01"), r02 = buscarMon("rg02");
        if (vivo(r01) && vivo(r02) && r01.toldhim && r01.con === 0 && turntimer > 1 && turntimer < 5) {
          objs = []; rg.armadura = null;
          rgEscenaConfesion(r01, r02);
          return true;
        }
        return false;
      },
      finTurno() {
        const a = rg.armadura, r02 = buscarMon("rg02");
        rg.armadura = null;
        if (!a || !vivo(r02)) return false;
        r02.armor = a.gv;
        if (a.rv > 99 && r02.con === 0) { rgEscenaCalor(r02); return true; }
        return false;
      },
      cadaCuadro() {
        for (const m of mons) {
          if (m.hurtT <= 0) m.siner++;
          m.jitter = 0;
          if (m.shaker > 0) {
            m.siner += 0.5; m.jitter = Math.sin(m.siner / 2);
            if (++m.sudorT >= 8) {                   // obj_sweat99
              m.sudorT = 0;
              const P = RG_POS[m.id], d = rnd(180);
              m.sudor.push({ x: P.x + 28 + 55, y: P.y + 32 + 20, vx: lenX(4, d), vy: lenY(4, d), a: 0, t: 0, on: 0 });
            }
          }
          for (const g of m.sudor) {
            g.t++;
            if (g.t === 3) g.on = 1;
            if (g.on === 1) { g.a = Math.min(1, g.a + 0.1); if (g.a >= 1) { g.on = 2; g.fin = g.t + 20; } }
            if (g.on >= 1) g.vy += 0.1;
            if (g.on === 2 && g.t >= g.fin) g.on = 3;
            if (g.on === 3) g.a -= 0.04;
            g.x += g.vx; g.y += g.vy;
          }
          m.sudor = m.sudor.filter(g => !(g.on === 3 && g.a < 0.1) && g.y < LH);
        }
      },
      posMon(m) {
        const P = RG_POS[m.id];
        return { cx: P.x + 112, left: P.x, top: P.y, w: 224, h: 202, spr: m.id === "rg01" ? "rg/bara01hurt" : "rg/bara02hurt", numY: 64 };
      },
      dibujarMon: rgCuerpo,
      burbujaPos(m) {
        return m.id === "rg01" ? { x: 217, y: 121, spr: "rg/blconsm", tx: 20 } : { x: 325, y: 121, spr: "rg/blconsm2", tx: 10 };
      }
    }
  };

  // =====================================================================
  // Undyne la Inmortal (ruta genocida) — obj_undyne_ex del código de Undertale
  // =====================================================================
  // Alma VERDE: no te movés; con las flechas girás el escudo y bloqueás las
  //   lanzas (obj_spearblocker, obj_greenspeargen, obj_blockbullet[2]). Las
  //   amarillas dan una vuelta y te llegan del lado contrario.
  // Alma ROJA: lanzas que te persiguen, que suben del piso y que giran a tu
  //   alrededor (obj_spearbullet_follow, obj_risespearbullet, obj_rotspear,
  //   obj_followspear_2). Entre una y otra, Undyne cambia el color de tu alma.
  const UX_HP = 23000;                 // vida del original
  const UX_POS = { x: 210, y: 20 };
  const UX_ORIG = {                    // origen dentro de cada PNG
    "ux/hair": [14, 28], "ux/legs": [20, 10], "ux/leftarm": [33, 5], "ux/rightarm": [4, 6], "ux/torso": [39, 29],
    "ux/pants": [19, 0], "ux/face1": [18, 16], "ux/face_damage": [18, 15], "ux/face_laugh_0": [18, 16], "ux/face_laugh_1": [18, 16],
    "ux/eyebeam": [0, 12]
  };
  // Orden de los turnos (igual que en el original, contado a partir de order/orderb/lesson)
  //   v = lección del alma verde · r = ataque del alma roja · cambia = al terminar, Undyne te cambia el alma
  const UX_PLAN = [
    { v: -5 }, { v: -6 }, { v: -7, cambia: 1 },
    { r: 0 }, { r: 1, cambia: 1 },
    { v: -8 }, { v: -9 }, { v: -10, cambia: 1 },
    { r: 2 }, { r: 3, cambia: 1 },
    { v: -11 }, { v: -12 }, { v: -13 }, { v: -14, cambia: 1 }
  ];
  const uxTurno = n => n < UX_PLAN.length ? UX_PLAN[n] : { r: [4, 5, 6, 7][(n - UX_PLAN.length) % 4] };
  // scr_sr(dirección, tipo, tiempo, velocidad) de cada lección. dirección 4 = al azar; tipo 1 = amarilla
  const rep = (n, a) => Array.from({ length: n }, () => a);
  const UX_LECCION = {
    "-5": [[3, 0, 2, .5], [3, 0, 2, .5], [3, 0, 6.5, .5], [1, 0, 0, 1.6], [2, 0, 0, 1.6], [0, 0, 0, 1.6], [3, 0, 0, 1.6], [0, 0, 0, 1.6], [2, 0, 0, 1.6], [1, 0, 0, 1.6], [2, 0, 0, 1.6], [0, 0, 0, 1.6], [3, 0, 0, 1.6]],
    "-6": [[0, 0, 0, 1.8], [1, 0, 0, 1.8], [0, 0, .5, 1.8], [0, 0, 0, 1.8], [1, 0, 0, 1.8], [1, 0, 0, 1.8], [0, 0, 0, 1.8], [1, 0, .5, 1.8], [1, 0, 0, 1.8], [0, 0, 0, 1.8], [1, 0, 0, 2], [0, 0, 0, 2], [1, 0, 0, 2], [0, 0, 0, 2]],
    "-7": rep(18, [4, 0, 0, .4]),
    "-8": [[3, 0, 0, 1], [0, 0, 0, 1.8], [2, 0, 0, 1], [1, 0, 0, 1.8], [0, 0, 0, 1], [3, 0, 0, .5], [2, 0, 0, .47], [1, 0, 0, 1.8], [0, 0, 0, 1]],
    "-9": [[3, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, 0, 2], [0, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, 0, 2], [1, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, 1, 2], [0, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, 1, 2], [1, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2], [3, 0, .5, 2]],
    "-10": [[0, 0, 0, 0], [3, 0, 0, 0], [0, 0, 0, 0], [3, 0, 0, 0], [0, 0, 0, 0], [3, 0, 0, 0], [0, 0, 0, 0], [3, 0, 0, 0], [0, 1, 0, 0], [3, 1, 0, 0], [0, 1, 0, 0], [3, 1, 0, 0], [0, 1, 0, 0], [3, 1, 0, 0]],
    "-11": [[1, 1, 1.25, 2], [3, 1, 1.25, 2], [0, 1, 1.25, 2], [2, 1, 2, 2], [3, 0, 1.25, 2], [0, 0, 1.25, 2], [2, 0, 1.25, 2], [1, 0, 2, 2], [2, 1, 1.25, 2], [0, 1, 1.25, 2], [1, 1, 1.25, 2], [3, 1, 1.25, 2]],
    "-12": [].concat(...rep(2, [[0, 0, 0, 1.3], [1, 0, 0, 1.3], [3, 0, .1, 1.3], [2, 1, 2.2, 1.3], [0, 0, 0, 1.3], [1, 0, 0, 1.3], [2, 0, .1, 1.3], [3, 1, 2.2, 1.3]])),
    "-13": [[0, 0, 0, 1.5], [0, 1, 2, 1.5], [2, 0, 0, 1.5], [2, 1, 2, 1.5], [1, 0, 0, 1.5], [1, 1, 2.2, 1.5], [3, 0, 0, 1.5], [3, 1, 2, 1.5], [0, 0, 0, 1.5], [0, 1, 2, 1.5], [2, 0, 0, 1.5], [2, 1, 2, 1.5], [1, 0, 0, 1.5], [1, 1, 2.2, 1.5]],
    "-14": rep(24, [4, 0, 0, .3])
  };
  let ux = {};
  const CX = 320, CY = 240;           // obj_spearblocker (centro de la pantalla)
  // ¿Toca el segmento al alma? (collision_line del original)
  function lineaToca(x1, y1, x2, y2) {
    if (!heart.visible) return false;
    const hb = heartBox(), n = Math.ceil(Math.hypot(x2 - x1, y2 - y1) / 2);
    for (let i = 0; i <= n; i++) {
      const x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n;
      if (x >= hb.l && x <= hb.r && y >= hb.t && y <= hb.b) return true;
    }
    return false;
  }

  // ---------- alma verde: escudo + lanzas ----------
  const LADO_ESCUDO = [0, 180, 90, 270];          // desde dónde viene la lanza -> dirección del escudo que la para
  function uxEscudo() {
    const e = crear({
      bala: false, sinClip: true, dir: 270, ideal: 270, flash: 0, buffer: 0,
      step: o => {
        o.buffer++;
        if (pad.Down) o.ideal = 90; if (pad.Up) o.ideal = 270; if (pad.Left) o.ideal = 0; if (pad.Right) o.ideal = 180;
        let dif = ((o.ideal - o.dir) % 360 + 540) % 360 - 180;       // giro por el camino más corto
        if (Math.abs(dif) < 15) o.dir = o.ideal; else o.dir = (o.dir + dif * 2 / 3 + 360) % 360;
        if (o.flash > 0) o.flash--;
      },
      dibujar: o => {
        const t = o.dir * D2R, r = 30;
        const ax = CX - Math.cos(t) * r - Math.sin(t) * r, ay = CY + Math.sin(t) * r - Math.cos(t) * r;
        const bx = CX - Math.cos(t) * r + Math.sin(t) * r, by = CY + Math.sin(t) * r + Math.cos(t) * r;
        ctx.save(); ctx.lineCap = "butt";
        ctx.strokeStyle = "rgb(0,128,0)"; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(CX, CY, r, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 3;
        ctx.strokeStyle = o.flash >= 2 ? "rgb(255,0,0)" : "rgb(64,64,255)";
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
        const t2 = t - 0.2;
        ctx.strokeStyle = "rgb(64,64,255)";
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(CX - Math.cos(t2) * r / 2 + Math.sin(t2) * r / 2, CY + Math.sin(t2) * r / 2 + Math.cos(t2) * r / 2); ctx.stroke();
        ctx.restore();
      }
    });
    return e;
  }
  const lanzasVerdes = () => objs.filter(o => o.lanzaVerde && o.vivo);
  function uxLanzaVerde(lado, amarilla, velMod, dmg) {
    const v = 8 * velMod, pos = [[CX - 300, CY], [CX + 300, CY], [CX, CY + 300], [CX, CY - 300]][lado];
    const b = crear({
      bala: false, sinClip: true, lanzaVerde: true, amarilla, lado, x: pos[0], y: pos[1], alpha: 0, parte: 0, velMod, dmg,
      cola: lanzasVerdes().length + 1,
      step: o => {
        o.alpha = Math.min(1, o.alpha + 0.2);
        if (o.amarilla) {
          const d = o.lado === 0 ? CX - o.x : o.lado === 1 ? o.x - CX : o.lado === 2 ? o.y - CY : CY - o.y;
          if (o.parte === 0 && d < 80) {             // da la vuelta por arriba y viene del otro lado
            o.parte = 2; o.siner = 0; o.vx = 0; o.vy = 0; o.remx = o.x; o.remy = o.y;
            o.total = 145 + Math.max(0, ux.rating - 8) * 8;
          }
          if (o.parte === 2) {
            o.siner++;
            const a = Math.sin(o.siner * Math.PI / 20) * o.total, bb = Math.sin(o.siner * Math.PI / 10) * 100;
            if (o.lado === 0) { o.x = o.remx + a; o.y = o.remy - bb; }
            if (o.lado === 1) { o.x = o.remx - a; o.y = o.remy - bb; }
            if (o.lado === 2) { o.y = o.remy - a; o.x = o.remx - bb; }
            if (o.lado === 3) { o.y = o.remy + a; o.x = o.remx + bb; }
            if (o.siner === 10) {
              o.parte = 3; o.lado = [1, 0, 3, 2][o.lado];
              const s = 8 * o.velMod;
              o.vx = o.lado === 0 ? s : o.lado === 1 ? -s : 0; o.vy = o.lado === 2 ? -s : o.lado === 3 ? s : 0;
            }
            return;
          }
        }
        // ¿llegó al escudo o al alma?
        const dist = o.lado === 0 ? CX - o.x : o.lado === 1 ? o.x - CX : o.lado === 2 ? o.y - CY : CY - o.y;
        if (dist <= 36 && dist > 10 && ux.escudo && ux.escudo.ideal === LADO_ESCUDO[o.lado]) {
          o.vivo = false; ux.escudo.dir = ux.escudo.ideal; ux.escudo.flash = 5; sonar("bell");
          for (const q of lanzasVerdes()) q.cola--;
          return;
        }
        if (dist <= 10) {
          o.vivo = false; ux.hitno++;
          for (const q of lanzasVerdes()) q.cola--;
          danarJugador(o.dmg);
        }
      },
      dibujar: o => {
        let n, ox, oy;
        if (o.amarilla) { n = "ux/testx_" + (o.parte === 3 ? [1, 0, 3, 2][[1, 0, 3, 2][o.lado]] : [1, 0, 3, 2][o.lado]); ox = 13; oy = 12; }
        else {
          const f = o.cola <= 1 ? 1 : 0;
          n = ["ux/test_l_", "ux/test_r_", "ux/test_u_", "ux/test_d_"][o.lado] + f;
          [ox, oy] = [[16, 12], [13, 12], [12, 12], [12, 18]][o.lado];
        }
        spr(n, o.x, o.y, { ox, oy, alpha: o.alpha });
      }
    });
    movimiento(b, [0, 180, 90, 270][lado], v);
    return b;
  }
  function uxVerde(leccion) {
    turntimer = 300;
    ux.hitno = 0;
    ux.escudo = uxEscudo();
    const lista = (UX_LECCION[String(leccion)] || UX_LECCION["-5"]).map(a => {
      let [d, t, tm, sp] = a;
      if (d === 4) d = Math.floor(rnd(4));
      if (t === 3) t = Math.floor(rnd(2));
      if (tm === 0 && t !== 2) tm = 1;
      if (sp === 0) sp = 1;
      return [d, t, tm, sp];
    });
    const dmg = mon.atk;
    let i = 0;
    ux.genVerde = crear({
      bala: false, alarm: [5], hecho: false,
      alarma: g => {
        const [d, t, tm, sp] = lista[i];
        g.alarm[0] = Math.max(1, Math.round(ux.rating * tm));
        uxLanzaVerde(d, t === 1, sp, dmg);
        i++;
        if (i >= lista.length) { g.alarm[0] = 0; g.hecho = true; }
      }
    });
  }

  // ---------- alma roja ----------
  function uxLanzaPersigue() {              // obj_spearbullet_follow
    const hx = heart.x - 4 + rnd(8), hy = heart.y - 4 + rnd(8);
    const d = pointDir(hx, hy, heart.x, heart.y);
    sonar("lanza");
    const b = crear({
      bala: false, sinClip: true, spr: "ux/whitespear", ox: 30, oy: 30, x: hx + lenX(140, d), y: hy + lenY(140, d),
      alpha: 0, ang: 0, rot: 32, fric: 0.2, apagar: false, dir: d,
      step: o => {
        o.alpha = Math.min(1, o.alpha + 0.05); o.ang -= o.rot; if (o.rot > 0) o.rot--;
        if (o.rot === 0 && velocidad(o) < 1 && !o.lanzada) {
          o.lanzada = true; sonar("flecha");
          hacia(o, heart.x + 10, heart.y + 10, 3); o.fric = -0.3; o.dir = direccion(o); o.ang = o.dir;
        }
        const xo = lenX(25, o.dir), yo = lenY(25, o.dir);
        if (o.rot === 0 && !o.apagar && lineaToca(o.x - xo / 2, o.y - yo / 2, o.x + xo, o.y + yo)) danarJugador(11);
        if (o.apagar) { o.alpha -= 0.1; if (o.alpha <= 0) o.vivo = false; }
        if (o.x < -100 || o.x > LW + 100 || o.y < -100 || o.y > LH + 100) o.vivo = false;
      }
    });
    movimiento(b, d, 4);
  }
  function uxLanzaSube(x) {                 // obj_risespearbullet
    crear({
      bala: false, spr: "ux/risespear", x, y: box.b, alpha: 1, visible: false, parte: 0, alarm: [20, 1], apagar: false,
      alarma: (o, n) => {
        if (n === 1) { o.visible = true; o.vy = -1; sonar("lanza"); return; }
        if (o.parte === 3) { o.parte = 4; return; }
        if (o.parte === 2) { o.vy = 0; o.parte = 3; o.alarm[0] = 2; return; }
        if (o.parte === 1) { o.vy = -10; sonar("sube"); o.parte = 2; o.alarm[0] = 6; return; }
        if (o.parte === 0) { o.parte = 1; o.vy = 0; o.alarm[0] = 12; }
      },
      step: o => {
        if (o.parte === 4 || o.apagar) { o.alpha -= 0.1; if (o.alpha <= 0) o.vivo = false; }
        if (o.parte > 0 && o.parte < 4 && !o.apagar && heart.visible && overlap({ l: o.x + 8, t: o.y + 6, r: o.x + 15, b: o.y + 60 }, heartBox())) danarJugador(11);
      }
    });
  }
  function uxAnillo(cx, cy, tipo) {         // obj_rotspeargen + obj_rotspear
    const cfg = [[0, 8, 2, 7, 220], [0, -8, -2, 7, 220], [rnd(360), 8, 2, 8, 230], [rnd(360), -8, -2, 8, 230]][tipo];
    let [cur, rs, rmin, num, rr] = cfg;
    const lanzas = [];
    for (let i = 0; i < num; i++) {
      lanzas.push(crear({
        bala: false, sinClip: true, spr: "ux/followspear", ox: 30, oy: 30, x: cx + lenX(rr, cur + i / num * 360), y: cy + lenY(rr, cur + i / num * 360),
        alpha: 0, apagar: false,
        step: o => {
          if (!o.apagar && o.alpha < 1) o.alpha = Math.min(1, o.alpha + 0.2);
          if (o.apagar) { o.alpha -= 0.2; if (o.alpha < 0.3) o.vivo = false; }
          const xo = lenX(25, o.ang), yo = lenY(25, o.ang);
          if (o.alpha >= 0.8 && !o.apagar && lineaToca(o.x - xo / 2, o.y - yo / 2, o.x + xo, o.y + yo)) danarJugador(12);
        }
      }));
    }
    crear({
      bala: false,
      step: g => {
        if (rs > rmin) rs -= 0.2; if (rs < rmin) rs += 0.2;
        lanzas.forEach((s, i) => {
          if (!s.vivo) return;
          s.x = cx + lenX(rr, cur + i / num * 360); s.y = cy + lenY(rr, cur + i / num * 360);
          s.ang = pointDir(s.x, s.y, cx, cy);
          if (rr < 8) s.apagar = true;
        });
        if (rr < 8) { rr++; rs *= 0.8; }
        if (rr < -20) g.vivo = false;
        rr -= 4; cur += rs;
      }
    });
  }
  function uxLanzasRonda() {                // obj_followspeargen_2 (tipo 1) + obj_followspear_2
    let cur = 0, rate = 20;
    crear({
      bala: false, alarm: [1],
      alarma: g => {
        for (let i = 0; i < 6; i++) {
          const hx = heart.x + 8 + lenX(180, cur + i / 6 * 360), hy = heart.y + 8 + lenY(180, cur + i / 6 * 360);
          const d = pointDir(hx, hy, heart.x + 8, heart.y + 8);
          const s = crear({
            bala: false, sinClip: true, spr: "ux/followspear", ox: 30, oy: 30, x: hx, y: hy, alpha: 0, ang: d + 20, rot: 38, fric: 0.2, timer: 0, dir: d, apagar: false,
            step: o => {
              o.alpha = Math.min(1, o.alpha + 0.05); o.ang -= o.rot; if (o.rot > 0) o.rot -= 2;
              if (o.rot === 0 && velocidad(o) < 1) { o.timer++; if (o.timer === 5) { o.dir = o.ang; movimiento(o, o.dir, 8); o.fric = -0.3; } }
              if (velocidad(o) >= 7) { o.timer++; if (o.timer >= 22) o.apagar = true; }
              const xo = lenX(25, o.dir), yo = lenY(25, o.dir);
              if (o.rot === 0 && !o.apagar && lineaToca(o.x - xo / 2, o.y - yo / 2, o.x + xo, o.y + yo)) danarJugador(11, 20, true);
              if (o.apagar) { o.alpha -= 0.25; if (o.alpha <= 0) o.vivo = false; }
              if (o.x < -100 || o.x > LW + 100 || o.y < -100 || o.y > LH + 100) o.vivo = false;
            }
          });
          movimiento(s, d, 4);
        }
        if (rate > 10) rate--;
        cur += 10 + choose(10, 20, 30);
        g.alarm[0] = rate;
      }
    });
  }
  const UX_CAJAS = { 7: { l: 227, r: 407, t: 200, b: 385 }, 14: { l: 285, r: 355, t: 300, b: 385 }, 31: { l: 32, r: 602, t: 100, b: 385 }, 12: { l: 280, r: 360, t: 200, b: 280 }, 13: { l: 280, r: 360, t: 250, b: 385 } };
  function uxCajaRoja(ob) { return ob === 0 || ob === 6 ? UX_CAJAS[7] : ob === 1 || ob === 7 ? UX_CAJAS[14] : UX_CAJAS[31]; }
  function uxRoja(ob) {
    ux.ratingb = Math.max(8, Math.min(10, ux.ratingb + 1));
    ux.apagar = null;
    if (ob === 0 || ob === 6) {
      turntimer = 240;
      const rate = 18 - ux.ratingb;
      crear({ bala: false, alarm: [1], alarma: g => { uxLanzaPersigue(); g.alarm[0] = rate; } });
    } else if (ob === 1 || ob === 7) {
      turntimer = 220;
      const rate = 23 - ux.ratingb; let mem = -1;
      crear({ bala: false, alarm: [10], alarma: g => {
        if (turntimer <= 8) return;
        let xs = Math.floor(rnd(3)); if (xs === mem) xs++; if (xs === 3) xs = 0; mem = xs;
        uxLanzaSube(box.l + xs * 23); g.alarm[0] = rate;
      } });
    } else if (ob === 2 || ob === 3 || ob === 5) {
      turntimer = 215;
      let t = ob === 5 ? 2 : 0;
      crear({ bala: false, alarm: [1], alarma: g => {
        if (ob === 5) { t = choose(2, 3); uxAnillo(heart.x + 8, heart.y + 8, t); g.alarm[0] = 24; }
        else { uxAnillo(heart.x + 8, heart.y + 8, t); t = t === 0 ? 1 : 0; g.alarm[0] = 27; }
      } });
    } else {
      turntimer = 400;
      uxLanzasRonda();
    }
  }

  // ---------- el cuerpo (obj_undynex_body) ----------
  function uxParte(n, x, y, opt) { const o = UX_ORIG[n] || [0, 0]; spr(n, x, y, Object.assign({ sx: 2, sy: 2, ox: o[0], oy: o[1] }, opt || {})); }
  function uxTajo() { ux.tajo = { paso: 0, t: 0, ang: 0, dx: 0, dy: 0, alfa: 1, sy: 0 }; ux.heady = 0; sonar("tajo"); }
  function uxTajoTick() {                   // el brazo izquierdo sube y corta (movetype 2)
    const s = ux.tajo; if (!s) return;
    s.t++;
    if (s.paso === 0) { ux.cara = 1; s.ang -= 35; s.dx -= 4; s.dy -= 4; ux.heady -= 2; if (s.ang <= -104) { s.ang = -104; s.paso = 0.5; s.t = 0; } }
    else if (s.paso === 0.5) { if (s.t >= 7) { s.paso = 1; s.t = 0; } }
    else if (s.paso === 1) { ux.cara = 0; s.delante = true; s.ang += 73.33; if (s.t >= 2) { s.paso = 2; } }
    else if (s.paso === 2) { s.dx = 0; s.dy = 0; s.ang = 66; s.alfa = 1; s.sy = 0; s.paso = 3; }
    else if (s.paso === 3) {
      if (ux.heady < 6) ux.heady += 3;
      s.alfa -= 0.1; s.sy += 24; s.ang += 0.5;
      if (s.ang > 70) { s.paso = 4; s.t = 0; }
    }
    else if (s.paso === 4) { if (s.t >= 3) s.paso = 5; }
    else if (s.paso === 5) { if (ux.heady > 0) ux.heady--; s.ang -= 15; if (s.ang <= 6) { ux.heady = 0; ux.tajo = null; } }
  }
  function uxCuerpo(m) {
    const x = UX_POS.x + (ux.temblor ? rnd(ux.temblor) - rnd(ux.temblor) : 0) + (m.hurtT > 0 ? m.shudder : 0);
    const y = UX_POS.y + (ux.temblor ? rnd(ux.temblor) - rnd(ux.temblor) : 0);
    if (ux.derretido !== undefined && ux.derretido !== null) { spr("ux/melt_" + ux.derretido, x - 20, -40); return; }
    const pausa = m.hurtT > 0;
    const sin = ux.siner, sf = Math.sin(sin / 6), sf2 = Math.sin(sin / 3), sf3 = Math.sin(sin / 14), hy = ux.heady || 0;
    const t = ux.tajo;
    const brazoTajo = () => { if (t) uxParte("ux/leftarm", x + 64 + t.dx, y + 78 + t.dy, { ang: t.ang }); };
    if (t && !t.delante) brazoTajo();
    uxParte("ux/hair", x + 85, y + sf * 3 + hy + 4, { ang: 70 - sf * 15 });
    uxParte("ux/legs", x + 100, y + 164);
    if (!t) uxParte("ux/leftarm", x + 64 + sf * 5, y + 78 + sf * 5);
    uxParte("ux/rightarm", x + 136 + sf2 * 3, y + 78 + sf * 6 + sf2 * 2);
    uxParte("ux/torso", x + 100, y + 78 + sf * 4, { ang: -(sf * 4) });
    uxParte("ux/pants", x + 100, y + 122 + sf * 2, { ang: sf * 2 });
    const cara = ux.cara === 1 ? "ux/face_laugh_" + (Math.floor(sin / 3) % 2) : pausa ? "ux/face_damage" : "ux/face1";
    uxParte(cara, x + 100, y + 28 + sf * 2 + hy);
    if (t && t.delante) brazoTajo();
    if (t && t.paso >= 3 && t.alfa > 0) {         // el "trazo" del corte
      spr("ux/smear_0", x + 64 - 180, y + 78 + 20, { alpha: t.alfa });
      spr("ux/smear_0", x + 64 - 180, y + 78 + 20 + t.sy, { alpha: t.alfa });
    }
    if (ux.cara !== 1 && !pausa) {                  // el destello del ojo
      const e = ux.ojo;
      if (e >= 10) uxParte("ux/eyebeam", x + 110, y + 24 + sf * 2, { sx: (e - 10) / 4, sy: 2.5 - (e - 10) / 20, ang: -(sf3 * 32), alpha: Math.min(1, 1.5 - (e - 10) / 20) });
    }
  }
  function uxCambiarAlma() {
    ux.verde = !ux.verde;
    heart.verde = ux.verde;
  }

  GRUPOS.undyne = {
    mons: ["undyne"],
    entrada: "* La heroína aparece.",
    musica: UX_BASE + "snd/mus_x_undyne.ogg",
    sinHuir: true,
    cajaHabla: () => ux.verde ? UX_CAJAS[13] : uxCajaRoja(uxTurno(ux.turno).r),
    cajaAtaque: () => ux.verde ? UX_CAJAS[12] : uxCajaRoja(uxTurno(ux.turno).r),
    iniciar() {
      ux = { turno: 0, verde: true, rating: 9, ratingb: 0, hitno: 0, siner: 0, ojo: 0, cara: 0, heady: 0, oscuro: 0, tajo: null, escudo: null, genVerde: null, temblor: 0, derretido: null };
      heart.verde = true;
      mons[0].hp = mons[0].maxhp = UX_HP;
    },
    flavor() { return "* El viento aúlla..."; },
    dialogo() { return null; },                 // en la pelea no habla (solo al final)
    alAct(m) { return "* UNDYNE LA INMORTAL 99ATQ 99DEF\n* Una heroína que renació\n  gracias a su DETERMINACIÓN\n  para salvar la Tierra."; },
    dano(m, d) {                                // takedamage*21, mínimo 600 (obj_undyne_ex)
      let t = Math.round(d * 21);
      if (t < 600) t = 600 + Math.floor(rnd(67));
      return t;
    },
    posCorazon() {
      if (ux.verde) { heart.x = CX - 8; heart.y = CY - 8 + 2; heart.fijo = true; }
      else { heart.x = LW / 2 - 8; heart.y = box.t + 34; heart.fijo = false; }
    },
    ataque() {
      const p = uxTurno(ux.turno);
      if (ux.verde) uxVerde(p.v !== undefined ? p.v : -5);
      else uxRoja(p.r !== undefined ? p.r : 4);
    },
    turnoTick() {
      if (ux.verde) {
        const g = ux.genVerde;
        if (g && g.hecho && ux.escudo && ux.escudo.buffer > 30 && !lanzasVerdes().length) turntimer = 0;
      } else if (turntimer === 3) for (const o of objs) o.apagar = true;
      return false;
    },
    finTurno() {
      const p = uxTurno(ux.turno);
      heart.fijo = false;
      if (ux.verde) {                            // cuántas veces te pegaron: la próxima es más lenta o más rápida
        if (ux.hitno > 0) { if (ux.rating < 10) ux.rating++; if (ux.hitno >= 3) ux.rating = 10; }
        else if (ux.rating > 8) ux.rating--;
      }
      ux.escudo = null; ux.genVerde = null;
      ux.turno++;
      if (!p.cambia) return false;
      // Undyne levanta la lanza y te cambia el color del alma
      boxObj = { ...MENU_BOX };
      empezarGuion([
        { fn: uxTajo }, { esperar: 16 }, { fn: uxCambiarAlma }, { esperar: 14 }
      ], () => irAlMenu());
      return true;
    },
    cadaCuadro() {
      const m = mons[0];
      if (m.hurtT > 0) ux.siner = 0; else ux.siner += 1.4;
      if (ux.cara !== 1) { ux.ojo++; if (ux.ojo >= 40) ux.ojo = 0; } else ux.ojo = 0;
      uxTajoTick();
      const meta = ux.verde && fase === "turno" ? 0.5 : 0;
      if (ux.oscuro < meta) ux.oscuro = Math.min(meta, ux.oscuro + 0.04);
      if (ux.oscuro > meta) ux.oscuro = Math.max(meta, ux.oscuro - 0.04);
    },
    dibujarOscuro() {
      if (ux.oscuro <= 0) return;
      ctx.save(); ctx.globalAlpha = ux.oscuro; ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH); ctx.restore();
    },
    posMon(m) {
      if (ux.derretido !== null && ux.derretido !== undefined) return { cx: UX_POS.x + 78, left: UX_POS.x - 20, top: -40, w: 196, h: 286, spr: "ux/melt_" + ux.derretido };
      return { cx: UX_POS.x + 100, left: UX_POS.x, top: UX_POS.y, w: 200, h: 200, spr: "ux/melt_0", numY: 170 };
    },
    dibujarMon: uxCuerpo,
    burbujaPos() { return { x: 405, y: 40, grande: true }; },
    antesDeMorir(m) {                            // "Maldición..." y se derrite
      pararMusica();
      m.hp = 0;
      // (solo sus lamentos: sin lo de Alphys, ASGORE y las almas, que no es parte de esta historia)
      const pags = ["Maldición...", "Así que ni siquiera ESE poder... ¿alcanzó...?", "...", "Je...", "Jejeje..."];
      empezarGuion([
        { esperar: 90 },
        { fn: () => { ux.temblor = 2; boxObj = { ...MENU_BOX }; } },
        { b: m, pags },
        { fn: () => { ux.derretido = 0; } },
        { esperar: 45 },
        { fn: () => { ux.derretido = 1; } },
        { b: m, pags: ["¡Este mundo va a seguir viviendo...!"] },
        { fn: () => { ux.temblor = 0; } }
      ], () => matar());
    }
  };

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
  // iniciar(p, id, opciones)
  //   id: un monstruo de MONSTRUOS ("froggit", ...) o un grupo de GRUPOS ("guardias").
  //   opciones: {x, y}           dónde está el jugador en pantalla (animación de entrada)
  //             captura          foto del mapa para la entrada
  //             sinAlerta        true = sin el "!" sobre el jugador (peleas de historia)
  //             alTerminar(res)  se llama al cerrar: "mato" | "perdon" | "huyo" | "murio"
  function nuevoMon(id, idx) {
    const def = MONSTRUOS[id] || MONSTRUOS.froggit;
    const m = Object.assign({ id, idx, maxhp: def.hp, frame: 0, shudder: 0, hurtT: 0, alpha: 1, yoff: 0, come: false, comio: false, ignora: 0, dlgExtra: null, hpVis: def.hp, muerto: false, perdonado: false }, def);
    m.hp = def.hp;
    return m;
  }
  function iniciar(p, id, pantalla) {
    if (activa || !window.Jugador) return;
    grupo = GRUPOS[id] || null;
    const ids = grupo ? grupo.mons : [MONSTRUOS[id] ? id : "froggit"];
    mons = ids.map((mid, i) => nuevoMon(mid, i));
    mon = mons[0];
    opciones = pantalla || {};
    resultado = null;
    activa = true; cerrando = false; jugadorRef = p;
    if (typeof frenar === "function") frenar();
    initAudio();
    for (const k in held) held[k] = false; for (const k in pad) { pad[k] = 0; last[k] = 0; pulsado[k] = false; }
    objs = []; efectos = []; shards = []; texto = null; burbujas = []; guion = null; target = null; dust = null; esperas = [];
    box = { ...MENU_BOX }; boxObj = { ...MENU_BOX };
    turnos = 0; frame = 0; uiSel = -1; menuSel = 0;
    heart = { x: 0, y: 0, visible: true, invc: 0, split: false, verde: false, fijo: false };
    revivirT = 0; diosT = 0; diosPendiente = false;
    // LV mínimo para las peleas de jefes: si tenés menos, "DIOS TE AYUDA" y te sube
    if (opciones.lvMinimo && J().stats().lv < opciones.lvMinimo) diosPendiente = J().subirA(opciones.lvMinimo);
    const px = pantalla && pantalla.x !== undefined ? pantalla.x : 320, py = pantalla && pantalla.y !== undefined ? pantalla.y : 240;
    intro = { t: 0, fx: px - 8, fy: py - 8, tx: UIB[0].x + 8, ty: UIB[0].y + 13, mundo: pantalla && pantalla.captura, alerta: !(pantalla && pantalla.sinAlerta) };
    heart.visible = false;
    if (grupo && grupo.iniciar) grupo.iniciar();
    fase = "intro"; faseT = 0;
    overlay.classList.remove("eb-saliendo");
    overlay.classList.add("abierta");
    prevTs = 0; acc = 0;
    requestAnimationFrame(loop);
  }
  const activos = () => mons.filter(m => !m.muerto && !m.perdonado);
  const buscarMon = id => mons.find(m => m.id === id);

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
    if (grupo && grupo.flavor) return grupo.flavor();
    if (mon.hp < mon.maxhp / 3 && mon.flavorDebil) return mon.flavorDebil;
    if (perdonable() && mon.flavorPerdon && turnos > 0) return mon.flavorPerdon;
    return choose(...mon.flavor);
  }
  // Listas de una columna (monstruos, perdonar/huir) o de dos (ACT, ITEM), como en Undertale
  const listaVertical = () => subTipo === "fight" || subTipo === "act" || subTipo === "mercy";
  function abrirSub(tipo) {
    subTipo = tipo; subSel = 0; subItems = [];
    if (tipo === "fight" || tipo === "act") subItems = activos().map(m => ({ t: "* " + m.nombre, amarillo: perdonable(m), m }));
    if (tipo === "acts") subItems = [{ t: "* Revisar" }].concat(mon.acts.map(a => ({ t: "* " + a.n })));
    if (tipo === "item") subItems = statsJ().mochila.map(id => ({ t: "* " + J().ITEMS[id].corto }));
    if (tipo === "mercy") {
      subItems = [{ t: "* Perdonar", amarillo: activos().some(m => perdonable(m)) }];
      if (!(grupo && grupo.sinHuir)) subItems.push({ t: "* Huir" });
    }
    if (!subItems.length) { sonar("select"); return false; }
    fase = "sub"; texto = null;
    return true;
  }
  function posItem(i) {
    if (listaVertical()) return { x: 64, y: 270 + i * 32 };
    return { x: 64 + (i % 2) * 256, y: 270 + Math.floor(i / 2) * 32 };
  }

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
    if (listaVertical()) {
      if (presiona("Down") && subSel + 1 < n) { subSel++; sonar("cursor"); }
      else if (presiona("Up") && subSel > 0) { subSel--; sonar("cursor"); }
    } else {
      if (presiona("Right") && subSel % 2 === 0 && subSel + 1 < n) { subSel++; sonar("cursor"); }
      else if (presiona("Left") && subSel % 2 === 1) { subSel--; sonar("cursor"); }
      else if (presiona("Down") && subSel + 2 < n) { subSel += 2; sonar("cursor"); }
      else if (presiona("Up") && subSel - 2 >= 0) { subSel -= 2; sonar("cursor"); }
    }
    if (presiona("Cancel")) {
      sonar("select");
      if (subTipo === "acts") { const antes = mon; abrirSub("act"); subSel = Math.max(0, subItems.findIndex(it => it.m === antes)); return; }
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
    if (subTipo === "fight") { mon = subItems[i].m; empezarAtaque(); return; }
    if (subTipo === "act") { mon = subItems[i].m; abrirSub("acts"); return; }
    if (subTipo === "acts") { hacerAct(i); return; }
    if (subTipo === "item") {
      const t = J().usarItem(i);
      sonar("heal");
      fase = "texto"; heart.visible = false;
      decir(t, turnoEnemigo);
      return;
    }
    if (subTipo === "mercy") {
      if (i === 0) perdonar();
      else huir();
    }
  }
  function hacerAct(i) {
    fase = "texto"; heart.visible = false;
    if (grupo && grupo.alAct) { decir(grupo.alAct(mon, i), turnoEnemigo); return; }
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
      decir("* Te escapaste...", () => terminar("huyo"));
    } else turnoEnemigo();
  }
  // Perdona a todos los que se puedan perdonar. Si no queda nadie, ganaste.
  function perdonar() {
    fase = "texto"; heart.visible = false;
    const ps = activos().filter(m => perdonable(m));
    if (!ps.length) { turnoEnemigo(); return; }
    sonar("dust");
    for (const m of ps) m.perdonado = true;
    if (!activos().length) ganar("perdon");
    else turnoEnemigo();
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
        if (dist <= 12) dmg = Math.round(dmg * DANO_MULT);
        else dmg = Math.round(dmg * ((t.w - dist) / t.w) * DANO_MULT * 0.9);
        if (grupo && grupo.dano) dmg = grupo.dano(mon, dmg);
        else dmg = Math.max(1, Math.min(dmg, Math.ceil(mon.maxhp * DANO_MAX_PCT)));
        golpear(dmg);
      }
    } else t.t++;
    if (t.estado === 2) { t.w -= 32; t.op -= 0.08; if (t.op <= 0) target = null; }
  }
  function golpear(dmg) {
    fase = "golpe"; faseT = 0;
    const m = posMon(mon), yNum = m.numY !== undefined ? m.numY : m.top - 30, quien = mon;
    if (dmg === null) {
      efectos.push({ tipo: "num", txt: "FALLASTE", x: m.cx, y: yNum, t: 0, gris: true, m: quien });
      setTimeout0(20, () => { target && (target.estado = 2); despuesDelGolpe(); });
      return;
    }
    sonar("fight");
    efectos.push({ tipo: "corte", x: m.cx, y: m.top + m.h / 2 - 50, t: 0 });
    setTimeout0(20, () => {
      sonar(quien.hurtSnd || "ehurt"); sonar("damage");
      const antes = quien.hp;
      quien.hp = Math.max(0, quien.hp - dmg);
      quien.hurtT = 30; quien.shudder = 16;
      efectos.push({ tipo: "num", txt: String(dmg), x: m.cx, y: yNum, t: 0, barra: true, desde: antes, hasta: quien.hp, m: quien });
      setTimeout0(40, () => { if (target) target.estado = 2; despuesDelGolpe(); });
    });
  }
  function despuesDelGolpe() {
    if (mon.hp <= 0) {
      if (grupo && grupo.antesDeMorir) { grupo.antesDeMorir(mon); return; }   // (escena y después matar())
      matar(); return;
    }
    turnoEnemigo();
  }
  function matar() {
    fase = "polvo"; faseT = 0;
    if (target) target.estado = 2;
    sonar("dust");
    const m = posMon(mon);
    mon.hurtT = 0; mon.shudder = 0;
    dust = { m: mon, y: 0, h: m.h, particulas: [] };
  }

  // ---------- turno del monstruo ----------
  function turnoEnemigo() {
    texto = null; target = null;
    fase = "burbuja"; faseT = 0;
    turnos++;
    burbujas = [];
    for (const m of activos()) {
      let d;
      if (grupo && grupo.dialogo) d = grupo.dialogo(m);
      else { d = m.dlgExtra || choose(...m.dialogos); m.dlgExtra = null; }
      if (d) burbujas.push({ m, txt: d, cur: 0 });
    }
    burbujaT = 0;
    boxObj = grupo ? { ...valor(grupo.cajaHabla) } : { ...BORDES[mon.caja] };
    if (!burbujas.length) finBurbujas();
  }
  let burbujaT = 0;
  const valor = v => typeof v === "function" ? v() : v;
  function burbujaTick() {
    const escribiendo = burbujas.filter(b => b.cur < b.txt.length);
    if (escribiendo.length) {
      if (presiona("Confirm")) { for (const b of burbujas) b.cur = b.txt.length; return; }
      for (const b of escribiendo) b.cur++;
      if (escribiendo[0].cur % 2 === 1) sonar("txt");
      return;
    }
    burbujaT++;
    if (burbujaT > 60 || (burbujaT > 5 && presiona("Confirm"))) finBurbujas();
  }
  function finBurbujas() {
    burbujas = [];
    if (grupo) boxObj = { ...valor(grupo.cajaAtaque) };
    fase = "caja"; faseT = 0;
  }
  function cajaLista() { return box.l === boxObj.l && box.r === boxObj.r && box.t === boxObj.t && box.b === boxObj.b; }
  function empezarTurno() {
    fase = "turno"; faseT = 0;
    heart.x = Math.round((box.l + box.r) / 2) - 8; heart.y = Math.round((box.t + box.b) / 2) - 8;
    heart.visible = true;
    if (grupo && grupo.posCorazon) grupo.posCorazon();
    if (grupo && grupo.ataque) { grupo.ataque(); return; }
    const cual = Math.random() < 0.5 ? 0 : 1;
    ataqueActual = mon.ataques[cual];
    ATAQUES[ataqueActual]();
  }
  function turnoTick() {
    // corazón
    const v = 4;
    let dx = 0, dy = 0;
    if (pad.Left) dx -= v; if (pad.Right) dx += v; if (pad.Up) dy -= v; if (pad.Down) dy += v;
    if (!heart.fijo) {
      heart.x = Math.max(box.l + 5, Math.min(box.r - 5 - 16, heart.x + dx));
      heart.y = Math.max(box.t + 5, Math.min(box.b - 5 - 16, heart.y + dy));
    }
    pasoObjetos();
    if (fase !== "turno") return;                   // (murió en este cuadro)
    turntimer--;
    if (grupo && grupo.turnoTick && grupo.turnoTick()) return;
    if (turntimer < 1) {
      objs = [];
      if (grupo && grupo.finTurno && grupo.finTurno()) return;
      heart.visible = true;
      boxObj = { ...MENU_BOX };
      fase = "cajaVuelta"; faseT = 0;
    }
  }

  // ---------- escenas dentro de la pelea (diálogos entre monstruos) ----------
  // pasos: {b: monstruo, pags: [...]} globo con páginas (Z para seguir)
  //        {esperar: cuadros} · {fn: () => ...}
  let guion = null;
  function empezarGuion(pasos, alFinal) {
    fase = "guion"; faseT = 0;
    texto = null; target = null; burbujas = [];
    heart.visible = false;
    guion = { pasos, i: -1, t: 0, burbuja: null, alFinal };
    siguientePaso();
  }
  function siguientePaso() {
    const g = guion;
    g.i++; g.t = 0; g.burbuja = null;
    if (g.i >= g.pasos.length) { guion = null; if (g.alFinal) g.alFinal(); return; }
    const p = g.pasos[g.i];
    if (p.fn) { p.fn(); if (guion === g) siguientePaso(); return; }
    if (p.b) g.burbuja = { m: p.b, pag: 0, txt: p.pags[0], cur: 0 };
  }
  function guionTick() {
    const g = guion; if (!g) return;
    const p = g.pasos[g.i];
    if (p.esperar !== undefined) { if (++g.t >= p.esperar) siguientePaso(); return; }
    const b = g.burbuja; if (!b) return;
    if (b.cur < b.txt.length) {
      if (presiona("Confirm")) { b.cur = b.txt.length; return; }
      b.cur++; if (b.cur % 2 === 1) sonar("txt");
      return;
    }
    if (presiona("Confirm")) {
      b.pag++;
      if (b.pag >= p.pags.length) siguientePaso();
      else { b.txt = p.pags[b.pag]; b.cur = 0; }
    }
  }

  // ---------- fin ----------
  function ganar(como) {
    // cada monstruo vencido (matado o perdonado) da 2-5 de oro y cuenta para el LV
    const cuantos = grupo ? mons.length : 1;
    let oro = 0, subio = 0;
    for (let i = 0; i < cuantos; i++) { oro += 2 + Math.floor(Math.random() * 4); subio += J().sumarMonstruo(); }
    J().darOro(oro);
    let t = "* ¡GANASTE!\n* Conseguiste " + oro + " de oro.";
    if (como === "huyo") t = "* " + mon.nombre + " se fue.\n* Conseguiste " + oro + " de oro.";
    if (subio > 0) { t += "\n* ¡Tu LV subió!"; setTimeout0(2, () => sonar("levelup")); }
    fase = "victoria"; heart.visible = false; objs = [];
    target = null; burbujas = []; guion = null;     // que no quede nada encima del texto
    boxObj = { ...MENU_BOX };
    pararMusica();
    decir(t, () => terminar(como));
  }
  function pararMusica() { if (musica) musica.pause(); musicaConfesion(false); }
  function terminar(res) {
    resultado = res || resultado;
    fase = "saliendo";
    salirConFundido();
  }
  function morir() {
    if (fase === "muerte") return;
    fase = "muerte"; faseT = 0;
    resultado = "murio";
    objs = []; texto = null; burbujas = []; guion = null;
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
    if (revivirT > 0) revivirT--;
    if (diosT > 0) diosT--;
    // caja (se agranda / achica 15 px por cuadro)
    for (const k of ["l", "r", "t", "b"]) {
      const d = boxObj[k] - box[k];
      box[k] += Math.sign(d) * Math.min(Math.abs(d), 15);
    }
    // monstruos
    for (const m of mons) {
      if (m.hurtT > 0) m.hurtT--;
      if (m.shudder !== 0 && frame % 2 === 0) m.shudder = m.shudder < 0 ? -(m.shudder + 2) : -m.shudder;
    }
    if (grupo && grupo.cadaCuadro) grupo.cadaCuadro();
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
    else if (fase === "guion") guionTick();
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
      irAlMenu(grupo ? grupo.entrada : mon.entrada);
      if (diosPendiente) { diosPendiente = false; diosT = DIOS_DUR; sonar("levelup"); }
    }
  }
  function polvoTick() {
    const d = dust;
    d.y += 3;                                      // se desarma de arriba hacia abajo
    const m = posMon(d.m);
    for (let i = 0; i < 6; i++) d.particulas.push({ x: m.left + rnd(m.w), y: m.top + d.y, vx: 0.5 + rnd(1.5), vy: -1 - rnd(1), t: 0 });
    for (const p of d.particulas) { p.x += p.vx; p.y += p.vy; p.t++; }
    d.particulas = d.particulas.filter(p => p.t < 30);
    if (target) targetTick();                       // la barra de ataque se termina de ir
    if (d.y > d.h + 30) {
      d.m.muerto = true; dust = null;
      if (grupo && grupo.alMorir) grupo.alMorir(d.m);
      if (activos().length) turnoEnemigo();         // queda alguien: sigue su turno
      else ganar("mato");
    }
  }

  // =====================================================================
  // Dibujo
  // =====================================================================
  function posMon(m) {
    m = m || mon;
    if (grupo && grupo.posMon) return grupo.posMon(m);
    const f = sprMon(m);
    const [w, h] = sprSize(f);
    const cx = 320, bottom = 240 + (m.yoff || 0);
    return { cx, left: Math.round(cx - w / 2), top: Math.round(bottom - h), w, h, spr: f };
  }
  function sprMon(m) {
    if (m.hurtT > 0) return m.id + "/hurt";
    const n = { froggit: 2, whimsun: 2, moldsmal: 2, loox: 5, vegetoid: 4, snowdrake: 1, icecap: 4 }[m.id] || 1;
    const i = m.anim ? Math.floor(frame / (30 / m.anim)) % n : 0;
    return m.id + "/" + i;
  }
  function dibujarPolvo(p) {
    // parte que todavía no se desarmó + partículas
    const [img, r] = fuente(p.spr);
    const visibleDesde = Math.min(p.h, dust.y);
    if (visibleDesde < p.h) ctx.drawImage(img, r[0], r[1] + visibleDesde, r[2], r[3] - visibleDesde, p.left, p.top + visibleDesde, r[2], r[3] - visibleDesde);
    ctx.fillStyle = "#ddd";
    for (const q of dust.particulas) { ctx.globalAlpha = 1 - q.t / 30; ctx.fillRect(Math.round(q.x), Math.round(q.y), 2, 2); }
    ctx.globalAlpha = 1;
  }
  function dibujarMon() {
    if (!mons.length || fase === "intro") return;
    for (const m of mons) {
      if (dust && dust.m === m) { dibujarPolvo(posMon(m)); continue; }
      if (m.muerto) continue;
      if (fase === "victoria" && !m.perdonado) continue;
      if (grupo && grupo.dibujarMon) { grupo.dibujarMon(m); continue; }
      const p = posMon(m);
      let x = p.left + m.shudder, y = p.top;
      if (m.flota) y += Math.round(Math.sin(frame / 12) * 6);
      spr(p.spr, x, y, { alpha: m.perdonado ? 0.5 : 1 });
    }
  }
  function globo(b) {
    let bx, by, s = "b/blconsm_0", tx = 20;
    if (grupo && grupo.burbujaPos) {
      const pos = grupo.burbujaPos(b.m);
      if (pos.grande) {                            // globo grande dibujado (Undyne)
        const w = 214, h = 118;
        ctx.save(); ctx.fillStyle = "#fff";
        ctx.beginPath(); ctx.roundRect ? ctx.roundRect(pos.x, pos.y, w, h, 12) : ctx.rect(pos.x, pos.y, w, h); ctx.fill();
        ctx.beginPath(); ctx.moveTo(pos.x + 1, pos.y + 40); ctx.lineTo(pos.x - 18, pos.y + 52); ctx.lineTo(pos.x + 1, pos.y + 60); ctx.fill();
        ctx.restore();
        drawText("Default", b.txt, pos.x + 12, pos.y + 10, 1, "rgb(0,0,0)", w - 24, b.cur);
        return;
      }
      ({ x: bx, y: by, spr: s, tx } = pos);
    }
    else { const m = posMon(b.m); bx = m.left + m.w + 4; by = m.top + 6; }
    spr(s, bx, by);
    drawText("Default", b.txt, bx + tx, by + 10, 1, "rgb(0,0,0)", 0, b.cur);
  }
  function dibujarBurbuja() {
    for (const b of burbujas) globo(b);
    if (guion && guion.burbuja) globo(guion.burbuja);
  }
  function dibujarHUD() {
    const s = statsJ(); const max = J().maxHP();
    drawText("Battle", J().nombre().toUpperCase() + "   LV " + s.lv, 30, 403, 3, null, 0);
    spr("HP/Default/0", 244, 416, { oy: 10 });
    const w = Math.round(max * 1.2);
    ctx.fillStyle = "rgb(255,0,0)"; ctx.fillRect(275, 400, w, 21);
    if (revivirT > 0) {
      const off = (frame * 7) % w;
      const g = ctx.createLinearGradient(275 - off, 0, 275 - off + w * 2, 0);
      const cols = ["#ff3b3b", "#ff9a2e", "#ffe100", "#3bff5c", "#3bd6ff", "#7a5cff", "#ff3bd6"];
      for (let i = 0; i <= 14; i++) g.addColorStop(i / 14, cols[i % 7]);
      ctx.fillStyle = g;
    } else ctx.fillStyle = "rgb(255,255,0)";
    ctx.fillRect(275, 400, Math.round(w * Math.max(0, s.hp) / max), 21);
    drawText("Battle", String(Math.max(0, s.hp)).padStart(2, "0") + " / " + max, 275 + w + 14, 400, 3, null, 0);
    for (const b of UIB) spr(b.n + "/" + (uiSel === b.id && (fase === "menu" || fase === "sub") ? "Highlight" : "Default") + "/0", b.x, b.y);
  }
  function dibujarMenuTextos() {
    if (texto && (fase === "menu" || fase === "texto" || fase === "victoria")) drawText("Default", texto.full, 52, 270, 2, null, 540, texto.cur);
    if (fase === "sub") {
      subItems.forEach((it, i) => {
        const p = posItem(i);
        drawText("Default", it.t, p.x + 32, p.y, 2, it.amarillo ? "rgb(255,255,0)" : null, 0);
        if (subTipo === "fight" && it.m) {
          const bw = 100, x = 64 + 32 + Math.max(...subItems.map(q => textW(FONTS.Default, q.t))) * 2 + 24;
          ctx.fillStyle = "rgb(255,0,0)"; ctx.fillRect(x, p.y + 8, bw, 17);
          ctx.fillStyle = "rgb(0,255,0)"; ctx.fillRect(x, p.y + 8, Math.round(bw * it.m.hp / it.m.maxhp), 17);
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
          const mm = e.m || mon;
          const bw = Math.max(100, Math.min(250, Math.round(mm.maxhp * 1.2))), x = Math.round(e.x - bw / 2);
          ctx.fillStyle = "rgb(64,64,64)"; ctx.fillRect(x, e.y + 4, bw, 13);
          ctx.fillStyle = "rgb(0,255,0)"; ctx.fillRect(x, e.y + 4, Math.round(bw * Math.max(0, hp) / mm.maxhp), 13);
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
      if (b.sinClip) continue;
      if (b.dibujar) { b.dibujar(b); continue; }
      if (!b.spr || b.visible === false) continue;
      const nm = Array.isArray(b.spr) ? b.spr[Math.floor(b.img) % b.spr.length] : b.spr;
      spr(nm, b.x, b.y, { ox: b.ox, oy: b.oy, ang: b.ang, alpha: b.alpha, tint: b.tint, sx: b.escala, sy: b.escala });
    }
    ctx.restore();
    for (const b of objs) {
      if (!b.sinClip) continue;
      if (b.dibujar) { b.dibujar(b); continue; }
      if (!b.spr || b.visible === false) continue;
      spr(b.spr, b.x, b.y, { ox: b.ox, oy: b.oy, ang: b.ang, alpha: b.alpha, tint: b.tint });
    }
  }
  function dibujarCorazon() {
    if (!heart.visible) return;
    if (heart.invc > 0 && Math.floor(heart.invc / 2) % 2 === 0) return;
    if (heart.verde && !heart.split) { spr("ux/heartgreen_0", heart.x, heart.y); return; }
    if (heart.split) spr("PlayerHeart/Split/0", heart.x + 8, heart.y + 8, { ox: 8, oy: 10, ang: -90, tint: "rgb(255,0,0)" });
    else spr("PlayerHeart/Default/0", heart.x + 8, heart.y + 8, { ox: 8, oy: 8, ang: -90, tint: "rgb(255,0,0)" });
  }
  function dibujar() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, LW, LH);
    if (listas < LISTAS) return;
    if (fase === "intro") {
      if (intro.t < 15) {
        if (intro.mundo) ctx.drawImage(intro.mundo, 0, 0, LW, LH);
        if (intro.alerta) spr("b/exc_0", intro.fx + 8, intro.fy - 18, { w: 20, h: 20, ox: 5, oy: 10 });
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
    if (grupo && grupo.dibujarOscuro) grupo.dibujarOscuro();
    caja(box.l, box.t, box.r - box.l, box.b - box.t);
    dibujarMenuTextos();
    dibujarTarget();
    dibujarObjs();
    dibujarEfectos();
    dibujarCorazon();
    if (revivirT > 0) dibujarCartel("WHO DECIDED THAT?", revivirT, REVIVIR_DUR);
    else if (diosT > 0) dibujarCartel("DIOS TE AYUDA", diosT, DIOS_DUR);
  }
  function dibujarCartel(txt, restante, dur) {
    const t = (dur - restante) / 30, r = restante / 30;
    let esc = 1, alpha = 1;
    if (t < 0.12) esc = 0.4 + (t / 0.12) * 0.8;
    else if (t < 0.22) esc = 1.2 - ((t - 0.12) / 0.1) * 0.2;
    if (r < 0.4) alpha = r / 0.4;
    const w = textW(FONTS.Damage, txt), h = FONTS.Damage.ch;
    ctx.save();
    ctx.translate(LW / 2, LH / 2); ctx.scale(esc, esc);
    for (const [ox, oy] of [[-3, 0], [3, 0], [0, -3], [0, 3], [-2, -2], [2, -2], [-2, 2], [2, 2]])
      drawText("Damage", txt, -w / 2 + ox, -h / 2 + oy, 1, "rgb(0,0,0)", 0, undefined, alpha);
    drawText("Damage", txt, -w / 2, -h / 2, 1, null, 0, undefined, alpha);
    ctx.restore();
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
      const fin = opciones.alTerminar; opciones = {};
      if (typeof fin === "function") { try { fin(resultado || "huyo"); } catch (e) { console.error(e); } }
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
    iniciar, MONSTRUOS, GRUPOS,
    get activa() { return activa; }
  };
})();

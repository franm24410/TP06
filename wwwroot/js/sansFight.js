// sansFight.js — pelea contra Sans (FIGHT / MERCY), se activa al tocar una hitbox "PEL1"
//
// Cómo se engancha con el resto del juego:
// - MapRender.js busca objetos llamados "PELx" en cualquier capa de objetos (igual que
//   hace con "cai" o "GUA1") y, al tocarlos, llama a window.SansFight.iniciar(player).
// - site.js corta su propio update() apenas SansFight.activa es true, así el jugador
//   y el mapa quedan congelados de fondo mientras dura la pelea.
// - Al ganar, se guarda ESTADO.peleasGanadas.PEL1 = true (se persiste solo cuando el
//   jugador guarda la partida en un GUA1, igual que pasa con puzzlesPiedra).
//
// Dificultad: pensada para ser GANABLE sin sufrir de más — los huesos tienen huecos
// generosos, el gaster blaster avisa con tiempo, y FIGHT sí hace daño de verdad
// (a diferencia del Sans original, que es casi imposible de golpear).

(function () {
  const overlay = document.getElementById("sansBattle");
  const elDialogo = document.getElementById("sbDialogo");
  const elSansImg = document.getElementById("sbSansImg");
  const cvs = document.getElementById("sbCanvas");
  const cx = cvs.getContext("2d");
  const elMenu = document.getElementById("sbMenu");
  const btnFight = document.getElementById("sbBtnFight");
  const btnMercy = document.getElementById("sbBtnMercy");
  const elBarra = document.getElementById("sbFightBar");
  const elLinea = document.getElementById("sbTargetLinea");
  const elHpSans = document.getElementById("sbSansHpFill");
  const elHpJug = document.getElementById("sbJugadorHpFill");
  const elHint = document.getElementById("sbHint");
  const elReintentar = document.getElementById("sbReintentar");

  if (!overlay) { console.warn("sansFight.js: falta el HTML de #sansBattle en la vista."); return; }

  const BOX_W = 360, BOX_H = 200;

  // ---------- imágenes ----------
  function cargarImg(src) { const i = new Image(); i.src = src; return i; }
  const imgs = {
    corazon: cargarImg("/Battle/heart_red.png"),
    blaster: [0, 1, 2, 3, 4, 5].map(n => cargarImg("/Battle/spr_gasterblaster_" + n + ".png")),
    beam: cargarImg("/Battle/beam.png")
  };

  function sonido(src, vol) { try { const a = new Audio(src); a.volume = vol ?? 0.5; a.play().catch(() => { }); } catch (e) { } }

  // ---------- estado general ----------
  let activa = false, jugadorRef = null;
  let fase = "cerrado"; // dialogo | menu | fightbar | ataque | victoria | derrota
  let jugadorHP = 100, jugadorHPMax = 100;
  let sansHP = 100, sansHPMax = 100;
  let dijoSerio = false;
  let rondaCount = 0;
  let tGlobal = 0;
  let invulnerableHasta = 0;
  let corazon = { x: BOX_W / 2, y: BOX_H / 2, w: 14, h: 14 };

  // ---------- líneas de Sans (originales, no son citas textuales del juego) ----------
  const LINEAS_INICIO = [
    "* huh. no esperaba compañía por acá.",
    "* bueno... probemos si tenés lo que hay que tener."
  ];
  const LINEAS_MEDIO = [
    "* je. no aflojes, que recién estamos entrando en calor.",
    "* ¿sabías que nunca te voy a mentir? los esqueletos no tenemos nada que esconder.",
    "* tranquilo. esto es solo hasta el tuétano.",
    "* seguís de pie. no está nada mal para alguien sin médula.",
    "* un esqueleto como yo no se rompe tan fácil."
  ];
  const LINEAS_MERCY = [
    "* ¿perdonarme? nah. todavía no terminé de divertirme.",
    "* qué tierno. pero no.",
    "* ...no. la respuesta sigue siendo no."
  ];
  const LINEA_SERIO = "* je. creo que es hora de ponerse un poco más serio.";
  const LINEA_VICTORIA = "* ...vaya. no me la esperaba. no está nada mal, che.";
  const LINEA_DERROTA = "* eh, tranquilo. probá de nuevo cuando quieras.";

  function alAzar(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  // ---------- diálogo con efecto de tipeo ----------
  let dialogoTimer = null;
  function mostrarDialogo(texto, cb, pausaFinal) {
    clearTimeout(dialogoTimer);
    elDialogo.textContent = "";
    let i = 0;
    (function paso() {
      elDialogo.textContent = texto.slice(0, i);
      i++;
      if (i <= texto.length) { dialogoTimer = setTimeout(paso, 28); }
      else if (cb) { dialogoTimer = setTimeout(cb, pausaFinal ?? 1100); }
    })();
  }

  // ---------- ciclo de vida ----------
  function iniciar(p) {
    if (activa) return;
    if (window.ESTADO && window.ESTADO.peleasGanadas && window.ESTADO.peleasGanadas.PEL1) return;
    activa = true; jugadorRef = p;
    if (window.frenar) window.frenar();
    jugadorHP = jugadorHPMax; sansHP = sansHPMax; dijoSerio = false; rondaCount = 0;
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2; invulnerableHasta = 0;
    elSansImg.src = "/Battle/sans_idle.gif";
    elHint.textContent = "";
    elReintentar.style.display = "none";
    overlay.classList.add("abierta");
    actualizarBarras();
    elMenu.style.display = "none"; elBarra.style.display = "none";
    fase = "dialogo";
    mostrarDialogo(alAzar(LINEAS_INICIO), irAMenu);
    tGlobal = performance.now();
    requestAnimationFrame(loopBatalla);
  }

  function irAMenu() {
    fase = "menu";
    elDialogo.textContent = "* FIGHT o MERCY.";
    elMenu.style.display = "flex";
  }

  function actualizarBarras() {
    elHpSans.style.width = Math.max(0, (sansHP / sansHPMax * 100)) + "%";
    elHpJug.style.width = Math.max(0, (jugadorHP / jugadorHPMax * 100)) + "%";
  }

  function cerrarBatalla() {
    activa = false; fase = "cerrado";
    overlay.classList.remove("abierta");
  }

  // ---------- FIGHT: barra de tiempo ----------
  let barraT = 0, barraDir = 1, barraTs = 0;
  function elegirFight() {
    elMenu.style.display = "none";
    elDialogo.textContent = "";
    elBarra.style.display = "flex";
    barraT = 0; barraDir = 1; barraTs = performance.now();
    fase = "fightbar";
  }
  function actualizarBarraFight(ts) {
    const dt = ts - barraTs; barraTs = ts;
    barraT += barraDir * dt / 650;
    if (barraT >= 1) { barraT = 1; barraDir = -1; }
    if (barraT <= 0) { barraT = 0; barraDir = 1; }
    elLinea.style.left = (barraT * 100) + "%";
  }
  function confirmarGolpe() {
    if (fase !== "fightbar") return;
    const dist = Math.abs(barraT - 0.5);
    let dano = 0, texto = "";
    if (dist < 0.05) { dano = 30; texto = "¡GOLPE CRÍTICO!"; }
    else if (dist < 0.16) { dano = 18; texto = "¡Buen golpe!"; }
    else { dano = 0; texto = "Fallaste."; }
    sansHP = Math.max(0, sansHP - dano);
    actualizarBarras();
    elBarra.style.display = "none";
    elDialogo.textContent = texto;
    fase = "resolviendo"; // evita que un segundo ESPACIO cuente el golpe dos veces
    if (sansHP <= 0) { setTimeout(victoria, 900); return; }
    setTimeout(() => {
      if (!dijoSerio && sansHP <= sansHPMax * 0.5) {
        dijoSerio = true;
        elSansImg.src = "/Battle/sans_glow_cyan.png";
        mostrarDialogo(LINEA_SERIO, () => { elSansImg.src = "/Battle/sans_idle.gif"; iniciarAtaque(); });
      } else {
        mostrarDialogo(alAzar(LINEAS_MEDIO), iniciarAtaque);
      }
    }, 900);
  }

  function elegirMercy() {
    elMenu.style.display = "none";
    mostrarDialogo(alAzar(LINEAS_MERCY), iniciarAtaque);
  }

  // ---------- victoria / derrota ----------
  function victoria() {
    fase = "victoria";
    elSansImg.src = "/Battle/sans_dance.gif";
    if (!window.ESTADO) window.ESTADO = {};
    if (!window.ESTADO.peleasGanadas) window.ESTADO.peleasGanadas = {};
    window.ESTADO.peleasGanadas.PEL1 = true;
    mostrarDialogo(LINEA_VICTORIA, () => { cerrarBatalla(); }, 1800);
  }
  function derrota() {
    fase = "derrota";
    elHint.textContent = "";
    elDialogo.textContent = LINEA_DERROTA;
    elReintentar.style.display = "inline-block";
  }
  elReintentar.addEventListener("click", () => {
    elReintentar.style.display = "none";
    jugadorHP = jugadorHPMax; sansHP = sansHPMax;
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2;
    actualizarBarras();
    fase = "dialogo";
    mostrarDialogo(alAzar(LINEAS_INICIO), irAMenu);
  });

  // ---------- daño al jugador (con invulnerabilidad corta) ----------
  function intentarDanio(cant) {
    if (tGlobal < invulnerableHasta) return;
    jugadorHP = Math.max(0, jugadorHP - cant);
    invulnerableHasta = tGlobal + 600;
    actualizarBarras();
    if (jugadorHP <= 0) derrota();
  }
  function solapa(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function rectCorazon() { return { x: corazon.x - corazon.w / 2, y: corazon.y - corazon.h / 2, w: corazon.w, h: corazon.h }; }

  function gapsAleatorios(total, cuantos) {
    const arr = [...Array(total).keys()], out = [];
    for (let i = 0; i < cuantos; i++) { const idx = Math.floor(Math.random() * arr.length); out.push(arr.splice(idx, 1)[0]); }
    return out;
  }

  // ---------- patrones de ataque ----------
  const DUR_ABAJO = 3100, DUR_LADOS = 3200, DUR_QUIETO = 2600;
  let estAbajo, estLados, estQuieto, estBlaster;

  function prepararAbajo() {
    estAbajo = { ondas: [{ inicio: 0, gaps: gapsAleatorios(6, 2) }, { inicio: 1550, gaps: gapsAleatorios(6, 2) }] };
  }
  function frameAbajo(tp) {
    const lanes = 6, laneW = BOX_W / lanes;
    let dano = false;
    for (const onda of estAbajo.ondas) {
      const t = tp - onda.inicio;
      if (t < 0 || t > 1550) continue;
      let alpha = 1;
      if (t < 350) alpha = t / 350 * 0.35;
      else if (t < 1300) { alpha = 1; }
      else alpha = Math.max(0, 1 - (t - 1300) / 250);
      const solido = t >= 350 && t < 1300;
      for (let i = 0; i < lanes; i++) {
        if (onda.gaps.includes(i)) continue;
        const x = i * laneW + (laneW - 30) / 2;
        dibujarHueso(x, BOX_H - 150, 30, 150, alpha, true);
        if (solido && solapa(rectCorazon(), { x, y: BOX_H - 150, w: 30, h: 150 })) dano = true;
      }
    }
    if (dano) intentarDanio(20);
    return tp >= DUR_ABAJO;
  }

  function prepararLados() {
    const filas = 5, filaH = BOX_H / filas;
    const ondas = [];
    for (const inicio of [0, 1600]) {
      const gaps = gapsAleatorios(filas, 2);
      const lado = Math.random() < 0.5 ? "izq" : "der";
      ondas.push({ inicio, gaps, lado, filaH });
    }
    estLados = { ondas, filas, filaH };
  }
  function frameLados(tp) {
    const { ondas, filas, filaH } = estLados;
    let dano = false;
    for (const onda of ondas) {
      const t = tp - onda.inicio;
      if (t < 0 || t > 1500) continue;
      const prog = Math.min(1, t / 1400);
      for (let f = 0; f < filas; f++) {
        if (onda.gaps.includes(f)) continue;
        const y = f * filaH + (filaH - 14) / 2;
        const x = onda.lado === "izq" ? -50 + prog * (BOX_W + 50) : BOX_W + 50 - prog * (BOX_W + 50) - 50;
        dibujarHueso(x, y, 50, 14, 1, false);
        if (solapa(rectCorazon(), { x, y, w: 50, h: 14 })) dano = true;
      }
    }
    if (dano) intentarDanio(20);
    return tp >= DUR_LADOS;
  }

  function prepararQuieto() {
    estQuieto = { filas: [60, 140], ref: null };
    elHint.textContent = "¡NO TE MUEVAS!";
  }
  function frameQuieto(tp) {
    let alpha = tp < 250 ? tp / 250 : 1;
    const activo = tp >= 250;
    if (activo && !estQuieto.ref) estQuieto.ref = { x: corazon.x, y: corazon.y };
    for (const y of estQuieto.filas) {
      dibujarHueso(20, y - 7, 320, 14, alpha, false, true);
    }
    if (activo) {
      const ref = estQuieto.ref;
      const moved = Math.hypot(corazon.x - ref.x, corazon.y - ref.y) > 4;
      if (moved) intentarDanio(20);
    }
    if (tp >= DUR_QUIETO) { elHint.textContent = ""; return true; }
    return false;
  }

  function prepararBlaster() {
    const dos = sansHP <= sansHPMax * 0.2 && Math.random() < 0.5;
    const filas = [30, 100, 170];
    const b1 = { inicio: 0, y: filas[Math.floor(Math.random() * filas.length)], sonaron: false };
    const lista = [b1];
    if (dos) lista.push({ inicio: 2200, y: filas[Math.floor(Math.random() * filas.length)], sonaron: false });
    estBlaster = { lista, dur: dos ? 4100 : 1900 };
    elSansImg.src = "/Battle/sans_fists.png";
  }
  function frameBlaster(tp) {
    let dano = false, algunoActivo = false;
    for (const b of estBlaster.lista) {
      const t = tp - b.inicio;
      if (t < 0 || t > 1400) continue;
      algunoActivo = true;
      if (!b.sonaron) { sonido("/Battle/gasterintro.wav", 0.4); b.sonaron = true; }
      if (t < 900) {
        const frame = Math.min(5, Math.floor(t / 150));
        const img = imgs.blaster[frame];
        if (img.complete) cx.drawImage(img, -6, b.y - 20, 40, 40);
      } else if (t < 1200) {
        if (t - 900 < 20) sonido("/Battle/gasterfire.wav", 0.5);
        const img = imgs.blaster[5];
        if (img.complete) cx.drawImage(img, -6, b.y - 20, 40, 40);
        cx.save(); cx.globalAlpha = 0.95;
        if (imgs.beam.complete) cx.drawImage(imgs.beam, 0, b.y - 13, BOX_W, 26);
        cx.restore();
        if (solapa(rectCorazon(), { x: 0, y: b.y - 13, w: BOX_W, h: 26 })) dano = true;
      } else {
        cx.save(); cx.globalAlpha = 1 - (t - 1200) / 200;
        if (imgs.beam.complete) cx.drawImage(imgs.beam, 0, b.y - 13, BOX_W, 26);
        cx.restore();
      }
    }
    if (dano) intentarDanio(30);
    if (tp >= estBlaster.dur) { elSansImg.src = "/Battle/sans_idle.gif"; return true; }
    return false;
  }

  function dibujarHueso(x, y, w, h, alpha, vertical, naranja) {
    cx.save();
    cx.globalAlpha = alpha;
    cx.fillStyle = naranja ? "#ff9a2e" : "#ffffff";
    const r = Math.min(w, h) / 2;
    cx.beginPath();
    cx.moveTo(x + r, y);
    cx.arcTo(x + w, y, x + w, y + h, r);
    cx.arcTo(x + w, y + h, x, y + h, r);
    cx.arcTo(x, y + h, x, y, r);
    cx.arcTo(x, y, x + w, y, r);
    cx.closePath();
    cx.fill();
    cx.restore();
  }

  let ataqueActivo = null, ataqueInicio = 0;
  function iniciarAtaque() {
    fase = "ataque";
    rondaCount++;
    const opciones = ["huesosAbajo", "huesosLados", "quieto"];
    if (sansHP <= sansHPMax * 0.5) opciones.push("blaster", "blaster");
    ataqueActivo = alAzar(opciones);
    elHint.textContent = "";
    if (ataqueActivo === "huesosAbajo") prepararAbajo();
    else if (ataqueActivo === "huesosLados") prepararLados();
    else if (ataqueActivo === "quieto") prepararQuieto();
    else if (ataqueActivo === "blaster") prepararBlaster();
    ataqueInicio = tGlobal;
  }
  function finAtaque() {
    if (rondaCount % 2 === 0) mostrarDialogo(alAzar(LINEAS_MEDIO), irAMenu);
    else irAMenu();
  }
  function actualizarYdibujarAtaque(tp) {
    let terminado = false;
    if (ataqueActivo === "huesosAbajo") terminado = frameAbajo(tp);
    else if (ataqueActivo === "huesosLados") terminado = frameLados(tp);
    else if (ataqueActivo === "quieto") terminado = frameQuieto(tp);
    else if (ataqueActivo === "blaster") terminado = frameBlaster(tp);
    if (terminado) finAtaque();
  }

  // ---------- corazón (movimiento) ----------
  const teclasSB = {};
  document.addEventListener("keydown", (e) => {
    if (!activa) return;
    const t = e.key.toLowerCase();
    if (["arrowup", "arrowdown", "arrowleft", "arrowright", " ", "w", "a", "s", "d"].includes(t)) e.preventDefault();
    teclasSB[t] = true;
    if (t === " " && fase === "fightbar") confirmarGolpe();
  });
  document.addEventListener("keyup", (e) => { teclasSB[e.key.toLowerCase()] = false; });

  function moverCorazon(dt) {
    if (fase !== "ataque") return;
    const vel = 0.13 * dt;
    let dx = 0, dy = 0;
    if (teclasSB.a || teclasSB.arrowleft) dx -= vel;
    if (teclasSB.d || teclasSB.arrowright) dx += vel;
    if (teclasSB.w || teclasSB.arrowup) dy -= vel;
    if (teclasSB.s || teclasSB.arrowdown) dy += vel;
    corazon.x = Math.min(BOX_W - 20, Math.max(20, corazon.x + dx));
    corazon.y = Math.min(BOX_H - 16, Math.max(16, corazon.y + dy));
  }

  // ---------- botones ----------
  btnFight.addEventListener("click", () => { if (fase === "menu") elegirFight(); });
  btnMercy.addEventListener("click", () => { if (fase === "menu") elegirMercy(); });
  elBarra.addEventListener("click", () => { if (fase === "fightbar") confirmarGolpe(); });

  // ---------- loop propio de la pelea ----------
  function dibujar() {
    cx.clearRect(0, 0, BOX_W, BOX_H);
    cx.fillStyle = "#000"; cx.fillRect(0, 0, BOX_W, BOX_H);
    if (fase === "ataque") actualizarYdibujarAtaque(tGlobal - ataqueInicio);
    cx.strokeStyle = "#fff"; cx.lineWidth = 4;
    cx.strokeRect(2, 2, BOX_W - 4, BOX_H - 4);
    if (fase === "ataque" && imgs.corazon.complete) {
      const parpadea = tGlobal < invulnerableHasta && Math.floor(tGlobal / 100) % 2 === 0;
      if (!parpadea) cx.drawImage(imgs.corazon, corazon.x - 10, corazon.y - 10, 20, 20);
    }
  }

  function loopBatalla(ts) {
    if (!activa) return;
    const dt = ts - tGlobal; tGlobal = ts;
    if (fase === "fightbar") actualizarBarraFight(ts);
    if (fase === "ataque") moverCorazon(dt);
    dibujar();
    requestAnimationFrame(loopBatalla);
  }

  window.SansFight = { iniciar, get activa() { return activa; } };
})();

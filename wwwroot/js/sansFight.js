// sansFight.js — pelea contra Sans (FIGHT / MERCY), se activa al tocar una hitbox "PEL1"
//
// - MapRender.js busca objetos "PELx" y llama a window.SansFight.iniciar(player).
// - site.js corta su propio update() mientras SansFight.activa es true.
// - Ganar guarda ESTADO.peleasGanadas.PEL1 = true (se persiste al guardar en un GUA).
// - Perder te saca de la pelea (con fundido) y te manda a ESTADO.ultimoGuardado
//   (mapa+posición del último GUA usado) o, si nunca guardaste, al objeto "Spawn".

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
  const elHint = document.getElementById("sbHint");
  const elHpSansFill = document.getElementById("sbSansHpFill");
  const elHpSansRoja = document.getElementById("sbSansHpRoja");
  const elHpSansNum = document.getElementById("sbSansHpNum");
  const elHpJugFill = document.getElementById("sbJugadorHpFill");
  const elHpJugRoja = document.getElementById("sbJugadorHpRoja");
  const elHpJugNum = document.getElementById("sbJugadorHpNum");
  const elTotem = document.getElementById("sbTotem");

  if (!overlay) { console.warn("sansFight.js: falta el HTML de #sansBattle en la vista."); return; }

  // Tamaño de la caja: normal, y "expandida" para los ataques de huesos laterales
  // (en la pelea original la caja se agranda para esos ataques).
  let BOX_W = 300, BOX_H = 140;
  function fijarCaja(w, h) {
    BOX_W = w; BOX_H = h;
    cvs.width = w; cvs.height = h;
    cvs.style.aspectRatio = w + " / " + h;
  }

  // ---------- imágenes ----------
  function cargarImg(src) { const i = new Image(); i.src = src; return i; }
  const imgHueso = cargarImg("/Battle/bone.png");
  const imgs = {
    corazonRoja: cargarImg("/Battle/heart_red.png"),
    corazonAzul: cargarImg("/Battle/heart_blue.png"),
    blaster: [0, 1, 2, 3, 4, 5].map(n => cargarImg("/Battle/spr_gasterblaster_" + n + ".png")),
    beam: cargarImg("/Battle/beam.png")
  };
  function sonido(src, vol) { try { const a = new Audio(src); a.volume = vol ?? 0.5; a.play().catch(() => { }); } catch (e) { } }

  let huesoNaranja = null;
  function getHuesoNaranja() {
    if (!huesoNaranja && imgHueso.complete && imgHueso.naturalWidth) {
      const c = document.createElement("canvas");
      c.width = imgHueso.naturalWidth; c.height = imgHueso.naturalHeight;
      const bctx = c.getContext("2d");
      bctx.drawImage(imgHueso, 0, 0);
      bctx.globalCompositeOperation = "source-atop";
      bctx.fillStyle = "#ff9a2e"; bctx.fillRect(0, 0, c.width, c.height);
      huesoNaranja = c;
    }
    return huesoNaranja;
  }
  function dibujarHueso(x, y, w, h, alpha, naranja) {
    if (w <= 0 || h <= 0 || !imgHueso.complete) return;
    const img = naranja ? getHuesoNaranja() : imgHueso;
    if (!img) return;
    cx.save(); cx.globalAlpha = alpha; cx.drawImage(img, x, y, w, h); cx.restore();
  }

  // ---------- estado general ----------
  let activa = false, jugadorRef = null;
  let fase = "cerrado"; // dialogo | menu | fightbar | resolviendo | ataque | victoria | derrota
  let jugadorHP = 100, jugadorHPMax = 100;
  let sansHP = 1000, sansHPMax = 1000; // x10 — pelea larga de verdad
  let dijoSerio = false;
  let dijoMuySerio = false;
  let rondaCount = 0;
  let tGlobal = 0;
  let invulnerableHasta = 0;
  let corazon = { x: BOX_W / 2, y: BOX_H / 2, w: 14, h: 14 };

  // ---------- líneas de Sans (originales) ----------
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
  const LINEA_MUY_SERIO = "* ...bien. se acabó jugar en serio ahora.";
  const LINEA_VICTORIA = "* ...vaya. no me la esperaba. no está nada mal, che.";
  const LINEA_DERROTA = "* eh, tranquilo. probá de nuevo cuando quieras.";

  function alAzar(lista) { return lista[Math.floor(Math.random() * lista.length)]; }

  // ---------- diálogo con efecto de tipeo (rápido) ----------
  let dialogoTimer = null;
  function mostrarDialogo(texto, cb, pausaFinal) {
    clearTimeout(dialogoTimer);
    elDialogo.textContent = "";
    let i = 0;
    (function paso() {
      elDialogo.textContent = texto.slice(0, i);
      i++;
      if (i <= texto.length) { dialogoTimer = setTimeout(paso, 16); }
      else if (cb) { dialogoTimer = setTimeout(cb, pausaFinal ?? 650); }
    })();
  }

  // ---------- ciclo de vida ----------
  function iniciar(p) {
    if (activa) return;
    if (typeof ESTADO !== "undefined" && ESTADO.peleasGanadas && ESTADO.peleasGanadas.PEL1) return;
    activa = true; jugadorRef = p;
    if (typeof frenar === "function") frenar();
    jugadorHP = jugadorHPMax; sansHP = sansHPMax; dijoSerio = false; dijoMuySerio = false; rondaCount = 0;
    fijarCaja(300, 140);
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2; invulnerableHasta = 0;
    elSansImg.src = "/Battle/sans_idle.gif";
    elHint.textContent = "";
    overlay.classList.remove("sb-saliendo");
    overlay.classList.add("abierta");
    pintarHP(elHpSansFill, elHpSansRoja, elHpSansNum, sansHP, sansHPMax, true);
    pintarHP(elHpJugFill, elHpJugRoja, elHpJugNum, jugadorHP, jugadorHPMax, true);
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
    elSansImg.src = (Math.random() < 0.12) ? "/Battle/sans_dance.gif" : "/Battle/sans_idle.gif";
  }

  // ---------- barras de HP (con "rastro" rojo, estilo Undertale) ----------
  function pintarHP(elFill, elRoja, elNum, valor, max, instantaneo) {
    const pct = Math.max(0, valor / max * 100);
    if (instantaneo) { elRoja.style.transition = "none"; elRoja.style.width = pct + "%"; void elRoja.offsetWidth; elRoja.style.transition = ""; }
    elFill.style.width = pct + "%";
    if (elNum) elNum.textContent = Math.max(0, Math.round(valor)) + "/" + max;
    if (!instantaneo) setTimeout(() => { elRoja.style.width = pct + "%"; }, 450);
  }

  function cerrarBatalla() {
    activa = false; fase = "cerrado";
    overlay.classList.remove("abierta");
  }
  // Cierra con un fundido (como el de cruzar una puerta) en vez de cortar en seco.
  function salirConFundido(despues) {
    overlay.classList.add("sb-saliendo");
    setTimeout(() => {
      cerrarBatalla();
      overlay.classList.remove("sb-saliendo");
      elSansImg.src = "/Battle/sans_idle.gif";
      if (despues) despues();
    }, 550);
  }

  // ---------- FIGHT: barra de tiempo (ya probada y anda bien: vuelta de 1.5s) ----------
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
    barraT += barraDir * dt / 1500;
    if (barraT >= 1) { barraT = 1; barraDir = -1; }
    if (barraT <= 0) { barraT = 0; barraDir = 1; }
    elLinea.style.left = (barraT * 100) + "%";
  }
  function confirmarGolpe() {
    if (fase !== "fightbar") return;
    const dist = Math.abs(barraT - 0.5);
    let dano = 0, texto = "";
    if (dist < 0.08) { dano = 30; texto = "¡GOLPE CRÍTICO!"; }
    else if (dist < 0.24) { dano = 18; texto = "¡Buen golpe!"; }
    else if (dist < 0.38) { dano = 8; texto = "Rozaste."; }
    else { dano = 0; texto = "Fallaste."; }
    sansHP = Math.max(0, sansHP - dano);
    pintarHP(elHpSansFill, elHpSansRoja, elHpSansNum, sansHP, sansHPMax);
    elBarra.style.display = "none";
    elDialogo.textContent = texto;
    fase = "resolviendo"; // evita que un segundo ESPACIO cuente el golpe dos veces
    if (sansHP <= 0) { setTimeout(victoria, 500); return; }
    setTimeout(() => {
      if (!dijoSerio && sansHP <= sansHPMax * 0.5) {
        dijoSerio = true;
        elSansImg.src = "/Battle/sans_glow_cyan.png";
        mostrarDialogo(LINEA_SERIO, () => { elSansImg.src = "/Battle/sans_idle.gif"; iniciarAtaque(); });
      } else if (!dijoMuySerio && sansHP <= sansHPMax * 0.2) {
        dijoMuySerio = true;
        elSansImg.src = "/Battle/Sans_battle_glowing_eye.gif";
        mostrarDialogo(LINEA_MUY_SERIO, () => { elSansImg.src = "/Battle/sans_idle.gif"; iniciarAtaque(); });
      } else if (rondaCount % 3 === 0) {
        mostrarDialogo(alAzar(LINEAS_MEDIO), iniciarAtaque);
      } else {
        iniciarAtaque();
      }
    }, 450);
  }

  function elegirMercy() {
    elMenu.style.display = "none";
    mostrarDialogo(alAzar(LINEAS_MERCY), iniciarAtaque);
  }

  // ---------- victoria / derrota ----------
  function victoria() {
    fase = "victoria";
    elSansImg.src = "/Battle/sans_bleeding.gif"; // reacción de golpe
    if (typeof ESTADO !== "undefined") {
      if (!ESTADO.peleasGanadas) ESTADO.peleasGanadas = {};
      ESTADO.peleasGanadas.PEL1 = true;
    }
    mostrarDialogo(LINEA_VICTORIA, () => {
      setTimeout(() => salirConFundido(), 900); // se lo ve un rato antes de que se desvanezca
    }, 1300);
  }

  function derrota() {
    fase = "derrota";
    elHint.textContent = "";
    elMenu.style.display = "none"; elBarra.style.display = "none";
    elSansImg.src = "/Battle/Sans_battle_fatal.png";
    mostrarDialogo(LINEA_DERROTA, () => { salirConFundido(reubicarTrasDerrota); }, 900);
  }

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

  // ---------- daño al jugador (con invulnerabilidad corta) ----------
  // Antes esto llamaba a derrota() al llegar a 0 HP. Ahora, mientras Sans siga
  // con vida, el jugador no puede "perder": vuelve a 100 con un TOTEM.
  function intentarDanio(cant) {
    if (tGlobal < invulnerableHasta) return;
    jugadorHP = Math.max(0, jugadorHP - cant);
    invulnerableHasta = tGlobal + 600;
    pintarHP(elHpJugFill, elHpJugRoja, elHpJugNum, jugadorHP, jugadorHPMax);
    if (jugadorHP <= 0) revivirConTotem();
  }

  // ---------- TOTEM: revive al jugador en vez de sacarlo de la pelea ----------
  let totemTimer = null;
  function revivirConTotem() {
    jugadorHP = jugadorHPMax;
    invulnerableHasta = tGlobal + 1200; // un respiro extra tras revivir, como el totem de Minecraft
    pintarHP(elHpJugFill, elHpJugRoja, elHpJugNum, jugadorHP, jugadorHPMax, true);
    elHpJugFill.classList.add("sb-totem-color");
    elHpJugRoja.classList.add("sb-totem-color");
    if (elTotem) {
      elTotem.classList.remove("sb-totem-mostrar");
      void elTotem.offsetWidth; // fuerza el reinicio de la animación si te toca morir dos veces seguidas
      elTotem.classList.add("sb-totem-mostrar");
    }
    clearTimeout(totemTimer);
    totemTimer = setTimeout(() => {
      elHpJugFill.classList.remove("sb-totem-color");
      elHpJugRoja.classList.remove("sb-totem-color");
      if (elTotem) elTotem.classList.remove("sb-totem-mostrar");
    }, 1100);
  }
  function solapa(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function rectCorazon() { return { x: corazon.x - corazon.w / 2, y: corazon.y - corazon.h / 2, w: corazon.w, h: corazon.h }; }

  // Dificultad progresiva: 1.0 con Sans a full vida, sube a medida que le
  // pegás. Solo se usa para agregar más huesos / achicar tiempos de espera
  // en los ataques nuevos — nunca para bajarle nada a los que ya tenías.
  function factorDificultad() {
    const frac = Math.max(0, Math.min(1, sansHP / sansHPMax));
    return 1 + (1 - frac) * 0.6; // hasta 1.6x cerca del final
  }

  // ---------- ataques originales de Sans (huesos reales) ----------
  const DUR_ABAJO = 2600, DUR_GAUNTLET = 3600, DUR_NARANJA = 2200, DUR_AZUL = 4500;
  let estAbajo, estGauntlet, estNaranja, estBlaster;

  // 1) Huesos que suben desde el piso, con huecos.
  function prepararAbajo() {
    fijarCaja(300, 140);
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2;
    estAbajo = { ondas: [{ inicio: 0, gaps: gapsAleatorios(5, 2) }, { inicio: 1300, gaps: gapsAleatorios(5, 2) }] };
  }
  function gapsAleatorios(total, cuantos) {
    const arr = [...Array(total).keys()], out = [];
    for (let i = 0; i < cuantos; i++) { const idx = Math.floor(Math.random() * arr.length); out.push(arr.splice(idx, 1)[0]); }
    return out;
  }
  function frameAbajo(tp) {
    const lanes = 5, laneW = BOX_W / lanes;
    let dano = false;
    for (const onda of estAbajo.ondas) {
      const t = tp - onda.inicio;
      if (t < 0 || t > 1300) continue;
      let alpha = 1, solido = t >= 250 && t < 1000;
      if (t < 250) alpha = t / 250 * 0.35;
      else if (t >= 1000) alpha = Math.max(0, 1 - (t - 1000) / 300);
      for (let i = 0; i < lanes; i++) {
        if (onda.gaps.includes(i)) continue;
        const x = i * laneW + (laneW - 22) / 2;
        dibujarHueso(x, BOX_H - 110, 22, 110, alpha);
        if (solido && solapa(rectCorazon(), { x, y: BOX_H - 110, w: 22, h: 110 })) dano = true;
      }
    }
    if (dano) intentarDanio(20);
    return tp >= DUR_ABAJO;
  }

  // 2) Gauntlet lateral: huesos de piso y de techo cruzando de derecha a izquierda,
  //    con movimiento libre (alma roja). La caja se agranda, como en la original.
  function prepararGauntlet() {
    fijarCaja(480, 140);
    corazon.x = 60; corazon.y = BOX_H / 2;
    let t = 150;
    estGauntlet = { huesos: [] };
    for (let i = 0; i < 8; i++) {
      estGauntlet.huesos.push({ apareceEn: t, alto: 35 + Math.random() * 55, techo: Math.random() < 0.5 });
      t += 360 + Math.random() * 220;
    }
  }
  function frameGauntlet(tp) {
    const vel = 0.2;
    let dano = false;
    for (const b of estGauntlet.huesos) {
      const t = tp - b.apareceEn;
      if (t < 0) continue;
      const x = BOX_W + 30 - vel * t;
      if (x < -20) continue;
      const y = b.techo ? 0 : BOX_H - b.alto;
      dibujarHueso(x, y, 18, b.alto, 1);
      if (solapa(rectCorazon(), { x, y, w: 18, h: b.alto })) dano = true;
    }
    if (dano) intentarDanio(20);
    return tp >= DUR_GAUNTLET;
  }

  // 3) Huesos naranjas: no te tenés que mover mientras estén sólidos.
  function prepararNaranja() {
    fijarCaja(300, 140);
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2;
    const lanes = 5;
    estNaranja = { lanes, laneW: BOX_W / lanes, gap: Math.floor(Math.random() * lanes), ref: null };
    elHint.textContent = "¡NO TE MUEVAS!";
  }
  function frameNaranja(tp) {
    const { lanes, laneW, gap } = estNaranja;
    let alpha = 1;
    if (tp < 250) alpha = tp / 250;
    else if (tp > DUR_NARANJA - 250) alpha = Math.max(0, (DUR_NARANJA - tp) / 250);
    const activo = tp >= 250 && tp <= DUR_NARANJA - 250;
    if (activo && !estNaranja.ref) estNaranja.ref = { x: corazon.x, y: corazon.y };
    for (let i = 0; i < lanes; i++) {
      if (i === gap) continue;
      const x = i * laneW + (laneW - 22) / 2;
      dibujarHueso(x, 8, 22, BOX_H - 16, alpha, true);
    }
    if (activo && Math.hypot(corazon.x - estNaranja.ref.x, corazon.y - estNaranja.ref.y) > 4) intentarDanio(20);
    if (tp >= DUR_NARANJA) { elHint.textContent = ""; return true; }
    return false;
  }

  // 4) Alma azul: gravedad + salto, esquivando huesos de piso. Caja agrandada.
  const AZUL_GRAVEDAD = 0.0011, AZUL_SALTO = -0.46, AZUL_VEL = 0.13;
  let azulVy = 0, AZUL_SUELO_Y = 0;
  function prepararAzul() {
    fijarCaja(480, 140);
    AZUL_SUELO_Y = BOX_H - 18;
    corazon.x = BOX_W / 2; corazon.y = AZUL_SUELO_Y; azulVy = 0;
    let t = 350;
    const huesos = [];
    for (let i = 0; i < 5; i++) { huesos.push({ apareceEn: t, h: 12 + Math.random() * 20 }); t += 800 + Math.random() * 350; }
    estGauntlet = { azulHuesos: huesos }; // reutilizo el mismo contenedor de estado
    elHint.textContent = "¡ALMA AZUL! Mantené ↑ o ESPACIO para saltar";
  }
  function moverCorazonAzul(dt) {
    if (teclasSB.w || teclasSB.arrowup || teclasSB[" "]) {
      if (corazon.y >= AZUL_SUELO_Y - 0.5) azulVy = AZUL_SALTO;
    }
    azulVy += AZUL_GRAVEDAD * dt;
    corazon.y += azulVy * dt;
    if (corazon.y > AZUL_SUELO_Y) { corazon.y = AZUL_SUELO_Y; azulVy = 0; }
  }
  function frameAzul(tp, dt) {
    moverCorazonAzul(dt);
    let dano = false;
    for (const b of estGauntlet.azulHuesos) {
      const t = tp - b.apareceEn;
      if (t < 0) continue;
      const x = BOX_W + 30 - AZUL_VEL * t;
      if (x < -20) continue;
      const y = BOX_H - 14 - b.h;
      dibujarHueso(x, y, 16, b.h, 1);
      if (solapa(rectCorazon(), { x, y, w: 16, h: b.h })) dano = true;
    }
    if (dano) intentarDanio(18);
    if (tp >= DUR_AZUL) { elHint.textContent = ""; return true; }
    return false;
  }

  // 5) Lluvia de huesos: caen desde arriba en posiciones al azar (no en carriles
  //    fijos como el ataque "abajo"). Cuantos menos HP le queden a Sans, más caen
  //    y más rápido se sigue el uno al otro.
  let estLluvia;
  function prepararLluvia() {
    fijarCaja(300, 140);
    corazon.x = BOX_W / 2; corazon.y = BOX_H / 2;
    const dif = factorDificultad();
    const cantidad = Math.round(9 * dif);
    const huesos = [];
    let t = 150;
    for (let i = 0; i < cantidad; i++) {
      huesos.push({ apareceEn: t, x: 14 + Math.random() * (BOX_W - 48), ancho: 16 + Math.random() * 12 });
      t += Math.max(90, 220 / dif) + Math.random() * 120;
    }
    estLluvia = { huesos, dur: t + 500 };
  }
  function frameLluvia(tp) {
    let dano = false;
    for (const b of estLluvia.huesos) {
      const t = tp - b.apareceEn;
      if (t < 0 || t > 620) continue;
      const y = -50 + (BOX_H + 90) * (t / 620);
      dibujarHueso(b.x, y, b.ancho, 46, 1);
      if (solapa(rectCorazon(), { x: b.x, y, w: b.ancho, h: 46 })) dano = true;
    }
    if (dano) intentarDanio(16);
    return tp >= estLluvia.dur;
  }

  // 6) Gaster blaster: carga con sonido, dispara en línea, avisa con tiempo de sobra.
  //    A partir de la mitad de la vida puede tirar 2 a la vez (como ya tenías);
  //    cerca del final tira hasta 3 o 4 juntos, apuntando cada uno para un lado.
  function prepararBlaster() {
    fijarCaja(300, 140);
    const frac = sansHP / sansHPMax;
    let cantidad = 1;
    if (frac <= 0.5 && Math.random() < 0.5) cantidad = 2;
    if (frac <= 0.2) cantidad = Math.random() < 0.5 ? 2 : 3;
    if (frac <= 0.08) cantidad = Math.random() < 0.5 ? 3 : 4;
    function nuevo(inicio) {
      const horizontal = Math.random() < 0.6;
      return horizontal
        ? { inicio, horizontal: true, banda: 25 + Math.random() * (BOX_H - 50), sonaron: false }
        : { inicio, horizontal: false, banda: 25 + Math.random() * (BOX_W - 50), sonaron: false };
    }
    const ESPACIADO = 1600;
    const lista = [];
    for (let i = 0; i < cantidad; i++) lista.push(nuevo(i * ESPACIADO));
    estBlaster = { lista, dur: (cantidad - 1) * ESPACIADO + 1700 };
    elSansImg.src = "/Battle/sans_fists.png";
  }
  function frameBlaster(tp) {
    let dano = false;
    for (const b of estBlaster.lista) {
      const t = tp - b.inicio;
      if (t < 0 || t > 1200) continue;
      if (!b.sonaron) { sonido("/Battle/gasterintro.wav", 0.4); b.sonaron = true; }
      const rectHaz = b.horizontal ? { x: 0, y: b.banda - 13, w: BOX_W, h: 26 } : { x: b.banda - 13, y: 0, w: 26, h: BOX_H };
      if (t < 750) {
        const frame = Math.min(5, Math.floor(t / 125));
        const img = imgs.blaster[frame];
        if (img.complete) {
          cx.save();
          if (b.horizontal) cx.translate(-6, b.banda - 20);
          else { cx.translate(b.banda - 20, -6); cx.rotate(Math.PI / 2); cx.translate(0, -40); }
          cx.drawImage(img, 0, 0, 40, 40);
          cx.restore();
        }
      } else if (t < 1000) {
        if (t - 750 < 20) sonido("/Battle/gasterfire.wav", 0.5);
        cx.save(); cx.globalAlpha = 0.95;
        if (b.horizontal) cx.drawImage(imgs.beam, 0, b.banda - 13, BOX_W, 26);
        else { cx.translate(b.banda, BOX_H / 2); cx.rotate(Math.PI / 2); cx.drawImage(imgs.beam, -BOX_H / 2, -13, BOX_H, 26); }
        cx.restore();
        if (solapa(rectCorazon(), rectHaz)) dano = true;
      } else {
        cx.save(); cx.globalAlpha = Math.max(0, 1 - (t - 1000) / 200);
        if (b.horizontal) cx.drawImage(imgs.beam, 0, b.banda - 13, BOX_W, 26);
        else { cx.translate(b.banda, BOX_H / 2); cx.rotate(Math.PI / 2); cx.drawImage(imgs.beam, -BOX_H / 2, -13, BOX_H, 26); }
        cx.restore();
      }
    }
    if (dano) intentarDanio(28);
    if (tp >= estBlaster.dur) { elSansImg.src = "/Battle/sans_idle.gif"; return true; }
    return false;
  }

  let ataqueActivo = null, ataqueInicio = 0;
  function iniciarAtaque() {
    fase = "ataque";
    rondaCount++;
    const opciones = ["abajo", "gauntlet", "naranja", "azul", "lluvia"];
    if (sansHP <= sansHPMax * 0.5) opciones.push("blaster", "blaster");
    if (sansHP <= sansHPMax * 0.35) opciones.push("lluvia", "lluvia");
    ataqueActivo = alAzar(opciones);
    elHint.textContent = "";
    if (ataqueActivo === "abajo") prepararAbajo();
    else if (ataqueActivo === "gauntlet") prepararGauntlet();
    else if (ataqueActivo === "naranja") prepararNaranja();
    else if (ataqueActivo === "azul") prepararAzul();
    else if (ataqueActivo === "lluvia") prepararLluvia();
    else if (ataqueActivo === "blaster") prepararBlaster();
    ataqueInicio = tGlobal;
  }
  function finAtaque() {
    // fase deja de ser "ataque" ACÁ, antes de que arranque el diálogo.
    // Si no, dibujar() sigue llamando a actualizarYdibujarAtaque() en cada
    // frame (60/seg), que vuelve a ver "terminado=true" y llama a finAtaque()
    // de nuevo, cortando el mostrarDialogo() a la mitad una y otra vez. Eso
    // era el bug: pantalla trabada "en modo ataque" sin dejar ni pelear ni
    // rendirse, hasta que por azar el diálogo lograba completarse una vez.
    fase = "resolviendo";
    if (rondaCount % 3 === 0) mostrarDialogo(alAzar(LINEAS_MEDIO), irAMenu);
    else irAMenu();
  }
  function actualizarYdibujarAtaque(tp, dt) {
    let terminado = false;
    if (ataqueActivo === "abajo") terminado = frameAbajo(tp);
    else if (ataqueActivo === "gauntlet") terminado = frameGauntlet(tp);
    else if (ataqueActivo === "naranja") terminado = frameNaranja(tp);
    else if (ataqueActivo === "azul") terminado = frameAzul(tp, dt);
    else if (ataqueActivo === "lluvia") terminado = frameLluvia(tp);
    else if (ataqueActivo === "blaster") terminado = frameBlaster(tp);
    if (terminado) finAtaque();
  }

  // ---------- corazón: input y movimiento (modo normal; el azul tiene el suyo) ----------
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
    const vel = 0.15 * dt;
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
  function dibujar(dt) {
    cx.clearRect(0, 0, BOX_W, BOX_H);
    cx.fillStyle = "#000"; cx.fillRect(0, 0, BOX_W, BOX_H);
    if (fase === "ataque") actualizarYdibujarAtaque(tGlobal - ataqueInicio, dt);
    cx.strokeStyle = "#fff"; cx.lineWidth = 4;
    cx.strokeRect(2, 2, BOX_W - 4, BOX_H - 4);
    if (fase === "ataque") {
      const esAzul = ataqueActivo === "azul";
      const img = esAzul ? imgs.corazonAzul : imgs.corazonRoja;
      const parpadea = tGlobal < invulnerableHasta && Math.floor(tGlobal / 100) % 2 === 0;
      if (img.complete && !parpadea) cx.drawImage(img, corazon.x - 10, corazon.y - 10, 20, 20);
    }
  }
  function loopBatalla(ts) {
    if (!activa) return;
    const dt = ts - tGlobal; tGlobal = ts;
    if (fase === "fightbar") actualizarBarraFight(ts);
    if (fase === "ataque" && ataqueActivo !== "azul") moverCorazon(dt);
    dibujar(dt);
    requestAnimationFrame(loopBatalla);
  }

  window.SansFight = { iniciar, get activa() { return activa; } };
})();
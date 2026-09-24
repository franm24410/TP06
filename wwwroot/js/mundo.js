// mundo.js — cosas del mapa: mochila (ENTER), tiendas TI1/TI2 (E), hielo + caída,
// botones INT1-3 y encuentros aleatorios con monstruos.
// Usa las globales de MapRender.js y site.js (mapData, player, camera, ESTADO, ...)
// y la configuración de mundoConfig.js.

(function () {
  "use strict";
  const SND = "/Battle/Enemigos/snd/";
  function sonido(n, vol) { try { const a = new Audio(SND + n + ".ogg"); a.volume = vol ?? 0.5; a.play().catch(() => { }); } catch (e) { } }
  const J = () => window.Jugador;
  // (las const de mundoConfig.js no son propiedades de window: se leen directo)
  const PASOS = typeof ENCUENTROS_PASOS !== "undefined" ? ENCUENTROS_PASOS : { min: 50, max: 100 };
  const MAPAS = typeof ENCUENTROS_MAPAS !== "undefined" ? ENCUENTROS_MAPAS : {};
  const TIENDAS_ = typeof TIENDAS !== "undefined" ? TIENDAS : { TI1: "galletitaChica", TI2: "galletitaGrande" };
  const DESTINO_CAIDA = typeof CAIDA_DESTINO !== "undefined" ? CAIDA_DESTINO : "29";
  const INTS = typeof BOTONES_INT !== "undefined" ? BOTONES_INT : ["INT1", "INT2", "INT3"];

  // =====================================================================
  // Objetos del mapa por nombre (se recalculan al cambiar de mapa)
  // =====================================================================
  let mapaCache = null, hielos = [], caidas = [], tiendas = [], ints = [];
  function refrescar() {
    if (typeof mapData === "undefined" || !mapData || mapaCache === mapData) return;
    mapaCache = mapData;
    hielos = []; caidas = []; tiendas = []; ints = [];
    for (const l of mapData.layers) {
      if (l.type !== "objectgroup") continue;
      for (const o of (l.objects || [])) {
        const n = (o.name || "").trim();
        if (/^hielo$/i.test(n)) hielos.push(o);
        else if (/^caida$/i.test(n)) caidas.push(o);
        else if (TIENDAS_[n.toUpperCase()]) tiendas.push(o);
        else if (INTS.includes(n.toUpperCase())) ints.push(o);
      }
    }
    hielo = null;
  }
  const inflar = (p, m) => ({ x: p.x - m, y: p.y - m, width: p.width + 2 * m, height: p.height + 2 * m });
  const sobre = (p, lista) => lista.some(o => rectsOverlap(p, o));

  // =====================================================================
  // Hielo: te deslizás en la dirección en que arrancaste hasta chocar
  // una pared, salir del hielo o caerte en un "caida".
  // =====================================================================
  let hielo = null;       // {dx, dy, t} mientras te deslizás
  const GRACIA_DIAGONAL = 5; // cuadros al arrancar en los que se puede sumar la otra tecla (diagonal)
  // Mueve y devuelve true si chocó contra una pared en alguno de los ejes del deslizamiento
  function deslizar(p) {
    const bx = p.x, by = p.y;
    moveWithWallCollision(p, hielo.dx, hielo.dy);
    return (hielo.dx !== 0 && p.x === bx) || (hielo.dy !== 0 && p.y === by);
  }
  function moverJugador(p, dx, dy, vel) {
    refrescar();
    if (hielo) {
      if (!sobre(p, hielos)) { hielo = null; }
      else {
        // al arrancar, si apretás la otra flecha enseguida, el deslizamiento pasa a ser diagonal
        hielo.t++;
        if (hielo.t <= GRACIA_DIAGONAL) {
          if (!hielo.dx && dx) hielo.dx = Math.sign(dx) * vel;
          if (!hielo.dy && dy) hielo.dy = Math.sign(dy) * vel;
        }
        if (deslizar(p)) hielo = null;                        // chocó contra una pared
        else if (!sobre(p, hielos)) hielo = null;             // salió del hielo
        return;
      }
    }
    if (hielos.length && (dx || dy) && sobre(p, hielos)) {
      // arranca a deslizarse en la dirección que venías (recta o diagonal)
      hielo = { dx: Math.sign(dx) * vel, dy: Math.sign(dy) * vel, t: 0 };
      if (deslizar(p)) hielo = null;
      return;
    }
    moveWithWallCollision(p, dx, dy);
  }
  function checkCaida(p) {
    refrescar();
    if (!caidas.length || isTransitioning()) return false;
    if (!sobre(p, caidas)) return false;
    hielo = null;
    frenar();
    // mismo fundido que las puertas, a la hitbox "29" del mismo mapa
    startDoorTransition(p, { targetMap: currentMapName, spawnSquareName: DESTINO_CAIDA, duracion: 400 });
    return true;
  }

  // =====================================================================
  // Botones INT1-3 (desactivan los PIN5, ver piConfig.js)
  // =====================================================================
  function estadoINT() { if (!ESTADO.botonesINT) ESTADO.botonesINT = {}; return ESTADO.botonesINT; }
  function botonesINTCompletos() { const e = (typeof ESTADO !== "undefined" && ESTADO.botonesINT) || {}; return INTS.every(n => e[n]); }
  // Se aprietan con E estando al lado del botón (ver el keydown de más abajo).
  function checkBotonesINT(p) { refrescar(); }        // (site.js lo llama en cada paso; ya no hace nada solo)
  function intCerca(p) {
    refrescar();
    const r = inflar(p, 8);
    return ints.find(o => rectsOverlap(r, o)) || null;
  }
  function apretarINT(o) {
    const est = estadoINT();
    const n = o.name.trim().toUpperCase();
    if (est[n]) { abrirSign("* El botón ya está apretado."); return; }
    est[n] = true;
    const hechos = INTS.filter(x => est[x]).length;
    if (window.Musica) Musica.sfx(hechos >= INTS.length ? "pinchos" : "boton");
    else sonido("snd_bell", 0.4);
    if (hechos >= INTS.length) abrirSign("* Apretaste el botón. (" + hechos + "/" + INTS.length + ")\n* Se escuchó un clic a lo lejos...\n* ¡Los pinchos se bajaron!");
    else abrirSign("* Apretaste el botón. (" + hechos + "/" + INTS.length + ")");
  }

  // =====================================================================
  // Encuentros aleatorios
  // =====================================================================
  let pasos = 0, objetivo = nuevoObjetivo();
  function nuevoObjetivo() { return PASOS.min + Math.floor(Math.random() * (PASOS.max - PASOS.min + 1)); }
  function paso() {
    if (window.MODO_TUTORIAL || !window.EnemyFight || hielo) return;
    if (window.MODO_FANTASMA) return;                  // [PRUEBAS] en modo fantasma (H) no salen monstruos
    const lista = MAPAS[currentMapName];
    if (!lista || !lista.length) return;
    pasos++;
    if (pasos < objetivo) return;
    pasos = 0; objetivo = nuevoObjetivo();
    const id = lista[Math.floor(Math.random() * lista.length)];
    frenar();
    // foto del mapa para la animación de entrada (el "!" sobre el jugador)
    const foto = document.createElement("canvas");
    foto.width = canvas.width; foto.height = canvas.height;
    foto.getContext("2d").drawImage(canvas, 0, 0);
    window.EnemyFight.iniciar(player, id, {
      x: player.x - camera.x + player.width / 2,
      y: player.y - camera.y + player.height / 2,
      captura: foto
    });
  }

  // =====================================================================
  // Interfaz: mochila y tienda (cajas estilo Undertale)
  // =====================================================================
  const ALMA = '<svg class="mg-alma" viewBox="0 0 16 16" aria-hidden="true"><path d="M2 0h2v1h-2zM12 0h2v1h-2zM1 1h5v1h-5zM10 1h5v1h-5zM0 2h7v2h-7zM9 2h7v2h-7zM0 4h16v6h-16zM2 10h12v2h-12zM4 12h8v2h-8zM6 14h4v2h-4z"/></svg>';
  const raiz = document.createElement("div");
  raiz.className = "mundo-gui";
  document.body.appendChild(raiz);
  let gui = null;          // {tipo:"mochila"|"tienda"|"mensaje", sel, ...}

  function esc(s) { return String(s).replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])).replace(/\n/g, "<br>"); }
  function render() {
    if (!gui) { raiz.classList.remove("abierta"); raiz.innerHTML = ""; return; }
    raiz.classList.add("abierta");
    const s = J().stats();
    if (gui.tipo === "mochila") {
      const items = s.mochila.map((id, i) => `<div class="mg-op ${i === gui.sel ? "sel" : ""}">${ALMA}<span>* ${esc(J().ITEMS[id].nombre)}</span></div>`).join("");
      raiz.innerHTML = `
        <div class="mg-fila">
          <div class="mg-caja mg-stats">
            <div class="mg-nombre">${esc(J().nombre())}</div>
            <div>LV ${s.lv}</div>
            <div>HP ${s.hp}/${J().maxHP()}</div>
            <div>G&nbsp; ${s.oro}</div>
          </div>
          <div class="mg-caja mg-items">
            <div class="mg-titulo">MOCHILA</div>
            ${items || '<div class="mg-vacio">(La mochila está vacía)</div>'}
          </div>
        </div>
        <div class="mg-ayuda">[FLECHAS] elegir · [Z / ENTER] comer · [X] cerrar</div>`;
    } else if (gui.tipo === "tienda") {
      const it = J().ITEMS[gui.item];
      raiz.innerHTML = `
        <div class="mg-caja mg-dialogo">
          <div>* ¿Querés comprar una ${esc(it.nombre.toLowerCase())}?</div>
          <div class="mg-sub">(Cura ${it.cura} HP · Cuesta ${it.precio} G · Tenés ${s.oro} G)</div>
          <div class="mg-sino">
            <div class="mg-op ${gui.sel === 0 ? "sel" : ""}">${ALMA}<span>Sí</span></div>
            <div class="mg-op ${gui.sel === 1 ? "sel" : ""}">${ALMA}<span>No</span></div>
          </div>
        </div>`;
    } else if (gui.tipo === "mensaje") {
      raiz.innerHTML = `<div class="mg-caja mg-dialogo"><div>${esc(gui.texto)}</div></div>`;
    }
  }
  function abrir(g) { gui = g; frenar(); render(); }
  function cerrar() { gui = null; render(); }
  function mensaje(t) { gui = { tipo: "mensaje", texto: t }; render(); }

  function abrirMochila() { sonido("snd_select", 0.4); abrir({ tipo: "mochila", sel: 0 }); }
  function abrirTienda(item) { abrir({ tipo: "tienda", item, sel: 0 }); }
  function tiendaCerca(p) {
    refrescar();
    const r = inflar(p, 8);
    for (const o of tiendas) if (rectsOverlap(r, o)) return TIENDAS_[o.name.trim().toUpperCase()];
    return null;
  }
  function comprar(item) {
    const it = J().ITEMS[item];
    if (J().mochilaLlena()) return mensaje("* No te entra nada más en la mochila.");
    if (!J().gastarOro(it.precio)) return mensaje("* No tenés suficiente oro.\n* (Te faltan " + (it.precio - J().stats().oro) + " G)");
    J().agregarItem(item);
    sonido("snd_buyitem");
    mensaje("* Compraste una " + it.nombre.toLowerCase() + ".\n* La guardaste en la mochila.");
  }

  const T = { up: ["arrowup", "w"], down: ["arrowdown", "s"], left: ["arrowleft", "a"], right: ["arrowright", "d"], ok: ["enter", "z", "e", " "], no: ["x", "shift", "escape", "c"] };
  const es = (k, g) => T[g].includes(k);
  window.addEventListener("keydown", (e) => {
    if ((window.EnemyFight && window.EnemyFight.activa) || (window.SansFight && window.SansFight.activa)) return;
    if (window.Guardias && window.Guardias.activo) return;     // escena de la Guardia Real
    const k = e.key.toLowerCase();
    if (gui) {
      e.preventDefault(); e.stopPropagation();
      if (e.repeat) return;
      if (gui.tipo === "mensaje") { if (es(k, "ok") || es(k, "no")) cerrar(); return; }
      if (gui.tipo === "mochila") {
        const n = J().stats().mochila.length;
        if (es(k, "no")) { cerrar(); return; }
        if (!n) { if (es(k, "ok")) cerrar(); return; }
        if (es(k, "up")) { gui.sel = (gui.sel + n - 1) % n; sonido("snd_squeak", 0.3); }
        else if (es(k, "down")) { gui.sel = (gui.sel + 1) % n; sonido("snd_squeak", 0.3); }
        else if (es(k, "ok")) { const t = J().usarItem(gui.sel); sonido("snd_heal_c"); mensaje(t); return; }
        render(); return;
      }
      if (gui.tipo === "tienda") {
        if (es(k, "no")) { cerrar(); return; }
        if (es(k, "left") || es(k, "right") || es(k, "up") || es(k, "down")) { gui.sel = 1 - gui.sel; sonido("snd_squeak", 0.3); render(); return; }
        if (es(k, "ok")) { if (gui.sel === 0) comprar(gui.item); else cerrar(); }
        return;
      }
      return;
    }
    if (e.repeat) return;
    if (signAbierta || saveAbierta || isTransitioning() || typeof player === "undefined") return;
    if (k === "enter") { e.preventDefault(); e.stopPropagation(); abrirMochila(); return; }
    if (k === "e") {
      const item = tiendaCerca(player);
      if (item) { e.preventDefault(); e.stopPropagation(); abrirTienda(item); return; }
      const boton = intCerca(player);
      if (boton) { e.preventDefault(); e.stopPropagation(); apretarINT(boton); }
    }
  }, true);

  window.Mundo = {
    moverJugador, checkCaida, checkBotonesINT, botonesINTCompletos, paso,
    get deslizando() { return !!hielo; },
    get guiAbierta() { return !!gui; }
  };
})();

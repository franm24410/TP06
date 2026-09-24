// musica.js — música de ambiente del mapa y efectos de sonido
//
// - Cada mapa tiene su tema (se configura en mundoConfig.js: MUSICA_MAPAS).
// - Durante las peleas y la escena de la Guardia Real la música se pausa y
//   después sigue donde estaba.
// - Musica.sfx("empujar" | "placa" | "boton" | "pinchos") para los efectos.
//
// Los navegadores no dejan reproducir sonido hasta que el usuario toca una
// tecla o hace clic: la música arranca sola con la primera tecla.

(function () {
  "use strict";
  const BASE = "/Audio/";
  const VOLUMEN = 0.35;
  const mapas = typeof MUSICA_MAPAS !== "undefined" ? MUSICA_MAPAS : {};

  let actual = null, pista = null, desbloqueado = false;

  function pistaDe(mapa) { return mapas[mapa] !== undefined ? mapas[mapa] : (mapas["*"] || null); }

  function fundir(a, desde, hasta, ms, alFinal) {
    const pasos = 12; let i = 0;
    a.volume = desde;
    const id = setInterval(() => {
      i++;
      a.volume = Math.max(0, Math.min(1, desde + (hasta - desde) * i / pasos));
      if (i >= pasos) { clearInterval(id); if (alFinal) alFinal(); }
    }, ms / pasos);
  }
  // arranca un tema con fundido (sin pedir play() dos veces mientras carga)
  function arrancar(a) {
    if (!a || a._arrancando || !a.paused) return;
    a._arrancando = true; a.volume = 0;
    a.play().then(() => { a._arrancando = false; if (a === actual) fundir(a, 0, VOLUMEN, 600); })
      .catch(() => { a._arrancando = false; });
  }
  function poner(nombre) {
    if (nombre === pista) return;
    pista = nombre;
    const vieja = actual; actual = null;
    if (vieja) fundir(vieja, vieja.volume, 0, 400, () => vieja.pause());
    if (!nombre) return;
    const a = new Audio(BASE + nombre + ".ogg");
    a.loop = true; a.volume = 0;
    actual = a;
    if (desbloqueado && !enPausa()) arrancar(a);
  }
  // peleas y escenas: la música del mapa se calla
  function enPausa() {
    return !!((window.EnemyFight && window.EnemyFight.activa) || (window.SansFight && window.SansFight.activa) ||
      (window.Guardias && window.Guardias.activo));
  }
  // site.js lo llama en cada cuadro
  function tick() {
    if (typeof currentMapName !== "undefined" && currentMapName) {
      const p = pistaDe(currentMapName);
      if (p !== pista) poner(p);
    }
    if (!actual || !desbloqueado) return;
    if (enPausa()) { if (!actual.paused) actual.pause(); }
    else arrancar(actual);
  }
  function desbloquear() {
    if (desbloqueado) return;
    desbloqueado = true;
    if (actual && !enPausa()) arrancar(actual);
  }
  window.addEventListener("keydown", desbloquear, true);
  window.addEventListener("pointerdown", desbloquear, true);

  // efectos de sonido (sacados de Undertale)
  const SFX = { empujar: 0.5, placa: 0.6, boton: 0.6, pinchos: 0.6 };
  function sfx(n) {
    if (!SFX[n]) return;
    try { const a = new Audio(BASE + "sfx/" + n + ".ogg"); a.volume = SFX[n]; a.play().catch(() => { }); } catch (e) { }
  }

  window.Musica = { tick, sfx, poner };
})();

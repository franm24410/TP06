// creditos.js — créditos finales estilo Undertale (se muestran al pasar la puerta ph43)
//
// - site.js llama a window.Creditos.iniciar(alTerminar) cuando tocás ph43.
// - Pantalla negra, el texto sube despacio y al final aparece "FIN".
// - Mantener X / SHIFT los acelera. Al terminar, Z / ENTER (o esperar) te lleva al menú.
// - La música la cambia musica.js mientras Creditos.activo es true.

(function () {
  "use strict";

  const NOMBRES = ["Dante Bruschetti", "Fransisco Martinez"];
  // [título, nombres]; si no tiene nombres, es un título suelto
  const SECCIONES = [
    ["SUBTERRA", null],
    ["Dirección", NOMBRES],
    ["Guion", NOMBRES],
    ["Programación", NOMBRES],
    ["Diseño de niveles", NOMBRES],
    ["Mapas y tiles", NOMBRES],
    ["Puzzles de piedras", NOMBRES],
    ["Pinchos (y sus arreglos)", NOMBRES],
    ["Batallas", NOMBRES],
    ["Pelea contra Sans", NOMBRES],
    ["Guardia Real", NOMBRES],
    ["Undyne la Inmortal", NOMBRES],
    ["Monstruos", NOMBRES],
    ["Carteles del tutorial", NOMBRES],
    ["Base de datos", NOMBRES],
    ["Música y sonido", NOMBRES],
    ["Testeo", NOMBRES],
    ["Encontrar bugs", NOMBRES],
    ["Arreglar bugs", NOMBRES],
    ["Crear bugs nuevos", NOMBRES],
    ["Catering", NOMBRES],
    ["Agradecimientos especiales", NOMBRES],
    ["Y vos", ["Gracias por jugar."]]
  ];
  const VELOCIDAD = 45;          // px por segundo (x4 con X / SHIFT)
  const ESPERA_FIN = 6;          // segundos que queda "FIN" antes de volver solo al menú

  let activo = false, rapido = false, listoParaSalir = false;
  let div = null, rollo = null, fin = null, alTerminar = null;

  function estilos() {
    if (document.getElementById("creditosCss")) return;
    const st = document.createElement("style");
    st.id = "creditosCss";
    st.textContent = `
      #creditos { position:fixed; inset:0; z-index:1000; background:#000; overflow:hidden; opacity:0; transition:opacity 1s;
                  font-family:"8bitoperator",monospace; color:#fff; text-align:center; -webkit-font-smoothing:none; }
      #creditos.visible { opacity:1; }
      #creditos .rollo { position:absolute; left:0; right:0; top:0; will-change:transform; }
      #creditos .sec { margin-bottom:90px; }
      #creditos .tit { color:#ffff00; font-size:26px; margin-bottom:14px; }
      #creditos .tit.grande { font-size:56px; color:#fff; letter-spacing:4px; }
      #creditos .nom { font-size:32px; line-height:1.4; }
      #creditos .fin { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center;
                       opacity:0; transition:opacity 2s; pointer-events:none; }
      #creditos .fin.visible { opacity:1; }
      #creditos .fin .grande { font-size:72px; letter-spacing:8px; }
      #creditos .fin .chico { font-size:18px; color:#888; margin-top:30px; }`;
    document.head.appendChild(st);
  }

  function armar() {
    estilos();
    div = document.createElement("div");
    div.id = "creditos";
    rollo = document.createElement("div");
    rollo.className = "rollo";
    for (const [titulo, nombres] of SECCIONES) {
      const sec = document.createElement("div");
      sec.className = "sec";
      const t = document.createElement("div");
      t.className = "tit" + (nombres ? "" : " grande");
      t.textContent = titulo;
      sec.appendChild(t);
      for (const n of (nombres || [])) {
        const d = document.createElement("div");
        d.className = "nom"; d.textContent = n;
        sec.appendChild(d);
      }
      rollo.appendChild(sec);
    }
    fin = document.createElement("div");
    fin.className = "fin";
    fin.innerHTML = '<div class="grande">FIN</div><div class="chico">Z / ENTER para volver al menú</div>';
    div.appendChild(rollo);
    div.appendChild(fin);
    document.body.appendChild(div);
  }

  function teclaAbajo(e) {
    if (!activo) return;
    const k = e.key.toLowerCase();
    if (k === "x" || k === "shift") rapido = true;
    if (listoParaSalir && (k === "z" || k === "enter" || k === " ")) salir();
    e.preventDefault(); e.stopPropagation();
  }
  function teclaArriba(e) {
    const k = e.key.toLowerCase();
    if (k === "x" || k === "shift") rapido = false;
  }

  function salir() {
    if (!listoParaSalir) return;
    listoParaSalir = false;
    div.classList.remove("visible");
    setTimeout(() => { if (alTerminar) alTerminar(); }, 1000);
  }

  function iniciar(cb) {
    if (activo) return;
    activo = true; alTerminar = cb;
    armar();
    window.addEventListener("keydown", teclaAbajo, true);
    window.addEventListener("keyup", teclaArriba, true);
    requestAnimationFrame(() => div.classList.add("visible"));

    // el rollo arranca abajo de la pantalla y sube hasta salir por arriba
    let y = window.innerHeight, prev = 0;
    function paso(ts) {
      const dt = prev ? Math.min(0.1, (ts - prev) / 1000) : 0;
      prev = ts;
      y -= VELOCIDAD * (rapido ? 4 : 1) * dt;
      rollo.style.transform = "translateY(" + Math.round(y) + "px)";
      if (y + rollo.offsetHeight > 0) { requestAnimationFrame(paso); return; }
      fin.classList.add("visible");
      listoParaSalir = true;
      setTimeout(salir, ESPERA_FIN * 1000);
    }
    requestAnimationFrame(paso);
  }

  window.Creditos = { iniciar, get activo() { return activo; } };
})();

// menuAlma.js — cursor con el alma roja para los menús (estilo Undertale).
// Uso: menuAlma(contenedor, { teclado: true })
//  - Las opciones son los elementos ".opcion" dentro del contenedor.
//  - Flechas / WASD mueven el alma, Z / ENTER / ESPACIO eligen (si teclado = true).
//  - Con el mouse: pasar por encima mueve el alma, clic elige.
(function () {
  const SND = "/Battle/SansFight/snd/";
  function sonido(nombre) {
    try { const a = new Audio(SND + nombre + ".ogg"); a.volume = 0.5; a.play().catch(() => { }); } catch (e) { }
  }

  window.menuAlma = function (contenedor, opciones) {
    opciones = opciones || {};
    const items = Array.from(contenedor.querySelectorAll(".opcion"));
    if (!items.length) return;
    let sel = Math.max(0, items.findIndex(i => i.classList.contains("sel")));
    let eligiendo = false;

    function marcar(i, conSonido) {
      if (i === sel && items[i].classList.contains("sel")) return;
      items.forEach(x => x.classList.remove("sel"));
      sel = (i + items.length) % items.length;
      items[sel].classList.add("sel");
      if (conSonido) sonido("MenuCursor");
    }
    function elegir(i) {
      if (eligiendo) return;
      const el = items[i];
      sonido("MenuSelect");
      if (el.tagName === "A" && el.href) {
        eligiendo = true;
        setTimeout(() => { window.location.href = el.href; }, 180);  // que se escuche el "select"
      } else el.click();
    }

    marcar(sel, false);
    items.forEach((el, i) => {
      el.addEventListener("mouseenter", () => marcar(i, true));
      el.addEventListener("focus", () => marcar(i, false));
      if (el.tagName === "A") el.addEventListener("click", (e) => { e.preventDefault(); marcar(i, false); elegir(i); });
    });

    if (opciones.teclado) {
      document.addEventListener("keydown", (e) => {
        const k = e.key.toLowerCase();
        if (["arrowup", "w", "arrowleft", "a"].includes(k)) { marcar(sel - 1, true); e.preventDefault(); }
        else if (["arrowdown", "s", "arrowright", "d"].includes(k)) { marcar(sel + 1, true); e.preventDefault(); }
        else if (["z", "enter", " "].includes(k)) { elegir(sel); e.preventDefault(); }
      });
    }
  };
})();

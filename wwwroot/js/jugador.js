// jugador.js — stats del jugador (LV, HP, oro, mochila) guardadas en ESTADO.stats
//
// - LV: para pasar del nivel N al N+1 hay que vencer N monstruos
//   (LV1 -> 1 monstruo, LV2 -> 2 monstruos, LV3 -> 3 monstruos, ...). Máximo LV 20.
// - HP máximo, ATAQUE y DEFENSA con las fórmulas de Undertale:
//     HP máx = 16 + 4·LV   (LV1 = 20 ... LV19 = 92)
//     AT     = 8 + 2·LV
//     DF     = 9 + techo(LV/4)
// - Mochila: solo comida, hasta 8 ítems (como en Undertale).
// Todo vive en ESTADO.stats, así que se guarda con el resto de la partida (GUA).

(function () {
  const LV_MAX = 20;
  const MOCHILA_MAX = 8;

  // Comida que existe en el juego. id -> datos
  const ITEMS = {
    galletitaChica:  { nombre: "Galletita de araña pequeña", corto: "Galletita P.", cura: 20, precio: 30 },
    galletitaGrande: { nombre: "Galletita de araña grande",  corto: "Galletita G.", cura: 45, precio: 45 }
  };

  function estado() {
    // ESTADO lo declara site.js; en páginas sin site.js se usa uno local.
    if (typeof ESTADO !== "undefined") return ESTADO;
    return (window.__ESTADO_LOCAL = window.__ESTADO_LOCAL || {});
  }
  function stats() {
    const e = estado();
    if (!e.stats) e.stats = {};
    const s = e.stats;
    if (!(s.lv >= 1)) s.lv = 1;
    if (!(s.progreso >= 0)) s.progreso = 0;
    if (!(s.oro >= 0)) s.oro = 0;
    if (!Array.isArray(s.mochila)) s.mochila = [];
    s.mochila = s.mochila.filter(id => ITEMS[id]);
    if (typeof s.hp !== "number" || isNaN(s.hp)) s.hp = maxHP(s.lv);
    if (s.hp > maxHP(s.lv)) s.hp = maxHP(s.lv);
    return s;
  }
  function maxHP(lv) { return 16 + 4 * (lv ?? stats().lv); }
  function at(lv) { return 8 + 2 * (lv ?? stats().lv); }
  function df(lv) { return 9 + Math.ceil((lv ?? stats().lv) / 4); }

  function nombre() {
    const n = (window.NOMBRE_JUGADOR || "").trim();
    return (n || "Chara").slice(0, 8);
  }

  // Cura hasta el máximo. Devuelve cuánto curó de verdad.
  function curar(n) {
    const s = stats();
    const antes = s.hp;
    s.hp = Math.min(maxHP(), s.hp + n);
    return s.hp - antes;
  }
  function danar(n) { const s = stats(); s.hp = Math.max(0, s.hp - n); return s.hp; }
  function curarTodo() { const s = stats(); s.hp = maxHP(); }

  function darOro(n) { stats().oro += n; }
  function gastarOro(n) {
    const s = stats();
    if (s.oro < n) return false;
    s.oro -= n; return true;
  }

  // Suma un monstruo vencido. Devuelve cuántos niveles subió (0 si ninguno).
  function sumarMonstruo() {
    const s = stats();
    const lvAntes = s.lv;
    s.progreso++;
    while (s.lv < LV_MAX && s.progreso >= s.lv) {
      s.progreso -= s.lv;
      s.lv++;
      s.hp += 4;                       // como en Undertale: al subir, el HP sube lo mismo que el máximo
    }
    if (s.lv >= LV_MAX) s.progreso = 0;
    s.hp = Math.min(s.hp, maxHP());
    return s.lv - lvAntes;
  }
  // Fuerza un nivel (lo usa la pelea de Sans para subirte a 19).
  function subirA(lv) {
    const s = stats();
    if (s.lv >= lv) return false;
    s.lv = Math.min(LV_MAX, lv);
    s.progreso = 0;
    s.hp = maxHP();
    return true;
  }

  function mochilaLlena() { return stats().mochila.length >= MOCHILA_MAX; }
  function agregarItem(id) {
    if (!ITEMS[id] || mochilaLlena()) return false;
    stats().mochila.push(id);
    return true;
  }
  // Usa (come) el ítem en la posición i. Devuelve el texto para mostrar, o null.
  function usarItem(i) {
    const s = stats();
    const id = s.mochila[i];
    const it = ITEMS[id];
    if (!it) return null;
    s.mochila.splice(i, 1);
    const curo = curar(it.cura);
    const lleno = s.hp >= maxHP();
    return "* Te comiste la " + it.nombre.toLowerCase() + ".\n* " +
      (lleno ? "¡Tu HP está al máximo!" : "¡Recuperaste " + curo + " HP!");
  }

  window.Jugador = {
    ITEMS, LV_MAX, MOCHILA_MAX,
    stats, maxHP, at, df, nombre,
    curar, danar, curarTodo, darOro, gastarOro,
    sumarMonstruo, subirA,
    mochilaLlena, agregarItem, usarItem
  };
})();

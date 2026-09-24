// mundoConfig.js — configuración de las cosas del mapa (lo usa mundo.js)

// ---------- Encuentros aleatorios ----------
// Cada cuántos pasos aparece un monstruo (un número al azar entre min y max).
const ENCUENTROS_PASOS = { min: 50, max: 100 };

// Qué monstruos aparecen en cada mapa. Si un mapa no está, ahí no hay peleas.
// Monstruos disponibles: froggit, whimsun, moldsmal, loox, vegetoid, snowdrake, icecap
const RUINAS = ["froggit", "whimsun", "moldsmal", "loox", "vegetoid"];
const NIEVE = ["snowdrake", "icecap"];
const ENCUENTROS_MAPAS = {
  // H1 es la sala de Sans, H20 el puzzle final y H21 el tutorial: sin peleas
  H2: RUINAS, H3: RUINAS, H4: RUINAS, H5: RUINAS, H6: RUINAS, H7: RUINAS, H8: RUINAS,
  H9: RUINAS, H10: RUINAS, H11: RUINAS, H12: RUINAS, H13: RUINAS,
  H14: NIEVE, H15: NIEVE, H16: NIEVE, H17: NIEVE, H18: NIEVE, H19: NIEVE
};

// ---------- Música de ambiente (ver musica.js) ----------
// mapa -> tema (archivo en wwwroot/Audio, sin el .ogg). "*" = el resto. null = silencio.
// Temas: mus_ruins (Ruinas), mus_snowy (Snowdin), mus_house1 ("Home"), mus_menu0 (menú)
const MUSICA_MAPAS = {
  "*": "mus_ruins",
  H14: "mus_snowy", H15: "mus_snowy", H16: "mus_snowy", H17: "mus_snowy", H18: "mus_snowy", H19: "mus_snowy", H20: "mus_snowy",
  H23: "mus_house1"                          // Salón del Juicio
};

// ---------- Tiendas (tocá E al lado de la hitbox) ----------
// hitbox -> id del ítem (los ítems están en jugador.js)
const TIENDAS = {
  TI1: "galletitaChica",    // galletita de araña pequeña: cura 20, cuesta 30
  TI2: "galletitaGrande"    // galletita de araña grande:  cura 45, cuesta 45
};

// ---------- Hielo ----------
// Al pisar "Hielo" te deslizás hasta chocar una pared o salir del hielo.
// Si tocás "caida" te caés y aparecés en la hitbox CAIDA_DESTINO.
const CAIDA_DESTINO = "29";

// ---------- Botones INT ----------
// Hay que tocar INT1, INT2 e INT3 para que se bajen los pinchos PIN5
// (la lista de pinchos está en piConfig.js: SPIKE_POR_BOTONES_INT).
const BOTONES_INT = ["INT1", "INT2", "INT3"];

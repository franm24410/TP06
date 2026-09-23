// ========================================
// CONFIGURACIÓN DE LOS OBJETOS PIx
// ========================================

// 🔧 CAMBIÁ esto por el nombre real de tu png (el que contiene el cuadradito)
const PI_IMAGEN = "/Tiles/bg_tundratiles.png";

// Recorte [sx, sy, sw, sh] que se muestra debajo de cada PIx.
// El comodín "*" aplica a TODOS los PIx por igual.
const PI_RECORTES = {
    "*": [80, 60, 19, 19]
};

// Ajuste fino de posición (en píxeles de mundo), por si queda corrido
const PI_DX = 0;
const PI_DY = 0;
const SPIKE_PUZZLE = {
    4: 3   // PIN4 -> PUZ3 (igual que PIN3). Ya no se usa: PIN4 ahora va con los botones INT.
};

// Pinchos que se bajan cuando tocás los botones INT1, INT2 e INT3 (ver mundoConfig.js)
const SPIKE_POR_BOTONES_INT = [4];
const SPIKE_REQUIERE_BOTONES = [1]; 
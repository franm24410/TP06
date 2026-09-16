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
const PI_DX = -6;
const PI_DY = -10;
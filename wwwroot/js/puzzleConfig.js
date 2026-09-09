// ========================================
// CONFIGURACIÓN DEL PUZZLE DE BOTONES
// ========================================
// Formato: cada ronda es [primerBoton, segundoBoton]
// Los números corresponden a TB1, TB2, TB3... TB12
// Ejemplo: [1, 3] significa tocar TB1 y después TB3 en menos de 5 segundos

const PUZZLE_SECUENCIAS = [
    [1, 3],   // Ronda 1: TB1 → TB3
    [5, 7],   // Ronda 2: TB5 → TB7
    [2, 9],   // Ronda 3: TB2 → TB9
    [8, 12]   // Ronda 4: TB8 → TB12
];

// Tiempo en milisegundos que tenés para tocar el segundo botón
const PUZZLE_TIEMPO_LIMITE = 5000; // 5 segundos

// Nombre de la capa de Tiled donde están las hitboxes de los botones
const PUZZLE_CAPA_BOTONES = "Interactuable-Piso";

// URL del controller para guardar en la base de datos
const PUZZLE_URL_GUARDAR = "/Puzzle/GuardarCompletado";
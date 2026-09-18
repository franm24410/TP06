// Secuencias del puzzle de botones (TB)
const PUZZLE_SECUENCIAS = [
    [1, 3],
    [5, 7],
    [2, 9],
    [8, 12]
];
const PUZZLE_TIEMPO_LIMITE = 5000;
const PUZZLE_CAPA_BOTONES = "Interactuable-Piso";

// A qué puzzle de piedras (PUZ) pertenece cada pincho (PINx).
// Si un número no está acá, usa su propio número.
const SPIKE_PUZZLE = {
    1: 1,
    2: 1,
    3: 3,
    4: 3
};

// Puzzles de piedras que ADEMÁS requieren que el puzzle de botones (TB) esté completo
// para que sus pinchos bajen.
const SPIKE_REQUIERE_BOTONES = [1];
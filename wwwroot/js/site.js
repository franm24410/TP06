const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

// player ahora es un objeto (world coords), porque mapRender.js
// (getCurrentRoomName, checkDoors, drawScene) necesita player.x/y/width/height
let player = {
    x: 1550,
    y: 740,
    width: 30,
    height: 30
};

let camera = { x: 0, y: 0 };

// Velocidad del personaje
let speed = 5;

let keys = {};
let grupoActivo = null;

document.addEventListener("keydown", function(event) {
    let tecla = event.key.toLowerCase();

    if (["w", "a", "s", "d"].includes(tecla)) {
        if (grupoActivo === null) {
            grupoActivo = "wasd";
        }

        if (grupoActivo === "wasd") {
            keys[tecla] = true;
        }
    }

    if (["arrowup", "arrowdown", "arrowleft", "arrowright"].includes(tecla)) {
        if (grupoActivo === null) {
            grupoActivo = "flechas";
        }

        if (grupoActivo === "flechas") {
            keys[tecla] = true;
        }
    }
});

document.addEventListener("keyup", function(event) {
    let tecla = event.key.toLowerCase();

    keys[tecla] = false;

    if (
        !keys["w"] &&
        !keys["a"] &&
        !keys["s"] &&
        !keys["d"] &&
        grupoActivo === "wasd"
    ) {
        grupoActivo = null;
    }

    if (
        !keys["arrowup"] &&
        !keys["arrowdown"] &&
        !keys["arrowleft"] &&
        !keys["arrowright"] &&
        grupoActivo === "flechas"
    ) {
        grupoActivo = null;
    }
});


// Sprites del personaje
const spriteSources = {
    idle: [
        "/img/Caminar/spr_f_maincharad_0.png"
    ],

    down: [
        "/img/Caminar/spr_f_maincharad_0.png",
        "/img/Caminar/spr_f_maincharad_1.png",
        "/img/Caminar/spr_f_maincharad_2.png",
        "/img/Caminar/spr_f_maincharad_3.png"
    ],

    up: [
        "/img/Caminar/spr_f_maincharau_0.png",
        "/img/Caminar/spr_f_maincharau_1.png",
        "/img/Caminar/spr_f_maincharau_2.png",
        "/img/Caminar/spr_f_maincharau_3.png"
    ],

    left: [
        "/img/Caminar/spr_f_maincharal_0.png",
        "/img/Caminar/spr_f_maincharal_1.png"
    ],

    right: [
        "/img/Caminar/spr_f_maincharar_0.png",
        "/img/Caminar/spr_f_maincharar_1.png"
    ]
};


// Precarga de imágenes
const sprites = {};

for (let direccion in spriteSources) {
    sprites[direccion] = spriteSources[direccion].map(function(src) {
        const img = new Image();

        img.cargada = false;

        img.onload = function() {
            img.cargada = true;
        };

        img.onerror = function() {
            console.warn("No se pudo cargar el sprite:", src);
        };

        img.src = src;

        return img;
    });
}


// Estado de la animación
let direccionActual = "down";
let frameActual = 0;
let frameTimer = 0;

const frameDuracion = 150;


// Determina hacia dónde mira el personaje
function actualizarDireccion() {

    let dx = 0;
    let dy = 0;

    if (keys["a"] || keys["arrowleft"]) {
        dx -= 1;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += 1;
    }

    if (keys["w"] || keys["arrowup"]) {
        dy -= 1;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += 1;
    }

    const moviendose = dx !== 0 || dy !== 0;

    // Prioridad horizontal cuando se mueve en diagonal
    if (dx < 0) {
        direccionActual = "left";
    }
    else if (dx > 0) {
        direccionActual = "right";
    }
    else if (dy < 0) {
        direccionActual = "up";
    }
    else if (dy > 0) {
        direccionActual = "down";
    }

    return moviendose;
}


// Actualiza la animación
function actualizarFrame(deltaTime, moviendose) {

    if (!moviendose) {
        frameActual = 0;
        frameTimer = 0;
        return;
    }

    frameTimer += deltaTime;

    if (frameTimer >= frameDuracion) {

        frameTimer = 0;

        const totalFrames = sprites[direccionActual].length;

        frameActual = (frameActual + 1) % totalFrames;
    }
}


// Actualiza el juego
function update(deltaTime) {

    let dx = 0;
    let dy = 0;

    if (keys["w"] || keys["arrowup"]) {
        dy -= speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        dy += speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        dx -= speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        dx += speed;
    }

    // Mueve respetando la capa "Paredes" (definida en mapRender.js)
    moveWithWallCollision(player, dx, dy);

    const moviendose = actualizarDireccion();

    actualizarFrame(deltaTime, moviendose);

    checkDoors(player);
}


// Dibujar

function draw() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Dibuja el mapa (solo la room actual) y actualiza la cámara
    drawScene(ctx, canvas, player, camera);

    // 2. Dibuja el sprite del personaje, restando la cámara para que
    //    quede en su posición correcta relativa a lo que se ve en pantalla
    let spriteActual = sprites[direccionActual][frameActual];

    if (!spriteActual || !spriteActual.cargada) {
        spriteActual = sprites["idle"][0];
    }

    if (spriteActual && spriteActual.cargada) {

        ctx.drawImage(
            spriteActual,
            player.x - camera.x,
            player.y - camera.y,
            player.width,
            player.height
        );
    }
}





// Game loop
let ultimoTimestamp = 0;

function gameLoop(timestamp) {

    const deltaTime = timestamp - ultimoTimestamp;

    ultimoTimestamp = timestamp;

    update(deltaTime || 16);

    draw();

    requestAnimationFrame(gameLoop);
}

// Esperamos a que el mapa (imágenes + capas) esté listo antes de arrancar
initMapRender().then(function() {
    requestAnimationFrame(gameLoop);
});
const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

let player = {
    x: 1550,
    y: 740,
    width: 20,
    height: 20
};

let camera = { x: 0, y: 0 };

let speed = 5;

let keys = {};
let grupoActivo = null;

// ---------------------------------------------------------------------
// GUI DE CARTELES
// ---------------------------------------------------------------------
let signGuiAbierta = false;

function abrirSignGui(texto) {
    if (signGuiAbierta) return;   // si ya está abierto, no hace nada

    const gui = document.getElementById("signGui");
    const box = document.getElementById("signGuiTexto");
    if (!gui || !box) return;

    box.textContent = "";          // limpia cualquier texto anterior
    box.textContent = String(texto);
    gui.classList.add("abierto");
    signGuiAbierta = true;

    // Frena el movimiento en seco mientras leés
    for (const k in keys) keys[k] = false;
    grupoActivo = null;
}

function cerrarSignGui() {
    const gui = document.getElementById("signGui");
    if (!gui) return;

    gui.classList.remove("abierto");
    signGuiAbierta = false;
}

// ---------------------------------------------------------------------
// TECLADO
// ---------------------------------------------------------------------
document.addEventListener("keydown", function(event) {
    if (event.repeat) return;   // ignora la repetición automática al mantener la tecla

    let tecla = event.key.toLowerCase();

    // Con la GUI abierta: CUALQUIER tecla la cierra y no hace nada más
    if (signGuiAbierta) {
        cerrarSignGui();
        event.preventDefault();
        return;
    }

    // Con E: lee el cartel que estés tocando
    if (tecla === "e") {
        const cartel = getSignAtPlayer(player);
        if (cartel) {
            abrirSignGui(cartel.texto);
            event.preventDefault();
            return;
        }
    }

    if (tecla.startsWith("arrow")) {
        event.preventDefault();
    }

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

// ---------------------------------------------------------------------
// Sprites del personaje
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// Animación
// ---------------------------------------------------------------------
let direccionActual = "down";
let frameActual = 0;
let frameTimer = 0;

const frameDuracion = 150;

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

// ---------------------------------------------------------------------
// Update
// ---------------------------------------------------------------------
function update(deltaTime) {
    // Mientras dura la transición de puerta: solo avanza el timer
    if (isTransitioning()) {
        updateDoorTransition(deltaTime);
        return;
    }

    // Con la GUI del cartel abierta el juego queda pausado
    if (signGuiAbierta) return;

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

    moveWithWallCollision(player, dx, dy);

    // 🪨 Piedras: empuje + deslizamiento, y botones de reset RBx
    updatePiedras(player, dx, dy);
    checkResetButtons(player);

    const moviendose = actualizarDireccion();

    actualizarFrame(deltaTime, moviendose);

    checkDoors(player);
    checkButtons(player);
}

// ---------------------------------------------------------------------
// Draw
// ---------------------------------------------------------------------
function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 1. Mapa + cámara
    drawScene(ctx, canvas, player, camera);

    // 1b. Botones del puzzle prendidos
    drawButtonOverlays(ctx, canvas, camera);

    // 1c. Piedras del puzzle (posición viva, pegadas a su hitbox)
    drawPIOverlays(ctx, canvas, camera);

    // 2. Personaje
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

    // 3. Overlay negro de transición de puertas
    drawTransitionOverlay(ctx, canvas);
}

// ---------------------------------------------------------------------
// Game loop
// ---------------------------------------------------------------------
let ultimoTimestamp = 0;

function gameLoop(timestamp) {
    const deltaTime = timestamp - ultimoTimestamp;

    ultimoTimestamp = timestamp;

    update(deltaTime || 16);

    draw();

    requestAnimationFrame(gameLoop);
}

initMapRender().then(function() {
    requestAnimationFrame(gameLoop);
});
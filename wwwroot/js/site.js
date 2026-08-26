const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");


let playerX = 100;
let playerY = 100;

let playerWidth = 50;
let playerHeight = 50;

let speed = 20;



let caja = {
    x: 400,
    y: 300,
    width: 50,
    height: 50,
    color: "blue"
};




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


    if (
        ["arrowup", "arrowdown", "arrowleft", "arrowright"]
        .includes(tecla)
    ) {

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



let tiempo = 0;


 

function update() {

    if (keys["w"] || keys["arrowup"]) {
        playerY -= speed;
    }

    if (keys["s"] || keys["arrowdown"]) {
        playerY += speed;
    }

    if (keys["a"] || keys["arrowleft"]) {
        playerX -= speed;
    }

    if (keys["d"] || keys["arrowright"]) {
        playerX += speed;
    }



    if (
        colisiona(
            {
                x: playerX,
                y: playerY,
                width: playerWidth,
                height: playerHeight
            },
            caja
        )
    ) {

        tiempo++;

        caja.color = "green";

        console.log(tiempo);

        if (tiempo > 10) {
            caja.color = "blue";
            tiempo = 0;
        }
    }


    if (playerX < 0) {
        playerX = 0;
    }

    if (playerX + playerWidth > canvas.width) {
        playerX = canvas.width - playerWidth;
    }

    if (playerY < 0) {
        playerY = 0;
    }


    if (playerY + playerHeight > canvas.height) {
        playerY = canvas.height - playerHeight;
    }
}




function colisiona(a, b) {

    return (
        a.x < b.x + b.width &&
        a.x + a.width > b.x &&
        a.y < b.y + b.height &&
        a.y + a.height > b.y
    );
}



function draw() {

    // Limpiar Canvas
    ctx.clearRect(
        0,
        0,
        canvas.width,
        canvas.height
    );


    ctx.fillStyle = "red";

    ctx.fillRect(
        playerX,
        playerY,
        playerWidth,
        playerHeight
    );


    ctx.fillStyle = caja.color;

    ctx.fillRect(
        caja.x,
        caja.y,
        caja.width,
        caja.height
    );
}



function resizeCanvas() {

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
}

resizeCanvas();

window.addEventListener("resize", resizeCanvas);




function gameLoop() {

    update();

    draw();

    requestAnimationFrame(gameLoop);
}



gameLoop();
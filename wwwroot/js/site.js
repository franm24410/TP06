// site.js — loop, input, estado de partida y GUIs (cartel + guardado)

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
let player = { x:0, y:0, width:20, height:20 };
let camera = { x:0, y:0 };
const speed = 5;
let keys = {}, grupoActivo = null;

// ---------- ESTADO DE PARTIDA (se guarda en BD) ----------
let ESTADO = {
  mapaActual: "H1",
  jugador: { x:0, y:0 },
  puzzleBotones: false,
  puzzlesPiedra: {},
  piedras: {}
};

// ---------- GUIs ----------
const signGui = document.getElementById("signGui");
const signGuiTexto = document.getElementById("signGuiTexto");
const saveGui = document.getElementById("saveGui");
const btnGuardar = document.getElementById("btnGuardar");
const saveMsg = document.getElementById("saveMsg");
let signAbierta = false, saveAbierta = false;

function abrirSign(t){ signGuiTexto.textContent=t; signGui.classList.add("abierto"); signAbierta=true; frenar(); }
function cerrarSign(){ signGui.classList.remove("abierto"); signAbierta=false; }
function abrirSave(){ saveGui.classList.add("abierto"); saveAbierta=true; saveMsg.textContent=""; frenar(); }
function cerrarSave(){ saveGui.classList.remove("abierto"); saveAbierta=false; }
function frenar(){ for (const k in keys) keys[k]=false; grupoActivo=null; }

btnGuardar.addEventListener("click", () => {
  snapshotPiedras();
  ESTADO.jugador = { x: player.x, y: player.y };
  fetch("/Partida/Guardar", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ Datos: JSON.stringify(ESTADO) })
  }).then(r=>r.json()).then(()=>{
    saveMsg.textContent = "✔ Partida guardada";
    setTimeout(cerrarSave, 700);
  }).catch(()=>{ saveMsg.textContent="✖ Error al guardar"; });
});

// ---------- input ----------
document.addEventListener("keydown", (e)=>{
  if (e.repeat) return;
  const tecla = e.key.toLowerCase();

  if (signAbierta || saveAbierta){ cerrarSign(); cerrarSave(); e.preventDefault(); return; }

  if (tecla === "e"){
    const cartel = getSignAtPlayer(player);
    if (cartel){ abrirSign(cartel.texto); e.preventDefault(); return; }
    const gua = getGuardadoAtPlayer(player);
    if (gua){ abrirSave(); e.preventDefault(); return; }
    // empuje de piedra en la dirección que mira
    const d = dirDesdeDireccion(direccionActual);
    if (empujarPiedra(player, d.x, d.y)){ e.preventDefault(); return; }
  }

  if (tecla.startsWith("arrow")) e.preventDefault();
  if (["w","a","s","d"].includes(tecla)){ if(grupoActivo===null) grupoActivo="wasd"; if(grupoActivo==="wasd") keys[tecla]=true; }
  if (["arrowup","arrowdown","arrowleft","arrowright"].includes(tecla)){ if(grupoActivo===null) grupoActivo="flechas"; if(grupoActivo==="flechas") keys[tecla]=true; }
});
document.addEventListener("keyup", (e)=>{
  const t=e.key.toLowerCase(); keys[t]=false;
  if(!keys.w&&!keys.a&&!keys.s&&!keys.d&&grupoActivo==="wasd") grupoActivo=null;
  if(!keys.arrowup&&!keys.arrowdown&&!keys.arrowleft&&!keys.arrowright&&grupoActivo==="flechas") grupoActivo=null;
});

// ---------- sprites personaje ----------
const spriteSources = {
  idle:["/img/Caminar/spr_f_maincharad_0.png"],
  down:["/img/Caminar/spr_f_maincharad_0.png","/img/Caminar/spr_f_maincharad_1.png","/img/Caminar/spr_f_maincharad_2.png","/img/Caminar/spr_f_maincharad_3.png"],
  up:["/img/Caminar/spr_f_maincharau_0.png","/img/Caminar/spr_f_maincharau_1.png","/img/Caminar/spr_f_maincharau_2.png","/img/Caminar/spr_f_maincharau_3.png"],
  left:["/img/Caminar/spr_f_maincharal_0.png","/img/Caminar/spr_f_maincharal_1.png"],
  right:["/img/Caminar/spr_f_maincharar_0.png","/img/Caminar/spr_f_maincharar_1.png"]
};
const sprites={};
for (const d in spriteSources){
  sprites[d]=spriteSources[d].map(src=>{ const i=new Image(); i.cargada=false; i.onload=()=>i.cargada=true; i.src=src; return i; });
}
let direccionActual="down", frameActual=0, frameTimer=0;
const frameDuracion=150;
function dirDesdeDireccion(d){
  if(d==="up")return{x:0,y:-1}; if(d==="down")return{x:0,y:1};
  if(d==="left")return{x:-1,y:0}; return{x:1,y:0};
}
function actualizarDireccion(){
  let dx=0,dy=0;
  if(keys.a||keys.arrowleft)dx--; if(keys.d||keys.arrowright)dx++;
  if(keys.w||keys.arrowup)dy--; if(keys.s||keys.arrowdown)dy++;
  const mov=dx!==0||dy!==0;
  if(dx<0)direccionActual="left"; else if(dx>0)direccionActual="right";
  else if(dy<0)direccionActual="up"; else if(dy>0)direccionActual="down";
  return mov;
}
function actualizarFrame(dt,mov){
  if(!mov){ frameActual=0; frameTimer=0; return; }
  frameTimer+=dt;
  if(frameTimer>=frameDuracion){ frameTimer=0; frameActual=(frameActual+1)%sprites[direccionActual].length; }
}

// ---------- update / draw ----------
function update(dt){
  if (window.SansFight && window.SansFight.activa) return; // pelea activa: el mapa queda congelado
  if (isTransitioning()){ updateDoorTransition(dt); return; }
  if (signAbierta || saveAbierta) return;
  let dx=0,dy=0;
  if(keys.w||keys.arrowup)dy-=speed; if(keys.s||keys.arrowdown)dy+=speed;
  if(keys.a||keys.arrowleft)dx-=speed; if(keys.d||keys.arrowright)dx+=speed;
  moveWithWallCollision(player,dx,dy);
  updatePiedras(player);
  checkResetButtons(player);
  const mov=actualizarDireccion();
  actualizarFrame(dt,mov);
  checkDoors(player);
  checkButtons(player);
  checkCaidas(player);
  checkPeleas(player);
  ESTADO.jugador = { x: player.x, y: player.y };
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawScene(ctx,canvas,player,camera);
  drawSpikes(ctx,camera);
  drawButtonOverlays(ctx,canvas,camera);
  drawPIOverlays(ctx,canvas,camera);
  // fallback a idle si el frame de la dirección aún no cargó
  let sp=sprites[direccionActual][frameActual];
  if(!sp||!sp.cargada) sp=sprites.idle[0];
  if(sp&&sp.cargada) ctx.drawImage(sp, Math.round(player.x-camera.x), Math.round(player.y-camera.y), player.width, player.height);
  drawTransitionOverlay(ctx,canvas);
}
let ultimo=0;
function loop(ts){ const dt=ts-ultimo; ultimo=ts; update(dt||16); draw(); requestAnimationFrame(loop); }

// ---------- arranque: modo tutorial o juego normal ----------
if (window.MODO_TUTORIAL) {
  // Modo tutorial: saltar fetch, forzar H21 y spawn en spawnT
  ESTADO.mapaActual = "H21";
  initMapRender(ESTADO, "H21").then(spawn => {
    // Buscar spawnT en los interactivos
    const spawnT = window.habitacionActual?.Interactivos?.find(i => i.Nombre === 'spawnT');
    if (spawnT) {
      player.x = Math.round(spawnT.X - player.width / 2);
      player.y = Math.round(spawnT.Y - player.height / 2);
    } else {
      player.x = Math.round(spawn.x - player.width / 2);
      player.y = Math.round(spawn.y - player.height / 2);
    }
    requestAnimationFrame(loop);
  }).catch(err => {
    console.error('Error cargando H21:', err);
  });
} else {
  // Modo juego normal: cargar estado de BD
  fetch("/Partida/Cargar")
    .then(r => r.ok ? r.json() : null)
    .then(data => {
      if (data && data.datos) {
        try { const p = JSON.parse(data.datos); Object.assign(ESTADO, p); } catch (e) {}
      }
      return initMapRender(ESTADO, ESTADO.mapaActual || window.MAPA_INICIAL || "H1");
    }).then(spawn => {
      if (ESTADO.jugador && (ESTADO.jugador.x || ESTADO.jugador.y)) {
        player.x = ESTADO.jugador.x;
        player.y = ESTADO.jugador.y;
      } else {
        player.x = Math.round(spawn.x - player.width / 2);
        player.y = Math.round(spawn.y - player.height / 2);
      }
      requestAnimationFrame(loop);
    }).catch(err => console.error(err));
}
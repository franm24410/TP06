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
  if (window.MODO_TUTORIAL){                     // el tutorial no pisa la partida guardada
    saveMsg.textContent = "✔ El tutorial no se guarda";
    setTimeout(cerrarSave, 700);
    return;
  }
  snapshotPiedras();
  if (window.Jugador) Jugador.curarTodo();      // guardar te recupera toda la vida
  ESTADO.jugador = { x: player.x, y: player.y };
  ESTADO.ultimoGuardado = { mapa: currentMapName, x: player.x, y: player.y };
  fetch("/Partida/Guardar", {
    method:"POST", headers:{ "Content-Type":"application/json" },
    body: JSON.stringify({ Datos: JSON.stringify(ESTADO) })
  }).then(r=>r.json()).then(()=>{
    saveMsg.textContent = "✔ Partida guardada · HP al máximo";
    setTimeout(cerrarSave, 700);
  }).catch(()=>{ saveMsg.textContent="✖ Error al guardar"; });
});

// ---------- input ----------
document.addEventListener("keydown", (e)=>{
  if (e.repeat) return;
  const tecla = e.key.toLowerCase();

  if (signAbierta || saveAbierta){ cerrarSign(); cerrarSave(); e.preventDefault(); return; }

  // [PRUEBAS] H = modo fantasma: atravesás paredes, pinchos y piedras. Borrar al terminar de testear.
  if (tecla === "h"){ window.MODO_FANTASMA = !window.MODO_FANTASMA; e.preventDefault(); return; }

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
  if (window.EnemyFight && window.EnemyFight.activa) return;
  if (window.Guardias && window.Guardias.activo){ Guardias.update(dt); return; }   // escena de la Guardia Real (PEL2)
  if (fundidoPEL){ tickFundido(dt); return; }                // fundido a negro antes de PEL1 / PEL3
  if (isTransitioning()){ updateDoorTransition(dt); return; }
  if (signAbierta || saveAbierta) return;
  if (window.Mundo && Mundo.guiAbierta) return;            // mochila / tienda abiertas
  let dx=0,dy=0;
  if(keys.w||keys.arrowup)dy-=speed; if(keys.s||keys.arrowdown)dy+=speed;
  if(keys.a||keys.arrowleft)dx-=speed; if(keys.d||keys.arrowright)dx+=speed;
  const antesX=player.x, antesY=player.y, frameAntes=frameActual;
  if (window.Mundo) Mundo.moverJugador(player,dx,dy,speed); // (maneja el hielo)
  else moveWithWallCollision(player,dx,dy);
  updatePiedras(player);
  checkResetButtons(player);
  const mov=actualizarDireccion();
  actualizarFrame(dt,mov);
  // cada cuadro de la animación de caminar cuenta como un paso (para los encuentros)
  if (window.Mundo && mov && frameActual!==frameAntes && (player.x!==antesX || player.y!==antesY)) Mundo.paso();
  if (window.MODO_TUTORIAL && checkSalidaTutorial(player)) return;
  if (checkSalidaMenu(player)) return;                         // ph43 -> menú (después, créditos)
  checkDoors(player);
  checkButtons(player);
  checkCaidas(player);
  if (window.Mundo){ if (Mundo.checkCaida(player)) return; Mundo.checkBotonesINT(player); }
  checkPeleas(player);
  ESTADO.jugador = { x: player.x, y: player.y };
}
function draw(){
  ctx.clearRect(0,0,canvas.width,canvas.height);
  drawScene(ctx,canvas,player,camera);
  drawSpikes(ctx,camera);
  drawButtonOverlays(ctx,canvas,camera);
  drawPIOverlays(ctx,canvas,camera);
  if (window.Guardias) Guardias.dibujar(ctx,camera,"atras");
  // fallback a idle si el frame de la dirección aún no cargó
  let sp=sprites[direccionActual][frameActual];
  if(!sp||!sp.cargada) sp=sprites.idle[0];
  if(sp&&sp.cargada) ctx.drawImage(sp, Math.round(player.x-camera.x), Math.round(player.y-camera.y), player.width, player.height);
  if (window.Guardias) Guardias.dibujar(ctx,camera,"adelante");
  drawTransitionOverlay(ctx,canvas);
  if (fundidoPEL){ ctx.save(); ctx.globalAlpha=Math.min(1,fundidoPEL.t/fundidoPEL.dur); ctx.fillStyle="#000"; ctx.fillRect(0,0,canvas.width,canvas.height); ctx.restore(); }
  if (window.MODO_FANTASMA){ ctx.save(); ctx.font="bold 14px monospace"; ctx.fillStyle="#ff0"; ctx.fillText("MODO FANTASMA (H)",8,18); ctx.restore(); }
  if (window.Guardias) Guardias.dibujar(ctx,camera,"texto");
}
let ultimo=0;
function loop(ts){ const dt=ts-ultimo; ultimo=ts; update(dt||16); draw(); if (window.Musica) Musica.tick(); requestAnimationFrame(loop); }

// ---------- fundido a negro antes de las peleas de PEL1 y PEL3 ----------
// (igual que al pasar una puerta, así la pelea no aparece de golpe)
let fundidoPEL=null;
function fundidoAntesDePelea(cb){
  if (fundidoPEL) return;
  frenar();
  fundidoPEL={ t:0, dur:TRANSITION_HALF+150, cb };
}
function tickFundido(dt){
  fundidoPEL.t+=dt;
  if (fundidoPEL.t<fundidoPEL.dur) return;
  const cb=fundidoPEL.cb;
  cb();                    // la pelea tapa la pantalla; el mapa vuelve a verse cuando termina
  fundidoPEL=null;
}

// ---------- salida: puerta ph43 ----------
// Te muestra los créditos (creditos.js) y después te lleva al menú.
let saliendoAlMenu=false;
function checkSalidaMenu(p){
  if (saliendoAlMenu) return true;
  const salida = findObjectByName("ph43");
  if (!salida || !rectsOverlap(p, salida)) return false;
  saliendoAlMenu=true;
  frenar();
  startDoorTransition(p, { targetMap: currentMapName, x: p.x, y: p.y, duracion: 400 });
  const alMenu = () => { window.location.href = "/Home/Menu"; };
  setTimeout(() => { if (window.Creditos) Creditos.iniciar(alMenu); else alMenu(); }, 400);
  return true;
}

// ---------- tutorial ----------
// Tutorial.cshtml pone MODO_TUTORIAL = true: arranca siempre en H21 sobre "spawnT"
// (sin cargar la partida guardada) y al tocar "ph39" vuelve al menú.
const TUTORIAL_MAPA   = window.TUTORIAL_MAPA   || "H21";
const TUTORIAL_SPAWN  = window.TUTORIAL_SPAWN  || "spawnT";
const TUTORIAL_SALIDA = window.TUTORIAL_SALIDA || "ph39";
let saliendoTutorial = false;
function checkSalidaTutorial(p){
  if (saliendoTutorial) return true;
  const salida = findObjectByName(TUTORIAL_SALIDA);
  if (!salida || !rectsOverlap(p, salida)) return false;
  saliendoTutorial = true;
  frenar();
  // mismo fundido a negro que las puertas y después al menú (Tutorial / Jugar)
  startDoorTransition(p, { targetMap: currentMapName, x: p.x, y: p.y, duracion: 400 });
  setTimeout(() => { window.location.href = "/Home/Menu"; }, 400);
  return true;
}
function spawnTutorial(){
  const s = findObjectByName(TUTORIAL_SPAWN);
  if (s) return { x: s.x + (s.width||0)/2, y: s.y + (s.height||0)/2 };
  console.warn("Falta el objeto '"+TUTORIAL_SPAWN+"' en "+TUTORIAL_MAPA+"; uso el spawn por defecto.");
  return getDefaultSpawn();
}
if (window.MODO_TUTORIAL){
  initMapRender(ESTADO, TUTORIAL_MAPA).then(()=>{
    const spawn = spawnTutorial();
    player.x = Math.round(spawn.x - player.width/2);
    player.y = Math.round(spawn.y - player.height/2);
    ESTADO.jugador = { x: player.x, y: player.y };
    requestAnimationFrame(loop);
  }).catch(err=>console.error(err));
} else

// ---------- arranque: cargar estado de BD y luego init ----------
fetch("/Partida/Cargar")
  .then(r=> r.ok ? r.json() : null)   // 🆕 si no hay sesión/respuesta, no explota
  .then(data=>{
    if (data && data.datos){
      try { const p=JSON.parse(data.datos); Object.assign(ESTADO, p); } catch(e){}
    }
    return initMapRender(ESTADO, ESTADO.mapaActual || window.MAPA_INICIAL || "H1");
  }).then(spawn=>{
    if (ESTADO.jugador && (ESTADO.jugador.x||ESTADO.jugador.y)){ player.x=ESTADO.jugador.x; player.y=ESTADO.jugador.y; }
    else { player.x=Math.round(spawn.x-player.width/2); player.y=Math.round(spawn.y-player.height/2); }
    requestAnimationFrame(loop);
  }).catch(err=>console.error(err));
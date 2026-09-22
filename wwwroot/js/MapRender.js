// mapRender.js — multi-mapa (Hx.tmj) + estado persistente (ESTADO pasado por site.js)
// - Puertas: capa Doors, nombre phX + propiedad targetMap; aparecés en el objeto "X".
// - Piedras: PIx empujables (E), encerradas en PUZx, se traban en PLx; RBx reinicia
//   (con animación de prendido 5s, igual que los TB).
// - Pinchos: PINx dibujan spr_spiketile_0_editado.png y bloquean; si su puzzle está
//   completado pasan a spr_spiketile_1_editado.png y NO bloquean.
// - Carteles: C1..C10 en Interactuable-Pared (E para leer). Guardado: GUA1.
// - Estado de piedras guardado por clave "mapa:nombre" (no pisa entre mapas).

const MAPS_FOLDER = "/Tiles/";
const MAP_EXT = ".tmj";

const SPIKE_HIGH = "/Tiles/spr_spiketile_0_editado.png";
const SPIKE_LOW  = "/Tiles/spr_spiketile_1_editado.png";

let mapData = null;
let currentMapName = null;
let TILE_W = 20, TILE_H = 20;
let worldBounds = { minX:0, minY:0, maxX:0, maxY:0 };

// Referencia al estado de partida (la declara site.js; acá solo se usa).
// initMapRender() la asigna con "ESTADO = estado;" más abajo.

const TILE_FOLDER = "/Tiles/";
const TILESET_CONFIG = {
  "bg_ruinseasynam1.tsx": { image:"bg_ruinseasynam1.png", columns:8 },
  "bg_ruinseasynam2.tsx": { image:"bg_ruinseasynam2.png", columns:8 },
  "bg_ruinseasynam3.tsx": { image:"bg_ruinseasynam3.png", columns:8 },
  "bg_ruintiles1.tsx":    { image:"bg_ruintiles1.png",    columns:6 },
  "bg_tundratiles.tsx":   { image:"bg_tundratiles.png",   columns:9 },
  "spr_snowpap_0.tsx":        { image:"spr_snowpap_0.png",        columns:1 },
  "spr_groundswitch1_0.tsx":  { image:"spr_groundswitch1_0.png",  columns:1 },
  "spr_groundswitch1_1.tsx":  { image:"spr_groundswitch1_1.png",  columns:1 },
  "spr_npc_sign_0.tsx":       { image:"spr_npc_sign_0.png",       columns:1 },
  "spr_smallweb_0.tsx":       { image:"spr_smallweb_0.png",       columns:1 },
  "spr_xmastree_0.tsx":       { image:"spr_xmastree_0.png",       columns:1 },
  "spr_spiketile_0.tsx":      { image:"spr_spiketile_0.png",      columns:1 },
  "spr_spiketile_1.tsx":      { image:"spr_spiketile_1.png",      columns:1 },
  "spr_papyrushouse_0.tsx":   { image:"spr_papyrushouse_0.png",   columns:1 },
  "spr_snowdinlogo_ja_0.tsx": { image:"spr_snowdinlogo_ja_0.png", columns:1 },
  "spr_vinespillar_0.tsx":    { image:"spr_vinespillar_0.png",    columns:1 }
};

function getFileName(p){ return p ? p.split(/[\\/]/).pop() : null; }

const loadedImages = {};
const tilesetRanges = [];

function buildTilesetRanges(){
  const list = mapData.tilesets;
  for (let i=0;i<list.length;i++){
    const ts = list[i];
    const next = list[i+1] ? list[i+1].firstgid : Infinity;
    if (ts.image){
      tilesetRanges.push({ firstgid:ts.firstgid, lastgid:next-1, columns:ts.columns,
        image:TILE_FOLDER+getFileName(ts.image), margin:ts.margin||0, spacing:ts.spacing||0 });
      continue;
    }
    const fn = getFileName(ts.source);
    const cfg = fn ? TILESET_CONFIG[fn] : null;
    if (!cfg){ console.warn("Falta TILESET_CONFIG:", fn); continue; }
    tilesetRanges.push({ firstgid:ts.firstgid, lastgid:next-1, columns:cfg.columns,
      image:TILE_FOLDER+cfg.image, margin:0, spacing:0 });
  }
}

function loadImages(){
  const set = new Set(tilesetRanges.map(r=>r.image));
  set.add(SPIKE_HIGH); set.add(SPIKE_LOW);
  const btn = TILESET_CONFIG["spr_groundswitch1_1.tsx"];
  if (btn) set.add(TILE_FOLDER+btn.image);
  if (typeof PI_IMAGEN!=="undefined" && PI_IMAGEN) set.add(PI_IMAGEN);
  const proms = [];
  for (const path of set){
    if (loadedImages[path]) continue;
    const img = new Image();
    proms.push(new Promise(res=>{ img.onload=res; img.onerror=()=>{ img.failed=true; res(); }; img.src=path; }));
    loadedImages[path]=img;
  }
  return Promise.all(proms);
}

// ---------- decode ----------
const FLIP_MASK = 0x1FFFFFFF;
function decodeChunkData(b64){
  const bin = atob(b64); const bytes = new Uint8Array(bin.length);
  for (let i=0;i<bin.length;i++) bytes[i]=bin.charCodeAt(i);
  return new Uint32Array(bytes.buffer);
}
function getLayerTiles(layer){
  const tiles=[];
  if (layer.chunks){
    for (const ch of layer.chunks){
      const g = decodeChunkData(ch.data);
      for (let r=0;r<ch.height;r++) for (let c=0;c<ch.width;c++){
        const gid = g[r*ch.width+c] & FLIP_MASK; if(!gid) continue;
        tiles.push({gid, tileX:ch.x+c, tileY:ch.y+r});
      }
    }
    return tiles;
  }
  if (typeof layer.data === "string"){
    const g = decodeChunkData(layer.data);
    for (let r=0;r<layer.height;r++) for (let c=0;c<layer.width;c++){
      const gid = g[r*layer.width+c] & FLIP_MASK; if(!gid) continue;
      tiles.push({gid, tileX:c, tileY:r});
    }
    return tiles;
  }
  if (Array.isArray(layer.data)){
    for (let r=0;r<layer.height;r++) for (let c=0;c<layer.width;c++){
      const gid = layer.data[r*layer.width+c] & FLIP_MASK; if(!gid) continue;
      tiles.push({gid, tileX:c, tileY:r});
    }
  }
  return tiles;
}
const TILE_LAYER_NAMES = ["background","Piso","Paredes","Detalles-Piso","Detalles-Pared","Objeto"];
const decodedLayers = {};
function decodeAllLayers(){
  for (const n of TILE_LAYER_NAMES){
    const l = mapData.layers.find(x=>x.name===n);
    if (l) decodedLayers[n] = getLayerTiles(l);
  }
}
function computeWorldBounds(){
  let a=Infinity,b=Infinity,c=-Infinity,d=-Infinity;
  for (const n of TILE_LAYER_NAMES){
    const t = decodedLayers[n]; if(!t) continue;
    for (const q of t){
      if(q.tileX<a)a=q.tileX; if(q.tileY<b)b=q.tileY;
      if(q.tileX+1>c)c=q.tileX+1; if(q.tileY+1>d)d=q.tileY+1;
    }
  }
  if (a===Infinity){ a=0;b=0;c=mapData.width;d=mapData.height; }
  worldBounds = { minX:a*TILE_W, minY:b*TILE_H, maxX:c*TILE_W, maxY:d*TILE_H };
}

// ---------- helpers ----------
function propsToObject(o){ const r={}; if(o.properties) for(const p of o.properties) r[p.name]=p.value; return r; }
function rectsOverlap(a,b){ return a.x<b.x+b.width && a.x+a.width>b.x && a.y<b.y+b.height && a.y+a.height>b.y; }
function findObjectByName(n){
  const q=String(n).trim();
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if (o.name && String(o.name).trim()===q) return o; }
  return null;
}
function getAbsolutePoints(o){
  if (o.polygon) return o.polygon.map(p=>({x:o.x+p.x,y:o.y+p.y}));
  return [{x:o.x,y:o.y},{x:o.x+o.width,y:o.y},{x:o.x+o.width,y:o.y+o.height},{x:o.x,y:o.y+o.height}];
}
function pointInPolygon(px,py,pts){
  let inside=false;
  for (let i=0,j=pts.length-1;i<pts.length;j=i++){
    const xi=pts[i].x,yi=pts[i].y,xj=pts[j].x,yj=pts[j].y;
    if (((yi>py)!==(yj>py)) && (px < (xj-xi)*(py-yi)/(yj-yi)+xi)) inside=!inside;
  }
  return inside;
}

// ---------- colisión (paredes + pinchos activos + piedras) ----------
let wallObjects = [];
let spikes = [];
function spikeOwner(num){ return (typeof SPIKE_PUZZLE!=="undefined" && SPIKE_PUZZLE[num]) || num; }
function spikeDesactivado(sp){
  const owner = spikeOwner(sp.num);
  const piedra = !!(ESTADO && ESTADO.puzzlesPiedra && ESTADO.puzzlesPiedra[owner]);
  if (!piedra) return false;
  // Solo algunos pinchos (los que estén en SPIKE_REQUIERE_BOTONES) piden
  // ADEMÁS el puzzle de botones completo. Los demás se apagan con la
  // piedra sola.
  if (typeof SPIKE_REQUIERE_BOTONES!=="undefined" && SPIKE_REQUIERE_BOTONES.includes(owner))
    return !!(ESTADO && ESTADO.puzzleBotones);
  return true;
}
function rectHitsWall(rect){
  if (wallObjects.some(w=>rectsOverlap(rect,w))) return true;
  if (spikes.some(s=>!spikeDesactivado(s) && rectsOverlap(rect,s))) return true;
  return stones.some(s=>rectsOverlap(rect,s));
}
function moveWithWallCollision(p,dx,dy){
  if (dx!==0){ const t={x:p.x+dx,y:p.y,width:p.width,height:p.height}; if(!rectHitsWall(t)) p.x+=dx; }
  if (dy!==0){ const t={x:p.x,y:p.y+dy,width:p.width,height:p.height}; if(!rectHitsWall(t)) p.y+=dy; }
}

// ---------- caídas (cai) ----------
let caidas=[];
function initCaidas(){
  caidas=[];
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if(o.name && /^cai$/i.test(o.name.trim()))
      caidas.push(o); }
}
function checkCaidas(p){
  if(isTransitioning()) return;
  for (const c of caidas){
    if(rectsOverlap(p,c)){
      // % de dónde estás parado dentro de "caidaOrigen" (toda la habitación).
      // Si no existe ese objeto en el mapa, se usa el propio hitbox "cai" como referencia.
      const origen = findObjectByName("caidaOrigen") || c;
      const pctX = (p.x+p.width/2 - origen.x) / (origen.width||1);
      const pctY = (p.y+p.height/2 - origen.y) / (origen.height||1);
      startDoorTransition(p, { targetMap:"H5", pct:{x:pctX,y:pctY}, duracion:900 });
      break;
    }
  }
}

// ---------- peleas (PELx) ----------
// Hitbox que dispara una pelea contra un jefe (por ahora, PEL1 -> Sans).
// window.SansFight lo define sansFight.js; si ese script no está cargado
// todavía, tocar el hitbox simplemente no hace nada (no rompe el juego).
let peleas=[];
function initPeleas(){
  peleas=[];
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if(o.name && /^PEL\d+$/i.test(o.name.trim()))
      peleas.push(o); }
}
function checkPeleas(p){
  if(isTransitioning()) return;
  for (const pl of peleas){
    if(!rectsOverlap(p,pl)) continue;
    const nombre = pl.name.trim().toUpperCase();
    if (nombre==="PEL1" && window.SansFight && !window.SansFight.activa){
      window.SansFight.iniciar(p);
    }
    break;
  }
}

// ---------- puertas multi-mapa ----------
let doors=[], doorsByName={};
function getDefaultSpawn(){
  const s = findObjectByName("Spawn")||findObjectByName("spawn");
  if (s) return {x:s.x+(s.width||0)/2, y:s.y+(s.height||0)/2};
  return {x:(worldBounds.minX+worldBounds.maxX)/2, y:(worldBounds.minY+worldBounds.maxY)/2};
}
let doorTransition=null, lastUsedDoor=null;
const TRANSITION_HALF=250;
function isTransitioning(){ return doorTransition!==null; }
function startDoorTransition(p,ch){ if(doorTransition) return; doorTransition={player:p,phase:"in",timer:0,change:ch,duracion:ch.duracion||TRANSITION_HALF}; }
async function performMapChange(p,ch){
  if (ch.targetMap && ch.targetMap!==currentMapName) await loadMap(ch.targetMap);
  if (ch.pct){
    // Caída: mismo % relativo dentro del rectángulo "caidaDestino" del mapa nuevo
    const destino = findObjectByName("caidaDestino");
    if (destino){
      const px = Math.min(Math.max(ch.pct.x,0),1), py = Math.min(Math.max(ch.pct.y,0),1);
      const cx = destino.x + px*(destino.width||0), cy = destino.y + py*(destino.height||0);
      p.x = Math.round(cx - p.width/2); p.y = Math.round(cy - p.height/2);
    } else {
      console.warn("Falta el objeto 'caidaDestino' en "+currentMapName);
      const sp = getDefaultSpawn(); p.x=Math.round(sp.x-p.width/2); p.y=Math.round(sp.y-p.height/2);
    }
  } else if (typeof ch.x==="number" && typeof ch.y==="number"){
    p.x = ch.x; p.y = ch.y;
  } else {
    const sq = findObjectByName(ch.spawnSquareName);
    const sp = sq ? {x:sq.x+(sq.width||0)/2, y:sq.y+(sq.height||0)/2} : getDefaultSpawn();
    p.x=Math.round(sp.x-p.width/2); p.y=Math.round(sp.y-p.height/2);
  }
  lastUsedDoor = doors.find(d=>rectsOverlap(p,d))||null;
}
function updateDoorTransition(dt){
  if(!doorTransition) return;
  const t=doorTransition;
  if (t.phase==="in"){ t.timer+=dt; if(t.timer>=t.duracion){ t.phase="loading";
      performMapChange(t.player,t.change).then(()=>{ t.phase="out"; t.timer=0; }).catch(()=>{ t.phase="out"; t.timer=0; }); } }
  else if (t.phase==="out"){ t.timer+=dt; if(t.timer>=t.duracion) doorTransition=null; }
}
function getTransitionAlpha(){
  if(!doorTransition) return 0;
  const t=doorTransition;
  if(t.phase==="in") return Math.min(1,t.timer/t.duracion);
  if(t.phase==="loading") return 1;
  return Math.max(0,1-t.timer/t.duracion);
}
function drawTransitionOverlay(ctx,cv){
  const a=getTransitionAlpha(); if(a<=0) return;
  ctx.save(); ctx.globalAlpha=a; ctx.fillStyle="black"; ctx.fillRect(0,0,cv.width,cv.height); ctx.restore();
}
function checkDoors(p){
  if(isTransitioning()) return;
  if(lastUsedDoor && !rectsOverlap(p,lastUsedDoor)) lastUsedDoor=null;
  for (const d of doors){
    if(d===lastUsedDoor) continue;
    if(rectsOverlap(p,d)){
      const pr=propsToObject(d);
      if(!pr.targetMap){ console.warn("Puerta sin targetMap:", d.name); return; }
      startDoorTransition(p,{ targetMap:pr.targetMap, spawnSquareName:d.name.replace(/^ph/i,"") });
      break;
    }
  }
}

// ---------- puzzle botones (TB) ----------
let buttons=[], buttonsByName={};
function getPuzzleCapa(){ return (typeof PUZZLE_CAPA_BOTONES!=="undefined")?PUZZLE_CAPA_BOTONES:"Interactuable-Piso"; }
function getPuzzleSecuencias(){ return (typeof PUZZLE_SECUENCIAS!=="undefined")?PUZZLE_SECUENCIAS:[[1,3],[5,7],[2,9],[8,12]]; }
function getPuzzleTiempo(){ return (typeof PUZZLE_TIEMPO_LIMITE!=="undefined")?PUZZLE_TIEMPO_LIMITE:5000; }
let buttonOnImage=null;
let puzzleRonda=0, puzzleEsperando=false, puzzleBotonesActivos={};
function activateButton(n){ puzzleBotonesActivos[n]=Date.now()+getPuzzleTiempo(); }
function isButtonActive(n){ const e=puzzleBotonesActivos[n]; return e? Date.now()<e : false; }
function resetPuzzleBotones(){ puzzleRonda=0; puzzleEsperando=false; puzzleBotonesActivos={}; }
function cleanupExpired(){
  const ahora=Date.now(); const seq=getPuzzleSecuencias();
  for (const n in puzzleBotonesActivos){
    if (ahora>=puzzleBotonesActivos[n]){ delete puzzleBotonesActivos[n];
      if (puzzleEsperando){ const s=seq[puzzleRonda]; if(s && n==="TB"+s[0]) resetPuzzleBotones(); } }
  }
}
function checkButtons(p){
  if(isTransitioning()) return;
  cleanupExpired();
  const seq=getPuzzleSecuencias();
  for (const b of buttons){
    if(!rectsOverlap(p,b)) continue;
    if(!/^TB\d+$/i.test(b.name)) continue;
    const num=parseInt(b.name.replace(/^TB/i,""),10); if(isNaN(num)) continue;
    if(isButtonActive(b.name)) continue;
    if (ESTADO && !ESTADO.puzzleBotones){
      const s=seq[puzzleRonda];
      if (s){
        const e1=s[0], e2=s[1];
        if(!puzzleEsperando){
          if(num===e1){ puzzleEsperando=true; }
          else resetPuzzleBotones();
        } else {
          if(num===e2){
            if(isButtonActive("TB"+e1)){
              puzzleEsperando=false; puzzleRonda++;
              if(puzzleRonda>=seq.length){ ESTADO.puzzleBotones=true; }
            } else resetPuzzleBotones();
          } else if(num!==e1) resetPuzzleBotones();
        }
      }
    }
    activateButton(b.name);
    break;
  }
}
function drawButtonOverlays(ctx,cv,cam){
  if(!buttonOnImage||!buttonOnImage.complete||buttonOnImage.failed) return;
  const w=buttonOnImage.naturalWidth||TILE_W, h=buttonOnImage.naturalHeight||TILE_H;
  for (const n in puzzleBotonesActivos){
    const b=buttonsByName[n]; if(!b) continue;
    ctx.drawImage(buttonOnImage, Math.round(b.x+(b.width||TILE_W)/2 - w/2 - cam.x),
      Math.round(b.y+(b.height||TILE_H)/2 - h/2 - cam.y), w, h);
  }
}

// ---------- piedras (PIx) + PUZx + PLx + RBx ----------
let stones=[], stoneTargets=[], resetButtons=[];
const PIEDRA_VEL=3;
function piedraSize(){ return Math.round((TILE_W/2)*(4/3)); }
let piImage=null;
function tileOwner(v,ts){ return Math.floor((v-0.001)/ts); }
function tileDePiedra(s){ return { x:tileOwner(s.x+s.width/2,TILE_W), y:tileOwner(s.y+s.height/2,TILE_H) }; }
function centrarPiedra(s){
  const t=tileDePiedra(s);
  const cx=t.x*TILE_W+(TILE_W-s.width)/2, cy=t.y*TILE_H+(TILE_H-s.height)/2;
  const r={x:cx,y:cy,width:s.width,height:s.height};
  const okA=!s.arenaPoints||stoneInArena(r,s.arenaPoints);
  const okP=!wallObjects.some(w=>rectsOverlap(r,w));
  if(okA&&okP){ s.x=cx; s.y=cy; }
}
function stoneInArena(r,pts){
  if(!pts) return true; const m=1;
  return pointInPolygon(r.x+m,r.y+m,pts)&&pointInPolygon(r.x+r.width-m,r.y+m,pts)&&
         pointInPolygon(r.x+m,r.y+r.height-m,pts)&&pointInPolygon(r.x+r.width-m,r.y+r.height-m,pts);
}
function celdaLibrePiedra(s,tx,ty){
  const r={x:tx*TILE_W+(TILE_W-s.width)/2, y:ty*TILE_H+(TILE_H-s.height)/2, width:s.width,height:s.height};
  if(!stoneInArena(r,s.arenaPoints)) return false;
  if(wallObjects.some(w=>rectsOverlap(r,w))) return false;
  if(stones.some(o=>o!==s&&rectsOverlap(r,o))) return false;
  return true;
}
function initStoneObjects(){
  stones=[]; stoneTargets=[]; resetButtons=[];
  const arenas=[];
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if(o.name && /^PUZ\d+$/i.test(o.name))
      arenas.push({num:parseInt(o.name.replace(/^PUZ/i,""),10), points:getAbsolutePoints(o)}); }
  const arenaFor=(x,y)=>arenas.find(a=>pointInPolygon(x,y,a.points))||null;
  const tam=piedraSize();
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])){
      if(!o.name) continue;
      if(/^PI\d+$/i.test(o.name)){
        const cx=o.x+(o.width||TILE_W)/2, cy=o.y+(o.height||TILE_H)/2;
        const ar=arenaFor(cx,cy);
        const s={name:o.name,num:parseInt(o.name.replace(/^PI/i,""),10),
          x:cx-tam/2,y:cy-tam/2,width:tam,height:tam,initX:cx-tam/2,initY:cy-tam/2,
          puzzle:ar?ar.num:null, arenaPoints:ar?ar.points:null, locked:false, sliding:null, targetName:null};
        centrarPiedra(s); s.initX=s.x; s.initY=s.y;
        stones.push(s);
      }
      else if(/^PL\d+$/i.test(o.name)){
        const cx=o.x+(o.width||TILE_W)/2, cy=o.y+(o.height||TILE_H)/2;
        const ar=arenaFor(cx,cy);
        stoneTargets.push({name:o.name,x:o.x,y:o.y,width:o.width||TILE_W,height:o.height||TILE_H,
          puzzle:ar?ar.num:null, occupied:false});
      }
      else if(/^RB\d+$/i.test(o.name)){
        if(!o.width&&!o.height){ o.width=TILE_W; o.height=TILE_H; o.x-=TILE_W/2; o.y-=TILE_H/2; }
        resetButtons.push({name:o.name,num:parseInt(o.name.replace(/^RB/i,""),10),x:o.x,y:o.y,width:o.width,height:o.height});
      }
    }
  }
  // 🔑 Los RB también se registran en buttonsByName para que drawButtonOverlays
  // pueda dibujarles el sprite prendido cuando se activan
  for (const rb of resetButtons) buttonsByName[rb.name]=rb;

  // Restaurar estado guardado de piedras de ESTE mapa (clave "mapa:nombre")
  if (ESTADO && ESTADO.piedras){
    const k=currentMapName+":";
    for (const s of stones){
      const g=ESTADO.piedras[k+s.name];
      if (g){ s.x=g.x; s.y=g.y; s.locked=!!g.locked; s.targetName=g.targetName||null;
        if (s.locked && s.targetName){ const t=stoneTargets.find(x=>x.name===s.targetName); if(t) t.occupied=true; } }
    }
  }
}
function snapshotPiedras(){
  if(!ESTADO) return;
  if(!ESTADO.piedras) ESTADO.piedras={};
  const k=currentMapName+":";
  for (const s of stones) ESTADO.piedras[k+s.name]={x:s.x,y:s.y,locked:s.locked,targetName:s.targetName};
}
function hitsOtherStone(s,r){ return stones.some(o=>o!==s&&rectsOverlap(r,o)); }
function findFreeTarget(s,r){ return stoneTargets.find(t=>t.puzzle===s.puzzle&&!t.occupied&&rectsOverlap(r,t))||null; }
function stepStone(s){
  const d=s.sliding; let moved=0;
  while(moved<PIEDRA_VEL){
    const nx=s.x+d.dx, ny=s.y+d.dy;
    const r={x:nx,y:ny,width:s.width,height:s.height};
    const t=findFreeTarget(s,r);
    if (t){ s.x=t.x+t.width/2-s.width/2; s.y=t.y+t.height/2-s.height/2;
      s.locked=true; s.sliding=null; s.targetName=t.name; t.occupied=true;
      if(ESTADO){ if(!ESTADO.puzzlesPiedra) ESTADO.puzzlesPiedra={};
        const pls=stoneTargets.filter(x=>x.puzzle===s.puzzle);
        if (pls.every(x=>x.occupied)) ESTADO.puzzlesPiedra[s.puzzle]=true; }
      snapshotPiedras(); return; }
    if (hitsOtherStone(s,r)){ centrarPiedra(s); s.sliding=null; snapshotPiedras(); return; }
    if (wallObjects.some(w=>rectsOverlap(r,w))){ centrarPiedra(s); s.sliding=null; snapshotPiedras(); return; }
    if (s.arenaPoints && !stoneInArena(r,s.arenaPoints)){ centrarPiedra(s); s.sliding=null; snapshotPiedras(); return; }
    const ta=tileDePiedra(s);
    const td={x:tileOwner(nx+s.width/2,TILE_W), y:tileOwner(ny+s.height/2,TILE_H)};
    if((td.x!==ta.x||td.y!==ta.y) && !celdaLibrePiedra(s,td.x,td.y)){ centrarPiedra(s); s.sliding=null; snapshotPiedras(); return; }
    s.x=nx; s.y=ny; moved++;
  }
  snapshotPiedras();
}
function updatePiedras(p){
  for (const s of stones){ if(s.sliding||s.locked) continue;
    const t=tileDePiedra(s); const cx=t.x*TILE_W+TILE_W/2, cy=t.y*TILE_H+TILE_H/2;
    if (Math.abs(s.x+s.width/2-cx)>0.5 || Math.abs(s.y+s.height/2-cy)>0.5) centrarPiedra(s); }
  for (const s of stones) if(s.sliding) stepStone(s);
}
function empujarPiedra(p,dx,dy){
  if(isTransitioning()||(!dx&&!dy)) return false;
  const m=6; const ex={x:p.x-m,y:p.y-m,width:p.width+m*2,height:p.height+m*2};
  for (const s of stones){
    if(s.locked||s.sliding) continue;
    if(!rectsOverlap(ex,s)) continue;
    const cpx=p.x+p.width/2, cpy=p.y+p.height/2, csx=s.x+s.width/2, csy=s.y+s.height/2;
    let dX=0,dY=0;
    if(dx!==0) dX = (dx>0 ? (csx>=cpx) : (csx<=cpx)) ? Math.sign(dx) : 0;
    else if(dy!==0) dY = (dy>0 ? (csy>=cpy) : (csy<=cpy)) ? Math.sign(dy) : 0;
    if(!dX&&!dY) continue;
    const t=tileDePiedra(s);
    if(!celdaLibrePiedra(s,t.x+dX,t.y+dY)) continue;
    s.sliding={dx:dX,dy:dY};
    return true;
  }
  return false;
}
function resetPiedrasPuzzle(num){
  for (const s of stones){ if(s.puzzle!==num) continue;
    s.x=s.initX; s.y=s.initY; s.locked=false; s.sliding=null; s.targetName=null; }
  for (const t of stoneTargets) if(t.puzzle===num) t.occupied=false;
  if(ESTADO){ if(ESTADO.puzzlesPiedra) delete ESTADO.puzzlesPiedra[num]; snapshotPiedras(); }
}
let rbStepped=new Set();
function checkResetButtons(p){
  if(isTransitioning()) return;
  const touched=new Set();
  for (const rb of resetButtons) if(rectsOverlap(p,rb)) touched.add(rb.name);
  for (const n of touched){
    if(rbStepped.has(n)) continue;
    if(isButtonActive(n)) continue;   // 🔒 mientras está prendido (5s) no se repisa
    const rb=resetButtons.find(r=>r.name===n); if(!rb||isNaN(rb.num)) continue;
    if (ESTADO && ESTADO.puzzlesPiedra && ESTADO.puzzlesPiedra[rb.num]) continue; // ya completado
    resetPiedrasPuzzle(rb.num);
    activateButton(n);                // 💡 animación de prendido 5s, igual que los TB
  }
  rbStepped=touched;
}
function drawPIOverlays(ctx,cv,cam){
  if(!piImage||!piImage.complete||piImage.failed) return;
  const rec=(typeof PI_RECORTES!=="undefined")?PI_RECORTES:{};
  const dx0=(typeof PI_DX!=="undefined")?PI_DX:0, dy0=(typeof PI_DY!=="undefined")?PI_DY:0;
  for (const s of stones){
    const r=rec[s.name]||rec["*"]; if(!r) continue;
    ctx.drawImage(piImage, r[0],r[1],r[2],r[3],
      Math.round(s.x+s.width/2-r[2]/2+dx0-cam.x), Math.round(s.y+s.height/2-r[3]/2+dy0-cam.y), r[2], r[3]);
  }
}

// ---------- pinchos (PINx) ----------
function initSpikes(){
  spikes=[];
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if(o.name && /^PIN\d+$/i.test(o.name))
      spikes.push({name:o.name,num:parseInt(o.name.replace(/^PIN/i,""),10),x:o.x,y:o.y,width:o.width||TILE_W,height:o.height||TILE_H}); }
}
function drawSpikes(ctx,cam){
  for (const sp of spikes){
    const img = loadedImages[spikeDesactivado(sp)?SPIKE_LOW:SPIKE_HIGH];
    if(!img||!img.complete||img.failed) continue;
    ctx.drawImage(img, Math.round(sp.x-cam.x), Math.round(sp.y-cam.y), sp.width, sp.height);
  }
}

// ---------- carteles (Cx) y guardado (GUAx) ----------
let signs=[], guardados=[];
function initSignObjects(){
  signs=[]; guardados=[];
  const cap = mapData.layers.find(l=>l.name==="Interactuable-Pared");
  if (cap) for (const o of (cap.objects||[])) if(o.name && /^C\d+$/i.test(o.name)) signs.push(o);
  for (const l of mapData.layers){ if(l.type!=="objectgroup") continue;
    for (const o of (l.objects||[])) if(o.name && /^GUA\d+$/i.test(o.name)) guardados.push(o); }
}
function getSignAtPlayer(p){
  const h={x:p.x-8,y:p.y-8,width:p.width+16,height:p.height+16};
  for (const s of signs) if(rectsOverlap(h,s)){
    const t=(typeof CARTELES_TEXTOS!=="undefined")?CARTELES_TEXTOS:{};
    return {name:s.name, texto:t[s.name]||t["*"]||""};
  }
  return null;
}
function getGuardadoAtPlayer(p){
  const h={x:p.x-8,y:p.y-8,width:p.width+16,height:p.height+16};
  for (const g of guardados) if(rectsOverlap(h,g)) return g;
  return null;
}

// ---------- dibujo ----------
function drawTile(ctx,gid,wx,wy,cam){
  const r=tilesetRanges.find(x=>gid>=x.firstgid&&gid<=x.lastgid); if(!r) return;
  const img=loadedImages[r.image]; if(!img||!img.complete||img.failed) return;
  const li=gid-r.firstgid; const col=li%r.columns, row=Math.floor(li/r.columns);
  const sx=(r.margin||0)+col*(TILE_W+(r.spacing||0)), sy=(r.margin||0)+row*(TILE_H+(r.spacing||0));
  ctx.drawImage(img,sx,sy,TILE_W,TILE_H, Math.round(wx*TILE_W-cam.x), Math.round(wy*TILE_H-cam.y), TILE_W,TILE_H);
}
function drawScene(ctx,cv,p,cam){
  ctx.fillStyle="black"; ctx.fillRect(0,0,cv.width,cv.height);
  if(!mapData) return;
  const w=worldBounds.maxX-worldBounds.minX, h=worldBounds.maxY-worldBounds.minY;
  if (w<=cv.width) cam.x=worldBounds.minX+(w-cv.width)/2;
  else cam.x=Math.max(worldBounds.minX, Math.min(p.x-cv.width/2, worldBounds.maxX-cv.width));
  if (h<=cv.height) cam.y=worldBounds.minY+(h-cv.height)/2;
  else cam.y=Math.max(worldBounds.minY, Math.min(p.y-cv.height/2, worldBounds.maxY-cv.height));
  cam.x=Math.round(cam.x); cam.y=Math.round(cam.y);
  for (const n of TILE_LAYER_NAMES){ const t=decodedLayers[n]; if(!t) continue;
    for (const q of t) drawTile(ctx,q.gid,q.tileX,q.tileY,cam); }
}

// ---------- carga de mapa ----------
async function loadMap(name){
  const url=MAPS_FOLDER+name+MAP_EXT;
  const res=await fetch(url,{cache:"no-store"});
  if(!res.ok) throw new Error("No se pudo cargar el mapa "+res.status);
  const txt=(await res.text()).trim();
  if(txt.startsWith("<")) throw new Error("El mapa no es JSON");
  mapData=JSON.parse(txt);
  TILE_W=mapData.tilewidth||20; TILE_H=mapData.tileheight||20;
  currentMapName=name;
  if (ESTADO) ESTADO.mapaActual=name;
  tilesetRanges.length=0; for (const k in decodedLayers) delete decodedLayers[k];
  initMapObjects(); initStoneObjects(); initSpikes(); initSignObjects(); initCaidas(); initPeleas();
  buildTilesetRanges(); decodeAllLayers(); computeWorldBounds();
  await loadImages();
  // Imagen de las piedras: reusa la que ya cargó loadImages() más arriba
  // (mismo tileset del piso), en vez de pedirla de nuevo por separado.
  const ruta=(typeof PI_IMAGEN!=="undefined"&&PI_IMAGEN)?PI_IMAGEN:null;
  if(ruta) piImage = loadedImages[ruta] || piImage;
}
function initMapObjects(){
  const wl=mapData.layers.find(l=>l.name==="Interactuable");
  wallObjects = wl ? wl.objects.filter(o=>{
    if(!o.name) return true;
    if(/^(PI|PL|RB|PUZ|PIN)\d+$/i.test(o.name)) return false;
    if(/^cai$/i.test(o.name.trim())) return false;
    return true;
  }) : [];
  const dl=mapData.layers.find(l=>l.name==="Doors");
  doors = dl?dl.objects:[]; doorsByName={}; for (const d of doors) doorsByName[d.name]=d;
  const bl=mapData.layers.find(l=>l.name===getPuzzleCapa());
  buttons = bl?bl.objects:[]; buttonsByName={}; for (const b of buttons) if(b.name) buttonsByName[b.name]=b;
  const bc=TILESET_CONFIG["spr_groundswitch1_1.tsx"];
  if (bc && !buttonOnImage){ buttonOnImage=new Image(); buttonOnImage.src=TILE_FOLDER+bc.image; }
}

// ---------- init ----------
async function initMapRender(estado, mapaInicial){
  ESTADO = estado;
  await loadMap(mapaInicial || (estado && estado.mapaActual) || "H1");
  return getDefaultSpawn();
}
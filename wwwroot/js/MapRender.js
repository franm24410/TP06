// mapRender.js
// Carga el mapa exportado de Tiled (TileMaps.MAPATERMINADOAHORASI) y lo dibuja
// en el canvas, mostrando solo la habitación (room) donde está el jugador.

const mapData = TileMaps["MAPATERMINADOAHORASI"];
const TILE_W = mapData.tilewidth;   // 20
const TILE_H = mapData.tileheight;  // 20

// ---------------------------------------------------------------------
// 1. CONFIGURACIÓN DE TILESETS
// ---------------------------------------------------------------------
const TILE_FOLDER = "/Tiles/";

const TILESET_CONFIG = {
  "bg_ruinseasynam1.tsx": { image: "bg_ruinseasynam1.png", columns: 8 },
  "bg_ruinseasynam2.tsx": { image: "bg_ruinseasynam2.png", columns: 8 },
  "bg_ruinseasynam3.tsx": { image: "bg_ruinseasynam3.png", columns: 8 },
  "bg_ruintiles1.tsx":    { image: "bg_ruintiles1.png",    columns: 6 },
  "bg_tundratiles.tsx":   { image: "bg_tundratiles.png",   columns: 9 },
  "spr_snowpap_0.tsx":         { image: "spr_snowpap_0.png",         columns: 1 },
  "spr_groundswitch1_0.tsx":   { image: "spr_groundswitch1_0.png",   columns: 1 },
  "spr_groundswitch1_1.tsx":   { image: "spr_groundswitch1_1.png",   columns: 1 },
  "spr_npc_sign_0.tsx":        { image: "spr_npc_sign_0.png",        columns: 1 },
  "spr_smallweb_0.tsx":        { image: "spr_smallweb_0.png",        columns: 1 },
  "spr_xmastree_0.tsx":        { image: "spr_xmastree_0.png",        columns: 1 },
  "spr_spiketile_0.tsx":       { image: "spr_spiketile_0.png",       columns: 1 },
  "spr_spiketile_1.tsx":       { image: "spr_spiketile_1.png",       columns: 1 },
  "spr_papyrushouse_0.tsx":    { image: "spr_papyrushouse_0.png",    columns: 1 },
  "spr_snowdinlogo_ja_0.tsx":  { image: "spr_snowdinlogo_ja_0.png",  columns: 1 },
  "spr_vinespillar_0.tsx":     { image: "spr_vinespillar_0.png",     columns: 1 },
};

function getFileName(path) {
  if (!path) return null;
  return path.split(/[\\/]/).pop();
}

const loadedImages = {};
const tilesetRanges = [];

function buildTilesetRanges() {
  const list = mapData.tilesets;
  for (let i = 0; i < list.length; i++) {
    const ts = list[i];
    const nextFirstgid = list[i + 1] ? list[i + 1].firstgid : Infinity;

    if (ts.image) {
      tilesetRanges.push({
        firstgid: ts.firstgid,
        lastgid: nextFirstgid - 1,
        columns: ts.columns,
        image: TILE_FOLDER + getFileName(ts.image),
      });
      continue;
    }

    const fileName = getFileName(ts.source);
    const config = fileName ? TILESET_CONFIG[fileName] : null;
    if (!config) {
      console.warn("Falta agregar a TILESET_CONFIG:", fileName || "(tileset sin nombre)");
      continue;
    }
    tilesetRanges.push({
      firstgid: ts.firstgid,
      lastgid: nextFirstgid - 1,
      columns: config.columns,
      image: TILE_FOLDER + config.image,
    });
  }
}

function loadImages() {
  const promises = [];
  for (const range of tilesetRanges) {
    if (loadedImages[range.image]) continue;
    const img = new Image();
    const p = new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => { console.error("No se pudo cargar imagen:", range.image); img.failed = true; resolve(); };
    });
    img.src = range.image;
    loadedImages[range.image] = img;
    promises.push(p);
  }
  return Promise.all(promises);
}

// ---------------------------------------------------------------------
// 2. DECODIFICAR CAPAS
// ---------------------------------------------------------------------
const FLIP_MASK = 0x1FFFFFFF;

function decodeChunkData(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const gids = new Uint32Array(bytes.buffer);
  return gids;
}

function getLayerTiles(layer) {
  const tiles = [];
  if (!layer.chunks) return tiles;
  for (const chunk of layer.chunks) {
    const gids = decodeChunkData(chunk.data);
    for (let row = 0; row < chunk.height; row++) {
      for (let col = 0; col < chunk.width; col++) {
        const rawGid = gids[row * chunk.width + col];
        const gid = rawGid & FLIP_MASK;
        if (gid === 0) continue;
        tiles.push({
          gid,
          tileX: chunk.x + col,
          tileY: chunk.y + row,
        });
      }
    }
  }
  return tiles;
}

const TILE_LAYER_NAMES = ["background", "Piso", "Paredes", "Detalles-Piso", "Detalles-Pared", "Objeto"];
const decodedLayers = {};

function decodeAllLayers() {
  for (const name of TILE_LAYER_NAMES) {
    const layer = mapData.layers.find(l => l.name === name);
    if (layer) decodedLayers[name] = getLayerTiles(layer);
  }
}

// ---------------------------------------------------------------------
// 3. ROOMS
// ---------------------------------------------------------------------
const roomsLayer = mapData.layers.find(l => l.name === "Rooms");
const rooms = roomsLayer ? roomsLayer.objects : [];

function getAbsolutePoints(obj) {
  if (obj.polygon) {
    return obj.polygon.map(p => ({ x: obj.x + p.x, y: obj.y + p.y }));
  }
  return [
    { x: obj.x, y: obj.y },
    { x: obj.x + obj.width, y: obj.y },
    { x: obj.x + obj.width, y: obj.y + obj.height },
    { x: obj.x, y: obj.y + obj.height },
  ];
}

function pointInPolygon(px, py, points) {
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i].x, yi = points[i].y;
    const xj = points[j].x, yj = points[j].y;
    const intersect = ((yi > py) !== (yj > py)) &&
      (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

function getCurrentRoomName(player) {
  for (const room of rooms) {
    const points = getAbsolutePoints(room);
    if (pointInPolygon(player.x, player.y, points)) return room.name;
  }
  return null;
}

function getRoomPartsByName(name) {
  return rooms.filter(r => r.name === name).map(getAbsolutePoints);
}

// ---------------------------------------------------------------------
// 3c. COLISIÓN DE PAREDES
// ---------------------------------------------------------------------
const wallsLayer = mapData.layers.find(l => l.name === "Interactuable");
const wallObjects = wallsLayer ? wallsLayer.objects : [];

function rectHitsWall(rect) {
  return wallObjects.some(obj => rectsOverlap(rect, obj));
}

function moveWithWallCollision(player, dx, dy) {
  if (dx !== 0) {
    const testX = { x: player.x + dx, y: player.y, width: player.width, height: player.height };
    if (!rectHitsWall(testX)) player.x += dx;
  }
  if (dy !== 0) {
    const testY = { x: player.x, y: player.y + dy, width: player.width, height: player.height };
    if (!rectHitsWall(testY)) player.y += dy;
  }
}

// ---------------------------------------------------------------------
// 3b. DOORS (puertas)
// ---------------------------------------------------------------------
const doorsLayer = mapData.layers.find(l => l.name === "Doors");
const doors = doorsLayer ? doorsLayer.objects : [];

const doorsByName = {};
for (const d of doors) doorsByName[d.name] = d;

function propsToObject(obj) {
  const result = {};
  if (obj.properties) {
    for (const p of obj.properties) result[p.name] = p.value;
  }
  return result;
}

function rectsOverlap(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

const DIRECTION_OFFSETS = {
  up:    { x: 0, y: -1 },
  down:  { x: 0, y: 1 },
  left:  { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

function getDoorSpawnPoint(door) {
  const props = propsToObject(door);
  const dir = DIRECTION_OFFSETS[props.direction] || { x: 0, y: 1 };

  let spawnX = door.x + door.width / 2;
  let spawnY = door.y + door.height / 2;

  if (dir.x !== 0) {
    spawnX = dir.x > 0 ? door.x + door.width + TILE_W / 2 : door.x - TILE_W / 2;
  }
  if (dir.y !== 0) {
    spawnY = dir.y > 0 ? door.y + door.height + TILE_H / 2 : door.y - TILE_H / 2;
  }

  return { x: spawnX, y: spawnY };
}

let doorTransition = null;
let lastUsedDoor = null;

function isTransitioning() {
  return doorTransition !== null;
}

function startDoorTransition(player, targetX, targetY, arrivalDoor, duration = 500) {
  if (doorTransition) return;
  doorTransition = { player, timer: 0, duration, targetX, targetY, teleported: false, arrivalDoor };
}

function updateDoorTransition(deltaTime) {
  if (!doorTransition) return;
  doorTransition.timer += deltaTime;
  const half = doorTransition.duration / 2;

  if (!doorTransition.teleported && doorTransition.timer >= half) {
    doorTransition.player.x = doorTransition.targetX;
    doorTransition.player.y = doorTransition.targetY;
    doorTransition.teleported = true;
    lastUsedDoor = doorTransition.arrivalDoor;
  }
  if (doorTransition.timer >= doorTransition.duration) {
    doorTransition = null;
  }
}

function getTransitionAlpha() {
  if (!doorTransition) return 0;
  const half = doorTransition.duration / 2;
  if (doorTransition.timer < half) {
    return doorTransition.timer / half;
  }
  return 1 - (doorTransition.timer - half) / half;
}

function drawTransitionOverlay(ctx, canvas) {
  const alpha = getTransitionAlpha();
  if (alpha <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
}

function checkDoors(player) {
  if (isTransitioning()) return;

  if (lastUsedDoor && !rectsOverlap(player, lastUsedDoor)) {
    lastUsedDoor = null;
  }

  for (const door of doors) {
    if (door === lastUsedDoor) continue;
    if (rectsOverlap(player, door)) {
      const props = propsToObject(door);
      const targetName = "ph" + props.targetDoor;
      const targetDoor = doorsByName[targetName];
      if (!targetDoor) {
        console.warn("La puerta", door.name, "apunta a una puerta que no existe:", targetName);
        return;
      }
      const spawn = getDoorSpawnPoint(targetDoor);
      const finalX = spawn.x - player.width / 2;
      const finalY = spawn.y - player.height / 2;
      startDoorTransition(player, finalX, finalY, targetDoor);
      break;
    }
  }
}

// ---------------------------------------------------------------------
// 3d. BUTTONS (botones de puzzle) — 4 combinaciones de 2 botones en orden
// ---------------------------------------------------------------------
const buttonsLayer = mapData.layers.find(l => l.name === "Buttons");
const buttons = buttonsLayer ? buttonsLayer.objects : [];

// Estado de cada puzzle: { currentStep, totalSteps, activated, solved }
const puzzleStates = {};

// Set de botones que el jugador está pisando actualmente (para evitar re-procesar)
let currentButtonsStepped = new Set();

/**
 * Obtiene el nombre único de un botón (usa 'name' si existe, sino genera uno)
 */
function getButtonName(button) {
  return button.name || `btn_${button.id || Math.random()}`;
}

/**
 * Verifica colisiones con botones y gestiona la lógica del puzzle
 */
function checkButtons(player) {
  if (isTransitioning()) return;
  
  const touchedNow = new Set();
  
  // Detectar qué botones está pisando el jugador
  for (const button of buttons) {
    if (rectsOverlap(player, button)) {
      touchedNow.add(getButtonName(button));
    }
  }
  
  // Procesar solo botones nuevos (no procesar si ya estaba encima)
  for (const buttonName of touchedNow) {
    if (currentButtonsStepped.has(buttonName)) continue;
    
    const button = buttons.find(b => getButtonName(b) === buttonName);
    if (!button) continue;
    
    const props = propsToObject(button);
    const puzzleId = props.puzzleId;
    const order = parseInt(props.order);
    
    if (!puzzleId || !order) continue;
    
    // Inicializar estado del puzzle si no existe
    if (!puzzleStates[puzzleId]) {
      puzzleStates[puzzleId] = {
        currentStep: 1,
        totalSteps: 2,
        activated: [],
        solved: false,
      };
    }
    
    const state = puzzleStates[puzzleId];
    if (state.solved) continue;
    
    // Verificar si es el siguiente botón en la secuencia
    if (order === state.currentStep) {
      state.activated.push(buttonName);
      state.currentStep++;
      
      // Verificar si completó el puzzle
      if (state.currentStep > state.totalSteps) {
        state.solved = true;
        console.log("✅ Puzzle resuelto:", puzzleId);
        // Aquí puedes disparar eventos (abrir puertas, dar items, etc.)
      }
    } else {
      // Orden incorrecto: resetear el puzzle
      console.log("❌ Orden incorrecto, reseteando puzzle:", puzzleId);
      state.activated = [];
      state.currentStep = 1;
    }
  }
  
  currentButtonsStepped = touchedNow;
}

/**
 * Dibuja el sprite "activado" encima de los botones pisados correctamente
 */
function drawButtonOverlays(ctx, canvas, camera) {
  const activatedImagePath = TILE_FOLDER + TILESET_CONFIG["spr_groundswitch1_1.tsx"].image;
  const activatedImage = loadedImages[activatedImagePath];
  
  if (!activatedImage || !activatedImage.complete || activatedImage.failed) return;
  
  for (const button of buttons) {
    const props = propsToObject(button);
    const puzzleId = props.puzzleId;
    if (!puzzleId) continue;
    
    const state = puzzleStates[puzzleId];
    if (!state) continue;
    
    const buttonName = getButtonName(button);
    const isActivated = state.activated.includes(buttonName) || state.solved;
    
    // Si el botón está activado, dibujar el sprite "pisado" encima
    if (isActivated) {
      ctx.drawImage(
        activatedImage,
        button.x - camera.x,
        button.y - camera.y,
        button.width,
        button.height
      );
    }
  }
}

// ---------------------------------------------------------------------
// 4. DIBUJADO
// ---------------------------------------------------------------------
function drawTile(ctx, gid, worldX, worldY, camera) {
  const range = tilesetRanges.find(r => gid >= r.firstgid && gid <= r.lastgid);
  if (!range) return;
  const img = loadedImages[range.image];
  if (!img || !img.complete || img.failed) return;

  const localId = gid - range.firstgid;
  const margin = range.margin || 0;
  const spacing = range.spacing || 0;
  const col = localId % range.columns;
  const row = Math.floor(localId / range.columns);
  const sx = margin + col * (TILE_W + spacing);
  const sy = margin + row * (TILE_H + spacing);

  const dx = worldX * TILE_W - camera.x;
  const dy = worldY * TILE_H - camera.y;
  ctx.drawImage(img, sx, sy, TILE_W, TILE_H, dx, dy, TILE_W, TILE_H);
}

function drawScene(ctx, canvas, player, camera) {
  const currentRoomName = getCurrentRoomName(player);
  const roomParts = currentRoomName ? getRoomPartsByName(currentRoomName) : [];

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (roomParts.length === 0) {
    return;
  }

  const allPoints = roomParts.flat();
  const minX = Math.min(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const maxY = Math.max(...allPoints.map(p => p.y));

  camera.x = Math.max(minX, Math.min(player.x - canvas.width / 2, Math.max(minX, maxX - canvas.width)));
  camera.y = Math.max(minY, Math.min(player.y - canvas.height / 2, Math.max(minY, maxY - canvas.height)));

  ctx.save();
  ctx.beginPath();
  for (const points of roomParts) {
    ctx.moveTo(points[0].x - camera.x, points[0].y - camera.y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x - camera.x, points[i].y - camera.y);
    }
    ctx.closePath();
  }
  ctx.clip();

  for (const name of TILE_LAYER_NAMES) {
    const tiles = decodedLayers[name];
    if (!tiles) continue;
    for (const t of tiles) {
      drawTile(ctx, t.gid, t.tileX, t.tileY, camera);
    }
  }

  ctx.restore();
}

// ---------------------------------------------------------------------
// 5. INICIALIZACIÓN
// ---------------------------------------------------------------------
async function initMapRender() {
  buildTilesetRanges();
  decodeAllLayers();
  await loadImages();
  console.log("Mapa cargado:", mapData.width, "x", mapData.height, "| Rooms encontradas:", rooms.length);
}
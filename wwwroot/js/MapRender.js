// mapRender.js
// Carga el mapa exportado de Tiled (formato JSON, extensión .tmj) con fetch
// y lo dibuja en el canvas, mostrando solo la habitación (room) donde está el jugador.

// URL del mapa .tmj (se puede sobrescribir desde la vista con window.MAP_URL)
const MAP_URL = window.MAP_URL || "/Tiles/MAPATERMINADOAHORASI.tmj";

let mapData = null;
let TILE_W = 20;
let TILE_H = 20;

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

    // Caso 1: tileset embebido (trae "image" directo, sin tabla externa)
    if (ts.image) {
      tilesetRanges.push({
        firstgid: ts.firstgid,
        lastgid: nextFirstgid - 1,
        columns: ts.columns,
        image: TILE_FOLDER + getFileName(ts.image),
        margin: ts.margin || 0,
        spacing: ts.spacing || 0,
      });
      continue;
    }

    // Caso 2: tileset externo (.tsx) -> matcheamos por nombre de archivo
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
      margin: 0,
      spacing: 0,
    });
  }
}

function loadImages() {
  const promises = [];
  const imagesToLoad = new Set(tilesetRanges.map(r => r.image));

  // Asegurar que el sprite de botón activado esté cargado
  const buttonOnConfig = TILESET_CONFIG["spr_groundswitch1_1.tsx"];
  if (buttonOnConfig && buttonOnConfig.image) {
    imagesToLoad.add(TILE_FOLDER + buttonOnConfig.image);
  }

  for (const imagePath of imagesToLoad) {
    if (loadedImages[imagePath]) continue;
    const img = new Image();
    const p = new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => { console.error("No se pudo cargar imagen:", imagePath); img.failed = true; resolve(); };
    });
    img.src = imagePath;
    loadedImages[imagePath] = img;
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
// HELPERS
// ---------------------------------------------------------------------
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

// ---------------------------------------------------------------------
// 3. ROOMS
// ---------------------------------------------------------------------
let rooms = [];

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
let wallObjects = [];

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
let doors = [];
let doorsByName = {};

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
    doorTransition.player.x = Math.round(doorTransition.targetX);
    doorTransition.player.y = Math.round(doorTransition.targetY);
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
// 3d. PUZZLE DE BOTONES (TB1..TB12)
// ---------------------------------------------------------------------
let buttons = [];
let buttonsByName = {};

const PUZZLE_CAPA_BOTONES_DEFAULT = "Interactuable-Piso";
const PUZZLE_SECUENCIAS_DEFAULT = [[1, 3], [5, 7], [2, 9], [8, 12]];
const PUZZLE_TIEMPO_LIMITE_DEFAULT = 5000;
const PUZZLE_URL_GUARDAR_DEFAULT = "/Puzzle/Complete";

function getPuzzleCapa() {
  return (typeof PUZZLE_CAPA_BOTONES !== "undefined") ? PUZZLE_CAPA_BOTONES : PUZZLE_CAPA_BOTONES_DEFAULT;
}
function getPuzzleSecuencias() {
  return (typeof PUZZLE_SECUENCIAS !== "undefined") ? PUZZLE_SECUENCIAS : PUZZLE_SECUENCIAS_DEFAULT;
}
function getPuzzleTiempoLimite() {
  return (typeof PUZZLE_TIEMPO_LIMITE !== "undefined") ? PUZZLE_TIEMPO_LIMITE : PUZZLE_TIEMPO_LIMITE_DEFAULT;
}
function getPuzzleUrlGuardar() {
  return (typeof PUZZLE_URL_GUARDAR !== "undefined") ? PUZZLE_URL_GUARDAR : PUZZLE_URL_GUARDAR_DEFAULT;
}

let buttonOnImage = null;

let puzzleRondaActual = 0;
let puzzleEsperandoSegundo = false;
let puzzleCompletado = false;
let puzzleBotonesActivos = {};

function activateButton(nombreBoton) {
  puzzleBotonesActivos[nombreBoton] = Date.now() + getPuzzleTiempoLimite();
}

function isButtonActive(nombreBoton) {
  const expira = puzzleBotonesActivos[nombreBoton];
  if (!expira) return false;
  return Date.now() < expira;
}

function resetPuzzle() {
  puzzleRondaActual = 0;
  puzzleEsperandoSegundo = false;
  puzzleBotonesActivos = {};
  console.log("🔴 Puzzle reiniciado");
}

function cleanupExpiredButtons() {
  const ahora = Date.now();
  const secuencias = getPuzzleSecuencias();

  for (const nombre in puzzleBotonesActivos) {
    if (ahora >= puzzleBotonesActivos[nombre]) {
      delete puzzleBotonesActivos[nombre];

      if (puzzleEsperandoSegundo) {
        const secuencia = secuencias[puzzleRondaActual];
        if (secuencia) {
          const nombrePrimerBoton = "TB" + secuencia[0];
          if (nombre === nombrePrimerBoton) {
            console.log("⏰ Tiempo agotado, reiniciando puzzle");
            resetPuzzle();
          }
        }
      }
    }
  }
}

function checkButtons(player) {
  if (isTransitioning()) return;

  cleanupExpiredButtons();

  const secuencias = getPuzzleSecuencias();

  for (const button of buttons) {
    if (!rectsOverlap(player, button)) continue;

    const nombreBoton = button.name;
    const numeroBoton = parseInt(nombreBoton.replace("TB", ""));
    if (isNaN(numeroBoton)) continue;

    // 🔒 BOTÓN BLOQUEADO: si está prendido (lo tocaste hace menos de 5s),
    // se ignora por completo hasta que se apague. Así no se detecta
    // "muchísimas veces" mientras estás parado encima.
    if (isButtonActive(nombreBoton)) continue;

    // --- Lógica de secuencia (solo si el puzzle no está completado) ---
    if (!puzzleCompletado) {
      const secuencia = secuencias[puzzleRondaActual];

      if (secuencia) {
        const esperadoPrimero = secuencia[0];
        const esperadoSegundo = secuencia[1];

        if (!puzzleEsperandoSegundo) {
          // Esperando el PRIMER botón de la ronda
          if (numeroBoton === esperadoPrimero) {
            puzzleEsperandoSegundo = true;
            console.log(`✅ Ronda ${puzzleRondaActual + 1}: primer botón correcto (${nombreBoton})`);
          } else {
            console.log(`❌ Botón incorrecto (esperaba TB${esperadoPrimero}, tocaste ${nombreBoton})`);
            resetPuzzle();
          }
        } else {
          // Esperando el SEGUNDO botón de la ronda
          if (numeroBoton === esperadoSegundo) {
            const nombrePrimerBoton = "TB" + esperadoPrimero;

            if (isButtonActive(nombrePrimerBoton)) {
              puzzleEsperandoSegundo = false;
              puzzleRondaActual++;
              console.log(`✅ Ronda ${puzzleRondaActual} completada`);

              if (puzzleRondaActual >= secuencias.length) {
                puzzleCompletado = true;
                console.log("🎉 ¡PUZZLE COMPLETADO!");
                guardarPuzzleEnBD();
              }
            } else {
              console.log("⏰ El primer botón se apagó, reiniciando");
              resetPuzzle();
            }
          } else if (numeroBoton !== esperadoPrimero) {
            console.log(`❌ Botón incorrecto (esperaba TB${esperadoSegundo}, tocaste ${nombreBoton})`);
            resetPuzzle();
          }
        }
      }
    }

    // Feedback visual: se prende por 5s (y queda bloqueado esos mismos 5s)
    activateButton(nombreBoton);

    break; // Solo procesar un botón por frame
  }
}

function guardarPuzzleEnBD() {
  fetch(getPuzzleUrlGuardar(), {
    method: "POST",
    headers: { "Content-Type": "application/json" }
  })
  .then(res => res.json())
  .then(data => {
    console.log("💾 Puzzle guardado en BD:", data);
  })
  .catch(err => {
    console.error("❌ Error guardando puzzle:", err);
  });
}

function drawButtonOverlays(ctx, canvas, camera) {
  if (!buttonOnImage || !buttonOnImage.complete || buttonOnImage.failed) return;

  const w = buttonOnImage.naturalWidth || TILE_W;
  const h = buttonOnImage.naturalHeight || TILE_H;

  for (const nombre in puzzleBotonesActivos) {
    const button = buttonsByName[nombre];
    if (!button) continue;

    const centerX = button.x + (button.width || TILE_W) / 2;
    const centerY = button.y + (button.height || TILE_H) / 2;

    ctx.drawImage(
      buttonOnImage,
      Math.round(centerX - w / 2 - camera.x),
      Math.round(centerY - h / 2 - camera.y),
      w,
      h
    );
  }
}

// ---------------------------------------------------------------------
// 3e. OBJETOS PIx — recorte de imagen debajo del objeto
// ---------------------------------------------------------------------
let piObjects = [];
let piImage = null;

function initPIObjects() {
  piObjects = [];

  // Busca en TODAS las capas de objetos los que se llamen PI1, PI2, ...
  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && /^PI\d+$/i.test(obj.name)) {
        piObjects.push(obj);
      }
    }
  }

  const ruta = (typeof PI_IMAGEN !== "undefined" && PI_IMAGEN) ? PI_IMAGEN : null;
  if (ruta) {
    piImage = new Image();
    piImage.onerror = () => {
      console.error("No se pudo cargar PI_IMAGEN:", ruta);
      piImage.failed = true;
    };
    piImage.src = ruta;
  }
}

function drawPIOverlays(ctx, canvas, camera) {
  if (!piImage || !piImage.complete || piImage.failed) return;

  const recortes = (typeof PI_RECORTES !== "undefined") ? PI_RECORTES : {};
  const dx0 = (typeof PI_DX !== "undefined") ? PI_DX : 0;
  const dy0 = (typeof PI_DY !== "undefined") ? PI_DY : -6;

  for (const obj of piObjects) {
    const r = recortes[obj.name] || recortes["*"];
    if (!r) continue;

    const sx = r[0], sy = r[1], sw = r[2], sh = r[3];

    // Centrado horizontalmente, pegado ABAJO de la hitbox del objeto
    const destX = Math.round(obj.x + obj.width / 2 - sw / 2 + dx0 - camera.x);
    const destY = Math.round(obj.y + obj.height + dy0 - camera.y);

    // Solo se dibuja el cuadradito recortado, no la imagen entera
    ctx.drawImage(piImage, sx, sy, sw, sh, destX, destY, sw, sh);
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

  const dx = Math.round(worldX * TILE_W - camera.x);
  const dy = Math.round(worldY * TILE_H - camera.y);
  ctx.drawImage(img, sx, sy, TILE_W, TILE_H, dx, dy, TILE_W, TILE_H);
}

function drawScene(ctx, canvas, player, camera) {
  const currentRoomName = getCurrentRoomName(player);
  const roomParts = currentRoomName ? getRoomPartsByName(currentRoomName) : [];

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (roomParts.length === 0) return;

  const allPoints = roomParts.flat();
  const minX = Math.min(...allPoints.map(p => p.x));
  const minY = Math.min(...allPoints.map(p => p.y));
  const maxX = Math.max(...allPoints.map(p => p.x));
  const maxY = Math.max(...allPoints.map(p => p.y));

  camera.x = Math.max(minX, Math.min(player.x - canvas.width / 2, Math.max(minX, maxX - canvas.width)));
  camera.y = Math.max(minY, Math.min(player.y - canvas.height / 2, Math.max(minY, maxY - canvas.height)));

  // Cámara en píxeles enteros (evita líneas entre tiles)
  camera.x = Math.round(camera.x);
  camera.y = Math.round(camera.y);

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
// 5. CARGA DEL MAPA .tmj
// ---------------------------------------------------------------------
async function loadMapData() {
  const res = await fetch(MAP_URL, { cache: "no-store" });

  if (!res.ok) {
    throw new Error(`No se pudo cargar el mapa: HTTP ${res.status} - ${MAP_URL}`);
  }

  const texto = (await res.text()).trim();

  // Si llega XML (<...tmx) o HTML de error, lo avisamos claro
  if (texto.startsWith("<")) {
    throw new Error(
      `MAP_URL apunta a un archivo XML (.tmx) o a una página de error: "${MAP_URL}". ` +
      `El juego necesita el mapa en formato JSON (.tmj o .json)`
    );
  }

  mapData = JSON.parse(texto);

  TILE_W = mapData.tilewidth || 20;
  TILE_H = mapData.tileheight || 20;
}

function initMapObjects() {
  const roomsLayer = mapData.layers.find(l => l.name === "Rooms");
  rooms = roomsLayer ? roomsLayer.objects : [];

  const wallsLayer = mapData.layers.find(l => l.name === "Interactuable");
  wallObjects = wallsLayer ? wallsLayer.objects : [];

  const doorsLayer = mapData.layers.find(l => l.name === "Doors");
  doors = doorsLayer ? doorsLayer.objects : [];
  doorsByName = {};
  for (const d of doors) doorsByName[d.name] = d;

  const nombreCapaBotones = getPuzzleCapa();
  const buttonsLayer = mapData.layers.find(l => l.name === nombreCapaBotones);
  buttons = buttonsLayer ? buttonsLayer.objects : [];
  buttonsByName = {};
  for (const b of buttons) {
    if (b.name) buttonsByName[b.name] = b;
  }

  const buttonOnConfig = TILESET_CONFIG["spr_groundswitch1_1.tsx"];
  if (buttonOnConfig && buttonOnConfig.image) {
    buttonOnImage = new Image();
    buttonOnImage.src = TILE_FOLDER + buttonOnConfig.image;
  }
}

// ---------------------------------------------------------------------
// 6. INICIALIZACIÓN
// ---------------------------------------------------------------------
async function initMapRender() {
  await loadMapData();
  initMapObjects();
  initPIObjects();
  buildTilesetRanges();
  decodeAllLayers();
  await loadImages();
  console.log("Mapa cargado:", mapData.width, "x", mapData.height, "| Rooms encontradas:", rooms.length);
}
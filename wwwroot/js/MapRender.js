// mapRender.js — versión MULTI-MAPA
// Cada habitación es un archivo propio (H1.tmj, H2.tmj, ...) en wwwroot/Tiles.
// Las puertas (capa Doors) con propiedades targetMap + targetDoor + direction
// cambian de mapa con transición de pantalla negra de 0.5s.

const MAPS_FOLDER = "/Tiles/";
const MAP_EXT = ".tmj";
const MAPA_INICIAL = window.MAPA_INICIAL || "H1";

let mapData = null;
let currentMapName = null;
let TILE_W = 20;
let TILE_H = 20;

// Límites REALES del contenido del mapa (se calculan desde los tiles decodificados)
let worldBounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

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
        margin: ts.margin || 0,
        spacing: ts.spacing || 0,
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
      margin: 0,
      spacing: 0,
    });
  }
}

function loadImages() {
  const promises = [];
  const imagesToLoad = new Set(tilesetRanges.map(r => r.image));

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
// 2. DECODIFICAR CAPAS (soporta chunks base64, base64 entero y CSV)
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

  if (layer.chunks) {
    for (const chunk of layer.chunks) {
      const gids = decodeChunkData(chunk.data);
      for (let row = 0; row < chunk.height; row++) {
        for (let col = 0; col < chunk.width; col++) {
          const gid = gids[row * chunk.width + col] & FLIP_MASK;
          if (gid === 0) continue;
          tiles.push({ gid, tileX: chunk.x + col, tileY: chunk.y + row });
        }
      }
    }
    return tiles;
  }

  if (typeof layer.data === "string") {
    const gids = decodeChunkData(layer.data);
    for (let row = 0; row < layer.height; row++) {
      for (let col = 0; col < layer.width; col++) {
        const gid = gids[row * layer.width + col] & FLIP_MASK;
        if (gid === 0) continue;
        tiles.push({ gid, tileX: col, tileY: row });
      }
    }
    return tiles;
  }

  if (Array.isArray(layer.data)) {
    for (let row = 0; row < layer.height; row++) {
      for (let col = 0; col < layer.width; col++) {
        const gid = layer.data[row * layer.width + col] & FLIP_MASK;
        if (gid === 0) continue;
        tiles.push({ gid, tileX: col, tileY: row });
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

// Recorre los tiles decodificados y saca el rectángulo real del contenido.
// Así la cámara funciona aunque el mapa esté dibujado lejos del (0,0).
function computeWorldBounds() {
  let minTX = Infinity, minTY = Infinity, maxTX = -Infinity, maxTY = -Infinity;

  for (const name of TILE_LAYER_NAMES) {
    const tiles = decodedLayers[name];
    if (!tiles) continue;
    for (const t of tiles) {
      if (t.tileX < minTX) minTX = t.tileX;
      if (t.tileY < minTY) minTY = t.tileY;
      if (t.tileX + 1 > maxTX) maxTX = t.tileX + 1;
      if (t.tileY + 1 > maxTY) maxTY = t.tileY + 1;
    }
  }

  if (minTX === Infinity) {
    // No hay tiles decodificados: respaldo con el tamaño nominal del mapa
    minTX = 0; minTY = 0; maxTX = mapData.width; maxTY = mapData.height;
  }

  worldBounds = {
    minX: minTX * TILE_W,
    minY: minTY * TILE_H,
    maxX: maxTX * TILE_W,
    maxY: maxTY * TILE_H,
  };
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
// 3. COLISIÓN DE PAREDES (capa Interactuable)
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
// 4. DOORS (puertas) + cambio de mapa
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

// Respaldo: objeto llamado "Spawn" o, si no existe, el centro del contenido real
function getDefaultSpawn() {
  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && obj.name.toLowerCase() === "spawn") {
        return { x: obj.x + (obj.width || 0) / 2, y: obj.y + (obj.height || 0) / 2 };
      }
    }
  }
  return {
    x: (worldBounds.minX + worldBounds.maxX) / 2,
    y: (worldBounds.minY + worldBounds.maxY) / 2,
  };
}

// --- Transición: pantalla negra 0.5s + carga del mapa nuevo a mitad de camino ---
let doorTransition = null;
let lastUsedDoor = null;
const TRANSITION_HALF = 250;

function isTransitioning() {
  return doorTransition !== null;
}

function startDoorTransition(player, change) {
  if (doorTransition) return;
  doorTransition = { player, phase: "in", timer: 0, change, arrivalDoor: null };
}

async function performMapChange(player, change) {
  if (change.targetMap && change.targetMap !== currentMapName) {
    await loadMap(change.targetMap);
  }

  const targetDoor = doorsByName[change.targetDoorName] || null;
  if (!targetDoor) {
    console.warn("No se encontró la puerta destino", change.targetDoorName, "en", currentMapName);
  }

  const spawn = targetDoor ? getDoorSpawnPoint(targetDoor) : getDefaultSpawn();
  player.x = Math.round(spawn.x - player.width / 2);
  player.y = Math.round(spawn.y - player.height / 2);

  return targetDoor;
}

function updateDoorTransition(deltaTime) {
  if (!doorTransition) return;
  const t = doorTransition;

  if (t.phase === "in") {
    t.timer += deltaTime;
    if (t.timer >= TRANSITION_HALF) {
      t.phase = "loading";
      performMapChange(t.player, t.change)
        .then(arrival => {
          t.arrivalDoor = arrival;
          lastUsedDoor = arrival;
          t.phase = "out";
          t.timer = 0;
        })
        .catch(err => {
          console.error("Error cambiando de mapa:", err);
          t.phase = "out";
          t.timer = 0;
        });
    }
  } else if (t.phase === "out") {
    t.timer += deltaTime;
    if (t.timer >= TRANSITION_HALF) {
      doorTransition = null;
    }
  }
}

function getTransitionAlpha() {
  if (!doorTransition) return 0;
  const t = doorTransition;
  if (t.phase === "in") return Math.min(1, t.timer / TRANSITION_HALF);
  if (t.phase === "loading") return 1;
  return Math.max(0, 1 - t.timer / TRANSITION_HALF);
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

      if (props.targetDoor === undefined && props.targetMap === undefined) {
        console.warn("La puerta", door.name, "no tiene targetMap/targetDoor configurados");
        return;
      }

      const change = {
        targetMap: props.targetMap || currentMapName,
        targetDoorName: "ph" + props.targetDoor,
      };

      startDoorTransition(player, change);
      break;
    }
  }
}

// ---------------------------------------------------------------------
// 5. PUZZLE DE BOTONES (TB1..TB12)
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

    // 🔒 Botón bloqueado: si está prendido (lo tocaste hace menos de 5s), se ignora
    if (isButtonActive(nombreBoton)) continue;

    if (!puzzleCompletado) {
      const secuencia = secuencias[puzzleRondaActual];

      if (secuencia) {
        const esperadoPrimero = secuencia[0];
        const esperadoSegundo = secuencia[1];

        if (!puzzleEsperandoSegundo) {
          if (numeroBoton === esperadoPrimero) {
            puzzleEsperandoSegundo = true;
            console.log(`✅ Ronda ${puzzleRondaActual + 1}: primer botón correcto (${nombreBoton})`);
          } else {
            console.log(`❌ Botón incorrecto (esperaba TB${esperadoPrimero}, tocaste ${nombreBoton})`);
            resetPuzzle();
          }
        } else {
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

    activateButton(nombreBoton);

    break;
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
// 6. OBJETOS PIx — recorte de imagen debajo del objeto
// ---------------------------------------------------------------------
let piObjects = [];
let piImage = null;

function initPIObjects() {
  piObjects = [];

  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && /^PI\d+$/i.test(obj.name)) {
        piObjects.push(obj);
      }
    }
  }

  const ruta = (typeof PI_IMAGEN !== "undefined" && PI_IMAGEN) ? PI_IMAGEN : null;
  if (ruta && !piImage) {
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

    const destX = Math.round(obj.x + obj.width / 2 - sw / 2 + dx0 - camera.x);
    const destY = Math.round(obj.y + obj.height + dy0 - camera.y);

    ctx.drawImage(piImage, sx, sy, sw, sh, destX, destY, sw, sh);
  }
}

// ---------------------------------------------------------------------
// 7. DIBUJADO
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
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (!mapData) return;

  // Límites REALES del contenido (no el tamaño nominal del mapa)
  const w = worldBounds.maxX - worldBounds.minX;
  const h = worldBounds.maxY - worldBounds.minY;

  if (w <= canvas.width) {
    camera.x = worldBounds.minX + (w - canvas.width) / 2;
  } else {
    camera.x = Math.max(worldBounds.minX, Math.min(player.x - canvas.width / 2, worldBounds.maxX - canvas.width));
  }

  if (h <= canvas.height) {
    camera.y = worldBounds.minY + (h - canvas.height) / 2;
  } else {
    camera.y = Math.max(worldBounds.minY, Math.min(player.y - canvas.height / 2, worldBounds.maxY - canvas.height));
  }

  camera.x = Math.round(camera.x);
  camera.y = Math.round(camera.y);

  for (const name of TILE_LAYER_NAMES) {
    const tiles = decodedLayers[name];
    if (!tiles) continue;
    for (const t of tiles) {
      drawTile(ctx, t.gid, t.tileX, t.tileY, camera);
    }
  }
}

// ---------------------------------------------------------------------
// 8. CARGA DE MAPAS (H1, H2, ...)
// ---------------------------------------------------------------------
async function loadMap(mapName) {
  const url = MAPS_FOLDER + mapName + MAP_EXT;

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`No se pudo cargar el mapa: HTTP ${res.status} - ${url}`);
  }

  const texto = (await res.text()).trim();
  if (texto.startsWith("<")) {
    throw new Error(
      `"${url}" no es JSON (.tmj). ¿Es un .tmx (XML)? El juego necesita el formato JSON.`
    );
  }

  mapData = JSON.parse(texto);
  TILE_W = mapData.tilewidth || 20;
  TILE_H = mapData.tileheight || 20;
  currentMapName = mapName;

  tilesetRanges.length = 0;
  for (const k in decodedLayers) delete decodedLayers[k];

  initMapObjects();
  initPIObjects();
  buildTilesetRanges();
  decodeAllLayers();
  computeWorldBounds();
  await loadImages();

  console.log(
    "Mapa cargado:", currentMapName,
    "| contenido real:", worldBounds.minX + "," + worldBounds.minY,
    "a", worldBounds.maxX + "," + worldBounds.maxY
  );
}

function initMapObjects() {
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
// 9. INICIALIZACIÓN
// ---------------------------------------------------------------------
async function initMapRender() {
  await loadMap(MAPA_INICIAL);

  const spawn = getDefaultSpawn();
  player.x = Math.round(spawn.x - player.width / 2);
  player.y = Math.round(spawn.y - player.height / 2);
}
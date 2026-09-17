// mapRender.js — versión MULTI-MAPA
// Puertas: capa Doors, nombre phX + propiedad targetMap (aparecés en el objeto "X").
// Carteles: C1..C10 en "Interactuable-Pared" (E para leer).
// Puzzle botones: TB1..TB12 en orden (5s de bloqueo entre pisadas).
// Puzzle piedra: PIx empujables hasta PLx, dentro de polígonos PUZx; RBx reinicia.
// Pinchos: PINx bloquean el paso y se ven con spr_spiketile_0.png; al completar
// el puzzle de botones Y el de la piedra, dejan de bloquear y pasan a
// spr_spiketile_1.png (guardados) en el mismo lugar.

const MAPS_FOLDER = "/Tiles/";
const MAP_EXT = ".tmj";
const MAPA_INICIAL = window.MAPA_INICIAL || "H1";

let mapData = null;
let currentMapName = null;
let TILE_W = 20;
let TILE_H = 20;

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

function findObjectByName(name) {
  const buscado = String(name).trim();
  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && String(obj.name).trim() === buscado) return obj;
    }
  }
  return null;
}

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

// ---------------------------------------------------------------------
// 3. COLISIÓN DE PAREDES + PIEDRAS + PINCHOS
// ---------------------------------------------------------------------
let wallObjects = [];

function rectHitsWall(rect) {
  if (wallObjects.some(obj => rectsOverlap(rect, obj))) return true;

  // 🌵 Pinchos: bloquean SOLO mientras están activados.
  // Cuando se completan los 2 puzzles, dejan de bloquear (el jugador pasa).
  if (!spikesDesactivados() && spikes.some(sp => rectsOverlap(rect, sp))) return true;

  // Las piedras también bloquean al jugador
  return stones.some(s => rectsOverlap(rect, s));
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
// 4. DOORS (puertas) + cambio de mapa con cuadrados de aparición
// ---------------------------------------------------------------------
let doors = [];
let doorsByName = {};

function getDefaultSpawn() {
  const spawn = findObjectByName("Spawn") || findObjectByName("spawn");
  if (spawn) {
    return { x: spawn.x + (spawn.width || 0) / 2, y: spawn.y + (spawn.height || 0) / 2 };
  }
  return {
    x: (worldBounds.minX + worldBounds.maxX) / 2,
    y: (worldBounds.minY + worldBounds.maxY) / 2,
  };
}

let doorTransition = null;
let lastUsedDoor = null;
const TRANSITION_HALF = 250;

function isTransitioning() {
  return doorTransition !== null;
}

function startDoorTransition(player, change) {
  if (doorTransition) return;
  doorTransition = { player, phase: "in", timer: 0, change };
}

async function performMapChange(player, change) {
  if (change.targetMap && change.targetMap !== currentMapName) {
    await loadMap(change.targetMap);
  }

  const square = findObjectByName(change.spawnSquareName);
  let spawn;

  if (square) {
    spawn = {
      x: square.x + (square.width || 0) / 2,
      y: square.y + (square.height || 0) / 2,
    };
  } else {
    console.warn(
      `No se encontró el cuadrado "${change.spawnSquareName}" en ${currentMapName}. ` +
      `Usando Spawn / centro del mapa como respaldo.`
    );
    spawn = getDefaultSpawn();
  }

  player.x = Math.round(spawn.x - player.width / 2);
  player.y = Math.round(spawn.y - player.height / 2);

  lastUsedDoor = doors.find(d => rectsOverlap(player, d)) || null;
}

function updateDoorTransition(deltaTime) {
  if (!doorTransition) return;
  const t = doorTransition;

  if (t.phase === "in") {
    t.timer += deltaTime;
    if (t.timer >= TRANSITION_HALF) {
      t.phase = "loading";
      performMapChange(t.player, t.change)
        .then(() => {
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

      if (!props.targetMap) {
        console.warn("La puerta", door.name, "no tiene la propiedad targetMap configurada");
        return;
      }

      const change = {
        targetMap: props.targetMap,
        spawnSquareName: door.name.replace(/^ph/i, ""),
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
    if (!/^TB\d+$/i.test(nombreBoton)) continue;
    const numeroBoton = parseInt(nombreBoton.replace(/^TB/i, ""), 10);
    if (isNaN(numeroBoton)) continue;

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
// 6. PUZZLE DE PIEDRAS (PIx empujables, PUZx cerco, PLx objetivo, RBx reset)
// ---------------------------------------------------------------------
let stones = [];
let stoneTargets = [];
let resetButtons = [];
let puzzlePiedraCompletado = {};
let rbStepped = new Set();

const PIEDRA_VELOCIDAD = 3;

function piedraSize() {
  return Math.round((TILE_W / 2) * (4 / 3));
}

let piImage = null;

function tileDePiedra(stone) {
  return {
    x: tileOwner(stone.x + stone.width / 2, TILE_W),
    y: tileOwner(stone.y + stone.height / 2, TILE_H),
  };
}

function tileOwner(v, tileSize) {
  return Math.floor((v - 0.001) / tileSize);
}

function centrarPiedraEnSuCelda(s) {
  const t = tileDePiedra(s);
  const cx = t.x * TILE_W + (TILE_W - s.width) / 2;
  const cy = t.y * TILE_H + (TILE_H - s.height) / 2;
  const rect = { x: cx, y: cy, width: s.width, height: s.height };

  const okArena = !s.arenaPoints || stoneInArena(rect, s.arenaPoints);
  const okPared = !wallObjects.some(w => rectsOverlap(rect, w));

  if (okArena && okPared) {
    s.x = cx;
    s.y = cy;
  }
}

function stoneInArena(rect, arenaPoints) {
  if (!arenaPoints) return true;
  const m = 1;
  return (
    pointInPolygon(rect.x + m, rect.y + m, arenaPoints) &&
    pointInPolygon(rect.x + rect.width - m, rect.y + m, arenaPoints) &&
    pointInPolygon(rect.x + m, rect.y + rect.height - m, arenaPoints) &&
    pointInPolygon(rect.x + rect.width - m, rect.y + rect.height - m, arenaPoints)
  );
}

function celdaLibreParaPiedra(stone, tileX, tileY) {
  const rect = {
    x: tileX * TILE_W + (TILE_W - stone.width) / 2,
    y: tileY * TILE_H + (TILE_H - stone.height) / 2,
    width: stone.width,
    height: stone.height,
  };

  if (stone.arenaPoints && !stoneInArena(rect, stone.arenaPoints)) return false;
  if (wallObjects.some(w => rectsOverlap(rect, w))) return false;
  if (stones.some(o => o !== stone && rectsOverlap(rect, o))) return false;
  return true;
}

function initStoneObjects() {
  stones = [];
  stoneTargets = [];
  resetButtons = [];
  puzzlePiedraCompletado = {};
  rbStepped = new Set();

  const arenas = [];
  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && /^PUZ\d+$/i.test(obj.name)) {
        arenas.push({
          num: parseInt(obj.name.replace(/^PUZ/i, ""), 10),
          points: getAbsolutePoints(obj),
        });
      }
    }
  }

  function arenaFor(x, y) {
    const byPoint = arenas.find(a => pointInPolygon(x, y, a.points));
    if (byPoint) return byPoint;

    const byBox = arenas.find(a => {
      const xs = a.points.map(p => p.x);
      const ys = a.points.map(p => p.y);
      return x >= Math.min(...xs) && x <= Math.max(...xs) &&
             y >= Math.min(...ys) && y <= Math.max(...ys);
    });
    if (byBox) {
      console.warn(`⚠️ Arena asignada por bounding box (revisá el polígono PUZ${byBox.num} en Tiled)`);
    }
    return byBox || null;
  }

  const tam = piedraSize();

  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (!obj.name) continue;

      if (/^PI\d+$/i.test(obj.name)) {
        const cx = obj.x + (obj.width || TILE_W) / 2;
        const cy = obj.y + (obj.height || TILE_H) / 2;
        const arena = arenaFor(cx, cy);

        if (!arena) {
          console.warn(`La piedra ${obj.name} no está dentro de ningún polígono PUZx: queda fija.`);
        }

        const s = {
          name: obj.name,
          num: parseInt(obj.name.replace(/^PI/i, ""), 10),
          x: cx - tam / 2,
          y: cy - tam / 2,
          width: tam,
          height: tam,
          initX: 0,
          initY: 0,
          puzzle: arena ? arena.num : null,
          arenaPoints: arena ? arena.points : null,
          locked: false,
          sliding: null,
        };

        snapStoneToGrid(s);
        s.initX = s.x;
        s.initY = s.y;

        stones.push(s);
      }
      else if (/^PL\d+$/i.test(obj.name)) {
        const cx = obj.x + (obj.width || TILE_W) / 2;
        const cy = obj.y + (obj.height || TILE_H) / 2;
        const arena = arenaFor(cx, cy);

        stoneTargets.push({
          name: obj.name,
          x: obj.x,
          y: obj.y,
          width: obj.width || TILE_W,
          height: obj.height || TILE_H,
          puzzle: arena ? arena.num : null,
          occupied: false,
        });
      }
      else if (/^RB\d+$/i.test(obj.name)) {
        if (!obj.width && !obj.height) {
          obj.width = TILE_W;
          obj.height = TILE_H;
          obj.x -= TILE_W / 2;
          obj.y -= TILE_H / 2;
        }

        resetButtons.push({
          name: obj.name,
          num: parseInt(obj.name.replace(/^RB/i, ""), 10),
          x: obj.x,
          y: obj.y,
          width: obj.width,
          height: obj.height,
        });
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

function snapStoneToGrid(s) {
  const t = tileDePiedra(s);
  const antesX = s.x;
  const antesY = s.y;

  s.x = t.x * TILE_W + (TILE_W - s.width) / 2;
  s.y = t.y * TILE_H + (TILE_H - s.height) / 2;

  if (!celdaLibreParaPiedra(s, t.x, t.y)) {
    s.x = antesX;
    s.y = antesY;
  }
}

function hitsOtherStone(stone, rect) {
  return stones.some(o => o !== stone && rectsOverlap(rect, o));
}

function findFreeTarget(stone, rect) {
  return stoneTargets.find(t =>
    t.puzzle === stone.puzzle &&
    !t.occupied &&
    rectsOverlap(rect, t)
  ) || null;
}

function stepStone(s) {
  const dir = s.sliding;
  let moved = 0;

  while (moved < PIEDRA_VELOCIDAD) {
    const nx = s.x + dir.dx;
    const ny = s.y + dir.dy;
    const test = { x: nx, y: ny, width: s.width, height: s.height };

    const target = findFreeTarget(s, test);
    if (target) {
      s.x = target.x + target.width / 2 - s.width / 2;
      s.y = target.y + target.height / 2 - s.height / 2;
      s.locked = true;
      s.sliding = null;
      target.occupied = true;
      console.log(`🪨 ${s.name} llegó a ${target.name} y quedó trabada`);
      checkPiedrasPuzzle(s.puzzle);
      return;
    }

    if (hitsOtherStone(s, test)) {
      centrarPiedraEnSuCelda(s);
      s.sliding = null;
      console.log(`🛑 ${s.name} frenó (otra piedra)`);
      return;
    }

    if (wallObjects.some(w => rectsOverlap(test, w))) {
      centrarPiedraEnSuCelda(s);
      s.sliding = null;
      console.log(`🛑 ${s.name} frenó (pared)`);
      return;
    }

    if (s.arenaPoints && !stoneInArena(test, s.arenaPoints)) {
      centrarPiedraEnSuCelda(s);
      s.sliding = null;
      console.log(`🛑 ${s.name} frenó (borde del polígono)`);
      return;
    }

    const tileAhora = tileDePiedra(s);
    const tileDespues = {
      x: tileOwner(nx + s.width / 2, TILE_W),
      y: tileOwner(ny + s.height / 2, TILE_H),
    };
    if ((tileDespues.x !== tileAhora.x || tileDespues.y !== tileAhora.y) &&
        !celdaLibreParaPiedra(s, tileDespues.x, tileDespues.y)) {
      centrarPiedraEnSuCelda(s);
      s.sliding = null;
      console.log(`🛑 ${s.name} frenó (borde), queda centrada en su bloque`);
      return;
    }

    s.x = nx;
    s.y = ny;
    moved++;
  }
}

// Empuje + deslizamiento. El empuje NO arranca al caminar:
// solo arranca con la tecla E (ver empujarPiedra, la llama site.js).
function updatePiedras(player, dx, dy) {
  // 0) Red de seguridad: toda piedra quieta y destrabada queda centrada en su bloque
  for (const s of stones) {
    if (s.sliding || s.locked) continue;
    const t = tileDePiedra(s);
    const cx = t.x * TILE_W + TILE_W / 2;
    const cy = t.y * TILE_H + TILE_H / 2;
    const centroX = s.x + s.width / 2;
    const centroY = s.y + s.height / 2;
    if (Math.abs(centroX - cx) > 0.5 || Math.abs(centroY - cy) > 0.5) {
      if (celdaLibreParaPiedra(s, t.x, t.y)) {
        s.x = cx - s.width / 2;
        s.y = cy - s.height / 2;
      }
    }
  }

  // 1) Avanzar las que ya están deslizando (el empuje lo inicia la tecla E)
  for (const s of stones) {
    if (s.sliding) stepStone(s);
  }
}

// 🔑 Empuje manual con E: intenta arrancar el deslizamiento de la piedra
// que esté delante del jugador, en la dirección que mira.
// Devuelve true si alguna piedra arrancó (site.js lo usa en la tecla E).
function empujarPiedra(player, dirX, dirY) {
  if (isTransitioning()) return false;
  if (dirX === 0 && dirY === 0) return false;

  const margen = 6;
  const expanded = {
    x: player.x - margen,
    y: player.y - margen,
    width: player.width + margen * 2,
    height: player.height + margen * 2,
  };

  for (const s of stones) {
    if (s.locked || s.sliding) continue;
    if (!rectsOverlap(expanded, s)) continue;

    // La piedra tiene que estar efectivamente hacia donde mirás
    const centroPlayerX = player.x + player.width / 2;
    const centroPlayerY = player.y + player.height / 2;
    const centroStoneX = s.x + s.width / 2;
    const centroStoneY = s.y + s.height / 2;

    const hacia = (dirX !== 0)
      ? (dirX > 0 ? centroStoneX >= centroPlayerX : centroStoneX <= centroPlayerX)
      : (dirY > 0 ? centroStoneY >= centroPlayerY : centroStoneY <= centroPlayerY);
    if (!hacia) continue;

    // Si la celda siguiente no es libre (borde/pared/piedra), no arranca
    const t = tileDePiedra(s);
    if (!celdaLibreParaPiedra(s, t.x + dirX, t.y + dirY)) continue;

    s.sliding = { dx: dirX, dy: dirY };
    console.log(`🪨 Empuje (E) ${s.name} ->`, dirX, dirY);
    return true;
  }
  return false;
}

function checkPiedrasPuzzle(num) {
  const piedras = stones.filter(s => s.puzzle === num);
  if (piedras.length === 0) return;

  if (piedras.every(s => s.locked)) {
    puzzlePiedraCompletado[num] = true;
    console.log(`🎉 Puzzle PUZ${num} completado`);
  }
}

function resetPiedrasPuzzle(num) {
  for (const s of stones) {
    if (s.puzzle !== num) continue;
    s.x = s.initX;
    s.y = s.initY;
    s.locked = false;
    s.sliding = null;
  }
  for (const t of stoneTargets) {
    if (t.puzzle === num) t.occupied = false;
  }
  puzzlePiedraCompletado[num] = false;
}

function checkResetButtons(player) {
  if (isTransitioning()) return;

  const touched = new Set();
  for (const rb of resetButtons) {
    if (rectsOverlap(player, rb)) touched.add(rb.name);
  }

  for (const name of touched) {
    if (rbStepped.has(name)) continue;
    if (isButtonActive(name)) continue;

    const rb = resetButtons.find(r => r.name === name);
    if (!rb || isNaN(rb.num)) continue;

    if (puzzlePiedraCompletado[rb.num]) {
      console.log(`⛔ RB${rb.num}: el puzzle PUZ${rb.num} ya está completado, no se reinicia`);
      continue;
    }

    resetPiedrasPuzzle(rb.num);
    activateButton(name);
    console.log(`🔄 Puzzle PUZ${rb.num} reiniciado desde 0`);
  }

  rbStepped = touched;
}

function drawPIOverlays(ctx, canvas, camera) {
  if (!piImage || !piImage.complete || piImage.failed) return;

  const recortes = (typeof PI_RECORTES !== "undefined") ? PI_RECORTES : {};
  const dx0 = (typeof PI_DX !== "undefined") ? PI_DX : 0;
  const dy0 = (typeof PI_DY !== "undefined") ? PI_DY : 0;

  for (const s of stones) {
    const r = recortes[s.name] || recortes["*"];
    if (!r) continue;

    const sx = r[0], sy = r[1], sw = r[2], sh = r[3];

    const destX = Math.round(s.x + s.width / 2 - sw / 2 + dx0 - camera.x);
    const destY = Math.round(s.y + s.height / 2 - sh / 2 + dy0 - camera.y);

    ctx.drawImage(piImage, sx, sy, sw, sh, destX, destY, sw, sh);
  }
}

// ---------------------------------------------------------------------
// 6b. PINCHOS (PINx): bloquean el paso hasta completar los 2 puzzles
// ---------------------------------------------------------------------
let spikes = [];
let spikeImage0 = null; // spr_spiketile_0.png = pincho ACTIVADO (peligroso)
let spikeImage1 = null; // spr_spiketile_1.png = pincho GUARDADO (se puede pasar)

// ¿Se completaron los 2 primeros puzzles?
//  1) El de tocar los botones TB en orden  -> puzzleCompletado
//  2) El de llevar la piedra a la placa    -> algún puzzlePiedraCompletado en true
// Si querés que exija TODOS los puzzles de piedra, cambiá .some( por .every(
function spikesDesactivados() {
  const botones = puzzleCompletado;
  const piedras = Object.values(puzzlePiedraCompletado).some(v => v);
  return botones && piedras;
}

function initSpikeObjects() {
  spikes = [];

  for (const layer of mapData.layers) {
    if (layer.type !== "objectgroup") continue;
    for (const obj of layer.objects || []) {
      if (obj.name && /^PIN\d+$/i.test(obj.name)) {
        spikes.push({
          name: obj.name,
          x: obj.x,
          y: obj.y,
          width: obj.width || TILE_W,
          height: obj.height || TILE_H,
        });
      }
    }
  }

  if (!spikeImage0) {
    spikeImage0 = new Image();
    spikeImage0.src = TILE_FOLDER + "spr_spiketile_0_editado.png";
  }
  if (!spikeImage1) {
    spikeImage1 = new Image();
    spikeImage1.src = TILE_FOLDER + "spr_spiketile_1_editado.png";
  }
}

// Dibuja los pinchos en su lugar: sprite 0 si están activados,
// sprite 1 (guardados) si ya se completaron los 2 puzzles.
function drawSpikes(ctx, camera) {
  const img = spikesDesactivados() ? spikeImage1 : spikeImage0;
  if (!img || !img.complete || img.naturalWidth === 0) return;

  for (const sp of spikes) {
    ctx.drawImage(
      img,
      Math.round(sp.x - camera.x),
      Math.round(sp.y - camera.y),
      sp.width,
      sp.height
    );
  }
}

// ---------------------------------------------------------------------
// 6c. CARTELES (C1..C10)
// ---------------------------------------------------------------------
let signs = [];

function initSignObjects() {
  signs = [];

  const layer = mapData.layers.find(l => l.name === "Interactuable-Pared");
  if (!layer) return;

  for (const obj of layer.objects || []) {
    if (obj.name && /^C\d+$/i.test(obj.name)) {
      signs.push(obj);
    }
  }
}

function getSignAtPlayer(player) {
  const hit = {
    x: player.x - 8,
    y: player.y - 8,
    width: player.width + 16,
    height: player.height + 16,
  };

  for (const s of signs) {
    if (rectsOverlap(hit, s)) {
      const textos = (typeof CARTELES_TEXTOS !== "undefined") ? CARTELES_TEXTOS : {};
      return {
        name: s.name,
        texto: textos[s.name] || textos["*"] || "peronesrico",
      };
    }
  }

  return null;
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

  ctx.save();
  ctx.beginPath();
  // (el clip de room se mantiene si lo usás; los pinchos se dibujan adentro)
  for (const name of TILE_LAYER_NAMES) {
    const tiles = decodedLayers[name];
    if (!tiles) continue;
    for (const t of tiles) {
      drawTile(ctx, t.gid, t.tileX, t.tileY, camera);
    }
  }

  // 🌵 Pinchos encima de los tiles, debajo del jugador
  drawSpikes(ctx, camera);

  ctx.restore();
}

// ---------------------------------------------------------------------
// 8. CARGA DE MAPAS
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
  initStoneObjects();
  initSpikeObjects();
  initSignObjects();
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
  // 🪨 Excluye objetos de puzzle (PI/PL/RB/PUZ/PIN) de las paredes:
  // su bloqueo lo maneja el código (piedras y pinchos), no la capa.
  wallObjects = wallsLayer
    ? wallsLayer.objects.filter(o => !o.name || !/^(PI|PL|RB|PUZ|PIN)\d+$/i.test(o.name))
    : [];

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
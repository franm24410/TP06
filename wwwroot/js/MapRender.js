// mapRender.js
// Carga el mapa exportado de Tiled (TileMaps.MAPATERMINADOAHORASI) y lo dibuja
// en el canvas, mostrando solo la habitación (room) donde está el jugador.

const mapData = TileMaps["MAPATERMINADOAHORASI"];
const TILE_W = mapData.tilewidth;   // 20
const TILE_H = mapData.tileheight;  // 20

// ---------------------------------------------------------------------
// 1. CONFIGURACIÓN DE TILESETS
// ---------------------------------------------------------------------
// Tiled exporta cada tileset como un "source" (.tsx) con una ruta que
// puede variar (../Downloads/Tiles/..., etc). Para no depender de la ruta
// exacta, matcheamos solo por el NOMBRE DE ARCHIVO al final de esa ruta.
//
// "columns" = cuántos tiles hay por fila en la imagen. Para tilesets de
// fondo/terreno se calcula como ancho_imagen / TILE_W. Para sprites de
// un solo objeto (el tileset entero es 1 tile), columns = 1.
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

// Extrae solo el nombre de archivo de una ruta, sin importar el formato
// (../Downloads/Tiles/x.tsx, Tiles/x.tsx, x.tsx, con \ o /, etc.)
function getFileName(path) {
  if (!path) return null;
  return path.split(/[\\/]/).pop();
}

const loadedImages = {};
const tilesetRanges = []; // [{firstgid, lastgid, columns, image}]

function buildTilesetRanges() {
  const list = mapData.tilesets; // ya vienen ordenados por firstgid
  for (let i = 0; i < list.length; i++) {
    const ts = list[i];
    const nextFirstgid = list[i + 1] ? list[i + 1].firstgid : Infinity;

    // Caso 1: tileset embebido (trae "image" directo, sin necesitar tabla)
    if (ts.image) {
      tilesetRanges.push({
        firstgid: ts.firstgid,
        lastgid: nextFirstgid - 1,
        columns: ts.columns,
        image: TILE_FOLDER + getFileName(ts.image),
      });
      continue;
    }

    // Caso 2: tileset externo (.tsx) -> buscamos por nombre de archivo en la tabla
    const fileName = getFileName(ts.source);
    const config = fileName ? TILESET_CONFIG[fileName] : null;
    if (!config) {
      console.warn("Falta agregar a TILESET_CONFIG:", fileName || "(tileset sin nombre, probablemente no se usa para dibujar)");
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
      img.onerror = () => { console.error("No se pudo cargar imagen:", range.image); resolve(); };
    });
    img.src = range.image;
    loadedImages[range.image] = img;
    promises.push(p);
  }
  return Promise.all(promises);
}

// ---------------------------------------------------------------------
// 2. DECODIFICAR CAPAS (base64, sin compresión, formato "chunks" por ser mapa infinito)
// ---------------------------------------------------------------------
const FLIP_MASK = 0x1FFFFFFF; // Tiled usa los 3 bits más altos del gid para flip/rotación

function decodeChunkData(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  const gids = new Uint32Array(bytes.buffer);
  return gids;
}

// Devuelve todos los tiles de una capa como lista de {gid, worldX, worldY} (en unidades de tile, no px)
function getLayerTiles(layer) {
  const tiles = [];
  if (!layer.chunks) return tiles;
  for (const chunk of layer.chunks) {
    const gids = decodeChunkData(chunk.data);
    for (let row = 0; row < chunk.height; row++) {
      for (let col = 0; col < chunk.width; col++) {
        const rawGid = gids[row * chunk.width + col];
        const gid = rawGid & FLIP_MASK;
        if (gid === 0) continue; // 0 = tile vacío
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

// Cachea los tiles decodificados de cada capa visual (se decodifican una sola vez)
const TILE_LAYER_NAMES = ["background", "Piso", "Paredes", "Detalles-Piso", "Detalles-Pared", "Objeto"];
const decodedLayers = {};

function decodeAllLayers() {
  for (const name of TILE_LAYER_NAMES) {
    const layer = mapData.layers.find(l => l.name === name);
    if (layer) decodedLayers[name] = getLayerTiles(layer);
  }
}

// ---------------------------------------------------------------------
// 3. ROOMS (habitaciones) — para saber qué recortar
// ---------------------------------------------------------------------
const roomsLayer = mapData.layers.find(l => l.name === "Rooms");
const rooms = roomsLayer ? roomsLayer.objects : [];

function getRoomRectsByName(name) {
  return rooms.filter(r => r.name === name);
}

function getCurrentRoomName(player) {
  const hit = rooms.find(r =>
    player.x >= r.x && player.x <= r.x + r.width &&
    player.y >= r.y && player.y <= r.y + r.height
  );
  return hit ? hit.name : null;
}

// ---------------------------------------------------------------------
// 4. DIBUJADO
// ---------------------------------------------------------------------
function drawTile(ctx, gid, worldX, worldY, camera) {
  const range = tilesetRanges.find(r => gid >= r.firstgid && gid <= r.lastgid);
  if (!range) return;
  const img = loadedImages[range.image];
  if (!img || !img.complete) return;

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
  const roomRects = currentRoomName ? getRoomRectsByName(currentRoomName) : [];

  // Fondo negro (todo lo que no es la room actual queda tapado)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  if (roomRects.length === 0) {
    // Jugador fuera de cualquier room conocida: no dibujamos nada por ahora
    return;
  }

  // Cámara: centrada en el jugador, sin salir del bounding box de la room
  const minX = Math.min(...roomRects.map(r => r.x));
  const minY = Math.min(...roomRects.map(r => r.y));
  const maxX = Math.max(...roomRects.map(r => r.x + r.width));
  const maxY = Math.max(...roomRects.map(r => r.y + r.height));

  camera.x = Math.max(minX, Math.min(player.x - canvas.width / 2, Math.max(minX, maxX - canvas.width)));
  camera.y = Math.max(minY, Math.min(player.y - canvas.height / 2, Math.max(minY, maxY - canvas.height)));

  ctx.save();
  ctx.beginPath();
  for (const r of roomRects) {
    ctx.rect(r.x - camera.x, r.y - camera.y, r.width, r.height);
  }
  ctx.clip();

  // Dibuja capas en orden (de abajo hacia arriba)
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
// 5. INICIALIZACIÓN — llamar esto una vez al arrancar el juego
// ---------------------------------------------------------------------
async function initMapRender() {
  buildTilesetRanges();
  decodeAllLayers();
  await loadImages();
  console.log("Mapa cargado:", mapData.width, "x", mapData.height, "| Rooms encontradas:", rooms.length);
}
// mapRender.js
// Carga el mapa exportado de Tiled (TileMaps.MAPATERMINADOAHORASI) y lo dibuja
// en el canvas, mostrando solo la habitación (room) donde está el jugador.

const mapData = TileMaps["MAPATERMINADOAHORASI"];
const TILE_W = mapData.tilewidth;   // 20
const TILE_H = mapData.tileheight;  // 20

// ---------------------------------------------------------------------
// 1. CONFIGURACIÓN DE TILESETS
// ---------------------------------------------------------------------
// Tiled exporta cada tileset como un "source" (.tsx), pero como no subiste
// los .tsx, acá lo mapeamos a mano: qué imagen usa cada uno y cuántas
// columnas tiene (ancho de la imagen / ancho de tile).
// Si en algún momento conseguís los .tsx originales, avisame y te genero
// esta tabla automáticamente sin tener que calcularla a ojo.
const TILESET_CONFIG = {
  "bg_ruinseasynam2.tsx": { image: "Tiles/bg_ruinseasynam2.png", columns: 8 },
  "bg_ruinseasynam3.tsx": { image: "Tiles/bg_ruinseasynam3.png", columns: 8 },
  "Tiles/bg_tundratiles.tsx": { image: "Tiles/bg_tundratiles.png", columns: 9 },
  "spr_snowpap_0.tsx": { image: "Tiles/spr_snowpap_0.png", columns: 1 },
  "spr_groundswitch1_1.tsx": { image: "Tiles/spr_groundswitch1_1.png", columns: 1 },
  "spr_npc_sign_0.tsx": { image: "Tiles/spr_npc_sign_0.png", columns: 1 },
  "spr_smallweb_0.tsx": { image: "Tiles/spr_smallweb_0.png", columns: 1 },
  "spr_xmastree_0.tsx": { image: "Tiles/spr_xmastree_0.png", columns: 1 },
};

// Construye, para cada gid (id global de tile), qué imagen y qué recorte usar.
const loadedImages = {};
const tilesetRanges = []; // [{firstgid, lastgid, config}]

function buildTilesetRanges() {
  const list = mapData.tilesets; // ya vienen ordenados por firstgid
  for (let i = 0; i < list.length; i++) {
    const ts = list[i];
    const config = TILESET_CONFIG[ts.source];
    if (!config) {
      console.warn("Falta configuración para tileset:", ts.source);
      continue;
    }
    const nextFirstgid = list[i + 1] ? list[i + 1].firstgid : Infinity;
    tilesetRanges.push({
      firstgid: ts.firstgid,
      lastgid: nextFirstgid - 1,
      columns: config.columns,
      image: config.image,
    });
  }
}

function loadImages() {
  const promises = [];
  for (const key in TILESET_CONFIG) {
    const src = TILESET_CONFIG[key].image;
    if (loadedImages[src]) continue;
    const img = new Image();
    const p = new Promise((resolve) => {
      img.onload = resolve;
      img.onerror = () => { console.error("No se pudo cargar imagen:", src); resolve(); };
    });
    img.src = src;
    loadedImages[src] = img;
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
  const sx = (localId % range.columns) * TILE_W;
  const sy = Math.floor(localId / range.columns) * TILE_H;

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
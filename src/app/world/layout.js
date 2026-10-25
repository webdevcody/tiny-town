// Town planning for the world view: packs every building into city blocks,
// groups the blocks into districts by category and lays the districts out
// around a downtown core on a road grid. Pure data (no three.js) so it is
// deterministic and easy to reason about.
//
// Tile grid: x grows east, z grows south (+Z is every building's front).
// Road lines run along x = i * pitchX and z = j * pitchZ; block cell (i, j)
// holds the tiles between them.

/** Districts in planning order. The first one is the core, the rest fan out around it. */
export const DISTRICTS = [
  { category: 'office', name: 'Downtown', ground: 'plaza' },
  { category: 'commercial', name: 'Shopping district', ground: 'plaza' },
  { category: 'civic', name: 'Civic quarter', ground: 'plaza' },
  { category: 'leisure', name: 'Parks & leisure', ground: 'park' },
  { category: 'residential', name: 'Suburbs', ground: 'park' },
  { category: 'farm', name: 'Farmland', ground: 'meadow' },
  { category: 'utilities', name: 'Utilities', ground: 'yard' },
  { category: 'industrial', name: 'Industrial zone', ground: 'yard' },
  { category: 'transport', name: 'Transport hub', ground: 'yard' },
];

const MIN_BLOCK = 4; // block interior in tiles (grown to fit the biggest footprint)
const MAX_FILL = 0.75; // leave a quarter of each block for trees, plazas and yards

function districtFor(category, extra) {
  const known = DISTRICTS.find((d) => d.category === category);
  if (known) return known;
  if (!extra.has(category)) extra.set(category, { category, name: category, ground: 'park' });
  return extra.get(category);
}

/** Occupancy grid of one block. */
function newBlock(bw, bd) {
  return { cells: new Uint8Array(bw * bd), items: [], area: 0 };
}

function fits(block, bw, bd, x, z, w, d) {
  if (x + w > bw || z + d > bd) return false;
  for (let j = z; j < z + d; j++) for (let i = x; i < x + w; i++) if (block.cells[j * bw + i]) return false;
  return true;
}

/**
 * Find a spot for a w x d footprint, preferring spots on the block edge (so
 * every building touches a road) and the south edge first (fronts face +Z).
 */
function findSpot(block, bw, bd, w, d) {
  let inner = null;
  for (let z = bd - d; z >= 0; z--) {
    for (let x = 0; x + w <= bw; x++) {
      if (!fits(block, bw, bd, x, z, w, d)) continue;
      if (x === 0 || z === 0 || x + w === bw || z + d === bd) return { x, z };
      inner ??= { x, z };
    }
  }
  return inner;
}

/** Turn a building to face the road it touches. Non-square footprints only flip 180°. */
function facing(x, z, w, d, bw, bd) {
  if (z + d === bd) return 0;
  if (z === 0) return Math.PI;
  if (w === d && x + w === bw) return Math.PI / 2;
  if (w === d && x === 0) return -Math.PI / 2;
  return 0;
}

function packDistrict(items, bw, bd) {
  const blocks = [];
  for (const it of items) {
    const [w, d] = it.footprint;
    let block = null;
    let spot = null;
    for (const b of blocks) {
      if (b.area + w * d > bw * bd * MAX_FILL) continue;
      spot = findSpot(b, bw, bd, w, d);
      if (spot) {
        block = b;
        break;
      }
    }
    if (!block) {
      block = newBlock(bw, bd);
      blocks.push(block);
      spot = { x: 0, z: bd - d };
    }
    for (let j = spot.z; j < spot.z + d; j++) for (let i = spot.x; i < spot.x + w; i++) block.cells[j * bw + i] = 1;
    block.area += w * d;
    block.items.push({ ...it, lx: spot.x, lz: spot.z, rot: facing(spot.x, spot.z, w, d, bw, bd) });
  }
  return blocks;
}

/**
 * items: [{ id, category, footprint: [w, d], height }]
 * returns {
 *   tilesX, tilesZ, pitchX, pitchZ, blockW, blockD,
 *   placements: [{ id, tx, tz, w, d, rot, district, chunk }],
 *   blocks: [{ i, j, district, empty: [[tx, tz]...] }],
 *   roads: [{ tx, tz, kind: 'x' | 'z' | 'junction' }],
 *   districts: [{ ...district, blocks: n, center: [tx, tz] }],
 * }
 */
export function planTown(items, { chunkBlocks = 2 } = {}) {
  const blockW = Math.max(MIN_BLOCK, ...items.map((i) => i.footprint[0]));
  const blockD = Math.max(MIN_BLOCK, ...items.map((i) => i.footprint[1]));
  const pitchX = blockW + 1;
  const pitchZ = blockD + 1;

  // 1. pack each district into blocks
  const extra = new Map();
  const byDistrict = new Map();
  for (const it of items) {
    const d = districtFor(it.category, extra);
    if (!byDistrict.has(d)) byDistrict.set(d, []);
    byDistrict.get(d).push(it);
  }
  const order = [...DISTRICTS, ...extra.values()].filter((d) => byDistrict.has(d));
  const packed = order.map((d, k) => {
    const list = byDistrict.get(d).slice();
    // downtown: tallest first so the skyline peaks in the middle; elsewhere big lots first
    if (k === 0) list.sort((a, b) => b.height - a.height || a.id - b.id);
    else list.sort((a, b) => b.footprint[0] * b.footprint[1] - a.footprint[0] * a.footprint[1] || b.height - a.height || a.id - b.id);
    return { district: d, blocks: packDistrict(list, blockW, blockD) };
  });
  const total = packed.reduce((s, p) => s + p.blocks.length, 0);

  // 2. pick the `total` block cells closest to the centre of a generous grid
  const side = Math.ceil(Math.sqrt(total * 1.5)) + 2;
  const c = (side - 1) / 2;
  const cells = [];
  for (let j = 0; j < side; j++) for (let i = 0; i < side; i++) cells.push({ i, j, r: Math.hypot(i - c, j - c), a: Math.atan2(j - c, i - c) });
  cells.sort((a, b) => a.r - b.r || a.a - b.a);
  const used = cells.slice(0, total);

  // 3. core district takes the innermost cells, the others split the rest into wedges by angle
  const assigned = [];
  const [core, ...rest] = packed;
  const coreCells = used.slice(0, core.blocks.length);
  assigned.push({ p: core, cells: coreCells });
  const ring = used.slice(core.blocks.length).sort((a, b) => wrapAngle(a.a) - wrapAngle(b.a) || a.r - b.r);
  let k = 0;
  for (const p of rest) {
    assigned.push({ p, cells: ring.slice(k, k + p.blocks.length) });
    k += p.blocks.length;
  }

  // 4. crop the grid to the used cells
  const minI = Math.min(...used.map((u) => u.i));
  const minJ = Math.min(...used.map((u) => u.j));
  const maxI = Math.max(...used.map((u) => u.i));
  const maxJ = Math.max(...used.map((u) => u.j));
  const placements = [];
  const blocks = [];
  const districts = [];
  for (const { p, cells: dc } of assigned) {
    // within a district, the first (fullest / tallest) blocks go nearest the centre
    dc.sort((a, b) => a.r - b.r || a.a - b.a);
    let sx = 0, sz = 0;
    p.blocks.forEach((b, n) => {
      const i = dc[n].i - minI;
      const j = dc[n].j - minJ;
      const x0 = i * pitchX + 1;
      const z0 = j * pitchZ + 1;
      const chunk = `${Math.floor(i / chunkBlocks)},${Math.floor(j / chunkBlocks)}`;
      for (const it of b.items) {
        const [w, d] = it.footprint;
        placements.push({ id: it.id, tx: x0 + it.lx, tz: z0 + it.lz, w, d, rot: it.rot, district: p.district, chunk });
      }
      const empty = [];
      for (let lz = 0; lz < blockD; lz++) for (let lx = 0; lx < blockW; lx++) if (!b.cells[lz * blockW + lx]) empty.push([x0 + lx, z0 + lz]);
      blocks.push({ i, j, district: p.district, empty, chunk });
      sx += x0 + blockW / 2;
      sz += z0 + blockD / 2;
    });
    districts.push({ ...p.district, blocks: p.blocks.length, buildings: p.blocks.reduce((s, b) => s + b.items.length, 0), center: [sx / p.blocks.length, sz / p.blocks.length] });
  }

  // 5. roads around every used block
  const roadSet = new Map();
  const addRoad = (tx, tz) => {
    const key = tx + ',' + tz;
    if (roadSet.has(key)) return;
    const onX = tx % pitchX === 0;
    const onZ = tz % pitchZ === 0;
    roadSet.set(key, { tx, tz, kind: onX && onZ ? 'junction' : onZ ? 'x' : 'z' });
  };
  for (const b of blocks) {
    const x0 = b.i * pitchX, z0 = b.j * pitchZ;
    for (let t = 0; t <= pitchX; t++) {
      addRoad(x0 + t, z0);
      addRoad(x0 + t, z0 + pitchZ);
    }
    for (let t = 1; t < pitchZ; t++) {
      addRoad(x0, z0 + t);
      addRoad(x0 + pitchX, z0 + t);
    }
  }
  const roads = [...roadSet.values()];
  // junction shape from its neighbours (for kerbs and markings)
  for (const r of roads) {
    if (r.kind !== 'junction') continue;
    r.links = {
      n: roadSet.has(r.tx + ',' + (r.tz - 1)),
      s: roadSet.has(r.tx + ',' + (r.tz + 1)),
      e: roadSet.has(r.tx + 1 + ',' + r.tz),
      w: roadSet.has(r.tx - 1 + ',' + r.tz),
    };
  }

  return {
    tilesX: (maxI - minI + 1) * pitchX + 1,
    tilesZ: (maxJ - minJ + 1) * pitchZ + 1,
    pitchX,
    pitchZ,
    blockW,
    blockD,
    placements,
    blocks,
    roads,
    districts,
  };
}

// start the wedges at north-west so downtown's neighbours read left-to-right in the default view
function wrapAngle(a) {
  const start = -0.75 * Math.PI;
  let x = a - start;
  while (x < 0) x += Math.PI * 2;
  return x;
}

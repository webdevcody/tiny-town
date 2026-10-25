import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, group, mat, metal, surface, field,
  fence, stairs, streetLamp, bench, flag, rng, shade, pyramidRoof, awning,
} from '../../src/lib/index.js';
import {
  hedgeBlock, ballTopiary, tieredTopiary, coneTopiary, spiralTopiary, rabbitTopiary, person, boardSign,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// An 8x8-cell hedge maze (2 m cells) fills most of the lot. The centre 2x2 cells
// are a plaza with a gazebo, the front-right 2x2 cells hold a viewing platform,
// and a topiary entrance garden with a ticket kiosk runs along the street.
const N = 8;
const CELL = 2;
const X0 = -8;
const Z0 = -9.6;
const T = 0.6; // hedge thickness
const H_IN = 2.2;
const H_OUT = 2.6;

const isPlaza = (c, r) => (c === 3 || c === 4) && (r === 3 || r === 4);
const isDeck = (c, r) => c >= 6 && r >= 6;
const ENTRANCE_COL = 3;

const cellX = (c) => X0 + c * CELL + CELL / 2;
const cellZ = (r) => Z0 + r * CELL + CELL / 2;

// Randomised Kruskal over the cells (plaza pre-joined, deck cells excluded).
function generateMaze(seed) {
  const r = rng(seed);
  // H[r][c]: wall along X at z = Z0 + r*CELL (r = 0..N); V[r][c]: wall along Z at x = X0 + c*CELL (c = 0..N)
  const H = Array.from({ length: N + 1 }, () => Array(N).fill(true));
  const V = Array.from({ length: N }, () => Array(N + 1).fill(true));
  const parent = new Map();
  const id = (c, rr) => rr * N + c;
  const find = (a) => {
    while (parent.get(a) !== a) a = parent.get(a);
    return a;
  };
  const union = (a, b) => parent.set(find(a), find(b));
  for (let rr = 0; rr < N; rr++) for (let c = 0; c < N; c++) parent.set(id(c, rr), id(c, rr));

  // plaza: one open room
  union(id(3, 3), id(4, 3)); union(id(3, 3), id(3, 4)); union(id(3, 3), id(4, 4));
  V[3][4] = V[4][4] = false;
  H[4][3] = H[4][4] = false;

  const walls = [];
  for (let rr = 0; rr < N; rr++) {
    for (let c = 0; c < N; c++) {
      if (isDeck(c, rr)) continue;
      if (c + 1 < N && !isDeck(c + 1, rr) && !(isPlaza(c, rr) && isPlaza(c + 1, rr))) walls.push(['V', rr, c + 1, id(c, rr), id(c + 1, rr)]);
      if (rr + 1 < N && !isDeck(c, rr + 1) && !(isPlaza(c, rr) && isPlaza(c, rr + 1))) walls.push(['H', rr + 1, c, id(c, rr), id(c, rr + 1)]);
    }
  }
  for (const [kind, a, b, p, q] of r.shuffle(walls)) {
    if (find(p) === find(q)) continue;
    union(p, q);
    if (kind === 'V') V[a][b] = false;
    else H[a][b] = false;
  }

  // deck corner: open to the front garden and the east strip, closed to the maze
  H[7][6] = H[7][7] = H[8][6] = H[8][7] = false;
  V[6][7] = V[7][7] = V[6][8] = V[7][8] = false;
  // entrance gap in the front hedge
  H[N][ENTRANCE_COL] = false;
  return { H, V };
}

function mazeHedges({ H, V }) {
  const g = new THREE.Group();
  // merge consecutive wall segments into long hedge runs
  for (let rr = 0; rr <= N; rr++) {
    const h = rr === 0 || rr === N ? H_OUT : H_IN;
    let start = -1;
    for (let c = 0; c <= N; c++) {
      const on = c < N && H[rr][c];
      if (on && start < 0) start = c;
      if (!on && start >= 0) {
        const len = (c - start) * CELL + T;
        g.add(place(hedgeBlock(len, h, T), { x: X0 + ((start + c) / 2) * CELL, z: Z0 + rr * CELL }));
        start = -1;
      }
    }
  }
  for (let c = 0; c <= N; c++) {
    const h = c === 0 || c === N ? H_OUT : H_IN;
    let start = -1;
    for (let rr = 0; rr <= N; rr++) {
      const on = rr < N && V[rr][c];
      if (on && start < 0) start = rr;
      if (!on && start >= 0) {
        // a hair lower than the cross runs so the overlapping tops don't z-fight
        const len = (rr - start) * CELL + T;
        g.add(place(hedgeBlock(T, h - 0.03, len), { x: X0 + c * CELL, z: Z0 + ((start + rr) / 2) * CELL }));
        start = -1;
      }
    }
  }
  return g;
}

function gazebo() {
  const white = mat(PALETTE.white);
  const roof = surface('roofTiles', PALETTE.roofRed, { size: 1.2 });
  const g = new THREE.Group();
  g.add(cylinder(1.55, 1.65, 0.3, mat(PALETTE.stone), 8));
  g.add(place(cylinder(1.45, 1.45, 0.06, mat(PALETTE.lightGrey), 8), { y: 0.3 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.add(place(cylinder(0.08, 0.09, 2.4, white, 6), { x: Math.cos(a) * 1.3, z: Math.sin(a) * 1.3, y: 0.35 }));
    // low balustrade between the posts (leave the south-west bay open)
    if (i !== 1) {
      const b = (a + Math.PI / 8);
      g.add(place(box(1.0, 0.08, 0.1, white), { x: Math.cos(b) * 1.2, z: Math.sin(b) * 1.2, y: 1.15, ry: THREE.MathUtils.radToDeg(b) + 90 }));
      g.add(place(box(0.95, 0.5, 0.05, mat(PALETTE.cream)), { x: Math.cos(b) * 1.2, z: Math.sin(b) * 1.2, y: 0.4, ry: THREE.MathUtils.radToDeg(b) + 90 }));
    }
  }
  g.add(place(cylinder(1.5, 1.5, 0.25, white, 8), { y: 2.75 }));
  g.add(place(cone(1.85, 1.5, roof, 8), { y: 3.0 }));
  g.add(place(cylinder(0.12, 0.15, 0.35, white, 6), { y: 4.35 }));
  g.add(place(sphere(0.16, metal(PALETTE.glassGold, { roughness: 0.3 }), 8), { y: 4.65 }));
  // round bench inside
  g.add(place(cylinder(0.55, 0.55, 0.45, mat(PALETTE.wood), 8), { y: 0.36 }));
  return g;
}

function viewingPlatform({ w, d, h }) {
  const wood = mat(PALETTE.wood);
  const dark = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  // posts
  for (const sx of [-1, 0, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.22, h, 0.22, dark), { x: sx * (w / 2 - 0.15), z: sz * (d / 2 - 0.15) }));
  }
  // cross bracing under the deck on the two long sides
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      const br = box(Math.hypot(w / 2 - 0.3, h - 0.4), 0.12, 0.12, dark);
      br.geometry = br.geometry.clone().translate(0, -0.06, 0);
      br.rotation.z = Math.atan2(h - 0.4, w / 2 - 0.3) * (sx < 0 ? 1 : -1);
      br.position.set(sx * (w / 4 - 0.075), h / 2, sz * (d / 2 - 0.15));
      g.add(br);
    }
  }
  // deck
  g.add(place(box(w + 0.2, 0.25, d + 0.2, surface('planks', PALETTE.wood, { size: 2 })), { y: h - 0.25 }));
  // railings, opening for the stair at the front-right corner
  const railM = mat(PALETTE.white);
  const rail = fence({ w: w + 0.1, d: d + 0.1, h: 1.0, style: 'railing', color: PALETTE.white, sides: ['back', 'left', 'right'] });
  g.add(place(rail, { y: h }));
  g.add(place(fence({ w: w - 1.6, d: 0.1, h: 1.0, style: 'railing', color: PALETTE.white, sides: ['front'] }), { x: -0.8, y: h, z: d / 2 + 0.05 }));
  g.add(place(box(0.12, 1.0, 0.12, railM), { x: w / 2 - 1.55, y: h, z: d / 2 + 0.05 }));
  // coin-operated binoculars facing the maze
  g.add(place(cylinder(0.06, 0.08, 1.1, metal(PALETTE.steelDark), 6), { x: -w / 2 + 0.7, y: h, z: -d / 2 + 0.6 }));
  g.add(place(box(0.35, 0.25, 0.5, mat(PALETTE.navy)), { x: -w / 2 + 0.7, y: h + 1.05, z: -d / 2 + 0.6, ry: 35 }));
  // flag on the back corner
  g.add(place(flag({ h: 4.2, color: PALETTE.roofGreen, color2: PALETTE.white }), { x: w / 2 - 0.15, y: h, z: -d / 2 + 0.15, ry: 180 }));
  return g;
}

function ticketKiosk() {
  const g = new THREE.Group();
  const w = 2.4, d = 1.6, h = 2.4;
  g.add(box(w, h, d, mat(PALETTE.cream)));
  g.add(place(box(w + 0.1, 0.15, d + 0.1, mat(PALETTE.roofGreen)), { y: 0 }));
  g.add(place(box(1.5, 0.8, 0.06, mat(PALETTE.window, { roughness: 0.3, metalness: 0.3 })), { y: 1.0, z: d / 2 }));
  g.add(place(box(1.7, 0.08, 0.3, mat(PALETTE.wood)), { y: 0.95, z: d / 2 + 0.15 }));
  g.add(place(box(0.7, 2.0, 0.06, mat(PALETTE.roofGreen)), { x: w / 2, y: 0, z: 0, ry: 90 }));
  g.add(place(awning({ w: 2.2, depth: 0.7, drop: 0.3, color: PALETTE.roofGreen, color2: PALETTE.white }), { y: 2.15, z: d / 2 }));
  g.add(place(pyramidRoof({ w, d, h: 1.0, overhang: 0.25, material: surface('roofTiles', PALETTE.roofRed, { size: 1.2 }) }), { y: h }));
  g.add(place(boardSign({ text: 'TICKETS', w: 1.7, h: 0.42, bg: PALETTE.roofGreen }), { y: h - 0.1, z: d / 2 + 0.2 }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // gravel maze floor, entrance garden and side walk
  const gravel = surface('gravel', shade(PALETTE.sand, -0.05), { size: 3 });
  g.add(place(patch(N * CELL + 0.6, N * CELL + 0.6, gravel), { x: X0 + (N * CELL) / 2, y: y0, z: Z0 + (N * CELL) / 2 }));
  g.add(place(patch(20, 3.0, gravel), { y: y0, z: 8.5 }));
  g.add(place(patch(1.6, 2.4, gravel), { x: -1, y: y0, z: 6.2 }));

  // the maze
  const maze = generateMaze(7);
  g.add(place(mazeHedges(maze), { y: y0 }));

  // central plaza: paving ring + gazebo + corner ball topiaries
  const pcx = 0, pcz = Z0 + 4 * CELL;
  g.add(place(cylinder(1.7, 1.7, 0.06, surface('paving', PALETTE.paving, { size: 2 }), 16), { x: pcx, y: y0, z: pcz }));
  g.add(place(gazebo(), { x: pcx, y: y0 + 0.02, z: pcz }));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(sphere(0.32, mat(PALETTE.foliage), 8), { x: pcx + dx * 1.45, y: y0, z: pcz + dz * 1.45 }));
  }

  // viewing platform over the front-right corner, stairs down to the garden
  const deckW = 5.4, deckD = 3.6, deckH = 3.2;
  const dx = 4.3 + deckW / 2, dz = Z0 + 6 * CELL + 0.35 + deckD / 2;
  g.add(place(viewingPlatform({ w: deckW, d: deckD, h: deckH }), { x: dx, y: y0, z: dz }));
  const stairX = dx + deckW / 2 - 0.75;
  const stairD = 3.0;
  g.add(place(stairs({ w: 1.2, h: deckH, d: stairD, steps: 11, material: mat(PALETTE.wood) }), { x: stairX, y: y0, z: dz + deckD / 2 + stairD / 2 + 0.1 }));
  for (const sx of [-1, 1]) {
    const hand = box(0.08, 0.08, Math.hypot(stairD, deckH), mat(PALETTE.white));
    hand.rotation.x = Math.atan2(deckH, stairD);
    hand.position.set(stairX + sx * 0.62, y0 + deckH / 2 + 0.95, dz + deckD / 2 + stairD / 2 + 0.1);
    g.add(hand);
  }
  // planter boxes under the deck
  g.add(place(box(3.4, 0.45, 0.6, mat(PALETTE.woodDark)), { x: dx - 0.8, y: y0, z: dz - 1.2 }));
  g.add(place(box(3.3, 0.06, 0.5, field('flowers', { size: 2 })), { x: dx - 0.8, y: y0 + 0.45, z: dz - 1.2 }));

  // entrance gate: white posts + board sign over the gap in the front hedge
  const gx = cellX(ENTRANCE_COL), gz = Z0 + N * CELL + T / 2 + 0.12;
  const white = mat(PALETTE.white);
  for (const sx of [-1, 1]) {
    g.add(place(box(0.28, 3.9, 0.28, white), { x: gx + sx * 1.1, y: y0, z: gz }));
    g.add(place(sphere(0.2, white, 8), { x: gx + sx * 1.1, y: y0 + 3.85, z: gz }));
  }
  g.add(place(boardSign({ text: 'HEDGE MAZE', w: 3.8, h: 0.95, bg: PALETTE.roofGreen }), { x: gx, y: y0 + 2.8, z: gz + 0.1 }));

  // entrance garden: spiral topiaries flanking the gate, flower beds, rabbit, benches, lamps
  g.add(place(spiralTopiary({ h: 2.6 }), { x: gx - 1.9, y: y0, z: 7.6 }));
  g.add(place(spiralTopiary({ h: 2.6 }), { x: gx + 1.9, y: y0, z: 7.6 }));
  const flowers = field('flowers', { size: 2 });
  for (const [x, w] of [[-5.9, 3.6], [3.0, 3.6]]) {
    g.add(place(box(w, 0.3, 0.8, mat(PALETTE.stone)), { x, y: y0, z: 7.25 }));
    g.add(place(box(w - 0.15, 0.05, 0.65, flowers), { x, y: y0 + 0.3, z: 7.25 }));
  }
  g.add(place(rabbitTopiary({ s: 0.95 }), { x: -3.4, y: y0, z: 8.7, ry: 25 }));
  g.add(place(ticketKiosk(), { x: -7.9, y: y0, z: 8.4 }));
  g.add(place(bench({ w: 1.6 }), { x: 1.6, y: y0, z: 9.3, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 4.5, y: y0, z: 9.3, ry: 180 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -4.8, y: y0, z: 9.6, ry: 90 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 6.0, y: y0, z: 9.6, ry: 90 }));
  g.add(place(ballTopiary({ h: 1.6, r: 0.45 }), { x: 0.6, y: y0, z: 8.0 }));
  g.add(place(ballTopiary({ h: 1.6, r: 0.45 }), { x: -2.6, y: y0, z: 7.2 }));

  // west strip: a row of clipped obelisks; east strip: tiered topiaries in pots
  for (let i = 0; i < 6; i++) {
    g.add(place(coneTopiary({ h: 2.8, r: 0.55 }), { x: -9.15, y: y0, z: -8.6 + i * 3.2 }));
  }
  for (let i = 0; i < 4; i++) {
    g.add(place(tieredTopiary({ h: 2.5 }), { x: 9.15, y: y0, z: -8.4 + i * 3.4 }));
  }

  // visitors: on the platform, in the plaza and lost in the corridors
  const r = rng(42);
  const shirts = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.orange, PALETTE.purple, PALETTE.white, PALETTE.green];
  const spots = [
    [dx - 1.2, deckH, dz + 0.3], [dx + 0.6, deckH, dz - 0.8], [dx - 2.0, deckH, dz - 1.0],
    [pcx + 1.1, 0.3, pcz + 1.5],
    [cellX(1), 0, cellZ(1)], [cellX(5), 0, cellZ(2)], [cellX(2), 0, cellZ(6)], [cellX(6), 0, cellZ(4)], [cellX(0), 0, cellZ(5)],
    [gx - 0.3, 0, 8.6], [gx + 0.5, 0, 9.1], [-6.6, 0, 9.5],
  ];
  for (const [x, y, z] of spots) {
    g.add(place(person({ shirt: r.pick(shirts) }), { x, y: y0 + y, z, ry: r.range(0, 360) }));
  }
  return g;
}

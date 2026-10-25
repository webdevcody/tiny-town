import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, facadeBlock, gableRoof, hipRoof, pyramidRoof, door, windowPanel, box, beam, cylinder, cone, place, group,
  tree, car, surface, mat, shade, rng,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street / beach access) faces +z.
// Two pastel beach houses on timber stilts over the sand, each with a
// wraparound deck, open timber stairs and dune grass round about.

const Y0 = LOT_HEIGHT;
const STILT_H = 2.7; // height of the deck surface above the sand
const DECK_T = 0.22;

const timber = () => mat(PALETTE.woodLight);
const timberDark = () => mat(PALETTE.wood);
const deckBoards = () => surface('planks', PALETTE.woodLight, { size: 1.5 });
const trim = () => mat(PALETTE.white);

/** White deck railing along X, centred, base at y = 0. */
function railing(len, h = 0.95) {
  const g = new THREE.Group();
  const m = trim();
  const posts = Math.max(2, Math.round(len / 0.45) + 1);
  for (let i = 0; i < posts; i++) {
    const t = -len / 2 + (len * i) / (posts - 1);
    const big = i === 0 || i === posts - 1 || i % 4 === 0;
    g.add(place(box(big ? 0.12 : 0.06, h, big ? 0.12 : 0.06, m), { x: t }));
  }
  g.add(place(box(len, 0.08, 0.14, m), { y: h - 0.08 }));
  g.add(place(box(len, 0.06, 0.06, m), { y: 0.15 }));
  return g;
}

/** Railing around a w x d rectangle, base at y = 0, with openings.
 *  gaps: [{ side: 'front'|'back'|'left'|'right', at, w }] (at = offset along the side). */
function deckRailing(w, d, gaps = []) {
  const g = new THREE.Group();
  const sides = {
    front: { len: w, pos: (t) => ({ x: t, z: d / 2 }), ry: 0 },
    back: { len: w, pos: (t) => ({ x: t, z: -d / 2 }), ry: 0 },
    left: { len: d, pos: (t) => ({ x: -w / 2, z: t }), ry: 90 },
    right: { len: d, pos: (t) => ({ x: w / 2, z: t }), ry: 90 },
  };
  for (const [name, s] of Object.entries(sides)) {
    const cuts = gaps.filter((q) => q.side === name).sort((a, b) => a.at - b.at);
    let start = -s.len / 2;
    const runs = [];
    for (const c of cuts) {
      runs.push([start, c.at - c.w / 2]);
      start = c.at + c.w / 2;
    }
    runs.push([start, s.len / 2]);
    for (const [a, b] of runs) {
      if (b - a < 0.3) continue;
      const p = s.pos((a + b) / 2);
      g.add(place(railing(b - a), { ...p, ry: s.ry }));
    }
  }
  return g;
}

/** Open timber stair: treads + stringers + white handrails. Rises towards -Z,
 *  top tread at z = -run/2, foot at z = +run/2. Base at y = 0. */
function timberStairs({ w = 1.2, h = STILT_H, run = 3.2 } = {}) {
  const g = new THREE.Group();
  const steps = Math.round(h / 0.19);
  const tread = timber();
  for (let i = 0; i < steps; i++) {
    const t = (i + 1) / steps;
    g.add(place(box(w, 0.06, run / steps + 0.06, tread), { y: t * h - 0.06, z: run / 2 - t * run + run / steps / 2 }));
  }
  const str = timberDark();
  const rail = trim();
  for (const sx of [-1, 1]) {
    const x = sx * (w / 2 + 0.05);
    g.add(beam([x, 0.05, run / 2], [x, h - 0.05, -run / 2], 0.14, str));
    g.add(beam([x, 0.95, run / 2 - 0.1], [x, h + 0.9, -run / 2], 0.07, rail));
    g.add(place(box(0.1, 0.95, 0.1, rail), { x, z: run / 2 - 0.1 }));
  }
  return g;
}

/** Hanging beach towel draped over a railing (faces ±Z). */
function towel(color, color2) {
  return group(
    place(box(0.6, 0.7, 0.03, surface('stripes', color, { color2, size: 0.3 })), { y: 0.25, z: 0.09 }),
    place(box(0.6, 0.7, 0.03, surface('stripes', color, { color2, size: 0.3 })), { y: 0.25, z: -0.09 }),
  );
}

/**
 * One raised beach house, origin at the centre of its deck on the ground.
 */
function stiltHouse(o) {
  const {
    deckW, deckD, bodyW, bodyD, bodyX = 0, bodyZ = 0, floors = 1, wall, shutters, roofColor,
    roof = 'gable', ridge = 'x', seed = 1, stairs, stiltsX, stiltsZ, skipStilts = [], towels = [],
  } = o;
  const g = new THREE.Group();
  const H = STILT_H;

  // stilts: a grid of square timber piles, plus diagonal braces on the outer rows
  const pile = timberDark();
  const xs = Array.from({ length: stiltsX }, (_, i) => -deckW / 2 + 0.2 + ((deckW - 0.4) * i) / (stiltsX - 1));
  const zs = Array.from({ length: stiltsZ }, (_, i) => -deckD / 2 + 0.2 + ((deckD - 0.4) * i) / (stiltsZ - 1));
  xs.forEach((x, i) => zs.forEach((z, j) => {
    if (skipStilts.some(([a, b]) => a === i && b === j)) return;
    g.add(place(box(0.3, H - DECK_T, 0.3, pile), { x, z }));
  }));
  const brace = timber();
  for (const z of [zs[0], zs[zs.length - 1]]) {
    for (let i = 0; i < xs.length - 1; i++) {
      const [a, b] = i % 2 ? [xs[i], xs[i + 1]] : [xs[i + 1], xs[i]];
      g.add(beam([a, 0.5, z], [b, H - 0.55, z], 0.1, brace));
    }
  }
  for (const x of [xs[0], xs[xs.length - 1]]) {
    for (let j = 0; j < zs.length - 1; j++) {
      g.add(beam([x, 0.5, zs[j]], [x, H - 0.55, zs[j + 1]], 0.1, brace));
    }
  }
  // rim joists + deck boards
  const rim = timberDark();
  g.add(place(box(deckW, 0.4, 0.16, rim), { y: H - DECK_T - 0.4, z: deckD / 2 - 0.08 }));
  g.add(place(box(deckW, 0.4, 0.16, rim), { y: H - DECK_T - 0.4, z: -deckD / 2 + 0.08 }));
  g.add(place(box(0.16, 0.4, deckD, rim), { x: deckW / 2 - 0.08, y: H - DECK_T - 0.4 }));
  g.add(place(box(0.16, 0.4, deckD, rim), { x: -deckW / 2 + 0.08, y: H - DECK_T - 0.4 }));
  g.add(place(box(deckW, DECK_T, deckD, [rim, rim, deckBoards(), rim, rim, rim]), { y: H - DECK_T }));

  // house body (clapboard-pastel walls, white trim, shutters)
  const hb = FLOOR * floors;
  g.add(place(facadeBlock({
    w: bodyW, d: bodyD, floors, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.glassSky,
    shutters, windowW: 0.5, windowH: 0.52, bay: 1.9, lit: 0.08, seed, roof: shade(roofColor, -0.3),
  }), { x: bodyX, y: H, z: bodyZ }));
  // white corner boards + sill band
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.16, hb - 0.08, 0.16, trim()), { x: bodyX + sx * bodyW / 2, y: H, z: bodyZ + sz * bodyD / 2 }));
  }
  g.add(place(box(bodyW + 0.12, 0.14, bodyD + 0.12, trim()), { x: bodyX, y: H }));
  if (floors > 1) g.add(place(box(bodyW + 0.1, 0.1, bodyD + 0.1, trim()), { x: bodyX, y: H + FLOOR - 0.05 }));
  // front door with a little glass light
  g.add(place(door({ w: 1.0, h: 2.15, color: shade(wall, -0.35), frame: PALETTE.white }), { x: bodyX + (o.doorX ?? 0), y: H, z: bodyZ + bodyD / 2 }));

  // roof
  const roofMat = surface('corrugated', roofColor, { size: 1.2 });
  const roofY = H + hb;
  if (roof === 'gable') {
    g.add(place(gableRoof({ w: bodyW, d: bodyD, h: o.roofH ?? 2.2, overhang: 0.5, ridge, material: roofMat, gableMaterial: wall }), { x: bodyX, y: roofY, z: bodyZ }));
    if (ridge === 'z') {
      // small window up in the front gable
      g.add(place(windowPanel({ w: 0.8, h: 0.7, glassColor: PALETTE.glassSky, frame: PALETTE.white }), { x: bodyX, y: roofY + 0.35, z: bodyZ + bodyD / 2 }));
    }
  } else {
    g.add(place(hipRoof({ w: bodyW, d: bodyD, h: o.roofH ?? 1.8, overhang: 0.55, material: roofMat }), { x: bodyX, y: roofY, z: bodyZ }));
  }

  // covered porch over the front deck: shed roof on white posts
  if (o.porch) {
    const pz0 = bodyZ + bodyD / 2, pz1 = deckD / 2 - 0.15;
    const pd = pz1 - pz0;
    const ph = 2.5;
    const roofPorch = new THREE.Group();
    roofPorch.add(place(box(o.porch.w + 0.4, 0.14, pd + 0.4, [rim, rim, roofMat, trim(), trim(), trim()]), { y: 0 }));
    g.add(place(roofPorch, { x: bodyX + (o.porch.x ?? 0), y: H + ph, z: (pz0 + pz1) / 2 + 0.2, rx: -8 }));
    for (const sx of [-1, 1]) {
      g.add(place(box(0.14, ph, 0.14, trim()), { x: bodyX + (o.porch.x ?? 0) + sx * (o.porch.w / 2 - 0.05), y: H, z: pz1 - 0.05 }));
    }
  }

  // little glazed cupola on the roof ridge
  if (o.cupola) {
    const cy = roofY + (o.roofH ?? 1.8) - 0.5;
    g.add(place(facadeBlock({ w: 1.4, d: 1.4, h: 1.2, floorHeight: 1.2, style: 'punched', wall: PALETTE.white, glass: PALETTE.glassSky, windowW: 0.7, windowH: 0.6, bay: 1.4, roof: PALETTE.white }), { x: bodyX, y: cy, z: bodyZ }));
    g.add(place(pyramidRoof({ w: 1.4, h: 0.8, overhang: 0.2, material: roofMat }), { x: bodyX, y: cy + 1.2, z: bodyZ }));
  }
  for (const c of o.chairs ?? []) g.add(place(adirondack(c.c), { x: c.x, y: H, z: c.z, ry: c.ry ?? 0 }));
  if (o.grill) g.add(place(grill(), { x: o.grill.x, y: H, z: o.grill.z }));

  // deck railing with an opening for the stairs
  g.add(place(deckRailing(deckW - 0.12, deckD - 0.12, [stairs.gap]), { y: H }));
  for (const t of towels) g.add(place(towel(t.c, t.c2), { x: t.x, y: H + 0.95 - 0.9, z: t.z, ry: t.ry ?? 0 }));

  // stairs down to the sand
  if (stairs.landing) {
    // square landing off the front of the deck, stairs then run down along the front towards -x
    const lx = stairs.gap.at, lz = deckD / 2 + 0.65;
    g.add(place(box(1.3, DECK_T, 1.3, [rim, rim, deckBoards(), rim, rim, rim]), { x: lx, y: H - DECK_T, z: lz }));
    for (const [px, pz] of [[lx - 0.55, lz + 0.55], [lx + 0.55, lz + 0.55]]) g.add(place(box(0.24, H - DECK_T, 0.24, pile), { x: px, z: pz }));
    g.add(place(railing(1.3), { x: lx, y: H, z: lz + 0.62 }));
    g.add(place(railing(1.3), { x: lx + 0.62, y: H, z: lz, ry: 90 }));
    g.add(place(timberStairs({ w: 1.15, h: H, run: stairs.run }), { x: lx - 0.65 - stairs.run / 2, z: lz, ry: -90 }));
  } else {
    g.add(place(timberStairs({ w: 1.15, h: H, run: stairs.run }), { x: stairs.gap.at, z: deckD / 2 + stairs.run / 2 - 0.04 }));
  }
  return g;
}

/** Adirondack chair, faces +Z. */
function adirondack(color) {
  const m = mat(color);
  return group(
    place(box(0.7, 0.07, 0.65, m), { y: 0.38 }),
    place(box(0.7, 0.75, 0.07, m), { y: 0.4, z: -0.38, rx: -18 }),
    place(box(0.08, 0.4, 0.6, m), { x: -0.38 }),
    place(box(0.08, 0.4, 0.6, m), { x: 0.38 }),
    place(box(0.14, 0.05, 0.75, m), { x: -0.4, y: 0.62 }),
    place(box(0.14, 0.05, 0.75, m), { x: 0.4, y: 0.62 }),
  );
}

/** Kettle barbecue on legs. */
function grill() {
  const m = mat(PALETTE.black, { roughness: 0.4, metalness: 0.4 });
  const g = group(
    place(cylinder(0.03, 0.03, 0.6, m, 4), { x: 0.2 }),
    place(cylinder(0.03, 0.03, 0.6, m, 4), { x: -0.2 }),
    place(cylinder(0.03, 0.03, 0.6, m, 4), { z: 0.2 }),
  );
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.32, 10, 6), m);
  bowl.position.y = 0.75;
  g.add(bowl);
  return g;
}

/** Clump of dune grass: thin leaning blades. */
function duneGrass(r, s = 1) {
  const g = new THREE.Group();
  const cols = [PALETTE.foliageLight, PALETTE.hay, shade(PALETTE.foliageLight, 0.15), PALETTE.grassLight];
  const n = 7;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r() * 0.6;
    const h = (0.8 + r() * 0.6) * s;
    const blade = cone(0.09 * s, h, mat(cols[i % cols.length]), 4);
    g.add(place(blade, { x: Math.cos(a) * 0.12 * s, z: Math.sin(a) * 0.12 * s, rx: Math.sin(a) * 22, rz: -Math.cos(a) * 22 }));
  }
  return g;
}

/** Low sand dune mound. */
function dune(w, h, d) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2), surface('gravel', shade(PALETTE.sand, 0.04), { size: 4 }));
  m.scale.set(w / 2, h, d / 2);
  return m;
}

function umbrella(c1, c2) {
  const g = new THREE.Group();
  g.add(cylinder(0.04, 0.04, 2.2, mat(PALETTE.white), 6));
  const n = 8;
  for (let i = 0; i < n; i++) {
    const seg = new THREE.Mesh(new THREE.ConeGeometry(1.3, 0.45, n, 1, true, (i / n) * Math.PI * 2, (Math.PI * 2) / n), mat(i % 2 ? c1 : c2, { side: THREE.DoubleSide }));
    seg.position.y = 2.2 - 0.05 + 0.225;
    g.add(seg);
  }
  return g;
}

function lounger(color) {
  return group(
    place(box(0.6, 0.08, 1.4, mat(color)), { y: 0.25, z: 0.2 }),
    place(box(0.6, 0.08, 0.6, mat(color)), { y: 0.45, z: -0.68, rx: 45 }),
    place(box(0.05, 0.25, 0.05, mat(PALETTE.white)), { x: -0.25, z: 0.8 }),
    place(box(0.05, 0.25, 0.05, mat(PALETTE.white)), { x: 0.25, z: 0.8 }),
    place(box(0.05, 0.25, 0.05, mat(PALETTE.white)), { x: -0.25, z: -0.4 }),
    place(box(0.05, 0.25, 0.05, mat(PALETTE.white)), { x: 0.25, z: -0.4 }),
  );
}

function surfboard(color) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), mat(color, { roughness: 0.4 }));
  m.scale.set(0.26, 1.05, 0.05);
  m.position.y = 1.05;
  return group(m);
}

function kayak(color) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 6), mat(color, { roughness: 0.5 }));
  m.scale.set(1.7, 0.2, 0.33);
  m.position.y = 0.2;
  const seat = place(box(0.6, 0.08, 0.4, mat(PALETTE.black)), { y: 0.36 });
  return group(m, seat);
}

function outdoorShower() {
  const m = mat(PALETTE.steelLight);
  return group(
    place(box(0.9, 0.06, 0.9, timber()), {}),
    place(cylinder(0.04, 0.04, 2.3, m, 6), { x: -0.35, z: -0.35 }),
    beam([-0.35, 2.25, -0.35], [0, 2.25, 0], 0.05, m),
    place(cylinder(0.14, 0.08, 0.1, m, 8), { y: 2.12 }),
  );
}

function sandFence(len) {
  const g = new THREE.Group();
  const slat = mat(PALETTE.wood);
  const n = Math.round(len / 0.22);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (len * (i + 0.5)) / n;
    g.add(place(box(0.07, 0.95 + (i % 3) * 0.04, 0.03, slat), { x, rz: ((i % 5) - 2) * 2 }));
  }
  g.add(place(box(len, 0.03, 0.04, mat(PALETTE.steel)), { y: 0.25 }));
  g.add(place(box(len, 0.03, 0.04, mat(PALETTE.steel)), { y: 0.75 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'sand'));
  const y = Y0;
  const halfW = TILE, halfD = TILE / 2;

  // --- west house: powder blue, two storeys, hipped roof, covered front porch
  const A = { x: -5.15, z: -1.4 };
  const deckA = { w: 8.3, d: 6.0, stairX: -2.8, run: 3.0 };
  g.add(place(stiltHouse({
    deckW: deckA.w, deckD: deckA.d, bodyW: 6.0, bodyD: 4.0, bodyZ: -0.6, floors: 2,
    wall: shade(PALETTE.plasterBlue, 0.12), shutters: PALETTE.navy, roofColor: PALETTE.roofSlate,
    roof: 'hip', roofH: 2.0, seed: 3, stiltsX: 4, stiltsZ: 3, doorX: 1.4,
    porch: { w: 4.6, x: 0.6 }, cupola: true,
    chairs: [{ x: -1.1, z: 2.1, c: PALETTE.red }, { x: -0.1, z: 2.1, c: PALETTE.yellow }],
    stairs: { gap: { side: 'front', at: deckA.stairX, w: 1.3 }, run: deckA.run },
    towels: [{ x: 3.0, z: deckA.d / 2 - 0.06, c: PALETTE.red, c2: PALETTE.white }],
  }), { x: A.x, y, z: A.z }));

  // --- east house: soft pink, single storey with a tall gable, stairs off a landing
  const B = { x: 5.05, z: -1.7 };
  const deckB = { w: 8.7, d: 6.2, landX: 2.6, run: 3.2 };
  g.add(place(stiltHouse({
    deckW: deckB.w, deckD: deckB.d, bodyW: 6.2, bodyD: 4.4, bodyX: -0.6, bodyZ: -0.4, floors: 1,
    wall: shade(PALETTE.pink, 0.1), shutters: PALETTE.white, roofColor: PALETTE.roofGreen,
    roof: 'gable', ridge: 'z', roofH: 2.4, seed: 7, stiltsX: 4, stiltsZ: 2, doorX: 1.2,
    stairs: { gap: { side: 'front', at: deckB.landX, w: 1.2 }, landing: true, run: deckB.run },
    grill: { x: 3.6, z: 2.2 },
    chairs: [{ x: 3.3, z: -2.2, ry: 90, c: PALETTE.pool }, { x: 3.3, z: -1.0, ry: 90, c: PALETTE.white }],
    towels: [
      { x: deckB.w / 2 - 0.06, z: 0.6, ry: 90, c: PALETTE.yellow, c2: PALETTE.blue },
      { x: deckB.w / 2 - 0.06, z: -1.0, ry: 90, c: PALETTE.green, c2: PALETTE.white },
    ],
  }), { x: B.x, y, z: B.z }));

  // car parked under the pink house, between the piles
  g.add(place(car({ color: PALETTE.yellow }), { x: B.x - 0.3, y, z: B.z - 0.3, s: 0.95 }));
  // kayaks under the blue house
  g.add(place(kayak(PALETTE.orange), { x: A.x - 0.4, y, z: A.z + 0.9 }));
  g.add(place(kayak(PALETTE.red), { x: A.x + 0.6, y, z: A.z - 1.0, s: 0.9 }));

  // boardwalks from the street to each stair foot
  const walk = surface('planks', PALETTE.wood, { size: 1.2 });
  const footA = A.z + deckA.d / 2 + deckA.run;
  g.add(place(box(1.3, 0.08, halfD - footA + 0.1, walk), { x: A.x + deckA.stairX, y, z: (footA + halfD) / 2 - 0.05 }));
  const footBx = B.x + deckB.landX - 0.65 - deckB.run, footBz = B.z + deckB.d / 2 + 0.65;
  g.add(place(box(1.3, 0.08, halfD - footBz + 0.65, walk), { x: footBx - 0.6, y, z: (footBz - 0.65 + halfD) / 2 }));

  // outdoor shower beside the pink house landing
  g.add(place(outdoorShower(), { x: B.x + 3.6, y, z: halfD - 1.3 }));
  // surfboards leaning on the blue house's front piles
  const fz = A.z + deckA.d / 2 + 0.25;
  g.add(place(surfboard(PALETTE.yellow), { x: A.x + 1.6, y, z: fz, rx: -12 }));
  g.add(place(surfboard(PALETTE.pool), { x: A.x + 2.2, y, z: fz, rx: -12, rz: 5 }));
  g.add(place(surfboard(PALETTE.red), { x: A.x + 2.8, y, z: fz, rx: -12, rz: -4 }));

  // beach umbrella and loungers in the gap between the houses
  g.add(place(umbrella(PALETTE.red, PALETTE.white), { x: 0.2, y, z: 3.6 }));
  g.add(place(lounger(PALETTE.blue), { x: -0.5, y, z: 3.5, ry: 180 }));
  g.add(place(lounger(PALETTE.yellow), { x: 0.9, y, z: 3.5, ry: 180 }));

  // dunes along the back with a slatted sand fence, and dune grass everywhere
  g.add(place(dune(6, 0.7, 2.2), { x: -2.0, y, z: -halfD + 1.2 }));
  g.add(place(dune(5, 0.55, 2.0), { x: 7.2, y, z: halfD - 1.0 }));
  g.add(place(dune(3.6, 0.5, 2.0), { x: -halfW + 2.1, y, z: halfD - 1.0 }));
  g.add(place(sandFence(3.0), { x: -halfW + 1.8, y, z: halfD - 1.9 }));

  const r = rng(42);
  const spots = [
    [-9.3, 4.2, 1.1], [-8.4, 4.5, 0.9], [-9.4, 3.2, 1], [-6.9, 4.4, 0.8], [-4.3, 4.6, 0.9],
    [-1.5, 4.4, 0.8], [1.9, 4.6, 0.9], [-0.6, -4.5, 1.1], [-2.0, -4.1, 1.2], [-3.4, -4.6, 1],
    [6.2, 4.5, 1], [7.4, 4.0, 1.1], [8.5, 4.6, 0.9], [9.4, 3.7, 1], [9.4, -0.5, 0.9],
    [9.5, 1.4, 0.8], [-9.6, -2.0, 0.9], [-9.5, 0.6, 0.8], [0.2, 0.4, 0.8], [-0.3, -2.0, 1],
    [0.1, 1.9, 0.7], [3.2, 4.3, 0.8], [9.6, -4.4, 1], [0.9, -4.6, 0.9],
  ];
  for (const [x, z, s] of spots) g.add(place(duneGrass(r, s), { x, y: y + (Math.abs(z) > 4 ? 0.2 : 0), z }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: -9.2, y, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 12 }), { x: 0.6, y, z: -3.3 }));
  return g;
}

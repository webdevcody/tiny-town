import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, beam, place, group, mat, surface, shade, rng,
  gableRoof, sign, fence, tree, windowPanel,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Five N-S rows of orange trees on mown grass, a packing yard along the street.

const HALF = TILE; // half of 20 m
const y0 = LOT_HEIGHT;

const orangeM = mat(shade(PALETTE.orange, -0.08), { roughness: 0.8 });
const orangeLightM = mat(PALETTE.orange, { roughness: 0.8 });
const fruitGeo = new THREE.IcosahedronGeometry(0.2, 0);
const woodM = mat(PALETTE.woodLight);
const woodDarkM = mat(PALETTE.wood);
const crateM = surface('planks', PALETTE.woodLight, { size: 0.6 });
const leafMats = [PALETTE.foliage, shade(PALETTE.foliage, -0.1)].map((c) => mat(c, { roughness: 0.9 }));

function fruit(x, y, z, m = orangeM) {
  const f = new THREE.Mesh(fruitGeo, m);
  f.position.set(x, y, z);
  return f;
}

/** Round orange tree: short trunk, lumpy dense canopy dotted with fruit. */
function orangeTree(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const s = r.range(0.92, 1.06);
  const trunkH = 1.0 * s;
  g.add(cylinder(0.12, 0.17, trunkH + 0.4, PALETTE.trunk, 6));
  const leaf = r.pick(leafMats);
  const R = 1.45 * s;
  const blobs = [
    [0, trunkH + R * 0.9, 0, R],
    [r.range(-0.4, 0.4), trunkH + R * 1.45, r.range(-0.4, 0.4), R * 0.68],
  ];
  for (const [bx, by, bz, br] of blobs) {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(br, 1), leaf);
    m.position.set(bx, by, bz);
    m.scale.set(1, 0.88, 1);
    m.rotation.set(r() * 3, r() * 3, 0);
    g.add(m);
  }
  // fruit on the canopy surface, all the way round
  const count = 22;
  for (let i = 0; i < count; i++) {
    const [bx, by, bz, br] = i < 16 ? blobs[0] : blobs[1];
    const a = (i / count) * Math.PI * 2 * 3.7 + r() * 0.8;
    const el = r.range(-0.45, 0.95);
    const rr = br * 0.97;
    g.add(fruit(bx + Math.cos(a) * Math.cos(el) * rr, by + Math.sin(el) * rr * 0.88, bz + Math.sin(a) * Math.cos(el) * rr, r.chance(0.3) ? orangeLightM : orangeM));
  }
  return g;
}

/** Wooden crate 0.9 x 0.55 x 0.6, optionally heaped with oranges. */
function crate(full, seed = 1) {
  const g = new THREE.Group();
  const w = 0.9, h = 0.55, d = 0.6;
  g.add(box(w, h, d, crateM));
  // darker corner battens
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.07, h + 0.02, 0.07, woodDarkM), { x: sx * (w / 2 - 0.02), z: sz * (d / 2 - 0.02) }));
  if (full) {
    g.add(place(box(w - 0.08, 0.04, d - 0.08, orangeM), { y: h - 0.02 }));
    const r = rng(seed);
    for (let i = 0; i < 4; i++) {
      const f = fruit(r.range(-0.3, 0.3), h + 0.05, r.range(-0.18, 0.18), i % 2 ? orangeLightM : orangeM);
      f.scale.setScalar(0.65);
      g.add(f);
    }
  }
  return g;
}

/** Stack of crates: columns x layers, top layer full of fruit. */
function crateStack(cols, layers, seed) {
  const g = new THREE.Group();
  for (let c = 0; c < cols; c++) for (let l = 0; l < layers; l++) {
    g.add(place(crate(l === layers - 1, seed + c * 7 + l), { x: (c - (cols - 1) / 2) * 0.95, y: l * 0.56 }));
  }
  return g;
}

/** Pallet with a block of crates on it. */
function palletOfCrates(seed) {
  const g = new THREE.Group();
  g.add(box(2.0, 0.14, 1.3, woodDarkM));
  for (const z of [-0.32, 0.32]) g.add(place(crateStack(2, 2, seed + (z > 0 ? 3 : 0)), { y: 0.14, z }));
  return g;
}

/**
 * Three-legged orchard picking ladder. Rungs face +z, the ladder leans towards -z
 * (towards the tree) with the support pole behind on +z.
 */
function pickingLadder(h = 3.2) {
  const g = new THREE.Group();
  const lean = h * 0.22, t = 0.09;
  const baseW = 0.38, topW = 0.08;
  const top = [0, h, -lean];
  g.add(beam([-baseW, 0, 0], [-topW, h, -lean], t, woodM));
  g.add(beam([baseW, 0, 0], [topW, h, -lean], t, woodM));
  const rungs = 8;
  for (let i = 1; i < rungs; i++) {
    const k = i / rungs;
    const hw = baseW + (topW - baseW) * k;
    g.add(beam([-hw, h * k, -lean * k], [hw, h * k, -lean * k], 0.05, woodM));
  }
  g.add(beam(top, [0, 0, h * 0.5], t, woodDarkM));
  return g;
}

/** Tiny worker: legs, shirt, head, hat. */
function picker(shirt, { bag = true } = {}) {
  const g = new THREE.Group();
  const pants = mat(PALETTE.navy);
  g.add(place(box(0.16, 0.8, 0.2, pants), { x: -0.1 }));
  g.add(place(box(0.16, 0.8, 0.2, pants), { x: 0.1 }));
  g.add(place(box(0.46, 0.65, 0.28, mat(shirt)), { y: 0.8 }));
  g.add(place(new THREE.Mesh(new THREE.IcosahedronGeometry(0.15, 1), mat(PALETTE.peach)), { y: 1.6 }));
  g.add(place(cylinder(0.26, 0.26, 0.04, PALETTE.hay, 10), { y: 1.7 }));
  g.add(place(cylinder(0.12, 0.15, 0.13, PALETTE.hay, 10), { y: 1.72 }));
  if (bag) g.add(place(box(0.38, 0.32, 0.22, mat(PALETTE.wheat)), { y: 0.85, z: 0.24 }));
  return g;
}

/** Little farm tractor, length along X, bonnet towards +x. */
function tractor(color = PALETTE.red) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const black = mat(PALETTE.black);
  g.add(place(box(2.6, 0.5, 0.9, PALETTE.darkGrey), { y: 0.45 }));
  g.add(place(box(1.4, 0.7, 0.85, body), { x: 0.6, y: 0.75 }));             // bonnet
  g.add(place(box(0.05, 0.4, 0.6, PALETTE.steelDark), { x: 1.31, y: 0.85 })); // grille
  g.add(place(box(1.0, 0.35, 1.3, body), { x: -0.6, y: 0.95 }));             // fenders
  g.add(place(box(0.5, 0.45, 0.5, PALETTE.black), { x: -0.7, y: 1.3 }));     // seat back
  g.add(place(cylinder(0.05, 0.05, 0.9, PALETTE.darkGrey, 6), { x: 1.0, y: 1.4, z: 0.25 })); // exhaust
  // roll frame + canopy
  for (const sz of [-1, 1]) for (const sx of [-1.1, -0.3]) g.add(place(box(0.08, 1.4, 0.08, PALETTE.darkGrey), { x: sx, y: 1.25, z: sz * 0.55 }));
  g.add(place(box(1.1, 0.08, 1.3, body), { x: -0.7, y: 2.65 }));
  const wheel = (r, wdt, x, z) => {
    const geo = new THREE.CylinderGeometry(r, r, wdt, 12);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, black);
    m.position.set(x, r, z);
    g.add(m);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.45, r * 0.45, wdt + 0.04, 8).rotateX(Math.PI / 2), mat(PALETTE.yellow));
    hub.position.set(x, r, z);
    g.add(hub);
  };
  for (const sz of [-1, 1]) {
    wheel(0.65, 0.4, -0.7, sz * 0.75);
    wheel(0.38, 0.25, 0.85, sz * 0.62);
  }
  return g;
}

/** Flatbed trailer with crates of oranges, towbar towards +x. */
function trailer(seed) {
  const g = new THREE.Group();
  g.add(place(box(3.0, 0.15, 1.7, woodDarkM), { y: 0.65 }));
  for (const sz of [-1, 1]) g.add(place(box(3.0, 0.3, 0.06, woodM), { y: 0.8, z: sz * 0.82 }));
  for (const sx of [-1, 1]) g.add(place(box(0.06, 0.3, 1.7, woodM), { x: sx * 1.47, y: 0.8 }));
  g.add(beam([1.5, 0.6, 0], [2.3, 0.55, 0], 0.1, PALETTE.darkGrey));
  const black = mat(PALETTE.black);
  for (const sz of [-1, 1]) {
    const geo = new THREE.CylinderGeometry(0.36, 0.36, 0.22, 10).rotateX(Math.PI / 2);
    const w = new THREE.Mesh(geo, black);
    w.position.set(0, 0.36, sz * 0.92);
    g.add(w);
  }
  let k = 0;
  for (const x of [-0.95, 0, 0.95]) for (const z of [-0.4, 0.4]) {
    g.add(place(crate(true, seed + k++), { x, y: 0.72, z, ry: 90, s: 1 }));
  }
  g.add(place(crate(true, seed + 20), { x: -0.5, y: 0.72 + 0.55, z: 0, ry: 90 }));
  return g;
}

/** Open-fronted packing shed, opening towards +z. */
function packingShed() {
  const g = new THREE.Group();
  const w = 6.4, d = 3.4, h = 2.6;
  const wallM = surface('planks', PALETTE.brickBrown, { size: 1.2 });
  g.add(patch(w, d, 'concrete', 0.08));
  g.add(place(box(w, h, 0.15, wallM), { z: -d / 2 + 0.08 }));
  for (const sx of [-1, 1]) g.add(place(box(0.15, h, d, wallM), { x: sx * (w / 2 - 0.08) }));
  for (const sx of [-1, -1 / 3, 1 / 3, 1]) g.add(place(box(0.2, h, 0.2, PALETTE.woodDark), { x: sx * (w / 2 - 0.1), z: d / 2 - 0.1 }));
  g.add(place(box(w, 0.3, 0.2, PALETTE.woodDark), { y: h - 0.3, z: d / 2 - 0.1 }));
  g.add(place(gableRoof({ w, d, h: 1.3, overhang: 0.35, ridge: 'x', material: surface('corrugated', PALETTE.roofRed, { size: 0.8 }), gableMaterial: wallM }), { y: h }));
  // small windows on the back and sides
  for (const x of [-1.6, 1.6]) g.add(place(windowPanel({ w: 1.0, h: 0.8 }), { x, y: 1.3, z: -d / 2, ry: 180 }));
  for (const sx of [-1, 1]) g.add(place(windowPanel({ w: 1.0, h: 0.8 }), { x: sx * w / 2, y: 1.3, z: -0.3, ry: sx * 90 }));
  // sorting table heaped with oranges
  g.add(place(box(2.6, 0.08, 0.9, woodM), { x: 0.9, y: 0.85, z: -0.4 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.08, 0.85, 0.08, woodDarkM), { x: 0.9 + sx * 1.2, z: -0.4 + sz * 0.38 }));
  g.add(place(box(2.4, 0.1, 0.7, orangeM), { x: 0.9, y: 0.93, z: -0.4 }));
  const r = rng(77);
  for (let i = 0; i < 10; i++) g.add(fruit(0.9 + r.range(-1.1, 1.1), 1.05, -0.4 + r.range(-0.28, 0.28), i % 3 ? orangeM : orangeLightM));
  // crates stacked against the walls
  g.add(place(crateStack(2, 3, 30), { x: -2.0, y: 0.08, z: -1.15 }));
  g.add(place(crateStack(1, 2, 40), { x: -2.6, y: 0.08, z: 0.2, ry: 90 }));
  g.add(place(crateStack(2, 1, 50), { x: -1.4, y: 0.08, z: 0.9 }));
  // fascia sign
  g.add(place(sign({ text: 'FRESH ORANGES', w: 4.2, h: 0.7, bg: PALETTE.orange, fg: '#ffffff' }), { y: h - 0.75, z: d / 2 + 0.02 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // ---- orchard: 5 rows (along Z) x 4 trees
  const rowX = [-8, -4, 0, 4, 8];
  const treeZ = [-7.6, -4.2, -0.8, 2.6];
  const orchardZ0 = -9.4, orchardZ1 = 4.6;
  const mulch = surface('gravel', PALETTE.mud, { size: 2 });
  const mown = surface('grass', PALETTE.grassLight, { size: 3 });
  for (const x of rowX) {
    g.add(place(patch(1.8, orchardZ1 - orchardZ0, mulch, 0.04), { x, y: y0, z: (orchardZ0 + orchardZ1) / 2 }));
  }
  // lighter mown strips down the alleys
  for (const x of [-6, -2, 2, 6]) g.add(place(patch(1.4, orchardZ1 - orchardZ0, mown, 0.03), { x, y: y0, z: (orchardZ0 + orchardZ1) / 2 }));

  let seed = 1;
  for (const x of rowX) for (const z of treeZ) {
    const r = rng(seed * 13);
    g.add(place(orangeTree(seed++), { x: x + r.range(-0.15, 0.15), y: y0, z: z + r.range(-0.15, 0.15), ry: r.range(0, 360) }));
  }
  // windfall oranges on the mulch
  const wr = rng(99);
  for (let i = 0; i < 26; i++) {
    const f = fruit(wr.pick(rowX) + wr.range(-0.8, 0.8), y0 + 0.1, wr.range(orchardZ0 + 0.3, orchardZ1 - 0.3));
    f.scale.setScalar(0.7);
    g.add(f);
  }

  // ---- picking in progress: ladders against trees, crates and pickers in the alleys
  g.add(place(pickingLadder(3.0), { x: -5.55, y: y0, z: -4.3, ry: -90 }));   // leaning west onto row -8
  g.add(place(pickingLadder(3.2), { x: 2.45, y: y0, z: -0.9, ry: 90 }));     // leaning east onto row 4
  g.add(place(pickingLadder(2.9), { x: 6.45, y: y0, z: -7.5, ry: 90 }));     // row 8, back
  g.add(place(pickingLadder(3.1), { x: -1.55, y: y0, z: 2.5, ry: -90 }));    // row -4, front
  g.add(place(picker(PALETTE.blue), { x: -5.25, y: y0 + 1.15, z: -4.3, ry: -90 }));
  g.add(place(picker(PALETTE.red), { x: 2.0, y: y0, z: 0.6, ry: 120 }));
  g.add(place(picker(PALETTE.yellow), { x: -2.0, y: y0, z: -2.6, ry: -60 }));
  g.add(place(picker(PALETTE.green), { x: 6.1, y: y0, z: -5.4, ry: 80 }));
  g.add(place(crateStack(2, 1, 60), { x: -6.0, y: y0, z: -2.5, ry: 90 }));
  g.add(place(crateStack(1, 2, 64), { x: -6.0, y: y0, z: -6.2, ry: 90 }));
  g.add(place(crateStack(2, 2, 66), { x: 2.0, y: y0, z: -2.6, ry: 90 }));
  g.add(place(crate(true, 70), { x: 2.0, y: y0, z: 1.8, ry: 90 }));
  g.add(place(crate(false, 71), { x: -2.0, y: y0, z: -0.6, ry: 85 }));
  g.add(place(crate(true, 72), { x: -2.0, y: y0, z: 0.4, ry: 95 }));
  g.add(place(crateStack(1, 3, 74), { x: 6.0, y: y0, z: -3.6, ry: 90 }));
  g.add(place(crate(true, 78), { x: 6.0, y: y0, z: 1.2, ry: 92 }));

  // ---- packing yard along the street
  g.add(place(patch(19.2, 4.4, 'gravel'), { x: 0, y: y0, z: 7.3 }));
  g.add(place(patch(3.2, 0.8, 'gravel'), { x: 3.4, y: y0, z: 9.6 }));
  g.add(place(packingShed(), { x: -5.6, y: y0 + 0.05, z: 7.3 }));
  g.add(place(tractor(PALETTE.red), { x: 6.8, y: y0 + 0.05, z: 7.1 }));
  g.add(place(trailer(80), { x: 3.4, y: y0 + 0.05, z: 7.1 }));
  g.add(place(palletOfCrates(90), { x: -0.6, y: y0 + 0.05, z: 6.6 }));
  g.add(place(palletOfCrates(94), { x: -0.6, y: y0 + 0.05, z: 8.4, ry: 8 }));
  g.add(place(picker(PALETTE.orange, { bag: false }), { x: 1.1, y: y0 + 0.05, z: 7.6, ry: -90 }));

  // ---- boundary: post-and-rail fence with a gate gap, entrance sign, hedge corners
  g.add(place(fence({ w: 2 * HALF - 0.4, d: 2 * HALF - 0.4, h: 1.0, style: 'railing', color: PALETTE.woodDark, sides: ['back', 'left', 'right'] }), { y: y0 }));
  g.add(place(fence({ w: 11.3, d: 0, h: 1.0, style: 'railing', color: PALETTE.woodDark, sides: ['front'] }), { x: -4.15, y: y0, z: HALF - 0.2 }));
  g.add(place(fence({ w: 3.6, d: 0, h: 1.0, style: 'railing', color: PALETTE.woodDark, sides: ['front'] }), { x: 7.6, y: y0, z: HALF - 0.2 }));
  for (const x of [1.6, 5.2]) g.add(place(box(0.25, 2.8, 0.25, PALETTE.woodDark), { x, y: y0, z: HALF - 0.2 }));
  g.add(place(box(3.85, 0.18, 0.2, PALETTE.woodDark), { x: 3.4, y: y0 + 2.75, z: HALF - 0.2 }));
  g.add(place(sign({ text: 'ORANGE ORCHARD', w: 3.4, h: 0.65, bg: PALETTE.cream, fg: PALETTE.orange, double: true }), { x: 3.4, y: y0 + 2.0, z: HALF - 0.2 }));
  for (const [x, z] of [[-9.2, 9.2], [9.3, 4.8]]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: Math.round(x + z * 3) }), { x, y: y0, z }));

  return g;
}

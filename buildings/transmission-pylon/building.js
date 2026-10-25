import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, sphere, place, group, beam, lattice, pipeRun, sign,
  tree, car, fence, mat, metal, emissive,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Cross-arms reach out along X, the lines run along Z.
const HALF = TILE / 2;
const FOOT_H = 0.6; // concrete leg footings
const BASE_W = 6.2, WAIST_W = 2.0, TOP_W = 1.4;
const LOWER_H = 12, UPPER_H = 13, PEAK_H = 3.6;

const steel = metal(PALETTE.steelLight, { roughness: 0.5 });
const steelDk = metal(PALETTE.steel, { roughness: 0.5 });
const glassIns = mat(PALETTE.glassTeal, { roughness: 0.25, metalness: 0.2 });
const cableM = mat(PALETTE.darkGrey, { roughness: 0.6, metalness: 0.4 });

// Tapered braced arm along +X: horizontal bottom chords, top chord sloping down to the tip.
function crossArm({ root, len, half = 0.6, rise = 1.6, t = 0.14 }) {
  const g = new THREE.Group();
  const tip = len, tz = 0.15;
  const n = Math.max(2, Math.round((tip - root) / 1.1));
  const at = (i) => root + ((tip - root) * i) / n;
  const zAt = (x) => half + ((tz - half) * (x - root)) / (tip - root);
  const yTop = (x) => rise + ((0.25 - rise) * (x - root)) / (tip - root);
  for (const s of [1, -1]) {
    g.add(beam([root, 0, s * half], [tip, 0, s * tz], t, steel)); // bottom chord
    g.add(beam([root, rise, s * half * 0.6], [tip, 0.25, 0], t, steel)); // top chord
  }
  for (let i = 0; i <= n; i++) {
    const x = at(i), z = zAt(x), y = yTop(x);
    g.add(beam([x, 0, -z], [x, 0, z], t * 0.7, steel)); // bottom rungs
    for (const s of [1, -1]) g.add(beam([x, 0, s * z], [x, y, s * half * 0.6 * (1 - i / n)], t * 0.6, steel));
    if (i < n) {
      const x1 = at(i + 1);
      for (const s of [1, -1]) g.add(beam([x, y, s * half * 0.6 * (1 - i / n)], [x1, 0, s * zAt(x1)], t * 0.55, steel));
      g.add(beam([x, 0, z], [x1, 0, -zAt(x1)], t * 0.55, steel)); // bottom zig-zag
    }
  }
  // tip cap plate
  g.add(place(box(0.35, 0.3, 0.45, steelDk), { x: tip, y: -0.05 }));
  return g;
}

// Suspension insulator string of glass discs hanging from y = 0 down to y = -len.
function insulatorString(len = 2.3) {
  const g = new THREE.Group();
  g.add(place(cylinder(0.04, 0.04, len, steelDk, 6), { y: -len }));
  const discs = 9;
  for (let i = 0; i < discs; i++) {
    const y = -0.35 - (i * (len - 0.7)) / (discs - 1);
    g.add(place(cylinder(0.12, 0.26, 0.12, glassIns, 10), { y: y - 0.06 }));
  }
  // conductor clamp (yoke + twin spacer)
  g.add(place(box(0.5, 0.14, 0.2, steelDk), { y: -len - 0.12 }));
  return g;
}

// Conductor leaving the clamp in both directions along Z, sagging towards the tile edge.
function cableStubs(x, y, { radius = 0.07, material = cableM, sag = 0.9 } = {}) {
  const g = new THREE.Group();
  for (const s of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 4; i++) {
      const f = i / 4;
      pts.push([x, y - sag * (2 * f - f * f) * 0.6, s * (0.2 + f * (HALF - 0.2))]);
    }
    g.add(pipeRun(pts, radius, material));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  // gravelled base square under the tower, access track from the street side
  g.add(place(patch(7.8, 7.8, 'gravel'), { y: y0 }));
  g.add(place(patch(1.8, 1.2, 'gravel'), { x: 3.3, y: y0, z: 4.4 }));

  // concrete footings (chimneys) at each leg
  const lb = BASE_W / 2;
  for (const sx of [1, -1]) for (const sz of [1, -1]) {
    g.add(place(box(1.1, FOOT_H, 1.1, mat(PALETTE.concrete)), { x: sx * lb, y: y0, z: sz * lb }));
    g.add(place(box(0.8, 0.1, 0.8, mat(PALETTE.concreteDark)), { x: sx * lb, y: y0 + FOOT_H, z: sz * lb }));
  }

  // tower body: splayed lower section, straight-ish upper body, earth-wire peak
  const yL = y0 + FOOT_H;
  const yU = yL + LOWER_H;
  const yP = yU + UPPER_H;
  g.add(place(lattice({ w: BASE_W, h: LOWER_H, topW: WAIST_W, segments: 4, thickness: 0.3, material: steel }), { y: yL }));
  g.add(place(lattice({ w: WAIST_W, h: UPPER_H, topW: TOP_W, segments: 7, thickness: 0.24, material: steel }), { y: yU }));
  g.add(place(lattice({ w: TOP_W, h: PEAK_H, topW: 0.3, segments: 2, thickness: 0.18, material: steel }), { y: yP }));
  // inner diaphragm plates at the waist so the section change reads
  g.add(place(box(WAIST_W + 0.2, 0.18, WAIST_W + 0.2, steelDk), { y: yU - 0.09 }));

  // anti-climbing guard: a band of barbed wire round the legs + danger and number plates
  const guardY = 3.2;
  const gw = BASE_W + (WAIST_W - BASE_W) * (guardY / LOWER_H) + 0.35;
  for (const [sx, sz, rot] of [[0, 1, 0], [0, -1, 0], [1, 0, 90], [-1, 0, 90]]) {
    for (const dy of [0, 0.3, 0.6]) {
      g.add(place(box(gw, 0.06, 0.06, mat(PALETTE.darkGrey)), { x: (sx * gw) / 2, y: yL + guardY + dy, z: (sz * gw) / 2, ry: rot }));
    }
  }
  const signZ = (BASE_W + (WAIST_W - BASE_W) * (2.2 / LOWER_H)) / 2;
  g.add(place(sign({ text: '⚡ DANGER', w: 1.4, h: 0.9, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.05, border: PALETTE.black }), { y: yL + 1.7, z: signZ + 0.05 }));
  g.add(place(sign({ text: 'ZK 042', w: 1.2, h: 0.45, bg: PALETTE.white, fg: PALETTE.red, depth: 0.05 }), { y: yL + 2.75, z: signZ - 0.12 }));

  // cross-arms: bottom, middle (widest) and top, both sides; insulators + cable stubs
  const bodyHalf = (y) => (WAIST_W + ((TOP_W - WAIST_W) * (y - yU)) / UPPER_H) / 2;
  const arms = [
    { y: yU + 2.0, len: 4.2 },
    { y: yU + 6.4, len: 4.75 },
    { y: yU + 10.8, len: 4.2 },
  ];
  for (const a of arms) {
    const root = bodyHalf(a.y);
    for (const s of [1, -1]) {
      g.add(place(crossArm({ root, len: a.len - 0.1, half: root }), { y: a.y, ry: s > 0 ? 0 : 180 }));
      const tipX = s * (a.len - 0.1);
      const insLen = 2.3;
      g.add(place(insulatorString(insLen), { x: tipX, y: a.y - 0.05 }));
      g.add(cableStubs(tipX, a.y - 0.05 - insLen - 0.12));
    }
  }

  // earth wire on the peak, with orange/white aviation marker balls
  const peakY = yP + PEAK_H;
  g.add(place(box(0.5, 0.25, 0.7, steelDk), { y: peakY - 0.1 }));
  g.add(cableStubs(0, peakY, { radius: 0.05, sag: 0.6 }));
  for (const [z, c] of [[3.2, PALETTE.orange], [-3.2, PALETTE.white]]) {
    g.add(place(sphere(0.38, mat(c, { roughness: 0.5 }), 10), { y: peakY - 0.2 * (1 - (1 - Math.abs(z) / HALF) ** 2) - 0.38 - 0.25, z }));
  }
  g.add(place(sphere(0.12, emissive(PALETTE.red, 1.2), 8), { y: peakY + 0.15 }));

  // service van on the access track, and a technician's tool chest + cones
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 3.3, y: y0 + 0.05, z: 2.2, ry: 90, s: 0.6 }));
  g.add(place(box(0.04, 0.1, 2.2, mat(PALETTE.orange)), { x: 3.86, y: y0 + 0.5, z: 2.2 })); // van livery stripe
  g.add(place(box(0.7, 0.5, 0.45, mat(PALETTE.red)), { x: 1.2, y: y0, z: 3.2 }));
  for (const [x, z] of [[1.9, 4.4], [0.6, 4.3], [-0.7, 4.2]]) {
    g.add(place(cylinder(0.03, 0.18, 0.55, mat(PALETTE.orange), 8), { x, y: y0, z }));
  }

  // field edge: post-and-wire fence on the back, hedgerow bushes and a tree in the corner
  g.add(place(fence({ w: TILE - 0.6, d: 0.1, h: 1.0, style: 'wire', color: PALETTE.woodDark, sides: ['front'] }), { y: y0, z: -HALF + 0.3 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 12 }), { x: -3.6, y: y0, z: -3.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 13 }), { x: 4.3, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 14 }), { x: -4.4, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 15 }), { x: -4.5, y: y0, z: 1.4 }));
  return g;
}

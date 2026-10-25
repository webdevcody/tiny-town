import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, gableRoof, pyramidRoof, box, beam, place, group, mat, metal, surface,
  windowPanel, door, sign, tree, hayBale, fence,
} from '../../src/lib/index.js';
import { horse, horseHead } from './horse.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West half: timber stable block with a row of dutch doors and a gravel yard.
// East half: white post-and-rail paddock with horses, a water trough and hay.

const COATS = {
  bay: { coat: '#7a4a2a', mane: '#2a1f18' },
  chestnut: { coat: '#a4582c', mane: '#7a3a1a' },
  grey: { coat: '#d6d2c8', mane: '#9a968e' },
  black: { coat: '#2e2824', mane: '#1a1512' },
};

// Post-and-rail fence along a polyline of [x, z] points (open, not closed).
function railFence(points, { h = 1.2, spacing = 1.9, color = PALETTE.white } = {}) {
  const m = mat(color);
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i];
    const [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / spacing));
    for (let k = 0; k <= n; k++) {
      if (k === 0 && i > 0) continue;
      const t = k / n;
      g.add(place(box(0.16, h, 0.16, m), { x: ax + (bx - ax) * t, z: az + (bz - az) * t }));
    }
    for (const ry of [h * 0.45, h * 0.85]) g.add(beam([ax, ry, az], [bx, ry, bz], 0.09, m));
  }
  return g;
}

// Stable door split in two leaves: bottom shut, top swung open against the wall.
function dutchDoor({ color, trim, x, z, y }) {
  const g = new THREE.Group();
  const w = 1.15;
  g.add(place(box(w + 0.24, 2.42, 0.08, trim), { x, y, z: z + 0.04 }));
  g.add(place(box(w, 1.2, 0.16, color), { x, y, z: z + 0.08 }));
  g.add(place(box(w + 0.1, 0.1, 0.22, trim), { x, y: y + 1.17, z: z + 0.11 }));
  // white X brace on the lower leaf
  const zb = z + 0.17;
  g.add(beam([x - w / 2 + 0.08, y + 0.08, zb], [x + w / 2 - 0.08, y + 1.1, zb], 0.08, trim));
  g.add(beam([x + w / 2 - 0.08, y + 0.08, zb], [x - w / 2 + 0.08, y + 1.1, zb], 0.08, trim));
  // dark open top half + the opened top leaf beside it
  g.add(place(box(w, 1.05, 0.1, mat('#1d1712')), { x, y: y + 1.27, z: z + 0.05 }));
  g.add(place(box(0.5, 1.05, 0.12, color), { x: x + w / 2 + 0.38, y: y + 1.27, z: z + 0.06 }));
  return g;
}

function squareBale() {
  return box(1.1, 0.45, 0.55, surface('stripes', PALETTE.hay, { size: 0.5, color2: '#c9a646' }));
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  const planks = surface('planks', '#8e5f36', { size: 2 });
  const timber = mat(PALETTE.woodDark);
  const trim = mat(PALETTE.white);
  const doorCol = mat('#3f6b45');
  const roofMat = surface('shingles', PALETTE.roofRed, { size: 2 });

  // ---------------- stable block ----------------
  const sx = -4.4, sz = -1.9, sw = 10, sd = 5, sh = 3.0;
  const front = sz + sd / 2, back = sz - sd / 2, west = sx - sw / 2, east = sx + sw / 2;
  g.add(place(box(sw + 0.3, 0.3, sd + 0.3, mat(PALETTE.stone)), { x: sx, y: y0, z: sz }));
  g.add(place(box(sw, sh, sd, planks), { x: sx, y: y0 + 0.3, z: sz }));
  const wy = y0 + 0.3;
  // timber frame: corner posts and wall plates
  for (const [cx, cz] of [[west, front], [east, front], [west, back], [east, back]]) {
    g.add(place(box(0.32, sh, 0.32, timber), { x: cx, y: wy, z: cz }));
  }
  g.add(place(box(sw, 0.2, 0.12, timber), { x: sx, y: wy + sh - 0.75, z: front + 0.05 }));
  g.add(place(box(sw, 0.2, 0.12, timber), { x: sx, y: wy + sh - 0.75, z: back - 0.05 }));
  g.add(place(gableRoof({ w: sw, d: sd, h: 2.5, overhang: 0.6, ridge: 'x', material: roofMat, gableMaterial: planks }), { x: sx, y: wy + sh, z: sz }));
  // ridge cap
  g.add(place(box(sw + 1.3, 0.16, 0.36, mat('#7c2a20')), { x: sx, y: wy + sh + 2.42, z: sz }));

  // front: four stall doors with horses looking out, then the tack room
  const stalls = [-8.2, -6.2, -4.2, -2.2];
  const heads = [COATS.bay, COATS.grey, null, COATS.chestnut];
  stalls.forEach((x, i) => {
    g.add(dutchDoor({ color: doorCol, trim, x, z: front, y: wy }));
    if (heads[i]) g.add(place(horseHead({ ...heads[i], blaze: i !== 1 }), { x, y: wy + 1.45, z: front - 0.05 }));
    // name plate above each stall
    g.add(place(box(0.5, 0.18, 0.05, mat(PALETTE.cream)), { x, y: wy + 2.5, z: front + 0.06 }));
  });
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.woodDark, frame: PALETTE.white }), { x: -0.55, y: wy, z: front }));
  // lanterns
  for (const x of [-7.2, -3.2]) {
    g.add(place(box(0.08, 0.5, 0.25, timber), { x, y: wy + 2.25, z: front + 0.12 }));
    g.add(place(box(0.2, 0.28, 0.2, mat('#ffd36b', { emissive: '#ffb030', emissiveIntensity: 0.4 })), { x, y: wy + 2.0, z: front + 0.3 }));
  }

  // back: small square stall windows
  for (const x of stalls) {
    g.add(place(windowPanel({ w: 0.7, h: 0.6, frame: PALETTE.white }), { x, y: wy + 1.7, z: back, ry: 180 }));
  }
  // east end: tack-room window; west end: hay-loft door with hoist
  g.add(place(windowPanel({ w: 1.0, h: 0.9, frame: PALETTE.white }), { x: east, y: wy + 1.2, z: sz + 0.6, ry: 90 }));
  g.add(place(door({ w: 1.1, h: 1.3, color: '#1d1712', frame: PALETTE.white }), { x: west, y: wy + sh + 0.1, z: sz, ry: -90 }));
  g.add(place(box(0.5, 0.35, 0.9, mat(PALETTE.hay)), { x: west - 0.05, y: wy + sh + 0.12, z: sz }));
  g.add(place(box(0.8, 0.18, 0.18, timber), { x: west - 0.3, y: wy + sh + 1.75, z: sz }));
  g.add(place(box(0.03, 1.0, 0.03, mat(PALETTE.darkGrey)), { x: west - 0.6, y: wy + sh + 0.75, z: sz }));

  // cupola with weather vane on the ridge
  const cy = wy + sh + 2.3;
  g.add(place(box(1.3, 1.0, 1.3, trim), { x: sx, y: cy, z: sz }));
  for (const [rx, rz, ry] of [[0, 0.66, 0], [0, -0.66, 180], [0.66, 0, 90], [-0.66, 0, -90]]) {
    for (let k = 0; k < 3; k++) g.add(place(box(0.9, 0.08, 0.06, mat(PALETTE.woodDark)), { x: sx + rx, y: cy + 0.25 + k * 0.22, z: sz + rz, ry }));
  }
  g.add(place(pyramidRoof({ w: 1.3, h: 0.9, overhang: 0.2, material: roofMat }), { x: sx, y: cy + 1.0, z: sz }));
  g.add(place(box(0.05, 0.9, 0.05, mat(PALETTE.darkGrey)), { x: sx, y: cy + 1.85, z: sz }));
  g.add(place(box(0.9, 0.06, 0.06, mat(PALETTE.darkGrey)), { x: sx, y: cy + 2.4, z: sz }));
  g.add(place(box(0.5, 0.3, 0.04, mat(PALETTE.darkGrey)), { x: sx + 0.2, y: cy + 2.45, z: sz }));

  // ---------------- stable yard ----------------
  g.add(place(patch(12.0, 4.2, 'gravel'), { x: -4.0, y: y0, z: 2.85 }));
  // hitching rail with a saddled horse
  for (const x of [-3.6, -1.2]) g.add(place(box(0.16, 1.1, 0.16, timber), { x, y: y0, z: 2.4 }));
  g.add(place(box(2.7, 0.12, 0.12, timber), { x: -2.4, y: y0 + 1.0, z: 2.4 }));
  g.add(place(horse({ ...COATS.black, socks: PALETTE.white, tack: PALETTE.red }), { x: -2.1, y: y0, z: 3.1, ry: 180 }));
  // hay stack: square bales + round bales
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.add(place(squareBale(), { x: -8.6 + j * 1.15, y: y0, z: 1.8 + i * 0.58 }));
  for (let i = 0; i < 2; i++) g.add(place(squareBale(), { x: -8.6 + 0.57, y: y0 + 0.45, z: 2.1 + i * 0.58 }));
  g.add(place(hayBale({ r: 0.6 }), { x: -8.9, y: y0, z: 4.0 }));
  g.add(place(hayBale({ r: 0.6 }), { x: -7.5, y: y0, z: 4.1, ry: 20 }));
  // wheelbarrow with straw
  const wb = group(
    place(box(0.9, 0.35, 0.6, mat(PALETTE.green)), { y: 0.3 }),
    place(box(0.8, 0.12, 0.5, mat(PALETTE.hay)), { y: 0.62 }),
    place(new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.08, 10).rotateX(Math.PI / 2).translate(0, 0.2, 0), mat(PALETTE.black)), { x: 0.55 }),
    beam([-0.4, 0.3, 0.25], [-0.9, 0.55, 0.25], 0.05, mat(PALETTE.woodDark)),
    beam([-0.4, 0.3, -0.25], [-0.9, 0.55, -0.25], 0.05, mat(PALETTE.woodDark)),
  );
  g.add(place(wb, { x: 0.4, y: y0, z: 3.4, ry: -60 }));
  // water barrel by the tack room
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 12).translate(0, 0.45, 0), mat(PALETTE.wood)), { x: 0.95, y: y0, z: 1.1 }));
  // street sign
  for (const x of [-6.95, -4.15]) g.add(place(box(0.14, 1.9, 0.14, timber), { x, y: y0, z: 4.6 }));
  g.add(place(sign({ text: 'STABLES', w: 2.6, h: 0.75, bg: '#3f6b45', fg: '#ffffff', double: true, depth: 0.12 }), { x: -5.55, y: y0 + 1.05, z: 4.6 }));

  // trees & bushes
  g.add(place(tree({ kind: 'round', h: 5, seed: 21 }), { x: 1.4, y: y0, z: -3.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 22 }), { x: -9.3, y: y0, z: 1.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 23 }), { x: 1.3, y: y0, z: 4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 24 }), { x: -0.2, y: y0, z: 4.4 }));
  g.add(place(fence({ w: 3.8, d: 0.1, h: 0.8, style: 'picket', color: PALETTE.white, sides: ['front'] }), { x: -8.0, y: y0, z: 4.65 }));

  // ---------------- paddock ----------------
  const px0 = 2.4, px1 = 9.6, pz0 = -4.6, pz1 = 4.6;
  g.add(place(patch(px1 - px0, pz1 - pz0, 'dirt'), { x: (px0 + px1) / 2, y: y0, z: 0 }));
  g.add(place(patch(3.4, 3.0, 'grass'), { x: 5.6, y: y0 + 0.01, z: -2.6 }));
  // fence with a gate opening on the yard side
  g.add(place(railFence([[px0, 1.4], [px0, pz0], [px1, pz0], [px1, pz1], [px0, pz1], [px0, 3.6]]), { y: y0 }));
  // open gate leaf swung into the paddock
  const gate = group(
    place(box(0.12, 1.2, 0.12, trim), { x: 0 }),
    place(box(0.12, 1.2, 0.12, trim), { x: 2.1 }),
    ...[0.3, 0.65, 1.0].map((h) => place(box(2.1, 0.09, 0.08, trim), { x: 1.05, y: h })),
    beam([0.06, 0.3, 0], [2.04, 1.0, 0], 0.08, trim),
  );
  g.add(place(gate, { x: px0 + 0.1, y: y0, z: 1.45, ry: -60 }));

  // horses
  g.add(place(horse({ ...COATS.bay, pose: 'graze' }), { x: 5.0, y: y0, z: -2.4, ry: 20 }));
  g.add(place(horse({ ...COATS.grey }), { x: 5.4, y: y0, z: 2.0, ry: 160 }));
  g.add(place(horse({ ...COATS.chestnut, socks: PALETTE.white, pose: 'graze' }), { x: 8.0, y: y0, z: 1.2, ry: -100 }));
  // water trough and hay feeder
  g.add(place(box(0.8, 0.6, 2.0, metal(PALETTE.steel)), { x: 8.9, y: y0, z: -0.8 }));
  g.add(place(box(0.6, 0.05, 1.8, mat(PALETTE.water)), { x: 8.9, y: y0 + 0.58, z: -0.8 }));
  g.add(place(box(1.6, 0.9, 1.0, timber), { x: 3.4, y: y0, z: -3.8 }));
  g.add(place(box(1.4, 0.45, 0.8, mat(PALETTE.hay)), { x: 3.4, y: y0 + 0.9, z: -3.8 }));
  g.add(place(hayBale({ r: 0.55 }), { x: 4.0, y: y0, z: 3.8, ry: 70 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 31 }), { x: 8.6, y: y0, z: -3.5 }));

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, gableRoof, chimney, door, windowPanel, sign,
  tree, surface, mat, shade, rng,
} from '../../src/lib/index.js';

const GRAPE = '#5b2a6e';

// One row of vines along X, centred on the origin: soil ridge, wooden posts, a
// training wire and a lumpy leaf canopy with grape bunches hanging below it.
function vineRow(len, seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  const post = mat(PALETTE.woodDark);
  const wire = mat(PALETTE.steel);
  const leaves = [mat(PALETTE.foliage), mat(PALETTE.foliageDark), mat(shade(PALETTE.foliageLight, -0.08))];
  const grapes = [mat(GRAPE), mat(shade(GRAPE, 0.15))];

  g.add(box(len + 0.4, 0.1, 1.0, mat(shade(PALETTE.mud, -0.1))));
  const n = Math.max(2, Math.round(len / 2.2));
  const seg = len / n;
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + i * seg;
    const end = i === 0 || i === n;
    g.add(place(box(end ? 0.2 : 0.13, end ? 2.0 : 1.85, end ? 0.2 : 0.13, post), { x }));
  }
  g.add(place(box(len, 0.035, 0.035, wire), { y: 1.8 }));
  g.add(place(box(len, 0.035, 0.035, wire), { y: 0.85 }));
  g.add(place(box(len - 0.1, 0.55, 0.5, leaves[1]), { y: 1.0 }));
  for (let i = 0; i < n; i++) {
    const cx = -len / 2 + (i + 0.5) * seg;
    for (let k = 0; k < 2; k++) {
      const lx = cx + (k - 0.5) * seg * 0.5 + r.range(-0.15, 0.15);
      g.add(place(box(seg * r.range(0.42, 0.55), r.range(0.55, 0.8), r.range(0.62, 0.74), leaves[(i + k) % 2 ? 0 : 2]), { x: lx, y: 0.95 + r.range(0, 0.15) }));
    }
    // gnarled trunk
    g.add(place(box(0.1, 1.0, 0.1, mat(PALETTE.trunk)), { x: cx + r.range(-0.4, 0.4) }));
    for (let k = 0; k < 4; k++) {
      const side = (k + i) % 2 ? 1 : -1;
      g.add(place(cone(0.17, 0.38, r.pick(grapes), 6), { x: cx - seg * 0.38 + k * seg * 0.25 + r.range(-0.1, 0.1), y: 1.02, z: side * 0.36, rx: 180 }));
    }
  }
  return g;
}

// Post-and-rail fence along a list of [x1, z1, x2, z2] runs (axis-aligned).
function railFence(runs) {
  const g = new THREE.Group();
  const m = mat(PALETTE.wood);
  for (const [x1, z1, x2, z2] of runs) {
    const alongX = z1 === z2;
    const len = Math.abs(alongX ? x2 - x1 : z2 - z1);
    const n = Math.max(1, Math.round(len / 2.4));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.add(place(box(0.14, 1.0, 0.14, m), { x: x1 + (x2 - x1) * t, z: z1 + (z2 - z1) * t }));
    }
    for (const y of [0.4, 0.82]) {
      g.add(place(box(alongX ? len : 0.07, 0.09, alongX ? 0.07 : len, m), { x: (x1 + x2) / 2, y, z: (z1 + z2) / 2 }));
    }
  }
  return g;
}

// Oak barrel lying along X.
function barrel() {
  const g = new THREE.Group();
  const body = cylinder(0.42, 0.42, 1.0, mat(PALETTE.wood), 12);
  const hoopM = mat(PALETTE.steelDark);
  const b = group(body,
    place(cylinder(0.44, 0.44, 0.07, hoopM, 12), { y: 0.12 }),
    place(cylinder(0.44, 0.44, 0.07, hoopM, 12), { y: 0.81 }),
    place(cylinder(0.3, 0.3, 0.02, mat(PALETTE.woodLight), 10), { y: 1.0 }));
  g.add(place(b, { x: -0.5, y: 0.44, rz: -90 }));
  return g;
}

// Basket wine press: slatted tub on a trough with a screw and capstan bar.
function winePress() {
  const g = new THREE.Group();
  const wood = mat(PALETTE.woodLight);
  const dark = mat(PALETTE.woodDark);
  const iron = mat(PALETTE.steelDark);
  g.add(box(2.0, 0.5, 2.0, dark));
  g.add(place(box(0.3, 0.12, 0.5, dark), { x: 1.1, y: 0.3 })); // spout
  g.add(place(cylinder(0.75, 0.75, 1.0, wood, 14), { y: 0.5 }));
  for (const y of [0.62, 1.32]) g.add(place(cylinder(0.78, 0.78, 0.08, iron, 14), { y }));
  g.add(place(cylinder(0.7, 0.7, 0.05, mat(GRAPE), 14), { y: 1.42 }));
  g.add(place(box(1.6, 0.18, 0.35, dark), { y: 1.55 }));
  g.add(place(cylinder(0.08, 0.08, 1.2, iron, 8), { y: 1.5 }));
  g.add(place(box(1.9, 0.09, 0.09, iron), { y: 2.35, ry: 30 }));
  for (const x of [-0.95, 0.95]) g.add(place(box(0.18, 2.6, 0.25, dark), { x, y: 0.5 }));
  g.add(place(box(2.1, 0.2, 0.3, dark), { y: 3.0 }));
  // tub catching the juice
  g.add(place(cylinder(0.32, 0.28, 0.35, wood, 10), { x: 1.45 }));
  g.add(place(cylinder(0.28, 0.28, 0.02, mat('#7a1f3d'), 10), { x: 1.45, y: 0.33 }));
  return g;
}

// Crate of grapes.
function grapeCrate() {
  return group(
    box(0.8, 0.4, 0.55, mat(PALETTE.woodLight)),
    place(box(0.7, 0.08, 0.45, mat(GRAPE)), { y: 0.36 }),
  );
}

// Small farm tractor, faces +X.
function tractor(color) {
  const g = new THREE.Group();
  const body = mat(color);
  const tyre = mat(PALETTE.black);
  const hub = mat(PALETTE.yellow);
  g.add(place(box(1.6, 0.6, 0.8, body), { x: 0.3, y: 0.5 }));
  g.add(place(box(0.9, 0.9, 1.0, body), { x: -0.5, y: 0.5 }));
  g.add(place(box(0.95, 0.06, 1.1, mat(PALETTE.darkGrey)), { x: -0.5, y: 2.0 }));
  for (const [x, z] of [[-0.95, -0.47], [-0.95, 0.47], [-0.05, -0.47], [-0.05, 0.47]]) g.add(place(box(0.06, 0.6, 0.06, mat(PALETTE.darkGrey)), { x, y: 1.4, z }));
  g.add(place(box(0.7, 0.18, 0.6, mat(PALETTE.darkGrey)), { x: -0.5, y: 1.4 }));
  g.add(place(cylinder(0.06, 0.06, 0.7, mat(PALETTE.darkGrey), 6), { x: 0.8, y: 1.1, z: 0.25 }));
  for (const z of [-0.6, 0.6]) {
    g.add(place(cylinder(0.6, 0.6, 0.35, tyre, 14), { x: -0.5, y: 0.6, z: z - (z > 0 ? 0.175 : -0.175), rx: 90 }));
    g.add(place(cylinder(0.3, 0.3, 0.37, hub, 10), { x: -0.5, y: 0.6, z: z - (z > 0 ? 0.185 : -0.185), rx: 90 }));
    g.add(place(cylinder(0.34, 0.34, 0.25, tyre, 12), { x: 0.85, y: 0.34, z: z * 0.85 - (z > 0 ? 0.125 : -0.125), rx: 90 }));
  }
  return g;
}

// Two-wheeled wooden cart loaded with grapes, shafts towards +X.
function grapeCart() {
  const g = new THREE.Group();
  const wood = mat(PALETTE.wood);
  g.add(place(box(2.0, 0.6, 1.3, wood), { y: 0.6 }));
  g.add(place(box(1.85, 0.25, 1.15, mat(GRAPE)), { y: 1.05 }));
  for (let i = 0; i < 4; i++) g.add(place(cone(0.18, 0.25, mat(shade(GRAPE, 0.1)), 6), { x: -0.6 + i * 0.4, y: 1.28, z: (i % 2 ? 0.2 : -0.25) }));
  for (const z of [-0.72, 0.72]) {
    g.add(place(cylinder(0.55, 0.55, 0.12, mat(PALETTE.woodDark), 12), { y: 0.55, z: z - Math.sign(z) * 0.06, rx: 90 }));
    g.add(place(box(1.5, 0.08, 0.08, wood), { x: 1.6, y: 0.65, z: z * 0.7 }));
  }
  return g;
}

// The stone press house: one tall storey, terracotta gable roof, arched cellar door.
function pressHouse({ w, d, h }) {
  const g = new THREE.Group();
  const stone = surface('cobbles', '#cdb48a', { size: 1.6 });
  const quoin = mat('#e2d2b0');
  const roofMat = surface('roofTiles', PALETTE.terracotta, { size: 2 });
  const shutter = mat('#3f6b3a');

  g.add(box(w + 0.3, 0.35, d + 0.3, mat(PALETTE.stoneDark)));
  g.add(place(box(w, h, d, stone), { y: 0.35 }));
  // corner quoins
  for (const [qx, qz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) {
    for (let i = 0; i < 6; i++) {
      const long = i % 2 === 0;
      g.add(place(box(long ? 0.7 : 0.4, 0.5, long ? 0.4 : 0.7, quoin), { x: qx * (w / 2 - (long ? 0.32 : 0.17)), y: 0.4 + i * 0.55, z: qz * (d / 2 - (long ? 0.17 : 0.32)) }));
    }
  }
  const top = 0.35 + h;
  g.add(place(box(w + 0.1, 0.25, d + 0.1, quoin), { y: top - 0.25 }));
  g.add(place(gableRoof({ w, d, h: 2.1, overhang: 0.45, ridge: 'x', material: roofMat, gableMaterial: stone }), { y: top }));
  g.add(place(chimney({ w: 0.7, h: 1.8, material: stone }), { x: -w / 2 + 1.2, y: top + 0.9, z: -d / 4 }));

  // front: arched cellar doors with stone surround
  const fz = d / 2;
  g.add(place(cylinder(1.4, 1.4, 0.1, quoin, 16), { y: 2.2, z: fz + 0.05, rx: 90 }));
  g.add(place(box(2.8, 1.85, 0.1, quoin), { y: 0.35, z: fz + 0.05 }));
  g.add(place(cylinder(1.15, 1.15, 0.16, mat(PALETTE.woodDark), 16), { y: 2.2, z: fz + 0.08, rx: 90 }));
  g.add(place(box(2.3, 1.85, 0.16, mat(PALETTE.woodDark)), { y: 0.35, z: fz + 0.08 }));
  g.add(place(box(0.05, 3.0, 0.18, mat(shade(PALETTE.woodDark, -0.3))), { y: 0.35, z: fz + 0.09 }));
  for (const y of [0.9, 1.9]) g.add(place(box(2.3, 0.08, 0.2, mat(PALETTE.steelDark)), { y, z: fz + 0.09 }));
  g.add(place(sign({ text: 'WINERY', w: 3.0, h: 0.7, bg: '#7a1f3d', fg: '#f3e2b5' }), { y: top - 0.3, z: fz }));

  // shuttered windows
  const win = (x, z, ry) => {
    const wg = group(
      place(windowPanel({ w: 0.8, h: 1.0, frame: '#e2d2b0' }), { y: 0 }),
      place(box(0.42, 1.1, 0.06, shutter), { x: -0.68, y: -0.05, z: 0.04 }),
      place(box(0.42, 1.1, 0.06, shutter), { x: 0.68, y: -0.05, z: 0.04 }),
      place(box(1.1, 0.12, 0.25, quoin), { y: -0.12, z: 0.1 }),
    );
    return place(wg, { x, y: 1.6, z, ry });
  };
  for (const x of [-w / 2 + 1.1, w / 2 - 1.1]) g.add(win(x, fz, 0));
  for (const x of [-w / 4, w / 4]) g.add(win(x, -d / 2, 180));
  g.add(win(-w / 2, 0, -90));
  g.add(win(w / 2, 0.6, 90));
  // side door on the east wall
  g.add(place(door({ w: 0.95, h: 2.1, color: PALETTE.woodDark, frame: '#e2d2b0' }), { x: w / 2, y: 0.35, z: -1.0, ry: 90 }));
  // lantern over the main door
  g.add(place(box(0.25, 0.35, 0.25, mat('#ffd98a', { emissive: '#ffb54a', emissiveIntensity: 0.6 })), { x: 1.8, y: 2.5, z: fz + 0.2 }));
  return g;
}

// 2x2 tiles (20 x 20 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  const soil = surface('gravel', PALETTE.dirt, { size: 4 });
  // back block of vines (full width) and front-right block
  g.add(place(patch(19.2, 9.4, soil), { y: y0, z: -4.7 }));
  g.add(place(patch(9.2, 8.6, soil), { x: 5.0, y: y0, z: 5.0 }));
  // gravel yard in front of the press house + track to the street
  g.add(place(patch(9.6, 9.2, 'gravel'), { x: -5.2, y: y0, z: 5.2 }));
  g.add(place(patch(9.6, 1.3, soil), { x: 4.8, y: y0 + 0.01, z: 0.1 }));

  let seed = 3;
  for (const z of [-8.6, -6.8, -5.0, -3.2, -1.4]) g.add(place(vineRow(17.6, seed++), { y: y0, z }));
  for (const z of [2.0, 3.8, 5.6, 7.4]) g.add(place(vineRow(7.8, seed++), { x: 5.0, y: y0, z }));

  // press house
  g.add(place(pressHouse({ w: 7.0, d: 4.8, h: 3.4 }), { x: -5.5, y: y0, z: 3.9 }));

  // yard props
  g.add(place(winePress(), { x: -2.4, y: y0, z: 7.6 }));
  for (let i = 0; i < 3; i++) g.add(place(barrel(), { x: -8.9 + i * 0.95, y: y0, z: 7.0, ry: 90 }));
  g.add(place(barrel(), { x: -7.95, y: y0 + 0.76, z: 7.0, ry: 90 }));
  g.add(place(barrel(), { x: -9.0, y: y0, z: 8.6 }));
  for (const [x, z, ry, yy] of [[-4.4, 7.9, 0, 0], [-4.4, 8.6, 10, 0], [-4.4, 8.25, 5, 0.4], [-0.9, 6.2, 80, 0]]) g.add(place(grapeCrate(), { x, y: y0 + yy, z, ry }));
  g.add(place(grapeCart(), { x: -6.2, y: y0, z: 8.9, ry: 180 }));
  g.add(place(tractor(PALETTE.red), { x: 4.2, y: y0, z: 0.1 }));
  for (let i = 0; i < 3; i++) g.add(place(grapeCrate(), { x: 7.2 + i * 0.85, y: y0, z: 0.1 }));

  // cypress trees and shrubs by the house
  for (const [x, z, h, s] of [[-8.8, 1.0, 7.5, 1], [-1.4, 1.0, 6.5, 2], [8.8, -8.9, 6.8, 3]]) g.add(place(tree({ kind: 'poplar', h, seed: s, color: PALETTE.foliageDark }), { x, y: y0, z }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 7 }), { x: -1.2, y: y0, z: 4.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 8 }), { x: -9.2, y: y0, z: 4.6 }));

  // fence round the vines, open to the yard
  g.add(place(railFence([
    [0.6, 9.6, 9.6, 9.6], [9.6, 9.6, 9.6, -9.6], [9.6, -9.6, -9.6, -9.6], [-9.6, -9.6, -9.6, 0.2],
  ]), { y: y0 }));
  g.add(place(sign({ text: 'VINEYARD', w: 2.4, h: 0.6, bg: '#f3e2b5', fg: '#7a1f3d' }), { x: 2.0, y: y0 + 1.1, z: 9.65 }));
  g.add(place(box(0.12, 1.1, 0.12, mat(PALETTE.woodDark)), { x: 1.0, y: y0, z: 9.6 }));
  g.add(place(box(0.12, 1.1, 0.12, mat(PALETTE.woodDark)), { x: 3.0, y: y0, z: 9.6 }));
  return g;
}

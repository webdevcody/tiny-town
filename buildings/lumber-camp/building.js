import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, box, cylinder, place, mat, emissive, gableRoof, shedRoof, door, windowPanel, car,
} from '../../src/lib/index.js';
import {
  RED_BOARDS, log, stump, logPile, pine, boardSign, logLoader, loggingTruck, logCabin, smoke,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// A dirt clearing in a pine forest: log deck, loader filling a logging truck,
// two bunk cabins on the left, the cook shack at the front right.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // dirt clearing + haul road out to the street
  g.add(place(patch(13, 16.5, 'dirt'), { x: 1.4, y: y0, z: 1.65 }));
  g.add(place(patch(5, 3, 'gravel', 0.06), { x: -2.2, y: y0, z: 8.5 }));
  // wheel ruts
  for (const dx of [-0.95, 0.95]) g.add(place(box(0.5, 0.07, 13, mat('#6f5234')), { x: -2.2 + dx, y: y0, z: 3.5 }));

  // --- log deck behind the loader
  g.add(place(logPile({ rows: 5, len: 6.4, r: 0.32, seed: 2 }), { x: 4.4, y: y0, z: -4.6 }));
  g.add(place(logPile({ rows: 3, len: 5.6, r: 0.3, seed: 7 }), { x: 4.0, y: y0, z: -1.9 }));
  g.add(place(log(4.0, 0.34), { x: 5.7, y: y0, z: 1.3, ry: 92 }));

  // --- knuckleboom loader putting a log on the truck
  g.add(place(logLoader(), { x: 1.85, y: y0, z: 0.9 }));

  // --- loaded logging truck heading out (cab faces +z)
  g.add(place(loggingTruck(), { x: -2.2, y: y0, z: 2.0, ry: -90 }));

  // --- bunk cabins on the left
  g.add(place(logCabin({ w: 5.6, d: 4.0, roof: '#4b6b3a', seed: 1 }), { x: -6.8, y: y0, z: -4.2, ry: 90 }));
  g.add(place(logCabin({ w: 5.2, d: 4.0, roof: '#7a3b2a', seed: 2 }), { x: -6.8, y: y0, z: 3.4, ry: 90 }));

  // campfire between the cabins
  const fx = -6.8, fz = -0.4;
  const rock = mat(PALETTE.stone);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(place(box(0.3, 0.22, 0.3, rock), { x: fx + Math.cos(a) * 0.65, y: y0, z: fz + Math.sin(a) * 0.65, ry: i * 20 }));
  }
  g.add(place(box(0.8, 0.12, 0.8, mat('#3a2a1c')), { x: fx, y: y0, z: fz }));
  g.add(place(cylinder(0.0, 0.35, 0.7, emissive('#ff8a1e', 0.9), 6), { x: fx, y: y0 + 0.1, z: fz }));
  g.add(place(cylinder(0.0, 0.2, 0.9, emissive('#ffd24a', 0.9), 5), { x: fx + 0.1, y: y0 + 0.1, z: fz + 0.05 }));
  g.add(place(log(1.6, 0.18), { x: fx - 1.5, y: y0, z: fz, ry: 90 }));

  // --- cook shack, front right
  const cx = 6.0, cz = 5.6, cw = 5.4, cd = 4.0, ch = 2.9;
  g.add(place(box(cw + 0.3, 0.3, cd + 0.3, mat(PALETTE.stone)), { x: cx, y: y0, z: cz }));
  g.add(place(box(cw, ch, cd, RED_BOARDS), { x: cx, y: y0 + 0.3, z: cz }));
  g.add(place(gableRoof({ w: cw, d: cd, h: 1.6, overhang: 0.4, ridge: 'x', material: mat(PALETTE.roofGrey), gableMaterial: RED_BOARDS }), { x: cx, y: y0 + 0.3 + ch, z: cz }));
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.woodLight }), { x: cx - 1.2, y: y0 + 0.3, z: cz + cd / 2 }));
  for (const x of [cx + 0.4, cx + 1.8]) g.add(place(windowPanel({ w: 0.9, h: 0.9, frame: PALETTE.white, lit: true }), { x, y: y0 + 1.5, z: cz + cd / 2 }));
  g.add(place(windowPanel({ w: 0.9, h: 0.9, frame: PALETTE.white }), { x: cx - cw / 2, y: y0 + 1.5, z: cz, ry: -90 }));
  g.add(place(windowPanel({ w: 0.9, h: 0.9, frame: PALETTE.white }), { x: cx + 1, y: y0 + 1.5, z: cz - cd / 2, ry: 180 }));
  // porch with a lean-to roof
  g.add(place(box(cw, 0.2, 1.5, mat(PALETTE.wood)), { x: cx, y: y0, z: cz + cd / 2 + 0.75 }));
  g.add(place(shedRoof({ w: cw, d: 1.5, h: 0.35, overhang: 0.15, material: mat(PALETTE.roofGrey), wallMaterial: RED_BOARDS }), { x: cx, y: y0 + 2.45, z: cz + cd / 2 + 0.75, ry: 0 }));
  for (const x of [cx - cw / 2 + 0.15, cx, cx + cw / 2 - 0.15]) g.add(place(box(0.15, 2.45, 0.15, mat(PALETTE.woodDark)), { x, y: y0, z: cz + cd / 2 + 1.4 }));
  g.add(place(boardSign({ text: 'COOKHOUSE', w: 3.2, h: 0.6 }), { x: cx, y: y0 + 3.2, z: cz + cd / 2 + 0.05 }));
  // dinner triangle hanging from the porch
  g.add(place(box(0.5, 0.06, 0.04, mat(PALETTE.steelLight)), { x: cx + 2.3, y: y0 + 1.75, z: cz + cd / 2 + 1.45, rz: 0 }));
  // stovepipe with smoke
  g.add(place(cylinder(0.16, 0.16, 2.6, mat(PALETTE.darkGrey), 8), { x: cx + 1.6, y: y0 + 3.0, z: cz - 0.9 }));
  g.add(place(cylinder(0.28, 0.28, 0.12, mat(PALETTE.darkGrey), 8), { x: cx + 1.6, y: y0 + 5.6, z: cz - 0.9 }));
  g.add(place(smoke(1.1), { x: cx + 1.6, y: y0 + 5.8, z: cz - 0.9 }));
  // firewood stack along the east wall
  for (let i = 0; i < 3; i++) for (let j = 0; j < 6 - i; j++) {
    g.add(place(log(0.9, 0.16), { x: cx + cw / 2 + 0.6, y: y0 + i * 0.28, z: cz - 1.4 + (j + i * 0.5) * 0.34, ry: 0 }));
  }

  // picnic table by the cook shack
  const tx = 1.3, tz = 8.4;
  const wood = mat(PALETTE.wood);
  g.add(place(box(2.2, 0.1, 0.9, wood), { x: tx, y: y0 + 0.75, z: tz }));
  for (const sz of [-1, 1]) {
    g.add(place(box(2.2, 0.08, 0.3, wood), { x: tx, y: y0 + 0.45, z: tz + sz * 0.7 }));
    for (const sx of [-1, 1]) g.add(place(box(0.1, 0.75, 0.1, mat(PALETTE.woodDark)), { x: tx + sx * 0.85, y: y0, z: tz + sz * 0.3 }));
  }

  // crew pickup
  g.add(place(car({ color: '#2f6fb0', kind: 'van' }), { x: 1.0, y: y0, z: 5.2, ry: -90, s: 0.8 }));

  // fuel drums, chopping block with axe, stumps
  const drums = [[7.9, 1.6, PALETTE.red], [8.6, 1.9, PALETTE.red], [8.25, 2.5, '#2f6fb0']];
  for (const [x, z, c] of drums) g.add(place(cylinder(0.3, 0.3, 0.9, mat(c, { roughness: 0.5 }), 10), { x, y: y0, z }));
  g.add(place(stump(0.38, 0.55), { x: 9.3, y: y0, z: 8.4 }));
  g.add(place(box(0.06, 0.7, 0.06, mat(PALETTE.woodLight)), { x: 9.4, y: y0 + 0.55, z: 8.4, rz: -25 }));
  g.add(place(box(0.26, 0.14, 0.04, mat(PALETTE.steelLight)), { x: 9.3, y: y0 + 0.52, z: 8.4 }));
  const stumps = [[7.6, -1.6], [-3.4, -4.6], [0.4, -4.4], [9.1, -0.6], [-4.0, 7.4], [-9.3, -0.4]];
  stumps.forEach(([x, z], i) => g.add(place(stump(0.32 + (i % 3) * 0.05, 0.35 + (i % 2) * 0.15), { x, y: y0, z })));

  // outhouse in the front-left corner
  const ox = -6.6, oz = 8.5;
  g.add(place(box(1.3, 2.2, 1.3, mat(PALETTE.wood)), { x: ox, y: y0, z: oz }));
  g.add(place(shedRoof({ w: 1.3, d: 1.3, h: 0.3, overhang: 0.15, material: mat(PALETTE.roofGrey), wallMaterial: mat(PALETTE.wood) }), { x: ox, y: y0 + 2.2, z: oz }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.woodDark }), { x: ox, y: y0, z: oz + 0.65 }));
  g.add(place(box(0.05, 0.18, 0.12, mat(PALETTE.yellow)), { x: ox, y: y0 + 1.6, z: oz + 0.78, ry: 90 }));

  // entrance arch over the haul road
  const ax = -2.2, az = 9.5, span = 5.6;
  for (const sx of [-1, 1]) {
    g.add(place(stump(0.22, 5.2), { x: ax + sx * span / 2, y: y0, z: az }));
  }
  g.add(place(log(span + 0.8, 0.2), { x: ax, y: y0 + 4.9, z: az }));
  g.add(place(boardSign({ text: 'LUMBER CAMP', w: 4.6, h: 0.95, d: 0.12 }), { x: ax, y: y0 + 3.85, z: az }));
  for (const sx of [-1, 1]) g.add(place(box(0.04, 0.3, 0.04, mat(PALETTE.darkGrey)), { x: ax + sx * 1.9, y: y0 + 4.78, z: az }));

  // --- the forest: pines along the back, right and front-left edges
  const r = rng(31);
  const pines = [];
  for (let x = -9.0; x <= 9.2; x += 1.65) pines.push([x + r.range(-0.25, 0.25), -8.6 + r.range(-0.4, 0.6), r.range(7, 10.5)]);
  pines.push([9.0, -5.6, 9], [9.1, -3.4, 8], [8.9, -1.5, 7.2], [-8.7, 8.4, 7.5], [-9.2, 6.9, 6]);
  pines.forEach(([x, z, h], i) => {
    const m = 10 - 0.22 * h;
    g.add(place(pine({ h, seed: i * 7 + 3 }), { x: Math.max(-m, Math.min(m, x)), y: y0, z: Math.max(-m, Math.min(m, z)) }));
  });
  // felled tree lying at the forest edge
  g.add(place(log(7.5, 0.3), { x: -1.2, y: y0, z: -6.1, ry: 6 }));
  return g;
}

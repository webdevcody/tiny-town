import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, box, place, parapet, cylinder, beam, door, sign, tree, hedge,
  car, streetLamp, bench, mat, emissive, metal, surface,
} from '../../src/lib/index.js';
import { panelBox, panelMaterial } from './panels.js';

// 3x1 tiles (30 x 10 m). Front (street, balconies, entrances) faces +z.
// An eleven-storey precast slab: three sections, each with a stair core in the
// middle bay and a stack of coloured balconies either side.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 1], 'grass'));

  const WALL = '#d2d0ca';
  const CORE = '#b9bec3';
  const BASE = '#8a8780';
  const YELLOW = PALETTE.yellow;
  const GREEN = PALETTE.green;

  const BAY = 2.8;
  const SW = 9 * BAY; // 25.2 m
  const SD = 6.4;
  const SZ = -0.9; // slab centre z
  const FRONT = SZ + SD / 2; // 2.3
  const BACK = SZ - SD / 2; // -4.1
  const FLOORS = 11;
  const PLINTH = 0.9;
  const bodyY = y0 + PLINTH;
  const topY = bodyY + FLOORS * FLOOR;

  const winM = panelMaterial('window', WALL, 3);
  const winM2 = panelMaterial('window', WALL, 8);
  const blankM = panelMaterial('blank', WALL, 5);
  const coreM = panelMaterial('stair', CORE, 6);
  const coreBlank = panelMaterial('blank', CORE, 7);
  const baseM = panelMaterial('base', BASE, 4);
  const roofM = surface('gravel', '#8a867e', { size: 3 });
  const slabM = mat('#cfcac0');

  // basement plinth + main slab
  g.add(place(panelBox({ w: SW + 0.1, h: PLINTH, d: SD + 0.1, bay: BAY, floorHeight: PLINTH, front: baseM, back: baseM, left: baseM, right: baseM }), { y: y0, z: SZ }));
  g.add(place(panelBox({ w: SW, h: FLOORS * FLOOR, d: SD, bay: BAY, front: winM, back: winM2, left: blankM, right: blankM, top: roofM }), { y: bodyY, z: SZ }));
  g.add(place(parapet({ w: SW, d: SD, h: 0.7, t: 0.3, material: mat('#c4bfb4') }), { y: topY, z: SZ }));
  // dark band at the roof edge
  g.add(place(box(SW + 0.12, 0.25, SD + 0.12, mat('#6f6c66')), { y: topY + 0.7, z: SZ }));

  const bayX = (i) => (i - 4) * BAY; // bay centres, i = 0..8
  const cores = [1, 4, 7];
  const balconyBays = [0, 2, 3, 5, 6, 8];

  // ---- stair cores (front), with entrances
  const coreW = 2.6;
  const coreD = 1.0;
  for (const [n, i] of cores.entries()) {
    const x = bayX(i);
    const cz = FRONT + coreD / 2 - 0.05;
    g.add(place(panelBox({ w: coreW, h: topY + 1.2 - y0, d: coreD + 0.1, bay: 2.6, front: coreM, back: coreBlank, left: coreBlank, right: coreBlank, top: roofM }), { x, y: y0, z: cz }));
    const fz = FRONT + coreD;
    // entrance: door, canopy, lamp, step, number plate
    g.add(place(box(2.0, 2.6, 0.06, mat('#5a5853')), { x, y: y0, z: fz }));
    g.add(place(door({ w: 1.5, h: 2.3, color: '#6b4a2b' }), { x, y: y0 + 0.15, z: fz + 0.03 }));
    g.add(place(box(3.0, 0.22, 1.5, slabM), { x, y: y0 + 2.75, z: fz + 0.75 }));
    g.add(place(box(3.0, 0.1, 1.5, mat(n === 1 ? GREEN : YELLOW)), { x, y: y0 + 2.97, z: fz + 0.75 }));
    g.add(place(box(0.4, 0.15, 0.15, emissive('#fff2b0', 0.8)), { x, y: y0 + 2.6, z: fz + 1.2 }));
    g.add(place(box(2.4, 0.16, 1.0, mat(PALETTE.concrete)), { x, y: y0, z: fz + 0.5 }));
    g.add(place(sign({ text: String(n + 1), w: 0.6, h: 0.45, bg: PALETTE.navy, depth: 0.06 }), { x: x + 1.05, y: y0 + 2.0, z: fz }));
  }

  // ---- balconies, floors 2..11, colour banded by column
  const bW = 2.6;
  const bD = 1.2;
  const railH = 1.05;
  const railTop = mat('#f1eee6');
  for (const [k, i] of balconyBays.entries()) {
    const x = bayX(i);
    const col = mat(k % 2 === 0 ? YELLOW : GREEN);
    for (let f = 1; f < FLOORS; f++) {
      const by = bodyY + f * FLOOR;
      g.add(place(box(bW, 0.18, bD, slabM), { x, y: by, z: FRONT + bD / 2 }));
      g.add(place(box(bW, railH, 0.1, col), { x, y: by + 0.18, z: FRONT + bD - 0.05 }));
      g.add(place(box(bW + 0.04, 0.08, 0.16, railTop), { x, y: by + 0.18 + railH, z: FRONT + bD - 0.05 }));
      for (const s of [-1, 1]) g.add(place(box(0.08, railH, bD - 0.1, col), { x: x + s * (bW / 2 - 0.04), y: by + 0.18, z: FRONT + bD / 2 - 0.05 }));
    }
    // roof over the top balcony
    g.add(place(box(bW, 0.18, bD, slabM), { x, y: topY, z: FRONT + bD / 2 }));
  }

  // ---- back: shallow loggia rails in the same colours
  const lD = 0.7;
  for (const [k, i] of [0, 2, 4, 6, 8].entries()) {
    const x = bayX(i);
    const col = mat(k % 2 === 0 ? GREEN : YELLOW);
    for (let f = 1; f < FLOORS; f++) {
      const by = bodyY + f * FLOOR;
      g.add(place(box(bW, 0.16, lD, slabM), { x, y: by, z: BACK - lD / 2 }));
      g.add(place(box(bW, 0.95, 0.1, col), { x, y: by + 0.16, z: BACK - lD + 0.05 }));
      for (const s of [-1, 1]) g.add(place(box(0.08, 0.95, lD - 0.1, col), { x: x + s * (bW / 2 - 0.04), y: by + 0.16, z: BACK - lD / 2 + 0.05 }));
    }
  }

  // ---- gable ends: coloured stripe of panels + house number
  for (const s of [-1, 1]) {
    const gx = s * (SW / 2 + 0.03);
    const stripe = mat(s < 0 ? YELLOW : GREEN);
    g.add(place(box(0.06, FLOORS * FLOOR - 0.6, 1.4, stripe), { x: gx, y: bodyY + 0.3, z: SZ + 1.4 }));
    g.add(place(box(0.06, FLOORS * FLOOR - 0.6, 0.5, stripe), { x: gx, y: bodyY + 0.3, z: SZ - 0.4 }));
    g.add(place(sign({ text: '17', w: 1.8, h: 1.4, bg: PALETTE.navy, depth: 0.08 }), { x: s * (SW / 2 + 0.04), y: topY - 3.2, z: SZ - 1.9, ry: s * 90 }));
  }

  // ---- roof: lift machine rooms over the cores, vents, TV aerials
  for (const i of cores) {
    const x = bayX(i);
    g.add(place(panelBox({ w: 3.4, h: 2.8, d: 3.6, bay: 1.8, front: coreBlank, back: coreBlank, left: coreBlank, right: coreBlank, top: roofM }), { x, y: topY, z: FRONT - 1.6 }));
    g.add(place(box(3.6, 0.2, 3.8, mat('#6f6c66')), { x, y: topY + 2.8, z: FRONT - 1.6 }));
    g.add(place(box(0.9, 1.9, 0.06, mat('#5a5853')), { x: x + 0.8, y: topY + 0.3, z: FRONT - 3.43 }));
  }
  const ventM = mat('#9a968d');
  for (const x of [-10.5, -4.2, 4.2, 10.5]) {
    g.add(place(box(1.2, 1.0, 1.2, ventM), { x, y: topY, z: SZ - 1.2 }));
    g.add(place(box(1.4, 0.12, 1.4, mat('#6f6c66')), { x, y: topY + 1.0, z: SZ - 1.2 }));
  }
  const aerialM = metal(PALETTE.steelDark);
  for (const [x, z, h] of [[-11.5, -2.8, 3.2], [-7, -3.2, 2.6], [-2.2, -2.6, 3.4], [2, -3.3, 2.8], [6.8, -2.6, 3.0], [11.4, -3.0, 2.6], [-5.6, 0.6, 2.4], [5.2, 0.4, 2.2]]) {
    g.add(place(cylinder(0.05, 0.05, h, aerialM, 6), { x, y: topY, z }));
    for (let k = 0; k < 3; k++) {
      const ay = topY + h - 0.15 - k * 0.45;
      const half = 0.75 - k * 0.15;
      g.add(beam([x - half, ay, z], [x + half, ay, z], 0.05, aerialM));
    }
  }

  // ---- grounds
  // footpath along the front, aprons to the doors
  g.add(place(patch(30, 1.3, 'paved'), { y: y0, z: 4.2 }));
  for (const i of cores) g.add(place(patch(2.4, 0.9, 'paved'), { x: bayX(i), y: y0, z: FRONT + coreD + 0.9 }));
  // low hedges in front of the ground-floor flats
  for (const [k, i] of balconyBays.entries()) {
    const x = bayX(i) + (k % 2 === 0 ? 0.4 : -0.4);
    g.add(place(hedge({ w: 2.2, h: 0.7, d: 0.6 }), { x, y: y0, z: FRONT + 0.55 }));
  }
  for (const x of [-4.2, 4.2]) g.add(place(streetLamp({ h: 4.5 }), { x, y: y0, z: 4.75, ry: 180 }));
  for (const x of [-12.4, 12.4]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: 20 + x }), { x, y: y0, z: 3.0 }));

  // west end: parking bay with a car
  g.add(place(patch(2.4, 6.6, 'asphalt'), { x: -13.7, y: y0, z: -0.8 }));
  for (const z of [-4.0, 2.4]) g.add(place(box(2.4, 0.06, 0.1, mat('#f1eee6')), { x: -13.7, y: y0 + 0.05, z }));
  g.add(place(car({ color: PALETTE.blue }), { x: -13.7, y: y0 + 0.05, z: -0.8, ry: 90, s: 0.85 }));

  // east end: poplars, bench, bin, sandbox
  g.add(place(tree({ kind: 'poplar', h: 9, seed: 31 }), { x: 13.5, y: y0, z: -3.3 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 32 }), { x: 13.6, y: y0, z: 0.2 }));
  g.add(place(bench({ w: 1.6 }), { x: 14.2, y: y0, z: 2.4, ry: -90 }));
  g.add(place(cylinder(0.25, 0.22, 0.8, mat(PALETTE.green), 8), { x: 14.3, y: y0, z: 3.6 }));
  g.add(place(box(1.6, 0.25, 1.6, mat(PALETTE.woodDark)), { x: 13.6, y: y0, z: -1.7 }));
  g.add(place(box(1.35, 0.27, 1.35, mat(PALETTE.sand)), { x: 13.6, y: y0, z: -1.7 }));

  // behind: a row of shrubs
  for (const [x, k] of [[-10, 1], [-3.5, 2], [3, 3], [9.5, 4]]) g.add(place(tree({ kind: 'bush', h: 1.0, seed: 40 + k }), { x, y: y0, z: -4.6 }));
  return g;
}

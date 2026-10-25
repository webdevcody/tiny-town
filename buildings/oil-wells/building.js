import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, tank, pipe, pipeRun, beam, place, mat, metal, surface,
  fence, tree, car, sign, gableRoof, door, shade,
} from '../../src/lib/index.js';
import { pumpjack } from './pumpjack.js';

// 1x1 tile (10 x 10 m) oil field. Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'dirt'));

  // three pumpjacks, staggered, caught at different points of their stroke
  const jacks = [
    { x: -1.9, z: -3.15, tilt: 11, crank: -90 },
    { x: -0.5, z: 0.15, tilt: -2, crank: 160 },
    { x: -1.9, z: 3.35, tilt: -12, crank: 90 },
  ];
  for (const j of jacks) g.add(place(pumpjack({ tilt: j.tilt, crank: j.crank }), { x: j.x, y: y0, z: j.z }));

  // tank farm (back right) inside a low concrete bund
  const bx = 3.7, bz = -2.3, bw = 2.4, bd = 5.0;
  g.add(place(patch(bw, bd, 'gravel'), { x: bx, y: y0, z: bz }));
  g.add(place(fence({ w: bw, d: bd, h: 0.45, style: 'wall', color: PALETTE.concrete }), { x: bx, y: y0, z: bz }));
  const tankM = mat(PALETTE.cream, { roughness: 0.6 });
  const tanks = [-3.7, -1.2];
  for (const tz of tanks) {
    g.add(place(tank({ radius: 0.95, h: 2.9, roof: 'cone', material: tankM }), { x: bx, y: y0 + 0.05, z: tz }));
    g.add(place(cylinder(0.97, 0.97, 0.3, mat(PALETTE.black), 20), { x: bx, y: y0 + 2.1, z: tz }));
    // ladder on the street side of each tank
    for (const s of [-0.18, 0.18]) g.add(place(box(0.05, 2.9, 0.05, metal(PALETTE.steelDark)), { x: bx - 0.97, y: y0, z: tz + s }));
    for (let i = 1; i < 9; i++) g.add(place(box(0.05, 0.04, 0.36, metal(PALETTE.steelDark)), { x: bx - 0.97, y: y0 + i * 0.32, z: tz }));
  }
  // catwalk between tank roofs
  g.add(place(box(0.6, 0.08, 0.75, metal(PALETTE.steelDark)), { x: bx, y: y0 + 3.05, z: -2.45 }));
  for (const s of [-0.28, 0.28]) g.add(place(box(0.04, 0.5, 0.75, metal(PALETTE.steelLight)), { x: bx + s, y: y0 + 3.1, z: -2.45 }));
  // tank labels
  g.add(place(sign({ text: 'CRUDE', w: 1.3, h: 0.5, bg: PALETTE.red, fg: '#ffffff', depth: 0.05 }), { x: bx - 0.99, y: y0 + 1.2, z: -3.15, ry: -90 }));
  g.add(place(sign({ text: 'CRUDE', w: 1.3, h: 0.5, bg: PALETTE.red, fg: '#ffffff', depth: 0.05 }), { x: bx - 0.99, y: y0 + 1.2, z: -0.65, ry: -90 }));

  // flow lines: wellheads -> header pipe along the bund -> tanks
  const pipeM = metal(PALETTE.steel, { roughness: 0.5 });
  const py = y0 + 0.35;
  const hx = 2.3;
  for (const j of jacks) {
    const wx = j.x + 0.1 + 2.27;
    g.add(pipeRun([[wx, y0 + 0.75, j.z + 0.75], [wx, py, j.z + 0.75], [hx, py, j.z + 0.75]], 0.08, pipeM));
  }
  g.add(pipeRun([[hx, py, 4.1], [hx, py, -3.7], [bx - 0.9, py, -3.7]], 0.1, pipeM));
  g.add(pipe([hx, py, -1.2], [bx - 0.9, py, -1.2], 0.1, pipeM));
  for (const z of [-3.0, -1.6, -0.2, 1.2, 2.6, 4.0]) g.add(place(box(0.3, py - y0, 0.2, mat(PALETTE.darkGrey)), { x: hx, y: y0, z }));
  // valve wheels on the header
  for (const z of [-2.4, 0.6]) {
    g.add(place(cylinder(0.12, 0.12, 0.35, mat(PALETTE.red), 8), { x: hx, y: py, z }));
    g.add(place(cylinder(0.2, 0.2, 0.04, mat(PALETTE.red), 10), { x: hx, y: py + 0.35, z }));
  }

  // truck loading track (front right) with a pickup
  g.add(place(patch(2.6, 4.9, 'gravel'), { x: 3.7, y: y0, z: 2.55 }));
  g.add(place(car({ color: PALETTE.blue, kind: 'van' }), { x: 3.75, y: y0 + 0.05, z: 2.7, ry: 90, s: 0.6 }));
  // pump shed beside the track
  const shedM = surface('corrugated', PALETTE.steelLight, { size: 1 });
  g.add(place(box(1.6, 1.8, 1.4, shedM), { x: 4.1, y: y0, z: 0.75 }));
  g.add(place(gableRoof({ w: 1.6, d: 1.4, h: 0.45, overhang: 0.12, ridge: 'x', material: mat(PALETTE.roofRed), gableMaterial: shedM }), { x: 4.1, y: y0 + 1.8, z: 0.75 }));
  g.add(place(door({ w: 0.7, h: 1.5, color: PALETTE.navy }), { x: 3.3, y: y0, z: 0.75, ry: -90 }));

  // oil drums
  const drumCols = [PALETTE.blue, PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.blue];
  const drums = [[1.0, -1.6], [1.45, -1.75], [1.15, -2.1], [1.6, -2.25], [1.0, -2.55]];
  drums.forEach(([x, z], i) => {
    g.add(place(cylinder(0.24, 0.24, 0.75, mat(drumCols[i], { roughness: 0.5 }), 10), { x, y: y0, z }));
    g.add(place(cylinder(0.25, 0.25, 0.05, mat(shade(drumCols[i], -0.3)), 10), { x, y: y0 + 0.35, z }));
  });

  // company sign at the gate
  g.add(place(box(0.12, 1.6, 0.12, metal(PALETTE.steelDark)), { x: 1.5, y: y0, z: 4.75 }));
  g.add(place(box(0.12, 1.6, 0.12, metal(PALETTE.steelDark)), { x: -0.3, y: y0, z: 4.75 }));
  g.add(place(sign({ text: 'TINY OIL CO.', w: 2.1, h: 0.6, bg: PALETTE.black, fg: PALETTE.yellow, depth: 0.08, double: true }), { x: 0.6, y: y0 + 1.25, z: 4.75 }));

  // perimeter wire fence with a gate gap for the track
  g.add(place(fence({ w: TILE - 0.3, d: TILE - 0.3, h: 1.1, style: 'wire', sides: ['back', 'left'] }), { y: y0 }));
  g.add(place(fence({ w: TILE - 0.3, d: TILE - 0.3, h: 1.1, style: 'wire', sides: ['right'] }), { y: y0 }));
  g.add(place(fence({ w: 4.2, d: 0.1, h: 1.1, style: 'wire', sides: ['front'] }), { x: -2.75, y: y0, z: TILE / 2 - 0.15 }));

  // scrubby bushes
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: -4.3, y: y0, z: -0.95 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 8 }), { x: 0.9, y: y0, z: -4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 5 }), { x: 4.4, y: y0, z: 4.5 }));
  return g;
}

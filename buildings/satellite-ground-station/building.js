import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, rooftopUnits, box, cylinder, place, pipe, mat, metal,
  door, fence, tree, car, streetLamp, container,
} from '../../src/lib/index.js';
import { dishAntenna, radome, bigSign } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // fenced gravel compound with an asphalt drive to the gate
  g.add(place(patch(19.2, 9.2, 'gravel'), { y: y0 }));
  g.add(place(patch(8.4, 2.6, 'asphalt'), { x: -5.2, y: y0 + 0.01, z: 3.6 }));
  g.add(place(patch(2.8, 0.5, 'asphalt'), { x: -2.1, y: y0 + 0.01, z: 4.85 }));
  for (const x of [-8.1, -6.3, -4.5]) g.add(place(box(0.08, 0.02, 2.2, mat(PALETTE.roadLine)), { x, y: y0 + 0.06, z: 3.6 }));
  const fenceH = 1.6;
  g.add(place(fence({ w: 19.2, d: 9.2, h: fenceH, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  g.add(place(fence({ w: 6, d: 9.2, h: fenceH, style: 'wire', sides: ['front'] }), { x: -6.6, y: y0 }));
  g.add(place(fence({ w: 10.2, d: 9.2, h: fenceH, style: 'wire', sides: ['front'] }), { x: 4.5, y: y0 }));
  // gate posts with a red/white barrier arm
  const steel = metal(PALETTE.steelDark);
  for (const x of [-3.6, -0.6]) g.add(place(box(0.25, 2.0, 0.25, steel), { x, y: y0, z: 4.6 }));
  g.add(place(box(0.5, 1.0, 0.4, mat(PALETTE.yellow)), { x: -0.25, y: y0, z: 4.95 }));
  for (let i = 0; i < 6; i++) g.add(place(box(0.48, 0.12, 0.12, mat(i % 2 ? PALETTE.white : PALETTE.red)), { x: -0.75 - i * 0.48, y: y0 + 0.85, z: 4.95 }));

  // --- big Cassegrain dish (west) ---
  g.add(place(patch(6.2, 6.2, 'concrete'), { x: -5.6, y: y0 + 0.02, z: -1 }));
  g.add(place(dishAntenna({ diameter: 6.4, elev: 42, az: 25, pedestalH: 3.2 }), { x: -5.6, y: y0, z: -1.4 }));

  // --- medium dish (centre back) ---
  g.add(place(patch(4.2, 4.2, 'concrete'), { x: 1, y: y0 + 0.02, z: -2.5 }));
  g.add(place(dishAntenna({ diameter: 4.6, elev: 55, az: -30, pedestalH: 2.6 }), { x: 1, y: y0, z: -2.6 }));

  // --- radome (east) ---
  g.add(place(radome({ radius: 2.7, drumR: 2.2, drumH: 1.3 }), { x: 6.6, y: y0, z: -1.7 }));

  // --- small dishes (front right) ---
  g.add(place(dishAntenna({ diameter: 2.6, elev: 32, az: 15, pedestalH: 1.5, feed: 'tri' }), { x: 8.1, y: y0, z: 3.0 }));

  // --- equipment / operations building ---
  const bx = 2.6, bz = 2.3, bw = 7, bd = 3.6;
  g.add(place(facadeBlock({ w: bw, d: bd, floors: 1, floorHeight: 3.2, style: 'ribbon', wall: PALETTE.offWhite, glass: PALETTE.glassDark, frame: PALETTE.steelLight, lit: 0, seed: 7, roof: PALETTE.concreteDark, blank: ['back'] }), { x: bx, y: y0, z: bz }));
  g.add(place(parapet({ w: bw, d: bd, h: 0.45, t: 0.2, material: mat(PALETTE.steelLight) }), { x: bx, y: y0 + 3.2, z: bz }));
  g.add(place(rooftopUnits({ w: bw * 0.5, d: bd - 0.4, count: 2, seed: 4 }), { x: bx + 1.6, y: y0 + 3.2, z: bz }));
  // rooftop VSAT
  g.add(place(dishAntenna({ diameter: 1.4, elev: 35, az: 10, pedestalH: 0.9, feed: 'tri', segments: 20 }), { x: bx - 2.2, y: y0 + 3.2, z: bz - 0.2 }));
  // entrance, blue band and sign
  g.add(place(box(bw + 0.04, 0.35, bd + 0.04, mat(PALETTE.blue)), { x: bx, y: y0 + 2.75, z: bz }));
  g.add(place(door({ w: 1.2, h: 2.2, color: PALETTE.steel }), { x: bx - 2.4, y: y0, z: bz + bd / 2 }));
  g.add(place(box(1.8, 0.12, 1.0, mat(PALETTE.steelLight)), { x: bx - 2.4, y: y0 + 2.4, z: bz + bd / 2 + 0.5 }));
  g.add(place(bigSign({ text: 'EARTH STATION', w: 4.2, h: 0.7, bg: PALETTE.navy, fg: '#ffffff' }), { x: bx + 0.9, y: y0 + 3.7, z: bz + bd / 2 - 0.1 }));

  // waveguide / cable bridges from dishes to the building
  const tray = metal(PALETTE.steel);
  g.add(pipe([-4.6, y0 + 2.2, -0.6], [bx - bw / 2, y0 + 2.2, bz - 0.6], 0.14, tray));
  g.add(pipe([1.6, y0 + 1.6, -1.6], [1.6, y0 + 1.6, bz - bd / 2], 0.12, tray));
  g.add(pipe([4.6, y0 + 1.2, -0.9], [bx + bw / 2 - 0.4, y0 + 1.2, bz - bd / 2], 0.12, tray));
  for (const [x, z] of [[-3.4, 0.6], [-2.0, 1.3]]) g.add(place(box(0.12, 2.2, 0.12, steel), { x, y: y0, z }));

  // generator container + fuel tank behind the building
  g.add(place(container({ color: PALETTE.foliageDark, length: 3.2 }), { x: -1.4, y: y0, z: -4.0, s: [1, 0.8, 0.7] }));
  g.add(place(cylinder(0.1, 0.1, 1.2, steel, 8), { x: -2.4, y: y0 + 2.08, z: -4.0 }));
  g.add(place(box(1.6, 0.6, 0.05, mat(PALETTE.darkGrey)), { x: -1.2, y: y0 + 0.7, z: -3.13 }));
  g.add(place(cylinder(0.6, 0.6, 2.2, mat(PALETTE.lightGrey), 12), { x: 4.0, y: y0 + 0.7, z: -4.2, rz: 90 }));

  // car park, lamps, flag, trees
  g.add(place(car({ color: PALETTE.red }), { x: -7.2, y: y0 + 0.05, z: 3.5, ry: 90, s: 0.6 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: -5.4, y: y0 + 0.05, z: 3.5, ry: 90, s: 0.6 }));
  g.add(place(streetLamp({ h: 4 }), { x: -9.2, y: y0, z: 2.0 }));
  g.add(place(streetLamp({ h: 4 }), { x: 0.0, y: y0, z: 0.1, ry: 180 }));
  for (const [x, z, k, s] of [[-9.5, 4.6, 'bush', 21], [9.6, -4.6, 'bush', 22], [-9.4, -4.5, 'bush', 23]]) {
    g.add(place(tree({ kind: k, h: k === 'cone' ? 3.5 : 1.2, seed: s }), { x, y: y0, z }));
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, place, mat, metal, car, tree,
} from '../../src/lib/index.js';
import {
  uvBox, batteryUnit, inverterCabinet, transformer, securityFence, lightPole,
  storageSignMat, dangerSignMat,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const F = 4.6; // fence line
  g.add(lot([1, 1], 'grass'));
  g.add(place(patch(2 * F, 2 * F, 'gravel'), { y: y0 }));
  const y = y0 + 0.05;

  // three rows: battery | inverter | battery
  const rows = [-3.5, -1.3, 0.9];
  rows.forEach((z, i) => {
    g.add(place(patch(7.7, 2.1, 'concrete'), { x: -0.6, y, z }));
    g.add(place(batteryUnit({ light: i === 1 ? PALETTE.yellow : PALETTE.green }), { x: -2.7, y, z }));
    g.add(place(batteryUnit(), { x: 1.5, y, z }));
    g.add(place(inverterCabinet(), { x: -0.6, y, z }));
    // cable tray from the row to the main tray
    g.add(place(box(0.95, 0.08, 0.35, metal(PALETTE.steel)), { x: 3.45, y: y + 0.7, z }));
  });

  // main cable tray along the east side, down to the transformer
  const trayM = metal(PALETTE.steel);
  g.add(place(box(0.4, 0.08, 6.4, trayM), { x: 4.05, y: y + 0.7, z: -0.5 }));
  g.add(place(box(0.05, 0.14, 6.4, trayM), { x: 4.25, y: y + 0.74, z: -0.5 }));
  g.add(place(box(0.05, 0.14, 6.4, trayM), { x: 3.85, y: y + 0.74, z: -0.5 }));
  for (const z of [-3.4, -1.4, 0.6, 2.4]) g.add(place(box(0.08, 0.7, 0.08, metal(PALETTE.steelDark)), { x: 4.05, y, z }));

  // step-up transformer by the street
  g.add(place(transformer(), { x: 2.9, y, z: 3.3 }));

  // gravel drive + open gate
  g.add(place(patch(2.4, 3.3, 'concrete'), { x: -0.4, y: y0, z: 3.35 }));
  g.add(place(securityFence({ len: 3.0 }), { x: -3.1, y, z: F }));
  g.add(place(securityFence({ len: 3.8 }), { x: 2.7, y, z: F }));
  g.add(place(securityFence({ len: 2 * F }), { y, z: -F, ry: 180 }));
  g.add(place(securityFence({ len: 2 * F }), { x: -F, y, ry: -90 }));
  g.add(place(securityFence({ len: 2 * F }), { x: F, y, ry: 90 }));
  g.add(place(securityFence({ len: 1.15 }), { x: -1.5, y, z: F - 0.62, ry: 90 }));
  g.add(place(securityFence({ len: 1.15 }), { x: 0.7, y, z: F - 0.62, ry: -90 }));

  // entrance sign on the fence + danger plates
  const white = mat(PALETTE.white);
  const signW = 2.7, signH = 0.72;
  g.add(place(uvBox(signW, signH, 0.06, [white, white, white, white, storageSignMat(), white]), { x: -3.1, y: y + 0.65, z: F + 0.08 }));
  const danger = dangerSignMat();
  for (const x of [2.2, 3.8]) g.add(place(uvBox(0.5, 0.38, 0.03, [white, white, white, white, danger, white]), { x, y: y + 1.0, z: F + 0.06 }));
  g.add(place(uvBox(0.5, 0.38, 0.03, [white, white, white, white, danger, white]), { x: 0, y: y + 1.0, z: F + 0.06, ry: 180 }));
  g.add(place(uvBox(0.5, 0.38, 0.03, [white, white, white, white, danger, white]), { x: -F - 0.06, y: y + 1.0, z: -1, ry: -90 }));
  g.add(place(uvBox(0.5, 0.38, 0.03, [white, white, white, white, danger, white]), { x: F + 0.06, y: y + 1.0, z: -2, ry: 90 }));

  // maintenance van, floodlight/CCTV poles, hydrant
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: -3.0, y, z: 2.95, s: 0.6 }));
  g.add(place(lightPole({ h: 5 }), { x: -4.25, y, z: -4.25, ry: -45 }));
  g.add(place(lightPole({ h: 5 }), { x: 4.25, y, z: -4.25, ry: -135 }));
  g.add(place(lightPole({ h: 5 }), { x: 3.3, y, z: 2.08, ry: 180 }));
  const red = mat(PALETTE.red);
  g.add(place(cylinder(0.1, 0.12, 0.45, red, 8), { x: -1.0, y, z: 2.1 }));
  g.add(place(cylinder(0.04, 0.12, 0.1, red, 8), { x: -1.0, y: y + 0.45, z: 2.1 }));
  g.add(place(box(0.34, 0.08, 0.08, red), { x: -1.0, y: y + 0.26, z: 2.1 }));

  // a few shrubs on the grass verge outside the fence
  for (const [x, z, s] of [[-4.82, -2.5, 1], [-4.82, 3.6, 2], [4.82, 0.5, 3], [4.82, -3.8, 4], [-1.7, 4.82, 5], [1.0, -4.82, 6]]) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z }));
  }
  return g;
}

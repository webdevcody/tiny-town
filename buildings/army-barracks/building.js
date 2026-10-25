import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, place, mat, metal, surface,
  door, stairs, fence, tree, streetLamp,
} from '../../src/lib/index.js';
import {
  OLIVE, OLIVE_DARK, KHAKI, tank, armyTruck, jeep, soldier, watchtower, sandbagWall, flagPole, bigSign, drum,
} from './military.js';

// 2x2 tiles (20 x 20 m). Front (street, gate) faces +z.
// West: three barrack huts behind a parade ground with a flagpole and a drilling platoon.
// East: motor pool with a line of tanks and a line of trucks, gate with sign, watchtower in the back corner.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  const white = mat(PALETTE.white);

  // --- barrack huts -------------------------------------------------------
  g.add(place(patch(10.2, 9.6, 'gravel'), { x: -4.6, y: y0, z: -5.0 }));
  const hutW = 2.5, hutD = 8.2, hutZ = -5.2;
  const roofM = surface('corrugated', OLIVE_DARK, { size: 1.2 });
  const hutStyle = { style: 'punched', wall: KHAKI, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.45, bay: 1.6, floorHeight: 2.7, lit: 0.15, roof: OLIVE };
  for (const [i, x] of [-8.3, -4.65, -1.0].entries()) {
    g.add(place(box(hutW + 0.3, 0.35, hutD + 0.3, mat(PALETTE.concreteDark)), { x, y: y0, z: hutZ }));
    g.add(place(facadeBlock({ w: hutW, d: hutD, floors: 1, ...hutStyle, seed: 30 + i, blank: ['front'] }), { x, y: y0 + 0.35, z: hutZ }));
    g.add(place(gableRoof({ w: hutW, d: hutD, h: 1.15, overhang: 0.22, ridge: 'z', material: roofM, gableMaterial: KHAKI }), { x, y: y0 + 0.35 + 2.7, z: hutZ }));
    // door, little porch roof, steps, stove pipe
    g.add(place(door({ w: 1.0, h: 2.0, color: OLIVE_DARK }), { x, y: y0 + 0.35, z: hutZ + hutD / 2 }));
    g.add(place(box(1.6, 0.1, 0.9, mat(OLIVE_DARK)), { x, y: y0 + 2.55, z: hutZ + hutD / 2 + 0.45, rx: -10 }));
    g.add(place(stairs({ w: 1.3, h: 0.35, d: 0.7, steps: 2, material: mat(PALETTE.concrete) }), { x, y: y0, z: hutZ + hutD / 2 + 0.35, ry: 180 }));
    g.add(place(cylinder(0.12, 0.12, 1.4, metal(PALETTE.steelDark), 6), { x: x + 0.6, y: y0 + 3.4, z: hutZ - 2.2 }));
    g.add(place(cylinder(0.2, 0.2, 0.12, metal(PALETTE.steelDark), 6), { x: x + 0.6, y: y0 + 4.8, z: hutZ - 2.2 }));
    // hut number plate above the door
    g.add(place(bigSign({ text: String(i + 1), w: 0.6, h: 0.45, d: 0.06, bg: PALETTE.white, fg: PALETTE.black, border: null }), { x, y: y0 + 2.75, z: hutZ + hutD / 2 + 0.02 }));
  }

  // --- parade ground ------------------------------------------------------
  const pgX = -4.6, pgZ = 4.75, pgW = 9.8, pgD = 8.3;
  g.add(place(patch(pgW, pgD, 'asphalt'), { x: pgX, y: y0, z: pgZ }));
  const lineY = y0 + 0.05;
  for (const [w, d, x, z] of [
    [pgW - 0.6, 0.12, pgX, pgZ - pgD / 2 + 0.3], [pgW - 0.6, 0.12, pgX, pgZ + pgD / 2 - 0.3],
    [0.12, pgD - 0.6, pgX - pgW / 2 + 0.3, pgZ], [0.12, pgD - 0.6, pgX + pgW / 2 - 0.3, pgZ],
  ]) g.add(place(box(w, 0.02, d, white), { x, y: lineY, z }));
  // marker dots for the drill squares
  for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) {
    g.add(place(box(0.3, 0.02, 0.3, mat(PALETTE.yellow)), { x: pgX - 2.4 + c * 1.2, y: lineY, z: 4.6 + r * 1.3 + 0.55 }));
  }
  // flagpole on a stone plinth at the head of the ground
  g.add(place(box(1.6, 0.3, 1.6, mat(PALETTE.stone)), { x: pgX, y: y0, z: 1.6 }));
  g.add(place(box(1.0, 0.25, 1.0, mat(PALETTE.stoneDark)), { x: pgX, y: y0 + 0.3, z: 1.6 }));
  g.add(place(flagPole({ h: 10 }), { x: pgX, y: y0 + 0.55, z: 1.6 }));
  // platoon in formation facing the flag, sergeant in front facing them
  for (let c = 0; c < 5; c++) for (let r = 0; r < 3; r++) {
    g.add(place(soldier({ salute: true }), { x: pgX - 2.4 + c * 1.2, y: y0, z: 4.6 + r * 1.3, ry: 180 }));
  }
  g.add(place(soldier(), { x: pgX + 1.4, y: y0, z: 3.0, ry: -60 }));
  // reviewing bench at the front edge, lamps at the corners
  for (const x of [pgX - pgW / 2 + 0.5, pgX + pgW / 2 - 0.5]) {
    g.add(place(streetLamp({ h: 4.2 }), { x, y: y0, z: pgZ + pgD / 2 - 0.5, ry: x < pgX ? 0 : 180 }));
  }

  // --- motor pool ---------------------------------------------------------
  g.add(place(patch(8.6, 19.4, 'concrete'), { x: 5.5, y: y0, z: 0 }));
  const lanes = [2.8, 5.6, 8.4];
  for (const x of [1.4, 4.2, 7.0, 9.6]) g.add(place(box(0.1, 0.02, 12.4, mat(PALETTE.yellow)), { x: Math.min(x, 9.6), y: lineY, z: -0.6 }));
  for (const [i, x] of lanes.entries()) {
    g.add(place(tank({ turretRy: i === 1 ? 0 : 0 }), { x, y: y0 + 0.02, z: -4.4, s: 0.88 }));
    g.add(place(armyTruck(), { x, y: y0 + 0.02, z: 2.75, s: 0.86 }));
  }
  // jeep, sandbag post with drums and fuel cans in the back strip
  g.add(place(jeep(), { x: 3.0, y: y0 + 0.02, z: -8.4, ry: 90 }));
  g.add(place(sandbagWall({ w: 2.8, d: 2.0, h: 0.9, gap: 0 }), { x: 5.4, y: y0, z: -8.6 }));
  for (const [x, z, c] of [[4.7, -8.9, OLIVE], [5.4, -8.9, OLIVE], [6.1, -8.9, PALETTE.rust], [4.9, -8.2, OLIVE], [5.7, -8.2, OLIVE_DARK]]) {
    g.add(place(drum(c), { x, y: y0, z }));
  }
  // watchtower in the back-right corner
  g.add(place(watchtower({ h: 6.5, w: 2.4 }), { x: 8.3, y: y0, z: -8.3 }));

  // --- perimeter fence + gate ----------------------------------------------
  const F = 19.6, fh = 2.0;
  g.add(place(fence({ w: F, d: F, h: fh, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  const gateL = 1.3, gateR = 7.7; // gate opening in the front fence
  const frontRun = (a, b) => place(fence({ w: b - a, d: 0, h: fh, style: 'wire', sides: ['front'] }), { x: (a + b) / 2, y: y0, z: F / 2 });
  g.add(frontRun(-F / 2, gateL));
  g.add(frontRun(gateR + 1.4, F / 2));
  // barbed wire coils along the top of the fence
  const barbed = metal(PALETTE.steelDark);
  for (const [w, d, x, z] of [[F, 0.06, 0, -F / 2], [0.06, F, -F / 2, 0], [0.06, F, F / 2, 0], [gateL + F / 2, 0.06, (gateL - F / 2) / 2, F / 2]]) {
    g.add(place(box(w, 0.08, d, barbed), { x, y: y0 + fh + 0.1, z }));
  }
  // gate posts, arch sign and boom barrier
  const postM = mat(OLIVE_DARK);
  for (const x of [gateL, gateR]) {
    g.add(place(box(0.4, 5.2, 0.4, postM), { x, y: y0, z: F / 2 }));
    g.add(place(box(0.55, 0.2, 0.55, mat(PALETTE.yellow)), { x, y: y0 + 5.2, z: F / 2 }));
  }
  g.add(place(bigSign({ text: 'ARMY BARRACKS', w: gateR - gateL - 0.4, h: 1.1, d: 0.15, double: true }), { x: (gateL + gateR) / 2, y: y0 + 3.9, z: F / 2 }));
  g.add(place(box(0.3, 1.0, 0.3, mat(PALETTE.darkGrey)), { x: gateL + 0.5, y: y0, z: F / 2 - 0.5 }));
  g.add(place(box(5.2, 0.14, 0.14, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.8 })), { x: gateL + 0.5 + 2.6, y: y0 + 0.9, z: F / 2 - 0.5 }));
  // guard booth with sandbags right of the gate
  const bx = gateR + 0.7 + 0.15;
  g.add(place(facadeBlock({ w: 1.4, d: 1.6, h: 2.5, floorHeight: 2.5, style: 'punched', wall: PALETTE.white, glass: PALETTE.window, frame: OLIVE_DARK, windowW: 0.7, windowH: 0.45, bay: 1.4, roof: OLIVE_DARK }), { x: bx, y: y0, z: F / 2 - 1.3 }));
  g.add(place(box(1.9, 0.2, 2.1, mat(OLIVE_DARK)), { x: bx, y: y0 + 2.5, z: F / 2 - 1.3 }));
  g.add(place(soldier(), { x: gateR + 0.2, y: y0, z: F / 2 + 0.0 - 0.2, ry: 0 }));

  // --- a few trees along the west fence -------------------------------------
  for (const [x, z, s] of [[-8.7, 0.0, 1], [-2.8, 0.0, 2], [0.75, 8.6, 3]]) {
    g.add(place(tree({ kind: 'cone', h: 4.5, seed: s, color: PALETTE.foliageDark }), { x, y: y0, z }));
  }
  return g;
}

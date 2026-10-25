import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, cone, place, mat, metal, surface,
  lattice, pipeRun, tank, tree, streetLamp, door, emissive,
} from '../../src/lib/index.js';
import { railRing, paperRoll, steamPlume, bigSign, gallery, forklift, wheelLoader, rollLorry } from './props.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: twin pulp digesters fed by a chip conveyor from the wood-chip pile.
// East: the long paper machine hall with its steaming drying hood.
// Front yard: stacks of giant paper rolls, a forklift and a lorry being loaded.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'concrete'));

  const steelM = metal(PALETTE.steelLight, { roughness: 0.5 });
  const darkM = metal(PALETTE.steelDark);
  const blue = PALETTE.roofBlue;

  // --- paper machine hall ---------------------------------------------------
  const hx = 3.5, hz = -2.0, hw = 12.4, hd = 5.4, hh = 7;
  const wallTop = y0 + hh;
  g.add(place(facadeBlock({
    w: hw, d: hd, h: hh, floorHeight: 3.5, bay: 2.1, style: 'industrial',
    wall: '#dfe4e6', glass: PALETTE.glassSky, frame: PALETTE.steelLight, lit: 0.15, seed: 31,
  }), { x: hx, y: y0, z: hz }));
  // blue corporate band + plinth
  g.add(place(box(hw + 0.12, 0.8, hd + 0.12, mat(blue)), { x: hx, y: wallTop - 0.8, z: hz }));
  g.add(place(box(hw + 0.1, 0.5, hd + 0.1, mat(PALETTE.concreteDark)), { x: hx, y: y0, z: hz }));
  const roofMat = surface('corrugated', PALETTE.roofGrey, { size: 1.5 });
  g.add(place(gableRoof({ w: hw, d: hd, h: 1.3, overhang: 0.3, ridge: 'x', material: roofMat, gableMaterial: mat(blue) }), { x: hx, y: wallTop, z: hz }));
  // raised drying-section hood along the ridge, with louvres and steam vents
  const hoodW = 8.4, hoodX = hx + 1.2;
  g.add(place(box(hoodW, 1.5, 1.8, mat('#cfd6da')), { x: hoodX, y: wallTop + 0.6, z: hz }));
  g.add(place(box(hoodW + 0.2, 0.15, 2.1, mat(PALETTE.roofGrey)), { x: hoodX, y: wallTop + 2.1, z: hz }));
  for (let i = 0; i < 7; i++) {
    const lx = hoodX - hoodW / 2 + 0.75 + i * 1.15;
    g.add(place(box(0.8, 0.5, 0.06, mat(PALETTE.darkGrey)), { x: lx, y: wallTop + 1.35, z: hz + 0.91 }));
    g.add(place(box(0.8, 0.5, 0.06, mat(PALETTE.darkGrey)), { x: lx, y: wallTop + 1.35, z: hz - 0.91 }));
  }
  const ventXs = [hoodX - 2.8, hoodX, hoodX + 2.8];
  ventXs.forEach((vx, i) => {
    g.add(place(box(1.1, 0.55, 1.1, steelM), { x: vx, y: wallTop + 2.25, z: hz }));
    g.add(place(box(1.4, 0.12, 1.4, darkM), { x: vx, y: wallTop + 2.95, z: hz }));
    for (const c of [-0.6, 0.6]) g.add(place(box(0.08, 0.2, 0.08, darkM), { x: vx + c, y: wallTop + 2.8, z: hz + c }));
    g.add(place(steamPlume({ seed: 40 + i, puffs: 4, r0: 0.6, rise: 0.6, drift: 0.35, grow: 0.2 }), { x: vx, y: wallTop + 3.4, z: hz }));
  });
  // east gable: second sign
  g.add(place(bigSign({ text: 'PULP & PAPER', w: 4.2, h: 0.9, bg: '#ffffff', fg: blue, border: blue }), { x: hx + hw / 2 + 0.08, y: wallTop - 2.2, z: hz, ry: 90 }));
  // pipe rack along the back wall
  g.add(pipeRun([[hx - hw / 2, y0 + 4.6, hz - hd / 2 - 0.25], [hx + hw / 2 - 0.6, y0 + 4.6, hz - hd / 2 - 0.25], [hx + hw / 2 - 0.6, wallTop + 0.6, hz - hd / 2 - 0.25]], 0.16, metal('#8a9aa6')));
  g.add(pipeRun([[hx - hw / 2, y0 + 4.1, hz - hd / 2 - 0.25], [hx + 2, y0 + 4.1, hz - hd / 2 - 0.25]], 0.12, metal(PALETTE.rust)));
  for (let i = 0; i < 5; i++) g.add(place(box(0.12, 0.12, 0.45, darkM), { x: hx - hw / 2 + 1 + i * 2.6, y: y0 + 3.9, z: hz - hd / 2 - 0.2 }));

  // sign + entrance on the front of the hall
  const front = hz + hd / 2;
  g.add(place(bigSign({ text: 'PAPER MILL', w: 6.2, h: 1.1, bg: blue, fg: '#ffffff', border: '#ffffff' }), { x: hx - 2.6, y: wallTop - 0.95, z: front + 0.08 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: blue }), { x: hx - 5.0, y: y0, z: front }));
  g.add(place(box(1.8, 0.12, 1.0, mat(PALETTE.steelLight)), { x: hx - 5.0, y: y0 + 2.6, z: front + 0.5 }));
  // loading dock: two roller doors with a canopy and platform
  const dockM = surface('corrugated', '#e9c31f', { size: 0.6 });
  for (const dx of [hx + 2.6, hx + 5.0]) {
    g.add(place(box(2.0, 3.0, 0.1, dockM), { x: dx, y: y0 + 0.9, z: front + 0.05 }));
    g.add(place(box(2.3, 0.15, 0.15, mat(PALETTE.darkGrey)), { x: dx, y: y0 + 3.9, z: front + 0.1 }));
  }
  g.add(place(box(5.4, 0.9, 1.2, mat(PALETTE.concreteDark)), { x: hx + 3.8, y: y0, z: front + 0.6 }));
  g.add(place(box(5.6, 0.15, 1.8, mat(PALETTE.steelLight)), { x: hx + 3.8, y: y0 + 4.3, z: front + 0.9 }));
  for (const dx of [hx + 1.1, hx + 6.5]) g.add(place(box(0.1, 0.12, 1.8, darkM), { x: dx, y: y0 + 4.2, z: front + 0.9 }));

  // --- digesters ------------------------------------------------------------
  const dz = -2.6;
  const digXs = [-8.3, -5.4];
  const clad = metal(PALETTE.aluminium, { roughness: 0.45 });
  const band = mat(PALETTE.roofBlue);
  const conc = mat(PALETTE.concrete);
  const R = 1.3;
  for (const x of digXs) {
    g.add(place(cylinder(1.0, 1.1, 2.6, conc, 14), { x, y: y0, z: dz }));               // skirt
    g.add(place(cylinder(R, 0.5, 1.4, clad, 16), { x, y: y0 + 2.6, z: dz }));          // conical bottom
    g.add(place(cylinder(R, R, 11, clad, 16), { x, y: y0 + 4.0, z: dz }));              // shell
    for (const by of [6.5, 10.5]) g.add(place(cylinder(R + 0.05, R + 0.05, 0.35, band, 16), { x, y: y0 + by, z: dz }));
    g.add(place(cylinder(0.45, R, 1.4, clad, 16), { x, y: y0 + 15, z: dz }));           // top cone
    g.add(place(cylinder(0.3, 0.3, 0.9, darkM, 8), { x, y: y0 + 16.4, z: dz }));
    // catwalk ring with railing near the top
    g.add(place(cylinder(R + 0.55, R + 0.55, 0.12, darkM, 16), { x, y: y0 + 14.4, z: dz }));
    g.add(place(railRing(R + 0.5), { x, y: y0 + 15.3, z: dz }));
    g.add(place(steamPlume({ seed: Math.round(x * 7), puffs: 6, r0: 0.45, rise: 0.95, drift: 0.32, grow: 0.17 }), { x, y: y0 + 17.6, z: dz }));
  }
  // stair tower between the digesters and the chip head-house on top
  const midX = (digXs[0] + digXs[1]) / 2;
  g.add(place(lattice({ w: 1.2, d: 1.2, h: 14.4, segments: 7, thickness: 0.1, material: darkM }), { x: midX, y: y0, z: dz }));
  g.add(place(box(digXs[1] - digXs[0] + 2 * R, 0.15, 1.6, darkM), { x: midX, y: y0 + 14.4, z: dz }));
  g.add(place(box(3.4, 1.8, 2.0, mat(PALETTE.steelLight)), { x: midX, y: y0 + 16.2, z: dz + 0.2 }));
  g.add(place(box(3.6, 0.15, 2.2, mat(PALETTE.roofGrey)), { x: midX, y: y0 + 18.0, z: dz + 0.2 }));
  g.add(place(box(0.25, 1.8, 0.25, darkM), { x: midX - 1.4, y: y0 + 14.4, z: dz + 1.0 }));
  g.add(place(box(0.25, 1.8, 0.25, darkM), { x: midX + 1.4, y: y0 + 14.4, z: dz + 1.0 }));

  // blow tank + pulp line to the hall
  const btx = -2.4, btz = -3.4;
  g.add(place(tank({ radius: 0.95, h: 4.6, roof: 'cone', material: steelM }), { x: btx, y: y0, z: btz }));
  g.add(place(cylinder(1.0, 1.0, 0.3, band, 14), { x: btx, y: y0 + 3.2, z: btz }));
  const pipeM = metal('#8a9aa6');
  for (const x of digXs) {
    g.add(pipeRun([[x, y0 + 3.0, dz + 1.0], [x, y0 + 5.5, dz + 1.0], [btx, y0 + 5.5, dz + 1.0], [btx, y0 + 5.5, btz + 0.5]], 0.14, pipeM));
  }
  g.add(pipeRun([[btx + 0.6, y0 + 2.2, btz], [hx - hw / 2, y0 + 2.2, btz]], 0.18, pipeM));
  g.add(pipeRun([[btx, y0 + 1.0, btz + 0.9], [btx, y0 + 1.0, hz + hd / 2 - 0.6], [hx - hw / 2, y0 + 1.0, hz + hd / 2 - 0.6]], 0.14, metal(PALETTE.rust)));

  // --- wood-chip pile + conveyor -------------------------------------------
  const px = -6.6, pz = 2.4;
  g.add(place(patch(7.0, 4.6, 'dirt'), { x: px, y: y0, z: pz }));
  const chipM = surface('gravel', '#c99a55', { size: 1.2 });
  g.add(place(cone(3.0, 3.6, chipM, 11), { x: px, y: y0 + 0.05, z: pz, s: [1.1, 1, 0.75] }));
  g.add(place(cone(1.4, 1.5, chipM, 9), { x: px - 1.9, y: y0 + 0.05, z: pz + 0.6 }));
  g.add(place(cone(1.2, 1.1, chipM, 9), { x: px + 2.3, y: y0 + 0.05, z: pz + 1.0 }));
  // inclined chip conveyor from the pile up to the head-house
  const cFrom = [px, y0 + 3.0, pz + 0.2];
  const cTo = [midX, y0 + 16.6, dz + 1.2];
  g.add(gallery(cFrom, cTo, { w: 1.0, h: 0.9 }));
  const t = 0.42;
  const sx = cFrom[0] + (cTo[0] - cFrom[0]) * t, sy = cFrom[1] + (cTo[1] - cFrom[1]) * t, sz = cFrom[2] + (cTo[2] - cFrom[2]) * t;
  g.add(place(lattice({ w: 0.8, d: 0.8, h: sy - y0 - 0.5, segments: 4, thickness: 0.08, material: darkM }), { x: sx, y: y0, z: sz }));
  g.add(place(wheelLoader(), { x: px + 2.0, y: y0, z: 3.8, ry: 165 }));

  // --- front yard: paper roll stacks, forklift, lorry ------------------------
  g.add(place(patch(13.6, 2.9, 'asphalt'), { x: 3.1, y: y0, z: 3.45 }));
  const rollW = '#f4f2ea', rollK = '#c9a46e';
  // stacks of standing rolls (2 high) between the chip pile and the dock
  const stacks = [
    [-2.4, 1.3, 2, rollW], [-0.9, 1.3, 2, rollW], [-2.4, 2.8, 2, rollK], [-0.9, 2.8, 1, rollW],
    [-2.4, 4.3, 1, rollW], [0.6, 1.3, 1, rollK],
  ];
  for (const [x, z, n, c] of stacks) {
    for (let i = 0; i < n; i++) g.add(place(paperRoll({ r: 0.7, h: 1.45, color: c }), { x, y: y0 + i * 1.45, z }));
  }
  g.add(place(forklift(), { x: 0.4, y: y0, z: 3.0, ry: -20 }));
  g.add(place(rollLorry({ color: PALETTE.red, rolls: 4 }), { x: 5.4, y: y0, z: 3.5, s: 0.85 }));

  // lamps, trees
  g.add(place(streetLamp({ h: 4.5 }), { x: 9.6, y: y0, z: 4.6, ry: 180 }));
  g.add(place(box(0.35, 0.35, 0.35, emissive(PALETTE.windowLit, 0.6)), { x: hx - 5.0, y: y0 + 2.75, z: front + 0.95 }));
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 8 }), { x: -9.3, y: y0, z: -4.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: 9.4, y: y0, z: 1.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 10 }), { x: -9.4, y: y0, z: 4.4 }));
  return g;
}

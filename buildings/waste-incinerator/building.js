import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, metal, surface, emissive, parapet, rooftopUnits, pipeRun, door,
  solarPanel, tree, hedge, streetLamp, bench,
} from '../../src/lib/index.js';
import { paintedBlock, bigSign, refuseLorry, flueStack, recyclingBin } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: tall painted boiler hall with the flue stack beside it.
// East: refuse bunker with a drive-in tipping hall where the lorries unload.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'concrete'));

  // front apron / service road
  g.add(place(patch(17.6, 2.8, 'asphalt'), { x: 1.2, y: y0, z: 3.6 }));
  g.add(place(patch(2.4, 9.98, 'grass'), { x: -8.8, y: y0, z: 0 }));
  const lineM = mat(PALETTE.yellow);
  for (let x = -6.4; x < 9; x += 2.4) g.add(place(box(1.2, 0.02, 0.15, lineM), { x, y: y0 + 0.05, z: 3.7 }));

  // --- boiler hall: x -7.6..-0.6, z -4.6..2.2, 15 m tall
  const hx = -4.1, hz = -1.2, hw = 7, hd = 6.8, hh = 15;
  g.add(place(paintedBlock('hall', hw, hh, hd, { seed: 3, bands: [[0.4, 2.8], [10.2, 11.6]] }), { x: hx, y: y0, z: hz }));
  g.add(place(parapet({ w: hw, d: hd, h: 0.6, t: 0.25, material: mat(PALETTE.white) }), { x: hx, y: y0 + hh, z: hz }));
  // flue-gas cleaning house on the roof + duct to the stack
  const fgM = surface('corrugated', PALETTE.steelLight, { size: 1.2 });
  g.add(place(box(4.6, 3.2, 3.2, fgM), { x: hx - 0.6, y: y0 + hh, z: -3.0 }));
  g.add(place(box(4.8, 0.2, 3.4, mat(PALETTE.steelDark)), { x: hx - 0.6, y: y0 + hh + 3.2, z: -3.0 }));
  g.add(place(rooftopUnits({ w: 4, d: 2.2, count: 3, seed: 7 }), { x: hx + 0.8, y: y0 + hh, z: 0.6 }));
  // visitor entrance with a yellow canopy
  g.add(place(door({ w: 2.0, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { x: -1.9, y: y0, z: hz + hd / 2 }));
  g.add(place(box(3.0, 0.25, 1.4, mat(PALETTE.yellow)), { x: -1.9, y: y0 + 2.8, z: hz + hd / 2 + 0.7 }));

  // --- flue stack in the west strip
  const sx = -8.5, sz = -3.0;
  g.add(place(box(2.4, 1.0, 2.4, mat(PALETTE.concreteDark)), { x: sx, y: y0, z: sz }));
  g.add(place(flueStack({ h: 34 }), { x: sx, y: y0 + 1.0, z: sz }));
  const ductM = metal(PALETTE.steel, { roughness: 0.35 });
  g.add(pipeRun([[hx - 1.5, y0 + hh + 1.8, -3.0], [-7.4, y0 + hh + 1.8, -3.0], [sx, y0 + hh + 1.8, sz]], 0.45, ductM));

  // --- refuse bunker: x -0.6..9.6, z -4.6..-1.6, 12 m tall
  const bx = 4.5, bw = 10.2, bz = -3.1, bd = 3.0, bh = 12;
  g.add(place(paintedBlock('bunker', bw, bh, bd, { seed: 11, bands: [[10.0, 11.0]] }), { x: bx, y: y0, z: bz }));
  g.add(place(parapet({ w: bw, d: bd, h: 0.5, t: 0.25, material: mat(PALETTE.white) }), { x: bx, y: y0 + bh, z: bz }));
  // grab-crane housing on the bunker roof
  g.add(place(box(3.4, 1.6, 2.2, surface('corrugated', PALETTE.blue, { size: 1.2 })), { x: 2.2, y: y0 + bh, z: bz }));
  g.add(place(box(1.4, 1.1, 0.9, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { x: 7.6, y: y0 + bh, z: bz + 0.6 }));
  // big sign above the tipping hall roof
  g.add(place(box(9.0, 2.0, 0.12, mat(PALETTE.navy)), { x: bx, y: y0 + 7.15, z: bz + bd / 2 + 0.04 }));
  g.add(place(bigSign({ text: 'ENERGY FROM WASTE', w: 8.6, h: 1.6, bg: PALETTE.navy, fg: '#ffffff', key: 'efw' }), { x: bx, y: y0 + 7.35, z: bz + bd / 2 + 0.1 }));

  // --- drive-in tipping hall: x -0.6..9.6, z -1.6..2.2, 7 m tall, two open bays
  const tz0 = -1.6, tz1 = 2.2, td = tz1 - tz0, tzc = (tz0 + tz1) / 2, th = 6.4;
  const darkM = mat('#2a2c30');
  g.add(place(box(bw - 0.4, 0.05, td, mat(PALETTE.concreteDark)), { x: bx, y: y0, z: tzc }));
  g.add(place(box(bw - 0.4, th, 0.1, darkM), { x: bx, y: y0, z: tz0 + 0.05 }));
  const wallM = mat(PALETTE.white);
  for (const px of [-0.35, 4.5, 9.35]) {
    g.add(place(box(0.5, th, td, wallM), { x: px, y: y0, z: tzc }));
    g.add(place(box(0.52, 0.5, td + 0.02, surface('hazard', PALETTE.yellow, { size: 0.5 })), { x: px, y: y0, z: tzc }));
  }
  g.add(place(paintedBlock('fascia', bw, 1.0, td + 0.2, { seed: 21, white: 0.05, roof: PALETTE.concreteDark }), { x: bx, y: y0 + th, z: tzc + 0.1 }));
  // solar panels on the tipping hall roof
  for (const px of [1.4, 4.5, 7.6]) g.add(place(solarPanel({ w: 2.6, d: 1.4, tilt: 20, height: 0.3 }), { x: px, y: y0 + th + 1.0, z: 0.5 }));
  // right bay: roller shutter half open
  g.add(place(box(4.3, 3.6, 0.15, surface('corrugated', PALETTE.orange, { size: 0.6 })), { x: 6.92, y: y0 + th - 3.6, z: tz1 - 0.3 }));
  g.add(place(box(4.3, 0.3, 0.4, mat(PALETTE.steelDark)), { x: 6.92, y: y0 + th - 0.3, z: tz1 - 0.3 }));
  // left bay: lorry reversed in, tipping into the bunker
  g.add(place(refuseLorry({ body: '#3c9a4a' }), { x: 2.08, y: y0 + 0.05, z: 1.55, ry: -90, s: 0.85 }));
  // traffic lights for the bays
  for (const px of [-0.05, 9.05]) {
    g.add(place(box(0.25, 0.6, 0.12, mat(PALETTE.black)), { x: px, y: y0 + 3.2, z: tz1 + 0.06 }));
    g.add(place(box(0.14, 0.14, 0.05, emissive(px < 0 ? PALETTE.red : PALETTE.green, 1)), { x: px, y: y0 + 3.4, z: tz1 + 0.12 }));
  }

  // --- second lorry arriving on the weighbridge in front of the hall
  g.add(place(box(6.6, 0.06, 2.6, metal(PALETTE.steel, { roughness: 0.6 })), { x: -4.4, y: y0, z: 3.6 }));
  g.add(place(refuseLorry({ body: PALETTE.orange, stripe: PALETTE.white }), { x: -4.6, y: y0 + 0.06, z: 3.6, s: 0.85 }));

  // --- west strip: recycling banks, trees, lamp
  const bins = [PALETTE.green, PALETTE.blue, PALETTE.yellow];
  bins.forEach((c, i) => g.add(place(recyclingBin(c), { x: -9.25, y: y0, z: -0.7 + i * 1.35, ry: 90 })));
  g.add(place(hedge({ w: 2.0, h: 0.9, d: 0.7 }), { x: -8.8, y: y0, z: -1.6 }));
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 12 }), { x: -8.8, y: y0, z: 3.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: 8.9, y: y0, z: 4.4 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -0.2, y: y0, z: 4.75 }));
  g.add(place(bench({ w: 1.4 }), { x: -2.0, y: y0, z: 4.6, ry: 180 }));
  return g;
}

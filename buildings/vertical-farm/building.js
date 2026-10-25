import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, place, cylinder, pipeRun, tank, solarPanel,
  door, awning, tree, car, streetLamp, bench, mat, metal, emissive,
} from '../../src/lib/index.js';
import { FRAME, boardSign, hydroFloor, windVane, crate } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // tower: square, pushed to the back-left corner
  const tx = -0.9, tz = -0.9, W = 6.2, D = 6.2;
  const lobbyH = 3.4, FH = 3.0, floors = 6;

  // ground floor: farm shop / lobby
  g.add(place(facadeBlock({ w: W, d: D, h: lobbyH, floorHeight: lobbyH, style: 'shop', wall: PALETTE.white, glass: PALETTE.glassGreen, frame: PALETTE.steelDark, bay: 2.0, lit: 0.6, seed: 4, roof: PALETTE.concrete }), { x: tx, y: y0, z: tz }));
  g.add(place(door({ w: 1.4, h: 2.3, color: PALETTE.glassDark }), { x: tx - 1.2, y: y0, z: tz + D / 2 }));
  g.add(place(awning({ w: 3.4, depth: 1.1, drop: 0.35, color: PALETTE.green, color2: PALETTE.white }), { x: tx + 1.3, y: y0 + 2.5, z: tz + D / 2 }));
  g.add(place(boardSign({ text: 'VERTICAL FARM', w: 5.6, h: 0.75, bg: '#3b1f5c', fg: '#ffffff', border: '#ff6ad5' }), { x: tx, y: y0 + 2.62, z: tz + D / 2 + 0.1 }));

  // stacked hydroponic floors
  let y = y0 + lobbyH;
  for (let i = 0; i < floors; i++, y += FH) g.add(place(hydroFloor({ w: W, d: D, h: FH }), { x: tx, y, z: tz }));

  // exoskeleton: corner columns and mid mullions
  const colM = mat(FRAME);
  const hydroH = floors * FH;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.35, hydroH + 0.3, 0.35, colM), { x: tx + sx * (W / 2 + 0.05), y: y0 + lobbyH, z: tz + sz * (D / 2 + 0.05) }));
  }
  const mull = metal(PALETTE.steelLight);
  for (const off of [-W / 6, W / 6]) {
    g.add(place(box(0.1, hydroH, 0.1, mull), { x: tx + off, y: y0 + lobbyH, z: tz + D / 2 + 0.03 }));
    g.add(place(box(0.1, hydroH, 0.1, mull), { x: tx + off, y: y0 + lobbyH, z: tz - D / 2 - 0.03 }));
    g.add(place(box(0.1, hydroH, 0.1, mull), { x: tx + W / 2 + 0.03, y: y0 + lobbyH, z: tz + off }));
    g.add(place(box(0.1, hydroH, 0.1, mull), { x: tx - W / 2 - 0.03, y: y0 + lobbyH, z: tz + off }));
  }

  // roof slab, glowing crown band, parapet
  g.add(place(box(W + 0.5, 0.35, D + 0.5, mat(FRAME)), { x: tx, y, z: tz }));
  g.add(place(box(W + 0.54, 0.12, D + 0.54, emissive('#ff5ad9', 1)), { x: tx, y: y + 0.12, z: tz }));
  y += 0.35;
  g.add(place(parapet({ w: W + 0.5, d: D + 0.5, h: 0.6, t: 0.25, material: mat(FRAME) }), { x: tx, y, z: tz }));
  // rooftop: rainwater tank, solar panels, wind vane
  g.add(place(tank({ radius: 0.8, h: 1.4, roof: 'cone', material: mat(PALETTE.steelLight) }), { x: tx - 1.6, y, z: tz - 1.6 }));
  g.add(place(solarPanel({ w: 2.4, d: 1.2, tilt: 25, height: 0.4 }), { x: tx + 1.2, y, z: tz + 1.7 }));
  g.add(place(solarPanel({ w: 2.4, d: 1.2, tilt: 25, height: 0.4 }), { x: tx - 1.4, y, z: tz + 1.7 }));
  g.add(place(box(1.3, 1.0, 1.3, mat(PALETTE.lightGrey)), { x: tx + 1.7, y, z: tz - 1.7 }));
  g.add(place(windVane({ h: 4.2 }), { x: tx + 0.1, y, z: tz - 0.3, ry: 35 }));

  // side yard: nutrient tanks piped into the tower
  const tankM = mat('#e9e2f2', { roughness: 0.5 });
  for (const [z, c] of [[-2.6, '#b36bff'], [-0.4, '#6cbf3a']]) {
    g.add(place(patch(1.9, 1.9, 'concrete'), { x: 3.9, y: y0, z }));
    g.add(place(tank({ radius: 0.75, h: 2.2, roof: 'dome', material: tankM }), { x: 3.9, y: y0 + 0.05, z }));
    g.add(place(cylinder(0.77, 0.77, 0.25, mat(c), 20), { x: 3.9, y: y0 + 1.3, z }));
    g.add(pipeRun([[3.9, y0 + 2.4, z], [3.9, y0 + 2.9, z], [tx + W / 2, y0 + 2.9, z]], 0.09, metal(PALETTE.steel)));
  }
  g.add(place(box(1.4, 0.06, 0.8, mat(PALETTE.wood)), { x: 3.9, y: y0, z: -4.3 }));
  for (const [x, z] of [[3.6, -4.3], [4.2, -4.3]]) g.add(place(crate({ color: PALETTE.woodDark, produce: '#9b4fc9' }), { x, y: y0 + 0.06, z }));

  // front: market stall with crates of greens, delivery van, lamps
  g.add(place(patch(9.8, 2.5, 'cobbles'), { y: y0, z: 3.6 }));
  const stallX = -2.6, stallZ = 3.4;
  g.add(place(box(2.4, 0.75, 0.9, mat(PALETTE.wood)), { x: stallX, y: y0, z: stallZ }));
  for (const [i, p] of ['#6cbf3a', '#9bd65a', '#b14fc9', '#e04a3a'].entries()) {
    g.add(place(crate({ produce: p }), { x: stallX - 0.85 + i * 0.57, y: y0 + 0.75, z: stallZ, s: 0.85 }));
  }
  for (const sx of [-1, 1]) g.add(place(box(0.08, 2.1, 0.08, mat(PALETTE.woodDark)), { x: stallX + sx * 1.15, y: y0, z: stallZ + 0.4 }));
  g.add(place(awning({ w: 2.6, depth: 1.0, drop: 0.25, color: PALETTE.purple, color2: PALETTE.white }), { x: stallX, y: y0 + 2.35, z: stallZ - 0.55 }));
  for (const [x, z] of [[-4.2, 4.3], [-0.9, 4.3]]) g.add(place(crate({ produce: '#6cbf3a' }), { x, y: y0, z, ry: 15 }));

  g.add(place(car({ color: '#7a4d9a', kind: 'van' }), { x: 2.4, y: y0 + 0.05, z: 3.6, s: 0.6 }));
  g.add(place(boardSign({ text: 'GREENS', w: 1.3, h: 0.32, depth: 0.03, bg: '#7a4d9a', fg: '#ffffff', glow: 0.1 }), { x: 2.3, y: y0 + 0.75, z: 4.17 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 4.6, y: y0, z: 4.6, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: 0.9, y: y0, z: 2.75 }));

  // greenery at the corners
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: 3.9, y: y0, z: 1.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: -4.4, y: y0, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 14 }), { x: 2.9, y: y0, z: -4.4 }));
  return g;
}

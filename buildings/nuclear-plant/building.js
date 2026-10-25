import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, dome, cylinder, box, place, parapet, rooftopUnits,
  smokestack, lattice, pipeRun, sign, tree, fence, parkingLot, streetLamp, truck, door,
  surface, mat, metal, beam,
} from '../../src/lib/index.js';
import { coolingTower, steamPlume, trefoilMat, transformer } from './parts.js';

// 3x3 tiles (30 x 30 m). Front (street) faces +z.
// Back: two hyperbolic cooling towers. Front-left: domed reactor containment.
// Front-right: turbine hall with control annex, transformer yard and pylon.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = (3 * TILE) / 2;
  g.add(lot([3, 3], 'grass'));

  // site hardstanding + access road
  g.add(place(patch(28, 16.5, 'concrete'), { y: y0, z: 2.6 }));
  g.add(place(patch(28, 15, 'gravel'), { y: y0, z: -7.4 }));
  g.add(place(patch(4.2, 4.6, 'asphalt'), { x: 0, y: y0, z: 12.6 }));

  // ---- cooling towers (back) ----
  const towers = [[-7.4, -7.6, 1], [7.4, -7.4, 2]];
  for (const [x, z, seed] of towers) {
    const t = coolingTower({ baseR: 6.9, throatR: 3.75, topR: 4.35, h: 27 });
    g.add(place(t, { x, y: y0, z }));
    g.add(place(steamPlume({ r: 3.7, seed }), { x, y: y0 + 27.2, z }));
  }

  // cooling-water pipes: turbine hall -> tower basins
  const pipeM = metal(PALETTE.steelLight);
  g.add(pipeRun([[3.5, y0 + 0.6, -0.4], [3.5, y0 + 0.6, -1.6], [5.0, y0 + 0.6, -3.2]], 0.45, pipeM));
  g.add(pipeRun([[1.6, y0 + 0.6, -0.4], [1.6, y0 + 0.6, -1.4], [-2.2, y0 + 0.6, -3.0]], 0.45, pipeM));
  for (const [x, z] of [[3.5, -1.0], [1.6, -1.0]]) g.add(place(box(1.2, 0.35, 0.5, mat(PALETTE.concreteDark)), { x, y: y0, z }));

  // ---- reactor (front-left) ----
  const rx = -7.8, rz = 6.0;
  const concreteW = mat('#e6e2d8');
  // auxiliary block wrapped round the base
  g.add(place(facadeBlock({ w: 13, d: 10.6, floors: 1, floorHeight: 3.4, style: 'industrial', wall: PALETTE.offWhite, glass: PALETTE.window, frame: PALETTE.steelLight, bay: 3, seed: 7, roof: PALETTE.concreteDark }), { x: rx, y: y0, z: rz }));
  g.add(place(parapet({ w: 13, d: 10.6, h: 0.4, t: 0.25, material: mat(PALETTE.concrete) }), { x: rx, y: y0 + 3.4, z: rz }));
  // containment: cylinder + dome
  const cr = 4.3, ch = 9.5;
  g.add(place(cylinder(cr, cr, ch, mat('#ece9e1', { flatShading: false }), 36), { x: rx, y: y0 + 3.4, z: rz }));
  g.add(place(cylinder(cr + 0.12, cr + 0.12, 0.5, mat(PALETTE.concrete, { flatShading: false }), 36), { x: rx, y: y0 + 3.4 + ch - 0.5, z: rz }));
  g.add(place(cylinder(cr + 0.08, cr + 0.08, 0.35, mat(PALETTE.red, { flatShading: false }), 36), { x: rx, y: y0 + 3.4 + ch - 1.6, z: rz }));
  g.add(place(dome({ radius: cr, height: 3.6, segments: 36, material: mat('#dcd8ce', { flatShading: false, roughness: 0.7 }) }), { x: rx, y: y0 + 3.4 + ch, z: rz }));
  g.add(place(cylinder(0.6, 0.7, 0.5, mat(PALETTE.steel)), { x: rx, y: y0 + 3.4 + ch + 3.45, z: rz }));
  // trefoil plaque and personnel airlock facing the street
  g.add(place(box(1.8, 1.8, 0.1, [concreteW, concreteW, concreteW, concreteW, trefoilMat(), concreteW]), { x: rx, y: y0 + 3.4 + 4.2, z: rz + cr + 0.02 }));
  g.add(place(box(2.4, 2.6, 1.2, mat(PALETTE.concrete)), { x: rx + 2.2, y: y0, z: rz + 5.8 }));
  g.add(place(door({ w: 1.4, h: 2.1, color: PALETTE.yellow }), { x: rx + 2.2, y: y0, z: rz + 6.4 }));
  g.add(place(box(0.9, 0.9, 0.08, [concreteW, concreteW, concreteW, concreteW, trefoilMat(), concreteW]), { x: rx - 1.2, y: y0 + 1.7, z: rz + 5.32 }));

  // banded ventilation stack beside the reactor
  g.add(place(smokestack({ radius: 0.9, topRadius: 0.75, h: 22, color: PALETTE.white, bandColor: PALETTE.red, bands: 3 }), { x: rx - 5.2, y: y0 + 3.4, z: rz - 3.9 }));
  g.add(pipeRun([[rx - 4.4, y0 + 4.2, rz - 3.9], [rx - 3.0, y0 + 4.2, rz - 3.9], [rx - 3.0, y0 + 3.4, rz - 3.9]], 0.3, metal(PALETTE.steel)));

  // ---- turbine hall (front-right) ----
  const tx = 5.0, tz = 3.6, tw = 12.5, td = 7.4, th = 9;
  const clad = { style: 'industrial', wall: '#5f86ad', glass: PALETTE.glassSky, frame: PALETTE.steelLight, bay: 2.5, seed: 12, lit: 0.1 };
  g.add(place(facadeBlock({ w: tw, d: td, h: th, floorHeight: 4.5, ...clad }), { x: tx, y: y0, z: tz }));
  g.add(place(gableRoof({ w: tw, d: td, h: 1.6, overhang: 0.3, ridge: 'x', material: surface('corrugated', PALETTE.roofGrey, { size: 1.2 }), gableMaterial: '#5f86ad' }), { x: tx, y: y0 + th, z: tz }));
  // roof ventilators along the ridge
  for (let i = 0; i < 4; i++) g.add(place(box(1.2, 0.8, 1.2, metal(PALETTE.steelLight)), { x: tx - 4.5 + i * 3, y: y0 + th + 1.3, z: tz }));
  // big roller door + crane rail stub on the east end
  g.add(place(box(0.1, 5, 3.6, mat(PALETTE.steelLight)), { x: tx + tw / 2 + 0.05, y: y0, z: tz }));
  for (let i = 1; i < 10; i++) g.add(place(box(0.14, 0.05, 3.6, mat(PALETTE.steel)), { x: tx + tw / 2 + 0.08, y: y0 + i * 0.5, z: tz }));
  // control annex across the front
  g.add(place(facadeBlock({ w: 10, d: 3.2, floors: 2, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 2.2, seed: 4, lit: 0.25, roof: PALETTE.concreteDark }), { x: tx - 0.8, y: y0, z: tz + td / 2 + 1.6 }));
  g.add(place(parapet({ w: 10, d: 3.2, h: 0.35, t: 0.2, material: mat(PALETTE.concrete) }), { x: tx - 0.8, y: y0 + 6, z: tz + td / 2 + 1.6 }));
  g.add(place(rooftopUnits({ w: 8, d: 2.2, count: 2, seed: 3 }), { x: tx - 0.8, y: y0 + 6, z: tz + td / 2 + 1.6 }));
  g.add(place(sign({ text: 'TINY TOWN NUCLEAR', w: 8.4, h: 1.0, bg: PALETTE.navy, fg: '#ffffff' }), { x: tx - 0.8, y: y0 + 6.5, z: tz + td / 2 + 3.15 }));
  g.add(place(door({ w: 2, h: 2.3, color: PALETTE.glassDark }), { x: tx - 0.8, y: y0, z: tz + td / 2 + 3.2 }));
  // link bridge reactor <-> turbine hall
  g.add(place(box(1.8, 2.2, 2.6, mat(PALETTE.offWhite)), { x: -0.5, y: y0 + 3.6, z: 3.4 }));

  // ---- switchyard (east edge) ----
  g.add(place(patch(4.2, 9, 'gravel'), { x: 12.8, y: y0 + 0.02, z: 4.2 }));
  g.add(place(transformer(), { x: 12.8, y: y0, z: 1.6, ry: 90 }));
  g.add(place(transformer(), { x: 12.8, y: y0, z: 5.6, ry: 90 }));
  g.add(place(lattice({ w: 2.2, h: 16, topW: 0.8, topD: 0.8, thickness: 0.12, material: metal(PALETTE.steelDark) }), { x: 12.8, y: y0, z: 9.6 }));
  const arm = metal(PALETTE.steelDark);
  for (const [y, w] of [[13, 5.2], [10.5, 6.2]]) {
    g.add(place(box(0.25, 0.25, w, arm), { x: 12.8, y: y0 + y, z: 9.6 }));
    for (const s of [-1, 1]) g.add(place(cylinder(0.08, 0.08, 0.8, mat('#8d5a3a'), 6), { x: 12.8, y: y0 + y - 0.8, z: 9.6 + s * (w / 2 - 0.2) }));
  }
  // busbars from transformers to the pylon
  const wireM = mat(PALETTE.darkGrey);
  for (const dz of [-0.6, 0.6]) g.add(beam([12.8, y0 + 3.4, 5.6 + dz], [12.8, y0 + 9.7, 9.6 + dz * 4.5], 0.05, wireM));
  g.add(place(fence({ w: 4.6, d: 9.6, h: 1.4, style: 'wire', sides: ['left', 'front'] }), { x: 12.7, y: y0, z: 4.2 }));

  // ---- front: car park, gate, sign, landscaping ----
  g.add(place(parkingLot({ w: 8, d: 4.6, seed: 8, fill: 0.8 }), { x: 8.2, y: y0, z: 12.4 }));
  g.add(place(truck({ color: PALETTE.yellow, trailerColor: PALETTE.white }), { x: -9.2, y: y0, z: 12.6, s: 0.85 }));
  g.add(place(patch(10, 3.2, 'asphalt'), { x: -9.2, y: y0 + 0.01, z: 12.6 }));
  // gatehouse + barrier
  g.add(place(box(2, 2.6, 2, mat(PALETTE.white)), { x: 3.2, y: y0, z: 13.2 }));
  g.add(place(box(2.2, 0.2, 2.2, mat(PALETTE.navy)), { x: 3.2, y: y0 + 2.6, z: 13.2 }));
  g.add(place(box(1.4, 0.8, 0.05, mat(PALETTE.glassDark)), { x: 3.2, y: y0 + 1.2, z: 14.22 }));
  g.add(place(box(3.6, 0.15, 0.15, mat(PALETTE.red)), { x: 0.2, y: y0 + 1.0, z: 14.2 }));
  // perimeter security fence with a gate on the street side
  g.add(place(fence({ w: 29.2, d: 29.2, h: 1.6, style: 'wire', gap: 4.4 }), { y: y0 }));
  // trees and lamps
  for (const [x, z, k, s] of [[-14, 9, 'cone', 3], [-14, 1, 'cone', 4], [-3.4, 14, 'round', 5], [13.6, -13.6, 'cone', 6], [-0.2, -13.4, 'round', 7], [10.5, 14, 'bush', 9]]) {
    g.add(place(tree({ kind: k, h: k === 'bush' ? 1.2 : 4.5, seed: s }), { x, y: y0, z }));
  }
  g.add(place(streetLamp({ h: 4.5 }), { x: 0.5, y: y0, z: 9.5 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -13.6, y: y0, z: 5, ry: 0 }));
  return g;
}

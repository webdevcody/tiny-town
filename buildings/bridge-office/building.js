import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, place, parapet, rooftopUnits, antenna, sign, tree, streetLamp, bench,
  mat, metal, emissive, surface, car, solarPanel,
} from '../../src/lib/index.js';
import { bigSign, bus, bollards } from './parts.js';

// 2x1 tiles (20 x 10 m). A road runs north-south (along Z) through the middle;
// the office block bridges over it on two concrete stair/lift cores. Front = +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  const concrete = mat(PALETTE.concrete);
  const concreteDark = mat(PALETTE.concreteDark);
  const white = mat(PALETTE.white);

  // --- road under the bridge -------------------------------------------------
  const roadW = 7.2;
  g.add(place(patch(roadW, 10, 'asphalt'), { y: y0 }));
  const lineM = mat(PALETTE.white);
  for (let z = -4.25; z < 5; z += 2.5) g.add(place(box(0.15, 0.02, 1.4, lineM), { y: y0 + 0.05, z })); // dashed centre
  for (const x of [-roadW / 2 + 0.3, roadW / 2 - 0.3]) g.add(place(box(0.12, 0.02, 10, lineM), { x, y: y0 + 0.05 }));
  for (const x of [-roadW / 2 - 0.1, roadW / 2 + 0.1]) g.add(place(box(0.2, 0.18, 10, concreteDark), { x, y: y0 })); // kerbs
  // zebra crossing in front of the bridge
  for (let i = 0; i < 6; i++) g.add(place(box(0.55, 0.02, 1.4, lineM), { x: -2.75 + i * 1.1, y: y0 + 0.06, z: 4.25 }));

  // traffic: bus heading north, car heading south, taxi behind it
  g.add(place(bus({ color: PALETTE.red }), { x: 1.75, y: y0 + 0.05, z: -0.4, ry: 90 }));
  g.add(place(car({ color: PALETTE.blue }), { x: -1.75, y: y0 + 0.05, z: 1.9, ry: -90 }));
  g.add(place(car({ kind: 'taxi' }), { x: -1.75, y: y0 + 0.05, z: -2.9, ry: -90 }));

  // --- structure dimensions -------------------------------------------------
  const zc = -0.6;                 // block / core centre line (front strip left for a plaza)
  const coreW = 3.4, coreD = 4.6, coreX = 6.7;
  const deckY = y0 + 5.6;          // underside of the bridge (5.6 m clearance)
  const deckH = 0.9;
  const blockY = deckY + deckH;
  const floorH = 3.2, floors = 3;
  const blockW = 19.6, blockD = 7.6;
  const roofY = blockY + floors * floorH;
  const coreTop = roofY + 3.0;
  const glassLift = mat(PALETTE.glassSky, { roughness: 0.15, metalness: 0.4 });

  // --- two slim concrete cores (stairs + lifts) that carry the block ---------
  for (const s of [-1, 1]) {
    const x = s * coreX;
    g.add(place(facadeBlock({
      w: coreW, d: coreD, h: coreTop - y0, floorHeight: (coreTop - y0) / 6, bay: 3.4,
      style: 'punched', wall: PALETTE.concrete, glass: PALETTE.glassDark, frame: PALETTE.concreteDark,
      windowW: 0.16, windowH: 0.6, lit: 0.2, seed: 30 + s, roof: PALETTE.concreteDark,
    }), { x, y: y0, z: zc }));
    // glass lift shaft on the road side of each core, ground to roof overrun
    const lx = x - s * (coreW / 2 + 0.25);
    g.add(place(box(0.5, deckY - y0, 1.8, glassLift), { x: lx, y: y0, z: zc }));
    g.add(place(box(0.5, coreTop - roofY - 0.7, 1.8, glassLift), { x: lx, y: roofY + 0.4, z: zc }));
    g.add(place(box(0.35, 2.2, 1.4, mat(PALETTE.yellow)), { x: lx, y: y0 + 2.4, z: zc }));
    // glazed lobby vestibule at the foot of the core facing the plaza, door + canopy
    const vz = zc + coreD / 2 + 0.6;
    g.add(place(box(coreW - 0.4, 2.9, 1.2, mat(PALETTE.glassBlue, { roughness: 0.15, metalness: 0.4 })), { x, y: y0, z: vz }));
    g.add(place(box(1.3, 2.3, 0.1, mat(PALETTE.glassDark)), { x, y: y0, z: vz + 0.62 }));
    g.add(place(box(coreW + 0.2, 0.18, 2.2, metal(PALETTE.steelLight)), { x, y: y0 + 2.9, z: vz + 0.4 }));
    // core cap + plant louvres above the roof
    g.add(place(box(coreW + 0.3, 0.3, coreD + 0.3, concreteDark), { x, y: coreTop, z: zc }));
    g.add(place(box(coreW - 0.8, 1.0, 0.08, surface('corrugated', PALETTE.steelDark, { size: 0.6 })), { x, y: roofY + 1.3, z: zc + coreD / 2 + 0.02 }));
    // under-bridge wall lamps on the road faces
    for (const dz of [-1.6, 1.6]) g.add(place(box(0.12, 0.3, 0.5, emissive(PALETTE.windowLit, 0.9)), { x: x - s * (coreW / 2 + 0.05), y: y0 + 4.0, z: zc + dz }));
  }

  // --- bridge deck with clearance fascia --------------------------------------
  g.add(place(box(blockW, deckH, blockD + 0.2, concrete), { y: deckY, z: zc }));
  const hazard = surface('hazard', PALETTE.yellow, { size: 1 });
  for (const sz of [-1, 1]) g.add(place(box(roadW + 0.4, 0.35, 0.06, hazard), { y: deckY, z: zc + sz * (blockD / 2 + 0.13) }));
  // clearance plates (red ring) over the road, front and back
  const plate = { text: '5.5m', w: 0.95, h: 0.62, bg: '#ffffff', fg: '#202020', border: PALETTE.red, depth: 0.08 };
  g.add(place(sign(plate), { x: -1.75, y: deckY + 0.36, z: zc + blockD / 2 + 0.15 }));
  g.add(place(sign(plate), { x: 1.75, y: deckY + 0.36, z: zc - blockD / 2 - 0.15, ry: 180 }));
  // lit soffit panels under the whole span
  for (let i = -1; i <= 1; i++) g.add(place(box(blockW - 1, 0.06, 0.6, emissive('#fff2c4', 0.9)), { y: deckY - 0.06, z: zc + i * 2.4 }));

  // --- the office block ----------------------------------------------------
  g.add(place(facadeBlock({
    w: blockW, d: blockD, floors, floorHeight: floorH, bay: 2.0,
    style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.white, lit: 0.08, seed: 9, roof: PALETTE.concreteDark,
  }), { y: blockY, z: zc }));
  // white floor-slab bands
  for (let f = 1; f < floors; f++) g.add(place(box(blockW + 0.2, 0.3, blockD + 0.2, white), { y: blockY + f * floorH - 0.15, z: zc }));
  g.add(place(box(blockW + 0.3, 0.45, blockD + 0.3, white), { y: roofY - 0.1, z: zc }));
  // vertical sunshade fins over the road span (front + back)
  const finM = metal(PALETTE.steelLight);
  for (const sz of [-1, 1]) for (let i = 0; i < 8; i++) {
    g.add(place(box(0.12, floors * floorH - 0.4, 0.5, finM), { x: -3.85 + i * 1.1, y: blockY + 0.2, z: zc + sz * (blockD / 2 + 0.3) }));
  }

  // --- roof -----------------------------------------------------------------
  const roofTop = roofY + 0.35;
  g.add(place(parapet({ w: blockW + 0.3, d: blockD + 0.3, h: 0.7, t: 0.25, material: white }), { y: roofTop, z: zc }));
  g.add(place(rooftopUnits({ w: 5, d: 4, count: 3, seed: 12 }), { y: roofTop, z: zc - 0.8 }));
  for (let i = 0; i < 3; i++) g.add(place(solarPanel({ w: 2.4, d: 1.3, tilt: 25, height: 0.4 }), { x: -2.4 + i * 2.4, y: roofTop, z: zc - 2.4 }));
  // rooftop name sign on a steel frame, front and back
  const frameM = metal(PALETTE.steelDark);
  for (const sz of [-1, 1]) {
    for (const x of [-3, 3]) g.add(place(box(0.15, 1.0, 0.15, frameM), { x, y: roofTop, z: zc + sz * 3.0 }));
    g.add(place(bigSign({ text: 'BRIDGE HOUSE', w: 7.6, h: 1.4, bg: PALETTE.navy, fg: '#ffffff', border: '#9fd8ff' }), { y: roofTop + 1.0, z: zc + sz * 3.0, ry: sz > 0 ? 0 : 180 }));
  }
  // small roof garden between the sign and the cores
  for (const s of [-1, 1]) {
    g.add(place(box(1.0, 0.4, 3.6, mat(PALETTE.stoneDark)), { x: s * 4.2, y: roofTop, z: zc + 0.4 }));
    for (const dz of [-1, 0.2, 1.4]) g.add(place(tree({ kind: 'bush', h: 0.9, seed: 60 + s * 3 + dz * 5 }), { x: s * 4.2, y: roofTop + 0.4, z: zc + 0.4 + dz }));
  }
  g.add(place(antenna({ h: 5 }), { x: coreX + 0.8, y: coreTop + 0.3, z: zc - 1.2 }));

  // --- plaza in front of the cores, bikes + hedges behind ---------------------
  const pz = 4.15;
  for (const s of [-1, 1]) {
    const x = s * coreX;
    g.add(place(patch(5.6, 1.5, 'cobbles'), { x: x + s * 0.3, y: y0, z: pz }));
    g.add(place(box(1.3, 0.5, 1.1, mat(PALETTE.stoneDark)), { x: x + s * 2.0, y: y0, z: pz }));
    g.add(place(tree({ kind: 'round', h: 3.6, seed: 40 + s }), { x: x + s * 2.0, y: y0 + 0.5, z: pz }));
    g.add(place(bench({ w: 1.4 }), { x: x - s * 0.2, y: y0, z: pz + 0.3, ry: 180 }));
    g.add(place(streetLamp({ h: 4.5 }), { x: s * (roadW / 2 + 0.5), y: y0, z: pz + 0.3, ry: s > 0 ? 180 : 0 }));
    g.add(place(bollards({ n: 3, spacing: 0.9, material: mat(PALETTE.darkGrey) }), { x: s * (roadW / 2 + 0.5), y: y0, z: 1.5, ry: 90 }));
    // bike racks behind the core, hedge along the back edge
    for (let i = 0; i < 3; i++) g.add(place(box(0.08, 0.7, 1.4, metal(PALETTE.steelLight)), { x: x - 1 + i * 1.0, y: y0, z: -3.8 }));
    g.add(place(box(4.8, 0.8, 0.5, mat(PALETTE.foliageDark)), { x: x + s * 0.6, y: y0, z: -4.7 }));
    // planter with a small tree in the cantilever shade at the outer end
    g.add(place(box(1.0, 0.45, 2.6, mat(PALETTE.stoneDark)), { x: s * 9.3, y: y0, z: zc }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 50 + s }), { x: s * 9.3, y: y0 + 0.45, z: zc }));
  }
  return g;
}

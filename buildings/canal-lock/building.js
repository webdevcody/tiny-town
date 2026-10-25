import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, extrude, place, mat, surface, water, field,
  facadeBlock, gableRoof, chimney, door, windowPanel, tree, fence, bench, streetLamp, cylinder,
} from '../../src/lib/index.js';
import { boardSign, gateLeaf, gateLeaks, narrowboat, washingLine, bollard, lifebuoyPost } from './parts.js';

// 2x1 tiles (20 x 10 m). The canal runs along x; the lock-keeper's bank is at the back (-z),
// the towpath at the front (+z). Water flows from the upper pound (-x) down to the lower pound (+x).
const Y0 = LOT_HEIGHT;
const BANK = 1.5;              // height of the canal banks above the canal bed
const TOP = Y0 + BANK;         // bank / coping level
const C0 = -0.7, C1 = 2.7;     // channel walls (z)
const ZC = (C0 + C1) / 2;
const WATER_HI = TOP - 0.3;    // upper pound
const WATER_LO = Y0 + 0.45;    // chamber + lower pound
const GX_UP = -3.5, GX_LO = 6.0, MITRE = 0.55; // gate hinge lines; mitres point upstream (-x)

// Grass embankment running the full length of the lot; profile = [[z, y]...].
function embankment(profile, top, ends) {
  const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: 20, bevelEnabled: false });
  const m = new THREE.Mesh(geo, [ends, top]);
  m.rotation.y = Math.PI / 2;
  m.position.x = -10;
  return m;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // --- banks with dressed-stone channel walls -------------------------------------------
  const stone = surface('brick', PALETTE.stone, { size: 2.2, color2: PALETTE.stoneDark });
  const grass = surface('grass', PALETTE.grass, { size: 4 });
  const earth = mat(PALETTE.dirt);
  const WT = 0.35; // channel wall thickness
  g.add(embankment([[-5, Y0], [-4.6, TOP], [C0 - WT, TOP], [C0 - WT, Y0]], grass, earth));
  g.add(embankment([[C1 + WT, Y0], [C1 + WT, TOP], [4.25, TOP], [5, Y0]], grass, earth));
  g.add(place(boxFaces(20, BANK, WT, { sides: stone, top: grass }), { y: Y0, z: C0 - WT / 2 }));
  g.add(place(boxFaces(20, BANK, WT, { sides: stone, top: grass }), { y: Y0, z: C1 + WT / 2 }));

  // coping stones along both edges, slightly proud of the wall
  const coping = mat('#cfc8b8');
  for (const [z, s] of [[C0, -1], [C1, 1]]) {
    g.add(place(box(20, 0.12, 0.6, coping), { y: TOP, z: z + s * 0.25 }));
    for (let x = -9; x <= 9; x += 2) g.add(place(box(0.03, 0.13, 0.6, mat(PALETTE.stoneDark)), { x, y: TOP, z: z + s * 0.25 }));
  }

  // --- water ------------------------------------------------------------------------------
  const waterM = water(PALETTE.water);
  const upper = [[-10, C0], [GX_UP, C0], [GX_UP - MITRE, ZC], [GX_UP, C1], [-10, C1]];
  g.add(place(extrude(upper, WATER_HI - Y0, waterM), { y: Y0 }));
  const lowStart = GX_UP - MITRE - 0.1;
  g.add(place(box(10 - lowStart, WATER_LO - Y0, C1 - C0, water(PALETTE.waterDeep)), { x: (10 + lowStart) / 2, y: Y0, z: ZC }));
  // wet, mossy band on the chamber walls just above the water line
  const moss = mat('#4f5f45');
  g.add(place(box(10 - lowStart, 0.25, 0.04, moss), { x: (10 + lowStart) / 2, y: WATER_LO, z: C0 + 0.02 }));
  g.add(place(box(10 - lowStart, 0.25, 0.04, moss), { x: (10 + lowStart) / 2, y: WATER_LO, z: C1 - 0.02 }));

  // --- gates: two pairs of mitre gates with balance beams ---------------------------------
  const gateTop = TOP + 0.75;
  for (const gx of [GX_UP, GX_LO]) {
    const apex = [gx - MITRE, ZC];
    g.add(gateLeaf({ hinge: [gx, C0 + 0.05], apex, bottom: Y0, top: gateTop, groundY: TOP, beamLen: 3.0 }));
    g.add(gateLeaf({ hinge: [gx, C1 - 0.05], apex, bottom: Y0, top: gateTop, groundY: TOP, beamLen: 2.0 }));
    // stone gate recesses (quoins) either side
    for (const z of [C0 - 0.1, C1 + 0.1]) g.add(place(box(0.9, 0.16, 0.5, mat(PALETTE.stoneDark)), { x: gx + 0.1, y: TOP, z }));
  }
  // water spilling through the upper gates into the chamber
  for (const z of [C0 + 0.05, C1 - 0.05]) g.add(gateLeaks({ hinge: [GX_UP, z], apex: [GX_UP - MITRE, ZC], from: WATER_LO, to: WATER_HI - 0.05 }));

  // ground paddle gear on both banks above the top gates
  const black = mat('#242220');
  for (const z of [C0 - 0.75, C1 + 0.75]) {
    g.add(place(box(0.35, 0.75, 0.35, black), { x: GX_UP - 1.4, y: TOP, z }));
    g.add(place(cylinder(0.06, 0.06, 0.3, mat(PALETTE.steelLight), 6), { x: GX_UP - 1.4, y: TOP + 0.75, z }));
    g.add(place(box(0.08, 0.08, 0.6, black), { x: GX_UP - 1.4, y: TOP + 0.6, z }));
  }

  // --- narrowboat waiting in the chamber ---------------------------------------------------
  g.add(place(narrowboat({ len: 8.2, w: 1.9, name: 'ROSIE' }), { x: 1.0, y: WATER_LO - 0.3, z: ZC }));

  // --- back bank: lock-keeper's cottage and garden ----------------------------------------
  const gravel = surface('gravel', PALETTE.gravel, { size: 3 });
  g.add(place(box(14.4, 0.04, 0.9, gravel), { x: 2.8, y: TOP, z: C0 - 1.0 }));
  g.add(place(box(5.6, 0.04, 0.75, surface('cobbles', PALETTE.stone, { size: 2 })), { x: -7.2, y: TOP, z: C0 - 0.92 }));

  const cx = -7.2, cz = -3.15, cw = 4.8, cd = 2.6;
  const wallC = { style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.55, bay: 1.6, seed: 7, lit: 0.1, roof: PALETTE.roofSlate };
  const floorH = 2.7;
  g.add(place(facadeBlock({ w: cw, d: cd, floors: 2, floorHeight: floorH, ...wallC, blank: ['front'] }), { x: cx, y: TOP, z: cz }));
  const slate = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
  g.add(place(gableRoof({ w: cw, d: cd, h: 1.9, overhang: 0.35, ridge: 'x', material: slate, gableMaterial: mat(PALETTE.brick) }), { x: cx, y: TOP + 2 * floorH, z: cz }));
  g.add(place(chimney({ w: 0.6, h: 1.6 }), { x: cx - cw / 2 + 0.5, y: TOP + 2 * floorH + 0.6, z: cz }));
  g.add(place(chimney({ w: 0.6, h: 1.6 }), { x: cx + cw / 2 - 0.5, y: TOP + 2 * floorH + 0.6, z: cz }));
  // canal-side front: door with a little porch, sash windows, white string course
  const fz = cz + cd / 2;
  g.add(place(door({ w: 0.95, h: 2.0, color: '#1f5c3c', frame: PALETTE.white }), { x: cx, y: TOP, z: fz }));
  g.add(place(box(1.6, 0.12, 0.8, mat(PALETTE.roofSlate)), { x: cx, y: TOP + 2.25, z: fz + 0.4, rx: 8 }));
  for (const x of [cx - 1.55, cx + 1.55]) g.add(place(windowPanel({ w: 0.85, h: 1.1 }), { x, y: TOP + 0.8, z: fz }));
  for (const x of [cx - 1.3, cx, cx + 1.3]) g.add(place(windowPanel({ w: 0.75, h: 0.95, lit: x === cx }), { x, y: TOP + floorH + 0.7, z: fz }));
  g.add(place(box(cw + 0.04, 0.12, 0.06, mat(PALETTE.cream)), { x: cx, y: TOP + floorH - 0.1, z: fz + 0.02 }));
  // cottage name board above the door (old canal company style)
  g.add(place(boardSign('LOCK 7', 1.5, 0.42, { bg: PALETTE.white, fg: PALETTE.black, border: PALETTE.black }), { x: cx, y: TOP + 2.45, z: fz + 0.05 }));
  // flower tubs either side of the door
  for (const [x, c] of [[cx - 0.85, '#d8458a'], [cx + 0.85, '#f2b632']]) {
    g.add(place(cylinder(0.25, 0.2, 0.35, mat(PALETTE.terracotta), 8), { x, y: TOP, z: fz + 0.35 }));
    g.add(place(tree({ kind: 'bush', h: 0.6, seed: 2, color: c }), { x, y: TOP + 0.3, z: fz + 0.35 }));
  }

  // vegetable garden, washing line, picket fence, shed and trees behind the lock
  g.add(place(box(3.6, 0.05, 1.8, field('cabbage', { size: 2 })), { x: 1.4, y: TOP, z: -3.75 }));
  g.add(place(fence({ w: 8.4, d: 0.1, h: 0.75, style: 'picket', sides: ['front'] }), { x: 0.6, y: TOP, z: -2.55 }));
  g.add(place(washingLine(2.4), { x: -2.4, y: TOP, z: -4.2 }));
  g.add(place(box(1.8, 1.7, 1.4, surface('planks', PALETTE.wood, { size: 1 })), { x: 8.6, y: TOP, z: -4.0 }));
  g.add(place(gableRoof({ w: 1.8, d: 1.4, h: 0.5, overhang: 0.15, ridge: 'x', material: mat(PALETTE.roofGreen), gableMaterial: mat(PALETTE.wood) }), { x: 8.6, y: TOP + 1.7, z: -4.0 }));
  g.add(place(door({ w: 0.6, h: 1.4, color: PALETTE.woodDark }), { x: 8.6, y: TOP, z: -3.3 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 12 }), { x: 4.4, y: TOP, z: -3.7 }));
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 8 }), { x: -4.2, y: TOP, z: -4.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: -4.3, y: TOP, z: -2.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 10 }), { x: 9.5, y: TOP, z: -2.6 }));
  g.add(place(bench({ w: 1.5 }), { x: 8.4, y: TOP, z: -2.2 }));
  g.add(place(streetLamp({ h: 3.4 }), { x: -1.4, y: TOP, z: -2.0 }));

  // --- front towpath -----------------------------------------------------------------------
  g.add(place(box(20, 0.04, 0.95, gravel), { y: TOP, z: C1 + 1.05 }));
  for (const x of [-8.2, -2.6, 3.4, 8.6]) g.add(place(bollard(), { x, y: TOP, z: C1 + 0.75 }));
  g.add(place(lifebuoyPost(), { x: 1.0, y: TOP, z: 4.0 }));
  g.add(place(bench({ w: 1.5 }), { x: -6.6, y: TOP, z: 4.0, ry: 180 }));
  g.add(place(streetLamp({ h: 3.4 }), { x: -4.4, y: TOP, z: 4.0, ry: 90 }));
  // fingerpost / mile marker
  g.add(place(box(0.14, 1.5, 0.14, mat(PALETTE.white)), { x: 9.3, y: TOP, z: 4.0 }));
  g.add(place(boardSign('TOWPATH', 1.2, 0.3, { bg: PALETTE.white, fg: PALETTE.black, double: true }), { x: 9.3, y: TOP + 1.15, z: 4.0, ry: 90 }));
  for (const [x, seed] of [[-9.4, 21], [5.0, 22], [-4.2, 23]]) g.add(place(tree({ kind: 'bush', h: 0.8, seed }), { x, y: TOP, z: 4.0 }));
  return g;
}

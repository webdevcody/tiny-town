import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, box, boxFaces, extrude, place, parapet, mat, metal, glass, emissive, water, surface,
  tree, car, fence, streetLamp, bench, flag, door, rooftopUnits, antenna, shade,
} from '../../src/lib/index.js';
import { shell, bigSign, sectorGate } from './parts.js';

// 3x1 tiles (30 x 10 m). The river runs along Z (north -> south) through the
// middle; the barrier spans it along X: five concrete piers capped with
// layered stainless-steel hoods, with four rotating sector gates between them.
const HALF_W = (3 * TILE) / 2;   // 15
const HALF_D = TILE / 2;         // 5
const BANK = 9.6;                // river banks at x = +-9.6
const WATER_TOP = 0.5;
const BANK_TOP = 2.05;
const DECK = 3.4;                // top of the concrete piers
const PIVOT = 1.7;               // gate rotation axis height
const PIER_W = 1.6, PIER_L = 6.4;
const PIERS = [-10.2, -5.1, 0, 5.1, 10.2];
// gate states, west to east: two closed, one swinging, one raised for maintenance
const GATE_ANGLES = [0, 0, 40, 90];

const chromeM = mat('#eef3f7', { metalness: 0.35, roughness: 0.25 });
const chrome2M = mat('#d9e1e8', { metalness: 0.4, roughness: 0.2 });
const seamM = metal(PALETTE.steelDark);
const concreteM = surface('concrete', PALETTE.concrete, { size: 3 });
const concreteDarkM = mat(PALETTE.concreteDark);

function pier(isAbutment) {
  const g = new THREE.Group();
  const hw = PIER_W / 2, hl = PIER_L / 2;
  // pointed cutwater ends up- and downstream
  const outline = [[-hw, -hl + 0.7], [0, -hl], [hw, -hl + 0.7], [hw, hl - 0.7], [0, hl], [-hw, hl - 0.7]];
  g.add(place(extrude(outline, 0.5, concreteDarkM), { y: LOT_HEIGHT }));                 // dark waterline band
  g.add(place(extrude(outline, DECK - LOT_HEIGHT - 0.5, concreteM), { y: LOT_HEIGHT + 0.5 }));
  // deck slab with a slight overhang + railing
  const deck = [[-hw - 0.15, -hl + 0.6], [0, -hl - 0.15], [hw + 0.15, -hl + 0.6], [hw + 0.15, hl - 0.6], [0, hl + 0.15], [-hw - 0.15, hl - 0.6]];
  g.add(place(extrude(deck, 0.2, mat(PALETTE.concrete)), { y: DECK }));
  const y = DECK + 0.2;
  // stacked stainless shells: each one shorter and taller than the last
  g.add(place(box(PIER_W - 0.1, 0.25, PIER_L - 1.9, seamM), { y }));
  g.add(place(shell({ L: PIER_L - 0.6, hw: 0.82, hh: 2.3, material: chromeM }), { y: y + 0.2 }));
  g.add(place(shell({ L: PIER_L - 2.0, hw: 0.7, hh: 3.3, material: chrome2M }), { y: y + 0.2, z: -0.35 }));
  g.add(place(shell({ L: PIER_L - 3.5, hw: 0.54, hh: 4.1, material: chromeM }), { y: y + 0.2, z: -0.7 }));
  // ridge cap + aircraft warning light on top
  g.add(place(box(0.12, 0.25, 0.12, seamM), { y: y + 0.2 + 4.1 - 0.15, z: -0.7 }));
  g.add(place(box(0.18, 0.18, 0.18, emissive('#ff3a2a', 1.2)), { y: y + 0.2 + 4.2, z: -0.7 }));
  // service doors in the hood base, both ends
  for (const s of [-1, 1]) {
    g.add(place(box(0.5, 0.85, 0.05, mat(PALETTE.navy)), { y, z: s * (hl - 0.75) }));
  }
  // navigation lights on the cutwaters: green upstream, red downstream
  if (!isAbutment) {
    g.add(place(box(0.25, 0.25, 0.25, emissive('#3aff6a', 1.1)), { y: DECK - 0.35, z: -hl - 0.05 }));
    g.add(place(box(0.25, 0.25, 0.25, emissive('#ff3a2a', 1.1)), { y: DECK - 0.35, z: hl + 0.05 }));
    // black and white tide gauge on the upstream nose
    for (let i = 0; i < 4; i++) {
      g.add(place(box(0.18, 0.4, 0.06, mat(i % 2 ? PALETTE.white : PALETTE.black)), { x: 0.42, y: WATER_TOP + i * 0.4, z: -hl + 0.24, ry: 40 }));
    }
  }
  return g;
}

function tug() {
  const g = new THREE.Group();
  const hullM = mat(PALETTE.red);
  g.add(extrude([[-0.6, -1.2], [0.6, -1.2], [0.6, 0.7], [0, 1.25], [-0.6, 0.7]], 0.45, hullM, mat(PALETTE.woodDark)));
  g.add(place(box(1.24, 0.12, 2.5, mat(PALETTE.black)), { y: -0.02, z: -0.05 }));
  g.add(place(box(0.9, 0.7, 0.9, mat(PALETTE.white)), { y: 0.45, z: -0.1 }));
  g.add(place(box(0.92, 0.2, 0.6, mat(PALETTE.glassDark)), { y: 0.85, z: 0.05 }));
  g.add(place(box(0.95, 0.08, 0.95, mat(PALETTE.navy)), { y: 1.15, z: -0.1 }));
  g.add(place(box(0.25, 0.55, 0.25, mat(PALETTE.black)), { y: 1.15, z: -0.4 }));
  g.add(place(box(0.25, 0.12, 0.26, mat(PALETTE.red)), { y: 1.5, z: -0.4 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 1], 'dirt'));
  const y0 = LOT_HEIGHT;

  // ---- river + banks
  g.add(place(box(BANK * 2, WATER_TOP - y0, HALF_D * 2, water(PALETTE.water)), { y: y0 }));
  const bankW = HALF_W - BANK;
  for (const s of [-1, 1]) {
    const earth = mat(shade(PALETTE.dirt, -0.1));
    g.add(place(boxFaces(bankW, BANK_TOP - y0, HALF_D * 2, {
      sides: earth, top: surface('grass', PALETTE.grass, { size: 4 }),
      [s < 0 ? 'right' : 'left']: concreteM,
    }), { x: s * (BANK + bankW / 2), y: y0 }));
    // concrete quay coping + railings along the river edge
    g.add(place(box(0.5, 0.15, HALF_D * 2, mat(PALETTE.concrete)), { x: s * (BANK + 0.25), y: BANK_TOP }));
    for (const [z0, z1] of [[-HALF_D + 0.1, -PIER_L / 2 - 0.1], [PIER_L / 2 + 0.1, HALF_D - 0.1]]) {
      g.add(place(fence({ w: z1 - z0, d: 0.1, h: 0.9, style: 'railing', color: PALETTE.navy, sides: ['front'] }), { x: s * (BANK + 0.2), y: BANK_TOP + 0.15, z: (z0 + z1) / 2, ry: 90 }));
    }
  }

  // ---- piers with their hoods
  PIERS.forEach((x, i) => g.add(place(pier(i === 0 || i === PIERS.length - 1), { x })));

  // ---- rotating sector gates between the piers
  for (let i = 0; i < PIERS.length - 1; i++) {
    const span = PIERS[i + 1] - PIERS[i] - PIER_W;
    const x = (PIERS[i] + PIERS[i + 1]) / 2;
    g.add(place(sectorGate({ span, R: 2.1, angle: GATE_ANGLES[i] }), { x, y: PIVOT }));
  }
  // the raised span is open: a tug comes through downstream
  g.add(place(tug(), { x: 7.65, y: WATER_TOP - 0.05, z: 3.7 }));
  // wake + a channel buoy upstream
  g.add(place(box(0.7, 0.03, 1.2, mat('#d8f2ff', { transparent: true, opacity: 0.8 })), { x: 7.65, y: WATER_TOP, z: 2.3 }));
  g.add(place(box(0.4, 0.6, 0.4, mat(PALETTE.yellow)), { x: -2.55, y: WATER_TOP - 0.05, z: -4.2 }));
  g.add(place(box(0.12, 0.35, 0.12, mat(PALETTE.black)), { x: -2.55, y: WATER_TOP + 0.55, z: -4.2 }));

  // ---- west bank: control building with glazed operations room on top
  const by = BANK_TOP;
  const cx = -12.7, cz = -1.6, cw = 4.0, cd = 4.6;
  g.add(place(facadeBlock({ w: cw, d: cd, floors: 2, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, bay: 1.4, lit: 0.2, seed: 7, roof: PALETTE.concreteDark }), { x: cx, y: by, z: cz }));
  g.add(place(parapet({ w: cw, d: cd, h: 0.35, material: mat(PALETTE.steelLight) }), { x: cx, y: by + 6, z: cz }));
  g.add(place(box(2.6, 1.7, 2.6, glass(PALETTE.glassSky)), { x: cx + 0.3, y: by + 6, z: cz + 0.4 }));
  g.add(place(box(3.2, 0.25, 3.2, chromeM), { x: cx + 0.3, y: by + 7.7, z: cz + 0.4 }));
  g.add(place(antenna({ h: 3, light: true }), { x: cx - 1.3, y: by + 6, z: cz - 1.5 }));
  g.add(place(rooftopUnits({ w: 1.2, d: 1.2, count: 1, seed: 3 }), { x: cx - 1.2, y: by + 6, z: cz + 1.4 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.navy }), { x: cx + 0.6, y: by, z: cz + cd / 2 }));
  g.add(place(box(1.8, 0.12, 1.0, mat(PALETTE.navy)), { x: cx + 0.6, y: by + 2.5, z: cz + cd / 2 + 0.5 }));
  g.add(place(bigSign({ text: 'FLOOD BARRIER', w: 3.8, h: 0.6, bg: PALETTE.navy, fg: '#ffffff' }), { x: cx, y: by + 2.85, z: cz + cd / 2 + 0.02 }));
  // forecourt: one staff car, lamp, flag
  g.add(place(patch(bankW - 0.6, 2.4, 'asphalt'), { x: -12.6, y: by, z: 3.6 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: -12.6, y: by + 0.05, z: 3.6, s: 0.75 }));
  g.add(place(streetLamp({ h: 4 }), { x: -10.3, y: by, z: 4.4, ry: 180 }));
  g.add(place(flag({ h: 5.5, color: PALETTE.navy, color2: PALETTE.white }), { x: -14.5, y: by, z: 1.4 }));
  g.add(place(tree({ kind: 'cone', h: 4, seed: 12 }), { x: -14.0, y: by, z: -3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: -10.5, y: by, z: -4.3 }));

  // ---- east bank: switch-gear kiosk, riverside walk, trees, bench
  g.add(place(patch(1.4, HALF_D * 2, 'paved'), { x: 11.0, y: by }));
  g.add(place(boxFaces(2.2, 1.8, 2.8, { sides: mat(PALETTE.lightGrey), top: mat(PALETTE.steelDark) }), { x: 13.4, y: by, z: -2.6 }));
  g.add(place(box(0.9, 0.35, 0.05, surface('hazard', PALETTE.yellow, { size: 0.5 })), { x: 13.4, y: by + 1.2, z: -1.2 }));
  g.add(place(fence({ w: 3.0, d: 3.6, h: 1.1, style: 'wire', sides: ['front', 'right', 'left', 'back'] }), { x: 13.4, y: by, z: -2.6 }));
  g.add(place(bench({ w: 1.4 }), { x: 11.9, y: by, z: 2.0, ry: -90 }));
  g.add(place(streetLamp({ h: 4 }), { x: 10.2, y: by, z: -4.4 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 21 }), { x: 13.2, y: by, z: 2.9 }));
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 22 }), { x: 13.7, y: by, z: 0.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 23 }), { x: 12.4, y: by, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 24 }), { x: 14.4, y: by, z: -4.5 }));
  // info board for visitors
  g.add(place(box(0.08, 1.0, 0.08, metal(PALETTE.darkGrey)), { x: 11.9, y: by, z: 4.2 }));
  g.add(place(bigSign({ text: 'BARRIER', w: 1.2, h: 0.5, bg: PALETTE.blue, fg: '#ffffff', d: 0.06 }), { x: 11.9, y: by + 1.0, z: 4.2, ry: -90 }));
  return g;
}

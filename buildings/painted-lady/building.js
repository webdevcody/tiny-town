import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, gableRoof, chimney, door, box, cylinder, cone, sphere, place, beam,
  stairs, fence, hedge, tree, bench, surface, field, mat, metal, emissive, textured,
} from '../../src/lib/index.js';
import { windowTexture, sidingTexture, fishScale, cladBox, cladPrism, octagon, grow, sashWindow } from './vic.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Tall, narrow three-storey Queen Anne "painted lady": pink clapboard body with a
// steep front gable, mint corner turret with a witch-hat roof, a canted bay window,
// a stoop with a spindle-trimmed porch, and a wrought-iron front railing.

const BODY = '#e3a2c6';
const TURRET = '#9fd6bd';
const SCALES = '#f1cf72';
const TRIM = '#fbf6ea';
const ACCENT = '#7a3b72';
const TEAL = '#2f8584';
const GOLD = '#d9b23c';

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const y0 = LOT_HEIGHT;
  const PL = 1.2; // raised basement / plinth
  const FH = 2.8; // storey height
  const NF = 3;
  const yW = y0 + PL; // first floor level
  const EAVE = yW + NF * FH;

  // body footprint
  const BX = 0.5, BW = 6.2, BZ = -0.5, BD = 6.0;
  const xL = BX - BW / 2, xR = BX + BW / 2, zF = BZ + BD / 2, zB = BZ - BD / 2;
  const RH = 4.4, OV = 0.35; // roof height, overhang

  const trimM = mat(TRIM);
  const accentM = mat(ACCENT);
  const goldM = metal(GOLD, { roughness: 0.35 });
  const ironM = mat(PALETTE.black);
  const plinthM = surface('brick', '#8f857a', { size: 1.2 });
  const roofM = surface('shingles', '#4a4e63', { size: 1.6 });
  const bodyWin = textured(windowTexture({ wall: BODY, trim: TRIM, accent: ACCENT, glass: PALETTE.window, key: 'body' }));
  const bodySiding = textured(sidingTexture(BODY, 'body'));
  const turretWin = textured(windowTexture({ wall: TURRET, trim: TRIM, accent: TEAL, glass: PALETTE.window, key: 'turret' }));
  const scalesM = fishScale(SCALES, 0.9);
  const scalesTurretM = fishScale('#f0a989', 0.8);

  // ---------------------------------------------------------------- body
  g.add(place(box(BW + 0.1, PL, BD + 0.1, plinthM), { x: BX, y: y0, z: BZ }));
  g.add(place(cladBox(BW, NF * FH, BD, NF, 1.55, [bodyWin, bodyWin, accentM, accentM, bodySiding, bodyWin]), { x: BX, y: yW, z: BZ }));
  // belt courses at each floor line + water table
  for (let f = 0; f < NF; f++) {
    g.add(place(box(BW + 0.14, f === 0 ? 0.22 : 0.16, BD + 0.14, f === 0 ? accentM : trimM), { x: BX, y: yW + f * FH - 0.08, z: BZ }));
  }
  // corner boards
  for (const [x, z] of [[xR, zF], [xR, zB], [xL, zB]]) g.add(place(box(0.2, NF * FH, 0.2, trimM), { x, y: yW, z }));
  // frieze band under the eaves and the gables
  g.add(place(box(BW + 0.16, 0.4, BD + 0.16, accentM), { x: BX, y: EAVE - 0.4, z: BZ }));
  g.add(place(box(BW + 0.2, 0.08, BD + 0.2, trimM), { x: BX, y: EAVE - 0.46, z: BZ }));
  // eave brackets along both side walls
  for (const x of [xL - 0.12, xR + 0.12]) {
    for (let z = zB + 0.3; z <= zF - 0.2; z += 0.6) g.add(place(box(0.22, 0.32, 0.12, trimM), { x, y: EAVE - 0.38, z }));
  }

  // ---------------------------------------------------------------- roof
  g.add(place(gableRoof({ w: BW, d: BD, h: RH, overhang: OV, ridge: 'z', material: roofM, gableMaterial: scalesM }), { x: BX, y: EAVE, z: BZ }));
  const drop = (OV * RH) / (BW / 2);
  // gingerbread bargeboards, king post and collar on both gables
  for (const s of [1, -1]) {
    const z = s > 0 ? zF + OV - 0.06 : zB - OV + 0.06;
    const apex = [BX, EAVE + RH - 0.05, z];
    g.add(beam([xL - OV, EAVE - drop, z], apex, 0.2, trimM));
    g.add(beam([xR + OV, EAVE - drop, z], apex, 0.2, trimM));
    const zi = s > 0 ? zF + 0.06 : zB - 0.06;
    const cy = EAVE + RH * 0.45;
    const half = (BW / 2) * 0.55;
    g.add(beam([BX - half, cy, zi], [BX + half, cy, zi], 0.12, accentM));
    g.add(beam([BX, cy, zi], [BX, EAVE + RH - 0.2, zi], 0.12, accentM));
    g.add(beam([BX - half * 0.6, cy, zi], [BX, EAVE + RH * 0.8, zi], 0.09, accentM));
    g.add(beam([BX + half * 0.6, cy, zi], [BX, EAVE + RH * 0.8, zi], 0.09, accentM));
    // apex finial + drop pendant
    g.add(place(cylinder(0.05, 0.08, 1.0, goldM, 6), { x: BX, y: EAVE + RH, z: s > 0 ? zF + OV - 0.1 : zB - OV + 0.1 }));
    g.add(place(sphere(0.13, goldM, 8), { x: BX, y: EAVE + RH + 0.55, z: s > 0 ? zF + OV - 0.1 : zB - OV + 0.1 }));
    g.add(place(cylinder(0.1, 0.03, 0.6, trimM, 6), { x: BX, y: EAVE + RH - 0.75, z }));
  }
  // attic window in the front gable
  g.add(place(sashWindow({ w: 0.7, h: 1.0, trim: TRIM, accent: TEAL, glass: PALETTE.window }), { x: BX, y: EAVE + 0.55, z: zF }));
  // iron cresting along the ridge
  const ridgeY = EAVE + RH;
  g.add(place(box(0.04, 0.04, BD + 2 * OV - 0.4, ironM), { x: BX, y: ridgeY + 0.32, z: BZ }));
  for (let z = zB - OV + 0.3; z <= zF + OV - 0.3; z += 0.45) g.add(place(box(0.04, 0.45, 0.04, ironM), { x: BX, y: ridgeY - 0.05, z }));

  // side dormers
  for (const s of [1, -1]) {
    const face = s > 0 ? xR - 0.6 : xL + 0.6;
    const len = 1.4;
    const dx = face - (s * len) / 2;
    const dz = -1.6;
    const dh = (0.6 / (BW / 2)) * RH + 1.35;
    g.add(place(box(len, dh, 1.3, bodySiding), { x: dx, y: EAVE, z: dz }));
    g.add(place(gableRoof({ w: len, d: 1.3, h: 0.75, overhang: 0.15, ridge: 'x', material: roofM, gableMaterial: scalesM }), { x: dx, y: EAVE + dh, z: dz }));
    g.add(place(sashWindow({ w: 0.6, h: 0.85, trim: TRIM, accent: ACCENT, glass: PALETTE.window }), { x: face, y: EAVE + dh - 1.3, z: dz, ry: s * 90 }));
  }
  g.add(place(chimney({ w: 0.7, d: 0.9, h: 4.6, material: surface('brick', PALETTE.brick, { size: 1 }) }), { x: xR - 1.0, y: EAVE + 0.8, z: zB + 0.9 }));

  // ---------------------------------------------------------------- corner turret
  const TX = xL, TZ = zF, TR = 1.35;
  const oct = octagon(TR, TX, TZ);
  g.add(place(cladPrism(grow(oct, 0.05), PL, 1, 1, plinthM, plinthM), { y: y0 }));
  g.add(place(cladPrism(oct, NF * FH, NF, 1, turretWin, accentM), { y: yW }));
  for (let f = 0; f < NF; f++) {
    g.add(place(cladPrism(grow(oct, 0.08), 0.16, 1, 1, f === 0 ? accentM : trimM, f === 0 ? accentM : trimM), { y: yW + f * FH - 0.08 }));
  }
  // fish-scale belvedere band, cornice, witch-hat roof, finial
  const FR = 1.25;
  g.add(place(cladPrism(oct, FR, 1, 1, scalesTurretM, accentM), { y: EAVE }));
  g.add(place(cladPrism(grow(oct, 0.12), 0.3, 1, 1, accentM, accentM), { y: EAVE - 0.3 }));
  g.add(place(cladPrism(grow(oct, 0.25), 0.3, 1, 1, trimM, trimM), { y: EAVE + FR }));
  const coneY = EAVE + FR + 0.3;
  const coneH = 5.4;
  g.add(place(cone(TR + 0.4, coneH, roofM, 8), { x: TX, y: coneY, z: TZ, ry: 22.5 }));
  g.add(place(cylinder(0.04, 0.09, 1.4, goldM, 6), { x: TX, y: coneY + coneH - 0.2, z: TZ }));
  g.add(place(sphere(0.17, goldM, 8), { x: TX, y: coneY + coneH + 0.35, z: TZ }));

  // ---------------------------------------------------------------- canted bay window (floors 1-2)
  const bayPts = [[0.55, zF - 0.1], [3.45, zF - 0.1], [2.7, zF + 0.75], [1.3, zF + 0.75]];
  g.add(place(cladPrism(grow(bayPts, 0.05), PL, 1, 1, plinthM, plinthM), { y: y0 }));
  g.add(place(cladPrism(bayPts, 2 * FH, 2, 1.0, bodyWin, accentM), { y: yW }));
  g.add(place(cladPrism(grow(bayPts, 0.06), 0.16, 1, 1, trimM, trimM), { y: yW + FH - 0.08 }));
  g.add(place(cladPrism(grow(bayPts, 0.15), 0.4, 1, 1, accentM, accentM), { y: yW + 2 * FH - 0.1 }));
  g.add(place(cladPrism(grow(bayPts, 0.2), 0.08, 1, 1, trimM, mat('#5d5a66')), { y: yW + 2 * FH + 0.3 }));

  // explicit front windows (siding wall): above the door and on the top floor
  const win = (x, y) => g.add(place(sashWindow({ w: 0.8, h: 1.55, trim: TRIM, accent: ACCENT, glass: PALETTE.window }), { x, y, z: zF }));
  const DX = -0.35;
  win(DX, yW + FH + 0.65);
  win(DX, yW + 2 * FH + 0.65);
  win(1.4, yW + 2 * FH + 0.65);
  win(2.6, yW + 2 * FH + 0.65);

  // ---------------------------------------------------------------- stoop, porch & door
  const stepM = mat(PALETTE.offWhite);
  g.add(place(box(1.8, PL, 0.95, stepM), { x: DX, y: y0, z: zF + 0.47 }));
  const SD = 1.3;
  g.add(place(stairs({ w: 1.3, h: PL, d: SD, steps: 6, material: stepM }), { x: DX, y: y0, z: zF + 0.95 + SD / 2 }));
  for (const s of [-1, 1]) {
    const x = DX + s * 0.72;
    g.add(beam([x, yW + 0.85, zF + 0.95], [x, y0 + 0.85, zF + 0.95 + SD], 0.08, accentM));
    g.add(place(box(0.2, 1.05, 0.2, accentM), { x, y: y0, z: zF + 0.95 + SD - 0.1 }));
    g.add(place(sphere(0.12, trimM, 8), { x, y: y0 + 1.0, z: zF + 0.95 + SD - 0.1 }));
    for (let t = 0.2; t < 1; t += 0.2) {
      const bz = zF + 0.95 + SD * t;
      const by = yW - PL * t;
      g.add(place(box(0.05, 0.85, 0.05, trimM), { x, y: by, z: bz }));
    }
    // porch posts
    g.add(place(box(0.14, 2.6, 0.14, trimM), { x: DX + s * 0.78, y: yW, z: zF + 0.85 }));
    g.add(beam([DX + s * 0.78, yW + 2.15, zF + 0.85], [DX + s * 0.45, yW + 2.6, zF + 0.85], 0.08, trimM));
  }
  g.add(place(box(1.9, 0.16, 1.05, accentM), { x: DX, y: yW + 2.6, z: zF + 0.5 }));
  g.add(place(gableRoof({ w: 1.9, d: 1.05, h: 0.6, overhang: 0.1, ridge: 'z', material: roofM, gableMaterial: scalesM }), { x: DX, y: yW + 2.76, z: zF + 0.5 }));
  // spindle frieze
  for (let x = DX - 0.66; x <= DX + 0.67; x += 0.12) g.add(place(box(0.04, 0.26, 0.04, trimM), { x, y: yW + 2.34, z: zF + 0.85 }));
  g.add(place(box(1.5, 0.05, 0.06, trimM), { x: DX, y: yW + 2.32, z: zF + 0.85 }));
  // door with transom
  g.add(place(box(1.4, 2.95, 0.06, accentM), { x: DX, y: yW, z: zF + 0.02 }));
  g.add(place(door({ w: 0.95, h: 2.15, color: TEAL, frame: TRIM }), { x: DX, y: yW, z: zF }));
  g.add(place(box(0.95, 0.4, 0.1, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.25 })), { x: DX, y: yW + 2.3, z: zF + 0.05 }));
  g.add(place(sphere(0.06, goldM, 6), { x: DX + 0.3, y: yW + 1.0, z: zF + 0.16 }));

  // ---------------------------------------------------------------- front garden & railing
  const FZ = 4.8;
  const ironRail = (x0, x1) => g.add(place(fence({ w: x1 - x0, d: 0, h: 0.9, style: 'railing', color: PALETTE.black, sides: ['front'] }), { x: (x0 + x1) / 2, y: y0, z: FZ }));
  ironRail(-4.85, DX - 0.85);
  ironRail(DX + 0.85, 4.85);
  for (let x = -4.7; x < 4.8; x += 0.3) {
    if (Math.abs(x - DX) < 0.9) continue;
    g.add(place(cone(0.05, 0.15, ironM, 4), { x, y: y0 + 0.9, z: FZ }));
  }
  for (const x of [DX - 0.85, DX + 0.85]) {
    g.add(place(box(0.32, 1.15, 0.32, plinthM), { x, y: y0, z: FZ }));
    g.add(place(sphere(0.15, trimM, 8), { x, y: y0 + 1.12, z: FZ }));
  }
  g.add(place(patch(1.3, FZ - (zF + 0.95 + SD) + 0.2, 'paved'), { x: DX, y: y0, z: (zF + 0.95 + SD + FZ + 0.2) / 2 }));
  g.add(place(patch(3.2, 0.7, field('flowers', { size: 2 })), { x: -3.15, y: y0, z: 4.25 }));
  g.add(place(patch(1.5, 1.0, field('flowers', { size: 2 })), { x: 2.0, y: y0, z: 4.15 }));
  for (const [x, z, h, seed] of [[-4.5, 3.4, 0.9, 3], [0.9, 3.6, 0.8, 4], [3.2, 3.5, 0.8, 5]]) g.add(place(tree({ kind: 'bush', h, seed }), { x, y: y0, z }));
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 12 }), { x: 4.0, y: y0, z: 3.9 }));

  // gas lamp by the gate
  const lampX = DX + 1.2;
  g.add(place(cylinder(0.06, 0.1, 2.6, ironM, 6), { x: lampX, y: y0, z: 4.45 }));
  g.add(place(box(0.32, 0.42, 0.32, emissive(PALETTE.windowLit, 0.8)), { x: lampX, y: y0 + 2.6, z: 4.45 }));
  g.add(place(cone(0.28, 0.3, ironM, 4), { x: lampX, y: y0 + 3.02, z: 4.45, ry: 45 }));

  // ---------------------------------------------------------------- side & back yards
  g.add(place(tree({ kind: 'round', h: 4.8, seed: 21 }), { x: -3.75, y: y0, z: -1.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 22 }), { x: -4.3, y: y0, z: 0.9 }));
  g.add(place(tree({ kind: 'cone', h: 4.4, seed: 23 }), { x: 4.0, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 24 }), { x: 4.4, y: y0, z: -1.2 }));
  // bins down the right side passage
  for (const [z, c] of [[1.2, PALETTE.green], [1.85, PALETTE.grey]]) {
    g.add(place(box(0.55, 0.9, 0.55, mat(c)), { x: 4.4, y: y0, z }));
    g.add(place(box(0.6, 0.08, 0.6, mat(PALETTE.darkGrey)), { x: 4.4, y: y0 + 0.9, z }));
  }
  g.add(place(hedge({ w: 9.6, h: 1.0, d: 0.5 }), { y: y0, z: -4.7 }));
  g.add(place(patch(2.6, 1.1, 'paved'), { x: 0.0, y: y0, z: -3.95 }));
  g.add(place(bench({ w: 1.5 }), { x: 0.0, y: y0 + 0.05, z: -4.1 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 25 }), { x: -2.2, y: y0, z: -4.0 }));

  return g;
}

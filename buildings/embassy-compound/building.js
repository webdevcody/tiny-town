import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, sphere, place, group, columns,
  antenna, tree, car, streetLamp, bench, hedge, fence,
  mat, metal, glass, emissive, surface, textured, shade, MAT,
} from '../../src/lib/index.js';
import { uvBox, bigSign, nationalFlag, flagTexture, crestTexture, satelliteDish } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Walled diplomatic compound: perimeter wall + railing, gate with guard booth
// and boom barrier, flag row on a striped lawn, modern white pavilion behind.
const HW = 10, HD = 5;

const FLAGS = [
  ['vtri', ['#2f8f4a', '#f4f2ea', '#e2862a']],
  ['canton', ['#c8322b', '#f4f2ea', '#24395e']],
  ['cross', ['#2f6fbf', '#e9c31f']],
  ['htri', ['#232326', '#c8322b', '#e9c31f']],
  ['disc', ['#f4f2ea', '#c8322b']],
  ['star', ['#2f6fbf', '#f4f2ea']],
  ['band', ['#3a9a4a', '#f4f2ea', '#c8322b']],
  ['hoist', ['#f4f2ea', '#c8322b', '#24395e']],
];

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  const stone = mat(PALETTE.cream);
  const stoneCap = mat(shade(PALETTE.cream, 0.35));
  const iron = metal(PALETTE.black, { roughness: 0.5 });
  const gold = metal(PALETTE.glassGold, { roughness: 0.3 });
  const white = mat(PALETTE.white);

  // ---------------------------------------------------------------- ground
  // striped formal lawn, driveway, forecourt, flag terrace
  const lawn = surface('stripes', '#5f9a3a', { color2: '#6fa947', size: 4 });
  g.add(place(patch(14.1, 5.85, lawn, 0.03), { x: -2.6, y: y0, z: 1.65 }));
  const paving = surface('paving', PALETTE.paving, { size: 2 });
  g.add(place(patch(3.2, 5.6, 'asphalt'), { x: 6, y: y0, z: 2.2 }));
  g.add(place(patch(9.5, 2.2, paving), { x: 5.05, y: y0 + 0.01, z: 0.4 }));
  g.add(place(patch(4.6, 3.8, 'asphalt'), { x: 7.4, y: y0, z: -2.65 }));
  for (const x of [6.4, 8.4]) g.add(place(box(0.08, 0.02, 3.4, white), { x: x - 1, y: y0 + 0.05, z: -2.75 }));
  g.add(place(patch(10.4, 0.9, paving), { x: -4.6, y: y0 + 0.01, z: 1.85 }));

  // ---------------------------------------------------------------- perimeter wall
  const wallH = 0.95, railH = 0.85, wallT = 0.3;
  const wallRun = (len, x, z, ry) => {
    g.add(place(box(len, wallH, wallT, stone), { x, y: y0, z, ry }));
    g.add(place(box(len + 0.06, 0.1, wallT + 0.1, stoneCap), { x, y: y0 + wallH, z, ry }));
    const rail = fence({ w: len, d: 0.1, h: railH, style: 'railing', color: PALETTE.black, sides: ['front'] });
    g.add(place(rail, { x, y: y0 + wallH + 0.1, z, ry }));
    // spear-topped bars between the rails
    const n = Math.floor(len / 0.35);
    const bars = new THREE.InstancedMesh(new THREE.BoxGeometry(0.04, railH, 0.04).translate(0, railH / 2, 0), iron, n);
    const m4 = new THREE.Matrix4();
    for (let i = 0; i < n; i++) bars.setMatrixAt(i, m4.makeTranslation(-len / 2 + (i + 0.5) * (len / n), 0, 0));
    g.add(place(bars, { x, y: y0 + wallH + 0.1, z, ry }));
    // piers every ~2.5 m
    const piers = Math.max(1, Math.round(len / 2.6));
    for (let i = 0; i <= piers; i++) {
      const t = -len / 2 + (len * i) / piers;
      const px = x + (ry === 0 ? t : 0), pz = z + (ry === 0 ? 0 : t);
      g.add(place(box(0.5, wallH + railH + 0.2, 0.5, stone), { x: px, y: y0, z: pz }));
      g.add(place(box(0.6, 0.12, 0.6, stoneCap), { x: px, y: y0 + wallH + railH + 0.2, z: pz }));
    }
  };
  const wx = HW - 0.25, wz = HD - 0.25;
  wallRun(2 * wx, 0, -wz, 0);                       // back
  wallRun(2 * wz, -wx, 0, 90);                      // left
  wallRun(2 * wz, wx, 0, 90);                       // right
  wallRun(wx - 7.8, (wx + 7.8) / 2, wz, 0);         // front right of the gate
  wallRun(wx - 4.8, (-wx - 4.8) / 2, wz, 0);        // front far left
  wallRun(4.2 - 1.8, 3.0, wz, 0);                   // front between nameplate and gate

  // solid name wall with a bronze-on-navy nameplate and crest
  g.add(place(box(6.6, 2.0, 0.5, stone), { x: -1.5, y: y0, z: wz }));
  g.add(place(box(6.8, 0.14, 0.62, stoneCap), { x: -1.5, y: y0 + 2.0, z: wz }));
  g.add(place(bigSign({ text: 'EMBASSY', w: 4.0, h: 0.62, bg: PALETTE.navy, fg: '#e8c766', border: '#e8c766' }), { x: -0.6, y: y0 + 0.75, z: wz + 0.25 }));
  const crest = textured(crestTexture());
  const navy = mat(PALETTE.navy);
  g.add(place(uvBox(0.95, 0.95, 0.06, [navy, navy, navy, navy, crest, navy]), { x: -3.85, y: y0 + 0.6, z: wz + 0.25 }));

  // ---------------------------------------------------------------- gate
  for (const x of [4.2, 7.8]) {
    g.add(place(box(0.75, 2.5, 0.75, stone), { x, y: y0, z: wz }));
    g.add(place(box(0.9, 0.15, 0.9, stoneCap), { x, y: y0 + 2.5, z: wz }));
    g.add(place(sphere(0.2, emissive(PALETTE.windowLit, 0.6), 8), { x, y: y0 + 2.65, z: wz }));
    // CCTV camera
    g.add(place(box(0.14, 0.14, 0.4, white), { x: x + (x < 6 ? 0.25 : -0.25), y: y0 + 2.2, z: wz + 0.2, ry: x < 6 ? -20 : 20 }));
  }
  // sliding gate, pulled open behind the wall
  const gateLeaf = group(
    place(box(3.3, 0.1, 0.06, iron), { y: 0.15 }),
    place(box(3.3, 0.1, 0.06, iron), { y: 1.6 }),
  );
  for (let i = 0; i < 15; i++) gateLeaf.add(place(box(0.05, 1.75, 0.05, iron), { x: -1.6 + i * 0.228 }));
  g.add(place(gateLeaf, { x: 2.35, y: y0, z: wz - 0.35 }));
  g.add(place(box(3.4, 0.05, 0.14, metal(PALETTE.steel)), { x: 4.5, y: y0, z: wz - 0.35 }));

  // boom barrier (red/white) across the drive + rest post
  const boomPost = 7.25, boomZ = 3.35;
  g.add(place(box(0.45, 1.0, 0.45, mat(PALETTE.lightGrey)), { x: boomPost, y: y0, z: boomZ }));
  g.add(place(box(0.5, 0.25, 0.5, mat(PALETTE.red)), { x: boomPost, y: y0 + 0.9, z: boomZ }));
  const stripes = surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 1.2 });
  g.add(place(box(3.1, 0.14, 0.12, stripes), { x: boomPost - 1.6, y: y0 + 0.95, z: boomZ }));
  g.add(place(box(0.12, 0.95, 0.12, stripes), { x: 4.75, y: y0, z: boomZ }));
  // hydraulic road blocker plate
  g.add(place(box(3.0, 0.18, 0.7, MAT.hazard), { x: 6, y: y0, z: 2.3 }));
  for (const x of [4.6, 7.4]) g.add(place(cylinder(0.12, 0.12, 0.8, mat(PALETTE.darkGrey), 8), { x, y: y0, z: 1.5 }));

  // guard booth beside the gate
  const bx = 8.65, bz = 3.05;
  g.add(place(box(1.8, 0.9, 1.8, white), { x: bx, y: y0, z: bz }));
  g.add(place(box(1.75, 1.15, 1.75, glass(PALETTE.glassSky)), { x: bx, y: y0 + 0.9, z: bz }));
  for (const [cx, cz] of [[-0.85, -0.85], [0.85, -0.85], [-0.85, 0.85], [0.85, 0.85]]) {
    g.add(place(box(0.12, 1.15, 0.12, white), { x: bx + cx, y: y0 + 0.9, z: bz + cz }));
  }
  g.add(place(box(2.3, 0.22, 2.3, navy), { x: bx, y: y0 + 2.05, z: bz }));
  g.add(place(box(1.6, 0.08, 1.6, white), { x: bx, y: y0 + 2.27, z: bz }));
  g.add(place(sphere(0.14, emissive(PALETTE.red, 1.0), 6), { x: bx, y: y0 + 2.35, z: bz }));
  g.add(place(box(0.08, 0.04, 0.6, mat(PALETTE.navy)), { x: bx - 0.95, y: y0 + 0.85, z: bz }));
  // guard
  g.add(place(box(0.32, 0.8, 0.22, mat(PALETTE.navy)), { x: bx - 0.35, y: y0, z: bz + 0.2 }));
  g.add(place(sphere(0.13, mat(PALETTE.peach), 6), { x: bx - 0.35, y: y0 + 0.92, z: bz + 0.2 }));

  // ---------------------------------------------------------------- flag row
  const fx0 = -8.9, fdx = 1.4;
  FLAGS.slice(0, 7).forEach(([design, colors], i) => {
    const x = fx0 + i * fdx;
    g.add(place(cylinder(0.18, 0.22, 0.2, stoneCap, 8), { x, y: y0, z: 1.85 }));
    g.add(place(nationalFlag({ h: 5.6, design, colors, fw: 1.15, fh: 0.77 }), { x, y: y0 + 0.2, z: 1.85 }));
  });

  // ---------------------------------------------------------------- pavilion
  const px = -2.4, pw = 12.4;
  const glazed = { style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.white, lit: 0.2, bay: 1.6, floorHeight: 3.3, seed: 31, roof: PALETTE.white };
  // recessed glass ground floor
  g.add(place(facadeBlock({ w: pw, d: 3.2, floors: 1, ...glazed }), { x: px, y: y0, z: -2.85 }));
  // cantilevered white upper storey with a long ribbon window
  const upY = y0 + 3.3;
  g.add(place(facadeBlock({ w: pw + 1.2, d: 4.1, floors: 1, floorHeight: 3, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassDark, frame: PALETTE.steelLight, lit: 0.15, bay: 2, seed: 32, roof: PALETTE.concrete }), { x: px, y: upY, z: -2.55 }));
  // thin overhanging roof slab
  g.add(place(box(pw + 2.2, 0.3, 4.75, white), { x: px, y: upY + 3, z: -2.5 }));
  g.add(place(box(pw + 2.25, 0.08, 4.8, mat(PALETTE.steelLight)), { x: px, y: upY + 2.98, z: -2.5 }));
  // slender pilotis under the cantilever
  g.add(place(columns({ count: 8, length: pw - 0.4, radius: 0.12, h: 3.3, material: white }), { x: px, y: y0, z: -0.75 }));
  // gold crest on the upper facade
  g.add(place(cylinder(1.05, 1.05, 0.12, gold, 20), { x: 1.8, y: upY + 1.5, z: -0.48, rx: 90 }));
  const crestDisc = place(uvBox(1.5, 1.5, 0.05, [navy, navy, navy, navy, crest, navy]), { x: 1.8, y: upY + 0.75, z: -0.34 });
  g.add(crestDisc);
  // entrance: glass doors + projecting canopy
  const ex = 1.8;
  g.add(place(box(2.2, 2.5, 0.12, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { x: ex, y: y0, z: -1.2 }));
  g.add(place(box(3.4, 0.22, 2.6, white), { x: ex, y: y0 + 2.9, z: -0.1 }));
  g.add(place(columns({ count: 2, length: 3.0, radius: 0.08, h: 2.9, material: metal(PALETTE.steelLight) }), { x: ex, y: y0, z: 1.05 }));
  g.add(place(bigSign({ text: 'CONSULAR SECTION', w: 3.3, h: 0.3, bg: PALETTE.white, fg: PALETTE.navy }), { x: ex, y: y0 + 2.92, z: 1.17 }));
  // entrance steps
  g.add(place(box(2.8, 0.12, 0.6, mat(PALETTE.lightGrey)), { x: ex, y: y0, z: -0.85 }));

  // side core: stone stair tower with vertical glass slot
  g.add(place(facadeBlock({ w: 1.9, d: 3.4, h: 7.6, floorHeight: 7.6, style: 'plain', wall: PALETTE.sandstone, roof: PALETTE.concreteDark }), { x: 4.75, y: y0, z: -2.75 }));
  g.add(place(box(0.7, 6.4, 0.06, glass(PALETTE.glassTeal)), { x: 4.75, y: y0 + 0.6, z: -1.05 }));
  g.add(place(box(0.06, 6.4, 1.6, glass(PALETTE.glassTeal)), { x: 5.7, y: y0 + 0.6, z: -2.75 }));

  // roof: satellite dish, comms mast, plant, main flag
  const roofY = upY + 3.3;
  g.add(place(satelliteDish({ r: 1.0 }), { x: -6.2, y: roofY, z: -3.0, ry: 20 }));
  g.add(place(satelliteDish({ r: 0.6 }), { x: -4.4, y: roofY, z: -3.6, ry: -10 }));
  g.add(place(antenna({ h: 3, radius: 0.1 }), { x: 2.6, y: roofY, z: -3.4 }));
  const plant = mat(PALETTE.steel);
  g.add(place(box(2.4, 0.9, 1.4, plant), { x: -0.6, y: roofY, z: -3.4 }));
  g.add(place(box(1.2, 0.6, 1.2, mat(PALETTE.steelDark)), { x: 1.2, y: roofY, z: -3.5 }));
  for (const x of [-1.2, 0]) g.add(place(cylinder(0.4, 0.4, 0.15, mat(PALETTE.darkGrey), 10), { x, y: roofY + 0.9, z: -3.4 }));
  g.add(place(nationalFlag({ h: 3.4, design: FLAGS[7][0], colors: FLAGS[7][1], fw: 1.6, fh: 1.05 }), { x: 4.4, y: y0 + 7.6, z: -2.4 }));

  // ---------------------------------------------------------------- staff parking
  g.add(place(car({ color: PALETTE.black }), { x: 6.4, y: y0 + 0.05, z: -2.75, ry: 90, s: 0.72 }));
  g.add(place(car({ color: PALETTE.navy }), { x: 8.4, y: y0 + 0.05, z: -2.6, ry: 90, s: 0.72 }));
  const pennant = textured(flagTexture(...FLAGS[7]), { side: THREE.DoubleSide });
  // diplomatic limousine at the entrance
  g.add(place(car({ color: PALETTE.black }), { x: 5.4, y: y0 + 0.05, z: 0.35, s: 0.78 }));
  for (const z of [-0.2, 0.9]) {
    g.add(place(cylinder(0.015, 0.015, 0.5, metal(PALETTE.steelLight), 4), { x: 6.5, y: y0 + 0.85, z }));
    g.add(place(uvBox(0.36, 0.24, 0.01, [navy, navy, navy, navy, pennant, pennant]), { x: 6.32, y: y0 + 1.1, z }));
  }

  // ---------------------------------------------------------------- planting & lamps
  g.add(place(hedge({ w: 8.8, h: 0.8, d: 0.55 }), { x: -5.0, y: y0, z: 4.15 }));
  for (let i = 0; i < 6; i++) {
    g.add(place(tree({ kind: 'bush', h: 1.0, seed: 40 + i, color: PALETTE.foliageDark }), { x: -8.3 + i * 1.95, y: y0, z: -0.15 }));
  }
  g.add(place(tree({ kind: 'cone', h: 6, seed: 5 }), { x: -8.6, y: y0, z: 3.2 }));
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 8 }), { x: 9.1, y: y0, z: -0.9 }));
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 9 }), { x: 9.1, y: y0, z: 1.3 }));
  g.add(place(box(1.6, 0.35, 1.6, mat(PALETTE.stoneDark)), { x: 2.6, y: y0, z: 3.0 }));
  g.add(place(tree({ kind: 'round', h: 2.6, seed: 12 }), { x: 2.6, y: y0 + 0.35, z: 3.0 }));
  for (const x of [-6.5, -2.0]) g.add(place(streetLamp({ h: 3.6 }), { x, y: y0, z: 3.2 }));
  g.add(place(bench({ w: 1.5 }), { x: -4.25, y: y0, z: 3.05, ry: 180 }));
  // flower beds flanking the flag terrace
  g.add(place(box(1.0, 0.25, 0.6, mat(PALETTE.stoneDark)), { x: 0.4, y: y0, z: 2.75 }));
  g.add(place(tree({ kind: 'bush', h: 0.6, seed: 3, color: PALETTE.red }), { x: 0.4, y: y0 + 0.2, z: 2.75 }));

  return g;
}

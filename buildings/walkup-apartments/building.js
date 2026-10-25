import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, cylinder, place, door, stairs, fence,
  tree, streetLamp, sign, chimney, surface, mat, metal, shade, hedge, bench, pipe,
} from '../../src/lib/index.js';
import { fireEscape, waterTank } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const BW = 7.6, BD = 6.2, BZ = -0.9; // brick block, front face at z = 2.2
  const FZ = BZ + BD / 2, KZ = BZ - BD / 2;
  const FLOORS = 4;
  const H = FLOORS * FLOOR;

  const brick = PALETTE.brickBrown;
  const stone = shade(PALETTE.stone, 0.15);
  const brickMat = surface('brick', brick, { size: 1.2 });
  const stoneMat = mat(stone);
  const cornice = mat(PALETTE.offWhite);

  // --- the block -----------------------------------------------------------
  g.add(place(facadeBlock({
    w: BW, d: BD, floors: FLOORS, style: 'brick', wall: brick,
    glass: PALETTE.window, frame: PALETTE.white, windowW: 0.46, windowH: 0.58,
    bay: 1.9, lit: 0.15, seed: 6, roof: PALETTE.roofBlack,
  }), { y: y0, z: BZ }));
  // stone plinth and a string course over the ground floor
  g.add(place(box(BW + 0.12, 0.55, BD + 0.12, mat(PALETTE.stoneDark)), { y: y0, z: BZ }));
  g.add(place(box(BW + 0.14, 0.18, BD + 0.14, stoneMat), { y: y0 + FLOOR - 0.12, z: BZ }));
  // cornice with brackets, then a brick parapet with stone coping
  const cy = y0 + H;
  g.add(place(box(BW + 0.12, 0.3, BD + 0.12, stoneMat), { y: cy - 0.3, z: BZ }));
  g.add(place(box(BW + 0.5, 0.32, BD + 0.5, cornice), { y: cy, z: BZ }));
  for (let i = 0; i <= 8; i++) {
    const x = -BW / 2 + 0.2 + ((BW - 0.4) * i) / 8;
    g.add(place(box(0.14, 0.32, 0.3, cornice), { x, y: cy - 0.3, z: FZ + 0.15 }));
    g.add(place(box(0.14, 0.32, 0.3, cornice), { x, y: cy - 0.3, z: KZ - 0.15 }));
  }
  for (let i = 0; i <= 6; i++) {
    const z = KZ + 0.2 + ((BD - 0.4) * i) / 6;
    for (const sx of [-1, 1]) g.add(place(box(0.3, 0.32, 0.14, cornice), { x: sx * (BW / 2 + 0.15), y: cy - 0.3, z }));
  }
  const py = cy + 0.32;
  g.add(place(box(BW - 0.3, 0.04, BD - 0.3, surface('gravel', '#5f5e5c', { size: 3 })), { y: py, z: BZ }));
  g.add(place(parapet({ w: BW, d: BD, h: 0.6, t: 0.3, material: brickMat }), { y: py, z: BZ }));
  g.add(place(parapet({ w: BW + 0.1, d: BD + 0.1, h: 0.08, t: 0.4, material: stoneMat }), { y: py + 0.6, z: BZ }));
  // name plaque in the parapet
  g.add(place(sign({ text: 'THE MAYFAIR', w: 3.0, h: 0.5, bg: PALETTE.white, fg: PALETTE.navy, depth: 0.06 }), { y: py + 0.05, z: FZ + 0.03 }));

  // --- fire escapes (front right, back left) -------------------------------
  const roofY = H + 0.32;
  g.add(place(fireEscape({ w: 3.7, d: 0.85, levels: [1, 2, 3], roofY }), { x: 1.9, y: y0, z: FZ }));
  g.add(place(fireEscape({ w: 3.7, d: 0.8, levels: [1, 2, 3], roofY, flip: true }), { x: -1.9, y: y0, z: KZ, ry: 180 }));

  // --- window AC units on a few windows --------------------------------------
  const acMat = mat(PALETTE.lightGrey);
  const acGrille = mat(PALETTE.grey);
  const ac = (x, f, z, ry) => {
    const a = new THREE.Group();
    a.add(place(box(0.62, 0.42, 0.45, acMat), { z: 0.22 }));
    a.add(place(box(0.5, 0.28, 0.02, acGrille), { y: 0.07, z: 0.455 }));
    return place(a, { x, y: y0 + f * FLOOR + 0.62, z, ry });
  };
  g.add(ac(-2.85, 1, FZ, 0));
  g.add(ac(-0.95, 2, FZ, 0));
  g.add(ac(-2.85, 3, FZ, 0));
  g.add(ac(0.95, 2, KZ, 180));
  g.add(ac(2.85, 1, KZ, 180));
  g.add(place(ac(0, 2, 0, 0), { x: BW / 2, z: BZ + 1.03, ry: 90 }));
  g.add(place(ac(0, 1, 0, 0), { x: -BW / 2, z: BZ - 1.03, ry: -90 }));
  g.add(place(ac(0, 3, 0, 0), { x: -BW / 2, z: BZ + 2.07, ry: -90 }));

  // --- entrance: stoop, door, transom, canopy, lamps, house number -----------
  const ex = -0.95;
  const stoopH = 0.55;
  g.add(place(stairs({ w: 1.7, h: stoopH, d: 1.2, steps: 3, material: stoneMat }), { x: ex, y: y0, z: FZ + 0.6 }));
  g.add(place(box(1.7, stoopH, 0.3, stoneMat), { x: ex, y: y0, z: FZ + 0.15 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.05, 0.9, 0.05, mat('#26272b')), { x: ex + sx * 0.82, y: y0 + stoopH, z: FZ + 0.25 }));
    g.add(place(box(0.05, 0.05, 1.3, mat('#26272b')), { x: ex + sx * 0.82, y: y0 + 0.85, z: FZ + 0.75, rx: -22 }));
    g.add(place(box(0.05, 0.7, 0.05, mat('#26272b')), { x: ex + sx * 0.82, y: y0 + 0.2, z: FZ + 1.15 }));
  }
  g.add(place(box(1.5, 2.65, 0.06, stoneMat), { x: ex, y: y0 + stoopH, z: FZ + 0.01 }));
  g.add(place(door({ w: 1.1, h: 2.0, color: PALETTE.navy, frame: PALETTE.white }), { x: ex, y: y0 + stoopH, z: FZ + 0.02 }));
  g.add(place(box(1.1, 0.35, 0.1, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.35 })), { x: ex, y: y0 + stoopH + 2.12, z: FZ + 0.05 }));
  g.add(place(box(1.9, 0.12, 0.9, mat(PALETTE.darkGrey)), { x: ex, y: y0 + stoopH + 2.6, z: FZ + 0.45 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.14, 0.3, 0.14, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.6 })), { x: ex + sx * 0.72, y: y0 + stoopH + 1.6, z: FZ + 0.12 }));
  }
  g.add(place(sign({ text: '112', w: 0.5, h: 0.24, bg: PALETTE.white, fg: PALETTE.black, depth: 0.04 }), { x: ex, y: y0 + stoopH + 2.73, z: FZ + 0.9 }));

  // --- roof: water tank, stair bulkhead, chimneys, vents ---------------------
  const ry = py + 0.04;
  g.add(place(waterTank({ radius: 1.15, h: 2.3, legH: 1.8 }), { x: 2.0, y: ry, z: BZ - 1.2 }));
  // stair bulkhead with door and tar-paper roof
  g.add(place(box(2.1, 2.3, 2.3, brickMat), { x: -2.2, y: ry, z: BZ - 0.9 }));
  g.add(place(box(2.3, 0.15, 2.5, mat(PALETTE.roofBlack)), { x: -2.2, y: ry + 2.3, z: BZ - 0.9 }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.steelDark, frame: PALETTE.darkGrey }), { x: -2.2, y: ry, z: BZ + 0.25 }));
  // chimney stacks on the side walls
  const chim = surface('brick', PALETTE.brickDark, { size: 1 });
  g.add(place(chimney({ w: 0.7, d: 1.3, h: 1.8, material: chim }), { x: -BW / 2 + 0.5, y: ry, z: BZ + 1.8 }));
  g.add(place(chimney({ w: 0.7, d: 1.3, h: 1.8, material: chim }), { x: BW / 2 - 0.5, y: ry, z: BZ + 1.8 }));
  for (const [x, z] of [[-3.25, BZ + 1.4], [-3.25, BZ + 2.2], [3.25, BZ + 1.4], [3.25, BZ + 2.2]]) {
    g.add(place(cylinder(0.12, 0.12, 0.35, mat('#b9663f'), 8), { x, y: ry + 1.95, z }));
  }
  // vent pipes, skylight, a TV antenna
  const vent = metal(PALETTE.steel);
  g.add(place(cylinder(0.12, 0.12, 0.8, vent, 8), { x: 0.2, y: ry, z: BZ + 1.6 }));
  g.add(place(cylinder(0.2, 0.2, 0.12, vent, 8), { x: 0.2, y: ry + 0.8, z: BZ + 1.6 }));
  g.add(place(cylinder(0.3, 0.3, 0.5, vent, 10), { x: 0.6, y: ry, z: BZ - 2.4 }));
  g.add(place(box(1.4, 0.3, 1.0, mat(PALETTE.steelLight)), { x: 0.9, y: ry, z: BZ + 0.9 }));
  g.add(place(box(1.2, 0.08, 0.8, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 })), { x: 0.9, y: ry + 0.3, z: BZ + 0.9, rx: -10 }));
  g.add(pipe([-1.0, ry, BZ - 2.0], [-1.0, ry + 2.6, BZ - 2.0], 0.04, vent));
  g.add(pipe([-1.6, ry + 2.3, BZ - 2.0], [-0.4, ry + 2.3, BZ - 2.0], 0.03, vent));
  g.add(pipe([-1.4, ry + 2.0, BZ - 2.0], [-0.6, ry + 2.0, BZ - 2.0], 0.03, vent));

  // --- ground: sidewalk, tree pit, lamp, bins, side garden, back yard --------
  g.add(place(patch(10, 2.5, 'concrete'), { y: y0, z: 3.75 }));
  g.add(place(box(10, 0.12, 0.25, mat(PALETTE.concreteDark)), { y: y0, z: 4.88 }));
  // street tree in an iron-railed pit
  g.add(place(patch(1.2, 1.2, 'dirt', 0.06), { x: -3.5, y: y0, z: 3.6 }));
  g.add(place(fence({ w: 1.2, d: 1.2, h: 0.35, style: 'railing' }), { x: -3.5, y: y0, z: 3.6 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 12 }), { x: -3.5, y: y0, z: 3.6 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: 4.3, y: y0, z: 4.4, ry: 90 }));
  // trash cans by the stoop
  const can = (x, z, c) => group2(
    place(cylinder(0.27, 0.24, 0.8, mat(c), 10), { x, y: y0, z }),
    place(cylinder(0.3, 0.3, 0.06, mat(shade(c, -0.15)), 10), { x, y: y0 + 0.8, z }),
  );
  g.add(can(-2.3, 2.75, PALETTE.steel));
  g.add(can(-2.95, 2.7, PALETTE.green));
  g.add(can(-2.6, 3.25, PALETTE.steel));
  // fire hydrant
  g.add(place(cylinder(0.14, 0.17, 0.55, mat(PALETTE.red), 8), { x: 3.4, y: y0, z: 4.45 }));
  g.add(place(cylinder(0.17, 0.17, 0.08, mat(shade(PALETTE.red, -0.2)), 8), { x: 3.4, y: y0 + 0.55, z: 4.45 }));
  g.add(place(box(0.42, 0.1, 0.1, mat(PALETTE.red)), { x: 3.4, y: y0 + 0.32, z: 4.45 }));

  // right side strip: small garden with a hedge, bushes and a bench
  g.add(place(patch(1.1, BD + 0.6, 'grass', 0.06), { x: 4.4, y: y0, z: BZ - 0.2 }));
  g.add(place(hedge({ w: BD + 0.2, h: 0.8, d: 0.4 }), { x: 4.75, y: y0, z: BZ - 0.2, ry: 90 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 31 }), { x: 4.3, y: y0, z: 1.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 32 }), { x: 4.3, y: y0, z: -2.9 }));
  // left side alley: dumpster and bikes along the wall
  g.add(place(box(1.0, 1.0, 1.7, mat(PALETTE.green, { roughness: 0.6 })), { x: -4.4, y: y0, z: BZ - 1.6 }));
  g.add(place(box(1.1, 0.12, 1.8, mat(shade(PALETTE.green, -0.25))), { x: -4.4, y: y0 + 1.0, z: BZ - 1.6, rz: -6 }));
  g.add(place(box(0.08, 0.8, 0.08, mat('#26272b')), { x: -4.75, y: y0, z: BZ + 0.6 }));
  g.add(place(box(0.08, 0.8, 0.08, mat('#26272b')), { x: -4.75, y: y0, z: BZ + 1.4 }));
  g.add(place(box(0.06, 0.06, 0.9, mat('#26272b')), { x: -4.75, y: y0 + 0.8, z: BZ + 1.0 }));
  for (const [z, c] of [[BZ + 0.75, PALETTE.red], [BZ + 1.25, PALETTE.blue]]) g.add(bike(-4.45, y0, z, c));
  // back yard: washing line between posts and a bench
  g.add(place(bench({ w: 1.4 }), { x: 2.2, y: y0, z: -4.65 }));
  for (const x of [0.7, 3.8]) g.add(place(cylinder(0.05, 0.05, 2.0, mat(PALETTE.woodDark), 6), { x, y: y0, z: -4.75 }));
  g.add(pipe([0.7, y0 + 1.95, -4.75], [3.8, y0 + 1.95, -4.75], 0.015, mat(PALETTE.white)));
  for (const [x, c] of [[1.3, PALETTE.white], [1.9, PALETTE.blue], [2.6, PALETTE.yellow], [3.2, PALETTE.red]]) {
    g.add(place(box(0.45, 0.6, 0.03, mat(c)), { x, y: y0 + 1.35, z: -4.75 }));
  }
  return g;
}

function group2(...objs) {
  const g = new THREE.Group();
  for (const o of objs) g.add(o);
  return g;
}

// Little bicycle parked along Z.
function bike(x, y, z, color) {
  const g = new THREE.Group();
  const frame = mat(color);
  const tyre = mat('#26272b');
  for (const dz of [-0.35, 0.35]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 5, 12), tyre);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.3, dz);
    g.add(w);
  }
  g.add(place(box(0.05, 0.05, 0.7, frame), { y: 0.55 }));
  g.add(place(box(0.05, 0.4, 0.05, frame), { y: 0.3, z: -0.1 }));
  g.add(place(box(0.4, 0.04, 0.04, frame), { y: 0.85, z: 0.3 }));
  g.add(place(box(0.08, 0.04, 0.2, PALETTE.black), { y: 0.72, z: -0.15 }));
  return place(g, { x, y, z });
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, ShapeBuilder,
  lot, patch, box, place, cylinder, sphere, beam, mat, surface, emissive, windowPanel,
  tree, hayBale,
} from '../../src/lib/index.js';
import {
  RED, YELLOW, BLUE, GOLD, cloth, bigTop, stripedCone, pennant, bunting, flatSign,
  wheel, vardo, cageWagon, lion, tiger, elephant,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // ---- the big top: two king poles at x = ±L, centred a little to the back
  const ZC = -0.8, L = 2, R = 5.2, wallH = 3, peak = 11, poleTop = 13;
  g.add(place(patch(18.6, 14.4, 'sand'), { y: y0, z: ZC }));
  const tent = bigTop({ L, R, wallH, peak });
  g.add(place(tent, { y: y0, z: ZC }));

  const poleM = mat(PALETTE.steelLight, { metalness: 0.3, roughness: 0.5 });
  for (const [x, c] of [[-L, BLUE], [L, RED]]) {
    g.add(place(cylinder(0.12, 0.16, poleTop - peak + 0.5, poleM, 8), { x, y: y0 + peak - 0.5, z: ZC }));
    g.add(place(sphere(0.22, mat(GOLD, { metalness: 0.4, roughness: 0.4 }), 8), { x, y: y0 + poleTop, z: ZC }));
    g.add(place(pennant({ len: 2.0, h: 1.0, color: c }), { x, y: y0 + poleTop - 0.1, z: ZC }));
  }

  // side poles under the eave, guy ropes out to stakes
  const ropeM = mat('#4a4036');
  tent.userData.eave.forEach(([x, , z], i) => {
    if (i % 2) return;
    const cx = Math.max(-L, Math.min(L, x));
    const dx = x - cx, dz = z, len = Math.hypot(dx, dz);
    const sx = x + (dx / len) * 1.2, sz = z + (dz / len) * 1.2 + ZC;
    if (sz > 4 && Math.abs(x) < 3) return; // keep the entrance clear
    g.add(place(cylinder(0.05, 0.06, wallH, mat(PALETTE.woodDark), 5), { x, y: y0, z: z + ZC }));
    g.add(beam([x, y0 + wallH, z + ZC], [sx, y0 + 0.05, sz], 0.04, ropeM));
    g.add(place(box(0.12, 0.25, 0.12, mat(PALETTE.wood)), { x: sx, y: y0, z: sz }));
  });

  // ---- entrance marquee: small striped gable porch on the front of the tent
  const mz0 = ZC + R, mz1 = mz0 + 2.4, mw = 1.7, mEave = 2.6, mRidge = 3.8;
  {
    const sb = new ShapeBuilder();
    const n = 4;
    for (let k = 0; k < n; k++) {
      const a = mz0 + ((mz1 - mz0) * k) / n, b = mz0 + ((mz1 - mz0) * (k + 1)) / n;
      sb.quad([-mw, mEave, b], [0, mRidge, b], [0, mRidge, a], [-mw, mEave, a], k % 2);
      sb.quad([mw, mEave, a], [0, mRidge, a], [0, mRidge, b], [mw, mEave, b], k % 2);
    }
    sb.tri([-mw, mEave, mz1], [mw, mEave, mz1], [0, mRidge, mz1], 1);
    // valance scallops along the front and sides of the porch
    for (let k = 0; k < 4; k++) {
      const x0 = -mw + (2 * mw * k) / 4, x1 = -mw + (2 * mw * (k + 1)) / 4;
      sb.tri([x0, mEave, mz1], [(x0 + x1) / 2, mEave - 0.45, mz1], [x1, mEave, mz1], k % 2);
    }
    for (const sx of [-mw, mw]) for (let k = 0; k < 4; k++) {
      const a = mz0 + ((mz1 - mz0) * k) / 4, b = mz0 + ((mz1 - mz0) * (k + 1)) / 4;
      sb.tri([sx, mEave, a], [sx, mEave - 0.45, (a + b) / 2], [sx, mEave, b], (k + 1) % 2);
    }
    g.add(place(new THREE.Mesh(sb.build(), [cloth(RED), cloth(YELLOW)]), { y: y0 }));
    g.add(place(box(2 * mw, 0.14, 0.08, cloth(BLUE)), { y: y0 + mEave - 0.07, z: mz1 }));
    for (const x of [-mw, mw]) g.add(place(cylinder(0.08, 0.08, mEave, mat(GOLD), 6), { x, y: y0, z: mz1 }));
    g.add(place(box(2.2, 2.4, 0.08, mat('#3a1414')), { y: y0, z: mz0 + 0.05 }));
    for (const x of [-1.25, 1.25]) g.add(place(box(0.5, 2.4, 0.1, cloth(RED)), { x, y: y0, z: mz0 + 0.1, ry: x > 0 ? 20 : -20 }));
    g.add(place(sphere(0.18, mat(GOLD), 8), { y: y0 + mRidge, z: mz1 }));
  }

  // ---- front: path, CIRCUS arch, ticket booth, popcorn cart
  g.add(place(patch(3.4, 10 - mz0, 'gravel'), { y: y0 + 0.01, z: (10 + mz0) / 2 }));
  const archZ = 9.3, archX = 2.1, archH = 4.0;
  for (const x of [-archX, archX]) {
    g.add(place(cylinder(0.16, 0.18, archH, surface('stripes', RED, { color2: '#f6f1e4', size: 0.5 }), 8), { x, y: y0, z: archZ }));
    g.add(place(sphere(0.25, mat(GOLD), 8), { x, y: y0 + archH + 1.3, z: archZ }));
    g.add(place(cylinder(0.06, 0.06, 1.3, mat(GOLD), 6), { x, y: y0 + archH, z: archZ }));
  }
  g.add(place(flatSign({ text: 'CIRCUS', w: 4.8, h: 1.25, bg: RED, fg: YELLOW, border: YELLOW }), { y: y0 + archH, z: archZ }));
  for (let i = 0; i < 9; i++) g.add(place(sphere(0.08, emissive(PALETTE.windowLit, 1), 6), { x: -2.2 + i * 0.55, y: y0 + archH + 1.25, z: archZ }));

  // ticket booth
  {
    const bx = -6.8, bz = 7.0;
    g.add(place(box(2.0, 2.3, 2.0, surface('stripes', RED, { color2: '#f6f1e4', size: 1 })), { x: bx, y: y0, z: bz }));
    g.add(place(windowPanel({ w: 1.2, h: 0.8, frame: GOLD, lit: true }), { x: bx, y: y0 + 0.95, z: bz + 1.0 }));
    g.add(place(box(1.4, 0.08, 0.35, mat(PALETTE.wood)), { x: bx, y: y0 + 0.9, z: bz + 1.15 }));
    g.add(place(flatSign({ text: 'TICKETS', w: 1.8, h: 0.42, bg: BLUE, fg: YELLOW, depth: 0.06, double: false }), { x: bx, y: y0 + 1.85, z: bz + 1.04 }));
    g.add(place(box(2.2, 0.12, 2.2, mat(GOLD)), { x: bx, y: y0 + 2.3 }));
    g.add(place(stripedCone({ r: 1.65, h: 1.3, n: 8 }), { x: bx, y: y0 + 2.42, z: bz }));
    g.add(place(sphere(0.15, mat(GOLD), 8), { x: bx, y: y0 + 3.7, z: bz }));
    // queue rope
    for (let i = 0; i < 4; i++) g.add(place(cylinder(0.05, 0.05, 0.9, mat(GOLD), 6), { x: bx + 1.3 + i * 0.9, y: y0, z: bz + 1.9 }));
    g.add(beam([bx + 1.3, y0 + 0.8, bz + 1.9], [bx + 4.0, y0 + 0.8, bz + 1.9], 0.05, cloth(RED)));
  }

  // popcorn cart
  {
    const px = -3.6, pz = 5.6;
    g.add(place(wheel(0.3), { x: px - 0.35, y: y0, z: pz + 0.45 }));
    g.add(place(wheel(0.3), { x: px - 0.35, y: y0, z: pz - 0.45 }));
    g.add(place(box(1.3, 0.7, 0.8, RED), { x: px, y: y0 + 0.35, z: pz }));
    g.add(place(box(1.1, 0.6, 0.65, mat('#fff1b8', { emissive: '#fff1b8', emissiveIntensity: 0.25 })), { x: px, y: y0 + 1.05, z: pz }));
    g.add(place(box(1.3, 0.08, 0.8, mat(GOLD)), { x: px, y: y0 + 1.05 }));
    for (const [x, z] of [[-0.6, -0.35], [0.6, -0.35], [-0.6, 0.35], [0.6, 0.35]]) g.add(place(cylinder(0.03, 0.03, 1.1, mat(GOLD), 4), { x: px + x, y: y0 + 1.05, z: pz + z }));
    g.add(place(stripedCone({ r: 0.95, h: 0.45, n: 8 }), { x: px, y: y0 + 2.15, z: pz }));
  }

  // lion wagon front-right
  g.add(place(cageWagon({ body: RED, animal: lion(), label: 'LIONS' }), { x: 6.0, y: y0, z: 7.6 }));

  // ---- back lot: showmen's wagons and the tiger wagon
  g.add(place(patch(19.4, 3.4, 'dirt'), { y: y0 + 0.01, z: -8.3 }));
  g.add(place(vardo({ body: '#2f7d4a', roof: RED }), { x: -5.6, y: y0, z: -8.4 }));
  g.add(place(vardo({ body: BLUE, roof: YELLOW }), { x: 0.0, y: y0, z: -8.4 }));
  g.add(place(cageWagon({ body: '#2e6fa8', animal: tiger(), label: 'TIGERS' }), { x: 6.3, y: y0, z: -8.3, ry: 180 }));

  // ---- left: elephant; right: hay, water trough, tree
  g.add(place(elephant(), { x: -8.9, y: y0, z: 1.4, ry: -90 }));
  for (const [z, s] of [[-2.4, 0], [-1.2, 0]]) g.add(place(hayBale({ r: 0.5 }), { x: -9.1 + s, y: y0, z }));
  g.add(place(hayBale({ r: 0.55 }), { x: 9.0, y: y0, z: -3.6, ry: 90 }));
  g.add(place(hayBale({ r: 0.55 }), { x: 9.0, y: y0, z: -2.0, ry: 90 }));
  g.add(place(hayBale({ r: 0.5 }), { x: 9.0, y: y0 + 1.1, z: -2.8, ry: 90 }));
  g.add(place(box(0.9, 0.5, 1.8, mat(PALETTE.woodDark)), { x: 9.1, y: y0, z: 0.6 }));
  g.add(place(box(0.7, 0.05, 1.6, mat(PALETTE.water)), { x: 9.1, y: y0 + 0.45, z: 0.6 }));
  g.add(place(tree({ kind: 'round', h: 4.8, seed: 12 }), { x: 8.6, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 13 }), { x: -8.6, y: y0, z: -5.0 }));
  for (const [x, z, s] of [[3.2, 9.3, 21], [-3.3, 9.4, 22], [9.0, 5.8, 23], [-9.2, 4.9, 24]]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: s }), { x, y: y0, z }));

  // ---- bunting from the pole tops to corner masts, between the poles and to the arch
  const mastH = 4.6, c = 9.6;
  for (const [x, z] of [[-c, -c], [c, -c], [-c, c], [c, c]]) {
    g.add(place(cylinder(0.06, 0.08, mastH, mat(PALETTE.woodDark), 6), { x, y: y0, z }));
    g.add(place(pennant({ len: 0.9, h: 0.5, color: YELLOW }), { x, y: y0 + mastH, z, ry: x > 0 ? 180 : 0 }));
  }
  const top = (x) => [x, y0 + poleTop - 0.3, ZC];
  g.add(bunting([
    [top(-L), top(L), 0.6],
    [top(-L), [-c, y0 + mastH - 0.1, -c], 1.0],
    [top(-L), [-c, y0 + mastH - 0.1, c], 1.0],
    [top(L), [c, y0 + mastH - 0.1, -c], 1.0],
    [top(L), [c, y0 + mastH - 0.1, c], 1.0],
    [top(-L), [-archX, y0 + archH + 1.2, archZ], 0.9],
    [top(L), [archX, y0 + archH + 1.2, archZ], 0.9],
  ]));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, cone, place, beam, mat, metal, field,
  tree, hedge, fence, bench, streetLamp, stairs, door, sign,
} from '../../src/lib/index.js';
import { glazing, vaultProfile, vault, revolve, curveIn } from './glasshouse.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// A Victorian palm house: octagonal glass centre with a curved roof, drum and
// dome, flanked by two glazed barrel-vault wings with apsidal (rounded) ends,
// all on a stone plinth and packed with palms. Formal garden out front.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));
  const y0 = LOT_HEIGHT;

  const glassM = glazing();
  const iron = mat('#f4f3ec', { roughness: 0.5 });
  const ironDark = mat('#2f5a3a', { roughness: 0.5 }); // painted green ironwork
  const stoneM = mat(PALETTE.sandstone);
  const stoneCap = mat(PALETTE.stone);
  const floorM = mat('#b9a98c');
  const gold = metal(PALETTE.glassGold, { roughness: 0.3 });

  const zc = -1.2; // glasshouse centre line
  const PH = 0.5; // plinth height
  const by = y0 + PH; // base of the glass

  // ---------------------------------------------------------------- centre
  // octagon (flat faces towards the axes)
  const R = 3.9; // glass circumradius
  const wallTop = 4.1; // above plinth
  const rDrum = 2.7;
  const roofH = 1.2, drumH = 1.2, domeH = 2.8;
  const yRoof = wallTop, yDrum = yRoof + roofH, yDome = yDrum + drumH, yTop = yDome + domeH;
  const oct = { segments: 8, start: 22.5 };
  const cg = new THREE.Group();
  cg.add(revolve({ ...oct, profile: [[R + 0.15, 0], [R + 0.15, PH]], material: stoneM }));
  cg.add(revolve({ ...oct, profile: [[R + 0.25, PH], [R + 0.25, PH + 0.08], [0, PH + 0.08]], material: stoneCap }));
  cg.add(revolve({ ...oct, profile: [[R - 0.05, PH + 0.08], [0, PH + 0.08]], material: floorM }));
  const glassProfile = [
    [R, 0], [R, wallTop],
    ...curveIn(R, yRoof, rDrum, roofH, 4).slice(1),
    [rDrum, yDome],
    ...curveIn(rDrum, yDome, 0, domeH, 5).slice(1),
  ];
  cg.add(place(revolve({ ...oct, profile: glassProfile, material: glassM }), { y: PH }));
  // white iron: cornice bands, corner ribs following the profile
  for (const [r, y, h] of [[R + 0.06, wallTop - 0.12, 0.3], [rDrum + 0.06, yDrum - 0.05, 0.18], [rDrum + 0.08, yDome - 0.1, 0.25]]) {
    cg.add(place(revolve({ ...oct, profile: [[r, y], [r, y + h], [r - 0.15, y + h]], material: iron }), { y: PH }));
  }
  const ribProfile = [[R, 0], [R, wallTop], ...curveIn(R, yRoof, rDrum, roofH, 4).slice(1)];
  const domeRib = [[rDrum, yDrum], [rDrum, yDome], ...curveIn(rDrum, yDome, 0, domeH, 5).slice(1)];
  for (let k = 0; k < 8; k++) {
    const a = THREE.MathUtils.degToRad(22.5 + k * 45);
    const P = ([r, y], out = 0.04) => [(r + out) * Math.sin(a), PH + y, (r + out) * Math.cos(a)];
    for (const prof of [ribProfile, domeRib]) {
      for (let i = 0; i < prof.length - 1; i++) cg.add(beam(P(prof[i]), P(prof[i + 1]), 0.16, iron));
    }
  }
  // lantern + finial
  const yl = PH + yTop - 0.15;
  cg.add(place(cylinder(0.55, 0.6, 0.7, glassM, 8), { y: yl }));
  cg.add(place(cylinder(0.62, 0.62, 0.1, iron, 8), { y: yl + 0.7 }));
  cg.add(place(cone(0.65, 0.5, ironDark, 8), { y: yl + 0.8 }));
  cg.add(place(cylinder(0.04, 0.06, 1.0, gold, 6), { y: yl + 1.2 }));
  cg.add(place(sphere(0.16, gold, 8), { y: yl + 1.25 }));
  g.add(place(cg, { y: y0, z: zc }));

  // ----------------------------------------------------------------- wings
  const span = 5, wWall = 2.1, wH = 1.9;
  const S = span / 2;
  const wx0 = 3.0, wx1 = 7.3; // straight part; apse centred on wx1
  const wLen = wx1 - wx0;
  const prof = vaultProfile({ span, wall: wWall, h: wH, steps: 8 });
  const apseProfile = [[S, 0], [S, wWall], ...curveIn(S, wWall, 0, wH, 4).slice(1)];
  for (const sx of [1, -1]) {
    const wg = new THREE.Group();
    const cx = sx * (wx0 + wLen / 2);
    const ax = sx * wx1;
    // plinth + floor
    wg.add(place(box(wLen, PH, span + 0.3, stoneM), { x: cx }));
    wg.add(place(box(wLen, 0.08, span + 0.5, stoneCap), { x: cx, y: PH }));
    const half = { segments: 6, start: sx > 0 ? 0 : 180, arc: 180 };
    wg.add(place(revolve({ ...half, profile: [[S + 0.15, 0], [S + 0.15, PH]], material: stoneM }), { x: ax }));
    wg.add(place(revolve({ ...half, profile: [[S + 0.25, PH], [S + 0.25, PH + 0.08], [0, PH + 0.08]], material: stoneCap }), { x: ax }));
    // glass vault + apse
    wg.add(place(vault({ len: wLen, profile: prof, material: glassM }), { x: cx, y: PH + 0.08 }));
    wg.add(place(revolve({ ...half, profile: apseProfile, material: glassM }), { x: ax, y: PH + 0.08 }));
    // iron arches every ~1.1 m along the straight part
    const ribs = 4;
    for (let i = 0; i <= ribs; i++) {
      const x = sx * (wx0 + 0.6 + ((wLen - 0.6) * i) / ribs);
      for (let j = 0; j < prof.length - 1; j++) {
        const [z0, yA] = prof[j];
        const [z1, yB] = prof[j + 1];
        const o = 0.04;
        const n0 = Math.sign(z0) || 1, n1 = Math.sign(z1) || 1;
        wg.add(beam([x, PH + 0.08 + yA + (j > 0 ? o : 0), z0 + n0 * o], [x, PH + 0.08 + yB + o, z1 + n1 * o], 0.14, iron));
      }
    }
    // apse ribs
    for (let k = 0; k <= 6; k++) {
      const a = THREE.MathUtils.degToRad((sx > 0 ? 0 : 180) + k * 30);
      const P = ([r, y]) => [ax + (r + 0.04) * Math.sin(a), PH + 0.08 + y + 0.03, (r + 0.04) * Math.cos(a)];
      for (let i = 0; i < apseProfile.length - 1; i++) wg.add(beam(P(apseProfile[i]), P(apseProfile[i + 1]), 0.14, iron));
    }
    // eaves gutters
    for (const sz of [1, -1]) wg.add(place(box(wLen, 0.18, 0.2, iron), { x: cx, y: PH + 0.08 + wWall - 0.1, z: sz * (S + 0.06) }));
    wg.add(place(revolve({ ...half, profile: [[S + 0.1, wWall - 0.1], [S + 0.1, wWall + 0.08], [S - 0.05, wWall + 0.08]], material: iron }), { x: ax, y: PH + 0.08 }));
    // ridge cresting
    const ry = PH + 0.08 + wWall + wH;
    wg.add(place(box(wLen, 0.08, 0.1, iron), { x: cx, y: ry + 0.3 }));
    for (let i = 0; i <= 8; i++) {
      wg.add(place(box(0.06, 0.3, 0.06, iron), { x: sx * (wx0 + 0.4 + ((wLen - 0.4) * i) / 8), y: ry }));
    }
    wg.add(place(sphere(0.12, gold, 6), { x: ax, y: ry + 0.05 }));
    g.add(place(wg, { y: y0, z: zc }));
  }

  // --------------------------------------------------------------- planting inside
  const fy = y0 + PH + 0.08;
  const greens = ['#3f8f3a', '#2f6d2a', '#5fae3e', '#4c9a55'];
  const plants = new THREE.Group();
  plants.add(place(tree({ kind: 'palm', h: 6.4, seed: 3, color: '#3f8f3a' }), { x: 0, z: zc }));
  plants.add(place(tree({ kind: 'palm', h: 4.4, seed: 8, color: '#5fae3e' }), { x: -1.0, z: zc - 0.9, ry: 40 }));
  plants.add(place(tree({ kind: 'palm', h: 3.9, seed: 9, color: '#2f6d2a' }), { x: 1.1, z: zc - 0.7, ry: 10 }));
  plants.add(place(tree({ kind: 'palm', h: 3.4, seed: 13, color: '#4c9a55' }), { x: 1.1, z: zc + 1.2, ry: 70 }));
  plants.add(place(tree({ kind: 'palm', h: 3.0, seed: 14, color: '#5fae3e' }), { x: -1.2, z: zc + 1.1, ry: 20 }));
  for (const sx of [1, -1]) {
    plants.add(place(tree({ kind: 'palm', h: 3.1, seed: 20 + sx, color: greens[(sx + 1) % 4] }), { x: sx * 4.6, z: zc - 0.3, ry: 15 * sx }));
    plants.add(place(tree({ kind: 'palm', h: 2.9, seed: 24 + sx, color: greens[(sx + 2) % 4] }), { x: sx * 6.5, z: zc + 0.4, ry: 50 }));
    plants.add(place(tree({ kind: 'palm', h: 2.5, seed: 27 + sx, color: greens[(sx + 3) % 4] }), { x: sx * 8.0, z: zc - 0.2, ry: 80 }));
    plants.add(place(tree({ kind: 'round', h: 2.6, seed: 30 + sx, color: '#2f6d2a' }), { x: sx * 5.6, z: zc - 1.2 }));
  }
  // dense understorey: ferns, broadleaf bushes and a few flowering shrubs
  const bushes = [
    [0.9, 0.6, 1.3, 0], [-0.8, 1.2, 1.2, 1], [2.6, -0.4, 1.2, 2], [-2.7, 0.2, 1.3, 3], [0.2, -2.6, 1.2, 1],
    [2.2, -2.2, 1.0, 4], [-2.3, -2.1, 1.0, 5], [0.3, 2.5, 0.9, 6], [-2.2, 2.0, 0.9, 7],
    [4.0, 1.2, 1.1, 0], [5.2, 0.9, 1.0, 4], [4.4, -1.6, 1.2, 2], [7.2, -1.3, 1.1, 1], [8.6, 1.0, 0.9, 6], [6.0, -0.2, 1.0, 3], [7.6, 1.4, 0.9, 5],
    [-4.0, 1.1, 1.1, 2], [-5.3, 1.0, 1.0, 5], [-4.4, -1.7, 1.2, 0], [-7.0, -1.4, 1.1, 3], [-8.6, 1.0, 0.9, 4], [-6.1, -0.1, 1.0, 1], [-7.7, 1.4, 0.9, 6],
  ];
  const bushCols = ['#3f8f3a', '#2f6d2a', '#6cb33f', '#4c9a55', '#d8457a', '#e8a33a', '#c9374a', '#8fc44a'];
  for (const [x, z, h, c] of bushes) plants.add(place(tree({ kind: 'bush', h, seed: 40 + c, color: bushCols[c] }), { x, z: zc + z }));
  g.add(place(plants, { y: fy }));

  // ---------------------------------------------------------- entrance porch
  const pw = 2.6, pd = 1.4, pWall = 2.2, pH = 0.9;
  const pz0 = zc + R * Math.cos(Math.PI / 8) - 0.2; // tucked into the octagon face
  const pz = pz0 + pd / 2;
  const pzf = pz0 + pd; // front face
  const porch = new THREE.Group();
  porch.add(place(box(pw + 0.3, PH, pd, stoneM), { z: pz }));
  porch.add(place(box(pw + 0.5, 0.08, pd + 0.1, stoneCap), { y: PH, z: pz }));
  const pProf = vaultProfile({ span: pw, wall: pWall, h: pH, steps: 6 });
  porch.add(place(vault({ len: pd, profile: pProf, material: glassM }), { y: PH + 0.08, z: pz, ry: 90 }));
  // glazed front gable (iron frame + fanlight) with the door
  const fan = [[pw / 2, pWall], ...pProf.slice(2, -2), [-pw / 2, pWall]];
  const fanShape = new THREE.Shape(fan.map(([x, y]) => new THREE.Vector2(x, y)));
  porch.add(place(new THREE.Mesh(new THREE.ShapeGeometry(fanShape), glassM), { y: PH + 0.08, z: pzf + 0.01 }));
  const pane = new THREE.Shape([[-pw / 2, 0], [pw / 2, 0], [pw / 2, pWall], [-pw / 2, pWall]].map(([x, y]) => new THREE.Vector2(x, y)));
  porch.add(place(new THREE.Mesh(new THREE.ShapeGeometry(pane), glassM), { y: PH + 0.08, z: pzf + 0.01 }));
  for (const sx of [1, -1]) porch.add(place(box(0.16, pWall, 0.16, iron), { x: sx * (pw / 2 - 0.05), y: PH + 0.08, z: pzf }));
  porch.add(place(door({ w: 1.3, h: 2.0, color: ironDark, frame: '#f4f3ec' }), { y: PH + 0.08, z: pzf }));
  porch.add(place(box(pw + 0.1, 0.12, 0.16, iron), { y: PH + 0.08 + pWall, z: pzf }));
  porch.add(place(sign({ text: 'PALM HOUSE', w: 2.4, h: 0.5, bg: ironDark, fg: '#f2d27a', depth: 0.06 }), { y: PH + 0.08 + pWall + 0.16, z: pzf + 0.04 }));
  porch.add(place(stairs({ w: 2.0, h: PH, d: 0.75, steps: 3, material: stoneCap }), { z: pzf + 0.375 }));
  g.add(place(porch, { y: y0 }));

  // ------------------------------------------------------------ garden
  const pathM = 'gravel';
  const frontZ = pzf + 0.75; // foot of the steps
  g.add(place(patch(2.4, 5 - frontZ + 0.02, pathM), { y: y0, z: (frontZ + 5) / 2 - 0.01 }));
  // gravel walk along the glasshouse front
  g.add(place(patch(19.6, 0.9, pathM), { y: y0, z: zc + S + 0.15 + 0.6 }));
  // round flower beds with stone kerbs and an urn
  for (const sx of [1, -1]) {
    const bx = sx * 6.2, bz = 3.55;
    g.add(place(cylinder(1.25, 1.25, 0.14, stoneCap, 20), { x: bx, y: y0, z: bz }));
    g.add(place(cylinder(1.1, 1.1, 0.2, field('flowers', { size: 2 }), 20), { x: bx, y: y0, z: bz }));
    g.add(place(cylinder(0.18, 0.28, 0.5, stoneCap, 8), { x: bx, y: y0 + 0.2, z: bz }));
    g.add(place(cylinder(0.38, 0.2, 0.3, stoneCap, 8), { x: bx, y: y0 + 0.7, z: bz }));
    g.add(place(tree({ kind: 'bush', h: 0.7, seed: 70, color: '#c9374a' }), { x: bx, y: y0 + 0.9, z: bz }));
    // benches facing the beds
    g.add(place(bench({ w: 1.5 }), { x: sx * 3.3, y: y0, z: 2.45 }));
  }
  // potted palms flanking the porch
  for (const sx of [1, -1]) {
    g.add(place(cylinder(0.35, 0.25, 0.5, mat(PALETTE.terracotta), 8), { x: sx * 2.0, y: y0, z: 2.75 }));
    g.add(place(tree({ kind: 'palm', h: 1.8, seed: 80, color: '#4c9a55' }), { x: sx * 2.0, y: y0 + 0.45, z: 2.75 }));
  }
  // Victorian lamps by the gate
  g.add(place(streetLamp({ h: 3.4 }), { x: 3.1, y: y0, z: 4.35, ry: 180 }));
  g.add(place(streetLamp({ h: 3.4 }), { x: -3.1, y: y0, z: 4.35 }));
  // iron railings along the street with a gate gap
  g.add(place(fence({ w: 19.6, d: 0.2, h: 0.8, style: 'railing', color: '#2f3a33', sides: ['front'], gap: 2.6 }), { y: y0, z: 4.75 }));
  for (const sx of [1, -1]) {
    g.add(place(box(0.3, 1.1, 0.3, stoneCap), { x: sx * 1.4, y: y0, z: 4.85 }));
    g.add(place(sphere(0.15, stoneCap, 6), { x: sx * 1.4, y: y0 + 1.1, z: 4.85 }));
  }
  // back: hedges and trees screening the boiler yard
  for (const sx of [1, -1]) {
    g.add(place(hedge({ w: 5.0, h: 1.2, d: 0.7 }), { x: sx * 6.0, y: y0, z: -4.5 }));
    g.add(place(tree({ kind: 'cone', h: 4.0, seed: 90 + sx }), { x: sx * 9.0, y: y0, z: -4.0 }));
    g.add(place(tree({ kind: 'round', h: 3.6, seed: 95 + sx }), { x: sx * 8.9, y: y0, z: 3.7 }));
  }
  return g;
}

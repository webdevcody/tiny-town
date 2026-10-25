import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, surface, gableRoof, windowPanel, tank, tree, sphere,
} from '../../src/lib/index.js';
import { sheep, sheepdog, shepherd } from './animals.js';
import { stoneWall, woolBale, bigSign, fieldGate, hurdles, trough, hayRack, ute } from './props.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: two hill pastures divided by dry-stone walls that climb over the hill.
// East: a raised timber woolshed with a bale store, sheep yards, ramp and ute.

const y0 = LOT_HEIGHT;

// --- pasture terrain --------------------------------------------------------
const PX0 = -9.75, PX1 = -0.5;            // pasture extent (x)
const PZ = 4.8;                           // pasture extent (z, symmetric)
const smooth = (e0, e1, v) => { const t = Math.min(1, Math.max(0, (v - e0) / (e1 - e0))); return t * t * (3 - 2 * t); };
const bump = (x, z, cx, cz, r, h) => { const u = ((x - cx) ** 2 + (z - cz) ** 2) / (r * r); return u >= 1 ? 0 : h * (1 - u) ** 2; };

/** Hill height above the lot at (x, z). Zero along the boundary walls. */
function hill(x, z) {
  const edge = Math.min(x - (PX0 + 0.45), (PX1 - 0.45) - x, z + (PZ - 0.5), (PZ - 0.5) - z);
  const m = smooth(0, 1.4, edge);
  return m * (bump(x, z, -6.2, -1.3, 5.4, 3.6) + bump(x, z, -2.4, 2.0, 3.0, 1.4) + bump(x, z, -8.6, 2.8, 2.6, 0.5));
}
const ground = (x, z) => y0 + hill(x, z);

function hillMesh() {
  const w = PX1 - PX0, d = PZ * 2;
  const geo = new THREE.PlaneGeometry(w, d, 28, 24);
  geo.rotateX(-Math.PI / 2);
  geo.translate((PX0 + PX1) / 2, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i), z = pos.getZ(i);
    pos.setY(i, y0 + 0.01 + hill(x, z));
    uv.setXY(i, x, -z);
  }
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, surface('grass', PALETTE.grassLight, { size: 4 }));
}

/** Stand an object on the hill, tilted halfway towards the slope. */
function onHill(obj, x, z, ry = 0) {
  const e = 0.15;
  const n = new THREE.Vector3(hill(x - e, z) - hill(x + e, z), 2 * e, hill(x, z - e) - hill(x, z + e)).normalize();
  n.lerp(new THREE.Vector3(0, 1, 0), 0.4).normalize();
  const tilt = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), n);
  const yaw = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(ry));
  obj.quaternion.copy(tilt.multiply(yaw));
  obj.position.set(x, ground(x, z) - 0.04, z);
  return obj;
}

function rock(r, seed) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(seed % 2 ? PALETTE.stone : PALETTE.stoneDark));
  m.scale.set(1.3, 0.6, 1);
  m.rotation.y = seed;
  m.position.y = r * 0.55;
  return new THREE.Group().add(m);
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // ---------------------------------------------------------------- pastures
  g.add(hillMesh());
  const xw0 = PX0 + 0.25, xw1 = PX1 - 0.25, zw = PZ - 0.25;
  // boundary walls (gateway into the yards on the east side)
  g.add(stoneWall([[xw1, 0.9], [xw1, -zw], [xw0, -zw], [xw0, zw], [xw1, zw], [xw1, 2.6]], ground));
  // dividing wall climbing over the shoulder of the hill, with a gap for a gate
  g.add(stoneWall([[-3.9, zw], [-3.7, 2.4], [-4.3, 0.6]], ground));
  g.add(stoneWall([[-4.5, -0.8], [-4.0, -2.8], [-3.4, -zw]], ground));
  g.add(onHill(fieldGate({ w: 1.4 }), -4.3, 0.6, 75));
  g.add(place(fieldGate({ w: 1.6 }), { x: xw1, y: y0, z: 2.6, ry: 30 }));

  // lone hawthorn on the hill, rocky outcrops, gorse
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 12, color: PALETTE.foliageDark }), { x: -7.7, y: ground(-7.7, -2.7) - 0.15, z: -2.7 }));
  g.add(onHill(rock(0.55, 1), -6.6, -1.9));
  g.add(onHill(rock(0.4, 2), -6.0, -2.3));
  g.add(onHill(rock(0.35, 3), -9.0, 0.6));
  g.add(onHill(tree({ kind: 'bush', h: 0.9, seed: 4, color: '#6e8a2c' }), -5.0, 3.9));
  g.add(onHill(tree({ kind: 'bush', h: 0.8, seed: 5, color: '#6e8a2c' }), -9.0, -1.4));
  for (let i = 0; i < 4; i++) g.add(onHill(place(sphere(0.12, mat(PALETTE.yellow), 5), {}), -5.0 + (i % 2) * 0.3 - 0.15, 3.9 + (i > 1 ? 0.3 : -0.3)));

  // west field flock
  const flock1 = [
    [-8.5, 3.0, 200, 1], [-7.2, 3.7, 160, 0], [-6.4, 1.8, 30, 1], [-5.4, 2.8, 250, 0],
    [-7.9, 0.5, 300, 1], [-6.8, -0.4, 120, 0], [-8.5, -2.0, 60, 1], [-6.9, -3.1, 340, 1],
    [-5.0, -3.6, 15, 0], [-5.4, -1.0, 210, 1], [-7.6, 2.3, 180, 0, 'lamb'], [-6.1, 0.9, 80, 0, 'black'],
  ];
  // east field flock (around the hay rack and trough)
  const flock2 = [
    [-2.8, 3.8, 190, 1], [-2.2, 1.0, 40, 0], [-1.4, 3.9, 280, 1], [-3.0, -0.5, 330, 1],
    [-1.5, -1.6, 90, 0], [-2.0, -3.9, 100, 1], [-2.6, 2.6, 150, 0, 'lamb'],
  ];
  for (const [x, z, ry, graze, kind] of [...flock1, ...flock2]) {
    const opts = { graze: !!graze };
    if (kind === 'lamb') opts.s = 0.62;
    if (kind === 'black') { opts.wool = '#3b3632'; opts.face = '#1a1716'; }
    g.add(onHill(sheep(opts), x, z, ry));
  }
  g.add(onHill(hayRack({ w: 1.7 }), -2.3, -2.9, 12));
  g.add(onHill(trough({ w: 1.4 }), -1.3, 0.1, 90));

  // ------------------------------------------------------------- woolshed
  const plank = surface('planks', '#9c8a70', { size: 1.5 });
  const tin = surface('corrugated', '#7f8a90', { size: 0.8, metalness: 0.2, roughness: 0.6 });
  const sx = 3.7, sz = -2.75, sw = 6.2, sd = 3.7;
  const floorY = y0 + 0.8, wallH = 2.6;
  // stilts + slatted underfloor
  for (let i = 0; i <= 5; i++) for (const dz of [-sd / 2 + 0.1, 0, sd / 2 - 0.1]) {
    g.add(place(box(0.16, 0.8, 0.16, mat(PALETTE.woodDark)), { x: sx - sw / 2 + 0.1 + (i * (sw - 0.2)) / 5, y: y0, z: sz + dz }));
  }
  for (let i = 0; i < 24; i++) g.add(place(box(0.08, 0.7, 0.04, mat('#5b4630')), { x: sx - sw / 2 + 0.2 + i * 0.255, y: y0, z: sz + sd / 2 - 0.12 }));
  g.add(place(box(sw + 0.1, 0.12, sd + 0.1, mat(PALETTE.woodDark)), { x: sx, y: floorY - 0.12, z: sz }));
  g.add(place(box(sw, wallH, sd, [plank, plank, mat(PALETTE.roofGrey), plank, plank, plank]), { x: sx, y: floorY, z: sz }));
  g.add(place(gableRoof({ w: sw, d: sd, h: 1.7, overhang: 0.35, ridge: 'x', material: tin, gableMaterial: plank }), { x: sx, y: floorY + wallH, z: sz }));
  // ridge ventilator
  g.add(place(box(1.4, 0.4, 0.5, plank), { x: sx, y: floorY + wallH + 1.5, z: sz }));
  g.add(place(gableRoof({ w: 1.4, d: 0.5, h: 0.3, overhang: 0.15, ridge: 'x', material: tin, gableMaterial: plank }), { x: sx, y: floorY + wallH + 1.9, z: sz }));
  // trim
  const trim = mat(PALETTE.white);
  for (const dx of [-sw / 2, sw / 2]) for (const dz of [-sd / 2, sd / 2]) {
    g.add(place(box(0.14, wallH, 0.14, trim), { x: sx + dx, y: floorY, z: sz + dz }));
  }
  const fz = sz + sd / 2; // front wall
  // sliding door (sheep come up the ramp here) + shearing-board windows
  const doorX = 2.9;
  g.add(place(box(1.4, 2.05, 0.08, mat('#5d4a33')), { x: doorX, y: floorY, z: fz + 0.04 }));
  g.add(place(box(1.5, 0.12, 0.1, mat(PALETTE.steelDark)), { x: doorX + 0.6, y: floorY + 2.1, z: fz + 0.08 }));
  g.add(place(box(1.4, 2.05, 0.06, mat('#7a6246')), { x: doorX + 1.45, y: floorY, z: fz + 0.11 }));
  for (const [a, b] of [[0, 1], [1, 0]]) {
    const L = Math.hypot(1.3, 1.9);
    g.add(place(box(L, 0.1, 0.04, mat('#5d4a33')), { x: doorX + 1.45, y: floorY + 1.02 - 0.05, z: fz + 0.15, rz: (a - b) * (Math.atan2(1.9, 1.3) * 180) / Math.PI }));
  }
  for (const wx of [0.95, 5.2, 6.1]) g.add(place(windowPanel({ w: 0.65, h: 0.75 }), { x: wx, y: floorY + 1.05, z: fz }));
  for (const wx of [1.5, 3.7, 5.9]) g.add(place(windowPanel({ w: 0.9, h: 0.75 }), { x: wx, y: floorY + 1.05, z: sz - sd / 2, ry: 180 }));
  g.add(place(windowPanel({ w: 0.7, h: 0.75 }), { x: sx - sw / 2, y: floorY + 1.05, z: sz - 0.6, ry: -90 }));
  g.add(place(windowPanel({ w: 0.7, h: 0.75 }), { x: sx - sw / 2, y: floorY + 1.05, z: sz + 0.6, ry: -90 }));
  // farm name painted on the front roof slope
  {
    const S = sd / 2, rh = 1.7, t = 0.12, slope = Math.atan2(rh, S);
    const a = (90 - (slope * 180) / Math.PI);
    g.add(place(bigSign({ text: 'WOOL SHED', w: 4.4, h: 1.25, bg: '#7b2f22', fg: '#f6efd8', border: '#f6efd8', depth: 0.04 }),
      { x: sx - 0.2, y: floorY + wallH + t * rh + 0.03, z: sz + S - t * S + 0.03, rx: -a }));
  }
  // count-out chutes: shorn sheep slide out of portholes into the pen below
  for (const cx of [5.0, 6.0]) {
    g.add(place(box(0.5, 0.5, 0.06, mat('#3a2e22')), { x: cx, y: floorY + 0.05, z: fz + 0.01 }));
    g.add(place(box(0.55, 0.06, 1.1, mat(PALETTE.steelLight, { metalness: 0.4 })), { x: cx, y: y0 + 0.42, z: fz + 0.45, rx: 35 }));
  }

  // bale store lean-to on the east end
  const lx0 = sx + sw / 2, lx1 = 9.7, lz0 = -4.65, lz1 = -1.1;
  const hiY = floorY + wallH, loY = y0 + 2.45;
  g.add(place(patch(lx1 - lx0, lz1 - lz0, 'concrete'), { x: (lx0 + lx1) / 2, y: y0, z: (lz0 + lz1) / 2 }));
  for (const pz of [lz0 + 0.1, (lz0 + lz1) / 2, lz1 - 0.1]) g.add(place(box(0.14, loY - y0, 0.14, mat(PALETTE.woodDark)), { x: lx1 - 0.1, y: y0, z: pz }));
  g.add(place(box(lx1 - lx0, hiY - y0 - 0.6, 0.12, plank), { x: (lx0 + lx1) / 2, y: y0, z: lz0 + 0.06 }));
  {
    const run = lx1 - lx0, drop = hiY - loY, L = Math.hypot(run, drop) + 0.3;
    const ang = Math.atan2(drop, run);
    g.add(place(box(L, 0.08, lz1 - lz0 + 0.4, tin), { x: (lx0 + lx1) / 2 + 0.1, y: (hiY + loY) / 2 - 0.04, z: (lz0 + lz1) / 2, rz: (-ang * 180) / Math.PI }));
  }
  // stacked bales
  const labels = ['MERINO', 'HOGGET', 'MERINO', 'LAMBS', 'MERINO', 'BELLY'];
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) {
    const bx = lx0 + 0.6 + i * 0.85, bz = -4.0 + j * 0.85;
    g.add(place(woolBale({ label: labels[(i + j * 3) % 6] }), { x: bx, y: y0 + 0.05, z: bz }));
    if (i < 2 || j === 0) g.add(place(woolBale({ label: labels[(i + j * 2 + 1) % 6] }), { x: bx, y: y0 + 1.05, z: bz }));
  }
  g.add(place(woolBale({ label: 'MERINO' }), { x: lx0 + 0.7, y: y0 + 0.05, z: -1.95, ry: 8 }));
  g.add(place(woolBale({ label: 'HOGGET' }), { x: lx0 + 1.55, y: y0 + 0.05, z: -2.0, ry: -6 }));

  // farm water tank on a stand at the west end of the shed
  g.add(place(box(1.3, 0.7, 1.3, mat(PALETTE.woodDark)), { x: 0.0, y: y0, z: -3.6 }));
  g.add(place(tank({ radius: 0.55, h: 1.5, roof: 'cone', material: surface('corrugated', '#b9c0c4', { size: 0.5, metalness: 0.3 }) }), { x: 0.0, y: y0 + 0.7, z: -3.6 }));

  // ------------------------------------------------------------ sheep yards
  g.add(place(patch(10.2, 6.1, surface('gravel', '#9a7f5c', { size: 3 })), { x: 4.85, y: y0, z: 1.75 }));
  g.add(place(patch(6.3, 3.0, surface('gravel', PALETTE.mud, { size: 2 })), { x: 3.2, y: y0 + 0.01, z: 2.95 }));
  // ramp up to the shed door
  const rz0 = fz, rz1 = 1.45, rw = 1.1, rampL = Math.hypot(rz1 - rz0, 0.8);
  const rAng = (Math.atan2(0.8, rz1 - rz0) * 180) / Math.PI;
  g.add(place(box(rw, 0.1, rampL, mat(PALETTE.wood)), { x: doorX, y: y0 + 0.4 - 0.05, z: (rz0 + rz1) / 2, rx: rAng }));
  for (const sxo of [-rw / 2, rw / 2]) {
    g.add(place(box(0.06, 0.06, rampL, mat('#a88a5f')), { x: doorX + sxo, y: y0 + 1.2, z: (rz0 + rz1) / 2, rx: rAng }));
    g.add(place(box(0.06, 0.06, rampL, mat('#a88a5f')), { x: doorX + sxo, y: y0 + 0.85, z: (rz0 + rz1) / 2, rx: rAng }));
    for (const t of [0.15, 0.5, 0.85]) g.add(place(box(0.08, 0.9 + 0.8 * (1 - t), 0.08, mat(PALETTE.woodDark)), { x: doorX + sxo, y: y0, z: rz0 + (rz1 - rz0) * t }));
  }
  for (const z of [0.55, -0.35]) {
    const t = (z - rz0) / (rz1 - rz0);
    const climber = new THREE.Group().add(place(sheep({}), { ry: 90 }));
    g.add(place(climber, { x: doorX, y: y0 + 0.8 * (1 - t), z, rx: rAng }));
  }

  // holding pens
  const px0 = 0.2, px1 = 6.2, pz0 = 1.45, pz1 = 4.45;
  const hc = [[px0, pz0], [px1, pz0], [px1, pz1], [px0, pz1]];
  g.add(hurdles([px0, pz0], [doorX - rw / 2, pz0]));
  g.add(hurdles([doorX + rw / 2, pz0], hc[1]));
  g.add(hurdles(hc[1], hc[2]));
  g.add(hurdles(hc[2], hc[3]));
  g.add(hurdles(hc[3], hc[0]));
  g.add(hurdles([2.2, pz0], [2.2, pz1]));
  g.add(hurdles([4.2, pz0], [4.2, pz1]));
  const penned = [
    [0.8, 2.0, 30], [1.6, 2.7, 200], [0.7, 3.5, 140], [1.6, 3.9, 80], [1.2, 2.9, 260, 1],
    [2.8, 2.2, 100], [3.6, 2.6, 280], [2.7, 3.2, 60], [3.6, 3.7, 180], [2.9, 4.0, 10, 1],
    [4.8, 2.1, 300], [5.6, 2.9, 120], [4.7, 3.4, 220], [5.6, 3.9, 30],
  ];
  for (const [x, z, ry, black] of penned) {
    g.add(place(sheep(black ? { wool: '#3b3632', face: '#1a1716' } : {}), { x, y: y0, z, ry }));
  }
  // count-out pen with freshly shorn sheep
  g.add(hurdles([4.5, fz + 0.05], [4.5, 1.35], { h: 0.9 }));
  g.add(hurdles([6.5, fz + 0.05], [6.5, 1.35], { h: 0.9 }));
  g.add(place(sheep({ shorn: true }), { x: 5.1, y: y0, z: 0.7, ry: 200 }));
  g.add(place(sheep({ shorn: true, graze: true }), { x: 5.9, y: y0, z: 0.3, ry: 340 }));
  // trough and grain bin by the pens
  g.add(place(trough({ w: 1.3 }), { x: 1.2, y: y0, z: 0.3 }));
  g.add(place(box(0.5, 0.6, 0.5, mat(PALETTE.steelDark)), { x: 0.3, y: y0, z: -0.2 }));

  // shepherd and sheepdog working the pens
  g.add(place(shepherd(), { x: 6.8, y: y0, z: 3.2, ry: 160 }));
  g.add(place(sheepdog(), { x: 3.4, y: y0, z: 4.8, ry: 180 }));
  g.add(place(sheepdog({ pose: 'lie' }), { x: 1.1, y: y0, z: 4.75, ry: 10 }));

  // farm ute loaded with bales, parked in the yard
  g.add(place(patch(2.6, 5.6, 'gravel'), { x: 8.5, y: y0, z: 1.9 }));
  const u = ute();
  u.add(place(woolBale({ label: 'MERINO' }), { x: -0.5, y: 0.78 }));
  u.add(place(woolBale({ label: 'LAMBS' }), { x: -1.4, y: 0.78, ry: 6 }));
  g.add(place(u, { x: 8.5, y: y0, z: 2.0, ry: 90 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: 9.4, y: y0, z: -0.4 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, place, mat, metal, surface, gableRoof,
  tree, car, bench,
} from '../../src/lib/index.js';
import {
  yurt, boardwalk, campfire, logSeat, railFence, postLantern, fairyLights,
  bigSign, headingTo, deckChair, rod,
} from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// A ring of felt yurts on timber decks round a campfire pit, boardwalks,
// a timber wash hut and a small gravel car park.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  const fire = [-1.6, 0.8];
  const plazaR = 1.9;

  // --- yurts in a ring, doors facing the fire --------------------------------
  const yurts = [
    { x: -7.3, z: 1.6, color: PALETTE.red },
    { x: -6.0, z: -2.6, color: PALETTE.blue },
    { x: -1.7, z: -3.15, color: PALETTE.orange },
    { x: 2.6, z: -2.7, color: PALETTE.green },
    { x: 4.3, z: 2.0, color: PALETTE.purple },
  ];
  const r = 1.5;
  const porchReach = r + 0.9; // centre of yurt -> far edge of porch
  yurts.forEach((u, i) => {
    const dx = fire[0] - u.x, dz = fire[1] - u.z;
    const dist = Math.hypot(dx, dz);
    const ux = dx / dist, uz = dz / dist;
    g.add(place(yurt({ r, color: u.color, seed: i }), { x: u.x, y: y0, z: u.z, ry: headingTo(dx, dz) }));
    // boardwalk from the porch to the fire circle
    const a = [u.x + ux * (porchReach - 0.05), u.z + uz * (porchReach - 0.05)];
    const b = [fire[0] - ux * (plazaR - 0.1), fire[1] - uz * (plazaR - 0.1)];
    if (Math.hypot(b[0] - a[0], b[1] - a[1]) > 0.3 && dist > porchReach + plazaR - 0.1) g.add(boardwalk(a, b, 0.9, y0));
  });

  // --- campfire circle ---------------------------------------------------------
  g.add(place(cylinder(plazaR, plazaR, 0.05, surface('gravel', PALETTE.sand, { size: 2 }), 20), { x: fire[0], y: y0, z: fire[1] }));
  g.add(place(campfire(), { x: fire[0], y: y0 + 0.05, z: fire[1] }));
  // log seats between the boardwalks
  const dirs = yurts.map((u) => Math.atan2(u.x - fire[0], u.z - fire[1])).concat([0]).sort((p, q) => p - q);
  for (let i = 0; i < dirs.length; i++) {
    const a0 = dirs[i], a1 = i + 1 < dirs.length ? dirs[i + 1] : dirs[0] + Math.PI * 2;
    const mid = (a0 + a1) / 2;
    g.add(place(logSeat(1.0), { x: fire[0] + Math.sin(mid) * 1.4, y: y0 + 0.05, z: fire[1] + Math.cos(mid) * 1.4, ry: (mid * 180) / Math.PI }));
  }

  // --- entrance: boardwalk from the street + log arch with sign --------------
  g.add(boardwalk([fire[0], 5.0], [fire[0], fire[1] + plazaR - 0.1], 1.2, y0));
  const gateZ = 4.3;
  const logM = mat(PALETTE.trunk);
  for (const s of [-1, 1]) {
    g.add(place(cylinder(0.14, 0.16, 3.0, logM, 8), { x: fire[0] + s * 1.6, y: y0, z: gateZ }));
    g.add(place(postLantern(1.0), { x: fire[0] + s * 0.85, y: y0, z: 4.7 }));
  }
  const beam = cylinder(0.13, 0.13, 3.8, logM, 8);
  g.add(place(beam, { x: fire[0] - 1.9, y: y0 + 2.95, z: gateZ, rz: -90 }));
  g.add(place(bigSign({ text: 'YURT CAMP', w: 2.9, h: 0.62, bg: '#2f5a32', fg: '#f6e7b8', border: '#f6e7b8' }), { x: fire[0], y: y0 + 2.12, z: gateZ + 0.08 }));
  for (const s of [-1, 1]) g.add(place(box(0.05, 0.25, 0.05, mat(PALETTE.black)), { x: fire[0] + s * 1.1, y: y0 + 2.72, z: gateZ + 0.08 }));

  // fairy lights from the arch to the yurts on either side
  g.add(fairyLights([fire[0] - 1.6, y0 + 2.9, gateZ], [yurts[0].x + 1.2, y0 + 2.0, yurts[0].z + 0.6], 0.5, 9));
  g.add(fairyLights([fire[0] + 1.6, y0 + 2.9, gateZ], [yurts[4].x - 1.2, y0 + 2.0, yurts[4].z + 0.6], 0.4, 7));

  // --- wash hut (timber, tin gable roof), doors facing the camp (-x) ---------
  const hx = 8.1, hz = -2.7, hw = 3.0, hd = 3.4, hh = 2.5;
  const clad = surface('planks', PALETTE.woodDark, { size: 1.5 });
  const trim = mat(PALETTE.wood);
  g.add(place(box(hw + 0.3, 0.25, hd + 0.3, mat(PALETTE.concrete)), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw, hh, hd, clad), { x: hx, y: y0 + 0.25, z: hz }));
  for (const [cx, cz] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) g.add(place(box(0.14, hh, 0.14, trim), { x: hx + cx * hw / 2, y: y0 + 0.25, z: hz + cz * hd / 2 }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 1.0, overhang: 0.35, ridge: 'z', material: surface('corrugated', PALETTE.roofGreen, { size: 1 }), gableMaterial: clad }), { x: hx, y: y0 + 0.25 + hh, z: hz }));
  const doorColors = [PALETTE.blue, PALETTE.red];
  [-0.8, 0.8].forEach((dz, i) => {
    g.add(place(box(0.12, 1.95, 0.85, mat(doorColors[i])), { x: hx - hw / 2 - 0.04, y: y0 + 0.25, z: hz + dz }));
    g.add(place(bigSign({ text: i ? 'SHOWER' : 'WC', w: 0.7, h: 0.28, bg: '#f1eee6', fg: '#232326', depth: 0.05 }), { x: hx - hw / 2 - 0.12, y: y0 + 2.3, z: hz + dz, ry: -90 }));
  });
  // vent slots on the back and side
  for (const dz of [-1.0, 0, 1.0]) g.add(place(box(0.06, 0.3, 0.6, mat(PALETTE.window)), { x: hx + hw / 2 + 0.02, y: y0 + 1.95, z: hz + dz }));
  // front gable: sign + outdoor wash basin
  g.add(place(bigSign({ text: 'WASH HUT', w: 2.3, h: 0.5, bg: '#f1eee6', fg: '#6b4a2b', border: '#6b4a2b' }), { x: hx, y: y0 + 1.75, z: hz + hd / 2 + 0.02 }));
  g.add(place(box(1.4, 0.85, 0.5, mat(PALETTE.stone)), { x: hx - 0.4, y: y0 + 0.25, z: hz + hd / 2 + 0.25 }));
  g.add(place(box(1.2, 0.06, 0.36, mat(PALETTE.steelLight)), { x: hx - 0.4, y: y0 + 1.08, z: hz + hd / 2 + 0.25 }));
  for (const sx of [-0.3, 0.3]) g.add(place(box(0.05, 0.35, 0.05, metal(PALETTE.chrome)), { x: hx - 0.4 + sx, y: y0 + 1.1, z: hz + hd / 2 + 0.07 }));
  // rooftop water tank
  const tankY = y0 + 0.25 + hh + 1.0;
  g.add(place(cylinder(0.32, 0.32, 1.3, metal(PALETTE.steelLight), 10), { x: hx, y: tankY + 0.3, z: hz - 1.3, rx: 90 }));
  for (const dz of [-0.95, -0.35]) g.add(place(box(0.5, 0.3, 0.12, mat(PALETTE.woodDark)), { x: hx, y: tankY - 0.05, z: hz + dz - 0.3 }));
  g.add(place(box(0.08, 3.1, 0.08, metal(PALETTE.steelDark)), { x: hx + hw / 2 + 0.05, y: y0, z: hz - 1.1 }));

  // --- car park (gravel) ------------------------------------------------------
  g.add(place(patch(3.5, 4.4, 'gravel'), { x: 8.15, y: y0, z: 2.75 }));
  g.add(place(car({ color: PALETTE.yellow }), { x: 7.3, y: y0 + 0.05, z: 2.8, ry: 90, s: 0.6 }));
  g.add(place(car({ color: PALETTE.plasterBlue, kind: 'van' }), { x: 9.0, y: y0 + 0.05, z: 2.6, ry: 90, s: 0.6 }));
  // canoe on the van roof
  const canoe = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 2.6, 8, 1), mat(PALETTE.red));
  canoe.scale.set(1, 1, 0.6);
  g.add(place(canoe, { x: 9.0, y: y0 + 1.45, z: 2.5, rx: 90 }));
  for (const sx of [-1, 1]) g.add(place(box(0.08, 0.6, 0.08, mat(PALETTE.woodDark)), { x: 6.45, y: y0, z: 2.75 + sx * 2.1 }));

  // --- props ------------------------------------------------------------------
  // hammock between two trees, front-left
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 21 }), { x: -8.8, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 22 }), { x: -5.6, y: y0, z: 3.95 }));
  const hammock = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 2.2, 10, 1, true, Math.PI * 0.5, Math.PI), mat(PALETTE.orange, { side: THREE.DoubleSide }));
  g.add(place(hammock, { x: -7.2, y: y0 + 0.95, z: 3.92, rz: 90 }));
  g.add(rod([-8.6, y0 + 1.5, 3.9], [-8.4, y0 + 1.05, 3.92], 0.04, mat(PALETTE.beige)));
  g.add(rod([-6.0, y0 + 1.05, 3.92], [-5.8, y0 + 1.5, 3.95], 0.04, mat(PALETTE.beige)));

  // firewood stack under a little lean-to, front of the ring
  const wx = -4.4, wz = 4.4;
  for (let row = 0; row < 3; row++) for (let i = 0; i < 5 - row; i++) {
    const lg = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.11, 0.8, 6), [mat(PALETTE.wood), mat(PALETTE.woodLight), mat(PALETTE.woodLight)]);
    g.add(place(lg, { x: wx - 0.44 + i * 0.22 + row * 0.11, y: y0 + 0.11 + row * 0.19, z: wz, rx: 90 }));
  }

  // picnic table, front-right of the ring
  const ptM = mat(PALETTE.woodLight);
  const px = 1.1, pz = 4.05;
  g.add(place(box(1.6, 0.06, 0.7, ptM), { x: px, y: y0 + 0.72, z: pz }));
  for (const s of [-1, 1]) {
    g.add(place(box(1.6, 0.05, 0.28, ptM), { x: px, y: y0 + 0.42, z: pz + s * 0.55 }));
    g.add(place(box(0.08, 0.72, 1.3, mat(PALETTE.wood)), { x: px + s * 0.6, y: y0, z: pz }));
  }
  g.add(place(box(0.2, 0.25, 0.2, mat(PALETTE.red)), { x: px - 0.3, y: y0 + 0.78, z: pz }));
  g.add(place(deckChair(PALETTE.red), { x: 2.6, y: y0, z: 4.2, ry: -30 }));

  // split-rail fence along the street and the back, gaps for the gate and car park
  g.add(place(railFence(6.9), { x: -6.45, y: y0, z: 4.9 }));
  g.add(place(railFence(3.6), { x: 1.95, y: y0, z: 4.9 }));
  g.add(place(railFence(16.0), { x: -1.9, y: y0, z: -4.9 }));
  g.add(place(railFence(9.6), { x: -9.88, y: y0, z: 0.0, ry: 90 }));

  // trees and bushes around the edges
  g.add(place(tree({ kind: 'cone', h: 4.6, seed: 31 }), { x: -8.5, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'cone', h: 4.0, seed: 32 }), { x: -3.9, y: y0, z: -3.9 }));
  g.add(place(tree({ kind: 'cone', h: 4.4, seed: 33 }), { x: 0.45, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'cone', h: 4.4, seed: 34 }), { x: 5.3, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 35 }), { x: -9.2, y: y0, z: -1.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 36 }), { x: 5.9, y: y0, z: -0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 37 }), { x: -3.4, y: y0, z: -0.2 }));
  g.add(place(bench({ w: 1.3 }), { x: 6.1, y: y0, z: -4.3, ry: 90 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, parapet, door, car, mat, metal, glass, emissive, surface, pipeRun, beam, tree,
} from '../../src/lib/index.js';
import { bigSign, panelWall, securityFence, gateLeaf, chiller, generator, fuelTank, cctvPole } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Windowless server hall on the left, generator yard and fuel bund on the right,
// all inside a double security fence with a gate in the middle of the front.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // --- ground: concrete compound inside the inner fence, asphalt gate lane
  g.add(place(patch(17.8, 7.8, 'concrete'), { y: y0 }));
  g.add(place(patch(3.2, 1.2, 'asphalt'), { y: y0, z: 4.4 }));
  g.add(place(patch(10.4, 2.3, 'asphalt'), { x: -3.3, y: y0 + 0.01, z: 2.75 }));

  // --- server hall: windowless precast-concrete box
  const hx = -3.3, hz = -0.9, hw = 10.2, hd = 5.0, hh = 5.8;
  const wall = panelWall('#a7abaf');
  const roof = mat('#8e9297');
  const hy = y0 + 0.05;
  g.add(place(box(hw + 0.1, 0.45, hd + 0.1, mat(PALETTE.concreteDark)), { x: hx, y: hy, z: hz }));
  g.add(place(box(hw, hh, hd, [wall, wall, roof, roof, wall, wall]), { x: hx, y: hy, z: hz }));
  g.add(place(box(hw + 0.06, 0.35, hd + 0.06, mat('#2f6fa8')), { x: hx, y: hy + hh - 1.1, z: hz }));
  g.add(place(parapet({ w: hw, d: hd, h: 0.55, t: 0.25, material: mat('#9a9ea3') }), { x: hx, y: hy + hh, z: hz }));
  const front = hz + hd / 2, back = hz - hd / 2, right = hx + hw / 2, left = hx - hw / 2;

  // big sign on the front wall
  g.add(place(bigSign({ text: 'TINY DATA CENTRE', w: 6.4, h: 1.0, bg: '#1f3f66', fg: '#ffffff' }), { x: hx + 0.6, y: hy + 3.62, z: front + 0.08 }));
  g.add(place(box(1.0, 1.0, 0.1, emissive('#59c3ff', 0.7)), { x: hx - 3.2, y: hy + 3.62, z: front + 0.06 }));

  // intake louvres: a row along the back, a pair on each end
  const louvre = surface('corrugated', '#4a4f55', { size: 0.3 });
  const louvreFrame = mat('#6e7378');
  for (let i = 0; i < 5; i++) {
    const x = left + 1.3 + i * 1.9;
    g.add(place(box(1.4, 1.6, 0.12, louvreFrame), { x, y: hy + 1.0, z: back - 0.02 }));
    g.add(place(box(1.2, 1.4, 0.16, louvre), { x, y: hy + 1.1, z: back - 0.02 }));
  }
  for (const [x, s] of [[left, -1], [right, 1]]) {
    for (const z of [hz - 1.2, hz + 1.2]) {
      g.add(place(box(0.12, 1.6, 1.4, louvreFrame), { x: x + s * 0.02, y: hy + 3.2, z }));
      g.add(place(box(0.16, 1.4, 1.2, louvre), { x: x + s * 0.02, y: hy + 3.3, z }));
    }
  }

  // loading bay: roller shutter with a canopy and hazard-striped bumpers
  const shutter = surface('corrugated', PALETTE.lightGrey, { size: 0.3 });
  g.add(place(box(3.2, 3.2, 0.1, mat(PALETTE.darkGrey)), { x: hx - 3.6, y: hy, z: front + 0.02 }));
  g.add(place(box(2.9, 3.0, 0.14, shutter), { x: hx - 3.6, y: hy, z: front + 0.02 }));
  g.add(place(box(3.6, 0.15, 1.2, metal(PALETTE.steelDark)), { x: hx - 3.6, y: hy + 3.4, z: front + 0.6 }));
  for (const dx of [-1.55, 1.55]) {
    g.add(place(box(0.3, 1.0, 0.3, surface('hazard', PALETTE.yellow, { size: 0.5 })), { x: hx - 3.6 + dx, y: y0, z: front + 0.2 }));
  }

  // secure entrance: small glazed airlock vestibule
  const vx = 0.0, vw = 2.4, vd = 1.3, vh = 3.0;
  g.add(place(box(vw, vh, vd, mat('#8f9398')), { x: vx, y: hy, z: front + vd / 2 }));
  g.add(place(box(1.6, 2.3, 0.08, glass(PALETTE.glassDark)), { x: vx, y: hy, z: front + vd + 0.01 }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.glassBlue, frame: PALETTE.steelDark }), { x: vx, y: hy, z: front + vd }));
  g.add(place(box(vw + 0.4, 0.2, vd + 0.6, mat(PALETTE.steelDark)), { x: vx, y: hy + vh, z: front + vd / 2 + 0.25 }));
  g.add(place(box(0.5, 0.7, 0.12, mat(PALETTE.darkGrey)), { x: vx + 1.0, y: hy + 1.0, z: front + vd + 0.03 }));
  g.add(place(box(0.2, 0.2, 0.13, emissive('#4cff7a', 0.8)), { x: vx + 1.0, y: hy + 1.35, z: front + vd + 0.04 }));

  // wall-mounted cameras at the hall corners
  const camM = mat(PALETTE.offWhite);
  for (const [x, z, ry] of [[left + 0.3, front + 0.25, -135], [right - 0.3, front + 0.25, -45], [left + 0.3, back - 0.25, 135], [right - 0.3, back - 0.25, 45]]) {
    g.add(place(box(0.45, 0.2, 0.2, camM), { x, y: hy + 4.4, z, ry }));
  }

  // --- roof: two rows of air-cooled chillers on a pipe header
  const ry = hy + hh;
  for (const z of [hz - 1.3, hz + 1.0]) {
    for (let i = 0; i < 4; i++) {
      g.add(place(chiller({ len: 2.1, d: 1.3, h: 0.9, fans: 2 }), { x: left + 1.35 + i * 2.4, y: ry, z }));
    }
  }
  const pipeM = mat(PALETTE.white, { roughness: 0.6 });
  const pipeZ = hz - 0.15;
  for (const dz of [-0.18, 0.18]) {
    g.add(pipeRun([[left + 0.5, ry + 0.35, pipeZ + dz], [right - 0.6, ry + 0.35, pipeZ + dz], [right - 0.6, ry + 0.35, hz - 1.95 + dz * 0]], 0.12, pipeM));
  }
  for (let i = 0; i < 5; i++) g.add(place(box(0.2, 0.3, 0.6, metal(PALETTE.steelDark)), { x: left + 0.8 + i * 2.2, y: ry, z: pipeZ }));
  g.add(place(box(1.2, 1.2, 1.0, mat('#9a9ea3')), { x: right - 0.9, y: ry, z: hz + 2.0 - 0.1 }));
  g.add(place(box(0.8, 1.8, 0.06, mat(PALETTE.steelDark)), { x: right - 0.9, y: ry, z: hz + 2.0 - 0.6 }));

  // --- generator yard: three containerised diesel gensets
  const gz = -1.6;
  const genXs = [3.3, 5.5, 7.7];
  genXs.forEach((x, i) => g.add(place(generator({ w: 1.8, h: 2.2, d: 3.4, color: '#e2b43a', seed: i }), { x, y: y0, z: gz })));
  // cable tray from the gensets into the hall
  const trayY = y0 + 3.0, trayZ = -3.55;
  g.add(place(box(8.6 - right, 0.12, 0.5, metal(PALETTE.steel)), { x: (right + 8.6) / 2, y: trayY, z: trayZ }));
  for (const x of genXs) {
    g.add(place(box(0.1, trayY - y0, 0.1, metal(PALETTE.steelDark)), { x: x + 1.05, y: y0, z: trayZ }));
    g.add(beam([x, y0 + 2.4, gz - 1.7], [x, trayY + 0.06, trayZ], 0.14, mat(PALETTE.black)));
  }
  g.add(place(box(0.5, 0.6, 0.35, mat(PALETTE.steelLight)), { x: right + 0.18, y: trayY - 0.3, z: trayZ }));

  // --- fuel bund: low concrete wall around two horizontal diesel tanks
  const bx = 6.1, bz = 2.25, bw = 5.0, bd = 3.0;
  g.add(place(box(bw, 0.06, bd, mat(PALETTE.concreteDark)), { x: bx, y: y0, z: bz }));
  g.add(place(parapet({ w: bw, d: bd, h: 0.5, t: 0.18, material: mat(PALETTE.concrete) }), { x: bx, y: y0, z: bz }));
  for (const z of [bz - 0.72, bz + 0.72]) g.add(place(fuelTank({ len: 3.8, r: 0.58, color: PALETTE.offWhite }), { x: bx, y: y0, z }));
  for (const x of genXs) {
    g.add(pipeRun([[x - 0.5, y0 + 0.2, bz - bd / 2 - 0.05], [x - 0.5, y0 + 0.2, gz + 1.85]], 0.05, mat(PALETTE.yellow)));
  }
  g.add(place(bigSign({ text: 'DIESEL', w: 1.3, h: 0.4, bg: PALETTE.red, fg: '#ffffff' }), { x: bx - 1.2, y: y0 + 0.08, z: bz + bd / 2 + 0.01 }));

  // --- guard booth at the gate
  const gbx = 2.6, gbz = 3.0;
  g.add(place(box(1.4, 0.15, 1.4, mat(PALETTE.concreteDark)), { x: gbx, y: y0, z: gbz }));
  g.add(place(box(1.2, 2.3, 1.2, mat(PALETTE.offWhite)), { x: gbx, y: y0 + 0.15, z: gbz }));
  g.add(place(box(1.24, 0.9, 1.0, glass(PALETTE.glassDark)), { x: gbx, y: y0 + 1.2, z: gbz }));
  g.add(place(box(1.0, 0.9, 1.24, glass(PALETTE.glassDark)), { x: gbx, y: y0 + 1.2, z: gbz }));
  g.add(place(box(1.7, 0.18, 1.7, mat(PALETTE.roofSlate)), { x: gbx, y: y0 + 2.45, z: gbz }));

  // --- double security fence: mesh + barbed-wire arms outside, razor coil inside
  const gate = 1.6;
  const ring = (X, Z) => [[-gate, Z], [-X, Z], [-X, -Z], [X, -Z], [X, Z], [gate, Z]];
  const og = new THREE.Group();
  og.add(securityFence(ring(9.7, 4.7), { h: 2.3, top: 'arms', out: -1 }));
  og.add(securityFence(ring(8.9, 3.9), { h: 2.3, top: 'razor', out: -1 }));
  // outer gate slid open behind the fence, inner gate closed
  og.add(place(gateLeaf({ w: 3.2, h: 2.2 }), { x: -gate - 1.6, z: 4.85 }));
  og.add(place(gateLeaf({ w: 3.2, h: 2.2 }), { x: 0, z: 3.9 }));
  g.add(place(og, { y: y0 }));
  // barrier arm in the outer gate
  g.add(place(box(0.3, 1.1, 0.3, mat(PALETTE.offWhite)), { x: gate + 0.25, y: y0, z: 4.3 }));
  g.add(place(box(3.1, 0.1, 0.1, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.8 })), { x: 0.05, y: y0 + 0.95, z: 4.3 }));
  g.add(place(bigSign({ text: 'AUTHORISED ONLY', w: 1.5, h: 0.45, bg: PALETTE.white, fg: PALETTE.red, border: PALETTE.red }), { x: 3.4, y: y0 + 1.1, z: 4.72 }));

  // floodlit CCTV poles at the compound corners
  g.add(place(cctvPole({ h: 4.2 }), { x: -8.6, y: y0, z: 3.6, ry: -45 }));
  g.add(place(cctvPole({ h: 4.2 }), { x: -8.6, y: y0, z: -3.65, ry: 45 }));
  g.add(place(cctvPole({ h: 4.2 }), { x: 2.0, y: y0, z: -3.65, ry: 135 }));

  // vehicles: engineer's van at the loading bay, staff car by the entrance
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: hx - 3.4, y: y0 + 0.05, z: 2.85, ry: 180, s: 0.8 }));
  g.add(place(car({ color: PALETTE.blue }), { x: hx + 0.4, y: y0 + 0.05, z: 2.85, s: 0.8 }));

  // a few shrubs in the corners of the buffer strip
  for (const [x, z, s] of [[-9.3, 4.3, 1], [9.3, 4.3, 2], [9.3, -4.3, 3], [-9.3, -4.3, 4]]) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z }));
  }
  return g;
}

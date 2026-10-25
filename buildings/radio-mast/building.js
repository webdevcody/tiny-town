import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, lattice, beam, box, cylinder, sphere, place, group, mat, metal, emissive,
  antenna, door, sign, fence, car, tree, streetLamp, tank,
} from '../../src/lib/index.js';

const MAST_W = 1.9;        // lattice face width
const BAND = 4.6;           // height of each red / white band
const BANDS = 9;           // odd, so the top and bottom bands are red
const MAST_H = BAND * BANDS;
const GUY_LEVELS = [14, 28, MAST_H - 1];
const ANCHOR = 3.9;        // guy anchors sit on the lot diagonals

// Microwave dish: white drum facing +z with a grey back shell.
function dish(r = 0.6) {
  const white = mat(PALETTE.white, { roughness: 0.5 });
  return group(
    place(cylinder(r, r, 0.3, white, 14), { rx: 90, z: 0.15 }),
    place(cylinder(r * 0.55, r * 0.9, 0.25, mat(PALETTE.lightGrey), 14), { rx: -90, z: -0.15 }),
    place(box(0.12, 0.12, 0.5, metal(PALETTE.steelDark)), { y: -0.06, z: -0.55 }),
  );
}

// Square service platform with a simple railing, origin at the deck top.
function platform(s) {
  const grate = metal(PALETTE.steelDark);
  const g = group(place(box(s, 0.12, s, grate), { y: -0.12 }));
  const h = s / 2;
  const P = [[-h, -h], [h, -h], [h, h], [-h, h]];
  for (let i = 0; i < 4; i++) {
    const [ax, az] = P[i], [bx, bz] = P[(i + 1) % 4];
    g.add(beam([ax, 0.9, az], [bx, 0.9, bz], 0.06, grate));
    g.add(beam([ax, 0, az], [ax, 0.9, az], 0.06, grate));
  }
  return g;
}

function beacon() {
  return sphere(0.22, emissive(PALETTE.red, 1.4), 8);
}

// 1x1 tile (10 x 10 m). Front (gate) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));
  g.add(place(patch(9.4, 9.4, 'gravel'), { y: y0 }));
  g.add(place(patch(1.6, 4.0, 'concrete'), { y: y0, z: 2.9 }));

  // --- the mast: banded lattice on a concrete footing ---
  const red = mat(PALETTE.red, { roughness: 0.6 });
  const white = mat(PALETTE.white, { roughness: 0.6 });
  g.add(place(box(2.4, 0.4, 2.4, mat(PALETTE.concrete)), { y: y0 }));
  const my = y0 + 0.4;
  for (let i = 0; i < BANDS; i++) {
    g.add(place(lattice({ w: MAST_W, h: BAND, segments: 3, thickness: 0.22, material: i % 2 ? white : red }), { y: my + i * BAND }));
  }
  const top = my + MAST_H;

  // service platforms + obstruction beacons on the corners
  for (const lv of [14, 28]) {
    g.add(place(platform(2.4), { y: my + lv }));
    for (const [sx, sz] of [[1, 1], [-1, -1]]) g.add(place(beacon(), { x: sx * 1.1, y: my + lv + 0.1, z: sz * 1.1 }));
  }
  g.add(place(platform(2.6), { y: top }));

  // sector panel antennas on all four faces near the top
  const panelM = mat(PALETTE.offWhite, { roughness: 0.5 });
  for (const [x, z, ry] of [[0, 1, 0], [0, -1, 0], [1, 0, 90], [-1, 0, 90]]) {
    for (const o of [-0.45, 0.45]) {
      const px = x * 1.05 + (z ? o : 0), pz = z * 1.05 + (x ? o : 0);
      g.add(place(box(0.38, 1.8, 0.16, panelM), { x: px, y: top - 3.2, z: pz, ry }));
    }
  }
  // microwave dishes pointing different ways
  g.add(place(dish(0.65), { x: 0.2, y: my + 24, z: 1.2 }));
  g.add(place(dish(0.55), { x: 1.2, y: my + 33, z: -0.2, ry: 90 }));
  g.add(place(dish(0.55), { x: -1.2, y: my + 21, z: 0.3, ry: -90 }));
  g.add(place(dish(0.5), { x: -0.2, y: my + 37, z: -1.15, ry: 180 }));

  // top spike with beacon, plus a red beacon on the deck
  g.add(place(cylinder(0.25, 0.3, 1.0, red, 8), { y: top }));
  g.add(place(antenna({ h: 6, radius: 0.14, material: white }), { y: top + 1.0 }));
  g.add(place(beacon(), { x: 1.15, y: top + 0.1, z: 1.15 }));
  g.add(place(beacon(), { x: -1.15, y: top + 0.1, z: -1.15 }));

  // --- guy wires to four anchor blocks on the diagonals ---
  const wireM = mat(PALETTE.darkGrey);
  const anchorM = mat(PALETTE.concreteDark);
  const h = MAST_W / 2;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    const ax = sx * ANCHOR, az = sz * ANCHOR;
    g.add(place(box(0.9, 0.35, 0.9, anchorM), { x: ax, y: y0, z: az }));
    g.add(place(box(0.25, 0.3, 0.25, metal(PALETTE.steel)), { x: ax, y: y0 + 0.35, z: az }));
    for (const lv of GUY_LEVELS) {
      g.add(beam([ax, y0 + 0.6, az], [sx * h, my + lv, sz * h], 0.09, wireM));
    }
  }

  // --- equipment hut (left), linked to the mast by a cable bridge ---
  const hx = -3.2, hz = -0.3, hw = 2.6, hd = 3.4, hh = 2.6;
  g.add(place(box(hw + 0.3, 0.2, hd + 0.3, mat(PALETTE.concrete)), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw, hh, hd, mat(PALETTE.cream)), { x: hx, y: y0 + 0.2, z: hz }));
  g.add(place(box(hw + 0.4, 0.25, hd + 0.4, mat(PALETTE.roofGrey)), { x: hx, y: y0 + 0.2 + hh, z: hz }));
  g.add(place(door({ w: 1.0, h: 2.0, color: PALETTE.steelDark, frame: PALETTE.white }), { x: hx, y: y0 + 0.2, z: hz + hd / 2 }));
  g.add(place(sign({ text: '⚡ DANGER', w: 0.9, h: 0.35, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.05 }), { x: hx + 0.95, y: y0 + 1.5, z: hz + hd / 2 + 0.03 }));
  // louvred vents + AC unit on the back wall
  for (const vz of [-1.0, 0.4]) g.add(place(box(0.08, 0.5, 0.8, mat(PALETTE.steel)), { x: hx - hw / 2 - 0.04, y: y0 + 1.6, z: hz + vz }));
  g.add(place(box(1.0, 0.8, 0.5, mat(PALETTE.lightGrey)), { x: hx, y: y0 + 0.2, z: hz - hd / 2 - 0.25 }));
  g.add(place(cylinder(0.3, 0.3, 0.05, mat(PALETTE.darkGrey), 10), { x: hx, y: y0 + 0.5, z: hz - hd / 2 - 0.5, rx: 90 }));
  // cable bridge (ice bridge) from the hut wall to the mast
  const cb = y0 + 2.3, steel = metal(PALETTE.steel);
  g.add(place(box(1.4, 0.12, 0.5, steel), { x: -1.4, y: cb, z: 0 }));
  g.add(place(box(1.4, 0.05, 0.5, mat(PALETTE.roofGrey)), { x: -1.4, y: cb + 0.45, z: 0 }));
  for (const bz of [-0.22, 0.22]) g.add(place(box(0.08, cb - y0, 0.08, steel), { x: -1.1, y: y0, z: bz }));
  g.add(place(box(0.1, 0.12, 0.1, mat(PALETTE.black)), { x: -1.4, y: cb + 0.12, z: 0, s: 1 }));
  // cable tray up the mast leg
  g.add(place(box(0.12, MAST_H - 1, 0.25, metal(PALETTE.steelDark)), { x: -h - 0.06, y: my, z: 0 }));

  // --- yard: diesel tank, technician's van, lamp, fence, shrubs ---
  g.add(place(box(2.0, 0.2, 1.0, mat(PALETTE.concrete)), { x: 0.4, y: y0, z: -3.6 }));
  g.add(place(tank({ radius: 0.45, h: 1.8, roof: 'flat', material: mat(PALETTE.green, { roughness: 0.6 }) }), { x: 1.3, y: y0 + 0.65, z: -3.6, rz: 90 }));
  for (const sx of [-0.5, 0.5]) g.add(place(box(0.2, 0.25, 0.8, mat(PALETTE.darkGrey)), { x: 0.4 + sx, y: y0 + 0.2, z: -3.6 }));
  g.add(place(box(1.4, 1.1, 0.9, mat(PALETTE.yellow, { roughness: 0.5 })), { x: 2.5, y: y0, z: -3.3 }));
  g.add(place(box(0.7, 0.5, 0.05, mat(PALETTE.darkGrey)), { x: 2.5, y: y0 + 0.4, z: -2.83 }));

  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 3.0, y: y0 + 0.05, z: 0.6, ry: 90, s: 0.62 }));
  g.add(place(box(0.05, 0.12, 2.6, mat(PALETTE.red)), { x: 3.57, y: y0 + 0.45, z: 0.6 }));
  g.add(place(box(0.05, 0.12, 2.6, mat(PALETTE.red)), { x: 2.43, y: y0 + 0.45, z: 0.6 }));

  g.add(place(streetLamp({ h: 3.2 }), { x: 1.4, y: y0, z: 4.2, ry: 180 }));
  g.add(place(sign({ text: 'TINY FM', w: 1.6, h: 0.6, bg: PALETTE.red, fg: '#ffffff', depth: 0.06 }), { x: -2.2, y: y0 + 0.55, z: TILE / 2 - 0.22 }));
  g.add(place(fence({ w: TILE - 0.4, d: TILE - 0.4, h: 1.6, style: 'wire', gap: 2.0 }), { y: y0 }));
  // gate leaves, swung open
  const gateM = mat(PALETTE.steel);
  for (const sx of [-1, 1]) g.add(place(box(0.95, 1.4, 0.06, gateM), { x: sx * 1.0 - sx * 0.1, y: y0 + 0.1, z: TILE / 2 - 0.65, ry: sx * 70 }));

  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 2 }), { x: -4.2, y: y0, z: 3.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: 4.2, y: y0, z: -2.0 }));
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 4 }), { x: -1.9, y: y0, z: -4.1 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 5 }), { x: 3.2, y: y0, z: 4.2 }));
  return g;
}

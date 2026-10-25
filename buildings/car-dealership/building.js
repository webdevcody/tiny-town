import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, place, barrelRoof, sign, glass, mat, metal, emissive,
  tree, bench, door, surface,
} from '../../src/lib/index.js';
import { shinyCar, bunting, textSign } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Glass showroom with a curved roof at the back-left, display cars on the forecourt,
// a small side lot at the back-right, a brand pylon and bunting strung across.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  // ---- ground: polished concrete forecourt + white bay lines ----
  g.add(place(patch(19.6, 4.4, 'concrete'), { y: y0, z: 2.75 }));
  g.add(place(patch(6.6, 5.3, 'concrete'), { x: 6.5, y: y0, z: -2.3 }));
  const lineM = mat(PALETTE.white);
  for (let i = 0; i < 4; i++) g.add(place(box(0.1, 0.02, 3.8, lineM), { x: 3.4 + i * 2.1, y: y0 + 0.05, z: -2.7 }));
  // kerb along the street edge
  g.add(place(box(20, 0.12, 0.25, mat(PALETTE.lightGrey)), { y: y0, z: 4.85 }));

  // ---- showroom ----
  const sx = -3.5, sz = -2.2, sw = 12, sd = 5, sh = 4.2;
  const front = sz + sd / 2, back = sz - sd / 2, left = sx - sw / 2, right = sx + sw / 2;
  const frameM = metal(PALETTE.steelLight, { roughness: 0.3 });
  const paneM = glass(PALETTE.glassSky, { opacity: 0.42 });

  // floor slab (white tiles) and plinth
  g.add(place(box(sw + 0.3, 0.2, sd + 0.3, mat(PALETTE.white, { roughness: 0.4 })), { x: sx, y: y0, z: sz }));
  const fy = y0 + 0.2;

  // solid back wall with a service door and a small office block inside
  g.add(place(box(sw, sh, 0.3, mat(PALETTE.white)), { x: sx, y: fy, z: back + 0.15 }));
  g.add(place(box(3, 2.6, 1.6, mat(PALETTE.plasterBlue ?? PALETTE.cream)), { x: left + 1.7, y: fy, z: back + 1.1 }));
  g.add(place(door({ w: 1, h: 2.1, color: PALETTE.navy }), { x: left + 2.2, y: fy, z: back + 1.9 }));
  g.add(place(box(1.6, 0.8, 0.6, mat(PALETTE.woodDark)), { x: right - 2, y: fy, z: back + 1 })); // sales desk
  // outside of the back wall: workshop roller door, SERVICE sign, high windows, tyre stacks
  const rx = right - 2.6;
  g.add(place(box(3, 3, 0.08, mat(PALETTE.darkGrey)), { x: rx, y: fy, z: back - 0.04 }));
  g.add(place(box(2.7, 2.8, 0.1, surface('corrugated', PALETTE.steelLight, { size: 0.6 })), { x: rx, y: fy, z: back - 0.06, ry: 0 }));
  g.add(place(textSign({ text: 'SERVICE', w: 2.6, h: 0.55, bg: PALETTE.navy, fg: '#ffffff', depth: 0.06 }), { x: rx, y: fy + 3.25, z: back - 0.03, ry: 180 }));
  for (let i = 0; i < 4; i++) g.add(place(box(1.3, 0.7, 0.06, glass(PALETTE.glassBlue)), { x: left + 1.2 + i * 1.8, y: fy + 2.8, z: back - 0.02 }));
  g.add(place(door({ w: 1, h: 2.1, color: PALETTE.navy }), { x: left + 2.6, y: fy, z: back, ry: 180 }));
  for (const [tx, tz, n] of [[right + 0.55, back + 0.45, 4], [right + 0.55, back + 1.15, 3]]) {
    for (let k = 0; k < n; k++) g.add(place(cylinder(0.33, 0.33, 0.22, mat(PALETTE.black, { roughness: 0.8 }), 10), { x: tx, y: y0 + k * 0.23, z: tz }));
  }

  // glass curtain: front + both ends, steel mullions every ~2 m
  g.add(place(box(sw, sh, 0.06, paneM), { x: sx, y: fy, z: front - 0.05 }));
  g.add(place(box(0.06, sh, sd - 0.3, paneM), { x: left + 0.05, y: fy, z: sz + 0.15 }));
  g.add(place(box(0.06, sh, sd - 0.3, paneM), { x: right - 0.05, y: fy, z: sz + 0.15 }));
  for (let i = 0; i <= 6; i++) g.add(place(box(0.14, sh, 0.14, frameM), { x: left + (i * sw) / 6, y: fy, z: front - 0.05 }));
  for (const x of [left, right]) for (const t of [0.33, 0.66]) {
    g.add(place(box(0.14, sh, 0.14, frameM), { x, y: fy, z: back + t * sd }));
  }
  g.add(place(box(sw, 0.1, 0.12, frameM), { x: sx, y: fy + 2.6, z: front - 0.05 })); // transom
  // entrance: double doors with a dark frame
  g.add(place(box(2.1, 2.5, 0.1, mat(PALETTE.darkGrey)), { x: sx + 1, y: fy, z: front }));
  g.add(place(box(1.8, 2.35, 0.12, glass(PALETTE.glassDark)), { x: sx + 1, y: fy, z: front + 0.01 }));
  g.add(place(box(0.05, 2.35, 0.14, frameM), { x: sx + 1, y: fy, z: front + 0.01 }));

  // red fascia band with the brand name
  const fasciaY = fy + sh;
  g.add(place(box(sw + 0.4, 0.75, sd + 0.4, mat(PALETTE.red, { roughness: 0.5 })), { x: sx, y: fasciaY, z: sz }));
  g.add(place(textSign({ text: 'TINY MOTORS', w: 7.5, h: 0.66, bg: PALETTE.red, fg: '#ffffff', depth: 0.05 }), { x: sx, y: fasciaY + 0.045, z: sz + sd / 2 + 0.21 }));

  // curved (barrel) roof: silver shell with glazed lunette ends
  g.add(place(barrelRoof({ w: sw + 0.8, d: sd + 0.4, h: 1.7, axis: 'x', material: metal(PALETTE.aluminium ?? PALETTE.steelLight, { roughness: 0.3 }), endMaterial: glass(PALETTE.glassSky), segments: 10 }), { x: sx, y: fasciaY + 0.75, z: sz }));
  // roof ribs
  for (let i = 1; i < 6; i++) {
    const rib = barrelRoof({ w: 0.12, d: sd + 0.5, h: 1.75, axis: 'x', material: mat(PALETTE.white), endMaterial: mat(PALETTE.white), segments: 10 });
    g.add(place(rib, { x: left + (i * sw) / 6, y: fasciaY + 0.75, z: sz }));
  }

  // cars on display inside: one on a turntable
  g.add(place(cylinder(2.3, 2.3, 0.15, mat(PALETTE.lightGrey, { roughness: 0.3, metalness: 0.3 }), 20), { x: sx - 1.6, y: fy, z: sz + 0.3 }));
  g.add(place(shinyCar({ color: PALETTE.red, kind: 'coupe' }), { x: sx - 1.6, y: fy + 0.15, z: sz + 0.3, ry: 25, s: 0.85 }));
  g.add(place(shinyCar({ color: PALETTE.yellow }), { x: sx + 3.6, y: fy, z: sz + 0.6, ry: -20, s: 0.8 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 12 }), { x: right - 0.7, y: fy, z: front - 0.7 }));

  // ---- forecourt: diagonal row of shiny cars nosed towards the street ----
  const colours = [PALETTE.blue, PALETTE.white, PALETTE.black, PALETTE.red, PALETTE.green, PALETTE.steelLight, PALETTE.orange, PALETTE.navy];
  const kinds = ['sedan', 'suv', 'sedan', 'coupe', 'sedan', 'suv', 'coupe', 'sedan'];
  for (let i = 0; i < 8; i++) {
    const x = -8.45 + i * 2.4;
    g.add(place(shinyCar({ color: colours[i], kind: kinds[i] }), { x, y: y0 + 0.05, z: 2.7, ry: -50, s: 0.78 }));
  }

  // ---- side lot behind: three cars in painted bays ----
  const lotColours = [PALETTE.purple ?? PALETTE.blue, PALETTE.grey, PALETTE.yellow];
  for (let i = 0; i < 3; i++) {
    g.add(place(shinyCar({ color: lotColours[i], kind: i === 1 ? 'suv' : 'sedan' }), { x: 4.45 + i * 2.1, y: y0 + 0.05, z: -2.5, ry: -90, s: 0.78 }));
  }

  // ---- brand pylon at the front-right corner ----
  const pylonM = mat(PALETTE.darkGrey);
  g.add(place(box(0.35, 6.4, 0.35, pylonM), { x: 9.3, y: y0, z: -0.3 }));
  g.add(place(box(1.9, 2.2, 0.4, mat(PALETTE.red)), { x: 9.3, y: y0 + 5.2, z: -0.3 }));
  g.add(place(textSign({ text: 'TINY', w: 1.7, h: 0.85, bg: PALETTE.red, fg: '#ffffff', depth: 0.44, double: true }), { x: 9.3, y: y0 + 6.25, z: -0.3 }));
  g.add(place(textSign({ text: 'MOTORS', w: 1.7, h: 0.6, bg: PALETTE.white, fg: PALETTE.red, depth: 0.44, double: true }), { x: 9.3, y: y0 + 5.5, z: -0.3 }));
  g.add(place(box(1.7, 0.08, 0.46, mat(PALETTE.yellow)), { x: 9.3, y: y0 + 5.38, z: -0.3 }));

  // ---- bunting poles and strings ----
  const poleM = mat(PALETTE.white);
  const poleH = 4.6;
  const poles = [[-9.75, 4.7], [-3.25, 4.7], [3.25, 4.7], [9.75, 4.7], [9.75, -4.75]];
  for (const [x, z] of poles) {
    g.add(place(cylinder(0.06, 0.08, poleH, poleM, 6), { x, y: y0, z }));
    g.add(place(cylinder(0.12, 0.12, 0.12, mat(PALETTE.yellow), 6), { x, y: y0 + poleH, z }));
  }
  const top = y0 + poleH - 0.1;
  for (let i = 0; i < 3; i++) {
    const [ax, az] = poles[i], [bx, bz] = poles[i + 1];
    g.add(bunting([ax, top, az], [bx, top, bz], { sag: 0.55, offset: i }));
  }
  g.add(bunting([9.75, top, 4.7], [9.75, top, -4.75], { sag: 0.6, offset: 2 }));
  // from the front poles up to the showroom fascia corners
  g.add(bunting([-9.75, top, 4.7], [left, fasciaY + 0.6, front + 0.2], { sag: 0.35, offset: 1 }));
  g.add(bunting([-3.25, top, 4.7], [sx, fasciaY + 0.6, front + 0.2], { sag: 0.35, offset: 4 }));
  g.add(bunting([3.25, top, 4.7], [right, fasciaY + 0.6, front + 0.2], { sag: 0.35, offset: 3 }));
  g.add(bunting([right + 0.2, fasciaY + 0.6, sz], [9.3, y0 + 6.2, -0.3], { sag: 0.4, offset: 5 }));

  // ---- small props ----
  g.add(place(bench({ w: 1.4 }), { x: left + 2, y: y0, z: front + 0.75 }));
  for (const x of [left + 0.4, sx - 2.4]) {
    g.add(place(box(0.8, 0.45, 0.8, mat(PALETTE.stoneDark ?? PALETTE.stone)), { x, y: y0, z: front + 0.75 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: Math.round(x * 10) }), { x, y: y0 + 0.45, z: front + 0.75 }));
  }
  // "SALE" A-board by the street
  g.add(place(textSign({ text: 'SALE!', w: 1.1, h: 0.7, bg: PALETTE.yellow, fg: PALETTE.red, depth: 0.08, double: true }), { x: 0, y: y0 + 0.35, z: 4.45, rx: -8 }));
  g.add(place(box(1.1, 0.35, 0.3, mat(PALETTE.darkGrey)), { x: 0, y: y0, z: 4.45 }));
  // light beacon on the showroom roof
  g.add(place(box(0.3, 0.3, 0.3, emissive(PALETTE.windowLit, 0.6)), { x: sx, y: fasciaY + 0.75 + 1.7, z: sz }));
  return g;
}

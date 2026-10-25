import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  ShapeBuilder, lot, box, cylinder, sphere, place, group, beam,
  facadeCylinder, antenna, sign, flag, tree, streetLamp, bench, hedge, awning,
  mat, metal, glass, emissive, surface,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.

const SHAFT_H = 46;
const SHAFT_R0 = 1.75; // radius at the ground
const SHAFT_R1 = 1.05; // radius at the top
const shaftR = (y) => SHAFT_R0 + (SHAFT_R1 - SHAFT_R0) * (y / SHAFT_H);

// Buttress fin running out along +x: `out0` from the axis at the bottom, `out1` at the top.
function fin({ h, out0, out1, t, material }) {
  const s = t / 2;
  const b = new ShapeBuilder();
  const A = [0, 0, s], B = [out0, 0, s], C = [out1, h, s], D = [0, h, s];
  const a = [0, 0, -s], bb = [out0, 0, -s], c = [out1, h, -s], d = [0, h, -s];
  b.quad(A, B, C, D);          // +z side
  b.quad(bb, a, d, c);         // -z side
  b.quad(B, bb, c, C);         // sloping outer edge
  b.quad(D, C, c, d);          // top
  b.quad(a, bb, B, A);         // bottom
  return new THREE.Mesh(b.build(), material);
}

// Ring of n small objects at radius r.
function ring(n, r, make, offset = 0) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = offset + (i / n) * Math.PI * 2;
    g.add(place(make(i), { x: Math.cos(a) * r, z: Math.sin(a) * r, ry: -(a * 180) / Math.PI }));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = TILE / 2;

  const concrete = surface('concrete', PALETTE.concrete, { size: 3 });
  const concreteLight = mat(PALETTE.white);
  const concreteDark = mat(PALETTE.concreteDark);
  const steel = metal(PALETTE.steelLight);
  const red = mat(PALETTE.red);

  // ---------- ground: grass lot, round paved plaza, path to the street ----------
  g.add(lot([1, 1], 'grass'));
  g.add(place(cylinder(4.75, 4.75, 0.05, surface('paving', PALETTE.paving, { size: 2 }), 32), { y: y0 }));
  g.add(place(box(2.4, 0.06, 1.2, surface('paving', PALETTE.paving, { size: 2 })), { y: y0, z: 4.4 }));
  const py = y0 + 0.05;

  // ---------- entrance pavilion: round glass drum with a white roof slab ----------
  g.add(place(cylinder(3.7, 3.7, 0.25, concreteDark, 32), { y: py }));
  g.add(place(facadeCylinder({
    radius: 3.4, h: 3.6, floorHeight: 3.6, segments: 28, bay: 1.6, style: 'curtain',
    glass: PALETTE.glassTeal, frame: PALETTE.steelLight, lit: 0.35, seed: 4, roof: PALETTE.concrete,
  }), { y: py + 0.25 }));
  g.add(place(cylinder(3.85, 3.85, 0.45, concreteLight, 32), { y: py + 3.85 }));
  // entrance: canopy, doors, sign
  g.add(place(box(2.6, 0.2, 1.4, concreteLight), { y: py + 2.7, z: 3.9 }));
  for (const x of [-1.15, 1.15]) g.add(place(cylinder(0.08, 0.08, 2.7, steel, 6), { x, y: py, z: 4.5 }));
  g.add(place(box(1.8, 2.3, 0.12, glass(PALETTE.glassDark)), { y: py + 0.25, z: 3.42 }));
  g.add(place(box(0.08, 2.3, 0.16, steel), { y: py + 0.25, z: 3.42 }));
  g.add(place(sign({ text: 'SKY TOWER', w: 3.4, h: 0.7, bg: PALETTE.red, fg: '#ffffff', depth: 0.15 }), { y: py + 2.92, z: 4.62 }));

  // ---------- shaft: tapering concrete needle on three buttress fins ----------
  g.add(place(cylinder(SHAFT_R1, SHAFT_R0, SHAFT_H, concrete, 20), { y: py }));
  const finTop = 26;
  for (const deg of [-90, 30, 150]) {
    const a = (deg * Math.PI) / 180;
    // fin rises from the pavilion roof and melts into the shaft
    const fy = 4.3;
    g.add(place(fin({ h: finTop - fy, out0: 3.5, out1: shaftR(finTop) - 0.05, t: 0.9, material: concrete }), { y: py + fy, ry: -deg }));
    // lower part of the fin pokes out of the pavilion as a pier
    g.add(place(box(0.9, fy, 0.9, concrete), { x: Math.cos(a) * 3.1, y: py, z: Math.sin(a) * 3.1, ry: -deg }));
    // window slits up the fin edge
    for (let k = 0; k < 6; k++) {
      const t0 = (k + 0.5) / 6.5;
      const yy = fy + t0 * (finTop - fy - 4);
      const rr = 3.5 + (shaftR(finTop) - 3.5) * ((yy - fy) / (finTop - fy)) - 0.6;
      g.add(place(box(0.5, 0.9, 0.95, emissive(PALETTE.windowLit, 0.5)), { x: Math.cos(a) * rr, y: py + yy, z: Math.sin(a) * rr, ry: -deg }));
    }
  }

  // glass elevator tracks on the front and back faces, each with a cab
  const elevGlass = glass(PALETTE.glassSky);
  for (const [side, cabY] of [[1, 11], [-1, 20]]) {
    const yA = 4.4, yB = 31.5;
    g.add(beam([0, py + yA, side * (shaftR(yA) + 0.12)], [0, py + yB, side * (shaftR(yB) + 0.12)], 0.55, elevGlass));
    const r = shaftR(cabY) + 0.35;
    g.add(place(box(0.95, 1.5, 0.75, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.25 })), { y: py + cabY, z: side * r }));
    g.add(place(box(1.05, 0.12, 0.85, steel), { y: py + cabY + 1.5, z: side * r }));
  }

  // ---------- saucer pod: restaurant + observation deck ----------
  const podY = py + 31;
  // underside: a flared cone from the shaft out to the rim
  g.add(place(cylinder(4.35, shaftR(27.5) + 0.05, 3.5, concreteLight, 32), { y: podY - 3.5 }));
  g.add(place(cylinder(4.5, 4.5, 0.35, concreteDark, 32), { y: podY - 0.1 }));
  // revolving restaurant: lit glass band
  g.add(place(facadeCylinder({
    radius: 4.2, h: 2.8, floorHeight: 2.8, segments: 32, bay: 1.3, style: 'curtain',
    glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.75, seed: 7, roof: PALETTE.concrete,
  }), { y: podY + 0.25 }));
  // red accent band between the decks
  g.add(place(cylinder(4.65, 4.65, 0.5, red, 32), { y: podY + 3.05 }));
  // outdoor deck railing
  g.add(place(cylinder(4.62, 4.62, 0.7, mat(PALETTE.steelLight, { transparent: true, opacity: 0.45 }), 32), { y: podY + 3.55 }));
  // observation deck: outward-leaning sky glass
  g.add(place(facadeCylinder({
    radius: 3.6, radiusTop: 4.05, h: 2.6, floorHeight: 2.6, segments: 32, bay: 1.2, style: 'curtain',
    glass: PALETTE.glassSky, frame: PALETTE.steelLight, lit: 0.2, seed: 8, roof: PALETTE.concrete,
  }), { y: podY + 3.55 }));
  // saucer roof
  g.add(place(cylinder(4.2, 4.2, 0.3, concreteLight, 32), { y: podY + 6.15 }));
  g.add(place(cylinder(1.6, 4.2, 1.4, concreteLight, 32), { y: podY + 6.45 }));
  // aviation lights round the rim
  g.add(place(ring(8, 4.15, () => sphere(0.14, emissive(PALETTE.red, 1.2), 6)), { y: podY + 6.4 }));

  // ---------- sky pod near the top of the shaft ----------
  const skyY = py + 39.5;
  g.add(place(cylinder(2.0, shaftR(38), 1.5, concreteLight, 20), { y: skyY - 1.5 }));
  g.add(place(facadeCylinder({
    radius: 2.0, h: 1.8, floorHeight: 1.8, segments: 20, bay: 1.0, style: 'curtain',
    glass: PALETTE.glassSky, frame: PALETTE.white, lit: 0.4, seed: 9, roof: PALETTE.concrete,
  }), { y: skyY }));
  g.add(place(cylinder(1.3, 2.1, 0.8, concreteLight, 20), { y: skyY + 1.8 }));

  // ---------- antenna: red/white banded mast ----------
  const mastY = py + SHAFT_H;
  g.add(place(cylinder(1.15, 1.15, 0.6, concreteDark, 16), { y: mastY }));
  const bands = 5, bandH = 2.2;
  for (let i = 0; i < bands; i++) {
    const r0 = 0.6 - i * 0.08, r1 = 0.6 - (i + 1) * 0.08;
    g.add(place(cylinder(r1, r0, bandH, i % 2 ? mat(PALETTE.white) : red, 10), { y: mastY + 0.6 + i * bandH }));
  }
  g.add(place(antenna({ h: 5, radius: 0.16, material: steel }), { y: mastY + 0.6 + bands * bandH }));
  g.add(place(sphere(0.2, emissive(PALETTE.red, 1.2), 8), { x: 0.5, y: mastY + 4.8, z: 0 }));
  g.add(place(sphere(0.2, emissive(PALETTE.red, 1.2), 8), { x: -0.4, y: mastY + 8.4, z: 0 }));

  // ---------- plaza props ----------
  // corner trees and planters
  for (const [x, z, kind, s] of [[-3.7, -3.7, 'round', 11], [3.8, -3.8, 'cone', 12], [-3.8, 3.6, 'round', 13]]) {
    g.add(place(tree({ kind, h: kind === 'cone' ? 4.6 : 4.2, seed: s }), { x, y: y0, z }));
  }
  g.add(place(hedge({ w: 2.4, h: 0.7, d: 0.5 }), { x: -3.4, y: y0, z: 4.6 }));
  // ticket kiosk with a striped awning, front right
  const kx = 3.75, kz = 3.55;
  g.add(place(box(1.5, 2.1, 1.3, mat(PALETTE.cream)), { x: kx, y: py, z: kz }));
  g.add(place(box(1.7, 0.15, 1.5, red), { x: kx, y: py + 2.1, z: kz }));
  g.add(place(box(1.0, 0.7, 0.05, glass(PALETTE.glassDark)), { x: kx, y: py + 1.0, z: kz + 0.66 }));
  g.add(place(awning({ w: 1.6, depth: 0.7, drop: 0.3, color: PALETTE.red, color2: PALETTE.white }), { x: kx, y: py + 2.0, z: kz + 0.65 }));
  // flags flanking the path
  for (const x of [-1.8, 1.8]) g.add(place(flag({ h: 4.2, color: x < 0 ? PALETTE.blue : PALETTE.red }), { x, y: py, z: 4.75 }));
  // lamps, benches
  g.add(place(streetLamp({ h: 3.6 }), { x: 4.6, y: py, z: -1.6, ry: 180 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -4.6, y: py, z: -1.6 }));
  g.add(place(bench({ w: 1.4 }), { x: 4.25, y: py, z: 0.6, ry: -90 }));
  g.add(place(bench({ w: 1.4 }), { x: -4.25, y: py, z: 0.6, ry: 90 }));
  g.add(place(bench({ w: 1.4 }), { x: 0, y: py, z: -4.3, ry: 0 }));
  return g;
}

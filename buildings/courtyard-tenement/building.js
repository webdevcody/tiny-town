import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, facadeCylinder, gableRoof, box, cylinder, cone, place, group,
  chimney, awning, streetLamp, bench, spire, mat, surface, hedge, door,
} from '../../src/lib/index.js';
import { boardSign, mansardRing, archBlock, dormer, balcony, courtTree } from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Perimeter block: four wings round an inner courtyard, entered through an
// arched carriage passage in the middle of the front wing.
const X0 = -9, X1 = 9, Z0 = -9.5, Z1 = 8.5; // outer wall line
const WD = 4; // wing depth
const IN = [X0 + WD, Z0 + WD, X1 - WD, Z1 - WD]; // courtyard: x -5..5, z -5.5..4.5
const CX = 0, CZ = (IN[1] + IN[3]) / 2;
const GH = 4.2; // tall shop / ground storey
const UPPER = 4; // + ground = five storeys
const GATE = 3.4, SPAN = 3.0, SPRING = 2.4;

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const yU = y0 + GH; // base of upper floors
  const yTop = yU + UPPER * FLOOR; // top of walls
  const ROOF_H = 3.2;

  g.add(lot([2, 2], 'paved'));

  const stone = PALETTE.sandstone;
  const stucco = PALETTE.plasterYellow;
  const trim = PALETTE.white;
  const slate = surface('shingles', PALETTE.roofSlate, { size: 1.6 });
  const ground = { style: 'punched', wall: stone, frame: trim, glass: PALETTE.window, windowW: 0.42, windowH: 0.5, bay: 2, lit: 0.1, seed: 3, floorHeight: GH, roof: PALETTE.roofGrey };
  const shop = { ...ground, style: 'shop', glass: PALETTE.glassDark, frame: PALETTE.woodDark, bay: 2.3, lit: 0.25 };
  const upper = { style: 'punched', wall: stucco, frame: trim, glass: PALETTE.window, windowW: 0.4, windowH: 0.58, bay: 2, lit: 0.12, seed: 7, roof: PALETTE.roofGrey };

  // ---- ground floor: shops either side of the carriage gate, rusticated stone elsewhere
  const pieceW = (X1 - X0 - GATE) / 2;
  const fz = Z1 - WD / 2;
  g.add(place(facadeBlock({ w: pieceW, d: WD, floors: 1, ...shop, blank: ['right', 'back'] }), { x: X0 + pieceW / 2, y: y0, z: fz }));
  g.add(place(facadeBlock({ w: pieceW, d: WD, floors: 1, ...shop, seed: 4, blank: ['left', 'back'] }), { x: X1 - pieceW / 2, y: y0, z: fz }));
  g.add(place(archBlock({ w: GATE, h: GH, d: WD, span: SPAN, spring: SPRING, material: mat(stone) }), { y: y0, z: fz }));
  const sideL = Z1 - Z0 - 2 * WD;
  for (const sx of [-1, 1]) {
    g.add(place(facadeBlock({ w: WD, d: sideL, floors: 1, ...ground, seed: 5 + sx }), { x: sx * (X1 - WD / 2), y: y0, z: CZ }));
  }
  g.add(place(facadeBlock({ w: X1 - X0, d: WD, floors: 1, ...ground }), { y: y0, z: Z0 + WD / 2 }));

  // ---- upper floors: ochre stucco, punched windows with white frames
  g.add(place(facadeBlock({ w: X1 - X0, d: WD, floors: UPPER, ...upper }), { y: yU, z: fz }));
  for (const sx of [-1, 1]) {
    g.add(place(facadeBlock({ w: WD, d: sideL, floors: UPPER, ...upper, seed: 8 + sx }), { x: sx * (X1 - WD / 2), y: yU, z: CZ }));
  }
  g.add(place(facadeBlock({ w: X1 - X0, d: WD, floors: UPPER, ...upper, seed: 9 }), { y: yU, z: Z0 + WD / 2 }));

  // central risalit over the gate, lighter stucco
  const RW = 6, RP = 0.4;
  g.add(place(facadeBlock({ w: RW, d: RP, floors: UPPER, ...upper, wall: PALETTE.cream, seed: 12, blank: ['left', 'right', 'back'] }), { y: yU, z: Z1 + RP / 2 }));

  // ---- string course, cornice (street side and courtyard side)
  const bandM = mat(PALETTE.offWhite);
  const ring = (y, h, p, m) => {
    const W = X1 - X0, D = Z1 - Z0;
    g.add(place(box(W + 2 * p, h, 2 * p, m), { y, z: Z1 }));
    g.add(place(box(W + 2 * p, h, 2 * p, m), { y, z: Z0 }));
    g.add(place(box(2 * p, h, D, m), { x: X0, y }));
    g.add(place(box(2 * p, h, D, m), { x: X1, y }));
  };
  const innerRing = (y, h, p, m) => {
    const [a, b, c, d] = IN;
    g.add(place(box(c - a, h, 2 * p, m), { y, z: d }));
    g.add(place(box(c - a, h, 2 * p, m), { y, z: b }));
    g.add(place(box(2 * p, h, d - b, m), { x: a, y, z: CZ }));
    g.add(place(box(2 * p, h, d - b, m), { x: c, y, z: CZ }));
  };
  ring(yU - 0.15, 0.3, 0.16, bandM);
  ring(yTop - 0.45, 0.45, 0.38, mat(trim));
  innerRing(yTop - 0.3, 0.3, 0.15, mat(trim));
  // risalit cornice + band
  g.add(place(box(RW + 0.5, 0.45, RP + 0.8, mat(trim)), { y: yTop - 0.45, z: Z1 + RP / 2 }));

  // ---- carriage gate: stone arch surround, keystone, open timber doors, cobbled passage
  const portal = mat(PALETTE.stone);
  g.add(place(archBlock({ w: SPAN + 1.0, h: SPRING + SPAN / 2 + 0.45, d: 0.25, span: SPAN, spring: SPRING, material: portal }), { y: y0, z: Z1 + 0.12 }));
  g.add(place(box(0.55, 0.7, 0.4, mat(PALETTE.offWhite)), { y: y0 + SPRING + SPAN / 2 - 0.3, z: Z1 + 0.2 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.12, SPRING + 0.6, 1.45, mat(PALETTE.woodDark)), { x: sx * (SPAN / 2 - 0.08), y: y0, z: Z1 - 0.9 }));
    g.add(place(box(0.5, 0.6, 0.5, portal), { x: sx * (SPAN / 2 + 0.4), y: y0, z: Z1 + 0.35 })); // bollard stones
  }
  g.add(place(patch(SPAN, WD + 0.6, 'cobbles'), { y: y0, z: fz + 0.3 }));

  // ---- roof: slate mansard all round, zwerchhaus gable over the risalit, dormers, chimneys
  g.add(place(mansardRing({ outer: [X0, Z0, X1, Z1], inner: IN, h: ROOF_H, inset: 1, overhang: 0.3, material: slate, topMaterial: PALETTE.roofGrey }), { y: yTop }));
  const zwD = 3.6;
  g.add(place(facadeBlock({ w: RW, d: zwD, h: ROOF_H, floorHeight: ROOF_H, ...upper, wall: PALETTE.cream, windowH: 0.5, seed: 13, blank: ['left', 'right', 'back'] }), { y: yTop, z: Z1 + RP - zwD / 2 }));
  g.add(place(gableRoof({ w: RW, d: zwD, h: 2.8, overhang: 0.3, ridge: 'z', material: slate, gableMaterial: PALETTE.cream }), { y: yTop + ROOF_H, z: Z1 + RP - zwD / 2 }));
  g.add(place(cylinder(0.55, 0.55, 0.12, mat(trim), 16), { y: yTop + ROOF_H + 1.0, z: Z1 + RP + 0.25, rx: 90 }));
  g.add(place(cylinder(0.42, 0.42, 0.14, mat(PALETTE.window), 16), { y: yTop + ROOF_H + 1.0, z: Z1 + RP + 0.28, rx: 90 }));

  const dm = { wall: trim, roof: slate };
  const dy = yTop + 0.35, out = 0.12;
  for (const x of [-6, -4, 4, 6]) g.add(place(dormer({ ...dm, lit: x === 4 }), { x, y: dy, z: Z1 + out }));
  for (const x of [-6, -4, -2, 0, 2, 4, 6]) g.add(place(dormer({ ...dm, lit: x === -2 }), { x, y: dy, z: Z0 - out, ry: 180 }));
  for (let z = -6.5; z <= 5.5; z += 2) {
    g.add(place(dormer({ ...dm, lit: z === 1.5 }), { x: X1 + out, y: dy, z, ry: 90 }));
    g.add(place(dormer(dm), { x: X0 - out, y: dy, z, ry: -90 }));
  }
  const brick = surface('brick', PALETTE.brick, { size: 1 });
  const chim = (x, z, ry = 0) => g.add(place(chimney({ w: 0.6, d: 1.2, h: 1.3, material: brick }), { x, y: yTop + ROOF_H, z, ry }));
  for (const x of [-6, 6]) chim(x, fz, 90);
  for (const x of [-6, -2, 2, 6]) chim(x, Z0 + WD / 2, 90);
  for (const z of [-3, 2]) { chim(X0 + WD / 2, z); chim(X1 - WD / 2, z); }

  // ---- corner turret (front-left): octagonal oriel on a corbel, belvedere and copper cap
  const tx = X0 + 0.6, tz = Z1 - 0.6, TR = 1.6;
  const oct = { segments: 8 };
  g.add(place(cylinder(TR, 0.3, 1.4, mat(PALETTE.stone), 8), { x: tx, y: yU - 1.4, z: tz, ry: 22.5 }));
  g.add(place(facadeCylinder({ radius: TR, floors: UPPER, ...oct, ...upper, wall: PALETTE.cream, bay: 1.3, seed: 15 }), { x: tx, y: yU, z: tz, ry: 22.5 }));
  g.add(place(cylinder(TR + 0.3, TR + 0.3, 0.45, mat(trim), 8), { x: tx, y: yTop - 0.45, z: tz, ry: 22.5 }));
  g.add(place(facadeCylinder({ radius: TR - 0.2, h: ROOF_H, floorHeight: ROOF_H, ...oct, ...upper, wall: PALETTE.cream, bay: 1.2, lit: 0.3, seed: 16 }), { x: tx, y: yTop, z: tz, ry: 22.5 }));
  const copper = mat(PALETTE.roofGreen);
  g.add(place(cylinder(TR + 0.1, TR + 0.1, 0.3, copper, 8), { x: tx, y: yTop + ROOF_H, z: tz, ry: 22.5 }));
  g.add(place(cone(TR + 0.1, 4.2, copper, 8), { x: tx, y: yTop + ROOF_H + 0.3, z: tz, ry: 22.5 }));
  g.add(place(spire({ radius: 0.12, h: 1.4, material: mat(PALETTE.darkGrey) }), { x: tx, y: yTop + ROOF_H + 4.3, z: tz }));

  // ---- window hoods over the first two upper floors (street sides)
  const hoodM = mat(trim);
  const hood = (x, y, z, ry) => g.add(place(box(1.15, 0.16, 0.22, hoodM), { x, y, z, ry }));
  for (const f of [0, 1]) {
    const hy = yU + f * FLOOR + 2.5;
    for (let x = -6; x <= 8; x += 2) hood(x, hy, Math.abs(x) <= 2 ? Z1 + RP + 0.1 : Z1 + 0.1, 0);
    for (let x = -8; x <= 8; x += 2) hood(x, hy, Z0 - 0.1, 0);
    for (let z = Z0 + 1; z < Z1; z += 2) {
      hood(X1 + 0.1, hy, z, 90);
      if (z < Z1 - 2) hood(X0 - 0.1, hy, z, 90);
    }
  }

  // ---- stair-hall doors on the side and back streets
  const entry = (x, z, ry) => {
    g.add(place(group(
      place(box(2.0, 3.2, 0.2, mat(PALETTE.stone)), { z: 0.05 }),
      place(door({ w: 1.3, h: 2.6, color: PALETTE.woodDark, frame: PALETTE.offWhite }), { z: 0.1 }),
      place(box(2.3, 0.2, 0.6, mat(PALETTE.stoneDark)), { y: 3.2, z: 0.3 })
    ), { x, y: y0, z, ry }));
  };
  entry(X1, CZ, 90);
  entry(X0, CZ, -90);
  entry(0, Z0, 180);

  // ---- balconies with wrought-iron railings
  g.add(place(balcony({ w: 4.6, depth: 0.9 }), { y: yU, z: Z1 + RP }));
  for (const f of [1, 2]) {
    for (const x of [-4, 4]) g.add(place(balcony({ w: 1.6 }), { x, y: yU + f * FLOOR, z: Z1 }));
    g.add(place(balcony({ w: 1.6 }), { x: X1, y: yU + f * FLOOR, z: -1.5, ry: 90 }));
    g.add(place(balcony({ w: 1.6 }), { x: X0, y: yU + f * FLOOR, z: -1.5, ry: -90 }));
    for (const x of [-4, 4]) g.add(place(balcony({ w: 1.6, depth: 0.6 }), { x, y: yU + f * FLOOR, z: Z0, ry: 180 }));
  }
  // courtyard-side balconies on the back wing (seen through the gate)
  for (let f = 0; f < UPPER; f++) for (const x of [-2, 2]) g.add(place(balcony({ w: 1.6 }), { x, y: yU + f * FLOOR, z: IN[1] }));

  // ---- shopfronts: café and bakery with awnings and fascia signs
  const shopX = (X1 - (GATE / 2 + 0.5)) / 2 + (GATE / 2 + 0.5) / 2 + 0.2;
  g.add(place(awning({ w: 4.8, depth: 1.3, drop: 0.45, color: PALETTE.red }), { x: -shopX, y: y0 + 3.15, z: Z1 }));
  g.add(place(awning({ w: 4.8, depth: 1.3, drop: 0.45, color: PALETTE.green }), { x: shopX, y: y0 + 3.15, z: Z1 }));
  g.add(place(boardSign({ text: 'CAFE', w: 3.2, h: 0.75, bg: PALETTE.brickDark, fg: '#fff3c4' }), { x: -shopX, y: y0 + 3.3, z: Z1 + 0.06 }));
  g.add(place(boardSign({ text: 'BAKERY', w: 3.2, h: 0.75, bg: PALETTE.foliageDark, fg: '#fff3c4' }), { x: shopX, y: y0 + 3.3, z: Z1 + 0.06 }));
  // house number plaque on the risalit
  g.add(place(boardSign({ text: 'No 17', w: 1.2, h: 0.5, bg: PALETTE.navy, fg: '#ffffff', border: '#ffffff' }), { x: 1.15, y: y0 + 3.5, z: Z1 + 0.25 }));

  // ---- street side: café tables, lamps
  const iron = mat(PALETTE.darkGrey);
  const table = () => group(
    cylinder(0.05, 0.08, 0.75, iron, 6),
    place(cylinder(0.38, 0.38, 0.05, mat(PALETTE.white), 10), { y: 0.75 }),
    place(box(0.4, 0.45, 0.4, mat(PALETTE.wood)), { x: -0.6 }),
    place(box(0.4, 0.45, 0.4, mat(PALETTE.wood)), { x: 0.6 })
  );
  for (const x of [-7, -4.6]) g.add(place(table(), { x, y: y0, z: Z1 + 0.95 }));
  for (const x of [-8.6, 8.6]) g.add(place(streetLamp({ h: 4.6 }), { x, y: y0, z: Z1 + 0.45, ry: -90 }));
  g.add(place(bench({ w: 1.5 }), { x: 6.6, y: y0, z: Z1 + 1.1 }));

  // ---- inner courtyard: cobbles, lawn, two big lindens, bins, bikes, washing line, sandbox
  g.add(place(patch(IN[2] - IN[0], IN[3] - IN[1], 'cobbles'), { x: CX, y: y0, z: CZ }));
  g.add(place(patch(7, 5.6, 'grass', 0.08), { x: CX, y: y0, z: CZ - 1.2 }));
  g.add(place(courtTree({ h: 22, spread: 3.0, seed: 31, color: PALETTE.foliageLight }), { x: -1.8, y: y0, z: CZ - 1.6 }));
  g.add(place(courtTree({ h: 19.5, spread: 2.3, seed: 32, color: PALETTE.foliage }), { x: 2.4, y: y0, z: CZ + 1.0 }));
  g.add(place(hedge({ w: 7, h: 0.7, d: 0.5 }), { x: CX, y: y0, z: IN[1] + 0.4 }));
  g.add(place(bench({ w: 1.5 }), { x: 1.2, y: y0, z: CZ - 3.4 }));
  g.add(place(bench({ w: 1.5 }), { x: -3.6, y: y0, z: CZ + 1.4, ry: 90 }));
  // sandbox
  g.add(place(box(1.8, 0.25, 1.8, mat(PALETTE.wood)), { x: 3.0, y: y0, z: CZ - 2.4 }));
  g.add(place(box(1.6, 0.27, 1.6, mat(PALETTE.sand)), { x: 3.0, y: y0, z: CZ - 2.4 }));
  // wheelie bins by the passage
  const binCols = [PALETTE.darkGrey, PALETTE.blue, PALETTE.yellow, PALETTE.green];
  binCols.forEach((c, i) => {
    g.add(place(box(0.65, 1.05, 0.7, mat(c)), { x: IN[0] + 0.5, y: y0, z: IN[3] - 0.5 - i * 0.8 }));
  });
  // bike rack + bikes
  for (let i = 0; i < 3; i++) {
    const bx = IN[2] - 0.5, bz = IN[3] - 0.6 - i * 0.7;
    g.add(place(box(1.5, 0.75, 0.06, mat([PALETTE.red, PALETTE.blue, PALETTE.black][i])), { x: bx - 0.4, y: y0 + 0.05, z: bz }));
  }
  // washing line
  for (const x of [-4.4, -1.0]) g.add(place(cylinder(0.05, 0.05, 2.0, iron, 6), { x, y: y0, z: IN[1] + 1.4 }));
  g.add(place(box(3.4, 0.03, 0.03, iron), { x: -2.7, y: y0 + 1.95, z: IN[1] + 1.4 }));
  [PALETTE.white, PALETTE.red, PALETTE.plasterBlue, PALETTE.white].forEach((c, i) => {
    g.add(place(box(0.6, 0.7, 0.03, mat(c)), { x: -4.0 + i * 0.85, y: y0 + 1.25, z: IN[1] + 1.4 }));
  });

  return g;
}

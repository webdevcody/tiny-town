import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, place, group, mat, metal, emissive,
  rooftopUnits, parapet, sign, tree, streetLamp, bench, cylinder,
} from '../../src/lib/index.js';

const BLACK_GLASS = '#1a2029';
const MULLION = '#3a4048';
const ALU = metal(PALETTE.aluminium, { roughness: 0.3 });
const GRANITE = mat('#3b3d42');

// Vertical aluminium fins along all four faces of a w x d box (origin = base centre).
function fins({ w, d, h, spacing = 1.4, depth = 0.35, t = 0.14 }) {
  const g = new THREE.Group();
  const nx = Math.max(1, Math.round(w / spacing));
  const nz = Math.max(1, Math.round(d / spacing));
  for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (i * w) / nx;
    g.add(place(box(t, h, depth, ALU), { x, z: d / 2 + depth / 2 }));
    g.add(place(box(t, h, depth, ALU), { x, z: -d / 2 - depth / 2 }));
  }
  for (let i = 0; i <= nz; i++) {
    const z = -d / 2 + (i * d) / nz;
    g.add(place(box(depth, h, t, ALU), { x: w / 2 + depth / 2, z }));
    g.add(place(box(depth, h, t, ALU), { x: -w / 2 - depth / 2, z }));
  }
  return g;
}

// 1x1 tile (10 x 10 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const W = 6.6, D = 6.2, cz = -1.2;          // tower footprint
  const lobbyH = 5;
  const floors = 13;
  const shaftH = floors * FLOOR;
  const crownH = 2.4;

  // granite plinth under the whole tower
  g.add(place(box(W + 1.6, 0.25, D + 1.4, GRANITE), { y: y0, z: cz }));
  const yb = y0 + 0.25;

  // recessed double-height lobby: dark glass box behind black columns
  g.add(place(facadeBlock({ w: W - 1.4, d: D - 1.4, h: lobbyH, floorHeight: lobbyH, style: 'shop', wall: PALETTE.black, glass: '#33475c', frame: MULLION, bay: 1.6, lit: 0.6, seed: 3, roof: PALETTE.black }), { y: yb, z: cz }));
  for (const x of [-W / 2 + 0.25, 0, W / 2 - 0.25]) {
    for (const z of [cz - D / 2 + 0.25, cz + D / 2 - 0.25]) {
      g.add(place(box(0.45, lobbyH, 0.45, mat(PALETTE.black)), { x, y: yb, z }));
    }
  }
  for (const z of [cz - 1, cz + 1]) {
    for (const x of [-W / 2 + 0.25, W / 2 - 0.25]) g.add(place(box(0.45, lobbyH, 0.45, mat(PALETTE.black)), { x, y: yb, z }));
  }
  // revolving door + canopy
  g.add(place(cylinder(0.8, 0.8, 2.4, mat('#2a3540', { metalness: 0.6, roughness: 0.2 }), 12), { y: yb, z: cz + (D - 1.4) / 2 + 0.2 }));
  g.add(place(box(0.9, 0.12, 0.9, ALU), { y: yb + 2.4, z: cz + (D - 1.4) / 2 + 0.2 }));
  g.add(place(box(3.6, 0.25, 2.2, ALU), { y: yb + 3.2, z: cz + D / 2 + 0.5 }));
  g.add(place(box(3.6, 0.06, 2.2, emissive(PALETTE.windowLit, 0.6)), { y: yb + 3.14, z: cz + D / 2 + 0.5 }));

  // transfer slab with an aluminium edge
  const ys = yb + lobbyH;
  g.add(place(box(W + 0.8, 0.5, D + 0.8, ALU), { y: ys - 0.5, z: cz }));

  // the monolith: black curtain wall + fins
  g.add(place(facadeBlock({ w: W, d: D, floors, style: 'curtain', glass: BLACK_GLASS, frame: MULLION, bay: 1.4, lit: 0.03, seed: 25, roof: PALETTE.roofBlack }), { y: ys, z: cz }));
  g.add(place(fins({ w: W, d: D, h: shaftH }), { y: ys, z: cz }));

  // flat crown: solid black band, thin lit reveal, aluminium cap
  const yc = ys + shaftH;
  const cw = W + 0.8, cd = D + 0.8;
  g.add(place(box(W + 0.05, 0.35, D + 0.05, emissive('#cfe8ff', 0.5)), { y: yc, z: cz }));
  const crownM = mat('#15191e', { metalness: 0.5, roughness: 0.25 });
  const deckM = mat(PALETTE.roofBlack);
  g.add(place(box(cw, crownH - 0.35, cd, [crownM, crownM, deckM, crownM, crownM, crownM]), { y: yc + 0.35, z: cz }));
  g.add(place(parapet({ w: cw + 0.1, d: cd + 0.1, h: 0.25, t: 0.35, material: ALU }), { y: yc + crownH, z: cz }));
  // inner roof behind the crown wall: plant + window-cleaning gantry
  const yr = yc + crownH;

  g.add(place(rooftopUnits({ w: W - 2, d: D - 2.4, count: 2, seed: 7, material: mat(PALETTE.steelDark) }), { y: yr, z: cz - 0.6 }));
  g.add(place(box(0.6, 1.2, 0.6, mat(PALETTE.steelDark)), { x: 1.8, y: yr, z: cz + 1.6 }));
  g.add(place(box(3.4, 0.25, 0.3, mat(PALETTE.yellow)), { x: 0.4, y: yr + 1.2, z: cz + 1.6 }));
  g.add(place(box(0.08, 1.4, 0.08, ALU), { x: -2.4, y: yr, z: cz - 2.2 }));
  g.add(place(box(0.2, 0.2, 0.2, emissive(PALETTE.red, 1)), { x: -2.4, y: yr + 1.4, z: cz - 2.2 }));

  // plaza in front
  g.add(place(patch(4, 2.6, 'cobbles'), { y: y0, z: 3.4 }));
  const planterM = GRANITE;
  for (const x of [-3.6, 3.6]) {
    g.add(place(box(1.6, 0.5, 1.6, planterM), { x, y: y0, z: 3.6 }));
    g.add(place(tree({ kind: 'round', h: 4.2, seed: x > 0 ? 11 : 12 }), { x, y: y0 + 0.5, z: 3.6 }));
  }
  // monument sign
  g.add(place(box(2.8, 0.3, 0.6, GRANITE), { x: 0, y: y0, z: 4.4 }));
  g.add(place(sign({ text: 'ONYX', w: 2.4, h: 0.8, bg: '#14171b', fg: '#dfe4ea', depth: 0.3 }), { x: 0, y: y0 + 0.3, z: 4.4 }));
  // bollards along the kerb
  for (const x of [-2.2, -1.6, 1.6, 2.2]) g.add(place(cylinder(0.1, 0.1, 0.7, ALU, 6), { x, y: y0, z: 4.6 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 4.5, y: y0, z: 2, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: -2.6, y: y0, z: 2.4, ry: 180 }));

  // side hedges and a slim tree at the back corners
  for (const x of [-4.6, 4.6]) {
    g.add(place(box(0.6, 0.7, 6, mat(PALETTE.foliageDark)), { x, y: y0, z: -1.5 }));
    g.add(place(tree({ kind: 'poplar', h: 6, seed: x > 0 ? 3 : 4 }), { x: x * 0.93, y: y0, z: -4.3 }));
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, taperedBlock, box, place, parapet, rooftopUnits, antenna,
  sign, tree, mat, surface, glass, streetLamp, bench, car, hedge, flag, door,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front faces +z.
// A slab of offices raised on tapered pilotis. The facade is an "egg-crate" of
// concrete fins and spandrels standing proud of the glass, so every window
// sits in a deep recess.

const y0 = LOT_HEIGHT;
const PH = 4.6;   // pilotis height (open ground floor)
const FH = 3.1;   // office storey height
const N = 4;      // office storeys
const W = 15, D = 7.5, CX = 1.0, CZ = -0.6; // office slab
const INSET = 0.8; // window recess depth
const OUT = 0.25;  // fins stand proud of the spandrels
const FIN = INSET + OUT;

const CONC = '#aeaca6', CONC_DARK = '#85837d';
const raw = surface('concrete', CONC, { size: 3 });
const rawDark = surface('concrete', CONC_DARK, { size: 3 });
const roofM = mat(PALETTE.concreteDark);

function slab(g) {
  const yb = y0 + PH;
  const H = N * FH;
  const x0 = CX - W / 2, x1 = CX + W / 2, z0 = CZ - D / 2, z1 = CZ + D / 2;

  // recessed glazing: one thin window wall per face, set back INSET, so the
  // window grid lines up with the fins (lit office windows behind the grid)
  const glaze = { floors: N, floorHeight: FH, bay: 2.5, style: 'curtain', glass: '#1d2733', frame: '#2b2d31', lit: 0.4, roof: roofM };
  g.add(place(box(W - 2 * INSET, H, D - 2 * INSET, mat('#1d2733')), { x: CX, y: yb, z: CZ }));
  for (const s of [1, -1]) {
    g.add(place(facadeBlock({ w: W, d: 0.05, seed: 29 + s, ...glaze }), { x: CX, y: yb, z: CZ + s * (D / 2 - INSET) }));
    g.add(place(facadeBlock({ w: 0.05, d: D, seed: 4 + s, ...glaze }), { x: CX + s * (W / 2 - INSET), y: yb, z: CZ }));
  }

  // spandrel bands: one per storey (the lowest is a deep transfer beam)
  for (let f = 0; f < N; f++) {
    const h = f === 0 ? 1.4 : 1.1;
    g.add(place(box(W, h, D, raw), { x: CX, y: yb + f * FH, z: CZ }));
    // thin drip ledge under each band to sharpen the shadow line
    if (f > 0) g.add(place(box(W + 0.12, 0.12, D + 0.12, rawDark), { x: CX, y: yb + f * FH, z: CZ }));
  }

  // vertical fins, front/back every 2.5 m, sides every 2.5 m
  const finT = 0.45;
  const nx = Math.round(W / 2.5);
  for (let k = 0; k <= nx; k++) {
    const x = Math.min(x1 - finT / 2, Math.max(x0 + finT / 2, x0 + k * (W / nx)));
    for (const z of [z1 - FIN / 2 + OUT, z0 + FIN / 2 - OUT]) g.add(place(box(finT, H, FIN, raw), { x, y: yb, z }));
  }
  const nz = Math.round(D / 2.5);
  for (let k = 0; k <= nz; k++) {
    const z = Math.min(z1 - finT / 2, Math.max(z0 + finT / 2, z0 + k * (D / nz)));
    for (const x of [x1 - FIN / 2 + OUT, x0 + FIN / 2 - OUT]) g.add(place(box(FIN, H, finT, raw), { x, y: yb, z }));
  }

  // projecting crown storey: a dense row of concrete blades over dark slit windows
  const yt = yb + H;
  const AW = W + 0.9, AD = D + 0.9, AH = 2.6;
  g.add(place(box(AW, 0.45, AD, raw), { x: CX, y: yt, z: CZ }));
  g.add(place(box(AW - 0.5, AH, AD - 0.5, mat('#1d2733', { roughness: 0.35 })), { x: CX, y: yt + 0.45, z: CZ }));
  const blade = (n, len) => Array.from({ length: n + 1 }, (_, k) => -len / 2 + 0.15 + k * ((len - 0.3) / n));
  for (const x of blade(Math.round(AW / 0.85), AW)) {
    for (const s of [1, -1]) g.add(place(box(0.3, AH, 0.55, raw), { x: CX + x, y: yt + 0.45, z: CZ + s * (AD / 2 - 0.275) }));
  }
  for (const z of blade(Math.round(AD / 0.85), AD)) {
    for (const s of [1, -1]) g.add(place(box(0.55, AH, 0.3, raw), { x: CX + s * (AW / 2 - 0.275), y: yt + 0.45, z: CZ + z }));
  }
  const roofY = yt + 0.45 + AH;
  g.add(place(box(AW + 0.2, 0.55, AD + 0.2, raw), { x: CX, y: roofY, z: CZ }));
  g.add(place(patch(AW - 0.6, AD - 0.6, 'gravel'), { x: CX, y: roofY + 0.55, z: CZ }));
  g.add(place(parapet({ w: AW + 0.2, d: AD + 0.2, h: 0.4, t: 0.3, material: raw }), { x: CX, y: roofY + 0.55, z: CZ }));

  // roof: plant room with louvres, AC units, water tank
  g.add(place(facadeBlock({ w: 5, d: 3.6, h: 2.6, floorHeight: 2.6, bay: 1.2, style: 'industrial', wall: PALETTE.concrete, glass: PALETTE.steelDark, frame: PALETTE.concreteDark, roof: roofM }), { x: CX + 2.5, y: roofY, z: CZ - 0.6 }));
  g.add(place(rooftopUnits({ w: 4.5, d: 4.5, count: 3, seed: 7 }), { x: CX - 3.8, y: roofY, z: CZ }));
  g.add(place(box(1.8, 1.4, 1.8, mat(PALETTE.steelLight)), { x: CX + 6.2, y: roofY, z: CZ + 1.6 }));
  return roofY + 0.55;
}

function core(g, roofY) {
  // board-marked stair / lift tower at the west end, rising above the roof
  const cw = 3.0, cd = 4.2, cx = CX - W / 2 - OUT - cw / 2, cz = CZ - 0.9;
  const top = roofY + 3.2 - y0;
  g.add(place(box(cw, top, cd, rawDark), { x: cx, y: y0, z: cz }));
  // vertical slot windows on the front and side
  const slit = glass(PALETTE.glassDark);
  g.add(place(box(0.35, top - 6, 0.06, slit), { x: cx, y: y0 + 3, z: cz + cd / 2 + 0.02 }));
  g.add(place(box(0.06, top - 6, 0.35, slit), { x: cx - cw / 2 - 0.02, y: y0 + 3, z: cz }));
  // horizontal board joints
  for (let y = 1.5; y < top; y += 1.5) {
    for (const s of [1, -1]) g.add(place(box(cw + 0.04, 0.06, 0.04, raw), { x: cx, y: y0 + y, z: cz + s * (cd / 2) }));
    g.add(place(box(0.04, 0.06, cd + 0.04, raw), { x: cx - cw / 2, y: y0 + y, z: cz }));
  }
  // cap + lift-motor room louvre and mast
  g.add(place(box(cw + 0.3, 0.35, cd + 0.3, raw), { x: cx, y: y0 + top, z: cz }));
  g.add(place(box(1.2, 0.9, 0.06, mat(PALETTE.steelDark)), { x: cx, y: y0 + top - 1.6, z: cz + cd / 2 + 0.03 }));
  g.add(place(antenna({ h: 6 }), { x: cx + 0.6, y: y0 + top + 0.35, z: cz - 0.8 }));
  // ground-floor door into the core
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.steelDark }), { x: cx + 0.5, y: y0, z: cz + cd / 2 }));
}

function ground(g) {
  const z0 = CZ - D / 2, z1 = CZ + D / 2;
  // tapered pilotis: narrow at the ground, wide where they meet the slab
  const px = [CX - W / 2 + 1.0, CX - 2.5, CX + 2.5, CX + W / 2 - 1.6];
  for (const x of px) for (const z of [z1 - 1.5, z0 + 1.5]) {
    g.add(place(taperedBlock({ w: 0.6, d: 0.6, h: PH, topW: 1.1, topD: 1.6, material: raw }), { x, y: y0, z }));
  }

  // glazed lobby recessed under the slab
  const lw = 6.5, ld = 3.2, lx = CX - 1.6, lz = CZ - 0.6;
  g.add(place(facadeBlock({ w: lw, d: ld, h: PH, floorHeight: PH, bay: 1.5, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.darkGrey, lit: 0.5, seed: 4, roof: roofM }), { x: lx, y: y0, z: lz }));
  g.add(place(door({ w: 2.0, h: 2.6, color: PALETTE.glassDark, frame: PALETTE.darkGrey }), { x: lx, y: y0, z: lz + ld / 2 }));
  g.add(place(sign({ text: 'CIVIC HOUSE', w: 4.2, h: 0.7, bg: PALETTE.darkGrey, fg: '#f2efe6' }), { x: lx, y: y0 + 3.2, z: lz + ld / 2 + 0.02 }));

  // paving: plaza in front, asphalt bays under the east end of the slab
  g.add(place(patch(20, 5 - (z1 - 0.6), 'paved'), { y: y0, z: (z1 - 0.6 + 5) / 2 }));
  g.add(place(patch(4.6, D - 0.4, 'asphalt'), { x: CX + W / 2 - 2.5, y: y0, z: CZ }));
  const line = mat(PALETTE.white);
  for (const x of [CX + W / 2 - 4.7, CX + W / 2 - 2.5, CX + W / 2 - 0.3]) g.add(place(box(0.1, 0.02, 4.4, line), { x, y: y0 + 0.05, z: CZ - 0.6 }));
  g.add(place(car({ color: PALETTE.orange }), { x: CX + W / 2 - 3.6, y: y0 + 0.05, z: CZ - 0.4, ry: 90 }));
  g.add(place(car({ color: PALETTE.steelLight }), { x: CX + W / 2 - 1.4, y: y0 + 0.05, z: CZ - 1.0, ry: -90 }));

  // front plaza: concrete planters, benches, lamps, flags and a monolith sign
  const pz = 4.1;
  for (const x of [-6.5, 3.6]) {
    g.add(place(box(2.4, 0.7, 1.2, raw), { x, y: y0, z: pz }));
    g.add(place(box(2.1, 0.05, 0.9, mat(PALETTE.dirt)), { x, y: y0 + 0.7, z: pz }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: x * 7 }), { x: x - 0.5, y: y0 + 0.7, z: pz }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: x * 7 + 1 }), { x: x + 0.6, y: y0 + 0.7, z: pz }));
  }
  g.add(place(bench({ w: 1.8 }), { x: -3.4, y: y0, z: 4.3, ry: 180 }));
  g.add(place(bench({ w: 1.8 }), { x: 0.9, y: y0, z: 4.3, ry: 180 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -4.9, y: y0, z: 4.5 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 9.5, y: y0, z: 4.4, ry: 180 }));
  g.add(place(box(1.0, 2.4, 0.5, rawDark), { x: 6.6, y: y0, z: 4.2 }));
  g.add(place(sign({ text: 'CIVIC HOUSE', w: 0.9, h: 0.5, bg: PALETTE.darkGrey, fg: '#ffffff', depth: 0.05 }), { x: 6.6, y: y0 + 1.6, z: 4.45 }));
  for (const [x, c] of [[-9.4, PALETTE.red], [-8.6, PALETTE.blue]]) g.add(place(flag({ h: 6.5, color: c }), { x, y: y0, z: 4.5 }));

  // east strip: poplars; back: low hedge
  for (const z of [-3.0, 0.8]) g.add(place(tree({ kind: 'poplar', h: 7, seed: 50 + z }), { x: 9.1, y: y0, z }));
  g.add(place(hedge({ w: 6, h: 0.8, d: 0.5 }), { x: -6.6, y: y0, z: -4.65 }));
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'concrete'));
  ground(g);
  const roofY = slab(g);
  core(g, roofY);
  return g;
}

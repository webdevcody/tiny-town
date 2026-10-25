import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, place, stairs, surface, mat, metal, cylinder,
  tree, streetLamp, bench, sign, boxFaces, beam, fence, shade,
} from '../../src/lib/index.js';
import { sailShell } from './shell.js';

// Two halls of nested sail shells, each opening towards the front.
// [zFront, len, halfW, h, lean] per shell, front to back.
const BIG_HALL = [
  [1.4, 7.0, 3.7, 11.0, 1.6],
  [-2.4, 5.0, 3.35, 8.4, 1.2],
  [-5.2, 3.0, 2.9, 5.6, 0.8],
];
const SMALL_HALL = [
  [0.6, 6.2, 3.2, 9.2, 1.4],
  [-2.9, 4.4, 2.9, 7.0, 1.0],
  [-5.6, 2.8, 2.5, 4.6, 0.7],
];

// Monumental steps rising towards -z: pale treads, shadowed risers.
function grandStairs({ w, h, d, steps }) {
  const g = new THREE.Group();
  const tread = mat(shade(PALETTE.sandstone, 0.2));
  const riser = mat(shade(PALETTE.sandstone, -0.08));
  for (let i = 0; i < steps; i++) {
    const sh = (h * (i + 1)) / steps, sdp = d * (1 - i / steps);
    g.add(place(boxFaces(w, sh, sdp, { sides: riser, top: tread, bottom: riser, front: riser, back: riser }), { z: -d / 2 + sdp / 2 }));
  }
  return g;
}

// 2x2 tiles (20 x 20 m). Front (grand stairs) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'paved'));

  // --- stone plinth -------------------------------------------------------
  const pw = 17.2, pz0 = -8.8, pz1 = 1.8, ph = 3.2;
  const pd = pz1 - pz0, pzc = (pz0 + pz1) / 2;
  const stone = PALETTE.sandstone;
  const stoneDark = shade(PALETTE.sandstone, -0.18);
  const deck = surface('paving', shade(PALETTE.paving, 0.08), { size: 3 });
  g.add(place(facadeBlock({
    w: pw, d: pd, floors: 1, floorHeight: ph, style: 'grid', wall: stone, glass: PALETTE.glassDark,
    frame: stoneDark, bay: 2.4, lit: 0.25, seed: 85, roof: deck, blank: ['front'],
  }), { y: y0, z: pzc }));
  // cornice band
  g.add(place(box(pw + 0.3, 0.35, pd + 0.3, [mat(stoneDark), mat(stoneDark), deck, mat(stoneDark), mat(stoneDark), mat(stoneDark)]), { y: y0 + ph - 0.2, z: pzc }));
  const top = y0 + ph + 0.15;

  // --- grand stairs ---------------------------------------------------------
  const sw = 13, sd = 6, szc = pz1 + sd / 2;
  g.add(place(grandStairs({ w: sw, h: ph + 0.15, d: sd, steps: 14 }), { y: y0, z: szc }));
  // brass handrails down the middle of the flight
  const rail = metal(PALETTE.glassGold);
  for (const rx of [-2.2, 2.2]) {
    g.add(beam([rx, y0 + ph + 1.05, pz1 + 0.2], [rx, y0 + 0.95, pz1 + sd - 0.2], 0.08, rail));
    for (let k = 0; k <= 4; k++) {
      const zz = pz1 + 0.2 + ((sd - 0.4) * k) / 4, yy = ph + 0.15 - ((ph + 0.15) * (k + 0.5)) / 4.6;
      g.add(place(box(0.06, 0.9, 0.06, rail), { x: rx, y: y0 + Math.max(0, yy), z: zz }));
    }
  }
  for (const sx of [-1, 1]) {
    // stepped cheek walls with lamps on top
    g.add(place(stairs({ w: 0.9, h: ph + 0.6, d: sd, steps: 5, material: mat(stoneDark) }), { x: sx * (sw / 2 + 0.45), y: y0, z: szc }));
    g.add(place(streetLamp({ h: 3.6 }), { x: sx * (sw / 2 + 0.45), y: y0 + (ph + 0.6) / 5, z: pz1 + sd - 0.5, ry: sx > 0 ? 180 : 0 }));
    // planters with trees beside the stairs
    g.add(place(box(1.2, 0.6, 5, mat(stoneDark)), { x: sx * 8.2, y: y0, z: szc }));
    g.add(place(patch(1.0, 4.8, 'grass'), { x: sx * 8.2, y: y0 + 0.6, z: szc }));
    g.add(place(tree({ kind: 'round', h: 4.6, seed: 30 + sx }), { x: sx * 8.2, y: y0 + 0.6, z: szc + 1.2 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 40 + sx }), { x: sx * 8.2, y: y0 + 0.6, z: szc - 1.4 }));
  }

  // --- the sails ------------------------------------------------------------
  const halls = [[4.3, BIG_HALL], [-4.3, SMALL_HALL]];
  for (const [hx, shells] of halls) {
    for (const [zf, len, halfW, h, lean] of shells) {
      g.add(place(sailShell({ len, halfW, h, lean }), { x: hx, y: top, z: zf - len }));
    }
  }
  // low glazed link between the halls with a white slab roof
  g.add(place(box(1.6, 1.6, 5, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { y: top, z: -3 }));
  g.add(place(box(2.0, 0.25, 5.4, mat(PALETTE.white)), { y: top + 1.6, z: -3 }));

  // --- forecourt --------------------------------------------------------------
  g.add(place(patch(20, 2.1, 'cobbles'), { y: y0, z: 8.95 }));
  // festival banners on poles
  for (const [fx, c] of [[-5.6, PALETTE.red], [-3.6, PALETTE.purple], [3.6, PALETTE.purple], [5.6, PALETTE.red]]) {
    g.add(place(cylinder(0.06, 0.08, 5.2, metal(PALETTE.steelLight), 6), { x: fx, y: y0, z: 9.2 }));
    g.add(place(box(0.9, 0.06, 0.06, metal(PALETTE.steelLight)), { x: fx + 0.45, y: y0 + 5.0, z: 9.2 }));
    g.add(place(box(0.8, 2.2, 0.05, mat(c)), { x: fx + 0.5, y: y0 + 2.75, z: 9.2 }));
    g.add(place(box(0.6, 0.12, 0.06, mat(PALETTE.yellow)), { x: fx + 0.5, y: y0 + 4.4, z: 9.2 }));
  }
  g.add(place(box(4.4, 0.5, 0.8, mat(stoneDark)), { x: -7.6, y: y0, z: 9.2 }));
  g.add(place(sign({ text: 'OPERA HOUSE', w: 4.0, h: 0.9, bg: PALETTE.darkGrey, fg: '#f1e2b0' }), { x: -7.6, y: y0 + 0.5, z: 9.2 }));
  // poster column
  g.add(place(cylinder(0.45, 0.45, 2.4, mat(PALETTE.cream), 10), { x: 8.3, y: y0, z: 9.0 }));
  g.add(place(cylinder(0.55, 0.5, 0.25, metal(PALETTE.roofGreen), 10), { x: 8.3, y: y0 + 2.4, z: 9.0 }));
  g.add(place(cylinder(0.36, 0.36, 1.4, mat(PALETTE.red), 10), { x: 8.3, y: y0 + 0.6, z: 9.0, ry: 30 }));
  g.add(place(bench({ w: 1.6 }), { x: -1.2, y: y0, z: 9.3, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 1.2, y: y0, z: 9.3, ry: 180 }));

  // --- harbour edge at the back + side trees ---------------------------------
  g.add(place(patch(20, 1.0, 'water'), { y: y0, z: -9.5 }));
  g.add(place(fence({ w: 20, d: 0.1, h: 0.9, style: 'railing', sides: ['front'] }), { y: y0, z: -9.0 }));
  for (const sx of [-1, 1]) {
    for (const [z, k] of [[-7, 'cone'], [-3.5, 'poplar'], [0, 'cone']]) {
      g.add(place(tree({ kind: k, h: k === 'cone' ? 4.4 : 5, seed: 50 + z * sx }), { x: sx * 9.0, y: y0, z }));
    }
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, lot, patch, box, cylinder, sphere, place, group, beam, fence,
  tree, bench, streetLamp, gableRoof, awning, mat, metal, water, emissive,
} from '../../src/lib/index.js';
import { fairSign, ferrisWheel, carousel, stall, rollerCoaster, person, balloons, bunting } from './rides.js';

// 2x2 tiles (20 x 20 m). Front (street, entrance gate) faces +z.
// Back-left: Ferris wheel. Back-right: mini roller coaster. Front-right: carousel.
// Front-left: midway with stalls, high striker, duck pond and food cart.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // ground: paved midway across the front half, paths to the rides at the back
  g.add(place(patch(19.2, 9.2, 'paved'), { y: y0, z: 4.9 }));
  g.add(place(patch(3.2, 4.8, 'paved'), { x: -4.0, y: y0, z: -1.8 }));
  g.add(place(patch(2.6, 4.4, 'paved'), { x: 1.5, y: y0, z: -2.0 }));
  g.add(place(patch(7.6, 7.6, 'gravel'), { x: 5.9, y: y0, z: -5.3 }));
  g.add(place(cylinder(4.1, 4.1, 0.06, mat(PALETTE.cream), 28), { x: 5.6, y: y0, z: 5.0 }));

  // --- Ferris wheel (back-left) ---
  g.add(place(ferrisWheel({ radius: 5.3, hubY: 7.4, cars: 12 }), { x: -4.0, y: y0, z: -5.4 }));
  g.add(place(fairSign({ text: 'BIG WHEEL', w: 2.6, h: 0.6, bg: PALETTE.navy, fg: PALETTE.yellow }), { x: -4.0, y: y0 + 2.4, z: -2.85 }));
  g.add(place(box(0.1, 2.4, 0.1, PALETTE.darkGrey), { x: -5.2, y: y0, z: -2.9 }));
  g.add(place(box(0.1, 2.4, 0.1, PALETTE.darkGrey), { x: -2.8, y: y0, z: -2.9 }));

  // --- Mini roller coaster (back-right) ---
  const track = [
    [2.9, -1.6, 0.9], [2.9, -3.8, 0.9], [2.9, -6.0, 3.0], [3.1, -8.2, 5.8], [4.4, -9.1, 6.2],
    [6.0, -8.7, 2.8], [7.6, -8.6, 1.0], [8.9, -8.0, 1.4], [9.1, -6.0, 4.0], [8.8, -3.9, 1.6],
    [8.6, -1.8, 1.2], [7.2, -1.1, 2.6], [5.6, -2.3, 2.0], [4.5, -4.6, 1.5], [5.6, -6.3, 2.8],
    [6.8, -5.0, 1.4], [5.5, -1.2, 1.0], [3.8, -1.0, 0.9],
  ];
  g.add(place(rollerCoaster({ points: track, train: 4, trainAt: 0.45 }), { y: y0 }));
  // station: platform, posts and roof over the start of the track
  g.add(place(box(1.1, 0.85, 3.4, PALETTE.paving), { x: 1.8, y: y0, z: -2.7 }));
  for (const [x, z] of [[1.4, -1.1], [1.4, -4.3], [3.6, -1.1], [3.6, -4.3]]) {
    g.add(place(box(0.15, 2.9, 0.15, PALETTE.white), { x, y: y0, z }));
  }
  g.add(place(gableRoof({ w: 2.6, d: 3.6, h: 0.9, overhang: 0.2, ridge: 'z', material: mat(PALETTE.blue), gableMaterial: mat(PALETTE.white) }), { x: 2.5, y: y0 + 2.9, z: -2.7 }));
  g.add(place(fairSign({ text: 'COASTER', w: 2.2, h: 0.5, bg: PALETTE.red, fg: '#ffffff' }), { x: 2.5, y: y0 + 2.4, z: -0.95 }));

  // --- Carousel (front-right) ---
  g.add(place(carousel({ radius: 3.2 }), { x: 5.6, y: y0, z: 5.0 }));

  // --- Stalls along the left edge, facing the midway (+x) ---
  const stalls = [
    { text: 'HOT DOGS', color: PALETTE.red, color2: PALETTE.white, goods: [PALETTE.orange, PALETTE.yellow] },
    { text: 'CANDY', color: PALETTE.purple, color2: PALETTE.pink, body: PALETTE.white, goods: [PALETTE.pink, PALETTE.white] },
    { text: 'HOOPLA', color: PALETTE.green, color2: PALETTE.yellow, goods: [PALETTE.red, PALETTE.blue] },
  ];
  stalls.forEach((s, i) => g.add(place(stall(s), { x: -8.6, y: y0, z: 1.9 + i * 3.1, ry: 90 })));
  // ice cream stall facing the gate, next to the wheel path
  g.add(place(stall({ w: 2.4, d: 1.7, text: 'ICE CREAM', color: PALETTE.blue, color2: PALETTE.white, body: PALETTE.cream, goods: [PALETTE.pink, PALETTE.white, PALETTE.yellow] }), { x: -1.4, y: y0, z: 1.3 }));

  // high striker ("test your strength")
  const hs = group(
    box(1.0, 0.25, 0.8, PALETTE.woodDark),
    place(box(0.35, 4.6, 0.25, PALETTE.white), { y: 0.25 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 1.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 2.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 3.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 4.0 }),
    place(sphere(0.3, metal(PALETTE.glassGold, { roughness: 0.3 }), 10), { y: 4.75 }),
    place(box(0.5, 0.12, 0.5, PALETTE.yellow), { y: 0.25 }),
  );
  g.add(place(hs, { x: -6.4, y: y0, z: 8.6 }));

  // hook-a-duck pond
  g.add(place(cylinder(1.1, 1.15, 0.45, mat(PALETTE.yellow), 16), { x: -4.8, y: y0, z: 4.6 }));
  g.add(place(cylinder(0.95, 0.95, 0.05, water(PALETTE.pool), 16), { x: -4.8, y: y0 + 0.42, z: 4.6 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(place(group(box(0.28, 0.16, 0.18, PALETTE.yellow), place(box(0.12, 0.14, 0.12, PALETTE.yellow), { x: 0.12, y: 0.14 })), { x: -4.8 + Math.cos(a) * 0.6, y: y0 + 0.45, z: 4.6 + Math.sin(a) * 0.6, ry: -THREE.MathUtils.radToDeg(a) + 90 }));
  }
  g.add(place(awning({ w: 2.6, depth: 0.9, drop: 0.25, color: PALETTE.yellow, color2: PALETTE.red }), { x: -4.8, y: y0 + 2.2, z: 3.4 }));
  g.add(place(box(0.1, 2.2, 0.1, PALETTE.darkGrey), { x: -6.0, y: y0, z: 3.4 }));
  g.add(place(box(0.1, 2.2, 0.1, PALETTE.darkGrey), { x: -3.6, y: y0, z: 3.4 }));

  // popcorn cart with umbrella
  const cart = group(
    place(box(1.2, 0.9, 0.7, PALETTE.red), { y: 0.3 }),
    place(box(0.9, 0.6, 0.5, mat(PALETTE.windowLit, { transparent: true, opacity: 0.85 })), { y: 1.2 }),
    place(cylinder(0.25, 0.25, 0.12, PALETTE.darkGrey, 8), { x: -0.35, y: 0.05, z: 0.38, rx: 90 }),
    place(cylinder(0.25, 0.25, 0.12, PALETTE.darkGrey, 8), { x: 0.35, y: 0.05, z: 0.38, rx: 90 }),
    place(cylinder(0.04, 0.04, 2.2, PALETTE.white, 6), { y: 0.3 }),
    place(cylinder(0.02, 1.2, 0.45, mat(PALETTE.yellow), 8), { y: 2.3 }),
  );
  g.add(place(cart, { x: -1.0, y: y0, z: 6.6, ry: -20 }));

  // balloon seller
  g.add(place(person(PALETTE.green), { x: -3.0, y: y0, z: 7.4 }));
  g.add(place(balloons(6), { x: -3.0, y: y0, z: 7.4 }));

  // entrance gate with FUNFAIR sign
  const gateM = mat(PALETTE.red);
  for (const x of [-1.8, 1.8]) {
    g.add(place(box(0.45, 3.8, 0.45, gateM), { x, y: y0, z: 9.5 }));
    g.add(place(sphere(0.32, PALETTE.yellow, 10), { x, y: y0 + 3.8, z: 9.5 }));
  }
  g.add(place(box(4.0, 0.35, 0.35, PALETTE.yellow), { y: y0 + 3.2, z: 9.5 }));
  g.add(place(fairSign({ text: 'FUNFAIR', w: 3.4, h: 0.85, bg: PALETTE.blue, fg: PALETTE.yellow, border: PALETTE.yellow, double: true }), { y: y0 + 3.55, z: 9.5 }));
  // ticket booth
  const booth = group(
    box(1.3, 2.0, 1.2, PALETTE.yellow),
    place(box(0.9, 0.6, 0.05, mat(PALETTE.window)), { y: 1.1, z: 0.6 }),
    place(cylinder(0.01, 1.0, 0.7, mat(PALETTE.red), 4), { y: 2.0, ry: 45 }),
    place(fairSign({ text: 'TICKETS', w: 1.2, h: 0.3, bg: PALETTE.red, fg: '#ffffff' }), { y: 1.75, z: 0.62 }),
  );
  g.add(place(booth, { x: -3.0, y: y0, z: 8.9 }));

  // perimeter railing with the gate gap
  g.add(place(fence({ w: 19.6, d: 19.6, h: 1.0, style: 'railing', color: PALETTE.white, gap: 3.2 }), { y: y0 }));

  // bunting over the midway
  g.add(bunting([-1.8, y0 + 3.6, 9.5], [-8.6, y0 + 3.0, 6.9], { count: 10, sag: 0.5 }));
  g.add(bunting([1.8, y0 + 3.6, 9.5], [5.6, y0 + 3.7, 8.6], { count: 6, sag: 0.4 }));
  g.add(bunting([-8.6, y0 + 3.0, 3.7], [-1.4, y0 + 3.0, 2.3], { count: 9, sag: 0.5 }));

  // lamps, benches, bins
  for (const [x, z, ry] of [[-6.8, 1.2, 0], [1.2, 8.6, 180], [-0.4, -0.6, 180]]) g.add(place(streetLamp({ h: 4 }), { x, y: y0, z, ry }));
  g.add(place(bench({ w: 1.5 }), { x: 1.2, y: y0, z: 0.6, ry: 180 }));
  g.add(place(bench({ w: 1.5 }), { x: -6.6, y: y0, z: -0.2 }));
  for (const [x, z] of [[-2.2, 4.2], [1.4, 3.2]]) g.add(place(cylinder(0.25, 0.22, 0.75, PALETTE.green, 8), { x, y: y0, z }));

  // visitors
  const people = [
    [-6.8, 2.6, PALETTE.blue], [-6.9, 5.3, PALETTE.red], [-7.0, 7.9, PALETTE.yellow], [-3.6, 5.6, PALETTE.purple],
    [-1.4, 3.2, PALETTE.orange], [0.2, 7.9, PALETTE.white], [0.6, 5.0, PALETTE.blue], [1.6, 6.2, PALETTE.pink],
    [-4.6, -0.6, PALETTE.green], [-3.8, -1.6, PALETTE.red], [1.8, -0.4, PALETTE.yellow], [-5.6, 8.0, PALETTE.navy],
    [2.4, 1.9, PALETTE.red], [-2.2, 9.1, PALETTE.orange],
  ];
  for (const [x, z, c] of people) g.add(place(person(c), { x, y: y0, z, s: 0.95 }));

  // trees and hedges round the back
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 3 }), { x: -8.6, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'cone', h: 5.5, seed: 4 }), { x: -0.6, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 8 }), { x: -8.6, y: y0, z: -1.2 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 9 }), { x: 8.7, y: y0, z: 0.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -0.8, y: y0, z: -6.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 6 }), { x: -8.8, y: y0, z: -5.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 7 }), { x: 9.0, y: y0, z: 9.0 }));
  return g;
}

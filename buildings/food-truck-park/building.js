import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, cylinder, sphere, tree, mat, metal, surface, extrude,
} from '../../src/lib/index.js';
import { foodTruck, picnicTable, lightStrand, barShack, board, menuBoard, bins } from './parts.js';

// Point on the ring around the plaza centre. Angle in degrees: 0 = east (+x),
// 90 = north (-z), 180 = west, 270 = south (street side).
const polar = (r, a) => [r * Math.cos((a * Math.PI) / 180), -r * Math.sin((a * Math.PI) / 180)];

// 1x1 tile (10 x 10 m). Front (street, entrance arch) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // round gravel plaza + paved path in from the entrance
  const ring = [];
  for (let i = 0; i < 32; i++) ring.push(polar(4.6, (i * 360) / 32));
  g.add(place(extrude(ring, 0.04, surface('gravel', '#c2ab84', { size: 3 })), { y: y0 }));
  g.add(place(patch(1.6, 2.4, 'paved'), { x: -1.0, y: y0, z: 3.75 }));

  // ring of food trucks, serving hatches facing the middle
  const RT = 3.8;
  const trucks = [
    { a: 195, kind: 'van', name: 'TACOS', color: '#d8432e', accent: PALETTE.yellow, signBg: PALETTE.yellow, signFg: '#b8261c' },
    { a: 135, kind: 'trailer', name: 'PIZZA', color: '#e8e2cf', accent: '#2f9a8f', signBg: '#2f9a8f', signFg: '#ffffff', liveryFg: '#2f9a8f', prop: 'chimney' },
    { a: 75, kind: 'van', name: 'NOODLES', color: '#f0c22a', accent: '#c8322b', signBg: '#c8322b', signFg: '#ffffff', liveryFg: '#c8322b' },
    { a: 15, kind: 'van', name: 'ICE CREAM', color: '#ef9cbf', accent: '#ffffff', signBg: '#ffffff', signFg: '#d0457f', awningColor: '#e0609a', prop: 'icecream' },
  ];
  for (const t of trucks) {
    const [x, z] = polar(RT, t.a);
    g.add(place(foodTruck(t), { x, y: y0, z, ry: t.a - 90 }));
    const [mx, mz] = polar(2.25, t.a + 22);
    g.add(place(menuBoard(), { x: mx, y: y0, z: mz, ry: t.a - 90 }));
  }

  // bar shack in the front-right corner, its counter facing the entrance
  g.add(place(barShack(), { x: 3.15, y: y0, z: 3.15, ry: -45 }));

  // picnic tables round the central light mast
  const tableColors = [PALETTE.wood, '#2f9a8f', PALETTE.wood, '#c8322b'];
  [45, 135, 225, 315].forEach((a, i) => {
    const [x, z] = polar(1.5, a);
    g.add(place(picnicTable({ top: tableColors[i] }), { x, y: y0, z, ry: a - 90 }));
  });

  // festoon lights: central mast, poles between the trucks, entrance arch posts
  const mastH = 4.6, poleH = 3.6;
  const poleM = metal(PALETTE.darkGrey);
  g.add(place(cylinder(0.07, 0.1, mastH, poleM, 8), { y: y0 }));
  g.add(place(sphere(0.14, mat(PALETTE.darkGrey), 8), { y: y0 + mastH - 0.05 }));
  const top = [0, y0 + mastH - 0.1, 0];
  const anchors = [];
  for (const a of [165, 105, 45, -15]) {
    const [x, z] = polar(4.45, a);
    g.add(place(cylinder(0.05, 0.07, poleH, poleM, 6), { x, y: y0, z }));
    anchors.push([x, y0 + poleH - 0.1, z]);
  }
  // entrance arch
  const archL = -2.7, archR = 0.7, archZ = 4.45, archH = 3.3;
  const postM = mat(PALETTE.woodDark);
  for (const x of [archL, archR]) g.add(place(box(0.18, archH, 0.18, postM), { x, y: y0, z: archZ }));
  g.add(place(box(archR - archL + 0.3, 0.14, 0.2, postM), { x: (archL + archR) / 2, y: y0 + archH, z: archZ }));
  g.add(place(board('FOOD TRUCK PARK', { w: 3.1, h: 0.6, bg: '#24395e', fg: '#ffd84a', border: '#ffd84a', glow: 0.35 }), { x: (archL + archR) / 2, y: y0 + archH - 0.75, z: archZ + 0.02 }));
  anchors.push([archR, y0 + archH + 0.1, archZ], [archL, y0 + archH + 0.1, archZ]);

  const bulbs = ['#ffe7a0', '#ffe7a0', '#ff6b5b', '#ffe7a0', '#7fd0ff', '#ffe7a0', '#a6ff8a'];
  anchors.forEach((p, i) => {
    g.add(lightStrand(top, p, { sag: 0.45, spacing: 0.55, colors: bulbs, seed: i }));
    g.add(lightStrand(p, anchors[(i + 1) % anchors.length], { sag: 0.3, spacing: 0.55, colors: bulbs, seed: i + 3 }));
  });

  // corners: trees, bushes, bins, a generator behind the trucks
  g.add(place(tree({ kind: 'round', h: 4.4, seed: 7 }), { x: -3.7, y: y0, z: 3.7 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: 3.7, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 3 }), { x: -4.3, y: y0, z: -4.3 }));
  g.add(place(bins(), { x: -3.2, y: y0, z: 3.0, ry: 45 }));
  g.add(place(box(1.0, 0.7, 0.6, mat(PALETTE.yellow)), { x: 2.6, y: y0, z: -4.4, ry: -30 }));
  g.add(place(box(1.04, 0.08, 0.64, mat(PALETTE.darkGrey)), { x: 2.6, y: y0 + 0.7, z: -4.4, ry: -30 }));
  return g;
}

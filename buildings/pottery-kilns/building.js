import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, chimney, door, box, place, surface, mat,
  tree, fence, streetLamp,
} from '../../src/lib/index.js';
import { bottleKiln, smoke, saggarStack, crateOfPots, pot, heap, handcart, bigSign } from './kiln.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Victorian potbank: L of brick workshop ranges round a cobbled yard holding
// three brick bottle kilns, with clay heaps, saggar stacks and crates of pots.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'cobbles'));

  const brickWall = PALETTE.brick;
  const slate = surface('roofTiles', PALETTE.roofSlate, { size: 2 });
  const brickTex = surface('brick', brickWall, { size: 1.6, seed: 4 });
  const works = { style: 'brick', wall: brickWall, frame: PALETTE.cream, glass: PALETTE.window, bay: 1.8, windowW: 0.5, windowH: 0.55, lit: 0.15, seed: 7, roof: PALETTE.roofSlate };

  // back workshop range: two storeys, slate gable roof along X
  const ax = -4.8, az = -3.25, aw = 10.0, ad = 3.1;
  g.add(place(facadeBlock({ w: aw, d: ad, floors: 2, ...works }), { x: ax, y: y0, z: az }));
  g.add(place(gableRoof({ w: aw, d: ad, h: 1.7, overhang: 0.3, ridge: 'x', material: slate, gableMaterial: brickTex }), { x: ax, y: y0 + 2 * FLOOR, z: az }));
  g.add(place(chimney({ w: 0.7, h: 2.2 }), { x: ax - 3.2, y: y0 + 2 * FLOOR + 0.4, z: az }));
  g.add(place(chimney({ w: 0.7, h: 2.2 }), { x: ax + 1.6, y: y0 + 2 * FLOOR + 0.4, z: az }));
  // loading door with hoist beam
  g.add(place(door({ w: 1.2, h: 2.1, color: PALETTE.green }), { x: ax + 3.6, y: y0 + FLOOR + 0.1, z: az + ad / 2 }));
  g.add(place(box(0.2, 0.2, 1.2, mat(PALETTE.woodDark)), { x: ax + 3.6, y: y0 + 2 * FLOOR - 0.3, z: az + ad / 2 + 0.6 }));

  // front-left range: gable end on the street with the works name
  const bx = -8.25, bz = 1.3, bw = 3.1, bd = 5.3;
  g.add(place(facadeBlock({ w: bw, d: bd, floors: 2, ...works, seed: 9, blank: ['front'] }), { x: bx, y: y0, z: bz }));
  g.add(place(gableRoof({ w: bw, d: bd, h: 1.6, overhang: 0.3, ridge: 'z', material: slate, gableMaterial: brickTex }), { x: bx, y: y0 + 2 * FLOOR, z: bz }));
  const fz = bz + bd / 2;
  g.add(place(box(bw, 2 * FLOOR, 0.04, brickTex), { x: bx, y: y0, z: fz }));
  for (const x of [bx - 0.8, bx + 0.8]) g.add(place(box(0.7, 1.2, 0.06, mat(PALETTE.window)), { x, y: y0 + FLOOR + 1.0, z: fz + 0.02 }));
  g.add(place(box(3.3, 0.18, 0.12, mat(PALETTE.stone)), { x: bx, y: y0 + FLOOR, z: fz + 0.03 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.green }), { x: bx, y: y0, z: fz }));
  g.add(place(bigSign({ text: 'POTTERY', w: 2.9, h: 0.6, d: 0.06, bg: '#efe4c8', fg: '#7c3325', border: '#7c3325' }), { x: bx, y: y0 + 2.38, z: fz + 0.04 }));
  g.add(place(box(0.6, 0.6, 0.06, mat(PALETTE.window)), { x: bx, y: y0 + 2 * FLOOR + 0.4, z: fz + 0.02 }));

  // three bottle kilns
  const k1 = { x: -3.4, z: 1.3 }, k2 = { x: 2.6, z: -1.9 }, k3 = { x: 7.6, z: 2.3 };
  g.add(place(bottleKiln({ r: 2.6, h: 11.5, seed: 3 }), { ...k1, y: y0 }));
  g.add(place(bottleKiln({ r: 2.8, h: 12.5, brick: PALETTE.brickBrown, seed: 5 }), { ...k2, y: y0, ry: 20 }));
  g.add(place(bottleKiln({ r: 2.0, h: 9.0, seed: 8 }), { ...k3, y: y0, ry: -30 }));
  g.add(place(smoke({ puffs: 4 }), { x: k2.x, y: y0 + 13.1, z: k2.z }));

  // clay heaps and coal by the back-right corner, behind a low brick wall
  g.add(place(heap({ r: 1.7, h: 1.2, color: '#a99c84', seed: 1 }), { x: 7.7, y: y0, z: -3.3 }));
  g.add(place(heap({ r: 1.2, h: 0.9, color: '#b5674a', seed: 2 }), { x: 8.6, y: y0, z: -0.9 }));
  g.add(place(heap({ r: 1.0, h: 0.7, color: '#2b2a2c', seed: 3 }), { x: 5.9, y: y0, z: -4.2 }));
  g.add(place(box(0.25, 0.9, 6.0, surface('brick', PALETTE.brickDark, { size: 1 })), { x: 9.8, y: y0, z: -2.0 }));
  g.add(place(box(4.6, 0.9, 0.25, surface('brick', PALETTE.brickDark, { size: 1 })), { x: 7.6, y: y0, z: -4.85 }));

  // saggar stacks around the kilns
  for (const [x, z, n] of [[-0.2, 3.6, 6], [0.5, 3.0, 5], [-0.6, 2.4, 4], [5.6, 0.6, 6], [6.2, 0.0, 5], [5.1, -4.4, 5], [-0.7, -1.2, 6]]) {
    g.add(place(saggarStack({ n }), { x, y: y0, z }));
  }

  // crates of pots and a handcart in the yard by the gate
  g.add(place(crateOfPots({ seed: 0 }), { x: 2.2, y: y0, z: 3.9 }));
  g.add(place(crateOfPots({ seed: 2 }), { x: 3.5, y: y0, z: 3.9 }));
  g.add(place(crateOfPots({ seed: 4 }), { x: 2.85, y: y0 + 0.62, z: 3.9 }));
  g.add(place(crateOfPots({ seed: 1, w: 0.9 }), { x: 4.8, y: y0, z: 4.1, ry: 15 }));
  g.add(place(handcart(), { x: 3.0, y: y0, z: 1.8, ry: 10 }));
  g.add(place(crateOfPots({ seed: 3, w: 1.0, d: 0.7, h: 0.4 }), { x: 3.1, y: y0 + 0.6, z: 1.8, ry: 10 }));
  for (const [x, z, c] of [[-6.0, 4.3, '#c45a30'], [-5.6, 4.5, '#2f5fa8'], [-6.3, 3.8, '#f1eee6'], [1.2, 4.5, '#4f8b6f']]) {
    g.add(place(pot({ color: c, h: 0.7 }), { x, y: y0, z }));
  }

  // street frontage: railings, gas lamp, a tree
  g.add(place(fence({ w: 3.0, d: 0.1, h: 1.0, style: 'railing', sides: ['front'] }), { x: -5.2, y: y0, z: 4.8 }));
  g.add(place(streetLamp({ h: 4 }), { x: 0.7, y: y0, z: 4.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 }), { x: 9.3, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 13 }), { x: -9.4, y: y0, z: 4.5 }));
  g.add(place(patch(3.5, 1.4, 'paved'), { x: 3.4, y: y0, z: 4.3 }));
  // gateway: brick piers carrying the works name board
  const pier = surface('brick', PALETTE.brickDark, { size: 1 });
  for (const x of [1.5, 5.3]) {
    g.add(place(box(0.5, 3.4, 0.5, pier), { x, y: y0, z: 4.7 }));
    g.add(place(box(0.65, 0.15, 0.65, mat(PALETTE.stone)), { x, y: y0 + 3.4, z: 4.7 }));
  }
  g.add(place(bigSign({ text: 'TINY TOWN POTTERY', w: 3.3, h: 0.7, d: 0.1, bg: PALETTE.navy, fg: '#f3e6c0', border: '#e2c45a' }), { x: 3.4, y: y0 + 2.5, z: 4.7 }));
  return g;
}

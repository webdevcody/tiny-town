import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, field, box, cylinder, place, mat, metal, emissive, surface, gableRoof, fence, streetLamp, door,
} from '../../src/lib/index.js';
import { fir, stump, nettedTree, stringLights, bigSign, wreath, nettingMachine, carWithTree, pickup, person } from './props.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: rows of firs grouped by age. East: sales barn with lights, netting
// machine, cut-tree rack and customers leaving with trees on their cars.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const r = rng(1225);
  g.add(lot([2, 1], 'grass'));

  // ---- tree field (x -9.8 .. 0.4) ----
  const rows = [
    { z: -3.85, h: 3.6 },
    { z: -2.2, h: 2.9 },
    { z: -0.4, h: 2.3 },
    { z: 1.4, h: 1.7 },
    { z: 3.1, h: 1.05 },
  ];
  const fieldX0 = -8.85, fieldX1 = -0.3, perRow = 7;
  rows.forEach((row, ri) => {
    g.add(place(patch(9.9, 0.9, field('plowed', { size: 3 })), { x: -4.7, y: y0, z: row.z }));
    for (let i = 0; i < perRow; i++) {
      const x = fieldX0 + ((fieldX1 - fieldX0) * i) / (perRow - 1) + r.range(-0.15, 0.15);
      const z = row.z + r.range(-0.12, 0.12);
      // a few gaps where trees were already cut
      if (ri > 0 && ri < 4 && r.chance(0.16)) {
        g.add(place(stump(), { x, y: y0, z }));
        continue;
      }
      g.add(place(fir(row.h * r.range(0.85, 1.12), { seed: r.int(0, 4) }), { x, y: y0, z, ry: r.range(0, 360) }));
    }
  });
  // split-rail fence on the street side of the field, open at the walkway
  const rail = mat(PALETTE.woodLight);
  for (let x = -9.6; x <= -0.6; x += 1.5) g.add(place(box(0.14, 1.0, 0.14, mat(PALETTE.wood)), { x, y: y0, z: 4.75 }));
  for (const yy of [0.45, 0.85]) g.add(place(box(9.1, 0.09, 0.07, rail), { x: -5.1, y: y0 + yy, z: 4.75 }));

  // customer dragging a freshly cut tree out of the rows, and one choosing
  g.add(place(person(PALETTE.red, { hat: PALETTE.red }), { x: -2.2, y: y0, z: 2.25, ry: 90 }));
  g.add(place(nettedTree(1.8, 0.3), { x: -2.5, y: y0 + 0.25, z: 2.25, ry: 180, rz: -8 }));
  g.add(place(person(PALETTE.blue, { pants: PALETTE.darkGrey }), { x: -6.3, y: y0, z: 0.5, ry: 200 }));

  // gravel walkway between field and yard, gravel yard in front of the barn
  g.add(place(patch(1.1, 10, 'gravel'), { x: 0.75, y: y0 }));
  g.add(place(patch(9.0, 5.2, 'gravel'), { x: 5.5, y: y0, z: 2.4 }));

  // ---- sales barn ----
  const bx = 6.2, bz = -2.45, bw = 6.4, bd = 4.5, wallH = 3.2;
  const planks = surface('planks', '#2e6a3e', { size: 1.6 });
  const trim = mat(PALETTE.white);
  g.add(place(box(bw, wallH, bd, [planks, planks, mat('#2e6a3e'), planks, planks, planks]), { x: bx, y: y0, z: bz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.2, wallH, 0.2, trim), { x: bx + sx * bw / 2, y: y0, z: bz + sz * bd / 2 }));
  g.add(place(box(bw + 0.1, 0.18, bd + 0.1, trim), { x: bx, y: y0 + wallH - 0.18, z: bz }));
  const roofH = 2.4;
  g.add(place(gableRoof({ w: bw, d: bd, h: roofH, overhang: 0.35, ridge: 'z', material: surface('corrugated', PALETTE.roofSlate, { size: 1.2 }), gableMaterial: mat('#2e6a3e') }), { x: bx, y: y0 + wallH, z: bz }));
  // snow-white ridge cap
  g.add(place(box(0.35, 0.12, bd + 0.75, trim), { x: bx, y: y0 + wallH + roofH - 0.06, z: bz }));

  g.add(place(cylinder(0.16, 0.16, 1.6, metal(PALETTE.roofBlack), 8), { x: bx + 1.6, y: y0 + wallH + 0.9, z: bz - 1.0 }));
  g.add(place(cylinder(0.3, 0.3, 0.1, metal(PALETTE.roofBlack), 8), { x: bx + 1.6, y: y0 + wallH + 2.5, z: bz - 1.0 }));
  const front = bz + bd / 2;
  // big open doorway with a lit shop inside
  g.add(place(box(2.8, 2.5, 0.06, emissive('#ffcf73', 0.55)), { x: bx, y: y0, z: front }));
  g.add(place(box(3.1, 0.18, 0.1, trim), { x: bx, y: y0 + 2.5, z: front + 0.02 }));
  for (const sx of [-1, 1]) g.add(place(box(0.15, 2.5, 0.1, trim), { x: bx + sx * 1.47, y: y0, z: front + 0.02 }));
  // stock inside: wreaths on the back wall and a counter
  for (const x of [-0.8, 0, 0.8]) g.add(place(wreath(0.28), { x: bx + x, y: y0 + 1.3, z: front + 0.04 }));
  g.add(place(box(1.6, 0.9, 0.35, mat(PALETTE.woodDark)), { x: bx + 0.3, y: y0, z: front + 0.12 }));
  // slid-open barn door (white X-brace) beside the doorway
  const doorX = bx - bw / 2 + 0.85;
  g.add(place(box(1.4, 2.5, 0.1, mat('#b23a30')), { x: doorX, y: y0, z: front + 0.12 }));
  g.add(place(box(1.4, 0.12, 0.04, trim), { x: doorX, y: y0 + 1.2, z: front + 0.19 }));
  g.add(place(box(0.12, 2.8, 0.04, trim), { x: doorX, y: y0 - 0.1, z: front + 0.19, rz: 27 }));
  g.add(place(box(0.12, 2.8, 0.04, trim), { x: doorX, y: y0 - 0.1, z: front + 0.19, rz: -27 }));
  g.add(place(box(3.6, 0.1, 0.12, metal(PALETTE.steelDark)), { x: bx - 1.2, y: y0 + 2.75, z: front + 0.12 }));
  // name board on the gable and a wreath at the apex
  g.add(place(bigSign('TREE FARM', 3.4, 0.75, { bg: PALETTE.white, fg: '#b2241c', border: '#b2241c', double: false }), { x: bx, y: y0 + wallH + 0.12, z: front + 0.08 }));
  g.add(place(wreath(0.38), { x: bx, y: y0 + wallH + 1.0, z: front + 0.06 }));
  // lit side windows with green shutters
  for (const z of [bz - 1.2, bz + 0.6]) for (const sx of [-1, 1]) {
    g.add(place(box(0.06, 0.9, 0.9, emissive(PALETTE.windowLit, 0.5)), { x: bx + sx * (bw / 2 + 0.02), y: y0 + 1.1, z }));
    g.add(place(box(0.08, 0.1, 1.1, trim), { x: bx + sx * (bw / 2 + 0.03), y: y0 + 1.0, z }));
  }
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.woodDark }), { x: bx + bw / 2, y: y0, z: bz - 0.4, ry: 90 }));

  // fairy lights along both eaves and up the front gable
  const eaveY = y0 + wallH - 0.05, ex = bw / 2 + 0.4;
  for (const sx of [-1, 1]) {
    const lights = stringLights([bx + sx * ex, eaveY, bz - bd / 2 - 0.3], [bx + sx * ex, eaveY, bz + bd / 2 + 0.3], { sag: 0.12, seed: sx > 0 ? 1 : 0, count: 12 });
    g.add(lights);
    g.add(stringLights([bx + sx * (bw / 2 + 0.1), y0 + wallH + 0.05, front + 0.42], [bx, y0 + wallH + roofH + 0.05, front + 0.42], { sag: 0.05, count: 9, seed: 2, wire: false }));
  }

  // ---- yard ----
  // light poles with strings of bulbs over the yard
  const poles = [[2.2, 4.6], [5.4, 4.6], [9.5, 4.6]];
  for (const [x, z] of poles) g.add(place(box(0.14, 3.6, 0.14, mat(PALETTE.woodDark)), { x, y: y0, z }));
  for (let i = 0; i < poles.length - 1; i++) {
    g.add(stringLights([poles[i][0], y0 + 3.5, poles[i][1]], [poles[i + 1][0], y0 + 3.5, poles[i + 1][1]], { sag: 0.4, seed: i }));
  }
  g.add(stringLights([2.2, y0 + 3.5, 4.6], [bx - bw / 2 - 0.4, eaveY, front + 0.3], { sag: 0.35, seed: 3 }));
  g.add(stringLights([9.5, y0 + 3.5, 4.6], [bx + bw / 2 + 0.4, eaveY, front + 0.3], { sag: 0.35, seed: 4 }));

  // netting machine on the walkway corner, worker feeding it
  g.add(place(nettingMachine(), { x: 2.6, y: y0, z: 1.25 }));
  g.add(place(person('#2d7a3a', { pants: PALETTE.woodDark, hat: PALETTE.red }), { x: 1.75, y: y0, z: 2.15, ry: 160 }));

  // rack of pre-cut trees leaning on a rail along the east edge
  const rackX = 8.9;
  g.add(place(box(0.12, 1.6, 0.12, mat(PALETTE.wood)), { x: rackX, y: y0, z: 0.35 }));
  g.add(place(box(0.12, 1.6, 0.12, mat(PALETTE.wood)), { x: rackX, y: y0, z: 2.9 }));
  g.add(place(box(0.1, 0.1, 2.7, mat(PALETTE.wood)), { x: rackX, y: y0 + 1.5, z: 1.63 }));
  for (let i = 0; i < 5; i++) {
    const t = fir(2.0 + r.range(-0.2, 0.3), { seed: i });
    g.add(place(t, { x: rackX + 0.35, y: y0, z: 0.55 + i * 0.52, rz: 14 }));
  }
  g.add(place(bigSign('$45', 0.9, 0.45, { bg: PALETTE.white, fg: '#b2241c' }), { x: rackX - 0.05, y: y0 + 1.6, z: 1.63, ry: 90 }));

  // customers leaving with trees: car heading out to the street, pickup loaded
  g.add(place(carWithTree(PALETTE.blue, 1), { x: 7.7, y: y0 + 0.05, z: 3.95, s: 0.75 }));
  g.add(place(pickup('#c9a43a'), { x: 4.2, y: y0 + 0.05, z: 3.65, ry: 180, s: 0.72 }));
  g.add(place(person(PALETTE.purple), { x: 5.95, y: y0, z: 2.95, ry: -60 }));

  // roadside sign at the entrance
  for (const x of [-1.25, 1.25]) g.add(place(box(0.16, 1.7, 0.16, mat(PALETTE.woodDark)), { x: 0.3 + x, y: y0, z: 4.5 }));
  g.add(place(bigSign('CHRISTMAS TREES', 3.0, 0.75, { bg: '#b2241c', fg: '#ffffff', border: '#ffffff' }), { x: 0.3, y: y0 + 1.45, z: 4.5 }));
  g.add(place(bigSign('U-CUT', 1.4, 0.42, { bg: '#2e6a3e', fg: '#ffffff' }), { x: 0.3, y: y0 + 0.95, z: 4.5 }));
  g.add(place(streetLamp({ h: 4 }), { x: 9.6, y: y0, z: -4.6, ry: 180 }));
  // wagon of trees just brought in from the rows
  const wagon = new THREE.Group();
  wagon.add(place(box(1.5, 0.12, 3.0, mat(PALETTE.wood)), { y: 0.55 }));
  for (const sx of [-1, 1]) wagon.add(place(box(0.06, 0.4, 3.0, mat(PALETTE.woodDark)), { x: sx * 0.72, y: 0.67 }));
  wagon.add(place(box(0.08, 0.08, 1.2, metal(PALETTE.steelDark)), { y: 0.45, z: 2.0 }));
  for (const sz of [-1, 1]) for (const sx of [-1, 1]) {
    const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.16, 10).rotateZ(Math.PI / 2), mat(PALETTE.black));
    wh.position.set(sx * 0.82, 0.3, sz * 0.9);
    wagon.add(wh);
  }
  for (let i = 0; i < 4; i++) wagon.add(place(nettedTree(2.6, 0.3), { x: -0.5 + (i % 2) * 0.55 + (i > 1 ? 0.28 : 0), y: 0.95 + (i > 1 ? 0.45 : 0), z: -1.3, ry: -90 }));
  g.add(place(wagon, { x: 2.05, y: y0, z: -2.8 }));
  return g;
}

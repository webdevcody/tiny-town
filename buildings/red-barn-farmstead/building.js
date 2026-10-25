import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, pyramidRoof, chimney, door, windowPanel, box, cylinder, place, group,
  silo, tree, fence, surface, mat, metal, hayBale, beam, stairs, rng,
} from '../../src/lib/index.js';
import { gambrelRoof, gambrelTrim, xDoor, tractor, hayTrailer, chicken } from './parts.js';

const BARN_RED = '#b02e26';
const SILO_BLUE = '#3d6fb0';

// Red gambrel barn, front gable faces +z. Origin = centre of the barn floor.
function barn({ w, d, wallH }) {
  const g = new THREE.Group();
  const red = surface('planks', BARN_RED, { size: 2 });
  const white = mat(PALETTE.white);
  const doorRed = mat('#8e231d');
  // stone plinth + plank walls
  g.add(box(w + 0.2, 0.5, d + 0.2, surface('cobbles', PALETTE.stone, { size: 2 })));
  g.add(place(box(w, wallH - 0.5, d, red), { y: 0.5 }));
  // white corner boards and eave trim
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.25, wallH - 0.5, 0.25, white), { x: sx * (w / 2), y: 0.5, z: sz * (d / 2) }));
  for (const sx of [-1, 1]) g.add(place(box(0.12, 0.25, d + 0.2, white), { x: sx * (w / 2 + 0.03), y: wallH - 0.25 }));

  // gambrel roof with white fascia
  const roofH = 4.2;
  const roof = gambrelRoof({ w, d, h: roofH, overhang: 0.45, material: surface('shingles', PALETTE.roofSlate, { size: 2 }), gableMaterial: red });
  g.add(place(roof, { y: wallH }));
  g.add(place(gambrelTrim(roof, { t: 0.22 }), { y: wallH }));

  // front and back: big X-braced double doors, hayloft door with a hood
  for (const [sz, ry] of [[1, 0], [-1, 180]]) {
    const f = new THREE.Group();
    f.add(place(box(4.2, 3.7, 0.08, white), { y: 0.45 })); // door surround
    f.add(place(xDoor({ w: 1.9, h: 3.4, color: doorRed }), { x: -0.97, y: 0.5, z: 0.04 }));
    f.add(place(xDoor({ w: 1.9, h: 3.4, color: doorRed }), { x: 0.97, y: 0.5, z: 0.04 }));
    f.add(place(box(4.6, 0.14, 0.24, mat(PALETTE.darkGrey)), { y: 3.95 })); // door rail
    f.add(place(xDoor({ w: 1.6, h: 1.7, color: doorRed }), { y: wallH + 0.55 }));
    f.add(place(gableRoof({ w: 2.0, d: 1.1, h: 0.6, overhang: 0.1, ridge: 'z', material: surface('shingles', PALETTE.roofSlate, { size: 2 }), gableMaterial: BARN_RED }), { y: wallH + 2.45, z: 0.55 }));
    f.add(place(box(0.2, 0.2, 1.4, mat(PALETTE.woodDark)), { y: wallH + 2.6, z: 0.7 })); // hay hoist beam
    for (const sx of [-1, 1]) f.add(place(windowPanel({ w: 0.8, h: 0.9, frame: PALETTE.white }), { x: sx * 3.0, y: 2.0 }));
    g.add(place(f, { z: sz * (d / 2), ry }));
  }

  // side windows and a people door
  for (const sx of [-1, 1]) {
    for (const z of [-3.6, -1.2, 1.2, 3.6]) {
      if (sx === 1 && z === 1.2) continue;
      g.add(place(windowPanel({ w: 0.8, h: 0.9, frame: PALETTE.white }), { x: sx * (w / 2), y: 2.2, z, ry: sx * 90 }));
    }
  }
  g.add(place(door({ w: 1.1, h: 2.3, color: doorRed, frame: PALETTE.white }), { x: w / 2, y: 0.5, z: 1.2, ry: 90 }));

  // cupola + weathervane on the ridge
  const ridgeY = wallH + roofH;
  const cup = new THREE.Group();
  cup.add(place(box(1.5, 0.4, 1.5, red), { y: -0.3 }));
  cup.add(box(1.2, 1.1, 1.2, white));
  for (const r of [0, 90]) cup.add(place(box(0.8, 0.7, 1.24, mat(PALETTE.darkGrey)), { y: 0.2, ry: r }));
  cup.add(place(pyramidRoof({ w: 1.2, d: 1.2, h: 0.9, overhang: 0.2, material: surface('shingles', PALETTE.roofSlate, { size: 2 }) }), { y: 1.1 }));
  const vane = metal(PALETTE.darkGrey);
  cup.add(place(cylinder(0.04, 0.04, 1.1, vane, 6), { y: 1.9 }));
  cup.add(place(box(0.9, 0.06, 0.06, vane), { y: 2.6 }));
  cup.add(place(box(0.06, 0.06, 0.6, vane), { y: 2.45 }));
  cup.add(place(box(0.3, 0.25, 0.04, vane), { x: 0.4, y: 2.5 }));
  g.add(place(cup, { y: ridgeY, z: -0.5 }));
  return g;
}

// White clapboard farmhouse with a front porch (+z).
function farmhouse({ w, d }) {
  const g = new THREE.Group();
  const white = PALETTE.white;
  g.add(box(w + 0.2, 0.4, d + 0.2, mat(PALETTE.stone)));
  g.add(place(facadeBlock({
    w, d, floors: 2, style: 'punched', wall: white, frame: PALETTE.white, glass: PALETTE.window,
    shutters: '#3d6b46', windowW: 0.4, windowH: 0.52, bay: 1.8, lit: 0.15, seed: 7, roof: PALETTE.roofSlate,
  }), { y: 0.4 }));
  const top = 0.4 + 2 * FLOOR;
  g.add(place(gableRoof({ w, d, h: 2.4, overhang: 0.35, ridge: 'x', material: surface('shingles', PALETTE.roofRed, { size: 2 }), gableMaterial: white }), { y: top }));
  g.add(place(chimney({ w: 0.7, d: 0.7, h: 2.8, material: surface('brick', PALETTE.brick, { size: 1 }) }), { x: -w / 2 + 0.9, y: top + 0.4, z: -0.6 }));
  // porch: deck, posts, shallow roof, steps, door
  const pd = 1.7;
  g.add(place(door({ w: 1.0, h: 2.2, color: '#3d6b46', frame: PALETTE.white }), { x: 0.6, y: 0.4, z: d / 2 }));
  g.add(place(box(w - 0.4, 0.4, pd, mat(PALETTE.wood)), { y: 0, z: d / 2 + pd / 2 }));
  g.add(place(stairs({ w: 1.2, h: 0.4, d: 0.6, steps: 2 }), { x: 0.6, z: d / 2 + pd + 0.3, ry: 180 }));
  for (const x of [-w / 2 + 0.4, -0.3, 1.5, w / 2 - 0.4]) g.add(place(box(0.14, 2.4, 0.14, mat(white)), { x, y: 0.4, z: d / 2 + pd - 0.15 }));
  g.add(place(box(w - 0.2, 0.14, pd + 0.3, mat(PALETTE.roofSlate)), { y: 2.85, z: d / 2 + pd / 2 + 0.05, rx: 8 }));
  g.add(place(box(w - 0.4, 0.5, 0.06, mat(white)), { x: 0, y: 0.4, z: d / 2 + pd - 0.12 }));
  return g;
}

// Raised wooden hen house with a ramp; door side faces +z.
function coop() {
  const g = new THREE.Group();
  const wood = surface('planks', '#c9a46a', { size: 1.5 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.12, 0.6, 0.12, mat(PALETTE.woodDark)), { x: sx * 1.0, z: sz * 0.75 }));
  g.add(place(box(2.3, 1.5, 1.8, wood), { y: 0.6 }));
  g.add(place(box(2.5, 0.12, 2.2, surface('corrugated', BARN_RED, { size: 1 })), { y: 2.15, z: 0, rx: 10 }));
  g.add(place(box(0.5, 0.55, 0.06, mat(PALETTE.woodDark)), { x: 0.5, y: 0.7, z: 0.92 }));
  g.add(place(box(0.5, 0.06, 1.2, mat(PALETTE.wood)), { x: 0.5, y: 0.33, z: 1.4, rx: -28 }));
  g.add(place(windowPanel({ w: 0.5, h: 0.4, frame: PALETTE.white }), { x: -0.5, y: 1.3, z: 0.9 }));
  return g;
}

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const r = rng(90);
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // ground: dirt farmyard in front of the barn, driveway to the street, lawn paths
  g.add(place(patch(9.6, 7.0, 'dirt'), { x: -4.6, y: y0, z: 6.2 }));
  g.add(place(patch(2.6, 12.5, 'gravel'), { x: 1.4, y: y0, z: 3.75 }));
  g.add(place(patch(1.1, 1.6, 'paved'), { x: 7.4, y: y0, z: -0.6 }));
  g.add(place(patch(4.6, 1.1, 'paved'), { x: 5.0, y: y0, z: 0.3 }));

  // barn
  const bw = 8.4, bd = 11, bx = -4.4, bz = -2.9;
  g.add(place(barn({ w: bw, d: bd, wallH: 4.4 }), { x: bx, y: y0, z: bz }));

  // blue silo with white bands, ladder and a chute to the barn
  const sx = 2.0, sz = -6.6, sr = 1.75, sh = 12.5;
  g.add(place(cylinder(sr + 0.3, sr + 0.3, 0.3, mat(PALETTE.concrete), 18), { x: sx, y: y0, z: sz }));
  g.add(place(silo({ radius: sr, h: sh, material: surface('corrugated', SILO_BLUE, { size: 2, metalness: 0.2, roughness: 0.6 }), roofMaterial: metal(PALETTE.steelLight, { roughness: 0.4 }) }), { x: sx, y: y0 + 0.3, z: sz }));
  for (const by of [3, 6.5, 10]) g.add(place(cylinder(sr + 0.05, sr + 0.05, 0.3, mat(PALETTE.white), 18), { x: sx, y: y0 + 0.3 + by, z: sz }));
  const lad = metal(PALETTE.steelLight);
  for (const dx of [-0.25, 0.25]) g.add(place(box(0.07, sh, 0.07, lad), { x: sx + dx, y: y0 + 0.3, z: sz + sr + 0.05 }));
  for (let i = 1; i < 24; i++) g.add(place(box(0.5, 0.05, 0.05, lad), { x: sx, y: y0 + 0.3 + i * 0.5, z: sz + sr + 0.05 }));
  g.add(beam([sx - 0.8, y0 + sh + 0.2, sz], [bx + bw / 2 - 0.6, y0 + 4.4 + 1.6, sz], 0.35, metal(PALETTE.steel)));

  // farmhouse
  const fw = 5.4, fd = 5.0, fx = 6.8, fz = -6.0;
  g.add(place(farmhouse({ w: fw, d: fd }), { x: fx, y: y0, z: fz }));

  // chicken run: wire fence, coop, chickens
  const cw = 6.4, cd = 6.6, cx = 6.3, cz = 5.6;
  g.add(place(patch(cw, cd, surface('gravel', PALETTE.dirt, { size: 3 })), { x: cx, y: y0, z: cz }));
  g.add(place(fence({ w: cw, d: cd, h: 1.2, style: 'wire', color: PALETTE.lightGrey }), { x: cx, y: y0, z: cz }));
  g.add(place(box(1.0, 1.2, 0.06, mat(PALETTE.wood)), { x: cx - cw / 2 + 1.0, y: y0, z: cz - cd / 2 })); // gate
  g.add(place(coop(), { x: cx + 1.7, y: y0, z: cz - 1.8 }));
  g.add(place(box(1.0, 0.25, 0.4, metal(PALETTE.steel)), { x: cx - 1.8, y: y0, z: cz - 2.2 })); // feeder
  const hens = [[-2.0, 0.2], [-1.0, 1.4], [0.2, 0.4], [1.4, 1.8], [-2.2, 2.4], [0.6, 2.7], [2.2, 0.6], [-0.6, -0.9], [2.4, 2.8]];
  hens.forEach(([x, z], i) => g.add(place(chicken({ color: i % 3 === 2 ? '#b5651d' : PALETTE.white }), { x: cx + x, y: y0, z: cz + z, ry: r.range(0, 360) })));

  // farmyard: tractor with hay trailer, round bales, water trough
  g.add(place(group(
    place(tractor(), { x: 3.4 }),
    hayTrailer({ color: BARN_RED }),
  ), { x: -6.2, y: y0, z: 6.6, ry: 20 }));
  g.add(place(hayBale({ r: 0.75 }), { x: -8.6, y: y0, z: 3.8, ry: 90 }));
  g.add(place(hayBale({ r: 0.75 }), { x: -8.6, y: y0, z: 5.6, ry: 90 }));
  g.add(place(hayBale({ r: 0.75 }), { x: -8.6, y: y0 + 1.5, z: 4.7, ry: 90 }));
  g.add(place(hayBale({ r: 0.75 }), { x: -0.9, y: y0, z: 3.9 }));
  g.add(place(box(2.0, 0.6, 0.7, metal(PALETTE.steel)), { x: -1.2, y: y0, z: -7.5, ry: 90 }));
  g.add(place(box(1.8, 0.05, 0.5, mat(PALETTE.water)), { x: -1.2, y: y0 + 0.56, z: -7.5, ry: 90 }));

  // split-rail fence along the street side of the yard, mailbox by the drive
  g.add(place(fence({ w: 9.4, d: 0.1, h: 1.0, style: 'picket', color: PALETTE.wood, sides: ['front'] }), { x: -4.95, y: y0, z: 9.55 }));
  g.add(place(box(0.1, 1.0, 0.1, mat(PALETTE.woodDark)), { x: 0.0, y: y0, z: 9.4 }));
  g.add(place(box(0.35, 0.3, 0.55, mat(PALETTE.red)), { x: 0.0, y: y0 + 1.0, z: 9.4 }));

  // farmhouse garden: trees and bushes
  g.add(place(tree({ kind: 'round', h: 5, seed: 12 }), { x: 8.9, y: y0, z: 0.8 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 13 }), { x: 3.6, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'poplar', h: 7, seed: 14 }), { x: -9.1, y: y0, z: -9.1 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 15 }), { x: 4.4, y: y0, z: -1.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 16 }), { x: 9.3, y: y0, z: -3.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 17 }), { x: -9.4, y: y0, z: 1.0 }));
  return g;
}

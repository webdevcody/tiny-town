import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, group, gableRoof, shedRoof, chimney, door, sign,
  tree, hedge, streetLamp, bench, flag, beam, surface, mat, metal, shade,
} from '../../src/lib/index.js';
import { gothicBlock, arcade, battlements, pinnacle, turret, clockFace } from './gothic.js';

// 3x2 tiles (30 x 20 m). Front (street) faces +z.
// A quad of honey-stone ranges round a lawn: great hall at the back, two
// battlemented wings, an arched cloister walk inside and a gate/bell tower
// with a clock and belfry at the front.

const STONE = PALETTE.sandstone;
const TRIM = shade(STONE, 0.2);
const PLINTH = shade(STONE, -0.22);

function bike(color) {
  const tyre = mat(PALETTE.black);
  const frame = metal(color);
  const wheel = () => new THREE.Mesh(new THREE.TorusGeometry(0.32, 0.04, 4, 12), tyre);
  return group(
    place(wheel(), { x: -0.5, y: 0.36 }),
    place(wheel(), { x: 0.5, y: 0.36 }),
    beam([-0.5, 0.36, 0], [0.05, 0.75, 0], 0.05, frame),
    beam([0.5, 0.36, 0], [0.05, 0.75, 0], 0.05, frame),
    beam([-0.5, 0.36, 0], [0.1, 0.4, 0], 0.05, frame),
    place(box(0.25, 0.05, 0.1, PALETTE.black), { x: -0.05, y: 0.8 }),
    place(box(0.06, 0.05, 0.5, frame), { x: 0.45, y: 0.85 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const add = (obj, at) => g.add(place(group(obj), { ...at, y: y0 + (at.y ?? 0) }));
  const slate = surface('shingles', PALETTE.roofSlate, { size: 2 });
  const trim = mat(TRIM);
  const plinthM = mat(PLINTH);
  const lead = mat(PALETTE.roofSlate, { roughness: 0.6 });
  const gold = mat(PALETTE.glassGold, { metalness: 0.5, roughness: 0.35 });

  g.add(lot([3, 2], 'grass'));

  // ---------------------------------------------------------------- great hall (back, north)
  const hall = { z: -7.5, w: 27.2, d: 4.2 };
  const hallLow = 3.0, hallHigh = 6.0, hallTop = hallLow + hallHigh;
  const hallFront = hall.z + hall.d / 2; // -5.4
  add(box(hall.w + 0.3, 0.6, hall.d + 0.3, plinthM), { z: hall.z });
  add(gothicBlock({ w: hall.w, d: hall.d, h: hallLow, floorHeight: hallLow, bay: 3, wall: STONE }), { z: hall.z });
  add(box(hall.w + 0.3, 0.3, hall.d + 0.3, trim), { y: hallLow - 0.15, z: hall.z });
  add(gothicBlock({ w: hall.w, d: hall.d, h: hallHigh, floorHeight: hallHigh, bay: 3, wall: STONE, kind: 'hall', blank: ['left', 'right'] }), { y: hallLow, z: hall.z });
  add(box(hall.w + 0.4, 0.35, hall.d + 0.4, trim), { y: hallTop - 0.2, z: hall.z });
  add(gableRoof({ w: hall.w, d: hall.d, h: 4.4, overhang: 0.3, ridge: 'x', material: slate, gableMaterial: STONE }), { y: hallTop, z: hall.z });
  // buttresses along the back wall, between the bays
  for (let i = 0; i <= 9; i++) {
    const x = -13.5 + i * 3;
    const bz = hall.z - hall.d / 2;
    add(box(0.6, 5.6, 0.45, STONE), { x, z: bz - 0.2 });
    add(box(0.6, 2.6, 0.3, STONE), { x, y: 5.6, z: bz - 0.12 });
    add(cone(0.4, 0.7, trim, 4), { x, y: 5.6, z: bz - 0.25, ry: 45 });
  }
  // gable ends: big traceried end window, pinnacles at the corners and apex
  for (const sx of [-1, 1]) {
    const x = sx * (hall.w / 2 + 0.02);
    add(gothicBlock({ w: 0.08, d: 2.6, h: hallHigh - 0.5, floorHeight: hallHigh - 0.5, bay: 2.6, wall: STONE, kind: 'hall' }), { x, y: hallLow + 0.25, z: hall.z });
    for (const sz of [-1, 1]) add(pinnacle({ r: 0.3, h: 2.4, material: STONE, capMaterial: trim }), { x: sx * (hall.w / 2 - 0.1), y: hallTop, z: hall.z + sz * (hall.d / 2 - 0.1) });
    add(pinnacle({ r: 0.25, h: 1.8, material: STONE, capMaterial: trim }), { x: sx * (hall.w / 2 - 0.1), y: hallTop + 4.2, z: hall.z });
  }

  // ---------------------------------------------------------------- east & west wings
  const wingIn = 8.9, wingOut = 13.6;
  const wing = { w: wingOut - wingIn, x: (wingIn + wingOut) / 2, z0: hallFront, z1: 5.0, h: 6.0 };
  const wingD = wing.z1 - wing.z0, wingZ = (wing.z0 + wing.z1) / 2;
  for (const sx of [-1, 1]) {
    const x = sx * wing.x;
    add(box(wing.w + 0.3, 0.6, wingD + 0.15, plinthM), { x, z: wingZ + 0.07 });
    add(gothicBlock({ w: wing.w, d: wingD, h: wing.h, floorHeight: 3.0, bay: 2.4, wall: STONE }), { x, z: wingZ });
    add(box(wing.w + 0.3, 0.25, wingD + 0.15, trim), { x, y: 2.9, z: wingZ + 0.07 });
    add(battlements({ w: wing.w + 0.3, d: wingD + 0.15, h: 0.9, t: 0.3, merlon: 0.55, material: STONE }), { x, y: wing.h, z: wingZ + 0.07 });
    add(gableRoof({ w: wing.w - 0.6, d: wingD - 0.6, h: 2.2, overhang: 0, ridge: 'z', material: slate, gableMaterial: STONE }), { x, y: wing.h, z: wingZ });
    // tall chimney stacks on the outer side
    for (const cz of [-2.6, 2.4]) add(chimney({ w: 0.7, d: 1.4, h: 3.4, material: mat(STONE), capMaterial: trim }), { x: sx * (wingOut - 0.9), y: wing.h, z: cz });
    // corner pinnacles on the street end
    for (const ex of [-1, 1]) add(pinnacle({ r: 0.28, h: 2.2, material: STONE, capMaterial: trim }), { x: x + ex * (wing.w / 2 + 0.05), y: wing.h, z: wing.z1 });
    // street door with a pointed hood
    add(door({ w: 1.3, h: 2.4, color: PALETTE.woodDark, frame: TRIM }), { x, z: wing.z1 });
    add(cone(0.95, 0.8, trim, 4), { x, y: 2.5, z: wing.z1 + 0.1, ry: 45, s: [1, 1, 0.2] });
    add(box(1.6, 0.25, 1.0, plinthM), { x, z: wing.z1 + 0.5 });
  }

  // ---------------------------------------------------------------- bell tower (rises from the hall, faces the green)
  const T = 5.4, tz = hallFront + 0.0;
  const porchH = 5.5, st1 = 5.0, st2 = 3.6, belH = 4.6;
  add(box(T + 0.3, 0.6, T + 0.3, plinthM), { z: tz });
  for (const sx of [-1, 1]) add(box(0.8, porchH, T, STONE), { x: sx * (T / 2 - 0.4), z: tz });
  add(box(T, porchH, 0.6, STONE), { z: tz - T / 2 + 0.3 });
  add(arcade({ length: T, h: porchH, bays: 1, pier: 1.3, spring: 2.6, depth: 0.7, material: STONE }), { z: tz + T / 2 - 0.35 });
  add(box(T - 1.6, porchH, 0.2, PALETTE.woodDark), { z: tz - 0.5 }); // hall doors at the back of the porch
  add(box(T + 0.3, 0.35, T + 0.3, trim), { y: porchH - 0.1, z: tz });
  let ty = porchH + 0.25;
  add(gothicBlock({ w: T, d: T, h: st1, floorHeight: st1, bay: 2.7, wall: STONE, kind: 'hall' }), { y: ty, z: tz });
  ty += st1;
  add(box(T + 0.3, 0.3, T + 0.3, trim), { y: ty - 0.1, z: tz });
  // clock stage
  add(box(T, st2, T, STONE), { y: ty, z: tz });
  add(place(clockFace({ r: 1.25 }), { z: T / 2 + 0.06 }), { y: ty + st2 / 2, z: tz });
  add(place(clockFace({ r: 1.25 }), { z: -T / 2 - 0.06, ry: 180 }), { y: ty + st2 / 2, z: tz });
  add(place(clockFace({ r: 1.25 }), { x: T / 2 + 0.06, ry: 90 }), { y: ty + st2 / 2, z: tz });
  add(place(clockFace({ r: 1.25 }), { x: -T / 2 - 0.06, ry: -90 }), { y: ty + st2 / 2, z: tz });
  ty += st2;
  add(box(T + 0.35, 0.35, T + 0.35, trim), { y: ty - 0.1, z: tz });
  // belfry: paired louvred openings on all four faces, bell inside
  const B = T - 0.2;
  add(box(B, 0.2, B, PALETTE.woodDark), { y: ty, z: tz });
  for (const sz of [-1, 1]) add(place(arcade({ length: B, h: belH, bays: 2, pier: 0.55, spring: 2.0, depth: 0.4, material: STONE }), { z: sz * (B / 2 - 0.2) }), { y: ty, z: tz });
  for (const sx of [-1, 1]) add(place(arcade({ length: B - 0.8, h: belH, bays: 2, pier: 0.4, spring: 2.0, depth: 0.4, material: STONE }), { x: sx * (B / 2 - 0.2), ry: 90 }), { y: ty, z: tz });
  const louvre = mat(shade(PALETTE.woodDark, -0.2));
  for (let k = 0; k < 4; k++) add(box(B - 0.5, 0.08, B - 0.5, louvre), { y: ty + 0.3 + k * 0.4, z: tz });
  add(box(B - 0.8, 1.6, B - 0.8, mat('#1e1b19')), { y: ty + 0.2, z: tz });
  add(beam([-1.6, belH - 0.5, 0], [1.6, belH - 0.5, 0], 0.25, PALETTE.woodDark), { y: ty, z: tz });
  add(cone(0.9, 1.4, gold, 12), { y: ty + 2.2, z: tz });
  add(sphere(0.45, gold, 10), { y: ty + 3.1, z: tz });
  ty += belH;
  add(box(T + 0.4, 0.4, T + 0.4, trim), { y: ty, z: tz });
  ty += 0.4;
  add(battlements({ w: T + 0.4, d: T + 0.4, h: 1.1, t: 0.35, merlon: 0.55, material: STONE }), { y: ty, z: tz });
  add(box(T - 0.4, 0.2, T - 0.4, lead), { y: ty, z: tz });
  // octagonal corner turrets rising past the battlements
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    add(turret({ r: 0.55, h: ty + 1.4, wall: STONE, cap: lead }), { x: sx * (T / 2), z: tz + sz * (T / 2) });
  }
  for (const [px, pz] of [[0, T / 2], [0, -T / 2], [T / 2, 0], [-T / 2, 0]]) {
    add(pinnacle({ r: 0.22, h: 1.8, material: STONE, capMaterial: trim }), { x: px * 1.02, y: ty + 1.1, z: tz + pz * 1.02 });
  }
  add(flag({ h: 4.5, color: PALETTE.navy, color2: PALETTE.glassGold }), { y: ty + 0.2, z: tz });

  // ---------------------------------------------------------------- cloister walks round the green
  const arcH = 2.6, walk = 1.6;
  const innerX = wingIn - walk; // 7.3
  const innerZn = hallFront + walk; // -3.8
  const screenZ = 4.2, screenD = 1.6;
  const innerZs = screenZ - screenD / 2; // 3.4
  const sideLen = innerZs - innerZn;
  // north walk, either side of the tower
  for (const sx of [-1, 1]) {
    const x0 = T / 2, x1 = wingIn, len = x1 - x0, cx = sx * (x0 + x1) / 2;
    add(patch(len, walk, 'paved'), { x: cx, z: hallFront + walk / 2 });
    add(arcade({ length: innerX - x0 + 0.2, h: arcH, bays: 2, pier: 0.5, spring: 1.5, depth: 0.35, material: STONE }), { x: sx * (x0 + innerX + 0.2) / 2, z: innerZn });
    add(shedRoof({ w: len, d: walk, h: 0.8, overhang: 0.1, material: slate, wallMaterial: STONE }), { x: cx, y: arcH, z: hallFront + walk / 2 });
  }
  // east / west walks
  for (const sx of [-1, 1]) {
    add(patch(walk, sideLen + walk, 'paved'), { x: sx * (wingIn - walk / 2), z: (innerZs + hallFront) / 2 });
    add(arcade({ length: sideLen, h: arcH, bays: 3, pier: 0.5, spring: 1.5, depth: 0.35, material: STONE }), { x: sx * innerX, z: (innerZs + innerZn) / 2, ry: 90 });
    add(shedRoof({ w: sideLen, d: walk, h: 0.8, overhang: 0.1, material: slate, wallMaterial: STONE }), { x: sx * (wingIn - walk / 2), y: arcH, z: (innerZs + innerZn) / 2, ry: sx * 90 });
  }

  // ---------------------------------------------------------------- south screen: low open arcade with a gatehouse
  const gateW = 4.2, gateD = 2.6, gateH = 5.0;
  for (const sx of [-1, 1]) {
    const x0 = gateW / 2, x1 = wingIn, len = x1 - x0, cx = sx * (x0 + x1) / 2;
    add(patch(len, screenD, 'paved'), { x: cx, z: screenZ });
    for (const sz of [-1, 1]) add(arcade({ length: len, h: arcH, bays: 3, pier: 0.45, spring: 1.5, depth: 0.35, material: STONE }), { x: cx, z: screenZ + sz * (screenD / 2 - 0.18) });
    add(box(len, 0.2, screenD + 0.2, trim), { x: cx, y: arcH, z: screenZ });
    add(gableRoof({ w: len, d: screenD, h: 0.7, overhang: 0.15, ridge: 'x', material: slate, gableMaterial: STONE }), { x: cx, y: arcH + 0.2, z: screenZ });
  }
  add(patch(gateW, gateD, 'cobbles'), { z: screenZ });
  for (const sx of [-1, 1]) add(box(0.7, gateH, gateD, STONE), { x: sx * (gateW / 2 - 0.35), z: screenZ });
  for (const sz of [-1, 1]) add(arcade({ length: gateW, h: gateH, bays: 1, pier: 0.95, spring: 2.3, depth: 0.5, material: STONE }), { z: screenZ + sz * (gateD / 2 - 0.25) });
  add(box(gateW, 0.3, gateD, PALETTE.woodDark), { y: gateH - 0.6, z: screenZ });
  add(box(gateW + 0.3, 0.3, gateD + 0.3, trim), { y: gateH - 0.1, z: screenZ });
  add(battlements({ w: gateW + 0.3, d: gateD + 0.3, h: 0.9, t: 0.3, merlon: 0.5, material: STONE }), { y: gateH + 0.2, z: screenZ });
  add(box(gateW - 0.3, 0.15, gateD - 0.3, lead), { y: gateH + 0.2, z: screenZ });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) add(pinnacle({ r: 0.26, h: 2.2, material: STONE, capMaterial: trim }), { x: sx * (gateW / 2 + 0.05), y: gateH + 0.2, z: screenZ + sz * (gateD / 2 + 0.05) });
  for (const sx of [-1, 1]) add(box(0.12, 3.0, 1.0, PALETTE.woodDark), { x: sx * 1.3, z: screenZ + gateD / 2 - 1.0 });
  // college crest over the arch
  add(box(0.9, 1.0, 0.12, PALETTE.navy), { y: 3.75, z: screenZ + gateD / 2 + 0.05 });
  add(box(0.5, 0.5, 0.14, PALETTE.glassGold), { y: 3.98, z: screenZ + gateD / 2 + 0.05 });

  // ---------------------------------------------------------------- the green
  const gw = innerX * 2, gd = innerZs - innerZn, gz = (innerZs + innerZn) / 2;
  add(box(gw, 0.04, gd, surface('stripes', PALETTE.grassLight, { color2: PALETTE.grass, size: 2.4 })), { z: gz });
  add(patch(1.3, innerZs - (tz + T / 2), 'gravel'), { z: (innerZs + tz + T / 2) / 2 });
  add(patch(gw, 1.0, 'gravel'), { z: gz });
  add(cylinder(1.0, 1.0, 0.12, PALETTE.stone, 12), { y: 0.05, z: gz });
  // sundial in the middle of the cross paths
  add(cylinder(0.28, 0.35, 1.0, TRIM, 8), { y: 0.15, z: gz });
  add(cylinder(0.42, 0.42, 0.08, metal(PALETTE.rust), 10), { y: 1.15, z: gz });
  add(box(0.04, 0.3, 0.4, metal(PALETTE.rust)), { y: 1.23, z: gz });
  add(tree({ kind: 'round', h: 5.0, seed: 41 }), { x: -4.4, z: gz - 1.6 });
  add(tree({ kind: 'round', h: 4.2, seed: 43 }), { x: 4.6, z: gz + 1.6 });
  for (const [bx, bz] of [[-4.6, 2.4], [4.4, -2.6], [-1.8, -2.5], [1.9, 2.6]]) add(tree({ kind: 'bush', h: 0.8, seed: bx * 7 + bz }), { x: bx, z: bz });
  add(place(bench({ w: 1.4 }), { ry: 180 }), { x: 4.4, z: gz - 0.9 });
  add(bench({ w: 1.4 }), { x: -4.4, z: gz + 1.0 });

  // ---------------------------------------------------------------- front lawn & street side
  const gateFront = screenZ + gateD / 2;
  add(patch(3.0, 10 - gateFront, 'paved'), { z: (10 + gateFront) / 2 });
  add(patch(27, 1.2, 'paved'), { z: 9.35 });
  for (const sx of [-1, 1]) {
    add(place(streetLamp({ h: 4.2 }), { ry: sx > 0 ? 180 : 0 }), { x: sx * 3.4, z: 8.9 });
    add(tree({ kind: 'round', h: 5.5, seed: 30 + sx }), { x: sx * 13.2, z: 7.9 });
    add(tree({ kind: 'poplar', h: 5, seed: 50 + sx }), { x: sx * 14.4, z: -8.4 });
    add(tree({ kind: 'poplar', h: 5.5, seed: 52 + sx }), { x: sx * 14.4, z: -1.5 });
    add(tree({ kind: 'bush', h: 1.0, seed: 54 + sx }), { x: sx * 14.3, z: 3.6 });
    add(patch(1.6, 10 - wing.z1, 'paved'), { x: sx * wing.x, z: (10 + wing.z1) / 2 });
    add(tree({ kind: 'bush', h: 0.9, seed: 60 + sx }), { x: sx * 8.6, z: 6.0 });
  }
  add(hedge({ w: 4.6, h: 0.7, d: 0.6 }), { x: -6.6, z: 8.3 });
  // name stone
  add(box(4.4, 0.5, 0.7, PLINTH), { x: -6.0, z: 6.6 });
  add(sign({ text: 'TINY TOWN UNIVERSITY', w: 4.0, h: 0.75, bg: PALETTE.navy, fg: PALETTE.glassGold, depth: 0.25 }), { x: -6.0, y: 0.5, z: 6.6 });
  // founder's statue
  add(box(1.0, 1.2, 1.0, TRIM), { x: 7.0, z: 6.4 });
  add(cylinder(0.25, 0.32, 1.2, mat(PALETTE.roofGreen), 8), { x: 7.0, y: 1.2, z: 6.4 });
  add(sphere(0.2, mat(PALETTE.roofGreen), 8), { x: 7.0, y: 2.4, z: 6.4 });
  // bike rack
  add(box(3.2, 0.06, 0.06, metal(PALETTE.steelLight)), { x: 5.3, y: 0.6, z: 8.25 });
  const bikeColors = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.yellow];
  bikeColors.forEach((c, i) => add(place(bike(c), { ry: 90 }), { x: 4.1 + i * 0.8, z: 8.0 }));
  add(place(bench({ w: 1.6 }), { ry: 180 }), { x: -11.2, z: 8.2 });
  return g;
}

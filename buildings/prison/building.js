import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, prismBlock, shedRoof, box, cylinder, cone, sphere, place, mat, metal, emissive,
  door, fence, tree, car, streetLamp, bench, flag, smokestack, cropField,
} from '../../src/lib/index.js';
import {
  perimeterWall, wireTop, watchtower, cellBlock, bigSign, person, courtSurface, hoop, razorWire,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street, gatehouse) faces +z.
const WALL_H = 4.4;
const WALL_T = 0.5;
const IN = -9.3; // outer face of back/side walls
const FRONT = 6.2; // outer face of the front wall

function octagon(r, cx, cz) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (Math.PI / 4) * i + Math.PI / 8;
    pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return pts;
}

function cross(cx, cz, a, L) {
  return [
    [cx - a, cz - L], [cx + a, cz - L], [cx + a, cz - a], [cx + L, cz - a], [cx + L, cz + a], [cx + a, cz + a],
    [cx + a, cz + L], [cx - a, cz + L], [cx - a, cz + a], [cx - L, cz + a], [cx - L, cz - a], [cx - a, cz - a],
  ];
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // ---- street apron outside the wall
  g.add(place(patch(20, 10 - FRONT, 'asphalt'), { y: y0, z: (10 + FRONT) / 2 }));
  for (const x of [-7.4, -5.4, 5.4, 7.4]) g.add(place(box(0.1, 0.02, 2.4, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: 8.1 }));

  // ---- perimeter wall with razor wire
  const wallTop = y0 + WALL_H;
  const sideLen = FRONT - IN;
  const sideZ = (FRONT + IN) / 2;
  const frontLen = -IN - 3.5;
  g.add(place(perimeterWall(-2 * IN, WALL_H, WALL_T), { y: y0, z: IN + WALL_T / 2 }));
  g.add(place(perimeterWall(WALL_T, WALL_H, sideLen), { x: IN + WALL_T / 2, y: y0, z: sideZ }));
  g.add(place(perimeterWall(WALL_T, WALL_H, sideLen), { x: -IN - WALL_T / 2, y: y0, z: sideZ }));
  for (const sx of [-1, 1]) g.add(place(perimeterWall(frontLen, WALL_H, WALL_T), { x: sx * (3.5 + frontLen / 2), y: y0, z: FRONT - WALL_T / 2 }));
  g.add(place(wireTop(-2 * IN - 3), { y: wallTop, z: IN + WALL_T / 2, ry: 180 }));
  g.add(place(wireTop(sideLen - 3), { x: IN + WALL_T / 2, y: wallTop, z: sideZ, ry: -90 }));
  g.add(place(wireTop(sideLen - 3), { x: -IN - WALL_T / 2, y: wallTop, z: sideZ, ry: 90 }));
  for (const sx of [-1, 1]) g.add(place(wireTop(frontLen - 2), { x: sx * (3.5 + frontLen / 2 - 0.6), y: wallTop, z: FRONT - WALL_T / 2 }));

  // ---- corner watchtowers
  const tx = -IN - 0.45;
  g.add(place(watchtower({ light: 45 }), { x: -tx, y: y0, z: IN + 0.45 }));
  g.add(place(watchtower({ light: -45 }), { x: tx, y: y0, z: IN + 0.45 }));
  g.add(place(watchtower({ light: 135 }), { x: -tx, y: y0, z: FRONT - 0.45 }));
  g.add(place(watchtower({ light: -135 }), { x: tx, y: y0, z: FRONT - 0.45 }));

  // ---- cross-shaped cell block around a central control tower
  const hx = -3.2, hz = -3.4, arm = 1.8, L = 5.2;
  g.add(place(patch(2 * L + 1.2, 2 * L + 1.2, 'concrete'), { x: hx, y: y0, z: hz }));
  g.add(place(cellBlock(cross(hx, hz, arm, L), 3), { y: y0 }));
  const blockTop = y0 + 9;
  // glazed roof-lights along each arm + vents
  const skylight = mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 });
  for (const s of [-1, 1]) {
    g.add(place(box(L - 2.6, 0.35, 0.9, skylight), { x: hx + s * (L / 2 + 1.3), y: blockTop, z: hz }));
    g.add(place(box(0.9, 0.35, L - 2.6, skylight), { x: hx, y: blockTop, z: hz + s * (L / 2 + 1.3) }));
  }
  // dark coping band so the cross reads from above, plus roof vents at the arm ends
  g.add(place(prismBlock({ points: cross(hx, hz, arm + 0.12, L + 0.12), h: 0.35, floorHeight: 0.35, style: 'plain', wall: PALETTE.stoneDark, roof: PALETTE.concreteDark }), { y: blockTop - 0.2 }));
  const vent = mat(PALETTE.steel);
  for (const [dx, dz] of [[L - 0.8, 0], [-L + 0.8, 0], [0, L - 0.8], [0, -L + 0.8]]) {
    g.add(place(box(0.7, 0.6, 0.7, vent), { x: hx + dx, y: blockTop + 0.15, z: hz + dz }));
    g.add(place(box(0.85, 0.08, 0.85, mat(PALETTE.steelDark)), { x: hx + dx, y: blockTop + 0.75, z: hz + dz }));
  }
  // central control tower: octagon, a storey taller, with a glazed lantern
  g.add(place(cellBlock(octagon(2.5, 0, 0), 4, { wall: '#c9c1ae', roof: PALETTE.concrete }), { x: hx, y: y0, z: hz }));
  g.add(place(prismBlock({ points: octagon(2.7, 0, 0), h: 0.4, floorHeight: 0.4, style: 'plain', wall: PALETTE.stoneDark, roof: PALETTE.stoneDark }), { x: hx, y: y0 + 12, z: hz }));
  g.add(place(prismBlock({ points: octagon(1.4, 0, 0), h: 1.2, floorHeight: 1.2, style: 'curtain', glass: PALETTE.glassDark, frame: PALETTE.steelLight, roof: PALETTE.roofSlate }), { x: hx, y: y0 + 12.4, z: hz }));
  g.add(place(cone(1.7, 1.2, mat(PALETTE.roofSlate), 8), { x: hx, y: y0 + 13.6, z: hz, ry: 22.5 }));
  // block entrance at the front arm
  g.add(place(door({ w: 1.6, h: 2.4, color: PALETTE.steelDark }), { x: hx, y: y0, z: hz + L }));
  g.add(place(box(3, 0.2, 1.4, mat(PALETTE.concreteDark)), { x: hx, y: y0 + 2.8, z: hz + L + 0.7 }));
  g.add(place(bigSign({ text: 'CELL BLOCK A', w: 2.8, h: 0.5, bg: PALETTE.darkGrey, fg: PALETTE.yellow }), { x: hx, y: y0 + 3.1, z: hz + L + 0.02 }));

  // ---- inner drive from the gate
  g.add(place(patch(6.6, 4.2, 'asphalt'), { x: -1.8, y: y0, z: 3.3 }));
  g.add(place(box(0.25, 0.02, 2.6, mat(PALETTE.yellow)), { x: 1.2, y: y0 + 0.05, z: 3.3 }));

  // ---- gatehouse (straddles the front wall)
  const gz = 6.3, gd = 4.6;
  const stone = '#8f918f';
  g.add(place(facadeBlock({ w: 6.0, d: gd, floors: 2, floorHeight: 3.2, style: 'punched', wall: stone, frame: PALETTE.lightGrey, glass: PALETTE.window, windowW: 0.3, windowH: 0.45, bay: 1.6, lit: 0.15, seed: 7, roof: PALETTE.concreteDark, blank: ['front'] }), { y: y0, z: gz }));
  const gTop = y0 + 6.4;
  const merlon = mat('#7b7d7c');
  for (let i = 0; i < 6; i++) {
    const x = -2.5 + i;
    g.add(place(box(0.5, 0.6, 0.4, merlon), { x, y: gTop, z: gz + gd / 2 - 0.2 }));
    g.add(place(box(0.5, 0.6, 0.4, merlon), { x, y: gTop, z: gz - gd / 2 + 0.2 }));
  }
  // flanking turrets
  for (const sx of [-1, 1]) {
    const x = sx * 3.0;
    g.add(place(facadeBlock({ w: 2.0, d: 2.0, h: 8.0, floorHeight: 2.0, style: 'punched', wall: '#858785', frame: PALETTE.lightGrey, glass: PALETTE.window, windowW: 0.25, windowH: 0.5, bay: 2, seed: 3, roof: PALETTE.concreteDark }), { x, y: y0, z: gz + gd / 2 - 0.8 }));
    for (const [dx, dz] of [[-0.75, -0.75], [0.75, -0.75], [-0.75, 0.75], [0.75, 0.75], [0, 0.75], [0, -0.75], [-0.75, 0], [0.75, 0]]) {
      g.add(place(box(0.42, 0.55, 0.42, merlon), { x: x + dx, y: y0 + 8, z: gz + gd / 2 - 0.8 + dz }));
    }
  }
  // vehicle gate, arch band, pedestrian door, sign
  const gFront = gz + gd / 2;
  g.add(place(box(3.2, 3.8, 0.12, mat(PALETTE.darkGrey)), { y: y0, z: gFront + 0.02 }));
  g.add(place(box(2.8, 3.4, 0.16, metal('#4a5560')), { y: y0, z: gFront + 0.04 }));
  for (let i = 0; i < 7; i++) g.add(place(box(0.08, 3.4, 0.2, metal(PALETTE.steelDark)), { x: -1.2 + i * 0.4, y: y0, z: gFront + 0.05 }));
  g.add(place(box(2.8, 0.12, 0.22, metal(PALETTE.steelDark)), { y: y0 + 1.7, z: gFront + 0.05 }));
  g.add(place(bigSign({ text: 'STATE PRISON', w: 3.8, h: 0.8, bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.lightGrey }), { y: y0 + 4.3, z: gFront + 0.02 }));
  g.add(place(box(0.5, 0.15, 0.3, emissive('#fff2c0', 0.9)), { y: y0 + 3.95, z: gFront + 0.15 }));
  g.add(place(flag({ h: 4, color: PALETTE.blue, color2: PALETTE.blue }), { x: 1.6, y: gTop, z: gz }));
  // inner gate on the compound side
  g.add(place(box(2.8, 3.4, 0.16, metal('#4a5560')), { y: y0, z: gz - gd / 2 - 0.08 }));

  // ---- street side: barrier, guard booth, prison van, staff cars, lamps
  g.add(place(box(0.3, 1.0, 0.3, mat(PALETTE.white)), { x: -2.3, y: y0, z: 9.3 }));
  g.add(place(box(3.6, 0.12, 0.12, mat(PALETTE.red)), { x: -0.4, y: y0 + 0.9, z: 9.3 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.4, 0.13, 0.14, mat(PALETTE.white)), { x: -1.4 + i * 0.9, y: y0 + 0.9, z: 9.3 }));
  for (const x of [-2.6, 2.6]) for (const z of [9.0, 9.7]) g.add(place(cylinder(0.12, 0.12, 0.8, mat(PALETTE.yellow), 8), { x, y: y0, z }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: -6.4, y: y0 + 0.05, z: 8.1, s: 0.85 }));
  g.add(place(box(3.4, 0.25, 0.02, mat(PALETTE.navy)), { x: -6.5, y: y0 + 0.95, z: 8.1 + 0.78 }));
  g.add(place(box(3.4, 0.25, 0.02, mat(PALETTE.navy)), { x: -6.5, y: y0 + 0.95, z: 8.1 - 0.78 }));
  g.add(place(car({ color: PALETTE.grey }), { x: 6.4, y: y0 + 0.05, z: 8.1, s: 0.8, ry: 180 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -3.9, y: y0, z: 9.5 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 3.9, y: y0, z: 9.5, ry: 180 }));
  for (const x of [-9.3, 9.3]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: Math.round(x) + 30 }), { x, y: y0, z: 9.3 }));

  // ---- exercise yard: fenced basketball court with inmates
  const yx = 5.65, yz = 1.25, yw = 5.6, yd = 5.0;
  g.add(place(courtSurface(yw, yd), { x: yx, y: y0, z: yz }));
  g.add(place(fence({ w: yw, d: yd, h: 2.6, style: 'wire', color: PALETTE.steel, sides: ['front', 'back', 'left'] }), { x: yx, y: y0, z: yz }));
  g.add(place(razorWire(yw, { r: 0.16, spacing: 0.3 }), { x: yx, y: y0 + 2.6, z: yz - yd / 2 }));
  g.add(place(razorWire(yw, { r: 0.16, spacing: 0.3 }), { x: yx, y: y0 + 2.6, z: yz + yd / 2 }));
  g.add(place(razorWire(yd, { r: 0.16, spacing: 0.3 }), { x: yx - yw / 2, y: y0 + 2.6, z: yz, ry: 90 }));
  g.add(place(hoop(), { x: yx - yw / 2 + 0.25, y: y0, z: yz }));
  g.add(place(bench({ w: 1.6 }), { x: yx + 1.6, y: y0, z: yz - yd / 2 + 0.45 }));
  const orange = '#e8761c';
  for (const [x, z, ry, arms] of [[-1.2, 0.3, 90, true], [0.2, -0.8, -60, false], [0.5, 1.2, 200, false], [1.8, 1.6, 160, false], [2.2, 0.4, -30, false], [1.6, -1.9, 0, false]]) {
    g.add(place(person(orange, { arms }), { x: yx + x, y: y0 + 0.06, z: yz + z, ry, s: 0.85 }));
  }
  g.add(place(sphere(0.13, mat(PALETTE.orange), 8), { x: yx - 1.9, y: y0 + 2.2, z: yz + 0.1 }));
  // pull-up bars
  g.add(place(box(0.08, 2.2, 0.08, metal(PALETTE.steelDark)), { x: yx + 2.4, y: y0, z: yz + 1.9 }));
  g.add(place(box(0.08, 2.2, 0.08, metal(PALETTE.steelDark)), { x: yx + 2.4, y: y0, z: yz + 0.7 }));
  g.add(place(box(0.06, 0.06, 1.3, metal(PALETTE.steelLight)), { x: yx + 2.4, y: y0 + 2.15, z: yz + 1.3 }));

  // ---- workshop / kitchen with chimney (back right)
  const wx = 5.6, wz = -5.4;
  g.add(place(patch(6.2, 6.4, 'concrete'), { x: wx, y: y0, z: wz }));
  g.add(place(facadeBlock({ w: 5.0, d: 4.4, floors: 1, floorHeight: 3.6, style: 'industrial', wall: '#b9a98c', glass: PALETTE.window, frame: PALETTE.lightGrey, bay: 2.4, seed: 12 }), { x: wx, y: y0, z: wz }));
  g.add(place(shedRoof({ w: 5.0, d: 4.4, h: 1.0, overhang: 0.2, material: mat(PALETTE.roofGrey), wallMaterial: mat('#b9a98c') }), { x: wx, y: y0 + 3.6, z: wz }));
  g.add(place(smokestack({ radius: 0.42, topRadius: 0.32, h: 9.5, color: PALETTE.brickDark, bandColor: PALETTE.lightGrey, bands: 1 }), { x: wx + 1.7, y: y0, z: wz - 1.4 }));
  g.add(place(door({ w: 2.2, h: 2.6, color: PALETTE.steel }), { x: wx - 0.6, y: y0, z: wz + 2.2 }));
  g.add(place(box(1.0, 1.1, 0.8, mat(PALETTE.green)), { x: wx - 2.0, y: y0, z: wz + 2.8 }));
  g.add(place(box(1.0, 1.1, 0.8, mat(PALETTE.darkGrey)), { x: wx + 0.9, y: y0, z: wz + 2.8 }));

  // ---- prison garden and lawn (left side) + floodlight masts
  g.add(place(cropField({ w: 2.6, d: 3.6, crop: 'cabbage' }), { x: -7.1, y: y0, z: 3.4 }));
  g.add(place(person(orange), { x: -6.2, y: y0, z: 2.0, ry: 90, s: 0.85 }));
  g.add(place(person(PALETTE.navy), { x: -0.2, y: y0, z: 3.2, ry: 40, s: 0.85 }));
  g.add(place(person(PALETTE.navy), { x: 2.5, y: y0, z: -0.9, ry: -90, s: 0.85 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 17 }), { x: -7.6, y: y0, z: -0.3 }));
  for (const [x, z, ry] of [[-6.8, -8.0, 45], [8.0, -1.4, 180]]) {
    const m = metal(PALETTE.steelDark);
    g.add(place(cylinder(0.1, 0.14, 8, m, 6), { x, y: y0, z }));
    g.add(place(box(1.4, 0.12, 0.12, m), { x, y: y0 + 8, z, ry }));
    for (const s of [-0.45, 0.45]) {
      g.add(place(box(0.4, 0.35, 0.3, emissive('#fff6cc', 1.0)), { x: x + s * Math.cos((ry * Math.PI) / 180), y: y0 + 7.65, z: z - s * Math.sin((ry * Math.PI) / 180) }));
    }
  }

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, cone, place, mat, surface, extrude,
  door, fence, tree, car, streetLamp, lattice, rng, pipe,
} from '../../src/lib/index.js';
import { volcanicGround, plume, pipeline, wellhead, bigSign, lavaRock, PIPE } from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Back: turbine hall (left) + fan cooling tower (right).
// Middle: cyclone separators, transformer yard, service apron.
// Front: three wellheads on volcanic ground, insulated pipelines, brine lagoon.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], volcanicGround()));

  // ---------------------------------------------------------------- turbine hall
  const hx = -3.5, hz = -6, hw = 12, hd = 7, hh = 7;
  const wall = PALETTE.offWhite;
  g.add(place(facadeBlock({
    w: hw, d: hd, h: hh, floorHeight: 3.5, style: 'industrial', wall, glass: PALETTE.glassDark,
    frame: PALETTE.steelLight, bay: 2.4, lit: 0.15, seed: 31, roof: PALETTE.concreteDark,
  }), { x: hx, y: y0, z: hz }));
  // green base band
  g.add(place(box(hw + 0.08, 0.9, hd + 0.08, mat(PALETTE.roofGreen)), { x: hx, y: y0, z: hz }));
  const roofM = surface('corrugated', PALETTE.roofGreen, { size: 1.5 });
  g.add(place(gableRoof({ w: hw, d: hd, h: 2, overhang: 0.35, ridge: 'x', material: roofM, gableMaterial: wall }), { x: hx, y: y0 + hh, z: hz }));
  // ridge vents with a little steam
  for (const [i, x] of [-7.5, -3.5, 0.5].entries()) {
    g.add(place(box(1.2, 0.7, 1.0, mat(PALETTE.steelLight)), { x, y: y0 + hh + 1.8, z: hz }));
    g.add(place(box(1.4, 0.12, 1.2, mat(PALETTE.roofGreen)), { x, y: y0 + hh + 2.5, z: hz }));
  }
  // roller door + personnel door + big sign on the front
  const front = hz + hd / 2;
  g.add(place(box(3.4, 4.4, 0.12, surface('corrugated', PALETTE.steelLight, { size: 0.6 })), { x: -0.2, y: y0, z: front + 0.06 }));
  g.add(place(box(3.8, 0.25, 0.3, mat(PALETTE.roofGreen)), { x: -0.2, y: y0 + 4.4, z: front + 0.15 }));
  g.add(place(door({ w: 1, h: 2.2, color: PALETTE.roofGreen }), { x: -3.2, y: y0, z: front }));
  g.add(place(bigSign({ text: 'GEOTHERMAL', w: 7.2, h: 1.3, bg: '#2f6b55', fg: '#ffffff', border: '#e8e2c8' }), { x: -5.6, y: y0 + 4.9, z: front + 0.1 }));
  // turbine exhaust / steam inlet on the right gable
  g.add(place(box(0.5, 2.8, 2.4, mat(PALETTE.steelDark)), { x: hx + hw / 2 + 0.25, y: y0 + 2.6, z: -4.6 }));

  // ---------------------------------------------------------------- fan cooling tower
  const cx = 6.6, cz = -6.4, cw = 5.8, cd = 6.0, ch = 4.4;
  g.add(place(box(cw, 0.8, cd, mat(PALETTE.concrete)), { x: cx, y: y0, z: cz }));
  const louvre = surface('corrugated', '#5f7d78', { size: 0.8 });
  g.add(place(box(cw - 0.3, ch - 0.8, cd - 0.3, [louvre, louvre, mat(PALETTE.concreteDark), louvre, louvre, louvre]), { x: cx, y: y0 + 0.8, z: cz }));
  for (const x of [-cw / 2 + 0.15, 0, cw / 2 - 0.15]) {
    for (const z of [-cd / 2 + 0.15, cd / 2 - 0.15]) g.add(place(box(0.3, ch - 0.8, 0.3, mat(PALETTE.concrete)), { x: cx + x, y: y0 + 0.8, z: cz + z }));
  }
  g.add(place(box(cw, 0.25, cd, mat(PALETTE.concrete)), { x: cx, y: y0 + ch, z: cz }));
  for (const [i, z] of [-1.5, 1.5].entries()) {
    const fx = cx, fz = cz + z;
    g.add(place(cylinder(1.25, 1.35, 1.4, mat(PALETTE.steelLight), 16), { x: fx, y: y0 + ch + 0.25, z: fz }));
    g.add(place(cylinder(1.12, 1.12, 0.05, mat('#2a2c2e'), 16), { x: fx, y: y0 + ch + 1.62, z: fz }));
    g.add(place(plume({ h: 11 - i * 2.5, r0: 0.95, grow: 1.5, seed: 7 + i, drift: [-0.08, 0.1] }), { x: fx, y: y0 + ch + 1.4, z: fz }));
  }
  // hand rail around the fan deck
  g.add(place(fence({ w: cw - 0.2, d: cd - 0.2, h: 0.8, style: 'railing', color: PALETTE.yellow }), { x: cx, y: y0 + ch + 0.25, z: cz }));
  // cooling-water pipes tower <-> hall
  g.add(pipeline([[3.5, 1.4, -8.4], [2.5, 1.4, -8.4]], { radius: 0.28, supports: false }));
  g.add(pipeline([[3.5, 2.4, -7.6], [2.5, 2.4, -7.6]], { radius: 0.28, supports: false }));

  // ---------------------------------------------------------------- cyclone separators
  const sepZ = -1.3;
  const sepM = mat(PALETTE.aluminium, { metalness: 0.35, roughness: 0.35 });
  for (const sx of [5.0, 7.6]) {
    g.add(place(box(2.2, 0.25, 2.2, mat(PALETTE.concrete)), { x: sx, y: y0, z: sepZ }));
    for (const [lx, lz] of [[-0.55, -0.55], [0.55, -0.55], [-0.55, 0.55], [0.55, 0.55]]) {
      g.add(place(box(0.16, 1.4, 0.16, mat(PALETTE.steelDark)), { x: sx + lx, y: y0 + 0.25, z: sepZ + lz }));
    }
    g.add(place(cone(0.85, 0.9, sepM, 14), { x: sx, y: y0 + 2.5, z: sepZ, rx: 180 }));
    g.add(place(cylinder(0.85, 0.85, 3.4, sepM, 14), { x: sx, y: y0 + 2.5, z: sepZ }));
    g.add(place(cone(0.87, 0.5, sepM, 14), { x: sx, y: y0 + 5.9, z: sepZ }));
    g.add(place(cylinder(0.9, 0.9, 0.12, mat(PALETTE.steel), 14), { x: sx, y: y0 + 3.9, z: sepZ }));
  }
  // steam line from separator tops into the hall gable
  g.add(pipeline([[7.6, y0 + 6.3, sepZ], [5.0, y0 + 6.3, sepZ], [3.6, y0 + 6.3, sepZ], [3.6, y0 + 6.3, -3.3], [2.5, y0 + 6.3, -3.3]], { radius: 0.36, supports: false }));
  for (const sx of [5.0, 7.6]) g.add(pipe([sx, y0 + 6.1, sepZ], [sx, y0 + 6.4, sepZ], 0.3, PIPE));
  g.add(place(lattice({ w: 0.6, d: 0.6, h: 5.9, segments: 4, thickness: 0.1 }), { x: 3.6, y: y0, z: -2.2 }));
  // two-phase feed from the wellfield header into both separators
  g.add(pipeline([[6.3, 1.2, 2], [6.3, 1.2, sepZ], [6.3, 2.0, sepZ]], { radius: 0.3 }));
  g.add(pipeline([[5.0, 2.0, sepZ], [7.6, 2.0, sepZ]], { radius: 0.24, supports: false }));

  // ---------------------------------------------------------------- wellfield + pipelines
  const wells = [
    { x: -0.5, z: 7.6, outlet: '-z', seed: 3, steam: true },
    { x: 6.2, z: 7.8, outlet: '-z', seed: 4 },
    { x: 8.6, z: 4.6, outlet: '-z', seed: 5 },
  ];
  for (const w of wells) g.add(place(wellhead(w), { x: w.x, y: y0, z: w.z }));
  const py = y0 + 1.2;
  // header along z = 2 with a goalpost expansion loop over the service track
  g.add(pipeline([[-0.5, py, 6.3], [-0.5, py, 2], [0.6, py, 2], [0.6, y0 + 5.2, 2], [4.4, y0 + 5.2, 2], [4.4, py, 2], [8.6, py, 2]], { ground: y0 }));
  g.add(pipeline([[6.2, py, 6.5], [6.2, py, 2]], { ground: y0 }));
  g.add(pipeline([[8.6, py, 3.3], [8.6, py, 2]], { ground: y0, supports: false }));

  // ---------------------------------------------------------------- service track, apron, vehicles
  g.add(place(patch(2.6, 8.4, 'gravel'), { x: 2.5, y: y0, z: 5.8 }));
  g.add(place(patch(7.6, 3.4, 'asphalt'), { x: -0.1, y: y0, z: -0.8 }));
  g.add(place(car({ kind: 'van', color: PALETTE.white }), { x: -1.6, y: y0 + 0.05, z: -0.6, ry: 0, s: 0.62 }));
  g.add(place(car({ color: PALETTE.orange }), { x: 2.5, y: y0 + 0.05, z: 7.6, ry: 90, s: 0.6 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 3.6, y: y0, z: 0.8, ry: 180 }));

  // ---------------------------------------------------------------- transformer yard
  const tyX = -7.2, tyZ = -0.3;
  g.add(place(patch(4.6, 3.6, 'gravel'), { x: tyX, y: y0, z: tyZ }));
  g.add(place(fence({ w: 4.6, d: 3.6, h: 1.4, style: 'wire' }), { x: tyX, y: y0, z: tyZ }));
  g.add(place(box(2.2, 0.3, 1.6, mat(PALETTE.concrete)), { x: tyX - 0.6, y: y0, z: tyZ }));
  g.add(place(box(1.8, 1.6, 1.2, mat('#6d7a6a')), { x: tyX - 0.6, y: y0 + 0.3, z: tyZ }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.08, 1.3, 1.5, mat('#56614f')), { x: tyX - 1.45 + i * 0.4, y: y0 + 0.4, z: tyZ }));
  for (const bx of [-0.5, 0, 0.5]) {
    g.add(place(cylinder(0.09, 0.12, 0.9, mat('#8b5a3c'), 6), { x: tyX - 0.6 + bx, y: y0 + 1.9, z: tyZ }));
  }
  g.add(place(lattice({ w: 0.6, d: 0.6, h: 5, topW: 0.4, topD: 0.4, segments: 4, thickness: 0.08 }), { x: tyX + 1.4, y: y0, z: tyZ }));
  g.add(place(box(0.1, 0.1, 2.4, mat(PALETTE.steelDark)), { x: tyX + 1.4, y: y0 + 4.6, z: tyZ }));
  // busbar from the hall to the transformer
  g.add(pipe([-8.6, y0 + 3.5, -2.5], [tyX - 0.6, y0 + 2.6, tyZ], 0.12, mat(PALETTE.steelDark)));

  // ---------------------------------------------------------------- brine lagoon
  const lagoon = [[-9.5, 3.4], [-8.4, 2.6], [-6.6, 2.8], [-5.2, 2.4], [-4.0, 3.3], [-3.6, 4.6], [-2.8, 5.6], [-3.3, 7.2], [-4.4, 8.0], [-4.8, 9.3], [-6.4, 9.6], [-7.6, 8.9], [-9.0, 9.5], [-9.6, 7.6], [-9.0, 5.8]];
  const inset = lagoon.map(([x, z]) => [-6.4 + (x + 6.4) * 0.88, 6.1 + (z - 6.1) * 0.88]);
  g.add(place(extrude(lagoon, 0.1, mat('#e9e6da')), { y: y0 }));
  g.add(place(extrude(inset, 0.13, mat('#86d4dc', { roughness: 0.35 })), { y: y0 }));
  // little boardwalk jetty
  g.add(place(box(0.9, 0.2, 2.2, mat(PALETTE.wood)), { x: -3.6, y: y0, z: 6.0, ry: -70 }));
  // brine outfall from the separators along the apron/left side to the lagoon
  g.add(pipeline([[5.0, y0 + 0.6, -0.2], [5.0, y0 + 0.6, 1.0], [-3.8, y0 + 0.6, 1.0], [-3.8, y0 + 0.6, 3.4]], { radius: 0.2, ground: y0 }));

  // ---------------------------------------------------------------- volcanic ground details
  // fumaroles with sulphur crust
  for (const [x, z, s] of [[-1.6, 4.4, 71], [8.8, 9.0, 72], [4.6, 4.4, 73]].slice(0, 2)) {
    g.add(place(extrude([[-0.7, -0.3], [0, -0.6], [0.8, -0.2], [0.6, 0.5], [-0.3, 0.6]], 0.04, mat('#d9c14a')), { x, y: y0, z }));
    g.add(place(cone(0.35, 0.35, mat('#8a7a3a'), 7), { x, y: y0, z }));
    g.add(place(plume({ h: 2.4, r0: 0.18, grow: 0.5, seed: s, drift: [0.1, 0] }), { x, y: y0 + 0.3, z }));
  }
  // lava rocks + moss tufts, kept off the plant
  const r = rng(404);
  const busy = [
    [-10, 3, -10, 1.6], [-10, 10, -2.6, 2], [-3.9, 4, -2.6, 1.6], [3.4, 10, -2.6, 0.2], [1.1, 3.9, 1.6, 10],
    [-1.9, 0.9, 6.2, 9], [4.8, 7.6, 6.4, 9.2], [7.2, 10, 3.2, 6], [-10, -2.6, 2.3, 10], [-1, 9.5, 1.4, 2.6],
    [-1, 0, 1.6, 6.4], [5.8, 6.7, 1.6, 6.6], [6, 7, -1.4, 1.6],
  ];
  const free = (x, z, m) => !busy.some(([a, b, c, d]) => x > a - m && x < b + m && z > c - m && z < d + m);
  let placed = 0;
  for (let tries = 0; tries < 400 && placed < 26; tries++) {
    const x = r.range(-9.6, 9.6), z = r.range(-9.6, 9.6);
    if (!free(x, z, 0.3)) continue;
    placed++;
    if (r.chance(0.4)) g.add(place(tree({ kind: 'bush', h: r.range(0.5, 0.9), seed: 500 + placed, color: r.pick(['#7f9a4c', '#93a85a', '#6d8a40']) }), { x, y: y0, z }));
    else g.add(place(lavaRock(r.range(0.25, 0.6), 600 + placed), { x, y: y0, z }));
  }
  // perimeter marker posts at the street edge
  for (const x of [-2.2, 0.8, 4.2, 9.4]) g.add(place(box(0.14, 0.9, 0.14, mat(PALETTE.yellow)), { x, y: y0, z: 9.6 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, sawtoothRoof, box, cylinder, place, group, pipeRun, glass, mat, metal,
  surface, emissive, tree, streetLamp, door,
} from '../../src/lib/index.js';
import {
  BRAND_RED, BRAND_DARK, COLA, giantBottle, bigSign, lorry, crateStack, forklift, smallBottle, uvBox,
} from './brand.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
//   west:   giant contour-bottle tank tower on a plinth, crate yard, street sign
//   middle: glass-walled bottling hall (filler carousel, conveyors, bottles)
//   back:   sawtooth-roofed plant hall with a big FIZZ POP rooftop sign
//   east:   loading dock with two branded delivery lorries
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'concrete'));

  const white = mat(PALETTE.white);
  const red = mat(BRAND_RED, { roughness: 0.6 });
  const redDark = mat(BRAND_DARK);
  const steel = metal(PALETTE.steelLight);
  const steelDark = metal(PALETTE.steelDark);

  // ---- main plant hall (back strip) -------------------------------------
  const hx = 2.75, hz = -3, hw = 14.5, hd = 4, hh = 7;
  g.add(place(facadeBlock({ w: hw, d: hd, h: hh, floorHeight: 3.5, style: 'industrial', wall: PALETTE.white, glass: PALETTE.glassSky, bay: 2.4, seed: 4, roof: PALETTE.concrete }), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.1, 0.55, hd + 0.1, red), { x: hx, y: y0 + hh - 0.55, z: hz }));
  g.add(place(box(hw + 0.1, 0.25, hd + 0.1, redDark), { x: hx, y: y0, z: hz }));
  g.add(place(sawtoothRoof({ w: hw, d: hd, h: 1.4, teeth: 2, material: surface('corrugated', PALETTE.roofGrey, { size: 2 }) }), { x: hx, y: y0 + hh, z: hz }));
  // rooftop sign on a steel frame
  const sw = 9.5, sh = 2.4, sy = y0 + hh + 0.5;
  for (const dx of [-3.5, 0, 3.5]) g.add(place(box(0.18, 0.6 + sh * 0.8, 0.18, steelDark), { x: hx + dx, y: y0 + hh, z: -1.55 }));
  g.add(place(bigSign({ w: sw, h: sh, sub: 'SODA BOTTLING CO.', depth: 0.25, double: true }), { x: hx, y: sy, z: -1.35 }));
  // painted logos on the back wall and the east end
  g.add(place(bigSign({ w: 6.5, h: 1.8, sub: 'SODA BOTTLING CO.', depth: 0.06 }), { x: hx + 1.5, y: y0 + 3.2, z: hz - hd / 2 - 0.03, ry: 180 }));
  g.add(place(bigSign({ w: 3.2, h: 1.0, depth: 0.06 }), { x: hx + hw / 2 + 0.03, y: y0 + 5.0, z: hz, ry: 90 }));
  // vent stacks
  for (const [vx, vz] of [[8.6, -4.2], [-3.3, -4.3]]) {
    g.add(place(cylinder(0.35, 0.35, 2.2, steel, 10), { x: vx, y: y0 + hh, z: vz }));
    g.add(place(cylinder(0.5, 0.5, 0.25, steelDark, 10), { x: vx, y: y0 + hh + 2.2, z: vz }));
  }

  // ---- loading dock + lorries (east) ------------------------------------
  g.add(place(patch(6.5, 5.3, 'asphalt'), { x: 6.75, y: y0, z: 2.35 }));
  const lineM = mat(PALETTE.roadLine);
  for (const lx of [3.7, 6.8, 9.85]) g.add(place(box(0.12, 0.02, 4.6, lineM), { x: lx, y: y0 + 0.05, z: 2.6 }));
  g.add(place(box(6.5, 1.0, 0.75, mat(PALETTE.concreteDark)), { x: 6.75, y: y0, z: -0.62 }));
  g.add(place(box(6.5, 0.2, 0.08, surface('hazard', PALETTE.yellow, { size: 0.8 })), { x: 6.75, y: y0 + 0.8, z: -0.22 }));
  // canopy over the dock
  g.add(place(box(6.6, 0.25, 2.0, red), { x: 6.75, y: y0 + 4.3, z: -0.05 }));
  for (const px of [3.7, 9.8]) g.add(place(box(0.15, 4.3, 0.15, steelDark), { x: px, y: y0, z: 0.85 }));
  for (const lx of [5.2, 8.4]) {
    // roller shutter + rubber dock seal
    g.add(place(box(2.6, 3.0, 0.08, surface('corrugated', PALETTE.steelLight, { size: 0.6 })), { x: lx, y: y0 + 1.0, z: -0.98 }));
    g.add(place(box(2.9, 0.25, 0.3, mat(PALETTE.black)), { x: lx, y: y0 + 4.0, z: -0.85 }));
    for (const s of [-1, 1]) g.add(place(box(0.2, 3.1, 0.3, mat(PALETTE.black)), { x: lx + s * 1.4, y: y0 + 1.0, z: -0.85 }));
    g.add(place(lorry({ len: 5.2 }), { x: lx, y: y0 + 0.05, z: 2.33 }));
  }

  // ---- glass bottling hall (middle front) -------------------------------
  const gx = -0.5, gz = 0.9, gw = 8, gd = 3.8, gh = 3.8;
  const x0 = gx - gw / 2, x1 = gx + gw / 2, z0 = gz - gd / 2, z1 = gz + gd / 2;
  g.add(place(box(gw, 0.08, gd, mat('#6f9e7a')), { x: gx, y: y0, z: gz })); // green epoxy floor
  const pane = glass(PALETTE.glassSky, { opacity: 0.28 });
  g.add(place(box(gw, 0.5, 0.15, red), { x: gx, y: y0, z: z1 }));
  g.add(place(box(0.15, 0.5, gd, red), { x: x0, y: y0, z: gz }));
  g.add(place(box(0.15, 0.5, gd, red), { x: x1, y: y0, z: gz }));
  g.add(place(box(gw, gh - 0.5, 0.06, pane), { x: gx, y: y0 + 0.5, z: z1 }));
  g.add(place(box(0.06, gh - 0.5, gd, pane), { x: x0, y: y0 + 0.5, z: gz }));
  g.add(place(box(0.06, gh - 0.5, gd, pane), { x: x1, y: y0 + 0.5, z: gz }));
  g.add(place(box(gw, 0.06, gd, glass(PALETTE.glassSky, { opacity: 0.2 })), { x: gx, y: y0 + gh, z: gz }));
  // frame: posts, eaves beam, roof glazing bars
  for (let i = 0; i <= 6; i++) {
    const px = x0 + (i * gw) / 6;
    g.add(place(box(0.14, gh, 0.14, steel), { x: px, y: y0, z: z1 }));
    g.add(place(box(0.1, 0.1, gd, steel), { x: px, y: y0 + gh, z: gz }));
  }
  for (const pz of [z0 + gd / 3, z0 + (2 * gd) / 3]) {
    g.add(place(box(0.14, gh, 0.14, steel), { x: x0, y: y0, z: pz }));
    g.add(place(box(0.14, gh, 0.14, steel), { x: x1, y: y0, z: pz }));
  }
  g.add(place(box(gw + 0.2, 0.35, 0.2, steel), { x: gx, y: y0 + gh - 0.2, z: z1 }));
  g.add(place(box(0.2, 0.35, gd, steel), { x: x0, y: y0 + gh - 0.2, z: gz }));
  g.add(place(box(0.2, 0.35, gd, steel), { x: x1, y: y0 + gh - 0.2, z: gz }));
  // fascia sign over the glass front
  g.add(place(bigSign({ w: 5.2, h: 0.75, depth: 0.15 }), { x: gx, y: y0 + gh + 0.05, z: z1 + 0.05 }));
  // entrance door
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.steelDark }), { x: x1 - 0.8, y: y0, z: z1 + 0.04 }));

  // line inside: filler carousel -> back conveyor -> U-turn -> front conveyor -> case packer
  const belt = mat(PALETTE.darkGrey);
  const beltY = y0 + 0.9;
  const conveyor = (cx, cz, len, alongX) => {
    const c = new THREE.Group();
    const [w, d] = alongX ? [len, 0.45] : [0.45, len];
    c.add(place(box(w, 0.14, d, belt), { y: 0.76 }));
    c.add(place(box(alongX ? w : 0.05, 0.12, alongX ? 0.05 : d, steel), { x: alongX ? 0 : 0.24, y: 0.86, z: alongX ? 0.24 : 0 }));
    c.add(place(box(alongX ? w : 0.05, 0.12, alongX ? 0.05 : d, steel), { x: alongX ? 0 : -0.24, y: 0.86, z: alongX ? -0.24 : 0 }));
    const n = Math.max(2, Math.round(len / 1.4));
    for (let i = 0; i < n; i++) {
      const t = -len / 2 + 0.2 + (i * (len - 0.4)) / (n - 1);
      c.add(place(box(0.08, 0.76, 0.36, steelDark), alongX ? { x: t } : { z: t, ry: 90 }));
    }
    return place(c, { x: cx, y: y0, z: cz });
  };
  const backZ = z0 + 0.65, frontZ = z1 - 0.8;
  g.add(conveyor(-0.1, backZ, 6.6, true));
  g.add(conveyor(3.0, (backZ + frontZ) / 2, frontZ - backZ + 0.45, false));
  g.add(conveyor(0.3, frontZ, 5.8, true));
  // filler carousel
  const fx = x0 + 0.95, fz = backZ;
  g.add(place(cylinder(0.75, 0.75, 1.0, steel, 14), { x: fx, y: y0, z: fz }));
  g.add(place(cylinder(0.85, 0.85, 0.12, steelDark, 14), { x: fx, y: y0 + 1.0, z: fz }));
  g.add(place(cylinder(0.25, 0.25, 1.3, steel, 8), { x: fx, y: y0 + 1.1, z: fz }));
  g.add(place(cylinder(0.65, 0.65, 0.5, red, 14), { x: fx, y: y0 + 2.2, z: fz }));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(place(smallBottle(COLA), { x: fx + Math.cos(a) * 0.6, y: y0 + 1.12, z: fz + Math.sin(a) * 0.6 }));
  }
  // case packer at the end of the front run
  g.add(place(box(1.3, 1.7, 1.1, white), { x: x0 + 1.0, y: y0, z: frontZ }));
  g.add(place(box(1.32, 0.3, 1.12, red), { x: x0 + 1.0, y: y0 + 1.4, z: frontZ }));
  g.add(place(box(0.6, 0.5, 0.05, mat(PALETTE.glassDark)), { x: x0 + 1.0, y: y0 + 0.7, z: frontZ + 0.56 }));
  g.add(place(crateStack({ nx: 2, nz: 2, ny: 2 }), { x: x0 + 2.3, y: y0, z: frontZ + 0.15 }));
  // bottles on the belts
  const flavours = ['#e07a1a', '#3f9a2e', COLA];
  for (let x = fx + 0.95, i = 0; x < 3.0; x += 0.34, i++) g.add(place(smallBottle(COLA), { x, y: y0 + 0.9, z: backZ }));
  for (let x = x0 + 1.95, i = 0; x < 2.9; x += 0.34, i++) g.add(place(smallBottle(flavours[i % 3]), { x, y: y0 + 0.9, z: frontZ }));
  for (let z = backZ + 0.4; z < frontZ - 0.3; z += 0.34) g.add(place(smallBottle(COLA), { x: 3.0, y: y0 + 0.9, z }));
  // syrup line from the tower into the filler, pipes into the hall
  g.add(pipeRun([[-5.2, y0 + 3.0, backZ], [x0 + 0.3, y0 + 3.0, backZ], [fx, y0 + 3.0, fz], [fx, y0 + 2.7, fz]], 0.12, steel));
  g.add(pipeRun([[-5.3, y0 + 5.2, -2.2], [-4.5, y0 + 5.2, -2.2]], 0.2, steel));
  g.add(pipeRun([[-5.3, y0 + 1.6, -2.8], [-4.5, y0 + 1.6, -2.8]], 0.2, mat(BRAND_RED)));

  // ---- giant bottle tank tower (west) -----------------------------------
  const bx = -7.3, bz = -1.7;
  const plinthH = 0.9;
  g.add(place(cylinder(2.7, 2.9, plinthH, mat(PALETTE.concreteDark), 8), { x: bx, y: y0, z: bz, ry: 22.5 }));
  g.add(place(cylinder(2.5, 2.5, 0.08, surface('hazard', PALETTE.yellow, { size: 0.8 }), 8), { x: bx, y: y0 + plinthH, z: bz, ry: 22.5 }));
  const bottle = giantBottle({ scale: 1.0 });
  g.add(place(bottle, { x: bx, y: y0 + plinthH, z: bz }));
  // service platform round the waist + ladder on the west side
  const platY = y0 + plinthH + 5.4;
  const ring = new THREE.Mesh(new THREE.RingGeometry(1.55, 2.45, 20).rotateX(-Math.PI / 2), mat(PALETTE.steelDark, { side: THREE.DoubleSide }));
  g.add(place(ring, { x: bx, y: platY, z: bz }));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(2.45, 2.45, 0.5, 20, 1, true), mat(PALETTE.yellow, { side: THREE.DoubleSide })), { x: bx, y: platY + 0.65, z: bz }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.add(place(box(0.08, 1.0, 0.08, mat(PALETTE.yellow)), { x: bx + Math.cos(a) * 2.42, y: platY, z: bz + Math.sin(a) * 2.42 }));
  }
  const lx = bx - 2.2;
  for (const dz of [-0.3, 0.3]) g.add(place(box(0.07, platY - y0 - plinthH + 1, 0.07, steel), { x: lx, y: y0 + plinthH, z: bz + dz }));
  for (let y = y0 + plinthH + 0.4; y < platY + 0.9; y += 0.4) g.add(place(box(0.05, 0.05, 0.6, steel), { x: lx, y, z: bz }));

  // ---- crate yard + street front (west / front) --------------------------
  g.add(place(crateStack({ nx: 2, nz: 2, ny: 4 }), { x: -9.0, y: y0, z: 1.8 }));
  g.add(place(crateStack({ nx: 2, nz: 2, ny: 3 }), { x: -7.75, y: y0, z: 1.8 }));
  g.add(place(crateStack({ nx: 2, nz: 2, ny: 4 }), { x: -9.0, y: y0, z: 3.0 }));
  g.add(place(crateStack({ nx: 2, nz: 2, ny: 2 }), { x: -5.4, y: y0, z: 1.6, ry: 90 }));
  const fl = group(forklift(), place(crateStack({ nx: 2, nz: 2, ny: 2 }), { y: 0.2, z: 1.3 }));
  g.add(place(fl, { x: -6.0, y: y0, z: 3.1, ry: -90 }));
  // street sign on two posts
  for (const dx of [-1.5, 1.5]) g.add(place(box(0.15, 1.6, 0.15, steelDark), { x: -7.3 + dx, y: y0, z: 4.55 }));
  g.add(place(bigSign({ w: 3.8, h: 1.1, sub: 'BOTTLING PLANT', double: true }), { x: -7.3, y: y0 + 1.5, z: 4.55 }));

  // walkway in front of the glass hall: planters, vending machines, lamp
  g.add(place(patch(8.2, 1.9, 'paved'), { x: gx, y: y0, z: 3.85 }));
  for (const px of [-3.6, -1.4]) {
    g.add(place(box(1.6, 0.45, 0.7, mat(PALETTE.stoneDark)), { x: px, y: y0, z: 4.4 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: px * 7 }), { x: px - 0.35, y: y0 + 0.45, z: 4.4 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: px * 7 + 1 }), { x: px + 0.4, y: y0 + 0.45, z: 4.4 }));
  }
  const vendFace = mat(BRAND_RED, { emissive: BRAND_RED, emissiveIntensity: 0.25 });
  for (const [vx, vc] of [[0.6, vendFace], [1.5, mat('#2f7a2a', { emissive: '#2f7a2a', emissiveIntensity: 0.2 })]]) {
    g.add(place(uvBox(0.8, 1.9, 0.7, [vc, vc, white, vc, vc, vc]), { x: vx, y: y0, z: z1 + 0.5 }));
    g.add(place(box(0.55, 1.0, 0.04, emissive('#ffe7a0', 0.5)), { x: vx - 0.08, y: y0 + 0.75, z: z1 + 0.86 }));
  }
  g.add(place(streetLamp({ h: 4.2 }), { x: 2.9, y: y0, z: 4.5, ry: 180 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: -4.6, y: y0, z: 3.8 }));

  return g;
}

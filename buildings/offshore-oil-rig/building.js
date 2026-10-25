import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, cylinder, cone, sphere, place, beam, pipe, pipeRun, lattice, taperedBlock, facadeBlock,
  fence, stairs, container, tank, mat, metal, emissive, surface,
} from '../../src/lib/index.js';
import { bigSign, helideck, boom, crane, lifeboat, supplyBoat, helicopter } from './parts.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// 2x2 tiles (20 x 20 m) of open sea. Front faces +z: the supply boat is moored on that side.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT; // water surface
  g.add(lot([2, 2], 'water'));

  const yellow = mat(PALETTE.yellow);
  const steelDark = metal(PALETTE.steelDark);
  const deckTop = surface('concrete', '#8e979d', { size: 3 });
  const deckSide = mat(PALETTE.steelDark);

  // platform: two decks over a 4-legged jacket
  const DX = 0, DZ = -2.5, DW = 13, DD = 11; // deck centre and size
  const Y1 = 8.0;  // lower (cellar) deck top
  const Y2 = 12.4; // main deck top
  const T = 0.6;   // deck thickness

  // jacket legs, splayed at the waterline
  const legTop = [[-5.3, -7.0], [5.3, -7.0], [5.3, 2.0], [-5.3, 2.0]];
  const legBot = [[-6.7, -8.4], [6.7, -8.4], [6.7, 3.4], [-6.7, 3.4]];
  const legAt = (i, y) => {
    const t = (y - y0) / (Y1 - T - y0);
    const [bx, bz] = legBot[i], [tx, tz] = legTop[i];
    return V(bx + (tx - bx) * t, y, bz + (tz - bz) * t);
  };
  for (let i = 0; i < 4; i++) {
    g.add(pipe(legAt(i, y0), legAt(i, Y1 - T), 0.6, yellow));
    // splash zone and foam ring at the waterline
    g.add(place(cylinder(0.72, 0.78, 1.3, mat('#3f5a48'), 14), { x: legBot[i][0], y: y0, z: legBot[i][1] }));
    g.add(place(cylinder(1.5, 1.5, 0.04, mat('#e6f4f8', { transparent: true, opacity: 0.75 }), 16), { x: legBot[i][0], y: y0, z: legBot[i][1] }));
    // columns between the decks
    g.add(place(box(0.9, Y2 - T - Y1, 0.9, yellow), { x: legTop[i][0], y: Y1, z: legTop[i][1] }));
  }
  // jacket bracing: horizontal rings + X braces on every face
  const levels = [1.6, 4.4, Y1 - T];
  for (let s = 0; s < 4; s++) {
    const n = (s + 1) % 4;
    for (const y of levels.slice(0, 2)) g.add(beam(legAt(s, y), legAt(n, y), 0.3, yellow));
    for (let l = 0; l < levels.length - 1; l++) {
      g.add(beam(legAt(s, levels[l]), legAt(n, levels[l + 1]), 0.22, yellow));
      g.add(beam(legAt(n, levels[l]), legAt(s, levels[l + 1]), 0.22, yellow));
    }
  }
  // risers and conductors up the front-left leg
  for (let i = 0; i < 3; i++) {
    const off = -0.9 - i * 0.45;
    g.add(pipe(V(-6.6 + 0.0, y0, 3.4 + off * 0.2 - 1.4), V(-5.2, Y1 - T, 2.0 + off * 0.2 - 1.4), 0.18, metal(PALETTE.steel)));
  }
  // boat landing on the front-right leg
  g.add(place(box(2.2, 0.25, 1.4, yellow), { x: 6.2, y: 1.7, z: 4.4 }));
  g.add(place(fence({ w: 2.2, d: 1.4, h: 0.9, style: 'railing', color: PALETTE.yellow, sides: ['left', 'right', 'back'] }), { x: 6.2, y: 1.95, z: 4.4 }));
  for (const x of [5.4, 7.0]) g.add(place(box(0.45, 1.2, 0.3, mat(PALETTE.black)), { x, y: 0.4, z: 5.1 }));
  g.add(beam(V(5.6, 1.95, 3.9), V(5.6, Y1, 2.6), 0.12, yellow));
  g.add(beam(V(6.8, 1.95, 3.9), V(6.8, Y1, 2.6), 0.12, yellow));
  for (let i = 1; i < 10; i++) {
    const t = i / 10;
    g.add(place(box(1.3, 0.06, 0.25, yellow), { x: 6.2, y: 1.95 + (Y1 - 1.95) * t, z: 3.9 - 1.3 * t }));
  }

  // deck slabs
  const deck = () => box(DW, T, DD, [deckSide, deckSide, deckTop, deckSide, deckSide, deckSide]);
  g.add(place(deck(), { x: DX, y: Y1 - T, z: DZ }));
  g.add(place(deck(), { x: DX, y: Y2 - T, z: DZ }));
  for (const y of [Y1 - 0.15, Y2 - 0.15]) {
    g.add(place(box(DW + 0.05, 0.15, 0.1, yellow), { x: DX, y, z: DZ + DD / 2 }));
    g.add(place(box(DW + 0.05, 0.15, 0.1, yellow), { x: DX, y, z: DZ - DD / 2 }));
    g.add(place(box(0.1, 0.15, DD + 0.05, yellow), { x: DX + DW / 2, y, z: DZ }));
    g.add(place(box(0.1, 0.15, DD + 0.05, yellow), { x: DX - DW / 2, y, z: DZ }));
  }
  // underside girders of the decks
  for (const y of [Y1 - T - 0.5, Y2 - T - 0.5]) {
    for (const z of [-7.0, 2.0]) g.add(place(box(DW - 0.4, 0.5, 0.4, yellow), { x: DX, y, z }));
    for (const x of [-5.3, 5.3]) g.add(place(box(0.4, 0.5, DD - 0.4, yellow), { x, y, z: DZ }));
  }

  // ---- cellar deck: process plant
  g.add(place(facadeBlock({ w: 5.2, d: 4.2, h: 3.2, floorHeight: 3.2, style: 'industrial', wall: PALETTE.steelLight, glass: PALETTE.glassDark, frame: PALETTE.steelDark, bay: 2.6, roof: PALETTE.steel, seed: 4 }), { x: 3.0, y: Y1, z: -5.4 }));
  g.add(place(box(1.4, 2.2, 0.1, mat(PALETTE.blue)), { x: 2.4, y: Y1, z: -3.28 }));
  // horizontal separators on saddles
  for (const [z, col] of [[-0.4, PALETTE.green], [1.4, PALETTE.white]]) {
    g.add(pipe(V(-4.7, Y1 + 1.15, z), V(-0.1, Y1 + 1.15, z), 0.75, mat(col)));
    for (const x of [-4.0, -0.8]) g.add(place(box(0.3, 0.5, 1.2, steelDark), { x, y: Y1, z }));
    for (const x of [-4.7, -0.1]) g.add(place(sphere(0.75, mat(col), 10), { x, y: Y1 + 1.15, z }));
  }
  // vertical scrubber + pump skids
  g.add(place(tank({ radius: 0.8, h: 3.2, roof: 'dome', material: mat(PALETTE.orange) }), { x: -4.6, y: Y1, z: -5.6 }));
  g.add(place(box(1.6, 0.9, 1.0, mat(PALETTE.blue)), { x: -2.2, y: Y1, z: -6.4 }));
  g.add(place(box(1.6, 0.9, 1.0, mat(PALETTE.blue)), { x: -2.2, y: Y1, z: -4.8 }));
  g.add(pipeRun([[-4.6, Y1 + 2.6, -5.6], [-4.6, Y1 + 3.3, -3.0], [-2.4, Y1 + 3.3, -0.4], [-2.4, Y1 + 1.9, -0.4]], 0.16, metal(PALETTE.steelLight)));
  g.add(pipeRun([[0.4, Y1 + 0.6, 1.4], [0.4, Y1 + 3.3, 1.4], [0.4, Y1 + 3.3, -3.0], [0.4, Y1 + 1.0, -3.0]], 0.16, metal(PALETTE.rust)));
  g.add(place(fence({ w: DW - 0.3, d: DD - 0.3, h: 1, style: 'railing', color: PALETTE.yellow, sides: ['front', 'left'] }), { x: DX, y: Y1, z: DZ }));
  // stairway between the decks along the front edge
  g.add(place(stairs({ w: 1.1, h: Y2 - Y1 - T + 0.05, d: 4.2, steps: 10, material: steelDark }), { x: 2.6, y: Y1, z: 1.3, ry: 90 }));

  // ---- main deck
  // drill floor substructure
  const dfx = -1.0, dfz = -4.6, DFW = 6, DFH = 2.8;
  g.add(place(facadeBlock({ w: DFW, d: DFW, h: DFH, floorHeight: DFH, style: 'industrial', wall: PALETTE.red, glass: PALETTE.glassDark, frame: PALETTE.white, bay: 3, roof: PALETTE.steelDark, seed: 8 }), { x: dfx, y: Y2, z: dfz }));
  g.add(place(box(DFW + 0.4, 0.25, DFW + 0.4, mat(PALETTE.steelDark)), { x: dfx, y: Y2 + DFH, z: dfz }));
  const DFY = Y2 + DFH + 0.25;
  // derrick: white lattice with a red windwall and crown block
  const dx = -0.9, dz = -4.8, DH = 19, DW0 = 4.2, DW1 = 1.5;
  g.add(place(lattice({ w: DW0, h: DH, topW: DW1, segments: 8, thickness: 0.26, material: mat(PALETTE.white) }), { x: dx, y: DFY, z: dz }));
  const wwH = 4.5, wwW = DW0 + 0.1 - (DW0 - DW1) * (wwH / DH);
  g.add(place(taperedBlock({ w: DW0 + 0.1, d: DW0 + 0.1, h: wwH, topW: wwW, topD: wwW, material: surface('corrugated', PALETTE.red, { size: 1 }), topMaterial: mat(PALETTE.red) }), { x: dx, y: DFY, z: dz }));
  g.add(place(box(DW1 + 0.9, 1.2, DW1 + 0.9, mat(PALETTE.red)), { x: dx, y: DFY + DH, z: dz }));
  g.add(place(box(DW1 + 1.3, 0.15, DW1 + 1.3, mat(PALETTE.steelDark)), { x: dx, y: DFY + DH - 0.1, z: dz }));
  for (const sx of [-1, 1]) {
    g.add(pipe(V(dx + sx * 0.5, DFY + DH + 1.55, dz - 0.2), V(dx + sx * 0.5, DFY + DH + 1.55, dz + 0.2), 0.45, mat(PALETTE.yellow)));
  }
  g.add(place(sphere(0.2, emissive(PALETTE.red, 1.4), 8), { x: dx, y: DFY + DH + 2.0, z: dz }));
  // monkey board, travelling block and drill line
  g.add(place(box(2.9, 0.15, 0.9, mat(PALETTE.yellow)), { x: dx, y: DFY + 12, z: dz + 1.6 }));
  g.add(place(box(0.7, 1.3, 0.7, mat(PALETTE.yellow)), { x: dx, y: DFY + 8.5, z: dz }));
  g.add(beam(V(dx, DFY + 9.8, dz), V(dx, DFY + DH, dz), 0.08, mat(PALETTE.darkGrey)));
  g.add(beam(V(dx, DFY + 5.0, dz), V(dx, DFY + 8.5, dz), 0.2, mat(PALETTE.steel)));
  // doghouse on the drill floor + V-door catwalk down to the pipe deck
  g.add(place(box(1.8, 2.0, 1.6, mat(PALETTE.white)), { x: dfx + 2.2, y: DFY, z: dfz + 2.0 }));
  g.add(place(box(0.08, 0.7, 1.0, mat(PALETTE.glassDark)), { x: dfx + 1.28, y: DFY + 1.0, z: dfz + 2.0 }));
  g.add(beam(V(dx, DFY, dz + 2.2), V(dx, Y2 + 0.2, dz + 6.2), 0.9, mat(PALETTE.yellow)));
  // pipe deck: racked drill pipe and casing
  const pipeM = metal(PALETTE.rust);
  for (const x of [-5.6, -2.9]) for (const z of [-0.3, 2.2]) g.add(place(box(0.2, 0.8, 0.2, steelDark), { x, y: Y2, z }));
  for (const x of [-5.6, -2.9]) g.add(place(box(0.25, 0.15, 2.9, steelDark), { x, y: Y2 + 0.8, z: 0.95 }));
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 9 - row; i++) {
      const px = -5.9 + row * 0.15 + i * 0.32, py = Y2 + 1.1 + row * 0.27;
      g.add(pipe(V(px, py, -0.75), V(px, py, 2.65), 0.15, pipeM));
    }
  }
  // containers / stores next to the pipe deck
  g.add(place(container({ color: PALETTE.blue, length: 3.0 }), { x: 0.8, y: Y2, z: -0.2, s: 0.75 }));
  g.add(place(container({ color: PALETTE.orange, length: 3.0 }), { x: 0.8, y: Y2 + 1.95, z: -0.2, s: 0.75 }));
  g.add(place(container({ color: PALETTE.green, length: 3.0 }), { x: 0.8, y: Y2, z: 2.0, s: 0.75 }));

  // accommodation block with helideck on top
  const ax = 4.3, az = -4.8, AW = 4.3, AD = 6.4;
  g.add(place(facadeBlock({ w: AW, d: AD, floors: 3, style: 'punched', wall: PALETTE.white, glass: PALETTE.window, frame: PALETTE.steelLight, windowW: 0.55, windowH: 0.45, bay: 1.6, lit: 0.2, seed: 17, roof: PALETTE.concreteDark }), { x: ax, y: Y2, z: az }));
  g.add(place(box(1.0, 2.2, 0.1, mat(PALETTE.orange)), { x: ax - 0.6, y: Y2, z: az + AD / 2 }));
  const AY = Y2 + 9;
  g.add(place(box(AW - 0.2, 1.0, AD - 0.2, mat(PALETTE.steelDark)), { x: ax, y: AY, z: az }));
  g.add(place(bigSign('TINY OIL', { w: AW - 0.4, h: 0.95, bg: PALETTE.navy, fg: PALETTE.yellow }), { x: ax, y: AY + 0.02, z: az + AD / 2 - 0.12 }));
  const HS = 7.8, hx = 5.6, hz = -5.9, HY = AY + 1.0;
  g.add(place(helideck(HS), { x: hx, y: HY, z: hz }));
  g.add(place(box(HS + 0.5, 0.12, HS + 0.5, mat('#4b5a52')), { x: hx, y: HY - 0.05, z: hz })); // safety net
  for (const [cx, cz] of [[hx + HS / 2 - 0.4, hz - HS / 2 + 0.4], [hx + HS / 2 - 0.4, hz + HS / 2 - 0.4], [hx - HS / 2 + 0.4, hz - HS / 2 + 0.4]]) {
    const ex = Math.max(ax - AW / 2, Math.min(ax + AW / 2, cx)), ez = Math.max(az - AD / 2, Math.min(az + AD / 2, cz));
    g.add(beam(V(ex, AY - 3, ez), V(cx, HY, cz), 0.22, yellow));
  }
  for (const [lx, lz] of [[hx - HS / 2 + 0.2, hz - HS / 2 + 0.2], [hx + HS / 2 - 0.2, hz - HS / 2 + 0.2], [hx + HS / 2 - 0.2, hz + HS / 2 - 0.2], [hx - HS / 2 + 0.2, hz + HS / 2 - 0.2]]) {
    g.add(place(sphere(0.14, emissive(PALETTE.green, 1.2), 6), { x: lx, y: HY + 0.3, z: lz }));
  }
  g.add(place(helicopter({ color: PALETTE.red }), { x: hx + 0.3, y: HY + 0.3, z: hz - 0.2, ry: 35, s: 0.82 }));
  // windsock
  g.add(place(cylinder(0.05, 0.05, 2.2, mat(PALETTE.white), 6), { x: ax - AW / 2 + 0.3, y: AY + 1.0, z: az + AD / 2 - 0.3 }));
  const sock = cone(0.25, 1.1, mat(PALETTE.orange), 8);
  sock.rotation.z = Math.PI / 2;
  sock.position.set(ax - AW / 2 - 0.25, AY + 2.95, az + AD / 2 - 0.3);
  g.add(sock);
  // lifeboats on davits along the east side
  for (const z of [-2.8, -6.6]) {
    g.add(place(lifeboat(), { x: 7.35, y: Y2 + 2.6, z }));
    for (const dz of [-1.2, 1.2]) {
      g.add(beam(V(6.5, Y2, z + dz), V(6.5, Y2 + 4.6, z + dz), 0.18, steelDark));
      g.add(beam(V(6.5, Y2 + 4.6, z + dz), V(7.35, Y2 + 4.6, z + dz), 0.18, steelDark));
      g.add(beam(V(7.35, Y2 + 4.6, z + dz), V(7.35, Y2 + 3.4, z + dz * 0.7), 0.03, mat(PALETTE.black)));
    }
  }

  // pedestal cranes: one unloading the supply boat, one over the west side
  g.add(place(crane({
    jib: 9, angle: 47, drop: 14.6,
    load: { w: 1.8, d: 2.2, h: 1.95, obj: place(container({ color: PALETTE.red, length: 2.9 }), { s: 0.75, ry: 90 }) },
  }), { x: 3.3, y: Y2, z: 1.4, ry: -90 }));
  g.add(place(crane({ jib: 8.5, angle: 64, drop: 2.5 }), { x: -5.4, y: Y2, z: -7.0, ry: 180 }));

  // flare boom off the front-left corner with a burning tip
  const fb0 = V(-5.6, Y2 + 0.6, 2.4), fb1 = V(-8.9, 22.0, 8.6);
  g.add(boom(fb0, fb1, { w0: 1.3, w1: 0.6, material: mat(PALETTE.white), thickness: 0.16, segments: 7 }));
  g.add(beam(V(-4.0, Y2, -0.2), V((fb0.x + fb1.x) / 2, (fb0.y + fb1.y) / 2, (fb0.z + fb1.z) / 2), 0.2, mat(PALETTE.white)));
  g.add(place(cylinder(0.3, 0.35, 0.9, mat(PALETTE.darkGrey), 8), { x: fb1.x, y: fb1.y - 0.2, z: fb1.z }));
  g.add(place(cone(0.85, 3.0, mat('#ff5a00', { emissive: '#ff3000', emissiveIntensity: 0.6 }), 9), { x: fb1.x, y: fb1.y + 0.25, z: fb1.z }));
  g.add(place(cone(0.5, 2.0, mat('#ffc000', { emissive: '#ffa000', emissiveIntensity: 0.6 }), 8), { x: fb1.x + 0.2, y: fb1.y + 0.3, z: fb1.z + 0.3 }));
  g.add(place(cone(0.35, 1.4, mat('#ff3a00', { emissive: '#ff2000', emissiveIntensity: 0.6 }), 7), { x: fb1.x - 0.3, y: fb1.y + 2.0, z: fb1.z - 0.2 }));
  for (const [sx, sy, sz, r] of [[0.4, 3.6, -0.5, 0.55], [0.9, 4.4, -1.2, 0.7], [1.6, 5.1, -1.9, 0.85]]) {
    g.add(place(sphere(r, mat('#5d5f63', { transparent: true, opacity: 0.55 }), 8), { x: fb1.x + sx, y: fb1.y + sy, z: fb1.z + sz }));
  }

  // main deck railings and deck lamps
  g.add(place(fence({ w: DW - 0.3, d: DD - 0.3, h: 1, style: 'railing', color: PALETTE.yellow, sides: ['front', 'back', 'left', 'right'] }), { x: DX, y: Y2, z: DZ }));
  for (const [lx, lz] of [[-6.2, 2.7], [6.2, 2.7], [-6.2, -7.7], [6.2, -7.7]]) {
    g.add(place(cylinder(0.06, 0.06, 2.0, steelDark, 6), { x: lx, y: Y2, z: lz }));
    g.add(place(box(0.35, 0.25, 0.35, emissive(PALETTE.windowLit, 1)), { x: lx, y: Y2 + 2.0, z: lz }));
  }
  // platform name board on the cellar deck front
  g.add(place(bigSign('TT-1 ALPHA', { w: 4.6, h: 1.1, bg: PALETTE.yellow, fg: PALETTE.black }), { x: -2.5, y: Y1 - T - 0.6, z: DZ + DD / 2 + 0.06 }));

  // supply boat moored along the front
  g.add(place(supplyBoat({ length: 12 }), { x: 4.0, y: y0, z: 7.6 }));
  g.add(place(box(12.4, 0.03, 4.2, mat('#e6f4f8', { transparent: true, opacity: 0.55 })), { x: 4.0, y: y0, z: 7.6 }));
  return g;
}

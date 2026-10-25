import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, metal, surface, gableRoof, chimney, tree, bench, hipRoof, windowPanel, door, fence, canvasTexture, textured, shade,
} from '../../src/lib/index.js';
import {
  brickWall, archBand, archPanel, paneTexture, bigSign, tram, runAlong, bezier, zAtX, tractionPole, wire, heritageLamp, clock,
} from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// A three-road brick tram shed on the west half; its arched doors face east
// onto a cobbled yard where the tracks fan in from a single throat track.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'cobbles'));

  // shed extents
  const X0 = -9.7, X1 = 0, Z0 = -4.7, Z1 = 3.7;
  const L = X1 - X0, D = Z1 - Z0, Xc = (X0 + X1) / 2, Zc = (Z0 + Z1) / 2;
  const H = 6.0, GH = 1.9, T = 0.35;
  const BAY = D / 3;
  const bays = [0, 1, 2].map((i) => Z0 + BAY * (i + 0.5)); // north, middle, south track centres
  const DOOR_W = 2.25, DOOR_HR = 3.7;

  const brick = surface('brick', PALETTE.brick, { size: 2.4 });
  const brickDk = surface('brick', PALETTE.brickDark, { size: 2.4 });
  const stone = mat(PALETTE.cream);
  const stoneDk = mat(PALETTE.sandstone);
  const green = '#2f5a3a';
  const glazing = textured(paneTexture('arch', { cols: 4, rows: 8 }), { roughness: 0.3, metalness: 0.3 });
  const fanGlaze = textured(paneTexture('fan', { cols: 6, rows: 3 }), { roughness: 0.3, metalness: 0.3 });

  // ---- tracks: three roads fanning out of one throat track at the east edge
  const RAIL_Y = y0 + 0.03;
  const RAIL_TOP = RAIL_Y + 0.08;
  const throatZ = bays[1];
  const xs = X1 - 1.6;
  const paths = bays.map((z) => (z === throatZ
    ? [[xs, z], [10, z]]
    : [[xs, z], [4.4, z], ...bezier([4.4, z], [6.8, z], [6.6, throatZ], [9.0, throatZ], 12).slice(1), [10, throatZ]]));
  const bed = surface('cobbles', shade(PALETTE.stone, -0.3), { size: 1.6 });
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const p of paths) {
    g.add(runAlong(p, { w: 1.9, h: 0.03, y: y0, material: bed }));
    for (const off of [-0.6, 0.6]) g.add(runAlong(p, { w: 0.1, h: 0.08, y: RAIL_Y, off, material: railM }));
  }
  // hand-thrown point levers beside the fan
  for (const [x, z, a] of [[8.2, 1.35, 25], [7.9, -2.6, -25]]) {
    g.add(place(box(0.5, 0.35, 0.35, mat(PALETTE.darkGrey)), { x, y: y0, z }));
    g.add(place(box(0.08, 1.0, 0.08, mat(PALETTE.red)), { x, y: y0 + 0.3, z, rx: a }));
  }

  // ---- shed walls
  const walls = new THREE.Group();
  // east (door) facade: three gabled bays with tall arched doors
  {
    const w = new THREE.Group();
    const cOf = (z) => -(z - Zc);
    w.add(brickWall({
      len: D, h: H, t: T, material: brick, reveal: brickDk,
      gables: bays.map((z) => ({ c: cOf(z), w: BAY, h: GH - 0.06 })),
      doors: bays.map((z) => ({ c: cOf(z), w: DOOR_W, hr: DOOR_HR })),
    }));
    for (const z of bays) {
      w.add(place(archBand({ w: DOOR_W, hr: DOOR_HR, band: 0.2, depth: 0.1, material: stone }), { x: cOf(z), z: T }));
      // little round vent in each gable
      w.add(place(new THREE.Mesh(new THREE.CircleGeometry(0.32, 16), mat('#2a2a2c')), { x: cOf(z), y: H + 0.62, z: T + 0.01 }));
      w.add(place(new THREE.Mesh(new THREE.RingGeometry(0.32, 0.46, 16), stone), { x: cOf(z), y: H + 0.62, z: T + 0.02 }));
    }
    // string course at eaves level
    w.add(place(box(D + 0.1, 0.3, 0.12, stone), { y: H - 0.3, z: T + 0.06 }));
    w.add(place(box(D + 0.1, 0.5, 0.1, stoneDk), { y: 0, z: T + 0.05 }));
    walls.add(place(w, { x: X1 - T, z: Zc, ry: 90 }));
  }
  // west gable wall: small arched windows per bay
  {
    const w = new THREE.Group();
    const cOf = (z) => z - Zc;
    const wins = bays.map((z) => ({ c: cOf(z), y: 2.0, w: 1.1, hr: 1.8 }));
    w.add(brickWall({ len: D, h: H, t: T, material: brick, reveal: brickDk, gables: bays.map((z) => ({ c: cOf(z), w: BAY, h: GH - 0.06 })), windows: wins }));
    for (const o of wins) {
      w.add(place(archPanel({ w: o.w, hr: o.hr, y0: o.y, material: glazing }), { x: o.c, z: T * 0.4 }));
      w.add(place(archBand({ w: o.w, hr: o.hr, y0: o.y, band: 0.16, depth: 0.08, material: stone }), { x: o.c, z: T }));
      w.add(place(box(o.w + 0.4, 0.14, 0.22, stone), { x: o.c, y: o.y - 0.14, z: T }));
    }
    w.add(place(box(D + 0.1, 0.3, 0.12, stone), { y: H - 0.3, z: T + 0.06 }));
    w.add(place(box(D + 0.1, 0.6, 0.1, stoneDk), { y: 0, z: T + 0.05 }));
    walls.add(place(w, { x: X0 + T, z: Zc, ry: -90 }));
  }
  // long side walls (south = street front, north = back): tall arched windows between pilasters
  for (const side of ['south', 'north']) {
    const w = new THREE.Group();
    const len = L - 2 * T;
    const us = [-3.375, -1.125, 1.125, 3.375];
    const wins = us.map((c) => ({ c, y: 1.0, w: 1.3, hr: 2.45 }));
    w.add(brickWall({ len, h: H, t: T, material: brick, reveal: brickDk, windows: wins }));
    for (const o of wins) {
      w.add(place(archPanel({ w: o.w, hr: o.hr, y0: o.y, material: glazing }), { x: o.c, z: T * 0.4 }));
      w.add(place(archBand({ w: o.w, hr: o.hr, y0: o.y, band: 0.18, depth: 0.08, material: stone }), { x: o.c, z: T }));
      w.add(place(box(o.w + 0.45, 0.16, 0.24, stone), { x: o.c, y: o.y - 0.16, z: T }));
    }
    for (const c of [-2.25, 0, 2.25]) w.add(place(box(0.45, H - 0.3, 0.14, brickDk), { x: c, z: T + 0.07 }));
    w.add(place(box(len, 0.3, 0.14, stone), { y: H - 0.3, z: T + 0.07 }));
    w.add(place(box(len, 0.6, 0.1, stoneDk), { y: 0, z: T + 0.05 }));
    if (side === 'south') {
      walls.add(place(w, { x: Xc, z: Z1 - T }));
    } else {
      walls.add(place(w, { x: Xc, z: Z0 + T, ry: 180 }));
    }
  }
  // corner piers
  for (const [x, z] of [[X0, Z0], [X0, Z1], [X1, Z0], [X1, Z1]]) {
    walls.add(place(box(0.6, H + 0.15, 0.6, brickDk), { x: x - Math.sign(x - Xc) * 0.22, z: z - Math.sign(z - Zc) * 0.22 }));
    walls.add(place(box(0.72, 0.18, 0.72, stone), { x: x - Math.sign(x - Xc) * 0.22, y: H + 0.15, z: z - Math.sign(z - Zc) * 0.22 }));
  }
  walls.position.y = y0;
  g.add(walls);

  // dark interior seen through the open doors, plus the shed floor
  g.add(place(box(L - 2 * T - 1.3, H - 0.05, D - 2 * T, mat('#1f1c1a')), { x: X0 + T + (L - 2 * T - 1.3) / 2, y: y0, z: Zc }));
  g.add(place(box(1.3, 0.02, D - 2 * T, mat(PALETTE.concreteDark)), { x: X1 - T - 0.65, y: y0, z: Zc }));

  // ---- roofs: one slate gable per road, louvred ventilators along the ridges
  const slate = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
  for (const z of bays) {
    g.add(place(gableRoof({ w: L - 0.1, d: BAY, h: GH, overhang: 0.32, ridge: 'x', material: slate, gableMaterial: brick }), { x: Xc, y: y0 + H, z }));
    const ry = y0 + H + GH;
    g.add(place(box(5.6, 0.55, 0.62, mat(PALETTE.darkGrey)), { x: Xc + 0.2, y: ry - 0.25, z }));
    for (let i = 0; i < 9; i++) g.add(place(box(0.08, 0.4, 0.66, mat('#1d1f22')), { x: Xc + 0.2 - 2.6 + i * 0.65, y: ry - 0.15, z }));
    g.add(place(gableRoof({ w: 5.8, d: 0.62, h: 0.32, overhang: 0.18, ridge: 'x', material: slate, gableMaterial: PALETTE.darkGrey }), { x: Xc + 0.2, y: ry + 0.3, z }));
  }
  g.add(place(chimney({ w: 0.9, h: 2.8, material: brickDk, capMaterial: stone }), { x: X0 + 1.1, y: y0 + H + 0.6, z: Z0 + 0.75 }));

  // ---- doors: north road shut, the other two thrown open
  const doorTex = canvasTexture(128, 256, (ctx, W, Hh) => {
    ctx.fillStyle = green;
    ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = shade(green, -0.25);
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 3, Hh);
    ctx.fillStyle = shade(green, 0.18);
    ctx.fillRect(0, Hh * 0.1, W, 10);
    ctx.fillRect(0, Hh * 0.85, W, 10);
    ctx.save();
    ctx.translate(W / 2, Hh * 0.475);
    ctx.rotate(Math.atan2(Hh * 0.75, W));
    ctx.fillRect(-Hh * 0.42, -5, Hh * 0.84, 10);
    ctx.restore();
    ctx.fillStyle = '#1b1b1b';
    ctx.fillRect(W - 14, Hh * 0.5, 8, 22);
  }, { key: 'tram-depot:door', repeat: false });
  const doorM = textured(doorTex, { roughness: 0.7 });
  const leafEdge = mat(shade(green, -0.2));
  const leaf = (w, h) => new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.08).translate(0, h / 2, 0), [leafEdge, leafEdge, leafEdge, leafEdge, doorM, doorM]);
  {
    const z = bays[0];
    for (const s of [-1, 1]) g.add(place(leaf(DOOR_W / 2 - 0.02, DOOR_HR), { x: X1 - T + 0.12, y: y0, z: z + s * DOOR_W / 4, ry: 90 }));
    g.add(place(archPanel({ w: DOOR_W, hr: 0, y0: DOOR_HR, material: fanGlaze }), { x: X1 - T + 0.12, y: y0, z, ry: 90 }));
    g.add(place(box(0.14, 0.14, DOOR_W, mat(PALETTE.woodDark)), { x: X1 - T + 0.12, y: y0 + DOOR_HR - 0.07, z }));
  }
  for (const z of [bays[1], bays[2]]) {
    for (const s of [-1, 1]) {
      g.add(place(leaf(DOOR_W / 2 - 0.02, DOOR_HR), { x: X1 + DOOR_W / 4 + 0.05, y: y0, z: z + s * (DOOR_W / 2 + 0.06), ry: s > 0 ? 180 : 0 }));
    }
  }

  // ---- the big sign on the street front + clock on the middle gable
  g.add(place(bigSign({ text: 'TRAM DEPOT', w: 6.6, h: 1.05, bg: green, fg: '#f2d77a', border: '#f2d77a' }), { x: Xc, y: y0 + 4.4, z: Z1 + 0.1 }));
  g.add(place(box(6.9, 0.12, 0.35, stone), { x: Xc, y: y0 + 4.3, z: Z1 + 0.12 }));
  const ck = clock({ r: 0.42 });
  g.add(place(ck, { x: X1 + 0.03, y: y0 + H + 0.62, z: bays[1], ry: 90 }));

  // ---- trams: a maroon car nosing out of the middle road, a green one on the south road
  const WIRE_H = 4.55;
  g.add(place(tram({ lower: '#7a1f22', route: '3', key: 'maroon', wireY: WIRE_H }), { x: 1.5, y: RAIL_TOP, z: bays[1] }));
  g.add(place(tram({ lower: '#2c5e3c', route: '7', key: 'green', wireY: WIRE_H }), { x: -0.2, y: RAIL_TOP, z: bays[2] }));

  // ---- overhead catenary: contact wire over every road, span wires between green poles
  const wireY = RAIL_TOP + WIRE_H;
  for (const p of paths) {
    const wp = p.map(([x, z]) => [x, z]);
    wp[0] = [X1 - 0.6, wp[0][1]];
    g.add(runAlong(wp, { w: 0.06, h: 0.06, y: wireY, material: mat('#1c1c1c') }));
  }
  const spanY = y0 + 5.7;
  for (const px of [3.4, 7.6]) {
    g.add(place(tractionPole({ h: 6.0, color: green }), { x: px, y: y0, z: 4.25 }));
    g.add(place(tractionPole({ h: 6.0, color: green }), { x: px, y: y0, z: -4.4 }));
    g.add(wire([px, spanY, 4.25], [px, spanY, -4.4]));
    for (const p of paths) {
      const z = zAtX(p, px);
      g.add(wire([px, spanY, z], [px, wireY, z], 0.04));
      g.add(place(box(0.08, 0.12, 0.3, mat('#d8d2c2')), { x: px, y: wireY + 0.1, z }));
    }
  }
  // bracket arm over the throat track
  g.add(place(tractionPole({ h: 6.0, color: green }), { x: 9.55, y: y0, z: -2.6 }));
  g.add(place(box(0.12, 0.12, 2.4, mat(green)), { x: 9.55, y: spanY - 0.1, z: -1.5 }));
  g.add(wire([9.55, spanY - 0.05, throatZ], [9.55, wireY, throatZ], 0.04));
  g.add(wire([9.55, y0 + 6.0, -2.6], [9.55, spanY, -1.2], 0.04));
  // wall rosettes holding the wires at the shed face
  for (const z of bays) g.add(place(box(0.2, 0.2, 0.2, mat(PALETTE.darkGrey)), { x: X1 + 0.1, y: wireY + 0.4, z }));

  // ---- yard: dispatcher's kiosk in the south-east corner
  {
    const kx = 8.55, kz = 3.55, kw = 2.2, kd = 1.9, kh = 2.7;
    g.add(place(box(kw, kh, kd, brick), { x: kx, y: y0, z: kz }));
    g.add(place(box(kw + 0.1, 0.35, kd + 0.1, stoneDk), { x: kx, y: y0, z: kz }));
    g.add(place(hipRoof({ w: kw, d: kd, h: 1.1, overhang: 0.25, material: slate }), { x: kx, y: y0 + kh, z: kz }));
    g.add(place(windowPanel({ w: 1.3, h: 0.9, frame: PALETTE.cream, lit: true }), { x: kx + 0.2, y: y0 + 1.1, z: kz + kd / 2 }));
    g.add(place(windowPanel({ w: 1.1, h: 0.9, frame: PALETTE.cream }), { x: kx - kw / 2, y: y0 + 1.1, z: kz, ry: -90 }));
    g.add(place(door({ w: 0.8, h: 2.0, color: green, frame: PALETTE.cream }), { x: kx + kw / 2, y: y0, z: kz - 0.1, ry: 90 }));
    g.add(place(windowPanel({ w: 0.9, h: 0.9, frame: PALETTE.cream }), { x: kx, y: y0 + 1.1, z: kz - kd / 2, ry: 180 }));
  }

  // north-east corner: sand bin, oil drums, spare wheelset
  g.add(place(box(1.6, 0.9, 1.0, mat(PALETTE.wood)), { x: 5.6, y: y0, z: -4.25 }));
  g.add(place(box(1.7, 0.1, 1.1, mat(PALETTE.woodDark)), { x: 5.6, y: y0 + 0.9, z: -4.25 }));
  const drumM = mat('#3b5f8a', { roughness: 0.5 });
  const drumR = mat(PALETTE.rust, { roughness: 0.6 });
  for (const [x, z, m] of [[8.7, -4.3, drumM], [9.35, -4.25, drumR], [9.0, -3.7, drumM]]) {
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 10).translate(0, 0.45, 0), m), { x, y: y0, z }));
  }
  {
    const wm = metal(PALETTE.steelDark);
    const ws = new THREE.Group();
    for (const s of [-1, 1]) {
      const wh = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.14, 14).rotateX(Math.PI / 2), wm);
      wh.position.set(0, 0.4, s * 0.6);
      ws.add(wh);
    }
    ws.add(new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.4, 6).rotateX(Math.PI / 2).translate(0, 0.4, 0), wm));
    g.add(place(ws, { x: 7.2, y: y0, z: -4.25, ry: 90 }));
  }

  // boundary: low brick wall with iron railings along the yard's street side, railing at the back
  g.add(place(box(5.6, 0.55, 0.3, brick), { x: 3.7, y: y0, z: 4.82 }));
  g.add(place(box(5.7, 0.08, 0.36, stone), { x: 3.7, y: y0 + 0.55, z: 4.82 }));
  g.add(place(fence({ w: 5.6, d: 0.1, h: 0.9, style: 'railing', color: '#1f2a22', sides: ['front'] }), { x: 3.7, y: y0 + 0.63, z: 4.77 }));
  for (const x of [0.75, 6.65]) {
    g.add(place(box(0.5, 1.6, 0.5, brickDk), { x, y: y0, z: 4.75 }));
    g.add(place(box(0.6, 0.12, 0.6, stone), { x, y: y0 + 1.6, z: 4.75 }));
  }
  g.add(place(fence({ w: 9.4, d: 0.1, h: 1.2, style: 'railing', color: '#1f2a22', sides: ['front'] }), { x: 5.15, y: y0, z: -4.9 }));

  // street front of the shed: pavement, heritage lamps, bench, planters
  g.add(place(patch(L + 0.4, 5 - Z1, 'paved'), { x: Xc + 0.2, y: y0, z: (Z1 + 5) / 2 }));
  for (const x of [-8.6, -1.1]) g.add(place(heritageLamp({ h: 3.4, color: green }), { x, y: y0, z: 4.55 }));
  g.add(place(bench({ w: 1.6 }), { x: -4.85, y: y0, z: 4.45 }));
  for (const x of [-6.6, -3.1]) {
    g.add(place(box(0.9, 0.45, 0.6, stoneDk), { x, y: y0, z: 4.45 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: Math.round(x * 7) }), { x, y: y0 + 0.45, z: 4.45 }));
  }
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 12 }), { x: 4.3, y: y0, z: -4.35 }));
  return g;
}

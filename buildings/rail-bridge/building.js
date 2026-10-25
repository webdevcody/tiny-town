import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, box, place, beam, extrude, taperedBlock, cylinder, sphere, tree,
  surface, mat, metal, emissive, water,
} from '../../src/lib/index.js';

// 3x1 tiles (30 x 10 m). The line runs along X; the water channel runs N-S
// (along Z) under two through-truss spans resting on a stone pier and abutments.
const HALF_X = (3 * TILE) / 2;
const HALF_Z = TILE / 2;

const WATER_X = 9.5;       // channel spans |x| < WATER_X
const ABUT_W = 1.4;        // abutment thickness along X
const BANK_H = 3.3;        // embankment / deck top
const BANK_TOP_D = 5.4;    // embankment crown width
const CHORD_Y = 3.05;      // bottom chord centre line
const TRUSS_Z = 2.3;       // truss planes at z = ±TRUSS_Z
const TRUSS_H = 4.3;       // chord-to-chord height
const SPAN_IN = 0.55;      // span starts this far from the pier centre
const SPAN_OUT = 9.45;     // ... and ends here on the abutment shelf
const GAUGE = 0.72;        // rails at z = ±GAUGE

const steelCol = '#9a3d2c'; // red-oxide paint
const steel = mat(steelCol, { metalness: 0.35, roughness: 0.5 });
const steelShade = mat('#7a2f22', { metalness: 0.35, roughness: 0.55 });
const stone = surface('brick', '#9d968a', { size: 2.4 });
const stoneCap = mat(PALETTE.stoneDark);

// One Pratt through-truss span along +X from the origin, centred on z = 0.
function trussSpan(L, N = 6) {
  const g = new THREE.Group();
  const H = TRUSS_H;
  const P = (i, y, z) => new THREE.Vector3((L * i) / N, y, z);
  for (const z of [TRUSS_Z, -TRUSS_Z]) {
    // chords
    g.add(beam(P(0, 0, z), P(N, 0, z), 0.4, steel));
    g.add(beam(P(1, H, z), P(N - 1, H, z), 0.4, steel));
    // inclined end posts
    g.add(beam(P(0, 0, z), P(1, H, z), 0.38, steel));
    g.add(beam(P(N, 0, z), P(N - 1, H, z), 0.38, steel));
    // verticals + Pratt diagonals (sloping down towards mid-span)
    for (let i = 1; i < N; i++) g.add(beam(P(i, 0, z), P(i, H, z), 0.24, steelShade));
    for (let i = 1; i < N / 2; i++) g.add(beam(P(i, H, z), P(i + 1, 0, z), 0.2, steel));
    for (let i = N - 1; i > N / 2; i--) g.add(beam(P(i, H, z), P(i - 1, 0, z), 0.2, steel));
    // gusset plates at the nodes
    for (let i = 0; i <= N; i++) g.add(place(box(0.55, 0.6, 0.46, steelShade), { x: (L * i) / N, y: -0.3, z }));
    for (let i = 1; i < N; i++) g.add(place(box(0.55, 0.6, 0.46, steelShade), { x: (L * i) / N, y: H - 0.3, z }));
  }
  // floor beams + top lateral struts / bracing
  for (let i = 0; i <= N; i++) g.add(beam(P(i, -0.05, -TRUSS_Z), P(i, -0.05, TRUSS_Z), 0.3, steelShade));
  for (let i = 1; i < N; i++) g.add(beam(P(i, H, -TRUSS_Z), P(i, H, TRUSS_Z), 0.22, steel));
  for (let i = 1; i < N - 1; i++) {
    g.add(beam(P(i, H, -TRUSS_Z), P(i + 1, H, TRUSS_Z), 0.1, steelShade));
    g.add(beam(P(i, H, TRUSS_Z), P(i + 1, H, -TRUSS_Z), 0.1, steelShade));
  }
  // portal frames at both ends: header plate + knee braces between end posts
  for (const [a, b] of [[0, 1], [N, N - 1]]) {
    const at = (t, z) => new THREE.Vector3().lerpVectors(P(a, 0, z), P(b, H, z), t);
    const p1 = at(0.72, -TRUSS_Z), p2 = at(0.72, TRUSS_Z), q1 = at(0.92, -TRUSS_Z), q2 = at(0.92, TRUSS_Z);
    g.add(beam(p1, p2, 0.22, steel));
    g.add(beam(q1, q2, 0.22, steel));
    const mid = (u, v) => new THREE.Vector3().lerpVectors(u, v, 0.5);
    g.add(beam(p1, mid(q1, q2), 0.12, steelShade));
    g.add(beam(p2, mid(q1, q2), 0.12, steelShade));
    const k1 = at(0.55, -TRUSS_Z), k2 = at(0.55, TRUSS_Z);
    g.add(beam(k1, new THREE.Vector3().lerpVectors(p1, p2, 0.22), 0.12, steelShade));
    g.add(beam(k2, new THREE.Vector3().lerpVectors(p2, p1, 0.22), 0.12, steelShade));
  }
  // deck plate and side walkway handrail
  g.add(place(box(L, 0.22, TRUSS_Z * 2, mat(PALETTE.darkGrey)), { x: L / 2, y: 0.03 }));
  for (const z of [TRUSS_Z - 0.45, -TRUSS_Z + 0.45]) {
    g.add(place(box(L, 0.06, 0.06, mat(PALETTE.lightGrey)), { x: L / 2, y: 1.15, z }));
    for (let i = 0; i <= 8; i++) g.add(place(box(0.06, 0.9, 0.06, mat(PALETTE.lightGrey)), { x: 0.3 + ((L - 0.6) * i) / 8, y: 0.25, z }));
  }
  return g;
}

// Semaphore home signal; the arm sticks out towards +z.
function semaphore(h = 5) {
  const g = new THREE.Group();
  const m = mat(PALETTE.white);
  g.add(box(0.5, 0.2, 0.5, mat(PALETTE.concreteDark)));
  g.add(cylinder(0.07, 0.1, h, m, 6));
  g.add(place(box(0.16, 0.16, 0.16, mat(PALETTE.black)), { y: h }));
  g.add(place(box(0.08, 0.3, 1.3, mat(PALETTE.red)), { x: 0.1, y: h - 0.7, z: 0.55, rx: -20 }));
  g.add(place(box(0.1, 0.1, 0.18, mat(PALETTE.white)), { x: 0.14, y: h - 0.62, z: 0.85, rx: -20 }));
  g.add(place(box(0.2, 0.32, 0.2, mat(PALETTE.black)), { x: 0.1, y: h - 1.05 }));
  g.add(place(box(0.1, 0.12, 0.12, emissive(PALETTE.red, 0.9)), { x: 0.2, y: h - 0.95 }));
  // ladder
  g.add(place(box(0.04, h - 1, 0.04, mat(PALETTE.darkGrey)), { x: -0.18, y: 0.2, z: 0.12 }));
  g.add(place(box(0.04, h - 1, 0.04, mat(PALETTE.darkGrey)), { x: -0.18, y: 0.2, z: -0.12 }));
  return g;
}

// Wheel pair (one each side), axis along Z.
function wheels(g, x, r, halfZ, m) {
  for (const z of [halfZ, -halfZ - 0.16]) g.add(place(cylinder(r, r, 0.16, m, 12), { x, y: r, z, rx: 90 }));
}

// Small steam locomotive with tender, length along X, smokebox towards +x.
function steamLoco(body = PALETTE.green) {
  const g = new THREE.Group();
  const black = mat(PALETTE.black);
  const red = mat(PALETTE.red);
  const bodyM = mat(body);
  g.add(place(box(10.6, 0.35, 2.4, black), { x: -0.6, y: 0.75 }));
  for (const x of [-0.8, 0.6, 2.0]) wheels(g, x, 0.62, 1.05, red);
  wheels(g, 3.3, 0.4, 1.05, red);
  // boiler, smokebox, chimney, dome
  g.add(place(cylinder(0.78, 0.78, 4.0, bodyM, 14), { x: -0.6, y: 1.9, rz: -90 }));
  g.add(place(cylinder(0.8, 0.8, 0.9, black, 14), { x: 3.4, y: 1.9, rz: -90 }));
  g.add(place(cylinder(0.22, 0.28, 0.9, black, 10), { x: 3.7, y: 2.55 }));
  g.add(place(cylinder(0.3, 0.36, 0.45, mat(PALETTE.glassGold), 10), { x: 1.4, y: 2.6 }));
  g.add(place(box(0.2, 0.25, 0.25, emissive(PALETTE.windowLit, 0.9)), { x: 4.35, y: 1.9 }));
  g.add(place(box(0.2, 0.5, 2.6, red), { x: 4.4, y: 0.75 }));
  // cab
  g.add(place(box(1.8, 2.0, 2.5, bodyM), { x: -1.75, y: 1.1 }));
  g.add(place(box(2.1, 0.15, 2.8, black), { x: -1.8, y: 3.1 }));
  for (const z of [1.26, -1.26]) g.add(place(box(0.8, 0.6, 0.02, mat(PALETTE.window)), { x: -1.6, y: 2.2, z }));
  // tender
  g.add(place(box(3.4, 1.7, 2.4, bodyM), { x: -4.6, y: 1.1 }));
  g.add(place(box(3.0, 0.25, 2.1, black), { x: -4.7, y: 2.75 }));
  for (const x of [-5.6, -3.6]) wheels(g, x, 0.42, 1.05, black);
  return g;
}

// Open coal wagon, length along X.
function coalWagon(color = PALETTE.brickBrown) {
  const g = new THREE.Group();
  const black = mat(PALETTE.black);
  g.add(place(box(5.6, 0.3, 2.3, black), { y: 0.7 }));
  g.add(place(box(5.4, 1.4, 2.4, mat(color)), { y: 1.0 }));
  g.add(place(box(5.0, 0.2, 2.0, mat(PALETTE.darkGrey)), { y: 2.25 }));
  for (const x of [-1.9, 1.9]) wheels(g, x, 0.42, 1.05, black);
  return g;
}

// Small canal boat, length along Z, bow towards -z.
function boat(hull = PALETTE.navy, cabin = PALETTE.cream) {
  const g = new THREE.Group();
  g.add(extrude([[-0.8, 2.4], [0.8, 2.4], [0.8, -1.6], [0, -2.6], [-0.8, -1.6]], 0.6, mat(hull), mat(PALETTE.woodLight)));
  g.add(place(box(1.2, 0.8, 2.0, mat(cabin)), { y: 0.6, z: 0.6 }));
  g.add(place(box(1.35, 0.1, 2.2, mat(PALETTE.roofRed)), { y: 1.4, z: 0.6 }));
  for (const sx of [-1, 1]) g.add(place(box(0.03, 0.3, 1.4, mat(PALETTE.window)), { x: sx * 0.61, y: 0.95, z: 0.6 }));
  g.add(place(cylinder(0.06, 0.06, 0.5, mat(PALETTE.black), 6), { y: 1.5, z: 1.2 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 1], 'grass'));

  // water channel
  g.add(place(box(WATER_X * 2, 0.08, TILE, water()), { y: y0 }));

  for (const s of [-1, 1]) {
    // embankment carrying the line to the tile edge
    const embW = HALF_X - WATER_X - ABUT_W;
    g.add(place(taperedBlock({ w: embW, d: TILE, h: BANK_H - y0, topW: embW, topD: BANK_TOP_D, material: surface('grass', PALETTE.grass, { size: 4 }), topMaterial: surface('gravel', PALETTE.gravel, { size: 3 }) }), { x: s * (HALF_X - embW / 2), y: y0 }));
    // stone abutment with wing walls, capped
    const ax = s * (WATER_X + ABUT_W / 2);
    g.add(place(taperedBlock({ w: ABUT_W, d: TILE, h: BANK_H - y0, topW: ABUT_W, topD: BANK_TOP_D, material: stone }), { x: ax, y: y0 }));
    g.add(place(box(ABUT_W + 0.2, 0.2, BANK_TOP_D + 0.2, stoneCap), { x: ax, y: BANK_H - 0.12 }));
    // bearing shelf
    g.add(place(box(0.7, CHORD_Y - 0.25 - y0, 6.0, stone), { x: s * (WATER_X - 0.2), y: y0 }));
    g.add(place(box(0.8, 0.12, 6.1, stoneCap), { x: s * (WATER_X - 0.2), y: CHORD_Y - 0.37 }));
  }

  // central stone pier with pointed cutwaters (water flows along Z)
  const pierPts = [[-0.75, -2.9], [0, -3.9], [0.75, -2.9], [0.75, 2.9], [0, 3.9], [-0.75, 2.9]];
  g.add(place(extrude(pierPts.map(([x, z]) => [x * 1.15, z * 1.05]), 0.5, stoneCap), { y: y0 }));
  g.add(place(extrude(pierPts, CHORD_Y - 0.4 - y0, stone, stoneCap), { y: y0 }));
  g.add(place(box(1.8, 0.15, 6.2, stoneCap), { y: CHORD_Y - 0.4 }));

  // steel bearings + the two truss spans
  for (const s of [-1, 1]) {
    for (const x of [SPAN_IN, SPAN_OUT]) for (const z of [-TRUSS_Z, TRUSS_Z]) g.add(place(box(0.7, 0.16, 0.7, mat(PALETTE.darkGrey)), { x: s * x, y: CHORD_Y - 0.4, z }));
    const span = trussSpan(SPAN_OUT - SPAN_IN);
    g.add(place(span, { x: s < 0 ? -SPAN_OUT : SPAN_IN, y: CHORD_Y }));
  }

  // track: ballast on the banks, sleepers + rails all the way through
  for (const s of [-1, 1]) {
    const len = HALF_X - WATER_X + 0.1;
    g.add(place(box(len, 0.12, 3.4, surface('gravel', PALETTE.stoneDark, { size: 2 })), { x: s * (HALF_X - len / 2), y: BANK_H }));
  }
  const sleeperM = mat(PALETTE.woodDark);
  for (let x = -HALF_X + 0.3; x < HALF_X - 0.2; x += 0.62) g.add(place(box(0.24, 0.12, 2.4, sleeperM), { x, y: BANK_H + 0.08 }));
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const z of [-GAUGE, GAUGE]) g.add(place(box(HALF_X * 2, 0.14, 0.1, railM), { y: BANK_H + 0.2, z }));

  // a goods train rolling east across the bridge
  const railTop = BANK_H + 0.34;
  g.add(place(steamLoco(), { x: 4.6, y: railTop }));
  for (const [dx, dy, r] of [[0, 3.6, 0.45], [-0.8, 4.0, 0.6], [-1.9, 4.3, 0.75]]) g.add(place(sphere(r, mat(PALETTE.white, { transparent: true, opacity: 0.85 })), { x: 8.3 + dx, y: railTop + dy }));
  g.add(place(coalWagon(), { x: -4.6, y: railTop }));
  g.add(place(coalWagon(PALETTE.grey), { x: -10.4, y: railTop }));

  // props: signals, relay cabinets, boat, greenery
  g.add(place(semaphore(), { x: 13.4, y: BANK_H, z: -2.3, ry: 180 }));
  g.add(place(semaphore(), { x: -13.4, y: BANK_H, z: 2.3 }));
  g.add(place(box(0.6, 1.0, 0.45, mat(PALETTE.grey)), { x: 12.2, y: BANK_H, z: 2.3 }));
  g.add(place(box(0.6, 1.0, 0.45, mat(PALETTE.grey)), { x: -12.2, y: BANK_H, z: -2.3 }));
  g.add(place(boat(), { x: 4.8, y: y0 + 0.02, z: 2.7 }));
  g.add(place(boat(PALETTE.green, PALETTE.white), { x: -5.6, y: y0 + 0.02, z: -2.4, ry: 180 }));

  const greens = [
    ['round', 3.4, 12.6, 4.0], ['bush', 1.3, 14.3, 4.3], ['cone', 4.0, -12.8, -4.0],
    ['bush', 1.2, -14.3, -4.3], ['bush', 1.1, -11.7, 4.3], ['round', 3.0, 14.2, -4.0],
  ];
  greens.forEach(([kind, h, x, z], i) => g.add(place(tree({ kind, h, seed: 61 + i }), { x, y: y0, z })));
  return g;
}

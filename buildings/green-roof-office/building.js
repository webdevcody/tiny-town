import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  ShapeBuilder, lot, patch, box, place, beam, mat, metal, glass, facade, surface,
  tree, hedge, cylinder, cone, bench, streetLamp, door, windowPanel,
} from '../../src/lib/index.js';
import { person, bike, bigSign } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street, glass) faces +z.
// The grass roof runs along X: on the ground at the west end, two storeys
// high at the east end, where it levels out into a roof deck.

const PROFILE = [[-9.7, 0], [-6, 2.0], [-2, 4.1], [2, 5.8], [5.5, 6.45], [8.2, 6.45]]; // [x, top of grass]
const SLAB = 0.45;               // roof build-up (soil + slab)
const XE = 8.2;                  // east end wall
const ZB = -3.8, ZF = 1.6;       // office body back / glass front
const ZRB = -4.1, ZRF = 2.4;     // roof back / front edge (overhang shades the glass)
const DECK_X = 5.5;              // roof deck starts here

/** Height of the grass roof at x. */
function roofY(x) {
  if (x <= PROFILE[0][0]) return 0;
  for (let i = 1; i < PROFILE.length; i++) {
    const [x1, y1] = PROFILE[i];
    const [x0, y0] = PROFILE[i - 1];
    if (x <= x1) return y0 + ((x - x0) / (x1 - x0)) * (y1 - y0);
  }
  return PROFILE[PROFILE.length - 1][1];
}

/** Scale ShapeBuilder metre UVs so a facade() material shows one window per bay x storey. */
function facadeUV(geom, m, bay) {
  const { cols, rows } = m.userData;
  const uv = geom.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / (bay * cols), uv.getY(i) / (FLOOR * rows));
  return geom;
}

/** Office body under the roof: tapering glass front, glass east end, timber back. */
function officeBody() {
  const g = new THREE.Group();
  // body outline in x/y: from where it emerges from the slope to the east wall
  const pts = PROFILE.slice(1).map(([x, y]) => [x, y - SLAB]);
  const x0 = PROFILE[0][0] + SLAB / ((PROFILE[1][1] - PROFILE[0][1]) / (PROFILE[1][0] - PROFILE[0][0]));
  const yE = pts[pts.length - 1][1];

  const curtain = facade({ style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelDark, lit: 0.3, seed: 7 });
  const bay = 1.6;

  // front glass (+z), convex polygon fanned from the west ground corner
  const fb = new ShapeBuilder();
  fb.poly([[x0, 0, ZF], [XE, 0, ZF], ...pts.slice().reverse().map(([x, y]) => [x, y, ZF])]);
  g.add(new THREE.Mesh(facadeUV(fb.build(), curtain, bay), curtain));

  // east end glass (+x)
  const eb = new ShapeBuilder();
  eb.quad([XE, 0, ZF], [XE, 0, ZB], [XE, yE, ZB], [XE, yE, ZF]);
  g.add(new THREE.Mesh(facadeUV(eb.build(), curtain, bay), curtain));

  // back wall (-z): timber cladding
  const bb = new ShapeBuilder();
  bb.poly([[XE, 0, ZB], [x0, 0, ZB], ...pts.map(([x, y]) => [x, y, ZB])]);
  g.add(new THREE.Mesh(bb.build(), surface('planks', PALETTE.wood, { size: 2 })));

  // back windows where the storey fits under the slope
  for (const x of [-3.5, -1, 1.5, 6.6]) g.add(place(windowPanel({ w: 1.4, h: 1.3, lit: x === 1.5 }), { x, y: 0.9, z: ZB, ry: 180 }));
  for (const x of [4.2, 6.6]) g.add(place(windowPanel({ w: 1.5, h: 1.2, lit: x === 6.6 }), { x, y: 3.8, z: ZB, ry: 180 }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.steelDark }), { x: 4.1, y: 0, z: ZB, ry: 180 }));

  // first-floor slab line behind the glass and mullions on the front
  const frame = metal(PALETTE.steelDark);
  const xFloor = xAt(FLOOR + SLAB);
  g.add(place(box(XE - xFloor, 0.3, 0.12, mat(PALETTE.offWhite)), { x: (XE + xFloor) / 2, y: FLOOR - 0.15, z: ZF + 0.03 }));
  g.add(place(box(0.12, 0.3, ZF - ZB, mat(PALETTE.offWhite)), { x: XE + 0.03, y: FLOOR - 0.15, z: (ZF + ZB) / 2 }));
  for (let x = XE - 0.05; x > x0 + 0.3; x -= 3.2) {
    const h = roofY(x) - SLAB;
    g.add(place(box(0.14, h, 0.14, frame), { x, z: ZF + 0.05 }));
  }
  g.add(place(box(0.14, yE, 0.14, frame), { x: XE + 0.05, z: ZB + 0.05 }));
  g.add(place(box(XE - x0, 0.25, 0.16, mat(PALETTE.concreteDark)), { x: (XE + x0) / 2, z: ZF + 0.02 }));
  return g;
}

/** x where the roof reaches height y (on the sloping part). */
function xAt(y) {
  for (let i = 1; i < PROFILE.length; i++) {
    const [x0, y0] = PROFILE[i - 1];
    const [x1, y1] = PROFILE[i];
    if (y <= y1 && y1 > y0) return x0 + ((y - y0) / (y1 - y0)) * (x1 - x0);
  }
  return PROFILE[PROFILE.length - 1][0];
}

/** The sloping grass roof slab with a crisp white fascia. */
function grassRoof() {
  const b = new ShapeBuilder(); // 0 grass, 1 fascia, 2 soffit
  const n = PROFILE.length;
  for (let i = 0; i < n - 1; i++) {
    const [xa, ya] = PROFILE[i];
    const [xb, yb] = PROFILE[i + 1];
    const la = Math.max(0, ya - SLAB), lb = Math.max(0, yb - SLAB);
    b.quad([xa, ya, ZRF], [xb, yb, ZRF], [xb, yb, ZRB], [xa, ya, ZRB], 0);
    b.quad([xa, la, ZRF], [xb, lb, ZRF], [xb, yb, ZRF], [xa, ya, ZRF], 1);
    b.quad([xb, lb, ZRB], [xa, la, ZRB], [xa, ya, ZRB], [xb, yb, ZRB], 1);
    b.quad([xa, la, ZRB], [xb, lb, ZRB], [xb, lb, ZRF], [xa, la, ZRF], 2);
  }
  const [xe, ye] = PROFILE[n - 1];
  b.quad([xe, ye - SLAB, ZRF], [xe, ye - SLAB, ZRB], [xe, ye, ZRB], [xe, ye, ZRF], 1);
  return new THREE.Mesh(b.build(), [
    surface('grass', PALETTE.grassLight, { size: 3 }),
    mat(PALETTE.offWhite),
    mat(PALETTE.concrete),
  ]);
}

/** Strip lying on the roof surface between x0..x1 and z0..z1. */
function roofStrip(x0, x1, z0, z1, material, lift = 0.04) {
  const xs = [x0, ...PROFILE.map(([x]) => x).filter((x) => x > x0 && x < x1), x1];
  const b = new ShapeBuilder();
  for (let i = 0; i < xs.length - 1; i++) {
    const ya = roofY(xs[i]) + lift, yb = roofY(xs[i + 1]) + lift;
    b.quad([xs[i], ya, z1], [xs[i + 1], yb, z1], [xs[i + 1], yb, z0], [xs[i], ya, z0]);
  }
  return new THREE.Mesh(b.build(), material);
}

/** Glass balustrade following the roof edge at z, from x0 to x1. */
function balustrade(x0, x1, z, h = 1.0) {
  const g = new THREE.Group();
  const xs = [x0, ...PROFILE.map(([x]) => x).filter((x) => x > x0 && x < x1), x1];
  const b = new ShapeBuilder();
  const steel = metal(PALETTE.steelLight);
  for (let i = 0; i < xs.length - 1; i++) {
    const ya = roofY(xs[i]), yb = roofY(xs[i + 1]);
    b.quad([xs[i], ya, z], [xs[i + 1], yb, z], [xs[i + 1], yb + h, z], [xs[i], ya + h, z]);
    g.add(beam([xs[i], ya + h, z], [xs[i + 1], yb + h, z], 0.07, steel));
  }
  for (let x = x0; x <= x1 + 0.01; x += (x1 - x0) / Math.max(1, Math.round((x1 - x0) / 2))) {
    g.add(place(box(0.06, h, 0.06, steel), { x, y: roofY(x), z }));
  }
  g.add(new THREE.Mesh(b.build(), mat(PALETTE.glassSky, { transparent: true, opacity: 0.45, side: THREE.DoubleSide, roughness: 0.1 })));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  const site = new THREE.Group();
  site.position.y = y0;
  g.add(site);

  site.add(officeBody());
  site.add(grassRoof());
  const deckY = PROFILE[PROFILE.length - 1][1];

  // roof path: paving from the ground at the west end up to the deck
  site.add(roofStrip(PROFILE[0][0] - 0.1, DECK_X, 0.4, 1.7, surface('paving', PALETTE.paving, { size: 1.5 })));
  // timber roof deck at the top
  site.add(place(box(XE - DECK_X + 0.3, 0.1, ZRF - ZRB - 0.3, surface('planks', PALETTE.wood, { size: 1.5 })), { x: (XE + DECK_X) / 2 - 0.15, y: deckY, z: (ZRF + ZRB) / 2 }));
  // balustrades: front edge up the slope, round the deck
  site.add(balustrade(-5, XE, ZRF - 0.1));
  site.add(balustrade(DECK_X - 1.5, XE, ZRB + 0.1));
  site.add(place(balustrade(-(ZRF - 0.1), -(ZRB + 0.1), 0), { x: XE - 0.1, ry: -90 }));

  // deck furniture: planters with small trees, benches, people
  const dy = deckY + 0.1;
  for (const [x, z] of [[6.0, -3.3], [7.6, -3.3]]) {
    site.add(place(box(1.0, 0.5, 1.0, mat(PALETTE.woodDark)), { x, y: dy, z }));
    site.add(place(tree({ kind: 'round', h: 2.6, seed: Math.round(x * 10) }), { x, y: dy + 0.5, z }));
  }
  site.add(place(bench({ w: 1.6 }), { x: 6.8, y: dy, z: -1.8 }));
  // café table with a parasol
  site.add(place(cylinder(0.45, 0.45, 0.08, mat(PALETTE.white), 10), { x: 7.3, y: dy + 0.72, z: 0.4 }));
  site.add(place(cylinder(0.05, 0.05, 2.3, metal(PALETTE.steelLight), 6), { x: 7.3, y: dy, z: 0.4 }));
  site.add(place(cone(1.3, 0.5, mat(PALETTE.orange), 8), { x: 7.3, y: dy + 2.1, z: 0.4 }));
  site.add(place(person({ shirt: PALETTE.yellow, pants: PALETTE.darkGrey }), { x: 6.5, y: dy, z: 0.3, ry: 70 }));
  site.add(place(person({ shirt: PALETTE.blue, pants: PALETTE.beige, hair: '#1e1a18' }), { x: 7.6, y: dy, z: 1.5, ry: -120 }));
  site.add(place(person({ shirt: PALETTE.white, pants: PALETTE.navy, skin: '#8d5a3b', hair: '#111' }), { x: 6.3, y: dy, z: -1.2, ry: 200 }));

  // people walking up and down the roof path
  const walkers = [
    [-7.8, 1.3, 90, PALETTE.red, PALETTE.navy],
    [-3.6, 0.8, 90, PALETTE.orange, PALETTE.darkGrey],
    [-0.6, 1.4, -90, PALETTE.purple, PALETTE.beige],
    [3.2, 0.9, 90, PALETTE.green, PALETTE.navy],
  ];
  walkers.forEach(([x, z, ry, shirt, pants], i) => {
    site.add(place(person({ shirt, pants, skin: i % 2 ? '#c88f68' : '#e8bd98' }), { x, y: roofY(x) + 0.04, z, ry }));
  });
  // a couple lounging on the grass
  site.add(place(person({ shirt: PALETTE.pink, pants: PALETTE.white }), { x: -1.2, y: roofY(-1.2), z: -2.2, ry: 20 }));
  site.add(place(box(1.4, 0.04, 1.0, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.5 })), { x: -2.2, y: roofY(-2.2) + 0.02, z: -2.4, rz: Math.atan(2.1 / 4) * 180 / Math.PI }));

  // wildflower clumps and shrubs on the green roof
  const flowers = [PALETTE.yellow, PALETTE.purple, PALETTE.pink, PALETTE.orange, PALETTE.foliageDark];
  [[-8, -2.5], [-6.5, -0.6], [-5, -3.2], [-3, -1.2], [-0.2, -3.4], [1.5, -0.8], [2.6, -3.0], [4.4, -1.6], [-7.2, -3.6], [0.6, -2.0]]
    .forEach(([x, z], i) => site.add(place(tree({ kind: 'bush', h: 0.7, seed: i + 3, color: flowers[i % flowers.length] }), { x, y: roofY(x) - 0.05, z })));
  site.add(place(tree({ kind: 'round', h: 3.6, seed: 12 }), { x: -4.4, y: roofY(-4.4) - 0.1, z: -2.6 }));
  site.add(place(tree({ kind: 'round', h: 3.2, seed: 15 }), { x: 2.4, y: roofY(2.4) - 0.1, z: -2.0 }));

  // entrance: glass doors under the overhang, canopy edge and sign
  site.add(place(door({ w: 2.2, h: 2.5, color: PALETTE.glassDark }), { x: 4.4, z: ZF }));
  site.add(place(patch(3.0, ZRF - ZF + 0.1, mat(PALETTE.stoneDark)), { x: 4.4, z: (ZF + ZRF) / 2 }));

  // forecourt
  site.add(place(patch(19.6, 10 / 2 - ZRF - 0.2, 'paved'), { x: 0, z: (ZRF + 4.8) / 2 }));
  site.add(place(patch(19.6, ZRF - ZF, surface('paving', PALETTE.pavement, { size: 1 })), { x: 0, z: (ZF + ZRF) / 2 - 0.05, }));
  site.add(place(box(4.2, 0.5, 0.6, mat(PALETTE.stoneDark)), { x: 0.2, z: 4.1 }));
  site.add(place(bigSign({ text: 'GREEN OFFICE', w: 4.0, h: 0.9, bg: PALETTE.foliageDark, fg: '#ffffff' }), { x: 0.2, y: 0.5, z: 4.1 }));
  for (const x of [-6.5, 8.6]) {
    site.add(place(box(1.6, 0.5, 1.6, mat(PALETTE.stone)), { x, z: 3.6 }));
    site.add(place(tree({ kind: 'round', h: 4.6, seed: x > 0 ? 31 : 32 }), { x, y: 0.5, z: 3.6 }));
  }
  site.add(place(bench({ w: 1.6 }), { x: -8.3, z: 4.3, ry: 180 }));
  site.add(place(streetLamp({ h: 4.2 }), { x: -9.4, z: 4.6 }));
  site.add(place(streetLamp({ h: 4.2 }), { x: 2.8, z: 4.6 }));
  // bike rack
  const bikeColors = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green];
  bikeColors.forEach((c, i) => site.add(place(bike({ color: c }), { x: -2.5 + i * 0.75 - 3.0 + 0.3, z: 3.4, ry: 90 })));
  site.add(place(box(2.8, 0.06, 0.06, metal(PALETTE.steelLight)), { x: -4.05, y: 0.55, z: 3.0 }));
  // people on the forecourt
  site.add(place(person({ shirt: PALETTE.navy, pants: PALETTE.darkGrey }), { x: 5.4, z: 3.4, ry: 180 }));
  site.add(place(person({ shirt: PALETTE.salmon, pants: PALETTE.navy, hair: '#c9a050' }), { x: 2.0, z: 3.0, ry: 60 }));
  site.add(place(person({ shirt: PALETTE.plasterBlue, pants: PALETTE.black }), { x: -9.0, z: 2.9, ry: 150 }));

  // east end: lawn with trees; back: hedge
  site.add(place(tree({ kind: 'round', h: 4.2, seed: 41 }), { x: 8.95, z: -3.4 }));
  site.add(place(tree({ kind: 'cone', h: 4.5, seed: 42 }), { x: 9.0, z: -0.8 }));
  site.add(place(tree({ kind: 'bush', h: 1.1, seed: 43 }), { x: 9.3, z: 1.4 }));
  site.add(place(hedge({ w: 17.6, h: 0.8, d: 0.6 }), { x: -0.4, z: -4.6 }));
  return g;
}

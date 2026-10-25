import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, sphere, dome, beam, pipe, place, group, door, windowPanel,
  surface, mat, metal, tree, fence, hayBale, cropField, sign,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// English brick tower mill: tapering brick tower, a wooden gallery (stage)
// half way up, white boat-ish cap with fantail, four white lattice sails.

const TZ = -0.6;          // tower centre z (leaves a front yard)
const R0 = 3.0, R1 = 2.1; // tower radius at base / top
const TH = 10.5;          // tower height above the lot
const GY = 4.2;           // gallery deck height above the lot

const towerR = (y) => R0 + (R1 - R0) * (y / TH);

// Point on a circle around the tower axis; angle 0 = front (+z).
const around = (r, a, y) => [Math.sin(a) * r, y, TZ + Math.cos(a) * r];

// One lattice sail along +y from the hub: stock, two rails, sail bars.
function sail({ length = 5.6, start = 0.9, lead = 0.35, trail = 1.15, frame, stock }) {
  const g = new THREE.Group();
  g.add(beam([0, 0, 0.12], [0, length, 0.12], 0.24, stock));
  const z = 0;
  for (const x of [-lead, trail * 0.45, trail]) g.add(beam([x, start, z], [x, length, z], 0.1, frame));
  const n = Math.round((length - start) / 0.42);
  for (let i = 0; i <= n; i++) {
    const y = start + ((length - start) * i) / n;
    g.add(beam([-lead, y, z], [trail, y, z], 0.08, frame));
  }
  // short bracing struts from stock to rail tips
  g.add(beam([0, length - 0.05, 0.05], [trail, length - 0.05, z], 0.1, frame));
  return g;
}

// Fantail: six-bladed fan turning in the y-z plane.
function fan({ r = 0.9, blade, hub }) {
  const g = new THREE.Group();
  for (let i = 0; i < 6; i++) {
    const b = place(box(0.05, r, 0.32, blade), { rx: i * 60 });
    g.add(b);
  }
  g.add(place(cylinder(0.12, 0.12, 0.3, hub, 8), { x: -0.15, rz: 90, y: 0 }));
  return g;
}

// Simple farm cart: plank bed, two spoked wheels, shafts.
function cart({ wood, dark }) {
  const g = new THREE.Group();
  g.add(place(box(1.3, 0.12, 2.0, wood), { y: 0.55 }));
  for (const x of [-0.62, 0.62]) g.add(place(box(0.06, 0.35, 2.0, wood), { x, y: 0.67 }));
  for (const z of [-0.97, 0.97]) g.add(place(box(1.3, 0.35, 0.06, wood), { y: 0.67, z }));
  for (const x of [-0.75, 0.75]) {
    g.add(place(cylinder(0.5, 0.5, 0.08, dark, 12), { x: x - 0.04 * Math.sign(x), y: 0.5, z: -0.2, rz: 90 }));
    g.add(place(cylinder(0.12, 0.12, 0.12, wood, 8), { x: x, y: 0.5, z: -0.2, rz: 90 }));
  }
  for (const x of [-0.45, 0.45]) g.add(beam([x, 0.6, 1.0], [x * 0.8, 0.3, 2.3], 0.08, wood));
  // a few flour sacks in the bed
  const sack = mat(PALETTE.cream);
  g.add(place(sphere(0.3, sack, 8), { x: -0.25, y: 0.6, z: 0.4, s: [1, 0.8, 1.2] }));
  g.add(place(sphere(0.3, sack, 8), { x: 0.28, y: 0.6, z: 0.2, s: [1, 0.8, 1.2] }));
  g.add(place(sphere(0.3, sack, 8), { x: 0, y: 0.6, z: -0.45, s: [1.2, 0.8, 1] }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const brick = surface('brick', PALETTE.brick, { size: 1.4 });
  const white = mat(PALETTE.white);
  const capMat = mat('#f6f4ee', { roughness: 0.6 });
  const wood = mat(PALETTE.wood);
  const woodDark = mat(PALETTE.woodDark);
  const tar = mat('#3a3330');
  const sailWhite = mat('#f4f1e8');
  const iron = metal(PALETTE.steelDark);

  // ---- tower --------------------------------------------------------------
  g.add(place(cylinder(R0 + 0.15, R0 + 0.25, 0.6, tar, 20), { y: y0, z: TZ }));
  g.add(place(cylinder(R1, R0, TH, brick, 20), { y: y0, z: TZ }));
  // white string course under the curb
  g.add(place(cylinder(R1 + 0.1, R1 + 0.12, 0.3, white, 20), { y: y0 + TH - 0.4, z: TZ }));

  // windows: a few small white-framed openings, staggered up the tower
  const wins = [[0.8, 2.0], [-1.6, 2.2], [2.6, 2.4], [-0.6, 6.4], [1.9, 6.6], [-2.5, 6.2], [0.5, 8.8], [-1.7, 9.0], [2.9, 8.9]];
  for (const [a, y] of wins) {
    const [x, , z] = around(towerR(y) - 0.04, a, y0 + y);
    g.add(place(windowPanel({ w: 0.55, h: 0.75, frame: PALETTE.white }), { x, y: y0 + y - 0.375, z, ry: THREE.MathUtils.radToDeg(a) }));
  }
  // ground floor door (front) and gallery door
  g.add(place(door({ w: 1.2, h: 2.2, color: PALETTE.green, frame: PALETTE.white }), { y: y0 + 0.05, z: TZ + R0 - 0.05 }));
  g.add(place(box(1.8, 0.15, 0.7, mat(PALETTE.stone)), { y: y0, z: TZ + R0 + 0.3 }));
  const gR = towerR(GY);
  g.add(place(door({ w: 1.0, h: 2.0, color: PALETTE.green, frame: PALETTE.white }), { y: y0 + GY + 0.15, z: TZ + gR - 0.07 }));

  // ---- gallery (stage) ----------------------------------------------------
  const GR = 3.95;
  const deckY = y0 + GY;
  const deck = new THREE.Mesh(new THREE.RingGeometry(gR - 0.1, GR, 28, 1), wood);
  deck.rotation.x = -Math.PI / 2;
  g.add(place(group(deck), { y: deckY + 0.16, z: TZ }));
  g.add(place(cylinder(GR, GR, 0.16, woodDark, 28), { y: deckY, z: TZ, s: [1, 1, 1] }));
  // railing: posts, top rail ring, mid rail ring
  const nPosts = 24;
  for (let i = 0; i < nPosts; i++) {
    const a = (i / nPosts) * Math.PI * 2;
    const [x, , z] = around(GR - 0.1, a, 0);
    g.add(place(box(0.08, 1.0, 0.08, white), { x, y: deckY + 0.16, z }));
  }
  for (const [h, t] of [[1.1, 0.06], [0.6, 0.035]]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(GR - 0.1, t, 4, 32), white);
    ring.rotation.x = Math.PI / 2;
    g.add(place(group(ring), { y: deckY + 0.16 + h, z: TZ }));
  }
  // diagonal struts from the brickwork up to the deck rim
  for (let i = 0; i < 12; i++) {
    const a = ((i + 0.5) / 12) * Math.PI * 2;
    g.add(beam(around(towerR(GY - 1.6), a, y0 + GY - 1.6), around(GR - 0.2, a, deckY), 0.14, woodDark));
  }
  // flour sacks + a hoist chain on the gallery
  for (const [a, s] of [[0.55, 0], [0.75, 1], [-0.7, 2]]) {
    const [x, , z] = around(GR - 0.6, a, 0);
    g.add(place(sphere(0.25, mat(PALETTE.cream), 8), { x, y: deckY + 0.16, z, s: [1, 1.3, 1], ry: s * 40 }));
  }

  // ---- cap ----------------------------------------------------------------
  const TY = y0 + TH;
  g.add(place(cylinder(R1 + 0.2, R1 + 0.2, 0.35, tar, 20), { y: TY, z: TZ }));
  g.add(place(cylinder(R1 + 0.25, R1 + 0.25, 0.5, capMat, 20), { y: TY + 0.35, z: TZ }));
  // boat-ish dome: a white dome stretched front-to-back
  g.add(place(dome({ radius: R1 + 0.25, height: 2.1, material: capMat, segments: 20 }), { y: TY + 0.85, z: TZ, s: [1, 1, 1.18] }));
  g.add(place(cylinder(0.08, 0.12, 0.5, white, 8), { y: TY + 2.9, z: TZ }));
  g.add(place(sphere(0.2, metal(PALETTE.glassGold), 10), { y: TY + 3.3, z: TZ }));
  // dark ribs on the cap
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const pts = [];
    for (let k = 0; k <= 6; k++) {
      const t = (k / 6) * (Math.PI / 2);
      const r = (R1 + 0.27) * Math.cos(t);
      pts.push(new THREE.Vector3(Math.sin(a) * r, TY + 0.85 + 2.12 * Math.sin(t), TZ + Math.cos(a) * r * 1.18));
    }
    for (let k = 0; k < 6; k++) g.add(beam(pts[k], pts[k + 1], 0.07, mat(PALETTE.lightGrey)));
  }

  // ---- windshaft, hub and sails --------------------------------------------
  const tilt = 9;
  const shaftY = TY + 1.15;
  const hubZ = TZ + (R1 + 0.25) * 1.18 + 0.75;
  g.add(pipe([0, shaftY - 0.12, TZ + 1.2], [0, shaftY, hubZ], 0.22, iron));
  g.add(place(box(0.7, 0.7, 0.55, iron), { y: shaftY - 0.35, z: hubZ }));
  const rotor = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    rotor.add(place(sail({ frame: sailWhite, stock: woodDark }), { rz: 45 + i * 90 }));
  }
  g.add(place(rotor, { y: shaftY, z: hubZ + 0.35, rx: -tilt }));

  // ---- fantail at the back of the cap --------------------------------------
  const fanZ = TZ - (R1 + 0.25) * 1.18 - 0.8;
  const fanY = TY + 2.2;
  for (const x of [-0.45, 0.45]) {
    g.add(beam([x, TY + 0.55, TZ - R1 - 0.1], [x * 0.4, fanY, fanZ], 0.1, white));
    g.add(beam([x * 1.3, TY + 0.4, TZ - R1 + 0.3], [x * 0.4, fanY - 0.05, fanZ], 0.08, white));
  }
  g.add(place(fan({ r: 0.8, blade: sailWhite, hub: iron }), { x: 0.15, y: fanY, z: fanZ }));

  // ---- yard & props --------------------------------------------------------
  // dirt track from the door to the lane, worn patch round the base
  g.add(place(patch(1.8, 2.9, 'dirt'), { y: y0, z: 3.55 }));
  g.add(place(new THREE.Mesh(new THREE.CircleGeometry(R0 + 0.9, 24).rotateX(-Math.PI / 2), surface('gravel', PALETTE.gravel, { size: 2 })), { y: y0 + 0.02, z: TZ }));

  // wheat in the two back corners, hay bales, cart with sacks
  g.add(place(cropField({ w: 2.0, d: 2.6, crop: 'cabbage' }), { x: -3.85, y: y0, z: -3.6 }));
  g.add(place(cropField({ w: 2.0, d: 2.6, crop: 'wheat' }), { x: 3.85, y: y0, z: -3.6 }));
  g.add(place(fence({ w: 2.0, d: 2.6, h: 0.6, style: 'picket', color: PALETTE.woodLight, sides: ['front', 'right'] }), { x: -3.85, y: y0, z: -3.6 }));
  g.add(place(cart({ wood, dark: woodDark }), { x: -2.8, y: y0, z: 2.5, ry: -20 }));
  g.add(place(hayBale({ r: 0.55 }), { x: 3.1, y: y0, z: 2.4, ry: 30 }));
  g.add(place(hayBale({ r: 0.55 }), { x: 4.0, y: y0, z: 1.4, ry: 75 }));
  g.add(place(hayBale({ r: 0.5 }), { x: 3.4, y: y0 + 1.05, z: 2.1, ry: 50 }));
  // old millstone leaning on the tower
  g.add(place(cylinder(0.75, 0.75, 0.25, mat(PALETTE.stone), 16), { x: -2.3, y: y0 + 0.75, z: TZ + 2.15, rx: 90, ry: -40, rz: 0 }));
  // sacks by the door
  for (const [x, z] of [[1.15, 2.75], [1.55, 2.95], [1.3, 3.25]]) g.add(place(sphere(0.28, mat(PALETTE.cream), 8), { x, y: y0, z, s: [1, 1.3, 1] }));

  // lane fence with a gap for the track, little name board
  g.add(place(fence({ w: 3.4, d: 0.1, h: 0.8, style: 'picket', color: PALETTE.woodLight, sides: ['front'] }), { x: -2.9, y: y0, z: TILE / 2 - 0.3 }));
  g.add(place(fence({ w: 3.4, d: 0.1, h: 0.8, style: 'picket', color: PALETTE.woodLight, sides: ['front'] }), { x: 2.9, y: y0, z: TILE / 2 - 0.3 }));
  g.add(place(box(0.12, 1.6, 0.12, woodDark), { x: 1.2, y: y0, z: 4.55 }));
  g.add(place(sign({ text: 'MILL', w: 1.3, h: 0.5, bg: PALETTE.woodDark, fg: '#f4e7c4', depth: 0.08 }), { x: 1.2, y: y0 + 1.25, z: 4.62 }));

  // trees and bushes
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 7 }), { x: -4.0, y: y0, z: 1.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 3 }), { x: 4.3, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 5 }), { x: -4.3, y: y0, z: 4.1 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 8 }), { x: 4.4, y: y0, z: -0.4 }));
  return g;
}

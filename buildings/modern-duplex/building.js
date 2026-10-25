import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, place, group, door, windowPanel,
  hedge, tree, car, surface, mat, glass, metal, emissive,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Two mirrored white cubes joined by a recessed timber link, staggered in depth.

const W = 4.0; // unit width (x)
const D = 5.2; // unit depth (z)
const H = 6.0; // two storeys

const white = mat(PALETTE.white);
const whiteTrim = mat(PALETTE.offWhite);
const anthracite = mat(PALETTE.roofBlack);
const timber = surface('planks', PALETTE.woodLight, { size: 1.2 });
const timberDark = surface('planks', PALETTE.wood, { size: 1.2 });
const deck = surface('planks', PALETTE.wood, { size: 1.6 });
const pane = glass(PALETTE.glassSky);
const railGlass = glass(PALETTE.glassSky, { opacity: 0.45 });
const steel = metal(PALETTE.steelLight);

// Big glazed opening (dark frame + glass + mullions), faces +z, base at y = 0.
function glazing(w, h, mullions = 1) {
  const g = group(
    place(box(w + 0.2, h + 0.2, 0.08, anthracite), { y: -0.1 }),
    place(box(w, h, 0.12, pane), { z: 0.02 })
  );
  for (let i = 1; i <= mullions; i++) {
    g.add(place(box(0.08, h, 0.16, anthracite), { x: -w / 2 + (w * i) / (mullions + 1), z: 0.02 }));
  }
  return g;
}

// Protruding picture-window frame box (the modern "boxed" window), faces +z.
function frameBox(w, h, depth) {
  const t = 0.16;
  return group(
    place(box(w, t, depth, anthracite), { y: h - t, z: depth / 2 }),
    place(box(w, t, depth, anthracite), { y: 0, z: depth / 2 }),
    place(box(t, h, depth, anthracite), { x: -w / 2 + t / 2, z: depth / 2 }),
    place(box(t, h, depth, anthracite), { x: w / 2 - t / 2, z: depth / 2 }),
    place(glazing(w - 2 * t - 0.2, h - 2 * t - 0.2, 2), { y: t + 0.1, z: 0.1 })
  );
}

// Glass balustrade along X from the origin, length len.
function glassRail(len, h = 0.9) {
  return group(
    place(box(len, h, 0.05, railGlass), {}),
    place(box(len + 0.06, 0.06, 0.1, steel), { y: h })
  );
}

function lounger() {
  const cushion = mat(PALETTE.white);
  return group(
    place(box(0.6, 0.25, 1.6, anthracite), {}),
    place(box(0.55, 0.08, 1.1, cushion), { y: 0.25, z: 0.25 }),
    place(box(0.55, 0.08, 0.55, cushion), { y: 0.42, z: -0.55, rx: -35 })
  );
}

function parasol(color) {
  return group(
    place(cylinder(0.25, 0.25, 0.08, anthracite, 10), {}),
    place(cylinder(0.04, 0.04, 2.1, steel, 6), {}),
    place(cone(0.9, 0.4, mat(color), 8), { y: 1.8 })
  );
}

function planter(len, seed) {
  const g = group(place(box(len, 0.5, 0.5, anthracite), {}));
  const n = Math.max(1, Math.round(len / 0.8));
  for (let i = 0; i < n; i++) {
    g.add(place(tree({ kind: 'bush', h: 0.7, seed: seed + i }), { x: -len / 2 + (len * (i + 0.5)) / n, y: 0.45 }));
  }
  return g;
}

// One dwelling. side = -1 (left/west) or +1 (right/east): door + timber strip on the outer side.
function unit(side, seed, parasolColor) {
  const sx = side;
  const g = new THREE.Group();
  const fz = D / 2; // front face
  const bz = -D / 2; // back face

  // white cube on a dark plinth
  g.add(box(W + 0.12, 0.25, D + 0.12, mat(PALETTE.concreteDark)));
  g.add(place(box(W, H, D, white), { y: 0.25 }));
  const y1 = 0.25; // ground-floor level
  const y2 = y1 + 3; // upper-floor level
  const yr = y1 + H; // roof level

  // ---- front (+z) ----
  // full-height timber cladding panel on the outer third, with the front door
  const tW = 1.45;
  const tx = sx * (W / 2 - tW / 2);
  g.add(place(box(tW, H - 0.3, 0.1, timber), { x: tx, y: y1, z: fz + 0.05 }));
  g.add(place(door({ w: 0.95, h: 2.3, color: PALETTE.roofBlack, frame: PALETTE.steelDark }), { x: tx, y: y1, z: fz + 0.1 }));
  g.add(place(box(0.08, 0.6, 0.06, steel), { x: tx - sx * 0.3, y: y1 + 0.9, z: fz + 0.24 })); // bar handle
  g.add(place(windowPanel({ w: 0.55, h: 2.0, glassColor: PALETTE.glassSky, frame: PALETTE.roofBlack }), { x: tx, y: y2 + 0.4, z: fz + 0.1 }));
  // cantilevered entrance canopy
  g.add(place(box(1.8, 0.14, 1.1, white), { x: tx, y: y1 + 2.65, z: fz + 0.55 }));
  g.add(place(box(1.8, 0.04, 1.1, emissive(PALETTE.windowLit, 0.4)), { x: tx, y: y1 + 2.61, z: fz + 0.55 }));
  // ground floor: big glazing
  const gx = sx * (-W / 2 + (W - tW) / 2);
  g.add(place(glazing(2.15, 2.35, 2), { x: gx, y: y1 + 0.15, z: fz }));
  // upper floor: protruding picture window frame
  g.add(place(frameBox(2.35, 2.2, 0.55), { x: gx, y: y2 + 0.35, z: fz }));

  // ---- outer side (x = sx * W/2) ----
  const ox = sx * W / 2;
  const ry = sx > 0 ? 90 : -90;
  g.add(place(glazing(1.0, 2.35, 0), { x: ox, y: y1 + 0.15, z: fz - 1.1, ry }));
  g.add(place(windowPanel({ w: 2.8, h: 0.8, glassColor: PALETTE.glassSky, frame: PALETTE.roofBlack }), { x: ox, y: y2 + 1.2, z: -0.4, ry }));
  // timber panel wrapping the back corner
  g.add(place(box(0.1, H - 0.3, 1.6, timber), { x: ox + sx * 0.05, y: y1, z: bz + 0.8 }));

  // ---- back (-z) ----
  g.add(place(glazing(2.6, 2.35, 2), { x: -sx * 0.4, y: y1 + 0.15, z: bz, ry: 180 }));
  g.add(place(windowPanel({ w: 1.6, h: 1.3, glassColor: PALETTE.glassSky, frame: PALETTE.roofBlack }), { x: -sx * 0.4, y: y2 + 0.9, z: bz, ry: 180 }));
  g.add(place(box(2.8, 0.15, 0.8, white), { x: -sx * 0.4, y: y1 + 2.65, z: bz - 0.4 })); // sun shade

  // ---- flat roof + rooftop terrace ----
  g.add(place(box(W + 0.2, 0.22, D + 0.2, whiteTrim), { y: yr })); // roof slab with slight overhang
  const yt = yr + 0.22;
  g.add(place(box(W - 0.1, 0.06, D - 0.1, deck), { y: yt }));
  // low parapet with glass balustrade on top
  const pT = 0.18;
  g.add(place(box(W + 0.2, 0.3, pT, white), { y: yt, z: D / 2 + 0.1 - pT / 2 }));
  g.add(place(box(W + 0.2, 0.3, pT, white), { y: yt, z: -D / 2 - 0.1 + pT / 2 }));
  g.add(place(box(pT, 0.3, D + 0.2 - 2 * pT, white), { x: W / 2 + 0.1 - pT / 2, y: yt }));
  g.add(place(box(pT, 0.3, D + 0.2 - 2 * pT, white), { x: -W / 2 - 0.1 + pT / 2, y: yt }));
  const ry0 = yt + 0.3;
  g.add(place(glassRail(W + 0.1), { y: ry0, z: D / 2 + 0.01 }));
  g.add(place(glassRail(D + 0.1), { x: -W / 2 - 0.01, y: ry0, ry: 90 }));
  g.add(place(glassRail(D + 0.1), { x: W / 2 + 0.01, y: ry0, ry: 90 }));

  // timber-clad stair pavilion at the back inner corner, glass door facing the terrace
  const pw = 2.0, pd = 1.9, ph = 2.4;
  const px = -sx * (W / 2 - pw / 2 - 0.15), pz = bz + pd / 2 + 0.15;
  g.add(place(box(pw, ph, pd, timberDark), { x: px, y: yt, z: pz }));
  g.add(place(box(pw + 0.3, 0.16, pd + 0.4, white), { x: px, y: yt + ph, z: pz + 0.1 }));
  g.add(place(glazing(0.9, 2.0, 0), { x: px, y: yt + 0.05, z: pz + pd / 2 }));

  // terrace furniture
  g.add(place(lounger(), { x: sx * 1.0, y: yt + 0.06, z: 0.2 }));
  g.add(place(lounger(), { x: sx * 0.15, y: yt + 0.06, z: 0.2 }));
  g.add(place(parasol(parasolColor), { x: sx * 1.0, y: yt + 0.06, z: 1.4 }));
  g.add(place(box(0.7, 0.45, 0.7, mat(PALETTE.woodLight)), { x: -sx * 0.6, y: yt + 0.06, z: 1.4 })); // table
  g.add(place(planter(2.0, seed), { x: -sx * 0.7, y: yt + 0.06, z: D / 2 - 0.45 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: seed + 9 }), { x: sx * 1.5, y: yt + 0.06, z: -1.0 }));

  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  // the two units, staggered: right one steps forward
  const L = { x: -2.2, z: -1.05 };
  const R = { x: 2.2, z: -0.45 };
  g.add(place(unit(-1, 31, PALETTE.orange), { x: L.x, y: y0, z: L.z }));
  g.add(place(unit(1, 47, PALETTE.blue), { x: R.x, y: y0, z: R.z }));

  // recessed timber link between the cubes
  g.add(place(box(0.42, H - 0.2, 3.6, timberDark), { y: y0 + 0.25, z: -1.4 }));
  g.add(place(box(0.5, 0.2, 3.8, whiteTrim), { y: y0 + 0.25 + H - 0.2, z: -1.4 }));

  // ---- front gardens ----
  const front = TILE / 2;
  const lFront = L.z + D / 2, rFront = R.z + D / 2;
  // left: paved path to the door, lawn with a small tree
  g.add(place(patch(1.2, front - lFront, 'paved'), { x: L.x - 1.25, y: y0, z: (front + lFront) / 2 }));
  g.add(place(patch(2.5, 0.9, 'gravel'), { x: L.x + 0.6, y: y0, z: lFront + 0.45 }));
  g.add(place(tree({ kind: 'round', h: 3.0, seed: 12 }), { x: L.x + 1.1, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 13 }), { x: L.x - 0.1, y: y0, z: 4.0 }));
  // right: concrete driveway with a car, path to the door
  g.add(place(patch(2.6, front - rFront, 'concrete'), { x: R.x - 0.7, y: y0, z: (front + rFront) / 2 }));
  g.add(place(patch(1.2, front - rFront, 'paved'), { x: R.x + 1.25, y: y0, z: (front + rFront) / 2 }));
  g.add(place(car({ color: PALETTE.red }), { x: R.x - 0.7, y: y0 + 0.05, z: 3.75, ry: 90, s: 0.6 }));

  // low white garden wall along the street, gaps for paths + driveway
  const wallM = white;
  const wz = front - 0.2;
  const seg = (x0, x1) => g.add(place(box(x1 - x0, 0.55, 0.25, wallM), { x: (x0 + x1) / 2, y: y0, z: wz }));
  seg(-4.85, L.x - 1.9);
  seg(L.x - 0.6, R.x - 2.05);
  seg(R.x + 0.6, R.x + 0.65);
  seg(R.x + 1.9, 4.85);
  // side walls of the front gardens
  g.add(place(box(0.25, 0.55, front - lFront - 0.2, wallM), { x: -4.85, y: y0, z: (front + lFront) / 2 - 0.1 }));
  g.add(place(box(0.25, 0.55, front - rFront - 0.2, wallM), { x: 4.85, y: y0, z: (front + rFront) / 2 - 0.1 }));
  // timber privacy screen between the two front gardens
  g.add(place(box(0.12, 1.2, front - lFront - 0.5, timber), { x: -0.05, y: y0, z: (front + lFront) / 2 - 0.15 }));

  // mailboxes + bollard lights by each path
  for (const [px, pz] of [[L.x - 1.95, wz - 0.25], [R.x + 1.95, wz - 0.25]]) {
    g.add(place(box(0.08, 0.9, 0.08, anthracite), { x: px, y: y0, z: pz }));
    g.add(place(box(0.35, 0.3, 0.25, anthracite), { x: px, y: y0 + 0.9, z: pz }));
  }
  for (const [px, pz] of [[L.x - 0.55, 2.9], [L.x - 0.55, 4.2], [R.x + 0.55, 3.2], [R.x + 0.55, 4.3]]) {
    g.add(place(cylinder(0.08, 0.08, 0.55, anthracite, 6), { x: px, y: y0, z: pz }));
    g.add(place(cylinder(0.09, 0.09, 0.08, emissive(PALETTE.windowLit, 0.6), 6), { x: px, y: y0 + 0.5, z: pz }));
  }
  // wheelie bins tucked beside the right door
  g.add(place(box(0.6, 1.0, 0.6, mat(PALETTE.green)), { x: 4.45, y: y0, z: rFront + 0.5 }));
  g.add(place(box(0.6, 1.0, 0.6, mat(PALETTE.darkGrey)), { x: 4.45, y: y0, z: rFront + 1.2 }));

  // ---- back gardens ----
  g.add(place(hedge({ w: TILE - 0.4, h: 1.2, d: 0.6 }), { y: y0, z: -TILE / 2 + 0.35 }));
  g.add(place(patch(3.2, 1.1, 'paved'), { x: L.x + 0.4, y: y0, z: L.z - D / 2 - 0.55 }));
  g.add(place(patch(3.2, 1.6, 'paved'), { x: R.x - 0.4, y: y0, z: R.z - D / 2 - 0.8 }));
  g.add(place(box(0.1, 1.4, 1.6, timber), { x: 0, y: y0, z: -TILE / 2 + 1.3 })); // divider
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 21 }), { x: -4.3, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'poplar', h: 6.0, seed: 22 }), { x: 4.3, y: y0, z: -4.3 }));
  // side strips
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 23 }), { x: -4.6, y: y0, z: -1.5 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 24 }), { x: 4.6, y: y0, z: -1.2 }));
  return g;
}


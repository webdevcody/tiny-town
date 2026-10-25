import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, parapet, box, cylinder, sphere, place, group, beam,
  ShapeBuilder, mat, metal, glass, emissive, surface, sign, bench, streetLamp, tree, shade, rng,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m), front (street) faces +z.
// Drive-through layout along X: north bus lane | central island | south bus lane.
// The island carries the ticket office (west end) and the wavy canopy with shelters.

const HALF_W = TILE;        // 10
const HALF_D = TILE / 2;    // 5
const ISLAND_D = 3.2;
const ISLAND_H = 0.2;
const LANE_Z = 3.2;         // centre of each bus lane (+/-)

// Wavy canopy: a thick sheet whose height follows a sine wave along X.
const CAN = { x0: -4.9, x1: 9.7, d: 7.4, base: 5.2, amp: 0.65, waves: 2, t: 0.28 };
const canopyY = (x) => CAN.base + CAN.amp * Math.sin(((x - CAN.x0) / (CAN.x1 - CAN.x0)) * Math.PI * 2 * CAN.waves);

function wavyCanopy() {
  const { x0, x1, d, t } = CAN;
  const n = 40;
  const Z = d / 2;
  const b = new ShapeBuilder();
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n;
    const xb = x0 + ((x1 - x0) * (i + 1)) / n;
    const ya = canopyY(xa), yb = canopyY(xb);
    b.quad([xa, ya, Z], [xb, yb, Z], [xb, yb, -Z], [xa, ya, -Z], 0);                 // top
    b.quad([xa, ya - t, -Z], [xb, yb - t, -Z], [xb, yb - t, Z], [xa, ya - t, Z], 1); // underside
    b.quad([xa, ya - t, Z], [xb, yb - t, Z], [xb, yb, Z], [xa, ya, Z], 2);           // front fascia
    b.quad([xb, yb - t, -Z], [xa, ya - t, -Z], [xa, ya, -Z], [xb, yb, -Z], 2);       // back fascia
  }
  const y0 = canopyY(x0), y1 = canopyY(x1);
  b.quad([x1, y1 - t, Z], [x1, y1 - t, -Z], [x1, y1, -Z], [x1, y1, Z], 2);
  b.quad([x0, y0 - t, -Z], [x0, y0 - t, Z], [x0, y0, Z], [x0, y0, -Z], 2);
  const mats = [
    mat('#f4f6f2', { roughness: 0.55 }),
    mat('#cfe3dc', { roughness: 0.7 }),
    mat(PALETTE.roofGreen, { roughness: 0.5 }),
  ];
  const g = group(new THREE.Mesh(b.build(), mats));
  // glazed skylight strip along the crest line
  const sk = new ShapeBuilder();
  const S = 0.9;
  for (let i = 0; i < n; i++) {
    const xa = x0 + 0.4 + ((x1 - x0 - 0.8) * i) / n;
    const xb = x0 + 0.4 + ((x1 - x0 - 0.8) * (i + 1)) / n;
    const ya = canopyY(xa) + 0.03, yb = canopyY(xb) + 0.03;
    sk.quad([xa, ya, S], [xb, yb, S], [xb, yb, -S], [xa, ya, -S], 0);
  }
  g.add(new THREE.Mesh(sk.build(), mat(PALETTE.glassSky, { roughness: 0.15, metalness: 0.4 })));
  // green ribs across the sheet
  const ribM = mat(PALETTE.roofGreen, { roughness: 0.5 });
  const ribs = 9;
  for (let i = 1; i < ribs; i++) {
    const x = x0 + ((x1 - x0) * i) / ribs;
    const slope = (canopyY(x + 0.05) - canopyY(x - 0.05)) / 0.1;
    g.add(place(box(0.18, 0.1, d + 0.06, ribM), { x, y: canopyY(x) - 0.02, rz: (Math.atan(slope) * 180) / Math.PI }));
  }
  return g;
}

// Branching "tree" column holding the canopy, standing on the island centre line.
function treeColumn(x, yBase) {
  const m = metal(PALETTE.steelLight, { roughness: 0.35 });
  const g = new THREE.Group();
  const fork = yBase + 3.0;
  g.add(place(cylinder(0.16, 0.22, fork - yBase, m, 8), { x, y: yBase }));
  g.add(place(sphere(0.24, m, 8), { x, y: fork }));
  for (const [dx, dz] of [[-1.6, -2.4], [1.6, -2.4], [-1.6, 2.4], [1.6, 2.4]]) {
    const tx = x + dx;
    g.add(beam([x, fork, 0], [tx, canopyY(tx) - CAN.t - 0.12, dz], 0.14, m));
  }
  return g;
}

// City bus, length along X, front at +X, passenger doors on the +Z side.
function bus({ color = PALETTE.red, stripe = PALETTE.white, len = 10, dest = '12 CENTRE' } = {}) {
  const g = new THREE.Group();
  const W = 2.5;
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  const dark = mat(PALETTE.darkGrey);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.15, metalness: 0.5 });
  g.add(place(box(len, 0.35, W - 0.1, dark), { y: 0.25 }));                    // skirt
  g.add(place(box(len, 2.55, W, body), { y: 0.45 }));                           // body
  g.add(place(box(len - 1.0, 1.05, W + 0.04, glassM), { x: -0.35, y: 1.65 }));  // side windows
  g.add(place(box(len + 0.02, 0.2, W + 0.05, mat(stripe)), { y: 1.2 }));        // livery stripe
  g.add(place(box(0.06, 1.45, W - 0.3, glassM), { x: len / 2, y: 1.3 }));       // windscreen
  g.add(place(box(0.06, 1.0, W - 0.5, glassM), { x: -len / 2, y: 1.75 }));      // rear window
  g.add(place(box(0.08, 0.32, W - 0.6, emissive('#ffb020', 0.9)), { x: len / 2, y: 2.62 })); // destination blind
  g.add(place(box(len - 0.4, 0.06, W - 0.2, mat(shade(color, 0.25))), { y: 3.0 }));          // roof
  g.add(place(box(2.2, 0.32, 1.5, mat(PALETTE.lightGrey)), { x: -len * 0.15, y: 3.0 }));      // A/C pod
  for (const dx of [len / 2 - 1.4, 0.2]) {                                                    // doors
    g.add(place(box(1.1, 2.05, 0.06, glassM), { x: dx, y: 0.55, z: W / 2 + 0.02 }));
    g.add(place(box(0.05, 2.05, 0.08, dark), { x: dx, y: 0.55, z: W / 2 + 0.03 }));
  }
  for (const sz of [-1, 1]) {                                                                 // lights
    g.add(place(box(0.08, 0.18, 0.35, emissive('#fffbe0', 0.8)), { x: len / 2, y: 0.65, z: sz * 0.85 }));
    g.add(place(box(0.08, 0.25, 0.25, emissive(PALETTE.red, 0.7)), { x: -len / 2, y: 0.7, z: sz * 0.95 }));
  }
  g.add(place(box(0.25, 0.12, 0.08, mat(PALETTE.black)), { x: len / 2 - 0.5, y: 2.2, z: W / 2 + 0.25 })); // mirror
  const wheelM = mat(PALETTE.black);
  const hubM = mat(PALETTE.lightGrey);
  for (const x of [len / 2 - Math.min(2.0, len * 0.16), -len / 2 + Math.min(2.4, len * 0.2)]) for (const sz of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 12);
    wg.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wg, wheelM);
    w.position.set(x, 0.5, sz * (W / 2 - 0.1));
    g.add(w);
    const hg = new THREE.CylinderGeometry(0.22, 0.22, 0.32, 8);
    hg.rotateX(Math.PI / 2);
    const h = new THREE.Mesh(hg, hubM);
    h.position.set(x, 0.5, sz * (W / 2 - 0.09));
    g.add(h);
  }
  g.add(place(sign({ text: dest, w: 1.9, h: 0.3, bg: '#1a1a1a', fg: '#ffb020', depth: 0.05 }), { x: len / 2 + 0.04, y: 2.6, ry: 90 }));
  return g;
}

// Glass waiting shelter with a bench either side of a central glass screen (screen along X).
function shelter(w = 3.0) {
  const g = new THREE.Group();
  const frame = metal(PALETTE.steelDark, { roughness: 0.4 });
  const pane = glass(PALETTE.glassSky, { opacity: 0.45 });
  const h = 2.5;
  g.add(place(box(w, h - 0.15, 0.06, pane), { y: 0.1 }));
  for (const x of [-w / 2, 0, w / 2]) g.add(place(box(0.1, h, 0.1, frame), { x }));
  for (const sx of [-1, 1]) g.add(place(box(0.06, h - 0.4, 1.2, pane), { x: sx * w / 2, y: 0.25 }));
  g.add(place(box(w + 0.4, 0.12, 1.6, mat(PALETTE.roofBlue)), { y: h }));
  g.add(place(box(w + 0.42, 0.18, 1.62, mat(PALETTE.white)), { y: h + 0.12 }));
  g.add(place(bench({ w: w - 0.6 }), { z: 0.3 }));
  g.add(place(bench({ w: w - 0.6 }), { z: -0.3, ry: 180 }));
  // timetable panel on the end
  g.add(place(box(0.08, 1.1, 0.7, emissive('#e8f4ff', 0.35)), { x: w / 2 + 0.06, y: 1.0 }));
  return g;
}

// Simple standing person.
function person(r, x, z, y) {
  const shirt = r.pick([PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green, PALETTE.orange, PALETTE.purple, PALETTE.white]);
  const legs = r.pick([PALETTE.navy, PALETTE.darkGrey, PALETTE.woodDark]);
  return place(group(
    place(box(0.32, 0.8, 0.22, mat(legs)), {}),
    place(box(0.42, 0.65, 0.28, mat(shirt)), { y: 0.8 }),
    place(sphere(0.15, mat('#e8b896'), 6), { y: 1.55 }),
  ), { x, y, z, ry: r.range(0, 360) });
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const r = rng(59);
  g.add(lot([2, 1], 'asphalt'));

  // ---- ground markings: kerbs along the edges, bay boxes, lane arrows ----
  const kerb = mat(PALETTE.concrete);
  const paint = mat(PALETTE.yellow);
  const white = mat(PALETTE.white);
  for (const sz of [-1, 1]) {
    g.add(place(box(2 * HALF_W, 0.18, 0.4, kerb), { y: y0, z: sz * (HALF_D - 0.2) }));
    // bay box outlines for each lane, dashed centre line where there is no bay
    const zc = sz * LANE_Z;
    const bays = sz < 0 ? [[-2.1, 10.6], [6.9, 6.2]] : [[0.4, 10.0]];
    for (const [bx, bl] of bays) {
      g.add(place(box(bl, 0.02, 0.14, paint), { x: bx, y: y0, z: zc - 1.45 }));
      g.add(place(box(bl, 0.02, 0.14, paint), { x: bx, y: y0, z: zc + 1.45 }));
      g.add(place(box(0.14, 0.02, 2.9, paint), { x: bx - bl / 2, y: y0, z: zc }));
      g.add(place(box(0.14, 0.02, 2.9, paint), { x: bx + bl / 2, y: y0, z: zc }));
    }
    const free = sz < 0 ? [] : [[-9.4, -5.6], [6.2, 9.8]];
    for (const [a, b] of free) for (let x = a; x < b - 0.4; x += 1.6) g.add(place(box(0.8, 0.02, 0.12, white), { x: x + 0.4, y: y0, z: zc }));
    // direction arrow (traffic drives on the right: north lane heads +x, south lane -x)
    const dir = -1;
    if (sz < 0) continue;
    const ax = -7.9;
    g.add(place(box(1.3, 0.02, 0.22, white), { x: ax - dir * 0.3, y: y0, z: zc }));
    g.add(place(box(0.6, 0.02, 0.18, white), { x: ax + dir * 0.35, y: y0, z: zc + 0.22, ry: dir * 40 }));
    g.add(place(box(0.6, 0.02, 0.18, white), { x: ax + dir * 0.35, y: y0, z: zc - 0.22, ry: -dir * 40 }));
  }

  // ---- central island ----
  const iy = y0 + ISLAND_H;
  g.add(place(box(2 * HALF_W - 0.6, ISLAND_H, ISLAND_D, [kerb, kerb, surface('paving', PALETTE.paving, { size: 2 }), kerb, kerb, kerb]), { y: y0 }));
  // tactile warning strips along the platform edges
  for (const sz of [-1, 1]) g.add(place(box(14.2, 0.02, 0.3, paint), { x: 2.4, y: iy, z: sz * (ISLAND_D / 2 - 0.25) }));

  // ---- ticket office at the west end of the island ----
  const ox = -7.2, ow = 4.6, od = ISLAND_D - 0.2, oh = 3.4;
  g.add(place(facadeBlock({
    w: ow, d: od, h: oh, floorHeight: oh, style: 'shop', wall: PALETTE.cream, glass: PALETTE.glassTeal,
    frame: PALETTE.roofGreen, bay: 1.5, lit: 0.4, seed: 59, roof: PALETTE.concreteDark,
  }), { x: ox, y: iy }));
  g.add(place(parapet({ w: ow, d: od, h: 0.45, material: mat(PALETTE.roofGreen) }), { x: ox, y: iy + oh }));
  g.add(place(box(ow + 0.6, 0.18, od + 0.5, mat(PALETTE.roofGreen)), { x: ox, y: iy + 2.6 })); // ticket-window eaves
  for (const sz of [-1, 1]) {
    g.add(place(sign({ text: 'TICKETS', w: 3.0, h: 0.55, bg: PALETTE.red, fg: '#ffffff', depth: 0.12 }), { x: ox, y: iy + 2.82, z: sz * (od / 2 + 0.05), ry: sz > 0 ? 0 : 180 }));
  }
  // rooftop "BUS STATION" sign on posts + round bus logo
  const ry = iy + oh;
  for (const sx of [-1.4, 1.4]) g.add(place(box(0.12, 1.0, 0.12, metal(PALETTE.steelDark)), { x: ox + sx, y: ry }));
  g.add(place(sign({ text: 'BUS STATION', w: 4.2, h: 0.85, bg: PALETTE.roofGreen, fg: '#ffffff', double: true }), { x: ox, y: ry + 1.0 }));
  // west end: clock + small round bus-stop roundel
  g.add(place(cylinder(0.55, 0.55, 0.12, mat(PALETTE.white), 20), { x: ox - ow / 2 - 0.06, y: iy + 2.0, rz: 90 }));
  g.add(place(cylinder(0.62, 0.62, 0.08, mat(PALETTE.roofGreen), 20), { x: ox - ow / 2 - 0.02, y: iy + 1.93, rz: 90 }));
  g.add(place(box(0.04, 0.4, 0.05, mat(PALETTE.black)), { x: ox - ow / 2 - 0.14, y: iy + 2.0 }));
  g.add(place(box(0.04, 0.05, 0.3, mat(PALETTE.black)), { x: ox - ow / 2 - 0.14, y: iy + 2.0, z: 0.13 }));
  // rooftop unit
  g.add(place(box(1.0, 0.5, 0.8, mat(PALETTE.lightGrey)), { x: ox - 1.5, y: ry }));

  // ---- wavy canopy on tree columns ----
  g.add(place(wavyCanopy(), { y: iy }));
  for (const x of [-2.6, 2.4, 7.4]) g.add(treeColumn(x, iy));
  // departure boards hanging under the canopy
  for (const x of [0.0, 5.0]) {
    for (const px of [x - 0.8, x + 0.8]) {
      g.add(place(box(0.06, canopyY(px) - CAN.t - 3.5, 0.06, metal(PALETTE.steelDark)), { x: px, y: iy + 3.4 }));
    }
    g.add(place(box(2.0, 0.55, 0.18, [mat(PALETTE.black), mat(PALETTE.black), mat(PALETTE.black), mat(PALETTE.black), emissive('#ffb020', 0.7), emissive('#ffb020', 0.7)]), { x, y: iy + 3.0 }));
  }

  // ---- waiting shelters, props and passengers on the island ----
  g.add(place(shelter(3.0), { x: -0.2, y: iy }));
  g.add(place(shelter(3.0), { x: 4.9, y: iy }));
  // ticket machine, bins, bay sign posts
  g.add(place(box(0.6, 1.5, 0.45, mat(PALETTE.roofGreen)), { x: -4.2, y: iy, z: 0.8 }));
  g.add(place(box(0.45, 0.4, 0.04, emissive('#9fe0ff', 0.5)), { x: -4.2, y: iy + 0.95, z: 1.04 }));
  for (const [x, z] of [[2.3, -1.1], [9.2, 0.9]]) g.add(place(cylinder(0.22, 0.22, 0.8, mat(PALETTE.darkGrey), 8), { x, y: iy, z }));
  for (const [x, z, label] of [[-3.6, -1.35, 'A'], [-3.6, 1.35, 'B']]) {
    g.add(place(cylinder(0.05, 0.05, 2.6, metal(PALETTE.steel), 6), { x, y: iy, z }));
    g.add(place(cylinder(0.38, 0.38, 0.08, mat(PALETTE.red), 16), { x, y: iy + 2.6, z, rx: 90 }));
    g.add(place(sign({ text: label, w: 0.45, h: 0.45, bg: PALETTE.yellow, fg: '#000000', depth: 0.1, double: true }), { x, y: iy + 2.0, z }));
  }
  // planter + tree at the east tip of the island
  g.add(place(box(1.4, 0.5, 1.8, mat(PALETTE.stoneDark)), { x: 9.0, y: iy, z: -0.3 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 7 }), { x: 9.0, y: iy + 0.5, z: -0.3 }));
  // lamps at both tips
  g.add(place(streetLamp({ h: 4.4 }), { x: 9.5, y: iy, z: 1.1, ry: 90 }));
  g.add(place(streetLamp({ h: 4.4 }), { x: -9.5, y: iy, z: -1.1, ry: -90 }));
  // waiting passengers
  for (const [x, z] of [[1.6, 1.15], [2.1, 0.95], [-1.9, -1.1], [3.3, -1.2], [6.8, 1.1], [-4.6, 0.3], [7.1, -0.9]]) {
    g.add(person(r, x, z, iy));
  }

  // ---- parked buses ----
  // north lane heads +x (doors on +z, facing the island); south lane heads -x
  g.add(place(bus({ color: PALETTE.red, stripe: PALETTE.yellow, len: 10.2, dest: '7 TOWN HALL' }), { x: -2.1, y: y0, z: -LANE_Z }));
  g.add(place(bus({ color: '#2f7fd0', stripe: PALETTE.white, len: 9.4, dest: '21 AIRPORT' }), { x: 0.4, y: y0, z: LANE_Z, ry: 180 }));
  g.add(place(bus({ color: PALETTE.yellow, stripe: PALETTE.roofGreen, len: 6.2, dest: 'X3 BEACH' }), { x: 6.9, y: y0, z: -LANE_Z, s: 0.95 }));

  return g;
}

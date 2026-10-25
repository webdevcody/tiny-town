import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, prismBlock, extrude, box, place, group, cylinder,
  rooftopUnits, tree, hedge, car, bench, streetLamp, sign, door,
  glass, mat, metal, emissive, surface, pool,
} from '../../src/lib/index.js';

// Rounded rectangle footprint [[x,z]…], corner radius r, `seg` segments per corner.
function roundRect(w, d, r, seg = 3) {
  const hw = w / 2, hd = d / 2;
  const corners = [[hw - r, hd - r, 0], [hw - r, -hd + r, -90], [-hw + r, -hd + r, -180], [-hw + r, hd - r, -270]];
  const pts = [];
  for (const [cx, cz, a0] of corners) {
    for (let i = 0; i <= seg; i++) {
      const a = THREE.MathUtils.degToRad(a0 + 90 - (90 * i) / seg);
      pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
    }
  }
  return pts;
}

// Glass balustrade with a white handrail along a closed outline.
function railing(points, h, glassMat, railMat) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 0.01) continue;
    const ry = THREE.MathUtils.radToDeg(-Math.atan2(z2 - z1, x2 - x1));
    const at = { x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry };
    g.add(place(box(len + 0.02, h, 0.05, glassMat), at));
    g.add(place(box(len + 0.06, 0.08, 0.12, railMat), { ...at, y: h }));
  }
  return g;
}

// Timber pergola: posts at the corners, beams along X, slats along Z.
function pergola({ w, d, h, slats = 7, material }) {
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.18, h, 0.18, material), { x: sx * (w / 2 - 0.1), z: sz * (d / 2 - 0.1) }));
  }
  for (const sz of [-1, 1]) g.add(place(box(w + 0.3, 0.22, 0.16, material), { y: h, z: sz * (d / 2 - 0.1) }));
  for (let i = 0; i < slats; i++) {
    const x = -w / 2 + 0.1 + (i * (w - 0.2)) / (slats - 1);
    g.add(place(box(0.1, 0.14, d + 0.4, material), { x, y: h + 0.22 }));
  }
  return g;
}

function planter(w, d, seed, kind = 'bush', h = 0.9) {
  return group(
    box(w, 0.45, d, mat(PALETTE.concreteDark)),
    place(box(w - 0.12, 0.05, d - 0.12, mat(PALETTE.dirt)), { y: 0.42 }),
    place(tree({ kind, h, seed }), { y: 0.45 }),
  );
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const white = mat(PALETTE.white);
  const railGlass = glass(PALETTE.glassSky, { opacity: 0.45 });
  const curtain = { style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.white, lit: 0.12, bay: 1.5, seed: 31, roof: PALETTE.concreteDark };

  // --- lobby: double-height dark glass, slightly recessed under the shaft ---
  const lobbyH = 4.5;
  g.add(place(prismBlock({ points: roundRect(5.8, 5.8, 1.3), h: lobbyH, floorHeight: lobbyH, style: 'curtain', glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 1.4, lit: 0.6, seed: 4, roof: PALETTE.concrete }), { y: y0 }));
  g.add(place(door({ w: 1.6, h: 2.6, color: PALETTE.glassSky, frame: PALETTE.steelLight }), { y: y0, z: 2.9 }));
  // entrance canopy + name sign
  g.add(place(extrude(roundRect(3.6, 2.0, 0.6), 0.25, white), { y: y0 + 3.0, z: 3.6 }));
  g.add(place(box(3.6, 0.1, 1.9, emissive('#fff1c9', 0.4)), { y: y0 + 2.96, z: 3.6 }));
  for (const x of [-1.5, 1.5]) g.add(place(cylinder(0.08, 0.08, 3.0, metal(PALETTE.steelLight), 8), { x, y: y0, z: 4.35 }));
  g.add(place(sign({ text: 'THE TEAL', w: 2.6, h: 0.5, bg: PALETTE.navy, fg: '#ffffff' }), { y: y0 + 3.3, z: 4.62 }));

  // --- main shaft: 14 storeys, rounded corners, white floor-edge bands ---
  const shaftFloors = 11;
  const S = 6.4, R = 1.6;
  const shaftY = y0 + lobbyH;
  g.add(place(prismBlock({ points: roundRect(S, S, R), floors: shaftFloors, ...curtain }), { y: shaftY }));
  const band = roundRect(S + 0.25, S + 0.25, R + 0.12);
  for (let f = 0; f <= shaftFloors; f++) {
    g.add(place(extrude(band, f === 0 || f === shaftFloors ? 0.35 : 0.16, white), { y: shaftY + f * FLOOR - 0.08 }));
  }

  // staggered corner terraces: diagonal pairs that swap corners every floor
  const T = 3.3, out = 0.95;
  const tPts = roundRect(T, T, 1.0);
  const tOff = S / 2 - T / 2 + out;
  const railPts = roundRect(T - 0.1, T - 0.1, 0.95);
  for (let f = 1; f < shaftFloors; f++) {
    const pair = f % 2 ? [[1, 1], [-1, -1]] : [[-1, 1], [1, -1]];
    for (const [sx, sz] of pair) {
      const at = { x: sx * tOff, z: sz * tOff, y: shaftY + f * FLOOR - 0.1 };
      g.add(place(extrude(tPts, 0.24, white, mat(PALETTE.paving)), at));
      g.add(place(railing(railPts, 1.0, railGlass, white), { ...at, y: at.y + 0.24 }));
      if (f % 4 === 1) g.add(place(planter(0.6, 0.6, f * 7 + sx, 'bush', 0.8), { x: sx * (tOff + 0.9), z: sz * (tOff + 0.9), y: at.y + 0.24 }));
    }
  }

  // --- setback 1: two floors, with a wrap-around terrace on the shaft roof ---
  const topY = shaftY + shaftFloors * FLOOR + 0.27;
  g.add(place(railing(roundRect(S + 0.05, S + 0.05, R), 1.0, railGlass, white), { y: topY }));
  g.add(place(patch(S - 0.6, S - 0.6, mat(PALETTE.paving)), { y: topY - 0.03 }));
  const s1 = 4.8, s1z = -0.5;
  g.add(place(prismBlock({ points: roundRect(s1, s1, 1.2), floors: 2, ...curtain, seed: 32 }), { y: topY, z: s1z }));
  g.add(place(extrude(roundRect(s1 + 0.25, s1 + 0.25, 1.3), 0.16, white), { y: topY + FLOOR - 0.08, z: s1z }));
  for (const [x, z] of [[-2.55, 2.55], [2.55, 2.55], [-2.55, -2.6], [2.55, -2.6]]) {
    g.add(place(planter(0.7, 0.7, x * 5 + z, 'bush', 1.0), { x, y: topY, z }));
  }
  g.add(place(bench({ w: 1.2 }), { x: 0, y: topY, z: 2.6, ry: 180 }));

  // --- penthouse: glass box at the back, pergola + plunge pool on the front deck ---
  const phY = topY + 2 * FLOOR;
  g.add(place(extrude(roundRect(s1 + 0.3, s1 + 0.3, 1.35), 0.3, white, mat(PALETTE.woodDark)), { y: phY, z: s1z }));
  const deckY = phY + 0.3;
  g.add(place(railing(roundRect(s1 + 0.2, s1 + 0.2, 1.3), 0.9, railGlass, white), { y: deckY, z: s1z }));
  const phD = 2.4, phZ = s1z - s1 / 2 + phD / 2 + 0.2;
  g.add(place(prismBlock({ points: roundRect(4.0, phD, 0.8), h: 3.2, floorHeight: 3.2, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.white, bay: 1.0, lit: 0.5, seed: 33, roof: PALETTE.concreteDark }), { y: deckY, z: phZ }));
  g.add(place(extrude(roundRect(4.5, phD + 0.5, 1.0), 0.25, white), { y: deckY + 3.2, z: phZ }));
  g.add(place(rooftopUnits({ w: 3.0, d: 1.4, count: 2, seed: 8 }), { y: deckY + 3.45, z: phZ }));
  g.add(place(pergola({ w: 2.5, d: 1.9, h: 2.5, material: mat(PALETTE.wood) }), { x: -0.9, y: deckY, z: s1z + 1.25 }));
  g.add(place(box(0.6, 0.35, 1.3, mat(PALETTE.white)), { x: -1.5, y: deckY, z: s1z + 1.2 }));
  g.add(place(box(0.6, 0.35, 1.3, mat(PALETTE.white)), { x: -0.4, y: deckY, z: s1z + 1.2 }));
  g.add(place(pool({ w: 1.2, d: 1.8 }), { x: 1.4, y: deckY, z: s1z + 1.2 }));
  g.add(place(planter(0.5, 0.5, 41, 'bush', 0.8), { x: 1.85, y: deckY, z: phZ + 1.6 }));

  // --- ground: drop-off loop, lawns, trees, lamps ---
  g.add(place(patch(10, 2.6, 'asphalt'), { y: y0, z: 3.7 }));
  g.add(place(box(10, 0.04, 0.12, mat(PALETTE.white)), { y: y0 + 0.05, z: 3.7 }));
  g.add(place(patch(4.0, 2.6, 'cobbles'), { y: y0 + 0.01, z: 3.7 }));
  g.add(place(car({ color: PALETTE.yellow, kind: 'taxi' }), { x: 3.2, y: y0 + 0.05, z: 4.2, s: 0.6 }));
  g.add(place(car({ color: PALETTE.navy }), { x: -3.4, y: y0 + 0.05, z: 3.2, ry: 180, s: 0.6 }));
  for (const sx of [-1, 1]) {
    g.add(place(patch(2.0, 6.6, 'grass'), { x: sx * 4.0, y: y0, z: -1.6 }));
    g.add(place(tree({ kind: 'round', h: 3.6, seed: 11 + sx }), { x: sx * 3.85, y: y0, z: 0.7 }));
    g.add(place(tree({ kind: 'cone', h: 4.0, seed: 15 + sx }), { x: sx * 3.9, y: y0, z: -3.9 }));
    g.add(place(streetLamp({ h: 3.4 }), { x: sx * 2.6, y: y0, z: 2.55, ry: sx > 0 ? 0 : 180 }));
  }
  g.add(place(hedge({ w: 5.6, h: 0.8, d: 0.5 }), { y: y0, z: -4.6 }));
  g.add(place(bench({ w: 1.3 }), { x: 4.0, y: y0, z: -1.7, ry: -90 }));
  g.add(place(bench({ w: 1.3 }), { x: -4.0, y: y0, z: -1.7, ry: 90 }));
  return g;
}

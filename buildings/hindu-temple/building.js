import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, surface, box, cylinder, cone, sphere, place, group, mat, metal, water, textured,
  columns, barrelRoof, parapet, awning, stairs, tree,
} from '../../src/lib/index.js';
import { deityTexture, kaviTexture, graniteTexture, kolamTexture, tierBox } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// South Indian temple: painted gopuram gateway on the axis, pillared mandapa and gold-domed
// vimana behind it, a stepped temple tank on the left and flower stalls out front.

const y0 = LOT_HEIGHT;
const AX = 1.0; // temple axis (x)

const gold = metal('#e2b23a', { roughness: 0.35 });
const saffron = mat('#e8742a');
const red = mat('#b8352a');
const cornice = mat('#c7562e');
const ochre = mat('#e6c27a');
const cream = mat('#f1e6c8');
const granite = textured(graniteTexture());
const stoneLight = mat('#cdbf9f');
const dark = mat('#2a1d16');

/** Kalasha finial: small gold pot with a pointed top. */
function kalasha(s = 1) {
  return group(
    place(cylinder(0.08 * s, 0.1 * s, 0.08 * s, gold, 8), {}),
    place(sphere(0.11 * s, gold, 8), { y: 0.06 * s }),
    place(cone(0.07 * s, 0.24 * s, gold, 8), { y: 0.25 * s }),
  );
}

function gopuram() {
  const g = new THREE.Group();
  const W = 4.4, D = 2.4, baseH = 2.8, gate = 1.3;
  const pier = (W - gate) / 2;
  // granite base with the gate passage
  for (const s of [-1, 1]) g.add(place(box(pier, baseH, D, granite), { x: s * (gate / 2 + pier / 2) }));
  g.add(place(box(gate, 0.5, D, granite), { y: baseH - 0.5 }));
  g.add(place(box(gate + 0.2, 0.12, 0.12, gold), { y: baseH - 0.55, z: D / 2 + 0.02 }));
  // heavy wooden doors swung open against the passage walls
  for (const s of [-1, 1]) g.add(place(box(0.08, 2.2, 1.0, mat(PALETTE.woodDark)), { x: s * (gate / 2 - 0.05), z: 0.6 }));
  g.add(place(box(W + 0.3, 0.22, D + 0.3, cornice), { y: baseH }));

  // five stepped tiers covered in painted deities
  let y = baseH + 0.22;
  const tierH = 1.35;
  for (let i = 0; i < 5; i++) {
    const w = 3.9 - i * 0.55, d = 2.0 - i * 0.25;
    g.add(place(tierBox(w, tierH, d, deityTexture(i % 3), cornice), { y }));
    // central opening on front and back
    for (const s of [-1, 1]) {
      g.add(place(box(0.55, 0.85, 0.06, gold), { y: y + 0.2, z: s * (d / 2 + 0.01) }));
      g.add(place(box(0.4, 0.7, 0.08, dark), { y: y + 0.25, z: s * (d / 2 + 0.02) }));
    }
    y += tierH;
    g.add(place(box(w + 0.3, 0.18, d + 0.3, cornice), { y }));
    y += 0.18;
    // little gold kalashas at the corners of each cornice
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(place(kalasha(0.9), { x: sx * (w / 2 + 0.05), y, z: sz * (d / 2 + 0.05) }));
    }
  }
  // crowning shala vault with a row of kalashas and horned ends
  const vw = 2.3, vd = 1.15, vh = 1.1;
  g.add(place(box(vw, 0.25, vd, saffron), { y }));
  g.add(place(barrelRoof({ w: vw, d: vd, h: vh, axis: 'x', material: saffron, endMaterial: mat('#f2c14e') }), { y: y + 0.25 }));
  for (const s of [-1, 1]) {
    g.add(place(cone(0.16, 0.6, mat('#f2c14e'), 8), { x: s * (vw / 2 + 0.05), y: y + 0.5, rz: -s * 35 }));
  }
  for (let i = 0; i < 7; i++) g.add(place(kalasha(1.4), { x: -0.9 + i * 0.3, y: y + 0.25 + vh - 0.05 }));
  return g;
}

function mandapa() {
  const g = new THREE.Group();
  const W = 3.8, D = 2.8, plinth = 0.6, colH = 2.3;
  g.add(box(W, plinth, D, granite));
  // pillars: cream shafts with red and gold bands
  for (const z of [D / 2 - 0.3, 0, -D / 2 + 0.3]) {
    g.add(place(columns({ count: 4, length: W - 0.6, radius: 0.14, h: colH, square: true, material: cream }), { y: plinth, z }));
    g.add(place(columns({ count: 4, length: W - 0.6, radius: 0.17, h: 0.3, square: true, material: red }), { y: plinth, z }));
    g.add(place(columns({ count: 4, length: W - 0.6, radius: 0.17, h: 0.15, square: true, material: gold }), { y: plinth + colH - 0.4, z }));
  }
  // inner sanctum doorway glows at the back
  g.add(place(box(1.4, colH, 0.15, ochre), { y: plinth, z: -D / 2 + 0.1 }));
  g.add(place(box(0.7, 1.6, 0.05, mat('#ffcf6a', { emissive: '#c77a10', emissiveIntensity: 0.5 })), { y: plinth, z: -D / 2 + 0.2 }));
  // roof slab with a painted frieze parapet
  g.add(place(box(W + 0.4, 0.22, D + 0.4, cornice), { y: plinth + colH }));
  const roofY = plinth + colH + 0.82;
  g.add(place(tierBox(W, 0.6, D, deityTexture(1), surface('paving', '#d8c49a', { size: 1.5 })), { y: roofY - 0.6 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(kalasha(1.2), { x: sx * (W / 2 - 0.1), y: roofY, z: sz * (D / 2 - 0.1) }));
  }
  // miniature shala shrines along the roof edges and a Nandi facing the sanctum
  for (const sx of [-1, 0, 1]) {
    const shr = group(
      box(0.7, 0.35, 0.4, ochre),
      place(barrelRoof({ w: 0.7, d: 0.4, h: 0.3, axis: 'x', material: saffron, endMaterial: mat('#f2c14e') }), { y: 0.35 }),
      place(kalasha(0.8), { y: 0.62 }),
    );
    g.add(place(shr, { x: sx * 1.2, y: roofY, z: D / 2 - 0.3 }));
  }
  g.add(place(nandi(), { y: roofY, z: -0.3, ry: 90 }));
  g.add(place(stairs({ w: 1.3, h: plinth, d: 0.5, steps: 3 }), { z: D / 2 + 0.25 }));
  return g;
}

function vimana() {
  const g = new THREE.Group();
  const W = 2.4, D = 1.9, baseH = 3.0;
  g.add(box(W + 0.2, 0.6, D + 0.2, granite));
  g.add(place(box(W, baseH - 0.6, D, ochre), { y: 0.6 }));
  for (const x of [-W / 2, -W / 4, W / 4, W / 2]) {
    for (const s of [-1, 1]) g.add(place(box(0.14, baseH - 0.6, 0.14, cream), { x, y: 0.6, z: s * D / 2 }));
  }
  g.add(place(box(W + 0.3, 0.2, D + 0.3, cornice), { y: baseH }));
  let y = baseH + 0.2;
  const sizes = [[2.1, 1.7], [1.65, 1.35], [1.2, 1.0]];
  sizes.forEach(([w, d], i) => {
    g.add(place(tierBox(w, 0.75, d, deityTexture((i + 2) % 3), cornice), { y }));
    y += 0.75;
    g.add(place(box(w + 0.2, 0.14, d + 0.2, cornice), { y }));
    y += 0.14;
  });
  // octagonal drum and gold shikhara dome
  g.add(place(cylinder(0.55, 0.6, 0.35, ochre, 8), { y }));
  const domeGeo = new THREE.SphereGeometry(0.7, 8, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  domeGeo.scale(1, 1.15, 1);
  g.add(place(new THREE.Mesh(domeGeo, gold), { y: y + 0.35 }));
  g.add(place(kalasha(2.2), { y: y + 0.35 + 0.78 }));
  return g;
}

/** Stepped temple tank (kalyani) with a small pavilion standing in the water. */
function templeTank(W, D) {
  const g = new THREE.Group();
  const kavi = textured(kaviTexture());
  g.add(parapet({ w: W, d: D, h: 0.9, t: 0.16, material: kavi }));
  const t = 0.2;
  const heights = [0.72, 0.57, 0.42];
  heights.forEach((h, k) => {
    const inset = 0.16 + k * t;
    g.add(parapet({ w: W - 2 * inset, d: D - 2 * inset, h, t, material: k % 2 ? stoneLight : granite }));
  });
  const inner = 0.16 + heights.length * t;
  g.add(box(W - 2 * inner, 0.3, D - 2 * inner, water()));
  // neerazhi mandapam in the middle
  const p = group(
    box(0.9, 0.15, 0.9, granite),
    place(columns({ count: 2, length: 0.6, radius: 0.05, h: 0.9, square: true, material: cream }), { y: 0.15, z: 0.3 }),
    place(columns({ count: 2, length: 0.6, radius: 0.05, h: 0.9, square: true, material: cream }), { y: 0.15, z: -0.3 }),
    place(box(1.0, 0.12, 1.0, cornice), { y: 1.05 }),
    place(tierBox(0.7, 0.35, 0.7, deityTexture(0), cornice), { y: 1.17 }),
    place(cone(0.42, 0.45, saffron, 4), { y: 1.52, ry: 45 }),
    place(kalasha(1.1), { y: 1.9 }),
  );
  g.add(place(p, { y: 0.28 }));
  return g;
}

const FLOWER = ['#f28c18', '#ffd21f', '#e0312b', '#f59ab8', '#ffffff', '#c22a6a'];

/** Flower stall: wooden counter, baskets of blooms, striped awning hung with marigold garlands. */
function flowerStall(color, color2, seed) {
  const g = new THREE.Group();
  const W = 1.6, D = 1.1;
  g.add(place(box(W, 0.85, 0.6, mat(PALETTE.wood)), { z: 0.2 }));
  g.add(place(box(W - 0.05, 0.6, 0.02, mat(color)), { y: 0.12, z: 0.51 }));
  for (const sx of [-1, 1]) for (const z of [-D / 2, D / 2]) {
    g.add(place(box(0.06, 2.0, 0.06, mat(PALETTE.woodDark)), { x: sx * (W / 2 - 0.03), z }));
  }
  g.add(place(box(W, 0.8, 0.05, mat(PALETTE.woodDark)), { y: 0.85, z: -D / 2 }));
  // baskets heaped with flowers
  for (let i = 0; i < 5; i++) {
    const x = -0.6 + i * 0.3;
    const c = FLOWER[(i + seed) % FLOWER.length];
    g.add(place(cylinder(0.13, 0.1, 0.1, mat('#b08a4a'), 8), { x, y: 0.85, z: 0.25 }));
    g.add(place(sphere(0.12, mat(c), 8), { x, y: 0.88, z: 0.25, s: 1 }));
  }
  // awning (origin at its back top edge, sticks out to +z)
  g.add(place(awning({ w: W + 0.2, depth: D + 0.4, drop: 0.25, color, color2 }), { y: 2.1, z: -D / 2 - 0.05 }));
  // hanging marigold garlands along the front
  for (let i = 0; i < 7; i++) {
    const c = i % 2 ? mat('#ffd21f') : mat('#f28c18');
    g.add(place(cylinder(0.045, 0.045, 0.7, c, 6), { x: -0.72 + i * 0.24, y: 1.15, z: D / 2 + 0.1 }));
  }
  // garlands on the back board
  for (let i = 0; i < 4; i++) {
    g.add(place(cylinder(0.04, 0.04, 0.5, mat(FLOWER[(i + seed + 2) % FLOWER.length]), 6), { x: -0.5 + i * 0.33, y: 1.1, z: -D / 2 + 0.06 }));
  }
  return g;
}

/** Brass deepa stambha: tall lamp pillar ringed with oil-lamp discs. */
function lampPillar(h = 3.4) {
  const g = new THREE.Group();
  g.add(box(0.7, 0.3, 0.7, granite));
  g.add(place(cylinder(0.09, 0.14, h, gold, 8), { y: 0.3 }));
  for (let i = 0; i < 6; i++) {
    const r = 0.38 - i * 0.04;
    g.add(place(cylinder(r, r * 0.9, 0.05, gold, 10), { y: 0.9 + i * 0.42 }));
  }
  g.add(place(kalasha(1.4), { y: 0.3 + h }));
  return g;
}

/** Seated Nandi bull, white, for the compound-wall corners. */
function nandi() {
  const m = mat('#f4f1ea');
  return group(
    box(0.5, 0.12, 0.34, granite),
    place(box(0.5, 0.26, 0.26, m), { y: 0.12 }),
    place(box(0.16, 0.2, 0.18, m), { x: 0.3, y: 0.28 }),
    place(box(0.14, 0.12, 0.16, m), { x: -0.05, y: 0.38 }),
    place(box(0.04, 0.1, 0.2, mat('#3a3a3a')), { x: 0.32, y: 0.48 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'paved'));

  // forecourt and approach path
  g.add(place(patch(10, 2.0, 'cobbles'), { y: y0, z: 4.0 }));
  g.add(place(patch(1.4, 2.4, mat('#b8a888')), { x: AX, y: y0 + 0.01, z: 3.8 }));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.02, 1.3).translate(0, 0.01, 0), textured(kolamTexture())), { x: AX, y: y0 + 0.065, z: 4.1 })); // 0..1 UVs, just above the path
  g.add(place(patch(1.6, 3.4, 'grass'), { x: 3.9, y: y0, z: -2.6 }));

  // compound wall with red/white kavi stripes and white coping
  const kavi = textured(kaviTexture());
  const wallH = 1.4, wt = 0.3, E = 5 - wt / 2;
  const wall = (len, alongX) => group(
    alongX ? uvBoxStriped(len, wallH, wt, kavi) : uvBoxStriped(wt, wallH, len, kavi),
    place(box(alongX ? len + 0.06 : wt + 0.1, 0.12, alongX ? wt + 0.1 : len + 0.06, cream), { y: wallH }),
  );
  const zFront = 1.8;
  g.add(place(wall(10, true), { y: y0, z: -E }));
  for (const s of [-1, 1]) g.add(place(wall(zFront + E + wt / 2, false), { x: s * E, y: y0, z: (zFront - E) / 2 }));
  g.add(place(wall(-1.2 + 5, true), { x: (-5 - 1.2) / 2, y: y0, z: zFront }));
  g.add(place(wall(5 - 3.2, true), { x: (5 + 3.2) / 2, y: y0, z: zFront }));
  g.add(place(nandi(), { x: -E, y: y0 + wallH + 0.12, z: -E + 0.25, ry: 90 }));
  g.add(place(nandi(), { x: E, y: y0 + wallH + 0.12, z: -E + 0.25, ry: 90 }));
  g.add(place(nandi(), { x: -E + 0.3, y: y0 + wallH + 0.12, z: zFront, ry: 0 }));
  g.add(place(nandi(), { x: E - 0.3, y: y0 + wallH + 0.12, z: zFront, ry: 180 }));

  // temple on the axis: gopuram, mandapa, vimana
  g.add(place(gopuram(), { x: AX, y: y0, z: zFront }));
  g.add(place(mandapa(), { x: AX, y: y0, z: -1.2 }));
  g.add(place(vimana(), { x: AX, y: y0, z: -3.55 }));

  // temple tank on the left
  g.add(place(templeTank(3.2, 5.7), { x: -2.95, y: y0, z: -1.65 }));

  // gold flagstaff (dhwaja stambha), sacred trees on the right
  g.add(place(box(0.5, 0.4, 0.5, granite), { x: 3.95, y: y0, z: 0.9 }));
  g.add(place(cylinder(0.07, 0.1, 5.2, gold, 8), { x: 3.95, y: y0 + 0.4, z: 0.9 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.5, 0.05, 0.12, gold), { x: 3.95, y: y0 + 4.6 + i * 0.18, z: 0.9 }));
  g.add(place(cylinder(0.75, 0.8, 0.4, granite, 10), { x: 3.85, y: y0, z: -3.5 }));
  g.add(place(tree({ kind: 'round', h: 3.9, seed: 12, color: PALETTE.foliage }), { x: 3.85, y: y0 + 0.4, z: -3.5 }));
  g.add(place(tree({ kind: 'palm', h: 3.9, seed: 4 }), { x: 3.6, y: y0, z: -1.3 }));

  // forecourt: flower stalls, lamp pillar, palm
  g.add(place(flowerStall('#d9302a', '#ffd21f', 0), { x: -3.95, y: y0, z: 3.9 }));
  g.add(place(flowerStall('#2f8f4a', '#ffffff', 3), { x: -2.15, y: y0, z: 3.9 }));
  g.add(place(lampPillar(3.4), { x: 4.1, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 9 }), { x: 4.3, y: y0, z: 2.5 }));
  return g;
}

/** Wall box whose kavi stripes repeat every 0.8 m along its length. */
function uvBoxStriped(w, h, d, material) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const uv = geo.attributes.uv;
  const pos = geo.attributes.position;
  const nrm = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(nrm.getX(i)), nz = Math.abs(nrm.getZ(i));
    const along = nz > 0.5 ? pos.getX(i) : nx > 0.5 ? pos.getZ(i) : pos.getX(i);
    uv.setXY(i, along / 0.8, pos.getY(i) / h);
  }
  return new THREE.Mesh(geo, material);
}


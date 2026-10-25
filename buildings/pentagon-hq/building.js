import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, prismBlock, facadeBlock, box, place, mat, metal, surface, textured,
  extrude, ShapeBuilder, canvasTexture, signTexture, shade,
  columns, flag, tree, car, streetLamp, bench, cylinder, cone, rng, SWATCHES,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (Mall Entrance, flat side of the pentagon) faces +z.
const CZ = -2.9;            // pentagon centre (pushed back to leave room for the front car park)
const R = 6.6;              // outer circumradius
const COS36 = Math.cos(Math.PI / 5);
const FH = 1.65;             // storey height (squat, so the whole thing reads as low)
const FLOORS = 3;
const WALL_H = FH * FLOORS;

// Regular pentagon, flat side towards +z, apex towards -z.
function pent(r, cz = CZ) {
  const pts = [];
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5;
    pts.push([r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return pts;
}

// quad whose winding is fixed so the normal points up/outwards (given an outward hint)
function addQuad(b, pts, hint) {
  const [a, c1, , d] = pts.map((p) => new THREE.Vector3(...p));
  const n = new THREE.Vector3().subVectors(c1, a).cross(new THREE.Vector3().subVectors(d, a));
  if (n.dot(hint) < 0) pts = pts.slice().reverse();
  b.quad(...pts);
}

// Low hipped slate roof on a pentagonal ring: ridge pentagon halfway between the walls.
function ringRoof(rOut, rIn, h, material, ov = 0.06) {
  const b = new ShapeBuilder();
  const o = pent(rOut + ov / COS36), m = pent((rOut + rIn) / 2), i = pent(rIn - ov / COS36);
  const drop = -0.08;
  for (let k = 0; k < 5; k++) {
    const k2 = (k + 1) % 5;
    const mid = [(m[k][0] + m[k2][0]) / 2, (m[k][1] + m[k2][1]) / 2];
    const radial = new THREE.Vector3(mid[0], 0, mid[1] - CZ).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    addQuad(b, [[o[k][0], drop, o[k][1]], [o[k2][0], drop, o[k2][1]], [m[k2][0], h, m[k2][1]], [m[k][0], h, m[k][1]]], radial.clone().add(up));
    addQuad(b, [[i[k][0], drop, i[k][1]], [i[k2][0], drop, i[k2][1]], [m[k2][0], h, m[k2][1]], [m[k][0], h, m[k][1]]], radial.clone().negate().add(up));
    // fascia under the eaves so the overhang is not see-through from below
  }
  return new THREE.Mesh(b.build(), material);
}

// One office ring = five trapezoidal facade blocks.
function ring(rOut, rIn, facadeOpts) {
  const g = new THREE.Group();
  const o = pent(rOut), i = pent(rIn);
  for (let k = 0; k < 5; k++) {
    const k2 = (k + 1) % 5;
    g.add(prismBlock({ points: [o[k], o[k2], i[k2], i[k]], ...facadeOpts, seed: (facadeOpts.seed ?? 1) + k }));
  }
  return g;
}

// Plain pentagonal band (cornices, plinths).
function band(rOut, rIn, h, material) {
  const g = new THREE.Group();
  const o = pent(rOut), i = pent(rIn);
  for (let k = 0; k < 5; k++) {
    const k2 = (k + 1) % 5;
    g.add(extrude([o[k], o[k2], i[k2], i[k]], h, material));
  }
  return g;
}

// Sign with 0..1 UVs so the text fills the face (the lib sign() shrinks text on wide boards).
function board(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', border = null, tw = 512, th = 96 } = {}) {
  const geo = new THREE.BoxGeometry(w, h, 0.08).translate(0, h / 2, 0);
  const face = textured(signTexture(text, { bg, fg, width: tw, height: th, border }));
  const edge = mat(bg);
  return new THREE.Mesh(geo, [edge, edge, edge, edge, face, edge]);
}

// Nose-in car park: asphalt, stall lines along one or both long edges, cars facing the aisle.
// Lies along X (w), depth d along Z. sides: 'back' | 'front' | 'both'.
function carPark({ w, d, sides = 'both', seed = 1, fill = 0.75, stall = 1.55, carScale = 0.58 }) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.add(box(w, 0.05, d, surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 })));
  const lineM = mat(PALETTE.roadLine);
  const depth = 2.7;
  const n = Math.floor((w - 0.2) / stall);
  const rows = sides === 'both' ? [-1, 1] : sides === 'back' ? [-1] : [1];
  for (const s of rows) {
    const zc = s * (d / 2 - depth / 2 - 0.05);
    for (let i = 0; i <= n; i++) {
      const x = -(n * stall) / 2 + i * stall;
      g.add(place(box(0.07, 0.02, depth, lineM), { x, y: 0.05, z: zc }));
      if (i < n && r.chance(fill)) {
        const c = car({ color: r.pick(SWATCHES.cars), kind: r.chance(0.12) ? 'van' : 'car' });
        g.add(place(c, { x: x + stall / 2, y: 0.05, z: zc + s * 0.1, ry: s > 0 ? 90 : -90, s: carScale }));
      }
    }
  }
  return g;
}

// Ground-level helipad with a full-size H (canvas texture on 0..1 UVs).
function helipadPad(size) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#4a4d52';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.4, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W * 0.33, H * 0.28, W * 0.09, H * 0.44);
    ctx.fillRect(W * 0.58, H * 0.28, W * 0.09, H * 0.44);
    ctx.fillRect(W * 0.33, H * 0.455, W * 0.34, H * 0.09);
    ctx.strokeStyle = '#e8c547';
    ctx.lineWidth = 4;
    ctx.strokeRect(3, 3, W - 6, H - 6);
  }, { key: 'pentagon-hq:helipad' });
  const geo = new THREE.BoxGeometry(size, 0.08, size).translate(0, 0.04, 0);
  const side = mat('#4a4d52');
  return new THREE.Mesh(geo, [side, side, textured(tex), side, side, side]);
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  const limestone = '#ddd5c0';
  const facadeOpts = {
    style: 'punched', wall: limestone, frame: PALETTE.white, glass: PALETTE.window,
    windowW: 0.55, windowH: 0.5, bay: 0.95, floorHeight: FH, floors: FLOORS, lit: 0.12,
    roof: PALETTE.roofSlate, seed: 3,
  };
  const slate = mat(PALETTE.roofSlate, { roughness: 0.85 });

  // paved apron around the building + front plaza
  g.add(place(extrude(pent(R + 0.6), 0.04, mat(PALETTE.pavement)), { y: y0 }));
  g.add(place(patch(9, 2.4, 'paved'), { y: y0, z: 3.4 }));

  // light-well floors (gravel) and the courtyard lawn
  g.add(place(extrude(pent(5.8), 0.05, mat(PALETTE.gravel)), { y: y0 }));
  g.add(place(extrude(pent(2.5), 0.07, surface('grass', PALETTE.grass, { size: 3 })), { y: y0 }));

  // rings: E (outer), C (middle), A (inner) with light wells between
  const rings = [[R, 5.7], [4.8, 3.95], [3.1, 2.4]];
  rings.forEach(([ro, ri], n) => {
    g.add(place(ring(ro, ri, { ...facadeOpts, seed: 10 + n * 7 }), { y: y0 }));
    g.add(place(ringRoof(ro, ri, 0.45, slate), { y: y0 + WALL_H }));
  });

  // white cornice and a darker stone plinth round the outer ring
  g.add(place(band(R + 0.1, R - 0.3, 0.22, mat(PALETTE.white)), { y: y0 + WALL_H - 0.22 }));
  g.add(place(band(R + 0.06, R - 0.3, 0.4, mat('#b9b09a')), { y: y0 }));

  // ten radial corridors crossing the light wells (at the corners and mid-sides)
  const corrOpts = { ...facadeOpts, floors: 2, floorHeight: 1.4, bay: 0.9, roof: PALETTE.concrete, seed: 40 };
  for (let k = 0; k < 10; k++) {
    const a = -Math.PI / 2 + (k * Math.PI) / 5;
    const scale = k % 2 === 0 ? 1 : COS36; // distance to the ring walls along this ray
    const r0 = 2.9 * scale, r1 = 5.9 * scale;
    const rm = (r0 + r1) / 2;
    const ry = 90 - THREE.MathUtils.radToDeg(a);
    g.add(place(facadeBlock({ w: 0.9, d: r1 - r0, ...corrOpts, blank: ['front', 'back'] }), {
      x: rm * Math.cos(a), y: y0, z: CZ + rm * Math.sin(a), ry,
    }));
  }

  // courtyard: paths, gazebo snack bar in the middle, ring of trees
  const cz = CZ;
  for (let k = 0; k < 5; k++) {
    const a = -Math.PI / 2 + (k * 2 * Math.PI) / 5 + Math.PI / 5;
    g.add(place(box(0.5, 0.03, 1.7, mat(PALETTE.paving)), { x: 1.15 * Math.cos(a), y: y0 + 0.07, z: cz + 1.15 * Math.sin(a), ry: 90 - THREE.MathUtils.radToDeg(a) }));
    const at = a + Math.PI / 5;
    g.add(place(tree({ kind: 'round', h: 1.9, seed: 70 + k }), { x: 1.3 * Math.cos(at), y: y0 + 0.07, z: cz + 1.3 * Math.sin(at) }));
  }
  g.add(place(cylinder(0.75, 0.75, 0.08, mat(PALETTE.paving), 10), { y: y0 + 0.07, z: cz }));
  g.add(place(cylinder(0.5, 0.5, 0.8, mat(PALETTE.white), 8), { y: y0 + 0.1, z: cz }));
  g.add(place(cone(0.7, 0.55, mat(PALETTE.roofRed), 8), { y: y0 + 0.9, z: cz }));

  // Mall Entrance portico on the front face
  const fz = CZ + R * COS36;               // front wall plane
  const stone = mat('#e6dfcc');
  g.add(place(box(4.6, WALL_H - 0.6, 1.4, stone), { y: y0, z: fz + 0.55 }));
  g.add(place(box(4.8, 0.55, 1.6, mat(PALETTE.white)), { y: y0 + WALL_H - 0.6, z: fz + 0.6 }));
  g.add(place(columns({ count: 6, length: 4.0, radius: 0.16, h: WALL_H - 0.6, material: PALETTE.white, square: true }), { y: y0, z: fz + 1.25 }));
  g.add(place(box(3.4, 2.0, 0.06, mat(PALETTE.glassDark, { roughness: 0.3 })), { y: y0 + 0.2, z: fz + 1.26 }));
  g.add(place(box(5.2, 0.15, 2.0, mat(PALETTE.concrete)), { y: y0, z: fz + 0.8 }));
  g.add(place(board('THE PENTAGON', 3.6, 0.42, { bg: PALETTE.white, fg: '#2b2f3a', tw: 512, th: 64 }), { y: y0 + WALL_H - 0.53, z: fz + 1.41 }));

  // flagpoles on the plaza
  for (const [x, c] of [[-3.6, PALETTE.red], [-2.8, PALETTE.navy], [2.8, PALETTE.navy], [3.6, PALETTE.red]]) {
    g.add(place(cylinder(0.25, 0.25, 0.15, mat(PALETTE.concrete), 8), { x, y: y0, z: fz + 2.35 }));
    g.add(place(flag({ h: 4.6, color: c, color2: PALETTE.white }), { x, y: y0 + 0.15, z: fz + 2.35, s: 0.75 }));
  }

  // front car park, split by the entrance drive
  const fpZ = 7.6, fpD = 4.6;
  g.add(place(carPark({ w: 8.2, d: fpD, sides: 'front', seed: 5 }), { x: -5.7, y: y0, z: fpZ }));
  g.add(place(carPark({ w: 8.2, d: fpD, sides: 'front', seed: 6 }), { x: 5.7, y: y0, z: fpZ }));
  g.add(place(box(3.2, 0.05, fpD + 0.3, surface('asphalt', PALETTE.asphalt, { size: 4 })), { y: y0, z: fpZ + 0.15 }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.12, 0.02, 0.8, mat(PALETTE.roadLine)), { y: y0 + 0.05, z: 6.0 + i * 1.2 }));
  // monument sign at the drive
  g.add(place(box(2.4, 0.5, 0.5, mat(PALETTE.stoneDark)), { x: -2.9, y: y0, z: 5.15 }));
  g.add(place(board('PENTAGON', 2.2, 0.55, { bg: '#1f2a44', fg: '#f3e6b0', border: '#c8a659', tw: 256, th: 64 }), { x: -2.9, y: y0 + 0.5, z: 5.2 }));

  // side car parks (cars along x)
  for (const s of [-1, 1]) {
    g.add(place(carPark({ w: 9.4, d: 3.6, sides: 'front', seed: 20 + s, fill: 0.8 }), { x: s * 8.05, y: y0, z: 0.3, ry: s * 90 }));
  }

  // back corners: heliport (west) and a staff car park (east)
  g.add(place(helipadPad(3.6), { x: -7.7, y: y0, z: -7.7 }));
  for (const [x, z] of [[-9.6, -5.6], [-5.8, -9.6]]) g.add(place(cylinder(0.08, 0.08, 0.35, mat(PALETTE.orange), 6), { x, y: y0, z }));
  g.add(place(carPark({ w: 3.9, d: 4.0, sides: 'front', seed: 31, fill: 0.9 }), { x: 7.8, y: y0, z: -7.85, ry: 90 }));

  // trees, lamps and benches
  const trees = [[-8.9, 5.0], [8.9, 5.0], [-4.6, -8.8], [4.6, -8.9], [-8.9, -4.6], [8.9, -5.0], [-1.4, 5.1], [1.4, 5.1]];
  trees.forEach(([x, z], i) => g.add(place(tree({ kind: i < 6 ? 'round' : 'bush', h: i < 6 ? 3.4 : 1.2, seed: 90 + i }), { x, y: y0, z })));
  for (const s of [-1, 1]) {
    g.add(place(streetLamp({ h: 3.2 }), { x: s * 1.9, y: y0, z: 9.6, ry: s > 0 ? 180 : 0 }));
    g.add(place(bench({ w: 1.2 }), { x: s * 4.4, y: y0, z: fz + 1.6, ry: 180 }));
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, FLOOR,
  ShapeBuilder, polygonArea, lot, patch, box, cylinder, sphere, place, group, beam,
  mat, metal, glass, water, facade, canvasTexture, textured, tree, hedge, bench, streetLamp,
} from '../../src/lib/index.js';

// ---------------------------------------------------------------------------
// local helpers: angular volumes with sloped tops and slanted window slits

const ccw = (pts) => (polygonArea(pts) < 0 ? pts.slice().reverse() : pts.slice());

/**
 * Vertical prism over a polygon whose top (and optionally bottom) is a sloped
 * plane: top(x, z) / bottom(x, z) give heights. Groups: 0 walls, 1 top, 2 bottom.
 */
function slab(points, top, bottom = () => 0) {
  const pts = ccw(points);
  const b = new ShapeBuilder();
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    b.quad([x1, bottom(x1, z1), z1], [x2, bottom(x2, z2), z2], [x2, top(x2, z2), z2], [x1, top(x1, z1), z1], 0);
  }
  const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, -z)), []);
  for (const [i, j, k] of tris) {
    const A = pts[i], B = pts[j], C = pts[k];
    const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const up = cross < 0 ? [A, B, C] : [A, C, B];
    const down = cross < 0 ? [A, C, B] : [A, B, C];
    b.tri(...up.map(([x, z]) => [x, top(x, z), z]), 1);
    b.tri(...down.map(([x, z]) => [x, bottom(x, z), z]), 2);
  }
  return b.build();
}

function slabMesh(points, top, bottom, wallM, topM, bottomM) {
  return new THREE.Mesh(slab(points, top, bottom), [wallM, topM ?? wallM, bottomM ?? wallM]);
}

/** Rescale metre UVs on the wall group so a facade() material shows one cell per bay x storey. */
function facadeUV(geom, fm, bay, floorH = FLOOR) {
  const { cols, rows } = fm.userData;
  const uv = geom.attributes.uv;
  const g0 = geom.groups.find((g) => g.materialIndex === 0);
  for (let i = g0.start; i < g0.start + g0.count; i++) uv.setXY(i, uv.getX(i) / (bay * cols), uv.getY(i) / (floorH * rows));
  return geom;
}

/**
 * Collects thin quads stuck onto the walls of a ccw polygon: window slits,
 * banners. Edge i runs pts[i] -> pts[i+1]; t0/t1 = fractions along the edge,
 * y0/y1 = bottom/top heights at t0 and at t1 (pairs), so slits can slope.
 */
class WallDecals {
  constructor(points, off = 0.06) {
    this.pts = ccw(points);
    this.off = off;
    this.b = new ShapeBuilder();
  }
  add(edge, t0, t1, [a0, a1], [b0, b1] = [a0, a1], group = 0) {
    const [x1, z1] = this.pts[edge % this.pts.length];
    const [x2, z2] = this.pts[(edge + 1) % this.pts.length];
    const dx = x2 - x1, dz = z2 - z1, len = Math.hypot(dx, dz);
    const nx = (-dz / len) * this.off, nz = (dx / len) * this.off;
    const P = (t, y) => [x1 + dx * t + nx, y, z1 + dz * t + nz];
    this.b.quad(P(t0, a0), P(t1, b0), P(t1, b1), P(t0, a1), group);
    return this;
  }
  mesh(materials) {
    return new THREE.Mesh(this.b.build(), materials);
  }
}

/**
 * Name plate facing +z. Built on a PlaneGeometry (0..1 UVs) so the text spans
 * the whole plate; the lib sign() maps its texture in metres.
 */
function museumSign(w, h) {
  const tex = canvasTexture(1024, Math.round(1024 * h / w), (ctx, W, H) => {
    ctx.fillStyle = '#1d1d1d';
    ctx.fillRect(0, 0, W, H);
    const cols = [PALETTE.red, PALETTE.yellow, PALETTE.blue];
    cols.forEach((c, i) => { ctx.fillStyle = c; ctx.fillRect(H * 0.25 + i * H * 0.22, H * 0.2, H * 0.16, H * 0.6); });
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(H * 0.5)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MODERN ART MUSEUM', W / 2 + H * 0.45, H * 0.53);
  }, { key: 'art-museum:sign', repeat: false });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, 0.035);
  return group(box(w, h, 0.06, mat('#1d1d1d')), face);
}

// ---------------------------------------------------------------------------

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'paved'));

  const white = mat(PALETTE.white);
  const whiteRoof = mat(PALETTE.offWhite);
  const underside = mat(PALETTE.concrete);
  const slit = glass(PALETTE.glassDark);
  const atriumGlass = facade({ style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelLight, lit: 0, seed: 44 });
  const roofGlass = glass(PALETTE.glassSky);

  const lift = (f) => (x, z) => y0 + f(x, z);
  const ground = () => y0;

  // ---- west gallery: long white wedge rising to a prow over the plaza
  const westPts = [[-9.4, -9.4], [-3.6, -9.4], [-2.6, 1.2], [-9.4, 3.2]];
  const westTop = (x, z) => 6.2 + 0.3 * (z + 9.4) - 0.08 * (x + 9.4);
  g.add(slabMesh(westPts, lift(westTop), ground, white, whiteRoof));
  // skylight strip on its roof
  const west = new WallDecals(westPts);
  // ccw order after normalisation: find edges by testing; decals on front (+z) and west faces
  const wp = west.pts;
  const edgeOf = (pts, test) => pts.findIndex((p, i) => test(p, pts[(i + 1) % pts.length]));
  const wFront = edgeOf(wp, (a, b) => a[1] > 0 && b[1] > 0);
  const wWest = edgeOf(wp, (a, b) => a[0] < -9 && b[0] < -9);
  const wEast = edgeOf(wp, (a, b) => a[0] > -4 && b[0] > -4);
  // diagonal slits on the front prow
  west.add(wFront, 0.12, 0.88, [1.2, 2.0], [4.6, 5.4]);
  west.add(wFront, 0.3, 0.8, [6.2, 6.8], [7.6, 8.2]);
  // slanted ribbons along the long west wall
  west.add(wWest, 0.08, 0.9, [5.6, 6.3], [2.4, 3.1]);
  west.add(wWest, 0.2, 0.7, [1.3, 1.8], [1.3, 1.8]);
  west.add(wEast, 0.05, 0.6, [3.4, 4.0], [5.2, 5.8]);
  const wBack = edgeOf(wp, (a, b) => a[1] < -9 && b[1] < -9);
  west.add(wBack, 0.15, 0.85, [2.0, 2.6], [4.2, 4.8]);
  west.add(wBack, 0.15, 0.4, [0, 2.4], [0, 2.4]); // service door
  g.add(place(west.mesh(slit), { y: y0 }));

  // ---- east tower: tall leaning shard at the back right
  const eastPts = [[-1.0, -9.4], [6.2, -9.4], [6.2, -4.4], [0.2, -1.6]];
  const eastTop = (x, z) => 14.5 - 0.6 * (x + 1) - 0.12 * (z + 9.4);
  g.add(slabMesh(eastPts, lift(eastTop), ground, white, whiteRoof));
  const east = new WallDecals(eastPts);
  const ep = east.pts;
  const eFront = edgeOf(ep, (a, b) => Math.min(a[1], b[1]) > -5 && Math.abs(a[0] - b[0]) > 3);
  const eSide = edgeOf(ep, (a, b) => a[0] > 6 && b[0] > 6);
  east.add(eFront, 0.1, 0.92, [8.0, 8.6], [4.2, 4.8]);
  east.add(eFront, 0.35, 0.95, [10.6, 11.0], [7.4, 7.8]);
  east.add(eSide, 0.1, 0.9, [6.6, 7.2], [6.6, 7.2]);
  east.add(eSide, 0.3, 0.7, [2.0, 3.0], [2.0, 3.0]);
  const eBack = edgeOf(ep, (a, b) => a[1] < -9 && b[1] < -9);
  const eWest = edgeOf(ep, (a, b) => a[0] < 0.5 && b[0] < 0.5);
  east.add(eBack, 0.1, 0.9, [3.0, 3.6], [6.8, 7.4]);
  east.add(eBack, 0.3, 0.95, [9.6, 10.0], [7.0, 7.4]);
  east.add(eWest, 0.2, 0.85, [9.0, 9.6], [12.2, 12.8]);
  g.add(place(east.mesh(slit), { y: y0 }));

  // ---- cantilevered white box floating over the garden entrance
  const cantPts = [[1.6, -4.2], [8.8, -6.2], [9.4, -1.0], [2.6, 0.4]];
  const cantBot = (x, z) => y0 + 5.4 + 0.05 * x;
  const cantTop = (x, z) => y0 + 8.6 + 0.12 * x;
  g.add(slabMesh(cantPts, cantTop, cantBot, white, whiteRoof, underside));
  const cant = new WallDecals(cantPts);
  const cp = cant.pts;
  const cFront = edgeOf(cp, (a, b) => a[1] > -1.1 && b[1] > -1.1);
  const cEnd = edgeOf(cp, (a, b) => a[0] > 8.7 && b[0] > 8.7);
  cant.add(cFront, 0.05, 0.95, [6.3, 7.5], [6.6, 8.0]);
  cant.add(cEnd, 0.1, 0.9, [6.4, 7.8], [6.4, 7.8]);
  g.add(cant.mesh(slit));
  // two slender raking columns under the cantilever tip
  const colM = metal(PALETTE.steelLight);
  g.add(beam([8.4, y0, -3.2], [8.0, cantBot(8.0, -2.2) + 0.1, -2.2], 0.3, colM));
  g.add(beam([5.0, y0, -2.0], [5.6, cantBot(5.6, -1.5) + 0.1, -1.5], 0.3, colM));

  // ---- glass atrium: faceted wedge between the wings, opening onto the plaza
  const atrPts = [[-3.4, -7.2], [0.6, -7.2], [3.4, 2.4], [-2.8, 3.8]];
  const atrTop = (x, z) => 4.6 + 0.32 * (z + 7.2) + 0.05 * x;
  const atrGeom = facadeUV(slab(atrPts, lift(atrTop), ground), atriumGlass, 2.2);
  g.add(new THREE.Mesh(atrGeom, [atriumGlass, roofGlass, underside]));
  // steel roof ribs + ridge frame
  const ap = ccw(atrPts);
  const rib = metal(PALETTE.steelLight);
  for (let i = 0; i < ap.length; i++) {
    const [x1, z1] = ap[i], [x2, z2] = ap[(i + 1) % ap.length];
    g.add(beam([x1, y0 + atrTop(x1, z1) + 0.05, z1], [x2, y0 + atrTop(x2, z2) + 0.05, z2], 0.22, rib));
  }
  for (let t = 0.2; t < 0.95; t += 0.2) {
    const xa = -3.4 + (-2.8 + 3.4) * t, za = -7.2 + (3.8 + 7.2) * t;
    const xb = 0.6 + (3.4 - 0.6) * t, zb = -7.2 + (2.4 + 7.2) * t;
    g.add(beam([xa, y0 + atrTop(xa, za) + 0.05, za], [xb, y0 + atrTop(xb, zb) + 0.05, zb], 0.14, rib));
  }
  // entrance: dark doors + thin white canopy blade
  const ax = 0.3, az = 3.1; // midpoint of the atrium's front face
  const frontAngle = (Math.atan2(2.4 - 3.8, 3.4 + 2.8) * 180) / Math.PI; // face direction
  g.add(place(box(3.2, 2.4, 0.15, glass(PALETTE.glassDark)), { x: ax, y: y0, z: az + 0.08, ry: -frontAngle }));
  g.add(place(box(5.6, 0.25, 2.4, white), { x: ax + 0.2, y: y0 + 3.0, z: az + 1.0, ry: -frontAngle }));

  // ---- roof details: skylights on the west wing, plant box on the tower
  for (const [x, z] of [[-6.8, -6.5], [-6.8, -3.5], [-6.8, -0.5]]) {
    g.add(place(box(3.4, 0.5, 1.6, roofGlass), { x, y: y0 + westTop(x, z) - 0.25, z }));
  }
  g.add(place(box(1.6, 0.9, 1.4, mat(PALETTE.lightGrey)), { x: 4.4, y: y0 + eastTop(4.4, -8.0) - 0.4, z: -8.0 }));

  // ---- museum banners on the west prow wall (red / yellow / blue)
  const banners = new WallDecals(westPts, 0.1);
  const bp = banners.pts;
  const bWest = edgeOf(bp, (a, b) => a[0] < -9 && b[0] < -9);
  // the front prow is the most visible spot: three tall banners
  const bannerCols = [PALETTE.red, PALETTE.yellow, PALETTE.blue];
  bannerCols.forEach((c, i) => {
    const t = 0.62 + i * 0.1;
    banners.add(bWest, t, t + 0.06, [2.4, 6.0], [2.4, 6.0], i);
  });
  g.add(place(banners.mesh(bannerCols.map((c) => mat(c))), { y: y0 }));

  // ---- plaza in front: stone paving, reflecting pool, sign wall, red sculpture
  g.add(place(patch(19.6, 5.4, 'cobbles'), { x: 0, y: y0, z: 7.0 }));
  // reflecting pool
  g.add(place(box(6.4, 0.3, 2.6, mat(PALETTE.lightGrey)), { x: -5.6, y: y0, z: 6.4 }));
  g.add(place(box(6.0, 0.32, 2.2, water(PALETTE.water)), { x: -5.6, y: y0, z: 6.4 }));
  // sign wall
  g.add(place(box(7.4, 1.5, 0.5, white), { x: 4.6, y: y0, z: 8.9 }));
  g.add(place(museumSign(7.0, 1.0), { x: 4.6, y: y0 + 0.3, z: 9.16 }));
  // big red stabile: three crossed plates on the plaza
  const red = mat(PALETTE.red);
  const sx = -1.2, sz = 7.6;
  g.add(place(box(0.25, 4.2, 2.2, red), { x: sx, y: y0, z: sz, ry: 30, rz: 14 }));
  g.add(place(box(0.25, 3.4, 2.0, red), { x: sx + 0.4, y: y0, z: sz, ry: -40, rz: -18 }));
  g.add(place(box(2.6, 0.25, 0.25, red), { x: sx + 0.2, y: y0 + 3.4, z: sz, rz: 25 }));
  // benches + lamps + planters
  g.add(place(bench({ w: 1.8 }), { x: -5.6, y: y0, z: 8.6, ry: 180 }));
  g.add(place(bench({ w: 1.8 }), { x: 1.8, y: y0, z: 5.6 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -3.2, y: y0, z: 9.4 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 9.3, y: y0, z: 9.3, ry: 180 }));
  for (const [x, z] of [[-8.5, 8.5], [8.3, 6.0]]) {
    g.add(place(box(1.4, 0.5, 1.4, white), { x, y: y0, z }));
    g.add(place(tree({ kind: 'round', h: 4.6, seed: Math.round(x * 7) + 50 }), { x, y: y0 + 0.5, z }));
  }

  // ---- sculpture garden on the east side, behind a low hedge
  g.add(place(patch(4.0, 5.6, 'grass'), { x: 7.9, y: y0, z: -6.9 }));
  g.add(place(patch(5.6, 4.2, 'grass'), { x: 7.1, y: y0, z: 1.8 }));
  g.add(place(patch(1.2, 8.0, 'gravel'), { x: 5.4, y: y0, z: -1.8 }));
  g.add(place(hedge({ w: 5.4, h: 0.8, d: 0.5 }), { x: 7.1, y: y0, z: 4.0 }));
  g.add(place(hedge({ w: 13.4, h: 0.8, d: 0.5 }), { x: 9.65, y: y0, z: -2.7, ry: 90 }));
  const plinth = mat(PALETTE.lightGrey);
  // bronze sphere
  g.add(place(box(1.2, 0.9, 1.2, plinth), { x: 7.6, y: y0, z: 1.6 }));
  g.add(place(sphere(0.75, metal(PALETTE.glassGold, { roughness: 0.3 }), 14), { x: 7.6, y: y0 + 0.9, z: 1.6 }));
  // blue ring
  g.add(place(box(1.0, 0.4, 0.8, plinth), { x: 5.4, y: y0, z: 1.8 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.9, 0.18, 6, 16), mat(PALETTE.blue));
  g.add(place(ring, { x: 5.4, y: y0 + 1.3, z: 1.8, ry: 35 }));
  // stacked yellow cubes
  g.add(place(group(
    box(1.2, 1.2, 1.2, mat(PALETTE.yellow)),
    place(box(0.9, 0.9, 0.9, mat(PALETTE.orange)), { y: 1.2, ry: 30 }),
    place(box(0.6, 0.6, 0.6, mat(PALETTE.yellow)), { y: 2.1, ry: 60 }),
  ), { x: 8.0, y: y0, z: -6.6, ry: 10 }));
  // tall steel needle
  g.add(place(cylinder(0.05, 0.28, 5.5, metal(PALETTE.chrome, { roughness: 0.2 }), 6), { x: 7.2, y: y0, z: -8.6 }));
  // garden trees
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 81 }), { x: 9.0, y: y0, z: -9.0 }));
  g.add(place(tree({ kind: 'round', h: 5.0, seed: 82 }), { x: 8.4, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 83 }), { x: 9.0, y: y0, z: 3.0 }));
  g.add(place(bench({ w: 1.4 }), { x: 6.8, y: y0, z: -4.6, ry: 90 }));

  return g;
}

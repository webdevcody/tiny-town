// Local rail helpers for the roundhouse: ballasted track, steam locomotives,
// tenders and a coal wagon. Everything runs along local +X from the origin
// (track) or is centred on it (rolling stock); rail top is at RAIL_TOP.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, box, place, mat, metal, surface, sphere } from '../../src/lib/index.js';

export const GAUGE = 1.1;
export const BALLAST_H = 0.12;
export const RAIL_TOP = BALLAST_H + 0.08 + 0.12;

/** Straight track along +X from 0 to len: ballast, sleepers, two rails. */
export function track(len, { ballast = true } = {}) {
  const g = new THREE.Group();
  const by = ballast ? BALLAST_H : 0;
  if (ballast) g.add(place(box(len, BALLAST_H, 2.0, surface('gravel', PALETTE.stoneDark, { size: 2 })), { x: len / 2 }));
  const geos = [];
  const n = Math.max(1, Math.floor(len / 0.6));
  for (let i = 0; i < n; i++) {
    geos.push(new THREE.BoxGeometry(0.24, 0.08, 1.7).translate((i + 0.5) * (len / n), by + 0.04, 0));
  }
  g.add(new THREE.Mesh(mergeGeometries(geos), mat(PALETTE.woodDark)));
  const railM = metal(PALETTE.steelLight, { roughness: 0.35 });
  for (const s of [-1, 1]) g.add(place(box(len, 0.12, 0.09, railM), { x: len / 2, y: by + 0.08, z: (s * GAUGE) / 2 }));
  return g;
}

function cyl(r, len, material, axis = 'x', segments = 14) {
  const geo = new THREE.CylinderGeometry(r, r, len, segments);
  if (axis === 'x') geo.rotateZ(Math.PI / 2);
  else if (axis === 'z') geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

function wheelSet(g, x, r, wheelM) {
  for (const s of [-1, 1]) g.add(place(cyl(r, 0.14, wheelM, 'z', 14), { x, y: RAIL_TOP + r, z: s * (GAUGE / 2 + 0.08) }));
}

/**
 * Steam locomotive, smokebox (front) towards +X, centred on the origin, wheels on RAIL_TOP.
 *   steamLoco({ color, tankEngine, smoke })  ~4.8 m long (tank) / ~4.4 m + tender
 */
export function steamLoco({ color = PALETTE.green, tankEngine = true, lining = PALETTE.yellow, wheel = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.25 });
  const black = mat(PALETTE.black, { roughness: 0.55 });
  const wheelM = mat(wheel, { roughness: 0.5 });
  const brass = metal(PALETTE.glassGold, { roughness: 0.3 });
  const y0 = RAIL_TOP;
  const len = tankEngine ? 4.8 : 4.4;
  const half = len / 2;

  // frames, running plate, buffer beams
  g.add(place(box(len - 0.3, 0.35, 1.2, black), { y: y0 + 0.35 }));
  g.add(place(box(len, 0.1, 1.75, black), { y: y0 + 0.8 }));
  const beam = mat(PALETTE.red);
  for (const s of [-1, 1]) {
    g.add(place(box(0.14, 0.4, 1.75, beam), { x: s * (half - 0.07), y: y0 + 0.45 }));
    for (const z of [-0.55, 0.55]) g.add(place(cyl(0.1, 0.25, black, 'x', 8), { x: s * (half + 0.12), y: y0 + 0.65, z }));
  }
  // driving wheels + leading pony wheels + coupling rod
  for (const x of [-1.1, -0.05, 1.0]) wheelSet(g, x - (tankEngine ? 0.2 : 0), 0.42, wheelM);
  wheelSet(g, half - 0.45, 0.24, wheelM);
  if (tankEngine) wheelSet(g, -half + 0.45, 0.24, wheelM);
  for (const s of [-1, 1]) g.add(place(box(2.2, 0.08, 0.05, metal(PALETTE.steelLight)), { x: -0.15, y: y0 + 0.4, z: s * (GAUGE / 2 + 0.17) }));
  // cylinders
  for (const s of [-1, 1]) g.add(place(cyl(0.24, 0.8, black, 'x', 10), { x: half - 0.75, y: y0 + 0.65, z: s * 0.72 }));

  // boiler, smokebox, chimney, dome, safety valve
  const by = y0 + 0.9 + 0.6;
  const boilerLen = tankEngine ? 2.7 : 2.9;
  const bx = half - 0.5 - boilerLen / 2;
  g.add(place(cyl(0.6, boilerLen, body, 'x', 16), { x: bx, y: by }));
  for (const f of [0.25, 0.6]) g.add(place(cyl(0.615, 0.06, mat(lining), 'x', 16), { x: bx + boilerLen * (f - 0.5), y: by }));
  g.add(place(cyl(0.63, 0.55, black, 'x', 16), { x: half - 0.35, y: by }));
  g.add(place(cyl(0.5, 0.05, mat(PALETTE.darkGrey), 'x', 16), { x: half - 0.05, y: by }));
  g.add(place(cyl(0.16, 0.55, black, 'y', 10), { x: half - 0.4, y: by + 0.75 }));
  g.add(place(cyl(0.22, 0.08, black, 'y', 10), { x: half - 0.4, y: by + 1.03 }));
  g.add(place(sphere(0.28, brass, 10), { x: bx + 0.15, y: by + 0.25 }));
  g.add(place(cyl(0.1, 0.2, brass, 'y', 8), { x: bx - 0.75, y: by + 0.68 }));
  // headlamp
  g.add(place(box(0.14, 0.2, 0.2, mat(PALETTE.white)), { x: half - 0.05, y: y0 + 0.9, z: 0 }));

  // side tanks (tank engine) or splashers
  if (tankEngine) {
    for (const s of [-1, 1]) {
      g.add(place(box(1.9, 0.95, 0.38, body), { x: bx - 0.05, y: y0 + 0.9, z: s * 0.68 }));
      g.add(place(box(1.92, 0.07, 0.4, mat(lining)), { x: bx - 0.05, y: y0 + 1.5, z: s * 0.68 }));
    }
  }

  // cab with roof and windows, coal bunker on tank engines
  const cabX = -half + (tankEngine ? 1.35 : 0.65);
  g.add(place(box(1.1, 1.55, 1.75, body), { x: cabX, y: y0 + 0.9 }));
  g.add(place(box(1.4, 0.1, 1.95, black), { x: cabX, y: y0 + 2.45 }));
  const win = mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 });
  for (const s of [-1, 1]) g.add(place(box(0.45, 0.5, 0.04, win), { x: cabX + 0.15, y: y0 + 1.8, z: s * 0.88 }));
  for (const z of [-0.45, 0.45]) g.add(place(box(0.04, 0.35, 0.4, win), { x: cabX + 0.56, y: y0 + 1.95, z }));
  if (tankEngine) {
    g.add(place(box(0.65, 1.1, 1.7, body), { x: -half + 0.42, y: y0 + 0.9 }));
    g.add(place(box(0.55, 0.15, 1.5, mat('#1c1c1e', { roughness: 1 })), { x: -half + 0.42, y: y0 + 2.0 }));
  }
  return g;
}

/** Tender, centred on the origin, coupling to a loco on its +X side. ~3 m long. */
export function tender({ color = PALETTE.green, lining = PALETTE.yellow, wheel = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.25 });
  const black = mat(PALETTE.black, { roughness: 0.55 });
  const y0 = RAIL_TOP;
  g.add(place(box(2.9, 0.35, 1.2, black), { y: y0 + 0.3 }));
  g.add(place(box(3.0, 0.1, 1.7, black), { y: y0 + 0.75 }));
  for (const x of [-0.9, 0, 0.9]) wheelSet(g, x, 0.3, mat(wheel, { roughness: 0.5 }));
  g.add(place(box(2.8, 1.2, 1.65, body), { y: y0 + 0.85 }));
  g.add(place(box(2.82, 0.07, 1.67, mat(lining)), { y: y0 + 1.75 }));
  g.add(place(box(2.2, 0.35, 1.4, mat('#1c1c1e', { roughness: 1 })), { x: 0.2, y: y0 + 2.05 }));
  g.add(place(box(0.14, 0.4, 1.7, mat(PALETTE.red)), { x: -1.5, y: y0 + 0.4 }));
  return g;
}

/** Open coal wagon, centred on the origin. ~4 m long. */
export function coalWagon({ color = PALETTE.brickBrown } = {}) {
  const g = new THREE.Group();
  const y0 = RAIL_TOP;
  const black = mat(PALETTE.black, { roughness: 0.6 });
  g.add(place(box(3.6, 0.3, 1.3, black), { y: y0 + 0.35 }));
  for (const x of [-1.1, 1.1]) wheelSet(g, x, 0.32, black);
  g.add(place(box(4.0, 1.2, 1.9, surface('planks', color, { size: 1.2 })), { y: y0 + 0.65 }));
  g.add(place(box(3.8, 0.3, 1.7, mat('#1c1c1e', { roughness: 1 })), { y: y0 + 1.6 }));
  for (const s of [-1, 1]) g.add(place(box(0.12, 0.35, 1.9, mat(PALETTE.red)), { x: s * 2.05, y: y0 + 0.45 }));
  return g;
}

/** A few soft puffs of steam rising from (0,0,0). */
export function steamPuffs(seedShift = 0) {
  const g = new THREE.Group();
  const m = mat('#f4f4f2', { roughness: 1, transparent: true, opacity: 0.8 });
  const puffs = [[0, 0.2, 0, 0.35], [0.2 + seedShift * 0.1, 0.75, 0.1, 0.5], [0.55, 1.4, -0.1, 0.65], [1.0, 2.1, 0.15, 0.75]];
  for (const [x, y, z, r] of puffs) g.add(place(sphere(r, m, 10), { x, y, z }));
  return g;
}

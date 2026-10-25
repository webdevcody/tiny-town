import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, SWATCHES, ShapeBuilder,
  lot, patch, facadeBlock, gableRoof, box, beam, cylinder, sphere, place, group, mat, metal, glass,
  surface, textured, lattice, truss, fence, door, flag, antenna, rng,
} from '../../src/lib/index.js';
import {
  SNOW, SNOW_SHADE, face, profileY, board, snowyFir, person, snowcat, floodlight,
  bannerTexture, trackTexture, laneTexture,
} from './props.js';

// 1x2 tiles (10 x 20 m). The jump runs north -> south: inrun tower at the back
// (-z), takeoff on the hill crest, landing slope and outrun towards the front (+z).
// Judges' tower and grandstand sit on the east (+x) side of the landing slope.

const LX = -1.4; // centre line of inrun + landing lane
const HILL_X0 = -5, HILL_X1 = 1.6; // hill body (stone retaining walls on its sides)

// snow-covered hill: [z, y] (y above the lot)
const HILL = [
  [-10, 4.2], [-7, 5.0], [-4.5, 6.4], [-3.0, 7.0], [-2.2, 6.85], [-1.4, 6.45], [-0.6, 5.8],
  [0.2, 5.0], [1.0, 4.15], [1.8, 3.3], [2.6, 2.5], [3.4, 1.75], [4.2, 1.1], [5.0, 0.6],
  [5.8, 0.25], [6.6, 0.08], [7.4, 0.0],
];

// Inrun: curved ramp from the start tower down to the takeoff table.
const Z_TOP = -8.9, Z_TAKEOFF = -2.7, Y_TAKEOFF = 8.0;
function inrunProfile(n = 16) {
  const pts = [[Z_TAKEOFF, Y_TAKEOFF]];
  const dz = (Z_TAKEOFF - Z_TOP) / n;
  for (let i = 1; i <= n; i++) {
    const t = (i - 0.5) / n; // 0 at takeoff, 1 at the top
    const deg = 10 + 36 * Math.min(1, t / 0.5);
    const [z, y] = pts[pts.length - 1];
    pts.push([z - dz, y + dz * Math.tan(THREE.MathUtils.degToRad(deg))]);
  }
  return pts.reverse();
}

/**
 * Solid swept along a [[z, y]...] profile between x0 and x1.
 * Groups: 0 top, 1 bottom/caps/inner, 2 +x face, 3 -x face.
 * floor: bottom sits on y = 0 instead of following the profile.
 */
function sweep(prof, x0, x1, { off0 = -0.5, off1 = 0, floor = false, top, side, xPos, xNeg, topUV = false, sideUV = false }) {
  const b = new ShapeBuilder();
  const s = [0];
  for (let i = 1; i < prof.length; i++) s.push(s[i - 1] + Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]));
  const L = s[s.length - 1];
  const Z = (i) => prof[i][0];
  const lo = (i) => (floor ? 0 : prof[i][1] + off0);
  const hi = (i) => prof[i][1] + off1;
  for (let i = 0; i < prof.length - 1; i++) {
    const j = i + 1;
    const v0 = s[i] / L, v1 = s[j] / L;
    face(b, [[x0, hi(i), Z(i)], [x0, hi(j), Z(j)], [x1, hi(j), Z(j)], [x1, hi(i), Z(i)]], [0, 1, 0], 0,
      topUV ? [[0, v0], [0, v1], [1, v1], [1, v0]] : null);
    if (!floor) face(b, [[x0, lo(i), Z(i)], [x0, lo(j), Z(j)], [x1, lo(j), Z(j)], [x1, lo(i), Z(i)]], [0, -1, 0], 1);
    for (const [x, out, gi, flip] of [[x1, [1, 0, 0], 2, true], [x0, [-1, 0, 0], 3, false]]) {
      const u = (k) => (flip ? 1 - s[k] / L : s[k] / L);
      face(b, [[x, lo(i), Z(i)], [x, hi(i), Z(i)], [x, hi(j), Z(j)], [x, lo(j), Z(j)]], out, gi,
        sideUV ? [[u(i), 0], [u(i), 1], [u(j), 1], [u(j), 0]] : null);
    }
  }
  for (const [i, out] of [[0, [0, 0, -1]], [prof.length - 1, [0, 0, 1]]]) {
    face(b, [[x0, lo(i), Z(i)], [x0, hi(i), Z(i)], [x1, hi(i), Z(i)], [x1, lo(i), Z(i)]], out, 1);
  }
  return new THREE.Mesh(b.build(), [top, side, xPos ?? side, xNeg ?? side]);
}

// arc length along a profile up to z
function arcTo(prof, z) {
  let s = 0;
  for (let i = 1; i < prof.length; i++) {
    const [z0, y0] = prof[i - 1];
    const [z1, y1] = prof[i];
    if (z <= z0) break;
    const t = Math.min(1, (z - z0) / (z1 - z0));
    s += Math.hypot(z1 - z0, y1 - y0) * t;
  }
  return s;
}

function skiJumper(suit) {
  const ski = mat(PALETTE.yellow);
  const g = new THREE.Group();
  for (const a of [-11, 11]) g.add(place(box(0.1, 0.04, 2.0, ski), { x: Math.sin(THREE.MathUtils.degToRad(a)) * 0.9, z: 0.2, ry: a }));
  const body = group(
    place(box(0.32, 0.24, 1.15, mat(suit)), { z: 0.1 }),
    place(sphere(0.15, mat(PALETTE.white), 8), { y: -0.03, z: 0.75 }),
    place(box(0.5, 0.08, 0.7, mat(suit)), { y: 0.05, z: 0.0 }),
  );
  g.add(place(body, { y: 0.22, rx: -18 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const r = rng(8128);
  g.add(lot([1, 2], mat(SNOW)));
  const s = new THREE.Group();
  s.position.y = LOT_HEIGHT;
  g.add(s);

  const snow = mat(SNOW);
  const stone = surface('cobbles', PALETTE.stone, { size: 2 });
  const concrete = mat(PALETTE.concrete);
  const steel = metal(PALETTE.steelDark);
  const hY = (z) => profileY(HILL, z);

  // --- the hill --------------------------------------------------------------
  s.add(sweep(HILL, HILL_X0, HILL_X1, { floor: true, top: snow, side: stone }));

  // landing slope + outrun lane with distance lines, K-point and spruce edges
  const lane = [[-3.0, hY(-3.0)], ...HILL.filter(([z]) => z > -3.0), [9.0, 0]].map(([z, y]) => [z, y + 0.03]);
  const laneL = arcTo(lane, 99);
  const v = (z) => arcTo(lane, z) / laneL;
  const marks = [];
  for (let z = -0.8; z <= 5.7; z += 0.8) marks.push({ v: v(z), color: PALETTE.blue, thick: 5 });
  marks.push({ v: v(3.0), color: PALETTE.red, thick: 14 });
  marks.push({ v: v(4.6), color: PALETTE.green, thick: 12 });
  marks.push({ v: v(7.2), color: PALETTE.red, thick: 8 });
  s.add(sweep(lane, LX - 2.0, LX + 2.0, { off0: -0.1, off1: 0, top: textured(laneTexture(marks)), side: snow, topUV: true }));

  // --- inrun ------------------------------------------------------------------
  const inrun = inrunProfile();
  const yTop = inrun[0][1];
  const banner = textured(bannerTexture());
  s.add(sweep(inrun, LX - 1.2, LX + 1.2, { off0: -0.5, off1: 0, top: textured(trackTexture()), side: concrete, topUV: true }));
  s.add(sweep(inrun, LX + 1.2, LX + 1.38, { off0: -0.55, off1: 0.75, top: mat(PALETTE.red), side: mat(PALETTE.white), xPos: banner, sideUV: true }));
  s.add(sweep(inrun, LX - 1.38, LX - 1.2, { off0: -0.55, off1: 0.75, top: mat(PALETTE.red), side: mat(PALETTE.white), xNeg: banner, sideUV: true }));

  // inrun supports: concrete column pairs with cross beams and steel bracing
  const iY = (z) => profileY(inrun, z);
  const supports = [-8.2, -6.9, -5.6, -4.3, -3.2];
  supports.forEach((z, k) => {
    const yd = iY(z) - 0.5, yg = hY(z) - 0.3;
    for (const dx of [-0.95, 0.95]) s.add(place(box(0.42, yd - yg, 0.42, concrete), { x: LX + dx, y: yg, z }));
    s.add(place(box(2.3, 0.35, 0.35, concrete), { x: LX, y: yd - 0.35, z }));
    if (yd - yg > 3) s.add(place(box(2.3, 0.3, 0.3, concrete), { x: LX, y: (yd + yg) / 2, z }));
    const n = supports[k + 1];
    if (n != null) {
      for (const dx of [-0.95, 0.95]) {
        s.add(beam([LX + dx, hY(z) + 0.4, z], [LX + dx, iY(n) - 0.8, n], 0.14, steel));
      }
    }
  });

  // start tower, platform, start cabin and gate
  const towerBase = hY(-10) - 0.3;
  s.add(place(facadeBlock({ w: 3.4, d: 1.1, h: yTop - towerBase, floorHeight: (yTop - towerBase) / 3, style: 'punched', wall: PALETTE.white, glass: PALETTE.window, frame: PALETTE.steelDark, bay: 1.1, windowW: 0.55, lit: 0.3, seed: 4, roof: PALETTE.concreteDark }), { x: LX, y: towerBase, z: -9.45 }));
  s.add(place(box(3.8, 0.25, 1.3, concrete), { x: LX, y: yTop - 0.05, z: -9.35 }));
  s.add(place(facadeBlock({ w: 2.8, d: 0.9, h: 2.1, floorHeight: 2.1, style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.red, bay: 0.9, lit: 0.5, seed: 9, roof: PALETTE.red }), { x: LX, y: yTop + 0.2, z: -9.5 }));
  s.add(place(box(3.4, 0.2, 1.4, mat(PALETTE.red)), { x: LX, y: yTop + 2.3, z: -9.4 }));
  s.add(place(box(3.2, 0.12, 1.2, snow), { x: LX, y: yTop + 2.5, z: -9.4 }));
  s.add(place(board('START', { w: 2.6, h: 0.55, bg: PALETTE.red, fg: '#ffffff' }), { x: LX, y: yTop + 1.7, z: -8.98 }));
  for (const dx of [-1.25, 1.25]) {
    s.add(place(box(0.1, 0.9, 0.1, mat(PALETTE.yellow)), { x: LX + dx, y: iY(-8.6), z: -8.6 }));
    s.add(place(flag({ h: 3, color: dx < 0 ? PALETTE.blue : PALETTE.red, color2: PALETTE.white }), { x: LX + dx * 1.3, y: yTop + 2.6, z: -9.4, ry: dx < 0 ? 180 : 0, s: 0.7 }));
  }
  s.add(place(box(2.5, 0.08, 0.08, mat(PALETTE.yellow)), { x: LX, y: iY(-8.6) + 0.5, z: -8.6 }));
  // athlete waiting on the start bench
  s.add(place(person(PALETTE.blue, true), { x: LX - 0.3, y: yTop + 0.1, z: -8.7 }));

  // lift tower + bridge to the start platform
  const liftX = 3.7, liftZ = -8.8;
  s.add(place(lattice({ w: 1.7, h: yTop, thickness: 0.14, material: steel }), { x: liftX, z: liftZ }));
  s.add(place(box(1.1, 1.7, 1.1, glass(PALETTE.glassSky)), { x: liftX, y: yTop * 0.45, z: liftZ }));
  s.add(place(box(1.9, 0.25, 1.9, concrete), { x: liftX, y: yTop - 0.05, z: liftZ }));
  s.add(place(facadeBlock({ w: 1.8, d: 1.8, h: 2.0, floorHeight: 2.0, style: 'punched', wall: PALETTE.red, glass: PALETTE.window, frame: PALETTE.white, bay: 1.8, windowW: 0.45, seed: 2, roof: PALETTE.white }), { x: liftX, y: yTop + 0.2, z: liftZ }));
  s.add(place(antenna({ h: 2.2 }), { x: liftX + 0.5, y: yTop + 2.2, z: liftZ - 0.5 }));
  const brX0 = LX + 1.9, brX1 = liftX - 0.85;
  s.add(place(box(brX1 - brX0, 0.2, 1.0, concrete), { x: (brX0 + brX1) / 2, y: yTop, z: -9.35 }));
  s.add(place(truss({ length: brX1 - brX0, w: 1.0, h: 0.7, material: steel, thickness: 0.1 }), { x: brX0, y: yTop - 0.7, z: -9.35 }));
  for (const dz of [-0.48, 0.48]) s.add(place(box(brX1 - brX0, 0.06, 0.06, mat(PALETTE.red)), { x: (brX0 + brX1) / 2, y: yTop + 1.1, z: -9.35 + dz }));

  // --- judges' tower ------------------------------------------------------------
  const jX = 3.4, jZ = -1.0;
  s.add(place(facadeBlock({ w: 2.8, d: 3.4, floors: 2, style: 'punched', wall: PALETTE.cream, glass: PALETTE.window, frame: PALETTE.white, bay: 1.4, windowW: 0.5, lit: 0.2, seed: 31, roof: PALETTE.concreteDark }), { x: jX, y: 0, z: jZ }));
  s.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.navy }), { x: jX, y: 0, z: jZ + 1.7 }));
  const cabY = 6;
  s.add(place(box(3.6, 0.3, 4.0, concrete), { x: jX - 0.1, y: cabY - 0.3, z: jZ }));
  s.add(place(facadeBlock({ w: 3.4, d: 3.8, h: 2.3, floorHeight: 2.3, style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelDark, bay: 0.95, lit: 0.6, seed: 12, roof: PALETTE.white }), { x: jX - 0.1, y: cabY, z: jZ }));
  s.add(place(box(3.9, 0.25, 4.3, mat(PALETTE.navy)), { x: jX - 0.1, y: cabY + 2.3, z: jZ }));
  s.add(place(box(3.7, 0.1, 4.1, snow), { x: jX - 0.1, y: cabY + 2.55, z: jZ }));
  s.add(place(board('SKI JUMP', { w: 3.4, h: 0.9, bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.yellow, double: true }), { x: jX - 0.1, y: cabY + 2.65, z: jZ + 0.6 }));
  for (const dx of [-1.5, 1.4]) s.add(place(box(0.15, 1.6, 0.15, steel), { x: jX - 0.1 + dx, y: cabY + 2.6, z: jZ + 0.6 }));
  s.add(place(antenna({ h: 2.5 }), { x: jX + 1.2, y: cabY + 2.65, z: jZ - 1.5 }));

  // --- grandstand facing the outrun (-x) -------------------------------------
  const stZ = 5.6, stL = 7.6, rows = 5, rowD = 0.55;
  const seat = mat(PALETTE.blue);
  for (let i = 0; i < rows; i++) {
    const x = 2.3 + rowD * (i + 0.5), h = 0.4 * (i + 1);
    s.add(place(box(rowD, h, stL, concrete), { x, z: stZ }));
    s.add(place(box(0.2, 0.14, stL - 0.2, seat), { x: x + 0.12, y: h, z: stZ }));
    for (let z = stZ - stL / 2 + 0.35; z < stZ + stL / 2 - 0.2; z += 0.52) {
      if (r.chance(0.28)) continue;
      s.add(place(person(r.pick(SWATCHES.cars), true), { x: x + 0.05, y: h, z, ry: 90 }));
    }
  }
  s.add(place(fence({ w: 0.1, d: stL, h: 1.0, style: 'railing', sides: ['left'] }), { x: 2.3 + rowD * rows - 0.05, y: 0.4 * rows, z: stZ }));
  s.add(place(board('SNOW COLA', { w: stL, h: 0.55, bg: PALETTE.red, fg: '#ffffff' }), { x: 2.15, z: stZ, ry: -90 }));
  for (const z of [stZ - stL / 2 - 0.05, stZ + stL / 2 + 0.05]) s.add(place(box(rowD * rows + 0.1, 0.12, 0.12, mat(PALETTE.darkGrey)), { x: 2.3 + (rowD * rows) / 2, y: 2.2, z }));

  // --- props -------------------------------------------------------------------
  // jumper in flight over the landing slope
  s.add(place(skiJumper(PALETTE.red), { x: LX + 0.2, y: hY(0.6) + 2.3, z: 0.6, rx: 22 }));

  // outrun end: sponsor boards, crowd, flags
  s.add(place(board('TINY TOWN 2026', { w: 5.4, h: 0.7, bg: PALETTE.navy, fg: '#ffffff', double: true }), { x: LX, z: 9.15 }));
  for (let x = -4.7; x <= 1.6; x += 0.48) {
    if (r.chance(0.2)) continue;
    s.add(place(person(r.pick(SWATCHES.cars)), { x, z: 9.65 + r.range(-0.1, 0.1) }));
  }
  for (const [x, c] of [[-4.75, PALETTE.red], [1.35, PALETTE.blue]]) s.add(place(flag({ h: 4, color: c, color2: PALETTE.white }), { x, z: 8.6, s: 0.8 }));

  // spectators on the west bank of the landing slope
  for (const z of [3.8, 4.4, 5.0, 5.7, 6.3]) s.add(place(person(r.pick(SWATCHES.cars)), { x: -4.55 + r.range(-0.15, 0.15), y: hY(z), z }));
  s.add(place(fence({ w: 0.1, d: 6.5, h: 0.7, style: 'railing', color: PALETTE.red, sides: ['left'] }), { x: LX - 2.25, y: 0, z: 5.5 }));

  // floodlights along the west side
  for (const z of [-1.6, 4.0]) s.add(place(floodlight(9), { x: -4.75, y: hY(z), z }));

  // snowy firs on the hill and around the site
  for (const [x, z, h] of [[-3.95, -8.7, 3.6], [-4.0, -6.9, 3.3], [-3.9, -5.1, 3.8], [-4.1, 1.2, 2.6], [0.8, -6.5, 2.8], [0.9, -4.2, 2.4], [4.1, -7.2, 2.4]]) {
    s.add(place(snowyFir(h), { x, y: x < HILL_X1 ? hY(z) - 0.1 : 0, z }));
  }

  // wax cabin + snowcat behind the judges' tower
  s.add(place(facadeBlock({ w: 2.4, d: 1.7, floors: 1, floorHeight: 2.2, style: 'punched', wall: PALETTE.brickBrown, glass: PALETTE.windowLit, frame: PALETTE.white, bay: 1.2, windowW: 0.45, lit: 0.8, seed: 7 }), { x: 3.5, z: -5.75 }));
  s.add(place(gableRoof({ w: 2.4, d: 1.7, h: 0.9, overhang: 0.2, ridge: 'x', material: snow, gableMaterial: PALETTE.brickBrown }), { x: 3.5, y: 2.2, z: -5.75 }));
  s.add(place(snowcat(), { x: 3.2, z: -3.75, ry: 180 }));
  s.add(place(patch(3.0, 7.0, mat(SNOW_SHADE)), { x: 3.4, z: -6.4 }));
  return g;
}

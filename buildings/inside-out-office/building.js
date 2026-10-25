import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, tower, box, cylinder, cone, sphere, place, group, beam, pipe, pipeRun, lattice, truss,
  tree, streetLamp, bench, mat, metal, glass, textured, signTexture,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// A high-tech "bowellist" office: the glass box is plain, everything that
// normally hides inside (structure, lifts, stairs, ducts, pipes) is bolted
// on the outside and colour-coded: blue = air, red = people, green = water,
// yellow = power, steel = stairs and service pods.

const RED = mat(PALETTE.red, { roughness: 0.55 });
const BLUE = mat('#2f7fd8', { roughness: 0.5 });
const BLUE_DARK = mat('#22579a', { roughness: 0.6 });
const GREEN = mat(PALETTE.green, { roughness: 0.55 });
const YELLOW = mat(PALETTE.yellow, { roughness: 0.55 });
const WHITE = mat(PALETTE.white, { roughness: 0.6 });
const STEEL = metal(PALETTE.steelLight, { roughness: 0.35 });
const CHROME = metal(PALETTE.chrome, { roughness: 0.3 });
const STEEL_DARK = metal(PALETTE.steelDark);
const TUBE = glass(PALETTE.glassSky);
const SLIT = glass(PALETTE.glassDark);

// Sign with 0..1 UVs so the text fills the whole face (lib sign() shrinks it on faces over 1 m).
function bigSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.2 } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Round stair tower clad in steel, with floor bands and a glazed slit facing `slitDir` (+1/-1 on x).
function stairTower(r, h, slitDir) {
  const g = group(cylinder(r, r, h, CHROME, 14));
  for (let y = FLOOR; y < h - 0.5; y += FLOOR) g.add(place(cylinder(r + 0.06, r + 0.06, 0.18, STEEL_DARK, 14), { y }));
  g.add(place(box(0.12, h - 1.6, 0.42, SLIT), { x: slitDir * (r - 0.02), y: 0.8 }));
  g.add(place(cylinder(r + 0.12, r + 0.12, 0.35, STEEL_DARK, 14), { y: h }));
  g.add(place(box(r * 1.1, 1.0, r * 1.1, STEEL), { y: h + 0.35 }));
  return g;
}

// Blue air-intake periscope for the plaza.
function vent(ry) {
  return place(group(
    cylinder(0.28, 0.32, 2.0, BLUE, 12),
    place(sphere(0.3, BLUE, 10), { y: 2.0 }),
    pipe([0, 2.0, 0], [0, 2.0, 0.55], 0.3, BLUE),
    place(cylinder(0.55, 0.32, 0.4, WHITE, 12), { y: 2.0, z: 0.75, rx: 90 }),
    place(cylinder(0.42, 0.42, 0.18, BLUE_DARK, 12), { y: 0 }),
  ), { ry });
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // --- the glass box -------------------------------------------------------
  const bw = 5.2, bd = 4.4, bz = -0.8;
  const front = bz + bd / 2, back = bz - bd / 2;
  const groundH = 3.6, upper = 5;
  const top = y0 + groundH + upper * FLOOR; // 18.75
  g.add(place(tower({
    w: bw, d: bd, floors: upper + 1,
    ground: { style: 'shop', wall: PALETTE.steelLight, glass: PALETTE.glassDark, frame: PALETTE.white, floorHeight: groundH, bay: 1.8, lit: 0.4 },
    style: 'curtain', glass: PALETTE.glassBlue, frame: PALETTE.white, bay: 1.3, lit: 0.15, seed: 33, roof: PALETTE.concrete,
  }), { y: y0, z: bz }));

  // floor slabs project as white bands all round
  const levels = [];
  for (let i = 0; i <= upper; i++) levels.push(y0 + groundH + i * FLOOR);
  for (const ly of levels) g.add(place(box(bw + 0.3, 0.22, bd + 0.3, WHITE), { y: ly - 0.11, z: bz }));

  // --- front exoskeleton: white columns, brackets and cross-bracing ---------
  const fz = front + 0.7;
  const cols = [-bw / 2, 0, bw / 2];
  for (const x of cols) {
    g.add(place(box(0.32, (x === 0 ? top : top + 1.6) - y0, 0.32, WHITE), { x, y: y0, z: fz }));
    for (const ly of levels) g.add(place(box(0.2, 0.3, 0.7, WHITE), { x, y: ly - 0.25, z: front + 0.35 }));
  }
  for (const ly of levels) g.add(place(box(bw + 0.32, 0.22, 0.22, WHITE), { y: ly - 0.2, z: fz }));
  for (let i = 0; i < upper; i += 2) {
    const ya = levels[i], yb = levels[Math.min(i + 2, upper)];
    for (let c = 0; c < cols.length - 1; c++) {
      const xa = cols[c], xb = cols[c + 1];
      g.add(beam([xa, ya, fz], [xb, yb, fz], 0.1, STEEL));
      g.add(beam([xb, ya, fz], [xa, yb, fz], 0.1, STEEL));
    }
  }
  // tension rods to the ground on the lobby floor
  for (const x of cols) g.add(place(cylinder(0.42, 0.5, 0.25, STEEL_DARK, 10), { x, y: y0, z: fz }));

  // big sign on the roof edge
  g.add(place(box(bw + 0.4, 0.15, 0.4, WHITE), { y: top + 0.25, z: fz }));
  g.add(place(box(bw + 0.32, 0.2, 0.32, WHITE), { y: top + 1.45, z: fz }));
  g.add(place(bigSign('INSIDE OUT', bw - 0.4, 1.0, { bg: PALETTE.navy, fg: '#ffffff' }), { y: top + 0.4, z: fz + 0.12 }));

  // --- red zigzag escalator tube across the front ---------------------------
  const ez = fz + 0.62, er = 0.44, ex = 2.25;
  const stops = [[ex, y0 + 0.5]];
  levels.slice(0, upper).forEach((ly, i) => stops.push([i % 2 === 0 ? -ex : ex, ly + 0.5]));
  for (let i = 0; i < stops.length - 1; i++) {
    const [xa, ya] = stops[i], [xb, yb] = stops[i + 1];
    const a = [xa, ya + er, ez], b = [xb, yb + er, ez];
    g.add(pipe(a, b, er, TUBE));
    g.add(beam([xa, ya - 0.05, ez], [xb, yb - 0.05, ez], 0.34, RED));
    for (let t = 0.15; t < 0.95; t += 0.175) {
      const p = [xa + (xb - xa) * t, ya + er + (yb - ya) * t, ez];
      const q = [xa + (xb - xa) * (t + 0.035), ya + er + (yb - ya) * (t + 0.035), ez];
      g.add(pipe(p, q, er + 0.06, RED));
    }
  }
  // landings at each turn, tied back to the frame
  for (const [x, y] of stops) {
    g.add(place(sphere(er + 0.04, TUBE, 10), { x, y: y + er, z: ez }));
    g.add(place(box(1.1, 0.25, 1.3, RED), { x, y: y - 0.25, z: ez - 0.3 }));
  }
  // entrance canopy under the first flight
  g.add(place(box(2.4, 0.12, 1.4, glass(PALETTE.glassSky, { opacity: 0.75 })), { x: -0.6, y: y0 + 2.9, z: front + 0.7 }));

  // --- east: round steel stair tower + stacked service pods ----------------
  const stH = top + 1.6 - y0;
  g.add(place(stairTower(0.8, stH, 1), { x: 3.75, y: y0, z: -0.3 }));
  for (const ly of levels) g.add(place(box(0.9, 0.5, 1.0, STEEL), { x: bw / 2 + 0.4, y: ly - 0.4, z: -0.3 }));
  for (let i = 0; i <= upper; i++) {
    const py = i === 0 ? y0 + 0.6 : levels[i - 1] + 0.1;
    const ph = (i === 0 ? groundH - 0.6 : FLOOR) - 0.2;
    g.add(place(box(1.3, ph, 1.5, STEEL), { x: 3.4, y: py, z: -2.35 }));
    g.add(place(box(1.34, 0.35, 1.54, SLIT), { x: 3.4, y: py + ph * 0.55, z: -2.35 }));
  }
  g.add(place(lattice({ w: 1.1, d: 1.2, h: 0.6, segments: 1, thickness: 0.1, material: STEEL_DARK }), { x: 3.4, y: y0, z: -2.35 }));

  // blue maintenance crane on top of the stair tower
  const craneY = y0 + stH + 1.35;
  g.add(place(cylinder(0.18, 0.22, 1.8, BLUE, 8), { x: 3.75, y: craneY, z: -0.3 }));
  g.add(place(truss({ length: 4.6, w: 0.5, h: 0.55, thickness: 0.09, material: BLUE }), { x: 4.25, y: craneY + 1.8, z: -0.3, ry: 180 }));
  g.add(place(box(0.8, 0.6, 0.7, BLUE_DARK), { x: 4.0, y: craneY + 1.4, z: -0.3 }));
  g.add(place(box(0.03, 1.6, 0.03, STEEL_DARK), { x: -0.1, y: craneY + 0.2, z: -0.3 }));
  g.add(place(box(0.3, 0.25, 0.3, YELLOW), { x: -0.1, y: craneY, z: -0.3 }));

  // --- west: red lattice lift tower with glass cars + square stair tower ----
  const lx = -3.75, lz = 0.2, lH = top + 2.2 - y0;
  g.add(place(box(1.5, lH, 0.12, STEEL_DARK), { x: lx, y: y0, z: lz - 0.7 }));
  g.add(place(lattice({ w: 1.6, d: 1.6, h: lH, segments: 9, thickness: 0.16, material: RED }), { x: lx, y: y0, z: lz }));
  g.add(place(box(1.8, 1.4, 1.8, RED), { x: lx, y: y0 + lH, z: lz }));
  g.add(place(box(1.9, 0.18, 1.9, STEEL_DARK), { x: lx, y: y0 + lH + 1.4, z: lz }));
  for (const [cy, cx] of [[y0 + 4.4, -0.3], [y0 + 12.6, 0.3]]) {
    const car = group(
      box(0.75, 0.2, 1.1, RED),
      place(box(0.7, 1.7, 1.0, TUBE), { y: 0.2 }),
      place(box(0.75, 0.2, 1.1, RED), { y: 1.9 }),
    );
    g.add(place(car, { x: lx + cx, y: cy, z: lz }));
  }
  for (const ly of levels) g.add(place(box(1.0, 0.3, 1.1, RED), { x: -bw / 2 - 0.35, y: ly - 0.35, z: lz }));

  const sx = -3.6, sz = -2.3, sH = top + 1.0 - y0;
  g.add(place(box(1.5, sH, 1.5, CHROME), { x: sx, y: y0, z: sz }));
  g.add(place(box(1.54, sH - 1.4, 0.4, SLIT), { x: sx, y: y0 + 0.7, z: sz + 0.1 }));
  for (let y = y0 + FLOOR; y < y0 + sH; y += FLOOR) g.add(place(box(1.6, 0.16, 1.6, STEEL_DARK), { x: sx, y, z: sz }));
  g.add(place(box(1.7, 0.3, 1.7, STEEL_DARK), { x: sx, y: y0 + sH, z: sz }));

  // --- back: blue air ducts, green water and yellow power risers -----------
  const dz = back - 0.62, dr = 0.42;
  g.add(place(box(bw + 0.4, 1.8, 1.6, BLUE_DARK), { y: y0, z: dz - 0.35 }));
  for (let x = -2.2; x <= 2.21; x += 0.55) g.add(place(box(0.32, 1.2, 0.04, STEEL_DARK), { x, y: y0 + 0.3, z: dz - 1.16 }));
  const ductX = [-1.75, 0, 1.75];
  for (const x of ductX) {
    // up the back, over the parapet and along the roof
    g.add(pipeRun([[x, y0 + 1.8, dz], [x, top + 1.0, dz], [x, top + 1.0, bz - 0.2], [x, top + 0.2, bz - 0.2]], dr, BLUE));
    g.add(place(cylinder(dr + 0.1, dr + 0.1, 0.25, BLUE_DARK, 12), { x, y: y0 + 1.8, z: dz }));
    for (const ly of levels) {
      g.add(pipe([x, ly + 0.8, dz], [x, ly + 0.8, back], 0.22, BLUE));
      g.add(place(cylinder(dr + 0.08, dr + 0.08, 0.2, BLUE_DARK, 12), { x, y: ly + 0.55, z: dz }));
    }
  }
  for (const [x, m, r] of [[-0.9, GREEN, 0.16], [0.9, YELLOW, 0.13], [-2.45, GREEN, 0.13], [2.45, YELLOW, 0.16]]) {
    g.add(pipeRun([[x, y0 + 1.8, dz + 0.1], [x, top + 0.5, dz + 0.1], [x, top + 0.5, back + 0.6]], r, m));
    for (const ly of levels) g.add(place(box(0.5, 0.12, 0.6, STEEL_DARK), { x, y: ly, z: back - 0.3 }));
  }

  // --- roof: plant room, fans, duct manifold -------------------------------
  g.add(place(box(bw - 0.8, 0.5, bd - 0.6, mat(PALETTE.concreteDark)), { y: top, z: bz }));
  g.add(place(box(3.8, 1.6, 1.4, STEEL), { y: top + 0.5, z: bz - 0.2 }));
  g.add(pipe([-2.1, top + 1.3, bz - 0.2], [2.1, top + 1.3, bz - 0.2], 0.5, BLUE));
  for (const x of [-1.2, 1.2]) {
    g.add(place(cylinder(0.55, 0.55, 0.7, STEEL_DARK, 12), { x, y: top + 0.5, z: bz + 1.2 }));
    g.add(place(cylinder(0.45, 0.45, 0.05, mat(PALETTE.black), 12), { x, y: top + 1.2, z: bz + 1.2 }));
  }
  g.add(place(cylinder(0.25, 0.25, 2.2, YELLOW, 8), { x: 0, y: top + 0.5, z: bz + 1.2 }));
  g.add(place(cone(0.4, 0.5, RED, 8), { x: 0, y: top + 2.7, z: bz + 1.2 }));

  // --- plaza ----------------------------------------------------------------
  g.add(place(patch(9.6, 1.9, 'cobbles'), { y: y0, z: 4.0 }));
  g.add(place(vent(0), { x: -4.0, y: y0, z: 3.7 }));
  g.add(place(vent(-35), { x: 2.6, y: y0, z: 3.9 }));
  g.add(place(bench({ w: 1.6 }), { x: -0.9, y: y0, z: 4.3 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -2.4, y: y0, z: 4.4 }));
  g.add(place(box(1.4, 0.5, 1.4, mat(PALETTE.stoneDark)), { x: 3.95, y: y0, z: 2.6 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: 3.95, y: y0 + 0.5, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: -4.3, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 14 }), { x: 4.3, y: y0, z: -4.3 }));
  return g;
}

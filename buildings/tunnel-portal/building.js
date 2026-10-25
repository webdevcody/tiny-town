import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, box, cylinder, place, group, beam, taperedBlock, tree, sign,
  mat, metal, glass, emissive, surface, textured, canvasTexture, shade,
  ShapeBuilder,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Tracks run along Z and leave the hill towards +Z (front).
const HALF = TILE / 2;
const ZF = -0.4; // portal face plane
const WALL_T = 0.6; // portal wall thickness (behind ZF)
const ARCH_A = 3.4; // half width of the bore opening
const ARCH_S = 2.4; // springing height
const ARCH_R = 2.6; // elliptical rise above the springing (crown at 5.0)
const WALL_H = 6.2; // portal wall height
const HILL_H = 6.4; // embankment height behind the portal
const BORE_D = 2.8; // visible depth of the bore before it goes black
const WING_X = 3.9; // inner face of the wing walls (cutting half-width)
const WING_T = 0.55;
const WING_L = 4.4; // wing walls run from ZF to ZF + WING_L
const WING_H0 = 5.5, WING_H1 = 0.6;
const TRACK_X = 1.6; // track centres at +-TRACK_X

// ashlar block texture (1 repeat = 2.4 m square)
function ashlar(base, key) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    let s = 7;
    const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
    ctx.fillStyle = shade(base, -0.35);
    ctx.fillRect(0, 0, W, H);
    const rows = 6, rh = H / rows;
    for (let row = 0; row < rows; row++) {
      let x = row % 2 ? -18 : 0;
      while (x < W) {
        const bw = 26 + Math.floor(r() * 20);
        ctx.fillStyle = shade(base, (r() - 0.5) * 0.22);
        ctx.fillRect(x + 1, row * rh + 1, bw - 2, rh - 2);
        ctx.fillStyle = shade(base, 0.12);
        ctx.fillRect(x + 1, row * rh + 1, bw - 2, 2);
        x += bw;
      }
    }
  }, { key });
  tex.repeat.set(1 / 2.4, 1 / 2.4);
  return textured(tex, { roughness: 0.9 });
}

// extruded THREE.Shape (x/y outline) between z = 0 and z = depth
function slab(points, depth, material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  return new THREE.Mesh(geo, material);
}

// point on the arch intrados, t from 0 (left springing) to 1 (right springing)
function archPt(t, grow = 0) {
  const th = Math.PI * (1 - t);
  return [(ARCH_A + grow) * Math.cos(th), ARCH_S + (ARCH_R + grow) * Math.sin(th)];
}

function archOutline(grow = 0, n = 20) {
  const pts = [[-(ARCH_A + grow), 0]];
  for (let i = 0; i <= n; i++) pts.push(archPt(i / n, grow));
  pts.push([ARCH_A + grow, 0]);
  return pts;
}

// --- terrain -------------------------------------------------------------------
function wingTop(z) {
  return WING_H0 + (WING_H1 - WING_H0) * ((z - ZF) / WING_L);
}

function smooth(t) {
  t = Math.min(1, Math.max(0, t));
  return t * t * (3 - 2 * t);
}

// hill profile behind the portal
function backProfile(z) {
  const z0 = ZF - BORE_D - 0.4; // plateau ends here
  if (z >= z0) return HILL_H;
  return HILL_H + (1.3 - HILL_H) * smooth((z0 - z) / (z0 + HALF));
}

// side banks drop a little towards the tile edges
function sideFall(x) {
  return 1 - 0.5 * smooth((Math.abs(x) - (WING_X + WING_T)) / (HALF - WING_X - WING_T));
}

function terrainH(x, z) {
  let h = backProfile(z);
  if (z > ZF && Math.abs(x) >= WING_X - 1e-6) {
    const end = ZF + WING_L;
    const bank = z <= end ? wingTop(z) - 0.12 : (WING_H1 - 0.12) * (1 - smooth((z - end) / 0.9));
    h = Math.min(h, Math.max(0, bank));
  }
  // gentle undulation on the hill top, away from the portal coping
  if (z < ZF - 1) h += 0.3 * smooth((ZF - 1 - z) / 1.5) * Math.sin(x * 1.3 + z * 0.7) * Math.sin(z * 1.1 + 0.5);
  return h * sideFall(x);
}

function inCutting(x, z) {
  return z > ZF + 1e-6 && Math.abs(x) < WING_X - 1e-6;
}

function terrain(y0) {
  const grass = surface('grass', PALETTE.grass, { size: 4 });
  const earth = mat(shade(PALETTE.dirt, -0.1), { side: THREE.DoubleSide });
  const lines = (fixed) => {
    const s = new Set(fixed.map((v) => +v.toFixed(3)));
    for (let v = -HALF; v <= HALF + 1e-6; v += 0.5) s.add(+v.toFixed(3));
    return [...s].sort((a, b) => a - b);
  };
  const xs = lines([-WING_X, WING_X, -WING_X - WING_T, WING_X + WING_T]);
  const zs = lines([ZF, ZF + WING_L]);
  const top = new ShapeBuilder();
  const skirt = new ShapeBuilder();
  const P = (x, z) => [x, terrainH(x, z) + 0.02, z];
  for (let i = 0; i < xs.length - 1; i++) {
    for (let j = 0; j < zs.length - 1; j++) {
      const x0 = xs[i], x1 = xs[i + 1], z0 = zs[j], z1 = zs[j + 1];
      if (inCutting((x0 + x1) / 2, (z0 + z1) / 2)) continue;
      const c = [P(x0, z1), P(x1, z1), P(x1, z0), P(x0, z0)];
      if (c.every((p) => p[1] < 0.05)) continue;
      top.tri(c[0], c[1], c[2]);
      top.tri(c[0], c[2], c[3]);
    }
  }
  const wallAlong = (pts) => {
    for (let k = 0; k < pts.length - 1; k++) {
      const [a, b] = [pts[k], pts[k + 1]];
      if (a[1] < 0.05 && b[1] < 0.05) continue;
      skirt.quad([a[0], 0, a[2]], [b[0], 0, b[2]], b, a);
    }
  };
  wallAlong(zs.map((z) => P(-HALF, z)));
  wallAlong(zs.map((z) => P(HALF, z)));
  wallAlong(xs.map((x) => P(x, -HALF)));
  for (const sx of [-1, 1]) wallAlong(zs.filter((z) => z >= ZF + WING_L).map((z) => P(sx * WING_X, z)));
  return group(
    place(new THREE.Mesh(top.build(), grass), { y: y0 }),
    place(new THREE.Mesh(skirt.build(), earth), { y: y0 }),
  );
}

// --- the portal ------------------------------------------------------------------
function portal(y0) {
  const g = new THREE.Group();
  const stone = ashlar(PALETTE.stone, 'tunnel-portal:ashlar');
  const stoneDark = ashlar(shade(PALETTE.stone, -0.12), 'tunnel-portal:ashlar-dark');
  const dressed = mat(shade(PALETTE.sandstone, -0.05));
  const dressed2 = mat(shade(PALETTE.stone, 0.12));
  const coping = mat(shade(PALETTE.stone, 0.08));

  // main wall with the arched opening cut out of it
  const W = 4.85;
  const outline = [[-W, 0], ...archOutline(), [W, 0], [W, WALL_H], [-W, WALL_H]];
  g.add(place(slab(outline, WALL_T, stone), { y: y0, z: ZF - WALL_T }));

  // bore lining + black depth
  const bore = new ShapeBuilder();
  const n = 20;
  for (let i = 0; i < n; i++) {
    const [ax, ay] = archPt(i / n), [bx, by] = archPt((i + 1) / n);
    bore.quad([ax, ay, ZF - WALL_T], [bx, by, ZF - WALL_T], [bx, by, ZF - BORE_D - WALL_T], [ax, ay, ZF - BORE_D - WALL_T]);
  }
  for (const sx of [-1, 1]) {
    const x = sx * ARCH_A;
    bore.quad([x, 0, ZF - WALL_T], [x, ARCH_S, ZF - WALL_T], [x, ARCH_S, ZF - BORE_D - WALL_T], [x, 0, ZF - BORE_D - WALL_T]);
  }
  g.add(place(new THREE.Mesh(bore.build(), mat('#3a3833', { side: THREE.DoubleSide })), { y: y0 }));
  g.add(place(slab(archOutline(0.1), 0.1, mat('#0b0b0c')), { y: y0, z: ZF - WALL_T - BORE_D - 0.05 }));
  // soot stain fading into the bore
  g.add(place(slab(archOutline(0.02).map(([x, y]) => [x, Math.max(y, ARCH_S + 0.6)]), 0.05, mat('#1c1b19')), { y: y0, z: ZF - WALL_T - 0.9 }));

  // voussoirs + keystone
  const nv = 15;
  for (let i = 0; i < nv; i++) {
    const t0 = i / nv, t1 = (i + 1) / nv;
    const key = i === (nv - 1) / 2;
    const out = key ? 0.75 : 0.55;
    const pts = [archPt(t0), archPt(t1), archPt(t1, out), archPt(t0, out)];
    if (key) {
      const [lx] = archPt(t0, out), [rx] = archPt(t1, out);
      pts[2] = [rx + 0.08, ARCH_S + ARCH_R + out];
      pts[3] = [lx - 0.08, ARCH_S + ARCH_R + out];
    }
    const depth = key ? 0.3 : 0.15;
    g.add(place(slab(pts, WALL_T + depth, i % 2 ? dressed : dressed2), { y: y0, z: ZF - WALL_T }));
  }
  // quoins down the jambs
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 4; k++) {
      const wide = k % 2 === 0;
      const bw = wide ? 0.75 : 0.5;
      const q = box(bw, 0.56, 0.14, k % 2 ? dressed : dressed2);
      g.add(place(q, { x: sx * (ARCH_A + bw / 2), y: y0 + k * 0.6, z: ZF + 0.07 }));
    }
    // impost block at the springing
    g.add(place(box(0.9, 0.22, 0.25, coping), { x: sx * (ARCH_A + 0.4), y: y0 + ARCH_S - 0.02, z: ZF + 0.1 }));
  }

  // string course, cornice and parapet
  g.add(place(box(2 * W + 0.2, 0.32, WALL_T + 0.45, coping), { y: y0 + WALL_H, z: ZF - WALL_T / 2 + 0.1 }));
  g.add(place(box(2 * W - 0.2, 0.6, 0.45, stoneDark), { y: y0 + WALL_H + 0.32, z: ZF - 0.15 }));
  g.add(place(box(2 * W - 0.05, 0.12, 0.6, coping), { y: y0 + WALL_H + 0.92, z: ZF - 0.15 }));
  // parapet end piers
  for (const sx of [-1, 1]) g.add(place(box(0.7, 1.25, 0.7, stoneDark), { x: sx * (W - 0.3), y: y0 + WALL_H + 0.3, z: ZF - 0.15 }));
  for (const sx of [-1, 1]) g.add(place(box(0.8, 0.14, 0.8, coping), { x: sx * (W - 0.3), y: y0 + WALL_H + 1.55, z: ZF - 0.15 }));

  // datestone above the keystone
  const ds = sign({ text: '1887', w: 1.2, h: 0.36, bg: shade(PALETTE.sandstone, 0.05), fg: '#4a3a28', depth: 0.08 });
  g.add(place(ds, { y: y0 + ARCH_S + ARCH_R + 0.79, z: ZF + 0.02 }));

  // wing walls with sloping coping and end piers
  for (const sx of [-1, 1]) {
    const prof = [[ZF, 0], [ZF + WING_L, 0], [ZF + WING_L, WING_H1], [ZF, WING_H0]];
    const shape = slab(prof, WING_T, stone);
    const xo = sx > 0 ? WING_X + WING_T : -WING_X;
    g.add(place(shape, { x: xo, y: y0, ry: -90 }));
    const xc = sx * (WING_X + WING_T / 2);
    g.add(beam([xc, y0 + WING_H0 + 0.05, ZF + 0.1], [xc, y0 + WING_H1 + 0.05, ZF + WING_L], 0.7, coping));
    g.add(place(box(0.8, WING_H1 + 0.35, 0.8, stoneDark), { x: xc, y: y0, z: ZF + WING_L - 0.1 }));
    g.add(place(box(0.95, 0.14, 0.95, coping), { x: xc, y: y0 + WING_H1 + 0.35, z: ZF + WING_L - 0.1 }));
    // plinth course along the foot of the wing wall
    g.add(place(box(0.12, 0.4, WING_L - 0.5, dressed2), { x: sx * (WING_X - 0.04), y: y0, z: ZF + (WING_L - 0.5) / 2 }));
  }
  return g;
}

// --- track -----------------------------------------------------------------------
function tracks(y0) {
  const g = new THREE.Group();
  const z0 = ZF - WALL_T - BORE_D, z1 = HALF;
  const len = z1 - z0;
  const ballast = surface('gravel', shade(PALETTE.gravel, -0.05), { size: 3 });
  g.add(place(taperedBlock({ w: 6.7, d: len, h: 0.25, topW: 6.1, topD: len, material: ballast }), { y: y0, z: (z0 + z1) / 2 }));
  // cess / drainage strips between ballast and wing walls
  for (const sx of [-1, 1]) {
    g.add(place(box(0.55, 0.06, ZF + WING_L - ZF, mat(shade(PALETTE.gravel, -0.25))), { x: sx * (WING_X - 0.3), y: y0, z: ZF + WING_L / 2 }));
  }
  const sleeperM = mat(PALETTE.woodDark);
  const railM = metal(PALETTE.steelLight, { roughness: 0.35 });
  const railBase = metal(PALETTE.rust, { roughness: 0.8 });
  for (const tx of [-TRACK_X, TRACK_X]) {
    for (let z = z0 + 0.3; z < z1 - 0.1; z += 0.6) {
      g.add(place(box(2.5, 0.1, 0.26, sleeperM), { x: tx, y: y0 + 0.25, z }));
    }
    for (const rx of [-0.72, 0.72]) {
      g.add(place(box(0.14, 0.05, len, railBase), { x: tx + rx, y: y0 + 0.35, z: (z0 + z1) / 2 }));
      g.add(place(box(0.08, 0.09, len, railM), { x: tx + rx, y: y0 + 0.4, z: (z0 + z1) / 2 }));
    }
  }
  return g;
}

// --- a diesel locomotive nosing out of the bore (origin = rail top, nose at +Z) ---
function locomotive(length) {
  const g = new THREE.Group();
  const body = mat('#2d5aa8');
  const yellow = mat(PALETTE.yellow);
  const dark = mat(PALETTE.darkGrey);
  const black = mat(PALETTE.black);
  const win = glass(PALETTE.glassDark);
  const L = length, F = L / 2;
  // bogies and wheels
  for (const bz of [F - 1.3, -F + 1.3]) {
    g.add(place(box(2.0, 0.55, 2.0, dark), { y: 0.05, z: bz }));
    for (const wz of [-0.6, 0.6]) {
      for (const wx of [-0.74, 0.74]) {
        g.add(place(cylinder(0.42, 0.42, 0.12, black, 10), { x: wx, y: 0.42, z: bz + wz, rz: 90 }));
      }
    }
  }
  g.add(place(box(2.5, 0.3, L, dark), { y: 0.6, z: 0 }));
  // main body and chamfered roof
  g.add(place(box(2.5, 2.3, L - 0.4, body), { y: 0.9, z: -0.2 }));
  g.add(place(taperedBlock({ w: 2.5, d: L - 0.4, h: 0.35, topW: 1.6, topD: L - 0.6, material: mat('#9aa3ad') }), { y: 3.2, z: -0.2 }));
  // cab end: sloped nose with windscreen and yellow warning panel
  g.add(place(taperedBlock({ w: 2.5, d: 0.4, h: 1.35, topW: 2.5, topD: 0.1, material: yellow }), { y: 0.9, z: F - 0.2 }));
  g.add(place(box(2.5, 0.08, 0.3, black), { y: 2.24, z: F - 0.4 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(1.0, 0.75, 0.06, win), { x: sx * 0.58, y: 2.35, z: F - 0.38 }));
    // headlights and buffers
    g.add(place(box(0.28, 0.2, 0.06, emissive('#fff6c8', 1.4)), { x: sx * 0.8, y: 1.15, z: F + 0.01 }));
    g.add(place(box(0.2, 0.14, 0.06, emissive('#ff3020', 0.9)), { x: sx * 0.8, y: 1.45, z: F - 0.05 }));
    g.add(place(cylinder(0.17, 0.17, 0.35, dark, 8), { x: sx * 0.85, y: 0.75, z: F + 0.15, rx: 90 }));
    // side stripe and cab-side window
    g.add(place(box(0.04, 0.22, L - 0.6, mat(PALETTE.white)), { x: sx * 1.26, y: 1.55, z: -0.3 }));
    g.add(place(box(0.04, 0.6, 0.8, win), { x: sx * 1.27, y: 2.25, z: F - 1.0 }));
    // grilles along the engine room
    for (let k = 0; k < 3; k++) g.add(place(box(0.04, 0.5, 0.6, dark), { x: sx * 1.27, y: 2.05, z: F - 2.2 - k * 0.9 }));
  }
  g.add(place(box(1.6, 0.5, 0.3, dark), { y: 0.7, z: F + 0.05 })); // coupler/valance
  return g;
}

// colour-light signal facing +Z
function signal(h = 3.6) {
  const pole = metal(PALETTE.lightGrey);
  const g = group(
    place(box(0.5, 0.25, 0.5, mat(PALETTE.concrete)), {}),
    place(cylinder(0.08, 0.09, h, pole, 8), { y: 0.25 }),
    place(box(0.5, 1.15, 0.3, mat(PALETTE.black)), { y: h - 0.8 }),
    place(box(0.62, 0.7, 0.04, mat(PALETTE.black)), { y: h - 0.6, z: -0.17 }),
    place(box(0.2, 0.2, 0.06, emissive('#22e040', 1.6)), { y: h - 0.15, z: 0.16 }),
    place(box(0.2, 0.2, 0.06, mat('#5a3d10')), { y: h - 0.45, z: 0.16 }),
    place(box(0.2, 0.2, 0.06, mat('#4a1410')), { y: h - 0.75, z: 0.16 }),
  );
  for (const y of [h - 0.15, h - 0.45, h - 0.75]) g.add(place(box(0.26, 0.05, 0.14, mat(PALETTE.black)), { y: y + 0.2, z: 0.2 }));
  // ladder
  g.add(place(box(0.04, h - 1.0, 0.04, pole), { x: 0.14, y: 0.25, z: -0.15 }));
  return g;
}

function cabinet() {
  const m = mat('#5f7a5a');
  return group(
    box(0.9, 1.15, 0.55, m),
    place(box(0.98, 0.07, 0.63, mat(shade('#5f7a5a', -0.2))), { y: 1.15 }),
    place(box(0.38, 0.95, 0.03, mat(shade('#5f7a5a', 0.1))), { x: -0.2, y: 0.1, z: 0.28 }),
    place(box(0.38, 0.95, 0.03, mat(shade('#5f7a5a', 0.1))), { x: 0.2, y: 0.1, z: 0.28 }),
    place(box(0.15, 0.15, 0.04, mat(PALETTE.yellow)), { x: 0.2, y: 0.85, z: 0.3 }),
  );
}

function postSign(text, bg, fg) {
  return group(
    cylinder(0.04, 0.04, 1.3, metal(PALETTE.darkGrey), 6),
    place(sign({ text, w: 0.55, h: 0.55, bg, fg, depth: 0.05 }), { y: 1.0 }),
  );
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));
  g.add(terrain(y0));
  g.add(portal(y0));
  g.add(tracks(y0));

  // locomotive emerging on the right-hand track
  const locoL = 5.8, nose = 2.5;
  g.add(place(locomotive(locoL), { x: TRACK_X, y: y0 + 0.49, z: nose - locoL / 2 }));

  // lineside furniture in front of the wing walls
  const on = (x, z) => y0 + terrainH(x, z);
  g.add(place(signal(), { x: -4.5, y: on(-4.5, 4.5) - 0.05, z: 4.5 }));
  g.add(place(cabinet(), { x: 4.45, y: on(4.45, 4.55) - 0.03, z: 4.55, ry: -20 }));
  g.add(place(postSign('W', '#ffffff', '#111111'), { x: -3.55, y: y0, z: 4.6 }));
  g.add(place(postSign('40', PALETTE.yellow, '#111111'), { x: 3.55, y: y0, z: 3.2 }));

  // the wooded hill above the portal
  const trees = [
    ['cone', -3.3, -2.4, 4.2, 3], ['round', 0.3, -3.4, 4.4, 5], ['cone', 1.4, -2.5, 3.6, 8],
    ['round', 3.2, -3.3, 4.0, 9], ['poplar', 3.9, -1.4, 4.5, 12], ['round', -3.6, -4.0, 2.6, 14],
    ['cone', 1.9, -4.2, 3.0, 15],
  ];
  for (const [kind, x, z, h, seed] of trees) g.add(place(tree({ kind, h, seed }), { x, y: on(x, z) - 0.1, z }));
  // brick ventilation shaft poking out of the hill above the bore
  const sx = -1.5, sz = -3.4, sy = on(sx, sz) - 0.4;
  const shaftM = surface('brick', PALETTE.brickDark, { size: 1.2 });
  g.add(place(cylinder(0.75, 0.8, 1.9, shaftM, 12), { x: sx, y: sy, z: sz }));
  g.add(place(cylinder(0.85, 0.85, 0.16, mat(shade(PALETTE.stone, 0.08)), 12), { x: sx, y: sy + 1.9, z: sz }));
  g.add(place(cylinder(0.6, 0.6, 0.05, mat('#161616'), 12), { x: sx, y: sy + 2.02, z: sz }));
  for (let k = 0; k < 4; k++) g.add(place(box(1.3, 0.04, 0.06, metal(PALETTE.darkGrey)), { x: sx, y: sy + 2.07, z: sz - 0.45 + k * 0.3 }));
  const bushes = [
    [-4.5, 0.6, 1.1], [4.6, 1.4, 1.0], [-4.6, 2.6, 0.9], [4.7, 3.0, 0.8], [-2.2, -1.6, 1.0],
    [2.6, -1.5, 0.9], [-0.4, -2.2, 0.8], [-4.6, -0.8, 1.0], [4.5, -0.5, 1.1],
  ];
  bushes.forEach(([x, z, h], i) => g.add(place(tree({ kind: 'bush', h, seed: 30 + i }), { x, y: on(x, z) - 0.05, z })));
  return g;
}

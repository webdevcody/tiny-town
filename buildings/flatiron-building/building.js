import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, cylinder, cone, place, group, extrude, extrudeGeometry, ShapeBuilder,
  mat, metal, emissive, textured, surface, signTexture,
  tree, streetLamp, bench, car, flag, facadeBlock,
} from '../../src/lib/index.js';
import {
  STONE, shaftTexture, baseTexture, crownTexture, shopTexture, friezeTexture, balustradeTexture, clockTexture,
} from './textures.js';

// ---------------------------------------------------------------------------
// wedge geometry helpers

// Triangle with its sharp corner at +Z rounded off: back corners (±B, zb),
// tip at (0, zt), tip rounded with radius r.
function wedge(B, zb, zt, r, n = 5, chamfer = 0) {
  const alpha = Math.atan(B / (zt - zb));
  const t = r / Math.tan(alpha);
  const L = Math.hypot(B, zt - zb);
  const uR = [B / L, (zb - zt) / L];
  const PR = [uR[0] * t, zt + uR[1] * t];
  const cz = zt - r / Math.sin(alpha);
  const a0 = Math.atan2(PR[1] - cz, PR[0]);
  // back corners optionally chamfered so the cornice mitres stay inside the tile
  const c = chamfer, sx = c * Math.sin(alpha), sz = c * Math.cos(alpha);
  const pts = c ? [[-B + sx, zb + sz], [-B + c, zb], [B - c, zb], [B - sx, zb + sz]] : [[-B, zb], [B, zb]];
  for (let i = 0; i <= n; i++) {
    const a = a0 + ((Math.PI - 2 * a0) * i) / n;
    pts.push([Math.cos(a) * r, cz + Math.sin(a) * r]);
  }
  return pts;
}

function centroid(pts) {
  return pts.reduce((c, p) => [c[0] + p[0] / pts.length, c[1] + p[1] / pts.length], [0, 0]);
}

// outward unit normals of every edge i (pts[i] -> pts[i+1])
function edgeNormals(pts) {
  const c = centroid(pts);
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const dx = q[0] - p[0], dz = q[1] - p[1];
    const len = Math.hypot(dx, dz);
    let n = [dz / len, -dx / len];
    const mx = (p[0] + q[0]) / 2 - c[0], mz = (p[1] + q[1]) / 2 - c[1];
    if (n[0] * mx + n[1] * mz < 0) n = [-n[0], -n[1]];
    return n;
  });
}

// grow a convex polygon outwards by d (mitred corners)
function offset(pts, d) {
  const ns = edgeNormals(pts);
  return pts.map((p, i) => {
    const a = ns[(i - 1 + pts.length) % pts.length], b = ns[i];
    const k = d / (1 + a[0] * b[0] + a[1] * b[1]);
    return [p[0] + (a[0] + b[0]) * k, p[1] + (a[1] + b[1]) * k];
  });
}

// iterate edges with position, length and the rotation that turns local +Z outward
function edges(pts) {
  const ns = edgeNormals(pts);
  return pts.map((p, i) => {
    const q = pts[(i + 1) % pts.length];
    const n = ns[i];
    return {
      p, q, n,
      len: Math.hypot(q[0] - p[0], q[1] - p[1]),
      dir: [(q[0] - p[0]), (q[1] - p[1])].map((v) => v / Math.hypot(q[0] - p[0], q[1] - p[1])),
      ry: THREE.MathUtils.radToDeg(Math.atan2(n[0], n[1])),
    };
  });
}

// Extruded polygon whose walls carry a window-cell texture: one cell per bay x storey.
function wedgePrism(pts, { tex, floors, floorHeight, bay, cols = 4, rows = 2, roof = STONE.trim }) {
  const h = floors * floorHeight;
  const geom = extrudeGeometry(pts, h, {
    wallUV: (len) => [(len > bay * 0.7 ? Math.round(len / bay) : len / bay) / cols, floors / rows],
  });
  const roofM = mat(roof);
  return new THREE.Mesh(geom, [textured(tex), roofM, roofM]);
}

// plain stone slab following the polygon (bands, cornice)
function slab(pts, h, color, top) {
  return extrude(pts, h, mat(color), top ? mat(top) : undefined);
}

// open ring of walls along a polygon outline (balustrade), texture repeats every `rep` metres
function ringWall(pts, h, tex, rep) {
  const b = new ShapeBuilder();
  for (const e of edges(pts)) {
    const [x1, z1] = e.p, [x2, z2] = e.q;
    const u = e.len / rep;
    b.quadUV([x1, 0, z1], [x2, 0, z2], [x2, h, z2], [x1, h, z1], [[0, 0], [u, 0], [u, 1], [0, 1]], 0);
  }
  return new THREE.Mesh(b.build(), textured(tex, { side: THREE.DoubleSide }));
}

// box with 0..1 UVs on every face (for signs / clock faces), base at y = 0
function faceBox(w, h, d, faceMat, sideMat) {
  const g = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(g, [sideMat, sideMat, sideMat, sideMat, faceMat, faceMat]);
}

// ---------------------------------------------------------------------------
// props

function cafeTable(seed) {
  const g = new THREE.Group();
  const green = mat('#2f6b3a');
  const iron = mat(PALETTE.darkGrey);
  g.add(cylinder(0.04, 0.04, 2.2, iron, 5));
  g.add(place(cone(1.1, 0.5, green, 8), { y: 1.9 }));
  g.add(place(cylinder(0.35, 0.35, 0.05, mat(PALETTE.white), 8), { y: 0.72 }));
  g.add(cylinder(0.05, 0.05, 0.72, iron, 5));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + seed;
    const c = group(
      place(box(0.38, 0.05, 0.38, '#3a7d4c'), { y: 0.42 }),
      place(box(0.38, 0.4, 0.05, '#3a7d4c'), { y: 0.45, z: -0.17 }),
      place(box(0.3, 0.42, 0.3, iron), { y: 0 })
    );
    g.add(place(c, { x: Math.sin(a) * 0.7, z: Math.cos(a) * 0.7, ry: THREE.MathUtils.radToDeg(a) + 180 }));
  }
  return g;
}

function planter(w, d, seed) {
  return group(
    box(w, 0.5, d, mat(STONE.base)),
    place(box(w - 0.15, 0.06, d - 0.15, mat(PALETTE.dirt)), { y: 0.5 }),
    place(tree({ kind: 'bush', h: 0.9, seed }), { y: 0.5, x: -w / 4 }),
    place(tree({ kind: 'bush', h: 0.8, seed: seed + 1, color: PALETTE.foliageLight }), { y: 0.5, x: w / 4 })
  );
}

function newsstand() {
  const g = new THREE.Group();
  const green = mat(STONE.green);
  g.add(box(1.9, 2.1, 1.1, green));
  g.add(place(box(2.2, 0.12, 1.4, mat(shade2(STONE.green))), { y: 2.1, z: 0.1 }));
  // magazine racks on the front
  const cols = [PALETTE.red, PALETTE.yellow, PALETTE.blue, '#ffffff', PALETTE.orange, PALETTE.purple];
  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 2; j++) {
      g.add(place(box(0.24, 0.32, 0.05, cols[(i + j * 2) % cols.length]), { x: -0.7 + i * 0.28, y: 0.9 + j * 0.42, z: 0.57 }));
    }
  }
  g.add(place(box(1.7, 0.18, 0.06, emissive(PALETTE.windowLit, 0.4)), { y: 1.8, z: 0.57 }));
  return g;
}

function shade2(c) {
  return new THREE.Color(c).multiplyScalar(0.7).getStyle();
}

function sidewalkClock() {
  const iron = metal(STONE.green, { roughness: 0.5 });
  const gold = mat('#d9b54a', { metalness: 0.4, roughness: 0.4 });
  const face = textured(clockTexture());
  return group(
    cylinder(0.25, 0.32, 0.4, iron, 8),
    place(cylinder(0.11, 0.14, 3.2, iron, 8), { y: 0.4 }),
    place(box(0.95, 0.95, 0.35, iron), { y: 3.55 }),
    place(faceBox(0.85, 0.85, 0.4, face, iron), { y: 3.6 }),
    place(cone(0.3, 0.35, gold, 8), { y: 4.5 }),
  );
}

function waterTower() {
  const wood = surface('planks', '#8a6040', { size: 1 });
  const steel = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  const legH = 1.8, R = 1.05;
  for (const [x, z] of [[-0.7, -0.7], [0.7, -0.7], [0.7, 0.7], [-0.7, 0.7]]) g.add(place(box(0.14, legH, 0.14, steel), { x, z }));
  g.add(place(box(1.8, 0.15, 1.8, steel), { y: legH }));
  g.add(place(cylinder(R, R * 1.05, 2.3, wood, 14), { y: legH + 0.15 }));
  for (const y of [0.5, 1.2, 1.9]) g.add(place(cylinder(R * 1.07, R * 1.07, 0.07, steel, 14), { y: legH + 0.15 + y }));
  g.add(place(cone(R * 1.1, 0.9, mat('#5b4a3a'), 14), { y: legH + 2.45 }));
  g.add(place(sphere2(), { y: legH + 3.3 }));
  return g;
}

function sphere2() {
  return cylinder(0.08, 0.08, 0.25, metal(PALETTE.steelDark), 6);
}

// ---------------------------------------------------------------------------

// Floor heights are a touch under FLOOR so the wedge stays chunky, not needle-like.
const GF = 3.4, BASE_FH = 2.6, FH = 2.5;

// The limestone wedge itself, in local coordinates with the prow pointing to +Z.
function flatiron() {
  const t = new THREE.Group();
  const P = wedge(3.75, -2.75, 5.45, 0.6, 5, 0.9);

  // --- ground floor shops + the one-storey "cowcatcher" shop wrapping the prow
  let y = 0;
  t.add(wedgePrism(P, { tex: shopTexture(), floors: 1, floorHeight: GF, bay: 1.5, rows: 1 }));
  const cow = wedge(1.85, 2.75, 6.7, 0.4, 5);
  t.add(wedgePrism(cow, { tex: shopTexture(), floors: 1, floorHeight: 2.8, bay: 1.5, rows: 1 }));
  t.add(place(slab(offset(cow, 0.12), 0.3, STONE.trim, '#6b6457'), { y: 2.8 }));
  // name sign standing on the cowcatcher roof against the prow
  const signTex = signTexture('FLATIRON', { bg: STONE.green, fg: '#f3e2a6', width: 256, height: 72, border: '#d9b54a' });
  const signM = textured(signTex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: signTex });
  t.add(place(faceBox(1.6, 0.45, 0.08, signM, mat(STONE.green)), { y: 3.25, z: 5.9 }));
  for (const x of [-0.55, 0.55]) t.add(place(box(0.06, 0.2, 0.06, mat(STONE.bronze)), { x, y: 3.1, z: 5.9 }));
  y += GF;
  t.add(place(slab(offset(P, 0.14), 0.3, STONE.trim), { y }));
  y += 0.3;

  // --- rusticated base: storeys 2-3
  t.add(place(wedgePrism(P, { tex: baseTexture(), floors: 2, floorHeight: BASE_FH, bay: 1.5 }), { y }));
  y += 2 * BASE_FH;
  t.add(place(slab(offset(P, 0.18), 0.35, STONE.trim), { y }));
  y += 0.35;

  // --- shaft: storeys 4-9 with shallow oriel bays rippling along the long sides
  t.add(place(wedgePrism(P, { tex: shaftTexture(), floors: 6, floorHeight: FH, bay: 1.5 }), { y }));
  const sides = edges(P).filter((e) => e.len > 6 && Math.abs(e.n[0]) > 0.5);
  const oriel = [[-1.5, 0], [1.5, 0], [1.15, 0.4], [-1.15, 0.4]];
  for (const e of sides) {
    for (const f of [0.32, 0.64]) {
      const x = e.p[0] + e.dir[0] * e.len * f, z = e.p[1] + e.dir[1] * e.len * f;
      t.add(place(wedgePrism(oriel, { tex: shaftTexture(), floors: 6, floorHeight: FH, bay: 1.5 }), { x, y, z, ry: e.ry }));
      t.add(place(extrude([[-1.6, -0.1], [1.6, -0.1], [1.22, 0.5], [-1.22, 0.5]], 0.25, mat(STONE.trim)), { x, y: y - 0.25, z, ry: e.ry }));
    }
  }
  y += 6 * FH;
  t.add(place(slab(offset(P, 0.45), 0.4, STONE.trim, STONE.shaft), { y }));
  y += 0.4;

  // --- crown: storeys 10-12 with arched windows
  t.add(place(wedgePrism(P, { tex: crownTexture(), floors: 3, floorHeight: FH, bay: 1.5 }), { y }));
  y += 3 * FH;

  // --- frieze, brackets and the deep overhanging cornice
  const friezeH = 1.0;
  const fr = extrudeGeometry(offset(P, 0.06), friezeH, { wallUV: (len) => [len / 1.2, 1] });
  t.add(place(new THREE.Mesh(fr, [textured(friezeTexture()), mat(STONE.trim), mat(STONE.trim)]), { y }));
  const bracketM = mat(shade2(STONE.trim));
  for (const e of edges(P)) {
    if (e.len < 2) continue;
    const n = Math.floor((e.len - 0.6) / 0.85);
    for (let i = 0; i <= n; i++) {
      const s = 0.3 + ((e.len - 0.6) * i) / Math.max(1, n);
      const x = e.p[0] + e.dir[0] * s + e.n[0] * 0.42, z = e.p[1] + e.dir[1] * s + e.n[1] * 0.42;
      t.add(place(box(0.2, 0.75, 0.72, bracketM), { x, y: y + friezeH - 0.75, z, ry: e.ry }));
    }
  }
  y += friezeH;
  t.add(place(slab(offset(P, 0.8), 0.35, shade2(STONE.trim), STONE.trim), { y }));
  t.add(place(slab(offset(P, 0.9), 0.25, STONE.trim, STONE.trim), { y: y + 0.35 }));
  y += 0.6;

  // --- attic balustrade and roof deck
  t.add(place(extrude(offset(P, 0.45), 0.06, mat('#77746c')), { y }));
  t.add(place(ringWall(offset(P, 0.6), 0.85, balustradeTexture(), 0.6), { y }));
  for (const e of edges(offset(P, 0.6))) {
    const mx = (e.p[0] + e.q[0]) / 2, mz = (e.p[1] + e.q[1]) / 2;
    t.add(place(box(e.len + 0.25, 0.14, 0.32, mat(STONE.trim)), { x: mx, y: y + 0.85, z: mz, ry: e.ry }));
    t.add(place(box(0.34, 1.0, 0.34, mat(STONE.trim)), { x: e.p[0], y, z: e.p[1] }));
  }
  const roofY = y + 0.06;

  // rooftop: limestone penthouse, wooden water tank, lift room, flag over the prow
  t.add(place(facadeBlock({ w: 2.8, d: 2.0, floors: 1, style: 'punched', wall: STONE.shaft, glass: STONE.glass, frame: STONE.bronze, bay: 1.2, seed: 3, roof: '#6b6457' }), { x: 1.0, y: roofY, z: -1.3 }));
  t.add(place(box(3.0, 0.2, 2.2, mat(STONE.trim)), { x: 1.0, y: roofY + 3, z: -1.3 }));
  t.add(place(waterTower(), { x: -1.7, y: roofY, z: -1.5 }));
  t.add(place(box(1.1, 1.4, 1.1, mat('#8f8a80')), { x: 0, y: roofY, z: 2.0 }));
  t.add(place(flag({ h: 4.5, color: PALETTE.red, color2: PALETTE.white }), { x: 0, y: roofY, z: 4.9, ry: -90 }));
  return t;
}

// 1x1 tile (10 x 10 m). The wedge runs corner to corner: its sharp prow points
// at the front-right (+X/+Z) street corner, the broad back at the rear corner.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));
  g.add(place(flatiron(), { y: y0, ry: 45 }));

  // café plaza in the front-left corner (Flatiron plaza)
  g.add(place(cafeTable(0.3), { x: -3.4, y: y0, z: 3.7 }));
  g.add(place(cafeTable(1.1), { x: -1.4, y: y0, z: 3.85 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 12 }), { x: -3.95, y: y0, z: 2.0 }));
  g.add(place(planter(1.8, 0.8, 7), { x: -4.0, y: y0, z: 4.4 }));
  // Fifth-Avenue style sidewalk clock and lamps at the prow
  g.add(place(sidewalkClock(), { x: 1.7, y: y0, z: 4.55 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: 4.6, y: y0, z: 1.5, ry: 90 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: 0.2, y: y0, z: 4.7, ry: 180 }));

  // kerbside lay-by with a yellow cab, newsstand and a street tree on the right
  g.add(place(extrude([[3.5, -5], [5, -5], [5, -0.2], [3.5, -0.2]], 0.04, mat(PALETTE.asphalt)), { y: y0 }));
  g.add(place(box(0.15, 0.12, 4.8, mat(STONE.base)), { x: 3.45, y: y0, z: -2.6 }));
  g.add(place(car({ kind: 'taxi' }), { x: 4.25, y: y0 + 0.04, z: -2.6, ry: 90 }));
  g.add(place(newsstand(), { x: 2.4, y: y0, z: -4.25 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 5 }), { x: 3.95, y: y0, z: 0.7 }));

  // back corner: bench, tree, lamps
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 9 }), { x: -3.75, y: y0, z: -3.75 }));
  g.add(place(bench({ w: 1.5 }), { x: -2.2, y: y0, z: -3.3, ry: -135 }));
  g.add(place(bench({ w: 1.5 }), { x: -3.3, y: y0, z: -2.2, ry: -135 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: -0.8, y: y0, z: -4.7, ry: 180 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: -4.7, y: y0, z: -0.8, ry: -90 }));
  return g;
}

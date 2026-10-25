// Local helpers for the Mediterranean Villa (src/lib is frozen).
import * as THREE from 'three';
import { PALETTE, ShapeBuilder, box, cylinder, cone, sphere, pipe, place, group, mat, tree } from '../../src/lib/index.js';

/**
 * Wall with a row of round arches (a loggia arcade), facing +z, base centred.
 *   archWall({ n, archW, pier, spring, h, t, material })
 * Total width = n * archW + (n + 1) * pier. Returns a Group with userData.w.
 */
export function archWall({ n = 3, archW = 2, pier = 0.5, spring = 1.9, h = 3, t = 0.4, material, capital }) {
  const m = typeof material === 'string' ? mat(material) : material ?? mat(PALETTE.white);
  const w = n * archW + (n + 1) * pier;
  const r = archW / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, spring);
  for (let i = 0; i < n; i++) {
    const cx = -w / 2 + pier + r + i * (archW + pier);
    s.lineTo(cx - r, spring);
    s.absarc(cx, spring, r, Math.PI, 0, true);
  }
  s.lineTo(w / 2, spring);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -t / 2);
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, m));
  const capM = capital ? mat(capital) : m;
  for (let i = 0; i <= n; i++) {
    const x = -w / 2 + pier / 2 + i * (archW + pier);
    g.add(place(box(pier, spring, t, m), { x }));
    g.add(place(box(pier + 0.16, 0.14, t + 0.16, capM), { x, y: spring - 0.14 }));
    g.add(place(box(pier + 0.12, 0.12, t + 0.12, capM), { x }));
  }
  g.userData.w = w;
  return g;
}

/** Double-sided palm frond lying along +x, drooping at the tip. */
function frondGeometry(L, wid) {
  const b = new ShapeBuilder();
  const base = [0, 0, 0];
  const mid = [L * 0.5, L * 0.18, 0];
  const midL = [L * 0.5, L * 0.12, wid];
  const midR = [L * 0.5, L * 0.12, -wid];
  const tip = [L, -L * 0.22, 0];
  b.tri(base, midL, mid);
  b.tri(base, mid, midR);
  b.tri(midL, tip, mid);
  b.tri(mid, tip, midR);
  return b.build();
}

/**
 * Date/fan palm with a slightly curved ringed trunk and drooping fronds.
 *   palm({ h = 7, lean = 0.6, dir = 0, fronds = 9, seed })   dir in degrees
 */
export function palm({ h = 7, lean = 0.6, dir = 0, fronds = 9, seed = 1, color = '#4e8f2e' } = {}) {
  const g = new THREE.Group();
  const trunkA = mat('#8a6a46');
  const trunkB = mat('#6e5236');
  const a = THREE.MathUtils.degToRad(dir);
  const segs = 6;
  const pts = [];
  for (let i = 0; i <= segs; i++) {
    const t = i / segs;
    const off = lean * t * t;
    pts.push([Math.cos(a) * off, h * t, Math.sin(a) * off]);
  }
  for (let i = 0; i < segs; i++) {
    const rad = 0.24 - 0.08 * (i / segs);
    g.add(pipe(pts[i], pts[i + 1], rad, i % 2 ? trunkA : trunkB));
  }
  const top = pts[segs];
  const leaf = mat(color, { side: THREE.DoubleSide });
  const leaf2 = mat('#3d7a26', { side: THREE.DoubleSide });
  const L = h * 0.36;
  for (let i = 0; i < fronds; i++) {
    const f = new THREE.Mesh(frondGeometry(L * (0.85 + ((i * 37 + seed * 13) % 10) / 40), L * 0.13), i % 2 ? leaf : leaf2);
    f.position.set(top[0], top[1], top[2]);
    f.rotation.order = 'YZX';
    f.rotation.y = (i / fronds) * Math.PI * 2 + seed * 0.7;
    f.rotation.z = (i % 3 === 0 ? 0.25 : -0.05);
    g.add(f);
  }
  // a few young fronds pointing up and the coconut/date cluster
  for (let i = 0; i < 3; i++) {
    const f = new THREE.Mesh(frondGeometry(L * 0.6, L * 0.1), leaf);
    f.position.set(top[0], top[1], top[2]);
    f.rotation.order = 'YZX';
    f.rotation.y = (i / 3) * Math.PI * 2 + seed;
    f.rotation.z = 0.9;
    g.add(f);
  }
  g.add(place(sphere(0.32, mat('#a8742e'), 6), { x: top[0], y: top[1] - 0.55, z: top[2] }));
  return g;
}

/** Italian cypress: tall dark spindle. */
export function cypress({ h = 6 } = {}) {
  const leaf = mat('#2c5422');
  const g = new THREE.Group();
  g.add(cylinder(0.12, 0.15, 0.6, mat(PALETTE.trunk), 6));
  const s = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), leaf);
  s.scale.set(h * 0.12, h * 0.5, h * 0.12);
  s.position.y = h * 0.5 + 0.3;
  g.add(s);
  return g;
}

/** Olive tree: grey-green round crown on a gnarled trunk. */
export function olive({ h = 4, seed = 1 } = {}) {
  const g = new THREE.Group();
  const trunkM = mat('#6b5a44');
  g.add(pipe([0, 0, 0], [0.25, h * 0.3, 0.1], 0.16, trunkM));
  g.add(pipe([0.25, h * 0.3, 0.1], [-0.2, h * 0.5, 0.05], 0.12, trunkM));
  const leafA = mat('#86996a');
  const leafB = mat('#6f8556');
  const lobes = [[0, 0.62, 0, 0.36], [0.42, 0.55, 0.2, 0.26], [-0.38, 0.56, -0.15, 0.27], [0.05, 0.56, -0.42, 0.24], [-0.1, 0.78, 0.25, 0.22]];
  lobes.forEach(([x, y, z, r], i) => {
    const l = new THREE.Mesh(new THREE.IcosahedronGeometry(h * r * 0.7, 1), i % 2 ? leafB : leafA);
    l.scale.set(1, 0.7, 1);
    l.position.set(x * h * 0.45, y * h, z * h * 0.45);
    l.rotation.y = seed + i;
    g.add(l);
  });
  return g;
}

/** Bougainvillea clump (magenta flowering shrub). */
export function bougainvillea({ s = 1, seed = 1 } = {}) {
  const g = new THREE.Group();
  const pink = mat('#cf3b8e');
  const leaf = mat(PALETTE.foliageDark);
  const b1 = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75 * s, 0), leaf);
  b1.scale.set(1.2, 0.9, 0.8);
  b1.position.y = 0.6 * s;
  g.add(b1);
  for (let i = 0; i < 3; i++) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(0.5 * s, 0), pink);
    p.position.set((i - 1) * 0.55 * s, (0.95 + (i % 2) * 0.25) * s, ((seed + i) % 2 ? 0.2 : -0.1) * s);
    p.rotation.set(seed + i, i, 0);
    g.add(p);
  }
  return g;
}

/** Terracotta pot with a shrub or a small lemon tree. */
export function pot({ plant = 'bush', seed = 1 } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(0.38, 0.26, 0.6, mat(PALETTE.terracotta), 8));
  g.add(place(cylinder(0.42, 0.42, 0.08, mat('#a84a26'), 8), { y: 0.56 }));
  if (plant === 'lemon') {
    g.add(place(cylinder(0.05, 0.06, 0.8, mat(PALETTE.trunk), 5), { y: 0.6 }));
    g.add(place(sphere(0.5, mat(PALETTE.foliage), 6), { y: 1.2 }));
    for (let i = 0; i < 4; i++) {
      const an = i * 1.6 + seed;
      g.add(place(sphere(0.09, mat(PALETTE.yellow), 5), { x: Math.cos(an) * 0.42, y: 1.45 + (i % 2) * 0.2, z: Math.sin(an) * 0.42 }));
    }
  } else {
    g.add(place(tree({ kind: 'bush', h: 0.9, seed, color: PALETTE.foliage }), { y: 0.55 }));
  }
  return g;
}

/** Sun lounger, length along z, head at -z. */
export function lounger({ color = PALETTE.white, cushion = '#2f7fae' } = {}) {
  const f = mat(color);
  const c = mat(cushion);
  return group(
    place(box(0.7, 0.3, 1.9, f), { z: 0.15 }),
    place(box(0.6, 0.06, 1.3, c), { y: 0.3, z: 0.45 }),
    place(box(0.6, 0.08, 0.7, c), { y: 0.42, z: -0.55, rx: -35 })
  );
}

/** Beach/garden parasol with a striped look (two-tone cone). */
export function parasol({ r = 1.4, h = 2.4, color = PALETTE.white, color2 = '#2f7fae' } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(0.25, 0.3, 0.12, mat(PALETTE.grey), 8));
  g.add(cylinder(0.04, 0.04, h, mat(PALETTE.wood), 5));
  g.add(place(cone(r, 0.55, mat(color2), 8), { y: h - 0.35 }));
  g.add(place(cone(r * 0.55, 0.32, mat(color), 8), { y: h - 0.13 }));
  g.add(place(box(r * 2.05, 0.08, 0.12, mat(color2)), { y: h - 0.38, ry: 45 }));
  return g;
}

/** Vine-covered timber pergola, w along x, d along z. */
export function pergola({ w = 4, d = 4, h = 2.6 } = {}) {
  const wood = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.3, h, 0.3, mat(PALETTE.white)), { x: sx * (w / 2 - 0.15), z: sz * (d / 2 - 0.15) }));
  }
  for (const sz of [-1, 1]) g.add(place(box(w + 0.4, 0.22, 0.18, wood), { y: h, z: sz * (d / 2 - 0.15) }));
  const n = Math.round(w / 0.6);
  for (let i = 0; i <= n; i++) {
    g.add(place(box(0.12, 0.16, d + 0.5, wood), { x: -w / 2 + (w * i) / n, y: h + 0.22 }));
  }
  // vine clumps
  const vine = mat('#4f8a2a');
  const grape = mat('#5b3a72');
  for (let i = 0; i < 6; i++) {
    const x = -w / 2 + 0.5 + ((i * 0.53) % 1) * (w - 1);
    const z = -d / 2 + 0.4 + (i / 5) * (d - 0.8);
    const v = new THREE.Mesh(new THREE.IcosahedronGeometry(0.75, 0), vine);
    v.scale.set(1.3, 0.35, 1);
    v.position.set(x, h + 0.42, z);
    g.add(v);
    if (i % 2 === 0) g.add(place(sphere(0.14, grape, 5), { x: x + 0.3, y: h - 0.05, z }));
  }
  return g;
}

/** Round stone fountain with a basin, pedestal and two bowls. */
export function fountain({ r = 1.2 } = {}) {
  const stone = mat(PALETTE.white);
  const g = new THREE.Group();
  g.add(cylinder(r, r + 0.05, 0.5, stone, 16));
  g.add(place(cylinder(r - 0.18, r - 0.18, 0.05, mat(PALETTE.pool, { roughness: 0.15, metalness: 0.2 }), 16), { y: 0.42 }));
  g.add(cylinder(0.18, 0.25, 1.2, stone, 8));
  g.add(place(cylinder(0.65, 0.25, 0.25, stone, 12), { y: 1.1 }));
  g.add(place(cylinder(0.55, 0.55, 0.04, mat(PALETTE.pool), 12), { y: 1.33 }));
  g.add(place(cylinder(0.1, 0.12, 0.5, stone, 6), { y: 1.3 }));
  g.add(place(cylinder(0.32, 0.12, 0.15, stone, 10), { y: 1.75 }));
  g.add(place(sphere(0.12, mat(PALETTE.pool), 6), { y: 1.85 }));
  return g;
}

/** Wrought-iron gate leaf, w wide along +x from its hinge (origin). */
export function gateLeaf({ w = 1.7, h = 1.5 } = {}) {
  const iron = mat(PALETTE.black);
  const g = new THREE.Group();
  g.add(place(box(w, 0.07, 0.07, iron), { x: w / 2, y: 0.12 }));
  g.add(place(box(w, 0.07, 0.07, iron), { x: w / 2, y: h - 0.1 }));
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const x = (w * i) / n;
    const bh = h + 0.15 * Math.sin((i / n) * Math.PI);
    g.add(place(box(0.05, bh, 0.05, iron), { x }));
    g.add(place(cone(0.06, 0.15, iron, 4), { x, y: bh }));
  }
  return g;
}

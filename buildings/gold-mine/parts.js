import * as THREE from 'three';
import {
  PALETTE, box, place, group, beam, cylinder, taperedBlock, mat, metal, textured, signTexture,
} from '../../src/lib/index.js';

// Local helpers for the Gold Mine: rocky hill, rails, ore carts, timber trestles, big signs.

const smooth = (t) => {
  const c = Math.min(1, Math.max(0, t));
  return c * c * (3 - 2 * c);
};

// deterministic 2D hash noise in 0..1
function hash(x, z) {
  const s = Math.sin(x * 127.1 + z * 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * Low-poly heightfield hill with flat-shaded, per-triangle colours (rock on steep faces,
 * scrub grass on gentle ones) plus rock skirts along the footprint edges.
 *   rockyHill({ w, d, step, height: (x, z) => metres, colorAt: (x, z, h, steep, rnd) => colour })
 */
export function rockyHill({ w, d, step = 0.5, height, colorAt }) {
  const nx = Math.round(w / step), nz = Math.round(d / step);
  const x0 = -w / 2, z0 = -d / 2;
  const H = [];
  for (let j = 0; j <= nz; j++) {
    const row = [];
    for (let i = 0; i <= nx; i++) row.push(Math.max(0, height(x0 + i * step, z0 + j * step)));
    H.push(row);
  }
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const pushTri = (a, b, cc, k) => {
    e1.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
    e2.set(cc[0] - a[0], cc[1] - a[1], cc[2] - a[2]);
    n.crossVectors(e1, e2).normalize();
    const avgH = (a[1] + b[1] + cc[1]) / 3;
    const steep = 1 - Math.abs(n.y);
    c.set(colorAt((a[0] + b[0] + cc[0]) / 3, (a[2] + b[2] + cc[2]) / 3, avgH, steep, hash(k, avgH * 3.1)));
    for (const p of [a, b, cc]) {
      pos.push(p[0], p[1], p[2]);
      col.push(c.r, c.g, c.b);
    }
  };
  let k = 0;
  for (let j = 0; j < nz; j++) {
    for (let i = 0; i < nx; i++) {
      const h00 = H[j][i], h10 = H[j][i + 1], h01 = H[j + 1][i], h11 = H[j + 1][i + 1];
      const xa = x0 + i * step, xb = xa + step, za = z0 + j * step, zb = za + step;
      const p00 = [xa, h00, za], p10 = [xb, h10, za], p01 = [xa, h01, zb], p11 = [xb, h11, zb];
      k++;
      // alternate the diagonal for a less regular look
      const flip = (i + j) % 2 === 0;
      const tris = flip
        ? [[p00, p01, p11], [p00, p11, p10]]
        : [[p00, p01, p10], [p10, p01, p11]];
      for (const t of tris) {
        if (t[0][1] < 0.02 && t[1][1] < 0.02 && t[2][1] < 0.02) continue;
        pushTri(t[0], t[1], t[2], k * 2 + (t === tris[0] ? 0 : 1));
      }
    }
  }
  // skirts along the 4 boundary edges (only where the hill is above ground)
  const skirt = (a, b, ha, hb, out, kk) => {
    if (ha < 0.02 && hb < 0.02) return;
    const A0 = [a[0], 0, a[1]], B0 = [b[0], 0, b[1]], A1 = [a[0], ha, a[1]], B1 = [b[0], hb, b[1]];
    // wind so the normal points outwards
    const quad = out ? [A0, B0, B1, A1] : [B0, A0, A1, B1];
    pushTri(quad[0], quad[1], quad[2], kk);
    pushTri(quad[0], quad[2], quad[3], kk + 1);
  };
  for (let i = 0; i < nx; i++) {
    const xa = x0 + i * step, xb = xa + step;
    skirt([xa, z0], [xb, z0], H[0][i], H[0][i + 1], false, 9000 + i * 2);
    skirt([xa, -z0], [xb, -z0], H[nz][i], H[nz][i + 1], true, 9500 + i * 2);
  }
  for (let j = 0; j < nz; j++) {
    const za = z0 + j * step, zb = za + step;
    skirt([x0, za], [x0, zb], H[j][0], H[j + 1][0], true, 9800 + j * 2);
    skirt([-x0, za], [-x0, zb], H[j][nx], H[j + 1][nx], false, 9900 + j * 2);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  const m = new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95, metalness: 0 });
  return new THREE.Mesh(geo, m);
}

export { smooth, hash };

/** Mine-car track along +X from the origin: two rails on wooden sleepers. */
export function track({ length, gauge = 0.7, sleeperGap = 0.55 }) {
  const g = new THREE.Group();
  const sleeper = mat(PALETTE.woodDark);
  const rail = metal(PALETTE.steelDark, { roughness: 0.5 });
  const n = Math.max(2, Math.round(length / sleeperGap));
  for (let i = 0; i <= n; i++) g.add(place(box(0.22, 0.08, gauge + 0.45, sleeper), { x: (i * length) / n }));
  for (const s of [-1, 1]) g.add(place(box(length, 0.09, 0.07, rail), { x: length / 2, y: 0.08, z: (s * gauge) / 2 }));
  return g;
}

/** Ore cart (tub on wheels) facing X, heaped with ore and gold flecks. */
export function oreCart({ color = PALETTE.rust, seed = 1, tipped = 0, empty = false } = {}) {
  const g = new THREE.Group();
  const wheel = metal(PALETTE.black);
  for (const x of [-0.35, 0.35]) for (const z of [-0.35, 0.35]) {
    g.add(place(cylinder(0.17, 0.17, 0.08, wheel, 10), { x, y: 0.17, z: z + Math.sign(z) * 0.04, rx: 90 }));
  }
  g.add(place(box(1.0, 0.1, 0.6, metal(PALETTE.steelDark)), { y: 0.22 }));
  const tub = new THREE.Group();
  tub.add(taperedBlock({ w: 1.0, d: 0.78, h: 0.62, topW: 1.3, topD: 0.98, material: mat(color, { roughness: 0.7 }), topMaterial: mat('#3a332b') }));
  tub.add(place(box(1.34, 0.07, 1.02, metal(PALETTE.steelDark)), { y: 0.6 }));
  if (!empty) {
    const rock = mat('#7c6f60');
    const gold = metal(PALETTE.yellow, { roughness: 0.3 });
    tub.add(place(taperedBlock({ w: 1.15, d: 0.85, h: 0.3, topW: 0.5, topD: 0.35, material: rock }), { y: 0.62 }));
    const offs = [[-0.25, 0.1], [0.2, -0.15], [0.05, 0.22], [0.3, 0.15], [-0.15, -0.2]];
    offs.forEach(([x, z], i) => {
      const s = 0.12 + hash(seed, i) * 0.08;
      tub.add(place(box(s, s, s, i % 2 ? gold : rock), { x, y: 0.72 + hash(i, seed) * 0.12, z, ry: i * 37, rz: i * 23 }));
    });
  }
  const pivot = new THREE.Group();
  pivot.position.set(0.5, 0.3, 0);
  tub.position.set(-0.5, 0, 0);
  pivot.add(tub);
  pivot.rotation.z = (-tipped * Math.PI) / 180;
  g.add(pivot);
  return g;
}

/**
 * Timber trestle along +X: bents every `bay` m, X bracing, deck on top at height h.
 */
export function trestle({ length, h, w = 1.8, bay = 1.5, post = 0.2 }) {
  const g = new THREE.Group();
  const wood = mat(PALETTE.woodDark);
  const brace = mat(PALETTE.wood);
  const n = Math.max(1, Math.round(length / bay));
  const xs = [];
  for (let i = 0; i <= n; i++) xs.push((i * length) / n);
  for (const x of xs) {
    for (const s of [-1, 1]) g.add(place(box(post, h, post, wood), { x, z: (s * w) / 2 }));
    g.add(place(box(post, post, w + 0.3, wood), { x, y: h - post }));
    g.add(place(box(post * 0.7, post * 0.7, w, brace), { x, y: h * 0.45 }));
    g.add(beam([x, 0.2, -w / 2], [x, h - 0.3, w / 2], 0.1, brace));
  }
  for (let i = 0; i < n; i++) {
    for (const s of [-1, 1]) {
      g.add(beam([xs[i], 0.3, (s * w) / 2], [xs[i + 1], h - 0.3, (s * w) / 2], 0.1, brace));
    }
  }
  // stringers + deck
  for (const s of [-1, 1]) g.add(place(box(length + 0.2, 0.3, 0.22, wood), { x: length / 2, y: h - 0.3, z: (s * w) / 3 }));
  g.add(place(box(length + 0.2, 0.08, w + 0.3, mat(PALETTE.wood)), { x: length / 2, y: h }));
  return g;
}

/**
 * Big sign with readable text: a box with 0..1 UVs (the lib sign() uses metre UVs,
 * so text shrinks on faces over 1 m). Text on +Z face; origin at the bottom centre.
 */
export function bigSign({ text, w, h, d = 0.15, bg = PALETTE.woodDark, fg = PALETTE.yellow, border = null, key = '' }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Stack of gold bars on a small pallet. */
export function goldStack() {
  const gold = metal('#e8b830', { roughness: 0.25 });
  const g = group(place(box(1.1, 0.12, 0.8, mat(PALETTE.wood)), {}));
  const rows = [[3, 2], [2, 2], [1, 1]];
  let y = 0.12;
  rows.forEach(([nx, nz], r) => {
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      g.add(place(taperedBlock({ w: 0.3, d: 0.16, h: 0.1, topW: 0.24, topD: 0.11, material: gold }), {
        x: (i - (nx - 1) / 2) * 0.32, y, z: (j - (nz - 1) / 2) * 0.2,
      }));
    }
    y += 0.1;
    void r;
  });
  return g;
}

/** Wooden barrel. */
export function barrel({ color = PALETTE.wood } = {}) {
  return group(
    cylinder(0.3, 0.3, 0.8, mat(color), 10),
    place(cylinder(0.31, 0.31, 0.06, metal(PALETTE.steelDark), 10), { y: 0.15 }),
    place(cylinder(0.31, 0.31, 0.06, metal(PALETTE.steelDark), 10), { y: 0.62 })
  );
}

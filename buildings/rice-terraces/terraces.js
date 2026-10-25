// Hillside terrace geometry: stacked contour bands clipped to the lot, each
// with an earthen riser, a flat paddy top (UVs = world metres, so row textures
// line up across triangles) and a raised bund along its edge.
import * as THREE from 'three';

/** Sutherland–Hodgman clip of a polygon [[x,z]…] against an axis-aligned rect. */
export function clipRect(poly, hw, hd) {
  const edges = [
    (p) => p[0] >= -hw, (p) => p[0] <= hw, (p) => p[1] >= -hd, (p) => p[1] <= hd,
  ];
  const cut = [
    (a, b) => lerpAt(a, b, (-hw - a[0]) / (b[0] - a[0])),
    (a, b) => lerpAt(a, b, (hw - a[0]) / (b[0] - a[0])),
    (a, b) => lerpAt(a, b, (-hd - a[1]) / (b[1] - a[1])),
    (a, b) => lerpAt(a, b, (hd - a[1]) / (b[1] - a[1])),
  ];
  let out = poly;
  for (let e = 0; e < 4; e++) {
    const inp = out;
    out = [];
    for (let i = 0; i < inp.length; i++) {
      const cur = inp[i], prev = inp[(i + inp.length - 1) % inp.length];
      const ci = edges[e](cur), pi = edges[e](prev);
      if (ci) {
        if (!pi) out.push(cut[e](prev, cur));
        out.push(cur);
      } else if (pi) out.push(cut[e](prev, cur));
    }
  }
  // drop near-duplicate points
  const clean = [];
  for (const p of out) {
    const q = clean[clean.length - 1];
    if (!q || Math.hypot(p[0] - q[0], p[1] - q[1]) > 0.05) clean.push(p);
  }
  while (clean.length > 2 && Math.hypot(clean[0][0] - clean.at(-1)[0], clean[0][1] - clean.at(-1)[1]) < 0.05) clean.pop();
  return clean;
}

function lerpAt(a, b, t) {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function area(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

/** Collects triangles per material group with explicit UVs. */
class Mesher {
  constructor() { this.buckets = new Map(); }
  tri(a, b, c, uvs, group) {
    if (!this.buckets.has(group)) this.buckets.set(group, { pos: [], uv: [] });
    const bk = this.buckets.get(group);
    bk.pos.push(...a, ...b, ...c);
    bk.uv.push(...uvs[0], ...uvs[1], ...uvs[2]);
  }
  // quad facing roughly towards `normal`
  quad(a, b, c, d, uvs, group, normal) {
    const n = new THREE.Vector3().subVectors(new THREE.Vector3(...b), new THREE.Vector3(...a))
      .cross(new THREE.Vector3().subVectors(new THREE.Vector3(...d), new THREE.Vector3(...a)));
    if (n.dot(new THREE.Vector3(...normal)) < 0) {
      [b, d] = [d, b];
      uvs = [uvs[0], uvs[3], uvs[2], uvs[1]];
    }
    this.tri(a, b, c, [uvs[0], uvs[1], uvs[2]], group);
    this.tri(a, c, d, [uvs[0], uvs[2], uvs[3]], group);
  }
  build() {
    const pos = [], uv = [];
    const g = new THREE.BufferGeometry();
    for (const k of [...this.buckets.keys()].sort((x, y) => x - y)) {
      const bk = this.buckets.get(k);
      g.addGroup(pos.length / 3, bk.pos.length / 3, k);
      pos.push(...bk.pos);
      uv.push(...bk.uv);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
}

/**
 * One terrace: polygon pts (CCW or CW) raised from y0 to y1.
 * Groups: 0 = riser walls, 1 = paddy top, 2 = bund.
 */
export function terraceGeometry(pts, y0, y1, { bundW = 0.35, bundH = 0.16, wallSkip = null } = {}) {
  const P = area(pts) > 0 ? pts : pts.slice().reverse(); // area > 0: CCW in (x, z)
  const n = P.length;
  const m = new Mesher();
  // riser walls
  for (let i = 0; i < n; i++) {
    const [x1, z1] = P[i], [x2, z2] = P[(i + 1) % n];
    const len = Math.hypot(x2 - x1, z2 - z1);
    if (len < 1e-4) continue;
    const out = [(z2 - z1) / len, 0, -(x2 - x1) / len]; // outward for area>0 in this convention, fixed below
    m.quad([x1, y0, z1], [x2, y0, z2], [x2, y1, z2], [x1, y1, z1], [[0, y0], [len, y0], [len, y1], [0, y1]], 0, outward(P, i, out));
  }
  // paddy top
  const contour = P.map(([x, z]) => new THREE.Vector2(x, z));
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    const A = P[i], B = P[j], C = P[k];
    const cr = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const tri = cr < 0 ? [A, B, C] : [A, C, B]; // upward normal
    m.tri(...tri.map(([x, z]) => [x, y1, z]), tri.map(([x, z]) => [x, z]), 1);
  }
  // bund: inset ribbon along the outline
  const inner = P.map((p, i) => {
    const a = P[(i + n - 1) % n], b = P[(i + 1) % n];
    const n1 = inward(a, p, P), n2 = inward(p, b, P);
    let nx = n1[0] + n2[0], nz = n1[1] + n2[1];
    const l = Math.hypot(nx, nz) || 1;
    nx /= l; nz /= l;
    const cos = Math.max(0.5, nx * n1[0] + nz * n1[1]);
    return [p[0] + (nx * bundW) / cos, p[1] + (nz * bundW) / cos];
  });
  const yt = y1 + bundH;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const [ox1, oz1] = P[i], [ox2, oz2] = P[j], [ix1, iz1] = inner[i], [ix2, iz2] = inner[j];
    const len = Math.hypot(ox2 - ox1, oz2 - oz1);
    if (len < 1e-4) continue;
    m.quad([ox1, yt, oz1], [ox2, yt, oz2], [ix2, yt, iz2], [ix1, yt, iz1], [[ox1, oz1], [ox2, oz2], [ix2, iz2], [ix1, iz1]], 2, [0, 1, 0]);
    const inN = inward(P[i], P[j], P);
    m.quad([ix1, y1, iz1], [ix2, y1, iz2], [ix2, yt, iz2], [ix1, yt, iz1], [[0, 0], [len, 0], [len, bundH], [0, bundH]], 2, [inN[0], 0, inN[1]]);
    m.quad([ox1, y1, oz1], [ox2, y1, oz2], [ox2, yt, oz2], [ox1, yt, oz1], [[0, 0], [len, 0], [len, bundH], [0, bundH]], 2, [-inN[0], 0, -inN[1]]);
  }
  return m.build();
}

// inward unit normal of edge a->b of polygon P (tested against the centroid side)
function inward(a, b, P) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const l = Math.hypot(dx, dz) || 1;
  let nx = -dz / l, nz = dx / l;
  // for a CCW (area>0) polygon in x/z with area = sum(x1 z2 - x2 z1), left normal points inside
  if (area(P) < 0) { nx = -nx; nz = -nz; }
  return [nx, nz];
}

function outward(P, i, _guess) {
  const a = P[i], b = P[(i + 1) % P.length];
  const [nx, nz] = inward(a, b, P);
  return [-nx, 0, -nz];
}

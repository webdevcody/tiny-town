import * as THREE from 'three';

// Flat-ground shapes the lib doesn't have: free-form slabs (ponds, plazas),
// rings (pond rims, basins), curved ribbons (winding paths) and octagonal
// pyramid roofs. Top faces get world-space UVs (metres), so tiling surface()
// textures run seamlessly across the whole shape.

class Geo {
  constructor() {
    this.groups = new Map();
  }

  // Triangle a-b-c (each [x,y,z]); flipped if needed so its normal points along `want`.
  tri(a, b, c, want, group, uv) {
    const ab = [b[0] - a[0], b[1] - a[1], b[2] - a[2]];
    const ac = [c[0] - a[0], c[1] - a[1], c[2] - a[2]];
    const n = [ab[1] * ac[2] - ab[2] * ac[1], ab[2] * ac[0] - ab[0] * ac[2], ab[0] * ac[1] - ab[1] * ac[0]];
    if (n[0] * want[0] + n[1] * want[1] + n[2] * want[2] < 0) [b, c] = [c, b];
    if (!this.groups.has(group)) this.groups.set(group, { pos: [], uv: [] });
    const g = this.groups.get(group);
    for (const p of [a, b, c]) {
      g.pos.push(p[0], p[1], p[2]);
      g.uv.push(...uv(p));
    }
  }

  quad(a, b, c, d, want, group, uv) {
    this.tri(a, b, c, want, group, uv);
    this.tri(a, c, d, want, group, uv);
  }

  build() {
    const pos = [], uv = [];
    const geo = new THREE.BufferGeometry();
    for (const k of [...this.groups.keys()].sort((x, y) => x - y)) {
      const g = this.groups.get(k);
      geo.addGroup(pos.length / 3, g.pos.length / 3, k);
      pos.push(...g.pos);
      uv.push(...g.uv);
    }
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return geo;
  }
}

const topUV = (p) => [p[0], -p[2]];
const wallUV = (p) => [p[0] + p[2], p[1]];

function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i], [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

// Outward normal of edge p->q for a polygon with the given signed area.
function outward(p, q, area) {
  const dx = q[0] - p[0], dz = q[1] - p[1];
  return area > 0 ? [dz, 0, -dx] : [-dz, 0, dx];
}

/** Closed outline [[x,z]...] of a wobbly blob (ponds, flower beds). */
export function blob(r, n, wobble = []) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    let rr = r;
    for (const [amp, freq, phase] of wobble) rr += amp * Math.sin(freq * t + phase);
    pts.push([Math.cos(t) * rr, Math.sin(t) * rr]);
  }
  return pts;
}

/** Regular polygon outline; first vertex at angle `start` (degrees, measured from +z towards +x). */
export function ngon(r, n, start = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = ((start + (i * 360) / n) * Math.PI) / 180;
    pts.push([Math.sin(t) * r, Math.cos(t) * r]);
  }
  return pts;
}

/** Vertical slab from y = 0 to y = h over polygon pts. Materials [side, top]. */
export function slab(pts, h, sideMat, topMat) {
  const g = new Geo();
  const area = signedArea(pts);
  const contour = pts.map(([x, z]) => new THREE.Vector2(x, z));
  for (const [i, j, k] of THREE.ShapeUtils.triangulateShape(contour, [])) {
    g.tri([pts[i][0], h, pts[i][1]], [pts[j][0], h, pts[j][1]], [pts[k][0], h, pts[k][1]], [0, 1, 0], 1, topUV);
  }
  for (let i = 0; i < pts.length; i++) {
    const p = pts[i], q = pts[(i + 1) % pts.length];
    g.quad([p[0], 0, p[1]], [q[0], 0, q[1]], [q[0], h, q[1]], [p[0], h, p[1]], outward(p, q, area), 0, wallUV);
  }
  return new THREE.Mesh(g.build(), [sideMat, topMat ?? sideMat]);
}

/** Ring wall between polygon `inner` and the same polygon pushed out by `width` (vertex-wise). */
export function ring(inner, width, h, material, topMat) {
  const g = new Geo();
  const area = signedArea(inner);
  const n = inner.length;
  // offset each vertex along its averaged edge normal
  const outer = inner.map((p, i) => {
    const a = inner[(i - 1 + n) % n], b = inner[(i + 1) % n];
    const n1 = outward(a, p, area), n2 = outward(p, b, area);
    let nx = n1[0] / Math.hypot(n1[0], n1[2]) + n2[0] / Math.hypot(n2[0], n2[2]);
    let nz = n1[2] / Math.hypot(n1[0], n1[2]) + n2[2] / Math.hypot(n2[0], n2[2]);
    const l = Math.hypot(nx, nz);
    return [p[0] + (nx / l) * width, p[1] + (nz / l) * width];
  });
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    const a = inner[i], b = inner[j], A = outer[i], B = outer[j];
    g.quad([a[0], h, a[1]], [b[0], h, b[1]], [B[0], h, B[1]], [A[0], h, A[1]], [0, 1, 0], 1, topUV);
    const o = outward(a, b, area);
    g.quad([A[0], 0, A[1]], [B[0], 0, B[1]], [B[0], h, B[1]], [A[0], h, A[1]], o, 0, wallUV);
    g.quad([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], h, b[1]], [a[0], h, a[1]], [-o[0], 0, -o[2]], 0, wallUV);
  }
  return new THREE.Mesh(g.build(), [material, topMat ?? material]);
}

/**
 * Winding path: a smooth Catmull-Rom curve through [[x,z]...] widened to `width`,
 * `h` thick. Returns a slab mesh.
 */
export function ribbon(points, width, h, material, samples = 40) {
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z]) => new THREE.Vector3(x, 0, z)), false, 'centripetal');
  const left = [], right = [];
  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const p = curve.getPoint(t), d = curve.getTangent(t);
    const nx = -d.z, nz = d.x;
    left.push([p.x + (nx * width) / 2, p.z + (nz * width) / 2]);
    right.push([p.x - (nx * width) / 2, p.z - (nz * width) / 2]);
  }
  return slab([...left, ...right.reverse()], h, material, material);
}

/** Octagonal (n-gon) pyramid roof with a closed soffit: eave polygon pts at y = 0, apex at y = h. */
export function pyramid(pts, h, material, soffitMat) {
  const g = new Geo();
  const n = pts.length;
  const apex = [0, h, 0];
  for (let i = 0; i < n; i++) {
    const p = pts[i], q = pts[(i + 1) % n];
    const mx = (p[0] + q[0]) / 2, mz = (p[1] + q[1]) / 2;
    g.tri([p[0], 0, p[1]], [q[0], 0, q[1]], apex, [mx, h * 0.3, mz], i % 2, (v) => [v[0] + v[2], v[1]]);
    g.tri([p[0], 0, p[1]], [q[0], 0, q[1]], [0, 0, 0], [0, -1, 0], 2, topUV);
  }
  return new THREE.Mesh(g.build(), [material[0] ?? material, material[1] ?? material, soffitMat]);
}

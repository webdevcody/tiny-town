// Low-level geometry helpers. Everything sits on y = 0 (base on the ground) and
// gets UVs in metres, so surface()/facade() materials tile correctly.

import * as THREE from 'three';

/**
 * Box geometry with its base at y = 0, centred on x/z.
 * Groups (material slots): 0 +x, 1 -x, 2 top, 3 bottom, 4 +z (front), 5 -z (back).
 * UVs are in metres on every face.
 */
export function boxGeometry(w, h, d) {
  const g = new THREE.BoxGeometry(w, h, d);
  g.translate(0, h / 2, 0);
  const uv = g.attributes.uv;
  // face sizes (u, v) per group in BoxGeometry order: px nx py ny pz nz
  const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) {
    const [su, sv] = sizes[Math.floor(i / 4)];
    uv.setXY(i, uv.getX(i) * su, uv.getY(i) * sv);
  }
  return g;
}

/**
 * Cylinder (or truncated cone) with base at y = 0.
 * Groups: 0 side, 1 top, 2 bottom. Side UVs in metres.
 */
export function cylinderGeometry(rTop, rBottom, h, segments = 16, openEnded = false) {
  const g = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, openEnded);
  g.translate(0, h / 2, 0);
  const circ = Math.PI * (rTop + rBottom);
  const uv = g.attributes.uv;
  const sideCount = (segments + 1) * 2;
  for (let i = 0; i < sideCount; i++) uv.setXY(i, uv.getX(i) * circ, uv.getY(i) * h);
  return g;
}

/**
 * Incremental mesh builder for custom low-poly shapes (roofs, prisms, ramps).
 *
 *   const b = new ShapeBuilder();
 *   b.quad([x,y,z], [x,y,z], [x,y,z], [x,y,z], 0);   // CCW seen from outside
 *   b.tri(a, b, c, 1);
 *   const geom = b.build();                         // groups = material slots
 *
 * UVs are planar per face, in metres: u runs along the first edge (a -> b),
 * v runs perpendicular to it towards the last vertex. So for a roof slope give
 * the eave first and the ridge last and tile rows follow the eave.
 */
export class ShapeBuilder {
  constructor() {
    this.faces = new Map(); // group -> { pos: [], uv: [] }
  }

  _bucket(group) {
    if (!this.faces.has(group)) this.faces.set(group, { pos: [], uv: [] });
    return this.faces.get(group);
  }

  _poly(pts, group) {
    const P = pts.map((p) => new THREE.Vector3(...p));
    const a = P[0];
    const uAxis = new THREE.Vector3().subVectors(P[1], a).normalize();
    // v axis: component of (last - a) orthogonal to u
    const n = new THREE.Vector3().subVectors(P[1], a).cross(new THREE.Vector3().subVectors(P[P.length - 1], a));
    const vAxis = new THREE.Vector3().crossVectors(n, uAxis).normalize();
    const uvs = P.map((p) => {
      const rel = new THREE.Vector3().subVectors(p, a);
      return [rel.dot(uAxis), rel.dot(vAxis)];
    });
    const bucket = this._bucket(group);
    for (let i = 1; i < P.length - 1; i++) {
      for (const k of [0, i, i + 1]) {
        bucket.pos.push(P[k].x, P[k].y, P[k].z);
        bucket.uv.push(uvs[k][0], uvs[k][1]);
      }
    }
    return this;
  }

  /** Triangle, counter-clockwise when seen from outside. */
  tri(a, b, c, group = 0) {
    return this._poly([a, b, c], group);
  }

  /** Quad a-b-c-d, counter-clockwise when seen from outside. */
  quad(a, b, c, d, group = 0) {
    return this._poly([a, b, c, d], group);
  }

  /** Convex polygon (array of [x,y,z]), counter-clockwise when seen from outside. */
  poly(points, group = 0) {
    return this._poly(points, group);
  }

  /** Quad with explicit UVs [[u,v] x4]. */
  quadUV(a, b, c, d, uvs, group = 0) {
    const bucket = this._bucket(group);
    const P = [a, b, c, d];
    for (const k of [0, 1, 2, 0, 2, 3]) {
      bucket.pos.push(...P[k]);
      bucket.uv.push(...uvs[k]);
    }
    return this;
  }

  build() {
    const pos = [];
    const uv = [];
    const g = new THREE.BufferGeometry();
    const groups = [...this.faces.keys()].sort((x, y) => x - y);
    for (const group of groups) {
      const b = this.faces.get(group);
      const start = pos.length / 3;
      pos.push(...b.pos);
      uv.push(...b.uv);
      g.addGroup(start, b.pos.length / 3, group);
    }
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.computeVertexNormals();
    return g;
  }
}

/** Signed area of a 2D polygon [[x,z], ...] in the x/z plane (positive = CCW seen from above). */
export function polygonArea(points) {
  let a = 0;
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    a += x1 * z2 - x2 * z1;
  }
  // x/z with y up: seen from above, CCW in (x, -z) space
  return -a / 2;
}

/**
 * Vertical extrusion of a 2D footprint polygon [[x,z], ...] from y=0 to y=h.
 * Groups: 0 walls, 1 top, 2 bottom. Wall UVs in metres (u along the wall).
 * For window grids use parts.prismBlock() instead.
 */
export function extrudeGeometry(points, h, { wallUV = null } = {}) {
  const pts = polygonArea(points) < 0 ? points.slice().reverse() : points.slice();
  const b = new ShapeBuilder();
  let uOffset = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const [su, sv] = wallUV ? wallUV(len, h) : [len, h];
    b.quadUV([x1, 0, z1], [x2, 0, z2], [x2, h, z2], [x1, h, z1], [[0, 0], [su, 0], [su, sv], [0, sv]], 0);
    uOffset += len;
  }
  const contour = pts.map(([x, z]) => new THREE.Vector2(x, -z));
  const tris = THREE.ShapeUtils.triangulateShape(contour, []);
  for (const [i, j, k] of tris) {
    const A = pts[i], B = pts[j], C = pts[k];
    // ensure upward normal
    const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
    const up = cross < 0 ? [A, B, C] : [A, C, B];
    const down = cross < 0 ? [A, C, B] : [A, B, C];
    b.tri(...up.map(([x, z]) => [x, h, z]), 1);
    b.tri(...down.map(([x, z]) => [x, 0, z]), 2);
  }
  return b.build();
}

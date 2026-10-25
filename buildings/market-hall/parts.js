// Local helpers for the market hall: arched shapes in the Y/Z plane
// (vault, ribs, arched end walls) built with ShapeBuilder.
import * as THREE from 'three';
import { ShapeBuilder, mat, textured, signTexture, PALETTE, box, place, cylinder, sphere, group } from '../../src/lib/index.js';

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

/**
 * Half-cylinder vault along X (length L, radius R), outer surface only.
 * UV u = metres along X (from -L/2), v = arc length in metres from the front eave.
 */
export function vault({ L, R, segments = 14, material }) {
  const b = new ShapeBuilder();
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const t = (Math.PI * i) / segments;
    pts.push([R * Math.sin(t), R * Math.cos(t), R * t]); // [y, z, arc]
  }
  for (let i = 0; i < segments; i++) {
    const [y0, z0, s0] = pts[i];
    const [y1, z1, s1] = pts[i + 1];
    b.quadUV([-L / 2, y0, z0], [L / 2, y0, z0], [L / 2, y1, z1], [-L / 2, y1, z1], [[0, s0], [L, s0], [L, s1], [0, s1]]);
  }
  return new THREE.Mesh(b.build(), toMat(material));
}

/**
 * Semicircular ring (arch rib) in the Y/Z plane, thickness t along X.
 * Centre of the circle at the origin; legs stand on y = 0.
 */
export function archRing({ ri, ro, t, segments = 14, material }) {
  const b = new ShapeBuilder();
  const h = t / 2;
  const P = (r, a) => [r * Math.sin(a), r * Math.cos(a)]; // [y, z]
  for (let i = 0; i < segments; i++) {
    const a0 = (Math.PI * i) / segments, a1 = (Math.PI * (i + 1)) / segments;
    const [oy0, oz0] = P(ro, a0), [oy1, oz1] = P(ro, a1);
    const [iy0, iz0] = P(ri, a0), [iy1, iz1] = P(ri, a1);
    b.quad([-h, oy0, oz0], [h, oy0, oz0], [h, oy1, oz1], [-h, oy1, oz1]); // outer
    b.quad([-h, iy0, iz0], [-h, iy1, iz1], [h, iy1, iz1], [h, iy0, iz0]); // inner
    b.quad([h, oy0, oz0], [h, iy0, iz0], [h, iy1, iz1], [h, oy1, oz1]); // +x side
    b.quad([-h, oy0, oz0], [-h, oy1, oz1], [-h, iy1, iz1], [-h, iy0, iz0]); // -x side
  }
  // feet
  b.quad([h, 0, ro], [-h, 0, ro], [-h, 0, ri], [h, 0, ri]);
  b.quad([h, 0, -ri], [-h, 0, -ri], [-h, 0, -ro], [h, 0, -ro]);
  return new THREE.Mesh(b.build(), toMat(material));
}

/**
 * Convex slab in the Y/Z plane, thickness t along X.
 * points: [[z, y], ...] counter-clockwise seen from +X (i.e. start bottom +z, go to -z).
 */
export function profileSlab(points, t, material, rimMaterial) {
  const b = new ShapeBuilder();
  const h = t / 2;
  const n = points.length;
  b.poly(points.map(([z, y]) => [h, y, z]), 0);
  b.poly([...points].reverse().map(([z, y]) => [-h, y, z]), 0);
  for (let i = 0; i < n; i++) {
    const [za, ya] = points[i];
    const [zb, yb] = points[(i + 1) % n];
    b.quad([h, ya, za], [-h, ya, za], [-h, yb, zb], [h, yb, zb], 1);
  }
  const m = toMat(material);
  return new THREE.Mesh(b.build(), [m, rimMaterial ? toMat(rimMaterial) : m]);
}

/** Rectangle of width w and height H topped by a semicircle of radius w/2 (a "tombstone"). */
export function archProfile(w, H, segments = 14) {
  const r = w / 2;
  const pts = [[r, 0], [-r, 0]];
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI * (i / segments);
    pts.push([-r * Math.cos(a), H + r * Math.sin(a)]);
  }
  return pts;
}

/** Half-disc profile of radius r on y = 0. */
export function halfDisc(r, segments = 12) {
  const pts = [];
  for (let i = 0; i <= segments; i++) {
    const a = Math.PI * (i / segments);
    pts.push([-r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

/** Tiny shopper figure (~1.75 m). */
export function person({ shirt = PALETTE.red, legs = PALETTE.navy, skin = '#e0b48c', hair = PALETTE.woodDark } = {}) {
  return group(
    place(box(0.34, 0.8, 0.22, legs), {}),
    place(box(0.44, 0.62, 0.26, shirt), { y: 0.8 }),
    place(sphere(0.15, skin, 8), { y: 1.48 }),
    place(box(0.28, 0.08, 0.28, hair), { y: 1.6 })
  );
}

/** Market umbrella: pole + low cone canopy. */
export function umbrella({ r = 1.2, h = 2.2, color = PALETTE.red } = {}) {
  return group(
    cylinder(0.04, 0.04, h, PALETTE.white, 6),
    place(new THREE.Mesh(new THREE.ConeGeometry(r, 0.5, 8), toMat(color)), { y: h }),
  );
}

/**
 * Name board facing +z. (Uses a 0..1 UV plane so the text spans the whole board.)
 */
export function nameBoard({ text, w, h, bg, fg, border }) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, 0.101);
  return group(box(w, h, 0.2, bg), face);
}

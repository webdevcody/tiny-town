// Local helpers for the tea plantation: the rolling hill, tea bushes, pickers
// and a big sign with 0..1 UVs (the lib sign() shrinks text on faces over 1 m).
import * as THREE from 'three';
import { PALETTE, mat, textured, signTexture, cylinder, cone, sphere, box, place, group } from '../../src/lib/index.js';

/**
 * Hill shape in polar form around centre (cx, cz).
 * radius(θ) wobbles a little so it reads as a natural rolling hill;
 * height(t) falls from a small plateau at t = 0 to 0 at the rim t = 1.
 */
export function hillShape({ cx, cz, R, H, limit }) {
  const radius = (a) => {
    let r = R * (1 + 0.09 * Math.cos(2 * a - 0.6) + 0.05 * Math.sin(3 * a + 1));
    // keep the rim inside the lot
    const dx = Math.cos(a), dz = Math.sin(a);
    if (Math.abs(dx) > 1e-6) r = Math.min(r, ((dx > 0 ? limit : -limit) - cx) / dx);
    if (Math.abs(dz) > 1e-6) r = Math.min(r, ((dz > 0 ? limit : -limit) - cz) / dz);
    return r;
  };
  const height = (t) => {
    const u = Math.min(1, Math.max(0, (t - 0.1) / 0.9));
    return (H * (1 + Math.cos(Math.PI * u))) / 2;
  };
  const point = (a, t) => [cx + Math.cos(a) * radius(a) * t, height(t), cz + Math.sin(a) * radius(a) * t];
  return { radius, height, point, cx, cz };
}

/** Faceted hill mesh (polar grid) from a hillShape. */
export function hillMesh(shape, { segments = 56, rings = 14, material }) {
  const pos = [];
  const P = (i, j) => shape.point((i / segments) * Math.PI * 2, j / rings);
  for (let j = 0; j < rings; j++) {
    for (let i = 0; i < segments; i++) {
      const a = P(i, j), b = P(i + 1, j), c = P(i + 1, j + 1), d = P(i, j + 1);
      // CCW seen from above; the first ring collapses to the summit point
      if (j > 0) pos.push(...a, ...b, ...c);
      pos.push(...a, ...c, ...d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  // planar uvs in metres
  const uv = [];
  for (let k = 0; k < pos.length; k += 3) uv.push(pos[k], pos[k + 2]);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/** Thin ribbon lying on the hill along a ray at angle a, from t0 to t1. */
export function hillPath(shape, a, { t0 = 0, t1 = 1, width = 1, lift = 0.05, steps = 16, material }) {
  const pos = [];
  const side = [-Math.sin(a) * width / 2, Math.cos(a) * width / 2];
  const pts = [];
  for (let s = 0; s <= steps; s++) {
    const [x, y, z] = shape.point(a, t0 + ((t1 - t0) * s) / steps);
    pts.push([[x - side[0], y + lift, z - side[1]], [x + side[0], y + lift, z + side[1]]]);
  }
  for (let s = 0; s < steps; s++) {
    const [l0, r0] = pts[s], [l1, r1] = pts[s + 1];
    pos.push(...l0, ...r0, ...r1, ...l0, ...r1, ...l1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const uv = [];
  for (let k = 0; k < pos.length; k += 3) uv.push(pos[k], pos[k + 2]);
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

const bushGeo = new THREE.IcosahedronGeometry(1, 1);

/** One clipped tea bush: a flattened, rounded mound (the "plucking table"). */
export function teaBush(color, { rx = 0.36, ry = 0.5, rz = 0.34 } = {}) {
  const m = new THREE.Mesh(bushGeo, mat(color));
  m.scale.set(rx, ry, rz);
  return m;
}

/**
 * Tea picker with a wicker basket on the back. Faces +z, ~1.6 m tall.
 *   picker({ dress, top, hat: 'cone' | 'scarf', scarf })
 */
export function picker({ dress = PALETTE.red, top = PALETTE.orange, hat = 'scarf', scarf = PALETTE.yellow, basket = true } = {}) {
  const skin = mat('#8a5a3a');
  const wicker = mat('#b98a4e');
  const g = group(
    cylinder(0.2, 0.27, 0.82, mat(dress), 8),
    place(cylinder(0.15, 0.2, 0.5, mat(top), 8), { y: 0.82 }),
    place(sphere(0.14, skin, 8), { y: 1.42 }),
    // arms reaching forward to pluck
    place(box(0.09, 0.09, 0.42, mat(top)), { x: -0.2, y: 1.08, z: 0.16, rx: 25 }),
    place(box(0.09, 0.09, 0.42, mat(top)), { x: 0.2, y: 1.08, z: 0.16, rx: 25 })
  );
  if (hat === 'cone') g.add(place(cone(0.36, 0.24, mat(PALETTE.hay), 10), { y: 1.5 }));
  else g.add(place(sphere(0.155, mat(scarf), 8), { y: 1.46, z: -0.03 }));
  if (basket) {
    g.add(place(cylinder(0.27, 0.18, 0.55, wicker, 10), { y: 0.82, z: -0.33 }));
    g.add(place(cylinder(0.25, 0.25, 0.08, mat('#62c23c'), 10), { y: 1.35, z: -0.33 }));
    // head strap
    g.add(place(box(0.32, 0.05, 0.05, mat(PALETTE.woodDark)), { y: 1.55, z: -0.12 }));
  }
  return g;
}

/** Sign board whose text fills the whole face (0..1 UVs). Text faces +z, base at y = 0. */
export function bigSign({ text, w, h, d = 0.15, bg = PALETTE.green, fg = '#ffffff', border = null, key }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const face = textured(signTexture(text, { bg, fg, width: tw, height: th, border }));
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Text painted on a flat panel (PlaneGeometry, 0..1 UVs), faces +z. */
export function paintedPanel({ text, w, h, bg, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const m = textured(signTexture(text, { bg, fg, width: tw, height: th, border }));
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), m);
}

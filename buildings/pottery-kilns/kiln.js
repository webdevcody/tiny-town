import * as THREE from 'three';
import { PALETTE, surface, mat, box, cylinder, sphere, place, group, textured, signTexture } from '../../src/lib/index.js';

// Lathe from [radius, y] points with UVs in metres (u around, v up the profile),
// so brick surface() materials tile at a sensible scale.
function latheMesh(profile, material, segments = 22) {
  const pts = profile.map(([r, y]) => new THREE.Vector2(r, y));
  const geom = new THREE.LatheGeometry(pts, segments);
  const uv = geom.attributes.uv;
  const rRef = profile[0][0] * 0.85;
  const lens = [0];
  for (let j = 1; j < pts.length; j++) lens.push(lens[j - 1] + pts[j].distanceTo(pts[j - 1]));
  const n = pts.length;
  for (let i = 0; i < uv.count; i++) {
    const j = i % n;
    uv.setXY(i, uv.getX(i) * Math.PI * 2 * rRef, lens[j]);
  }
  return new THREE.Mesh(geom, material);
}

/**
 * Brick bottle kiln (hovel). Base radius r, total height h. Door faces +Z.
 */
export function bottleKiln({ r = 2.7, h = 11.5, brick = PALETTE.brick, seed = 1 } = {}) {
  const g = new THREE.Group();
  const bm = surface('brick', brick, { size: 1.6, seed });
  const s = h / 11.5;
  const profile = [
    [r, 0], [r * 1.03, 1.2 * s], [r * 1.04, 2.6 * s], [r * 0.98, 4.0 * s],
    [r * 0.86, 5.3 * s], [r * 0.68, 6.6 * s], [r * 0.49, 7.8 * s], [r * 0.37, 8.8 * s],
    [r * 0.33, 9.8 * s], [r * 0.32, 10.9 * s],
  ];
  g.add(latheMesh(profile, bm));
  // soot-blackened lip at the top of the neck
  const neckR = r * 0.32;
  const top = 10.9 * s;
  const sootM = mat('#3a2a24');
  g.add(place(cylinder(neckR * 1.18, neckR * 1.05, 0.6 * s, sootM, 18), { y: top }));
  g.add(place(cylinder(neckR * 0.85, neckR * 0.85, 0.05, mat('#141416'), 14), { y: top + 0.6 * s }));
  // iron bands (bonts) around the shoulder
  const bandM = mat(PALETTE.darkGrey, { roughness: 0.6 });
  for (const [y, rr] of [[1.9 * s, r * 1.045], [3.4 * s, r * 1.02], [5.0 * s, r * 0.9]]) {
    g.add(place(cylinder(rr + 0.04, rr + 0.04, 0.14, bandM, 22), { y }));
  }
  // arched firing door (clammins) + stone surround, facing +Z
  const dz = r * 1.0;
  g.add(place(box(1.5, 2.3, 0.5, mat(PALETTE.stone)), { y: 0, z: dz - 0.12 }));
  g.add(place(box(1.0, 1.7, 0.5, mat('#1c1512')), { y: 0, z: dz - 0.06 }));
  g.add(place(cylinder(0.5, 0.5, 0.5, mat('#1c1512'), 10), { y: 1.7, z: dz - 0.06, rx: 90 }));
  // small stoke holes (firemouths) glowing round the base
  const glow = mat('#ff8a2a', { emissive: '#ff6a10', emissiveIntensity: 0.9 });
  for (let i = 0; i < 6; i++) {
    const a = ((i + 0.5) / 6) * Math.PI * 2 + Math.PI / 2;
    if (Math.abs(Math.cos(a - Math.PI / 2)) > 0.92 && Math.sin(a) > 0) continue;
    const x = Math.cos(a) * r * 1.0, z = Math.sin(a) * r * 1.0;
    g.add(place(box(0.55, 0.45, 0.3, glow), { x, y: 0.35, z, ry: -THREE.MathUtils.radToDeg(a) + 90 }));
  }
  return g;
}

/** Soft smoke puffs rising from a kiln neck. */
export function smoke({ puffs = 4, seed = 1 } = {}) {
  const g = new THREE.Group();
  const m = mat('#d6d2cc', { transparent: true, opacity: 0.6, roughness: 1 });
  let y = 0, x = 0;
  for (let i = 0; i < puffs; i++) {
    const rr = 0.55 + i * 0.25;
    g.add(place(sphere(rr, m, 8), { x, y: y + rr * 0.6, z: (i % 2 ? 0.2 : -0.1) * seed }));
    y += rr * 1.2;
    x += 0.35 + i * 0.15;
  }
  return g;
}

/** Stack of fireclay saggars (round boxes pots are fired in). */
export function saggarStack({ n = 5, r = 0.35 } = {}) {
  const g = new THREE.Group();
  const m = mat('#cdb48a');
  const rim = mat('#a88d63');
  for (let i = 0; i < n; i++) {
    g.add(place(cylinder(r, r * 0.96, 0.32, m, 10), { y: i * 0.34 }));
    g.add(place(cylinder(r * 1.03, r * 1.03, 0.04, rim, 10), { y: i * 0.34 + 0.3 }));
  }
  return g;
}

/** Open wooden crate packed with pots in straw. */
export function crateOfPots({ w = 1.1, d = 0.8, h = 0.6, seed = 0 } = {}) {
  const g = new THREE.Group();
  const wood = surface('planks', PALETTE.woodLight, { size: 1.2 });
  const t = 0.06;
  g.add(box(w, 0.06, d, wood));
  g.add(place(box(w, h, t, wood), { z: d / 2 - t / 2 }));
  g.add(place(box(w, h, t, wood), { z: -d / 2 + t / 2 }));
  g.add(place(box(t, h, d, wood), { x: w / 2 - t / 2 }));
  g.add(place(box(t, h, d, wood), { x: -w / 2 + t / 2 }));
  g.add(place(box(w - 0.1, h * 0.7, d - 0.1, mat(PALETTE.hay)), { y: 0.05 }));
  const colours = ['#f1eee6', '#c45a30', '#2f5fa8', '#e8d9b0', '#4f8b6f'];
  const cols = Math.max(2, Math.round(w / 0.36)), rows = Math.max(1, Math.round(d / 0.36));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const c = colours[(i + j * 2 + seed) % colours.length];
      const x = -w / 2 + (i + 0.5) * (w / cols), z = -d / 2 + (j + 0.5) * (d / rows);
      g.add(place(pot({ color: c, h: 0.4 }), { x, y: h * 0.55, z }));
    }
  }
  return g;
}

/** Single pot / jug. */
export function pot({ color = '#c45a30', h = 0.5 } = {}) {
  const m = mat(color, { roughness: 0.5 });
  return group(
    cylinder(h * 0.32, h * 0.26, h * 0.6, m, 10),
    place(cylinder(h * 0.22, h * 0.32, h * 0.28, m, 10), { y: h * 0.6 }),
    place(cylinder(h * 0.26, h * 0.2, h * 0.12, m, 10), { y: h * 0.88 }),
  );
}

/** Heap of clay / coal: squashed low-poly mound. */
export function heap({ r = 1.6, h = 1.1, color = '#9b8f7a', seed = 1 } = {}) {
  const m = mat(color, { roughness: 1 });
  const g = new THREE.Group();
  const geom = new THREE.SphereGeometry(1, 9, 5, 0, Math.PI * 2, 0, Math.PI / 2);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const k = 1 + 0.12 * Math.sin(i * 1.7 + seed * 3.1);
    pos.setXYZ(i, pos.getX(i) * r * k, pos.getY(i) * h, pos.getZ(i) * r * (2 - k));
  }
  geom.computeVertexNormals();
  g.add(new THREE.Mesh(geom, m));
  return g;
}

/** Two-wheeled handcart. Long axis X, handles toward -X. */
export function handcart({ color = PALETTE.wood } = {}) {
  const g = new THREE.Group();
  const m = mat(color);
  const dark = mat(PALETTE.woodDark);
  g.add(place(box(1.6, 0.08, 1.0, m), { y: 0.55 }));
  g.add(place(box(1.6, 0.35, 0.06, m), { y: 0.6, z: 0.47 }));
  g.add(place(box(1.6, 0.35, 0.06, m), { y: 0.6, z: -0.47 }));
  g.add(place(box(0.06, 0.35, 1.0, m), { x: 0.77, y: 0.6 }));
  for (const z of [-0.58, 0.58]) {
    g.add(place(cylinder(0.5, 0.5, 0.08, dark, 12), { x: 0.2, y: 0.5, z, rx: 90 }));
    g.add(place(box(1.0, 0.06, 0.06, dark), { x: -1.2, y: 0.55, z: z * 0.7 }));
  }
  return g;
}

/**
 * Flat sign with 0..1 UVs so the texture fills the whole face (the lib sign()
 * uses metre UVs and shrinks the text on faces over 1 m). Text faces +Z.
 */
export function bigSign({ text, w, h, d = 0.12, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w), border });
  const face = textured(tex);
  const side = mat(bg);
  const geom = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geom, [side, side, side, side, face, face]);
}

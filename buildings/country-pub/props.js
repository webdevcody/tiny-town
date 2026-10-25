import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, place, group, mat, textured, canvasTexture, rng,
} from '../../src/lib/index.js';

/**
 * Box with 0..1 UVs on every face (base at y = 0), so a canvas texture fills a
 * whole face whatever its size. faceMat goes on +z (and -z when double).
 */
export function board(w, h, depth, faceMat, sideMat, double = false) {
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  const s = typeof sideMat === 'string' ? mat(sideMat) : sideMat;
  return new THREE.Mesh(geo, [s, s, s, s, faceMat, double ? faceMat : s]);
}

/** Small-paned (Georgian) window texture: glass with white glazing bars. */
function paneTexture(glassColor, cols, rows) {
  return canvasTexture(96, 96, (ctx, W, H) => {
    ctx.fillStyle = glassColor;
    ctx.fillRect(0, 0, W, H);
    // a soft reflection streak
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.beginPath();
    ctx.moveTo(W * 0.15, H); ctx.lineTo(W * 0.55, 0); ctx.lineTo(W * 0.75, 0); ctx.lineTo(W * 0.35, H);
    ctx.fill();
    ctx.fillStyle = '#f4f1ea';
    const bar = 4;
    for (let i = 1; i < cols; i++) ctx.fillRect((W * i) / cols - bar / 2, 0, bar, H);
    for (let j = 1; j < rows; j++) ctx.fillRect(0, (H * j) / rows - bar / 2, W, bar);
    ctx.lineWidth = 9;
    ctx.strokeStyle = '#f4f1ea';
    ctx.strokeRect(0, 0, W, H);
  }, { key: `country-pub:pane:${glassColor}:${cols}x${rows}`, repeat: false });
}

/** Window pane slab facing +z, origin bottom centre. warm = glowing pub interior. */
export function paneWindow(w, h, { warm = false, cols = 3, rows = 3 } = {}) {
  const tex = paneTexture(warm ? '#e3a64a' : '#33465e', cols, rows);
  const face = warm
    ? textured(tex, { emissive: '#ffc766', emissiveIntensity: 0.35, emissiveMap: tex })
    : textured(tex, { roughness: 0.3, metalness: 0.2 });
  return board(w, h, 0.1, face, '#f4f1ea');
}

const FLOWERS = ['#e0405a', '#c8322b', '#f08ac0', '#9b5ad0', '#ffffff', '#f2cf3a', '#ff7a3a'];

/** Hanging flower basket on an iron bracket. Origin = wall fixing point; sticks out to +z. */
export function hangingBasket(seed) {
  const r = rng(seed);
  const iron = mat(PALETTE.black);
  const g = group(
    place(box(0.06, 0.06, 0.6, iron), { z: 0.3 }),
    place(box(0.03, 0.35, 0.03, iron), { y: -0.35, z: 0.55 }),
    place(cylinder(0.32, 0.16, 0.22, mat(PALETTE.woodDark), 8), { y: -0.62, z: 0.55 }),
    place(sphere(0.36, mat(PALETTE.foliageLight), 7), { y: -0.5, z: 0.55 }),
  );
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + r() * 0.4;
    const yy = -0.55 + r.range(-0.2, 0.18);
    g.add(place(sphere(0.1, mat(r.pick(FLOWERS)), 5), { x: Math.cos(a) * 0.34, y: yy, z: 0.55 + Math.sin(a) * 0.34 }));
  }
  return g;
}

/** Window box with flowers, origin = back bottom centre at the wall, sticks out to +z. */
export function windowBox(w, seed) {
  const r = rng(seed);
  const g = group(
    place(box(w, 0.22, 0.28, mat(PALETTE.woodDark)), { z: 0.14 }),
    place(box(w - 0.06, 0.12, 0.24, mat(PALETTE.foliage)), { y: 0.2, z: 0.14 }),
  );
  const n = Math.round(w / 0.17);
  for (let i = 0; i < n; i++) {
    g.add(place(sphere(0.09, mat(r.pick(FLOWERS)), 5), { x: -w / 2 + 0.1 + (i * (w - 0.2)) / Math.max(1, n - 1), y: 0.32 + r() * 0.06, z: 0.1 + r() * 0.1 }));
  }
  return g;
}

/** Picnic table with attached benches and a parasol. Length along X. */
export function parasolTable({ color = PALETTE.green, color2 = PALETTE.white } = {}) {
  const wood = mat(PALETTE.woodLight);
  const legs = mat(PALETTE.wood);
  const g = group(
    place(box(1.5, 0.07, 0.75, wood), { y: 0.72 }),
    place(box(1.5, 0.06, 0.28, wood), { y: 0.42, z: 0.62 }),
    place(box(1.5, 0.06, 0.28, wood), { y: 0.42, z: -0.62 }),
  );
  for (const x of [-0.6, 0.6]) {
    g.add(place(box(0.08, 0.72, 0.08, legs), { x, z: 0.25, rx: -18 }));
    g.add(place(box(0.08, 0.72, 0.08, legs), { x, z: -0.25, rx: 18 }));
    g.add(place(box(0.08, 0.07, 1.7, legs), { x, y: 0.35 }));
  }
  // parasol: pole, 8 alternating-colour segments, finial
  g.add(cylinder(0.04, 0.04, 2.5, mat(PALETTE.lightGrey), 6));
  const top = 2.35, R = 1.15, rise = 0.45;
  for (let i = 0; i < 8; i++) {
    const a0 = (i / 8) * Math.PI * 2, a1 = ((i + 1) / 8) * Math.PI * 2;
    const geo = new THREE.BufferGeometry();
    const p = [0, top + rise, 0, Math.cos(a1) * R, top, Math.sin(a1) * R, Math.cos(a0) * R, top, Math.sin(a0) * R];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(p, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, mat(i % 2 ? color : color2, { side: THREE.DoubleSide })));
  }
  // valance
  g.add(place(cylinder(R, R, 0.14, mat(color), 8), { y: top - 0.14 }));
  g.add(place(sphere(0.07, mat(PALETTE.lightGrey), 5), { y: top + rise + 0.02 }));
  return g;
}

/** Wooden beer barrel standing up. */
export function barrel(r = 0.32, h = 0.8) {
  const hoop = mat(PALETTE.darkGrey);
  return group(
    cylinder(r * 0.88, r * 0.88, h, mat(PALETTE.wood), 10),
    place(cylinder(r, r, h * 0.5, mat(PALETTE.woodDark), 10), { y: h * 0.25 }),
    place(cylinder(r * 0.92, r * 0.92, 0.05, hoop, 10), { y: h * 0.12 }),
    place(cylinder(r * 0.92, r * 0.92, 0.05, hoop, 10), { y: h * 0.83 }),
  );
}

/** Aluminium keg. */
export function keg() {
  return group(
    cylinder(0.22, 0.22, 0.6, mat(PALETTE.aluminium, { metalness: 0.6, roughness: 0.35 }), 10),
    place(cylinder(0.23, 0.23, 0.05, mat(PALETTE.steel), 10), { y: 0.55 }),
  );
}

/** Carriage lantern on a wall, sticks out to +z. */
export function lantern() {
  const iron = mat(PALETTE.black);
  return group(
    place(box(0.05, 0.05, 0.3, iron), { z: 0.15 }),
    place(box(0.22, 0.32, 0.22, mat('#ffe2a0', { emissive: '#ffcf70', emissiveIntensity: 0.9 })), { y: -0.2, z: 0.32 }),
    place(cone(0.18, 0.15, iron, 4), { y: 0.12, z: 0.32 }),
  );
}

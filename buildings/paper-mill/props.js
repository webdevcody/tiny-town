// Local helpers for the Paper Mill: paper rolls, steam, a big sign with 0..1 UVs,
// an inclined conveyor gallery and a few yard vehicles.
import * as THREE from 'three';
import {
  PALETTE, rng, mat, metal, textured, canvasTexture, signTexture, shade,
  box, cylinder, sphere, place, group, cylinderGeometry,
} from '../../src/lib/index.js';

// --- paper rolls -----------------------------------------------------------

function rollEndTexture(color) {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = shade(color, -0.12);
    ctx.lineWidth = 1;
    for (let r = 10; r < 32; r += 4) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.fillStyle = '#8a6a44';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#3a2c1c';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 5, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'paper-mill:roll-end:' + color, repeat: false });
}

/** Giant paper roll standing on its end (axis = y), base at y = 0. */
export function paperRoll({ r = 0.7, h = 1.5, color = '#f4f2ea' } = {}) {
  const side = mat(color, { roughness: 0.7 });
  const end = textured(rollEndTexture(color));
  return new THREE.Mesh(cylinderGeometry(r, r, h, 16), [side, end, end]);
}

/** Yellow handrail ring (torus) of radius r, lying flat at y = 0. */
export function railRing(r, { color = PALETTE.yellow, tube = 0.06 } = {}) {
  const geo = new THREE.TorusGeometry(r, tube, 5, 24);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, mat(color));
}

// --- steam -----------------------------------------------------------------

/** Billowing steam plume rising from y = 0, drifting a little towards +x. */
export function steamPlume({ seed = 1, puffs = 6, r0 = 0.5, rise = 1.0, drift = 0.35, grow = 0.16 } = {}) {
  const r = rng(seed);
  const m = mat('#f6f6f2', { transparent: true, opacity: 0.88, roughness: 1 });
  const m2 = mat('#e4e6e8', { transparent: true, opacity: 0.8, roughness: 1 });
  const g = new THREE.Group();
  let y = 0, x = 0, z = 0;
  for (let i = 0; i < puffs; i++) {
    const rad = r0 + i * grow + r.range(-0.08, 0.08);
    g.add(place(sphere(rad, i % 3 === 2 ? m2 : m, 9), { x, y: y - rad * 0.6, z }));
    if (i > 1) g.add(place(sphere(rad * 0.7, m, 8), { x: x + rad * 0.55, y: y - rad * 0.3, z: z + r.range(-0.3, 0.3) }));
    y += rise + rad * 0.35;
    x += drift + r.range(-0.1, 0.15);
    z += r.range(-0.15, 0.15);
  }
  return g;
}

// --- signs -----------------------------------------------------------------

/** Flat sign with 0..1 UVs (text stays full size on big boards). Text faces +z. */
export function bigSign({ text, w, h, bg = PALETTE.navy, fg = '#ffffff', depth = 0.15, border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// --- conveyor ----------------------------------------------------------------

/** Enclosed conveyor gallery (w x h cross-section) between two points [x,y,z]. */
export function gallery(from, to, { w = 1.1, h = 1.0, color = PALETTE.steelLight, roofColor = PALETTE.roofGrey } = {}) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  dir.normalize();
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), [mat(color), mat(color), mat(roofColor), mat(shade(color, -0.2)), mat(color), mat(color)]);
  g.add(body);
  // ribs
  const ribM = metal(PALETTE.steelDark);
  const n = Math.max(2, Math.round(len / 1.6));
  for (let i = 0; i <= n; i++) {
    const rib = new THREE.Mesh(new THREE.BoxGeometry(w + 0.08, h + 0.08, 0.1), ribM);
    rib.position.z = -len / 2 + (i / n) * len;
    g.add(rib);
  }
  g.position.copy(a.clone().add(b).multiplyScalar(0.5));
  g.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), dir);
  return g;
}

// --- vehicles ----------------------------------------------------------------

function wheels(g, xs, half, r = 0.35, w = 0.25) {
  const wm = mat(PALETTE.black);
  for (const x of xs) for (const s of [-1, 1]) {
    const geo = new THREE.CylinderGeometry(r, r, w, 10);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, wm);
    m.position.set(x, r, s * half);
    g.add(m);
  }
}

/** Yellow forklift, forks pointing +x, optionally carrying a paper roll. */
export function forklift({ load = true } = {}) {
  const g = new THREE.Group();
  const y = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  g.add(place(box(1.6, 0.8, 1.0, y), { y: 0.3 }));
  g.add(place(box(0.5, 0.6, 1.0, dark), { x: -0.6, y: 1.1 }));
  for (const s of [-1, 1]) {
    g.add(place(box(0.06, 1.2, 0.06, dark), { x: 0.0, y: 1.1, z: s * 0.45 }));
    g.add(place(box(0.06, 0.06, 0.06, dark), { x: -0.7, y: 2.2, z: s * 0.45 }));
  }
  g.add(place(box(0.8, 0.08, 1.0, dark), { x: -0.35, y: 2.3 }));
  g.add(place(box(0.12, 2.4, 0.9, metal(PALETTE.steelDark)), { x: 0.85, y: 0.1 }));
  g.add(place(box(0.9, 0.06, 0.6, metal(PALETTE.steelDark)), { x: 1.35, y: 0.25 }));
  wheels(g, [-0.45, 0.45], 0.5, 0.3, 0.2);
  if (load) g.add(place(paperRoll({ r: 0.55, h: 1.2 }), { x: 1.45, y: 0.32 }));
  return g;
}

/** Wheel loader for the chip pile, bucket pointing +x. */
export function wheelLoader() {
  const g = new THREE.Group();
  const y = mat(PALETTE.orange, { roughness: 0.5 });
  g.add(place(box(2.4, 0.9, 1.4, y), { y: 0.5 }));
  g.add(place(box(1.0, 1.0, 1.2, y), { x: -0.3, y: 1.4 }));
  g.add(place(box(0.9, 0.7, 1.25, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: -0.3, y: 1.55 }));
  g.add(place(box(0.5, 0.25, 1.3, mat(PALETTE.darkGrey)), { x: -1.1, y: 1.4 }));
  g.add(place(box(0.7, 0.8, 1.8, metal(PALETTE.steelDark)), { x: 1.7, y: 0.15 }));
  wheels(g, [-0.7, 0.8], 0.7, 0.5, 0.35);
  return g;
}

/** Flatbed lorry (length along X, cab at +x) loaded with lying paper rolls. */
export function rollLorry({ color = PALETTE.red, rolls = 4 } = {}) {
  const g = new THREE.Group();
  const c = mat(color, { roughness: 0.5 });
  g.add(place(box(2.0, 2.2, 2.3, c), { x: 3.6, y: 0.55 }));
  g.add(place(box(0.05, 0.9, 1.9, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.61, y: 1.75 }));
  g.add(place(box(0.6, 0.15, 2.3, mat(PALETTE.darkGrey)), { x: 4.4, y: 0.5 }));
  g.add(place(box(7.0, 0.3, 2.4, mat(PALETTE.steelDark)), { x: -0.9, y: 0.75 }));
  g.add(place(box(0.15, 1.2, 2.4, mat(PALETTE.steelDark)), { x: 2.55, y: 1.05 }));
  wheels(g, [3.6, -2.4, -3.4], 1.05, 0.45, 0.3);
  const step = 6.4 / rolls;
  for (let i = 0; i < rolls; i++) {
    const roll = paperRoll({ r: 0.75, h: 1.4, color: i % 3 === 1 ? '#c9a46e' : '#f4f2ea' });
    g.add(place(roll, { x: 2.0 - step / 2 - i * step, y: 1.05 }));
  }
  // load strap
  g.add(place(box(6.4, 0.06, 0.08, mat(PALETTE.orange)), { x: -0.9, y: 2.47 }));
  return g;
}

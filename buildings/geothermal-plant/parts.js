// Local helpers for the geothermal plant: steam, insulated pipelines, wellheads, signs.
import * as THREE from 'three';
import {
  PALETTE, box, cylinder, place, mat, metal, rng, canvasTexture, signTexture, textured, pipe,
} from '../../src/lib/index.js';

export const STEAM = mat('#f3f5f6', { transparent: true, opacity: 0.88, roughness: 1, depthWrite: false });
export const PIPE = mat(PALETTE.aluminium, { metalness: 0.35, roughness: 0.35 });
const PIPE_BAND = mat(PALETTE.steel, { metalness: 0.4, roughness: 0.4 });
const SUPPORT = mat(PALETTE.steelDark);
const SUPPORT_FOOT = mat(PALETTE.concrete);

/** Dark basalt ground with rusty and sulphur blotches. */
export function volcanicGround() {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    const r = rng(77);
    ctx.fillStyle = '#4b4541';
    ctx.fillRect(0, 0, W, H);
    const blot = (n, colors, rMin, rMax) => {
      for (let i = 0; i < n; i++) {
        ctx.fillStyle = r.pick(colors);
        ctx.beginPath();
        ctx.arc(r() * W, r() * H, r.range(rMin, rMax), 0, Math.PI * 2);
        ctx.fill();
      }
    };
    blot(40, ['#5a524b', '#3d3835', '#614a3c'], 8, 26);
    blot(500, ['#2f2b29', '#6b625a', '#57504a', '#7a5a45'], 1, 3);
  }, { key: 'geothermal-plant:basalt' });
  tex.repeat.set(1 / 8, 1 / 8);
  return textured(tex, { roughness: 0.95 });
}

/** Rising steam plume of low-poly puffs, drifting towards +x/-z. */
export function plume({ h = 12, r0 = 0.7, grow = 2.2, seed = 1, drift = [0.25, -0.12] } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const n = Math.max(3, Math.round(h / Math.min(1.6, (r0 + grow / 2) * 1.1)));
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const y = t * h;
    const rad = r0 + grow * t;
    const cx = drift[0] * y, cz = drift[1] * y;
    const puffs = i === 0 ? 1 : 2 + (i > n / 2 ? 1 : 0);
    for (let k = 0; k < puffs; k++) {
      const pr = rad * r.range(0.65, 0.95);
      const m = new THREE.Mesh(new THREE.IcosahedronGeometry(pr, 1), STEAM);
      m.position.set(cx + r.range(-0.3, 0.3) * rad, y + pr * 0.6, cz + r.range(-0.3, 0.3) * rad);
      g.add(m);
    }
  }
  return g;
}

/**
 * Elevated insulated pipeline along a polyline of [x, y, z] points.
 * Horizontal segments at low level get trestle supports every ~2.4 m;
 * aluminium cladding bands every ~1.8 m.
 */
export function pipeline(points, { radius = 0.32, ground = 0, supports = true } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) {
    const a = new THREE.Vector3(...points[i]), b = new THREE.Vector3(...points[i + 1]);
    g.add(pipe(a, b, radius, PIPE));
    const len = a.distanceTo(b);
    const dir = new THREE.Vector3().subVectors(b, a).normalize();
    const nb = Math.floor(len / 1.8);
    for (let k = 1; k <= nb; k++) {
      const p = a.clone().addScaledVector(dir, (len * k) / (nb + 1));
      const q = p.clone().addScaledVector(dir, 0.08);
      g.add(pipe(p, q, radius * 1.12, PIPE_BAND));
    }
    const horizontal = Math.abs(a.y - b.y) < 0.01;
    if (supports && horizontal && a.y - ground < 2.5) {
      const ns = Math.max(1, Math.round(len / 2.4));
      const perp = new THREE.Vector3(-dir.z, 0, dir.x);
      for (let k = 0; k < ns; k++) {
        const p = a.clone().addScaledVector(dir, (len * (k + 0.5)) / ns);
        const hh = p.y - radius - ground;
        for (const s of [-1, 1]) {
          const leg = p.clone().addScaledVector(perp, s * (radius + 0.12));
          g.add(place(box(0.12, hh, 0.12, SUPPORT), { x: leg.x, y: ground, z: leg.z }));
        }
        const cross = box(radius * 2 + 0.5, 0.12, 0.16, SUPPORT);
        g.add(place(cross, { x: p.x, y: ground + hh - 0.12, z: p.z, ry: THREE.MathUtils.radToDeg(Math.atan2(dir.x, dir.z)) }));
        g.add(place(box(0.6, 0.12, 0.6, SUPPORT_FOOT), { x: p.x, y: ground, z: p.z }));
      }
    }
  }
  for (let i = 1; i < points.length - 1; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.05, 10, 8), PIPE);
    s.position.set(...points[i]);
    g.add(s);
  }
  return g;
}

/** Wellhead: concrete cellar pad, master valve stack ("christmas tree") with red handwheels, side outlet. */
export function wellhead({ seed = 1, outlet = 'x', steam = false } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelLight, { roughness: 0.45 });
  const red = mat(PALETTE.red);
  g.add(box(2.6, 0.2, 2.6, mat(PALETTE.concrete)));
  g.add(place(box(1.6, 0.06, 1.6, mat('#2b2725')), { y: 0.2 }));
  // casing + spool stack with flanges
  g.add(place(cylinder(0.32, 0.36, 1.0, steel, 10), { y: 0.2 }));
  for (const y of [1.15, 1.75, 2.35]) {
    g.add(place(cylinder(0.42, 0.42, 0.12, mat(PALETTE.steelDark), 10), { y }));
    g.add(place(cylinder(0.26, 0.26, 0.48, steel, 10), { y: y + 0.12 }));
  }
  // valve bodies with handwheels
  for (const [y, side] of [[1.35, 1], [1.95, -1]]) {
    g.add(place(box(0.5, 0.3, 0.5, red), { y }));
    const wheel = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.05, 6, 12), red);
    wheel.position.set(0, y + 0.15, side * 0.55);
    g.add(wheel);
    g.add(place(box(0.06, 0.06, 0.3, red), { y: y + 0.12, z: side * 0.4 }));
  }
  g.add(place(cylinder(0.3, 0.3, 0.12, mat(PALETTE.steelDark), 10), { y: 2.83 }));
  // bleed line + small vent wisp
  g.add(place(cylinder(0.06, 0.06, 0.6, steel, 6), { x: 0.2, y: 2.95 }));
  if (steam) g.add(place(plume({ h: 3.6, r0: 0.16, grow: 0.5, seed, drift: [0.1, 0.05] }), { x: 0.2, y: 3.3 }));
  // side outlet towards the pipeline
  const o = outlet === 'x' ? [1, 0] : outlet === '-x' ? [-1, 0] : outlet === 'z' ? [0, 1] : [0, -1];
  g.add(pipe([0, 1.2, 0], [o[0] * 1.3, 1.2, o[1] * 1.3], 0.22, PIPE));
  // guard railing posts at the pad corners
  for (const [x, z] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) {
    g.add(place(box(0.08, 1, 0.08, mat(PALETTE.yellow)), { x, y: 0.2, z }));
  }
  return g;
}

/** Sign slab with 0..1 UVs on the front face (the lib sign() shrinks text on faces > 1 m). */
export function bigSign({ text, w, h, bg, fg, depth = 0.2, border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

/** Lava rock: flattened low-poly lump. */
export function lavaRock(r, seed) {
  const rr = rng(seed);
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(rr.pick(['#35302d', '#433b36', '#2c2826'])));
  const sy = rr.range(0.45, 0.7);
  m.scale.set(1, sy, rr.range(0.8, 1.2));
  m.rotation.y = rr.range(0, Math.PI);
  m.position.y = r * sy * 0.6;
  return new THREE.Group().add(m);
}

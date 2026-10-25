import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, dome, beam, place, group, mat, rng, shade, canvasTexture, textured,
} from '../../src/lib/index.js';

export const ADOBE = '#be6a3f';
export const TURQUOISE = '#3aa79e';

/** Mottled, hand-plastered adobe material (UVs are in metres; one tile = 3 m). */
export function adobe(color = ADOBE) {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    const r = rng(7);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    for (let i = 0; i < 70; i++) {
      ctx.globalAlpha = 0.06 + r() * 0.08;
      ctx.fillStyle = r() < 0.5 ? shade(color, 0.18) : shade(color, -0.14);
      ctx.beginPath();
      ctx.ellipse(r() * w, r() * h, 4 + r() * 14, 3 + r() * 8, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }, { key: 'adobe-pueblo:adobe:' + color });
  tex.repeat.set(1 / 3, 1 / 3);
  return textured(tex, { roughness: 0.95 });
}

const wood = () => mat(PALETTE.woodLight);
const woodDark = () => mat(PALETTE.woodDark);

/**
 * Rough wooden ladder standing on y = 0 at z = lean, resting on a wall edge at
 * (y = rest, z = 0) and poking `ext` metres above it. Leans towards -Z.
 */
export function ladder({ rest = 3, lean = 0.9, ext = 1.1, w = 0.62 } = {}) {
  const g = new THREE.Group();
  const top = rest + ext;
  const zTop = lean - (lean * top) / rest;
  const m = wood();
  for (const x of [-w / 2, w / 2]) g.add(beam([x, 0, lean], [x, top, zTop], 0.09, m));
  const n = Math.floor(top / 0.38);
  for (let i = 1; i <= n; i++) {
    const t = (i * 0.38) / top;
    g.add(place(box(w + 0.12, 0.06, 0.07, m), { y: t * top - 0.03, z: lean + (zTop - lean) * t }));
  }
  return g;
}

/** Hanging string of dried red chillies, origin at the hook (top), hangs down. */
export function ristra({ len = 1.3, seed = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const reds = [mat(PALETTE.red), mat(shade(PALETTE.red, -0.2)), mat('#b3261e')];
  g.add(place(box(0.03, len, 0.03, mat(PALETTE.hay)), { y: -len }));
  const n = Math.round(len / 0.14);
  for (let i = 0; i < n; i++) {
    const y = -0.12 - i * 0.14;
    const spread = 0.17 * (1 - (i / n) * 0.45);
    for (let k = 0; k < 3; k++) {
      const a = (k / 3) * Math.PI * 2 + i * 0.9;
      const c = cone(0.075, 0.3, r.pick(reds), 5);
      // point outwards and down
      g.add(place(c, { x: Math.cos(a) * spread * 0.5, y, z: Math.sin(a) * spread * 0.5, rx: 180 + Math.sin(a) * 40, rz: -Math.cos(a) * 40 }));
    }
  }
  g.add(place(cone(0.1, 0.3, reds[0], 5), { y: -len + 0.05, rx: 180 }));
  return g;
}

/** Beehive horno bread oven on a low adobe plinth; mouth faces +Z. */
export function horno({ r = 0.8, color = ADOBE } = {}) {
  const g = new THREE.Group();
  const m = adobe(shade(color, 0.12));
  g.add(box(r * 2 + 0.3, 0.35, r * 2 + 0.3, adobe(shade(color, -0.05))));
  const d = dome({ radius: r, height: r * 1.25, material: m, segments: 12 });
  g.add(place(d, { y: 0.35 }));
  // arched mouth + smoke hole
  const dark = mat('#2a1a12');
  g.add(place(box(0.5, 0.42, 0.3, dark), { y: 0.38, z: r - 0.18 }));
  g.add(place(cylinder(0.25, 0.25, 0.3, dark, 8), { y: 0.8, z: r - 0.2, rx: 90 }));
  g.add(place(box(0.14, 0.1, 0.14, dark), { y: 0.35 + r * 1.22, z: -0.1 }));
  // wooden door-board leaning beside the mouth
  g.add(place(box(0.55, 0.6, 0.06, woodDark()), { x: r * 0.75, y: 0.35, z: r + 0.1, ry: -25, rx: -12 }));
  return g;
}

/** Small stack of split firewood (logs along X). */
export function woodpile({ w = 1.2, rows = 3, seed = 2 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const ms = [mat(PALETTE.wood), mat(PALETTE.woodLight), mat(PALETTE.trunk)];
  for (let j = 0; j < rows; j++) {
    const n = rows - j + 1;
    for (let i = 0; i < n; i++) {
      const z = (i - (n - 1) / 2) * 0.22;
      g.add(place(cylinder(0.1, 0.1, w * r.range(0.85, 1), r.pick(ms), 6), { x: -w / 2, y: 0.1 + j * 0.18, z, rz: -90 }));
    }
  }
  return g;
}

/** Wooden ramada: four posts, two vigas and a latilla (stick) roof. */
export function ramada({ w = 3, d = 2.6, h = 2.4 } = {}) {
  const g = new THREE.Group();
  const m = wood(), md = woodDark();
  for (const x of [-w / 2, w / 2]) for (const z of [-d / 2, d / 2]) g.add(place(cylinder(0.09, 0.11, h, md, 6), { x, z }));
  for (const z of [-d / 2, d / 2]) g.add(place(cylinder(0.12, 0.12, w + 0.6, m, 6), { x: -w / 2 - 0.3, y: h + 0.1, z, rz: -90 }));
  const n = Math.round(d / 0.22);
  for (let i = 0; i <= n; i++) {
    const z = -d / 2 - 0.25 + ((d + 0.5) * i) / n;
    g.add(place(cylinder(0.05, 0.05, w + 0.3, mat(i % 2 ? PALETTE.woodLight : PALETTE.hay), 4), { x: -w / 2 - 0.15, y: h + 0.27, z, rz: -90 }));
  }
  return g;
}

/** Saguaro-style cactus with a couple of arms. */
export function cactus({ h = 2.2, seed = 1 } = {}) {
  const r = rng(seed);
  const m = mat('#4f8a3a');
  const g = new THREE.Group();
  const rad = 0.18;
  g.add(cylinder(rad, rad, h, m, 7));
  g.add(place(sphere(rad, m, 7), { y: h - rad }));
  const arms = r.int(1, 2);
  for (let i = 0; i < arms; i++) {
    const side = i === 0 ? 1 : -1;
    const ay = h * r.range(0.35, 0.55);
    const ah = h * r.range(0.25, 0.4);
    const ar = rad * 0.75;
    g.add(place(cylinder(ar, ar, 0.45, m, 6), { x: side * 0.02, y: ay, rz: -side * 90 }));
    g.add(place(cylinder(ar, ar, ah, m, 6), { x: side * 0.45, y: ay - ar }));
    g.add(place(sphere(ar, m, 6), { x: side * 0.45, y: ay - ar + ah - ar }));
  }
  return g;
}

/** Spiky yucca / agave tuft. */
export function yucca({ h = 0.9, seed = 3 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const m = mat('#7a9a4a');
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * 360 + r.range(-15, 15);
    g.add(place(cone(0.07, h * r.range(0.8, 1.1), m, 4), { ry: a, rx: r.range(20, 45) }));
  }
  return g;
}

/** Clay olla (water pot). */
export function pot({ r = 0.3, h = 0.5, color = '#e8d6b4', band = PALETTE.black } = {}) {
  return group(
    cylinder(r * 0.65, r * 0.55, h * 0.3, mat(color), 10),
    place(cylinder(r * 0.7, r, h * 0.4, mat(color), 10), { y: h * 0.3 }),
    place(cylinder(r * 0.45, r * 0.7, h * 0.3, mat(band), 10), { y: h * 0.7 }),
  );
}

/** Small window with a dark recess, turquoise frame and a wooden lintel; faces +Z. */
export function window_({ w = 0.6, h = 0.62, frame = TURQUOISE } = {}) {
  return group(
    place(box(w + 0.16, h + 0.16, 0.06, mat(frame)), { y: -0.08, z: 0.03 }),
    place(box(w, h, 0.08, mat('#24303d', { roughness: 0.3, metalness: 0.3 })), { z: 0.05 }),
    place(box(w + 0.5, 0.14, 0.14, wood()), { y: h + 0.1, z: 0.07 }),
  );
}

/** Plank door with a wooden lintel; faces +Z. */
export function doorway({ w = 0.95, h = 1.95, color = TURQUOISE } = {}) {
  const g = group(
    place(box(w + 0.14, h + 0.07, 0.06, mat('#3a2616')), { z: 0.03 }),
    place(box(w, h, 0.1, mat(color)), { z: 0.05 }),
    place(box(w + 0.6, 0.16, 0.16, wood()), { y: h + 0.08, z: 0.08 }),
  );
  for (let i = 1; i < 3; i++) g.add(place(box(0.03, h - 0.1, 0.02, mat(shade(color, -0.25))), { x: -w / 2 + (w * i) / 3, y: 0.05, z: 0.11 }));
  return g;
}

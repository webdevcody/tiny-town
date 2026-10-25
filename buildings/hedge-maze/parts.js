import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, group, place, mat, surface, textured, signTexture, shade,
} from '../../src/lib/index.js';

// Clipped hedge: leafy sides, lighter clipped top.
export function hedgeMats() {
  const side = surface('grass', PALETTE.foliageDark, { size: 1.5 });
  const top = surface('grass', shade(PALETTE.foliage, 0.06), { size: 1.5 });
  return [side, side, top, side, side, side];
}

export function hedgeBlock(w, h, d) {
  return box(w, h, d, hedgeMats());
}

const leaf = () => mat(PALETTE.foliageDark);
const leafLight = () => mat(PALETTE.foliage);

/** Terracotta pot, origin at its base. Returns { obj, top }. */
function pot(r = 0.35, h = 0.5) {
  const m = mat(PALETTE.terracotta);
  return group(cylinder(r, r * 0.75, h, m, 10), place(cylinder(r * 1.08, r * 1.08, 0.08, m, 10), { y: h - 0.08 }));
}

/** Ball-on-a-stem topiary in a pot. */
export function ballTopiary({ h = 1.8, r = 0.5 } = {}) {
  const ph = 0.5;
  return group(
    pot(0.35, ph),
    place(cylinder(0.05, 0.06, h - ph - r, mat(PALETTE.trunk), 6), { y: ph }),
    place(sphere(r, leafLight(), 10), { y: h - 2 * r + 0.1 })
  );
}

/** Tiered "pom-pom" topiary: three stacked balls getting smaller. */
export function tieredTopiary({ h = 2.6 } = {}) {
  const ph = 0.55;
  const m = leaf();
  const g = group(pot(0.4, ph), place(cylinder(0.06, 0.07, h - ph - 0.3, mat(PALETTE.trunk), 6), { y: ph }));
  const balls = [[0.42, 0.75], [0.32, 1.45], [0.22, 2.0]];
  const k = (h - ph) / 2.25;
  for (const [r, y] of balls) g.add(place(sphere(r * k, m, 10), { y: ph + y * k - r * k }));
  return g;
}

/** Clipped cone (obelisk) topiary standing in the ground. */
export function coneTopiary({ h = 2.6, r = 0.6 } = {}) {
  return group(
    cylinder(r * 0.9, r, 0.25, leaf(), 8),
    place(cone(r, h - 0.25, leaf(), 8), { y: 0.25 })
  );
}

/** Spiral topiary: a cone wound with a darker helix of leaf balls. */
export function spiralTopiary({ h = 2.8, r = 0.65 } = {}) {
  const ph = 0.5;
  const g = group(pot(0.45, ph), place(cone(r, h - ph, leafLight(), 10), { y: ph }));
  const dark = leaf();
  const n = 14;
  for (let i = 0; i < n; i++) {
    const t = i / n;
    const a = t * Math.PI * 2 * 2.5;
    const rr = r * (1 - t) * 0.92 + 0.05;
    const s = 0.2 * (1 - t * 0.6);
    g.add(place(sphere(s, dark, 6), { x: Math.cos(a) * rr, z: Math.sin(a) * rr, y: ph + t * (h - ph) - s }));
  }
  return g;
}

/** Rabbit-shaped topiary on a low clipped plinth. Faces +z. */
export function rabbitTopiary({ s = 1 } = {}) {
  const m = mat(shade(PALETTE.foliage, 0.05));
  const body = sphere(0.7, m, 10);
  body.scale.set(1, 1.05, 1.25);
  const head = sphere(0.42, m, 10);
  const ear = (x) => {
    const e = sphere(0.14, m, 8);
    e.scale.set(1, 3.2, 0.8);
    return place(e, { x, y: 2.15, z: 0.35, rx: -12, rz: x > 0 ? -10 : 10 });
  };
  const g = group(
    box(1.5, 0.3, 1.9, hedgeMats()),
    place(body, { y: 0.3 }),
    place(head, { y: 1.45, z: 0.45 }),
    ear(-0.17),
    ear(0.17),
    place(sphere(0.22, m, 8), { y: 0.55, z: -0.85 })
  );
  g.scale.setScalar(s);
  return g;
}

/** Tiny visitor figure. */
export function person({ shirt = PALETTE.red, legs = PALETTE.navy, skin = '#e8b48c' } = {}) {
  return group(
    place(box(0.3, 0.8, 0.2, legs), {}),
    place(box(0.42, 0.62, 0.26, shirt), { y: 0.8 }),
    place(sphere(0.14, mat(skin), 8), { y: 1.42 })
  );
}

/**
 * Sign with 0..1 UVs so the text fills the whole face (the lib sign() uses metre
 * UVs and shrinks on faces over 1 m). Text faces +z, origin at bottom centre.
 */
export function boardSign({ text, w, h, depth = 0.12, bg = PALETTE.roofGreen, fg = '#ffffff', border = '#f1eee6' }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

import * as THREE from 'three';
import { PALETTE, place, group, box, cylinder, sphere, mat, metal, textured, signTexture, emissive } from '../../src/lib/index.js';

export const POST_RED = '#c8241c';
export const POST_YELLOW = '#f2c21b';

/**
 * Sign board with 0..1 UVs on every face, so the text fills the whole board
 * (the lib's sign() uses metre UVs and shrinks text on boards over 1 m).
 * Text faces +z; base at y = 0.
 */
export function flatSign({ text, w, h, depth = 0.15, bg = POST_RED, fg = '#ffffff', border = null, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Red pillar postbox with a domed cap and posting slot facing +z. */
export function pillarBox({ h = 1.35, r = 0.27 } = {}) {
  const red = mat(POST_RED, { roughness: 0.45 });
  const black = mat(PALETTE.black);
  const bodyH = h - 0.32;
  const cap = sphere(r + 0.04, red, 12);
  cap.scale.set(1, 0.55, 1);
  return group(
    cylinder(r + 0.05, r + 0.07, 0.12, black, 12),
    place(cylinder(r, r, bodyH, red, 12), { y: 0.12 }),
    place(cylinder(r + 0.05, r + 0.05, 0.1, red, 12), { y: 0.12 + bodyH }),
    place(cap, { y: 0.17 + bodyH - (r + 0.04) * 0.55 }),
    place(box(r * 1.1, 0.06, 0.06, black), { y: bodyH - 0.12, z: r - 0.01 }),
    place(box(r * 0.8, 0.22, 0.04, mat(PALETTE.white)), { y: bodyH - 0.5, z: r - 0.01 })
  );
}

/** Red delivery van, length along X with the cab at +x (~4.6 m before scaling). */
export function postVan() {
  const red = mat(POST_RED, { roughness: 0.4, metalness: 0.2 });
  const yellow = mat(POST_YELLOW);
  const black = mat(PALETTE.black);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = new THREE.Group();
  // chassis
  g.add(place(box(4.4, 0.35, 1.7, mat(PALETTE.darkGrey)), { y: 0.3 }));
  // cargo box with yellow band and POST lettering on both sides
  g.add(place(box(3.0, 1.95, 1.9, red), { x: -0.65, y: 0.6 }));
  g.add(place(box(3.02, 0.22, 1.94, yellow), { x: -0.65, y: 0.85 }));
  for (const sz of [1, -1]) {
    g.add(place(flatSign({ text: 'POST', w: 2.2, h: 0.75, depth: 0.04, bg: POST_RED, fg: POST_YELLOW }), { x: -0.65, y: 1.4, z: sz * 0.96, ry: sz > 0 ? 0 : 180 }));
  }
  // rear doors seam
  g.add(place(box(0.04, 1.7, 0.06, black), { x: -2.16, y: 0.7 }));
  // cab
  g.add(place(box(1.3, 1.25, 1.8, red), { x: 1.5, y: 0.6 }));
  g.add(place(box(0.7, 0.6, 1.8, red), { x: 1.15, y: 1.85 }));
  g.add(place(box(0.06, 0.6, 1.6, glassM), { x: 1.55, y: 1.85, rz: -25 }));
  g.add(place(box(0.5, 0.45, 1.84, glassM), { x: 1.2, y: 1.4 }));
  g.add(place(box(0.08, 0.12, 0.3, emissive(PALETTE.windowLit, 0.6)), { x: 2.16, y: 0.9, z: 0.65 }));
  g.add(place(box(0.08, 0.12, 0.3, emissive(PALETTE.windowLit, 0.6)), { x: 2.16, y: 0.9, z: -0.65 }));
  g.add(place(box(0.1, 0.25, 1.8, black), { x: 2.2, y: 0.4 }));
  const wheelM = black;
  for (const x of [-1.4, 1.3]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.36, 0.36, 0.26, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.36, sz * 0.85);
    g.add(wheel);
  }
  return g;
}

/** Roller shutter door (sticks out to +z from z = 0). */
export function rollerShutter({ w = 1.6, h = 2.2, color = PALETTE.steelLight } = {}) {
  const g = group(place(box(w + 0.2, h + 0.15, 0.06, mat(PALETTE.darkGrey)), { z: 0.03 }));
  g.add(place(box(w, h, 0.08, mat(color)), { z: 0.05 }));
  for (let y = 0.2; y < h; y += 0.22) g.add(place(box(w, 0.03, 0.1, mat(PALETTE.grey)), { y, z: 0.05 }));
  g.add(place(box(w + 0.3, 0.3, 0.3, metal(PALETTE.steel)), { y: h, z: 0.15 }));
  return g;
}

/** Stack of cardboard parcels on a pallet. */
export function parcelPallet({ seed = 0 } = {}) {
  const card = mat('#c19a62');
  const cardDark = mat('#a67f4c');
  const tape = mat('#e8dcc0');
  const g = group(box(1.0, 0.14, 0.9, mat(PALETTE.wood)));
  const layout = [
    [-0.25, 0.14, -0.2, 0.45, 0.35, 0.42],
    [0.24, 0.14, -0.2, 0.46, 0.4, 0.42],
    [-0.22, 0.14, 0.22, 0.5, 0.3, 0.4],
    [0.25, 0.14, 0.22, 0.42, 0.45, 0.4],
    [-0.1, 0.5, -0.15, 0.55, 0.3, 0.5],
    [0.2, 0.5, 0.2, 0.35, 0.28, 0.35],
  ];
  layout.forEach(([x, y, z, w, h, d], i) => {
    if (seed && i === 5) return;
    g.add(place(box(w, h, d, (i + seed) % 2 ? card : cardDark), { x, y, z }));
    g.add(place(box(0.06, h + 0.01, d + 0.01, tape), { x, y, z }));
  });
  return g;
}

/** Wire roll cage full of mail sacks. */
export function rollCage() {
  const steel = metal(PALETTE.steelLight);
  const g = new THREE.Group();
  g.add(place(box(0.8, 0.08, 0.7, steel), { y: 0.12 }));
  for (const x of [-0.38, 0.38]) for (const z of [-0.33, 0.33]) g.add(place(box(0.04, 1.5, 0.04, steel), { x, y: 0.12, z }));
  for (const y of [0.6, 1.1, 1.6]) {
    g.add(place(box(0.8, 0.03, 0.03, steel), { y, z: 0.33 }));
    g.add(place(box(0.8, 0.03, 0.03, steel), { y, z: -0.33 }));
    g.add(place(box(0.03, 0.03, 0.7, steel), { x: 0.38, y }));
    g.add(place(box(0.03, 0.03, 0.7, steel), { x: -0.38, y }));
  }
  const sack = mat('#8a7a55');
  g.add(place(sphere(0.32, sack, 6), { x: -0.15, y: 0.42, z: 0.05 }));
  g.add(place(sphere(0.3, sack, 6), { x: 0.18, y: 0.48, z: -0.08 }));
  g.add(place(sphere(0.26, mat('#9a8a62'), 6), { x: 0.0, y: 0.85, z: 0.05 }));
  return g;
}

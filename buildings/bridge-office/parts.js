import * as THREE from 'three';
import { PALETTE, mat, textured, signTexture, box, place, group } from '../../src/lib/index.js';

/**
 * Sign board with 0..1 UVs on the +z face, so the text fills the whole board
 * (the lib sign() uses metre UVs, which shrinks text on boards over 1 m).
 */
export function bigSign({ text, w, h, depth = 0.25, bg = PALETTE.navy, fg = '#ffffff', border = null, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Simple city bus, length along X (front at +x). */
export function bus({ color = PALETTE.red, len = 9 } = {}) {
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = group(
    place(box(len, 2.5, 2.4, body), { y: 0.4 }),
    place(box(len - 1.2, 0.9, 2.44, glassM), { x: -0.4, y: 1.55 }),
    place(box(0.06, 1.3, 2.1, glassM), { x: len / 2, y: 1.15 }),
    place(box(len - 0.4, 0.12, 2.2, mat(PALETTE.white)), { y: 2.9 }),
    place(box(1.6, 0.3, 0.06, mat('#ffd34d')), { x: len / 2 - 1, y: 2.55, z: 1.21 })
  );
  const wheelM = mat(PALETTE.black);
  for (const x of [len * 0.32, -len * 0.3]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.45, sz * 1.08);
    g.add(wheel);
  }
  return g;
}

/** Bollard row along X. */
export function bollards({ n, spacing, material }) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(place(box(0.22, 0.8, 0.22, material), { x: (i - (n - 1) / 2) * spacing }));
  return g;
}

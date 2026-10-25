import * as THREE from 'three';
import { PALETTE, box, sphere, cylinder, beam, place, group, mat, metal, textured, signTexture } from '../../src/lib/index.js';

/** Little standing figure (~1.75 m), facing +z. */
export function person({ shirt = PALETTE.red, pants = PALETTE.navy, skin = '#e0b08a', hair = '#4a3020' } = {}) {
  const s = mat(shirt), p = mat(pants), k = mat(skin);
  return group(
    place(box(0.15, 0.85, 0.18, p), { x: -0.1 }),
    place(box(0.15, 0.85, 0.18, p), { x: 0.1 }),
    place(box(0.46, 0.62, 0.26, s), { y: 0.83 }),
    place(box(0.11, 0.56, 0.13, s), { x: -0.29, y: 0.86 }),
    place(box(0.11, 0.56, 0.13, s), { x: 0.29, y: 0.86 }),
    place(sphere(0.15, k, 8), { y: 1.44 }),
    place(box(0.26, 0.08, 0.26, mat(hair)), { y: 1.68 })
  );
}

/** Bicycle, length along X. */
export function bike({ color = PALETTE.red } = {}) {
  const tyre = mat(PALETTE.black);
  const frame = mat(color);
  const wheel = (x) => place(cylinder(0.32, 0.32, 0.05, tyre, 10), { x, y: 0.32, z: 0.025, rx: 90 });
  return group(
    wheel(-0.52), wheel(0.52),
    beam([-0.52, 0.34, 0], [0, 0.72, 0], 0.05, frame),
    beam([0, 0.72, 0], [0.52, 0.34, 0], 0.05, frame),
    beam([-0.1, 0.36, 0], [0.42, 0.8, 0], 0.05, frame),
    place(box(0.22, 0.05, 0.1, mat(PALETTE.black)), { x: -0.12, y: 0.82 }),
    place(box(0.05, 0.05, 0.45, metal(PALETTE.steel)), { x: 0.42, y: 0.84 })
  );
}

/** Sign board with 0..1 UVs on the front, so big text fills the whole face. */
export function bigSign({ text, w, h, bg, fg, depth = 0.15 }) {
  const tw = 512;
  const tex = signTexture(text, { bg, fg, width: tw, height: Math.max(32, Math.round((tw * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geom = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geom, [side, side, side, side, face, side]);
}

// Local helpers for the Courtyard Tenement Block.
import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, box, place, group, gableRoof, windowPanel,
  mat, textured, signTexture, canvasTexture, surface, cylinder, rng, shade,
} from '../../src/lib/index.js';

/**
 * Sign with 0..1 UVs on the front face so the text fills the board at any size
 * (the lib sign() uses metre UVs and shrinks text on boards over 1 m).
 */
export function boardSign({ text, w, h, bg, fg = '#ffffff', depth = 0.12, border = null }) {
  const tw = 256;
  const th = Math.max(16, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geom = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geom, [side, side, side, side, face, side]);
}

/**
 * Mansard roof over a ring-shaped (perimeter block) plan.
 * outer = [x0, z0, x1, z1] wall outline, inner = [x0, z0, x1, z1] courtyard outline.
 * Steep slopes rise inwards from the street and outwards from the courtyard to a flat top.
 */
export function mansardRing({ outer, inner, h, inset = 1, overhang = 0.25, material, topMaterial }) {
  const b = new ShapeBuilder();
  const rect = ([x0, z0, x1, z1], d) => [[x0 - d, z1 + d], [x1 + d, z1 + d], [x1 + d, z0 - d], [x0 - d, z0 - d]];
  const ob = rect(outer, overhang), ot = rect(outer, -inset);
  const ib = rect(inner, -overhang), it = rect(inner, inset);
  for (let i = 0; i < 4; i++) {
    const j = (i + 1) % 4;
    const P = (r, k, y) => [r[k][0], y, r[k][1]];
    b.quad(P(ob, i, 0), P(ob, j, 0), P(ot, j, h), P(ot, i, h), 0); // street slope
    b.quad(P(ib, j, 0), P(ib, i, 0), P(it, i, h), P(it, j, h), 0); // courtyard slope
    b.quad(P(ot, i, h), P(ot, j, h), P(it, j, h), P(it, i, h), 1); // flat top
    b.quad(P(ob, j, 0), P(ob, i, 0), P(ib, i, 0), P(ib, j, 0), 1); // soffit
  }
  return new THREE.Mesh(b.build(), [
    material ?? surface('shingles', PALETTE.roofSlate, { size: 2 }),
    mat(topMaterial ?? PALETTE.roofGrey),
  ]);
}

/**
 * Block of wall with an arched opening cut through it along Z (carriage passage).
 * Base at y = 0, centred on x/z. Opening is `span` wide, arch springs at `spring`.
 */
export function archBlock({ w, h, d, span, spring, material }) {
  const r = span / 2;
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(-r, 0);
  s.lineTo(-r, spring);
  s.absarc(0, spring, r, Math.PI, 0, true);
  s.lineTo(r, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, h);
  s.lineTo(-w / 2, h);
  s.lineTo(-w / 2, 0);
  const geom = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 12 });
  geom.translate(0, 0, -d / 2);
  return new THREE.Mesh(geom, material);
}

/** Roof dormer: front face at z = 0, body goes back into the roof (-z). */
export function dormer({ w = 1.1, h = 1.5, d = 1.6, wall, roof, lit = false }) {
  const wm = mat(wall);
  return group(
    place(box(w, h, d, wm), { z: -d / 2 }),
    place(windowPanel({ w: w * 0.55, h: h * 0.62, lit, frame: PALETTE.white }), { y: h * 0.18 }),
    place(gableRoof({ w, d, h: 0.65, overhang: 0.12, ridge: 'z', material: roof, gableMaterial: wm }), { y: h, z: -d / 2 })
  );
}

const railTex = () =>
  canvasTexture(64, 32, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#26282b';
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 3, W, 3);
    for (let x = 2; x < W; x += 6) ctx.fillRect(x, 0, 2, H);
    ctx.fillRect(0, H * 0.45, W, 2);
  }, { key: 'courtyard-tenement:rail', repeat: true });

/** Wrought-iron balcony: slab + see-through railing, sticks out to +z from z = 0. */
export function balcony({ w = 1.8, depth = 0.8, railH = 0.9 }) {
  const tex = railTex();
  const rail = textured(tex, { transparent: true, alphaTest: 0.4, side: THREE.DoubleSide, color: '#ffffff' });
  const slab = mat(PALETTE.offWhite);
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w, railH).translate(0, railH / 2 + 0.15, depth), rail);
  const sideGeom = (x) => new THREE.PlaneGeometry(depth, railH).rotateY(Math.PI / 2).translate(x, railH / 2 + 0.15, depth / 2);
  return group(
    place(box(w + 0.1, 0.15, depth, slab), { z: depth / 2 }),
    place(box(w * 0.12, 0.25, depth * 0.7, slab), { x: -w * 0.35, y: -0.25, z: depth * 0.35 }),
    place(box(w * 0.12, 0.25, depth * 0.7, slab), { x: w * 0.35, y: -0.25, z: depth * 0.35 }),
    front,
    new THREE.Mesh(sideGeom(-w / 2), rail),
    new THREE.Mesh(sideGeom(w / 2), rail)
  );
}

/** Big courtyard tree: tall trunk with a cluster of leafy blobs (deterministic). */
export function courtTree({ h = 18, spread = 3.2, seed = 1, color = PALETTE.foliage }) {
  const r = rng(seed);
  const leaf = mat(color);
  const leaf2 = mat(shade(color, -0.12));
  const g = group(cylinder(0.22, 0.38, h * 0.62, mat(PALETTE.trunk), 7));
  const blobs = [[0, 0.72, 0, 1], [0.55, 0.6, 0.3, 0.75], [-0.5, 0.62, -0.35, 0.78], [-0.2, 0.86, 0.45, 0.62], [0.3, 0.9, -0.4, 0.55]];
  blobs.forEach(([bx, by, bz, bs], i) => {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(spread * bs, 1), i % 2 ? leaf2 : leaf);
    s.position.set(bx * spread, by * h, bz * spread);
    s.scale.set(1, 0.85 + r() * 0.2, 1);
    s.rotation.set(r() * 3, r() * 3, 0);
    g.add(s);
  });
  return g;
}

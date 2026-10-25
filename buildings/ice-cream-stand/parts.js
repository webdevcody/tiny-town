// Local helpers for the Giant Ice-Cream Stand (kept in this folder so src/lib stays frozen).
import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, canvasTexture, signTexture, textured, surface, mat, metal, emissive,
  box, cylinder, cone, sphere, group, place,
} from '../../src/lib/index.js';

export const PASTEL = {
  pink: '#f3a6c0',
  pinkDeep: '#e2789c',
  mint: '#9fdcc0',
  mintDeep: '#6fc3a0',
  lemon: '#f5e08a',
  lavender: '#c6b1e6',
  sky: '#a9d6ef',
  cream: '#fff1d2',
  waffle: '#d9a05a',
  waffleDark: '#a8702f',
  strawberry: '#f08fb0',
  pistachio: '#a8d98a',
  vanilla: '#fbecc4',
  chocolate: '#6b3b22',
  cherry: '#d3213a',
};

/** Regular octagon prism, one flat face towards +Z. R = vertex radius. Groups: 0 walls, 1 top, 2 bottom. */
export function octPrism(R, h, wallMat, topMat = wallMat) {
  const b = new ShapeBuilder();
  const pt = (k, y) => {
    const a = THREE.MathUtils.degToRad(k * 45 - 22.5);
    return [R * Math.sin(a), y, R * Math.cos(a)];
  };
  for (let k = 0; k < 8; k++) b.quad(pt(k, 0), pt(k + 1, 0), pt(k + 1, h), pt(k, h), 0);
  b.poly([...Array(8)].map((_, k) => pt(k, h)), 1);
  b.poly([...Array(8)].map((_, k) => pt(7 - k, 0)), 2);
  return new THREE.Mesh(b.build(), [wallMat, topMat, topMat]);
}

/** Apothem (centre-to-face distance) of an octagon with vertex radius R. */
export const apothem = (R) => R * Math.cos(Math.PI / 8);

/** Pastel candy stripes, 0.5 m each, running vertically on metre-UV walls. */
export function candyStripes(c1 = PASTEL.pink, c2 = PASTEL.cream) {
  return textured(canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c2;
    ctx.fillRect(W / 2, 0, W / 2, H);
  }, { key: `ice-cream-stand:stripes:${c1}:${c2}` }));
}

/** Waffle-cone crosshatch (2 diamonds per metre). */
export function waffleMat() {
  return textured(canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = PASTEL.waffle;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PASTEL.waffleDark;
    ctx.lineWidth = 7;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(i * W / 2, 0);
      ctx.lineTo(i * W / 2 + W, H);
      ctx.moveTo(i * W / 2 + W, 0);
      ctx.lineTo(i * W / 2, H);
      ctx.stroke();
    }
  }, { key: 'ice-cream-stand:waffle' }), { roughness: 0.9 });
}

/** Pastel checkerboard floor, 0.5 m squares (box UVs are in metres). */
export function checkerMat(c1 = PASTEL.cream, c2 = PASTEL.pink) {
  return textured(canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c2;
    ctx.fillRect(0, 0, W / 2, H / 2);
    ctx.fillRect(W / 2, H / 2, W / 2, H / 2);
  }, { key: `ice-cream-stand:checker:${c1}:${c2}`, nearest: true }));
}

/**
 * Sign with 0..1 UVs so the text fills the face at any size (the lib sign()
 * uses metre UVs and shrinks text on faces over 1 m). Text faces +Z, base at y=0.
 */
export function bigSign({ text, w, h, d = 0.12, bg, fg, border = null, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Serving hatch for a wall face: frame, dark interior with flavour tubs, counter shelf. Front at z=0, faces +Z. */
export function servingHatch({ w = 1.5, h = 1.15, sill = 1.05, frame = PASTEL.sky } = {}) {
  const g = group(
    place(box(w + 0.24, h + 0.24, 0.1, frame), { y: sill - 0.12, z: 0.03 }),
    place(box(w, h, 0.06, mat('#3a2a2a')), { y: sill, z: 0.08 }),
    // warm interior glow at the back of the hatch
    place(box(w - 0.3, 0.12, 0.04, emissive(PALETTE.windowLit, 0.6)), { y: sill + h - 0.25, z: 0.12 }),
    // counter shelf
    place(box(w + 0.4, 0.09, 0.55, mat(PALETTE.white)), { y: sill - 0.09, z: 0.3 }),
    place(box(0.06, 0.35, 0.3, mat(frame)), { x: -w / 2 + 0.05, y: sill - 0.45, z: 0.2 }),
    place(box(0.06, 0.35, 0.3, mat(frame)), { x: w / 2 - 0.05, y: sill - 0.45, z: 0.2 }),
  );
  // glass display with flavour tubs
  const flavours = [PASTEL.strawberry, PASTEL.pistachio, PASTEL.vanilla, PASTEL.chocolate, PASTEL.lavender];
  const n = flavours.length;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.24;
    g.add(place(box(0.2, 0.12, 0.2, mat(flavours[i])), { x, y: sill, z: 0.2 }));
  }
  g.add(place(box(n * 0.24 + 0.06, 0.3, 0.26, mat('#d8f1ff', { transparent: true, opacity: 0.35, roughness: 0.1 })), { y: sill, z: 0.2 }));
  return g;
}

/** Café table with a striped parasol and chairs. */
export function parasolTable({ color = PASTEL.pink, color2 = PALETTE.white, chairs = 3, seed = 0 } = {}) {
  const white = mat(PALETTE.white);
  const g = group(
    cylinder(0.04, 0.04, 2.35, metal(PALETTE.steelLight), 6),
    place(cylinder(0.45, 0.45, 0.05, white, 12), { y: 0.72 }),
    place(cylinder(0.08, 0.25, 0.72, metal(PALETTE.steelDark), 8), {}),
    // canopy + valance ring
    place(cone(1.35, 0.55, surface('stripes', color, { color2, size: 0.85 }), 12), { y: 2.2 }),
    place(cylinder(1.35, 1.35, 0.12, mat(color), 12), { y: 2.1 }),
    place(sphere(0.07, white, 6), { y: 2.72 }),
  );
  for (let i = 0; i < chairs; i++) {
    const a = (i / chairs) * 360 + seed * 37;
    const r = THREE.MathUtils.degToRad(a);
    const c = group(
      place(box(0.42, 0.06, 0.42, mat(PASTEL.mint)), { y: 0.42 }),
      place(box(0.42, 0.45, 0.05, mat(PASTEL.mint)), { y: 0.45, z: -0.19 }),
      ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => place(box(0.04, 0.42, 0.04, metal(PALETTE.steelLight)), { x: sx * 0.18, z: sz * 0.18 })),
    );
    // chair faces the table (local +Z toward the centre)
    g.add(place(c, { x: Math.sin(r) * 0.85, z: Math.cos(r) * 0.85, ry: a + 180 }));
  }
  return g;
}

/** Old-fashioned ice-cream push-cart with a little umbrella; length along X, faces +Z. */
export function pushCart() {
  const white = mat(PALETTE.white);
  const wheel = mat(PALETTE.darkGrey);
  return group(
    place(box(1.3, 0.75, 0.75, mat(PASTEL.sky)), { y: 0.35 }),
    place(box(1.34, 0.1, 0.79, white), { y: 1.1 }),
    place(box(1.32, 0.12, 0.77, mat(PASTEL.pink)), { y: 0.62 }),
    place(cylinder(0.3, 0.3, 0.08, wheel, 12), { x: -0.25, y: 0.3, z: 0.42, rx: 90 }),
    place(cylinder(0.3, 0.3, 0.08, wheel, 12), { x: -0.25, y: 0.3, z: -0.42, rx: 90 }),
    place(box(0.06, 0.35, 0.06, wheel), { x: 0.55 }),
    place(box(0.5, 0.05, 0.05, metal(PALETTE.steelLight)), { x: 0.85, y: 0.95, rz: -20 }),
    place(cylinder(0.03, 0.03, 1.5, metal(PALETTE.steelLight), 6), { y: 1.2 }),
    place(cone(0.75, 0.35, surface('stripes', PASTEL.mint, { color2: PALETTE.white, size: 0.6 }), 10), { y: 2.6 }),
    place(cone(0.16, 0.38, PASTEL.waffle, 8), { x: -0.4, y: 1.6, rx: 180 }),
    place(sphere(0.17, mat(PASTEL.strawberry), 8), { x: -0.4, y: 1.5 }),
  );
}

/** A-frame menu board, faces +Z. */
export function menuBoard() {
  const wood = mat(PALETTE.wood);
  const face = bigSign({ text: 'CONES 2$', w: 0.6, h: 0.75, d: 0.03, bg: '#2c3a33', fg: PASTEL.lemon });
  return group(
    place(face, { y: 0.15, z: 0.17, rx: -12 }),
    place(box(0.66, 0.95, 0.04, wood), { y: 0.03, z: -0.15, rx: 12 }),
    place(box(0.04, 0.95, 0.04, wood), { x: -0.32, y: 0.02, z: 0.2, rx: -12 }),
    place(box(0.04, 0.95, 0.04, wood), { x: 0.32, y: 0.02, z: 0.2, rx: -12 }),
  );
}

/** Small bin. */
export function bin(color = PASTEL.mintDeep) {
  return group(cylinder(0.25, 0.22, 0.8, mat(color), 10), place(cylinder(0.27, 0.27, 0.06, mat(PALETTE.white), 10), { y: 0.8 }));
}

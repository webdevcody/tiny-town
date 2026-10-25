// Local helpers for the Shinto shrine: curved slabs (roofs, torii lintels),
// torii gates, stone lanterns, guardian lion-dogs and small shrine props.
import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, box, cylinder, cone, sphere, place, mat, emissive, water, surface,
  canvasTexture, textured, gableRoof,
} from '../../src/lib/index.js';

export const VERMILION = '#d8431f';
export const VERMILION_DARK = '#a83018';
export const TORII_BLACK = '#2b2522';
export const STRAW = '#d8bf72';
export const PLASTER = '#f3ecdc';
export const STONE = '#b3ada2';
export const STONE_DARK = '#8c867b';
export const GOLD = '#d9b240';
export const BARK = '#5e3d2a';
export const BARK_EDGE = '#a07a52';

export const barkRoof = () => surface('shingles', BARK, { size: 1.5, color2: '#4a2f20', seed: 21 });

/**
 * Thick slab whose cross-section follows `profile` ([[z, y], ...] top surface,
 * ordered towards +z), extruded along X over `width`. Group 0 = top, 1 = edges/underside.
 */
export function slab(profile, width, thick, topM, edgeM) {
  const b = new ShapeBuilder();
  const hw = width / 2;
  for (let i = 0; i < profile.length - 1; i++) {
    const [u0, y0] = profile[i];
    const [u1, y1] = profile[i + 1];
    const b0 = y0 - thick, b1 = y1 - thick;
    b.quad([-hw, y0, u0], [-hw, y1, u1], [hw, y1, u1], [hw, y0, u0], 0);
    b.quad([-hw, b0, u0], [hw, b0, u0], [hw, b1, u1], [-hw, b1, u1], 1);
    b.quad([hw, y0, u0], [hw, y1, u1], [hw, b1, u1], [hw, b0, u0], 1);
    b.quad([-hw, y0, u0], [-hw, b0, u0], [-hw, b1, u1], [-hw, y1, u1], 1);
  }
  const [uf, yf] = profile[0];
  const [ul, yl] = profile[profile.length - 1];
  b.quad([-hw, yf, uf], [hw, yf, uf], [hw, yf - thick, uf], [-hw, yf - thick, uf], 1);
  b.quad([-hw, yl, ul], [-hw, yl - thick, ul], [hw, yl - thick, ul], [hw, yl, ul], 1);
  return new THREE.Mesh(b.build(), [toM(topM), toM(edgeM)]);
}

function toM(m) {
  return typeof m === 'string' ? mat(m) : m;
}

/**
 * Sagging roof slope from (z0,y0) to (z1,y1): blend of a straight slope (weight `a`)
 * and a parabola that flattens towards (z1,y1).
 */
export function sweep(z0, y0, z1, y1, n = 6, a = 0.6) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const f = a * t + (1 - a) * (1 - (1 - t) * (1 - t));
    pts.push([z0 + (z1 - z0) * t, y0 + (y1 - y0) * f]);
  }
  return pts;
}

/** Straight beam with ends that sweep upward, length along X (torii kasagi). */
function sweptBeam(len, thick, depth, lift, material) {
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const u = -len / 2 + (len * i) / n;
    const k = Math.abs(u) / (len / 2);
    pts.push([u, thick + lift * Math.pow(k, 3)]);
  }
  const m = slab(pts, depth, thick, material, material);
  m.rotation.y = Math.PI / 2;
  return m;
}

const plaqueTex = () =>
  canvasTexture(64, 96, (ctx, w, h) => {
    ctx.fillStyle = '#1d1a18';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, w - 10, h - 10);
    // stylised characters: a few gold strokes
    ctx.fillStyle = GOLD;
    for (const y of [22, 50]) {
      ctx.fillRect(18, y, 28, 4);
      ctx.fillRect(30, y - 8, 4, 22);
      ctx.fillRect(20, y + 10, 24, 3);
    }
  }, { key: 'shinto-shrine:plaque', repeat: false });

/** Myōjin torii gate, centred on the origin, spanning X. */
export function torii({ span = 2.4, h = 3.4, post = 0.14, plaque = true } = {}) {
  const g = new THREE.Group();
  const red = mat(VERMILION);
  const black = mat(TORII_BLACK);
  for (const s of [-1, 1]) {
    g.add(place(cylinder(post * 0.88, post, h, red, 10), { x: (s * span) / 2 }));
    g.add(place(cylinder(post * 1.35, post * 1.35, 0.32, black, 10), { x: (s * span) / 2 }));
  }
  // nuki (tie beam, pokes through the posts)
  g.add(place(box(span + 0.7, post * 1.2, post * 1.0, red), { y: h * 0.72 }));
  // shimaki + kasagi (top lintels)
  g.add(place(box(span + 1.0, post * 1.3, post * 1.8, red), { y: h }));
  const kas = sweptBeam(span + 1.5, post * 1.5, post * 2.2, post * 2.0, black);
  kas.position.y = h + post * 1.3;
  g.add(kas);
  // gakuzuka (central strut) + plaque
  const nukiTop = h * 0.72 + post * 1.2;
  g.add(place(box(post * 0.9, h - nukiTop, post * 0.8, red), { y: nukiTop }));
  if (plaque) {
    const ph = Math.min(0.6, (h - nukiTop) * 0.85);
    const pg = new THREE.BoxGeometry(ph * 0.65, ph, 0.07).translate(0, ph / 2, 0);
    g.add(place(new THREE.Mesh(pg, textured(plaqueTex())), { y: nukiTop + (h - nukiTop - ph) / 2, z: post * 0.45 }));
  }
  return g;
}

/** Kasuga-style stone lantern (tōrō) with a lit firebox. */
export function lantern({ h = 1.5 } = {}) {
  const s = h / 1.5;
  const g = new THREE.Group();
  const st = mat(STONE);
  const sd = mat(STONE_DARK);
  g.add(cylinder(0.3 * s, 0.34 * s, 0.14 * s, sd, 6));
  g.add(place(cylinder(0.2 * s, 0.26 * s, 0.1 * s, st, 6), { y: 0.14 * s }));
  g.add(place(cylinder(0.09 * s, 0.1 * s, 0.5 * s, st, 8), { y: 0.24 * s }));
  g.add(place(cylinder(0.28 * s, 0.18 * s, 0.12 * s, st, 6), { y: 0.74 * s }));
  g.add(place(box(0.3 * s, 0.24 * s, 0.3 * s, emissive('#ffc860', 0.7)), { y: 0.86 * s }));
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
    g.add(place(box(0.07 * s, 0.24 * s, 0.07 * s, st), { x: x * 0.15 * s, y: 0.86 * s, z: z * 0.15 * s }));
  g.add(place(cone(0.42 * s, 0.26 * s, sd, 6), { y: 1.1 * s }));
  g.add(place(sphere(0.07 * s, st, 8), { y: 1.33 * s }));
  return g;
}

/** Komainu guardian lion-dog on a pedestal, facing +Z. */
export function komainu() {
  const g = new THREE.Group();
  const st = mat(STONE);
  const sd = mat(STONE_DARK);
  g.add(box(0.62, 0.55, 0.62, sd));
  g.add(place(box(0.52, 0.08, 0.52, st), { y: 0.55 }));
  const y = 0.63;
  g.add(place(box(0.32, 0.28, 0.46, st), { y, z: -0.03 }));
  g.add(place(box(0.34, 0.38, 0.26, st), { y: y + 0.12, z: 0.06 })); // chest/mane
  g.add(place(box(0.3, 0.26, 0.26, st), { y: y + 0.42, z: 0.12 })); // head
  g.add(place(box(0.2, 0.1, 0.1, sd), { y: y + 0.44, z: 0.27 })); // snout
  g.add(place(box(0.08, 0.2, 0.12, sd), { y: y + 0.2, z: -0.26 })); // tail
  for (const x of [-0.11, 0.11]) g.add(place(box(0.08, 0.12, 0.08, sd), { x, y, z: 0.17 }));
  return g;
}

/** Chōzuya: open purification pavilion with a stone basin. Ridge along X. */
export function chozuya() {
  const g = new THREE.Group();
  const red = mat(VERMILION);
  const w = 1.5, d = 1.1, h = 1.9;
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]])
    g.add(place(box(0.12, h, 0.12, red), { x: (x * w) / 2, z: (z * d) / 2 }));
  g.add(place(box(w + 0.2, 0.14, d + 0.2, mat(VERMILION_DARK)), { y: h - 0.14 }));
  g.add(place(gableRoof({ w, d, h: 0.6, overhang: 0.32, ridge: 'x', material: barkRoof(), gableMaterial: PLASTER }), { y: h }));
  g.add(place(box(w + 0.6, 0.12, 0.16, mat(BARK)), { y: h + 0.58 }));
  // stone basin with water
  g.add(place(box(1.0, 0.55, 0.55, mat(STONE)), {}));
  g.add(place(box(0.86, 0.02, 0.41, water()), { y: 0.55 }));
  // bamboo spout + ladles
  g.add(place(cylinder(0.04, 0.04, 0.5, mat('#7a9a3a'), 6), { x: -0.55, y: 0.5, z: -0.1, rz: -60 }));
  for (const x of [-0.15, 0.05, 0.25]) g.add(place(cylinder(0.015, 0.015, 0.45, mat(PALETTE.woodLight), 4), { x, y: 0.57, z: 0.12, rz: 90 }));
  return g;
}

/** Ema rack: wooden frame with rows of hanging votive plaques, facing +Z. */
export function emaRack() {
  const g = new THREE.Group();
  const wood = mat(PALETTE.woodDark);
  const plank = mat(PALETTE.woodLight);
  const w = 1.6, h = 1.6;
  for (const x of [-w / 2, w / 2]) g.add(place(box(0.1, h, 0.1, wood), { x }));
  g.add(place(gableRoof({ w: w + 0.1, d: 0.4, h: 0.22, overhang: 0.12, ridge: 'x', material: barkRoof(), gableMaterial: PALETTE.woodDark }), { y: h }));
  for (const y of [0.75, 1.15]) {
    g.add(place(box(w, 0.05, 0.06, wood), { y: y + 0.25 }));
    for (let i = 0; i < 7; i++) {
      const x = -w / 2 + 0.17 + i * 0.211;
      g.add(place(box(0.16, 0.12, 0.03, plank), { x, y: y + 0.08, z: 0.04, rz: (i % 3) * 4 - 4 }));
    }
  }
  return g;
}

/** Saisen-bako offering box with slatted top. */
export function offeringBox() {
  const g = new THREE.Group();
  g.add(box(1.1, 0.55, 0.55, mat(PALETTE.wood)));
  for (let i = 0; i < 5; i++) g.add(place(box(1.0, 0.04, 0.05, mat(PALETTE.woodDark)), { y: 0.55, z: -0.2 + i * 0.1 }));
  g.add(place(box(0.5, 0.12, 0.02, mat(GOLD)), { y: 0.25, z: 0.28 }));
  return g;
}

/** Zig-zag paper streamer (shide), hanging down from the origin. */
export function shide(material) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) g.add(place(box(0.1, 0.12, 0.015, material), { x: i % 2 ? 0.05 : 0, y: -0.12 * (i + 1) }));
  return g;
}

/** Sacred tree (shinboku) with a thick trunk and a shimenawa rope. */
export function sacredTree({ h = 6.8 } = {}) {
  const g = new THREE.Group();
  const trunk = mat(PALETTE.trunk);
  const leafA = mat(PALETTE.foliageDark);
  const leafB = mat('#356f2a');
  const leafC = mat(PALETTE.foliage);
  g.add(cylinder(0.32, 0.5, h * 0.55, trunk, 9));
  // flared roots
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    g.add(place(box(0.18, 0.3, 0.7, trunk), { x: Math.cos(a) * 0.4, z: Math.sin(a) * 0.4, ry: (-a * 180) / Math.PI + 90 }));
  }
  // branches
  for (const [rx, rz, ry] of [[0, 35, 0], [0, -40, 30], [35, 0, 0], [-30, 10, 0]])
    g.add(place(cylinder(0.08, 0.16, 1.8, trunk, 6), { y: h * 0.42, rx, rz, ry }));
  const blobs = [
    [0, h * 0.8, 0, 1.6, leafA], [-0.8, h * 0.66, 0.3, 1.1, leafB], [0.8, h * 0.68, -0.3, 1.15, leafC],
    [0.3, h * 0.64, 0.8, 1.05, leafB], [-0.3, h * 0.7, -0.8, 1.1, leafC], [0.3, h * 0.96, 0.2, 1.0, leafB],
  ];
  for (const [x, y, z, r, m] of blobs) {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), m);
    s.position.set(x, y, z);
    s.scale.set(1, 0.78, 1);
    g.add(s);
  }
  // shimenawa round the trunk
  const rope = new THREE.Mesh(new THREE.TorusGeometry(0.47, 0.09, 6, 14), mat(STRAW));
  rope.rotation.x = Math.PI / 2;
  rope.position.y = 1.5;
  g.add(rope);
  const paper = mat(PALETTE.white);
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2 + 0.3;
    g.add(place(shide(paper), { x: Math.cos(a) * 0.55, y: 1.48, z: Math.sin(a) * 0.55, ry: (-a * 180) / Math.PI + 90 }));
  }
  return g;
}

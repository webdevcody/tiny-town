import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  PALETTE, canvasTexture, signTexture, textured, mat, emissive, metal, shade, rng,
  group, place, box, cylinder, cone, sphere,
} from '../../src/lib/index.js';

// ---------------------------------------------------------------- textures

/** Sandstone ashlar, one texture repeat = 1 m (box/extrude UVs are in metres). */
export function ashlar(color = '#d9b57f') {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(17);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    const rows = 3;
    const rh = H / rows;
    for (let row = 0; row < rows; row++) {
      const off = row % 2 ? W / 4 : 0;
      for (let k = -1; k < 3; k++) {
        const x = off + k * (W / 2);
        ctx.fillStyle = shade(color, r.range(-0.05, 0.05));
        ctx.fillRect(x + 1, row * rh + 1, W / 2 - 2, rh - 2);
      }
      ctx.fillStyle = shade(color, -0.14);
      ctx.fillRect(0, row * rh, W, 1.5);
      for (let k = -1; k < 3; k++) ctx.fillRect(off + k * (W / 2), row * rh, 1.5, rh);
    }
  }, { key: 'souk-bazaar:ashlar:' + color });
  return textured(tex);
}

/** Hand-knotted rug: field, borders, medallion, fringes. */
export function rugMaterial(i = 0) {
  const schemes = [
    ['#a3232b', '#1f3570', '#e3b04b', '#f1e2c0'],
    ['#1f3570', '#a3232b', '#e3b04b', '#f1e2c0'],
    ['#2c6b5a', '#7a1f2b', '#f0c45a', '#efe1bf'],
    ['#b8641f', '#3b2416', '#f2d08a', '#f4e6c6'],
    ['#6b2350', '#d9a441', '#2a4a7a', '#f1e2c0'],
  ];
  const [field, border, accent, fringe] = schemes[i % schemes.length];
  const tex = canvasTexture(96, 144, (ctx, W, H) => {
    ctx.fillStyle = fringe;
    ctx.fillRect(0, 0, W, H);
    const f = 8; // fringe
    ctx.fillStyle = border;
    ctx.fillRect(0, f, W, H - 2 * f);
    ctx.fillStyle = accent;
    ctx.fillRect(9, f + 9, W - 18, H - 2 * f - 18);
    ctx.fillStyle = field;
    ctx.fillRect(13, f + 13, W - 26, H - 2 * f - 26);
    // border dots
    ctx.fillStyle = accent;
    for (let y = f + 4; y < H - f - 4; y += 9) { ctx.fillRect(3, y, 3, 3); ctx.fillRect(W - 6, y, 3, 3); }
    // medallion
    const cx = W / 2, cy = H / 2;
    const dia = (rx, ry, c) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.moveTo(cx, cy - ry); ctx.lineTo(cx + rx, cy); ctx.lineTo(cx, cy + ry); ctx.lineTo(cx - rx, cy);
      ctx.closePath();
      ctx.fill();
    };
    dia(30, 46, accent);
    dia(23, 36, border);
    dia(12, 20, accent);
    dia(5, 9, field);
    // corner pieces
    ctx.fillStyle = border;
    for (const [x, y] of [[13, f + 13], [W - 25, f + 13], [13, H - f - 25], [W - 25, H - f - 25]]) ctx.fillRect(x, y, 12, 12);
    // fringe threads
    ctx.fillStyle = shade(fringe, -0.2);
    for (let x = 2; x < W; x += 5) { ctx.fillRect(x, 0, 1.5, f); ctx.fillRect(x, H - f, 1.5, f); }
  }, { key: 'souk-bazaar:rug:' + i, repeat: false });
  return textured(tex);
}

/** Wooden mashrabiya lattice, one repeat = 1 m. */
export function latticeMaterial() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8a5a32';
    for (let k = 0; k < W; k += 8) { ctx.fillRect(k, 0, 3, H); ctx.fillRect(0, k, W, 3); }
  }, { key: 'souk-bazaar:lattice' });
  return textured(tex);
}

/** Zellige-style tile band, one repeat = 1 m. */
export function tileMaterial() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#1f8a8a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f2e6c4';
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x + 8, y + 2); ctx.lineTo(x + 14, y + 8); ctx.lineTo(x + 8, y + 14); ctx.lineTo(x + 2, y + 8);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#163f75';
    for (let y = 0; y < H; y += 16) for (let x = (y / 16) % 2 ? 8 : 0; x < W; x += 16) ctx.fillRect(x + 6, y + 6, 4, 4);
  }, { key: 'souk-bazaar:tiles' });
  return textured(tex);
}

/** Sign panel with 0..1 UVs on the front, so the text fills the face (lib sign() shrinks on wide faces). */
export function plaque({ text, w, h, d = 0.12, bg, fg, border }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round(512 * h / w), border, font: 'bold' });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Thin panel with 0..1 UVs on both big faces (rugs, cloth). Base at y=0, faces +z/-z. */
export function panel(w, h, material, d = 0.04) {
  const side = material;
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, material, material]);
}

// ---------------------------------------------------------------- arches

/** Points of a two-centred pointed arch from left springing, over the apex, to right springing. */
export function pointedArch(cx, hw, spring, k = 1.35, n = 7) {
  const R = hw * k;
  const tA = Math.acos((hw - R) / R);
  const pts = [];
  const cl = cx - hw + R;
  for (let i = 0; i <= n; i++) {
    const t = Math.PI + (tA - Math.PI) * (i / n);
    pts.push([cl + R * Math.cos(t), spring + R * Math.sin(t)]);
  }
  const cr = cx + hw - R;
  for (let i = n - 1; i >= 0; i--) {
    const t = Math.PI + (tA - Math.PI) * (i / n);
    pts.push([cr - R * Math.cos(t), spring + R * Math.sin(t)]);
  }
  return pts;
}

export function archApex(hw, spring, k = 1.35) {
  const R = hw * k;
  return spring + R * Math.sin(Math.acos((hw - R) / R));
}

function extrudeShape(pts, depth, material) {
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, material);
}

/**
 * Wall of length `len` (along X, centred) and height `h` with pointed arches cut up from the floor.
 * arches: [{ cx, hw, spring }]. Thickness t along Z, centred.
 */
export function arcadeWall({ len, h, t, arches, material, k = 1.35 }) {
  const pts = [[-len / 2, 0]];
  for (const a of [...arches].sort((p, q) => p.cx - q.cx)) {
    pts.push([a.cx - a.hw, 0], ...pointedArch(a.cx, a.hw, a.spring, k), [a.cx + a.hw, 0]);
  }
  pts.push([len / 2, 0], [len / 2, h], [-len / 2, h]);
  return extrudeShape(pts, t, material);
}

/** U-shaped arch frame (tile surround) of width `fw`, thickness d. */
export function archFrame({ cx = 0, hw, spring, fw, d = 0.06, material, k = 1.35 }) {
  const outer = pointedArch(cx, hw + fw, spring, k);
  const inner = pointedArch(cx, hw, spring, k).reverse();
  return extrudeShape([[cx - hw - fw, 0], ...outer, [cx + hw + fw, 0], [cx + hw, 0], ...inner, [cx - hw, 0]], d, material);
}

/** Solid pointed-arch slab (doors, windows), base at y=0, thickness d. */
export function archPanel({ hw, spring, d = 0.08, material, k = 1.35 }) {
  return extrudeShape([[-hw, 0], ...pointedArch(0, hw, spring, k), [hw, 0]], d, material);
}

/** Stepped (Arabian) merlons along X, centred, merged into one mesh. */
export function merlons({ len, size = 0.36, gap = 0.22, t = 0.28, material }) {
  const step = size + gap;
  const n = Math.max(1, Math.floor((len + gap) / step));
  const start = -((n - 1) * step) / 2;
  const geos = [];
  for (let i = 0; i < n; i++) {
    const x = start + i * step;
    geos.push(new THREE.BoxGeometry(size, size * 0.6, t).translate(x, size * 0.3, 0));
    geos.push(new THREE.BoxGeometry(size * 0.5, size * 0.45, t).translate(x, size * 0.6 + size * 0.225, 0));
  }
  return new THREE.Mesh(mergeGeometries(geos), material);
}

// ---------------------------------------------------------------- props

const BRASS = () => metal('#c9a13b', { roughness: 0.35 });

/** Hanging brass lantern, origin at its hook (top); hangs downwards by `chain`. */
export function lantern({ chain = 0.4, s = 1, color = '#ffb347' } = {}) {
  const b = BRASS();
  const glow = emissive(color, 1.3);
  const g = group(
    place(cylinder(0.015, 0.015, chain, b, 4), { y: -chain }),
    place(cone(0.13, 0.16, b, 6), { y: -chain - 0.16 }),
    place(cylinder(0.14, 0.11, 0.28, glow, 6), { y: -chain - 0.44 }),
    place(cone(0.11, 0.12, b, 6), { y: -chain - 0.44, rx: 180 }),
  );
  g.scale.setScalar(s);
  return g;
}

/** Lantern on a post with a curly bracket. */
export function lanternPost({ h = 2.8 } = {}) {
  const iron = mat('#2b2420');
  return group(
    box(0.32, 0.25, 0.32, mat('#b89463')),
    cylinder(0.06, 0.08, h, iron, 6),
    place(box(0.7, 0.06, 0.06, iron), { x: 0.3, y: h - 0.1 }),
    place(lantern({ chain: 0.12, s: 1.4 }), { x: 0.58, y: h - 0.1 }),
  );
}

const SPICES = ['#c0392b', '#e6b422', '#d2691e', '#6b8e23', '#8b4513', '#e8762b', '#a0522d', '#f2d16b'];

/** Open burlap sack heaped with spice. */
export function spiceSack(i = 0, s = 1) {
  const burlap = mat('#b9955e');
  const g = group(
    cylinder(0.27, 0.3, 0.42, burlap, 8),
    place(cylinder(0.31, 0.27, 0.08, mat('#a8844f'), 8), { y: 0.38 }),
    place(cone(0.27, 0.2, mat(SPICES[i % SPICES.length]), 8), { y: 0.4 }),
  );
  g.scale.setScalar(s);
  return g;
}

/** Shallow basket with a spice mound. */
export function spiceBasket(i = 0) {
  return group(
    cylinder(0.3, 0.24, 0.14, mat('#8a6a3c'), 10),
    place(cone(0.28, 0.24, mat(SPICES[i % SPICES.length]), 10), { y: 0.12 }),
  );
}

/** Rolled rug lying along X. */
export function rolledRug(i = 0, len = 1.6) {
  const cols = ['#a3232b', '#1f3570', '#2c6b5a', '#b8641f', '#6b2350'];
  const c = place(cylinder(0.16, 0.16, len, mat(cols[i % cols.length]), 8), { y: -len / 2 });
  return group(place(group(c), { rz: 90, y: 0.16 }));
}

/** Clay amphora / water jar. */
export function jar(s = 1, color = '#b5603a') {
  const pts = [[0, 0], [0.16, 0.02], [0.3, 0.25], [0.32, 0.45], [0.24, 0.68], [0.12, 0.78], [0.13, 0.9], [0, 0.9]];
  const geo = new THREE.LatheGeometry(pts.map(([x, y]) => new THREE.Vector2(x, y)), 10);
  const m = new THREE.Mesh(geo, mat(color));
  m.scale.setScalar(s);
  return m;
}

/** Wooden crate. */
export function crate(s = 0.6) {
  return group(box(s, s, s, mat('#9a6a3a')), place(box(s * 1.02, s * 0.12, s * 1.02, mat('#6e4724')), { y: s * 0.44 }));
}

/** Simple low-poly dromedary, facing +x, with a saddle blanket. */
export function camel() {
  const fur = mat('#c79a5c');
  const dark = mat('#9c7340');
  const g = group();
  g.add(place(box(1.5, 0.6, 0.55, fur), { y: 1.15 }));
  const hump = sphere(0.42, fur, 8);
  hump.scale.set(1.1, 0.75, 0.75);
  g.add(place(hump, { y: 1.55 }));
  g.add(place(box(0.7, 0.08, 0.66, mat('#a3232b')), { y: 1.98 }));
  g.add(place(box(0.5, 0.42, 0.68, mat('#1f3570')), { y: 1.32, x: 0 }));
  g.add(place(box(0.24, 0.85, 0.24, fur), { x: 0.85, y: 1.2, rz: -35 }));
  g.add(place(box(0.5, 0.24, 0.24, fur), { x: 1.3, y: 1.86 }));
  g.add(place(box(0.14, 0.1, 0.25, dark), { x: 1.55, y: 1.83 }));
  for (const [x, z] of [[0.55, 0.18], [0.55, -0.18], [-0.55, 0.18], [-0.55, -0.18]]) {
    g.add(place(box(0.13, 1.18, 0.13, fur), { x, y: 0.0, z }));
    g.add(place(box(0.18, 0.06, 0.2, dark), { x, y: 0.0, z }));
  }
  g.add(place(box(0.06, 0.45, 0.06, dark), { x: -0.78, y: 0.85, rz: 15 }));
  return g;
}

/** Date palm with a slightly leaning trunk and drooping fronds of length `fl`. */
export function datePalm({ h = 6, fl = 1.7, seed = 1, lean = 6 } = {}) {
  const r = rng(seed);
  const trunk = mat('#8a6a42');
  const leaf = mat(r.pick(['#4f8a2e', '#5c9a34', '#457d2a']));
  const g = group();
  const t = group(cylinder(0.14, 0.22, h, trunk, 7));
  for (let y = 0.6; y < h - 0.2; y += 0.55) t.add(place(cylinder(0.2, 0.2, 0.08, mat('#6f5434'), 7), { y }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * 360 + r.range(-12, 12);
    const fr = new THREE.Mesh(new THREE.BoxGeometry(fl, 0.06, 0.4).translate(fl / 2, 0, 0), leaf);
    t.add(place(group(place(fr, { rz: -r.range(18, 38) })), { y: h, ry: a }));
  }
  t.add(place(sphere(0.25, mat('#b5772e'), 6), { y: h - 0.45 }));
  g.add(place(t, { rz: lean }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, box, cylinder, cone, sphere, place, group, beam, mat, metal, emissive,
  canvasTexture, textured, shade,
} from '../../src/lib/index.js';

export const RED = PALETTE.red;
export const RED_DARK = shade(PALETTE.red, -0.3);
export const GOLD = '#d99a1e';
export const GOLD_TRIM = '#f0c440';
export const BRONZE = '#6e5634';

/** Box with 0..1 UVs on every face (for canvas textures), base at y = 0. */
export function panel(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

/** Dark-red lattice window / door texture with a gold frame. */
export function latticeMat(kind = 'window') {
  const tex = canvasTexture(64, 96, (ctx, W, H) => {
    ctx.fillStyle = kind === 'door' ? '#5a1712' : '#3a1a12';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#b5332a';
    ctx.lineWidth = 3;
    const step = kind === 'door' ? 10 : 12;
    for (let x = step; x < W; x += step) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = step; y < H; y += step) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    if (kind === 'door') {
      ctx.fillStyle = '#5a1712';
      ctx.fillRect(W / 2 - 2, 0, 4, H);
      ctx.fillRect(0, H * 0.62, W, H * 0.38);
      ctx.fillStyle = GOLD_TRIM;
      for (const x of [W / 2 - 7, W / 2 + 7]) { ctx.beginPath(); ctx.arc(x, H * 0.55, 2.5, 0, Math.PI * 2); ctx.fill(); }
    }
    ctx.strokeStyle = GOLD_TRIM;
    ctx.lineWidth = 5;
    ctx.strokeRect(2.5, 2.5, W - 5, H - 5);
  }, { key: 'pagoda-temple:lattice-' + kind, repeat: false });
  return textured(tex);
}

/** Navy temple plaque with a gold border and a gold dharma wheel. */
export function plaqueMat() {
  const tex = canvasTexture(128, 64, (ctx, W, H) => {
    ctx.fillStyle = '#1d2c55';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD_TRIM;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    const cx = W / 2, cy = H / 2, r = H * 0.3;
    ctx.lineWidth = 3;
    ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, r * 0.25, 0, Math.PI * 2); ctx.stroke();
    for (let i = 0; i < 8; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * r * 0.25, cy + Math.sin(a) * r * 0.25);
      ctx.lineTo(cx + Math.cos(a) * r * 1.25, cy + Math.sin(a) * r * 1.25);
      ctx.stroke();
    }
    ctx.fillStyle = GOLD_TRIM;
    for (const x of [W * 0.16, W * 0.84]) { ctx.beginPath(); ctx.arc(x, cy, 4, 0, Math.PI * 2); ctx.fill(); }
  }, { key: 'pagoda-temple:plaque', repeat: false });
  return textured(tex);
}

/**
 * Chinese-style roof with concave slopes and upturned, flared corners.
 * Base (y = 0) is the top of the walls; w, d = wall footprint.
 * The roof rises from an eave ring (w/2 + overhang) to an inner ring
 * (innerW, innerD) at height h. innerD ~ 0 gives a ridge along X.
 */
export function eaveRoof({
  w, d, h, overhang = 0.8, innerW = 0.2, innerD = 0.2, lift = 0.4, flare = 0.25,
  rows = 5, segs = 8, trimH = 0.16, tiles, trim, soffit, cap = true, hips = true,
}) {
  const b = new ShapeBuilder();
  const oX = w / 2 + overhang, oZ = d / 2 + overhang;
  const iX = innerW / 2, iZ = innerD / 2;
  // side frames: s runs left -> right seen from outside
  const sides = [
    (s, ax, az) => [s * ax, az],                  // front +Z
    (s, ax, az) => [ax, -s * az],                 // right +X
    (s, ax, az) => [-s * ax, -az],                // back -Z
    (s, ax, az) => [-ax, s * az],                 // left -X
  ];
  const pt = (side, s, t, drop = 0) => {
    const ax = oX + (iX - oX) * t, az = oZ + (iZ - oZ) * t;
    let [x, z] = sides[side](s, ax, az);
    const k = Math.pow(Math.abs(s), 3) * Math.pow(1 - t, 1.5);
    x += Math.sign(x) * flare * k;
    z += Math.sign(z) * flare * k;
    const y = h * Math.pow(t, 1.7) + lift * k - drop;
    return [x, y, z];
  };
  for (let side = 0; side < 4; side++) {
    for (let j = 0; j < segs; j++) {
      const s0 = -1 + (2 * j) / segs, s1 = -1 + (2 * (j + 1)) / segs;
      for (let k = 0; k < rows; k++) {
        const t0 = k / rows, t1 = (k + 1) / rows;
        b.quad(pt(side, s0, t0), pt(side, s1, t0), pt(side, s1, t1), pt(side, s0, t1), 0);
      }
      // fascia
      b.quad(pt(side, s0, 0, trimH), pt(side, s1, 0, trimH), pt(side, s1, 0), pt(side, s0, 0), 1);
      // soffit back to the wall line
      const wall = (s) => { const [x, , z] = sides[side](s, w / 2, d / 2); return [x, 0, z]; };
      b.quad(pt(side, s1, 0, trimH), pt(side, s0, 0, trimH), wall(s0), wall(s1), 2);
    }
  }
  if (cap) b.poly([[-iX, h, iZ], [iX, h, iZ], [iX, h, -iZ], [-iX, h, -iZ]], 0);
  const geo = b.build();
  const tileM = tiles ?? mat(GOLD);
  const trimM = trim ?? mat(GOLD_TRIM, { roughness: 0.5, metalness: 0.3 });
  const soffitM = soffit ?? mat(RED_DARK, { side: THREE.DoubleSide });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, [tileM, trimM, soffitM]));
  if (hips) {
    // gold hip ridges running down each corner
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, -1], [-1, 1]]) {
      const side = sz > 0 ? 0 : 2;
      const s = side === 0 ? sx : -sx;
      for (let k = 0; k < rows; k++) {
        const a = pt(side, s, k / rows), c = pt(side, s, (k + 1) / rows);
        a[1] += 0.05; c[1] += 0.05;
        g.add(beam(a, c, 0.12, trimM));
      }
      // little upturned tip ornament
      const tip = pt(side, s, 0);
      g.add(place(cone(0.09, 0.35, trimM, 5), { x: tip[0], y: tip[1] - 0.02, z: tip[2] }));
    }
  }
  return g;
}

/** Seated stone guardian lion on a pedestal, facing +Z. mirror flips the raised paw. */
export function stoneLion({ mirror = false } = {}) {
  const stone = mat(PALETTE.stone);
  const stoneD = mat(PALETTE.stoneDark);
  const mane = mat(shade(PALETTE.stone, -0.12));
  const g = new THREE.Group();
  g.add(box(0.85, 0.5, 1.0, stoneD));
  g.add(place(box(0.95, 0.1, 1.1, stone), { y: 0.5 }));
  const y = 0.6;
  g.add(place(box(0.6, 0.42, 0.5, stone), { y, z: -0.2 }));               // haunches
  g.add(place(box(0.5, 0.65, 0.42, stone), { y: y + 0.1, z: 0.05, rx: -12 })); // chest
  g.add(place(box(0.13, 0.55, 0.14, stone), { x: -0.16, y, z: 0.3 }));    // front legs
  g.add(place(box(0.13, 0.55, 0.14, stone), { x: 0.16, y, z: 0.3 }));
  g.add(place(box(0.6, 0.55, 0.32, mane), { y: y + 0.6, z: 0.0 }));       // mane
  g.add(place(box(0.42, 0.38, 0.32, stone), { y: y + 0.66, z: 0.2 }));    // head
  g.add(place(box(0.24, 0.16, 0.12, stoneD), { y: y + 0.68, z: 0.4 }));   // snout
  g.add(place(box(0.1, 0.08, 0.04, mat(PALETTE.black)), { x: -0.1, y: y + 0.88, z: 0.36 }));
  g.add(place(box(0.1, 0.08, 0.04, mat(PALETTE.black)), { x: 0.1, y: y + 0.88, z: 0.36 }));
  g.add(place(sphere(0.13, mane, 6), { x: -0.16, y: y + 1.0, z: 0.12 })); // curls
  g.add(place(sphere(0.13, mane, 6), { x: 0.16, y: y + 1.0, z: 0.12 }));
  // ball under the paw
  g.add(place(sphere(0.15, stoneD, 8), { x: mirror ? -0.18 : 0.18, y, z: 0.42 }));
  g.add(place(box(0.08, 0.2, 0.2, stone), { x: 0, y: y + 0.05, z: -0.48, rx: 30 }));  // tail
  return g;
}

/** Bronze incense burner (xianglu) on three legs with a small roofed lid and smoke. */
export function incenseBurner() {
  const bronze = metal(BRONZE, { roughness: 0.55 });
  const bronzeD = metal(shade(BRONZE, -0.3), { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(box(1.4, 0.25, 1.4, mat(PALETTE.stoneDark)));
  g.add(place(box(1.2, 0.08, 1.2, mat(PALETTE.stone)), { y: 0.25 }));
  const y = 0.33;
  for (let i = 0; i < 3; i++) {
    const a = (i * Math.PI * 2) / 3 + Math.PI / 2;
    g.add(place(cylinder(0.07, 0.1, 0.4, bronzeD, 6), { x: Math.cos(a) * 0.38, y, z: Math.sin(a) * 0.38 }));
  }
  g.add(place(cylinder(0.55, 0.42, 0.5, bronze, 12), { y: y + 0.32 }));
  g.add(place(cylinder(0.6, 0.6, 0.08, bronzeD, 12), { y: y + 0.82 }));
  // ear handles
  for (const x of [-0.58, 0.58]) g.add(place(box(0.08, 0.3, 0.22, bronzeD), { x, y: y + 0.85 }));
  // glowing ash + incense sticks
  g.add(place(cylinder(0.5, 0.5, 0.03, emissive('#ff8a3a', 0.6), 12), { y: y + 0.88 }));
  for (const [x, z] of [[-0.15, 0.05], [0.05, -0.12], [0.18, 0.1], [-0.02, 0.2]]) {
    g.add(place(box(0.03, 0.45, 0.03, mat('#8a2a1a')), { x, y: y + 0.9, z }));
  }
  // lid on posts with a mini upturned roof
  for (const [x, z] of [[-0.32, -0.32], [0.32, -0.32], [0.32, 0.32], [-0.32, 0.32]]) {
    g.add(place(cylinder(0.035, 0.035, 0.55, bronzeD, 5), { x, y: y + 0.9, z }));
  }
  g.add(place(eaveRoof({ w: 0.7, d: 0.7, h: 0.35, overhang: 0.18, lift: 0.1, flare: 0.05, rows: 3, segs: 4, trimH: 0.05, innerW: 0.1, innerD: 0.1, hips: false, tiles: bronze, trim: bronzeD, soffit: bronzeD }), { y: y + 1.45 }));
  g.add(place(sphere(0.08, mat(GOLD_TRIM, { metalness: 0.4, roughness: 0.4 }), 6), { y: y + 1.78 }));
  // drifting smoke
  const smoke = mat('#e8e6e0', { transparent: true, opacity: 0.45 });
  g.add(place(sphere(0.22, smoke, 6), { x: 0.05, y: y + 1.9, z: 0.05 }));
  g.add(place(sphere(0.3, smoke, 6), { x: 0.2, y: y + 2.3, z: -0.05 }));
  g.add(place(sphere(0.36, smoke, 6), { x: 0.45, y: y + 2.8, z: -0.1 }));
  return g;
}

/** Stone lantern (toro / shideng) with a warm glowing firebox. */
export function stoneLantern() {
  const stone = mat(PALETTE.stone);
  const stoneD = mat(PALETTE.stoneDark);
  return group(
    box(0.55, 0.15, 0.55, stoneD),
    place(cylinder(0.12, 0.14, 0.75, stone, 6), { y: 0.15 }),
    place(box(0.5, 0.1, 0.5, stoneD), { y: 0.9 }),
    place(box(0.36, 0.34, 0.36, emissive(PALETTE.windowLit, 0.7)), { y: 1.0 }),
    place(cone(0.42, 0.3, stoneD, 4), { y: 1.34, ry: 45 }),
    place(sphere(0.08, stone, 6), { y: 1.6 }),
  );
}

/** Hanging red paper lantern with gold caps. */
export function redLantern() {
  const gold = mat(GOLD_TRIM);
  return group(
    place(box(0.02, 0.25, 0.02, mat(PALETTE.black)), { y: 0.35 }),
    place(cylinder(0.1, 0.1, 0.05, gold, 8), { y: 0.3 }),
    place(sphere(0.18, emissive('#e8382a', 0.35), 10), { y: -0.03, s: [1, 0.95, 1] }),
    place(cylinder(0.1, 0.1, 0.05, gold, 8), { y: -0.08 }),
  );
}

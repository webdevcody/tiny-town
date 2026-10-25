import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, canvasTexture, signTexture, textured, mat, shade, rng,
  box, place, cylinder,
} from '../../src/lib/index.js';

// ---------------------------------------------------------------------------
// Dry-stone wall: irregular grey courses with a row of upright coping stones.
// Texture covers 2 m (u) x 1 m (v); the coping sits in the top 20 %.

function drystoneTexture() {
  return canvasTexture(256, 128, (ctx, W, H) => {
    const r = rng(7041);
    ctx.fillStyle = '#4f4a43';
    ctx.fillRect(0, 0, W, H);
    const greys = ['#a9a296', '#9a9387', '#b8b1a3', '#8d877c', '#a39a88', '#b2ab9b'];
    const copeH = Math.round(H * 0.2);
    // coping: upright slabs
    for (let x = 0; x < W;) {
      const w = 6 + Math.floor(r() * 6);
      ctx.fillStyle = shade(r.pick(greys), -0.12);
      ctx.fillRect(x + 1, 1, w - 2, copeH - 2);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.fillRect(x + 1, 1, w - 2, 2);
      x += w;
    }
    // courses of flat stones, wrapping horizontally so the texture tiles
    for (let y = copeH; y < H;) {
      const ch = 9 + Math.floor(r() * 7);
      let x = -Math.floor(r() * 20);
      while (x < W) {
        const w = 14 + Math.floor(r() * 26);
        const c = r.pick(greys);
        for (const ox of [0, W]) {
          ctx.fillStyle = c;
          ctx.fillRect(x + 1 - ox, y + 1, w - 2, ch - 2);
          ctx.fillStyle = 'rgba(255,255,255,0.2)';
          ctx.fillRect(x + 1 - ox, y + 1, w - 2, 2);
          ctx.fillStyle = 'rgba(0,0,0,0.15)';
          ctx.fillRect(x + 1 - ox, y + ch - 3, w - 2, 2);
        }
        x += w;
      }
      y += ch;
    }
  }, { key: 'sheep-farm:drystone' });
}

/**
 * Dry-stone wall that follows the ground. path = [[x,z]…], ground(x,z) -> height.
 * Built as one strip mesh so the stone texture runs on without seams.
 */
export function stoneWall(path, ground, { h = 1, t = 0.45, step = 0.35 } = {}) {
  const b = new ShapeBuilder();
  const pts = [];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i], [bx, bz] = path[i + 1];
    const n = Math.max(1, Math.ceil(Math.hypot(bx - ax, bz - az) / step));
    for (let k = i === 0 ? 0 : 1; k <= n; k++) pts.push([ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n]);
  }
  let s = 0;
  const samples = pts.map(([x, z], i) => {
    if (i > 0) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    // tangent -> side offset
    const [px, pz] = pts[Math.max(0, i - 1)], [nx, nz] = pts[Math.min(pts.length - 1, i + 1)];
    const len = Math.hypot(nx - px, nz - pz) || 1;
    const ox = (-(nz - pz) / len) * (t / 2), oz = ((nx - px) / len) * (t / 2);
    const gy = ground(x, z);
    return { x, z, s, ox, oz, top: gy + h, bot: Math.max(0.02, gy - 0.12) };
  });
  const V = (y, top) => y - top + 1; // texture v: coping row lines up with the wall top
  for (let i = 0; i < samples.length - 1; i++) {
    const a = samples[i], c = samples[i + 1];
    const u0 = a.s / 2, u1 = c.s / 2;
    // side A (+offset) and side B (-offset)
    for (const sg of [1, -1]) {
      const A = (p, y) => [p.x + sg * p.ox, y, p.z + sg * p.oz];
      const quad = [A(a, a.bot), A(c, c.bot), A(c, c.top), A(a, a.top)];
      const uvs = [[u0, V(a.bot, a.top)], [u1, V(c.bot, c.top)], [u1, 1], [u0, 1]];
      if (sg > 0) b.quadUV(...quad, uvs, 0);
      else b.quadUV(quad[1], quad[0], quad[3], quad[2], [uvs[1], uvs[0], uvs[3], uvs[2]], 0);
    }
    // top
    b.quadUV(
      [a.x + a.ox, a.top, a.z + a.oz], [c.x + c.ox, c.top, c.z + c.oz],
      [c.x - c.ox, c.top, c.z - c.oz], [a.x - a.ox, a.top, a.z - a.oz],
      [[0, 0], [1, 0], [1, 1], [0, 1]], 1,
    );
  }
  // end caps
  for (const [p, dir] of [[samples[0], -1], [samples[samples.length - 1], 1]]) {
    const L = [p.x + p.ox, 0, p.z + p.oz], R = [p.x - p.ox, 0, p.z - p.oz];
    const q = [[L[0], p.bot, L[2]], [R[0], p.bot, R[2]], [R[0], p.top, R[2]], [L[0], p.top, L[2]]];
    const uvs = [[0, V(p.bot, p.top)], [t / 2, V(p.bot, p.top)], [t / 2, 1], [0, 1]];
    if (dir > 0) b.quadUV(...q, uvs, 0);
    else b.quadUV(q[1], q[0], q[3], q[2], [uvs[1], uvs[0], uvs[3], uvs[2]], 0);
  }
  return new THREE.Mesh(b.build(), [textured(drystoneTexture()), mat('#6f695f')]);
}

// ---------------------------------------------------------------------------
// Wool bales: hessian packs with a stencilled brand.

function baleTexture(label) {
  return canvasTexture(128, 160, (ctx, W, H) => {
    const r = rng(label.length * 31 + 5);
    ctx.fillStyle = '#e6dcc4';
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.18;
    ctx.fillStyle = '#8a7a5c';
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 1);
    for (let x = 0; x < W; x += 4) ctx.fillRect(x, 0, 1, H);
    for (let i = 0; i < 120; i++) ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), 3, 2);
    ctx.globalAlpha = 1;
    // stitched seam at top
    ctx.fillStyle = '#b9ab88';
    ctx.fillRect(0, 0, W, 10);
    ctx.fillStyle = '#1f3b78';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(label, W / 2, H * 0.36);
    ctx.font = 'bold 24px sans-serif';
    ctx.fillStyle = '#a3271f';
    ctx.fillText('AAA M', W / 2, H * 0.62);
    ctx.fillStyle = '#1f3b78';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText(String(100 + (label.length * 7) % 90), W / 2, H * 0.82);
  }, { key: 'sheep-farm:bale:' + label, repeat: false });
}

/** Rectangular wool bale, w x h x d (origin base centre). Brand on all four sides. */
export function woolBale({ w = 0.75, h = 1.0, d = 0.75, label = 'WOOL' } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0); // 0..1 UVs per face
  const side = textured(baleTexture(label));
  const top = mat('#ddd2b8');
  const m = new THREE.Mesh(geo, [side, side, top, top, side, side]);
  return m;
}

// ---------------------------------------------------------------------------
/** Large legible sign facing +Z (0..1 UVs, so the text fills the face). */
export function bigSign({ text, w, h, bg, fg, border, depth = 0.12 }) {
  const tex = signTexture(text, { bg, fg, border, width: 512, height: Math.round(512 * (h / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// ---------------------------------------------------------------------------
/** Wooden field gate (5-bar with a diagonal brace), along +X from its hinge. */
export function fieldGate({ w = 1.6, h = 1.05, color = '#b9a27a' } = {}) {
  const m = mat(color);
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) g.add(place(box(w, 0.07, 0.05, m), { x: w / 2, y: 0.15 + (i * (h - 0.2)) / 4 }));
  g.add(place(box(0.08, h, 0.07, m), { x: 0.04 }));
  g.add(place(box(0.08, h, 0.07, m), { x: w - 0.04 }));
  const rise = h - 0.25, diag = Math.hypot(w - 0.1, rise);
  g.add(place(box(diag, 0.07, 0.05, m), { x: w / 2, y: 0.15 + rise / 2 - 0.035, rz: (Math.atan2(rise, w - 0.1) * 180) / Math.PI }));
  return g;
}

/** Hurdle run (post-and-rail) from a to b. */
export function hurdles(a, b, { h = 1.0, color = '#a88a5f' } = {}) {
  const m = mat(color);
  const g = new THREE.Group();
  const [ax, az] = a, [bx, bz] = b;
  const len = Math.hypot(bx - ax, bz - az);
  const ang = Math.atan2(-(bz - az), bx - ax);
  const run = new THREE.Group();
  const posts = Math.max(2, Math.round(len / 1.0) + 1);
  for (let i = 0; i < posts; i++) run.add(place(box(0.1, h + 0.1, 0.1, mat(PALETTE.woodDark)), { x: (len * i) / (posts - 1) }));
  for (const y of [0.3, 0.6, 0.9]) run.add(place(box(len, 0.08, 0.05, m), { x: len / 2, y: y * h }));
  run.position.set(ax, 0, az);
  run.rotation.y = ang;
  g.add(run);
  return g;
}

/** Galvanised water trough along X. */
export function trough({ w = 1.6 } = {}) {
  const m = mat(PALETTE.steelLight, { metalness: 0.4, roughness: 0.45 });
  return new THREE.Group().add(
    place(box(w, 0.45, 0.55, m), { y: 0.05 }),
    place(box(w - 0.12, 0.02, 0.43, mat(PALETTE.water, { roughness: 0.2 })), { y: 0.44 }),
    place(box(0.1, 0.1, 0.5, mat(PALETTE.steelDark)), { x: -w / 2 + 0.15 }),
    place(box(0.1, 0.1, 0.5, mat(PALETTE.steelDark)), { x: w / 2 - 0.15 }),
  );
}

/** V-shaped wooden hay rack on legs, full of hay. Along X. */
export function hayRack({ w = 1.8 } = {}) {
  const wood = mat(PALETTE.wood);
  const g = new THREE.Group();
  for (const x of [-w / 2, w / 2]) for (const z of [-0.35, 0.35]) g.add(place(box(0.1, 1.2, 0.1, wood), { x, z }));
  g.add(place(box(w + 0.1, 0.08, 0.75, wood), { y: 0.45 }));
  g.add(place(box(w - 0.1, 0.55, 0.55, mat(PALETTE.hay)), { y: 0.53 }));
  for (let i = 0; i <= 6; i++) {
    const x = -w / 2 + (w * i) / 6;
    for (const sz of [-1, 1]) g.add(place(box(0.05, 0.75, 0.05, wood), { x, y: 0.5, z: sz * 0.33, rx: sz * 18 }));
  }
  return g;
}

/** Farm ute (pick-up) with a flat tray, along +X. */
export function ute({ color = '#2f6aa3' } = {}) {
  const body = mat(color, { roughness: 0.45, metalness: 0.25 });
  const dark = mat(PALETTE.black);
  const g = new THREE.Group();
  g.add(place(box(4.2, 0.35, 1.7, mat(PALETTE.steelDark)), { y: 0.38 }));
  g.add(place(box(1.6, 0.6, 1.75, body), { x: 1.25, y: 0.6 }));          // bonnet + cab base
  g.add(place(box(1.05, 0.6, 1.7, body), { x: 0.75, y: 1.2 }));           // cab
  g.add(place(box(0.05, 0.45, 1.5, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 1.29, y: 1.27, rz: -8 }));
  g.add(place(box(0.8, 0.4, 1.73, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 0.72, y: 1.28 }));
  g.add(place(box(2.4, 0.1, 1.8, mat(PALETTE.woodDark)), { x: -0.9, y: 0.73 })); // tray deck
  for (const z of [-0.88, 0.88]) g.add(place(box(2.4, 0.3, 0.05, mat(PALETTE.steelLight)), { x: -0.9, y: 0.83, z }));
  g.add(place(box(0.05, 0.3, 1.8, mat(PALETTE.steelLight)), { x: -2.08, y: 0.83 }));
  g.add(place(box(0.08, 0.9, 1.8, mat(PALETTE.steelLight)), { x: 0.2, y: 0.83 })); // headboard
  for (const x of [1.35, -1.3]) for (const z of [-0.82, 0.82]) {
    g.add(place(cylinder(0.36, 0.36, 0.25, dark, 10), { x, y: 0.36, z: z + (z > 0 ? -0.12 : 0.12), rx: 90 }));
  }
  g.add(place(box(0.06, 0.12, 0.3, mat('#fff3c4')), { x: 2.07, y: 0.72, z: -0.6 }));
  g.add(place(box(0.06, 0.12, 0.3, mat('#fff3c4')), { x: 2.07, y: 0.72, z: 0.6 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, box, place, cylinder, dome, taperedBlock, mat, metal, textured, canvasTexture, signTexture, shade, rng,
} from '../../src/lib/index.js';

/** Box with 0..1 UVs on every face, base at y = 0 (the lib's box() has UVs in metres). */
function uvBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

/** Sign whose text fills the +Z face whatever its size (works around the lib's sign() on faces > 1 m). */
export function bigSign({ text, w, h, bg, fg = '#ffffff', depth = 0.15, border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, side]);
}

/** Round plate with the three chasing arrows of the recycling logo, facing +Z. */
export function recycleLogo({ size = 1.6, bg = PALETTE.green, depth = 0.12 } = {}) {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = W * 0.05;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W / 2 - 12, 0, Math.PI * 2);
    ctx.stroke();
    const R = W * 0.3;
    const pts = [0, 1, 2].map((i) => {
      const a = ((-90 + i * 120) * Math.PI) / 180;
      return [W / 2 + R * Math.cos(a), H / 2 + 10 + R * Math.sin(a)];
    });
    ctx.fillStyle = '#ffffff';
    ctx.lineWidth = W * 0.085;
    ctx.lineCap = 'butt';
    for (let i = 0; i < 3; i++) {
      const [ax, ay] = pts[i];
      const [bx, by] = pts[(i + 1) % 3];
      const lerp = (t) => [ax + (bx - ax) * t, ay + (by - ay) * t];
      const s = lerp(0.12), e = lerp(0.68), tip = lerp(0.9);
      ctx.beginPath();
      ctx.moveTo(s[0], s[1]);
      ctx.lineTo(e[0], e[1]);
      ctx.stroke();
      // arrowhead
      const dx = bx - ax, dy = by - ay, len = Math.hypot(dx, dy);
      const nx = -dy / len, ny = dx / len, hw = W * 0.09;
      ctx.beginPath();
      ctx.moveTo(tip[0], tip[1]);
      ctx.lineTo(e[0] + nx * hw, e[1] + ny * hw);
      ctx.lineTo(e[0] - nx * hw, e[1] - ny * hw);
      ctx.closePath();
      ctx.fill();
    }
  }, { key: `recycling-centre:logo:${bg}`, repeat: false });
  const face = textured(tex, { transparent: true, alphaTest: 0.5, emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const g = new THREE.Group();
  // backing disc + logo face just in front of it
  const disc = cylinder(size / 2, size / 2, depth, mat(bg), 24);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, size / 2, 0);
  g.add(disc);
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(size, size), face);
  plane.position.set(0, size / 2, depth + 0.03);
  g.add(plane);
  return g;
}

/** Open-top skip with flared ends, length along Z. Top of rim at y = h. */
export function skip({ color, contents, w = 2, d = 2.6, h = 1.3, seed = 1 }) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.6 });
  const top = d + 0.9;
  g.add(place(taperedBlock({ w, d, h: h - 0.05, topW: w + 0.08, topD: top, material: body, topMaterial: mat(contents.base) }), { y: 0.05 }));
  // rim and lifting lugs
  const rim = mat(shade(color, -0.25));
  g.add(place(box(w + 0.16, 0.12, 0.12, rim), { y: h - 0.08, z: top / 2 }));
  g.add(place(box(w + 0.16, 0.12, 0.12, rim), { y: h - 0.08, z: -top / 2 }));
  g.add(place(box(0.12, 0.12, top, rim), { x: (w + 0.08) / 2, y: h - 0.08 }));
  g.add(place(box(0.12, 0.12, top, rim), { x: -(w + 0.08) / 2, y: h - 0.08 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.14, 0.3, 0.3, rim), { x: sx * (w / 2 + 0.06), y: h * 0.55, z: sz * d * 0.32 }));
  }
  // heaped contents poking out of the top
  const r = rng(seed);
  for (let i = 0; i < contents.count; i++) {
    const s = r.range(0.3, 0.6);
    const c = r.pick(contents.colors);
    g.add(place(box(s * r.range(0.8, 1.4), s * 0.6, s, mat(c)), {
      x: r.range(-w / 2 + 0.35, w / 2 - 0.35), y: h - 0.15, z: r.range(-d / 2, d / 2), ry: r.range(0, 90),
    }));
  }
  return g;
}

/** Igloo-style glass bottle bank (~1.7 m tall) with posting holes and a lifting knob. */
export function bottleBank({ color, label = PALETTE.white, r = 0.85 }) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45 });
  g.add(cylinder(r, r * 1.02, 0.7, body, 16));
  g.add(place(dome({ radius: r, height: r * 0.8, material: body, segments: 16 }), { y: 0.7 }));
  g.add(place(cylinder(r * 1.03, r * 1.03, 0.16, mat(label), 16), { y: 0.42 }));
  const hole = mat(PALETTE.black);
  for (const a of [0, 90, 180, 270]) {
    const rad = (a * Math.PI) / 180;
    const o = cylinder(0.13, 0.13, 0.1, hole, 10);
    o.rotation.x = Math.PI / 2;
    const p = new THREE.Group();
    o.position.set(0, 0, r * 0.93);
    p.add(o);
    p.position.y = 0.95;
    p.rotation.y = rad;
    g.add(p);
  }
  g.add(place(cylinder(0.08, 0.08, 0.3, metal(PALETTE.steelDark), 8), { y: 0.7 + r * 0.78 }));
  g.add(place(cylinder(0.18, 0.18, 0.1, metal(PALETTE.steelDark), 10), { y: 0.7 + r * 0.78 + 0.3 }));
  return g;
}

/** Wheelie bin with lid, ~1.1 m tall; front (handle side) towards -Z. */
export function wheelieBin({ color, lid = color }) {
  const g = new THREE.Group();
  g.add(place(taperedBlock({ w: 0.62, d: 0.68, h: 0.95, topW: 0.68, topD: 0.76, material: mat(color, { roughness: 0.5 }) }), { y: 0.06 }));
  g.add(place(box(0.74, 0.08, 0.84, mat(shade(lid, -0.1))), { y: 1.01 }));
  const wheel = mat(PALETTE.black);
  for (const sx of [-1, 1]) g.add(place(box(0.08, 0.22, 0.22, wheel), { x: sx * 0.3, z: -0.3 }));
  return g;
}

const BALE_TEX = {
  cardboard: { base: '#94673a', layers: ['#7d5530', '#a87a48', '#6e4a28', '#b88a55'], strap: '#2a4fa0' },
  paper: { base: '#e2ddd0', layers: ['#c9c4b8', '#f2efe6', '#9fb7c9', '#e8d27a'], strap: '#2a4fa0' },
  cans: { base: '#b9c0c6', layers: ['#8d969e', '#d4d8dc', '#c8322b', '#6f9fca'], strap: '#232326' },
  plastic: { base: '#8fc0d8', layers: ['#2f6fbf', '#e9c31f', '#f1eee6', '#3a9a4a', '#c8322b'], strap: '#232326' },
};

function baleTexture(kind) {
  const t = BALE_TEX[kind];
  return canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(kind.length * 17 + 3);
    ctx.fillStyle = t.base;
    ctx.fillRect(0, 0, W, H);
    // compressed layers: short horizontal streaks
    for (let y = 0; y < H; y += 5) {
      for (let x = -10; x < W; x += r.range(10, 30)) {
        ctx.fillStyle = r.pick(t.layers);
        ctx.fillRect(x, y + r.range(0, 2), r.range(8, 26), r.range(2, 4));
      }
    }
    ctx.fillStyle = t.strap;
    for (const x of [0.22, 0.5, 0.78]) ctx.fillRect(W * x - 2, 0, 4, H);
  }, { key: `recycling-centre:bale:${kind}`, repeat: false });
}

/** Compressed bale (cardboard / paper / cans / plastic), base at y = 0. */
export function bale({ kind = 'cardboard', w = 1.2, h = 0.85, d = 0.8 }) {
  const m = textured(baleTexture(kind));
  return uvBox(w, h, d, m);
}

/** Wooden pallet. */
export function pallet({ w = 1.25, d = 0.85 } = {}) {
  return box(w, 0.14, d, mat(PALETTE.woodLight));
}

/** Small yellow forklift, forks towards +X. */
export function forklift({ color = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  g.add(place(box(1.8, 0.8, 1.1, body), { y: 0.25 }));
  g.add(place(box(0.6, 0.6, 1.0, dark), { x: -0.55, y: 1.05 })); // counterweight / seat
  // overhead guard
  for (const sx of [-0.6, 0.4]) for (const sz of [-0.48, 0.48]) g.add(place(box(0.07, 1.2, 0.07, dark), { x: sx, y: 1.05, z: sz }));
  g.add(place(box(1.15, 0.07, 1.05, dark), { x: -0.1, y: 2.25 }));
  // mast and forks
  g.add(place(box(0.12, 2.3, 0.9, metal(PALETTE.steelDark)), { x: 1.0, y: 0.15 }));
  for (const sz of [-0.28, 0.28]) g.add(place(box(1.0, 0.06, 0.12, metal(PALETTE.steelDark)), { x: 1.55, y: 0.4, z: sz }));
  const wheelM = mat(PALETTE.black);
  for (const x of [-0.55, 0.6]) for (const sz of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10);
    wg.rotateX(Math.PI / 2);
    const wh = new THREE.Mesh(wg, wheelM);
    wh.position.set(x, 0.28, sz * 0.55);
    g.add(wh);
  }
  return g;
}

/**
 * Inclined belt conveyor from `from` to `to` ([x, y, z], belt top), straight in the XY plane.
 * Supports drop to `groundY`; bits of sorted waste ride on the belt.
 */
export function conveyor({ from, to, width = 1.0, groundY = 0, seed = 4 }) {
  const g = new THREE.Group();
  const [x0, y0, z] = from;
  const [x1, y1] = to;
  const dx = x1 - x0, dy = y1 - y0;
  const len = Math.hypot(dx, dy);
  const ang = Math.atan2(dy, dx);
  const frame = new THREE.Group();
  frame.position.set(x0, y0, z);
  frame.rotation.z = ang;
  const sideM = mat(PALETTE.green, { roughness: 0.5 });
  frame.add(place(box(len, 0.12, width * 0.85, mat(PALETTE.black)), { x: len / 2, y: -0.12 }));
  for (const s of [-1, 1]) frame.add(place(box(len, 0.45, 0.08, sideM), { x: len / 2, y: -0.3, z: s * width / 2 }));
  // cover hood over the top half
  frame.add(place(box(len * 0.45, 0.06, width + 0.1, mat(PALETTE.steelLight)), { x: len * 0.75, y: 0.55 }));
  for (const s of [-1, 1]) frame.add(place(box(len * 0.45, 0.6, 0.05, mat(PALETTE.steelLight)), { x: len * 0.75, y: 0.0, z: s * (width / 2 + 0.03) }));
  const r = rng(seed);
  const bits = [PALETTE.blue, PALETTE.yellow, PALETTE.white, '#b08a58', PALETTE.red, PALETTE.steelLight];
  for (let t = 0.6; t < len * 0.52; t += r.range(0.45, 0.8)) {
    frame.add(place(box(r.range(0.2, 0.4), 0.15, r.range(0.2, 0.45), mat(r.pick(bits))), { x: t, y: 0, z: r.range(-0.25, 0.25), ry: r.range(0, 60) }));
  }
  g.add(frame);
  // A-frame supports
  const legM = metal(PALETTE.steelDark);
  for (const t of [0.3, 0.62]) {
    const lx = x0 + dx * t, ly = y0 + dy * t - 0.45;
    for (const s of [-1, 1]) g.add(place(box(0.14, ly - groundY, 0.14, legM), { x: lx, y: groundY, z: z + s * (width / 2 - 0.05) }));
    g.add(place(box(0.1, 0.1, width, legM), { x: lx, y: groundY + (ly - groundY) * 0.5, z }));
  }
  return g;
}

/** Feed hopper: inverted frustum on legs, top at about y = 1.9. */
export function hopper({ color = PALETTE.green } = {}) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.5 });
  const legM = metal(PALETTE.steelDark);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.12, 1.0, 0.12, legM), { x: sx * 0.5, z: sz * 0.5 }));
  g.add(place(taperedBlock({ w: 1.0, d: 1.0, h: 0.9, topW: 1.8, topD: 1.8, material: m, topMaterial: mat(PALETTE.darkGrey) }), { y: 1.0 }));
  return g;
}

/** Very simple person (~1.75 m). */
export function person({ shirt = PALETTE.blue, trousers = PALETTE.navy, skin = '#e0b48c' } = {}) {
  const g = new THREE.Group();
  g.add(place(box(0.34, 0.85, 0.22, mat(trousers)), {}));
  g.add(place(box(0.44, 0.6, 0.26, mat(shirt)), { y: 0.85 }));
  g.add(place(box(0.22, 0.25, 0.22, mat(skin)), { y: 1.47 }));
  return g;
}

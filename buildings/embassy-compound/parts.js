import * as THREE from 'three';
import { PALETTE, canvasTexture, signTexture, textured, mat, metal, box, cylinder, place, group } from '../../src/lib/index.js';

// Box with 0..1 UVs on every face (base at y = 0), so a texture fills each face
// whatever its size. Material order: +x, -x, top, bottom, +z, -z.
export function uvBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

// Big legible sign (the lib sign() shrinks text on faces over 1 m).
export function bigSign({ text, w, h, depth = 0.12, bg = PALETTE.navy, fg = '#ffffff', border = null, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

// Simple, generic national-flag designs drawn on a 3:2 canvas.
const FLAG_DESIGNS = {
  vtri: (ctx, W, H, [a, b, c]) => {
    [a, b, c].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect((i * W) / 3, 0, W / 3 + 1, H); });
  },
  htri: (ctx, W, H, [a, b, c]) => {
    [a, b, c].forEach((col, i) => { ctx.fillStyle = col; ctx.fillRect(0, (i * H) / 3, W, H / 3 + 1); });
  },
  cross: (ctx, W, H, [a, b]) => {
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = b; ctx.fillRect(W * 0.3, 0, W * 0.14, H); ctx.fillRect(0, H * 0.43, W, H * 0.14);
  },
  disc: (ctx, W, H, [a, b]) => {
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = b; ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.3, 0, Math.PI * 2); ctx.fill();
  },
  star: (ctx, W, H, [a, b]) => {
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = b; starPath(ctx, W / 2, H / 2, H * 0.32); ctx.fill();
  },
  canton: (ctx, W, H, [a, b, c]) => {
    for (let i = 0; i < 7; i++) { ctx.fillStyle = i % 2 ? b : a; ctx.fillRect(0, (i * H) / 7, W, H / 7 + 1); }
    ctx.fillStyle = c; ctx.fillRect(0, 0, W * 0.42, H * 0.57);
    ctx.fillStyle = '#ffffff'; starPath(ctx, W * 0.21, H * 0.285, H * 0.17); ctx.fill();
  },
  band: (ctx, W, H, [a, b, c]) => {
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = b; ctx.fillRect(0, H * 0.3, W, H * 0.4);
    ctx.fillStyle = c; ctx.beginPath(); ctx.arc(W / 2, H / 2, H * 0.14, 0, Math.PI * 2); ctx.fill();
  },
  hoist: (ctx, W, H, [a, b, c]) => {
    ctx.fillStyle = a; ctx.fillRect(0, 0, W, H / 2);
    ctx.fillStyle = b; ctx.fillRect(0, H / 2, W, H / 2);
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(W * 0.4, H / 2); ctx.lineTo(0, H); ctx.fill();
  },
};

function starPath(ctx, cx, cy, r) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.42 : r;
    const a = -Math.PI / 2 + (i * Math.PI) / 5;
    ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
  }
  ctx.closePath();
}

export function flagTexture(design, colors) {
  return canvasTexture(96, 64, (ctx, W, H) => FLAG_DESIGNS[design](ctx, W, H, colors), {
    key: `embassy-compound:flag:${design}:${colors.join(',')}`, repeat: false,
  });
}

// Flag pole with a gold finial and a textured flag flying towards +x.
export function nationalFlag({ h = 5.5, design, colors, fw = 1.35, fh = 0.9 }) {
  const tex = flagTexture(design, colors);
  const face = textured(tex, { side: THREE.DoubleSide });
  const edge = mat(colors[0]);
  return group(
    cylinder(0.045, 0.06, h, metal(PALETTE.steelLight), 6),
    place(new THREE.Mesh(new THREE.SphereGeometry(0.09, 8, 6), metal(PALETTE.glassGold, { roughness: 0.3 })), { y: h + 0.05 }),
    place(uvBox(fw, fh, 0.03, [edge, edge, edge, edge, face, face]), { x: fw / 2 + 0.05, y: h - fh - 0.05 })
  );
}

// Round gold crest / coat-of-arms disc (faces +z).
export function crestTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = PALETTE.navy; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d9b44a'; ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.48, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.navy; ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.4, 0, Math.PI * 2); ctx.fill();
    // shield
    ctx.fillStyle = '#d9b44a';
    ctx.beginPath();
    ctx.moveTo(W * 0.32, H * 0.3); ctx.lineTo(W * 0.68, H * 0.3); ctx.lineTo(W * 0.68, H * 0.52);
    ctx.quadraticCurveTo(W * 0.66, H * 0.7, W * 0.5, H * 0.78);
    ctx.quadraticCurveTo(W * 0.34, H * 0.7, W * 0.32, H * 0.52); ctx.closePath(); ctx.fill();
    ctx.fillStyle = PALETTE.red; ctx.fillRect(W * 0.45, H * 0.33, W * 0.1, H * 0.38);
    ctx.fillRect(W * 0.36, H * 0.42, W * 0.28, H * 0.09);
  }, { key: 'embassy-compound:crest', repeat: false });
}

// Satellite dish on a short mount: a parabolic bowl tilted up towards +z.
export function satelliteDish({ r = 1.1 } = {}) {
  const white = mat(PALETTE.white, { side: THREE.DoubleSide });
  const steel = metal(PALETTE.steelDark);
  const pts = [];
  for (let i = 0; i <= 5; i++) { const x = (r * i) / 5; pts.push(new THREE.Vector2(Math.max(x, 0.01), (0.35 * x * x) / r)); }
  const bowl = new THREE.Mesh(new THREE.LatheGeometry(pts, 14), white);
  const head = group(
    bowl,
    place(cylinder(0.025, 0.025, r * 0.75, steel, 4), {}),
    place(box(0.14, 0.14, 0.14, mat(PALETTE.darkGrey)), { y: r * 0.75 })
  );
  head.position.y = 1.0;
  head.rotation.x = 0.65;
  return group(cylinder(0.1, 0.14, 1.05, steel, 6), head);
}

import * as THREE from 'three';
import { PALETTE, canvasTexture, textured, mat, metal, place, box, group } from '../../src/lib/index.js';

// FIZZ POP brand pieces for the bottling plant: logo textures, a big sign with
// 0..1 UVs (the lib sign() shrinks text on faces over 1 m), lorries, crates.

export const BRAND_RED = '#c8202a';
export const BRAND_DARK = '#8e141c';
export const COLA = '#5a2414';

function drawBottle(ctx, cx, cy, h, color) {
  // little contour bottle silhouette, centred on (cx, cy)
  const w = h * 0.3;
  ctx.save();
  ctx.translate(cx, cy - h / 2);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(-w * 0.18, 0);
  ctx.lineTo(w * 0.18, 0);
  ctx.lineTo(w * 0.2, h * 0.22);
  ctx.quadraticCurveTo(w * 0.5, h * 0.35, w * 0.5, h * 0.5);
  ctx.quadraticCurveTo(w * 0.38, h * 0.68, w * 0.5, h * 0.82);
  ctx.lineTo(w * 0.46, h);
  ctx.lineTo(-w * 0.46, h);
  ctx.lineTo(-w * 0.5, h * 0.82);
  ctx.quadraticCurveTo(-w * 0.38, h * 0.68, -w * 0.5, h * 0.5);
  ctx.quadraticCurveTo(-w * 0.5, h * 0.35, -w * 0.2, h * 0.22);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawLogo(ctx, x, y, w, h, fg) {
  // italic "FIZZ POP" with an underline swoosh, fitted into the box
  ctx.save();
  ctx.fillStyle = fg;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  let size = h * 0.62;
  ctx.font = `italic bold ${size}px sans-serif`;
  while (ctx.measureText('FIZZ POP').width > w * 0.92 && size > 6) {
    size -= 1;
    ctx.font = `italic bold ${size}px sans-serif`;
  }
  ctx.fillText('FIZZ POP', x + w / 2, y + h * 0.44);
  ctx.lineWidth = Math.max(2, h * 0.07);
  ctx.strokeStyle = fg;
  ctx.beginPath();
  ctx.moveTo(x + w * 0.1, y + h * 0.84);
  ctx.quadraticCurveTo(x + w * 0.5, y + h * 0.66, x + w * 0.9, y + h * 0.8);
  ctx.stroke();
  ctx.restore();
}

/** Red sign texture: bottle icon + FIZZ POP logo (+ optional sub line). */
export function logoTexture({ sub = null, width = 512, height = 128, bg = BRAND_RED, fg = '#ffffff' } = {}) {
  return canvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = fg;
    ctx.lineWidth = Math.max(3, H * 0.05);
    ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, W - 2 * ctx.lineWidth, H - 2 * ctx.lineWidth);
    const iconW = H * 0.55;
    drawBottle(ctx, H * 0.42, H / 2, H * 0.72, fg);
    drawBottle(ctx, W - H * 0.42, H / 2, H * 0.72, fg);
    const textH = sub ? H * 0.72 : H;
    drawLogo(ctx, iconW + H * 0.1, sub ? H * 0.04 : 0, W - 2 * iconW - H * 0.2, textH, fg);
    if (sub) {
      ctx.fillStyle = fg;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${H * 0.17}px sans-serif`;
      ctx.fillText(sub, W / 2, H * 0.82);
    }
  }, { key: `bottling-plant:logo:${sub}:${width}x${height}:${bg}:${fg}`, repeat: false });
}

/** Label that wraps around the giant bottle: white band, red logo twice. */
export function labelTexture() {
  // four logos, centred on the iso camera diagonals (u = 0.125, 0.375, …)
  return canvasTexture(2048, 256, (ctx, W, H) => {
    ctx.fillStyle = BRAND_RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, H * 0.1, W, H * 0.8);
    for (let i = 0; i < 4; i++) {
      const cx = ((i + 0.5) * W) / 4;
      drawLogo(ctx, cx - W * 0.115, H * 0.12, W * 0.23, H * 0.78, BRAND_RED);
    }
  }, { key: 'bottling-plant:label', repeat: true });
}

/** Lorry curtain side: red with a white wave, logo and a row of bottles. */
function lorrySideTexture() {
  return canvasTexture(512, 256, (ctx, W, H) => {
    ctx.fillStyle = BRAND_RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.78);
    ctx.quadraticCurveTo(W * 0.3, H * 0.62, W * 0.6, H * 0.78);
    ctx.quadraticCurveTo(W * 0.85, H * 0.9, W, H * 0.74);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    drawLogo(ctx, W * 0.05, H * 0.08, W * 0.9, H * 0.52, '#ffffff');
    for (let i = 0; i < 5; i++) drawBottle(ctx, W * (0.2 + i * 0.15), H * 0.86, H * 0.24, i % 2 ? '#3a8a2e' : COLA);
  }, { key: 'bottling-plant:lorry-side', repeat: false });
}

/** Crate side: red plastic crate with a hand slot and a white FP badge. */
function crateTexture() {
  return canvasTexture(64, 32, (ctx, W, H) => {
    ctx.fillStyle = BRAND_RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = BRAND_DARK;
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
    ctx.fillRect(W * 0.35, H * 0.22, W * 0.3, H * 0.2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W * 0.3, H * 0.55, W * 0.4, H * 0.25);
  }, { key: 'bottling-plant:crate', repeat: false, nearest: true });
}

/** Crate top: grid of bottle caps. */
function crateTopTexture() {
  return canvasTexture(64, 48, (ctx, W, H) => {
    ctx.fillStyle = BRAND_DARK;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
      ctx.fillStyle = (i + j) % 3 === 0 ? '#e8e2c8' : '#d8a020';
      ctx.beginPath();
      ctx.arc((i + 0.5) * (W / 4), (j + 0.5) * (H / 3), W / 11, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { key: 'bottling-plant:crate-top', repeat: false, nearest: true });
}

/** Box with 0..1 UVs per face, base at y = 0. */
export function uvBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

/** Big flat sign facing +Z with the logo filling the face (optionally double-sided). */
export function bigSign({ w, h, depth = 0.25, sub = null, double = false }) {
  const tex = logoTexture({ sub, width: 512, height: Math.round(512 * h / w) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(BRAND_DARK);
  return uvBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

/** Red delivery lorry along Z, cab towards +Z, origin at the centre of its length on the ground. */
export function lorry({ cab = BRAND_RED, len = 5.4 } = {}) {
  const g = new THREE.Group();
  const W = 2.2;
  const cabL = 1.6;
  const bodyL = len - cabL - 0.15;
  const sideTex = lorrySideTexture();
  const side = textured(sideTex);
  const white = mat(PALETTE.white);
  const red = mat(cab, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  // chassis
  g.add(place(box(1.6, 0.35, len - 0.2, dark), { y: 0.45 }));
  // box body: branded sides, white roof, red rear doors
  g.add(place(uvBox(W, 2.4, bodyL, [side, side, white, dark, white, mat(BRAND_DARK)]), { y: 0.8, z: -len / 2 + bodyL / 2 }));
  // cab with windscreen and roof deflector
  const cz = len / 2 - cabL / 2;
  g.add(place(box(W, 1.9, cabL, red), { y: 0.6, z: cz }));
  g.add(place(box(W - 0.2, 0.75, 0.05, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { y: 1.55, z: len / 2 + 0.01 }));
  g.add(place(box(0.05, 0.6, 0.7, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: W / 2 + 0.01, y: 1.65, z: cz + 0.3 }));
  g.add(place(box(0.05, 0.6, 0.7, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: -W / 2 - 0.01, y: 1.65, z: cz + 0.3 }));
  g.add(place(box(W - 0.1, 0.5, cabL * 0.7, white), { y: 2.5, z: cz - 0.15 }));
  g.add(place(box(W - 0.3, 0.25, 0.08, mat(PALETTE.lightGrey)), { y: 0.75, z: len / 2 + 0.02 }));
  for (const sx of [-1, 1]) g.add(place(box(0.35, 0.18, 0.06, mat('#fff6c8', { emissive: '#fff6c8', emissiveIntensity: 0.4 })), { x: sx * 0.75, y: 0.95, z: len / 2 + 0.02 }));
  const wheelM = mat(PALETTE.black);
  for (const z of [cz, -len / 2 + 1.0]) for (const sx of [-1, 1]) {
    const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10).rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(geo, wheelM);
    wheel.position.set(sx * (W / 2 - 0.12), 0.45, z);
    g.add(wheel);
  }
  return g;
}

/** Stack of red soda crates on a wooden pallet: nx x nz crates, ny high. */
export function crateStack({ nx = 2, nz = 2, ny = 4, cw = 0.55, ch = 0.32, cd = 0.4 } = {}) {
  const side = textured(crateTexture());
  const top = textured(crateTopTexture());
  const g = new THREE.Group();
  const pw = nx * cw + 0.1, pd = nz * cd + 0.1;
  g.add(box(pw, 0.14, pd, mat(PALETTE.woodLight)));
  for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) for (let j = 0; j < ny; j++) {
    g.add(place(uvBox(cw - 0.02, ch, cd - 0.02, [side, side, top, side, side, side]), {
      x: (i - (nx - 1) / 2) * cw, y: 0.14 + j * ch, z: (k - (nz - 1) / 2) * cd,
    }));
  }
  return g;
}

/** Yellow forklift, forks towards +Z. */
export function forklift() {
  const y = mat(PALETTE.yellow, { roughness: 0.5 });
  const d = mat(PALETTE.darkGrey);
  const g = group(
    place(box(1.0, 0.7, 1.6, y), { y: 0.25 }),
    place(box(0.9, 0.45, 0.5, d), { y: 0.95, z: -0.55 }),
    place(box(0.06, 1.2, 0.06, d), { x: -0.45, y: 0.95, z: 0.35 }),
    place(box(0.06, 1.2, 0.06, d), { x: 0.45, y: 0.95, z: -0.2 }),
    place(box(0.06, 1.2, 0.06, d), { x: -0.45, y: 0.95, z: -0.2 }),
    place(box(0.06, 1.2, 0.06, d), { x: 0.45, y: 0.95, z: 0.35 }),
    place(box(1.0, 0.06, 0.65, y), { y: 2.15, z: 0.07 }),
    place(box(0.9, 2.3, 0.1, metal(PALETTE.steelDark)), { z: 0.85 }),
    place(box(0.12, 0.05, 0.9, metal(PALETTE.steelDark)), { x: -0.25, y: 0.12, z: 1.3 }),
    place(box(0.12, 0.05, 0.9, metal(PALETTE.steelDark)), { x: 0.25, y: 0.12, z: 1.3 }),
  );
  for (const [x, z] of [[-0.5, 0.5], [0.5, 0.5], [-0.5, -0.5], [0.5, -0.5]]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8).rotateZ(Math.PI / 2), mat(PALETTE.black));
    w.position.set(x, 0.25, z);
    g.add(w);
  }
  return g;
}

// one shared small-bottle geometry (≈0.55 m tall, oversized so it reads in the shots)
let smallBottleGeo = null;
export function smallBottle(color) {
  if (!smallBottleGeo) {
    const pts = [[0, 0], [0.1, 0], [0.11, 0.08], [0.11, 0.3], [0.05, 0.44], [0.04, 0.55], [0, 0.55]].map(([r, y]) => new THREE.Vector2(r, y));
    smallBottleGeo = new THREE.LatheGeometry(pts, 6);
  }
  return new THREE.Mesh(smallBottleGeo, mat(color, { roughness: 0.25, metalness: 0.2 }));
}

/** Giant contour soda bottle (≈ 15 m) with a wrap-around label and a crown cap. */
export function giantBottle({ scale = 1 } = {}) {
  const s = scale;
  const prof = [
    [0, 0], [1.75, 0], [1.95, 0.35], [2.0, 1.0], [2.0, 3.8], [1.72, 5.0], [1.6, 5.6], [1.75, 6.4],
    [2.0, 7.4], [2.0, 8.4], [1.8, 9.6], [1.3, 10.9], [0.85, 12.0], [0.7, 13.0], [0.72, 13.6], [0, 13.6],
  ].map(([r, y]) => new THREE.Vector2(r * s, y * s));
  const g = new THREE.Group();
  const glassM = mat(COLA, { roughness: 0.18, metalness: 0.35, flatShading: false });
  g.add(new THREE.Mesh(new THREE.LatheGeometry(prof, 24), glassM));
  // label band (open cylinder, 0..1 UVs around)
  const lt = labelTexture();
  const label = new THREE.Mesh(new THREE.CylinderGeometry(2.03 * s, 2.03 * s, 2.4 * s, 32, 1, true), textured(lt, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: lt }));
  label.position.y = (1.3 + 1.2) * s;
  g.add(label);
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(2.03 * s, 2.03 * s, 0.7 * s, 24, 1, true), mat(BRAND_RED, { roughness: 0.5 })), { y: 8.0 * s }));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(2.04 * s, 2.04 * s, 0.18 * s, 24, 1, true), mat(PALETTE.white)), { y: 8.0 * s }));
  // crown cap with crimped skirt
  const cap = mat(BRAND_RED, { roughness: 0.4, metalness: 0.4 });
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.82 * s, 0.86 * s, 0.6 * s, 12), cap), { y: 13.35 * s + 0.3 * s }));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.6 * s, 0.82 * s, 0.2 * s, 12), cap), { y: 13.95 * s + 0.1 * s }));
  g.userData.height = 14.15 * s;
  return g;
}


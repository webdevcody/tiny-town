import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, canvasTexture, textured, mat, emissive, shade } from '../../src/lib/index.js';

// Local sign helpers. The lib's sign() puts a clamped texture on metre-UV
// boxes, so big faces shrink the text; these use BoxGeometry's 0..1 UVs.

const GOLD = PALETTE.yellow;
const RED = PALETTE.red;

/** Box with 0..1 UVs per face, base at y = 0. mats: [+x, -x, top, bottom, +z, -z]. */
export function uvBox(w, h, d, mats) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mats);
}

function glow(tex, amt = 0.35) {
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: amt, emissiveMap: tex });
}

function spade(ctx, cx, cy, s) {
  ctx.beginPath();
  ctx.moveTo(cx, cy - s);
  ctx.bezierCurveTo(cx + s * 0.2, cy - s * 0.6, cx + s, cy - s * 0.2, cx + s * 0.85, cy + s * 0.3);
  ctx.bezierCurveTo(cx + s * 0.7, cy + s * 0.75, cx + s * 0.2, cy + s * 0.7, cx + s * 0.06, cy + s * 0.4);
  ctx.lineTo(cx + s * 0.3, cy + s * 1.0);
  ctx.lineTo(cx - s * 0.3, cy + s * 1.0);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.4);
  ctx.bezierCurveTo(cx - s * 0.2, cy + s * 0.7, cx - s * 0.7, cy + s * 0.75, cx - s * 0.85, cy + s * 0.3);
  ctx.bezierCurveTo(cx - s, cy - s * 0.2, cx - s * 0.2, cy - s * 0.6, cx, cy - s);
  ctx.fill();
}

function bulbBorder(ctx, W, H, inset, r, step, color = '#fff6c0') {
  ctx.fillStyle = color;
  for (let x = inset; x <= W - inset + 0.1; x += step) {
    ctx.beginPath(); ctx.arc(x, inset, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(x, H - inset, r, 0, Math.PI * 2); ctx.fill();
  }
  for (let y = inset + step; y < H - inset; y += step) {
    ctx.beginPath(); ctx.arc(inset, y, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.arc(W - inset, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

/** Giant Ace of Spades playing card standing on edge; face to +z, red/gold back to -z. */
export function playingCard({ w = 5, h = 7, t = 0.35 } = {}) {
  const face = canvasTexture(256, 360, (ctx, W, H) => {
    ctx.fillStyle = '#fbf8ee';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.fillStyle = '#141414';
    spade(ctx, W / 2, H / 2 - 18, 82);
    ctx.font = 'bold 64px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('A', 40, 50);
    spade(ctx, 40, 102, 17);
    ctx.save();
    ctx.translate(W - 40, H - 50);
    ctx.rotate(Math.PI);
    ctx.fillText('A', 0, 0);
    spade(ctx, 0, 52, 17);
    ctx.restore();
  }, { key: 'casino-resort:card-face', repeat: false });
  const back = canvasTexture(256, 360, (ctx, W, H) => {
    ctx.fillStyle = '#f6f0dc';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b71c1c';
    ctx.fillRect(16, 16, W - 32, H - 32);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 3;
    for (let i = -H; i < W + H; i += 22) {
      ctx.beginPath(); ctx.moveTo(i, 16); ctx.lineTo(i + H, H + 16); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i, H - 16); ctx.lineTo(i + H, -H - 16); ctx.stroke();
    }
    ctx.strokeStyle = '#f6f0dc';
    ctx.lineWidth = 16;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = '#f6f0dc';
    ctx.beginPath(); ctx.ellipse(W / 2, H / 2, 58, 58, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#b71c1c';
    ctx.font = 'bold 52px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('GA', W / 2, H / 2 + 3);
  }, { key: 'casino-resort:card-back', repeat: false });
  const edge = mat('#f6f0dc');
  return uvBox(w, h, t, [edge, edge, edge, edge, glow(face, 0.25), glow(back, 0.2)]);
}

function dieFace(n) {
  return canvasTexture(128, 128, (ctx, W) => {
    ctx.fillStyle = '#d22a24';
    ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = shade('#d22a24', -0.3);
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, W - 6);
    const p = { 1: [[2, 2]], 2: [[1, 1], [3, 3]], 3: [[1, 1], [2, 2], [3, 3]], 4: [[1, 1], [1, 3], [3, 1], [3, 3]], 5: [[1, 1], [1, 3], [2, 2], [3, 1], [3, 3]], 6: [[1, 1], [1, 2], [1, 3], [3, 1], [3, 2], [3, 3]] }[n];
    ctx.fillStyle = '#ffffff';
    for (const [cx, cy] of p) {
      ctx.beginPath(); ctx.arc((cx * W) / 4, (cy * W) / 4, W * 0.1, 0, Math.PI * 2); ctx.fill();
    }
  }, { key: 'casino-resort:die-' + n, repeat: false });
}

/** Big red die with white pips, base at y = 0. faces: [+x, -x, top, bottom, +z, -z] pip counts. */
export function die({ s = 2.6, faces = [3, 4, 5, 2, 1, 6] } = {}) {
  return uvBox(s, s, s, faces.map((n) => glow(dieFace(n), 0.2)));
}

/** Marquee sign: text on a background with a drawn ring of bulbs; text faces +z (and -z if double). */
export function marquee({ text, w, h, d = 0.4, bg = RED, fg = GOLD, double = false, px = 64, font = 'bold', glowAmt = 0.4 }) {
  const W = Math.round((px * w) / h / 2) * 2, H = px;
  const tex = canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = H * 0.06;
    ctx.strokeRect(H * 0.03, H * 0.03, W - H * 0.06, H - H * 0.06);
    bulbBorder(ctx, W, H, H * 0.12, H * 0.035, H * 0.16);
    let size = H * 0.6;
    ctx.font = `${font} ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.86 && size > 6) {
      size -= 1;
      ctx.font = `${font} ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = shade(bg, -0.45);
    ctx.fillText(text, W / 2 + H * 0.03, H / 2 + H * 0.07);
    ctx.fillStyle = fg;
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key: `casino-resort:marquee:${text}:${bg}:${fg}:${w}x${h}`, repeat: false });
  const side = mat(GOLD, { metalness: 0.3, roughness: 0.4 });
  const f = glow(tex, glowAmt);
  return uvBox(w, h, d, [side, side, side, side, f, double ? f : side]);
}

/** Many small glowing bulbs merged into one mesh. pts = [[x,y,z]...]. */
export function bulbs(pts, { r = 0.12, color = '#fff2a8', intensity = 1 } = {}) {
  const geos = pts.map(([x, y, z]) => new THREE.OctahedronGeometry(r, 0).translate(x, y, z));
  return new THREE.Mesh(mergeGeometries(geos), emissive(color, intensity));
}

/** Points along a rectangle outline in the XY plane (at depth z), spaced ~step. */
export function rectOutline(w, h, z, step, y0 = 0) {
  const pts = [];
  const nx = Math.max(1, Math.round(w / step)), ny = Math.max(1, Math.round(h / step));
  for (let i = 0; i <= nx; i++) {
    const x = -w / 2 + (w * i) / nx;
    pts.push([x, y0, z], [x, y0 + h, z]);
  }
  for (let j = 1; j < ny; j++) {
    const y = y0 + (h * j) / ny;
    pts.push([-w / 2, y, z], [w / 2, y, z]);
  }
  return pts;
}

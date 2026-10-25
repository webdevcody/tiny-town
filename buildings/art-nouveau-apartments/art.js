// Canvas textures for the Art Nouveau Apartments: arched window bays,
// wrought-iron railings, mosaic friezes and posters.
import { PALETTE, canvasTexture, shade, rng } from '../../src/lib/index.js';

const K = 'art-nouveau-apartments:';

export const COLORS = {
  wall: PALETTE.cream,
  stone: '#d8c49a',
  iron: '#1f2f29',
  ironGreen: '#2d5a48',
  frame: '#2f5f4c',
  glass: '#3c5670',
  lit: '#f3d58c',
  gold: '#d9a640',
  teal: '#2f8f87',
  blue: '#2c5b9c',
  orange: '#d9682c',
  red: '#b8433a',
};

// Small tesserae grid over whatever was drawn, so flat colour reads as mosaic.
function tesserae(ctx, W, H, step, seed) {
  const r = rng(seed);
  for (let y = 0; y < H; y += step) {
    for (let x = 0; x < W; x += step) {
      const a = r.range(0, 0.16);
      ctx.fillStyle = r.chance(0.5) ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
      ctx.fillRect(x, y, step, step);
    }
  }
  ctx.strokeStyle = 'rgba(40,30,20,0.35)';
  ctx.lineWidth = 1;
  for (let y = 0; y <= H; y += step) { ctx.beginPath(); ctx.moveTo(0, y + 0.5); ctx.lineTo(W, y + 0.5); ctx.stroke(); }
  for (let x = 0; x <= W; x += step) { ctx.beginPath(); ctx.moveTo(x + 0.5, 0); ctx.lineTo(x + 0.5, H); ctx.stroke(); }
}

// Whiplash flower: stem curving out of the bottom into a blossom.
function blossom(ctx, cx, cy, r, petal, heart) {
  ctx.fillStyle = petal;
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    ctx.beginPath();
    ctx.ellipse(cx + Math.cos(a) * r * 0.6, cy + Math.sin(a) * r * 0.6, r * 0.55, r * 0.3, a, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = heart;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.38, 0, Math.PI * 2);
  ctx.fill();
}

// Path for a window with a curvy "basket" arch on top.
function archPath(ctx, xl, xr, yt, yb, rise) {
  ctx.beginPath();
  ctx.moveTo(xl, yb);
  ctx.lineTo(xl, yt + rise);
  ctx.bezierCurveTo(xl, yt - rise * 0.25, xr, yt - rise * 0.25, xr, yt + rise);
  ctx.lineTo(xr, yb);
  ctx.closePath();
}

function drawWindow(ctx, xl, xr, yt, yb, { rise, lit, curtain, frame = COLORS.frame, fan = false }) {
  const w = xr - xl;
  // stone surround
  ctx.fillStyle = shade(COLORS.stone, -0.05);
  archPath(ctx, xl - w * 0.1, xr + w * 0.1, yt - w * 0.1, yb + 2, rise);
  ctx.fill();
  // frame + glass
  ctx.fillStyle = frame;
  archPath(ctx, xl, xr, yt, yb, rise);
  ctx.fill();
  const f = Math.max(3, w * 0.07);
  ctx.fillStyle = lit ? COLORS.lit : COLORS.glass;
  archPath(ctx, xl + f, xr - f, yt + f, yb - f, rise);
  ctx.fill();
  if (!lit) {
    // sky reflection
    ctx.fillStyle = 'rgba(190,215,235,0.35)';
    ctx.beginPath();
    ctx.moveTo(xl + f, yb - f);
    ctx.lineTo(xl + f, yt + rise + f);
    ctx.lineTo(xl + w * 0.55, yt + rise + f);
    ctx.lineTo(xl + f + w * 0.1, yb - f);
    ctx.fill();
  }
  if (curtain) {
    ctx.fillStyle = curtain;
    ctx.fillRect(xl + f, yt + rise + f, w * 0.2, yb - yt - rise - 2 * f);
    ctx.fillRect(xr - f - w * 0.2, yt + rise + f, w * 0.2, yb - yt - rise - 2 * f);
  }
  // glazing bars: transom, mullion, curvy fan bars in the arch
  ctx.strokeStyle = frame;
  ctx.lineWidth = Math.max(2, w * 0.06);
  const ty = yt + rise + (yb - yt) * 0.12;
  ctx.beginPath();
  ctx.moveTo(xl, ty); ctx.lineTo(xr, ty);
  ctx.moveTo((xl + xr) / 2, ty); ctx.lineTo((xl + xr) / 2, yb);
  if (fan) {
    for (const t of [0.25, 0.75]) {
      ctx.moveTo((xl + xr) / 2, ty);
      ctx.lineTo(xl + w * t, yt + rise * 0.3);
    }
  } else {
    ctx.moveTo(xl + w * 0.3, ty);
    ctx.quadraticCurveTo(xl + w * 0.5, yt, xr - w * 0.3, ty);
  }
  ctx.stroke();
}

/**
 * Upper-floor facade: 3 bays x 2 storeys. Cream ashlar, curvy-arched windows
 * in green frames, floral keystones and relief aprons.
 */
export function upperTexture() {
  return canvasTexture(384, 384, (ctx, W, H) => {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = shade(COLORS.wall, -0.07);
    ctx.lineWidth = 1;
    for (let y = 48; y < H; y += 48) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
    // two storeys x three bays of curtain / light variations
    const variants = [
      [{ curtain: '#f0e6cf' }, { curtain: null }, { lit: true, curtain: '#c9714f' }],
      [{ curtain: null }, { curtain: '#a8574a' }, { curtain: '#f0e6cf' }],
    ];
    for (let row = 0; row < 2; row++) {
      for (let i = 0; i < 3; i++) {
        const x0 = i * 128, y = row * 192;
        const xl = x0 + 34, xr = x0 + 94;
        const yt = y + 40, yb = y + 160;
        // relief apron under the sill
        ctx.fillStyle = shade(COLORS.stone, 0.05);
        ctx.fillRect(xl - 6, yb + 4, xr - xl + 12, 18);
        ctx.strokeStyle = shade(COLORS.stone, -0.2);
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(xl, yb + 13);
        ctx.bezierCurveTo(xl + 15, yb + 2, xl + 25, yb + 24, x0 + 64, yb + 13);
        ctx.bezierCurveTo(xr - 25, yb + 2, xr - 15, yb + 24, xr, yb + 13);
        ctx.stroke();
        drawWindow(ctx, xl, xr, yt, yb, { rise: 16, lit: false, ...variants[row][i] });
        // sill
        ctx.fillStyle = shade(COLORS.stone, -0.12);
        ctx.fillRect(xl - 6, yb, xr - xl + 12, 5);
        // floral keystone with a turquoise tile
        ctx.fillStyle = shade(COLORS.stone, -0.1);
        ctx.beginPath();
        ctx.moveTo(x0 + 54, y + 22); ctx.lineTo(x0 + 74, y + 22); ctx.lineTo(x0 + 70, y + 42); ctx.lineTo(x0 + 58, y + 42);
        ctx.fill();
        ctx.strokeStyle = shade(COLORS.stone, -0.18);
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x0 + 56, y + 26); ctx.bezierCurveTo(x0 + 34, y + 14, x0 + 24, y + 34, x0 + 38, y + 36);
        ctx.moveTo(x0 + 72, y + 26); ctx.bezierCurveTo(x0 + 94, y + 14, x0 + 104, y + 34, x0 + 90, y + 36);
        ctx.stroke();
        ctx.fillStyle = COLORS.teal;
        ctx.beginPath(); ctx.arc(x0 + 64, y + 30, 5, 0, Math.PI * 2); ctx.fill();
      }
      // stringcourse at the floor line
      ctx.fillStyle = shade(COLORS.wall, -0.1);
      ctx.fillRect(0, row * 192 + 187, W, 5);
    }
  }, { key: K + 'upper' });
}

/** Ground floor: rusticated stone with round-arched windows. 3 bays x 1 storey (3.6 m). */
export function groundTexture() {
  return canvasTexture(384, 230, (ctx, W, H) => {
    const base = shade(COLORS.stone, 0.08);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(COLORS.stone, -0.18);
    for (let y = 28; y < H; y += 28) ctx.fillRect(0, y, W, 4);
    for (let i = 0; i < 3; i++) {
      const x0 = i * 128;
      const xl = x0 + 30, xr = x0 + 98;
      // voussoirs
      ctx.fillStyle = shade(COLORS.stone, 0.15);
      ctx.beginPath();
      ctx.arc(x0 + 64, 76, 50, Math.PI, 0);
      ctx.lineTo(xr + 16, 76); ctx.lineTo(xl - 16, 76);
      ctx.fill();
      ctx.strokeStyle = shade(COLORS.stone, -0.2);
      ctx.lineWidth = 2;
      for (let k = 1; k < 8; k++) {
        const a = Math.PI + (k / 8) * Math.PI;
        ctx.beginPath();
        ctx.moveTo(x0 + 64 + Math.cos(a) * 34, 76 + Math.sin(a) * 34);
        ctx.lineTo(x0 + 64 + Math.cos(a) * 50, 76 + Math.sin(a) * 50);
        ctx.stroke();
      }
      drawWindow(ctx, xl, xr, 42, 196, { rise: 34, lit: i === 1, curtain: null, fan: true });
      ctx.fillStyle = shade(COLORS.stone, -0.25);
      ctx.fillRect(xl - 6, 196, xr - xl + 12, 6);
      // keystone
      ctx.fillStyle = shade(COLORS.stone, -0.08);
      ctx.beginPath();
      ctx.moveTo(x0 + 56, 18); ctx.lineTo(x0 + 72, 18); ctx.lineTo(x0 + 68, 42); ctx.lineTo(x0 + 60, 42);
      ctx.fill();
    }
    // plinth
    ctx.fillStyle = shade(COLORS.stone, -0.3);
    ctx.fillRect(0, H - 16, W, 16);
  }, { key: K + 'ground' });
}

/** Oriel (bow window) storey: tall glazing over a mosaic spandrel. 3 bays x 1 storey. */
export function orielTexture() {
  return canvasTexture(384, 192, (ctx, W, H) => {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 3; i++) {
      const x0 = i * 128;
      drawWindow(ctx, x0 + 14, x0 + 114, 14, 132, { rise: 18, lit: i === 2, curtain: i === 0 ? '#f0e6cf' : null });
      // mosaic spandrel
      ctx.fillStyle = COLORS.teal;
      ctx.fillRect(x0 + 8, 142, 112, 40);
      ctx.fillStyle = COLORS.gold;
      ctx.fillRect(x0 + 12, 146, 104, 32);
      ctx.strokeStyle = '#3f7d3a';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(x0 + 16, 176); ctx.bezierCurveTo(x0 + 40, 140, x0 + 50, 180, x0 + 64, 160);
      ctx.moveTo(x0 + 112, 176); ctx.bezierCurveTo(x0 + 88, 140, x0 + 78, 180, x0 + 64, 160);
      ctx.stroke();
      blossom(ctx, x0 + 64, 160, 14, COLORS.orange, COLORS.red);
    }
    tesserae(ctx, W, H, 4, 3);
    // repaint plain wall bits over the mosaic grain (only the spandrels stay tiled)
    ctx.fillStyle = COLORS.wall;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(i * 128, 182, 128, 10);
      ctx.fillRect(i * 128, 134, 128, 8);
      ctx.fillRect(i * 128, 0, 8, 142);
      ctx.fillRect(i * 128 + 120, 0, 8, 142);
    }
    ctx.fillStyle = shade(COLORS.wall, -0.12);
    ctx.fillRect(0, H - 6, W, 6);
  }, { key: K + 'oriel' });
}

/**
 * Wrought-iron balcony railing: whiplash curves and spirals between rails,
 * transparent background. One repeat = ~0.9 m.
 */
export function railTexture() {
  return canvasTexture(256, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = COLORS.iron;
    ctx.fillStyle = COLORS.iron;
    ctx.lineCap = 'round';
    ctx.fillRect(0, 0, W, 22);
    ctx.fillRect(0, H - 20, W, 20);
    ctx.fillRect(0, 0, 18, H);
    ctx.fillRect(W - 18, 0, 18, H);
    ctx.lineWidth = 16;
    const cx = W / 2;
    ctx.beginPath();
    // central stem and tulip
    ctx.moveTo(cx, H - 20); ctx.lineTo(cx, 90);
    // two whiplash curves sweeping out to spirals
    for (const s of [-1, 1]) {
      ctx.moveTo(cx, H - 40);
      ctx.bezierCurveTo(cx + s * 20, 120, cx + s * 110, 220, cx + s * 100, 90);
      ctx.moveTo(cx, 120);
      ctx.bezierCurveTo(cx + s * 30, 40, cx + s * 80, 50, cx + s * 70, 22);
    }
    ctx.stroke();
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.arc(cx + s * 78, 96, 22, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.beginPath();
    ctx.ellipse(cx, 76, 20, 30, 0, 0, Math.PI * 2);
    ctx.fill();
  }, { key: K + 'rail' });
}

/** Mosaic frieze under the cornice: gold ground, blossoms on whiplash stems. One repeat = ~2 m. */
export function friezeTexture() {
  return canvasTexture(256, 96, (ctx, W, H) => {
    ctx.fillStyle = COLORS.gold;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = COLORS.blue;
    ctx.fillRect(0, 12, W, 14);
    ctx.strokeStyle = '#3f7d3a';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(0, 70);
    ctx.bezierCurveTo(50, 20, 80, 95, 128, 52);
    ctx.bezierCurveTo(176, 10, 206, 95, 256, 70);
    ctx.stroke();
    ctx.fillStyle = '#4f9a4a';
    for (const [x, y, a] of [[40, 56, -0.6], [90, 70, 0.7], [166, 40, -0.7], [216, 72, 0.6]]) {
      ctx.beginPath();
      ctx.ellipse(x, y, 16, 7, a, 0, Math.PI * 2);
      ctx.fill();
    }
    blossom(ctx, 128, 50, 24, COLORS.orange, COLORS.red);
    blossom(ctx, 0, 70, 18, '#e9e2cf', COLORS.blue);
    blossom(ctx, 256, 70, 18, '#e9e2cf', COLORS.blue);
    tesserae(ctx, W, H, 6, 7);
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(0, H - 8, W, 8);
  }, { key: K + 'frieze' });
}

/** Sunburst mosaic for the half-disc over the gable window (only the top half shows). */
export function sunburstTexture() {
  return canvasTexture(256, 256, (ctx, W, H) => {
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = COLORS.teal;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 14; i++) {
      const a0 = Math.PI + (i / 14) * Math.PI, a1 = Math.PI + ((i + 1) / 14) * Math.PI;
      ctx.fillStyle = i % 2 ? COLORS.gold : '#e7c86a';
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, 118, a0, a1);
      ctx.fill();
    }
    ctx.strokeStyle = COLORS.teal;
    ctx.lineWidth = 12;
    ctx.beginPath(); ctx.arc(cx, cy, 120, Math.PI, 0); ctx.stroke();
    ctx.fillStyle = COLORS.orange;
    ctx.beginPath(); ctx.arc(cx, cy, 46, Math.PI, 0); ctx.fill();
    ctx.fillStyle = COLORS.red;
    ctx.beginPath(); ctx.arc(cx, cy, 24, Math.PI, 0); ctx.fill();
    tesserae(ctx, W, H, 8, 11);
  }, { key: K + 'sunburst' });
}

/** Posters wrapped round the Morris advertising column. */
export function posterTexture() {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = '#2d4a3c';
    ctx.fillRect(0, 0, W, H);
    const posters = [
      ['#efe2c0', COLORS.orange, COLORS.teal],
      ['#d9a640', '#7a3b6e', '#f2e6cc'],
      ['#2c5b9c', '#f2e6cc', COLORS.gold],
      ['#b8433a', '#f2e6cc', '#2d4a3c'],
    ];
    posters.forEach(([bg, a, b], i) => {
      const x = i * 128 + 10;
      ctx.fillStyle = bg;
      ctx.fillRect(x, 8, 108, H - 16);
      ctx.fillStyle = a;
      ctx.beginPath(); ctx.arc(x + 54, 50, 30, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = b;
      ctx.beginPath(); ctx.ellipse(x + 54, 58, 14, 26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillRect(x + 14, 92, 80, 8);
      ctx.fillRect(x + 24, 106, 60, 6);
    });
  }, { key: K + 'posters' });
}

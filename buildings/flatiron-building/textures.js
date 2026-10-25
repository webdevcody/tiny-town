// Limestone facade textures for the Flatiron Building.
// Each texture is a grid of window cells (one cell = one bay x one storey),
// mapped by wedgePrism() in building.js so windows line up with floors.

import { canvasTexture, shade, rng, PALETTE } from '../../src/lib/index.js';

export const STONE = {
  base: '#d6c5a0', // rusticated lower floors
  shaft: '#e4d6b6', // main limestone / terracotta
  crown: '#ece2c8', // light top storeys
  trim: '#f3ebd6', // bands, cornice
  joint: '#a8956f',
  bronze: '#4a3e2e',
  glass: '#3d5468',
  lit: '#ffe29a',
  green: '#2f5d43',
};

function speckle(ctx, w, h, color, r, count, alpha = 0.08) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.5 + r());
    ctx.fillStyle = r() < 0.5 ? shade(color, 0.25) : shade(color, -0.25);
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), 2, 2);
  }
  ctx.restore();
}

// a sash window: bronze frame, two panes, sometimes lit
function sash(ctx, x, y, w, h, r, { arched = false, lit = 0.12 } = {}) {
  const on = r() < lit;
  ctx.fillStyle = STONE.bronze;
  ctx.beginPath();
  if (arched) {
    const rad = w / 2;
    ctx.moveTo(x, y + h);
    ctx.lineTo(x, y + rad);
    ctx.arc(x + rad, y + rad, rad, Math.PI, 0);
    ctx.lineTo(x + w, y + h);
  } else ctx.rect(x, y, w, h);
  ctx.fill();
  const ix = x + 2, iy = y + 2, iw = w - 4, ih = h - 4;
  ctx.save();
  ctx.beginPath();
  if (arched) {
    const rad = iw / 2;
    ctx.moveTo(ix, iy + ih);
    ctx.lineTo(ix, iy + rad);
    ctx.arc(ix + rad, iy + rad, rad, Math.PI, 0);
    ctx.lineTo(ix + iw, iy + ih);
  } else ctx.rect(ix, iy, iw, ih);
  ctx.clip();
  if (on) {
    ctx.fillStyle = STONE.lit;
    ctx.fillRect(ix, iy, iw, ih);
    ctx.fillStyle = shade(STONE.lit, -0.2);
    ctx.fillRect(ix, iy + ih * 0.7, iw, ih * 0.3);
  } else {
    const g = ctx.createLinearGradient(ix, iy, ix + iw, iy + ih);
    g.addColorStop(0, shade(STONE.glass, 0.4));
    g.addColorStop(0.5, STONE.glass);
    g.addColorStop(1, shade(STONE.glass, -0.3));
    ctx.fillStyle = g;
    ctx.fillRect(ix, iy, iw, ih);
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(ix + iw * 0.2, iy);
    ctx.lineTo(ix + iw * 0.55, iy);
    ctx.lineTo(ix + iw * 0.1, iy + ih);
    ctx.lineTo(ix - iw * 0.25, iy + ih);
    ctx.fill();
    ctx.globalAlpha = 1;
    if (r() < 0.3) {
      ctx.fillStyle = '#efe6d2';
      ctx.fillRect(ix, iy, iw, ih * (0.2 + r() * 0.3));
    }
  }
  ctx.restore();
  // meeting rail
  ctx.fillStyle = STONE.bronze;
  ctx.fillRect(ix, iy + ih * 0.55, iw, 2);
}

const CW = 48;

/** Middle storeys: limestone, lintel with keystone, sill, faint terracotta joints. */
export function shaftTexture() {
  const cols = 4, rows = 2, CH = 96;
  return canvasTexture(cols * CW, rows * CH, (ctx, W, H) => {
    const r = rng(41);
    ctx.fillStyle = STONE.shaft;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, STONE.shaft, r, (W * H) / 30, 0.08);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * CW, y0 = row * CH;
        ctx.fillStyle = shade(STONE.shaft, -0.06);
        for (let j = 1; j < 6; j++) ctx.fillRect(x0, y0 + (j * CH) / 6, CW, 1);
        // pilaster strip at the bay edge
        ctx.fillStyle = shade(STONE.shaft, -0.1);
        ctx.fillRect(x0, y0, 3, CH);
        ctx.fillStyle = shade(STONE.shaft, 0.12);
        ctx.fillRect(x0 + 3, y0, 1, CH);
        const wx = x0 + 13, ww = 22, wy = y0 + 22, wh = 54;
        // lintel + keystone
        ctx.fillStyle = shade(STONE.shaft, -0.14);
        ctx.fillRect(wx - 4, wy - 8, ww + 8, 7);
        ctx.fillStyle = shade(STONE.shaft, 0.15);
        ctx.fillRect(wx + ww / 2 - 3, wy - 10, 6, 10);
        sash(ctx, wx, wy, ww, wh, r);
        // sill + shadow
        ctx.fillStyle = shade(STONE.shaft, 0.18);
        ctx.fillRect(wx - 3, wy + wh, ww + 6, 3);
        ctx.fillStyle = shade(STONE.shaft, -0.18);
        ctx.fillRect(wx - 3, wy + wh + 3, ww + 6, 2);
      }
    }
  }, { key: 'flatiron-building:shaft' });
}

/** Lower storeys: rusticated (deeply grooved) limestone with heavy lintels. */
export function baseTexture() {
  const cols = 4, rows = 2, CH = 96;
  return canvasTexture(cols * CW, rows * CH, (ctx, W, H) => {
    const r = rng(42);
    ctx.fillStyle = STONE.base;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, STONE.base, r, (W * H) / 25, 0.1);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * CW, y0 = row * CH;
        for (let j = 0; j < 6; j++) {
          const y = y0 + (j * CH) / 6;
          ctx.fillStyle = shade(STONE.base, -0.35);
          ctx.fillRect(x0, y, CW, 2);
          ctx.fillStyle = shade(STONE.base, 0.15);
          ctx.fillRect(x0, y + 2, CW, 1);
        }
        const wx = x0 + 14, ww = 20, wy = y0 + 26, wh = 46;
        // voussoir block over the window
        ctx.fillStyle = shade(STONE.base, -0.12);
        ctx.fillRect(wx - 5, wy - 11, ww + 10, 10);
        ctx.fillStyle = shade(STONE.base, -0.3);
        for (let k = 1; k < 5; k++) ctx.fillRect(wx - 5 + (k * (ww + 10)) / 5, wy - 11, 1, 10);
        sash(ctx, wx, wy, ww, wh, r, { lit: 0.18 });
        ctx.fillStyle = shade(STONE.base, 0.2);
        ctx.fillRect(wx - 3, wy + wh, ww + 6, 3);
      }
    }
  }, { key: 'flatiron-building:base' });
}

/** Top storeys: arched windows between fluted pilasters with roundels. */
export function crownTexture() {
  const cols = 4, rows = 2, CH = 96;
  return canvasTexture(cols * CW, rows * CH, (ctx, W, H) => {
    const r = rng(43);
    ctx.fillStyle = STONE.crown;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, STONE.crown, r, (W * H) / 30, 0.07);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * CW, y0 = row * CH;
        // pilaster with flutes
        ctx.fillStyle = shade(STONE.crown, -0.08);
        ctx.fillRect(x0, y0, 7, CH);
        ctx.fillStyle = shade(STONE.crown, -0.22);
        ctx.fillRect(x0 + 2, y0 + 6, 1, CH - 12);
        ctx.fillRect(x0 + 5, y0 + 6, 1, CH - 12);
        ctx.fillStyle = shade(STONE.crown, -0.15);
        ctx.fillRect(x0, y0 + CH - 4, CW, 3);
        const wx = x0 + 14, ww = 22, wy = y0 + 18, wh = 62;
        // arch surround
        ctx.fillStyle = shade(STONE.crown, -0.16);
        ctx.beginPath();
        ctx.arc(wx + ww / 2, wy + ww / 2, ww / 2 + 4, Math.PI, 0);
        ctx.lineTo(wx + ww + 4, wy + ww / 2 + 2);
        ctx.lineTo(wx - 4, wy + ww / 2 + 2);
        ctx.fill();
        sash(ctx, wx, wy, ww, wh, r, { arched: true, lit: 0.15 });
        // roundel ornament in the spandrel
        ctx.fillStyle = shade(STONE.crown, -0.2);
        ctx.beginPath();
        ctx.arc(x0 + 10, y0 + 9, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = shade(STONE.crown, 0.2);
        ctx.fillRect(wx - 3, wy + wh, ww + 6, 3);
      }
    }
  }, { key: 'flatiron-building:crown' });
}

/** Ground floor shops: stone piers, green transoms, big lit display windows. */
export function shopTexture() {
  const cols = 4, CH = 136;
  return canvasTexture(cols * CW, CH, (ctx, W, H) => {
    const r = rng(44);
    ctx.fillStyle = STONE.base;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, STONE.base, r, (W * H) / 25, 0.1);
    for (let col = 0; col < cols; col++) {
      const x0 = col * CW;
      const gx = x0 + 6, gw = CW - 12;
      // transom band
      ctx.fillStyle = STONE.green;
      ctx.fillRect(gx, 20, gw, 22);
      for (let k = 0; k < 3; k++) {
        ctx.fillStyle = shade(STONE.glass, 0.25);
        ctx.fillRect(gx + 2 + (k * (gw - 4)) / 3, 23, (gw - 4) / 3 - 2, 16);
      }
      ctx.fillStyle = STONE.green;
      ctx.fillRect(gx, 42, gw, H - 42 - 12);
      if (col === 1) {
        // bronze double door
        ctx.fillStyle = shade(STONE.bronze, -0.2);
        ctx.fillRect(gx + 4, 46, gw - 8, H - 46 - 12);
        ctx.fillStyle = shade(STONE.glass, 0.1);
        ctx.fillRect(gx + 7, 50, gw / 2 - 8, 40);
        ctx.fillRect(gx + gw / 2 + 1, 50, gw / 2 - 8, 40);
        ctx.fillStyle = PALETTE.yellow;
        ctx.fillRect(gx + gw / 2 - 3, 96, 2, 6);
        ctx.fillRect(gx + gw / 2 + 1, 96, 2, 6);
      } else {
        ctx.fillStyle = shade(STONE.lit, 0.25);
        ctx.fillRect(gx + 3, 46, gw - 6, H - 46 - 16);
        ctx.fillStyle = shade(STONE.lit, -0.15);
        ctx.fillRect(gx + 3, H - 30, gw - 6, 14);
        for (let i = 0; i < 3; i++) {
          ctx.fillStyle = r.pick([PALETTE.red, PALETTE.blue, '#2f6b3a', PALETTE.orange, PALETTE.purple, '#ffffff']);
          const gh = 8 + r() * 16;
          ctx.fillRect(gx + 5 + i * 10, H - 30 - gh, 7, gh);
        }
        ctx.fillStyle = STONE.green;
        ctx.fillRect(gx + gw / 2 - 1, 46, 2, H - 46 - 16);
      }
      // plinth
      ctx.fillStyle = shade(STONE.base, -0.3);
      ctx.fillRect(x0, H - 12, CW, 12);
      // pier highlight
      ctx.fillStyle = shade(STONE.base, 0.15);
      ctx.fillRect(x0 + 1, 0, 2, H - 12);
      ctx.fillStyle = shade(STONE.base, -0.15);
      ctx.fillRect(x0, 16, CW, 3);
    }
  }, { key: 'flatiron-building:shop' });
}

/** Frieze under the cornice: fascia, egg-and-dart dots and a dentil course. */
export function friezeTexture() {
  return canvasTexture(64, 48, (ctx, W, H) => {
    ctx.fillStyle = STONE.trim;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(STONE.trim, -0.18);
    ctx.fillRect(0, 26, W, 2);
    for (let x = 0; x < W; x += 8) {
      ctx.fillStyle = shade(STONE.trim, -0.35);
      ctx.fillRect(x + 4, 0, 4, 10); // dentil gaps
      ctx.fillStyle = shade(STONE.trim, -0.2);
      ctx.beginPath();
      ctx.arc(x + 4, 18, 2.5, 0, Math.PI * 2); // egg-and-dart
      ctx.fill();
    }
    ctx.fillStyle = shade(STONE.trim, -0.08);
    ctx.fillRect(0, 30, W, H - 30);
    ctx.fillStyle = shade(STONE.trim, -0.22);
    for (let x = 0; x < W; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 40);
      ctx.quadraticCurveTo(x + 8, 30, x + 16, 40);
      ctx.stroke();
    }
  }, { key: 'flatiron-building:frieze' });
}

/** Balustrade: rail, plinth and vase-shaped balusters with dark gaps. */
export function balustradeTexture() {
  return canvasTexture(64, 48, (ctx, W, H) => {
    ctx.fillStyle = '#5c5241';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 16) {
      ctx.fillStyle = STONE.trim;
      ctx.beginPath();
      ctx.moveTo(x + 5, 10);
      ctx.lineTo(x + 11, 10);
      ctx.quadraticCurveTo(x + 15, 26, x + 11, 38);
      ctx.lineTo(x + 5, 38);
      ctx.quadraticCurveTo(x + 1, 26, x + 5, 10);
      ctx.fill();
      ctx.fillStyle = shade(STONE.trim, -0.2);
      ctx.fillRect(x + 9, 12, 2, 26);
    }
    ctx.fillStyle = STONE.trim;
    ctx.fillRect(0, 0, W, 10);
    ctx.fillRect(0, 38, W, 10);
    ctx.fillStyle = shade(STONE.trim, -0.2);
    ctx.fillRect(0, 9, W, 1);
  }, { key: 'flatiron-building:balustrade' });
}

/** Sidewalk clock face (Fifth Avenue style). */
export function clockTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = STONE.green;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d9b54a';
    ctx.beginPath();
    ctx.arc(32, 32, 29, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fbf6e8';
    ctx.beginPath();
    ctx.arc(32, 32, 25, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillRect(32 + Math.cos(a) * 21 - 1, 32 + Math.sin(a) * 21 - 1, 3, 3);
    }
    ctx.strokeStyle = '#222';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(32, 32);
    ctx.lineTo(32, 16);
    ctx.moveTo(32, 32);
    ctx.lineTo(43, 37);
    ctx.stroke();
  }, { key: 'flatiron-building:clock' });
}

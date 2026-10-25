import * as THREE from 'three';
import { PALETTE, FLOOR, canvasTexture, textured, shade, rng, boxGeometry, mat } from '../../src/lib/index.js';

// Precast-panel facades: one texture cell = one wall panel (one bay x one storey),
// with dark joints round every panel, so the grid of slabs reads like a real plattenbau.

const C = 64; // px per cell
const COLS = 4;
const ROWS = 4;

function joints(ctx, x0, y0, wall) {
  ctx.fillStyle = shade(wall, -0.32);
  ctx.fillRect(x0, y0 + C - 3, C, 3); // horizontal joint (bottom of the panel)
  ctx.fillRect(x0 + C - 2, y0, 2, C); // vertical joint
  ctx.fillStyle = shade(wall, 0.18);
  ctx.fillRect(x0, y0, C, 1);
}

function speckle(ctx, W, H, wall, r) {
  for (let i = 0; i < (W * H) / 30; i++) {
    ctx.globalAlpha = 0.05 + r() * 0.08;
    ctx.fillStyle = r() < 0.5 ? shade(wall, 0.25) : shade(wall, -0.25);
    ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), 2, 2);
  }
  ctx.globalAlpha = 1;
}

function pane(ctx, x, y, w, h, lit, r) {
  if (lit) {
    ctx.fillStyle = r() < 0.5 ? PALETTE.windowLit : shade(PALETTE.windowLit, 0.25);
    ctx.fillRect(x, y, w, h);
    return;
  }
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(PALETTE.window, 0.35));
  g.addColorStop(0.5, PALETTE.window);
  g.addColorStop(1, shade(PALETTE.window, -0.3));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  if (r() < 0.35) {
    // net curtain
    ctx.fillStyle = 'rgba(240,236,225,0.55)';
    ctx.fillRect(x, y, w, h * (0.3 + r() * 0.4));
  }
}

/**
 * kind: 'window' (flat window per panel), 'blank' (gable end), 'stair' (narrow
 * staircase slot, offset to the half-landing), 'base' (plinth / basement)
 */
export function panelTexture(kind, wall, seed = 1) {
  return canvasTexture(COLS * C, ROWS * C, (ctx, W, H) => {
    const r = rng(seed);
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, wall, r);
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const x0 = col * C;
        const y0 = row * C;
        // slight per-panel tone variation, like weathered precast slabs
        ctx.globalAlpha = 0.08;
        ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#000000';
        ctx.fillRect(x0, y0, C, C);
        ctx.globalAlpha = 1;
        if (kind === 'window') {
          const ww = C * 0.56;
          const wh = C * 0.46;
          const wx = x0 + (C - ww) / 2;
          const wy = y0 + C * 0.2;
          ctx.fillStyle = shade(wall, -0.2);
          ctx.fillRect(wx - 2, wy + wh + 2, ww + 4, 3); // sill
          ctx.fillStyle = '#f4f2ec';
          ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
          pane(ctx, wx, wy, ww, wh, r() < 0.12, r);
          ctx.fillStyle = '#f4f2ec';
          ctx.fillRect(wx + ww * 0.62, wy, 2, wh);
          ctx.fillRect(wx, wy + wh * 0.3, ww * 0.62, 2);
        } else if (kind === 'stair') {
          const ww = C * 0.3;
          const wh = C * 0.5;
          const wx = x0 + (C - ww) / 2;
          const wy = y0 + C * 0.5;
          ctx.fillStyle = '#f4f2ec';
          ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
          pane(ctx, wx, wy, ww, wh, r() < 0.3, r);
          ctx.fillStyle = '#f4f2ec';
          ctx.fillRect(wx, wy + wh / 2 - 1, ww, 2);
        } else if (kind === 'base') {
          // small basement vents
          ctx.fillStyle = shade(wall, -0.45);
          ctx.fillRect(x0 + C * 0.35, y0 + C * 0.35, C * 0.3, C * 0.22);
        }
        joints(ctx, x0, y0, wall);
      }
    }
  }, { key: `panel-housing-slab:panel:${kind}:${wall}:${seed}` });
}

export function panelMaterial(kind, wall, seed) {
  return textured(panelTexture(kind, wall, seed), { roughness: 0.9 });
}

/**
 * Box whose side faces map one texture cell to one panel (bay x floorHeight).
 * mats: { front, back, left, right, top } (front = +z). Base at y = 0.
 * Bays are rounded per face so panel joints always meet the corners.
 */
export function panelBox({ w, h, d, bay = 2.8, floorHeight = FLOOR, front, back, left, right, top }) {
  const geom = boxGeometry(w, h, d); // uvs in metres
  const uv = geom.attributes.uv;
  // BoxGeometry face order: +x, -x, +y, -y, +z, -z (4 verts each)
  const faceW = [d, d, w, w, w, w];
  for (const fi of [0, 1, 4, 5]) {
    const nb = Math.max(1, Math.round(faceW[fi] / bay));
    for (let i = fi * 4; i < fi * 4 + 4; i++) {
      uv.setXY(i, (uv.getX(i) / faceW[fi]) * nb / COLS, uv.getY(i) / floorHeight / ROWS);
    }
  }
  const t = top ?? mat(PALETTE.concreteDark);
  return new THREE.Mesh(geom, [right, left, t, t, front, back]);
}

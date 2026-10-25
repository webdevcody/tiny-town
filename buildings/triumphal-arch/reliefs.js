// Carved-stone canvas textures for the Triumphal Arch: relief panels, the
// sculpted frieze and the attic inscription. All are meant for geometry with
// 0..1 UVs (PlaneGeometry / BoxGeometry), not the lib's metre UVs.
import { PALETTE, canvasTexture, shade, rng } from '../../src/lib/index.js';

export const STONE = '#e6d9b8';
const RECESS = shade(STONE, -0.34);
const LIGHT = shade(STONE, 0.35);
const SHADOW = shade(STONE, -0.6);

// One robed figure, carved: a dark offset shadow, then a pale body on top.
function figure(ctx, x, y, s, r, { arm = 0, wings = false, spear = false } = {}) {
  const draw = (dx, dy, col) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    // wings behind the body
    if (wings) {
      ctx.beginPath();
      ctx.moveTo(x + dx, y + dy - s * 0.75);
      ctx.lineTo(x + dx - s * 0.55, y + dy - s * 1.15);
      ctx.lineTo(x + dx - s * 0.2, y + dy - s * 0.35);
      ctx.moveTo(x + dx, y + dy - s * 0.75);
      ctx.lineTo(x + dx + s * 0.55, y + dy - s * 1.15);
      ctx.lineTo(x + dx + s * 0.2, y + dy - s * 0.35);
      ctx.fill();
    }
    // robe
    ctx.beginPath();
    ctx.moveTo(x + dx - s * 0.12, y + dy - s * 0.78);
    ctx.lineTo(x + dx + s * 0.12, y + dy - s * 0.78);
    ctx.lineTo(x + dx + s * 0.24, y + dy);
    ctx.lineTo(x + dx - s * 0.24, y + dy);
    ctx.fill();
    // head
    ctx.beginPath();
    ctx.arc(x + dx, y + dy - s * 0.9, s * 0.11, 0, Math.PI * 2);
    ctx.fill();
    // raised arm
    ctx.lineWidth = Math.max(1.5, s * 0.07);
    ctx.beginPath();
    ctx.moveTo(x + dx, y + dy - s * 0.7);
    ctx.lineTo(x + dx + s * 0.35 * arm, y + dy - s * (0.95 + r * 0.2));
    ctx.stroke();
    if (spear) {
      ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(x + dx - s * 0.3, y + dy);
      ctx.lineTo(x + dx - s * 0.3, y + dy - s * 1.25);
      ctx.stroke();
    }
  };
  draw(s * 0.05, s * 0.04, SHADOW);
  draw(0, 0, LIGHT);
}

function horse(ctx, x, y, s, dir) {
  const draw = (dx, dy, col) => {
    ctx.fillStyle = col;
    ctx.strokeStyle = col;
    ctx.fillRect(x + dx - s * 0.35, y + dy - s * 0.55, s * 0.7, s * 0.22);
    ctx.lineWidth = Math.max(1.5, s * 0.08);
    ctx.beginPath();
    for (const lx of [-0.28, -0.18, 0.2, 0.3]) {
      ctx.moveTo(x + dx + s * lx, y + dy - s * 0.35);
      ctx.lineTo(x + dx + s * lx, y + dy);
    }
    // neck + head
    ctx.moveTo(x + dx + s * 0.3 * dir, y + dy - s * 0.5);
    ctx.lineTo(x + dx + s * 0.48 * dir, y + dy - s * 0.85);
    ctx.lineTo(x + dx + s * 0.62 * dir, y + dy - s * 0.72);
    ctx.stroke();
  };
  draw(s * 0.05, s * 0.04, SHADOW);
  draw(0, 0, LIGHT);
}

function frame(ctx, W, H, b) {
  ctx.fillStyle = LIGHT;
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = SHADOW;
  ctx.fillRect(b, b, W - 2 * b, H - 2 * b);
  ctx.fillStyle = RECESS;
  ctx.fillRect(b + 2, b + 2, W - 2 * b - 2, H - 2 * b - 2);
}

/** Tall high-relief sculpture group for the pier faces (variant 0..3). */
export function reliefPanel(variant) {
  return canvasTexture(128, 224, (ctx, W, H) => {
    const r = rng(17 + variant * 7);
    frame(ctx, W, H, 6);
    const base = H - 14;
    // a winged victory hovering over a group of warriors
    figure(ctx, W * 0.5, H * 0.42, 52, r(), { arm: variant % 2 ? -1 : 1, wings: true });
    figure(ctx, W * 0.24, base, 70, r(), { arm: 1, spear: true });
    figure(ctx, W * 0.52, base, 82, r(), { arm: variant % 2 ? 1 : -1 });
    figure(ctx, W * 0.8, base, 66, r(), { arm: -1, spear: variant > 1 });
    // ground line
    ctx.fillStyle = LIGHT;
    ctx.fillRect(6, base, W - 12, 4);
  }, { key: `triumphal-arch:relief:${variant}`, repeat: false });
}

/** Smaller oblong battle scene for above the side passages and upper piers. */
export function battlePanel(variant) {
  return canvasTexture(192, 112, (ctx, W, H) => {
    const r = rng(41 + variant * 5);
    frame(ctx, W, H, 5);
    const base = H - 10;
    horse(ctx, W * 0.3, base, 48, variant % 2 ? -1 : 1);
    figure(ctx, W * 0.3, base - 28, 36, r(), { arm: 1, spear: true });
    figure(ctx, W * 0.58, base, 60, r(), { arm: -1 });
    figure(ctx, W * 0.8, base, 54, r(), { arm: 1, spear: true });
    ctx.fillStyle = LIGHT;
    ctx.fillRect(5, base, W - 10, 3);
  }, { key: `triumphal-arch:battle:${variant}`, repeat: false });
}

/** Long frieze: a procession of figures and horses. */
export function frieze(width, key) {
  return canvasTexture(width, 48, (ctx, W, H) => {
    const r = rng(width);
    ctx.fillStyle = RECESS;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = LIGHT;
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
    for (let x = 14, i = 0; x < W - 10; i++) {
      if (i % 3 === 2) { horse(ctx, x + 10, H - 6, 34, 1); x += 36; }
      else { figure(ctx, x, H - 6, 34, r(), { arm: r() > 0.5 ? 1 : -1, spear: i % 4 === 0 }); x += 20; }
    }
  }, { key: `triumphal-arch:frieze:${key}`, repeat: false });
}

/** Carved attic inscription. */
export function inscription(line1, line2) {
  return canvasTexture(512, 160, (ctx, W, H) => {
    ctx.fillStyle = STONE;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = SHADOW;
    ctx.lineWidth = 4;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const carve = (text, size, y) => {
      ctx.font = `bold ${size}px serif`;
      ctx.fillStyle = LIGHT;
      ctx.fillText(text, W / 2 + 2, y + 2);
      ctx.fillStyle = shade(PALETTE.stoneDark, -0.35);
      ctx.fillText(text, W / 2, y);
    };
    carve(line1, 70, H * 0.42);
    carve(line2, 34, H * 0.78);
  }, { key: `triumphal-arch:inscription:${line1}:${line2}`, repeat: false });
}

/** Laurel wreath roundel on a stone square (attic ends). */
export function wreath() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = STONE;
    ctx.fillRect(0, 0, W, H);
    const cx = W / 2, cy = H / 2;
    ctx.fillStyle = RECESS;
    ctx.beginPath();
    ctx.arc(cx, cy, 52, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      for (const [col, o] of [[SHADOW, 2], [LIGHT, 0]]) {
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.ellipse(cx + Math.cos(a) * 38 + o, cy + Math.sin(a) * 38 + o, 10, 5, a + 0.9, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.fillStyle = LIGHT;
    ctx.font = 'bold 34px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TT', cx, cy + 2);
  }, { key: 'triumphal-arch:wreath', repeat: false });
}

// Procedural canvas textures (windows, facades, bricks, roofs, crops, signs…).
// Every texture is cached by its options, so calling a helper twice is cheap.
//
// Facade textures contain a grid of `cols x rows` window cells. The facade
// helpers in parts.js map one cell to one bay x one storey, so windows always
// line up with floors. Use them through facadeBlock()/facadeCylinder()/prismBlock()
// rather than applying them to arbitrary geometry.
//
// All helpers also work in Node (used by `npm run check`): when there is no DOM
// they return an empty THREE.Texture.

import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { rng } from './random.js';

const cache = new Map();
const hasDOM = typeof document !== 'undefined';

function cacheKey(name, opts) {
  return name + ':' + JSON.stringify(opts);
}

/**
 * Create (or fetch from cache) a CanvasTexture.
 *   canvasTexture(width, height, (ctx, w, h) => { ...draw... }, { key, repeat, nearest })
 * Use this instead of document.createElement('canvas') in your building so it
 * keeps working under `npm run check` (Node, no DOM). Pass a unique `key`
 * (e.g. 'my-slug:sign') to enable caching.
 */
export function canvasTexture(width, height, draw, { key = null, repeat = true, nearest = false } = {}) {
  if (key && cache.has(key)) return cache.get(key);
  let tex;
  if (!hasDOM) {
    tex = new THREE.Texture();
  } else {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    draw(ctx, width, height);
    tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    if (nearest) {
      tex.magFilter = THREE.NearestFilter;
    }
  }
  if (repeat) tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  if (key) cache.set(key, tex);
  return tex;
}

// ---------------------------------------------------------------------------
// colour utilities

/** Lighten (amt > 0) or darken (amt < 0) a CSS hex colour. amt in [-1, 1]. */
export function shade(hex, amt) {
  const c = new THREE.Color(hex);
  if (amt >= 0) c.lerp(new THREE.Color('#ffffff'), amt);
  else c.lerp(new THREE.Color('#000000'), -amt);
  return '#' + c.getHexString();
}

function speckle(ctx, w, h, color, r, count, alpha = 0.08, size = 2) {
  ctx.save();
  for (let i = 0; i < count; i++) {
    ctx.globalAlpha = alpha * (0.5 + r());
    ctx.fillStyle = r() < 0.5 ? shade(color, 0.25) : shade(color, -0.25);
    ctx.fillRect(Math.floor(r() * w), Math.floor(r() * h), size, size);
  }
  ctx.restore();
}

function glassPane(ctx, x, y, w, h, color, r, { lit = false, litColor = PALETTE.windowLit, blinds = 0 } = {}) {
  if (lit) {
    ctx.fillStyle = litColor;
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = shade(litColor, -0.15);
    ctx.fillRect(x, y + h * 0.75, w, h * 0.25);
    return;
  }
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(color, 0.35));
  g.addColorStop(0.45, color);
  g.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // diagonal sky reflection
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y, w, h);
  ctx.clip();
  ctx.globalAlpha = 0.18;
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(x + w * 0.15, y);
  ctx.lineTo(x + w * 0.45, y);
  ctx.lineTo(x + w * 0.05, y + h);
  ctx.lineTo(x - w * 0.25, y + h);
  ctx.fill();
  ctx.restore();
  if (blinds > 0) {
    ctx.fillStyle = shade(PALETTE.offWhite, -0.05);
    ctx.fillRect(x, y, w, h * blinds);
  }
}

// ---------------------------------------------------------------------------
// facades

/**
 * Facade texture made of `cols x rows` window cells (one cell = one bay x one storey).
 *
 * options:
 *   style     'punched' | 'ribbon' | 'curtain' | 'grid' | 'brick' | 'industrial' | 'shop' | 'plain'
 *   wall      wall colour            (default cream)
 *   glass     window glass colour    (default PALETTE.window)
 *   frame     window frame colour    (default PALETTE.frame)
 *   lit       fraction of lit windows 0..1 (default 0.12)
 *   windowW   window width as a fraction of the cell  (punched/brick, default 0.5)
 *   windowH   window height as a fraction of the cell (punched/brick, default 0.55)
 *   shutters  colour for window shutters (punched/brick) or null
 *   seed      variation seed
 *   cols, rows  cells in the texture (default 4 x 4)
 *
 * Returns a texture with tex.userData = { cols, rows }.
 */
export function facadeTexture(opts = {}) {
  const o = {
    style: 'punched',
    wall: PALETTE.cream,
    glass: PALETTE.window,
    frame: PALETTE.frame,
    lit: 0.12,
    windowW: 0.5,
    windowH: 0.55,
    shutters: null,
    seed: 7,
    cols: 4,
    rows: 4,
    ...opts,
  };
  const C = 64; // px per cell
  const tex = canvasTexture(o.cols * C, o.rows * C, (ctx, W, H) => drawFacade(ctx, W, H, C, o), {
    key: cacheKey('facade', o),
  });
  tex.userData = { cols: o.cols, rows: o.rows };
  return tex;
}

function drawFacade(ctx, W, H, C, o) {
  const r = rng(o.seed);
  const { style, wall, glass, frame } = o;

  // wall base
  if (style === 'brick') {
    drawBricks(ctx, W, H, wall, r, 8, 4);
  } else if (style === 'industrial') {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 4) {
      ctx.fillStyle = x % 8 === 0 ? shade(wall, 0.12) : shade(wall, -0.12);
      ctx.fillRect(x, 0, 2, H);
    }
  } else {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, H);
    speckle(ctx, W, H, wall, r, (W * H) / 40, 0.07);
  }

  for (let row = 0; row < o.rows; row++) {
    for (let col = 0; col < o.cols; col++) {
      const x0 = col * C;
      const y0 = row * C;
      const lit = r() < o.lit;
      const blinds = r() < 0.25 ? r() * 0.5 : 0;
      switch (style) {
        case 'curtain': {
          // floor-to-ceiling glass, thin mullions, slim spandrel
          glassPane(ctx, x0, y0, C, C, glass, r, { lit: lit && r() < 0.6, blinds: blinds * 0.6 });
          ctx.fillStyle = frame;
          ctx.fillRect(x0, y0, 2, C);
          ctx.fillRect(x0 + C / 2 - 1, y0, 1, C);
          ctx.fillStyle = shade(glass, -0.35);
          ctx.fillRect(x0, y0 + C - 7, C, 7);
          ctx.fillStyle = frame;
          ctx.fillRect(x0, y0 + C - 8, C, 1);
          break;
        }
        case 'ribbon': {
          // continuous horizontal glass band
          const top = y0 + C * 0.22;
          const h = C * 0.5;
          glassPane(ctx, x0, top, C, h, glass, r, { lit, blinds });
          ctx.fillStyle = frame;
          ctx.fillRect(x0, top, 2, h);
          ctx.fillRect(x0, top - 2, C, 2);
          ctx.fillStyle = shade(wall, -0.2);
          ctx.fillRect(x0, top + h, C, 2);
          break;
        }
        case 'grid': {
          // deep concrete frame with recessed windows
          const m = C * 0.16;
          ctx.fillStyle = shade(wall, -0.3);
          ctx.fillRect(x0 + m - 2, y0 + m - 2, C - 2 * m + 4, C - 2 * m + 4);
          glassPane(ctx, x0 + m, y0 + m, C - 2 * m, C - 2 * m, glass, r, { lit, blinds });
          ctx.fillStyle = frame;
          ctx.fillRect(x0 + C / 2 - 1, y0 + m, 2, C - 2 * m);
          break;
        }
        case 'industrial': {
          // high clerestory strip every other column on the top half
          if (col % 2 === 0) {
            glassPane(ctx, x0 + C * 0.1, y0 + C * 0.12, C * 0.8, C * 0.18, shade(glass, 0.2), r, { lit: false });
            ctx.fillStyle = shade(wall, -0.35);
            ctx.fillRect(x0 + C * 0.1, y0 + C * 0.3, C * 0.8, 2);
          }
          break;
        }
        case 'shop': {
          // big shop window with a door in the first column, sign band on top
          const band = C * 0.22;
          ctx.fillStyle = shade(wall, -0.15);
          ctx.fillRect(x0, y0, C, band);
          ctx.fillStyle = frame;
          ctx.fillRect(x0, y0 + band, C, 3);
          if (col % o.cols === 0) {
            ctx.fillStyle = shade(glass, -0.2);
            ctx.fillRect(x0 + C * 0.2, y0 + band + 6, C * 0.6, C - band - 6);
            ctx.fillStyle = frame;
            ctx.fillRect(x0 + C * 0.5 - 1, y0 + band + 6, 2, C - band - 6);
            ctx.fillStyle = PALETTE.yellow;
            ctx.fillRect(x0 + C * 0.42, y0 + band + C * 0.45, 3, 3);
          } else {
            glassPane(ctx, x0 + 3, y0 + band + 6, C - 6, C - band - 14, glass, r, { lit: true, litColor: shade(PALETTE.windowLit, 0.3) });
            ctx.fillStyle = frame;
            ctx.strokeStyle = frame;
            ctx.lineWidth = 2;
            ctx.strokeRect(x0 + 3, y0 + band + 6, C - 6, C - band - 14);
            ctx.fillStyle = shade(wall, -0.25);
            ctx.fillRect(x0, y0 + C - 8, C, 8);
            // goods silhouettes
            for (let i = 0; i < 3; i++) {
              ctx.fillStyle = r.pick([PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.purple]);
              const gh = 6 + r() * 10;
              ctx.fillRect(x0 + 8 + i * 16, y0 + C - 14 - gh, 10, gh);
            }
          }
          break;
        }
        case 'plain':
          break;
        case 'brick':
        case 'punched':
        default: {
          const ww = C * o.windowW;
          const wh = C * o.windowH;
          const wx = x0 + (C - ww) / 2;
          const wy = y0 + C * 0.18;
          // lintel + sill
          ctx.fillStyle = style === 'brick' ? shade(PALETTE.stone, 0.2) : shade(wall, -0.18);
          ctx.fillRect(wx - 3, wy - 4, ww + 6, 4);
          ctx.fillRect(wx - 3, wy + wh, ww + 6, 4);
          ctx.fillStyle = frame;
          ctx.fillRect(wx - 2, wy - 2, ww + 4, wh + 4);
          glassPane(ctx, wx, wy, ww, wh, glass, r, { lit, blinds });
          ctx.fillStyle = frame;
          ctx.fillRect(wx + ww / 2 - 1, wy, 2, wh);
          ctx.fillRect(wx, wy + wh * 0.45, ww, 2);
          if (o.shutters) {
            ctx.fillStyle = o.shutters;
            ctx.fillRect(wx - ww * 0.35 - 2, wy - 2, ww * 0.3, wh + 4);
            ctx.fillRect(wx + ww + 4, wy - 2, ww * 0.3, wh + 4);
          }
          break;
        }
      }
    }
  }
  // subtle floor lines (except curtain/shop)
  if (style === 'punched' || style === 'grid' || style === 'plain') {
    ctx.fillStyle = shade(wall, -0.12);
    for (let row = 0; row < o.rows; row++) ctx.fillRect(0, row * C + C - 2, W, 2);
  }
}

function drawBricks(ctx, W, H, color, r, bw = 8, bh = 4) {
  ctx.fillStyle = shade(color, 0.35); // mortar
  ctx.fillRect(0, 0, W, H);
  for (let y = 0, row = 0; y < H; y += bh, row++) {
    const off = row % 2 ? bw / 2 : 0;
    for (let x = -off; x < W; x += bw) {
      ctx.fillStyle = shade(color, (r() - 0.5) * 0.18);
      ctx.fillRect(x, y, bw - 1, bh - 1);
    }
  }
}

// ---------------------------------------------------------------------------
// surfaces

/**
 * Generic tiling surface texture. One repeat covers `size` metres when used via
 * the materials.surface() helper (default sizes noted below).
 *
 * kind:
 *   'brick'      brick wall                    (color = brick colour)
 *   'roofTiles'  clay roof tiles               (color = roof colour)
 *   'shingles'   staggered shingles / slate
 *   'corrugated' corrugated metal sheet, ribs run along V
 *   'planks'     wooden planks, run along U
 *   'paving'     square paving slabs
 *   'cobbles'    small irregular stones
 *   'grass'      grass with tufts
 *   'gravel'     gravel / ballast
 *   'asphalt'    asphalt with noise
 *   'concrete'   concrete slabs with joints
 *   'water'      water ripples
 *   'solar'      solar panel cells
 *   'stripes'    two-colour stripes (color, color2), runs along U
 *   'hazard'     yellow/black diagonal stripes
 */
export function surfaceTexture(kind, color, { color2 = PALETTE.white, seed = 3 } = {}) {
  const S = 128;
  return canvasTexture(S, S, (ctx, W, H) => drawSurface(ctx, W, H, kind, color, color2, rng(seed)), {
    key: cacheKey('surface', { kind, color, color2, seed }),
  });
}

function drawSurface(ctx, W, H, kind, color, color2, r) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, W, H);
  switch (kind) {
    case 'brick':
      drawBricks(ctx, W, H, color, r, 16, 8);
      break;
    case 'roofTiles': {
      const th = 16;
      for (let y = 0, row = 0; y < H; y += th, row++) {
        const off = row % 2 ? 8 : 0;
        for (let x = -off; x < W; x += 16) {
          const g = ctx.createLinearGradient(0, y, 0, y + th);
          const base = shade(color, (r() - 0.5) * 0.15);
          g.addColorStop(0, shade(base, -0.25));
          g.addColorStop(0.3, base);
          g.addColorStop(1, shade(base, 0.15));
          ctx.fillStyle = g;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x + 16, y);
          ctx.lineTo(x + 16, y + th - 3);
          ctx.quadraticCurveTo(x + 8, y + th + 2, x, y + th - 3);
          ctx.fill();
        }
      }
      break;
    }
    case 'shingles': {
      for (let y = 0, row = 0; y < H; y += 10, row++) {
        const off = row % 2 ? 10 : 0;
        for (let x = -off; x < W; x += 20) {
          ctx.fillStyle = shade(color, (r() - 0.5) * 0.2);
          ctx.fillRect(x + 1, y + 1, 18, 9);
        }
        ctx.fillStyle = shade(color, -0.3);
        ctx.fillRect(0, y, W, 1);
      }
      break;
    }
    case 'corrugated':
      for (let x = 0; x < W; x += 8) {
        const g = ctx.createLinearGradient(x, 0, x + 8, 0);
        g.addColorStop(0, shade(color, -0.18));
        g.addColorStop(0.5, shade(color, 0.18));
        g.addColorStop(1, shade(color, -0.18));
        ctx.fillStyle = g;
        ctx.fillRect(x, 0, 8, H);
      }
      break;
    case 'planks':
      for (let y = 0; y < H; y += 16) {
        ctx.fillStyle = shade(color, (r() - 0.5) * 0.2);
        ctx.fillRect(0, y, W, 15);
        ctx.fillStyle = shade(color, -0.35);
        ctx.fillRect(0, y + 15, W, 1);
        ctx.fillRect(Math.floor(r() * W), y, 1, 15);
      }
      break;
    case 'paving':
      speckle(ctx, W, H, color, r, 600, 0.1);
      ctx.fillStyle = shade(color, -0.2);
      for (let i = 0; i < W; i += 32) {
        ctx.fillRect(i, 0, 1, H);
        ctx.fillRect(0, i, W, 1);
      }
      break;
    case 'cobbles':
      for (let y = 0; y < H; y += 8) {
        for (let x = (y / 8) % 2 ? -4 : 0; x < W; x += 8) {
          ctx.fillStyle = shade(color, (r() - 0.5) * 0.3);
          ctx.fillRect(x + 1, y + 1, 6, 6);
        }
      }
      break;
    case 'grass':
      speckle(ctx, W, H, color, r, 1400, 0.25, 2);
      break;
    case 'gravel':
      speckle(ctx, W, H, color, r, 2500, 0.35, 2);
      break;
    case 'asphalt':
      speckle(ctx, W, H, color, r, 1500, 0.15, 1);
      break;
    case 'concrete':
      speckle(ctx, W, H, color, r, 900, 0.08, 2);
      ctx.fillStyle = shade(color, -0.15);
      ctx.fillRect(0, 0, W, 1);
      ctx.fillRect(0, 0, 1, H);
      ctx.fillRect(0, H / 2, W, 1);
      break;
    case 'water':
      for (let i = 0; i < 60; i++) {
        ctx.fillStyle = r() < 0.5 ? shade(color, 0.3) : shade(color, -0.15);
        ctx.globalAlpha = 0.5;
        ctx.fillRect(r() * W, r() * H, 6 + r() * 14, 1);
      }
      ctx.globalAlpha = 1;
      break;
    case 'solar':
      ctx.fillStyle = '#1d2c4a';
      ctx.fillRect(0, 0, W, H);
      for (let y = 0; y < H; y += 16) {
        for (let x = 0; x < W; x += 16) {
          const g = ctx.createLinearGradient(x, y, x + 16, y + 16);
          g.addColorStop(0, '#3a5c96');
          g.addColorStop(1, '#22365e');
          ctx.fillStyle = g;
          ctx.fillRect(x + 1, y + 1, 14, 14);
        }
      }
      break;
    case 'stripes':
      for (let x = 0; x < W; x += 32) {
        ctx.fillStyle = color2;
        ctx.fillRect(x + 16, 0, 16, H);
      }
      break;
    case 'hazard':
      ctx.fillStyle = PALETTE.yellow;
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = PALETTE.black;
      for (let i = -H; i < W; i += 32) {
        ctx.beginPath();
        ctx.moveTo(i, H);
        ctx.lineTo(i + 16, H);
        ctx.lineTo(i + 16 + H, 0);
        ctx.lineTo(i + H, 0);
        ctx.fill();
      }
      break;
    default:
      speckle(ctx, W, H, color, r, 800, 0.1);
  }
}

/**
 * Crop field texture: rows of plants on soil. One repeat = 8 rows.
 * crop: 'wheat' | 'corn' | 'cabbage' | 'vineyard' | 'sunflower' | 'plowed' | 'orchard' | 'flowers'
 */
export function fieldTexture(crop = 'wheat', { seed = 5 } = {}) {
  return canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(seed);
    const soil = crop === 'plowed' ? PALETTE.mud : PALETTE.dirt;
    ctx.fillStyle = soil;
    ctx.fillRect(0, 0, W, H);
    const rows = 8;
    const rh = H / rows;
    for (let i = 0; i < rows; i++) {
      const y = i * rh;
      if (crop === 'plowed') {
        ctx.fillStyle = shade(soil, -0.25);
        ctx.fillRect(0, y + rh * 0.6, W, rh * 0.25);
        continue;
      }
      if (crop === 'wheat') {
        ctx.fillStyle = PALETTE.wheat;
        ctx.fillRect(0, y, W, rh * 0.85);
        speckle(ctx, W, rh, PALETTE.wheat, r, 200, 0.4, 1);
        continue;
      }
      const plant = {
        corn: PALETTE.foliageLight,
        cabbage: '#8fc06a',
        vineyard: PALETTE.foliageDark,
        sunflower: PALETTE.foliage,
        orchard: PALETTE.foliage,
        flowers: PALETTE.foliageLight,
      }[crop] || PALETTE.foliage;
      const step = crop === 'cabbage' ? 12 : 6;
      for (let x = 0; x < W; x += step) {
        ctx.fillStyle = shade(plant, (r() - 0.5) * 0.3);
        if (crop === 'cabbage') {
          ctx.beginPath();
          ctx.arc(x + 6, y + rh / 2, 5, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(x, y + rh * 0.15, step - 1, rh * 0.6);
        }
        if (crop === 'sunflower' && r() < 0.7) {
          ctx.fillStyle = PALETTE.yellow;
          ctx.fillRect(x + 1, y + rh * 0.2, 3, 3);
        }
        if (crop === 'flowers') {
          ctx.fillStyle = [PALETTE.red, PALETTE.yellow, PALETTE.purple, PALETTE.pink, '#ffffff'][i % 5];
          ctx.fillRect(x + 1, y + rh * 0.25, 3, 3);
        }
      }
    }
  }, { key: cacheKey('field', { crop, seed }) });
}

/**
 * Sign / billboard texture with centred text.
 *   signTexture('HOTEL', { bg, fg, font, width, height, border })
 */
export function signTexture(text, { bg = PALETTE.navy, fg = '#ffffff', font = 'bold', width = 256, height = 64, border = null } = {}) {
  return canvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.max(2, H * 0.06);
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    }
    ctx.fillStyle = fg;
    let size = H * 0.62;
    ctx.font = `${font} ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.9 && size > 6) {
      size -= 1;
      ctx.font = `${font} ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + H * 0.03);
  }, { key: cacheKey('sign', { text, bg, fg, font, width, height, border }), repeat: false });
}

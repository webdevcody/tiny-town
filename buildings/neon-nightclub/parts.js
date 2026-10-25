import * as THREE from 'three';
import { canvasTexture, textured, mat, box, sphere, cylinder, place, group, pipe, rng } from '../../src/lib/index.js';

// Box with 0..1 UVs per face (the lib's box() uses metre UVs, which shrinks sign textures).
export function uvBox(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

// Neon lettering on a black panel: glowing strokes via shadowBlur, used as map + emissiveMap.
export function neonTexture(key, text, { color = '#ff3fb4', glow = '#ff86d6', bg = '#0d0b14', width = 512, height = 160, vertical = false, font = 'bold', border = null } = {}) {
  return canvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const drawGlow = (fn) => {
      ctx.shadowColor = glow;
      for (const blur of [H * 0.12, H * 0.05, 0]) {
        ctx.shadowBlur = vertical ? W * 0.15 * (blur / (H * 0.12) || 0) : blur;
        fn();
      }
      ctx.shadowBlur = 0;
    };
    if (border) {
      const lw = Math.max(4, Math.min(W, H) * 0.05);
      ctx.strokeStyle = border;
      ctx.lineWidth = lw;
      drawGlow(() => ctx.strokeRect(lw * 1.5, lw * 1.5, W - lw * 3, H - lw * 3));
    }
    ctx.fillStyle = color;
    if (vertical) {
      const n = text.length;
      const step = (H * 0.9) / n;
      const size = Math.min(step * 0.85, W * 0.75);
      ctx.font = `${font} ${size}px sans-serif`;
      drawGlow(() => {
        for (let i = 0; i < n; i++) ctx.fillText(text[i], W / 2, H * 0.05 + step * (i + 0.5));
      });
    } else {
      let size = H * 0.62;
      ctx.font = `${font} ${size}px sans-serif`;
      while (ctx.measureText(text).width > W * 0.84 && size > 6) {
        size -= 1;
        ctx.font = `${font} ${size}px sans-serif`;
      }
      drawGlow(() => ctx.fillText(text, W / 2, H / 2 + H * 0.03));
      // white-hot core
      ctx.fillStyle = '#fff4fb';
      ctx.globalAlpha = 0.45;
      ctx.fillText(text, W / 2, H / 2 + H * 0.03);
      ctx.globalAlpha = 1;
    }
  }, { key, repeat: false });
}

export function glowMat(tex, intensity = 1.2) {
  return textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: intensity, roughness: 0.5 });
}

// Mirror-tile texture for the disco ball (sphere UVs are 0..1).
export function mirrorTexture() {
  return canvasTexture(256, 128, (ctx, W, H) => {
    const r = rng(77);
    const cols = 32, rows = 16;
    const cw = W / cols, ch = H / rows;
    ctx.fillStyle = '#2a2a33';
    ctx.fillRect(0, 0, W, H);
    for (let j = 0; j < rows; j++) {
      for (let i = 0; i < cols; i++) {
        const v = r();
        let c;
        if (v > 0.93) c = '#ffffff';
        else if (v > 0.86) c = r.pick(['#ff9be0', '#9be8ff', '#d3a8ff']);
        else c = `hsl(220, 10%, ${Math.round(r.range(48, 86))}%)`;
        ctx.fillStyle = c;
        ctx.fillRect(i * cw + 0.8, j * ch + 0.8, cw - 1.6, ch - 1.6);
      }
    }
  }, { key: 'neon-nightclub:mirror', repeat: false });
}

const SKIN = ['#f0c8a0', '#c98d63', '#8a5a3a', '#e8b48a', '#6b4430'];
const OUTFIT = ['#e0218a', '#7a2bd6', '#22c3e6', '#f2e14b', '#ffffff', '#ff5a3c', '#2ad17a', '#c0c0c8'];

// Tiny standing person, ~1.75 m, facing +z.
export function person(seed, { outfit, legs = '#1d1d26' } = {}) {
  const r = rng(seed);
  const top = outfit ?? r.pick(OUTFIT);
  const g = group(
    place(box(0.13, 0.82, 0.18, mat(legs)), { x: -0.09 }),
    place(box(0.13, 0.82, 0.18, mat(legs)), { x: 0.09 }),
    place(box(0.44, 0.62, 0.26, mat(top)), { y: 0.82 }),
    place(box(0.1, 0.55, 0.14, mat(top)), { x: -0.27, y: 0.86 }),
    place(box(0.1, 0.55, 0.14, mat(top)), { x: 0.27, y: 0.86 }),
    place(sphere(0.15, mat(r.pick(SKIN)), 8), { y: 1.44 }),
  );
  if (r.chance(0.5)) g.add(place(box(0.32, 0.12, 0.32, mat(r.pick(['#1a1a1a', '#5a3a22', '#e8d36a', '#d23a7a']))), { y: 1.62 }));
  return g;
}

// Brass stanchion post.
export function stanchion(brass) {
  return group(
    cylinder(0.16, 0.18, 0.05, brass, 10),
    cylinder(0.035, 0.035, 0.95, brass, 6),
    place(sphere(0.07, brass, 8), { y: 0.92 }),
  );
}

// Sagging rope between two post tops.
export function rope(a, b, sag, material) {
  const mid = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2 - sag, (a[2] + b[2]) / 2];
  const q1 = [(a[0] + mid[0]) / 2, (a[1] + mid[1]) / 2 - sag * 0.25, (a[2] + mid[2]) / 2];
  const q2 = [(b[0] + mid[0]) / 2, (b[1] + mid[1]) / 2 - sag * 0.25, (b[2] + mid[2]) / 2];
  return group(pipe(a, q1, 0.045, material), pipe(q1, mid, 0.045, material), pipe(mid, q2, 0.045, material), pipe(q2, b, 0.045, material));
}


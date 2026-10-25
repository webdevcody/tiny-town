import * as THREE from 'three';
import { PALETTE, canvasTexture, textured, mat, box, place, group, sphere, beam } from '../../src/lib/index.js';

// Local helpers for the bowling alley. The lib's sign() puts a clamped texture
// on box() (UVs in metres), so big signs here use BoxGeometry's 0..1 UVs.

/** Box with base at y = 0 and 0..1 UVs on every face; `front` textures +z (and -z if `double`). */
export function panel(w, h, d, front, side, { double = false } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, front, double ? front : side]);
}

/** Glowing material from a canvas texture. */
export function glowing(tex, intensity = 0.9) {
  return textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: intensity, roughness: 0.5 });
}

function neonText(ctx, text, x, y, size, color, { font = 'italic 900', glow = 0.35 } = {}) {
  ctx.font = `${font} ${size}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.shadowColor = color;
  ctx.shadowBlur = size * glow;
  ctx.strokeStyle = color;
  ctx.lineWidth = size * 0.16;
  ctx.strokeText(text, x, y);
  ctx.shadowBlur = size * glow * 0.5;
  ctx.fillStyle = '#fff6fb';
  ctx.fillText(text, x, y);
  ctx.shadowBlur = 0;
}

/** Wide neon script sign: dark panel, glowing text with a tube border. */
export function neonSignTexture(key, text, { width = 1024, height = 160, color = '#ff4fa8', bg = '#1d2340', border = '#4ff3ff', size } = {}) {
  return canvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const lw = H * 0.05;
    ctx.shadowColor = border;
    ctx.shadowBlur = lw * 3;
    ctx.strokeStyle = border;
    ctx.lineWidth = lw;
    ctx.strokeRect(lw * 1.5, lw * 1.5, W - lw * 3, H - lw * 3);
    ctx.shadowBlur = 0;
    let s = size ?? H * 0.66;
    ctx.font = `italic 900 ${s}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.86 && s > 8) {
      s -= 2;
      ctx.font = `italic 900 ${s}px sans-serif`;
    }
    neonText(ctx, text, W / 2, H / 2 + H * 0.04, s, color);
  }, { key: 'bowling-alley:' + key, repeat: false });
}

/** Tall pylon face with letters stacked vertically. */
export function verticalSignTexture(key, letters, { width = 160, height = 640, color = '#ffd23f', bg = '#d2452e', dot = '#fff2c0' } = {}) {
  return canvasTexture(width, height, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    // chaser bulbs along both edges
    ctx.fillStyle = dot;
    ctx.shadowColor = dot;
    ctx.shadowBlur = 8;
    for (let y = 14; y < H; y += 26) {
      ctx.beginPath(); ctx.arc(12, y, 6, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 12, y, 6, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowBlur = 0;
    const slot = H / letters.length;
    for (let i = 0; i < letters.length; i++) {
      neonText(ctx, letters[i], W / 2, slot * (i + 0.54), Math.min(slot * 0.82, W * 0.8), color, { font: '900', glow: 0.25 });
    }
  }, { key: 'bowling-alley:' + key, repeat: false });
}

/** Lanes seen through the glass: maple lanes, gutters and pins at the far end. */
export function lanesTexture() {
  return canvasTexture(512, 256, (ctx, W, H) => {
    ctx.fillStyle = '#3a2340';
    ctx.fillRect(0, 0, W, H);
    // back wall mural strip
    ctx.fillStyle = '#ff5fa8';
    ctx.fillRect(0, H * 0.12, W, H * 0.06);
    ctx.fillStyle = '#4ff3ff';
    ctx.fillRect(0, H * 0.2, W, H * 0.04);
    const lanes = 6, lw = W / lanes;
    for (let i = 0; i < lanes; i++) {
      const x = i * lw;
      ctx.fillStyle = '#2a2a30';
      ctx.fillRect(x, H * 0.45, lw, H * 0.55);
      ctx.fillStyle = '#e2b46c';
      ctx.fillRect(x + lw * 0.12, H * 0.45, lw * 0.76, H * 0.55);
      ctx.fillStyle = '#c99550';
      for (let k = 1; k < 6; k++) ctx.fillRect(x + lw * 0.12 + k * lw * 0.127, H * 0.45, 1.5, H * 0.55);
      // pin deck: lit, ten white pins
      ctx.fillStyle = '#fff3d0';
      ctx.fillRect(x + lw * 0.1, H * 0.3, lw * 0.8, H * 0.15);
      ctx.fillStyle = '#ffffff';
      for (let p = 0; p < 4; p++) {
        ctx.fillRect(x + lw * (0.22 + p * 0.17), H * 0.33, lw * 0.07, H * 0.1);
        ctx.fillStyle = '#d0332b';
        ctx.fillRect(x + lw * (0.22 + p * 0.17), H * 0.355, lw * 0.07, H * 0.012);
        ctx.fillStyle = '#ffffff';
      }
      // lane number
      ctx.fillStyle = '#4ff3ff';
      ctx.font = `900 ${H * 0.08}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText(String(i + 1), x + lw / 2, H * 0.28);
    }
  }, { key: 'bowling-alley:lanes', repeat: false });
}

/** Bowling pin silhouette as [radius, y] pairs for a pin of height h. */
function pinProfile(h, steps = 22) {
  // radius as a fraction of h, keyed by height fraction
  const keys = [[0, 0.1], [0.06, 0.135], [0.2, 0.175], [0.34, 0.18], [0.5, 0.135], [0.62, 0.075], [0.7, 0.068], [0.8, 0.095], [0.88, 0.098], [0.95, 0.07], [0.99, 0.03], [1, 0]];
  const at = (t) => {
    for (let i = 1; i < keys.length; i++) {
      if (t <= keys[i][0]) {
        const [t0, r0] = keys[i - 1], [t1, r1] = keys[i];
        const k = (t - t0) / (t1 - t0);
        const s = k * k * (3 - 2 * k);
        return r0 + (r1 - r0) * s;
      }
    }
    return 0;
  };
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    pts.push([at(t) * h, t * h]);
  }
  return { pts, at };
}

/** Giant white bowling pin with two red neck stripes. Base at y = 0. */
export function bowlingPin(h = 4, { color = PALETTE.white, stripe = PALETTE.red, segments = 16 } = {}) {
  const { pts, at } = pinProfile(h);
  const body = new THREE.Mesh(
    new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), segments),
    mat(color, { roughness: 0.35, flatShading: false })
  );
  const g = group(body);
  for (const [t0, t1] of [[0.6, 0.635], [0.67, 0.705]]) {
    const ring = [];
    for (let i = 0; i <= 3; i++) {
      const t = t0 + ((t1 - t0) * i) / 3;
      ring.push(new THREE.Vector2(at(t) * h * 1.04, t * h));
    }
    g.add(new THREE.Mesh(new THREE.LatheGeometry(ring, segments), mat(stripe, { emissive: stripe, emissiveIntensity: 0.25 })));
  }
  return g;
}

/** Bowling ball with three finger holes facing +z. Base at y = 0. */
export function bowlingBall(r = 0.8, color = '#2a3a9a') {
  const g = group(sphere(r, mat(color, { roughness: 0.25, metalness: 0.2 }), 14));
  const hole = mat(PALETTE.black);
  for (const [x, y] of [[-0.22, 0.25], [0.22, 0.25], [0, -0.12]]) {
    g.add(place(sphere(r * 0.13, hole, 6), { x: x * r, y: r + y * r - r * 0.13, z: r * 0.93 }));
  }
  return g;
}

/** Googie "atomic" starburst: spikes radiating in the XY plane around a ball. */
export function starburst(r = 1, { color = PALETTE.yellow, n = 12, t = 0.08, glow = 0.4 } = {}) {
  const m = mat(color, { emissive: color, emissiveIntensity: glow, roughness: 0.4 });
  const g = group(place(sphere(r * 0.18, m, 8), { y: -r * 0.18 }));
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const len = i % 2 ? r * 0.65 : r;
    g.add(beam([0, 0, 0], [Math.cos(a) * len, Math.sin(a) * len, 0], t, m));
  }
  return g;
}

/**
 * Prism from a 2-D profile in the (z, y) plane, extruded along X from -w/2 to w/2.
 * caps = material for the two end faces (±x), sides = everything else.
 */
export function profileExtrude(profile, w, caps, sides) {
  // Shape x' = -z so that after rotating +90° about Y, x' maps back to world z.
  const shape = new THREE.Shape(profile.map(([z, y]) => new THREE.Vector2(-z, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false, curveSegments: 1 });
  geo.rotateY(Math.PI / 2);
  geo.translate(-w / 2, 0, 0);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, [caps, sides]);
}

export { box };

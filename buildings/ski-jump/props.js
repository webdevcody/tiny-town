import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, place, group, mat, metal, emissive, textured, signTexture, canvasTexture,
} from '../../src/lib/index.js';

export const SNOW = '#eef3f8';
export const SNOW_SHADE = '#dbe4ee';

/**
 * Quad (or triangle, if two corners coincide) facing `out`: the winding and
 * UVs are flipped when needed so callers don't have to think about it.
 */
export function face(b, pts, out, groupIndex = 0, uvs = null) {
  const keep = pts.map((p, i) => i).filter((i) => {
    const q = pts[(i + pts.length - 1) % pts.length];
    return Math.hypot(pts[i][0] - q[0], pts[i][1] - q[1], pts[i][2] - q[2]) > 1e-6;
  });
  if (keep.length < 3) return;
  pts = keep.map((i) => pts[i]);
  if (uvs) uvs = keep.map((i) => uvs[i]);
  // Newell normal (robust for any planar polygon)
  const n = [0, 0, 0];
  for (let i = 0; i < pts.length; i++) {
    const [x1, y1, z1] = pts[i];
    const [x2, y2, z2] = pts[(i + 1) % pts.length];
    n[0] += (y1 - y2) * (z1 + z2);
    n[1] += (z1 - z2) * (x1 + x2);
    n[2] += (x1 - x2) * (y1 + y2);
  }
  if (n[0] * out[0] + n[1] * out[1] + n[2] * out[2] < 0) {
    pts = pts.slice().reverse();
    if (uvs) uvs = uvs.slice().reverse();
  }
  if (pts.length === 3) {
    if (uvs) b.quadUV(pts[0], pts[1], pts[2], pts[2], [...uvs, uvs[2]], groupIndex);
    else b.tri(pts[0], pts[1], pts[2], groupIndex);
  } else if (uvs) b.quadUV(pts[0], pts[1], pts[2], pts[3], uvs, groupIndex);
  else b.quad(pts[0], pts[1], pts[2], pts[3], groupIndex);
}

/** Linear interpolation of y along a [[z, y]...] profile (z ascending). */
export function profileY(prof, z) {
  if (z <= prof[0][0]) return prof[0][1];
  for (let i = 1; i < prof.length; i++) {
    const [z1, y1] = prof[i];
    if (z <= z1) {
      const [z0, y0] = prof[i - 1];
      return y0 + ((y1 - y0) * (z - z0)) / (z1 - z0);
    }
  }
  return prof[prof.length - 1][1];
}

/**
 * Sign with 0..1 UVs (lib sign() shrinks text on faces over 1 m).
 * Text faces +z (and -z when double).
 */
export function board(text, { w, h, d = 0.12, bg = PALETTE.navy, fg = '#ffffff', double = false, border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const front = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, front, double ? front : side]);
}

/** Snow-laden fir: stacked green cones with white caps. */
export function snowyFir(h = 5) {
  const g = group(cylinder(0.12, 0.16, h * 0.2, mat(PALETTE.trunk), 6));
  const green = mat(PALETTE.foliageDark);
  const white = mat(SNOW);
  const tiers = [[0.15, 0.32, 0.5], [0.4, 0.26, 0.42], [0.62, 0.19, 0.38]];
  for (const [y, r, th] of tiers) {
    g.add(place(cone(r * h, th * h, green, 8), { y: y * h }));
    g.add(place(cone(r * h * 0.62, th * h * 0.5, white, 8), { y: y * h + th * h * 0.52 }));
  }
  return g;
}

/** Little person; body colour from the crowd swatch. ~1 m tall (tiny-town scale). */
export function person(color, seated = false) {
  const bh = seated ? 0.45 : 0.65;
  return group(
    box(0.32, bh, 0.24, mat(color)),
    place(box(0.2, 0.22, 0.2, mat('#e9c4a0')), { y: bh }),
    place(box(0.22, 0.08, 0.22, mat(color === PALETTE.red ? PALETTE.white : PALETTE.red)), { y: bh + 0.2 }),
  );
}

/** Piste groomer (snowcat), length along X, blade at +x. */
export function snowcat() {
  const red = mat(PALETTE.red, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  return group(
    place(box(2.4, 0.55, 0.42, dark), { y: 0, z: 0.58 }),
    place(box(2.4, 0.55, 0.42, dark), { y: 0, z: -0.58 }),
    place(box(2.0, 0.6, 1.3, red), { x: -0.1, y: 0.45 }),
    place(box(1.05, 0.75, 1.2, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { x: 0.25, y: 1.05 }),
    place(box(1.15, 0.1, 1.3, red), { x: 0.25, y: 1.8 }),
    place(box(0.4, 0.12, 0.25, emissive('#ffd36b', 0.8)), { x: 0.6, y: 1.9 }),
    place(box(0.18, 0.6, 1.9, mat(PALETTE.lightGrey)), { x: 1.35, y: 0.05 }),
    place(box(0.5, 0.35, 1.0, mat(PALETTE.steelDark)), { x: -1.25, y: 0.15 }),
  );
}

/** Floodlight mast: pole with a lamp bank facing +x. */
export function floodlight(h = 11) {
  const m = metal(PALETTE.steelLight);
  const g = group(cylinder(0.1, 0.16, h, m, 8));
  g.add(place(box(0.25, 1.1, 1.6, metal(PALETTE.steelDark)), { x: 0.1, y: h - 0.6 }));
  for (const y of [h - 0.45, h + 0.05]) {
    for (const z of [-0.5, 0, 0.5]) {
      g.add(place(box(0.08, 0.35, 0.4, emissive('#fff6d8', 1.1)), { x: 0.26, y, z }));
    }
  }
  return g;
}

/** Repeating banner text texture for the inrun walls. */
export function bannerTexture() {
  return canvasTexture(1024, 96, (ctx, W, H) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(0, 0, W, H * 0.12);
    ctx.fillRect(0, H * 0.88, W, H * 0.12);
    ctx.fillStyle = PALETTE.navy;
    ctx.font = `bold ${Math.round(H * 0.56)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TINY TOWN', W * 0.27, H * 0.52);
    ctx.fillStyle = PALETTE.red;
    ctx.fillText('SKI JUMP', W * 0.75, H * 0.52);
  }, { key: 'ski-jump:banner', repeat: false });
}

/** Inrun track: snow with two icy ski grooves running along v. */
export function trackTexture() {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = '#f6f9fc';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b8cbe0';
    ctx.fillRect(0, 0, W * 0.08, H);
    ctx.fillRect(W * 0.92, 0, W * 0.08, H);
    ctx.fillStyle = '#6f8fb8';
    for (const u of [0.3, 0.42, 0.58, 0.7]) ctx.fillRect(W * u - 3, 0, 6, H);
  }, { key: 'ski-jump:track' });
}

/**
 * Landing slope markings along v (0 = top of the knoll, 1 = end of outrun).
 * marks: [{ v, color, thick }]
 */
export function laneTexture(marks) {
  return canvasTexture(128, 1024, (ctx, W, H) => {
    ctx.fillStyle = '#f7fafd';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e6eef6';
    for (let x = 6; x < W; x += 12) ctx.fillRect(x, 0, 3, H);
    // spruce-branch edge markings
    ctx.fillStyle = PALETTE.foliageDark;
    for (let y = 0; y < H; y += 10) {
      ctx.fillRect(0, y, W * 0.07, 6);
      ctx.fillRect(W * 0.93, y, W * 0.07, 6);
    }
    for (const { v, color, thick = 6 } of marks) {
      ctx.fillStyle = color;
      ctx.fillRect(W * 0.07, H * (1 - v) - thick / 2, W * 0.86, thick);
    }
  }, { key: 'ski-jump:lane', repeat: false });
}

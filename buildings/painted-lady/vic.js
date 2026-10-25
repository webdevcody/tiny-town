// Local helpers for the Victorian Painted Lady: clapboard siding textures with
// trimmed sash windows, fish-scale shingles, and clad blocks/prisms whose UVs
// map one texture cell to one window bay x one storey.
import * as THREE from 'three';
import { canvasTexture, shade, textured, boxGeometry, extrudeGeometry, place, box, group, mat } from '../../src/lib/index.js';

const CW = 64, CH = 112; // one cell = one bay x one storey

function siding(ctx, W, H, wall) {
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, H);
  for (let y = 0; y < H; y += 7) {
    ctx.fillStyle = shade(wall, 0.1);
    ctx.fillRect(0, y, W, 1);
    ctx.fillStyle = shade(wall, -0.14);
    ctx.fillRect(0, y + 6, W, 1);
  }
}

function sash(ctx, x, y, w, h, glassColor, trim) {
  const g = ctx.createLinearGradient(x, y, x + w, y + h);
  g.addColorStop(0, shade(glassColor, 0.35));
  g.addColorStop(0.5, glassColor);
  g.addColorStop(1, shade(glassColor, -0.3));
  ctx.fillStyle = g;
  ctx.fillRect(x, y, w, h);
  // lace curtains at the top corners
  ctx.fillStyle = 'rgba(255,250,240,0.55)';
  ctx.fillRect(x, y, w * 0.28, h * 0.45);
  ctx.fillRect(x + w * 0.72, y, w * 0.28, h * 0.45);
  ctx.fillStyle = trim;
  ctx.fillRect(x, y + h * 0.48, w, 3); // meeting rail
  ctx.fillRect(x + w / 2 - 1, y, 2, h); // muntin
}

/** Siding cell with one tall trimmed sash window (hood in `accent`). */
export function windowTexture({ wall, trim, accent, glass, key }) {
  return canvasTexture(CW, CH, (ctx, W, H) => {
    siding(ctx, W, H, wall);
    // trim surround
    ctx.fillStyle = trim;
    ctx.fillRect(13, 28, 38, 74);
    // hood: cornice + pediment
    ctx.fillStyle = accent;
    ctx.fillRect(9, 17, 46, 9);
    ctx.beginPath();
    ctx.moveTo(9, 17);
    ctx.lineTo(32, 6);
    ctx.lineTo(55, 17);
    ctx.fill();
    ctx.fillStyle = trim;
    ctx.fillRect(9, 25, 46, 3);
    ctx.fillRect(17, 12, 30, 2);
    // sill + brackets
    ctx.fillRect(9, 100, 46, 5);
    ctx.fillStyle = accent;
    ctx.fillRect(16, 105, 5, 4);
    ctx.fillRect(43, 105, 5, 4);
    sash(ctx, 17, 32, 30, 66, glass, trim);
  }, { key: 'painted-lady:win:' + key });
}

/** Siding-only cell (same scale as windowTexture). */
export function sidingTexture(wall, key) {
  return canvasTexture(CW, CH, (ctx, W, H) => siding(ctx, W, H, wall), { key: 'painted-lady:siding:' + key });
}

/** Fish-scale shingles; one repeat = `size` metres (UVs in metres). */
export function fishScale(color, size = 0.6) {
  const key = 'painted-lady:scales:' + color + size;
  const tex = canvasTexture(32, 32, (ctx, W, H) => {
    ctx.fillStyle = shade(color, -0.45);
    ctx.fillRect(0, 0, W, H);
    for (let k = 4; k >= -1; k--) {
      const off = (k & 1) * 8;
      for (let cx = -16; cx <= 48; cx += 16) {
        ctx.beginPath();
        ctx.arc(cx + off, k * 8, 7.5, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = shade(color, -0.4);
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    }
  }, { key });
  tex.repeat.set(1 / size, 1 / size);
  return textured(tex);
}

/** Box (base at y=0) clad with cell materials; mats = [+x, -x, top, bottom, +z, -z]. */
export function cladBox(w, h, d, floors, bay, mats) {
  const geom = boxGeometry(w, h, d);
  const uv = geom.attributes.uv;
  const faceW = [d, d, w, w, w, w];
  for (let i = 0; i < uv.count; i++) {
    const f = Math.floor(i / 4);
    if (f === 2 || f === 3) continue;
    const nb = Math.max(1, Math.round(faceW[f] / bay));
    uv.setXY(i, (uv.getX(i) / faceW[f]) * nb, (uv.getY(i) / h) * floors);
  }
  return new THREE.Mesh(geom, mats);
}

/** Polygon prism clad with one cell material on the walls. */
export function cladPrism(points, h, floors, bay, wallMat, topMat) {
  const geom = extrudeGeometry(points, h, { wallUV: (len) => [Math.max(1, Math.round(len / bay)), floors] });
  return new THREE.Mesh(geom, [wallMat, topMat, topMat]);
}

/** Regular octagon footprint with axis-aligned faces. */
export function octagon(r, cx = 0, cz = 0) {
  const pts = [];
  for (let k = 0; k < 8; k++) {
    const a = ((22.5 + k * 45) * Math.PI) / 180;
    pts.push([cx + r * Math.cos(a), cz + r * Math.sin(a)]);
  }
  return pts;
}

/** Outward offset of a convex polygon by moving vertices away from its centroid (good enough for trim bands). */
export function grow(points, by) {
  const cx = points.reduce((s, p) => s + p[0], 0) / points.length;
  const cz = points.reduce((s, p) => s + p[1], 0) / points.length;
  return points.map(([x, z]) => {
    const dx = x - cx, dz = z - cz, l = Math.hypot(dx, dz) || 1;
    return [x + (dx / l) * by, z + (dz / l) * by];
  });
}

/** 3D sash window facing +z: trim frame, glass, pediment hood and sill. */
export function sashWindow({ w = 0.8, h = 1.6, trim, accent, glass }) {
  const t = mat(trim), a = mat(accent);
  return group(
    place(box(w + 0.3, h + 0.3, 0.08, t), { y: -0.15, z: 0.04 }),
    place(box(w, h, 0.1, mat(glass, { roughness: 0.25, metalness: 0.35 })), { z: 0.05 }),
    place(box(0.06, h, 0.13, t), { z: 0.06 }),
    place(box(w, 0.07, 0.13, t), { y: h * 0.5, z: 0.06 }),
    place(box(w + 0.55, 0.25, 0.22, a), { y: h + 0.15, z: 0.11 }),
    place(box(w + 0.65, 0.07, 0.28, t), { y: h + 0.4, z: 0.14 }),
    place(box(w + 0.45, 0.1, 0.24, t), { y: -0.3, z: 0.12 })
  );
}

// Half-timbered (black-and-white) wall materials and parts for the Tudor manor.
// Each texture is one bay x one storey (2 m x 3 m at 128 px/m). Walls are built
// with lib boxGeometry (UVs in metres) and every face gets a bay width that
// divides its length exactly, so leaded windows never get cut at a corner.

import * as THREE from 'three';
import { canvasTexture, textured, boxGeometry, mat, beam, group, place, box } from '../../src/lib/index.js';

export const PLASTER = '#f3efe2';
export const OAK = '#2a2320';
const GLASS = '#34465c';
const LEAD = '#8a9cb0';

const PX = 128; // pixels per metre
const TW = 0.22 * PX; // timber width

function plaster(ctx, w, h) {
  ctx.fillStyle = PLASTER;
  ctx.fillRect(0, 0, w, h);
  // faint weathering speckle (deterministic)
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  ctx.globalAlpha = 0.07;
  for (let i = 0; i < 500; i++) {
    ctx.fillStyle = r() < 0.5 ? '#ffffff' : '#c9c2ac';
    ctx.fillRect(r() * w, r() * h, 3, 3);
  }
  ctx.globalAlpha = 1;
}

// timber helpers in metres, canvas origin top-left, y measured from the bottom
function makeDraw(ctx, h) {
  const H = h / PX;
  const rect = (x0, y0, x1, y1) => {
    ctx.fillStyle = OAK;
    ctx.fillRect(x0 * PX, (H - y1) * PX, (x1 - x0) * PX, (y1 - y0) * PX);
  };
  const post = (x, y0, y1, t = TW / PX) => rect(x - t / 2, y0, x + t / 2, y1);
  const rail = (y, x0, x1, t = TW / PX) => rect(x0, y - t / 2, x1, y + t / 2);
  const brace = (x0, y0, x1, y1, t = TW) => {
    ctx.strokeStyle = OAK;
    ctx.lineWidth = t;
    ctx.lineCap = 'butt';
    ctx.beginPath();
    ctx.moveTo(x0 * PX, (H - y0) * PX);
    ctx.lineTo(x1 * PX, (H - y1) * PX);
    ctx.stroke();
  };
  const leaded = (x0, y0, x1, y1) => {
    const X = x0 * PX, Y = (H - y1) * PX, W = (x1 - x0) * PX, HH = (y1 - y0) * PX;
    const g = ctx.createLinearGradient(X, Y, X + W, Y + HH);
    g.addColorStop(0, '#6f87a3');
    g.addColorStop(0.45, GLASS);
    g.addColorStop(1, '#253244');
    ctx.fillStyle = g;
    ctx.fillRect(X, Y, W, HH);
    ctx.save();
    ctx.beginPath();
    ctx.rect(X, Y, W, HH);
    ctx.clip();
    ctx.strokeStyle = LEAD;
    ctx.globalAlpha = 0.55;
    ctx.lineWidth = 2;
    const step = 0.2 * PX;
    for (let k = -HH; k < W + HH; k += step) {
      ctx.beginPath();
      ctx.moveTo(X + k, Y);
      ctx.lineTo(X + k + HH, Y + HH);
      ctx.moveTo(X + k, Y + HH);
      ctx.lineTo(X + k + HH, Y);
      ctx.stroke();
    }
    ctx.restore();
    // oak mullion + transom
    ctx.fillStyle = OAK;
    ctx.fillRect(X + W / 2 - 4, Y, 8, HH);
    ctx.fillRect(X, Y + HH * 0.3 - 3, W, 6);
    // frame
    ctx.strokeStyle = OAK;
    ctx.lineWidth = 10;
    ctx.strokeRect(X, Y, W, HH);
  };
  return { rect, post, rail, brace, leaded };
}

const DRAW = {
  // ground storey: close studding with a leaded window
  ground(ctx, w, h) {
    plaster(ctx, w, h);
    const d = makeDraw(ctx, h);
    d.rail(0.11, 0, 2);
    d.rail(2.89, 0, 2);
    d.post(0, 0, 3);
    d.post(2, 0, 3);
    for (const x of [0.4, 0.7, 1.3, 1.6]) d.post(x, 0, 3, 0.16);
    d.rail(0.85, 0, 2, 0.16);
    d.rail(2.4, 0, 2, 0.16);
    d.leaded(0.55, 0.95, 1.45, 2.3);
  },
  // upper storey: window flanked by curved-look braces, lozenge below
  upper(ctx, w, h) {
    plaster(ctx, w, h);
    const d = makeDraw(ctx, h);
    d.rail(0.11, 0, 2);
    d.rail(2.89, 0, 2);
    d.post(0, 0, 3);
    d.post(2, 0, 3);
    d.post(0.45, 0, 3, 0.16);
    d.post(1.55, 0, 3, 0.16);
    d.rail(1.0, 0, 2, 0.16);
    d.brace(0.05, 0.25, 0.45, 1.0, 20);
    d.brace(1.95, 0.25, 1.55, 1.0, 20);
    d.brace(0.05, 2.75, 0.45, 2.0, 20);
    d.brace(1.95, 2.75, 1.55, 2.0, 20);
    // lozenge under the window
    d.brace(0.5, 0.55, 1.0, 0.2, 16);
    d.brace(1.0, 0.2, 1.5, 0.55, 16);
    d.brace(0.5, 0.55, 1.0, 0.92, 16);
    d.brace(1.0, 0.92, 1.5, 0.55, 16);
    d.leaded(0.55, 1.15, 1.45, 2.4);
  },
  // gable infill: studs, collar and chevron braces
  gable(ctx, w, h) {
    plaster(ctx, w, h);
    const d = makeDraw(ctx, h);
    d.rail(0.11, 0, 2);
    d.rail(1.6, 0, 2, 0.18);
    d.post(0, 0, 3, 0.18);
    d.post(1, 0, 3, 0.18);
    d.post(2, 0, 3, 0.18);
    d.brace(0, 0.2, 1, 1.55, 20);
    d.brace(2, 0.2, 1, 1.55, 20);
    d.brace(0, 1.7, 1, 2.9, 20);
    d.brace(2, 1.7, 1, 2.9, 20);
  },
  // canted/flat bay window: almost all glass
  bay(ctx, w, h) {
    plaster(ctx, w, h);
    const d = makeDraw(ctx, h);
    d.rail(0.11, 0, 2);
    d.rail(2.89, 0, 2);
    d.post(0, 0, 3);
    d.post(2, 0, 3);
    d.rail(0.8, 0, 2, 0.16);
    d.brace(0.1, 0.2, 1.0, 0.75, 14);
    d.brace(1.9, 0.2, 1.0, 0.75, 14);
    d.leaded(0.12, 0.9, 1.88, 2.75);
  },
};

const baseTex = (kind) => canvasTexture(2 * PX, 3 * PX, DRAW[kind], { key: `tudor-manor:${kind}` });

const matCache = new Map();
/** Material for a wall `len` metres long: whole number of bays of roughly 2 m. */
export function timberMat(kind, len, bay = 2) {
  const n = Math.max(1, Math.round(len / bay));
  const bw = len / n;
  const key = kind + ':' + bw.toFixed(3);
  if (!matCache.has(key)) {
    const t = baseTex(kind).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / bw, 1 / 3);
    t.needsUpdate = true;
    matCache.set(key, textured(t));
  }
  return matCache.get(key);
}

/** One storey (h = 3) of timbered wall, base at y = 0. */
export function timberBlock(w, d, kind, { h = 3, top = OAK, bay = 2 } = {}) {
  const mx = timberMat(kind, d, bay); // faces along z (+x / -x)
  const mz = timberMat(kind, w, bay); // faces along x (front / back)
  const t = mat(top);
  return new THREE.Mesh(boxGeometry(w, h, d), [mx, mx, t, mat(OAK), mz, mz]);
}

/** Dark bargeboards + finial on a gable whose wall plane is at z = 0, facing +z. */
export function bargeboards({ halfW, h, overhang = 0.4 }) {
  const drop = (overhang * h) / halfW;
  const L = halfW + overhang;
  const oak = mat(OAK);
  return group(
    beam([-L, -drop, 0], [0, h + 0.05, 0], 0.22, oak),
    beam([L, -drop, 0], [0, h + 0.05, 0], 0.22, oak),
    place(box(0.16, 0.9, 0.16, oak), { y: h - 0.1 }),
    place(new THREE.Mesh(new THREE.OctahedronGeometry(0.16, 0), oak), { y: h + 0.85 }),
  );
}

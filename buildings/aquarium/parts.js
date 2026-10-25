// Local helpers for the Aquarium: the wave-shaped hall, a whale, seals, fish
// and a sign with 0..1 UVs (the lib sign() shrinks text on faces over 1 m).
import * as THREE from 'three';
import { PALETTE, canvasTexture, signTexture, textured, mat, place, group, box, cylinder, sphere, cone } from '../../src/lib/index.js';

// ---------------------------------------------------------------------------
// wave hall

// Front elevation of the hall (x, y in metres): a breaking wave rolling towards
// -x, with its back sloping down to the right and a curled lip on the left.
// `p` is a THREE.Shape or a canvas 2D context (same path API); tx/ty map coords.
export const WAVE = { x0: -9.6, x1: 2.6, top: 12.2 };

function traceOutline(p, tx, ty) {
  const m = (x, y) => p.moveTo(tx(x), ty(y));
  const l = (x, y) => p.lineTo(tx(x), ty(y));
  const c = (a, b, cc, d, e, f) => p.bezierCurveTo(tx(a), ty(b), tx(cc), ty(d), tx(e), ty(f));
  m(2.6, 0);
  l(2.6, 3.4);
  traceTop(p, tx, ty, true);
  c(-7.3, 8.4, -7.5, 6.0, -8.5, 4.5);
  c(-9.1, 3.6, -9.6, 2.8, -9.6, 2.1);
  l(-9.6, 0);
}

// The upper edge from the low right end over the crest into the curl.
function traceTop(p, tx, ty, continuing = false) {
  const c = (a, b, cc, d, e, f) => p.bezierCurveTo(tx(a), ty(b), tx(cc), ty(d), tx(e), ty(f));
  if (!continuing) p.moveTo(tx(2.6), ty(3.4));
  c(0.2, 3.6, -2.4, 5.2, -4.4, 9.0);
  c(-5.4, 11.0, -7.0, 12.6, -8.6, 12.0);
  c(-9.6, 11.6, -9.9, 10.4, -9.4, 9.6);
  c(-9.0, 9.0, -8.2, 9.2, -7.8, 9.9);
}

// Front/back face texture, mapped once over [-10, 3] x [0, 13] m.
const TEX_X0 = -10, TEX_S = 13;

function waveFaceTexture() {
  return canvasTexture(512, 512, (ctx, W, H) => {
    const tx = (x) => ((x - TEX_X0) / TEX_S) * W;
    const ty = (y) => (1 - y / TEX_S) * H;
    const M = W / TEX_S; // px per metre
    ctx.save();
    ctx.beginPath();
    traceOutline(ctx, tx, ty);
    ctx.closePath();
    ctx.clip();
    // deep blue at the base to bright sky-blue at the crest
    const g = ctx.createLinearGradient(0, ty(0), 0, ty(12.5));
    g.addColorStop(0, '#1b4f8e');
    g.addColorStop(0.5, '#2f7fca');
    g.addColorStop(1, '#79c6ee');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);
    // layered swell lines parallel to the wave's back
    ctx.lineWidth = 0.22 * M;
    for (let k = 1; k <= 5; k++) {
      ctx.save();
      ctx.translate(k * 0.75 * M, k * 1.15 * M);
      ctx.strokeStyle = `rgba(255,255,255,${0.32 - k * 0.04})`;
      ctx.beginPath();
      traceTop(ctx, tx, ty);
      ctx.stroke();
      ctx.restore();
    }
    // ribbon windows: dark glass bands with mullions, a few lit
    const band = (xa, xb, ya, yb, step, litEvery) => {
      ctx.fillStyle = '#16304d';
      ctx.fillRect(tx(xa), ty(yb), (xb - xa) * M, (yb - ya) * M);
      ctx.fillStyle = 'rgba(160,215,255,0.35)';
      ctx.fillRect(tx(xa), ty(yb), (xb - xa) * M, 0.18 * M);
      let i = 0;
      for (let x = xa; x < xb - 0.01; x += step, i++) {
        if (litEvery && i % litEvery === 2) {
          ctx.fillStyle = 'rgba(255,231,160,0.85)';
          ctx.fillRect(tx(x) + 2, ty(yb) + 0.25 * M, step * M - 4, (yb - ya - 0.3) * M);
        }
        ctx.fillStyle = '#dfe9f2';
        ctx.fillRect(tx(x) - 1, ty(yb), 2.5, (yb - ya) * M);
      }
      ctx.fillStyle = '#dfe9f2';
      ctx.fillRect(tx(xa), ty(ya) - 2, (xb - xa) * M, 3);
      ctx.fillRect(tx(xa), ty(yb), (xb - xa) * M, 2);
    };
    band(-8.4, 2.6, 0.35, 2.7, 1.1, 0);
    band(-8.0, 1.0, 3.3, 4.3, 1.0, 5);
    band(-7.6, -3.0, 6.0, 7.0, 1.0, 4);
    // portholes up in the crest
    for (const [x, y] of [[-6.2, 9.4], [-7.4, 10.7], [-5.0, 8.4]]) {
      ctx.fillStyle = '#dfe9f2';
      ctx.beginPath();
      ctx.arc(tx(x), ty(y), 0.45 * M, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#16304d';
      ctx.beginPath();
      ctx.arc(tx(x), ty(y), 0.33 * M, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
    // white foam along the crest (stroke is centred on the edge, the outside half is unused)
    ctx.save();
    ctx.beginPath();
    traceOutline(ctx, tx, ty);
    ctx.closePath();
    ctx.clip();
    ctx.strokeStyle = '#f4fbff';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 0.7 * M;
    ctx.beginPath();
    traceTop(ctx, tx, ty);
    ctx.stroke();
    ctx.restore();
  }, { key: 'aquarium:wave-face', repeat: false });
}

function waveRoofTexture() {
  // 1 m repeat: blue standing-seam metal, seams run along the curve
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#3c86cc';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#5aa2de';
    ctx.fillRect(0, 0, W, H * 0.45);
    ctx.fillStyle = '#2a6aa8';
    ctx.fillRect(0, H - 4, W, 4);
  }, { key: 'aquarium:wave-roof' });
}

/** The hall: the wave outline extruded `depth` m along Z, centred on z = 0. */
export function waveHall({ depth }) {
  const shape = new THREE.Shape();
  traceOutline(shape, (x) => x, (y) => y);
  shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 10 });
  geo.translate(0, 0, -depth / 2);
  // caps (group 0) get one 0..1 mapping of the face texture
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  const caps = geo.groups.find((gr) => gr.materialIndex === 0);
  for (let i = caps.start; i < caps.start + caps.count; i++) {
    uv.setXY(i, (pos.getX(i) - TEX_X0) / TEX_S, pos.getY(i) / TEX_S);
  }
  geo.computeVertexNormals();
  const face = textured(waveFaceTexture(), { roughness: 0.45, metalness: 0.15 });
  const roof = textured(waveRoofTexture(), { roughness: 0.5, metalness: 0.25 });
  return new THREE.Mesh(geo, [face, roof]);
}

// ---------------------------------------------------------------------------
// sign with a 0..1 UV face (text faces +Z)

export function bigSign({ text, w, h, d = 0.2, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// ---------------------------------------------------------------------------
// creatures

function blob(r, sx, sy, sz, material, segs = 12) {
  const m = sphere(r, material, segs);
  m.geometry = m.geometry.clone().translate(0, -r, 0); // centre the sphere on the origin
  m.scale.set(sx, sy, sz);
  return m;
}

/**
 * Humpback-ish whale, ~6 m long, head towards +x, centred on its body.
 */
export function whale({ color = '#3f6f9c', belly = '#dfe7ee' } = {}) {
  const body = mat(color, { roughness: 0.4, metalness: 0.2 });
  const under = mat(belly, { roughness: 0.5 });
  const g = new THREE.Group();
  g.add(blob(1, 2.3, 0.85, 0.9, body, 16));
  g.add(place(blob(1, 2.0, 0.55, 0.72, under, 14), { x: 0.25, y: -0.38 }));
  // throat grooves
  for (let i = -2; i <= 2; i++) g.add(place(box(1.6, 0.04, 0.05, mat(shade(belly))), { x: 1.3, y: -0.9, z: i * 0.16, rz: -8 }));
  // tail stock + flukes
  const stock = cylinder(0.55, 0.16, 2.0, body, 10);
  stock.geometry = stock.geometry.clone().rotateZ(Math.PI / 2); // axis along -x
  g.add(place(stock, { x: -1.9 }));
  for (const s of [-1, 1]) {
    g.add(place(box(1.0, 0.1, 1.4, body), { x: -4.0, y: -0.05, z: s * 0.65, ry: s * 35 }));
  }
  // long pectoral fins
  for (const s of [-1, 1]) {
    g.add(place(box(1.9, 0.08, 0.42, under), { x: 0.5, y: -0.55, z: s * 1.3, ry: s * 40, rx: s * 22 }));
  }
  // dorsal hump, eyes, mouth line
  g.add(place(cone(0.28, 0.4, body, 6), { x: -1.0, y: 0.72 }));
  for (const s of [-1, 1]) g.add(place(sphere(0.09, mat(PALETTE.black), 6), { x: 1.45, y: -0.05, z: s * 0.66 }));
  g.add(place(box(1.4, 0.05, 1.3, mat('#22384f')), { x: 1.55, y: -0.32 }));
  return g;
}

function shade(hex) {
  const c = new THREE.Color(hex).multiplyScalar(0.82);
  return '#' + c.getHexString();
}

/** Seal lying down, ~1.5 m long, head towards +x. `up` raises the head. */
export function seal({ color = '#6d7178', up = 0.25 } = {}) {
  const m = mat(color, { roughness: 0.35, metalness: 0.15 });
  const dark = mat('#3b3e43');
  const g = new THREE.Group();
  g.add(place(blob(1, 0.72, 0.3, 0.34, m, 10), { y: 0.3 }));
  g.add(place(blob(1, 0.26, 0.24, 0.24, m, 8), { x: 0.6, y: 0.48 + up }));
  g.add(place(sphere(0.07, dark, 6), { x: 0.85, y: 0.43 + up }));
  g.add(place(box(0.45, 0.05, 0.28, m), { x: -0.8, y: 0.1, ry: 0 }));
  for (const s of [-1, 1]) g.add(place(box(0.3, 0.05, 0.16, m), { x: 0.3, y: 0.1, z: s * 0.36, ry: s * 30 }));
  return g;
}

/** Small fish, ~0.7 m, nose towards +x. */
export function fish(color) {
  const m = mat(color, { roughness: 0.4 });
  const g = new THREE.Group();
  g.add(place(blob(1, 0.32, 0.18, 0.08, m, 8), { y: 0 }));
  const tail = cone(0.16, 0.24, m, 4);
  tail.geometry = tail.geometry.clone().rotateZ(-Math.PI / 2);
  g.add(place(tail, { x: -0.25 }));
  return g;
}

export { group };

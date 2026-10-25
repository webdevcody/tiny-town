// Local helpers for the Steam Pumping Station: brick walls with real arched
// openings, stone dressings, glazing, a coped gable roof and a 0..1-UV sign.
import * as THREE from 'three';
import { PALETTE, mat, textured, canvasTexture, signTexture, box, place, beam } from '../../src/lib/index.js';

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

/** Glass that lets the sun through (stage.js turns castShadow on for every mesh). */
export function noShadow(mesh) {
  Object.defineProperty(mesh, 'castShadow', { get: () => false, set: () => {}, configurable: true });
  return mesh;
}

/** Round-headed opening outline: jambs from y0 up to `spring`, then a semicircle. */
function archPath(path, { cx, y0, w, spring }) {
  const r = w / 2;
  path.moveTo(cx - r, y0);
  path.lineTo(cx + r, y0);
  path.lineTo(cx + r, spring);
  path.absarc(cx, spring, r, 0, Math.PI, false);
  path.lineTo(cx - r, y0);
  return path;
}

function circlePath(path, { cx, cy, r }) {
  path.moveTo(cx + r, cy);
  path.absarc(cx, cy, r, 0, Math.PI * 2, false);
  return path;
}

/**
 * Wall panel in its local XY plane, x in [-L/2, L/2], y from 0 to H (+ gable apex).
 * Outer face at z = 0, thickness goes inwards to z = -t.
 * arches: [{ cx, y0, w, spring }], circles: [{ cx, cy, r }]
 */
export function wallPanel({ L, H, gable = 0, t = 0.35, arches = [], circles = [], material, lining = null }) {
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0);
  s.lineTo(L / 2, 0);
  s.lineTo(L / 2, H);
  if (gable > 0) s.lineTo(0, H + gable);
  s.lineTo(-L / 2, H);
  s.lineTo(-L / 2, 0);
  for (const a of arches) s.holes.push(archPath(new THREE.Path(), a));
  for (const c of circles) s.holes.push(circlePath(new THREE.Path(), c));
  const geom = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 10 });
  geom.translate(0, 0, -t);
  const mesh = new THREE.Mesh(geom, toMat(material));
  if (!lining) return mesh;
  // painted/tiled inner face: same outline, thin, just inside the wall
  const lg = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: false, curveSegments: 10 });
  lg.translate(0, 0, -t - 0.02);
  const g = new THREE.Group();
  g.add(mesh, new THREE.Mesh(lg, toMat(lining)));
  return g;
}

/** Flat shape geometry with UVs normalised to 0..1 over its bounding box. */
function flatGeometry(shape) {
  const g = new THREE.ShapeGeometry(shape, 10);
  g.computeBoundingBox();
  const { min, max } = g.boundingBox;
  const pos = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - min.x) / (max.x - min.x), (pos.getY(i) - min.y) / (max.y - min.y));
  }
  return g;
}

// White cast-iron glazing bars on a transparent background (alpha-tested so the
// shadows show the bars too).
function barsTexture(round) {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#efe9da';
    ctx.lineWidth = 7;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    ctx.lineWidth = 4;
    if (round) {
      ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.44, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke();
      return;
    }
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
    for (const fy of [0.3, 0.55, 0.78]) { ctx.beginPath(); ctx.moveTo(0, H * fy); ctx.lineTo(W, H * fy); ctx.stroke(); }
  }, { key: 'steam-pumping-station:bars:' + (round ? 'round' : 'arch'), repeat: false });
}

const glassMat = () => mat('#9cc0d0', { transparent: true, opacity: 0.12, roughness: 0.3, depthWrite: false });
const barsMat = (round) => textured(barsTexture(round), { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });

/** Glazing (see-through glass + bars) filling an arch, in the wall plane at depth z. */
export function archGlazing(a, z = -0.17) {
  const shape = archPath(new THREE.Shape(), a);
  const g = new THREE.Group();
  g.add(place(noShadow(new THREE.Mesh(flatGeometry(shape), glassMat())), { z }));
  g.add(place(new THREE.Mesh(flatGeometry(shape), barsMat(false)), { z: z + 0.03 }));
  return g;
}

export function roundGlazing(c, z = -0.17) {
  const shape = circlePath(new THREE.Shape(), c);
  const g = new THREE.Group();
  g.add(place(noShadow(new THREE.Mesh(flatGeometry(shape), glassMat())), { z }));
  g.add(place(new THREE.Mesh(flatGeometry(shape), barsMat(true)), { z: z + 0.03 }));
  return g;
}

/** Stone dressings for an arch: voussoir ring, keystone, impost blocks and sill. */
export function archDressing({ cx, y0, w, spring }, { stone, ring = 0.2, proud = 0.07, sill = true }) {
  const m = toMat(stone);
  const r = w / 2;
  const s = new THREE.Shape();
  s.moveTo(cx + r + ring, spring);
  s.absarc(cx, spring, r + ring, 0, Math.PI, false);
  s.lineTo(cx - r, spring);
  s.absarc(cx, spring, r, Math.PI, 0, true);
  s.lineTo(cx + r + ring, spring);
  const geom = new THREE.ExtrudeGeometry(s, { depth: proud, bevelEnabled: false, curveSegments: 10 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geom, m));
  g.add(place(box(ring * 1.3, ring * 1.6, proud + 0.06, m), { x: cx, y: spring + r - ring * 0.2 }));
  for (const sx of [-1, 1]) g.add(place(box(ring + 0.1, 0.16, proud + 0.04, m), { x: cx + sx * (r + ring / 2), y: spring - 0.16 }));
  if (sill) g.add(place(box(w + 0.35, 0.14, 0.22, m), { x: cx, y: y0 - 0.14, z: 0.06 }));
  return g;
}

/** Two-slope roof with ridge along Z; eaves overhang on the sides only (coped gables). */
export function slateRoof({ w, d, h, overhang = 0.4, material, under = PALETTE.woodDark }) {
  const X = w / 2 + overhang;
  const drop = (overhang * h) / (w / 2);
  const D = d / 2;
  const pos = [];
  const quads = [
    [[X, -drop, D], [X, -drop, -D], [0, h, -D], [0, h, D]],
    [[-X, -drop, -D], [-X, -drop, D], [0, h, D], [0, h, -D]],
  ];
  // custom ShapeBuilder-like build so the tile rows run along the eaves
  const uv = [];
  for (const q of quads) {
    const len = Math.hypot(X, h + drop);
    const quv = [[0, 0], [d, 0], [d, len], [0, len]];
    for (const k of [0, 1, 2, 0, 2, 3]) { pos.push(...q[k]); uv.push(...quv[k]); }
  }
  const geom = new THREE.BufferGeometry();
  geom.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geom.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geom.computeVertexNormals();
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geom, toMat(material)));
  const back = geom.clone();
  g.add(new THREE.Mesh(back, mat(under, { side: THREE.BackSide })));
  return g;
}

/** Stone coping along the raking edges of a gable (wall plane z, eave half-width hw). */
export function gableCoping({ hw, H, apex, z, stone, t = 0.2 }) {
  const m = toMat(stone);
  return [
    beam([-hw - 0.05, H, z], [0, apex + 0.05, z], t, m),
    beam([hw + 0.05, H, z], [0, apex + 0.05, z], t, m),
  ];
}

/** Sign with 0..1 UVs across the face (the lib sign() shrinks text over 1 m). Text faces +Z. */
export function plaque({ text, w, h, d = 0.12, bg, fg, border, font = 'bold' }) {
  const geom = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const px = 64;
  const tex = signTexture(text, { bg, fg, border, font, width: Math.round((px * w) / h), height: px });
  const side = mat(bg);
  return new THREE.Mesh(geom, [side, side, side, side, textured(tex), side]);
}

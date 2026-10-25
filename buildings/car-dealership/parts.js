import * as THREE from 'three';
import { PALETTE, ShapeBuilder, mat, metal, emissive, box, place, beam, canvasTexture, textured } from '../../src/lib/index.js';

// Prism of a convex side profile [[x, y]…] (CCW seen from +z), extruded along z over `width`.
// `topEdges` lists edge indices that use material group 0; all others use group 1.
function profilePrism(profile, width, topEdges, materials) {
  const b = new ShapeBuilder();
  const W = width / 2;
  const n = profile.length;
  b.poly(profile.map(([x, y]) => [x, y, W]), 1);
  b.poly(profile.slice().reverse().map(([x, y]) => [x, y, -W]), 1);
  for (let i = 0; i < n; i++) {
    const [ax, ay] = profile[i];
    const [bx, by] = profile[(i + 1) % n];
    b.quad([ax, ay, W], [ax, ay, -W], [bx, by, -W], [bx, by, W], topEdges.includes(i) ? 0 : 1);
  }
  return new THREE.Mesh(b.build(), materials);
}

/** Glossy showroom car with a sloped cabin, lights and chrome; length (4.2 m) along X, nose at +X. */
export function shinyCar({ color = PALETTE.red, kind = 'sedan' } = {}) {
  const paint = mat(color, { roughness: 0.22, metalness: 0.35 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.1, metalness: 0.6 });
  const chrome = metal(PALETTE.chrome ?? PALETTE.steelLight, { roughness: 0.15 });
  const g = new THREE.Group();

  const sporty = kind === 'coupe';
  const suv = kind === 'suv';
  const top = suv ? 1.05 : 0.92;
  // lower body: sloped bonnet at the front, short boot at the back
  const bodyProfile = [[-2.1, 0.28], [2.1, 0.28], [2.1, 0.68], [1.85, top - 0.05], [-1.95, top], [-2.1, top - 0.12]];
  g.add(profilePrism(bodyProfile, 1.8, [], [paint, paint]));
  // cabin: glass sides, painted roof (edge 2)
  const cy = top, ch = sporty ? 0.45 : suv ? 0.7 : 0.55;
  const cabin = sporty
    ? [[-1.3, cy], [0.9, cy], [0.0, cy + ch], [-0.9, cy + ch]]
    : suv
      ? [[-1.95, cy], [0.9, cy], [0.45, cy + ch], [-1.9, cy + ch]]
      : [[-1.4, cy], [1.0, cy], [0.35, cy + ch], [-1.0, cy + ch]];
  g.add(profilePrism(cabin, 1.56, [2], [paint, glassM]));

  // lights, grille, bumpers
  for (const sz of [-0.6, 0.6]) {
    g.add(place(box(0.06, 0.16, 0.36, emissive('#fff6d0', 0.9)), { x: 2.11, y: 0.5, z: sz }));
    g.add(place(box(0.06, 0.14, 0.34, emissive('#e8322a', 0.7)), { x: -2.11, y: 0.66, z: sz }));
  }
  g.add(place(box(0.06, 0.14, 0.6, chrome), { x: 2.12, y: 0.48 }));
  g.add(place(box(0.14, 0.12, 1.84, chrome), { x: 2.1, y: 0.28 }));
  g.add(place(box(0.14, 0.12, 1.84, chrome), { x: -2.1, y: 0.28 }));
  // side trim stripe
  g.add(place(box(3.6, 0.05, 1.82, chrome), { y: 0.62 }));

  const wheelM = mat(PALETTE.black, { roughness: 0.7 });
  const hubM = metal(PALETTE.steelLight, { roughness: 0.2 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.34, 0.34, 0.26, 12);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(sx * 1.35, 0.34, sz * 0.82);
    g.add(wheel);
    const hgeo = new THREE.CylinderGeometry(0.18, 0.18, 0.28, 8);
    hgeo.rotateX(Math.PI / 2);
    const hub = new THREE.Mesh(hgeo, hubM);
    hub.position.set(sx * 1.35, 0.34, sz * 0.83);
    g.add(hub);
  }
  return g;
}

const BUNTING_COLOURS = [PALETTE.red, PALETTE.yellow, PALETTE.blue, PALETTE.green, PALETTE.white, PALETTE.orange];

/**
 * String of triangular pennants hanging from a sagging line between points a and b ([x,y,z]).
 * The line sags by `sag` metres in the middle.
 */
export function bunting(a, b, { sag = 0.6, spacing = 0.55, size = 0.42, offset = 0 } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const at = (t) => new THREE.Vector3().lerpVectors(A, B, t).add(new THREE.Vector3(0, -4 * sag * t * (1 - t), 0));
  const g = new THREE.Group();

  // the line itself, in a few straight segments
  const segs = 8;
  const lineM = mat(PALETTE.darkGrey);
  for (let i = 0; i < segs; i++) g.add(beam(at(i / segs), at((i + 1) / segs), 0.04, lineM));

  // pennants: one material group per colour
  const sb = new ShapeBuilder();
  const count = Math.max(1, Math.floor(len / spacing) - 1);
  for (let i = 0; i < count; i++) {
    const t0 = (i + 0.6) / (count + 0.6);
    const t1 = t0 + (size / len);
    const p0 = at(t0), p1 = at(Math.min(t1, 1));
    const mid = p0.clone().add(p1).multiplyScalar(0.5);
    const tip = mid.clone().add(new THREE.Vector3(0, -size * 1.15, 0));
    sb.tri(p0.toArray(), tip.toArray(), p1.toArray(), (i + offset) % BUNTING_COLOURS.length);
  }
  const mats = BUNTING_COLOURS.map((c) => mat(c, { side: THREE.DoubleSide, roughness: 0.7 }));
  g.add(new THREE.Mesh(sb.build(), mats));
  return g;
}

/** Flat sign board with text scaled to fill it (lib sign() only maps correctly at 1 x 1 m); text faces +Z (both sides when `double`). */
export function textSign({ text, w, h, bg = PALETTE.red, fg = '#ffffff', depth = 0.1, double = false }) {
  const W = 512, H = Math.max(32, Math.round((W * h) / w));
  const tex = canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const size = Math.round(H * 0.7);
    ctx.font = `bold ${size}px sans-serif`;
    const tw = ctx.measureText(text).width;
    const sx = Math.min(1, (W * 0.88) / tw);
    ctx.fillStyle = fg;
    ctx.textBaseline = 'middle';
    ctx.setTransform(sx, 0, 0, 1, (W - tw * sx) / 2, 0);
    ctx.fillText(text, 0, H / 2 + H * 0.04);
  }, { key: `car-dealership:sign:${text}:${bg}:${fg}:${w}x${h}`, repeat: false });
  // lib box() UVs are in metres, so map the whole texture onto the w x h face
  tex.repeat.set(1 / w, 1 / h);
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return box(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

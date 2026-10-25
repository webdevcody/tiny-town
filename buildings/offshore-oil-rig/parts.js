import * as THREE from 'three';
import {
  PALETTE, box, cylinder, sphere, beam, pipe as beamPipe, place, group, extrude, mat, metal, emissive, glass,
  textured, signTexture, canvasTexture, container,
} from '../../src/lib/index.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);

/**
 * Sign with 0..1 UVs so the text fills the face (the lib sign() shrinks text on faces over 1 m).
 * Text faces +Z, origin at the bottom centre.
 */
export function bigSign(text, { w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tw = 512;
  const tex = signTexture(text, { bg, fg, width: tw, height: Math.max(32, Math.round((tw * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Square helideck: dark deck, yellow touchdown circle, white H and edge line. 0..1 UVs on top. */
export function helideck(size) {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#3d4f45';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, W - 20, H - 20);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    const s = W * 0.28;
    ctx.fillRect(W / 2 - s / 2, H / 2 - s / 2, s * 0.22, s);
    ctx.fillRect(W / 2 + s / 2 - s * 0.22, H / 2 - s / 2, s * 0.22, s);
    ctx.fillRect(W / 2 - s / 2, H / 2 - s * 0.1, s, s * 0.2);
  }, { key: 'offshore-oil-rig:helideck', repeat: false });
  const top = textured(tex);
  const side = mat(PALETTE.steelDark);
  const geo = new THREE.BoxGeometry(size, 0.3, size).translate(0, 0.15, 0);
  return new THREE.Mesh(geo, [side, side, top, side, side, side]);
}

/**
 * Square lattice boom from point a to point b (crane jibs, flare boom).
 * w0 = width at a, w1 = width at b.
 */
export function boom(a, b, { w0 = 1, w1 = 0.4, segments, thickness = 0.14, material } = {}) {
  const A = Array.isArray(a) ? V(...a) : a;
  const B = Array.isArray(b) ? V(...b) : b;
  const m = material ?? metal(PALETTE.steelDark);
  const dir = B.clone().sub(A);
  const len = dir.length();
  dir.normalize();
  let u = new THREE.Vector3().crossVectors(dir, V(0, 1, 0));
  if (u.lengthSq() < 1e-4) u = V(1, 0, 0);
  u.normalize();
  const v = new THREE.Vector3().crossVectors(u, dir).normalize();
  const n = segments ?? Math.max(2, Math.round(len / Math.max(w0, 0.8)));
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  const P = (t, [su, sv]) => {
    const w = (w0 + (w1 - w0) * t) / 2;
    return A.clone().addScaledVector(dir, len * t).addScaledVector(u, su * w).addScaledVector(v, sv * w);
  };
  const g = new THREE.Group();
  for (const c of corners) g.add(beam(P(0, c), P(1, c), thickness, m));
  for (let i = 0; i <= n; i++) {
    const t0 = i / n;
    for (let s = 0; s < 4; s++) {
      const ca = corners[s], cb = corners[(s + 1) % 4];
      g.add(beam(P(t0, ca), P(t0, cb), thickness * 0.7, m));
      if (i < n) g.add(beam(P(t0, ca), P((i + 1) / n, cb), thickness * 0.6, m));
    }
  }
  return g;
}

/**
 * Pedestal crane: column, machinery house with cab, A-frame and lattice jib along +X.
 *   crane({ jib, angle (deg elevation), drop (hook line length), load })
 * Origin at the base of the pedestal.
 */
export function crane({ jib = 9, angle = 35, drop = 4, color = PALETTE.yellow, load = null } = {}) {
  const yel = mat(color);
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(cylinder(0.75, 0.9, 3, mat(PALETTE.steelLight), 14));
  g.add(place(cylinder(1.1, 1.1, 0.3, dark, 16), { y: 3 }));
  // machinery house + cab
  g.add(place(box(3, 1.8, 2.2, yel), { x: -0.7, y: 3.3 }));
  g.add(place(box(1.3, 1.6, 1.1, yel), { x: 0.3, y: 3.3, z: 1.4 }));
  g.add(place(box(0.08, 0.8, 0.9, glass(PALETTE.glassDark)), { x: 0.97, y: 4.0, z: 1.4 }));
  g.add(place(box(1.0, 0.8, 0.08, glass(PALETTE.glassDark)), { x: 0.3, y: 4.0, z: 1.97 }));
  g.add(place(box(1.2, 0.5, 1.6, dark), { x: -1.8, y: 5.1 }));
  // A-frame
  const apex = V(-1.3, 7.6, 0);
  for (const z of [-0.9, 0.9]) {
    g.add(beam(V(-2.0, 5.1, z), apex, 0.18, yel));
    g.add(beam(V(0.4, 5.1, z), apex, 0.18, yel));
  }
  // jib
  const rad = (angle * Math.PI) / 180;
  const s = V(0.8, 4.4, 0);
  const tip = s.clone().add(V(Math.cos(rad) * jib, Math.sin(rad) * jib, 0));
  g.add(boom(s, tip, { w0: 1.0, w1: 0.35, material: yel, thickness: 0.13 }));
  g.add(place(box(0.5, 0.5, 0.5, yel), { x: tip.x, y: tip.y - 0.25, z: tip.z }));
  // pendant ropes and hook
  g.add(beam(apex, tip, 0.05, dark));
  g.add(beam(apex, V(-2.4, 5.6, 0), 0.05, dark));
  const hookY = tip.y - drop;
  g.add(beam(tip, V(tip.x, hookY, 0), 0.04, dark));
  g.add(place(box(0.35, 0.45, 0.35, mat(PALETTE.red)), { x: tip.x, y: hookY - 0.45 }));
  if (load) {
    const ly = hookY - 0.45 - load.h - 0.6;
    for (const [dx, dz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
      g.add(beam(V(tip.x, hookY - 0.45, 0), V(tip.x + dx * load.w * 0.4, ly + load.h, dz * load.d * 0.4), 0.03, dark));
    }
    g.add(place(load.obj, { x: tip.x, y: ly }));
  }
  g.userData.tip = tip;
  return g;
}

/** Enclosed orange lifeboat, long axis along Z. Origin at the bottom centre. */
export function lifeboat() {
  const org = mat(PALETTE.orange);
  const hull = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), org);
  hull.scale.set(0.75, 0.6, 1.7);
  hull.position.y = 0.6;
  return group(
    hull,
    place(box(0.9, 0.35, 0.9, mat(PALETTE.white)), { y: 1.05, z: -0.6 }),
    place(box(0.92, 0.12, 0.6, glass(PALETTE.glassDark)), { y: 1.2, z: -0.6 }),
  );
}

/**
 * Offshore supply vessel, bow towards +X. Bridge forward, long open cargo deck aft.
 * Origin at the waterline centre.
 */
export function supplyBoat({ length = 12.5, beam: bw = 3.4 } = {}) {
  const g = new THREE.Group();
  const L = length / 2, B = bw / 2;
  const hullPts = [[-L, B], [L - 2.2, B], [L, 0], [L - 2.2, -B], [-L, -B]];
  const deckPts = [[-L + 0.15, B - 0.15], [L - 2.25, B - 0.15], [L - 0.25, 0], [L - 2.25, -B + 0.15], [-L + 0.15, -B + 0.15]];
  g.add(extrude(hullPts, 0.9, mat(PALETTE.red), mat(PALETTE.red)));
  g.add(place(extrude(hullPts, 0.5, mat(PALETTE.navy), mat(PALETTE.navy)), { y: 0.9 }));
  g.add(place(extrude(deckPts, 0.05, mat('#6d7a5e')), { y: 1.4 }));
  // bulwark along the cargo deck
  g.add(place(box(length - 3, 0.5, 0.15, mat(PALETTE.navy)), { x: -1.5, y: 1.4, z: B - 0.08 }));
  g.add(place(box(length - 3, 0.5, 0.15, mat(PALETTE.navy)), { x: -1.5, y: 1.4, z: -B + 0.08 }));
  g.add(place(box(0.15, 0.5, bw, mat(PALETTE.navy)), { x: -L + 0.08, y: 1.4 }));
  // superstructure (forward), 2 levels + bridge
  const white = mat(PALETTE.white);
  const sx = L - 3.6;
  g.add(place(box(3.4, 1.3, bw - 0.4, white), { x: sx, y: 1.45 }));
  g.add(place(box(2.8, 1.1, bw - 0.6, white), { x: sx - 0.1, y: 2.75 }));
  g.add(place(box(2.0, 0.9, bw - 0.3, white), { x: sx + 0.1, y: 3.85 }));
  const win = glass(PALETTE.glassDark);
  g.add(place(box(0.08, 0.45, bw - 0.6, win), { x: sx + 1.12, y: 4.1 }));
  g.add(place(box(1.6, 0.45, 0.08, win), { x: sx + 0.1, y: 4.1, z: (bw - 0.3) / 2 }));
  g.add(place(box(1.6, 0.45, 0.08, win), { x: sx + 0.1, y: 4.1, z: -(bw - 0.3) / 2 }));
  for (const z of [-1, 1]) {
    for (let i = 0; i < 3; i++) g.add(place(box(0.4, 0.35, 0.06, win), { x: sx - 1 + i * 0.9, y: 3.15, z: z * ((bw - 0.6) / 2 + 0.01) }));
  }
  g.add(place(box(2.4, 0.08, bw, mat(PALETTE.navy)), { x: sx + 0.1, y: 4.75 }));
  // mast with lights
  g.add(place(box(0.15, 1.8, 0.15, white), { x: sx - 0.2, y: 4.8 }));
  g.add(place(box(0.08, 0.08, 1.4, white), { x: sx - 0.2, y: 6.1 }));
  g.add(place(sphere(0.12, emissive(PALETTE.windowLit, 1.2), 6), { x: sx - 0.2, y: 6.6 }));
  // funnel
  g.add(place(box(0.8, 1.4, 0.6, mat(PALETTE.orange)), { x: sx - 1.6, y: 3.85, z: 0.9 }));
  g.add(place(box(0.8, 1.4, 0.6, mat(PALETTE.orange)), { x: sx - 1.6, y: 3.85, z: -0.9 }));
  // cargo on deck: containers and a bundle of drill pipe
  g.add(place(container({ color: PALETTE.green, length: 2.9 }), { x: -2.2, y: 1.45, z: 0.7, s: 0.8 }));
  g.add(place(container({ color: PALETTE.blue, length: 2.9 }), { x: -4.6, y: 1.45, z: 0.7, s: 0.8 }));
  const pipeM = metal(PALETTE.rust);
  for (let i = 0; i < 5; i++) {
    const py = 1.6 + (i % 2) * 0.24, pz = -0.75 - i * 0.2;
    g.add(beamPipe(V(-5.4, py, pz), V(-1.6, py, pz), 0.14, pipeM));
  }
  // tyre fenders
  const tyre = mat(PALETTE.black);
  for (let i = 0; i < 4; i++) {
    for (const z of [-1, 1]) g.add(place(box(0.5, 0.35, 0.18, tyre), { x: -L + 1.5 + i * 2.6, y: 1.0, z: z * (B + 0.06) }));
  }
  return g;
}

/** Small offshore helicopter, nose towards +X. Origin under the skids. */
export function helicopter({ color = PALETTE.red } = {}) {
  const body = mat(color);
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  const cabin = new THREE.Mesh(new THREE.SphereGeometry(1, 12, 8), body);
  cabin.scale.set(1.9, 0.85, 0.9);
  cabin.position.y = 1.15;
  g.add(cabin);
  const nose = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 6), glass(PALETTE.glassDark));
  nose.scale.set(0.8, 0.55, 0.75);
  nose.position.set(1.25, 1.35, 0);
  g.add(nose);
  g.add(place(box(0.7, 0.2, 0.25, mat(PALETTE.white)), { x: -0.2, y: 1.5, z: 0.82 }));
  g.add(place(box(0.7, 0.2, 0.25, mat(PALETTE.white)), { x: -0.2, y: 1.5, z: -0.82 }));
  g.add(beam(V(-1.5, 1.4, 0), V(-4.4, 1.75, 0), 0.32, body));
  g.add(place(box(0.7, 1.0, 0.1, body), { x: -4.4, y: 1.5 }));
  g.add(place(box(0.08, 0.9, 0.9, dark), { x: -4.4, y: 1.55, z: 0.12 }));
  for (const z of [-0.7, 0.7]) {
    g.add(place(box(2.8, 0.08, 0.1, dark), { z }));
    g.add(beam(V(0.6, 0.05, z), V(0.4, 0.55, z * 0.8), 0.07, dark));
    g.add(beam(V(-0.8, 0.05, z), V(-0.8, 0.55, z * 0.8), 0.07, dark));
  }
  g.add(place(cylinder(0.12, 0.12, 0.4, dark, 6), { y: 2.0 }));
  const blade = mat(PALETTE.black);
  g.add(place(box(7.4, 0.05, 0.22, blade), { y: 2.4, ry: 25 }));
  g.add(place(box(7.4, 0.05, 0.22, blade), { y: 2.4, ry: 115 }));
  return g;
}

import * as THREE from 'three';
import { PALETTE, ShapeBuilder, mat, textured, signTexture, box, place, group, cylinder, sphere, beam, barrelRoof, windowPanel } from '../../src/lib/index.js';

export const RED = '#c62828';
export const YELLOW = '#f4c430';
export const BLUE = '#2b4c9b';
export const GOLD = '#e0b040';

// double-sided flat material (tent cloth, pennants)
export const cloth = (c) => mat(c, { side: THREE.DoubleSide });

// Stadium outline (two semicircles of radius r centred at x = ±L), always the same
// number of points so rings with different r line up stripe for stripe.
function perimeter(r, L, nA, nS) {
  const pts = [];
  for (let k = 0; k < nA; k++) { const a = -Math.PI / 2 + (Math.PI * k) / nA; pts.push([L + r * Math.cos(a), r * Math.sin(a)]); }
  for (let k = 0; k < nS; k++) pts.push([L - (2 * L * k) / nS, r]);
  for (let k = 0; k < nA; k++) { const a = Math.PI / 2 + (Math.PI * k) / nA; pts.push([-L + r * Math.cos(a), r * Math.sin(a)]); }
  for (let k = 0; k < nS; k++) pts.push([-L + (2 * L * k) / nS, -r]);
  return pts;
}

/**
 * Twin-pole big top: striped sidewall, concave striped roof sagging between the two
 * king poles (at x = ±L), blue eave band and a scalloped valance. Origin = centre, ground.
 */
export function bigTop({ L, R, wallH, peak, nA = 12, nS = 4 }) {
  const sb = new ShapeBuilder();
  const H = peak - wallH;
  const ring = (r, y, sag = 0) => perimeter(r, L, nA, nS).map(([x, z]) => [x, y - sag * Math.max(0, 1 - (x / L) ** 2), z]);
  const N = 2 * nA + 2 * nS;
  const strip = (lo, hi, grp) => {
    for (let i = 0; i < N; i++) {
      const j = (i + 1) % N;
      sb.quad(lo[i], lo[j], hi[j], hi[i], grp(i));
    }
  };
  // sidewall (reaches up under the roof so there is no gap)
  strip(ring(R, 0), ring(R, wallH + 0.45), (i) => i % 2);
  // concave roof
  const rings = [ring(R + 0.5, wallH), ring(R * 0.5, wallH + 0.38 * H, 0.35), ring(R * 0.2, wallH + 0.72 * H, 0.8), ring(0.3, peak, 1.2)];
  for (let k = 0; k < rings.length - 1; k++) strip(rings[k], rings[k + 1], (i) => i % 2);
  // cap to the ridge line
  const top = rings[rings.length - 1];
  const c = top.map(([x, y]) => [Math.max(-L, Math.min(L, x)), y + 0.05, 0]);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    if (c[i][0] === c[j][0]) sb.tri(top[i], top[j], c[i], i % 2);
    else sb.quad(top[i], top[j], c[j], c[i], i % 2);
  }
  // eave band + scalloped valance
  const b0 = ring(R + 0.52, wallH + 0.02), b1 = ring(R + 0.52, wallH - 0.35);
  strip(b1, b0, () => 2);
  for (let i = 0; i < N; i++) {
    const j = (i + 1) % N;
    const m = [(b1[i][0] + b1[j][0]) / 2, wallH - 0.9, (b1[i][2] + b1[j][2]) / 2];
    sb.tri(b1[i], b1[j], m, (i + 1) % 2);
  }
  const mesh = new THREE.Mesh(sb.build(), [cloth(RED), cloth(YELLOW), cloth(BLUE)]);
  mesh.userData.eave = ring(R + 0.5, wallH);
  return mesh;
}

/** Cone made of alternating coloured gores. */
export function stripedCone({ r, h, n = 8, a = RED, b = '#f6f1e4' }) {
  const sb = new ShapeBuilder();
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * Math.PI * 2, t1 = ((i + 1) / n) * Math.PI * 2;
    sb.tri([r * Math.cos(t0), 0, r * Math.sin(t0)], [0, h, 0], [r * Math.cos(t1), 0, r * Math.sin(t1)], i % 2);
  }
  return new THREE.Mesh(sb.build(), [cloth(a), cloth(b)]);
}

/** Triangular pennant on a pole top: flies towards +x. */
export function pennant({ len = 1.8, h = 0.9, color = RED }) {
  const sb = new ShapeBuilder();
  sb.tri([0, 0, 0], [len, -h / 2, 0], [0, -h, 0], 0);
  return new THREE.Mesh(sb.build(), [cloth(color)]);
}

/**
 * Strings of bunting: each [from, to, sag] becomes a rope with little triangular
 * flags in rotating colours. One mesh for the flags, one for the ropes.
 */
export function bunting(strings, { spacing = 0.7, colors = [RED, YELLOW, BLUE, '#2e9a48', '#f6f1e4'] } = {}) {
  const flags = new ShapeBuilder();
  const ropes = new ShapeBuilder();
  let ci = 0;
  for (const [a, b, sag] of strings) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
    const at = (t) => A.clone().lerp(B, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0));
    const len = A.distanceTo(B);
    const n = Math.max(2, Math.round(len / spacing));
    const pts = [];
    for (let k = 0; k <= n; k++) pts.push(at(k / n));
    for (let k = 0; k < n; k++) {
      const p = pts[k], q = pts[k + 1];
      // rope as a thin flat ribbon
      ropes.quad([p.x, p.y, p.z], [q.x, q.y, q.z], [q.x, q.y - 0.05, q.z], [p.x, p.y - 0.05, p.z], 0);
      if (k === 0 || k === n - 1) continue;
      const u = p.clone().lerp(q, 0.15), v = p.clone().lerp(q, 0.75), m = p.clone().lerp(q, 0.45);
      flags.tri([u.x, u.y, u.z], [v.x, v.y, v.z], [m.x, m.y - 0.55, m.z], ci++ % colors.length);
    }
  }
  return group(
    new THREE.Mesh(flags.build(), colors.map(cloth)),
    new THREE.Mesh(ropes.build(), [cloth('#3a332c')])
  );
}

/** Big sign with 0..1 UVs (lib sign() shrinks text on faces over 1 m). Text faces +Z (and -Z). */
export function flatSign({ text, w, h, bg = RED, fg = YELLOW, depth = 0.15, border = null, double = true }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Cart wheel, axle along Z, resting on y = 0. */
export function wheel(r = 0.5, t = 0.14, rim = PALETTE.darkGrey, hub = GOLD) {
  const g = new THREE.Group();
  const tyre = new THREE.CylinderGeometry(r, r, t, 14).rotateX(Math.PI / 2);
  const boss = new THREE.CylinderGeometry(r * 0.72, r * 0.72, t + 0.04, 14).rotateX(Math.PI / 2);
  const cap = new THREE.CylinderGeometry(r * 0.2, r * 0.2, t + 0.12, 8).rotateX(Math.PI / 2);
  g.add(new THREE.Mesh(tyre, mat(rim)));
  g.add(new THREE.Mesh(boss, mat(hub)));
  g.add(new THREE.Mesh(cap, mat(PALETTE.darkGrey)));
  g.children.forEach((m) => (m.position.y = r));
  return g;
}

function wheels(g, xs, z, r) {
  for (const [x, rr] of xs.map((x, i) => [x, Array.isArray(r) ? r[i] : r])) {
    g.add(place(wheel(rr), { x, z }));
    g.add(place(wheel(rr), { x, z: -z }));
  }
}

/** Painted wooden showman's wagon (vardo) with a barrel roof; length along X, front (shafts) +X. */
export function vardo({ body = '#2f7d4a', trim = GOLD, roof = RED } = {}) {
  const g = new THREE.Group();
  wheels(g, [-1.1, 1.15], 0.98, [0.72, 0.55]);
  g.add(place(box(3.7, 0.18, 1.6, PALETTE.woodDark), { y: 0.62 }));
  g.add(place(box(3.4, 1.75, 1.8, body), { y: 0.8 }));
  for (const y of [0.8, 2.47]) g.add(place(box(3.5, 0.1, 1.9, trim), { y }));
  for (const x of [-1.68, 1.68]) for (const z of [-0.88, 0.88]) g.add(place(box(0.1, 1.75, 0.1, trim), { x, y: 0.8, z }));
  g.add(place(barrelRoof({ w: 3.7, d: 2.1, h: 0.65, axis: 'x', material: mat(roof), endMaterial: mat(trim) }), { y: 2.57 }));
  for (const x of [-0.8, 0.6]) {
    g.add(place(windowPanel({ w: 0.6, h: 0.6, frame: trim, lit: x > 0 }), { x, y: 1.5, z: 0.9 }));
    g.add(place(windowPanel({ w: 0.6, h: 0.6, frame: trim }), { x, y: 1.5, z: -0.9, ry: 180 }));
  }
  // front door, steps, chimney, shafts
  g.add(place(box(0.08, 1.4, 0.8, PALETTE.woodDark), { x: 1.72, y: 0.9 }));
  g.add(place(box(0.5, 0.08, 0.7, PALETTE.wood), { x: 2.0, y: 0.5 }));
  g.add(place(box(0.5, 0.08, 0.7, PALETTE.wood), { x: 2.2, y: 0.25 }));
  g.add(place(cylinder(0.08, 0.08, 0.7, mat(PALETTE.darkGrey), 6), { x: -1.0, y: 3.0, z: -0.4 }));
  for (const z of [-0.5, 0.5]) g.add(beam([1.75, 0.7, z], [2.75, 0.35, z * 0.7], 0.08, mat(PALETTE.wood)));
  return g;
}

/** Barred animal cage wagon, length along X. animal(): Object3D placed on its floor. */
export function cageWagon({ body = RED, trim = GOLD, animal, label } = {}) {
  const g = new THREE.Group();
  wheels(g, [-1.4, 1.4], 1.02, 0.55);
  g.add(place(box(4.2, 0.3, 1.9, body), { y: 0.72 }));
  g.add(place(box(4.0, 0.04, 1.8, PALETTE.hay), { y: 1.02 }));
  if (animal) g.add(place(animal, { y: 1.06 }));
  // solid ends, corner posts, bars on the long sides
  for (const x of [-2.0, 2.0]) g.add(place(box(0.15, 1.5, 1.9, body), { x, y: 1.02 }));
  for (const x of [-2.0, 2.0]) for (const z of [-0.92, 0.92]) g.add(place(box(0.18, 1.5, 0.18, trim), { x, y: 1.02, z }));
  const barM = mat(GOLD, { metalness: 0.3, roughness: 0.5 });
  for (const z of [-0.9, 0.9]) {
    g.add(place(box(3.9, 0.1, 0.08, trim), { y: 1.02, z }));
    for (let x = -1.65; x <= 1.66; x += 0.3) g.add(place(cylinder(0.035, 0.035, 1.45, barM, 5), { x, y: 1.05, z }));
  }
  // roof with gold cornice and a name board
  g.add(place(box(4.5, 0.12, 2.25, trim), { y: 2.5 }));
  g.add(place(box(4.3, 0.28, 2.05, body), { y: 2.62 }));
  g.add(place(box(3.6, 0.18, 1.5, trim), { y: 2.9 }));
  if (label) {
    g.add(place(flatSign({ text: label, w: 2.4, h: 0.55, bg: body, fg: YELLOW, depth: 0.08, double: false }), { y: 3.0, z: 0.6 }));
    g.add(place(flatSign({ text: label, w: 2.4, h: 0.55, bg: body, fg: YELLOW, depth: 0.08, double: false }), { y: 3.0, z: -0.6, ry: 180 }));
  }
  g.add(beam([2.1, 0.75, 0], [2.8, 0.45, 0], 0.1, mat(PALETTE.darkGrey)));
  return g;
}

/** Standing lion facing +X. */
export function lion() {
  const fur = mat('#d9a441'), mane = mat('#8f4f1c');
  const g = new THREE.Group();
  for (const x of [-0.45, 0.4]) for (const z of [-0.18, 0.18]) g.add(place(box(0.16, 0.5, 0.16, fur), { x, z }));
  g.add(place(box(1.2, 0.45, 0.5, fur), { y: 0.45 }));
  g.add(place(box(0.35, 0.75, 0.75, mane), { x: 0.6, y: 0.45 }));
  g.add(place(box(0.35, 0.36, 0.36, fur), { x: 0.82, y: 0.68 }));
  g.add(beam([-0.6, 0.8, 0], [-1.0, 0.5, 0], 0.06, fur));
  return g;
}

/** Striped tiger lying down, facing +X. */
export function tiger() {
  const fur = mat('#e0832a'), dark = mat('#2a2420');
  const g = new THREE.Group();
  g.add(place(box(1.3, 0.4, 0.55, fur), {}));
  for (const x of [-0.4, -0.1, 0.2]) g.add(place(box(0.08, 0.42, 0.57, dark), { x }));
  g.add(place(box(0.38, 0.38, 0.4, fur), { x: 0.75, y: 0.15 }));
  g.add(place(box(0.5, 0.12, 0.14, fur), { x: 0.75, z: 0.18 }));
  g.add(beam([-0.65, 0.25, 0], [-1.1, 0.1, 0.3], 0.07, fur));
  return g;
}

/** Circus elephant in a red saddle cloth, facing +X. */
export function elephant() {
  const skin = mat('#8d8e93');
  const g = new THREE.Group();
  for (const x of [-0.65, 0.6]) for (const z of [-0.38, 0.38]) g.add(place(cylinder(0.22, 0.24, 1.0, skin, 8), { x, z }));
  g.add(place(box(2.0, 1.25, 1.25, skin), { y: 0.85 }));
  g.add(place(box(1.1, 0.75, 1.3, RED), { x: -0.05, y: 1.45 }));
  g.add(place(box(1.12, 0.1, 1.32, GOLD), { x: -0.05, y: 1.45 }));
  g.add(place(box(0.8, 0.85, 0.9, skin), { x: 1.25, y: 1.25 }));
  for (const z of [-0.55, 0.55]) g.add(place(box(0.12, 0.75, 0.55, skin), { x: 1.0, y: 1.2, z, ry: z > 0 ? -15 : 15 }));
  g.add(place(box(0.5, 0.25, 0.92, RED), { x: 1.3, y: 2.08 }));
  g.add(place(sphere(0.12, mat(GOLD), 6), { x: 1.3, y: 2.3 }));
  g.add(beam([1.6, 1.4, 0], [1.85, 0.9, 0], 0.22, skin));
  g.add(beam([1.85, 0.95, 0], [1.95, 0.35, 0], 0.17, skin));
  for (const z of [-0.2, 0.2]) g.add(beam([1.65, 1.2, z], [1.95, 1.05, z * 1.2], 0.07, mat('#f3ecd9')));
  g.add(beam([-1.0, 1.6, 0], [-1.15, 0.9, 0], 0.06, skin));
  return g;
}

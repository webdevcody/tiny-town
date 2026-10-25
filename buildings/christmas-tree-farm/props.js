import * as THREE from 'three';
import {
  PALETTE, place, group, box, cylinder, cone, sphere, beam, mat, metal, emissive, textured, signTexture, shade, car,
} from '../../src/lib/index.js';

const FIR = ['#2b5e2a', '#2f6224', '#326b33', '#28552c', '#36703a'];
const BULBS = ['#ff4a3a', '#ffd23a', '#4ad05a', '#4aa8ff', '#ff8a2a'];

/** Christmas tree: trunk + three stacked tiers. Origin at the base. */
export function fir(h, { seed = 0, color } = {}) {
  const leaf = mat(color ?? FIR[seed % FIR.length]);
  const r = h * 0.3;
  return group(
    cylinder(h * 0.035, h * 0.045, h * 0.16, mat(PALETTE.trunk), 5),
    place(cone(r, h * 0.48, leaf, 7), { y: h * 0.1 }),
    place(cone(r * 0.78, h * 0.42, leaf, 7), { y: h * 0.33, ry: 25 }),
    place(cone(r * 0.52, h * 0.36, leaf, 7), { y: h * 0.64, ry: 50 }),
  );
}

/** Tree stump with a sawn top. */
export function stump() {
  return group(cylinder(0.1, 0.12, 0.18, mat(PALETTE.trunk), 6), place(cylinder(0.09, 0.09, 0.02, mat(PALETTE.woodLight), 6), { y: 0.18 }));
}

/** Cut tree wrapped in white netting, lying along +X (butt at x=0). */
export function nettedTree(len = 2, r = 0.3) {
  const net = mat('#c9d8c4');
  const leaf = mat('#3d7440');
  const b = 0.15 + len * 0.3; // widest point
  const g = group(
    place(cylinder(0.05, 0.05, 0.2, mat(PALETTE.trunk), 5), { rz: -90 }),
    place(cylinder(r, r * 0.7, len * 0.3, leaf, 7), { x: 0.15, rz: -90 }),
    place(cylinder(0.02, r, len * 0.7, leaf, 7), { x: b, rz: -90 }),
  );
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    const rr = r * (1 - t) + 0.03;
    g.add(place(cylinder(rr * 1.06, rr * 1.06, 0.06, net, 7), { x: b + len * 0.7 * t, rz: -90 }));
  }
  return g;
}

/** Fake-catenary string of bulbs from a to b. */
export function stringLights(a, b, { count, sag = 0.25, seed = 0, wire = true } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const n = count ?? Math.max(3, Math.round(A.distanceTo(B) / 0.45));
  const g = new THREE.Group();
  let prev = null;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const p = A.clone().lerp(B, t);
    p.y -= sag * 4 * t * (1 - t);
    if (wire && prev) g.add(beam(prev, p, 0.025, mat(PALETTE.black)));
    prev = p;
    if (i > 0 && i < n || n < 3) g.add(place(sphere(0.09, emissive(BULBS[(i + seed) % BULBS.length], 1.6), 4), { x: p.x, y: p.y - 0.09, z: p.z }));
  }
  return g;
}

/**
 * Sign with 0..1 UVs on every face, so the text fills faces of any size
 * (the lib sign() uses metre UVs and shrinks text on faces over 1 m).
 */
export function bigSign(text, w, h, { bg = PALETTE.red, fg = '#ffffff', depth = 0.15, border = null, double = true } = {}) {
  const th = Math.max(16, Math.round(256 / (w / h)));
  const tex = signTexture(text, { bg, fg, width: 256, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Evergreen wreath with a red bow, facing +Z. */
export function wreath(r = 0.45) {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(r, r * 0.3, 5, 12), mat(PALETTE.foliageDark));
  ring.position.y = r * 1.3;
  const bow = mat(PALETTE.red);
  return group(
    ring,
    place(box(r * 0.7, r * 0.35, 0.12, bow), { y: r * 0.15, z: r * 0.2 }),
    place(box(0.1, r * 0.5, 0.06, bow), { x: -0.1, y: -r * 0.2, z: r * 0.2, rz: 15 }),
    place(box(0.1, r * 0.5, 0.06, bow), { x: 0.1, y: -r * 0.2, z: r * 0.2, rz: -15 }),
  );
}

/**
 * Tree baler / netting machine: steel stand, big red funnel facing -X, net ring,
 * roller table out to +X with a freshly netted tree. Length ~3.4 m along X.
 */
export function nettingMachine() {
  const red = mat('#c8332a', { roughness: 0.5, metalness: 0.3 });
  const steel = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  // stand
  for (const x of [-0.9, 0.3]) for (const z of [-0.35, 0.35]) g.add(place(box(0.08, 0.9, 0.08, steel), { x, z }));
  g.add(place(box(1.4, 0.1, 0.8, steel), { x: -0.3, y: 0.85 }));
  // funnel: wide mouth at -X narrowing to the net ring
  const funnel = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.3, 1.2, 12, 1, true), mat('#c8332a', { roughness: 0.5, metalness: 0.3, side: THREE.DoubleSide }));
  funnel.rotation.z = -Math.PI / 2;
  funnel.position.set(-0.6, 1.55, 0);
  g.add(funnel);
  g.add(place(cylinder(0.42, 0.42, 0.35, red, 12), { x: 0.15, y: 1.55, rz: 90 }));
  g.add(place(cylinder(0.3, 0.3, 0.38, mat('#e8eee4'), 10), { x: 0.15, y: 1.55, rz: 90 })); // net roll
  g.add(place(box(0.4, 0.5, 0.3, red), { x: -0.2, y: 0.9, z: 0.45 })); // motor box
  // roller table
  g.add(place(box(1.9, 0.08, 0.7, steel), { x: 1.35, y: 0.95 }));
  for (const x of [0.6, 2.2]) for (const z of [-0.3, 0.3]) g.add(place(box(0.06, 0.95, 0.06, steel), { x, z }));
  for (let i = 0; i < 6; i++) g.add(place(cylinder(0.05, 0.05, 0.7, metal(PALETTE.steelLight), 6), { x: 0.55 + i * 0.33, y: 1.05, rx: 90 }));
  // tree coming out netted
  g.add(place(nettedTree(1.9, 0.28), { x: 0.4, y: 1.35 }));
  // a tree waiting at the funnel mouth, butt first
  const w = fir(1.9, { seed: 3 });
  w.rotation.z = Math.PI / 2 - 0.15;
  w.position.set(-1.3, 1.35, 0);
  g.add(w);
  return g;
}

/** Car with a netted tree strapped to the roof. Length along X. */
export function carWithTree(color, seed = 0) {
  const g = car({ color });
  g.add(place(box(2.0, 0.06, 0.08, mat(PALETTE.black)), { y: 1.68, z: 0.6 }));
  g.add(place(box(2.0, 0.06, 0.08, mat(PALETTE.black)), { y: 1.68, z: -0.6 }));
  g.add(place(nettedTree(2.9, 0.38), { x: -1.5, y: 2.05, ry: seed ? 4 : -3 }));
  return g;
}

/** Pickup truck with a couple of netted trees in the bed. Length along X (~5 m). */
export function pickup(color) {
  const body = mat(color, { roughness: 0.4, metalness: 0.3 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = new THREE.Group();
  g.add(place(box(5, 0.7, 1.9, body), { y: 0.35 }));
  g.add(place(box(1.9, 0.75, 1.8, body), { x: 0.9, y: 1.05 }));
  g.add(place(box(1.6, 0.5, 1.82, glassM), { x: 0.9, y: 1.15 }));
  g.add(place(box(1.95, 0.08, 1.85, body), { x: 0.9, y: 1.8 }));
  // bed walls
  g.add(place(box(2.4, 0.45, 0.08, body), { x: -1.3, y: 1.05, z: 0.9 }));
  g.add(place(box(2.4, 0.45, 0.08, body), { x: -1.3, y: 1.05, z: -0.9 }));
  g.add(place(box(0.08, 0.45, 1.88, body), { x: -2.5, y: 1.05 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [1.6, -1.6]) for (const sz of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.38, 0.38, 0.28, 10);
    wg.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wg, wheelM);
    wheel.position.set(x, 0.38, sz * 0.9);
    g.add(wheel);
  }
  g.add(place(nettedTree(2.8, 0.36), { x: -0.3, y: 1.45, z: 0.4, ry: 180 }));
  g.add(place(nettedTree(2.6, 0.34), { x: -0.2, y: 1.45, z: -0.4, ry: 176 }));
  return g;
}

/** Simple figure (~1.75 m). Faces +Z. */
export function person(shirt, { pants = PALETTE.navy, hat = null } = {}) {
  const g = group(
    place(box(0.14, 0.8, 0.18, mat(pants)), { x: -0.1 }),
    place(box(0.14, 0.8, 0.18, mat(pants)), { x: 0.1 }),
    place(box(0.44, 0.6, 0.26, mat(shirt)), { y: 0.8 }),
    place(sphere(0.14, mat('#e8b48e'), 6), { y: 1.42 }),
  );
  if (hat) g.add(place(cone(0.16, 0.3, mat(hat), 6), { y: 1.64 }));
  return g;
}

export { shade };

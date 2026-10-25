import * as THREE from 'three';
import {
  PALETTE, box, cylinder, beam, place, group, mat, metal, water, lattice, textured, signTexture,
} from '../../src/lib/index.js';

const HORN = '#efe4c4';
const HORN_TIP = '#3a2e22';
const SKIN = '#e0a77c';

/**
 * Texas longhorn, facing +X, origin on the ground under the middle of the body.
 * coat / patch are colours; graze lowers the head.
 */
export function longhorn({ coat = '#9a4b25', patch = null, graze = false } = {}) {
  const g = new THREE.Group();
  const cm = mat(coat);
  const dark = mat('#3b2a1e');
  // legs + hooves
  for (const x of [-0.72, 0.72]) for (const z of [-0.26, 0.26]) {
    g.add(place(box(0.17, 0.72, 0.17, cm), { x, z }));
    g.add(place(box(0.19, 0.1, 0.19, dark), { x, z }));
  }
  // body (deep chest, slight hump)
  g.add(place(box(2.0, 0.85, 0.82, cm), { y: 0.68 }));
  g.add(place(box(0.7, 0.18, 0.6, cm), { x: 0.5, y: 1.5 }));
  if (patch) {
    const pm = mat(patch);
    g.add(place(box(0.8, 0.6, 0.86, pm), { x: -0.25, y: 0.78 }));
    g.add(place(box(0.45, 0.4, 0.86, pm), { x: 0.6, y: 0.95 }));
  }
  // tail
  g.add(place(box(0.08, 0.75, 0.08, cm), { x: -1.02, y: 0.75 }));
  g.add(place(box(0.12, 0.2, 0.12, dark), { x: -1.02, y: 0.62 }));
  // neck + head
  const head = new THREE.Group();
  head.add(place(box(0.5, 0.42, 0.4, cm), { x: 0.2, y: -0.2 }));
  head.add(place(box(0.24, 0.3, 0.34, mat(shade(coat))), { x: 0.52, y: -0.22 }));
  head.add(place(box(0.08, 0.12, 0.38, mat('#2b2018')), { x: 0.66, y: -0.08 }));
  // ears
  head.add(place(box(0.08, 0.1, 0.9, cm), { x: 0.05, y: 0.1 }));
  // the famous horns: wide sweep out, then forward and up
  const hm = mat(HORN);
  const tm = mat(HORN_TIP);
  for (const s of [-1, 1]) {
    head.add(beam([0.1, 0.2, 0], [0.14, 0.27, s * 0.8], 0.15, hm));
    head.add(beam([0.14, 0.26, s * 0.76], [0.3, 0.5, s * 1.22], 0.12, hm));
    head.add(beam([0.29, 0.48, s * 1.19], [0.44, 0.8, s * 1.34], 0.09, tm));
  }
  g.add(place(box(0.5, 0.5, 0.5, cm), { x: 1.05, y: graze ? 0.75 : 1.0 }));
  head.position.set(1.25, graze ? 0.8 : 1.35, 0);
  if (graze) head.rotation.z = -0.6;
  g.add(head);
  return g;
}

function shade(hex) {
  const c = new THREE.Color(hex);
  c.lerp(new THREE.Color('#e8d6c0'), 0.35);
  return '#' + c.getHexString();
}

/** Cowboy (~1.85 m with hat) facing +Z. */
export function cowboy({ shirt = PALETTE.red, hat = '#b48a55', jeans = '#36507a', armsUp = false } = {}) {
  const g = new THREE.Group();
  const jm = mat(jeans);
  const boots = mat('#4a2f1b');
  const sm = mat(shirt);
  for (const x of [-0.11, 0.11]) {
    g.add(place(box(0.16, 0.25, 0.22, boots), { x, z: 0.02 }));
    g.add(place(box(0.15, 0.62, 0.17, jm), { x, y: 0.25 }));
  }
  g.add(place(box(0.42, 0.06, 0.24, mat('#3b2a1e')), { y: 0.86 }));
  g.add(place(box(0.42, 0.55, 0.26, sm), { y: 0.9 }));
  for (const s of [-1, 1]) {
    if (armsUp) g.add(place(box(0.12, 0.55, 0.12, sm), { x: s * 0.27, y: 1.15, z: 0.12, rx: -70 }));
    else g.add(place(box(0.12, 0.55, 0.12, sm), { x: s * 0.27, y: 0.9 }));
  }
  g.add(place(box(0.14, 0.06, 0.2, mat('#d64a3a')), { y: 1.42, z: 0.04 })); // bandana
  g.add(place(box(0.26, 0.28, 0.26, mat(SKIN)), { y: 1.45 }));
  const hm = mat(hat);
  g.add(place(cylinder(0.38, 0.38, 0.04, hm, 14), { y: 1.7 }));
  g.add(place(cylinder(0.15, 0.18, 0.2, hm, 10), { y: 1.72 }));
  g.add(place(cylinder(0.185, 0.185, 0.04, mat('#3b2a1e'), 10), { y: 1.74 }));
  return g;
}

/** Cowboy on a quarter horse, facing +X. */
export function mountedCowboy({ horse = '#7a4a2a', shirt = PALETTE.blue, hat = '#e8dcc0' } = {}) {
  const g = new THREE.Group();
  const hm = mat(horse);
  const mane = mat('#2a1e16');
  for (const x of [-0.65, 0.65]) for (const z of [-0.2, 0.2]) {
    g.add(place(box(0.13, 0.95, 0.13, hm), { x, z }));
    g.add(place(box(0.15, 0.12, 0.15, mane), { x, z }));
  }
  g.add(place(box(1.75, 0.65, 0.6, hm), { y: 0.92 }));
  g.add(beam([0.75, 1.3, 0], [1.15, 1.95, 0], 0.4, hm));
  g.add(beam([0.68, 1.45, 0], [1.05, 2.1, 0], 0.12, mane));
  g.add(place(box(0.55, 0.28, 0.3, hm), { x: 1.38, y: 1.82, rz: -25 }));
  g.add(place(box(0.08, 0.16, 0.24, hm), { x: 1.08, y: 2.12 }));
  g.add(beam([-0.85, 1.45, 0], [-1.05, 0.75, 0], 0.13, mane));
  // saddle + rider
  g.add(place(box(0.6, 0.12, 0.66, mat('#5b3a20')), { x: 0.05, y: 1.55 }));
  const jm = mat('#36507a');
  for (const s of [-1, 1]) g.add(place(box(0.5, 0.15, 0.15, jm), { x: 0.15, y: 1.6, z: s * 0.28 }));
  for (const s of [-1, 1]) g.add(place(box(0.15, 0.55, 0.15, jm), { x: 0.32, y: 1.12, z: s * 0.36 }));
  const sm = mat(shirt);
  g.add(place(box(0.28, 0.55, 0.42, sm), { x: 0.0, y: 1.7 }));
  g.add(place(box(0.5, 0.12, 0.12, sm), { x: 0.25, y: 1.98, z: 0.25, rz: -15 }));
  g.add(place(box(0.12, 0.5, 0.12, sm), { x: 0.0, y: 2.25, z: -0.26, rx: 25 })); // waving a lasso
  // lasso loop
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.03, 4, 14), mat('#d8c08a'));
  loop.rotation.x = Math.PI / 2;
  loop.position.set(0.05, 2.85, -0.5);
  g.add(loop);
  g.add(place(box(0.26, 0.28, 0.26, mat(SKIN)), { x: 0.0, y: 2.25 }));
  const htm = mat(hat);
  g.add(place(cylinder(0.38, 0.38, 0.04, htm, 14), { x: 0.0, y: 2.5 }));
  g.add(place(cylinder(0.15, 0.18, 0.2, htm, 10), { x: 0.0, y: 2.52 }));
  g.add(place(cylinder(0.185, 0.185, 0.04, mat('#3b2a1e'), 10), { x: 0.0, y: 2.54 }));
  return g;
}

/** Three-rail post-and-rail fence segment from [x,z] a to b, base on y = 0. */
export function railFence(a, b, { h = 1.35, post = 0.18, rails = 3, color = PALETTE.wood, postColor = PALETTE.woodDark } = {}) {
  const g = new THREE.Group();
  const [ax, az] = a, [bx, bz] = b;
  const len = Math.hypot(bx - ax, bz - az);
  const n = Math.max(1, Math.round(len / 2.2));
  const pm = mat(postColor), rm = mat(color);
  const ang = Math.atan2(-(bz - az), bx - ax);
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    g.add(place(box(post, h + 0.1, post, pm), { x: ax + (bx - ax) * t, z: az + (bz - az) * t }));
  }
  for (let r = 0; r < rails; r++) {
    const y = h * (0.32 + (0.62 * r) / Math.max(1, rails - 1));
    const rail = box(len, 0.12, 0.08, rm);
    rail.position.set((ax + bx) / 2, y, (az + bz) / 2);
    rail.rotation.y = ang;
    g.add(rail);
  }
  return g;
}

/** Wooden field gate (5 bars + diagonal brace), hinged at origin, extends along +X. */
export function ranchGate({ w = 3, h = 1.3, color = PALETTE.woodLight } = {}) {
  const g = new THREE.Group();
  const m = mat(color);
  for (let i = 0; i < 4; i++) g.add(place(box(w, 0.1, 0.07, m), { x: w / 2, y: 0.25 + i * (h - 0.35) / 3 }));
  g.add(place(box(0.12, h, 0.09, m), { x: 0.06 }));
  g.add(place(box(0.12, h, 0.09, m), { x: w - 0.06 }));
  g.add(beam([0.1, 0.25, 0], [w - 0.1, h - 0.1, 0], 0.09, m));
  return g;
}

/**
 * Windpump (American farm windmill): lattice tower, many-bladed wheel facing +Z
 * at hub height h, tail vane behind.
 */
export function windpump({ h = 9, radius = 1.6, blades = 18 } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelLight, { roughness: 0.5 });
  const dark = metal(PALETTE.steelDark);
  g.add(lattice({ w: 2.2, topW: 0.45, h: h - 0.4, segments: 5, thickness: 0.12, material: steel }));
  // concrete footings
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.4, 0.2, 0.4, mat(PALETTE.concrete)), { x: sx * 1.1, z: sz * 1.1 }));
  // platform near the top
  g.add(place(box(1.2, 0.08, 1.2, mat(PALETTE.woodDark)), { y: h - 1.6 }));
  // gearbox head
  g.add(place(box(0.5, 0.45, 0.8, dark), { y: h - 0.45 }));
  // wheel: hub, blades, two rings
  const wheel = new THREE.Group();
  wheel.add(place(cylinder(0.18, 0.18, 0.3, dark, 10), { rx: 90, z: 0.15 }));
  const bm = metal('#e6e8ea', { roughness: 0.45 });
  for (let i = 0; i < blades; i++) {
    const a = (i / blades) * Math.PI * 2;
    const pivot = new THREE.Group();
    pivot.rotation.z = a;
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.34, radius * 0.66, 0.03), bm);
    b2.geometry.translate(0, radius * 0.31 + radius * 0.34, 0);
    b2.rotation.y = 0.45;
    pivot.add(b2);
    wheel.add(pivot);
    wheel.add(beam([0, 0, 0], [Math.cos(a) * radius * 0.35, Math.sin(a) * radius * 0.35, 0], 0.04, dark));
  }
  for (const r of [radius * 0.34, radius * 0.98]) {
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r, 0.04, 4, 28), dark);
    wheel.add(ring);
  }
  wheel.position.set(0, h, 0.55);
  g.add(wheel);
  // tail vane
  g.add(beam([0, h, 0.2], [0, h + 0.1, -2.4], 0.07, dark));
  g.add(place(box(0.05, 1.0, 1.5, mat(PALETTE.red)), { y: h - 0.35, z: -2.5 }));
  // pump rod down to the well head
  g.add(place(box(0.05, h - 0.5, 0.05, dark), { y: 0 }));
  g.add(place(cylinder(0.18, 0.18, 0.8, dark, 10), {}));
  return g;
}

/** Round galvanised stock tank full of water. */
export function stockTank({ r = 1.2, h = 0.7 } = {}) {
  const g = new THREE.Group();
  const geo = new THREE.CylinderGeometry(r, r, h, 20, 1, true).translate(0, h / 2, 0);
  g.add(new THREE.Mesh(geo, metal(PALETTE.steelLight, { roughness: 0.5 }).clone()));
  g.children[0].material.side = THREE.DoubleSide;
  g.add(place(cylinder(r - 0.02, r - 0.02, h - 0.12, water(), 20), {}));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.05, 4, 20), metal(PALETTE.steel));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = h;
  g.add(rim);
  return g;
}

/** Long wooden feed/water trough along X. */
export function trough({ w = 3, d = 0.8, h = 0.6, fill = 'water' } = {}) {
  const g = new THREE.Group();
  const m = mat(PALETTE.woodDark);
  g.add(place(box(w, 0.12, d, m), { y: 0.12 }));
  g.add(place(box(w, h - 0.12, 0.1, m), { y: 0.12, z: d / 2 - 0.05 }));
  g.add(place(box(w, h - 0.12, 0.1, m), { y: 0.12, z: -d / 2 + 0.05 }));
  g.add(place(box(0.1, h - 0.12, d, m), { x: w / 2 - 0.05, y: 0.12 }));
  g.add(place(box(0.1, h - 0.12, d, m), { x: -w / 2 + 0.05, y: 0.12 }));
  const fm = fill === 'water' ? water() : mat(PALETTE.hay);
  g.add(place(box(w - 0.2, h - 0.25, d - 0.2, fm), { y: 0.12 }));
  for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) g.add(place(box(0.14, 0.12, d + 0.1, m), { x }));
  return g;
}

/** Pickup truck along X, front at +X. */
export function pickup({ color = '#2f8a8a' } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.25 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  g.add(place(box(5.0, 0.7, 1.9, body), { y: 0.38 }));
  g.add(place(box(1.6, 0.75, 1.8, body), { x: 0.55, y: 1.08 }));
  g.add(place(box(1.5, 0.5, 1.82, glassM), { x: 0.5, y: 1.15 }));
  g.add(place(box(0.08, 0.5, 1.6, glassM), { x: 1.38, y: 1.15 }));
  // open bed
  g.add(place(box(2.1, 0.45, 0.1, body), { x: -1.4, y: 1.08, z: 0.9 }));
  g.add(place(box(2.1, 0.45, 0.1, body), { x: -1.4, y: 1.08, z: -0.9 }));
  g.add(place(box(0.1, 0.45, 1.9, body), { x: -2.45, y: 1.08 }));
  g.add(place(box(1.95, 0.02, 1.7, mat('#2a2a2c')), { x: -1.4, y: 1.08 }));
  g.add(place(box(0.8, 0.5, 1.1, mat(PALETTE.hay)), { x: -1.2, y: 1.1 }));
  g.add(place(box(0.12, 0.2, 1.6, mat(PALETTE.chrome)), { x: 2.5, y: 0.45 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [1.6, -1.55]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.4, 0.4, 0.28, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.4, sz * 0.88);
    g.add(wheel);
  }
  return g;
}

/**
 * Sign board with proper 0..1 UVs so the text fills the face (the lib sign()
 * uses metre UVs and shrinks text on boards over 1 m). Text faces +Z and -Z.
 */
export function board({ text, w, h, d = 0.12, bg = '#5a3a20', fg = '#f3e2b8', border = '#3a2412', key }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border, font: 'bold' });
  const face = textured(tex);
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

/** Bleached steer skull with horns, facing +Z. */
export function steerSkull({ s = 1 } = {}) {
  const g = new THREE.Group();
  const bone = mat('#f2ead6');
  g.add(place(box(0.45, 0.55, 0.25, bone), { y: -0.3 }));
  g.add(place(box(0.3, 0.3, 0.22, bone), { y: -0.55 }));
  for (const sx of [-0.11, 0.11]) g.add(place(box(0.1, 0.1, 0.05, mat('#2b2018')), { x: sx, y: -0.08, z: 0.12 }));
  for (const sx of [-1, 1]) {
    g.add(beam([0, 0.1, 0], [sx * 0.85, 0.15, 0], 0.12, bone));
    g.add(beam([sx * 0.83, 0.14, 0], [sx * 1.3, 0.55, 0], 0.1, bone));
  }
  g.scale.setScalar(s);
  return g;
}

/** Simple rocking chair facing +Z. */
export function rockingChair() {
  const m = mat(PALETTE.woodLight);
  return group(
    place(box(0.5, 0.08, 0.5, m), { y: 0.42 }),
    place(box(0.5, 0.65, 0.08, m), { y: 0.45, z: -0.24, rx: -10 }),
    place(box(0.06, 0.06, 0.8, m), { x: -0.22, y: 0.02 }),
    place(box(0.06, 0.06, 0.8, m), { x: 0.22, y: 0.02 }),
    place(box(0.06, 0.42, 0.06, m), { x: -0.22, z: 0.2 }),
    place(box(0.06, 0.42, 0.06, m), { x: 0.22, z: 0.2 }),
    place(box(0.06, 0.42, 0.06, m), { x: -0.22, z: -0.2 }),
    place(box(0.06, 0.42, 0.06, m), { x: 0.22, z: -0.2 }),
  );
}


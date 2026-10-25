import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, mat, metal, glass, water, emissive,
  tree, streetLamp, bench, fence, rng,
} from '../../src/lib/index.js';
import { waveHall, bigSign, whale, seal, fish } from './parts.js';

// Ring/blob in the ground plane: points [[x, z]…] extruded h up (optionally with a hole).
function flatShape(points, h, material, hole = null) {
  const s = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  if (hole) s.holes.push(new THREE.Path(hole.map(([x, z]) => new THREE.Vector2(x, -z))));
  const geo = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: false, curveSegments: 6 });
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

function ellipse(cx, cz, rx, rz, n = 14, wobble = 0, seed = 1) {
  const r = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + (wobble ? r.range(-wobble, wobble) : 0);
    pts.push([cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k]);
  }
  return pts;
}

function rock(size, seed, color = '#8f877a') {
  const r = rng(seed);
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(size, 0), mat(color));
  m.scale.set(r.range(0.9, 1.3), r.range(0.55, 0.8), r.range(0.9, 1.3));
  m.rotation.y = r.range(0, Math.PI);
  return m;
}

function person(color, seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.add(cylinder(0.17, 0.2, 0.95, mat(color), 6));
  g.add(place(box(0.32, 0.55, 0.22, mat(r.pick([PALETTE.navy, PALETTE.darkGrey, '#4a5d7a']))), {}));
  g.add(place(sphere(0.15, mat('#e0b48c'), 6), { y: 0.95 }));
  return g;
}

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  // --- wave hall -----------------------------------------------------------
  const hallD = 6.5, hallZ = -1.45; // z -4.7 .. 1.8
  const front = hallZ + hallD / 2;
  g.add(place(waveHall({ depth: hallD }), { y: y0, z: hallZ }));
  // pale plinth strip so the hall sits on something
  g.add(place(box(12.4, 0.3, hallD + 0.3, mat(PALETTE.offWhite)), { x: -3.5, y: y0, z: hallZ }));

  // entrance: glass doors, wave-blue canopy and the big sign
  const ex = -4.4;
  g.add(place(box(3.2, 2.5, 0.2, glass(PALETTE.glassDark)), { x: ex, y: y0 + 0.3, z: front + 0.05 }));
  for (const dx of [-1.6, -0.55, 0.55, 1.6]) g.add(place(box(0.1, 2.5, 0.26, mat(PALETTE.frame)), { x: ex + dx, y: y0 + 0.3, z: front + 0.05 }));
  g.add(place(box(4.6, 0.22, 1.9, mat('#2f7fca')), { x: ex, y: y0 + 3.0, z: front + 0.95 }));
  g.add(place(box(4.6, 0.1, 0.12, mat('#f4fbff')), { x: ex, y: y0 + 3.22, z: front + 1.85 }));
  for (const dx of [-2.1, 2.1]) g.add(place(cylinder(0.08, 0.08, 3.0, metal(PALETTE.steelLight), 6), { x: ex + dx, y: y0, z: front + 1.75 }));
  g.add(place(bigSign({ text: 'AQUARIUM', w: 5.0, h: 1.15, bg: '#f4fbff', fg: '#1b4f8e', border: '#1b4f8e' }), { x: ex + 0.2, y: y0 + 4.55, z: front + 0.12 }));

  // --- whale fountain (front left) ------------------------------------------
  const fx = -7.4, fz = 3.4;
  g.add(place(cylinder(1.55, 1.65, 0.5, mat(PALETTE.offWhite), 20), { x: fx, y: y0, z: fz }));
  g.add(place(cylinder(1.35, 1.35, 0.06, water(PALETTE.pool), 20), { x: fx, y: y0 + 0.45, z: fz }));
  g.add(place(whale({ color: '#34506e' }), { x: fx + 1.4, y: y0 + 3.4, z: fz, rz: 48, ry: -8, s: 0.9 }));
  // splash around the tail
  const foam = mat('#f4fbff', { roughness: 0.3 });
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2;
    g.add(place(cone(0.22, 0.5 + (i % 3) * 0.25, foam, 5), { x: fx - 0.2 + Math.cos(a) * 0.7, y: y0 + 0.45, z: fz + Math.sin(a) * 0.7 }));
  }
  // jets from the basin rim
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    g.add(place(cylinder(0.04, 0.07, 0.9, foam, 5), { x: fx + Math.cos(a) * 1.2, y: y0 + 0.45, z: fz + Math.sin(a) * 1.2 }));
  }

  // --- glass tunnel wing (back right) -----------------------------------------
  const tx = 6.05, tz = -3.1, tw = 6.9, td = 3.3, th = 2.9;
  const steel = metal(PALETTE.steelLight);
  g.add(place(box(tw + 0.2, 0.4, td + 0.2, mat(PALETTE.offWhite)), { x: tx, y: y0, z: tz }));
  const ty = y0 + 0.4;
  g.add(place(box(tw, 0.2, td, mat(PALETTE.sand)), { x: tx, y: ty, z: tz }));
  // walk-through tunnel: glass vault with steel ribs
  const tun = new THREE.CylinderGeometry(1.05, 1.05, tw, 20, 1, true, 0, Math.PI);
  tun.rotateZ(Math.PI / 2);
  g.add(place(new THREE.Mesh(tun, glass('#cfeefa', { opacity: 0.55 })), { x: tx, y: ty + 0.2, z: tz }));
  for (let i = 0; i <= 6; i++) {
    const rib = new THREE.TorusGeometry(1.07, 0.05, 4, 14, Math.PI);
    rib.rotateY(Math.PI / 2);
    g.add(place(new THREE.Mesh(rib, steel), { x: tx - tw / 2 + 0.15 + (i * (tw - 0.3)) / 6, y: ty + 0.2, z: tz }));
  }
  g.add(place(box(tw, 0.06, 2.0, mat(PALETTE.darkGrey)), { x: tx, y: ty + 0.2, z: tz }));
  // corals, kelp and fish in the tank
  const r = rng(77);
  const coral = [PALETTE.salmon, PALETTE.orange, PALETTE.pink, PALETTE.purple, PALETTE.yellow];
  for (let i = 0; i < 10; i++) {
    const side = i % 2 ? 1 : -1;
    const cx = tx - tw / 2 + 0.4 + (i * (tw - 0.8)) / 9;
    const cz = tz + side * r.range(1.25, 1.45);
    if (i % 3 === 0) g.add(place(box(0.08, r.range(1.2, 2.2), 0.08, mat(PALETTE.foliageLight)), { x: cx, y: ty + 0.2, z: cz, rz: r.range(-10, 10) }));
    else g.add(place(cone(r.range(0.2, 0.32), r.range(0.4, 0.8), mat(r.pick(coral)), 5), { x: cx, y: ty + 0.2, z: cz }));
  }
  const fishC = [PALETTE.orange, PALETTE.yellow, '#ff8a3d', '#e0e8f0', PALETTE.red, '#ffd23a'];
  for (let i = 0; i < 14; i++) {
    const side = i % 2 ? 1 : -1;
    g.add(place(fish(r.pick(fishC)), {
      x: tx - tw / 2 + 0.5 + r.range(0, tw - 1),
      y: ty + r.range(0.9, 2.5),
      z: tz + side * r.range(1.1, 1.4) * (r.chance(0.3) ? 0.2 : 1),
      ry: r.chance(0.5) ? 0 : 180,
    }));
  }
  // a shark patrolling over the tunnel
  const shark = fish('#8796a3');
  g.add(place(shark, { x: tx + 1.2, y: ty + 2.35, z: tz + 0.2, s: 2.4, ry: 160 }));
  g.add(place(cone(0.16, 0.38, mat('#8796a3'), 4), { x: tx + 1.2, y: ty + 2.55, z: tz + 0.2 }));
  // the water volume: tinted glass tank with a steel frame and a water top
  g.add(place(box(tw, th - 0.25, td, mat('#3fb7da', { transparent: true, opacity: 0.38, roughness: 0.1, metalness: 0.2 })), { x: tx, y: ty + 0.2, z: tz }));
  g.add(place(box(tw - 0.1, 0.05, td - 0.1, mat('#5cc9e6', { transparent: true, opacity: 0.6, roughness: 0.1 })), { x: tx, y: ty + th - 0.1, z: tz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.14, th, 0.14, steel), { x: tx + sx * tw / 2, y: ty, z: tz + sz * td / 2 }));
  }
  for (const sz of [-1, 1]) g.add(place(box(tw + 0.14, 0.14, 0.14, steel), { x: tx, y: ty + th - 0.07, z: tz + sz * td / 2 }));
  g.add(place(box(0.14, 0.14, td, steel), { x: tx + tw / 2, y: ty + th - 0.07, z: tz }));
  for (let i = 1; i < 4; i++) {
    const x = tx - tw / 2 + (i * tw) / 4;
    g.add(place(box(0.08, th, 0.08, steel), { x, y: ty, z: tz + td / 2 }));
    g.add(place(box(0.08, th, 0.08, steel), { x, y: ty, z: tz - td / 2 }));
  }
  // small exit pavilion sign on the tank
  g.add(place(bigSign({ text: 'SHARK TUNNEL', w: 2.6, h: 0.5, bg: PALETTE.navy, fg: '#ffffff' }), { x: tx - 1.2, y: ty + th + 0.05, z: tz + td / 2 - 0.1 }));

  // --- seal pool (front right) ----------------------------------------------
  const px = 6.45, pz = 2.0;
  const outer = ellipse(px, pz, 2.95, 2.1, 16, 0.05, 3);
  const inner = ellipse(px, pz, 2.45, 1.65, 16, 0.06, 4);
  g.add(place(patch(6.9, 0.9, 'cobbles'), { x: 6.25, y: y0, z: -0.7 }));
  g.add(place(flatShape(outer, 0.55, mat('#958b7c'), inner), { y: y0 }));
  g.add(place(flatShape(inner, 0.35, water(PALETTE.pool)), { y: y0 }));
  for (let i = 0; i < outer.length; i++) {
    const [ox, oz] = outer[i];
    const [ix, iz] = inner[i];
    g.add(place(rock(0.38, 10 + i), { x: (ox + ix) / 2, y: y0 + 0.5, z: (oz + iz) / 2 }));
  }
  // rock island with seals, one balancing a ball
  const ix = px - 0.4, iz = pz - 0.2;
  g.add(place(rock(1.0, 51), { x: ix, y: y0 + 0.35, z: iz }));
  g.add(place(rock(0.7, 52), { x: ix + 0.9, y: y0 + 0.35, z: iz + 0.3 }));
  g.add(place(rock(0.6, 53, '#a39887'), { x: ix - 0.5, y: y0 + 0.75, z: iz - 0.2 }));
  g.add(place(seal({ up: 0.45 }), { x: ix - 0.2, y: y0 + 0.95, z: iz + 0.15, ry: -20 }));
  g.add(place(sphere(0.2, mat(PALETTE.red), 8), { x: ix + 0.55, y: y0 + 1.95, z: iz + 0.37 }));
  g.add(place(box(0.2, 0.06, 0.06, mat(PALETTE.white)), { x: ix + 0.55, y: y0 + 2.11, z: iz + 0.37 }));
  g.add(place(seal({ color: '#8a8378', up: 0.1 }), { x: ix + 1.0, y: y0 + 0.75, z: iz + 0.35, ry: 150 }));
  g.add(place(seal({ color: '#5e6168', up: 0.3 }), { x: px + 2.2, y: y0 + 0.45, z: pz - 1.3, ry: 120 }));
  // heads of swimming seals
  for (const [sx, sz] of [[px + 1.3, pz + 1.1], [px - 1.8, pz + 0.7]]) {
    g.add(place(sphere(0.24, mat('#5e6168', { roughness: 0.35 }), 8), { x: sx, y: y0 + 0.25, z: sz }));
  }
  // visitor railing and spectators
  g.add(place(fence({ w: 6.6, d: 4.8, h: 1.0, style: 'railing', color: PALETTE.navy, sides: ['front', 'right', 'left'] }), { x: px, y: y0, z: pz }));
  const shirts = [PALETTE.red, PALETTE.yellow, PALETTE.green, PALETTE.orange, PALETTE.purple, PALETTE.white];
  [[px - 1.5, pz + 2.75], [px - 0.9, pz + 2.8], [px + 0.3, pz + 2.75], [px - 3.65, pz + 0.4]].forEach(([x, z], i) => {
    g.add(place(person(shirts[i], 90 + i), { x, y: y0, z }));
  });
  g.add(place(bigSign({ text: 'SEAL POOL', w: 2.2, h: 0.55, bg: PALETTE.navy, fg: '#ffffff', d: 0.1 }), { x: px + 1.8, y: y0 + 1.2, z: pz + 2.42 }));
  g.add(place(box(0.08, 1.2, 0.08, mat(PALETTE.navy)), { x: px + 1.0, y: y0, z: pz + 2.42 }));
  g.add(place(box(0.08, 1.2, 0.08, mat(PALETTE.navy)), { x: px + 2.6, y: y0, z: pz + 2.42 }));

  // --- plaza props ----------------------------------------------------------
  g.add(place(streetLamp({ h: 4.2 }), { x: -9.3, y: y0, z: 4.6 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 2.3, y: y0, z: 2.6, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: -5.0, y: y0, z: 4.4, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 1.6, y: y0, z: -0.4, ry: 270 }));
  [[-3.4, 3.6], [-2.6, 4.1], [-5.6, 3.2]].forEach(([x, z], i) => {
    g.add(place(person(shirts[(i + 3) % shirts.length], 70 + i), { x, y: y0, z }));
  });
  // ticket kiosk
  g.add(place(box(1.4, 2.2, 1.2, mat('#2f7fca')), { x: -0.2, y: y0, z: 3.0 }));
  g.add(place(box(1.0, 0.7, 0.05, emissive(PALETTE.windowLit, 0.3)), { x: -0.2, y: y0 + 1.0, z: 3.62 }));
  g.add(place(box(1.7, 0.15, 1.5, mat('#f4fbff')), { x: -0.2, y: y0 + 2.2, z: 3.0 }));
  // planters with palms along the back corners and bushes by the hall
  g.add(place(tree({ kind: 'palm', h: 3.2, seed: 6 }), { x: 2.9, y: y0, z: 3.9 }));
  for (const [x, z] of [[-9.4, 1.9], [2.2, 1.4]]) {
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: Math.round(x * 7 + z) }), { x, y: y0, z }));
  }
  return g;
}

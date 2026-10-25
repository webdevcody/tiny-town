// Little people, a water buffalo and village bits for the rice terraces.
import * as THREE from 'three';
import { PALETTE, box, cylinder, cone, sphere, place, mat, beam } from '../../src/lib/index.js';

const SKIN = '#c8935f';
const STRAW = '#e6cf86';

/** Rice farmer in a conical hat, bent over planting (bend in degrees). Faces +Z. */
export function worker({ shirt = PALETTE.white, pants = PALETTE.navy, bend = 55, basket = false } = {}) {
  const g = new THREE.Group();
  g.add(place(box(0.15, 0.78, 0.16, pants), { x: -0.11 }));
  g.add(place(box(0.15, 0.78, 0.16, pants), { x: 0.11 }));
  const upper = new THREE.Group();
  upper.add(box(0.46, 0.62, 0.28, shirt));
  upper.add(place(sphere(0.14, SKIN, 8), { y: 0.62 }));
  upper.add(place(cone(0.46, 0.3, mat(STRAW), 10), { y: 0.76 }));
  // arms reach down towards the paddy
  upper.add(place(box(0.11, 0.6, 0.12, shirt), { x: -0.27, y: 0.0, z: 0.12, rx: 40 }));
  upper.add(place(box(0.11, 0.6, 0.12, shirt), { x: 0.27, y: 0.0, z: 0.12, rx: 40 }));
  if (basket) upper.add(place(cylinder(0.24, 0.17, 0.3, PALETTE.woodLight, 8), { y: 0.05, z: -0.28 }));
  g.add(place(upper, { y: 0.74, rx: bend }));
  return g;
}

/** Water buffalo facing +X with big swept-back crescent horns. */
export function buffalo({ color = '#4a4850' } = {}) {
  const g = new THREE.Group();
  const body = mat(color);
  const dark = mat('#38363d');
  for (const [x, z] of [[0.75, 0.33], [0.75, -0.33], [-0.75, 0.33], [-0.75, -0.33]]) g.add(place(box(0.24, 0.72, 0.24, dark), { x, z }));
  g.add(place(box(2.2, 0.95, 1.05, body), { y: 0.62 }));
  g.add(place(box(0.9, 0.25, 0.9, body), { x: 0.55, y: 1.5 })); // shoulder hump
  g.add(place(box(0.6, 0.62, 0.7, body), { x: 1.25, y: 0.82 })); // neck
  g.add(place(box(0.62, 0.52, 0.56, body), { x: 1.62, y: 0.68 })); // head
  g.add(place(box(0.24, 0.32, 0.46, '#2c2a30'), { x: 1.98, y: 0.66 })); // muzzle
  // horns: wide crescents sweeping out, back and up
  const bone = mat('#e2d7bd');
  for (const sz of [1, -1]) {
    g.add(beam([1.6, 1.1, 0.2 * sz], [1.55, 1.18, 0.62 * sz], 0.13, bone));
    g.add(beam([1.55, 1.18, 0.62 * sz], [1.3, 1.36, 0.82 * sz], 0.11, bone));
    g.add(beam([1.3, 1.36, 0.82 * sz], [1.08, 1.6, 0.62 * sz], 0.08, bone));
  }
  g.add(place(box(0.08, 0.7, 0.08, dark), { x: -1.12, y: 0.55, rz: -15 })); // tail
  for (const z of [0.3, -0.3]) g.add(place(box(0.12, 0.12, 0.3, body), { x: 1.55, y: 1.08, z: z * 1.25 })); // ears
  return g;
}

/** Wooden plough + yoke, trailing behind a buffalo that stands at the origin facing +X. */
export function plough() {
  const g = new THREE.Group();
  const w = mat(PALETTE.woodDark);
  g.add(place(box(0.2, 0.14, 1.4, w), { x: 1.0, y: 1.55 })); // yoke on the neck
  g.add(beam([1.0, 1.5, 0], [-2.4, 0.35, 0], 0.11, w));
  g.add(beam([-2.4, 0.0, 0], [-2.9, 1.1, 0], 0.1, w)); // handle
  g.add(beam([-2.2, 0.05, 0], [-2.9, 0.05, 0], 0.12, w)); // share
  return g;
}

/** Stilted bamboo/nipa hut with a steep thatched roof. Front (+Z) has a ladder. */
export function hut({ thatch, walls }) {
  const g = new THREE.Group();
  const post = mat(PALETTE.woodDark);
  const W = 3.6, D = 3.0, stilt = 1.1, wallH = 1.7;
  for (const x of [-W / 2 + 0.15, 0, W / 2 - 0.15]) for (const z of [-D / 2 + 0.15, D / 2 - 0.15, D / 2 + 0.85]) g.add(place(box(0.18, stilt, 0.18, post), { x, z }));
  g.add(place(box(W + 0.2, 0.16, D + 1.0, PALETTE.wood), { y: stilt, z: 0.35 })); // floor + veranda
  g.add(place(box(W, wallH, D, walls), { y: stilt + 0.16 }));
  // door, windows
  g.add(place(box(0.8, 1.35, 0.06, '#3b2a1a'), { y: stilt + 0.16, z: D / 2 }));
  g.add(place(box(0.7, 0.5, 0.06, '#3b2a1a'), { x: 1.15, y: stilt + 0.95, z: D / 2 }));
  g.add(place(box(0.06, 0.5, 0.7, '#3b2a1a'), { x: W / 2, y: stilt + 0.95 }));
  g.add(place(box(0.06, 0.5, 0.7, '#3b2a1a'), { x: -W / 2, y: stilt + 0.95 }));
  // veranda rail
  for (const x of [-W / 2, W / 2]) g.add(place(box(0.08, 0.55, 1.0, PALETTE.woodLight), { x, y: stilt + 0.16, z: D / 2 + 0.5 }));
  g.add(place(box(1.2, 0.08, 0.08, PALETTE.woodLight), { x: -1.2, y: stilt + 0.68, z: D / 2 + 0.95 }));
  g.add(place(box(1.2, 0.08, 0.08, PALETTE.woodLight), { x: 1.2, y: stilt + 0.68, z: D / 2 + 0.95 }));
  // ladder down to the ground
  for (const x of [-0.35, 0.35]) g.add(beam([x, 0, D / 2 + 1.75], [x, stilt + 0.16, D / 2 + 0.85], 0.08, PALETTE.woodLight));
  for (let i = 1; i <= 3; i++) {
    const t = i / 4;
    g.add(place(box(0.7, 0.06, 0.08, PALETTE.woodLight), { y: t * (stilt + 0.16), z: D / 2 + 1.75 - t * 0.9 }));
  }
  // steep thatched gable roof (ridge along X) with a big overhang
  const roofY = stilt + 0.16 + wallH;
  const rw = W + 1.0, rd = D + 1.6, rh = 2.0;
  const shape = new THREE.Shape([new THREE.Vector2(-rd / 2, 0), new THREE.Vector2(rd / 2, 0), new THREE.Vector2(0, rh)]);
  const roofGeo = new THREE.ExtrudeGeometry(shape, { depth: rw, bevelEnabled: false });
  roofGeo.rotateY(Math.PI / 2);
  roofGeo.translate(-rw / 2, 0, 0);
  g.add(place(new THREE.Mesh(roofGeo, thatch), { y: roofY - 0.05, z: 0.3 }));
  g.add(place(box(rw + 0.1, 0.14, 0.18, '#8c6f37'), { y: roofY + rh - 0.12, z: 0.3 })); // ridge cap
  return g;
}

/** Stook of harvested rice sheaves. */
export function sheaf() {
  const g = new THREE.Group();
  g.add(cone(0.38, 1.0, mat(PALETTE.hay), 7));
  g.add(place(cylinder(0.12, 0.2, 0.25, '#b8953f', 6), { y: 0.85 }));
  return g;
}

/** Clump of bamboo. */
export function bamboo({ h = 5, seed = 1 } = {}) {
  const g = new THREE.Group();
  const stem = mat('#7fa03a');
  const leaf = mat('#5c9a34');
  for (let i = 0; i < 6; i++) {
    const a = i * 2.4 + seed, r = 0.25 + (i % 3) * 0.15;
    const hh = h * (0.75 + ((i * 37 + seed * 11) % 10) / 40);
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(place(cylinder(0.05, 0.07, hh, stem, 5), { x, z, rx: z * 8, rz: -x * 8 }));
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.6, 0), leaf);
    s.scale.set(0.9, 1.6, 0.9);
    s.position.set(x * 1.5, hh - 0.3, z * 1.5);
    g.add(s);
  }
  return g;
}

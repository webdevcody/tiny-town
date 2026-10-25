import * as THREE from 'three';
import { PALETTE, box, cylinder, cone, sphere, place, pipeRun, mat, textured, canvasTexture } from '../../src/lib/index.js';

// Low-poly zoo animals. Each faces +X, origin on the ground under its body.

// Reticulated giraffe coat: tan lines around brown patches, repeats every metre.
function giraffeCoat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#f0d9a0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b5652a';
    const cells = [[4, 4, 24, 22], [34, 2, 26, 26], [2, 32, 18, 28], [24, 30, 18, 30], [46, 32, 16, 28]];
    for (const [x, y, w, h] of cells) ctx.fillRect(x, y, w, h);
  }, { key: 'zoo:giraffe-coat' });
  return textured(tex);
}

function ellipsoid(rx, ry, rz, material) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), typeof material === 'string' ? mat(material) : material);
  m.scale.set(rx, ry, rz);
  return m;
}

/** Giraffe, ~4.6 m to the horns. */
export function giraffe({ neckTilt = 28 } = {}) {
  const g = new THREE.Group();
  const coat = giraffeCoat();
  const hoof = mat('#3a2a1c');
  const legH = 1.7;
  for (const lx of [-0.65, 0.65]) for (const lz of [-0.26, 0.26]) {
    g.add(place(box(0.17, legH, 0.17, coat), { x: lx, z: lz }));
    g.add(place(box(0.2, 0.15, 0.2, hoof), { x: lx, z: lz }));
  }
  // sloping body: higher at the shoulders
  g.add(place(box(1.8, 0.85, 0.75, coat), { y: legH - 0.1, rz: 8 }));
  // neck, tilted forward from the shoulders
  g.add(place(box(0.32, 2.1, 0.3, coat), { x: 0.72, y: legH + 0.55, rz: -neckTilt }));
  const t = THREE.MathUtils.degToRad(neckTilt);
  const hx = 0.72 + Math.sin(t) * 2.0, hy = legH + 0.55 + Math.cos(t) * 2.0;
  // mane
  g.add(place(box(0.08, 1.9, 0.08, mat('#8a4a22')), { x: 0.6, y: legH + 0.6, rz: -neckTilt }));
  // head + muzzle, ossicones, ears
  g.add(place(box(0.6, 0.3, 0.3, mat('#e2c088')), { x: hx + 0.18, y: hy - 0.05 }));
  g.add(place(box(0.25, 0.22, 0.26, mat('#c9a36c')), { x: hx + 0.5, y: hy - 0.05 }));
  for (const z of [-0.08, 0.08]) {
    g.add(place(box(0.06, 0.28, 0.06, mat('#5a3a20')), { x: hx, y: hy + 0.22, z }));
    g.add(place(box(0.08, 0.06, 0.22, mat('#e2c088')), { x: hx - 0.08, y: hy + 0.18, z: z * 2.4 }));
  }
  g.add(place(box(0.06, 0.06, 0.32, mat(PALETTE.black)), { x: hx + 0.22, y: hy + 0.12 }));
  // tail
  g.add(place(box(0.05, 0.75, 0.05, coat), { x: -0.95, y: legH - 0.55, rz: -12 }));
  g.add(place(box(0.1, 0.18, 0.1, mat('#3a2a1c')), { x: -1.0, y: legH - 0.62 }));
  return g;
}

/** African elephant, ~2.9 m at the shoulder. s scales it (calves). */
export function elephant({ trunkUp = false } = {}) {
  const g = new THREE.Group();
  const hide = mat('#8f8a86');
  const dark = mat('#77726e');
  const legH = 1.1;
  for (const lx of [-0.8, 0.8]) for (const lz of [-0.45, 0.45]) {
    g.add(place(cylinder(0.27, 0.3, legH + 0.4, hide, 8), { x: lx, z: lz }));
    g.add(place(cylinder(0.32, 0.32, 0.12, mat('#d8d0c4'), 8), { x: lx, z: lz }));
  }
  g.add(place(ellipsoid(1.35, 0.85, 0.8, hide), { y: legH + 0.75 }));
  // head
  g.add(place(ellipsoid(0.6, 0.62, 0.55, hide), { x: 1.35, y: legH + 1.15 }));
  // ears: big flat flaps
  for (const s of [-1, 1]) {
    const ear = ellipsoid(0.55, 0.62, 0.06, dark);
    g.add(place(ear, { x: 1.1, y: legH + 1.1, z: s * 0.62, ry: s * 20 }));
  }
  // trunk
  const trunkPts = trunkUp
    ? [[1.85, legH + 1.05, 0], [2.2, legH + 0.75, 0], [2.45, legH + 1.05, 0], [2.55, legH + 1.55, 0]]
    : [[1.85, legH + 1.05, 0], [2.05, legH + 0.55, 0], [2.1, legH - 0.05, 0], [2.0, 0.35, 0]];
  g.add(pipeRun(trunkPts, 0.16, hide));
  // tusks
  for (const z of [-0.22, 0.22]) {
    const tusk = cone(0.07, 0.6, mat('#f4ecd8'), 6);
    g.add(place(tusk, { x: 1.8, y: legH + 0.75, z, rz: -75 }));
  }
  // eyes
  for (const z of [-0.36, 0.36]) g.add(place(box(0.08, 0.08, 0.06, mat(PALETTE.black)), { x: 1.75, y: legH + 1.35, z }));
  // tail
  g.add(place(box(0.06, 0.8, 0.06, dark), { x: -1.38, y: legH + 0.15, rz: -10 }));
  return g;
}

/** Penguin, ~0.8 m tall (chunky so it reads from iso views). */
export function penguin({ flap = 0 } = {}) {
  const g = new THREE.Group();
  const black = mat('#25262b');
  const white = mat('#f5f5f2');
  const orange = mat(PALETTE.orange);
  g.add(place(ellipsoid(0.22, 0.32, 0.2, black), { y: 0.36 }));
  g.add(place(ellipsoid(0.13, 0.26, 0.17, white), { x: 0.11, y: 0.34 }));
  g.add(place(sphere(0.14, black, 8), { y: 0.6 }));
  g.add(place(box(0.05, 0.08, 0.2, white), { x: 0.09, y: 0.72 }));
  g.add(place(cone(0.05, 0.16, orange, 6), { x: 0.14, y: 0.73, rz: -90 }));
  for (const z of [-0.1, 0.1]) g.add(place(box(0.16, 0.04, 0.08, orange), { x: 0.06, z }));
  for (const s of [-1, 1]) g.add(place(box(0.1, 0.34, 0.04, black), { y: 0.22, z: s * 0.21, rx: s * (10 + flap) }));
  return g;
}

/** Flamingo, ~1.4 m, standing on one leg. */
export function flamingo() {
  const g = new THREE.Group();
  const pink = mat('#ef8fa4');
  const leg = mat('#d9687f');
  g.add(place(box(0.05, 0.75, 0.05, leg), { x: 0, z: 0 }));
  g.add(place(box(0.05, 0.35, 0.05, leg), { x: -0.1, y: 0.45, rz: 60 }));
  g.add(place(ellipsoid(0.3, 0.16, 0.16, pink), { y: 0.85 }));
  g.add(pipeRun([[0.22, 0.9, 0], [0.3, 1.15, 0], [0.2, 1.3, 0], [0.32, 1.42, 0]], 0.04, pink));
  g.add(place(box(0.14, 0.07, 0.07, mat(PALETTE.black)), { x: 0.42, y: 1.39 }));
  return g;
}

/** Parrot / macaw, ~0.5 m, perched. */
export function parrot(color = PALETTE.red, wing = PALETTE.blue) {
  const g = new THREE.Group();
  g.add(place(ellipsoid(0.12, 0.2, 0.12, color), { y: 0.2 }));
  g.add(place(sphere(0.1, color, 6), { x: 0.04, y: 0.34 }));
  g.add(place(cone(0.04, 0.1, mat(PALETTE.yellow), 4), { x: 0.14, y: 0.42, rz: -100 }));
  g.add(place(box(0.06, 0.3, 0.2, mat(wing)), { x: -0.06, y: 0.1, rz: 15 }));
  return g;
}

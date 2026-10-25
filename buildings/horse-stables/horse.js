import * as THREE from 'three';
import { box, place, group, mat } from '../../src/lib/index.js';

// Low-poly horse, standing on y = 0, facing +X. About 2.4 m long, 1.7 m at the withers.
//   horse({ coat, mane, socks, pose: 'stand' | 'graze', tack })
export function horse({ coat = '#7a4a2a', mane = '#2a1f18', socks = null, pose = 'stand', tack = null } = {}) {
  const c = mat(coat);
  const m = mat(mane);
  const hoof = mat('#2a2522');
  const sock = socks ? mat(socks) : c;
  const g = new THREE.Group();
  // legs
  for (const [lx, lz] of [[0.75, 0.2], [0.75, -0.2], [-0.75, 0.2], [-0.75, -0.2]]) {
    g.add(place(box(0.18, 0.12, 0.18, hoof), { x: lx, z: lz }));
    g.add(place(box(0.16, 0.38, 0.16, sock), { x: lx, y: 0.12, z: lz }));
    g.add(place(box(0.18, 0.55, 0.18, c), { x: lx, y: 0.5, z: lz }));
  }
  // body, chest and rump
  g.add(place(box(1.9, 0.62, 0.58, c), { y: 1.0 }));
  g.add(place(box(0.5, 0.56, 0.62, c), { x: -0.75, y: 1.02 }));
  // tail
  g.add(place(box(0.12, 0.75, 0.14, m), { x: -1.0, y: 0.75, z: 0, rz: -12 }));
  // neck + head
  const neck = new THREE.Group();
  neck.add(place(box(0.34, 0.95, 0.3, c), { y: 0 }));
  neck.add(place(box(0.1, 0.85, 0.08, m), { x: -0.2, y: 0.1 }));
  const head = new THREE.Group();
  head.add(place(box(0.7, 0.3, 0.26, c), { x: 0.25, y: -0.15 }));
  head.add(place(box(0.22, 0.24, 0.22, mat('#3a2a20')), { x: 0.58, y: -0.14 }));
  head.add(place(box(0.08, 0.18, 0.06, c), { x: -0.02, y: 0.12, z: 0.08 }));
  head.add(place(box(0.08, 0.18, 0.06, c), { x: -0.02, y: 0.12, z: -0.08 }));
  const L = 0.95;
  const [nx, ny, na, ha] = pose === 'graze' ? [0.95, 1.25, 125, -80] : [0.85, 1.3, 30, -25];
  const a = THREE.MathUtils.degToRad(na);
  neck.position.set(nx, ny, 0);
  neck.rotation.z = -a;
  head.position.set(nx + L * Math.sin(a), ny + L * Math.cos(a), 0);
  head.rotation.z = THREE.MathUtils.degToRad(ha);
  g.add(neck, head);
  if (tack) {
    // saddle cloth + saddle
    g.add(place(box(0.6, 0.05, 0.66, mat(tack)), { x: 0.15, y: 1.58 }));
    g.add(place(box(0.45, 0.12, 0.42, mat('#4a2c18')), { x: 0.15, y: 1.62 }));
  }
  return g;
}

// Just a horse head + neck poking out of a stall door, facing +Z.
export function horseHead({ coat = '#7a4a2a', mane = '#2a1f18', blaze = false } = {}) {
  const c = mat(coat);
  const g = group(
    place(box(0.32, 0.5, 0.45, c), { z: 0.1 }),
    place(box(0.08, 0.5, 0.4, mat(mane)), { y: 0.25, z: 0.05 }),
    place(box(0.28, 0.3, 0.6, c), { y: 0.25, z: 0.55, rx: 25 }),
    place(box(0.24, 0.24, 0.22, mat('#3a2a20')), { y: 0.05, z: 0.85, rx: 25 }),
    place(box(0.07, 0.18, 0.07, c), { x: 0.09, y: 0.55, z: 0.32 }),
    place(box(0.07, 0.18, 0.07, c), { x: -0.09, y: 0.55, z: 0.32 }),
  );
  if (blaze) g.add(place(box(0.08, 0.04, 0.5, mat('#f1eee6')), { y: 0.55, z: 0.6, rx: 25 }));
  return g;
}

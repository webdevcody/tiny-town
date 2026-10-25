import * as THREE from 'three';
import { PALETTE, box, place, mat, cylinder, sphere } from '../../src/lib/index.js';

// Low-poly farm animals and the shepherd. All face +X, origin on the ground.

const WOOL = '#f1ece0';
const FACE = '#2b2521';

function blob(r, detail, color) {
  return new THREE.Mesh(new THREE.IcosahedronGeometry(r, detail), mat(color));
}

/**
 * Sheep, ~1.1 m long. Options:
 *   wool   fleece colour     face  head/leg colour
 *   graze  head down         shorn freshly shorn (slim, pale pink)
 *   s      scale (lambs ~0.65)
 */
export function sheep({ wool = WOOL, face = FACE, graze = false, shorn = false, s = 1 } = {}) {
  const g = new THREE.Group();
  const fleece = shorn ? '#eedcc8' : wool;
  const body = blob(0.42, 1, fleece);
  if (shorn) body.scale.set(1.3, 0.72, 0.72);
  else body.scale.set(1.4, 0.98, 1.05);
  body.position.y = shorn ? 0.58 : 0.66;
  g.add(body);
  // legs
  const legM = mat(face);
  for (const lx of [-0.32, 0.3]) for (const lz of [-0.15, 0.15]) {
    g.add(place(box(0.09, 0.44, 0.09, legM), { x: lx, z: lz }));
  }
  // head (+ ears and a woolly topknot)
  const head = new THREE.Group();
  head.add(place(box(0.32, 0.25, 0.22, legM), { x: 0.06, y: -0.125 }));
  head.add(place(box(0.08, 0.06, 0.46, legM), { x: -0.06, y: 0.02 }));
  if (!shorn) head.add(place(blob(0.13, 0, fleece), { x: -0.06, y: 0.1 }));
  if (graze) place(head, { x: 0.62, y: 0.32, rz: -55 });
  else place(head, { x: 0.62, y: 0.88, rz: -12 });
  g.add(head);
  // tail
  g.add(place(box(0.12, 0.2, 0.1, fleece), { x: -0.62, y: 0.48, rz: -20 }));
  g.scale.setScalar(s);
  return g;
}

/** Black-and-white border collie, ~0.8 m long. pose: 'stand' | 'lie' */
export function sheepdog({ pose = 'stand' } = {}) {
  const g = new THREE.Group();
  const black = mat('#1f1d1c');
  const white = mat(PALETTE.white);
  const legH = pose === 'lie' ? 0.06 : 0.3;
  g.add(place(box(0.62, 0.24, 0.24, black), { y: legH }));
  g.add(place(box(0.2, 0.22, 0.26, white), { x: 0.24, y: legH - 0.02 })); // white chest / collar
  if (pose !== 'lie') {
    for (const lx of [-0.24, 0.22]) for (const lz of [-0.08, 0.08]) {
      g.add(place(box(0.07, legH, 0.07, white), { x: lx, z: lz }));
    }
  } else {
    for (const lz of [-0.08, 0.08]) g.add(place(box(0.3, 0.06, 0.07, white), { x: 0.42, z: lz }));
  }
  const hy = legH + 0.22;
  g.add(place(box(0.22, 0.2, 0.2, black), { x: 0.4, y: hy }));
  g.add(place(box(0.14, 0.09, 0.1, white), { x: 0.56, y: hy + 0.02 })); // muzzle
  g.add(place(box(0.05, 0.1, 0.18, white), { x: 0.47, y: hy + 0.06 })); // blaze
  for (const ez of [-0.07, 0.07]) g.add(place(box(0.05, 0.1, 0.05, black), { x: 0.35, y: hy + 0.2, z: ez, rz: -15 }));
  g.add(place(box(0.3, 0.07, 0.07, black), { x: -0.42, y: legH + 0.06, rz: pose === 'lie' ? -10 : 25 }));
  g.add(place(box(0.08, 0.07, 0.08, white), { x: -0.56, y: legH + (pose === 'lie' ? 0.02 : 0.13) })); // white tail tip
  return g;
}

/** Shepherd in a wax jacket and flat cap, holding a crook. Faces +X. */
export function shepherd() {
  const g = new THREE.Group();
  const trousers = mat('#4a4f5c');
  const jacket = mat('#56602f');
  const skin = mat('#e2b48e');
  g.add(place(box(0.2, 0.1, 0.26, mat(PALETTE.black)), { x: 0.04, z: -0.12 }));
  g.add(place(box(0.2, 0.1, 0.26, mat(PALETTE.black)), { x: 0.04, z: 0.12 }));
  g.add(place(box(0.18, 0.82, 0.18, trousers), { z: -0.12 }));
  g.add(place(box(0.18, 0.82, 0.18, trousers), { z: 0.12 }));
  g.add(place(box(0.3, 0.72, 0.5, jacket), { y: 0.8 }));
  g.add(place(box(0.14, 0.62, 0.13, jacket), { y: 0.9, z: -0.3, rx: 6 }));
  g.add(place(box(0.14, 0.5, 0.13, jacket), { x: 0.12, y: 1.05, z: 0.3, rz: 60 }));
  g.add(place(box(0.12, 0.1, 0.14, skin), { y: 1.5 }));
  g.add(place(sphere(0.15, skin, 8), { y: 1.52 }));
  g.add(place(box(0.34, 0.08, 0.3, mat('#6b5a44')), { x: 0.04, y: 1.76 })); // flat cap
  // crook
  const crookM = mat(PALETTE.woodDark);
  g.add(place(cylinder(0.025, 0.025, 1.85, crookM, 5), { x: 0.5, z: 0.32 }));
  const hook = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.025, 4, 8, Math.PI), crookM);
  hook.position.set(0.39, 1.85, 0.32);
  g.add(hook);
  return g;
}

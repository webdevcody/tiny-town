// Bronze quadriga: four horses abreast pulling a chariot driven by a gilded,
// winged Victory holding up a laurel wreath. Faces +z, base at y = 0.
import * as THREE from 'three';
import { box, cylinder, sphere, cone, place, group, mat } from '../../src/lib/index.js';

export const BRONZE = mat('#6e4a26', { roughness: 0.4, metalness: 0.45 });
export const PATINA = mat('#5e8f78', { roughness: 0.6, metalness: 0.2 });
export const GILT = mat('#e0b23c', { roughness: 0.35, metalness: 0.45 });

// One horse, hooves on y = 0, head towards +z. rear = front legs up.
function horse({ rear = false, turn = 0 } = {}) {
  const m = BRONZE;
  const h = new THREE.Group();
  const bodyY = 0.5;
  h.add(place(box(0.24, 0.3, 0.78, m), { y: bodyY }));
  // chest & rump rounding
  h.add(place(sphere(0.16, m, 8), { y: bodyY - 0.01, z: 0.3 }));
  h.add(place(sphere(0.16, m, 8), { y: bodyY - 0.01, z: -0.3 }));
  // hind legs
  for (const x of [-0.08, 0.08]) h.add(place(cylinder(0.035, 0.045, bodyY + 0.05, m, 5), { x, z: -0.3 }));
  // front legs: straight, or lifted and bent forward when rearing
  for (const x of [-0.08, 0.08]) {
    if (rear) {
      const leg = group(
        place(cylinder(0.035, 0.04, 0.26, m, 5), { y: -0.26 }),
        place(cylinder(0.03, 0.035, 0.24, m, 5), { y: -0.26, rx: -120 }),
      );
      h.add(place(leg, { x, y: bodyY + 0.02, z: 0.3, rx: -50 }));
    } else {
      h.add(place(cylinder(0.035, 0.045, bodyY + 0.05, m, 5), { x, z: 0.3 }));
    }
  }
  // neck, head, ears, mane
  h.add(place(box(0.14, 0.42, 0.2, m), { y: bodyY + 0.05, z: 0.38, rx: 32 }));
  h.add(place(box(0.13, 0.13, 0.32, m), { y: bodyY + 0.36, z: 0.6, rx: 30 }));
  h.add(place(box(0.03, 0.08, 0.03, m), { x: 0.04, y: bodyY + 0.46, z: 0.52 }));
  h.add(place(box(0.03, 0.08, 0.03, m), { x: -0.04, y: bodyY + 0.46, z: 0.52 }));
  h.add(place(box(0.04, 0.3, 0.12, m), { y: bodyY + 0.2, z: 0.36, rx: 32 }));
  // tail
  h.add(place(box(0.06, 0.34, 0.08, m), { y: bodyY - 0.3, z: -0.44, rx: -25 }));
  const pivot = new THREE.Group();
  pivot.add(place(h, { z: 0.3 }));
  pivot.rotation.set(THREE.MathUtils.degToRad(rear ? -20 : 0), THREE.MathUtils.degToRad(turn), 0);
  return pivot;
}

function chariot() {
  const g = new THREE.Group();
  // car: curved front shell + floor
  const shell = new THREE.CylinderGeometry(0.42, 0.42, 0.5, 12, 1, true, -Math.PI / 2, Math.PI);
  shell.translate(0, 0.25, 0);
  const shellMesh = new THREE.Mesh(shell, mat('#6e4a26', { roughness: 0.4, metalness: 0.45, side: THREE.DoubleSide }));
  shellMesh.scale.set(1, 1, 0.75);
  g.add(place(shellMesh, { y: 0.28 }));
  g.add(place(box(0.84, 0.06, 0.4, BRONZE), { y: 0.28, z: 0.1 }));
  g.add(place(box(0.86, 0.06, 0.06, GILT), { y: 0.78, z: 0.3 }));
  // wheels
  for (const x of [-0.48, 0.48]) {
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.06, 14), GILT);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(x, 0.34, 0.05);
    g.add(wheel);
    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.12, 8), BRONZE);
    hub.rotation.z = Math.PI / 2;
    hub.position.set(x, 0.34, 0.05);
    g.add(hub);
  }
  g.add(place(box(1.0, 0.05, 0.05, BRONZE), { y: 0.32, z: 0.05 }));
  // draught pole to the horses
  g.add(place(box(0.06, 0.06, 0.9, BRONZE), { y: 0.4, z: 0.7 }));
  g.add(place(box(1.3, 0.05, 0.05, BRONZE), { y: 0.62, z: 1.12 }));
  return g;
}

// Winged Victory standing in the chariot, wreath raised high.
function victory() {
  const g = new THREE.Group();
  g.add(cone(0.2, 0.75, GILT, 8));
  g.add(place(cylinder(0.1, 0.14, 0.32, GILT, 8), { y: 0.62 }));
  g.add(place(sphere(0.09, GILT, 8), { y: 0.95 }));
  // wings sweep up and back
  for (const s of [-1, 1]) {
    g.add(place(box(0.04, 0.78, 0.42, GILT), { x: s * 0.14, y: 0.55, z: -0.16, rz: -s * 32, rx: -18 }));
  }
  // raised arm with staff and wreath
  g.add(place(box(0.06, 0.4, 0.06, GILT), { x: 0.16, y: 0.88, z: 0.04, rz: -18 }));
  g.add(place(cylinder(0.02, 0.02, 1.0, GILT, 5), { x: 0.24, y: 0.7 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.035, 5, 12), GILT);
  ring.position.set(0.24, 1.78, 0);
  g.add(ring);
  g.add(place(box(0.2, 0.06, 0.06, GILT), { x: 0.24, y: 1.6 }));
  // other arm holds the reins
  g.add(place(box(0.06, 0.3, 0.06, GILT), { x: -0.15, y: 0.58, z: 0.1, rx: 50 }));
  return g;
}

/** The whole group; about 2.0 m wide, 2.3 m long, 2.6 m tall. */
export function quadriga() {
  const g = new THREE.Group();
  const xs = [-0.78, -0.26, 0.26, 0.78];
  xs.forEach((x, i) => {
    const outer = i === 0 || i === 3;
    g.add(place(horse({ rear: outer, turn: outer ? (x < 0 ? -10 : 10) : 0 }), { x, z: 0.25 }));
  });
  g.add(place(chariot(), { z: -0.75 }));
  g.add(place(victory(), { z: -0.8, y: 0.32, s: 1.15 }));
  return g;
}

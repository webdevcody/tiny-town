import * as THREE from 'three';
import { PALETTE, mat, metal, emissive, box, cylinder, place, beam } from '../../src/lib/index.js';

// Ellipsoid centred at (x, y, z).
function blob(rx, ry, rz, material, { x = 0, y = 0, z = 0 } = {}) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 16, 10), material);
  m.scale.set(rx, ry, rz);
  m.position.set(x, y, z);
  return m;
}

/**
 * Small light helicopter, nose towards +X, skids on y = 0.
 * About 4.7 m long, main rotor 5.2 m across.
 */
export function helicopter({ color = PALETTE.yellow, trim = PALETTE.navy } = {}) {
  const body = mat(color, { roughness: 0.4, metalness: 0.2 });
  const trimM = mat(trim, { roughness: 0.5 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.15, metalness: 0.6 });
  const steel = metal(PALETTE.steelDark);
  const g = new THREE.Group();

  // fuselage: rounded cabin, tinted canopy, engine hump
  g.add(blob(1.3, 0.78, 0.74, body, { x: 0.2, y: 1.15 }));
  g.add(blob(0.78, 0.58, 0.64, glassM, { x: 0.78, y: 1.28 }));
  g.add(blob(1.31, 0.2, 0.75, trimM, { x: 0.2, y: 0.95 })); // belly stripe
  g.add(place(box(1.1, 0.42, 0.8, body), { x: -0.35, y: 1.7 }));
  g.add(place(box(0.5, 0.25, 0.5, trimM), { x: -0.85, y: 1.75 }));
  // side door window
  for (const s of [1, -1]) g.add(place(box(0.6, 0.45, 0.04, glassM), { x: -0.2, y: 1.2, z: s * 0.72 }));

  // tail boom, fin, stabiliser
  const boom = cylinder(0.12, 0.28, 2.6, body, 8);
  g.add(place(boom, { x: -0.8, y: 1.3, rz: 90 }));
  g.add(place(box(0.7, 1.0, 0.08, trimM), { x: -3.25, y: 1.25, rz: -18 }));
  g.add(place(box(0.35, 0.05, 1.0, trimM), { x: -2.8, y: 1.3 }));
  // tail rotor
  for (const a of [0, 90]) g.add(place(box(0.08, 0.95, 0.03, steel), { x: -3.35, y: 1.95, z: 0.1, rz: a + 20 }));

  // skids and struts
  for (const s of [1, -1]) {
    g.add(place(cylinder(0.05, 0.05, 2.8, steel, 6), { x: -1.2, y: 0.05, z: s * 0.7, rz: -90 }));
    g.add(place(box(0.08, 0.2, 0.08, steel), { x: 1.66, y: 0.02, z: s * 0.7 }));
    g.add(beam([0.7, 0.05, s * 0.7], [0.6, 0.62, s * 0.4], 0.07, steel));
    g.add(beam([-0.6, 0.05, s * 0.7], [-0.5, 0.62, s * 0.4], 0.07, steel));
  }

  // main rotor: mast, hub, four blades
  g.add(place(cylinder(0.07, 0.09, 0.4, steel, 6), { x: -0.2, y: 2.1 }));
  g.add(place(cylinder(0.2, 0.2, 0.12, steel, 8), { x: -0.2, y: 2.45 }));
  for (let i = 0; i < 4; i++) {
    const blade = new THREE.Group();
    blade.add(place(box(2.5, 0.04, 0.2, mat(PALETTE.darkGrey)), { x: 1.35 }));
    blade.add(place(box(0.25, 0.045, 0.21, mat(PALETTE.yellow)), { x: 2.5 }));
    g.add(place(blade, { x: -0.2, y: 2.5, ry: 25 + i * 90 }));
  }

  // nav lights
  g.add(place(box(0.08, 0.08, 0.08, emissive(PALETTE.red, 1.2)), { x: -0.2, y: 0.95, z: -0.76 }));
  g.add(place(box(0.08, 0.08, 0.08, emissive(PALETTE.green, 1.2)), { x: -0.2, y: 0.95, z: 0.76 }));
  g.add(place(box(0.1, 0.1, 0.1, emissive(PALETTE.red, 1.5)), { x: -3.3, y: 1.78 }));
  return g;
}

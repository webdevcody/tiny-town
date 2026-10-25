import * as THREE from 'three';
import { PALETTE, box, cylinder, place, mat, metal, beam } from '../../src/lib/index.js';

// Local vehicles + birds for the landfill. All lengths run along X, front at +X.

function wheel(r, w, material, segments = 10) {
  const geo = new THREE.CylinderGeometry(r, r, w, segments);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

/** Crawler bulldozer (~4.4 m incl. blade). */
export function bulldozer({ color = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.55 });
  const dark = mat(PALETTE.darkGrey);
  const steel = metal(PALETTE.steelDark);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  // tracks with rounded ends
  for (const sz of [-1, 1]) {
    g.add(place(box(2.5, 0.72, 0.55, dark), { z: sz * 0.85 }));
    for (const sx of [-1, 1]) g.add(place(wheel(0.36, 0.55, dark, 10), { x: sx * 1.25, y: 0.36, z: sz * 0.85 }));
    g.add(place(box(2.3, 0.06, 0.6, steel), { y: 0.72, z: sz * 0.85 }));
  }
  // chassis, engine hood, cab
  g.add(place(box(2.6, 0.7, 1.2, body), { x: -0.1, y: 0.5 }));
  g.add(place(box(1.5, 0.75, 1.15, body), { x: 0.55, y: 1.2 }));
  g.add(place(box(0.9, 0.05, 1.0, dark), { x: 0.6, y: 1.95 }));
  g.add(place(box(1.1, 1.15, 1.25, glassM), { x: -0.75, y: 1.2 }));
  for (const [x, z] of [[-0.2, 0.6], [-0.2, -0.6], [-1.28, 0.6], [-1.28, -0.6]]) g.add(place(box(0.1, 1.15, 0.1, body), { x, y: 1.2, z }));
  g.add(place(box(1.3, 0.12, 1.4, body), { x: -0.75, y: 2.35 }));
  g.add(place(cylinder(0.07, 0.07, 0.8, dark, 6), { x: 1.0, y: 1.9, z: 0.35 }));
  // push arms + angled blade
  for (const sz of [-1, 1]) g.add(beam([1.35, 0.45, sz * 0.9], [0.1, 0.55, sz * 0.9], 0.18, body));
  g.add(place(box(0.2, 1.15, 2.7, body), { x: 1.85, y: 0.05, rz: -12 }));
  g.add(place(box(0.08, 0.12, 2.7, steel), { x: 2.0, y: 0.03 }));
  // rear ripper
  g.add(place(box(0.45, 0.25, 0.9, steel), { x: -1.55, y: 0.75 }));
  g.add(place(box(0.14, 0.85, 0.14, steel), { x: -1.7, y: 0.0, rz: -15 }));
  return g;
}

/** Landfill compactor with spiked steel drum wheels (~5 m). */
export function compactor({ color = PALETTE.orange } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const steel = metal(PALETTE.steelLight, { roughness: 0.35 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  // drum wheels with tamping feet
  for (const x of [-1.3, 1.3]) for (const sz of [-1, 1]) {
    g.add(place(wheel(0.62, 0.62, steel, 12), { x, y: 0.7, z: sz * 0.95 }));
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2;
      for (const dz of [-0.18, 0.18]) {
        const foot = box(0.18, 0.14, 0.14, steel);
        foot.geometry = foot.geometry.clone().translate(0, 0.6, 0);
        foot.position.set(x, 0.7, sz * 0.95 + dz);
        foot.rotation.z = a + (dz > 0 ? 0.3 : 0);
        g.add(foot);
      }
    }
  }
  // articulated body: rear engine + front frame, cab on top
  g.add(place(box(2.0, 1.0, 1.15, body), { x: -1.2, y: 0.75 }));
  g.add(place(box(1.6, 0.7, 1.0, body), { x: 1.0, y: 0.75 }));
  g.add(place(box(0.5, 0.5, 0.6, dark), { x: 0.0, y: 0.8 }));
  g.add(place(box(1.0, 1.05, 1.0, glassM), { x: -0.3, y: 1.75 }));
  g.add(place(box(1.2, 0.12, 1.2, body), { x: -0.3, y: 2.8 }));
  g.add(place(box(0.5, 0.25, 0.8, mat(PALETTE.steelDark)), { x: -1.6, y: 1.75 }));
  g.add(place(cylinder(0.07, 0.07, 0.75, dark, 6), { x: -1.2, y: 1.75, z: 0.35 }));
  // front blade
  for (const sz of [-1, 1]) g.add(beam([1.8, 0.75, sz * 0.4], [2.3, 0.6, sz * 0.4], 0.16, body));
  g.add(place(box(0.18, 0.9, 2.9, body), { x: 2.45, y: 0.15, rz: -8 }));
  // amber beacon
  g.add(place(cylinder(0.1, 0.1, 0.16, mat(PALETTE.orange, { emissive: PALETTE.orange, emissiveIntensity: 0.6 }), 8), { x: -0.3, y: 2.92 }));
  return g;
}

/** Refuse collection lorry (~7 m). tip = raise the rear tailgate. */
export function binLorry({ cab = PALETTE.white, body: bodyColor = PALETTE.green, tip = false } = {}) {
  const g = new THREE.Group();
  const cabM = mat(cab, { roughness: 0.45 });
  const bodyM = mat(bodyColor, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  for (const x of [2.5, -1.0, -2.1]) for (const sz of [-1, 1]) g.add(place(wheel(0.5, 0.35, mat(PALETTE.black)), { x, y: 0.5, z: sz * 1.0 }));
  g.add(place(box(6.6, 0.35, 1.6, dark), { x: -0.2, y: 0.55 }));
  // cab
  g.add(place(box(1.8, 2.0, 2.3, cabM), { x: 2.4, y: 0.7 }));
  g.add(place(box(0.05, 0.85, 2.0, glassM), { x: 3.31, y: 1.65 }));
  for (const sz of [-1, 1]) g.add(place(box(1.0, 0.7, 0.05, glassM), { x: 2.6, y: 1.75, z: sz * 1.16 }));
  g.add(place(box(0.08, 0.2, 2.3, mat(PALETTE.orange)), { x: 3.3, y: 0.9 }));
  g.add(place(box(0.3, 0.12, 0.6, mat(PALETTE.orange, { emissive: PALETTE.orange, emissiveIntensity: 0.5 })), { x: 2.2, y: 2.7 }));
  // compactor body with a stripe
  g.add(place(box(3.6, 2.4, 2.35, bodyM), { x: -0.2, y: 0.75 }));
  g.add(place(box(3.62, 0.3, 2.37, mat(PALETTE.white)), { x: -0.2, y: 1.6 }));
  // rear hopper / tailgate
  const gate = new THREE.Group();
  gate.add(place(box(1.3, 2.5, 2.4, bodyM), { x: -0.65 }));
  gate.add(place(box(0.08, 0.9, 2.0, dark), { x: -1.32, y: 0.2 }));
  gate.add(place(box(0.1, 0.25, 2.4, mat(PALETTE.yellow)), { x: -1.32, y: 0.0 }));
  gate.position.set(-2.0, 0.7 + 2.5, 0);
  for (const c of gate.children) c.position.y -= 2.5;
  if (tip) gate.rotation.z = -0.75;
  g.add(gate);
  return g;
}

/** Gull with spread wings (span ~1.5 m before scaling). Flies along +X. */
export function gull({ flap = 0.35, sitting = false } = {}) {
  const g = new THREE.Group();
  const white = mat(PALETTE.white, { roughness: 0.6 });
  const grey = mat(PALETTE.lightGrey, { roughness: 0.6 });
  const tip = mat(PALETTE.black);
  const beak = mat(PALETTE.yellow);
  g.add(place(box(0.55, 0.2, 0.2, white), { y: -0.1 }));
  g.add(place(box(0.18, 0.18, 0.17, white), { x: 0.32, y: 0.0 }));
  g.add(place(box(0.14, 0.05, 0.05, beak), { x: 0.47, y: 0.05 }));
  g.add(place(box(0.2, 0.06, 0.24, white), { x: -0.32, y: -0.04 }));
  if (sitting) {
    for (const sz of [-1, 1]) g.add(place(box(0.42, 0.12, 0.05, grey), { x: -0.05, y: -0.06, z: sz * 0.11 }));
    g.add(place(box(0.04, 0.2, 0.04, beak), { x: 0, y: -0.3 }));
    return g;
  }
  for (const sz of [-1, 1]) {
    const wing = new THREE.Group();
    wing.add(place(box(0.32, 0.04, 0.55, grey), { z: sz * 0.28 }));
    wing.add(place(box(0.24, 0.04, 0.22, tip), { x: -0.02, z: sz * 0.65 }));
    wing.rotation.x = sz * -flap;
    g.add(wing);
  }
  return g;
}

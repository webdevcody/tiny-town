import * as THREE from 'three';
import { PALETTE, shade, box, cylinder, place, mat, metal, glass, beam, pipe, sign } from '../../src/lib/index.js';

// Wheel lying in the XY plane (axle along Z), resting on y = 0.
function wheel(r, width, tyreM, hubM) {
  const g = new THREE.Group();
  const tyre = cylinder(r, r, width, tyreM, 14);
  tyre.rotation.x = Math.PI / 2;
  tyre.position.set(0, r, -width / 2);
  g.add(tyre);
  const hub = cylinder(r * 0.55, r * 0.55, width + 0.04, hubM, 10);
  hub.rotation.x = Math.PI / 2;
  hub.position.set(0, r, -(width + 0.04) / 2);
  g.add(hub);
  return g;
}

/** Farm tractor, ~3.7 m long, nose towards +X, origin centre of base. */
export function tractor({ color = PALETTE.red, hubColor = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  const tyreM = mat('#2a2a2a', { roughness: 0.95 });
  const hubM = mat(hubColor, { roughness: 0.5 });
  const dark = metal(PALETTE.steelDark);
  const glassM = glass(PALETTE.glassSky, { opacity: 0.55 });

  // big rear wheels, small front wheels
  for (const s of [-1, 1]) {
    g.add(place(wheel(0.8, 0.5, tyreM, hubM), { x: -0.75, z: s * 0.8 }));
    g.add(place(wheel(0.45, 0.32, tyreM, hubM), { x: 1.25, z: s * 0.62 }));
  }
  // chassis + engine hood
  g.add(place(box(2.4, 0.35, 0.7, dark), { x: 0.3, y: 0.45 }));
  g.add(place(box(1.75, 0.75, 0.82, body), { x: 0.75, y: 0.75 }));
  g.add(place(box(0.08, 0.6, 0.7, mat(PALETTE.darkGrey)), { x: 1.66, y: 0.8 })); // grille
  for (const s of [-1, 1]) g.add(place(box(0.06, 0.14, 0.18, mat('#fff6c8', { emissive: '#ffe680', emissiveIntensity: 0.3 })), { x: 1.66, y: 1.25, z: s * 0.28 }));
  // exhaust stack
  g.add(place(cylinder(0.06, 0.06, 1.1, dark, 8), { x: 1.05, y: 1.5, z: 0.3 }));
  // rear fenders over the big wheels
  for (const s of [-1, 1]) {
    g.add(place(box(1.5, 0.08, 0.6, body), { x: -0.75, y: 1.7, z: s * 0.8 }));
    g.add(place(box(0.08, 0.5, 0.6, body), { x: 0.02, y: 1.25, z: s * 0.8 }));
  }
  // cab: floor, glass, posts, roof
  g.add(place(box(1.3, 0.3, 1.0, body), { x: -0.7, y: 1.1 }));
  g.add(place(box(1.2, 1.15, 0.98, glassM), { x: -0.7, y: 1.4 }));
  for (const px of [-1.32, -0.08]) for (const s of [-1, 1]) g.add(place(box(0.08, 1.2, 0.08, dark), { x: px, y: 1.4, z: s * 0.5 }));
  g.add(place(box(1.45, 0.14, 1.15, body), { x: -0.7, y: 2.58 }));
  g.add(place(box(0.25, 0.08, 0.25, mat(PALETTE.orange, { emissive: PALETTE.orange, emissiveIntensity: 0.4 })), { x: -0.7, y: 2.72 })); // beacon
  // seat + steering visible through the glass
  g.add(place(box(0.4, 0.45, 0.45, mat(PALETTE.black)), { x: -0.9, y: 1.4 }));
  g.add(place(cylinder(0.04, 0.04, 0.4, dark, 6), { x: -0.25, y: 1.4 }));
  // three-point hitch at the back
  g.add(place(box(0.35, 0.12, 0.9, dark), { x: -1.45, y: 0.55 }));
  return g;
}

/** Four-furrow mouldboard plough, hitch towards +X, ~3 m long. */
export function plough({ color = PALETTE.blue } = {}) {
  const g = new THREE.Group();
  const frame = mat(color, { roughness: 0.5, metalness: 0.2 });
  const share = metal('#d8dde2', { roughness: 0.3 });
  const dark = metal(PALETTE.steelDark);
  // diagonal main beam
  g.add(beam([1.0, 0.95, 0.35], [-1.5, 0.95, -0.55], 0.18, frame));
  // A-frame headstock with hitch pins
  g.add(beam([1.3, 0.35, -0.45], [1.3, 1.3, 0], 0.1, frame));
  g.add(beam([1.3, 0.35, 0.45], [1.3, 1.3, 0], 0.1, frame));
  g.add(beam([1.3, 1.3, 0], [0.7, 0.95, 0.25], 0.1, frame));
  g.add(beam([1.3, 0.45, -0.45], [0.9, 0.95, 0.3], 0.1, frame));
  g.add(place(box(0.08, 0.08, 1.1, dark), { x: 1.3, y: 0.35 }));
  // four bodies: legs + curved mouldboards (two tilted plates) + shares
  for (let i = 0; i < 4; i++) {
    const t = i / 3;
    const x = 0.6 - t * 1.95, z = 0.2 - t * 0.7;
    g.add(place(box(0.12, 0.85, 0.12, frame), { x, y: 0.15, z }));
    g.add(place(box(0.75, 0.42, 0.05, share), { x: x - 0.2, y: 0.05, z: z - 0.12, ry: -28, rx: -25 }));
    g.add(place(box(0.5, 0.36, 0.05, share), { x: x - 0.55, y: 0.25, z: z - 0.34, ry: -55, rx: -40 }));
    g.add(place(box(0.4, 0.05, 0.16, dark), { x: x + 0.15, y: 0.02, z: z + 0.04, ry: -28 }));
  }
  // depth wheel at the tail
  const dw = cylinder(0.32, 0.32, 0.16, mat('#2a2a2a'), 12);
  dw.rotation.x = Math.PI / 2;
  g.add(place(dw, { x: -1.55, y: 0.32, z: -0.33 }));
  g.add(beam([-1.55, 0.32, -0.35], [-1.4, 0.95, -0.5], 0.08, frame));
  return g;
}

/** Farm diesel tank: horizontal drum on a steel stand with hose. Length along X. */
export function fuelTank({ color = PALETTE.red, length = 2.4, radius = 0.6, standH = 1.1 } = {}) {
  const g = new THREE.Group();
  const tm = mat(color, { roughness: 0.4, metalness: 0.25 });
  const sm = metal(PALETTE.steelDark);
  // stand: 4 legs + rails
  for (const x of [-length * 0.35, length * 0.35]) {
    for (const z of [-radius * 0.75, radius * 0.75]) g.add(place(box(0.1, standH, 0.1, sm), { x, z }));
    g.add(place(box(0.14, 0.1, radius * 1.7, sm), { x, y: standH - 0.1 }));
    g.add(beam([x, 0.1, -radius * 0.75], [x, standH - 0.1, radius * 0.75], 0.05, sm));
  }
  // drum with end caps
  const drum = cylinder(radius, radius, length, tm, 16);
  drum.rotation.z = Math.PI / 2;
  drum.position.set(length / 2, standH + radius, 0);
  g.add(drum);
  for (const s of [-1, 1]) {
    const cap = cylinder(radius * 1.02, radius * 1.02, 0.06, mat(shade(color, -0.25), { roughness: 0.4 }), 16);
    cap.rotation.z = Math.PI / 2;
    cap.position.set(s * length / 2 + 0.03, standH + radius, 0);
    g.add(cap);
  }
  // filler + vent on top
  g.add(place(cylinder(0.12, 0.12, 0.2, sm, 8), { x: -length * 0.25, y: standH + radius * 2 - 0.05 }));
  g.add(place(cylinder(0.03, 0.03, 0.5, sm, 6), { x: length * 0.3, y: standH + radius * 2 - 0.05 }));
  // label
  g.add(place(sign({ text: 'DIESEL', w: 1.1, h: 0.35, bg: PALETTE.white, fg: PALETTE.black, depth: 0.02 }), { y: standH + radius - 0.17, z: radius + 0.01 }));
  // pump + hose hanging down at the front end
  g.add(place(box(0.25, 0.35, 0.25, mat(PALETTE.darkGrey)), { x: length / 2 - 0.1, y: standH - 0.45, z: radius * 0.5 }));
  g.add(pipe([length / 2 - 0.1, standH - 0.45, radius * 0.5], [length / 2 + 0.05, 0.5, radius * 0.6], 0.04, mat(PALETTE.black)));
  g.add(pipe([length / 2 + 0.05, 0.5, radius * 0.6], [length / 2 - 0.1, standH - 0.2, radius * 0.7], 0.04, mat(PALETTE.black)));
  // drip tray under it
  g.add(place(box(length * 0.9, 0.08, radius * 2, mat(PALETTE.darkGrey)), {}));
  return g;
}

/** Oil drum, upright. */
export function drum({ color = PALETTE.blue } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(0.3, 0.3, 0.9, mat(color, { roughness: 0.5, metalness: 0.3 }), 12));
  for (const y of [0.3, 0.6]) g.add(place(cylinder(0.31, 0.31, 0.04, metal(PALETTE.steelDark), 12), { y }));
  return g;
}

/** Rectangular straw bale, length along X. */
export function squareBale(color = PALETTE.hay) {
  const g = new THREE.Group();
  g.add(box(1.1, 0.45, 0.55, mat(color)));
  for (const x of [-0.25, 0.25]) g.add(place(box(0.03, 0.46, 0.56, mat('#9a7a3a')), { x }));
  return g;
}

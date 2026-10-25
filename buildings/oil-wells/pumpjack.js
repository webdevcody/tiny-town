import * as THREE from 'three';
import { PALETTE, box, group, cylinder, beam, pipe, extrude, place, mat, metal } from '../../src/lib/index.js';

const DEG = Math.PI / 180;

/**
 * Nodding-donkey pumpjack, length along X: horsehead + wellhead at +x, crank,
 * gearbox and motor at -x. Origin = centre of its concrete pad, on the ground.
 *   tilt  walking-beam angle in degrees (+ = horsehead up)
 *   crank crank-arm angle in degrees (0 = towards +x, 90 = up)
 */
export function pumpjack({ tilt = 0, crank = 180, beamColor = PALETTE.yellow, headColor = PALETTE.red, weightColor = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelDark, { roughness: 0.6 });
  const frame = mat(PALETTE.darkGrey);
  const beamM = mat(beamColor, { roughness: 0.6 });
  const headM = mat(headColor, { roughness: 0.6 });
  const weightM = mat(weightColor, { roughness: 0.6 });

  const R = 2.25; // horsehead arc radius around the pivot
  const pivot = new THREE.Vector3(0.1, 2.75, 0);

  // pad and skid
  g.add(place(box(5.8, 0.2, 1.9, mat(PALETTE.concrete)), { x: 0.15 }));
  g.add(place(box(4.3, 0.22, 0.25, frame), { x: -0.55, y: 0.2, z: 0.45 }));
  g.add(place(box(4.3, 0.22, 0.25, frame), { x: -0.55, y: 0.2, z: -0.45 }));
  for (const x of [-2.4, -1.2, 0.1, 1.2]) g.add(place(box(0.2, 0.2, 1.15, frame), { x, y: 0.2 }));

  // samson post (A-frame) with saddle bearing
  const top = pivot.y - 0.25;
  for (const s of [-1, 1]) {
    g.add(beam([pivot.x - 0.85, 0.35, s * 0.45], [pivot.x, top, s * 0.14], 0.16, steel));
    g.add(beam([pivot.x + 0.75, 0.35, s * 0.45], [pivot.x, top, s * 0.14], 0.16, steel));
  }
  g.add(beam([pivot.x - 0.42, 1.5, -0.3], [pivot.x - 0.42, 1.5, 0.3], 0.1, steel));
  g.add(beam([pivot.x + 0.37, 1.5, -0.3], [pivot.x + 0.37, 1.5, 0.3], 0.1, steel));
  g.add(place(box(0.42, 0.28, 0.5, frame), { x: pivot.x, y: top - 0.05 }));

  // walking beam + horsehead + equalizer, rotated about the pivot
  const wb = new THREE.Group();
  wb.position.copy(pivot);
  wb.rotation.z = tilt * DEG;
  wb.add(place(box(3.85, 0.36, 0.32, beamM), { x: 0.0, y: -0.06 }));
  wb.add(place(box(3.85, 0.06, 0.5, beamM), { x: 0.0, y: 0.26 }));
  // horsehead: arc-faced plate centred on the pivot
  const pts = [];
  for (let a = 18; a >= -34; a -= 6.5) pts.push([R * Math.cos(a * DEG), R * Math.sin(a * DEG)]);
  const lowA = -34 * DEG;
  pts.push([(R - 0.4) * Math.cos(lowA), (R - 0.4) * Math.sin(lowA)]);
  pts.push([1.55, 0.05]);
  pts.push([1.55, 0.35]);
  pts.push([R * Math.cos(18 * DEG) - 0.35, 0.65]);
  const t = 0.42;
  wb.add(place(extrude(pts.map(([x, y]) => [x, -y]), t, headM), { rx: 90, z: -t / 2 }));
  // equalizer cross bar at the tail
  const tail = -1.85;
  wb.add(place(box(0.3, 0.26, 1.2, frame), { x: tail, y: -0.24 }));
  g.add(wb);

  // gearbox + crank + counterweights
  const C = new THREE.Vector3(-1.6, 1.2, 0);
  g.add(place(box(1.0, 0.45, 0.9, frame), { x: C.x, y: 0.3 }));
  g.add(place(box(0.8, 0.6, 0.66, mat(PALETTE.steel)), { x: C.x, y: 0.72 }));
  g.add(place(box(0.5, 0.25, 0.6, mat(PALETTE.steel)), { x: C.x, y: 1.0 }));
  g.add(place(cylinder(0.14, 0.14, 1.3, frame, 8), { x: C.x, y: C.y, rx: 90, z: -0.65 }));
  const ca = crank * DEG;
  const dir = new THREE.Vector3(Math.cos(ca), Math.sin(ca), 0);
  const tailW = new THREE.Vector3(tail, -0.36, 0).applyAxisAngle(new THREE.Vector3(0, 0, 1), tilt * DEG).add(pivot);
  for (const s of [-1, 1]) {
    const z = s * 0.52;
    const pin = C.clone().addScaledVector(dir, 0.95).setZ(s * 0.62);
    g.add(beam([C.x, C.y, z], [pin.x, pin.y, z], 0.24, frame));
    // counterweight slab on the crank arm
    const cw = C.clone().addScaledVector(dir, 0.62);
    const slab = new THREE.Group();
    slab.add(place(box(0.95, 0.62, 0.2, weightM), { y: -0.31 }));
    g.add(place(slab, { x: cw.x, y: cw.y, z, rz: crank - 90 }));
    // pitman arm from crank pin up to the equalizer
    g.add(beam([pin.x, pin.y, s * 0.66], [tailW.x, tailW.y, s * 0.55], 0.12, steel));
  }

  // prime mover: electric motor with belt guard
  g.add(place(box(0.7, 0.5, 0.55, mat(PALETTE.green)), { x: -2.45, y: 0.42, z: -0.1 }));
  g.add(place(box(0.25, 0.9, 0.85, mat(PALETTE.lightGrey)), { x: -2.2, y: 0.42, z: 0.05 }));

  // wellhead under the horsehead, bridle and polished rod
  const wx = pivot.x + R + 0.02;
  g.add(place(cylinder(0.55, 0.55, 0.03, mat('#2a2522', { roughness: 0.3 }), 12), { x: wx, y: 0.2 }));
  g.add(place(cylinder(0.32, 0.36, 0.25, frame, 10), { x: wx, y: 0.2 }));
  g.add(place(cylinder(0.16, 0.16, 0.8, steel, 8), { x: wx, y: 0.45 }));
  g.add(place(box(0.5, 0.12, 0.5, mat(PALETTE.red)), { x: wx, y: 0.9 }));
  g.add(pipe([wx, 0.7, 0], [wx, 0.7, 0.75], 0.07, steel));
  g.add(place(cylinder(0.12, 0.12, 0.2, mat(PALETTE.yellow), 8), { x: wx, y: 0.6, z: 0.6, rx: 90 }));
  const carrier = pivot.y - 1.55 + Math.sin(tilt * DEG) * R;
  g.add(pipe([wx, 1.0, 0], [wx, carrier + 0.15, 0], 0.035, mat(PALETTE.chrome)));
  g.add(place(box(0.1, 0.1, 0.4, frame), { x: wx, y: carrier }));
  for (const s of [-1, 1]) g.add(beam([wx, carrier, s * 0.14], [wx, pivot.y + Math.sin(tilt * DEG) * R - 0.1, s * 0.14], 0.03, mat(PALETTE.black)));

  return g;
}

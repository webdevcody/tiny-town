import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, place, box, boxFaces, cylinder, cone, beam, pipeRun, facadeBlock, gableRoof,
  door, car, tree, fence, streetLamp, surface, mat, metal,
} from '../../src/lib/index.js';
import { bigSign, fishPen, feedBarge, fishBins } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West end: concrete shore with the processing hut. Rest: a small lake with
// four round floating pens on a plank walkway and a feed barge at the far end.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'water'));
  const wl = LOT_HEIGHT; // water level
  const bankH = 0.45;
  const top = wl + bankH; // shore / bank top

  const grassTop = surface('grass', PALETTE.grass, { size: 4 });
  const bankSide = surface('gravel', PALETTE.sand, { size: 2 });
  const quay = surface('brick', PALETTE.stone, { size: 1.5 });
  const planks = surface('planks', PALETTE.wood, { size: 1 });

  // --- shore (x -10 .. -4.5) -------------------------------------------------
  const sx0 = -10, sx1 = -4.5, sw = sx1 - sx0, scx = (sx0 + sx1) / 2;
  const concrete = surface('concrete', PALETTE.concrete, { size: 6 });
  g.add(place(boxFaces(sw, bankH, 10, { sides: bankSide, right: quay, top: concrete }), { x: scx, y: wl }));
  // quay coping
  g.add(place(box(0.3, 0.08, 10, mat(PALETTE.offWhite)), { x: sx1 - 0.15, y: top }));

  // grass banks round the rest of the lake
  const rim = 0.45;
  g.add(place(boxFaces(20 - sw, bankH, rim, { sides: bankSide, top: grassTop }), { x: sx1 + (20 - sw) / 2, y: wl, z: -5 + rim / 2 }));
  g.add(place(boxFaces(20 - sw, bankH, rim, { sides: bankSide, top: grassTop }), { x: sx1 + (20 - sw) / 2, y: wl, z: 5 - rim / 2 }));
  g.add(place(boxFaces(rim, bankH, 10 - 2 * rim, { sides: bankSide, top: grassTop }), { x: 10 - rim / 2, y: wl, z: 0 }));
  // reeds along the banks
  const reedM = mat(PALETTE.foliageLight);
  const reed = (x, z) => {
    for (const [dx, dz, h] of [[0, 0, 0.9], [0.15, 0.1, 0.7], [-0.12, 0.08, 0.6]]) g.add(place(cone(0.07, h, reedM, 4), { x: x + dx, y: wl, z: z + dz }));
  };
  for (const x of [-3.6, 1.7, 6.6]) reed(x, -4.45);
  for (const x of [-3.2, 1.9, 6.4]) reed(x, 4.3);
  reed(9.4, -3.6);
  reed(9.35, 3.7);
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 21 }), { x: 9.7, y: top, z: -4.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 22 }), { x: 9.7, y: top, z: 4.7 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 23 }), { x: 1.75, y: top, z: 4.78 }));

  // --- processing hut ----------------------------------------------------------
  const hx = -7.45, hz = -2.15, hw = 4.6, hd = 4.1, hh = 3.2;
  g.add(place(facadeBlock({
    w: hw, d: hd, h: hh, floorHeight: hh, style: 'industrial', bay: 1.6,
    wall: PALETTE.white, frame: PALETTE.steelLight, glass: PALETTE.window, seed: 4, blank: ['right'],
  }), { x: hx, y: top, z: hz }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 1.3, overhang: 0.3, ridge: 'z', material: surface('corrugated', PALETTE.roofBlue, { size: 1.2 }), gableMaterial: PALETTE.white }), { x: hx, y: top + hh, z: hz }));
  // blue base band
  g.add(place(box(hw + 0.04, 0.5, hd + 0.04, mat(PALETTE.roofBlue)), { x: hx, y: top, z: hz }));
  // front: door + big sign
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.roofBlue }), { x: hx - 1.1, y: top, z: hz + hd / 2 }));
  g.add(place(bigSign({ text: 'FISH FARM', w: 3.8, h: 0.75, bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.white }), { x: hx, y: top + 2.35, z: hz + hd / 2 + 0.02 }));
  // fish logo on the gable
  g.add(place(fishLogo(), { x: hx, y: top + hh + 0.25, z: hz + hd / 2 + 0.33 }));
  // lake side: roller door, landing canopy
  g.add(place(box(0.08, 2.4, 2.2, surface('corrugated', PALETTE.steelLight, { size: 0.6 })), { x: hx + hw / 2 + 0.02, y: top, z: hz + 0.3 }));
  g.add(place(box(1.2, 0.1, 2.8, mat(PALETTE.roofBlue)), { x: hx + hw / 2 + 0.6, y: top + 2.6, z: hz + 0.3 }));
  // chiller unit + vent on the roof side
  g.add(place(box(1.0, 0.8, 0.8, mat(PALETTE.lightGrey)), { x: hx - hw / 2 + 0.7, y: top, z: hz - hd / 2 - 0.45 }));
  g.add(place(cylinder(0.3, 0.3, 0.06, mat(PALETTE.darkGrey), 10), { x: hx - hw / 2 + 0.7, y: top + 0.8, z: hz - hd / 2 - 0.45 }));
  g.add(place(box(1.0, 0.8, 0.8, mat(PALETTE.lightGrey)), { x: hx - hw / 2 + 1.9, y: top, z: hz - hd / 2 - 0.45 }));
  g.add(place(cylinder(0.3, 0.3, 0.06, mat(PALETTE.darkGrey), 10), { x: hx - hw / 2 + 1.9, y: top + 0.8, z: hz - hd / 2 - 0.45 }));

  // ice store (small white cold room) on the quay
  g.add(place(box(1.4, 1.9, 1.4, mat(PALETTE.offWhite)), { x: -5.3, y: top, z: -3.9 }));
  g.add(place(box(1.42, 0.25, 1.42, mat(PALETTE.blue)), { x: -5.3, y: top + 1.5, z: -3.9 }));
  g.add(place(bigSign({ text: 'ICE', w: 0.9, h: 0.35, bg: PALETTE.blue, fg: '#ffffff', depth: 0.04 }), { x: -5.3, y: top + 1.0, z: -3.18 }));

  // --- yard in front of the hut -----------------------------------------------
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: -7.75, y: top, z: 3.3, s: 0.82 }));
  g.add(place(box(1.6, 0.35, 0.02, mat(PALETTE.roofBlue)), { x: -7.9, y: top + 0.65, z: 3.3 + 0.74 }));
  g.add(place(fishBins({ n: 3 }), { x: -5.25, y: top, z: 1.0 }));
  g.add(place(fishBins({ n: 2 }), { x: -5.25, y: top, z: 2.0 }));
  g.add(place(fishBins({ n: 2, color: PALETTE.orange }), { x: -6.0, y: top, z: 0.6, ry: 90 }));
  // pallet of feed sacks
  g.add(place(box(1.1, 0.15, 1.1, mat(PALETTE.woodLight)), { x: -9.25, y: top, z: 0.8 }));
  for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
    g.add(place(box(0.5, 0.3, 0.5, mat(PALETTE.cream)), { x: -9.5 + i * 0.52, y: top + 0.15, z: 0.55 + j * 0.52 }));
  }
  g.add(place(box(0.5, 0.3, 0.5, mat(PALETTE.cream)), { x: -9.25, y: top + 0.45, z: 0.8 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -4.85, y: top, z: 4.3, ry: 180 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 31 }), { x: -9.55, y: top, z: -4.6 }));
  g.add(place(fence({ w: sw - 0.4, d: 0.1, h: 0.9, style: 'wire', sides: ['back'] }), { x: scx, y: top, z: -4.85 }));

  // bin hoist on the quay edge
  const hoistM = mat(PALETTE.yellow);
  g.add(place(cylinder(0.1, 0.12, 2.8, hoistM, 8), { x: -4.85, y: top, z: -0.9 }));
  g.add(beam([-4.85, top + 2.7, -0.9], [-3.7, top + 2.9, -0.9], 0.12, hoistM));
  g.add(beam([-3.75, top + 2.85, -0.9], [-3.75, top + 1.5, -0.9], 0.02, mat(PALETTE.black)));
  g.add(place(fishBins({ n: 1 }), { x: -3.75, y: top + 1.0, z: -0.9, s: 0.7 }));

  // --- walkway ------------------------------------------------------------------
  const wx0 = sx1, wx1 = 7.0, ww = 0.8, wlen = wx1 - wx0;
  const deckY = wl + 0.18;
  g.add(place(box(wlen, 0.14, ww + 0.1, mat(PALETTE.darkGrey)), { x: (wx0 + wx1) / 2, y: wl, z: 0 }));
  g.add(place(box(wlen, 0.06, ww, planks), { x: (wx0 + wx1) / 2, y: deckY - 0.04, z: 0 }));
  // ramp down from the quay
  g.add(place(box(1.1, 0.05, ww, planks), { x: wx0 + 0.25, y: (top + deckY) / 2 - 0.02, z: 0, rz: -14 }));
  // handrail posts on the north side + lights
  const railM = metal(PALETTE.steelLight);
  for (let x = wx0 + 1.5; x < wx1 - 0.3; x += 1.5) g.add(place(box(0.06, 0.8, 0.06, railM), { x, y: deckY, z: -ww / 2 + 0.05 }));
  g.add(place(box(wlen - 1.6, 0.05, 0.05, railM), { x: (wx0 + 1.5 + wx1 - 0.3) / 2, y: deckY + 0.78, z: -ww / 2 + 0.05 }));
  const lampM = mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.9 });
  for (const x of [1.75, 6.6]) {
    g.add(place(cylinder(0.04, 0.05, 1.8, metal(PALETTE.darkGrey), 6), { x, y: deckY, z: 0.3 }));
    g.add(place(box(0.25, 0.12, 0.25, lampM), { x, y: deckY + 1.75, z: 0.3 }));
  }

  // --- pens ---------------------------------------------------------------------
  const R = 1.75;
  const pens = [[-0.45, -2.25], [-0.45, 2.25], [4.0, -2.25], [4.0, 2.25]];
  pens.forEach(([x, z], i) => g.add(place(fishPen({ radius: R, seed: 41 + i }), { x, y: wl, z })));
  // short gangways from the walkway onto each pen
  for (const [x, z] of pens) {
    const s = Math.sign(z);
    g.add(place(box(0.7, 0.05, 0.45, planks), { x: x + 0.9, y: deckY - 0.02, z: s * 0.55 }));
  }

  // aluminium work skiff tied up by the quay
  const skiff = new THREE.Group();
  const alu = metal(PALETTE.aluminium, { roughness: 0.5 });
  skiff.add(place(box(0.95, 0.4, 1.9, alu), { y: -0.1 }));
  skiff.add(place(box(0.75, 0.05, 1.7, mat(PALETTE.steelDark)), { y: 0.25 }));
  const bow = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.4, 3).translate(0, 0.1, 0), alu);
  bow.position.z = 0.95 + 0.275;
  skiff.add(bow);
  skiff.add(place(box(0.95, 0.06, 0.2, mat(PALETTE.orange)), { y: 0.3, z: 0.2 }));
  skiff.add(place(box(0.3, 0.55, 0.3, mat(PALETTE.black)), { y: 0.1, z: -1.05 }));
  g.add(place(skiff, { x: -3.4, y: wl, z: 2.6 }));
  g.add(beam([-3.4, wl + 0.3, 3.9], [-4.5, top, 4.1], 0.03, mat(PALETTE.cream)));

  // --- feed barge + floating feed hoses ------------------------------------------
  g.add(place(feedBarge({ w: 2.2, l: 5.6 }), { x: 8.15, y: wl }));
  const hoseM = mat('#1e1f22');
  const hy = wl + 0.06;
  for (const s of [-1, 1]) {
    // near pens
    g.add(pipeRun([[7.05, wl + 0.45, s * 1.6], [6.6, hy, s * 1.9], [4.0 + R + 0.35, hy, s * 2.25]], 0.06, hoseM));
    // far pens, along the walkway edge
    g.add(pipeRun([[7.05, wl + 0.45, s * 0.9], [6.6, hy, s * 0.55], [1.9, hy, s * 0.55], [-0.45 + R * 0.95, hy, s * 1.6]], 0.06, hoseM));
  }

  return g;
}

/** Little fish emblem on a round plate, faces +Z. */
function fishLogo() {
  const g = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.06, 16).rotateX(Math.PI / 2).translate(0, 0.45, 0), mat(PALETTE.navy));
  g.add(plate);
  const fishM = mat(PALETTE.salmon);
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.2, 10, 6).scale(1.4, 0.7, 0.3), fishM);
  body.position.set(0.05, 0.45, 0.05);
  g.add(body);
  const tail = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.22, 3).rotateZ(-Math.PI / 2), fishM);
  tail.position.set(-0.3, 0.45, 0.05);
  g.add(tail);
  return g;
}

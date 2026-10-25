import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, place, group, truss, pipeRun,
  fence, tree, streetLamp, sign, door, tank, mat, metal, water, surface, car, MAT,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Back half: two round clarifiers with rotating half-bridges.
// Front-left: rapid sand filter beds. Front-right: brick pump house.

const concrete = mat(PALETTE.concrete);
const concreteDark = mat(PALETTE.concreteDark);
const bluePipe = metal(PALETTE.blue, { roughness: 0.5 });
const steelYellow = metal(PALETTE.yellow, { roughness: 0.5 });
const railing = metal(PALETTE.steelLight);

// Flat ring (annulus) lying on y = 0, thickness t.
function ring(rIn, rOut, t, material, segments = 32) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: segments });
  geo.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, material);
}

// Thin railing segment along X, centred, posts every ~1.2 m.
function rail(len, h = 0.9, material = railing) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / 1.2) + 1);
  for (let i = 0; i < n; i++) g.add(place(box(0.06, h, 0.06, material), { x: -len / 2 + (len * i) / (n - 1) }));
  g.add(place(box(len, 0.05, 0.05, material), { y: h }));
  g.add(place(box(len, 0.04, 0.04, material), { y: h * 0.5 }));
  return g;
}

// Round clarifier: concrete tank, settled water, launder channel, centre
// drive pier and a rotating half-bridge (angle in degrees) with its carriage.
function clarifier({ r = 4.2, wallH = 1.3, angle = 30, waterColor = '#5f9c95' }) {
  const g = new THREE.Group();
  g.add(cylinder(r, r + 0.15, wallH, concrete, 36));
  g.add(place(ring(r - 0.25, r, 0.12, concreteDark, 36), { y: wallH }));
  g.add(place(cylinder(r - 0.25, r - 0.25, 0.02, water(waterColor), 36), { y: wallH }));
  // peripheral launder (effluent channel) and scum baffle
  g.add(place(ring(r - 0.85, r - 0.6, 0.16, concrete, 36), { y: wallH }));
  g.add(place(ring(r - 1.25, r - 1.18, 0.14, metal(PALETTE.steel), 36), { y: wallH }));
  // centre stilling well + drive
  g.add(place(cylinder(0.85, 0.85, 0.15, metal(PALETTE.steelLight), 16), { y: wallH }));
  g.add(place(cylinder(0.45, 0.55, 0.9, metal(PALETTE.darkGrey), 12), { y: wallH }));
  g.add(place(cylinder(0.6, 0.6, 0.18, steelYellow, 12), { y: wallH + 0.9 }));
  // bridge (pivots on the centre, rides the wall on a carriage)
  const span = r + 0.1;
  const deckY = wallH + 0.55;
  const bridge = new THREE.Group();
  bridge.add(place(truss({ length: span, w: 1.0, h: 0.55, segments: 6, thickness: 0.09, material: steelYellow }), { y: wallH }));
  bridge.add(place(box(span, 0.08, 1.0, mat(PALETTE.steelDark)), { x: span / 2, y: deckY }));
  bridge.add(place(rail(span - 0.4, 0.85, steelYellow), { x: span / 2 + 0.1, y: deckY, z: 0.48 }));
  bridge.add(place(rail(span - 0.4, 0.85, steelYellow), { x: span / 2 + 0.1, y: deckY, z: -0.48 }));
  // end carriage with drive motor and wheels on the wall top
  bridge.add(place(box(0.8, 0.5, 1.5, mat(PALETTE.blue)), { x: r - 0.12, y: wallH + 0.12 }));
  bridge.add(place(box(0.5, 0.45, 0.5, mat(PALETTE.darkGrey)), { x: r - 0.12, y: deckY + 0.08, z: 0.35 }));
  // scraper arm + skimmer hanging under the bridge
  bridge.add(place(box(span - 1.2, 0.12, 0.12, metal(PALETTE.darkGrey)), { x: span / 2 + 0.4, y: wallH - 0.02, z: 0.75 }));
  bridge.add(place(box(0.08, 0.4, 0.08, metal(PALETTE.darkGrey)), { x: span - 1.2, y: wallH - 0.05, z: 0.6 }));
  bridge.add(place(box(0.08, 0.4, 0.08, metal(PALETTE.darkGrey)), { x: 1.4, y: wallH - 0.05, z: 0.6 }));
  bridge.rotation.y = THREE.MathUtils.degToRad(angle);
  g.add(bridge);
  // ladder up the outside wall
  const lad = new THREE.Group();
  lad.add(place(box(0.05, wallH + 0.9, 0.05, railing), { x: -0.25 }));
  lad.add(place(box(0.05, wallH + 0.9, 0.05, railing), { x: 0.25 }));
  for (let i = 1; i < 5; i++) lad.add(place(box(0.5, 0.04, 0.04, railing), { y: i * 0.3 }));
  return { g, lad };
}

// Rapid gravity filter block: cols x rows open cells, some backwashing (sand showing).
function filterBeds({ w, d, cols = 2, rows = 3, wallH = 1.0 }) {
  const g = new THREE.Group();
  g.add(box(w, wallH, d, concrete));
  const gallery = 1.2; // central walkway between the two columns
  const cellW = (w - gallery - 0.4 * cols) / cols;
  const cellD = (d - 0.4 * (rows + 1)) / rows;
  const sand = surface('gravel', PALETTE.sand, { size: 2 });
  const waterMat = water('#4fa6c8');
  const states = ['w', 'w', 's', 'w', 'w', 'b'];
  let k = 0;
  for (let c = 0; c < cols; c++) {
    const cx = (c === 0 ? -1 : 1) * (gallery / 2 + 0.2 + cellW / 2);
    for (let rI = 0; rI < rows; rI++) {
      const cz = -d / 2 + 0.4 + cellD / 2 + rI * (cellD + 0.4);
      const st = states[k++ % states.length];
      // recess: dark rim, then the filter surface just below the top
      g.add(place(box(cellW, 0.02, cellD, concreteDark), { x: cx, y: wallH, z: cz }));
      if (st === 's') {
        g.add(place(box(cellW - 0.1, 0.03, cellD - 0.1, sand), { x: cx, y: wallH, z: cz }));
        // wash troughs across the drained sand
        for (const t of [-0.3, 0.3]) g.add(place(box(cellW - 0.1, 0.18, 0.18, concrete), { x: cx, y: wallH, z: cz + t * cellD }));
      } else {
        g.add(place(box(cellW - 0.1, 0.03, cellD - 0.1, st === 'b' ? water('#8fbfb4') : waterMat), { x: cx, y: wallH, z: cz }));
        for (const t of [-0.3, 0.3]) g.add(place(box(cellW - 0.1, 0.1, 0.16, concrete), { x: cx, y: wallH, z: cz + t * cellD }));
      }
    }
  }
  // gallery walkway: grating deck with railings both sides
  g.add(place(box(gallery, 0.06, d - 0.2, mat(PALETTE.steelDark)), { y: wallH }));
  g.add(place(rail(d - 0.4, 0.9), { x: -gallery / 2 + 0.05, y: wallH + 0.05, ry: 90 }));
  g.add(place(rail(d - 0.4, 0.9), { x: gallery / 2 - 0.05, y: wallH + 0.05, ry: 90 }));
  // valve headstocks along the gallery
  for (let rI = 0; rI < rows; rI++) {
    const cz = -d / 2 + 0.4 + cellD / 2 + rI * (cellD + 0.4);
    for (const s of [-1, 1]) {
      g.add(place(cylinder(0.08, 0.08, 0.7, metal(PALETTE.darkGrey), 6), { x: s * 0.35, y: wallH, z: cz }));
      g.add(place(cylinder(0.2, 0.2, 0.05, metal(PALETTE.red), 10), { x: s * 0.35, y: wallH + 0.7, z: cz }));
    }
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // hard standing: gravel round the tanks, concrete yard + drive at the front
  g.add(place(patch(19, 10.2, 'gravel'), { y: y0, z: -4.4 }));
  g.add(place(patch(7.2, 9.6, 'concrete'), { x: 5.4, y: y0, z: 4.6 }));
  g.add(place(patch(3.4, 1.4, 'asphalt'), { x: 5.4, y: y0, z: 9.3 }));

  // --- clarifiers ---------------------------------------------------------
  const cz = -4.6;
  const left = clarifier({ angle: 35, waterColor: '#5f9c95' });
  const right = clarifier({ angle: 215, waterColor: '#6aa59a' });
  g.add(place(left.g, { x: -4.9, y: y0, z: cz }));
  g.add(place(right.g, { x: 4.9, y: y0, z: cz }));
  g.add(place(left.lad, { x: -4.9, y: y0, z: cz + 4.4 }));
  g.add(place(right.lad, { x: 4.9, y: y0, z: cz + 4.4 }));
  // distribution chamber between the tanks + feed pipes into the centre wells
  g.add(place(box(1.6, 1.5, 1.6, concrete), { x: 0, y: y0, z: cz }));
  g.add(place(box(1.4, 0.04, 1.4, water('#5f9c95')), { x: 0, y: y0 + 1.5, z: cz }));
  g.add(place(rail(1.6, 0.8), { x: 0, y: y0 + 1.5, z: cz + 0.8 }));
  g.add(pipeRun([[-0.8, y0 + 0.6, cz], [-4.4, y0 + 0.6, cz]], 0.22, bluePipe));
  g.add(pipeRun([[0.8, y0 + 0.6, cz], [4.4, y0 + 0.6, cz]], 0.22, bluePipe));
  // effluent pipe from the right clarifier down to the pump house
  g.add(pipeRun([[7.4, y0 + 0.5, cz + 3.2], [7.4, y0 + 0.5, 0.6], [7.4, y0 + 1.3, 0.6], [7.4, y0 + 1.3, 1.2]], 0.2, bluePipe));
  // raw-water feed from the left tank to the filter beds
  g.add(pipeRun([[-2.1, y0 + 0.45, cz + 3.0], [-2.1, y0 + 0.45, 0.4]], 0.2, bluePipe));

  // --- filter beds (front-left) ------------------------------------------
  const fx = -4.6, fz = 4.7, fw = 8.6, fd = 7.6;
  g.add(place(filterBeds({ w: fw, d: fd }), { x: fx, y: y0, z: fz }));
  // wash-water gantry bridging the beds
  const gant = new THREE.Group();
  gant.add(place(truss({ length: fw + 0.4, w: 0.7, h: 0.5, segments: 8, thickness: 0.08, material: steelYellow }), { x: -(fw + 0.4) / 2, y: 2.3 }));
  for (const s of [-1, 1]) {
    gant.add(place(box(0.2, 2.3, 0.2, steelYellow), { x: s * (fw / 2 + 0.05), y: 0, z: 0.25 }));
    gant.add(place(box(0.2, 2.3, 0.2, steelYellow), { x: s * (fw / 2 + 0.05), y: 0, z: -0.25 }));
  }
  gant.add(place(box(0.9, 0.7, 0.9, mat(PALETTE.blue)), { x: -1.6, y: 1.6 }));
  g.add(place(gant, { x: fx, y: y0 + 1.0, z: fz - 1.1 }));
  // steps up to the gallery
  for (let i = 0; i < 4; i++) g.add(place(box(1.1, 0.25 * (i + 1), 0.3, concreteDark), { x: fx, y: y0, z: fz + fd / 2 + 0.15 + (3 - i) * 0.3 }));

  // --- pump house (front-right) ------------------------------------------
  const px = 5.4, pz = 3.0, pw = 6.4, pd = 5.0, ph = 4.2;
  const brick = { style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window, bay: 1.6, windowW: 0.5, windowH: 0.55, lit: 0.15, seed: 75, roof: PALETTE.roofSlate };
  g.add(place(facadeBlock({ w: pw, d: pd, h: ph, floorHeight: ph, ...brick }), { x: px, y: y0, z: pz }));
  g.add(place(box(pw + 0.2, 0.3, pd + 0.2, mat(PALETTE.stone)), { x: px, y: y0, z: pz }));
  g.add(place(box(pw + 0.15, 0.25, pd + 0.15, mat(PALETTE.stone)), { x: px, y: y0 + ph - 0.25, z: pz }));
  g.add(place(gableRoof({ w: pw, d: pd, h: 2.0, overhang: 0.35, ridge: 'x', material: MAT.roofSlate, gableMaterial: surface('brick', PALETTE.brick, { size: 1 }) }), { x: px, y: y0 + ph, z: pz }));
  // roof ventilator lantern
  g.add(place(box(1.6, 0.7, 0.9, mat(PALETTE.white)), { x: px, y: y0 + ph + 1.75, z: pz }));
  g.add(place(gableRoof({ w: 1.6, d: 0.9, h: 0.4, overhang: 0.15, ridge: 'x', material: MAT.roofSlate, gableMaterial: PALETTE.white }), { x: px, y: y0 + ph + 2.45, z: pz }));
  // big double doors + sign on the front
  g.add(place(door({ w: 2.2, h: 2.8, color: PALETTE.green }), { x: px - 1.2, y: y0 + 0.3, z: pz + pd / 2 }));
  g.add(place(sign({ text: 'WATER WORKS', w: 4.0, h: 1.0, bg: PALETTE.navy, fg: '#ffffff' }), { x: px + 0.6, y: y0 + ph - 1.2, z: pz + pd / 2 }));
  // pipes leaving the pump house wall to the street main
  g.add(pipeRun([[px + pw / 2, y0 + 0.9, pz + 1.0], [px + pw / 2 + 0.9, y0 + 0.9, pz + 1.0], [px + pw / 2 + 0.9, y0 + 0.3, pz + 1.0], [px + pw / 2 + 0.9, y0 + 0.3, 9.2]], 0.24, bluePipe));
  g.add(place(cylinder(0.32, 0.32, 0.6, metal(PALETTE.red), 10), { x: px + pw / 2 + 0.9, y: y0 + 0.05, z: pz + 3.2 }));
  // chemical dosing tank on a plinth beside the house
  g.add(place(box(1.8, 0.3, 1.8, concreteDark), { x: 1.4, y: y0, z: 1.4 }));
  g.add(place(tank({ radius: 0.8, h: 2.2, roof: 'cone', material: mat(PALETTE.white) }), { x: 1.4, y: y0 + 0.3, z: 1.4 }));
  g.add(place(box(1.0, 0.2, 0.05, mat(PALETTE.yellow)), { x: 1.4, y: y0 + 1.5, z: 2.21 }));
  g.add(pipeRun([[1.4, y0 + 0.8, 2.2], [1.4, y0 + 0.8, 2.6], [px - pw / 2, y0 + 0.8, 2.6]], 0.08, metal(PALETTE.yellow)));

  // --- yard life: van, lamps, fence with gate, trees ------------------------
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 5.4, y: y0 + 0.05, z: 7.3, ry: 90, s: 0.75 }));
  g.add(place(streetLamp({ h: 4 }), { x: 2.6, y: y0, z: 8.6 }));
  g.add(place(streetLamp({ h: 4 }), { x: 0.0, y: y0, z: -0.5, ry: 180 }));
  const fh = 1.6, gate0 = 3.6, gate1 = 7.2;
  g.add(place(fence({ w: 19.2, d: 19.2, h: fh, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  // front run split round the gate opening in front of the drive
  g.add(place(fence({ w: gate0 + 9.6, d: 0, h: fh, style: 'wire', sides: ['front'] }), { x: (gate0 - 9.6) / 2, y: y0, z: 9.6 }));
  g.add(place(fence({ w: 9.6 - gate1, d: 0, h: fh, style: 'wire', sides: ['front'] }), { x: (gate1 + 9.6) / 2, y: y0, z: 9.6 }));
  for (const x of [gate0, gate1]) g.add(place(box(0.22, 1.9, 0.22, metal(PALETTE.darkGrey)), { x, y: y0, z: 9.6 }));
  // one gate leaf swung open inwards
  g.add(place(fence({ w: 1.7, d: 0, h: fh * 0.9, style: 'railing', sides: ['front'] }), { x: gate0 + 0.1, y: y0, z: 8.75, ry: 90 }));
  g.add(place(sign({ text: 'TOWN WATER', w: 3.2, h: 0.8, bg: PALETTE.blue, fg: '#ffffff' }), { x: 0.6, y: y0 + 0.5, z: 9.72 }));
  for (const [x, z, s, k] of [[-9.0, 9.0, 1, 'round'], [9.0, 9.0, 2, 'round'], [-9.0, -0.4, 3, 'cone'], [9.1, -0.3, 4, 'cone'], [0, 9.0, 5, 'bush']]) {
    g.add(place(tree({ kind: k, h: k === 'bush' ? 1.1 : 4.2, seed: s }), { x, y: y0, z }));
  }
  return g;
}

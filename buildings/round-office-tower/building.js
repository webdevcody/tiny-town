import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, facadeCylinder, cylinder, box, place, group,
  antenna, sign, tree, mat, metal, glass, emissive, streetLamp, bench, car, hedge,
} from '../../src/lib/index.js';

// Open-ended tube (both faces rendered), base at y = 0.
function ring(radius, h, material, segments = 32) {
  const geom = new THREE.CylinderGeometry(radius, radius, h, segments, 1, true);
  geom.translate(0, h / 2, 0);
  const m = material.clone();
  m.side = THREE.DoubleSide;
  return new THREE.Mesh(geom, m);
}

// Flat annulus lying on y = 0 (canopies, roof rims).
function disc(inner, outer, h, material, segments = 32) {
  const shape = new THREE.Shape();
  shape.absarc(0, 0, outer, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, inner, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const geom = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: segments });
  geom.rotateX(-Math.PI / 2);
  return new THREE.Mesh(geom, material);
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'paved'));

  const white = mat(PALETTE.white);
  const steel = metal(PALETTE.steelLight, { roughness: 0.35 });
  const dark = mat(PALETTE.concreteDark);

  // plaza: round paving around the drum, grass corners
  g.add(place(patch(TILE - 0.4, TILE - 0.4, 'cobbles'), { y: y0 }));

  // --- circular lobby drum: 1 tall storey of glass under a white cornice
  const lobbyR = 4.2, lobbyH = 4.2;
  g.add(place(cylinder(lobbyR + 0.15, lobbyR + 0.15, 0.3, mat(PALETTE.stone), 32), { y: y0 }));
  g.add(place(facadeCylinder({
    radius: lobbyR, h: lobbyH, floorHeight: lobbyH, segments: 32, bay: 2.1,
    style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.steelDark, lit: 0.25, seed: 3,
    roof: PALETTE.concrete,
  }), { y: y0 + 0.3 }));
  const lobbyTop = y0 + 0.3 + lobbyH;
  g.add(place(cylinder(lobbyR + 0.25, lobbyR + 0.25, 0.55, white, 32), { y: lobbyTop }));
  // landscaped lobby roof: hedge ring of planters
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 + 0.3;
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: 50 + i }), { x: Math.cos(a) * 3.9, y: lobbyTop + 0.55, z: Math.sin(a) * 3.9 }));
  }

  // entrance: projecting canopy, revolving door, sign
  g.add(place(box(3.2, 0.25, 1.1, steel), { y: y0 + 3.0, z: lobbyR + 0.25 }));
  g.add(place(box(3.2, 0.12, 0.12, emissive(PALETTE.windowLit, 0.6)), { y: y0 + 2.94, z: lobbyR + 0.75 }));
  for (const x of [-1.45, 1.45]) g.add(place(cylinder(0.08, 0.08, 3.0, steel, 8), { x, y: y0, z: lobbyR + 0.7 }));
  g.add(place(cylinder(0.8, 0.8, 2.6, glass(PALETTE.glassSky), 16), { y: y0 + 0.3, z: lobbyR - 0.1 }));
  g.add(place(cylinder(0.85, 0.85, 0.2, steel, 16), { y: y0 + 2.9, z: lobbyR - 0.1 }));
  g.add(place(sign({ text: 'ROTUNDA', w: 2.8, h: 0.55, bg: PALETTE.navy, fg: '#ffffff' }), { y: y0 + 3.3, z: lobbyR + 0.7 }));

  // --- tower shaft: glass core wrapped in white spandrel bands = ribbon windows
  const towerR = 3.4, floors = 11;
  const towerY = lobbyTop + 0.55;
  g.add(place(facadeCylinder({
    radius: towerR, floors, segments: 32, bay: 1.6,
    style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelLight, lit: 0.15, seed: 17,
    roof: PALETTE.concreteDark,
  }), { y: towerY }));
  for (let f = 0; f < floors; f++) {
    const thick = f % 4 === 0;
    g.add(place(cylinder(towerR + (thick ? 0.2 : 0.12), towerR + (thick ? 0.2 : 0.12), thick ? 1.1 : 0.85, white, 32), { y: towerY + f * FLOOR }));
  }
  const roofY = towerY + floors * FLOOR;
  g.add(place(cylinder(towerR + 0.3, towerR + 0.3, 0.6, white, 32), { y: roofY }));
  g.add(place(ring(towerR + 0.2, 0.5, mat(PALETTE.white)), { y: roofY + 0.6 }));

  // --- rooftop: plant drum ringed by a louvred crown on posts
  const topY = roofY + 0.6;
  g.add(place(cylinder(2.0, 2.0, 2.2, mat(PALETTE.lightGrey), 20), { y: topY }));
  g.add(place(cylinder(2.1, 2.1, 0.2, dark, 20), { y: topY + 2.2 }));
  for (const [x, z] of [[0.6, 0.4], [-0.5, -0.6]]) g.add(place(box(0.8, 0.6, 0.8, mat(PALETTE.steel)), { x, y: topY + 2.4, z }));
  // crown ring
  const ringR = towerR + 0.35, ringY = topY + 1.4;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(place(box(0.14, 1.4, 0.14, steel), { x: Math.cos(a) * ringR, y: topY, z: Math.sin(a) * ringR }));
  }
  g.add(place(ring(ringR, 1.5, metal(PALETTE.steel, { roughness: 0.4 })), { y: ringY }));
  g.add(place(ring(ringR + 0.02, 0.18, emissive('#bfe6ff', 0.7)), { y: ringY + 0.15 }));
  g.add(place(disc(ringR - 0.15, ringR + 0.15, 0.12, white), { y: ringY + 1.5 }));
  g.add(place(antenna({ h: 6, radius: 0.12 }), { x: 0.3, y: topY + 2.4, z: -0.3 }));

  // --- plaza props
  const half = TILE / 2;
  // corner trees in round planters
  for (const [x, z, s] of [[-3.9, -3.9, 1], [3.9, -3.9, 2], [-4.0, 3.9, 3]]) {
    g.add(place(cylinder(0.75, 0.75, 0.45, mat(PALETTE.stoneDark), 12), { x, y: y0, z }));
    g.add(place(tree({ kind: 'round', h: 4.2, seed: s }), { x, y: y0 + 0.45, z }));
  }
  // drop-off spot with a taxi at the front right
  g.add(place(patch(2.2, 3.6, 'asphalt'), { x: 3.75, y: y0, z: 3.0 }));
  g.add(place(car({ kind: 'taxi' }), { x: 3.75, y: y0 + 0.05, z: 3.0, ry: 90, s: 0.62 }));
  // lamps, benches, low hedges along the back
  g.add(place(streetLamp({ h: 3.8 }), { x: -2.6, y: y0, z: half - 0.4, ry: 0 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: 2.0, y: y0, z: half - 0.4, ry: 180 }));
  g.add(place(bench({ w: 1.3 }), { x: -4.4, y: y0, z: 0.4, ry: 90 }));
  g.add(place(bench({ w: 1.3 }), { x: 4.4, y: y0, z: -0.6, ry: -90 }));
  g.add(place(hedge({ w: 4.4, h: 0.7, d: 0.5 }), { y: y0, z: -half + 0.4 }));
  // bollards across the entrance
  for (const x of [-2.2, -1.1, 1.1]) g.add(place(cylinder(0.1, 0.1, 0.6, dark, 6), { x, y: y0, z: half - 1.1 }));

  return g;
}

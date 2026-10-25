import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, FLOOR,
  lot, patch, box, boxFaces, place, mat, metal, surface, facadeBlock, gableRoof, pyramidRoof,
  door, stairs, fence, tree, car, antenna, streetLamp, glass, emissive,
} from '../../src/lib/index.js';
import {
  flatSign, stationSignTexture, padDeck, lifeboat, helicopter, windsock, lifebuoyStand, bollard, buoy, rock,
} from './props.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z, the sea is along the east (+x) edge.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'water'));
  const yW = LOT_HEIGHT; // sea level

  // land: raised quay with a stone seawall towards the sea (x <= 2)
  const quayX = 2.0, landH = 0.45, yL = yW + landH;
  const wallM = surface('cobbles', PALETTE.stone, { size: 1.5 });
  g.add(place(boxFaces(5 + quayX, landH, 10, { sides: wallM, top: surface('grass', PALETTE.grass, { size: 4 }) }), { x: (quayX - 5) / 2, y: yW }));
  g.add(place(box(0.25, 0.1, 10, mat(PALETTE.concrete)), { x: quayX - 0.12, y: yL }));

  const white = PALETTE.white;
  const roofM = surface('roofTiles', PALETTE.roofRed, { size: 1.6 });
  const facadeStyle = { style: 'punched', wall: white, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.5, lit: 0.15, seed: 7, roof: PALETTE.roofGrey };

  // ---- station / boathouse on a stone plinth -----------------------------------------
  const sx = -0.3, sz = -2.6, sw = 4.6, sd = 4.0, plinthH = 0.5, yP = yL + plinthH;
  g.add(place(box(sw + 0.3, plinthH, sd + 0.3, mat(PALETTE.stoneDark)), { x: sx - 0.1, y: yL, z: sz }));
  g.add(place(facadeBlock({ w: sw, d: sd, floors: 2, bay: 1.5, ...facadeStyle, blank: ['right'] }), { x: sx, y: yP, z: sz }));
  // red string course between floors
  g.add(place(box(sw + 0.08, 0.18, sd + 0.08, mat(PALETTE.red)), { x: sx, y: yP + FLOOR - 0.09, z: sz }));
  g.add(place(gableRoof({ w: sw, d: sd, h: 2.0, overhang: 0.35, ridge: 'x', material: roofM, gableMaterial: white }), { x: sx, y: yP + 2 * FLOOR, z: sz }));
  g.add(place(box(0.7, 1.5, 0.7, mat(PALETTE.brick)), { x: sx - 1.2, y: yP + 2 * FLOOR + 0.6, z: sz - 0.8 }));
  g.add(place(antenna({ h: 3, radius: 0.06 }), { x: sx + 1.6, y: yP + 2 * FLOOR + 1.6, z: sz }));

  // boathouse doors on the sea end, sign and upper windows
  const bx = sx + sw / 2;
  g.add(place(box(0.06, 2.75, 2.3, mat(PALETTE.red)), { x: bx + 0.02, y: yP, z: sz }));
  g.add(place(box(0.08, 2.55, 1.9, mat('#1c2330')), { x: bx + 0.04, y: yP, z: sz }));
  g.add(place(flatSign(stationSignTexture('LIFEBOAT', 'coast-guard-station:lifeboat'), { w: 2.6, h: 0.55, depth: 0.1 }), { x: bx + 0.06, y: yP + 3.15, z: sz, ry: 90 }));
  for (const z of [sz - 1.2, sz + 1.2]) {
    g.add(place(box(0.06, 1.2, 0.8, glass(PALETTE.window)), { x: bx + 0.03, y: yP + 3.9, z }));
    g.add(place(box(0.08, 0.1, 0.95, mat(white)), { x: bx + 0.05, y: yP + 3.85, z }));
  }
  g.add(place(box(0.06, 0.8, 0.8, glass(PALETTE.window)), { x: bx + 0.03, y: yP + 6.3, z: sz }));

  // street front: door, porch, steps and the big sign
  const fz = sz + sd / 2, doorX = sx + 1.1;
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.red }), { x: doorX, y: yP, z: fz }));
  g.add(place(box(1.6, 0.12, 0.9, mat(PALETTE.red)), { x: doorX, y: yP + 2.45, z: fz + 0.45 }));
  g.add(place(stairs({ w: 1.2, h: plinthH, d: 0.75, steps: 3, material: mat(PALETTE.concrete) }), { x: doorX, y: yL, z: fz + 0.15 + 0.37 }));
  g.add(place(flatSign(stationSignTexture('COAST GUARD', 'coast-guard-station:main'), { w: 4.2, h: 0.72 }), { x: sx, y: yP + FLOOR - 0.4, z: fz + 0.08 }));

  // ---- slipway down into the sea with the lifeboat on it -----------------------------
  const run = 5.15 - quayX, drop = yP - (yW + 0.1);
  const ang = Math.atan2(drop, run), L = Math.hypot(run, drop);
  const ramp = new THREE.Group();
  ramp.position.set(quayX, yP, sz);
  ramp.rotation.z = -ang;
  ramp.add(place(box(L, 0.2, 1.6, mat(PALETTE.concrete)), { x: L / 2, y: -0.2 }));
  for (const z of [-0.38, 0.38]) ramp.add(place(box(L, 0.07, 0.1, metal(PALETTE.steel)), { x: L / 2, z }));
  for (const z of [-0.85, 0.85]) ramp.add(place(box(L, 0.25, 0.1, mat(PALETTE.red)), { x: L / 2, y: -0.05, z }));
  for (const x of [0.4, 1.2, 2.0, 2.8]) ramp.add(place(box(0.25, 0.2, 0.9, mat(PALETTE.woodDark)), { x }));
  ramp.add(place(lifeboat(), { x: 1.35, y: 0.18 }));
  g.add(ramp);
  for (const x of [2.7, 3.5, 4.3]) {
    const top = yP - (x - quayX) * Math.tan(ang) - 0.2;
    for (const z of [sz - 0.6, sz + 0.6]) g.add(place(box(0.18, top - yW + 0.01, 0.18, mat(PALETTE.woodDark)), { x, y: yW, z }));
  }

  // ---- lookout tower with a glazed watch room and radar ------------------------------
  const tx = -3.75, tz = -3.5, ts = 1.9, th = 9;
  g.add(place(facadeBlock({ w: ts, d: ts, h: th, floorHeight: 2.25, bay: 1.9, ...facadeStyle, windowW: 0.35, windowH: 0.45, seed: 3 }), { x: tx, y: yL, z: tz }));
  for (const y of [yL + 2.25 * 2, yL + th - 0.35]) g.add(place(box(ts + 0.06, 0.35, ts + 0.06, mat(PALETTE.red)), { x: tx, y, z: tz }));
  const yT = yL + th;
  g.add(place(box(2.5, 0.15, 2.5, mat(PALETTE.concrete)), { x: tx, y: yT, z: tz }));
  g.add(place(fence({ w: 2.4, d: 2.4, h: 0.55, style: 'railing', color: PALETTE.white }), { x: tx, y: yT + 0.15, z: tz }));
  g.add(place(box(1.8, 1.4, 1.8, glass(PALETTE.glassSky)), { x: tx, y: yT + 0.15, z: tz }));
  g.add(place(box(1.84, 0.35, 1.84, mat(white)), { x: tx, y: yT + 0.15, z: tz }));
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.12, 1.4, 0.12, mat(white)), { x: tx + cx * 0.88, y: yT + 0.15, z: tz + cz * 0.88 }));
  g.add(place(pyramidRoof({ w: 1.8, h: 0.9, overhang: 0.25, material: roofM }), { x: tx, y: yT + 1.55, z: tz }));
  const yR = yT + 2.45;
  g.add(place(box(0.12, 0.6, 0.12, mat(PALETTE.darkGrey)), { x: tx, y: yR - 0.1, z: tz }));
  g.add(place(box(1.5, 0.14, 0.22, mat(white)), { x: tx, y: yR + 0.5, z: tz, ry: 35 }));
  g.add(place(antenna({ h: 2.2, radius: 0.05 }), { x: tx - 0.7, y: yT + 1.6, z: tz - 0.7 }));

  // ---- rescue helipad with helicopter + windsock -------------------------------------
  const px = -2.55, pz = 2.5, ps = 4.5;
  g.add(place(padDeck(ps, 0.2), { x: px, y: yL, z: pz }));
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(box(0.2, 0.12, 0.2, emissive(PALETTE.green, 1)), { x: px + cx * (ps / 2 - 0.15), y: yL + 0.2, z: pz + cz * (ps / 2 - 0.15) }));
  }
  g.add(place(helicopter(), { x: px + 0.1, y: yL + 0.2, z: pz, ry: 25, s: 1.05 }));
  g.add(place(windsock(3.2), { x: -4.6, y: yL, z: -0.6 }));

  // ---- front apron by the quay: patrol 4x4, railing, bollards, lifebuoy -------------
  g.add(place(patch(quayX + 0.2, 4.6, 'concrete'), { x: (quayX - 0.2) / 2, y: yL, z: 2.6 }));
  g.add(place(patch(1.2, 0.5, 'concrete'), { x: doorX, y: yL, z: 0.1 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 1.0, y: yL + 0.05, z: 2.9, ry: 90, s: 0.5 }));
  g.add(place(box(0.92, 0.12, 0.01, mat('#f0701e')), { x: 1.0 + 0.455, y: yL + 0.05 + 0.4, z: 2.75, ry: 90 }));
  g.add(place(box(0.92, 0.12, 0.01, mat('#f0701e')), { x: 1.0 - 0.455, y: yL + 0.05 + 0.4, z: 2.75, ry: 90 }));
  g.add(place(box(0.5, 0.1, 0.25, emissive('#5aa8ff', 1)), { x: 1.0, y: yL + 0.05 + 1.08, z: 3.2 }));
  g.add(place(fence({ w: 4.6, d: 0.1, h: 0.9, style: 'railing', color: PALETTE.white, sides: ['front'] }), { x: quayX - 0.1, y: yL, z: 2.7, ry: 90 }));
  g.add(place(fence({ w: 3.8, d: 0.1, h: 0.9, style: 'railing', color: PALETTE.white, sides: ['front'] }), { x: -2.7, y: yL, z: 4.95 }));
  for (const z of [-0.2, 4.7]) g.add(place(bollard(), { x: quayX - 0.3, y: yL, z }));
  g.add(place(lifebuoyStand(), { x: quayX - 0.35, y: yL, z: 0.6, ry: 90 }));
  g.add(place(streetLamp({ h: 3.2 }), { x: -0.05, y: yL, z: 4.6, ry: 90 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 4 }), { x: -2.4, y: yL, z: -0.1 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 9 }), { x: -4.4, y: yL, z: -4.6 }));

  // ---- the sea side: rocks along the seawall and a channel buoy ---------------------
  let seed = 1;
  for (const [x, z, r] of [[2.35, 0.2, 0.35], [2.45, 1.3, 0.42], [2.3, 2.4, 0.3], [2.5, 3.5, 0.4], [2.3, 4.5, 0.33], [2.4, -4.6, 0.4], [2.3, -0.7, 0.3], [3.0, 4.2, 0.28]]) {
    g.add(place(rock(r, seed++), { x, z }));
  }
  g.add(place(buoy(), { x: 4.1, y: yW, z: 2.6 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, hipRoof, gableRoof, chimney, door, box, place,
  pool, hedge, tree, car, fence, surface, mat, bench,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const wall = PALETTE.peach;
  const roofMat = surface('roofTiles', PALETTE.terracotta, { size: 2 });
  const facadeStyle = { style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window, shutters: PALETTE.woodDark, windowW: 0.42, windowH: 0.5, bay: 2.2, lit: 0.1, seed: 11, roof: PALETTE.roofBrown };

  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // main house: 2 storeys with hipped roof
  const hx = -1.7, hz = -1.0, hw = 5.6, hd = 5.6;
  g.add(place(facadeBlock({ w: hw, d: hd, floors: 2, ...facadeStyle }), { x: hx, y: y0, z: hz }));
  g.add(place(hipRoof({ w: hw, d: hd, h: 2.3, overhang: 0.45, material: roofMat }), { x: hx, y: y0 + FLOOR * 2, z: hz }));
  g.add(place(chimney({ h: 2.6, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: hx - 1.6, y: y0 + FLOOR * 2 + 0.3, z: hz - 1.2 }));

  // front door + porch roof
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.navy }), { x: hx + 0.9, y: y0, z: hz + hd / 2 }));
  g.add(place(box(2.2, 0.15, 1.3, PALETTE.white), { x: hx + 0.9, y: y0 + 2.6, z: hz + hd / 2 + 0.65 }));
  g.add(place(box(0.15, 2.6, 0.15, PALETTE.white), { x: hx + 1.85, y: y0, z: hz + hd / 2 + 1.2 }));
  g.add(place(box(0.15, 2.6, 0.15, PALETTE.white), { x: hx - 0.05, y: y0, z: hz + hd / 2 + 1.2 }));
  g.add(place(box(2.2, 0.15, 1.4, PALETTE.concrete), { x: hx + 0.9, y: y0, z: hz + hd / 2 + 0.7 }));

  // garage wing (single storey, gable roof)
  const gx = 2.75, gz = 0.0, gw = 3.3, gd = 4.6;
  g.add(place(facadeBlock({ w: gw, d: gd, floors: 1, ...facadeStyle, blank: ['front', 'right'] }), { x: gx, y: y0, z: gz }));
  g.add(place(gableRoof({ w: gw, d: gd, h: 1.4, overhang: 0.3, ridge: 'z', material: roofMat, gableMaterial: wall }), { x: gx, y: y0 + FLOOR, z: gz }));
  g.add(place(box(2.6, 2.3, 0.1, mat(PALETTE.white)), { x: gx, y: y0, z: gz + gd / 2 }));
  for (let i = 1; i < 5; i++) g.add(place(box(2.6, 0.04, 0.12, mat(PALETTE.lightGrey)), { x: gx, y: y0 + i * 0.46, z: gz + gd / 2 }));

  // driveway, path, car
  g.add(place(patch(2.9, 2.75, 'concrete'), { x: gx, y: y0, z: 3.62 }));
  g.add(place(patch(1.2, 1.9, 'paved'), { x: hx + 0.9, y: y0, z: 4.05 }));
  g.add(place(car({ color: PALETTE.blue }), { x: gx, y: y0 + 0.05, z: 3.65, ry: 90, s: 0.62 }));

  // back yard: patio + pool + loungers
  g.add(place(patch(4.6, 3.3, 'paved'), { x: 2.6, y: y0, z: -3.4 }));
  g.add(place(pool({ w: 3.4, d: 1.9 }), { x: 2.6, y: y0 + 0.05, z: -3.45 }));
  g.add(place(box(0.7, 0.3, 1.6, PALETTE.white), { x: 0.75, y: y0 + 0.05, z: -3.2 }));
  g.add(place(bench({ w: 1.4 }), { x: hx, y: y0, z: hz - hd / 2 - 0.9, ry: 180 }));

  // garden: hedges along the sides/back, a few trees and bushes
  g.add(place(hedge({ w: TILE - 0.4, h: 1.1, d: 0.6 }), { y: y0, z: -TILE / 2 + 0.35 }));
  g.add(place(hedge({ w: 6.2, h: 1.1, d: 0.6 }), { x: -TILE / 2 + 0.35, y: y0, z: -1.6, ry: 90 }));
  g.add(place(fence({ w: 5.5, d: 0.1, h: 0.8, style: 'picket', sides: ['front'] }), { x: -2.0, y: y0, z: TILE / 2 - 0.3 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 3 }), { x: -3.5, y: y0, z: 3.2 }));
  g.add(place(tree({ kind: 'cone', h: 5, seed: 4 }), { x: -3.7, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -0.2, y: y0, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 6 }), { x: -3.4, y: y0, z: 2.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 7 }), { x: 4.4, y: y0, z: -1.6 }));
  return g;
}

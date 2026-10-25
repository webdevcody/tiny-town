import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, door, box, place, beam, mat, metal, surface,
  tree, car, bench, streetLamp, fence,
} from '../../src/lib/index.js';
import { bigSign, gondola, bullwheel, ropewayPylon, hillside } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z; the ropeway climbs towards -z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const timber = surface('planks', PALETTE.wood, { size: 1.2 });
  const timberDark = mat(PALETTE.woodDark);
  const steelM = metal(PALETTE.steelLight, { roughness: 0.5 });
  const ropeM = metal(PALETTE.black, { roughness: 0.6 });

  // --- hillside behind the station: grass -> rock -> snow, falls to 0 at the tile edges
  const bump = (x, z, cx, cz, r, h) => {
    const d2 = ((x - cx) ** 2 + (z - cz) ** 2) / (r * r);
    return d2 >= 1 ? 0 : h * (1 - d2) ** 1.5;
  };
  const edge = (v) => Math.min(1, Math.max(0, v / 1.3));
  const hillH = (x, z) => edge(5 - Math.abs(x)) * edge(5 + z) *
    (bump(x, z, -3.0, -3.2, 3.0, 5.0) + bump(x, z, 2.8, -3.4, 2.6, 3.0) + bump(x, z, 0, -4.2, 2.0, 1.2));
  g.add(place(hillside({ x0: -5, x1: 5, z0: -5, z1: -0.2, nx: 12, nz: 6, heightAt: hillH, seed: 7, snowLine: 3.2, rockLine: 0.9 }), { y: y0 + 0.02 }));

  // --- station: stone ticket hall with the open bullwheel shed on top
  const sw = 6.4, sd = 3.6, sz = 1.8;           // ticket hall footprint (z 0 .. 3.6)
  g.add(place(facadeBlock({ w: sw, d: sd, floors: 1, style: 'punched', wall: PALETTE.stone, frame: PALETTE.white, glass: PALETTE.window, shutters: PALETTE.woodDark, windowW: 0.45, windowH: 0.5, bay: 1.6, lit: 0.2, seed: 3, roof: PALETTE.concrete }), { y: y0, z: sz }));
  const yd = y0 + 3;                              // shed deck level
  g.add(place(box(sw + 0.4, 0.25, sd + 0.6, mat(PALETTE.concreteDark)), { y: yd, z: sz - 0.2 }));
  const deckTop = yd + 0.25;

  // entrance: double door, canopy and a ticket sign
  g.add(place(door({ w: 1.6, h: 2.3, color: PALETTE.woodDark }), { x: 0, y: y0, z: sz + sd / 2 }));
  g.add(place(box(2.8, 0.18, 1.2, timberDark), { x: 0, y: y0 + 2.45, z: sz + sd / 2 + 0.6 }));
  g.add(place(bigSign({ text: 'TICKETS', w: 1.5, h: 0.32, bg: PALETTE.navy }), { x: 0, y: y0 + 2.63, z: sz + sd / 2 + 1.05 }));

  // shed posts, low timber side walls, front gable wall with the big sign
  const shedH = 2.9;
  const roofY = deckTop + shedH;
  for (const x of [-sw / 2 + 0.12, sw / 2 - 0.12]) {
    for (const z of [-0.3, sz, sd - 0.12]) g.add(place(box(0.22, shedH, 0.22, steelM), { x, y: deckTop, z }));
    g.add(place(box(0.14, 1.0, sd + 0.45, timber), { x, y: deckTop, z: sz - 0.2 }));
    g.add(place(box(0.18, 0.12, sd + 0.45, steelM), { x, y: deckTop + 1.0, z: sz - 0.2 }));
  }
  g.add(place(box(sw, 1.0, 0.16, timber), { y: deckTop, z: sd - 0.08 }));
  g.add(place(box(sw, 0.9, 0.16, timber), { y: roofY - 0.9, z: sd - 0.08 }));
  g.add(place(bigSign({ text: 'CABLE CAR', w: 4.6, h: 0.95, bg: PALETTE.red, border: '#ffffff' }), { y: roofY - 0.95, z: sd + 0.02 }));
  g.add(place(gableRoof({ w: sw, d: sd + 0.5, h: 1.0, overhang: 0.35, ridge: 'z', material: surface('corrugated', PALETTE.roofSlate, { size: 1 }), gableMaterial: timber }), { y: roofY, z: sz - 0.25 }));

  // bullwheel, drive shaft and gearbox
  const ropeY = deckTop + 1.5;
  const span = 3;                                 // distance between up and down ropes
  const wheelZ = 2.2;
  g.add(place(box(1.3, 0.9, 1.1, mat(PALETTE.green)), { y: deckTop, z: wheelZ }));
  g.add(place(box(0.9, 0.6, 0.7, mat(PALETTE.darkGrey)), { x: 1.5, y: deckTop, z: wheelZ + 0.9 }));
  g.add(place(box(0.25, ropeY - deckTop - 0.9, 0.25, mat(PALETTE.darkGrey)), { y: deckTop + 0.9, z: wheelZ }));
  g.add(place(bullwheel({ radius: span / 2, color: PALETTE.yellow }), { y: ropeY, z: wheelZ }));
  // gondola guide rails along the platform
  for (const sx of [-1, 1]) {
    g.add(place(box(0.12, 0.12, wheelZ + 0.6, metal(PALETTE.steelDark)), { x: sx * (span / 2 + 0.25), y: ropeY + 0.35, z: (wheelZ - 0.6) / 2 }));
    for (const z of [-0.4, wheelZ]) g.add(place(box(0.08, roofY - ropeY - 0.35, 0.08, metal(PALETTE.steelDark)), { x: sx * (span / 2 + 0.25), y: ropeY + 0.35, z }));
  }

  // --- ropeway: pylon on the hill and two haul ropes
  const pz = -4.0;
  const pylonBase = y0 + hillH(0, pz) + 0.1;
  const pylon = ropewayPylon({ h: 7.6 - pylonBase - 0.6, span, color: PALETTE.steelLight });
  g.add(place(pylon.group, { y: pylonBase, z: pz }));
  const pTop = pylonBase + pylon.top;
  const exitZ = -0.3;
  const endZ = -5.15, endY = pTop + 0.6;
  const ropeAt = (z) => (z >= exitZ ? ropeY : z >= pz ? ropeY + (pTop - ropeY) * (exitZ - z) / (exitZ - pz) : pTop + (endY - pTop) * (pz - z) / (pz - endZ));
  for (const sx of [-1, 1]) {
    const x = sx * span / 2;
    g.add(beam([x, ropeY, wheelZ], [x, ropeY, exitZ], 0.07, ropeM));
    g.add(beam([x, ropeY, exitZ], [x, pTop, pz], 0.07, ropeM));
    g.add(beam([x, pTop, pz], [x, endY, endZ], 0.07, ropeM));
  }
  // two red gondolas: one coming down, one going up
  for (const [x, z] of [[-span / 2, -2.5], [span / 2, -1.25]]) {
    g.add(place(gondola({ color: PALETTE.red }), { x, y: ropeAt(z), z }));
  }

  // --- forecourt and props
  g.add(place(patch(10, 1.5, 'paved'), { y: y0, z: 4.25 }));
  g.add(place(patch(1.8, 3.6, 'gravel'), { x: 4.1, y: y0, z: 1.8 }));
  g.add(place(car({ color: PALETTE.blue }), { x: 4.1, y: y0 + 0.05, z: 1.6, ry: 90, s: 0.62 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 4.6, y: y0, z: 4.6, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: -2.3, y: y0, z: 4.55, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: 2.3, y: y0, z: 4.55, ry: 180 }));
  // trail board: summit information on two posts
  for (const x of [-4.75, -3.45]) g.add(place(box(0.1, 1.2, 0.1, timberDark), { x, y: y0, z: 4.55 }));
  g.add(place(bigSign({ text: 'SUMMIT 2400 m', w: 1.6, h: 0.65, bg: PALETTE.green, border: '#ffffff' }), { x: -4.1, y: y0 + 1.1, z: 4.6 }));

  // ski rack on the left side
  const rackX = -4.1, rackZ = 1.6;
  g.add(place(box(0.12, 1.1, 2.4, timberDark), { x: rackX - 0.25, y: y0, z: rackZ }));
  g.add(place(box(0.5, 0.1, 2.4, timberDark), { x: rackX, y: y0 + 0.9, z: rackZ }));
  const skiCols = [PALETTE.yellow, PALETTE.blue, PALETTE.red, PALETTE.orange, PALETTE.green, PALETTE.purple];
  skiCols.forEach((c, i) => g.add(place(box(0.08, 1.7, 0.1, mat(c)), { x: rackX + 0.05, y: y0, z: rackZ - 1.0 + i * 0.4, rz: 8 })));
  g.add(place(fence({ w: 1.6, d: 4.2, h: 0.8, style: 'wire', sides: ['left'] }), { x: -4.2, y: y0, z: 1.8 }));

  // pines on the hillside
  for (const [x, z, h, s] of [[-4.3, -0.9, 3.0, 1], [-0.9, -1.0, 2.2, 2], [4.4, -0.9, 3.2, 3], [4.3, -4.5, 2.4, 4], [-4.5, -4.5, 2.2, 5], [1.4, -4.7, 2.0, 6], [-1.4, -4.6, 1.8, 7]]) {
    g.add(place(tree({ kind: 'cone', h, seed: s, color: PALETTE.foliageDark }), { x, y: y0 + hillH(x, z), z }));
  }
  return g;
}

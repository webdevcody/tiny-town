import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, shade,
  lot, patch, facadeBlock, prismBlock, gableRoof, box, place, mat, glass, emissive,
  sign, flag, streetLamp, bench, tree, car, spire, door, cylinder,
} from '../../src/lib/index.js';
import { archSlab, notched } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
const GRANITE = '#d68f8a';
const GRANITE_DARK = shade(GRANITE, -0.18);
const GRANITE_LIGHT = shade(GRANITE, 0.18);
const ROOF = '#8a4549';

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const add = (obj, at) => g.add(place(obj, at));
  g.add(lot([2, 1], 'paved'));

  const stone = mat(GRANITE);
  const stoneDark = mat(GRANITE_DARK);
  const stoneLight = mat(GRANITE_LIGHT);
  const roofM = mat(ROOF, { roughness: 0.7 });
  const punched = { style: 'punched', wall: GRANITE, glass: PALETTE.glassDark, frame: GRANITE_DARK, windowW: 0.5, windowH: 0.62, lit: 0.05, seed: 32, roof: GRANITE_DARK };
  const cz = -0.6; // tower centre line (leaves a forecourt on the street side)

  // --- granite base: 3 tall storeys, darker stone
  const baseW = 16, baseD = 8, baseFH = 4.2, baseH = 2 * baseFH;
  add(facadeBlock({ w: baseW, d: baseD, floors: 2, floorHeight: baseFH, ...punched, wall: GRANITE_DARK, frame: shade(GRANITE_DARK, -0.15), windowW: 0.42, windowH: 0.55, bay: 2.3 }), { y: y0, z: cz });
  add(box(baseW + 0.6, 0.6, baseD + 0.6, stoneLight), { y: y0 + baseH, z: cz });
  add(box(baseW + 0.2, 0.5, baseD + 0.2, stoneDark), { y: y0, z: cz }); // plinth

  // arched entrance: stone frame, dark fanlight glass, doors
  const front = cz + baseD / 2;
  const aw = 3.4, ah = 7.0;
  add(archSlab({ w: aw + 0.4, h: ah + 0.2, depth: 0.12, material: glass(PALETTE.glassDark) }), { y: y0, z: front });
  add(archSlab({ w: aw, h: ah, t: 0.7, depth: 0.55, material: stoneLight }), { y: y0, z: front });
  add(box(aw, 0.16, 0.2, stoneLight), { y: y0 + 3.4, z: front + 0.1 }); // transom
  for (const x of [-aw / 4, aw / 4]) add(door({ w: 1.5, h: 3.1, color: PALETTE.glassDark, frame: PALETTE.glassGold }), { x, y: y0, z: front + 0.05 });
  add(box(0.12, ah - 3.6, 0.18, mat(PALETTE.glassGold)), { y: y0 + 3.5, z: front + 0.08 });
  add(sign({ text: 'PINK GRANITE', w: 5.2, h: 0.75, bg: GRANITE_DARK, fg: PALETTE.cream, depth: 0.15 }), { y: y0 + ah + 1.0, z: front });
  // blind arches flanking the entrance
  for (const x of [-4.4, -6.6, 4.4, 6.6]) {
    add(archSlab({ w: 1.3, h: 3.6, t: 0.3, depth: 0.25, material: stoneLight }), { x, y: y0 + 0.5, z: front });
    add(archSlab({ w: 1.3, h: 3.6, depth: 0.08, material: glass(PALETTE.glassDark) }), { x, y: y0 + 0.5, z: front });
  }

  // --- shaft: notched-corner tower in pink granite
  const shW = 14, shD = 7, shFloors = 11;
  const shY = y0 + baseH + 0.6;
  add(prismBlock({ points: notched(shW, shD, 1.2), floors: shFloors, bay: 1.5, ...punched }), { y: shY, z: cz });
  // central bronze-glass bay running up the front and back
  for (const s of [1, -1]) {
    add(facadeBlock({ w: 3.2, d: 0.5, floors: shFloors, bay: 1.5, style: 'grid', wall: GRANITE_LIGHT, glass: PALETTE.glassBronze, frame: GRANITE_LIGHT, lit: 0, seed: 7, roof: GRANITE_LIGHT }), { y: shY, z: cz + s * (shD / 2 + 0.2) });
  }
  // string courses every 6 floors
  for (let f = 4; f < shFloors; f += 4) {
    add(prismBlock({ points: notched(shW + 0.3, shD + 0.3, 1.2), h: 0.35, floorHeight: 0.35, style: 'plain', wall: GRANITE_LIGHT, roof: GRANITE_LIGHT }), { y: shY + f * FLOOR - 0.15, z: cz });
  }
  const shTop = shY + shFloors * FLOOR;
  add(prismBlock({ points: notched(shW + 0.7, shD + 0.7, 1.4), h: 0.7, floorHeight: 0.7, style: 'plain', wall: GRANITE_LIGHT, roof: GRANITE_DARK }), { y: shTop, z: cz });

  // --- crown tier 1: cross-gabled setback
  const t1Y = shTop + 0.7;
  const t1W = 10, t1D = 5.4, t1Floors = 4;
  add(prismBlock({ points: notched(t1W, t1D, 0.8), floors: t1Floors, bay: 1.5, ...punched, seed: 33 }), { y: t1Y, z: cz });
  const t1Top = t1Y + t1Floors * FLOOR;
  add(box(t1W + 0.5, 0.4, t1D + 0.5, stoneLight), { y: t1Top, z: cz });
  // big front-facing pediment over the whole setback
  add(gableRoof({ w: t1W, d: t1D, h: 4.2, overhang: 0.35, ridge: 'z', material: roofM, gableMaterial: stoneLight }), { y: t1Top + 0.4, z: cz });
  for (const s of [1, -1]) {
    add(archSlab({ w: 1.4, h: 2.2, t: 0.25, depth: 0.12, material: stoneLight }), { y: t1Top + 0.6, z: cz + s * t1D / 2, ry: s > 0 ? 0 : 180 });
    add(archSlab({ w: 1.4, h: 2.2, depth: 0.06, material: glass(PALETTE.glassDark) }), { y: t1Top + 0.6, z: cz + s * t1D / 2, ry: s > 0 ? 0 : 180 });
  }
  // lower tier of gables on the shaft-top terrace wings
  for (const x of [-6, 6]) {
    add(box(2, 1.2, shD - 2.4, stone), { x, y: t1Y, z: cz });
    add(gableRoof({ w: 2, d: shD - 2.4, h: 2, overhang: 0.2, ridge: 'z', material: roofM, gableMaterial: stoneLight }), { x, y: t1Y + 1.2, z: cz });
  }

  // --- crown tier 2: lantern with arched windows and a steep gable + finial
  const t2Y = t1Top + 0.4 + 2.6;
  const t2W = 4.2, t2D = 3.4, t2H = 4.5;
  add(box(t2W, t2H, t2D, stone), { y: t2Y, z: cz });
  for (const s of [1, -1]) {
    for (const x of [-1, 0, 1]) {
      const arch = archSlab({ w: 0.8, h: 2.8, depth: 0.08, material: emissive(PALETTE.windowLit, 0.35) });
      add(arch, { x, y: t2Y + 0.9, z: cz + s * (t2D / 2), ry: s > 0 ? 0 : 180 });
    }
  }
  for (const s of [1, -1]) add(archSlab({ w: 0.8, h: 2.8, depth: 0.08, material: emissive(PALETTE.windowLit, 0.35) }), { x: s * t2W / 2, y: t2Y + 0.9, z: cz, ry: s * 90 });
  add(box(t2W + 0.4, 0.35, t2D + 0.4, stoneLight), { y: t2Y + t2H, z: cz });
  add(gableRoof({ w: t2W, d: t2D, h: 3.4, overhang: 0.25, ridge: 'z', material: roofM, gableMaterial: stoneLight }), { y: t2Y + t2H + 0.35, z: cz });
  add(spire({ radius: 0.35, h: 3.2, baseHeight: 0.5, material: mat(PALETTE.glassGold, { metalness: 0.5, roughness: 0.4 }) }), { y: t2Y + t2H + 0.35 + 3.2, z: cz });

  // --- forecourt & grounds
  add(patch(6.5, 5 - front, 'cobbles'), { y: y0, z: (5 + front) / 2 });
  for (const x of [-3.1, 3.1]) add(flag({ h: 7, color: x < 0 ? PALETTE.navy : PALETTE.red, color2: PALETTE.white }), { x, y: y0, z: 4.5, ry: x < 0 ? 180 : 0 });
  for (const x of [-5.6, 5.6]) {
    add(box(1.6, 0.5, 1.0, stoneDark), { x, y: y0, z: 4.2 });
    add(tree({ kind: 'bush', h: 1.1, seed: 40 + x }), { x, y: y0 + 0.5, z: 4.2 });
  }
  for (const x of [-7.6, 7.6]) add(streetLamp({ h: 4.5 }), { x, y: y0, z: 4.4, ry: x < 0 ? 0 : 180 });

  // west garden: trees in granite planters + benches
  for (const [z, seed] of [[2.2, 51], [-2.6, 52]]) {
    add(cylinder(1.0, 1.0, 0.55, stoneDark, 12), { x: -8.6, y: y0, z });
    add(tree({ kind: 'round', h: 5.5, seed }), { x: -8.6, y: y0 + 0.55, z });
  }
  add(bench({ w: 1.6 }), { x: -7.7, y: y0, z: -0.2, ry: 90 });
  add(patch(3, 10, 'grass'), { x: -8.5, y: y0 });

  // east side: taxi drop-off lane, bollards, a tree at the back
  add(patch(3, 10, 'asphalt'), { x: 8.5, y: y0 });
  add(car({ kind: 'taxi' }), { x: 8.5, y: y0 + 0.05, z: 1.4, ry: 90, s: 0.85 });
  for (const z of [-1.5, 0, 1.5, 3]) add(cylinder(0.12, 0.12, 0.8, stoneDark, 6), { x: 7.25, y: y0, z });
  add(tree({ kind: 'cone', h: 5, seed: 60 }), { x: 8.8, y: y0, z: -3.6 });
  return g;
}

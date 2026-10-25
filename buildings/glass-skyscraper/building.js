import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, prismBlock, facadeBlock, taperedBlock, box, place, parapet,
  rooftopUnits, antenna, sign, tree, glass, mat, emissive, columns, streetLamp, bench,
} from '../../src/lib/index.js';

// Octagon-ish footprint: a square of side s with corners cut by c.
function chamfered(s, c) {
  const h = s / 2;
  return [[-h + c, h], [h - c, h], [h, h - c], [h, -h + c], [h - c, -h], [-h + c, -h], [-h, -h + c], [-h, h - c]];
}

// 2x2 tiles (20 x 20 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'paved'));

  const curtain = { style: 'curtain', glass: PALETTE.glassBlue, frame: PALETTE.steelLight, lit: 0.08, bay: 2.5, seed: 21, roof: PALETTE.concreteDark };

  // stone podium, 2 tall storeys with a ribbon of shop glass
  const podH = 2 * 4;
  g.add(place(facadeBlock({ w: 17, d: 15, floors: 2, floorHeight: 4, style: 'grid', wall: PALETTE.stone, glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 3.4, lit: 0.3, seed: 5, roof: PALETTE.concrete }), { y: y0, z: -1.5 }));
  g.add(place(parapet({ w: 17, d: 15, h: 0.6, material: mat(PALETTE.stoneDark) }), { y: y0 + podH, z: -1.5 }));

  // entrance canopy on columns + sign
  g.add(place(box(8, 0.35, 3.2, mat(PALETTE.steelLight, { metalness: 0.5, roughness: 0.35 })), { y: y0 + 4.2, z: 7.6 }));
  g.add(place(columns({ count: 4, length: 7, radius: 0.18, h: 4.2, material: mat(PALETTE.steelLight) }), { y: y0, z: 8.9 }));
  g.add(place(sign({ text: 'TINY TOWER', w: 6, h: 0.9, bg: PALETTE.navy, fg: '#ffffff' }), { y: y0 + 5.2, z: 6.05 }));

  // main shaft: 24 floors, chamfered
  const shaftFloors = 24;
  const shaftY = y0 + podH;
  g.add(place(prismBlock({ points: chamfered(14, 2.2), floors: shaftFloors, ...curtain }), { y: shaftY, z: -2 }));
  // spandrel bands every 6 floors
  for (let f = 6; f < shaftFloors; f += 6) {
    g.add(place(prismBlock({ points: chamfered(14.3, 2.3), h: 0.4, floorHeight: 0.4, style: 'plain', wall: PALETTE.steelLight, roof: PALETTE.steelLight }), { y: shaftY + f * FLOOR - 0.2, z: -2 }));
  }

  // setback upper section: 6 floors
  const upY = shaftY + shaftFloors * FLOOR;
  g.add(place(prismBlock({ points: chamfered(14.3, 2.3), h: 0.5, floorHeight: 0.5, style: 'plain', wall: PALETTE.steelLight, roof: PALETTE.concrete }), { y: upY, z: -2 }));
  g.add(place(prismBlock({ points: chamfered(10.5, 1.8), floors: 6, ...curtain, glass: PALETTE.glassSky, seed: 22 }), { y: upY + 0.5, z: -2 }));

  // crown: tapered glass lantern, lit band, helipad-free roof with antenna
  const crownY = upY + 0.5 + 6 * FLOOR;
  g.add(place(box(10.8, 0.8, 10.8, emissive('#bfe6ff', 0.5)), { y: crownY, z: -2 }));
  g.add(place(taperedBlock({ w: 10.5, d: 10.5, h: 6, topW: 5, topD: 5, material: glass(PALETTE.glassSky), topMaterial: mat(PALETTE.concreteDark) }), { y: crownY + 0.8, z: -2 }));
  g.add(place(rooftopUnits({ w: 4.4, d: 4.4, count: 3, seed: 9 }), { y: crownY + 6.8, z: -2 }));
  g.add(place(antenna({ h: 14, radius: 0.25 }), { x: 0.8, y: crownY + 6.8, z: -1.2 }));

  // podium roof terrace: planters
  for (const [x, z] of [[-7, -8], [7, -8], [-7, 4.5], [7, 4.5]]) {
    g.add(place(box(1.4, 0.6, 1.4, mat(PALETTE.stoneDark)), { x, y: y0 + podH, z }));
    g.add(place(tree({ kind: 'bush', h: 1.4, seed: x * 3 + z }), { x, y: y0 + podH + 0.6, z }));
  }

  // plaza: planters, trees, benches, lamps
  for (const x of [-8, 8]) {
    g.add(place(box(1.8, 0.5, 1.8, mat(PALETTE.stoneDark)), { x, y: y0, z: 8 }));
    g.add(place(tree({ kind: 'round', h: 5.5, seed: x + 40 }), { x, y: y0 + 0.5, z: 8 }));
    g.add(place(streetLamp({ h: 4.5 }), { x: x * 0.65, y: y0, z: 9.2, ry: x > 0 ? 180 : 0 }));
  }
  g.add(place(bench({ w: 1.6 }), { x: -5.2, y: y0, z: 7.2 }));
  g.add(place(bench({ w: 1.6 }), { x: 5.2, y: y0, z: 7.2 }));
  g.add(place(patch(4, 4, 'cobbles'), { y: y0, z: 8 }));
  return g;
}

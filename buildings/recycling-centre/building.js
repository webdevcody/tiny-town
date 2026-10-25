import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, box, place, mat, metal, surface, fence, stairs,
  tree, car, streetLamp, shade,
} from '../../src/lib/index.js';
import {
  bigSign, recycleLogo, skip, bottleBank, wheelieBin, bale, pallet, forklift, conveyor, hopper, person,
} from './props.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left: green sorting shed fed by a conveyor, baled cardboard in front of it.
// Right: colour-coded skips below a raised tipping deck, bottle banks and bins by the street.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'concrete'));

  // ---------------------------------------------------------------- sorting shed
  const shedGreen = '#4f8f4a';
  const sx = -7.0, sz = -2.3, sw = 5.4, sd = 5.0, sh = 6;
  g.add(place(facadeBlock({ w: sw, d: sd, h: sh, floorHeight: 3, style: 'industrial', wall: shedGreen, glass: PALETTE.glassSky, frame: PALETTE.white, bay: 2.6, lit: 0, seed: 7, blank: ['front'] }), { x: sx, y: y0, z: sz }));
  // corrugated cladding on the street gable
  g.add(place(box(sw, sh, 0.05, surface('corrugated', shedGreen, { size: 1.2 })), { x: sx, y: y0, z: sz + sd / 2 }));
  const roofM = surface('corrugated', PALETTE.steelLight, { size: 1.2, metalness: 0.3 });
  g.add(place(gableRoof({ w: sw, d: sd, h: 1.8, overhang: 0.35, ridge: 'z', material: roofM, gableMaterial: shedGreen }), { x: sx, y: y0 + sh, z: sz }));
  // open roller-shutter bay with the sorting line visible inside
  const doorW = 3.4, doorH = 3.6, fz = sz + sd / 2;
  g.add(place(box(doorW, doorH, 0.1, mat(PALETTE.darkGrey)), { x: sx, y: y0, z: fz + 0.02 }));
  g.add(place(box(doorW + 0.3, 0.45, 0.35, mat(PALETTE.steelDark)), { x: sx, y: y0 + doorH, z: fz + 0.15 })); // shutter box
  for (const s of [-1, 1]) g.add(place(box(0.25, doorH, 0.25, surface('hazard', PALETTE.yellow, { size: 0.8 })), { x: sx + s * (doorW / 2 + 0.12), y: y0, z: fz + 0.1 }));
  g.add(place(box(doorW - 0.4, 0.9, 0.5, mat(PALETTE.green)), { x: sx, y: y0, z: fz - 0.1 })); // picking belt glimpsed inside
  g.add(place(person({ shirt: PALETTE.orange }), { x: sx - 0.8, y: y0, z: fz + 0.5, s: 0.95 }));
  // signage: name board above the door, logo on the gable
  g.add(place(bigSign({ text: 'RECYCLING CENTRE', w: 5.0, h: 0.95, bg: PALETTE.green, fg: '#ffffff', border: '#ffffff' }), { x: sx, y: y0 + 4.35, z: fz + 0.05 }));
  g.add(place(recycleLogo({ size: 1.35 }), { x: sx, y: y0 + sh - 0.55, z: fz + 0.05 }));
  // roof vents
  for (const vz of [-1.5, 0.5]) g.add(place(box(0.7, 0.5, 0.7, metal(PALETTE.steel)), { x: sx + 1.3, y: y0 + sh + 0.85, z: sz + vz }));

  // ---------------------------------------------------------------- conveyor + feed hopper
  const cz = -1.4;
  g.add(place(box(1.4, 1.3, 1.4, mat(PALETTE.darkGrey)), { x: sx + sw / 2 + 0.01, y: y0 + 3.8, z: cz })); // wall opening
  g.add(conveyor({ from: [-1.1, y0 + 1.9, cz], to: [sx + sw / 2 - 0.2, y0 + 4.6, cz], groundY: y0, width: 1.0 }));
  g.add(place(hopper({ color: PALETTE.green }), { x: -0.8, y: y0, z: cz }));

  // ---------------------------------------------------------------- tipping deck + skips
  const deckH = 1.5, deckX0 = -2.0, deckX1 = TILE - 0.1, deckZ0 = -TILE / 2 + 0.1, deckZ1 = -3.4;
  const deckW = deckX1 - deckX0, deckD = deckZ1 - deckZ0, deckCx = (deckX0 + deckX1) / 2, deckCz = (deckZ0 + deckZ1) / 2;
  g.add(place(box(deckW, deckH, deckD, mat(PALETTE.concreteDark)), { x: deckCx, y: y0, z: deckCz }));
  g.add(place(box(deckW, 0.06, deckD, surface('concrete', PALETTE.concrete, { size: 3 })), { x: deckCx, y: y0 + deckH, z: deckCz }));
  g.add(place(box(deckW, 0.12, 0.2, surface('hazard', PALETTE.yellow, { size: 0.8 })), { x: deckCx, y: y0 + deckH, z: deckZ1 - 0.1 }));
  g.add(place(fence({ w: deckW - 0.2, d: deckD, h: 1.0, style: 'railing', color: PALETTE.yellow, sides: ['front', 'back', 'right'] }), { x: deckCx + 0.1, y: y0 + deckH + 0.06, z: deckCz }));
  g.add(place(bigSign({ text: 'REDUCE · REUSE · RECYCLE', w: 8.0, h: 0.9, bg: PALETTE.green, border: '#ffffff' }), { x: deckCx + 0.6, y: y0 + 0.3, z: deckZ0 - 0.02, ry: 180 }));
  g.add(place(stairs({ w: 1.2, h: deckH, d: 2.0, steps: 6, material: mat(PALETTE.concrete) }), { x: deckX0 - 1.0, y: y0, z: deckCz, ry: -90 }));

  const skips = [
    { label: 'PAPER', color: PALETTE.blue, contents: { base: '#d9d4c4', colors: [PALETTE.white, '#c9b48a', PALETTE.plasterBlue, PALETTE.cream], count: 9 } },
    { label: 'GARDEN', color: PALETTE.green, contents: { base: PALETTE.foliage, colors: [PALETTE.foliageLight, PALETTE.foliageDark, PALETTE.wood, PALETTE.grassLight], count: 10 } },
    { label: 'PLASTIC', color: PALETTE.yellow, contents: { base: '#e6e2d8', colors: [PALETTE.blue, PALETTE.red, PALETTE.white, PALETTE.orange, PALETTE.glassTeal], count: 11 } },
    { label: 'METAL', color: PALETTE.red, contents: { base: PALETTE.steelDark, colors: [PALETTE.steel, PALETTE.rust, PALETTE.steelLight, PALETTE.darkGrey], count: 10 } },
  ];
  const pitch = 2.35, skipX0 = 1.6;
  skips.forEach((s, i) => {
    const x = skipX0 + i * pitch;
    g.add(place(skip({ color: s.color, contents: s.contents, w: 1.95, d: 2.3, h: 1.45, seed: 30 + i }), { x, y: y0, z: -2.0 }));
    g.add(place(bigSign({ text: s.label, w: 1.7, h: 0.55, bg: s.color, fg: s.color === PALETTE.yellow ? PALETTE.black : '#ffffff' }), { x, y: y0 + deckH + 1.1, z: deckZ1 - 0.02 }));
  });
  // people tipping from the deck
  g.add(place(person({ shirt: PALETTE.red, trousers: PALETTE.darkGrey }), { x: 4.0, y: y0 + deckH + 0.06, z: deckZ1 - 0.7, ry: 180 }));
  g.add(place(person({ shirt: PALETTE.plasterYellow, trousers: PALETTE.navy }), { x: 8.2, y: y0 + deckH + 0.06, z: deckZ1 - 0.75, ry: 180 }));

  // ---------------------------------------------------------------- drive lane + car
  g.add(place(patch(13.4, 2.4, 'asphalt'), { x: 3.3, y: y0, z: 0.6 }));
  for (let x = -2.6; x < 9.6; x += 1.6) g.add(place(box(0.8, 0.02, 0.12, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: 0.6 }));
  g.add(place(car({ color: PALETTE.plasterBlue, kind: 'van' }), { x: 5.2, y: y0 + 0.05, z: 0.6, s: 0.8 }));
  g.add(place(person({ shirt: PALETTE.purple }), { x: 3.1, y: y0, z: -0.4 }));
  g.add(place(box(0.6, 0.45, 0.45, mat('#b08a58')), { x: 3.1, y: y0 + 0.9, z: -0.15 }));

  // ---------------------------------------------------------------- bottle banks + bins by the street
  const banks = [[PALETTE.green, 0.4], ['#7a4a2a', 2.3], [PALETTE.white, 4.2]];
  for (const [c, x] of banks) g.add(place(bottleBank({ color: c, label: c === PALETTE.white ? PALETTE.green : PALETTE.white, r: 0.8 }), { x, y: y0, z: 3.0 }));
  g.add(place(patch(6.2, 2.4, 'paved'), { x: 2.3, y: y0, z: 3.05 }));
  const bins = [PALETTE.blue, PALETTE.green, PALETTE.yellow, PALETTE.red, PALETTE.darkGrey, PALETTE.blue];
  bins.forEach((c, i) => g.add(place(wheelieBin({ color: c }), { x: 5.9 + i * 0.72, y: y0, z: 3.0, ry: 180 })));
  g.add(place(bigSign({ text: 'GLASS ONLY', w: 1.8, h: 0.45, bg: PALETTE.green }), { x: 2.3, y: y0 + 1.6, z: 4.15 }));
  for (const px of [1.6, 3.0]) g.add(place(box(0.08, 1.6, 0.08, metal(PALETTE.steelDark)), { x: px, y: y0, z: 4.15 }));

  // entrance sign + lamps
  g.add(place(box(0.18, 2.3, 0.18, metal(PALETTE.steelDark)), { x: 8.9, y: y0, z: 4.4 }));
  g.add(place(box(0.18, 2.3, 0.18, metal(PALETTE.steelDark)), { x: 9.7, y: y0, z: 4.4 }));
  g.add(place(recycleLogo({ size: 1.2 }), { x: 9.3, y: y0 + 2.2, z: 4.5 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -2.2, y: y0, z: 4.4 }));

  // ---------------------------------------------------------------- bale yard + forklift
  g.add(place(patch(6.6, 3.6, 'concrete'), { x: -6.6, y: y0, z: 2.6 }));
  const baleKinds = [['cardboard', 'cardboard', 'paper'], ['cardboard', 'cans', 'cardboard'], ['plastic', 'cardboard', 'paper']];
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const bx = -9.1 + col * 1.35, bz = 1.4 + row * 1.0;
      const stack = row === 0 ? 3 : 2;
      g.add(place(pallet(), { x: bx, y: y0, z: bz }));
      for (let k = 0; k < stack; k++) g.add(place(bale({ kind: baleKinds[col][(k + row) % 3] }), { x: bx, y: y0 + 0.14 + k * 0.86, z: bz }));
    }
  }
  g.add(place(pallet(), { x: -8.4, y: y0, z: 3.8 }));
  g.add(place(bale({ kind: 'cardboard' }), { x: -8.4, y: y0 + 0.14, z: 3.8 }));
  g.add(place(forklift({ color: PALETTE.orange }), { x: -5.3, y: y0, z: 3.2, ry: 90 }));
  g.add(place(pallet(), { x: -5.3, y: y0 + 0.46, z: 1.75 }));
  g.add(place(bale({ kind: 'cardboard' }), { x: -5.3, y: y0 + 0.6, z: 1.75 }));

  // ---------------------------------------------------------------- planting + boundary
  g.add(place(fence({ w: TILE * 2 - 0.4, d: TILE - 0.4, h: 1.2, style: 'wire', color: PALETTE.green, sides: ['left'] }), { y: y0 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 5 }), { x: -3.4, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 8 }), { x: 5.6, y: y0, z: 4.5 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: -1.2, y: y0, z: 4.5 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, lot, patch, box, place, gableRoof, fence, mat, metal, surface, glass, streetLamp,
} from '../../src/lib/index.js';
import {
  GREEN, GREEN_DARK, bigSign, leafLogo, pottedPlant, plantBench, tieredStand, compostPallet, plantTrolley,
  gardenShed, glassHall, potDisplay,
} from './props.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left: glass-roofed plant hall behind a green timber entrance pavilion.
// Right: outdoor plant yard with potted shrubs, display sheds and compost pallets.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  // --- glass plant hall ---------------------------------------------------
  const hx = -3.9, hz = -2.0, hw = 11.6, hd = 5.6, wallH = 3.2;
  g.add(place(glassHall({ w: hw, d: hd, wallH, roofH: 2.0, bay: 1.45 }), { x: hx, y: y0, z: hz }));

  // benches of bedding plants inside, either side of a central aisle
  const fy = y0 + 0.7;
  let seed = 1;
  for (const z of [hz - 1.9, hz, hz + 1.9]) {
    for (const x of [hx - 3.05, hx + 3.05]) {
      g.add(place(plantBench({ w: 4.4, d: 1.0, h: 0.75, seed: seed++ }), { x, y: fy, z }));
    }
  }
  g.add(place(pottedPlant({ kind: 'palm', h: 2.4, seed: 4, pot: PALETTE.terracotta }), { x: hx, y: fy, z: hz - 2.2 }));
  g.add(place(pottedPlant({ kind: 'tree', h: 2.0, seed: 6 }), { x: hx, y: fy, z: hz - 0.9 }));

  // --- entrance pavilion (green timber, gable to the street) ---------------
  const ex = hx, ez = 1.55, ew = 4.8, ed = 2.4, eh = 4.0;
  const planks = surface('planks', GREEN, { size: 1.2 });
  g.add(place(box(ew, eh, ed, [planks, planks, mat(PALETTE.paving), planks, planks, planks]), { x: ex, y: y0, z: ez }));
  g.add(place(gableRoof({ w: ew, d: ed + 0.3, h: 1.5, overhang: 0.3, ridge: 'z', material: surface('shingles', PALETTE.roofSlate, { size: 2 }), gableMaterial: planks }), { x: ex, y: y0 + eh, z: ez - 0.15 }));
  // white corner boards + fascia
  for (const sx of [-1, 1]) g.add(place(box(0.14, eh, 0.14, mat(PALETTE.white)), { x: ex + sx * ew / 2, y: y0, z: ez + ed / 2 }));
  g.add(place(box(ew + 0.1, 0.14, 0.14, mat(PALETTE.white)), { x: ex, y: y0 + eh - 0.14, z: ez + ed / 2 }));
  // sliding glass doors with a canopy
  const fz = ez + ed / 2;
  g.add(place(box(2.8, 2.4, 0.08, metal(PALETTE.steelLight)), { x: ex, y: y0, z: fz }));
  g.add(place(box(1.25, 2.25, 0.1, glass(PALETTE.glassDark)), { x: ex - 0.65, y: y0, z: fz }));
  g.add(place(box(1.25, 2.25, 0.1, glass(PALETTE.glassDark)), { x: ex + 0.65, y: y0, z: fz }));
  g.add(place(box(3.4, 0.14, 1.1, mat(PALETTE.white)), { x: ex, y: y0 + 2.5, z: fz + 0.55 }));
  // shop windows either side
  for (const sx of [-1, 1]) {
    g.add(place(box(0.7, 1.7, 0.08, mat(PALETTE.white)), { x: ex + sx * 1.95, y: y0 + 0.6, z: fz }));
    g.add(place(box(0.55, 1.55, 0.1, glass(PALETTE.glassDark)), { x: ex + sx * 1.95, y: y0 + 0.68, z: fz }));
  }
  // big sign + leaf logo in the gable
  g.add(place(bigSign({ text: 'GARDEN CENTRE', w: 4.5, h: 1.0, bg: '#f4efe0', fg: GREEN_DARK, border: GREEN_DARK }), { x: ex, y: y0 + 2.8, z: fz + 0.05 }));
  g.add(place(leafLogo({ r: 0.42 }), { x: ex, y: y0 + eh + 0.08, z: fz + 0.12 }));
  // clipped bay trees either side of the door
  for (const sx of [-1, 1]) {
    g.add(place(pottedPlant({ kind: 'tree', h: 1.6, seed: 60 + sx, pot: PALETTE.darkGrey, color: PALETTE.foliageDark }), { x: ex + sx * 1.95, y: y0, z: fz + 0.45 }));
  }

  // --- forecourt -----------------------------------------------------------
  g.add(place(patch(3.4, 2.25, 'concrete'), { x: ex, y: y0, z: 3.88 }));
  // bench displays and potted trees flanking the pavilion
  g.add(place(plantBench({ w: 3.0, d: 1.0, h: 0.75, seed: 21 }), { x: -8.1, y: y0, z: 1.75 }));
  for (const [i, x] of [-0.8, 0.4, 1.5].entries()) {
    g.add(place(pottedPlant({ kind: i === 1 ? 'conifer' : 'tree', h: i === 1 ? 1.8 : 2.2, seed: 50 + i }), { x, y: y0, z: 1.6 }));
  }
  // trolley bay: shelter with a row of nested plant trolleys
  const tbx = -8.2, tbz = 3.85;
  g.add(place(box(3.2, 0.1, 1.6, metal(GREEN)), { x: tbx, y: y0 + 1.8, z: tbz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.08, 1.8, 0.08, metal(PALETTE.steelLight)), { x: tbx + sx * 1.5, y: y0, z: tbz + sz * 0.7 }));
  for (let i = 0; i < 4; i++) g.add(place(plantTrolley({ seed: i, load: false }), { x: tbx - 1.05 + i * 0.7, y: y0, z: tbz, ry: -90 }));
  // tiered flower stand by the door
  g.add(place(tieredStand({ w: 2.6, steps: 3, seed: 7 }), { x: 0.3, y: y0, z: 3.85 }));
  // loaded trolley left by a customer
  g.add(place(plantTrolley({ seed: 9 }), { x: -1.6, y: y0, z: 4.3, ry: 20 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 2.0, y: y0, z: 4.7, ry: 180 }));

  // --- outdoor plant yard --------------------------------------------------
  g.add(place(patch(7.6, 4.6, 'gravel'), { x: 6.0, y: y0, z: -0.2 }));
  // display sheds along the back
  g.add(place(gardenShed({ w: 2.2, d: 1.8, wall: PALETTE.woodLight, roof: PALETTE.roofBlack }), { x: 3.5, y: y0, z: -3.75 }));
  g.add(place(gardenShed({ w: 2.2, d: 1.8, wall: '#7f9c76', roof: PALETTE.roofSlate }), { x: 6.1, y: y0, z: -3.75 }));
  g.add(place(gardenShed({ w: 2.0, d: 1.8, h: 2.1, wall: '#6c87a0', roof: PALETTE.roofRed }), { x: 8.6, y: y0, z: -3.75 }));
  // rows of potted shrubs, conifers and young trees
  const rows = [
    { z: -1.7, kind: 'conifer', h: 1.6, step: 0.85 },
    { z: -0.4, kind: 'shrub', h: 1.0, step: 0.75 },
    { z: 0.9, kind: 'tree', h: 2.0, step: 0.95 },
  ];
  for (const [ri, row] of rows.entries()) {
    const n = Math.floor(7.0 / row.step);
    for (let i = 0; i < n; i++) {
      const s = 100 + ri * 30 + i;
      const h = row.h * (0.85 + ((i * 37) % 10) / 33);
      g.add(place(pottedPlant({ kind: row.kind, h, seed: s, pot: ri === 1 ? PALETTE.black : PALETTE.terracotta }), { x: 2.8 + row.step * (i + 0.5), y: y0 + 0.05, z: row.z }));
    }
  }
  // compost and bark pallets + another trolley at the front of the yard
  g.add(place(compostPallet({ layers: 4, seed: 1 }), { x: 7.6, y: y0, z: 3.3 }));
  g.add(place(compostPallet({ layers: 3, seed: 2, colors: ['#6b4326', '#8a5a2e'] }), { x: 9.0, y: y0, z: 3.3, ry: 90 }));
  g.add(place(compostPallet({ layers: 5, seed: 3, colors: ['#2f5d8a', '#3d5a2a'] }), { x: 9.0, y: y0, z: 4.45 }));
  g.add(place(plantTrolley({ seed: 12 }), { x: 4.6, y: y0, z: 3.4, ry: -15 }));
  g.add(place(tieredStand({ w: 2.0, steps: 2, seed: 11 }), { x: 3.3, y: y0, z: 4.25 }));
  // green railing round the yard and a tree in the corner
  g.add(place(fence({ w: 7.8, d: 9.6, h: 1.0, style: 'railing', color: GREEN, sides: ['right'] }), { x: 5.95, y: y0, z: -0.1 }));
  g.add(place(potDisplay(), { x: 6.2, y: y0, z: 3.6 }));
  g.add(place(bigSign({ text: 'COMPOST', w: 1.5, h: 0.45, bg: GREEN, fg: '#ffffff' }), { x: 8.3, y: y0 + 1.25, z: 4.95 }));
  for (const sx of [-1, 1]) g.add(place(box(0.06, 1.7, 0.06, metal(PALETTE.steelDark)), { x: 8.3 + sx * 0.65, y: y0, z: 4.9 }));
  return g;
}

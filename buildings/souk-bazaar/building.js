import * as THREE from 'three';
import {
  LOT_HEIGHT, lot, patch, box, place, group, mat, metal, surface, dome, tree, cylinder, cone, sphere,
} from '../../src/lib/index.js';
import {
  ashlar, rugMaterial, latticeMaterial, tileMaterial, plaque, panel,
  arcadeWall, archFrame, archPanel, archApex, merlons,
  lantern, lanternPost, datePalm, spiceSack, spiceBasket, rolledRug, jar, crate, camel,
} from './souk-parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
//
// Layout (z): back alley -5..-3.9 | domed bazaar hall -3.9..-0.3 | arcaded stall gallery -0.3..2.2 | market plaza 2.2..5
// Layout (x): side strips ±8.5..±10 | arcade wings ±2..±8.5 | central iwan gate -2..2
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();

  const stone = ashlar('#d9b57f');
  const stoneLight = mat('#ead2a2');
  const stoneTrim = mat('#c39a62');
  const plaster = mat('#efdfbc');
  const tiles = tileMaterial();
  const dark = mat('#3a2617');
  const shadow = mat('#5b4026');
  const wood = mat('#7a4e2a');

  g.add(lot([2, 1], surface('paving', '#d8c198', { size: 2.5 })));

  // --- main hall -----------------------------------------------------------------
  const HW = 17, HZ0 = -3.9, HZ1 = -0.3, HH = 6.0;
  const hallD = HZ1 - HZ0, hallZ = (HZ0 + HZ1) / 2;
  g.add(place(box(HW, HH, hallD, stone), { y: y0, z: hallZ }));
  // cornice + parapet with stepped merlons
  g.add(place(box(HW + 0.2, 0.18, hallD + 0.2, stoneTrim), { y: y0 + HH - 0.05, z: hallZ }));
  for (const zz of [HZ0 + 0.1, HZ1 - 0.1]) {
    g.add(place(merlons({ len: HW, material: stoneLight }), { y: y0 + HH + 0.13, z: zz }));
  }
  for (const xx of [-HW / 2 + 0.1, HW / 2 - 0.1]) {
    g.add(place(merlons({ len: hallD, material: stoneLight }), { x: xx, y: y0 + HH + 0.13, z: hallZ, ry: 90 }));
  }

  // upper-storey mashrabiya windows above the gallery roof (front) and on the back wall
  const bays = [3.08, 5.25, 7.42];
  const lattice = latticeMaterial();
  for (const s of [-1, 1]) for (const bx of bays) {
    g.add(place(archPanel({ hw: 0.42, spring: 0.75, d: 0.12, material: stoneTrim }), { x: s * bx, y: y0 + 4.55, z: HZ1 }));
    g.add(place(archPanel({ hw: 0.32, spring: 0.7, d: 0.2, material: lattice }), { x: s * bx, y: y0 + 4.6, z: HZ1 }));
    g.add(place(box(0.9, 0.08, 0.3, stoneTrim), { x: s * bx, y: y0 + 4.5, z: HZ1 + 0.1 }));
  }
  for (const bx of [-7, -4.6, -2.2, 2.2, 4.6, 7]) {
    g.add(place(archPanel({ hw: 0.35, spring: 0.8, d: 0.12, material: lattice }), { x: bx, y: y0 + 3.6, z: HZ0, ry: 180 }));
    g.add(place(archPanel({ hw: 0.32, spring: 0.6, d: 0.12, material: dark }), { x: bx, y: y0 + 1.1, z: HZ0, ry: 180 }));
  }
  g.add(place(archPanel({ hw: 0.6, spring: 1.6, d: 0.14, material: wood }), { x: 0, y: y0, z: HZ0, ry: 180 }));
  // back door canopy on brackets + rugs airing on the back wall
  g.add(place(box(2.0, 0.1, 0.9, wood), { y: y0 + 2.75, z: HZ0 - 0.45, rx: -8 }));
  for (const s of [-1, 1]) g.add(place(box(0.08, 0.6, 0.5, dark), { x: s * 0.9, y: y0 + 2.2, z: HZ0 - 0.25 }));
  for (const [x, m] of [[-3.4, 3], [3.4, 1], [5.8, 0]]) {
    g.add(place(panel(0.95, 1.5, rugMaterial(m)), { x, y: y0 + 0.75, z: HZ0 - 0.04, ry: 180 }));
    g.add(place(box(1.15, 0.06, 0.08, wood), { x, y: y0 + 2.25, z: HZ0 - 0.06 }));
  }
  // side walls of the hall: one window each
  for (const s of [-1, 1]) {
    g.add(place(archPanel({ hw: 0.35, spring: 0.8, d: 0.12, material: lattice }), { x: s * HW / 2, y: y0 + 4.4, z: hallZ, ry: s * 90 }));
  }

  // --- roofscape: central ribbed dome, two side domes, wind tower --------------------
  // square base + octagonal drum + turquoise dome over the centre
  g.add(place(box(3.6, 0.9, 3.4, stone), { y: y0 + HH, z: hallZ }));
  g.add(place(merlons({ len: 3.6, size: 0.3, gap: 0.18, material: stoneLight }), { y: y0 + HH + 0.9, z: hallZ + 1.6 }));
  g.add(place(cylinder(1.45, 1.45, 0.9, stoneLight, 8), { y: y0 + HH + 0.9, z: hallZ }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.add(place(archPanel({ hw: 0.18, spring: 0.3, d: 0.08, material: dark }), { x: Math.sin(a) * 1.36, y: y0 + HH + 1.05, z: hallZ + Math.cos(a) * 1.36, ry: (a * 180) / Math.PI }));
  }
  const domeY = y0 + HH + 1.8;
  g.add(place(dome({ radius: 1.5, height: 1.7, segments: 16, material: mat('#2a9d9a', { roughness: 0.45, metalness: 0.15, flatShading: true }) }), { y: domeY, z: hallZ }));
  g.add(place(cylinder(0.12, 0.12, 0.3, metal('#d8b24a'), 6), { y: domeY + 1.65, z: hallZ }));
  g.add(place(sphere(0.16, metal('#d8b24a'), 8), { y: domeY + 1.9, z: hallZ }));
  g.add(place(cone(0.07, 0.45, metal('#d8b24a'), 6), { y: domeY + 2.15, z: hallZ }));

  for (const s of [-1, 1]) {
    g.add(place(dome({ radius: 1.15, height: 1.05, segments: 14, drum: 0.35, drumMaterial: stoneLight, material: plaster }), { x: s * 4.6, y: y0 + HH, z: hallZ }));
    g.add(place(sphere(0.1, metal('#d8b24a'), 6), { x: s * 4.6, y: y0 + HH + 1.38, z: hallZ }));
  }

  // badgir wind tower (left end) with slotted top
  const wtX = -7.1, wtY = y0 + HH;
  g.add(place(box(1.5, 3.4, 1.5, stone), { x: wtX, y: wtY, z: hallZ }));
  for (const [dx, dz, ry] of [[0, 0.76, 0], [0, -0.76, 180], [0.76, 0, 90], [-0.76, 0, -90]]) {
    for (const o of [-0.38, 0, 0.38]) {
      const off = ry === 0 || ry === 180 ? { x: wtX + dx + o, z: hallZ + dz } : { x: wtX + dx, z: hallZ + dz + o };
      g.add(place(box(0.2, 1.2, 0.04, dark), { ...off, y: wtY + 1.9, ry }));
    }
  }
  g.add(place(box(1.75, 0.18, 1.75, stoneTrim), { x: wtX, y: wtY + 3.4, z: hallZ }));
  for (const [dx, dz, ry] of [[0, 0.75, 0], [0, -0.75, 0], [0.75, 0, 90], [-0.75, 0, 90]]) {
    g.add(place(merlons({ len: 1.6, size: 0.3, gap: 0.14, t: 0.2, material: stoneLight }), { x: wtX + dx, y: wtY + 3.58, z: hallZ + dz, ry }));
  }

  // rugs drying on a line over the right end of the roof
  const rx = 7.0;
  for (const s of [-1, 1]) g.add(place(box(0.08, 1.9, 0.08, wood), { x: rx + s * 1.1, y: y0 + HH, z: hallZ }));
  g.add(place(box(2.3, 0.05, 0.05, wood), { x: rx, y: y0 + HH + 1.88, z: hallZ }));
  g.add(place(panel(0.95, 1.4, rugMaterial(4)), { x: rx - 0.52, y: y0 + HH + 0.48, z: hallZ }));
  g.add(place(panel(0.95, 1.3, rugMaterial(2)), { x: rx + 0.52, y: y0 + HH + 0.58, z: hallZ }));

  // --- arcaded gallery of stalls ---------------------------------------------------------
  const GZ0 = HZ1, GZ1 = 2.2, GH = 4.0;
  const galD = GZ1 - GZ0, galZ = (GZ0 + GZ1) / 2;
  const wingLen = 6.5, wingX = 2 + wingLen / 2;
  const archHw = 0.68, archSpring = 2.1, apex = archApex(archHw, archSpring);
  g.add(place(patch(HW, galD, surface('paving', '#b98b58', { size: 1.2 })), { y: y0, z: galZ }));
  for (const s of [-1, 1]) {
    const arches = [-2.167, 0, 2.167].map((cx) => ({ cx, hw: archHw, spring: archSpring }));
    g.add(place(arcadeWall({ len: wingLen, h: GH, t: 0.4, arches, material: stone }), { x: s * wingX, y: y0, z: GZ1 - 0.2 }));
    // tile frames round each arch + slim columns
    for (const cx of [-2.167, 0, 2.167]) {
      g.add(place(archFrame({ cx: 0, hw: archHw, spring: archSpring, fw: 0.12, material: stoneTrim }), { x: s * wingX + cx, y: y0, z: GZ1 + 0.02 }));
    }
    // end arcade wall with one arch
    g.add(place(arcadeWall({ len: galD, h: GH, t: 0.4, arches: [{ cx: 0, hw: 0.6, spring: archSpring }], material: stone }), { x: s * (HW / 2 - 0.2), y: y0, z: galZ, ry: 90 }));
    // roof slab, cornice, front parapet with merlons
    g.add(place(box(wingLen + 0.1, 0.3, galD + 0.1, stone), { x: s * wingX, y: y0 + GH, z: galZ }));
    g.add(place(box(wingLen + 0.2, 0.14, 0.2, stoneTrim), { x: s * wingX, y: y0 + GH, z: GZ1 + 0.02 }));
    g.add(place(box(wingLen + 0.1, 0.12, 0.08, tiles), { x: s * wingX, y: y0 + GH - 0.45, z: GZ1 + 0.02 }));
    g.add(place(merlons({ len: wingLen, size: 0.32, gap: 0.2, material: stoneLight }), { x: s * wingX, y: y0 + GH + 0.3, z: GZ1 - 0.1 }));
    g.add(place(merlons({ len: galD, size: 0.32, gap: 0.2, material: stoneLight }), { x: s * (HW / 2 - 0.1), y: y0 + GH + 0.3, z: galZ, ry: 90 }));

    // a small dome over every stall bay
    for (const bx of bays) {
      g.add(place(dome({ radius: 0.72, height: 0.66, segments: 12, drum: 0.18, drumMaterial: stoneLight, material: plaster }), { x: s * bx, y: y0 + GH + 0.3, z: galZ }));
      g.add(place(cylinder(0.05, 0.08, 0.18, stoneTrim, 6), { x: s * bx, y: y0 + GH + 1.14, z: galZ }));
    }

    // stall goods inside each bay: rug on the back wall, sacks, lantern under the arch
    bays.forEach((bx, i) => {
      const x = s * bx;
      g.add(place(panel(1.15, 1.75, rugMaterial(i + (s > 0 ? 2 : 0))), { x, y: y0 + 0.7, z: GZ0 + 0.03 }));
      g.add(place(box(1.8, 0.04, 0.5, wood), { x, y: y0 + 2.75, z: GZ0 + 0.25 }));
      for (let k = 0; k < 3; k++) g.add(place(spiceSack(i * 3 + k + (s > 0 ? 1 : 0), 0.85), { x: x - 0.55 + k * 0.55, y: y0, z: GZ0 + 0.8 }));
      g.add(place(lantern({ chain: 0.5 }), { x, y: y0 + GH, z: GZ1 - 0.75 }));
    });
  }

  // --- central iwan gate -----------------------------------------------------------------
  const PH = 7.2, PZ1 = 2.6, pT = 0.7;
  const pHw = 1.25, pSpring = 3.3, pApex = archApex(pHw, pSpring, 1.3);
  g.add(place(arcadeWall({ len: 4.2, h: PH, t: pT, arches: [{ cx: 0, hw: pHw, spring: pSpring }], material: stone, k: 1.3 }), { y: y0, z: PZ1 - pT / 2 }));
  for (const s of [-1, 1]) g.add(place(box(0.4, PH, PZ1 - pT - GZ0, stone), { x: s * 1.9, y: y0, z: (GZ0 + PZ1 - pT) / 2 }));
  // vault ceiling of the passage + roof
  g.add(place(box(3.4, 0.2, PZ1 - GZ0, shadow), { y: y0 + pApex, z: (GZ0 + PZ1) / 2 }));
  g.add(place(box(4.3, 0.25, PZ1 - GZ0 + 0.1, stoneTrim), { y: y0 + PH, z: (GZ0 + PZ1) / 2 }));
  g.add(place(merlons({ len: 4.2, size: 0.34, gap: 0.2, material: stoneLight }), { y: y0 + PH + 0.25, z: PZ1 - 0.12 }));
  for (const s of [-1, 1]) g.add(place(merlons({ len: PZ1 - GZ0, size: 0.34, gap: 0.2, material: stoneLight }), { x: s * 2.0, y: y0 + PH + 0.25, z: (GZ0 + PZ1) / 2, ry: 90 }));
  // turquoise tile surround (arch frame + rectangular alfiz) and the sign
  g.add(place(archFrame({ hw: pHw, spring: pSpring, fw: 0.22, material: tiles, k: 1.3 }), { y: y0, z: PZ1 + 0.03 }));
  for (const s of [-1, 1]) g.add(place(box(0.2, pApex + 0.5, 0.06, tiles), { x: s * 1.85, y: y0, z: PZ1 + 0.03 }));
  g.add(place(box(3.9, 0.2, 0.06, tiles), { y: y0 + pApex + 0.35, z: PZ1 + 0.03 }));
  g.add(place(plaque({ text: 'SOUK', w: 3.2, h: 1.05, bg: '#16606a', fg: '#f4cf63', border: '#f4cf63' }), { y: y0 + pApex + 0.7, z: PZ1 + 0.06 }));
  // carved door at the back of the iwan + lanterns
  g.add(place(archPanel({ hw: 0.95, spring: 2.0, d: 0.12, material: tiles, k: 1.3 }), { y: y0, z: GZ0 + 0.04 }));
  g.add(place(archPanel({ hw: 0.8, spring: 1.9, d: 0.16, material: mat('#6a3d1e'), k: 1.3 }), { y: y0, z: GZ0 + 0.06 }));
  g.add(place(box(0.05, 2.4, 0.18, dark), { y: y0, z: GZ0 + 0.08 }));
  g.add(place(lantern({ chain: 0.7, s: 1.3 }), { y: y0 + pApex, z: 1.2 }));
  g.add(place(patch(2.5, PZ1 - GZ0, surface('paving', '#a87a4a', { size: 1 })), { y: y0 + 0.01, z: (GZ0 + PZ1) / 2 }));
  // steps / threshold
  g.add(place(box(3.0, 0.12, 0.5, stoneTrim), { y: y0, z: PZ1 + 0.25 }));

  // --- market plaza --------------------------------------------------------------------------
  // cobbled path to the gate
  g.add(place(patch(3.0, 5 - PZ1 - 0.5, 'cobbles'), { y: y0, z: (PZ1 + 0.5 + 5) / 2 }));
  for (const s of [-1, 1]) g.add(place(lanternPost({ h: 2.9 }), { x: s * 2.3, y: y0, z: 3.4, ry: s > 0 ? 180 : 0 }));

  // spice stall (left): trestle table of baskets + sacks on the ground + sun cloth
  const spX = -5.4, spZ = 3.55;
  g.add(place(box(3.4, 0.08, 1.0, wood), { x: spX, y: y0 + 0.7, z: spZ }));
  for (const dx of [-1.55, 1.55]) for (const dz of [-0.4, 0.4]) g.add(place(box(0.08, 0.7, 0.08, wood), { x: spX + dx, y: y0, z: spZ + dz }));
  for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) {
    g.add(place(spiceBasket(i * 2 + j), { x: spX - 1.32 + i * 0.66, y: y0 + 0.78, z: spZ - 0.22 + j * 0.44 }));
  }
  for (let i = 0; i < 6; i++) g.add(place(spiceSack(i + 3), { x: spX - 1.6 + i * 0.64, y: y0, z: 4.55 }));
  // tilted canvas shade on poles behind the table
  for (const dx of [-1.8, 1.8]) g.add(place(box(0.08, 2.7, 0.08, wood), { x: spX + dx, y: y0, z: 2.65 }));
  g.add(place(box(3.8, 0.05, 1.3, surface('stripes', '#c0392b', { color2: '#f3e3c3', size: 1.0 })), { x: spX, y: y0 + 2.55, z: 3.15, rx: 14 }));
  g.add(place(lantern({ chain: 0.3 }), { x: spX, y: y0 + 2.5, z: 3.0 }));

  // rug merchant (right): wooden rail rack with hanging rugs, rolled rugs, the camel
  const rgX = 5.0, rgZ = 3.3;
  for (const dx of [-1.85, 1.85]) g.add(place(box(0.1, 2.3, 0.1, wood), { x: rgX + dx, y: y0, z: rgZ }));
  g.add(place(box(3.9, 0.08, 0.08, wood), { x: rgX, y: y0 + 2.25, z: rgZ }));
  [0, 1, 3].forEach((m, i) => g.add(place(panel(1.15, 1.95, rugMaterial(m)), { x: rgX - 1.22 + i * 1.22, y: y0 + 0.28, z: rgZ })));
  for (const [i, y, z] of [[1, 0, 4.0], [2, 0, 4.33], [3, 0.29, 4.165]]) g.add(place(rolledRug(i, 1.5), { x: rgX - 0.6, y: y0 + y, z }));
  g.add(place(rolledRug(4, 1.5), { x: rgX + 0.9, y: y0, z: 4.3 }));
  g.add(place(camel(), { x: 8.4, y: y0, z: 4.0, ry: 200 }));

  // pots, jars and crates
  for (const [x, z, s, c] of [[-2.9, 4.5, 1.0, '#b5603a'], [-3.4, 4.6, 0.8, '#9c4e2c'], [2.95, 4.6, 0.9, '#b5603a'], [-9.2, 1.2, 1.0, '#a85634'], [-9.3, 0.4, 0.8, '#c06b3e'], [9.2, -1.9, 0.9, '#a85634'], [-4.0, -4.5, 0.9, '#b5603a'], [-3.4, -4.55, 0.7, '#9c4e2c']]) {
    g.add(place(jar(s, c), { x, y: y0, z }));
  }
  for (const [x, y, z, s] of [[9.25, 0, 1.5, 0.7], [9.2, 0, 0.7, 0.6], [9.25, 0.7, 1.55, 0.5], [3.5, 0, -4.5, 0.7], [4.3, 0, -4.5, 0.6], [5.0, 0, -4.55, 0.55]]) {
    g.add(place(crate(s), { x, y: y0 + y, z }));
  }
  for (let i = 0; i < 3; i++) g.add(place(spiceSack(i + 5, 0.9), { x: 6.2 + i * 0.6, y: y0, z: -4.5 }));

  // palms in the corners + side strips
  g.add(place(datePalm({ h: 6.0, seed: 4 }), { x: -8.0, y: y0, z: 3.5 }));
  g.add(place(datePalm({ h: 7.2, seed: 7, lean: 0, fl: 1.3 }), { x: -9.0, y: y0, z: -3.0 }));
  g.add(place(datePalm({ h: 5.6, seed: 9 }), { x: 8.1, y: y0, z: -3.5, ry: 180 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: 9.3, y: y0, z: 2.6 }));
  return g;
}

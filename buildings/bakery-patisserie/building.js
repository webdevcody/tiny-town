import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, FLOOR,
  lot, patch, facadeBlock, mansardRoof, gableRoof, chimney, awning, door, windowPanel,
  box, cylinder, place, mat, glass, emissive, surface, tree, hedge,
} from '../../src/lib/index.js';
import {
  PINK, PINK_DARK, PINK_PALE, CREAM,
  scriptSign, croissant, miniCroissant, cake, macarons, bistroChair, bistroTable,
  chalkboard, cargoBike, crates, bin, lanternLamp,
} from './props.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
const BX = -0.6, BZ = -1.7, BW = 7.2, BD = 5.6; // main block centre and size
const FRONT = BZ + BD / 2; // z of the front wall
const GF = 3.7; // ground-floor (shop) height

/** Bay display window full of cakes; back against z = 0, sticks out to +z. */
function displayWindow(w, seed) {
  const h = 1.75, d = 0.5, sill = 0.5;
  const trim = mat(CREAM);
  const g = new THREE.Group();
  g.add(box(w + 0.24, sill, d + 0.06, mat(PINK_DARK)));
  g.add(place(box(w + 0.24, 0.12, d + 0.12, trim), { y: sill - 0.02 }));
  g.add(place(box(w, h, 0.04, emissive('#fff1d6', 0.35)), { y: sill, z: -d / 2 + 0.04 }));
  for (const x of [-w / 2 - 0.06, w / 2 + 0.06]) g.add(place(box(0.12, h, d, trim), { x, y: sill }));
  g.add(place(box(w + 0.24, 0.2, d + 0.1, trim), { y: sill + h }));
  g.add(place(box(w + 0.3, 0.08, d + 0.16, mat(PINK_DARK)), { y: sill + h + 0.2 }));
  // two glass shelves of cakes, macarons and croissants
  const shelfM = mat('#ffffff');
  const per = Math.max(3, Math.round(w / 0.5));
  for (let s = 0; s < 2; s++) {
    const sy = sill + 0.1 + s * 0.78;
    g.add(place(box(w - 0.05, 0.04, d - 0.12, shelfM), { y: sy, z: -0.02 }));
    for (let i = 0; i < per; i++) {
      const x = -w / 2 + (w / per) * (i + 0.5);
      const k = (i + s * 2 + seed) % 4;
      const item = k === 1 ? macarons(i + seed) : k === 3 ? miniCroissant(0.17) : cake(i + s + seed, { stand: s === 1 });
      g.add(place(item, { x, y: sy + 0.04, z: -0.02 }));
    }
  }
  // glass front + mullion
  g.add(place(box(w, h, 0.03, glass(PALETTE.glassSky, { opacity: 0.22 })), { y: sill, z: d / 2 - 0.02 }));
  g.add(place(box(0.05, h, 0.05, trim), { y: sill, z: d / 2 - 0.02 }));
  return g;
}

/** Slate dormer with a small window, front faces +z. */
function dormer() {
  const slate = surface('shingles', PALETTE.roofSlate, { size: 1.5 });
  return new THREE.Group().add(
    box(1.1, 1.2, 1.4, mat(CREAM)),
    place(windowPanel({ w: 0.6, h: 0.8, frame: '#ffffff', lit: false }), { y: 0.25, z: 0.7 }),
    place(gableRoof({ w: 1.1, d: 1.4, h: 0.6, overhang: 0.12, ridge: 'z', material: slate, gableMaterial: CREAM }), { y: 1.2 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // terrace in front: pink & cream checker tiles
  g.add(place(patch(7.6, 3.4, 'paved'), { x: BX, y: y0, z: FRONT + 1.9 }));
  const tileA = mat(PINK_PALE), tileB = mat(CREAM);
  for (let i = 0; i < 9; i++) for (let j = 0; j < 4; j++) {
    g.add(place(box(0.82, 0.02, 0.82, (i + j) % 2 ? tileA : tileB), { x: BX - 3.68 + i * 0.92, y: y0 + 0.05, z: FRONT + 0.55 + j * 0.92 }));
  }

  // --- the building --------------------------------------------------------
  // pink shop storey
  g.add(place(facadeBlock({ w: BW, d: BD, h: GF, floorHeight: GF, style: 'plain', wall: PINK, roof: PALETTE.concreteDark }), { x: BX, y: y0, z: BZ }));
  // cream upper storey with shuttered windows
  const upY = y0 + GF;
  g.add(place(facadeBlock({ w: BW, d: BD, floors: 1, style: 'punched', wall: CREAM, frame: '#ffffff', glass: PALETTE.window, shutters: PINK_DARK, windowW: 0.42, windowH: 0.58, bay: 2.4, lit: 0.34, seed: 7, roof: PALETTE.concreteDark }), { x: BX, y: upY, z: BZ }));
  // string course, cornice
  g.add(place(box(BW + 0.2, 0.22, BD + 0.2, mat('#ffffff')), { x: BX, y: upY - 0.08, z: BZ }));
  g.add(place(box(BW + 0.36, 0.3, BD + 0.36, mat('#ffffff')), { x: BX, y: upY + FLOOR - 0.1, z: BZ }));
  // window boxes with flowers under the upper windows (front)
  for (const x of [-2.4, 0, 2.4]) {
    g.add(place(box(1.0, 0.22, 0.3, mat(PALETTE.woodDark)), { x: BX + x, y: upY + 0.58, z: FRONT + 0.15 }));
    for (let k = 0; k < 4; k++) g.add(place(box(0.2, 0.18, 0.2, mat(k % 2 ? PINK : PALETTE.foliageLight)), { x: BX + x - 0.36 + k * 0.24, y: upY + 0.8, z: FRONT + 0.15 }));
  }

  // slate mansard with dormers and chimneys
  const roofY = upY + FLOOR + 0.2;
  const roofH = 2.4;
  g.add(place(mansardRoof({ w: BW, d: BD, h: roofH, inset: 1.1, overhang: 0.1, topMaterial: PALETTE.roofGrey }), { x: BX, y: roofY, z: BZ }));
  for (const x of [-2.3, 2.3]) g.add(place(dormer(), { x: BX + x, y: roofY + 0.25, z: FRONT - 1.1 }));
  for (const x of [-2.3, 2.3]) g.add(place(dormer(), { x: BX + x, y: roofY + 0.25, z: BZ - BD / 2 + 1.1, ry: 180 }));
  const brick = surface('brick', PALETTE.brick, { size: 1 });
  g.add(place(chimney({ w: 0.7, d: 0.9, h: 1.6, material: brick }), { x: BX - BW / 2 + 1.4, y: roofY + roofH, z: BZ - 0.9 }));
  g.add(place(chimney({ w: 0.7, d: 0.9, h: 1.3, material: brick }), { x: BX + BW / 2 - 1.4, y: roofY + roofH, z: BZ - 1.0 }));

  // giant croissant on the roof, on a small iron stand
  const topY = roofY + roofH;
  const iron = mat(PALETTE.roofBlack);
  for (const x of [-0.65, 0.65]) g.add(place(box(0.14, 1.5, 0.14, iron), { x: BX + x, y: topY, z: BZ + 0.6 }));
  g.add(place(box(1.6, 0.12, 0.3, iron), { x: BX, y: topY + 1.0, z: BZ + 0.6 }));
  g.add(place(croissant({ R: 1.9, r: 0.88, lobes: 5 }), { x: BX, y: topY + 0.2, z: BZ + 0.6 }));

  g.add(place(box(0.9, 0.35, 0.9, mat(PALETTE.steelLight)), { x: BX + 1.2, y: topY, z: BZ - 0.9 }));
  g.add(place(box(1.2, 0.12, 0.9, glass(PALETTE.glassSky)), { x: BX - 1.2, y: topY, z: BZ - 0.9 }));

  // --- shopfront ------------------------------------------------------------
  const fz = FRONT;
  // white pilasters and a raspberry plinth band
  for (const x of [-BW / 2 + 0.15, -0.75, 0.75, BW / 2 - 0.15]) g.add(place(box(0.32, GF - 0.6, 0.14, mat('#ffffff')), { x: BX + x, y: y0, z: fz + 0.07 }));
  // display bay windows either side of the door
  g.add(place(displayWindow(2.25, 0), { x: BX - 2.15, y: y0, z: fz + 0.27 }));
  g.add(place(displayWindow(2.25, 2), { x: BX + 2.15, y: y0, z: fz + 0.27 }));
  // glazed raspberry door with transom
  g.add(place(door({ w: 1.15, h: 2.3, color: PINK_DARK, frame: '#ffffff' }), { x: BX, y: y0, z: fz }));
  g.add(place(box(0.8, 1.2, 0.04, glass(PALETTE.glassSky)), { x: BX, y: y0 + 0.9, z: fz + 0.13 }));
  g.add(place(box(1.15, 0.4, 0.1, emissive('#fff1d6', 0.4)), { x: BX, y: y0 + 2.4, z: fz + 0.06 }));
  g.add(place(box(1.4, 0.12, 0.4, mat(PALETTE.concrete)), { x: BX, y: y0, z: fz + 0.2 }));

  // striped awning and the fascia sign above it
  g.add(place(awning({ w: BW + 0.1, depth: 1.25, drop: 0.45, color: PINK, color2: '#ffffff' }), { x: BX, y: y0 + 3.0, z: fz + 0.02, ry: 0 }));
  g.add(place(scriptSign('Pâtisserie', { w: 5.4, h: 0.62, key: 'fascia', bg: PINK_DARK }), { x: BX, y: y0 + 3.04, z: fz + 0.08 }));
  // little hanging croissant blade sign at the corner
  g.add(place(box(0.08, 0.08, 0.9, iron), { x: BX + BW / 2 - 0.05, y: y0 + 2.85, z: fz + 0.45 }));
  g.add(place(croissant({ R: 0.34, r: 0.18, lobes: 3, rings: 24, sides: 8 }), { x: BX + BW / 2 - 0.05, y: y0 + 2.25, z: fz + 0.7, ry: 90 }));

  // east side: side window with cakes and a service door
  g.add(place(windowPanel({ w: 1.4, h: 1.4, frame: '#ffffff', lit: true }), { x: BX + BW / 2, y: y0 + 0.9, z: BZ + 1.0, ry: 90 }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.woodDark, frame: '#ffffff' }), { x: BX + BW / 2, y: y0, z: BZ - 1.4, ry: 90 }));
  // west side window
  g.add(place(windowPanel({ w: 1.4, h: 1.4, frame: '#ffffff', lit: true }), { x: BX - BW / 2, y: y0 + 0.9, z: BZ + 0.6, ry: -90 }));
  g.add(place(windowPanel({ w: 1.4, h: 1.4, frame: '#ffffff', lit: true }), { x: BX - BW / 2, y: y0 + 0.9, z: BZ - 1.6, ry: -90 }));
  g.add(place(scriptSign('Boulangerie · Café', { w: 4.0, h: 0.55, key: 'west', bg: PINK_DARK }), { x: BX - BW / 2 - 0.02, y: y0 + 2.75, z: BZ - 0.5, ry: -90 }));
  g.add(place(scriptSign('Gâteaux · Café', { w: 3.6, h: 0.55, key: 'east', bg: PINK_DARK }), { x: BX + BW / 2 + 0.02, y: y0 + 2.75, z: BZ - 0.2, ry: 90 }));
  for (const z of [BZ + 0.6, BZ - 1.6]) g.add(place(awning({ w: 1.7, depth: 0.6, drop: 0.3, color: PINK, color2: '#ffffff' }), { x: BX - BW / 2, y: y0 + 2.62, z, ry: -90 }));
  g.add(place(awning({ w: 1.7, depth: 0.6, drop: 0.3, color: PINK, color2: '#ffffff' }), { x: BX + BW / 2, y: y0 + 2.62, z: BZ + 1.0, ry: 90 }));
  // back: kitchen door + vent hood
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.woodDark, frame: '#ffffff' }), { x: BX + 1.6, y: y0, z: BZ - BD / 2, ry: 180 }));
  g.add(place(box(0.8, 0.5, 0.4, mat(PALETTE.steelLight, { metalness: 0.5 })), { x: BX - 1.8, y: y0 + 2.4, z: BZ - BD / 2 - 0.2 }));

  // --- cafe terrace -------------------------------------------------------------
  const tz = fz + 2.35;
  for (const [tx, seed] of [[BX - 2.6, 0], [BX + 2.5, 3]]) {
    g.add(place(bistroTable(seed), { x: tx, y: y0 + 0.07, z: tz }));
    g.add(place(bistroChair(), { x: tx - 0.7, y: y0 + 0.07, z: tz, ry: 90 }));
    g.add(place(bistroChair(), { x: tx + 0.7, y: y0 + 0.07, z: tz, ry: -90 }));
    g.add(place(bistroChair(), { x: tx, y: y0 + 0.07, z: tz + 0.7, ry: 180 }));
  }
  g.add(place(chalkboard(), { x: BX + 1.0, y: y0 + 0.07, z: fz + 1.85, ry: -20 }));
  // potted topiary by the door
  for (const x of [-0.95, 0.95]) {
    g.add(place(cylinder(0.22, 0.17, 0.4, mat(CREAM), 8), { x: BX + x, y: y0, z: fz + 0.95 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 31 + x }), { x: BX + x, y: y0 + 0.4, z: fz + 0.95 }));
  }
  // flower planters along the street edge, gap at the door
  const planter = mat(PALETTE.white);
  for (const [px, pw] of [[-3.25, 3.3], [2.2, 2.6]]) {
    g.add(place(box(pw, 0.45, 0.5, planter), { x: px, y: y0, z: 4.55 }));
    g.add(place(hedge({ w: pw - 0.2, h: 0.35, d: 0.38, color: PALETTE.foliageLight }), { x: px, y: y0 + 0.45, z: 4.55 }));
    for (let k = 0; k < Math.floor(pw / 0.55); k++) {
      g.add(place(box(0.18, 0.12, 0.18, mat(k % 2 ? PINK : '#ffffff')), { x: px - pw / 2 + 0.35 + k * 0.55, y: y0 + 0.78, z: 4.55 + ((k % 3) - 1) * 0.1 }));
    }
  }

  // --- east side yard: delivery bike, crates, bins --------------------------------
  g.add(place(patch(2.0, 9.6, 'paved'), { x: 4.0, y: y0, z: 0 }));
  g.add(place(cargoBike(), { x: 4.05, y: y0 + 0.05, z: 2.7, ry: -90 }));
  g.add(place(lanternLamp(3.3), { x: 4.5, y: y0, z: 4.5 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 12 }), { x: 4.05, y: y0, z: 0.4 }));
  g.add(place(crates(3), { x: 4.1, y: y0, z: -2.4 }));
  g.add(place(crates(2, PALETTE.blue), { x: 4.25, y: y0, z: -3.0, ry: 15 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.5, 0.25, 0.7, mat('#efe6d2')), { x: 4.5, y: y0 + i * 0.25, z: -1.6, ry: i * 12 }));
  g.add(place(bin(), { x: 3.8, y: y0, z: -4.3 }));
  g.add(place(bin(PALETTE.darkGrey), { x: 4.5, y: y0, z: -4.3 }));

  // west strip: climbing roses
  g.add(place(hedge({ w: 4.4, h: 1.0, d: 0.5, color: PALETTE.foliage }), { x: -4.7, y: y0, z: -2.2, ry: 90 }));
  for (let k = 0; k < 6; k++) g.add(place(box(0.16, 0.14, 0.16, mat(PINK)), { x: -4.45, y: y0 + 0.5 + (k % 2) * 0.35, z: -4.0 + k * 0.7 }));
  g.add(place(tree({ kind: 'cone', h: 3.2, seed: 5 }), { x: -4.35, y: y0, z: 1.5 }));
  return g;
}

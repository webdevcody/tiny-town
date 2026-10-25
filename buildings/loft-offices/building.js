import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, facadeBlock, box, boxFaces, place, cylinder, cone, beam, tank, solarPanel,
  tree, streetLamp, bench, car, door, hedge, surface, mat, glass, metal,
} from '../../src/lib/index.js';
import { archWindow, bigSign, fireEscape } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// A converted red-brick warehouse: tall arched windows between brick
// pilasters, stone string courses, corbelled cornice, black fire escape,
// timber water tower, and a modern glass box office on the roof terrace.

const BW = 7.6, BD = 6.6; // warehouse footprint
const CX = -0.6, CZ = -1.1; // warehouse centre
const GF = 3.6, UF = 3.2; // ground / upper storey heights
const H = GF + 2 * UF; // eaves (top of brick walls)

const brickM = surface('brick', PALETTE.brick, { size: 2 });
const darkBrickM = mat(PALETTE.brickDark);
const stoneM = mat(PALETTE.sandstone);
const blackM = mat(PALETTE.roofBlack, { roughness: 0.6 });

// Decorates one wall face of length `len` (origin at its base centre, facing +Z).
function face(len, { seed, entrance = false } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const bays = Math.max(2, Math.round(len / 1.9));
  const bw = len / bays;
  // pilasters at bay divisions and corners
  for (let i = 0; i <= bays; i++) {
    const x = -len / 2 + i * bw;
    const pw = i === 0 || i === bays ? 0.5 : 0.34;
    const px = i === 0 ? x + pw / 2 - 0.08 : i === bays ? x - pw / 2 + 0.08 : x;
    g.add(place(box(pw, H - 0.5, 0.16, darkBrickM), { x: px, y: 0.5 }));
  }
  for (let i = 0; i < bays; i++) {
    const x = -len / 2 + (i + 0.5) * bw;
    const wW = Math.min(1.25, bw - 0.75);
    const centre = entrance && (i === Math.floor(bays / 2) - (bays % 2 ? 0 : 1) || i === Math.floor(bays / 2));
    // ground floor: taller arches; entrance bays get glass doors
    g.add(place(archWindow({ w: wW, h: centre ? 3.0 : 2.6, lit: r.chance(0.3) }), { x, y: centre ? 0.15 : 0.7 }));
    if (centre) g.add(place(door({ w: wW * 0.9, h: 2.1, color: PALETTE.glassDark, frame: PALETTE.roofBlack }), { x, y: 0.15, z: 0.03 }));
    for (let f = 0; f < 2; f++) {
      g.add(place(archWindow({ w: wW, h: 2.3, lit: r.chance(0.25) }), { x, y: GF + f * UF + 0.45 }));
    }
  }
  return g;
}

function roofTerrace(g, y) {
  // glass box office, set back towards the rear-left
  const gw = 5.2, gd = 3.6, gh = 3.4, gx = CX - 0.9, gz = CZ - 1.0;
  g.add(place(box(gw + 0.2, 0.25, gd + 0.2, mat(PALETTE.steelDark)), { x: gx, y, z: gz }));
  g.add(place(facadeBlock({ w: gw, d: gd, h: gh, floorHeight: gh, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.roofBlack, bay: 1.2, lit: 0.15, seed: 31, roof: PALETTE.steelLight }), { x: gx, y: y + 0.25, z: gz }));
  // thin overhanging roof slab
  g.add(place(box(gw + 1.0, 0.25, gd + 1.0, mat(PALETTE.white)), { x: gx, y: y + 0.25 + gh, z: gz + 0.2 }));
  // black steel corner posts
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.16, gh, 0.16, blackM), { x: gx + sx * gw / 2, y: y + 0.25, z: gz + sz * gd / 2 }));
  }
  // membrane roof with a row of solar panels
  g.add(place(box(gw + 0.5, 0.06, gd + 0.5, mat(PALETTE.roofGrey)), { x: gx, y: y + 0.5 + gh, z: gz + 0.2 }));
  for (let i = 0; i < 3; i++) g.add(place(solarPanel({ w: 1.4, d: 0.9, tilt: 20, height: 0.25 }), { x: gx - 1.7 + i * 1.7, y: y + 0.56 + gh, z: gz - 0.4 }));

  // timber deck in front of the glass box
  const deckZ0 = gz + gd / 2 + 0.6; // front edge of glass box overhang
  const deckD = CZ + BD / 2 - 0.3 - deckZ0;
  g.add(place(box(BW - 0.7, 0.08, deckD, surface('planks', PALETTE.woodLight, { size: 1.5 })), { x: CX, y, z: deckZ0 + deckD / 2 }));
  // cafe tables with umbrellas on the deck
  for (const [x, z, c] of [[CX - 2.2, deckZ0 + 0.9, PALETTE.orange], [CX + 0.3, deckZ0 + 0.95, PALETTE.white]]) {
    g.add(place(cylinder(0.4, 0.4, 0.06, mat(PALETTE.white), 10), { x, y: y + 0.75, z }));
    g.add(place(cylinder(0.04, 0.04, 2.0, blackM, 6), { x, y, z }));
    g.add(place(cone(1.0, 0.45, mat(c), 8), { x, y: y + 2.0, z }));
    for (const dx of [-0.6, 0.6]) g.add(place(box(0.4, 0.45, 0.4, mat(PALETTE.steelDark)), { x: x + dx, y, z }));
  }
  // planters along the front parapet
  for (const x of [CX - 3.1, CX + 1.8]) {
    g.add(place(box(0.8, 0.5, 0.8, mat(PALETTE.steelDark)), { x, y, z: deckZ0 + 1.1 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: Math.round(x * 7) }), { x, y: y + 0.5, z: deckZ0 + 1.1 }));
  }

  // old timber water tower on steel legs, rear-right corner
  const wx = CX + BW / 2 - 1.3, wz = CZ - BD / 2 + 1.3;
  g.add(place(tank({ radius: 0.95, h: 1.7, roof: 'cone', legs: 4, legHeight: 1.6, material: surface('planks', PALETTE.wood, { size: 1 }), segments: 12 }), { x: wx, y, z: wz }));
  for (const hy of [0.35, 1.3]) g.add(place(cylinder(0.98, 0.98, 0.08, blackM, 12), { x: wx, y: y + 1.6 + hy, z: wz }));
  // brick stair / lift overrun next to it
  g.add(place(boxFaces(1.5, 2.2, 1.5, { sides: brickM, top: mat(PALETTE.concreteDark) }), { x: wx, y, z: wz + 2.0 }));
  g.add(place(box(1.7, 0.15, 1.7, stoneM), { x: wx, y: y + 2.2, z: wz + 2.0 }));
  g.add(place(door({ w: 0.8, h: 1.8, color: PALETTE.steelDark }), { x: wx, y, z: wz + 2.75 }));
  
}

function bicycle(color) {
  const g = new THREE.Group();
  const m = mat(color);
  const wheel = new THREE.TorusGeometry(0.3, 0.035, 4, 12);
  for (const x of [-0.5, 0.5]) {
    const w = new THREE.Mesh(wheel, blackM);
    w.position.set(x, 0.33, 0);
    g.add(w);
  }
  g.add(beam([-0.5, 0.33, 0], [0, 0.7, 0], 0.05, m));
  g.add(beam([0, 0.7, 0], [0.5, 0.33, 0], 0.05, m));
  g.add(beam([-0.1, 0.33, 0], [0, 0.7, 0], 0.05, m));
  g.add(beam([0.45, 0.85, 0], [0.5, 0.33, 0], 0.05, m));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // ---- warehouse body
  g.add(place(boxFaces(BW, H, BD, { sides: brickM, top: mat(PALETTE.roofGrey) }), { x: CX, y: y0, z: CZ }));
  // stone plinth and string courses
  g.add(place(box(BW + 0.3, 0.5, BD + 0.3, mat(PALETTE.stoneDark)), { x: CX, y: y0, z: CZ }));
  for (const y of [GF, GF + UF]) g.add(place(box(BW + 0.4, 0.18, BD + 0.4, stoneM), { x: CX, y: y0 + y - 0.05, z: CZ }));

  // facades with pilasters and arched windows
  g.add(place(face(BW, { seed: 1, entrance: true }), { x: CX, y: y0, z: CZ + BD / 2 }));
  g.add(place(face(BW, { seed: 2 }), { x: CX, y: y0, z: CZ - BD / 2, ry: 180 }));
  g.add(place(face(BD, { seed: 3 }), { x: CX + BW / 2, y: y0, z: CZ, ry: 90 }));
  g.add(place(face(BD, { seed: 4 }), { x: CX - BW / 2, y: y0, z: CZ, ry: -90 }));

  // corbelled cornice + parapet with stone coping
  const corbel = darkBrickM;
  for (let x = -BW / 2 + 0.25; x <= BW / 2 - 0.2; x += 0.5) {
    for (const s of [-1, 1]) g.add(place(box(0.22, 0.25, 0.2, corbel), { x: CX + x, y: y0 + H - 0.35, z: CZ + s * (BD / 2 + 0.1) }));
  }
  for (let z = -BD / 2 + 0.25; z <= BD / 2 - 0.2; z += 0.5) {
    for (const s of [-1, 1]) g.add(place(box(0.2, 0.25, 0.22, corbel), { x: CX + s * (BW / 2 + 0.1), y: y0 + H - 0.35, z: CZ + z }));
  }
  g.add(place(box(BW + 0.5, 0.2, BD + 0.5, darkBrickM), { x: CX, y: y0 + H - 0.1, z: CZ }));
  const pT = 0.3, pH = 0.8;
  const py = y0 + H + 0.1;
  g.add(place(box(BW, pH, pT, brickM), { x: CX, y: py, z: CZ + BD / 2 - pT / 2 }));
  g.add(place(box(BW, pH, pT, brickM), { x: CX, y: py, z: CZ - BD / 2 + pT / 2 }));
  g.add(place(box(pT, pH, BD, brickM), { x: CX + BW / 2 - pT / 2, y: py, z: CZ }));
  g.add(place(box(pT, pH, BD, brickM), { x: CX - BW / 2 + pT / 2, y: py, z: CZ }));
  const capM = stoneM;
  g.add(place(box(BW + 0.1, 0.12, pT + 0.1, capM), { x: CX, y: py + pH, z: CZ + BD / 2 - pT / 2 }));
  g.add(place(box(BW + 0.1, 0.12, pT + 0.1, capM), { x: CX, y: py + pH, z: CZ - BD / 2 + pT / 2 }));
  g.add(place(box(pT + 0.1, 0.12, BD, capM), { x: CX + BW / 2 - pT / 2, y: py + pH, z: CZ }));
  g.add(place(box(pT + 0.1, 0.12, BD, capM), { x: CX - BW / 2 + pT / 2, y: py + pH, z: CZ }));

  // raised name panel on the front parapet
  const fz = CZ + BD / 2;
  g.add(place(box(4.6, 0.9, pT, brickM), { x: CX, y: py + pH, z: fz - pT / 2 }));
  g.add(place(box(4.7, 0.12, pT + 0.1, capM), { x: CX, y: py + pH + 0.9, z: fz - pT / 2 }));
  g.add(place(bigSign({ text: 'LOFT OFFICES', w: 4.2, h: 1.0, bg: PALETTE.cream, fg: PALETTE.brickDark, border: PALETTE.brickDark }), { x: CX, y: py + 0.55, z: fz + 0.02 }));

  // entrance canopy (black steel + glass) over the two middle bays
  g.add(place(box(3.8, 0.12, 1.4, glass(PALETTE.glassSky)), { x: CX, y: y0 + 3.2, z: fz + 0.7 }));
  g.add(place(box(3.9, 0.18, 0.1, blackM), { x: CX, y: y0 + 3.17, z: fz + 1.4 }));
  for (const sx of [-1, 1]) g.add(beam([CX + sx * 1.8, y0 + 4.3, fz + 0.1], [CX + sx * 1.8, y0 + 3.3, fz + 1.35], 0.06, blackM));
  // small projecting blade sign by the door
  g.add(place(bigSign({ text: 'LOFTS', w: 0.9, h: 0.35, d: 0.08, bg: PALETTE.roofBlack, fg: PALETTE.windowLit }), { x: CX + 2.85, y: y0 + 2.35, z: fz + 0.5, ry: 90 }));
  g.add(place(box(0.06, 0.06, 0.6, blackM), { x: CX + 2.85, y: y0 + 2.72, z: fz + 0.3 }));

  // fire escape down the east wall
  g.add(place(fireEscape({ w: 4.2, depth: 0.95, levels: [GF + 0.35, GF + UF + 0.35], ladderTo: 1.4 }), { x: CX + BW / 2 + 0.16, y: y0, z: CZ - 0.2, ry: 90 }));

  // ---- roof: glass box addition, deck, water tower
  roofTerrace(g, y0 + H + 0.1);

  // ---- street side: cobbled forecourt, trees, lamps, bikes, car
  const frontD = 5 - (fz + 0.15);
  g.add(place(patch(BW + 0.6, frontD, 'cobbles'), { x: CX, y: y0, z: fz + 0.15 + frontD / 2 }));
  g.add(place(patch(1.6, 0.6, 'concrete'), { x: CX, y: y0 + 0.02, z: fz + 0.45 }));
  for (const x of [CX - 3.3, CX + 3.3]) {
    g.add(place(box(1.1, 0.45, 1.1, darkBrickM), { x, y: y0, z: 3.9 }));
    g.add(place(tree({ kind: 'round', h: 3.6, seed: x > 0 ? 12 : 13 }), { x, y: y0 + 0.45, z: 3.9 }));
  }
  g.add(place(streetLamp({ h: 3.8 }), { x: CX - 1.9, y: y0, z: 4.4 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: CX + 1.9, y: y0, z: 4.4, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: CX - 3.3, y: y0, z: 2.75 }));
  // bike rack
  for (let i = 0; i < 3; i++) {
    const bx = CX + 1.3 + i * 0.45;
    g.add(place(box(0.05, 0.6, 0.6, blackM), { x: bx, y: y0, z: 3.3 }));
    if (i < 2) g.add(place(bicycle([PALETTE.red, PALETTE.blue][i]), { x: bx + 0.04, y: y0, z: 3.3, ry: 90 }));
  }
  g.add(place(car({ color: PALETTE.roofGreen }), { x: 4.4, y: y0 + 0.05, z: 3.6, ry: 90, s: 0.6 }));

  // side + back: hedges, bins
  g.add(place(hedge({ w: BD, h: 0.9, d: 0.5 }), { x: -4.7, y: y0, z: CZ, ry: 90 }));
  g.add(place(hedge({ w: BW - 2, h: 0.9, d: 0.5 }), { x: CX - 1, y: y0, z: -4.7 }));
  g.add(place(box(1.4, 1.0, 0.8, metal(PALETTE.green, { roughness: 0.6 })), { x: 3.6, y: y0, z: -4.4 }));
  g.add(place(box(1.5, 0.08, 0.9, metal(PALETTE.steelDark)), { x: 3.6, y: y0 + 1.0, z: -4.4 }));
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 21 }), { x: 4.0, y: y0, z: -2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 22 }), { x: 4.4, y: y0, z: 1.6 }));
  return g;
}

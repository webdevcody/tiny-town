import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, place, group, parapet, mat, metal, emissive, surface, pipe,
  door, windowPanel, awning, lattice, antenna, flag, tree, car, bench, streetLamp, shade,
} from '../../src/lib/index.js';
import { bigSign, stageNumber, dish, obTruck, lightStand, filmCamera } from './parts.js';

const y0 = LOT_HEIGHT;

// Huge numbered soundstage: plain stucco shed, flat roof with HVAC + ducts.
// numbers: { front: x, back: x, left: z } where to paint the stage number.
function soundstage({ n, w, d, h, wall, doorAt, doorSide = 'front', numbers, smallDoorAt }) {
  const g = new THREE.Group();
  const trim = mat(shade(wall, -0.18));
  g.add(box(w, h, d, mat(wall, { roughness: 0.9 })));
  g.add(box(w + 0.08, 0.7, d + 0.08, trim)); // plinth
  g.add(place(box(w + 0.12, 0.35, d + 0.12, trim), { y: h - 0.35 })); // coping band
  g.add(place(box(w - 0.3, 0.04, d - 0.3, mat(PALETTE.roofGrey)), { y: h }));
  g.add(place(parapet({ w, d, h: 0.45, t: 0.2, material: trim }), { y: h }));

  // big painted numbers
  const sz = 2.6, ny = h - sz - 0.5;
  if (numbers.front != null) g.add(place(stageNumber(n, { size: sz }), { x: numbers.front, y: ny, z: d / 2 + 0.03 }));
  if (numbers.back != null) g.add(place(stageNumber(n, { size: sz }), { x: numbers.back, y: ny, z: -d / 2 - 0.03, ry: 180 }));
  if (numbers.left != null) g.add(place(stageNumber(n, { size: sz }), { x: -w / 2 - 0.03, y: ny, z: numbers.left, ry: -90 }));

  // elephant door (tall sliding steel door) + red "do not enter" light
  const dw = 2.7, dh = 4.5;
  const doorM = surface('corrugated', PALETTE.steelLight, { size: 0.6, metalness: 0.4, roughness: 0.5 });
  const elephant = group(
    place(box(dw, dh, 0.14, doorM), { z: 0.07 }),
    place(box(dw + 0.8, 0.3, 0.35, metal(PALETTE.steelDark)), { y: dh, z: 0.17 }),
    place(box(0.12, dh, 0.2, mat(PALETTE.yellow)), { x: -dw / 2 - 0.08, z: 0.1 }),
    place(box(0.12, dh, 0.2, mat(PALETTE.yellow)), { x: dw / 2 + 0.08, z: 0.1 }),
    place(box(0.45, 0.45, 0.25, emissive(PALETTE.red, 1.4)), { x: -dw / 2 - 0.55, y: dh - 0.6, z: 0.12 }),
    place(bigSign({ text: `STAGE ${n}`, w: 1.6, h: 0.4, depth: 0.06, bg: PALETTE.red }), { x: 0, y: dh + 0.45, z: 0.06 }),
  );
  if (doorSide === 'front') g.add(place(elephant, { x: doorAt, z: d / 2 }));
  else g.add(place(elephant, { x: -w / 2, z: doorAt, ry: -90 }));

  // personnel door with a little canopy
  if (smallDoorAt != null) {
    g.add(place(door({ w: 0.95, h: 2.2, color: PALETTE.navy }), { x: smallDoorAt, z: d / 2 }));
    g.add(place(box(1.6, 0.12, 0.9, metal(PALETTE.steelDark)), { x: smallDoorAt, y: 2.55, z: d / 2 + 0.45 }));
  }

  // rooftop air handlers and silver ductwork running down the back wall
  const ductM = metal(PALETTE.aluminium, { roughness: 0.3 });
  for (const [ux, uz] of [[-w / 4, -d / 4], [w / 4, d / 6]]) {
    g.add(place(box(1.8, 1.0, 1.3, mat(PALETTE.lightGrey)), { x: ux, y: h, z: uz }));
    g.add(place(box(0.9, 0.06, 0.9, mat(PALETTE.darkGrey)), { x: ux, y: h + 1.0, z: uz }));
  }
  const duct = (pts, r) => pts.slice(1).forEach((p, i) => g.add(pipe(pts[i], p, r, ductM)));
  const yd = h + 0.5, xe = w / 2 - 0.55, zb = -d / 2 - 0.3;
  duct([[-w / 4 - 0.9, yd, -d / 4], [-xe, yd, -d / 4], [-xe, yd, zb], [-xe, 2.8, zb]], 0.28);
  duct([[w / 4, yd, d / 6 - 0.65], [w / 4, yd, -d / 4], [xe, yd, -d / 4], [xe, yd, zb], [xe, 3.6, zb]], 0.24);
  return g;
}

// False-front set facade with timber bracing behind (front faces +Z).
function setFacade({ w, h, wallMat, depth = 0.25 }) {
  const g = new THREE.Group();
  g.add(place(box(w, h, depth, wallMat), { z: 0 }));
  const timber = mat(PALETTE.wood);
  for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) {
    g.add(pipe([x, h * 0.75, -depth / 2], [x, 0, -depth / 2 - h * 0.28], 0.07, timber));
    g.add(place(box(0.14, h * 0.95, 0.14, timber), { x, z: -depth / 2 - 0.08 }));
  }
  g.add(place(box(w - 0.3, 0.12, 0.12, timber), { y: h * 0.5, z: -depth / 2 - 0.08 }));
  return g;
}

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'concrete'));

  // ---------- grounds ----------
  g.add(place(patch(6.6, 3.9, 'asphalt'), { x: -0.1, y: y0, z: 2.85 }));          // OB truck yard
  g.add(place(patch(2.3, 5.2, 'asphalt'), { x: 4.4, y: y0, z: 2.2 }));            // uplink bay
  g.add(place(patch(4.1, 5.2, 'paved'), { x: 7.55, y: y0, z: 2.2 }));             // office forecourt
  g.add(place(patch(6.4, 0.8, 'paved'), { x: -6.4, y: y0, z: 2.5 }));             // backlot sidewalk
  g.add(place(patch(6.4, 1.9, 'cobbles'), { x: -6.4, y: y0, z: 3.85 }));          // backlot street

  // ---------- soundstages ----------
  g.add(place(soundstage({
    n: 1, w: 5.8, d: 5.2, h: 7.6, wall: PALETTE.cream,
    doorSide: 'left', doorAt: 1.1, numbers: { front: 1.2, back: 0, left: -1.25 },
  }), { x: -6.7, y: y0, z: -2.0 }));
  g.add(place(soundstage({
    n: 2, w: 5.8, d: 5.8, h: 7.6, wall: PALETTE.sandstone,
    doorSide: 'front', doorAt: 1.25, numbers: { front: -1.35, back: 0 }, smallDoorAt: -1.35,
  }), { x: -0.2, y: y0, z: -1.7 }));
  // enclosed crossover bridge between the two stages
  g.add(place(box(0.8, 1.4, 1.6, mat(PALETTE.lightGrey)), { x: -3.45, y: y0 + 5.2, z: -2.4 }));
  g.add(place(box(0.82, 0.4, 1.3, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: -3.45, y: y0 + 5.7, z: -2.4 }));

  // ---------- studio office block ----------
  const ox = 6.4, oz = -2.6, ow = 6.2, od = 4.4, oh = 9;
  g.add(place(facadeBlock({
    w: ow, d: od, floors: 3, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassBlue,
    frame: PALETTE.steelLight, bay: 2.0, lit: 0.25, seed: 7, roof: PALETTE.concreteDark,
  }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: ow, d: od, h: 0.5, t: 0.2, material: mat(PALETTE.red) }), { x: ox, y: y0 + oh, z: oz }));
  // glazed lobby + entrance canopy
  g.add(place(box(2.6, 2.6, 0.2, mat(PALETTE.glassTeal, { roughness: 0.15, metalness: 0.5 })), { x: ox, y: y0, z: oz + od / 2 + 0.05 }));
  g.add(place(door({ w: 1.2, h: 2.2, color: PALETTE.glassDark }), { x: ox, y: y0, z: oz + od / 2 + 0.1 }));
  g.add(place(box(3.4, 0.2, 1.6, mat(PALETTE.red)), { x: ox, y: y0 + 2.8, z: oz + od / 2 + 0.8 }));
  for (const sx of [-1.5, 1.5]) g.add(place(box(0.12, 2.8, 0.12, metal(PALETTE.steelLight)), { x: ox + sx, y: y0, z: oz + od / 2 + 1.5 }));
  // rooftop logo sign, broadcast mast, satellite dishes
  g.add(place(bigSign({ text: 'TTV STUDIOS', w: 5.4, h: 1.2, bg: PALETTE.red, fg: '#ffffff', double: true, glow: 0.35 }), { x: ox, y: y0 + oh + 0.5, z: oz + od / 2 - 0.3 }));
  for (const sx of [-2.2, 2.2]) g.add(place(box(0.1, 0.5, 0.1, metal(PALETTE.steelDark)), { x: ox + sx, y: y0 + oh, z: oz + od / 2 - 0.35 }));
  g.add(place(lattice({ w: 1.1, h: 7, topW: 0.35, thickness: 0.07, material: metal(PALETTE.red) }), { x: ox + 2.0, y: y0 + oh, z: oz - 1.1 }));
  g.add(place(antenna({ h: 2.2 }), { x: ox + 2.0, y: y0 + oh + 7, z: oz - 1.1 }));
  g.add(place(dish({ r: 0.95, tilt: 40 }), { x: ox - 1.7, y: y0 + oh, z: oz - 0.9, ry: 20 }));
  g.add(place(dish({ r: 0.7, tilt: 35 }), { x: ox + 0.2, y: y0 + oh, z: oz - 1.3, ry: -15 }));
  g.add(place(box(1.2, 0.8, 0.9, mat(PALETTE.lightGrey)), { x: ox - 0.2, y: y0 + oh, z: oz + 0.6 }));

  // ---------- outside-broadcast trucks ----------
  g.add(place(obTruck({ len: 5.8, w: 2.2, color: PALETTE.red, text: 'TTV  OB 1' }), { x: 0.0, y: y0, z: 3.45 }));
  g.add(place(obTruck({ len: 4.6, w: 2.0, color: PALETTE.blue, text: 'TTV  SAT', dishR: 0.85, mast: false }), { x: 4.4, y: y0, z: 2.25, ry: -90 }));
  // cable runs from the OB truck into stage 2
  const cableM = mat(PALETTE.black);
  for (const [dx, dz] of [[0, 0], [0.25, 0.05]]) {
    g.add(pipe([-2.2 + dx, y0 + 0.05, 2.3 + dz], [-1.9 + dx, y0 + 0.05, 1.6 + dz], 0.05, cableM));
    g.add(pipe([-1.9 + dx, y0 + 0.05, 1.6 + dz], [0.5 + dx, y0 + 0.05, 1.25 + dz], 0.05, cableM));
  }
  g.add(place(box(0.7, 0.5, 0.5, mat(PALETTE.yellow)), { x: -2.6, y: y0, z: 1.55 })); // cable reel crate

  // ---------- backlot street (false-front facades) ----------
  const fz = 1.95;
  // hotel: two brick storeys with cornice
  g.add(place(setFacade({ w: 2.0, h: 5.6, wallMat: surface('brick', PALETTE.brick, { size: 1 }) }), { x: -8.6, y: y0, z: fz }));
  g.add(place(box(2.2, 0.3, 0.45, mat(PALETTE.cream)), { x: -8.6, y: y0 + 5.6, z: fz + 0.05 }));
  for (const wx of [-0.5, 0.5]) g.add(place(windowPanel({ w: 0.55, h: 0.9, lit: wx > 0 }), { x: -8.6 + wx, y: y0 + 3.8, z: fz + 0.12 }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.woodDark }), { x: -8.6, y: y0, z: fz + 0.12 }));
  g.add(place(bigSign({ text: 'HOTEL', w: 1.7, h: 0.5, bg: PALETTE.navy, fg: '#ffd84a', depth: 0.08 }), { x: -8.6, y: y0 + 2.5, z: fz + 0.13 }));
  // diner: pastel front, big window, striped awning, false-front sign
  g.add(place(setFacade({ w: 2.0, h: 3.8, wallMat: mat(PALETTE.plasterBlue) }), { x: -6.6, y: y0, z: fz }));
  g.add(place(windowPanel({ w: 1.1, h: 1.0 }), { x: -6.85, y: y0 + 0.9, z: fz + 0.12 }));
  g.add(place(door({ w: 0.5, h: 1.9, color: PALETTE.red }), { x: -6.0, y: y0, z: fz + 0.12 }));
  g.add(place(awning({ w: 2.0, depth: 0.9, drop: 0.35, color: PALETTE.red }), { x: -6.6, y: y0 + 2.45, z: fz + 0.13 }));
  g.add(place(bigSign({ text: 'DINER', w: 1.8, h: 0.6, bg: PALETTE.white, fg: PALETTE.red, depth: 0.08 }), { x: -6.6, y: y0 + 3.0, z: fz + 0.13 }));
  // western saloon: plank front, stepped top, porch roof
  const planks = surface('planks', PALETTE.wood, { size: 1.2 });
  g.add(place(setFacade({ w: 2.0, h: 3.9, wallMat: planks }), { x: -4.6, y: y0, z: fz }));
  g.add(place(box(1.2, 0.7, 0.25, planks), { x: -4.6, y: y0 + 3.9, z: fz }));
  g.add(place(bigSign({ text: 'SALOON', w: 1.8, h: 0.5, bg: PALETTE.woodDark, fg: '#f4ead2', depth: 0.08 }), { x: -4.6, y: y0 + 3.15, z: fz + 0.13 }));
  g.add(place(door({ w: 0.8, h: 1.5, color: PALETTE.woodDark }), { x: -4.6, y: y0 + 0.3, z: fz + 0.12 }));
  g.add(place(box(2.0, 0.1, 0.9, mat(PALETTE.woodDark)), { x: -4.6, y: y0 + 2.3, z: fz + 0.55 }));
  for (const px of [-0.9, 0.9]) g.add(place(box(0.1, 2.3, 0.1, mat(PALETTE.woodDark)), { x: -4.6 + px, y: y0, z: fz + 0.95 }));
  // on set: vintage car, camera and lights
  g.add(place(car({ color: PALETTE.green }), { x: -7.3, y: y0 + 0.05, z: 3.95, s: 0.72 }));
  g.add(place(filmCamera(), { x: -4.0, y: y0, z: 4.1, ry: -110 }));
  g.add(place(lightStand({ h: 2.7 }), { x: -9.1, y: y0, z: 4.3, ry: 150 }));
  g.add(place(lightStand({ h: 2.4 }), { x: -5.3, y: y0, z: 4.45, ry: 200 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -9.4, y: y0, z: 2.7 }));

  // ---------- forecourt: monument sign, flags, trees ----------
  g.add(place(box(3.4, 0.45, 0.7, mat(PALETTE.stone)), { x: 7.6, y: y0, z: 4.1 }));
  g.add(place(bigSign({ text: 'TTV STUDIOS', w: 3.2, h: 0.85, bg: PALETTE.navy, fg: '#ffffff', depth: 0.4, double: true }), { x: 7.6, y: y0 + 0.45, z: 4.1 }));
  const flagColors = [[PALETTE.red, PALETTE.white], [PALETTE.blue, PALETTE.yellow], [PALETTE.yellow, PALETTE.red]];
  flagColors.forEach(([c1, c2], i) => g.add(place(flag({ h: 5.5, color: c1, color2: c2 }), { x: 9.45, y: y0, z: 0.6 + i * 1.1, ry: 180 })));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 12 }), { x: 6.5, y: y0, z: 2.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: 9.2, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 14 }), { x: 5.9, y: y0, z: 4.4 }));
  g.add(place(bench({ w: 1.4 }), { x: 8.3, y: y0, z: 3.0 }));
  g.add(place(streetLamp({ h: 4 }), { x: 3.5, y: y0, z: 4.6, ry: 180 }));
  return g;
}

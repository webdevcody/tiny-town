import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, hipRoof, chimney, door, windowPanel, box, cylinder, sphere, place, group,
  tree, car, fence, hedge, surface, mat, metal, textured, canvasTexture, shade,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Long low ranch house across the back of the lot, carport on the east end,
// striped front lawn filling the rest.

const WALL = PALETTE.cream;
const TRIM = PALETTE.white;
const SHUTTER = '#3f6b4a';

// mowing stripes for the front lawn (stripes run along X)
function lawnMaterial() {
  const tex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = shade(PALETTE.grassLight, -0.05);
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, h / 2, w, h / 2);
    ctx.fillStyle = 'rgba(255,255,255,0.06)';
    for (let i = 0; i < 40; i++) ctx.fillRect((i * 37) % w, (i * 23) % h, 2, 1);
  }, { key: 'ranch-bungalow:lawn' });
  tex.repeat.set(0.4, 0.4);
  return textured(tex, { roughness: 0.95 });
}

// window with shutters, origin at the bottom centre of the glass, sticks out to +z
function shutteredWindow({ w, h, shutters = true }) {
  const g = group(place(windowPanel({ w, h, frame: TRIM }), { y: 0 }));
  g.children[0].position.y = -0.1; // panel origin is the frame bottom
  if (shutters) {
    for (const s of [-1, 1]) g.add(place(box(0.32, h + 0.1, 0.08, SHUTTER), { x: s * (w / 2 + 0.3), y: -0.05 }));
  }
  g.add(place(box(w + 0.35, 0.08, 0.2, TRIM), { y: -0.18 })); // sill
  return g;
}

// window planter with flowers
function flowerBox(w, seed) {
  const g = group(place(box(w, 0.28, 0.35, PALETTE.woodDark), { z: 0.18 }));
  const cols = [PALETTE.red, PALETTE.yellow, '#e070b0', PALETTE.white];
  const n = Math.round(w / 0.3);
  for (let i = 0; i < n; i++) {
    g.add(place(sphere(0.13, mat(cols[(i + seed) % cols.length]), 6), { x: -w / 2 + 0.18 + i * ((w - 0.36) / (n - 1)), y: 0.24, z: 0.18 }));
  }
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const siding = surface('planks', WALL, { size: 1.2 });
  const brick = surface('brick', PALETTE.brickBrown, { size: 1 });
  const roofMat = surface('shingles', PALETTE.roofBrown, { size: 1.6 });

  // --- house body -----------------------------------------------------------
  const hx0 = -4.15, hx1 = 1.85;       // west / east wall
  const hz0 = -3.2, hz1 = 0.5;         // back / front wall
  const hw = hx1 - hx0, hd = hz1 - hz0;
  const hx = (hx0 + hx1) / 2, hz = (hz0 + hz1) / 2;
  const wallH = 2.7;
  g.add(place(box(hw + 0.1, 0.3, hd + 0.1, PALETTE.concreteDark), { x: hx, y: y0, z: hz })); // foundation
  g.add(place(box(hw, wallH, hd, siding), { x: hx, y: y0 + 0.3, z: hz }));
  const fy = y0 + 0.3;                 // finished floor level
  const roofY = fy + wallH;

  // brick wainscot across the front, broken by the door
  const doorX = -1.05;
  g.add(place(box(doorX - 0.6 - hx0, 0.85, 0.12, brick), { x: (hx0 + doorX - 0.6) / 2, y: fy, z: hz1 + 0.06 }));
  g.add(place(box(hx1 - (doorX + 0.6), 0.85, 0.12, brick), { x: (hx1 + doorX + 0.6) / 2, y: fy, z: hz1 + 0.06 }));
  g.add(place(box(hw + 0.02, 0.06, 0.18, TRIM), { x: hx, y: fy + 0.85, z: hz1 + 0.06 }));

  // front: two bedroom windows, door, big picture window
  const fz = hz1 + 0.12;
  for (const x of [-3.45, -2.25]) g.add(place(shutteredWindow({ w: 0.8, h: 1.0 }), { x, y: fy + 1.15, z: fz }));
  g.add(place(door({ w: 0.95, h: 2.1, color: PALETTE.red, frame: TRIM }), { x: doorX, y: fy, z: hz1 }));
  g.add(place(box(0.08, 0.08, 0.1, PALETTE.yellow), { x: doorX + 0.32, y: fy + 1.0, z: hz1 + 0.18 }));
  g.add(place(windowPanel({ w: 0.25, h: 1.6, frame: TRIM }), { x: doorX + 0.75, y: fy + 0.35, z: hz1 })); // sidelight
  g.add(place(shutteredWindow({ w: 2.1, h: 1.3, shutters: true }), { x: 0.65, y: fy + 1.0, z: fz }));
  g.add(place(flowerBox(2.0, 1), { x: 0.65, y: fy + 0.55, z: fz }));

  // back: windows + back door
  for (const x of [-3.3, -1.9, 0.9]) g.add(place(shutteredWindow({ w: 0.9, h: 1.0, shutters: false }), { x, y: fy + 1.15, z: hz0, ry: 180 }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.woodDark, frame: TRIM }), { x: -0.4, y: fy, z: hz0, ry: 180 }));
  // west end: two windows
  for (const z of [-2.2, -0.4]) g.add(place(shutteredWindow({ w: 0.9, h: 1.0 }), { x: hx0, y: fy + 1.15, z, ry: -90 }));
  // east wall (inside carport): utility door
  g.add(place(door({ w: 0.85, h: 2.0, color: PALETTE.white, frame: TRIM }), { x: hx1, y: fy, z: -0.7, ry: 90 }));

  // front stoop: two steps + slim porch posts under the eave
  g.add(place(box(1.8, 0.3, 1.0, PALETTE.concrete), { x: doorX, y: y0, z: hz1 + 0.5 }));
  g.add(place(box(1.8, 0.15, 0.4, PALETTE.concrete), { x: doorX, y: y0, z: hz1 + 1.15 }));
  for (const s of [-1, 1]) g.add(place(box(0.1, wallH, 0.1, TRIM), { x: doorX + s * 0.85, y: fy, z: hz1 + 0.95 }));

  // --- roofs ----------------------------------------------------------------
  const eave = 0.8;
  g.add(place(box(hw + 2 * eave, 0.18, hd + 2 * eave, TRIM), { x: hx, y: roofY - 0.18, z: hz })); // fascia
  g.add(place(hipRoof({ w: hw, d: hd, h: 0.9, overhang: eave, material: roofMat }), { x: hx, y: roofY, z: hz }));
  g.add(place(chimney({ w: 0.75, h: 1.6, material: brick }), { x: -2.6, y: roofY + 0.3, z: hz - 0.5 }));

  // TV antenna on the ridge
  const ant = metal(PALETTE.steelDark);
  const ax = 0.2, ay = roofY + 0.8;
  g.add(place(cylinder(0.035, 0.035, 1.6, ant, 5), { x: ax, y: ay, z: hz }));
  for (const [yy, l] of [[1.3, 1.1], [1.5, 0.8], [1.6, 0.5]]) g.add(place(box(0.04, 0.04, l, ant), { x: ax, y: ay + yy, z: hz }));

  // --- carport --------------------------------------------------------------
  const cx0 = hx1, cx1 = 4.7, cz0 = hz0, cz1 = hz1 + 0.3;
  const cw = cx1 - cx0, cd = cz1 - cz0, cx = (cx0 + cx1) / 2, cz = (cz0 + cz1) / 2;
  const cH = 2.45;
  g.add(place(patch(cw, cd, 'concrete'), { x: cx, y: y0, z: cz }));
  for (const z of [cz0 + 0.12, cz - 0.1, cz1 - 0.12]) g.add(place(box(0.16, cH, 0.16, TRIM), { x: cx1 - 0.12, y: y0, z }));
  g.add(place(box(0.2, 0.25, cd, TRIM), { x: cx1 - 0.12, y: y0 + cH - 0.25, z: cz })); // header beam
  g.add(place(box(cw, 0.18, 0.2, TRIM), { x: cx, y: y0 + cH - 0.18, z: cz1 - 0.12 }));
  g.add(place(box(cw + 0.5, 0.15, cd + 0.5, TRIM), { x: cx + 0.05, y: y0 + cH, z: cz }));
  g.add(place(hipRoof({ w: cw, d: cd, h: 0.45, overhang: 0.25, material: roofMat }), { x: cx + 0.05, y: y0 + cH + 0.15, z: cz }));
  // storage closet on the back of the carport, bins, car
  g.add(place(box(cw - 0.3, 2.0, 0.7, siding), { x: cx - 0.05, y: y0 + 0.05, z: cz0 + 0.35 }));
  g.add(place(box(0.8, 1.8, 0.04, PALETTE.white), { x: cx - 0.5, y: y0 + 0.1, z: cz0 + 0.72 }));
  g.add(place(box(0.8, 1.8, 0.04, PALETTE.white), { x: cx + 0.4, y: y0 + 0.1, z: cz0 + 0.72 }));
  g.add(place(car({ color: '#3f8fa0' }), { x: cx - 0.05, y: y0 + 0.05, z: cz + 0.35, ry: 90, s: 0.68 }));

  // --- driveway & paths -----------------------------------------------------
  const dz0 = cz1, dz1 = TILE / 2;
  g.add(place(patch(2.6, dz1 - dz0, 'concrete'), { x: cx, y: y0, z: (dz0 + dz1) / 2 }));
  for (const z of [2.2, 3.7]) g.add(place(box(2.6, 0.06, 0.05, PALETTE.concreteDark), { x: cx, y: y0, z })); // expansion joints
  g.add(place(patch(1.0, 1.3, 'paved'), { x: doorX, y: y0, z: hz1 + 1.95 }));
  g.add(place(patch(cx - 1.3 - doorX + 0.5, 1.0, 'paved'), { x: (doorX - 0.5 + cx - 1.3) / 2, y: y0, z: hz1 + 3.1 }));

  // --- front lawn -----------------------------------------------------------
  const lx0 = -TILE / 2, lx1 = cx - 1.3, lz0 = hz1 + 0.05;
  const lawn = lawnMaterial();
  g.add(place(patch(lx1 - lx0, TILE / 2 - lz0, lawn, 0.04), { x: (lx0 + lx1) / 2, y: y0, z: (lz0 + TILE / 2) / 2 }));

  // foundation planting beds with bushes
  const mulch = mat(PALETTE.mud);
  g.add(place(box(2.3, 0.08, 0.7, mulch), { x: -2.85, y: y0, z: hz1 + 0.4 }));
  g.add(place(box(2.5, 0.08, 0.6, mulch), { x: 0.65, y: y0, z: hz1 + 0.75 }));
  let seed = 20;
  for (const x of [-3.7, -2.85, -2.0]) g.add(place(tree({ kind: 'bush', h: 0.8, seed: seed++ }), { x, y: y0, z: hz1 + 0.45 }));
  for (const x of [-0.25, 1.55]) g.add(place(tree({ kind: 'bush', h: 0.9, seed: seed++ }), { x, y: y0, z: hz1 + 0.75 }));

  // big shade tree, ornamental tree, flower ring round the shade tree
  g.add(place(tree({ kind: 'round', h: 5.0, seed: 7 }), { x: -3.4, y: y0, z: 3.4 }));
  const ring = [PALETTE.red, PALETTE.yellow, '#e070b0'];
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(place(sphere(0.14, mat(ring[i % 3]), 6), { x: -3.4 + Math.cos(a) * 0.75, y: y0 + 0.08, z: 3.4 + Math.sin(a) * 0.75 }));
  }

  // bird bath in the middle of the lawn
  g.add(place(cylinder(0.12, 0.18, 0.7, PALETTE.stone, 8), { x: 0.4, y: y0, z: 3.4 }));
  g.add(place(cylinder(0.45, 0.3, 0.15, PALETTE.stone, 10), { x: 0.4, y: y0 + 0.7, z: 3.4 }));
  g.add(place(cylinder(0.36, 0.36, 0.02, PALETTE.water, 10), { x: 0.4, y: y0 + 0.84, z: 3.4 }));

  // mailbox at the end of the driveway, lamp post by the walk
  g.add(place(box(0.1, 1.0, 0.1, PALETTE.woodDark), { x: cx - 1.55, y: y0, z: 4.6 }));
  g.add(place(box(0.3, 0.3, 0.5, PALETTE.navy), { x: cx - 1.55, y: y0 + 1.0, z: 4.6 }));
  g.add(place(box(0.04, 0.2, 0.06, PALETTE.red), { x: cx - 1.38, y: y0 + 1.2, z: 4.5 }));
  g.add(place(cylinder(0.05, 0.06, 1.6, PALETTE.black, 6), { x: doorX - 0.75, y: y0, z: hz1 + 2.5 }));
  g.add(place(box(0.25, 0.3, 0.25, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.4 })), { x: doorX - 0.75, y: y0 + 1.6, z: hz1 + 2.5 }));

  // --- back yard: patio, grill, chairs, fence -------------------------------
  g.add(place(patch(3.2, 1.3, 'paved'), { x: -0.6, y: y0, z: -4.25 }));
  g.add(place(cylinder(0.3, 0.22, 0.35, PALETTE.black, 10), { x: 0.5, y: y0 + 0.6, z: -4.3 }));
  for (const s of [-1, 1]) g.add(place(box(0.05, 0.6, 0.05, PALETTE.darkGrey), { x: 0.5 + s * 0.15, y: y0, z: -4.3 }));
  for (const x of [-1.8, -0.9]) {
    g.add(place(box(0.5, 0.06, 0.5, PALETTE.white), { x, y: y0 + 0.35, z: -4.3 }));
    g.add(place(box(0.5, 0.5, 0.06, PALETTE.white), { x, y: y0 + 0.35, z: -4.53 }));
    for (const sx of [-1, 1]) g.add(place(box(0.05, 0.35, 0.45, PALETTE.white), { x: x + sx * 0.22, y: y0, z: -4.3 }));
  }
  g.add(place(fence({ w: TILE - 0.3, d: 0.1, h: 1.0, style: 'picket', color: PALETTE.white, sides: ['back'] }), { y: y0, z: -TILE / 2 + 0.2 }));
  g.add(place(hedge({ w: 3.2, h: 1.0, d: 0.6 }), { x: -TILE / 2 + 0.35, y: y0, z: -3.2, ry: 90 }));
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 12 }), { x: 3.8, y: y0, z: -3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: -3.4, y: y0, z: -4.3 }));
  return g;
}

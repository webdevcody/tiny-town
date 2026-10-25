import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, place, group, mat, metal, emissive, surface,
  door, lattice, antenna, cylinder, sphere, car, fence, tree, flag, streetLamp, bench,
  rooftopUnits, columns, textured, signTexture,
} from '../../src/lib/index.js';

const TRIM = PALETTE.navy;
const STRIPE = PALETTE.blue;

// White patrol car with a blue side stripe and a red/blue light bar. Length along X, nose at +X.
function patrolCar() {
  const g = car({ color: PALETTE.white });
  const len = 4.2;
  g.add(place(box(len + 0.04, 0.24, 1.84, mat(STRIPE)), { y: 0.55 }));
  g.add(place(box(len * 0.22, 0.05, 1.82, mat(PALETTE.black)), { x: len * 0.36, y: 1.03 }));
  g.add(place(box(0.42, 0.1, 1.3, mat(PALETTE.darkGrey)), { x: -0.15, y: 1.68 }));
  g.add(place(box(0.38, 0.2, 0.6, emissive('#ff2a2a', 1.1)), { x: -0.15, y: 1.76, z: -0.33 }));
  g.add(place(box(0.38, 0.2, 0.6, emissive('#2a6bff', 1.1)), { x: -0.15, y: 1.76, z: 0.33 }));
  return g;
}

// Sign board with text on +z (and -z if double). The lib sign() maps its texture in metres,
// which squeezes the text into one corner on boards wider than 1 m, so stretch it 0..1 here.
function board({ text, w, h, depth = 0.2, bg = TRIM, fg = '#ffffff', border = null, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round(256 * h / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// Red/white boom barrier, arm along +X from the post.
function boomBarrier(len) {
  return group(
    box(0.4, 1.0, 0.4, mat(PALETTE.lightGrey)),
    place(box(len, 0.12, 0.12, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.8 })), { x: len / 2, y: 0.85 })
  );
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'concrete'));

  const facadeStyle = {
    style: 'punched', wall: PALETTE.white, frame: STRIPE, glass: PALETTE.glassBlue,
    windowW: 0.62, windowH: 0.55, bay: 1.55, lit: 0.15, seed: 31, roof: PALETTE.concreteDark,
  };
  const trim = mat(TRIM);
  const s = mat(STRIPE), roofTop = mat(PALETTE.concreteDark);
  const cornice = [s, s, roofTop, s, s, s];

  // --- main office block: 2 storeys, blue trim bands --------------------------------
  const bx = -1.7, bz = -2.2, bw = 6.2, bd = 5.2, floorsN = 2;
  const topY = y0 + floorsN * FLOOR;
  g.add(place(facadeBlock({ w: bw, d: bd, floors: floorsN, ...facadeStyle }), { x: bx, y: y0, z: bz }));
  g.add(place(box(bw + 0.1, 0.45, bd + 0.1, trim), { x: bx, y: y0, z: bz }));              // plinth
  g.add(place(box(bw + 0.14, 0.28, bd + 0.14, trim), { x: bx, y: y0 + FLOOR - 0.14, z: bz })); // floor band
  g.add(place(box(bw + 0.24, 0.4, bd + 0.24, cornice), { x: bx, y: topY, z: bz }));       // cornice
  g.add(place(parapet({ w: bw + 0.24, d: bd + 0.24, h: 0.5, t: 0.25, material: trim }), { x: bx, y: topY + 0.4, z: bz }));
  g.add(place(rooftopUnits({ w: 3.2, d: 3.4, count: 2, seed: 7 }), { x: bx - 1.3, y: topY + 0.4, z: bz + 0.4 }));

  // rooftop POLICE sign on the front parapet
  const signW = 4.6;
  for (const sx of [-1.6, 1.6]) g.add(place(box(0.12, 0.7, 0.12, metal(PALETTE.steelDark)), { x: bx + sx, y: topY + 0.9, z: bz + bd / 2 - 0.15 }));
  g.add(place(board({ text: 'POLICE', w: signW, h: 1.15, bg: TRIM, fg: '#ffffff', depth: 0.22, double: true, border: '#ffffff' }), { x: bx, y: topY + 1.5, z: bz + bd / 2 - 0.15 }));

  // radio mast with dishes and whips (back-right corner of the roof)
  const mx = bx + bw / 2 - 1.0, mz = bz - bd / 2 + 1.0;
  g.add(place(box(1.4, 0.3, 1.4, mat(PALETTE.concrete)), { x: mx, y: topY + 0.4, z: mz }));
  g.add(place(lattice({ w: 1.0, h: 6.0, topW: 0.35, thickness: 0.09, material: metal(PALETTE.steelLight) }), { x: mx, y: topY + 0.7, z: mz }));
  g.add(place(antenna({ h: 2.6, radius: 0.07 }), { x: mx, y: topY + 6.7, z: mz }));
  const dishM = mat(PALETTE.white);
  const dish1 = cylinder(0.55, 0.2, 0.25, dishM, 12);
  g.add(place(dish1, { x: mx + 0.35, y: topY + 4.6, z: mz + 0.3, rx: 90, ry: 30 }));
  const dish2 = cylinder(0.45, 0.15, 0.22, dishM, 12);
  g.add(place(dish2, { x: mx - 0.45, y: topY + 3.1, z: mz + 0.1, rx: 90, ry: -60 }));
  for (const [ox, oz, h] of [[-0.3, 0.3, 2.2], [0.3, -0.3, 1.8]]) {
    g.add(place(cylinder(0.03, 0.04, h, metal(PALETTE.steelLight), 5), { x: mx + ox, y: topY + 5.5, z: mz + oz }));
  }

  // --- entrance: projecting porch with canopy, glass doors and blue lamp -------------
  const ex = bx - 0.9, fz = bz + bd / 2;
  g.add(place(box(2.8, 0.25, 1.8, mat(PALETTE.lightGrey)), { x: ex, y: y0, z: fz + 0.9 }));       // step
  g.add(place(door({ w: 1.6, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { x: ex, y: y0 + 0.25, z: fz }));
  g.add(place(box(0.06, 2.3, 0.14, mat(PALETTE.steelLight)), { x: ex, y: y0 + 0.25, z: fz + 0.07 }));
  g.add(place(box(3.2, 0.3, 1.9, mat(PALETTE.white)), { x: ex, y: y0 + 2.75, z: fz + 0.95 }));     // canopy
  g.add(place(box(3.24, 0.18, 1.94, trim), { x: ex, y: y0 + 2.7, z: fz + 0.95 }));
  g.add(place(columns({ count: 2, length: 2.8, radius: 0.12, h: 2.5, material: mat(PALETTE.white) }), { x: ex, y: y0 + 0.25, z: fz + 1.7 }));
  g.add(place(board({ text: 'POLICE', w: 2.6, h: 0.5, bg: TRIM, fg: '#ffffff', depth: 0.08 }), { x: ex, y: y0 + 2.76, z: fz + 1.92 }));
  // classic blue lamp on top of the canopy
  g.add(place(box(0.5, 0.6, 0.5, emissive('#3d7dff', 1.0)), { x: ex, y: y0 + 3.05, z: fz + 1.3 }));
  g.add(place(box(0.6, 0.1, 0.6, trim), { x: ex, y: y0 + 3.65, z: fz + 1.3 }));

  // --- garage / sally port wing ------------------------------------------------------
  const gx = 3.25, gz = -3.4, gw = 3.1, gd = 2.8;
  g.add(place(facadeBlock({ w: gw, d: gd, floors: 1, ...facadeStyle, blank: ['front', 'right'], seed: 32 }), { x: gx, y: y0, z: gz }));
  g.add(place(box(gw + 0.1, 0.45, gd + 0.1, trim), { x: gx, y: y0, z: gz }));
  g.add(place(box(gw + 0.2, 0.35, gd + 0.2, cornice), { x: gx, y: y0 + FLOOR, z: gz }));
  g.add(place(parapet({ w: gw + 0.2, d: gd + 0.2, h: 0.35, t: 0.2, material: trim }), { x: gx, y: y0 + FLOOR + 0.35, z: gz }));
  g.add(place(box(2.4, 2.3, 0.1, surface('corrugated', PALETTE.lightGrey, { size: 1 })), { x: gx, y: y0, z: gz + gd / 2 }));
  g.add(place(box(2.6, 0.15, 0.14, trim), { x: gx, y: y0 + 2.3, z: gz + gd / 2 }));

  // --- yard: asphalt, bay lines, patrol cars, fence, boom barrier --------------------
  const yx = 3.25, yw = 3.3, yz0 = -2.0, yz1 = 4.95;
  g.add(place(patch(yw, yz1 - yz0, surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 }), 0.06), { x: yx, y: y0, z: (yz0 + yz1) / 2 }));
  const lineM = mat(PALETTE.roadLine);
  for (const lx of [yx - 1.55, yx, yx + 1.55]) g.add(place(box(0.08, 0.02, 3.0, lineM), { x: lx, y: y0 + 0.06, z: 0.0 }));
  for (const cx of [yx - 0.78, yx + 0.78]) {
    g.add(place(patrolCar(), { x: cx, y: y0 + 0.06, z: 0.1, ry: -90, s: 0.62 }));
  }
  // third car at the gate, on its way out
  g.add(place(patrolCar(), { x: yx + 0.6, y: y0 + 0.06, z: 2.85, ry: -90, s: 0.62 }));
  g.add(place(fence({ w: yw, d: 6.8, h: 1.4, style: 'wire', sides: ['right'] }), { x: yx + 0.05, y: y0, z: 1.55 }));
  g.add(place(boomBarrier(2.7), { x: yx - 1.5, y: y0, z: 4.6 }));

  // --- forecourt: paving, flagpole, planters, lamp, bench ----------------------------
  g.add(place(patch(3.0, 2.6, 'paved'), { x: ex, y: y0, z: 3.65 }));
  g.add(place(patch(1.6, 4.5, surface('grass', PALETTE.grass, { size: 3 })), { x: -4.1, y: y0, z: 2.65 }));
  g.add(place(patch(1.0, 4.5, surface('grass', PALETTE.grass, { size: 3 })), { x: 0.85, y: y0, z: 2.65 }));
  g.add(place(flag({ h: 6.5, color: PALETTE.navy, color2: PALETTE.blue }), { x: -4.2, y: y0, z: 4.2 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: -4.1, y: y0, z: 1.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 13 }), { x: 0.85, y: y0, z: 1.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 14 }), { x: 0.85, y: y0, z: 3.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 15 }), { x: -4.1, y: y0, z: 3.0 }));
  g.add(place(streetLamp({ h: 4 }), { x: 0.85, y: y0, z: 4.5, ry: 180 }));
  g.add(place(bench({ w: 1.3 }), { x: -0.2, y: y0, z: 2.2, ry: -90 }));
  // small notice board by the path
  g.add(place(box(0.1, 1.0, 0.1, metal(PALETTE.steelDark)), { x: -3.3, y: y0, z: 4.6 }));
  g.add(place(board({ text: '24 HR', w: 0.9, h: 0.45, bg: STRIPE, fg: '#ffffff', depth: 0.06 }), { x: -3.3, y: y0 + 1.0, z: 4.6 }));
  g.add(place(sphere(0.08, emissive('#3d7dff', 1.0), 6), { x: -3.3, y: y0 + 1.5, z: 4.6 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, SWATCHES, LOT_HEIGHT,
  lot, patch, facadeBlock, barrelRoof, parapet, rooftopUnits, box, cylinder, cone, place, group,
  sphere, tree, car, streetLamp, bench, columns, glass, mat, metal, emissive, surface, rng,
  signTexture, textured, boxGeometry,
} from '../../src/lib/index.js';

// 3x2 tiles (30 x 20 m). Front (street + main car park) faces +z.
// Two anchor stores flank a two-level shopping gallery topped by crossed
// glass barrel vaults; car park wraps the front and both sides.

const y0 = LOT_HEIGHT;

// Like the lib's sign(), but with the text stretched over the whole face
// (box UVs are in metres, so the lib sign only shows its first square metre).
function sign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false }) {
  const th = Math.max(16, Math.round(256 / (w / h)));
  const tex = signTexture(text, { bg, fg, width: 256, height: th });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = boxGeometry(w, h, depth);
  const uv = geo.attributes.uv;
  for (let i = 16; i < 24; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / h);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// Arched rib following a barrel vault of span 2r and height h, in the XY plane.
function rib(r, h, t, material) {
  const geo = new THREE.TorusGeometry(r, t, 4, 14, Math.PI);
  geo.scale(1, h / r, 1);
  return new THREE.Mesh(geo, material);
}

// Painted parking bay lines + parked cars. Bays are `bay` wide, `len` long.
// along 'x': bays side by side along X, cars nose along Z. along 'z': the reverse.
function bayRow({ x, z, n, along = 'x', bay = 2.5, len = 4.6, seed = 1, fill = 0.7 }) {
  const r = rng(seed);
  const g = new THREE.Group();
  const lineM = mat(PALETTE.roadLine);
  const span = n * bay;
  for (let i = 0; i <= n; i++) {
    const o = -span / 2 + i * bay;
    g.add(along === 'x'
      ? place(box(0.12, 0.02, len, lineM), { x: o })
      : place(box(len, 0.02, 0.12, lineM), { z: o }));
    if (i < n && r.chance(fill)) {
      const c = car({ color: r.pick(SWATCHES.cars), kind: r.chance(0.15) ? 'van' : 'car' });
      const m = o + bay / 2;
      const flip = r.chance(0.5) ? 180 : 0;
      g.add(place(c, along === 'x' ? { x: m, ry: 90 + flip, s: 0.92 } : { z: m, ry: flip, s: 0.92 }));
    }
  }
  return place(g, { x, y: y0 + 0.01, z });
}

// Anchor department store: plain big box, coloured cornice, glazed entrance and big signs.
function anchor({ name, wall, accent, fg = '#ffffff', side }) {
  const w = 5.5, d = 10, h = 7.5;
  const g = new THREE.Group();
  g.add(facadeBlock({ w, d, h, floorHeight: h, style: 'plain', wall, roof: PALETTE.concreteDark }));
  // horizontal bands: plinth + cornice in the brand colour
  g.add(place(box(w + 0.12, 0.6, d + 0.12, mat(PALETTE.stoneDark)), {}));
  g.add(place(parapet({ w: w + 0.2, d: d + 0.2, h: 1.6, t: 0.25, material: mat(accent) }), { y: h - 1.1 }));
  // corner pilasters
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.5, h - 1.1, 0.5, mat(PALETTE.offWhite)), { x: sx * (w / 2 - 0.2), z: sz * (d / 2 - 0.2) }));
  }
  // front entrance: glazed shopfront with canopy
  const frame = metal(PALETTE.steelLight);
  g.add(place(box(4.2, 2.8, 0.12, glass(PALETTE.glassDark)), { y: 0.6, z: d / 2 }));
  for (let i = 0; i <= 4; i++) g.add(place(box(0.1, 2.8, 0.18, frame), { x: -2.1 + i * 1.05, y: 0.6, z: d / 2 }));
  g.add(place(box(1.4, 2.2, 0.16, emissive(PALETTE.windowLit, 0.25)), { y: 0.6, z: d / 2 + 0.02 }));
  g.add(place(box(4.8, 0.3, 1.4, mat(accent)), { y: 3.4, z: d / 2 + 0.7 }));
  g.add(place(sign({ text: name, w: 4.6, h: 1.3, bg: accent, fg }), { y: 4.4, z: d / 2 + 0.1 }));
  // name on the car-park side too
  const sx = side === 'west' ? -1 : 1;
  g.add(place(sign({ text: name, w: 6, h: 1.4, bg: accent, fg }), { x: sx * (w / 2 + 0.1), y: 4.3, z: -0.5, ry: sx * 90 }));
  // side door + high strip windows on the side wall
  g.add(place(box(0.12, 2.4, 1.6, glass(PALETTE.glassDark)), { x: sx * (w / 2), y: 0.6, z: 2.5 }));
  g.add(place(box(0.8, 0.2, 2.2, mat(accent)), { x: sx * (w / 2 + 0.4), y: 3.0, z: 2.5 }));
  for (const z of [-3.6, -1.2]) g.add(place(box(0.1, 0.9, 1.8, glass(PALETTE.glassBlue)), { x: sx * (w / 2), y: 2.6, z }));
  // loading dock at the back
  g.add(place(box(2.6, 3, 0.15, surface('corrugated', PALETTE.steelDark, { size: 1 })), { x: -sx * 0.8, z: -d / 2 }));
  g.add(place(box(3.2, 0.25, 1.2, mat(PALETTE.darkGrey)), { x: -sx * 0.8, y: 3.2, z: -d / 2 - 0.6 }));
  g.add(place(box(3, 1, 0.6, mat(PALETTE.black)), { x: -sx * 0.8, z: -d / 2 - 0.3 }));
  // roof: plant + vents
  g.add(place(rooftopUnits({ w: w - 1, d: d - 1.5, count: 3, seed: side === 'west' ? 4 : 17 }), { y: h }));
  g.add(place(hvac(), { x: sx * 0.6, y: h, z: -2.8 }));
  return g;
}

// Big roof-top air handler with two fans.
function hvac() {
  const g = new THREE.Group();
  g.add(box(2.2, 1.2, 1.4, mat(PALETTE.lightGrey)));
  for (const x of [-0.5, 0.5]) {
    g.add(place(cylinder(0.42, 0.42, 0.12, mat(PALETTE.darkGrey), 10), { x, y: 1.2 }));
  }
  g.add(place(box(0.3, 0.3, 1.6, mat(PALETTE.steel)), { x: -1.2, y: 0.4 }));
  return g;
}

// Pylon sign at the car park entrance.
function pylon() {
  const g = new THREE.Group();
  const post = mat(PALETTE.stoneDark);
  g.add(place(box(0.35, 8, 0.35, post), { x: -1.25 }));
  g.add(place(box(0.35, 8, 0.35, post), { x: 1.25 }));
  g.add(place(box(2.9, 0.6, 0.8, mat(PALETTE.stone)), {}));
  g.add(place(sign({ text: 'TINY MALL', w: 2.9, h: 1.5, bg: PALETTE.navy, fg: PALETTE.yellow, double: true, depth: 0.55 }), { y: 6.4 }));
  g.add(place(sign({ text: 'MEGA MART', w: 2.1, h: 0.7, bg: PALETTE.red, double: true, depth: 0.3 }), { y: 5.4 }));
  g.add(place(sign({ text: 'BLOOMS', w: 2.1, h: 0.7, bg: PALETTE.green, double: true, depth: 0.3 }), { y: 4.5 }));
  g.add(place(sign({ text: 'CINEMA', w: 2.1, h: 0.7, bg: PALETTE.purple, double: true, depth: 0.3 }), { y: 3.6 }));
  g.add(place(box(3.1, 0.3, 0.75, mat(PALETTE.navy)), { y: 8 }));
  return g;
}

// Trolley corral: low railing pen with a few nested trolleys.
function trolleyBay() {
  const g = new THREE.Group();
  const rail = metal(PALETTE.steelLight);
  g.add(place(box(3.2, 0.9, 0.06, rail), { z: 0.5 }));
  g.add(place(box(3.2, 0.9, 0.06, rail), { z: -0.5 }));
  g.add(place(box(0.06, 0.9, 1.0, rail), { x: -1.6 }));
  g.add(place(box(1.8, 0.55, 0.45, mat(PALETTE.red, { roughness: 0.5 })), { x: -0.3, y: 0.25 }));
  g.add(place(sign({ text: 'TROLLEYS', w: 1.4, h: 0.4, bg: PALETTE.red, double: true, depth: 0.05 }), { x: -0.9, y: 1.1 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 2], 'asphalt'));

  // ---- the mall -----------------------------------------------------------
  const cz = -3; // building centre (z -8 .. 2)
  g.add(place(anchor({ name: 'MEGA MART', wall: PALETTE.cream, accent: PALETTE.red, side: 'west' }), { x: -7.25, y: y0, z: cz }));
  g.add(place(anchor({ name: 'BLOOMS', wall: PALETTE.white, accent: PALETTE.green, side: 'east' }), { x: 7.25, y: y0, z: cz }));

  // central gallery: two levels of shops, set back a little from the anchors
  const gw = 9, gd = 8.8, gh = 5, gz = cz;
  g.add(place(facadeBlock({ w: gw, d: gd, h: gh, floorHeight: 2.5, style: 'shop', wall: PALETTE.beige, glass: PALETTE.glassBlue, frame: PALETTE.frame, bay: 2.6, seed: 8, roof: PALETTE.concrete }), { y: y0, z: gz }));
  g.add(place(box(gw + 0.1, 0.5, gd + 0.1, mat(PALETTE.sandstone)), { y: y0 + gh - 0.1, z: gz }));
  g.add(place(parapet({ w: gw, d: gd, h: 0.5, t: 0.2, material: mat(PALETTE.sandstone) }), { y: y0 + gh + 0.4, z: gz }));

  // crossed glass barrel vaults over the atrium
  const vy = y0 + gh + 0.4;
  const span = 5.6, vh = 3;
  const glassM = glass(PALETTE.glassSky);
  const ribM = metal(PALETTE.white, { roughness: 0.3 });
  g.add(place(box(span + 0.3, 0.3, gd + 0.3, mat(PALETTE.offWhite)), { y: vy - 0.3, z: gz }));
  g.add(place(barrelRoof({ w: span, d: gd + 0.3, h: vh, axis: 'z', material: glassM, endMaterial: glassM }), { y: vy, z: gz }));
  g.add(place(barrelRoof({ w: gw, d: span, h: vh * 0.85, axis: 'x', material: glassM, endMaterial: glassM }), { y: vy, z: gz - 0.8 }));
  for (let i = 0; i <= 6; i++) {
    g.add(place(rib(span / 2, vh, 0.07, ribM), { y: vy, z: gz - (gd + 0.3) / 2 + i * ((gd + 0.3) / 6) }));
  }
  for (const x of [-3.9, -2.4, 2.4, 3.9]) {
    g.add(place(rib(span / 2, vh * 0.85, 0.07, ribM), { x, y: vy, z: gz - 0.8, ry: 90 }));
  }
  // ridge beams + lantern at the crossing
  g.add(place(box(0.14, 0.14, gd + 0.3, ribM), { y: vy + vh, z: gz }));
  g.add(place(cylinder(0.8, 0.8, 0.5, ribM, 8), { y: vy + vh - 0.1, z: gz - 0.8 }));
  g.add(place(cone(0.95, 0.9, glassM, 8), { y: vy + vh + 0.4, z: gz - 0.8 }));
  g.add(place(cylinder(0.04, 0.08, 1.2, ribM, 6), { y: vy + vh + 1.2, z: gz - 0.8 }));
  g.add(place(sphere(0.15, mat(PALETTE.yellow, { metalness: 0.5, roughness: 0.3 }), 8), { y: vy + vh + 2.4, z: gz - 0.8 }));
  // small vents on the flat roof corners
  for (const sx of [-1, 1]) for (const z of [gz - 3.6, gz + 2.8]) {
    g.add(place(box(0.9, 0.6, 1, mat(PALETTE.lightGrey)), { x: sx * 3.75, y: vy, z }));
  }

  // main entrance: glazed portal, canopy on columns, mall sign
  const fz = gz + gd / 2;
  g.add(place(box(4.6, 3.6, 0.2, glass(PALETTE.glassDark)), { y: y0, z: fz + 0.05 }));
  for (let i = 0; i <= 4; i++) g.add(place(box(0.12, 3.6, 0.3, metal(PALETTE.steelLight)), { x: -2.3 + i * 1.15, y: y0, z: fz + 0.05 }));
  g.add(place(box(2.2, 2.4, 0.26, emissive(PALETTE.windowLit, 0.3)), { y: y0, z: fz + 0.06 }));
  g.add(place(box(6, 0.35, 2.4, mat(PALETTE.navy)), { y: y0 + 3.6, z: fz + 1.2 }));
  g.add(place(columns({ count: 2, length: 5.4, radius: 0.15, h: 3.6, material: metal(PALETTE.steelLight) }), { y: y0, z: fz + 2.2 }));
  g.add(place(sign({ text: 'TINY MALL', w: 5.6, h: 1, bg: PALETTE.navy, fg: PALETTE.yellow }), { y: y0 + 3.95, z: fz + 2.4 - 0.12 }));

  g.add(place(box(1.6, 2.3, 0.12, mat(PALETTE.steelDark)), { x: 2.2, y: y0, z: gz - gd / 2 }));
  g.add(place(box(2.2, 0.15, 0.9, mat(PALETTE.sandstone)), { x: 2.2, y: y0 + 2.5, z: gz - gd / 2 - 0.45 }));

  // ---- pavements & landscaping -------------------------------------------
  g.add(place(patch(20.4, 3.6, 'paved'), { y: y0, z: 3.6 - 1.4 }));
  g.add(place(patch(20.4, 1.6, 'concrete'), { y: y0, z: -9 }));
  // zebra crossing from the entrance over the aisle
  for (let i = 0; i < 4; i++) g.add(place(box(3, 0.03, 0.35, mat(PALETTE.white)), { y: y0, z: 4.3 + i * 0.6 }));
  // planters + benches along the front walk
  for (const x of [-9.4, -4.5, 4.5, 9.4]) {
    g.add(place(box(1.1, 0.45, 1.1, mat(PALETTE.stoneDark)), { x, y: y0, z: 3 }));
    g.add(place(tree({ kind: 'bush', h: 1.2, seed: 30 + x }), { x, y: y0 + 0.45, z: 3 }));
  }
  g.add(place(bench({ w: 1.5 }), { x: -6.2, y: y0, z: 3.1 }));
  g.add(place(bench({ w: 1.5 }), { x: 6.2, y: y0, z: 3.1 }));

  // ---- car park ------------------------------------------------------------
  // front rows either side of a landscaped island
  g.add(bayRow({ x: -7.5, z: 7.6, n: 4, seed: 3, fill: 0.8 }));
  g.add(bayRow({ x: 7.5, z: 7.6, n: 4, seed: 5, fill: 0.7 }));
  // side rows along each anchor
  g.add(bayRow({ x: -12.6, z: -3, n: 4, along: 'z', seed: 7, fill: 0.6 }));
  g.add(bayRow({ x: 12.6, z: -3, n: 4, along: 'z', seed: 9, fill: 0.75 }));
  // aisle centre line + arrows
  for (let x = -14; x < 14; x += 2.2) g.add(place(box(1.1, 0.02, 0.12, mat(PALETTE.roadLine)), { x: x + 0.55, y: y0 + 0.01, z: 4.1 }));

  // centre island with trees and a lamp
  g.add(place(box(4.6, 0.2, 4.4, mat(PALETTE.concrete)), { y: y0, z: 7.6 }));
  g.add(place(patch(4.2, 4, 'grass'), { y: y0 + 0.2, z: 7.6 }));
  for (const [x, z, s] of [[-1.4, 6.4, 1], [1.4, 6.4, 2], [0, 8.6, 3], [-1.5, 9, 4], [1.5, 9, 5]]) {
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 60 + s }), { x, y: y0 + 0.2, z }));
  }
  g.add(place(patch(1.6, 1.2, mat(PALETTE.red)), { y: y0 + 0.2, z: 7.3 }));
  g.add(place(patch(1.6, 0.4, mat(PALETTE.yellow)), { y: y0 + 0.2, z: 6.5 }));
  g.add(place(streetLamp({ h: 5 }), { x: -2, y: y0 + 0.2, z: 9.5 }));
  // corner islands: pylon sign (west), trolley bay + tree (east)
  for (const sx of [-1, 1]) {
    g.add(place(box(2.6, 0.2, 4.4, mat(PALETTE.concrete)), { x: sx * 13.7, y: y0, z: 7.6 }));
    g.add(place(patch(2.3, 4.1, 'grass'), { x: sx * 13.7, y: y0 + 0.2, z: 7.6 }));
  }
  g.add(place(pylon(), { x: -13.7, y: y0 + 0.2, z: 7.6, ry: 0 }));
  g.add(place(tree({ kind: 'round', h: 4.4, seed: 44 }), { x: 13.6, y: y0 + 0.2, z: 8.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 45 }), { x: 13.7, y: y0 + 0.2, z: 6.3 }));
  g.add(place(trolleyBay(), { x: 12, y: y0, z: 3.2 }));
  // lamps along the side car parks
  for (const sx of [-1, 1]) {
    g.add(place(streetLamp({ h: 5 }), { x: sx * 14.8, y: y0, z: 2.8, ry: sx > 0 ? 180 : 0 }));
    g.add(place(patch(4.6, 1.8, 'grass'), { x: sx * 12.6, y: y0, z: -9 }));
    g.add(place(tree({ kind: 'cone', h: 4.2, seed: 50 + sx }), { x: sx * 13.8, y: y0, z: -9 }));
    g.add(place(tree({ kind: 'bush', h: 1, seed: 53 + sx }), { x: sx * 11.6, y: y0, z: -9.1 }));
  }

  // ---- service yard at the back --------------------------------------------
  for (const x of [-2.4, -1.2]) g.add(place(box(1, 1.1, 0.8, mat(PALETTE.green, { roughness: 0.6 })), { x, y: y0, z: -9.1 }));
  g.add(place(box(1.6, 1.3, 1, mat(PALETTE.blue, { roughness: 0.6 })), { x: 1.6, y: y0, z: -9.1 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 8.6, y: y0, z: -9.2, s: 0.85 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, box, cylinder, place, group, parapet, rooftopUnits, antenna,
  signTexture, textured, door, tree, hedge, streetLamp, bench, car, surface, mat, metal, glass, emissive, shade, pipe,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Eight storeys: a glazed ground-floor lobby plus seven pastel residential floors,
// each wrapped on the street side by a continuous balcony band.

const PASTEL = shade(PALETTE.peach, 0.3);      // main slab walls
const BALUSTRADE = shade(PALETTE.pink, 0.12);  // solid balcony fronts: the pastel stripes
const ACCENT = shade(PALETTE.pink, 0.02);      // end walls, stair core
const BAND = PALETTE.white;                    // balcony slabs, fins, parapets

// rail bars on a balcony band: posts + top rail along X, sticking out to +z
function railing(w, h, m) {
  const g = group(place(box(w, 0.08, 0.1, m), { y: h - 0.08 }));
  const n = Math.round(w / 0.9);
  for (let i = 0; i <= n; i++) g.add(place(box(0.06, h, 0.06, m), { x: -w / 2 + (w * i) / n }));
  return g;
}

// sign board with text on a 0..1-UV plane (the lib sign() box has metre UVs, which squash the text)
function nameBoard(text, w, h, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w) });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, 0.061);
  return group(box(w, h, 0.06, mat(bg)), face);
}

// small round satellite dish facing +z
function dish(m) {
  const g = group(place(box(0.08, 0.6, 0.08, m), {}));
  g.add(place(cylinder(0.45, 0.1, 0.18, m, 10), { y: 0.75, rx: 70 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // slab geometry
  const W = 16, D = 6.4, cz = -1.0;
  const front = cz + D / 2, back = cz - D / 2;
  const gh = 3.4;                       // ground floor (lobby) height
  const upper = 7;                      // residential floors above the lobby
  const top = y0 + gh + upper * FLOOR;  // roof level
  const bandD = 1.3;                    // balcony depth

  const bandM = mat(BAND);
  const accentM = mat(ACCENT);
  const balM = mat(BALUSTRADE);
  const railM = metal(PALETTE.steelLight);

  // ---- ground floor: white plinth with dark glazing
  g.add(place(facadeBlock({
    w: W, d: D, floors: 1, floorHeight: gh, style: 'grid', wall: PALETTE.offWhite,
    glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 2.6, lit: 0.35, seed: 3, roof: PALETTE.concrete,
  }), { y: y0, z: cz }));

  // ---- residential floors
  g.add(place(facadeBlock({
    w: W, d: D, floors: upper, style: 'punched', wall: PASTEL, glass: PALETTE.window, frame: PALETTE.white,
    windowW: 0.62, windowH: 0.72, bay: 2, lit: 0.14, seed: 17, roof: PALETTE.concreteDark,
    blank: ['left', 'right'],
  }), { y: y0 + gh, z: cz }));

  // end walls: accent panels with a slim vertical window strip
  for (const s of [-1, 1]) {
    g.add(place(box(0.2, upper * FLOOR, D - 1.2, accentM), { x: s * (W / 2 + 0.1), y: y0 + gh, z: cz }));
    for (let f = 0; f < upper; f++) {
      g.add(place(box(0.1, 1.4, 0.8, mat(PALETTE.window, { roughness: 0.3, metalness: 0.3 })), { x: s * (W / 2 + 0.22), y: y0 + gh + f * FLOOR + 0.9, z: cz - 1.2 }));
    }
  }

  // ---- continuous balcony bands on the street side (one per residential floor + roof cornice)
  const bandW = W + 0.4;
  for (let f = 0; f <= upper; f++) {
    const yF = y0 + gh + f * FLOOR;
    const isRoof = f === upper;
    g.add(place(box(bandW, 0.24, isRoof ? 0.6 : bandD, bandM), { y: yF - 0.24, z: front + (isRoof ? 0.3 : bandD / 2) }));
    if (isRoof) break;
    // solid lower balustrade + steel rail above it
    g.add(place(box(bandW, 0.75, 0.1, balM), { y: yF, z: front + bandD - 0.05 }));
    g.add(place(railing(bandW, 0.35, railM), { y: yF + 0.75, z: front + bandD - 0.05 }));
  }
  // balcony fins between the flats (full height), framing the bands
  for (const x of [-W / 2 - 0.1, -W / 4, 0, W / 4, W / 2 + 0.1]) {
    g.add(place(box(0.24, upper * FLOOR, bandD + 0.05, bandM), { x, y: y0 + gh - 0.24, z: front + bandD / 2 }));
  }

  // ---- back: French balconies + stair/lift core with a vertical glass strip
  for (let f = 0; f < upper; f++) {
    const yF = y0 + gh + f * FLOOR;
    for (const x of [-6, -3, 3, 6]) {
      g.add(place(box(1.6, 0.12, 0.45, bandM), { x, y: yF, z: back - 0.22 }));
      g.add(place(railing(1.6, 0.9, railM), { x, y: yF + 0.12, z: back - 0.42 }));
    }
  }
  const coreH = gh + upper * FLOOR;
  g.add(place(facadeBlock({
    w: 3, d: 1.4, h: coreH, floorHeight: coreH / 8, style: 'curtain', wall: ACCENT, glass: PALETTE.glassSky,
    frame: PALETTE.white, bay: 3, lit: 0.2, seed: 5, roof: PALETTE.concreteDark,
  }), { y: y0, z: back - 0.1 }));
  // lift overrun / stair hut on the roof
  g.add(place(box(3, 2.6, 3.2, accentM), { y: top, z: back + 0.8 }));
  g.add(place(box(3.3, 0.25, 3.5, bandM), { y: top + 2.6, z: back + 0.8 }));
  g.add(place(door({ w: 0.9, h: 2, color: PALETTE.steelDark }), { x: 1.5, y: top, z: back + 1.2, ry: 90 }));
  // rear service door
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.steelDark }), { x: -3, y: y0, z: back, ry: 180 }));

  // ---- lobby: glass box projecting under the first balcony band
  const lobW = 5.2, lobD = bandD - 0.1;
  g.add(place(box(lobW, gh - 0.3, lobD, glass(PALETTE.glassSky, { opacity: 0.75 })), { y: y0, z: front + lobD / 2 }));
  for (const x of [-lobW / 2, -lobW / 6, lobW / 6, lobW / 2]) {
    g.add(place(box(0.12, gh - 0.3, 0.12, railM), { x, y: y0, z: front + lobD }));
  }
  g.add(place(box(lobW + 0.1, 0.18, lobD + 0.1, railM), { y: y0 + gh - 0.48, z: front + lobD / 2 }));
  g.add(place(door({ w: 1.6, h: 2.4, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { y: y0, z: front + lobD }));
  g.add(place(nameBoard('PASTEL COURT', 5.6, 1.05, PALETTE.navy, '#ffffff'), { y: y0 + gh + 0.02, z: front + bandD + 0.03 }));
  g.add(place(box(1.4, 0.4, 0.06, emissive(PALETTE.windowLit, 0.6)), { x: 0, y: y0 + 2.55, z: front + lobD + 0.02 }));

  // ---- roof: parapet + plant
  g.add(place(parapet({ w: W, d: D, h: 0.8, t: 0.25, material: bandM }), { y: top, z: cz }));
  // plant room with louvres
  const prW = 5, prD = 3.4, prH = 2.4;
  const louvre = surface('corrugated', PALETTE.steelLight, { size: 1.2 });
  g.add(place(box(prW, prH, prD, [louvre, louvre, mat(PALETTE.concreteDark), louvre, louvre, louvre]), { x: -4.4, y: top, z: cz - 0.4 }));
  g.add(place(box(prW + 0.3, 0.2, prD + 0.3, mat(PALETTE.steelDark)), { x: -4.4, y: top + prH, z: cz - 0.4 }));
  // cooling fans on the plant room
  for (const x of [-5.6, -3.2]) {
    g.add(place(cylinder(0.65, 0.65, 0.35, metal(PALETTE.steel), 12), { x, y: top + prH + 0.2, z: cz - 0.4 }));
    g.add(place(cylinder(0.5, 0.5, 0.05, mat(PALETTE.darkGrey), 12), { x, y: top + prH + 0.55, z: cz - 0.4 }));
  }
  // water tank on legs
  const tx = 4.6, tz = cz - 0.6;
  for (const [dx, dz] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) {
    g.add(place(box(0.15, 1.2, 0.15, metal(PALETTE.steelDark)), { x: tx + dx, y: top, z: tz + dz }));
  }
  g.add(place(cylinder(1.3, 1.3, 2.0, metal(PALETTE.aluminium, { roughness: 0.4 }), 16), { x: tx, y: top + 1.2, z: tz }));
  g.add(place(cylinder(0.2, 1.35, 0.5, metal(PALETTE.steel), 16), { x: tx, y: top + 3.2, z: tz }));
  // pipes from plant room to tank and down into the roof
  g.add(pipe([-1.9, top + 0.6, cz - 0.4], [tx - 1.3, top + 0.6, cz - 0.4], 0.12, metal(PALETTE.rust)));
  g.add(pipe([tx - 1.3, top + 0.6, cz - 0.4], [tx - 1.3, top + 1.6, cz - 0.4], 0.12, metal(PALETTE.rust)));
  // AC units, vents, dishes, antenna
  g.add(place(rooftopUnits({ w: 3.4, d: 2.4, count: 3, seed: 41 }), { x: 2, y: top, z: cz + 1.0 }));
  g.add(place(dish(mat(PALETTE.white)), { x: 6.8, y: top, z: front - 0.8 }));
  g.add(place(dish(mat(PALETTE.white)), { x: -7.1, y: top, z: front - 0.8, ry: -30 }));
  g.add(place(antenna({ h: 5 }), { x: -6.6, y: top + prH + 0.2, z: cz - 1.4 }));

  // ---- grounds
  // street-side pavement and lobby path
  g.add(place(patch(TILE * 2, 5 - front - 0.2, 'paved'), { y: y0, z: (front + 0.2 + 5) / 2 }));
  // side paths
  g.add(place(patch(1.6, D, 'paved'), { x: -9.1, y: y0, z: cz }));
  // planters under the balconies with bushes
  for (const x of [-6, 6]) {
    g.add(place(box(3.6, 0.5, 0.9, mat(PALETTE.stoneDark)), { x, y: y0, z: front + 0.5 }));
    for (const dx of [-1.1, 0, 1.1]) g.add(place(tree({ kind: 'bush', h: 0.9, seed: x + dx * 7 + 50 }), { x: x + dx, y: y0 + 0.5, z: front + 0.5 }));
  }
  // lamps, benches, bike rack, bins
  for (const x of [-4, 4]) g.add(place(streetLamp({ h: 4.2 }), { x, y: y0, z: 4.4, ry: 90 }));
  g.add(place(bench({ w: 1.6 }), { x: -6.5, y: y0, z: 4.3, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 6.5, y: y0, z: 4.3, ry: 180 }));
  const bikeM = metal(PALETTE.steelLight);
  for (let i = 0; i < 4; i++) {
    g.add(place(box(0.05, 0.7, 1.4, bikeM), { x: -9.5 + i * 0.4 + 0.1, y: y0, z: 3.4 }));
  }
  g.add(place(box(0.9, 1.2, 0.8, mat(PALETTE.green)), { x: 9.1, y: y0, z: 3.2 }));
  g.add(place(box(0.9, 1.2, 0.8, mat(PALETTE.blue)), { x: 9.1, y: y0, z: 2.2 }));
  // parked car at the kerb-side drop-off
  g.add(place(car({ color: PALETTE.yellow, kind: 'taxi' }), { x: 1.8, y: y0 + 0.05, z: 4.3, ry: 0, s: 0.75 }));
  // garden behind/beside the slab
  g.add(place(hedge({ w: TILE * 2 - 0.4, h: 1.0, d: 0.5 }), { y: y0, z: -TILE / 2 + 0.25 }));
  g.add(place(tree({ kind: 'round', h: 6, seed: 12 }), { x: -8.3, y: y0, z: -3.2 }));
  g.add(place(tree({ kind: 'cone', h: 6.5, seed: 13 }), { x: 8.2, y: y0, z: -3.4 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 14 }), { x: 8.4, y: y0, z: -0.6 }));
  return g;
}

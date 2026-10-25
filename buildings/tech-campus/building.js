import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, cone, place, group, mat, metal, glass, emissive, water, surface,
  solarPanel, signTexture, textured, tree, bench, streetLamp, flag, car, hedge,
} from '../../src/lib/index.js';

// 3x2 tiles (30 x 20 m). Front (street) faces +z.
// Three low glass pavilions in a U around a green courtyard, joined by glazed
// sky-bridges at first-floor level, every roof covered in solar panels.

const FH = 3.5; // storey height of the pavilions
const WHITE = PALETTE.white;

const curtain = {
  style: 'curtain', glass: PALETTE.glassTeal, frame: WHITE, wall: WHITE,
  lit: 0.08, bay: 2.2, floorHeight: FH, roof: PALETTE.concrete,
};

// Rows of tilted panels (facing +z) filling a w x d roof.
function solarArray(w, d, { pw = 2.2, pd = 1.5, pitch = 1.75 } = {}) {
  const g = new THREE.Group();
  const cols = Math.max(1, Math.floor(w / (pw + 0.25)));
  const rows = Math.max(1, Math.floor(d / pitch));
  for (let r = 0; r < rows; r++) {
    const z = -d / 2 + pitch * (r + 0.5);
    for (let c = 0; c < cols; c++) {
      const x = -((cols - 1) * (pw + 0.25)) / 2 + c * (pw + 0.25);
      g.add(place(solarPanel({ w: pw, d: pd, tilt: 15, height: 0.3 }), { x, z }));
    }
  }
  return g;
}

// A glass pavilion: curtain-wall storeys with white slab edges, an overhanging
// roof slab and a solar array on top. Returns the group and its roof height.
function pavilion({ w, d, floors, seed, glassColor = PALETTE.glassTeal, solar = true }) {
  const g = new THREE.Group();
  const slab = mat(WHITE);
  g.add(facadeBlock({ w, d, floors, ...curtain, glass: glassColor, seed }));
  for (let f = 1; f < floors; f++) g.add(place(box(w + 0.3, 0.32, d + 0.3, slab), { y: f * FH - 0.16 }));
  const top = floors * FH;
  g.add(place(box(w + 1.0, 0.45, d + 1.0, slab), { y: top }));
  g.add(place(box(w + 1.0, 0.05, d + 1.0, mat(PALETTE.concreteDark)), { y: top + 0.45 }));
  if (solar) g.add(place(solarArray(w - 0.4, d - 0.6), { y: top + 0.5 }));
  g.userData.top = top + 0.5;
  return g;
}

// Glazed bridge tube of length `len` along X, deck at y = 0.
function bridge(len, { d = 2.4, h = 2.9, axis = 'x' } = {}) {
  const g = new THREE.Group();
  const slab = mat(WHITE);
  const pane = glass(PALETTE.glassSky);
  g.add(box(len, 0.35, d, slab));
  g.add(place(box(len, h - 0.6, d - 0.3, pane), { y: 0.35 }));
  g.add(place(box(len, 0.35, d, slab), { y: h - 0.25 }));
  const n = Math.max(2, Math.round(len / 1.6));
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    for (const s of [-1, 1]) g.add(place(box(0.1, h - 0.6, 0.08, slab), { x, y: 0.35, z: s * (d / 2 - 0.15) }));
  }
  if (axis === 'z') g.rotation.y = Math.PI / 2;
  return g;
}

// Sign board with text on +z. Local stand-in for the lib sign(): its box has
// UVs in metres, which shrinks the (non-repeating) text into one corner.
function sign({ text, w, h, bg, fg, depth = 0.2 }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round(256 * h / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Café table with a parasol.
function parasolTable(color) {
  return group(
    cylinder(0.45, 0.45, 0.06, mat(WHITE), 10).translateY(0.72),
    cylinder(0.05, 0.05, 0.75, metal(PALETTE.steelDark), 6),
    cylinder(0.04, 0.04, 2.3, metal(PALETTE.steelLight), 6),
    place(cone(1.25, 0.55, mat(color), 8), { y: 2.0 }),
    ...[[-0.7, 0], [0.7, 0], [0, -0.7], [0, 0.7]].map(([x, z]) => place(box(0.35, 0.45, 0.35, mat(PALETTE.orange)), { x, z }))
  );
}

// Simple bicycle, length along X.
function bike(color) {
  const tyre = mat(PALETTE.black);
  const wheel = () => {
    const geo = new THREE.TorusGeometry(0.32, 0.05, 4, 12);
    return new THREE.Mesh(geo, tyre);
  };
  const frameM = mat(color);
  return group(
    place(wheel(), { x: -0.52, y: 0.37 }),
    place(wheel(), { x: 0.52, y: 0.37 }),
    place(box(1.05, 0.07, 0.07, frameM), { y: 0.68 }),
    place(box(0.07, 0.4, 0.07, frameM), { x: -0.25, y: 0.4 }),
    place(box(0.3, 0.06, 0.12, mat(PALETTE.black)), { x: -0.28, y: 0.85 }),
    place(box(0.07, 0.07, 0.5, mat(PALETTE.darkGrey)), { x: 0.48, y: 0.9 })
  );
}

// EV charging post.
function charger() {
  return group(
    box(0.4, 1.3, 0.3, mat(WHITE)),
    place(box(0.42, 0.3, 0.32, emissive(PALETTE.green, 0.6)), { y: 0.9 })
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 2], 'grass'));

  // --- ground: front plaza, courtyard paths -------------------------------
  g.add(place(patch(15, 6, 'paved'), { y: y0, z: 7 }));          // entrance plaza
  g.add(place(patch(2.4, 8, 'paved'), { y: y0, z: 0 }));         // central path
  g.add(place(patch(15, 1.6, 'paved'), { y: y0, z: -3.2 }));     // path along N pavilion
  g.add(place(patch(7, 4.8, 'asphalt'), { x: -11, y: y0, z: 7.4 }));  // carport bays
  g.add(place(patch(7, 4.8, 'paved'), { x: 11, y: y0, z: 7.4 }));     // bike yard

  // --- pavilions -----------------------------------------------------------
  const west = pavilion({ w: 7, d: 13, floors: 2, seed: 3 });
  g.add(place(west, { x: -11, y: y0, z: -2.5 }));
  const east = pavilion({ w: 7, d: 13, floors: 2, seed: 4, glassColor: PALETTE.glassBlue });
  g.add(place(east, { x: 11, y: y0, z: -2.5 }));
  const north = pavilion({ w: 9, d: 5, floors: 3, seed: 5, glassColor: PALETTE.glassBlue });
  g.add(place(north, { x: 0, y: y0, z: -6.8 }));


  // entrance doors (dark glass + canopy) on the courtyard-facing walls
  for (const [x, ry] of [[-7.5, 90], [7.5, -90]]) {
    g.add(place(box(2.4, 2.5, 0.12, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { x: x + Math.sign(-x) * 0.05, y: y0, z: -1.5, ry }));
    g.add(place(box(3.2, 0.2, 1.4, mat(WHITE)), { x: x - Math.sign(x) * 0.7, y: y0 + 2.8, z: -1.5, ry }));
  }

  // --- bridges at first-floor level -----------------------------------------
  const by = y0 + FH;
  g.add(place(bridge(3.2), { x: -6, y: by, z: -6.8 }));
  g.add(place(bridge(3.2), { x: 6, y: by, z: -6.8 }));
  // long front sky-bridge closing the courtyard, on slim pilotis
  g.add(place(bridge(15.2, { d: 2.6 }), { y: by, z: 3.0 }));
  for (const x of [-3.2, 3.2]) for (const z of [2.0, 4.0]) {
    g.add(place(cylinder(0.14, 0.14, FH, mat(WHITE), 8), { x, y: y0, z }));
  }
  // green roof on the bridge + rooftop lettering facing the street
  g.add(place(box(14.6, 0.12, 2.2, surface('grass', PALETTE.grassLight, { size: 3 })), { y: by + 2.95, z: 3.0 }));
  g.add(place(sign({ text: 'TINY TECH', w: 6, h: 1.1, bg: PALETTE.navy, fg: '#ffffff' }), { y: by + 2.95, z: 3.9 }));
  for (const x of [-2.4, 2.4]) g.add(place(box(0.12, 0.6, 0.6, metal(PALETTE.steelDark)), { x, y: by + 2.95, z: 3.65 }));

  // --- courtyard --------------------------------------------------------------
  // pond with stepping deck
  g.add(place(cylinder(2.4, 2.4, 0.2, mat(PALETTE.stone), 20), { x: -3.4, y: y0, z: -0.4 }));
  g.add(place(cylinder(2.1, 2.1, 0.22, water(PALETTE.water), 20), { x: -3.4, y: y0, z: -0.4 }));
  g.add(place(box(2.6, 0.3, 1.2, surface('planks', PALETTE.woodLight, { size: 1 })), { x: 3.8, y: y0, z: 0.6 }));
  // café tables on the deck side
  g.add(place(parasolTable(PALETTE.red), { x: 3.6, y: y0, z: -1.2 }));
  g.add(place(parasolTable(PALETTE.yellow), { x: 4.8, y: y0, z: 1.4 }));
  g.add(place(bench({ w: 1.8 }), { x: -3.4, y: y0, z: 2.0 }));
  g.add(place(bench({ w: 1.8 }), { x: 0, y: y0, z: -4.7 }));
  for (const [x, z, k, h, s] of [[-5.8, -2.9, 'round', 4.6, 11], [5.9, -3.2, 'round', 4.2, 12], [-1.6, 1.8, 'bush', 1.2, 13], [1.7, -1.5, 'bush', 1.1, 14], [6.2, 1.8, 'bush', 1.0, 15], [-6.3, 1.4, 'cone', 3.6, 16]]) {
    g.add(place(tree({ kind: k, h, seed: s }), { x, y: y0, z }));
  }

  // --- front: solar carport with EVs (west) -----------------------------------
  const cpY = 2.6;
  for (const x of [-14.2, -7.8]) g.add(place(box(0.2, cpY, 0.2, metal(PALETTE.steelLight)), { x, y: y0, z: 5.8 }));
  g.add(place(box(7.2, 0.18, 4.6, mat(WHITE)), { x: -11, y: y0 + cpY, z: 7.3 }));
  g.add(place(box(7.0, 0.06, 4.4, MAT_SOLAR()), { x: -11, y: y0 + cpY + 0.18, z: 7.3 }));
  const carColors = [PALETTE.red, WHITE, PALETTE.blue];
  for (let i = 0; i < 3; i++) {
    const x = -13.3 + i * 2.3;
    g.add(place(car({ color: carColors[i] }), { x, y: y0 + 0.05, z: 7.5, ry: 90, s: 0.88 }));
    g.add(place(charger(), { x: x + 0.9, y: y0, z: 5.5 }));
  }

  // --- front: bike yard, monument sign, flags (east) --------------------------
  const bikeColors = [PALETTE.orange, PALETTE.green, PALETTE.blue, PALETTE.red, PALETTE.yellow];
  for (let i = 0; i < 5; i++) {
    g.add(place(bike(bikeColors[i]), { x: 8.6 + i * 0.9, y: y0, z: 6.2, ry: 90 }));
  }
  g.add(place(box(5.2, 0.12, 0.12, metal(PALETTE.steelLight)), { x: 10.4, y: y0 + 0.5, z: 6.2 }));
  g.add(place(box(3.4, 0.8, 0.9, mat(PALETTE.stoneDark)), { x: 11.5, y: y0, z: 8.8 }));
  g.add(place(sign({ text: 'TECH CAMPUS', w: 3.2, h: 0.7, bg: WHITE, fg: PALETTE.navy }), { x: 11.5, y: y0 + 0.8, z: 8.8 }));
  for (const [i, c] of [[0, PALETTE.blue], [1, PALETTE.green], [2, PALETTE.orange]]) {
    g.add(place(flag({ h: 6, color: c, color2: WHITE }), { x: 7.6 + i * 1.2, y: y0, z: 9.3 }));
  }

  // plaza: planters with trees, lamps, benches
  for (const x of [-5.5, 5.5]) {
    g.add(place(box(1.8, 0.5, 1.8, mat(PALETTE.stoneDark)), { x, y: y0, z: 7.6 }));
    g.add(place(tree({ kind: 'round', h: 5, seed: 30 + x }), { x, y: y0 + 0.5, z: 7.6 }));
  }
  for (const x of [-2.6, 2.6]) g.add(place(streetLamp({ h: 4.2 }), { x, y: y0, z: 9.3, ry: x > 0 ? 180 : 0 }));
  g.add(place(bench({ w: 1.6 }), { x: -2.6, y: y0, z: 6.6 }));
  g.add(place(bench({ w: 1.6 }), { x: 2.6, y: y0, z: 6.6 }));

  // back: hedge and shrubs along the rear boundary
  g.add(place(hedge({ w: 9, h: 0.9, d: 0.6 }), { y: y0, z: -9.6 }));
  for (const [x, s] of [[-14.4, 40], [14.4, 41]]) g.add(place(tree({ kind: 'bush', h: 1.0, seed: s }), { x, y: y0, z: -9.4 }));
  return g;
}

function MAT_SOLAR() {
  return surface('solar', PALETTE.navy, { size: 1.2, roughness: 0.3, metalness: 0.4 });
}

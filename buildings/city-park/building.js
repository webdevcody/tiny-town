import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, box, cylinder, cone, sphere, place, group, tree, hedge, bench, stairs,
  mat, metal, emissive, water, surface, textured, signTexture,
} from '../../src/lib/index.js';
import { blob, ngon, slab, ring, ribbon, pyramid } from './shapes.js';

// 2x2 tiles (20 x 20 m). Front (street, main gate) faces +z.
// Layout: tiered fountain on a round plaza in the middle, duck pond to the
// north-west, bandstand to the north-east, flower beds and big trees in the
// south, winding gravel paths from four hedge gaps.

const HALF = TILE; // half of the 20 m footprint
const y0 = LOT_HEIGHT;

const gravel = surface('gravel', '#d8c69c', { size: 3 });
const cobbles = surface('cobbles', PALETTE.stone, { size: 2 });
const stone = mat(PALETTE.stone);
const stoneLight = mat('#d6d0c4');
const soil = surface('gravel', PALETTE.mud, { size: 2 });
const parkGreen = mat('#2f5a3a');
const spray = mat('#dff4ff', { transparent: true, opacity: 0.75, roughness: 0.2 });

// plaza / fountain centre
const PX = 0, PZ = 0.8, PR = 3.4;

function person({ shirt, legs = PALETTE.navy, skin = '#e8b88f', hair = PALETTE.woodDark, h = 1.7 }) {
  const s = h / 1.7;
  return group(
    place(box(0.32 * s, 0.8 * s, 0.2 * s, legs), {}),
    place(box(0.42 * s, 0.6 * s, 0.26 * s, shirt), { y: 0.8 * s }),
    place(sphere(0.15 * s, skin, 8), { y: 1.38 * s }),
    place(box(0.3 * s, 0.08 * s, 0.3 * s, hair), { y: 1.62 * s })
  );
}

// Like the lib's sign(), but with 0..1 UVs on the faces so the whole text shows
// on boards that aren't 1 m square.
function sign({ text, w, h, bg, fg, depth = 0.1, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

function parkLamp() {
  const iron = metal(PARK_IRON);
  return group(
    cylinder(0.14, 0.18, 0.35, iron, 6),
    cylinder(0.05, 0.07, 3, iron, 6),
    place(box(0.5, 0.06, 0.06, iron), { y: 2.7 }),
    place(sphere(0.22, emissive('#fff2c4', 0.9), 8), { y: 2.95 }),
    place(cone(0.2, 0.2, iron, 6), { y: 3.35 })
  );
}
const PARK_IRON = '#24412e';

function flowerBed(x, z, r, seed) {
  const g = new THREE.Group();
  const outline = blob(r, 14, [[0.12, 3, seed]]);
  g.add(ring(outline, 0.18, 0.28, stoneLight));
  g.add(slab(outline, 0.24, soil, soil));
  const colors = ['#e23b4a', '#f4d03f', '#f08fc0', '#9b59b6', '#ffffff', '#f39c12'];
  let i = 0;
  for (let rr = r - 0.35; rr > 0.1; rr -= 0.45) {
    const n = Math.max(1, Math.round((rr * Math.PI * 2) / 0.5));
    for (let k = 0; k < n; k++, i++) {
      const t = (k / n) * Math.PI * 2 + rr;
      const c = colors[(i + seed) % colors.length];
      g.add(place(sphere(0.2, mat(c), 5), { x: Math.cos(t) * rr, y: 0.18, z: Math.sin(t) * rr, s: 1 }));
    }
  }
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: seed + 40, color: PALETTE.foliageLight }), { y: 0.24 }));
  return place(g, { x, y: y0, z });
}

function fountain() {
  const g = new THREE.Group();
  const basin = ngon(2.0, 16, 11.25);
  g.add(ring(basin, 0.32, 0.55, stone, stoneLight));
  g.add(slab(basin, 0.42, stone, water()));
  // column + lower bowl
  g.add(cylinder(0.32, 0.42, 1.35, stoneLight, 10));
  g.add(place(cylinder(1.05, 0.35, 0.32, stoneLight, 14), { y: 1.25 }));
  g.add(place(cylinder(0.92, 0.92, 0.03, water(), 14), { y: 1.55 }));
  // upper column + bowl
  g.add(place(cylinder(0.16, 0.22, 0.75, stoneLight, 8), { y: 1.55 }));
  g.add(place(cylinder(0.55, 0.2, 0.22, stoneLight, 12), { y: 2.25 }));
  g.add(place(cylinder(0.47, 0.47, 0.03, water(), 12), { y: 2.45 }));
  // jets and falling water curtains
  g.add(place(cylinder(0.04, 0.12, 1.1, spray, 6), { y: 2.45 }));
  g.add(place(sphere(0.16, spray, 6), { y: 3.4 }));
  g.add(place(cylinder(0.6, 0.62, 0.8, spray, 14), { y: 1.62 }));
  g.add(place(cylinder(1.12, 1.25, 1.12, spray, 16), { y: 0.42 }));
  return g;
}

function bandstand() {
  const g = new THREE.Group();
  const r = 2.4, base = 0.7, postH = 2.5;
  const oct = ngon(r, 8, 22.5);
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  g.add(slab(oct, base, brick, surface('planks', PALETTE.woodLight, { size: 1.5 })));
  g.add(place(ring(ngon(r, 8, 22.5), 0.12, 0.12, stoneLight), { y: base - 0.12 }));
  const white = mat(PALETTE.white);
  // posts at the corners, railings on all faces but the stair (south-west) one
  for (const [x, z] of ngon(r - 0.18, 8, 22.5)) g.add(place(box(0.16, postH, 0.16, white), { x, y: base, z }));
  const side = 2 * (r - 0.18) * Math.sin(Math.PI / 8);
  for (let k = 0; k < 8; k++) {
    if (k === 7) continue;
    const phi = 45 * k;
    const t = (phi * Math.PI) / 180;
    const ap = (r - 0.18) * Math.cos(Math.PI / 8);
    const x = Math.sin(t) * ap, z = Math.cos(t) * ap;
    g.add(place(box(side, 0.08, 0.08, white), { x, y: base + 0.85, z, ry: phi + 90 }));
    g.add(place(box(side, 0.06, 0.06, white), { x, y: base + 0.35, z, ry: phi + 90 }));
    for (let b = -2; b <= 2; b++) {
      const off = (b * side) / 6;
      g.add(place(box(0.04, 0.85, 0.04, white), { x: x + Math.cos(t) * off, y: base, z: z - Math.sin(t) * off }));
    }
  }
  // frieze + roof + finial
  const eave = base + postH;
  g.add(place(slab(ngon(r + 0.05, 8, 22.5), 0.4, white, white), { y: eave }));
  g.add(place(ring(ngon(r + 0.05, 8, 22.5), 0.06, 0.12, mat(PALETTE.red)), { y: eave + 0.1 }));
  const roofA = mat(PALETTE.roofGreen), roofB = mat('#e9e2cf');
  g.add(place(pyramid(ngon(r + 0.55, 8, 22.5), 1.9, [roofA, roofB], white), { y: eave + 0.4 }));
  g.add(place(cylinder(0.05, 0.05, 0.6, metal(PALETTE.glassGold), 6), { y: eave + 2.2 }));
  g.add(place(sphere(0.14, metal(PALETTE.glassGold), 8), { y: eave + 2.6 }));
  // stairs facing the plaza (south-west)
  const ap = r * Math.cos(Math.PI / 8);
  g.add(place(stairs({ w: 1.5, h: base, d: 1.0, steps: 3, material: stoneLight }), { x: -(ap + 0.5) * Math.SQRT1_2, z: (ap + 0.5) * Math.SQRT1_2, ry: -45 }));
  // the band: conductor + three musicians with brass
  const brass = metal(PALETTE.glassGold, { roughness: 0.3 });
  const red = PALETTE.red;
  const players = [[0.0, -1.0], [-0.95, -0.2], [0.95, -0.2], [0.0, 0.5]];
  players.forEach(([x, z], i) => {
    const p = person({ shirt: i === 3 ? PALETTE.black : red, legs: PALETTE.black, hair: PALETTE.black, h: 1.65 });
    g.add(place(p, { x, y: base, z, ry: i === 3 ? 180 : 0 }));
    if (i < 3) g.add(place(cylinder(0.14, 0.04, 0.4, brass, 6), { x: x + 0.15, y: base + 1.1, z: z + 0.25, rx: 70 }));
  });
  return g;
}

function pond() {
  const g = new THREE.Group();
  const outline = blob(3.0, 26, [[0.35, 2, 0.6], [0.2, 3, 2.1]]);
  g.add(ring(outline, 0.3, 0.2, stoneLight));
  g.add(slab(outline, 0.1, soil, water()));
  // lily pads
  for (const [x, z] of [[-1.3, 0.6], [-1.0, 1.1], [0.4, -1.5], [0.9, -1.2], [1.4, 1.2]]) {
    g.add(place(cylinder(0.32, 0.32, 0.03, mat(PALETTE.foliageLight), 7), { x, y: 0.1, z }));
  }
  g.add(place(sphere(0.09, mat('#f6a5c8'), 5), { x: -1.0, y: 0.11, z: 1.1 }));
  // ducks
  const duck = (body) => group(
    place(box(0.5, 0.22, 0.28, body), {}),
    place(box(0.16, 0.22, 0.16, PALETTE.white === body ? body : '#2f6e3d'), { x: 0.2, y: 0.18 }),
    place(box(0.12, 0.05, 0.08, PALETTE.orange), { x: 0.33, y: 0.28 })
  );
  g.add(place(duck(PALETTE.white), { x: -0.4, y: 0.08, z: -0.3, ry: 30 }));
  g.add(place(duck('#8a6a44'), { x: 0.2, y: 0.08, z: 0.6, ry: 160 }));
  g.add(place(duck('#8a6a44'), { x: -0.6, y: 0.08, z: 0.4, ry: 200, s: 0.7 }));
  // reeds along the far bank
  const reed = mat('#4f7a2a'), cattail = mat(PALETTE.woodDark);
  for (let i = 0; i < 9; i++) {
    const t = Math.PI * (1.05 + i * 0.07);
    const [ox, oz] = [Math.cos(t) * 3.05, Math.sin(t) * 3.05];
    for (let k = 0; k < 3; k++) {
      const x = ox + (k - 1) * 0.15, z = oz + ((k * 7 + i) % 3 - 1) * 0.12;
      g.add(place(cylinder(0.02, 0.04, 1.1 + ((i + k) % 3) * 0.25, reed, 4), { x, y: 0.1, z }));
      if (k === 1) g.add(place(cylinder(0.06, 0.06, 0.25, cattail, 5), { x, y: 0.1 + 1.05 + (i % 3) * 0.25, z }));
    }
  }
  // wooden jetty on the south-east bank
  const plank = surface('planks', PALETTE.wood, { size: 1.5 });
  const jetty = group(
    place(box(2.0, 0.1, 1.1, plank), { y: 0.3 }),
    ...[[-0.9, -0.45], [-0.9, 0.45], [0.9, -0.45], [0.9, 0.45]].map(([x, z]) => place(box(0.12, 0.45, 0.12, PALETTE.woodDark), { x, z })),
    place(box(2.0, 0.06, 0.06, PALETTE.woodDark), { y: 0.8, z: -0.5 }),
    place(box(0.06, 0.45, 0.06, PALETTE.woodDark), { x: -0.9, y: 0.4, z: -0.5 }),
    place(box(0.06, 0.45, 0.06, PALETTE.woodDark), { x: 0.0, y: 0.4, z: -0.5 }),
  );
  g.add(place(jetty, { x: 2.2, z: 1.7, ry: -40 }));
  return g;
}

function iceCreamCart() {
  const g = new THREE.Group();
  g.add(place(box(1.6, 0.8, 0.9, mat('#f5d6e0')), { y: 0.35 }));
  g.add(place(box(1.62, 0.18, 0.92, mat('#7cc6e6')), { y: 0.95 }));
  g.add(place(sign({ text: 'ICE CREAM', w: 1.5, h: 0.3, bg: '#f5d6e0', fg: '#c2185b', depth: 0.02, double: true }), { y: 0.55, z: 0.455 }));
  for (const x of [-0.55, 0.55]) g.add(place(cylinder(0.22, 0.22, 0.1, PALETTE.black, 10), { x, y: 0.33, z: 0.47, rx: 90 }));
  g.add(place(cylinder(0.03, 0.03, 1.6, mat(PALETTE.white), 5), { y: 1.1 }));
  const stripes = surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.7 });
  g.add(place(cone(1.1, 0.5, stripes, 8), { y: 2.55 }));
  g.add(place(person({ shirt: PALETTE.white, legs: PALETTE.grey, h: 1.7 }), { z: -0.8 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // --- winding gravel paths (entrances: S gate, W, E, N) -------------------
  const pathH = 0.05;
  const paths = [
    [[0.8, HALF], [0.8, 8.8], [2.0, 7.0], [0.6, 5.2], [0.2, 3.6]], // south gate
    [[-HALF, 2.6], [-8.6, 2.6], [-6.6, 3.5], [-4.6, 2.0], [-2.8, 1.4]], // west
    [[HALF, 3.4], [8.6, 3.4], [6.8, 2.0], [5.0, 2.8], [2.9, 1.8]], // east
    [[0.3, -HALF], [0.3, -8.7], [-0.6, -6.6], [-0.5, -4.4], [-1.4, -2.0]], // north, between pond and bandstand
    [[2.0, -1.2], [2.8, -2.2], [3.4, -3.1]], // plaza -> bandstand steps
    [[-0.6, -5.4], [-1.6, -4.8], [-2.6, -3.9]], // spur to the pond jetty
  ];
  for (const p of paths) g.add(place(ribbon(p, 1.6, pathH, gravel), { y: y0 }));

  // --- central plaza + fountain ------------------------------------------
  const plaza = ngon(PR, 24);
  g.add(place(slab(plaza, 0.08, stoneLight, cobbles), { x: PX, y: y0, z: PZ }));
  g.add(place(ring(plaza, 0.15, 0.1, stone), { x: PX, y: y0, z: PZ }));
  g.add(place(fountain(), { x: PX, y: y0 + 0.08, z: PZ }));
  // benches round the plaza, facing the fountain
  for (const a of [50, 135, -90, -160]) {
    const t = (a * Math.PI) / 180;
    const R = PR - 0.55;
    g.add(place(bench({ w: 1.5 }), { x: PX + Math.cos(t) * R, y: y0 + 0.08, z: PZ + Math.sin(t) * R, ry: (Math.atan2(-Math.cos(t), -Math.sin(t)) * 180) / Math.PI }));
  }

  // --- pond (NW) and bandstand (NE) ---------------------------------------
  g.add(place(pond(), { x: -5.4, y: y0, z: -5.5 }));
  g.add(place(bandstand(), { x: 5.4, y: y0, z: -5.4 }));

  // --- flower beds ----------------------------------------------------------
  g.add(flowerBed(-4.6, 6.0, 1.5, 1));
  g.add(flowerBed(5.4, 6.4, 1.3, 3));

  // --- perimeter hedge with four gaps + south gate ------------------------
  const hH = 0.8, hD = 0.6, e = HALF - hD / 2;
  const run = (from, to, fixed, axis) => {
    const w = to - from, c = (from + to) / 2;
    g.add(place(hedge({ w, h: hH, d: hD }), axis === 'x' ? { x: c, y: y0, z: fixed } : { x: fixed, y: y0, z: c, ry: 90 }));
  };
  run(-HALF, -0.6, HALF - hD / 2, 'x'); run(2.2, HALF, HALF - hD / 2, 'x'); // south (gate at x 0.8)
  run(-HALF, -1.0, -e, 'x'); run(1.6, HALF, -e, 'x'); // north (gap at x 0.3)
  run(-HALF + hD, 1.3, -e, 'z'); run(3.9, HALF - hD, -e, 'z'); // west (gap at z 2.6)
  run(-HALF + hD, 2.1, e, 'z'); run(4.7, HALF - hD, e, 'z'); // east (gap at z 3.4)

  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  const gx = 0.8, gz = HALF - 0.35;
  const pillarH = 2.2;
  for (const dx of [-1.4, 1.4]) {
    g.add(place(box(0.6, pillarH, 0.6, brick), { x: gx + dx, y: y0, z: gz }));
    g.add(place(box(0.76, 0.14, 0.76, stoneLight), { x: gx + dx, y: y0 + pillarH, z: gz }));
    g.add(place(sphere(0.22, stoneLight, 8), { x: gx + dx, y: y0 + pillarH + 0.14, z: gz }));
  }
  const arch = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.07, 5, 18, Math.PI), metal(PARK_IRON));
  g.add(place(arch, { x: gx, y: y0 + pillarH, z: gz }));
  g.add(place(sign({ text: 'CITY PARK', w: 2.5, h: 0.6, bg: PARK_IRON, fg: '#f4d03f', depth: 0.06, double: true }), { x: gx, y: y0 + pillarH + 0.55, z: gz }));

  // --- lamps along the paths ----------------------------------------------
  for (const [x, z, ry] of [[2.0, 4.6, 0], [-1.0, 7.2, 0], [-6.2, 4.3, 0], [6.2, 1.2, 0], [-1.6, -6.4, 0], [1.6, -3.6, 0], [-3.4, -1.3, 0]]) {
    g.add(place(parkLamp(), { x, y: y0, z, ry }));
  }
  // bins
  for (const [x, z] of [[2.6, 2.9], [-2.4, 3.2]]) g.add(place(cylinder(0.25, 0.22, 0.75, parkGreen, 8), { x, y: y0, z }));
  // benches along the paths
  g.add(place(bench({ w: 1.6 }), { x: -6.6, y: y0, z: 1.8, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 7.0, y: y0, z: 4.6 }));
  g.add(place(bench({ w: 1.6 }), { x: 2.6, y: y0, z: -8.0, ry: 270 }));

  // --- trees ----------------------------------------------------------------
  const trees = [
    ['round', 6.2, -7.8, 7.8], ['autumn', 5.0, -2.9, 8.0], ['round', 5.6, 8.0, 8.0], ['poplar', 6.5, 8.6, 5.6],
    ['round', 6.2, -8.2, -0.4], ['round', 6.0, 8.2, -0.8], ['cone', 5, 8.5, -8.5], ['poplar', 6.0, -8.6, 4.9],
    ['autumn', 4.6, 4.4, -0.2], ['cone', 4.0, 2.4, -8.6], ['poplar', 5.5, -1.9, -8.7],
  ];
  trees.forEach(([kind, h, x, z], i) => g.add(place(tree({ kind, h, seed: 10 + i }), { x, y: y0, z })));
  for (const [x, z, h] of [[-3.3, 4.5, 1.2], [3.2, 5.0, 1.1], [-8.6, -2.6, 1.3], [8.6, 1.4, 1.2], [-0.4, 9.0, 0.9], [2.6, 9.0, 0.9], [7.0, 6.6, 1.0]]) {
    g.add(place(tree({ kind: 'bush', h, seed: Math.round(x * 7 + z * 3) }), { x, y: y0, z }));
  }

  // --- life -----------------------------------------------------------------
  g.add(place(iceCreamCart(), { x: 3.4, y: y0, z: 7.8, ry: -15 }));
  const people = [
    [2.4, 6.6, 160, PALETTE.yellow, 1.7], [2.9, 6.3, 200, PALETTE.blue, 1.2], // queueing for ice cream
    [-1.1, 3.9, 20, PALETTE.green, 1.7], [-6.2, 3.1, 90, PALETTE.purple, 1.7],
    [6.0, 2.4, 260, PALETTE.orange, 1.7], [-0.5, -5.8, 200, PALETTE.red, 1.6],
    [-2.6, -3.6, 300, PALETTE.plasterBlue, 1.15], // child feeding the ducks
    [2.6, -1.6, 140, PALETTE.pink, 1.7], [1.4, -2.0, 120, PALETTE.navy, 1.75], // listening to the band
  ];
  for (const [x, z, ry, shirt, h] of people) g.add(place(person({ shirt, h }), { x, y: y0 + pathH, z, ry }));
  // picnic blanket and basket on the lawn
  g.add(place(box(1.8, 0.03, 1.4, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.5 })), { x: -6.0, y: y0, z: 8.0, ry: 15 }));
  g.add(place(box(0.5, 0.3, 0.35, PALETTE.wood), { x: -5.6, y: y0, z: 7.8, ry: 15 }));

  return g;
}

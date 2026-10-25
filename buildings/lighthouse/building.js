import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, FLOOR,
  lot, patch, extrude, cylinder, cone, sphere, box, place, group, rng, mat, glass, metal, emissive, surface,
  facadeBlock, gableRoof, chimney, door, fence, tree, bench, flag, streetLamp, shade,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z. Sea at the back-left,
// keeper's land at the front-right, tower on a rocky outcrop in between.

const RED = PALETTE.red;
const WHITE = PALETTE.white;

// Low-poly boulder: squashed dodecahedron resting on y = 0.
function rock(r, seed, color = PALETTE.stone) {
  const rr = rng(seed);
  const geo = new THREE.DodecahedronGeometry(r, 0);
  geo.scale(rr.range(0.9, 1.3), rr.range(0.55, 0.85), rr.range(0.9, 1.3));
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.min.y - r * 0.15, 0);
  const m = new THREE.Mesh(geo, mat(color));
  m.rotation.y = rr.range(0, Math.PI * 2);
  return m;
}

// Ring of n posts plus a top rail, for the gallery.
function railing(radius, h, n, material) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.add(place(box(0.06, h, 0.06, material), { x: Math.cos(a) * radius, z: Math.sin(a) * radius }));
  }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.05, 4, 24), material);
  rail.rotation.x = Math.PI / 2;
  rail.position.y = h;
  g.add(rail);
  const mid = rail.clone();
  mid.position.y = h * 0.5;
  g.add(mid);
  return g;
}

// Small window slab facing outward on a round tower at angle `deg` (0 = +z).
function towerWindow(radius, y, deg) {
  const a = (deg * Math.PI) / 180;
  return place(group(
    place(box(0.55, 0.8, 0.12, mat(PALETTE.frame)), { z: 0 }),
    place(box(0.38, 0.62, 0.14, mat(PALETTE.window)), { y: 0.09 }),
  ), { x: Math.sin(a) * radius, y, z: Math.cos(a) * radius, ry: deg });
}

function lighthouse() {
  const g = new THREE.Group();
  const stone = surface('cobbles', PALETTE.stone, { size: 1.2 });

  // stone plinth
  g.add(cylinder(1.95, 2.1, 0.9, stone, 8));
  g.add(place(cylinder(1.75, 1.75, 0.12, mat(PALETTE.stoneDark), 8), { y: 0.9 }));

  // striped tapering shaft
  const y0 = 1.0, H = 13.2, rB = 1.5, rT = 1.0, bands = 6;
  for (let i = 0; i < bands; i++) {
    const h = H / bands;
    const r0 = rB + (rT - rB) * (i / bands);
    const r1 = rB + (rT - rB) * ((i + 1) / bands);
    g.add(place(cylinder(r1, r0, h, mat(i % 2 ? WHITE : RED), 20), { y: y0 + i * h }));
  }
  const rAt = (y) => rB + (rT - rB) * ((y - y0) / H) + 0.02;

  // door facing the cottage path + porch hood
  g.add(place(door({ w: 0.9, h: 1.9, color: PALETTE.navy }), { x: 0.85, y: y0, z: 1.18, ry: 35 }));
  g.add(place(box(1.3, 0.12, 0.6, mat(PALETTE.roofBlack)), { x: 0.98, y: y0 + 2.05, z: 1.35, ry: 35 }));
  // windows spiralling up the stairwell
  [[3.4, 30], [5.6, 150], [7.8, 270], [9.9, 30], [11.7, 150], [7.8, 60], [5.6, -60]].forEach(([y, deg]) => {
    g.add(towerWindow(rAt(y), y, deg));
  });

  // gallery deck with corbel ring and railing
  const gy = y0 + H;
  const dark = mat(PALETTE.roofBlack);
  g.add(place(cylinder(1.55, 1.05, 0.45, dark, 20), { y: gy - 0.45 }));
  g.add(place(cylinder(1.6, 1.6, 0.18, dark, 20), { y: gy }));
  g.add(place(railing(1.5, 0.8, 16, dark), { y: gy + 0.18 }));

  // lantern room: base wall, glazed lamp housing, glowing lamp, red cupola
  const ly = gy + 0.18;
  g.add(place(cylinder(0.9, 0.9, 0.55, mat(WHITE), 12), { y: ly }));
  g.add(place(cylinder(0.82, 0.82, 1.45, glass(PALETTE.glassSky, { opacity: 0.35 }), 12), { y: ly + 0.55 }));
  g.add(place(cylinder(0.55, 0.55, 1.15, emissive(PALETTE.windowLit, 2.2), 10), { y: ly + 0.65 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(place(box(0.07, 1.45, 0.07, dark), { x: Math.cos(a) * 0.84, y: ly + 0.55, z: Math.sin(a) * 0.84 }));
  }
  const cy = ly + 2.0;
  g.add(place(cylinder(1.0, 1.0, 0.14, mat(RED), 16), { y: cy }));
  g.add(place(cone(0.98, 0.95, mat(RED), 16), { y: cy + 0.14 }));
  g.add(place(sphere(0.2, dark, 8), { y: cy + 0.95 }));
  g.add(place(cylinder(0.03, 0.04, 0.9, dark, 4), { y: cy + 1.3 }));
  g.userData.height = cy + 2.2;
  return g;
}

function cottage() {
  const g = new THREE.Group();
  const w = 4.4, d = 3.2;
  const wall = PALETTE.white;
  const style = { style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window, shutters: PALETTE.roofBlue, windowW: 0.4, windowH: 0.5, bay: 1.5, lit: 0.2, seed: 67, roof: PALETTE.roofBrown };
  g.add(box(w + 0.3, 0.3, d + 0.3, mat(PALETTE.stoneDark)));
  g.add(place(facadeBlock({ w, d, floors: 1, ...style }), { y: 0.3 }));
  g.add(place(gableRoof({ w, d, h: 1.7, overhang: 0.35, ridge: 'x', material: surface('roofTiles', PALETTE.roofRed, { size: 1.5 }), gableMaterial: wall }), { y: 0.3 + FLOOR }));
  g.add(place(chimney({ w: 0.6, h: 1.8, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: -1.4, y: 0.3 + FLOOR + 0.4, z: -0.6 }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.roofBlue }), { x: 0.4, y: 0.3, z: d / 2 }));
  // little lean-to porch
  g.add(place(box(1.6, 0.1, 0.9, mat(PALETTE.roofRed)), { x: 0.4, y: 2.55, z: d / 2 + 0.45 }));
  for (const x of [-0.3, 1.1]) g.add(place(box(0.1, 2.25, 0.1, mat(WHITE)), { x, y: 0.3, z: d / 2 + 0.85 }));
  return g;
}

function rowboat(color) {
  const g = new THREE.Group();
  const hull = [[-1.1, -0.42], [0.7, -0.42], [1.25, 0], [0.7, 0.42], [-1.1, 0.42]];
  g.add(extrude(hull, 0.35, mat(color), mat(PALETTE.woodLight)));
  g.add(place(box(1.6, 0.06, 0.62, mat(PALETTE.woodDark)), { x: -0.1, y: 0.36 }));
  g.add(place(box(0.2, 0.08, 0.84, mat(PALETTE.wood)), { x: -0.2, y: 0.38 }));
  g.add(place(box(0.2, 0.08, 0.84, mat(PALETTE.wood)), { x: 0.5, y: 0.38 }));
  g.add(place(box(1.4, 0.05, 0.08, mat(PALETTE.wood)), { x: 0.1, y: 0.44, z: 0.25, ry: 12 }));
  return g;
}

// Nudge an object back inside the tile if its bounds poke over the edge.
function inTile(obj, half = 5.1) {
  const b = new THREE.Box3().setFromObject(obj);
  obj.position.x += Math.max(0, -half - b.min.x) - Math.max(0, b.max.x - half);
  obj.position.z += Math.max(0, -half - b.min.z) - Math.max(0, b.max.z - half);
  return obj;
}

function lifebuoy() {
  const m = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 6, 12), surface('stripes', RED, { color2: WHITE, size: 0.25 }));
  return m;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'water'));

  // shoreline: sandy beach, then grass on the keeper's side
  const sandPts = [[-1.4, 5], [5, 5], [5, -5], [1.4, -5], [0.4, -3.6], [-0.6, -1.4], [-1.8, 0.4], [-2.9, 1.9], [-2.6, 3.6]];
  const grassPts = [[-0.2, 5], [5, 5], [5, -5], [2.3, -5], [1.4, -3.4], [0.6, -1.3], [-0.5, 0.6], [-1.6, 2.0], [-1.3, 3.8]];
  g.add(place(extrude(sandPts, 0.25, mat(shade(PALETTE.sand, -0.15)), surface('gravel', PALETTE.sand, { size: 3 })), { y: y0 }));
  g.add(place(extrude(grassPts, 0.2, mat(PALETTE.dirt), surface('grass', PALETTE.grass, { size: 4 })), { y: y0 + 0.25 }));
  const ground = y0 + 0.45;

  // rocky outcrop under the tower
  const tx = -2.45, tz = -2.35;
  const rockPts = [[-4.7, -3.4], [-3.6, -4.7], [-1.6, -4.8], [-0.2, -3.6], [0.1, -1.7], [-0.9, -0.3], [-2.6, 0.0], [-4.2, -0.9], [-4.85, -2.2]];
  g.add(place(extrude(rockPts, 1.1, mat(PALETTE.stoneDark), mat(PALETTE.stone)), { y: y0 }));
  const boulders = [
    [-4.4, -4.3, 0.9, 1], [-3.0, -4.6, 0.8, 2], [-1.2, -4.5, 0.7, 3], [-0.1, -3.0, 0.75, 4],
    [-4.6, -1.0, 0.85, 5], [-3.6, 0.0, 0.7, 6], [-1.7, 0.1, 0.6, 7], [-4.75, -2.6, 0.6, 8],
    [-0.4, -0.7, 0.5, 9], [-3.9, -3.9, 0.6, 10], [-2.2, -4.8, 0.45, 11],
  ];
  // a few loose rocks in the surf and on the beach
  boulders.push([-4.4, 1.2, 0.45, 21], [-3.7, 4.5, 0.35, 22], [0.9, -4.6, 0.4, 23], [-2.4, 4.6, 0.3, 24]);
  for (const [x, z, r, s] of boulders) g.add(inTile(place(rock(r, s, s % 2 ? PALETTE.stone : PALETTE.stoneDark), { x, y: y0, z })));

  const lh = lighthouse();
  g.add(place(lh, { x: tx, y: y0 + 1.1, z: tz }));

  // keeper's cottage + garden
  const cx = 2.4, cz = 0.4;
  g.add(place(cottage(), { x: cx, y: ground, z: cz, ry: 0 }));
  g.add(place(fence({ w: 5.6, d: 3.4, h: 0.7, style: 'picket', color: WHITE, sides: ['front', 'right'], gap: 1.1 }), { x: 2.15, y: ground, z: 3.4 }));
  g.add(place(patch(1.0, 3.0, 'paved'), { x: cx + 0.4, y: ground, z: 3.5 }));
  // stepping-stone path from cottage to the tower door
  for (let i = 0; i < 5; i++) {
    const t = i / 4;
    g.add(place(cylinder(0.32, 0.36, 0.06, mat(PALETTE.paving), 7), { x: 0.3 - t * 1.6, y: ground, z: 1.0 - t * 1.9 }));
  }
  g.add(place(box(0.9, 0.5, 0.6, mat(PALETTE.stone)), { x: -1.25, y: y0 + 0.9, z: -0.9, ry: 35 }));

  // garden props
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 5 }), { x: 4.1, y: ground, z: -1.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 6 }), { x: 4.4, y: ground, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 7 }), { x: 1.0, y: ground, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.7, seed: 8 }), { x: 0.6, y: ground, z: -2.7 }));
  g.add(place(bench({ w: 1.3 }), { x: 0.4, y: ground, z: 4.2, ry: 90 }));
  g.add(place(flag({ h: 4.2, color: PALETTE.navy, color2: WHITE }), { x: 4.5, y: ground, z: 4.45, ry: 180 }));
  g.add(place(streetLamp({ h: 2.4 }), { x: -2.0, y: y0 + 0.25, z: 2.45 }));

  // back yard: oil store shed, drums, vegetable bed
  g.add(place(box(2.0, 1.6, 1.4, surface('planks', PALETTE.wood, { size: 1.5 })), { x: 3.6, y: ground, z: -3.8 }));
  g.add(place(box(2.3, 0.12, 1.7, mat(PALETTE.roofGrey)), { x: 3.6, y: ground + 1.6, z: -3.8, rx: 8 }));
  g.add(place(door({ w: 0.7, h: 1.3, color: PALETTE.woodDark }), { x: 3.6, y: ground, z: -3.1 }));
  for (const [x, z, c] of [[2.15, -3.7, PALETTE.red], [2.25, -4.4, PALETTE.blue], [1.7, -4.1, PALETTE.red]]) {
    g.add(place(cylinder(0.25, 0.25, 0.75, metal(c, { roughness: 0.6 }), 10), { x, y: ground, z }));
  }
  g.add(place(box(1.8, 0.2, 1.0, mat(PALETTE.mud)), { x: 1.7, y: ground, z: -1.9 }));
  for (let i = 0; i < 4; i++) g.add(place(tree({ kind: 'bush', h: 0.35, seed: 30 + i, color: PALETTE.foliageLight }), { x: 1.05 + i * 0.43, y: ground + 0.2, z: -1.9 }));

  // jetty into the cove with a rowboat and lifebuoy
  const jz = 3.0;
  const planks = surface('planks', PALETTE.woodLight, { size: 1 });
  g.add(place(box(2.9, 0.12, 1.0, planks), { x: -3.4, y: y0 + 0.4, z: jz }));
  for (const x of [-4.7, -3.4, -2.2]) for (const z of [jz - 0.45, jz + 0.45]) {
    g.add(place(cylinder(0.08, 0.08, 0.85, mat(PALETTE.woodDark), 6), { x, y: 0, z }));
  }
  g.add(place(box(0.12, 0.9, 0.12, mat(PALETTE.woodDark)), { x: -2.4, y: y0 + 0.5, z: jz - 0.45 }));
  g.add(place(lifebuoy(), { x: -2.4, y: y0 + 1.1, z: jz - 0.53 }));
  g.add(place(rowboat(PALETTE.roofBlue), { x: -3.6, y: y0 - 0.12, z: jz + 1.25, ry: -8 }));
  g.add(place(box(0.5, 0.5, 0.5, mat(PALETTE.woodDark)), { x: -4.3, y: y0 + 0.52, z: jz - 0.15 }));
  return g;
}

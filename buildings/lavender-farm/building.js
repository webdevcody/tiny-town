import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, chimney, door, windowPanel, awning, box, cylinder, sphere, place, group,
  pipe, tree, fence, bench, car, surface, mat, metal, textured, signTexture, rng,
} from '../../src/lib/index.js';

const LAV = '#8f69c9';
const LAV_DARK = '#6c4aa3';
const LAV_LIGHT = '#b28fe3';
const SAGE = '#6f8f5a';
const COPPER = '#c9733a';
const STONE = '#c7b89c';

// Sign with 0..1 UVs on the front face, so the text fills boards wider than 1 m.
function bigSign(text, w, h, { bg, fg, depth = 0.12, border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// One long lavender row along X: sage base with a ridge of purple flower clumps.
const clumpGeo = new THREE.IcosahedronGeometry(0.42, 1);
function lavenderRow(len, seed) {
  const r = rng(seed);
  const g = group(
    box(len, 0.22, 0.8, mat(SAGE)),
    place(box(len - 0.3, 0.5, 0.6, mat(LAV_DARK)), { y: 0.12 })
  );
  const n = Math.round(len / 0.62);
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(clumpGeo, mat(r.pick([LAV, LAV, LAV_DARK, LAV_LIGHT])));
    m.position.set(-len / 2 + 0.35 + ((len - 0.7) * i) / (n - 1), 0.42 + r.range(-0.04, 0.05), r.range(-0.05, 0.05));
    m.scale.set(r.range(0.95, 1.15), r.range(0.8, 0.95), 0.92);
    m.rotation.y = r() * 3;
    g.add(m);
  }
  return g;
}

// Copper pot still on a brick firebox with a swan neck running to a condenser.
function copperStill() {
  const cu = metal(COPPER, { roughness: 0.3 });
  const cuDark = metal('#9c5426', { roughness: 0.4 });
  const brick = surface('brick', PALETTE.brick, { size: 1 });
  const g = group();
  g.add(box(1.9, 0.7, 1.9, brick));
  g.add(place(box(0.6, 0.4, 0.06, mat(PALETTE.black)), { y: 0.1, z: 0.95 }));
  const pot = sphere(0.95, cu, 16);
  pot.scale.set(1, 0.85, 1);
  g.add(place(pot, { y: 0.6 }));
  g.add(place(cylinder(0.98, 0.98, 0.12, cuDark, 16), { y: 1.35 }));
  g.add(place(cylinder(0.32, 0.55, 0.6, cu, 12), { y: 2.1 }));
  g.add(place(sphere(0.5, cu, 12), { y: 2.45 }));
  g.add(place(cylinder(0.12, 0.2, 0.35, cuDark, 8), { y: 3.3 }));
  // lyne arm / swan neck
  g.add(pipe([0, 3.5, 0], [0.9, 3.6, 0], 0.12, cu));
  g.add(pipe([0.9, 3.6, 0], [1.9, 2.9, 0], 0.11, cu));
  // condenser column on a stone plinth
  g.add(place(box(1.1, 0.4, 1.1, mat(PALETTE.stoneDark)), { x: 2.1 }));
  g.add(place(cylinder(0.5, 0.5, 2.5, cu, 14), { x: 2.1, y: 0.4 }));
  for (const y of [0.9, 1.7, 2.5]) g.add(place(cylinder(0.53, 0.53, 0.1, cuDark, 14), { x: 2.1, y }));
  g.add(place(sphere(0.5, cu, 12), { x: 2.1, y: 2.65, s: 1 }));
  // outlet into a receiving barrel
  g.add(pipe([2.6, 0.8, 0], [3.0, 0.8, 0], 0.07, cu));
  g.add(place(cylinder(0.33, 0.33, 0.75, mat(PALETTE.wood), 10), { x: 3.1 }));
  g.add(place(cylinder(0.34, 0.34, 0.06, mat(PALETTE.steelDark), 10), { x: 3.1, y: 0.6 }));
  return g;
}

function beehive() {
  return group(
    box(0.7, 0.2, 0.7, mat(PALETTE.woodDark)),
    place(box(0.62, 0.35, 0.62, mat(PALETTE.white)), { y: 0.2 }),
    place(box(0.62, 0.35, 0.62, mat(PALETTE.plasterYellow)), { y: 0.55 }),
    place(box(0.78, 0.1, 0.78, mat(PALETTE.roofGrey)), { y: 0.9 })
  );
}

function barrel() {
  return group(
    cylinder(0.32, 0.32, 0.85, mat(PALETTE.wood), 10),
    place(cylinder(0.335, 0.335, 0.06, mat(PALETTE.steelDark), 10), { y: 0.15 }),
    place(cylinder(0.335, 0.335, 0.06, mat(PALETTE.steelDark), 10), { y: 0.65 })
  );
}

// Wooden crate brimming with cut lavender bundles.
function lavenderCrate() {
  return group(
    box(0.8, 0.4, 0.55, mat(PALETTE.woodLight)),
    place(box(0.72, 0.18, 0.47, mat(LAV)), { y: 0.4 }),
    place(box(0.72, 0.08, 0.47, mat(SAGE)), { y: 0.36 })
  );
}

// Hand cart loaded with lavender bundles; length along X.
function harvestCart() {
  const wood = mat(PALETTE.wood);
  const g = group(
    place(box(1.8, 0.5, 1.1, wood), { y: 0.45 }),
    place(box(1.6, 0.25, 0.95, mat(LAV)), { y: 0.95 }),
    place(box(1.2, 0.2, 0.6, mat(LAV_LIGHT)), { y: 1.15 }),
    place(box(1.1, 0.08, 0.08, mat(PALETTE.woodDark)), { x: 1.4, y: 0.7, z: 0.4 }),
    place(box(1.1, 0.08, 0.08, mat(PALETTE.woodDark)), { x: 1.4, y: 0.7, z: -0.4 })
  );
  for (const z of [0.6, -0.6]) {
    const wheel = cylinder(0.45, 0.45, 0.1, mat(PALETTE.woodDark), 12);
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(0, 0.45, z);
    g.add(place(group(wheel), { y: 0 }));
  }
  return g;
}

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // ---- lavender field (west) ----
  const fx = -4.45, fw = 10.7;
  g.add(place(patch(fw, 7.7, 'dirt'), { x: fx, y: y0, z: -0.95 }));
  [-4.15, -2.95, -1.75, -0.55, 0.65, 1.85].forEach((z, i) => {
    g.add(place(lavenderRow(10.0, 31 + i), { x: fx, y: y0 + 0.05, z }));
  });
  g.add(place(fence({ w: fw, d: 0.1, h: 0.8, style: 'picket', color: PALETTE.woodLight, sides: ['front'], gap: 1.6 }), { x: fx, y: y0, z: 3.0 }));

  // ---- yard (east) ----
  g.add(place(patch(8.6, 9.6, 'gravel'), { x: 5.5, y: y0 }));

  // ---- stone distillery ----
  const dx = 6.1, dz = -2.75, dw = 7.2, dd = 3.8, dh = 4.2;
  g.add(place(facadeBlock({ w: dw, d: dd, h: dh, floorHeight: dh, style: 'punched', wall: STONE, frame: PALETTE.offWhite, glass: PALETTE.window, shutters: LAV_DARK, windowW: 0.36, windowH: 0.45, bay: 2.3, lit: 0.1, seed: 4, roof: PALETTE.roofBrown, blank: ['front'] }), { x: dx, y: y0, z: dz }));
  g.add(place(gableRoof({ w: dw, d: dd, h: 1.9, overhang: 0.35, ridge: 'x', material: surface('roofTiles', PALETTE.terracotta, { size: 2 }), gableMaterial: STONE }), { x: dx, y: y0 + dh, z: dz }));
  const front = dz + dd / 2;
  // quoins + arched barn doors + windows on the front
  for (const x of [dx - dw / 2 + 0.15, dx + dw / 2 - 0.15]) g.add(place(box(0.4, dh, 0.08, mat(PALETTE.stoneDark)), { x, y: y0, z: front }));
  g.add(place(box(2.3, 3.0, 0.08, mat(PALETTE.stoneDark)), { x: dx, y: y0, z: front }));
  g.add(place(door({ w: 1.9, h: 2.7, color: PALETTE.woodDark, frame: PALETTE.stoneDark }), { x: dx, y: y0, z: front }));
  g.add(place(box(0.06, 2.7, 0.16, mat(PALETTE.wood)), { x: dx, y: y0, z: front + 0.02 }));
  for (const x of [dx - 2.4, dx + 2.4]) {
    g.add(place(windowPanel({ w: 0.9, h: 1.3, frame: PALETTE.offWhite }), { x, y: y0 + 1.3, z: front }));
    g.add(place(box(0.35, 1.4, 0.08, mat(LAV_DARK)), { x: x - 0.7, y: y0 + 1.25, z: front + 0.03 }));
    g.add(place(box(0.35, 1.4, 0.08, mat(LAV_DARK)), { x: x + 0.7, y: y0 + 1.25, z: front + 0.03 }));
  }
  g.add(place(bigSign('DISTILLERIE', 4.0, 0.7, { bg: PALETTE.woodDark, fg: '#f4e9c8' }), { x: dx, y: y0 + 3.15, z: front + 0.05 }));
  g.add(place(door({ w: 1.1, h: 2.3, color: PALETTE.woodDark, frame: PALETTE.stoneDark }), { x: dx - 0.6, y: y0, z: dz - dd / 2, ry: 180 }));
  // brick chimney for the still furnace
  g.add(place(chimney({ w: 0.9, h: 4.2, material: surface('brick', PALETTE.brick, { size: 1 }) }), { x: dx + 2.6, y: y0 + dh, z: dz - 0.7 }));
  // barrels along the west wall
  for (const [x, z] of [[1.85, -4.3], [1.85, -3.55], [1.85, -2.8]]) g.add(place(barrel(), { x, y: y0, z }));
  g.add(place(barrel(), { x: 1.85, y: y0 + 0.85, z: -3.9, s: 1 }));

  // ---- copper still in the yard ----
  g.add(place(copperStill(), { x: 2.8, y: y0, z: 0.85 }));

  // ---- farm shop ----
  const sx = 7.9, sz = 2.35, sw = 3.8, sd = 3.0, sh = 3.0;
  const shopWall = PALETTE.cream;
  g.add(place(facadeBlock({ w: sw, d: sd, h: sh, floorHeight: sh, style: 'punched', wall: shopWall, frame: PALETTE.white, glass: PALETTE.window, shutters: LAV, windowW: 0.4, windowH: 0.45, bay: 1.9, seed: 9, blank: ['front'] }), { x: sx, y: y0, z: sz }));
  g.add(place(gableRoof({ w: sw, d: sd, h: 1.4, overhang: 0.3, ridge: 'x', material: surface('roofTiles', PALETTE.terracotta, { size: 2 }), gableMaterial: shopWall }), { x: sx, y: y0 + sh, z: sz }));
  const sf = sz + sd / 2;
  g.add(place(door({ w: 0.95, h: 2.0, color: LAV_DARK }), { x: sx - 0.9, y: y0, z: sf }));
  g.add(place(windowPanel({ w: 1.6, h: 1.1, frame: PALETTE.white }), { x: sx + 0.75, y: y0 + 0.75, z: sf }));
  g.add(place(awning({ w: 3.6, depth: 0.9, drop: 0.35, color: LAV, color2: PALETTE.white }), { x: sx, y: y0 + 2.2, z: sf }));
  g.add(place(bigSign('FARM SHOP', 3.2, 0.5, { bg: LAV_DARK, fg: '#ffffff' }), { x: sx, y: y0 + 2.25, z: sf + 0.04 }));
  for (const [x, z] of [[sx - 0.1, sf + 0.8], [sx + 0.8, sf + 0.8], [sx + 1.7, sf + 0.8]]) g.add(place(lavenderCrate(), { x, y: y0, z }));
  g.add(place(bench({ w: 1.4 }), { x: sx - 2.5, y: y0, z: sf + 0.4 }));

  // delivery van
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 4.0, y: y0 + 0.05, z: 3.9, s: 0.6 }));

  // ---- front strip: farm sign, beehives, harvest cart, cypresses ----
  const signX = -2.6;
  g.add(place(box(0.15, 1.9, 0.15, mat(PALETTE.woodDark)), { x: signX - 2.0, y: y0, z: 4.3 }));
  g.add(place(box(0.15, 1.9, 0.15, mat(PALETTE.woodDark)), { x: signX + 2.0, y: y0, z: 4.3 }));
  g.add(place(bigSign('LAVENDER FARM', 4.6, 0.9, { bg: LAV_DARK, fg: '#ffffff', border: '#f4e9c8' }), { x: signX, y: y0 + 0.95, z: 4.35 }));
  for (const x of [-8.0, -7.0, -6.0]) g.add(place(beehive(), { x, y: y0, z: 4.1 }));
  g.add(place(harvestCart(), { x: 0.3, y: y0, z: 3.9, ry: -15 }));
  g.add(place(tree({ kind: 'poplar', h: 5.5, seed: 2, color: PALETTE.foliageDark }), { x: -9.2, y: y0, z: 4.1 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 3 }), { x: 9.4, y: y0, z: 0.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 4 }), { x: 9.3, y: y0, z: 4.5 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, sphere, place, group, mat, glass, metal, water, surface, textured,
  signTexture, gableRoof, barrelRoof, facadeBlock, fence, hedge, tree, streetLamp, bench, awning, pipeRun,
} from '../../src/lib/index.js';
import { giraffe, elephant, penguin, flamingo, parrot } from './animals.js';

// 2x2 tiles (20 x 20 m). Front (entrance arch) faces +z.
//   back-left : giraffe paddock + tall timber giraffe house
//   back-right: elephant paddock with mud pond + stone elephant house
//   front-left: aviary dome with flamingo pond and parrots
//   front-right: penguin pool with ice rocks and a glass viewing wall
const y0 = LOT_HEIGHT;
const H = TILE; // half of the 20 m lot

// Sign with 0..1 UVs on every face so the text fills the panel (the lib sign() shrinks over 1 m).
function bigSign(text, w, h, d, { bg, fg, border, font = 'bold' } = {}) {
  const tex = signTexture(text, { bg, fg, border, font, width: 512, height: Math.round((512 * h) / w) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, side, side, face, face]);
}

// Small enclosure sign on a post, readable from the promenade (+z).
function postSign(text, bg) {
  return group(
    box(0.12, 1.4, 0.12, mat(PALETTE.woodDark)),
    place(bigSign(text, 2.0, 0.55, 0.1, { bg, fg: '#ffffff', border: '#ffffff' }), { y: 1.3 })
  );
}

function rock(r, color, seed = 0, squash = 0.7) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(color));
  m.scale.set(1 + (seed % 3) * 0.12, squash, 1 - (seed % 2) * 0.15);
  m.rotation.y = seed * 1.3;
  m.position.y = r * squash * 0.8;
  return group(m);
}

// Savanna acacia: thin trunk, wide flat crown.
function acacia(h = 4.5, seed = 1) {
  const g = new THREE.Group();
  const trunk = mat(PALETTE.trunk);
  g.add(cylinder(0.12, 0.18, h * 0.7, trunk, 6));
  g.add(place(cylinder(0.07, 0.1, h * 0.35, trunk, 5), { x: 0.2, y: h * 0.45, rz: -35 }));
  const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 1), mat(seed % 2 ? PALETTE.foliage : PALETTE.foliageLight));
  crown.scale.set(h * 0.42, h * 0.11, h * 0.36);
  crown.position.y = h * 0.78;
  g.add(crown);
  const crown2 = crown.clone();
  crown2.scale.set(h * 0.25, h * 0.08, h * 0.22);
  crown2.position.set(h * 0.25, h * 0.68, h * 0.1);
  g.add(crown2);
  return g;
}

function person(color, seed) {
  const skin = ['#e8c39e', '#c68d5e', '#8d5a3b'][seed % 3];
  return group(
    place(box(0.32, 0.8, 0.22, mat(PALETTE.navy)), {}),
    place(box(0.4, 0.65, 0.26, mat(color)), { y: 0.8 }),
    place(sphere(0.15, mat(skin), 6), { y: 1.45 })
  );
}

// --- giraffe paddock (back-left) ---------------------------------------------
function giraffePaddock() {
  const g = new THREE.Group();
  const cx = -5.5, cz = -5.6, w = 8.6, d = 8.2;
  g.add(place(patch(w, d, surface('gravel', PALETTE.sand, { size: 3 })), { x: cx, y: y0, z: cz }));
  g.add(place(patch(2.6, 1.8, surface('grass', PALETTE.grassLight, { size: 3 }), 0.07), { x: -3.4, y: y0, z: -3.2 }));

  // tall timber giraffe house with a high doorway
  const hx = -7.3, hz = -7.9, hw = 4.4, hd = 3.2, hh = 5.4;
  const planks = surface('planks', PALETTE.woodLight, { size: 2 });
  g.add(place(box(hw, hh, hd, planks), { x: hx, y: y0, z: hz }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 1.6, overhang: 0.35, ridge: 'x', material: surface('roofTiles', PALETTE.thatch, { size: 2 }), gableMaterial: planks }), { x: hx, y: y0 + hh, z: hz }));
  g.add(place(box(1.5, 4.4, 0.08, mat(PALETTE.woodDark)), { x: hx + 0.6, y: y0, z: hz + hd / 2 }));
  g.add(place(box(1.7, 0.2, 0.14, mat(PALETTE.wood)), { x: hx + 0.6, y: y0 + 4.4, z: hz + hd / 2 }));
  for (const wx of [hx - 1.4]) g.add(place(box(0.9, 0.9, 0.08, mat(PALETTE.window)), { x: wx, y: y0 + 3.6, z: hz + hd / 2 }));
  for (const wx of [hx - 1.2, hx + 1.2]) g.add(place(box(0.8, 0.8, 0.08, mat(PALETTE.window)), { x: wx, y: y0 + 3.6, z: hz - hd / 2 - 0.08 }));
  // high feeding basket on a pole
  g.add(place(cylinder(0.09, 0.09, 3.6, mat(PALETTE.woodDark), 6), { x: -2.6, y: y0, z: -8.4 }));
  g.add(place(cylinder(0.55, 0.35, 0.6, mat(PALETTE.woodDark), 8), { x: -2.6, y: y0 + 3.4, z: -8.4 }));
  g.add(place(cylinder(0.5, 0.5, 0.2, mat(PALETTE.hay), 8), { x: -2.6, y: y0 + 3.95, z: -8.4 }));

  g.add(place(acacia(4.6, 1), { x: -7.7, y: y0, z: -3.6 }));
  g.add(place(acacia(3.8, 2), { x: -2.4, y: y0, z: -5.6, ry: 120 }));
  g.add(place(giraffe(), { x: -5.2, y: y0, z: -4.2, ry: 25 }));
  g.add(place(giraffe({ neckTilt: 18 }), { x: -3.4, y: y0, z: -7.2, ry: 150 }));
  g.add(place(giraffe({ neckTilt: 40 }), { x: -8.3, y: y0, z: -5.2, ry: -70, s: 0.7 }));
  g.add(place(rock(0.5, PALETTE.stone, 2), { x: -6.6, y: y0, z: -2.6 }));

  // timber rail fence round the paddock
  g.add(place(fence({ w: w, d: d, h: 1.3, style: 'railing', color: PALETTE.wood }), { x: cx, y: y0, z: cz }));
  return g;
}

// --- elephant paddock (back-right) -------------------------------------------
function elephantPaddock() {
  const g = new THREE.Group();
  const cx = 5.5, cz = -5.6, w = 8.6, d = 8.2;
  g.add(place(patch(w, d, surface('gravel', PALETTE.dirt, { size: 3 })), { x: cx, y: y0, z: cz }));
  // mud bathing pond
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.7, 0.08, 14), water('#4f7f86'));
  pond.scale.set(1.2, 1, 0.8);
  g.add(place(pond, { x: 3.6, y: y0 + 0.08, z: -3.6 }));
  const mud = new THREE.Mesh(new THREE.CylinderGeometry(2.0, 2.0, 0.06, 14), mat(PALETTE.mud));
  mud.scale.set(1.2, 1, 0.8);
  g.add(place(mud, { x: 3.6, y: y0 + 0.04, z: -3.6 }));

  // stone elephant house with a vaulted roof and a huge door
  const hx = 6.8, hz = -7.9, hw = 5.4, hd = 3.2, hh = 3.4;
  const stone = surface('brick', PALETTE.sandstone, { size: 2.5 });
  g.add(place(box(hw, hh, hd, stone), { x: hx, y: y0, z: hz }));
  g.add(place(barrelRoof({ w: hw + 0.3, d: hd + 0.3, h: 1.4, axis: 'x', material: mat(PALETTE.roofGreen), endMaterial: stone }), { x: hx, y: y0 + hh, z: hz }));
  g.add(place(box(2.2, 2.9, 0.08, mat(PALETTE.woodDark)), { x: hx - 0.4, y: y0, z: hz + hd / 2 }));
  g.add(place(box(2.6, 0.3, 0.16, mat(PALETTE.stoneDark)), { x: hx - 0.4, y: y0 + 2.9, z: hz + hd / 2 }));
  g.add(place(box(0.8, 0.8, 0.08, mat(PALETTE.window)), { x: hx + 1.9, y: y0 + 2.0, z: hz + hd / 2 }));

  for (const wx of [hx - 1.6, hx + 1.6]) g.add(place(box(0.8, 0.8, 0.08, mat(PALETTE.window)), { x: wx, y: y0 + 2.0, z: hz - hd / 2 - 0.08 }));
  for (const wz of [hz]) g.add(place(box(0.08, 0.8, 0.8, mat(PALETTE.window)), { x: hx - hw / 2 - 0.08, y: y0 + 2.0, z: wz }));
  g.add(place(elephant(), { x: 6.4, y: y0, z: -4.0, ry: 200 }));
  g.add(place(elephant({ trunkUp: true }), { x: 3.4, y: y0, z: -6.8, ry: -30, s: 0.6 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 31 }), { x: 2.6, y: y0, z: -7.9 }));
  for (const [x, z, r, s] of [[8.6, -2.6, 0.7, 1], [9.0, -4.0, 0.5, 2], [1.9, -2.5, 0.45, 3]]) g.add(place(rock(r, PALETTE.stone, s), { x, y: y0, z }));
  // fallen log + hay pile
  g.add(place(cylinder(0.25, 0.25, 2.2, mat(PALETTE.trunk), 8), { x: 8.4, y: y0 + 0.25, z: -5.8, rx: 90, ry: 20 }));
  g.add(place(cone(0.8, 0.6, mat(PALETTE.hay), 8), { x: 4.5, y: y0, z: -8.6 }));

  // low stone wall with steel bollards (elephant-proof)
  g.add(place(fence({ w: w, d: d, h: 0.7, style: 'wall', color: PALETTE.stoneDark }), { x: cx, y: y0, z: cz }));
  for (let x = 1.6; x <= 9.4; x += 0.9) g.add(place(cylinder(0.06, 0.06, 1.4, metal(PALETTE.steelDark), 5), { x, y: y0 + 0.6, z: -1.5 }));
  return g;
}

// --- aviary dome (front-left) ------------------------------------------------
function aviary() {
  const g = new THREE.Group();
  const cx = -5.6, cz = 3.6, r = 3.6;
  const frame = metal(PALETTE.white);
  g.add(place(cylinder(r + 0.2, r + 0.25, 0.6, mat(PALETTE.stoneDark), 24), { x: cx, z: cz, y: y0 }));
  const base = y0 + 0.6;
  // inside: grass, pond with flamingos, trees with parrots
  g.add(place(cylinder(r, r, 0.03, surface('grass', PALETTE.grass, { size: 3 }), 24), { x: cx, y: base, z: cz }));
  const pond = new THREE.Mesh(new THREE.CylinderGeometry(1.3, 1.3, 0.05, 14), water(PALETTE.water));
  pond.scale.set(1.3, 1, 0.9);
  g.add(place(pond, { x: cx + 0.6, y: base + 0.02, z: cz + 1.2 }));
  g.add(place(flamingo(), { x: cx + 0.1, y: base, z: cz + 1.3, ry: 30 }));
  g.add(place(flamingo(), { x: cx + 1.2, y: base, z: cz + 0.9, ry: 160 }));
  g.add(place(flamingo(), { x: cx + 1.0, y: base, z: cz + 1.9, ry: -60 }));
  g.add(place(tree({ kind: 'palm', h: 4.2, seed: 7 }), { x: cx - 1.4, y: base, z: cz - 1.2 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 8 }), { x: cx + 1.0, y: base, z: cz - 1.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 9 }), { x: cx - 2.2, y: base, z: cz + 1.0 }));
  // perch branch with macaws
  g.add(pipeRun([[cx - 2.0, base, cz + 0.2], [cx - 1.6, base + 1.8, cz + 0.3], [cx - 0.2, base + 2.2, cz + 0.2]], 0.08, mat(PALETTE.trunk)));
  g.add(place(parrot(PALETTE.red, PALETTE.blue), { x: cx - 1.0, y: base + 2.25, z: cz + 0.2 }));
  g.add(place(parrot(PALETTE.blue, PALETTE.yellow), { x: cx - 0.4, y: base + 2.25, z: cz + 0.2, ry: 180 }));
  g.add(place(parrot(PALETTE.yellow, PALETTE.green), { x: cx + 1.0, y: base + 3.3, z: cz - 1.6 }));
  g.add(place(parrot(PALETTE.green, PALETTE.red), { x: cx - 1.4, y: base + 4.25, z: cz - 1.2, ry: 90 }));

  // netted glass shell + white ribs
  const shell = new THREE.Mesh(new THREE.SphereGeometry(r, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), glass(PALETTE.glassSky, { opacity: 0.28 }));
  shell.material.depthWrite = false;
  g.add(place(shell, { x: cx, y: base, z: cz }));
  const net = new THREE.Mesh(new THREE.SphereGeometry(r * 1.005, 18, 6, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshBasicMaterial({ color: '#e8eef2', wireframe: true, transparent: true, opacity: 0.5 }));
  g.add(place(net, { x: cx, y: base, z: cz }));
  for (let i = 0; i < 6; i++) {
    const rib = new THREE.Mesh(new THREE.TorusGeometry(r, 0.07, 4, 24, Math.PI), frame);
    g.add(place(rib, { x: cx, y: base, z: cz, ry: i * 30 }));
  }
  for (const a of [25, 50]) {
    const t = THREE.MathUtils.degToRad(a);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(r * Math.cos(t), 0.07, 4, 32), frame);
    g.add(place(ring, { x: cx, y: base + r * Math.sin(t), z: cz, rx: 90 }));
  }
  g.add(place(cylinder(0.25, 0.35, 0.4, frame, 8), { x: cx, y: base + r - 0.05, z: cz }));
  g.add(place(cylinder(0.04, 0.04, 0.8, frame, 4), { x: cx, y: base + r + 0.3, z: cz }));
  g.add(place(parrot(PALETTE.orange, PALETTE.green), { x: cx, y: base + r + 1.05, z: cz, s: 1.6 }));
  // entrance vestibule facing the main path (+x)
  g.add(place(box(1.2, 2.3, 1.6, glass(PALETTE.glassSky, { opacity: 0.6 })), { x: cx + r - 0.1, y: y0, z: cz }));
  g.add(place(box(1.4, 0.15, 1.8, frame), { x: cx + r - 0.1, y: y0 + 2.3, z: cz }));
  return g;
}

// --- penguin pool (front-right) ----------------------------------------------
function penguinPool() {
  const g = new THREE.Group();
  const cx = 5.5, cz = 3.9, w = 7.0, d = 6.0, wallH = 0.9;
  const rim = mat(PALETTE.concrete);
  const ice = '#e9f3f8', ice2 = '#cfe3ee';
  // basin walls (back, left, right concrete; front is a glass viewing wall)
  g.add(place(box(w, wallH, 0.3, rim), { x: cx, y: y0, z: cz - d / 2 }));
  g.add(place(box(0.3, wallH, d, rim), { x: cx - w / 2, y: y0, z: cz }));
  g.add(place(box(0.3, wallH, d, rim), { x: cx + w / 2, y: y0, z: cz }));
  g.add(place(box(w, 0.35, 0.3, rim), { x: cx, y: y0, z: cz + d / 2 }));
  g.add(place(box(w - 0.3, 0.9, 0.08, glass(PALETTE.glassTeal, { opacity: 0.55 })), { x: cx, y: y0 + 0.35, z: cz + d / 2 }));
  g.add(place(box(w, 0.1, 0.34, metal(PALETTE.steelLight)), { x: cx, y: y0 + 1.25, z: cz + d / 2 }));
  g.add(place(box(w - 0.3, 0.55, d - 0.3, water(PALETTE.pool)), { x: cx, y: y0, z: cz }));
  const wy = y0 + 0.55;

  // icy rock shelf along the back and right with a slide down into the water
  g.add(place(box(w - 0.3, 0.5, 1.6, mat(ice)), { x: cx, y: wy - 0.1, z: cz - d / 2 + 0.95 }));
  g.add(place(box(1.4, 0.5, 3.0, mat(ice)), { x: cx + w / 2 - 0.85, y: wy - 0.1, z: cz + 0.2 }));
  for (const [x, z, r, s, c] of [[3.0, 1.4, 0.9, 1, ice], [5.0, 1.2, 1.1, 2, ice2], [7.6, 1.6, 1.0, 3, ice], [8.1, 3.6, 0.7, 4, ice2]]) {
    g.add(place(rock(r, c, s, 0.9), { x, y: wy + 0.3, z }));
  }
  // small ice floe island in the middle
  g.add(place(rock(0.8, ice, 5, 0.45), { x: 4.4, y: wy - 0.1, z: 4.4 }));
  // slide
  g.add(place(box(0.6, 0.06, 2.0, mat(PALETTE.glassSky)), { x: 6.6, y: wy + 0.4, z: 2.7, rx: 25 }));

  // the colony
  const spots = [[3.3, 2.5, 30], [3.9, 2.4, -20], [4.6, 2.3, 80], [5.6, 2.4, 160], [6.0, 1.7, 100], [7.7, 2.8, 200], [8.1, 4.5, 250], [4.4, 4.45, 90], [2.7, 1.0, 10]];
  spots.forEach(([x, z, ry], i) => {
    const onRock = x > 7.5 || (x < 3 && z < 1.5);
    const yy = x === 4.4 ? wy + 0.25 : wy + 0.4 + (onRock ? 0.5 : 0);
    g.add(place(penguin({ flap: i % 3 === 0 ? 35 : 0 }), { x, y: yy, z, ry }));
  });
  // swimmers: heads just above the water
  for (const [x, z] of [[3.2, 5.4], [6.2, 5.0]]) {
    g.add(place(sphere(0.14, mat('#25262b'), 8), { x, y: wy - 0.05, z }));
    g.add(place(cone(0.05, 0.14, mat(PALETTE.orange), 5), { x: x + 0.14, y: wy + 0.08, z, rz: -90 }));
  }
  return g;
}

// --- themed entrance arch (front) --------------------------------------------
function entrance() {
  const g = new THREE.Group();
  const z = 8.6, px = 2.7, ph = 5.0;
  const rockMat = surface('cobbles', PALETTE.sandstone, { size: 1.5 });
  for (const s of [-1, 1]) {
    // chunky rock pillars, slightly tapered, with jungle leaves on top
    g.add(place(cylinder(0.65, 0.85, ph, rockMat, 7), { x: s * px, y: y0, z }));
    g.add(place(cylinder(0.95, 0.95, 0.35, mat(PALETTE.stoneDark), 7), { x: s * px, y: y0, z }));
    g.add(place(tree({ kind: 'palm', h: 2.0, seed: 12 + s }), { x: s * px, y: y0 + ph - 0.2, z }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 20 + s, color: PALETTE.foliageLight }), { x: s * px, y: y0 + ph - 0.3, z }));
  }
  // log lintel + big sign
  g.add(place(cylinder(0.35, 0.35, 2 * px + 1.4, mat(PALETTE.trunk), 10), { x: -(px + 0.7), y: y0 + ph - 0.7, z, rz: -90 }));
  g.add(place(bigSign('TINY TOWN ZOO', 5.0, 1.3, 0.2, { bg: PALETTE.green, fg: PALETTE.yellow, border: PALETTE.yellow }), { y: y0 + ph - 2.35, z: z + 0.9 }));
  // giraffe peeking over the arch
  g.add(place(giraffe({ neckTilt: 10 }), { x: -0.6, y: y0 + ph - 0.5, z: z - 0.3, ry: -15, s: 0.55 }));
  // gate leaves (open), zebra-striped posts
  for (const s of [-1, 1]) {
    g.add(place(box(0.08, 1.6, 2.0, metal(PALETTE.darkGrey)), { x: s * (px - 0.8), y: y0, z: z - 1.0 }));
  }
  // ticket booth (left) and gift shop (right)
  const booth = (x, color, text) => {
    const b = new THREE.Group();
    b.add(place(facadeBlock({ w: 2.6, d: 1.6, floors: 1, style: 'shop', wall: PALETTE.cream, glass: PALETTE.glassSky, frame: PALETTE.white, roof: PALETTE.roofBrown, seed: 3 }), {}));
    b.add(place(gableRoof({ w: 2.6, d: 1.6, h: 0.9, overhang: 0.3, ridge: 'x', material: surface('roofTiles', PALETTE.thatch, { size: 1.5 }), gableMaterial: PALETTE.cream }), { y: 3 }));
    b.add(place(awning({ w: 2.4, depth: 0.7, drop: 0.3, color, color2: PALETTE.white }), { y: 2.4, z: 0.8 }));
    b.add(place(bigSign(text, 2.0, 0.45, 0.08, { bg: color, fg: '#ffffff' }), { y: 2.75, z: 0.82 }));
    return place(b, { x, y: y0, z: 8.3 });
  };
  g.add(booth(-5.4, PALETTE.orange, 'TICKETS'));
  g.add(booth(5.4, PALETTE.blue, 'GIFTS'));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // paths: main avenue from the gate + promenade in front of the paddocks
  const cobble = 'cobbles';
  g.add(place(patch(3.0, 11.6, cobble), { x: 0, y: y0, z: 4.2 }));
  g.add(place(patch(19.6, 1.6, cobble), { x: 0, y: y0, z: -0.7 }));
  g.add(place(patch(8.0, 1.6, cobble), { x: 0, y: y0, z: 9.2 }));
  g.add(place(patch(1.2, 1.4, cobble), { x: -1.9, y: y0, z: 3.9 }));
  // central fountain-ish elephant topiary island
  g.add(place(cylinder(0.9, 0.9, 0.35, mat(PALETTE.stone), 12), { x: 0, y: y0, z: -0.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.4, seed: 44, color: PALETTE.foliageDark }), { x: 0, y: y0 + 0.35, z: -0.7 }));

  g.add(giraffePaddock());
  g.add(elephantPaddock());
  g.add(aviary());
  g.add(penguinPool());
  g.add(entrance());

  // enclosure signs facing the paths
  g.add(place(postSign('GIRAFFES', PALETTE.ochre), { x: -1.9, y: y0, z: 0.3 }));
  g.add(place(postSign('ELEPHANTS', PALETTE.brickBrown), { x: 1.9, y: y0, z: 0.3 }));
  g.add(place(postSign('PENGUINS', PALETTE.blue), { x: 1.9, y: y0, z: 7.6, ry: -90 }));
  g.add(place(postSign('AVIARY', PALETTE.green), { x: -1.9, y: y0, z: 7.6, ry: 90 }));

  // lamps, benches, visitors
  for (const [x, z, ry] of [[-1.8, 2.0, 0], [1.8, 2.0, 180], [-6.0, -0.1, 0], [6.0, -0.1, 180]]) g.add(place(streetLamp({ h: 3.6 }), { x, y: y0, z, ry }));
  g.add(place(bench({ w: 1.4 }), { x: -4.0, y: y0, z: 0.4, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: 4.0, y: y0, z: 0.4, ry: 180 }));
  const people = [[-0.6, 6.5, '#d94f4f'], [0.7, 5.2, '#e9c31f'], [0.4, 2.8, '#3a9a4a'], [-3.0, -0.5, '#7a4d9a'], [3.0, -0.9, '#e27a1e'], [7.8, -0.6, '#2f6fbf'], [0.5, 9.4, '#f1eee6'], [-7.6, -0.9, '#d99b9b']];
  people.forEach(([x, z, c], i) => g.add(place(person(c, i), { x, y: y0, z, ry: i * 47, s: 0.95 })));

  // perimeter hedges + trees at the front corners
  g.add(place(hedge({ w: 19.6, h: 0.9, d: 0.5 }), { y: y0, z: -H + 0.25 }));
  for (const s of [-1, 1]) {
    g.add(place(hedge({ w: 0.5, h: 0.9, d: 19.6 }), { x: s * (H - 0.25), y: y0 }));
    g.add(place(tree({ kind: 'round', h: 4.2, seed: 50 + s }), { x: s * 8.4, y: y0, z: 8.5 }));
    g.add(place(hedge({ w: 2.0, h: 0.8, d: 0.5 }), { x: s * 3.4, y: y0, z: H - 0.3 }));
  }
  return g;
}

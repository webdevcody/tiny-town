import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, gableRoof, door, box, cylinder, sphere, place, group,
  tree, fence, surface, field, mat, bench, rng,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
const y0 = LOT_HEIGHT;
const brickMat = surface('brick', PALETTE.brick, { size: 1.2 });
const slateMat = surface('shingles', PALETTE.roofSlate, { size: 1.5 });
const FLOWER_COLOURS = [PALETTE.red, PALETTE.yellow, PALETTE.purple, PALETTE.pink, PALETTE.white, PALETTE.orange];

// White-framed cottage window with a cross mullion, stone sill and lintel.
// Origin = bottom centre of the glass; faces +z.
function cottageWindow({ w = 1.0, h = 1.15, flowers = false, seed = 1 } = {}) {
  const g = group(
    place(box(w + 0.2, h + 0.2, 0.06, PALETTE.white), { y: -0.1, z: 0.03 }),
    place(box(w, h, 0.1, mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 })), { z: 0.05 }),
    place(box(0.08, h, 0.14, PALETTE.white), { z: 0.05 }),
    place(box(w, 0.08, 0.14, PALETTE.white), { y: h * 0.55, z: 0.05 }),
    place(box(w + 0.4, 0.1, 0.25, PALETTE.stone), { y: -0.2, z: 0.1 }),
    place(box(w + 0.35, 0.16, 0.12, PALETTE.stone), { y: h + 0.1, z: 0.05 })
  );
  if (flowers) g.add(place(flowerBox(w + 0.2, seed), { y: -0.45, z: 0.25 }));
  return g;
}

function flowerBox(w, seed) {
  const r = rng(seed);
  const g = group(box(w, 0.25, 0.3, PALETTE.woodDark), place(box(w - 0.1, 0.12, 0.22, PALETTE.foliageDark), { y: 0.22 }));
  const n = Math.round(w / 0.22);
  for (let i = 0; i < n; i++) {
    g.add(place(sphere(0.09, r.pick(FLOWER_COLOURS), 5), { x: -w / 2 + 0.12 + (i * (w - 0.24)) / (n - 1), y: 0.34, z: r.range(-0.06, 0.06) }));
  }
  return g;
}

// Clump of flowers: leafy mound with coloured blooms.
function flowerClump(r, s = 1) {
  const g = group(place(sphere(0.32 * s, PALETTE.foliage, 5), { y: 0.05, s: 1 }));
  g.children[0].scale.set(1, 0.7, 1);
  const c = r.pick(FLOWER_COLOURS);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + r() * 0.8;
    g.add(place(sphere(0.11 * s, c, 5), { x: Math.cos(a) * 0.2 * s, y: 0.22 * s + r() * 0.08, z: Math.sin(a) * 0.2 * s }));
  }
  return g;
}

function flowerBed(w, d, seed) {
  const r = rng(seed);
  const g = group(
    box(w + 0.2, 0.12, d + 0.2, PALETTE.stone),
    place(box(w, 0.14, d, field('flowers', { size: 1.5 })), { y: 0.01 })
  );
  const cols = Math.max(1, Math.round(w / 0.75));
  const rows = Math.max(1, Math.round(d / 0.75));
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const x = -w / 2 + (w * (i + 0.5)) / cols + r.range(-0.1, 0.1);
      const z = -d / 2 + (d * (j + 0.5)) / rows + r.range(-0.1, 0.1);
      g.add(place(flowerClump(r, r.range(0.8, 1.1)), { x, y: 0.12, z }));
    }
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // --- cottage body ---
  const hx = -0.3, hz = -1.7, hw = 6.0, hd = 4.4, wallH = 2.7, roofH = 3.3;
  const front = hz + hd / 2, back = hz - hd / 2;
  g.add(place(box(hw + 0.2, 0.35, hd + 0.2, PALETTE.stoneDark), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw, wallH, hd, brickMat), { x: hx, y: y0 + 0.3, z: hz }));
  const eaves = y0 + 0.3 + wallH;
  g.add(place(gableRoof({ w: hw, d: hd, h: roofH, overhang: 0.35, ridge: 'x', material: slateMat, gableMaterial: brickMat }), { x: hx, y: eaves, z: hz }));
  // ridge tiles
  g.add(place(box(hw + 0.8, 0.18, 0.28, PALETTE.roofBlack), { x: hx, y: eaves + roofH - 0.08, z: hz }));
  // white bargeboards on the gable ends
  for (const s of [-1, 1]) {
    const x = hx + s * (hw / 2 + 0.36);
    const slope = Math.atan2(roofH, hd / 2) * (180 / Math.PI);
    for (const t of [-1, 1]) {
      const len = Math.hypot(roofH, hd / 2) + 0.3;
      g.add(place(box(0.08, 0.22, len, PALETTE.white), { x, y: eaves + roofH / 2 - 0.2, z: hz + t * hd / 4 + t * 0.12, rx: t * slope }));
    }
  }

  // external chimney stack on the right gable end
  const cx = hx + hw / 2 + 0.45;
  g.add(place(box(1.0, eaves + roofH + 0.6 - y0, 1.2, surface('brick', PALETTE.brickDark, { size: 1 })), { x: cx, y: y0, z: hz }));
  g.add(place(box(1.2, 0.2, 1.4, PALETTE.stoneDark), { x: cx, y: eaves + roofH + 0.6 }));
  g.children.at(-1).position.z = hz;
  for (const dz of [-0.25, 0.25]) {
    g.add(place(cylinder(0.14, 0.17, 0.5, PALETTE.terracotta, 8), { x: cx, y: eaves + roofH + 0.8, z: hz + dz }));
  }
  // smoke puffs
  g.add(place(sphere(0.28, PALETTE.lightGrey, 6), { x: cx + 0.1, y: eaves + roofH + 1.6, z: hz - 0.25 }));
  g.add(place(sphere(0.2, PALETTE.lightGrey, 6), { x: cx + 0.35, y: eaves + roofH + 2.1, z: hz - 0.4 }));

  // front: door with little gabled hood, two windows with flower boxes
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.green, frame: PALETTE.white }), { x: hx, y: y0 + 0.3, z: front }));
  g.add(place(sphere(0.05, PALETTE.yellow, 5), { x: hx + 0.35, y: y0 + 1.3, z: front + 0.2 }));
  g.add(place(gableRoof({ w: 1.6, d: 0.9, h: 0.55, overhang: 0.1, ridge: 'z', material: slateMat, gableMaterial: PALETTE.white }), { x: hx, y: y0 + 2.55, z: front + 0.45 }));
  for (const s of [-1, 1]) g.add(place(box(0.08, 0.5, 0.08, PALETTE.white), { x: hx + s * 0.7, y: y0 + 2.05, z: front + 0.75 }));
  g.add(place(box(1.4, 0.15, 0.6, PALETTE.stone), { x: hx, y: y0, z: front + 0.3 }));
  for (const s of [-1, 1]) {
    g.add(place(cottageWindow({ flowers: true, seed: 20 + s }), { x: hx + s * 1.85, y: y0 + 1.1, z: front }));
  }
  // sides and back
  g.add(place(cottageWindow({ flowers: true, seed: 30 }), { x: hx - hw / 2, y: y0 + 1.1, z: hz, ry: -90 }));
  for (const s of [-1, 1]) g.add(place(cottageWindow({ seed: 40 + s }), { x: hx + s * 1.6, y: y0 + 1.1, z: back, ry: 180 }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.woodDark, frame: PALETTE.white }), { x: hx + 0.1, y: y0 + 0.3, z: back, ry: 180 }));

  // --- front garden ---
  const fenceZ = TILE / 2 - 0.25;
  // path from the door to the gate
  g.add(place(patch(1.1, fenceZ - front, 'paved'), { x: hx, y: y0, z: (front + fenceZ) / 2 }));
  // flower beds either side of the path, and along the fence
  g.add(place(flowerBed(2.6, 1.6, 3), { x: hx - 2.3, y: y0, z: front + 1.7 }));
  g.add(place(flowerBed(2.6, 1.6, 4), { x: hx + 2.3, y: y0, z: front + 1.7 }));
  g.add(place(flowerBed(3.0, 0.7, 5), { x: -2.95, y: y0, z: fenceZ - 0.55 }));
  g.add(place(flowerBed(3.0, 0.7, 6), { x: 2.55, y: y0, z: fenceZ - 0.55 }));
  // picket fence round the whole plot, gate gap at the path
  g.add(place(fence({ w: TILE - 0.5, d: TILE - 0.5, h: 0.85, style: 'picket', sides: ['back', 'left', 'right'] }), { y: y0 }));
  const leftLen = TILE / 2 - 0.25 + hx - 0.65, rightLen = TILE / 2 - 0.25 - hx - 0.65;
  g.add(place(fence({ w: leftLen, d: 0.1, h: 0.85, style: 'picket', sides: ['front'] }), { x: -TILE / 2 + 0.25 + leftLen / 2, y: y0, z: fenceZ - 0.05 }));
  g.add(place(fence({ w: rightLen, d: 0.1, h: 0.85, style: 'picket', sides: ['front'] }), { x: TILE / 2 - 0.25 - rightLen / 2, y: y0, z: fenceZ - 0.05 }));
  // gate posts with ball caps, gate swung open
  for (const s of [-1, 1]) {
    g.add(place(box(0.2, 1.1, 0.2, PALETTE.white), { x: hx + s * 0.62, y: y0, z: fenceZ }));
    g.add(place(sphere(0.13, PALETTE.white, 6), { x: hx + s * 0.62, y: y0 + 1.2, z: fenceZ }));
  }
  const gate = group();
  for (let i = 0; i < 4; i++) gate.add(place(box(0.08, 0.8, 0.06, PALETTE.white), { x: 0.12 + i * 0.27 }));
  gate.add(place(box(1.0, 0.07, 0.05, PALETTE.white), { x: 0.53, y: 0.25 }));
  gate.add(place(box(1.0, 0.07, 0.05, PALETTE.white), { x: 0.53, y: 0.65 }));
  g.add(place(gate, { x: hx + 0.55, y: y0, z: fenceZ, ry: 110 }));
  // red letterbox by the gate
  g.add(place(box(0.08, 1.0, 0.08, PALETTE.woodDark), { x: hx + 0.95, y: y0, z: fenceZ - 0.4 }));
  g.add(place(box(0.3, 0.3, 0.45, PALETTE.red), { x: hx + 0.95, y: y0 + 1.0, z: fenceZ - 0.4 }));

  // --- side & back yard ---
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 8, color: PALETTE.foliage }), { x: -3.4, y: y0, z: -3.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: -4.2, y: y0, z: -0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 10 }), { x: 4.2, y: y0, z: -4.2 }));
  // bird bath on the left lawn
  g.add(place(cylinder(0.1, 0.15, 0.7, PALETTE.stone, 8), { x: -4.1, y: y0, z: 0.9 }));
  g.add(place(cylinder(0.35, 0.22, 0.12, PALETTE.stone, 10), { x: -4.1, y: y0 + 0.7, z: 0.9 }));
  g.add(place(cylinder(0.28, 0.28, 0.02, PALETTE.water, 10), { x: -4.1, y: y0 + 0.81, z: 0.9 }));
  // woodpile under the chimney's lee and a rain barrel
  const logs = group();
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 4 - row; i++) {
      logs.add(place(cylinder(0.14, 0.14, 1.1, PALETTE.trunk, 6), { x: -0.45 + i * 0.3 + row * 0.15, y: 0.14 + row * 0.25, z: 0, rx: 90 }));
    }
  }
  g.add(place(logs, { x: 4.1, y: y0, z: -3.0, ry: 90 }));
  g.add(place(cylinder(0.35, 0.32, 0.9, PALETTE.woodDark, 10), { x: hx - hw / 2 - 0.45, y: y0, z: back + 0.5 }));
  g.add(place(cylinder(0.3, 0.3, 0.02, PALETTE.water, 10), { x: hx - hw / 2 - 0.45, y: y0 + 0.9, z: back + 0.5 }));
  // garden bench on the right lawn
  g.add(place(bench({ w: 1.3 }), { x: 4.2, y: y0, z: 0.4, ry: -90 }));
  return g;
}

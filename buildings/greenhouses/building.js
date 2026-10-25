import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, place, group, beam, pipeRun, mat, metal, surface,
  ShapeBuilder, tank, gableRoof, door, car, sign, tree, shade,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Four glass greenhouses in a row (ridges along z), each with a different crop,
// a water yard with tanks + pump house on the right, and a packing yard in front.

const GLASS = mat('#d4f1f7', { transparent: true, opacity: 0.3, roughness: 0.08, metalness: 0.25, side: THREE.DoubleSide, depthWrite: false });
const FRAME = mat(PALETTE.white, { roughness: 0.5 });
const KERB = mat(PALETTE.concrete);
const SOIL = mat(shade(PALETTE.dirt, -0.25));
const BED = mat(PALETTE.woodDark);

function blob(r, color, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(color));
  m.scale.set(sx, sy, sz);
  m.position.y = r * sy;
  return group(m);
}

// One crop bed (origin = base centre), length along z.
function cropBed(bw, bl, crop, seed) {
  const g = new THREE.Group();
  const bh = 0.3;
  g.add(box(bw, bh, bl, [BED, BED, SOIL, BED, BED, BED]));
  const y = bh;
  if (crop === 'tomato') {
    const step = 0.75;
    const n = Math.floor(bl / step);
    for (let i = 0; i < n; i++) {
      const z = -bl / 2 + step * (i + 0.5);
      g.add(place(box(0.03, 1.9, 0.03, PALETTE.wood), { y, z }));
      g.add(place(blob(0.32, PALETTE.foliageDark, 1, 1.5, 1), { y, z }));
      g.add(place(blob(0.26, PALETTE.foliage, 1, 1.3, 1), { y: y + 0.85, z }));
      const k = (i + seed) % 3;
      g.add(place(sphere(0.1, PALETTE.red, 6), { x: 0.24, y: y + 0.4 + k * 0.15, z: z + 0.05 }));
      g.add(place(sphere(0.1, k === 1 ? PALETTE.orange : PALETTE.red, 6), { x: -0.22, y: y + 0.85 - k * 0.1, z: z - 0.1 }));
    }
    // overhead training wire
    g.add(place(box(0.03, 0.03, bl, PALETTE.steelDark), { y: y + 1.9 }));
  } else if (crop === 'lettuce') {
    const step = 0.5;
    const n = Math.floor(bl / step);
    for (let i = 0; i < n; i++) {
      const z = -bl / 2 + step * (i + 0.5);
      for (const x of [-bw / 4, bw / 4]) {
        const c = (i + (x > 0 ? 1 : 0) + seed) % 4 === 0 ? '#5f9e3a' : '#8fd06a';
        g.add(place(blob(0.2, c, 1.1, 0.7, 1.1), { x, y, z }));
      }
    }
  } else if (crop === 'flowers') {
    const step = 0.45;
    const n = Math.floor(bl / step);
    const petals = [PALETTE.red, PALETTE.yellow, '#f08ac0', PALETTE.white, PALETTE.orange, PALETTE.purple];
    for (let i = 0; i < n; i++) {
      const z = -bl / 2 + step * (i + 0.5);
      for (const x of [-bw / 4, bw / 4]) {
        g.add(place(blob(0.19, PALETTE.foliage, 1, 0.9, 1), { x, y, z }));
        const c = petals[Math.floor(i / 3 + (x > 0 ? 2 : 0) + seed) % petals.length];
        g.add(place(blob(0.13, c, 1.2, 0.6, 1.2), { x, y: y + 0.24, z }));
      }
    }
  } else {
    // cucumbers: tall leafy green walls on string trellis
    const step = 0.6;
    const n = Math.floor(bl / step);
    for (let i = 0; i < n; i++) {
      const z = -bl / 2 + step * (i + 0.5);
      g.add(place(blob(0.3, (i + seed) % 2 ? PALETTE.foliageLight : PALETTE.foliage, 0.9, 2.4, 1.1), { y, z }));
      g.add(place(box(0.08, 0.35, 0.08, '#6a9a2c'), { x: 0.2, y: y + 0.5 + (i % 3) * 0.3, z }));
    }
    g.add(place(box(0.03, 0.03, bl, PALETTE.steelDark), { y: y + 1.75 }));
  }
  return g;
}

// Glass greenhouse, ridge along z, origin = centre of its base.
function greenhouse({ w, d, eave = 2.3, rise = 1.4, crop, seed = 1 }) {
  const g = new THREE.Group();
  const kerb = 0.35;
  const W = w / 2, D = d / 2, e = eave, t = eave + rise;

  // concrete kerb + floor
  g.add(box(w + 0.12, kerb, d + 0.12, KERB));

  // crops inside: two beds either side of a central aisle
  const bw = w * 0.32, bl = d - 1.3;
  g.add(place(cropBed(bw, bl, crop, seed), { x: -w * 0.25, y: kerb, z: -0.35 }));
  g.add(place(cropBed(bw, bl, crop, seed + 1), { x: w * 0.25, y: kerb, z: -0.35 }));

  // glass shell
  const s = new ShapeBuilder();
  s.quad([-W, 0, D], [W, 0, D], [W, e, D], [-W, e, D]);
  s.quad([W, 0, -D], [-W, 0, -D], [-W, e, -D], [W, e, -D]);
  s.quad([W, 0, D], [W, 0, -D], [W, e, -D], [W, e, D]);
  s.quad([-W, 0, -D], [-W, 0, D], [-W, e, D], [-W, e, -D]);
  s.quad([W, e, D], [W, e, -D], [0, t, -D], [0, t, D]);
  s.quad([-W, e, -D], [-W, e, D], [0, t, D], [0, t, -D]);
  s.tri([-W, e, D], [W, e, D], [0, t, D]);
  s.tri([W, e, -D], [-W, e, -D], [0, t, -D]);
  const shell = new THREE.Mesh(s.build(), GLASS);
  shell.renderOrder = 1;
  g.add(place(shell, { y: kerb }));

  // white aluminium frame
  const f = new THREE.Group();
  const bays = Math.max(2, Math.round(d / 1.2));
  for (let i = 0; i <= bays; i++) {
    const z = -D + (d * i) / bays;
    for (const sx of [-1, 1]) {
      f.add(place(box(0.08, e, 0.08, FRAME), { x: sx * W, z }));
      f.add(beam([sx * W, e, z], [0, t, z], 0.07, FRAME));
    }
  }
  for (const sx of [-1, 1]) {
    f.add(place(box(0.1, 0.1, d + 0.08, FRAME), { x: sx * W, y: e - 0.05 }));
    f.add(place(box(0.06, 0.06, d, FRAME), { x: sx * W, y: e * 0.45 }));
    // gutter
    f.add(place(box(0.16, 0.12, d + 0.3, PALETTE.steel), { x: sx * (W + 0.08), y: e - 0.08 }));
  }
  f.add(place(box(0.12, 0.12, d + 0.1, FRAME), { y: t - 0.06 }));
  // gable ends: mullions, transom, door on the front
  for (const sz of [-1, 1]) {
    const z = sz * D;
    f.add(place(box(w, 0.08, 0.08, FRAME), { y: e - 0.04, z }));
    f.add(place(box(w, 0.06, 0.06, FRAME), { y: e * 0.45, z }));
    for (const x of [-W * 0.55, W * 0.55]) {
      const top = e + rise * (1 - Math.abs(x) / W);
      f.add(place(box(0.07, top, 0.07, FRAME), { x, z }));
    }
  }
  // sliding door (half open) on the front gable
  f.add(place(box(0.08, 2.1, 0.08, FRAME), { x: -0.55, z: D + 0.02 }));
  f.add(place(box(0.08, 2.1, 0.08, FRAME), { x: 0.55, z: D + 0.02 }));
  f.add(place(box(1.2, 0.08, 0.1, FRAME), { y: 2.1, z: D + 0.02 }));
  f.add(place(box(0.65, 2.0, 0.05, mat(PALETTE.glassTeal, { roughness: 0.2, metalness: 0.3 })), { x: 0.85, z: D + 0.1 }));
  g.add(place(f, { y: kerb }));

  // roof vents propped open along both slopes
  const ang = (Math.atan2(rise, W) * 180) / Math.PI;
  const ventM = mat('#b8dbe4', { roughness: 0.2, metalness: 0.3 });
  for (let i = 0; i < 3; i++) {
    const z = -D + d * (0.2 + i * 0.3);
    for (const sx of [-1, 1]) {
      if ((i + seed + (sx > 0 ? 1 : 0)) % 2) continue;
      const vent = new THREE.Group();
      const leaf = box(W * 0.62, 0.05, 1.1, ventM);
      leaf.geometry = leaf.geometry.clone().translate(sx * W * 0.31, 0, 0);
      vent.add(leaf);
      vent.add(place(box(W * 0.62, 0.07, 0.06, FRAME), { x: sx * W * 0.31, z: 0.55 }));
      vent.add(place(box(W * 0.62, 0.07, 0.06, FRAME), { x: sx * W * 0.31, z: -0.55 }));
      vent.rotation.z = (-sx * (ang + 14) * Math.PI) / 180;
      vent.position.set(0, kerb + t + 0.02, z);
      g.add(vent);
    }
  }
  return g;
}

// Crate of produce (origin = base centre).
function crate(color) {
  return group(
    box(0.6, 0.4, 0.45, PALETTE.wood),
    place(box(0.5, 0.06, 0.36, color), { y: 0.38 }),
  );
}

// Water tank with hoop bands and a ladder.
function waterTank({ radius, h, color, roof = 'cone' }) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.6 });
  g.add(tank({ radius, h, material: m, roof, segments: 18 }));
  const band = mat(shade(color, -0.25));
  for (let i = 1; i <= 3; i++) g.add(place(cylinder(radius + 0.04, radius + 0.04, 0.12, band, 18), { y: (h * i) / 4 }));
  g.add(place(cylinder(radius + 0.2, radius + 0.2, 0.2, KERB, 18), { y: -0.05 }));
  // ladder on the +z side
  const lm = metal(PALETTE.steel);
  for (const x of [-0.22, 0.22]) g.add(place(box(0.05, h + 0.4, 0.05, lm), { x, z: radius + 0.12 }));
  for (let y = 0.4; y < h + 0.3; y += 0.4) g.add(place(box(0.44, 0.04, 0.05, lm), { y, z: radius + 0.12 }));
  return g;
}

// IBC tote: white cube in a steel cage on a pallet.
function tote() {
  const lm = metal(PALETTE.steelLight);
  const g = group(
    box(1.1, 0.15, 1.1, PALETTE.wood),
    place(box(1.0, 0.95, 1.0, mat('#f2f2ea', { roughness: 0.6 })), { y: 0.15 }),
    place(cylinder(0.15, 0.15, 0.1, PALETTE.black, 8), { y: 1.1 }),
  );
  for (const [x, z] of [[-0.52, -0.52], [0.52, -0.52], [-0.52, 0.52], [0.52, 0.52]]) g.add(place(box(0.05, 1.0, 0.05, lm), { x, y: 0.15, z }));
  for (const y of [0.55, 1.12]) {
    g.add(place(box(1.08, 0.04, 0.04, lm), { y, z: 0.52 }));
    g.add(place(box(1.08, 0.04, 0.04, lm), { y, z: -0.52 }));
    g.add(place(box(0.04, 0.04, 1.08, lm), { x: 0.52, y }));
    g.add(place(box(0.04, 0.04, 1.08, lm), { x: -0.52, y }));
  }
  return g;
}

function wheelbarrow() {
  const g = new THREE.Group();
  g.add(place(cylinder(0.18, 0.18, 0.08, PALETTE.black, 10), { x: 0.55, y: 0.18, rx: 90 }));
  g.add(place(box(0.7, 0.3, 0.5, PALETTE.green), { y: 0.3 }));
  g.add(place(box(0.6, 0.06, 0.4, PALETTE.foliageLight), { y: 0.58 }));
  for (const z of [-0.18, 0.18]) g.add(beam([0.3, 0.3, z], [-0.75, 0.55, z], 0.05, PALETTE.steelDark));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // gravel yard along the front and service area on the right
  g.add(place(patch(19.6, 2.1, 'gravel'), { y: y0, z: 3.85 }));
  g.add(place(patch(4.9, 7.6, 'gravel'), { x: 7.45, y: y0, z: -0.8 }));
  // paths between the greenhouses
  for (const x of [-7.95, -4.25, -0.55, 3.15]) g.add(place(patch(0.5, 7.4, 'concrete'), { x: x + 1.85, y: y0, z: -0.95 }));

  // four greenhouses in a row
  const crops = ['tomato', 'lettuce', 'flowers', 'cucumber'];
  const ghW = 3.4, ghD = 7.4, ghZ = -1.0;
  const xs = [-8.05, -4.35, -0.65, 3.05];
  xs.forEach((x, i) => g.add(place(greenhouse({ w: ghW, d: ghD, crop: crops[i], seed: i * 3 + 1 }), { x, y: y0, z: ghZ })));

  // water yard: big rainwater tank, smaller nutrient tank, pump house, totes
  g.add(place(waterTank({ radius: 1.35, h: 3.4, color: '#3f7f4f' }), { x: 6.7, y: y0, z: -3.2 }));
  g.add(place(waterTank({ radius: 0.85, h: 2.6, color: '#3a6fb0', roof: 'dome' }), { x: 9.0, y: y0, z: -3.75 }));
  // pump house
  const ph = new THREE.Group();
  ph.add(box(2.2, 2.2, 1.8, surface('brick', PALETTE.brick, { size: 1 })));
  ph.add(place(gableRoof({ w: 2.2, d: 1.8, h: 0.8, overhang: 0.2, ridge: 'x', material: surface('corrugated', PALETTE.roofGreen, { size: 1 }), gableMaterial: PALETTE.brick }), { y: 2.2 }));
  ph.add(place(door({ w: 0.8, h: 1.8, color: PALETTE.roofGreen }), { x: -0.4, z: 0.9 }));
  ph.add(place(box(0.5, 0.4, 0.1, mat(PALETTE.yellow)), { x: 0.55, y: 1.3, z: 0.92 }));
  g.add(place(ph, { x: 8.6, y: y0, z: -0.9 }));
  g.add(place(tote(), { x: 6.2, y: y0, z: -0.6 }));
  g.add(place(tote(), { x: 6.2, y: y0, z: 0.65 }));
  g.add(place(tote(), { x: 6.2, y: y0 + 1.15, z: 0.65 }));

  // irrigation pipes: tanks -> pump house -> along the back of the greenhouses
  const pm = mat(PALETTE.steelLight, { roughness: 0.5 });
  const py = y0 + 0.5, bz = -4.85;
  g.add(pipeRun([[6.7, py, -1.75], [6.7, py, -1.4], [7.5, py, -1.4]], 0.08, pm));
  g.add(pipeRun([[9.0, py, -2.85], [9.0, py, -1.9]], 0.08, pm));
  g.add(pipeRun([[7.6, py + 0.4, -1.8], [7.6, py + 0.4, bz + 0.1], [-9.8, py + 0.4, bz + 0.1]], 0.08, mat(PALETTE.blue, { roughness: 0.5 })));
  for (const x of xs) g.add(pipeRun([[x, py + 0.4, bz + 0.1], [x, py + 0.4, ghZ - ghD / 2 - 0.02]], 0.06, mat(PALETTE.blue, { roughness: 0.5 })));

  // packing yard: crates, pallets, wheelbarrow, bench
  const crateColors = [PALETTE.red, '#8fd06a', '#f08ac0', PALETTE.foliageLight, PALETTE.yellow];
  const stack = (x, z, n, k) => {
    for (let i = 0; i < n; i++) g.add(place(crate(crateColors[(k + i) % crateColors.length]), { x: x + (i % 2) * 0.65, y: y0 + Math.floor(i / 2) * 0.46, z }));
  };
  g.add(place(box(1.3, 0.14, 1.0, PALETTE.wood), { x: -8.7, y: y0, z: 3.7 }));
  stack(-9.05, 3.7, 4, 0);
  stack(-2.6, 3.55, 3, 1);
  stack(1.0, 4.4, 2, 2);
  stack(-5.4, 4.3, 2, 4);
  g.add(place(wheelbarrow(), { x: -6.3, y: y0, z: 3.8, ry: 30 }));

  // delivery van, sign, a few trees
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 6.3, y: y0 + 0.05, z: 3.75, s: 0.72 }));
  const sg = group(
    place(box(0.1, 1.6, 0.1, PALETTE.woodDark), { x: -1.0 }),
    place(box(0.1, 1.6, 0.1, PALETTE.woodDark), { x: 1.0 }),
    place(sign({ text: 'FRESH VEG', w: 2.4, h: 0.7, bg: PALETTE.green, fg: '#ffffff', double: true }), { y: 1.1 }),
  );
  g.add(place(sg, { x: -1.0, y: y0, z: 4.75 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 8 }), { x: 9.2, y: y0, z: 4.1 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: 9.4, y: y0, z: 1.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 10 }), { x: 4.95, y: y0, z: 2.75 }));
  return g;
}

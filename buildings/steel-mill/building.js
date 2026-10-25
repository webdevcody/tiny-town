import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, cone, dome, place, group,
  lattice, beam, pipe, pipeRun, smokestack, tank, sign, streetLamp, fence, tree,
  surface, mat, metal, emissive, shade,
} from '../../src/lib/index.js';

// 3x2 tiles (30 x 20 m). Front (street) faces +z.
// Left: blast furnace in a braced frame with hot-blast stoves and a cast house.
// Right: rusty rolling-mill shed. Front: rail siding, conveyor ramps, ore/coke/slag heaps.

const RUST = '#8d4a2a';
const RUST_DARK = '#6e3a22';
const SLAG = '#4b4845';
const ORE = '#8e4128';
const COKE = '#2e2c2b';

// Enclosed conveyor gallery from a to b ([x, y, z] of the gallery floor centre line).
function gallery(a, b, { w = 1.6, h = 1.5, material, roofMaterial } = {}) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, len), material);
  body.position.y = h / 2;
  g.add(body);
  const lid = new THREE.Mesh(new THREE.BoxGeometry(w + 0.3, 0.15, len), roofMaterial ?? material);
  lid.position.y = h + 0.07;
  g.add(lid);
  // dark belt opening strip along both sides
  for (const s of [-1, 1]) {
    const strip = new THREE.Mesh(new THREE.BoxGeometry(0.05, h * 0.35, len - 0.4), mat(PALETTE.glassDark));
    strip.position.set(s * (w / 2 + 0.02), h * 0.62, 0);
    g.add(strip);
  }
  g.position.copy(A).add(B).multiplyScalar(0.5);
  g.lookAt(B); // +z along the slope, no roll
  return g;
}

// Trestle under a conveyor: two posts with cross braces, top at height h.
function trestle(h, w = 2.2, material) {
  const m = material ?? metal(PALETTE.steelDark);
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(place(box(0.3, h, 0.3, m), { x: (s * w) / 2 }));
  for (let y = 2; y < h - 0.5; y += 3) {
    g.add(place(box(w, 0.2, 0.2, m), { y }));
    if (y + 3 < h) g.add(beam([-w / 2, y, 0], [w / 2, Math.min(y + 3, h - 0.3), 0], 0.12, m));
  }
  return g;
}

// Low lumpy heap (slag / ore / coke): squashed low-poly dome.
function heap({ r = 2, h = 1.6, sx = 1, sz = 1, color, segments = 9 }) {
  const m = mat(color, { roughness: 1 });
  const d = dome({ radius: r, height: h, material: m, segments });
  d.scale.set(sx, 1, sz);
  return d;
}

// Horizontal torus ring (bustle pipe, shell bands).
function ring(R, r, material, seg = 24) {
  const t = new THREE.Mesh(new THREE.TorusGeometry(R, r, 6, seg), material);
  t.rotation.x = Math.PI / 2;
  return group(t); // wrapped so place() rotations don't undo the lay-flat
}

// Small yellow shunting locomotive, length along X (~4.2 m).
function shunter() {
  const g = new THREE.Group();
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  g.add(place(box(4.2, 0.5, 1.9, mat(PALETTE.darkGrey)), { y: 0.3 }));
  g.add(place(box(2.6, 1.5, 1.4, body), { x: -0.7, y: 0.8 }));
  g.add(place(box(1.4, 2.3, 1.9, body), { x: 1.3, y: 0.8 }));
  g.add(place(box(1.5, 0.15, 2.0, mat(PALETTE.darkGrey)), { x: 1.3, y: 3.1 }));
  for (const s of [-1, 1]) g.add(place(box(1.0, 0.7, 0.05, mat(PALETTE.glassDark)), { x: 1.3, y: 2.1, z: s * 0.96 }));
  g.add(place(box(4.0, 0.18, 0.05, surface('hazard', PALETTE.yellow, { size: 1 })), { y: 0.45, z: 0.97 }));
  g.add(place(cylinder(0.12, 0.12, 0.5, mat(PALETTE.black), 8), { x: -1.6, y: 2.3 }));
  return g;
}

// Hot-blast (Cowper) stove: tall steel cylinder with domed top.
function stove({ r = 1.55, h = 14 }) {
  const m = metal('#9aa3aa', { roughness: 0.55 });
  const g = group(
    cylinder(r + 0.25, r + 0.25, 0.8, mat(PALETTE.concreteDark), 14),
    place(cylinder(r, r, h, m, 14), { y: 0.8 }),
    place(dome({ radius: r, height: r * 0.8, material: m, segments: 14 }), { y: h + 0.8 }),
  );
  for (const y of [4, 8.5, 12.5]) g.add(place(ring(r + 0.05, 0.1, metal(PALETTE.steelDark), 14), { y }));
  // little top platform rail
  g.add(place(ring(r + 0.35, 0.06, metal(PALETTE.yellow), 14), { y: h + 0.6 }));
  return g;
}

// Torpedo ladle car on a short rail bogie pair, along X.
function torpedoCar() {
  const g = new THREE.Group();
  const shell = mat('#3c3a39', { roughness: 0.8 });
  const body = cylinder(1.15, 1.15, 4.4, shell, 12);
  body.rotation.z = Math.PI / 2;
  body.position.set(2.2, 1.9, 0);
  g.add(body);
  for (const s of [-1, 1]) {
    const c = cone(1.15, 1.4, shell, 12);
    c.rotation.z = (-s * Math.PI) / 2;
    c.position.set(s * 2.2, 1.9, 0);
    g.add(c);
    g.add(place(box(1.8, 0.7, 1.9, mat(PALETTE.darkGrey)), { x: s * 2.4, y: 0.1 }));
  }
  g.add(place(box(6.6, 0.25, 1.6, mat(PALETTE.rust)), { y: 0.75 }));
  // glowing mouth
  g.add(place(box(1.2, 0.5, 1.0, mat('#2a2828')), { y: 2.85 }));
  g.add(place(box(0.9, 0.1, 0.7, emissive('#ff8a1e', 1.6)), { y: 3.32 }));
  return g;
}

// Flatbed lorry carrying steel coils, length along X (cab at +x).
function coilLorry(color) {
  const g = new THREE.Group();
  g.add(place(box(2.2, 2.4, 2.4, mat(color, { roughness: 0.5 })), { x: 3.5, y: 0.5 }));
  g.add(place(box(0.05, 0.9, 2.0, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.62, y: 1.7 }));
  g.add(place(box(7, 0.35, 2.4, mat(PALETTE.darkGrey)), { x: -1.2, y: 0.8 }));
  const coilM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const x of [-3.6, -1.2, 1.2]) {
    const c = cylinder(0.85, 0.85, 1.4, coilM, 14);
    c.rotation.x = Math.PI / 2;
    c.position.set(x, 2.0, 0);
    g.add(c);
    const core = cylinder(0.32, 0.32, 1.42, mat(PALETTE.darkGrey), 10);
    core.rotation.x = Math.PI / 2;
    core.position.set(x, 2.0, 0);
    g.add(core);
  }
  const wheelM = mat(PALETTE.black);
  for (const x of [3.5, -2.4, -3.8]) for (const sz of [-1, 1]) {
    const w = cylinder(0.5, 0.5, 0.35, wheelM, 10);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.5, sz * 1.05);
    g.add(w);
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 2], 'gravel'));

  const rustCorr = surface('corrugated', RUST, { size: 2, roughness: 0.85 });
  const rustCorrDark = surface('corrugated', RUST_DARK, { size: 2, roughness: 0.9 });
  const steelDarkM = metal(PALETTE.steelDark);
  const frameM = metal('#7a4630', { roughness: 0.7 });
  const pipeM = metal(PALETTE.steel, { roughness: 0.5 });
  const gasM = metal(PALETTE.yellow, { roughness: 0.6 });

  // ground: concrete apron in front of the shed, asphalt yard road
  g.add(place(patch(14.6, 5.2, 'concrete'), { x: 7.7, y: y0, z: 2.0 }));
  g.add(place(patch(12, 9, 'concrete'), { x: -7, y: y0, z: -4.5 }));

  // ---------------------------------------------------------------- blast furnace
  const FX = -7, FZ = -3;
  const shellM = metal('#6b4a3a', { roughness: 0.75 });
  const shellDark = metal('#4f3a30', { roughness: 0.8 });
  g.add(place(cylinder(3.9, 4.1, 1.0, mat(PALETTE.concreteDark), 16), { x: FX, y: y0, z: FZ }));
  g.add(place(cylinder(2.9, 2.9, 4.2, shellDark, 16), { x: FX, y: y0 + 1, z: FZ }));
  g.add(place(cylinder(3.4, 2.9, 2.4, shellM, 16), { x: FX, y: y0 + 5.2, z: FZ }));
  g.add(place(cylinder(2.3, 3.4, 11, shellM, 16), { x: FX, y: y0 + 7.6, z: FZ }));
  g.add(place(cylinder(1.1, 2.3, 2.2, shellDark, 16), { x: FX, y: y0 + 18.6, z: FZ }));
  for (const [y, r] of [[2.4, 2.98], [4.2, 2.98], [10, 3.1], [13.5, 2.8], [17, 2.48]]) {
    g.add(place(ring(r, 0.14, steelDarkM, 18), { x: FX, y: y0 + y, z: FZ }));
  }
  // bustle pipe + tuyere stubs
  const bustleY = y0 + 7.4;
  g.add(place(ring(4.2, 0.5, pipeM, 24), { x: FX, y: bustleY, z: FZ }));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    g.add(pipe([FX + c * 4.2, bustleY, FZ + s * 4.2], [FX + c * 3.0, y0 + 4.6, FZ + s * 3.0], 0.18, pipeM));
  }
  // braced frame around the furnace + work platforms
  g.add(place(lattice({ w: 9, d: 9, h: 21, topW: 6.4, topD: 6.4, segments: 4, thickness: 0.32, material: frameM }), { x: FX, y: y0, z: FZ }));
  for (const [y, s] of [[10.5, 8.3], [15.75, 7.6]]) {
    for (const [dx, dz, w, d] of [[0, s / 2, s, 0.9], [0, -s / 2, s, 0.9], [s / 2, 0, 0.9, s], [-s / 2, 0, 0.9, s]]) {
      g.add(place(box(w, 0.2, d, mat(PALETTE.darkGrey)), { x: FX + dx, y: y0 + y, z: FZ + dz }));
    }
  }
  // top platform, charging house, uptakes
  g.add(place(box(7, 0.35, 7, mat(PALETTE.darkGrey)), { x: FX, y: y0 + 21, z: FZ }));
  g.add(place(box(3.4, 2.6, 3.4, rustCorr), { x: FX, y: y0 + 21.35, z: FZ }));
  g.add(place(gableRoof({ w: 3.4, d: 3.4, h: 1, overhang: 0.2, material: mat(PALETTE.roofGrey), gableMaterial: RUST }), { x: FX, y: y0 + 23.95, z: FZ }));
  const upTop = y0 + 27.5;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.add(pipeRun([[FX + sx * 1.5, y0 + 19.2, FZ + sz * 1.5], [FX + sx * 1.5, upTop - 1.2, FZ + sz * 1.5], [FX + sx * 0.9, upTop, FZ + sz * 0.9]], 0.38, pipeM));
  }
  g.add(place(box(2.4, 0.9, 2.4, pipeM), { x: FX, y: upTop - 0.3, z: FZ }));
  for (const [sx, sz] of [[1, 1], [-1, -1]]) g.add(place(cylinder(0.25, 0.25, 1.6, steelDarkM, 8), { x: FX + sx * 0.7, y: upTop + 0.6, z: FZ + sz * 0.7 }));
  // downcomer to the dust catcher
  const DX = -1.2, DZ = -4.2;
  g.add(pipeRun([[FX + 1, upTop, FZ - 0.3], [DX, y0 + 13.5, DZ]], 0.55, pipeM));
  g.add(place(tank({ radius: 1.3, h: 4.2, roof: 'cone', legs: 4, legHeight: 6, material: metal('#8a8f94', { roughness: 0.6 }) }), { x: DX, y: y0, z: DZ }));
  g.add(place(cone(1.3, 1.8, metal('#8a8f94'), 16), { x: DX, y: y0 + 6, z: DZ, rx: 180 }));
  g.add(pipe([DX, y0 + 13.4, DZ], [DX, y0 + 11, DZ], 0.5, pipeM));

  // hot-blast stoves + hot blast main into the bustle pipe
  const stoves = [[-13.2, -8.2], [-10, -8.3], [-13.2, -4.8]];
  for (const [x, z] of stoves) g.add(place(stove({ r: 1.5, h: 14 }), { x, y: y0, z }));
  g.add(pipeRun([[-13.2, y0 + 9.5, -4.8], [-13.2, y0 + 9.5, -8.2], [-10, y0 + 9.5, -8.3], [FX, y0 + 9.5, -8.3], [FX, bustleY, FZ - 4.2]], 0.5, metal(PALETTE.steelLight, { roughness: 0.5 })));
  // flue to the chimney along the back
  g.add(pipeRun([[-13.2, y0 + 2, -9.4], [-1.4, y0 + 2, -9.4]], 0.45, steelDarkM));

  // chimney stack
  g.add(place(smokestack({ radius: 1.2, topRadius: 0.85, h: 30, color: PALETTE.brick, bandColor: PALETTE.white, bands: 2 }), { x: -1.4, y: y0, z: -8.6 }));
  const smokeM = mat('#d9d6d0', { roughness: 1, transparent: true, opacity: 0.85 });
  for (const [dx, dy, dz, r] of [[0.2, 31.3, 0, 1.0], [1.1, 32.6, 0.5, 1.3], [2.4, 33.9, 0.9, 1.6], [4.0, 34.8, 1.2, 1.4]]) {
    const puff = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), smokeM);
    puff.position.set(-1.4 + dx, y0 + dy, -8.6 + dz);
    g.add(puff);
  }

  // cast house in front of the furnace
  const CX = -7, CZ = 2.6, CW = 10, CD = 4.2;
  g.add(place(facadeBlock({ w: CW, d: CD, h: 5, floorHeight: 5, style: 'industrial', wall: '#7c3d26', glass: PALETTE.glassDark, bay: 2.5, seed: 4, roof: RUST }), { x: CX, y: y0, z: CZ }));
  g.add(place(gableRoof({ w: CW, d: CD, h: 1.6, overhang: 0.35, ridge: 'x', material: rustCorrDark, gableMaterial: '#7c3d26' }), { x: CX, y: y0 + 5, z: CZ }));
  // tapping runner spout and molten stream into the torpedo car
  const hotM = emissive('#ff7a12', 1.8);
  g.add(place(box(1.2, 2.6, 0.12, mat('#2a2828')), { x: -7, y: y0 + 0.4, z: CZ + CD / 2 }));
  g.add(place(box(0.7, 0.35, 1.2, mat(PALETTE.darkGrey)), { x: -7, y: y0 + 3.5, z: CZ + CD / 2 + 0.5 }));
  g.add(place(box(0.4, 0.08, 1.1, hotM), { x: -7, y: y0 + 3.86, z: CZ + CD / 2 + 0.5 }));
  g.add(place(box(0.25, 0.7, 0.25, hotM), { x: -7, y: y0 + 3.0, z: CZ + CD / 2 + 1.1 }));
  g.add(place(sign({ text: 'TINY STEEL', w: 3.6, h: 0.9, bg: '#1d2a44', fg: '#ffd23a' }), { x: -10, y: y0 + 3.7, z: CZ + CD / 2 }));

  // rail siding with a torpedo ladle car
  const railZ = 6.6;
  for (let x = -14.6; x <= -0.6; x += 1.0) g.add(place(box(0.35, 0.12, 2.3, mat(PALETTE.woodDark)), { x, y: y0, z: railZ }));
  for (const s of [-1, 1]) g.add(place(box(14.6, 0.14, 0.12, metal(PALETTE.steel)), { x: -7.6, y: y0 + 0.12, z: railZ + s * 0.72 }));
  g.add(place(box(0.4, 0.8, 2.4, mat(PALETTE.red)), { x: -0.5, y: y0, z: railZ }));
  g.add(place(torpedoCar(), { x: -7, y: y0 + 0.26, z: railZ }));
  g.add(place(shunter(), { x: -12.6, y: y0 + 0.26, z: railZ }));

  // ---------------------------------------------------------------- rolling-mill shed
  const SX = 8.25, SZ = -5.3, SW = 12.9, SD = 8.8, SH = 8;
  g.add(place(facadeBlock({ w: SW, d: SD, h: SH, floorHeight: 4, style: 'industrial', wall: RUST, glass: PALETTE.glassSky, bay: 3.2, seed: 9, roof: RUST_DARK }), { x: SX, y: y0, z: SZ }));
  g.add(place(gableRoof({ w: SW, d: SD, h: 2.6, overhang: 0.4, ridge: 'x', material: rustCorrDark, gableMaterial: RUST }), { x: SX, y: y0 + SH, z: SZ }));
  // roof monitor (ventilation lantern) along the ridge
  g.add(place(box(9, 1.1, 1.8, mat(PALETTE.glassDark)), { x: SX, y: y0 + SH + 2.2, z: SZ }));
  g.add(place(gableRoof({ w: 9, d: 1.8, h: 0.6, overhang: 0.3, ridge: 'x', material: rustCorr, gableMaterial: RUST_DARK }), { x: SX, y: y0 + SH + 3.3, z: SZ }));
  // big sliding doors + lean-to annex on the right
  for (const x of [4.6, 11.4]) {
    g.add(place(box(3.6, 5.2, 0.12, surface('corrugated', PALETTE.steel, { size: 1.5 })), { x, y: y0, z: SZ + SD / 2 + 0.02 }));
    g.add(place(box(4.0, 0.3, 0.3, mat(PALETTE.yellow)), { x, y: y0 + 5.2, z: SZ + SD / 2 + 0.15 }));
  }
  g.add(place(sign({ text: 'ROLLING MILL', w: 5.2, h: 0.9, bg: PALETTE.white, fg: '#7c3325' }), { x: 8, y: y0 + 6.2, z: SZ + SD / 2 + 0.1 }));
  // roof extractor vents
  for (const x of [3.6, 12.9]) {
    g.add(place(cylinder(0.55, 0.55, 2.0, metal(PALETTE.steelLight), 10), { x, y: y0 + SH + 1.0, z: SZ - 2.4 }));
    g.add(place(cone(0.85, 0.6, metal(PALETTE.steelDark), 10), { x, y: y0 + SH + 3.0, z: SZ - 2.4 }));
  }
  // rusty roof patches
  for (const [x, z] of [[5, -3.2], [11.5, -7.3]]) g.add(place(box(2.2, 0.06, 1.6, mat('#a85a30')), { x, y: y0 + SH + 1.1, z, rx: z > SZ ? 16.5 : -16.5 }));

  // gas main along the shed front, on posts, with a yellow coke-gas line
  const gasY = y0 + 9.6, gasZ = 0.3;
  g.add(pipeRun([[DX, y0 + 8, DZ], [DX, gasY, gasZ], [14.5, gasY, gasZ], [14.5, y0 + 0.6, gasZ]], 0.42, pipeM));
  g.add(pipeRun([[-2.4, y0 + 0.6, gasZ + 0.9], [-2.4, gasY - 0.9, gasZ + 0.9], [14.0, gasY - 0.9, gasZ + 0.9], [14.0, y0 + 0.6, gasZ + 0.9]], 0.2, gasM));
  for (const x of [2.4, 8, 13.4]) {
    g.add(place(box(0.3, gasY - y0, 0.3, steelDarkM), { x, y: y0, z: gasZ + 0.45 }));
    g.add(place(box(0.3, 0.25, 1.6, steelDarkM), { x, y: gasY - 0.55, z: gasZ + 0.45 }));
  }

  // ---------------------------------------------------------------- conveyor ramps
  const galM = surface('corrugated', '#b36a2f', { size: 1.5, roughness: 0.8 });
  const T = [0.6, 6.6]; // transfer tower (x, z)
  const tH = 13;
  g.add(place(lattice({ w: 2.6, d: 2.6, h: tH, segments: 4, thickness: 0.22, material: steelDarkM }), { x: T[0], y: y0, z: T[1] }));
  g.add(place(box(3.2, 2.6, 3.2, rustCorr), { x: T[0], y: y0 + tH, z: T[1] }));
  g.add(place(box(3.6, 0.25, 3.6, mat(PALETTE.roofGrey)), { x: T[0], y: y0 + tH + 2.6, z: T[1] }));
  // ramp 1: ground hopper (front right) up to the transfer tower
  const hop = [13.4, 6.6];
  g.add(gallery([hop[0] - 0.8, y0 + 2.6, hop[1]], [T[0] + 1.6, y0 + tH + 0.3, T[1]], { material: galM, roofMaterial: mat(PALETTE.roofGrey) }));
  for (const x of [9.5, 5.5]) {
    const t = (hop[0] - 0.8 - x) / (hop[0] - 0.8 - T[0] - 1.6);
    const h = 2.6 + t * (tH + 0.3 - 2.6);
    g.add(place(trestle(h, 2.0, steelDarkM), { x, y: y0, z: T[1], ry: 90 }));
  }
  // hopper on legs
  g.add(place(box(2.6, 1.8, 2.6, mat(PALETTE.steelDark)), { x: hop[0], y: y0 + 1.2, z: hop[1] }));
  g.add(place(box(3.0, 0.2, 3.0, mat(PALETTE.yellow)), { x: hop[0], y: y0 + 3.0, z: hop[1] }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.25, 1.2, 0.25, steelDarkM), { x: hop[0] + sx, y: y0, z: hop[1] + sz }));
  // ramp 2: transfer tower to the furnace top (skip incline)
  const topIn = [FX + 2.6, y0 + 21.5, FZ + 2.6];
  g.add(gallery([T[0] - 1.4, y0 + tH + 0.4, T[1] - 1.2], topIn, { material: galM, roofMaterial: mat(PALETTE.roofGrey) }));

  // ---------------------------------------------------------------- yard heaps and props
  // slag heaps (front left) with a freshly dumped glowing streak
  g.add(place(heap({ r: 2.2, h: 1.9, sx: 1.5, sz: 0.62, color: SLAG }), { x: -11, y: y0, z: 8.6 }));
  g.add(place(heap({ r: 1.8, h: 1.4, sx: 1.4, sz: 0.7, color: shade(SLAG, -0.12) }), { x: -5.8, y: y0, z: 8.7 }));
  g.add(place(heap({ r: 0.8, h: 0.5, sx: 1.3, sz: 0.6, color: '#ff6a14', segments: 7 }), { x: -10.2, y: y0 + 1.4, z: 8.7 }));
  g.add(place(dome({ radius: 0.6, height: 0.3, material: emissive('#ff7a12', 1.5), segments: 7 }), { x: -10.2, y: y0 + 1.6, z: 8.8 }));
  // coke and iron-ore stockpiles (front right) by the hopper
  g.add(place(heap({ r: 2, h: 1.7, sx: 1.4, sz: 0.65, color: COKE }), { x: 2.6, y: y0, z: 8.7 }));
  g.add(place(heap({ r: 2.2, h: 1.9, sx: 1.5, sz: 0.62, color: ORE }), { x: 9, y: y0, z: 8.6 }));
  g.add(place(heap({ r: 1.4, h: 1.2, color: ORE }), { x: 13.3, y: y0, z: 8.7 }));

  // lorry with steel coils and stacked billets on the apron
  g.add(place(coilLorry(PALETTE.blue), { x: 7.4, y: y0, z: 2.6 }));
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3 - i; j++) {
      g.add(place(box(3.2, 0.42, 0.42, mat(i % 2 ? '#7d8287' : '#6d7277')), { x: 1.8 + 0, y: y0 + 0.05 + i * 0.42, z: 1.6 + j * 0.46 + i * 0.23 }));
    }
  }
  const coilM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const [x, z] of [[13.3, 1.6], [13.3, 3.3]]) {
    const c = cylinder(0.8, 0.8, 1.3, coilM, 14);
    c.position.set(x, y0 + 0.8, z);
    c.rotation.z = Math.PI / 2;
    g.add(c);
  }

  // site lamps, a few scrappy trees and a wire fence along the edges
  g.add(place(streetLamp({ h: 6 }), { x: -2.4, y: y0, z: 4.3, ry: 180 }));
  g.add(place(streetLamp({ h: 6 }), { x: 14.4, y: y0, z: -0.2, ry: 180 }));
  g.add(place(tree({ kind: 'poplar', h: 5, seed: 31 }), { x: -14.1, y: y0, z: -1.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 32 }), { x: -14.1, y: y0, z: 9.2 }));
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 33 }), { x: 14.2, y: y0, z: -9.3 }));
  g.add(place(fence({ w: 29.6, d: 19.6, h: 1.2, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  return g;
}

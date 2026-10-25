import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, taperedBlock, facadeBlock, shedRoof,
  smokestack, tree, car, fence, streetLamp, beam, pipeRun,
  mat, metal, surface, signTexture, textured,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
//   back-left : three tall concrete cement silos with a conveyor gallery on top
//   back-right: preheater tower with stacked cyclones and the exhaust stack
//   middle    : long rotary kiln on piers, feeding the clinker cooler (left)
//   front     : limestone stockpiles, raw-feed conveyor, office, truck lane

const UP = new THREE.Vector3(0, 1, 0);
const v3 = (p) => new THREE.Vector3(...p);

/** Cylinder between two points (any direction). */
function tube(a, b, r, material, segments = 16) {
  const A = v3(a), B = v3(b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, A.distanceTo(B), segments), material);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(UP, B.clone().sub(A).normalize());
  return m;
}

/** Box-section conveyor gallery whose centre line runs from a to b (stays upright). */
function gallery(a, b, w, h, material) {
  const A = v3(a), B = v3(b);
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, A.distanceTo(B)), material);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.lookAt(B);
  return m;
}

/** Handrail round a w x d platform, top at height h. */
function railing(w, d, h, material) {
  const t = 0.08;
  const g = group(
    place(box(w, t, t, material), { y: h, z: d / 2 }),
    place(box(w, t, t, material), { y: h, z: -d / 2 }),
    place(box(t, t, d, material), { x: w / 2, y: h }),
    place(box(t, t, d, material), { x: -w / 2, y: h }),
  );
  for (const [x, z] of [[w / 2, d / 2], [-w / 2, d / 2], [w / 2, -d / 2], [-w / 2, -d / 2]]) g.add(place(box(t, h, t, material), { x, z }));
  return g;
}

/** Bulk cement tanker: cab + tilted pressure tank, length along X, cab at +x. */
function cementTanker(cabColor) {
  const g = new THREE.Group();
  const chassis = mat(PALETTE.darkGrey);
  const tankM = metal(PALETTE.chrome, { roughness: 0.35 });
  g.add(place(box(2.2, 2.4, 2.3, mat(cabColor, { roughness: 0.5 })), { x: 3.5, y: 0.55 }));
  g.add(place(box(0.05, 0.9, 1.9, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.62, y: 1.85 }));
  g.add(place(box(7.6, 0.35, 1.6, chassis), { x: -0.3, y: 0.55 }));
  g.add(tube([-3.9, 2.0, 0], [2.0, 2.0, 0], 1.05, tankM, 14));
  g.add(place(sphereCap(1.05, tankM), { x: 2.0, y: 2.0, rz: -90 }));
  g.add(place(sphereCap(1.05, tankM), { x: -3.9, y: 2.0, rz: 90 }));
  for (const x of [-2.6, -0.9, 0.8]) g.add(place(cone(0.75, 0.9, tankM, 8), { x, y: 1.25, rx: 180 })); // discharge hoppers
  for (const x of [-2.2, -0.2]) g.add(place(cylinder(0.3, 0.3, 0.25, tankM, 10), { x, y: 3.0 })); // hatches
  const wheelM = mat(PALETTE.black);
  for (const x of [3.5, -1.6, -2.9]) for (const sz of [-1, 1]) {
    g.add(tube([x, 0.48, sz * 0.85], [x, 0.48, sz * 1.15], 0.48, wheelM, 10));
  }
  return g;
}

/** Tipper truck with a load of limestone, length along X, cab at +x. */
function tipper(cabColor, bodyColor, loadColor) {
  const g = new THREE.Group();
  g.add(place(box(2.0, 2.3, 2.3, mat(cabColor, { roughness: 0.5 })), { x: 2.8, y: 0.55 }));
  g.add(place(box(0.05, 0.9, 1.9, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 3.82, y: 1.75 }));
  g.add(place(box(4.6, 1.5, 2.4, mat(bodyColor, { roughness: 0.6 })), { x: -0.6, y: 0.9 }));
  g.add(place(taperedBlock({ w: 4.2, d: 2.1, h: 0.7, topW: 2.8, topD: 1.2, material: mat(loadColor) }), { x: -0.6, y: 2.4 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [2.8, -0.4, -1.8]) for (const sz of [-1, 1]) {
    g.add(tube([x, 0.48, sz * 0.85], [x, 0.48, sz * 1.15], 0.48, wheelM, 10));
  }
  return g;
}

/** Small yellow wheel loader, bucket towards +x. */
function wheelLoader() {
  const g = new THREE.Group();
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  g.add(place(box(2.6, 1.0, 1.6, body), { x: -0.3, y: 0.6 }));
  g.add(place(box(1.1, 1.2, 1.3, body), { x: -0.2, y: 1.6 }));
  g.add(place(box(0.9, 0.7, 1.32, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: -0.2, y: 1.85 }));
  g.add(place(box(1.2, 0.1, 1.5, mat(PALETTE.darkGrey)), { x: -0.2, y: 2.8 }));
  g.add(beam([0.6, 1.6, 0.5], [1.8, 0.7, 0.5], 0.18, body));
  g.add(beam([0.6, 1.6, -0.5], [1.8, 0.7, -0.5], 0.18, body));
  g.add(place(box(0.7, 0.8, 1.9, mat(PALETTE.darkGrey)), { x: 2.0, y: 0.15 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [0.8, -1.2]) for (const sz of [-1, 1]) g.add(tube([x, 0.55, sz * 0.7], [x, 0.55, sz * 1.0], 0.55, wheelM, 10));
  return g;
}

/**
 * Text plate facing +z, base at y = 0. Local stand-in for lib sign(): that one
 * uses metre UVs on a non-repeating texture, so wide signs show only 1 m of text.
 */
function sign({ text, w, h, bg, fg, depth = 0.1 }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Hemisphere cap of radius r (pole along +y). */
function sphereCap(r, material) {
  return new THREE.Mesh(new THREE.SphereGeometry(r, 14, 6, 0, Math.PI * 2, 0, Math.PI / 2), material);
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;

  // materials
  const concrete = surface('concrete', PALETTE.concrete, { size: 4 });
  const concreteDark = mat(PALETTE.concreteDark);
  const dust = mat('#cdcac2', { roughness: 1 });
  const cladBlue = surface('corrugated', PALETTE.roofBlue, { size: 2, roughness: 0.6 });
  const cladGrey = surface('corrugated', '#b4b3ae', { size: 2, roughness: 0.7 });
  const steel = metal(PALETTE.steel, { roughness: 0.5 });
  const steelDark = metal(PALETTE.steelDark, { roughness: 0.5 });
  const kilnM = mat('#8d8a84', { roughness: 0.6, metalness: 0.3 });
  const hotM = mat(PALETTE.rust, { roughness: 0.7, metalness: 0.2 });
  const rail = mat(PALETTE.yellow);
  const stoneHeap = mat('#d6d1c4', { roughness: 1 });
  const clinkerHeap = mat('#55524e', { roughness: 1 });

  g.add(lot([2, 2], 'gravel'));

  // dusty ground: concrete yard under the plant, pale dust round silos and piles
  g.add(place(patch(20, 9.6, 'concrete'), { y: y0, z: -5.2 }));
  g.add(place(patch(11, 4.2, dust), { x: -4.2, y: y0 + 0.01, z: -3.6 }));
  g.add(place(patch(11.4, 4.6, dust), { x: 3.8, y: y0 + 0.01, z: 4.0 }));
  // truck lane along the front
  g.add(place(patch(20, 3.4, 'asphalt'), { y: y0, z: 8.2 }));
  for (let x = -8.5; x < 10; x += 3) g.add(place(box(1.4, 0.02, 0.15, PALETTE.roadLine), { x, y: y0 + 0.05, z: 8.2 }));

  // ---------------------------------------------------------------- silos
  const siloR = 1.65, siloH = 17, siloZ = -7.6;
  const siloXs = [-8.0, -4.6, -1.2];
  g.add(place(box(10.6, 0.6, 4.0, concreteDark), { x: -4.6, y: y0, z: siloZ }));
  for (const x of siloXs) {
    g.add(place(cylinder(siloR, siloR, siloH, concrete, 20), { x, y: y0 + 0.6, z: siloZ }));
    for (let h = 3.5; h < siloH; h += 3.5) g.add(place(cylinder(siloR + 0.06, siloR + 0.06, 0.22, concreteDark, 20), { x, y: y0 + 0.6 + h, z: siloZ }));
    g.add(place(cylinder(siloR + 0.1, siloR + 0.1, 0.35, concreteDark, 20), { x, y: y0 + 0.6 + siloH, z: siloZ }));
    // loading spout + chute on the yard side
    g.add(place(box(1.0, 1.2, 0.9, steel), { x, y: y0 + 4.2, z: siloZ + siloR + 0.3 }));
    g.add(place(cylinder(0.18, 0.18, 1.6, steelDark, 8), { x, y: y0 + 2.6, z: siloZ + siloR + 0.45 }));
  }
  // conveyor gallery across the silo tops + head house
  const topY = y0 + 0.6 + siloH + 0.35;
  g.add(place(box(12.0, 2.0, 1.8, cladBlue), { x: -3.6, y: topY, z: siloZ }));
  g.add(place(box(12.2, 0.2, 2.0, mat(PALETTE.roofGrey)), { x: -3.6, y: topY + 2.0, z: siloZ }));
  g.add(place(box(2.4, 2.2, 2.6, cladBlue), { x: 1.0, y: topY + 2.0, z: siloZ }));
  g.add(place(box(2.6, 0.2, 2.8, mat(PALETTE.roofGrey)), { x: 1.0, y: topY + 4.2, z: siloZ }));
  g.add(place(box(11.0, 0.3, 3.6, concreteDark), { x: -4.6, y: topY - 0.3, z: siloZ }));
  g.add(place(railing(10.8, 3.4, 1.0, rail), { x: -4.6, y: topY, z: siloZ }));
  // bucket elevator up the side of the silo row
  g.add(place(box(1.4, topY - y0, 1.4, cladGrey), { x: 1.0, y: y0, z: siloZ }));
  g.add(place(box(1.6, 0.2, 1.6, steelDark), { x: 1.0, y: y0 + 8, z: siloZ }));
  // caged access ladders + dust extraction pipe on the back of the silos
  for (const x of [-8.0, -1.2]) {
    const lz = siloZ - siloR - 0.35;
    for (const dx of [-0.25, 0.25]) g.add(place(box(0.07, siloH, 0.07, rail), { x: x + dx, y: y0 + 0.6, z: lz }));
    for (let h = 2.5; h < siloH; h += 1.2) g.add(place(box(0.65, 0.06, 0.55, rail), { x, y: y0 + 0.6 + h, z: lz - 0.15 }));
  }
  g.add(pipeRun([[-9.6, y0 + 1.2, siloZ - 2.0], [-5.6, y0 + 1.2, siloZ - 2.0], [-5.6, topY - 0.6, siloZ - 2.0]], 0.22, steel));
  // big painted lettering on the middle silo
  g.add(place(sign({ text: 'CEMENT', w: 5.0, h: 1.3, bg: PALETTE.roofBlue, fg: '#ffffff', depth: 0.1 }), { x: -4.6, y: topY + 0.35, z: siloZ + 0.9 }));

  // ---------------------------------------------------------------- preheater tower
  const tx = 5.4, tz = -6.4, tw = 6.0, td = 6.0;
  const levels = [5, 10, 15, 20];
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.add(place(box(0.7, 20, 0.7, concrete), { x: tx + sx * (tw / 2 - 0.35), y: y0, z: tz + sz * (td / 2 - 0.35) }));
  }
  for (const L of levels) {
    g.add(place(box(tw + 0.4, 0.35, td + 0.4, concreteDark), { x: tx, y: y0 + L - 0.35, z: tz }));
    if (L < 20) g.add(place(railing(tw + 0.3, td + 0.3, 1.0, rail), { x: tx, y: y0 + L, z: tz }));
  }
  // zig-zag stairs up the back of the tower
  for (let i = 0; i < 4; i++) {
    const sx = i % 2 ? 1 : -1, zb = tz - td / 2 - 0.25;
    g.add(beam([tx - sx * 2.2, y0 + i * 5, zb], [tx + sx * 2.2, y0 + (i + 1) * 5 - 0.35, zb], 0.22, rail));
  }
  // cyclones: two per stage, hanging through each floor
  const cyc = metal('#d2d3cf', { roughness: 0.6 });
  const stages = [
    { L: 5, r: 1.05, xs: [-1.5, 1.5], z: 0.9 },
    { L: 10, r: 1.1, xs: [-1.5, 1.5], z: -0.9 },
    { L: 15, r: 1.15, xs: [-1.5, 1.5], z: 0.9 },
  ];
  for (const s of stages) {
    for (const dx of s.xs) {
      const x = tx + dx, z = tz + s.z, y = y0 + s.L;
      g.add(place(cylinder(s.r, s.r, 2.4, cyc, 14), { x, y, z }));
      g.add(place(cone(s.r, 2.2, cyc, 14), { x, y, z, rx: 180 }));
      g.add(place(cylinder(0.35, 0.35, 0.8, steelDark, 8), { x, y: y + 2.4, z }));
      g.add(tube([x, y + 3.2, z], [tx, y + 3.2, tz - s.z], 0.35, steel, 8));
    }
  }
  // top housing (cladded) with the top cyclones inside
  g.add(place(box(tw + 0.4, 4.2, td + 0.4, cladBlue), { x: tx, y: y0 + 20, z: tz }));
  g.add(place(box(tw + 0.8, 0.3, td + 0.8, mat(PALETTE.roofGrey)), { x: tx, y: y0 + 24.2, z: tz }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.7, 0.9, 0.05, mat(PALETTE.window)), { x: tx - 2.1 + i * 1.4, y: y0 + 22.2, z: tz + td / 2 + 0.22 }));
  // riser duct: kiln inlet up the front of the tower
  g.add(place(box(1.4, 14, 1.4, cladGrey), { x: tx + 1.6, y: y0 + 5, z: tz + td / 2 + 0.9 }));
  // exhaust stack, fed from the top housing
  const stX = 9.3, stZ = -9.25;
  g.add(place(smokestack({ radius: 0.72, topRadius: 0.55, h: 30, color: PALETTE.concrete, bandColor: PALETTE.red, bands: 2 }), { x: stX, y: y0, z: stZ }));
  g.add(pipeRun([[tx + tw / 2 + 0.2, y0 + 23, tz], [stX, y0 + 23, tz], [stX, y0 + 23, stZ + 0.5]], 0.45, steel));

  // ---------------------------------------------------------------- rotary kiln
  const kz = -0.7, kR = 1.15;
  const kx0 = 6.4, kx1 = -5.9; // inlet (high) -> outlet (low)
  const ky0 = y0 + 4.3, ky1 = y0 + 3.2;
  const kyAt = (x) => ky1 + ((x - kx1) / (kx0 - kx1)) * (ky0 - ky1);
  g.add(tube([kx0, ky0, kz], [kx1 + 2.2, kyAt(kx1 + 2.2), kz], kR, kilnM, 18));
  g.add(tube([kx1 + 2.2, kyAt(kx1 + 2.2), kz], [kx1, ky1, kz], kR, hotM, 18)); // burning zone
  // tyres on concrete piers
  for (const x of [3.8, 0.0, -3.6]) {
    const ky = kyAt(x);
    g.add(tube([x - 0.25, ky, kz], [x + 0.25, ky, kz], kR + 0.25, steelDark, 18));
    g.add(place(taperedBlock({ w: 1.6, d: 3.2, h: ky - kR - 0.2 - y0, topW: 1.2, topD: 2.6, material: concrete }), { x, y: y0, z: kz }));
    g.add(place(box(1.0, 0.4, 0.5, steelDark), { x, y: ky - kR - 0.4, z: kz + 0.95 }));
    g.add(place(box(1.0, 0.4, 0.5, steelDark), { x, y: ky - kR - 0.4, z: kz - 0.95 }));
  }
  // girth gear and drive
  g.add(tube([1.75, kyAt(1.9), kz], [2.05, kyAt(1.9), kz], kR + 0.35, mat(PALETTE.darkGrey), 18));
  g.add(place(box(2.0, 1.4, 1.2, mat(PALETTE.green)), { x: 1.9, y: y0, z: kz - 2.0 }));
  g.add(place(box(0.6, 1.6, 0.6, mat(PALETTE.darkGrey)), { x: 1.9, y: y0, z: kz - 1.3 }));
  // kiln inlet housing at the foot of the tower
  g.add(place(box(2.8, 6.2, 3.0, cladGrey), { x: 7.6, y: y0, z: kz }));
  g.add(place(box(3.0, 0.2, 3.2, mat(PALETTE.roofGrey)), { x: 7.6, y: y0 + 6.2, z: kz }));

  // clinker cooler + burner floor (kiln outlet)
  const cx = -7.9, cz = -0.7;
  g.add(place(facadeBlock({ w: 3.8, d: 4.6, h: 6, floorHeight: 3, style: 'industrial', wall: PALETTE.stone, frame: PALETTE.steelLight, glass: PALETTE.window, bay: 2.2, roof: PALETTE.roofGrey }), { x: cx, y: y0, z: cz }));
  g.add(place(shedRoof({ w: 3.8, d: 4.6, h: 1.0, overhang: 0.2, material: cladBlue, wallMaterial: mat(PALETTE.stone) }), { x: cx, y: y0 + 6, z: cz }));
  g.add(place(box(1.6, 2.6, 0.12, mat(PALETTE.steelDark)), { x: cx, y: y0, z: cz + 2.32 }));
  // clinker conveyor: cooler roof -> bucket elevator
  const cvA = [cx + 0.6, y0 + 6.6, cz - 2.0], cvB = [0.2, y0 + 12.2, siloZ + 1.0];
  g.add(gallery(cvA, cvB, 1.2, 1.3, cladGrey));
  for (const t of [0.35, 0.7]) {
    const p = cvA.map((a, i) => a + (cvB[i] - a) * t);
    g.add(place(box(0.35, p[1] - 0.65 - y0, 0.35, steelDark), { x: p[0], y: y0, z: p[2] }));
  }
  // clinker heap
  g.add(place(cone(1.7, 1.4, clinkerHeap, 9), { x: -3.0, y: y0, z: 2.6 }));

  // ---------------------------------------------------------------- raw materials (front right)
  g.add(place(cone(2.5, 2.3, stoneHeap, 10), { x: 5.0, y: y0, z: 3.9 }));
  g.add(place(cone(1.9, 1.7, stoneHeap, 9), { x: 1.5, y: y0, z: 4.4 }));
  g.add(place(wheelLoader(), { x: 2.6, y: y0, z: 2.0, ry: -20, s: 0.8 }));
  // feed hopper + raw-meal conveyor over the kiln inlet to the feed elevator
  const hx = 8.9, hz = 4.8;
  g.add(place(box(1.8, 1.6, 1.8, steelDark), { x: hx, y: y0, z: hz }));
  g.add(place(taperedBlock({ w: 1.6, d: 1.6, h: 1.0, topW: 2.4, topD: 2.4, material: cladGrey }), { x: hx, y: y0 + 1.6, z: hz }));
  const elX = 9.2, elZ = -2.9;
  const rfA = [hx + 0.2, y0 + 2.4, hz - 0.8], rfB = [elX, y0 + 8.4, elZ + 0.8];
  g.add(gallery(rfA, rfB, 1.1, 1.2, cladGrey));
  for (const t of [0.4]) {
    const p = rfA.map((a, i) => a + (rfB[i] - a) * t);
    const legH = p[1] - 0.6 - y0;
    g.add(place(box(0.3, legH, 0.3, steelDark), { x: p[0] - 0.4, y: y0, z: p[2] }));
    g.add(place(box(0.3, legH, 0.3, steelDark), { x: p[0] + 0.4, y: y0, z: p[2] }));
  }
  g.add(place(box(1.2, 21.2, 1.2, cladGrey), { x: elX, y: y0, z: elZ }));
  g.add(place(box(1.6, 1.4, 1.6, cladBlue), { x: elX, y: y0 + 21.2, z: elZ }));

  // ---------------------------------------------------------------- office, lane, life
  g.add(place(facadeBlock({ w: 4.2, d: 3.0, floors: 2, style: 'punched', wall: PALETTE.cream, frame: PALETTE.white, glass: PALETTE.window, bay: 1.6, lit: 0.2, seed: 7, roof: PALETTE.concreteDark }), { x: -7.6, y: y0, z: 4.6 }));
  g.add(place(box(4.4, 0.3, 3.2, concreteDark), { x: -7.6, y: y0 + 6, z: 4.6 }));
  g.add(place(sign({ text: 'TINY CEMENT', w: 3.6, h: 0.7, bg: PALETTE.roofBlue, fg: '#ffffff', depth: 0.12 }), { x: -7.6, y: y0 + 6.35, z: 5.9 }));
  g.add(place(car({ color: PALETTE.red }), { x: -4.8, y: y0, z: 4.9, ry: 90, s: 0.62 }));

  g.add(place(cementTanker(PALETTE.orange), { x: -3.4, y: y0 + 0.05, z: 7.4, s: 0.8 }));
  g.add(place(tipper(PALETTE.yellow, PALETTE.steelDark, '#d6d1c4'), { x: 5.4, y: y0 + 0.05, z: 9.0, ry: 180, s: 0.8 }));

  g.add(place(fence({ w: 19.6, d: 19.6, h: 1.4, style: 'wire', sides: ['left'] }), { y: y0 }));
  for (const x of [0.8, 6.8]) g.add(place(streetLamp({ h: 4.6 }), { x, y: y0, z: 6.2, ry: -90 }));
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 3 }), { x: -9.3, y: y0, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -9.3, y: y0, z: 6.5 }));
  return g;
}

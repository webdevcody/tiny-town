import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, cylinder, cone, place, group, beam, lattice, taperedBlock,
  surface, mat, metal, emissive, sign, door, windowPanel, tree, streetLamp, fence, rng,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (rail siding) faces +z.
const Y0 = LOT_HEIGHT;
const COAL = '#35343a';
const coalM = mat(COAL, { roughness: 0.95 });
const coalLumpM = mat('#3a3a3f', { roughness: 0.6, metalness: 0.2 });
const frameM = metal('#4d5a66', { roughness: 0.5 });
const wheelM = metal(PALETTE.red, { roughness: 0.45 });
const ropeM = mat(PALETTE.black);

// Winding wheel (sheave) in the XY plane: rim, spokes, hub. Centre at origin.
function sheave(r) {
  const g = new THREE.Group();
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r, 0.16, 6, 22), wheelM);
  g.add(rim);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI;
    g.add(beam([Math.cos(a) * r, Math.sin(a) * r, 0], [-Math.cos(a) * r, -Math.sin(a) * r, 0], 0.09, wheelM));
  }
  const hub = cylinder(0.28, 0.28, 0.5, PALETTE.darkGrey, 10);
  hub.geometry = hub.geometry.clone().translate(0, -0.25, 0).rotateX(Math.PI / 2);
  g.add(hub);
  return g;
}

// Lumpy pile of coal: a squashed low-poly cone plus a few chunks.
function coalHeap({ r = 2.5, h = 2, sx = 1, sz = 1, seed = 1, material = coalM }) {
  const rr = rng(seed);
  const g = new THREE.Group();
  const c = cone(r, h, material, 9);
  c.scale.set(sx, 1, sz);
  c.rotation.y = rr() * Math.PI;
  g.add(c);
  for (let i = 0; i < 3; i++) {
    const a = rr() * Math.PI * 2, d = rr.range(0.3, 0.6) * r;
    const lumpR = rr.range(0.35, 0.6) * r * 0.5;
    const lump = new THREE.Mesh(new THREE.DodecahedronGeometry(lumpR, 0), material);
    lump.position.set(Math.cos(a) * d * sx, h * (1 - d / r) * 0.75, Math.sin(a) * d * sz);
    lump.scale.y = 0.6;
    g.add(lump);
  }
  for (let i = 0; i < 7; i++) {
    const a = rr() * Math.PI * 2, d = rr.range(0.85, 1.1) * r;
    const chunk = new THREE.Mesh(new THREE.DodecahedronGeometry(rr.range(0.12, 0.22), 0), coalLumpM);
    chunk.position.set(Math.cos(a) * d * sx, 0.08, Math.sin(a) * d * sz);
    g.add(chunk);
  }
  return g;
}

// Open hopper wagon loaded with coal, length along X.
function coalWagon({ color = PALETTE.brickBrown, seed = 1 } = {}) {
  const g = new THREE.Group();
  const L = 5.2, W = 2.5;
  const bodyM = mat(color, { roughness: 0.7 });
  const ribM = mat(new THREE.Color(color).multiplyScalar(0.7).getStyle());
  // chassis + bogies + wheels
  g.add(place(box(L, 0.3, W - 0.3, PALETTE.darkGrey), { y: 0.75 }));
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.12, 10).rotateX(Math.PI / 2);
  for (const x of [-1.7, 1.7]) {
    g.add(place(box(1.9, 0.35, 1.5, PALETTE.black), { x, y: 0.3 }));
    for (const dx of [-0.6, 0.6]) for (const z of [-0.72, 0.72]) {
      const wh = new THREE.Mesh(wheelGeo, mat(PALETTE.black));
      wh.position.set(x + dx, 0.42, z);
      g.add(wh);
    }
  }
  for (const x of [-L / 2 - 0.15, L / 2 + 0.15]) {
    for (const z of [-0.7, 0.7]) g.add(place(cylinder(0.14, 0.14, 0.12, PALETTE.steelLight, 8), { x, y: 0.75, z, rz: 90 }));
  }
  // hopper body (tapered towards the bottom) + ribs
  const body = taperedBlock({ w: L - 0.6, d: W - 0.4, h: 1.1, topW: L, topD: W, material: bodyM, topMaterial: bodyM });
  g.add(place(body, { y: 1.05 }));
  g.add(place(box(L, 0.95, W, bodyM), { y: 2.15 }));
  for (let i = 0; i <= 4; i++) {
    const x = -L / 2 + 0.1 + (i * (L - 0.2)) / 4;
    g.add(place(box(0.12, 0.95, W + 0.08, ribM), { x, y: 2.15 }));
  }
  // coal load
  g.add(place(box(L - 0.2, 0.1, W - 0.2, coalM), { y: 2.95 }));
  const rr = rng(seed);
  for (let i = 0; i < 3; i++) {
    const c = cone(1.1, 0.55, coalM, 7);
    c.scale.set(1, 1, 0.95);
    g.add(place(c, { x: -1.6 + i * 1.6 + rr.range(-0.2, 0.2), y: 3.0, ry: rr() * 60 }));
  }
  return g;
}

// Small mine tub (pit cart) on a narrow-gauge rail, length along X.
function mineTub(full = true) {
  const g = new THREE.Group();
  g.add(place(taperedBlock({ w: 1.0, d: 0.75, h: 0.6, topW: 1.3, topD: 0.95, material: metal(PALETTE.rust, { roughness: 0.7 }) }), { y: 0.25 }));
  const wgeo = new THREE.CylinderGeometry(0.17, 0.17, 0.08, 8).rotateX(Math.PI / 2);
  for (const x of [-0.35, 0.35]) for (const z of [-0.33, 0.33]) {
    const wh = new THREE.Mesh(wgeo, mat(PALETTE.black));
    wh.position.set(x, 0.17, z);
    g.add(wh);
  }
  if (full) g.add(place(cone(0.6, 0.35, coalM, 6), { y: 0.85 }));
  return g;
}

// Track along X: ballast, sleepers, two rails.
function track({ length, gauge = 1.435, sleeperGap = 0.65, ballast = true }) {
  const g = new THREE.Group();
  if (ballast) g.add(place(taperedBlock({ w: length, d: gauge + 1.9, h: 0.18, topW: length, topD: gauge + 1.1, material: surface('gravel', '#8d867a', { size: 2 }) }), {}));
  const sleeperM = mat(PALETTE.woodDark);
  const n = Math.floor(length / sleeperGap);
  for (let i = 0; i < n; i++) {
    g.add(place(box(0.24, 0.1, gauge + 0.9, sleeperM), { x: -length / 2 + sleeperGap / 2 + i * sleeperGap, y: ballast ? 0.18 : 0 }));
  }
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const z of [-gauge / 2, gauge / 2]) g.add(place(box(length, 0.13, 0.1, railM), { y: (ballast ? 0.28 : 0.1), z }));
  return g;
}

// Box oriented between two points (conveyor galleries); a and b are base-centre points.
function span(a, b, w, h, material) {
  const [ax, ay, az] = a, [bx, by, bz] = b;
  const dx = bx - ax, dy = by - ay, dz = bz - az;
  const horiz = Math.hypot(dx, dz);
  const len = Math.hypot(horiz, dy);
  const m = box(len, h, w, material);
  m.geometry = m.geometry.clone();
  const holder = new THREE.Group();
  holder.add(m);
  m.rotation.z = Math.atan2(dy, horiz);
  holder.rotation.y = Math.atan2(-dz, dx);
  holder.position.set((ax + bx) / 2, (ay + by) / 2, (az + bz) / 2);
  return holder;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'dirt'));

  // ground: coal-dust yard, gravel apron, grass margins
  g.add(place(patch(8.5, 7.5, mat('#4a4440', { roughness: 1 })), { x: 5.2, y: Y0, z: 2.7 }));
  g.add(place(patch(7, 6.5, 'gravel'), { x: -4.5, y: Y0, z: -3 }));
  g.add(place(patch(3.2, 9, 'grass'), { x: -8.4, y: Y0, z: -5.5 }));

  // ---------------- headframe over the shaft ----------------
  const HX = -4.5, HZ = -3;
  const towerH = 16;
  // heapstead (pithead building) wrapped around the base of the headframe
  g.add(place(facadeBlock({ w: 5, d: 5, h: 4, floorHeight: 4, style: 'industrial', wall: '#6f8a7a', glass: PALETTE.window, frame: PALETTE.steelLight, bay: 2.5, roof: PALETTE.roofGrey, seed: 3, blank: ['right'] }), { x: HX, y: Y0, z: HZ }));
  g.add(place(box(1.6, 2.4, 0.15, mat(PALETTE.steelDark)), { x: HX - 1.2, y: Y0, z: HZ + 2.55 }));
  // tower
  g.add(place(lattice({ w: 3.4, d: 3.4, topW: 2.4, topD: 2.4, h: towerH, segments: 6, thickness: 0.3, material: frameM }), { x: HX, y: Y0, z: HZ }));
  // head platform with railing
  const headY = Y0 + towerH;
  g.add(place(box(4.2, 0.35, 4.2, frameM), { x: HX + 0.3, y: headY, z: HZ }));
  g.add(place(fence({ w: 4.2, d: 4.2, h: 0.9, style: 'railing', color: PALETTE.yellow }), { x: HX + 0.3, y: headY + 0.35, z: HZ }));
  // back legs (raking struts) towards the winding house
  const legTop = (sz) => [HX + 1.1, headY - 0.2, HZ + sz * 1.1];
  const legFoot = (sz) => [HX + 6.8, Y0, HZ + sz * 1.9];
  const lerp = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  for (const sz of [-1, 1]) {
    g.add(beam(legTop(sz), legFoot(sz), 0.5, frameM));
    g.add(place(box(1, 0.4, 1, PALETTE.concrete), { x: legFoot(sz)[0], y: Y0, z: legFoot(sz)[2] }));
  }
  for (let i = 1; i <= 4; i++) {
    const t0 = (i - 1) / 4, t1 = i / 4;
    g.add(beam(lerp(legTop(-1), legFoot(-1), t1), lerp(legTop(1), legFoot(1), t1), 0.22, frameM));
    g.add(beam(lerp(legTop(-1), legFoot(-1), t0), lerp(legTop(1), legFoot(1), t1), 0.16, frameM));
    // ties back into the tower
    if (i < 4) for (const sz of [-1, 1]) {
      const p = lerp(legTop(sz), legFoot(sz), t1);
      const towerHalf = (3.4 + (2.4 - 3.4) * ((p[1] - Y0) / towerH)) / 2;
      g.add(beam([HX + towerHalf, p[1], p[2]], p, 0.16, frameM));
    }
  }
  // the two winding wheels side by side + bearings
  const sheaveR = 1.75;
  const wheelY = headY + 0.35 + sheaveR + 0.35;
  for (const dz of [-1.0, 1.0]) {
    const z = HZ + dz;
    g.add(place(sheave(sheaveR), { x: HX + 0.3, y: wheelY, z }));
    for (const dx of [-1.1, 1.1]) g.add(beam([HX + 0.3 + dx, headY + 0.35, z + 0.4], [HX + 0.3, wheelY, z + 0.3], 0.2, frameM));
    // ropes: down the shaft and across to the winding drums
    g.add(beam([HX + 0.3 - sheaveR, wheelY, z], [HX + 0.3 - sheaveR, Y0 + 4, z], 0.1, ropeM));
    g.add(beam([HX + 0.3 + 0.4, wheelY + sheaveR - 0.05, z], [2.2, Y0 + 4.6, HZ - 0.5 + dz * 0.8], 0.1, ropeM));
  }
  g.add(place(cylinder(0.12, 0.12, 2.8, PALETTE.darkGrey, 8), { x: HX + 0.3, y: wheelY, z: HZ - 1.4, rx: 90 }));

  // ---------------- brick winding house ----------------
  const WX = 5.6, WZ = -3.5, WW = 7, WD = 6, WH = 6;
  const brickWall = PALETTE.brick;
  g.add(place(box(WW + 0.4, 0.5, WD + 0.4, mat(PALETTE.stoneDark)), { x: WX, y: Y0, z: WZ }));
  g.add(place(facadeBlock({ w: WW, d: WD, h: WH, floorHeight: WH, style: 'brick', wall: brickWall, glass: PALETTE.window, frame: PALETTE.cream, bay: 2.3, windowW: 0.5, windowH: 0.62, lit: 0.15, seed: 7 }), { x: WX, y: Y0 + 0.5, z: WZ }));
  g.add(place(gableRoof({ w: WW, d: WD, h: 2.4, overhang: 0.35, ridge: 'x', material: surface('roofTiles', PALETTE.roofSlate, { size: 2 }), gableMaterial: surface('brick', brickWall, { size: 1.2 }) }), { x: WX, y: Y0 + 0.5 + WH, z: WZ }));
  // roof ventilator lantern
  g.add(place(box(2.4, 0.9, 1.2, mat(PALETTE.roofSlate)), { x: WX, y: Y0 + 0.5 + WH + 2.0, z: WZ }));
  g.add(place(gableRoof({ w: 2.4, d: 1.2, h: 0.5, overhang: 0.2, ridge: 'x', material: mat(PALETTE.roofGrey), gableMaterial: PALETTE.roofSlate }), { x: WX, y: Y0 + 0.5 + WH + 2.9, z: WZ }));
  // stone string course
  g.add(place(box(WW + 0.15, 0.25, WD + 0.15, mat(PALETTE.cream)), { x: WX, y: Y0 + 0.5 + WH - 0.4, z: WZ }));
  // rope openings on the headframe side
  for (const dz of [-0.8, 0.8]) g.add(place(box(0.1, 1.0, 0.6, mat(PALETTE.black)), { x: WX - WW / 2 - 0.02, y: Y0 + 4.1, z: WZ + 0.5 + dz }));
  // front door + nameboard
  g.add(place(door({ w: 1.6, h: 2.7, color: PALETTE.green }), { x: WX, y: Y0 + 0.5, z: WZ + WD / 2 }));
  g.add(place(sign({ text: 'COLLIERY', w: 4.2, h: 0.8, bg: PALETTE.navy, fg: '#f4e7b0' }), { x: WX, y: Y0 + 0.5 + WH - 1.3, z: WZ + WD / 2 + 0.05 }));
  g.add(place(box(2.4, 0.4, 1.0, mat(PALETTE.stone)), { x: WX, y: Y0, z: WZ + WD / 2 + 0.6 }));

  // boiler house annex + tall brick chimney behind
  g.add(place(facadeBlock({ w: 6.6, d: 3.4, h: 4, floorHeight: 4, style: 'brick', wall: PALETTE.brickDark, glass: PALETTE.window, frame: PALETTE.cream, bay: 2.2, windowW: 0.45, windowH: 0.5, seed: 8, blank: ['front'] }), { x: WX + 0.2, y: Y0, z: -8.2 }));
  g.add(place(gableRoof({ w: 6.6, d: 3.4, h: 1.2, overhang: 0.25, ridge: 'x', material: surface('corrugated', PALETTE.roofGrey, { size: 1.2 }), gableMaterial: surface('brick', PALETTE.brickDark, { size: 1.2 }) }), { x: WX + 0.2, y: Y0 + 4, z: -8.2 }));
  const chimX = 8.6, chimZ = -8.4;
  g.add(place(box(1.9, 1.2, 1.9, mat(PALETTE.stoneDark)), { x: chimX, y: Y0, z: chimZ }));
  g.add(place(cylinder(0.65, 0.95, 18, surface('brick', PALETTE.brickBrown, { size: 1.2 }), 12), { x: chimX, y: Y0 + 1.2, z: chimZ }));
  g.add(place(cylinder(0.78, 0.74, 0.7, mat(PALETTE.darkGrey), 12), { x: chimX, y: Y0 + 19.2, z: chimZ }));
  g.add(place(cylinder(0.55, 0.55, 0.05, mat(PALETTE.black), 12), { x: chimX, y: Y0 + 19.9, z: chimZ }));

  // ---------------- conveyor + loading bunker over the siding ----------------
  const TZ = 7.4;
  const BX = HX;
  const binY = Y0 + 5.4;
  for (const dx of [-1.6, 1.6]) for (const dz of [-2.05, 2.05]) {
    g.add(place(box(0.35, binY - Y0, 0.35, frameM), { x: BX + dx, y: Y0, z: TZ + dz }));
  }
  for (const dz of [-2.05, 2.05]) g.add(beam([BX - 1.6, Y0 + 0.2, TZ + dz], [BX + 1.6, binY, TZ + dz], 0.18, frameM));
  g.add(place(box(3.8, 0.3, 4.5, frameM), { x: BX, y: binY, z: TZ }));
  const binM = surface('corrugated', '#5f6f5a', { size: 1.2 });
  const chute = taperedBlock({ w: 3.4, d: 3.4, h: 1.4, topW: 1, topD: 1, material: mat('#4c5948') });
  g.add(place(chute, { x: BX, y: binY + 0.3, z: TZ, rx: 180 }));
  g.add(place(box(3.6, 2.6, 4.0, binM), { x: BX, y: binY + 0.3, z: TZ }));
  g.add(place(gableRoof({ w: 3.6, d: 4.0, h: 1.0, overhang: 0.2, ridge: 'z', material: mat(PALETTE.roofGrey), gableMaterial: '#5f6f5a' }), { x: BX, y: binY + 2.9, z: TZ }));
  g.add(place(sign({ text: 'NO.1 PIT', w: 2.6, h: 0.6, bg: PALETTE.yellow, fg: PALETTE.black }), { x: BX, y: binY + 1.6, z: TZ + 2.02 }));
  // inclined conveyor gallery from the heapstead to the bunker
  const galA = [HX, Y0 + 2.6, HZ + 2.4], galB = [BX, binY + 1.6, TZ - 2.0];
  g.add(span(galA, galB, 1.4, 1.3, surface('corrugated', '#7a8b6b', { size: 1.2 })));
  g.add(span([galA[0], galA[1] + 1.25, galA[2]], [galB[0], galB[1] + 1.25, galB[2]], 1.7, 0.15, mat(PALETTE.roofGrey)));
  for (const t of [0.35, 0.7]) {
    const p = lerp(galA, galB, t);
    g.add(place(box(1.6, 0.25, 0.3, frameM), { x: p[0], y: p[1] - 0.25, z: p[2] }));
    for (const dx of [-0.7, 0.7]) g.add(place(box(0.25, p[1] - Y0, 0.25, frameM), { x: p[0] + dx, y: Y0, z: p[2] }));
  }

  // ---------------- rail siding with coal wagons ----------------
  g.add(place(track({ length: 20 }), { y: Y0, z: TZ }));
  g.add(place(coalWagon({ color: PALETTE.brickBrown, seed: 1 }), { x: BX, y: Y0 + 0.3, z: TZ }));
  g.add(place(coalWagon({ color: '#6b6f74', seed: 2 }), { x: BX + 5.9, y: Y0 + 0.3, z: TZ }));
  g.add(place(coalWagon({ color: PALETTE.rust, seed: 3 }), { x: BX + 11.8, y: Y0 + 0.3, z: TZ }));
  // buffer stop at the dead end
  g.add(place(box(0.5, 1.2, 2.4, mat(PALETTE.woodDark)), { x: -9.6, y: Y0 + 0.2, z: TZ }));
  g.add(place(box(0.25, 0.4, 2.0, mat(PALETTE.red)), { x: -9.25, y: Y0 + 0.8, z: TZ }));

  // ---------------- coal heaps on the stocking yard ----------------
  g.add(place(coalHeap({ r: 3.0, h: 3.6, sx: 1.15, sz: 0.85, seed: 4 }), { x: 4.2, y: Y0, z: 2.4 }));
  g.add(place(coalHeap({ r: 2.1, h: 2.6, sx: 1, sz: 0.9, seed: 5 }), { x: 7.7, y: Y0, z: 3.3 }));
  g.add(place(coalHeap({ r: 1.3, h: 1.4, seed: 6 }), { x: 1.4, y: Y0, z: 4.4 }));
  // spoil heap (grey shale) in the back corner
  g.add(place(coalHeap({ r: 2.4, h: 2.2, sx: 0.8, sz: 1.2, seed: 9, material: mat('#6e6a66', { roughness: 1 }) }), { x: -8.1, y: Y0, z: -7.4 }));

  // ---------------- small props ----------------
  // lamp room / pit office
  g.add(place(facadeBlock({ w: 3, d: 2.4, h: 2.8, floorHeight: 2.8, style: 'punched', wall: PALETTE.cream, glass: PALETTE.window, frame: PALETTE.white, bay: 1.5, windowW: 0.5, windowH: 0.45, seed: 12 }), { x: -0.4, y: Y0, z: 2.3 }));
  g.add(place(gableRoof({ w: 3, d: 2.4, h: 1, overhang: 0.25, ridge: 'x', material: surface('roofTiles', PALETTE.roofRed, { size: 1.5 }), gableMaterial: PALETTE.cream }), { x: -0.4, y: Y0 + 2.8, z: 2.3 }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.navy }), { x: -0.9, y: Y0, z: 3.5 }));
  g.add(place(windowPanel({ w: 0.9, h: 0.8, lit: true }), { x: 0.4, y: Y0 + 1.1, z: 3.5 }));
  // narrow-gauge tub line with tubs behind the heapstead
  const tubLine = track({ length: 4.6, gauge: 0.6, sleeperGap: 0.6, ballast: false });
  g.add(place(tubLine, { x: -7.6, y: Y0, z: 2.0 }));
  g.add(place(mineTub(true), { x: -9.1, y: Y0 + 0.1, z: 2.0 }));
  g.add(place(mineTub(true), { x: -7.7, y: Y0 + 0.1, z: 2.0 }));
  g.add(place(mineTub(false), { x: -6.3, y: Y0 + 0.1, z: 2.0 }));
  // pit-prop timber stack
  const propM = mat(PALETTE.woodLight);
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 5 - row; i++) {
      g.add(place(cylinder(0.16, 0.16, 2.6, propM, 6), { x: -8.8 + i * 0.34 + row * 0.17, y: Y0 + 0.16 + row * 0.29, z: 4.6, rx: 90 }));
    }
  }
  // lamps, trees, perimeter fence
  g.add(place(streetLamp({ h: 4.5 }), { x: 1.6, y: Y0, z: 0.4, ry: 180 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: -8.8, y: Y0, z: -0.8 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 21 }), { x: -8.6, y: Y0, z: -3.6 }));
  g.add(place(tree({ kind: 'cone', h: 4.5, seed: 22 }), { x: 0.2, y: Y0, z: -8.8 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 23 }), { x: -2.0, y: Y0, z: -8.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 24 }), { x: 9.2, y: Y0, z: -0.2 }));
  g.add(place(fence({ w: 19.6, d: 19.6, h: 1.2, style: 'wire', sides: ['back'] }), { y: Y0 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, parapet, smokestack, box, cylinder, cone, sphere, place, group,
  taperedBlock, lattice, beam, pipeRun, door, fence, tree, car, truck, streetLamp, rooftopUnits,
  surface, mat, metal, signTexture, textured,
} from '../../src/lib/index.js';

// 3x2 tiles (30 x 20 m). Front (street) faces +z.
// Back: rail siding with coal hoppers. Left: coal stockyard + conveyors.
// Centre: brick boiler house with four corner stacks, turbine hall in front.
// Right: transformer yard and office.

const COAL = '#26262a';

// Enclosed conveyor gallery between two points [x, y, z] (bottom centre of the gallery).
function gallery(from, to, { w = 1.6, h = 1.5, material } = {}) {
  const [x0, y0, z0] = from;
  const [x1, y1, z1] = to;
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const horiz = Math.hypot(dx, dz);
  const len = Math.hypot(horiz, dy);
  const inner = new THREE.Group();
  inner.add(place(box(len, h, w, material), { x: len / 2 }));
  inner.add(place(box(len, 0.12, w + 0.3, mat(PALETTE.steelDark)), { x: len / 2, y: -0.12 }));
  const g = new THREE.Group();
  g.position.set(x0, y0, z0);
  g.rotation.order = 'YZX';
  g.rotation.set(0, Math.atan2(-dz, dx), Math.atan2(dy, horiz));
  g.add(inner);
  return g;
}

// Steel trestle leg (two posts + cross beam) under a gallery, spanning along `axis`.
function trestle(x, z, h, { span = 1.8, axis = 'z' } = {}) {
  const m = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  const o = span / 2;
  const a = axis === 'z' ? [x, 0, z - o] : [x - o, 0, z];
  const b = axis === 'z' ? [x, 0, z + o] : [x + o, 0, z];
  g.add(beam(a, [a[0], h, a[2]], 0.22, m));
  g.add(beam(b, [b[0], h, b[2]], 0.22, m));
  g.add(beam([a[0], h, a[2]], [b[0], h, b[2]], 0.2, m));
  g.add(beam([a[0], h * 0.5, a[2]], [b[0], h, b[2]], 0.12, m));
  return g;
}

// Coal hopper wagon, length along X.
function hopperWagon(color) {
  const g = new THREE.Group();
  const body = mat(color);
  g.add(place(box(5.6, 0.25, 2.0, mat(PALETTE.black)), { y: 0.75 }));
  g.add(place(taperedBlock({ w: 3.0, d: 2.0, h: 0.9, topW: 5.4, topD: 2.5, material: body }), { y: 0.9 }));
  g.add(place(box(5.4, 1.3, 2.5, body), { y: 1.8 }));
  g.add(place(box(5.2, 0.12, 2.3, mat(COAL)), { y: 3.0 }));
  for (const x of [-1.6, 1.6]) for (const z of [-0.95, 0.95]) {
    g.add(place(cylinder(0.42, 0.42, 0.18, mat(PALETTE.black), 10), { x, y: 0.42, z, rx: 90 }));
  }
  return g;
}

// Small diesel shunting loco, length along X, cab at -x.
function shunter() {
  const g = new THREE.Group();
  g.add(place(box(6, 0.4, 2.4, mat(PALETTE.black)), { y: 0.7 }));
  g.add(place(box(3.8, 1.8, 2.0, mat(PALETTE.yellow)), { x: 0.9, y: 1.1 }));
  g.add(place(box(1.8, 2.5, 2.4, mat(PALETTE.yellow)), { x: -2.0, y: 1.1 }));
  g.add(place(box(1.84, 0.7, 2.44, mat(PALETTE.glassDark)), { x: -2.0, y: 2.6 }));
  g.add(place(box(1.9, 0.12, 2.5, mat(PALETTE.darkGrey)), { x: -2.0, y: 3.6 }));
  g.add(place(box(6.02, 0.3, 2.42, surface('hazard', PALETTE.yellow, { size: 1 })), { x: 0, y: 0.7 }));
  g.add(place(cylinder(0.15, 0.15, 0.6, mat(PALETTE.darkGrey), 8), { x: 1.8, y: 2.9 }));
  for (const x of [-1.8, 1.8]) for (const z of [-0.95, 0.95]) {
    g.add(place(cylinder(0.45, 0.45, 0.18, mat(PALETTE.black), 10), { x, y: 0.45, z, rx: 90 }));
  }
  return g;
}

// Yellow bulldozer, blade towards +x.
function bulldozer() {
  const y = mat(PALETTE.yellow);
  const k = mat(PALETTE.darkGrey);
  return group(
    place(box(2.6, 0.7, 0.6, k), { z: -0.85 }),
    place(box(2.6, 0.7, 0.6, k), { z: 0.85 }),
    place(box(2.2, 0.8, 1.6, y), { y: 0.6 }),
    place(box(1.1, 1.0, 1.3, y), { x: -0.4, y: 1.4 }),
    place(box(1.14, 0.5, 1.34, mat(PALETTE.glassDark)), { x: -0.4, y: 1.8 }),
    place(box(0.25, 1.0, 2.4, y), { x: 1.6, y: 0.0 }),
  );
}

// Oil-filled transformer with radiator fins and bushings.
function transformer() {
  const g = new THREE.Group();
  const body = mat('#6f7f74');
  g.add(box(2.4, 0.3, 1.8, mat(PALETTE.concrete)));
  g.add(place(box(1.8, 1.8, 1.3, body), { y: 0.3 }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.08, 1.4, 0.4, body), { x: -0.8 + i * 0.4, y: 0.5, z: 0.85 }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.08, 1.4, 0.4, body), { x: -0.8 + i * 0.4, y: 0.5, z: -0.85 }));
  for (const x of [-0.6, 0, 0.6]) {
    g.add(place(cylinder(0.08, 0.14, 0.9, mat('#b0663a'), 6), { x, y: 2.1 }));
  }
  return g;
}

// Name board with 0..1 UVs on the front face so the whole text shows (faces +z, base at y = 0).
function nameBoard(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', border = null } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round(512 * h / w), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, 0.2);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Low-poly coal heap: a lumpy cone.
function coalHeap(r, h) {
  const m = mat(COAL, { roughness: 1 });
  return group(cone(r, h, m, 9), place(cone(r * 0.6, h * 0.75, m, 7), { x: r * 0.45, z: r * 0.2 }));
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const halfW = 15, halfD = 10;
  g.add(lot([3, 2], 'concrete'));

  const brickWall = { style: 'brick', wall: PALETTE.brick, glass: PALETTE.window, frame: PALETTE.stone, windowW: 0.42, windowH: 0.72, lit: 0.15, seed: 31 };
  const brickMat = surface('brick', PALETTE.brick, { size: 2 });
  const brickDarkMat = surface('brick', PALETTE.brickDark, { size: 2 });
  const stoneMat = mat(PALETTE.stone);
  const corrugated = surface('corrugated', PALETTE.steelLight, { size: 1.5, metalness: 0.2, roughness: 0.6 });

  // ---------------------------------------------------------------- ground
  // rail siding along the back
  const railZ = -8.6;
  g.add(place(patch(30, 2.6, 'gravel'), { y: y0, z: railZ }));
  for (let x = -14.6; x <= 14.7; x += 0.8) g.add(place(box(0.25, 0.1, 2.0, mat(PALETTE.woodDark)), { x, y: y0 + 0.05, z: railZ }));
  for (const dz of [-0.72, 0.72]) g.add(place(box(30, 0.15, 0.1, metal(PALETTE.steel)), { y: y0 + 0.15, z: railZ + dz }));
  // coal stockyard (left)
  g.add(place(patch(9, 12.6, 'dirt'), { x: -10.5, y: y0, z: 0.6 }));
  g.add(place(box(8.6, 0.06, 12, mat('#3a3734', { roughness: 1 })), { x: -10.5, y: y0 + 0.05, z: 0.6 }));
  // forecourt / access road along the front
  g.add(place(patch(30, 2.8, 'asphalt'), { y: y0, z: 8.6 }));
  for (let x = -13; x <= 13; x += 3) g.add(place(box(1.4, 0.02, 0.15, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: 8.6 }));

  // ---------------------------------------------------------------- boiler house
  const bx = 2, bz = -3, bw = 12, bd = 7, bh = 18;
  g.add(place(facadeBlock({ w: bw, d: bd, h: bh, floorHeight: 6, bay: 2.4, ...brickWall, roof: PALETTE.roofGrey }), { x: bx, y: y0, z: bz }));
  g.add(place(box(bw + 0.3, 0.5, bd + 0.3, stoneMat), { x: bx, y: y0 + 6 - 0.25, z: bz }));
  g.add(place(box(bw + 0.3, 0.5, bd + 0.3, stoneMat), { x: bx, y: y0 + 12 - 0.25, z: bz }));
  g.add(place(parapet({ w: bw, d: bd, h: 0.8, t: 0.3, material: stoneMat }), { x: bx, y: y0 + bh, z: bz }));
  // roof monitor (clerestory) along X
  g.add(place(facadeBlock({ w: 8, d: 2.6, h: 2.2, floorHeight: 2.2, bay: 1.6, style: 'industrial', wall: PALETTE.steelLight, glass: PALETTE.glassSky, roof: PALETTE.roofSlate, seed: 3 }), { x: bx, y: y0 + bh, z: bz }));
  g.add(place(gableRoof({ w: 8, d: 2.6, h: 0.9, overhang: 0.25, ridge: 'x', material: mat(PALETTE.roofSlate), gableMaterial: PALETTE.steelLight }), { x: bx, y: y0 + bh + 2.2, z: bz }));

  // four corner towers carrying the stacks
  const towerH = 19.5, ts = 2.6;
  const stackH = 15;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = bx + (sx * bw) / 2, z = bz + (sz * bd) / 2;
    g.add(place(box(ts, towerH, ts, brickDarkMat), { x, y: y0, z }));
    g.add(place(box(ts + 0.3, 0.4, ts + 0.3, stoneMat), { x, y: y0 + 6 - 0.2, z }));
    g.add(place(box(ts + 0.3, 0.4, ts + 0.3, stoneMat), { x, y: y0 + 12 - 0.2, z }));
    g.add(place(taperedBlock({ w: ts + 0.4, d: ts + 0.4, h: 0.8, topW: ts - 0.2, topD: ts - 0.2, material: stoneMat }), { x, y: y0 + towerH, z }));
    g.add(place(smokestack({ radius: 1.05, topRadius: 0.8, h: stackH, color: PALETTE.offWhite, bandColor: PALETTE.red, bands: 2 }), { x, y: y0 + towerH + 0.8, z }));
    // steam / smoke puffs drifting to +x
    const puff = mat('#d8d8d4', { roughness: 1, transparent: true, opacity: 0.85 });
    const top = y0 + towerH + 0.8 + stackH;
    g.add(place(sphere(0.9, puff, 8), { x: x + 0.2, y: top + 0.6, z }));
    g.add(place(sphere(1.1, puff, 8), { x: x + 1.0, y: top + 1.6, z: z + 0.2 }));
    g.add(place(sphere(0.8, puff, 8), { x: x + 1.2, y: top + 2.7, z: z - 0.1 }));
  }

  // ---------------------------------------------------------------- turbine hall (front)
  const hx = 2, hz = 4.3, hw = 11, hd = 5, hh = 10;
  g.add(place(facadeBlock({ w: hw, d: hd, h: hh, floorHeight: 10, bay: 1.9, ...brickWall, windowW: 0.5, windowH: 0.78, seed: 32 }), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.3, 0.6, hd + 0.3, stoneMat), { x: hx, y: y0 + hh - 0.6, z: hz }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 2.2, overhang: 0.35, ridge: 'x', material: surface('shingles', PALETTE.roofSlate, { size: 2 }), gableMaterial: brickMat }), { x: hx, y: y0 + hh, z: hz }));
  // big entrance doors + sign
  g.add(place(door({ w: 3.2, h: 4.2, color: PALETTE.roofGreen, frame: PALETTE.stone }), { x: hx, y: y0, z: hz + hd / 2 }));
  g.add(place(box(4.0, 0.4, 0.4, stoneMat), { x: hx, y: y0 + 4.3, z: hz + hd / 2 + 0.1 }));
  g.add(place(nameBoard('POWER STATION', 7, 1.4, { border: PALETTE.stone }), { x: hx, y: y0 + 7.4, z: hz + hd / 2 + 0.12 }));
  // cooling-water pipes from turbine hall down the side
  g.add(pipeRun([[hx + hw / 2, y0 + 3.2, hz - 1], [hx + hw / 2 + 1.2, y0 + 3.2, hz - 1], [hx + hw / 2 + 1.2, y0 + 0.4, hz - 1]], 0.35, metal(PALETTE.steel)));
  g.add(pipeRun([[hx + hw / 2, y0 + 2.2, hz + 0.4], [hx + hw / 2 + 1.2, y0 + 2.2, hz + 0.4], [hx + hw / 2 + 1.2, y0 + 0.4, hz + 0.4]], 0.35, metal(PALETTE.steel)));

  // ---------------------------------------------------------------- coal handling (left)
  // rail unloading shed over the siding
  const ux = -11.5;
  g.add(place(box(5, 4.5, 0.3, corrugated), { x: ux, y: y0, z: railZ - 1.25 }));
  for (const dx of [-2.4, 2.4]) g.add(place(box(0.3, 4.5, 0.3, metal(PALETTE.steelDark)), { x: ux + dx, y: y0, z: railZ + 1.25 }));
  g.add(place(gableRoof({ w: 5, d: 2.6, h: 1, overhang: 0.2, ridge: 'x', material: surface('corrugated', PALETTE.roofGrey, { size: 1.5 }), gableMaterial: corrugated }), { x: ux, y: y0 + 4.5, z: railZ }));
  // transfer tower
  const tx = -11.5, tz = -3.0, tH = 11;
  g.add(place(facadeBlock({ w: 3.2, d: 3.2, h: tH, floorHeight: 3.666, bay: 1.6, style: 'industrial', wall: PALETTE.steelLight, glass: PALETTE.glassSky, seed: 4, roof: PALETTE.roofGrey }), { x: tx, y: y0, z: tz }));
  g.add(place(box(3.6, 0.4, 3.6, metal(PALETTE.steelDark)), { x: tx, y: y0 + tH, z: tz }));
  // conveyor: unloading shed -> transfer tower (along z)
  g.add(gallery([tx, y0 + 4.6, railZ + 1.2], [tx, y0 + 8.4, tz - 1.6], { material: corrugated }));
  // conveyor: transfer tower -> boiler house bunkers (along x, climbing)
  const c2a = [tx + 1.6, y0 + 9.2, tz], c2b = [bx - bw / 2, y0 + 15.2, tz];
  g.add(gallery(c2a, c2b, { material: corrugated }));
  for (const t of [0.5]) {
    const x = c2a[0] + (c2b[0] - c2a[0]) * t, yy = c2a[1] + (c2b[1] - c2a[1]) * t - 0.15;
    g.add(place(trestle(x, tz, yy - y0), { y: y0 }));
  }
  // stacker boom: tower -> over the stockpile (along +z), open belt on trestles
  const boomY = y0 + 7.2;
  g.add(gallery([tx, boomY, tz + 1.6], [tx, boomY, 4.0], { w: 1.2, h: 0.5, material: metal(PALETTE.yellow) }));
  g.add(place(box(1.0, 0.1, 6.4, mat(COAL)), { x: tx, y: boomY + 0.5, z: (tz + 1.6 + 4.0) / 2 }));
  for (const z of [0.8, 3.4]) g.add(place(trestle(tx, z, 7.05, { axis: 'x', span: 1.4 }), { y: y0 }));
  // coal heaps
  g.add(place(coalHeap(3.0, 3.8), { x: tx, y: y0, z: 4.2 }));
  g.add(place(taperedBlock({ w: 4.0, d: 9.0, h: 2.8, topW: 0.6, topD: 6.0, material: mat(COAL, { roughness: 1 }) }), { x: -7.3, y: y0, z: -1.0 }));
  g.add(place(coalHeap(1.6, 1.8), { x: -13.0, y: y0, z: 0.2 }));
  g.add(place(bulldozer(), { x: -7.6, y: y0 + 0.05, z: 5.4, ry: 160 }));
  g.add(place(truck({ color: PALETTE.orange, trailerColor: PALETTE.steelDark }), { x: -10.5, y: y0, z: 8.6, s: 0.8 }));

  // rolling stock on the siding
  g.add(place(hopperWagon(PALETTE.brickBrown), { x: -11.5, y: y0 + 0.2, z: railZ }));
  g.add(place(hopperWagon(PALETTE.brickBrown), { x: -5.6, y: y0 + 0.2, z: railZ }));
  g.add(place(hopperWagon(PALETTE.rust), { x: 0.3, y: y0 + 0.2, z: railZ }));
  g.add(place(shunter(), { x: 6.8, y: y0 + 0.2, z: railZ }));
  g.add(place(box(0.6, 1.0, 2.4, mat(PALETTE.red)), { x: 14.5, y: y0, z: railZ }));

  // ---------------------------------------------------------------- right side: switchyard + office
  const yardX = 12.4, yardZ = -3.0;
  g.add(place(patch(5, 7, 'gravel'), { x: yardX, y: y0, z: yardZ }));
  g.add(place(fence({ w: 5, d: 7, h: 1.4, style: 'wire' }), { x: yardX, y: y0, z: yardZ }));
  g.add(place(transformer(), { x: yardX - 0.6, y: y0, z: yardZ + 1.8, ry: 90 }));
  g.add(place(transformer(), { x: yardX - 0.6, y: y0, z: yardZ - 1.4, ry: 90 }));
  g.add(place(lattice({ w: 1.6, h: 12, topW: 0.7, thickness: 0.12 }), { x: yardX + 1.4, y: y0, z: yardZ }));
  const arm = metal(PALETTE.steelDark);
  g.add(place(box(0.15, 0.15, 4.2, arm), { x: yardX + 1.4, y: y0 + 10.5, z: yardZ }));
  g.add(place(box(0.15, 0.15, 3.0, arm), { x: yardX + 1.4, y: y0 + 8.5, z: yardZ }));
  const wire = mat(PALETTE.black);
  for (const z of [-1.9, 0, 1.9]) {
    g.add(beam([yardX + 1.4, y0 + 10.4, yardZ + z], [yardX - 0.6, y0 + 2.4, yardZ + (z < 0 ? -1.4 : 1.8)], 0.05, wire));
    g.add(beam([yardX + 1.4, y0 + 10.4, yardZ + z], [halfW - 0.05, y0 + 10.4, yardZ + z], 0.05, wire));
  }
  // busbar from turbine hall to transformers
  g.add(beam([hx + hw / 2, y0 + 7.5, hz - 2], [yardX - 0.6, y0 + 2.6, yardZ + 1.8], 0.08, metal(PALETTE.steel)));

  // office block
  const ox = 12.6, oz = 3.6;
  g.add(place(facadeBlock({ w: 4.4, d: 4.0, floors: 2, style: 'punched', wall: PALETTE.cream, frame: PALETTE.white, glass: PALETTE.window, bay: 1.5, windowW: 0.55, lit: 0.3, seed: 8, roof: PALETTE.concreteDark }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: 4.4, d: 4.0, h: 0.5, t: 0.2, material: mat(PALETTE.offWhite) }), { x: ox, y: y0 + 6, z: oz }));
  g.add(place(rooftopUnits({ w: 3, d: 2.6, count: 2, seed: 5 }), { x: ox, y: y0 + 6, z: oz }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.navy }), { x: ox, y: y0, z: oz + 2.0 }));
  g.add(place(box(1.8, 0.12, 1.0, mat(PALETTE.white)), { x: ox, y: y0 + 2.5, z: oz + 2.5 }));
  g.add(place(car({ color: PALETTE.blue }), { x: 9.2, y: y0 + 0.05, z: 7.0, ry: 90, s: 0.8 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 14.0, y: y0 + 0.05, z: 7.0, ry: 90, s: 0.8 }));

  // ---------------------------------------------------------------- props
  for (const x of [-4.5, 8.5]) g.add(place(streetLamp({ h: 4.5 }), { x, y: y0, z: 7.0, ry: -90 }));
  g.add(place(fence({ w: 29.6, d: 0.1, h: 1.2, style: 'wire', sides: ['front'], gap: 10 }), { x: 0, y: y0, z: halfD - 0.15 }));
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 7 }), { x: 9.4, y: y0, z: 1.8 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 8 }), { x: -4.2, y: y0, z: 6.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 9 }), { x: 8.2, y: y0, z: 6.4 }));
  return g;
}

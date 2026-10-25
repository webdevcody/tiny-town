import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, facadeBlock, sawtoothRoof, gableRoof, parapet, box, cylinder, sphere, place, group,
  pipeRun, door, sign, truck, car, fence, hedge, tree, streetLamp, rooftopUnits,
  surface, mat, metal, emissive,
} from '../../src/lib/index.js';

const brickWall = () => surface('brick', PALETTE.brick, { size: 1.2 });
const brickDark = () => surface('brick', PALETTE.brickDark, { size: 1.2 });

// Tall chimney: brick plinth, then a tapering shaft of red and white bands.
function stripedStack({ h = 26, radius = 1.0, topRadius = 0.65, bands = 10, plinth = 2.6, plinthH = 2.4 }) {
  const g = new THREE.Group();
  g.add(box(plinth, plinthH, plinth, brickDark()));
  g.add(place(box(plinth + 0.3, 0.3, plinth + 0.3, PALETTE.stone), { y: plinthH }));
  const y0 = plinthH + 0.3;
  const shaft = h - y0;
  const rAt = (y) => radius + (topRadius - radius) * (y / shaft);
  const bandH = shaft / bands;
  const red = mat(PALETTE.red), white = mat(PALETTE.white);
  for (let i = 0; i < bands; i++) {
    const yb = i * bandH;
    g.add(place(cylinder(rAt(yb + bandH), rAt(yb), bandH, i % 2 ? white : red, 14), { y: y0 + yb }));
  }
  // walkway ring two thirds up, sooty crown, warning light
  const ringY = y0 + bandH * 7;
  g.add(place(cylinder(rAt(bandH * 7) + 0.35, rAt(bandH * 7) + 0.35, 0.12, metal(PALETTE.darkGrey), 14), { y: ringY }));
  g.add(place(cylinder(topRadius + 0.12, topRadius + 0.05, 0.45, PALETTE.darkGrey, 14), { y: h - 0.2 }));
  g.add(place(cylinder(topRadius * 0.75, topRadius * 0.75, 0.05, PALETTE.black, 14), { y: h + 0.25 }));
  g.add(place(sphere(0.14, emissive(PALETTE.red, 1.2), 8), { x: topRadius + 0.1, y: h - 0.1 }));
  return g;
}

// Small cloud of smoke puffs drifting towards -x.
function smoke(seed) {
  const r = rng(seed);
  const m = mat('#d9d6d0', { transparent: true, opacity: 0.85 });
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    const s = 0.55 + i * 0.22;
    g.add(place(sphere(s, m, 8), { x: -i * 0.9 + r.range(-0.2, 0.2), y: i * 0.8, z: r.range(-0.3, 0.3) }));
  }
  return g;
}

// Wooden pallet stacked with a block of bricks.
function brickPallet(h = 0.8) {
  return group(
    box(1.2, 0.15, 1.0, PALETTE.wood),
    place(box(1.1, h, 0.9, surface('brick', PALETTE.brick, { size: 0.5 })), { y: 0.15 }),
    place(box(0.06, h + 0.02, 0.92, PALETTE.lightGrey), { y: 0.15 })
  );
}

// lib sign() leaves the text face with metre UVs, so the texture only covers
// the first metre; rescale the front face (+z, vertices 16..19) to 0..1.
function wallSign(o) {
  const m = sign(o);
  const uv = m.geometry.attributes.uv;
  for (let i = 16; i < 20; i++) uv.setXY(i, uv.getX(i) / o.w, uv.getY(i) / o.h);
  uv.needsUpdate = true;
  return m;
}

// Yellow forklift, forks towards +x, carrying a pallet.
function forklift() {
  const yellow = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const g = group(
    place(box(1.6, 0.8, 1.1, yellow), { y: 0.3 }),
    place(box(0.4, 0.6, 1.1, dark), { x: -0.7, y: 0.6 }),
    place(box(0.5, 0.5, 0.6, PALETTE.black), { x: -0.1, y: 1.1 }),
    place(box(0.08, 2.4, 0.08, dark), { x: 0.85, y: 0.2, z: 0.35 }),
    place(box(0.08, 2.4, 0.08, dark), { x: 0.85, y: 0.2, z: -0.35 }),
    place(box(1.2, 0.06, 1.0, dark), { x: 0.1, y: 2.05 })
  );
  for (const [x, z] of [[-0.5, 0.45], [-0.5, -0.45], [0.5, 0.45], [0.5, -0.45]]) g.add(place(box(0.08, 1.75, 0.08, dark), { x, y: 0.3, z }));
  for (const z of [0.25, -0.25]) g.add(place(box(1.1, 0.06, 0.12, dark), { x: 1.45, y: 0.35, z }));
  g.add(place(brickPallet(0.7), { x: 1.5, y: 0.41 }));
  for (const [x, z] of [[-0.5, 0.55], [-0.5, -0.55], [0.5, 0.55], [0.5, -0.55]]) {
    const w = place(cylinder(0.3, 0.3, 0.25, PALETTE.black, 10), { x, y: 0.3, z, rx: 90 });
    w.position.z = z + (z > 0 ? -0.12 : 0.12);
    g.add(w);
  }
  return g;
}

// Corrugated roller door with a frame, sticks out towards +z.
function rollerDoor(w, h) {
  return group(
    place(box(w + 0.3, h + 0.2, 0.08, PALETTE.steelDark), { z: 0.04 }),
    place(box(w, h, 0.12, surface('corrugated', PALETTE.steelLight, { size: 0.8 })), { z: 0.06 })
  );
}

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // ground: concrete loading yard in front, gravel round the stacks
  g.add(place(patch(14, 9, 'concrete'), { x: 3, y: y0, z: 5.5 }));
  g.add(place(patch(6.5, 11, 'gravel'), { x: 6.75, y: y0, z: -4.5 }));
  g.add(place(patch(2.6, 4.6, 'paved'), { x: -6.2, y: y0, z: 7.7 }));

  // main hall: tall brick walls with big factory windows, glazed sawtooth roof
  const HX = -3, HZ = -4.25, HW = 13, HD = 10.5, HH = 6;
  g.add(place(facadeBlock({ w: HW, d: HD, h: HH, floorHeight: HH, style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.glassSky, windowW: 0.5, windowH: 0.62, bay: 2.6, lit: 0.15, seed: 46, roof: PALETTE.concreteDark }), { x: HX, y: y0, z: HZ }));
  g.add(place(box(HW + 0.3, 0.4, HD + 0.3, brickDark()), { x: HX, y: y0 + HH, z: HZ }));
  const roof = sawtoothRoof({ w: HW, d: HD, h: 2.4, teeth: 4, material: surface('corrugated', PALETTE.roofSlate, { size: 2 }) });
  roof.material = [roof.material[0], roof.material[1], brickWall()];
  g.add(place(roof, { x: HX, y: y0 + HH + 0.4, z: HZ }));
  g.add(place(wallSign({ text: 'BRICKWORKS', w: 7.5, h: 1.1, bg: PALETTE.cream, fg: PALETTE.brickDark, border: PALETTE.brickDark }), { x: 0, y: y0 + 4.5, z: HZ + HD / 2 + 0.1 }));

  // loading dock with two roller doors
  const dockZ = HZ + HD / 2;
  g.add(place(box(7, 1.0, 1.6, PALETTE.concrete), { x: 0.3, y: y0, z: dockZ + 0.8 }));
  g.add(place(box(7, 0.12, 0.12, surface('hazard', PALETTE.yellow, { size: 0.6 })), { x: 0.3, y: y0 + 0.9, z: dockZ + 1.62 }));
  for (const dx of [-1.5, 2.0]) {
    g.add(place(rollerDoor(2.6, 3.2), { x: dx, y: y0 + 1.0, z: dockZ }));
    for (const bx of [-1.0, 1.0]) g.add(place(box(0.3, 0.5, 0.2, PALETTE.black), { x: dx + bx, y: y0 + 0.35, z: dockZ + 1.7 }));
    g.add(place(box(3.2, 0.12, 1.4, PALETTE.steelDark), { x: dx, y: y0 + 4.25, z: dockZ + 0.7 }));
  }
  g.add(place(truck({ color: PALETTE.navy, trailerColor: PALETTE.white }), { x: -1.5, y: y0, z: 6.25, ry: -90, s: 0.7 }));
  g.add(place(forklift(), { x: 2.0, y: y0, z: 4.6, ry: 90, s: 0.9 }));

  // pallets of finished bricks in the yard
  const r = rng(146);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) {
    const px = 5.3 + i * 1.6, pz = 3.3 + j * 1.6;
    const layers = r.int(1, 2);
    for (let k = 0; k < layers; k++) g.add(place(brickPallet(0.8), { x: px, y: y0 + k * 0.95, z: pz }));
  }
  g.add(place(brickPallet(0.6), { x: 3.6, y: y0, z: 8.2, ry: 15 }));
  // heap of raw clay waiting to be moulded
  g.add(place(cylinder(0.3, 1.5, 1.3, surface('gravel', '#b5653a', { size: 1.5 }), 9), { x: 8.2, y: y0, z: 8.2 }));
  g.add(place(box(1.2, 0.45, 1.0, PALETTE.wood), { x: 6.2, y: y0, z: 8.8, ry: -10 }));

  // office: two storeys, flat roof
  const OX = -6.75, OW = 5.5, OD = 4.4, OZ = dockZ + OD / 2;
  g.add(place(facadeBlock({ w: OW, d: OD, floors: 2, style: 'punched', wall: PALETTE.cream, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.55, windowH: 0.5, bay: 1.8, lit: 0.25, seed: 7, roof: PALETTE.concreteDark }), { x: OX, y: y0, z: OZ }));
  g.add(place(box(OW + 0.1, 0.35, OD + 0.1, brickDark()), { x: OX, y: y0, z: OZ }));
  g.add(place(parapet({ w: OW + 0.2, d: OD + 0.2, h: 0.5, t: 0.25, material: brickDark() }), { x: OX, y: y0 + 6, z: OZ }));
  g.add(place(rooftopUnits({ w: OW - 1, d: OD - 1, count: 2, seed: 3 }), { x: OX, y: y0 + 6, z: OZ }));
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.woodDark }), { x: -6.2, y: y0, z: OZ + OD / 2 }));
  g.add(place(box(2, 0.15, 1.0, PALETTE.brickDark), { x: -6.2, y: y0 + 2.6, z: OZ + OD / 2 + 0.5 }));

  // boiler house between the hall and the stacks
  const BX = 4.9, BZ = -4.6, BW = 2.8, BD = 7.6, BH = 4.5;
  g.add(place(facadeBlock({ w: BW, d: BD, h: BH, floorHeight: BH, style: 'brick', wall: PALETTE.brickBrown, frame: PALETTE.white, glass: PALETTE.glassSky, windowW: 0.45, windowH: 0.5, bay: 2.5, lit: 0.3, seed: 9, blank: ['left'] }), { x: BX, y: y0, z: BZ }));
  g.add(place(gableRoof({ w: BW, d: BD, h: 1.3, overhang: 0.2, ridge: 'z', material: surface('roofTiles', PALETTE.roofSlate, { size: 1.5 }), gableMaterial: surface('brick', PALETTE.brickBrown, { size: 1.2 }) }), { x: BX, y: y0 + BH, z: BZ }));
  g.add(place(door({ w: 1.3, h: 2.4, color: PALETTE.green }), { x: BX, y: y0, z: BZ + BD / 2 }));

  // the two striped smokestacks, flue ducts and smoke
  const SX = 8.1;
  for (const [sx, sz, h, seed] of [[SX, -7.4, 24, 1], [SX - 0.5, -1.9, 21, 2]]) {
    g.add(place(stripedStack({ h, plinth: 2.4 }), { x: sx, y: y0, z: sz }));
    g.add(place(box(1.2, 1.2, 1.0, brickDark()), { x: BX + BW / 2 + 0.3, y: y0 + 0.6, z: sz }));
    g.add(place(smoke(seed), { x: sx - 0.3, y: y0 + h + 1.0, z: sz }));
  }
  g.add(pipeRun([[BX + 0.6, y0 + BH + 0.6, BZ - 2], [BX + 0.6, y0 + BH + 2.2, BZ - 2], [BX + 1.6, y0 + BH + 2.2, BZ - 2]], 0.18, metal(PALETTE.steel)));
  g.add(place(cylinder(0.25, 0.25, 0.3, PALETTE.darkGrey, 8), { x: BX + 1.6, y: y0 + BH + 2.05, z: BZ - 2 }));

  // fence round the yard and stack compound, gate open for the lorry
  g.add(place(fence({ w: 6.5, d: 0.1, h: 1.6, style: 'wire', sides: ['front'] }), { x: 6.6, y: y0, z: 9.75 }));
  g.add(place(fence({ w: 0.1, d: 19.5, h: 1.6, style: 'wire', sides: ['right'] }), { x: 9.75, y: y0, z: 0 }));
  g.add(place(fence({ w: 6.2, d: 0.1, h: 1.6, style: 'wire', sides: ['back'] }), { x: 6.65, y: y0, z: -9.75 }));
  for (const gx of [-4.3, 3.35]) g.add(place(box(0.25, 1.9, 0.25, PALETTE.darkGrey), { x: gx, y: y0, z: 9.75 }));

  // office garden: hedge, trees, car, lamp
  g.add(place(hedge({ w: 2.6, h: 0.9, d: 0.6 }), { x: -8.6, y: y0, z: 9.55 }));
  g.add(place(car({ color: PALETTE.red }), { x: -8.6, y: y0, z: 7.2, ry: 90, s: 0.85 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 31 }), { x: -4.7, y: y0, z: 8.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 32 }), { x: -4.8, y: y0, z: 6.4 }));
  g.add(place(tree({ kind: 'cone', h: 4.5, seed: 33 }), { x: -8.9, y: y0, z: 3.4 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 4.2, y: y0, z: 9.5, ry: 180 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, sphere, cone, place, group, parapet, beam, pipeRun,
  lattice, tank, fence, tree, streetLamp, bench, door, mat, metal, glass, emissive, textured,
  signTexture, surface,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: 3-storey white lab block with shading fins, fume stacks and a weather mast.
// East: windowless cleanroom wing with air-handling plant, LN2 tank and a gas-cylinder cage.

// Sign with 0..1 UVs on the front face, so the text fills the whole board (the lib
// sign() uses metre UVs, which shrinks text on boards wider than 1 m).
function bigSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.15 } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Lab exhaust stack: fan housing + tall nozzle with a red tip band.
function fumeStack(h = 4.2) {
  const al = mat(PALETTE.chrome, { roughness: 0.5, metalness: 0.2 });
  return group(
    box(1.0, 0.8, 1.0, mat(PALETTE.steelLight)),
    place(cylinder(0.42, 0.42, 0.25, mat(PALETTE.steelDark), 12), { y: 0.8 }),
    place(cylinder(0.24, 0.32, h, al, 12), { y: 1.05 }),
    place(cylinder(0.25, 0.25, 0.35, mat(PALETTE.red), 12), { y: 1.05 + h - 0.6 }),
    place(cylinder(0.18, 0.24, 0.25, mat(PALETTE.steelDark), 12), { y: 1.05 + h }),
  );
}

// Weather mast: braced lattice with anemometer, wind vane, radome and Stevenson screen.
function weatherMast(h = 7) {
  const steel = metal(PALETTE.steelLight);
  const white = mat(PALETTE.white);
  const g = group(
    lattice({ w: 0.7, h, topW: 0.35, segments: 5, thickness: 0.07, material: mat(PALETTE.red) }),
    place(cylinder(0.04, 0.04, 1.6, steel, 6), { y: h }),
  );
  // anemometer: three arms with cups
  const top = h + 1.6;
  g.add(place(cylinder(0.05, 0.05, 0.25, steel, 6), { y: top }));
  for (let i = 0; i < 3; i++) {
    const a = (i * 2 * Math.PI) / 3;
    const x = Math.cos(a) * 0.45, z = Math.sin(a) * 0.45;
    g.add(beam([0, top + 0.2, 0], [x, top + 0.2, z], 0.04, steel));
    g.add(place(sphere(0.11, mat(PALETTE.darkGrey), 6), { x, y: top + 0.12, z }));
  }
  // cross arm with wind vane and a small radome
  const armY = h - 0.4;
  g.add(place(box(2.6, 0.08, 0.08, steel), { y: armY }));
  g.add(place(cylinder(0.03, 0.03, 0.6, steel, 5), { x: -1.2, y: armY }));
  g.add(place(box(0.7, 0.06, 0.06, mat(PALETTE.darkGrey)), { x: -1.2, y: armY + 0.6 }));
  g.add(place(box(0.05, 0.3, 0.25, mat(PALETTE.orange)), { x: -1.55, y: armY + 0.48 }));
  g.add(place(cylinder(0.05, 0.05, 0.3, steel, 6), { x: 1.15, y: armY }));
  g.add(place(sphere(0.38, white, 12), { x: 1.15, y: armY + 0.55 }));
  // little dish + equipment box partway up
  g.add(place(box(0.5, 0.6, 0.35, white), { x: 0.45, y: 2.2 }));
  g.add(place(cylinder(0.32, 0.05, 0.12, white, 12), { x: 0, y: 4.1, z: 0.42, rx: 90 }));
  return g;
}

// Stevenson screen: white louvred box on legs.
function stevensonScreen() {
  const white = mat(PALETTE.white);
  const g = group(place(box(0.8, 0.6, 0.6, white), { y: 0.9 }), place(box(0.95, 0.06, 0.75, white), { y: 1.5 }));
  for (const [x, z] of [[-0.35, -0.25], [0.35, -0.25], [-0.35, 0.25], [0.35, 0.25]]) g.add(place(box(0.06, 0.9, 0.06, white), { x, z }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.82, 0.03, 0.04, mat(PALETTE.lightGrey)), { y: 0.98 + i * 0.13, z: 0.31 }));
  return g;
}

// Gas cylinder with coloured shoulder and valve cap.
function gasCylinder(body, shoulder, h = 1.5) {
  return group(
    cylinder(0.16, 0.16, h, mat(body, { roughness: 0.4, metalness: 0.3 }), 10),
    place(cylinder(0.1, 0.16, 0.18, mat(shoulder), 10), { y: h }),
    place(cylinder(0.05, 0.05, 0.12, metal(PALETTE.chrome), 6), { y: h + 0.18 }),
  );
}

// DNA double-helix sculpture on a plinth.
function dnaHelix(h = 4.6, radius = 0.6, steps = 14) {
  const g = group(cylinder(0.9, 1.0, 0.45, mat(PALETTE.stoneDark), 12));
  const y0 = 0.45;
  const strandA = mat(PALETTE.blue, { roughness: 0.4, metalness: 0.3 });
  const strandB = mat(PALETTE.red, { roughness: 0.4, metalness: 0.3 });
  const rungs = [mat(PALETTE.yellow), mat(PALETTE.green)];
  g.add(place(cylinder(0.05, 0.05, h, metal(PALETTE.steelLight), 6), { y: y0 }));
  let prevA = null, prevB = null;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = t * Math.PI * 3;
    const y = y0 + 0.2 + t * (h - 0.4);
    const pa = [Math.cos(a) * radius, y, Math.sin(a) * radius];
    const pb = [-pa[0], y, -pa[2]];
    g.add(place(sphere(0.15, strandA, 8), { x: pa[0], y: y - 0.15, z: pa[2] }));
    g.add(place(sphere(0.15, strandB, 8), { x: pb[0], y: y - 0.15, z: pb[2] }));
    g.add(beam(pa, pb, 0.07, rungs[i % 2]));
    if (prevA) {
      g.add(beam(prevA, pa, 0.08, strandA));
      g.add(beam(prevB, pb, 0.08, strandB));
    }
    prevA = pa; prevB = pb;
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  const white = mat(PALETTE.white);
  const finMat = mat(PALETTE.aluminium, { roughness: 0.5, metalness: 0.25 });
  const steel = metal(PALETTE.steel);
  const labBlue = '#2f6fa8';

  // --- main lab block: 3 storeys, white with teal ribbon glazing --------------------
  const ax = -3.9, az = -1.4, aw = 11, ad = 6, floors = 3;
  const aTop = y0 + floors * FLOOR;
  const aFront = az + ad / 2, aLeft = ax - aw / 2, aRight = ax + aw / 2;
  g.add(place(facadeBlock({
    w: aw, d: ad, floors, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassTeal,
    frame: PALETTE.steelLight, lit: 0, bay: 2.2, seed: 31, roof: PALETTE.concrete,
  }), { x: ax, y: y0, z: az }));
  // white plinth band and roof parapet
  g.add(place(box(aw + 0.2, 0.5, ad + 0.2, mat(PALETTE.offWhite)), { x: ax, y: y0, z: az }));
  g.add(place(parapet({ w: aw + 0.1, d: ad + 0.1, h: 0.6, t: 0.25, material: white }), { x: ax, y: aTop, z: az }));
  // blue accent band under the parapet
  g.add(place(box(aw + 0.14, 0.35, ad + 0.14, mat(labBlue)), { x: ax, y: aTop - 0.42, z: az }));

  // vertical shading fins: front face and west face (skip where the atrium sits)
  const atX = -3.8, atW = 4.2;
  for (let x = aLeft + 0.5; x <= aRight - 0.3; x += 1.1) {
    if (Math.abs(x - atX) < atW / 2 + 0.3) continue;
    g.add(place(box(0.12, floors * FLOOR - 0.8, 0.75, finMat), { x, y: y0 + 0.5, z: aFront + 0.38 }));
  }
  for (let z = az - ad / 2 + 0.5; z <= aFront - 0.3; z += 1.1) {
    g.add(place(box(0.75, floors * FLOOR - 0.8, 0.12, finMat), { x: aLeft - 0.38, y: y0 + 0.5, z }));
  }
  // horizontal sun shelves over each floor on the front
  for (let f = 1; f < floors; f++) {
    g.add(place(box(aw - 0.2, 0.08, 0.9, finMat), { x: ax, y: y0 + f * FLOOR - 0.15, z: aFront + 0.45 }));
  }

  // --- glazed entrance atrium + canopy + sign ----------------------------------------
  const atD = 1.6, atH = 2 * FLOOR;
  g.add(place(facadeBlock({
    w: atW, d: atD, floors: 2, style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.white,
    lit: 0, bay: 1.4, seed: 7, roof: PALETTE.white,
  }), { x: atX, y: y0, z: aFront + atD / 2 }));
  g.add(place(box(atW + 0.3, 0.3, atD + 0.3, white), { x: atX, y: y0 + atH, z: aFront + atD / 2 }));
  g.add(place(bigSign('RESEARCH LAB', atW + 0.2, 0.75, { bg: labBlue }), { x: atX, y: y0 + atH + 0.3, z: aFront + atD - 0.1 }));
  g.add(place(box(3.2, 0.18, 1.6, white), { x: atX, y: y0 + 2.6, z: aFront + atD + 0.75 }));
  for (const dx of [-1.45, 1.45]) g.add(place(cylinder(0.07, 0.07, 2.6, steel, 6), { x: atX + dx, y: y0, z: aFront + atD + 1.4 }));
  g.add(place(door({ w: 1.8, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { x: atX, y: y0, z: aFront + atD }));

  // --- roof of the lab block: plant room, fume stacks, ducts, weather mast ------------
  g.add(place(facadeBlock({
    w: 4.6, d: 3, h: 2.4, floorHeight: 2.4, style: 'industrial', wall: PALETTE.lightGrey,
    frame: PALETTE.steel, glass: PALETTE.steelDark, bay: 1.2, seed: 3, roof: PALETTE.concreteDark,
  }), { x: ax - 0.8, y: aTop, z: az - 0.6 }));
  const stackXs = [-8.4, -6.9, -5.4, -3.9, -2.4];
  const stackZ = az - ad / 2 + 0.85;
  stackXs.forEach((x, i) => g.add(place(fumeStack(i % 2 ? 4.2 : 4.9), { x, y: aTop, z: stackZ })));
  // exhaust header duct feeding the stacks from the plant room
  g.add(place(box(stackXs[stackXs.length - 1] - stackXs[0] + 1, 0.55, 0.55, mat(PALETTE.steelLight)), { x: (stackXs[0] + stackXs[stackXs.length - 1]) / 2, y: aTop + 0.15, z: stackZ + 0.85 }));
  // supply ducts over the parapet down the east side
  g.add(pipeRun([[aRight - 1.6, aTop + 1.2, az + 1.2], [aRight + 0.4, aTop + 1.2, az + 1.2], [aRight + 0.4, y0 + 5.5, az + 1.2]], 0.25, mat(PALETTE.steelLight)));
  // weather mast + Stevenson screen in the NE roof corner
  g.add(place(weatherMast(7), { x: aRight - 1.3, y: aTop, z: az - ad / 2 + 1.2 }));
  g.add(place(stevensonScreen(), { x: aRight - 1.2, y: aTop, z: az + 1.6 }));
  // small solar array on the front roof edge
  for (let i = 0; i < 3; i++) {
    g.add(place(box(1.3, 0.06, 0.9, surface('solar', PALETTE.navy, { size: 0.5 })), { x: ax - 4 + i * 1.5, y: aTop + 0.4, z: az + 2.1, rx: 18 }));
  }

  // --- cleanroom wing: windowless white box with blue band, air-handling plant --------
  const cx = 6.05, cz = -2.05, cw = 7.5, cd = 5.3, ch = 5.4;
  const cFront = cz + cd / 2, cTop = y0 + ch;
  g.add(place(facadeBlock({
    w: cw, d: cd, h: ch, floorHeight: ch, style: 'plain', wall: PALETTE.white, roof: PALETTE.concrete,
  }), { x: cx, y: y0, z: cz }));
  // panel joints
  for (let x = cx - cw / 2 + 1.25; x < cx + cw / 2 - 0.2; x += 1.25) {
    g.add(place(box(0.05, ch - 0.1, 0.04, mat(PALETTE.offWhite)), { x, y: y0, z: cFront + 0.02 }));
  }
  for (let z = cz - cd / 2 + 1.3; z < cFront - 0.2; z += 1.3) {
    g.add(place(box(0.04, ch - 0.1, 0.05, mat(PALETTE.offWhite)), { x: cx + cw / 2 + 0.02, y: y0, z }));
  }
  g.add(place(box(cw + 0.1, 0.45, cd + 0.1, mat(labBlue)), { x: cx, y: y0 + 3.3, z: cz }));
  g.add(place(parapet({ w: cw + 0.05, d: cd + 0.05, h: 0.5, t: 0.2, material: white }), { x: cx, y: cTop, z: cz }));
  g.add(place(bigSign('CLEANROOM', 4, 0.8, { bg: labBlue }), { x: cx + 0.9, y: y0 + 4.05, z: cFront + 0.02 }));
  // glazed link to the lab block
  g.add(place(box(cx - cw / 2 - aRight + 0.2, 3, 2.4, glass(PALETTE.glassSky)), { x: (aRight + cx - cw / 2) / 2, y: y0, z: cFront - 1.4 }));
  // air-shower vestibule with door
  g.add(place(box(2, 2.8, 1.2, white), { x: cx - 1.9, y: y0, z: cFront + 0.6 }));
  g.add(place(box(2.1, 0.25, 1.3, mat(labBlue)), { x: cx - 1.9, y: y0 + 2.8, z: cFront + 0.6 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.glassBlue, frame: PALETTE.steelLight }), { x: cx - 1.9, y: y0, z: cFront + 1.2 }));
  // back: roller shutter goods-in door and a lab service door
  g.add(place(box(2.6, 2.8, 0.1, surface('corrugated', PALETTE.steelLight, { size: 0.6 })), { x: cx + 1.2, y: y0, z: cz - cd / 2 - 0.05 }));
  g.add(place(box(2.9, 0.3, 0.2, mat(labBlue)), { x: cx + 1.2, y: y0 + 2.8, z: cz - cd / 2 - 0.1 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.steelDark }), { x: ax + 2, y: y0, z: az - ad / 2, ry: 180 }));
  // roof: two air-handling units with fan discs, HEPA ducts
  for (const [x, z] of [[cx - 1.6, cz - 0.6], [cx + 1.8, cz - 0.6]]) {
    g.add(place(box(2.8, 1.4, 3.2, mat(PALETTE.steelLight)), { x, y: cTop, z }));
    for (const dz of [-0.8, 0.8]) {
      g.add(place(cylinder(0.6, 0.6, 0.15, mat(PALETTE.steelDark), 14), { x, y: cTop + 1.4, z: z + dz }));
      g.add(place(box(1.1, 0.05, 0.08, mat(PALETTE.darkGrey)), { x, y: cTop + 1.55, z: z + dz }));
    }
  }
  g.add(pipeRun([[cx - 1.6, cTop + 0.7, cz + 1.0], [cx - 1.6, cTop + 0.7, cz + 2.0], [cx + 1.8, cTop + 0.7, cz + 2.0], [cx + 1.8, cTop + 0.7, cz + 1.0]], 0.3, metal(PALETTE.aluminium)));
  g.add(place(box(1.4, 0.8, 0.9, mat(PALETTE.lightGrey)), { x: cx + 2.6, y: cTop, z: cz + 1.8 }));

  // --- service yard: LN2 dewar + vaporiser, caged gas cylinder store ---------------
  g.add(place(patch(8, 4.2, 'concrete'), { x: 6, y: y0, z: 2.9 }));
  // liquid nitrogen tank on legs
  g.add(place(tank({ radius: 0.75, h: 3.2, roof: 'dome', legs: 4, legHeight: 0.6, material: mat(PALETTE.white) }), { x: 2.6, y: y0, z: 3.2 }));
  g.add(place(bigSign('LN2', 0.8, 0.4, { bg: PALETTE.white, fg: PALETTE.navy, depth: 0.05 }), { x: 2.6, y: y0 + 2.2, z: 3.97 }));
  for (let i = 0; i < 4; i++) {
    g.add(place(box(0.12, 2.2, 0.9, metal(PALETTE.aluminium)), { x: 3.9 + i * 0.22, y: y0, z: 3.2 }));
  }
  g.add(pipeRun([[2.6, y0 + 0.8, 2.45], [2.6, y0 + 0.8, 2.0], [4.1, y0 + 0.8, 2.0], [4.1, y0 + 0.8, 2.75]], 0.06, metal(PALETTE.chrome)));

  // gas cage: pad, lean-to roof, wire mesh, cylinders chained in two rows
  const gx = 7.9, gz = 2.9, gw = 3.6, gd = 2.6;
  g.add(place(box(gw, 0.12, gd, mat(PALETTE.concreteDark)), { x: gx, y: y0, z: gz }));
  g.add(place(fence({ w: gw, d: gd, h: 2.2, style: 'wire', sides: ['front', 'left', 'right', 'back'], gap: 1.0 }), { x: gx, y: y0 + 0.12, z: gz }));
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(box(0.1, 2.5, 0.1, steel), { x: gx + dx * (gw / 2 - 0.05), y: y0 + 0.12, z: gz + dz * (gd / 2 - 0.05) }));
  }
  g.add(place(box(gw + 0.4, 0.1, gd + 0.4, surface('corrugated', PALETTE.steelLight, { size: 1 })), { x: gx, y: y0 + 2.6, z: gz, rx: -6 }));
  const gases = [
    [PALETTE.darkGrey, PALETTE.white], [PALETTE.black, PALETTE.white], [PALETTE.green, PALETTE.green],
    [PALETTE.navy, PALETTE.navy], [PALETTE.darkGrey, PALETTE.red], [PALETTE.grey, PALETTE.yellow],
    [PALETTE.brickBrown, PALETTE.brickBrown], [PALETTE.black, PALETTE.black],
  ];
  for (let row = 0; row < 2; row++) {
    for (let i = 0; i < 8; i++) {
      const [b, s] = gases[(i + row * 3) % gases.length];
      g.add(place(gasCylinder(b, s, row ? 1.3 : 1.5), { x: gx - 1.45 + i * 0.41, y: y0 + 0.12, z: gz - 0.85 + row * 0.5 }));
    }
    g.add(place(box(gw - 0.3, 0.05, 0.05, mat(PALETTE.yellow)), { x: gx, y: y0 + 1.1, z: gz - 0.65 + row * 0.5 }));
  }
  g.add(place(bigSign('COMPRESSED GAS', 2.4, 0.4, { bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.05 }), { x: gx, y: y0 + 2.1, z: gz + gd / 2 + 0.04 }));

  // --- front plaza: path, lawn, DNA sculpture, trees, lamps, benches, bike rack ------
  g.add(place(patch(atW, 5 - aFront - atD, 'paved'), { x: atX, y: y0, z: (aFront + atD + 5) / 2 }));
  g.add(place(patch(aw + 0.6, 0.9, 'paved'), { x: ax, y: y0, z: aFront + 0.8 }));
  g.add(place(dnaHelix(), { x: -8.1, y: y0, z: 3.3 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 12 }), { x: 0.2, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 4 }), { x: -6.2, y: y0, z: 4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 8 }), { x: -9.4, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 9 }), { x: -1.1, y: y0, z: 4.5 }));
  g.add(place(streetLamp({ h: 4 }), { x: -6.2, y: y0, z: 3.2 }));
  g.add(place(bench({ w: 1.5 }), { x: -0.8, y: y0, z: 3.2, ry: -90 }));
  // bike rack
  for (let i = 0; i < 4; i++) {
    g.add(place(box(0.05, 0.6, 0.6, metal(PALETTE.steelDark)), { x: -6.6 + i * 0.35, y: y0, z: 4.55 }));
  }
  g.add(place(box(1.4, 0.04, 0.06, metal(PALETTE.steelDark)), { x: -6.08, y: y0 + 0.6, z: 4.55 }));
  // emergency eyewash / safety shower post by the gas store
  g.add(place(cylinder(0.05, 0.05, 2.4, mat(PALETTE.green), 6), { x: 5.4, y: y0, z: 4.3 }));
  g.add(place(cone(0.25, 0.2, emissive(PALETTE.green, 0.4), 8), { x: 5.4, y: y0 + 2.4, z: 4.3, rx: 180 }));
  return g;
}

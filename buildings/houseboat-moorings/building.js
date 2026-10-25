import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, chimney, door, box, boxFaces, extrude, cylinder, place, group,
  fence, hedge, tree, streetLamp, bench, flag, surface, mat, metal, pipe, windowPanel,
} from '../../src/lib/index.js';
import {
  bike, bikeStand, bollard, mailbox, parasol, deckchair, planter, pot, lifebuoy, fender, plainSign, duck,
} from './props.js';

// 2x1 tiles (20 x 10 m). A canal runs along X; the towpath quay is the front (+z) street side.
const QUAY_TOP = LOT_HEIGHT + 0.75;   // quay walls stand 0.75 m above the water
const DECK = LOT_HEIGHT + 0.85;       // houseboat deck level
const HULL_W = 2.9;
const BOAT_Z = -0.15;                 // boat centreline; hull side towards the quay at z = 1.3
const QUAY_EDGE = 1.6;                // canal / towpath boundary

const planks = (color) => surface('planks', color, { size: 2 });

// Gangplank from the boat deck across to the quay, with rope handrails.
function gangplank(x) {
  const len = QUAY_EDGE + 0.9 - (BOAT_Z + HULL_W / 2 - 0.3);
  const z0 = BOAT_Z + HULL_W / 2 - 0.3;
  const zc = z0 + len / 2;
  const wood = mat(PALETTE.woodLight);
  const rail = mat(PALETTE.white);
  const g = group(place(box(0.8, 0.08, len, wood), { x, y: DECK, z: zc }));
  for (const dx of [-0.38, 0.38]) {
    g.add(place(box(0.05, 0.05, len, rail), { x: x + dx, y: DECK + 0.85, z: zc }));
    for (const t of [0.15, 0.5, 0.85]) g.add(place(box(0.05, 0.85, 0.05, rail), { x: x + dx, y: DECK, z: z0 + len * t }));
  }
  return g;
}

// Mooring kit along the quay side of a boat: bollards, ropes, tyre fenders.
function mooring(cx, len) {
  const g = new THREE.Group();
  const rope = mat(PALETTE.wheat);
  for (const s of [-1, 1]) {
    const bx = cx + s * (len / 2 - 0.5);
    g.add(place(bollard(), { x: bx, y: QUAY_TOP, z: QUAY_EDGE + 0.35 }));
    g.add(pipe([bx, QUAY_TOP + 0.35, QUAY_EDGE + 0.35], [bx - s * 0.6, DECK + 0.1, BOAT_Z + HULL_W / 2 - 0.15], 0.035, rope));
  }
  for (const dx of [-len * 0.3, 0, len * 0.3]) {
    g.add(place(fender(), { x: cx + dx + 0.6, y: DECK - 0.75, z: BOAT_Z + HULL_W / 2 + 0.1 }));
  }
  return g;
}

// Plain box hull: coloured sides, planked deck, white rubbing strake.
function boxHull(len, color) {
  return group(
    place(boxFaces(len, 0.85, HULL_W, { sides: mat(color), top: planks(PALETTE.woodLight) }), { y: LOT_HEIGHT }),
    place(box(len + 0.06, 0.12, HULL_W + 0.06, mat(PALETTE.white)), { y: DECK - 0.22 }),
  );
}

// Boat A: yellow "woonark" with a railed roof terrace (parasol, deckchairs, planters).
function boatTerrace(cx) {
  const L = 5.6;
  const g = group(place(boxHull(L, PALETTE.navy), { x: cx, z: BOAT_Z }));
  const cw = 4.2, cd = 2.3, ch = 2.3;
  const cabX = cx - 0.5;
  g.add(place(facadeBlock({
    w: cw, d: cd, floors: 1, floorHeight: ch, bay: 1.3, style: 'punched', wall: PALETTE.yellow, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.6, windowH: 0.5, lit: 0.15, seed: 31, roof: planks(PALETTE.wood),
  }), { x: cabX, y: DECK, z: BOAT_Z }));
  const roofY = DECK + ch;
  g.add(place(box(cw + 0.25, 0.12, cd + 0.25, mat(PALETTE.white)), { x: cabX, y: roofY - 0.06, z: BOAT_Z }));
  g.add(place(fence({ w: cw, d: cd, h: 0.75, style: 'railing', color: PALETTE.white }), { x: cabX, y: roofY, z: BOAT_Z }));
  // roof garden
  g.add(place(planter(3.0, 0.5, 3), { x: cabX - 0.5, y: roofY, z: BOAT_Z - cd / 2 + 0.35 }));
  g.add(place(planter(0.5, 1.2, 7), { x: cabX - cw / 2 + 0.35, y: roofY, z: BOAT_Z + 0.35 }));
  g.add(place(parasol(PALETTE.red), { x: cabX + 1.2, y: roofY, z: BOAT_Z - 0.1 }));
  g.add(place(deckchair(PALETTE.blue), { x: cabX + 0.3, y: roofY, z: BOAT_Z + 0.45 }));
  g.add(place(deckchair(PALETTE.orange), { x: cabX + 1.2, y: roofY, z: BOAT_Z + 0.55 }));
  // door + gangplank onto the quay, bow deck with pots and a ladder to the roof
  g.add(place(door({ w: 0.9, h: 1.95, color: PALETTE.navy, frame: PALETTE.white }), { x: cabX + 1.4, y: DECK, z: BOAT_Z + cd / 2 }));
  g.add(gangplank(cabX + 1.4));
  g.add(place(lifebuoy(), { x: cabX - 1.2, y: DECK + 1.3, z: BOAT_Z + cd / 2 + 0.05 }));
  const bowX = cx + L / 2 - 0.55;
  g.add(place(pot(PALETTE.red, 1), { x: bowX, y: DECK, z: BOAT_Z - 0.8 }));
  g.add(place(pot(PALETTE.purple, 2), { x: bowX, y: DECK, z: BOAT_Z - 0.2 }));
  g.add(place(box(0.6, 0.45, 0.6, mat(PALETTE.woodDark)), { x: bowX, y: DECK, z: BOAT_Z + 0.7 }));
  for (let i = 0; i < 6; i++) g.add(place(box(0.08, 0.06, 0.5, mat(PALETTE.white)), { x: cabX + cw / 2 + 0.05, y: DECK + 0.35 + i * 0.38, z: BOAT_Z - 0.6 }));
  g.add(place(box(0.06, ch, 0.06, mat(PALETTE.white)), { x: cabX + cw / 2 + 0.05, y: DECK, z: BOAT_Z - 0.85 }));
  g.add(place(box(0.06, ch, 0.06, mat(PALETTE.white)), { x: cabX + cw / 2 + 0.05, y: DECK, z: BOAT_Z - 0.35 }));
  g.add(mooring(cx, L));
  return g;
}

// Boat B: converted Dutch barge, pointed bow (+x), teal cabin with a grass roof garden, stern wheelhouse.
function boatBarge(cx) {
  const L = 6.0, W = HULL_W;
  const pts = [[-L / 2, -W / 2], [L / 2 - 1.3, -W / 2], [L / 2 - 0.4, -W / 2 + 0.6], [L / 2, 0], [L / 2 - 0.4, W / 2 - 0.6], [L / 2 - 1.3, W / 2], [-L / 2, W / 2]];
  const g = new THREE.Group();
  g.add(place(extrude(pts, 0.85, mat(PALETTE.black), planks(PALETTE.woodLight)), { x: cx, y: LOT_HEIGHT, z: BOAT_Z }));
  const bandPts = pts.map(([x, z]) => [x * 1.01, z * 1.02]);
  g.add(place(extrude(bandPts, 0.14, mat(PALETTE.red), mat(PALETTE.red)), { x: cx, y: DECK - 0.3, z: BOAT_Z }));
  g.add(place(extrude(pts.map(([x, z]) => [x * 1.015, z * 1.03]), 0.08, mat(PALETTE.white), mat(PALETTE.white)), { x: cx, y: DECK - 0.08, z: BOAT_Z }));
  // main cabin
  const teal = '#2fa79b';
  const cw = 2.8, cd = 2.3, ch = 1.9;
  const cabX = cx - 0.1;
  g.add(place(facadeBlock({
    w: cw, d: cd, floors: 1, floorHeight: ch, bay: 1.1, style: 'punched', wall: teal, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.55, windowH: 0.45, lit: 0.2, seed: 41, roof: PALETTE.woodDark,
  }), { x: cabX, y: DECK, z: BOAT_Z }));
  const roofY = DECK + ch;
  g.add(place(box(cw + 0.2, 0.1, cd + 0.2, mat(PALETTE.woodDark)), { x: cabX, y: roofY - 0.05, z: BOAT_Z }));
  // grass roof garden with raised beds, a little tree and flowers
  g.add(place(box(cw - 0.1, 0.22, cd - 0.1, surface('grass', PALETTE.grass, { size: 2 })), { x: cabX, y: roofY, z: BOAT_Z }));
  g.add(place(planter(1.4, 0.45, 11, [PALETTE.yellow, PALETTE.orange, PALETTE.red]), { x: cabX - 0.6, y: roofY + 0.22, z: BOAT_Z - 0.75 }));
  g.add(place(tree({ kind: 'round', h: 2.1, seed: 12 }), { x: cabX + 0.8, y: roofY + 0.22, z: BOAT_Z - 0.45 }));
  g.add(place(pot(PALETTE.pink, 3), { x: cabX - 1.0, y: roofY + 0.22, z: BOAT_Z + 0.5 }));
  g.add(place(pot(PALETTE.yellow, 4), { x: cabX + 0.1, y: roofY + 0.22, z: BOAT_Z + 0.6 }));
  g.add(place(box(0.9, 0.08, 0.5, mat(PALETTE.wood)), { x: cabX - 0.3, y: roofY + 0.45, z: BOAT_Z + 0.55 }));
  // wheelhouse at the stern
  const whX = cx - L / 2 + 0.8;
  g.add(place(facadeBlock({
    w: 1.2, d: 2.0, floors: 1, floorHeight: 2.3, bay: 1.0, style: 'ribbon', wall: PALETTE.white, frame: PALETTE.white,
    glass: PALETTE.glassSky, lit: 0, seed: 42, roof: PALETTE.red,
  }), { x: whX, y: DECK, z: BOAT_Z }));
  g.add(place(box(1.5, 0.12, 2.3, mat(PALETTE.red)), { x: whX, y: DECK + 2.3, z: BOAT_Z }));
  g.add(place(cylinder(0.08, 0.08, 1.2, metal(PALETTE.darkGrey), 6), { x: whX - 0.35, y: DECK + 2.4, z: BOAT_Z - 0.6 }));
  g.add(place(cylinder(0.14, 0.1, 0.12, metal(PALETTE.darkGrey), 6), { x: whX - 0.35, y: DECK + 3.6, z: BOAT_Z - 0.6 }));
  g.add(place(flag({ h: 2.0, color: PALETTE.red, color2: PALETTE.blue }), { x: cx - L / 2 + 0.15, y: DECK, z: BOAT_Z }));
  // foredeck: bike and a crate of plants
  g.add(place(bike(PALETTE.green), { x: cx + L / 2 - 1.2, y: DECK, z: BOAT_Z - 0.45, ry: 90, s: 0.85 }));
  g.add(place(pot(PALETTE.red, 5), { x: cx + L / 2 - 1.0, y: DECK, z: BOAT_Z + 0.6 }));
  g.add(place(door({ w: 0.85, h: 1.7, color: PALETTE.woodDark, frame: PALETTE.white }), { x: cabX + 0.9, y: DECK, z: BOAT_Z + cd / 2 }));
  g.add(gangplank(cabX + 0.9));
  g.add(place(lifebuoy(), { x: whX, y: DECK + 1.2, z: BOAT_Z + 1.0 + 0.04 }));
  g.add(mooring(cx, L));
  return g;
}

// Boat C: coral cottage boat with a pitched roof and chimney, and an aft garden deck under a pergola.
function boatCottage(cx) {
  const L = 5.6;
  const g = group(place(boxHull(L, '#2f6b45'), { x: cx, z: BOAT_Z }));
  const coral = '#e8705f';
  const cw = 3.3, cd = 2.3, ch = 2.1;
  const cabX = cx + L / 2 - 0.25 - cw / 2;
  g.add(place(facadeBlock({
    w: cw, d: cd, floors: 1, floorHeight: ch, bay: 1.2, style: 'punched', wall: coral, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.55, windowH: 0.5, shutters: PALETTE.navy, lit: 0.15, seed: 51,
  }), { x: cabX, y: DECK, z: BOAT_Z }));
  g.add(place(gableRoof({ w: cw, d: cd, h: 1.3, overhang: 0.25, ridge: 'x', material: surface('roofTiles', PALETTE.roofSlate, { size: 1.5 }), gableMaterial: coral }), { x: cabX, y: DECK + ch, z: BOAT_Z }));
  g.add(place(chimney({ w: 0.4, h: 1.2, material: mat(PALETTE.white) }), { x: cabX + 0.9, y: DECK + ch + 0.4, z: BOAT_Z - 0.55 }));
  g.add(place(door({ w: 0.85, h: 1.85, color: PALETTE.yellow, frame: PALETTE.white }), { x: cabX - cw / 2, y: DECK, z: BOAT_Z, ry: -90 }));
  g.add(place(lifebuoy(), { x: cabX + 0.9, y: DECK + 1.25, z: BOAT_Z + cd / 2 + 0.05 }));
  // aft garden deck: pergola, table, chairs, pots
  const ax = cx - L / 2 + 1.05;
  const post = mat(PALETTE.white);
  for (const [dx, dz] of [[-0.75, -1.1], [0.75, -1.1], [-0.75, 1.1], [0.75, 1.1]]) g.add(place(box(0.08, 2.0, 0.08, post), { x: ax + dx, y: DECK, z: BOAT_Z + dz }));
  for (const dz of [-1.1, 1.1]) g.add(place(box(1.7, 0.1, 0.1, post), { x: ax, y: DECK + 2.0, z: BOAT_Z + dz }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.08, 0.08, 2.4, post), { x: ax - 0.7 + i * 0.35, y: DECK + 2.08, z: BOAT_Z }));
  g.add(place(tree({ kind: 'bush', h: 0.5, seed: 61, color: PALETTE.foliageLight }), { x: ax - 0.3, y: DECK + 2.1, z: BOAT_Z - 0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.5, seed: 62, color: PALETTE.foliage }), { x: ax + 0.4, y: DECK + 2.1, z: BOAT_Z + 0.5 }));
  g.add(place(cylinder(0.4, 0.4, 0.06, mat(PALETTE.white), 10), { x: ax, y: DECK + 0.7, z: BOAT_Z - 0.1 }));
  g.add(place(cylinder(0.05, 0.05, 0.7, mat(PALETTE.white), 6), { x: ax, y: DECK, z: BOAT_Z - 0.1 }));
  g.add(place(deckchair(PALETTE.yellow), { x: ax, y: DECK, z: BOAT_Z - 0.85, s: [1, 1, 0.7] }));
  g.add(place(planter(1.4, 0.4, 21, [PALETTE.pink, PALETTE.purple, PALETTE.white]), { x: ax, y: DECK, z: BOAT_Z - HULL_W / 2 + 0.25 }));
  g.add(place(pot(PALETTE.red, 6), { x: ax - 0.7, y: DECK, z: BOAT_Z + 0.4 }));
  g.add(gangplank(ax + 0.3));
  // kayak tied up on the canal side
  const kayak = group(
    place(box(2.6, 0.22, 0.5, mat(PALETTE.orange)), {}),
    place(box(0.7, 0.05, 0.32, mat(PALETTE.black)), { y: 0.22 }),
  );
  g.add(place(kayak, { x: cx + 0.6, y: LOT_HEIGHT, z: BOAT_Z - HULL_W / 2 - 0.4 }));
  g.add(mooring(cx, L));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'water'));
  const y = LOT_HEIGHT;
  const brick = surface('brick', PALETTE.brickBrown, { size: 1.5 });
  const stone = mat(PALETTE.stone);

  // front quay / towpath (street side, +z) and back verge
  const qd = 5 - QUAY_EDGE;
  g.add(place(boxFaces(20, 0.75, qd, { sides: brick, top: surface('paving', PALETTE.paving, { size: 3 }) }), { y, z: QUAY_EDGE + qd / 2 }));
  g.add(place(box(20, 0.1, 0.4, stone), { y: QUAY_TOP, z: QUAY_EDGE + 0.2 }));
  g.add(place(patch(20, 1.35, surface('asphalt', '#b4554a', { size: 4 })), { y: QUAY_TOP, z: 4.2 }));
  for (let x = -9.25; x < 10; x += 1.5) g.add(place(box(0.7, 0.06, 0.08, mat(PALETTE.white)), { x, y: QUAY_TOP, z: 3.48 }));
  const bd = 1.0;
  g.add(place(boxFaces(20, 0.75, bd, { sides: brick, top: surface('grass', PALETTE.grass, { size: 3 }) }), { y, z: -5 + bd / 2 }));
  g.add(place(box(20, 0.1, 0.25, stone), { y: QUAY_TOP, z: -5 + bd - 0.125 }));
  g.add(place(fence({ w: 20, d: 0.1, h: 0.9, style: 'railing', sides: ['front'] }), { y: QUAY_TOP, z: -5 + bd - 0.25 }));
  g.add(place(hedge({ w: 19.6, h: 0.9, d: 0.45 }), { y: QUAY_TOP, z: -4.75 }));
  for (const [x, kind, h, s] of [[-8.0, 'round', 3.4, 2], [-1.6, 'poplar', 4.6, 3], [4.9, 'round', 3.2, 4]]) {
    g.add(place(tree({ kind, h, seed: s }), { x, y: QUAY_TOP, z: -4.05 }));
  }

  // the three houseboats
  g.add(boatTerrace(-6.7));
  g.add(boatBarge(0));
  g.add(boatCottage(6.7));

  // towpath life: mailboxes by each gangplank, bikes, benches, lamps, planters
  const zp = QUAY_EDGE + 0.9;
  g.add(place(mailbox(PALETTE.yellow), { x: -6.6, y: QUAY_TOP, z: zp + 0.6 }));
  g.add(place(mailbox('#2fa79b'), { x: 1.4, y: QUAY_TOP, z: zp + 0.6 }));
  g.add(place(mailbox('#e8705f'), { x: 4.6, y: QUAY_TOP, z: zp + 0.6 }));
  for (const [x, c] of [[-2.3, PALETTE.blue], [-1.6, PALETTE.red], [-0.9, PALETTE.black]]) {
    g.add(place(bikeStand(), { x: x + 0.35, y: QUAY_TOP, z: 2.9, ry: 90 }));
    g.add(place(bike(c), { x, y: QUAY_TOP, z: 2.9, ry: -90 }));
  }
  g.add(place(bike(PALETTE.yellow), { x: 8.6, y: QUAY_TOP, z: 2.9, ry: 180 }));
  g.add(place(bike(PALETTE.purple), { x: -8.8, y: QUAY_TOP, z: 4.1 }));
  g.add(place(bike(PALETTE.orange), { x: 5.2, y: QUAY_TOP, z: 4.5, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: -4.7, y: QUAY_TOP, z: 2.4, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 2.0, y: QUAY_TOP, z: 2.4, ry: 180 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: -9.4, y: QUAY_TOP, z: 3.1, ry: 90 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: 0.4, y: QUAY_TOP, z: 3.1, ry: 90 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: 9.4, y: QUAY_TOP, z: 3.1, ry: 90 }));
  for (const [x, s] of [[-3.45, 71], [3.45, 72]]) {
    g.add(place(cylinder(0.55, 0.5, 0.45, mat(PALETTE.stoneDark), 10), { x, y: QUAY_TOP, z: 3.0 }));
    g.add(place(tree({ kind: 'round', h: 3.4, seed: s }), { x, y: QUAY_TOP + 0.45, z: 3.0 }));
  }
  // moorings name board on the towpath
  const signPost = mat(PALETTE.darkGrey);
  g.add(place(box(0.08, 1.9, 0.08, signPost), { x: -8.85, y: QUAY_TOP, z: 3.15 }));
  g.add(place(box(0.08, 1.9, 0.08, signPost), { x: -7.15, y: QUAY_TOP, z: 3.15 }));
  g.add(place(plainSign('MOORINGS', 1.9, 0.5, { bg: PALETTE.navy, fg: '#ffffff', border: '#ffffff' }), { x: -8.0, y: QUAY_TOP + 1.35, z: 3.15 }));

  // ducks and reeds on the canal
  g.add(place(duck(), { x: -1.5, y, z: -3.0, ry: 20 }));
  g.add(place(duck(), { x: -0.9, y, z: -3.3, ry: 10 }));
  g.add(place(duck(PALETTE.woodDark), { x: 5.0, y, z: -3.3, ry: 190 }));
  const reed = mat(PALETTE.foliageLight);
  for (const x of [-9.6, -9.2, -4.9, -4.5, 3.0, 3.4, 9.3]) g.add(place(box(0.08, 0.9, 0.08, reed), { x, y, z: -3.85 }));
  return g;
}

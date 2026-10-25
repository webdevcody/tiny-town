import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, boxFaces, box, cylinder, place, group, beam, surface, mat, metal, glass,
  facadeBlock, pyramidRoof, parapet, sign, door, flag, streetLamp, bench, tree, antenna,
} from '../../src/lib/index.js';
import { sailboat, motorYacht, dinghy, hull } from './boats.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z: a stone quay runs along the
// front and down the west side; the rest is harbour water with wooden pontoons.
const W = TILE * 2, D = TILE;
const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const WATER = LOT_HEIGHT;           // water surface = lot top
const QUAY = WATER + 0.8;           // quay top
const DECK = WATER + 0.36;          // pontoon deck top
const QZ = 2.6;                     // quay edge (front strip z QZ..Z1)
const WX = -6.5;                    // west quay edge (west block x X0..WX)

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'water'));

  const quaySide = surface('brick', PALETTE.stone, { size: 1.6, color2: PALETTE.stoneDark });
  const quayTop = surface('paving', PALETTE.paving, { size: 3 });
  const quayBlock = (w, d) => boxFaces(w, QUAY - WATER, d, { sides: quaySide, top: quayTop });
  g.add(place(quayBlock(W, Z1 - QZ), { y: WATER, z: (QZ + Z1) / 2 }));
  g.add(place(quayBlock(WX - X0, QZ - Z0), { x: (X0 + WX) / 2, y: WATER, z: (Z0 + QZ) / 2 }));
  // dark wet band where the quay meets the water
  const wet = mat(PALETTE.stoneDark);
  g.add(place(box(W - (WX - X0), 0.18, 0.04, wet), { x: (WX + X1) / 2, y: WATER, z: QZ }));
  g.add(place(box(0.04, 0.18, QZ - Z0, wet), { x: WX, y: WATER, z: (Z0 + QZ) / 2 }));
  // kerb stones along the quay edge
  const kerb = mat(PALETTE.concrete);
  g.add(place(box(X1 - WX, 0.1, 0.3, kerb), { x: (WX + X1) / 2, y: QUAY, z: QZ + 0.15 }));
  g.add(place(box(0.3, 0.1, QZ - Z0, kerb), { x: WX - 0.15, y: QUAY, z: (Z0 + QZ) / 2 }));

  addPontoons(g);
  addBoats(g);
  addHarbourMaster(g);
  addQuayProps(g);
  return g;
}

// ---------------------------------------------------------------------------

function addPontoons(g) {
  const planks = surface('planks', PALETTE.woodLight, { size: 1.2 });
  const float = mat(PALETTE.darkGrey);
  const pile = mat(PALETTE.woodDark);
  const pontoon = (w, d) => group(
    place(box(w - 0.1, DECK - WATER - 0.08, d - 0.1, float), {}),
    place(box(w, 0.08, d, planks), { y: DECK - WATER - 0.08 })
  );
  // main walkway along x, joined to the west quay
  const sz0 = 0.6, sz1 = 1.6, sx1 = 9.4;
  g.add(place(pontoon(sx1 - WX, sz1 - sz0), { x: (WX + sx1) / 2, y: WATER, z: (sz0 + sz1) / 2 }));
  // finger pontoons heading north
  const fingers = [-5.3, -1.3, 2.7, 6.7];
  const fz1 = -4.1;
  for (const fx of fingers) {
    g.add(place(pontoon(0.55, sz0 - fz1), { x: fx, y: WATER, z: (sz0 + fz1) / 2 }));
    // mooring cleats
    g.add(place(box(0.08, 0.06, 0.25, metal(PALETTE.steelLight)), { x: fx, y: DECK, z: fz1 + 0.5 }));
    g.add(place(cylinder(0.14, 0.14, 1.9, pile, 8), { x: fx, y: WATER, z: fz1 - 0.2 }));
    g.add(place(cylinder(0.16, 0.16, 0.08, mat(PALETTE.white), 8), { x: fx, y: WATER + 1.9, z: fz1 - 0.2 }));
  }
  // piles along the walkway
  for (const px of [-3.3, 0.7, 4.7, 8.6]) {
    g.add(place(cylinder(0.14, 0.14, 1.7, pile, 8), { x: px, y: WATER, z: sz1 + 0.15 }));
  }
  g.add(place(cylinder(0.14, 0.14, 1.7, pile, 8), { x: sx1 + 0.15, y: WATER, z: sz0 + 0.1 }));
  // water / power pedestals on the walkway
  for (const px of [-3.3, 0.7, 4.7, 8.6]) {
    g.add(place(box(0.25, 0.7, 0.25, mat(PALETTE.white)), { x: px, y: DECK, z: sz0 + 0.2 }));
    g.add(place(box(0.27, 0.1, 0.27, mat(PALETTE.blue)), { x: px, y: DECK + 0.6, z: sz0 + 0.2 }));
  }

  // gangway: hinged ramp from the front quay down to the walkway, with handrails
  const gx = -3.3 + 1.7;
  const gw = 1.1;
  const from = [QZ + 0.05, QUAY], to = [sz1 - 0.15, DECK];
  const ramp = new THREE.Group();
  ramp.add(beam([gx, from[1] - 0.04, from[0]], [gx, to[1] - 0.04, to[0]], 0.08, planks));
  for (const s of [-1, 1]) {
    const x = gx + s * gw / 2;
    for (const k of [0, 0.5, 1]) {
      const z = from[0] + (to[0] - from[0]) * k, y = from[1] + (to[1] - from[1]) * k;
      ramp.add(place(box(0.05, 0.85, 0.05, metal(PALETTE.steelLight)), { x, y, z }));
    }
    ramp.add(beam([x, from[1] + 0.85, from[0]], [x, to[1] + 0.85, to[0]], 0.05, metal(PALETTE.steelLight)));
  }
  // widen the plank beam to the gangway width
  ramp.children[0].scale.x = gw / 0.08;
  g.add(ramp);
}

function addBoats(g) {
  const sternZ = 0.6 - 0.35;
  const moor = (boat, x, L) => place(boat, { x, y: WATER - 0.1, z: sternZ - L / 2, ry: 90 });
  g.add(moor(sailboat({ L: 4.6, B: 1.85, sail: 'up', mastH: 6.8, band: PALETTE.navy }), -3.3, 4.6));
  g.add(moor(motorYacht({ L: 5.0, B: 2.4, accent: PALETTE.navy }), 0.7, 5.0));
  g.add(moor(sailboat({ L: 4.8, B: 1.9, color: PALETTE.navy, band: PALETTE.red, cover: PALETTE.red, mastH: 7.2 }), 4.7, 4.8));
  g.add(moor(sailboat({ L: 4.0, B: 1.6, sail: 'up', band: PALETTE.green, mastH: 5.8, swing: -24 }), 8.5, 4.0));
  // rowing boat tied up in the gap between walkway and quay
  g.add(place(dinghy({ L: 2.3, B: 0.85, color: PALETTE.orange }), { x: 3.8, y: WATER - 0.05, z: 2.1, ry: 180 }));
  g.add(place(dinghy({ L: 2.0, B: 0.8, color: PALETTE.blue }), { x: 7.3, y: WATER - 0.05, z: 2.1, ry: 10 }));
}

function addHarbourMaster(g) {
  // harbour-master hut on the west quay: white office with a glazed lookout
  const hx = -8.25, hz = -1.4, hw = 3.0, hd = 3.4;
  const y = QUAY;
  g.add(place(facadeBlock({ w: hw, d: hd, floors: 1, style: 'punched', wall: PALETTE.white, frame: PALETTE.navy, glass: PALETTE.window, windowW: 0.5, windowH: 0.5, bay: 1.5, lit: 0.2, seed: 4, roof: PALETTE.concreteDark }), { x: hx, y, z: hz }));
  g.add(place(box(hw + 0.1, 0.4, hd + 0.1, mat(PALETTE.navy)), { x: hx, y: y - 0.02, z: hz }));
  g.add(place(parapet({ w: hw, d: hd, h: 0.35, t: 0.15, material: mat(PALETTE.navy) }), { x: hx, y: y + 3, z: hz }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.navy }), { x: hx + 0.6, y, z: hz + hd / 2 }));
  g.add(place(sign({ text: 'HARBOUR MASTER', w: 2.9, h: 0.7, bg: PALETTE.navy }), { x: hx, y: y + 2.25, z: hz + hd / 2 }));
  // lookout cabin
  const ly = y + 3;
  g.add(place(box(1.9, 0.3, 1.9, mat(PALETTE.white)), { x: hx, y: ly, z: hz - 0.2 }));
  g.add(place(box(1.8, 1.0, 1.8, glass(PALETTE.glassSky)), { x: hx, y: ly + 0.3, z: hz - 0.2 }));
  for (const [dx, dz] of [[-0.9, -0.9], [0.9, -0.9], [-0.9, 0.9], [0.9, 0.9]]) {
    g.add(place(box(0.12, 1.0, 0.12, mat(PALETTE.white)), { x: hx + dx, y: ly + 0.3, z: hz - 0.2 + dz }));
  }
  g.add(place(pyramidRoof({ w: 1.9, d: 1.9, h: 0.9, overhang: 0.25, material: mat(PALETTE.roofRed) }), { x: hx, y: ly + 1.3, z: hz - 0.2 }));
  g.add(place(antenna({ h: 1.6 }), { x: hx, y: ly + 2.2, z: hz - 0.2 }));
  // flag pole and a lifebuoy on the wall
  g.add(place(flag({ h: 5.5, color: PALETTE.blue, color2: PALETTE.white }), { x: hx + 1.1, y, z: hz + hd / 2 + 0.9 }));
  g.add(place(lifebuoy(), { x: hx - 0.7, y: y + 1.4, z: hz + hd / 2 + 0.05 }));

  // boat on stands for winter work at the north end of the west quay
  const stand = new THREE.Group();
  stand.add(place(hull({ L: 3.6, B: 1.5, h: 0.6, color: PALETTE.white, band: PALETTE.red }), { y: 0.55 }));
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) stand.add(place(box(0.12, 0.7, 0.12, mat(PALETTE.blue)), { x: sx * 0.9, z: sz * 0.55 }));
  }
  stand.add(place(box(0.5, 0.55, 0.6, mat(PALETTE.woodDark)), { x: 0 }));
  g.add(place(stand, { x: -8.3, y, z: -4.0 }));
  // jib crane for lifting boats out
  const cx = -6.9, cz = -4.4;
  g.add(place(cylinder(0.18, 0.22, 3.6, mat(PALETTE.yellow), 8), { x: cx, y, z: cz }));
  g.add(beam([cx - 0.3, y + 3.5, cz], [cx + 1.8, y + 3.5, cz], 0.22, mat(PALETTE.yellow)));
  g.add(beam([cx, y + 2.5, cz], [cx + 1.2, y + 3.4, cz], 0.1, mat(PALETTE.yellow)));
  g.add(beam([cx + 1.7, y + 3.4, cz], [cx + 1.7, y + 1.6, cz], 0.03, mat(PALETTE.darkGrey)));
  g.add(place(box(0.25, 0.25, 0.25, mat(PALETTE.red)), { x: cx + 1.7, y: y + 1.4, z: cz }));
}

function lifebuoy() {
  const m = mat(PALETTE.orange);
  const torus = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 6, 12), m);
  torus.position.z = 0.09;
  return group(torus);
}

function addQuayProps(g) {
  const y = QUAY;
  // bollards along the quay edge
  const bollard = () => group(
    cylinder(0.12, 0.14, 0.4, mat(PALETTE.black), 8),
    place(cylinder(0.18, 0.18, 0.08, mat(PALETTE.black), 8), { y: 0.4 })
  );
  for (const bx of [-5.6, 0.6, 3.2, 6.2, 9.2]) g.add(place(bollard(), { x: bx, y, z: QZ + 0.45 }));
  for (const bz of [-3.0, 1.4]) g.add(place(bollard(), { x: WX - 0.45, y, z: bz }));

  // lamps, benches facing the water, lifebuoy post
  g.add(place(streetLamp({ h: 3.6 }), { x: -2.8, y, z: 4.4, ry: 90 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 2.2, y, z: 4.4, ry: 90 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 8.6, y, z: 4.4, ry: 90 }));
  g.add(place(bench({ w: 1.5 }), { x: 0.3, y, z: 3.6, ry: 180 }));
  g.add(place(bench({ w: 1.5 }), { x: 5.3, y, z: 3.6, ry: 180 }));
  g.add(place(box(0.1, 1.5, 0.1, mat(PALETTE.white)), { x: -0.8, y, z: QZ + 0.5 }));
  g.add(place(lifebuoy(), { x: -0.8, y: y + 1.0, z: QZ + 0.5 }));

  // marina name board at the street side
  g.add(place(box(0.1, 1.6, 0.1, mat(PALETTE.woodDark)), { x: -6.0, y, z: 4.6 }));
  g.add(place(box(0.1, 1.6, 0.1, mat(PALETTE.woodDark)), { x: -3.6, y, z: 4.6 }));
  g.add(place(sign({ text: 'MARINA', w: 2.4, h: 0.9, bg: PALETTE.blue, double: true }), { x: -4.8, y: y + 1.2, z: 4.6 }));

  // fuel berth kiosk at the east end
  g.add(place(box(1.0, 1.2, 0.6, mat(PALETTE.red)), { x: 9.1, y, z: 3.3 }));
  g.add(place(box(1.04, 0.25, 0.64, mat(PALETTE.white)), { x: 9.1, y: y + 1.2, z: 3.3 }));
  g.add(place(box(0.5, 0.35, 0.05, mat(PALETTE.glassDark)), { x: 9.1, y: y + 0.65, z: 3.6 }));

  // crates, a barrel stack and a dinghy on a trolley
  const crate = mat(PALETTE.wood);
  g.add(place(box(0.6, 0.6, 0.6, crate), { x: -1.9, y, z: 4.4 }));
  g.add(place(box(0.5, 0.5, 0.5, crate), { x: -2.0, y: y + 0.6, z: 4.4, ry: 20 }));
  g.add(place(cylinder(0.25, 0.25, 0.7, mat(PALETTE.blue), 10), { x: -1.2, y, z: 4.5 }));
  g.add(place(cylinder(0.25, 0.25, 0.7, mat(PALETTE.blue), 10), { x: -1.0, y, z: 3.9 }));
  g.add(place(dinghy({ L: 2.2, B: 0.9, color: PALETTE.yellow }), { x: 6.8, y: y + 0.25, z: 4.3 }));
  g.add(place(box(1.4, 0.2, 0.6, mat(PALETTE.darkGrey)), { x: 6.8, y: y + 0.05, z: 4.3 }));

  // planters with small trees
  for (const tx of [-7.6, 4.0]) {
    g.add(place(box(1.0, 0.45, 1.0, mat(PALETTE.concrete)), { x: tx, y, z: 4.2 }));
    g.add(place(tree({ kind: 'round', h: 3.2, seed: tx > 0 ? 8 : 9 }), { x: tx, y: y + 0.45, z: 4.2 }));
  }
}

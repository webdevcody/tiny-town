import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, cylinder, place, group, mat, metal, surface, beam,
  gableRoof, shedRoof, door, windowPanel, smokestack, streetLamp,
} from '../../src/lib/index.js';
import { bigSign, giantCan, canPallet, crateStack, bollard, gull, trawler, conveyor } from './props.js';

// 2x1 tiles (20 x 10 m). Front (+z) is the water side where the trawlers moor.
// The whole lot is harbour water; the cannery stands on a timber pier at the back.
const DECK = 1.3; // top of the pier deck
const deckX = [-10, 10], deckZ = [-5, 0.6];

const hall = { x: -4.6, z: -2.7, w: 10, d: 4.2, h: 5.4 }; // main cannery hall
const annex = { x: 3.4, z: -3.4, w: 4.8, d: 2.8, h: 3.2 }; // can store / office

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'water'));

  addPier(g);
  addHall(g);
  addAnnex(g);
  addCanTower(g);
  addYard(g);
  addBoats(g);
  addGulls(g);
  return g;
}

function addPier(g) {
  const planks = surface('planks', PALETTE.woodLight, { size: 2.5 });
  const fascia = mat(PALETTE.wood);
  const pileM = mat(PALETTE.woodDark);
  const dw = deckX[1] - deckX[0], dd = deckZ[1] - deckZ[0];
  g.add(place(box(dw, 0.3, dd, [fascia, fascia, planks, fascia, fascia, fascia]), { y: DECK - 0.3, z: (deckZ[0] + deckZ[1]) / 2 }));
  // finger jetty between the two trawlers
  const jx = 1.4, jz = (deckZ[1] + 4.9) / 2, jd = 4.9 - deckZ[1];
  g.add(place(box(1.6, 0.25, jd, [fascia, fascia, planks, fascia, fascia, fascia]), { x: jx, y: DECK - 0.25, z: jz }));

  // piles: under the deck edges, a few rising above the deck as mooring posts
  const pile = (x, z, top) => g.add(place(cylinder(0.17, 0.19, top - LOT_HEIGHT, pileM, 7), { x, y: LOT_HEIGHT, z }));
  for (let x = -9.75; x <= 9.8; x += 2.5) {
    pile(x, deckZ[1] - 0.15, DECK - 0.3);
    pile(x, deckZ[0] + 0.2, DECK - 0.3);
  }
  for (const z of [-2.8, -0.9]) { pile(-9.8, z, DECK - 0.3); pile(9.8, z, DECK - 0.3); }
  for (const z of [1.9, 3.4, 4.75]) { pile(jx - 0.7, z, DECK + (z > 4 ? 0.7 : -0.25)); pile(jx + 0.7, z, DECK + (z > 4 ? 0.7 : -0.25)); }
  // railing along the jetty end
  g.add(place(box(1.4, 0.08, 0.08, mat(PALETTE.white)), { x: jx, y: DECK + 0.65, z: 4.75 }));
}

function addHall(g) {
  const { x, z, w, d, h } = hall;
  const y = DECK;
  const wallM = surface('planks', '#b4432e', { size: 3 });
  const trim = mat(PALETTE.white);
  const roofM = surface('corrugated', PALETTE.roofGrey, { size: 1.2, roughness: 0.6 });
  g.add(place(box(w, h, d, wallM), { x, y, z }));
  // white corner boards, belt course and base board
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.22, h, 0.22, trim), { x: x + sx * w / 2, y, z: z + sz * d / 2 }));
  g.add(place(box(w + 0.1, 0.14, d + 0.1, trim), { x, y: y + 2.65, z }));
  g.add(place(box(w + 0.08, 0.2, d + 0.08, mat(PALETTE.woodDark)), { x, y, z }));

  const front = z + d / 2, back = z - d / 2;
  const win = (opts) => windowPanel({ w: 0.8, h: 1.1, frame: PALETTE.white, glassColor: PALETTE.window, ...opts });
  // front, ground floor: two big sliding cargo doors and windows between
  for (const dx of [-3.5, 3.4]) {
    g.add(place(door({ w: 2.2, h: 2.3, color: PALETTE.woodDark, frame: PALETTE.white }), { x: x + dx, y, z: front }));
    // X-brace on the door
    const dz = front + 0.14;
    g.add(beam([x + dx - 1, y + 0.1, dz], [x + dx + 1, y + 2.2, dz], 0.08, trim));
    g.add(beam([x + dx + 1, y + 0.1, dz], [x + dx - 1, y + 2.2, dz], 0.08, trim));
    g.add(place(box(2.8, 0.1, 0.12, mat(PALETTE.steelDark)), { x: x + dx + 0.3, y: y + 2.45, z: front + 0.06 }));
  }
  for (const dx of [-0.9, 0.9]) g.add(place(win(), { x: x + dx, y: y + 0.9, z: front }));
  // big name board on the belt course
  g.add(place(bigSign({ text: 'GULL BAY CANNERY', w: 6.4, h: 1.0, bg: PALETTE.cream, fg: '#8a2a1c', border: '#8a2a1c' }), { x: x - 1.5, y: y + 2.75, z: front + 0.02 }));
  // upper floor windows + the conveyor hatch
  for (const dx of [-4.0, -2.4, -0.8, 0.8, 4.0]) g.add(place(win({ lit: dx === -0.8 }), { x: x + dx, y: y + 3.9, z: front }));
  g.add(place(box(1.2, 1.3, 0.1, mat(PALETTE.black)), { x: x + 2.4, y: y + 3.85, z: front + 0.02 }));
  g.add(place(box(1.6, 0.12, 0.7, trim), { x: x + 2.4, y: y + 5.15, z: front + 0.3 }));

  // back: two rows of windows
  for (const dx of [-3.6, -1.2, 1.2, 3.6]) for (const wy of [0.9, 3.9]) {
    g.add(place(win(), { x: x + dx, y: y + wy, z: back, ry: 180 }));
  }
  // gable ends: windows + loft door with a hoist beam
  for (const s of [-1, 1]) {
    const ex = x + s * w / 2;
    for (const dz of [-1, 1]) g.add(place(win(), { x: ex, y: y + 0.9, z: z + dz, ry: s * 90 }));
    g.add(place(door({ w: 1.1, h: 1.6, color: PALETTE.woodDark, frame: PALETTE.white }), { x: ex, y: y + 3.6, z, ry: s * 90 }));
    if (s > 0) g.add(place(box(1.2, 0.18, 0.18, mat(PALETTE.woodDark)), { x: ex + s * 0.5, y: y + h + 0.5, z }));
  }

  // roof: corrugated gable with a ventilator monitor along the ridge
  const rh = 1.9;
  g.add(place(gableRoof({ w, d, h: rh, overhang: 0.35, ridge: 'x', material: roofM, gableMaterial: wallM }), { x, y: y + h, z }));
  const my = y + h + rh - 0.35;
  g.add(place(box(6, 0.75, 1.3, wallM), { x, y: my, z }));
  for (const s of [-1, 1]) g.add(place(box(5.6, 0.4, 0.06, mat(PALETTE.glassDark, { roughness: 0.3 })), { x, y: my + 0.2, z: z + s * 0.66 }));
  g.add(place(gableRoof({ w: 6, d: 1.3, h: 0.5, overhang: 0.3, ridge: 'x', material: roofM, gableMaterial: wallM }), { x, y: my + 0.75, z }));
  // retort boiler stack on the back slope
  g.add(place(smokestack({ radius: 0.36, topRadius: 0.3, h: 4.6, color: PALETTE.steelDark, bandColor: PALETTE.red, bands: 1 }), { x: x - 3.4, y: y + h, z: z - 1.3 }));
}

function addAnnex(g) {
  const { x, z, w, d, h } = annex;
  const y = DECK;
  const wallM = surface('planks', PALETTE.offWhite, { size: 3 });
  const trim = mat('#b4432e');
  g.add(place(box(w, h, d, wallM), { x, y, z }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.2, h, 0.2, trim), { x: x + sx * w / 2, y, z: z + sz * d / 2 }));
  g.add(place(shedRoof({ w, d, h: 0.8, overhang: 0.3, material: surface('corrugated', PALETTE.roofRed, { size: 1.2 }), wallMaterial: wallM }), { x, y: y + h, z }));
  const front = z + d / 2;
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.navy, frame: '#b4432e' }), { x: x - 1.4, y, z: front }));
  g.add(place(windowPanel({ w: 1.6, h: 1.0, frame: '#b4432e', lit: true }), { x: x + 0.7, y: y + 1.1, z: front }));
  g.add(place(windowPanel({ w: 0.8, h: 1.0, frame: '#b4432e' }), { x: x + w / 2, y: y + 1.1, z, ry: 90 }));
  g.add(place(bigSign({ text: 'OFFICE', w: 1.5, h: 0.4, bg: PALETTE.navy, fg: '#ffffff' }), { x: x - 1.4, y: y + 2.45, z: front + 0.02 }));
}

// Water tank on a timber tower, painted as a giant sardine tin
function addCanTower(g) {
  const cx = 8.0, cz = -3.3, th = 3.0;
  const post = mat(PALETTE.woodDark);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.22, th, 0.22, post), { x: cx + sx * 0.8, y: DECK, z: cz + sz * 0.8 }));
  }
  for (const s of [-1, 1]) {
    g.add(beam([cx - 0.8, DECK + 0.3, cz + s * 0.8], [cx + 0.8, DECK + th - 0.3, cz + s * 0.8], 0.1, post));
    g.add(beam([cx + s * 0.8, DECK + 0.3, cz - 0.8], [cx + s * 0.8, DECK + th - 0.3, cz + 0.8], 0.1, post));
  }
  g.add(place(box(2.2, 0.18, 2.2, mat(PALETTE.wood)), { x: cx, y: DECK + th, z: cz }));
  g.add(place(giantCan({ r: 1.05, h: 2.1, color: PALETTE.red, key: 'tank' }), { x: cx, y: DECK + th + 0.18, z: cz, ry: -30 }));
  g.add(place(gull({ flying: false }), { x: cx - 0.2, y: DECK + th + 0.18 + 2.1 + 0.12, z: cz + 0.3, ry: -40 }));
}

function addYard(g) {
  const y = DECK;
  // can conveyor out of the hall's east wall onto the yard
  const hx = hall.x + hall.w / 2;
  g.add(conveyor([hx, y + 1.5, -1.3], [hx + 4.6, y + 1.0, -1.3], { width: 0.6, cargo: 'cans', legs: [[hx + 1.2, y, -1.3], [hx + 3.6, y, -1.3]] }));
  // pallets of finished tins
  const pal = [[6.1, -1.1, PALETTE.red, 'red'], [7.5, -1.1, PALETTE.blue, 'blue'], [8.9, -1.1, PALETTE.yellow, 'yellow'], [8.9, 0.0, PALETTE.red, 'red'], [6.1, -4.3, PALETTE.blue, 'blue']];
  for (const [px, pz, color, key] of pal) g.add(place(canPallet({ color, key }), { x: px, y, z: pz }));
  // little forklift by the pallets
  g.add(place(forklift(), { x: 7.2, y, z: 0.1, ry: 180 }));
  // fish crates near the trawler conveyor and on the jetty
  const crates = [[-6.6, 0.0, PALETTE.blue, 3], [-5.8, 0.05, PALETTE.orange, 2], [-0.6, -0.1, PALETTE.blue, 4], [1.4, 2.4, PALETTE.orange, 2], [1.4, 3.3, PALETTE.blue, 1]];
  for (const [cx, cz, color, n] of crates) g.add(place(crateStack({ color, n }), { x: cx, y, z: cz }));
  // bollards and lamps along the quay edge
  for (const bx of [-8.6, -1.8, 3.2, 9.3]) g.add(place(bollard(), { x: bx, y, z: 0.3 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -9.6, y, z: 0.2, ry: 0 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 2.0, y, z: 4.6, ry: 180 }));
  // a life ring on the hall front corner
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.08, 6, 12), mat(PALETTE.orange, { roughness: 0.5 }));
  ring.position.set(hall.x - hall.w / 2 + 0.6, y + 1.6, hall.z + hall.d / 2 + 0.1);
  g.add(ring);
}

function forklift() {
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const f = group(
    place(box(1.3, 0.7, 0.9, body), { y: 0.2 }),
    place(box(0.4, 0.5, 0.8, dark), { x: -0.55, y: 0.6 }),
    place(box(0.06, 1.2, 0.06, dark), { x: -0.4, y: 0.9, z: 0.4 }),
    place(box(0.06, 1.2, 0.06, dark), { x: -0.4, y: 0.9, z: -0.4 }),
    place(box(0.9, 0.06, 0.9, dark), { x: -0.05, y: 2.1 }),
    place(box(0.12, 1.8, 0.8, dark), { x: 0.7, y: 0.1 }),
    place(box(0.8, 0.05, 0.1, metal(PALETTE.steel)), { x: 1.1, y: 0.15, z: 0.25 }),
    place(box(0.8, 0.05, 0.1, metal(PALETTE.steel)), { x: 1.1, y: 0.15, z: -0.25 }),
  );
  for (const [wx, wz] of [[-0.4, 0.45], [-0.4, -0.45], [0.4, 0.45], [0.4, -0.45]]) {
    const wgeo = new THREE.CylinderGeometry(0.2, 0.2, 0.15, 8).rotateX(Math.PI / 2);
    const wh = new THREE.Mesh(wgeo, mat(PALETTE.black));
    wh.position.set(wx, 0.2, wz);
    f.add(wh);
  }
  return f;
}

function addBoats(g) {
  // big blue stern trawler alongside the quay, bow west, unloading by conveyor
  const A = { x: -4.4, z: 2.95, L: 9.2, B: 2.8 };
  g.add(place(trawler({ L: A.L, B: A.B, hull: PALETTE.navy, gantryColor: PALETTE.orange, netColor: PALETTE.green, boomSpread: 1.5, seed: 0 }), { x: A.x, y: LOT_HEIGHT, z: A.z, ry: 180 }));
  // hold is at local x = -0.12 L, i.e. east of the boat centre once turned round
  const holdX = A.x + A.L * 0.12;
  g.add(conveyor([holdX, 2.1, A.z - 0.1], [hall.x + 2.4, DECK + 4.4, hall.z + hall.d / 2 + 0.05], { width: 0.75, legs: [[holdX + 0.35, DECK, 0.3]] }));
  // smaller red trawler on the east berth
  const B = { x: 6.3, z: 2.95, L: 7.0, B: 2.4 };
  g.add(place(trawler({ L: B.L, B: B.B, hull: PALETTE.red, trim: PALETTE.white, gantryColor: PALETTE.yellow, netColor: PALETTE.navy, boomSpread: 1.3, seed: 1 }), { x: B.x, y: LOT_HEIGHT, z: B.z, ry: 180 }));
  // mooring lines
  const rope = mat(PALETTE.beige);
  // (both boats are turned round, so their bows point west)
  const line = (bx, b, along) => g.add(beam([bx, DECK + 0.4, 0.3], [b.x + along * b.L, 1.55, b.z - b.B * 0.3], 0.04, rope));
  line(-8.6, A, -0.36); line(-1.8, A, 0.42); line(3.2, B, -0.34); line(9.3, B, 0.42);
}

function addGulls(g) {
  const flying = [
    [-2.2, 9.4, 1.6, 30], [-6.8, 10.2, -0.4, -60], [2.6, 8.4, 3.8, 120], [5.6, 9.6, 1.0, 200], [-0.4, 7.4, 4.2, 70],
  ];
  for (const [x, y, z, ry] of flying) g.add(place(gull({ flying: true, flap: 15 + (ry % 20) }), { x, y, z, ry }));
  // perched: on the hall ridge, a mooring post and the jetty rail
  const ridgeY = DECK + hall.h + 1.9 + 0.4 + 0.5 + 0.05;
  g.add(place(gull({ flying: false }), { x: hall.x - 2.0, y: ridgeY, z: hall.z, ry: 15 }));
  g.add(place(gull({ flying: false }), { x: hall.x + 2.4, y: ridgeY, z: hall.z, ry: 200 }));
  g.add(place(gull({ flying: false }), { x: 0.75, y: DECK + 0.82, z: 4.75, ry: 0 }));
  g.add(place(gull({ flying: false }), { x: 2.05, y: DECK + 0.82, z: 4.75, ry: 180 }));
}

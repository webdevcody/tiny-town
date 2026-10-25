import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, place, group, mat, surface, tree, car, hedge, bench, cylinder, cone,
} from '../../src/lib/index.js';
import { CL, CH, CW, containerHome, railing, railingBox, steelStair, spiralStair, planter } from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Five 20 ft containers: two on the ground (A, B), two on level 1 (C, D),
// one on level 2 (E) with a roof garden. Stairs climb the east side.
export default function build() {
  const y0 = LOT_HEIGHT;
  const G = y0 + 0.3;          // containers sit on concrete piers
  const L1 = G + CH;
  const L2 = L1 + CH;
  const R = L2 + CH;
  const deckM = surface('planks', PALETTE.wood, { size: 1.2 });
  const steelM = mat(PALETTE.darkGrey);

  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // --- containers -----------------------------------------------------------
  // A: orange, ground, along X at the back
  const A = { x: -1.6, z: -3.5 };
  g.add(place(containerHome({
    color: PALETTE.orange,
    front: [{ x: -0.3, w: 2.2, kind: 'wall' }, { x: 1.6, w: 0.9, kind: 'door' }],
    back: [{ x: -1.6, w: 1.2, kind: 'window' }, { x: 1.2, w: 1.2, kind: 'window' }],
    left: 'cargo', right: 'glazed',
    stencil: { text: 'TTWN 204511', x: 0, y: 2.0, side: -1 },
  }), { x: A.x, y: G, z: A.z }));

  // B: blue, ground, along Z on the west side, glazed end to the street
  const B = { x: -3.5, z: 1.3 };
  g.add(place(containerHome({
    color: PALETTE.blue,
    front: [{ x: 0.2, w: 1.6, kind: 'window' }],
    back: [{ x: -1.4, w: 0.9, kind: 'door' }, { x: 1.0, w: 2.0, kind: 'wall' }],
    left: 'plain', right: 'glazed',
  }), { x: B.x, y: G, z: B.z, ry: -90 }));

  // C: yellow, level 1, on top of A and cantilevered 3 m east over the carport
  const C = { x: 1.6, z: -3.5 };
  g.add(place(containerHome({
    color: PALETTE.yellow,
    front: [{ x: -1.2, w: 2.4, kind: 'wall' }, { x: 2.2, w: 0.9, kind: 'door' }],
    back: [{ x: -1.0, w: 1.4, kind: 'window' }, { x: 1.6, w: 1.0, kind: 'window' }],
    left: 'cargo', right: 'glazed',
  }), { x: C.x, y: L1, z: C.z }));

  // D: green, level 1, along Z bridging A and B
  const D = { x: -3.5, z: -1.4 };
  g.add(place(containerHome({
    color: PALETTE.green,
    front: [{ x: -1.6, w: 1.2, kind: 'window' }, { x: 1.0, w: 1.2, kind: 'window' }],
    back: [{ x: 1.4, w: 1.6, kind: 'window' }],
    left: 'cargo', right: 'glazed',
  }), { x: D.x, y: L1, z: D.z, ry: -90 }));

  // E: red, level 2, across C and D, cantilevered 1.3 m over the courtyard
  const E = { x: -0.6, z: -2.2 };
  g.add(place(containerHome({
    color: PALETTE.red,
    front: [{ x: -2.3, w: 0.9, kind: 'door' }, { x: 0.6, w: 3.0, kind: 'wall' }],
    back: [{ x: -1.2, w: 1.2, kind: 'window' }, { x: 1.4, w: 1.2, kind: 'window' }],
    left: 'cargo', right: 'glazed',
    stencil: { text: 'TINY LINES', x: 1.2, y: 2.0, side: -1 },
  }), { x: E.x, y: L2, z: E.z }));

  // concrete piers under the ground containers
  const pierM = mat(PALETTE.concrete);
  for (const px of [-2.9, 0, 2.9]) for (const pz of [-1, 1]) {
    g.add(place(box(0.45, 0.3, 0.45, pierM), { x: A.x + px, y: y0, z: A.z + pz * (CW / 2 - 0.2) }));
    g.add(place(box(0.45, 0.3, 0.45, pierM), { x: B.x + pz * (CW / 2 - 0.2), y: y0, z: B.z + px }));
  }

  // --- stairs and landings (east side) -------------------------------------
  // S1: ground -> level-1 landing in front of C's door
  const land = { x0: 3.3, x1: 4.75, z0: -2.25, z1: -1.05 };
  const lw = land.x1 - land.x0, ld = land.z1 - land.z0, lx = (land.x0 + land.x1) / 2, lz = (land.z0 + land.z1) / 2;
  g.add(place(steelStair({ run: land.x0 - 0.5, h: L1 - y0, w: 1.1 }), { x: 0.5, y: y0, z: lz }));
  for (const yy of [L1, L2]) {
    g.add(place(box(lw, 0.12, ld, mat(PALETTE.steelLight)), { x: lx, y: yy - 0.12, z: lz }));
    g.add(place(railingBox(lw, ld, yy === L1 ? ['right'] : ['right', 'left']), { x: lx, y: yy, z: lz }));
  }
  for (const [px, pz] of [[land.x0 + 0.1, land.z1 - 0.1], [land.x1 - 0.1, land.z1 - 0.1]]) g.add(place(box(0.12, L2 - y0, 0.12, steelM), { x: px, y: y0, z: pz }));

  // S2: spiral stair from the level-1 landing up to C's roof deck
  const sp = { x: 4.0, z: -0.25 };
  g.add(place(box(0.14, L1 - y0, 0.14, steelM), { x: sp.x, y: y0, z: sp.z }));
  g.add(place(spiralStair({ h: L2 - L1, r: 0.8, turns: 1, a0: 90 }), { x: sp.x, y: L1, z: sp.z }));

  // C roof deck (level 2) and ship stair up to the roof garden on E
  const cdx0 = E.x + CL / 2, cdx1 = C.x + CL / 2;
  const cdw = cdx1 - cdx0, cdx = (cdx0 + cdx1) / 2;
  g.add(place(box(cdw - 0.1, 0.08, CW - 0.1, deckM), { x: cdx, y: L2, z: C.z }));
  g.add(place(railingBox(cdw - 0.1, CW - 0.1, ['back', 'right']), { x: cdx, y: L2 + 0.08, z: C.z }));
  g.add(place(railing(cdw - 1.3), { x: cdx - 0.6, y: L2 + 0.08, z: C.z + CW / 2 - 0.05 }));
  g.add(place(steelStair({ run: 1.9, h: R - L2, w: 0.8 }), { x: cdx1 - 0.25, y: L2 + 0.08, z: -3.0, ry: 180 }));

  // --- decks ------------------------------------------------------------------
  // level-1 deck on B's front, outside D's glazed end
  const bdz0 = D.z + CL / 2, bdz1 = B.z + CL / 2;
  const bdd = bdz1 - bdz0, bdz = (bdz0 + bdz1) / 2;
  g.add(place(box(CW - 0.1, 0.08, bdd - 0.1, deckM), { x: B.x, y: L1, z: bdz }));
  g.add(place(railingBox(CW - 0.1, bdd - 0.1, ['front', 'left', 'right'], { glassy: true }), { x: B.x, y: L1 + 0.08, z: bdz }));
  for (const dx of [-0.55, 0.55]) g.add(place(lounger(), { x: B.x + dx, y: L1 + 0.08, z: bdz + 0.1 }));
  g.add(place(planter(0.5, 0.5, { h: 0.5 }), { x: B.x - 0.85, y: L1 + 0.08, z: bdz0 + 0.4 }));

  // level-2 deck on D's front, outside E's door: table + parasol + planters
  const ddz0 = E.z + CW / 2, ddz1 = D.z + CL / 2;
  const ddd = ddz1 - ddz0, ddz = (ddz0 + ddz1) / 2;
  g.add(place(box(CW - 0.1, 0.08, ddd - 0.1, deckM), { x: D.x, y: L2, z: ddz }));
  g.add(place(railingBox(CW - 0.1, ddd - 0.1, ['front', 'left', 'right']), { x: D.x, y: L2 + 0.08, z: ddz }));
  g.add(place(parasolTable(PALETTE.white), { x: D.x + 0.1, y: L2 + 0.08, z: ddz + 0.3 }));
  g.add(place(planter(1.8, 0.4), { x: D.x, y: L2 + 0.08, z: ddz1 - 0.35 }));

  // --- roof garden on E -----------------------------------------------------------
  const rw = CL - 0.2, rd = CW - 0.2;
  g.add(place(box(rw, 0.1, rd, surface('grass', PALETTE.grass, { size: 2 })), { x: E.x, y: R, z: E.z }));
  g.add(place(railingBox(rw, rd, ['front', 'back', 'left'], { glassy: true }), { x: E.x, y: R + 0.1, z: E.z }));
  g.add(place(railing(rd - 1.0, { glassy: true }), { x: E.x + rw / 2, y: R + 0.1, z: E.z + 0.5, ry: 90 }));
  g.add(place(planter(3.2, 0.5, { h: 0.5, leaf: PALETTE.foliageLight }), { x: E.x - 1.1, y: R + 0.1, z: E.z - rd / 2 + 0.35 }));
  for (const [i, px] of [-2.4, -0.9, 0.5].entries()) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 30 + i }), { x: E.x + px, y: R + 0.6, z: E.z - rd / 2 + 0.35 }));
  }
  g.add(place(tree({ kind: 'round', h: 2.4, seed: 7 }), { x: E.x - 2.3, y: R + 0.1, z: E.z + 0.3 }));
  g.add(place(planter(0.7, 0.7, { h: 0.4 }), { x: E.x - 2.3, y: R + 0.1, z: E.z + 0.3 }));
  g.add(place(pergola(2.2, 1.8), { x: E.x + 0.6, y: R + 0.1, z: E.z + 0.15 }));
  g.add(place(bench({ w: 1.4 }), { x: E.x + 0.6, y: R + 0.1, z: E.z + 0.5, ry: 180 }));
  // raised veg beds
  for (const [i, px] of [-0.8, 0.4].entries()) {
    g.add(place(box(0.9, 0.3, 0.5, surface('planks', PALETTE.woodDark, { size: 1 })), { x: E.x + px, y: R + 0.1, z: E.z - 0.35 }));
    g.add(place(box(0.8, 0.08, 0.4, mat(i ? PALETTE.red : PALETTE.foliageDark)), { x: E.x + px, y: R + 0.4, z: E.z - 0.35 }));
  }

  // --- ground: courtyard, carport, garden -----------------------------------------
  // timber deck with picnic table, grill, parasol
  g.add(place(box(2.3, 0.12, 3.4, deckM), { x: -1.1, y: y0, z: 0.8 }));
  g.add(place(parasolTable(PALETTE.red), { x: -1.0, y: y0 + 0.12, z: 1.0 }));
  g.add(place(grill(), { x: -1.9, y: y0 + 0.12, z: -0.4 }));
  // path from the street to the stair foot
  g.add(place(patch(1.1, 6.6, 'paved'), { x: 0.9, y: y0, z: 1.7 }));
  // carport under C's cantilever
  g.add(place(patch(3.3, CW, 'concrete'), { x: 3.3, y: y0, z: C.z }));
  g.add(place(car({ color: PALETTE.lightGrey }), { x: 3.2, y: y0 + 0.05, z: C.z, s: 0.68 }));
  // garden
  g.add(place(tree({ kind: 'round', h: 4.4, seed: 12 }), { x: 3.7, y: y0, z: 3.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: 2.2, y: y0, z: 4.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 14 }), { x: 4.4, y: y0, z: 1.2 }));
  g.add(place(hedge({ w: 3.0, h: 0.7, d: 0.45 }), { x: 3.3, y: y0, z: TILE / 2 - 0.3 }));
  g.add(place(hedge({ w: 2.3, h: 0.7, d: 0.45 }), { x: -1.1, y: y0, z: TILE / 2 - 0.3 }));
  g.add(place(mailbox(), { x: 1.75, y: y0, z: 4.5 }));
  g.add(place(planter(1.8, 0.4, { leaf: PALETTE.foliageLight }), { x: B.x, y: y0, z: 4.7 }));
  for (const [i, pz] of [-0.9, 0.4].entries()) g.add(place(bike(i ? PALETTE.blue : PALETTE.red), { x: 1.7, y: y0, z: pz }));
  return g;
}

function lounger() {
  const m = mat(PALETTE.white);
  return group(
    place(box(0.6, 0.25, 1.4, m), { z: 0.1 }),
    place(box(0.6, 0.06, 0.5, m), { y: 0.25, z: -0.55, rx: -40 }),
  );
}

function parasolTable(color) {
  const wood = mat(PALETTE.wood);
  return group(
    place(box(1.0, 0.06, 0.7, wood), { y: 0.72 }),
    place(box(0.08, 0.72, 0.08, wood), { x: -0.4 }),
    place(box(0.08, 0.72, 0.08, wood), { x: 0.4 }),
    place(box(1.0, 0.05, 0.25, wood), { y: 0.42, z: 0.55 }),
    place(box(1.0, 0.05, 0.25, wood), { y: 0.42, z: -0.55 }),
    cylinder(0.03, 0.03, 2.2, mat(PALETTE.lightGrey), 6),
    place(cone(1.0, 0.4, mat(color), 8), { y: 2.0 }),
  );
}

function grill() {
  const m = mat(PALETTE.black);
  return group(
    place(box(0.6, 0.35, 0.4, m), { y: 0.55 }),
    place(box(0.05, 0.55, 0.05, m), { x: -0.25 }),
    place(box(0.05, 0.55, 0.05, m), { x: 0.25 }),
  );
}

function mailbox() {
  return group(
    box(0.08, 1.0, 0.08, mat(PALETTE.darkGrey)),
    place(box(0.3, 0.25, 0.45, mat(PALETTE.orange)), { y: 1.0 }),
  );
}

function pergola(w, d) {
  const m = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.1, 2.1, 0.1, m), { x: sx * w / 2, z: sz * d / 2 }));
  for (let i = 0; i <= 5; i++) g.add(place(box(0.06, 0.1, d + 0.3, m), { x: -w / 2 + (w * i) / 5, y: 2.1 }));
  g.add(place(box(w, 0.06, d * 0.6, mat(PALETTE.foliageLight)), { y: 2.2, z: -d * 0.15 }));
  return g;
}

function bike(color) {
  const m = mat(color);
  const t = mat(PALETTE.black);
  return group(
    place(cylinder(0.3, 0.3, 0.05, t, 10), { x: -0.45, y: 0.3, rx: 90 }),
    place(cylinder(0.3, 0.3, 0.05, t, 10), { x: 0.45, y: 0.3, rx: 90 }),
    place(box(0.9, 0.06, 0.05, m), { y: 0.55 }),
    place(box(0.06, 0.4, 0.05, m), { x: 0.3, y: 0.3 }),
    place(box(0.06, 0.06, 0.45, mat(PALETTE.darkGrey)), { x: 0.4, y: 0.75 }),
  );
}

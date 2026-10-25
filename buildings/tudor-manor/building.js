import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, gableRoof, surface, mat, door, hedge, tree, car, cylinder, cone,
} from '../../src/lib/index.js';
import { timberBlock, timberMat, bargeboards, OAK } from './timber.js';
import { topiary, knotGarden, clusteredChimney, gatePier, lowWall } from './garden.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// E-plan manor: a hall range across the back, two gabled cross-wings coming
// forward and a two-storey entrance porch in the middle. Ground floor of close
// studding on a stone plinth, jettied upper floor with lozenge panels.
const G = 3; // ground storey
const U = 3; // jettied upper storey
const J = 0.35; // jetty overhang

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const add = (o, at) => g.add(place(o, at));
  g.add(lot([2, 2], 'grass'));

  const roofM = surface('roofTiles', '#7f4636', { size: 1.6 });
  const stone = mat(PALETTE.stone);
  const sandstone = mat(PALETTE.sandstone);
  const oak = mat(OAK);

  // one jettied two-storey range; (x, z, w, d) = upper-floor footprint
  const range = (x, z, w, d, { jetty = [1, 1, 1, 1] } = {}) => {
    const [jf, jb, jl, jr] = jetty.map((v) => v * J);
    const gw = w - jl - jr, gd = d - jf - jb;
    const gx = x + (jl - jr) / 2, gz = z + (jb - jf) / 2;
    add(box(gw + 0.16, 0.45, gd + 0.16, stone), { x: gx, y: y0, z: gz });
    add(timberBlock(gw, gd, 'ground'), { x: gx, y: y0, z: gz });
    add(box(w + 0.08, 0.28, d + 0.08, oak), { x, y: y0 + G - 0.1, z }); // bressumer
    add(timberBlock(w, d, 'upper'), { x, y: y0 + G, z });
  };

  // --- hall range (back) -------------------------------------------------
  const M = { x: 0, z: -5.3, w: 13, d: 5.6 };
  range(M.x, M.z, M.w, M.d);
  add(gableRoof({ w: M.w, d: M.d, h: 3.4, overhang: 0.35, ridge: 'x', material: roofM, gableMaterial: timberMat('gable', M.d) }), { x: M.x, y: y0 + G + U, z: M.z });

  // --- gabled cross-wings -------------------------------------------------
  const W = { x: 6.2, z: -3.6, w: 5.2, d: 9.0, h: 4.2 };
  for (const s of [-1, 1]) {
    const x = s * W.x;
    range(x, W.z, W.w, W.d);
    add(gableRoof({ w: W.w, d: W.d, h: W.h, overhang: 0.4, ridge: 'z', material: roofM, gableMaterial: timberMat('gable', W.w) }), { x, y: y0 + G + U, z: W.z });
    add(bargeboards({ halfW: W.w / 2, h: W.h, overhang: 0.4 }), { x, y: y0 + G + U, z: W.z + W.d / 2 + 0.4 });
    add(bargeboards({ halfW: W.w / 2, h: W.h, overhang: 0.4 }), { x, y: y0 + G + U, z: W.z - W.d / 2 - 0.4, ry: 180 });
    // full-height leaded bay window under the jetty
    const zf = W.z + W.d / 2 - J;
    add(box(3.1, 0.45, 0.85, stone), { x, y: y0, z: zf + 0.38 });
    add(timberBlock(2.8, 0.7, 'bay', { bay: 2.8 }), { x, y: y0, z: zf + 0.35 });
    // external chimney breast on the outer side wall
    const cx = s * (W.x + W.w / 2 + 0.45);
    add(box(1.1, 0.6, 2.3, stone), { x: cx - s * 0.05, y: y0, z: W.z - 0.6 });
    add(box(1.05, 5.2, 2.1, surface('brick', PALETTE.brick, { size: 1 })), { x: cx - s * 0.05, y: y0, z: W.z - 0.6 });
    add(box(1.15, 0.16, 2.2, stone), { x: cx - s * 0.05, y: y0 + 5.2, z: W.z - 0.6 }); // weathering
    add(clusteredChimney({ n: 3, stackH: 9.6, depth: 0.9 }), { x: cx, y: y0, z: W.z - 0.6, ry: 90 });
  }

  // --- entrance porch ------------------------------------------------------
  const P = { z: -1.5, w: 3.2, d: 2.4 };
  add(box(P.w, G, P.d, sandstone), { y: y0, z: P.z });
  add(box(P.w + 0.2, 0.3, P.d + 0.2, stone), { y: y0 + G - 0.3, z: P.z });
  add(box(1.9, 2.55, 0.12, stone), { y: y0, z: P.z + P.d / 2 }); // door surround
  add(door({ w: 1.4, h: 2.3, color: OAK, frame: PALETTE.stoneDark }), { y: y0 + 0.05, z: P.z + P.d / 2 + 0.12 });
  add(box(2.4, 0.15, 0.9, stone), { y: y0, z: P.z + P.d / 2 + 0.45 }); // step
  add(timberBlock(P.w + 0.3, P.d + 0.3, 'bay', { bay: 3.5 }), { y: y0 + G, z: P.z + 0.15 });
  // porch roof runs back into the hall roof
  const PR = { d: 5.4, h: 2.4 };
  const prz = P.z + 0.3 + P.d / 2 - PR.d / 2;
  add(gableRoof({ w: P.w + 0.3, d: PR.d, h: PR.h, overhang: 0.3, ridge: 'z', material: roofM, gableMaterial: timberMat('gable', P.w + 0.3) }), { y: y0 + G + U, z: prz });
  add(bargeboards({ halfW: (P.w + 0.3) / 2, h: PR.h, overhang: 0.3 }), { y: y0 + G + U, z: prz + PR.d / 2 + 0.3 });

  // --- tall clustered chimneys on the hall range --------------------------
  add(clusteredChimney({ n: 4, stackH: 4.6, depth: 1.1 }), { x: -1.8, y: y0 + G + U - 0.6, z: M.z });
  add(clusteredChimney({ n: 2, stackH: 9.4, depth: 0.9 }), { x: 2.2, y: y0, z: M.z - M.d / 2 - 0.45 });

  // --- gravel forecourt, drive and topiary turning circle -------------------
  add(patch(2 * W.x - W.w + 0.4, 4.2, 'gravel'), { y: y0, z: -0.8 });
  add(patch(8.6, 8.7, 'gravel'), { y: y0, z: 5.65 });
  const lawnM = surface('grass', PALETTE.grass, { size: 4 });
  add(cylinder(2.3, 2.3, 0.12, lawnM, 28), { y: y0, z: 5.6 });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(2.1, 0.16, 5, 32), mat('#3f7a2e', { roughness: 0.9 }));
  ring.rotation.x = -Math.PI / 2;
  ring.position.set(0, y0 + 0.22, 5.6);
  g.add(ring);
  add(topiary('tiered', 3.4), { y: y0 + 0.1, z: 5.6 });
  for (const [x, z] of [[1.25, 1.25], [-1.25, 1.25], [1.25, -1.25], [-1.25, -1.25]]) {
    add(topiary('cone', 1.2), { x, y: y0 + 0.1, z: 5.6 + z });
  }
  add(car({ color: '#1f4d33' }), { x: 2.6, y: y0 + 0.04, z: 2.3, ry: 70, s: 0.78 });

  // --- knot gardens (west) ---------------------------------------------------
  for (const [z, f] of [[3.3, '#b04a7a'], [7.45, '#c9433a']]) {
    add(knotGarden(4.0, { flower: f, flower2: '#e2b23a' }), { x: -7.05, y: y0, z });
  }
  add(hedge({ w: 8.4, h: 1.1, d: 0.5, color: '#2c5a27' }), { x: -9.7, y: y0, z: 5.4, ry: 90 });

  // --- topiary lawn (east) ---------------------------------------------------
  const kinds = [['cone', 2.6], ['ball', 2.0], ['spiral', 2.4]];
  for (const [i, z] of [3.0, 5.5, 8.0].entries()) {
    for (const [j, x] of [5.6, 8.2].entries()) {
      const [k, h] = kinds[(i + j) % 3];
      add(topiary(k, h), { x, y: y0, z });
    }
  }
  // sundial
  add(cylinder(0.25, 0.32, 0.9, stone, 8), { x: 6.9, y: y0, z: 5.5 });
  add(box(0.6, 0.06, 0.6, stone), { x: 6.9, y: y0 + 0.9, z: 5.5 });
  add(cone(0.12, 0.25, mat(PALETTE.steelDark), 3), { x: 6.9, y: y0 + 0.96, z: 5.5 });
  add(hedge({ w: 8.4, h: 1.1, d: 0.5, color: '#2c5a27' }), { x: 9.7, y: y0, z: 5.4, ry: 90 });

  // --- front wall and gate piers ---------------------------------------------
  for (const s of [-1, 1]) {
    add(lowWall(7.0), { x: s * 6.3, y: y0, z: 9.78 });
    add(gatePier(), { x: s * 2.6, y: y0, z: 9.7 });
    add(gatePier(1.2), { x: s * 9.7, y: y0, z: 9.7 });
  }

  // --- back garden -------------------------------------------------------------
  add(hedge({ w: 19.4, h: 1.2, d: 0.6, color: '#2c5a27' }), { y: y0, z: -9.65 });
  add(tree({ kind: 'poplar', h: 6.5, seed: 4 }), { x: -2.4, y: y0, z: -9.0 });
  add(tree({ kind: 'poplar', h: 5.5, seed: 9 }), { x: 4.6, y: y0, z: -9.0 });
  for (const [x, sd] of [[-5.6, 5], [0.4, 6], [7.4, 7]]) add(tree({ kind: 'bush', h: 1.3, seed: sd }), { x, y: y0, z: -8.9 });
  return g;
}

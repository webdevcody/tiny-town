import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, gableRoof, door, windowPanel,
  cropField, fence, tree, hedge, beam, surface, mat, textured, signTexture, cylinderGeometry, shade,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (lane) faces +z.
// West half: two round brick hop kilns with white cowls, joined to a
// weatherboarded stowage barn. East half: a hop garden on tall poles and wires.

const brick = surface('brick', PALETTE.brick, { size: 1.2 });
const brickDark = surface('brick', PALETTE.brickDark, { size: 1.2 });
const kilnRoof = surface('roofTiles', '#9a4a2c', { size: 1.6 });
const barnRoof = surface('roofTiles', PALETTE.terracotta, { size: 2 });
const boards = surface('planks', PALETTE.white, { size: 1.6 });
const white = mat(PALETTE.white);
const dark = mat('#2a2420');
const pole = mat('#7a5a38');
const wire = mat('#3b3b3b');
const bineMats = [mat(PALETTE.foliage), mat(PALETTE.foliageDark), mat('#4f8d32')];
const hopMat = mat('#b9d46a');

// tapered round strut between two points (hop bines)
function strut(a, b, r0, r1, material, seg = 6) {
  const A = new THREE.Vector3(...a);
  const B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(cylinderGeometry(r1, r0, len, seg), material);
  m.position.copy(A);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.sub(A).normalize());
  return m;
}

// sign with 0..1 UVs so the text fills the board
function board(text, w, h, bg, fg) {
  const geo = new THREE.BoxGeometry(w, h, 0.08).translate(0, h / 2, 0);
  const face = textured(signTexture(text, { bg, fg, width: 256, height: Math.round((256 * h) / w) }));
  const side = mat(PALETTE.woodDark);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

// round kiln ("roundel") with conical tiled roof and white cowl; cowl opening faces +z
function kiln({ r = 2.15, wallH = 5.2, roofH = 4.9, cowlRot = 0 } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(r + 0.12, r + 0.18, 0.5, brickDark, 24)); // plinth
  g.add(cylinder(r, r + 0.05, wallH, brick, 24));
  g.add(place(cylinder(r + 0.1, r + 0.1, 0.3, brickDark, 24), { y: wallH - 0.3 })); // eaves band
  // stoke-hole door and a small vent
  g.add(place(box(0.9, 1.6, 0.25, dark), { y: 0.2, z: r - 0.05 }));
  g.add(place(box(1.1, 0.18, 0.3, brickDark), { y: 1.8, z: r - 0.02 }));
  g.add(place(box(0.5, 0.6, 0.2, dark), { y: 3.2, z: r - 0.02 }));
  // conical roof
  g.add(place(cylinder(0.55, r + 0.22, roofH, kilnRoof, 24), { y: wallH }));
  g.add(place(cylinder(0.6, 0.6, 0.2, white, 12), { y: wallH + roofH - 0.05 }));

  // cowl: white weatherboarded drum, hooded top, open on one side, vane at the back
  const c = new THREE.Group();
  c.add(cylinder(0.62, 0.68, 1.2, white, 14));
  c.add(place(cone(0.82, 0.75, white, 14), { y: 1.15 }));
  c.add(place(box(0.75, 0.9, 0.2, dark), { y: 0.2, z: 0.6 })); // opening
  c.add(place(box(0.95, 0.12, 0.35, white), { y: 1.1, z: 0.72 })); // hood lip
  c.add(place(box(0.08, 0.08, 1.3, white), { y: 1.05, z: -1.15 })); // vane arm
  c.add(place(box(0.06, 0.9, 0.8, white), { y: 0.6, z: -1.75 })); // fan board
  c.add(place(sphere(0.12, dark, 8), { y: 1.82 }));
  c.add(place(box(0.04, 0.6, 0.04, dark), { y: 1.9 })); // finial spike
  g.add(place(c, { y: wallH + roofH + 0.1, ry: cowlRot }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // ---- stowage barn: brick ground floor, white weatherboard upper floor ----
  const bx = -5.2, bz = -2.45, bw = 8.6, bd = 4.0;
  const gH = 2.6, uH = 2.3;
  g.add(place(box(bw, gH, bd, brick), { x: bx, y: y0, z: bz }));
  g.add(place(box(bw + 0.1, 0.15, bd + 0.1, mat(PALETTE.brickDark)), { x: bx, y: y0 + gH - 0.05, z: bz }));
  g.add(place(box(bw + 0.08, uH, bd + 0.08, boards), { x: bx, y: y0 + gH + 0.1, z: bz }));
  g.add(place(gableRoof({ w: bw + 0.08, d: bd + 0.08, h: 2.4, overhang: 0.35, ridge: 'x', material: barnRoof, gableMaterial: boards }), { x: bx, y: y0 + gH + 0.1 + uH, z: bz }));
  // back windows and doors
  for (const x of [-8.2, -6.2, -4.2, -2.2]) {
    g.add(place(windowPanel({ w: 0.8, h: 0.9 }), { x, y: y0 + gH + 0.75, z: bz - bd / 2 - 0.04, ry: 180 }));
  }
  g.add(place(door({ w: 1.6, h: 2.2, color: PALETTE.woodDark }), { x: -5.2, y: y0, z: bz - bd / 2, ry: 180 }));
  // front: loading door between the kilns
  g.add(place(door({ w: 1.2, h: 1.8, color: PALETTE.woodDark }), { x: -5.25, y: y0 + gH + 0.3, z: bz + bd / 2 + 0.04 }));
  // east gable: cart door + lucam (hoist hood) over the upper loading door
  const ex = bx + bw / 2 + 0.04;
  g.add(place(door({ w: 2.0, h: 2.3, color: '#5b3a20' }), { x: ex, y: y0, z: bz + 0.2, ry: 90 }));
  g.add(place(door({ w: 1.1, h: 1.6, color: PALETTE.woodDark }), { x: ex, y: y0 + gH + 0.35, z: bz + 0.2, ry: 90 }));
  g.add(place(box(0.9, 1.5, 1.5, boards), { x: ex + 0.45, y: y0 + gH + 2.0, z: bz + 0.2 }));
  g.add(place(gableRoof({ w: 0.9, d: 1.5, h: 0.6, overhang: 0.12, ridge: 'x', material: barnRoof, gableMaterial: boards }), { x: ex + 0.45, y: y0 + gH + 3.5, z: bz + 0.2 }));
  g.add(place(box(0.1, 0.1, 0.1, dark), { x: ex + 0.85, y: y0 + gH + 1.9, z: bz + 0.2 }));
  g.add(beam([ex + 0.85, y0 + gH + 1.9, bz + 0.2], [ex + 0.85, y0 + gH + 0.6, bz + 0.2], 0.03, wire));
  // west gable window
  g.add(place(windowPanel({ w: 0.8, h: 0.9 }), { x: bx - bw / 2 - 0.04, y: y0 + gH + 0.75, z: bz, ry: -90 }));

  // ---- two round kilns in front of the barn ----
  const kz = 1.85;
  g.add(place(kiln({ cowlRot: 25 }), { x: -7.6, y: y0, z: kz }));
  g.add(place(kiln({ cowlRot: 25 }), { x: -2.85, y: y0, z: kz }));

  // ---- farm track between oast and hop garden ----
  g.add(place(patch(1.8, 10, 'dirt'), { x: -0.1, y: y0 }));
  g.add(place(patch(4.0, 1.4, 'dirt'), { x: -2.6, y: y0, z: -2.3 + 0.2 }));

  // hop wagon with hop pockets (long sacks) on the track
  const cart = new THREE.Group();
  cart.add(place(box(1.4, 0.12, 2.6, mat(PALETTE.wood)), { y: 0.7 }));
  for (const sx of [-0.68, 0.68]) cart.add(place(box(0.06, 0.4, 2.6, mat(PALETTE.wood)), { x: sx, y: 0.82 }));
  for (const [sx, sz] of [[-0.75, 0.75], [0.75, 0.75], [-0.75, -0.75], [0.75, -0.75]]) {
    const wh = new THREE.Mesh(cylinderGeometry(0.42, 0.42, 0.1, 12).translate(0, -0.05, 0).rotateZ(Math.PI / 2), mat(PALETTE.woodDark));
    wh.position.set(sx, 0.42, sz);
    cart.add(wh);
  }
  cart.add(beam([0, 0.6, 1.3], [0, 0.45, 2.3], 0.08, mat(PALETTE.woodDark)));
  const sack = mat('#e4d6b0');
  for (const [sx, sy] of [[-0.33, 0.82], [0.33, 0.82], [0, 1.4]]) {
    const p = new THREE.Mesh(cylinderGeometry(0.3, 0.3, 2.1, 10).translate(0, -1.05, 0).rotateX(Math.PI / 2), sack);
    p.position.set(sx, sy + 0.3, 0);
    cart.add(p);
  }
  g.add(place(cart, { x: -0.1, y: y0, z: 2.2 }));
  // pockets stacked by the cart door
  for (const [x, z, y] of [[-0.55, -3.9, 0], [-0.55, -3.3, 0], [-0.55, -3.6, 0.55]]) {
    const p = new THREE.Mesh(cylinderGeometry(0.28, 0.28, 1.4, 10).translate(0, -0.7, 0).rotateZ(Math.PI / 2), sack);
    p.position.set(x + 0.1, y0 + y + 0.28, z);
    g.add(p);
  }

  // ---- hop garden: poles, top wires and climbing bines ----
  const gx0 = 1.2, gx1 = 9.75, gz0 = -4.7, gz1 = 4.7;
  g.add(place(cropField({ w: gx1 - gx0, d: gz1 - gz0, crop: 'plowed' }), { x: (gx0 + gx1) / 2, y: y0, z: (gz0 + gz1) / 2 }));
  const topY = y0 + 6.6;
  const poleXs = [1.5, 4.25, 7.0, 9.5];
  const poleZs = [-4.45, -1.5, 1.5, 4.45];
  for (const x of poleXs) for (const z of poleZs) {
    const edge = x === poleXs[0] || x === poleXs[3] || z === poleZs[0] || z === poleZs[3];
    g.add(place(cylinder(0.08, 0.11, topY - y0 + 0.1, pole, 6), { x, y: y0, z }));
    if (edge) g.add(place(box(0.25, 0.08, 0.25, pole), { x, y: topY + 0.08, z }));
  }
  // anchor wires from the corner poles back into the ground
  for (const x of [poleXs[0], poleXs[3]]) for (const z of [poleZs[0], poleZs[3]]) {
    const dx = x < 5 ? 0.9 : -0.9, dz = z < 0 ? 0.9 : -0.9;
    g.add(beam([x, topY, z], [x + dx * 0.4, y0 + 0.1, z + dz * 1.8], 0.03, wire));
  }
  // main wires across the pole tops
  for (const z of poleZs) g.add(beam([poleXs[0], topY, z], [poleXs[3], topY, z], 0.035, wire));
  for (const x of poleXs) g.add(beam([x, topY, poleZs[0]], [x, topY, poleZs[3]], 0.035, wire));
  // hop rows run along z; each row has a top wire and V-strung bines
  const rowXs = [2.1, 2.95, 3.8, 4.7, 5.55, 6.4, 7.3, 8.15, 9.0];
  let k = 0;
  for (const rx of rowXs) {
    g.add(beam([rx, topY - 0.05, poleZs[0]], [rx, topY - 0.05, poleZs[3]], 0.025, wire));
    for (let z = -4.0; z <= 4.01; z += 0.8) {
      for (const lean of [-0.28, 0.28]) {
        const m = bineMats[k++ % 3];
        const bx2 = rx + lean, h = 5.4 + ((k * 7) % 5) * 0.12;
        g.add(strut([rx, y0 + 0.1, z], [bx2, y0 + h, z], 0.07, 0.2, m));
        g.add(place(sphere(0.26, m, 6), { x: bx2, y: y0 + h - 0.4, z }));
        for (const t of [0.45, 0.65, 0.85]) {
          const side = (k + t * 10) % 2 < 1 ? 0.16 : -0.16;
          g.add(place(sphere(0.15, hopMat, 6), { x: rx + lean * t + side * 0.6, y: y0 + h * t, z: z + side }));
        }
        g.add(beam([bx2, y0 + h, z], [bx2 + lean * 0.3, topY - 0.05, z], 0.02, wire));
      }
    }
  }

  // ---- front: lane fence, sign, hedges and trees ----
  g.add(place(fence({ w: 9.0, d: 0.1, h: 0.8, style: 'picket', sides: ['front'], color: PALETTE.white }), { x: -5.4, y: y0, z: 4.75 }));
  for (const sx of [-1.6, 1.0]) g.add(place(box(0.1, 1.7, 0.1, mat(PALETTE.woodDark)), { x: sx, y: y0, z: 4.7 }));
  g.add(place(board('HOP FARM', 2.4, 0.6, '#2f5d27', '#f4ecd0'), { x: -0.3, y: y0 + 1.1, z: 4.7 }));
  g.add(place(fence({ w: gx1 - gx0, d: gz1 - gz0 + 0.3, h: 1.0, style: 'wire', sides: ['back', 'right'] }), { x: (gx0 + gx1) / 2, y: y0, z: 0 }));
  g.add(place(hedge({ w: 3.6, h: 1.0, d: 0.6 }), { x: -8.0, y: y0, z: -4.75 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 32 }), { x: -5.2, y: y0, z: 4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 33 }), { x: -9.5, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 34 }), { x: -1.4, y: y0, z: 4.0 }));
  return g;
}

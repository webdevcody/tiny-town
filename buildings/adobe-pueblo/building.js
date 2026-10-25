import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, lot, patch, box, boxFaces, cylinder, place, mat, shade, parapet, bench,
} from '../../src/lib/index.js';
import {
  ADOBE, TURQUOISE, adobe, ladder, ristra, horno, woodpile, ramada, cactus, yucca, pot, window_, doorway,
} from './props.js';

const STOREY = 2.7;
const PARAPET = 0.35;

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Three adobe tiers step back towards the rear-left corner, so every roof is a terrace.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'sand'));

  const roofMat = mat(shade(ADOBE, -0.12));
  const skirt = adobe(shade(ADOBE, -0.22));

  // blocks: centre x/z, size w/d, base y, height, wall colour
  const T1 = { x: -1.7, z: -1.6, w: 15.4, d: 5.8, y: y0, h: STOREY, c: ADOBE };
  const T2 = { x: -3.4, z: -2.5, w: 12.0, d: 4.0, y: y0 + STOREY, h: STOREY, c: shade(ADOBE, 0.07) };
  const T3 = { x: -6.2, z: -3.35, w: 6.4, d: 2.3, y: y0 + 2 * STOREY, h: STOREY, c: shade(ADOBE, 0.13) };
  const AN = { x: 7.7, z: -3.0, w: 3.4, d: 3.0, y: y0, h: 2.4, c: shade(ADOBE, 0.04) };
  const blocks = [T1, T2, T3, AN];

  for (const b of blocks) {
    const walls = adobe(b.c);
    g.add(place(boxFaces(b.w, b.h, b.d, { sides: walls, top: roofMat }), { x: b.x, y: b.y, z: b.z }));
    g.add(place(parapet({ w: b.w, d: b.d, h: PARAPET, t: 0.25, material: walls }), { x: b.x, y: b.y + b.h, z: b.z }));
  }
  // darker mud skirting where the walls meet the ground
  for (const b of [T1, AN]) g.add(place(box(b.w + 0.06, 0.35, b.d + 0.06, skirt), { x: b.x, y: y0, z: b.z }));

  // helpers to put things on a block face. Objects are built facing +z.
  const face = (b, side, u, y, obj) => {
    const p = {
      front: { x: b.x + u, z: b.z + b.d / 2, ry: 0 },
      back: { x: b.x - u, z: b.z - b.d / 2, ry: 180 },
      right: { x: b.x + b.w / 2, z: b.z - u, ry: 90 },
      left: { x: b.x - b.w / 2, z: b.z + u, ry: -90 },
    }[side];
    g.add(place(obj, { ...p, y }));
  };
  const span = (b, side) => (side === 'front' || side === 'back' ? b.w : b.d);

  // vigas: round roof beams poking through the top of every wall
  const vigaMat = mat(PALETTE.woodLight);
  const vigaEnd = mat(shade(PALETTE.woodLight, 0.2));
  const vigas = (b, side, { from = -Infinity, to = Infinity } = {}) => {
    const L = span(b, side);
    const n = Math.max(2, Math.round(L / 1.15));
    for (let i = 0; i < n; i++) {
      const u = -L / 2 + (L * (i + 0.5)) / n;
      if (u < from || u > to) continue;
      const v = new THREE.Group();
      v.add(place(cylinder(0.12, 0.12, 0.62, vigaMat, 6), { rx: 90, z: -0.05 }));
      v.add(place(cylinder(0.125, 0.125, 0.02, vigaEnd, 6), { rx: 90, z: 0.56 }));
      face(b, side, u, b.y + b.h - 0.32, v);
    }
  };
  vigas(T1, 'front'); vigas(T1, 'right', { to: -0.4 }); vigas(T1, 'left'); vigas(T1, 'back');
  vigas(T2, 'front'); vigas(T2, 'right'); vigas(T2, 'left'); vigas(T2, 'back');
  vigas(T3, 'front'); vigas(T3, 'right'); vigas(T3, 'back'); vigas(T3, 'left');
  vigas(AN, 'front'); vigas(AN, 'right'); vigas(AN, 'back');

  // canales: wooden rain spouts
  const canal = () => place(box(0.22, 0.14, 0.9, mat(PALETTE.wood)), { z: 0.2 });
  for (const u of [-6.5, 4.0]) face(T1, 'front', u, T1.y + T1.h + 0.02, canal());
  for (const u of [1.8]) face(T2, 'front', u, T2.y + T2.h + 0.02, canal());
  face(T3, 'front', 2.5, T3.y + T3.h + 0.02, canal());

  // doors & windows
  face(T1, 'front', -3.2, y0, doorway({ color: TURQUOISE }));
  face(T1, 'front', 3.6, y0, doorway({ color: PALETTE.woodDark }));
  for (const u of [-6.1, -4.6, -1.0, 1.0, 5.6]) face(T1, 'front', u, y0 + 1.15, window_());
  face(T1, 'left', 1.2, y0 + 1.15, window_());
  face(T1, 'left', -2.4, y0 + 1.15, window_({ w: 0.5, h: 0.5 }));
  face(T2, 'left', -0.6, T2.y + 1.15, window_());
  face(T3, 'left', 0, T3.y + 1.15, window_({ w: 0.5, h: 0.5 }));
  face(T1, 'right', -2.2, y0 + 1.15, window_());
  face(T1, 'back', 0.5, y0 + 1.15, window_());
  face(T1, 'back', 4.5, y0 + 1.15, window_());
  face(T2, 'front', 0.6, T2.y, doorway({ color: '#2f6fa8' }));
  for (const u of [-3.4, -1.6, 3.2, 4.6]) face(T2, 'front', u, T2.y + 1.15, window_());
  face(T2, 'right', 0, T2.y + 1.15, window_());
  for (const u of [-3, 2]) face(T2, 'back', u, T2.y + 1.15, window_({ w: 0.5, h: 0.5 }));
  face(T3, 'front', -1.2, T3.y, doorway({ color: TURQUOISE, w: 0.85, h: 1.85 }));
  face(T3, 'front', 1.6, T3.y + 1.15, window_());
  face(T3, 'right', 0, T3.y + 1.15, window_({ w: 0.5 }));
  face(T3, 'back', 1, T3.y + 1.15, window_({ w: 0.5, h: 0.5 }));
  face(AN, 'front', -0.4, y0, doorway({ color: TURQUOISE, w: 0.85, h: 1.8 }));
  face(AN, 'right', 0.3, y0 + 1.05, window_({ w: 0.5, h: 0.5 }));

  // ladders between the terraces (rails poke well above the parapets)
  face(T1, 'front', -5.35, y0, ladder({ rest: T1.h + PARAPET, lean: 1.0 }));
  face(T2, 'front', -0.9, T2.y, ladder({ rest: T2.h + PARAPET, lean: 0.95 }));
  face(T3, 'front', 0.3, T3.y, ladder({ rest: T3.h + PARAPET, lean: 0.95 }));
  face(T1, 'right', -0.9, y0, ladder({ rest: T1.h + PARAPET, lean: 1.0 }));
  face(T2, 'right', -0.6, T2.y, ladder({ rest: T2.h + PARAPET, lean: 0.9 }));

  // chili ristras hanging from the vigas beside the doors and on the upper terraces
  const hang = (b, side, u, len, seed) => face(b, side, u, b.y + b.h - 0.38, place(ristra({ len, seed }), { z: 0.38 }));
  hang(T1, 'front', -2.5, 1.35, 1); hang(T1, 'front', -3.9, 1.2, 2);
  hang(T1, 'front', 4.3, 1.35, 3); hang(T1, 'front', 2.0, 1.1, 4);
  hang(T2, 'front', 1.4, 1.3, 5); hang(T2, 'front', -2.5, 1.1, 6);
  hang(T3, 'front', -2.2, 1.2, 7);

  // chimneys on the upper roofs
  const chim = (x, z, yb) => {
    g.add(place(box(0.6, 1.0, 0.6, adobe(shade(ADOBE, 0.1))), { x, y: yb, z }));
    g.add(place(cylinder(0.18, 0.22, 0.35, mat('#9a5a34'), 8), { x, y: yb + 1.0, z }));
  };
  chim(T3.x + 2.2, T3.z - 0.3, T3.y + T3.h);
  chim(T2.x + 4.2, T2.z - 0.9, T2.y + T2.h);
  chim(AN.x + 0.8, AN.z - 0.6, AN.y + AN.h);

  // rooftop horno + woodpile on the first-floor terrace
  const t1Top = T1.y + T1.h;
  g.add(place(horno({ r: 0.7 }), { x: 4.6, y: t1Top, z: -3.3, ry: 90 }));
  g.add(place(woodpile({ w: 1.0, rows: 2 }), { x: 4.3, y: t1Top, z: -0.6 }));
  g.add(place(pot({ r: 0.26, h: 0.45 }), { x: -8.6, y: t1Top, z: 0.6 }));
  g.add(place(pot({ r: 0.22, h: 0.4, color: '#c2643a', band: '#f1e2c4' }), { x: -8.0, y: t1Top, z: 0.7 }));
  // drying chillies laid out on a mat on the second terrace
  const mx = -1.2, mz = -1.6, my = T2.y + T2.h;
  g.add(place(box(1.6, 0.04, 0.9, mat(PALETTE.hay)), { x: mx, y: my, z: mz }));
  for (let i = 0; i < 5; i++) for (let j = 0; j < 3; j++) {
    g.add(place(box(0.2, 0.08, 0.12, mat(j % 2 ? PALETTE.red : '#a8231c')), { x: mx - 0.6 + i * 0.3, y: my + 0.04, z: mz - 0.27 + j * 0.27, ry: (i * 37 + j * 23) % 60 - 30 }));
  }

  // --- yard -------------------------------------------------------------
  // packed-earth plaza in front, path to the street
  g.add(place(patch(19.4, 3.4, mat('#c9a374')), { y: y0, z: 3.05 }));
  g.add(place(patch(3.8, 2.9, mat('#c9a374')), { x: 7.9, y: y0, z: -0.1 }));

  // ground hornos with woodpiles
  g.add(place(horno({ r: 0.85 }), { x: -8.1, y: y0, z: 3.2 }));
  g.add(place(woodpile({ w: 1.2, rows: 3, seed: 4 }), { x: -6.4, y: y0, z: 2.6, ry: 90 }));
  g.add(place(horno({ r: 0.75 }), { x: 0.6, y: y0, z: 3.6 }));

  // ramada with ristras, a bench and pots
  const RX = 7.9, RZ = 0.4;
  g.add(place(ramada({ w: 3.2, d: 2.6, h: 2.4 }), { x: RX, y: y0, z: RZ }));
  for (const [i, dx] of [-1.1, -0.35, 0.4, 1.15].entries()) {
    g.add(place(ristra({ len: 1.1 + (i % 2) * 0.25, seed: 20 + i }), { x: RX + dx, y: y0 + 2.42, z: RZ + 1.3 }));
  }
  g.add(place(bench({ w: 1.6 }), { x: RX, y: y0, z: RZ - 0.6 }));
  g.add(place(pot({ r: 0.3, h: 0.55 }), { x: RX - 1.2, y: y0, z: RZ + 0.3 }));
  g.add(place(pot({ r: 0.25, h: 0.45, color: '#c2643a', band: '#f1e2c4' }), { x: RX + 1.25, y: y0, z: RZ + 0.1 }));

  // pots by the doors
  g.add(place(pot({ r: 0.28, h: 0.5 }), { x: T1.x - 2.2, y: y0, z: 1.75 }));
  g.add(place(pot({ r: 0.22, h: 0.42, color: '#c2643a', band: '#f1e2c4' }), { x: T1.x + 4.6, y: y0, z: 1.7 }));

  // desert planting
  g.add(place(cactus({ h: 2.4, seed: 2 }), { x: 9.0, y: y0, z: 4.1 }));
  g.add(place(cactus({ h: 1.6, seed: 5 }), { x: -9.3, y: y0, z: 4.5 }));
  for (const [x, z, s] of [[3.0, 4.4, 1], [-4.2, 4.5, 2], [6.0, 4.6, 3], [-1.8, 4.6, 4], [9.4, 2.5, 5]]) {
    g.add(place(yucca({ h: 0.8, seed: s }), { x, y: y0, z }));
  }
  return g;
}

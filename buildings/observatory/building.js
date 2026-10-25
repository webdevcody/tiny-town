import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, cylinder, place, beam, pipe,
  stairs, door, tree, car, streetLamp, mat, metal, textured, signTexture,
  surface, rooftopUnits,
} from '../../src/lib/index.js';
import { makeHill, terrainMesh, boulder } from './terrain.js';
import { observatoryDome } from './dome.js';

// Sign with 0..1 UVs on the front face so the text fills the whole panel.
function panelSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', d = 0.12 } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const face = textured(signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w), border: fg }));
  const side = mat(bg);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  // ---- rocky hill with a flat summit terrace ------------------------------
  const C = { x: -0.9, z: -1.4 };
  const R = 2.75, H = 2.4;
  const stairX = C.x, stairTop = C.z + R - 0.1, stairD = 2.8;
  const cut = (x, z, h) => {
    if (Math.abs(x - stairX) < 0.85 && z > stairTop - 0.2) {
      const sh = H * (1 - (z - stairTop) / stairD);
      return Math.min(h, sh - 0.08);
    }
    return h;
  };
  const hill = makeHill({ cx: C.x, cz: C.z, radius: R, H, cut });
  g.add(terrainMesh(hill, { y0, seed: 7 }));
  const top = y0 + H;

  // summit terrace + railing (gap where the stairs arrive)
  g.add(place(cylinder(R, R + 0.1, 0.12, surface('paving', PALETTE.paving, { size: 2 }), 40), { x: C.x, y: top - 0.04, z: C.z }));
  const railM = metal(PALETTE.steelDark);
  const rr = R - 0.12;
  const posts = [];
  for (let a = 0; a < 360; a += 15) {
    if (Math.abs(a - 90) < 16) continue; // stairs gap (+z)
    posts.push(a);
  }
  const pt = (a, y) => [C.x + Math.cos((a * Math.PI) / 180) * rr, y, C.z + Math.sin((a * Math.PI) / 180) * rr];
  for (const a of posts) g.add(beam(pt(a, top), pt(a, top + 0.9), 0.06, railM));
  for (let i = 0; i < posts.length; i++) {
    const a = posts[i], b = posts[(i + 1) % posts.length];
    if ((b - a + 360) % 360 > 20) continue;
    g.add(beam(pt(a, top + 0.9), pt(b, top + 0.9), 0.06, railM));
    g.add(beam(pt(a, top + 0.45), pt(b, top + 0.45), 0.04, railM));
  }

  // ---- the observatory: white drum + slit dome, telescope peeking out ------
  g.add(place(observatoryDome({ radius: 2.15, drumH: 2.1, slit: 1.15, altitude: 38 }), { x: C.x, y: top, z: C.z, ry: 38 }));
  // drum door facing the stairs
  g.add(place(door({ w: 0.9, h: 1.9, color: PALETTE.navy }), { x: C.x, y: top + 0.05, z: C.z + 2.13 }));
  g.add(place(box(1.3, 0.1, 0.6, mat(PALETTE.lightGrey)), { x: C.x, y: top + 2.0, z: C.z + 2.4 }));

  // stone stairs up the hill with handrails
  g.add(place(stairs({ w: 1.3, h: H, d: stairD, steps: 11, material: mat(PALETTE.stone) }), { x: stairX, y: y0, z: stairTop + stairD / 2 }));
  for (const s of [-1, 1]) {
    const x = stairX + s * 0.62;
    g.add(beam([x, y0 + 0.9, stairTop + stairD], [x, top + 0.9, stairTop], 0.06, railM));
    for (const t of [0.05, 0.5, 0.95]) {
      const z = stairTop + stairD * (1 - t), y = y0 + H * t;
      g.add(beam([x, y, z], [x, y + 0.9, z], 0.06, railM));
    }
  }
  g.add(place(patch(1.3, 5 - (stairTop + stairD), 'paved'), { x: stairX, y: y0, z: (stairTop + stairD + 5) / 2 }));

  // ---- small research lab at the foot of the hill ------------------------
  const lab = { x: 2.85, z: 2.85, w: 3.9, d: 3.0, h: 3.2 };
  g.add(place(facadeBlock({
    w: lab.w, d: lab.d, floors: 1, floorHeight: lab.h, style: 'ribbon',
    wall: PALETTE.white, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, bay: 1.3, lit: 0.1, seed: 4,
    roof: PALETTE.concrete,
  }), { x: lab.x, y: y0, z: lab.z }));
  g.add(place(box(lab.w + 0.1, 0.18, lab.d + 0.1, mat(PALETTE.navy)), { x: lab.x, y: y0, z: lab.z }));
  g.add(place(parapet({ w: lab.w, d: lab.d, h: 0.5, t: 0.18, material: mat(PALETTE.white) }), { x: lab.x, y: y0 + lab.h, z: lab.z }));
  // entrance: glass door, canopy, sign on the parapet
  const fz = lab.z + lab.d / 2;
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.glassDark }), { x: lab.x - 0.9, y: y0, z: fz }));
  g.add(place(box(1.6, 0.12, 0.8, mat(PALETTE.navy)), { x: lab.x - 0.9, y: y0 + 2.35, z: fz + 0.4 }));
  g.add(place(panelSign('OBSERVATORY', 3.5, 0.62), { x: lab.x, y: y0 + lab.h - 0.05, z: fz + 0.1 }));
  // roof: small teaching dome, weather station, AC unit
  const ry = y0 + lab.h;
  g.add(place(observatoryDome({ radius: 0.85, drumH: 0.45, slit: 0.36, telescope: false, plinth: false }), { x: lab.x + 0.85, y: ry, z: lab.z - 0.45, ry: 200 }));
  const mx = lab.x - 1.4, mz = lab.z - 0.9;
  g.add(pipe([mx, ry, mz], [mx, ry + 2.0, mz], 0.05, metal(PALETTE.steelLight)));
  g.add(pipe([mx - 0.35, ry + 2.0, mz], [mx + 0.35, ry + 2.0, mz], 0.025, metal(PALETTE.steelLight)));
  g.add(pipe([mx, ry + 2.0, mz - 0.35], [mx, ry + 2.0, mz + 0.35], 0.025, metal(PALETTE.steelLight)));
  for (const [dx, dz] of [[0.35, 0], [-0.35, 0], [0, 0.35], [0, -0.35]]) {
    g.add(place(cylinder(0.08, 0.08, 0.1, mat(PALETTE.red), 8), { x: mx + dx, y: ry + 1.95, z: mz + dz }));
  }
  g.add(place(box(0.5, 0.35, 0.25, mat(PALETTE.white)), { x: mx, y: ry + 1.3, z: mz + 0.08 }));
  g.add(place(rooftopUnits({ w: 1.0, d: 0.8, count: 1, seed: 3 }), { x: lab.x - 0.4, y: ry, z: lab.z + 0.6 }));

  // ---- forecourt: parking, lamp, paths ----------------------------------
  g.add(place(patch(3.2, 1.9, 'asphalt'), { x: -3.35, y: y0, z: 4.0 }));
  g.add(place(box(0.05, 0.02, 1.6, mat(PALETTE.white)), { x: -1.85, y: y0 + 0.05, z: 4.0 }));
  g.add(place(car({ color: PALETTE.blue, kind: 'van' }), { x: -3.35, y: y0 + 0.05, z: 4.0, s: 0.62 }));
  g.add(place(patch(4.1, 0.9, 'paved'), { x: lab.x - 0.1, y: y0, z: 4.75 }));
  g.add(place(patch(1.6, 0.9, 'paved'), { x: 0.0, y: y0, z: 4.75 }));
  g.add(place(streetLamp({ h: 3.2 }), { x: -1.6, y: y0, z: 4.75, ry: 180 }));

  // ---- landscaping: boulders and pines on the hill, trees behind the lab --
  const rockM = mat(PALETTE.stone);
  const rockD = mat(PALETTE.stoneDark);
  const rocks = [
    [-4.3, 0.2, 0.6], [-3.4, 2.0, 0.45], [1.6, -3.6, 0.55], [-4.2, -4.1, 0.7], [0.9, 0.9, 0.4],
    [-2.6, 1.6, 0.35], [2.3, -1.2, 0.4], [-4.5, -2.2, 0.5], [1.0, -4.5, 0.4], [3.4, 0.6, 0.3],
  ];
  rocks.forEach(([x, z, s], i) => g.add(place(boulder(s, 50 + i, i % 2 ? rockM : rockD), { x, y: y0 + hill(x, z), z })));
  const pines = [[-4.0, 1.5, 3.0], [-3.9, -3.4, 3.6], [2.0, -4.0, 3.4], [4.0, -3.8, 3.8], [4.1, -1.8, 3.4], [3.9, 0.2, 2.6]];
  pines.forEach(([x, z, h], i) => g.add(place(tree({ kind: 'cone', h, seed: 20 + i }), { x, y: y0 + hill(x, z) - 0.1, z })));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 31 }), { x: 0.4, y: y0, z: 3.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 32 }), { x: -2.0, y: y0 + hill(-2.0, 3.0), z: 3.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 33 }), { x: 4.6, y: y0, z: 4.6 }));
  return g;
}

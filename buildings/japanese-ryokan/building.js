import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, place, mat, surface, textured, tree, beam, pipe, water,
} from '../../src/lib/index.js';
import {
  C, bayTexture, bayWall, irimoyaRoof, pentRoof, groundDecal, rakedGravelTex, norenTex,
  bambooFence, plaque, stoneLantern, rock, cloudPine, maple, bambooClump, chochin, koi,
  steamPuff, oke, pondShape,
} from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Layout: two-storey main inn (honkan) across the back-left with an engawa
// veranda and entrance porch; single-storey bath house wing back-right joined
// by a covered corridor. Front: raked gravel garden (left), koi pond with a
// vermilion arched bridge up to the entrance (middle), steaming rock onsen
// behind a bamboo fence (right).
export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));
  const y0 = LOT_HEIGHT;
  const plinth = 0.4;
  const FL = y0 + plinth; // floor level
  const h1 = 2.6, h2 = 2.5;
  const Y1 = FL + h1, Y2 = Y1 + h2;

  const stone = mat('#9d978c');
  const timber = mat(C.timber);
  const deckTop = surface('planks', C.deck, { size: 1.5 });
  const groundTex = bayTexture('ground');
  const groundLit = bayTexture('ground', true);
  const upperTex = bayTexture('upper', true);
  const upperTex2 = bayTexture('upper');

  // ---------------------------------------------------------------- main inn
  const M = { x0: -9, x1: 2.6, z0: -4.4, z1: 0 };
  const mw = M.x1 - M.x0, md = M.z1 - M.z0, mcx = (M.x0 + M.x1) / 2, mcz = (M.z0 + M.z1) / 2;
  g.add(place(box(mw + 0.2, plinth, md + 0.2, stone), { x: mcx, y: y0, z: mcz }));
  g.add(place(bayWall(mw, h1, md, { tex: groundLit, sideTex: groundTex, bay: 1.45 }), { x: mcx, y: FL, z: mcz }));
  g.add(place(bayWall(mw, h2, md, { tex: upperTex, sideTex: upperTex2, bay: 1.45 }), { x: mcx, y: Y1, z: mcz }));
  // pent roof (hisashi) between the storeys, deep over the engawa at the front
  g.add(place(pentRoof({
    wall: M,
    outer: { x0: M.x0 - 0.55, x1: M.x1 + 0.55, z0: M.z0 - 0.5, z1: M.z1 + 1.3 },
    h: 0.8, flare: 0.3,
  }), { y: Y1 - 0.1 }));
  g.add(place(irimoyaRoof({ w: mw, d: md, h: 2.7, overhang: 0.75, gableAt: 0.5, flare: 0.45, segU: 12 }), { x: mcx, y: Y2, z: mcz }));

  // engawa veranda: raised plank deck with posts carrying the pent roof
  g.add(place(boxFaces(mw, plinth, 1.15, { sides: C.timberMid, top: deckTop }), { x: mcx, y: y0, z: 0.575 }));
  for (let i = 0; i <= 7; i++) {
    const x = M.x0 + 0.1 + (i * (mw - 0.2)) / 7;
    if (Math.abs(x - 0.8) < 1.2) continue; // porch posts instead
    g.add(place(box(0.14, Y1 - 0.25 - FL, 0.14, timber), { x, y: FL, z: 1.05 }));
  }
  g.add(place(box(mw, 0.12, 0.12, timber), { x: mcx, y: Y1 - 0.38, z: 1.05 }));
  // stepping stones (kutsunugi-ishi) up to the veranda
  for (const x of [-7.6, -4.6]) g.add(place(box(0.8, 0.22, 0.5, stone), { x, y: y0, z: 1.4 }));

  // genkan entrance porch with a gable facing the street
  const px = 0.8;
  g.add(place(boxFaces(2.4, plinth, 1.0, { sides: C.timberMid, top: mat('#8e897f') }), { x: px, y: y0, z: 1.6 }));
  for (const sx of [-1, 1]) g.add(place(box(0.2, 3.0 - FL, 0.2, timber), { x: px + sx * 1.1, y: FL, z: 2.0 }));
  g.add(place(box(2.6, 0.24, 0.24, timber), { x: px, y: 2.8, z: 2.0 }));
  g.add(place(irimoyaRoof({ w: 2.4, d: 2.6, h: 1.15, overhang: 0.3, gableAt: 0, flare: 0.18, segU: 6 }), { x: px, y: 3.02, z: 0.85, ry: 90 }));
  g.add(place(plaque({ text: 'RYOKAN', w: 1.5, h: 0.48 }), { x: px, y: 3.12, z: 2.27 }));
  // noren curtain with the onsen mark, doorway behind
  const norenGeo = new THREE.BoxGeometry(2.0, 0.85, 0.03).translate(0, 0.425, 0);
  const norenM = textured(norenTex(), { side: THREE.DoubleSide });
  g.add(place(new THREE.Mesh(norenGeo, [timber, timber, timber, timber, norenM, norenM]), { x: px, y: 1.95, z: 2.02 }));
  g.add(place(box(2.0, 2.2, 0.06, mat(C.paperLit, { emissive: C.paperLit, emissiveIntensity: 0.35 })), { x: px, y: FL, z: 0.02 }));
  for (const sx of [-1, 1]) g.add(place(chochin(), { x: px + sx * 1.45, y: 2.95, z: 2.1 }));
  g.add(place(box(1.0, 0.2, 0.55, stone), { x: px, y: y0, z: 2.35 }));

  // ------------------------------------------------- bath house wing + corridor
  const B = { x0: 4.2, x1: 9.4, z0: -4.4, z1: -1.6 };
  const bw = B.x1 - B.x0, bd = B.z1 - B.z0, bcx = (B.x0 + B.x1) / 2, bcz = (B.z0 + B.z1) / 2;
  g.add(place(box(bw + 0.2, plinth, bd + 0.2, stone), { x: bcx, y: y0, z: bcz }));
  g.add(place(bayWall(bw, h1, bd, { tex: groundTex, sideTex: groundLit, bay: 1.3 }), { x: bcx, y: FL, z: bcz }));
  g.add(place(irimoyaRoof({ w: bw, d: bd, h: 1.8, overhang: 0.5, gableAt: 0.55, flare: 0.35, segU: 8 }), { x: bcx, y: Y1, z: bcz }));
  // yagura steam vent on the ridge
  g.add(place(boxFaces(1.3, 0.5, 0.7, { sides: C.timber, top: C.timber }), { x: bcx, y: Y1 + 1.55, z: bcz }));
  g.add(place(irimoyaRoof({ w: 1.3, d: 0.7, h: 0.35, overhang: 0.2, gableAt: 0, flare: 0.1, segU: 4, ridge: false }), { x: bcx, y: Y1 + 2.05, z: bcz }));
  // covered corridor (watari-roka)
  g.add(place(box(1.8, plinth, 1.4, stone), { x: 3.4, y: y0, z: -2.9 }));
  g.add(place(bayWall(1.6, 2.3, 1.2, { tex: groundLit, bay: 1.4 }), { x: 3.4, y: FL, z: -2.9 }));
  g.add(place(irimoyaRoof({ w: 1.6, d: 1.2, h: 0.55, overhang: 0.25, gableAt: 0, flare: 0, segU: 4, ridge: false }), { x: 3.4, y: FL + 2.3, z: -2.9 }));
  // bath deck in front of the wing
  g.add(place(boxFaces(bw, 0.3, 0.9, { sides: C.timberMid, top: deckTop }), { x: bcx, y: y0, z: -1.15 }));
  for (const [x, z] of [[4.7, -1.1], [5.1, -1.25], [8.9, -1.1]]) g.add(place(oke(), { x, y: y0 + 0.3, z }));

  // ---------------------------------------------------------- rotenburo onsen
  const onsenPts = [[4.3, 0.4], [5.2, -0.3], [6.8, -0.4], [8.4, -0.2], [9.2, 0.7], [9.3, 2.3], [8.6, 3.5], [7.0, 3.9], [5.4, 3.6], [4.4, 2.8], [4.0, 1.6]];
  g.add(place(patch(6.2, 5.2, surface('gravel', '#a8a397', { size: 3 })), { x: 6.6, y: y0, z: 1.6 }));
  g.add(place(pondShape(onsenPts, { depth: 0.14, color: C.onsen }), { y: y0 }));
  rimRocks(g, onsenPts, y0, { size: 0.42, seed: 3 });
  // bamboo spout pouring hot water in
  g.add(pipe([9.75, y0 + 1.15, 1.5], [9.0, y0 + 1.0, 1.5], 0.07, mat(C.bamboo)));
  g.add(place(box(0.05, 0.85, 0.08, water('#bfe9e6')), { x: 8.95, y: y0 + 0.15, z: 1.5 }));
  // steam
  const puffs = [[5.6, 0.7, 1.0, 0.7], [6.6, 1.1, 2.0, 0.85], [7.8, 0.8, 1.2, 0.75], [6.2, 1.9, 1.6, 0.65], [7.3, 2.1, 2.6, 0.8], [8.5, 1.5, 1.9, 0.6], [6.9, 2.8, 1.0, 0.55], [5.2, 1.6, 2.6, 0.5]];
  for (const [x, y, z, r] of puffs) g.add(place(steamPuff(r), { x, y: y0 + y, z }));
  for (const [dy, r, dx] of [[0.4, 0.45, 0], [1.0, 0.55, 0.3], [1.7, 0.6, 0.1]]) g.add(place(steamPuff(r), { x: bcx + dx, y: Y1 + 2.4 + dy, z: bcz }));
  g.add(place(stoneLantern(0.9), { x: 9.35, y: y0, z: -0.45 }));
  // bamboo screen fence round the bath
  g.add(place(bambooFence(6.45, 1.35), { x: 3.4, y: y0, z: 4.85 }));
  g.add(place(bambooFence(6.15, 1.35), { x: 9.85, y: y0, z: 4.85, ry: 90 }));
  g.add(place(bambooFence(4.6, 1.35), { x: 3.4, y: y0, z: 4.85, ry: 90 }));

  // ------------------------------------------------------- koi pond + bridge
  const pondPts = [[-3.3, 3.0], [-2.6, 2.3], [-1.2, 2.25], [0.2, 2.6], [1.6, 2.6], [2.7, 2.5], [3.0, 3.3], [2.6, 4.1], [1.2, 4.25], [-0.4, 4.2], [-1.8, 4.35], [-3.0, 3.9]];
  g.add(place(pondShape(pondPts, { depth: 0.08, color: PALETTE.water }), { y: y0 }));
  rimRocks(g, pondPts, y0, { size: 0.3, seed: 9, skip: (x) => Math.abs(x - px) < 0.75 });
  const fish = [[-2.2, 3.3, 30, '#f08a24', '#ffffff'], [-1.4, 2.9, -50, '#ffffff', '#d8402a'], [-0.6, 3.7, 160, '#e8661e', null], [2.0, 3.1, 100, '#f3c246', null], [1.8, 3.8, -20, '#ffffff', '#e8661e'], [-2.6, 3.7, 200, '#d8402a', '#ffffff']];
  for (const [x, z, ry, c, s] of fish) g.add(place(koi(c, s), { x, y: y0 + 0.11, z, ry }));
  for (const [x, z, r] of [[-1.0, 2.7, 0.22], [2.4, 3.5, 0.2], [-2.7, 3.1, 0.18]]) {
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.03, 8), mat('#4f8f3a')), { x, y: y0 + 0.1, z }));
  }
  archedBridge(g, px, 1.95, 4.65, y0);

  // ---------------------------------------------------- karesansui (gravel)
  const Z = { x0: -9.7, x1: -3.8, z0: 1.55, z1: 4.75 };
  const zw = Z.x1 - Z.x0, zd = Z.z1 - Z.z0;
  const rocks = [
    { x: -8.1, z: 2.9, r: 0.55, ripple: 3 },
    { x: -5.6, z: 3.6, r: 0.45, ripple: 3 },
    { x: -4.8, z: 2.4, r: 0.3, ripple: 2 },
  ];
  const rockUV = rocks.map((k) => ({ u: (k.x - Z.x0) / zw, v: (k.z - Z.z0) / zd, r: k.r / zw, ripple: k.ripple }));
  g.add(place(groundDecal(zw, zd, rakedGravelTex(rockUV, zw / zd)), { x: (Z.x0 + Z.x1) / 2, y: y0 + 0.04, z: (Z.z0 + Z.z1) / 2 }));
  // stone kerb
  const kerb = mat('#7d786f');
  g.add(place(box(zw + 0.2, 0.12, 0.12, kerb), { x: (Z.x0 + Z.x1) / 2, y: y0, z: Z.z0 }));
  g.add(place(box(zw + 0.2, 0.12, 0.12, kerb), { x: (Z.x0 + Z.x1) / 2, y: y0, z: Z.z1 }));
  g.add(place(box(0.12, 0.12, zd, kerb), { x: Z.x1, y: y0, z: (Z.z0 + Z.z1) / 2 }));
  rocks.forEach((k, i) => {
    g.add(place(rock(k.r, { color: i === 1 ? C.rockDark : C.rock, sy: 0.9, ry: i, moss: true }), { x: k.x, y: y0, z: k.z }));
  });
  g.add(place(rock(0.3, { color: C.rockDark, sy: 0.8, ry: 2 }), { x: -7.55, y: y0, z: 3.25 }));
  g.add(place(rock(0.22, { sy: 0.8, ry: 1 }), { x: -5.15, y: y0, z: 3.9 }));

  // ------------------------------------------------- street gate + front fence
  const gz = 4.72;
  for (const sx of [-1, 1]) g.add(place(box(0.2, 2.35, 0.2, timber), { x: px + sx * 0.95, y: y0, z: gz }));
  g.add(place(box(2.3, 0.2, 0.22, timber), { x: px, y: y0 + 2.1, z: gz }));
  g.add(place(irimoyaRoof({ w: 2.3, d: 0.4, h: 0.5, overhang: 0.26, gableAt: 0, flare: 0.12, segU: 6, ridge: false }), { x: px, y: y0 + 2.35, z: gz }));
  g.add(place(plaque({ text: 'RYOKAN', w: 1.5, h: 0.42 }), { x: px, y: y0 + 1.62, z: gz + 0.1 }));
  g.add(place(bambooFence(3.4, 0.9), { x: Z.x1 + 0.1, y: y0, z: 4.9 }));
  g.add(place(bambooFence(1.5, 0.9), { x: px + 1.05, y: y0, z: 4.9 }));

  // ------------------------------------------------------- planting, lanterns
  g.add(place(cloudPine(4.4, 1), { x: -3.35, y: y0, z: 4.2 }));
  g.add(place(cloudPine(3.6, 1), { x: -8.7, y: y0, z: 1.4 }));
  g.add(place(maple(3.4), { x: -2.6, y: y0, z: 1.7 }));
  g.add(place(maple(3.0, '#d9662a'), { x: 2.95, y: y0, z: 1.8 }));
  g.add(place(stoneLantern(1), { x: -0.55, y: y0, z: 2.05 }));
  g.add(place(stoneLantern(0.85), { x: -4.25, y: y0, z: 2.05 }));
  for (const [x, z, h, s] of [[-6.3, 1.25, 0.8, 4], [-1.6, 1.4, 0.7, 5], [2.4, 4.6, 0.8, 6], [-9.6, 4.5, 0.9, 7]]) {
    g.add(place(tree({ kind: 'bush', h, seed: s, color: s % 2 ? '#4f8a35' : '#3f7a2c' }), { x, y: y0, z }));
  }
  g.add(place(bambooClump(4.8, 6, 5), { x: 3.45, y: y0, z: -4.4 }));
  g.add(place(bambooClump(4.2, 5, 8), { x: 3.4, y: y0, z: -1.3 }));
  // gravel path round the back
  g.add(place(patch(19.6, 0.55, 'gravel'), { y: y0, z: -4.7 }));
  return g;
}

/** Ring of rocks along a closed polygon. */
function rimRocks(g, pts, y0, { size, seed, skip = () => false }) {
  let n = seed;
  for (let i = 0; i < pts.length; i++) {
    const [ax, az] = pts[i];
    const [bx, bz] = pts[(i + 1) % pts.length];
    const len = Math.hypot(bx - ax, bz - az);
    const steps = Math.max(1, Math.round(len / (size * 1.7)));
    for (let k = 0; k < steps; k++) {
      const t = k / steps;
      const x = ax + (bx - ax) * t, z = az + (bz - az) * t;
      if (skip(x, z)) continue;
      n = (n * 9301 + 49297) % 233280;
      const f = n / 233280;
      const r = size * (0.75 + f * 0.5);
      g.add(place(rock(r, { color: f > 0.5 ? C.rock : C.rockDark, sy: 0.55, ry: f * 6 }), { x, y: y0, z }));
    }
  }
}

/** Vermilion arched (taiko) bridge along Z at x, from z0 to z1. */
function archedBridge(g, x, z0, z1, y0) {
  const red = mat(C.vermilion);
  const deck = mat(C.cedar);
  const n = 6, rise = 0.55, L = z1 - z0;
  const pts = [];
  for (let i = 0; i <= n; i++) pts.push([z0 + (L * i) / n, y0 + 0.2 + rise * Math.sin((Math.PI * i) / n)]);
  for (let i = 0; i < n; i++) {
    const [za, ya] = pts[i], [zb, yb] = pts[i + 1];
    const seg = Math.hypot(zb - za, yb - ya);
    const m = box(1.1, 0.1, seg + 0.04, deck);
    m.geometry = m.geometry.clone().translate(0, -0.05, 0);
    g.add(place(m, { x, y: (ya + yb) / 2, z: (za + zb) / 2, rx: -THREE.MathUtils.radToDeg(Math.atan2(yb - ya, zb - za)) }));
    for (const sx of [-1, 1]) {
      g.add(beam([x + sx * 0.55, ya - 0.08, za], [x + sx * 0.55, yb - 0.08, zb], 0.1, red));
      g.add(beam([x + sx * 0.55, ya + 0.55, za], [x + sx * 0.55, yb + 0.55, zb], 0.07, red));
    }
  }
  for (const [z, y] of pts) for (const sx of [-1, 1]) g.add(place(box(0.08, 0.6, 0.08, red), { x: x + sx * 0.55, y: y - 0.05, z }));
  for (const sx of [-1, 1]) for (const [z, y] of [pts[0], pts[n]]) g.add(place(box(0.12, 0.75, 0.12, red), { x: x + sx * 0.55, y: y - 0.2, z }));
}

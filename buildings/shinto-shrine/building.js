import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, ShapeBuilder,
  lot, patch, box, cylinder, place, mat, surface, tree, hedge, stairs, canvasTexture, textured,
} from '../../src/lib/index.js';
import {
  VERMILION, VERMILION_DARK, STRAW, PLASTER, GOLD, BARK_EDGE, barkRoof, slab, sweep,
  torii, lantern, komainu, chozuya, emaRack, offeringBox, shide, sacredTree,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z: a stone path runs north under
// a row of vermilion torii gates to a raised nagare-style shrine hall at the back.

const latticeTex = () =>
  canvasTexture(64, 96, (ctx, w, h) => {
    ctx.fillStyle = '#3b2617';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#7a5232';
    for (let x = 4; x < w; x += 10) ctx.fillRect(x, 0, 3, h);
    for (let y = 4; y < h; y += 10) ctx.fillRect(0, y, w, 3);
    ctx.fillStyle = '#2a1a10';
    ctx.fillRect(0, 0, w, 4);
    ctx.fillRect(0, h - 4, w, 4);
  }, { key: 'shinto-shrine:lattice', repeat: false });

/** Raised shrine hall with a curved bark roof; origin = centre of the walls, on the ground. */
function shrineHall() {
  const g = new THREE.Group();
  const W = 4.2, D = 3.0;
  const yP = 0.75, wallH = 2.1, yR = yP + wallH;
  const red = mat(VERMILION);
  const redDark = mat(VERMILION_DARK);
  const deckM = mat(PALETTE.woodLight);

  // stone footing, stilts, deck (engawa) with railing
  g.add(box(W + 0.4, 0.12, D + 0.4, mat('#9a958a')));
  g.add(place(box(W - 0.3, yP - 0.15, D - 0.3, mat('#2c2420')), { y: 0.12 }));
  for (const x of [-W / 2, -W / 6, W / 6, W / 2]) for (const z of [-D / 2, D / 2])
    g.add(place(box(0.2, yP - 0.12, 0.2, red), { x, y: 0.12, z }));
  g.add(place(box(W + 1.0, 0.15, D + 1.0, deckM), { y: yP - 0.15 }));
  const railY = yP + 0.45;
  const ed = (D + 1.0) / 2 - 0.06, ew = (W + 1.0) / 2 - 0.06;
  g.add(place(box(0.08, 0.06, D + 0.9, red), { x: -ew, y: railY }));
  g.add(place(box(0.08, 0.06, D + 0.9, red), { x: ew, y: railY }));
  g.add(place(box(W + 0.9, 0.06, 0.08, red), { y: railY, z: -ed }));
  for (const s of [-1, 1]) g.add(place(box(1.4, 0.06, 0.08, red), { x: s * (ew - 0.7), y: railY, z: ed }));
  for (const [x, z] of [[-ew, -ed], [ew, -ed], [-ew, ed], [ew, ed], [-0.95, ed], [0.95, ed], [-ew, 0], [ew, 0], [0, -ed]])
    g.add(place(box(0.1, 0.5, 0.1, red), { x, y: yP, z }));

  // walls: white plaster framed by vermilion posts and beams
  g.add(place(box(W, wallH, D, mat(PLASTER)), { y: yP }));
  for (const x of [-W / 2, -W / 6, W / 6, W / 2]) for (const z of [-D / 2, D / 2])
    g.add(place(box(0.2, wallH, 0.2, red), { x, y: yP, z }));
  for (const x of [-W / 2, W / 2]) g.add(place(box(0.2, wallH, 0.2, red), { x, y: yP }));
  g.add(place(box(W + 0.08, 0.16, D + 0.08, red), { y: yP + 0.05 }));
  g.add(place(box(W + 0.08, 0.2, D + 0.08, red), { y: yR - 0.45 }));
  g.add(place(box(W + 0.1, 0.16, D + 0.1, redDark), { y: yR - 0.16 }));
  // latticed front doors in the three bays
  const lat = textured(latticeTex());
  const dh = yR - 0.45 - (yP + 0.21);
  for (const x of [-W / 3, 0, W / 3]) {
    const geo = new THREE.BoxGeometry(W / 3 - 0.24, dh, 0.05).translate(0, dh / 2, 0);
    g.add(place(new THREE.Mesh(geo, lat), { x, y: yP + 0.21, z: D / 2 + 0.02 }));
  }

  // nagare-zukuri roof: short back slope, long sweeping front slope over the steps
  const rz = -0.1, ry = yR + 1.7;
  const back = sweep(rz, ry, -D / 2 - 0.75, yR - 0.1, 6, 0.6).reverse();
  const zw = D / 2 + 0.05, yw = yR + 0.32;
  const body = sweep(rz, ry, zw, yw, 6, 0.66);
  const hisashi = [];
  for (let i = 1; i <= 6; i++) {
    const d = (1.8 * i) / 6;
    hisashi.push([zw + d, yw - 0.55 * d + 0.06 * d * d + (i === 6 ? 0.06 : 0)]);
  }
  const profile = [...back, ...body.slice(1), ...hisashi];
  const roofW = W + 1.5, thick = 0.3;
  g.add(slab(profile, roofW, thick, barkRoof(), mat(BARK_EDGE)));
  // gable infill (white with a red king post) under the roof at both ends
  const under = (z) => {
    for (let i = 0; i < profile.length - 1; i++) {
      const [z0, y0] = profile[i], [z1, y1] = profile[i + 1];
      if (z >= z0 && z <= z1) return y0 + ((y1 - y0) * (z - z0)) / (z1 - z0) - thick;
    }
    return yR;
  };
  const gb = new ShapeBuilder();
  const gz = [];
  for (let i = 0; i <= 10; i++) gz.push(-D / 2 + (D * i) / 10);
  for (const s of [-1, 1]) {
    const x = (s * W) / 2;
    for (let i = 0; i < gz.length - 1; i++) {
      const a = [x, yR, 0], b = [x, under(gz[i]), gz[i]], c = [x, under(gz[i + 1]), gz[i + 1]];
      if (s > 0) gb.tri(a, c, b); else gb.tri(a, b, c);
    }
    g.add(place(box(0.14, under(0) - yR, 0.14, red), { x: x + s * 0.03, y: yR }));
  }
  g.add(new THREE.Mesh(gb.build(), mat(PLASTER)));

  // ridge cap, chigi (crossed finials) and katsuogi (billets)
  const ridgeTop = ry + 0.02;
  g.add(place(box(roofW + 0.1, 0.22, 0.42, mat('#3b261a')), { y: ridgeTop - 0.12, z: rz }));
  const chigiM = mat('#4a3020');
  for (const s of [-1, 1]) {
    for (const t of [-1, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.1, 0.2), chigiM);
      m.position.set((s * roofW) / 2, ridgeTop + 0.3, rz + t * 0.24);
      m.rotation.x = t * 0.62;
      g.add(m);
    }
  }
  const katsuoM = mat('#4a3020');
  const goldM = mat(GOLD, { metalness: 0.4, roughness: 0.4 });
  for (const x of [-1.6, -0.55, 0.55, 1.6]) {
    g.add(place(cylinder(0.13, 0.13, 0.95, katsuoM, 8), { x, y: ridgeTop + 0.22, z: rz - 0.475, rx: 90 }));
    for (const z of [-0.49, 0.49]) g.add(place(cylinder(0.14, 0.14, 0.04, goldM, 8), { x, y: ridgeTop + 0.22, z: rz + z - 0.02, rx: 90 }));
  }

  // front steps, eave posts, tie beam, shimenawa rope, bell
  g.add(place(stairs({ w: 1.7, h: yP, d: 1.1, steps: 5, material: deckM }), { y: 0, z: D / 2 + 0.5 + 0.55 }));
  const pz = D / 2 + 1.65;
  const beamY = under(pz) - 0.2;
  for (const x of [-1.9, 1.9]) {
    g.add(place(box(0.32, 0.18, 0.32, mat('#9a958a')), { x, z: pz }));
    g.add(place(box(0.2, beamY, 0.2, red), { x, z: pz }));
  }
  g.add(place(box(4.1, 0.2, 0.2, red), { y: beamY, z: pz }));
  // shimenawa: thick straw rope, fatter in the middle, with paper shide
  const ropeY = beamY - 0.18;
  const rope = cylinder(0.11, 0.11, 3.4, mat(STRAW), 8);
  g.add(place(rope, { x: 1.7, y: ropeY, z: pz + 0.05, rz: 90 }));
  g.add(place(cylinder(0.2, 0.2, 1.6, mat(STRAW), 8), { x: 0.8, y: ropeY, z: pz + 0.05, rz: 90 }));
  const paper = mat(PALETTE.white);
  for (const x of [-1.2, -0.4, 0.4, 1.2]) g.add(place(shide(paper), { x, y: ropeY - 0.08, z: pz + 0.12 }));
  // suzu bell + red/white rope
  g.add(place(cylinder(0.035, 0.035, 0.9, mat('#c8302a'), 6), { y: ropeY - 1.15, z: pz - 0.25 }));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.16, 10, 8), goldM), { y: ropeY - 0.12, z: pz - 0.25 }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // raked white gravel precinct + stone approach path (sandō)
  g.add(place(patch(6.6, 9.6, surface('gravel', '#d8d3c4', { size: 3, seed: 5 })), { x: 0.4, y: y0, z: -0.1 }));
  g.add(place(patch(1.8, 6.6, surface('paving', '#b9b2a4', { size: 1.6, seed: 8 }), 0.08), { y: y0, z: 1.8 }));

  // shrine hall at the back
  const hallZ = -2.1;
  g.add(place(shrineHall(), { y: y0, z: hallZ }));
  g.add(place(offeringBox(), { y: y0, z: hallZ + 3.45 }));

  // path of torii: a large front gate followed by a tunnel of smaller ones
  g.add(place(torii({ span: 2.5, h: 3.6, post: 0.16 }), { y: y0, z: 4.3 }));
  for (const z of [3.25, 2.55, 1.85]) g.add(place(torii({ span: 2.1, h: 2.9, post: 0.12, plaque: false }), { y: y0, z }));

  // stone lanterns and komainu guardians along the path
  for (const s of [-1, 1]) {
    g.add(place(lantern({ h: 1.5 }), { x: s * 1.75, y: y0, z: 3.8 }));
    g.add(place(lantern({ h: 1.35 }), { x: s * 1.75, y: y0, z: 2.2 }));
    g.add(place(komainu(), { x: s * 2.25, y: y0, z: 0.75, ry: s * -20 }));
  }

  // purification pavilion (right) and ema rack
  g.add(place(chozuya(), { x: 3.55, y: y0, z: 2.9, ry: -90 }));
  g.add(place(emaRack(), { x: 3.7, y: y0, z: 0.3, ry: -90 }));

  // sacred tree with shimenawa (left), ringed by a low stone curb
  g.add(place(patch(2.4, 2.4, mat('#4f7f33')), { x: -3.45, y: y0, z: 2.3 }));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(place(box(0.18, 0.28, 0.18, mat('#9a958a')), { x: -3.45 + Math.cos(a) * 1.05, y: y0, z: 2.3 + Math.sin(a) * 1.05 }));
  }
  g.add(place(sacredTree({ h: 6.8 }), { x: -3.45, y: y0, z: 2.3 }));

  // cedars and hedges framing the back of the precinct
  g.add(place(hedge({ w: 9.4, h: 0.7, d: 0.45 }), { y: y0, z: -4.65 }));
  g.add(place(tree({ kind: 'cone', h: 5.6, seed: 12, color: PALETTE.foliageDark }), { x: -3.7, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'cone', h: 5.4, seed: 13, color: PALETTE.foliageDark }), { x: 3.75, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'cone', h: 4.4, seed: 14, color: PALETTE.foliage }), { x: 3.95, y: y0, z: -1.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 15 }), { x: -4.2, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 16 }), { x: -2.6, y: y0, z: 4.5 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 17 }), { x: 4.3, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 18 }), { x: -4.1, y: y0, z: -1.2 }));
  return g;
}

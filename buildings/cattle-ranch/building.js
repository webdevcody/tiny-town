import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, shedRoof, chimney, door, box, place, beam, pipe,
  tree, hayBale, surface, mat, metal,
} from '../../src/lib/index.js';
import {
  longhorn, cowboy, mountedCowboy, railFence, ranchGate, windpump, stockTank, trough, pickup, board, steerSkull, rockingChair,
} from './props.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Left: ranch house with porch, dirt drive under a log entrance arch.
// Right: big dirt corral of longhorns. Back: windpump feeding the stock tank, hay shelter.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const H = TILE; // half of the 2-tile lot
  g.add(lot([2, 2], 'grass'));

  // ---------------------------------------------------------------- ranch house
  const hx = -5, hz = -5.9, hw = 8, hd = 5, wallH = 3.2;
  const wall = '#d9b88a';
  const roofMat = surface('corrugated', PALETTE.roofGreen, { size: 1.5 });
  g.add(place(facadeBlock({
    w: hw, d: hd, h: wallH, floorHeight: wallH, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window,
    shutters: PALETTE.roofGreen, windowW: 0.4, windowH: 0.5, bay: 2.0, lit: 0.15, seed: 7, roof: PALETTE.woodDark,
  }), { x: hx, y: y0, z: hz }));
  // horizontal clapboard lines over the walls
  const lap = mat(PALETTE.woodLight);
  for (let i = 1; i < 6; i++) {
    const yy = y0 + i * 0.52;
    g.add(place(box(0.04, 0.05, hd, lap), { x: hx - hw / 2 - 0.02, y: yy, z: hz }));
    g.add(place(box(0.04, 0.05, hd, lap), { x: hx + hw / 2 + 0.02, y: yy, z: hz }));
  }
  g.add(place(gableRoof({ w: hw, d: hd, h: 2.0, overhang: 0.45, ridge: 'x', material: roofMat, gableMaterial: wall }), { x: hx, y: y0 + wallH, z: hz }));
  g.add(place(chimney({ w: 0.9, h: 3.2, material: surface('cobbles', PALETTE.stone, { size: 1 }) }), { x: hx - hw / 2 + 0.6, y: y0 + wallH - 0.4, z: hz - 0.9 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.woodDark }), { x: hx, y: y0 + 0.35, z: hz + hd / 2 }));

  // porch: deck, posts, railing, sloping tin roof, steps
  const pz0 = hz + hd / 2, pd = 2.1, deckH = 0.35;
  const pzc = pz0 + pd / 2;
  const plank = surface('planks', PALETTE.wood, { size: 1.2 });
  g.add(place(box(hw + 0.4, deckH, pd, plank), { x: hx, y: y0, z: pzc }));
  const postM = mat(PALETTE.woodDark);
  const postZ = pz0 + pd - 0.15;
  const postXs = [-4, -2, 2, 4].map((dx) => hx + dx * 0.97);
  for (const x of postXs) g.add(place(box(0.18, 2.55, 0.18, postM), { x, y: y0 + deckH, z: postZ }));
  g.add(place(box(hw + 0.4, 0.22, 0.2, postM), { x: hx, y: y0 + deckH + 2.5, z: postZ }));
  const porchRoof = box(hw + 0.8, 0.12, pd + 0.6, roofMat);
  porchRoof.geometry = porchRoof.geometry.clone().translate(0, 0, (pd + 0.6) / 2);
  g.add(place(porchRoof, { x: hx, y: y0 + wallH - 0.15, z: pz0 - 0.05, rx: 14 }));
  const railM = mat(PALETTE.white);
  for (const [a, b] of [[postXs[0], postXs[1]], [postXs[2], postXs[3]]]) {
    g.add(place(box(b - a, 0.08, 0.08, railM), { x: (a + b) / 2, y: y0 + deckH + 0.9, z: postZ }));
    for (let x = a + 0.3; x < b - 0.1; x += 0.3) g.add(place(box(0.05, 0.9, 0.05, railM), { x, y: y0 + deckH, z: postZ }));
  }
  for (const s of [-1, 1]) {
    g.add(place(box(0.08, 0.08, pd - 0.2, railM), { x: hx + s * (hw / 2 + 0.1), y: y0 + deckH + 0.9, z: pzc - 0.05 }));
  }
  for (let i = 0; i < 2; i++) {
    g.add(place(box(2.2, deckH * (2 - i) / 3, 0.35, plank), { x: hx, y: y0, z: pz0 + pd + 0.17 + i * 0.35 }));
  }
  g.add(place(rockingChair(), { x: hx - 3.1, y: y0 + deckH, z: pz0 + 0.8, ry: 15 }));
  g.add(place(rockingChair(), { x: hx - 2.2, y: y0 + deckH, z: pz0 + 0.8, ry: -10 }));
  g.add(place(steerSkull({ s: 0.45 }), { x: hx, y: y0 + deckH + 2.35, z: postZ + 0.15 }));

  // yard + dirt drive to the entrance arch
  const driveX = -5.5;
  g.add(place(patch(8.6, 2.6, 'dirt'), { x: hx, y: y0, z: 0.8 }));
  g.add(place(patch(3.2, 8.4, 'dirt'), { x: driveX, y: y0, z: 5.8 }));
  g.add(place(pickup({ color: '#2f8a8a' }), { x: -8.3, y: y0 + 0.03, z: 4.9, ry: 90 }));

  // log entrance arch with a hanging ranch sign and a steer skull on top
  const logM = mat('#7a5634');
  const archZ = H - 0.5, archL = driveX - 2.2, archR = driveX + 2.2, archH = 4.8;
  for (const x of [archL, archR]) g.add(place(box(0.34, archH, 0.34, logM), { x, y: y0, z: archZ }));
  g.add(place(box(archR - archL + 1.0, 0.36, 0.36, logM), { x: driveX, y: y0 + archH - 0.4, z: archZ }));
  for (const x of [driveX - 1.6, driveX + 1.6]) g.add(place(box(0.04, 0.5, 0.04, metal(PALETTE.steelDark)), { x, y: y0 + archH - 0.9, z: archZ }));
  g.add(place(board({ text: 'LONGHORN RANCH', w: 4.2, h: 0.95 }), { x: driveX, y: y0 + archH - 1.85, z: archZ }));
  g.add(place(steerSkull({ s: 0.9 }), { x: driveX, y: y0 + archH + 0.45, z: archZ + 0.1 }));
  // mailbox on a post
  g.add(place(box(0.12, 1.1, 0.12, postM), { x: archR + 0.8, y: y0, z: archZ - 0.5 }));
  g.add(place(box(0.35, 0.3, 0.55, metal(PALETTE.steelLight)), { x: archR + 0.8, y: y0 + 1.1, z: archZ - 0.5 }));
  g.add(place(box(0.04, 0.25, 0.12, mat(PALETTE.red)), { x: archR + 1.0, y: y0 + 1.3, z: archZ - 0.6 }));
  // boundary rails either side of the arch
  g.add(place(railFence([-H + 0.25, archZ], [archL, archZ]), { y: y0 }));
  g.add(place(railFence([archR, archZ], [-0.6, archZ]), { y: y0 }));
  g.add(place(railFence([-H + 0.25, archZ], [-H + 0.25, 0.2]), { y: y0 }));

  // ------------------------------------------------------------------ corral
  const cx0 = -0.4, cx1 = H - 0.25, cz0 = -2.6, cz1 = H - 0.25;
  g.add(place(patch(cx1 - cx0, cz1 - cz0, 'dirt'), { x: (cx0 + cx1) / 2, y: y0, z: (cz0 + cz1) / 2 }));
  const gateZ0 = 0.0, gateZ1 = 3.0;
  g.add(place(railFence([cx0, cz1], [cx1, cz1]), { y: y0 }));
  g.add(place(railFence([cx1, cz1], [cx1, cz0]), { y: y0 }));
  g.add(place(railFence([cx1, cz0], [cx0, cz0]), { y: y0 }));
  g.add(place(railFence([cx0, cz0], [cx0, gateZ0]), { y: y0 }));
  g.add(place(railFence([cx0, gateZ1], [cx0, cz1]), { y: y0 }));
  // gate swung open into the yard
  g.add(place(ranchGate({ w: 3.0 }), { x: cx0, y: y0 + 0.05, z: gateZ0, ry: 150 }));

  // water: round stock tank fed by the windpump, plus a hay feed bunk
  g.add(place(stockTank({ r: 1.15 }), { x: 7.3, y: y0, z: -1.15 }));
  g.add(place(trough({ w: 3.4, d: 0.9, fill: 'hay' }), { x: 2.6, y: y0, z: -1.85 }));

  // longhorns
  const herd = [
    { x: 2.2, z: 6.3, ry: 20, coat: '#9a4b25' },
    { x: 5.4, z: 8.0, ry: 170, coat: '#e8dcc4', patch: '#9a4b25', graze: true },
    { x: 8.0, z: 5.0, ry: -100, coat: '#5a3a22', patch: '#f0e8d8' },
    { x: 2.8, z: 2.6, ry: 200, coat: '#c47a3a', graze: true },
    { x: 7.4, z: 1.6, ry: 90, coat: '#f0e8d8', patch: '#2e2620', graze: true },
    { x: 2.4, z: -0.4, ry: 90, coat: '#b0562a', patch: '#f0e8d8', graze: true },
    { x: 7.6, z: 8.2, ry: 200, coat: '#3e2a1c' },
    { x: 1.4, z: 4.4, ry: -15, coat: '#d9c4a0', patch: '#7a3a1c' },
    { x: 4.4, z: 1.2, ry: 120, coat: '#9a4b25', patch: '#f0e8d8', graze: true, s: 0.65 },
  ];
  for (const c of herd) g.add(place(longhorn(c), { x: c.x, y: y0, z: c.z, ry: c.ry, s: c.s ?? null }));
  g.add(place(mountedCowboy({ horse: '#7a4a2a', shirt: PALETTE.blue }), { x: 5.0, y: y0, z: 4.6, ry: 35 }));

  // ------------------------------------------------- windpump + hay shelter
  const wpx = 6.6, wpz = -6.4;
  g.add(place(windpump({ h: 9.5, radius: 1.7 }), { x: wpx, y: y0, z: wpz }));
  g.add(pipe([wpx, y0 + 0.35, wpz], [7.3, y0 + 0.35, -2.2], 0.07, metal(PALETTE.steelDark)));
  g.add(pipe([7.3, y0 + 0.35, -2.2], [7.3, y0 + 0.85, -2.2], 0.07, metal(PALETTE.steelDark)));

  // open-sided hay shelter (posts + tin lean-to roof) with round bales
  const sx = 1.3, sz = -6.6, sw = 4.4, sd = 3.4, sh = 2.6;
  for (const ddx of [-sw / 2 + 0.1, sw / 2 - 0.1]) for (const ddz of [-sd / 2 + 0.1, sd / 2 - 0.1]) {
    g.add(place(box(0.16, ddz < 0 ? sh + 0.8 : sh, 0.16, postM), { x: sx + ddx, y: y0, z: sz + ddz }));
  }
  g.add(place(shedRoof({ w: sw, d: sd, h: 0.8, overhang: 0.3, material: surface('corrugated', PALETTE.steel, { size: 1.5 }), wallMaterial: mat(PALETTE.woodDark) }), { x: sx, y: y0 + sh, z: sz }));
  for (const [bx, bz, by] of [[-1.2, -0.6, 0], [0, -0.6, 0], [1.2, -0.6, 0], [-0.6, -0.6, 1.25], [0.6, -0.6, 1.25], [-1.2, 0.7, 0], [0.0, 0.7, 0]]) {
    g.add(place(hayBale({ r: 0.62 }), { x: sx + bx, y: y0 + by, z: sz + bz, ry: 90 }));
  }
  g.add(place(hayBale({ r: 0.62 }), { x: 3.9, y: y0, z: -4.2, ry: 30 }));

  // ------------------------------------------------------------ cowboys
  g.add(place(cowboy({ shirt: PALETTE.red, hat: '#b48a55' }), { x: -1.4, y: y0, z: 1.4, ry: 90 }));
  g.add(place(cowboy({ shirt: '#e8dcc0', hat: '#3b2a1e', jeans: '#2e3e5e' }), { x: hx + 0.2, y: y0, z: pz0 + pd + 1.1, ry: 10 }));
  g.add(place(cowboy({ shirt: PALETTE.green, hat: '#d9c49a', armsUp: true }), { x: -6.6, y: y0, z: 3.6, ry: -60 }));

  // ------------------------------------------------------------- greenery
  g.add(place(tree({ kind: 'round', h: 5, seed: 12 }), { x: 8.5, y: y0, z: -8.5 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 4 }), { x: -8.2, y: y0, z: 0.3 }));
  g.add(place(tree({ kind: 'cone', h: 5, seed: 9 }), { x: -8.6, y: y0, z: 8.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -2.0, y: y0, z: -1.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 6 }), { x: -3.2, y: y0, z: 8.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 8 }), { x: -0.3, y: y0, z: -9.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: -9.2, y: y0, z: -9.2 }));
  return g;
}

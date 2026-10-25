import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, place, group, gableRoof, chimney, door, beam,
  hedge, fence, tree, bench, surface, mat, textured, canvasTexture, water,
} from '../../src/lib/index.js';
import { board, paneWindow, hangingBasket, windowBox, parasolTable, barrel, keg, lantern } from './props.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Whitewashed coaching inn in the back-left corner, forecourt + swinging sign
// at the front, beer garden with parasols wrapping round the right-hand side.

const WHITE = '#f6f3ea';
const BEAM = '#2a221d';
const DOOR_GREEN = '#2f4a34';
const SIGN_GREEN = '#1f3a2a';
const GOLD = '#e8c45a';

const T = 0.16; // beam width

// --- textures ------------------------------------------------------------

function fasciaTexture() {
  return canvasTexture(512, 64, (ctx, W, H) => {
    ctx.fillStyle = BEAM;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = GOLD;
    ctx.font = 'bold 44px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('THE  RED  LION', W / 2, H / 2 + 3);
  }, { key: 'country-pub:fascia', repeat: false });
}

function pubSignTexture() {
  return canvasTexture(192, 256, (ctx, W, H) => {
    ctx.fillStyle = SIGN_GREEN;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 10;
    ctx.strokeRect(9, 9, W - 18, H - 18);
    // a red lion "rampant": chunky silhouette
    ctx.fillStyle = '#d0352b';
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.46, W * 0.24, H * 0.1, -0.5, 0, Math.PI * 2); // body
    ctx.fill();
    ctx.beginPath();
    ctx.arc(W * 0.66, H * 0.3, W * 0.12, 0, Math.PI * 2); // head + mane
    ctx.fill();
    ctx.fillRect(W * 0.3, H * 0.5, W * 0.08, H * 0.13); // legs
    ctx.fillRect(W * 0.46, H * 0.52, W * 0.08, H * 0.11);
    ctx.save();
    ctx.translate(W * 0.68, H * 0.42);
    ctx.rotate(-0.7);
    ctx.fillRect(0, -6, W * 0.16, 12); // raised paw
    ctx.restore();
    ctx.lineWidth = 7;
    ctx.strokeStyle = '#d0352b';
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.5);
    ctx.quadraticCurveTo(W * 0.12, H * 0.42, W * 0.22, H * 0.28); // tail
    ctx.stroke();
    ctx.fillStyle = GOLD;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px serif';
    ctx.fillText('THE', W / 2, H * 0.11 + 6);
    ctx.font = 'bold 38px serif';
    ctx.fillText('RED', W / 2, H * 0.73);
    ctx.fillText('LION', W / 2, H * 0.87);
  }, { key: 'country-pub:hanging-sign', repeat: false });
}

function chalkboardTexture() {
  return canvasTexture(96, 128, (ctx, W, H) => {
    ctx.fillStyle = '#26302a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText('REAL', W / 2, 30);
    ctx.fillText('ALES', W / 2, 54);
    ctx.fillStyle = '#f2cf3a';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('FOOD', W / 2, 84);
    ctx.fillText('SERVED', W / 2, 104);
  }, { key: 'country-pub:chalkboard', repeat: false });
}

// --- timber framing ----------------------------------------------------------

/**
 * Black-and-white framing on a wall plane facing +z, origin = bottom centre.
 * studs: x positions; braces: [x0, x1, rising?]; rails: y positions.
 */
function framing(width, h, { studs = [], braces = [], rails = [] }) {
  const m = mat(BEAM);
  const g = new THREE.Group();
  const hw = width / 2;
  for (const x of [-hw + T / 2, hw - T / 2, ...studs]) g.add(place(box(T, h - 0.12, 0.08, m), { x, z: 0.04 }));
  for (const y of [0, h - T - 0.12, ...rails]) g.add(place(box(width, T, 0.08, m), { y, z: 0.04 }));
  for (const [x0, x1, y0, y1] of braces) g.add(beam([x0, y0, 0.05], [x1, y1, 0.05], T * 0.9, m));
  return g;
}

/** Gable-end timbers: king post and collar on the triangle above the wall. */
function gableTimbers(width, h) {
  const m = mat(BEAM);
  const cy = h * 0.42;
  return group(
    place(box(T, h * 0.85, 0.08, m), { z: 0.04 }),
    place(box(width * (1 - cy / h) - 0.45, T, 0.08, m), { y: cy, z: 0.04 }),
    beam([-width * 0.22, h * 0.25, 0.05], [0, h * 0.62, 0.05], T * 0.8, m),
    beam([width * 0.22, h * 0.25, 0.05], [0, h * 0.62, 0.05], T * 0.8, m),
  );
}

// put a face-local object (facing +z) onto one side of a block centred (cx, cz)
function onFace(obj, side, { cx, cz, w, d, y = 0, off = 0 }) {
  switch (side) {
    case 'front': return place(obj, { x: cx, y, z: cz + d / 2 + off });
    case 'back': return place(obj, { x: cx, y, z: cz - d / 2 - off, ry: 180 });
    case 'right': return place(obj, { x: cx + w / 2 + off, y, z: cz, ry: 90 });
    default: return place(obj, { x: cx - w / 2 - off, y, z: cz, ry: -90 });
  }
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  const white = mat(WHITE);
  const tar = mat(PALETTE.black);
  const slate = surface('shingles', PALETTE.roofSlate, { size: 1.6 });
  const brick = surface('brick', PALETTE.brickDark, { size: 1 });

  // --- the inn ---------------------------------------------------------------
  const W = 6.4, cx = -1.5;
  const D = 4.2, cz = -1.8; // ground floor
  const J = 0.35; // jetty: upper storey overhangs the street side
  const DU = D + J, czU = cz + J / 2;
  const H1 = 3.0, H2 = 2.7, HT = H1 + H2, RH = 2.9;
  const G = { cx, cz, w: W, d: D };
  const U = { cx, cz: czU, w: W, d: DU };

  g.add(place(box(W, H1, D, white), { x: cx, y: y0, z: cz }));
  g.add(place(box(W + 0.08, 0.45, D + 0.08, tar), { x: cx, y: y0, z: cz })); // tarred plinth
  g.add(place(box(W, H2, DU, white), { x: cx, y: y0 + H1, z: czU }));
  // jetty bressumer + joist ends under the overhang
  g.add(place(box(W + 0.1, 0.22, DU + 0.1, mat(BEAM)), { x: cx, y: y0 + H1 - 0.05, z: czU }));
  for (let i = 0; i < 13; i++) g.add(place(box(0.12, 0.12, J, mat(BEAM)), { x: cx - W / 2 + 0.25 + i * 0.495, y: y0 + H1 - 0.15, z: cz + D / 2 + J / 2 }));

  g.add(place(gableRoof({ w: W, d: DU, h: RH, overhang: 0.35, ridge: 'x', material: slate, gableMaterial: white }), { x: cx, y: y0 + HT, z: czU }));
  // ridge tiles
  g.add(place(box(W + 0.75, 0.14, 0.24, mat(PALETTE.roofBlack)), { x: cx, y: y0 + HT + RH - 0.05, z: czU }));
  // brick chimneys on both gables, with pots
  for (const sx of [-1, 1]) {
    const x = cx + sx * (W / 2 - 0.5);
    g.add(place(chimney({ w: 0.9, d: 0.7, h: 2.0, material: brick }), { x, y: y0 + HT + RH - 0.9, z: czU }));
    for (const dx of [-0.2, 0.2]) g.add(place(cylinder(0.11, 0.13, 0.4, mat(PALETTE.terracotta), 8), { x: x + dx, y: y0 + HT + RH + 1.25, z: czU }));
  }

  // front dormers
  const S = DU / 2;
  for (const dx of [-1.55, 1.55]) {
    const zf = czU + 1.25;
    const yb = y0 + HT + RH * (1 - 1.25 / S) - 0.1;
    g.add(place(box(1.3, 1.05, 1.1, white), { x: cx + dx, y: yb, z: zf - 0.55 }));
    g.add(place(gableRoof({ w: 1.3, d: 1.1, h: 0.5, overhang: 0.12, ridge: 'z', material: slate, gableMaterial: white }), { x: cx + dx, y: yb + 1.05, z: zf - 0.55 }));
    g.add(place(paneWindow(0.75, 0.7, { cols: 2, rows: 2 }), { x: cx + dx, y: yb + 0.2, z: zf + 0.02 }));
  }

  // --- front face (+z)
  const front = new THREE.Group();
  // ground floor: door + two glowing bay windows
  front.add(door({ w: 1.0, h: 2.2, color: DOOR_GREEN, frame: BEAM }));
  front.add(place(paneWindow(0.9, 0.3, { warm: true, cols: 3, rows: 1 }), { y: 2.3 })); // fanlight
  for (const x of [-1.95, 1.95]) {
    front.add(place(box(1.85, 1.6, 0.06, mat(BEAM)), { x, y: 0.62, z: 0.03 }));
    front.add(place(paneWindow(1.65, 1.4, { warm: true, cols: 4, rows: 3 }), { x, y: 0.72, z: 0.07 }));
    front.add(place(box(1.95, 0.1, 0.25, mat(BEAM)), { x, y: 0.62, z: 0.12 }));
  }
  for (const x of [-0.85, 0.85]) front.add(place(lantern(), { x, y: 2.35 }));
  g.add(onFace(front, 'front', { ...G, y: y0 }));
  // porch hood over the door
  g.add(place(gableRoof({ w: 1.6, d: 0.9, h: 0.45, overhang: 0.08, ridge: 'z', material: slate, gableMaterial: white }), { x: cx, y: y0 + 2.55, z: cz + D / 2 + 0.45 }));
  for (const x of [-0.7, 0.7]) g.add(place(beam([0, 0, 0], [0, 0.45, 0.65], 0.1, mat(BEAM)), { x: cx + x, y: y0 + 2.1, z: cz + D / 2 }));
  // hanging baskets along the front
  [-2.95, 2.95].forEach((x, i) => g.add(place(hangingBasket(10 + i), { x: cx + x, y: y0 + 2.75, z: cz + D / 2 })));

  // upper floor: framing, three windows with window boxes, name board on the bressumer
  const uf = new THREE.Group();
  const winX = [-2.1, 0, 2.1];
  uf.add(framing(W, H2, {
    studs: [-2.75, -1.45, -0.65, 0.65, 1.45, 2.75],
    rails: [0.62, 1.88],
    braces: [[-1.45, -0.65, 0.62, 1.88], [0.65, 1.45, 1.88, 0.62], [-3.2, -2.75, 1.88, 2.54], [3.2, 2.75, 1.88, 2.54]],
  }));
  winX.forEach((x, i) => {
    uf.add(place(paneWindow(1.0, 1.1, { cols: 3, rows: 3 }), { x, y: 0.72 }));
    uf.add(place(windowBox(1.15, 20 + i), { x, y: 0.5, z: 0.08 }));
  });
  g.add(onFace(uf, 'front', { ...U, y: y0 + H1 }));
  g.add(place(board(5.2, 0.5, 0.1, textured(fasciaTexture(), { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: fasciaTexture() }), BEAM), { x: cx, y: y0 + H1 - 0.02, z: cz + DU / 2 + J / 2 + 0.12 }));

  // --- right face (garden side, +x)
  const rg = new THREE.Group();
  rg.add(place(paneWindow(1.3, 1.3, { warm: true, cols: 3, rows: 3 }), { x: -0.9, y: 0.8 }));
  rg.add(place(door({ w: 0.95, h: 2.15, color: DOOR_GREEN, frame: BEAM }), { x: 1.15 }));
  rg.add(place(lantern(), { x: 0.4, y: 2.3 }));
  g.add(onFace(rg, 'right', { ...G, y: y0 }));
  g.add(place(hangingBasket(31), { x: cx + W / 2, y: y0 + 2.75, z: cz + 0.4, ry: 90 }));
  const ru = new THREE.Group();
  ru.add(framing(DU, H2, { studs: [-0.5, 0.5, -1.45, 1.45], rails: [0.62, 1.88], braces: [[-2.2, -1.45, 0.62, 1.88], [2.2, 1.45, 0.62, 1.88]] }));
  ru.add(place(paneWindow(0.85, 1.1, { cols: 2, rows: 3 }), { y: 0.72 }));
  ru.add(place(windowBox(1.0, 41), { y: 0.5, z: 0.08 }));
  g.add(onFace(ru, 'right', { ...U, y: y0 + H1 }));
  g.add(onFace(gableTimbers(DU, RH), 'right', { ...U, y: y0 + HT }));

  // --- left face (-x)
  const lg = new THREE.Group();
  lg.add(place(paneWindow(1.3, 1.3, { warm: true, cols: 3, rows: 3 }), { x: 0.4, y: 0.8 }));
  g.add(onFace(lg, 'left', { ...G, y: y0 }));
  const lu = new THREE.Group();
  lu.add(framing(DU, H2, { studs: [-0.5, 0.5, -1.45, 1.45], rails: [0.62, 1.88], braces: [[-2.2, -1.45, 0.62, 1.88], [2.2, 1.45, 0.62, 1.88]] }));
  lu.add(place(paneWindow(0.85, 1.1, { cols: 2, rows: 3 }), { y: 0.72 }));
  g.add(onFace(lu, 'left', { ...U, y: y0 + H1 }));
  g.add(onFace(gableTimbers(DU, RH), 'left', { ...U, y: y0 + HT }));

  // --- back face (-z)
  const bg = new THREE.Group();
  bg.add(place(door({ w: 0.95, h: 2.1, color: PALETTE.woodDark, frame: BEAM }), { x: -1.8 }));
  bg.add(place(paneWindow(1.0, 1.0, { warm: true, cols: 2, rows: 2 }), { x: 0.6, y: 1.1 }));
  bg.add(place(paneWindow(1.0, 1.0, { cols: 2, rows: 2 }), { x: 2.3, y: 1.1 }));
  g.add(onFace(bg, 'back', { ...G, y: y0 }));
  const bu = new THREE.Group();
  bu.add(framing(W, H2, { studs: [-2.75, -1.45, -0.65, 0.65, 1.45, 2.75], rails: [0.62, 1.88], braces: [[-1.45, -0.65, 0.62, 1.88], [0.65, 1.45, 1.88, 0.62]] }));
  for (const x of [-2.1, 2.1]) bu.add(place(paneWindow(1.0, 1.1, { cols: 3, rows: 3 }), { x, y: 0.72 }));
  g.add(onFace(bu, 'back', { ...U, y: y0 + H1 }));
  // back door hood, wheelie bins and bottle crates in the narrow back yard
  const zb = cz - D / 2;
  g.add(place(gableRoof({ w: 1.4, d: 0.7, h: 0.4, overhang: 0.06, ridge: 'z', material: slate, gableMaterial: white }), { x: cx + 1.8, y: y0 + 2.4, z: zb - 0.35 }));
  for (const [x, c] of [[-3.3, PALETTE.green], [-2.6, PALETTE.darkGrey]]) {
    g.add(place(box(0.6, 0.95, 0.5, mat(c)), { x, y: y0, z: zb - 0.32 }));
    g.add(place(box(0.64, 0.06, 0.56, mat(c)), { x, y: y0 + 0.95, z: zb - 0.32 }));
  }
  for (const [x, y] of [[0.95, 0], [1.45, 0], [1.2, 0.3]]) g.add(place(box(0.45, 0.3, 0.35, mat(PALETTE.red)), { x, y: y0 + y, z: zb - 0.3 }));

  // --- grounds -----------------------------------------------------------------
  const yz = cz + D / 2; // front wall z
  // cobbled forecourt and gravel path to the street
  g.add(place(patch(W + 0.2, 1.9, 'cobbles'), { x: cx, y: y0, z: yz + 0.95 }));
  g.add(place(patch(1.4, TILE / 2 - yz - 1.9, 'gravel'), { x: cx, y: y0, z: (yz + 1.9 + TILE / 2) / 2 }));
  // beer-garden flagstone patio along the side
  g.add(place(patch(2.9, 5.6, surface('paving', PALETTE.paving, { size: 1.5 })), { x: 3.3, y: y0, z: -2.0 }));

  // forecourt: bench, barrel tables, A-board, horse trough
  g.add(place(bench({ w: 1.6 }), { x: cx - 2.1, y: y0 + 0.05, z: yz + 0.75 }));
  g.add(place(barrel(), { x: cx + 2.4, y: y0 + 0.05, z: yz + 0.95 }));
  g.add(place(barrel(0.26, 0.6), { x: cx + 1.75, y: y0 + 0.05, z: yz + 1.25 }));
  g.add(place(barrel(0.26, 0.6), { x: cx + 3.05, y: y0 + 0.05, z: yz + 1.25 }));
  const cb = textured(chalkboardTexture());
  g.add(place(board(0.6, 0.9, 0.05, cb, PALETTE.woodDark), { x: cx + 1.0, y: y0 + 0.05, z: yz + 2.3, rx: -12 }));
  g.add(place(board(0.6, 0.9, 0.05, cb, PALETTE.woodDark), { x: cx + 1.0, y: y0 + 0.05, z: yz + 2.05, rx: 12, ry: 180 }));
  g.add(place(box(1.5, 0.55, 0.6, mat(PALETTE.stone)), { x: -3.9, y: y0, z: 2.75 }));
  g.add(place(box(1.3, 0.04, 0.45, water()), { x: -3.9, y: y0 + 0.5, z: 2.75 }));

  // swinging pub sign on a post by the road, board faces up and down the street (±x)
  const post = mat(BEAM);
  const sx = -3.7, sz = 4.5;
  g.add(place(box(0.5, 0.35, 0.5, mat(PALETTE.stone)), { x: sx, y: y0, z: sz }));
  g.add(place(box(0.2, 4.4, 0.2, post), { x: sx, y: y0, z: sz }));
  g.add(place(box(0.14, 0.14, 1.75, post), { x: sx, y: y0 + 4.05, z: sz - 0.8 }));
  g.add(beam([sx, y0 + 3.35, sz], [sx, y0 + 4.05, sz - 0.75], 0.1, post));
  g.add(place(box(0.22, 0.22, 0.22, post), { x: sx, y: y0 + 4.4, z: sz }));
  const signZ = sz - 0.95;
  for (const dz of [-0.45, 0.45]) g.add(place(box(0.03, 0.25, 0.03, mat(PALETTE.darkGrey)), { x: sx, y: y0 + 3.8, z: signZ + dz }));
  const signTex = pubSignTexture();
  g.add(place(board(1.25, 1.65, 0.1, textured(signTex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: signTex }), BEAM, true), { x: sx, y: y0 + 2.15, z: signZ, ry: 90 }));

  // beer garden tables with parasols
  const tables = [
    [3.35, -3.4, PALETTE.green, WHITE],
    [3.35, -0.55, PALETTE.red, WHITE],
    [3.3, 2.45, PALETTE.green, WHITE],
    [0.45, 3.45, PALETTE.red, WHITE],
  ];
  for (const [x, z, c1, c2] of tables) g.add(place(parasolTable({ color: c1, color2: c2 }), { x, y: y0 + 0.05, z }));

  // kegs + bins by the back door
  for (const [x, z] of [[2.0, -3.85], [2.0, -4.35], [2.45, -4.2]]) g.add(place(keg(), { x, y: y0, z }));
  

  // boundary: hedges on the garden sides, picket fence along the road
  g.add(place(hedge({ w: 0.5, h: 1.1, d: TILE - 0.2 }), { x: TILE / 2 - 0.3, y: y0 }));
  g.add(place(hedge({ w: TILE - 0.6, h: 1.0, d: 0.45 }), { x: -0.3, y: y0, z: -TILE / 2 + 0.25 }));
  g.add(place(fence({ w: 2.0, d: 0.1, h: 0.8, style: 'picket', color: WHITE, sides: ['front'] }), { x: -3.85, y: y0, z: TILE / 2 - 0.25 }));
  g.add(place(fence({ w: 5.6, d: 0.1, h: 0.8, style: 'picket', color: WHITE, sides: ['front'] }), { x: 1.75, y: y0, z: TILE / 2 - 0.25 }));
  // a few shrubs and a flower bed
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 5 }), { x: -4.3, y: y0, z: 4.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 6 }), { x: 4.2, y: y0, z: 4.3 }));
  return g;
}

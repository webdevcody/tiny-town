import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, group, mat, metal, glass, surface, textured, canvasTexture, signTexture, shade,
  ShapeBuilder, beam, cylinder, tank, tree, streetLamp, hedge,
} from '../../src/lib/index.js';
import { track, steamLoco, tender, coalWagon, steamPuffs, RAIL_TOP } from './rail.js';

// 2x2 tiles (20 x 20 m). Front faces +z.
// A semi-circular brick engine shed of seven stalls wraps round the back of a
// turntable; the lead track enters from the street side. A coaling tower on a
// siding sits to the right, a water tower to the left.

const D2R = Math.PI / 180;
const ZC = 2.0;            // turntable centre (x = 0)
const RT = 4.3;            // turntable pit radius
const RI = 6.0;            // shed inner (door) radius
const RO = 10.2;           // shed outer wall radius
const A0 = 15, A1 = 165;   // shed arc, degrees (0 = +x, 90 = -z / back)
const N = 7;               // stalls
const H = 4.2;             // wall height
const RM = 8.1;            // roof ridge radius
const HR = 1.5;            // ridge height above the walls
const DOOR_H = 3.3;

// point at radius r, angle a (degrees) around the turntable centre
const P = (r, a, y = 0) => [r * Math.cos(a * D2R), y, ZC - r * Math.sin(a * D2R)];

// add a face to a ShapeBuilder, flipped if needed so its normal points along `hint`
function face(b, pts, hint, grp = 0) {
  const v = pts.map((p) => new THREE.Vector3(...p));
  const n = new THREE.Vector3().subVectors(v[1], v[0]).cross(new THREE.Vector3().subVectors(v[v.length - 1], v[0]));
  if (n.dot(new THREE.Vector3(...hint)) < 0) pts = [pts[1], pts[0], ...pts.slice(2).reverse()];
  b.poly(pts, grp);
}

// box with 0..1 UVs on every face (for canvas textures that must not tile)
function uvBox(w, h, d, mats) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mats);
}

// brick wall bay with two tall arched multi-pane windows
function windowWallTexture() {
  return canvasTexture(256, 256, (ctx, W, Hh) => {
    ctx.fillStyle = PALETTE.brick;
    ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = shade(PALETTE.brick, -0.18);
    for (let y = 0; y < Hh; y += 8) {
      ctx.fillRect(0, y, W, 1);
      for (let x = ((y / 8) % 2) * 9; x < W; x += 18) ctx.fillRect(x, y, 1, 8);
    }
    // plinth and cornice
    ctx.fillStyle = PALETTE.brickDark;
    ctx.fillRect(0, Hh - 26, W, 26);
    ctx.fillStyle = PALETTE.stone;
    ctx.fillRect(0, 0, W, 14);
    ctx.fillRect(0, Hh - 30, W, 5);
    for (const cx of [W * 0.29, W * 0.71]) {
      const ww = W * 0.24, top = Hh * 0.2, bot = Hh * 0.78, r = ww / 2;
      // stone surround
      ctx.fillStyle = PALETTE.cream;
      ctx.beginPath();
      ctx.moveTo(cx - r - 6, bot + 6);
      ctx.lineTo(cx - r - 6, top + r);
      ctx.arc(cx, top + r, r + 6, Math.PI, 0);
      ctx.lineTo(cx + r + 6, bot + 6);
      ctx.fill();
      // glass
      ctx.fillStyle = '#3b5470';
      ctx.beginPath();
      ctx.moveTo(cx - r, bot);
      ctx.lineTo(cx - r, top + r);
      ctx.arc(cx, top + r, r, Math.PI, 0);
      ctx.lineTo(cx + r, bot);
      ctx.fill();
      // glazing bars
      ctx.fillStyle = PALETTE.frame;
      for (let i = 1; i < 3; i++) ctx.fillRect(cx - r + (ww * i) / 3 - 1, top + 6, 3, bot - top - 6);
      for (let y = top + r; y < bot; y += 16) ctx.fillRect(cx - r, y, ww, 2);
      // keystone
      ctx.fillStyle = PALETTE.stone;
      ctx.fillRect(cx - 5, top - 8, 10, 12);
    }
  }, { key: 'railway-roundhouse:window-wall', repeat: false });
}

// one brick wall facing out from the shed, chord between two boundary angles
function outerWall(a0, a1, wallMats) {
  const half = (a1 - a0) / 2;
  const am = (a0 + a1) / 2;
  const L = 2 * RO * Math.sin(half * D2R);
  const w = uvBox(L, H, 0.4, wallMats);
  const [x, , z] = P(RO * Math.cos(half * D2R) - 0.2, am);
  return place(w, { x, y: LOT_HEIGHT, z, ry: am - 90 });
}

function shed() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  const brickDark = surface('brick', PALETTE.brickDark, { size: 1.2 });
  const interior = mat('#3a302a', { roughness: 1 });
  const wallTex = textured(windowWallTexture());
  const step = (A1 - A0) / N;

  // floor inside the shed (dark, oily concrete)
  const fb = new ShapeBuilder();
  for (let i = 0; i < N; i++) {
    const a0 = A0 + i * step, a1 = a0 + step;
    face(fb, [P(RI - 0.2, a0, y0 + 0.02), P(RI - 0.2, a1, y0 + 0.02), P(RO - 0.2, a1, y0 + 0.02), P(RO - 0.2, a0, y0 + 0.02)], [0, 1, 0]);
  }
  g.add(new THREE.Mesh(fb.build(), mat('#4d4842', { roughness: 1 })));

  // outer walls with windows (outside face = -z of each box), interior face dark
  for (let i = 0; i < N; i++) {
    const a0 = A0 + i * step;
    g.add(outerWall(a0, a0 + step, [brick, brick, brickDark, brick, interior, wallTex]));
  }
  // buttresses on the outside and door piers on the inside at every boundary
  for (let i = 0; i <= N; i++) {
    const a = A0 + i * step;
    const [ox, , oz] = P(RO + 0.05, a);
    g.add(place(box(0.55, H + 0.15, 0.6, brickDark), { x: ox, y: y0, z: oz, ry: a - 90 }));
    const [ix, , iz] = P(RI, a);
    g.add(place(box(0.6, H, 0.6, brick), { x: ix, y: y0, z: iz, ry: a - 90 }));
    g.add(place(box(0.72, 0.25, 0.72, mat(PALETTE.stone)), { x: ix, y: y0 + DOOR_H - 0.25, z: iz, ry: a - 90 }));
  }
  // end walls (radial), windows on both faces
  for (const a of [A0, A1]) {
    const [x, , z] = P((RI + RO) / 2, a);
    g.add(place(uvBox(RO - RI, H, 0.45, [brick, brick, brickDark, brick, wallTex, wallTex]), { x, y: y0, z, ry: a }));
  }

  // roof: two slopes per stall, ridge at RM; inner eave overhangs the doors
  const ri = RI - 0.55, ro = RO + 0.3;
  const yi = y0 + H - (0.55 * HR) / (RM - RI);
  const yo = y0 + H - (0.3 * HR) / (RO - RM);
  const yr = y0 + H + HR;
  const rb = new ShapeBuilder();
  for (let i = 0; i < N; i++) {
    const a0 = A0 + i * step, a1 = a0 + step, am = a0 + step / 2;
    const out = P(1, am); out[2] -= ZC;
    const inHint = [-out[0], 1, -out[2]];
    const outHint = [out[0], 1, out[2]];
    face(rb, [P(ri, a0, yi), P(ri, a1, yi), P(RM, a1, yr), P(RM, a0, yr)], inHint, 0);
    face(rb, [P(ro, a1, yo), P(ro, a0, yo), P(RM, a0, yr), P(RM, a1, yr)], outHint, 0);
    // soffits under the overhangs
    face(rb, [P(ri, a0, yi), P(ri, a1, yi), P(RI, a1, y0 + H), P(RI, a0, y0 + H)], [0, -1, 0], 2);
    face(rb, [P(ro, a0, yo), P(ro, a1, yo), P(RO, a1, y0 + H), P(RO, a0, y0 + H)], [0, -1, 0], 2);
    // fascia board along the inner eave
    face(rb, [P(ri, a0, yi - 0.25), P(ri, a1, yi - 0.25), P(ri, a1, yi), P(ri, a0, yi)], inHint.map((v, k) => (k === 1 ? 0 : v)), 3);
  }
  // gable ends
  for (const [a, s] of [[A0, 1], [A1, -1]]) {
    const t = [s * Math.sin(a * D2R), 0, s * Math.cos(a * D2R)];
    face(rb, [P(ri, a, yi), P(RM, a, yr), P(ro, a, yo)], t, 1);
  }
  const roofM = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
  g.add(new THREE.Mesh(rb.build(), [roofM, brick, mat(shade(PALETTE.roofSlate, -0.3)), mat(PALETTE.cream)]));

  // skylights on the inner slope, smoke jacks above every stall, brick fire walls between stalls
  const glassM = glass(PALETTE.glassSky);
  const jackM = mat(PALETTE.darkGrey, { roughness: 0.7 });
  const slope = (r) => y0 + H + ((r - RI) * HR) / (RM - RI);
  for (let i = 0; i < N; i++) {
    const am = A0 + (i + 0.5) * step;
    const sb = new ShapeBuilder();
    const s0 = am - step * 0.32, s1 = am + step * 0.32;
    const out = P(1, am); out[2] -= ZC;
    face(sb, [P(6.7, s0, slope(6.7) + 0.06), P(6.7, s1, slope(6.7) + 0.06), P(7.7, s1, slope(7.7) + 0.06), P(7.7, s0, slope(7.7) + 0.06)], [-out[0], 1, -out[2]]);
    g.add(new THREE.Mesh(sb.build(), glassM));
    const [jx, , jz] = P(8.9, am);
    const jy = y0 + H + ((RO - 8.9) * HR) / (RO - RM) - 0.1;
    g.add(place(box(0.55, 1.2, 0.55, jackM), { x: jx, y: jy, z: jz, ry: am - 90 }));
    g.add(place(box(0.95, 0.12, 0.95, jackM), { x: jx, y: jy + 1.2, z: jz, ry: am - 90 }));
    g.add(place(box(0.7, 0.3, 0.7, jackM), { x: jx, y: jy + 1.32, z: jz, ry: am - 90 }));
  }
  for (let i = 1; i < N; i++) {
    const a = A0 + i * step;
    g.add(beam(P(RI - 0.15, a, y0 + H + 0.1), P(RM, a, yr + 0.2), 0.32, brickDark));
    g.add(beam(P(RM, a, yr + 0.2), P(RO + 0.15, a, y0 + H + 0.1), 0.32, brickDark));
  }
  return g;
}

// per-stall door, lintel, track and (maybe) a locomotive; local +z faces the turntable
function stall(i, kind, loco) {
  const step = (A1 - A0) / N;
  const a0 = A0 + i * step, am = a0 + step / 2;
  const half = step / 2;
  const chord = 2 * RI * Math.sin(half * D2R);
  const rIn = RI * Math.cos(half * D2R);
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  // lintel with stone keystone band
  g.add(place(box(chord, H - DOOR_H, 0.5, brick), { y: y0 + DOOR_H, z: 0 }));
  g.add(place(box(chord, 0.18, 0.56, mat(PALETTE.stone)), { y: y0 + DOOR_H, z: 0 }));
  g.add(place(box(0.4, 0.5, 0.58, mat(PALETTE.cream)), { y: y0 + DOOR_H, z: 0 }));
  // stall number plate
  g.add(place(uvBox(0.5, 0.4, 0.05, [mat(PALETTE.navy), mat(PALETTE.navy), mat(PALETTE.navy), mat(PALETTE.navy),
    textured(signTexture(String(i + 1), { bg: PALETTE.navy, fg: '#ffffff', width: 64, height: 52 })), mat(PALETTE.navy)]), { y: y0 + DOOR_H + 0.3, z: 0.29 }));

  const open = chord - 0.6;
  const doorM = surface('planks', PALETTE.roofGreen, { size: 1 });
  if (kind === 'closed') {
    g.add(place(box(open, DOOR_H - 0.05, 0.12, doorM), { y: y0, z: 0.1 }));
    g.add(place(box(0.05, DOOR_H - 0.3, 0.14, mat(PALETTE.darkGrey)), { y: y0 + 0.1, z: 0.1 }));
    for (const s of [-1, 1]) g.add(place(box(open / 2 - 0.2, 0.1, 0.14, mat(PALETTE.cream)), { x: (s * open) / 4, y: y0 + DOOR_H * 0.5, z: 0.12, ry: s * 32 }));
  } else {
    for (const s of [-1, 1]) g.add(place(box(0.1, DOOR_H - 0.05, open / 2, doorM), { x: s * (open / 2 + 0.05), y: y0, z: 0.3 + open / 4 }));
  }
  // track from the pit edge into the shed
  const tStart = rIn - RT - 0.05;
  g.add(place(track(tStart + 3.7), { y: y0, z: tStart, ry: 90 }));
  if (loco) g.add(place(loco, { y: y0, z: loco.userData.z ?? -1.4, ry: -90 }));
  const [x, , z] = P(rIn, am);
  return place(g, { x, z, ry: am - 90 });
}

function turntable(bridgeAngle) {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  // pit with stone coping and a sunken floor
  const lathe = new THREE.LatheGeometry([
    new THREE.Vector2(RT + 0.4, 0), new THREE.Vector2(RT + 0.4, 0.22), new THREE.Vector2(RT, 0.22), new THREE.Vector2(RT, 0),
  ].reverse(), 48);
  g.add(new THREE.Mesh(lathe, mat(PALETTE.stone, { side: THREE.DoubleSide })));
  g.add(place(cylinder(RT, RT, 0.02, surface('gravel', PALETTE.mud, { size: 2 }), 48), { y: 0 }));
  const ring = new THREE.TorusGeometry(RT - 0.3, 0.07, 4, 48).rotateX(Math.PI / 2);
  g.add(place(new THREE.Mesh(ring, metal(PALETTE.steelLight)), { y: 0.06 }));
  g.add(cylinder(0.6, 0.7, 0.3, mat(PALETTE.concreteDark), 12));

  // the rotating bridge: two girders, deck track, operator's cabin
  const b = new THREE.Group();
  const L = 2 * RT - 0.15;
  const girder = mat(PALETTE.steelDark, { roughness: 0.6, metalness: 0.3 });
  for (const s of [-1, 1]) {
    b.add(place(box(L, 0.25, 0.25, girder), { y: 0.05, z: s * 1.1 }));
    b.add(place(box(L - 1.4, 0.5, 0.2, girder), { y: 0.3, z: s * 1.1 }));
    b.add(place(box(L, 0.08, 0.08, mat(PALETTE.yellow)), { y: 0.95, z: s * 1.25 }));
    for (let k = -3; k <= 3; k++) b.add(place(box(0.06, 0.9, 0.06, mat(PALETTE.yellow)), { x: k * 1.25, y: 0.05, z: s * 1.25 }));
  }
  b.add(place(box(L, 0.1, 2.3, surface('planks', PALETTE.woodDark, { size: 1 })), { y: 0.02 }));
  b.add(place(track(L, { ballast: false }), { x: -L / 2, y: RAIL_TOP - 0.2 }));
  const cab = new THREE.Group();
  cab.add(box(1.0, 1.7, 1.0, mat(PALETTE.cream)));
  cab.add(place(box(1.2, 0.12, 1.2, mat(PALETTE.roofRed)), { y: 1.7 }));
  for (const [x, z] of [[0.51, 0], [0, 0.51], [0, -0.51]]) cab.add(place(box(x ? 0.04 : 0.6, 0.5, z ? 0.04 : 0.6, mat(PALETTE.window)), { x, y: 0.9, z }));
  b.add(place(cab, { x: -RT + 1.0, y: 0.1, z: 1.95 }));
  // locomotive + tender on the bridge, heading for its stall
  const lc = { color: PALETTE.black, lining: PALETTE.red, wheel: PALETTE.red };
  b.add(place(steamLoco({ ...lc, tankEngine: false }), { x: 1.75 }));
  b.add(place(tender(lc), { x: -1.95 }));
  b.add(place(steamPuffs(), { x: 1.75 + 2.2 - 0.4, y: RAIL_TOP + 2.65 }));
  g.add(place(b, { ry: bridgeAngle }));
  return place(g, { y: y0, z: ZC });
}

// concrete coaling tower straddling a siding
function coalingTower() {
  const g = new THREE.Group();
  const conc = surface('concrete', PALETTE.concrete, { size: 3 });
  const concD = mat(PALETTE.concreteDark);
  const w = 3.4, d = 2.8, legH = 3.6, binH = 3.4;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.5, legH, 0.5, conc), { x: sx * (w / 2 - 0.25), z: sz * (d / 2 - 0.25) }));
  g.add(place(box(w + 0.3, 0.4, d + 0.3, concD), { y: legH }));
  g.add(place(box(w, binH, d, conc), { y: legH + 0.4 }));
  for (let k = 1; k < 4; k++) g.add(place(box(w + 0.06, 0.1, d + 0.06, concD), { y: legH + 0.4 + k * (binH / 4) }));
  g.add(place(box(w + 0.5, 0.25, d + 0.5, concD), { y: legH + 0.4 + binH }));
  // headhouse for the bucket elevator
  g.add(place(box(1.6, 1.3, 1.8, mat(PALETTE.roofGrey)), { x: 0.6, y: legH + 0.65 + binH, z: -0.4 }));
  g.add(place(box(1.8, 0.15, 2.0, mat(PALETTE.roofBlack)), { x: 0.6, y: legH + 1.95 + binH, z: -0.4 }));
  // chutes over the track
  const chuteM = metal(PALETTE.rust);
  for (const z of [-0.6, 0.6]) g.add(beam([-0.3, legH + 0.1, z], [-1.2, legH - 1.1, z], 0.35, chuteM));
  // elevator shaft + coal hopper pit beside the track
  g.add(place(box(0.9, legH + binH + 0.8, 0.9, mat(PALETTE.roofGrey)), { x: 0.6, z: -d / 2 - 0.35 }));
  // sign
  const tex = signTexture('COAL', { bg: PALETTE.black, fg: PALETTE.yellow, width: 256, height: 96 });
  g.add(place(uvBox(2.4, 0.9, 0.08, [concD, concD, concD, concD, textured(tex), concD]), { y: legH + binH - 1.3, z: d / 2 }));
  return g;
}

function waterTower() {
  const g = new THREE.Group();
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  g.add(box(3.0, 3.6, 3.0, brick));
  g.add(place(box(3.3, 0.25, 3.3, mat(PALETTE.stone)), { y: 3.6 }));
  g.add(place(box(1.0, 2.0, 0.1, surface('planks', PALETTE.roofGreen, { size: 1 })), { y: 0, z: 1.5 }));
  for (const x of [-1.51, 1.51]) g.add(place(box(0.06, 1.2, 0.8, mat(PALETTE.window)), { x, y: 1.6 }));
  const tankM = metal(PALETTE.roofGreen, { roughness: 0.55 });
  g.add(place(tank({ radius: 1.55, h: 2.2, roof: 'cone', material: tankM }), { y: 3.85 }));
  for (let k = 0; k < 3; k++) g.add(place(cylinder(1.57, 1.57, 0.08, mat(PALETTE.steelDark), 20), { y: 4.2 + k * 0.7 }));
  // gauge board
  g.add(place(box(0.3, 1.6, 0.06, mat(PALETTE.white)), { x: 0.6, y: 4.1, z: 1.56 }));
  return g;
}

// water crane: column with a swinging arm and leather hose
function waterCrane() {
  const m = mat(PALETTE.black, { roughness: 0.5 });
  return group(
    cylinder(0.35, 0.45, 0.4, mat(PALETTE.stoneDark), 10),
    cylinder(0.16, 0.2, 3.4, m, 8),
    place(cylinder(0.28, 0.28, 0.5, m, 10), { y: 3.1 }),
    place(box(1.8, 0.22, 0.22, m), { x: 0.85, y: 3.25 }),
    place(cylinder(0.12, 0.1, 1.3, mat(PALETTE.woodDark), 8), { x: 1.65, y: 2.0 }),
  );
}

function sleeperStack() {
  const g = new THREE.Group();
  const m = mat(PALETTE.woodDark);
  for (let l = 0; l < 4; l++) for (let k = 0; k < 4; k++) {
    g.add(place(box(l % 2 ? 2.4 : 0.24, 0.2, l % 2 ? 0.24 : 2.4, m), { x: l % 2 ? 0 : -0.9 + k * 0.6, z: l % 2 ? -0.9 + k * 0.6 : 0, y: l * 0.2 }));
  }
  return g;
}

function drums(n, seed) {
  const g = new THREE.Group();
  const cols = [PALETTE.blue, PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.steelDark];
  for (let i = 0; i < n; i++) g.add(place(cylinder(0.3, 0.3, 0.9, mat(cols[(i + seed) % cols.length]), 10), { x: (i % 3) * 0.65, z: Math.floor(i / 3) * 0.65 }));
  return g;
}

function bufferStop() {
  const red = mat(PALETTE.red);
  return group(
    place(box(0.5, 0.9, 1.8, mat(PALETTE.woodDark)), { y: 0 }),
    place(box(0.3, 0.35, 1.9, red), { x: 0.3, y: 0.55 }),
    place(box(0.25, 0.25, 0.25, mat(PALETTE.white)), { x: 0.3, y: 0.95 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'gravel'));

  // grass in the back corners, cinder yard in front
  g.add(place(patch(5.2, 5.0, 'grass'), { x: -7.4, y: y0, z: -7.5 }));
  g.add(place(patch(5.2, 5.0, 'grass'), { x: 7.4, y: y0, z: -7.5 }));

  g.add(shed());

  // stalls: index -> door state and occupant
  const liveries = [
    { color: PALETTE.green, lining: PALETTE.yellow, wheel: PALETTE.green },
    { color: PALETTE.brickDark, lining: PALETTE.yellow, wheel: PALETTE.brickDark },
    { color: PALETTE.navy, lining: PALETTE.white, wheel: PALETTE.red },
    { color: PALETTE.black, lining: PALETTE.red, wheel: PALETTE.red },
  ];
  const plan = [
    ['open', liveries[1], -1.1],
    ['closed', null],
    ['open', liveries[0], -0.8],
    ['open', liveries[3], -1.1],
    ['open', null],
    ['open', liveries[2], -0.9],
    ['closed', null],
  ];
  plan.forEach(([kind, livery, z], i) => {
    let loco = null;
    if (livery) {
      loco = steamLoco({ ...livery, tankEngine: true });
      loco.userData.z = z;
    }
    g.add(stall(i, kind, loco));
  });

  // turntable, bridge lined up with the empty stall 5
  const step = (A1 - A0) / N;
  g.add(turntable(A0 + 4.5 * step));

  // lead track to the street
  g.add(place(track(10 - (ZC + RT) + 0.05), { y: y0, z: ZC + RT - 0.05, ry: -90 }));

  // coaling siding + tower + coal wagon on the right
  g.add(place(track(8.6), { x: 7.5, y: y0, z: 10, ry: 90 }));
  g.add(place(bufferStop(), { x: 7.5, y: y0 + 0.12, z: 1.6, ry: 90 }));
  g.add(place(coalingTower(), { x: 7.9, y: y0, z: 4.0 }));
  g.add(place(coalWagon({ color: PALETTE.brickBrown }), { x: 7.5, y: y0, z: 7.8, ry: 90 }));
  // coal heap beside the tower
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.9, 0.55, 7).translate(0, 0.275, 0), mat('#2a2a2d', { roughness: 1 })), { x: 5.0, y: y0, z: 6.4 }));

  // water tower + water crane on the left
  g.add(place(waterTower(), { x: -7.6, y: y0, z: 4.2 }));
  g.add(place(waterCrane(), { x: -1.75, y: y0, z: 8.6, ry: 0 }));
  g.add(place(sleeperStack(), { x: -7.6, y: y0, z: 8.6 }));
  g.add(place(drums(5, 1), { x: 2.0, y: y0, z: 8.5 }));
  g.add(place(drums(3, 3), { x: -4.4, y: y0, z: 8.9 }));

  // big sign on the ridge of the middle stall, facing the street
  const signTex = signTexture('ROUNDHOUSE', { bg: PALETTE.navy, fg: '#ffffff', width: 512, height: 96, border: PALETTE.yellow });
  const sm = mat(PALETTE.navy);
  const [sx, , sz] = P(RM - 0.6, 90);
  const sy = y0 + H + HR - 0.4;
  g.add(place(box(0.15, 1.0, 0.15, metal(PALETTE.steelDark)), { x: sx - 1.6, y: sy, z: sz }));
  g.add(place(box(0.15, 1.0, 0.15, metal(PALETTE.steelDark)), { x: sx + 1.6, y: sy, z: sz }));
  g.add(place(uvBox(4.6, 0.95, 0.12, [sm, sm, sm, sm, textured(signTex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: signTex }), sm]), { x: sx, y: sy + 1.0, z: sz }));

  // lamps round the turntable
  g.add(place(streetLamp({ h: 4.5 }), { x: -5.4, y: y0, z: 7.0, ry: 30 }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 4.8, y: y0, z: 7.0, ry: 150 }));

  // trees and hedges in the back corners
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 12 }), { x: -7.9, y: y0, z: -7.9 }));
  g.add(place(tree({ kind: 'cone', h: 6, seed: 13 }), { x: -5.6, y: y0, z: -8.4 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 14 }), { x: 7.9, y: y0, z: -7.9 }));
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 15 }), { x: 9.0, y: y0, z: -4.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 16 }), { x: -9.0, y: y0, z: -5.8 }));
  g.add(place(hedge({ w: 4.0, h: 0.9, d: 0.6 }), { x: 6.2, y: y0, z: -9.6 }));
  return g;
}

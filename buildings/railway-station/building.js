import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, hipRoof, pyramidRoof, gableRoof, barrelRoof, box, place, group,
  mat, metal, emissive, surface, textured, canvasTexture, sign, door, columns, truss, stairs,
  tree, car, streetLamp, bench, fence, flag, beam,
} from '../../src/lib/index.js';

// 3x1 tiles (30 x 10 m). Front (street, station building) faces +z; the
// platforms and two tracks run along X behind it.
//
//   z  5.0 .. 4.4   forecourt pavement
//   z  4.4 .. 1.2   station building, taxi rank (left), footbridge stairs (right)
//   z  1.2 .. -0.5  platform 1 (raised) under the long canopy
//   z -0.5 .. -2.1  track 1
//   z -2.1 .. -3.7  track 2 (train waiting)
//   z -3.7 .. -5.0  platform 2 with shelter canopy

const HALF_W = (3 * TILE) / 2;
const PLAT_H = 0.6;
const TRACK_Z = [-1.3, -2.9];

const clockFace = () => {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    const c = w / 2;
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(c, c, c - 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#d8b25a';
    ctx.beginPath(); ctx.arc(c, c, c - 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#fbf6e6';
    ctx.beginPath(); ctx.arc(c, c, c - 12, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#1d1d1d';
    ctx.lineCap = 'round';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.lineWidth = i % 3 === 0 ? 7 : 4;
      ctx.beginPath();
      ctx.moveTo(c + Math.sin(a) * (c - 18), c - Math.cos(a) * (c - 18));
      ctx.lineTo(c + Math.sin(a) * (c - 30), c - Math.cos(a) * (c - 30));
      ctx.stroke();
    }
    // ten past ten
    const hand = (a, len, lw) => {
      ctx.lineWidth = lw;
      ctx.beginPath(); ctx.moveTo(c, c);
      ctx.lineTo(c + Math.sin(a) * len, c - Math.cos(a) * len); ctx.stroke();
    };
    hand((10.17 / 12) * Math.PI * 2, c * 0.45, 9);
    hand((2 / 12) * Math.PI * 2, c * 0.68, 6);
    ctx.fillStyle = '#1d1d1d';
    ctx.beginPath(); ctx.arc(c, c, 6, 0, Math.PI * 2); ctx.fill();
  }, { key: 'railway-station:clock', repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
};

// Clock: frame box with a dial on +z and -z (0..1 UVs), base at y = 0.
function clock(size, frameM) {
  const face = clockFace();
  const g = group(box(size, size, 0.2, frameM));
  for (const s of [1, -1]) {
    const dial = new THREE.Mesh(new THREE.PlaneGeometry(size * 0.96, size * 0.96), face);
    dial.position.set(0, size / 2, s * 0.11);
    if (s < 0) dial.rotation.y = Math.PI;
    g.add(dial);
  }
  return g;
}

// Ballast bed, sleepers and two rails along X, centred on z = 0.
function track(len) {
  const g = new THREE.Group();
  const ballast = surface('gravel', '#8d857a', { size: 2 });
  const sleeperM = mat(PALETTE.woodDark);
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  g.add(box(len, 0.18, 1.6, ballast));
  for (let x = -len / 2 + 0.35; x < len / 2; x += 0.7) {
    g.add(place(box(0.26, 0.08, 1.3, sleeperM), { x, y: 0.18 }));
  }
  for (const z of [-0.45, 0.45]) g.add(place(box(len, 0.12, 0.1, railM), { y: 0.24, z }));
  return g;
}

// Raised platform slab with a paved top and a yellow safety line on the track edge(s).
function platform(w, d, edges) {
  const top = surface('paving', PALETTE.paving, { size: 2 });
  const side = mat(PALETTE.stoneDark);
  const g = group(box(w, PLAT_H, d, [side, side, top, side, side, side]));
  const line = mat(PALETTE.yellow);
  for (const e of edges) g.add(place(box(w, 0.02, 0.18, line), { y: PLAT_H, z: e * (d / 2 - 0.28) }));
  for (const e of edges) g.add(place(box(w, 0.08, 0.12, mat(PALETTE.offWhite)), { y: PLAT_H - 0.08, z: e * (d / 2 + 0.04) }));
  return g;
}

// Long platform canopy: posts, green corrugated roof and a white valance.
function canopy({ len, depth, h, posts, postZ, valanceSides = ['front', 'back'] }) {
  const g = new THREE.Group();
  const roofM = surface('corrugated', PALETTE.roofGreen, { size: 1.2 });
  const trim = mat(PALETTE.white);
  const postM = metal('#2f5e47');
  g.add(place(box(len, 0.22, depth, [trim, trim, roofM, mat(PALETTE.offWhite), trim, trim]), { y: h }));
  // shallow ridge along the middle
  g.add(place(gableRoof({ w: len, d: depth, h: 0.45, overhang: 0, ridge: 'x', material: roofM, gableMaterial: trim }), { y: h + 0.22 }));
  for (const s of valanceSides) {
    const z = s === 'front' ? depth / 2 : -depth / 2;
    g.add(place(box(len, 0.32, 0.06, trim), { y: h - 0.3, z }));
  }
  g.add(place(columns({ count: posts, length: len - 1.2, radius: 0.08, h, material: postM }), { z: postZ }));
  // brackets under the roof
  for (let i = 0; i < posts; i++) {
    const x = -(len - 1.2) / 2 + ((len - 1.2) * i) / (posts - 1);
    g.add(place(box(0.08, 0.08, depth * 0.8, postM), { x, y: h - 0.35, z: postZ * 0.3 }));
  }
  return g;
}

// Passenger coach: maroon & cream livery, window band, curved roof. Length along X.
function coach(len, livery) {
  const g = new THREE.Group();
  const lower = mat(livery, { roughness: 0.5 });
  const upper = mat(PALETTE.cream, { roughness: 0.5 });
  const winM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  const W = 1.45;
  g.add(place(box(len - 1.2, 0.3, 0.9, mat(PALETTE.black)), { y: 0.25 }));
  g.add(place(box(len, 0.8, W, lower), { y: 0.5 }));
  g.add(place(box(len, 0.75, W, upper), { y: 1.3 }));
  for (let x = -len / 2 + 0.9; x < len / 2 - 0.5; x += 0.95) {
    g.add(place(box(0.65, 0.45, W + 0.04, winM), { x, y: 1.45 }));
  }
  g.add(place(barrelRoof({ w: len, d: W, h: 0.3, axis: 'x', material: mat(PALETTE.lightGrey), endMaterial: mat(PALETTE.lightGrey) }), { y: 2.05 }));
  const wheelM = mat(PALETTE.darkGrey);
  for (const bx of [-len / 2 + 1.1, len / 2 - 1.1]) {
    for (const sz of [-1, 1]) {
      const wg = new THREE.CylinderGeometry(0.28, 0.28, 0.12, 10);
      wg.rotateX(Math.PI / 2);
      const wheel = new THREE.Mesh(wg, wheelM);
      wheel.position.set(bx, 0.28, sz * 0.48);
      g.add(wheel);
    }
  }
  return g;
}

// Diesel locomotive with a cab at the +x end and a yellow warning nose.
function locomotive(len) {
  const g = coach(len, PALETTE.navy);
  const yel = mat(PALETTE.yellow);
  g.add(place(box(0.25, 1.5, 1.47, yel), { x: len / 2 - 0.1, y: 0.5 }));
  g.add(place(box(0.08, 0.5, 1.2, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { x: len / 2 + 0.05, y: 1.45 }));
  for (const sz of [-0.45, 0.45]) g.add(place(box(0.06, 0.16, 0.22, emissive(PALETTE.windowLit, 0.9)), { x: len / 2 + 0.03, y: 0.75, z: sz }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const P = y0 + PLAT_H;
  g.add(lot([3, 1], 'gravel'));

  // ---- forecourt -----------------------------------------------------------
  g.add(place(patch(30, 3.8, 'paved'), { y: y0, z: 3.1 }));
  g.add(place(patch(7.6, 2.6, 'asphalt'), { x: -10.9, y: y0 + 0.01, z: 2.7 }));
  for (const x of [-13.6, -10.9, -8.2]) g.add(place(box(0.08, 0.02, 2.2, mat(PALETTE.roadLine)), { x: x - 1.35, y: y0 + 0.06, z: 2.7 }));
  g.add(place(box(0.08, 0.02, 2.2, mat(PALETTE.roadLine)), { x: -7.15, y: y0 + 0.06, z: 2.7 }));

  // ---- tracks & platforms --------------------------------------------------
  for (const z of TRACK_Z) g.add(place(track(30), { y: y0, z }));
  g.add(place(platform(29, 1.7, [-1]), { y: y0, z: 0.35 }));
  g.add(place(platform(29, 1.3, [1]), { y: y0, z: -4.35 }));
  // buffer stop at the west end of track 1
  const bufM = mat(PALETTE.red);
  g.add(place(box(0.5, 0.7, 1.4, bufM), { x: -14.6, y: y0 + 0.18, z: TRACK_Z[0] }));
  g.add(place(box(0.12, 0.25, 1.5, mat(PALETTE.white)), { x: -14.3, y: y0 + 0.6, z: TRACK_Z[0] }));

  // ---- station building ----------------------------------------------------
  const brick = { style: 'brick', wall: PALETTE.brick, glass: PALETTE.window, frame: PALETTE.cream, windowW: 0.45, windowH: 0.62, lit: 0.15, roof: PALETTE.roofSlate };
  const slate = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
  const stoneM = mat(PALETTE.cream);
  const bz = 2.8, bd = 3.2;

  // central hall, 2 storeys
  g.add(place(facadeBlock({ w: 9, d: bd, floors: 2, floorHeight: 3.2, bay: 1.8, seed: 3, ...brick }), { y: y0, z: bz }));
  g.add(place(box(9.2, 0.25, bd + 0.2, stoneM), { y: y0 + 3.1, z: bz }));
  g.add(place(hipRoof({ w: 9, d: bd, h: 1.8, overhang: 0.35, material: slate }), { y: y0 + 6.4, z: bz }));
  // wings, 1 tall storey
  for (const s of [-1, 1]) {
    const x = s * 6.6;
    g.add(place(facadeBlock({ w: 4.2, d: bd - 0.4, floors: 1, floorHeight: 3.6, bay: 1.4, seed: 4 + s, ...brick }), { x, y: y0, z: bz }));
    g.add(place(hipRoof({ w: 4.2, d: bd - 0.4, h: 1.2, overhang: 0.3, material: slate }), { x, y: y0 + 3.6, z: bz }));
    g.add(place(box(0.5, 0.25, 0.5, stoneM), { x: x + s * 1.1, y: y0 + 4.5, z: bz }));
  }
  // stone quoins on the hall corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.35, 6.4, 0.35, stoneM), { x: sx * 4.45, y: y0, z: bz + sz * (bd / 2 - 0.1) }));
  }

  // clock tower in the middle of the front
  const tz = 3.7, tw = 2.4;
  g.add(place(facadeBlock({ w: tw, d: tw, floors: 3, floorHeight: 3, bay: 1.2, seed: 8, ...brick }), { y: y0, z: tz }));
  g.add(place(box(tw + 0.3, 0.3, tw + 0.3, stoneM), { y: y0 + 9, z: tz }));
  g.add(place(facadeBlock({ w: tw - 0.2, d: tw - 0.2, h: 2.2, floorHeight: 2.2, style: 'plain', wall: PALETTE.cream, roof: PALETTE.cream }), { y: y0 + 9.3, z: tz }));
  const frameM = mat(PALETTE.cream);
  // clock faces sit just proud of the clock stage on all four sides
  for (const [x, z, ry] of [[0, tw / 2, 0], [0, -tw / 2, 180], [tw / 2, 0, 90], [-tw / 2, 0, -90]]) {
    g.add(place(clock(1.7, frameM), { x, y: y0 + 9.55, z: tz + z, ry }));
  }
  g.add(place(box(tw + 0.1, 0.25, tw + 0.1, stoneM), { y: y0 + 11.5, z: tz }));
  g.add(place(pyramidRoof({ w: tw, d: tw, h: 2.6, overhang: 0.25, material: surface('roofTiles', PALETTE.roofGreen, { size: 1.2 }) }), { y: y0 + 11.75, z: tz }));
  g.add(place(flag({ h: 2.2, color: PALETTE.red, color2: PALETTE.white }), { y: y0 + 14.2, z: tz }));

  // entrance: arched doorway, porch canopy and name board
  g.add(place(door({ w: 1.5, h: 2.5, color: PALETTE.woodDark, frame: PALETTE.cream }), { y: y0, z: tz + tw / 2 }));
  g.add(place(box(2.0, 0.4, 0.14, stoneM), { y: y0 + 2.55, z: tz + tw / 2 + 0.07 }));
  g.add(place(sign({ text: 'STATION', w: 2.3, h: 0.6, bg: PALETTE.navy, fg: '#ffffff' }), { y: y0 + 3.15, z: tz + tw / 2 + 0.1 }));
  for (const x of [-3.3, 3.3]) {
    g.add(place(box(2.0, 0.15, 0.55, mat(PALETTE.roofGreen)), { x, y: y0 + 2.7, z: bz + bd / 2 + 0.28 }));
    g.add(place(box(2.0, 0.2, 0.05, mat(PALETTE.white)), { x, y: y0 + 2.55, z: bz + bd / 2 + 0.55 }));
  }
  for (const x of [-3.3, 3.3]) g.add(place(door({ w: 1.1, h: 2.3, color: PALETTE.woodDark, frame: PALETTE.cream }), { x, y: y0, z: bz + bd / 2 }));
  // platform-side doors
  for (const x of [-2.4, 2.4]) g.add(place(door({ w: 1.2, h: 2.1, color: PALETTE.woodDark, frame: PALETTE.cream }), { x, y: P, z: bz - bd / 2, ry: 180 }));

  // ---- platform 1 canopy (against the building) ----------------------------
  g.add(place(canopy({ len: 25, depth: 2.2, h: 3.0, posts: 8, postZ: -0.4, valanceSides: ['back'] }), { x: -1.2, y: P, z: 0.1 }));

  // ---- platform 2 shelter canopy -------------------------------------------
  g.add(place(canopy({ len: 13, depth: 1.4, h: 2.7, posts: 5, postZ: -0.1 }), { x: -7.8, y: P, z: -4.3 }));
  // back screen wall of platform 2 (brick, low)
  g.add(place(box(29, 0.9, 0.18, surface('brick', PALETTE.brickDark, { size: 1 })), { y: P, z: -4.9 }));

  // ---- covered footbridge --------------------------------------------------
  const fbX = 13.3, deckY = P + 3.6;
  const bridgeM = metal('#2f5e47');
  const white = mat(PALETTE.white);
  // deck from the forecourt landing over both tracks to platform 2
  const z0 = 3.9, z1 = -4.75, deckLen = z0 - z1;
  g.add(place(box(1.6, 0.25, deckLen, mat(PALETTE.concreteDark)), { x: fbX, y: deckY, z: (z0 + z1) / 2 }));
  for (const s of [-1, 1]) {
    g.add(place(truss({ length: deckLen, w: 0.1, h: 1.3, segments: 9, thickness: 0.1, material: bridgeM }), { x: fbX + s * 0.75, y: deckY + 0.25, z: z0, ry: 90 }));
    g.add(place(box(0.05, 0.9, deckLen, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 })), { x: fbX + s * 0.76, y: deckY + 0.6, z: (z0 + z1) / 2 }));
  }
  g.add(place(barrelRoof({ w: 1.9, d: deckLen + 0.2, h: 0.5, axis: 'z', material: surface('corrugated', PALETTE.roofGreen, { size: 1 }), endMaterial: white }), { x: fbX, y: deckY + 1.6, z: (z0 + z1) / 2 }));
  g.add(place(box(1.9, 0.1, deckLen + 0.2, white), { x: fbX, y: deckY + 1.55, z: (z0 + z1) / 2 }));
  // piers
  for (const [z, base] of [[z0 - 0.3, y0], [-2.1, y0 + 0.18], [z1 + 0.2, P], [1.0, P]]) {
    for (const s of [-1, 1]) g.add(place(box(0.22, deckY - base, 0.22, bridgeM), { x: fbX + s * 0.6, y: base, z }));
  }
  // forecourt stairs rising towards +x up to the landing
  const st1 = place(stairs({ w: 1.3, h: deckY - y0, d: 5.4, steps: 14, material: mat(PALETTE.stone) }), { x: fbX - 0.8 - 2.7, y: y0, z: 3.85, ry: -90 });
  g.add(st1);
  for (const z of [3.2, 4.5]) g.add(beam([fbX - 0.8 - 5.4, y0 + 0.9, z], [fbX - 0.8, deckY + 0.9, z], 0.08, bridgeM));
  // platform 2 stairs descending towards -x
  g.add(place(stairs({ w: 1.1, h: deckY - P, d: 4.6, steps: 12, material: mat(PALETTE.stone) }), { x: fbX - 0.8 - 2.3, y: P, z: -4.3, ry: -90 }));
  g.add(beam([fbX - 0.8 - 4.6, P + 0.9, -3.75], [fbX - 0.8, deckY + 0.9, -3.75], 0.08, bridgeM));

  // ---- train waiting at platform 2 -----------------------------------------
  const ty = y0 + 0.3;
  g.add(place(locomotive(5.2), { x: 3.2, y: ty, z: TRACK_Z[1] }));
  g.add(place(coach(6.2, '#7a2a2a'), { x: -2.6, y: ty, z: TRACK_Z[1] }));
  g.add(place(coach(6.2, '#7a2a2a'), { x: -9.0, y: ty, z: TRACK_Z[1] }));

  // ---- platform furniture ------------------------------------------------
  for (const x of [-11, -5.5, 6, 10]) g.add(place(bench({ w: 1.4 }), { x, y: P, z: 0.75, s: 0.9 }));
  for (const x of [-12, -1, 2.5]) g.add(place(bench({ w: 1.4 }), { x, y: P, z: -4.6, s: 0.85 }));
  for (const x of [-9, 4]) {
    g.add(place(sign({ text: 'TINY TOWN', w: 2.4, h: 0.5, bg: PALETTE.navy, fg: '#ffffff', double: true }), { x, y: P + 2.2, z: -0.1 }));
  }
  g.add(place(sign({ text: 'TINY TOWN', w: 2.4, h: 0.5, bg: PALETTE.navy, fg: '#ffffff', double: true }), { x: 9.8, y: P + 1.9, z: -4.0, ry: 180 }));
  for (const x of [-14.3, 14.3]) g.add(place(streetLamp({ h: 3.2 }), { x, y: P, z: 0.2, ry: x < 0 ? 0 : 180 }));
  g.add(place(streetLamp({ h: 3 }), { x: -14.3, y: P, z: -4.4 }));
  // hanging platform clock under the canopy
  g.add(place(clock(0.6, frameM), { x: 1.5, y: P + 2.15, z: -0.4 }));
  g.add(place(box(0.05, 0.6, 0.05, metal(PALETTE.darkGrey)), { x: 1.5, y: P + 2.75, z: -0.4 }));
  // luggage trolley
  g.add(place(box(1.2, 0.08, 0.6, mat(PALETTE.wood)), { x: -7.8, y: P + 0.35, z: 0.75 }));
  g.add(place(box(0.6, 0.5, 0.5, mat(PALETTE.roofBrown)), { x: -7.9, y: P + 0.43, z: 0.75 }));
  g.add(place(box(0.08, 0.35, 0.6, mat(PALETTE.darkGrey)), { x: -8.4, y: P, z: 0.75 }));
  g.add(place(box(0.08, 0.35, 0.6, mat(PALETTE.darkGrey)), { x: -7.2, y: P, z: 0.75 }));
  // signal at the east end of track 1
  g.add(place(box(0.12, 3.2, 0.12, metal(PALETTE.darkGrey)), { x: 14.6, y: y0, z: -0.55 }));
  g.add(place(box(0.35, 0.8, 0.25, mat(PALETTE.black)), { x: 14.6, y: y0 + 3.0, z: -0.55 }));
  g.add(place(box(0.2, 0.2, 0.05, emissive('#ff3b2f', 1)), { x: 14.6, y: y0 + 3.45, z: -0.42 }));
  g.add(place(box(0.2, 0.2, 0.05, emissive('#3bff6a', 0.4)), { x: 14.6, y: y0 + 3.1, z: -0.42 }));

  // ---- forecourt: taxi rank, trees, lamps ----------------------------------
  g.add(place(car({ kind: 'taxi' }), { x: -12.6, y: y0 + 0.05, z: 2.7, ry: 90, s: 0.6 }));
  g.add(place(car({ color: PALETTE.blue }), { x: -9.9, y: y0 + 0.05, z: 2.7, ry: -90, s: 0.6 }));
  g.add(place(sign({ text: 'TAXI', w: 1, h: 0.4, bg: PALETTE.yellow, fg: PALETTE.black, double: true }), { x: -14.3, y: y0 + 2.0, z: 4.5 }));
  g.add(place(box(0.06, 2.0, 0.06, metal(PALETTE.darkGrey)), { x: -14.3, y: y0, z: 4.5 }));
  for (const x of [-14.5, -7.2]) g.add(place(streetLamp({ h: 3.6 }), { x, y: y0, z: 4.6, ry: x < -10 ? 0 : 180 }));
  // west planters & bushes between platform wall and taxi rank
  for (const x of [-11.6, 10.6]) g.add(place(fence({ w: 5.8, d: 0.1, h: 0.7, style: 'railing', sides: ['front'] }), { x, y: P, z: 1.1 }));
  for (const x of [8, 9.9]) {
    g.add(place(box(1.1, 0.45, 1.1, mat(PALETTE.stoneDark)), { x, y: y0, z: 2.2 }));
    g.add(place(tree({ kind: 'round', h: 3.2, seed: Math.round(x * 7) }), { x, y: y0 + 0.45, z: 2.2 }));
  }
  g.add(place(bench({ w: 1.4 }), { x: 9.0, y: y0, z: 1.6, s: 0.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 31 }), { x: 14.6, y: y0, z: 2.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 32 }), { x: -14.6, y: y0, z: 1.7 }));
  // bicycle rack
  for (let i = 0; i < 4; i++) g.add(place(box(0.05, 0.5, 0.6, metal(PALETTE.steel)), { x: 11.4 + i * 0.35, y: y0, z: 2.0 }));

  return g;
}

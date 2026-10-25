import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, group, parapet, rooftopUnits,   tree, mat, metal, emissive, columns, streetLamp, bench, flag, parkingLot, hedge,
  surface, door, textured, signTexture, canvasTexture,
} from '../../src/lib/index.js';

const WHITE = PALETTE.white;
const RED = PALETTE.red;

// Box with 0..1 UVs per face (lib box() uses metre UVs, which would shrink a
// single non-repeating label texture into one corner). Base at y = 0.
function labelBox(w, h, d, mats) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, mats);
}

// Sign board with text on its +z face.
function label(text, w, h, { bg = WHITE, fg = RED, depth = 0.2 } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round(512 * h / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return labelBox(w, h, depth, [side, side, side, side, face, side]);
}

// Helipad: dark pad, yellow edge, white ring and a big H.
function helipadDeck(size) {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = '#3a3d42';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 12;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.36, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    const s = W * 0.04;
    ctx.fillRect(W / 2 - 9 * s / 2 - 0, H / 2 - 5 * s, 2.2 * s, 10 * s);
    ctx.fillRect(W / 2 + 9 * s / 2 - 2.2 * s, H / 2 - 5 * s, 2.2 * s, 10 * s);
    ctx.fillRect(W / 2 - 9 * s / 2, H / 2 - 1.1 * s, 9 * s, 2.2 * s);
  }, { key: 'hospital:helipad', repeat: false });
  const side = mat('#3a3d42');
  return labelBox(size, 0.12, size, [side, side, textured(tex), side, side, side]);
}

// White plate with a red cross, facing +z (thin, stands on its bottom edge).
function redCross(size, { plate = WHITE, lit = false, depth = 0.15 } = {}) {
  const red = lit ? emissive(RED, 0.6) : mat(RED);
  const arm = size * 0.62, t = size * 0.2;
  return group(
    box(size, size, depth, mat(plate)),
    place(box(arm, t, 0.08, red), { y: (size - t) / 2, z: depth / 2 }),
    place(box(t, arm, 0.08, red), { y: (size - arm) / 2, z: depth / 2 }),
  );
}

// Flat red cross lying on a roof, readable from above.
function roofCross(size) {
  const t = size * 0.32;
  const red = mat(RED);
  return group(
    box(size + 0.8, 0.06, size + 0.8, mat(WHITE)),
    place(box(size, 0.04, t, red), { y: 0.06 }),
    place(box(t, 0.04, size, red), { y: 0.06 }),
  );
}

// White box ambulance with red stripe and blue light bar, length along X (front at +x).
function ambulance() {
  const body = mat(WHITE, { roughness: 0.45, metalness: 0.2 });
  const g = new THREE.Group();
  g.add(place(box(5, 0.75, 1.9, body), { y: 0.3 }));
  g.add(place(box(3.4, 1.45, 2.0, body), { x: -0.75, y: 1.05 }));
  g.add(place(box(1.3, 0.75, 1.8, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { x: 1.55, y: 1.05 }));
  g.add(place(box(1.3, 0.08, 1.82, body), { x: 1.55, y: 1.8 }));
  g.add(place(box(5.04, 0.28, 1.94, mat(RED)), { y: 0.72 }));
  g.add(place(box(3.44, 0.2, 2.04, mat(RED)), { x: -0.75, y: 2.0 }));
  g.add(place(box(0.35, 0.22, 1.5, emissive('#3a7bff', 1.1)), { x: 0.95, y: 2.5 }));
  g.add(place(box(0.35, 0.22, 1.5, emissive('#3a7bff', 1.1)), { x: -2.3, y: 2.5 }));
  for (const s of [-1, 1]) {
    const c = redCross(0.8, { depth: 0.02 });
    g.add(place(c, { x: -0.9, y: 1.1, z: s * 1.01, ry: s > 0 ? 0 : 180 }));
  }
  const wheelM = mat(PALETTE.black);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(cylinder(0.36, 0.36, 0.26, wheelM, 10), { x: sx * 1.6, y: 0.36, z: sz * 0.88, rx: 90 }));
  }
  return g;
}

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  const ward = { style: 'ribbon', wall: WHITE, glass: PALETTE.glassSky, frame: PALETTE.lightGrey, lit: 0.05, bay: 2.4, roof: PALETTE.concrete };
  const trim = mat(PALETTE.lightGrey);

  // --- main ward tower (6 floors) with rooftop helipad
  const tw = 9, td = 8, tx = 0, tz = -5.6, tFloors = 6, tH = tFloors * FLOOR;
  g.add(place(facadeBlock({ w: tw, d: td, floors: tFloors, ...ward, seed: 3 }), { x: tx, y: y0, z: tz }));
  g.add(place(parapet({ w: tw, d: td, h: 0.5, t: 0.25, material: trim }), { x: tx, y: y0 + tH, z: tz }));
  const deckY = y0 + tH + 0.5;
  g.add(place(box(7.6, 0.5, 7.2, mat(PALETTE.steelDark)), { x: tx, y: y0 + tH, z: tz }));
  g.add(place(helipadDeck(7), { x: tx, y: deckY, z: tz - 0.1 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.25, 0.2, 0.25, emissive(PALETTE.green, 1)), { x: tx + sx * 3.6, y: deckY, z: tz - 0.1 + sz * 3.4 }));
  }
  // windsock
  g.add(place(cylinder(0.05, 0.06, 2.4, metal(PALETTE.steelLight), 6), { x: tx + 4.1, y: y0 + tH, z: tz - 3.6 }));
  g.add(place(cylinder(0.12, 0.28, 1.0, mat(PALETTE.orange), 8), { x: tx + 4.1 + 0.5, y: y0 + tH + 2.3, z: tz - 3.6, rz: 90 }));
  // red crosses high on the tower faces
  g.add(place(label('HOSPITAL', 7.4, 1.5), { x: tx, y: y0 + tH - 1.4, z: tz + td / 2 + 0.1 }));
  g.add(place(redCross(3, { lit: true }), { x: tx, y: y0 + tH - 5.2, z: tz + td / 2 }));
  g.add(place(redCross(2.6, { lit: true }), { x: tx + tw / 2, y: y0 + tH - 3.6, z: tz - 1, ry: 90 }));
  g.add(place(redCross(2.6, { lit: true }), { x: tx - tw / 2, y: y0 + tH - 3.6, z: tz - 1, ry: -90 }));
  g.add(place(redCross(2.6, { lit: true }), { x: tx, y: y0 + tH - 3.6, z: tz - td / 2, ry: 180 }));

  // --- west wing (4 floors)
  const ww = 5.2, wd = 12.4, wx = -7.1, wz = -3.4, wFloors = 4, wH = wFloors * FLOOR;
  g.add(place(facadeBlock({ w: ww, d: wd, floors: wFloors, ...ward, seed: 7 }), { x: wx, y: y0, z: wz }));
  g.add(place(parapet({ w: ww, d: wd, h: 0.5, t: 0.25, material: trim }), { x: wx, y: y0 + wH, z: wz }));
  g.add(place(roofCross(3.2), { x: wx, y: y0 + wH, z: wz + 2.6 }));
  g.add(place(rooftopUnits({ w: ww - 0.6, d: 4, count: 3, seed: 12 }), { x: wx, y: y0 + wH, z: wz - 3.6 }));
  g.add(place(redCross(2.2), { x: wx, y: y0 + wH - 3, z: wz + wd / 2 }));

  // --- east wing (3 floors) with emergency entrance
  const ew = 5.2, ed = 10, ex = 7.1, ez = -4.6, eFloors = 3, eH = eFloors * FLOOR;
  g.add(place(facadeBlock({ w: ew, d: ed, floors: eFloors, ...ward, seed: 9 }), { x: ex, y: y0, z: ez }));
  g.add(place(parapet({ w: ew, d: ed, h: 0.5, t: 0.25, material: trim }), { x: ex, y: y0 + eH, z: ez }));
  g.add(place(rooftopUnits({ w: ew - 0.6, d: ed - 1, count: 4, seed: 5 }), { x: ex, y: y0 + eH, z: ez }));
  const eFront = ez + ed / 2;
  g.add(place(door({ w: 3, h: 2.6, color: PALETTE.glassDark, frame: PALETTE.lightGrey }), { x: ex, y: y0, z: eFront }));

  // teal band above the ground floor wraps the tower and both wings
  const band = mat(PALETTE.glassTeal);
  for (const [bw, bd, bx, bz] of [[tw, td, tx, tz], [ww, wd, wx, wz], [ew, ed, ex, ez]]) {
    g.add(place(box(bw + 0.12, 0.35, bd + 0.12, band), { x: bx, y: y0 + FLOOR - 0.2, z: bz }));
  }

  // --- glass lobby linking the wings, with HOSPITAL sign
  const lw = 9, ld = 3.2, lz = -0.05, lH = 4.5;
  g.add(place(facadeBlock({ w: lw, d: ld, h: lH, floorHeight: lH, style: 'curtain', glass: PALETTE.glassTeal, frame: WHITE, bay: 1.8, lit: 0.3, seed: 2, roof: PALETTE.concrete }), { y: y0, z: lz }));
  g.add(place(box(lw + 0.2, 0.5, ld + 0.2, mat(WHITE)), { y: y0 + lH, z: lz }));
  g.add(place(label('MAIN ENTRANCE', 6.2, 1.1, { bg: PALETTE.navy, fg: '#ffffff' }), { x: -0.9, y: y0 + lH + 0.5, z: lz + ld / 2 - 0.1 }));
  g.add(place(redCross(1.1), { x: 3.1, y: y0 + lH + 0.5, z: lz + ld / 2 - 0.1 }));
  g.add(place(door({ w: 2.2, h: 2.6, color: PALETTE.glassDark, frame: PALETTE.lightGrey }), { y: y0, z: lz + ld / 2 }));

  // main entrance canopy
  const cz = lz + ld / 2 + 1.5;
  g.add(place(box(5.4, 0.3, 3, mat(WHITE)), { y: y0 + 3.2, z: cz }));
  g.add(place(box(5.42, 0.12, 3.02, mat(RED)), { y: y0 + 3.3, z: cz }));
  g.add(place(columns({ count: 2, length: 4.6, radius: 0.13, h: 3.2, material: mat(WHITE) }), { y: y0, z: cz + 1.2 }));

  // --- ambulance bay: drive, canopy, EMERGENCY sign, two ambulances
  g.add(place(patch(5.8, 9.6, surface('asphalt', PALETTE.asphalt, { size: 4 })), { x: 7.05, y: y0, z: 5.0 }));
  g.add(place(patch(4.6, 1.2, surface('hazard', PALETTE.yellow, { size: 1 }), 0.07), { x: ex, y: y0, z: eFront + 0.7 }));
  const bayZ = eFront + 2.4;
  g.add(place(box(5.6, 0.35, 4.6, mat(WHITE)), { x: ex, y: y0 + 3.4, z: bayZ - 0.1 }));
  g.add(place(box(5.62, 0.15, 4.62, mat(RED)), { x: ex, y: y0 + 3.5, z: bayZ - 0.1 }));
  for (const sx of [-1, 1]) g.add(place(box(0.3, 3.4, 0.3, mat(PALETTE.lightGrey)), { x: ex + sx * 2.5, y: y0, z: bayZ + 2 }));
  g.add(place(label('EMERGENCY', 5, 0.9, { bg: RED, fg: '#ffffff' }), { x: ex, y: y0 + 3.75, z: bayZ + 2.32 }));
  g.add(place(ambulance(), { x: ex - 1.25, y: y0 + 0.05, z: bayZ + 0.4, ry: -90, s: 0.85 }));
  g.add(place(ambulance(), { x: ex + 1.3, y: y0 + 0.05, z: bayZ + 4.6, ry: -90, s: 0.85 }));
  // road markings along the drive
  for (let i = 0; i < 3; i++) g.add(place(box(0.15, 0.02, 1.2, mat(PALETTE.roadLine)), { x: ex, y: y0 + 0.05, z: bayZ + 2.6 + i * 1.9 }));

  // --- front forecourt and visitor parking
  g.add(place(patch(9, 3.2, 'paved'), { y: y0, z: cz }));
  g.add(place(parkingLot({ w: 8, d: 5.4, seed: 4, fill: 0.7 }), { x: -0.2, y: y0, z: 7.2 }));
  for (const x of [-3.4, -2.6]) g.add(place(flag({ h: 5, color: x < -3 ? RED : PALETTE.blue, color2: WHITE }), { x, y: y0, z: 3.6 }));

  // --- garden on the west front: trees, benches, lamp, sign totem
  g.add(place(patch(1.2, 7.2, 'paved'), { x: -4.85, y: y0, z: 6.2 }));
  g.add(place(hedge({ w: 5, h: 0.8, d: 0.5 }), { x: -7.3, y: y0, z: 9.6 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 31 }), { x: -7.9, y: y0, z: 6.4 }));
  g.add(place(tree({ kind: 'round', h: 4.8, seed: 33 }), { x: -6.2, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 34 }), { x: -9.2, y: y0, z: 3.6 }));
  g.add(place(bench({ w: 1.6 }), { x: -6.6, y: y0, z: 7.6 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.1, y: y0, z: 8.8, ry: 180 }));
  g.add(place(box(0.8, 3.2, 0.5, mat(PALETTE.lightGrey)), { x: -8.6, y: y0, z: 9.2 }));
  g.add(place(redCross(1.4), { x: -8.6, y: y0 + 1.6, z: 9.45 }));

  // trees and lamp along the east side of the drive
  g.add(place(tree({ kind: 'poplar', h: 6, seed: 41 }), { x: 3.6, y: y0, z: 8.4 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 4.3, y: y0, z: 5.6 }));
  // back hedge
  g.add(place(hedge({ w: 19.4, h: 0.6, d: 0.3 }), { y: y0, z: -9.8 }));
  return g;
}

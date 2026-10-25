import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, box, place, group, cylinder,
  tree, car, mat, metal, emissive, textured, canvasTexture, surface, streetLamp, bench,
} from '../../src/lib/index.js';

// Box with 0..1 UVs on every face, base at y = 0. The lib's box() uses metre
// UVs, which shrinks sign/door textures on faces wider than 1 m.
function plate(w, h, d, front, side, back = side) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, front, back]);
}

const DOOR = PALETTE.glassTeal;
const TRIM = '#2a9d9a';
const WALL = PALETTE.white;

// Turquoise motel door with a big white room number. Faces +z from z = 0.
function roomDoor(n) {
  const tex = canvasTexture(64, 128, (ctx, W, H) => {
    ctx.fillStyle = DOOR;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(0,0,0,0.25)';
    ctx.lineWidth = 3;
    ctx.strokeRect(10, 62, W - 20, H - 72);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 52px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(n), W / 2, 34);
    ctx.fillStyle = '#e9c31f';
    ctx.fillRect(W - 14, 74, 6, 6); // knob
  }, { key: `roadside-motel:door${n}`, repeat: false });
  const front = textured(tex);
  return group(
    place(box(1.15, 2.2, 0.06, mat(PALETTE.frame)), { z: 0.03 }),
    place(plate(0.95, 2.1, 0.1, front, mat(DOOR)), { z: 0.05 })
  );
}

// Room window with half-drawn curtains and a through-wall AC unit beneath.
function roomWindow(w = 0.9, lit = false) {
  const curtain = mat(PALETTE.salmon);
  const g = group(
    place(box(w + 0.16, 1.06, 0.06, mat(PALETTE.frame)), { y: 0.9, z: 0.03 }),
    place(box(w, 0.9, 0.08, lit ? emissive(PALETTE.windowLit, 0.5) : mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 })), { y: 0.98, z: 0.04 }),
    place(box(w * 0.22, 0.9, 0.1, curtain), { x: -w * 0.39, y: 0.98, z: 0.04 }),
    place(box(w * 0.22, 0.9, 0.1, curtain), { x: w * 0.39, y: 0.98, z: 0.04 }),
    // AC unit
    place(box(0.72, 0.42, 0.34, mat(PALETTE.lightGrey)), { y: 0.3, z: 0.17 }),
    place(box(0.6, 0.26, 0.02, mat(PALETTE.grey)), { y: 0.38, z: 0.345 })
  );
  return g;
}

function textPlate(key, text, w, h, { bg, fg, glow = 0, border = null, font = 'bold', px = 256 }) {
  const th = Math.max(16, Math.round(px / (w / h)));
  const tex = canvasTexture(px, th, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    if (border) {
      ctx.strokeStyle = border;
      ctx.lineWidth = Math.max(3, H * 0.08);
      ctx.strokeRect(ctx.lineWidth, ctx.lineWidth, W - ctx.lineWidth * 2, H - ctx.lineWidth * 2);
    }
    let size = H * 0.66;
    ctx.font = `${font} ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.86 && size > 6) {
      size -= 1;
      ctx.font = `${font} ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    if (glow) {
      ctx.shadowColor = fg;
      ctx.shadowBlur = glow;
    }
    ctx.fillStyle = fg;
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key: `roadside-motel:${key}`, repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow ? 0.7 : 0.15 });
}

// Tall roadside pylon: MOTEL board with a bulb border, arrow, neon VACANCY.
function neonSign() {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelDark);
  const red = mat(PALETTE.red);
  const bulb = emissive('#ffe680', 1.2);
  // the pole runs up inside the boards (they are thicker than it)
  g.add(cylinder(0.18, 0.22, 8.9, steel, 8));
  g.add(place(box(0.9, 0.5, 0.9, mat(PALETTE.concrete)), {}));

  // main board
  const mainY = 7.0, mw = 4.4, mh = 1.9;
  const face = textPlate('motel', 'MOTEL', mw, mh, { bg: PALETTE.red, fg: '#ffe46a', border: '#fff3c0', glow: 8 });
  g.add(place(plate(mw, mh, 0.5, face, red, face), { y: mainY }));
  // chasing bulbs along top and bottom edges
  for (let i = 0; i < 11; i++) {
    const x = -mw / 2 + 0.2 + i * ((mw - 0.4) / 10);
    for (const yy of [mainY - 0.05, mainY + mh - 0.05]) g.add(place(box(0.14, 0.14, 0.6, bulb), { x, y: yy }));
  }
  // star on top
  const star = emissive('#ffd23a', 1.0);
  for (const a of [0, 45, 90, 135]) g.add(place(box(1.3, 0.18, 0.18, star), { y: mainY + mh + 0.65, rz: a }));
  g.add(place(box(0.08, 0.5, 0.08, steel), { y: mainY + mh }));

  // arrow pointing down-left towards the rooms
  const arrow = emissive('#ffb02e', 1.0);
  g.add(place(box(0.32, 2.1, 0.3, arrow), { x: -2.7, y: 5.0 }));
  g.add(place(box(0.32, 1.0, 0.3, arrow), { x: -3.0, y: 4.9, rz: 40 }));
  g.add(place(box(0.32, 1.0, 0.3, arrow), { x: -2.4, y: 4.9, rz: -40 }));

  // VACANCY neon box with a dark (unlit) NO
  const vy = 5.3, vw = 3.6, vh = 0.9;
  const vac = textPlate('vacancy', 'VACANCY', vw, vh, { bg: '#1c1426', fg: '#ff4fa0', glow: 10 });
  g.add(place(plate(vw, vh, 0.45, vac, mat('#1c1426'), vac), { x: 0.2, y: vy }));
  const no = textPlate('no', 'NO', 1.0, vh, { bg: '#1c1426', fg: '#5a3448' });
  g.add(place(plate(1.0, vh, 0.45, no, mat('#1c1426'), no), { x: 0.2 + vw / 2 + 0.55, y: vy }));
  // COLOR TV / A/C strip
  const tv = textPlate('tv', 'COLOR TV · A/C', 3.0, 0.55, { bg: PALETTE.white, fg: TRIM });
  g.add(place(plate(3.0, 0.55, 0.45, tv, mat(PALETTE.white), tv), { x: 0.2, y: 4.35 }));
  return g;
}

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const H = 3.0; // wall height
  const walk = 0.2; // walkway kerb height
  const yw = y0 + walk;
  g.add(lot([2, 1], 'grass'));

  const roofMat = surface('roofTiles', PALETTE.terracotta, { size: 2 });
  const plain = { style: 'plain', wall: WALL, roof: PALETTE.concreteDark };

  // --- wings -------------------------------------------------------------
  // back wing runs the full width; left wing comes forward to the street
  const bz0 = -4.7, bz1 = -0.7; // back wing z extent
  const lx0 = -9.7, lx1 = -5.7; // left wing x extent
  const lz1 = 3.4; // left wing front face (office)
  g.add(place(facadeBlock({ w: 19.4, d: bz1 - bz0, h: H, floorHeight: H, ...plain }), { y: y0, z: (bz0 + bz1) / 2 }));
  g.add(place(facadeBlock({ w: lx1 - lx0, d: lz1 - bz1, h: H, floorHeight: H, ...plain }), { x: (lx0 + lx1) / 2, y: y0, z: (bz1 + lz1) / 2 }));
  // base course
  const baseM = mat(PALETTE.brickBrown);
  g.add(place(box(19.5, 0.35, bz1 - bz0 + 0.1, baseM), { y: y0, z: (bz0 + bz1) / 2 }));
  g.add(place(box(lx1 - lx0 + 0.1, 0.35, lz1 - bz1 + 0.1, baseM), { x: (lx0 + lx1) / 2, y: y0, z: (bz1 + lz1) / 2 }));

  // roofs: low gables, the left wing's ridge meets the back wing's ridge
  const rh = 1.3;
  g.add(place(gableRoof({ w: 19.4, d: bz1 - bz0, h: rh, overhang: 0.35, ridge: 'x', material: roofMat, gableMaterial: WALL }), { y: y0 + H, z: (bz0 + bz1) / 2 }));
  const lrz0 = (bz0 + bz1) / 2 + 0.4;
  g.add(place(gableRoof({ w: lx1 - lx0, d: lz1 - lrz0, h: rh, overhang: 0.35, ridge: 'z', material: roofMat, gableMaterial: WALL }), { x: (lx0 + lx1) / 2, y: y0 + H, z: (lrz0 + lz1) / 2 }));

  // --- walkway + canopy (L along the inner faces) -------------------------
  const cd = 1.7; // canopy depth
  const concrete = surface('concrete', PALETTE.concrete, { size: 4 });
  const cy = y0 + H - 0.25;
  const canopyTop = mat(PALETTE.roofGrey);
  const fascia = mat(TRIM);
  const postM = mat(PALETTE.white);
  // back run: x from lx1 to the right edge
  const bL = 9.75 - lx1;
  const bcx = (lx1 + 9.75) / 2;
  g.add(place(box(bL, walk, cd, concrete), { x: bcx, y: y0, z: bz1 + cd / 2 }));
  g.add(place(box(bL, 0.18, cd + 0.1, canopyTop), { x: bcx, y: cy, z: bz1 + cd / 2 }));
  g.add(place(box(bL, 0.4, 0.1, fascia), { x: bcx, y: cy - 0.12, z: bz1 + cd + 0.05 }));
  // left run: z from bz1 + cd to the office front
  const lL = lz1 - (bz1 + cd);
  const lcz = (bz1 + cd + lz1) / 2;
  g.add(place(box(cd, walk, lL, concrete), { x: lx1 + cd / 2, y: y0, z: lcz }));
  g.add(place(box(cd + 0.1, 0.18, lL, canopyTop), { x: lx1 + cd / 2, y: cy, z: lcz }));
  g.add(place(box(0.1, 0.4, lL + 0.1, fascia), { x: lx1 + cd + 0.05, y: cy - 0.12, z: lcz + 0.05 }));
  // posts
  for (let i = 0; i <= 5; i++) g.add(place(box(0.14, H - 0.25 - walk, 0.14, postM), { x: lx1 + cd - 0.1 + i * ((9.6 - (lx1 + cd)) / 5), y: yw, z: bz1 + cd - 0.1 }));
  for (const z of [bz1 + cd + 2.0, lz1 - 0.1]) g.add(place(box(0.14, H - 0.25 - walk, 0.14, postM), { x: lx1 + cd - 0.1, y: yw, z }));

  // --- rooms ---------------------------------------------------------------
  // left wing: rooms 1 (front) and 2, doors face +x
  const lz = [[lz1 - 1.7, 1, true], [lz1 - 3.7, 2, false]];
  for (const [z0, n, lit] of lz) {
    g.add(place(roomDoor(n), { x: lx1, y: yw, z: z0 + 0.55, ry: 90 }));
    g.add(place(roomWindow(0.7, lit), { x: lx1, y: yw, z: z0 - 0.5, ry: 90 }));
  }
  // back wing: rooms 3-7, doors face +z
  const rx0 = lx1 + cd, rw = (9.7 - rx0) / 5;
  for (let i = 0; i < 5; i++) {
    const x0 = rx0 + i * rw;
    g.add(place(roomDoor(3 + i), { x: x0 + 0.7, y: yw, z: bz1 }));
    g.add(place(roomWindow(0.9, i === 1 || i === 4), { x: x0 + 1.95, y: yw, z: bz1 }));
  }
  // corner alcove: vending + ice machines
  g.add(place(box(0.8, 1.8, 0.7, mat(PALETTE.red)), { x: lx1 + 0.55, y: yw, z: bz1 + 0.38 }));
  g.add(place(box(0.55, 1.2, 0.04, emissive('#ffefe0', 0.6)), { x: lx1 + 0.5, y: yw + 0.45, z: bz1 + 0.75 }));
  g.add(place(box(0.8, 1.3, 0.7, mat(PALETTE.white)), { x: lx1 + 1.45, y: yw, z: bz1 + 0.38 }));
  g.add(place(plate(0.62, 0.3, 0.04, textPlate('ice', 'ICE', 0.62, 0.3, { bg: PALETTE.blue, fg: '#ffffff' }), mat(PALETTE.blue)), { x: lx1 + 1.45, y: yw + 0.9, z: bz1 + 0.75 }));

  // small frosted bathroom windows on the back and outer walls
  const frosted = mat(PALETTE.glassSky, { roughness: 0.4 });
  for (let i = 0; i < 6; i++) g.add(place(box(0.7, 0.45, 0.08, frosted), { x: -8.2 + i * 3.25, y: y0 + 1.9, z: bz0 - 0.03 }));
  for (const z of [-3.2, -0.4, 1.8]) g.add(place(box(0.08, 0.45, 0.7, frosted), { x: lx0 - 0.03, y: y0 + 1.9, z }));
  // rear service: AC condensers by the back wall
  for (const x of [-8.6, 8.6]) g.add(place(box(0.8, 0.6, 0.35, mat(PALETTE.steelLight)), { x, y: y0, z: bz0 - 0.2 }));
  // name painted along the highway-facing back wall
  const rear = textPlate('rear', 'STARLITE MOTEL', 9, 0.9, { bg: TRIM, fg: '#ffffff', px: 512 });
  g.add(place(plate(9, 0.9, 0.04, rear, mat(TRIM)), { y: y0 + 0.55, z: bz0 - 0.02, ry: 180 }));
  g.add(place(box(0.08, 0.45, 0.7, frosted), { x: 9.73, y: y0 + 1.9, z: -2.7 }));

  // --- office (street end of the left wing) ------------------------------
  const ox = (lx0 + lx1) / 2;
  g.add(place(box(lx1 - lx0 + 0.4, 0.15, 1.3, concrete), { x: ox, y: y0, z: lz1 + 0.65 }));
  g.add(place(box(2.0, 1.5, 0.06, mat(PALETTE.frame)), { x: ox - 0.75, y: y0 + 0.8, z: lz1 + 0.03 }));
  g.add(place(box(1.85, 1.35, 0.1, emissive(PALETTE.windowLit, 0.45)), { x: ox - 0.75, y: y0 + 0.88, z: lz1 + 0.05 }));
  g.add(place(box(1.0, 2.2, 0.06, mat(PALETTE.frame)), { x: ox + 1.25, y: y0 + 0.15, z: lz1 + 0.03 }));
  g.add(place(box(0.85, 2.05, 0.1, mat(PALETTE.glassBlue, { roughness: 0.2, metalness: 0.4 })), { x: ox + 1.25, y: y0 + 0.15, z: lz1 + 0.05 }));
  // flat entry canopy + OFFICE sign in the gable
  g.add(place(box(4.4, 0.16, 1.2, fascia), { x: ox, y: y0 + 2.5, z: lz1 + 0.6 }));
  const off = textPlate('office', 'OFFICE', 2.4, 0.6, { bg: PALETTE.navy, fg: '#ffe46a', glow: 6 });
  g.add(place(plate(2.4, 0.6, 0.12, off, mat(PALETTE.navy)), { x: ox, y: y0 + 2.75, z: lz1 + 0.06 }));
  g.add(place(bench({ w: 1.3 }), { x: ox - 0.9, y: y0 + 0.15, z: lz1 + 0.75, ry: 180 }));

  // --- parking ---------------------------------------------------------------
  const pz0 = bz1 + cd, pz1 = 5.0;
  const px0 = lx1 + cd;
  g.add(place(patch(10 - px0, pz1 - pz0, 'asphalt'), { x: (px0 + 10) / 2, y: y0, z: (pz0 + pz1) / 2 }));
  const line = mat(PALETTE.roadLine);
  for (let i = 1; i < 5; i++) g.add(place(box(0.1, 0.02, 3.0, line), { x: rx0 + i * rw, y: y0 + 0.05, z: pz0 + 1.6 }));
  g.add(place(box(0.1, 0.02, 3.0, line), { x: 9.6, y: y0 + 0.05, z: pz0 + 1.6 }));
  // bay along the left wing (room 1)
  g.add(place(box(3.2, 0.02, 0.1, line), { x: px0 + 1.7, y: y0 + 0.05, z: lz1 - 2.8 }));
  for (let i = 0; i < 5; i++) g.add(place(box(1.2, 0.12, 0.25, mat(PALETTE.concrete)), { x: rx0 + i * rw + rw / 2, y: y0 + 0.05, z: pz0 + 0.45 }));

  const sc = 0.78;
  g.add(place(car({ color: PALETTE.blue }), { x: px0 + 1.85, y: y0 + 0.05, z: lz1 - 1.3, s: sc }));
  g.add(place(car({ color: PALETTE.red }), { x: rx0 + 1 * rw + rw / 2, y: y0 + 0.05, z: pz0 + 1.85, ry: 90, s: sc }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: rx0 + 2 * rw + rw / 2, y: y0 + 0.05, z: pz0 + 2.0, ry: 90, s: sc }));
  g.add(place(car({ color: PALETTE.yellow }), { x: rx0 + 4 * rw + rw / 2, y: y0 + 0.05, z: pz0 + 1.85, ry: 90, s: sc }));

  // --- neon pylon in the free bay by the road -----------------------------
  g.add(place(neonSign(), { x: rx0 + 3 * rw + rw / 2 + 0.3, y: y0, z: 4.45 }));

  // --- landscaping ---------------------------------------------------------
  g.add(place(streetLamp({ h: 4.2 }), { x: px0 + 0.4, y: y0, z: 4.6, ry: -30 }));
  g.add(place(tree({ kind: 'palm', h: 4.6, seed: 8 }), { x: -4.6, y: y0, z: 3.3 }));
  for (const [x, s] of [[-8.3, 3], [-7.0, 5], [-5.6, 6]]) g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z: 4.75 }));
  for (const [x, s] of [[-9.6, 9], [-6, 11], [0.5, 12], [6.5, 13], [9.6, 14]]) g.add(place(tree({ kind: 'bush', h: 0.9, seed: s }), { x, y: y0, z: -4.85 }));
  // trash can by the office
  g.add(place(cylinder(0.25, 0.22, 0.75, mat(PALETTE.green), 8), { x: lx1 + 0.3, y: y0 + 0.15, z: lz1 + 0.6 }));
  return g;
}

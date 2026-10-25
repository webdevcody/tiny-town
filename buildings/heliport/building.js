import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, cylinder, sphere, place, beam,
  tree, car, bench, streetLamp, door, tank, fence,
  mat, metal, glass, emissive, textured, canvasTexture, signTexture,
} from '../../src/lib/index.js';
import { helicopter } from './helicopter.js';

// Deck: concrete-grey disc, white edge ring, yellow touchdown circle, big H.
function deckTexture() {
  return canvasTexture(512, 512, (ctx, W) => {
    const c = W / 2;
    ctx.fillStyle = '#4b4f55';
    ctx.fillRect(0, 0, W, W);
    ctx.lineWidth = W * 0.035;
    ctx.strokeStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(c, c, W * 0.455, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = W * 0.045;
    ctx.beginPath(); ctx.arc(c, c, W * 0.33, 0, Math.PI * 2); ctx.stroke();
    // H (upright when seen from the front / +z)
    ctx.save();
    ctx.translate(c, c); ctx.rotate(Math.PI / 2); ctx.translate(-c, -c);
    ctx.fillStyle = '#ffffff';
    const hw = W * 0.24, hh = W * 0.34, bar = W * 0.065;
    ctx.fillRect(c - hw / 2, c - hh / 2, bar, hh);
    ctx.fillRect(c + hw / 2 - bar, c - hh / 2, bar, hh);
    ctx.fillRect(c - hw / 2, c - bar / 2, hw, bar);
    ctx.restore();
    // edge dashes
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 24; i++) {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate((i / 24) * Math.PI * 2);
      ctx.fillRect(W * 0.385, -W * 0.012, W * 0.04, W * 0.024);
      ctx.restore();
    }
  }, { key: 'heliport:deck', repeat: false });
}

// Sign with 0..1 UVs so the text fills the face (lib sign() shrinks over 1 m).
function bigSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.15 } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Orange/white windsock on a short mast, blowing towards +X.
function windsock({ mastH = 2 } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelLight);
  g.add(cylinder(0.05, 0.07, mastH, steel, 6));
  g.add(place(cylinder(0.27, 0.27, 0.05, steel, 10), { x: 0.05, y: mastH - 0.25, rz: -90 }));
  const sock = new THREE.Group();
  const seg = 0.32, r0 = 0.26, r1 = 0.11;
  for (let i = 0; i < 5; i++) {
    const ra = r0 + ((r1 - r0) * i) / 5, rb = r0 + ((r1 - r0) * (i + 1)) / 5;
    const m = mat(i % 2 === 0 ? PALETTE.orange : PALETTE.white, { side: THREE.DoubleSide });
    const geo = new THREE.CylinderGeometry(rb, ra, seg, 10, 1, true).translate(0, seg / 2 + i * seg, 0);
    sock.add(new THREE.Mesh(geo, m));
  }
  g.add(place(sock, { x: 0.05, y: mastH - 0.25, rz: -80 }));
  return g;
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;

  g.add(lot([1, 1], 'grass'));

  // ---- raised helipad deck ----------------------------------------------
  const dx = -0.8, dz = -0.8;       // deck centre
  const R = 3.7;                    // deck radius
  const deckY = y0 + 7.0;           // top of deck
  const slab = 0.35;
  const concrete = mat(PALETTE.concrete);
  const white = mat(PALETTE.white);
  const steel = metal(PALETTE.steelDark);
  const steelLight = metal(PALETTE.steelLight);

  // slender column, flared base and head
  g.add(place(cylinder(0.85, 1.0, 0.5, concrete, 16), { x: dx, y: y0, z: dz }));
  g.add(place(cylinder(0.42, 0.55, deckY - slab - 0.9 - y0, white, 16), { x: dx, y: y0 + 0.5, z: dz }));
  g.add(place(cylinder(1.1, 0.45, 0.6, white, 16), { x: dx, y: deckY - slab - 0.6 - 0.3, z: dz }));
  // red/white hazard bands on the column
  for (const by of [1.4, 2.4]) g.add(place(cylinder(0.5, 0.52, 0.45, mat(PALETTE.red), 16), { x: dx, y: y0 + by, z: dz }));

  // radial steel girders under the deck + diagonal struts to the column
  const underY = deckY - slab;
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const ca = Math.cos(a), sa = Math.sin(a);
    g.add(beam([dx + ca * 0.9, underY - 0.15, dz + sa * 0.9], [dx + ca * (R - 0.25), underY - 0.15, dz + sa * (R - 0.25)], 0.3, steel));
    if (i % 2 === 0) g.add(beam([dx + ca * 0.5, y0 + 3.6, dz + sa * 0.5], [dx + ca * (R - 0.6), underY - 0.3, dz + sa * (R - 0.6)], 0.18, steel));
  }
  g.add(place(new THREE.Mesh(new THREE.TorusGeometry(R - 0.3, 0.12, 6, 32), steel), { x: dx, y: underY - 0.15, z: dz, rx: 90 }));

  // the deck itself: side band, textured top
  const deckGeo = new THREE.CylinderGeometry(R, R, slab, 40).translate(0, slab / 2, 0);
  const deck = new THREE.Mesh(deckGeo, [mat(PALETTE.lightGrey), textured(deckTexture()), mat(PALETTE.steelDark)]);
  g.add(place(deck, { x: dx, y: underY, z: dz }));

  // safety net: flared ring round the rim
  const netGeo = new THREE.CylinderGeometry(R + 0.5, R, 0.25, 40, 1, true).translate(0, 0.125, 0);
  const net = new THREE.Mesh(netGeo, mat(PALETTE.darkGrey, { transparent: true, opacity: 0.55, side: THREE.DoubleSide }));
  g.add(place(net, { x: dx, y: deckY - 0.2, z: dz }));
  g.add(place(new THREE.Mesh(new THREE.TorusGeometry(R + 0.5, 0.04, 4, 40), steelLight), { x: dx, y: deckY + 0.05, z: dz, rx: 90 }));

  // perimeter lights (green) and floodlights
  const green = emissive('#3dff6a', 1.4);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.add(place(cylinder(0.08, 0.1, 0.14, green, 6), { x: dx + Math.cos(a) * (R - 0.12), y: deckY, z: dz + Math.sin(a) * (R - 0.12) }));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    const fx = dx + Math.cos(a) * (R + 0.15), fz = dz + Math.sin(a) * (R + 0.15);
    g.add(place(box(0.1, 0.5, 0.1, steel), { x: fx, y: deckY - 0.1, z: fz }));
    const head = place(box(0.35, 0.22, 0.12, emissive('#fff6c8', 1.2)), { x: fx, y: deckY + 0.4, z: fz, ry: -THREE.MathUtils.radToDeg(a) + 90, rx: -20 });
    g.add(head);
  }

  // helicopter parked on the pad
  g.add(place(helicopter({ color: PALETTE.yellow, trim: PALETTE.navy }), { x: dx + 0.45, y: deckY, z: dz - 1.45, ry: 8, s: 0.85 }));

  // windsock on the back-right rim
  const wa = Math.PI * 1.75;
  g.add(place(windsock({ mastH: 2.2 }), { x: dx + Math.cos(wa) * (R + 0.2), y: deckY - 0.3, z: dz + Math.sin(wa) * (R + 0.2), ry: 20 }));

  // ---- glass lift tower + bridge -----------------------------------------
  const tx = 3.9, tz = dz, tw = 1.7;
  const towerH = deckY - y0 + 2.6;
  g.add(place(facadeBlock({ w: tw, d: tw, h: towerH, floorHeight: towerH / 4, style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelLight, bay: 0.85, lit: 0.2, seed: 7, roof: PALETTE.concreteDark }), { x: tx, y: y0, z: tz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.14, towerH + 0.2, 0.14, steelLight), { x: tx + sx * tw / 2, y: y0, z: tz + sz * tw / 2 }));
  }
  g.add(place(box(tw + 0.3, 0.3, tw + 0.3, white), { x: tx, y: y0 + towerH, z: tz }));
  // rotating beacon + obstruction light on top
  g.add(place(cylinder(0.12, 0.12, 0.5, steel, 6), { x: tx, y: y0 + towerH + 0.3, z: tz }));
  g.add(place(sphere(0.22, emissive(PALETTE.red, 1.5), 8), { x: tx, y: y0 + towerH + 0.75, z: tz }));
  // bridge from tower to deck
  const bx0 = dx + R - 0.2, bx1 = tx - tw / 2;
  const bLen = bx1 - bx0;
  g.add(place(box(bLen, 0.25, 1.2, concrete), { x: (bx0 + bx1) / 2, y: deckY - 0.25, z: tz }));
  for (const s of [-1, 1]) {
    g.add(place(box(bLen, 0.06, 0.06, steelLight), { x: (bx0 + bx1) / 2, y: deckY + 1.0, z: tz + s * 0.6 }));
    g.add(place(box(bLen, 0.9, 0.03, glass(PALETTE.glassSky, { opacity: 0.4 })), { x: (bx0 + bx1) / 2, y: deckY, z: tz + s * 0.6 }));
  }

  // ---- small terminal --------------------------------------------------------
  const kx = 2.2, kz = 1.75, kw = 5.0, kd = 3.3, kh = 3.2;
  g.add(place(facadeBlock({ w: kw, d: kd, h: kh, floorHeight: kh, style: 'curtain', wall: PALETTE.white, glass: PALETTE.glassTeal, frame: PALETTE.white, bay: 1.25, lit: 0.5, seed: 3, roof: PALETTE.concreteDark, blank: ['back'] }), { x: kx, y: y0, z: kz }));
  g.add(place(parapet({ w: kw, d: kd, h: 0.4, t: 0.2, material: mat(PALETTE.navy) }), { x: kx, y: y0 + kh, z: kz }));
  g.add(place(box(kw + 0.02, 0.3, kd + 0.02, mat(PALETTE.navy)), { x: kx, y: y0 + kh - 0.3, z: kz }));
  // entrance canopy + doors + sign
  g.add(place(box(2.6, 0.18, 1.3, white), { x: kx + 0.6, y: y0 + 2.5, z: kz + kd / 2 + 0.65 }));
  for (const sx of [-1, 1]) g.add(place(box(0.1, 2.5, 0.1, steelLight), { x: kx + 0.6 + sx * 1.2, y: y0, z: kz + kd / 2 + 1.2 }));
  g.add(place(door({ w: 1.4, h: 2.2, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { x: kx + 0.6, y: y0, z: kz + kd / 2 }));
  g.add(place(bigSign('HELIPORT', 3.8, 0.75, { bg: PALETTE.navy, fg: '#ffffff' }), { x: kx + 0.3, y: y0 + kh + 0.4, z: kz + kd / 2 - 0.2 }));
  // round H logo on the terminal's side wall
  const logo = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 20).rotateZ(Math.PI / 2), [mat(PALETTE.navy), mat(PALETTE.navy), textured(signTexture('H', { bg: PALETTE.navy, fg: '#ffffff', width: 64, height: 64, border: PALETTE.yellow }))]);
  g.add(place(logo, { x: kx + kw / 2 + 0.03, y: y0 + 2.2, z: kz }));

  // ---- ground: forecourt, taxi, fuel, landscaping ----------------------------
  g.add(place(patch(6.6, 1.7, 'paved'), { x: 1.7, y: y0, z: 4.15 }));
  g.add(place(patch(2.2, 3.4, 'paved'), { x: dx, y: y0, z: dz }));
  g.add(place(patch(1.2, 3.2, 'paved'), { x: dx + 0.2, y: y0, z: 2.3 }));
  g.add(place(car({ kind: 'taxi' }), { x: 3.3, y: y0 + 0.05, z: 4.3, s: 0.62 }));
  g.add(place(bench({ w: 1.3 }), { x: 0.1, y: y0, z: 4.0, ry: 180 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -1.6, y: y0, z: 4.4, ry: 0 }));

  // aviation fuel tank behind a wire fence (back-right corner)
  g.add(place(patch(2.6, 2.4, 'concrete'), { x: 3.55, y: y0, z: -3.6 }));
  g.add(place(tank({ radius: 0.7, h: 1.4, roof: 'dome', material: mat(PALETTE.white) }), { x: 3.2, y: y0 + 0.05, z: -3.6 }));
  g.add(place(cylinder(0.72, 0.72, 0.25, mat(PALETTE.red), 16), { x: 3.2, y: y0 + 0.9, z: -3.6 }));
  g.add(place(box(0.5, 0.9, 0.4, mat(PALETTE.red)), { x: 4.35, y: y0 + 0.05, z: -3.2 }));
  g.add(place(fence({ w: 2.6, d: 2.4, h: 1.0, style: 'wire' }), { x: 3.55, y: y0, z: -3.6 }));

  // trees & bushes
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 12 }), { x: -3.4, y: y0, z: 3.5 }));
  g.add(place(tree({ kind: 'cone', h: 5.5, seed: 13 }), { x: -3.6, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 14 }), { x: -3.0, y: y0, z: 2.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 15 }), { x: 1.2, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 16 }), { x: -4.3, y: y0, z: 0.5 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, sawtoothRoof, parapet, rooftopUnits, smokestack, box, place, group,
  pipeRun, signTexture, textured, flag, streetLamp, tree, fence, car, surface, mat, metal, glass, emissive,
} from '../../src/lib/index.js';

const BRAND = 'TINY MOTORS';

// Sign with text faces that keep 0..1 UVs (lib sign() boxes use metre UVs, which
// shrinks a clamped text texture into one corner). Text faces +Z.
function textSign({ text, w, h, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const g = new THREE.Group();
  g.add(box(w, h, depth, mat(bg)));
  const front = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.98, h * 0.96), face);
  front.position.set(0, h / 2, depth / 2 + 0.01);
  g.add(front);
  if (double) {
    const back = front.clone();
    back.position.z = -depth / 2 - 0.01;
    back.rotation.y = Math.PI;
    g.add(back);
  }
  return g;
}

// Roller shutter door on a +Z facing wall: grey slab with horizontal slats.
function rollerDoor(w, h) {
  const g = new THREE.Group();
  g.add(box(w + 0.4, h + 0.3, 0.12, mat(PALETTE.darkGrey)));
  g.add(place(box(w, h, 0.1, mat(PALETTE.steelLight)), { z: 0.06 }));
  for (let y = 0.4; y < h; y += 0.45) g.add(place(box(w, 0.05, 0.06, mat(PALETTE.steel)), { y, z: 0.12 }));
  return g;
}

// Two-deck car transporter, ~10.4 m long along X, cab at +X.
function carTransporter(colors) {
  const g = new THREE.Group();
  const frameM = metal(PALETTE.steelDark, { roughness: 0.5 });
  const cabM = mat(PALETTE.red, { roughness: 0.45, metalness: 0.2 });
  // cab
  g.add(place(box(2.2, 2.3, 2.3, cabM), { x: 4.0, y: 0.6 }));
  g.add(place(box(0.05, 0.9, 2.0, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 5.11, y: 1.8 }));
  g.add(place(box(1.4, 0.5, 2.3, mat(PALETTE.white)), { x: 3.7, y: 2.9 }));
  // chassis and decks
  g.add(place(box(10, 0.35, 1.2, frameM), { x: -0.2, y: 0.45 }));
  g.add(place(box(7.6, 0.12, 2.4, frameM), { x: -1.2, y: 0.85 }));
  g.add(place(box(7.6, 0.12, 2.4, frameM), { x: -1.2, y: 2.55 }));
  for (const x of [-4.9, -2.4, 0.1, 2.5]) for (const z of [-1.15, 1.15]) {
    g.add(place(box(0.12, 1.8, 0.12, frameM), { x, y: 0.85, z }));
  }
  // rails on the upper deck
  for (const z of [-1.15, 1.15]) g.add(place(box(7.6, 0.08, 0.08, mat(PALETTE.yellow)), { x: -1.2, y: 3.05, z }));
  // wheels
  const wheelM = mat(PALETTE.black);
  for (const x of [4.2, -3.2, -4.3]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 10);
    wgeo.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wgeo, wheelM);
    w.position.set(x, 0.45, sz * 1.0);
    g.add(w);
  }
  // cargo: two cars per deck
  [[-3.0, 0.97], [0.6, 0.97], [-3.0, 2.67], [0.6, 2.67]].forEach(([x, y], i) => {
    g.add(place(car({ color: colors[i % colors.length] }), { x, y, s: 0.78 }));
  });
  return g;
}

// 3x2 tiles (30 x 20 m). Front (street) faces +Z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 2], 'concrete'));

  const white = PALETTE.white;
  const roofWhite = surface('corrugated', '#e9ecef', { size: 1.6 });
  const roofGlass = glass(PALETTE.glassSky);
  const stripeRed = mat(PALETTE.red, { roughness: 0.5 });

  // ── assembly halls: one long white shed under two sawtooth roofs ─────────
  const hx = -5.3, hz = -4.7, hw = 18.6, hd = 9.8, hh = 6;
  g.add(place(facadeBlock({
    w: hw, d: hd, h: hh, floorHeight: hh, style: 'industrial', wall: white, glass: PALETTE.glassSky,
    frame: PALETTE.steelLight, bay: 2.6, lit: 0, seed: 54, roof: PALETTE.concrete,
  }), { x: hx, y: y0, z: hz }));
  // red brand band + fascia
  g.add(place(box(hw + 0.12, 0.45, hd + 0.12, stripeRed), { x: hx, y: y0 + 3.6, z: hz }));
  g.add(place(parapet({ w: hw + 0.2, d: hd + 0.2, h: 0.5, t: 0.25, material: mat(PALETTE.offWhite) }), { x: hx, y: y0 + hh, z: hz }));
  // two halls side by side, firewall between them
  const halfW = (hw - 0.6) / 2;
  for (const sx of [-1, 1]) {
    g.add(place(sawtoothRoof({ w: halfW - 0.2, d: hd - 0.4, h: 2.1, teeth: 4, material: roofWhite, glassMaterial: roofGlass }), {
      x: hx + sx * (halfW / 2 + 0.15), y: y0 + hh, z: hz,
    }));
  }
  g.add(place(box(0.5, 2.6, hd + 0.2, mat(PALETTE.offWhite)), { x: hx, y: y0 + hh, z: hz }));
  // roller doors + canopy and the big brand sign
  const hallFront = hz + hd / 2;
  for (const x of [-12.6, -9.0, 1.8]) {
    g.add(place(rollerDoor(3.0, 3.1), { x, y: y0, z: hallFront }));
    g.add(place(box(3.8, 0.15, 1.3, mat(PALETTE.steelLight)), { x, y: y0 + 3.4, z: hallFront + 0.65 }));
  }
  g.add(place(textSign({ text: BRAND, w: 7.6, h: 1.6, bg: PALETTE.navy, fg: '#ffffff' }), { x: -3.6, y: y0 + 4.15, z: hallFront + 0.1 }));
  // personnel doors + office windows under the sign
  for (const x of [-5.6, -1.6]) g.add(place(box(1.1, 2.2, 0.1, mat(PALETTE.navy)), { x, y: y0, z: hallFront + 0.05 }));
  g.add(place(box(2.6, 1.2, 0.08, glass(PALETTE.glassBlue)), { x: -3.6, y: y0 + 1.1, z: hallFront + 0.04 }));

  // ── paint shop: taller blue block with exhaust stacks ────────────────────
  const px = 10.3, pz = -5.3, pw = 8.6, pd = 8.6, ph = 8;
  g.add(place(facadeBlock({
    w: pw, d: pd, h: ph, floorHeight: 4, style: 'industrial', wall: PALETTE.plasterBlue, glass: PALETTE.glassSky,
    frame: PALETTE.white, bay: 2.8, lit: 0, seed: 55, roof: PALETTE.concreteDark,
  }), { x: px, y: y0, z: pz }));
  g.add(place(box(pw + 0.12, 0.35, pd + 0.12, mat(PALETTE.white)), { x: px, y: y0 + 3.85, z: pz }));
  // paint-colour bands under the parapet
  [PALETTE.red, PALETTE.yellow, PALETTE.blue].forEach((c, i) => {
    g.add(place(box(pw + 0.1, 0.22, pd + 0.1, mat(c)), { x: px, y: y0 + 7.0 + i * 0.26, z: pz }));
  });
  g.add(place(parapet({ w: pw + 0.2, d: pd + 0.2, h: 0.6, t: 0.25, material: mat(PALETTE.white) }), { x: px, y: y0 + ph, z: pz }));
  g.add(place(textSign({ text: 'PAINT SHOP', w: 4.6, h: 0.9, bg: PALETTE.navy, fg: '#ffffff' }), { x: px, y: y0 + 5.2, z: pz + pd / 2 + 0.05 }));
  g.add(place(rollerDoor(3, 3.2), { x: px - 1.6, y: y0, z: pz + pd / 2 }));
  // exhaust stacks, filter housings, ducts
  const roofY = y0 + ph;
  for (const [x, z] of [[8.2, -8.0], [12.4, -8.0]]) {
    g.add(place(box(1.8, 1.2, 1.8, mat(PALETTE.lightGrey)), { x, y: roofY, z }));
    g.add(place(smokestack({ radius: 0.45, topRadius: 0.4, h: 6, color: PALETTE.steelLight, bandColor: PALETTE.red, bands: 1, segments: 10 }), { x, y: roofY + 1.2, z }));
  }
  g.add(place(box(5.6, 1.1, 1.6, mat(PALETTE.steelLight)), { x: px, y: roofY, z: -4.4 }));
  g.add(pipeRun([[8.2, roofY + 0.8, -7.1], [8.2, roofY + 0.8, -4.4]], 0.3));
  g.add(pipeRun([[12.4, roofY + 0.8, -7.1], [12.4, roofY + 0.8, -4.4]], 0.3));
  g.add(place(rooftopUnits({ w: 7.6, d: 2.6, count: 2, seed: 7 }), { x: px, y: roofY, z: -2.2 }));

  // conveyor bridge carrying bodies from the halls to the paint shop
  const bx = (hx + hw / 2 + px - pw / 2) / 2;
  const bw = px - pw / 2 - (hx + hw / 2) + 0.4;
  g.add(place(facadeBlock({ w: bw, d: 2.6, h: 2.2, floorHeight: 2.2, style: 'ribbon', wall: PALETTE.steelLight, glass: PALETTE.glassSky, frame: PALETTE.white, bay: 1, lit: 0, roof: PALETTE.steel }), { x: bx, y: y0 + 3.6, z: -5 }));

  // ── car storage lot: rows of brand-new cars ──────────────────────────────
  g.add(place(patch(19.4, 7.0, 'asphalt'), { x: -5.1, y: y0, z: 6.15 }));
  g.add(place(patch(19.4, 2.4, 'concrete'), { x: -5.1, y: y0, z: 1.4 }));
  const lineM = mat(PALETTE.roadLine);
  const rowColors = [
    [PALETTE.red, PALETTE.red, PALETTE.red, PALETTE.red, PALETTE.red, PALETTE.white, PALETTE.white, PALETTE.white, PALETTE.white, PALETTE.white],
    [PALETTE.blue, PALETTE.blue, PALETTE.blue, PALETTE.blue, PALETTE.blue, PALETTE.yellow, PALETTE.yellow, PALETTE.yellow, PALETTE.yellow, '#b9c0c8'],
  ];
  const carStep = 1.85, carX0 = -13.6;
  rowColors.forEach((colors, row) => {
    const z = row === 0 ? 4.55 : 7.95;
    colors.forEach((color, i) => {
      g.add(place(car({ color }), { x: carX0 + i * carStep, y: y0 + 0.05, z, ry: row === 0 ? 90 : -90, s: 0.74 }));
    });
    for (let i = 0; i <= colors.length; i++) {
      g.add(place(box(0.08, 0.02, 3.2, lineM), { x: carX0 - carStep / 2 + i * carStep, y: y0 + 0.06, z }));
    }
  });
  // car leaving the line through the right-hand door
  g.add(place(car({ color: PALETTE.green }), { x: 1.8, y: y0 + 0.05, z: 1.6, ry: -90, s: 0.74 }));

  // ── yard: transporter lane, gatehouse, flags, sign, trees ────────────────
  g.add(place(patch(10.6, 4.4, 'asphalt'), { x: 9.6, y: y0, z: 1.3 }));
  g.add(place(patch(4.6, 6.4, 'asphalt'), { x: 12.3, y: y0, z: 6.7 }));
  g.add(place(patch(6.0, 6.2, 'grass'), { x: 7.0, y: y0, z: 6.8 }));
  g.add(place(carTransporter([PALETTE.red, PALETTE.white, PALETTE.blue, PALETTE.yellow]), { x: 9.5, y: y0, z: 1.3, s: 0.98 }));

  // gatehouse with barrier
  g.add(place(box(1.8, 2.4, 1.8, mat(PALETTE.white)), { x: 14.0, y: y0, z: 6.6 }));
  g.add(place(box(1.84, 0.7, 1.84, glass(PALETTE.glassBlue)), { x: 14.0, y: y0 + 1.2, z: 6.6 }));
  g.add(place(box(2.2, 0.2, 2.2, mat(PALETTE.red)), { x: 14.0, y: y0 + 2.4, z: 6.6 }));
  g.add(place(box(0.25, 1.0, 0.25, mat(PALETTE.darkGrey)), { x: 13.3, y: y0, z: 8.4 }));
  g.add(place(box(3.6, 0.12, 0.12, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.6 })), { x: 11.6, y: y0 + 0.95, z: 8.4 }));

  // brand pylon + flags on the lawn
  g.add(place(box(0.4, 3.2, 0.4, mat(PALETTE.steelLight)), { x: 5.4, y: y0, z: 8.6 }));
  g.add(place(textSign({ text: BRAND, w: 3.6, h: 1.1, bg: PALETTE.red, fg: '#ffffff', double: true }), { x: 5.4, y: y0 + 3.2, z: 8.6 }));
  for (const [i, x] of [6.9, 7.9, 8.9].entries()) {
    g.add(place(flag({ h: 5.5, color: [PALETTE.navy, PALETTE.red, PALETTE.navy][i], color2: PALETTE.white }), { x, y: y0, z: 9.1 }));
  }
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 31 }), { x: 6.2, y: y0, z: 5.2 }));
  g.add(place(tree({ kind: 'round', h: 4.0, seed: 32 }), { x: 8.8, y: y0, z: 5.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 33 }), { x: 7.4, y: y0, z: 7.6 }));

  // lamps along the apron, fence along the street side of the car lot
  for (const x of [-14.2, -7.3, 3.9]) g.add(place(streetLamp({ h: 5 }), { x, y: y0, z: 2.75, ry: 90 }));
  g.add(place(fence({ w: 19.6, d: 0.1, h: 1.2, style: 'wire', sides: ['front'] }), { x: -5.1, y: y0, z: 9.82 }));
  g.add(place(fence({ w: 0.1, d: 7.2, h: 1.2, style: 'wire', sides: ['left'] }), { x: -14.86, y: y0, z: 6.2 }));
  return g;
}

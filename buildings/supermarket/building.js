import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, parapet, rooftopUnits, box, cylinder, place, group,
  tree, hedge, car, truck, streetLamp, bench, mat, metal, glass, emissive,
  textured, canvasTexture, signTexture, rng, SWATCHES,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Store box at the back, entrance walk, car park in front, delivery lane on the right.

const BRAND = '#2f9a46';
const BRAND_DARK = '#226f33';

/** Giant "TINYMART" logo: yellow trolley badge + white lettering on brand green. */
function logoMaterial() {
  const tex = canvasTexture(512, 144, (ctx, W, H) => {
    ctx.fillStyle = BRAND;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    // badge
    const cx = 78, cy = H / 2, r = 50;
    ctx.fillStyle = PALETTE.yellow;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = PALETTE.red;
    ctx.lineWidth = 7;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx - 34, cy - 24);
    ctx.lineTo(cx - 22, cy - 24);
    ctx.lineTo(cx - 12, cy + 14);
    ctx.lineTo(cx + 26, cy + 14);
    ctx.lineTo(cx + 32, cy - 12);
    ctx.lineTo(cx - 17, cy - 12);
    ctx.stroke();
    ctx.fillStyle = PALETTE.red;
    for (const dx of [-6, 20]) {
      ctx.beginPath();
      ctx.arc(cx + dx, cy + 26, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    // lettering
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    let size = 92;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText('TINYMART').width > W - 160 && size > 10) ctx.font = `bold ${--size}px sans-serif`;
    ctx.fillText('TINYMART', 142, H / 2 + 4);
  }, { key: 'supermarket:logo', repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.18, emissiveMap: tex });
}

/** Flat picture facing +z, base at y = 0 (box() UVs are in metres, so textures go on a plane). */
function facePlane(w, h, material) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), material);
  m.position.y = h / 2;
  return m;
}

/** Sign box with a texture on the front (and back when double). */
function panel(w, h, depth, face, sideColor, double = false) {
  const g = group(box(w, h, depth, mat(sideColor)));
  g.add(place(facePlane(w, h, face), { z: depth / 2 + 0.01 }));
  if (double) g.add(place(facePlane(w, h, face), { z: -depth / 2 - 0.01, ry: 180 }));
  return g;
}

/** Logo sign box; logo on the front (+z), plain green elsewhere. */
function logoSign(w, h, depth = 0.3, double = false) {
  return panel(w, h, depth, logoMaterial(), BRAND_DARK, double);
}

/** Text sign (replacement for the lib sign() so the text is not stretched). */
function textSign({ text, w, h, bg, fg, depth = 0.1, double = false }) {
  const tw = 256, th = Math.max(16, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th });
  return panel(w, h, depth, textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }), bg, double);
}

/** A row of n nested shopping trolleys, length along +x, handles at +x. */
function trolleyRow(n) {
  const wire = metal(PALETTE.chrome, { roughness: 0.3 });
  const len = 0.95 + (n - 1) * 0.32;
  return group(
    place(box(len, 0.08, 0.5, mat(PALETTE.darkGrey)), { y: 0.12 }),
    place(box(len, 0.5, 0.56, wire), { y: 0.42 }),
    place(box(0.12, 0.1, 0.6, mat(PALETTE.red)), { x: len / 2 + 0.05, y: 0.95 }),
    place(box(0.05, 0.4, 0.05, wire), { x: len / 2 + 0.02, y: 0.55, z: 0.25 }),
    place(box(0.05, 0.4, 0.05, wire), { x: len / 2 + 0.02, y: 0.55, z: -0.25 }),
  );
}

/** Trolley bay shelter: posts + green roof over two rows of trolleys. Long side along x. */
function trolleyShelter(w, d, h = 2.2, n = 6) {
  const post = metal(PALETTE.steelLight);
  const g = group(
    place(box(w + 0.3, 0.14, d + 0.3, mat(BRAND)), { y: h }),
    place(box(w + 0.32, 0.3, 0.08, mat(PALETTE.white)), { y: h - 0.1, z: (d + 0.3) / 2 }),
  );
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.1, h, 0.1, post), { x: sx * w / 2, z: sz * d / 2 }));
  }
  g.add(place(box(w, 0.06, 0.06, post), { y: 0.8, z: -d / 2 }));
  for (const z of [-d / 4, d / 4]) g.add(place(trolleyRow(n), { x: -0.1, z }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = TILE;
  const r = rng(1414);
  g.add(lot([2, 2], 'asphalt'));

  // --- store box -----------------------------------------------------------
  const SX0 = -9.6, SX1 = 6.0, SZ0 = -9.6, SZ1 = -2.4;
  const sw = SX1 - SX0, sd = SZ1 - SZ0, cx = (SX0 + SX1) / 2, cz = (SZ0 + SZ1) / 2;
  const H = 5.4;
  g.add(place(facadeBlock({ w: sw, d: sd, h: H, floorHeight: H, style: 'plain', wall: PALETTE.white, roof: PALETTE.lightGrey }), { x: cx, y: y0, z: cz }));
  // brand-green fascia band + red pinstripe all round, doubling as the parapet
  g.add(place(parapet({ w: sw + 0.14, d: sd + 0.14, h: 1.7, t: 0.3, material: mat(BRAND) }), { x: cx, y: y0 + H - 1.2, z: cz }));
  g.add(place(parapet({ w: sw + 0.16, d: sd + 0.16, h: 0.3, t: 0.3, material: mat(PALETTE.red) }), { x: cx, y: y0 + H - 1.55, z: cz }));
  g.add(place(parapet({ w: sw + 0.18, d: sd + 0.18, h: 0.12, t: 0.32, material: mat(PALETTE.white) }), { x: cx, y: y0 + H + 0.5, z: cz }));
  // plinth
  g.add(place(box(sw + 0.1, 0.35, sd + 0.1, mat(PALETTE.concreteDark)), { x: cx, y: y0, z: cz }));

  // roof: skylight strips + plant
  for (const x of [cx - 4.5, cx - 1.5, cx + 1.5]) {
    g.add(place(box(1.3, 0.45, 3.2, glass(PALETTE.glassSky)), { x, y: y0 + H, z: cz + 1.2 }));
  }
  g.add(place(rooftopUnits({ w: 9, d: 2.4, count: 5, seed: 7 }), { x: cx - 1.5, y: y0 + H, z: SZ0 + 1.6 }));
  g.add(place(box(2.6, 1.3, 1.8, mat(PALETTE.steelLight)), { x: cx + 5.2, y: y0 + H, z: cz + 0.4 }));
  g.add(place(cylinder(0.55, 0.55, 0.25, mat(PALETTE.darkGrey), 12), { x: cx + 4.6, y: y0 + H + 1.3, z: cz + 0.4 }));
  g.add(place(cylinder(0.55, 0.55, 0.25, mat(PALETTE.darkGrey), 12), { x: cx + 5.8, y: y0 + H + 1.3, z: cz + 0.4 }));

  // shop-window glazing either side of the entrance
  const glazeY = y0 + 0.35, glazeH = 2.7;
  const glazeM = glass(PALETTE.glassBlue);
  const mullM = mat(PALETTE.steelLight);
  for (const [a, b] of [[SX0 + 0.5, cx - 2.7], [cx + 2.7, SX1 - 0.5]]) {
    const w = b - a, mx = (a + b) / 2;
    g.add(place(box(w, glazeH, 0.08, glazeM), { x: mx, y: glazeY, z: SZ1 + 0.04 }));
    g.add(place(box(w + 0.1, 0.12, 0.14, mullM), { x: mx, y: glazeY + glazeH, z: SZ1 + 0.06 }));
    g.add(place(box(w + 0.1, 0.12, 0.14, mullM), { x: mx, y: glazeY - 0.06, z: SZ1 + 0.06 }));
    const n = Math.round(w / 1.6);
    for (let i = 0; i <= n; i++) g.add(place(box(0.1, glazeH, 0.14, mullM), { x: a + (w * i) / n, y: glazeY, z: SZ1 + 0.06 }));
  }
  // window posters
  const posters = [['SALE', PALETTE.red, '#ffffff'], ['2 FOR 1', PALETTE.yellow, PALETTE.red], ['FRESH', BRAND, '#ffffff'], ['-50%', PALETTE.red, PALETTE.yellow]];
  [[SX0 + 2.0, 0], [SX0 + 5.2, 1], [SX1 - 1.4, 2], [cx + 3.6, 3]].forEach(([x, i]) => {
    const [text, bg, fg] = posters[i];
    g.add(place(textSign({ text, w: 1.1, h: 0.75, bg, fg, depth: 0.04 }), { x, y: glazeY + 1.0, z: SZ1 + 0.1 }));
  });

  // glass entrance vestibule with sliding doors and flat canopy
  const vw = 4.8, vd = 1.8, vh = 3.3;
  const vz = SZ1 + vd / 2;
  g.add(place(box(vw, vh, vd, glass(PALETTE.glassSky)), { x: cx, y: y0, z: vz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.14, vh, 0.14, mullM), { x: cx + sx * (vw / 2 - 0.05), y: y0, z: vz + sz * (vd / 2 - 0.05) }));
  }
  g.add(place(box(2.6, 2.5, 0.06, glass(PALETTE.glassDark)), { x: cx, y: y0, z: SZ1 + vd + 0.01 }));
  g.add(place(box(0.08, 2.5, 0.1, mullM), { x: cx, y: y0, z: SZ1 + vd + 0.03 }));
  g.add(place(box(vw + 1.6, 0.3, vd + 1.0, mat(PALETTE.white)), { x: cx, y: y0 + vh, z: SZ1 + (vd + 1.0) / 2 }));
  g.add(place(box(vw + 1.62, 0.18, vd + 1.02, mat(BRAND)), { x: cx, y: y0 + vh + 0.3, z: SZ1 + (vd + 1.0) / 2 }));
  g.add(place(textSign({ text: 'WELCOME', w: 2.6, h: 0.45, bg: PALETTE.white, fg: BRAND_DARK, depth: 0.05 }), { x: cx, y: y0 + vh - 0.55, z: SZ1 + vd + 0.04 }));
  g.add(place(box(vw + 0.6, 0.04, 1.4, mat(PALETTE.darkGrey)), { x: cx, y: y0, z: SZ1 + vd + 0.7 })); // doormat

  // giant logo sign standing on the front parapet (and smaller ones on the sides)
  g.add(place(logoSign(10.0, 2.8, 0.35), { x: cx, y: y0 + H + 0.62, z: SZ1 + 0.02 }));
  for (const sx of [-2.8, 2.8]) {
    g.add(place(box(0.15, 2.2, 1.6, metal(PALETTE.steelDark)), { x: cx + sx, y: y0 + H + 0.5, z: SZ1 - 0.95 }));
  }
  g.add(place(logoSign(5.2, 1.45, 0.2), { x: SX0 - 0.1, y: y0 + H - 1.15, z: cz, ry: -90 }));
  g.add(place(logoSign(4.0, 1.12, 0.2), { x: cx, y: y0 + H - 1.0, z: SZ0 - 0.1, ry: 180 }));

  // service side (right): roll-up delivery doors
  for (const z of [-8.0, -5.2]) {
    g.add(place(box(0.12, 3.2, 2.4, mat(PALETTE.steel)), { x: SX1 + 0.06, y: y0 + 0.1, z }));
    for (let i = 1; i < 6; i++) g.add(place(box(0.16, 0.05, 2.4, mat(PALETTE.steelDark)), { x: SX1 + 0.06, y: y0 + 0.1 + i * 0.53, z }));
    g.add(place(box(0.4, 0.4, 2.8, mat(PALETTE.black)), { x: SX1 + 0.2, y: y0 + 0.9, z }));
  }
  g.add(place(box(0.12, 2.2, 1.0, mat(PALETTE.steelDark)), { x: SX1 + 0.06, y: y0, z: -3.4 }));

  // --- entrance walk -------------------------------------------------------
  g.add(place(patch(sw, 2.45, 'paved', 0.12), { x: cx, y: y0, z: SZ1 + 1.22 }));
  g.add(place(box(sw, 0.14, 0.18, mat(PALETTE.concrete)), { x: cx, y: y0, z: -0.04 })); // kerb
  const wy = y0 + 0.12;
  g.add(place(trolleyShelter(3.4, 1.5, 2.2, 6), { x: SX0 + 2.3, y: wy, z: -1.15 }));
  // bollards along the kerb
  for (let x = cx - 2.4; x <= cx + 2.41; x += 1.2) {
    g.add(place(cylinder(0.12, 0.12, 0.8, mat(PALETTE.yellow), 8), { x, y: wy, z: -0.35 }));
  }
  // ice chest, gas cage, bins, bench
  const iceX = cx + 3.4;
  g.add(place(box(1.5, 1.1, 0.75, mat(PALETTE.white)), { x: iceX, y: wy, z: SZ1 + 0.45 }));
  g.add(place(textSign({ text: 'ICE', w: 1.2, h: 0.4, bg: PALETTE.blue, fg: '#ffffff', depth: 0.03 }), { x: iceX, y: wy + 0.55, z: SZ1 + 0.83 }));
  g.add(place(box(1.2, 1.3, 0.7, mat(PALETTE.steelDark)), { x: iceX + 1.8, y: wy, z: SZ1 + 0.4 }));
  for (let i = 0; i < 3; i++) g.add(place(cylinder(0.17, 0.17, 0.9, mat(PALETTE.orange), 8), { x: iceX + 1.4 + i * 0.4, y: wy, z: SZ1 + 0.82 }));
  g.add(place(bench({ w: 1.6 }), { x: SX1 - 1.3, y: wy, z: SZ1 + 0.5 }));
  for (const [x, c] of [[cx - 3.0, PALETTE.green], [cx - 3.6, PALETTE.blue]]) {
    g.add(place(box(0.5, 0.9, 0.5, mat(c)), { x, y: wy, z: SZ1 + 0.4 }));
  }
  // flower/plant display
  for (let i = 0; i < 3; i++) {
    const x = cx - 5.2 + i * 0.7;
    g.add(place(box(0.6, 0.45, 0.6, mat(PALETTE.woodLight)), { x, y: wy, z: SZ1 + 0.45 }));
    g.add(place(tree({ kind: 'bush', h: 0.7, seed: 30 + i, color: [PALETTE.red, PALETTE.yellow, PALETTE.pink][i] }), { x, y: wy + 0.45, z: SZ1 + 0.45 }));
  }

  // --- car park ------------------------------------------------------------
  const BAY = 2.3, BAYS = 6, PX0 = -7.8;
  const rows = [{ z0: 0.25, z1: 4.05, ry: 90 }, { z0: 5.95, z1: 9.75, ry: -90 }];
  const lineM = mat(PALETTE.roadLine);
  rows.forEach((row, ri) => {
    const zc = (row.z0 + row.z1) / 2, rd = row.z1 - row.z0;
    const backZ = ri === 0 ? row.z0 : row.z1;
    g.add(place(box(BAYS * BAY, 0.02, 0.1, lineM), { x: PX0 + (BAYS * BAY) / 2, y: y0, z: backZ }));
    for (let i = 0; i <= BAYS; i++) g.add(place(box(0.1, 0.02, rd, lineM), { x: PX0 + i * BAY, y: y0, z: zc }));
    for (let i = 0; i < BAYS; i++) {
      const x = PX0 + (i + 0.5) * BAY;
      if (ri === 0 && i === 2) {
        // trolley return bay
        g.add(place(trolleyShelter(1.5, 3.0, 2.0, 5), { x, y: y0, z: zc - 0.1, ry: 90 }));
        continue;
      }
      if (ri === 1 && i === 4) continue; // one free space
      const kind = r.chance(0.15) ? 'van' : 'car';
      const c = car({ color: r.pick(SWATCHES.cars), kind });
      g.add(place(c, { x: x + r.range(-0.1, 0.1), y: y0, z: zc + r.range(-0.2, 0.2), ry: row.ry + r.range(-3, 3), s: 0.8 }));
    }
  });
  // disabled bay marking on the free space
  g.add(place(box(1.4, 0.03, 1.4, mat(PALETTE.blue)), { x: PX0 + 4.5 * BAY, y: y0, z: 7.85 }));
  g.add(place(box(0.8, 0.035, 0.8, mat(PALETTE.white)), { x: PX0 + 4.5 * BAY, y: y0, z: 7.85 }));
  // aisle arrows / centre dashes
  for (let x = PX0 + 0.6; x < PX0 + BAYS * BAY; x += 2.0) g.add(place(box(1.0, 0.02, 0.12, lineM), { x, y: y0, z: 5.0 }));

  // left landscaped island with trees, lamp and pylon sign
  const islW = PX0 + half;
  const islX = -half + islW / 2;
  g.add(place(box(islW, 0.2, 9.9, mat(PALETTE.concrete)), { x: islX, y: y0, z: 5.0 }));
  g.add(place(patch(islW - 0.3, 9.6, 'grass', 0.24), { x: islX, y: y0, z: 5.0 }));
  g.add(place(tree({ kind: 'round', h: 4.0, seed: 4 }), { x: islX + 0.2, y: y0 + 0.2, z: 1.6 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 9 }), { x: islX + 0.2, y: y0 + 0.2, z: 6.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 12 }), { x: islX + 0.3, y: y0 + 0.2, z: 3.9 }));
  g.add(place(streetLamp({ h: 5 }), { x: islX + 0.6, y: y0 + 0.2, z: 4.4 }));
  // pylon (totem) sign at the street corner
  const py = y0 + 0.2;
  g.add(place(box(0.35, 4.2, 0.35, metal(PALETTE.steelDark)), { x: islX - 0.5, y: py, z: 9.0 }));
  g.add(place(box(0.35, 4.2, 0.35, metal(PALETTE.steelDark)), { x: islX + 0.5, y: py, z: 9.0 }));
  g.add(place(logoSign(2.0, 0.6, 0.3, true), { x: islX, y: py + 4.0, z: 9.0 }));
  g.add(place(textSign({ text: 'OPEN 7-22', w: 1.8, h: 0.45, bg: PALETTE.white, fg: BRAND_DARK, depth: 0.25, double: true }), { x: islX, y: py + 3.45, z: 9.0 }));
  g.add(place(textSign({ text: 'P', w: 0.6, h: 0.6, bg: PALETTE.blue, fg: '#ffffff', depth: 0.1, double: true }), { x: islX, y: py + 2.7, z: 9.0 }));

  // --- delivery lane (right) -----------------------------------------------
  const LX0 = SX1, LX1 = 9.0;
  for (let z = -8; z <= 8; z += 2.4) g.add(place(box(0.1, 0.021, 1.2, mat(PALETTE.yellow)), { x: LX0 + 0.25, y: y0, z }));
  g.add(place(truck({ color: BRAND, trailerColor: PALETTE.white }), { x: 7.85, y: y0, z: -5.3, ry: -90, s: 0.82 }));
  g.add(place(textSign({ text: 'TINYMART', w: 4.6, h: 1.0, bg: '#ffffff', fg: BRAND, depth: 0.04 }), { x: 8.91, y: y0 + 1.9, z: -5.3 - 1.15, ry: 90 }));
  // roll cages and a pallet of boxes by the dock
  for (const z of [-1.5, -0.7]) g.add(place(box(0.6, 1.6, 0.75, metal(PALETTE.steelLight)), { x: SX1 + 0.4, y: y0, z }));
  g.add(place(box(0.8, 0.15, 0.8, mat(PALETTE.woodLight)), { x: SX1 + 0.45, y: y0, z: -2.6 }));
  g.add(place(box(0.7, 0.9, 0.7, mat(PALETTE.sandstone)), { x: SX1 + 0.45, y: y0 + 0.15, z: -2.6 }));

  // right verge: grass strip, hedge, trees, lamp
  const vX = (LX1 + half) / 2, vW = half - LX1;
  g.add(place(box(vW, 0.2, 19.9, mat(PALETTE.concrete)), { x: vX, y: y0, z: 0 }));
  g.add(place(patch(vW - 0.2, 19.6, 'grass', 0.24), { x: vX, y: y0, z: 0 }));
  g.add(place(hedge({ w: 11, h: 0.9, d: 0.6 }), { x: vX, y: y0 + 0.2, z: -4.2, ry: 90 }));
  g.add(place(tree({ kind: 'poplar', h: 4.6, seed: 21 }), { x: vX, y: y0 + 0.2, z: 3.0 }));
  g.add(place(tree({ kind: 'poplar', h: 4.0, seed: 22 }), { x: vX, y: y0 + 0.2, z: 8.6 }));
  g.add(place(streetLamp({ h: 5 }), { x: vX, y: y0 + 0.2, z: 5.6, ry: 180 }));

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, door, facadeBlock, parapet, rooftopUnits, box, cylinder, place, group,
  tree, car, hedge, streetLamp, bench, pipeRun,
  mat, metal, emissive, textured, canvasTexture,
} from '../../src/lib/index.js';

const BRAND = PALETTE.red;
const BRAND2 = PALETTE.yellow;

// Red fascia with a yellow stripe; optional brand name in the middle.
function fasciaTexture(text) {
  return canvasTexture(512, 64, (ctx, W, H) => {
    ctx.fillStyle = BRAND;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H * 0.1);
    ctx.fillStyle = BRAND2;
    ctx.fillRect(0, H * 0.74, W, H * 0.16);
    if (text) {
      ctx.fillStyle = BRAND2;
      ctx.beginPath();
      ctx.arc(W / 2 - 92, H * 0.42, H * 0.26, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${H * 0.46}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2 + 16, H * 0.44);
    }
  }, { key: `petrol-station:fascia:${text}`, repeat: false });
}

// Price pylon face: brand logo on top, three fuel prices below.
function pylonTexture() {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = BRAND;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = BRAND2;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.17, W * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = BRAND;
    ctx.font = `bold ${W * 0.3}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TT', W / 2, H * 0.175);
    const rows = [['UNL', '1.79', '#2fbf4a'], ['SUP', '1.89', '#e8473c'], ['DSL', '1.69', '#f2f2f2']];
    rows.forEach(([label, price, c], i) => {
      const y = H * 0.36 + i * H * 0.205;
      ctx.fillStyle = '#16181c';
      ctx.fillRect(W * 0.08, y, W * 0.84, H * 0.18);
      ctx.fillStyle = c;
      ctx.fillRect(W * 0.08, y, W * 0.24, H * 0.18);
      ctx.fillStyle = '#16181c';
      ctx.font = `bold ${W * 0.11}px sans-serif`;
      ctx.fillText(label, W * 0.2, y + H * 0.09);
      ctx.fillStyle = '#ffd23a';
      ctx.font = `bold ${W * 0.22}px monospace`;
      ctx.fillText(price, W * 0.62, y + H * 0.095);
    });
  }, { key: 'petrol-station:pylon', repeat: false });
}

// Box with 0..1 UVs on every face (lib boxes use metre UVs, which tile/clamp a one-off sign texture).
function signBox(w, h, d, materials) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, materials);
}

function textSign(text, w, h, bg, fg, d = 0.1) {
  const tex = canvasTexture(256, Math.max(16, Math.round(256 * h / w)), (ctx, W, Hh) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, Hh);
    ctx.fillStyle = fg;
    ctx.font = `bold ${Hh * 0.62}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, Hh / 2 + Hh * 0.03);
  }, { key: `petrol-station:sign:${text}`, repeat: false });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return signBox(w, h, d, [side, side, side, side, face, side]);
}

// Fuel dispenser (~0.9 x 1.6 x 0.5), screens face +x and -x, hoses hang on both sides.
function pump(color = BRAND) {
  const body = mat(PALETTE.white);
  const trim = mat(color);
  const screen = emissive('#9fe8ff', 0.6);
  const hoseM = mat(PALETTE.black);
  const g = group(
    box(0.55, 0.15, 0.95, mat(PALETTE.darkGrey)),
    place(box(0.5, 1.15, 0.9, body), { y: 0.15 }),
    place(box(0.52, 0.32, 0.92, trim), { y: 1.3 }),
    place(box(0.56, 0.06, 0.96, mat(PALETTE.steelLight)), { y: 1.62 }),
  );
  for (const sx of [-1, 1]) {
    g.add(place(box(0.03, 0.28, 0.5, screen), { x: sx * 0.26, y: 0.9 }));
    g.add(place(box(0.04, 0.3, 0.2, mat(PALETTE.darkGrey)), { x: sx * 0.27, y: 0.45, z: -0.25 }));
    g.add(place(box(0.04, 0.3, 0.2, mat(PALETTE.darkGrey)), { x: sx * 0.27, y: 0.45, z: 0.25 }));
    g.add(place(box(0.06, 0.6, 0.06, hoseM), { x: sx * 0.3, y: 0.25, z: 0.36 }));
  }
  return g;
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const H = TILE / 2;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'concrete'));

  // forecourt asphalt + grass verges on the left side and front corners
  g.add(place(patch(8.6, 6.6, 'asphalt'), { x: 0.5, y: y0, z: 1.55 }));
  g.add(place(patch(0.9, 9.6, 'grass'), { x: -H + 0.5, y: y0, z: 0 }));
  g.add(place(box(0.08, 0.12, 9.6, mat(PALETTE.lightGrey)), { x: -H + 0.98, y: y0, z: 0 }));
  g.add(place(patch(1.6, 1.1, 'grass'), { x: 3.9, y: y0, z: H - 0.55 }));
  g.add(place(patch(1.4, 0.9, 'grass'), { x: -3.6, y: y0, z: H - 0.45 }));
  // lane arrows and stop line
  const paint = mat('#f4f4f0');
  for (const x of [-1.8, 1.8]) {
    g.add(place(box(0.14, 0.02, 0.9, paint), { x: x + (x < 0 ? 1.0 : -1.0), y: y0 + 0.05, z: 4.0 }));
  }
  g.add(place(box(0.5, 0.02, 0.14, paint), { x: -0.8, y: y0 + 0.05, z: 3.6, ry: 35 }));
  g.add(place(box(0.5, 0.02, 0.14, paint), { x: -0.6, y: y0 + 0.05, z: 3.6, ry: -35 }));

  // --- kiosk shop at the back ---
  const kx = -1.4, kz = -3.15, kw = 6.4, kd = 3.0, kh = 3.2;
  g.add(place(patch(kw + 0.4, 1.0, 'paved'), { x: kx, y: y0, z: kz + kd / 2 + 0.5 }));
  g.add(place(facadeBlock({
    w: kw, d: kd, floors: 1, floorHeight: kh, style: 'shop', wall: PALETTE.white, glass: PALETTE.glassSky,
    frame: PALETTE.steelDark, bay: 1.6, seed: 16, roof: PALETTE.concreteDark, blank: ['back', 'left'],
  }), { x: kx, y: y0, z: kz }));
  g.add(place(parapet({ w: kw, d: kd, h: 0.45, material: mat(PALETTE.lightGrey) }), { x: kx, y: y0 + kh, z: kz }));
  // fascia band with SHOP sign
  const kf = textured(fasciaTexture(''));
  g.add(place(signBox(kw + 0.1, 0.55, 0.12, [kf, kf, kf, kf, kf, kf]), { x: kx, y: y0 + kh - 0.2, z: kz + kd / 2 + 0.06 }));
  g.add(place(textSign('SHOP 24/7', 2.2, 0.42, '#ffffff', BRAND), { x: kx + 1.2, y: y0 + kh - 0.13, z: kz + kd / 2 + 0.14 }));
  g.add(place(rooftopUnits({ w: 3.5, d: 1.8, count: 2, seed: 16 }), { x: kx - 0.8, y: y0 + kh, z: kz - 0.2 }));
  // brand sign on the blank side wall, staff door at the back
  g.add(place(textSign('TT FUEL', 2.6, 0.6, BRAND, '#ffffff'), { x: kx - kw / 2, y: y0 + 2.0, z: kz, ry: -90 }));
  g.add(place(box(0.06, 0.12, 2.6, mat(BRAND2)), { x: kx - kw / 2 - 0.04, y: y0 + 1.75, z: kz }));
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.steel }), { x: kx + 1.6, y: y0, z: kz - kd / 2, ry: 180 }));
  // shopfront props: ice chest, gas bottle cage, bin, newspaper stand
  g.add(place(box(1.0, 0.85, 0.55, mat(PALETTE.white)), { x: kx - 2.2, y: y0, z: kz + kd / 2 + 0.4 }));
  g.add(place(box(1.02, 0.18, 0.57, mat(PALETTE.blue)), { x: kx - 2.2, y: y0 + 0.55, z: kz + kd / 2 + 0.4 }));
  const cage = group(box(1.0, 1.1, 0.5, mat(PALETTE.steelDark, { transparent: true, opacity: 0.55 })));
  for (let i = 0; i < 4; i++) cage.add(place(cylinder(0.11, 0.11, 0.7, mat(i % 2 ? PALETTE.orange : PALETTE.blue), 8), { x: -0.36 + i * 0.24, y: 0.05 }));
  g.add(place(cage, { x: kx + 2.6, y: y0, z: kz + kd / 2 + 0.35 }));
  g.add(place(cylinder(0.22, 0.2, 0.75, mat(PALETTE.darkGrey), 8), { x: kx - 0.9, y: y0, z: kz + kd / 2 + 0.35 }));

  // --- canopy over the pumps ---
  const cz = 1.15, cw = 7.4, cd = 4.4, ch = 4.0, ct = 0.7;
  const islandX = [-1.85, 1.85];
  for (const x of islandX) {
    // island kerb
    g.add(place(box(0.9, 0.18, 3.4, mat(PALETTE.concrete)), { x, y: y0, z: cz }));
    g.add(place(box(0.92, 0.04, 0.2, mat(BRAND2)), { x, y: y0 + 0.16, z: cz - 1.6 }));
    g.add(place(box(0.92, 0.04, 0.2, mat(BRAND2)), { x, y: y0 + 0.16, z: cz + 1.6 }));
    // columns at both ends, bollards
    for (const dz of [-1.35, 1.35]) {
      g.add(place(box(0.34, ch, 0.34, mat(PALETTE.white)), { x, y: y0, z: cz + dz }));
      g.add(place(box(0.36, 0.5, 0.36, mat(BRAND)), { x, y: y0 + 0.18, z: cz + dz }));
    }
    g.add(place(pump(), { x, y: y0 + 0.18, z: cz }));
  }
  const top = mat(PALETTE.lightGrey);
  const under = mat('#e9eef2');
  const front = textured(fasciaTexture('TT FUEL'));
  const side = textured(fasciaTexture(''));
  g.add(place(signBox(cw, ct, cd, [side, side, top, under, front, front]), { y: y0 + ch, z: cz }));
  // recessed downlights under the canopy
  const light = emissive('#fff6d8', 1.0);
  for (const x of [-2.8, -0.9, 0.9, 2.8]) for (const dz of [-1.3, 0, 1.3]) {
    g.add(place(box(0.5, 0.04, 0.5, light), { x, y: y0 + ch - 0.04, z: cz + dz }));
  }

  // --- car filling up between the islands, hose from the left pump ---
  const cs = 0.72;
  g.add(place(car({ color: PALETTE.blue }), { x: 0.05, y: y0, z: cz + 0.2, ry: 90, s: cs }));
  const hoseM = mat(PALETTE.black);
  g.add(pipeRun([[-1.55, y0 + 1.05, cz + 0.25], [-1.1, y0 + 0.55, cz - 0.1], [-0.62, y0 + 0.62, cz - 0.55]], 0.035, hoseM));
  // a second car waiting at the right island
  g.add(place(car({ color: PALETTE.white }), { x: 3.4, y: y0, z: cz - 0.6, ry: 90, s: 0.68 }));

  // --- back-right yard: air & water tower, tank fill caps, bench, trees ---
  g.add(place(patch(2.4, 3.0, 'concrete'), { x: 3.6, y: y0, z: -3.2 }));
  const air = group(
    box(0.55, 1.4, 0.4, mat(PALETTE.blue)),
    place(box(0.57, 0.3, 0.42, mat(PALETTE.white)), { y: 1.0 }),
    place(box(0.06, 0.06, 0.4, mat(PALETTE.black)), { x: 0.3, y: 0.7, z: 0.1 }),
  );
  g.add(place(air, { x: 2.6, y: y0, z: -1.95 }));
  const capM = mat(PALETTE.steelLight);
  for (const [x, c] of [[3.3, '#2fbf4a'], [3.85, '#e8473c'], [4.4, PALETTE.black]]) {
    g.add(place(cylinder(0.2, 0.2, 0.06, capM, 10), { x, y: y0, z: -2.6 }));
    g.add(place(cylinder(0.12, 0.12, 0.08, mat(c), 8), { x, y: y0, z: -2.6 }));
  }
  g.add(place(bench({ w: 1.4 }), { x: 2.6, y: y0, z: -4.2 }));
  g.add(place(hedge({ w: TILE - 1.2, h: 0.9, d: 0.5 }), { x: 0.6, y: y0, z: -H + 0.25 }));
  g.add(place(tree({ kind: 'cone', h: 3.8, seed: 7 }), { x: 4.1, y: y0, z: -4.05 }));
  g.add(place(tree({ kind: 'poplar', h: 4.2, seed: 12 }), { x: -H + 0.55, y: y0, z: -0.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 3 }), { x: -H + 0.5, y: y0, z: 2.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 5 }), { x: -3.4, y: y0, z: H - 0.45 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: 3.3, y: y0, z: H - 0.5 }));

  // --- tall price pylon at the front-right corner ---
  const px = 4.25, pz = 4.35, poleH = 4.6, sw = 1.3, sh = 2.6;
  const face = textured(pylonTexture(), { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: pylonTexture() });
  const pm = mat(BRAND);
  const pylon = group(
    box(0.7, 0.3, 0.5, mat(PALETTE.concrete)),
    place(box(0.32, poleH, 0.32, metal(PALETTE.steelDark)), { y: 0.3 }),
    place(signBox(sw, sh, 0.3, [pm, pm, pm, pm, face, face]), { y: poleH }),
    place(box(sw + 0.1, 0.12, 0.4, mat(PALETTE.white)), { y: poleH + sh }),
  );
  g.add(place(pylon, { x: px, y: y0, z: pz, ry: -20 }));

  // street lamp at the front-left verge
  g.add(place(streetLamp({ h: 4.5 }), { x: -H + 0.5, y: y0, z: 4.3 }));
  return g;
}

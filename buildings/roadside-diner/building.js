import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, sphere, place, group, mat, metal, emissive, textured,
  extrudeGeometry, canvasTexture, shade, door, car, tree, hedge, bench, streetLamp,
  facadeBlock,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street + parking) faces +z.
// Streamline diner: a stadium-shaped (rounded-end) body stacked from bands:
// steel skirt, red panels with chrome speed-stripes, ribbon windows, cream fascia.

const RED = PALETTE.red;
const CHROME = PALETTE.chrome;
const NEON_PINK = '#ff4f7a';
const NEON_TEAL = '#4fe6d8';

/** Rounded-end (stadium) outline, length L along X, depth D along Z. */
function stadium(L, D, seg = 8) {
  const r = D / 2, a = L / 2 - r;
  const pts = [];
  for (let i = 0; i <= seg; i++) {
    const t = -Math.PI / 2 + (Math.PI * i) / seg;
    pts.push([a + r * Math.cos(t), r * Math.sin(t)]);
  }
  for (let i = 0; i <= seg; i++) {
    const t = Math.PI / 2 + (Math.PI * i) / seg;
    pts.push([-a + r * Math.cos(t), r * Math.sin(t)]);
  }
  return pts;
}

/**
 * Extruded band whose wall UVs are rescaled: v 0..1 over the band height,
 * u = whole number of `pane`-wide repeats per wall segment (min. 1).
 */
function band(points, h, material, topMaterial, pane = 1) {
  const geom = extrudeGeometry(points, h);
  const uv = geom.attributes.uv;
  const wallCount = geom.groups[0].count;
  // walls are quads of 6 verts (quadUV); u runs 0..len, v 0..h
  for (let i = 0; i < wallCount; i += 6) {
    let len = 0;
    for (let k = 0; k < 6; k++) len = Math.max(len, uv.getX(i + k));
    const n = Math.max(1, Math.round(len / pane));
    for (let k = 0; k < 6; k++) uv.setXY(i + k, len > 0 ? (uv.getX(i + k) / len) * n : 0, uv.getY(i + k) / h);
  }
  const m = typeof material === 'string' ? mat(material) : material;
  const t = topMaterial ? (typeof topMaterial === 'string' ? mat(topMaterial) : topMaterial) : m;
  return new THREE.Mesh(geom, [m, t, m]);
}

// --- textures ---------------------------------------------------------------

function windowTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    // pane: dark glass with a sky reflection on top and warm interior light below
    const gr = ctx.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, PALETTE.glassSky);
    gr.addColorStop(0.35, PALETTE.glassBlue);
    gr.addColorStop(0.6, PALETTE.window);
    gr.addColorStop(1, '#6b5a3a');
    ctx.fillStyle = gr;
    ctx.fillRect(0, 0, W, H);
    // warm lamp glow behind the counter
    ctx.fillStyle = 'rgba(255, 220, 140, 0.55)';
    ctx.fillRect(6, H * 0.62, W - 12, H * 0.16);
    // diagonal glint
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath();
    ctx.moveTo(W * 0.15, 0); ctx.lineTo(W * 0.35, 0); ctx.lineTo(W * 0.1, H * 0.5); ctx.lineTo(W * 0.0, H * 0.5);
    ctx.fill();
    // chrome mullion + sill/head frames
    ctx.fillStyle = CHROME;
    ctx.fillRect(0, 0, 5, H);
    ctx.fillRect(W - 2, 0, 2, H);
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 5, W, 5);
  }, { key: 'roadside-diner:window' });
}

function panelTexture() {
  return canvasTexture(16, 64, (ctx, W, H) => {
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, W, H);
    // chrome speed stripes
    ctx.fillStyle = CHROME;
    for (const y of [6, 22, 38]) ctx.fillRect(0, y, W, 4);
    ctx.fillStyle = shade(RED, -0.2);
    ctx.fillRect(0, H - 4, W, 4);
  }, { key: 'roadside-diner:panel' });
}

function fasciaTexture() {
  return canvasTexture(16, 32, (ctx, W, H) => {
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = RED;
    ctx.fillRect(0, H * 0.38, W, H * 0.28);
    ctx.fillStyle = CHROME;
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, H - 3, W, 3);
  }, { key: 'roadside-diner:fascia' });
}

function neonTexture(text, key, { fg = NEON_PINK, glow = '#ff9ab3', bg = '#1d2340', w = 256, h = 80 } = {}) {
  return canvasTexture(w, h, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = NEON_TEAL;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    let size = H * 0.66;
    ctx.font = `italic bold ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.84 && size > 8) {
      size -= 1;
      ctx.font = `italic bold ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.shadowColor = glow;
    ctx.shadowBlur = 12;
    ctx.fillStyle = fg;
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#ffe3ea';
    ctx.font = `italic bold ${size * 0.92}px sans-serif`;
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key, repeat: false });
}

function neonSign(text, key, w, h, opts) {
  const tex = neonTexture(text, key, opts);
  const face = textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55 });
  const side = mat(CHROME, { roughness: 0.35 });
  // plain BoxGeometry: 0..1 UVs per face, so the whole texture fills the board
  const geo = new THREE.BoxGeometry(w, h, 0.25);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

// --- parts --------------------------------------------------------------------

/** Ring of glowing neon tube following a polygon outline at height y. */
function neonRing(points, y, color) {
  const g = new THREE.Group();
  const m = emissive(color, 1.2);
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const tube = box(len + 0.04, 0.07, 0.07, m);
    tube.position.set((x1 + x2) / 2, y, (z1 + z2) / 2);
    tube.rotation.y = -Math.atan2(z2 - z1, x2 - x1);
    g.add(tube);
  }
  return g;
}

function offsetStadium(L, D, off, seg) {
  return stadium(L + off * 2, D + off * 2, seg);
}

/** Tall roadside pole sign: "EAT" with an arrow and bulb border. */
function poleSign() {
  const g = new THREE.Group();
  const pole = metal(PALETTE.steelLight, { roughness: 0.3 });
  g.add(place(box(0.5, 0.35, 0.5, mat(PALETTE.concrete)), {}));
  g.add(cylinder(0.11, 0.13, 5.6, pole, 8));
  g.add(place(neonSign('EAT', 'roadside-diner:eat', 2.2, 1.1, { fg: '#ffd84a', glow: '#ffb000', bg: RED, w: 192, h: 96 }), { y: 4.1 }));
  // arrow pointing towards the diner (-x)
  const arrowM = mat(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 0.35 });
  g.add(place(box(1.6, 0.35, 0.2, arrowM), { x: -0.5, y: 3.45 }));
  const head = cylinder(0, 0.5, 0.2, arrowM, 3);
  head.rotation.x = Math.PI / 2;
  head.rotation.z = Math.PI / 2;
  head.position.set(-1.45, 3.62, 0);
  g.add(head);
  // bulbs round the board
  const bulb = emissive('#fff2b0', 1.2);
  for (let i = 0; i < 6; i++) {
    const x = -1.0 + i * 0.4;
    g.add(place(sphere(0.07, bulb, 6), { x, y: 5.27, z: 0.14 }));
    g.add(place(sphere(0.07, bulb, 6), { x, y: 4.06, z: 0.14 }));
  }
  g.add(place(sphere(0.18, mat(CHROME, { roughness: 0.3 }), 8), { y: 5.6 }));
  return g;
}

function dumpster() {
  const m = mat(PALETTE.green);
  return group(
    box(1.5, 1.0, 0.95, m),
    place(box(1.55, 0.08, 1.0, mat(shade(PALETTE.green, -0.25))), { y: 1.0 }),
  );
}

// --- build ----------------------------------------------------------------------

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // ground: sidewalk in front of the diner, asphalt parking along the street,
  // service yard at the back
  g.add(place(patch(TILE, 2.6, 'asphalt'), { y: y0, z: 3.7 }));
  g.add(place(patch(8.6, 1.5, 'paved'), { x: 0.1, y: y0, z: 1.65 }));
  g.add(place(patch(4.2, 2.2, 'concrete'), { x: -2.4, y: y0, z: -3.75 }));
  // parking bay lines
  const lineM = mat(PALETTE.roadLine);
  for (const x of [-4.55, -2.65, -0.75, 1.15, 3.05, 4.55]) {
    g.add(place(box(0.08, 0.02, 2.2, lineM), { x, y: y0 + 0.05, z: 3.75 }));
  }
  // kerb between sidewalk and parking
  g.add(place(box(8.6, 0.12, 0.15, mat(PALETTE.concrete)), { x: 0.1, y: y0, z: 2.45 }));

  // --- diner body ---
  const L = 7.4, D = 3.3, bz = -0.85;
  const body = new THREE.Group();
  body.position.set(0, y0, bz);
  const out = stadium(L, D, 10);
  let y = 0;
  body.add(place(band(stadium(L - 0.1, D - 0.1, 10), 0.35, metal(PALETTE.steel, { roughness: 0.4 })), { y })); y += 0.35;
  body.add(place(band(out, 0.95, textured(panelTexture(), { roughness: 0.35 })), { y })); y += 0.95;
  body.add(place(band(offsetStadium(L, D, 0.06, 10), 0.08, mat(CHROME, { roughness: 0.3 })), { y: y - 0.02 }));
  body.add(place(band(stadium(L - 0.06, D - 0.06, 10), 1.15, textured(windowTexture(), { roughness: 0.25 }), null, 1.05), { y: y + 0.06 })); y += 1.21;
  body.add(place(band(out, 0.55, textured(fasciaTexture(), { roughness: 0.5 })), { y })); y += 0.55;
  // overhanging roof cap with chrome edge
  const roofTop = mat(PALETTE.lightGrey);
  body.add(place(band(offsetStadium(L, D, 0.28, 10), 0.18, mat(CHROME, { roughness: 0.3 }), roofTop), { y }));
  const roofY = y + 0.18;
  // neon tube running round the eaves
  body.add(neonRing(offsetStadium(L, D, 0.3, 10), y + 0.05, NEON_TEAL));
  body.add(neonRing(offsetStadium(L, D, 0.02, 10), 1.33, NEON_PINK));

  // rooftop: AC units, kitchen exhaust, neon sign on a chrome frame
  const acM = mat(PALETTE.steelLight);
  body.add(place(box(1.1, 0.55, 0.8, acM), { x: -2.3, y: roofY, z: -0.7 }));
  body.add(place(cylinder(0.3, 0.3, 0.06, mat(PALETTE.darkGrey), 10), { x: -2.3, y: roofY + 0.55, z: -0.7 }));
  body.add(place(box(0.7, 0.4, 0.6, acM), { x: -0.9, y: roofY, z: -0.8 }));
  body.add(place(cylinder(0.12, 0.12, 0.5, metal(PALETTE.steel), 8), { x: 1.0, y: roofY, z: -0.9 }));
  const signW = 4.4, signH = 1.25, signY = roofY + 0.55;
  const frameM = mat(CHROME, { roughness: 0.3 });
  for (const sx of [-1.6, 1.6]) {
    body.add(place(box(0.12, 0.6, 0.12, frameM), { x: sx, y: roofY, z: 0.7 }));
    body.add(place(box(0.08, 0.08, 1.0, frameM), { x: sx, y: roofY + 0.5, z: 0.25, rx: 0 }));
  }
  body.add(place(neonSign('DINER', 'roadside-diner:diner', signW, signH), { y: signY, z: 0.7 }));
  // star burst on top of the sign
  const starM = emissive('#ffd84a', 1.0);
  body.add(place(sphere(0.22, starM, 8), { x: 2.35, y: signY + signH + 0.15, z: 0.7 }));
  for (let i = 0; i < 4; i++) {
    body.add(place(box(0.9, 0.06, 0.06, starM), { x: 2.35, y: signY + signH + 0.15, z: 0.7, rz: i * 45 }));
  }

  // --- entrance vestibule (front centre) ---
  const vx = 0.4, vw = 1.8, vd = 0.9;
  const vz = D / 2 + vd / 2 - 0.1;
  body.add(place(box(vw, 2.55, vd, [mat(RED), mat(RED), mat(PALETTE.lightGrey), mat(RED), mat(PALETTE.white), mat(RED)]), { x: vx, y: 0, z: vz }));
  body.add(place(box(vw + 0.06, 0.08, vd + 0.06, frameM), { x: vx, y: 1.3, z: vz }));
  body.add(place(box(vw + 0.4, 0.14, vd + 0.4, frameM), { x: vx, y: 2.55, z: vz + 0.1 }));
  body.add(place(door({ w: 0.95, h: 2.05, color: PALETTE.glassBlue, frame: CHROME }), { x: vx, y: 0.12, z: vz + vd / 2 }));
  body.add(place(box(0.08, 0.5, 0.06, frameM), { x: vx + 0.3, y: 0.95, z: vz + vd / 2 + 0.16 }));
  body.add(place(neonSign('OPEN', 'roadside-diner:open', 0.9, 0.3, { w: 192, h: 64 }), { x: vx, y: 2.18, z: vz + vd / 2 + 0.02 }));
  body.add(place(box(vw + 0.6, 0.12, 0.7, mat(PALETTE.concrete)), { x: vx, y: 0, z: vz + vd / 2 + 0.35 }));

  g.add(body);

  // --- kitchen annex at the back ---
  const kx = 1.4, kz = bz - D / 2 - 0.85, kw = 3.8, kd = 2.0;
  g.add(place(facadeBlock({ w: kw, d: kd, h: 2.7, floorHeight: 2.7, style: 'plain', wall: PALETTE.offWhite, roof: PALETTE.concrete }), { x: kx, y: y0, z: kz }));
  g.add(place(box(kw + 0.1, 0.25, kd + 0.1, mat(RED)), { x: kx, y: y0 + 2.45, z: kz }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.steel }), { x: kx + 0.9, y: y0, z: kz - kd / 2, ry: 180 }));
  // small back windows
  for (const wx of [-1.0]) {
    g.add(place(box(1.0, 0.6, 0.08, mat(PALETTE.window, { roughness: 0.2 })), { x: kx + wx, y: y0 + 1.4, z: kz - kd / 2 - 0.02 }));
  }
  // exhaust stack
  const steelM = metal(PALETTE.steelLight, { roughness: 0.35 });
  g.add(place(cylinder(0.22, 0.22, 1.3, steelM, 8), { x: kx + 1.1, y: y0 + 2.7, z: kz - 0.2 }));
  g.add(place(cylinder(0.38, 0.38, 0.12, steelM, 8), { x: kx + 1.1, y: y0 + 4.0, z: kz - 0.2 }));
  g.add(place(box(0.9, 0.6, 0.8, mat(PALETTE.steelLight)), { x: kx - 0.8, y: y0 + 2.7, z: kz }));

  // service yard: dumpster, crates, gas bottles
  g.add(place(dumpster(), { x: -2.3, y: y0, z: -4.1 }));
  g.add(place(box(0.6, 0.6, 0.6, mat(PALETTE.woodLight)), { x: -1.2, y: y0, z: -4.3 }));
  g.add(place(box(0.5, 0.5, 0.5, mat(PALETTE.wood)), { x: -1.15, y: y0 + 0.6, z: -4.25, ry: 20 }));
  g.add(place(cylinder(0.2, 0.2, 1.1, mat(PALETTE.yellow), 8), { x: -0.8, y: y0, z: -4.3 }));
  g.add(place(cylinder(0.2, 0.2, 1.1, mat(PALETTE.yellow), 8), { x: -0.35, y: y0, z: -4.3 }));

  // --- parked cars: retro colours, nosed in towards the diner ---
  const cars = [
    { x: -3.6, color: '#5fc4b8' },
    { x: -1.7, color: PALETTE.cream },
    { x: 2.1, color: '#e88aa6' },
  ];
  for (const c of cars) g.add(place(car({ color: c.color }), { x: c.x, y: y0 + 0.05, z: 3.75, ry: 90, s: 0.62 }));

  // --- roadside pole sign, lamp, bench, greenery ---
  g.add(place(poleSign(), { x: 3.75, y: y0, z: 1.6, ry: -15 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.6, y: y0, z: 2.0 }));
  g.add(place(bench({ w: 1.4 }), { x: -2.2, y: y0, z: 1.45 }));
  g.add(place(hedge({ w: 2.2, h: 0.7, d: 0.5 }), { x: 2.6, y: y0, z: 1.15 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 21 }), { x: -3.9, y: y0, z: -3.9 }));
  g.add(place(tree({ kind: 'round', h: 4.0, seed: 22 }), { x: 4.0, y: y0, z: -3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 23 }), { x: -4.3, y: y0, z: 0.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 24 }), { x: 4.3, y: y0, z: -1.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 25 }), { x: -4.4, y: y0, z: -4.4 }));
  return g;
}

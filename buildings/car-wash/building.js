import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, extrude, place, group, pipeRun,
  car, tree, hedge, streetLamp,   mat, metal, glass, emissive, water, textured, canvasTexture, rng,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Layout: wash tunnel along X at the back (enter west, exit east), queue lane
// up the west edge past the pay terminal, exit lane down the east edge,
// three vacuum bays and a pylon sign in front.

const FOAM = ['#ffffff', '#f7f4ff', '#f6a8d0', '#9fd8f5', '#f7e27a', '#ffffff'];
const FOAM_PINK = '#f27fb8', FOAM_BLUE = '#5cc3f0', FOAM_YELLOW = '#f5d63a', FOAM_GREEN = '#7fdc6a';

// Sign on a BoxGeometry with 0..1 UVs per face so big signs keep their text full size.
function flatSign(tex, w, h, { depth = 0.15, side = PALETTE.navy, double = false } = {}) {
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.18, emissiveMap: tex });
  const s = mat(side);
  return new THREE.Mesh(geo, [s, s, s, s, face, double ? face : s]);
}

function bubbles(ctx, W, H, seed, n, color = 'rgba(255,255,255,0.55)') {
  const r = rng(seed);
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, H * 0.02);
  for (let i = 0; i < n; i++) {
    const x = r.range(0, W), y = r.range(0, H), rad = r.range(H * 0.03, H * 0.1);
    ctx.beginPath(); ctx.arc(x, y, rad, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath(); ctx.arc(x - rad * 0.35, y - rad * 0.35, rad * 0.22, 0, Math.PI * 2);
    ctx.fillStyle = color; ctx.fill();
  }
}

function fitFont(ctx, text, maxW, size, weight = 'bold') {
  ctx.font = `${weight} ${size}px sans-serif`;
  while (ctx.measureText(text).width > maxW && size > 6) {
    size -= 1;
    ctx.font = `${weight} ${size}px sans-serif`;
  }
  return size;
}

function outlinedText(ctx, text, x, y, size, fill, stroke) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.lineJoin = 'round';
  ctx.lineWidth = size * 0.16;
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

// Big "CAR WASH" sign: blue with bubbles, white letters outlined in navy.
function washSignTex(key, W, H, top, bottom) {
  return canvasTexture(W, H, (ctx) => {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#3fa9f5');
    grad.addColorStop(1, '#1d5fbf');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    bubbles(ctx, W, H, 7, 14);
    ctx.strokeStyle = '#f5d63a';
    ctx.lineWidth = H * 0.06;
    ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    const s1 = fitFont(ctx, top, W * 0.86, bottom ? H * 0.5 : H * 0.68);
    outlinedText(ctx, top, W / 2, bottom ? H * 0.4 : H * 0.53, s1, '#ffffff', '#16326b');
    if (bottom) {
      const s2 = fitFont(ctx, bottom, W * 0.8, H * 0.22);
      outlinedText(ctx, bottom, W / 2, H * 0.78, s2, '#f5d63a', '#16326b');
    }
  }, { key: 'car-wash:' + key, repeat: false });
}

function plainSignTex(key, text, bg, fg, W = 512, H = 128) {
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const s = fitFont(ctx, text, W * 0.88, H * 0.66);
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H * 0.54);
  }, { key: 'car-wash:' + key, repeat: false });
}

// Back wall mural: white wall with a blue wave, bubbles and the name.
function muralTex() {
  return canvasTexture(640, 340, (ctx, W, H) => {
    ctx.fillStyle = '#f1eee6';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2f8fe0';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.55 + Math.sin(x / W * Math.PI * 4) * H * 0.06);
    ctx.lineTo(W, H);
    ctx.fill();
    ctx.fillStyle = '#1d5fbf';
    ctx.beginPath();
    ctx.moveTo(0, H);
    for (let x = 0; x <= W; x += 8) ctx.lineTo(x, H * 0.75 + Math.sin(x / W * Math.PI * 6 + 1) * H * 0.04);
    ctx.lineTo(W, H);
    ctx.fill();
    bubbles(ctx, W, H * 0.5, 3, 10, 'rgba(47,143,224,0.8)');
    const s = fitFont(ctx, 'CAR WASH', W * 0.7, H * 0.24);
    outlinedText(ctx, 'CAR WASH', W / 2, H * 0.3, s, '#f27fb8', '#ffffff');
  }, { key: 'car-wash:mural', repeat: false });
}

// Rotating wash brush: stacked bristle bands round a steel shaft, centred on its origin.
function brush(r, h, colors, bands = 7) {
  const g = new THREE.Group();
  const bh = h / bands;
  for (let i = 0; i < bands; i++) {
    const rr = r * (i % 2 ? 0.84 : 1);
    g.add(place(cylinder(rr, rr, bh, mat(colors[i % colors.length], { roughness: 1 }), 12), { y: -h / 2 + i * bh }));
  }
  g.add(place(cylinder(0.06, 0.06, h + 0.5, metal(PALETTE.steel), 6), { y: -h / 2 - 0.25 }));
  return g;
}

function foamPile(g, seed, n, x, y, z, sx, sy, sz, rMin = 0.12, rMax = 0.3) {
  const r = rng(seed);
  for (let i = 0; i < n; i++) {
    const rad = r.range(rMin, rMax);
    const a = r.range(0, Math.PI * 2), d = Math.sqrt(r());
    const fx = x + Math.cos(a) * d * sx, fz = z + Math.sin(a) * d * sz;
    const fy = y + r.range(0, sy) * (1 - d * 0.6);
    g.add(place(sphere(rad, mat(r.pick(FOAM), { roughness: 0.55 }), 7), { x: fx, y: fy - rad * 0.6, z: fz }));
  }
}

function sparkle(s = 0.5) {
  const m = emissive('#ffffff', 1.2);
  return group(box(s, s * 0.12, s * 0.12, m), box(s * 0.12, s, s * 0.12, m), box(s * 0.12, s * 0.12, s, m));
}

// Self-serve vacuum: yellow canister on a post with a boom spanning two bays, hoses dropping down.
function vacuumStation(seed) {
  const g = new THREE.Group();
  const yel = mat(PALETTE.yellow, { roughness: 0.5 });
  const blu = mat(PALETTE.blue, { roughness: 0.5 });
  g.add(box(0.6, 0.15, 0.6, mat(PALETTE.concreteDark)));
  g.add(place(cylinder(0.3, 0.3, 1.0, yel, 12), { y: 0.15 }));
  g.add(place(cylinder(0.33, 0.3, 0.25, blu, 12), { y: 1.15 }));
  g.add(place(box(0.32, 0.22, 0.04, emissive('#7fe0ff', 0.6)), { y: 0.75, z: 0.3 }));
  g.add(place(cylinder(0.07, 0.07, 1.0, metal(PALETTE.steelLight), 6), { y: 1.4 }));
  g.add(place(box(3.4, 0.14, 0.14, blu), { y: 2.35 }));
  g.add(place(flatSign(plainSignTex('vac', 'VACUUM', PALETTE.blue, '#ffffff', 256, 96), 1.0, 0.38, { depth: 0.1, side: PALETTE.blue, double: true }), { y: 2.5 }));
  const hose = mat(PALETTE.darkGrey, { roughness: 0.7 });
  const r = rng(seed);
  for (const sx of [-1, 1]) {
    const ex = sx * 1.6;
    g.add(place(sphere(0.1, yel, 8), { x: ex, y: 2.26 }));
    const tipX = ex + sx * r.range(-0.2, 0.3), tipZ = r.range(0.5, 1.2);
    g.add(pipeRun([[ex, 2.3, 0], [ex, 1.5, 0.1], [tipX, 1.0, tipZ * 0.6], [tipX, 0.75, tipZ]], 0.05, hose));
  }
  return g;
}

function arrow(len = 1.4, w = 0.6) {
  const pts = [[-len / 2, -0.12], [len / 2 - 0.45, -0.12], [len / 2 - 0.45, -w / 2], [len / 2, 0], [len / 2 - 0.45, w / 2], [len / 2 - 0.45, 0.12], [-len / 2, 0.12]];
  return extrude(pts, 0.02, mat(PALETTE.white));
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'concrete'));

  // ---- ground: lanes, bays, front strip -------------------------------------------
  const yl = y0 + 0.05; // top of lane patches
  g.add(place(patch(1.9, 9.6, 'asphalt'), { x: -4.05, y: y0, z: 0.2 }));       // queue lane
  g.add(place(patch(1.6, 9.6, 'asphalt'), { x: 4.2, y: y0, z: 0.2 }));         // exit lane
  g.add(place(patch(6.4, 3.6, 'asphalt'), { x: 0.2, y: y0, z: -2.6 }));        // tunnel floor
  g.add(place(patch(6.0, 3.6, 'asphalt'), { x: 0.2, y: y0, z: 1.75 }));        // vacuum bays
  for (const x of [-2.8, -0.8, 1.2, 3.2]) g.add(place(box(0.1, 0.02, 3.2, mat(PALETTE.white)), { x, y: yl, z: 1.85 }));
  for (const x of [-1.8, 0.2, 2.2]) g.add(place(box(1.0, 0.12, 0.2, mat(PALETTE.yellow)), { x, y: yl, z: 3.25 }));
  // lane arrows
  g.add(place(arrow(), { x: -4.05, y: yl, z: 3.6, ry: 90 }));
  g.add(place(arrow(), { x: 4.2, y: yl, z: 2.6, ry: -90 }));
  g.add(place(arrow(1.2), { x: 0.2, y: yl, z: -1.6 }));
  // guide rail in the tunnel
  g.add(place(box(6.0, 0.12, 0.1, metal(PALETTE.steelLight)), { x: 0.2, y: yl, z: -3.25 }));
  // puddles + drain
  g.add(place(box(1.3, 0.02, 1.0, water(PALETTE.water)), { x: 4.1, y: yl, z: -2.4 }));
  g.add(place(box(0.9, 0.02, 0.6, water(PALETTE.water)), { x: 4.3, y: yl, z: -1.1 }));
  g.add(place(box(4.0, 0.025, 0.25, mat(PALETTE.darkGrey)), { x: 0.4, y: yl, z: -2.6 }));
  // front kerb strip with hedge + bushes
  g.add(place(box(6.2, 0.2, 1.2, mat(PALETTE.concreteDark)), { x: 0.2, y: y0, z: 4.3 }));
  g.add(place(patch(6.0, 1.0, 'grass', 0.22), { x: 0.2, y: y0, z: 4.3 }));
  g.add(place(hedge({ w: 2.8, h: 0.6, d: 0.6 }), { x: 1.6, y: y0 + 0.22, z: 4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 31 }), { x: -0.4, y: y0 + 0.22, z: 4.3 }));
  g.add(place(tree({ kind: 'round', h: 3.2, seed: 32 }), { x: 2.7, y: y0 + 0.22, z: 4.1 }));

  // ---- wash tunnel ------------------------------------------------------------------
  const X0 = -3.0, X1 = 3.4, W = X1 - X0, cx = (X0 + X1) / 2;
  const cz = -2.6, D = 3.6, H = 3.4, zF = cz + D / 2, zB = cz - D / 2;
  const white = mat(PALETTE.white);
  const blue = mat('#2f7fd6', { roughness: 0.6 });
  const navy = mat(PALETTE.navy);

  // back wall with mural (box geometry with 0..1 UVs on the outer face)
  {
    const geo = new THREE.BoxGeometry(W, H, 0.2).translate(0, H / 2, 0);
    g.add(place(new THREE.Mesh(geo, [white, white, white, white, white, textured(muralTex())]), { x: cx, y: y0, z: zB + 0.1 }));
  }
  // front: low plinth, tall glass, blue fascia
  g.add(place(box(W, 0.7, 0.2, blue), { x: cx, y: y0, z: zF - 0.1 }));
  g.add(place(box(W, 1.9, 0.06, glass(PALETTE.glassSky, { opacity: 0.18 })), { x: cx, y: y0 + 0.7, z: zF - 0.1 }));
  for (let i = 0; i <= 6; i++) g.add(place(box(0.1, 1.9, 0.14, white), { x: X0 + 0.05 + i * (W - 0.1) / 6, y: y0 + 0.7, z: zF - 0.1 }));
  g.add(place(box(W, 0.8, 0.3, blue), { x: cx, y: y0 + 2.6, z: zF - 0.1 }));
  g.add(place(flatSign(washSignTex('fascia', 768, 96, 'TUNNEL WASH  •  WAX  •  DRY'), 5.6, 0.7, { depth: 0.06, side: '#2f7fd6' }), { x: cx, y: y0 + 2.65, z: zF + 0.05 }));
  // open ends: headers over the openings with ENTER / EXIT signs, chevron posts
  for (const [x, label, bg, ry] of [[X0, 'ENTER', PALETTE.red, -90], [X1, 'EXIT', PALETTE.green, 90]]) {
    g.add(place(box(0.25, 0.8, D, blue), { x, y: y0 + 2.6, z: cz }));
    g.add(place(flatSign(plainSignTex(label.toLowerCase(), label, bg, '#ffffff', 384, 96), 2.4, 0.6, { depth: 0.05, side: bg }), { x: x + Math.sign(x) * 0.15, y: y0 + 2.7, z: cz, ry }));
    for (const z of [zB + 0.12, zF - 0.12]) {
      for (let k = 0; k < 6; k++) g.add(place(box(0.3, 0.43, 0.3, mat(k % 2 ? PALETTE.white : (x < 0 ? PALETTE.red : PALETTE.yellow))), { x, y: y0 + k * 0.433, z }));
    }
  }
  // roof: solid edges, translucent skylight strip down the middle
  const ry0 = y0 + H;
  g.add(place(box(W + 0.4, 0.3, 1.2, white), { x: cx, y: ry0, z: zB + 0.4 }));
  g.add(place(box(W + 0.4, 0.3, 1.0, white), { x: cx, y: ry0, z: zF - 0.3 }));
  g.add(place(box(W + 0.4, 0.12, D - 2.0, glass('#bfe6ff', { opacity: 0.4 })), { x: cx, y: ry0 + 0.1, z: cz + 0.1 }));
  for (let i = 0; i <= 5; i++) g.add(place(box(0.12, 0.3, D - 2.0, white), { x: X0 + 0.1 + i * (W - 0.2) / 5, y: ry0, z: cz + 0.1 }));
  g.add(place(box(W + 0.4, 0.12, 0.12, blue), { x: cx, y: ry0 + 0.3, z: zF + 0.14 }));
  // soap tanks on the roof
  for (const [tx, col] of [[X1 - 0.5, FOAM_PINK], [X1 - 1.25, FOAM_BLUE], [X0 + 0.9, FOAM_YELLOW]]) {
    g.add(place(cylinder(0.32, 0.32, 0.9, mat(col, { roughness: 0.5 }), 12), { x: tx, y: ry0 + 0.3, z: zF - 0.35 }));
    g.add(place(cylinder(0.12, 0.12, 0.12, mat(PALETTE.white), 8), { x: tx, y: ry0 + 1.2, z: zF - 0.35 }));
  }
  g.add(pipeRun([[X1 - 1.25, ry0 + 0.6, zF - 0.7], [X1 - 1.25, ry0 + 0.4, zF - 1.0], [X1 - 2.6, ry0 + 0.4, zF - 1.0]], 0.05, metal(PALETTE.steelLight)));

  // rooftop sign with giant bubbles
  const signY = ry0 + 0.3;
  for (const x of [cx - 1.6, cx + 1.6]) g.add(place(box(0.15, 0.9, 0.15, metal(PALETTE.steelDark)), { x, y: signY, z: zB + 0.5 }));
  g.add(place(flatSign(washSignTex('roof', 640, 160, 'CAR WASH'), 5.2, 1.3, { depth: 0.2, side: PALETTE.navy, double: true }), { x: cx, y: signY + 0.8, z: zB + 0.5 }));
  const bubbleM = glass('#cdeeff', { opacity: 0.55 });
  for (const [bx, by, bz, br] of [[X0 + 0.2, 1.7, -0.1, 0.5], [X0 + 0.55, 2.55, 0.2, 0.32], [X0 + 0.05, 2.9, 0.35, 0.2], [X1 - 0.25, 1.9, 0.1, 0.42], [X1 - 0.05, 2.65, -0.1, 0.25]]) {
    g.add(place(sphere(br, bubbleM, 14), { x: bx, y: signY + by - br, z: zB + 0.5 + bz }));
  }

  // ---- inside the tunnel -------------------------------------------------------------
  const steel = metal(PALETTE.steelLight);
  const gantry = (x) => {
    for (const z of [zB + 0.3, zF - 0.3]) g.add(place(box(0.16, 2.95, 0.16, steel), { x, y: y0, z }));
    g.add(place(box(0.2, 0.2, D - 0.5, steel), { x, y: y0 + 2.8, z: cz }));
  };
  // 1) foam curtain arch: hanging rainbow strips + nozzles
  gantry(-2.55);
  {
    const cols = [FOAM_PINK, FOAM_YELLOW, FOAM_BLUE, FOAM_GREEN];
    const r = rng(41);
    for (let i = 0; i < 11; i++) {
      const len = r.range(1.2, 1.9);
      g.add(place(box(0.05, len, 0.26, mat(cols[i % 4], { roughness: 0.9 })), { x: -2.55, y: y0 + 2.8 - len, z: zB + 0.5 + i * 0.26 }));
    }
  }
  // 2) car in the wash, buried in foam
  g.add(place(car({ color: PALETTE.red }), { x: -0.9, y: yl, z: cz, s: 0.66 }));
  foamPile(g, 11, 26, -0.9, yl + 1.05, cz, 1.1, 0.35, 0.45, 0.14, 0.3);
  foamPile(g, 12, 14, -0.9, yl, cz, 1.6, 0.05, 0.9, 0.1, 0.22);
  // 3) side brushes hugging the car
  gantry(-0.35);
  const bh = 2.1;
  for (const [z, cols] of [[cz - 1.15, [PALETTE.blue, FOAM_BLUE, PALETTE.red]], [cz + 1.15, [PALETTE.red, FOAM_PINK, PALETTE.blue]]]) {
    g.add(place(brush(0.48, bh, cols), { x: -0.35, y: yl + 0.08 + bh / 2, z }));
    g.add(place(box(0.35, 0.35, 0.35, navy), { x: -0.35, y: yl + 0.1 + bh + 0.2, z }));
    g.add(place(box(0.12, 0.45, 0.12, steel), { x: -0.35, y: y0 + 2.6, z }));
    foamPile(g, z > cz ? 13 : 14, 6, -0.35, yl + 0.6, z, 0.4, 1.2, 0.4, 0.08, 0.16);
  }
  // 4) overhead brush spanning the lane
  gantry(1.25);
  g.add(place(brush(0.45, D - 0.8, [PALETTE.yellow, PALETTE.blue, FOAM_GREEN], 9), { x: 1.25, y: yl + 1.5, z: cz, rx: 90 }));
  for (const z of [cz - 1.45, cz + 1.45]) g.add(place(box(0.14, 1.0, 0.14, navy), { x: 1.25, y: yl + 1.5, z }));
  // 5) wrap-around brushes, second pair
  gantry(2.35);
  for (const [z, cols] of [[cz - 1.15, [PALETTE.green, PALETTE.yellow]], [cz + 1.15, [PALETTE.yellow, PALETTE.green]]]) {
    g.add(place(brush(0.42, bh, cols, 6), { x: 2.35, y: yl + 0.08 + bh / 2, z }));
    g.add(place(box(0.32, 0.32, 0.32, navy), { x: 2.35, y: yl + 0.1 + bh + 0.2, z }));
    g.add(place(box(0.12, 0.45, 0.12, steel), { x: 2.35, y: y0 + 2.6, z }));
  }
  // 6) dryer at the exit: big red blower nozzles
  gantry(3.05);
  for (const z of [cz - 0.7, cz + 0.7]) {
    g.add(place(cylinder(0.32, 0.22, 0.6, mat(PALETTE.red, { roughness: 0.5 }), 12), { x: 3.05, y: y0 + 2.2, z }));
  }
  for (const z of [zB + 0.45, zF - 0.45]) g.add(place(box(0.35, 1.4, 0.3, mat(PALETTE.red, { roughness: 0.5 })), { x: 3.05, y: y0 + 0.4, z }));
  // foam trail on the floor through the tunnel
  foamPile(g, 15, 12, 0.7, yl, cz, 2.2, 0.03, 1.2, 0.08, 0.18);
  foamPile(g, 16, 10, 3.7, yl, cz, 0.5, 0.03, 1.1, 0.08, 0.2);   // spilling out of the exit
  foamPile(g, 17, 8, -3.3, yl, cz, 0.4, 0.03, 1.2, 0.08, 0.18);  // and the entrance

  // ---- queue lane + pay terminal ----------------------------------------------------
  g.add(place(car({ color: PALETTE.blue }), { x: -4.05, y: yl, z: -1.4, ry: 90, s: 0.66 }));
  g.add(place(car({ color: PALETTE.yellow }), { x: -4.05, y: yl, z: 1.9, ry: 90, s: 0.66 }));
  // pay terminal facing the lane (-X), with menu board
  {
    const t = new THREE.Group();
    t.add(box(0.6, 0.15, 0.8, mat(PALETTE.concreteDark)));
    t.add(place(box(0.35, 1.25, 0.5, mat(PALETTE.navy)), { y: 0.15 }));
    t.add(place(box(0.05, 0.3, 0.36, emissive('#7fe0ff', 0.7)), { x: -0.19, y: 1.0 }));
    t.add(place(box(0.06, 0.14, 0.2, mat(PALETTE.yellow)), { x: -0.19, y: 0.65 }));
    t.add(place(box(0.5, 0.12, 0.6, mat(PALETTE.red)), { y: 1.4 }));
    g.add(place(t, { x: -2.9, y: y0, z: 1.3 }));
    const menu = canvasTexture(256, 320, (ctx, Wc, Hc) => {
      ctx.fillStyle = '#1d5fbf';
      ctx.fillRect(0, 0, Wc, Hc);
      ctx.fillStyle = '#f5d63a';
      ctx.fillRect(0, 0, Wc, Hc * 0.22);
      ctx.fillStyle = '#16326b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${Hc * 0.14}px sans-serif`;
      ctx.fillText('WASH MENU', Wc / 2, Hc * 0.11);
      const rows = [['BASIC', '$5', '#ffffff'], ['DELUXE', '$9', '#9fd8f5'], ['ULTIMATE', '$14', '#f6a8d0']];
      rows.forEach(([n, p, c], i) => {
        ctx.fillStyle = c;
        ctx.font = `bold ${Hc * 0.11}px sans-serif`;
        ctx.textAlign = 'left';
        ctx.fillText(n, Wc * 0.07, Hc * (0.36 + i * 0.22));
        ctx.textAlign = 'right';
        ctx.fillText(p, Wc * 0.93, Hc * (0.36 + i * 0.22));
      });
    }, { key: 'car-wash:menu', repeat: false });
    g.add(place(box(0.08, 1.4, 0.08, metal(PALETTE.steelDark)), { x: -2.85, y: y0, z: -0.1 }));
    g.add(place(flatSign(menu, 1.0, 1.25, { depth: 0.08, side: PALETTE.navy }), { x: -2.9, y: y0 + 1.2, z: -0.1, ry: -90 }));
  }

  // ---- exit lane: freshly washed car ------------------------------------------------
  g.add(place(car({ color: PALETTE.white }), { x: 4.2, y: yl, z: 0.6, ry: -90, s: 0.66 }));
  for (const [x, y, z, s] of [[4.0, 1.45, 0.1, 0.45], [4.5, 1.25, 1.2, 0.35], [3.8, 1.1, 1.6, 0.28]]) g.add(place(sparkle(s), { x, y: yl + y, z }));

  // ---- vacuum bays ------------------------------------------------------------------
  g.add(place(car({ color: PALETTE.green }), { x: -1.8, y: yl, z: 1.65, ry: 90, s: 0.66 }));
  g.add(place(car({ color: PALETTE.purple }), { x: 2.2, y: yl, z: 1.65, ry: 90, s: 0.66 }));
  g.add(place(vacuumStation(51), { x: -0.8, y: yl, z: 0.05 }));
  g.add(place(vacuumStation(52), { x: 1.2, y: yl, z: 0.05 }));
  // trash bin
  g.add(place(cylinder(0.22, 0.2, 0.7, mat(PALETTE.green), 10), { x: 0.2, y: yl, z: 3.55 }));

  // ---- pylon sign + lamp at the street ------------------------------------------------
  {
    const px = -2.0, pz = 4.4;
    for (const dx of [-0.75, 0.75]) g.add(place(box(0.18, 3.4, 0.18, metal(PALETTE.steelDark)), { x: px + dx, y: y0 + 0.22, z: pz }));
    g.add(place(flatSign(washSignTex('pylon', 512, 288, 'CAR WASH', 'EXPRESS $5'), 2.4, 1.35, { depth: 0.2, side: PALETTE.navy, double: true }), { x: px, y: y0 + 2.4, z: pz }));
    for (const [bx, by, br] of [[-1.3, 3.65, 0.24], [-1.5, 4.0, 0.15], [1.3, 3.6, 0.15]]) g.add(place(sphere(br, bubbleM, 12), { x: px + bx, y: y0 + by, z: pz }));
  }
  g.add(place(streetLamp({ h: 4.2 }), { x: 3.3, y: y0, z: 4.75, ry: 180 }));

  return g;
}

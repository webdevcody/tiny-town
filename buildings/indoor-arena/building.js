import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, prismBlock, box, cylinder, sphere, place, group, extrude,
  ShapeBuilder, mat, metal, glass, emissive, facade, textured, canvasTexture,
  signTexture, door, columns, flag, streetLamp, bench, tree, truck, rng, shade, SWATCHES,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (main entrance plaza) faces +z.

// Oval centre and radii of the arena body.
const CZ = -0.9;
const RX = 7.3;
const RZ = 5.7;
const SEG = 48;

// Ellipse outline [[x,z]...], counter-clockwise seen from above.
function ellipse(rx, rz, n = SEG, cz = CZ) {
  const pts = [];
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    pts.push([rx * Math.cos(t), cz - rz * Math.sin(t)]);
  }
  return pts;
}

// Elliptical band (optionally flaring) from (rx0, rz0) at y=0 to (rx1, rz1) at y=h.
// UVs: u wraps uRepeat times around, v goes 0..vRepeat bottom to top.
function ellipseBand({ rx0, rz0, rx1 = rx0, rz1 = rz0, h, material, uRepeat = 1, vRepeat = 1, n = SEG }) {
  const b = new ShapeBuilder();
  for (let i = 0; i < n; i++) {
    const t0 = (i / n) * Math.PI * 2;
    const t1 = ((i + 1) / n) * Math.PI * 2;
    const p = (t, rx, rz, y) => [rx * Math.cos(t), y, -rz * Math.sin(t)];
    const u0 = (i / n) * uRepeat;
    const u1 = ((i + 1) / n) * uRepeat;
    b.quadUV(p(t0, rx0, rz0, 0), p(t1, rx0, rz0, 0), p(t1, rx1, rz1, h), p(t0, rx1, rz1, h),
      [[u0, 0], [u1, 0], [u1, vRepeat], [u0, vRepeat]], 0);
  }
  return new THREE.Mesh(b.build(), material);
}

// Shallow ellipsoidal dome with alternating panel colours and an opening at the top
// (radius fraction `open`) for the skylight lantern.
function panelDome({ rx, rz, h, rings = 6, open = 0.3, mats, n = SEG }) {
  const b = new ShapeBuilder();
  // paraboloid saucer: radius fraction s from 1 (eave) to `open` (lantern), y = h * (1 - s^2) / (1 - open^2)
  const ring = (j) => 1 - (j / rings) * (1 - open);
  const p = (t, s) => [rx * s * Math.cos(t), (h * (1 - s * s)) / (1 - open * open), -rz * s * Math.sin(t)];
  for (let j = 0; j < rings; j++) {
    const s0 = ring(j), s1 = ring(j + 1);
    for (let i = 0; i < n; i++) {
      const t0 = (i / n) * Math.PI * 2;
      const t1 = ((i + 1) / n) * Math.PI * 2;
      b.quad(p(t0, s0), p(t1, s0), p(t1, s1), p(t0, s1), i % 4 === 0 ? 2 : i % 2);
    }
  }
  return { mesh: new THREE.Mesh(b.build(), mats), topY: h };
}

// The glowing LED ring: magenta-to-cyan gradient with arena branding.
function ledTexture() {
  return canvasTexture(1024, 96, (ctx, W, H) => {
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#ff2fa8');
    grad.addColorStop(0.33, '#7b3cff');
    grad.addColorStop(0.66, '#19b8ff');
    grad.addColorStop(1, '#ff2fa8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // LED pixel grid
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let x = 0; x < W; x += 6) ctx.fillRect(x, 0, 1, H);
    for (let y = 0; y < H; y += 6) ctx.fillRect(0, y, W, 1);
    // bright rims
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, 5);
    ctx.fillRect(0, H - 5, W, 5);
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.fillText('TINY ARENA', W * 0.25, H / 2 + 2);
    ctx.fillText('LIVE TONIGHT', W * 0.75, H / 2 + 2);
    ctx.fillStyle = '#ffe94a';
    for (const cx of [0, W * 0.5, W]) {
      const cy = H / 2, r = 16;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const a = -Math.PI / 2 + (k * Math.PI) / 5;
        const rr = k % 2 ? r * 0.45 : r;
        ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
      }
      ctx.fill();
    }
  }, { key: 'indoor-arena:led' });
}

// Sign board with text on +z. (Uses 0..1 UVs so the text fills the board.)
function sign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, border = null }) {
  const tw = 256;
  const th = Math.max(16, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.25, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Little person: body + head.
function person(r, color) {
  return group(
    place(cylinder(0.2, 0.24, 1.0, mat(color), 6), { y: 0.45 }),
    place(cylinder(0.09, 0.09, 0.45, mat(PALETTE.navy), 5), { x: -0.1 }),
    place(cylinder(0.09, 0.09, 0.45, mat(PALETTE.navy), 5), { x: 0.1 }),
    place(sphere(0.17, mat('#e2b48c'), 6), { y: 1.48 }),
  );
}

// Ticket kiosk: small booth with a striped roof and a lit window, faces +z.
function kiosk() {
  return group(
    box(1.6, 2.2, 1.3, mat(PALETTE.white)),
    place(box(1.2, 0.8, 0.05, emissive(PALETTE.windowLit, 0.5)), { y: 1.0, z: 0.66 }),
    place(box(1.3, 0.08, 0.35, mat(PALETTE.steelLight)), { y: 0.95, z: 0.8 }),
    place(box(1.9, 0.25, 1.7, mat(PALETTE.red)), { y: 2.2, z: 0.1 }),
    place(sign({ text: 'TICKETS', w: 1.5, h: 0.4, bg: PALETTE.red, fg: '#ffffff', depth: 0.1 }), { y: 2.45, z: 0.6 }),
  );
}

function bollards(n, spacing) {
  const g = new THREE.Group();
  const m = metal(PALETTE.steelLight);
  for (let i = 0; i < n; i++) g.add(place(cylinder(0.12, 0.14, 0.8, m, 6), { x: (i - (n - 1) / 2) * spacing }));
  return g;
}

function planterTree(seed, h = 5) {
  return group(
    cylinder(0.95, 0.95, 0.5, mat(PALETTE.stoneDark), 10),
    place(tree({ kind: 'round', h, seed }), { y: 0.5 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = TILE;
  g.add(lot([2, 2], 'paved'));

  // ---------------------------------------------------------------- ground
  // landscaped corners at the back, cobbled entrance plaza at the front
  for (const sx of [-1, 1]) {
    g.add(place(patch(3.4, 3.2, 'grass'), { x: sx * (half - 1.7), y: y0, z: -half + 1.6 }));
    g.add(place(patch(2.6, 2.6, 'grass'), { x: sx * (half - 1.3), y: y0, z: half - 1.3 }));
  }
  g.add(place(patch(9, 3.6, 'cobbles'), { y: y0, z: 7.6 }));
  // service road at the back
  g.add(place(patch(12, 2.9, 'asphalt'), { x: 0, y: y0, z: -half + 1.45 }));

  // plinth the arena sits on
  const plinthH = 0.35;
  g.add(place(extrude(ellipse(RX + 0.6, RZ + 0.6, SEG, 0), plinthH, mat(PALETTE.concreteDark), mat(PALETTE.concrete)), { y: y0, z: CZ }));
  const yb = y0 + plinthH;

  // ---------------------------------------------------------------- body
  // glass concourse level
  const concH = 3.6;
  g.add(place(prismBlock({
    points: ellipse(RX, RZ, SEG, 0), h: concH, floorHeight: concH, bay: 1, style: 'curtain',
    glass: PALETTE.glassSky, frame: PALETTE.white, lit: 0.35, seed: 7, roof: PALETTE.concreteDark,
  }), { y: yb, z: CZ }));
  // white slab between concourse and seating bowl
  g.add(place(extrude(ellipse(RX + 0.35, RZ + 0.35, SEG, 0), 0.35, mat(PALETTE.white), mat(PALETTE.white)), { y: yb + concH, z: CZ }));

  // outward-flaring bowl wall with ribbon windows
  const bowlY = yb + concH + 0.35;
  const bowlH = 3.6;
  const ribbon = facade({ style: 'ribbon', wall: PALETTE.offWhite, glass: PALETTE.glassDark, frame: PALETTE.steelLight, lit: 0.1, seed: 4 });
  const { cols, rows } = ribbon.userData;
  g.add(place(ellipseBand({
    rx0: RX + 0.2, rz0: RZ + 0.2, rx1: RX + 0.85, rz1: RZ + 0.85, h: bowlH, material: ribbon,
    uRepeat: SEG / cols, vRepeat: 2 / rows,
  }), { y: bowlY, z: CZ }));

  // LED ring band
  const ledY = bowlY + bowlH;
  const ledH = 1.3;
  const tex = ledTexture();
  const ledMat = textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.55, roughness: 0.5 });
  g.add(place(ellipseBand({ rx0: RX + 0.9, rz0: RZ + 0.9, h: ledH, material: ledMat, uRepeat: 3 }), { y: ledY, z: CZ }));
  // eave ring
  const eaveY = ledY + ledH;
  g.add(place(extrude(ellipse(RX + 1.1, RZ + 1.1, SEG, 0), 0.3, mat(PALETTE.white), mat(PALETTE.steelLight)), { y: eaveY, z: CZ }));

  // ---------------------------------------------------------------- roof
  const roofY = eaveY + 0.3;
  const domeMats = [
    mat(PALETTE.aluminium, { roughness: 0.45, metalness: 0.35 }),
    mat(shade(PALETTE.aluminium, -0.08), { roughness: 0.45, metalness: 0.35 }),
    mat(PALETTE.steel, { roughness: 0.5, metalness: 0.4 }),
  ];
  const dome = panelDome({ rx: RX + 0.85, rz: RZ + 0.85, h: 2.4, rings: 5, open: 0.3, mats: domeMats });
  g.add(place(dome.mesh, { y: roofY, z: CZ }));
  // skylight lantern on top
  const lrx = (RX + 0.85) * 0.3;
  const lrz = (RZ + 0.85) * 0.3;
  const lanY = roofY + dome.topY;
  g.add(place(ellipseBand({ rx0: lrx, rz0: lrz, h: 0.7, material: glass(PALETTE.glassSky), n: 24 }), { y: lanY, z: CZ }));
  g.add(place(extrude(ellipse(lrx + 0.25, lrz + 0.25, 24, 0), 0.25, mat(PALETTE.white), mat(PALETTE.steelLight)), { y: lanY + 0.7, z: CZ }));
  g.add(place(extrude(ellipse(lrx * 0.55, lrz * 0.55, 24, 0), 0.35, mat(PALETTE.steelLight), emissive('#bfe6ff', 0.4)), { y: lanY + 0.95, z: CZ }));
  // floodlight masts + antenna on the lantern
  g.add(place(cylinder(0.06, 0.08, 2.2, metal(PALETTE.steelDark), 5), { x: 0.6, y: lanY + 0.95, z: CZ }));
  g.add(place(sphere(0.12, emissive(PALETTE.red, 1), 6), { x: 0.6, y: lanY + 3.15, z: CZ }));

  // ---------------------------------------------------------------- main entrance (front, +z)
  const frontZ = CZ + RZ; // concourse face at x = 0
  const canW = 8, canD = 3.2;
  const canZ = frontZ + canD / 2 - 0.6;
  // glass entrance pavilion
  g.add(place(box(6, 3.2, 1.6, glass(PALETTE.glassBlue)), { y: yb, z: frontZ - 0.2 }));
  for (const x of [-2, 0, 2]) g.add(place(door({ w: 1.5, h: 2.4, color: PALETTE.glassDark, frame: PALETTE.white }), { x, y: yb, z: frontZ + 0.6 }));
  // canopy on slim columns
  g.add(place(box(canW, 0.35, canD, mat(PALETTE.white)), { y: yb + 3.3, z: canZ }));
  g.add(place(box(canW - 0.4, 0.06, canD - 0.4, emissive(PALETTE.windowLit, 0.4)), { y: yb + 3.26, z: canZ }));
  g.add(place(columns({ count: 4, length: canW - 1, radius: 0.13, h: 3.3, material: metal(PALETTE.steelLight) }), { y: yb, z: canZ + canD / 2 - 0.35 }));
  // blue name board standing on the canopy
  g.add(place(sign({ text: 'TINY ARENA', w: 6.4, h: 1.0, bg: PALETTE.navy, fg: '#ffffff', depth: 0.25, border: '#19b8ff' }), { y: yb + 3.65, z: canZ + canD / 2 - 0.3 }));
  // entrance steps from the plinth
  g.add(place(box(canW, 0.18, 1.0, mat(PALETTE.concrete)), { y: y0, z: frontZ + 1.6 }));

  // ---------------------------------------------------------------- side gates (east / west)
  for (const sx of [-1, 1]) {
    const gx = sx * RX;
    g.add(place(box(1.2, 2.8, 3.6, glass(PALETTE.glassBlue)), { x: gx, y: yb, z: CZ }));
    g.add(place(box(2.6, 0.3, 4.4, mat(PALETTE.white)), { x: gx + sx * 0.9, y: yb + 2.9, z: CZ }));
    for (const dz of [-1.8, 1.8]) g.add(place(cylinder(0.1, 0.1, 2.9, metal(PALETTE.steelLight), 6), { x: gx + sx * 1.95, y: yb, z: CZ + dz }));
    g.add(place(sign({ text: sx < 0 ? 'GATE A' : 'GATE B', w: 2.4, h: 0.55, bg: PALETTE.red, fg: '#ffffff', depth: 0.12 }), { x: gx + sx * 2.25, y: yb + 2.3, z: CZ, ry: sx * 90 }));
    g.add(place(box(0.9, 0.12, 4.4, mat(PALETTE.concrete)), { x: sx * (RX + 1.05), y: y0, z: CZ }));
  }

  // ---------------------------------------------------------------- service yard (back, -z)
  const backZ = CZ - RZ;
  g.add(place(box(4.2, 3.2, 1.6, mat(PALETTE.concreteDark)), { y: yb, z: backZ + 0.3 }));
  g.add(place(box(3.4, 2.7, 0.08, surface_shutter()), { y: yb, z: backZ - 0.52, ry: 180 }));
  g.add(place(box(4.4, 0.12, 0.08, mat(PALETTE.yellow)), { y: yb + 2.95, z: backZ - 0.52 }));
  g.add(place(truck({ color: PALETTE.red, trailerColor: PALETTE.white }), { x: -0.4, y: y0, z: -half + 1.45, s: [0.78, 0.78, 0.7] }));
  g.add(place(sign({ text: 'TINY ARENA TOUR', w: 4.6, h: 0.7, bg: PALETTE.white, fg: PALETTE.navy, depth: 0.02 }), { x: -1.5, y: y0 + 1.3, z: -half + 2.35 }));

  // ---------------------------------------------------------------- plaza life
  // ticket kiosks
  for (const sx of [-1, 1]) g.add(place(kiosk(), { x: sx * 5.4, y: y0, z: 7.4 }));
  // flags along the front
  const flagCols = [[PALETTE.red, PALETTE.white], [PALETTE.blue, PALETTE.white], [PALETTE.yellow, PALETTE.navy], [PALETTE.green, PALETTE.white]];
  [-7.4, -6.2, 6.2, 7.4].forEach((x, i) => g.add(place(flag({ h: 6, color: flagCols[i][0], color2: flagCols[i][1] }), { x, y: y0, z: 5.6 })));
  // bollards across the plaza edge
  for (const sx of [-1, 1]) g.add(place(bollards(4, 1.1), { x: sx * 2.6, y: y0, z: 9.55 }));
  // lamps, benches, planter trees
  for (const sx of [-1, 1]) {
    g.add(place(streetLamp({ h: 4.6 }), { x: sx * 3.6, y: y0, z: 9.0, ry: sx > 0 ? 180 : 0 }));
    g.add(place(bench({ w: 1.6 }), { x: sx * 7.3, y: y0, z: 9.2, ry: 180 }));
    g.add(place(planterTree(30 + sx, 5.2), { x: sx * 8.7, y: y0, z: 8.6 }));
    g.add(place(tree({ kind: 'round', h: 6, seed: 40 + sx }), { x: sx * 8.0, y: y0, z: -7.9 }));
    g.add(place(tree({ kind: 'cone', h: 5, seed: 50 + sx }), { x: sx * 8.9, y: y0, z: -5.4 }));
    g.add(place(tree({ kind: 'bush', h: 1.2, seed: 60 + sx }), { x: sx * 7.4, y: y0, z: -9.1 }));
    g.add(place(tree({ kind: 'bush', h: 1.0, seed: 70 + sx }), { x: sx * 9.2, y: y0, z: 6.6 }));
    g.add(place(streetLamp({ h: 4.2 }), { x: sx * 9.4, y: y0, z: CZ + 3.4, ry: sx > 0 ? 180 : 0 }));
  }

  // crowd on the plaza
  const r = rng(2026);
  const crowd = SWATCHES.awnings.concat([PALETTE.white, PALETTE.purple]);
  const spots = [];
  for (let i = 0; i < 26; i++) {
    const x = r.range(-8.5, 8.5);
    const z = r.range(6.6, 9.4);
    if (Math.abs(Math.abs(x) - 5.4) < 1.3 && z < 8.4) continue; // kiosks
    if (spots.some(([a, b]) => Math.hypot(a - x, b - z) < 0.8)) continue;
    spots.push([x, z]);
    g.add(place(person(r, r.pick(crowd)), { x, y: y0, z, ry: r.range(0, 360) }));
  }
  // queue at each kiosk
  for (const sx of [-1, 1]) for (let k = 0; k < 3; k++) {
    g.add(place(person(r, r.pick(crowd)), { x: sx * 5.4 + sx * 0.15 * k, y: y0, z: 8.5 + k * 0.7 }));
  }
  // a few people at the side gates
  for (const [x, z] of [[-9.2, -0.2], [-9.0, -1.9], [9.3, 0.4], [9.1, -1.4]]) g.add(place(person(r, r.pick(crowd)), { x, y: y0, z }));

  return g;
}

// Roller shutter for the loading bay.
function surface_shutter() {
  const t = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#b9bcc0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#8c9095';
    for (let y = 0; y < H; y += 8) ctx.fillRect(0, y, W, 2);
  }, { key: 'indoor-arena:shutter' });
  return textured(t, {});
}

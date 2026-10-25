import * as THREE from 'three';
import {
  PALETTE, rng, mat, metal, emissive, textured, canvasTexture, signTexture, shade,
  box, cylinder, cone, beam, place, gableRoof, door, windowPanel,
} from '../../src/lib/index.js';

// Local parts for the lumber camp: logs, pines, the loader, the logging truck, cabins.

const BARK = mat('#6a4527');
const BARK_DARK = mat('#553820');

const endGrain = canvasTexture(64, 64, (ctx, W, H) => {
  ctx.fillStyle = '#5a3b22';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#e2c189';
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, W * 0.44, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#b98f58';
  ctx.lineWidth = 2;
  for (const r of [0.34, 0.25, 0.16, 0.08]) {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * r, 0, Math.PI * 2);
    ctx.stroke();
  }
}, { key: 'lumber-camp:endgrain', repeat: false });
const END = textured(endGrain);

// Horizontal round-log wall: three logs per metre (box UVs are in metres).
const logWallTex = canvasTexture(64, 64, (ctx, W, H) => {
  const n = 3;
  for (let i = 0; i < n; i++) {
    const y0 = (i * H) / n, h = H / n;
    const gr = ctx.createLinearGradient(0, y0, 0, y0 + h);
    gr.addColorStop(0, '#8a5a32');
    gr.addColorStop(0.45, '#b07a46');
    gr.addColorStop(1, '#5e3c20');
    ctx.fillStyle = gr;
    ctx.fillRect(0, y0, W, h);
    ctx.fillStyle = '#d8c7a0';
    ctx.fillRect(0, y0 + h - 2, W, 2);
  }
}, { key: 'lumber-camp:logwall' });
export const LOG_WALL = textured(logWallTex);

// Red board-and-batten siding (one batten every 0.5 m).
const boardTex = canvasTexture(64, 64, (ctx, W, H) => {
  ctx.fillStyle = '#9c3a2a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#7a2a1e';
  for (const x of [0, W / 2]) ctx.fillRect(x, 0, 5, H);
}, { key: 'lumber-camp:boards' });
export const RED_BOARDS = textured(boardTex);

/** Log lying along X, resting on y = 0. */
export function log(len, r = 0.3) {
  const geo = new THREE.CylinderGeometry(r, r * 0.92, len, 8);
  geo.rotateZ(Math.PI / 2);
  geo.translate(0, r, 0);
  return new THREE.Mesh(geo, [BARK, END, END]);
}

/** Standing log (stump, chopping block, post). */
export function stump(r = 0.35, h = 0.5) {
  const geo = new THREE.CylinderGeometry(r, r * 1.15, h, 8);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [BARK_DARK, END, END]);
}

/** Pyramid of logs along X; `rows` logs in the bottom row, stacked across Z. */
export function logPile({ rows = 4, len = 6, r = 0.3, seed = 1 } = {}) {
  const rand = rng(seed);
  const g = new THREE.Group();
  const step = r * 2;
  for (let i = 0; i < rows; i++) {
    const n = rows - i;
    for (let j = 0; j < n; j++) {
      const z = (j - (n - 1) / 2) * step;
      const l = len * rand.range(0.88, 1.04);
      const lg = log(l, r * rand.range(0.88, 1.0));
      lg.position.set(rand.range(-0.25, 0.25), i * r * 1.72, z);
      g.add(lg);
    }
  }
  return g;
}

/** Layered pine tree. */
export function pine({ h = 8, seed = 1 } = {}) {
  const rand = rng(seed);
  const leaf = mat(rand.pick(['#2c5a27', '#356b2d', '#26502a', '#3d7333']));
  const g = new THREE.Group();
  g.add(cylinder(h * 0.025, h * 0.04, h * 0.3, mat(PALETTE.trunk), 6));
  const tiers = [[0.22, 0.16, 0.4], [0.17, 0.38, 0.36], [0.11, 0.58, 0.42]];
  for (const [rr, y, hh] of tiers) {
    const c = cone(h * rr, h * hh, leaf, 7);
    c.position.y = h * y;
    c.rotation.y = rand() * Math.PI;
    g.add(c);
  }
  return g;
}

/** Big face-on sign with 0..1 UVs (the lib sign shrinks text on faces over 1 m). */
export function boardSign({ text, w, h, d = 0.15, bg = '#5a3b22', fg = '#f4e3b5', border = '#f4e3b5' }) {
  const tex = signTexture(text, { bg, fg, border, width: 512, height: Math.round((512 * h) / w) });
  const face = textured(tex);
  const edge = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [edge, edge, edge, edge, face, face]);
}

/** Knuckleboom log loader on tracks; the boom reaches towards -X and holds a log. */
export function logLoader() {
  const yellow = mat('#e9b318', { roughness: 0.55 });
  const dark = mat(PALETTE.darkGrey);
  const black = mat('#262626');
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = new THREE.Group();
  // crawler tracks
  for (const sz of [-1, 1]) {
    g.add(place(box(4.2, 0.9, 0.75, black), { z: sz * 1.15 }));
    g.add(place(box(4.3, 0.12, 0.8, dark), { y: 0.84, z: sz * 1.15 }));
    for (const x of [-1.6, 1.6]) {
      const geo = new THREE.CylinderGeometry(0.45, 0.45, 0.8, 10).rotateX(Math.PI / 2);
      const m = new THREE.Mesh(geo, dark);
      m.position.set(x, 0.45, sz * 1.15);
      g.add(m);
    }
  }
  g.add(place(box(3.0, 0.5, 1.6, dark), { y: 0.4 }));
  g.add(place(cylinder(1.1, 1.1, 0.3, dark, 12), { y: 0.9 }));
  // house + counterweight + cab
  g.add(place(box(3.2, 1.3, 2.4, yellow), { x: 0.4, y: 1.2 }));
  g.add(place(box(0.7, 1.1, 2.4, dark), { x: 2.3, y: 1.25 }));
  g.add(place(box(1.5, 1.7, 1.2, yellow), { x: -0.4, y: 2.5, z: 0.55 }));
  g.add(place(box(1.56, 0.9, 1.0, glassM), { x: -0.4, y: 3.0, z: 0.55 }));
  g.add(place(box(1.3, 0.92, 1.24, glassM), { x: -0.4, y: 3.0, z: 0.55 }));
  g.add(place(box(1.7, 0.12, 1.4, dark), { x: -0.4, y: 4.2, z: 0.55 }));
  g.add(place(box(1.0, 0.5, 1.0, dark), { x: 1.2, y: 2.5, z: -0.5 }));
  g.add(place(cylinder(0.08, 0.08, 1.0, dark, 6), { x: 1.5, y: 3.0, z: -0.8 }));
  // boom and stick
  const pivot = [-0.9, 2.6, -0.55], elbow = [-2.7, 6.4, -0.55], tip = [-4.0, 4.7, -0.55];
  g.add(beam(pivot, elbow, 0.55, yellow));
  g.add(beam(elbow, tip, 0.42, yellow));
  g.add(beam([0.2, 2.6, -0.55], [-2.2, 5.6, -0.55], 0.14, mat(PALETTE.steelLight)));
  g.add(beam([-2.4, 6.6, -0.55], [-3.7, 5.3, -0.55], 0.12, mat(PALETTE.steelLight)));
  // grapple holding a log (log along Z)
  g.add(place(cylinder(0.25, 0.25, 0.4, dark, 8), { x: tip[0], y: tip[1] - 0.4, z: tip[2] }));
  for (const sz of [-1, 1]) {
    g.add(beam([tip[0], tip[1] - 0.3, tip[2] + sz * 0.15], [tip[0] - 0.55, tip[1] - 1.3, tip[2] + sz * 0.15], 0.12, dark));
    g.add(beam([tip[0], tip[1] - 0.3, tip[2] + sz * 0.15], [tip[0] + 0.55, tip[1] - 1.3, tip[2] + sz * 0.15], 0.12, dark));
  }
  g.add(place(log(6.5, 0.32), { x: tip[0], y: tip[1] - 1.45, z: tip[2] + 0.6, ry: 90 }));
  return g;
}

/** Logging truck with a full load of logs, built along X with the cab at +X (~10.8 m). */
export function loggingTruck({ color = '#c6352b', seed = 5 } = {}) {
  const red = mat(color, { roughness: 0.45, metalness: 0.2 });
  const dark = mat(PALETTE.darkGrey);
  const chrome = mat('#d6d9dc', { roughness: 0.25, metalness: 0.8 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const wheelM = mat('#1f1f1f');
  const g = new THREE.Group();
  // chassis
  g.add(place(box(10.6, 0.35, 1.0, dark), { x: -0.2, y: 0.7 }));
  // hood, grille, bumper, fenders
  g.add(place(box(1.7, 1.0, 1.9, red), { x: 4.3, y: 1.0 }));
  g.add(place(box(0.08, 0.85, 1.3, chrome), { x: 5.17, y: 1.05 }));
  g.add(place(box(0.25, 0.3, 2.3, chrome), { x: 5.25, y: 0.6 }));
  for (const sz of [-1, 1]) {
    g.add(place(box(1.2, 0.12, 0.45, red), { x: 4.3, y: 1.0, z: sz * 1.05 }));
    g.add(place(box(0.06, 0.25, 0.35, emissive('#fff3c4', 0.4)), { x: 5.18, y: 1.55, z: sz * 0.75 }));
  }
  // cab with windows
  g.add(place(box(1.7, 2.1, 2.3, red), { x: 2.6, y: 1.0 }));
  g.add(place(box(0.06, 0.8, 1.9, glassM), { x: 3.45, y: 2.05 }));
  g.add(place(box(1.0, 0.7, 2.34, glassM), { x: 2.85, y: 2.1 }));
  g.add(place(box(1.8, 0.1, 2.4, shade(color, -0.25)), { x: 2.6, y: 3.1 }));
  // exhaust stacks
  for (const sz of [-1, 1]) g.add(place(cylinder(0.11, 0.11, 3.2, chrome, 8), { x: 1.6, y: 0.9, z: sz * 1.25 }));
  // headache rack
  g.add(place(box(0.2, 2.9, 2.3, dark), { x: 1.45, y: 0.9 }));
  // log bunks with stakes
  for (const x of [0.7, -2.2, -5.0]) {
    g.add(place(box(0.3, 0.25, 2.5, dark), { x, y: 1.05 }));
    for (const sz of [-1, 1]) g.add(place(box(0.14, 1.9, 0.14, dark), { x, y: 1.2, z: sz * 1.18 }));
  }
  // the load
  g.add(place(logPile({ rows: 4, len: 7.4, r: 0.28, seed }), { x: -2.15, y: 1.3 }));
  // wheels: steer, tandem drive, trailer tandem
  for (const x of [4.3, 1.0, -0.1, -3.9, -5.0]) for (const sz of [-1, 1]) {
    const geo = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10).rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, wheelM);
    m.position.set(x, 0.5, sz * 1.0);
    g.add(m);
  }
  return g;
}

/** Log bunk cabin: w along X, d along Z, door + windows on the front (+Z). */
export function logCabin({ w = 5, d = 4, h = 2.6, roof = '#4b6b3a', seed = 1 } = {}) {
  const g = new THREE.Group();
  g.add(place(box(w + 0.3, 0.35, d + 0.3, mat(PALETTE.stone)), {}));
  g.add(place(box(w, h, d, LOG_WALL), { y: 0.35 }));
  // corner log ends
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.3, h, 0.3, mat('#8a5a32')), { x: sx * w / 2, y: 0.35, z: sz * d / 2 }));
  const roofM = mat(roof, { roughness: 0.8 });
  g.add(place(gableRoof({ w, d, h: 1.5, overhang: 0.45, ridge: 'x', material: roofM, gableMaterial: LOG_WALL }), { y: 0.35 + h }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.woodDark }), { y: 0.35, z: d / 2 }));
  for (const x of [-w * 0.3, w * 0.3]) g.add(place(windowPanel({ w: 0.8, h: 0.8, lit: seed % 2 === 0 && x > 0 }), { x, y: 1.4, z: d / 2 }));
  // back and side windows
  for (const x of [-w * 0.25, w * 0.25]) g.add(place(windowPanel({ w: 0.8, h: 0.8 }), { x, y: 1.4, z: -d / 2, ry: 180 }));
  for (const sx of [-1, 1]) g.add(place(windowPanel({ w: 0.8, h: 0.8 }), { x: sx * w / 2, y: 1.4, ry: sx * 90 }));
  // little stoop
  g.add(place(box(1.6, 0.2, 0.8, mat(PALETTE.wood)), { y: 0.15, z: d / 2 + 0.4 }));
  // stovepipe
  g.add(place(cylinder(0.12, 0.12, 1.4, mat(PALETTE.darkGrey), 8), { x: w * 0.3, y: 0.35 + h + 0.6, z: -d * 0.2 }));
  return g;
}

/** Puffs of smoke rising from y = 0. */
export function smoke(scale = 1) {
  const m = mat('#d4d4d4', { roughness: 1 });
  const g = new THREE.Group();
  [[0, 0.35, 0.3], [0.25, 0.95, 0.42], [0.6, 1.7, 0.55]].forEach(([x, y, r]) => {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r * scale, 0), m);
    s.position.set(x * scale, y * scale, 0);
    g.add(s);
  });
  return g;
}


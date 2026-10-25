import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, place, group, mat, metal, emissive, textured, surface,
  canvasTexture, door, sign, car, tree, streetLamp, pipe,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z; panels face south (+z).
const HALF = 10;
const FENCE = HALF - 0.35;          // fence line, just inside the lot edge
const MODULE_W = 1.1;               // one PV module: 1.1 m wide, 2.2 m long (portrait)
const MODULE_L = 2.2;
const TILT = 25;

// Bright blue PV module: silver frame, 6x12 cells, a soft diagonal sheen.
function moduleMaterial() {
  const tex = canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = '#d4dae2';
    ctx.fillRect(0, 0, W, H);
    const pad = 5, cols = 6, rows = 12;
    const cw = (W - pad * 2) / cols, ch = (H - pad * 2) / rows;
    ctx.fillStyle = '#9fbde6';
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x = pad + c * cw, y = pad + r * ch;
        const g = ctx.createLinearGradient(x, y, x + cw, y + ch);
        g.addColorStop(0, '#3f78d0');
        g.addColorStop(1, '#2754a8');
        ctx.fillStyle = g;
        ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2);
      }
    }
    // sky reflection
    const s = ctx.createLinearGradient(0, 0, W, H);
    s.addColorStop(0, 'rgba(255,255,255,0.22)');
    s.addColorStop(0.45, 'rgba(255,255,255,0.0)');
    s.addColorStop(1, 'rgba(255,255,255,0.08)');
    ctx.fillStyle = s;
    ctx.fillRect(pad, pad, W - pad * 2, H - pad * 2);
  }, { key: 'solar-farm:module' });
  tex.repeat.set(1 / MODULE_W, 1 / MODULE_L);
  return textured(tex, { roughness: 0.3, metalness: 0.35 });
}

// Chain-link mesh: transparent diamond pattern, tiles every 1 m.
function chainLinkMaterial() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#c3c9cf';
    ctx.lineWidth = 3;
    for (let i = -W; i < W * 2; i += 16) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + H, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(i + H, 0); ctx.lineTo(i, H); ctx.stroke();
    }
  }, { key: 'solar-farm:chainlink' });
  return textured(tex, { transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.6, metalness: 0.4 });
}

// One tilted table of modules, `modules` long along X, facing +z.
function panelRow(modules, { low = 0.55 } = {}) {
  const length = modules * MODULE_W;
  const t = THREE.MathUtils.degToRad(TILT);
  const frameM = metal(PALETTE.steelLight);
  const legM = metal(PALETTE.steelDark);
  const g = new THREE.Group();

  const slab = box(length, 0.07, MODULE_L, [frameM, frameM, moduleMaterial(), legM, frameM, frameM]);
  slab.rotation.x = t;
  slab.position.y = low + (MODULE_L / 2) * Math.sin(t);
  g.add(slab);

  // racking: front/back posts and a raked rafter every ~3.3 m
  const zf = (MODULE_L / 2) * Math.cos(t) * 0.7;
  const hf = low + MODULE_L * 0.15 * Math.sin(t);
  const hb = low + MODULE_L * 0.85 * Math.sin(t);
  const bays = Math.max(1, Math.round(length / 3.3));
  for (let i = 0; i <= bays; i++) {
    const x = -length / 2 + 0.25 + ((length - 0.5) * i) / bays;
    g.add(place(box(0.1, hf, 0.1, legM), { x, z: zf }));
    g.add(place(box(0.1, hb, 0.1, legM), { x, z: -zf }));
    g.add(pipe([x, hf - 0.15, zf], [x, hb - 0.15, -zf], 0.04, legM));
  }
  // combiner box on the east end
  g.add(place(box(0.35, 0.45, 0.2, mat(PALETTE.lightGrey)), { x: length / 2 - 0.2, y: 0.25, z: -zf - 0.15 }));
  return g;
}

// Straight fence run along X from x0 to x1: posts, mesh, top rail, barbed wire on outward arms.
function fenceRun(x0, x1, { h = 2.1, out = 1 } = {}) {
  const len = x1 - x0, cx = (x0 + x1) / 2;
  const postM = metal(PALETTE.steel);
  const wireM = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  g.add(place(box(len, h - 0.1, 0.02, chainLinkMaterial()), { x: cx, y: 0.05 }));
  g.add(place(box(len, 0.06, 0.06, postM), { x: cx, y: h - 0.06 }));
  g.add(place(box(len, 0.04, 0.05, postM), { x: cx, y: 0.1 }));
  const posts = Math.max(1, Math.round(len / 2.5));
  for (let i = 0; i <= posts; i++) {
    const x = x0 + (len * i) / posts;
    g.add(place(cylinder(0.05, 0.05, h, postM, 6), { x }));
    g.add(place(box(0.05, 0.5, 0.05, postM), { x, y: h - 0.05, z: out * 0.15, rx: out * 40 }));
  }
  for (let k = 1; k <= 3; k++) {
    const a = k * 0.15;
    g.add(place(box(len, 0.025, 0.025, wireM), { x: cx, y: h - 0.05 + a * Math.cos(0.7), z: out * a * Math.sin(0.7) + out * 0.02 }));
  }
  return g;
}

// Inverter hut: rendered block, flat overhanging roof, louvres, door, sign.
function inverterHut() {
  const w = 4.4, d = 2.8, h = 2.7;
  const wallM = mat(PALETTE.cream);
  const trimM = mat(PALETTE.lightGrey);
  const louvreM = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(box(w + 0.2, 0.25, d + 0.2, mat(PALETTE.concrete)));
  g.add(place(box(w, h, d, wallM), { y: 0.25 }));
  g.add(place(box(w + 0.5, 0.22, d + 0.5, trimM), { y: 0.25 + h }));
  g.add(place(box(w + 0.3, 0.08, d + 0.3, surface('gravel', PALETTE.gravel, { size: 2 })), { y: 0.25 + h + 0.22 }));
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.steel }), { x: -1.2, y: 0.25, z: d / 2 }));
  // louvred vents on front and both sides
  const vent = (vw, vh) => {
    const v = group(box(vw, vh, 0.06, trimM));
    for (let i = 0; i < 5; i++) v.add(place(box(vw - 0.1, 0.06, 0.1, louvreM), { y: 0.1 + (i * (vh - 0.2)) / 4 }));
    return v;
  };
  g.add(place(vent(1.4, 1.0), { x: 0.9, y: 1.1, z: d / 2 }));
  g.add(place(vent(1.2, 1.0), { x: w / 2, y: 1.1, ry: 90 }));
  g.add(place(vent(1.2, 1.0), { x: -w / 2, y: 1.1, ry: -90 }));
  g.add(place(vent(1.4, 1.0), { x: 0.6, y: 1.1, z: -d / 2, ry: 180 }));
  g.add(place(sign({ text: 'SOLAR', w: 2.2, h: 0.55, bg: PALETTE.navy, fg: '#ffd84a', depth: 0.08 }), { x: 0.9, y: 2.35, z: d / 2 }));
  // danger plate by the door
  g.add(place(sign({ text: '!', w: 0.4, h: 0.4, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.04 }), { x: -0.35, y: 1.6, z: d / 2 }));
  // wall lamp over the door
  g.add(place(box(0.3, 0.12, 0.25, emissive(PALETTE.windowLit, 0.6)), { x: -1.2, y: 2.55, z: d / 2 + 0.12 }));
  // AC unit on the roof
  g.add(place(box(1.0, 0.5, 0.8, mat(PALETTE.lightGrey)), { x: 1.2, y: 0.25 + h + 0.3, z: -0.3 }));
  g.add(place(cylinder(0.3, 0.3, 0.05, louvreM, 10), { x: 1.2, y: 0.25 + h + 0.8, z: -0.3 }));
  return g;
}

// Pad-mounted transformer: green cabinet with cooling fins.
function transformer() {
  const green = mat('#4f7f4a');
  const g = group(box(1.8, 0.2, 1.6, mat(PALETTE.concrete)));
  g.add(place(box(1.3, 1.4, 1.1, green), { y: 0.2 }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.06, 1.0, 0.25, green), { x: -0.5 + i * 0.25, y: 0.35, z: 0.65 }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.06, 1.0, 0.25, green), { x: -0.5 + i * 0.25, y: 0.35, z: -0.65 }));
  for (let i = -1; i <= 1; i++) {
    g.add(place(cylinder(0.08, 0.1, 0.45, mat(PALETTE.brick), 8), { x: i * 0.35, y: 1.6, z: -0.2 }));
  }
  g.add(place(sign({ text: '!', w: 0.35, h: 0.35, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.03 }), { y: 0.9, z: 0.55 }));
  return g;
}

// Wooden power pole with crossarm and insulators.
function powerPole(h = 7) {
  const wood = mat(PALETTE.woodDark);
  const g = group(cylinder(0.12, 0.15, h, wood, 8));
  g.add(place(box(2.0, 0.14, 0.14, wood), { y: h - 0.6 }));
  for (const x of [-0.85, 0, 0.85]) g.add(place(cylinder(0.06, 0.08, 0.25, mat(PALETTE.brick), 6), { x, y: h - 0.46 }));
  return g;
}

// CCTV mast with camera looking towards +z.
function cctv(h = 4) {
  const m = metal(PALETTE.steelLight);
  return group(
    cylinder(0.06, 0.08, h, m, 6),
    place(box(0.5, 0.06, 0.06, m), { y: h - 0.1, z: 0.2, ry: 90 }),
    place(box(0.22, 0.2, 0.5, mat(PALETTE.white)), { y: h - 0.3, z: 0.45 }),
    place(box(0.14, 0.14, 0.04, mat(PALETTE.black)), { y: h - 0.27, z: 0.71 })
  );
}

// Little weather station: mast, solar sensor arm and cup anemometer.
function weatherMast(h = 3.2) {
  const m = metal(PALETTE.steelLight);
  const g = group(cylinder(0.04, 0.05, h, m, 6));
  g.add(place(box(0.8, 0.04, 0.04, m), { y: h - 0.5 }));
  g.add(place(box(0.25, 0.04, 0.3, moduleMaterial()), { x: 0.4, y: h - 0.45, rx: 25 }));
  g.add(place(box(0.25, 0.3, 0.12, mat(PALETTE.white)), { x: -0.05, y: 1.2, z: 0.1 }));
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    g.add(place(sphere(0.07, mat(PALETTE.black), 6), { x: Math.cos(a) * 0.2, y: h + 0.05, z: Math.sin(a) * 0.2 }));
  }
  g.add(place(box(0.4, 0.02, 0.02, m), { y: h + 0.08 }));
  g.add(place(box(0.02, 0.02, 0.4, m), { y: h + 0.08 }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // gravel service yard (front-right) with access track from the gate
  const padX0 = 2.4, padZ0 = 2.5;
  g.add(place(patch(FENCE - padX0, FENCE - padZ0, 'gravel'), { x: (padX0 + FENCE) / 2, y: y0, z: (padZ0 + FENCE) / 2 }));
  g.add(place(patch(3.2, HALF - FENCE + 0.1, 'gravel'), { x: 6.4, y: y0, z: (FENCE + HALF) / 2 }));
  // gravel maintenance strip along the east fence, behind the yard
  g.add(place(patch(1.4, FENCE + padZ0, 'gravel'), { x: FENCE - 0.7, y: y0, z: (padZ0 - FENCE) / 2 }));

  // panel rows: four full rows at the back, two shorter rows in front beside the yard
  const rows = [
    { z: -7.9, modules: 15, x: -8.8 },
    { z: -5.0, modules: 15, x: -8.8 },
    { z: -2.1, modules: 15, x: -8.8 },
    { z: 0.8, modules: 15, x: -8.8 },
    { z: 3.7, modules: 9, x: -8.8 },
    { z: 6.6, modules: 9, x: -8.8 },
  ];
  for (const r of rows) {
    const len = r.modules * MODULE_W;
    g.add(place(panelRow(r.modules), { x: r.x + len / 2, y: y0, z: r.z }));
  }
  // cable trench from the rows to the inverter hut
  const trench = mat(PALETTE.concreteDark);
  g.add(place(box(0.35, 0.08, 9.6, trench), { x: 7.95, y: y0, z: -3.3 }));
  g.add(place(box(0.35, 0.08, 4.3, trench), { x: 1.75, y: y0, z: 4.75 }));
  g.add(place(box(1.6, 0.08, 0.35, trench), { x: 2.55, y: y0, z: 6.8 }));

  // inverter hut + transformer + power pole in the yard
  g.add(place(inverterHut(), { x: 6.6, y: y0, z: 4.3 }));
  g.add(place(transformer(), { x: 3.4, y: y0, z: 3.9 }));
  const pole = powerPole(6.5);
  g.add(place(pole, { x: 3.0, y: y0, z: 6.2 }));
  for (const dx of [-0.35, 0, 0.35]) {
    g.add(pipe([3.4 + dx, y0 + 2.05, 3.7], [3.0 + dx * 2.4, y0 + 6.1, 6.2], 0.015, metal(PALETTE.darkGrey)));
  }
  g.add(place(streetLamp({ h: 4.5 }), { x: 2.9, y: y0, z: 8.9 }));
  g.add(place(weatherMast(), { x: 8.8, y: y0, z: 2.0 }));

  // maintenance van parked in the yard
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 8.3, y: y0 + 0.05, z: 7.7, ry: 90, s: 0.7 }));

  // security fence with a sliding gate (open) on the street side
  const gate0 = 4.8, gate1 = 8.0;
  g.add(place(fenceRun(-FENCE, gate0), { y: y0, z: FENCE }));
  g.add(place(fenceRun(gate1, FENCE), { y: y0, z: FENCE }));
  g.add(place(fenceRun(-FENCE, FENCE, { out: -1 }), { y: y0, z: -FENCE }));
  g.add(place(fenceRun(-FENCE, FENCE, { out: -1 }), { y: y0, x: -FENCE, ry: -90 }));
  g.add(place(fenceRun(-FENCE, FENCE, { out: 1 }), { y: y0, x: FENCE, ry: -90 }));
  // gate posts and the slid-open gate leaf just inside the fence
  const postM = metal(PALETTE.darkGrey);
  for (const x of [gate0, gate1]) g.add(place(box(0.2, 2.4, 0.2, postM), { x, y: y0, z: FENCE }));
  const leaf = group(place(box(3.1, 1.8, 0.02, chainLinkMaterial()), { y: 0.2 }));
  leaf.add(place(box(3.1, 0.08, 0.08, metal(PALETTE.yellow)), { y: 2.0 }));
  leaf.add(place(box(3.1, 0.08, 0.08, metal(PALETTE.yellow)), { y: 0.2 }));
  for (const x of [-1.5, 0, 1.5]) leaf.add(place(box(0.08, 1.9, 0.08, metal(PALETTE.yellow)), { x, y: 0.15 }));
  g.add(place(leaf, { x: gate0 - 1.6, y: y0, z: FENCE - 0.25 }));
  // warning signs on the fence
  for (const x of [-6, -1]) {
    g.add(place(sign({ text: 'DANGER', w: 0.9, h: 0.5, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.03 }), { x, y: y0 + 1.1, z: FENCE + 0.03 }));
  }
  g.add(place(sign({ text: 'DANGER', w: 0.9, h: 0.5, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.03 }), { x: -FENCE - 0.03, y: y0 + 1.1, z: 1, ry: -90 }));
  g.add(place(sign({ text: 'DANGER', w: 0.9, h: 0.5, bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.03 }), { x: FENCE + 0.03, y: y0 + 1.1, z: -4, ry: 90 }));

  // CCTV masts in the corners
  g.add(place(cctv(), { x: -FENCE + 0.4, y: y0, z: FENCE - 0.4, ry: 45 }));
  g.add(place(cctv(), { x: -FENCE + 0.4, y: y0, z: -FENCE + 0.4, ry: 135 }));
  g.add(place(cctv(), { x: FENCE - 0.4, y: y0, z: -FENCE + 0.4, ry: -135 }));

  // a few shrubs in the yard corner
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 31 }), { x: FENCE - 0.6, y: y0, z: FENCE - 0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 32 }), { x: 2.0, y: y0, z: FENCE - 0.6 }));
  return g;
}

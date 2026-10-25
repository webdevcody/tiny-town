import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, place, group, cylinder, sphere, extrude, gableRoof, chimney, door, windowPanel,
  tree, hedge, streetLamp, bench, surface, mat, metal, shade, ShapeBuilder,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Four two-storey brick terraced houses facing the street (+z),
// each with a canted bay window, a coloured front door, a walled front garden and a back yard.

const N = 4;
const HW = 4.6;                 // width of one house
const TW = N * HW;              // whole terrace
const D = 5.2;                  // depth of the terrace
const ZF = 1.8;                 // front wall
const ZC = ZF - D / 2;          // terrace centre line (ridge)
const ZB = ZF - D;              // back wall
const WALL_H = 6;               // two storeys
const ROOF_H = 2.6;
const GARDEN_Z = 4.0;           // front garden wall line
const DOORS = [PALETTE.red, PALETTE.navy, '#2f7a3d', PALETTE.yellow];

const white = () => mat(PALETTE.white);
const stone = () => mat(PALETTE.stone);
const black = () => mat(PALETTE.black);
const slate = () => surface('shingles', PALETTE.roofSlate, { size: 1.4 });
const brickOf = (i) => surface('brick', i % 2 ? shade(PALETTE.brick, -0.08) : PALETTE.brick, { size: 1.2 });

// Sash window on a wall facing +z: white frame, glazing bar, stone sill and lintel.
function sashWindow(w, h, lit = false) {
  return group(
    windowPanel({ w, h, frame: PALETTE.white, lit }),
    place(box(w, 0.07, 0.06, white()), { y: h / 2, z: 0.1 }),
    place(box(0.05, h, 0.06, white()), { z: 0.1 }),
    place(box(w + 0.4, 0.1, 0.22, stone()), { y: -0.1, z: 0.08 }),
    place(box(w + 0.35, 0.22, 0.1, stone()), { y: h + 0.2, z: 0.03 }),
  );
}

// Canted bay window (ground floor), its back sits on the wall plane z = 0, sticks out to +z.
function bayWindow(brick, lit) {
  const g = new THREE.Group();
  const H = 2.9, P = 0.7, BW = 1.25, FW = 0.85;
  const pts = [[-BW, 0], [-FW, P], [FW, P], [BW, 0]];
  g.add(place(box(2 * BW + 0.1, 0.35, 0.05, mat(PALETTE.brickDark)), { z: 0 }));
  g.add(extrude([[-BW, -0.05], ...pts.slice(0, 4), [BW, -0.05]], H, brick, white()));
  // windows: front + two angled sides
  g.add(place(sashWindow(1.3, 1.55, lit), { y: 0.85, z: P }));
  const sideLen = Math.hypot(BW - FW, P);
  const ang = (Math.atan2(BW - FW, P) * 180) / Math.PI;
  for (const s of [-1, 1]) {
    g.add(place(sashWindow(sideLen - 0.36, 1.55), { x: (s * (BW + FW)) / 2, y: 0.85, z: P / 2, ry: s * (90 - ang) }));
  }
  // stone cornice + little hipped slate roof
  const o = 0.14;
  const cp = [[-BW - o, -0.05], [-FW - o * 0.6, P + o], [FW + o * 0.6, P + o], [BW + o, -0.05]];
  g.add(place(extrude(cp, 0.2, white()), { y: H }));
  const hr = 0.65, a = cp[0], b = cp[1], c = cp[2], d = cp[3];
  const sb = new ShapeBuilder();
  sb.quad([b[0], 0, b[1]], [c[0], 0, c[1]], [c[0], hr, 0], [b[0], hr, 0], 0);
  sb.tri([a[0], 0, a[1]], [b[0], 0, b[1]], [b[0], hr, 0], 0);
  sb.tri([c[0], 0, c[1]], [d[0], 0, d[1]], [c[0], hr, 0], 0);
  g.add(place(new THREE.Mesh(sb.build(), [slate()]), { y: H + 0.2 }));
  return g;
}

// Front door with stone step, fanlight, white surround and a bracketed hood.
function frontDoor(color) {
  return group(
    place(box(1.45, 0.3, 0.55, stone()), { z: 0.27 }),
    place(box(1.4, 3.05, 0.06, white()), { y: 0.3, z: 0.03 }),
    place(door({ w: 0.95, h: 2.2, color, frame: PALETTE.white }), { y: 0.3, z: 0.04 }),
    place(box(0.06, 0.06, 0.18, mat(PALETTE.yellow, { metalness: 0.6 })), { x: 0.3, y: 1.4, z: 0.2 }),
    place(windowPanel({ w: 0.95, h: 0.42, frame: PALETTE.white }), { y: 2.6, z: 0.05 }),
    place(box(1.6, 0.14, 0.55, white()), { y: 3.2, z: 0.27 }),
    place(box(0.12, 0.35, 0.4, white()), { x: -0.65, y: 2.85, z: 0.2 }),
    place(box(0.12, 0.35, 0.4, white()), { x: 0.65, y: 2.85, z: 0.2 }),
  );
}

function wheelieBin(color) {
  return group(
    box(0.6, 0.95, 0.7, mat(color)),
    place(box(0.66, 0.07, 0.78, mat(shade(color, -0.2))), { y: 0.95 }),
  );
}

function chimneyStack(w) {
  const g = group(chimney({ w, d: 0.75, h: 1.5, material: surface('brick', PALETTE.brickDark, { size: 1 }) }));
  const pot = mat(PALETTE.terracotta);
  const n = Math.max(2, Math.round(w / 0.4));
  for (let i = 0; i < n; i++) {
    g.add(place(cylinder(0.11, 0.14, 0.45, pot, 8), { x: -w / 2 + 0.2 + (i * (w - 0.4)) / (n - 1), y: 1.7 }));
  }
  return g;
}

// Black iron railing along X, length len, bars every ~0.2 m.
function railing(len, h = 0.5) {
  const m = black();
  const g = group(place(box(len, 0.05, 0.05, m), { y: h }), place(box(len, 0.04, 0.04, m), { y: 0.1 }));
  const n = Math.max(2, Math.round(len / 0.22));
  for (let i = 0; i <= n; i++) g.add(place(box(0.035, h, 0.035, m), { x: -len / 2 + (len * i) / n }));
  return g;
}

function washingLine(len) {
  const pole = mat(PALETTE.lightGrey);
  const g = group(
    place(box(0.06, 1.8, 0.06, pole), { x: -len / 2 }),
    place(box(0.06, 1.8, 0.06, pole), { x: len / 2 }),
    place(box(len, 0.02, 0.02, pole), { y: 1.75 }),
  );
  const cols = [PALETTE.white, PALETTE.blue, PALETTE.pink, PALETTE.yellow];
  for (let i = 0; i < 4; i++) {
    g.add(place(box(0.38, 0.5, 0.03, mat(cols[i])), { x: -len / 2 + 0.4 + i * (len - 0.8) / 3, y: 1.25 }));
  }
  return g;
}

function shed() {
  const wood = surface('planks', PALETTE.wood, { size: 1 });
  return group(
    box(1.3, 1.6, 1.0, wood),
    place(box(1.5, 0.08, 1.2, mat(PALETTE.roofGreen)), { y: 1.6, rx: -8 }),
    place(box(0.55, 1.3, 0.05, mat(PALETTE.woodDark)), { x: 0.2, z: 0.52 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  // pavement along the street edge, back yard paving
  g.add(place(patch(2 * TILE, 0.9, 'paved'), { y: y0, z: TILE / 2 - 0.45 }));
  g.add(place(patch(TW, ZB + TILE / 2, 'paved'), { y: y0, z: (ZB - TILE / 2) / 2 }));

  // ---- the terrace block ----
  g.add(place(box(TW + 0.06, 0.4, D + 0.06, mat(PALETTE.brickDark)), { y: y0, z: ZC }));
  for (let i = 0; i < N; i++) {
    const cx = -TW / 2 + HW * (i + 0.5);
    g.add(place(box(HW, WALL_H, D, brickOf(i)), { x: cx, y: y0, z: ZC }));
  }
  // string course and eaves cornice
  g.add(place(box(TW + 0.08, 0.14, D + 0.08, stone()), { y: y0 + 2.95, z: ZC }));
  g.add(place(box(TW + 0.12, 0.25, D + 0.12, white()), { y: y0 + WALL_H - 0.25, z: ZC }));
  // pilasters marking each house on the front, plus corner quoins
  const pil = mat(shade(PALETTE.brick, 0.12));
  for (let i = 0; i <= N; i++) {
    const x = Math.max(-TW / 2 + 0.16, Math.min(TW / 2 - 0.16, -TW / 2 + i * HW));
    g.add(place(box(0.32, WALL_H - 0.25, 0.08, pil), { x, y: y0, z: ZF + 0.02 }));
  }
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 7; k++) {
      g.add(place(box(0.1, 0.32, k % 2 ? 0.4 : 0.6, stone()), { x: sx * (TW / 2 + 0.03), y: y0 + 0.5 + k * 0.78, z: ZF - 0.25 }));
    }
  }

  // gable-end windows and cast-iron downpipes at the party walls
  for (const sx of [-1, 1]) {
    g.add(place(sashWindow(0.8, 1.3), { x: sx * TW / 2, y: y0 + 3.9, z: ZC - 0.6, ry: sx * 90 }));
    g.add(place(sashWindow(0.8, 1.3), { x: sx * TW / 2, y: y0 + 1.0, z: ZC - 0.6, ry: sx * 90 }));
  }
  const iron = black();
  for (let i = 0; i <= N; i += 2) {
    const x = Math.max(-TW / 2 + 0.4, Math.min(TW / 2 - 0.4, -TW / 2 + i * HW));
    g.add(place(box(0.12, WALL_H - 0.2, 0.12, iron), { x, y: y0, z: ZB - 0.08 }));
  }
  g.add(place(box(TW + 0.5, 0.14, 0.16, iron), { y: y0 + WALL_H - 0.3, z: ZB - 0.32 }));
  g.add(place(box(TW + 0.5, 0.14, 0.16, iron), { y: y0 + WALL_H - 0.3, z: ZF + 0.32 }));

  // ---- slate roof, ridge, chimneys, rooflights ----
  const roofY = y0 + WALL_H;
  g.add(place(gableRoof({ w: TW, d: D, h: ROOF_H, overhang: 0.35, ridge: 'x', material: slate(), gableMaterial: brickOf(0) }), { y: roofY, z: ZC }));
  g.add(place(box(TW + 0.7, 0.16, 0.3, mat(shade(PALETTE.roofSlate, -0.25))), { y: roofY + ROOF_H - 0.06, z: ZC }));
  for (let i = 0; i <= N; i++) {
    const end = i === 0 || i === N;
    const x = -TW / 2 + i * HW + (i === 0 ? 0.5 : i === N ? -0.5 : 0);
    g.add(place(chimneyStack(end ? 0.9 : 1.3), { x, y: roofY + ROOF_H - 0.4, z: ZC }));
  }
  g.add(place(group(cylinder(0.03, 0.03, 1.4, metal(PALETTE.steel), 5), place(box(0.9, 0.04, 0.04, metal(PALETTE.steel)), { y: 1.2 }), place(box(0.6, 0.04, 0.04, metal(PALETTE.steel)), { y: 1.0 })), { x: -HW, y: roofY + ROOF_H + 1.5, z: ZC }));
  const slope = Math.atan2(ROOF_H, D / 2) * 180 / Math.PI;
  for (let i = 0; i < N; i++) {
    const cx = -TW / 2 + HW * (i + 0.5);
    g.add(place(group(box(0.8, 0.1, 1.0, mat(PALETTE.darkGrey)), place(box(0.65, 0.06, 0.85, mat(PALETTE.glassSky, { metalness: 0.4, roughness: 0.2 })), { y: 0.07 })), { x: cx + (i % 2 ? 0.8 : -0.8), y: roofY + 1.25, z: ZC - 1.3, rx: -slope }));
  }

  // ---- per-house front and back details ----
  for (let i = 0; i < N; i++) {
    const cx = -TW / 2 + HW * (i + 0.5);
    const m = i % 2 === 0 ? 1 : -1;      // houses are built in mirrored pairs (doors side by side)
    const doorX = cx + m * 1.45;
    const bayX = cx - m * 0.75;
    const brick = brickOf(i);

    g.add(place(bayWindow(brick, i === 2), { x: bayX, y: y0, z: ZF }));
    g.add(place(frontDoor(DOORS[i]), { x: doorX, y: y0, z: ZF }));
    g.add(place(sashWindow(1.2, 1.5, i === 1), { x: bayX, y: y0 + 3.75, z: ZF }));
    g.add(place(sashWindow(0.75, 1.5), { x: doorX, y: y0 + 3.75, z: ZF }));
    // house number plaque
    g.add(place(box(0.3, 0.22, 0.04, mat(PALETTE.white)), { x: doorX + m * 0.95, y: y0 + 2.2, z: ZF + 0.02 }));

    // back: kitchen window, back door, two bedroom windows
    g.add(place(sashWindow(1.0, 1.3, i === 3), { x: bayX, y: y0 + 1.0, z: ZB, ry: 180 }));
    g.add(place(door({ w: 0.85, h: 2.1, color: PALETTE.woodDark, frame: PALETTE.white }), { x: doorX, y: y0 + 0.1, z: ZB, ry: 180 }));
    g.add(place(sashWindow(1.0, 1.4), { x: bayX, y: y0 + 3.8, z: ZB, ry: 180 }));
    g.add(place(sashWindow(0.7, 1.1), { x: doorX, y: y0 + 4.0, z: ZB, ry: 180 }));

    // front garden: tiled path, wall with railings and gate piers
    const pathMat = surface('paving', '#c9b49a', { size: 0.6, color2: PALETTE.stone });
    g.add(place(patch(1.1, GARDEN_Z - ZF - 0.3, pathMat), { x: doorX, y: y0, z: (GARDEN_Z + ZF + 0.3) / 2 }));
    g.add(place(patch(1.1, 0.4, pathMat), { x: doorX, y: y0, z: GARDEN_Z + 0.05 }));
    const left = i === 0 ? -TILE + 0.15 : cx - HW / 2;
    const right = i === N - 1 ? TILE - 0.15 : cx + HW / 2;
    for (const [a, b] of [[left, doorX - 0.55], [doorX + 0.55, right]]) {
      const len = b - a;
      const mx = (a + b) / 2;
      g.add(place(box(len, 0.45, 0.3, brick), { x: mx, y: y0, z: GARDEN_Z }));
      g.add(place(box(len, 0.08, 0.36, stone()), { x: mx, y: y0 + 0.45, z: GARDEN_Z }));
      g.add(place(railing(len - 0.4), { x: mx, y: y0 + 0.53, z: GARDEN_Z }));
    }
    for (const s of [-1, 1]) {
      const px = doorX + s * 0.7;
      g.add(place(box(0.34, 0.95, 0.34, brick), { x: px, y: y0, z: GARDEN_Z }));
      g.add(place(box(0.44, 0.1, 0.44, stone()), { x: px, y: y0 + 0.95, z: GARDEN_Z }));
      g.add(place(sphere(0.12, stone(), 8), { x: px, y: y0 + 1.05, z: GARDEN_Z }));
    }
    // open iron gate swung into the garden
    g.add(place(railing(1.0, 0.75), { x: doorX + m * 0.55, y: y0 + 0.05, z: GARDEN_Z - 0.55, ry: 90 }));

    // garden bits: bins, bush / flower tub in front of the bay
    const binX = cx + m * 0.25;
    g.add(place(wheelieBin([PALETTE.green, PALETTE.darkGrey, PALETTE.blue, PALETTE.darkGrey][i]), { x: binX, y: y0, z: GARDEN_Z - 0.6 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: 30 + i }), { x: bayX - m * 0.9, y: y0, z: GARDEN_Z - 0.7 }));
    g.add(place(group(box(0.9, 0.35, 0.4, mat(PALETTE.stone)), place(box(0.8, 0.2, 0.3, mat(i % 2 ? PALETTE.red : PALETTE.purple)), { y: 0.35 })), { x: bayX, y: y0, z: ZF + 0.95 }));
  }

  // party walls between front gardens and between back yards
  for (let i = 1; i < N; i++) {
    const x = -TW / 2 + i * HW;
    g.add(place(box(0.24, 0.5, GARDEN_Z - ZF - 0.15, brickOf(i)), { x, y: y0, z: (GARDEN_Z + ZF - 0.15) / 2 }));
    g.add(place(box(0.08, 1.2, ZB + TILE / 2, surface('planks', PALETTE.wood, { size: 1 })), { x, y: y0, z: (ZB - TILE / 2) / 2 }));
  }
  // end gardens: hedges along the lot sides
  for (const sx of [-1, 1]) {
    g.add(place(hedge({ w: 0.5, h: 0.9, d: GARDEN_Z - ZF + 0.6 }), { x: sx * (TILE - 0.3), y: y0, z: (GARDEN_Z + ZF - 0.6) / 2 }));
  }

  // back yards: fence along the rear, a shed, washing line, a small tree, bins
  const yardD = ZB + TILE / 2;
  const planks = surface('planks', PALETTE.wood, { size: 1 });
  g.add(place(box(2 * TILE - 0.2, 1.2, 0.08, planks), { y: y0, z: -TILE / 2 + 0.1 }));
  for (const sx of [-1, 1]) g.add(place(box(0.08, 1.2, TILE / 2 + ZF - 1.3, planks), { x: sx * (TILE - 0.1), y: y0, z: (ZF - 1.3 - TILE / 2) / 2 }));
  const hx = (i) => -TW / 2 + HW * (i + 0.5);
  g.add(place(shed(), { x: hx(0) - 1.3, y: y0, z: -TILE / 2 + 0.7 }));
  g.add(place(washingLine(3.2), { x: hx(1), y: y0, z: ZB - yardD / 2 }));
  g.add(place(tree({ kind: 'round', h: 3.2, seed: 7 }), { x: hx(2) - 1.2, y: y0, z: -TILE / 2 + 0.8 }));
  g.add(place(bench({ w: 1.2 }), { x: hx(3) + 0.6, y: y0, z: -TILE / 2 + 0.55 }));
  g.add(place(wheelieBin(PALETTE.darkGrey), { x: hx(2) + 1.2, y: y0, z: -TILE / 2 + 0.55 }));
  g.add(place(group(cylinder(0.3, 0.22, 0.45, mat(PALETTE.terracotta), 8), place(tree({ kind: 'bush', h: 0.7, seed: 12 }), { y: 0.4 })), { x: hx(3) - 1.2, y: y0, z: -TILE / 2 + 0.55 }));

  // street furniture on the pavement: lamp, post box, a street tree
  g.add(place(streetLamp({ h: 4.5 }), { x: 0, y: y0, z: TILE / 2 - 0.5 }));
  g.add(place(group(cylinder(0.25, 0.25, 1.1, mat(PALETTE.red), 10), place(sphere(0.25, mat(PALETTE.red), 10), { y: 1.0 }), place(box(0.3, 0.05, 0.1, black()), { y: 0.85, z: 0.22 })), { x: TILE - 0.6, y: y0, z: TILE / 2 - 0.45 }));
  g.add(place(tree({ kind: 'poplar', h: 4.5, seed: 21 }), { x: -TILE + 0.6, y: y0, z: TILE / 2 - 0.5 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, mansardRoof, box, cylinder, dome, extrude, place, group,
  surface, mat, metal, textured, canvasTexture, signTexture,
  awning, door, windowPanel, car, tree, hedge, bench, streetLamp, 
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// A one-way drive-thru lane wraps the restaurant: in at the front-left, up the west side,
// across the back past the menu board, down the east side to the pickup window, out at the front-right.

const BUN = '#d99a45';
const BUN_DARK = '#b8772e';
const PATTY = '#5a3220';
const CHEESE = '#f2c230';
const LETTUCE = '#5fae3a';
const KETCHUP = '#c8281e';

// Box with 0..1 UVs on every face, so a canvas texture fills a whole face
// (lib box() UVs are in metres, which crops non-repeating sign textures).
function panel(w, h, d, materials) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, materials);
}

function textSign({ text, w, h, bg, fg, depth = 0.1, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round(256 * h / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return panel(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

// burger icon drawn on a canvas, centred at (cx, cy), r = half width
function drawBurger(ctx, cx, cy, r) {
  ctx.fillStyle = BUN;
  ctx.beginPath();
  ctx.ellipse(cx, cy - r * 0.15, r, r * 0.62, 0, Math.PI, 0);
  ctx.fill();
  ctx.fillStyle = '#fff3c4';
  for (const [dx, dy] of [[-0.45, -0.45], [0, -0.6], [0.45, -0.45], [-0.2, -0.32], [0.25, -0.3]]) ctx.fillRect(cx + dx * r - 2, cy + dy * r - 1, 4, 2);
  ctx.fillStyle = LETTUCE;
  ctx.fillRect(cx - r * 1.05, cy - r * 0.15, r * 2.1, r * 0.16);
  ctx.fillStyle = CHEESE;
  ctx.beginPath();
  ctx.moveTo(cx - r, cy);
  ctx.lineTo(cx + r, cy);
  ctx.lineTo(cx + r * 0.6, cy + r * 0.2);
  ctx.lineTo(cx - r * 0.6, cy + r * 0.2);
  ctx.fill();
  ctx.fillStyle = PATTY;
  ctx.fillRect(cx - r * 0.95, cy + r * 0.05, r * 1.9, r * 0.28);
  ctx.fillStyle = BUN;
  ctx.fillRect(cx - r * 0.9, cy + r * 0.33, r * 1.8, r * 0.3);
}

function logoTexture() {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    drawBurger(ctx, 70, 66, 44);
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BURGERS', 310, 68);
  }, { key: 'burger-drive-thru:logo', repeat: false });
}

function poleSignTexture() {
  return canvasTexture(256, 256, (ctx, W, H) => {
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(10, 10, W - 20, H - 20);
    drawBurger(ctx, W / 2, 92, 70);
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = 'bold 54px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('BURGER', W / 2, 168);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('DRIVE-THRU', W / 2, 216);
  }, { key: 'burger-drive-thru:pole', repeat: false });
}

function menuTexture() {
  return canvasTexture(256, 160, (ctx, W, H) => {
    ctx.fillStyle = '#26211d';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.red;
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = PALETTE.yellow;
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('MENU', W / 2, 16);
    const items = [BUN, PALETTE.orange, PALETTE.red, CHEESE, LETTUCE, '#8a5a3c'];
    for (let i = 0; i < 6; i++) {
      const col = i % 3, row = Math.floor(i / 3);
      const x = 12 + col * 82, y = 40 + row * 60;
      ctx.fillStyle = items[i];
      ctx.fillRect(x, y, 34, 30);
      ctx.fillStyle = '#e8e2c8';
      ctx.fillRect(x + 38, y + 6, 28, 5);
      ctx.fillRect(x + 38, y + 18, 20, 5);
      ctx.fillStyle = PALETTE.yellow;
      ctx.fillRect(x, y + 36, 34, 6);
    }
  }, { key: 'burger-drive-thru:menu', repeat: false });
}

// giant 3D burger, base at y = 0
function giantBurger(s) {
  const bun = mat(BUN, { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(cylinder(0.95 * s, 0.85 * s, 0.35 * s, bun, 16));
  g.add(place(cylinder(1.02 * s, 1.0 * s, 0.32 * s, mat(PATTY), 16), { y: 0.35 * s }));
  g.add(place(box(1.75 * s, 0.08 * s, 1.75 * s, mat(CHEESE)), { y: 0.62 * s, ry: 45 }));
  g.add(place(cylinder(1.1 * s, 1.08 * s, 0.1 * s, mat(LETTUCE), 12), { y: 0.68 * s }));
  g.add(place(cylinder(0.5 * s, 0.5 * s, 0.06 * s, mat(KETCHUP), 10), { y: 0.66 * s, x: 0.5 * s }));
  g.add(place(dome({ radius: 1.0 * s, height: 0.75 * s, material: bun, segments: 16 }), { y: 0.78 * s }));
  for (const [x, z] of [[0.3, 0.2], [-0.25, 0.35], [0.05, -0.3], [-0.4, -0.1], [0.45, -0.2]]) {
    g.add(place(box(0.12 * s, 0.05 * s, 0.06 * s, mat('#fff3c4')), { x: x * s, y: 0.78 * s + 0.62 * s, z: z * s, ry: x * 90 }));
  }
  return g;
}

// patio table with a striped umbrella
function patioTable(color) {
  const white = mat(PALETTE.white);
  const g = new THREE.Group();
  g.add(cylinder(0.05, 0.08, 0.75, metal(PALETTE.steelLight), 6));
  g.add(place(cylinder(0.45, 0.45, 0.06, white, 10), { y: 0.72 }));
  g.add(place(cylinder(0.03, 0.03, 2.1, metal(PALETTE.steelLight), 6), { y: 0.75 }));
  const top = new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.45, 8), surface('stripes', color, { color2: PALETTE.white, size: 0.7 }));
  top.position.y = 2.6;
  g.add(top);
  for (const a of [0, 120, 240]) {
    const r = THREE.MathUtils.degToRad(a);
    g.add(place(box(0.32, 0.45, 0.32, mat(color)), { x: Math.cos(r) * 0.75, z: Math.sin(r) * 0.75 }));
  }
  return g;
}

// painted direction arrow on the lane, pointing towards +z
function laneArrow() {
  const pts = [[-0.12, -0.5], [0.12, -0.5], [0.12, 0.05], [0.3, 0.05], [0, 0.5], [-0.3, 0.05], [-0.12, 0.05]];
  return extrude(pts, 0.02, mat(PALETTE.roadLine));
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));
  const y0 = LOT_HEIGHT;
  const H = TILE / 2;

  // ---- ground: asphalt U-lane round a raised kerbed island
  const asphalt = surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 });
  g.add(place(box(TILE - 0.2, 0.05, TILE - 0.2, asphalt), { y: y0 }));
  const ya = y0 + 0.05;
  const islandX0 = -3.0, islandX1 = 3.0, islandZ0 = -3.0, islandZ1 = H - 0.1;
  const iw = islandX1 - islandX0, idp = islandZ1 - islandZ0;
  const ix = (islandX0 + islandX1) / 2, iz = (islandZ0 + islandZ1) / 2;
  g.add(place(box(iw, 0.15, idp, mat(PALETTE.concrete)), { x: ix, y: ya, z: iz }));
  g.add(place(patch(iw - 0.3, idp - 0.3, 'paved'), { x: ix, y: ya + 0.12, z: iz }));
  const yi = ya + 0.17; // island top

  // lane markings: centre-of-lane arrows and a stop line at the window
  const lineM = mat(PALETTE.roadLine);
  g.add(place(laneArrow(), { x: -4.05, y: ya, z: 2.6, ry: 180 }));
  g.add(place(laneArrow(), { x: -4.05, y: ya, z: -1.2, ry: 180 }));
  g.add(place(laneArrow(), { x: 0, y: ya, z: -4.05, ry: 90 }));
  g.add(place(laneArrow(), { x: 4.05, y: ya, z: -0.8 }));
  g.add(place(laneArrow(), { x: 4.05, y: ya, z: 3.4 }));
  g.add(place(box(1.4, 0.02, 0.15, lineM), { x: 4.05, y: ya, z: 1.6 }));

  // ---- restaurant
  const bx = -0.2, bz = -0.8, bw = 5.2, bd = 3.9, bh = 3.2;
  const wall = PALETTE.cream;
  g.add(place(facadeBlock({
    w: bw, d: bd, h: bh, floorHeight: bh, style: 'shop', wall, glass: PALETTE.glassDark, frame: PALETTE.brickDark,
    bay: 1.75, seed: 3, blank: ['back', 'right'], roof: PALETTE.roofGrey,
  }), { x: bx, y: yi, z: bz }));
  // brick plinth
  const brickM = surface('brick', PALETTE.brick, { size: 1.5 });
  g.add(place(box(bw + 0.08, 0.55, bd + 0.08, brickM), { x: bx, y: yi, z: bz }));
  // yellow fascia band + red mansard roof
  const fy = yi + bh;
  g.add(place(box(bw + 0.3, 0.45, bd + 0.3, mat(PALETTE.yellow)), { x: bx, y: fy, z: bz }));
  const roofM = surface('roofTiles', PALETTE.roofRed, { size: 1.5 });
  g.add(place(mansardRoof({ w: bw + 0.3, d: bd + 0.3, h: 1.7, inset: 1.3, overhang: 0.25, material: roofM, topMaterial: PALETTE.roofGrey }), { x: bx, y: fy + 0.45, z: bz }));
  // kitchen extract fan on the flat top of the roof
  g.add(place(box(0.9, 0.5, 0.9, mat(PALETTE.lightGrey)), { x: bx + 1.0, y: fy + 2.15, z: bz - 0.2 }));
  g.add(place(cylinder(0.3, 0.3, 0.15, mat(PALETTE.darkGrey), 10), { x: bx + 1.0, y: fy + 2.65, z: bz - 0.2 }));
  // logo signs on the roof slope (front and west)
  const logo = logoTexture();
  const logoFace = textured(logo, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: logo });
  const red = mat(PALETTE.red);
  const logoSign = () => group(place(panel(3.6, 0.9, 0.12, [red, red, red, red, logoFace, red]), { rx: -20 }));
  g.add(place(logoSign(), { x: bx, y: fy + 0.55, z: bz + bd / 2 + 0.25 }));
  g.add(place(logoSign(), { x: bx - bw / 2 - 0.25, y: fy + 0.55, z: bz, ry: -90 }));

  // entrance: glass doors + red awning on the front
  const fz = bz + bd / 2;
  g.add(place(door({ w: 1.3, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.brickDark }), { x: bx - 1.6, y: yi, z: fz }));
  g.add(place(awning({ w: bw - 0.4, depth: 1.0, drop: 0.35, color: PALETTE.red, color2: PALETTE.yellow }), { x: bx, y: yi + 2.75, z: fz }));

  // pickup window on the east wall with its own little canopy
  const ex = bx + bw / 2;
  g.add(place(windowPanel({ w: 1.4, h: 1.1, frame: PALETTE.brickDark, lit: true }), { x: ex, y: yi + 1.1, z: bz + 0.9, ry: 90 }));
  g.add(place(box(0.35, 0.08, 1.7, metal(PALETTE.steelLight)), { x: ex + 0.18, y: yi + 1.05, z: bz + 0.9 }));
  g.add(place(awning({ w: 2.0, depth: 0.7, drop: 0.25, color: PALETTE.red, color2: PALETTE.yellow }), { x: ex, y: yi + 2.65, z: bz + 0.9, ry: 90 }));
  g.add(place(textSign({ text: 'PICK UP', w: 1.6, h: 0.35, bg: PALETTE.red, fg: PALETTE.yellow, depth: 0.08 }), { x: ex + 0.05, y: yi + 2.75, z: bz + 0.9, ry: 90 }));
  // window on the east wall towards the back + side door
  g.add(place(windowPanel({ w: 1.0, h: 1.0, frame: PALETTE.brickDark }), { x: ex, y: yi + 1.2, z: bz - 1.1, ry: 90 }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.steelDark }), { x: bx + 1.2, y: yi, z: bz - bd / 2, ry: 180 }));
  // back wall: kitchen windows and an extract grille
  for (const x of [bx - 1.9, bx - 0.6]) g.add(place(windowPanel({ w: 0.9, h: 0.8, frame: PALETTE.brickDark, lit: x < bx - 1 }), { x, y: yi + 1.4, z: bz - bd / 2, ry: 180 }));
  g.add(place(box(0.8, 0.6, 0.12, mat(PALETTE.steel)), { x: bx + 0.3, y: yi + 2.2, z: bz - bd / 2 - 0.06 }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.7, 0.04, 0.16, mat(PALETTE.steelDark)), { x: bx + 0.3, y: yi + 2.28 + i * 0.13, z: bz - bd / 2 - 0.06 }));

  // ---- menu board + speaker post beside the east lane (driver on the right)
  const menu = menuTexture();
  const menuFace = textured(menu, { emissive: '#ffffff', emissiveIntensity: 0.3, emissiveMap: menu });
  const dark = mat(PALETTE.darkGrey);
  const menuBoard = group(
    place(box(0.15, 1.2, 0.15, dark), { x: -0.8 }),
    place(box(0.15, 1.2, 0.15, dark), { x: 0.8 }),
    place(panel(2.0, 1.25, 0.15, [dark, dark, dark, dark, menuFace, dark]), { y: 1.1 }),
    place(box(2.2, 0.12, 0.4, red), { y: 2.35, z: 0.08 }),
  );
  g.add(place(menuBoard, { x: islandX1 - 0.25, y: yi, z: -2.7, ry: 90 }));
  const speaker = group(
    box(0.12, 1.0, 0.12, dark),
    place(box(0.35, 0.5, 0.3, mat(PALETTE.red)), { y: 0.9 }),
    place(box(0.25, 0.25, 0.05, mat(PALETTE.black)), { y: 1.05, z: 0.16 }),
  );
  g.add(place(speaker, { x: islandX1 - 0.25, y: yi, z: -1.45, ry: 90 }));

  // ---- clearance bar over the lane entrance
  const hazard = surface('hazard', PALETTE.yellow, { size: 0.8 });
  g.add(place(box(0.16, 2.6, 0.16, red), { x: -4.85, y: ya, z: 3.6 }));
  g.add(place(box(0.16, 2.6, 0.16, red), { x: -3.15, y: ya, z: 3.6 }));
  g.add(place(box(1.9, 0.3, 0.14, hazard), { x: -4.0, y: ya + 2.3, z: 3.6 }));
  g.add(place(textSign({ text: 'DRIVE THRU', w: 1.9, h: 0.45, bg: PALETTE.red, fg: PALETTE.yellow, depth: 0.1, double: true }), { x: -4.0, y: ya + 2.6, z: 3.6 }));

  // ---- pole sign with a giant burger on top (front-right corner of the island)
  const px = 2.35, pz = 4.2;
  const pole = metal(PALETTE.steelLight);
  g.add(place(cylinder(0.45, 0.5, 0.4, mat(PALETTE.concreteDark), 10), { x: px, y: yi }));
  g.add(place(cylinder(0.16, 0.2, 7.6, pole, 8), { x: px, y: yi }));
  const pt = poleSignTexture();
  const ptFace = textured(pt, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: pt });
  const yel = mat(PALETTE.yellow);
  g.add(place(panel(2.4, 2.4, 0.5, [yel, yel, yel, yel, ptFace, ptFace]), { x: px, y: yi + 4.8 }));
  g.add(place(giantBurger(0.75), { x: px, y: yi + 7.6 }));

  // ---- front patio: tables with umbrellas, bench, bins, planters
  g.add(place(patioTable(PALETTE.red), { x: -1.9, y: yi, z: 2.9 }));
  g.add(place(patioTable(PALETTE.yellow), { x: 0.2, y: yi, z: 3.6 }));
  g.add(place(bench({ w: 1.4 }), { x: 0.6, y: yi, z: fz + 1.35, ry: 180 }));
  const bin = group(cylinder(0.25, 0.22, 0.8, mat(PALETTE.red), 8), place(cylinder(0.28, 0.28, 0.08, mat(PALETTE.yellow), 8), { y: 0.8 }));
  g.add(place(bin, { x: -2.6, y: yi, z: fz + 0.5 }));
  g.add(place(bin, { x: 2.6, y: yi, z: 2.0 }));
  g.add(place(hedge({ w: 0.6, h: 0.7, d: 3.4 }), { x: islandX0 + 0.45, y: yi, z: 2.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 4 }), { x: 1.5, y: yi, z: 4.4 }));
  g.add(place(tree({ kind: 'round', h: 3.0, seed: 9 }), { x: -2.35, y: yi, z: 4.1 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: islandX1 - 0.25, y: yi, z: 2.6, ry: 180 }));
  // small planter strip along the back wall
  g.add(place(hedge({ w: 3.0, h: 0.6, d: 0.5 }), { x: bx - 0.9, y: yi, z: islandZ0 + 0.35 }));

  // ---- cars in the drive-thru queue
  const s = 0.6;
  g.add(place(car({ color: PALETTE.blue }), { x: 4.05, y: ya, z: bz + 0.9, ry: -90, s }));
  g.add(place(car({ color: PALETTE.white }), { x: 4.05, y: ya, z: -2.75, ry: -90, s }));
  g.add(place(car({ color: PALETTE.green, kind: 'van' }), { x: 0.6, y: ya, z: -4.05, s }));
  g.add(place(car({ color: PALETTE.orange }), { x: -4.05, y: ya, z: -2.4, ry: 90, s }));
  return g;
}

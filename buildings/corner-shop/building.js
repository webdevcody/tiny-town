import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, extrude, place, group, mat, emissive, surface, textured,
  canvasTexture, signTexture, shade, awning, door, windowPanel, tree, fence, streetLamp, bench, beam, chimney,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Street corner is the south-east (+x, +z): pavements run along
// the front (+z) and the right (+x); the shop door sits in the cut-off corner.

const Y0 = LOT_HEIGHT;
const G = 3.6; // shop storey
const U = 3.0; // flat storey
const X0 = -3.0, X1 = 3.4, Z0 = -2.2, Z1 = 3.4, CH = 1.3; // building outline, chamfer
const OUTLINE = [[X0, Z1], [X1 - CH, Z1], [X1, Z1 - CH], [X1, Z0], [X0, Z0]];

const SHOP = '#2f6b45'; // shopfront paint
const SHOP_LIGHT = shade(SHOP, 0.15);
const GOLD = '#f2cf63';

// Wall faces: centre, outward normal, rotation (deg) that turns local +z into the normal,
// half length. Local +x runs along the face (left to right when looking at it).
const S2 = Math.SQRT1_2;
const FACES = {
  front: { c: [(X0 + X1 - CH) / 2, Z1], n: [0, 1], ry: 0, half: (X1 - CH - X0) / 2 },
  corner: { c: [X1 - CH / 2, Z1 - CH / 2], n: [S2, S2], ry: 45, half: (CH * Math.SQRT2) / 2 },
  right: { c: [X1, (Z1 - CH + Z0) / 2], n: [1, 0], ry: 90, half: (Z1 - CH - Z0) / 2 },
  back: { c: [(X0 + X1) / 2, Z0], n: [0, -1], ry: 180, half: (X1 - X0) / 2 },
  left: { c: [X0, (Z0 + Z1) / 2], n: [-1, 0], ry: -90, half: (Z1 - Z0) / 2 },
};

/** Put obj on a wall face: u = metres along the face from its centre, y = height, out = offset from the wall. */
function onFace(obj, face, u, y, out = 0) {
  const f = FACES[face];
  const a = THREE.MathUtils.degToRad(f.ry);
  const dx = Math.cos(a), dz = -Math.sin(a);
  return place(obj, { x: f.c[0] + dx * u + f.n[0] * out, y, z: f.c[1] + dz * u + f.n[1] * out, ry: f.ry });
}

/** Box running along a segment [x,z] -> [x,z] (parapets, kerbs, cornices). */
function edgeBox(p1, p2, h, t, material, y = 0, extend = 0) {
  const len = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) + extend * 2;
  const b = box(len, h, t, material);
  b.position.set((p1[0] + p2[0]) / 2, y, (p1[1] + p2[1]) / 2);
  b.rotation.y = -Math.atan2(p2[1] - p1[1], p2[0] - p1[0]);
  return b;
}

/** Outline grown outwards by m (only valid for this convex outline). */
function grow(m) {
  const k = m * (Math.SQRT2 - 1); // keeps the chamfer parallel
  return [[X0 - m, Z1 + m], [X1 - CH + k, Z1 + m], [X1 + m, Z1 - CH + k], [X1 + m, Z0 - m], [X0 - m, Z0 - m]];
}

function ring(points, h, t, material, y) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    g.add(edgeBox(a, b, h, t, material, y, t / 2));
  }
  return g;
}

/**
 * Box whose front (+z) face shows a whole texture. Lib boxes have UVs in metres, which clamps
 * non-repeating textures to their first square metre, so the front face is reset to 0..1.
 */
function panel(w, h, d, faceMat, sideMat = faceMat) {
  const m = box(w, h, d, [sideMat, sideMat, sideMat, sideMat, faceMat, sideMat]);
  const uv = m.geometry.attributes.uv;
  for (let i = 16; i < 20; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / h);
  return m;
}

/** Sign board like the lib's sign(), but showing the full text on faces of any size. */
function sign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, border = null }) {
  const tw = 512;
  const tex = signTexture(text, { bg, fg, width: tw, height: Math.max(32, Math.round(tw / (w / h))), border });
  return panel(w, h, depth, textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }), mat(bg));
}

// Shop window glass: warm lit interior with shelves of goods.
function shopWindowMat() {
  const tex = canvasTexture(256, 160, (ctx, W, H) => {
    ctx.fillStyle = '#f6e3a8';
    ctx.fillRect(0, 0, W, H);
    const goods = [PALETTE.red, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.yellow, PALETTE.purple, '#ffffff', '#d94f7a'];
    let k = 0;
    for (const sy of [44, 92, 140]) {
      ctx.fillStyle = '#8a6a44';
      ctx.fillRect(0, sy, W, 6);
      for (let x = 4; x < W - 10; x += 13) {
        const h = 14 + ((k * 7) % 16);
        ctx.fillStyle = goods[k++ % goods.length];
        ctx.fillRect(x, sy - h, 10, h);
      }
    }
    // window sticker band
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(0, 0, W, 16);
  }, { key: 'corner-shop:window', repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.35, emissiveMap: tex, roughness: 0.3 });
}

// Painted advert on the blank side wall.
function ghostSignMat() {
  const tex = canvasTexture(256, 128, (ctx, W, H) => {
    ctx.fillStyle = '#e8dcb8';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = SHOP;
    ctx.lineWidth = 8;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.fillStyle = SHOP;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('GROCER', W / 2, H * 0.4);
    ctx.fillStyle = PALETTE.red;
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('NEWS · SWEETS · TEA', W / 2, H * 0.74);
  }, { key: 'corner-shop:ghost', repeat: false });
  return textured(tex, { roughness: 0.9 });
}

function shopWindow(w, h) {
  const frameM = mat(SHOP_LIGHT);
  const g = group(
    place(box(w + 0.2, h + 0.2, 0.08, frameM), { y: -0.1, z: 0.04 }),
    place(panel(w, h, 0.1, shopWindowMat()), { z: 0.06 })
  );
  for (const t of [-1 / 3, 1 / 3]) g.add(place(box(0.08, h, 0.14, frameM), { x: t * w, z: 0.06 }));
  g.add(place(box(w, 0.06, 0.14, frameM), { y: h * 0.78, z: 0.06 }));
  return g;
}

function windowBox(w, seed) {
  const g = group(
    box(w, 0.32, 0.36, surface('planks', PALETTE.terracotta, { size: 1 })),
    place(box(w - 0.08, 0.1, 0.3, mat(PALETTE.foliageDark)), { y: 0.32 })
  );
  const colors = [PALETTE.red, '#e85d9a', PALETTE.yellow, '#ffffff', PALETTE.purple];
  const n = Math.max(3, Math.round(w / 0.22));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.12 + ((w - 0.24) * i) / (n - 1);
    g.add(place(sphere(0.13, mat(PALETTE.foliage), 5), { x, y: 0.3, z: ((i % 2) - 0.5) * 0.1 }));
    g.add(place(sphere(0.08, mat(colors[(i + seed) % colors.length]), 5), { x, y: 0.47, z: ((i % 2) - 0.5) * 0.12 }));
  }
  return g;
}

// Upper-floor sash window with stone lintel, sill and an optional flower box.
function flatWindow(face, u, w, h, { flowers = true, seed = 0, lit = false } = {}) {
  const y = Y0 + G + 0.75;
  const stone = mat(PALETTE.offWhite);
  const g = new THREE.Group();
  g.add(onFace(windowPanel({ w, h, frame: PALETTE.white, lit }), face, u, y));
  g.add(onFace(box(w + 0.4, 0.18, 0.16, stone), face, u, y + h + 0.15, 0));
  g.add(onFace(box(w + 0.35, 0.1, 0.2, stone), face, u, y - 0.1, 0));
  if (flowers) g.add(onFace(windowBox(w + 0.2, seed), face, u, y - 0.45, 0.2));
  return g;
}

function crate(color) {
  const g = group(box(0.55, 0.28, 0.4, surface('planks', PALETTE.woodLight, { size: 0.6 })));
  for (let i = 0; i < 6; i++) g.add(place(sphere(0.09, mat(color), 5), { x: -0.18 + (i % 3) * 0.18, y: 0.22, z: i < 3 ? -0.08 : 0.08 }));
  return g;
}

// Fruit & veg stall: sloped trestle with crates.
function produceStall() {
  const wood = mat(PALETTE.wood);
  const g = new THREE.Group();
  for (const x of [-0.85, 0.85]) for (const z of [-0.3, 0.3]) g.add(place(box(0.08, z < 0 ? 0.85 : 0.6, 0.08, wood), { x, z }));
  const top = group();
  top.add(box(1.9, 0.06, 0.8, wood));
  const colors = [PALETTE.orange, PALETTE.red, PALETTE.foliageLight, PALETTE.yellow, '#7b3fa0', PALETTE.green];
  for (let i = 0; i < 6; i++) top.add(place(crate(colors[i]), { x: -0.6 + (i % 3) * 0.6, y: 0.06, z: i < 3 ? -0.2 : 0.2 }));
  g.add(place(top, { y: 0.72, rx: 17 }));
  return g;
}

function sandwichBoard() {
  const m = mat('#2a2a2a');
  return group(
    place(box(0.6, 0.85, 0.05, m), { z: 0.15, rx: -12 }),
    place(box(0.6, 0.85, 0.05, m), { z: -0.15, rx: 12 }),
    place(box(0.46, 0.06, 0.02, mat(PALETTE.yellow)), { y: 0.6, z: 0.19, rx: -12 }),
    place(box(0.4, 0.06, 0.02, mat('#ffffff')), { y: 0.45, z: 0.17, rx: -12 }),
    place(box(0.44, 0.06, 0.02, mat('#ff8fb0')), { y: 0.3, z: 0.15, rx: -12 })
  );
}

function pillarBox() {
  const red = mat('#c8241c');
  return group(
    cylinder(0.27, 0.27, 1.2, red, 12),
    place(cylinder(0.31, 0.31, 0.1, red, 12), { y: 1.2 }),
    place(sphere(0.27, red, 10), { y: 1.1, s: [1, 0.55, 1] }),
    place(box(0.3, 0.05, 0.05, mat(PALETTE.black)), { y: 0.95, z: 0.26 }),
    place(cylinder(0.3, 0.3, 0.08, mat(PALETTE.black), 12))
  );
}

function iceCreamFreezer() {
  const g = group(
    box(1.3, 0.8, 0.7, mat(PALETTE.white)),
    place(box(1.2, 0.06, 0.6, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 })), { y: 0.8 }),
    place(box(1.0, 0.3, 0.02, mat('#2e7fd1')), { y: 0.35, z: 0.36 })
  );
  g.add(place(box(0.5, 0.2, 0.03, mat(PALETTE.yellow)), { y: 0.38, z: 0.37 }));
  return g;
}

function newsRack() {
  const steel = mat(PALETTE.steelDark);
  const g = group(
    place(box(0.06, 1.2, 0.06, steel), { x: -0.35 }),
    place(box(0.06, 1.2, 0.06, steel), { x: 0.35 })
  );
  const papers = ['#f4f1e6', '#f6c9c4', '#f4f1e6', '#cfe0f2'];
  for (let i = 0; i < 3; i++) g.add(place(box(0.7, 0.04, 0.45, mat(papers[i])), { y: 0.35 + i * 0.32, z: 0.05, rx: 25 }));
  g.add(place(sign({ text: 'NEWS', w: 0.7, h: 0.25, bg: PALETTE.red, fg: '#ffffff', depth: 0.04 }), { y: 1.2, z: 0.03 }));
  return g;
}

function wheelieBin(color) {
  const m = mat(color);
  return group(box(0.6, 1.0, 0.7, m), place(box(0.66, 0.06, 0.76, mat(shade(color, -0.2))), { y: 1.0 }));
}

function bicycle(color) {
  const m = mat(color);
  const tyre = mat(PALETTE.black);
  const wheel = () => {
    const geo = new THREE.TorusGeometry(0.32, 0.04, 4, 12);
    return new THREE.Mesh(geo, tyre);
  };
  return group(
    place(wheel(), { x: -0.5, y: 0.34 }),
    place(wheel(), { x: 0.5, y: 0.34 }),
    beam([-0.5, 0.34, 0], [0, 0.75, 0], 0.05, m),
    beam([0.5, 0.34, 0], [0.05, 0.75, 0], 0.05, m),
    beam([-0.5, 0.34, 0], [0.05, 0.34, 0], 0.05, m),
    beam([0.05, 0.34, 0], [0, 0.75, 0], 0.05, m),
    place(box(0.25, 0.05, 0.12, mat(PALETTE.black)), { x: -0.05, y: 0.82 }),
    place(box(0.06, 0.06, 0.5, m), { x: 0.45, y: 0.9 })
  );
}

function washingLine(len) {
  const post = mat(PALETTE.woodDark);
  const g = group(place(box(0.08, 1.9, 0.08, post), { x: -len / 2 }), place(box(0.08, 1.9, 0.08, post), { x: len / 2 }));
  g.add(place(box(len, 0.015, 0.015, mat(PALETTE.white)), { y: 1.8 }));
  const clothes = [PALETTE.white, '#7fb2e5', PALETTE.red, PALETTE.yellow, '#ffffff', '#e889b4'];
  for (let i = 0; i < 5; i++) {
    const w = 0.35 + (i % 2) * 0.15;
    g.add(place(box(w, 0.45 + (i % 3) * 0.1, 0.02, mat(clothes[i])), { x: -len / 2 + 0.45 + i * ((len - 0.9) / 4), y: 1.8 - 0.5 - (i % 3) * 0.1 }));
  }
  return g;
}

function tvAerial() {
  const m = mat(PALETTE.steelDark);
  const g = group(cylinder(0.03, 0.03, 1.8, m, 5));
  g.add(place(box(1.1, 0.03, 0.03, m), { y: 1.7 }));
  for (let i = 0; i < 5; i++) g.add(place(box(0.03, 0.03, 0.4 - i * 0.05, m), { x: -0.45 + i * 0.22, y: 1.7 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // --- ground: pavements on the two street sides, paved back yard ---------------------------
  const paveM = surface('paving', PALETTE.concrete, { size: 1.5 });
  const kerbM = mat(PALETTE.lightGrey);
  g.add(place(box(10, 0.12, 1.6, paveM), { y: Y0, z: 4.2 }));
  g.add(place(box(1.6, 0.12, 8.4, paveM), { x: 4.2, y: Y0, z: -0.8 }));
  g.add(place(box(10, 0.14, 0.2, kerbM), { y: Y0, z: 4.9 }));
  g.add(place(box(0.2, 0.14, 9.8, kerbM), { x: 4.9, y: Y0, z: -0.1 }));
  g.add(place(patch(7.9, 2.8, 'cobbles'), { x: -1.05, y: Y0, z: -3.6 }));
  g.add(place(patch(2.0, 5.6, 'cobbles'), { x: -4.0, y: Y0, z: 0.6 }));
  const yP = Y0 + 0.12; // pavement top

  // --- shop storey -----------------------------------------------------------------------
  g.add(place(extrude(grow(0.06), 0.35, mat(PALETTE.stoneDark)), { y: Y0 }));
  g.add(place(extrude(OUTLINE, G, mat(SHOP)), { y: Y0 }));
  // side and back of the shop are rendered in cream, only the street faces are painted green
  g.add(place(box(X1 - X0 - 0.01, G - 0.35, 0.02, mat(PALETTE.cream)), { x: (X0 + X1) / 2, y: Y0 + 0.35, z: Z0 - 0.01 }));
  g.add(place(box(0.02, G - 0.35, Z1 - Z0 - 0.01, mat(PALETTE.cream)), { x: X0 - 0.01, y: Y0 + 0.35, z: (Z0 + Z1) / 2 }));

  // fascia band, frieze and cornice over the shopfront
  const fasciaY = Y0 + 2.85;
  for (const f of ['front', 'corner', 'right']) {
    const F = FACES[f];
    g.add(onFace(box(F.half * 2 + 0.05, 0.12, 0.35, mat(SHOP_LIGHT)), f, 0, Y0 + G - 0.12, 0.1));
  }
  g.add(onFace(sign({ text: 'CORNER SHOP', w: 4.6, h: 0.6, bg: SHOP, fg: GOLD, border: GOLD, depth: 0.12 }), 'front', 0, fasciaY));
  g.add(onFace(sign({ text: 'GROCERIES', w: 3.8, h: 0.6, bg: SHOP, fg: GOLD, border: GOLD, depth: 0.12 }), 'right', -0.15, fasciaY));
  g.add(onFace(sign({ text: 'OPEN', w: 1.3, h: 0.6, bg: PALETTE.red, fg: '#ffffff', border: GOLD, depth: 0.12 }), 'corner', 0, fasciaY));

  // pilasters on the street faces
  const pilM = mat(SHOP_LIGHT);
  for (const [f, us] of [['front', [-2.55, -1.45, 2.55]], ['right', [-2.15, 1.25, 2.15]], ['corner', [-0.92, 0.92]]]) {
    for (const u of us) g.add(onFace(box(0.22, G - 0.4, 0.14, pilM), f, u, Y0 + 0.3, 0.04));
  }

  // front: door up to the flat + big shop window
  g.add(onFace(door({ w: 0.85, h: 2.3, color: PALETTE.navy, frame: SHOP_LIGHT }), 'front', -2.0, yP));
  g.add(onFace(box(0.85, 0.35, 0.08, mat(PALETTE.windowLit)), 'front', -2.0, yP + 2.42, 0.03));
  g.add(onFace(shopWindow(3.6, 2.0), 'front', 0.55, Y0 + 0.65, 0.02));
  // corner: glazed shop door + step
  g.add(onFace(box(1.5, 0.12, 0.5, mat(PALETTE.stone)), 'corner', 0, yP, 0.25));
  g.add(onFace(door({ w: 1.1, h: 2.4, color: SHOP_LIGHT, frame: SHOP_LIGHT }), 'corner', 0, yP + 0.1));
  g.add(onFace(panel(0.8, 1.5, 0.08, shopWindowMat()), 'corner', 0, yP + 0.8, 0.1));
  // right: shop window + stock-room door
  g.add(onFace(shopWindow(3.0, 2.0), 'right', -0.4, Y0 + 0.65, 0.02));
  g.add(onFace(door({ w: 0.8, h: 2.2, color: PALETTE.woodDark, frame: SHOP_LIGHT }), 'right', 1.7, yP));

  // striped awnings
  const awnY = Y0 + 2.75;
  g.add(onFace(awning({ w: 3.9, depth: 1.25, drop: 0.55, color: PALETTE.red, color2: PALETTE.white }), 'front', 0.55, awnY, 0.12));
  g.add(onFace(awning({ w: 3.3, depth: 1.25, drop: 0.55, color: PALETTE.red, color2: PALETTE.white }), 'right', -0.4, awnY, 0.12));
  g.add(onFace(awning({ w: 1.6, depth: 0.9, drop: 0.4, color: PALETTE.red, color2: PALETTE.white }), 'corner', 0, awnY, 0.12));

  // back and side of the shop: back door, small windows
  g.add(onFace(door({ w: 0.9, h: 2.2, color: PALETTE.woodDark }), 'back', -1.6, Y0));
  g.add(onFace(windowPanel({ w: 1.2, h: 1.0, frame: PALETTE.white }), 'back', 1.4, Y0 + 1.4));
  g.add(onFace(windowPanel({ w: 1.0, h: 1.0, frame: PALETTE.white, lit: true }), 'left', 1.2, Y0 + 1.4));

  // --- the flat above ----------------------------------------------------------------------
  const yU = Y0 + G;
  g.add(place(extrude(grow(0.1), 0.22, mat(PALETTE.offWhite)), { y: yU - 0.02 }));
  g.add(place(extrude(OUTLINE, U, surface('brick', PALETTE.brick, { size: 1.2 }), mat(PALETTE.roofGrey)), { y: yU }));
  flatWindows(g);
  // painted advert on the side wall
  g.add(onFace(panel(2.4, 1.2, 0.03, ghostSignMat()), 'left', -1.2, yU + 1.0, 0.01));

  // cornice, parapet and coping
  const yR = yU + U;
  g.add(place(extrude(grow(0.15), 0.25, mat(PALETTE.offWhite)), { y: yR - 0.25 }));
  g.add(ring(OUTLINE, 0.6, 0.25, surface('brick', PALETTE.brick, { size: 1.2 }), yR));
  g.add(ring(grow(0.03), 0.1, 0.36, mat(PALETTE.offWhite), yR + 0.6));
  // corner pediment with the year
  g.add(onFace(sign({ text: '1912', w: 1.3, h: 0.45, bg: PALETTE.offWhite, fg: PALETTE.brickDark, depth: 0.1 }), 'corner', 0, yR + 0.15, 0.12));
  g.add(onFace(box(1.5, 0.3, 0.3, mat(PALETTE.offWhite)), 'corner', 0, yR + 0.6, 0));

  // roof: felt, chimney stack, aerial, hatch
  g.add(place(box(X1 - X0 - 0.5, 0.04, Z1 - Z0 - 0.5, mat(PALETTE.roofSlate)), { x: (X0 + X1) / 2 - 0.2, y: yR, z: (Z0 + Z1) / 2 - 0.2 }));
  const stack = group(chimney({ w: 1.6, d: 0.7, h: 1.4 }));
  for (const x of [-0.4, 0.4]) stack.add(place(cylinder(0.13, 0.16, 0.45, mat(PALETTE.terracotta), 8), { x, y: 1.6 }));
  g.add(place(stack, { x: -1.6, y: yR, z: Z0 + 0.5 }));
  g.add(place(tvAerial(), { x: -1.6, y: yR + 1.6, z: Z0 + 0.5, ry: 30 }));
  g.add(place(box(1.0, 0.45, 1.0, mat(PALETTE.lightGrey)), { x: 1.4, y: yR, z: -0.6 }));
  g.add(place(box(1.1, 0.08, 1.1, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 })), { x: 1.4, y: yR + 0.45, z: -0.6 }));

  // --- street props --------------------------------------------------------------------------
  g.add(place(produceStall(), { x: 0.6, y: yP, z: 4.15 }));
  g.add(place(sandwichBoard(), { x: 2.95, y: yP, z: 4.35, ry: 45 }));
  g.add(place(newsRack(), { x: -1.0, y: yP, z: 3.65 }));
  g.add(place(pillarBox(), { x: 4.35, y: yP, z: 4.35 }));
  g.add(place(streetLamp({ h: 4.6 }), { x: -4.3, y: yP, z: 4.5 }));
  g.add(place(iceCreamFreezer(), { x: 3.85, y: yP, z: -0.6, ry: 90 }));
  g.add(place(bench({ w: 1.5 }), { x: 4.4, y: yP, z: 0.9, ry: -90 }));
  g.add(place(bicycle(PALETTE.blue), { x: 4.25, y: yP, z: -2.2, ry: 90 }));
  g.add(place(tree({ kind: 'round', h: 3.4, seed: 13 }), { x: 4.0, y: yP, z: -4.0 }));

  // --- back yard -------------------------------------------------------------------------
  const yardWall = surface('brick', PALETTE.brickBrown, { size: 1 });
  g.add(place(box(8.2, 1.1, 0.25, yardWall), { x: -0.9, y: Y0, z: -4.85 }));
  g.add(place(box(0.25, 1.1, 7.2, yardWall), { x: -4.85, y: Y0, z: -1.35 }));
  g.add(place(box(0.25, 1.1, 2.4, yardWall), { x: 3.25, y: Y0, z: -3.6 }));
  g.add(place(fence({ w: 1.6, d: 0.1, h: 1.1, style: 'picket', sides: ['front'], color: PALETTE.white }), { x: -4.0, y: Y0, z: 3.35 }));
  g.add(place(wheelieBin(PALETTE.foliageDark), { x: 2.6, y: Y0, z: -4.25 }));
  g.add(place(wheelieBin('#3a5fa8'), { x: 1.85, y: Y0, z: -4.25 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.6, 0.35, 0.45, surface('planks', PALETTE.woodLight, { size: 0.6 })), { x: 0.6, y: Y0 + i * 0.35, z: -4.3, ry: i * 12 }));
  g.add(place(box(1.2, 0.14, 1.0, mat(PALETTE.woodLight)), { x: -0.7, y: Y0, z: -4.2 }));
  g.add(place(washingLine(3.0), { x: -2.0, y: Y0, z: -3.5 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 21 }), { x: -3.9, y: Y0, z: -1.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 5 }), { x: -4.2, y: Y0, z: 2.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 8 }), { x: -4.25, y: Y0, z: 0.6 }));
  return g;
}

function flatWindows(g) {
  g.add(flatWindow('front', -1.7, 0.95, 1.45, { seed: 0 }));
  g.add(flatWindow('front', 0, 0.95, 1.45, { seed: 1, lit: true }));
  g.add(flatWindow('front', 1.7, 0.95, 1.45, { seed: 2 }));
  g.add(flatWindow('corner', 0, 0.8, 1.45, { seed: 3 }));
  g.add(flatWindow('right', -1.0, 0.95, 1.45, { seed: 4 }));
  g.add(flatWindow('right', 1.1, 0.95, 1.45, { seed: 1, lit: true }));
  g.add(flatWindow('back', -1.4, 0.95, 1.45, { flowers: false, lit: true }));
  g.add(flatWindow('back', 1.4, 0.8, 1.2, { flowers: false }));
  g.add(flatWindow('left', 1.6, 0.9, 1.45, { seed: 2 }));
}

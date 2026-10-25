import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, place, group, pipe, mat, metal, glass, emissive,
  hedge, tree, canvasTexture, textured, shade, rng,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (field gate) faces +z.
// A wheat field mid-harvest: standing wheat at the back, the combine cutting the
// last strip (driving towards -x) and unloading into a tractor trailer beside it,
// stubble with straw windrows and round bales at the front, hedge all around.

const HALF = TILE; // half of the 20 m lot
const WHEAT_H = 1.15;
const GOLD = '#ebbd3c';
const GREEN = '#3f9a3a';
const DEERE_YELLOW = '#f2c81e';

// ---------------------------------------------------------------------------
// textures (sizes in metres per repeat; box/cylinder UVs are in metres)

function tiledMat(key, size, draw, px = 128) {
  const base = canvasTexture(px, px, draw, { key: 'wheat-field:' + key });
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / size);
  t.needsUpdate = true;
  return textured(t, { roughness: 0.95 });
}

function speckle(ctx, W, H, r, colors, n, s) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = r.pick(colors);
    ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), s, s);
  }
}

// top of the standing wheat: golden rows of ears
const wheatTop = () => tiledMat('wheatTop', 4, (ctx, W, H) => {
  const r = rng(91);
  ctx.fillStyle = GOLD;
  ctx.fillRect(0, 0, W, H);
  const rows = 10;
  for (let i = 0; i < rows; i++) {
    ctx.fillStyle = shade(GOLD, -0.18);
    ctx.fillRect(0, Math.floor((i * H) / rows), W, 3);
  }
  speckle(ctx, W, H, r, ['#f6d468', '#f2cc55', '#c99a2c', '#d8a838'], 900, 2);
});

// side of the standing wheat: stalks with a band of ears on top
const wheatSide = () => {
  const m = tiledMat('wheatSide', 2, (ctx, W, H) => {
    const r = rng(92);
    ctx.fillStyle = '#d9a632';
    ctx.fillRect(0, 0, W, H);
    for (let x = 0; x < W; x += 3) {
      ctx.fillStyle = shade('#b98a28', (r() - 0.5) * 0.3);
      ctx.fillRect(x, 0, 1, H);
    }
    speckle(ctx, W, H, r, ['#f0c850', '#a87c22'], 400, 2);
  });
  return m;
};

// harvested stubble: pale straw with tractor/cut stripes
const stubble = () => tiledMat('stubble', 4.4, (ctx, W, H) => {
  const r = rng(93);
  ctx.fillStyle = '#d6c896';
  ctx.fillRect(0, 0, W, H);
  // alternating cut passes (stripes along X)
  ctx.fillStyle = '#c9b985';
  ctx.fillRect(0, 0, W, H / 2);
  for (let y = 0; y < H; y += 4) {
    ctx.fillStyle = shade('#a89566', (r() - 0.5) * 0.2);
    ctx.fillRect(0, y, W, 1);
  }
  speckle(ctx, W, H, r, ['#e8dcae', '#9c8456', '#8a6a44', '#efe6c2'], 900, 2);
});

// ---------------------------------------------------------------------------
// props

function wheel(r, w, color = PALETTE.black, hub = DEERE_YELLOW) {
  const disc = (rad, width, m, seg) => {
    const geo = new THREE.CylinderGeometry(rad, rad, width, seg);
    geo.rotateX(Math.PI / 2);
    return new THREE.Mesh(geo, m);
  };
  const g = group(disc(r, w, mat(color), 14), disc(r * 0.55, w + 0.04, mat(hub), 10));
  g.userData.r = r;
  return g;
}

const onAxle = (w, opts) => place(w, { ...opts, y: w.userData.r });

/** Combine harvester, forward = +x, origin at ground centre of the body. */
function combine({ headerW = 4.6 } = {}) {
  const g = new THREE.Group();
  const body = mat(GREEN, { roughness: 0.5 });
  const bodyDark = mat(shade(GREEN, -0.25), { roughness: 0.6 });
  const yellow = mat(DEERE_YELLOW, { roughness: 0.5 });
  const steel = metal(PALETTE.steelDark);
  const glassM = glass(PALETTE.glassSky, { opacity: 0.75 });

  // wheels: big drive wheels at the front, small steering wheels at the back
  for (const s of [-1, 1]) {
    g.add(onAxle(wheel(0.85, 0.55), { x: 1.0, z: s * 1.38 }));
    g.add(onAxle(wheel(0.5, 0.35), { x: -2.3, z: s * 1.15 }));
  }
  // chassis + main body
  g.add(place(box(4.6, 0.5, 2.0, bodyDark), { x: -0.5, y: 0.55 }));
  g.add(place(box(4.4, 1.7, 2.3, body), { x: -0.6, y: 1.0 }));
  // yellow pinstripe + side panels
  for (const s of [-1, 1]) {
    g.add(place(box(4.0, 0.12, 0.04, yellow), { x: -0.6, y: 2.3, z: s * 1.17 }));
    g.add(place(box(1.4, 0.9, 0.04, bodyDark), { x: -1.6, y: 1.25, z: s * 1.17 }));
  }
  // engine deck at the back, exhaust, rear straw spreader
  g.add(place(box(1.5, 0.6, 2.1, body), { x: -2.1, y: 2.7 }));
  g.add(place(cylinder(0.08, 0.08, 1.2, steel, 6), { x: -1.7, y: 3.2, z: 0.7 }));
  g.add(place(box(0.5, 0.8, 1.9, bodyDark), { x: -3.0, y: 0.9 }));
  g.add(place(box(0.15, 0.25, 1.6, mat(PALETTE.black)), { x: -3.28, y: 1.3 }));
  // grain tank (open hopper, full of grain) with extensions
  g.add(place(box(2.0, 0.9, 2.3, body), { x: -0.4, y: 2.7 }));
  g.add(place(box(2.2, 0.25, 2.5, yellow), { x: -0.4, y: 3.6 }));
  g.add(place(box(1.9, 0.05, 2.2, mat(PALETTE.wheat)), { x: -0.4, y: 3.8 }));
  g.add(place(cone(0.75, 0.35, mat('#d8b64e'), 8), { x: -0.4, y: 3.82, s: 1 }));

  // cab: glass box on the front with white roof + beacon
  g.add(place(box(1.4, 0.35, 1.7, body), { x: 1.35, y: 2.7 }));
  g.add(place(box(1.3, 1.3, 1.6, glassM), { x: 1.4, y: 3.05 }));
  for (const [cx, cz] of [[0.75, -0.8], [0.75, 0.8], [2.05, -0.8], [2.05, 0.8]]) {
    g.add(place(box(0.08, 1.3, 0.08, bodyDark), { x: cx, y: 3.05, z: cz }));
  }
  g.add(place(box(1.6, 0.15, 1.85, mat(PALETTE.white)), { x: 1.4, y: 4.35 }));
  g.add(place(box(0.2, 0.18, 0.2, emissive(PALETTE.orange, 0.9)), { x: 1.0, y: 4.5, z: 0.6 }));
  for (const s of [-1, 1]) {
    g.add(place(box(0.08, 0.15, 0.3, emissive('#fff6c8', 0.6)), { x: 2.2, y: 4.3, z: s * 0.6 }));
  }
  // ladder up to the cab
  g.add(place(box(0.5, 2.2, 0.05, mat(PALETTE.darkGrey)), { x: 1.0, y: 0.6, z: 1.2 }));

  // feeder house (slopes down to the header)
  const feeder = place(box(1.9, 0.7, 1.3, body), { x: 2.6, y: 0.95, rz: -18 });
  g.add(feeder);

  // header: platform, back wall, side dividers, cutter bar
  const hx = 3.65;
  g.add(place(box(1.3, 0.15, headerW, yellow), { x: hx, y: 0.25 }));
  g.add(place(box(0.25, 1.1, headerW, yellow), { x: hx - 0.6, y: 0.25 }));
  g.add(place(box(0.08, 0.06, headerW, steel), { x: hx + 0.66, y: 0.28 }));
  for (const s of [-1, 1]) {
    g.add(place(box(1.4, 0.75, 0.08, yellow), { x: hx, y: 0.25, z: s * (headerW / 2 - 0.04) }));
    g.add(place(cone(0.12, 0.5, yellow, 4), { x: hx + 0.85, y: 0.3, z: s * (headerW / 2 - 0.05), rz: -90 }));
  }
  // auger along the header
  g.add(place(cylinder(0.22, 0.22, headerW - 0.2, mat(PALETTE.steelLight), 8), { x: hx - 0.25, y: 0.62, z: (headerW - 0.2) / 2, rx: -90 }));
  // reel: red bats on spokes + support arms
  const reelX = hx + 0.25, reelY = 1.45;
  const reelM = mat(PALETTE.red, { roughness: 0.5 });
  g.add(place(cylinder(0.08, 0.08, headerW - 0.3, steel, 6), { x: reelX, y: reelY, z: (headerW - 0.3) / 2, rx: -90 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(place(box(0.08, 0.08, headerW - 0.4, reelM), { x: reelX + Math.cos(a) * 0.55, y: reelY - 0.04 + Math.sin(a) * 0.55 }));
  }
  for (const zz of [-1, 0, 1]) {
    const z = zz * (headerW / 2 - 0.3);
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI;
      g.add(place(box(1.15, 0.05, 0.05, steel), { x: reelX, y: reelY - 0.025, z, rz: (a * 180) / Math.PI }));
    }
  }
  for (const s of [-1, 1]) {
    g.add(pipe([hx - 0.75, 1.3, s * (headerW / 2 - 0.15)], [reelX, reelY, s * (headerW / 2 - 0.15)], 0.06, yellow));
  }

  // unloading auger swung out to the right side (-z), spout over the trailer
  const ax = -0.9;
  g.add(place(cylinder(0.2, 0.2, 1.0, body, 8), { x: ax, y: 3.0, z: -1.2 }));
  g.add(pipe([ax, 3.8, -1.25], [ax + 0.3, 4.3, -5.2], 0.2, body));
  g.add(place(box(0.4, 0.55, 0.4, bodyDark), { x: ax + 0.3, y: 3.8, z: -5.25 }));
  // falling grain
  g.add(place(cylinder(0.12, 0.2, 1.1, mat('#e8cb62'), 6), { x: ax + 0.3, y: 2.7, z: -5.25 }));
  return g;
}

/** Red farm tractor, forward = +x. */
function tractor() {
  const g = new THREE.Group();
  const red = mat(PALETTE.red, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  for (const s of [-1, 1]) {
    g.add(onAxle(wheel(0.75, 0.45, PALETTE.black, PALETTE.white), { x: -0.7, z: s * 0.95 }));
    g.add(onAxle(wheel(0.45, 0.3, PALETTE.black, PALETTE.white), { x: 1.4, z: s * 0.8 }));
  }
  g.add(place(box(3.0, 0.4, 1.0, dark), { x: 0.3, y: 0.45 }));
  g.add(place(box(1.8, 0.85, 1.05, red), { x: 1.0, y: 0.8 }));
  g.add(place(box(0.1, 0.5, 0.8, mat(PALETTE.lightGrey)), { x: 1.92, y: 0.9 }));
  g.add(place(cylinder(0.06, 0.06, 0.9, metal(PALETTE.steelDark), 6), { x: 1.3, y: 1.6, z: 0.3 }));
  // mudguards + cab
  for (const s of [-1, 1]) g.add(place(box(1.3, 0.1, 0.5, red), { x: -0.7, y: 1.55, z: s * 0.9 }));
  g.add(place(box(1.3, 0.5, 1.4, red), { x: -0.6, y: 1.0 }));
  g.add(place(box(1.2, 1.2, 1.3, glass(PALETTE.glassSky, { opacity: 0.75 })), { x: -0.6, y: 1.5 }));
  g.add(place(box(1.4, 0.12, 1.5, red), { x: -0.6, y: 2.7 }));
  g.add(place(box(0.18, 0.15, 0.18, emissive(PALETTE.orange, 0.9)), { x: -0.9, y: 2.82, z: 0.4 }));
  return g;
}

/** Tipping grain trailer, hitch at +x. Partly filled with grain. */
function grainTrailer(len = 4.6) {
  const g = new THREE.Group();
  const red = mat(PALETTE.red, { roughness: 0.55 });
  for (const s of [-1, 1]) for (const x of [-0.45, 0.45]) {
    g.add(onAxle(wheel(0.5, 0.35, PALETTE.black, PALETTE.lightGrey), { x, z: s * 1.0 }));
  }
  g.add(place(box(len, 0.3, 1.4, mat(PALETTE.darkGrey)), { y: 0.55 }));
  g.add(place(box(len, 0.15, 2.2, red), { y: 0.85 }));
  for (const s of [-1, 1]) {
    g.add(place(box(len, 1.1, 0.1, red), { y: 1.0, z: s * 1.05 }));
    g.add(place(box(0.1, 1.1, 2.2, red), { x: s * (len / 2 - 0.05), y: 1.0 }));
    g.add(place(box(len, 0.06, 0.12, mat(shade(PALETTE.red, -0.3))), { y: 1.55, z: s * 1.06 }));
  }
  g.add(place(box(len - 0.2, 0.05, 2.0, mat(PALETTE.wheat)), { y: 1.75 }));
  g.add(place(cone(0.9, 0.35, mat('#d8b64e'), 8), { x: 0.3, y: 1.78, s: 1 }));
  g.add(place(box(1.2, 0.12, 0.12, mat(PALETTE.darkGrey)), { x: len / 2 + 0.55, y: 0.6 }));
  return g;
}

const baleEnd = () => textured(canvasTexture(64, 64, (ctx, W, H) => {
  ctx.fillStyle = '#d4ac4c';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#a77e2c';
  ctx.lineWidth = 2;
  for (let rr = 4; rr < W / 2; rr += 5) {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, rr, 0, Math.PI * 2);
    ctx.stroke();
  }
}, { key: 'wheat-field:baleEnd', repeat: false }), { roughness: 0.95 });

/** Round hay bale lying along x (or standing when upright), with spiral ends. */
function roundBale(r = 0.75, upright = false) {
  const len = r * 1.4;
  const geo = new THREE.CylinderGeometry(r, r, len, 14);
  const side = tiledMat('baleSide', 1, (ctx, W, H) => {
    const q = rng(94);
    ctx.fillStyle = '#d8b450';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 4) {
      ctx.fillStyle = shade('#c49c3c', (q() - 0.5) * 0.3);
      ctx.fillRect(0, y, W, 1);
    }
    speckle(ctx, W, H, q, ['#ecd27a', '#b48a32'], 300, 2);
  });
  const m = new THREE.Mesh(geo, [side, baleEnd(), baleEnd()]);
  if (!upright) geo.rotateZ(Math.PI / 2);
  geo.translate(0, upright ? len / 2 : r, 0);
  return m;
}

function scarecrow() {
  const coat = mat(PALETTE.blue);
  return group(
    cylinder(0.06, 0.06, 2.4, mat(PALETTE.woodDark), 5),
    place(box(0.1, 0.1, 1.6, mat(PALETTE.woodDark)), { y: 1.75 }),
    place(box(0.35, 0.75, 0.55, coat), { y: 1.25 }),
    place(box(0.12, 0.18, 1.5, coat), { y: 1.7 }),
    place(box(0.3, 0.3, 0.3, mat(PALETTE.hay)), { y: 2.05 }),
    place(cylinder(0.32, 0.32, 0.05, mat(PALETTE.roofBrown), 10), { y: 2.33 }),
    place(cylinder(0.17, 0.2, 0.25, mat(PALETTE.roofBrown), 10), { y: 2.35 }),
  );
}

/** Wooden five-bar gate, length along x from the hinge at origin. */
function farmGate(len = 3.4) {
  const wood = mat('#b08a58');
  const g = new THREE.Group();
  for (let i = 0; i < 5; i++) g.add(place(box(len, 0.08, 0.06, wood), { x: len / 2, y: 0.2 + i * 0.22 }));
  for (const x of [0.05, len / 2, len - 0.05]) g.add(place(box(0.1, 1.15, 0.08, wood), { x, y: 0.1 }));
  g.add(place(box(len * 1.05, 0.08, 0.06, wood), { x: len / 2, y: 0.6, rz: 16 }));
  return g;
}

/** Lumpy hedge: a box with bushy bumps on top. Length along x. */
function bushyHedge(len, seed, h = 1.15) {
  const r = rng(seed);
  const g = group(hedge({ w: len, h, d: 0.9, color: PALETTE.foliageDark }));
  const n = Math.max(1, Math.round(len / 1.3));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (len * (i + 0.5)) / n;
    const s = r.range(0.75, 1.0);
    const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.55 * s, 0), mat(r.pick([PALETTE.foliageDark, PALETTE.foliage])));
    b.scale.set(1.3, 0.75, 0.95);
    b.position.set(x, h - 0.05, 0);
    b.rotation.y = r() * 3;
    g.add(b);
  }
  return g;
}

// ---------------------------------------------------------------------------

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  const IN = HALF - 0.95; // inner edge of the hedge border
  const sideM = wheatSide();
  const topM = wheatTop();
  const wheatBlock = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0;
    return place(box(w, WHEAT_H, d, [sideM, sideM, topM, sideM, sideM, sideM]), { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2 });
  };

  // stubble covering the whole field
  g.add(place(box(IN * 2, 0.06, IN * 2, stubble()), { y: y0 }));
  // standing wheat at the back + the strip the combine is cutting
  const stripZ0 = -1.4, stripZ1 = 3.4, cutX = -1.2;
  g.add(wheatBlock(-IN, IN, -IN, stripZ0));
  g.add(wheatBlock(-IN, cutX, stripZ0, stripZ1));

  // combine heading -x into the strip; auger reaches over to the trailer at +z
  const cz = (stripZ0 + stripZ1) / 2;
  g.add(place(combine({ headerW: stripZ1 - stripZ0 + 0.4 }), { x: cutX + 4.25, y: y0 + 0.06, z: cz, ry: 180 }));
  // tractor + trailer running alongside on the stubble
  const tz = cz + 5.0;
  g.add(place(grainTrailer(4.6), { x: 2.7, y: y0 + 0.06, z: tz, ry: 180 }));
  g.add(place(tractor(), { x: -0.9, y: y0 + 0.06, z: tz, ry: 180 }));

  // straw windrows left behind the combine and on earlier passes
  const straw = mat('#e9d48a');
  g.add(place(box(IN - (cutX + 7.8), 0.22, 0.9, straw), { x: (IN + cutX + 7.8) / 2, y: y0, z: cz }));
  g.add(place(box(0.9, 0.25, 0.9, straw), { x: cutX + 7.3, y: y0, z: cz, ry: 45 }));

  // round bales in a loose row at the front, plus a stack near the gate
  const r = rng(7);
  const bale = (x, z, ry, y = y0 + 0.06) => place(roundBale(0.75), { x, y, z, ry });
  for (const [x, z] of [[-7.6, 7.1], [-4.9, 7.6], [-2.1, 7.0], [0.7, 7.5], [-6.6, 4.6]]) {
    g.add(bale(x, z, r.range(-35, 35)));
  }
  g.add(bale(6.4, 4.6, 90));
  g.add(bale(7.9, 4.6, 90));
  g.add(bale(7.15, 4.6, 90, y0 + 0.06 + 1.25));
  // a bale standing on end
  g.add(place(roundBale(0.75, true), { x: 7.3, y: y0 + 0.06, z: 7.4 }));

  // hedge border with a gate gap on the front (field entrance)
  const gx0 = 3.2, gx1 = 6.8; // gap in the front hedge
  const edge = HALF - 0.5;
  g.add(place(bushyHedge(HALF * 2 - 0.2, 11), { y: y0, z: -edge }));
  g.add(place(bushyHedge(HALF * 2 - 1.9, 12), { x: -edge, y: y0, ry: 90 }));
  g.add(place(bushyHedge(HALF * 2 - 1.9, 13), { x: edge, y: y0, ry: 90 }));
  g.add(place(bushyHedge(gx0 + HALF - 0.1, 14), { x: (gx0 - HALF + 0.1) / 2, y: y0, z: edge }));
  g.add(place(bushyHedge(HALF - 0.1 - gx1, 15), { x: (gx1 + HALF - 0.1) / 2, y: y0, z: edge }));
  // dirt track through the gate, posts and the open gate
  g.add(place(patch(gx1 - gx0, 1.6, 'dirt'), { x: (gx0 + gx1) / 2, y: y0, z: HALF - 0.8 }));
  g.add(place(patch(gx1 - gx0 - 0.4, 2.2, 'dirt'), { x: (gx0 + gx1) / 2, y: y0 + 0.02, z: IN - 1.1 }));
  for (const x of [gx0 + 0.1, gx1 - 0.1]) g.add(place(box(0.22, 1.4, 0.22, mat(PALETTE.woodDark)), { x, y: y0, z: edge }));
  g.add(place(farmGate(gx1 - gx0 - 0.3), { x: gx0 + 0.25, y: y0, z: edge - 0.1, ry: 72 }));

  // trees in the hedgerow
  g.add(place(tree({ kind: 'round', h: 6.5, seed: 21 }), { x: -7.6, y: y0, z: -7.6 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 22 }), { x: 8.0, y: y0, z: -3.0 }));
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 23 }), { x: -edge + 0.3, y: y0, z: 5.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.6, seed: 24 }), { x: edge - 0.4, y: y0, z: edge - 0.4 }));

  // scarecrow standing in the wheat
  g.add(place(scarecrow(), { x: -4.5, y: y0 + 0.3, z: -5.2, ry: 20 }));
  return g;
}

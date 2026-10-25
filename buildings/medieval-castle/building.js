import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, cylinder, cone, sphere, place, group, taperedBlock, surface, mat, emissive, water,
  textured, canvasTexture, shade, rng, tree, hayBale, beam, gableRoof, shedRoof, facadeBlock, chimney, ShapeBuilder,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (drawbridge) faces +z.
// Square moated castle: curtain walls rising out of the moat, round corner towers
// with slate cones, a twin-towered gatehouse with a lowered drawbridge, and a tall
// square keep with banners in the courtyard.

const DARK = '#1c1916';

// Ashlar stone blocks; 128 px = 2 m, applied to metre UVs.
function stoneMaterial(color, seed) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(seed);
    ctx.fillStyle = shade(color, -0.28);
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 32) {
      let x = -Math.floor(r() * 30);
      while (x < W) {
        const bw = 34 + Math.floor(r() * 30);
        const w = Math.min(bw, W - x);
        ctx.fillStyle = shade(color, (r() - 0.5) * 0.18);
        ctx.fillRect(x + 2, y + 2, w - 2, 29);
        ctx.fillStyle = shade(color, 0.12);
        ctx.fillRect(x + 2, y + 2, w - 2, 3);
        x += bw;
      }
    }
  }, { key: `medieval-castle:stone:${color}:${seed}` });
  tex.repeat.set(0.5, 0.5);
  return textured(tex);
}

// Box with 0..1 UVs on every face (for whole-face textures like flags and banners).
function decal(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

function heraldryTexture() {
  return canvasTexture(128, 80, (ctx, W, H) => {
    // quartered red and gold with a white cross border
    ctx.fillStyle = '#b8282a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f0c23a';
    ctx.fillRect(W / 2, 0, W / 2, H / 2);
    ctx.fillRect(0, H / 2, W / 2, H / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W / 2 - 5, 0, 10, H);
    ctx.fillRect(0, H / 2 - 5, W, 10);
  }, { key: 'medieval-castle:flag', repeat: false });
}

function bannerTexture() {
  return canvasTexture(64, 192, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#9e1f24';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.lineTo(W / 2, H - 26); ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0c23a';
    ctx.fillRect(0, 0, W, 8);
    ctx.fillRect(4, 8, 4, H - 30);
    ctx.fillRect(W - 8, 8, 4, H - 30);
    // gold shield with a red chevron
    ctx.beginPath();
    ctx.moveTo(14, 50); ctx.lineTo(50, 50); ctx.lineTo(50, 90); ctx.quadraticCurveTo(50, 115, 32, 125); ctx.quadraticCurveTo(14, 115, 14, 90);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#9e1f24';
    ctx.beginPath();
    ctx.moveTo(14, 100); ctx.lineTo(32, 78); ctx.lineTo(50, 100); ctx.lineTo(50, 110); ctx.lineTo(32, 88); ctx.lineTo(14, 110);
    ctx.closePath();
    ctx.fill();
  }, { key: 'medieval-castle:banner', repeat: false });
}

function shieldTexture() {
  return canvasTexture(64, 80, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = '#f0c23a';
    ctx.beginPath();
    ctx.moveTo(2, 2); ctx.lineTo(W - 2, 2); ctx.lineTo(W - 2, 40); ctx.quadraticCurveTo(W - 2, 68, W / 2, H - 2); ctx.quadraticCurveTo(2, 68, 2, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#b8282a';
    ctx.beginPath();
    ctx.moveTo(8, 8); ctx.lineTo(W - 8, 8); ctx.lineTo(W - 8, 40); ctx.quadraticCurveTo(W - 8, 63, W / 2, H - 9); ctx.quadraticCurveTo(8, 63, 8, 40);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = '#f0c23a';
    ctx.fillRect(W / 2 - 4, 12, 8, 52);
    ctx.fillRect(14, 28, W - 28, 8);
  }, { key: 'medieval-castle:shield', repeat: false });
}

// Triangular pennant on a pole; flies towards +x.
function pennant({ h = 2.2, len = 1.6, height = 0.6, color = '#b8282a' } = {}) {
  const b = new ShapeBuilder();
  b.tri([0, h, 0], [0, h - height, 0], [len, h - height / 2, 0], 0);
  const m = mat(color, { side: THREE.DoubleSide });
  return group(
    cylinder(0.05, 0.06, h, mat(PALETTE.woodDark), 6),
    new THREE.Mesh(b.build(), [m]),
    place(cylinder(0.1, 0.1, 0.12, mat(PALETTE.glassGold), 8), { y: h })
  );
}

// Rectangular heraldic flag on a pole.
function bigFlag({ h = 6, w = 2.6, fh = 1.6 } = {}) {
  const m = textured(heraldryTexture(), { side: THREE.DoubleSide });
  return group(
    cylinder(0.07, 0.09, h, mat(PALETTE.woodDark), 6),
    place(cylinder(0.14, 0.14, 0.18, mat(PALETTE.glassGold), 8), { y: h }),
    place(decal(w, fh, 0.04, m), { x: w / 2 + 0.05, y: h - fh - 0.1 })
  );
}

// Merlons on a circle of radius r (local origin = tower axis).
function merlonRing(r, n, material, { w = 0.6, h = 0.8, t = 0.35 } = {}) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = (i / n) * 360;
    const rad = THREE.MathUtils.degToRad(a);
    g.add(place(box(w, h, t, material), { x: Math.sin(rad) * r, z: Math.cos(rad) * r, ry: a }));
  }
  return g;
}

// Merlons along a straight edge on the x axis from x0 to x1 (local z = 0).
function merlonRow(x0, x1, material, { step = 1.1, w = 0.6, h = 0.8, t = 0.35 } = {}) {
  const g = new THREE.Group();
  const n = Math.max(1, Math.round((x1 - x0) / step));
  const s = (x1 - x0) / n;
  for (let i = 0; i <= n; i++) g.add(place(box(w, h, t, material), { x: x0 + i * s }));
  return g;
}

// Dark arched opening on a +z face: rectangle plus a semicircle on top.
function archOpening(w, h, material = mat(DARK)) {
  const r = w / 2;
  return group(
    box(w, h - r, 0.08, material),
    place(cylinder(r, r, 0.08, material, 12), { y: h - r, z: -0.04, rx: 90 })
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;

  const stoneM = stoneMaterial(PALETTE.stone, 7);
  const stoneLightM = stoneMaterial(shade(PALETTE.stone, 0.1), 8);
  const stoneDarkM = stoneMaterial(PALETTE.stoneDark, 9);
  const slateM = surface('shingles', PALETTE.roofSlate, { size: 2 });
  const woodM = surface('planks', PALETTE.wood, { size: 2 });
  const darkM = mat(DARK);
  const ironM = mat(PALETTE.darkGrey, { metalness: 0.4, roughness: 0.6 });

  // ---- ground: grass lot, moat, grass rim with stone bank -------------------
  g.add(lot([2, 2], 'grass'));
  const MO = 9.4; // moat outer half-size
  g.add(place(patch(2 * MO, 2 * MO, water(PALETTE.water), 0.04), { y: y0 }));
  const yr = y0 + 0.35; // rim top
  const rimTop = surface('grass', PALETTE.grass, { size: 4 });
  const rimSide = stoneDarkM;
  const rim = (w, d, x, z) => g.add(place(boxFaces(w, yr - y0, d, { sides: rimSide, top: rimTop }), { x, y: y0, z }));
  const RW = 10 - MO;
  rim(20, RW, 0, MO + RW / 2);
  rim(20, RW, 0, -MO - RW / 2);
  rim(RW, 2 * MO, MO + RW / 2, 0);
  rim(RW, 2 * MO, -MO - RW / 2, 0);

  // ---- island plinth (battered base rising from the water) -------------------
  const H = 6.0; // curtain wall centre-line half-size
  const T = 1.0; // wall thickness
  const WH = 6.0; // wall height
  const yi = y0 + 0.6; // courtyard level
  const islandTop = surface('gravel', PALETTE.dirt, { size: 3 });
  g.add(place(taperedBlock({ w: 2 * H + T + 0.9, d: 2 * H + T + 0.9, h: yi - y0, topW: 2 * H + T, topD: 2 * H + T, material: stoneDarkM, topMaterial: islandTop }), { y: y0 }));

  // ---- curtain walls ---------------------------------------------------------
  const GW = 2.3; // half-width of the gatehouse gap in the front wall
  const wallTop = yi + WH;
  g.add(place(box(2 * H, WH, T, stoneM), { y: yi, z: -H }));
  g.add(place(box(T, WH, 2 * H, stoneM), { x: H, y: yi }));
  g.add(place(box(T, WH, 2 * H, stoneM), { x: -H, y: yi }));
  const segW = H - GW;
  g.add(place(box(segW, WH, T, stoneM), { x: -(GW + segW / 2), y: yi, z: H }));
  g.add(place(box(segW, WH, T, stoneM), { x: GW + segW / 2, y: yi, z: H }));
  // string course just below the battlements
  const course = (w, d, x, z) => g.add(place(box(w, 0.3, d, stoneLightM), { x, y: wallTop - 0.6, z }));
  course(2 * H, T + 0.2, 0, -H);
  course(T + 0.2, 2 * H, H, 0);
  course(T + 0.2, 2 * H, -H, 0);
  course(segW, T + 0.2, -(GW + segW / 2), H);
  course(segW, T + 0.2, GW + segW / 2, H);
  // battlements on the outer edge of each wall walk
  const edge = H + T / 2 - 0.18;
  const tr = 2.0; // corner tower radius
  g.add(place(merlonRow(-H + tr + 0.3, H - tr - 0.3, stoneM), { y: wallTop, z: -edge }));
  g.add(place(merlonRow(-H + tr + 0.3, H - tr - 0.3, stoneM), { x: edge, y: wallTop, ry: 90 }));
  g.add(place(merlonRow(-H + tr + 0.3, H - tr - 0.3, stoneM), { x: -edge, y: wallTop, ry: 90 }));
  g.add(place(merlonRow(-H + tr + 0.3, -GW - 0.4, stoneM), { y: wallTop, z: edge }));
  g.add(place(merlonRow(GW + 0.4, H - tr - 0.3, stoneM), { y: wallTop, z: edge }));
  // low inner parapet of the wall walk
  g.add(place(box(2 * H - 2, 0.35, 0.2, stoneM), { y: wallTop, z: -H + T / 2 - 0.1 }));
  g.add(place(box(0.2, 0.35, 2 * H - 2, stoneM), { x: H - T / 2 + 0.1, y: wallTop }));
  g.add(place(box(0.2, 0.35, 2 * H - 2, stoneM), { x: -H + T / 2 - 0.1, y: wallTop }));
  // arrow slits on the outer faces
  const slit = (x, z, ry) => g.add(place(box(0.2, 1.2, 0.08, darkM), { x, y: yi + 2.6, z, ry }));
  for (const t of [-1.8, 1.8]) {
    slit(t, -H - T / 2 - 0.02, 180);
    slit(H + T / 2 + 0.02, t, 90);
    slit(-H - T / 2 - 0.02, t, -90);
  }
  slit(-3.9, H + T / 2 + 0.02, 0);
  slit(3.9, H + T / 2 + 0.02, 0);

  // ---- round corner towers ---------------------------------------------------
  const TH = 9.5;
  const towerColors = ['#b8282a', '#f0c23a', '#2f5fa8', '#b8282a'];
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz], i) => {
    const x = sx * H, z = sz * H;
    const t = new THREE.Group();
    t.add(place(cylinder(tr, tr + 0.4, yi - y0, stoneDarkM, 20), { y: y0 }));
    t.add(place(cylinder(tr, tr, TH, stoneM, 20), { y: yi }));
    t.add(place(cylinder(tr + 0.2, tr, 0.4, stoneLightM, 20), { y: yi + TH - 0.4 }));
    t.add(place(cylinder(tr + 0.2, tr + 0.2, 0.3, stoneM, 20), { y: yi + TH }));
    t.add(place(merlonRing(tr + 0.02, 10, stoneM), { y: yi + TH + 0.3 }));
    t.add(place(cone(tr - 0.25, 3.6, slateM, 16), { y: yi + TH + 0.3 }));
    t.add(place(pennant({ color: towerColors[i], h: 2.0, len: 1.5 }), { y: yi + TH + 3.75 }));
    // arrow slits facing outwards
    const outward = Math.atan2(sx, sz);
    for (const da of [-0.7, 0, 0.7]) {
      const a = outward + da;
      for (const sy of da === 0 ? [3.2, 6.4] : [4.8]) {
        t.add(place(box(0.2, 1.1, 0.08, darkM), { x: Math.sin(a) * (tr + 0.02), y: yi + sy, z: Math.cos(a) * (tr + 0.02), ry: THREE.MathUtils.radToDeg(a) }));
      }
    }
    g.add(place(t, { x, z }));
  });

  // ---- gatehouse with twin D-towers ------------------------------------------
  const gz = H + 0.4; // gate block centre z
  const gd = 2.6; // gate block depth
  const gFront = gz + gd / 2;
  const GH = 7.6;
  g.add(place(box(2 * GW + 0.6, yi - y0, gd + 0.6, stoneDarkM), { y: y0, z: gz }));
  g.add(place(box(2 * GW, GH, gd, stoneM), { y: yi, z: gz }));
  g.add(place(box(2 * GW + 0.3, 0.4, gd + 0.3, stoneLightM), { y: yi + GH - 0.4, z: gz }));
  g.add(place(merlonRow(-GW + 0.3, GW - 0.3, stoneM, { step: 0.9 }), { y: yi + GH, z: gFront - 0.03 }));
  g.add(place(merlonRow(-GW + 0.3, GW - 0.3, stoneM, { step: 0.9 }), { y: yi + GH, z: gz - gd / 2 + 0.18 }));
  // gate arch, raised portcullis and a heraldic shield above
  g.add(place(archOpening(2.0, 3.6), { y: yi, z: gFront }));
  for (let i = 0; i < 6; i++) g.add(place(box(0.07, 1.3, 0.06, ironM), { x: -0.85 + i * 0.34, y: yi + 2.3, z: gFront + 0.06 }));
  g.add(place(box(1.9, 0.07, 0.06, ironM), { y: yi + 2.65, z: gFront + 0.06 }));
  g.add(place(box(1.9, 0.07, 0.06, ironM), { y: yi + 3.1, z: gFront + 0.06 }));
  g.add(place(decal(1.0, 1.25, 0.06, textured(shieldTexture(), { alphaTest: 0.5 })), { y: yi + 4.6, z: gFront + 0.03 }));
  // D-towers
  const dr = 1.35, DH = 8.8;
  for (const sx of [-1, 1]) {
    const x = sx * (GW + 0.05), z = gz + 0.5;
    g.add(place(cylinder(dr, dr + 0.35, yi - y0, stoneDarkM, 18), { x, y: y0, z }));
    g.add(place(cylinder(dr, dr, DH, stoneM, 18), { x, y: yi, z }));
    g.add(place(cylinder(dr + 0.2, dr, 0.4, stoneLightM, 18), { x, y: yi + DH - 0.4, z }));
    g.add(place(cylinder(dr + 0.2, dr + 0.2, 0.3, stoneM, 18), { x, y: yi + DH, z }));
    g.add(place(merlonRing(dr + 0.02, 8, stoneM, { w: 0.5 }), { x, y: yi + DH + 0.3, z }));
    g.add(place(pennant({ color: '#2f5fa8', h: 2.6, len: 1.4 }), { x, y: yi + DH + 0.3, z }));
    for (const sy of [2.8, 5.8]) g.add(place(box(0.2, 1.1, 0.08, darkM), { x: x + sx * 0.5, y: yi + sy, z: z + dr - 0.08, ry: sx * 22 }));
  }

  // ---- drawbridge, chains and torches ----------------------------------------
  const bz0 = gFront, bz1 = MO + 0.35;
  const bl = bz1 - bz0;
  const bridgeY = yi - 0.05;
  g.add(place(box(2.6, bridgeY - yr, 0.6, stoneDarkM), { y: yr, z: MO + 0.3 }));
  g.add(place(box(2.1, 0.18, bl, woodM), { y: bridgeY, z: bz0 + bl / 2 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.14, 0.32, bl, mat(PALETTE.woodDark)), { x: sx * 1.05, y: bridgeY, z: bz0 + bl / 2 }));
    g.add(beam([sx * 0.95, yi + 5.4, gFront], [sx * 0.95, bridgeY + 0.3, bz1 - 0.15], 0.07, ironM));
    g.add(place(cylinder(0.12, 0.12, 0.2, ironM, 8), { x: sx * 0.95, y: yi + 5.3, z: gFront }));
    // torches on the bank
    g.add(place(cylinder(0.06, 0.08, 1.5, mat(PALETTE.woodDark), 6), { x: sx * 1.7, y: yr, z: 9.7 }));
    g.add(place(cylinder(0.14, 0.09, 0.2, ironM, 8), { x: sx * 1.7, y: yr + 1.5, z: 9.7 }));
    g.add(place(cone(0.14, 0.4, emissive('#ff9a2a', 1.2), 6), { x: sx * 1.7, y: yr + 1.7, z: 9.7 }));
  }

  // ---- keep ------------------------------------------------------------------
  const kx = -1.5, kz = -1.6, KW = 5.6, KH = 13;
  const k = new THREE.Group();
  k.add(box(KW, KH, KW, stoneM));
  for (const cy of [4.6, 9.0]) k.add(place(box(KW + 0.2, 0.3, KW + 0.2, stoneLightM), { y: cy }));
  k.add(place(box(KW + 0.3, 0.4, KW + 0.3, stoneLightM), { y: KH - 0.4 }));
  // corner buttress turrets
  for (const [cx, cz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const px = cx * (KW / 2 - 0.3), pz = cz * (KW / 2 - 0.3);
    k.add(place(box(1.4, KH + 1.6, 1.4, stoneM), { x: px, z: pz }));
    k.add(place(box(1.6, 0.3, 1.6, stoneLightM), { x: px, y: KH + 1.6, z: pz }));
  }
  // battlements between the turrets + a low lead pyramid roof
  for (let f = 0; f < 4; f++) {
    const side = new THREE.Group();
    side.add(place(merlonRow(-1.6, 1.6, stoneM, { step: 0.8, w: 0.5 }), { y: KH, z: KW / 2 - 0.02 }));
    // windows: slit low, arched pairs higher up
    side.add(place(box(0.22, 1.3, 0.08, darkM), { x: f === 0 ? 1.4 : 0, y: 2.2, z: KW / 2 }));
    for (const wx of [-0.9, 0.9]) {
      side.add(place(archOpening(0.6, 1.5), { x: wx, y: 6.2, z: KW / 2 }));
      side.add(place(archOpening(0.6, 1.6), { x: wx, y: 10.4, z: KW / 2 }));
    }
    k.add(place(side, { ry: f * 90 }));
  }
  k.add(place(taperedBlock({ w: KW - 1.4, d: KW - 1.4, h: 1.6, topW: 0.3, topD: 0.3, material: slateM }), { y: KH }));
  k.add(place(bigFlag({ h: 6.5 }), { y: KH + 1.3 }));
  // entrance with stairs and hanging banners on the courtyard face
  k.add(place(archOpening(1.2, 2.3, mat(PALETTE.woodDark)), { x: -0.2, y: 0, z: KW / 2 }));
  const bannerM = textured(bannerTexture(), { alphaTest: 0.5 });
  for (const bx of [-1.6, 1.3]) k.add(place(decal(0.9, 2.8, 0.05, bannerM), { x: bx, y: 5.4, z: KW / 2 + 0.03 }));
  g.add(place(k, { x: kx, y: yi, z: kz }));
  for (let s = 0; s < 3; s++) g.add(place(box(1.4, 0.18, 0.4, stoneLightM), { x: kx - 0.2, y: yi + s * 0.18, z: kz + KW / 2 + 0.85 - s * 0.35 }));

  // ---- great hall along the east wall ----------------------------------------
  const hx = 3.75, hz = -2.3, hw = 3.4, hd = 6.4;
  g.add(place(facadeBlock({ w: hw, d: hd, h: 4, floorHeight: 4, style: 'punched', wall: PALETTE.cream, frame: PALETTE.woodDark, glass: PALETTE.window, windowW: 0.35, windowH: 0.45, bay: 1.6, lit: 0.3, seed: 4, blank: ['right'] }), { x: hx, y: yi, z: hz }));
  // timber framing on the courtyard side
  for (let i = 0; i <= 4; i++) g.add(place(box(0.14, 4, 0.1, mat(PALETTE.woodDark)), { x: hx - hw / 2 - 0.04, y: yi, z: hz - hd / 2 + 0.1 + i * ((hd - 0.2) / 4) }));
  g.add(place(box(0.1, 0.16, hd, mat(PALETTE.woodDark)), { x: hx - hw / 2 - 0.04, y: yi + 3.9 }));
  g.add(place(box(0.1, 0.16, hd, mat(PALETTE.woodDark)), { x: hx - hw / 2 - 0.04, y: yi + 0.0, z: hz }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 2.4, overhang: 0.3, ridge: 'z', material: surface('roofTiles', PALETTE.roofRed, { size: 2 }), gableMaterial: PALETTE.cream }), { x: hx, y: yi + 4, z: hz }));
  g.add(place(chimney({ w: 0.7, d: 0.7, h: 2.2, material: stoneDarkM }), { x: hx + 0.6, y: yi + 5.2, z: hz - 1.6 }));
  g.add(place(box(1.0, 2.0, 0.1, mat(PALETTE.woodDark)), { x: hx, y: yi, z: hz + hd / 2 + 0.03 }));

  // ---- stable lean-to along the west wall ------------------------------------
  const sx0 = -H + T / 2 + 0.95, sz0 = 3.3;
  g.add(place(shedRoof({ w: 3.8, d: 1.9, h: 0.8, overhang: 0.2, material: woodM, wallMaterial: mat(PALETTE.wood) }), { x: sx0, y: yi + 2.4, z: sz0, ry: 90 }));
  for (const pz of [-1.8, 0, 1.8]) g.add(place(box(0.14, 2.4, 0.14, mat(PALETTE.woodDark)), { x: sx0 + 0.85, y: yi, z: sz0 + pz }));
  g.add(place(hayBale({ r: 0.4 }), { x: sx0 - 0.1, y: yi, z: sz0 - 1.0, ry: 90 }));
  g.add(place(hayBale({ r: 0.4 }), { x: sx0 - 0.1, y: yi, z: sz0 + 0.2, ry: 90 }));
  g.add(place(box(0.8, 0.5, 0.4, mat(PALETTE.woodDark)), { x: sx0, y: yi, z: sz0 + 1.3 }));

  // ---- courtyard: cobbled path, well, cart, barrels, tree --------------------
  g.add(place(patch(2.2, 3.7, surface('cobbles', PALETTE.stone, { size: 2 })), { x: -0.4, y: yi, z: 3.6 }));
  const wellX = 2.9, wellZ = 3.0;
  g.add(place(cylinder(0.75, 0.75, 0.7, stoneLightM, 12), { x: wellX, y: yi, z: wellZ }));
  g.add(place(cylinder(0.55, 0.55, 0.05, water(PALETTE.waterDeep), 12), { x: wellX, y: yi + 0.66, z: wellZ }));
  for (const sx of [-1, 1]) g.add(place(box(0.12, 1.7, 0.12, mat(PALETTE.woodDark)), { x: wellX + sx * 0.65, y: yi + 0.5, z: wellZ }));
  g.add(place(gableRoof({ w: 1.6, d: 1.0, h: 0.5, overhang: 0.1, ridge: 'x', material: surface('roofTiles', PALETTE.roofRed, { size: 2 }), gableMaterial: PALETTE.woodDark }), { x: wellX, y: yi + 2.2, z: wellZ }));
  // hay cart
  const cart = new THREE.Group();
  cart.add(place(box(1.8, 0.5, 1.0, woodM), { y: 0.45 }));
  cart.add(place(box(1.6, 0.5, 0.9, mat(PALETTE.hay)), { y: 0.95 }));
  for (const cz of [-0.55, 0.55]) cart.add(place(cylinder(0.42, 0.42, 0.1, mat(PALETTE.woodDark), 10), { y: 0.0, z: cz, rx: 90 }));
  cart.add(beam([0.9, 0.5, 0], [1.9, 0.25, 0.3], 0.08, mat(PALETTE.woodDark)));
  cart.add(beam([0.9, 0.5, 0], [1.9, 0.25, -0.3], 0.08, mat(PALETTE.woodDark)));
  g.add(place(cart, { x: 3.0, y: yi + 0.42, z: 4.9 - 0.0, ry: 10 }));
  for (const [bx, bz] of [[1.5, 1.6], [1.9, 1.3], [-4.2, -5.0], [-3.7, -5.0]]) {
    g.add(place(cylinder(0.3, 0.3, 0.75, woodM, 10), { x: bx, y: yi, z: bz }));
    g.add(place(cylinder(0.32, 0.32, 0.06, ironM, 10), { x: bx, y: yi + 0.5, z: bz }));
  }
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: -2.8, y: yi, z: 4.3 }));

  // ---- moat life: a rowing boat and lily pads --------------------------------
  const boat = new THREE.Group();
  boat.add(taperedBlock({ w: 1.9, d: 0.7, h: 0.35, topW: 2.3, topD: 0.95, material: mat(PALETTE.woodDark), topMaterial: mat(PALETTE.wood) }));
  boat.add(place(box(0.2, 0.06, 0.9, mat(PALETTE.woodLight)), { y: 0.35 }));
  boat.add(beam([0.1, 0.4, 0.45], [0.9, 0.05, 0.75], 0.06, mat(PALETTE.woodLight)));
  g.add(place(boat, { x: 1.8, y: y0 + 0.02, z: -8.2, ry: 8 }));
  const padM = mat(PALETTE.foliageLight);
  for (const [px, pz] of [[-3.2, -8.6], [-2.7, -8.1], [-3.6, -7.7], [8.4, 2.5], [8.8, 3.1], [-8.5, -1.0], [-8.2, -0.4], [4.8, 8.5]]) {
    g.add(place(cylinder(0.28, 0.28, 0.03, padM, 8), { x: px, y: y0 + 0.04, z: pz }));
  }
  g.add(place(sphere(0.09, mat(PALETTE.pink), 6), { x: -2.7, y: y0 + 0.05, z: -8.1 }));
  g.add(place(sphere(0.09, mat(PALETTE.white), 6), { x: 8.8, y: y0 + 0.05, z: 3.1 }));

  // ---- banks: bushes at the corners ------------------------------------------
  for (const [bx, bz, s] of [[9.65, 9.65, 21], [-9.65, 9.65, 22], [9.65, -9.65, 23], [-9.65, -9.65, 24], [6.5, 9.65, 25], [-6.5, 9.65, 26], [9.65, 0, 27], [-9.65, -3, 28]]) {
    g.add(place(tree({ kind: 'bush', h: 0.7, seed: s }), { x: bx, y: yr, z: bz }));
  }

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, gableRoof, door, windowPanel,
  pipe, pipeRun, beam, surface, mat, metal, textured, signTexture, canvasTexture, rng, tree,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Timber sugar shack (gable to the street) with a louvered steam cupola on the ridge,
// a lean-to woodshed, tapped red maples with buckets and blue sap tubing to a tank.

const Y0 = LOT_HEIGHT;
const SAP_LINE = '#2f8fd6';

// Sign with 0..1 UVs on the front face, so the text fills the whole board.
function board(text, w, h, { bg, fg, depth = 0.12, border = null, leaf = false }) {
  const tw = 512, th = Math.max(32, Math.round((tw * h) / w));
  const tex = leaf
    ? canvasTexture(tw, th, (ctx, W, H) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = border ?? fg;
      ctx.lineWidth = H * 0.07;
      ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
      mapleLeaf(ctx, H * 0.5, H * 0.52, H * 0.3, PALETTE.red);
      mapleLeaf(ctx, W - H * 0.5, H * 0.52, H * 0.3, PALETTE.red);
      ctx.fillStyle = fg;
      let size = H * 0.56;
      ctx.font = `bold ${size}px sans-serif`;
      while (ctx.measureText(text).width > W - H * 1.9 && size > 6) ctx.font = `bold ${--size}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, H / 2 + H * 0.04);
    }, { key: `maple-sugar-shack:board:${text}`, repeat: false })
    : signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Simple 5-lobed maple leaf drawn with a star-ish polygon.
function mapleLeaf(ctx, cx, cy, r, color) {
  const pts = [
    [0, -1], [0.18, -0.62], [0.42, -0.78], [0.36, -0.34], [0.9, -0.5], [0.72, -0.18],
    [0.98, 0.02], [0.5, 0.2], [0.58, 0.44], [0.12, 0.3], [0.08, 0.95], [-0.08, 0.95],
    [-0.12, 0.3], [-0.58, 0.44], [-0.5, 0.2], [-0.98, 0.02], [-0.72, -0.18], [-0.9, -0.5],
    [-0.36, -0.34], [-0.42, -0.78], [-0.18, -0.62],
  ];
  ctx.fillStyle = color;
  ctx.beginPath();
  pts.forEach(([x, y], i) => (i ? ctx.lineTo(cx + x * r, cy + y * r) : ctx.moveTo(cx + x * r, cy + y * r)));
  ctx.closePath();
  ctx.fill();
}

// Log cylinder with bark on the side and pale end grain on the caps.
const logGeoCache = new Map();
function log(len, r) {
  const key = `${len}:${r}`;
  if (!logGeoCache.has(key)) logGeoCache.set(key, new THREE.CylinderGeometry(r, r, len, 7).rotateZ(Math.PI / 2));
  const m = new THREE.Mesh(logGeoCache.get(key), [mat(PALETTE.trunk), mat('#d9b47c'), mat('#d9b47c')]);
  return m;
}

// Stacked cordwood: logs along X, stacked into a w (along Z) x h wall, `rows` deep along X.
function cordwood({ w, h, len = 0.8, r = 0.13, rows = 1, seed = 1 }) {
  const rr = rng(seed);
  const g = new THREE.Group();
  const n = Math.floor(w / (r * 2));
  const layers = Math.floor(h / (r * 1.75));
  for (let k = 0; k < rows; k++) {
    for (let j = 0; j < layers; j++) {
      const off = j % 2 ? r : 0;
      for (let i = 0; i < n - (j % 2); i++) {
        const l = log(len, r * (0.85 + rr() * 0.2));
        l.position.set(k * (len + 0.04) + rr.range(-0.05, 0.05), r + j * r * 1.75, -w / 2 + r + off + i * r * 2);
        g.add(l);
      }
    }
  }
  return g;
}

// Galvanised sap bucket with a peaked lid and spout, hung on the trunk; faces +z.
function sapBucket() {
  const steel = metal(PALETTE.steelLight, { roughness: 0.35 });
  return group(
    place(cylinder(0.17, 0.14, 0.36, steel, 10), { y: -0.36, z: 0.2 }),
    place(cone(0.24, 0.14, metal(PALETTE.steel), 4), { y: 0.02, z: 0.2, ry: 45 }),
    place(box(0.04, 0.04, 0.2, metal(PALETTE.steelDark)), { y: 0.06, z: 0.06 }),
  );
}

// Maple: thick trunk, a couple of limbs and a lumpy crown of autumn red/orange.
function maple({ h = 6.5, seed = 1, colors }) {
  const r = rng(seed);
  const g = new THREE.Group();
  const bark = mat(PALETTE.trunk);
  const trunkH = h * 0.42;
  g.add(cylinder(0.2, 0.3, trunkH + 0.4, bark, 7));
  g.add(beam([0, trunkH * 0.85, 0], [0.9, trunkH + 1.0, 0.2], 0.16, bark));
  g.add(beam([0, trunkH * 0.85, 0], [-0.8, trunkH + 0.9, -0.3], 0.16, bark));
  const cy = trunkH + h * 0.3;
  const blobs = [[0, 0.35, 0, 1.0], [1.05, 0, 0.3, 0.75], [-1.0, -0.05, -0.2, 0.75], [0.2, -0.1, 1.0, 0.7], [-0.25, 0.05, -1.0, 0.7], [0.1, 0.95, 0, 0.6]];
  for (const [x, y, z, s] of blobs) {
    const leaf = mat(r.pick(colors));
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.2 * s, 0), leaf);
    m.position.set(x * h * 0.15, cy + y * h * 0.14, z * h * 0.15);
    m.rotation.set(r() * 3, r() * 3, r() * 3);
    g.add(m);
  }
  g.userData.tapY = 1.35;
  return g;
}

// A puff of steam / smoke.
function puffs(points, color, opacity) {
  const m = mat(color, { transparent: true, opacity, roughness: 1 });
  const g = new THREE.Group();
  for (const [x, y, z, s] of points) {
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m);
    p.position.set(x, y, z);
    g.add(p);
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  // ground: trampled dirt yard in front, path to the road, dirt under the woodshed
  g.add(place(patch(6.0, 2.6, 'dirt'), { x: -1.4, y: Y0, z: 2.75 }));
  g.add(place(patch(1.6, 1.8, 'dirt'), { x: -0.7, y: Y0, z: 4.1 }));
  g.add(place(patch(2.0, 4.8, 'gravel'), { x: -3.85, y: Y0, z: -1.4 }));

  // --- the shack -----------------------------------------------------------
  const cx = -0.7, cz = -1.3, W = 4.4, D = 5.4, wallH = 2.9, roofH = 2.1;
  const wallMat = surface('planks', '#8a5634', { size: 1.6, seed: 4 });
  const trim = mat('#5a3a22');
  const roofMat = surface('corrugated', PALETTE.roofGreen, { size: 1.2 });

  // stone footing + plank walls
  g.add(place(box(W + 0.2, 0.3, D + 0.2, mat(PALETTE.stone)), { x: cx, y: Y0, z: cz }));
  g.add(place(box(W, wallH - 0.3, D, wallMat), { x: cx, y: Y0 + 0.3, z: cz }));
  // corner boards
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.18, wallH - 0.3, 0.18, trim), { x: cx + sx * (W / 2), y: Y0 + 0.3, z: cz + sz * (D / 2) }));
  }
  // vertical battens on the long walls
  for (const sx of [-1, 1]) for (let i = -2; i <= 2; i++) {
    g.add(place(box(0.06, wallH - 0.45, 0.1, trim), { x: cx + sx * (W / 2 + 0.02), y: Y0 + 0.3, z: cz + i * 1.05 }));
  }
  // gable roof (ridge front-to-back), gables in plank
  const ridgeY = Y0 + wallH + roofH;
  g.add(place(gableRoof({ w: W, d: D, h: roofH, overhang: 0.35, ridge: 'z', material: roofMat, gableMaterial: wallMat }), { x: cx, y: Y0 + wallH, z: cz }));
  // fascia boards on the front gable
  const slope = Math.atan2(roofH, W / 2) * 180 / Math.PI;
  const rafterLen = Math.hypot(W / 2 + 0.35, roofH + 0.35 * roofH / (W / 2));
  for (const s of [-1, 1]) {
    for (const zz of [cz + D / 2 + 0.36, cz - D / 2 - 0.36]) {
      g.add(place(box(rafterLen, 0.16, 0.08, mat(PALETTE.white)), { x: cx + s * (W / 4 + 0.17), y: Y0 + wallH + roofH / 2 - 0.25, z: zz, rz: -s * slope }));
    }
  }

  // steam cupola along the ridge: louvered sides, its own little gable roof
  const cupL = 3.2, cupW = 1.2, cupH = 1.0;
  g.add(place(box(cupW, cupH + 0.5, cupL, wallMat), { x: cx, y: ridgeY - 0.5, z: cz }));
  for (const s of [-1, 1]) {
    g.add(place(box(0.04, cupH - 0.15, cupL - 0.3, mat('#2b2018')), { x: cx + s * (cupW / 2 + 0.01), y: ridgeY + 0.05, z: cz }));
    for (let i = 0; i < 4; i++) {
      g.add(place(box(0.06, 0.09, cupL - 0.3, mat(PALETTE.woodLight)), { x: cx + s * (cupW / 2 + 0.05), y: ridgeY + 0.12 + i * 0.2, z: cz, rz: s * 35 }));
    }
    g.add(place(box(0.1, cupH, 0.12, mat(PALETTE.white)), { x: cx + s * (cupW / 2 + 0.02), y: ridgeY, z: cz + cupL / 2 - 0.06 }));
    g.add(place(box(0.1, cupH, 0.12, mat(PALETTE.white)), { x: cx + s * (cupW / 2 + 0.02), y: ridgeY, z: cz - cupL / 2 + 0.06 }));
  }
  g.add(place(gableRoof({ w: cupW, d: cupL, h: 0.6, overhang: 0.3, ridge: 'z', material: roofMat, gableMaterial: wallMat }), { x: cx, y: ridgeY + cupH, z: cz }));

  // steam billowing out of the cupola, drifting towards +x
  const steam = [];
  const sr = rng(7);
  for (let i = 0; i < 9; i++) {
    const t = i / 8;
    steam.push([cx + sr.range(-0.5, 0.5) + t * 1.6, ridgeY + cupH + 0.6 + t * 3.0, cz + (i % 3 - 1) * 0.9 + sr.range(-0.2, 0.2), 0.55 + t * 0.55]);
  }
  for (const s of [-1, 1]) steam.push([cx + s * 1.0, ridgeY + 0.6, cz + 0.4, 0.38], [cx + s * 1.25, ridgeY + 1.0, cz - 0.7, 0.42]);
  g.add(puffs(steam, '#f4f6f8', 0.82));

  // evaporator stovepipe on the back of the right slope, with a little grey smoke
  const pipeX = cx + 1.2, pipeZ = cz - 2.0;
  const pipeBase = ridgeY - (1.2 / (W / 2)) * roofH - 0.1;
  g.add(place(cylinder(0.2, 0.2, ridgeY + 1.5 - pipeBase, metal(PALETTE.steelDark), 10), { x: pipeX, y: pipeBase, z: pipeZ }));
  g.add(place(cone(0.4, 0.3, metal(PALETTE.steelDark), 8), { x: pipeX, y: ridgeY + 1.55, z: pipeZ }));
  g.add(puffs([[pipeX + 0.3, ridgeY + 2.3, pipeZ, 0.35], [pipeX + 0.8, ridgeY + 2.8, pipeZ - 0.1, 0.45], [pipeX + 1.4, ridgeY + 3.2, pipeZ - 0.2, 0.5]], '#8d8f94', 0.75));

  // front: double plank doors with Z-bracing, windows glowing from the evaporator fire
  const fz = cz + D / 2;
  for (const s of [-1, 1]) {
    g.add(place(door({ w: 0.9, h: 2.2, color: '#6b3d22', frame: '#4a2e1a' }), { x: cx + s * 0.47, y: Y0 + 0.3, z: fz }));
    g.add(place(box(0.8, 0.1, 0.05, mat(PALETTE.white)), { x: cx + s * 0.47, y: Y0 + 0.5, z: fz + 0.14 }));
    g.add(place(box(0.8, 0.1, 0.05, mat(PALETTE.white)), { x: cx + s * 0.47, y: Y0 + 2.25, z: fz + 0.14 }));
    g.add(beam([cx + s * 0.1, Y0 + 0.6, fz + 0.15], [cx + s * 0.84, Y0 + 2.2, fz + 0.15], 0.09, mat(PALETTE.white)));
  }
  const litWin = { w: 0.7, h: 0.8, frame: PALETTE.white, lit: true };
  for (const s of [-1, 1]) g.add(place(windowPanel(litWin), { x: cx + s * 1.55, y: Y0 + 1.2, z: fz }));
  // sign on the front gable
  g.add(place(board('SUGAR SHACK', 3.2, 0.7, { bg: '#4a2e1a', fg: '#f6e3b4', border: '#f6e3b4', leaf: true }), { x: cx, y: Y0 + 2.55, z: fz + 0.06 }));
  // small loft vent in the gable
  g.add(place(box(0.6, 0.5, 0.08, mat('#2b2018')), { x: cx, y: Y0 + wallH + 0.55, z: fz + 0.02 }));

  // side windows (both long walls) and a back door
  for (const s of [-1, 1]) {
    for (const z of [cz - 1.6, cz + 1.0]) {
      g.add(place(windowPanel(litWin), { x: cx + s * (W / 2), y: Y0 + 1.2, z, ry: s * 90 }));
    }
  }
  g.add(place(door({ w: 1.0, h: 2.1, color: '#6b3d22', frame: '#4a2e1a' }), { x: cx + 0.8, y: Y0 + 0.3, z: cz - D / 2, ry: 180 }));

  // --- lean-to woodshed on the west wall ----------------------------------
  const lx0 = cx - W / 2, lx1 = -4.75, lz = cz, lD = 4.6;
  const hiY = Y0 + 2.6, loY = Y0 + 1.95;
  for (const z of [lz - lD / 2 + 0.1, lz, lz + lD / 2 - 0.1]) {
    g.add(place(box(0.14, loY - Y0, 0.14, trim), { x: lx1 + 0.15, y: Y0, z }));
  }
  const lw = lx0 - lx1;
  const lAng = Math.atan2(hiY - loY, lw) * 180 / Math.PI;
  g.add(place(box(Math.hypot(lw, hiY - loY) + 0.1, 0.08, lD + 0.3, roofMat), { x: (lx0 + lx1) / 2, y: (hiY + loY) / 2 - 0.02, z: lz, rz: lAng }));
  g.add(place(box(0.1, 0.12, lD, trim), { x: lx1 + 0.15, y: loY - 0.12, z: lz }));
  // cordwood stacked two rows deep, end grain showing
  g.add(place(cordwood({ w: lD - 0.5, h: 1.75, len: 0.72, rows: 2, seed: 3 }), { x: lx1 + 0.12 + 0.36, y: Y0, z: lz }));

  // --- free-standing woodpile, chopping block and axe ----------------------
  const wp = cordwood({ w: 2.4, h: 1.05, len: 0.62, r: 0.14, rows: 1, seed: 9 });
  g.add(place(wp, { x: -3.7, y: Y0, z: 2.75, ry: 90 }));
  for (const zz of [-0.25, 0.25]) {
    g.add(place(box(0.08, 1.2, 0.08, trim), { x: -4.95 + 0.04, y: Y0, z: 2.75 + zz }));
    g.add(place(box(0.08, 1.2, 0.08, trim), { x: -2.45, y: Y0, z: 2.75 + zz }));
  }
  g.add(place(cylinder(0.3, 0.32, 0.5, mat(PALETTE.wood), 9), { x: -2.0, y: Y0, z: 1.85 }));
  g.add(place(cylinder(0.3, 0.3, 0.02, mat('#d9b47c'), 9), { x: -2.0, y: Y0 + 0.5, z: 1.85 }));
  g.add(beam([-2.0, Y0 + 0.5, 1.85], [-1.75, Y0 + 1.15, 2.1], 0.06, mat(PALETTE.woodLight)));
  g.add(place(box(0.08, 0.16, 0.24, metal(PALETTE.steelDark)), { x: -2.0, y: Y0 + 0.47, z: 1.82, ry: 45 }));
  // split logs scattered by the block
  const sl = rng(13);
  for (let i = 0; i < 5; i++) {
    const l = log(0.55, 0.1);
    l.position.set(-2.0 + sl.range(-0.9, 0.7), Y0 + 0.1, 1.85 + sl.range(0.4, 0.9));
    l.rotation.y = sl() * Math.PI;
    g.add(l);
  }

  // --- sap collection tank on a stand, line into the shack -----------------
  const tx = 2.55, tz = -0.4;
  const tankM = metal(PALETTE.aluminium, { roughness: 0.3 });
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.45, 0.45]) {
    g.add(place(box(0.12, 0.9, 0.12, trim), { x: tx + sx, y: Y0, z: tz + sz }));
  }
  g.add(place(box(1.15, 0.1, 1.15, mat(PALETTE.woodDark)), { x: tx, y: Y0 + 0.9, z: tz }));
  g.add(place(cylinder(0.62, 0.62, 1.3, tankM, 16), { x: tx, y: Y0 + 1.0, z: tz }));
  g.add(place(cone(0.64, 0.25, tankM, 16), { x: tx, y: Y0 + 2.3, z: tz }));
  g.add(place(cylinder(0.64, 0.64, 0.06, metal(PALETTE.steel), 16), { x: tx, y: Y0 + 1.6, z: tz }));
  g.add(pipeRun([[tx - 0.6, Y0 + 1.15, tz], [cx + W / 2 + 0.05, Y0 + 1.15, tz]], 0.07, metal(PALETTE.steel)));

  // --- tapped maples with buckets and sap lines ----------------------------
  const reds = [PALETTE.red, '#d9481f', PALETTE.orange, '#b8282a'];
  const golds = [PALETTE.orange, PALETTE.autumn, '#e2a12a', '#d9541e'];
  const trees = [
    { x: 3.35, z: -3.35, h: 6.2, seed: 2, colors: reds, buckets: [200, 290] },
    { x: 3.55, z: 1.1, h: 5.6, seed: 5, colors: golds, buckets: [-20, 70] },
    { x: 3.6, z: 3.7, h: 4.6, seed: 8, colors: reds, buckets: [0, 250] },
    { x: -3.75, z: -3.95, h: 4.4, seed: 11, colors: golds, buckets: [330] },
  ];
  const lineM = mat(SAP_LINE, { roughness: 0.5 });
  const tankTop = [tx, Y0 + 2.4, tz];
  for (const t of trees) {
    g.add(place(maple(t), { x: t.x, y: Y0, z: t.z }));
    for (const a of t.buckets) {
      const rad = (a * Math.PI) / 180;
      g.add(place(sapBucket(), { x: t.x + Math.sin(rad) * 0.1, y: Y0 + 1.25, z: t.z + Math.cos(rad) * 0.1, ry: a }));
    }
    if (t.x < 0) continue; // the back-left tree is bucket-only
    // tubing: tap on the tree -> sagging run to the tank lid
    const tap = [t.x - Math.sign(t.x - tx) * 0.25, Y0 + 2.2, t.z - Math.sign(t.z - tz) * 0.25];
    const mid = [(tap[0] + tankTop[0]) / 2, Math.min(tap[1], tankTop[1]) - 0.3, (tap[2] + tankTop[2]) / 2];
    g.add(pipeRun([tap, mid, tankTop], 0.045, lineM));
  }
  // lateral line from the back-left maple, along the woodshed to the shack wall
  g.add(pipeRun([[-3.55, Y0 + 2.0, -3.75], [-3.0, Y0 + 2.5, -3.75], [cx - 1.0, Y0 + 2.7, cz - D / 2 - 0.05]], 0.045, lineM));

  // --- yard props ----------------------------------------------------------
  // syrup barrels by the door
  const barrelM = mat('#7a4a28');
  for (const [x, z] of [[1.05, 1.95], [1.1, 2.7], [0.45, 2.3]]) {
    g.add(place(cylinder(0.3, 0.3, 0.8, barrelM, 10), { x, y: Y0, z }));
    for (const y of [0.15, 0.62]) g.add(place(cylinder(0.31, 0.31, 0.05, metal(PALETTE.steelDark), 10), { x, y: Y0 + y, z }));
  }
  // roadside "maple syrup" sign on two posts
  g.add(place(box(0.1, 1.6, 0.1, trim), { x: -3.05, y: Y0, z: 4.6 }));
  g.add(place(box(0.1, 1.6, 0.1, trim), { x: -1.15, y: Y0, z: 4.6 }));
  g.add(place(board('MAPLE SYRUP', 2.1, 0.62, { bg: '#f6e3b4', fg: '#6b2a18', border: '#6b2a18', depth: 0.08 }), { x: -2.1, y: Y0 + 0.95, z: 4.62 }));
  // a couple of bushes
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 4 }), { x: -4.4, y: Y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 6 }), { x: 4.4, y: Y0, z: -0.9 }));

  return g;
}

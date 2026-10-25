import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, gableRoof, chimney, box, place, group, beam, cylinder, sphere,
  tree, fence, bench, surface, mat, textured, water, canvasTexture, shade, rng,
  windowPanel, door,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z; the chalet's gable faces the street.

const TIMBER = '#b0703c';
const TIMBER_DARK = '#6b4226';
const SHUTTER = '#3f7a45';
const GERANIUM = ['#d8262e', '#e8425a', '#c41e3a', '#f06a8a'];

// Rubble-stone wall: irregular rounded stones in mortar.
function stoneMat() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(41);
    ctx.fillStyle = '#6f6a62';
    ctx.fillRect(0, 0, W, H);
    for (let y = 0; y < H; y += 16) {
      let x = -r.int(0, 20);
      while (x < W) {
        const w = r.int(16, 30);
        ctx.fillStyle = shade(PALETTE.stone, (r() - 0.5) * 0.35);
        ctx.beginPath();
        ctx.roundRect(x + 1.5, y + 1.5, w - 3, 13, 4);
        ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.12)';
        ctx.fillRect(x + 4, y + 3, w - 10, 2);
        x += w;
      }
    }
  }, { key: 'alpine-chalet:stone' });
  return textured(tex);
}

// Ends of stacked firewood logs, ~1 m per repeat.
function logEndsMat() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(7);
    ctx.fillStyle = '#4a3020';
    ctx.fillRect(0, 0, W, H);
    for (let row = 0, y = 10; y < H + 10; y += 18, row++) {
      for (let x = row % 2 ? 0 : 10; x < W + 10; x += 20) {
        const rad = 8 + r() * 2;
        ctx.fillStyle = shade('#c9a06a', (r() - 0.5) * 0.3);
        ctx.beginPath();
        ctx.arc(x, y, rad, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#7a5532';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, y, rad * 0.5, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
  }, { key: 'alpine-chalet:logs' });
  return textured(tex);
}

// Carved balcony boards: two boards per repeat with wavy edges and a heart cut-out.
function carvedRailMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    for (const bx of [0, 32]) {
      ctx.fillStyle = '#a0612f';
      ctx.beginPath();
      ctx.moveTo(bx + 2, 0);
      ctx.lineTo(bx + 30, 0);
      ctx.quadraticCurveTo(bx + 34, H * 0.3, bx + 30, H * 0.5);
      ctx.quadraticCurveTo(bx + 34, H * 0.7, bx + 30, H);
      ctx.lineTo(bx + 2, H);
      ctx.quadraticCurveTo(bx - 2, H * 0.7, bx + 2, H * 0.5);
      ctx.quadraticCurveTo(bx - 2, H * 0.3, bx + 2, 0);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(bx + 26, 0, 4, H);
      // heart cut-out
      ctx.globalCompositeOperation = 'destination-out';
      const cx = bx + 16, cy = H * 0.5;
      ctx.beginPath();
      ctx.moveTo(cx, cy + 8);
      ctx.bezierCurveTo(cx - 12, cy - 2, cx - 6, cy - 12, cx, cy - 4);
      ctx.bezierCurveTo(cx + 6, cy - 12, cx + 12, cy - 2, cx, cy + 8);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';
    }
  }, { key: 'alpine-chalet:rail' });
  return textured(tex, { alphaTest: 0.5, side: THREE.DoubleSide });
}

// Carved railing panel of length len (along X), height h; faces +z/-z.
function railPanel(len, h, material) {
  const geom = new THREE.PlaneGeometry(len, h).translate(0, h / 2, 0);
  const uv = geom.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 0.5));
  return new THREE.Mesh(geom, material);
}

// Flower box with geraniums, running along X; flowers on top.
function flowerBox(len, seed) {
  const r = rng(seed);
  const g = group(
    box(len, 0.24, 0.3, TIMBER_DARK),
    place(box(len - 0.04, 0.12, 0.26, PALETTE.foliageDark), { y: 0.22 }),
  );
  const n = Math.max(2, Math.round(len / 0.26));
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + (i + 0.5) * (len / n);
    g.add(place(sphere(0.13 + r() * 0.03, mat(r.pick(GERANIUM)), 4), { x, y: 0.3, z: (r() - 0.5) * 0.08 }));
  }
  // trailing leaves over the front edge
  g.add(place(box(len * 0.9, 0.18, 0.08, PALETTE.foliage), { y: -0.05, z: 0.17 }));
  return g;
}

// Window with cross mullions and green shutters, facing +z.
function shutteredWindow(w = 0.8, h = 1.0) {
  const fr = mat(PALETTE.white);
  return group(
    windowPanel({ w, h, frame: PALETTE.white }),
    place(box(0.06, h, 0.06, fr), { z: 0.12 }),
    place(box(w, 0.06, 0.06, fr), { y: h * 0.55, z: 0.12 }),
    place(box(w * 0.5, h + 0.15, 0.06, SHUTTER), { x: -w * 0.78, y: -0.05, z: 0.04 }),
    place(box(w * 0.5, h + 0.15, 0.06, SHUTTER), { x: w * 0.78, y: -0.05, z: 0.04 }),
    place(box(w * 0.36, 0.05, 0.07, shade(SHUTTER, 0.35)), { x: -w * 0.78, y: h * 0.5, z: 0.06 }),
    place(box(w * 0.36, 0.05, 0.07, shade(SHUTTER, 0.35)), { x: w * 0.78, y: h * 0.5, z: 0.06 }),
    place(box(w + 0.3, 0.08, 0.2, PALETTE.white), { y: -0.04, z: 0.08 }),
  );
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const wood = surface('planks', TIMBER, { size: 1.6, seed: 4 });
  const woodDark = mat(TIMBER_DARK);
  const stone = stoneMat();
  const roofMat = surface('shingles', '#5b4434', { size: 1.6, seed: 9 });
  const rail = carvedRailMat();

  // house body
  const hx = -0.6, hz = -1.0, hw = 6.2, hd = 5.6;
  const h1 = 2.7, h2 = 2.6, rh = 2.3, ov = 1.15;
  const yU = y0 + h1;          // upper (timber) floor level
  const yR = yU + h2;          // top of walls / roof base
  const F = hz + hd / 2, B = hz - hd / 2, R = hx + hw / 2, L = hx - hw / 2;

  g.add(place(box(hw, h1, hd, stone), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.12, 0.22, hd + 0.12, woodDark), { x: hx, y: yU - 0.05, z: hz }));
  g.add(place(box(hw, h2, hd, wood), { x: hx, y: yU, z: hz }));
  // corner posts on the timber floor
  for (const [cx, cz] of [[L, F], [R, F], [L, B], [R, B]]) g.add(place(box(0.2, h2, 0.2, woodDark), { x: cx, y: yU, z: cz }));

  // deep-eaved shingle roof, gable to the street
  g.add(place(gableRoof({ w: hw, d: hd, h: rh, overhang: ov, ridge: 'z', material: roofMat, gableMaterial: wood }), { x: hx, y: yR, z: hz }));
  // thick shingle slabs on top give the deep eaves a chunky timber edge
  const S = hw / 2 + ov, drop = (ov * rh) / (hw / 2), rt = 0.28;
  const slope = Math.atan2(rh, hw / 2), slabLen = Math.hypot(S, rh + drop) + 0.1;
  const edge = mat(TIMBER_DARK);
  const slab = [edge, edge, roofMat, edge, edge, edge];
  for (const s of [-1, 1]) {
    g.add(place(box(slabLen, rt, hd + 2 * ov + 0.1, slab), {
      x: hx + s * (S / 2 - 0.05), y: yR + (rh - drop) / 2, z: hz, rz: -s * (slope * 180) / Math.PI,
    }));
  }
  g.add(place(box(0.5, 0.22, hd + 2 * ov + 0.1, edge), { x: hx, y: yR + rh + rt * 0.75, z: hz }));
  g.add(place(box(0.1, 0.7, 0.1, woodDark), { x: hx, y: yR + rh + 0.1, z: hz + hd / 2 + ov }));
  g.add(place(sphere(0.12, woodDark, 6), { x: hx, y: yR + rh + 0.8, z: hz + hd / 2 + ov + 0.05 }));
  // purlins running out under the overhang, with carved ends at the gables
  for (const t of [0, 0.5, 1]) {
    for (const s of t === 0 ? [0] : [-1, 1]) {
      const px = hx + s * t * (hw / 2 + ov * 0.6);
      const py = yR + rh * (1 - (t * (hw / 2 + ov * 0.6)) / (hw / 2)) - 0.28;
      g.add(place(box(0.22, 0.26, hd + 2 * ov - 0.05, woodDark), { x: px, y: py - 0.13, z: hz }));
    }
  }
  // gable tie-beam
  g.add(place(box(hw + 0.1, 0.22, 0.12, woodDark), { x: hx, y: yR - 0.06, z: F + 0.04 }));

  // stone chimney on the back slope
  g.add(place(chimney({ w: 0.9, h: 2.9, material: stone, capMaterial: woodDark }), { x: hx + 1.5, y: yR, z: hz - 1.4 }));

  // put a +z-facing item onto a wall face; t runs left->right as seen from outside
  const onWall = (obj, face, t, y, out = 0) => {
    const p = {
      front: { x: hx + t, z: F + out, ry: 0 },
      back: { x: hx - t, z: B - out, ry: 180 },
      right: { x: R + out, z: hz - t, ry: 90 },
      left: { x: L - out, z: hz + t, ry: -90 },
    }[face];
    g.add(place(obj, { ...p, y }));
  };

  // ground floor: front door + windows all round
  onWall(door({ w: 1.1, h: 2.1, color: TIMBER_DARK, frame: PALETTE.stoneDark }), 'front', 0, y0 + 0.15);
  g.add(place(box(1.8, 0.15, 0.9, PALETTE.stoneDark), { x: hx, y: y0, z: F + 0.45 }));
  for (const t of [-2.0, 2.0]) onWall(shutteredWindow(0.8, 0.95), 'front', t, y0 + 1.0);
  for (const t of [-1.4, 1.4]) onWall(shutteredWindow(0.8, 0.95), 'right', t, y0 + 1.0);
  for (const t of [-1.5, 1.5]) onWall(shutteredWindow(0.8, 0.95), 'back', t, y0 + 1.0);
  onWall(shutteredWindow(0.7, 0.8), 'left', 1.9, y0 + 1.2);

  // upper floor: balcony door + windows
  onWall(door({ w: 1.0, h: 2.1, color: PALETTE.window, frame: PALETTE.white }), 'front', 0, yU + 0.1);
  for (const t of [-2.0, 2.0]) onWall(shutteredWindow(0.85, 1.1), 'front', t, yU + 0.8);
  for (const t of [-1.6, 0.4]) onWall(shutteredWindow(0.85, 1.1), 'right', t, yU + 0.8);
  onWall(door({ w: 0.9, h: 2.1, color: PALETTE.window, frame: PALETTE.white }), 'right', 1.8, yU + 0.1);
  for (const t of [-1.5, 1.5]) onWall(shutteredWindow(0.85, 1.1), 'back', t, yU + 0.8);
  for (const t of [-1.5, 1.5]) onWall(shutteredWindow(0.85, 1.1), 'left', t, yU + 0.8);
  // attic gable windows
  onWall(door({ w: 0.9, h: 1.6, color: PALETTE.window, frame: PALETTE.white }), 'front', 0, yR + 0.1);
  onWall(shutteredWindow(0.8, 0.9), 'back', 0, yR + 0.4);

  // wrap-around balcony (front + right side) on the upper floor
  const bd = 1.1, railH = 1.0;
  const frontLen = hw + bd, fx = hx + bd / 2;
  const sideLen = hd - 0.6;                 // right side run, from the front corner back
  const sz = F - sideLen / 2;
  g.add(place(box(frontLen, 0.18, bd, woodDark), { x: fx, y: yU - 0.18, z: F + bd / 2 }));
  g.add(place(box(bd, 0.18, sideLen, woodDark), { x: R + bd / 2, y: yU - 0.18, z: sz }));
  // rails: front, left end, right side, back end
  const railRun = (len, x, z, ry) => {
    g.add(place(railPanel(len, railH - 0.1, rail), { x, y: yU, z, ry }));
    g.add(place(box(len + 0.12, 0.1, 0.14, woodDark), { x, y: yU + railH - 0.1, z, ry }));
  };
  railRun(frontLen, fx, F + bd - 0.05, 0);
  railRun(bd, L + 0.05, F + bd / 2, 90);
  railRun(sideLen + bd, R + bd - 0.05, sz + bd / 2, 90);
  railRun(bd, R + bd / 2, sz - sideLen / 2 + 0.05, 0);
  // geranium boxes hung outside the railings
  g.add(place(flowerBox(frontLen - 0.4, 3), { x: fx, y: yU + railH - 0.3, z: F + bd + 0.12 }));
  g.add(place(flowerBox(sideLen - 0.2, 5), { x: R + bd + 0.12, y: yU + railH - 0.3, z: sz + bd / 2 - 0.1, ry: 90 }));
  // carved brackets under the balcony
  for (const bx of [L + 0.4, hx - 1.2, hx + 1.2, R + bd - 0.15]) g.add(beam([bx, yU - 1.1, F], [bx, yU - 0.18, F + bd - 0.15], 0.16, woodDark));
  for (const bz of [B + 0.8, hz]) g.add(beam([R, yU - 1.1, bz], [R + bd - 0.15, yU - 0.18, bz], 0.16, woodDark));

  // small gable balcony under the roof peak
  const gbW = 2.6, gbD = 0.85;
  g.add(place(box(gbW, 0.16, gbD, woodDark), { x: hx, y: yR - 0.06, z: F + gbD / 2 }));
  g.add(place(railPanel(gbW, 0.8, rail), { x: hx, y: yR + 0.1, z: F + gbD - 0.05 }));
  g.add(place(box(gbW + 0.1, 0.1, 0.14, woodDark), { x: hx, y: yR + 0.85, z: F + gbD - 0.05 }));
  for (const s of [-1, 1]) g.add(place(railPanel(gbD, 0.8, rail), { x: hx + s * gbW / 2, y: yR + 0.1, z: F + gbD / 2, ry: 90 }));
  g.add(place(flowerBox(gbW - 0.3, 8), { x: hx, y: yR + 0.6, z: F + gbD + 0.12 }));
  // ground-floor window boxes
  for (const t of [-2.0, 2.0]) g.add(place(flowerBox(1.0, 11 + t), { x: hx + t, y: y0 + 0.8, z: F + 0.2 }));
  for (const t of [-1.5, 1.5]) g.add(place(flowerBox(1.0, 13 + t), { x: hx + t, y: y0 + 0.8, z: B - 0.2, ry: 180 }));

  // firewood stacked under the left eave
  const logs = logEndsMat();
  const bark = mat('#5a3b24');
  const pileD = 4.6;
  g.add(place(box(0.85, 1.9, pileD, [logs, logs, bark, bark, logs, logs]), { x: L - 0.45, y: y0, z: hz - 0.2 }));
  for (const pz of [hz - 0.2 - pileD / 2, hz - 0.2 + pileD / 2]) g.add(place(box(0.12, 2.1, 0.12, woodDark), { x: L - 0.85, y: y0, z: pz }));
  // chopping block, axe and a small stack by the front corner
  g.add(place(box(1.4, 0.9, 0.8, [logs, logs, bark, bark, logs, logs]), { x: -3.4, y: y0, z: 2.9, ry: 90 }));
  g.add(place(cylinder(0.3, 0.34, 0.55, mat('#8a6440'), 8), { x: -2.3, y: y0, z: 3.7 }));
  g.add(place(cylinder(0.31, 0.31, 0.03, mat('#d1b07a'), 8), { x: -2.3, y: y0 + 0.55, z: 3.7 }));
  g.add(beam([-2.3, y0 + 0.6, 3.7], [-2.0, y0 + 1.25, 3.95], 0.06, mat('#c9a06a')));
  g.add(place(box(0.08, 0.2, 0.3, mat(PALETTE.steel)), { x: -2.3, y: y0 + 0.5, z: 3.65, rx: 30 }));
  for (const [lx, lz, ry] of [[-1.8, 4.1, 30], [-2.7, 4.2, -40]]) g.add(place(box(0.5, 0.16, 0.16, [logs, logs, bark, bark, bark, bark]), { x: lx, y: y0, z: lz, ry }));

  // stepping-stone path to the street + split-rail fence
  for (let i = 0; i < 4; i++) g.add(place(box(0.9, 0.08, 0.6, PALETTE.stone), { x: hx + (i % 2 ? 0.15 : -0.15), y: y0, z: F + 0.9 + i * 0.72 }));
  g.add(place(fence({ w: 9.6, d: 9.6, h: 0.9, style: 'railing', color: TIMBER_DARK, sides: ['front', 'right'], gap: 1.8 }), { x: 0, y: y0, z: 0 }));
  // wooden water trough (Brunnen)
  const tx = 2.9, tz = 3.6;
  g.add(place(box(1.8, 0.6, 0.8, mat('#7a5232')), { x: tx, y: y0, z: tz }));
  g.add(place(box(1.6, 0.05, 0.6, water()), { x: tx, y: y0 + 0.57, z: tz }));
  g.add(place(box(0.22, 1.3, 0.22, woodDark), { x: tx - 1.0, y: y0, z: tz }));
  g.add(beam([tx - 1.0, y0 + 1.15, tz], [tx - 0.6, y0 + 1.1, tz], 0.06, mat(PALETTE.steel)));
  g.add(place(box(0.05, 0.55, 0.05, mat(PALETTE.water, { opacity: 0.7, transparent: true })), { x: tx - 0.58, y: y0 + 0.55, z: tz }));
  g.add(place(bench({ w: 1.5 }), { x: hx + 2.0, y: y0, z: F + 0.6 }));

  // alpine meadow flowers + conifers
  const r = rng(77);
  for (let i = 0; i < 22; i++) {
    const x = r.range(-4.6, 4.6), z = r.range(-4.6, 4.6);
    const inHouse = x > L - 1.0 && x < R + 1.3 && z > B - 0.4 && z < F + 1.3;
    const inYard = (x > 1.8 && z > 2.9) || (x < -1.4 && z > 2.3);
    if (inHouse || inYard || (Math.abs(x - hx) < 0.8 && z > F)) continue;
    g.add(place(sphere(0.09, mat(r.pick(['#ffffff', '#f2d64b', '#9a7ad6', '#e8425a'])), 3), { x, y: y0 + 0.08, z }));
  }
  g.add(place(tree({ kind: 'cone', h: 6, seed: 2, color: PALETTE.foliageDark }), { x: 3.55, y: y0, z: -3.55 }));
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 3, color: PALETTE.foliageDark }), { x: -4.2, y: y0, z: -4.2 }));
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 4, color: PALETTE.foliage }), { x: 4.05, y: y0, z: 1.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 5 }), { x: -4.4, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 6 }), { x: 1.0, y: y0, z: 4.4 }));
  return g;
}

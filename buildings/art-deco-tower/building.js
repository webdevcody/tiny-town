import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, prismBlock, box, place, cylinder, cone, sphere, taperedBlock,
  extrudeGeometry, canvasTexture, textured, shade, mat, metal, emissive,
  tree, streetLamp, bench, flag, car, sign, door,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front faces +z.

const STONE = PALETTE.sandstone;
const STONE_LIGHT = shade(PALETTE.sandstone, 0.22);
const STONE_DARK = shade(PALETTE.sandstone, -0.2);
const GRANITE = '#5a4a42';
const BRONZE = '#6b4f2e';
const GOLD = '#d9b44a';

// Square of side s with a square notch n cut from each corner (12 points, CCW).
function notched(s, n) {
  const h = s / 2;
  if (n <= 0) return [[-h, -h], [h, -h], [h, h], [-h, h]];
  return [
    [-h + n, -h], [h - n, -h], [h - n, -h + n], [h, -h + n], [h, h - n], [h - n, h - n],
    [h - n, h], [-h + n, h], [-h + n, h - n], [-h, h - n], [-h, -h + n], [-h + n, -h + n],
  ];
}

// Art deco facade cell: light stone piers either side of a continuous dark
// strip of windows over bronze spandrel panels, so the tiers read as vertical.
function decoMaterial(seed) {
  const cols = 4, rows = 4, C = 64;
  const tex = canvasTexture(cols * C, rows * C, (ctx) => {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const x0 = col * C, y0 = row * C;
        ctx.fillStyle = STONE;
        ctx.fillRect(x0, y0, C, C);
        ctx.fillStyle = STONE_LIGHT;
        ctx.fillRect(x0, y0, 6, C);
        ctx.fillStyle = shade(STONE, -0.12);
        ctx.fillRect(x0 + C - 4, y0, 4, C);
        // recessed strip
        const sx = x0 + 14, sw = C - 28;
        ctx.fillStyle = shade(BRONZE, -0.25);
        ctx.fillRect(sx - 2, y0, sw + 4, C);
        // window
        const lit = r() < 0.14;
        ctx.fillStyle = lit ? PALETTE.windowLit : shade(PALETTE.window, (r() - 0.5) * 0.25);
        ctx.fillRect(sx, y0 + 4, sw, C * 0.6);
        ctx.fillStyle = 'rgba(255,255,255,0.18)';
        ctx.fillRect(sx, y0 + 4, sw * 0.35, C * 0.6);
        ctx.fillStyle = shade(BRONZE, 0.1);
        ctx.fillRect(sx + sw / 2 - 1, y0 + 4, 2, C * 0.6);
        // spandrel with chevron
        const py = y0 + 4 + C * 0.6 + 2;
        const ph = C - (py - y0) - 2;
        ctx.fillStyle = BRONZE;
        ctx.fillRect(sx, py, sw, ph);
        ctx.strokeStyle = GOLD;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(sx + 4, py + ph - 4);
        ctx.lineTo(sx + sw / 2, py + 4);
        ctx.lineTo(sx + sw - 4, py + ph - 4);
        ctx.stroke();
      }
    }
  }, { key: `art-deco-tower:facade:${seed}` });
  return { m: textured(tex, { roughness: 0.8 }), cols, rows };
}

function decoPrism(points, floors, { floorHeight = 3, bay = 1.8, seed = 1, roof = STONE_DARK } = {}) {
  const { m, cols, rows } = decoMaterial(seed);
  const h = floors * floorHeight;
  const geom = extrudeGeometry(points, h, {
    wallUV: (len) => [Math.max(1, Math.round(len / bay)) / cols, floors / rows],
  });
  const roofM = mat(roof);
  return new THREE.Mesh(geom, [m, roofM, roofM]);
}

function signedArea(pts) {
  let a = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % pts.length];
    a += x1 * z2 - x2 * z1;
  }
  return a / 2;
}

// Raised piers on the bay lines of every wall; convex corners get taller,
// stepped finials that poke above the cornice.
function piers(points, h, { bay = 1.8, t = 0.36, out = 0.14, rise = 0.9, cornerRise = 2.2 } = {}) {
  const g = new THREE.Group();
  const pm = mat(STONE_LIGHT);
  const cap = mat(STONE_DARK);
  const sgn = signedArea(points) > 0 ? 1 : -1;
  const n = points.length;
  for (let i = 0; i < n; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % n];
    const [x0, z0] = points[(i - 1 + n) % n];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const dx = (x2 - x1) / len, dz = (z2 - z1) / len;
    const nx = dz * sgn, nz = -dx * sgn;
    // vertex: convex?
    const px = (x1 - x0), pz = (z1 - z0);
    const cross = (px * (z2 - z1) - pz * (x2 - x1)) * sgn;
    if (cross > 0) {
      const plen = Math.hypot(px, pz);
      const pnx = (pz / plen) * sgn, pnz = (-px / plen) * sgn;
      const cx = x1 + (nx + pnx) * out, cz = z1 + (nz + pnz) * out;
      g.add(place(box(t * 1.5, h + cornerRise, t * 1.5, pm), { x: cx, z: cz }));
      g.add(place(box(t * 1.1, 0.7, t * 1.1, cap), { x: cx, y: h + cornerRise, z: cz }));
      g.add(place(cone(t * 0.45, 0.8, cap, 4), { x: cx, y: h + cornerRise + 0.7, z: cz, ry: 45 }));
    }
    const nb = Math.max(1, Math.round(len / bay));
    for (let k = 1; k < nb; k++) {
      const f = k / nb;
      const cx = x1 + (x2 - x1) * f + nx * out, cz = z1 + (z2 - z1) * f + nz * out;
      g.add(place(box(t, h + rise, t, pm), { x: cx, z: cz }));
    }
  }
  return g;
}

function slab(points, h, material) {
  return new THREE.Mesh(extrudeGeometry(points, h), [material, material, material]);
}

// Gilded sunburst portal for the main entrance.
function portalTexture() {
  return canvasTexture(128, 160, (ctx, W, H) => {
    ctx.fillStyle = shade(BRONZE, -0.35);
    ctx.fillRect(0, 0, W, H);
    // sunburst fan
    const cx = W / 2, cy = H * 0.5;
    for (let i = 0; i <= 12; i++) {
      const a = Math.PI + (i / 12) * Math.PI;
      ctx.strokeStyle = i % 2 ? GOLD : shade(GOLD, -0.25);
      ctx.lineWidth = i % 2 ? 5 : 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + Math.cos(a) * W * 0.6, cy + Math.sin(a) * W * 0.6);
      ctx.stroke();
    }
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(cx, cy, 12, Math.PI, 0);
    ctx.fill();
    // doors
    ctx.fillStyle = shade(PALETTE.windowLit, -0.05);
    ctx.fillRect(12, cy + 6, W - 24, H - cy - 6);
    ctx.fillStyle = BRONZE;
    for (let i = 0; i <= 3; i++) ctx.fillRect(12 + ((W - 24) / 3) * i - 2, cy + 6, 4, H - cy - 6);
    ctx.fillRect(12, cy + 6, W - 24, 4);
    ctx.strokeStyle = GOLD;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, W - 4, H - 4);
  }, { key: 'art-deco-tower:portal', repeat: false });
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const Z = -1.3; // tower sits back to leave a front plaza
  g.add(lot([2, 2], 'paved'));

  const tower = new THREE.Group();
  tower.position.set(0, y0, Z);
  g.add(tower);
  const corniceM = mat(STONE_LIGHT);
  const goldM = metal(GOLD, { roughness: 0.35 });

  // --- granite base: a tall lobby storey
  const baseH = 5;
  const basePts = notched(16, 2.4);
  tower.add(prismBlock({ points: basePts, floors: 1, floorHeight: baseH, style: 'grid', wall: GRANITE, glass: PALETTE.glassDark, frame: GOLD, lit: 0.45, bay: 2.4, seed: 3, roof: STONE_DARK }));
  tower.add(place(slab(notched(16.6, 2.4), 0.5, corniceM), { y: baseH }));
  tower.add(place(slab(notched(16.2, 2.4), 0.25, goldM), { y: baseH - 0.9 }));

  // --- setback tiers
  const tiers = [
    { s: 14.6, n: 2.2, floors: 6, seed: 11 },
    { s: 11.2, n: 1.8, floors: 5, seed: 12 },
    { s: 8.0, n: 1.3, floors: 5, seed: 13 },
    { s: 5.2, n: 0, floors: 3, seed: 14 },
  ];
  let y = baseH + 0.5;
  for (let i = 0; i < tiers.length; i++) {
    const t = tiers[i];
    const pts = notched(t.s, t.n);
    const h = t.floors * 3;
    tower.add(place(decoPrism(pts, t.floors, { seed: t.seed }), { y }));
    tower.add(place(piers(pts, h, { cornerRise: i === tiers.length - 1 ? 1.4 : 2.2 }), { y }));
    // stepped cornice
    tower.add(place(slab(notched(t.s + 0.5, t.n), 0.35, corniceM), { y: y + h }));
    tower.add(place(slab(notched(t.s + 0.2, t.n), 0.25, mat(STONE_DARK)), { y: y + h - 0.6 }));
    // terrace garden on the setback below this tier
    if (i < 3) {
      const half = t.s / 2 + 1;
      const room = (i === 0 ? 16 : tiers[i - 1].s) / 2 - t.s / 2;
      if (room > 0.9) {
        for (const [sx, sz] of [[1, 1], [-1, 1], [1, -1], [-1, -1]]) {
          const d = Math.min(half, t.s / 2 + room / 2);
          for (const [ax, az] of [[d, 0], [0, d]]) {
            const px = sx * (ax || t.s / 4), pz = sz * (az || t.s / 4);
            tower.add(place(box(0.9, 0.5, 0.9, mat(STONE_DARK)), { x: px, y, z: pz }));
            tower.add(place(tree({ kind: 'bush', h: 1.1, seed: i * 10 + sx * 3 + sz + ax }), { x: px, y: y + 0.5, z: pz }));
          }
        }
      }
    }
    y += h + 0.35;
  }

  // --- crown: stepped gold-banded drum, lantern and needle spire
  const crown = [[4.2, 1.6], [3.2, 1.6], [2.2, 1.6]];
  for (let i = 0; i < crown.length; i++) {
    const [s, h] = crown[i];
    tower.add(place(box(s, h, s, mat(STONE)), { y }));
    tower.add(place(box(s + 0.2, 0.2, s + 0.2, goldM), { y: y + h - 0.35 }));
    // gold fins on each face
    for (const [fx, fz, ry] of [[0, s / 2, 0], [0, -s / 2, 0], [s / 2, 0, 90], [-s / 2, 0, 90]]) {
      tower.add(place(box(0.25, h + 0.5, 0.25, goldM), { x: fx, y, z: fz, ry }));
    }
    y += h;
  }
  tower.add(place(box(1.6, 1.2, 1.6, emissive(PALETTE.windowLit, 0.6)), { y }));
  tower.add(place(taperedBlock({ w: 1.8, d: 1.8, h: 1.4, topW: 1, topD: 1, material: goldM }), { y: y + 1.2 }));
  y += 2.6;
  tower.add(place(cylinder(0.35, 0.5, 2.5, metal(PALETTE.chrome, { roughness: 0.25 }), 8), { y }));
  tower.add(place(cone(0.35, 12, metal(PALETTE.chrome, { roughness: 0.25 }), 8), { y: y + 2.5 }));
  tower.add(place(sphere(0.18, emissive(PALETTE.red, 1.2), 8), { y: y + 14.4 }));

  // --- entrance portal (front, +z)
  const frontZ = 8; // base front face (tower-local)
  const portal = textured(portalTexture(), { roughness: 0.6 });
  const pm = mat(STONE_LIGHT);
  tower.add(place(box(5.6, 7.2, 0.9, pm), { z: frontZ + 0.3 }));
  tower.add(place(box(4.4, 5.6, 0.1, [pm, pm, pm, pm, portal, pm]), { z: frontZ + 0.8 }));
  tower.add(place(box(6.2, 0.4, 1.1, goldM), { y: 7.2, z: frontZ + 0.3 }));
  tower.add(place(taperedBlock({ w: 3.4, d: 0.9, h: 1.2, topW: 1.2, topD: 0.9, material: pm }), { y: 7.6, z: frontZ + 0.3 }));
  tower.add(place(sign({ text: 'DECO TRUST', w: 4.4, h: 0.6, bg: shade(BRONZE, -0.3), fg: GOLD }), { y: 6.2, z: frontZ + 0.8 }));
  // entrance steps
  tower.add(place(box(5.2, 0.15, 1.4, mat(STONE_LIGHT)), { z: frontZ + 1.4 }));
  tower.add(place(box(4.8, 0.15, 0.8, mat(STONE_LIGHT)), { y: 0.15, z: frontZ + 1.1 }));

  // --- plaza: flagpoles, lamps, planters, benches, a taxi at the kerb
  const plazaZ = 8;
  g.add(place(patch(7, 3, 'cobbles'), { y: y0, z: plazaZ }));
  for (const sx of [-1, 1]) {
    g.add(place(flag({ h: 7, color: sx < 0 ? PALETTE.red : PALETTE.navy, color2: PALETTE.white }), { x: sx * 4.3, y: y0, z: 7.0 }));
    g.add(place(streetLamp({ h: 4.2 }), { x: sx * 7.3, y: y0, z: 9.6, ry: sx > 0 ? 180 : 0 }));
    g.add(place(box(1.6, 0.6, 1.6, mat(STONE_DARK)), { x: sx * 8.4, y: y0, z: 8.2 }));
    g.add(place(tree({ kind: 'cone', h: 4, seed: 20 + sx }), { x: sx * 8.4, y: y0 + 0.6, z: 8.2 }));
    g.add(place(bench({ w: 1.6 }), { x: sx * 6.6, y: y0, z: 7.4 }));
  }
  // side gardens with clipped trees
  for (const sx of [-1, 1]) {
    for (const z of [-7, -2, 3]) {
      g.add(place(box(1.2, 0.45, 1.2, mat(STONE_DARK)), { x: sx * 8.9, y: y0, z }));
      g.add(place(tree({ kind: 'round', h: 3.2, seed: 30 + sx * 5 + z }), { x: sx * 8.9, y: y0 + 0.45, z }));
    }
  }
  // back service area: loading door, plant box and a bin
  tower.add(place(door({ w: 3, h: 3.2, color: PALETTE.steelDark }), { x: 2, z: -8, ry: 180 }));
  tower.add(place(door({ w: 1.1, h: 2.3, color: BRONZE }), { x: -2.5, z: -8, ry: 180 }));
  g.add(place(box(3, 2.4, 1.2, mat(STONE_DARK)), { x: 6.4, y: y0, z: -9.2 }));
  g.add(place(box(1.4, 1.3, 0.9, mat(PALETTE.green)), { x: -6.5, y: y0, z: -9.3 }));
  g.add(place(car({ color: PALETTE.yellow, kind: 'taxi' }), { x: -4.7, y: y0, z: 9.0 }));
  g.add(place(car({ color: PALETTE.black }), { x: 4.7, y: y0, z: 9.0 }));
  return g;
}

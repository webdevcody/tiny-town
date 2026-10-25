import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, place, mat, surface, textured, canvasTexture, tree, box, cylinder, cone,
} from '../../src/lib/index.js';
import { clipRect, terraceGeometry } from './terraces.js';
import { worker, buffalo, plough, hut, sheaf, bamboo } from './props.js';

// 2x2 tiles (20 x 20 m). The hill rises towards the back-left corner (-X, -Z);
// paddies step down in wavy contour bands towards the front-right, where the
// farmer's stilt hut stands on flat ground.
const HW = TILE, HD = TILE;
const HILL = [-14.5, -12.5]; // contour centre, just outside the back-left corner
const RADII = [26.0, 23.8, 21.6, 19.4, 17.2, 15.0, 12.6, 10.2, 7.6]; // last one = grassy hilltop
const STEP = 0.65;

// wavy contour radius at angle a (radians) for terrace k
function radius(k, a) {
  const R = RADII[k];
  return R + (0.4 + R * 0.05) * Math.sin(a * 7 + 0.5 + k * 0.18) + 0.35 * Math.sin(a * 15 + k * 0.7);
}

function contour(k) {
  const pts = [HILL.slice()];
  for (let i = 0; i <= 120; i++) {
    const a = THREE.MathUtils.degToRad(-35 + (i / 120) * 160);
    const r = radius(k, a);
    pts.push([HILL[0] + Math.cos(a) * r, HILL[1] + Math.sin(a) * r]);
  }
  return clipRect(pts, HW, HD);
}

// point inside terrace band k (between contours k and k+1) at angle deg, frac 0..1 across the band
function inBand(k, deg, frac = 0.5) {
  const a = THREE.MathUtils.degToRad(deg);
  const r0 = radius(k, a), r1 = k + 1 < RADII.length ? radius(k + 1, a) : 0;
  const r = r1 + (r0 - r1) * (1 - frac) - 0.4;
  return { x: HILL[0] + Math.cos(a) * r, z: HILL[1] + Math.sin(a) * r };
}

const texCache = new Map();
function paddyMat(kind) {
  if (texCache.has(kind)) return texCache.get(kind);
  const base = canvasTexture(128, 128, (ctx, w, h) => {
    const sky = kind === 'mud' ? '#9a7d55' : kind === 'green' ? '#5d9a3a' : '#7cc3d6';
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // ripples / reflections
    ctx.strokeStyle = kind === 'mud' ? 'rgba(190,210,215,0.55)' : 'rgba(255,255,255,0.35)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 7; i++) {
      const y = (i * 37) % h, x = (i * 53) % w;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 26, y + 1);
      ctx.stroke();
    }
    if (kind === 'mud') return;
    // rows of rice seedlings
    const rows = kind === 'green' ? 10 : 6;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < rows; c++) {
        const x = (c + 0.5) * (w / rows), y = (r + 0.5) * (h / rows);
        if (kind === 'green') {
          ctx.fillStyle = (r + c) % 3 ? '#7dbb44' : '#94cc4f';
          ctx.fillRect(x - 5, y - 5, 10, 10);
        } else {
          ctx.fillStyle = '#4f9a2c';
          ctx.fillRect(x - 3, y - 3, 6, 6);
          ctx.fillStyle = '#7ec04a';
          ctx.fillRect(x - 2, y - 4, 3, 3);
        }
      }
    }
  }, { key: 'rice-terraces:paddy:' + kind });
  const t = base.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 2.5, 1 / 2.5);
  t.needsUpdate = true;
  const m = textured(t, { roughness: kind === 'green' ? 0.9 : 0.2, metalness: kind === 'green' ? 0 : 0.15 });
  texCache.set(kind, m);
  return m;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  const riser = surface('grass', PALETTE.grassDark, { size: 3 });
  const earth = mat('#7a5a3a');
  const bund = mat('#6aa83e');
  const hilltop = surface('grass', PALETTE.grass, { size: 4 });
  const kinds = ['mud', 'seedling', 'water', 'seedling', 'green', 'green', 'seedling', 'water'];

  for (let k = 0; k < RADII.length; k++) {
    const pts = contour(k);
    if (pts.length < 3) continue;
    const top = k === RADII.length - 1 ? hilltop : paddyMat(kinds[k]);
    const geo = terraceGeometry(pts, y0 + k * STEP, y0 + (k + 1) * STEP, { bundW: 0.32, bundH: k === RADII.length - 1 ? 0.0001 : 0.16 });
    g.add(new THREE.Mesh(geo, [k % 2 ? riser : earth, top, k === RADII.length - 1 ? hilltop : bund]));
  }
  const level = (k) => y0 + (k + 1) * STEP;

  // hilltop grove
  const topY = level(RADII.length - 1);
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 2, color: PALETTE.foliageDark }), { x: -7.9, y: topY, z: -8.0 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 5, color: PALETTE.foliage }), { x: -5.6, y: topY, z: -8.5 }));
  g.add(place(bamboo({ h: 4.2, seed: 3 }), { x: -8.4, y: topY, z: -5.2 }));

  // workers planting, in conical hats
  const shirts = [PALETTE.white, PALETTE.blue, PALETTE.red, '#e0c14a', PALETTE.white, '#3c8a8a', PALETTE.orange, PALETTE.purple];
  const crew = [
    [1, 22, 0.5, 40], [1, 50, 0.5, -30], [2, 15, 0.5, 120], [2, 62, 0.45, 80],
    [3, 32, 0.5, 200], [4, 46, 0.5, 30], [6, 40, 0.5, -60], [3, 66, 0.5, 160],
  ];
  crew.forEach(([k, deg, f, ry], i) => {
    const p = inBand(k, deg, f);
    g.add(place(worker({ shirt: shirts[i], bend: i % 3 === 2 ? 15 : 55, basket: i % 3 === 2 }), { x: p.x, y: level(k) - 0.25, z: p.z, ry, s: 1.15 }));
  });

  // buffalo ploughing the lowest (muddy) paddy, farmer behind
  const bp = inBand(0, 21, 0.5);
  const bg = new THREE.Group();
  bg.add(buffalo());
  bg.add(plough());
  bg.add(place(worker({ shirt: PALETTE.plasterBlue, bend: 20 }), { x: -3.2, ry: 90, s: 1.15 }));
  g.add(place(bg, { x: bp.x, y: level(0) - 0.2, z: bp.z, ry: -112 }));

  // farmstead on the flat corner
  const thatch = surface('shingles', PALETTE.thatch, { size: 2 });
  const walls = surface('planks', '#c9a46a', { size: 2 });
  g.add(place(hut({ thatch, walls }), { x: 6.8, y: y0, z: 6.2, ry: -25 }));
  g.add(place(patch(1.3, 4.2, 'dirt'), { x: 3.4, y: y0, z: 8.6, ry: 70 }));
  g.add(place(sheaf(), { x: 9.3, y: y0, z: 9.3 }));
  g.add(place(sheaf(), { x: 8.4, y: y0, z: 9.5 }));
  g.add(place(sheaf(), { x: 9.4, y: y0, z: 8.4 }));
  g.add(place(cylinder(0.3, 0.22, 0.4, PALETTE.woodLight, 8), { x: 2.0, y: y0, z: 9.5 }));
  g.add(place(cylinder(0.3, 0.22, 0.4, PALETTE.woodLight, 8), { x: 2.6, y: y0, z: 9.2 }));
  g.add(place(tree({ kind: 'palm', h: 5.5, seed: 4, color: PALETTE.foliageLight }), { x: 7.6, y: y0, z: 1.2 }));
  g.add(place(bamboo({ h: 4.5, seed: 7 }), { x: 0.4, y: y0, z: 9.2 }));
  // drying rack
  const rack = new THREE.Group();
  for (const x of [-1, 1]) rack.add(place(box(0.1, 1.3, 0.1, PALETTE.woodDark), { x }));
  rack.add(place(box(2.2, 0.08, 0.08, PALETTE.woodDark), { y: 1.25 }));
  for (let i = 0; i < 5; i++) rack.add(place(cone(0.2, 0.75, mat(PALETTE.hay), 6), { x: -0.8 + i * 0.4, y: 1.3, rx: 180 }));
  g.add(place(rack, { x: 9.3, y: y0, z: 3.0, ry: 90 }));

  // stone steps up the risers, one flight per terrace
  const stone = mat(PALETTE.stoneDark);
  for (let k = 0; k < RADII.length; k++) {
    const a = THREE.MathUtils.degToRad(57);
    const r = radius(k, a) + 0.25;
    const x = HILL[0] + Math.cos(a) * r, z = HILL[1] + Math.sin(a) * r;
    if (Math.abs(x) > HW - 0.6 || Math.abs(z) > HD - 0.6) continue;
    g.add(place(box(0.75, STEP / 2, 0.5, stone), { x, y: y0 + k * STEP, z, ry: -57 + 90 }));
  }
  return g;
}

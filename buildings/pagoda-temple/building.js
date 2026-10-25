import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, sphere, place, stairs, tree, mat, surface,
} from '../../src/lib/index.js';
import {
  RED, RED_DARK, GOLD, GOLD_TRIM, panel, latticeMat, plaqueMat, eaveRoof,
  stoneLion, incenseBurner, stoneLantern, redLantern,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Five-tier pagoda at the back right, a double-eaved temple hall at the back
// left, and a paved courtyard in front with a gate, guardian lions and an
// incense burner, all inside a low red compound wall.

const FACES = [
  { ry: 0, dx: 0, dz: 1 },
  { ry: 90, dx: 1, dz: 0 },
  { ry: 180, dx: 0, dz: -1 },
  { ry: -90, dx: -1, dz: 0 },
];

// Something on every face of a square body of half-width hw.
function onFaces(g, hw, make, { y = 0, out = 0, faces = FACES } = {}) {
  for (const f of faces) {
    g.add(place(make(f), { x: f.dx * (hw + out), y, z: f.dz * (hw + out), ry: f.ry }));
  }
}

function pagoda() {
  const g = new THREE.Group();
  const red = mat(RED);
  const redD = mat(RED_DARK);
  const gold = mat(GOLD_TRIM, { roughness: 0.5, metalness: 0.3 });
  const tiles = surface('roofTiles', GOLD, { size: 0.8 });
  const stone = mat(PALETTE.stone);
  const win = latticeMat('window');
  const doorM = latticeMat('door');

  // stone plinth with front steps
  g.add(box(4.5, 0.45, 4.5, mat(PALETTE.stoneDark)));
  g.add(place(box(4.3, 0.08, 4.3, stone), { y: 0.45 }));
  g.add(place(stairs({ w: 1.4, h: 0.5, d: 0.6, steps: 3, material: stone }), { y: 0, z: 2.55 }));

  const widths = [3.0, 2.6, 2.25, 1.9, 1.55];
  const heights = [2.3, 1.55, 1.45, 1.35, 1.25];
  let y = 0.53;
  for (let i = 0; i < 5; i++) {
    const bw = widths[i], bh = heights[i], hw = bw / 2;
    // red body, darker corner posts, gold bracket band on top
    g.add(place(box(bw, bh, bw, red), { y }));
    for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
      g.add(place(box(0.2, bh, 0.2, redD), { x: sx * (hw - 0.04), y, z: sz * (hw - 0.04) }));
    }
    g.add(place(box(bw + 0.12, 0.22, bw + 0.12, gold), { y: y + bh - 0.22 }));
    if (i === 0) {
      onFaces(g, hw, (f) => panel(0.95, 1.6, 0.06, f.ry === 0 ? doorM : win), { y });
      onFaces(g, hw, () => panel(0.5, 0.75, 0.05, win), { y: y + 0.8, faces: FACES.map((f) => ({ ...f })) });
    } else {
      onFaces(g, hw, () => panel(0.6, bh * 0.55, 0.06, win), { y: y + 0.2 });
      // little balcony railing round each upper storey
      g.add(place(box(bw + 0.5, 0.08, bw + 0.5, redD), { y: y }));
      for (const f of FACES) {
        g.add(place(box(bw + 0.5, 0.06, 0.05, gold), { x: f.dx * (hw + 0.22), y: y + 0.4, z: f.dz * (hw + 0.22), ry: f.ry }));
        for (const s of [-1, -0.5, 0, 0.5, 1]) {
          const along = s * (hw + 0.2);
          g.add(place(box(0.05, 0.4, 0.05, redD), { x: f.dx * (hw + 0.22) + (f.dz !== 0 ? along : 0), y, z: f.dz * (hw + 0.22) + (f.dx !== 0 ? along : 0) }));
        }
      }
    }
    y += bh;
    const top = i === 4;
    const next = top ? 0.3 : widths[i + 1] + 0.1;
    const rh = top ? 1.2 : 0.7;
    g.add(place(eaveRoof({
      w: bw, d: bw, h: rh, overhang: 0.85 - i * 0.05, innerW: next, innerD: next,
      lift: 0.45 - i * 0.03, flare: 0.25, tiles,
    }), { y: y - 0.02 }));
    y += rh - 0.06;
  }

  // gilded finial: lotus base, nine rings, jewel
  const goldM = mat(GOLD_TRIM, { roughness: 0.35, metalness: 0.55 });
  g.add(place(cylinder(0.32, 0.18, 0.25, goldM, 8), { y }));
  g.add(place(sphere(0.26, goldM, 8), { y: y + 0.15, s: [1, 0.7, 1] }));
  g.add(place(cylinder(0.05, 0.06, 2.6, goldM, 6), { y: y + 0.3 }));
  for (let k = 0; k < 9; k++) {
    const r = 0.26 - k * 0.015;
    g.add(place(cylinder(r, r, 0.07, goldM, 10), { y: y + 0.55 + k * 0.17 }));
  }
  g.add(place(sphere(0.16, goldM, 8), { y: y + 2.2 }));
  g.add(place(sphere(0.1, goldM, 8), { y: y + 2.55, s: [1, 1.5, 1] }));
  return g;
}

function hall() {
  const g = new THREE.Group();
  const red = mat(RED);
  const redD = mat(RED_DARK);
  const gold = mat(GOLD_TRIM, { roughness: 0.5, metalness: 0.3 });
  const tiles = surface('roofTiles', GOLD, { size: 0.8 });
  const stone = mat(PALETTE.stone);
  const win = latticeMat('window');
  const doorM = latticeMat('door');

  // raised stone platform + steps
  g.add(box(4.5, 0.45, 4.6, mat(PALETTE.stoneDark)));
  g.add(place(box(4.3, 0.06, 4.4, stone), { y: 0.45 }));
  g.add(place(stairs({ w: 1.6, h: 0.5, d: 0.7, steps: 3, material: stone }), { y: 0, z: 2.65 }));
  const y = 0.51;

  // hall body set back behind a columned veranda
  const bw = 3.4, bd = 2.9, bz = -0.45, bh = 2.5;
  g.add(place(box(bw, bh, bd, red), { y, z: bz }));
  g.add(place(box(bw + 0.1, 0.25, bd + 0.1, gold), { y: y + bh - 0.25, z: bz }));
  const fz = bz + bd / 2;
  for (const x of [-1.0, 0, 1.0]) {
    g.add(place(panel(0.8, 1.9, 0.06, x === 0 ? doorM : win), { x, y, z: fz }));
  }
  for (const z of [bz - 0.6, bz + 0.6]) {
    g.add(place(panel(0.7, 1.0, 0.06, win), { x: bw / 2, y: y + 0.7, z, ry: 90 }));
    g.add(place(panel(0.7, 1.0, 0.06, win), { x: -bw / 2, y: y + 0.7, z, ry: -90 }));
  }
  // veranda columns + gold beam
  const cz = fz + 0.85;
  for (const x of [-1.6, -0.55, 0.55, 1.6]) {
    g.add(place(cylinder(0.11, 0.12, bh, redD, 8), { x, y, z: cz }));
    g.add(place(box(0.32, 0.12, 0.32, stone), { x, y, z: cz }));
  }
  g.add(place(box(bw + 0.1, 0.25, 0.2, gold), { y: y + bh - 0.25, z: cz }));
  // hanging red lanterns
  for (const x of [-1.07, 1.07]) g.add(place(redLantern(), { x, y: y + bh - 0.75, z: cz }));

  // lower (skirt) roof over body + veranda
  const rw = bw, rd = bd + 0.9, rz = bz + 0.45;
  g.add(place(eaveRoof({ w: rw, d: rd, h: 0.65, overhang: 0.6, innerW: 2.5, innerD: 2.5, lift: 0.4, flare: 0.22, tiles }), { x: 0, y: y + bh - 0.02, z: rz }));
  // clerestory + upper hip roof with a ridge
  const uy = y + bh + 0.6;
  g.add(place(box(2.4, 0.65, 2.4, red), { y: uy, z: rz }));
  g.add(place(box(2.5, 0.18, 2.5, gold), { y: uy + 0.47, z: rz }));
  g.add(place(panel(1.2, 0.4, 0.04, plaqueMat()), { y: uy + 0.05, z: rz + 1.2 }));
  const ry = uy + 0.63;
  g.add(place(eaveRoof({ w: 2.4, d: 2.4, h: 1.25, overhang: 0.65, innerW: 1.5, innerD: 0.1, lift: 0.38, flare: 0.2, tiles }), { y: ry, z: rz }));
  // gold ridge with upturned fish-tail ends and a central pearl
  const goldM = mat(GOLD_TRIM, { roughness: 0.35, metalness: 0.55 });
  g.add(place(box(1.7, 0.22, 0.18, goldM), { y: ry + 1.2, z: rz }));
  for (const s of [-1, 1]) {
    g.add(place(box(0.18, 0.5, 0.2, goldM), { x: s * 0.85, y: ry + 1.2, z: rz, rz: -s * 18 }));
  }
  g.add(place(sphere(0.16, goldM, 8), { y: ry + 1.38, z: rz }));
  return g;
}

function gate() {
  const g = new THREE.Group();
  const redD = mat(RED_DARK);
  const red = mat(RED);
  const gold = mat(GOLD_TRIM, { roughness: 0.5, metalness: 0.3 });
  for (const x of [-1.05, 1.05]) {
    g.add(place(box(0.42, 0.35, 0.42, mat(PALETTE.stoneDark)), { x }));
    g.add(place(box(0.26, 2.9, 0.26, red), { x }));
  }
  g.add(place(box(2.7, 0.22, 0.3, redD), { y: 2.25 }));
  g.add(place(box(2.5, 0.28, 0.3, gold), { y: 2.6 }));
  g.add(place(panel(0.9, 0.45, 0.06, plaqueMat()), { y: 2.0, z: 0.14 }));
  g.add(place(eaveRoof({ w: 2.5, d: 0.4, h: 0.45, overhang: 0.3, innerW: 2.2, innerD: 0.05, lift: 0.25, flare: 0.12, rows: 3, segs: 6, trimH: 0.1, tiles: surface('roofTiles', GOLD, { size: 0.6 }) }), { y: 2.88 }));
  g.add(place(box(2.4, 0.12, 0.1, gold), { y: 3.3 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const H = TILE / 2;
  g.add(lot([1, 1], 'grass'));

  // stone-paved courtyard and approach path
  g.add(place(patch(9.4, 4.0, 'paved'), { y: y0, z: 2.6 }));
  g.add(place(patch(2.2, 1.0, 'cobbles'), { y: y0, z: 4.6 }));

  // buildings
  g.add(place(pagoda(), { x: 2.45, y: y0, z: -2.3 }));
  g.add(place(hall(), { x: -2.6, y: y0, z: -2.05 }));

  // courtyard: incense burner, guardian lions at the gate, stone lanterns
  g.add(place(incenseBurner(), { x: -0.1, y: y0 + 0.05, z: 2.2 }));
  g.add(place(stoneLion({ mirror: false }), { x: -1.75, y: y0 + 0.05, z: 3.9 }));
  g.add(place(stoneLion({ mirror: true }), { x: 1.75, y: y0 + 0.05, z: 3.9 }));
  for (const x of [-3.9, 3.9]) g.add(place(stoneLantern(), { x, y: y0 + 0.05, z: 2.4 }));

  // compound wall: red with a gold tiled coping, gap for the gate at the front
  const wallM = mat(RED);
  const capM = surface('roofTiles', GOLD, { size: 0.6 });
  const baseM = mat(PALETTE.stoneDark);
  const wall = (w, x, z, ry) => {
    g.add(place(box(w, 0.2, 0.34, baseM), { x, y: y0, z, ry }));
    g.add(place(box(w, 0.7, 0.26, wallM), { x, y: y0 + 0.2, z, ry }));
    g.add(place(box(w + 0.02, 0.12, 0.46, capM), { x, y: y0 + 0.9, z, ry }));
  };
  const e = H - 0.2;
  wall(3.6, -3.0, e, 0);
  wall(3.6, 3.0, e, 0);
  wall(TILE - 0.4, 0, -e, 0);
  wall(TILE - 0.4, -e, 0, 90);
  wall(TILE - 0.4, e, 0, 90);
  g.add(place(gate(), { y: y0, z: e - 0.25 }));

  // greenery: pines and shrubs in the courtyard corners
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 8, color: PALETTE.foliageDark }), { x: -4.0, y: y0, z: 4.0 }));
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 9, color: PALETTE.foliageDark }), { x: 4.0, y: y0, z: 4.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: -2.9, y: y0, z: 4.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 4 }), { x: 2.9, y: y0, z: 4.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 5, color: '#c46aa0' }), { x: -4.1, y: y0, z: 1.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 6, color: '#c46aa0' }), { x: 4.1, y: y0, z: 0.9 }));
  return g;
}

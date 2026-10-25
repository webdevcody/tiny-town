import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, door, box, place, surface, mat, scatter, tree, cylinder, chimney,
} from '../../src/lib/index.js';
import {
  HIVE_COLOURS, flatSign, meadowMaterial, flowerClump, lavender, hive, skep, beekeeper, jar, rng,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Left: timber honey house with a gable sign, skeps and a honey stall by the gate.
// Right: three rows of colourful hives in a wildflower meadow, tended by a beekeeper.
export default function build() {
  const y0 = LOT_HEIGHT;
  const half = TILE / 2;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));
  g.add(place(box(TILE - 0.3, 0.03, TILE - 0.3, meadowMaterial(2.5)), { y: y0 }));
  const y = y0 + 0.03;

  // --- honey house ---------------------------------------------------------
  const hx = -2.75, hz = -2.45, hw = 3.6, hd = 3.8;
  const wall = '#e9c27a';
  g.add(place(box(hw + 0.3, 0.25, hd + 0.3, mat(PALETTE.stone)), { x: hx, y, z: hz }));
  g.add(place(facadeBlock({
    w: hw, d: hd, h: FLOOR, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window,
    shutters: '#3f7a3a', windowW: 0.45, windowH: 0.5, bay: 1.8, seed: 4, blank: ['front'],
  }), { x: hx, y: y + 0.25, z: hz }));
  // planked front wall overlay
  g.add(place(box(hw, FLOOR, 0.04, surface('planks', wall, { size: 1.2 })), { x: hx, y: y + 0.25, z: hz + hd / 2 }));
  const roofY = y + 0.25 + FLOOR;
  g.add(place(gableRoof({ w: hw, d: hd, h: 1.8, overhang: 0.4, ridge: 'z', material: surface('roofTiles', PALETTE.roofRed, { size: 1.6 }), gableMaterial: wall }), { x: hx, y: roofY, z: hz }));
  g.add(place(chimney({ w: 0.5, d: 0.5, h: 1.9, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: hx + 0.9, y: roofY + 0.3, z: hz - 1.0 }));
  // door, window, sign on the gable
  const doorX = hx + 0.7;
  g.add(place(door({ w: 1.1, h: 2.2, color: '#3f7a3a', frame: PALETTE.white }), { x: doorX, y: y + 0.25, z: hz + hd / 2 }));
  g.add(place(box(1.0, 0.9, 0.08, mat(PALETTE.white)), { x: hx - 0.95, y: y + 1.35, z: hz + hd / 2 + 0.02 }));
  g.add(place(box(0.8, 0.7, 0.1, mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 })), { x: hx - 0.95, y: y + 1.45, z: hz + hd / 2 + 0.03 }));
  g.add(place(box(1.1, 0.12, 0.3, mat('#3f7a3a')), { x: hx - 0.95, y: y + 1.25, z: hz + hd / 2 + 0.12 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.25, 0.14, 0.25, mat(['#e84a5f', '#f7d43a', '#b07cd8'][i])), { x: hx - 1.25 + i * 0.3, y: y + 1.31, z: hz + hd / 2 + 0.14 }));
  g.add(place(flatSign({ text: 'HONEY', w: 2.0, h: 0.62, bg: '#f2b51c', fg: '#4a2a08', border: '#4a2a08' }), { x: hx, y: roofY + 0.04, z: hz + hd / 2 + 0.03 }));
  // porch canopy over door
  g.add(place(box(1.6, 0.1, 0.9, mat(PALETTE.roofRed)), { x: doorX, y: y + 2.65, z: hz + hd / 2 + 0.45, rx: 10 }));
  // side lean-to with extractor drum and stacked spare boxes
  g.add(place(box(1.0, 0.04, 2.4, surface('corrugated', PALETTE.steel, { size: 1 })), { x: hx + hw / 2 + 0.5, y: y + 2.1, z: hz - 0.3, rz: -12 }));
  for (const dz of [-1.4, 0.8]) g.add(place(box(0.08, 2.0, 0.08, mat(PALETTE.woodDark)), { x: hx + hw / 2 + 0.95, y, z: hz + dz }));
  g.add(place(cylinder(0.32, 0.32, 0.8, mat(PALETTE.steelLight, { metalness: 0.6, roughness: 0.35 }), 12), { x: hx + hw / 2 + 0.45, y, z: hz - 0.9 }));
  g.add(place(box(0.5, 0.06, 0.06, mat(PALETTE.darkGrey)), { x: hx + hw / 2 + 0.45, y: y + 0.82, z: hz - 0.9 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.6, 0.28, 0.5, mat(['#ffffff', '#f2c230', '#6fb7e0'][i])), { x: hx + hw / 2 + 0.45, y: y + i * 0.28, z: hz + 0.2 }));

  // gravel path from gate to door
  g.add(place(patch(1.2, half - (hz + hd / 2) - 0.1, 'gravel'), { x: doorX, y, z: (half + hz + hd / 2) / 2 - 0.05 }));
  g.add(place(patch(1.6, 0.9, 'gravel'), { x: doorX, y, z: hz + hd / 2 + 0.45 }));

  // skeps on a plank shelf left of the path
  const sx = -4.0, sz = 0.35;
  g.add(place(box(1.5, 0.06, 0.6, mat(PALETTE.wood)), { x: sx, y: y + 0.45, z: sz }));
  for (const dx of [-0.6, 0.6]) g.add(place(box(0.1, 0.45, 0.5, mat(PALETTE.woodDark)), { x: sx + dx, y, z: sz }));
  g.add(place(skep(0.95), { x: sx - 0.38, y: y + 0.51, z: sz }));
  g.add(place(skep(0.95), { x: sx + 0.38, y: y + 0.51, z: sz }));

  // honey stall at the front corner
  const tx = -4.0, tz = 3.3;
  const wood = mat(PALETTE.wood);
  g.add(place(box(1.4, 0.08, 0.7, wood), { x: tx, y: y + 0.8, z: tz }));
  g.add(place(box(1.4, 0.75, 0.04, mat(PALETTE.woodDark)), { x: tx, y: y + 0.05, z: tz + 0.33 }));
  for (const dx of [-0.65, 0.65]) {
    g.add(place(box(0.08, 2.1, 0.08, wood), { x: tx + dx, y, z: tz - 0.3 }));
    g.add(place(box(0.08, 0.8, 0.08, wood), { x: tx + dx, y, z: tz + 0.3 }));
  }
  g.add(place(box(1.6, 0.06, 1.0, surface('stripes', PALETTE.yellow, { color2: PALETTE.white, size: 0.5 })), { x: tx, y: y + 1.9, z: tz + 0.1, rx: 18 }));
  for (let i = 0; i < 6; i++) g.add(place(jar(1.1, i % 2 ? PALETTE.red : '#3f7a3a'), { x: tx - 0.5 + i * 0.2, y: y + 0.88, z: tz + (i % 2 ? 0.12 : -0.12) }));
  g.add(place(flatSign({ text: 'RAW HONEY', w: 1.3, h: 0.42, depth: 0.04, bg: PALETTE.white, fg: '#a5600a', border: '#a5600a' }), { x: tx, y: y + 0.22, z: tz + 0.37 }));

  // --- hive yard -----------------------------------------------------------
  const r = rng(31);
  const rows = [-3.5, -1.15, 1.2];
  const xs = [0.55, 1.65, 2.75, 3.85];
  let k = 0;
  rows.forEach((rz, ri) => {
    // long plank stand per row
    g.add(place(box(4.3, 0.06, 0.3, mat(PALETTE.woodDark)), { x: 2.2, y, z: rz + 0.36 }));
    xs.forEach((hx2, hi) => {
      const n = 2 + ((ri + hi * 2) % 2);
      const colours = [];
      for (let c = 0; c < n; c++) colours.push(HIVE_COLOURS[(k * 3 + c * 5) % HIVE_COLOURS.length]);
      const isOpen = ri === 1 && hi === 1;
      const roofKind = (ri + hi) % 3 === 0 ? 'gable' : 'flat';
      g.add(place(hive({ colours, roof: roofKind, roofColour: roofKind === 'gable' ? '#ffffff' : '#c9ccd1', open: isOpen }), { x: hx2, y, z: rz, ry: (r() - 0.5) * 6 }));
      k++;
    });
  });
  // open hive's lid on the ground, beekeeper working it from behind
  g.add(place(box(0.82, 0.12, 0.72, mat('#c9ccd1', { metalness: 0.6, roughness: 0.5 })), { x: 1.1, y, z: -0.15, ry: 20 }));
  g.add(place(beekeeper({ holding: 'frame' }), { x: 1.65, y, z: -2.2, ry: 0 }));
  g.add(place(beekeeper({ holding: 'smoker' }), { x: 4.25, y, z: 2.55, ry: -140 }));

  // water trough for the bees
  g.add(place(box(0.9, 0.35, 0.5, mat(PALETTE.woodDark)), { x: -0.4, y, z: 3.55 }));
  g.add(place(box(0.78, 0.04, 0.38, mat(PALETTE.water, { roughness: 0.2, metalness: 0.2 })), { x: -0.4, y: y + 0.33, z: 3.55 }));

  // --- planting --------------------------------------------------------------
  const hiveArea = { x: 2.2, z: -1.15, w: 4.9, d: 6.0 };
  const avoid = [
    { x: hx + 0.4, z: hz, w: hw + 2.2, d: hd + 1.4 },
    hiveArea,
    { x: doorX, z: 2.3, w: 1.8, d: 6.0 },
    { x: sx, z: sz, w: 1.9, d: 1.0 },
    { x: tx, z: tz, w: 1.9, d: 1.4 },
    { x: -0.4, z: 3.55, w: 1.3, d: 0.9 },
    { x: 4.25, z: 2.55, w: 0.9, d: 0.9 },
  ];
  g.add(place(scatter({ w: TILE - 0.9, d: TILE - 0.9, count: 70, seed: 9, minGap: 0.42, avoid, make: (rr) => flowerClump(rr, rr.range(0.9, 1.4)) }), { y }));
  // lavender hedge along the front between the path and the hive yard
  for (let i = 0; i < 5; i++) g.add(place(lavender(r, 1.1), { x: 0.6 + i * 0.85, y, z: 3.85 }));
  for (let i = 0; i < 3; i++) g.add(place(lavender(r, 1.0), { x: -0.55, y, z: -0.6 + i * 1.0 }));
  // a flowering tree behind the hives and a couple of shrubs
  g.add(place(tree({ kind: 'round', h: 4.0, seed: 12, color: '#f2a7c3' }), { x: -0.45, y, z: -3.75 }));
  g.add(place(lavender(r, 1.1), { x: -4.3, y, z: 1.6 }));

  // --- rustic post-and-rail fence with a gate gap at the path -----------------
  const fm = mat(PALETTE.wood);
  const fe = half - 0.2;
  const rail = (x1, z1, x2, z2) => {
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = Math.atan2(-(z2 - z1), x2 - x1) * 180 / Math.PI;
    const n = Math.max(1, Math.round(len / 1.6));
    for (let i = 0; i <= n; i++) {
      const t = i / n;
      g.add(place(box(0.12, 0.95, 0.12, mat(PALETTE.woodDark)), { x: x1 + (x2 - x1) * t, y, z: z1 + (z2 - z1) * t }));
    }
    for (const hy of [0.4, 0.78]) g.add(place(box(len, 0.07, 0.06, fm), { x: (x1 + x2) / 2, y: y + hy, z: (z1 + z2) / 2, ry: ang }));
  };
  rail(-fe, fe, doorX - 0.75, fe);
  rail(doorX + 0.75, fe, fe, fe);
  rail(fe, fe, fe, -fe);
  rail(-fe, fe, -fe, -fe);
  rail(-fe, -fe, fe, -fe);
  // gate sign arch posts
  for (const dx of [-0.75, 0.75]) g.add(place(box(0.14, 2.3, 0.14, mat(PALETTE.woodDark)), { x: doorX + dx, y, z: fe }));
  g.add(place(box(1.7, 0.1, 0.14, mat(PALETTE.woodDark)), { x: doorX, y: y + 2.3, z: fe }));
  g.add(place(flatSign({ text: 'APIARY', w: 1.4, h: 0.4, bg: '#f2b51c', fg: '#4a2a08', double: true }), { x: doorX, y: y + 1.85, z: fe }));

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, gableRoof, surface, mat, textured,
  canvasTexture, ShapeBuilder, tree, bench, streetLamp, sign, rng, stairs,
} from '../../src/lib/index.js';

// Pointed (lancet) slab of thickness t, base centred at the origin, sticking out to +z.
function lancet(w, h, t, material) {
  const hw = w / 2, hs = h - w * 0.8;
  const front = [[-hw, 0], [hw, 0], [hw, hs], [0, h], [-hw, hs]];
  const b = new ShapeBuilder();
  b.poly(front.map(([x, y]) => [x, y, t]), 0);
  b.poly(front.slice().reverse().map(([x, y]) => [x, y, 0]), 0);
  for (let i = 0; i < front.length; i++) {
    const [x1, y1] = front[i];
    const [x2, y2] = front[(i + 1) % front.length];
    b.quad([x1, y1, 0], [x2, y2, 0], [x2, y2, t], [x1, y1, t], 0);
  }
  return new THREE.Mesh(b.build(), material);
}

// Stained glass: small coloured panes with lead lines, 1 m per repeat.
function stainedGlass() {
  const tex = canvasTexture(32, 32, (ctx, w, h) => {
    const cols = ['#2f4f8f', '#8f2f3a', '#c9a23a', '#3f7a4f', '#2f4f8f', '#5a3f8a'];
    const n = 4;
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
      ctx.fillStyle = cols[(i * 3 + j * 2) % cols.length];
      ctx.fillRect((i * w) / n, (j * h) / n, w / n, h / n);
    }
    ctx.strokeStyle = '#1c1c22';
    ctx.lineWidth = 2;
    for (let i = 0; i <= n; i++) {
      ctx.beginPath(); ctx.moveTo((i * w) / n, 0); ctx.lineTo((i * w) / n, h); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i * h) / n); ctx.lineTo(w, (i * h) / n); ctx.stroke();
    }
  }, { key: 'parish-church:stained-glass' });
  return textured(tex, { roughness: 0.3, metalness: 0.2, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.12 });
}

// Lancet window: pale stone surround + glass, sticking out to +z.
function churchWindow(w, h, glassMat, frameMat) {
  return group(
    place(lancet(w + 0.3, h + 0.25, 0.08, frameMat), { y: -0.12 }),
    lancet(w, h, 0.13, glassMat),
  );
}

// Put copies of make() on the four faces of a box centred at (cx, cz) with half sizes hw, hd.
function onFaces(make, cx, cz, hw, hd, y, offsets = [0], faces = ['front', 'back', 'left', 'right']) {
  const g = new THREE.Group();
  for (const o of offsets) {
    if (faces.includes('front')) g.add(place(make(), { x: cx + o, y, z: cz + hd }));
    if (faces.includes('back')) g.add(place(make(), { x: cx - o, y, z: cz - hd, ry: 180 }));
    if (faces.includes('right')) g.add(place(make(), { x: cx + hw, y, z: cz - o, ry: 90 }));
    if (faces.includes('left')) g.add(place(make(), { x: cx - hw, y, z: cz + o, ry: -90 }));
  }
  return g;
}

// 1x2 tiles (10 x 20 m). Front (street) faces +z: west tower with spire at the front,
// nave running back to a lower chancel, graveyard on the +x side.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const r = rng(37);
  g.add(lot([1, 2], 'grass'));

  const stone = surface('brick', PALETTE.stone, { size: 1.6 });
  const stoneDark = mat(PALETTE.stoneDark);
  const stoneLight = mat(PALETTE.offWhite);
  const slate = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
  const glassMat = stainedGlass();
  const louvre = mat('#2a2622');
  const gold = mat(PALETTE.glassGold, { metalness: 0.6, roughness: 0.35 });

  // ---- nave -----------------------------------------------------------------
  const NX = -1.5, NW = 5.0, NZ = -1.4, ND = 9.6, NH = 5.4;
  g.add(place(box(NW + 0.3, 0.5, ND + 0.3, stoneDark), { x: NX, y: y0, z: NZ }));
  g.add(place(box(NW, NH, ND, stone), { x: NX, y: y0, z: NZ }));
  g.add(place(box(NW + 0.2, 0.25, ND + 0.2, stoneDark), { x: NX, y: y0 + NH - 0.25, z: NZ }));
  g.add(place(gableRoof({ w: NW, d: ND, h: 3.9, overhang: 0.3, ridge: 'z', material: slate, gableMaterial: stone }), { x: NX, y: y0 + NH, z: NZ }));
  g.add(place(box(0.2, 0.2, ND + 0.6, stoneDark), { x: NX, y: y0 + NH + 3.85, z: NZ }));

  // side windows + buttresses
  const winZ = [1.9, -0.5, -2.9, -5.1];
  for (const side of [-1, 1]) {
    const wx = NX + side * NW / 2;
    for (const z of winZ) {
      g.add(place(churchWindow(0.9, 2.7, glassMat, stoneLight), { x: wx, y: y0 + 1.7, z, ry: side * 90 }));
    }
    for (const z of [3.1, 0.7, -1.7, -4.0, -6.0]) {
      g.add(place(box(0.65, 3.4, 0.5, stone), { x: wx + side * 0.3, y: y0, z }));
      g.add(place(box(0.4, 1.3, 0.5, stone), { x: wx + side * 0.18, y: y0 + 3.4, z }));
      g.add(place(box(0.7, 0.15, 0.6, stoneDark), { x: wx + side * 0.3, y: y0 + 3.4, z }));
    }
  }
  // small priest's door on the north side
  g.add(place(lancet(1.0, 2.3, 0.1, stoneLight), { x: NX - NW / 2, y: y0 + 0.3, z: 0.7 - 1.2, ry: -90 }));
  g.add(place(lancet(0.75, 2.0, 0.14, mat(PALETTE.woodDark)), { x: NX - NW / 2, y: y0 + 0.3, z: 0.7 - 1.2, ry: -90 }));

  // ---- chancel --------------------------------------------------------------
  const CW = 3.6, CD = 2.8, CZ = NZ - ND / 2 - CD / 2, CH = 4.4;
  g.add(place(box(CW + 0.3, 0.5, CD + 0.3, stoneDark), { x: NX, y: y0, z: CZ }));
  g.add(place(box(CW, CH, CD, stone), { x: NX, y: y0, z: CZ }));
  g.add(place(gableRoof({ w: CW, d: CD, h: 2.9, overhang: 0.25, ridge: 'z', material: slate, gableMaterial: stone }), { x: NX, y: y0 + CH, z: CZ }));
  g.add(place(churchWindow(1.5, 3.0, glassMat, stoneLight), { x: NX, y: y0 + 1.1, z: CZ - CD / 2, ry: 180 }));
  for (const side of [-1, 1]) {
    g.add(place(churchWindow(0.7, 2.2, glassMat, stoneLight), { x: NX + side * CW / 2, y: y0 + 1.4, z: CZ, ry: side * 90 }));
  }
  // rose window in the nave's east gable, a stone cross on the chancel gable
  g.add(place(cylinder(0.75, 0.75, 0.1, stoneLight, 12), { x: NX, y: y0 + NH + 1.4, z: NZ - ND / 2, rx: -90 }));
  g.add(place(cylinder(0.6, 0.6, 0.14, glassMat, 12), { x: NX, y: y0 + NH + 1.4, z: NZ - ND / 2, rx: -90 }));
  g.add(place(box(0.15, 0.9, 0.15, stoneLight), { x: NX, y: y0 + CH + 2.8, z: CZ - CD / 2 + 0.1 }));
  g.add(place(box(0.55, 0.15, 0.15, stoneLight), { x: NX, y: y0 + CH + 3.35, z: CZ - CD / 2 + 0.1 }));

  // ---- west tower + spire ---------------------------------------------------
  const TS = 3.4, TZ = NZ + ND / 2 + TS / 2, TH = 12.5;
  g.add(place(box(TS + 0.3, 0.6, TS + 0.3, stoneDark), { x: NX, y: y0, z: TZ }));
  g.add(place(box(TS, TH, TS, stone), { x: NX, y: y0, z: TZ }));
  for (const yb of [5.6, 9.0]) g.add(place(box(TS + 0.2, 0.25, TS + 0.2, stoneDark), { x: NX, y: y0 + yb, z: TZ }));
  // corner buttresses (stepped)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const bx = NX + sx * (TS / 2 + 0.05), bz = TZ + sz * (TS / 2 + 0.05);
    if (sz < 0) continue; // the back corners meet the nave
    g.add(place(box(0.7, 4.5, 0.7, stone), { x: bx, y: y0, z: bz }));
    g.add(place(box(0.5, 3.0, 0.5, stone), { x: bx, y: y0 + 4.5, z: bz }));
    g.add(place(box(0.8, 0.15, 0.8, stoneDark), { x: bx, y: y0 + 4.5, z: bz }));
  }
  // belfry: paired louvred lancets on all sides
  g.add(onFaces(() => lancet(0.65, 1.9, 0.1, louvre), NX, TZ, TS / 2, TS / 2, y0 + 9.6, [-0.5, 0.5]));
  g.add(onFaces(() => place(box(0.65, 0.06, 0.16, stoneDark), { y: 0 }), NX, TZ, TS / 2, TS / 2, y0 + 10.2, [-0.5, 0.5]));
  g.add(onFaces(() => place(box(0.65, 0.06, 0.16, stoneDark), { y: 0 }), NX, TZ, TS / 2, TS / 2, y0 + 10.7, [-0.5, 0.5]));
  // clock faces on front and sides
  const clock = () => group(
    place(cylinder(0.72, 0.72, 0.08, stoneDark, 16), { rx: 90 }),
    place(cylinder(0.6, 0.6, 0.12, mat(PALETTE.white), 16), { rx: 90 }),
    place(box(0.08, 0.45, 0.05, mat(PALETTE.black)), { y: -0.03, z: 0.13 }),
    place(box(0.32, 0.07, 0.05, mat(PALETTE.black)), { x: 0.14, y: 0.0, z: 0.13 }),
  );
  g.add(onFaces(clock, NX, TZ, TS / 2, TS / 2, y0 + 7.4, [0], ['front', 'left', 'right']));
  // west door (pointed) with steps and a window above
  g.add(place(lancet(1.9, 3.3, 0.12, stoneLight), { x: NX, y: y0 + 0.5, z: TZ + TS / 2 }));
  g.add(place(lancet(1.4, 2.9, 0.18, mat(PALETTE.woodDark)), { x: NX, y: y0 + 0.5, z: TZ + TS / 2 }));
  g.add(place(box(0.05, 2.0, 0.2, mat(PALETTE.black)), { x: NX, y: y0 + 0.5, z: TZ + TS / 2 + 0.02 }));
  g.add(place(stairs({ w: 2.2, h: 0.5, d: 1.0, steps: 2, material: stoneDark }), { x: NX, y: y0, z: TZ + TS / 2 + 0.55 }));
  g.add(place(churchWindow(0.7, 1.5, glassMat, stoneLight), { x: NX, y: y0 + 4.3, z: TZ + TS / 2 }));
  // parapet with corner pinnacles
  const PY = y0 + TH;
  g.add(place(box(TS + 0.3, 0.3, TS + 0.3, stoneDark), { x: NX, y: PY, z: TZ }));
  for (const [w, d, x, z] of [[TS + 0.3, 0.3, 0, TS / 2], [TS + 0.3, 0.3, 0, -TS / 2], [0.3, TS + 0.3, TS / 2, 0], [0.3, TS + 0.3, -TS / 2, 0]]) {
    g.add(place(box(w, 0.6, d, stone), { x: NX + x, y: PY + 0.3, z: TZ + z }));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const px = NX + sx * TS / 2, pz = TZ + sz * TS / 2;
    g.add(place(box(0.45, 0.9, 0.45, stone), { x: px, y: PY + 0.3, z: pz }));
    g.add(place(cone(0.3, 1.6, stoneLight, 4), { x: px, y: PY + 1.2, z: pz, ry: 45 }));
  }
  // octagonal broach spire
  const SH = 11.5;
  g.add(place(cone(1.55, SH, slate, 8), { x: NX, y: PY + 0.3, z: TZ, ry: 22.5 }));
  // little lucarnes (spire lights) on the four faces
  g.add(onFaces(() => group(
    place(box(0.5, 0.8, 0.3, stone), { z: -0.15 }),
    place(lancet(0.3, 0.6, 0.06, louvre), { y: 0.05 }),
  ), NX, TZ, 1.15, 1.15, PY + 2.0));
  // gilded ball, cross and weathervane on top
  const topY = PY + 0.3 + SH;
  g.add(place(cylinder(0.05, 0.05, 1.8, gold, 6), { x: NX, y: topY - 0.4, z: TZ }));
  g.add(place(box(0.12, 0.12, 0.8, gold), { x: NX, y: topY + 0.9, z: TZ }));
  g.add(place(box(0.5, 0.25, 0.04, gold), { x: NX + 0.2, y: topY + 1.25, z: TZ }));

  // ---- churchyard wall + lychgate -------------------------------------------
  const wallM = surface('brick', PALETTE.stoneDark, { size: 1.2 });
  const wallH = 0.6, HW = 5, HD = 10, T = 0.35;
  const gateX = NX, gateW = 2.0;
  const wall = (w, d, x, z) => {
    g.add(place(box(w, wallH, d, wallM), { x, y: y0, z }));
    g.add(place(box(w + 0.1, 0.1, d + 0.1, stoneDark), { x, y: y0 + wallH, z }));
  };
  wall(2 * HW - 0.1, T, 0, -HD + T / 2 + 0.05);
  wall(T, 2 * HD - 0.1, -HW + T / 2 + 0.05, 0);
  wall(T, 2 * HD - 0.1, HW - T / 2 - 0.05, 0);
  const lw = gateX - gateW / 2 + HW - 0.05, rw = HW - 0.05 - (gateX + gateW / 2);
  wall(lw, T, -HW + 0.05 + lw / 2, HD - T / 2 - 0.05);
  wall(rw, T, HW - 0.05 - rw / 2, HD - T / 2 - 0.05);
  // lychgate: timber posts and a little tiled gable roof over the gate
  const timber = mat(PALETTE.woodDark);
  const LZ = HD - T / 2 - 0.05 - 0.2;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.18, 2.2, 0.18, timber), { x: gateX + sx * (gateW / 2 + 0.05), y: y0, z: LZ + sz * 0.55 }));
  }
  for (const sz of [-1, 1]) g.add(place(box(gateW + 0.4, 0.15, 0.15, timber), { x: gateX, y: y0 + 2.2, z: LZ + sz * 0.55 }));
  g.add(place(gableRoof({ w: gateW + 0.3, d: 1.3, h: 1.0, overhang: 0.2, ridge: 'x', material: surface('roofTiles', PALETTE.roofBrown, { size: 1 }), gableMaterial: timber }), { x: gateX, y: y0 + 2.35, z: LZ - 0.25 }));

  // ---- paths ----------------------------------------------------------------
  const gravel = 'gravel';
  g.add(place(patch(1.6, HD - (TZ + TS / 2 + 1.05), gravel), { x: NX, y: y0, z: (HD + TZ + TS / 2 + 1.05) / 2 }));
  // side path from the front walk into the graveyard
  const GPX = 2.0;
  g.add(place(patch(GPX - NX, 1.0, gravel), { x: (GPX + NX) / 2 + 0.4, y: y0, z: 8.3 }));
  g.add(place(patch(0.9, 17.5, gravel), { x: GPX, y: y0, z: 8.8 - 17.5 / 2 }));

  // ---- graveyard ------------------------------------------------------------
  const graveStone = [mat(PALETTE.stone), mat('#b8b2a6'), mat(PALETTE.stoneDark), mat('#c9c4b8')];
  for (let row = 0; row < 11; row++) {
    const z = 6.0 - row * 1.45;
    for (const x of [2.95, 3.95]) {
      if (r.chance(0.12)) continue;
      const m = r.pick(graveStone);
      const kind = r.pick(['round', 'round', 'square', 'cross', 'cross', 'tomb']);
      const tilt = r.range(-6, 6);
      let o;
      if (kind === 'tomb') {
        o = group(box(0.7, 0.55, 1.15, m), place(box(0.8, 0.08, 1.25, mat(PALETTE.stoneDark)), { y: 0.55 }));
      } else if (kind === 'cross') {
        o = group(
          box(0.35, 0.15, 0.35, m),
          place(box(0.14, 1.25, 0.14, m), { y: 0.15 }),
          place(box(0.14, 0.14, 0.62, m), { y: 0.95 }),
        );
      } else if (kind === 'round') {
        o = group(box(0.16, 0.7, 0.62, m), place(cylinder(0.31, 0.31, 0.16, m, 10), { x: 0.08, y: 0.7, rz: 90 }));
      } else {
        o = box(0.16, 0.95, 0.62, m);
      }
      // a grassy mound in front of most stones
      if (kind !== 'tomb' && r.chance(0.75)) {
        g.add(place(box(0.6, 0.14, 0.5, mat(PALETTE.grassDark)), { x: x + 0.42, y: y0, z }));
        if (r.chance(0.4)) g.add(place(box(0.18, 0.12, 0.22, mat(r.pick([PALETTE.red, PALETTE.yellow, PALETTE.white, PALETTE.purple]))), { x: x + 0.2, y: y0 + 0.12, z }));
      }
      g.add(place(o, { x, y: y0, z, ry: tilt, rz: kind === 'tomb' ? 0 : r.range(-4, 4) }));
    }
  }
  // yews and an old tree
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 5, color: PALETTE.foliageDark }), { x: 3.7, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'cone', h: 3.8, seed: 6, color: PALETTE.foliageDark }), { x: 3.8, y: y0, z: 8.4 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 8 }), { x: -3.4, y: y0, z: -8.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 9, color: PALETTE.foliageDark }), { x: -4.2, y: y0, z: 9.1 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 10 }), { x: 0.6, y: y0, z: 9.2 }));

  // ---- front: notice board, lamp, bench -------------------------------------
  g.add(place(box(0.12, 1.3, 0.12, timber), { x: 0.3, y: y0, z: 7.0 }));
  g.add(place(box(0.12, 1.3, 0.12, timber), { x: 1.2, y: y0, z: 7.0 }));
  g.add(place(sign({ text: "ST MARY'S", w: 1.3, h: 0.7, bg: PALETTE.navy, fg: '#f3e6b0', depth: 0.1 }), { x: 0.75, y: y0 + 1.2, z: 7.05 }));
  g.add(place(streetLamp({ h: 3.2 }), { x: NX - 1.1, y: y0, z: 8.6 }));
  g.add(place(bench({ w: 1.4 }), { x: -3.9, y: y0, z: 7.6, ry: 90 }));
  return g;
}

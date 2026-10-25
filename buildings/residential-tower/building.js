import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, prismBlock, facadeBlock, box, place, mat, glass, emissive,
  sign, door, antenna, rooftopUnits, tank, tree, hedge, bench, streetLamp, columns, shade,
} from '../../src/lib/index.js';

// Square of half-size h with an n x n notch cut out of every corner (a plus shape).
function plus(h, n) {
  const a = h - n;
  return [[-a, h], [a, h], [a, a], [h, a], [h, -a], [a, -a], [a, -h], [-a, -h], [-a, -a], [-h, -a], [-h, a], [-a, a]];
}

// Thin walls along every edge of a closed outline (parapets on non-rectangular roofs).
function edgeWalls(points, h, t, m) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ry = (-Math.atan2(z2 - z1, x2 - x1) * 180) / Math.PI;
    g.add(place(box(len + t, h, t, m), { x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry }));
  }
  return g;
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  const wall = PALETTE.beige;
  const trim = PALETTE.cream;
  const white = mat(PALETTE.white);
  const trimM = mat(trim);

  // tower plan: 7.2 m square, 1.5 m corner notches hold the balconies
  const H = 3.6, N = 1.5, tz = -0.6;
  const lobbyH = 4;
  const floors = 19; // + lobby = 20 storeys
  const shaftY = y0 + lobbyH;
  const topY = shaftY + floors * FLOOR;

  // lobby storey: full square, glazed, with a cream cornice
  g.add(place(facadeBlock({ w: 2 * H, d: 2 * H, floors: 1, floorHeight: lobbyH, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.steelLight, bay: 1.8, lit: 0.35, seed: 4, roof: PALETTE.concrete }), { y: y0, z: tz }));
  g.add(place(box(2 * H + 0.5, 0.45, 2 * H + 0.5, trimM), { y: shaftY - 0.3, z: tz }));

  // residential shaft: beige punched windows
  g.add(place(prismBlock({
    points: plus(H, N), floors, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window,
    windowW: 0.62, windowH: 0.55, bay: 1.4, lit: 0.12, seed: 31, roof: PALETTE.concreteDark,
  }), { y: shaftY, z: tz }));

  // vertical cream pilasters on the arm edges for a bit of relief
  for (const s of [-1, 1]) {
    const a = H - N;
    // front/back faces
    for (const fz of [H, -H]) g.add(place(box(0.3, floors * FLOOR, 0.2, trimM), { x: s * a, y: shaftY, z: tz + fz }));
    // left/right faces
    for (const fx of [H, -H]) g.add(place(box(0.2, floors * FLOOR, 0.3, trimM), { x: fx, y: shaftY, z: tz + s * a }));
  }

  // corner balconies: a slab and an L of white balustrade on every floor
  const o = 0.35, sl = N + o, rail = 1.0, rt = 0.12;
  const railGlass = glass(PALETTE.glassSky, { opacity: 0.55 });
  for (const sx of [-1, 1]) {
    for (const sz of [-1, 1]) {
      const cx = sx * (H - N + sl / 2), cz = tz + sz * (H - N + sl / 2);
      for (let f = 0; f <= floors; f++) {
        const fy = shaftY + f * FLOOR;
        g.add(place(box(sl, 0.22, sl, f === floors ? trimM : white), { x: cx, y: fy - 0.22, z: cz }));
        if (f === floors) break; // roof slab only
        // glass balustrade with a white handrail
        const ex = sx * (H + o - rt / 2), ez = tz + sz * (H + o - rt / 2);
        g.add(place(box(sl, rail - 0.1, rt * 0.6, railGlass), { x: cx, y: fy, z: ez }));
        g.add(place(box(rt * 0.6, rail - 0.1, sl - rt, railGlass), { x: ex, y: fy, z: cz - sz * rt / 2 }));
        g.add(place(box(sl, 0.1, rt, white), { x: cx, y: fy + rail - 0.1, z: ez }));
        g.add(place(box(rt, 0.1, sl - rt, white), { x: ex, y: fy + rail - 0.1, z: cz - sz * rt / 2 }));
      }
    }
  }

  // crown: cream band + parapet round the plus-shaped roof
  g.add(place(prismBlock({ points: plus(H + 0.1, N), h: 0.5, floorHeight: 0.5, style: 'plain', wall: trim, roof: PALETTE.concreteDark }), { y: topY - 0.5, z: tz }));
  g.add(place(edgeWalls(plus(H, N), 0.8, 0.25, trimM), { y: topY, z: tz }));

  // lift machine room on the roof, with louvres, door and a stair hut
  const mrW = 3.4, mrD = 2.8, mrH = 3.2, mz = tz - 0.5;
  const mrWall = shade(wall, -0.08);
  g.add(place(facadeBlock({ w: mrW, d: mrD, h: mrH, floorHeight: mrH, style: 'plain', wall: mrWall, roof: PALETTE.concreteDark }), { x: 0.4, y: topY, z: mz }));
  g.add(place(box(mrW + 0.3, 0.25, mrD + 0.3, trimM), { x: 0.4, y: topY + mrH, z: mz }));
  for (let i = 0; i < 5; i++) {
    g.add(place(box(1.8, 0.12, 0.08, mat(PALETTE.darkGrey)), { x: 0.9, y: topY + 1.4 + i * 0.28, z: mz + mrD / 2 + 0.03 }));
    g.add(place(box(0.08, 0.12, 1.6, mat(PALETTE.darkGrey)), { x: 0.4 + mrW / 2 + 0.03, y: topY + 1.4 + i * 0.28, z: mz }));
  }
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.steelDark }), { x: -0.7, y: topY, z: mz + mrD / 2 }));
  g.add(place(facadeBlock({ w: 1.6, d: 1.8, h: 2.4, floorHeight: 2.4, style: 'plain', wall: mrWall, roof: PALETTE.concreteDark }), { x: -1.9, y: topY, z: mz - 0.3 }));
  g.add(place(antenna({ h: 5, radius: 0.08 }), { x: 1.5, y: topY + mrH + 0.25, z: mz - 0.6 }));
  g.add(place(tank({ radius: 0.7, h: 1.6, roof: 'cone', legs: 4, legHeight: 1.2, material: mat(PALETTE.steelLight) }), { x: -1.1, y: topY, z: tz + 2.4 }));
  g.add(place(rooftopUnits({ w: 2.4, d: 1.8, count: 2, seed: 8 }), { x: 0.9, y: topY, z: tz + 2.3 }));

  // lobby entrance: glass doors, canopy on two posts, name sign
  const fz = tz + H;
  g.add(place(door({ w: 1.9, h: 2.5, color: PALETTE.glassDark, frame: PALETTE.steelLight }), { y: y0, z: fz }));
  const cd = 1.9, cw = 4.4, ch = 3.1;
  g.add(place(box(cw, 0.3, cd, mat(PALETTE.steelLight, { metalness: 0.4, roughness: 0.4 })), { y: y0 + ch, z: fz + cd / 2 }));
  g.add(place(box(cw - 0.4, 0.04, cd - 0.3, emissive('#fff1c4', 0.6)), { y: y0 + ch - 0.04, z: fz + cd / 2 }));
  g.add(place(columns({ count: 2, length: cw - 0.6, radius: 0.1, h: ch, material: mat(PALETTE.steelLight) }), { y: y0, z: fz + cd - 0.25 }));
  g.add(place(sign({ text: 'POINT TOWER', w: 3.8, h: 0.6, bg: PALETTE.navy, fg: '#ffffff', depth: 0.1 }), { y: y0 + ch - 0.15, z: fz + cd + 0.02 }));

  // forecourt: paving, path to the street, planters, bench, lamp
  g.add(place(patch(7.2, 2.0, 'paved'), { y: y0, z: fz + 1.0 }));
  g.add(place(patch(2.4, TILE / 2 - fz - 2.0, 'paved'), { y: y0, z: (fz + 2.0 + TILE / 2) / 2 }));
  for (const s of [-1, 1]) {
    g.add(place(box(1.2, 0.5, 1.0, mat(PALETTE.stoneDark)), { x: s * 2.9, y: y0, z: fz + 1.0 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 + s }), { x: s * 2.9, y: y0 + 0.5, z: fz + 1.0 }));
  }
  g.add(place(bench({ w: 1.3 }), { x: -1.75, y: y0, z: 4.25, ry: -90 }));
  g.add(place(streetLamp({ h: 4 }), { x: 3.1, y: y0, z: TILE / 2 - 0.45, ry: 180 }));

  // garden strips: trees at the front corners, hedges down the sides and back
  for (const s of [-1, 1]) {
    g.add(place(tree({ kind: 'cone', h: 4, seed: 20 + s }), { x: s * 3.85, y: y0, z: 3.85 }));
    g.add(place(hedge({ w: 6.4, h: 0.9, d: 0.6 }), { x: s * (TILE / 2 - 0.4), y: y0, z: -1.2, ry: 90 }));
  }
  g.add(place(hedge({ w: 5.2, h: 0.9, d: 0.5 }), { x: -2.0, y: y0, z: -TILE / 2 + 0.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 41 }), { x: -4.2, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 42 }), { x: 4.3, y: y0, z: 2.6 }));
  // bin store at the back right
  g.add(place(box(2.0, 1.3, 0.7, mat(PALETTE.brickBrown)), { x: 3.3, y: y0, z: -TILE / 2 + 0.45 }));
  for (const [i, c] of [PALETTE.green, PALETTE.darkGrey].entries()) {
    g.add(place(box(0.7, 0.9, 0.5, mat(c)), { x: 2.85 + i * 0.9, y: y0, z: -TILE / 2 + 1.1 }));
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, box, place, mat, metal, surface, door, awning,
  car, tree, fence, streetLamp, cylinder, rng,
} from '../../src/lib/index.js';
import {
  CANDY, rainbowSign, giftBox, alphabetBlock, toyBrick, puffs, teddy, lollipop, conveyor, uvBox,
} from './toys.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Candy-pink factory hall on the left, loading yard with the toy-box conveyor on the right.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const r = rng(77);
  g.add(lot([2, 1], 'paved'));

  // ---- factory hall ------------------------------------------------------
  const hw = 12.6, hd = 6.6, hx = -3.3, hz = -1.4, fh = 3.6, H = 2 * fh;
  const front = hz + hd / 2;
  g.add(place(facadeBlock({
    w: hw, d: hd, floors: 2, floorHeight: fh, style: 'punched', wall: CANDY.pink, frame: '#ffffff',
    glass: PALETTE.glassSky, windowW: 0.6, windowH: 0.5, bay: 2.1, lit: 0.15, seed: 31, roof: CANDY.mint,
  }), { x: hx, y: y0, z: hz }));
  // mint plinth, lemon belt course, candy-striped parapet
  g.add(place(box(hw + 0.12, 0.5, hd + 0.12, mat(CANDY.mint)), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.16, 0.22, hd + 0.16, mat(CANDY.lemon)), { x: hx, y: y0 + fh - 0.11, z: hz }));
  const stripes = surface('stripes', '#ffffff', { color2: CANDY.hotPink, size: 1 });
  const pt = 0.3, ph = 0.8;
  for (const sz of [-1, 1]) g.add(place(box(hw + 0.2, ph, pt, stripes), { x: hx, y: y0 + H, z: hz + sz * (hd / 2 - pt / 2 + 0.1) }));
  for (const sx of [-1, 1]) g.add(place(box(pt, ph, hd, stripes), { x: hx + sx * (hw / 2 - pt / 2 + 0.1), y: y0 + H, z: hz }));
  for (const sz of [-1, 1]) g.add(place(box(hw + 0.3, 0.12, 0.45, mat(CANDY.lemon)), { x: hx, y: y0 + H + ph, z: hz + sz * (hd / 2 - 0.05) }));
  for (const sx of [-1, 1]) g.add(place(box(0.45, 0.12, hd + 0.3, mat(CANDY.lemon)), { x: hx + sx * (hw / 2 - 0.05), y: y0 + H + ph, z: hz }));
  // corner pilasters in sky blue
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.45, H, 0.45, mat(CANDY.sky)), { x: hx + sx * (hw / 2 + 0.02), y: y0, z: hz + sz * (hd / 2 + 0.02) }));
  }

  // big rainbow sign between the storeys
  g.add(place(rainbowSign({ text: 'TOY FACTORY', w: 8.6, h: 1.45 }), { x: hx, y: y0 + fh - 0.75, z: front + 0.1 }));

  // entrance: double doors, candy-striped awning, steps
  const ex = hx;
  g.add(place(door({ w: 2.2, h: 2.4, color: CANDY.sky, frame: '#ffffff' }), { x: ex, y: y0 + 0.1, z: front }));
  g.add(place(box(0.05, 2.3, 0.14, mat('#ffffff')), { x: ex, y: y0 + 0.15, z: front + 0.08 }));
  g.add(place(awning({ w: 3.4, depth: 1.5, drop: 0.45, color: CANDY.hotPink, color2: '#ffffff' }), { x: ex, y: y0 + 2.95, z: front }));
  g.add(place(box(3.2, 0.15, 1.2, mat(PALETTE.concrete)), { x: ex, y: y0, z: front + 0.6 }));

  // side hatch on the east wall where the conveyor leaves the hall
  const hallE = hx + hw / 2;
  const belt = 1.15, cz = -2.6;
  g.add(place(box(0.12, 1.9, 1.7, mat(CANDY.lemon)), { x: hallE + 0.03, y: y0 + belt - 0.5, z: cz }));
  g.add(place(box(0.14, 1.6, 1.35, mat('#2a2630')), { x: hallE + 0.05, y: y0 + belt - 0.35, z: cz }));
  for (let i = 0; i < 5; i++) {
    g.add(place(box(0.04, 1.2, 0.22, mat('#cfe8f2', { transparent: true, opacity: 0.75 })), { x: hallE + 0.14, y: y0 + belt + 0.05, z: cz - 0.54 + i * 0.27 }));
  }
  // loading door further forward on the east wall
  g.add(place(box(0.1, 2.8, 2.6, surface('corrugated', CANDY.lilac, { size: 0.6 })), { x: hallE + 0.05, y: y0, z: 0.3 }));

  // back: service door and a lemon pipe run
  const back = hz - hd / 2;
  g.add(place(door({ w: 1.2, h: 2.3, color: CANDY.mint, frame: '#ffffff' }), { x: hx - 3.2, y: y0, z: back, ry: 180 }));
  g.add(place(box(1.8, 0.12, 0.5, mat(CANDY.hotPink)), { x: hx - 3.2, y: y0 + 2.55, z: back - 0.25 }));
  for (const px of [hx + 1.1, hx + 1.5]) g.add(place(cylinder(0.12, 0.12, H, metal(CANDY.lemon), 8), { x: px, y: y0, z: back - 0.15 }));

  // ---- roof: giant teddy bear and building-block chimneys ----------------
  const roofY = y0 + H;
  // the bear sits on a giant toy drum so it clears the parapet
  const tx = hx + 2.2, tz = hz - 1.05, dh = 1.0;
  g.add(place(cylinder(1.9, 1.9, dh, mat(CANDY.red, { roughness: 0.5 }), 20), { x: tx, y: roofY, z: tz }));
  for (const y of [0, dh - 0.16]) g.add(place(cylinder(1.96, 1.96, 0.16, mat(CANDY.lemon), 20), { x: tx, y: roofY + y, z: tz }));
  g.add(place(cylinder(1.85, 1.85, 0.04, mat(CANDY.cream), 20), { x: tx, y: roofY + dh, z: tz }));
  g.add(place(teddy(), { x: tx, y: roofY + dh, z: tz }));

  // chimney 1: stacked alphabet blocks
  const ax = hx - 4.4, az = hz - 1.4;
  const letters = [['S', CANDY.red], ['Y', '#2f86d6'], ['O', '#3fae55'], ['T', '#8a55c8']];
  g.add(place(box(2.2, 0.8, 2.2, mat(CANDY.lilac)), { x: ax, y: roofY, z: az }));
  let ay = roofY + 0.8;
  letters.forEach(([L, c], i) => {
    const s = 1.7 - i * 0.1;
    g.add(place(alphabetBlock(s, L, c), { x: ax, y: ay, z: az, ry: (i % 2 ? 1 : -1) * 9 + i * 3 }));
    ay += s;
  });
  g.add(place(cylinder(0.38, 0.42, 0.6, mat('#3a3640'), 10), { x: ax, y: ay, z: az }));
  g.add(place(puffs(['#ffffff', '#ffd3e6', '#d8ecff']), { x: ax, y: ay + 0.6, z: az }));

  // chimney 2: plastic toy bricks
  const bx = hx - 1.2, bz = hz - 1.9;
  const bricks = [CANDY.red, CANDY.lemon, '#2f86d6', '#3fae55', CANDY.red, CANDY.lemon];
  g.add(place(box(2.5, 0.8, 1.8, mat(CANDY.sky)), { x: bx + 0.1, y: roofY, z: bz }));
  let by = roofY + 0.8;
  bricks.forEach((c, i) => {
    const top = i === bricks.length - 1;
    g.add(place(toyBrick(i % 2 ? 1.4 : 2.1, 0.75, 1.4, c, { studs: top || i % 2 === 0 }), { x: bx + (i % 2 ? 0.2 : 0), y: by, z: bz }));
    by += 0.75;
  });
  g.add(place(cylinder(0.32, 0.36, 0.7, mat('#3a3640'), 10), { x: bx - 0.35, y: by, z: bz }));
  g.add(place(puffs(['#e9ddff', '#ffffff', '#ffe9b0'], 1), { x: bx - 0.35, y: by + 0.7, z: bz, ry: 30 }));

  // small skylights at the east end of the roof
  for (const sz of [-1, 1]) {
    g.add(place(box(1.6, 0.5, 1.1, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 })), { x: hx + 5.2, y: roofY, z: hz + sz * 1.4 }));
  }

  // ---- loading yard + conveyor ------------------------------------------
  g.add(place(patch(TILE * 2 - hw - 0.8 - 0.4, TILE - 0.6, 'asphalt'), { x: (hallE + 10) / 2, y: y0, z: 0 }));
  const cx2 = 8.3;
  const run1 = cx2 - hallE + 0.5;
  g.add(place(conveyor(run1, { h: belt }), { x: hallE + run1 / 2, y: y0, z: cz }));
  const run2 = 5.6;
  g.add(place(conveyor(run2, { h: belt }), { x: cx2, y: y0, z: cz + run2 / 2 - 0.5, ry: 90 }));
  // toy boxes riding the belt
  let gi = 0;
  for (let x = hallE + 0.8; x < cx2 - 0.4; x += 1.25) {
    const s = r.range(0.55, 0.72);
    g.add(place(giftBox(s, gi++), { x, y: y0 + belt, z: cz + r.range(-0.08, 0.08), ry: r.range(-10, 10) }));
  }
  for (let z = cz + 0.9; z < cz + run2 - 1.2; z += 1.25) {
    const s = r.range(0.55, 0.72);
    g.add(place(giftBox(s, gi++), { x: cx2 + r.range(-0.08, 0.08), y: y0 + belt, z, ry: r.range(-10, 10) }));
  }
  // packing table at the end of the line + pallets of boxes
  g.add(place(box(1.8, belt - 0.1, 1.4, mat(PALETTE.wood)), { x: cx2, y: y0, z: cz + run2 }));
  g.add(place(giftBox(0.7, 5), { x: cx2 - 0.35, y: y0 + belt - 0.1, z: cz + run2 }));
  g.add(place(giftBox(0.6, 2), { x: cx2 + 0.45, y: y0 + belt - 0.1, z: cz + run2 + 0.1, ry: 15 }));
  const pallet = (px, pz, seed) => {
    const pr = rng(seed);
    const pg = new THREE.Group();
    pg.add(box(1.5, 0.18, 1.5, mat(PALETTE.woodLight)));
    let k = seed;
    for (const [ox, oz] of [[-0.37, -0.37], [0.37, -0.37], [-0.37, 0.37], [0.37, 0.37]]) {
      pg.add(place(giftBox(0.7, k++), { x: ox, y: 0.18, z: oz }));
      if (pr.chance(0.6)) pg.add(place(giftBox(0.66, k + 3), { x: ox, y: 0.88, z: oz, ry: pr.range(-8, 8) }));
    }
    g.add(place(pg, { x: px, y: y0, z: pz }));
  };
  pallet(4.3, -3.6, 1);
  pallet(4.3, 3.9, 4);

  // pink delivery van
  const van = car({ color: CANDY.hotPink, kind: 'van' });
  for (const sz of [-1, 1]) van.add(place(uvBox(2.8, 0.75, 0.04, rainbowSignMat()), { x: -0.45, y: 1.15, z: sz * 0.9, ry: sz > 0 ? 0 : 180 }));
  g.add(place(van, { x: 5.6, y: y0 + 0.05, z: 1.4, ry: -90 }));

  // ---- front garden: lollipops, flowers, fence, lamp ----------------------
  const fy = front + 0.2;
  g.add(place(patch(3.2, TILE / 2 - fy, 'paved'), { x: ex, y: y0, z: (fy + TILE / 2) / 2 }));
  for (const [x, w] of [[-8.0, 3.4], [1.0, 3.4]]) {
    g.add(place(box(w, 0.25, 1.5, mat(PALETTE.dirt)), { x, y: y0, z: front + 1.1 }));
    for (let i = 0; i < 6; i++) {
      g.add(place(tree({ kind: 'bush', h: 0.6, color: [CANDY.hotPink, CANDY.lemon, CANDY.lilac, CANDY.sky][i % 4] }), { x: x - w / 2 + 0.35 + i * ((w - 0.7) / 5), y: y0 + 0.25, z: front + 1.1 + (i % 2 ? 0.3 : -0.3) }));
    }
  }
  g.add(place(lollipop({ h: 2.6, r: 0.85, c1: CANDY.hotPink, ry: 30 }), { x: -9.2, y: y0, z: 3.9 }));
  g.add(place(lollipop({ h: 1.7, r: 0.65, c1: CANDY.sky, ry: -20 }), { x: -8.1, y: y0, z: 4.0 }));
  g.add(place(lollipop({ h: 1.7, r: 0.65, c1: CANDY.lemon, c2: CANDY.red, ry: 20 }), { x: 1.75, y: y0, z: 3.9 }));
  g.add(place(lollipop({ h: 2.5, r: 0.8, c1: CANDY.mint, ry: -35 }), { x: 2.75, y: y0, z: 4.1 }));
  g.add(place(fence({ w: 4.7, d: 0.1, h: 0.7, style: 'picket', color: '#ffffff', sides: ['front'] }), { x: -7.35, y: y0, z: TILE / 2 - 0.25 }));
  g.add(place(fence({ w: 4.6, d: 0.1, h: 0.7, style: 'picket', color: '#ffffff', sides: ['front'] }), { x: 0.7, y: y0, z: TILE / 2 - 0.25 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 9.5, y: y0, z: 4.5, ry: 180 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 5, color: '#f6a9cf' }), { x: 9.0, y: y0, z: -4.0 }));
  return g;
}

// van-side logo strip
function rainbowSignMat() {
  return rainbowSign({ text: 'TOYS!', w: 2.8, h: 0.75 }).material[4];
}

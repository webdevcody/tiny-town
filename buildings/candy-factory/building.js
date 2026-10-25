import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, glass, surface, barrelRoof, parapet, windowPanel, door,
  awning, streetLamp, bench, hedge, fence,
} from '../../src/lib/index.js';
import {
  CANDY, bigSign, candyCane, lollipopChimney, pinkSmoke, bonbon, wrapperLorry, gardenLollipop, gumdrop,
} from './sweets.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left: pastel-striped factory hall with four candy-striped vaults and three
// lollipop chimneys puffing pink smoke. Right: mint packing house with a
// giant bonbon on the roof and two sweet-wrapper lorries at the dock.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  // --- main hall --------------------------------------------------------
  const hx = -4.1, hz = -1.8, hw = 11, hd = 6, hh = 6.4;
  const pinkStripes = surface('stripes', CANDY.pink, { color2: CANDY.cream, size: 6 });
  g.add(place(box(hw, 0.5, hd, mat(CANDY.hotPink)), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw, hh - 0.5, hd, [pinkStripes, pinkStripes, mat(PALETTE.concrete), pinkStripes, pinkStripes, pinkStripes]), { x: hx, y: y0 + 0.5, z: hz }));
  // lemon cornice band
  g.add(place(box(hw + 0.3, 0.45, hd + 0.3, mat(CANDY.lemon)), { x: hx, y: y0 + hh - 0.45, z: hz }));

  // windows: two rows on the front and back, one row on the left end
  const win = (opts) => windowPanel({ w: 1.1, h: 1.3, frame: '#ffffff', ...opts });
  const frontZ = hz + hd / 2;
  for (let i = 0; i < 5; i++) {
    const x = hx - hw / 2 + 1.1 + i * 2.2;
    g.add(place(win({}), { x, y: y0 + 3.6, z: frontZ }));
    g.add(place(win({}), { x, y: y0 + 3.6, z: hz - hd / 2, ry: 180 }));
    g.add(place(win({}), { x, y: y0 + 1.2, z: hz - hd / 2, ry: 180 }));
    if (i !== 2) g.add(place(win({}), { x, y: y0 + 1.2, z: frontZ }));
  }
  for (const z of [-1.7, 1.7]) {
    g.add(place(win({}), { x: hx - hw / 2, y: y0 + 3.6, z: hz + z, ry: -90 }));
    g.add(place(win({}), { x: hx - hw / 2, y: y0 + 1.2, z: hz + z, ry: -90 }));
  }

  // entrance: double door, striped awning, steps
  g.add(place(door({ w: 1.8, h: 2.4, color: CANDY.mintDark, frame: '#ffffff' }), { x: hx, y: y0 + 0.15, z: frontZ }));
  g.add(place(awning({ w: 3.4, depth: 1.3, drop: 0.45, color: CANDY.hotPink, color2: '#ffffff' }), { x: hx, y: y0 + 3.0, z: frontZ }));
  g.add(place(box(3, 0.15, 1.2, mat(PALETTE.white)), { x: hx, y: y0, z: frontZ + 0.6 }));

  // roof: four candy-striped barrel vaults in pastel flavours
  const roofY = y0 + hh;
  const vw = hw / 4;
  const flavours = [CANDY.mint, CANDY.lilac, CANDY.lemon, CANDY.sky];
  for (let i = 0; i < 4; i++) {
    const vx = hx - hw / 2 + vw / 2 + i * vw;
    g.add(place(barrelRoof({
      w: vw, d: hd, h: 1.5, axis: 'z',
      material: surface('stripes', flavours[i], { color2: '#ffffff', size: 1 }),
      endMaterial: mat(CANDY.cream),
    }), { x: vx, y: roofY, z: hz }));
  }

  // rooftop sign at the front edge
  const signY = roofY + 0.1;
  g.add(place(box(0.15, 0.6, 0.15, mat(PALETTE.steelDark)), { x: hx - 2.1, y: signY, z: frontZ - 0.35 }));
  g.add(place(box(0.15, 0.6, 0.15, mat(PALETTE.steelDark)), { x: hx + 3.9, y: signY, z: frontZ - 0.35 }));
  g.add(place(bigSign({ text: 'CANDY FACTORY', w: 7.6, h: 1.5, bg: CANDY.hotPink, fg: '#ffffff', border: CANDY.lemon, double: true }), { x: hx + 0.9, y: signY + 0.5, z: frontZ - 0.2 }));

  // lollipop chimneys in the valleys between the vaults, with pink smoke
  const pops = [
    { x: hx - vw, h: 5, r: 1.5, color: CANDY.hotPink, color2: '#ffffff', stickColor: CANDY.pink, ry: 10 },
    { x: hx, h: 6.8, r: 1.8, color: '#9b6fe0', color2: CANDY.lemon, stickColor: CANDY.lilac, ry: -8 },
    { x: hx + vw, h: 4.6, r: 1.45, color: '#3fbf8f', color2: '#ffffff', stickColor: CANDY.mint, ry: 14 },
  ];
  for (const [i, p] of pops.entries()) {
    const pop = lollipopChimney({ h: p.h, radius: p.r, color: p.color, color2: p.color2, stickColor: p.stickColor });
    const pz = hz - 1.2;
    g.add(place(pop, { x: p.x, y: roofY, z: pz, ry: p.ry }));
    g.add(place(pinkSmoke({ puffs: 4 + (i % 2), drift: 0.45, start: 0.5 }), { x: p.x, y: roofY + pop.userData.top, z: pz }));
  }

  // --- packing house (right) ---------------------------------------------
  const px = 5.9, pz = -3.4, pw = 7.6, pd = 3.2, ph = 5.2;
  const mintStripes = surface('stripes', CANDY.mint, { color2: CANDY.cream, size: 6 });
  g.add(place(box(pw, ph, pd, [mintStripes, mintStripes, mat(PALETTE.concrete), mintStripes, mintStripes, mintStripes]), { x: px, y: y0, z: pz }));
  for (const dx of [-2.4, 0, 2.4]) g.add(place(win({}), { x: px + dx, y: y0 + 2.6, z: pz - pd / 2, ry: 180 }));
  g.add(place(win({}), { x: px + pw / 2, y: y0 + 2.6, z: pz, ry: 90 }));
  g.add(place(parapet({ w: pw + 0.2, d: pd + 0.2, h: 0.5, t: 0.25, material: mat(CANDY.hotPink) }), { x: px, y: y0 + ph, z: pz }));
  // loading dock: two roller doors with lemon frames, a dock platform
  const dockZ = pz + pd / 2;
  const rollerMat = surface('corrugated', CANDY.lemon, { size: 1 });
  for (const dx of [-1.9, 1.9]) {
    g.add(place(box(2.9, 3.4, 0.1, mat('#ffffff')), { x: px + dx, y: y0, z: dockZ + 0.02 }));
    g.add(place(box(2.5, 3.1, 0.14, rollerMat), { x: px + dx, y: y0, z: dockZ + 0.04 }));
  }
  g.add(place(box(pw, 1.1, 0.7, mat(PALETTE.concreteDark)), { x: px, y: y0, z: dockZ + 0.35 }));
  g.add(place(box(pw, 0.12, 0.12, surface('hazard', PALETTE.yellow, { size: 1 })), { x: px, y: y0 + 1.0, z: dockZ + 0.7 }));
  g.add(place(bigSign({ text: 'PACKING', w: 3.2, h: 0.7, bg: CANDY.mintDark, fg: '#ffffff' }), { x: px, y: y0 + 3.8, z: dockZ }));
  // giant wrapped bonbon on the roof
  g.add(place(box(2.2, 0.4, 1.4, mat(PALETTE.steelDark)), { x: px, y: y0 + ph, z: pz }));
  g.add(place(bonbon({ r: 1.15, color: CANDY.hotPink, wrapper: CANDY.lemon }), { x: px, y: y0 + ph + 0.3, z: pz, ry: 0 }));

  // enclosed glass conveyor bridge from the hall to the packing house
  const bx = (hx + hw / 2 + px - pw / 2) / 2;
  const bl = px - pw / 2 - (hx + hw / 2);
  g.add(place(box(bl + 0.1, 1.6, 1.6, glass(PALETTE.glassSky, { opacity: 0.85 })), { x: bx, y: y0 + 3.4, z: pz }));
  g.add(place(box(bl + 0.1, 0.2, 1.8, mat(CANDY.lemon)), { x: bx, y: y0 + 5.0, z: pz }));

  // --- lorry yard ------------------------------------------------------------
  g.add(place(patch(7.8, 6.9, 'asphalt'), { x: 6.0, y: y0, z: 1.5 }));
  for (const lx of [-3.8, 0, 3.6]) {
    g.add(place(box(0.12, 0.02, 5.6, mat(PALETTE.roadLine)), { x: px + lx, y: y0 + 0.05, z: 2.1 }));
  }
  // lorries backed up to the dock, cabs facing the street
  const lorryZ = dockZ + 0.75 + 3.05 * 0.9;
  g.add(place(wrapperLorry({ cab: CANDY.hotPink, bg: CANDY.pink, dot: '#ffffff', sweet: CANDY.lilac, text: 'SWEETS' }), { x: px - 1.9, y: y0, z: lorryZ, ry: -90, s: 0.9 }));
  g.add(place(wrapperLorry({ cab: '#3fbf8f', bg: CANDY.mint, dot: CANDY.lemon, sweet: CANDY.hotPink, text: 'BONBON' }), { x: px + 1.9, y: y0, z: lorryZ, ry: -90, s: 0.9 }));

  // --- front garden ------------------------------------------------------
  // pink path to the door, flower beds of gumdrops and lollipops
  g.add(place(patch(3, 3.2, mat(CANDY.pink)), { x: hx, y: y0, z: 3.4 }));
  const beds = [[-8.1, 3.2], [-0.4, 3.2]];
  for (const [bxp, bzp] of beds) {
    g.add(place(box(2.8, 0.3, 2.2, mat(PALETTE.cream)), { x: bxp, y: y0, z: bzp }));
    g.add(place(patch(2.5, 1.9, 'grass'), { x: bxp, y: y0 + 0.28, z: bzp }));
  }
  const gumColors = [CANDY.mint, CANDY.lemon, CANDY.lilac, CANDY.hotPink, CANDY.sky];
  [[-8.9, 2.6], [-7.3, 2.6], [-7.3, 3.8], [-1.2, 2.6], [0.4, 3.8], [0.4, 2.6], [-1.2, 3.8]].forEach(([x, z], i) => {
    g.add(place(gumdrop({ r: 0.4, color: gumColors[i % gumColors.length] }), { x, y: y0 + 0.33, z }));
  });
  g.add(place(gardenLollipop({ h: 1.5, r: 0.5, color: CANDY.hotPink }), { x: -0.4, y: y0 + 0.33, z: 3.2, ry: 25 }));
  g.add(place(gardenLollipop({ h: 1.2, r: 0.4, color: '#9b6fe0', color2: CANDY.lemon }), { x: -7.6, y: y0 + 0.33, z: 3.0, ry: -20 }));

  // the giant candy cane standing in the left bed, hooked over the roof corner
  g.add(place(candyCane({ h: 9, r: 0.45, hook: 1.3 }), { x: -9.25, y: y0 + 0.33, z: 2.6, ry: -90 }));

  // lamps and a bench by the entrance
  g.add(place(streetLamp({ h: 4.2 }), { x: hx - 2.1, y: y0, z: 4.6 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: hx + 2.1, y: y0, z: 4.6, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: -6.2, y: y0, z: 3.2, ry: 90 }));

  // pastel picket fence along the street edge of the garden, hedge behind the hall
  g.add(place(fence({ w: 3.2, d: 0.1, h: 0.7, style: 'picket', color: CANDY.cream, sides: ['front'] }), { x: -8.1, y: y0, z: 4.75 }));
  g.add(place(fence({ w: 3.2, d: 0.1, h: 0.7, style: 'picket', color: CANDY.cream, sides: ['front'] }), { x: -0.1, y: y0, z: 4.75 }));
  g.add(place(hedge({ w: 0.6, h: 1.0, d: 6.6 }), { x: 1.75, y: y0, z: 1.35 }));
  return g;
}

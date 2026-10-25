import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, beam, mat, emissive, metal, surface,
  parkingLot, tree, streetLamp, bench, door, sign,
} from '../../src/lib/index.js';
import {
  panel, glowing, neonSignTexture, verticalSignTexture, lanesTexture,
  bowlingPin, bowlingBall, starburst, profileExtrude,
} from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Googie bowling alley: turquoise hall under an upswept roof, neon script
// sign, and a roadside pylon crowned by a giant bowling pin.

const TURQUOISE = '#5fc3b5';
const CORAL = '#e8684a';
const NEON_PINK = '#ff4fa8';
const NEON_CYAN = '#4ff3ff';

// hall
const HX = 3.6, HW = 11.6;            // x -2.2 .. 9.4
const ZB = -4.4, ZF = 1.6;            // back / front wall
const WALL_H = 4.4;
// roof: underside rises from the back eave to the cantilevered front tip
const RB = -4.8, RF = 3.9, ROOF_T = 0.35;
const under = (z) => 4.75 + 2.4 * Math.pow(Math.max(0, (z - RB) / (RF - RB)), 2.2);

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  const wallM = mat(TURQUOISE);
  const trimM = mat(PALETTE.white);
  const stoneM = surface('paving', PALETTE.sandstone, { size: 1.2 });
  const steelM = metal(PALETTE.steelLight);
  const neonPink = emissive(NEON_PINK, 1.2);
  const neonCyan = emissive(NEON_CYAN, 1.2);

  // ---- hall body ---------------------------------------------------------
  const hd = ZF - ZB, hz = (ZF + ZB) / 2;
  g.add(place(facadeBlock({ w: HW, d: hd, h: WALL_H, floorHeight: WALL_H, style: 'plain', wall: TURQUOISE, roof: PALETTE.concreteDark }), { x: HX, y: y0, z: hz }));
  // white base band all round
  g.add(place(box(HW + 0.1, 0.5, hd + 0.1, trimM), { x: HX, y: y0, z: hz }));

  // clerestory glazing between the wall top and the swooping roof
  const N = 16;
  const curve = [];
  for (let i = 0; i <= N; i++) {
    const z = ZB + ((ZF - ZB) * i) / N;
    curve.push([z, under(z) - y0 + 0.02]);
  }
  const clereM = mat('#9fe0ec', { emissive: '#9fe0ec', emissiveIntensity: 0.35, roughness: 0.2, metalness: 0.3 });
  const clere = [[ZB, WALL_H], [ZF, WALL_H], ...curve.slice().reverse()];
  g.add(place(profileExtrude(clere, HW, clereM, clereM), { x: HX, y: y0 }));
  // clerestory mullions (front and ends)
  const frontTop = under(ZF);
  for (let x = HX - HW / 2 + 0.05; x <= HX + HW / 2 + 0.01; x += HW / 12) {
    g.add(place(box(0.12, frontTop - y0 - WALL_H, 0.12, trimM), { x, y: y0 + WALL_H, z: ZF + 0.02 }));
  }
  for (const sx of [-1, 1]) {
    for (let i = 1; i < 6; i++) {
      const z = ZB + ((ZF - ZB) * i) / 6;
      g.add(place(box(0.12, under(z) - y0 - WALL_H, 0.12, trimM), { x: HX + sx * (HW / 2 + 0.02), y: y0 + WALL_H, z }));
    }
  }

  // ---- swoopy roof ---------------------------------------------------------
  const R = 24;
  const top = [], bot = [];
  for (let i = 0; i <= R; i++) {
    const z = RB + ((RF - RB) * i) / R;
    top.push([z, under(z) + ROOF_T]);
    bot.push([z, under(z)]);
  }
  const roofM = mat('#f4efe4', { roughness: 0.6 });
  const fasciaM = mat(CORAL);
  const roofW = HW + 0.8;
  g.add(place(profileExtrude([...bot, ...top.slice().reverse()], roofW, fasciaM, roofM), { x: HX }));
  // coral edge strips and a pink neon tube along the cantilevered tip
  g.add(place(box(roofW, ROOF_T + 0.1, 0.18, fasciaM), { x: HX, y: under(RF) - 0.05, z: RF - 0.05 }));
  g.add(place(box(roofW - 0.2, 0.12, 0.12, neonPink), { x: HX, y: under(RF) - 0.18, z: RF - 0.12 }));
  g.add(place(box(roofW, 0.25, 0.3, fasciaM), { x: HX, y: under(RB) - 0.05, z: RB + 0.1 }));
  // coral standing-seam ribs following the swoop
  const ribs = [...top, ...top.slice().reverse().map(([z, y]) => [z, y + 0.12])];
  for (let i = 1; i < 8; i++) {
    g.add(place(profileExtrude(ribs, 0.14, fasciaM, fasciaM), { x: HX - roofW / 2 + (roofW * i) / 8 }));
  }
  // cyan neon tube along the wall top
  g.add(place(box(HW, 0.1, 0.1, neonCyan), { x: HX, y: y0 + WALL_H - 0.08, z: ZF + 0.08 }));

  // angled V-posts holding up the front cantilever
  for (const x of [HX - HW / 2 + 0.6, HX + HW / 2 - 0.6]) {
    const yTop = under(RF - 0.6) - 0.02;
    g.add(beam([x, y0, ZF + 1.3], [x - 0.7, yTop, RF - 0.6], 0.2, steelM));
    g.add(beam([x, y0, ZF + 1.3], [x + 0.7, yTop, RF - 0.6], 0.2, steelM));
    g.add(place(box(0.5, 0.15, 0.5, steelM), { x, y: y0, z: ZF + 1.3 }));
  }

  // rooftop AC units on the low back of the roof
  for (const [x, w] of [[HX - 2.325, 1.2], [HX + 2.325, 1.2]]) {
    const z = -3.8;
    g.add(place(box(w, 0.8, 1.0, mat(PALETTE.lightGrey)), { x, y: under(z) + ROOF_T - 0.05, z }));
    g.add(place(box(w * 0.6, 0.06, 0.6, mat(PALETTE.darkGrey)), { x, y: under(z) + ROOF_T + 0.75, z }));
  }

  // ---- front facade ------------------------------------------------------
  const fz = ZF;
  // flagstone piers at both corners and either side of the entrance
  for (const [x, w] of [[HX - HW / 2 + 0.55, 1.1], [HX + HW / 2 - 0.55, 1.1], [HX - 1.65, 0.5], [HX + 1.65, 0.5]]) {
    g.add(place(box(w, 3.0, 0.3, stoneM), { x, y: y0, z: fz + 0.15 }));
  }
  // lane windows: you can see the lanes and pin decks inside
  const lanes = mat('#ffffff', { map: lanesTexture(), emissive: '#ffffff', emissiveMap: lanesTexture(), emissiveIntensity: 0.55, roughness: 0.3 });
  const frameM = mat(PALETTE.white);
  for (const sx of [-1, 1]) {
    const cx = HX + sx * 3.5, ww = 3.0;
    g.add(place(panel(ww, 2.2, 0.08, lanes, frameM), { x: cx, y: y0 + 0.6, z: fz + 0.05 }));
    g.add(place(box(ww + 0.2, 0.12, 0.2, frameM), { x: cx, y: y0 + 2.8, z: fz + 0.1 }));
    g.add(place(box(ww + 0.2, 0.12, 0.2, frameM), { x: cx, y: y0 + 0.5, z: fz + 0.1 }));
    for (const k of [-1, 0, 1]) g.add(place(box(0.08, 2.2, 0.14, frameM), { x: cx + k * (ww / 2), y: y0 + 0.6, z: fz + 0.1 }));
  }
  // glass entrance doors with a little canopy
  g.add(place(door({ w: 1.2, h: 2.4, color: mat('#8fd6e6', { roughness: 0.2, metalness: 0.4 }), frame: PALETTE.white }), { x: HX - 0.65, y: y0, z: fz }));
  g.add(place(door({ w: 1.2, h: 2.4, color: mat('#8fd6e6', { roughness: 0.2, metalness: 0.4 }), frame: PALETTE.white }), { x: HX + 0.65, y: y0, z: fz }));
  g.add(place(box(3.8, 0.12, 1.4, fasciaM), { x: HX, y: y0 + 2.75, z: fz + 0.7 }));
  // big neon script sign over the windows
  const neonTex = neonSignTexture('main', 'Bowl-O-Rama', { color: NEON_PINK });
  g.add(place(panel(10.2, 1.25, 0.25, glowing(neonTex, 0.95), mat('#1d2340')), { x: HX, y: y0 + 3.0, z: fz + 0.15 }));

  // flat starbursts on the corner piers
  for (const x of [HX - HW / 2 + 0.55, HX + HW / 2 - 0.55]) {
    g.add(place(starburst(0.55, { color: PALETTE.yellow, t: 0.07 }), { x, y: y0 + 2.0, z: fz + 0.35 }));
  }

  // ---- side walls --------------------------------------------------------
  // left (parking side): side door, porthole windows and a LANES sign
  const lx = HX - HW / 2;
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.navy }), { x: lx, y: y0, z: -2.8, ry: -90 }));
  const portM = emissive('#bff4ff', 0.4);
  for (const sx of [-1, 1]) {
    for (const z of sx < 0 ? [-0.6, 0.6] : [-3.2, -1.8, -0.4, 1.0]) {
      g.add(place(cylinder(0.4, 0.4, 0.1, portM, 12), { x: HX + sx * (HW / 2 + 0.01), y: y0 + 2.6, z, rz: -90 * sx }));
      g.add(place(cylinder(0.5, 0.5, 0.06, trimM, 12), { x: HX + sx * (HW / 2), y: y0 + 2.6, z, rz: -90 * sx }));
    }
  }
  const sideTex = neonSignTexture('side', '24 LANES', { color: NEON_CYAN, border: NEON_PINK, width: 512, height: 128 });
  g.add(place(panel(3.4, 0.85, 0.15, glowing(sideTex, 0.9), mat('#1d2340')), { x: lx - 0.08, y: y0 + 3.3, z: -1.9, ry: -90 }));

  // back: service door, coral stripe, portholes
  g.add(place(box(HW + 0.04, 0.3, hd + 0.04, fasciaM), { x: HX, y: y0 + 3.4, z: hz }));
  g.add(place(door({ w: 1.4, h: 2.4, color: PALETTE.steel }), { x: HX + 3.8, y: y0, z: ZB, ry: 180 }));
  for (const x of [HX - 4, HX - 2.6, HX - 1.2, HX + 0.2]) {
    g.add(place(cylinder(0.4, 0.4, 0.1, portM, 12), { x, y: y0 + 2.4, z: ZB - 0.01, rx: -90 }));
    g.add(place(cylinder(0.5, 0.5, 0.06, trimM, 12), { x, y: y0 + 2.4, z: ZB, rx: -90 }));
  }
  g.add(place(box(1.6, 1.1, 0.5, mat(PALETTE.green)), { x: HX + 1.8, y: y0, z: ZB - 0.3 }));

  // ---- the pylon: giant bowling pin sign ----------------------------------
  const px = -3.9, pz = 3.4;
  g.add(place(box(2.0, 0.6, 2.0, stoneM), { x: px, y: y0, z: pz }));
  g.add(place(tree({ kind: 'bush', h: 0.7, seed: 31 }), { x: px - 0.6, y: y0 + 0.6, z: pz + 0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.7, seed: 32 }), { x: px + 0.6, y: y0 + 0.6, z: pz + 0.6 }));
  const bladeH = 6.0, by = y0 + 0.6;
  const vTex = verticalSignTexture('pylon', ['B', 'O', 'W', 'L']);
  g.add(place(panel(1.3, bladeH, 0.45, glowing(vTex, 0.7), mat(CORAL), { double: true }), { x: px, y: by, z: pz }));
  // turquoise fin swooping up behind the blade
  const fin = profileExtrude([[-1.5, 0], [-0.2, 0], [-0.2, bladeH + 0.4], [-0.9, bladeH - 0.6]], 0.2, wallM, wallM);
  g.add(place(fin, { x: px, y: by, z: pz }));
  // platform, giant pin, atomic starburst halo
  const platY = by + bladeH;
  g.add(place(cylinder(1.0, 0.7, 0.3, fasciaM, 16), { x: px, y: platY, z: pz }));
  g.add(place(starburst(1.9, { color: PALETTE.yellow, n: 16, t: 0.09 }), { x: px, y: platY + 2.1, z: pz - 0.55 }));
  g.add(place(bowlingPin(3.8), { x: px, y: platY + 0.3, z: pz }));

  // ---- grounds -----------------------------------------------------------
  // parking for bowlers on the left
  g.add(place(parkingLot({ w: 8.2, d: 5.2, seed: 7, fill: 0.75 }), { x: -7.3, y: y0, z: -0.8, ry: 90 }));
  // entrance plaza and sidewalk
  g.add(place(patch(HW + 1, 2.6, 'cobbles'), { x: HX, y: y0, z: ZF + 1.4 }));
  g.add(place(patch(20, 1.3, 'concrete'), { y: y0, z: 4.35 }));
  // giant bowling ball sculpture on a plinth by the doors
  g.add(place(cylinder(0.6, 0.7, 0.5, trimM, 12), { x: HX - 2.6, y: y0, z: 3.25 }));
  g.add(place(bowlingBall(0.65, '#2b44b8'), { x: HX - 2.6, y: y0 + 0.5, z: 3.25, ry: -20 }));
  // palms, lamps, bench, shrubs
  g.add(place(tree({ kind: 'palm', h: 4.0, seed: 4 }), { x: 8.4, y: y0, z: 3.4 }));
  g.add(place(patch(5.2, 1.5, 'grass'), { x: -7.3, y: y0, z: 3.45 }));
  g.add(place(tree({ kind: 'palm', h: 3.4, seed: 5 }), { x: -8.3, y: y0, z: 3.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.8, seed: 6 }), { x: -6.2, y: y0, z: 3.5 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 0.4, y: y0, z: 4.6, ry: 90 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 6.8, y: y0, z: 4.6, ry: 90 }));
  g.add(place(bench({ w: 1.6 }), { x: HX + 3.0, y: y0, z: 3.4, ry: 180 }));
  for (const [x, z, s] of [[HX - 5.2, 2.0, 41], [HX + 2.4, 2.0, 42], [HX - 2.4, 2.0, 43], [HX + 5.2, 2.0, 44]]) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z }));
  }
  // open sign by the door
  g.add(place(sign({ text: 'OPEN', w: 0.9, h: 0.35, bg: '#1d2340', fg: NEON_PINK }), { x: HX + 1.4, y: y0 + 1.7, z: fz + 0.12 }));
  return g;
}

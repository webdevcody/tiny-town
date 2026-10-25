import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, group, mat, emissive, awning, door,
  bench, tree, hedge, streetLamp, rng,
} from '../../src/lib/index.js';
import {
  PASTEL, octPrism, apothem, candyStripes, waffleMat, checkerMat, bigSign,
  servingHatch, parasolTable, pushCart, menuBoard, bin,
} from './parts.js';

// Ice-cream scoop: slightly squashed sphere with a ruffled rim and sprinkles.
function scoop(r, color, seed, { drips = 0 } = {}) {
  const m = mat(color, { roughness: 0.6 });
  const g = group(place(sphere(r, m, 14), { s: [1, 0.88, 1] }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r * 0.93, r * 0.17, 6, 18), m);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = r * 0.22;
  g.add(rim);
  const rand = rng(seed);
  for (let i = 0; i < drips; i++) {
    const a = (i / drips) * Math.PI * 2 + rand.range(-0.2, 0.2);
    const len = rand.range(0.45, 0.9);
    const d = place(sphere(r * 0.16, m, 6), { s: [1, len / (r * 0.32), 1] });
    d.position.set(Math.sin(a) * r * 0.9, r * 0.25 - len, Math.cos(a) * r * 0.9);
    g.add(d);
  }
  const sprinkleCols = [PASTEL.lemon, PASTEL.sky, PALETTE.white, PASTEL.lavender, PASTEL.mintDeep, PASTEL.cherry];
  for (let i = 0; i < 40; i++) {
    const a = rand.range(0, Math.PI * 2);
    const el = rand.range(0.25, 1.35);
    const s = box(0.22, 0.06, 0.06, mat(rand.pick(sprinkleCols)));
    s.position.set(Math.cos(el) * Math.sin(a) * r * 1.0, r * 0.88 + Math.sin(el) * r * 0.88 * 0.99, Math.cos(el) * Math.cos(a) * r * 1.0);
    s.rotation.set(rand.range(0, 3), rand.range(0, 3), rand.range(0, 3));
    g.add(s);
  }
  return g;
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // ---- ground: grass beds at the back, pastel checker terrace at the front
  g.add(place(patch(10, 2.4, 'grass'), { y: y0, z: -3.8 }));
  g.add(place(patch(9.2, 3.3, checkerMat()), { y: y0, z: 3.05 }));

  // ---- kiosk: octagonal, pastel-striped, centred towards the back
  const cx = 0, cz = -0.9;
  const R = 2.5;
  const plinthH = 0.35, wallH = 2.6, fasciaH = 0.55, roofH = 0.22;
  const yWall = y0 + plinthH;
  const yFascia = yWall + wallH;
  const yRoof = yFascia + fasciaH;
  const yTop = yRoof + roofH;
  g.add(place(octPrism(R + 0.12, plinthH, mat(PASTEL.mintDeep)), { x: cx, y: y0, z: cz }));
  g.add(place(octPrism(R, wallH, candyStripes(PASTEL.pink, PASTEL.cream), mat(PASTEL.cream)), { x: cx, y: yWall, z: cz }));
  g.add(place(octPrism(R + 0.1, fasciaH, mat(PASTEL.lemon)), { x: cx, y: yFascia, z: cz }));
  g.add(place(octPrism(R + 0.45, roofH, mat(PASTEL.pinkDeep), mat(PASTEL.mint)), { x: cx, y: yRoof, z: cz }));
  // scalloped trim of bulbs round the roof edge
  const ap = apothem(R + 0.45);
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    const rr = ap / Math.cos(((a + Math.PI / 8) % (Math.PI / 4)) - Math.PI / 8);
    g.add(place(sphere(0.11, i % 2 ? emissive(PALETTE.windowLit, 0.7) : mat(PALETTE.white), 6), {
      x: cx + Math.sin(a) * rr, y: yRoof - 0.08, z: cz + Math.cos(a) * rr,
    }));
  }

  // serving hatches: front (+Z) and right (+X); striped awnings over them
  const wallAp = apothem(R);
  for (const [a, col] of [[0, PASTEL.pinkDeep], [90, PASTEL.mintDeep]]) {
    const r = THREE.MathUtils.degToRad(a);
    const fx = cx + Math.sin(r) * wallAp, fz = cz + Math.cos(r) * wallAp;
    g.add(place(servingHatch({ w: 1.45, h: 1.1, sill: 1.0 }), { x: fx, y: yWall, z: fz, ry: a }));
    g.add(place(awning({ w: 2.0, depth: 0.85, drop: 0.35, color: col, color2: PALETTE.white }), {
      x: fx, y: yFascia - 0.02, z: fz, ry: a,
    }));
  }
  // back door (-Z) and a round porthole window on the left (-X)
  g.add(place(door({ w: 0.95, h: 2.1, color: PASTEL.sky, frame: PALETTE.white }), { x: cx, y: yWall - 0.2, z: cz - wallAp, ry: 180 }));
  g.add(place(cylinder(0.5, 0.5, 0.08, mat(PALETTE.white), 14), { x: cx - wallAp - 0.02, y: yWall + 1.5, z: cz, rz: 90 }));
  g.add(place(cylinder(0.4, 0.4, 0.1, mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 }), 14), { x: cx - wallAp - 0.03, y: yWall + 1.5, z: cz, rz: 90 }));

  // ---- the giant cone on the roof
  g.add(place(cylinder(0.75, 0.9, 0.35, mat(PASTEL.lavender), 12), { x: cx, y: yTop, z: cz }));
  const coneH = 2.9, coneR = 1.7;
  const yCone = yTop + 0.35;
  g.add(place(cylinder(coneR, 0.32, coneH, waffleMat(), 14), { x: cx, y: yCone, z: cz }));
  g.add(place(cylinder(coneR + 0.12, coneR + 0.02, 0.32, mat(PASTEL.waffleDark), 14), { x: cx, y: yCone + coneH - 0.15, z: cz }));
  const s1R = 1.65;
  const yS1 = yCone + coneH - 0.45;
  g.add(place(scoop(s1R, PASTEL.strawberry, 3, { drips: 7 }), { x: cx, y: yS1, z: cz }));
  const s2R = 1.3;
  const yS2 = yS1 + s1R * 0.88 * 2 - 0.75;
  g.add(place(scoop(s2R, PASTEL.pistachio, 8, { drips: 5 }), { x: cx, y: yS2, z: cz, ry: 30 }));
  // chocolate drizzle cap, cherry and stem
  const yCap = yS2 + s2R * 0.88 * 2 - 0.35;
  g.add(place(sphere(0.6, mat(PASTEL.chocolate, { roughness: 0.4 }), 10), { x: cx, y: yCap - 0.15, z: cz, s: [1, 0.55, 1] }));
  g.add(place(sphere(0.38, mat(PASTEL.cherry, { roughness: 0.3 }), 10), { x: cx, y: yCap + 0.2, z: cz }));
  g.add(place(cylinder(0.03, 0.03, 0.6, mat(PALETTE.foliageDark), 4), { x: cx + 0.12, y: yCap + 0.85, z: cz, rz: -25 }));
  // a wafer stick poking out of the top scoop
  g.add(place(box(0.18, 1.1, 0.5, mat(PASTEL.waffle)), { x: cx - 0.7, y: yS2 + 1.4, z: cz + 0.3, rz: 25, rx: 10 }));

  // big "ICE CREAM" sign on the roof edge, in front of the cone
  const signZ = cz + apothem(R + 0.45) - 0.45;
  g.add(place(box(0.1, 0.5, 0.1, mat(PALETTE.white)), { x: cx - 1.2, y: yTop, z: signZ - 0.08 }));
  g.add(place(box(0.1, 0.5, 0.1, mat(PALETTE.white)), { x: cx + 1.2, y: yTop, z: signZ - 0.08 }));
  g.add(place(bigSign({ text: 'ICE CREAM', w: 3.4, h: 0.85, d: 0.14, bg: PASTEL.sky, fg: PASTEL.pinkDeep, border: PALETTE.white, double: true }), { x: cx, y: yTop + 0.35, z: signZ }));
  // side sign over the right hatch
  g.add(place(bigSign({ text: 'GELATO', w: 1.9, h: 0.45, d: 0.08, bg: PASTEL.lemon, fg: PASTEL.mintDeep }), {
    x: cx + apothem(R + 0.1) + 0.02, y: yFascia + 0.05, z: cz, ry: 90,
  }));
  g.add(place(bigSign({ text: 'SCOOPS', w: 1.9, h: 0.45, d: 0.08, bg: PASTEL.lemon, fg: PASTEL.pinkDeep }), {
    x: cx, y: yFascia + 0.05, z: cz + apothem(R + 0.1) + 0.02,
  }));

  // ---- terrace: parasol tables, menu board, bin, planters
  g.add(place(parasolTable({ color: PASTEL.pink, chairs: 3, seed: 1 }), { x: -3.2, y: y0 + 0.05, z: 3.1 }));
  g.add(place(parasolTable({ color: PASTEL.mintDeep, chairs: 3, seed: 2 }), { x: 3.2, y: y0 + 0.05, z: 3.1 }));
  g.add(place(menuBoard(), { x: -1.25, y: y0 + 0.05, z: 2.55, ry: 15 }));
  g.add(place(bin(), { x: 1.35, y: y0 + 0.05, z: 2.3 }));
  for (const x of [-1.3, 1.3]) {
    g.add(place(box(1.0, 0.45, 0.6, mat(PASTEL.lavender)), { x, y: y0 + 0.05, z: 4.55 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: x > 0 ? 4 : 5, color: PALETTE.foliageLight }), { x, y: y0 + 0.45, z: 4.55 }));
    for (let i = 0; i < 4; i++) {
      g.add(place(sphere(0.09, mat([PASTEL.pinkDeep, PALETTE.yellow, PALETTE.white, PASTEL.lavender][(i + (x > 0 ? 1 : 0)) % 4]), 5), {
        x: x - 0.33 + i * 0.22, y: y0 + 0.75 + (i % 2) * 0.12, z: 4.75,
      }));
    }
  }

  // ---- benches along the sides, facing the kiosk
  g.add(place(bench({ w: 1.8 }), { x: -4.3, y: y0, z: -0.6, ry: 90 }));
  g.add(place(bench({ w: 1.8 }), { x: 4.3, y: y0, z: -0.9, ry: -90 }));
  g.add(place(bin(PASTEL.pinkDeep), { x: -4.4, y: y0, z: 1.0 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 4.45, y: y0, z: 1.2, ry: 180 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -4.45, y: y0, z: -2.3 }));

  // ---- back garden: hedge, trees, push-cart
  g.add(place(hedge({ w: 9.4, h: 0.9, d: 0.55 }), { y: y0, z: -4.65 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: -3.9, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 13 }), { x: -2.6, y: y0, z: -4.0 }));
  g.add(place(pushCart(), { x: 3.3, y: y0, z: -3.5, ry: -20 }));
  return g;
}

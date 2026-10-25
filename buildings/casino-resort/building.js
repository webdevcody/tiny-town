import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, facadeCylinder, parapet, rooftopUnits, box, cylinder, cone, sphere,
  place, mat, emissive, water, tree, car, streetLamp, pool, hedge, shade,
} from '../../src/lib/index.js';
import { playingCard, die, marquee, bulbs, rectOutline } from './signs.js';

const GOLD = PALETTE.yellow;
const RED = PALETTE.red;
const gold = () => mat(GOLD, { metalness: 0.35, roughness: 0.35 });
const redDark = () => mat(shade(RED, -0.25));

// Tiered fountain with jets, base at y = 0.
function fountain(r, { tiers = 2 } = {}) {
  const g = new THREE.Group();
  const stone = mat(PALETTE.white);
  const jet = mat('#d8f2ff', { transparent: true, opacity: 0.75, emissive: '#9fdcff', emissiveIntensity: 0.25 });
  g.add(cylinder(r, r + 0.1, 0.55, stone, 20));
  g.add(place(cylinder(r - 0.25, r - 0.25, 0.08, water(PALETTE.pool), 20), { y: 0.45 }));
  g.add(place(cylinder(0.22 * r / 2.4 + 0.15, 0.3 * r / 2.4 + 0.2, 1.0 * r / 2.4, stone, 10), { y: 0.5 }));
  let y = 0.5 + 1.0 * r / 2.4;
  let br = r * 0.45;
  for (let t = 0; t < tiers; t++) {
    g.add(place(cylinder(br, br * 0.4, 0.35, gold(), 14), { y }));
    g.add(place(cylinder(br * 0.85, br * 0.85, 0.06, water(PALETTE.pool), 14), { y: y + 0.3 }));
    // water sheeting off the rim
    g.add(place(cylinder(br * 0.95, br * 1.05, Math.max(0.3, y - 0.5), jet, 14), { y: 0.5 }));
    y += 0.35;
    g.add(place(cylinder(0.12, 0.16, 0.45, stone, 8), { y }));
    y += 0.45;
    br *= 0.55;
  }
  g.add(place(cone(0.3 * r / 2.4 + 0.1, 0.8 * r / 2.4 + 0.3, jet, 8), { y }));
  // ring of arcing jets
  const n = r > 1.5 ? 8 : 0;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    g.add(place(cone(0.12, 1.4, jet, 5), { x: Math.cos(a) * (r - 0.6), y: 0.5, z: Math.sin(a) * (r - 0.6), rx: Math.sin(a) * -25, rz: Math.cos(a) * 25 }));
  }
  return g;
}

function lounger() {
  return place(box(0.7, 0.3, 1.7, mat(PALETTE.white)), {});
}

function parasol(color) {
  const g = new THREE.Group();
  g.add(cylinder(0.04, 0.04, 2, mat(PALETTE.white), 5));
  g.add(place(cone(1.1, 0.5, mat(color), 8), { y: 1.8 }));
  return g;
}

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'paved'));

  // ---- ground: porte-cochere drive loop around a fountain island ----
  g.add(place(patch(20, 4, 'asphalt'), { y: y0, z: 2 }));
  for (const sx of [-1, 1]) g.add(place(patch(2.6, 6, 'asphalt'), { x: sx * 8.7, y: y0, z: 7 }));
  // lane markings
  for (const sx of [-1, 1]) for (const z of [5, 7, 9]) g.add(place(box(0.15, 0.02, 0.9, mat(PALETTE.roadLine)), { x: sx * 8.7, y: y0 + 0.05, z }));
  g.add(place(patch(20, 1, mat(PALETTE.paving)), { y: y0, z: -0.5 }));
  // red carpet up to the doors
  g.add(place(box(2.6, 0.04, 4.2, mat(shade(RED, -0.1))), { y: y0 + 0.03, z: 1.1 }));
  for (const sx of [-1, 1]) for (const z of [-0.5, 1, 2.5]) g.add(place(cylinder(0.06, 0.06, 0.9, gold(), 6), { x: sx * 1.5, y: y0, z }));
  for (const sx of [-1, 1]) for (const z of [0.25, 1.75]) g.add(place(box(0.05, 0.06, 1.5, mat(shade(RED, -0.3))), { x: sx * 1.5, y: y0 + 0.75, z }));

  // island with the big fountain, two small ones and palms
  g.add(place(patch(14.8, 6, 'grass'), { y: y0, z: 7 }));
  g.add(place(box(14.8, 0.18, 6, mat(PALETTE.white)), { y: y0, z: 7 }));
  g.add(place(patch(14.4, 5.6, 'grass', 0.22), { y: y0, z: 7 }));
  g.add(place(cylinder(3.0, 3.0, 0.25, mat(PALETTE.paving), 24), { y: y0, z: 7 }));
  g.add(place(fountain(2.4, { tiers: 2 }), { y: y0 + 0.25, z: 7 }));
  for (const sx of [-1, 1]) {
    g.add(place(cylinder(1.25, 1.25, 0.25, mat(PALETTE.paving), 16), { x: sx * 5.2, y: y0, z: 7 }));
    g.add(place(fountain(1.0, { tiers: 1 }), { x: sx * 5.2, y: y0 + 0.25, z: 7 }));
    g.add(place(tree({ kind: 'palm', h: 6.5, seed: 31 + sx, color: PALETTE.foliageLight }), { x: sx * 6.6, y: y0 + 0.2, z: 5.0 }));
    g.add(place(tree({ kind: 'palm', h: 4.4, seed: 35 + sx }), { x: sx * 6.6, y: y0 + 0.2, z: 8.4 }));
    g.add(place(tree({ kind: 'palm', h: 3.4, seed: 38 + sx, color: PALETTE.foliageLight }), { x: sx * 3.2, y: y0 + 0.2, z: 8.6 }));
    g.add(place(hedge({ w: 2.2, h: 0.6, d: 0.6, color: PALETTE.foliage }), { x: sx * 5.2, y: y0 + 0.2, z: 9.3 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 50 + sx, color: '#d94f8a' }), { x: sx * 1.6, y: y0 + 0.2, z: 9.5 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 52 + sx, color: '#e8b02a' }), { x: sx * 1.6, y: y0 + 0.2, z: 4.5 }));
  }
  for (const sx of [-1, 1]) for (const z of [4.4, 9.6]) g.add(place(streetLamp({ h: 4 }), { x: sx * 7.2, y: y0 + 0.2, z, ry: sx > 0 ? 180 : 0, s: 0.9 }));

  // cars: white limousine at the doors, taxi and sports car on the drive
  const limo = place(car({ color: PALETTE.white }), { x: -3.2, y: y0 + 0.05, z: 2.2 });
  limo.scale.set(1.55, 1, 1);
  g.add(limo);
  g.add(place(car({ kind: 'taxi' }), { x: 8.7, y: y0 + 0.05, z: 7.3, ry: 90 }));
  g.add(place(car({ color: RED }), { x: 5.6, y: y0 + 0.05, z: 1.6 }));
  g.add(place(car({ color: PALETTE.black }), { x: -8.7, y: y0 + 0.05, z: 6.2, ry: 90 }));

  // ---- casino hall: 2 tall storeys, red walls, gold glass ----
  const hallW = 18, hallD = 8.5, hallZ = -5.25, hallH = 8;
  const hallTop = y0 + hallH;
  g.add(place(facadeBlock({ w: hallW, d: hallD, floors: 2, floorHeight: 4, style: 'grid', wall: RED, glass: PALETTE.glassGold, frame: GOLD, lit: 0.55, bay: 2.4, seed: 7, roof: PALETTE.concrete }), { y: y0, z: hallZ }));
  g.add(place(box(hallW + 0.3, 0.45, hallD + 0.3, gold()), { y: y0 + 3.8, z: hallZ }));
  g.add(place(box(hallW + 0.2, 0.6, hallD + 0.2, redDark()), { y: y0, z: hallZ }));
  g.add(place(parapet({ w: hallW + 0.4, d: hallD + 0.4, h: 1.0, t: 0.35, material: gold() }), { y: hallTop - 0.2, z: hallZ }));
  g.add(place(parapet({ w: hallW + 0.5, d: hallD + 0.5, h: 0.25, t: 0.5, material: redDark() }), { y: hallTop + 0.75, z: hallZ }));

  // lobby doors
  g.add(place(box(5, 3.4, 0.3, gold()), { y: y0, z: -1 + 0.1 }));
  g.add(place(box(4.4, 3.0, 0.35, emissive('#ffd98a', 0.7)), { y: y0, z: -1 + 0.1 }));
  for (const x of [-1.1, 0, 1.1]) g.add(place(box(0.1, 3.0, 0.4, gold()), { x, y: y0, z: -1 + 0.1 }));

  // corner turrets with red-and-gold spires
  for (const sx of [-1, 1]) {
    const tx = sx * 8.4, tz = -1.6, tr = 1.6;
    g.add(place(facadeCylinder({ radius: tr, h: 10.5, floorHeight: 3.5, style: 'curtain', glass: PALETTE.glassGold, frame: GOLD, lit: 0.5, bay: 1.6, seed: 9, roof: PALETTE.concrete }), { x: tx, y: y0, z: tz }));
    g.add(place(cylinder(tr + 0.12, tr + 0.12, 0.6, gold(), 20), { x: tx, y: y0 + 10.5, z: tz }));
    g.add(place(cone(tr + 0.05, 3.2, mat(RED, { roughness: 0.5 }), 12), { x: tx, y: y0 + 11.1, z: tz }));
    g.add(place(sphere(0.35, gold(), 10), { x: tx, y: y0 + 14.2, z: tz }));
    g.add(bulbs(Array.from({ length: 16 }, (_, i) => {
      const a = (i / 16) * Math.PI * 2;
      return [tx + Math.cos(a) * (tr + 0.15), y0 + 10.8, tz + Math.sin(a) * (tr + 0.15)];
    }), { r: 0.13 }));
  }

  // ---- gold-glass upper casino block with giant CASINO marquee ----
  const upW = 9, upD = 6, upZ = -5.5, upH = 7;
  g.add(place(facadeBlock({ w: upW, d: upD, floors: 2, floorHeight: 3.5, style: 'curtain', glass: PALETTE.glassGold, frame: GOLD, lit: 0.4, bay: 1.8, seed: 3, roof: PALETTE.concrete }), { y: hallTop, z: upZ }));
  g.add(place(parapet({ w: upW + 0.3, d: upD + 0.3, h: 0.7, t: 0.3, material: mat(RED) }), { y: hallTop + upH, z: upZ }));
  g.add(place(parapet({ w: upW + 0.5, d: upD + 0.5, h: 0.2, t: 0.4, material: gold() }), { y: hallTop + upH + 0.7, z: upZ }));
  const cz = upZ + upD / 2 + 0.25;
  g.add(place(marquee({ text: 'CASINO', w: 9.6, h: 3.2, d: 0.45, bg: RED, fg: GOLD, px: 96 }), { y: hallTop + 1.8, z: cz }));
  g.add(bulbs(rectOutline(9.8, 3.4, cz + 0.28, 0.5, hallTop + 1.7), { r: 0.14 }));

  // roof crown: giant Ace of Spades and a pair of dice
  const roofY = hallTop + upH;
  g.add(place(box(7.6, 0.7, 2.4, gold()), { y: roofY, z: upZ + 0.4 }));
  g.add(place(box(7.2, 0.12, 2.0, emissive('#fff0a0', 0.6)), { y: roofY + 0.7, z: upZ + 0.4 }));
  g.add(place(playingCard({ w: 4.6, h: 6.6, t: 0.35 }), { x: -1.5, y: roofY + 0.75, z: upZ + 0.4, rz: 9 }));
  g.add(place(die({ s: 2.4, faces: [3, 4, 5, 2, 6, 1] }), { x: 2.2, y: roofY + 0.7, z: upZ + 0.5, ry: 22 }));
  g.add(place(die({ s: 2.0, faces: [2, 5, 4, 3, 1, 6] }), { x: 2.9, y: roofY, z: upZ - 2.0, ry: -30 }));
  g.add(place(rooftopUnits({ w: 4, d: 2, count: 2, seed: 4 }), { x: -2.2, y: roofY, z: upZ - 2 }));

  // ---- porte-cochere: gold columns, glowing soffit, marquee fascia ----
  const cY = y0 + 4.6, cD = 5.2, cW = 11, cZ = -1 + cD / 2;
  g.add(place(box(cW, 0.9, cD, [gold(), gold(), mat(RED), emissive('#ffe7a8', 0.55), gold(), gold()]), { y: cY, z: cZ }));
  g.add(place(box(cW - 1, 0.5, cD - 1, mat(shade(RED, -0.1))), { y: cY + 0.9, z: cZ }));
  for (const x of [-5.1, -1.9, 1.9, 5.1]) {
    g.add(place(cylinder(0.28, 0.28, 4.6, gold(), 10), { x, y: y0, z: cZ + cD / 2 - 0.4 }));
    g.add(place(box(0.8, 0.5, 0.8, redDark()), { x, y: y0, z: cZ + cD / 2 - 0.4 }));
  }
  const fz = cZ + cD / 2 + 0.15;
  g.add(place(marquee({ text: 'GOLDEN ACE', w: cW + 0.2, h: 1.5, d: 0.3, bg: shade(RED, -0.15), fg: GOLD, px: 80 }), { y: cY - 0.3, z: fz }));
  for (const sx of [-1, 1]) g.add(place(marquee({ text: '♠ ♥ ♦ ♣', w: cD, h: 1.5, d: 0.3, bg: shade(RED, -0.15), fg: GOLD, px: 64 }), { x: sx * (cW / 2 + 0.15), y: cY - 0.3, z: cZ, ry: sx * 90 }));
  // chaser bulbs round the canopy edge
  const bpts = [];
  for (let i = 0; i <= 26; i++) {
    const x = -cW / 2 + (cW * i) / 26;
    bpts.push([x, cY - 0.4, fz + 0.18], [x, cY + 1.3, fz + 0.18]);
  }
  for (const sx of [-1, 1]) for (let i = 0; i <= 12; i++) {
    const z = -1 + (cD * i) / 12;
    bpts.push([sx * (cW / 2 + 0.33), cY - 0.4, z], [sx * (cW / 2 + 0.33), cY + 1.3, z]);
  }
  g.add(bulbs(bpts, { r: 0.12 }));

  // ---- rooftop resort deck on the left wing: pool, loungers, palms ----
  const deckY = hallTop;
  g.add(place(patch(4.3, 6.2, mat(PALETTE.paving)), { x: -6.75, y: deckY, z: -6.3 }));
  g.add(place(pool({ w: 2.2, d: 4.2 }), { x: -6.2, y: deckY + 0.05, z: -6.4 }));
  for (const z of [-4.4, -6.0, -7.6]) g.add(place(lounger(), { x: -8.2, y: deckY + 0.05, z }));
  g.add(place(parasol(RED), { x: -8.2, y: deckY, z: -5.2 }));
  g.add(place(parasol(GOLD), { x: -8.2, y: deckY, z: -6.8 }));
  for (const [x, z] of [[-8.3, -8.6], [-5.0, -8.6], [-5.0, -3.6]]) {
    g.add(place(box(0.9, 0.5, 0.9, gold()), { x, y: deckY, z }));
    g.add(place(tree({ kind: 'palm', h: 3.6, seed: Math.round(x * 7 + z) }), { x, y: deckY + 0.5, z }));
  }
  // right wing: plant and potted palms
  g.add(place(rooftopUnits({ w: 4, d: 4.4, count: 3, seed: 12 }), { x: 6.75, y: deckY, z: -6.6 }));
  for (const [x, z] of [[5.0, -3.6], [8.3, -8.6]]) {
    g.add(place(box(0.9, 0.5, 0.9, gold()), { x, y: deckY, z }));
    g.add(place(tree({ kind: 'palm', h: 3.6, seed: Math.round(x * 5 - z) }), { x, y: deckY + 0.5, z }));
  }
  return g;
}

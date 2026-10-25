import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, box, cylinder, place, mat, metal, emissive, surface,
  stairs, fence, tree, bench, awning, door, streetLamp,
} from '../../src/lib/index.js';
import {
  graffitiTexture, bigSign, muralPanel, halfPipe, halfPipeSpot, bowl, wedge, skater, skateboard, rail,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Back: graffiti half-pipe with railed decks and a banner.
// Left: raised deep bowl. Middle: stair set with a handrail and manual pad.
// Right: small skate shop with murals. Front: flat bar, kicker, ledge.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'concrete'));

  const concrete = mat('#c9c6bd');
  const concreteDark = mat('#a7a39a');
  const bowlMat = mat('#c2bfb6', { side: THREE.DoubleSide });
  const steel = metal(PALETTE.steelLight, { roughness: 0.3 });
  const yellowRail = metal(PALETTE.yellow, { roughness: 0.4 });

  // painted ground zones so the park reads from above
  g.add(place(patch(9.8, 9.8, surface('concrete', '#bdb9af', { size: 3 }), 0.02), { y: y0 }));

  // --- half-pipe along the back -------------------------------------------
  const hp = { L: 9.6, W: 2.8, R: 1.6, vert: 0.2, deck: 0.9, base: 0.25 };
  const hpZ = -3.45;
  const hpSide = mat('#ffffff', { map: graffitiTexture('halfpipe', { width: 1024, height: 220, seed: 4, lowBand: true, words: ['SK8', { text: 'tiny', size: 0.22, y: 0.86 }, { text: 'GRIND', size: 0.2, y: 0.86 }, 'RAD'] }) });
  const halfpipe = halfPipe({ ...hp, topMat: concrete, sideMat: hpSide });
  const H = halfpipe.userData.H;
  g.add(place(halfpipe, { y: y0, z: hpZ }));
  // coping pipes at the lip of each quarter pipe
  for (const sx of [-1, 1]) {
    const lipX = sx * (hp.L / 2 - hp.deck);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, hp.W, 8).rotateX(Math.PI / 2), steel);
    c.position.set(lipX, y0 + H, hpZ);
    g.add(c);
    // deck guard rails (back + outer end)
    g.add(place(fence({ w: hp.deck, d: hp.W, h: 1, style: 'railing', color: PALETTE.darkGrey, sides: ['back', sx < 0 ? 'left' : 'right'] }), { x: sx * (hp.L / 2 - hp.deck / 2 - 0.05), y: y0 + H, z: hpZ - 0.05 }));
  }
  // banner over the back of the half-pipe
  const bannerY = y0 + H + 1.3;
  for (const x of [-2.3, 2.3]) g.add(place(box(0.14, bannerY + 1.1 - y0, 0.14, metal(PALETTE.darkGrey)), { x, y: y0, z: -4.82 }));
  g.add(place(bigSign({ text: 'SKATE PARK', w: 4.8, h: 1.1, bg: '#1d1d24', fg: PALETTE.yellow, border: '#ff5fb4', double: true }), { y: bannerY, z: -4.82 }));

  // --- bowl on the left ------------------------------------------------------
  const bw = { size: 4.2, R: 1.75, Rt: 1.2, H: 1.3 };
  const bx = -2.7, bz = 0.15;
  const bowlSide = mat('#ffffff', { map: graffitiTexture('bowl', { width: 1024, height: 96, seed: 9, words: ['WOW', 'ZAP', 'BOWL', 'K!D'] }) });
  g.add(place(bowl({ ...bw, topMat: concrete, sideMat: bowlSide, innerMat: bowlMat, copingMat: steel }), { x: bx, y: y0, z: bz }));
  // railing along the back and left edges of the bowl deck
  g.add(place(fence({ w: bw.size - 0.1, d: bw.size - 0.1, h: 0.9, style: 'railing', color: PALETTE.darkGrey, sides: ['left'] }), { x: bx, y: y0 + bw.H, z: bz }));
  // steps up to the bowl deck
  g.add(place(stairs({ w: 1.2, h: bw.H, d: 1.6, steps: 5, material: concreteDark }), { x: -1.3, y: y0, z: bz + bw.size / 2 + 0.8 }));
  g.add(place(rail([-0.62, 0.9, 3.85], [-0.62, bw.H + 0.9, 2.4], 2, steel), { y: y0 }));

  // --- stair set + manual pad in the middle ----------------------------------
  const padH = 0.75;
  g.add(place(box(1.7, padH, 1.6, concreteDark), { x: 0.42, y: y0, z: -1.15 }));
  g.add(place(box(1.74, 0.06, 0.08, steel), { x: 0.42, y: y0 + padH, z: -0.37 }));
  g.add(place(stairs({ w: 1.7, h: padH, d: 1.2, steps: 3, material: concrete }), { x: 0.42, y: y0, z: 0.2 }));
  g.add(place(rail([0.42, padH + 0.55, -0.45], [0.42, 0.5, 0.9], 2, yellowRail), { y: y0 }));

  // --- skate shop on the right -----------------------------------------------
  const sx = 3.15, sz = -0.1, sw = 3.3, sd = 3.0, shopH = 3.0;
  g.add(place(facadeBlock({ w: sw, d: sd, h: shopH, floorHeight: shopH, style: 'shop', wall: '#2f8fae', glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.6, seed: 3, blank: ['left', 'right', 'back'], roof: PALETTE.concreteDark }), { x: sx, y: y0, z: sz }));
  g.add(place(parapet({ w: sw, d: sd, h: 0.35, t: 0.2, material: mat('#246f88') }), { x: sx, y: y0 + shopH, z: sz }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.red }), { x: sx - 0.9, y: y0, z: sz + sd / 2 }));
  g.add(place(awning({ w: 3.0, depth: 0.9, drop: 0.35, color: PALETTE.red, color2: PALETTE.white }), { x: sx, y: y0 + 2.5, z: sz + sd / 2 }));
  g.add(place(bigSign({ text: 'SKATE SHOP', w: 3.1, h: 0.75, bg: PALETTE.black, fg: '#ff5fb4', border: PALETTE.yellow, double: true }), { x: sx, y: y0 + shopH + 0.1, z: sz + sd / 2 - 0.05 }));
  // murals on the side walls
  const muralR = graffitiTexture('shop-r', { width: 512, height: 160, seed: 2, words: ['SHRED', 'TT'] });
  const muralL = graffitiTexture('shop-l', { width: 512, height: 160, seed: 7, words: ['OLLIE', '!!'] });
  g.add(place(muralPanel(muralR, sd - 0.1, shopH - 0.1), { x: sx + sw / 2, y: y0, z: sz, ry: 90 }));
  g.add(place(muralPanel(muralL, sd - 0.1, shopH - 0.1), { x: sx - sw / 2, y: y0, z: sz, ry: -90 }));
  // giant skateboard on the roof
  g.add(place(skateboard('#ff5fb4'), { x: sx + 0.3, y: y0 + shopH + 0.15, z: sz - 0.5, ry: 20, s: 3 }));
  // boards on a rack by the door
  g.add(place(box(0.08, 1.2, 0.08, metal(PALETTE.darkGrey)), { x: sx + 1.4, y: y0, z: sz + sd / 2 + 0.25 }));
  ['#e8344a', '#3ec46d', '#ffd23f'].forEach((c, i) => {
    g.add(place(skateboard(c), { x: sx + 1.1 - i * 0.25, y: y0 + 0.45, z: sz + sd / 2 + 0.2, rz: 90, rx: -12, s: 0.9 }));
  });

  // --- front plaza: flat bar, kicker, ledge, benches --------------------------
  g.add(place(rail([-0.4, 0.45, 3.1], [2.9, 0.45, 3.1], 2, yellowRail), { y: y0 }));
  g.add(place(wedge(1.6, 0.55, 1.3, concreteDark), { x: -3.4, y: y0, z: 3.4 }));
  g.add(place(box(0.08, 0.04, 1.3, steel), { x: -2.62, y: y0 + 0.53, z: 3.4 }));
  // concrete ledge with a steel edge
  g.add(place(box(2.6, 0.45, 0.6, concreteDark), { x: 3.3, y: y0, z: 4.35 }));
  g.add(place(box(2.62, 0.05, 0.08, steel), { x: 3.3, y: y0 + 0.45, z: 4.07 }));
  g.add(place(bench({ w: 1.4 }), { x: 0.9, y: y0, z: 4.5 }));
  g.add(place(cylinder(0.25, 0.22, 0.8, mat(PALETTE.green), 8), { x: -0.2, y: y0, z: 4.55 }));
  g.add(place(tree({ kind: 'poplar', h: 4.5, seed: 12 }), { x: -4.45, y: y0, z: 4.45 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: -2.0, y: y0, z: 4.6 }));

  // floodlights
  for (const [x, z, ry] of [[-4.75, 2.6, 0], [4.75, -1.85, 180]]) {
    g.add(place(streetLamp({ h: 6 }), { x, y: y0, z, ry }));
  }

  // --- skaters ---------------------------------------------------------------
  const ride = (opts, at) => g.add(place(skater(opts), at));
  // dropping in / carving the half-pipe
  const s1 = halfPipeSpot(hp, 58, -1);
  ride({ shirt: PALETTE.red, pants: PALETTE.navy, hat: PALETTE.black, board: PALETTE.yellow }, { x: s1.x, y: y0 + s1.y, z: hpZ + 0.4, rz: s1.rz });
  ride({ shirt: PALETTE.yellow, pants: '#3a3a3a', board: '#2bb3e0', pose: 'air' }, { x: 3.1, y: y0 + H + 0.9, z: hpZ - 0.3, rz: 28 });
  ride({ shirt: PALETTE.white, pants: PALETTE.blue, board: PALETTE.red, hat: PALETTE.red }, { x: -0.6, y: y0 + hp.base, z: hpZ + 0.6 });
  // in the bowl, up the wall
  const a = THREE.MathUtils.degToRad(40);
  const bd = bw.R - bw.Rt + bw.Rt * Math.sin(a), by = bw.Rt * (1 - Math.cos(a)) + 0.02;
  ride({ shirt: '#3ec46d', pants: PALETTE.black, board: '#ff5fb4' }, { x: bx + bd, y: y0 + by, z: bz - 0.3, rz: 40 });
  // grinding the flat bar
  ride({ shirt: '#7a4dd8', pants: '#5a7aa0', hat: PALETTE.yellow, board: PALETTE.green }, { x: 1.2, y: y0 + 0.4, z: 3.1 });
  // manual on the pad, rolling towards the stairs
  ride({ shirt: PALETTE.orange, pants: PALETTE.navy, board: PALETTE.blue }, { x: 0.2, y: y0 + padH, z: -1.3, ry: 90 });
  // chilling by the shop and on the bowl deck
  ride({ shirt: '#ff5fb4', pants: PALETTE.black, hat: PALETTE.navy, board: PALETTE.orange, pose: 'stand' }, { x: 2.0, y: y0, z: 2.2 });
  ride({ shirt: PALETTE.navy, pants: '#7a6a50', board: PALETTE.red, pose: 'stand', skin: '#8d5a3a' }, { x: -4.2, y: y0 + bw.H, z: -1.4, ry: 30 });

  return g;
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, shedRoof, box, place, cylinder, surface, mat, metal,
  smokestack, tank, tree, car, door, streetLamp, rng, sphere,
} from '../../src/lib/index.js';
import { hillShape, hillMesh, hillPath, teaBush, picker, bigSign, paintedPanel } from './parts.js';

const RAD = Math.PI / 180;

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Back/right: a rolling hill planted with contour rows of clipped tea bushes,
// pickers with baskets between the rows and a path down to the weighing shed.
// Front/left: the white, red-roofed tea drying factory with its wood-fired
// dryer chimney, firewood and a van loading tea chests.
export default function build() {
  const y0 = LOT_HEIGHT;
  const r = rng(1898);
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  // ---------------------------------------------------------------- hill
  const hill = hillShape({ cx: 2.8, cz: -2.8, R: 7.6, H: 5.4, limit: 9.55 });
  const soil = surface('grass', '#557a2c', { size: 3 });
  g.add(place(hillMesh(hill, { segments: 64, rings: 16, material: soil }), { y: y0 + 0.01 }));

  // factory block, kept clear of tea rows
  const fx = -5.75, fz = 4.4, fw = 8.0, fd = 4.6;
  const inFactory = (x, z) => x > fx - fw / 2 - 0.6 && x < fx + fw / 2 + 0.6 && z > fz - fd / 2 - 3.4 && z < fz + fd / 2 + 0.6;

  // pickers' path from the summit down the front-right slope to the shed
  const shedX = 6.8, shedZ = 7.3;
  const pathA = Math.atan2(shedZ - hill.cz, shedX - hill.cx);
  const angDiff = (a, b) => Math.abs(Math.atan2(Math.sin(a - b), Math.cos(a - b)));
  g.add(place(hillPath(hill, pathA, { t0: 0.04, t1: 1, width: 0.9, lift: 0.04, steps: 24, material: surface('gravel', PALETTE.dirt, { size: 3 }) }), { y: y0 + 0.01 }));

  // contour rows of tea bushes
  const greens = ['#5cc236', '#6bcf41', '#4fb22f', '#63c83a'];
  const rows = [0.2, 0.33, 0.46, 0.59, 0.72, 0.85, 0.975];
  for (const t of rows) {
    const y = y0 + hill.height(t) + 0.18;
    const spacing = 0.46;
    let acc = spacing;
    let prev = hill.point(0, t);
    for (let k = 0; k < 720; k++) {
      const a = (k / 720) * Math.PI * 2;
      const p = hill.point(a, t);
      acc += Math.hypot(p[0] - prev[0], p[2] - prev[2]);
      prev = p;
      if (acc < spacing) continue;
      acc = 0;
      const rad = hill.radius(a) * t;
      if (angDiff(a, pathA) * rad < 0.75) continue;
      if (inFactory(p[0], p[2])) continue;
      if (Math.abs(p[0]) > 9.6 || Math.abs(p[2]) > 9.6) continue;
      const ry = 0.5 + r.range(-0.04, 0.04);
      const b = teaBush(r.pick(greens), { rx: 0.37, ry, rz: 0.34 });
      place(b, { x: p[0], y: Math.max(y, ry + 0.02), z: p[2], ry: -(a / RAD + 90) });
      g.add(b);
    }
  }

  // silver-oak shade trees: tall thin trunks, light airy crowns
  const shadeTree = (h, seed) => {
    const tr = rng(seed);
    const crown = new THREE.Mesh(new THREE.IcosahedronGeometry(1.2, 0), mat(PALETTE.foliageDark));
    crown.scale.set(1, 0.55, 1);
    crown.position.y = h;
    crown.rotation.y = tr() * 3;
    const crown2 = crown.clone();
    crown2.scale.set(0.7, 0.45, 0.7);
    crown2.position.set(0.3, h - 1.1, -0.2);
    return new THREE.Group().add(cylinder(0.08, 0.13, h, mat(PALETTE.trunk), 6), crown, crown2);
  };
  for (const [deg, t, h] of [[200, 0.525, 4.6], [330, 0.655, 4.2], [20, 0.395, 4.4], [140, 0.785, 4.0], [260, 0.265, 4.8]]) {
    const a = deg * RAD;
    const p = hill.point(a, t);
    g.add(place(shadeTree(h, deg), { x: p[0], y: y0 + p[1] - 0.05, z: p[2] }));
  }

  // pickers between the rows, facing downhill to pluck the row below
  const outfits = [
    { dress: PALETTE.red, top: PALETTE.orange, hat: 'scarf', scarf: PALETTE.yellow },
    { dress: PALETTE.purple, top: PALETTE.pink, hat: 'cone' },
    { dress: PALETTE.blue, top: PALETTE.yellow, hat: 'scarf', scarf: PALETTE.red },
    { dress: PALETTE.orange, top: PALETTE.red, hat: 'cone' },
    { dress: '#d43f8d', top: PALETTE.white, hat: 'scarf', scarf: PALETTE.orange },
    { dress: PALETTE.yellow, top: PALETTE.blue, hat: 'cone' },
    { dress: PALETTE.red, top: PALETTE.plasterBlue, hat: 'scarf', scarf: PALETTE.white },
    { dress: PALETTE.green, top: PALETTE.orange, hat: 'cone' },
  ];
  const spots = [[40, 0.525], [98, 0.655], [118, 0.395], [160, 0.785], [10, 0.785], [250, 0.525], [315, 0.395], [52, 0.915]];
  spots.forEach(([deg, t], i) => {
    const a = deg * RAD;
    const p = hill.point(a, t);
    g.add(place(picker(outfits[i % outfits.length]), { x: p[0], y: y0 + p[1] - 0.08, z: p[2], ry: 90 - deg + r.range(-25, 25), s: 1.2 }));
  });

  // ---------------------------------------------------------------- factory
  const wall = PALETTE.white;
  const corrugated = surface('corrugated', PALETTE.roofRed, { size: 1.5 });
  const fH = 3 * FLOOR;
  g.add(place(facadeBlock({ w: fw, d: fd, floors: 3, style: 'punched', wall, frame: PALETTE.green, glass: PALETTE.window, bay: 1.4, windowW: 0.55, windowH: 0.5, lit: 0.06, seed: 7, roof: PALETTE.roofGrey }), { x: fx, y: y0, z: fz }));
  g.add(place(box(fw + 0.1, 0.55, fd + 0.1, PALETTE.green), { x: fx, y: y0, z: fz }));
  const roofH = 1.9;
  g.add(place(gableRoof({ w: fw, d: fd, h: roofH, overhang: 0.45, ridge: 'x', material: corrugated, gableMaterial: wall }), { x: fx, y: y0 + fH, z: fz }));
  // ridge ventilator (withering lofts need air)
  g.add(place(box(6, 0.6, 1.1, mat(PALETTE.darkGrey)), { x: fx, y: y0 + fH + roofH - 0.25, z: fz }));
  g.add(place(gableRoof({ w: 6, d: 1.1, h: 0.45, overhang: 0.25, ridge: 'x', material: corrugated, gableMaterial: PALETTE.darkGrey }), { x: fx, y: y0 + fH + roofH + 0.35, z: fz }));
  // estate name painted on both roof slopes
  const S = fd / 2;
  const tilt = Math.atan2(S, roofH) / RAD; // slope normal angle from vertical
  const nOff = 0.05;
  const sl = Math.hypot(S, roofH);
  const front = paintedPanel({ text: 'HILLTOP TEA', w: 7.4, h: sl * 0.62, bg: PALETTE.roofRed, fg: '#ffffff' });
  g.add(place(front, { x: fx, y: y0 + fH + roofH / 2 + nOff * Math.sin(tilt * RAD), z: fz + S / 2 + nOff * Math.cos(tilt * RAD), rx: -tilt }));
  const back = paintedPanel({ text: 'TEA FACTORY', w: 7.4, h: sl * 0.62, bg: PALETTE.roofRed, fg: '#ffffff' });
  g.add(place(back, { x: fx, y: y0 + fH + roofH / 2 + nOff * Math.sin(tilt * RAD), z: fz - S / 2 - nOff * Math.cos(tilt * RAD), rx: tilt, ry: 180 }));

  // loading dock, doors and canopy on the street side
  const fFront = fz + fd / 2;
  g.add(place(door({ w: 2.2, h: 2.6, color: PALETTE.green }), { x: fx + 1.4, y: y0, z: fFront }));
  g.add(place(box(4.2, 0.6, 1.3, PALETTE.concrete), { x: fx + 1.4, y: y0, z: fFront + 0.65 }));
  g.add(place(box(4.6, 0.12, 1.7, mat(PALETTE.roofRed)), { x: fx + 1.4, y: y0 + 3.0, z: fFront + 0.8 }));
  for (const dx of [-2.1, 2.1]) g.add(place(box(0.12, 3.0, 0.12, PALETTE.woodDark), { x: fx + 1.4 + dx, y: y0, z: fFront + 1.55 }));
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.woodDark }), { x: fx - 2.6, y: y0, z: fFront }));

  // dryer house behind the factory with the wood-fired furnace chimney
  const ax = fx - 0.8, az = fz - fd / 2 - 1.4;
  g.add(place(facadeBlock({ w: 5.2, d: 2.8, h: 3.4, floorHeight: 3.4, style: 'industrial', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window, bay: 1.7, seed: 4, roof: PALETTE.roofGrey }), { x: ax, y: y0, z: az }));
  g.add(place(gableRoof({ w: 5.2, d: 2.8, h: 0.9, overhang: 0.25, ridge: 'x', material: surface('corrugated', PALETTE.steel, { size: 1.5 }), gableMaterial: PALETTE.brick }), { x: ax, y: y0 + 3.4, z: az }));
  const stackX = -9.15;
  g.add(place(smokestack({ radius: 0.6, topRadius: 0.42, h: 13.5, color: PALETTE.brick, bandColor: PALETTE.white, bands: 1, segments: 10 }), { x: stackX, y: y0, z: az - 0.4 }));
  // a wisp of smoke
  const smokeM = mat('#d8d8d8', { transparent: true, opacity: 0.75 });
  for (const [dx, dy, s] of [[0.1, 14.2, 0.55], [0.6, 15.0, 0.7], [1.3, 15.7, 0.8]]) g.add(place(sphere(s, smokeM, 8), { x: stackX + dx, y: y0 + dy, z: az - 0.4 }));

  // firewood stacks for the dryer
  const logM = mat('#8a5a32');
  const logPile = (len, seed) => {
    const pg = new THREE.Group();
    const lr = rng(seed);
    const lr0 = 0.17;
    for (let row = 0; row < 4; row++) {
      for (let i = 0; i < 5 - row; i++) {
        const l = new THREE.Mesh(new THREE.CylinderGeometry(lr0, lr0, len + lr.range(-0.2, 0.2), 7).rotateZ(Math.PI / 2), logM);
        l.position.set(lr.range(-0.1, 0.1), row * lr0 * 1.7, (i - (4 - row) / 2) * lr0 * 2);
        pg.add(l);
      }
    }
    return pg;
  };
  g.add(place(logPile(2.4, 3), { x: -8.3, y: y0 + 0.17, z: -2.9 }));
  g.add(place(logPile(2.4, 4), { x: -5.6, y: y0 + 0.17, z: -2.9 }));
  g.add(place(logPile(2.2, 5), { x: -8.3, y: y0 + 0.17, z: -5.3, ry: 4 }));

  // estate water tank and trees in the back corner
  g.add(place(tank({ radius: 1.0, h: 1.6, roof: 'cone', legs: 4, legHeight: 3.2, material: mat(PALETTE.steelLight) }), { x: -5.4, y: y0, z: -7.6 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 31 }), { x: -8.6, y: y0, z: -8.4 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 32 }), { x: -2.8, y: y0, z: -9.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 33 }), { x: -9.2, y: y0, z: -0.8 }));

  // ---------------------------------------------------------------- yard & street side
  g.add(place(patch(10.2, 3.7, 'gravel'), { x: -4.9, y: y0, z: 8.15 }));
  g.add(place(patch(6.4, 1.4, 'dirt'), { x: 2.2, y: y0, z: 8.4 }));
  g.add(place(car({ kind: 'van', color: PALETTE.green }), { x: -7.4, y: y0 + 0.05, z: 8.4 }));
  // tea chests waiting on the dock and in the yard
  const chestM = mat('#c9a46a');
  const chestTop = mat('#b38a52');
  const chest = () => new THREE.Group().add(box(0.6, 0.6, 0.6, chestM), place(box(0.62, 0.06, 0.62, chestTop), { y: 0.57 }));
  for (const [x, y, z] of [[-4.6, 0.6, 7.25], [-4.0, 0.6, 7.25], [-3.4, 0.6, 7.25], [-4.3, 1.2, 7.25], [-3.7, 1.2, 7.25], [-4.6, 0, 8.4], [-4.0, 0, 8.4], [-4.3, 0.6, 8.4]]) g.add(place(chest(), { x, y: y0 + y, z }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -0.8, y: y0, z: 9.4, ry: 180 }));

  // estate sign by the entrance
  for (const dx of [-1.7, 1.7]) g.add(place(box(0.15, 1.5, 0.15, PALETTE.woodDark), { x: 2.2 + dx, y: y0, z: 9.55 }));
  g.add(place(bigSign({ text: 'HILLTOP TEA ESTATE', w: 4.2, h: 0.85, bg: PALETTE.green, fg: '#ffffff', border: PALETTE.yellow }), { x: 2.2, y: y0 + 1.25, z: 9.62 }));

  // leaf collection / weighing shed at the foot of the pickers' path
  const rim = hill.point(pathA, 1);
  const pdx = shedX - rim[0], pdz = shedZ - 1.4 - rim[2];
  g.add(place(patch(0.9, Math.hypot(pdx, pdz) + 0.6, 'dirt'), { x: rim[0] + pdx / 2, y: y0, z: rim[2] + pdz / 2, ry: Math.atan2(pdx, pdz) / RAD }));
  g.add(place(patch(4.4, 3.4, 'dirt'), { x: shedX, y: y0, z: shedZ }));
  const sw = 3.6, sd = 2.4;
  for (const [dx, dz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.14, dz < 0 ? 2.7 : 2.3, 0.14, PALETTE.woodDark), { x: shedX + (dx * sw) / 2, y: y0, z: shedZ + (dz * sd) / 2 }));
  g.add(place(shedRoof({ w: sw, d: sd, h: 0.45, overhang: 0.3, material: surface('corrugated', PALETTE.steelLight, { size: 1.2 }), wallMaterial: PALETTE.woodDark }), { x: shedX, y: y0 + 2.3, z: shedZ }));
  g.add(place(box(sw, 0.9, 0.08, PALETTE.wood), { x: shedX, y: y0, z: shedZ - sd / 2 }));
  // scale on a table
  g.add(place(box(1.4, 0.8, 0.7, PALETTE.wood), { x: shedX - 0.6, y: y0, z: shedZ - 0.3 }));
  g.add(place(box(0.6, 0.12, 0.6, metal(PALETTE.steelLight)), { x: shedX - 0.6, y: y0 + 0.8, z: shedZ - 0.3 }));
  g.add(place(cylinder(0.22, 0.22, 0.08, mat(PALETTE.white), 12), { x: shedX - 0.6, y: y0 + 1.15, z: shedZ - 0.55, rx: 90 }));
  g.add(place(box(0.06, 0.35, 0.06, metal(PALETTE.steelDark)), { x: shedX - 0.6, y: y0 + 0.9, z: shedZ - 0.55 }));
  // sacks of fresh leaf
  const sackM = mat('#e6dfc6');
  const leafTop = mat('#62c23c');
  for (const [dx, dz] of [[0.6, -0.5], [1.15, -0.5], [0.85, 0.05], [1.3, 0.1]]) {
    g.add(place(cylinder(0.24, 0.27, 0.65, sackM, 8), { x: shedX + dx, y: y0, z: shedZ + dz }));
    g.add(place(sphere(0.23, leafTop, 8), { x: shedX + dx, y: y0 + 0.6, z: shedZ + dz, s: [1, 0.45, 1] }));
  }
  // pickers queueing to weigh their baskets, one emptying a basket
  g.add(place(picker({ dress: PALETTE.purple, top: PALETTE.yellow, hat: 'scarf', scarf: PALETTE.pink }), { x: shedX - 0.7, y: y0, z: shedZ + 1.5, ry: 180 }));
  g.add(place(picker({ dress: PALETTE.orange, top: PALETTE.green, hat: 'cone' }), { x: shedX - 1.9, y: y0, z: shedZ + 2.1, ry: 150 }));
  g.add(place(picker({ dress: PALETTE.navy, top: PALETTE.white, hat: 'scarf', scarf: PALETTE.navy, basket: false }), { x: shedX - 0.4, y: y0, z: shedZ - 0.9, ry: 0 }));

  // hedges along the street edge either side of the shed
  g.add(place(box(1.6, 0.8, 0.6, PALETTE.foliageDark), { x: 9.0, y: y0, z: 9.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 41 }), { x: 4.6, y: y0, z: 9.4 }));
  return g;
}

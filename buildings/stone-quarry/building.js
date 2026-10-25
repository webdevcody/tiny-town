import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, beam, mat, metal, surface, tree, facadeBlock, car, door,
} from '../../src/lib/index.js';
import {
  rockFace, crushed, bigSign, excavator, dumpTruck, rockHeap, boulder, stockpile,
  crusher, conveyor, floodlight,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front faces +z.
// The quarry is a U-shaped stepped pit: three working benches plus a grassy
// rim climb up the back and both sides; the open front is the pit mouth where
// the crusher sits and the conveyors throw gravel onto the stockpiles.

const Y0 = LOT_HEIGHT;
const STEP = 1.5;          // bench height
const SIDE = 1.6;          // bench width on the sides
const BACK = 2.2;          // bench width at the back
const FLOOR_X = 3.6;       // half width of the pit floor
const FLOOR_Z = -1.2;      // back edge of the pit floor
const ARM_END = [7.5, 5.5, 3.5, 1.5]; // front end of each level's side arms

const LEVELS = [1, 2, 3, 4].map((k) => ({
  k,
  top: Y0 + k * STEP,
  xi: FLOOR_X + SIDE * (k - 1),
  xo: FLOOR_X + SIDE * k,
  zi: FLOOR_Z - BACK * (k - 1),
  zo: FLOOR_Z - BACK * k,
  zEnd: ARM_END[k - 1],
}));

/** Height of the terrain (top of benches) at x, z. */
function groundAt(x, z) {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    const L = LEVELS[i];
    const inBack = Math.abs(x) <= L.xo && z >= L.zo && z <= L.zi;
    const inArm = Math.abs(x) >= L.xi && Math.abs(x) <= L.xo && z >= L.zi && z <= L.zEnd;
    if (inBack || inArm) return L.top;
  }
  return Y0;
}

function terraces() {
  const g = new THREE.Group();
  const face = rockFace('#9c988f', 3);
  const faceDark = rockFace('#86827a', 3);
  const benchTop = crushed('#b2ada3', 3);
  const rimTop = surface('grass', PALETTE.grass, { size: 4 });
  for (const L of LEVELS) {
    const h = L.top;
    const top = L.k === 4 ? rimTop : benchTop;
    const f = L.k % 2 ? face : faceDark;
    const mats = [f, f, top, f, f, f];
    // back slab
    const bw = L.xo * 2, bd = L.zi - L.zo;
    g.add(place(box(bw, h, bd, mats), { y: 0, z: (L.zi + L.zo) / 2 }));
    // side arms
    const ad = L.zEnd - L.zi;
    for (const s of [-1, 1]) g.add(place(box(SIDE, h, ad, mats), { x: s * (L.xi + SIDE / 2), z: (L.zi + L.zEnd) / 2 }));
  }
  return g;
}

/** Simple post-and-rail safety fence along a polyline at height y. */
function edgeFence(points, y, color = PALETTE.orange) {
  const g = new THREE.Group();
  const m = mat(color);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const len = Math.hypot(bx - ax, bz - az);
    const n = Math.max(1, Math.round(len / 2));
    for (let j = 0; j <= n; j++) {
      const t = j / n;
      g.add(place(box(0.08, 0.9, 0.08, m), { x: ax + (bx - ax) * t, y, z: az + (bz - az) * t }));
    }
    for (const ry of [0.45, 0.85]) g.add(beam([ax, y + ry, az], [bx, y + ry, bz], 0.05, m));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'gravel'));
  g.add(terraces());

  // pit floor: crushed stone, a darker haul track and a puddle
  g.add(place(patch(FLOOR_X * 2, 10 - FLOOR_Z, crushed('#a09a8f', 3), 0.04), { y: Y0, z: (10 + FLOOR_Z) / 2 }));
  g.add(place(patch(3.2, 9, crushed('#7f7a72', 2), 0.06), { x: 1.0, y: Y0, z: 3.5 }));
  g.add(place(patch(1.6, 1.1, mat(PALETTE.waterDeep, { roughness: 0.2 }), 0.07), { x: -2.6, y: Y0, z: 5.4 }));

  // ---- working face: blasted muck pile at the back wall, excavator loading a truck
  g.add(place(rockHeap(1.6, 1.1, 3), { x: -2.4, y: Y0, z: -0.3 }));
  g.add(place(boulder(0.55, 4), { x: -0.6, y: Y0, z: -0.6 }));
  g.add(place(boulder(0.4, 5), { x: -3.2, y: Y0, z: 1.1 }));
  g.add(place(boulder(0.35, 6), { x: 3.1, y: Y0, z: 6.6 }));
  g.add(place(excavator({ pose: 'raise' }), { x: -2.3, y: Y0 + 0.04, z: 1.0, ry: -90, s: 0.9 }));
  g.add(place(dumpTruck({ load: true }), { x: -2.1, y: Y0 + 0.06, z: 6.0, ry: -90, s: 0.85 }));

  // ---- mobile jaw crusher, fed from the first bench by a second excavator
  const b1 = LEVELS[0];
  g.add(place(crusher(), { x: 1.4, y: Y0, z: 2.9, ry: -90, s: 0.9 }));
  g.add(place(excavator({ pose: 'raise', color: PALETTE.orange }), { x: 1.4, y: b1.top, z: (b1.zi + b1.zo) / 2 - 0.1, ry: -90, s: 0.9 }));

  // discharge conveyor up to the crushed-stone stockpile in the front-right corner
  g.add(conveyor([1.4, 1.1, 5.2], [7.6, 5.4, 7.5], { groundAt }));
  g.add(place(stockpile(2.2, 3.8, '#bdb8ae'), { x: 7.6, y: Y0, z: 7.5 }));

  // a third excavator high up on the back bench, breaking out new rock
  const b3 = LEVELS[2];
  g.add(place(excavator({ pose: 'dig', color: PALETTE.yellow }), { x: -4.2, y: b3.top, z: (b3.zi + b3.zo) / 2, ry: 0, s: 0.8 }));
  g.add(place(rockHeap(0.8, 0.6, 9), { x: 1.4, y: b3.top, z: (b3.zi + b3.zo) / 2 }));

  // ---- front: empty truck rolling in, sand pile, site office
  g.add(place(dumpTruck({ load: false, color: PALETTE.yellow }), { x: 1.9, y: Y0 + 0.06, z: 8.7, ry: 180, s: 0.85 }));
  g.add(place(stockpile(1.6, 2.2, '#c9b48a'), { x: -8.2, y: Y0, z: 4.4 }));
  g.add(place(stockpile(1.0, 1.2, '#8d8880'), { x: -6.0, y: Y0, z: 5.6 }));
  const off = facadeBlock({ w: 4.2, d: 2.4, floors: 1, style: 'punched', wall: PALETTE.white, frame: PALETTE.white, glass: PALETTE.window, bay: 1.4, windowW: 0.6, roof: PALETTE.steelLight, seed: 3 });
  g.add(place(off, { x: -7.5, y: Y0 + 0.2, z: 8.4 }));
  g.add(place(box(4.4, 0.2, 2.6, mat(PALETTE.darkGrey)), { x: -7.5, y: Y0, z: 8.4 }));
  g.add(place(box(4.4, 0.12, 2.6, mat(PALETTE.steelLight)), { x: -7.5, y: Y0 + 3.2, z: 8.4 }));
  g.add(place(box(4.25, 0.35, 0.05, mat(PALETTE.blue)), { x: -7.5, y: Y0 + 2.7, z: 9.72 }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.steelDark }), { x: -6.3, y: Y0 + 0.2, z: 9.6 }));
  g.add(place(car({ color: PALETTE.red }), { x: -4.4, y: Y0, z: 8.5, ry: 90, s: 0.6 }));

  // ---- big sign on the back rim
  const rim = LEVELS[3];
  const signY = rim.top;
  for (const x of [-3.6, 3.6]) g.add(place(box(0.2, 1.4, 0.2, metal(PALETTE.steelDark)), { x, y: signY, z: (rim.zi + rim.zo) / 2 }));
  g.add(place(bigSign({ text: 'STONE QUARRY', w: 8.4, h: 1.5, bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.yellow }), { y: signY + 1.3, z: (rim.zi + rim.zo) / 2 }));

  // rim: safety fence, trees, floodlights
  const fx = rim.xi - 0.2, fz = rim.zi - 0.2;
  g.add(edgeFence([[-fx, rim.zEnd - 0.2], [-fx, fz], [fx, fz], [fx, rim.zEnd - 0.2]], rim.top));
  for (const [x, z, k, s] of [[-8.9, -8.9, 'round', 31], [8.9, -8.9, 'cone', 32], [-8.9, -3.5, 'cone', 33], [8.9, -4.6, 'round', 34], [-6.0, -9.3, 'bush', 35], [6.4, -9.3, 'bush', 36]]) {
    g.add(place(tree({ kind: k, h: k === 'bush' ? 1.2 : 3.6, seed: s }), { x, y: rim.top, z }));
  }
  // scrub hanging over the outer (uncut) walls so the back isn't a blank cliff
  const scrub = mat(PALETTE.foliageDark);
  const scrubLight = mat(PALETTE.foliage);
  for (const [x, z, w, h, ry, light] of [
    [-6.5, -9.95, 2.4, 1.6, 0, 0], [-1.2, -9.95, 1.4, 0.9, 0, 1], [4.6, -9.95, 3.0, 2.1, 0, 0], [8.4, -9.95, 1.2, 0.8, 0, 1],
    [-9.95, -7.2, 2.6, 1.8, 90, 1], [-9.95, -1.6, 1.5, 1.0, 90, 0], [9.95, -6.0, 2.2, 1.4, 90, 0], [9.95, -1.0, 1.4, 2.2, 90, 1],
  ]) {
    g.add(place(box(w, h, 0.12, light ? scrubLight : scrub), { x, z, y: rim.top - h, ry }));
    g.add(place(box(w * 0.5, h * 0.6, 0.12, light ? scrub : scrubLight), { x: x + (ry ? 0 : w * 0.3), z: z + (ry ? w * 0.3 : 0), y: rim.top - h - h * 0.3, ry }));
  }
  g.add(place(floodlight(5), { x: -9.2, y: rim.top, z: 0.6, ry: -90 }));
  g.add(place(floodlight(5), { x: 9.2, y: rim.top, z: 0.6, ry: 90 }));

  return g;
}

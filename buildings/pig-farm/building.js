import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, lot, patch, box, cylinder, place, mat, pipe, tree, rng,
} from '../../src/lib/index.js';
import {
  mudMaterial, pigArk, pig, farmer, feedBin, railFence, tubeGate, trough,
  farmSign, wheelbarrow, strawStack,
} from './parts.js';

// 1x1 tile (10 x 10 m). Front (lane) faces +z.
// Two muddy pens: a wallow pen (front-left) and an ark pen (right),
// feed bin in the back-left corner, farmer with a bucket in the lane.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const mud = mudMaterial();
  const wallowM = mat('#4a3524', { roughness: 0.55 });

  // fenced rectangle helper: pen from (x0,z0) to (x1,z1), optional gate gap on the front
  const pen = (x0, z0, x1, z1, gate) => {
    g.add(place(patch(x1 - x0, z1 - z0, mud), { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2 }));
    g.add(place(railFence(x1 - x0), { x: x0, y: y0, z: z0 }));
    g.add(place(railFence(z1 - z0), { x: x0, y: y0, z: z1, ry: 90 }));
    g.add(place(railFence(z1 - z0), { x: x1, y: y0, z: z1, ry: 90 }));
    if (gate) {
      const [ga, gb] = gate;
      g.add(place(railFence(ga - x0), { x: x0, y: y0, z: z1 }));
      g.add(place(railFence(x1 - gb), { x: gb, y: y0, z: z1 }));
      // gate swung open into the lane
      g.add(place(tubeGate(gb - ga - 0.1), { x: ga + 0.05, y: y0, z: z1, ry: -60 }));
    } else {
      g.add(place(railFence(x1 - x0), { x: x0, y: y0, z: z1 }));
    }
  };

  // ---- pens
  const L = { x0: -4.75, z0: -1.9, x1: -0.45, z1: 3.3 };
  const R = { x0: 0.05, z0: -4.75, x1: 4.75, z1: 3.3 };
  pen(L.x0, L.z0, L.x1, L.z1);
  pen(R.x0, R.z0, R.x1, R.z1, [1.0, 2.3]);

  // trampled mud spilling out of the gate into the lane
  g.add(place(patch(1.6, 1.2, mud), { x: 1.65, y: y0, z: 3.95 }));
  g.add(place(patch(10, 0.9, 'dirt'), { y: y0 - 0.01, z: 4.45 }));

  // ---- wallow pen (left): a big puddle, lounging pigs, trough fed by the auger
  const wallow = cylinder(1, 1, 0.03, wallowM, 18);
  wallow.scale.set(1.45, 1, 1.05);
  g.add(place(wallow, { x: -2.7, y: y0 + 0.05, z: 1.4 }));
  const puddle = cylinder(1, 1, 0.03, wallowM, 14);
  puddle.scale.set(0.5, 1, 0.35);
  g.add(place(puddle, { x: -1.3, y: y0 + 0.05, z: -0.6 }));

  g.add(place(pig({ pose: 'lie' }), { x: -3.35, y: y0 + 0.02, z: 1.95, ry: 15 }));
  g.add(place(pig({ pose: 'lie', spots: true }), { x: -2.1, y: y0 + 0.02, z: 0.75, ry: 205 }));
  g.add(place(pig({ pose: 'stand' }), { x: -1.4, y: y0 + 0.05, z: 2.4, ry: -110 }));
  g.add(place(pig({ pose: 'eat' }), { x: -3.4, y: y0 + 0.05, z: -0.7, ry: 90 }));
  g.add(place(pig({ pose: 'eat' }), { x: -2.4, y: y0 + 0.05, z: -0.75, ry: 80 }));

  // trough along the back fence of the wallow pen
  g.add(place(trough({ len: 2.6 }), { x: -3.0, y: y0 + 0.05, z: -1.55 }));

  // ---- feed bin (back-left) with auger into the wallow-pen trough
  const binX = -3.6, binZ = -3.55;
  g.add(place(patch(2.6, 2.4, 'gravel'), { x: binX + 0.2, y: y0, z: binZ }));
  g.add(place(box(1.7, 0.15, 1.7, mat(PALETTE.concrete)), { x: binX, y: y0, z: binZ }));
  g.add(place(feedBin(), { x: binX, y: y0 + 0.15, z: binZ }));
  const steel = mat(PALETTE.steel, { metalness: 0.4, roughness: 0.4 });
  g.add(pipe([binX, y0 + 0.95, binZ], [binX + 0.4, y0 + 1.45, -1.75], 0.09, steel));
  g.add(pipe([binX + 0.4, y0 + 1.45, -1.75], [binX + 0.4, y0 + 0.45, -1.6], 0.07, steel));
  g.add(place(box(0.35, 0.35, 0.35, mat(PALETTE.steelDark)), { x: binX, y: y0 + 0.75, z: binZ + 0.35 })); // auger motor

  // straw stack beside the bin
  g.add(place(strawStack(), { x: -1.4, y: y0, z: -3.6 }));

  // ---- ark pen (right): two curved corrugated arks, troughs, sows and piglets
  g.add(place(pigArk({}), { x: 1.25, y: y0 + 0.05, z: -3.35 }));
  g.add(place(pigArk({ endColor: '#9fb46a' }), { x: 3.55, y: y0 + 0.05, z: -3.35 }));
  g.add(place(trough({ len: 2.2 }), { x: 2.6, y: y0 + 0.05, z: 0.15 }));
  // round water drinker
  g.add(place(cylinder(0.4, 0.35, 0.45, mat(PALETTE.steel, { metalness: 0.4 }), 12), { x: 4.15, y: y0 + 0.05, z: 2.4 }));
  g.add(place(cylinder(0.34, 0.34, 0.02, mat(PALETTE.water, { roughness: 0.1 }), 12), { x: 4.15, y: y0 + 0.47, z: 2.4 }));

  g.add(place(pig({ pose: 'eat' }), { x: 2.2, y: y0 + 0.05, z: 0.85, ry: 90 }));
  g.add(place(pig({ pose: 'eat', spots: true }), { x: 3.15, y: y0 + 0.05, z: 0.9, ry: 95 }));
  g.add(place(pig({ pose: 'eat' }), { x: 2.7, y: y0 + 0.05, z: -0.6, ry: -88 }));
  g.add(place(pig({ pose: 'stand' }), { x: 1.0, y: y0 + 0.05, z: 2.1, ry: 35 }));
  g.add(place(pig({ pose: 'stand' }), { x: 3.4, y: y0 + 0.05, z: 2.3, ry: 160 }));
  g.add(place(pig({ pose: 'lie' }), { x: 4.0, y: y0 + 0.02, z: -1.6, ry: 100 }));
  // piglets outside the arks
  const r = rng(42);
  for (const [x, z] of [[0.9, -1.6], [1.4, -1.45], [1.15, -1.95], [3.3, -1.75], [3.0, -1.5]]) {
    g.add(place(pig({ pose: 'stand' }), { x, y: y0 + 0.05, z, ry: r.range(0, 360), s: 0.5 }));
  }

  // ---- lane: farmer with a bucket, sign, wheelbarrow, bush
  g.add(place(farmer(), { x: 0.65, y: y0, z: 4.2, ry: 35, s: 1.1 }));
  g.add(place(farmSign(), { x: -2.7, y: y0, z: 4.0 }));
  g.add(place(wheelbarrow(), { x: 3.7, y: y0, z: 4.35, ry: 10 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 8 }), { x: -4.5, y: y0, z: 4.3 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 12 }), { x: -0.2, y: y0, z: -3.95 }));
  return g;
}

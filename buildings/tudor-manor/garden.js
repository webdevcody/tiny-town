// Garden pieces for the Tudor manor: clipped topiary, a box-hedge knot garden,
// tall clustered brick chimneys and gate piers.

import * as THREE from 'three';
import { PALETTE, mat, surface, box, cylinder, cone, place, group, patch } from '../../src/lib/index.js';

const YEW = '#2c5a27';
const BOX = '#3f7a2e';

const leaf = (c) => mat(c, { roughness: 0.9 });
const ball = (r, c) => new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), leaf(c));

/** Clipped topiary. kind: 'cone' | 'ball' (lollipop) | 'tiered' (wedding cake) | 'spiral' */
export function topiary(kind, h = 2) {
  const g = new THREE.Group();
  const pot = mat(PALETTE.terracotta);
  if (kind === 'cone') {
    g.add(cylinder(0.12, 0.12, 0.2, mat(PALETTE.trunk), 6));
    g.add(place(cone(h * 0.28, h * 0.92, leaf(YEW), 10), { y: 0.1 }));
  } else if (kind === 'ball') {
    g.add(cylinder(0.32, 0.25, 0.45, pot, 10));
    g.add(place(cylinder(0.05, 0.05, h * 0.6, mat(PALETTE.trunk), 5), { y: 0.4 }));
    g.add(place(ball(h * 0.24, BOX), { y: h * 0.75 }));
  } else if (kind === 'tiered') {
    g.add(cylinder(0.1, 0.12, h * 0.15, mat(PALETTE.trunk), 6));
    const tiers = 3;
    for (let i = 0; i < tiers; i++) {
      const r = h * (0.32 - i * 0.08);
      const b = ball(r, YEW);
      b.scale.set(1, 0.62, 1);
      b.position.y = h * (0.2 + i * 0.3);
      g.add(b);
    }
    g.add(place(ball(h * 0.06, YEW), { y: h * 0.98 }));
  } else if (kind === 'spiral') {
    g.add(cylinder(0.3, 0.24, 0.4, pot, 10));
    for (let i = 0; i < 4; i++) {
      const r = h * (0.22 - i * 0.045);
      const b = ball(r, BOX);
      b.scale.set(1, 0.7, 1);
      b.position.y = 0.4 + h * (0.12 + i * 0.22);
      g.add(b);
    }
  }
  return g;
}

/** Square knot garden (side s) on gravel: box border, diagonals, ring, flowers, topiary centre. */
export function knotGarden(s, { flower = '#b04a7a', flower2 = '#d84a3a' } = {}) {
  const g = new THREE.Group();
  const hedgeM = leaf(BOX);
  const hh = 0.38, t = 0.26;
  g.add(patch(s, s, 'gravel', 0.04));
  const half = s / 2 - t / 2;
  // outer border
  for (const [x, z, w, d] of [[0, half, s, t], [0, -half, s, t], [half, 0, t, s - 2 * t], [-half, 0, t, s - 2 * t]]) {
    g.add(place(box(w, hh, d, hedgeM), { x, z }));
  }
  // diagonals (cut short of the centre ring)
  const diag = Math.SQRT2 * (s - 2 * t);
  for (const ry of [45, -45]) {
    g.add(place(box(diag * 0.95, hh * 0.85, t * 0.9, hedgeM), { ry }));
  }
  // centre ring + inner square on the cross axes
  const ring = new THREE.Mesh(new THREE.TorusGeometry(s * 0.26, t * 0.55, 5, 28), hedgeM);
  ring.rotation.x = -Math.PI / 2;
  ring.position.y = hh * 0.5;
  g.add(ring);
  for (const ry of [0, 90]) g.add(place(box(s - 2 * t, hh * 0.7, t * 0.8, hedgeM), { ry }));
  // flower beds in the four triangular compartments outside the ring
  const fm = [mat(flower, { roughness: 0.9 }), mat(flower2, { roughness: 0.9 })];
  const q = s * 0.36;
  for (const [i, [x, z]] of [[q, 0], [-q, 0], [0, q], [0, -q]].entries()) {
    g.add(place(box(s * 0.12, 0.16, s * 0.12, fm[i % 2]), { x, z, ry: 45 }));
  }
  g.add(place(topiary('cone', 1.5), { y: 0 }));
  return g;
}

const brickM = () => surface('brick', PALETTE.brick, { size: 1 });

/**
 * Tall clustered chimney: a brick stack with `n` octagonal shafts in a row along X.
 * Base at y = 0; stackH = plain stack height, shaftH = shaft height above it.
 */
export function clusteredChimney({ n = 3, stackH = 3, shaftH = 2.4, depth = 0.9 } = {}) {
  const g = new THREE.Group();
  const pitch = 0.62;
  const w = n * pitch + 0.25;
  const brick = brickM();
  const stone = mat(PALETTE.stone);
  g.add(box(w, stackH, depth, brick));
  g.add(place(box(w + 0.18, 0.18, depth + 0.18, stone), { y: stackH }));
  const y = stackH + 0.18;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * pitch;
    const shaft = group(
      cylinder(0.3, 0.3, 0.3, brick, 8),
      place(cylinder(0.23, 0.23, shaftH, brick, 8), { y: 0.3 }),
      place(cylinder(0.33, 0.25, 0.22, brick, 8), { y: 0.3 + shaftH }),
      place(cylinder(0.25, 0.33, 0.14, stone, 8), { y: 0.52 + shaftH }),
      place(cylinder(0.13, 0.13, 0.12, mat(PALETTE.black), 8), { y: 0.62 + shaftH }),
    );
    g.add(place(shaft, { x, y, ry: (i % 2) * 22.5 })); // alternate the octagons
  }
  return g;
}

/** Brick gate pier with a stone ball finial. */
export function gatePier(h = 1.7) {
  return group(
    box(0.6, h, 0.6, brickM()),
    place(box(0.72, 0.14, 0.72, mat(PALETTE.stone)), { y: h }),
    place(new THREE.Mesh(new THREE.IcosahedronGeometry(0.24, 1), mat(PALETTE.stone)), { y: h + 0.36 }),
  );
}

/** Low brick wall with stone coping, length along X. */
export function lowWall(w, h = 0.75) {
  return group(
    box(w, h, 0.32, brickM()),
    place(box(w, 0.08, 0.42, mat(PALETTE.stone)), { y: h }),
  );
}

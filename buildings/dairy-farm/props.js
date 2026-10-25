import * as THREE from 'three';
import { PALETTE, rng, box, cylinder, place, mat, metal } from '../../src/lib/index.js';

const PINK = '#e3a5a0';

/**
 * Holstein cow, ~2.2 m long, faces +X, origin on the ground under its middle.
 *   cow({ seed, head: 'white' | 'black', graze })
 */
export function cow({ seed = 1, head = 'white', graze = false } = {}) {
  const r = rng(seed);
  const white = mat(PALETTE.white);
  const black = mat('#25221f');
  const g = new THREE.Group();
  const L = 1.8, H = 0.8, W = 0.78, by = 0.62;
  g.add(place(box(L, H, W, white), { y: by }));
  // black patches wrapping the body
  const n = r.int(2, 3);
  for (let i = 0; i < n; i++) {
    const pl = r.range(0.35, 0.65);
    const px = -L / 2 + pl / 2 + 0.05 + (i * (L - pl - 0.1)) / Math.max(1, n - 1) + r.range(-0.1, 0.1);
    const ph = r.range(0.45, 0.82);
    g.add(place(box(pl, ph, W + 0.03, black), { x: Math.max(-L / 2 + pl / 2, Math.min(L / 2 - pl / 2, px)), y: by + H + 0.015 - ph }));
  }
  // legs
  for (const lx of [-0.68, 0.68]) for (const lz of [-0.24, 0.24]) {
    g.add(place(box(0.18, by, 0.18, white), { x: lx, z: lz }));
    g.add(place(box(0.2, 0.12, 0.2, black), { x: lx, z: lz }));
  }
  // udder + tail
  g.add(place(box(0.38, 0.2, 0.36, mat(PINK)), { x: -0.45, y: by - 0.18 }));
  g.add(place(box(0.06, 0.8, 0.06, black), { x: -L / 2 - 0.03, y: by + 0.05 }));
  // head (neck + head + muzzle + ears)
  const hm = head === 'black' ? black : white;
  const hg = new THREE.Group();
  hg.add(place(box(0.42, 0.5, 0.42, hm), { x: 0.2, y: -0.25 }));
  hg.add(place(box(0.2, 0.26, 0.36, mat(PINK)), { x: 0.48, y: -0.25 }));
  hg.add(place(box(0.08, 0.1, 0.78, hm), { x: 0.1, y: 0.12 }));
  hg.add(place(box(0.08, 0.08, 0.5, mat(PALETTE.offWhite)), { x: 0.15, y: 0.25 }));
  if (graze) place(hg, { x: L / 2 + 0.05, y: 0.55, rz: -55 });
  else place(hg, { x: L / 2 + 0.02, y: by + H + 0.05, rz: 5 });
  g.add(hg);
  return g;
}

/** Small farm tractor with a front loader, faces +X. */
export function tractor({ color = PALETTE.green } = {}) {
  const body = mat(color, { roughness: 0.5 });
  const tyre = mat('#222222');
  const hub = mat(PALETTE.yellow);
  const g = new THREE.Group();
  g.add(place(box(1.6, 0.7, 0.9, body), { x: 0.5, y: 0.55 }));
  g.add(place(box(1.0, 0.25, 1.2, body), { x: -0.4, y: 0.9 }));
  // cab
  const glassM = mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 });
  g.add(place(box(1.0, 1.2, 1.1, glassM), { x: -0.4, y: 1.15 }));
  g.add(place(box(1.15, 0.12, 1.25, body), { x: -0.4, y: 2.35 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.08, 1.2, 0.08, mat(PALETTE.black)), { x: -0.4 + sx * 0.5, y: 1.15, z: sz * 0.55 }));
  g.add(place(cylinder(0.06, 0.06, 0.8, metal(PALETTE.steelDark), 6), { x: 0.9, y: 1.25, z: 0.25 }));
  // wheels: big rear, small front
  const wheel = (r, w, x, z) => {
    const geo = new THREE.CylinderGeometry(r, r, w, 12);
    geo.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(geo, tyre);
    m.position.set(x, r, z);
    g.add(m);
    const hgeo = new THREE.CylinderGeometry(r * 0.5, r * 0.5, w + 0.02, 10);
    hgeo.rotateX(Math.PI / 2);
    const h = new THREE.Mesh(hgeo, hub);
    h.position.set(x, r, z);
    g.add(h);
  };
  for (const s of [-1, 1]) {
    wheel(0.75, 0.45, -0.45, s * 0.8);
    wheel(0.42, 0.3, 0.95, s * 0.6);
  }
  // front loader arms + bucket
  for (const s of [-1, 1]) {
    const arm = box(1.5, 0.1, 0.1, mat(PALETTE.darkGrey));
    g.add(place(arm, { x: 1.2, y: 1.0, z: s * 0.55, rz: -25 }));
  }
  g.add(place(box(0.5, 0.45, 1.4, mat(PALETTE.darkGrey)), { x: 2.0, y: 0.25 }));
  return g;
}

/** Steel ladder with a cage-less frame, flat against a wall, rungs along X. */
export function ladder(h) {
  const m = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  for (const s of [-1, 1]) g.add(place(box(0.06, h, 0.06, m), { x: s * 0.22 }));
  const n = Math.floor(h / 0.45);
  for (let i = 1; i <= n; i++) g.add(place(box(0.44, 0.04, 0.04, m), { y: i * 0.45 - 0.05 }));
  return g;
}

/** Old-fashioned milk churn. */
export function milkChurn() {
  const m = metal(PALETTE.aluminium, { roughness: 0.35 });
  const g = new THREE.Group();
  g.add(cylinder(0.22, 0.24, 0.6, m, 10));
  g.add(place(cylinder(0.12, 0.22, 0.2, m, 10), { y: 0.6 }));
  g.add(place(cylinder(0.14, 0.14, 0.08, m, 10), { y: 0.8 }));
  return g;
}

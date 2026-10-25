import * as THREE from 'three';
import { PALETTE, FLOOR, box, beam, cylinder, cone, place, mat, metal, surface } from '../../src/lib/index.js';

const IRON = '#26272b';

/**
 * Black iron fire escape hung on a wall face. Local origin = wall face at the
 * building's ground level; it sticks out towards +z.
 *   fireEscape({ w, d, levels: [1, 2, 3], roofY })
 * levels are storey indices (1 = first floor above the ground floor). Stairs
 * between the balconies zig-zag left/right; a drop ladder hangs below the
 * lowest balcony and a gooseneck ladder runs from the top one to roofY.
 */
export function fireEscape({ w = 3.8, d = 0.85, levels = [1, 2, 3], roofY = null, flip = false } = {}) {
  const iron = mat(IRON, { roughness: 0.6, metalness: 0.3 });
  const g = new THREE.Group();
  const W = w / 2;
  const railH = 0.95;
  const ys = levels.map((f) => f * FLOOR + 0.25);

  for (const y of ys) {
    // grated platform + brackets
    g.add(place(box(w, 0.07, d, iron), { y, z: d / 2 }));
    for (const x of [-W + 0.1, W - 0.1]) g.add(beam([x, y - 0.6, 0.02], [x, y, d - 0.05], 0.06, iron));
    // railing: top + mid rails on three sides, corner posts, balusters at the front
    for (const ry of [railH, railH * 0.5]) {
      g.add(place(box(w, 0.05, 0.05, iron), { y: y + ry, z: d - 0.03 }));
      for (const x of [-W + 0.03, W - 0.03]) g.add(place(box(0.05, 0.05, d, iron), { x, y: y + ry, z: d / 2 }));
    }
    const n = Math.round(w / 0.32);
    for (let i = 0; i <= n; i++) {
      const x = -W + 0.03 + ((w - 0.06) * i) / n;
      g.add(place(box(i % 4 === 0 ? 0.06 : 0.03, railH, 0.03, iron), { x, y, z: d - 0.03 }));
    }
    for (const x of [-W + 0.03, W - 0.03]) {
      for (const z of [d * 0.33, d * 0.66]) g.add(place(box(0.03, railH, 0.03, iron), { x, y, z }));
    }
  }

  // zig-zag stair flights between balconies
  const sw = 0.5; // stair width (along z)
  const sz = d - sw / 2 - 0.08;
  for (let i = 0; i < ys.length - 1; i++) {
    const dir = (i % 2 === 0) !== flip ? 1 : -1;
    const x0 = -dir * (W - 0.35), x1 = dir * (W - 0.9);
    const y0 = ys[i], y1 = ys[i + 1];
    for (const z of [sz - sw / 2, sz + sw / 2]) g.add(beam([x0, y0, z], [x1, y1, z], 0.07, iron));
    // handrail on the outer side
    g.add(beam([x0, y0 + railH, sz + sw / 2], [x1, y1 + railH * 0.6, sz + sw / 2], 0.04, iron));
    g.add(beam([x1, y1, sz + sw / 2], [x1, y1 + railH * 0.6, sz + sw / 2], 0.04, iron));
    const steps = 9;
    for (let s = 1; s < steps; s++) {
      const t = s / steps;
      g.add(place(box(0.22, 0.04, sw, iron), { x: x0 + (x1 - x0) * t, y: y0 + (y1 - y0) * t, z: sz }));
    }
  }

  // drop ladder below the lowest balcony
  const ladder = (x, z, yA, yB, wl = 0.45) => {
    for (const lx of [x - wl / 2, x + wl / 2]) g.add(place(box(0.04, yB - yA, 0.04, iron), { x: lx, y: yA, z }));
    for (let y = yA + 0.3; y < yB - 0.05; y += 0.3) g.add(place(box(wl, 0.03, 0.03, iron), { x, y, z }));
  };
  const lowX = (flip ? -1 : 1) * (W - 0.45);
  ladder(lowX, d - 0.08, ys[0] - 1.8, ys[0] + railH);
  // counterweight arm
  g.add(beam([lowX, ys[0] + railH, d - 0.08], [lowX, ys[0] + railH + 0.4, d - 0.4], 0.04, iron));

  // gooseneck ladder up to the roof
  if (roofY != null) {
    const top = ys[ys.length - 1];
    const gx = ys.length % 2 === 0 !== flip ? -(W - 0.45) : W - 0.45;
    ladder(gx, d * 0.5, top, roofY + 0.9, 0.4);
    for (const lx of [gx - 0.2, gx + 0.2]) g.add(beam([lx, roofY + 0.9, d * 0.5], [lx, roofY + 0.9, -0.35], 0.04, iron));
  }
  return g;
}

/**
 * Classic wooden rooftop water tank on a steel stand: stave barrel with iron
 * hoops and a conical roof. Base at y = 0.
 */
export function waterTank({ radius = 1.2, h = 2.4, legH = 1.9 } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelDark, { roughness: 0.6 });
  const wood = surface('planks', PALETTE.wood, { size: 0.9 });
  // stand: four legs, cross bracing, platform of beams
  const L = radius * 0.78;
  const corners = [[-L, -L], [L, -L], [L, L], [-L, L]];
  for (const [x, z] of corners) g.add(place(box(0.16, legH, 0.16, steel), { x, z }));
  for (let i = 0; i < 4; i++) {
    const [ax, az] = corners[i];
    const [bx, bz] = corners[(i + 1) % 4];
    g.add(beam([ax, 0.15, az], [bx, legH - 0.2, bz], 0.06, steel));
    g.add(beam([bx, 0.15, bz], [ax, legH - 0.2, az], 0.06, steel));
    g.add(place(box(Math.abs(bx - ax) + 0.16, 0.12, Math.abs(bz - az) + 0.16, steel), { x: (ax + bx) / 2, y: legH - 0.12, z: (az + bz) / 2 }));
  }
  g.add(place(box(radius * 2, 0.12, radius * 2, mat(PALETTE.woodDark)), { y: legH }));
  // barrel
  const by = legH + 0.12;
  g.add(place(cylinder(radius * 0.97, radius, h, wood, 18), { y: by }));
  for (const t of [0.08, 0.35, 0.62, 0.9]) {
    g.add(place(cylinder(radius * 1.02, radius * 1.02, 0.07, steel, 18), { y: by + h * t }));
  }
  // conical roof with a little finial
  g.add(place(cone(radius * 1.06, h * 0.38, mat(PALETTE.woodDark), 18), { y: by + h }));
  g.add(place(cylinder(0.06, 0.06, 0.3, steel, 6), { y: by + h + h * 0.36 }));
  // outflow pipe down through the stand
  g.add(place(cylinder(0.1, 0.1, legH, steel, 8), { y: 0 }));
  // access ladder on the barrel side
  for (const lx of [-0.18, 0.18]) g.add(place(box(0.04, h + legH * 0.6, 0.04, steel), { x: lx, y: legH * 0.4, z: radius + 0.06 }));
  for (let y = legH * 0.4 + 0.3; y < legH + h; y += 0.35) g.add(place(box(0.36, 0.03, 0.03, steel), { y, z: radius + 0.06 }));
  return g;
}

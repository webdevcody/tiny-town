import * as THREE from 'three';
import { PALETTE, box, place, beam, mat, textured, signTexture } from '../../src/lib/index.js';

// Arch outline: rectangle w x hRect topped by a semicircle of radius w/2.
function archPath(path, w, hRect, segs = 10) {
  const r = w / 2;
  path.moveTo(-r, 0);
  path.lineTo(r, 0);
  path.lineTo(r, hRect);
  for (let i = 1; i <= segs; i++) {
    const a = (i / segs) * Math.PI;
    path.lineTo(Math.cos(a) * r, hRect + Math.sin(a) * r);
  }
  path.lineTo(-r, 0);
  return path;
}

/**
 * Tall arched warehouse window, base centre at origin, facing +Z.
 * Glass sits flush, a deep brick-arch surround and black steel glazing bars
 * stand proud of the wall; a stone sill below.
 */
export function archWindow({ w = 1.4, h = 2.6, lit = false, surround = PALETTE.brickDark, sill = PALETTE.stone, bars = 3 } = {}) {
  const g = new THREE.Group();
  const r = w / 2;
  const hRect = h - r;
  const glassM = lit ? mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.35 }) : mat(PALETTE.window, { roughness: 0.25, metalness: 0.4 });
  const pane = new THREE.Mesh(new THREE.ShapeGeometry(archPath(new THREE.Shape(), w, hRect)), glassM);
  pane.position.z = 0.02;
  g.add(pane);

  // arch surround (outer arch minus inner arch), extruded out of the wall
  const t = 0.22;
  const outer = new THREE.Shape();
  archPath(outer, w + 2 * t, hRect);
  outer.holes.push(archPath(new THREE.Path(), w, hRect));
  const ring = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.14, bevelEnabled: false, curveSegments: 4 }), mat(surround));
  g.add(ring);
  // keystone
  g.add(place(box(0.26, 0.34, 0.2, mat(sill)), { y: h + 0.02 - 0.05 }));
  // sill
  g.add(place(box(w + 0.5, 0.14, 0.26, mat(sill)), { y: -0.14, z: 0.06 }));

  // black steel glazing bars
  const bm = mat(PALETTE.black, { roughness: 0.6 });
  for (let i = 1; i < bars; i++) {
    const x = -r + (w * i) / bars;
    const top = hRect + Math.sqrt(Math.max(0, r * r - x * x));
    g.add(place(box(0.06, top, 0.06, bm), { x, z: 0.05 }));
  }
  for (const y of [hRect * 0.5, hRect]) g.add(place(box(w, 0.06, 0.06, bm), { y, z: 0.05 }));
  return g;
}

/** Sign with 0..1 UVs (text fills the front face), base centre at origin, front +Z. */
export function bigSign({ text, w, h, d = 0.12, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const edge = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [edge, edge, edge, edge, textured(tex), edge]);
}

/**
 * Zig-zag steel fire escape against a wall facing +Z: landings at each level
 * in `levels` (heights), stair flights between them, a drop ladder at the bottom.
 */
export function fireEscape({ w = 4, depth = 1.0, levels = [3.5, 6.9], ladderTo = 1.2 } = {}) {
  const g = new THREE.Group();
  const m = mat(PALETTE.roofBlack, { roughness: 0.7 });
  const grate = mat(PALETTE.steelDark, { roughness: 0.8 });
  levels.forEach((y, i) => {
    g.add(place(box(w, 0.08, depth, grate), { y, z: depth / 2 }));
    // railing: posts + top & mid rail on front and ends
    const rh = 1.0;
    for (const x of [-w / 2, -w / 4, 0, w / 4, w / 2]) g.add(place(box(0.05, rh, 0.05, m), { x, y, z: depth }));
    for (const x of [-w / 2, w / 2]) g.add(place(box(0.05, rh, 0.05, m), { x, y, z: 0.05 }));
    for (const ry of [rh, rh * 0.5]) {
      g.add(place(box(w, 0.05, 0.05, m), { y: y + ry, z: depth }));
      g.add(place(box(0.05, 0.05, depth, m), { x: -w / 2, y: y + ry, z: depth / 2 }));
      g.add(place(box(0.05, 0.05, depth, m), { x: w / 2, y: y + ry, z: depth / 2 }));
    }
    // brackets
    for (const x of [-w / 2 + 0.2, w / 2 - 0.2]) g.add(beam([x, y - 0.7, 0.02], [x, y, depth - 0.05], 0.06, m));
    // flight down to the previous landing, alternating direction
    if (i > 0) {
      const y1 = levels[i - 1];
      const dir = i % 2 ? 1 : -1;
      const x0 = dir * (w / 2 - 0.4), x1 = -dir * (w / 2 - 1.4);
      const z = depth * 0.45;
      g.add(beam([x1, y1 + 0.05, z - 0.3], [x0, y, z - 0.3], 0.07, m));
      g.add(beam([x1, y1 + 0.05, z + 0.3], [x0, y, z + 0.3], 0.07, m));
      g.add(beam([x1, y1 + 1.0, z + 0.32], [x0, y + 1.0, z + 0.32], 0.05, m));
      const steps = 8;
      for (let s = 1; s < steps; s++) {
        const t = s / steps;
        g.add(place(box(0.2, 0.04, 0.6, grate), { x: x1 + (x0 - x1) * t, y: y1 + (y - y1) * t, z }));
      }
    }
  });
  // drop ladder from the first landing
  const lx = -w / 2 + 0.5, ly = levels[0];
  for (const dx of [-0.2, 0.2]) g.add(place(box(0.05, ly - ladderTo, 0.05, m), { x: lx + dx, y: ladderTo, z: depth - 0.1 }));
  for (let y = ladderTo + 0.3; y < ly; y += 0.35) g.add(place(box(0.4, 0.04, 0.04, m), { x: lx, y, z: depth - 0.1 }));
  return g;
}

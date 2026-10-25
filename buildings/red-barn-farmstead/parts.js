import * as THREE from 'three';
import { PALETTE, ShapeBuilder, box, cylinder, place, group, mat, beam } from '../../src/lib/index.js';

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

// Add a quad/poly, flipping the winding if its normal does not face `out`.
function face(b, pts, out, grp) {
  const [a, p1] = pts;
  const pl = pts[pts.length - 1];
  const u = [p1[0] - a[0], p1[1] - a[1], p1[2] - a[2]];
  const v = [pl[0] - a[0], pl[1] - a[1], pl[2] - a[2]];
  const n = [u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]];
  const dot = n[0] * out[0] + n[1] * out[1] + n[2] * out[2];
  b.poly(dot >= 0 ? pts : [...pts].reverse(), grp);
}

/**
 * Gambrel (barn) roof, ridge along Z. Base y = 0 = top of the walls, w x d = wall footprint.
 * Groups: roof, gable walls, underside.
 */
export function gambrelRoof({ w, d, h, knee = 0.62, kneeIn = 0.34, overhang = 0.4, material, gableMaterial, underMaterial }) {
  const W = w / 2, L = d / 2, Lo = L + overhang;
  const kx = W * (1 - kneeIn), ky = h * knee;
  // eave below the wall top so the steep slope keeps its pitch
  const ex = W + overhang, ey = -(overhang * ky) / (W - kx);
  const prof = [[-ex, ey], [-kx, ky], [0, h], [kx, ky], [ex, ey]];
  const b = new ShapeBuilder();
  for (let i = 0; i < prof.length - 1; i++) {
    const [x1, y1] = prof[i], [x2, y2] = prof[i + 1];
    const out = [-(y2 - y1), x2 - x1, 0]; // left-hand normal of the profile = outward/up
    const pts = [[x1, y1, Lo], [x2, y2, Lo], [x2, y2, -Lo], [x1, y1, -Lo]];
    face(b, pts, out, 0);
    face(b, pts, [-out[0], -out[1], 0], 2);
  }
  // gable ends at the wall planes
  const gp = [[-W, 0], [W, 0], [kx, ky], [0, h], [-kx, ky]];
  face(b, gp.map(([x, y]) => [x, y, L]), [0, 0, 1], 1);
  face(b, gp.map(([x, y]) => [x, y, -L]), [0, 0, -1], 1);
  const mesh = new THREE.Mesh(b.build(), [toMat(material), toMat(gableMaterial), toMat(underMaterial ?? PALETTE.woodDark)]);
  mesh.userData.profile = prof;
  mesh.userData.Lo = Lo;
  return mesh;
}

/** White fascia boards along the gambrel edges at both gable ends. */
export function gambrelTrim(roof, { t = 0.22, material = PALETTE.white } = {}) {
  const { profile, Lo } = roof.userData;
  const g = new THREE.Group();
  for (const z of [Lo, -Lo]) {
    for (let i = 0; i < profile.length - 1; i++) {
      const [x1, y1] = profile[i], [x2, y2] = profile[i + 1];
      g.add(beam([x1, y1 + t / 2, z], [x2, y2 + t / 2, z], t, toMat(material)));
    }
  }
  return g;
}

/** Barn door panel with a white frame and X brace; faces +Z, base centre at origin. */
export function xDoor({ w, h, color, trim = PALETTE.white, t = 0.16 }) {
  const tm = toMat(trim);
  const g = group(place(box(w, h, 0.1, color), { z: 0.05 }));
  const z = 0.13;
  g.add(place(box(w, t, 0.06, tm), { y: 0, z }));
  g.add(place(box(w, t, 0.06, tm), { y: h - t, z }));
  g.add(place(box(t, h, 0.06, tm), { x: -w / 2 + t / 2, z }));
  g.add(place(box(t, h, 0.06, tm), { x: w / 2 - t / 2, z }));
  const L = Math.hypot(w - t, h - t), a = THREE.MathUtils.radToDeg(Math.atan2(h - t, w - t));
  g.add(place(box(L, t, 0.05, tm), { y: h / 2 - t / 2, z, rz: a }));
  g.add(place(box(L, t, 0.05, tm), { y: h / 2 - t / 2, z, rz: -a }));
  return g;
}

function wheel(r, wdt, tyre, hub) {
  const geo = new THREE.CylinderGeometry(r, r, wdt, 14);
  geo.rotateX(Math.PI / 2);
  const hg = new THREE.CylinderGeometry(r * 0.5, r * 0.5, wdt + 0.04, 10);
  hg.rotateX(Math.PI / 2);
  return group(new THREE.Mesh(geo, tyre), new THREE.Mesh(hg, hub));
}

/** Farm tractor, length along +X (front), ~3.4 m long. Base on y = 0. */
export function tractor({ color = '#3f8a2f', hub = PALETTE.yellow } = {}) {
  const body = mat(color, { roughness: 0.5, metalness: 0.2 });
  const tyre = mat('#222222');
  const hubM = mat(hub);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = new THREE.Group();
  // chassis + engine hood + grille
  g.add(place(box(2.8, 0.45, 0.9, mat(PALETTE.darkGrey)), { x: 0.1, y: 0.5 }));
  g.add(place(box(1.6, 0.75, 0.9, body), { x: 0.85, y: 0.8 }));
  g.add(place(box(0.08, 0.6, 0.75, mat(PALETTE.darkGrey)), { x: 1.67, y: 0.85 }));
  // cab: glass box, green roof, fenders
  g.add(place(box(1.25, 1.35, 1.2, glassM), { x: -0.55, y: 0.95 }));
  for (const [x, z] of [[-1.15, 0.58], [-1.15, -0.58], [0.05, 0.58], [0.05, -0.58]]) g.add(place(box(0.1, 1.4, 0.1, body), { x, y: 0.95, z }));
  g.add(place(box(1.45, 0.14, 1.4, body), { x: -0.55, y: 2.3 }));
  g.add(place(box(1.3, 0.12, 0.5, body), { x: -0.55, y: 1.55, z: 0.95 }));
  g.add(place(box(1.3, 0.12, 0.5, body), { x: -0.55, y: 1.55, z: -0.95 }));
  // exhaust stack
  g.add(place(cylinder(0.06, 0.06, 1.3, mat(PALETTE.steelDark), 6), { x: 1.35, y: 1.4, z: 0.3 }));
  // wheels: big rear, small front
  for (const sz of [-1, 1]) {
    g.add(place(wheel(0.8, 0.5, tyre, hubM), { x: -0.55, y: 0.8, z: sz * 0.95 }));
    g.add(place(wheel(0.42, 0.3, tyre, hubM), { x: 1.15, y: 0.42, z: sz * 0.7 }));
  }
  return g;
}

/** Two-wheel hay trailer loaded with square bales, length along X, hitch at +X. */
export function hayTrailer({ color = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const tyre = mat('#222222');
  g.add(place(box(3.0, 0.2, 1.7, mat(PALETTE.woodDark)), { y: 0.7 }));
  g.add(place(box(3.0, 0.35, 0.08, color), { y: 0.9, z: 0.82 }));
  g.add(place(box(3.0, 0.35, 0.08, color), { y: 0.9, z: -0.82 }));
  g.add(place(box(0.08, 0.35, 1.7, color), { x: -1.48, y: 0.9 }));
  g.add(beam([1.5, 0.75, 0], [2.3, 0.6, 0], 0.12, mat(PALETTE.darkGrey)));
  for (const sz of [-1, 1]) g.add(place(wheel(0.45, 0.25, tyre, mat(PALETTE.lightGrey)), { y: 0.45, z: sz * 0.95 }));
  const hay = mat(PALETTE.hay);
  for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) g.add(place(box(0.92, 0.5, 0.75, hay), { x: -0.98 + i * 0.98, y: 0.9, z: -0.4 + j * 0.8 }));
  for (let i = 0; i < 2; i++) g.add(place(box(0.92, 0.5, 0.75, hay), { x: -0.5 + i * 0.98, y: 1.4, z: 0 }));
  return g;
}

/** Chicken (slightly oversized so it reads at iso scale), faces +X. */
export function chicken({ color = PALETTE.white } = {}) {
  const g = new THREE.Group();
  g.add(place(box(0.5, 0.35, 0.34, color), { y: 0.2 }));
  g.add(place(box(0.14, 0.3, 0.26, color), { x: -0.26, y: 0.4 })); // tail
  g.add(place(box(0.2, 0.22, 0.2, color), { x: 0.24, y: 0.5 }));
  g.add(place(box(0.08, 0.1, 0.06, PALETTE.red), { x: 0.26, y: 0.72 })); // comb
  g.add(place(box(0.1, 0.06, 0.08, PALETTE.orange), { x: 0.38, y: 0.56 })); // beak
  g.add(place(box(0.05, 0.2, 0.05, PALETTE.orange), { x: 0.02, y: 0, z: 0.08 }));
  g.add(place(box(0.05, 0.2, 0.05, PALETTE.orange), { x: 0.02, y: 0, z: -0.08 }));
  return g;
}

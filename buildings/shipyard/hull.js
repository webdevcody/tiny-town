import * as THREE from 'three';
import { PALETTE, ShapeBuilder, mat, metal, box, beam, place, cylinder } from '../../src/lib/index.js';

// Ship hull on the building berth. Length along X (bow towards +x), keel at y = 0.
// The forward part is fully plated; the aft part is still bare frames with only
// the bottom plated, so the ship reads as "half built".

const DOUBLE = { side: THREE.DoubleSide };

/** Half-width of the hull at station x, height y. */
export function hullShape({ L, B, D }) {
  const xs = -L / 2, xe = L / 2;
  const r = 1.1; // bilge radius
  const section = (y) => (y >= r ? B / 2 : B / 2 - r + Math.sqrt(Math.max(0, r * r - (r - y) * (r - y))));
  return (x, y) => {
    let hw = section(y);
    // bow: entrance over the last 5 m, raked stem (longer at deck than at keel)
    const stemX = xe - 1.6 * (1 - y / D);
    const bowStart = stemX - 5;
    if (x > bowStart) {
      const t = Math.min(1, (x - bowStart) / (stemX - bowStart));
      hw *= Math.sqrt(Math.max(0, 1 - t * t));
    }
    // stern: run tapers towards the keel, square transom at deck level
    const run = xs + 3.2;
    if (x < run) {
      const t = (run - x) / (run - xs);
      const k = Math.min(1, y / D);
      hw *= 1 - t * (0.75 - 0.6 * k);
    }
    return Math.max(0.03, hw);
  };
}

/** Plated skin between heights y0..y1 over stations x0..x1 (both sides). */
function skin(hw, x0, x1, y0, y1, nx, ny, material) {
  const b = new ShapeBuilder();
  for (let i = 0; i < nx; i++) {
    const xa = x0 + ((x1 - x0) * i) / nx, xb = x0 + ((x1 - x0) * (i + 1)) / nx;
    for (let j = 0; j < ny; j++) {
      const ya = y0 + ((y1 - y0) * j) / ny, yb = y0 + ((y1 - y0) * (j + 1)) / ny;
      for (const s of [1, -1]) {
        const p = (x, y) => [x, y, s * hw(x, y)];
        if (s > 0) b.quad(p(xa, ya), p(xb, ya), p(xb, yb), p(xa, yb));
        else b.quad(p(xb, ya), p(xa, ya), p(xa, yb), p(xb, yb));
      }
    }
  }
  return new THREE.Mesh(b.build(), material);
}

/** Flat plate at height y following the hull outline between x0..x1 (deck / tank top / bottom). */
function plate(hw, x0, x1, y, n, material, thickness = 0.12) {
  const b = new ShapeBuilder();
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n;
    const top = [[xa, y, hw(xa, y)], [xb, y, hw(xb, y)], [xb, y, -hw(xb, y)], [xa, y, -hw(xa, y)]];
    b.quad(top[3], top[2], top[1], top[0]);
    const yb = y - thickness;
    b.quad([xa, yb, hw(xa, y)], [xb, yb, hw(xb, y)], [xb, yb, -hw(xb, y)], [xa, yb, -hw(xa, y)]);
  }
  return new THREE.Mesh(b.build(), material);
}

/** Transverse section polygon (closed) at station x: used for bulkheads and transom. */
function section(hw, x, y1, n, material, face = 1) {
  const b = new ShapeBuilder();
  for (let j = 0; j < n; j++) {
    const ya = (y1 * j) / n, yb = (y1 * (j + 1)) / n;
    const q = [[x, ya, -hw(x, ya)], [x, ya, hw(x, ya)], [x, yb, hw(x, yb)], [x, yb, -hw(x, yb)]];
    if (face > 0) b.quad(q[0], q[1], q[2], q[3]);
    else b.quad(q[3], q[2], q[1], q[0]);
  }
  return new THREE.Mesh(b.build(), material);
}

export function hull({ L = 16, B = 5, D = 4.2, split = -1 } = {}) {
  const g = new THREE.Group();
  const hw = hullShape({ L, B, D });
  const xs = -L / 2, xe = L / 2;
  const red = mat('#a8352b', DOUBLE);
  const black = mat('#2b2f36', DOUBLE);
  const boot = mat(PALETTE.white, DOUBLE);
  const primer = mat('#b86a3c', DOUBLE);
  const deckM = mat('#7d8a7a', DOUBLE);
  const frameM = metal('#9a5a36', { roughness: 0.6 });
  const greyM = mat(PALETTE.steelDark);

  const wl = 1.7; // waterline height
  // bottom plating along the whole length (red antifouling)
  g.add(skin(hw, xs, xe, 0, wl, 28, 4, red));
  g.add(plate(hw, xs, xe, 0.06, 20, red, 0.06));
  // forward body: boot-top stripe + black topsides
  g.add(skin(hw, split, xe, wl, wl + 0.25, 16, 1, boot));
  g.add(skin(hw, split, xe, wl + 0.25, D, 16, 4, black));
  // aft body: a couple of primer strakes already welded on above the waterline
  g.add(skin(hw, xs + 3.6, split, wl, wl + 0.7, 6, 1, primer));

  // decks: main deck on the forward body, tank top in the open aft body
  g.add(plate(hw, split, xe, D, 16, deckM));
  g.add(plate(hw, xs + 0.1, split, 1.3, 12, mat('#8a5236', DOUBLE)));
  // bulkhead closing the forward body (primer) and a half-height one aft
  g.add(section(hw, split, D, 6, primer, -1));
  g.add(section(hw, xs + 4.6, 2.6, 4, primer, -1));
  // transom stub
  g.add(section(hw, xs + 0.02, wl, 3, red, -1));

  // aft frames (ribs) every 0.9 m + longitudinal stringers
  const nFrames = Math.round((split - xs) / 0.9);
  for (let i = 0; i <= nFrames; i++) {
    const x = xs + 0.2 + ((split - 0.2 - xs - 0.2) * i) / nFrames;
    const top = x < xs + 2.6 ? D - 0.4 : D; // stern frames a bit shorter
    const steps = 6;
    for (const s of [1, -1]) {
      for (let j = 0; j < steps; j++) {
        const ya = wl - 0.2 + ((top - wl + 0.2) * j) / steps, yb = wl - 0.2 + ((top - wl + 0.2) * (j + 1)) / steps;
        g.add(beam([x, ya, s * (hw(x, ya) - 0.06)], [x, yb, s * (hw(x, yb) - 0.06)], 0.13, frameM));
      }
    }
    // deck beam on every other frame
    if (i % 2 === 0) g.add(beam([x, top, -hw(x, top) + 0.05], [x, top, hw(x, top) - 0.05], 0.12, frameM));
  }
  for (const y of [2.9, D - 0.05]) {
    for (const s of [1, -1]) {
      const pts = [];
      for (let i = 0; i <= 6; i++) {
        const x = xs + 0.6 + ((split - xs - 0.6) * i) / 6;
        pts.push([x, y, s * (hw(x, y) - 0.08)]);
      }
      for (let i = 0; i < pts.length - 1; i++) g.add(beam(pts[i], pts[i + 1], 0.14, frameM));
    }
  }

  // forecastle details: bulwark rail, bollards, windlass, stub mast
  const railM = mat(PALETTE.white);
  for (const s of [1, -1]) {
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = split + 0.2 + ((xe - 0.1 - split - 0.2) * i) / 8;
      pts.push([x, D + 0.6, s * (hw(x, D) - 0.05)]);
    }
    for (let i = 0; i < pts.length - 1; i++) g.add(beam(pts[i], pts[i + 1], 0.06, railM));
    for (let i = 0; i < pts.length; i += 2) g.add(beam([pts[i][0], D, pts[i][2]], pts[i], 0.05, railM));
  }
  for (const s of [1, -1]) {
    g.add(place(cylinder(0.15, 0.15, 0.45, greyM, 8), { x: xe - 3.2, y: D, z: s * 1.2 }));
    g.add(place(cylinder(0.15, 0.15, 0.45, greyM, 8), { x: xe - 3.7, y: D, z: s * 1.2 }));
  }
  g.add(place(box(1.0, 0.6, 1.6, mat(PALETTE.green)), { x: xe - 2.2, y: D }));
  g.add(place(cylinder(0.12, 0.16, 3.2, mat(PALETTE.yellow), 8), { x: xe - 1.4, y: D }));
  g.add(place(box(0.08, 0.08, 1.2, mat(PALETTE.yellow)), { x: xe - 1.4, y: D + 2.6 }));
  // hatch coaming on the finished deck
  g.add(place(box(3.2, 0.5, 2.8, mat('#3f6e8f')), { x: split + 2.6, y: D }));
  return g;
}

/** Keel blocks + bilge shores under the hull. */
export function keelBlocks({ L = 16, B = 5, h = 0.9 } = {}) {
  const g = new THREE.Group();
  const wood = mat(PALETTE.woodDark);
  const conc = mat(PALETTE.concreteDark);
  for (let x = -L / 2 + 0.6; x <= L / 2 - 2.2; x += 1.6) {
    g.add(place(box(0.8, h * 0.6, 1.4, conc), { x }));
    g.add(place(box(0.8, h * 0.4, 1.2, wood), { x, y: h * 0.6 }));
  }
  for (let x = -L / 2 + 2.5; x <= L / 2 - 3.5; x += 3.2) {
    for (const s of [1, -1]) {
      g.add(beam([x, 0, s * (B / 2 + 0.2)], [x, h + 0.5, s * (B / 2 - 0.8)], 0.18, wood));
    }
  }
  return g;
}

/**
 * Tube-and-plank scaffold along X: two rows of standards (inner at z = 0, outer at z = +w),
 * planked lifts every `lift` m, diagonal bracing on the outer face.
 */
export function scaffold({ len = 10, h = 6, w = 0.9, lift = 1.8, bay = 1.8 } = {}) {
  const g = new THREE.Group();
  const tube = metal(PALETTE.steelLight, { roughness: 0.5 });
  const plank = mat('#c99a55');
  const toe = mat(PALETTE.orange);
  const nb = Math.max(1, Math.round(len / bay));
  const bx = len / nb;
  const t = 0.06;
  for (let i = 0; i <= nb; i++) {
    const x = -len / 2 + i * bx;
    for (const z of [0, w]) g.add(beam([x, 0, z], [x, h, z], t, tube));
  }
  for (let y = lift; y <= h + 0.01; y += lift) {
    for (const z of [0, w]) g.add(beam([-len / 2, y, z], [len / 2, y, z], t, tube));
    g.add(beam([-len / 2, y + 1.0, w], [len / 2, y + 1.0, w], t * 0.8, toe)); // guard rail
    g.add(place(box(len, 0.06, w - 0.05, plank), { y, z: w / 2 }));
  }
  for (let i = 0; i < nb; i += 2) {
    const x0 = -len / 2 + i * bx;
    g.add(beam([x0, 0, w], [x0 + bx, Math.min(h, lift * 2), w], t * 0.8, tube));
  }
  return g;
}

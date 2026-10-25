import * as THREE from 'three';
import { PALETTE, box, cylinder, cone, sphere, group, place, mat, metal, textured, signTexture, tree } from '../../src/lib/index.js';

// Bicycle, length along X, wheels on y = 0.
export function bike(color = PALETTE.red) {
  const frameM = mat(color);
  const tyre = mat(PALETTE.black);
  const steel = metal(PALETTE.steelLight);
  const g = new THREE.Group();
  const r = 0.34;
  for (const x of [-0.55, 0.55]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 5, 14), tyre);
    w.position.set(x, r, 0);
    g.add(w);
    g.add(place(box(0.05, 0.05, 0.12, steel), { x, y: r - 0.025 }));
  }
  const bar = (a, b, t = 0.06, m = frameM) => {
    const from = new THREE.Vector3(...a), to = new THREE.Vector3(...b);
    const len = from.distanceTo(to);
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), m);
    mesh.position.copy(from).add(to).multiplyScalar(0.5);
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), to.clone().sub(from).normalize());
    return mesh;
  };
  g.add(bar([-0.55, r, 0], [-0.12, r, 0]));            // chain stay
  g.add(bar([-0.12, r, 0], [-0.22, 0.86, 0]));          // seat tube
  g.add(bar([-0.55, r, 0], [-0.22, 0.86, 0]));          // seat stay
  g.add(bar([-0.12, r, 0], [0.42, 0.84, 0]));           // down tube
  g.add(bar([-0.22, 0.82, 0], [0.42, 0.84, 0]));        // top tube
  g.add(bar([0.55, r, 0], [0.42, 0.98, 0], 0.05));      // fork
  g.add(place(box(0.06, 0.04, 0.55, steel), { x: 0.4, y: 0.98 }));          // handlebar
  g.add(place(box(0.24, 0.06, 0.12, mat(PALETTE.black)), { x: -0.24, y: 0.88 })); // saddle
  g.add(place(box(0.32, 0.18, 0.3, mat(PALETTE.woodDark)), { x: 0.68, y: 0.62 })); // front crate
  return g;
}

// Simple U-shaped bike stand.
export function bikeStand() {
  const m = metal(PALETTE.steelLight);
  return group(
    place(box(0.05, 0.75, 0.05, m), { x: -0.25 }),
    place(box(0.05, 0.75, 0.05, m), { x: 0.25 }),
    place(box(0.55, 0.05, 0.05, m), { y: 0.72 })
  );
}

export function bollard() {
  const m = mat(PALETTE.black);
  return group(cylinder(0.14, 0.16, 0.45, m, 8), place(cylinder(0.2, 0.2, 0.06, m, 8), { y: 0.4 }));
}

// Little post-mounted mailbox, door faces +z.
export function mailbox(color) {
  return group(
    box(0.08, 0.95, 0.08, mat(PALETTE.darkGrey)),
    place(box(0.42, 0.34, 0.3, mat(color)), { y: 0.9 }),
    place(box(0.26, 0.04, 0.02, mat(PALETTE.black)), { y: 1.12, z: 0.155 })
  );
}

// Beach parasol: pole + striped-looking cone.
export function parasol(color = PALETTE.red) {
  return group(
    cylinder(0.04, 0.04, 2.1, mat(PALETTE.white), 6),
    place(cone(1.05, 0.45, mat(color), 8), { y: 1.75 }),
    place(cone(0.5, 0.22, mat(PALETTE.white), 8), { y: 1.98 })
  );
}

// Deckchair facing +z.
export function deckchair(color = PALETTE.blue) {
  const wood = mat(PALETTE.woodLight);
  return group(
    place(box(0.05, 0.35, 0.9, wood), { x: -0.27 }),
    place(box(0.05, 0.35, 0.9, wood), { x: 0.27 }),
    place(box(0.5, 0.05, 0.6, mat(color)), { y: 0.3, z: 0.1 }),
    place(box(0.5, 0.7, 0.05, mat(color)), { y: 0.3, z: -0.32, rx: -35 })
  );
}

// Wooden planter box with a bush and a few flowers on top.
export function planter(w, d, seed, flowers = [PALETTE.red, PALETTE.yellow, PALETTE.pink]) {
  const g = group(box(w, 0.4, d, mat(PALETTE.woodDark)), place(box(w - 0.1, 0.05, d - 0.1, mat(PALETTE.dirt)), { y: 0.4 }));
  const n = Math.max(1, Math.round(w / 0.9));
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + (w * (i + 0.5)) / n;
    if (i % 2 === 0) g.add(place(tree({ kind: 'bush', h: 0.75, seed: seed + i }), { x, y: 0.4 }));
    else g.add(place(sphere(0.2, mat(flowers[(seed + i) % flowers.length]), 6), { x, y: 0.4 }));
  }
  return g;
}

// Flower pot.
export function pot(color, seed) {
  return group(cylinder(0.2, 0.14, 0.32, mat(PALETTE.terracotta), 8), place(sphere(0.24, mat(color), 6), { y: 0.28 }));
}

// Lifebuoy ring on a wall, faces +z.
export function lifebuoy() {
  const g = new THREE.Group();
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 6, 12), mat(PALETTE.orange));
  ring.position.y = 0.3;
  g.add(ring);
  return g;
}

// Tyre fender hanging against a hull side.
export function fender() {
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.09, 6, 10), mat(PALETTE.black));
  t.position.y = 0.3;
  return group(t);
}

// Sign board with 0..1 UVs so the text fills the whole face (lib sign() shrinks on faces > 1 m).
export function plainSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.1, border = null } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex);
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

// Small duck on the water.
export function duck(color = PALETTE.white) {
  return group(
    place(box(0.34, 0.16, 0.2, mat(color)), { y: 0 }),
    place(box(0.12, 0.16, 0.12, mat(color)), { x: 0.15, y: 0.14 }),
    place(box(0.08, 0.04, 0.06, mat(PALETTE.orange)), { x: 0.24, y: 0.22 })
  );
}

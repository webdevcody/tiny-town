import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, ShapeBuilder,
  lot, patch, box, cylinder, cone, sphere, extrude, place, group, beam,
  facade, mat, metal, glass, emissive, surface, textured, canvasTexture,
  signTexture, boxGeometry, tree, car, fence, streetLamp, flag, facadeCylinder, antenna, rng, SWATCHES,
} from '../../src/lib/index.js';

// 3x2 tiles (30 x 20 m). Front (landside kerb) faces +z, the apron is on the east (+x).
const y0 = LOT_HEIGHT;

// terminal hall walls and the swooping roof over it (roof overhangs the kerb as a canopy)
const HX0 = -14.3, HX1 = 1.2, HZ0 = -6.8, HZ1 = 4.2;
const RX0 = -14.8, RX1 = 1.8, RZ0 = -7.4, RZ1 = 6.3;
const RCX = (RX0 + RX1) / 2, RW = RX1 - RX0, ROOF_T = 0.45;

function roofTop(x, z) {
  const u = (z - RZ0) / (RZ1 - RZ0); // 0 back eave -> 1 front canopy edge
  const s = (x - RCX) / (RW / 2); // -1 .. 1 across the hall
  return y0 + 6.6 + 1.1 * Math.sin(Math.PI * u) + 1.7 * u ** 3 - 1.0 * s ** 4;
}
const roofBot = (x, z) => roofTop(x, z) - ROOF_T;
const lerp = (a, b, t) => a + (b - a) * t;

/** Curved roof slab: groups 0 top, 1 fascia, 2 soffit. */
function swoopRoof() {
  const b = new ShapeBuilder();
  const NX = 20, NZ = 14;
  const X = (i) => lerp(RX0, RX1, i / NX), Z = (j) => lerp(RZ0, RZ1, j / NZ);
  const T = (x, z) => roofTop(x, z), B = (x, z) => roofBot(x, z);
  for (let i = 0; i < NX; i++) {
    const x0 = X(i), x1 = X(i + 1);
    for (let j = 0; j < NZ; j++) {
      const z0 = Z(j), z1 = Z(j + 1);
      b.quad([x0, T(x0, z0), z0], [x0, T(x0, z1), z1], [x1, T(x1, z1), z1], [x1, T(x1, z0), z0], 0);
      b.quad([x0, B(x0, z0), z0], [x1, B(x1, z0), z0], [x1, B(x1, z1), z1], [x0, B(x0, z1), z1], 2);
    }
    // front and back fascia
    b.quad([x0, B(x0, RZ1), RZ1], [x1, B(x1, RZ1), RZ1], [x1, T(x1, RZ1), RZ1], [x0, T(x0, RZ1), RZ1], 1);
    b.quad([x1, B(x1, RZ0), RZ0], [x0, B(x0, RZ0), RZ0], [x0, T(x0, RZ0), RZ0], [x1, T(x1, RZ0), RZ0], 1);
  }
  for (let j = 0; j < NZ; j++) {
    const z0 = Z(j), z1 = Z(j + 1);
    b.quad([RX0, B(RX0, z0), z0], [RX0, B(RX0, z1), z1], [RX0, T(RX0, z1), z1], [RX0, T(RX0, z0), z0], 1);
    b.quad([RX1, B(RX1, z1), z1], [RX1, B(RX1, z0), z0], [RX1, T(RX1, z0), z0], [RX1, T(RX1, z1), z1], 1);
  }
  return new THREE.Mesh(b.build(), [
    surface('stripes', PALETTE.white, { color2: PALETTE.offWhite, size: 1.2, roughness: 0.45, metalness: 0.2 }),
    mat(PALETTE.steelLight, { metalness: 0.4, roughness: 0.35 }),
    mat(PALETTE.lightGrey),
  ]);
}

/** Glazed strips across the roof at the given z positions, hugging its curve. */
function roofSkylights(zs, width) {
  const b = new ShapeBuilder();
  const NX = 20, inset = 0.8;
  for (const zc of zs) {
    const z0 = zc - width / 2, z1 = zc + width / 2;
    for (let i = 0; i < NX; i++) {
      const x0 = lerp(RX0 + inset, RX1 - inset, i / NX), x1 = lerp(RX0 + inset, RX1 - inset, (i + 1) / NX);
      const T = (x, z) => roofTop(x, z) + 0.06;
      b.quad([x0, T(x0, z0), z0], [x0, T(x0, z1), z1], [x1, T(x1, z1), z1], [x1, T(x1, z0), z0], 0);
      b.quad([x0, T(x0, z1) - 0.1, z1], [x1, T(x1, z1) - 0.1, z1], [x1, T(x1, z1), z1], [x0, T(x0, z1), z1], 1);
    }
  }
  return new THREE.Mesh(b.build(), [glass(PALETTE.glassSky), mat(PALETTE.steelLight)]);
}

/** Hall walls up to the curved roof: glass front and sides, ribbon-windowed back. */
function hallWalls() {
  const front = facade({ style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.steelLight, lit: 0.12, seed: 31 });
  const back = facade({ style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, lit: 0.1, seed: 32 });
  const mats = [front, back];
  const bay = 2.2, fh = 4.1;
  const b = new ShapeBuilder();
  // left-to-right as seen from outside
  const run = (ax, az, bx, bz, n, gi) => {
    const { cols, rows } = mats[gi].userData;
    const len = Math.hypot(bx - ax, bz - az);
    for (let k = 0; k < n; k++) {
      const px = lerp(ax, bx, k / n), pz = lerp(az, bz, k / n);
      const qx = lerp(ax, bx, (k + 1) / n), qz = lerp(az, bz, (k + 1) / n);
      const ta = roofBot(px, pz) + 0.05, tb = roofBot(qx, qz) + 0.05;
      const u0 = (len * k) / n / bay / cols, u1 = (len * (k + 1)) / n / bay / cols;
      b.quadUV([px, y0, pz], [qx, y0, qz], [qx, tb, qz], [px, ta, pz],
        [[u0, 0], [u1, 0], [u1, (tb - y0) / fh / rows], [u0, (ta - y0) / fh / rows]], gi);
    }
  };
  run(HX0, HZ1, HX1, HZ1, 14, 0);
  run(HX1, HZ1, HX1, HZ0, 10, 0);
  run(HX0, HZ0, HX0, HZ1, 10, 0);
  run(HX1, HZ0, HX0, HZ0, 14, 1);
  return new THREE.Mesh(b.build(), mats);
}

/** Telescopic jet bridge running along +x from a terminal wall (origin) to a door `len` away. */
function jetBridge(len, gate) {
  const g = new THREE.Group();
  const fh = 1.5, th = 1.65, tw = 1.45;
  const body = mat(PALETTE.steelLight, { metalness: 0.3, roughness: 0.5 });
  const body2 = mat(PALETTE.aluminium, { metalness: 0.3, roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const win = glass(PALETTE.glassDark);
  const rx = 1.1;
  // rotunda on its pillar + short link to the wall
  g.add(place(cylinder(0.3, 0.3, fh, dark, 8), { x: rx }));
  g.add(place(cylinder(0.95, 0.95, th + 0.15, body, 12), { x: rx, y: fh - 0.05 }));
  g.add(place(cylinder(1.02, 1.02, 0.12, mat(PALETTE.grey), 12), { x: rx, y: fh + th + 0.1 }));
  g.add(place(box(rx, th, tw, body), { x: rx / 2, y: fh }));
  // two telescoping tunnel sections
  const t0 = rx + 0.8, cab = 1.6, t1 = len - cab, mid = (t0 + t1) / 2 + 0.3;
  g.add(place(box(mid - t0 + 0.4, th, tw, body), { x: (t0 + mid) / 2 - 0.1, y: fh }));
  g.add(place(box(t1 - mid + 0.1, th * 0.9, tw * 0.9, body2), { x: (mid + t1) / 2, y: fh + 0.08 }));
  for (const sz of [-1, 1]) {
    g.add(place(box(mid - t0 - 0.2, 0.42, 0.04, win), { x: (t0 + mid) / 2, y: fh + 0.85, z: sz * (tw / 2 + 0.01) }));
    g.add(place(box(t1 - mid - 0.4, 0.38, 0.04, win), { x: (mid + t1) / 2, y: fh + 0.85, z: sz * (tw * 0.45 + 0.01) }));
    g.add(place(box(t1 - t0, 0.12, 0.05, mat(PALETTE.blue)), { x: (t0 + t1) / 2, y: fh + 0.25, z: sz * (tw / 2 + 0.02) }));
  }
  // cab, bellows, drive unit
  g.add(place(box(cab - 0.35, th + 0.25, tw + 0.35, body), { x: t1 + (cab - 0.35) / 2, y: fh - 0.12 }));
  g.add(place(box(0.4, th, tw + 0.15, dark), { x: len - 0.2, y: fh }));
  const dx = t1 - 0.5;
  for (const sz of [-0.45, 0.45]) g.add(place(box(0.2, fh, 0.2, mat(PALETTE.steelDark)), { x: dx, z: sz }));
  g.add(place(box(0.9, 0.3, 1.5, mat(PALETTE.yellow)), { x: dx, y: 0.22 }));
  for (const sz of [-0.6, 0.6]) g.add(place(wheel(0.22, 0.2), { x: dx, y: 0.22, z: sz }));
  // gate number sign on the cab roof
  g.add(place(sign({ text: gate, w: 1.4, h: 0.45, bg: PALETTE.yellow, fg: PALETTE.black, double: true, depth: 0.1 }), { x: t1 + 0.6, y: fh + th + 0.13, ry: 90 }));
  return g;
}

/**
 * Sign board with text on the front (+z) face. Like the lib's sign(), but the face UVs
 * span 0..1 so the whole text shows on boards wider than 1 m.
 */
function sign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = boxGeometry(w, h, depth);
  const uv = geo.attributes.uv;
  for (let i = 16; i < 24; i++) uv.setXY(i, uv.getX(i) / w, uv.getY(i) / h);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Wheel with its axle along z. */
function wheel(r, w) {
  const geo = new THREE.CylinderGeometry(r, r, w, 10);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, mat(PALETTE.black));
}

/** Twin-engine airliner, nose towards -z, centred on x = 0. */
function airliner() {
  const g = new THREE.Group();
  const R = 1.35, yc = 2.2;
  const white = mat(PALETTE.white, { roughness: 0.45, metalness: 0.1 });
  const grey = mat(PALETTE.lightGrey, { roughness: 0.5, metalness: 0.2 });
  const livery = mat(PALETTE.navy);
  const accent = mat(PALETTE.yellow);
  const dark = mat(PALETTE.darkGrey);
  // fuselage: nose, barrel, upswept tail cone
  g.add(place(cylinder(R, R, 9.8, white, 16), { y: yc, z: -7.3, rx: 90 }));
  g.add(place(cylinder(0.92, R, 1.1, white, 16), { y: yc, z: -7.3, rx: -90 }));
  g.add(place(cylinder(0.3, 0.92, 1.0, white, 16), { y: yc, z: -8.38, rx: -97 }));
  g.add(place(cylinder(0.32, R, 3.3, white, 16), { y: yc, z: 2.48, rx: 80 }));
  // belly and cheatline
  g.add(place(box(1.6, 0.2, 9.6, grey), { y: yc - R - 0.02, z: -2.4 }));
  const cabinTex = canvasTexture(64, 32, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#23324a';
    ctx.fillRect(20, 0, 26, h);
  }, { key: 'airport-terminal:cabin' });
  const cabin = textured(cabinTex, { roughness: 0.4 });
  for (const sx of [-1, 1]) {
    g.add(place(box(0.04, 0.3, 9.4, [cabin, cabin, white, white, white, white]), { x: sx * (R + 0.01), y: yc + 0.18, z: -6.5 + 4.7 - 0.2 }));
    g.add(place(box(0.04, 0.16, 11.6, livery), { x: sx * (R + 0.01), y: yc - 0.22, z: -2.0 }));
    // doors
    for (const dz of [-6.2, 1.9]) g.add(place(box(0.05, 1.05, 0.55, grey), { x: sx * (R + 0.02), y: yc - 0.6, z: dz }));
  }
  // cockpit windows
  g.add(place(box(1.5, 0.28, 0.45, glass(PALETTE.glassDark)), { y: yc + 0.62, z: -7.75, rx: -20 }));

  // wings with dihedral and winglets
  for (const sx of [-1, 1]) {
    const pts = [[0.6, -1.9], [5.7, 1.2], [5.7, 2.1], [0.6, 1.6]].map(([x, z]) => [sx * x, z]);
    const wing = place(group(
      extrude(pts, 0.22, grey, mat(PALETTE.aluminium, { roughness: 0.5, metalness: 0.2 })),
      place(box(0.08, 0.85, 0.75, livery), { x: sx * 5.68, y: 0.15, z: 1.75, rz: -sx * 8 }),
    ), { y: yc - 0.85, rz: sx * 5 });
    g.add(wing);
    // horizontal stabiliser
    const tail = [[0.2, 3.9], [2.7, 5.2], [2.7, 5.8], [0.2, 5.5]].map(([x, z]) => [sx * x, z]);
    g.add(place(extrude(tail, 0.15, grey, white), { y: yc + 0.35, rz: sx * 6 }));
    // engine, intake, exhaust and pylon
    const ex = sx * 2.7, ey = yc - 1.33;
    g.add(place(cylinder(0.46, 0.58, 2.4, white, 14), { x: ex, y: ey, z: -3.0, rx: 90 }));
    g.add(place(cylinder(0.6, 0.6, 0.35, livery, 14), { x: ex, y: ey, z: -3.05, rx: 90 }));
    g.add(place(cylinder(0.5, 0.5, 0.05, dark, 14), { x: ex, y: ey, z: -3.08, rx: 90 }));
    g.add(place(cylinder(0.22, 0.36, 0.5, mat(PALETTE.steel), 10), { x: ex, y: ey, z: -0.6, rx: 90 }));
    g.add(place(box(0.18, 0.6, 1.6, grey), { x: ex, y: ey + 0.35, z: -1.3 }));
  }
  // fin with a stripe, as a profile [h, z] extruded and stood up
  const fin = [[0, 2.6], [0, 5.5], [3.3, 6.0], [3.3, 5.0]];
  const LE = (h) => 2.6 + (h * 2.4) / 3.3, TE = (h) => 5.5 + (h * 0.5) / 3.3;
  const stripe = [[1.5, LE(1.5)], [1.5, TE(1.5)], [2.05, TE(2.05)], [2.05, LE(2.05)]];
  g.add(place(extrude(fin, 0.24, livery), { x: 0.12, y: yc + 0.75, rz: 90 }));
  g.add(place(extrude(stripe, 0.28, accent), { x: 0.14, y: yc + 0.75, rz: 90 }));
  // landing gear
  const strut = mat(PALETTE.steelLight);
  g.add(place(cylinder(0.07, 0.07, yc - R, strut, 6), { z: -6.9 }));
  for (const sx of [-0.13, 0.13]) g.add(place(wheel(0.24, 0.14), { x: sx, y: 0.24, z: -6.9 }));
  for (const sx of [-1.25, 1.25]) {
    g.add(place(cylinder(0.09, 0.09, yc - 0.85, strut, 6), { x: sx, z: 0.7 }));
    for (const dz of [0.4, 1.0]) g.add(place(wheel(0.32, 0.32), { x: sx, y: 0.32, z: dz }));
  }
  return g;
}

/** Baggage tug pulling a few loaded carts, along +x. */
function baggageTrain(seed) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.add(place(box(1.7, 0.7, 1.2, mat(PALETTE.orange)), { y: 0.25 }));
  g.add(place(box(0.7, 0.9, 1.1, glass(PALETTE.glassDark)), { x: -0.3, y: 0.95 }));
  g.add(place(box(0.8, 0.06, 1.2, mat(PALETTE.orange)), { x: -0.3, y: 1.85 }));
  for (const [x, z] of [[-0.55, -0.55], [-0.55, 0.55], [0.55, -0.55], [0.55, 0.55]]) g.add(place(wheel(0.25, 0.2), { x, y: 0.25, z }));
  const bagColors = [PALETTE.red, PALETTE.blue, PALETTE.black, PALETTE.green, PALETTE.purple, PALETTE.yellow, PALETTE.darkGrey];
  for (let c = 0; c < 3; c++) {
    const cx = -2.2 - c * 2.0;
    g.add(place(box(1.6, 0.18, 1.15, mat(PALETTE.steel)), { x: cx, y: 0.35 }));
    g.add(place(box(1.6, 0.06, 1.15, mat(PALETTE.steelDark)), { x: cx, y: 1.45 }));
    for (const px of [-0.75, 0.75]) for (const pz of [-0.52, 0.52]) g.add(place(box(0.06, 0.95, 0.06, mat(PALETTE.steelDark)), { x: cx + px, y: 0.5, z: pz }));
    for (const px of [-0.5, 0.5]) for (const pz of [-0.45, 0.45]) g.add(place(wheel(0.17, 0.12), { x: cx + px, y: 0.17, z: pz }));
    for (let k = 0; k < 4; k++) {
      g.add(place(box(r.range(0.45, 0.6), r.range(0.3, 0.5), r.range(0.3, 0.45), mat(r.pick(bagColors))), { x: cx - 0.45 + (k % 2) * 0.85, y: 0.53, z: k < 2 ? -0.25 : 0.25 }));
    }
    g.add(place(box(0.3, 0.06, 0.06, mat(PALETTE.darkGrey)), { x: cx + 0.95, y: 0.3 }));
  }
  return g;
}

/** Small fuel bowser, along +x. */
function fuelBowser() {
  const g = new THREE.Group();
  g.add(place(box(4.6, 0.35, 2.0, mat(PALETTE.darkGrey)), { y: 0.45 }));
  g.add(place(box(1.3, 1.5, 2.0, mat(PALETTE.white)), { x: 1.65, y: 0.8 }));
  g.add(place(box(0.05, 0.6, 1.7, glass(PALETTE.glassDark)), { x: 2.31, y: 1.55 }));
  g.add(place(cylinder(0.95, 0.95, 3.0, mat(PALETTE.yellow, { roughness: 0.4, metalness: 0.3 }), 14), { x: -0.6, y: 1.75, rz: 90 }));
  for (const x of [1.6, -0.9, -1.9]) for (const z of [-0.9, 0.9]) g.add(place(wheel(0.4, 0.3), { x, y: 0.4, z }));
  return g;
}

/** Airport shuttle bus, along +x. */
function bus() {
  const g = new THREE.Group();
  const body = mat(PALETTE.blue, { roughness: 0.45, metalness: 0.2 });
  g.add(place(box(8.6, 2.5, 2.4, body), { y: 0.4 }));
  g.add(place(box(8.62, 0.85, 2.42, glass(PALETTE.glassDark)), { y: 1.7 }));
  g.add(place(box(8.4, 0.25, 2.2, mat(PALETTE.white)), { y: 2.9 }));
  g.add(place(box(8.64, 0.18, 2.44, mat(PALETTE.white)), { y: 1.2 }));
  for (const x of [2.9, -2.6]) for (const z of [-1.1, 1.1]) g.add(place(wheel(0.45, 0.3), { x, y: 0.45, z }));
  return g;
}

/** Tiny passenger, optionally pulling a suitcase. */
function person(color, seed, bag) {
  const r = rng(seed);
  const g = group(
    cylinder(0.2, 0.24, 1.15, mat(color), 8),
    place(sphere(0.17, mat('#e0b48c'), 8), { y: 1.3 }),
  );
  if (bag) g.add(place(box(0.35, 0.5, 0.2, mat(r.pick([PALETTE.red, PALETTE.navy, PALETTE.black]))), { x: 0.4 }));
  return g;
}

function controlTower() {
  const g = new THREE.Group();
  const white = mat(PALETTE.white);
  g.add(box(2.6, 2.8, 2.6, facade({ style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, seed: 33 })));
  g.add(place(cylinder(0.75, 0.85, 11, white, 12), { y: 2.8 }));
  g.add(place(box(0.25, 10, 0.12, glass(PALETTE.glassDark)), { y: 3.2, z: 0.82 }));
  g.add(place(cylinder(1.45, 0.8, 1.0, white, 12), { y: 13.8 }));
  g.add(place(facadeCylinder({ radius: 1.3, radiusTop: 1.45, h: 1.8, floorHeight: 1.8, segments: 10, bay: 1.2, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.steelDark, lit: 0.3, seed: 34 }), { y: 14.8 }));
  g.add(place(cylinder(1.6, 1.6, 0.3, mat(PALETTE.darkGrey), 12), { y: 16.6 }));
  g.add(place(cylinder(0.5, 0.6, 0.5, white, 10), { y: 16.9 }));
  g.add(place(antenna({ h: 3 }), { x: 0.2, y: 17.4 }));
  g.add(place(box(1.1, 0.3, 0.12, mat(PALETTE.lightGrey)), { x: -0.5, y: 17.7, ry: 30 }));
  g.add(place(cylinder(0.06, 0.06, 0.3, mat(PALETTE.steel), 6), { x: -0.5, y: 17.4 }));
  return g;
}

function windsock() {
  return group(
    cylinder(0.06, 0.08, 4.5, metal(PALETTE.steelLight), 6),
    place(cone(0.35, 1.8, surface('stripes', PALETTE.orange, { color2: PALETTE.white, size: 0.6 }), 10), { x: 0.05, y: 4.2, rz: -90 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 2], 'concrete'));

  // --- ground: kerb, drop-off lane, verge, apron markings -------------------------------
  const LX1 = 1.5; // landside / airside boundary
  g.add(place(patch(LX1 + 15, 6.4 - HZ1, 'paved'), { x: (LX1 - 15) / 2, y: y0, z: (HZ1 + 6.4) / 2 }));
  g.add(place(patch(LX1 + 15, 2.6, 'asphalt'), { x: (LX1 - 15) / 2, y: y0, z: 7.7 }));
  g.add(place(patch(3.5, 1.0, 'asphalt'), { x: -13.25, y: y0, z: 9.5 }));
  g.add(place(patch(3.7, 1.0, 'asphalt'), { x: -0.35, y: y0, z: 9.5 }));
  g.add(place(patch(9.3, 1.0, 'grass'), { x: -6.85, y: y0, z: 9.5 }));
  g.add(place(box(LX1 + 15, 0.12, 0.2, mat(PALETTE.concrete)), { x: (LX1 - 15) / 2, y: y0, z: 6.4 }));
  for (let x = -14; x < 1; x += 2.2) g.add(place(box(1.2, 0.02, 0.15, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: 7.7 }));
  // back service strip
  g.add(place(patch(LX1 + 15, 3.2, 'asphalt'), { x: (LX1 - 15) / 2, y: y0, z: -8.4 }));
  g.add(place(patch(3.6, 3.2, 'grass'), { x: -13.2, y: y0 + 0.01, z: -8.4 }));
  // apron: lead-in line, stop bar, stand boundary
  const PX = 9; // airliner centreline
  const yellow = mat(PALETTE.yellow);
  g.add(place(box(0.22, 0.02, 19.4, yellow), { x: PX, y: y0 }));
  g.add(place(box(2.6, 0.02, 0.3, yellow), { x: PX, y: y0, z: -9.0 }));
  for (let z = -9.6; z < 9.6; z += 1.6) {
    g.add(place(box(0.15, 0.02, 0.9, mat(PALETTE.red)), { x: 2.6, y: y0, z }));
    g.add(place(box(0.15, 0.02, 0.9, mat(PALETTE.white)), { x: 14.7, y: y0, z }));
  }
  g.add(place(box(12.2, 0.02, 0.15, mat(PALETTE.white)), { x: 8.6, y: y0, z: 6.6 }));
  g.add(place(box(1.2, 0.02, 2.2, surface('hazard', PALETTE.yellow, { size: 1 })), { x: 2.0, y: y0, z: -6.2 }));

  // --- terminal --------------------------------------------------------------------------
  g.add(hallWalls());
  g.add(swoopRoof());
  // mezzanine band across the glass front
  g.add(place(box(HX1 - HX0, 0.35, 0.12, mat(PALETTE.white)), { x: (HX0 + HX1) / 2, y: y0 + 3.4, z: HZ1 + 0.06 }));
  // entrance vestibules with signs
  for (const [x, text] of [[-10.2, 'DEPARTURES'], [-3.4, 'ARRIVALS']]) {
    g.add(place(box(3.4, 2.7, 1.3, glass(PALETTE.glassDark)), { x, y: y0, z: HZ1 + 0.65 }));
    g.add(place(box(3.7, 0.2, 1.6, mat(PALETTE.steelLight)), { x, y: y0 + 2.7, z: HZ1 + 0.75 }));
    g.add(place(box(0.1, 2.7, 1.3, mat(PALETTE.steelLight)), { x: x - 0.3, y: y0, z: HZ1 + 0.66 }));
    g.add(place(sign({ text, w: 3.2, h: 0.55, bg: PALETTE.navy, fg: PALETTE.yellow, depth: 0.1 }), { x, y: y0 + 2.9, z: HZ1 + 0.2 }));
  }
  // canopy columns with branching struts
  const steel = mat(PALETTE.steelLight, { metalness: 0.4, roughness: 0.4 });
  for (const x of [-13.6, -9.2, -4.8, -0.4]) {
    const z = 5.8, top = roofBot(x, z);
    g.add(place(cylinder(0.14, 0.16, top - 1.4 - y0, steel, 8), { x, y: y0, z }));
    for (const dx of [-1.1, 1.1]) g.add(beam([x, top - 1.45, z], [x + dx, roofBot(x + dx, z - 0.4) + 0.05, z - 0.4], 0.14, steel));
    g.add(beam([x, top - 1.45, z], [x, roofBot(x, z + 0.4) + 0.05, z + 0.4], 0.14, steel));
  }
  // name board on the roof
  const signY = roofTop(RCX, 6.3) + 0.25;
  g.add(place(sign({ text: 'TINY TOWN AIRPORT', w: 10, h: 1.3, bg: PALETTE.navy, fg: '#ffffff', depth: 0.25 }), { x: RCX, y: signY, z: 3.4 }));
  for (const dx of [-3.5, 0, 3.5]) g.add(place(box(0.15, signY - roofTop(RCX + dx, 3.3) + 0.1, 0.15, mat(PALETTE.steelDark)), { x: RCX + dx, y: roofTop(RCX + dx, 3.3) - 0.1, z: 3.3 }));
  // skylight bands following the curve of the roof
  g.add(roofSkylights([-3.2, 0.6], 0.9));
  // rooftop plant on the low back part of the roof
  for (const x of [-9, -4]) {
    g.add(place(box(2.2, 0.8, 1.4, mat(PALETTE.lightGrey)), { x, y: roofTop(x, -5.8) - 0.15, z: -5.8 }));
    g.add(place(cylinder(0.35, 0.35, 0.15, mat(PALETTE.darkGrey), 10), { x: x + 0.5, y: roofTop(x, -5.8) + 0.65, z: -5.8 }));
  }

  // --- jet bridges + airliner ---------------------------------------------------------------
  g.add(place(airliner(), { x: PX }));
  const doorX = PX - 1.35;
  g.add(place(jetBridge(doorX - HX1, '1'), { x: HX1, y: y0, z: -6.2 }));
  g.add(place(jetBridge(doorX - HX1, '2'), { x: HX1, y: y0, z: 1.9 }));

  // --- ground service vehicles on the apron ----------------------------------------------
  g.add(place(baggageTrain(5), { x: 10.6, y: y0, z: 8.2 }));
  g.add(place(fuelBowser(), { x: 13.5, y: y0, z: -6.0, ry: 90 }));
  // belt loader at the aft hold
  g.add(place(box(1.0, 0.5, 2.2, mat(PALETTE.white)), { x: 12.2, y: y0 + 0.2, z: 3.3, ry: 90 }));
  g.add(place(box(3.2, 0.18, 0.8, mat(PALETTE.darkGrey)), { x: 11.6, y: y0 + 0.95, z: 3.3, rz: -18 }));
  for (const x of [11.5, 12.9]) g.add(place(wheel(0.25, 0.2), { x, y: y0 + 0.25, z: 3.3 }));
  // ground power unit and safety cones
  g.add(place(box(1.4, 0.9, 1.0, mat(PALETTE.green)), { x: 4.4, y: y0, z: -8.7 }));
  const orange = mat(PALETTE.orange);
  for (const [x, z] of [[PX, -9.8], [3.6, 2.6], [14.4, 2.6], [PX + 2.7, -3.6], [PX - 2.7, -3.6]]) g.add(place(cone(0.14, 0.45, orange, 8), { x, y: y0, z }));

  // --- control tower and the back service strip --------------------------------------------
  g.add(place(controlTower(), { x: -12.9, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 8 }), { x: -14.4, y: y0, z: -9.5 }));
  g.add(place(car({ kind: 'van', color: PALETTE.white }), { x: -8.3, y: y0, z: -8.6 }));
  g.add(place(car({ color: PALETTE.red }), { x: -3.4, y: y0, z: -8.6 }));
  for (const x of [-0.4, 0.8]) g.add(place(box(1.1, 1.3, 1.4, mat(PALETTE.aluminium, { metalness: 0.4, roughness: 0.4 })), { x, y: y0, z: -8.6 }));

  // --- landside: kerb traffic, people, verge ------------------------------------------------
  g.add(place(bus(), { x: -10.4, y: y0, z: 7.7 }));
  g.add(place(car({ kind: 'taxi' }), { x: -3.8, y: y0, z: 7.7 }));
  g.add(place(car({ color: SWATCHES.cars[1] }), { x: -0.7, y: y0, z: 7.7 }));
  const people = [[-11.0, 5.2, PALETTE.red, 1], [-9.4, 5.6, PALETTE.navy, 1], [-6.6, 5.0, PALETTE.green, 0], [-4.2, 5.4, PALETTE.purple, 1], [-2.8, 5.1, PALETTE.orange, 0], [-7.6, 6.0, PALETTE.blue, 1]];
  people.forEach(([x, z, c, b], i) => g.add(place(person(c, i + 1, b), { x, y: y0, z, ry: i * 47 })));
  for (const x of [-10.6, -3.2]) g.add(place(tree({ kind: 'poplar', h: 4.2, seed: Math.round(x * 7) }), { x, y: y0, z: 9.5 }));
  for (const x of [-9.0, -4.8]) g.add(place(streetLamp({ h: 4.5 }), { x, y: y0, z: 9.4, ry: 90 }));
  for (const [i, c] of [[0, PALETTE.red], [1, PALETTE.blue], [2, PALETTE.green]]) g.add(place(flag({ h: 5.5, color: c }), { x: -8.0 + i * 0.9, y: y0, z: 9.5 }));

  // --- airside fence, windsock, floodlight -------------------------------------------------
  g.add(place(fence({ w: 0.1, d: 10 - HZ1 - 0.1, h: 1.6, style: 'wire', sides: ['left'] }), { x: LX1 + 0.05, y: y0, z: (HZ1 + 10) / 2 }));
  g.add(place(fence({ w: 15 - LX1 - 0.2, d: 0.1, h: 1.6, style: 'wire', sides: ['front'] }), { x: (LX1 + 15) / 2, y: y0, z: 9.8 }));
  g.add(place(windsock(), { x: 12.6, y: y0, z: 9.3 }));
  return g;
}

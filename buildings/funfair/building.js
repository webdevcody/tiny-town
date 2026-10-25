import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, lot, patch, box, cylinder, cone, sphere, place, group, beam, pipe, fence,
  tree, bench, streetLamp, gableRoof, awning, mat, metal, water, emissive, textured, canvasTexture, signTexture,
} from '../../src/lib/index.js';

const RIDE_COLOURS = [PALETTE.red, PALETTE.yellow, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.purple];

// Vertical stripes for cylinders/cones (u runs around the side).
function stripeMat(key, a, b, count) {
  const tex = canvasTexture(256, 8, (ctx, w, h) => {
    for (let i = 0; i < count; i++) {
      ctx.fillStyle = i % 2 ? b : a;
      ctx.fillRect((i * w) / count, 0, w / count + 1, h);
    }
  }, { key: 'funfair:' + key });
  return textured(tex);
}

/**
 * Sign board with text on +Z (and -Z if double). Like the lib's sign(), but the text
 * face is a plane with 0..1 UVs, so the whole texture fits boards of any size.
 */
function fairSign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false, border = null }) {
  const tw = 256, th = Math.max(16, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const g = group(box(w, h, depth, bg));
  for (const side of double ? [1, -1] : [1]) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), face);
    m.position.set(0, h / 2, side * (depth / 2 + 0.01));
    if (side < 0) m.rotation.y = Math.PI;
    g.add(m);
  }
  return g;
}

/**
 * Ferris wheel in the XY plane (faces +Z). Origin = centre of its base.
 */
function ferrisWheel({ radius = 5.5, hubY = 7.2, cars = 12 } = {}) {
  const g = new THREE.Group();
  const frame = metal(PALETTE.white, { roughness: 0.5 });
  const legM = metal(PALETTE.steelLight, { roughness: 0.5 });
  const half = 0.55; // rim offset in z
  const bulbs = emissive('#ffd36a', 0.9);

  // rims + inner light ring
  for (const z of [-half, half]) {
    const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.13, 5, 48), frame);
    rim.position.set(0, hubY, z);
    g.add(rim);
    const inner = new THREE.Mesh(new THREE.TorusGeometry(radius * 0.62, 0.08, 4, 36), frame);
    inner.position.set(0, hubY, z);
    g.add(inner);
    const lights = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.12, 0.07, 4, 48), bulbs);
    lights.position.set(0, hubY, z + Math.sign(z) * 0.08);
    g.add(lights);
  }
  // spokes
  for (let i = 0; i < cars; i++) {
    const a = (i / cars) * Math.PI * 2;
    const x = Math.cos(a) * radius, y = hubY + Math.sin(a) * radius;
    for (const z of [-half, half]) g.add(beam([0, hubY, z * 0.6], [x, y, z], 0.09, frame));
    // axle for the gondola
    g.add(pipe([x, y, -half], [x, y, half], 0.06, frame));
  }
  // zig-zag bracing between the rims
  for (let i = 0; i < cars; i++) {
    const a0 = (i / cars) * Math.PI * 2, a1 = ((i + 1) / cars) * Math.PI * 2;
    g.add(beam([Math.cos(a0) * radius, hubY + Math.sin(a0) * radius, -half], [Math.cos(a1) * radius, hubY + Math.sin(a1) * radius, half], 0.06, frame));
  }
  // hub
  g.add(place(cylinder(0.45, 0.45, 2.2, metal(PALETTE.red), 12), { y: hubY, z: -1.1, rx: 90 }));
  g.add(place(cylinder(0.75, 0.75, 0.25, metal(PALETTE.yellow), 12), { y: hubY, z: half + 0.05, rx: 90 }));
  g.add(place(cylinder(0.75, 0.75, 0.25, metal(PALETTE.yellow), 12), { y: hubY, z: -half - 0.3, rx: 90 }));

  // A-frame legs on each side
  for (const s of [-1, 1]) {
    const zf = s * 2.2, zt = s * 1.05;
    for (const xs of [-1, 1]) g.add(beam([xs * 3.0, 0.4, zf], [0, hubY, zt], 0.28, legM));
    g.add(beam([-1.9, 3.0, s * 1.85], [1.9, 3.0, s * 1.85], 0.16, legM));
    g.add(beam([-1.9, 3.0, s * 1.85], [0, hubY, zt], 0.1, legM));
    g.add(beam([1.9, 3.0, s * 1.85], [0, hubY, zt], 0.1, legM));
  }

  // gondolas (hang straight down)
  for (let i = 0; i < cars; i++) {
    const a = (i / cars) * Math.PI * 2 + 0.0001;
    const x = Math.cos(a) * radius, y = hubY + Math.sin(a) * radius;
    const c = RIDE_COLOURS[i % RIDE_COLOURS.length];
    const gon = group(
      place(box(0.06, 0.45, 0.06, frame), { y: -0.45 }),
      place(box(0.9, 0.55, 0.8, c), { y: -1.45 }),
      place(box(0.92, 0.3, 0.82, mat(PALETTE.window)), { y: -0.9 }),
      place(box(1.05, 0.12, 0.95, PALETTE.white), { y: -0.6 }),
      place(box(0.08, 0.3, 0.84, c), { x: -0.42, y: -0.9 }),
      place(box(0.08, 0.3, 0.84, c), { x: 0.42, y: -0.9 }),
    );
    gon.position.set(x, y, 0);
    g.add(gon);
  }

  // boarding platform + steps
  g.add(place(box(3.6, 0.5, 2.6, PALETTE.concreteDark), { y: 0 }));
  g.add(place(box(3.6, 0.06, 2.6, PALETTE.paving), { y: 0.5 }));
  g.add(place(box(1.4, 0.25, 0.6, PALETTE.concreteDark), { y: 0, z: 1.6 }));
  return g;
}

/**
 * Carousel with striped tent roof and horses on poles. Origin = centre of base.
 */
function carousel({ radius = 3.2, seed = 0 } = {}) {
  const g = new THREE.Group();
  const roofR = radius + 0.5;
  const topY = 3.0;
  const stripes = stripeMat('roof', PALETTE.red, PALETTE.white, 16);
  const valanceM = stripeMat('valance', PALETTE.yellow, PALETTE.red, 32);
  const gold = metal(PALETTE.glassGold, { roughness: 0.35 });

  // base drum + floor
  g.add(cylinder(radius + 0.2, radius + 0.3, 0.35, mat(PALETTE.navy), 24));
  g.add(place(cylinder(radius, radius, 0.08, mat(PALETTE.woodLight), 24), { y: 0.35 }));
  g.add(place(cylinder(1.0, 1.0, 0.08, PALETTE.yellow, 16), { y: 0.43 })); // step ring
  // central mirrored column
  g.add(place(cylinder(0.85, 0.85, topY - 0.4, stripeMat('core', PALETTE.blue, PALETTE.glassGold, 16), 16), { y: 0.43 }));
  // valance + roof
  g.add(place(cylinder(roofR, roofR, 0.55, valanceM, 32), { y: topY }));
  g.add(place(cylinder(roofR + 0.02, roofR + 0.02, 0.1, emissive('#ffd36a', 0.8), 32), { y: topY + 0.12 }));
  g.add(place(cone(roofR + 0.25, 1.9, stripes, 16), { y: topY + 0.55 }));
  g.add(place(cylinder(0.12, 0.12, 0.7, gold, 8), { y: topY + 2.3 }));
  g.add(place(sphere(0.25, gold, 10), { y: topY + 2.85 }));

  // horses on poles
  const horseCols = [PALETTE.white, PALETTE.woodLight, PALETTE.white, PALETTE.darkGrey];
  const n = 10;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + seed;
    const r = radius - 0.75;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const hy = 1.0 + (i % 2) * 0.35;
    g.add(place(cylinder(0.05, 0.05, topY - 0.43, gold, 6), { x, y: 0.43, z }));
    const col = horseCols[i % horseCols.length];
    const saddle = RIDE_COLOURS[i % RIDE_COLOURS.length];
    const horse = group(
      place(box(0.95, 0.38, 0.3, col), { y: 0 }),
      place(box(0.25, 0.5, 0.2, col), { x: 0.45, y: 0.25, rz: -25 }),
      place(box(0.38, 0.18, 0.2, col), { x: 0.62, y: 0.65 }),
      place(box(0.35, 0.08, 0.34, saddle), { x: -0.05, y: 0.38 }),
      place(box(0.08, 0.4, 0.08, col), { x: 0.35, y: -0.38, z: 0.08 }),
      place(box(0.08, 0.4, 0.08, col), { x: -0.38, y: -0.38, z: -0.08 }),
    );
    horse.position.set(x, hy, z);
    horse.rotation.y = -a - Math.PI / 2; // nose points along the direction of travel
    g.add(horse);
  }
  // a couple of benches (chariots)
  for (const a of [0.55, 3.7]) {
    const r = radius - 0.75;
    g.add(place(box(0.8, 0.6, 0.6, PALETTE.red), { x: Math.cos(a) * r, y: 0.43, z: Math.sin(a) * r, ry: -THREE.MathUtils.radToDeg(a) }));
  }
  return g;
}

/**
 * Market stall facing +Z: counter, striped awning, sign and goods. Origin = centre of base.
 */
function stall({ w = 2.8, d = 2.0, color = PALETTE.red, color2 = PALETTE.white, text = 'FOOD', body = PALETTE.cream, goods = [PALETTE.yellow, PALETTE.red] } = {}) {
  const g = new THREE.Group();
  const H = 2.3;
  g.add(place(box(w, H, 0.15, body), { z: -d / 2 + 0.075 }));
  g.add(place(box(0.12, H, d, body), { x: -w / 2 + 0.06 }));
  g.add(place(box(0.12, H, d, body), { x: w / 2 - 0.06 }));
  g.add(place(box(w, 1.0, 0.45, color), { z: d / 2 - 0.22 }));
  g.add(place(box(w + 0.1, 0.08, 0.6, PALETTE.woodLight), { y: 1.0, z: d / 2 - 0.22 }));
  g.add(place(box(w + 0.3, 0.14, d + 0.2, color), { y: H }));
  g.add(place(gableRoof({ w: w + 0.3, d: d + 0.2, h: 0.6, overhang: 0.05, ridge: 'x', material: stripeMat('stall-' + color + color2, color, color2, 8), gableMaterial: mat(color) }), { y: H + 0.14 }));
  g.add(place(awning({ w: w + 0.2, depth: 0.8, drop: 0.3, color, color2 }), { y: H, z: d / 2 + 0.1 }));
  g.add(place(fairSign({ text, w: w * 0.85, h: 0.55, bg: PALETTE.white, fg: color === PALETTE.yellow ? PALETTE.red : color, border: color }), { y: H + 0.15, z: d / 2 + 0.05 }));
  // goods on the counter
  for (let i = 0; i < 4; i++) {
    const x = -w / 2 + 0.45 + (i * (w - 0.9)) / 3;
    g.add(place(sphere(0.16, goods[i % goods.length], 8), { x, y: 1.08, z: d / 2 - 0.2 }));
  }
  // hanging prizes on the back wall
  for (let i = 0; i < 5; i++) {
    const x = -w / 2 + 0.4 + (i * (w - 0.8)) / 4;
    g.add(place(box(0.3, 0.35, 0.12, RIDE_COLOURS[(i + 2) % RIDE_COLOURS.length]), { x, y: 1.5, z: -d / 2 + 0.2 }));
  }
  return g;
}

/**
 * Mini roller coaster: closed track through [x, z, y] control points (world coords inside the lot,
 * y measured from the base). Red rails, white supports, a train parked near the first point.
 */
function rollerCoaster({ points, train = 3, trainAt = 0 } = {}) {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3(points.map(([x, z, y]) => new THREE.Vector3(x, y, z)), true, 'centripetal');
  const N = 160;
  const up = new THREE.Vector3(0, 1, 0);
  const samples = [];
  for (let i = 0; i < N; i++) {
    const t = i / N;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const lat = new THREE.Vector3().crossVectors(tan, up).normalize();
    const nrm = new THREE.Vector3().crossVectors(lat, tan).normalize();
    samples.push({ p, tan, lat, nrm });
  }
  const railM = metal(PALETTE.red, { roughness: 0.4 });
  const spineM = metal(PALETTE.yellow, { roughness: 0.45 });
  const supM = metal(PALETTE.white, { roughness: 0.5 });
  const tieM = mat(PALETTE.darkGrey);
  const off = 0.38;
  const tube = (pts, r, m) => {
    const c = new THREE.CatmullRomCurve3(pts, true, 'centripetal');
    return new THREE.Mesh(new THREE.TubeGeometry(c, N, r, 5, true), m);
  };
  g.add(tube(samples.map((s) => s.p.clone().addScaledVector(s.lat, off)), 0.08, railM));
  g.add(tube(samples.map((s) => s.p.clone().addScaledVector(s.lat, -off)), 0.08, railM));
  g.add(tube(samples.map((s) => s.p.clone().addScaledVector(s.nrm, -0.3)), 0.14, spineM));

  const basis = (s) => new THREE.Matrix4().makeBasis(s.tan, s.nrm, s.lat);
  samples.forEach((s, i) => {
    if (i % 2 === 0) {
      const tie = box(0.12, 0.1, off * 2 + 0.1, tieM);
      tie.geometry = tie.geometry.clone().translate(0, -0.12, 0);
      tie.quaternion.setFromRotationMatrix(basis(s));
      tie.position.copy(s.p);
      g.add(tie);
    }
    if (i % 8 === 0 && s.p.y > 0.9) {
      const top = s.p.clone().addScaledVector(s.nrm, -0.35);
      g.add(place(cylinder(0.12, 0.12, top.y, supM, 6), { x: top.x, z: top.z }));
      g.add(place(box(0.5, 0.15, 0.5, PALETTE.concreteDark), { x: top.x, z: top.z }));
    }
  });

  // train of cars at the start of the track
  for (let k = 0; k < train; k++) {
    const t = (trainAt + 1 - k * 0.022) % 1;
    const p = curve.getPointAt(t);
    const tan = curve.getTangentAt(t).normalize();
    const lat = new THREE.Vector3().crossVectors(tan, up).normalize();
    const nrm = new THREE.Vector3().crossVectors(lat, tan).normalize();
    const car = group(
      place(box(1.05, 0.45, 0.85, k === 0 ? PALETTE.yellow : PALETTE.blue), { y: 0.05 }),
      place(box(0.2, 0.3, 0.85, PALETTE.white), { x: 0.42, y: 0.5 }),
      place(sphere(0.13, PALETTE.peach, 6), { x: -0.15, y: 0.45, z: 0.2 }),
      place(sphere(0.13, PALETTE.peach, 6), { x: -0.15, y: 0.45, z: -0.2 }),
    );
    car.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(tan, nrm, lat));
    car.position.copy(p);
    g.add(car);
  }
  g.userData.curve = curve;
  return g;
}

/** Little person: body + head. */
function person(color = PALETTE.blue) {
  return group(
    box(0.3, 0.75, 0.2, PALETTE.darkGrey),
    place(cylinder(0.2, 0.2, 0.65, color, 6), { y: 0.7 }),
    place(sphere(0.15, PALETTE.peach, 6), { y: 1.33 }),
  );
}

/** Balloon seller's bunch: strings + coloured spheres. */
function balloons(count = 5) {
  const g = new THREE.Group();
  const string = mat(PALETTE.white);
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const x = Math.cos(a) * 0.35, z = Math.sin(a) * 0.35, y = 2.4 + (i % 2) * 0.35;
    g.add(beam([0, 1.1, 0], [x, y, z], 0.02, string));
    g.add(place(sphere(0.25, RIDE_COLOURS[i % RIDE_COLOURS.length], 8), { x, y, z }));
  }
  return g;
}

/** Bunting: a line of triangular pennants between two points [x, y, z]. */
function bunting(from, to, { count = 10, sag = 0.4 } = {}) {
  const g = new THREE.Group();
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const at = (t) => a.clone().lerp(b, t).add(new THREE.Vector3(0, -sag * 4 * t * (1 - t), 0));
  const line = mat(PALETTE.white);
  for (let i = 0; i < 8; i++) {
    const p = at(i / 8), q = at((i + 1) / 8);
    g.add(beam(p.toArray(), q.toArray(), 0.03, line));
  }
  const dir = b.clone().sub(a).setY(0).normalize();
  const len = 0.5 * a.distanceTo(b) / count;
  for (let i = 0; i < count; i++) {
    const p = at((i + 0.5) / count);
    const geo = new THREE.BufferGeometry();
    const l = dir.clone().multiplyScalar(len / 2);
    const v = [p.x - l.x, p.y, p.z - l.z, p.x + l.x, p.y, p.z + l.z, p.x, p.y - 0.45, p.z];
    geo.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
    geo.computeVertexNormals();
    g.add(new THREE.Mesh(geo, mat(RIDE_COLOURS[i % RIDE_COLOURS.length], { side: THREE.DoubleSide })));
  }
  return g;
}

// 2x2 tiles (20 x 20 m). Front (street, entrance gate) faces +z.
// Back-left: Ferris wheel. Back-right: mini roller coaster. Front-right: carousel.
// Front-left: midway with stalls, high striker, duck pond and food cart.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // ground: paved midway across the front half, paths to the rides at the back
  g.add(place(patch(19.2, 9.2, 'paved'), { y: y0, z: 4.9 }));
  g.add(place(patch(3.2, 4.8, 'paved'), { x: -4.0, y: y0, z: -1.8 }));
  g.add(place(patch(2.6, 4.4, 'paved'), { x: 1.5, y: y0, z: -2.0 }));
  g.add(place(patch(7.6, 7.6, 'gravel'), { x: 5.9, y: y0, z: -5.3 }));
  g.add(place(cylinder(4.1, 4.1, 0.06, mat(PALETTE.cream), 28), { x: 5.6, y: y0, z: 5.0 }));

  // --- Ferris wheel (back-left) ---
  g.add(place(ferrisWheel({ radius: 5.3, hubY: 7.4, cars: 12 }), { x: -4.0, y: y0, z: -5.4 }));
  g.add(place(fairSign({ text: 'BIG WHEEL', w: 2.6, h: 0.6, bg: PALETTE.navy, fg: PALETTE.yellow }), { x: -4.0, y: y0 + 2.4, z: -2.85 }));
  g.add(place(box(0.1, 2.4, 0.1, PALETTE.darkGrey), { x: -5.2, y: y0, z: -2.9 }));
  g.add(place(box(0.1, 2.4, 0.1, PALETTE.darkGrey), { x: -2.8, y: y0, z: -2.9 }));

  // --- Mini roller coaster (back-right) ---
  const track = [
    [2.9, -1.6, 0.9], [2.9, -3.8, 0.9], [2.9, -6.0, 3.0], [3.1, -8.2, 5.8], [4.4, -9.1, 6.2],
    [6.0, -8.7, 2.8], [7.6, -8.6, 1.0], [8.9, -8.0, 1.4], [9.1, -6.0, 4.0], [8.8, -3.9, 1.6],
    [8.6, -1.8, 1.2], [7.2, -1.1, 2.6], [5.6, -2.3, 2.0], [4.5, -4.6, 1.5], [5.6, -6.3, 2.8],
    [6.8, -5.0, 1.4], [5.5, -1.2, 1.0], [3.8, -1.0, 0.9],
  ];
  g.add(place(rollerCoaster({ points: track, train: 4, trainAt: 0.45 }), { y: y0 }));
  // station: platform, posts and roof over the start of the track
  g.add(place(box(1.1, 0.85, 3.4, PALETTE.paving), { x: 1.8, y: y0, z: -2.7 }));
  for (const [x, z] of [[1.4, -1.1], [1.4, -4.3], [3.6, -1.1], [3.6, -4.3]]) {
    g.add(place(box(0.15, 2.9, 0.15, PALETTE.white), { x, y: y0, z }));
  }
  g.add(place(gableRoof({ w: 2.6, d: 3.6, h: 0.9, overhang: 0.2, ridge: 'z', material: mat(PALETTE.blue), gableMaterial: mat(PALETTE.white) }), { x: 2.5, y: y0 + 2.9, z: -2.7 }));
  g.add(place(fairSign({ text: 'COASTER', w: 2.2, h: 0.5, bg: PALETTE.red, fg: '#ffffff' }), { x: 2.5, y: y0 + 2.4, z: -0.95 }));

  // --- Carousel (front-right) ---
  g.add(place(carousel({ radius: 3.2 }), { x: 5.6, y: y0, z: 5.0 }));

  // --- Stalls along the left edge, facing the midway (+x) ---
  const stalls = [
    { text: 'HOT DOGS', color: PALETTE.red, color2: PALETTE.white, goods: [PALETTE.orange, PALETTE.yellow] },
    { text: 'CANDY', color: PALETTE.purple, color2: PALETTE.pink, body: PALETTE.white, goods: [PALETTE.pink, PALETTE.white] },
    { text: 'HOOPLA', color: PALETTE.green, color2: PALETTE.yellow, goods: [PALETTE.red, PALETTE.blue] },
  ];
  stalls.forEach((s, i) => g.add(place(stall(s), { x: -8.6, y: y0, z: 1.9 + i * 3.1, ry: 90 })));
  // ice cream stall facing the gate, next to the wheel path
  g.add(place(stall({ w: 2.4, d: 1.7, text: 'ICE CREAM', color: PALETTE.blue, color2: PALETTE.white, body: PALETTE.cream, goods: [PALETTE.pink, PALETTE.white, PALETTE.yellow] }), { x: -1.4, y: y0, z: 1.3 }));

  // high striker ("test your strength")
  const hs = group(
    box(1.0, 0.25, 0.8, PALETTE.woodDark),
    place(box(0.35, 4.6, 0.25, PALETTE.white), { y: 0.25 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 1.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 2.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 3.0 }),
    place(box(0.37, 0.4, 0.27, PALETTE.red), { y: 4.0 }),
    place(sphere(0.3, metal(PALETTE.glassGold, { roughness: 0.3 }), 10), { y: 4.75 }),
    place(box(0.5, 0.12, 0.5, PALETTE.yellow), { y: 0.25 }),
  );
  g.add(place(hs, { x: -6.4, y: y0, z: 8.6 }));

  // hook-a-duck pond
  g.add(place(cylinder(1.1, 1.15, 0.45, mat(PALETTE.yellow), 16), { x: -4.8, y: y0, z: 4.6 }));
  g.add(place(cylinder(0.95, 0.95, 0.05, water(PALETTE.pool), 16), { x: -4.8, y: y0 + 0.42, z: 4.6 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(place(group(box(0.28, 0.16, 0.18, PALETTE.yellow), place(box(0.12, 0.14, 0.12, PALETTE.yellow), { x: 0.12, y: 0.14 })), { x: -4.8 + Math.cos(a) * 0.6, y: y0 + 0.45, z: 4.6 + Math.sin(a) * 0.6, ry: -THREE.MathUtils.radToDeg(a) + 90 }));
  }
  g.add(place(awning({ w: 2.6, depth: 0.9, drop: 0.25, color: PALETTE.yellow, color2: PALETTE.red }), { x: -4.8, y: y0 + 2.2, z: 3.4 }));
  g.add(place(box(0.1, 2.2, 0.1, PALETTE.darkGrey), { x: -6.0, y: y0, z: 3.4 }));
  g.add(place(box(0.1, 2.2, 0.1, PALETTE.darkGrey), { x: -3.6, y: y0, z: 3.4 }));

  // popcorn cart with umbrella
  const cart = group(
    place(box(1.2, 0.9, 0.7, PALETTE.red), { y: 0.3 }),
    place(box(0.9, 0.6, 0.5, mat(PALETTE.windowLit, { transparent: true, opacity: 0.85 })), { y: 1.2 }),
    place(cylinder(0.25, 0.25, 0.12, PALETTE.darkGrey, 8), { x: -0.35, y: 0.05, z: 0.38, rx: 90 }),
    place(cylinder(0.25, 0.25, 0.12, PALETTE.darkGrey, 8), { x: 0.35, y: 0.05, z: 0.38, rx: 90 }),
    place(cylinder(0.04, 0.04, 2.2, PALETTE.white, 6), { y: 0.3 }),
    place(cylinder(0.02, 1.2, 0.45, mat(PALETTE.yellow), 8), { y: 2.3 }),
  );
  g.add(place(cart, { x: -1.0, y: y0, z: 6.6, ry: -20 }));

  // balloon seller
  g.add(place(person(PALETTE.green), { x: -3.0, y: y0, z: 7.4 }));
  g.add(place(balloons(6), { x: -3.0, y: y0, z: 7.4 }));

  // entrance gate with FUNFAIR sign
  const gateM = mat(PALETTE.red);
  for (const x of [-1.8, 1.8]) {
    g.add(place(box(0.45, 3.8, 0.45, gateM), { x, y: y0, z: 9.5 }));
    g.add(place(sphere(0.32, PALETTE.yellow, 10), { x, y: y0 + 3.8, z: 9.5 }));
  }
  g.add(place(box(4.0, 0.35, 0.35, PALETTE.yellow), { y: y0 + 3.2, z: 9.5 }));
  g.add(place(fairSign({ text: 'FUNFAIR', w: 3.4, h: 0.85, bg: PALETTE.blue, fg: PALETTE.yellow, border: PALETTE.yellow, double: true }), { y: y0 + 3.55, z: 9.5 }));
  // ticket booth
  const booth = group(
    box(1.3, 2.0, 1.2, PALETTE.yellow),
    place(box(0.9, 0.6, 0.05, mat(PALETTE.window)), { y: 1.1, z: 0.6 }),
    place(cylinder(0.01, 1.0, 0.7, mat(PALETTE.red), 4), { y: 2.0, ry: 45 }),
    place(fairSign({ text: 'TICKETS', w: 1.2, h: 0.3, bg: PALETTE.red, fg: '#ffffff' }), { y: 1.75, z: 0.62 }),
  );
  g.add(place(booth, { x: -3.0, y: y0, z: 8.9 }));

  // perimeter railing with the gate gap
  g.add(place(fence({ w: 19.6, d: 19.6, h: 1.0, style: 'railing', color: PALETTE.white, gap: 3.2 }), { y: y0 }));

  // bunting over the midway
  g.add(bunting([-1.8, y0 + 3.6, 9.5], [-8.6, y0 + 3.0, 6.9], { count: 10, sag: 0.5 }));
  g.add(bunting([1.8, y0 + 3.6, 9.5], [5.6, y0 + 3.7, 8.6], { count: 6, sag: 0.4 }));
  g.add(bunting([-8.6, y0 + 3.0, 3.7], [-1.4, y0 + 3.0, 2.3], { count: 9, sag: 0.5 }));

  // lamps, benches, bins
  for (const [x, z, ry] of [[-6.8, 1.2, 0], [1.2, 8.6, 180], [-0.4, -0.6, 180]]) g.add(place(streetLamp({ h: 4 }), { x, y: y0, z, ry }));
  g.add(place(bench({ w: 1.5 }), { x: 1.2, y: y0, z: 0.6, ry: 180 }));
  g.add(place(bench({ w: 1.5 }), { x: -6.6, y: y0, z: -0.2 }));
  for (const [x, z] of [[-2.2, 4.2], [1.4, 3.2]]) g.add(place(cylinder(0.25, 0.22, 0.75, PALETTE.green, 8), { x, y: y0, z }));

  // visitors
  const people = [
    [-6.8, 2.6, PALETTE.blue], [-6.9, 5.3, PALETTE.red], [-7.0, 7.9, PALETTE.yellow], [-3.6, 5.6, PALETTE.purple],
    [-1.4, 3.2, PALETTE.orange], [0.2, 7.9, PALETTE.white], [0.6, 5.0, PALETTE.blue], [1.6, 6.2, PALETTE.pink],
    [-4.6, -0.6, PALETTE.green], [-3.8, -1.6, PALETTE.red], [1.8, -0.4, PALETTE.yellow], [-5.6, 8.0, PALETTE.navy],
    [2.4, 1.9, PALETTE.red], [-2.2, 9.1, PALETTE.orange],
  ];
  for (const [x, z, c] of people) g.add(place(person(c), { x, y: y0, z, s: 0.95 }));

  // trees and hedges round the back
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 3 }), { x: -8.6, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'cone', h: 5.5, seed: 4 }), { x: -0.6, y: y0, z: -8.6 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 8 }), { x: -8.6, y: y0, z: -1.2 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 9 }), { x: 8.7, y: y0, z: 0.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -0.8, y: y0, z: -6.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 6 }), { x: -8.8, y: y0, z: -5.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 7 }), { x: 9.0, y: y0, z: 9.0 }));
  return g;
}

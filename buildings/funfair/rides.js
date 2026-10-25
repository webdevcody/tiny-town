import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, group, place, beam, pipe, awning,
  mat, metal, emissive, textured, canvasTexture, signTexture, gableRoof,
} from '../../src/lib/index.js';

const RIDE_COLOURS = [PALETTE.red, PALETTE.yellow, PALETTE.blue, PALETTE.green, PALETTE.orange, PALETTE.purple];

// Vertical stripes that line up with the segments of a cylinder/cone (u runs around).
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
export function fairSign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false, border = null }) {
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
export function ferrisWheel({ radius = 5.5, hubY = 7.2, cars = 12 } = {}) {
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
export function carousel({ radius = 3.2, seed = 0 } = {}) {
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
export function stall({ w = 2.8, d = 2.0, color = PALETTE.red, color2 = PALETTE.white, text = 'FOOD', body = PALETTE.cream, goods = [PALETTE.yellow, PALETTE.red] } = {}) {
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
export function rollerCoaster({ points, train = 3, trainAt = 0 } = {}) {
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
export function person(color = PALETTE.blue) {
  return group(
    box(0.3, 0.75, 0.2, PALETTE.darkGrey),
    place(cylinder(0.2, 0.2, 0.65, color, 6), { y: 0.7 }),
    place(sphere(0.15, PALETTE.peach, 6), { y: 1.33 }),
  );
}

/** Balloon seller's bunch: strings + coloured spheres. */
export function balloons(count = 5) {
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
export function bunting(from, to, { count = 10, sag = 0.4 } = {}) {
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

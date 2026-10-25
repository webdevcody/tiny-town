import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, place, group, mat, metal, emissive, glass, shade,
  container, facadeBlock, surface, signTexture, textured, fence, tree, car, streetLamp, cone, beam,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street, gate) faces +z.
// Container rows run along X with 1.5 m lanes between them for the straddle carrier's legs.

const CH = 2.6; // container height
const CW = 2.44; // container width
const ROW_X = 2.7; // centre of the 12.2 m row slot
const ROWS_Z = [-8.3, -4.36, -0.42, 3.52];

const C = PALETTE;
const REEFER = '#e8ecef';

// Container with door bars on its +x end (and a reefer unit on the -x end when white).
function box20(color, length, { doors = true, reefer = false } = {}) {
  const g = group(container({ color, length }));
  const bar = mat(shade(color, -0.35));
  if (doors) {
    for (const z of [-0.85, -0.3, 0.3, 0.85]) g.add(place(box(0.05, 2.3, 0.06, bar), { x: length / 2 + 0.02, y: 0.15, z }));
    g.add(place(box(0.04, 2.4, 0.03, bar), { x: length / 2 + 0.01, y: 0.1 }));
  }
  if (reefer) {
    g.add(place(box(0.08, 1.9, 2.0, mat(C.steelLight)), { x: -length / 2 - 0.03, y: 0.35 }));
    g.add(place(box(0.06, 0.7, 0.7, mat(C.darkGrey)), { x: -length / 2 - 0.08, y: 1.35, z: -0.45 }));
  }
  return g;
}

// Flat text label facing +z. (lib sign() maps its texture in metres, which clips long text.)
function label(text, { w, h, bg, fg = '#ffffff' }) {
  const th = Math.max(16, Math.round(256 / (w / h)));
  const tex = signTexture(text, { bg, fg, width: 256, height: th });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  m.position.y = h / 2;
  return group(m);
}

// Company name painted on a container side.
function decal(text, color, w) {
  return label(text, { w, h: 1.2, bg: color });
}

function stack(colors, length, x, z, { seed = 0, logo } = {}) {
  const g = new THREE.Group();
  colors.forEach((col, i) => {
    const reefer = col === REEFER;
    const c = box20(col, length, { reefer });
    g.add(place(c, { x, y: LOT_HEIGHT + i * (CH + 0.02), z }));
    if (logo && i === colors.length - 1 - (seed % 2)) {
      g.add(place(decal(logo, col, Math.min(length - 1.2, 4.8)), { x, y: LOT_HEIGHT + i * (CH + 0.02) + 0.7, z: z + CW / 2 + 0.01 }));
      g.add(place(decal(logo, col, Math.min(length - 1.2, 4.8)), { x, y: LOT_HEIGHT + i * (CH + 0.02) + 0.7, z: z - CW / 2 - 0.01, ry: 180 }));
    }
  });
  return g;
}

// Tall floodlight mast: tapered pole, service platform and a head frame of lamps.
function lightMast({ h = 15, face = 0 } = {}) {
  const pole = metal(C.steelLight, { roughness: 0.4 });
  const dark = metal(C.steelDark);
  const lamp = emissive(C.windowLit, 1.1);
  const g = group(
    box(0.9, 0.4, 0.9, mat(C.concrete)),
    cylinder(0.14, 0.26, h, pole, 8),
    place(box(1.6, 0.08, 1.6, dark), { y: h - 1.4 }),
  );
  // platform railing
  for (const [x, z, w, d] of [[0, 0.78, 1.6, 0.05], [0, -0.78, 1.6, 0.05], [0.78, 0, 0.05, 1.6], [-0.78, 0, 0.05, 1.6]]) {
    g.add(place(box(w, 0.5, d, dark), { x, z, y: h - 1.32 }));
  }
  // head frame with two rows of floodlights tilted towards the yard
  const head = new THREE.Group();
  head.add(place(box(0.12, 1.4, 2.6, dark), { x: 0.15, y: 0 }));
  for (const yy of [0.25, 0.95]) {
    for (const zz of [-0.95, 0, 0.95]) {
      const f = group(
        place(box(0.35, 0.5, 0.75, mat(C.darkGrey)), { x: 0 }),
        place(box(0.05, 0.42, 0.65, lamp), { x: 0.19, y: 0.04 }),
      );
      f.rotation.z = THREE.MathUtils.degToRad(-25);
      head.add(place(f, { x: 0.45, y: yy, z: zz }));
    }
  }
  g.add(place(head, { y: h - 0.4, ry: face }));
  g.add(place(cylinder(0.1, 0.1, 0.5, emissive(C.red, 1.2), 6), { y: h + 1.0 }));
  return g;
}

// Straddle carrier, length along X, straddling a row that runs along X. Carries a 20 ft box.
function straddleCarrier({ load = C.blue } = {}) {
  const g = new THREE.Group();
  const yel = mat(C.yellow, { roughness: 0.5 });
  const yelDark = mat(shade(C.yellow, -0.2), { roughness: 0.5 });
  const dark = mat(C.darkGrey);
  const tyre = mat(C.black);
  const H = 9.4; // underside of the top girders
  const L = 7.6; // leg spacing along X
  const Z = 1.78; // side frame offset

  for (const s of [-1, 1]) {
    const z = s * Z;
    // bottom bogie beam + wheels
    g.add(place(box(L + 0.9, 0.5, 0.45, dark), { y: 0.75, z }));
    g.add(place(box(0.9, 0.12, 0.47, surfaceHazard()), { x: (L + 0.9) / 2 - 0.45, y: 1.2, z }));
    g.add(place(box(0.9, 0.12, 0.47, surfaceHazard()), { x: -(L + 0.9) / 2 + 0.45, y: 1.2, z }));
    for (const x of [-L / 2 - 0.1, -L / 6, L / 6, L / 2 + 0.1]) {
      const wg = new THREE.CylinderGeometry(0.55, 0.55, 0.42, 12);
      wg.rotateX(Math.PI / 2);
      const w = new THREE.Mesh(wg, tyre);
      w.position.set(x, 0.55, z);
      g.add(w);
      g.add(place(cylinder(0.25, 0.25, 0.44, mat(C.yellow), 8), { x, y: 0.55, z: z - 0.22, rx: 90 }));
    }
    // legs
    for (const x of [-L / 2, L / 2]) g.add(place(box(0.55, H - 1.0, 0.55, yel), { x, y: 1.0, z }));
    // diagonal brace + mid rail
    g.add(beam([-L / 2, 2.0, z], [L / 2 - 0.4, H - 0.4, z], 0.25, yelDark));
    g.add(place(box(L, 0.3, 0.35, yelDark), { y: 4.6, z }));
    // top girder
    g.add(place(box(L + 1.2, 0.9, 0.7, yel), { y: H, z }));
  }
  // cross beams over the row
  for (const x of [-L / 2, L / 2]) g.add(place(box(0.7, 0.75, 2 * Z + 0.7, yel), { x, y: H + 0.08 }));
  // engine house on the back girder, cab on the front
  g.add(place(box(3.2, 1.3, 1.1, mat(C.yellow)), { x: -0.8, y: H + 0.9, z: -Z }));
  g.add(place(box(0.6, 0.9, 0.08, mat(C.darkGrey)), { x: -0.8, y: H + 1.1, z: -Z - 0.56 }));
  g.add(place(cylinder(0.08, 0.08, 0.9, mat(C.darkGrey), 6), { x: -1.9, y: H + 2.2, z: -Z }));
  const cab = group(
    box(1.8, 1.9, 1.7, mat(C.white)),
    place(box(1.6, 1.0, 0.05, glass(C.glassDark)), { y: 0.65, z: 0.86 }),
    place(box(0.05, 1.0, 1.4, glass(C.glassDark)), { x: 0.91, y: 0.65 }),
    place(box(0.05, 1.0, 1.4, glass(C.glassDark)), { x: -0.91, y: 0.65 }),
    place(box(2.0, 0.12, 1.9, mat(C.yellow)), { y: 1.9 }),
    place(cylinder(0.12, 0.12, 0.2, emissive(C.orange, 1.2), 8), { y: 2.02 }),
  );
  g.add(place(cab, { x: L / 2 - 0.6, y: H + 0.9, z: Z + 0.2 }));
  // hoist: ropes and spreader holding a container
  const loadY = 3.35;
  const spreader = metal(C.steelDark);
  for (const x of [-2.4, 2.4]) for (const z of [-0.8, 0.8]) {
    g.add(beam([x, loadY + CH + 0.35, z], [x * 0.9, H - 0.05, z * 1.4], 0.06, spreader));
  }
  g.add(place(box(6.3, 0.3, 2.3, mat(C.yellow)), { y: loadY + CH + 0.05 }));
  g.add(place(box20(load, 6.0), { y: loadY }));
  return g;
}

function surfaceHazard() {
  return surface('hazard', C.yellow, { size: 0.8 });
}

// Container chassis truck: cab facing -x, 20 ft box on a skeletal trailer.
function containerTruck({ color = C.red, load = C.green } = {}) {
  const g = new THREE.Group();
  const tyre = mat(C.black);
  const wheel = (x, z) => {
    const wg = new THREE.CylinderGeometry(0.48, 0.48, 0.32, 10);
    wg.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wg, tyre);
    w.position.set(x, 0.48, z);
    return w;
  };
  // tractor
  g.add(place(box(2.2, 2.5, 2.4, mat(color, { roughness: 0.45 })), { x: -3.9, y: 0.75 }));
  g.add(place(box(0.05, 0.95, 2.1, glass(C.glassDark)), { x: -5.02, y: 2.05 }));
  g.add(place(box(0.08, 0.5, 2.0, mat(C.chrome)), { x: -5.02, y: 0.9 }));
  g.add(place(box(2.0, 0.35, 2.3, mat(C.darkGrey)), { x: -2.0, y: 0.75 }));
  g.add(place(cylinder(0.09, 0.09, 1.8, mat(C.steelLight), 6), { x: -2.7, y: 1.6, z: 0.95 }));
  // skeletal trailer
  g.add(place(box(6.6, 0.3, 0.5, mat(C.darkGrey)), { x: 1.7, y: 1.05, z: -0.75 }));
  g.add(place(box(6.6, 0.3, 0.5, mat(C.darkGrey)), { x: 1.7, y: 1.05, z: 0.75 }));
  for (const [x, z] of [[-4.4, -1.05], [-4.4, 1.05], [-2.4, -1.05], [-2.4, 1.05], [3.4, -1.05], [3.4, 1.05], [4.5, -1.05], [4.5, 1.05]]) g.add(wheel(x, z));
  g.add(place(box20(load, 6.06), { x: 1.75, y: 1.35 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'asphalt'));

  // concrete stacking strips under each row, yellow lane lines between them
  const lineY = mat(C.yellow);
  const lineW = mat(C.white);
  for (const z of ROWS_Z) {
    g.add(place(patch(12.8, 2.9, 'concrete', 0.04), { x: ROW_X, y: y0, z }));
    for (const s of [-1, 1]) g.add(place(box(12.8, 0.02, 0.12, lineY), { x: ROW_X, y: y0 + 0.04, z: z + s * 1.45 }));
    // slot ends
    for (const x of [ROW_X - 6.4, ROW_X, ROW_X + 6.4]) g.add(place(box(0.12, 0.02, 2.9, lineW), { x, y: y0 + 0.04, z }));
  }
  // truck lane along the front with dashed centre line
  for (let x = -9; x < 9; x += 2.4) g.add(place(box(1.3, 0.02, 0.15, lineW), { x: x + 0.65, y: y0 + 0.01, z: 7.25 }));
  g.add(place(box(1.8, 0.02, 2.8, mat(C.white)), { x: 5.2, y: y0 + 0.01, z: 8.4 }));
  for (let i = 0; i < 6; i++) g.add(place(box(0.25, 0.025, 2.8, mat(C.darkGrey)), { x: 4.5 + i * 0.28, y: y0 + 0.012, z: 8.4 }));

  // ---- container stacks (colours per tier, bottom first) ----
  const S20 = 6.0, S40 = 12.2;
  const L = ROW_X - 3.08, R = ROW_X + 3.08;
  // back row
  g.add(stack([C.blue, C.red, C.orange], S20, L, ROWS_Z[0], { logo: 'PORTO', seed: 1 }));
  g.add(stack([C.green, C.navy, C.lightGrey], S20, R, ROWS_Z[0]));
  // second row: 40 ft boxes
  g.add(stack([C.rust, C.navy], S40, ROW_X, ROWS_Z[1], { logo: 'OCEANIX', seed: 0 }));
  // third row
  g.add(stack([REEFER, REEFER], S20, L, ROWS_Z[2]));
  g.add(stack([C.red, C.yellow, C.blue], S20, R, ROWS_Z[2], { logo: 'BLUWAVE', seed: 0 }));
  // front row: carrier is busy over the left slot
  g.add(stack([C.orange], S20, L, ROWS_Z[3]));
  g.add(stack([C.green, C.red], S20, R, ROWS_Z[3], { logo: 'TINYLINE', seed: 1 }));

  g.add(place(straddleCarrier({ load: C.blue }), { x: L - 0.2, y: y0, z: ROWS_Z[3] }));

  // ---- light masts ----
  g.add(place(lightMast({ h: 15, face: 180 }), { x: 9.35, y: y0, z: -6.33 }));
  g.add(place(lightMast({ h: 15, face: 180 }), { x: 9.35, y: y0, z: 1.55 }));
  g.add(place(lightMast({ h: 15, face: 0 }), { x: -9.2, y: y0, z: -2.6 }));

  // ---- site office: two stacked portacabins with an outside stair ----
  const ox = -7.0, oz = -7.4;
  g.add(place(patch(5.6, 5.2, 'paved'), { x: ox, y: y0, z: oz + 0.3 }));
  const cabin = { w: 4.8, d: 2.5, floors: 1, floorHeight: 2.7, style: 'punched', wall: C.white, frame: C.blue, glass: C.window, bay: 1.6, windowW: 0.55, windowH: 0.45, lit: 0.3, roof: C.lightGrey };
  g.add(place(facadeBlock({ ...cabin, seed: 3, blank: ['left'] }), { x: ox, y: y0, z: oz }));
  g.add(place(facadeBlock({ ...cabin, seed: 4, blank: ['left'] }), { x: ox, y: y0 + 2.72, z: oz }));
  g.add(place(box(4.9, 0.18, 2.6, mat(C.blue)), { x: ox, y: y0 + 2.6, z: oz }));
  g.add(place(box(4.9, 0.18, 2.6, mat(C.blue)), { x: ox, y: y0 + 5.42, z: oz }));
  g.add(place(box(3.6, 0.8, 0.08, mat(C.blue)), { x: ox, y: y0 + 5.6, z: oz + 0.9 }));
  g.add(place(label('YARD OFFICE', { w: 3.4, h: 0.6, bg: C.blue }), { x: ox, y: y0 + 5.7, z: oz + 0.95 }));
  // stair + landing on the front
  for (let i = 0; i < 9; i++) g.add(place(box(1.0, 0.08, 0.32, metal(C.steelDark)), { x: ox + 1.6 - i * 0.3, y: y0 + 0.3 * (i + 1), z: oz + 1.8 }));
  g.add(place(box(1.6, 0.1, 0.9, metal(C.steelDark)), { x: ox - 1.5, y: y0 + 2.7, z: oz + 1.75 }));
  g.add(place(box(1.6, 0.6, 0.04, metal(C.yellow)), { x: ox - 1.5, y: y0 + 2.8, z: oz + 2.2 }));
  for (const x of [ox - 2.2, ox - 0.8]) g.add(place(box(0.08, 2.7, 0.08, metal(C.steelDark)), { x, y: y0, z: oz + 2.15 }));
  g.add(place(box(0.9, 2.0, 0.06, mat(C.navy)), { x: ox + 1.6, y: y0, z: oz + 1.27 }));

  // staff parking next to the office
  g.add(place(car({ color: C.red }), { x: -7.6, y: y0, z: -3.0, ry: 90, s: 0.62 }));
  g.add(place(car({ color: C.lightGrey, kind: 'van' }), { x: -5.3, y: y0, z: -3.0, ry: 90, s: 0.62 }));
  for (const x of [-8.75, -6.45, -4.15]) g.add(place(box(0.1, 0.02, 3.2, lineW), { x, y: y0 + 0.01, z: -3.0 }));

  // stray empties and pallets on the left apron
  g.add(place(box20(C.purple, 6.0), { x: -7.0, y: y0, z: 0.4, ry: 90 }));
  for (const [x, z] of [[-4.6, -0.6], [-4.6, 0.1]]) {
    g.add(place(box(1.1, 0.15, 0.9, mat(C.wood)), { x, y: y0, z }));
    g.add(place(box(1.1, 0.15, 0.9, mat(C.wood)), { x, y: y0 + 0.17, z }));
  }

  // ---- truck lane: container truck heading for the gate ----
  g.add(place(containerTruck({ color: C.red, load: C.green }), { x: -3.0, y: y0, z: 7.6, ry: 180 }));

  // gatehouse + boom barrier at the front right exit
  const gx = 8.6, gz = 7.6;
  g.add(place(box(2.3, 0.2, 2.6, mat(C.concrete)), { x: gx, y: y0, z: gz }));
  g.add(place(facadeBlock({ w: 1.8, d: 2.1, floors: 1, floorHeight: 2.6, style: 'ribbon', wall: C.cream, glass: C.glassSky, frame: C.white, lit: 0.5, seed: 9, roof: C.white }), { x: gx, y: y0 + 0.2, z: gz }));
  g.add(place(box(2.4, 0.2, 2.8, mat(C.red)), { x: gx, y: y0 + 2.8, z: gz }));
  g.add(place(box(0.35, 1.0, 0.35, mat(C.darkGrey)), { x: gx - 1.5, y: y0, z: 9.3 }));
  g.add(place(box(5.4, 0.12, 0.12, surfaceStripe()), { x: gx - 1.5 - 2.7, y: y0 + 0.95, z: 9.3 }));
  // traffic cones and bollards
  for (const [x, z] of [[1.0, 5.9], [1.8, 5.9], [-8.6, 5.9]]) g.add(place(cone(0.18, 0.6, mat(C.orange), 8), { x, y: y0, z }));
  for (const x of [3.4, 9.6]) g.add(place(cylinder(0.12, 0.12, 0.9, mat(C.yellow), 6), { x, y: y0, z: 9.5 }));

  // ---- perimeter fence (gap at the front right for the gate) ----
  const H = 2.2;
  g.add(place(fence({ w: 19.6, d: 19.6, h: H, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  g.add(place(fence({ w: 13.0, d: 0, h: H, style: 'wire', sides: ['front'] }), { x: -3.3, y: y0, z: 9.8 }));
  g.add(place(box(6.2, 1.2, 0.08, mat(C.navy)), { x: -4.6, y: y0 + 0.9, z: 9.84 }));
  g.add(place(label('CONTAINER TERMINAL', { w: 6.0, h: 1.0, bg: C.navy }), { x: -4.6, y: y0 + 1.0, z: 9.89 }));
  g.add(place(streetLamp({ h: 5 }), { x: 3.2, y: y0, z: 9.3, ry: 0 }));
  // a little greenery by the office
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 31 }), { x: -8.9, y: y0, z: 8.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 32 }), { x: -4.6, y: y0, z: -9.3 }));
  return g;
}

function surfaceStripe() {
  return surface('stripes', C.red, { color2: C.white, size: 1.0 });
}

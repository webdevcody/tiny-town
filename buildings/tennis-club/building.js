import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, door, box, cylinder, cone, sphere, place, group,
  awning, flag, bench, tree, hedge, mat, metal, emissive, surface, textured, signTexture,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Clubhouse + stands on the west end, two hard courts in one fenced cage to the east.

const COURT_BLUE = '#3567a8';
const SURROUND = '#3f8a57';
const FENCE_GREEN = '#2c4f38';
const LINE = '#f4f4ef';

// sign board with 0..1 UVs on the front face (lib box() UVs are in metres)
function clubSign(text, w, h, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round(512 * h / w), border: fg });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, 0.081);
  return group(box(w, h, 0.16, mat(bg)), face);
}

// court: 4.8 x 8.6 m doubles area, lines drawn as thin slabs, net across z = 0
function court() {
  const g = new THREE.Group();
  const W = 4.8, L = 8.6, t = 0.09, y = 0.035;
  const lineM = mat(LINE);
  g.add(box(W, 0.035, L, mat(COURT_BLUE, { roughness: 0.9 })));
  const lx = (len, x, z) => g.add(place(box(len, 0.012, t, lineM), { x, y, z }));
  const lz = (len, x, z) => g.add(place(box(t, 0.012, len, lineM), { x, y, z }));
  lx(W, 0, L / 2 - t / 2);
  lx(W, 0, -L / 2 + t / 2);
  lz(L, W / 2 - t / 2, 0);
  lz(L, -W / 2 + t / 2, 0);
  lz(L, 1.8, 0);
  lz(L, -1.8, 0);
  lx(3.6, 0, 2.35);
  lx(3.6, 0, -2.35);
  lz(4.7, 0, 0);
  lz(0.3, 0, L / 2 - 0.15);
  lz(0.3, 0, -L / 2 + 0.15);

  // net: posts outside the doubles lines, dark mesh, white headband
  const postM = metal(PALETTE.darkGrey);
  g.add(place(cylinder(0.06, 0.06, 1.1, postM, 6), { x: -2.65 }));
  g.add(place(cylinder(0.06, 0.06, 1.1, postM, 6), { x: 2.65 }));
  g.add(place(box(5.3, 0.82, 0.03, mat('#1e2422', { transparent: true, opacity: 0.7 })), { y: 0.18 }));
  g.add(place(box(5.3, 0.1, 0.06, mat(PALETTE.white)), { y: 0.98 }));
  return g;
}

// chain-link cage: posts, top + mid rails, see-through mesh, opaque windscreen on chosen sides
function cage({ w, d, h, windscreen = [], gate = null }) {
  const g = new THREE.Group();
  const postM = mat(FENCE_GREEN);
  const meshM = mat('#2f3d34', { transparent: true, opacity: 0.16, side: THREE.DoubleSide });
  const screenM = mat('#24452f');
  const sides = [
    ['front', w, 0, d / 2, 0],
    ['back', w, 0, -d / 2, 0],
    ['left', d, -w / 2, 0, 90],
    ['right', d, w / 2, 0, 90],
  ];
  for (const [name, len, x, z, ry] of sides) {
    const s = new THREE.Group();
    const n = Math.max(2, Math.round(len / 2.3)) + 1;
    for (let i = 0; i < n; i++) s.add(place(box(0.1, h, 0.1, postM), { x: -len / 2 + (len * i) / (n - 1) }));
    s.add(place(box(len, 0.07, 0.07, postM), { y: h - 0.07 }));
    s.add(place(box(len, 0.05, 0.05, postM), { y: h * 0.5 }));
    const segs = gate && gate.side === name
      ? [[-len / 2, gate.x - gate.w / 2], [gate.x + gate.w / 2, len / 2]]
      : [[-len / 2, len / 2]];
    for (const [a, b] of segs) {
      const sl = b - a, sx = (a + b) / 2;
      s.add(place(box(sl, h - 0.1, 0.02, meshM), { x: sx, y: 0.05 }));
      if (windscreen.includes(name)) s.add(place(box(sl, 1.3, 0.04, screenM), { x: sx, y: 0.05 }));
    }
    if (gate && gate.side === name) s.add(place(box(gate.w + 0.1, 0.08, 0.08, postM), { x: gate.x, y: 2.1 }));
    g.add(place(s, { x, z, ry }));
  }
  return g;
}

// floodlight mast; head faces +z
function floodlight(h = 6.5) {
  const m = metal(PALETTE.steelLight);
  return group(
    cylinder(0.07, 0.11, h, m, 6),
    place(box(1.0, 0.08, 0.08, m), { y: h - 0.2, z: 0.1 }),
    place(box(0.42, 0.32, 0.12, metal(PALETTE.steelDark)), { x: -0.3, y: h - 0.3, z: 0.18, rx: -25 }),
    place(box(0.42, 0.32, 0.12, metal(PALETTE.steelDark)), { x: 0.3, y: h - 0.3, z: 0.18, rx: -25 }),
    place(box(0.36, 0.26, 0.04, emissive(PALETTE.windowLit, 0.9)), { x: -0.3, y: h - 0.27, z: 0.25, rx: -25 }),
    place(box(0.36, 0.26, 0.04, emissive(PALETTE.windowLit, 0.9)), { x: 0.3, y: h - 0.27, z: 0.25, rx: -25 }),
  );
}

// tall umpire chair, faces +x
function umpireChair() {
  const m = mat(PALETTE.green);
  const g = group(
    place(box(0.07, 1.3, 0.07, m), { x: -0.22, z: -0.25 }),
    place(box(0.07, 1.3, 0.07, m), { x: -0.22, z: 0.25 }),
    place(box(0.07, 1.3, 0.07, m), { x: 0.22, z: -0.25 }),
    place(box(0.07, 1.3, 0.07, m), { x: 0.22, z: 0.25 }),
    place(box(0.6, 0.08, 0.6, m), { y: 1.3 }),
    place(box(0.08, 0.6, 0.6, m), { x: -0.27, y: 1.38 }),
  );
  for (let i = 1; i < 4; i++) g.add(place(box(0.08, 0.04, 0.5, m), { x: 0.24, y: i * 0.32 }));
  return g;
}

// player figure, faces +z
function player(shirt, shorts = PALETTE.white) {
  const skin = mat('#e0b48c');
  return group(
    place(box(0.13, 0.8, 0.16, skin), { x: -0.1 }),
    place(box(0.13, 0.8, 0.16, skin), { x: 0.1 }),
    place(box(0.38, 0.25, 0.24, mat(shorts)), { y: 0.72 }),
    place(box(0.42, 0.5, 0.26, mat(shirt)), { y: 0.95 }),
    place(sphere(0.14, skin, 8), { y: 1.45 }),
    place(box(0.1, 0.5, 0.1, skin), { x: 0.28, y: 0.95, rz: 40 }),
    place(box(0.08, 0.55, 0.08, mat(PALETTE.darkGrey)), { x: 0.6, y: 1.2, rz: 70 }),
    place(box(0.2, 0.06, 0.32, mat(PALETTE.red)), { x: 0.95, y: 1.4, rz: 70 }),
  );
}

// tiered aluminium bleacher, 3 rows rising towards -z (faces +z)
function bleacher(w = 3.2) {
  const g = new THREE.Group();
  const frame = metal(PALETTE.steel);
  const seat = mat(PALETTE.white);
  for (let i = 0; i < 3; i++) {
    g.add(place(box(w, 0.35 + i * 0.4, 0.6, frame), { z: 0.6 - i * 0.6 }));
    g.add(place(box(w, 0.08, 0.5, seat), { y: 0.35 + i * 0.4, z: 0.6 - i * 0.6 }));
  }
  g.add(place(box(w, 0.5, 0.06, frame), { y: 1.15, z: -0.65 }));
  return g;
}

function parasolTable(color) {
  return group(
    cylinder(0.4, 0.4, 0.06, mat(PALETTE.white), 10).translateY(0.72),
    cylinder(0.05, 0.05, 0.75, metal(PALETTE.steel), 6),
    place(cylinder(0.025, 0.025, 2.1, metal(PALETTE.steel), 6), { y: 0.75 }),
    place(cone(1.0, 0.5, mat(color), 8), { y: 2.1 }),
    place(box(0.35, 0.45, 0.35, mat(PALETTE.white)), { x: 0.65 }),
    place(box(0.35, 0.45, 0.35, mat(PALETTE.white)), { x: -0.65 }),
  );
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // --- courts: one fenced cage with two blue hard courts on a green surround
  const cx = 2.9, cw = 13.6, cd = 9.4;
  g.add(place(box(cw, 0.06, cd, mat(SURROUND, { roughness: 0.9 })), { x: cx, y: y0 }));
  const courts = [cx - 3.3, cx + 3.3];
  for (const x of courts) g.add(place(court(), { x, y: y0 + 0.06 }));
  g.add(place(cage({ w: cw, d: cd, h: 3.0, windscreen: ['back', 'right'], gate: { side: 'left', x: -0.3, w: 1.2 } }), { x: cx, y: y0 }));

  // floodlights at the corners and halfway along, aimed into the cage
  for (const z of [-cd / 2 + 0.15, cd / 2 - 0.15]) {
    for (const x of z < 0 ? [cx - cw / 2 + 0.2, cx, cx + cw / 2 - 0.2] : [cx - cw / 2 + 0.2, cx + cw / 2 - 0.2]) {
      g.add(place(floodlight(), { x, y: y0, z, ry: z < 0 ? 0 : 180 }));
    }
  }

  // umpire chairs at the outer ends of the nets, player benches in the gap between courts
  g.add(place(umpireChair(), { x: courts[0] - 2.95, y: y0 + 0.06, z: 0.2 }));
  g.add(place(umpireChair(), { x: courts[1] + 2.95, y: y0 + 0.06, z: -0.2, ry: 180 }));
  g.add(place(bench({ w: 1.4 }), { x: cx, y: y0 + 0.06, z: -1.4, ry: -90 }));
  g.add(place(bench({ w: 1.4 }), { x: cx, y: y0 + 0.06, z: 1.4, ry: 90 }));

  // players: singles on court 1, doubles on court 2
  const yp = y0 + 0.1;
  g.add(place(player(PALETTE.white), { x: courts[0] - 0.6, y: yp, z: -3.6 }));
  g.add(place(player(PALETTE.yellow, PALETTE.navy), { x: courts[0] + 0.8, y: yp, z: 3.4, ry: 180 }));
  g.add(place(player(PALETTE.red), { x: courts[1] - 1.1, y: yp, z: -3.7 }));
  g.add(place(player(PALETTE.red), { x: courts[1] + 1.0, y: yp, z: -1.5 }));
  g.add(place(player(PALETTE.blue), { x: courts[1] - 0.9, y: yp, z: 1.6, ry: 180 }));
  g.add(place(player(PALETTE.blue), { x: courts[1] + 1.2, y: yp, z: 3.8, ry: 180 }));
  // tennis balls
  const ballM = mat('#d8f03a');
  for (const [bx, bz] of [[courts[0] + 0.2, -1.2], [courts[1] - 2.0, 3.0], [courts[1] + 2.0, -4.2]]) {
    g.add(place(sphere(0.09, ballM, 6), { x: bx, y: y0 + 0.1, z: bz }));
  }

  // --- clubhouse: white single storey with a green gable roof and a striped veranda awning
  const hx = -7.2, hz = -2.45, hw = 5.0, hd = 4.3;
  const wall = PALETTE.white;
  g.add(place(box(hw + 0.3, 0.25, hd + 0.3, mat(PALETTE.concreteDark)), { x: hx, y: y0, z: hz }));
  g.add(place(facadeBlock({
    w: hw, d: hd, floors: 1, style: 'punched', wall, frame: PALETTE.woodDark, glass: PALETTE.window,
    windowW: 0.55, windowH: 0.55, bay: 1.7, lit: 0.2, seed: 80,
  }), { x: hx, y: y0 + 0.25, z: hz }));
  g.add(place(gableRoof({
    w: hw, d: hd, h: 1.8, overhang: 0.35, ridge: 'x',
    material: surface('roofTiles', PALETTE.roofGreen, { size: 2 }), gableMaterial: wall,
  }), { x: hx, y: y0 + 0.25 + FLOOR, z: hz }));
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.green }), { x: hx + 0.85, y: y0 + 0.25, z: hz + hd / 2 }));
  g.add(place(clubSign('TENNIS CLUB', 3.8, 0.8, PALETTE.green, '#ffffff'), { x: hx, y: y0 + 0.25 + FLOOR + 0.35, z: hz + hd / 2 + 0.35, rx: -35 }));

  // veranda: timber deck, striped awning, posts
  const vz = hz + hd / 2;
  g.add(place(box(hw, 0.2, 1.6, surface('planks', PALETTE.woodLight, { size: 1.5 })), { x: hx, y: y0, z: vz + 0.8 }));
  g.add(place(awning({ w: hw, depth: 1.6, drop: 0.35, color: PALETTE.green, color2: PALETTE.white }), { x: hx, y: y0 + 2.75, z: vz }));
  for (const px of [-hw / 2 + 0.15, hw / 2 - 0.15]) g.add(place(box(0.12, 2.1, 0.12, mat(PALETTE.white)), { x: hx + px, y: y0 + 0.2, z: vz + 1.5 }));

  // spectator stand facing the courts along the cage
  g.add(place(patch(2.4, 4.0, 'paved'), { x: -5.1, y: y0, z: 2.6 }));
  g.add(place(bleacher(3.6), { x: -4.9, y: y0 + 0.05, z: 2.6, ry: 90 }));

  // terrace with parasol tables, path to the street, flagpole and planting
  g.add(place(patch(3.4, 3.2, 'paved'), { x: -8.2, y: y0, z: 1.5 }));
  g.add(place(patch(1.3, 1.7, 'paved'), { x: -6.25, y: y0, z: 4.15 }));
  g.add(place(parasolTable(PALETTE.white), { x: -8.9, y: y0 + 0.05, z: 1.1 }));
  g.add(place(parasolTable(PALETTE.green), { x: -7.4, y: y0 + 0.05, z: 2.4 }));
  g.add(place(flag({ h: 6, color: PALETTE.green, color2: PALETTE.yellow }), { x: -9.65, y: y0, z: 0.1 }));
  g.add(place(hedge({ w: 3.0, h: 0.9, d: 0.6 }), { x: -8.3, y: y0, z: 4.55 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 81 }), { x: -9.0, y: y0, z: 3.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 82 }), { x: -4.4, y: y0, z: -4.5 }));

  return g;
}

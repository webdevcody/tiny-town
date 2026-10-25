import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, pipe, pipeRun, taperedBlock,
  container, fence, tree, hedge, mat, metal, emissive, surface, textured,
  canvasTexture, signTexture, shade,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Two digester tanks with green double-membrane gas domes at the back, a
// silage clamp + solids feeder at the front left, a CHP engine container and
// a burning gas flare on the right.

const MEMBRANE = '#4f9a3c';

// Membrane fabric: green with welded seams running from the crown to the rim.
function membraneMat(color) {
  const tex = canvasTexture(256, 64, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(color, -0.18);
    const seams = 16;
    for (let i = 0; i < seams; i++) ctx.fillRect((i * W) / seams, 0, 2, H);
    ctx.fillStyle = shade(color, 0.12);
    ctx.fillRect(0, 0, W, H * 0.12); // sunlit crown
  }, { key: `biogas-plant:membrane:${color}` });
  return textured(tex, { flatShading: false, roughness: 0.55 });
}

// Bulging membrane dome: a sphere cap that swells slightly past the tank rim.
function membraneDome(r, h, material) {
  const R = r * 1.04;
  const thetaMax = Math.PI - Math.asin(r / R);
  const geo = new THREE.SphereGeometry(R, 32, 12, 0, Math.PI * 2, 0, thetaMax);
  geo.translate(0, -R * Math.cos(thetaMax), 0);
  geo.scale(1, h / (R * (1 - Math.cos(thetaMax))), 1);
  return new THREE.Mesh(geo, material);
}

// Round concrete digester tank with a membrane roof, clamping ring,
// inspection ladder, sight glass and a crown vent.
function digester({ r, wallH, domeH, color, wall }) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelDark);
  g.add(cylinder(r, r, wallH, wall, 32));
  g.add(place(cylinder(r + 0.06, r + 0.06, 0.18, mat(PALETTE.concreteDark), 32), { y: wallH * 0.45 }));
  g.add(place(cylinder(r + 0.1, r + 0.1, 0.16, mat(PALETTE.darkGrey), 32), { y: wallH - 0.05 }));
  g.add(place(membraneDome(r, domeH, membraneMat(color)), { y: wallH + 0.08 }));
  // crown: overpressure valve + stub
  g.add(place(cylinder(0.32, 0.36, 0.25, metal(PALETTE.steelLight), 10), { y: wallH + 0.08 + domeH - 0.05 }));
  g.add(place(cylinder(0.1, 0.1, 0.35, steel, 8), { y: wallH + 0.08 + domeH + 0.18 }));
  // sight glass and access hatch on the front
  g.add(place(cylinder(0.22, 0.22, 0.12, mat(PALETTE.glassDark, { roughness: 0.2 }), 10), { y: wallH * 0.7, z: r + 0.02, rx: 90 }));
  g.add(place(box(0.7, 0.7, 0.12, mat(PALETTE.steel)), { x: -0.9, y: 0.15, z: r - 0.17 + 0.05, ry: -21 }));
  return g;
}

// Caged steel ladder up a tank wall, placed on the outside at angle `a`.
function ladder(h) {
  const m = metal(PALETTE.yellow, { roughness: 0.5 });
  const g = new THREE.Group();
  for (const x of [-0.24, 0.24]) g.add(place(box(0.09, h + 0.9, 0.09, m), { x }));
  for (let y = 0.3; y < h; y += 0.35) g.add(place(box(0.48, 0.06, 0.06, m), { y }));
  for (const y of [h + 0.4, h + 0.85]) g.add(place(box(0.6, 0.07, 0.07, m), { y, z: 0.3 }));
  for (const x of [-0.3, 0.3]) g.add(place(box(0.07, 0.07, 0.35, m), { x, y: h + 0.85, z: 0.15 }));
  return g;
}

// Sign with 0..1 UVs on its face (lib sign() shrinks text on faces > 1 m).
function bigSign(text, w, h, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, 0.12).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Small yellow wheel loader, bucket pointing to -x.
function wheelLoader() {
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(place(box(2.0, 0.8, 1.3, body), { x: 0.3, y: 0.45 }));
  g.add(place(box(0.9, 0.5, 1.2, body), { x: 0.85, y: 1.25 }));
  g.add(place(box(1.0, 1.0, 1.1, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: -0.05, y: 1.25 }));
  g.add(place(box(1.15, 0.1, 1.25, body), { x: -0.05, y: 2.25 }));
  g.add(place(box(0.08, 0.5, 0.08, dark), { x: 1.05, y: 1.75, z: 0.35 }));
  // lift arms + bucket
  for (const z of [-0.5, 0.5]) g.add(pipe([-0.4, 1.0, z], [-1.35, 0.55, z], 0.08, body));
  g.add(place(box(0.45, 0.6, 1.6, dark), { x: -1.55, y: 0.15 }));
  g.add(place(box(0.12, 0.6, 1.6, dark), { x: -1.75, y: 0.15, rz: -25 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [-0.45, 0.95]) for (const z of [-0.7, 0.7]) {
    const w = new THREE.CylinderGeometry(0.45, 0.45, 0.35, 12);
    w.rotateX(Math.PI / 2);
    const m = new THREE.Mesh(w, wheelM);
    m.position.set(x, 0.45, z);
    g.add(m);
  }
  return g;
}

// Gas flare: steel stack with wind shield and a burning flame on a concrete pad.
function gasFlare(h) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelLight, { roughness: 0.45 });
  g.add(box(1.6, 0.25, 1.6, mat(PALETTE.concrete)));
  g.add(place(box(0.7, 0.6, 0.7, metal(PALETTE.steel)), { y: 0.25 }));
  g.add(place(cylinder(0.16, 0.2, h, steel, 10), { y: 0.25 }));
  for (const y of [h * 0.55, h * 0.75]) g.add(place(cylinder(0.21, 0.21, 0.25, mat(PALETTE.red), 10), { y }));
  // tripod stays
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    g.add(pipe([Math.cos(a) * 0.72, 0.25, Math.sin(a) * 0.72], [0, h * 0.6, 0], 0.04, metal(PALETTE.steelDark)));
  }
  // wind shield + flame
  g.add(place(cylinder(0.38, 0.3, 0.7, steel, 12), { y: h + 0.25 }));
  g.add(place(cylinder(0.34, 0.34, 0.06, mat(PALETTE.black), 12), { y: h + 0.94 }));
  const fire = emissive('#f05a0a', 0.55);
  g.add(place(cone(0.36, 1.1, fire, 8), { y: h + 0.95 }));
  g.add(place(cone(0.2, 1.3, fire, 6), { x: 0.12, y: h + 1.2, z: 0.05, rz: -14 }));
  g.add(place(cone(0.16, 0.9, fire, 6), { x: -0.14, y: h + 1.1, z: -0.06, rz: 18, rx: -10 }));
  g.add(place(cone(0.26, 0.9, emissive(PALETTE.orange, 0.9), 8), { y: h + 0.95 }));
  g.add(place(cone(0.16, 0.6, emissive(PALETTE.yellow, 1.6), 8), { y: h + 0.95 }));
  return g;
}

// Silage clamp: three concrete walls, open to +x, with a sheeted silage heap
// held down by old tyres and the cut face showing at the open end.
function silageClamp(w, d) {
  const g = new THREE.Group();
  const wallM = surface('concrete', PALETTE.concrete, { size: 3 });
  const t = 0.25, wh = 1.3;
  g.add(box(w, 0.1, d, mat(PALETTE.concreteDark)));
  g.add(place(box(t, wh, d, wallM), { x: -w / 2 + t / 2 }));
  g.add(place(box(w, wh, t, wallM), { z: -d / 2 + t / 2 }));
  g.add(place(box(w, wh, t, wallM), { z: d / 2 - t / 2 }));
  // silage heap: green-brown fodder, black sheet over all but the cut face
  const iw = w - t - 0.05, id = d - 2 * t - 0.05;
  const silage = mat('#9c9a44');
  const sheet = mat('#26282b', { roughness: 0.35 });
  g.add(place(taperedBlock({ w: iw, d: id, h: 1.55, topW: iw - 0.4, topD: id - 1.0, material: silage }), { x: t / 2, y: 0.1 }));
  const sw = iw - 0.6;
  g.add(place(taperedBlock({ w: sw, d: id + 0.04, h: 1.6, topW: sw - 0.4, topD: id - 0.96, material: sheet }), { x: t / 2 - 0.3, y: 0.1 }));
  // tyres on the sheet
  const tyre = mat('#141416');
  const topY = 0.1 + 1.6;
  const tw = sw - 0.4, td = id - 0.96;
  for (let ix = 0; ix < 4; ix++) for (let iz = 0; iz < 4; iz++) {
    const x = t / 2 - 0.3 - tw / 2 + 0.25 + ix * ((tw - 0.5) / 3);
    const z = -td / 2 + 0.25 + iz * ((td - 0.5) / 3) + (ix % 2 ? 0.15 : -0.05);
    g.add(place(cylinder(0.2, 0.2, 0.07, tyre, 10), { x, y: topY, z }));
    g.add(place(cylinder(0.09, 0.09, 0.075, sheet, 8), { x, y: topY + 0.005, z }));
  }
  // loose fodder spilled in front of the face
  g.add(place(taperedBlock({ w: 0.7, d: id * 0.7, h: 0.3, topW: 0.2, topD: id * 0.5, material: silage }), { x: w / 2 + 0.25, y: 0.1 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  // ground: concrete yard at the front, gravel apron round the tanks
  g.add(place(patch(9.6, 5.6, 'concrete'), { y: y0, z: 2.0 }));
  g.add(place(patch(9.6, 4.6, 'gravel'), { y: y0, z: -2.5 }));

  const concreteWall = surface('concrete', PALETTE.concrete, { size: 3 });

  // main digester (back left) and post-digester (back right)
  const d1 = { x: -1.95, z: -2.35, r: 2.5, wallH: 2.1 };
  const d2 = { x: 2.85, z: -3.0, r: 1.85, wallH: 1.8 };
  g.add(place(digester({ r: d1.r, wallH: d1.wallH, domeH: 2.3, color: MEMBRANE, wall: concreteWall }), { x: d1.x, y: y0, z: d1.z }));
  g.add(place(digester({ r: d2.r, wallH: d2.wallH, domeH: 1.75, color: '#5fa848', wall: surface('corrugated', PALETTE.plasterGreen, { size: 1 }) }), { x: d2.x, y: y0, z: d2.z, ry: 25 }));
  // ladders on the street-facing walls
  g.add(place(ladder(d1.wallH), { x: d1.x + Math.sin(-0.7) * (d1.r + 0.04), y: y0, z: d1.z + Math.cos(-0.7) * (d1.r + 0.04), ry: -0.7 * 180 / Math.PI }));
  g.add(place(ladder(d2.wallH), { x: d2.x + Math.sin(0.5) * (d2.r + 0.04), y: y0, z: d2.z + Math.cos(0.5) * (d2.r + 0.04), ry: 0.5 * 180 / Math.PI }));

  // silage clamp (front left), open towards the yard
  g.add(place(silageClamp(3.4, 3.7), { x: -3.1, y: y0, z: 2.9 }));

  // solids feeder hopper with an auger into the main digester
  const feederM = mat(PALETTE.green, { roughness: 0.6 });
  const fx = -0.35, fz = 1.55;
  g.add(place(box(1.5, 0.9, 1.1, feederM), { x: fx, y: y0, z: fz }));
  g.add(place(taperedBlock({ w: 1.5, d: 1.1, h: 0.6, topW: 1.8, topD: 1.4, material: feederM, topMaterial: mat('#9c9a44') }), { x: fx, y: y0 + 0.9, z: fz }));
  g.add(place(box(0.4, 0.4, 0.3, mat(PALETTE.lightGrey)), { x: fx + 0.5, y: y0 + 0.2, z: fz + 0.6 }));
  g.add(pipe([fx - 0.3, y0 + 0.5, fz - 0.5], [d1.x + 0.95, y0 + 1.75, d1.z + 2.33], 0.17, metal(PALETTE.steel)));

  // CHP engine container (gas engine + generator) with exhaust and radiators
  const cx = 2.75, cz = 0.45;
  g.add(place(container({ color: PALETTE.green, length: 6.1 }), { x: cx, y: y0, z: cz, s: 0.7 }));
  g.add(place(bigSign('CHP', 1.0, 0.45, PALETTE.white, PALETTE.green), { x: cx - 0.6, y: y0 + 0.9, z: cz + 0.87 }));
  g.add(place(box(0.5, 1.2, 0.08, mat(PALETTE.steelLight)), { x: cx + 0.9, y: y0, z: cz + 0.87 }));
  g.add(place(box(1.6, 0.35, 1.4, metal(PALETTE.steelLight)), { x: cx + 1.0, y: y0 + 1.82, z: cz }));
  for (const dx of [0.55, 1.45]) g.add(place(cylinder(0.4, 0.4, 0.05, mat(PALETTE.darkGrey), 12), { x: cx + dx, y: y0 + 2.17, z: cz }));
  g.add(place(cylinder(0.14, 0.14, 2.4, metal(PALETTE.steel), 8), { x: cx - 1.5, y: y0 + 1.82, z: cz - 0.4 }));
  g.add(place(cylinder(0.25, 0.25, 0.8, metal(PALETTE.steelLight), 10), { x: cx - 1.5, y: y0 + 1.82, z: cz - 0.4 }));

  // yellow gas main: both domes -> CHP, branch to the flare
  const gasM = mat(PALETTE.yellow, { roughness: 0.5 });
  const pyH = y0 + 0.9;
  g.add(pipeRun([
    [d1.x + 2.2, y0 + d1.wallH + 0.15, d1.z + 1.15],
    [0.55, pyH + 1.2, -0.6],
    [0.55, pyH, -0.6],
    [cx - 2.2, pyH, cz - 0.4],
  ], 0.1, gasM));
  g.add(pipeRun([
    [d2.x - 1.3, y0 + d2.wallH + 0.15, d2.z + 1.25],
    [1.1, pyH + 0.9, -0.6],
    [0.55, pyH + 0.9, -0.6],
  ], 0.1, gasM));
  g.add(pipeRun([
    [cx + 2.2, pyH, cz - 0.4],
    [4.65, pyH, cz - 0.4],
    [4.65, pyH, 2.9],
    [4.2, y0 + 0.6, 3.35],
  ], 0.1, gasM));
  for (const [x, z] of [[0.55, -0.6], [4.65, 1.6]]) g.add(place(box(0.12, pyH - y0, 0.12, metal(PALETTE.steelDark)), { x, y: y0, z }));

  // gas flare (front right) inside a small wire fence
  g.add(place(gasFlare(5.2), { x: 3.75, y: y0, z: 3.55 }));
  g.add(place(fence({ w: 2.2, d: 2.2, h: 0.9, style: 'wire', color: PALETTE.steel }), { x: 3.75, y: y0, z: 3.55 }));

  // wheel loader at work between clamp and feeder
  g.add(place(wheelLoader(), { x: 0.85, y: y0 + 0.05, z: 3.5, ry: -12 }));

  // name board on the clamp's street wall
  g.add(place(bigSign('BIOGAS', 2.6, 0.8, PALETTE.green, '#ffffff'), { x: -3.15, y: y0 + 0.3, z: 4.81 }));

  // a little green round the edges
  g.add(place(hedge({ w: 0.6, h: 1.0, d: 3.6 }), { x: 4.65, y: y0, z: -3.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 4 }), { x: -4.5, y: y0, z: -4.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 7 }), { x: 4.5, y: y0, z: -0.75 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: 1.6, y: y0, z: 4.55 }));
  return g;
}

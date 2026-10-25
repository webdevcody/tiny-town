import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, place, group, mat, emissive, metal, surface,
  extrudeGeometry, door, sign, fence, car, tree, shade,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Three identical turbines all yawed into the same wind; a gravel service
// track runs in from the street gate and branches to each crane pad.

const HUB_H = 10.2;        // tower height above the lot
const BLADE_L = 2.9;       // blade length (root to tip)
const ROOT_R = 0.16;       // blade root distance from hub centre
const YAW = 25;            // rotor faces +z turned 25° towards +x (wind from the south-east)
const HUB_Z = 1.3;         // rotor plane in front of the tower axis

const white = mat(PALETTE.white, { roughness: 0.55 });
const bladeWhite = mat(PALETTE.white, { roughness: 0.5, side: THREE.DoubleSide });
const bladeRed = mat(PALETTE.red, { roughness: 0.5, side: THREE.DoubleSide });

// Blade outline: chord as a function of span z (0 = root, BLADE_L = tip).
function leading(z) {
  const t = z / BLADE_L;
  return t < 0.22 ? 0.1 + (0.16 - 0.1) * (t / 0.22) : 0.16 - (0.16 - 0.04) * ((t - 0.22) / 0.78);
}
function trailing(z) {
  const t = z / BLADE_L;
  return t < 0.22 ? -0.1 - (0.3 - 0.1) * (t / 0.22) : -0.3 + (0.3 - 0.035) * ((t - 0.22) / 0.78);
}

// Flat blade section between span z0..z1, lying in the XY plane (span along +Y).
function bladeSection(z0, z1, thickness, material) {
  const zs = [z0, BLADE_L * 0.22, z1].filter((z, i, a) => z >= z0 && z <= z1 && a.indexOf(z) === i).sort((a, b) => a - b);
  const pts = [[trailing(z1), z1], [leading(z1), z1]];
  for (let i = zs.length - 2; i >= 1; i--) pts.push([leading(zs[i]), zs[i]]);
  pts.push([leading(z0), z0], [trailing(z0), z0]);
  for (let i = 1; i <= zs.length - 2; i++) pts.push([trailing(zs[i]), zs[i]]);
  const geo = extrudeGeometry(pts, thickness);
  geo.rotateX(-Math.PI / 2);           // span -> +Y, thickness -> -Z
  geo.translate(0, 0, thickness / 2);
  return new THREE.Mesh(geo, [material, material, material]);
}

function blade() {
  const red0 = BLADE_L * 0.8, red1 = BLADE_L * 0.88, red2 = BLADE_L * 0.95;
  const b = group(
    bladeSection(0, red0, 0.09, bladeWhite),
    bladeSection(red0, red1, 0.06, bladeRed),
    bladeSection(red1, red2, 0.05, bladeWhite),
    bladeSection(red2, BLADE_L, 0.045, bladeRed),
  );
  b.position.y = ROOT_R;
  b.rotation.y = THREE.MathUtils.degToRad(14); // pitch
  return b;
}

function rotor(phase) {
  const g = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const arm = new THREE.Group();
    arm.add(blade());
    arm.rotation.z = THREE.MathUtils.degToRad(phase + i * 120);
    g.add(arm);
  }
  // spinner (nose cone) pointing +z, and the hub collar behind it
  g.add(place(cylinder(0.27, 0.27, 0.22, white, 14), { z: -0.12, rx: 90 }));
  g.add(place(cone(0.27, 0.5, white, 14), { z: 0.1, rx: 90 }));
  return g;
}

function turbine({ phase }) {
  const g = new THREE.Group();
  const green = mat(PALETTE.green);
  const greenLight = mat(PALETTE.plasterGreen);
  // foundation plinth + tower with green base bands
  g.add(cylinder(0.85, 0.95, 0.22, mat(PALETTE.concrete), 10));
  g.add(place(cylinder(0.21, 0.38, HUB_H, white, 16), { y: 0.2 }));
  g.add(place(cylinder(0.385, 0.395, 0.45, green, 16), { y: 0.2 }));
  g.add(place(cylinder(0.375, 0.385, 0.35, greenLight, 16), { y: 0.65 }));
  // tower door with small steel steps, facing the track
  g.add(place(door({ w: 0.34, h: 0.7, color: PALETTE.steelDark, frame: PALETTE.steel }), { y: 0.42, z: 0.36 }));
  g.add(place(box(0.45, 0.2, 0.3, metal(PALETTE.steel)), { y: 0.22, z: 0.52 }));

  // nacelle head, yawed into the wind
  const head = new THREE.Group();
  head.position.y = HUB_H + 0.12;
  head.rotation.y = THREE.MathUtils.degToRad(YAW);
  head.add(place(cylinder(0.24, 0.24, 0.16, white, 12), { y: -0.08 }));        // yaw bearing
  head.add(place(box(0.66, 0.62, 1.7, white), { z: 0.3 }));                    // nacelle body
  head.add(place(box(0.56, 0.5, 0.35, white), { y: 0.06, z: -0.72 }));          // tapered tail
  head.add(place(box(0.5, 0.1, 0.9, mat(PALETTE.lightGrey)), { y: 0.62, z: 0.0 })); // cooler on top
  head.add(place(box(0.68, 0.08, 1.72, mat(PALETTE.steelLight)), { y: 0.18, z: 0.3 })); // seam line
  head.add(place(box(0.12, 0.12, 0.12, emissive('#ff2a1a', 1.2)), { x: 0.18, y: 0.72, z: -0.35 })); // aviation light
  head.add(place(cylinder(0.02, 0.02, 0.45, metal(PALETTE.steelDark), 4), { x: -0.2, y: 0.62, z: -0.35 })); // anemometer mast
  head.add(place(box(0.22, 0.03, 0.03, metal(PALETTE.steelDark)), { x: -0.2, y: 1.06, z: -0.35 }));
  const r = rotor(phase);
  r.position.set(0, 0.31, HUB_Z);
  head.add(r);
  g.add(head);
  return g;
}

// Little sheep grazing between the towers, length along X.
function sheep() {
  const wool = mat(PALETTE.offWhite, { roughness: 0.95 });
  const face = mat(PALETTE.black);
  const g = group(
    place(box(0.62, 0.36, 0.38, wool), { y: 0.22 }),
    place(box(0.2, 0.22, 0.2, face), { x: 0.38, y: 0.4 }),
  );
  for (const [x, z] of [[-0.22, -0.12], [-0.22, 0.12], [0.22, -0.12], [0.22, 0.12]]) {
    g.add(place(box(0.07, 0.24, 0.07, face), { x, z }));
  }
  return g;
}

// Small fenced substation: control kiosk + transformer on a concrete pad.
function substation() {
  const g = new THREE.Group();
  g.add(patch(2.7, 2.3, 'concrete', 0.08));
  const y = 0.08;
  const kiosk = mat(PALETTE.roofGreen);
  g.add(place(box(1.5, 1.35, 1.0, kiosk), { x: -0.45, y, z: -0.45 }));
  g.add(place(box(1.65, 0.1, 1.15, mat(shade(PALETTE.roofGreen, -0.25))), { x: -0.45, y: y + 1.35, z: -0.45 }));
  g.add(place(door({ w: 0.5, h: 1.0, color: shade(PALETTE.roofGreen, -0.15), frame: PALETTE.steelDark }), { x: -0.7, y, z: 0.05 }));
  g.add(place(box(0.3, 0.3, 0.02, mat(PALETTE.yellow)), { x: -0.15, y: y + 0.75, z: 0.06 })); // warning plate
  // transformer with cooling fins and bushings
  const tm = mat(PALETTE.steel);
  g.add(place(box(0.8, 0.8, 0.6, tm), { x: 0.75, y, z: -0.45 }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.05, 0.6, 0.3, mat(PALETTE.steelDark)), { x: 0.38 + i * 0.24, y: y + 0.08, z: -0.05 }));
  for (const x of [0.55, 0.75, 0.95]) g.add(place(cylinder(0.04, 0.06, 0.32, mat(PALETTE.darkGrey), 6), { x, y: y + 0.8, z: -0.5 }));
  g.add(place(fence({ w: 2.6, d: 2.2, h: 1.1, style: 'wire', sides: ['front', 'back', 'left', 'right'], gap: 0 }), { y }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  const towers = [
    { x: -3.0, z: -3.2, phase: 8 },
    { x: 1.9, z: -1.3, phase: 47 },
    { x: -1.7, z: 2.0, phase: 81 },
  ];
  const spineX = -0.15;

  // service track: spine from the street gate, branches to each crane pad
  const trackY = y0;
  g.add(place(patch(1.3, 8.7, 'gravel'), { x: spineX, y: trackY, z: 0.65 }));
  for (const t of towers) {
    const dir = Math.sign(t.x - spineX);
    const x0 = spineX + dir * 0.65, x1 = t.x;
    g.add(place(patch(Math.abs(x1 - x0), 1.1, 'gravel'), { x: (x0 + x1) / 2, y: trackY, z: t.z + 1.0 }));
    g.add(place(patch(2.2, 2.0, 'gravel'), { x: t.x + dir * 0.2, y: trackY + 0.005, z: t.z + 0.5 }));
  }

  // turbines; tower doors face their branch of the track
  for (const t of towers) g.add(place(turbine(t), { x: t.x, y: y0, z: t.z }));

  // dry-stone field wall along the street with a gate opening for the track
  const wall = mat(PALETTE.stone);
  g.add(place(box(3.9, 0.5, 0.3, wall), { x: -4.95 + 1.95, y: y0, z: 4.75 }));
  g.add(place(box(4.25, 0.5, 0.3, wall), { x: 4.95 - 2.12, y: y0, z: 4.75 }));
  g.add(place(box(0.3, 0.5, 6.0, wall), { x: -4.8, y: y0, z: 1.6 }));
  // gate: posts + red/white barrier arm
  const postM = mat(PALETTE.darkGrey);
  g.add(place(box(0.18, 1.0, 0.18, postM), { x: spineX - 0.85, y: y0, z: 4.75 }));
  g.add(place(box(0.18, 1.0, 0.18, postM), { x: spineX + 0.85, y: y0, z: 4.75 }));
  g.add(place(box(1.6, 0.08, 0.08, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.6 })), { x: spineX, y: y0 + 0.85, z: 4.75 }));
  // site sign
  g.add(place(box(0.08, 1.3, 0.08, postM), { x: spineX - 2.85, y: y0, z: 4.35 }));
  g.add(place(box(0.08, 1.3, 0.08, postM), { x: spineX - 1.55, y: y0, z: 4.35 }));
  g.add(place(sign({ text: 'WIND FARM', w: 1.5, h: 0.5, bg: PALETTE.green, fg: '#ffffff', depth: 0.06 }), { x: spineX - 2.2, y: y0 + 0.85, z: 4.4 }));

  // substation in the front-right corner
  g.add(place(substation(), { x: 3.4, y: y0, z: 3.3 }));

  // maintenance van parked on the track
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: spineX, y: y0 + 0.05, z: 2.9, ry: 90, s: 0.55 }));
  g.add(place(box(0.5, 0.06, 0.2, emissive(PALETTE.orange, 0.8)), { x: spineX, y: y0 + 0.05 + 1.6 * 0.55, z: 2.9 + 0.3 }));

  // sheep grazing
  for (const [x, z, ry] of [[-4.1, -0.6, 30], [-3.4, -0.1, 160], [3.9, -4.3, -20], [4.2, 0.9, 200], [-4.1, 4.0, 80]]) {
    g.add(place(sheep(), { x, y: y0, z, ry }));
  }

  // a few hedgerow bushes and trees at the edges
  g.add(place(tree({ kind: 'round', h: 3.2, seed: 12 }), { x: 4.2, y: y0, z: -2.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: 4.4, y: y0, z: -0.9 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 14 }), { x: -4.3, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 15 }), { x: 0.9, y: y0, z: -4.4 }));
  g.add(place(tree({ kind: 'cone', h: 2.8, seed: 16 }), { x: -4.2, y: y0, z: 2.9 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, rooftopUnits, box, cylinder, sphere, place, group,
  beam, pipe, pipeRun, sphereTank, tank, lattice, fence, tree, car, streetLamp,
  mat, metal, emissive, surface, door, signTexture, textured,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Back: white process towers + orange steel process frame (left), gas spheres (right).
// Middle: colourful pipe rack. Front: lab/control block (left), tanker loading bay (right).

const WHITE = mat(PALETTE.white, { roughness: 0.45, flatShading: false });
const STEEL = metal(PALETTE.steelDark, { roughness: 0.5 });
const RAIL = mat(PALETTE.yellow);
const FRAME = mat(PALETTE.orange, { roughness: 0.6 });
const GRATING = mat(PALETTE.steel, { roughness: 0.7 });
const PIPE_COLOURS = [PALETTE.red, PALETTE.yellow, PALETTE.green, PALETTE.blue, PALETTE.white];

function ring(radius, tube, material, y) {
  const m = new THREE.Mesh(new THREE.TorusGeometry(radius, tube, 4, 20), material);
  m.rotation.x = Math.PI / 2;
  m.position.y = y;
  return m;
}

// Vertical ladder: two stiles + rungs, flat against a surface, facing +x of its own frame.
function ladder(h, w = 0.5) {
  const g = new THREE.Group();
  for (const z of [-w / 2, w / 2]) g.add(place(box(0.06, h, 0.06, STEEL), { z }));
  for (let y = 0.4; y < h; y += 0.9) g.add(place(box(0.05, 0.05, w, STEEL), { y }));
  return g;
}

// White distillation / process column with ringed platforms, a caged ladder and a top vent.
function processTower({ r, h, platforms, ladderAngle = 45 }) {
  const g = new THREE.Group();
  g.add(cylinder(r + 0.35, r + 0.45, 0.6, mat(PALETTE.concrete), 16));
  g.add(place(cylinder(r, r, h, WHITE, 18), { y: 0.6 }));
  g.add(place(sphere(r, WHITE, 18), { y: 0.6 + h - r }));
  // grey seam bands
  for (let y = 4; y < h - 1; y += 4) g.add(place(cylinder(r + 0.04, r + 0.04, 0.18, mat(PALETTE.lightGrey), 18), { y: 0.6 + y }));
  for (const py of platforms) {
    const y = 0.6 + py;
    g.add(place(cylinder(r + 0.9, r + 0.9, 0.15, GRATING, 18), { y }));
    g.add(ring(r + 0.9, 0.05, RAIL, y + 1.0));
    g.add(ring(r + 0.9, 0.04, RAIL, y + 0.5));
  }
  const a = (ladderAngle * Math.PI) / 180;
  const lad = place(ladder(h - 0.2), { x: Math.cos(a) * (r + 0.3), y: 0.6, z: Math.sin(a) * (r + 0.3), ry: -ladderAngle });
  g.add(lad);
  // vent + small top platform
  g.add(place(cylinder(0.12, 0.12, 2.2, STEEL, 8), { y: 0.6 + h - 0.3 }));
  g.add(place(cylinder(0.22, 0.22, 0.2, mat(PALETTE.red), 8), { y: 0.6 + h + 1.9 }));
  return g;
}

// Open steel structure: corner columns, beams at every level, gratings, back bracing.
function processFrame({ w, d, levels, levelH }) {
  const g = new THREE.Group();
  const h = levels * levelH;
  const xs = [-w / 2, 0, w / 2], zs = [-d / 2, d / 2];
  for (const x of xs) for (const z of zs) g.add(place(box(0.3, h, 0.3, FRAME), { x, z }));
  for (let i = 1; i <= levels; i++) {
    const y = i * levelH;
    for (const z of zs) g.add(place(box(w + 0.3, 0.3, 0.3, FRAME), { y: y - 0.3, z }));
    for (const x of xs) g.add(place(box(0.3, 0.3, d, FRAME), { x, y: y - 0.3 }));
    g.add(place(box(w, 0.1, d, GRATING), { y: y - 0.05 }));
    // handrail round the deck
    for (const z of zs) g.add(place(box(w, 0.06, 0.06, RAIL), { y: y + 0.95, z }));
    for (const x of [-w / 2, w / 2]) g.add(place(box(0.06, 0.06, d, RAIL), { x, y: y + 0.95 }));
    for (const x of xs) for (const z of zs) g.add(place(box(0.06, 1, 0.06, RAIL), { x, y, z }));
    // X bracing on the back and left faces
    const y0 = (i - 1) * levelH;
    for (const [x0, x1] of [[-w / 2, 0], [0, w / 2]]) {
      g.add(beam([x0, y0, -d / 2], [x1, y, -d / 2], 0.14, FRAME));
      g.add(beam([x1, y0, -d / 2], [x0, y, -d / 2], 0.14, FRAME));
    }
    g.add(beam([-w / 2, y0, -d / 2], [-w / 2, y, d / 2], 0.14, FRAME));
  }
  return g;
}

// Horizontal cylindrical vessel along X on two concrete saddles.
function hVessel(r, len, material, lift = 0.5) {
  const g = new THREE.Group();
  for (const x of [-len * 0.3, len * 0.3]) g.add(place(box(0.5, lift + r * 0.5, r * 1.6, mat(PALETTE.concreteDark)), { x }));
  const body = cylinder(r, r, len, material, 16);
  body.rotation.z = Math.PI / 2;
  body.position.set(len / 2, lift + r, 0);
  g.add(body);
  for (const x of [-len / 2, len / 2]) g.add(place(sphere(r, material, 16), { x, y: lift, s: [0.45, 1, 1] }));
  return g;
}

// Tanker lorry, length along X, cab at +x.
function tankerTruck() {
  const g = new THREE.Group();
  const wheelM = mat(PALETTE.black);
  g.add(place(box(10, 0.35, 2.2, STEEL), { x: -0.6, y: 0.6 }));
  g.add(place(box(2.3, 2.5, 2.4, mat(PALETTE.blue, { roughness: 0.5 })), { x: 3.4, y: 0.7 }));
  g.add(place(box(0.06, 1, 2.1, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.56, y: 2.0 }));
  const tankM = metal(PALETTE.chrome, { roughness: 0.3 });
  g.add(place(hVessel(1.15, 6.2, tankM, 0), { x: -1.7, y: 0.75 }));
  // hazard diamond on the tank end and side
  g.add(place(box(0.7, 0.7, 0.04, mat(PALETTE.orange)), { x: -1.7, y: 1.95, z: 1.17, rz: 45 }));
  g.add(place(box(0.7, 0.7, 0.04, mat(PALETTE.orange)), { x: -1.7, y: 1.95, z: -1.17, rz: 45 }));
  // top walkway
  g.add(place(box(5, 0.08, 0.6, GRATING), { x: -1.7, y: 3.05 }));
  for (const x of [3.4, -0.5, -3.6, -4.8]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.5, sz * 1.05);
    g.add(wheel);
  }
  return g;
}

// Sign facing +z. The lib sign() uses metre UVs on a box, so long text gets clipped;
// put the text on a plane with 0..1 UVs in front of a plain backing box instead.
function plateSign({ text, w, h, bg = PALETTE.blue, fg = '#ffffff' }) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round(256 * h / w)) });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, 0.11);
  return group(box(w, h, 0.2, mat(bg)), face);
}

// Small cluster of chemical drums.
function drums(colours, cols = 3) {
  const g = new THREE.Group();
  g.add(box(cols * 0.65 + 0.2, 0.15, 1.5, mat(PALETTE.woodLight)));
  colours.forEach((c, i) => {
    g.add(place(cylinder(0.28, 0.28, 0.85, mat(c), 10), { x: (i % cols - (cols - 1) / 2) * 0.62, y: 0.15, z: Math.floor(i / cols) * 0.62 - 0.31 }));
  });
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'concrete'));

  // ---- ground markings: asphalt road strip & loading bay, hazard pad under the spheres
  g.add(place(patch(19, 2.4, 'asphalt'), { y: y0, z: 2.6 }));
  g.add(place(patch(8.8, 6.6, 'asphalt'), { x: 5, y: y0, z: 6.4 }));
  g.add(place(patch(7, 11.4, surface('hazard', PALETTE.yellow, { size: 1.5 })), { x: 6.3, y: y0, z: -4.2 }));
  g.add(place(patch(6.6, 11, 'concrete'), { x: 6.3, y: y0 + 0.01, z: -4.2 }));

  // ---- process towers (back left)
  g.add(place(processTower({ r: 1.3, h: 25, platforms: [6, 12, 18, 23.5], ladderAngle: 40 }), { x: -2.4, y: y0, z: -7.4 }));
  g.add(place(processTower({ r: 1.0, h: 19, platforms: [7, 13, 17.5], ladderAngle: 60 }), { x: 0.9, y: y0, z: -5.0 }));
  g.add(place(processTower({ r: 0.8, h: 14, platforms: [6, 12.5], ladderAngle: 30 }), { x: -8.3, y: y0, z: -2.6 }));

  // ---- orange steel process frame with coloured vessels
  const fx = -6.4, fz = -6.6;
  g.add(place(processFrame({ w: 5.6, d: 4.4, levels: 3, levelH: 4 }), { x: fx, y: y0, z: fz }));
  g.add(place(hVessel(0.8, 3.4, mat(PALETTE.green, { roughness: 0.5 }), 0.3), { x: fx, y: y0 + 4, z: fz }));
  g.add(place(tank({ radius: 0.8, h: 2.2, roof: 'dome', material: mat(PALETTE.plasterBlue, { roughness: 0.5 }) }), { x: fx - 1.3, y: y0 + 8, z: fz + 0.6 }));
  g.add(place(tank({ radius: 0.6, h: 1.6, roof: 'cone', material: WHITE }), { x: fx + 1.4, y: y0 + 8, z: fz - 0.5 }));
  g.add(place(hVessel(0.55, 2.4, mat(PALETTE.red, { roughness: 0.5 }), 0.2), { x: fx + 0.2, y: y0 + 12, z: fz }));
  // pumps at the foot of the frame
  for (const [x, c] of [[-1.5, PALETTE.blue], [0, PALETTE.green], [1.5, PALETTE.blue]]) {
    g.add(place(box(0.9, 0.6, 0.6, mat(PALETTE.concreteDark)), { x: fx + x, y: y0, z: fz + 1.2 }));
    g.add(place(box(0.7, 0.55, 0.45, mat(c)), { x: fx + x, y: y0 + 0.6, z: fz + 1.2 }));
  }
  // stair tower up the frame side (zigzag beams)
  for (let i = 0; i < 3; i++) {
    const za = i % 2 === 0 ? fz - 2 : fz + 2;
    g.add(beam([fx + 3.3, y0 + i * 4, za], [fx + 3.3, y0 + (i + 1) * 4, -za + 2 * fz], 0.5, GRATING));
  }

  // ---- gas spheres (back right) on a bunded pad
  const SPH = mat(PALETTE.white, { roughness: 0.4, flatShading: false });
  for (const [x, z, r] of [[6.3, -7.2, 2.4], [6.3, -1.6, 2.2]]) {
    const st = sphereTank({ radius: r, legs: 8, material: SPH });
    g.add(place(st, { x, y: y0 + 0.01, z }));
    const cy = y0 + r * 0.6 + r;
    g.add(place(cylinder(r + 0.02, r + 0.02, 0.25, mat(PALETTE.blue), 24), { x, y: cy - 0.12, z }));
    // top platform + ladder down the outside
    g.add(place(cylinder(0.9, 0.9, 0.12, GRATING, 12), { x, y: cy + r - 0.05, z }));
    g.add(place(ring(0.9, 0.04, RAIL, 0), { x, y: cy + r + 0.9, z }));
    for (let i = 0; i < 4; i++) g.add(place(box(0.06, 0.95, 0.06, RAIL), { x: x + Math.cos(i * Math.PI / 2 + 0.6) * 0.9, y: cy + r - 0.05, z: z + Math.sin(i * Math.PI / 2 + 0.6) * 0.9 }));
    g.add(beam([x - r - 0.35, y0, z + 0.4], [x - 0.9, cy + r, z + 0.4], 0.45, GRATING));
    // relief valve stub
    g.add(place(cylinder(0.12, 0.12, 0.8, mat(PALETTE.red), 8), { x: x + 0.4, y: cy + r - 0.1, z: z - 0.3 }));
  }
  // bund wall
  g.add(place(fence({ w: 6.8, d: 11.4, h: 0.5, style: 'wall', color: PALETTE.concreteDark, sides: ['back', 'left', 'right', 'front'] }), { x: 6.3, y: y0, z: -4.2 }));

  // ---- flare stack (back middle)
  g.add(place(lattice({ w: 1.6, h: 18, topW: 0.7, segments: 6, thickness: 0.12, material: STEEL }), { x: 2.6, y: y0, z: -8.6 }));
  g.add(place(cylinder(0.25, 0.3, 21, mat(PALETTE.steelLight), 10), { x: 2.6, y: y0, z: -8.6 }));
  g.add(place(cylinder(0.32, 0.32, 0.8, mat(PALETTE.red), 10), { x: 2.6, y: y0 + 20.6, z: -8.6 }));
  g.add(place(cylinder(0.05, 0.45, 1.6, emissive(PALETTE.orange, 1.4), 8), { x: 2.6, y: y0 + 21.4, z: -8.6 }));
  g.add(place(cylinder(0.02, 0.22, 1.0, emissive(PALETTE.yellow, 1.6), 8), { x: 2.6, y: y0 + 21.5, z: -8.6 }));

  // ---- pipe rack along X (z = 0.2), coloured pipes on top
  const rackZ = 0.2, rackH = 4.2, rx0 = -9.4, rx1 = 3.6;
  for (let x = rx0 + 0.2; x <= rx1 + 0.01; x += 2.6) {
    for (const dz of [-0.9, 0.9]) g.add(place(box(0.25, rackH, 0.25, STEEL), { x, y: y0, z: rackZ + dz }));
    g.add(place(box(0.25, 0.25, 2.2, STEEL), { x, y: y0 + rackH, z: rackZ }));
    g.add(place(box(0.25, 0.25, 2.2, STEEL), { x, y: y0 + rackH - 1.5, z: rackZ }));
  }
  for (const dz of [-0.9, 0.9]) g.add(place(box(rx1 - rx0, 0.2, 0.2, STEEL), { x: (rx0 + rx1) / 2 + 0.2, y: y0 + rackH, z: rackZ + dz }));
  PIPE_COLOURS.forEach((c, i) => {
    const pz = rackZ - 0.8 + i * 0.4;
    g.add(pipe([rx0, y0 + rackH + 0.4, pz], [rx1 + 0.3, y0 + rackH + 0.4, pz], 0.16, mat(c, { roughness: 0.5 })));
  });
  // lower tier: two fat grey pipes
  for (const dz of [-0.45, 0.45]) g.add(pipe([rx0, y0 + rackH - 1.1, rackZ + dz], [rx1 + 0.3, y0 + rackH - 1.1, rackZ + dz], 0.24, metal(PALETTE.steelLight)));

  // ---- risers & connections (rack -> towers / frame / spheres)
  const pr = (c) => mat(c, { roughness: 0.5 });
  const top = y0 + rackH + 0.4;
  // red: rack -> big tower
  g.add(pipeRun([[-2.4, top, rackZ - 0.8], [-2.4, top, -4.6], [-2.4, y0 + 12, -5.8]], 0.16, pr(PALETTE.red)));
  // yellow: rack -> middle tower, up its side
  g.add(pipeRun([[0.2, top, rackZ - 0.4], [0.2, top, -3.6], [0.2, y0 + 15, -3.6], [0.6, y0 + 15, -4.0]], 0.16, pr(PALETTE.yellow)));
  // green: rack -> process frame
  g.add(pipeRun([[-5.6, top, rackZ], [-5.6, top, -3.0], [-5.6, y0 + 8.4, -3.0], [-5.6, y0 + 8.4, -4.6]], 0.16, pr(PALETTE.green)));
  // blue: rack -> small tower
  g.add(pipeRun([[-8.3, top, rackZ + 0.4], [-8.3, top, -1.2], [-8.3, y0 + 9, -1.2], [-8.3, y0 + 9, -1.7]], 0.16, pr(PALETTE.blue)));
  // white & blue: rack end -> both spheres (over the bund wall)
  g.add(pipeRun([[rx1 + 0.3, top, rackZ + 0.8], [3.4 + 0.5, top, rackZ + 0.8], [3.9, top, -1.6], [3.9, y0 + 1.2, -1.6], [4.3, y0 + 1.2, -1.6]], 0.16, pr(PALETTE.white)));
  g.add(pipeRun([[rx1 + 0.3, top, rackZ - 0.4], [3.4, top, rackZ - 0.4], [3.4, top, -7.2], [3.4, y0 + 1.2, -7.2], [4.0, y0 + 1.2, -7.2]], 0.16, pr(PALETTE.blue)));
  // tower bottom pipes into the frame at ground level
  g.add(pipeRun([[-2.4, y0 + 1.4, -5.9], [-2.4, y0 + 1.4, -4.6], [-3.7, y0 + 1.4, -4.6]], 0.18, metal(PALETTE.steelLight)));
  g.add(pipeRun([[0.9, y0 + 1.0, -3.9], [0.9, y0 + 1.0, -2.2], [-1, y0 + 1.0, -2.2], [-1, top - 1.5, -2.2]], 0.14, pr(PALETTE.green)));

  // ---- small reactors / day tanks between rack and towers
  g.add(place(hVessel(0.7, 3, pr(PALETTE.yellow), 0.4), { x: -5.2, y: y0, z: -2.4 }));

  // ---- lab / control block (front left)
  const ox = -5.4, oz = 6.4, ow = 7.4, od = 4.8;
  g.add(place(facadeBlock({ w: ow, d: od, floors: 2, style: 'ribbon', wall: PALETTE.offWhite, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, lit: 0.25, seed: 50, roof: PALETTE.concreteDark }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: ow, d: od, h: 0.5, t: 0.25, material: mat(PALETTE.blue) }), { x: ox, y: y0 + 6, z: oz }));
  g.add(place(rooftopUnits({ w: ow - 2, d: od - 2, count: 3, seed: 7 }), { x: ox, y: y0 + 6, z: oz }));
  g.add(place(door({ w: 1.6, h: 2.3, color: PALETTE.glassDark }), { x: ox + 1.6, y: y0, z: oz + od / 2 }));
  g.add(place(box(2.6, 0.18, 1.4, mat(PALETTE.blue)), { x: ox + 1.6, y: y0 + 2.6, z: oz + od / 2 + 0.7 }));
  g.add(place(plateSign({ text: 'TINYCHEM', w: 5, h: 1.1 }), { x: ox, y: y0 + 6.5, z: oz + od / 2 - 0.3 }));
  g.add(place(plateSign({ text: 'TINYCHEM', w: 3.8, h: 0.9 }), { x: ox + ow / 2 + 0.02, y: y0 + 4.2, z: oz, ry: 90 }));
  // car park next to the office
  for (const [x, c] of [[-7.4, PALETTE.red], [-2.4, PALETTE.white]]) g.add(place(car({ color: c }), { x, y: y0 + 0.05, z: 2.6, ry: 0 }));

  // ---- tanker loading bay (front right)
  const bx = 5.0, bz = 6.4;
  // cantilevered canopy over the loading side only, so the tanker stays visible
  for (const x of [bx - 3.8, 0 + bx, bx + 3.8]) g.add(place(box(0.3, 5.2, 0.3, STEEL), { x, y: y0, z: bz - 2.4 }));
  g.add(place(box(8.4, 0.3, 3.0, mat(PALETTE.steelLight, { metalness: 0.3 })), { x: bx, y: y0 + 5.2, z: bz - 1.6 }));
  g.add(place(box(8.4, 0.35, 0.12, mat(PALETTE.orange)), { x: bx, y: y0 + 5.2, z: bz - 0.06 }));
  // loading arm platform alongside the truck
  g.add(place(box(4, 0.12, 0.9, GRATING), { x: bx - 1.5, y: y0 + 3.3, z: bz - 1.8 }));
  g.add(place(box(4, 0.06, 0.06, RAIL), { x: bx - 1.5, y: y0 + 4.3, z: bz - 2.2 }));
  g.add(place(box(0.25, 3.3, 0.25, STEEL), { x: bx - 3.4, y: y0, z: bz - 1.8 }));
  g.add(pipeRun([[bx - 1.5, y0 + 4.6, bz - 2.1], [bx - 1.5, y0 + 4.6, bz - 0.9], [bx - 1.5, y0 + 3.9, bz - 0.3]], 0.12, pr(PALETTE.yellow)));
  g.add(pipeRun([[3.9, top, rackZ + 0.8], [3.9, y0 + 4.8, bz - 2.1], [bx - 1.5, y0 + 4.8, bz - 2.1]], 0.14, pr(PALETTE.white)));
  g.add(place(tankerTruck(), { x: bx - 0.2, y: y0 + 0.05, z: bz - 0.1 }));
  g.add(place(drums([PALETTE.blue, PALETTE.blue, PALETTE.yellow, PALETTE.blue, PALETTE.red, PALETTE.blue]), { x: bx + 2.7, y: y0, z: bz + 3.9 - 1 }));

  // ---- drums & props
  g.add(place(drums([PALETTE.yellow, PALETTE.yellow, PALETTE.green, PALETTE.yellow, PALETTE.green]), { x: -1.0, y: y0, z: 5.0 }));
  g.add(place(drums([PALETTE.blue, PALETTE.red, PALETTE.blue, PALETTE.blue], 2), { x: -8.6, y: y0, z: -8.7 }));
  for (const [x, z] of [[-1.0, 8.6], [9.2, 2.6], [-9.2, 4.2]]) g.add(place(streetLamp({ h: 4.5 }), { x, y: y0, z, ry: x > 0 ? 180 : 0 }));
  for (const [x, z, s] of [[-9.0, 9.0, 3], [-1.4, 9.0, 4], [-2.6, 9.0, 5]]) g.add(place(tree({ kind: 'bush', h: 1.3, seed: s }), { x, y: y0, z }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 12 }), { x: -1.4, y: y0, z: 7.4 }));

  // ---- perimeter fence with a gate at the loading bay
  g.add(place(fence({ w: 19.4, d: 19.4, h: 1.8, style: 'wire', color: PALETTE.steel, sides: ['back', 'left', 'right'] }), { y: y0 }));
  g.add(place(fence({ w: 9.6, d: 0, h: 1.8, style: 'wire', color: PALETTE.steel, sides: ['front'] }), { x: -4.9, y: y0, z: 9.7 }));
  // gate posts with hazard caps
  for (const x of [0, 9.7]) g.add(place(box(0.3, 2, 0.3, mat(PALETTE.yellow)), { x: x - 0.15 * Math.sign(x || 1), y: y0, z: 9.6 }));

  return group(g);
}

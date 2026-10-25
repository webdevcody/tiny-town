import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, cone, sphere, place, group, parapet, rooftopUnits,
  tank, sphereTank, smokestack, lattice, pipe, pipeRun, beam, fence, sign, car, tree, streetLamp,
  mat, metal, emissive, surface, shade,
} from '../../src/lib/index.js';

const Y0 = LOT_HEIGHT;
const STEEL = metal(PALETTE.steelDark, { roughness: 0.5 });
const YELLOW = mat(PALETTE.yellow);
const RED = mat(PALETTE.red);

// Distillation column: tall vessel with platform rings, yellow handrails and a ladder.
function column({ r, h, color = PALETTE.white, platforms = 4, skirt = 1.2 }) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.55 });
  g.add(cylinder(r * 1.08, r * 1.15, skirt, mat(PALETTE.concreteDark), 14));
  g.add(place(cylinder(r, r, h - skirt, body, 16), { y: skirt }));
  g.add(place(sphere(r, body, 14), { y: h, s: [1, 0.45, 1] }));
  g.add(place(cylinder(0.18, 0.18, 1.4, STEEL, 8), { y: h + r * 0.3 }));
  // insulation bands
  for (let i = 1; i <= Math.floor((h - skirt) / 3.2); i++) {
    g.add(place(cylinder(r + 0.04, r + 0.04, 0.12, mat(shade(color, -0.18)), 16), { y: skirt + i * 3.2 }));
  }
  const ring = new THREE.TorusGeometry(r + 0.75, 0.06, 4, 18);
  ring.rotateX(Math.PI / 2);
  for (let i = 1; i <= platforms; i++) {
    const py = skirt + ((h - skirt - 1) * i) / platforms;
    g.add(place(cylinder(r + 0.8, r + 0.8, 0.14, STEEL, 18), { y: py }));
    const rail = new THREE.Mesh(ring, YELLOW);
    rail.position.y = py + 0.9;
    g.add(rail);
  }
  // ladder on the +x side
  g.add(place(box(0.08, h - 1.5, 0.08, YELLOW), { x: r + 0.25, y: 1, z: -0.25 }));
  g.add(place(box(0.08, h - 1.5, 0.08, YELLOW), { x: r + 0.25, y: 1, z: 0.25 }));
  g.add(place(box(0.08, h - 1.5, 0.5, mat(PALETTE.steel)), { x: r + 0.25, y: 1, s: [1, 1, 0.9] }));
  return g;
}

// Floating-roof storage tank with a coloured band, wind girder and a stair stringer.
function storageTank({ r, h, band = PALETTE.red, color = PALETTE.white }) {
  const g = tank({ radius: r, h, roof: 'flat', material: mat(color, { roughness: 0.5 }), segments: 24 });
  g.add(place(cylinder(r + 0.03, r + 0.03, 0.9, mat(band), 24), { y: h - 1.6 }));
  g.add(place(cylinder(r - 0.25, r - 0.25, 0.08, mat(PALETTE.steelLight), 24), { y: h - 0.4 }));
  g.add(place(cylinder(r + 0.25, r + 0.25, 0.12, mat(PALETTE.steel), 24), { y: h }));
  g.add(place(cylinder(0.5, 0.5, 0.6, STEEL, 8), { y: h - 0.35 }));
  // spiral-ish stair stringer up the side
  const pts = [];
  for (let i = 0; i <= 6; i++) {
    const a = Math.PI * 0.15 + (i / 6) * Math.PI * 0.55;
    pts.push([Math.cos(a) * (r + 0.25), (i / 6) * h, Math.sin(a) * (r + 0.25)]);
  }
  g.add(pipeRun(pts, 0.1, YELLOW));
  return g;
}

// Steel pipe rack: portal frames along X with a bundle of colour-coded pipes.
function pipeRack({ length, h = 5, w = 2.4, bay = 3.5, colors }) {
  const g = new THREE.Group();
  const n = Math.max(1, Math.round(length / bay));
  for (let i = 0; i <= n; i++) {
    const x = -length / 2 + (length * i) / n;
    for (const sz of [-1, 1]) g.add(place(box(0.3, h, 0.3, STEEL), { x, z: (sz * w) / 2 }));
    g.add(place(box(0.35, 0.3, w + 0.3, STEEL), { x, y: h }));
    g.add(place(box(0.3, 0.25, w + 0.3, STEEL), { x, y: h * 0.55 }));
  }
  g.add(place(box(length, 0.2, 0.2, STEEL), { y: h, z: w / 2 }));
  g.add(place(box(length, 0.2, 0.2, STEEL), { y: h, z: -w / 2 }));
  colors.forEach((c, i) => {
    const z = -w / 2 + 0.3 + ((w - 0.6) * i) / Math.max(1, colors.length - 1);
    const r = i % 2 ? 0.22 : 0.3;
    g.add(pipe([-length / 2, h + 0.3 + r - 0.2, z], [length / 2, h + 0.3 + r - 0.2, z], r, mat(c, { roughness: 0.45, metalness: 0.2 })));
  });
  for (let i = 0; i < 3; i++) {
    const z = -w / 2 + 0.5 + i * ((w - 1) / 2);
    g.add(pipe([-length / 2, h * 0.55 + 0.4, z], [length / 2, h * 0.55 + 0.4, z], 0.2, metal(PALETTE.steel)));
  }
  return g;
}

// Flare stack: braced lattice tower carrying a thin stack with a burning tip.
function flareStack({ h = 32 }) {
  const g = new THREE.Group();
  g.add(box(3.4, 0.5, 3.4, mat(PALETTE.concreteDark)));
  g.add(place(lattice({ w: 3, topW: 1.2, h: h - 2, segments: 8, thickness: 0.18, material: metal(PALETTE.red) }), { y: 0.5 }));
  g.add(place(cylinder(0.35, 0.45, h, mat(PALETTE.steelLight), 10), { y: 0.5 }));
  for (let i = 0; i < 3; i++) g.add(place(cylinder(0.5, 0.5, 0.8, i % 2 ? RED : mat(PALETTE.white), 10), { y: h - 4 + i * 0.8 }));
  g.add(place(cylinder(0.6, 0.45, 0.7, STEEL, 10), { y: h + 0.5 }));
  // flame
  g.add(place(cone(1.2, 4.2, emissive('#ff8c00', 0.9), 10), { y: h + 1.2 }));
  g.add(place(cone(0.7, 2.8, emissive('#ffc400', 0.8), 10), { y: h + 1.2 }));
  g.add(place(sphere(1.1, emissive('#ff3c00', 0.6), 10), { y: h + 1.6, s: [1, 0.7, 1] }));
  // a drift of smoke
  const smoke = mat(PALETTE.grey, { transparent: true, opacity: 0.55 });
  g.add(place(sphere(1.2, smoke, 8), { x: -1.0, y: h + 6.2, z: 0.4 }));
  g.add(place(sphere(1.5, smoke, 8), { x: -2.4, y: h + 7.2, z: 0.8 }));
  return g;
}

// Fuel tanker: cab plus a cylindrical barrel trailer, length along X, cab at +x.
function tanker(color = PALETTE.red) {
  const g = new THREE.Group();
  g.add(place(box(2.2, 2.4, 2.3, mat(color, { roughness: 0.5 })), { x: 3.4, y: 0.5 }));
  g.add(place(box(0.05, 0.9, 1.9, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.52, y: 1.75 }));
  g.add(place(box(7.4, 0.3, 1.6, STEEL), { x: -1.1, y: 0.7 }));
  g.add(place(cylinder(1.15, 1.15, 6.8, mat(PALETTE.chrome, { roughness: 0.35, metalness: 0.4 }), 14), { x: 2.3, y: 2.1, rz: 90 }));
  g.add(place(box(6.8, 0.35, 2.36, mat(color)), { x: -1.1, y: 1.95, s: [1, 1, 1] }));
  g.add(place(box(5.8, 0.15, 0.6, STEEL), { x: -1.1, y: 3.2 }));
  const wgeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
  wgeo.rotateX(Math.PI / 2);
  const wm = mat(PALETTE.black);
  for (const x of [3.4, -2.6, -3.8]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(wgeo, wm);
    w.position.set(x, 0.5, sz * 1.0);
    g.add(w);
  }
  return g;
}

// Small vertical drum / vessel on a plinth.
function drum(r, h, color = PALETTE.steelLight) {
  return group(
    box(r * 2.4, 0.4, r * 2.4, mat(PALETTE.concreteDark)),
    place(cylinder(r, r, h, mat(color, { roughness: 0.5 }), 12), { y: 0.4 }),
    place(sphere(r, mat(color, { roughness: 0.5 }), 12), { y: 0.4 + h, s: [1, 0.5, 1] })
  );
}

// Horizontal vessel on two saddles, along X.
function hDrum(r, len, color = PALETTE.white) {
  const m = mat(color, { roughness: 0.5 });
  const g = new THREE.Group();
  for (const sx of [-1, 1]) g.add(place(box(0.5, r + 0.3, r * 1.6, mat(PALETTE.concreteDark)), { x: (sx * len) / 3 }));
  g.add(place(cylinder(r, r, len, m, 14), { x: len / 2, y: r + 0.3, rz: 90 }));
  for (const sx of [-1, 1]) g.add(place(sphere(r, m, 12), { x: (sx * len) / 2, y: r + 0.3, s: [0.45, 1, 1] }));
  return g;
}

// 3x3 tiles (30 x 30 m). Front (gate, offices, loading bay) faces +z.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 3], 'concrete'));

  // ---- ground: gravel tank farm, asphalt roads -----------------------------
  g.add(place(patch(15, 15.5, 'gravel'), { x: -7, y: Y0, z: -6.75 }));
  g.add(place(patch(30, 4, 'asphalt'), { y: Y0, z: 6.6 }));        // main east-west road
  g.add(place(patch(4, 7, 'asphalt'), { x: -1, y: Y0, z: 11.5 }));  // gate road
  g.add(place(patch(10, 0.25, mat(PALETTE.roadLine)), { x: 7, y: Y0 + 0.01, z: 6.6 }));

  // ---- tank farm (north-west), inside a concrete bund wall ----------------
  g.add(place(fence({ w: 14.6, d: 15.2, h: 0.9, style: 'wall', color: PALETTE.concrete }), { x: -7.1, y: Y0, z: -6.9 }));
  g.add(place(storageTank({ r: 3.4, h: 7.5, band: PALETTE.red }), { x: -10.3, y: Y0, z: -10.4 }));
  g.add(place(storageTank({ r: 3.0, h: 6.5, band: PALETTE.orange, color: PALETTE.offWhite }), { x: -3.3, y: Y0, z: -10.8 }));
  g.add(place(storageTank({ r: 3.0, h: 6.0, band: PALETTE.green, color: PALETTE.steelLight }), { x: -10.5, y: Y0, z: -3.0 }));
  g.add(place(tank({ radius: 2.1, h: 4.5, roof: 'cone', material: mat(PALETTE.cream, { roughness: 0.5 }) }), { x: -4.0, y: Y0, z: -3.2 }));
  // tank outlet pipes running to the main rack
  const pipeM = mat(PALETTE.steel, { roughness: 0.45, metalness: 0.3 });
  g.add(pipeRun([[-10.3, 0.8, -6.8], [-7, 0.8, -6.8], [-7, 0.8, 1.2], [-7, 5.4, 1.2]], 0.22, pipeM));
  g.add(pipeRun([[-3.3, 0.8, -7.6], [-1.2, 0.8, -7.6], [-1.2, 0.8, 0.9], [-1.2, 5.4, 0.9]], 0.22, mat(PALETTE.roofGreen)));

  // ---- main pipe rack along the road (east-west), branch north -----------
  g.add(place(pipeRack({ length: 28, h: 5, w: 2.4, colors: [PALETTE.yellow, PALETTE.steelLight, PALETTE.red, PALETTE.roofGreen, PALETTE.steel] }), { x: 0, y: Y0, z: 2.2 }));
  g.add(place(pipeRack({ length: 9.5, h: 7, w: 2.2, colors: [PALETTE.steelLight, PALETTE.yellow, PALETTE.blue, PALETTE.steel] }), { x: 1.6, y: Y0, z: -7.4, ry: 90 }));

  // ---- process unit (east): distillation columns on a concrete pad -------
  g.add(place(box(12, 0.25, 9, mat(PALETTE.concreteDark)), { x: 8.4, y: Y0, z: -4.8 }));
  g.add(place(column({ r: 1.7, h: 27, platforms: 5 }), { x: 6.0, y: Y0 + 0.25, z: -6.6 }));
  g.add(place(column({ r: 1.25, h: 21, platforms: 4, color: PALETTE.steelLight }), { x: 10.2, y: Y0 + 0.25, z: -7.4 }));
  g.add(place(column({ r: 0.95, h: 15, platforms: 3, color: PALETTE.offWhite }), { x: 5.2, y: Y0 + 0.25, z: -1.9 }));
  // overhead vapour lines from the column tops to the condensers
  g.add(pipeRun([[6.0, 27.8, -6.6], [6.0, 29, -6.6], [3.4, 29, -6.6], [3.4, 7.6, -6.6]], 0.3, mat(PALETTE.steelLight)));
  g.add(pipeRun([[10.2, 21.6, -7.4], [10.2, 22.6, -7.4], [12.8, 22.6, -7.4], [12.8, 4.2, -7.4]], 0.25, mat(PALETTE.steelLight)));
  g.add(pipeRun([[5.2, 15.5, -1.9], [5.2, 16.3, -1.9], [3.4, 16.3, -1.9], [3.4, 7.6, -1.9]], 0.2, mat(PALETTE.steelLight)));
  // structural steel frame with air-cooler fans on top, between the columns
  g.add(place(lattice({ w: 3, d: 2.6, h: 9, segments: 3, thickness: 0.16 }), { x: 8.2, y: Y0 + 0.25, z: -3.2 }));
  g.add(place(box(3.4, 0.25, 3, STEEL), { x: 8.2, y: Y0 + 9.25, z: -3.2 }));
  for (const fz of [-3.9, -2.5]) g.add(place(cylinder(0.6, 0.6, 0.35, mat(PALETTE.darkGrey), 12), { x: 8.2, y: Y0 + 9.5, z: fz }));
  g.add(place(hDrum(0.9, 4.2, PALETTE.white), { x: 12.2, y: Y0 + 0.25, z: -2.4 }));
  g.add(place(drum(0.8, 3.2, PALETTE.steelLight), { x: 12.6, y: Y0 + 0.25, z: -4.6 }));

  // fired heater (furnace) with its own red-and-white stack
  const brick = surface('brick', PALETTE.brick, { size: 1.5 });
  g.add(place(box(5.5, 5, 3.4, brick), { x: 10.6, y: Y0, z: 0.0 }));
  g.add(place(box(5.8, 0.3, 3.7, mat(PALETTE.steelDark)), { x: 10.6, y: Y0 + 5, z: 0.0 }));
  g.add(place(taperBox(), { x: 10.6, y: Y0 + 5.3, z: 0.0 }));
  g.add(place(smokestack({ radius: 0.7, topRadius: 0.55, h: 13, color: PALETTE.white, bandColor: PALETTE.red, bands: 2 }), { x: 10.6, y: Y0 + 6.5, z: 0.0 }));
  for (const x of [8.9, 10.6, 12.3]) g.add(place(box(0.9, 0.9, 0.1, emissive('#ff8a2a', 0.9)), { x, y: Y0 + 1, z: 1.75 }));

  // ---- flare stack (north-east corner) -----------------------------------
  g.add(place(flareStack({ h: 31 }), { x: 12.4, y: Y0, z: -12.6 }));
  g.add(place(hDrum(0.8, 3.2, PALETTE.steelLight), { x: 7.4, y: Y0, z: -13.2 }));
  g.add(pipeRun([[9.0, 1.1, -13.2], [12.4, 1.1, -13.2]], 0.2, pipeM));

  // ---- LPG spheres (south-west) -------------------------------------------
  g.add(place(box(11, 0.25, 4.6, mat(PALETTE.concreteDark)), { x: -9.2, y: Y0, z: 11.2 }));
  g.add(place(sphereTank({ radius: 2.1, legs: 6 }), { x: -11.6, y: Y0 + 0.25, z: 11.2 }));
  g.add(place(sphereTank({ radius: 2.1, legs: 6 }), { x: -6.6, y: Y0 + 0.25, z: 11.2 }));
  g.add(pipeRun([[-11.6, 1.3, 11.2], [-11.6, 1.3, 9.3], [-6.6, 1.3, 9.3], [-6.6, 1.3, 11.2]], 0.15, YELLOW));
  g.add(pipeRun([[-9.1, 1.3, 9.3], [-9.1, 5.4, 9.3], [-9.1, 5.4, 3.4]], 0.18, YELLOW));

  // ---- control building + gate (south) ------------------------------------
  const cbX = 4.6, cbZ = 11.4;
  g.add(place(facadeBlock({ w: 7, d: 4.4, floors: 2, style: 'ribbon', wall: PALETTE.cream, glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.35, seed: 7, roof: PALETTE.concreteDark }), { x: cbX, y: Y0, z: cbZ }));
  g.add(place(parapet({ w: 7, d: 4.4, h: 0.4, material: mat(PALETTE.stoneDark) }), { x: cbX, y: Y0 + 6, z: cbZ }));
  g.add(place(rooftopUnits({ w: 5, d: 3, count: 2, seed: 4 }), { x: cbX, y: Y0 + 6, z: cbZ }));
  g.add(place(sign({ text: 'TINY OIL', w: 4.6, h: 0.9, bg: PALETTE.red, fg: '#ffffff' }), { x: cbX, y: Y0 + 6.2, z: cbZ + 2.2 }));
  g.add(place(box(1.4, 2.2, 0.1, mat(PALETTE.navy)), { x: cbX - 2, y: Y0, z: cbZ + 2.22 }));

  // tanker loading bay: canopy on posts over the road with an arm
  const lbX = 10.8, lbZ = 11.6;
  g.add(place(patch(7.6, 6.4, 'asphalt'), { x: lbX + 0.6, y: Y0, z: lbZ - 0.4 }));
  g.add(place(box(8.6, 0.3, 4.2, mat(PALETTE.white)), { x: lbX, y: Y0 + 5.2, z: lbZ }));
  g.add(place(box(8.6, 0.4, 0.15, RED), { x: lbX, y: Y0 + 5.15, z: lbZ + 2.1 }));
  for (const px of [-3.9, 3.9]) for (const pz of [-1.8, 1.8]) g.add(place(box(0.3, 5.2, 0.3, STEEL), { x: lbX + px, y: Y0, z: lbZ + pz }));
  g.add(place(box(0.8, 4, 0.8, mat(PALETTE.steelLight)), { x: lbX - 2.6, y: Y0, z: lbZ - 1.7 }));
  g.add(beam([lbX - 2.6, Y0 + 3.8, lbZ - 1.7], [lbX - 0.8, Y0 + 3.6, lbZ - 0.4], 0.14, YELLOW));
  g.add(place(tanker(PALETTE.red), { x: lbX - 0.6, y: Y0, z: lbZ + 0.4 }));
  g.add(place(tanker(PALETTE.blue), { x: 0.8, y: Y0, z: 6.4, ry: 180 }));

  // perimeter security fence with a gate opening, gatehouse and barrier
  g.add(place(fence({ w: 29.6, d: 29.6, h: 1.8, style: 'wire' , sides: ['back', 'left', 'right'] }), { y: Y0 }));
  g.add(place(fence({ w: 12.6, d: 1, h: 1.8, style: 'wire', sides: ['front'] }), { x: -8.7, y: Y0, z: 14.3 }));
  g.add(place(fence({ w: 13.2, d: 1, h: 1.8, style: 'wire', sides: ['front'] }), { x: 8.4, y: Y0, z: 14.3 }));
  g.add(place(box(1.8, 2.6, 1.8, mat(PALETTE.white)), { x: 1.9, y: Y0, z: 13.2 }));
  g.add(place(box(2.2, 0.25, 2.2, RED), { x: 1.9, y: Y0 + 2.6, z: 13.2 }));
  g.add(place(box(0.1, 0.8, 1.5, mat(PALETTE.glassDark)), { x: 0.97, y: Y0 + 1.2, z: 13.2 }));
  g.add(place(box(3.4, 0.14, 0.14, mat(PALETTE.white)), { x: -1, y: Y0 + 1.0, z: 14.4 }));
  for (let i = 0; i < 3; i++) g.add(place(box(0.5, 0.15, 0.16, RED), { x: -2.2 + i * 1.1, y: Y0 + 1.0, z: 14.4 }));

  // staff parking + a few trees and lamps along the front
  const carCols = [PALETTE.blue, PALETTE.white, PALETTE.yellow];
  carCols.forEach((c, i) => g.add(place(car({ color: c }), { x: -13.0 + i * 3.0, y: Y0, z: 7.0, ry: 90 })));
  for (const [x, z] of [[-13.2, 14], [-4.5, 14]]) g.add(place(tree({ kind: 'round', h: 4.5, seed: x * 7 + z }), { x, y: Y0, z: z - 0.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.4, seed: 3 }), { x: 0.4, y: Y0, z: 9.6 }));
  for (const x of [-6, 6]) g.add(place(streetLamp({ h: 5 }), { x, y: Y0, z: 4.6, ry: 90 }));
  return g;
}

// Convection-section hood on top of the heater.
function taperBox() {
  const m = mat(PALETTE.steel);
  return group(
    box(4.4, 0.6, 2.6, m),
    place(box(2.6, 0.6, 1.8, m), { y: 0.6 })
  );
}

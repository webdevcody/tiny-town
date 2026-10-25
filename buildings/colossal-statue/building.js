import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, cylinder, extrude, taperedBlock, place, mat, emissive, surface,
  tree, stairs, flag, streetLamp, rng,
} from '../../src/lib/index.js';
import { statue } from './statue.js';

const GRANITE = '#c2b69e';
const GRANITE_DARK = '#9d927d';

// Wobbly closed polygon of radius ~r (for the island shoreline).
function blob(r, n, wobble, seed) {
  const R = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + R.range(-wobble, wobble));
    pts.push([Math.sin(a) * rr, Math.cos(a) * rr]);
  }
  return pts;
}

// n-pointed star, one inner corner pointing at +z (the entrance).
function star(n, outer, inner) {
  const pts = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? outer : inner;
    pts.push([Math.sin(a) * r, Math.cos(a) * r]);
  }
  return pts;
}

// Granite pedestal, ~5.9 m tall: plinth, pilastered shaft with loggias, cornice, attic, balcony.
function pedestal() {
  const g = new THREE.Group();
  const gr = mat(GRANITE);
  const grD = mat(GRANITE_DARK);
  const dark = mat('#3a3f45');
  const lit = emissive(PALETTE.windowLit, 0.35);

  g.add(taperedBlock({ w: 3.6, d: 3.6, h: 0.9, topW: 3.1, topD: 3.1, material: gr }));
  let y = 0.9;
  g.add(place(box(2.7, 3.2, 2.7, gr), { y }));
  // corner pilasters
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.62, 3.2, 0.62, grD), { x: sx * 1.2, y, z: sz * 1.2 }));
  }
  // each face: recessed loggia with two little columns, a roundel above
  for (let k = 0; k < 4; k++) {
    const face = new THREE.Group();
    face.add(place(box(1.2, 1.7, 0.06, dark), { y: 0.55, z: 1.35 }));
    for (const cx of [-0.32, 0.32]) face.add(place(cylinder(0.08, 0.08, 1.7, gr, 8), { x: cx, y: 0.55, z: 1.42 }));
    face.add(place(box(1.5, 0.2, 0.18, grD), { y: 2.25, z: 1.4 }));
    face.add(place(cylinder(0.24, 0.24, 0.08, grD, 12), { y: 2.85, z: 1.35, rx: 90 }));
    face.add(place(box(1.4, 0.2, 0.25, grD), { y: 0.35, z: 1.38 }));
    g.add(place(face, { y, ry: k * 90 }));
  }
  y += 3.2;
  g.add(place(box(3.15, 0.3, 3.15, grD), { y }));
  y += 0.3;
  // attic with a row of small gallery windows
  g.add(place(box(2.4, 1.25, 2.4, gr), { y }));
  for (let k = 0; k < 4; k++) {
    const face = new THREE.Group();
    for (let i = 0; i < 4; i++) face.add(place(box(0.28, 0.5, 0.05, i % 2 ? dark : lit), { x: -0.75 + i * 0.5, y: 0.4, z: 1.21 }));
    g.add(place(face, { y, ry: k * 90 }));
  }
  y += 1.25;
  // observation balcony + railing posts
  g.add(place(box(2.9, 0.18, 2.9, grD), { y }));
  y += 0.18;
  const rail = mat(PALETTE.darkGrey);
  for (const s of [-1, 1]) {
    g.add(place(box(2.8, 0.05, 0.05, rail), { y: y + 0.45, z: s * 1.4 }));
    g.add(place(box(0.05, 0.05, 2.8, rail), { x: s * 1.4, y: y + 0.45 }));
    for (let i = 0; i < 6; i++) {
      const t = -1.4 + i * 0.56;
      g.add(place(box(0.04, 0.45, 0.04, rail), { x: t, y, z: s * 1.4 }));
      g.add(place(box(0.04, 0.45, 0.04, rail), { x: s * 1.4, y, z: t }));
    }
  }
  // small square base the statue stands on
  g.add(place(box(2.1, 0.25, 2.1, gr), { y }));
  g.userData.height = y + 0.25;
  return g;
}

// Small sightseeing ferry, length along x, bow at +x.
function ferry() {
  const g = new THREE.Group();
  const hull = [[-1.4, -0.5], [0.9, -0.5], [1.5, 0], [0.9, 0.5], [-1.4, 0.5]];
  g.add(extrude(hull, 0.35, mat(PALETTE.navy)));
  g.add(place(extrude(hull.map(([x, z]) => [x * 0.97, z * 0.95]), 0.2, mat(PALETTE.white), mat(PALETTE.woodLight)), { y: 0.35 }));
  g.add(place(box(1.4, 0.55, 0.75, mat(PALETTE.white)), { x: -0.35, y: 0.55 }));
  for (const s of [-1, 1]) g.add(place(box(1.2, 0.2, 0.02, mat(PALETTE.window)), { x: -0.35, y: 0.75, z: s * 0.38 }));
  g.add(place(box(1.5, 0.06, 0.85, mat(PALETTE.red)), { x: -0.35, y: 1.1 }));
  g.add(place(cylinder(0.12, 0.12, 0.35, mat(PALETTE.red), 8), { x: -0.7, y: 1.16 }));
  return g;
}

// 1x1 tile (10 x 10 m), front faces +z: island in the harbour, pier and ferry on the south-east.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'water'));
  let y = LOT_HEIGHT;

  // island: sandy shore, grassy top, a few rocks
  g.add(place(extrude(blob(4.2, 22, 0.05, 7), 0.25, mat(PALETTE.sand), surface('gravel', PALETTE.sand, { size: 3 })), { y }));
  g.add(place(extrude(blob(3.9, 22, 0.04, 8), 0.45, mat(PALETTE.dirt), surface('grass', PALETTE.grass, { size: 4 })), { y }));
  const R = rng(31);
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + 0.3;
    if (Math.abs(a - Math.PI * 0.25) < 0.4) continue; // keep the pier clear
    const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(R.range(0.25, 0.4), 0), mat(i % 2 ? PALETTE.stone : PALETTE.stoneDark));
    rock.position.set(Math.sin(a) * 4.15, y + 0.12, Math.cos(a) * 4.15);
    rock.scale.y = 0.6;
    g.add(rock);
  }
  y += 0.45;

  // eleven-pointed star fort with a paved top
  const fortH = 1.1;
  g.add(place(extrude(star(11, 3.7, 2.75), fortH, mat(PALETTE.stone), surface('paving', PALETTE.paving, { size: 2 })), { y }));
  g.add(place(extrude(star(11, 3.7, 2.75).map(([x, z]) => [x * 1.02, z * 1.02]), 0.12, mat(PALETTE.stoneDark)), { y: y + fortH - 0.12 }));
  // entrance stairs at the front inner corner + path down to the pier
  g.add(place(stairs({ w: 1.1, h: fortH, d: 1.3, steps: 5, material: mat(PALETTE.stoneDark) }), { y, z: 3.45 }));
  g.add(place(box(1.1, 0.05, 1.5, surface('paving', PALETTE.paving, { size: 2 })), { x: 0.9, y, z: 3.5, ry: -40 }));

  // trees and bushes in the bays between the star's points
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    if (i === 0 || i === 1) continue; // front entrance and pier
    const r = 3.35;
    const kind = i % 3 === 0 ? 'round' : 'bush';
    g.add(place(tree({ kind, h: kind === 'round' ? 2.4 : 1.0, seed: 50 + i }), { x: Math.sin(a) * r, y, z: Math.cos(a) * r }));
  }

  // pier to the south-east corner; sightseeing ferry in the south-west
  const pierWood = mat(PALETTE.wood);
  const pier = new THREE.Group();
  pier.add(place(box(1.0, 0.12, 2.4, surface('planks', PALETTE.woodLight, { size: 1 })), { y: 0.45 }));
  for (const px of [-0.45, 0.45]) for (const pz of [-0.4, 0.5, 1.1]) pier.add(place(cylinder(0.08, 0.08, 0.6, pierWood, 6), { x: px, z: pz }));
  g.add(place(pier, { x: 3.4, y: 0, z: 3.4, ry: 45 }));
  g.add(place(ferry(), { x: -3.65, y: 0.05, z: 3.65, ry: 45, s: 0.8 }));

  // fort-top lamps and flags
  for (const [x, z] of [[-1.95, 1.95], [1.95, 1.95], [-1.95, -1.95], [1.95, -1.95]]) {
    g.add(place(streetLamp({ h: 1.8 }), { x, y: y + fortH, z, ry: Math.atan2(z, -x) * 180 / Math.PI }));
  }
  g.add(place(flag({ h: 3.2, color: PALETTE.navy, color2: PALETTE.red }), { x: -2.3, y: y + fortH, z: 0.4, ry: 160 }));
  y += fortH;

  // pedestal and statue
  const ped = pedestal();
  g.add(place(ped, { y }));
  y += ped.userData.height;
  g.add(place(statue(), { y, ry: 0 }));

  return g;
}

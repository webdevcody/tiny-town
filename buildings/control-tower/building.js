import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, facadeCylinder, parapet, rooftopUnits, box, cylinder, sphere, beam, place, group,
  antenna, sign, door, tree, car, fence, streetLamp, bench,
  mat, metal, glass, emissive, surface,
} from '../../src/lib/index.js';

const OCT = 22.5; // rotate 8-sided cylinders so a flat face points at +Z

// Ring of 8 posts + top rail (catwalk railing) at radius r.
function railing(r, h, material) {
  const g = new THREE.Group();
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    pts.push([Math.sin(a) * r, Math.cos(a) * r]);
  }
  for (let i = 0; i < 8; i++) {
    const [x1, z1] = pts[i];
    const [x2, z2] = pts[(i + 1) % 8];
    g.add(beam([x1, 0, z1], [x1, h, z1], 0.08, material));
    g.add(beam([x1, h, z1], [x2, h, z2], 0.08, material));
    g.add(beam([x1, h * 0.5, z1], [x2, h * 0.5, z2], 0.05, material));
  }
  return g;
}

// Parabolic-ish radar dish (sphere cap) on a yoke; opening faces +Z, tilted up.
function radarDish({ R = 2.4, spread = 0.6 } = {}) {
  const dishMat = mat(PALETTE.white, { side: THREE.DoubleSide, roughness: 0.5 });
  const steel = metal(PALETTE.steelDark);
  const geo = new THREE.SphereGeometry(R, 16, 5, 0, Math.PI * 2, 0, spread);
  geo.translate(0, -R, 0); // apex at origin
  const dish = new THREE.Mesh(geo, dishMat);
  const head = group(
    place(dish, { rx: -102 }),
    beam([0, 0, 0], [0, 0.5, R * 0.75], 0.07, steel), // feed horn arm
    place(box(0.25, 0.25, 0.3, steel), { y: 0.38, z: R * 0.75 }),
    place(box(0.5, 0.5, 0.6, steel), { y: -0.25, z: -0.25 }),
  );
  return group(
    cylinder(0.35, 0.45, 1.4, steel, 8),
    place(cylinder(0.6, 0.6, 0.25, metal(PALETTE.steel), 10), { y: 1.4 }),
    place(head, { y: 2.0, ry: 10 }),
  );
}

// Windsock on a pole, sock streaming towards +X.
function windsock(h = 4) {
  const sock = surface('stripes', PALETTE.orange, { color2: PALETTE.white, size: 0.6 });
  return group(
    cylinder(0.06, 0.08, h, metal(PALETTE.steelLight), 6),
    place(cylinder(0.32, 0.32, 0.08, metal(PALETTE.steelLight), 10), { x: 0.0, y: h - 0.3, rz: 90 }),
    place(cylinder(0.15, 0.34, 1.8, sock, 10), { x: 0.05, y: h - 0.3, rz: -82 }),
  );
}

// 1x1 tile (10 x 10 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  const concrete = mat(PALETTE.white, { roughness: 0.9 });
  const concreteBand = mat(PALETTE.lightGrey);
  const darkTrim = mat(PALETTE.darkGrey);
  const steel = metal(PALETTE.steelDark);

  // ground: apron / parking and paths
  g.add(place(patch(9.6, 3.4, 'asphalt'), { x: -0.2, y: y0, z: 3.2 }));
  for (const x of [-3.6, -1.4]) g.add(place(box(0.1, 0.02, 2.2, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: 3.4 }));
  g.add(place(patch(1.6, 1.4, 'paved'), { x: 1.0, y: y0, z: 0.9 }));

  // operations block (single storey) at the back left
  const ox = -1.9, oz = -2.9, ow = 5.8, od = 3.6, oh = 3.4;
  g.add(place(facadeBlock({ w: ow, d: od, h: oh, floorHeight: oh, style: 'ribbon', wall: PALETTE.offWhite, glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 1.6, lit: 0.25, seed: 63, roof: PALETTE.concreteDark }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: ow, d: od, h: 0.35, t: 0.2, material: concreteBand }), { x: ox, y: y0 + oh, z: oz }));
  g.add(place(box(ow + 0.04, 0.3, od + 0.04, mat(PALETTE.blue)), { x: ox, y: y0 + oh - 0.55, z: oz }));
  g.add(place(rooftopUnits({ w: 3.4, d: 2.2, count: 2, seed: 7 }), { x: ox - 0.6, y: y0 + oh, z: oz }));
  g.add(place(sign({ text: 'ATC', w: 1.8, h: 0.7, bg: PALETTE.navy, fg: '#ffffff' }), { x: ox - 1.2, y: y0 + oh + 0.35, z: oz + od / 2 - 0.1 }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.steelDark }), { x: ox + 1.4, y: y0, z: oz + od / 2 }));

  // the tower
  const tx = 1.2, tz = -1.0;
  const T = new THREE.Group();
  const shaftR = 1.7, shaftH = 17;
  T.add(place(cylinder(shaftR, 2.4, 2.4, concrete, 8), { ry: OCT })); // flared foot
  T.add(place(cylinder(shaftR, shaftR, shaftH, concrete, 8), { ry: OCT }));
  for (const y of [2.4, 7, 12]) T.add(place(cylinder(shaftR + 0.05, shaftR + 0.05, 0.25, concreteBand, 8), { y, ry: OCT }));
  // stairwell windows on the front and side faces
  const ap = shaftR * Math.cos(Math.PI / 8);
  const winMat = glass(PALETTE.glassDark);
  for (let y = 4; y < shaftH - 1; y += 3) {
    T.add(place(box(0.45, 1.1, 0.1, winMat), { y, z: ap }));
    T.add(place(box(0.1, 1.1, 0.45, winMat), { x: ap, y: y + 1.5 }));
    T.add(place(box(0.45, 1.1, 0.1, winMat), { y: y + 1.5, z: -ap }));
  }
  T.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.navy }), { y: 0, z: ap + 0.55 }));

  // equipment floor: flared collar + ribbon windows
  let y = shaftH;
  T.add(place(cylinder(2.7, shaftR, 1.6, concrete, 8), { y, ry: OCT }));
  y += 1.6;
  T.add(place(facadeCylinder({ radius: 2.7, h: 2.2, floorHeight: 2.2, segments: 8, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 1.5, lit: 0.3, seed: 4, roof: PALETTE.concreteDark }), { y, ry: OCT }));
  y += 2.2;

  // catwalk slab + railing
  T.add(place(cylinder(3.6, 3.3, 0.35, concreteBand, 8), { y, ry: OCT }));
  y += 0.35;
  T.add(place(railing(3.5, 1.0, mat(PALETTE.red)), { y }));

  // control cab: white sill then outward-flared green glass, mullions at the corners
  const cabR0 = 2.9, cabR1 = 3.35, sillH = 0.7, glassH = 2.6;
  T.add(place(cylinder(cabR0 + 0.03, cabR0, sillH, concrete, 8), { y, ry: OCT }));
  const cabGlass = glass(PALETTE.glassTeal);
  T.add(place(cylinder(cabR1, cabR0 + 0.03, glassH, cabGlass, 8), { y: y + sillH, ry: OCT }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const [s, c] = [Math.sin(a), Math.cos(a)];
    T.add(beam([s * (cabR0 + 0.05), y + sillH, c * (cabR0 + 0.05)], [s * (cabR1 + 0.05), y + sillH + glassH, c * (cabR1 + 0.05)], 0.14, darkTrim));
  }
  // lit console band glimpsed through the glass
  T.add(place(cylinder(cabR0 + 0.08, cabR0 + 0.06, 0.12, emissive('#9be7c9', 0.6), 8), { y: y + sillH + 0.05, ry: OCT }));
  y += sillH + glassH;

  // overhanging cab roof
  T.add(place(cylinder(3.7, 3.45, 0.45, darkTrim, 8), { y, ry: OCT }));
  y += 0.45;
  T.add(place(cylinder(1.6, 1.8, 0.9, concrete, 8), { y, ry: OCT }));
  T.add(place(railing(1.75, 0.5, steel), { y: y + 0.9 }));

  // roof kit: radar dish, antennas, beacon
  const roofY = y + 0.9;
  T.add(place(radarDish({ R: 2.9, spread: 0.6 }), { y: roofY }));
  T.add(place(antenna({ h: 5.5, radius: 0.1 }), { x: 2.6, y, z: -1.4 }));
  T.add(place(antenna({ h: 4.0, radius: 0.08 }), { x: -2.7, y, z: -1.1 }));
  T.add(place(antenna({ h: 3.0, radius: 0.07, light: false }), { x: -1.4, y, z: 2.7 }));
  T.add(beam([2.6, y + 3.8, -1.4], [2.0, y + 3.8, -1.4], 0.06, steel));
  T.add(beam([2.6, y + 3.0, -1.4], [2.1, y + 3.0, -1.4], 0.06, steel));
  T.add(place(sphere(0.22, emissive(PALETTE.red, 1.2), 8), { x: 0, y: roofY - 0.2, z: -1.4 }));
  g.add(place(T, { x: tx, y: y0, z: tz }));

  // props: windsock, parked cars, lamp, bench, trees, wire fence
  g.add(place(windsock(4.2), { x: 4.3, y: y0, z: 4.3, ry: 160 }));
  g.add(place(car({ color: PALETTE.yellow, kind: 'van' }), { x: -4.5 + 0.0, y: y0 + 0.05, z: 3.4, ry: 90, s: 0.6 }));
  g.add(place(car({ color: PALETTE.blue }), { x: -2.5, y: y0 + 0.05, z: 3.4, ry: 90, s: 0.6 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -0.4, y: y0, z: 1.7 }));
  g.add(place(bench({ w: 1.2 }), { x: 3.4, y: y0, z: 0.9, ry: -90 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 12 }), { x: 4.0, y: y0, z: -4.0 }));
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 13 }), { x: 4.1, y: y0, z: -2.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 14 }), { x: -4.4, y: y0, z: 1.1 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 15 }), { x: 2.6, y: y0, z: 1.3 }));
  g.add(place(fence({ w: TILE - 0.4, d: TILE - 0.4, h: 1.2, style: 'wire', sides: ['back', 'left', 'right'] }), { y: y0 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, place, group, gableRoof, cylinder, cone, pipe, door, sign,
  tree, car, fence, surface, mat, metal, emissive,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Two long, low white broiler sheds run along X. Tunnel fans sit on the
// west gables, evaporative cool pads at the east end, and galvanised feed
// silos feed each shed through augers into the east gable.

const SHED_L = 13.0;
const SHED_W = 3.2;
const SHED_H = 2.2;
const SHED_X = -2.2; // centre; spans -8.7 .. 4.3

const whiteWall = () => mat(PALETTE.white, { roughness: 0.8 });
const roofMat = () => surface('corrugated', '#b9c0c6', { size: 0.8, roughness: 0.6, metalness: 0.2 });

/** Exhaust fan in a square housing, facing +Z. */
function fan(size = 1.05) {
  const housing = mat(PALETTE.lightGrey, { roughness: 0.6 });
  const dark = mat('#26292c');
  const grill = metal(PALETTE.steel);
  const g = group(place(box(size, size, 0.32, housing), { y: -size / 2 }));
  const disc = cylinder(size * 0.42, size * 0.42, 0.05, dark, 16);
  disc.rotation.x = Math.PI / 2;
  disc.position.set(0, 0, 0.17);
  g.add(disc);
  // grille cross + hub
  g.add(place(box(size * 0.86, 0.06, 0.04, grill), { y: -0.03, z: 0.21 }));
  g.add(place(box(0.06, size * 0.86, 0.04, grill), { y: -size * 0.43, z: 0.21 }));
  const hub = cone(0.12, 0.12, grill, 8);
  hub.rotation.x = Math.PI / 2;
  hub.position.z = 0.2;
  g.add(hub);
  // rain hood above
  g.add(place(box(size + 0.12, 0.06, 0.5, housing), { y: size / 2 + 0.02, z: 0.1 }));
  return g;
}

/** One long low shed, ridge along X, centred on its base. */
function shed() {
  const g = new THREE.Group();
  const L = SHED_L, W = SHED_W, H = SHED_H;
  const wall = whiteWall();
  // concrete kick wall + white body
  g.add(box(L + 0.12, 0.35, W + 0.12, mat(PALETTE.concrete)));
  g.add(box(L, H, W, wall));
  g.add(place(gableRoof({ w: L, d: W, h: 0.9, overhang: 0.25, ridge: 'x', material: roofMat(), gableMaterial: wall }), { y: H }));
  // continuous ridge vent
  const capM = metal(PALETTE.steel, { roughness: 0.5 });
  g.add(place(box(L - 1.2, 0.22, 0.5, capM), { y: H + 0.84 }));
  g.add(place(box(L - 1.0, 0.06, 0.7, capM), { y: H + 1.06 }));
  // roof exhaust chimneys
  for (let i = 0; i < 4; i++) {
    const x = -L / 2 + 2.2 + i * 3.1;
    g.add(place(cylinder(0.2, 0.2, 0.55, capM, 10), { x, y: H + 0.85, z: 0.9 * (i % 2 ? 1 : -1) * 0.6 }));
    g.add(place(cone(0.3, 0.2, capM, 10), { x, y: H + 1.4, z: 0.9 * (i % 2 ? 1 : -1) * 0.6 }));
  }
  // side walls: row of air inlets under the eaves, cool pads at the east end
  const inletM = mat(PALETTE.darkGrey);
  const padM = mat('#b98a4e', { roughness: 0.95 });
  const padFrame = mat(PALETTE.steelLight);
  for (const sz of [1, -1]) {
    const zf = sz * (W / 2 + 0.03);
    for (let x = -L / 2 + 1.0; x < L / 2 - 4.2; x += 1.2) {
      g.add(place(box(0.55, 0.25, 0.06, inletM), { x, y: H - 0.45, z: zf }));
    }
    g.add(place(box(3.4, 1.25, 0.12, padFrame), { x: L / 2 - 2.2, y: 0.55, z: sz * (W / 2 + 0.06) }));
    g.add(place(box(3.2, 1.05, 0.14, padM), { x: L / 2 - 2.2, y: 0.65, z: sz * (W / 2 + 0.07) }));
    // drip gutter over the pad
    g.add(place(box(3.5, 0.1, 0.25, padFrame), { x: L / 2 - 2.2, y: 1.85, z: sz * (W / 2 + 0.12) }));
  }
  // personnel door in the front wall near the east end
  g.add(place(door({ w: 0.9, h: 1.9, color: PALETTE.steelLight }), { x: L / 2 - 0.6, y: 0.1, z: W / 2 }));
  // tunnel fans on the west gable (facing -X)
  const fans = new THREE.Group();
  for (const z of [-0.8, 0.8]) fans.add(place(fan(1.05), { x: z, y: 1.15 }));
  fans.add(place(fan(0.7), { y: H + 0.35 }));
  g.add(place(fans, { x: -L / 2, ry: -90 }));
  // small control-room door + light on the east gable
  g.add(place(door({ w: 0.8, h: 1.8, color: PALETTE.green }), { x: L / 2, y: 0.1, z: -0.8, ry: 90 }));
  g.add(place(box(0.2, 0.15, 0.25, emissive(PALETTE.windowLit, 0.6)), { x: L / 2 + 0.1, y: 2.0, z: -0.8 }));
  return g;
}

/** Galvanised feed silo on legs with a hopper bottom, conical cap and ladder. */
function feedSilo(r = 0.75, bodyH = 3.6) {
  const g = new THREE.Group();
  const body = surface('corrugated', PALETTE.steelLight, { size: 0.6, metalness: 0.4, roughness: 0.45 });
  const steel = metal(PALETTE.steel, { roughness: 0.4 });
  const legH = 1.1, hopH = 0.9;
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    g.add(place(box(0.1, legH + hopH * 0.6, 0.1, metal(PALETTE.steelDark)), { x: Math.cos(a) * r * 0.85, z: Math.sin(a) * r * 0.85 }));
  }
  g.add(place(cylinder(r, 0.14, hopH, steel, 16), { y: legH }));
  g.add(place(cylinder(r, r, bodyH, body, 16), { y: legH + hopH }));
  g.add(place(cylinder(r + 0.03, r + 0.03, 0.08, steel, 16), { y: legH + hopH + bodyH * 0.5 }));
  g.add(place(cone(r * 1.04, r * 0.7, steel, 16), { y: legH + hopH + bodyH }));
  g.add(place(cylinder(0.18, 0.18, 0.15, steel, 8), { y: legH + hopH + bodyH + r * 0.65 }));
  // boot under the hopper
  g.add(place(box(0.3, 0.3, 0.3, metal(PALETTE.steelDark)), { y: legH - 0.35 }));
  // ladder on the outer side (+X)
  const lad = metal(PALETTE.steelDark);
  const top = legH + hopH + bodyH;
  for (const dz of [-0.17, 0.17]) g.add(place(box(0.05, top - 0.3, 0.05, lad), { x: r + 0.12, y: 0.3, z: dz }));
  for (let y = 0.6; y < top; y += 0.45) g.add(place(box(0.05, 0.04, 0.34, lad), { x: r + 0.12, y, z: 0 }));
  return g;
}

/** Bulk feed lorry, length along X (cab at +X). */
function feedTruck() {
  const g = new THREE.Group();
  const cabM = mat(PALETTE.red, { roughness: 0.45 });
  const tankM = metal(PALETTE.aluminium, { roughness: 0.35 });
  const dark = mat(PALETTE.darkGrey);
  g.add(place(box(7.6, 0.3, 1.9, dark), { y: 0.55 }));
  g.add(place(box(1.7, 2.0, 2.1, cabM), { x: 3.0, y: 0.6 }));
  g.add(place(box(0.05, 0.75, 1.8, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 3.87, y: 1.65 }));
  g.add(place(box(0.05, 0.25, 1.9, dark), { x: 3.87, y: 0.75 }));
  // compartment tank: rounded sides via an octagonal prism along X
  const tank = cylinder(1.05, 1.05, 5.4, tankM, 8);
  tank.rotation.z = Math.PI / 2;
  tank.rotation.x = Math.PI / 8;
  tank.position.set(-0.75, 1.95, 0);
  g.add(tank);
  for (const x of [-2.8, -1.1, 0.6]) g.add(place(cylinder(0.28, 0.28, 0.18, tankM, 10), { x, y: 2.95 }));
  g.add(place(box(5.2, 0.06, 0.5, metal(PALETTE.steelDark)), { x: -1.1, y: 3.05, z: 0.2 }));
  // unloading auger boom folded along the side
  g.add(pipe([-3.5, 1.35, 1.12], [1.9, 1.35, 1.12], 0.14, metal(PALETTE.steelLight)));
  g.add(pipe([1.9, 1.35, 1.12], [1.9, 2.6, 0.6], 0.14, metal(PALETTE.steelLight)));
  const wheelM = mat(PALETTE.black);
  for (const x of [3.0, -1.6, -2.9]) for (const sz of [-1, 1]) {
    const w = cylinder(0.45, 0.45, 0.3, wheelM, 10);
    w.rotation.x = Math.PI / 2;
    w.position.set(x, 0.45, sz * 0.85);
    g.add(w);
  }
  return g;
}

/** Horizontal propane tank on two saddles, length along X. */
function propaneTank(len = 2.4, r = 0.5) {
  const m = mat(PALETTE.white, { roughness: 0.35, metalness: 0.1 });
  const g = new THREE.Group();
  const body = cylinder(r, r, len, m, 14);
  body.rotation.z = Math.PI / 2;
  body.position.set(len / 2, 0.3 + r, 0);
  g.add(body);
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.SphereGeometry(r, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), m);
    cap.rotation.z = -sx * Math.PI / 2;
    cap.position.set(sx * len / 2, 0.3 + r, 0);
    g.add(cap);
  }
  for (const sx of [-0.6, 0.6]) g.add(place(box(0.25, 0.45, r * 1.6, mat(PALETTE.concrete)), { x: sx * len / 2 }));
  g.add(place(cylinder(0.12, 0.12, 0.2, metal(PALETTE.steel), 8), { y: 0.3 + 2 * r }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // gravel farm road along the front, concrete apron at the silo end
  g.add(place(patch(TILE * 2, 1.7, 'gravel'), { y: y0, z: 3.75 }));
  g.add(place(patch(5.4, 7.6, 'concrete'), { x: 7.25, y: y0, z: -0.8 }));
  g.add(place(patch(SHED_L + 0.6, 0.9, 'gravel'), { x: SHED_X, y: y0, z: -0.7 }));

  // the two sheds
  const shedZ = [-2.7, 1.3];
  shedZ.forEach((z) => g.add(place(shed(), { x: SHED_X, y: y0, z })));

  // feed silos (two per shed) with augers into the east gables
  const siloX = 6.15;
  const augerM = metal(PALETTE.steelLight, { roughness: 0.4 });
  shedZ.forEach((z) => {
    for (const dz of [-0.85, 0.85]) {
      g.add(place(feedSilo(0.72, 3.4), { x: siloX, y: y0, z: z + dz }));
      g.add(pipe([siloX, y0 + 0.85, z + dz], [SHED_X + SHED_L / 2 + 0.05, y0 + 1.85, z + dz * 0.4], 0.11, augerM));
    }
  });

  // farm office / egg room with a red gable roof
  const ox = 8.75, oz = -3.3;
  g.add(place(box(2.3, 2.5, 2.6, whiteWall()), { x: ox, y: y0, z: oz }));
  g.add(place(gableRoof({ w: 2.3, d: 2.6, h: 0.9, overhang: 0.2, ridge: 'z', material: surface('corrugated', PALETTE.roofRed, { size: 0.6 }), gableMaterial: whiteWall() }), { x: ox, y: y0 + 2.5, z: oz }));
  g.add(place(door({ w: 0.85, h: 1.9, color: PALETTE.woodDark }), { x: ox - 0.4, y: y0, z: oz + 1.3 }));
  g.add(place(box(0.7, 0.7, 0.06, mat(PALETTE.window)), { x: ox + 0.6, y: y0 + 1.1, z: oz + 1.31 }));
  g.add(place(box(0.06, 0.7, 0.9, mat(PALETTE.window)), { x: ox + 1.16, y: y0 + 1.1, z: oz }));

  // propane tank
  g.add(place(propaneTank(2.2, 0.5), { x: 8.6, y: y0, z: -0.45 }));

  // feed lorry on the road, pickup by the office
  g.add(place(feedTruck(), { x: -4.6, y: y0 + 0.05, z: 3.75, s: 0.72 }));
  g.add(place(car({ color: PALETTE.blue, kind: 'van' }), { x: 8.75, y: y0 + 0.05, z: 2.0, ry: -90, s: 0.62 }));

  // entrance sign on the front verge
  for (const x of [6.4, 7.9]) g.add(place(box(0.12, 1.1, 0.12, mat(PALETTE.woodDark)), { x, y: y0, z: 4.75 }));
  g.add(place(sign({ text: 'POULTRY FARM', w: 2.0, h: 0.6, bg: PALETTE.green, fg: '#ffffff', depth: 0.1 }), { x: 7.15, y: y0 + 0.9, z: 4.75 }));

  // wire perimeter fence along back and west side, poplar windbreak and bushes
  g.add(place(fence({ w: TILE * 2 - 0.4, d: TILE - 0.4, h: 1.0, style: 'wire', sides: ['back', 'left'] }), { y: y0 }));
  for (const [x, z, s] of [[-9.3, -4.3, 1], [-9.3, -0.7, 2], [-9.3, 4.2, 3]]) {
    g.add(place(tree({ kind: 'poplar', h: 4.2, seed: s }), { x, y: y0, z }));
  }
  for (const [x, s] of [[-6.5, 4], [-3.2, 5], [0.4, 6], [3.3, 7]]) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z: -4.68 }));
  }
  for (const [x, s] of [[-8.8, 8], [9.4, 9], [4.2, 10]]) {
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: s }), { x, y: y0, z: 4.68 }));
  }
  return g;
}

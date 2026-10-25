import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, cylinder, cone, sphere, taperedBlock, place, group,
  surface, mat, metal, emissive, water, pipe, pipeRun, stairs, fence, tree, bench,
} from '../../src/lib/index.js';
import {
  wallPanel, archGlazing, roundGlazing, archDressing, slateRoof, gableCoping, plaque, noShadow,
} from './victorian.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Victorian engine house (left) with the beam engine visible through its tall
// arched windows, a boiler house (right) and a campanile-style chimney behind.

const BRICK = surface('brick', PALETTE.brick, { size: 1.6 });
const BRICK_DARK = surface('brick', PALETTE.brickDark, { size: 1.6 });
const STONE = mat(PALETTE.cream);
const STONE_DARK = mat(PALETTE.sandstone);
const SLATE = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
const IRON = metal('#2c4a3a', { roughness: 0.5 });
const ENGINE_GREEN = mat('#2f7a4c', { roughness: 0.45, metalness: 0.2 });
const ENGINE_RED = mat('#b8322a', { roughness: 0.45, metalness: 0.2 });
const BRASS = metal('#d6a843', { roughness: 0.3 });

// engine house
const EX = -1.5, EZ = -0.5, EW = 5.4, ED = 5.0, EH = 7.2, GABLE = 2.4, T = 0.35, PLINTH = 0.8;

function engineHouse(y0) {
  const g = new THREE.Group();
  const front = [
    { cx: -1.6, y0: 1.4, w: 0.9, spring: 5.4 },
    { cx: 0, y0: PLINTH, w: 1.3, spring: 5.2 },
    { cx: 1.6, y0: 1.4, w: 0.9, spring: 5.4 },
  ];
  const back = front.map((a) => ({ ...a, y0: 1.4 }));
  const side = [{ cx: -1.2, y0: 1.4, w: 1.25, spring: 5.2 }, { cx: 1.2, y0: 1.4, w: 1.25, spring: 5.2 }];
  const oculus = { cx: 0, cy: EH + 0.95, r: 0.55 };
  const fanlight = { ...front[1], y0: 3.55 };

  // plinth: stone outside, tiled engine-room floor on top
  g.add(place(boxFaces(EW + 0.3, PLINTH, ED + 0.3, { sides: STONE_DARK, top: surface('paving', '#b9a98c', { size: 1.2 }) }), { x: EX, y: y0, z: EZ }));

  // walls: front/back gables, left/right sides
  const walls = [
    { arches: front, glaze: [front[0], front[2], fanlight], gable: true, at: { x: EX, z: EZ + ED / 2, ry: 0 } },
    { arches: back, glaze: back, gable: true, at: { x: EX, z: EZ - ED / 2, ry: 180 } },
    { arches: side, glaze: side, at: { x: EX - EW / 2, z: EZ, ry: -90 } },
    { arches: [side[0]], glaze: [side[0]], at: { x: EX + EW / 2, z: EZ, ry: 90 } },
  ];
  for (const wd of walls) {
    const L = wd.gable ? EW : ED - 2 * T;
    const wg = new THREE.Group();
    wg.add(wallPanel({ L, H: EH, gable: wd.gable ? GABLE : 0, t: T, arches: wd.arches, circles: wd.gable ? [oculus] : [], material: BRICK, lining: mat('#7d6b55') }));
    for (const a of wd.arches) wg.add(archDressing(a, { stone: STONE, sill: a.y0 > PLINTH }));
    for (const a of wd.glaze) wg.add(archGlazing(a));
    if (wd.gable) {
      wg.add(roundGlazing(oculus));
      // stone ring round the oculus
      const ring = new THREE.Mesh(new THREE.TorusGeometry(oculus.r + 0.08, 0.1, 4, 20), STONE);
      wg.add(place(ring, { y: oculus.cy, z: 0.03 }));
      wg.add(...gableCoping({ hw: EW / 2, H: EH, apex: EH + GABLE, z: -T / 2, stone: STONE, t: 0.3 }));
      // horizontal pediment cornice + kneelers + apex finial
      wg.add(place(box(EW + 0.3, 0.24, 0.3, STONE), { y: EH - 0.24, z: 0.05 }));
      for (const sx of [-1, 1]) wg.add(place(box(0.5, 0.45, T + 0.2, STONE), { x: sx * (EW / 2 - 0.1), y: EH - 0.05, z: -T / 2 }));
      wg.add(place(box(0.35, 0.35, 0.35, STONE), { y: EH + GABLE + 0.1, z: -T / 2 }));
      wg.add(place(sphere(0.2, STONE, 10), { y: EH + GABLE + 0.42, z: -T / 2 }));
      // date stone
      wg.add(place(plaque({ text: '1884', w: 0.8, h: 0.32, d: 0.08, bg: PALETTE.cream, fg: PALETTE.brickDark }), { y: EH + 1.62, z: 0.02 }));
    }
    // corner pilasters (front/back walls only, so they wrap the corners)
    if (wd.gable) {
      for (const sx of [-1, 1]) {
        wg.add(place(box(0.5, EH - PLINTH, 0.5, BRICK_DARK), { x: sx * (EW / 2 - 0.2), y: PLINTH, z: -0.2 }));
        wg.add(place(box(0.6, 0.2, 0.6, STONE), { x: sx * (EW / 2 - 0.2), y: EH - 0.75, z: -0.2 }));
      }
    } else {
      // centre pilaster between the side windows
      if (wd.arches.length > 1) {
        wg.add(place(box(0.45, EH - PLINTH - 0.5, 0.12, BRICK_DARK), { y: PLINTH, z: 0.06 }));
        wg.add(place(box(0.55, 0.18, 0.18, STONE), { y: EH - 0.68, z: 0.06 }));
      }
      // eaves cornice with a corbel table
      wg.add(place(box(ED + 0.3, 0.26, 0.5, STONE), { y: EH - 0.26, z: 0.05 }));
      for (let i = 0; i < 12; i++) wg.add(place(box(0.16, 0.22, 0.2, STONE), { x: -2.2 + i * 0.4, y: EH - 0.48, z: 0.05 }));
    }
    // sill-level stone band across the wall
    wg.add(place(box(L + 0.04, 0.12, 0.08, STONE), { y: 1.14, z: 0.02 }));
    g.add(place(wg, { ...wd.at, y: y0 }));
  }

  // main entrance: panelled double doors + transom under the fanlight
  const fz = EZ + ED / 2 - 0.12;
  g.add(place(box(1.3, 2.75, 0.08, mat('#2d5a3d')), { x: EX, y: y0 + PLINTH, z: fz }));
  g.add(place(box(0.05, 2.6, 0.1, mat('#1f3f2b')), { x: EX, y: y0 + PLINTH, z: fz + 0.02 }));
  for (const sx of [-0.33, 0.33]) for (const py of [0.3, 1.5]) {
    g.add(place(box(0.42, 0.9, 0.1, mat('#3a6e4c')), { x: EX + sx, y: y0 + PLINTH + py, z: fz + 0.02 }));
  }
  g.add(place(box(1.4, 0.2, 0.3, STONE), { x: EX, y: y0 + 3.55, z: fz - 0.05 }));
  // big sign on the frieze above the arches
  g.add(place(plaque({ text: 'PUMPING STATION', w: 4.2, h: 0.55, d: 0.1, bg: PALETTE.cream, fg: '#5a2a1c', border: '#5a2a1c' }), { x: EX, y: y0 + 6.3, z: EZ + ED / 2 + 0.02 }));
  // entrance steps
  g.add(place(stairs({ w: 2.0, h: PLINTH, d: 1.2, steps: 4, material: STONE_DARK }), { x: EX, y: y0, z: EZ + ED / 2 + 0.75 }));

  // roof: slate with ridge cap, louvred ventilator lantern and iron cresting
  const ry = y0 + EH;
  const rh = GABLE - 0.25;
  g.add(place(slateRoof({ w: EW, d: ED - 0.2, h: rh, overhang: 0.45, material: SLATE }), { x: EX, y: ry, z: EZ }));
  g.add(place(box(0.25, 0.18, ED - 0.3, mat(PALETTE.roofBlack)), { x: EX, y: ry + rh - 0.08, z: EZ }));
  const lantern = new THREE.Group();
  lantern.add(box(1.0, 0.9, 1.8, BRICK));
  for (const sx of [-1, 1]) for (let i = 0; i < 4; i++) {
    lantern.add(place(box(0.04, 0.1, 1.5, mat(PALETTE.woodDark)), { x: sx * 0.51, y: 0.2 + i * 0.17 }));
  }
  lantern.add(place(slateRoof({ w: 1.0, d: 1.9, h: 0.45, overhang: 0.18, material: SLATE }), { y: 0.9 }));
  lantern.add(place(cylinder(0.025, 0.025, 1.0, IRON, 4), { y: 1.3 }));
  lantern.add(place(box(0.5, 0.04, 0.04, IRON), { y: 2.0 }));
  lantern.add(place(box(0.04, 0.04, 0.5, IRON), { y: 1.95 }));
  g.add(place(lantern, { x: EX, y: ry + rh - 0.4, z: EZ }));
  for (let i = 0; i < 9; i++) {
    const z = EZ - ED / 2 + 0.4 + i * 0.53;
    if (Math.abs(z - EZ) < 1.0) continue;
    g.add(place(cone(0.07, 0.35, IRON, 4), { x: EX, y: ry + rh + 0.08, z }));
  }

  g.add(place(beamEngine(), { x: EX, y: y0 + PLINTH, z: EZ + 0.4 }));
  return g;
}

// The beam engine: cast-iron columns carry an entablature, the rocking beam
// links the steam cylinder (left) to the flywheel crank (right).
function beamEngine() {
  const g = new THREE.Group();
  const colH = 2.5;
  for (const x of [-1.0, 1.0]) for (const z of [-1.0, 1.0]) {
    g.add(place(box(0.38, 0.3, 0.38, STONE), { x, z }));
    g.add(place(cylinder(0.09, 0.12, colH - 0.55, ENGINE_GREEN, 8), { x, y: 0.3, z }));
    g.add(place(taperedBlock({ w: 0.2, d: 0.2, h: 0.25, topW: 0.42, topD: 0.42, material: BRASS }), { x, y: colH - 0.25, z }));
  }
  const top = colH;
  for (const z of [-1.0, 1.0]) g.add(place(box(2.5, 0.3, 0.22, ENGINE_GREEN), { y: top, z }));
  for (const x of [-1.0, 0, 1.0]) g.add(place(box(0.22, 0.3, 2.24, ENGINE_GREEN), { x, y: top }));
  // pivot plummer blocks
  for (const z of [-0.24, 0.24]) g.add(place(taperedBlock({ w: 0.5, d: 0.12, h: 0.55, topW: 0.22, topD: 0.12, material: ENGINE_RED }), { y: top + 0.3, z }));
  const pivotY = top + 0.85;
  const tilt = THREE.MathUtils.degToRad(6);

  // the beam: lozenge-shaped, deepest at the pivot
  const half = 1.95;
  const s = new THREE.Shape();
  s.moveTo(-half, -0.12); s.lineTo(0, -0.38); s.lineTo(half, -0.12);
  s.lineTo(half, 0.12); s.lineTo(0, 0.38); s.lineTo(-half, 0.12); s.lineTo(-half, -0.12);
  const bg = new THREE.ExtrudeGeometry(s, { depth: 0.26, bevelEnabled: false });
  bg.translate(0, 0, -0.13);
  g.add(place(new THREE.Mesh(bg, ENGINE_RED), { y: pivotY, rz: 6 }));
  // gold lining stripe + pivot boss
  g.add(place(box(half * 1.9, 0.05, 0.28, BRASS), { y: pivotY - 0.025, rz: 6 }));
  const boss = new THREE.CylinderGeometry(0.16, 0.16, 0.6, 12).rotateX(Math.PI / 2);
  g.add(place(new THREE.Mesh(boss, BRASS), { y: pivotY }));

  const endL = [-1.75 * Math.cos(tilt), pivotY - 1.75 * Math.sin(tilt)];
  const endR = [1.75 * Math.cos(tilt), pivotY + 1.75 * Math.sin(tilt)];

  // steam cylinder (left) on a stone bed, with piston rod and parallel-motion links
  const cx = endL[0];
  g.add(place(box(1.2, 0.3, 1.2, STONE_DARK), { x: cx }));
  g.add(place(cylinder(0.5, 0.5, 1.8, ENGINE_GREEN, 16), { x: cx, y: 0.3 }));
  g.add(place(cylinder(0.56, 0.56, 0.12, BRASS, 16), { x: cx, y: 2.1 }));
  g.add(place(cylinder(0.56, 0.56, 0.12, BRASS, 16), { x: cx, y: 0.3 }));
  g.add(pipe([cx, 2.2, 0], [cx, endL[1], 0], 0.05, metal(PALETTE.chrome, { roughness: 0.2 })));
  g.add(pipe([cx, endL[1] + 0.05, 0.18], [cx + 0.6, endL[1] + 0.12, 0.18], 0.04, BRASS));
  g.add(pipe([cx, endL[1] + 0.05, -0.18], [cx + 0.6, endL[1] + 0.12, -0.18], 0.04, BRASS));
  // steam pipe from the cylinder to the boiler house wall
  g.add(pipeRun([[cx - 0.3, 2.0, -0.3], [cx - 0.3, 2.6, -0.3], [cx - 0.3, 2.6, -1.8], [2.4, 2.6, -1.8]], 0.12, ENGINE_GREEN));

  // flywheel (right, behind the beam) on its crankshaft
  const fx = 1.15, fy = 1.2, fz = -1.3, fr = 1.12;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(fr, 0.11, 6, 28), ENGINE_RED);
  g.add(place(rim, { x: fx, y: fy, z: fz }));
  for (let i = 0; i < 4; i++) g.add(place(box(fr * 2, 0.08, 0.08, ENGINE_RED), { x: fx, y: fy - 0.04, z: fz, rz: i * 45 + 22.5 }));
  const hub = new THREE.CylinderGeometry(0.2, 0.2, 0.3, 12).rotateX(Math.PI / 2);
  g.add(place(new THREE.Mesh(hub, BRASS), { x: fx, y: fy, z: fz }));
  g.add(pipe([fx, fy, fz - 0.4], [fx, fy, 0.1], 0.08, metal(PALETTE.steelDark)));
  g.add(place(box(0.5, fy - 0.1, 0.5, STONE_DARK), { x: fx, z: fz - 0.6 }));
  // crank + connecting rod up to the beam end
  const pin = [fx + 0.45, fy + 0.25, 0.05];
  g.add(pipe([fx, fy, 0.05], pin, 0.07, ENGINE_RED));
  g.add(pipe(pin, [endR[0], endR[1], 0], 0.08, metal(PALETTE.chrome, { roughness: 0.2 })));
  // pump rods dropping into the well
  g.add(pipe([0.85, pivotY + 0.85 * Math.sin(tilt), 0.16], [0.85, 0.05, 0.16], 0.05, metal(PALETTE.steelDark)));
  g.add(place(box(0.7, 0.06, 0.7, mat(PALETTE.black)), { x: 0.85, z: 0.16 }));
  return g;
}

// boiler house
const BX = 2.8, BZ = -1.65, BW = 3.2, BD = 2.7, BH = 4.0, BT = 0.3;

function boilerHouse(y0) {
  const g = new THREE.Group();
  g.add(place(boxFaces(BW, 0.3, BD + 0.2, { sides: STONE_DARK, top: mat(PALETTE.concreteDark) }), { x: BX, y: y0, z: BZ }));
  const door = { cx: -0.55, y0: 0.3, w: 1.1, spring: 2.0 };
  const win = { cx: 0.85, y0: 1.2, w: 0.8, spring: 2.7 };
  const fw = new THREE.Group();
  fw.add(wallPanel({ L: BW, H: BH, t: BT, arches: [door, win], material: BRICK }));
  fw.add(archDressing(door, { stone: STONE, sill: false }));
  fw.add(archDressing(win, { stone: STONE }));
  fw.add(archGlazing(win, -0.15));
  fw.add(place(box(1.1, 2.0, 0.08, mat('#2d5a3d')), { x: door.cx, y: door.y0, z: -0.14 }));
  fw.add(place(box(0.05, 1.9, 0.1, mat('#1f3f2b')), { x: door.cx, y: door.y0, z: -0.12 }));
  fw.add(place(box(BW + 0.1, 0.22, 0.32, STONE), { y: BH - 0.22, z: 0.05 }));
  fw.add(place(box(BW, 0.1, 0.06, STONE), { y: 1.0, z: 0.02 }));
  g.add(place(fw, { x: BX, y: y0, z: BZ + BD / 2 }));
  // back wall (behind the chimney) and right-hand gable
  g.add(place(wallPanel({ L: BW, H: BH, t: BT, material: BRICK }), { x: BX, y: y0, z: BZ - BD / 2, ry: 180 }));
  const gw = new THREE.Group();
  const gwin = { cx: 0, y0: 1.2, w: 0.8, spring: 2.7 };
  gw.add(wallPanel({ L: BD - 2 * BT, H: BH, gable: 1.3, t: BT, arches: [gwin], material: BRICK }));
  gw.add(archDressing(gwin, { stone: STONE }));
  gw.add(archGlazing(gwin, -0.15));
  gw.add(...gableCoping({ hw: BD / 2, H: BH, apex: BH + 1.3, z: -BT / 2, stone: STONE, t: 0.22 }));
  g.add(place(gw, { x: BX + BW / 2, y: y0, z: BZ, ry: 90 }));
  // roof, ridge along x, abutting the engine house wall
  g.add(place(slateRoof({ w: BD, d: BW + 0.1, h: 1.15, overhang: 0.35, material: SLATE }), { x: BX - 0.15, y: y0 + BH, z: BZ, ry: 90 }));
  // Lancashire boiler inside, on a brick setting
  g.add(place(box(2.5, 0.6, 1.7, BRICK_DARK), { x: BX, y: y0 + 0.3, z: BZ }));
  const boiler = new THREE.CylinderGeometry(0.72, 0.72, 2.5, 16).rotateZ(Math.PI / 2);
  g.add(place(new THREE.Mesh(boiler, metal(PALETTE.steelDark, { roughness: 0.5 })), { x: BX, y: y0 + 1.5, z: BZ }));
  g.add(place(cylinder(0.12, 0.12, 0.8, BRASS, 8), { x: BX + 0.5, y: y0 + 2.1, z: BZ }));
  return g;
}

// Italianate (campanile) chimney
const CX = 3.4, CZ = -3.95;

function chimneyStack(y0) {
  const g = new THREE.Group();
  g.add(place(box(1.9, 0.4, 1.9, STONE_DARK), { y: 0 }));
  g.add(place(box(1.7, 2.6, 1.7, BRICK), { y: 0.4 }));
  // blind arched panels on the pedestal
  for (const ry of [0, 90, 180, 270]) {
    const p = new THREE.Group();
    const a = { cx: 0, y0: 0.7, w: 0.8, spring: 2.1 };
    p.add(archDressing(a, { stone: STONE, sill: false }));
    p.add(place(box(0.8, 1.4, 0.03, BRICK_DARK), { y: 0.7 }));
    p.add(place(cylinder(0.4, 0.4, 0.03, BRICK_DARK, 12), { y: 2.1, rx: 90 }));
    g.add(place(p, { x: Math.sin((ry * Math.PI) / 180) * 0.85, z: Math.cos((ry * Math.PI) / 180) * 0.85, ry, y: 0.4 }));
  }
  g.add(place(box(1.95, 0.3, 1.95, STONE), { y: 3.0 }));
  g.add(place(taperedBlock({ w: 1.95, d: 1.95, h: 0.3, topW: 1.5, topD: 1.5, material: STONE }), { y: 3.3 }));
  // tapering shaft with cream bands
  let y = 3.6;
  const r0 = 1.45, r1 = 1.1, shaftH = 9.9;
  const wAt = (yy) => r0 + ((r1 - r0) * (yy - 3.6)) / shaftH;
  for (let i = 0; i < 3; i++) {
    const segH = 3.0;
    g.add(place(taperedBlock({ w: wAt(y), d: wAt(y), h: segH, topW: wAt(y + segH), topD: wAt(y + segH), material: BRICK }), { y }));
    y += segH;
    g.add(place(taperedBlock({ w: wAt(y) + 0.06, d: wAt(y) + 0.06, h: 0.3, topW: wAt(y + 0.3) + 0.06, topD: wAt(y + 0.3) + 0.06, material: STONE }), { y }));
    y += 0.3;
  }
  // corbelled flare, arcaded "belfry" stage, cornice and cap
  g.add(place(taperedBlock({ w: r1, d: r1, h: 0.7, topW: 1.6, topD: 1.6, material: BRICK_DARK }), { y }));
  y += 0.7;
  g.add(place(box(1.6, 0.15, 1.6, STONE), { y }));
  y += 0.15;
  g.add(place(box(1.5, 1.5, 1.5, BRICK), { y }));
  for (const ry of [0, 90, 180, 270]) {
    const p = new THREE.Group();
    for (const ax of [-0.35, 0.35]) {
      const a = { cx: ax, y0: 0.2, w: 0.38, spring: 1.0 };
      p.add(archDressing(a, { stone: STONE, ring: 0.09, proud: 0.04, sill: false }));
      p.add(place(box(0.38, 0.8, 0.03, mat(PALETTE.black)), { x: ax, y: 0.2 }));
      p.add(place(cylinder(0.19, 0.19, 0.03, mat(PALETTE.black), 10), { x: ax, y: 1.0, rx: 90 }));
    }
    g.add(place(p, { x: Math.sin((ry * Math.PI) / 180) * 0.75, z: Math.cos((ry * Math.PI) / 180) * 0.75, ry, y }));
  }
  y += 1.5;
  g.add(place(box(1.85, 0.25, 1.85, STONE), { y }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.2, 0.2, 0.2, STONE), { x: sx * 0.8, y: y - 0.2, z: sz * 0.8 }));
  y += 0.25;
  g.add(place(taperedBlock({ w: 1.7, d: 1.7, h: 0.35, topW: 1.35, topD: 1.35, material: BRICK_DARK, topMaterial: mat(PALETTE.black) }), { y }));
  y += 0.35;
  g.add(place(cylinder(0.02, 0.02, 1.4, metal(PALETTE.steelDark), 4), { x: 0.55, y, z: 0.55 }));
  // a lazy plume of smoke drifting over the yard
  const smoke = mat('#d8d8d4', { transparent: true, opacity: 0.82 });
  [[0, 0.6, 0, 0.45], [-0.5, 1.4, 0.3, 0.6], [-1.2, 2.1, 0.7, 0.75]].forEach(([dx, dy, dz, r]) => {
    g.add(place(noShadow(sphere(r, smoke, 10)), { x: dx, y: y + dy - r, z: dz }));
  });
  return place(g, { x: CX, y: y0, z: CZ });
}

function lampPost() {
  const post = mat('#24392d');
  return group(
    cylinder(0.12, 0.16, 0.3, post, 8),
    place(cylinder(0.05, 0.07, 2.4, post, 6), { y: 0.3 }),
    place(box(0.32, 0.4, 0.32, emissive(PALETTE.windowLit, 0.8)), { y: 2.7 }),
    place(cone(0.26, 0.25, post, 4), { y: 3.1, ry: 45 }),
  );
}

function coalCart() {
  const wood = mat(PALETTE.wood);
  const g = group(
    place(box(1.6, 0.6, 1.0, wood), { y: 0.55 }),
    place(box(1.5, 0.12, 0.9, mat('#232325')), { y: 1.12 }),
    place(sphere(0.38, mat('#232325'), 6), { y: 0.9, s: [1.6, 0.5, 1.0] }),
    place(box(1.4, 0.06, 0.06, mat(PALETTE.woodDark)), { x: 1.4, y: 0.6, z: 0.35 }),
    place(box(1.4, 0.06, 0.06, mat(PALETTE.woodDark)), { x: 1.4, y: 0.6, z: -0.35 }),
  );
  for (const sz of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12).rotateX(Math.PI / 2);
    g.add(place(new THREE.Mesh(wg, mat(PALETTE.woodDark)), { y: 0.5, z: sz * 0.56 }));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  g.add(engineHouse(y0));
  g.add(boilerHouse(y0));
  g.add(chimneyStack(y0));
  // flue from the boiler house into the chimney pedestal
  g.add(place(box(0.8, 1.4, 0.3, BRICK_DARK), { x: CX, y: y0, z: -3.0 }));

  // forecourt: cobbled path from the gate to the steps
  g.add(place(patch(1.8, 1.9, 'cobbles'), { x: EX, y: y0, z: 4.0 }));
  // coal yard (right) with bunker, heap and a horse-less coal cart
  g.add(place(patch(3.5, 5.0, surface('gravel', '#8d867a', { size: 3 })), { x: 3.05, y: y0, z: 2.45 }));
  for (const [w, d, x, z] of [[2.6, 0.25, 3.4, 0.25], [0.25, 2.0, 4.6, 1.25], [0.25, 2.0, 2.2, 1.25]]) {
    g.add(place(box(w, 0.7, d, BRICK_DARK), { x, y: y0, z }));
  }
  const coal = mat('#2a2a2d', { roughness: 0.6 });
  for (const [x, z, r, sy] of [[3.4, 1.2, 0.85, 0.6], [2.9, 1.5, 0.6, 0.55], [3.9, 1.45, 0.6, 0.5], [3.3, 1.75, 0.5, 0.45]]) {
    g.add(place(sphere(r, coal, 7), { x, y: y0 - r * sy * 0.25, z, s: [1, sy, 1] }));
  }
  g.add(place(coalCart(), { x: 2.6, y: y0, z: 3.6, ry: -20 }));
  for (const [x, z] of [[4.3, 3.0], [4.5, 3.6], [4.2, 3.5]]) g.add(place(sphere(0.25, mat(PALETTE.brickBrown), 6), { x, y: y0, z, s: [1, 1.2, 1] }));
  const pipeM = metal('#3a4048', { roughness: 0.6 });
  // ornamental pond with a little fountain (left of the path)
  const px = -3.65, pz = 3.4;
  g.add(place(box(2.3, 0.35, 2.0, STONE_DARK), { x: px, y: y0, z: pz }));
  g.add(place(box(1.9, 0.36, 1.6, water(PALETTE.water)), { x: px, y: y0 + 0.01, z: pz }));
  g.add(place(cylinder(0.12, 0.2, 0.6, STONE, 8), { x: px, y: y0 + 0.3, z: pz }));
  g.add(place(cylinder(0.35, 0.22, 0.12, STONE, 10), { x: px, y: y0 + 0.9, z: pz }));
  g.add(place(noShadow(cone(0.2, 0.5, mat('#cfeaf5', { transparent: true, opacity: 0.7 }), 8)), { x: px, y: y0 + 1.0, z: pz }));

  // Victorian lamps flanking the steps, a bench and a flower bed
  for (const sx of [-1, 1]) g.add(place(lampPost(), { x: EX + sx * 1.3, y: y0, z: 3.2 }));
  g.add(place(bench({ w: 1.4 }), { x: -3.65, y: y0, z: 2.0 }));
  g.add(place(box(1.2, 0.2, 1.3, mat(PALETTE.dirt)), { x: 0.3, y: y0, z: 4.1 }));
  for (const [x, z, c] of [[0.0, 3.8, PALETTE.red], [0.55, 4.25, PALETTE.yellow], [0.1, 4.5, PALETTE.pink], [0.55, 3.75, PALETTE.red]]) {
    g.add(place(sphere(0.22, mat(c), 6), { x, y: y0 + 0.15, z }));
  }

  // front boundary: low stone wall, iron railings, gate piers with ball finials
  const wallZ = 4.75;
  const runs = [[-4.85, EX - 0.9], [EX + 0.9, 1.25]];
  for (const [a, b] of runs) {
    const w = b - a, cx = (a + b) / 2;
    g.add(place(box(w, 0.4, 0.3, STONE_DARK), { x: cx, y: y0, z: wallZ }));
    g.add(place(fence({ w, d: 0.1, h: 0.8, style: 'railing', color: '#24392d', sides: ['front'] }), { x: cx, y: y0 + 0.4, z: wallZ - 0.05 }));
  }
  for (const x of [EX - 1.0, EX + 1.0, 1.35, 4.85]) {
    g.add(place(box(0.4, 1.4, 0.4, STONE), { x, y: y0, z: wallZ }));
    g.add(place(sphere(0.17, STONE, 8), { x, y: y0 + 1.4, z: wallZ }));
  }

  // planting round the sides and back
  g.add(place(tree({ kind: 'poplar', h: 7, seed: 3 }), { x: -4.5, y: y0, z: -1.8, s: 0.65 }));
  g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 4 }), { x: -4.6, y: y0, z: 0.9, s: 0.7 }));
  g.add(place(tree({ kind: 'round', h: 5.5, seed: 5 }), { x: -3.8, y: y0, z: -3.9, s: 0.55 }));
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 6 }), { x: 1.3, y: y0, z: -4.2, s: 0.55 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 7 }), { x: -1.6, y: y0, z: -4.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 8 }), { x: -4.5, y: y0, z: 4.2 }));
  // rising main leaving the back of the engine house into a valve pit
  g.add(pipeRun([[-0.6, y0 + 1.2, -3.0], [-0.6, y0 + 1.2, -3.8], [-0.6, y0 + 0.3, -3.8]], 0.22, pipeM));
  g.add(place(box(1.0, 0.25, 0.8, STONE_DARK), { x: -0.6, y: y0, z: -3.9 }));
  g.add(place(box(0.6, 0.02, 0.5, metal(PALETTE.steelDark)), { x: -0.6, y: y0 + 0.25, z: -3.9 }));
  g.add(place(cylinder(0.25, 0.25, 0.06, mat(PALETTE.red), 10), { x: -0.6, y: y0 + 1.2, z: -3.4, rx: 90 }));
  return g;
}

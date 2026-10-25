import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, prismBlock, hipRoof, gableRoof, chimney, door, windowPanel,
  box, boxFaces, cylinder, cone, sphere, place, stairs, columns, fence, hedge, tree, car,
  surface, mat, emissive,
} from '../../src/lib/index.js';
import { liveOak, balustrade } from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Greek Revival plantation house: giant-order columns wrap a two-storey
// gallery round three sides under one big slate hip roof; an avenue of
// moss-draped live oaks leads from the gate to the front steps.
export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));
  const y0 = LOT_HEIGHT;

  const white = mat(PALETTE.white);
  const shutterGreen = '#2f7a3c';
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  const planks = surface('planks', '#b9b4a6', { size: 2 });
  const slate = surface('shingles', PALETTE.roofSlate, { size: 1.6 });

  // ---- footprint of the house -------------------------------------------
  const FH = 3.3;                 // tall antebellum storeys
  const plinthH = 0.6;            // raised brick foundation
  const yb = y0 + plinthH;        // porch / ground-floor level
  const vw = 13.4, vz0 = -9.0, vz1 = 0.6;        // gallery wraps front + sides
  const hw = 11, hd = 6.8, hz = vz0 + hd / 2;    // main block (z -9.0 .. -2.2)
  const vd = vz1 - vz0, vz = (vz0 + vz1) / 2;
  const topY = yb + 2 * FH;

  // brick foundation with plank porch floor
  g.add(place(boxFaces(vw, plinthH, vd, { sides: brick, top: planks }), { y: y0, z: vz }));

  // main block: white clapboard, tall windows with green shutters
  const facadeStyle = {
    style: 'punched', wall: PALETTE.white, frame: '#ffffff', glass: PALETTE.window,
    shutters: shutterGreen, windowW: 0.36, windowH: 0.66, bay: 2.2, lit: 0.12, seed: 31,
    floorHeight: FH, roof: PALETTE.white,
  };
  g.add(place(facadeBlock({ w: hw, d: hd, floors: 2, ...facadeStyle }), { y: yb, z: hz }));

  // front doors (ground + gallery level) with fanlights and sidelights
  for (const [y, lit] of [[yb, true], [yb + FH, false]]) {
    g.add(place(box(2.5, 2.9, 0.08, white), { y, z: hz + hd / 2 }));
    g.add(place(door({ w: 1.3, h: 2.4, color: shutterGreen, frame: '#ffffff' }), { y, z: hz + hd / 2 + 0.02 }));
    g.add(place(windowPanel({ w: 1.3, h: 0.32, lit }), { y: y + 2.5, z: hz + hd / 2 + 0.02 }));
    for (const sx of [-0.95, 0.95]) g.add(place(windowPanel({ w: 0.3, h: 1.9, lit }), { x: sx, y: y + 0.25, z: hz + hd / 2 + 0.02 }));
  }

  // gallery deck at first-floor level + ceiling band
  g.add(place(box(vw, 0.25, vd, planks), { y: yb + FH - 0.25, z: vz }));
  g.add(place(box(vw + 0.1, 0.18, vd + 0.1, white), { y: yb + FH - 0.4, z: vz }));

  // giant-order columns (front row + both sides)
  const colR = 0.27;
  const colH = topY - yb;
  const cx = vw / 2 - 0.35;
  const frontZ = vz1 - 0.35;
  const colPos = [];
  for (let i = 0; i < 8; i++) colPos.push([-cx + (2 * cx * i) / 7, frontZ]);
  const sideN = 5;
  for (let i = 1; i <= sideN; i++) {
    const z = frontZ - ((frontZ - (vz0 + 0.35)) * i) / sideN;
    colPos.push([-cx, z], [cx, z]);
  }
  for (const [x, z] of colPos) {
    g.add(place(box(0.72, 0.22, 0.72, white), { x, y: yb, z }));
    g.add(place(cylinder(colR * 0.88, colR, colH - 0.5, white, 10), { x, y: yb + 0.22, z }));
    g.add(place(box(0.7, 0.28, 0.7, white), { x, y: topY - 0.28, z }));
  }

  // balustrades between the columns (gallery level all round, porch level front + sides)
  const railY = [yb + FH, yb];
  for (const [k, y] of railY.entries()) {
    const stairGap = k === 1 ? 3.8 : 0;
    if (stairGap) {
      const seg = (2 * cx - stairGap) / 2;
      for (const s of [-1, 1]) g.add(place(balustrade({ length: seg, h: 0.95 }), { x: s * (stairGap / 2 + seg / 2), y, z: frontZ }));
    } else {
      g.add(place(balustrade({ length: 2 * cx, h: 0.95 }), { y, z: frontZ }));
    }
    for (const s of [-1, 1]) {
      g.add(place(balustrade({ length: frontZ - (vz0 + 0.35), h: 0.95 }), { x: s * cx, y, z: (frontZ + vz0 + 0.35) / 2, ry: 90 }));
    }
  }

  // entablature + big slate hip roof over house and gallery
  const entH = 0.6;
  g.add(place(box(vw + 0.3, entH, vd + 0.3, white), { y: topY, z: vz }));
  g.add(place(box(vw + 0.6, 0.14, vd + 0.6, white), { y: topY + entH - 0.14, z: vz }));
  const roofY = topY + entH;
  const roofH = 3.6, roofOv = 0.45;
  g.add(place(hipRoof({ w: vw, d: vd, h: roofH, overhang: roofOv, material: slate }), { y: roofY, z: vz }));

  // dormers on the front and back slopes
  const D = vd / 2 + roofOv;
  const slopeY = (zr) => roofH * (1 - Math.abs(zr) / D);
  for (const side of [1, -1]) {
    const xs = side === 1 ? [-3.6, 0, 3.6] : [-2.4, 2.4];
    for (const x of xs) {
      const zf = side * 3.5;                 // front face of the dormer (roof-local z)
      const base = slopeY(zf) - 0.35;
      const dd = 2.2, dh = 1.45;
      const dzc = zf - side * dd / 2;
      g.add(place(box(1.4, dh, dd, white), { x, y: roofY + base, z: vz + dzc }));
      g.add(place(windowPanel({ w: 0.75, h: 0.95, lit: x === 0 }), { x, y: roofY + base + 0.35, z: vz + zf, ry: side === 1 ? 0 : 180 }));
      g.add(place(gableRoof({ w: 1.4, d: dd, h: 0.75, overhang: 0.15, ridge: 'z', material: slate, gableMaterial: PALETTE.white }), { x, y: roofY + base + dh, z: vz + dzc }));
    }
  }

  // tall brick chimneys rising through the roof
  for (const x of [-3.4, 3.4]) {
    g.add(place(chimney({ w: 1.0, d: 0.7, h: 4.6, material: brick, capMaterial: mat(PALETTE.stoneDark) }), { x, y: roofY + 0.4, z: vz }));
  }

  // rear door with a small stoop and steps
  g.add(place(door({ w: 1.2, h: 2.4, color: shutterGreen, frame: '#ffffff' }), { y: yb, z: vz0, ry: 180 }));
  g.add(place(box(2.4, 0.12, 1.2, white), { y: yb + 2.75, z: vz0 - 0.6 }));
  g.add(place(stairs({ w: 1.8, h: plinthH, d: 0.9, steps: 3, material: mat(PALETTE.offWhite) }), { y: y0, z: vz0 - 0.45, ry: 180 }));

  // wide front steps
  g.add(place(stairs({ w: 3.8, h: plinthH, d: 1.5, steps: 4, material: mat(PALETTE.offWhite) }), { y: y0, z: vz1 + 0.75 }));

  // rocking chairs on the porch and gallery
  const chair = (x, y, z) => {
    const wd = mat(PALETTE.white);
    g.add(place(box(0.55, 0.08, 0.55, wd), { x, y: y + 0.45, z }));
    g.add(place(box(0.55, 0.65, 0.08, wd), { x, y: y + 0.5, z: z - 0.26 }));
    g.add(place(box(0.6, 0.06, 0.7, mat(PALETTE.woodDark)), { x, y, z }));
  };
  for (const x of [-4.8, -3.2, 3.2, 4.8]) chair(x, yb, vz1 - 1.6);
  for (const x of [-4, 4]) chair(x, yb + FH, vz1 - 1.6);
  // hanging porch lantern
  g.add(place(box(0.35, 0.5, 0.35, emissive(PALETTE.windowLit, 0.8)), { y: yb + FH - 1.1, z: vz1 - 1.4 }));

  // ---- garçonnières: octagonal two-storey pavilions behind the house -------
  const oct = (rad) => Array.from({ length: 8 }, (_, i) => {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    return [Math.cos(a) * rad, -Math.sin(a) * rad];
  });
  for (const s of [-1, 1]) {
    const x = s * 8.35, z = -8.4;
    g.add(place(prismBlock({ points: oct(1.55), h: 0.3, floorHeight: 0.3, style: 'plain', wall: PALETTE.brick, roof: PALETTE.brick }), { x, y: y0, z }));
    g.add(place(prismBlock({ points: oct(1.4), floors: 2, floorHeight: 2.6, ...facadeStyle, bay: 1.1, windowW: 0.4, windowH: 0.6, roof: PALETTE.white }), { x, y: y0 + 0.3, z }));
    g.add(place(cylinder(1.75, 1.75, 0.2, white, 8), { x, y: y0 + 5.5, z, ry: 22.5 }));
    g.add(place(cone(1.75, 2.4, slate, 8), { x, y: y0 + 5.7, z, ry: 22.5 }));
    g.add(place(sphere(0.14, white, 6), { x, y: y0 + 8.1, z }));
  }

  // ---- grounds -------------------------------------------------------------
  // gravel drive from the gate to the steps, brick path round the house
  g.add(place(patch(3.4, 10 - (vz1 + 1.5), 'gravel'), { y: y0, z: (10 + vz1 + 1.5) / 2 }));
  g.add(place(patch(vw + 1.6, 0.9, surface('paving', PALETTE.brickBrown, { size: 1.5 })), { y: y0, z: vz1 + 0.45 }));

  // the oak avenue: two pairs of live oaks flanking the drive
  const oaks = [[-5.1, 3.9, 3], [5.1, 3.9, 7], [-5.1, 7.6, 11], [5.1, 7.6, 13]];
  for (const [x, z, seed] of oaks) {
    g.add(place(liveOak({ h: 5, spread: 2.2, seed }), { x, y: y0, z, ry: seed * 37 }));
  }

  // azaleas along the porch front
  const azalea = ['#d9558f', '#e98ab3', '#f2f0ea', '#d9558f'];
  for (let i = 0; i < 4; i++) {
    for (const s of [-1, 1]) {
      const x = s * (2.8 + i * 1.05);
      g.add(place(tree({ kind: 'bush', h: 0.9, seed: 50 + i, color: azalea[(i + (s > 0 ? 1 : 0)) % 4] }), { x, y: y0, z: vz1 + 1.4 }));
    }
  }

  // white picket fence with brick gate piers and lamps
  g.add(place(fence({ w: 19.4, d: 19.4, h: 0.9, style: 'picket', sides: ['front', 'left', 'right'], gap: 4.2 }), { y: y0 }));
  for (const s of [-1, 1]) {
    g.add(place(box(0.7, 1.6, 0.7, brick), { x: s * 2.2, y: y0, z: 9.65 }));
    g.add(place(box(0.85, 0.12, 0.85, mat(PALETTE.offWhite)), { x: s * 2.2, y: y0 + 1.6, z: 9.65 }));
    g.add(place(box(0.3, 0.42, 0.3, emissive(PALETTE.windowLit, 0.7)), { x: s * 2.2, y: y0 + 1.72, z: 9.65 }));
  }

  // side gardens: magnolias, a boxwood parterre and a parked classic car
  for (const [x, z, seed] of [[-8.1, -4.4, 21], [8.1, -4.4, 22]]) {
    g.add(place(tree({ kind: 'round', h: 6, seed, color: '#2d5a2a' }), { x, y: y0, z }));
    for (let i = 0; i < 5; i++) {
      const a = i * 1.3 + seed;
      g.add(place(sphere(0.2, mat('#fbf7ee'), 5), { x: x + Math.cos(a) * 1.3, y: y0 + 4.0 + (i % 2) * 0.6, z: z + Math.sin(a) * 1.3 }));
    }
  }
  const px = -8.3, pz = 1.6;
  const box2 = mat(PALETTE.foliageDark);
  g.add(place(patch(2.8, 4.4, 'gravel'), { x: px, y: y0, z: pz }));
  for (const dz of [-1.1, 1.1]) {
    g.add(place(hedge({ w: 2.2, h: 0.45, d: 1.4, color: box2 }), { x: px, y: y0, z: pz + dz }));
  }
  g.add(place(cylinder(0.25, 0.35, 0.6, mat(PALETTE.stone), 8), { x: px, y: y0, z: pz }));
  g.add(place(sphere(0.3, mat(PALETTE.foliage), 6), { x: px, y: y0 + 0.75, z: pz }));
  g.add(place(patch(2.6, 4.8, 'gravel'), { x: 8.2, y: y0, z: 2.2 }));
  g.add(place(car({ color: '#1f4d2e' }), { x: 8.2, y: y0 + 0.05, z: 2.2, ry: 90, s: 0.8 }));

  // back garden hedge
  for (const s of [-1, 1]) g.add(place(hedge({ w: 4, h: 1.0, d: 0.6 }), { x: s * 3.6, y: y0, z: -9.6 }));
  return g;
}

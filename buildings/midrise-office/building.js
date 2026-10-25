import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, parapet, columns, sign, tree, hedge,
  streetLamp, bench, flag, antenna, pipeRun, car, mat, metal, glass, emissive, surface,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const white = PALETTE.white;
  const ledgeM = mat(PALETTE.offWhite);
  const steelM = metal(PALETTE.steelLight);
  const darkM = mat(PALETTE.darkGrey);

  // main slab: x -3.2..4.4, z -4.6..1.6
  const bx = 0.6, bz = -1.5, bw = 7.6, bd = 6.2;
  const lobbyH = 3.6, upper = 7;
  const topY = y0 + lobbyH + upper * FLOOR;

  // ground floor: recessed dark-glass lobby behind slim columns
  g.add(place(facadeBlock({ w: bw - 0.8, d: bd - 0.8, h: lobbyH, floorHeight: lobbyH, style: 'curtain', glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 1.6, lit: 0.5, seed: 3 }), { x: bx, y: y0, z: bz }));
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1], [0, 1], [0, -1]]) {
    g.add(place(box(0.35, lobbyH, 0.35, ledgeM), { x: bx + x * (bw / 2 - 0.2), y: y0, z: bz + z * (bd / 2 - 0.2) }));
  }

  // seven ribbon-window storeys above
  g.add(place(facadeBlock({ w: bw, d: bd, floors: upper, style: 'ribbon', wall: white, glass: PALETTE.glassBlue, frame: PALETTE.steelDark, bay: 1.9, lit: 0.15, seed: 30, roof: PALETTE.concreteDark }), { x: bx, y: y0 + lobbyH, z: bz }));
  // projecting floor ledges emphasise the horizontal bands
  for (let f = 0; f <= upper; f++) {
    const t = f === upper ? 0.25 : 0.12;
    g.add(place(box(bw + 0.3, t, bd + 0.3, ledgeM), { x: bx, y: y0 + lobbyH + f * FLOOR - (f === upper ? 0 : 0.06), z: bz }));
  }
  g.add(place(parapet({ w: bw + 0.3, d: bd + 0.3, h: 0.9, t: 0.25, material: mat(PALETTE.offWhite) }), { x: bx, y: topY + 0.25, z: bz }));

  // concrete stair / lift core on the west side, rising above the roof
  const cx = -3.95, cw = 1.5, cd = 3.4, coreH = lobbyH + upper * FLOOR + 3.2;
  const coreM = surface('concrete', PALETTE.concrete, { size: 3 });
  g.add(place(box(cw, coreH, cd, coreM), { x: cx, y: y0, z: bz - 0.6 }));
  // stair-window slots on the core's front and west faces
  const slot = { h: coreH - 4, floorHeight: FLOOR, style: 'ribbon', wall: PALETTE.concrete, glass: PALETTE.glassSky, frame: PALETTE.steelDark, bay: 0.7, lit: 0, seed: 4 };
  g.add(place(facadeBlock({ ...slot, w: 0.7, d: cd + 0.04, blank: ['left', 'right'] }), { x: cx, y: y0 + 1, z: bz - 0.6 }));
  g.add(place(facadeBlock({ ...slot, w: cw + 0.04, d: 0.7, blank: ['front', 'back'] }), { x: cx, y: y0 + 1, z: bz - 0.6 }));
  g.add(place(box(cw + 0.2, 0.25, cd + 0.2, ledgeM), { x: cx, y: y0 + coreH, z: bz - 0.6 }));
  g.add(place(antenna({ h: 5, radius: 0.1 }), { x: cx, y: y0 + coreH + 0.25, z: bz - 1.2 }));

  // company name on the parapet, front and side
  const signY = topY + 1.15;
  g.add(place(sign({ text: 'TINYCORP', w: 5, h: 1.1, bg: PALETTE.navy, fg: '#ffffff' }), { x: bx + 0.6, y: signY + 0.5, z: bz + bd / 2 - 0.1 }));
  for (const sx of [-1.8, 1.8]) g.add(place(box(0.12, 0.5, 0.12, darkM), { x: bx + 0.6 + sx, y: signY, z: bz + bd / 2 - 0.15 }));

  // ---- glass entrance box on the front
  const ex = bx + 0.6, ew = 3.6, ed = 2.3, eh = 4.4, ez = bz + bd / 2 + ed / 2 - 0.2;
  const eGlass = glass(PALETTE.glassSky, { opacity: 0.75 });
  g.add(place(box(ew, eh - 0.3, ed, eGlass), { x: ex, y: y0, z: ez }));
  g.add(place(box(ew + 0.3, 0.3, ed + 0.3, steelM), { x: ex, y: y0 + eh - 0.3, z: ez })); // roof slab
  // mullions
  for (const sx of [-1, -0.33, 0.33, 1]) g.add(place(box(0.1, eh - 0.3, 0.1, steelM), { x: ex + sx * (ew / 2 - 0.05), y: y0, z: ez + ed / 2 }));
  for (const sx of [-1, 1]) g.add(place(box(0.1, eh - 0.3, 0.1, steelM), { x: ex + sx * (ew / 2 - 0.05), y: y0, z: ez - ed / 2 + 0.3 }));
  g.add(place(box(ew, 0.08, 0.1, steelM), { x: ex, y: y0 + 2.6, z: ez + ed / 2 }));
  // revolving door drum
  g.add(place(cylinder(0.75, 0.75, 2.4, glass(PALETTE.glassDark, { opacity: 0.85 }), 12), { x: ex, y: y0, z: ez + ed / 2 }));
  g.add(place(cylinder(0.85, 0.85, 0.15, steelM, 12), { x: ex, y: y0 + 2.4, z: ez + ed / 2 }));
  // reception desk + lit ceiling visible through the glass
  g.add(place(box(1.6, 0.9, 0.5, mat(PALETTE.woodLight)), { x: ex - 0.6, y: y0, z: ez - 0.4 }));
  g.add(place(box(ew - 0.2, 0.05, ed - 0.2, emissive(PALETTE.windowLit, 0.6)), { x: ex, y: y0 + eh - 0.36, z: ez }));
  // sign on the box fascia
  g.add(place(sign({ text: 'TINYCORP', w: 2.6, h: 0.45, bg: PALETTE.steelDark, fg: '#ffffff' }), { x: ex, y: y0 + eh - 0.3, z: ez + ed / 2 + 0.15 }));
  // entrance mat / steps
  g.add(place(box(2.4, 0.08, 0.9, darkM), { x: ex, y: y0, z: ez + ed / 2 + 0.6 }));

  // ---- rooftop plant
  const ry = topY + 0.25;
  // louvred plant room
  const louvre = surface('corrugated', PALETTE.steelLight, { size: 1.5 });
  g.add(place(box(3.4, 2.2, 2.4, [louvre, louvre, mat(PALETTE.steel), louvre, louvre, louvre]), { x: bx + 1.6, y: ry, z: bz - 1.5 }));
  g.add(place(box(3.6, 0.15, 2.6, mat(PALETTE.steelDark)), { x: bx + 1.6, y: ry + 2.2, z: bz - 1.5 }));
  // cooling tower with fan stack
  const ctx_ = bx - 1.6, ctz = bz - 1.4;
  g.add(place(box(2.2, 1.8, 2.2, surface('corrugated', PALETTE.plasterBlue, { size: 1 })), { x: ctx_, y: ry, z: ctz }));
  g.add(place(cylinder(0.85, 1.0, 0.7, mat(PALETTE.steel), 14), { x: ctx_, y: ry + 1.8, z: ctz }));
  g.add(place(cylinder(0.75, 0.75, 0.05, darkM, 14), { x: ctx_, y: ry + 2.5, z: ctz }));
  for (const a of [0, 60, 120]) g.add(place(box(1.4, 0.05, 0.15, steelM), { x: ctx_, y: ry + 2.52, z: ctz, ry: a }));
  // AC condensers in a row near the front
  for (let i = 0; i < 3; i++) {
    const ax = bx - 2.2 + i * 1.6, az = bz + 1.5;
    g.add(place(box(1.2, 0.9, 1.0, mat(PALETTE.lightGrey)), { x: ax, y: ry, z: az }));
    g.add(place(cylinder(0.38, 0.38, 0.06, darkM, 10), { x: ax, y: ry + 0.9, z: az }));
  }
  // ducts from plant room to the cooling tower and down the roof
  const ductM = metal(PALETTE.aluminium, { roughness: 0.3 });
  g.add(pipeRun([[bx + 0.0, ry + 1.4, bz - 1.2], [ctx_ + 1.1, ry + 1.4, bz - 1.2]], 0.28, ductM));
  g.add(pipeRun([[bx + 3.3, ry + 0.4, bz - 1.5], [bx + 3.3, ry + 0.4, bz + 1.0], [bx + 1.4, ry + 0.4, bz + 1.0]], 0.2, ductM));
  // window-cleaning gantry rail along the front parapet
  g.add(place(box(bw - 0.6, 0.1, 0.1, mat(PALETTE.yellow)), { x: bx, y: ry + 1.2, z: bz + bd / 2 - 0.6 }));
  for (const sx of [-1, 0, 1]) g.add(place(box(0.1, 1.2, 0.1, mat(PALETTE.yellow)), { x: bx + sx * (bw / 2 - 0.5), y: ry, z: bz + bd / 2 - 0.6 }));

  // ---- plaza and street props
  g.add(place(patch(10, 3.2, 'cobbles'), { y: y0, z: 3.4 }));
  // planters with trees either side of the entrance
  for (const [x, z, s] of [[-3.5, 2.6, 11], [3.7, 2.7, 12]]) {
    g.add(place(box(1.4, 0.5, 1.4, mat(PALETTE.stoneDark)), { x, y: y0, z }));
    g.add(place(tree({ kind: 'round', h: 4.2, seed: s }), { x, y: y0 + 0.5, z }));
  }
  g.add(place(bench({ w: 1.5 }), { x: -1.6, y: y0, z: 2.3 }));
  // flagpoles
  g.add(place(flag({ h: 6.5, color: PALETTE.navy, color2: PALETTE.white }), { x: -4.6, y: y0, z: 4.6 }));
  g.add(place(flag({ h: 6.5, color: PALETTE.red, color2: PALETTE.white }), { x: -3.8, y: y0, z: 4.6 }));
  // bike rack with bikes
  for (let i = 0; i < 3; i++) {
    const x = 2.6 + i * 0.5;
    g.add(place(box(0.05, 0.75, 1.3, mat(PALETTE.steelDark)), { x, y: y0, z: 4.2 }));
    g.add(place(box(0.05, 0.4, 1.2, mat([PALETTE.red, PALETTE.blue, PALETTE.green][i])), { x: x + 0.12, y: y0 + 0.3, z: 4.2 }));
  }
  g.add(place(streetLamp({ h: 4.5 }), { x: 4.6, y: y0, z: 4.7, ry: 180 }));
  // taxi drop-off at the kerb
  g.add(place(car({ kind: 'taxi' }), { x: -1.3, y: y0 + 0.05, z: 4.3, s: 0.6 }));

  // green strips round the sides and back
  g.add(place(patch(9.6, 0.5, 'grass'), { y: y0, z: -4.75 }));
  g.add(place(hedge({ w: 9.4, h: 0.9, d: 0.5 }), { y: y0, z: -4.72 }));
  g.add(place(patch(0.6, 6, 'grass'), { x: 4.7, y: y0, z: -1.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 21 }), { x: 4.5, y: y0, z: -3.5 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 22 }), { x: 4.5, y: y0, z: 0.4 }));
  // bins by the core
  g.add(place(box(1.0, 1.1, 0.8, mat(PALETTE.green)), { x: -4.2, y: y0, z: 1.6 }));
  return g;
}

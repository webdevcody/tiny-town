import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, dome, place, beam, pipeRun, cylinder as cyl,
  gableRoof, door, windowPanel, fence, sign, streetLamp, tree, tank, car,
  mat, metal, surface,
} from '../../src/lib/index.js';

// Merge many small meshes (beams, ribs) into one mesh per material: the guide
// frame alone is hundreds of members, so this keeps the mesh count tiny.
function merged(meshes, material) {
  const geos = meshes.map((m) => {
    m.updateMatrix();
    const g = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone();
    g.applyMatrix4(m.matrix);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'uv'].includes(k)) g.deleteAttribute(k);
    return g;
  });
  return new THREE.Mesh(mergeGeometries(geos, false), material);
}

const V = (x, y, z) => new THREE.Vector3(x, y, z);

// Square lattice column centred at (cx, cz), w wide, from y0 to y0 + h.
// Faces are aligned to the radial direction `a` so the bracing reads from outside.
function latticeColumn(out, cx, cz, a, w, h, y0, n) {
  const ux = Math.cos(a), uz = Math.sin(a); // radial
  const vx = -uz, vz = ux; // tangential
  const W = w / 2;
  const corner = (y, sr, st) => V(cx + (ux * sr + vx * st) * W, y0 + y, cz + (uz * sr + vz * st) * W);
  const signs = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sr, st] of signs) out.push(beam(corner(0, sr, st), corner(h, sr, st), 0.12));
  for (let i = 0; i <= n; i++) {
    const ya = (h * i) / n, yb = (h * (i + 1)) / n;
    for (let s = 0; s < 4; s++) {
      const [ar, at] = signs[s];
      const [br, bt] = signs[(s + 1) % 4];
      out.push(beam(corner(ya, ar, at), corner(ya, br, bt), 0.07));
      if (i < n) out.push(beam(corner(ya, ar, at), corner(yb, br, bt), 0.05));
    }
  }
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'gravel'));

  // ---- colours
  const bellM = mat('#5f8a5c', { roughness: 0.6 });
  const bandM = mat('#3f6340', { roughness: 0.6 });
  const crownM = mat('#6f9a6a', { roughness: 0.6 });
  const frameM = mat('#8e3f2c', { roughness: 0.7 });
  const brickM = surface('brick', PALETTE.brick, { size: 1.2 });
  const copingM = mat(PALETTE.concrete);
  const darkM = metal(PALETTE.steelDark);

  // ---- brick water tank (the bell floats in it)
  const tankR = 3.75, tankH = 1.3;
  g.add(place(patch(8.4, 8.4, 'concrete'), { y: y0 }));
  g.add(place(cylinder(tankR, tankR + 0.1, tankH, brickM, 32), { y: y0 }));
  g.add(place(cylinder(tankR + 0.12, tankR + 0.12, 0.16, copingM, 32), { y: y0 + tankH }));
  // buttress piers round the tank
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2 + Math.PI / 16;
    g.add(place(box(0.35, tankH, 0.3, brickM), { x: Math.cos(a) * (tankR + 0.08), z: Math.sin(a) * (tankR + 0.08), y: y0, ry: -THREE.MathUtils.radToDeg(a) + 90 }));
  }

  // ---- telescoping bell: two lifts + domed crown
  const lifts = [
    { r: 3.5, h: 3.9 },
    { r: 3.22, h: 3.9 },
  ];
  let y = y0 + tankH + 0.16 - 0.4; // lower lift sits down in the water
  const ribs = [];
  const rollers = [];
  for (const [li, L] of lifts.entries()) {
    g.add(place(cylinder(L.r, L.r, L.h, bellM, 40), { y }));
    // top "cup" band and a mid band
    g.add(place(cylinder(L.r + 0.09, L.r + 0.09, 0.32, bandM, 40), { y: y + L.h - 0.32 }));
    g.add(place(cylinder(L.r + 0.05, L.r + 0.05, 0.12, bandM, 40), { y: y + L.h * 0.45 }));
    if (li === 0) g.add(place(cylinder(L.r + 0.05, L.r + 0.05, 0.12, bandM, 40), { y: y + 0.4 }));
    // vertical stiffeners
    for (let i = 0; i < 32; i++) {
      const a = (i / 32) * Math.PI * 2;
      const m = box(0.09, L.h - 0.32, 0.09, bandM);
      place(m, { x: Math.cos(a) * (L.r + 0.03), z: Math.sin(a) * (L.r + 0.03), y });
      ribs.push(m);
    }
    // guide rollers + carriage arms reaching out to each column
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const ca = Math.cos(a), sa = Math.sin(a);
      const ry = y + L.h - 0.2;
      rollers.push(beam(V(ca * L.r, ry, sa * L.r), V(ca * 3.82, ry, sa * 3.82), 0.16));
      const rm = box(0.3, 0.45, 0.3, darkM);
      place(rm, { x: ca * 3.82, z: sa * 3.82, y: ry - 0.22, ry: -THREE.MathUtils.radToDeg(a) });
      rollers.push(rm);
    }
    y += L.h;
  }
  g.add(merged(ribs, bandM));
  g.add(merged(rollers, darkM));
  const topR = lifts[lifts.length - 1].r;
  g.add(place(dome({ radius: topR, height: 0.85, material: crownM, segments: 40 }), { y }));
  // crown: walkway ring, centre vent and a little rail
  const crownTop = y + 0.85;
  g.add(place(cylinder(0.45, 0.5, 0.35, darkM, 12), { y: crownTop - 0.05 }));
  g.add(place(cylinder(0.25, 0.25, 0.5, darkM, 10), { y: crownTop + 0.3 }));
  const rail = [];
  for (let i = 0; i < 24; i++) {
    const a0 = (i / 24) * Math.PI * 2, a1 = ((i + 1) / 24) * Math.PI * 2;
    const rr = topR - 0.15;
    rail.push(beam(V(Math.cos(a0) * rr, y + 0.75, Math.sin(a0) * rr), V(Math.cos(a1) * rr, y + 0.75, Math.sin(a1) * rr), 0.05));
    rail.push(beam(V(Math.cos(a0) * rr, y + 0.05, Math.sin(a0) * rr), V(Math.cos(a0) * rr, y + 0.75, Math.sin(a0) * rr), 0.05));
  }
  g.add(merged(rail, darkM));

  // ---- guide frame: 8 lattice columns tied by ring girders and X-bracing
  const colR = 4.1, colW = 0.5, colH = 13.2, nCol = 8;
  const frame = [];
  const cols = [];
  for (let i = 0; i < nCol; i++) {
    const a = (i / nCol) * Math.PI * 2 + Math.PI / 8;
    const cx = Math.cos(a) * colR, cz = Math.sin(a) * colR;
    cols.push([cx, cz, a]);
    latticeColumn(frame, cx, cz, a, colW, colH, y0, 16);
  }
  const tiers = [4.6, 8.9, colH];
  for (let i = 0; i < nCol; i++) {
    const [ax, az] = cols[i];
    const [bx, bz] = cols[(i + 1) % nCol];
    for (const [ti, ty] of tiers.entries()) {
      const top = y0 + ty, bot = top - 0.7;
      // girder: top + bottom chord with a zigzag web
      frame.push(beam(V(ax, top, az), V(bx, top, bz), 0.14));
      frame.push(beam(V(ax, bot, az), V(bx, bot, bz), 0.1));
      const seg = 5;
      for (let s = 0; s < seg; s++) {
        const t0 = s / seg, t1 = (s + 1) / seg;
        const p = (t, yy) => V(ax + (bx - ax) * t, yy, az + (bz - az) * t);
        frame.push(beam(s % 2 ? p(t0, top) : p(t0, bot), s % 2 ? p(t1, bot) : p(t1, top), 0.06));
      }
      // X-bracing in the panel below this girder
      const prev = ti === 0 ? y0 + 0.2 : y0 + tiers[ti - 1];
      frame.push(beam(V(ax, prev, az), V(bx, bot, bz), 0.06));
      frame.push(beam(V(bx, prev, bz), V(ax, bot, az), 0.06));
    }
  }
  g.add(merged(frame, frameM));
  // column feet + caps
  for (const [cx, cz, a] of cols) {
    g.add(place(box(0.8, 0.35, 0.8, copingM), { x: cx, z: cz, y: y0, ry: -THREE.MathUtils.radToDeg(a) }));
    g.add(place(box(0.7, 0.18, 0.7, frameM), { x: cx, z: cz, y: y0 + colH, ry: -THREE.MathUtils.radToDeg(a) }));
    g.add(place(cylinder(0.04, 0.12, 0.6, frameM, 6), { x: cx, z: cz, y: y0 + colH + 0.18 }));
  }
  // access ladder up the front-left column
  {
    const [cx, cz, a] = cols[2];
    const ux = Math.cos(a), uz = Math.sin(a);
    const lx = cx + ux * 0.38, lz = cz + uz * 0.38;
    const vx = -uz * 0.22, vz = ux * 0.22;
    const lad = [];
    lad.push(beam(V(lx + vx, y0, lz + vz), V(lx + vx, y0 + colH, lz + vz), 0.05));
    lad.push(beam(V(lx - vx, y0, lz - vz), V(lx - vx, y0 + colH, lz - vz), 0.05));
    for (let yy = 0.4; yy < colH; yy += 0.4) lad.push(beam(V(lx + vx, y0 + yy, lz + vz), V(lx - vx, y0 + yy, lz - vz), 0.035));
    g.add(merged(lad, darkM));
  }

  // ---- valve house in the front-right corner, piped into the tank
  const hx = 3.95, hz = 3.95, hw = 1.7, hd = 1.5;
  g.add(place(box(hw, 2.2, hd, brickM), { x: hx, y: y0, z: hz }));
  g.add(place(gableRoof({ w: hw, d: hd, h: 0.7, overhang: 0.15, ridge: 'x', material: surface('roofTiles', PALETTE.roofSlate, { size: 1 }), gableMaterial: brickM }), { x: hx, y: y0 + 2.2, z: hz }));
  g.add(place(door({ w: 0.7, h: 1.7, color: PALETTE.navy }), { x: hx - 0.3, y: y0, z: hz + hd / 2 }));
  g.add(place(windowPanel({ w: 0.45, h: 0.6 }), { x: hx + hw / 2, y: y0 + 1.1, z: hz, ry: 90 }));
  const pipeM = metal(PALETTE.yellow, { roughness: 0.5 });
  g.add(pipeRun([[hx - 0.6, y0 + 0.6, hz - hd / 2], [hx - 0.6, y0 + 0.6, 3.0], [2.55, y0 + 0.6, 3.0], [2.55, y0 + 0.6, 2.75]], 0.17, pipeM));
  g.add(pipeRun([[hx + 0.5, y0 + 0.4, hz - hd / 2], [hx + 0.5, y0 + 0.4, 2.2], [3.3, y0 + 0.4, 1.35]], 0.14, pipeM));
  // valve wheel on the main pipe
  g.add(place(cyl(0.05, 0.05, 0.6, darkM, 6), { x: 3.0, y: y0 + 0.75, z: 3.0 }));
  g.add(place(cyl(0.28, 0.28, 0.05, mat(PALETTE.red), 12), { x: 3.0, y: y0 + 1.35, z: 3.0 }));

  // ---- small booster tank in the back-right corner
  g.add(place(patch(1.8, 1.8, 'concrete'), { x: 3.9, y: y0, z: -3.9 }));
  g.add(place(tank({ radius: 0.6, h: 1.4, roof: 'dome', material: metal(PALETTE.steelLight, { roughness: 0.5 }) }), { x: 3.9, y: y0 + 0.05, z: -3.9 }));
  g.add(pipeRun([[3.6, y0 + 0.5, -3.55], [2.95, y0 + 0.5, -2.9]], 0.1, pipeM));

  // ---- trees in the back-left corner
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 7 }), { x: -4.0, y: y0, z: -4.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 8 }), { x: -4.3, y: y0, z: -2.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 9 }), { x: -2.9, y: y0, z: -4.3 }));

  // ---- front-left: gas-board sign, lamp and a service van at the gate
  g.add(place(sign({ text: 'GAS WORKS', w: 2.0, h: 0.65, bg: PALETTE.navy, fg: '#ffd84a', double: true }), { x: -3.55, y: y0 + 1.0, z: 4.15 }));
  for (const s of [-1, 1]) g.add(place(box(0.08, 1.0, 0.08, darkM), { x: -3.55 + s * 0.85, y: y0, z: 4.15 }));
  g.add(place(streetLamp({ h: 3.2 }), { x: -4.45, y: y0, z: 2.4 }));

  // ---- perimeter fence with a front gate
  g.add(place(fence({ w: 9.6, d: 9.6, h: 0.9, style: 'railing', color: PALETTE.darkGrey, sides: ['front', 'back', 'left', 'right'], gap: 2.6 }), { y: y0 }));
  return g;
}

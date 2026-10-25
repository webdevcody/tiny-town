import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cone, sphere, place, gableRoof, shedRoof, parapet, extrude,
  tree, streetLamp, bench, hedge, mat, metal, ShapeBuilder,
} from '../../src/lib/index.js';
import {
  STONE, STONE_D, STONE_L, GLASS, archSlab,
  dressBlock, windowWall, roseWindow, portal, pinnacle, pier, flyer, copperMat,
} from './parts.js';

// 2x3 tiles (20 x 30 m). West front with twin towers faces +z (the street);
// nave runs along z to a transept and a polygonal apse at the back.
const NX = 3.5; // nave half-width
const NH = 15; // nave wall height
const RH = 7; // nave roof height
const AX = 6.5; // outer aisle wall
const AH = 7; // aisle wall height
const Z_FRONT = 11; // west front (between the towers)
const Z_NAVE0 = -1.5; // nave meets transept
const Z_TR0 = -8.5; // back of transept
const TX = 9; // transept half-length
const Z_APSE = -9.5; // apse centre
const TOWER = { x: 5.4, z: 8.9, s: 4.6, h: 27 };

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const stone = mat(STONE);
  const copper = copperMat();
  const flyMat = mat('#ab9d7f');
  g.add(lot([2, 3], 'grass'));

  // ---- ground: parvis in front, gravel paths round the church
  g.add(place(patch(20, 3.8, 'cobbles'), { y: y0, z: 13.1 }));
  g.add(place(patch(19.4, 23, 'gravel'), { y: y0, z: -1 }));

  // ---- nave + choir (one long block), copper roof
  const naveLen = Z_FRONT - Z_APSE;
  const naveZ = (Z_FRONT + Z_APSE) / 2;
  g.add(place(box(NX * 2, NH, naveLen, stone), { y: y0, z: naveZ }));
  g.add(place(gableRoof({ w: NX * 2, d: naveLen, h: RH, ridge: 'z', overhang: 0.35, material: copper, gableMaterial: stone }), { y: y0 + NH, z: naveZ }));
  // ridge cresting
  g.add(place(box(0.25, 0.25, naveLen + 0.4, mat(STONE_D)), { y: y0 + NH + RH - 0.05, z: naveZ }));

  // clerestory over the aisles
  const aisleLen = 6.6 - Z_NAVE0;
  const aisleZ = (6.6 + Z_NAVE0) / 2;
  g.add(place(dressBlock({ z: aisleZ, w: NX * 2, d: aisleLen, y: 9.3, h: NH - 9.3 },
    ['left', 'right'], { bay: aisleLen / 3, sill: 0.6, top: 5.3, ww: 1.5, twin: true }), { y: y0 }));

  // side aisles with lean-to copper roofs
  for (const sx of [-1, 1]) {
    const ax = sx * (NX + AX) / 2;
    const aw = AX - NX;
    g.add(place(box(aw, AH, aisleLen, stone), { x: ax, y: y0, z: aisleZ }));
    g.add(place(dressBlock({ x: ax, z: aisleZ, w: aw, d: aisleLen, h: AH },
      [sx > 0 ? 'right' : 'left'], { bay: aisleLen / 3, sill: 1.4, top: 6.0, ww: 1.3, twin: true, bands: [0.7] }), { y: y0 }));
    g.add(place(shedRoof({ w: aisleLen, d: aw, h: 2.3, overhang: 0.25, material: copper, wallMaterial: stone }),
      { x: ax, y: y0 + AH, z: aisleZ, ry: sx > 0 ? 90 : -90 }));
  }

  // ---- flying buttresses along the nave
  for (const pz of [1.2, 3.9]) {
    for (const sx of [-1, 1]) {
      g.add(place(pier({ w: 1.4, d: 0.8, h: 12.4 }), { x: sx * 7.2, y: y0, z: pz }));
      g.add(place(flyer({ xOut: sx * 6.6, xIn: sx * (NX + 0.05), yOut: 12.3, yIn: 14.7, t: 0.65, dOut: 1.9, dIn: 0.9, sag: 2.0, material: flyMat }), { y: y0, z: pz }));
      g.add(place(flyer({ xOut: sx * 6.6, xIn: sx * (NX + 0.05), yOut: 9.6, yIn: 11.2, t: 0.5, dOut: 1.4, dIn: 0.7, sag: 1.4, material: flyMat }), { y: y0, z: pz }));
      // wall pilaster where the flyer lands
      g.add(place(box(0.5, NH - 9.3, 0.7, stone), { x: sx * (NX + 0.2), y: y0 + 9.3, z: pz }));
      g.add(place(pinnacle(0.22, 1.6), { x: sx * (NX + 0.2), y: y0 + NH, z: pz }));
    }
  }

  // ---- transept with rose windows in both ends
  const trD = Z_NAVE0 - Z_TR0;
  const trZ = (Z_NAVE0 + Z_TR0) / 2;
  g.add(place(box(TX * 2, NH, trD, stone), { y: y0, z: trZ }));
  g.add(place(gableRoof({ w: TX * 2, d: trD, h: RH, ridge: 'x', overhang: 0.35, material: copper, gableMaterial: stone }), { y: y0 + NH, z: trZ }));
  g.add(place(box(TX * 2 + 0.4, 0.25, 0.25, mat(STONE_D)), { y: y0 + NH + RH - 0.05, z: trZ }));
  // windows on the long faces of the arms
  for (const sx of [-1, 1]) {
    const armW = TX - AX;
    const armX = sx * (AX + armW / 2);
    g.add(place(dressBlock({ x: armX, z: trZ, w: armW, d: trD, h: NH }, ['front', 'back'],
      { bay: armW, sill: 3, top: 13, ww: 1.4, twin: true, bands: [1.0, 7.5] }), { y: y0 }));
    // gable end: ashlar with string courses, rose window, portal
    g.add(place(dressBlock({ x: sx * TX / 2, z: trZ, w: TX, d: trD, h: NH }, [sx > 0 ? 'right' : 'left'],
      { bay: trD, sill: 0, top: 1, ww: 1, kind: 'none', bands: [6.0, 13.6] }), { y: y0 }));
    g.add(place(roseWindow(2.1), { x: sx * (TX + 0.02), y: y0 + 9.8, z: trZ, ry: sx * 90 }));
    g.add(place(portal({ w: 2.0, spring: 2.4 }), { x: sx * TX, y: y0, z: trZ, ry: sx * 90 }));
    // corner turrets
    for (const cz of [Z_NAVE0, Z_TR0]) {
      g.add(place(box(1.1, NH + 1.5, 1.1, stone), { x: sx * (TX - 0.1), y: y0, z: cz }));
      g.add(place(cone(0.75, 3.4, copper, 8), { x: sx * (TX - 0.1), y: y0 + NH + 1.5, z: cz }));
    }
    // stone pinnacle on the gable apex
    g.add(place(pinnacle(0.3, 2.2), { x: sx * TX, y: y0 + NH + RH - 0.6, z: trZ }));
  }
  // crossing flèche (slender copper spire)
  const fy = y0 + NH + RH - 0.6;
  g.add(place(extrude(octagon(1.1), 2.6, mat(STONE_L)), { y: fy, z: trZ }));
  g.add(place(cone(1.25, 1.4, copper, 8), { y: fy + 2.6, z: trZ, ry: 22.5 }));
  g.add(place(extrude(octagon(0.7), 2.2, copper), { y: fy + 3.6, z: trZ }));
  g.add(place(cone(0.85, 8.5, copper, 8), { y: fy + 5.8, z: trZ, ry: 22.5 }));
  g.add(place(sphere(0.25, metal(PALETTE.glassGold)), { y: fy + 14.2, z: trZ }));

  // ---- apse (half decagon) with radiating buttresses
  const apsePts = [];
  for (let i = 0; i <= 5; i++) {
    const a = (i / 5) * Math.PI;
    apsePts.push([NX * Math.cos(a), Z_APSE - NX * Math.sin(a)]);
  }
  g.add(place(extrude(apsePts, NH, stone), { y: y0 }));
  g.add(place(apseRoof(apsePts, Z_APSE, RH, copper), { y: y0 + NH }));
  for (let i = 0; i < 5; i++) {
    const [x1, z1] = apsePts[i], [x2, z2] = apsePts[i + 1];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const nx = (x1 + x2) / 2, nz = (z1 + z2) / 2 - Z_APSE;
    const ry = THREE.MathUtils.radToDeg(Math.atan2(nx, nz));
    const n = Math.hypot(nx, nz);
    g.add(place(windowWall(len, NH, { bay: len, sill: 2.5, top: 13, ww: 1.1, twin: false, bands: [1.0] }),
      { x: (x1 + x2) / 2 + (nx / n) * 0.03, y: y0, z: (z1 + z2) / 2 + (nz / n) * 0.03, ry }));
  }
  for (let i = 1; i < 5; i++) {
    const a = (i / 5) * Math.PI;
    const r = NX + 0.5;
    const b = place(pier({ w: 0.7, d: 1.2, h: 11 }), { x: r * Math.cos(a), y: y0, z: Z_APSE - r * Math.sin(a) });
    b.rotation.y = Math.atan2(Math.cos(a), -Math.sin(a));
    g.add(b);
  }

  // ---- west front: twin towers
  for (const sx of [-1, 1]) {
    const tx = sx * TOWER.x, tz = TOWER.z;
    const stages = [
      { y: 0, h: 12, s: TOWER.s, opts: { bay: TOWER.s, sill: 6.6, top: 11, ww: 1.5, twin: true, bands: [5.6] } },
      { y: 12, h: 8, s: TOWER.s - 0.3, opts: { bay: 2.1, sill: 1.0, top: 7.2, ww: 0.95, kind: 'blind', bands: [0.4] } },
      { y: 20, h: 7, s: TOWER.s - 0.6, opts: { bay: 2.0, sill: 0.8, top: 6.4, ww: 1.05, kind: 'louvre', bands: [0.4] } },
    ];
    for (const st of stages) {
      g.add(place(box(st.s, st.h, st.s, stone), { x: tx, y: y0 + st.y, z: tz }));
      g.add(place(dressBlock({ x: tx, z: tz, w: st.s, d: st.s, h: st.h }, ['front', 'back', 'left', 'right'], st.opts), { y: y0 + st.y }));
      g.add(place(box(st.s + 0.3, 0.3, st.s + 0.3, mat(STONE_L)), { x: tx, y: y0 + st.y + st.h - 0.15, z: tz }));
    }
    // corner buttresses climbing the tower, ending in pinnacles
    for (const cx of [-1, 1]) {
      for (const cz of [-1, 1]) {
        const px = tx + cx * (TOWER.s / 2 - 0.15), pz = tz + cz * (TOWER.s / 2 - 0.15);
        if (cz < 0 && cx === -sx) continue; // inner back corner is buried in the nave
        g.add(place(box(1.0, 12, 1.0, stone), { x: px, y: y0, z: pz }));
        g.add(place(box(0.8, 8, 0.8, stone), { x: px - cx * 0.1, y: y0 + 12, z: pz - cz * 0.1 }));
        g.add(place(box(0.6, 7, 0.6, stone), { x: px - cx * 0.2, y: y0 + 20, z: pz - cz * 0.2 }));
        g.add(place(pinnacle(0.35, 3.2), { x: px - cx * 0.2, y: y0 + TOWER.h, z: pz - cz * 0.2 }));
      }
    }
    // parapet and octagonal copper spire
    const top = y0 + TOWER.h;
    g.add(place(parapet({ w: TOWER.s - 0.6, d: TOWER.s - 0.6, h: 0.9, t: 0.3, material: mat(STONE_L) }), { x: tx, y: top, z: tz }));
    g.add(place(extrude(octagon(1.75), 1.6, stone), { x: tx, y: top, z: tz }));
    g.add(place(cone(2.0, 11, copper, 8), { x: tx, y: top + 1.6, z: tz, ry: 22.5 }));
    // little dormers (lucarnes) on the spire
    for (let k = 0; k < 4; k++) {
      const a = (k * Math.PI) / 2;
      g.add(place(gableRoof({ w: 0.7, d: 0.8, h: 0.6, ridge: 'z', overhang: 0.05, material: copper, gableMaterial: stone }),
        { x: tx + Math.sin(a) * 1.4, y: top + 4.2, z: tz + Math.cos(a) * 1.4, ry: (k * 90) }));
      g.add(place(box(0.7, 0.8, 0.8, stone), { x: tx + Math.sin(a) * 1.4, y: top + 3.4, z: tz + Math.cos(a) * 1.4, ry: k * 90 }));
    }
    g.add(place(sphere(0.3, metal(PALETTE.glassGold)), { x: tx, y: top + 12.4, z: tz }));
    g.add(place(box(0.12, 1.6, 0.12, metal(PALETTE.glassGold)), { x: tx, y: top + 12.9, z: tz }));
    g.add(place(box(0.8, 0.12, 0.12, metal(PALETTE.glassGold)), { x: tx, y: top + 13.9, z: tz }));
    // side portal
    g.add(place(portal({ w: 1.7, spring: 2.2 }), { x: tx, y: y0, z: tz + TOWER.s / 2 }));
  }

  // ---- centre of the west front: main portal, rose window, king's gallery
  const fw = (TOWER.x - TOWER.s / 2) * 2;
  g.add(place(windowWall(fw, NH, { bay: fw, sill: 0, top: 1, ww: 1, kind: 'none', bands: [6.6, 13.4] }), { y: y0, z: Z_FRONT + 0.03 }));
  g.add(place(windowWall(fw, 1.5, { bay: 0.78, sill: 0.15, top: 1.35, ww: 0.42, kind: 'blind' }), { y: y0 + 13.5, z: Z_FRONT + 0.05 }));
  g.add(place(roseWindow(2.35), { y: y0 + 10.0, z: Z_FRONT }));
  g.add(place(portal({ w: 2.4, spring: 2.7 }), { y: y0, z: Z_FRONT }));
  g.add(place(pinnacle(0.35, 2.6), { y: y0 + NH + RH - 0.7, z: Z_FRONT }));
  // three stepped lancets in the gable
  for (const [lx, lh] of [[-1, 1.6], [0, 2.4], [1, 1.6]]) {
    g.add(place(archSlab(0.85, lh, 0.12, STONE_L), { x: lx * 1.05, y: y0 + NH + 0.6, z: Z_FRONT }));
    g.add(place(archSlab(0.55, lh, 0.16, mat(GLASS)), { x: lx * 1.05, y: y0 + NH + 0.75, z: Z_FRONT }));
  }

  // ---- parvis: lamps, benches, trees, hedges
  for (const sx of [-1, 1]) {
    g.add(place(streetLamp({ h: 4.2 }), { x: sx * 3.4, y: y0, z: 14.3, ry: sx > 0 ? 180 : 0 }));
    g.add(place(bench({ w: 1.6 }), { x: sx * 6.2, y: y0, z: 13.9, ry: 180 }));
    g.add(place(tree({ kind: 'round', h: 5.2, seed: 20 + sx }), { x: sx * 8.3, y: y0, z: 13.3 }));
    g.add(place(tree({ kind: 'bush', h: 1.3, seed: 30 + sx }), { x: sx * 8.8, y: y0, z: 9.6 }));
    g.add(place(tree({ kind: 'cone', h: 5, seed: 40 + sx }), { x: sx * 8.6, y: y0, z: 7.3 }));
    g.add(place(hedge({ w: 4.6, h: 0.9, d: 0.6 }), { x: sx * 8.95, y: y0, z: 2.6, ry: 90 }));
  }

  // ---- churchyard behind the west aisle and apse: headstones, yew, wall
  const head = mat('#9a978f');
  const headDark = mat('#7f7c74');
  for (let row = 0; row < 3; row++) {
    for (let k = 0; k < 4; k++) {
      const x = -9.4 + row * 1.35;
      const z = -10.2 - k * 1.25;
      const hs = (row + k) % 3 === 0 ? box(0.35, 0.9, 0.12, head) : box(0.55, 0.65, 0.14, headDark);
      g.add(place(hs, { x, y: y0, z, ry: 90 }));
      if ((row + k) % 4 === 1) g.add(place(box(0.08, 0.9, 0.08, head), { x: x + 0.25, y: y0, z }));
    }
  }
  g.add(place(tree({ kind: 'cone', h: 6, seed: 51, color: PALETTE.foliageDark }), { x: -5.6, y: y0, z: -13.2 }));
  g.add(place(box(5.6, 0.7, 0.3, mat(STONE_D)), { x: -7.1, y: y0, z: -14.7 }));
  g.add(place(box(0.3, 0.7, 5.2, mat(STONE_D)), { x: -9.85, y: y0, z: -12.2 }));
  // garden on the east side
  g.add(place(tree({ kind: 'round', h: 6, seed: 61 }), { x: 7.4, y: y0, z: -12.3 }));
  g.add(place(tree({ kind: 'autumn', h: 5, seed: 62 }), { x: 5.4, y: y0, z: -13.9 }));
  g.add(place(bench({ w: 1.6 }), { x: 8.0, y: y0, z: -9.6, ry: 180 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 63 }), { x: 9.2, y: y0, z: -14.2 }));
  return g;
}

function octagon(r) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  return pts;
}

// Half-cone roof over the apse: each wall edge slopes up to the ridge end.
function apseRoof(pts, zc, h, material) {
  const b = new ShapeBuilder();
  const o = 0.35;
  const out = pts.map(([x, z]) => {
    const dx = x, dz = z - zc, n = Math.hypot(dx, dz);
    return [x + (dx / n) * o, -o * h / NX, z + (dz / n) * o];
  });
  const apex = [0, h, zc];
  for (let i = 0; i < out.length - 1; i++) b.tri(out[i + 1], out[i], apex, 0);
  const m = material.clone();
  m.side = THREE.DoubleSide;
  return new THREE.Mesh(b.build(), m);
}

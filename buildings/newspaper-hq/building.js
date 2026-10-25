import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, sawtoothRoof, parapet, box, place, mat, metal, surface, glass,
  door, windowPanel, columns, streetLamp, beam, bench, tree, stairs, shade, cylinder, emissive,
} from '../../src/lib/index.js';
import {
  panelSign, rooftopLetters, clockFace, paperRoll, rollStack, forklift, deliveryVan, waterTank, newsBoxes,
} from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// West: 1920s sandstone press building with giant rooftop letters.
// East: brick printing hall with a sawtooth roof and a loading yard.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  const stoneLight = '#e3d3ae';
  const rustic = shade(PALETTE.sandstone, -0.12);
  const trim = mat(stoneLight);

  // ---------------------------------------------------------------- press building
  const hx = -4.4, hz = -1.0, hw = 9.6, hd = 7.4;
  const hFront = hz + hd / 2;
  const baseH = 4.4, upFloors = 3, upFH = 3.2;
  const upY = y0 + baseH + 0.35;
  const topY = upY + upFloors * upFH;

  // rusticated ground floor with tall windows
  g.add(place(facadeBlock({ w: hw, d: hd, h: baseH, floorHeight: baseH, style: 'punched', wall: rustic, glass: PALETTE.window, frame: stoneLight, windowW: 0.5, windowH: 0.62, bay: 2.6, lit: 0.35, seed: 3, blank: ['right'] }), { x: hx, y: y0, z: hz }));
  // horizontal rustication grooves
  for (let i = 1; i < 4; i++) g.add(place(box(hw + 0.04, 0.06, hd + 0.04, mat(shade(rustic, -0.2))), { x: hx, y: y0 + i * 1.1 - 0.03, z: hz }));
  g.add(place(box(hw + 0.3, 0.35, hd + 0.3, trim), { x: hx, y: y0 + baseH, z: hz }));

  // sandstone office floors
  g.add(place(facadeBlock({ w: hw, d: hd, floors: upFloors, floorHeight: upFH, style: 'punched', wall: PALETTE.sandstone, glass: PALETTE.window, frame: PALETTE.white, windowW: 0.46, windowH: 0.64, bay: 2.6, lit: 0.2, seed: 8 }), { x: hx, y: upY, z: hz }));
  // pilasters and corner quoins on the street face
  for (const dx of [-hw / 2 + 0.25, -2.4, 2.4, hw / 2 - 0.25]) {
    g.add(place(box(0.5, upFloors * upFH, 0.25, trim), { x: hx + dx, y: upY, z: hFront + 0.12 }));
  }
  for (const dx of [-hw / 2 + 0.25, hw / 2 - 0.25]) {
    g.add(place(box(0.25, upFloors * upFH, 0.5, trim), { x: hx + dx + Math.sign(dx) * 0.12, y: upY, z: hFront - 0.25 }));
  }
  // cornice + frieze + parapet
  g.add(place(box(hw + 0.2, 0.5, hd + 0.2, mat(shade(PALETTE.sandstone, -0.25))), { x: hx, y: topY - 0.5, z: hz }));
  g.add(place(box(hw + 0.7, 0.3, hd + 0.7, trim), { x: hx, y: topY, z: hz }));
  g.add(place(parapet({ w: hw + 0.2, d: hd + 0.2, h: 0.6, t: 0.3, material: mat(PALETTE.sandstone) }), { x: hx, y: topY + 0.3, z: hz }));
  g.add(place(box(hw - 0.4, 0.05, hd - 0.4, mat(PALETTE.roofBlack)), { x: hx, y: topY + 0.3, z: hz }));

  // entrance pavilion: projecting bay with tall window strip, clock and nameplate
  const pw = 3.6, pd = 0.7;
  const pz = hFront + pd / 2;
  g.add(place(box(pw, topY - y0 + 0.9, pd, mat(stoneLight)), { x: hx, y: y0, z: pz }));
  g.add(place(facadeBlock({ w: 1.7, d: 0.1, floors: 2, floorHeight: 2.75, style: 'grid', wall: PALETTE.navy, glass: PALETTE.glassDark, frame: PALETTE.glassGold, bay: 0.85, lit: 0.4, seed: 5 }), { x: hx, y: upY + 0.9, z: hFront + pd + 0.03 }));
  for (const dx of [-1.25, 1.25]) g.add(place(box(0.35, topY - upY - 1.15, 0.2, trim), { x: hx + dx, y: upY + 0.85, z: hFront + pd + 0.08 }));
  g.add(place(box(pw + 0.3, 0.3, pd + 0.3, mat(shade(PALETTE.sandstone, -0.25))), { x: hx, y: topY + 0.9, z: pz }));
  g.add(place(clockFace(0.85), { x: hx, y: upY + 7.9, z: hFront + pd + 0.08 }));
  g.add(place(panelSign('THE TINY TIMES', 3.4, 0.62, { bg: '#1c3a2c', fg: '#f2d47a', border: '#c9a24a', glow: 0.25 }), { x: hx, y: upY + 0.12, z: hFront + pd }));

  // doorway, portico and steps
  g.add(place(box(2.6, 3.2, 0.1, mat(shade(rustic, -0.3))), { x: hx, y: y0 + 0.45, z: hFront + pd + 0.02 }));
  g.add(place(door({ w: 1.8, h: 2.7, color: PALETTE.woodDark, frame: PALETTE.glassGold }), { x: hx, y: y0 + 0.45, z: hFront + pd }));
  g.add(place(box(1.6, 0.4, 0.06, emissive(PALETTE.windowLit, 0.4)), { x: hx, y: y0 + 2.85, z: hFront + pd + 0.13 }));
  g.add(place(box(3.6, 0.45, 0.6, trim), { x: hx, y: y0, z: hFront + pd + 0.3 }));
  g.add(place(stairs({ w: 3.4, h: 0.45, d: 0.8, steps: 3 }), { x: hx, y: y0, z: hFront + pd + 1.0 }));
  g.add(place(columns({ count: 2, length: 3.0, radius: 0.2, h: 3.4, material: trim }), { x: hx, y: y0 + 0.45, z: hFront + pd + 0.38 }));
  g.add(place(box(3.6, 0.35, 0.9, trim), { x: hx, y: y0 + 3.85, z: hFront + pd + 0.4 }));

  // fire escape down the west wall
  const fx = hx - hw / 2 - 0.4;
  const iron = metal(PALETTE.black);
  for (let f = 0; f < upFloors; f++) {
    const fy = upY + f * upFH + 0.05;
    g.add(place(box(0.75, 0.08, 3.2, iron), { x: fx, y: fy, z: hz - 1.4 }));
    g.add(place(box(0.04, 0.9, 3.2, iron), { x: fx - 0.35, y: fy, z: hz - 1.4 }));
    g.add(place(box(0.75, 0.04, 0.04, iron), { x: fx, y: fy + 0.9, z: hz - 3.0 }));
    g.add(place(box(0.75, 0.04, 0.04, iron), { x: fx, y: fy + 0.9, z: hz + 0.2 }));
    const z0 = f % 2 ? hz - 2.8 : hz + 0.0;
    const z1 = f % 2 ? hz + 0.0 : hz - 2.8;
    if (f > 0) g.add(beam([fx, fy - upFH + 0.08, z0], [fx, fy, z1], 0.12, iron));
  }
  g.add(place(box(0.08, 2.4, 0.5, iron), { x: fx, y: upY - 2.4, z: hz - 2.8 }));

  // rooftop: giant letters, water tank, stair hut
  const roofY = topY + 0.3;
  g.add(place(rooftopLetters('TINY TIMES', { w: hw - 0.4, h: 2.5, lift: 0.8 }), { x: hx, y: roofY, z: hFront - 0.75 }));
  g.add(place(waterTank({ r: 1.0, h: 2.0, legH: 1.4 }), { x: hx - 3.2, y: roofY, z: hz - 2.3 }));
  g.add(place(box(2.2, 2.4, 1.8, mat(PALETTE.sandstone)), { x: hx + 2.6, y: roofY, z: hz - 2.4 }));
  g.add(place(box(2.5, 0.2, 2.1, mat(shade(PALETTE.sandstone, -0.25))), { x: hx + 2.6, y: roofY + 2.4, z: hz - 2.4 }));
  g.add(place(door({ w: 0.9, h: 1.9, color: PALETTE.steelDark }), { x: hx + 2.6, y: roofY, z: hz - 1.5 }));
  g.add(place(cylinder(0.05, 0.05, 6, metal(PALETTE.steelLight), 6), { x: hx - 0.3, y: roofY, z: hz - 2.6 }));
  g.add(place(box(1.5, 0.95, 0.03, mat(PALETTE.navy)), { x: hx + 0.45, y: roofY + 4.95, z: hz - 2.6 }));
  g.add(place(box(0.5, 0.95, 0.035, mat('#f2d47a')), { x: hx + 0.05, y: roofY + 4.95, z: hz - 2.6 }));

  // ---------------------------------------------------------------- printing hall
  const lx = 5.2, lw = 9.6, ld = 5.4, lz = -4.75 + ld / 2;
  const lFront = lz + ld / 2;
  const lH = 6.4;
  const brick = surface('brick', PALETTE.brick, { size: 2 });
  g.add(place(facadeBlock({ w: lw, d: ld, h: lH, floorHeight: lH, style: 'brick', wall: PALETTE.brick, glass: PALETTE.glassSky, frame: PALETTE.white, windowW: 0.6, windowH: 0.55, bay: 2.4, lit: 0.5, seed: 12, blank: ['left', 'front'] }), { x: lx, y: y0, z: lz }));
  g.add(place(box(lw, lH, 0.06, brick), { x: lx, y: y0, z: lFront }));
  g.add(place(sawtoothRoof({ w: lw, d: ld, h: 1.5, teeth: 3, material: surface('corrugated', PALETTE.roofGrey, { size: 2 }), glassMaterial: glass(PALETTE.glassSky) }), { x: lx, y: y0 + lH, z: lz }));
  // stepped brick front gable hides the sawtooth from the street
  g.add(place(box(lw + 0.2, 1.0, 0.35, brick), { x: lx, y: y0 + lH, z: lFront - 0.1 }));
  g.add(place(box(4.0, 0.7, 0.35, brick), { x: lx, y: y0 + lH + 1.0, z: lFront - 0.1 }));
  g.add(place(box(lw + 0.4, 0.18, 0.5, trim), { x: lx, y: y0 + lH + 0.9, z: lFront - 0.1 }));
  g.add(place(box(4.2, 0.18, 0.5, trim), { x: lx, y: y0 + lH + 1.7, z: lFront - 0.1 }));
  g.add(place(panelSign('PRINTING WORKS', 6.8, 0.95, { bg: '#f1e6c8', fg: '#7c3325', border: '#7c3325', depth: 0.1, glow: 0.1 }), { x: lx, y: y0 + 4.7, z: lFront + 0.03 }));
  // clerestory windows
  for (const dx of [-3.6, -1.2, 1.2, 3.6]) {
    g.add(place(windowPanel({ w: 1.6, h: 1.0, glassColor: PALETTE.glassSky, frame: PALETTE.white, lit: dx === -1.2 || dx === 3.6 }), { x: lx + dx, y: y0 + 3.45, z: lFront }));
  }

  // loading dock with two roll-up doors
  const dockH = 1.0, dockD = 0.9;
  g.add(place(box(lw, dockH, dockD, mat(PALETTE.concrete)), { x: lx, y: y0, z: lFront + dockD / 2 }));
  g.add(place(box(lw, 0.1, 0.12, surface('hazard', PALETTE.yellow, { size: 0.6 })), { x: lx, y: y0 + dockH - 0.1, z: lFront + dockD - 0.05 }));
  const bays = [lx - 2.4, lx + 2.4];
  const roller = surface('corrugated', PALETTE.steelLight, { size: 0.6, metalness: 0.3, roughness: 0.6 });
  for (const x of bays) {
    g.add(place(box(2.9, 2.5, 0.1, mat(PALETTE.steelDark)), { x, y: y0 + dockH, z: lFront + 0.03 }));
    g.add(place(box(2.6, 2.35, 0.1, roller), { x, y: y0 + dockH, z: lFront + 0.06 }));
    for (const dx of [-1.05, 1.05]) g.add(place(box(0.25, 0.5, 0.2, mat(PALETTE.black)), { x: x + dx, y: y0 + 0.3, z: lFront + dockD + 0.08 }));
    g.add(place(box(0.5, 0.12, 0.12, emissive(PALETTE.windowLit, 0.6)), { x, y: y0 + dockH + 2.65, z: lFront + 0.12 }));
  }
  // rolls waiting on the dock
  g.add(place(paperRoll({ standing: true, r: 0.38, len: 1.1 }), { x: lx - 0.55, y: y0 + dockH, z: lFront + 0.45 }));
  g.add(place(paperRoll({ standing: true, r: 0.38, len: 1.1 }), { x: lx + 0.3, y: y0 + dockH, z: lFront + 0.45 }));
  g.add(place(paperRoll({ standing: true, r: 0.38, len: 1.1 }), { x: lx + 4.3, y: y0 + dockH, z: lFront + 0.45 }));

  // ---------------------------------------------------------------- yard
  const yardZ0 = lFront + dockD;
  g.add(place(patch(lw + 0.4, 5 - yardZ0, 'asphalt'), { x: lx, y: y0, z: (yardZ0 + 5) / 2 }));
  for (const x of [lx - 4.8 + 0.15, lx + 4.8 - 0.15]) g.add(place(box(0.12, 0.02, 3.6, mat(PALETTE.roadLine)), { x, y: y0 + 0.05, z: yardZ0 + 1.9 }));
  const vanColors = [PALETTE.navy, '#1c3a2c'];
  bays.forEach((x, i) => {
    g.add(place(deliveryVan({ color: vanColors[i] }), { x, y: y0 + 0.05, z: yardZ0 + 1.85, ry: -90, s: 0.75 }));
  });
  g.add(place(rollStack({ r: 0.42, len: 1.2, base: 3 }), { x: lx, y: y0 + 0.05, z: yardZ0 + 0.9 }));
  g.add(place(forklift(), { x: lx + 0.2, y: y0 + 0.05, z: yardZ0 + 2.95, ry: 180, s: 0.85 }));
  g.add(place(paperRoll({ standing: true, r: 0.36, len: 1.0 }), { x: lx - 1.0, y: y0 + 0.2, z: yardZ0 + 2.95 }));
  // stacked newspaper bundles on a pallet
  g.add(place(box(1.1, 0.15, 0.9, mat(PALETTE.woodLight)), { x: 0.6 + 0.1, y: y0, z: 4.3 }));
  for (let i = 0; i < 4; i++) g.add(place(box(0.95, 0.22, 0.75, mat(i % 2 ? '#e8e3d3' : '#d9d3c0')), { x: 0.7, y: y0 + 0.15 + i * 0.23, z: 4.3 }));

  // ---------------------------------------------------------------- street front
  g.add(place(patch(hw + 0.6, 5 - hFront, 'paved'), { x: hx, y: y0, z: (hFront + 5) / 2 }));
  g.add(place(newsBoxes(), { x: hx - 3.4, y: y0, z: hFront + 0.55 }));
  g.add(place(bench({ w: 1.6 }), { x: hx + 3.5, y: y0, z: hFront + 0.6 }));
  for (const x of [-9.3, hx + 2.2]) g.add(place(streetLamp({ h: 4.2 }), { x, y: y0, z: 4.5, ry: x < hx ? 0 : 180 }));
  for (const x of [hx - 2.6, hx + 5.1]) {
    g.add(place(box(1.0, 0.5, 1.0, mat(PALETTE.stoneDark)), { x, y: y0, z: 4.35 }));
    g.add(place(tree({ kind: 'bush', h: 1.3, seed: Math.round(x * 7) }), { x, y: y0 + 0.5, z: 4.35 }));
  }
  return g;
}

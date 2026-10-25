import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, rooftopUnits, door, windowPanel, box, place, mat, metal, surface,
  streetLamp, bench, emissive, tree, flag, stairs,
} from '../../src/lib/index.js';
import { POST_RED, POST_YELLOW, flatSign, pillarBox, postVan, rollerShutter, parcelPallet, rollCage } from './props.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Left: two-storey red-brick post office with a POST pediment.
// Right: single-storey parcel shed with a loading dock and red vans in the yard.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'paved'));

  const stone = mat(PALETTE.offWhite);
  const stoneDark = mat(PALETTE.stone);
  const brick = { style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.6, lit: 0.15, seed: 31, roof: PALETTE.concreteDark };

  // ---- main post office block
  const mx = -1.9, mz = -1.6, mw = 6.0, md = 5.6, fh = 3.2;
  const front = mz + md / 2; // z = 1.2
  g.add(place(facadeBlock({ w: mw, d: md, floors: 1, floorHeight: fh, bay: 2, ...brick, blank: ['front'] }), { x: mx, y: y0, z: mz }));
  g.add(place(facadeBlock({ w: mw, d: md, floors: 1, floorHeight: fh, bay: 2, ...brick, seed: 32 }), { x: mx, y: y0 + fh, z: mz }));
  // stone plinth, string course, cornice
  g.add(place(box(mw + 0.12, 0.45, md + 0.12, stoneDark), { x: mx, y: y0, z: mz }));
  g.add(place(box(mw + 0.16, 0.18, md + 0.16, stone), { x: mx, y: y0 + fh - 0.05, z: mz }));
  g.add(place(parapet({ w: mw + 0.36, d: md + 0.36, h: 0.3, t: 0.6, material: stone }), { x: mx, y: y0 + 2 * fh, z: mz }));
  const roofY = y0 + 2 * fh + 0.3;
  g.add(place(box(mw - 0.4, 0.06, md - 0.4, mat(PALETTE.roofGrey)), { x: mx, y: y0 + 2 * fh, z: mz }));
  g.add(place(parapet({ w: mw, d: md, h: 0.55, t: 0.25, material: mat(PALETTE.brick) }), { x: mx, y: roofY, z: mz }));
  g.add(place(parapet({ w: mw + 0.1, d: md + 0.1, h: 0.08, t: 0.35, material: stone }), { x: mx, y: roofY + 0.55, z: mz }));
  g.add(place(rooftopUnits({ w: mw - 1.2, d: md - 2.5, count: 2, seed: 4 }), { x: mx, y: roofY, z: mz - 1.0 }));
  // stone quoins on the front corners
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      g.add(place(box(0.32, 0.45, 0.32, stone), { x: mx + sx * (mw / 2 - 0.1), y: y0 + 0.5 + i * 0.95, z: front - 0.1 }));
    }
  }

  // ground floor shop front: door between two tall windows, red fascia with POST OFFICE
  for (const dx of [-1.9, 1.9]) {
    g.add(place(box(1.6, 1.95, 0.08, stone), { x: mx + dx, y: y0 + 0.45, z: front }));
    g.add(place(windowPanel({ w: 1.3, h: 1.55, lit: false }), { x: mx + dx, y: y0 + 0.6, z: front + 0.02 }));
    g.add(place(box(0.06, 1.55, 0.14, mat(PALETTE.white)), { x: mx + dx, y: y0 + 0.6, z: front + 0.05 }));
    g.add(place(box(1.6, 0.12, 0.3, stone), { x: mx + dx, y: y0 + 0.55, z: front + 0.1 }));
  }
  g.add(place(box(2.0, 2.3, 0.1, stone), { x: mx, y: y0 + 0.2, z: front }));
  g.add(place(door({ w: 1.5, h: 2.1, color: POST_RED }), { x: mx, y: y0 + 0.2, z: front + 0.02 }));
  g.add(place(box(0.05, 2.0, 0.17, mat(PALETTE.black)), { x: mx, y: y0 + 0.22, z: front + 0.02 }));
  g.add(place(stairs({ w: 2.2, h: 0.2, d: 0.6, steps: 2, material: stoneDark }), { x: mx, y: y0, z: front + 0.35 }));
  g.add(place(flatSign({ text: 'POST OFFICE', w: 5.4, h: 0.62, depth: 0.14, bg: POST_RED, fg: POST_YELLOW, border: POST_YELLOW }), { x: mx, y: y0 + fh - 0.68, z: front + 0.04 }));
  // projecting double-sided POST sign on the corner, readable from the side views
  g.add(place(box(0.08, 0.08, 0.8, metal(PALETTE.darkGrey)), { x: mx - mw / 2 + 0.7, y: y0 + fh + 1.75, z: front + 0.4 }));
  g.add(place(flatSign({ text: 'POST', w: 0.9, h: 0.55, depth: 0.08, bg: POST_RED, fg: POST_YELLOW, double: true }), { x: mx - mw / 2 + 0.7, y: y0 + fh + 1.15, z: front + 0.55, ry: 90 }));

  // pediment on the front parapet with the big POST sign
  const pedY = roofY;
  g.add(place(box(3.6, 1.7, 0.4, mat(PALETTE.brick)), { x: mx, y: pedY, z: front - 0.2 }));
  g.add(place(box(3.8, 0.16, 0.5, stone), { x: mx, y: pedY + 1.7, z: front - 0.2 }));
  g.add(place(box(2.0, 0.3, 0.42, stone), { x: mx, y: pedY + 1.86, z: front - 0.2 }));
  g.add(place(flatSign({ text: 'POST', w: 3.1, h: 1.3, depth: 0.12, bg: POST_RED, fg: '#ffffff', border: POST_YELLOW }), { x: mx, y: pedY + 0.2, z: front + 0.02 }));
  // back of the pediment also carries the name for the rear views
  g.add(place(flatSign({ text: 'POST', w: 3.1, h: 1.3, depth: 0.12, bg: POST_RED, fg: '#ffffff', border: POST_YELLOW }), { x: mx, y: pedY + 0.2, z: front - 0.42, ry: 180 }));
  g.add(place(flag({ h: 3.2, color: POST_RED, color2: '#a81d16' }), { x: mx + 2.4, y: roofY, z: mz - 1.6 }));

  // ---- parcel shed with loading dock (right)
  const sx = 3.05, sz = -3.1, sw = 3.5, sd = 3.4, sh = 3.8;
  const shedFront = sz + sd / 2; // z = -1.4
  g.add(place(facadeBlock({ w: sw, d: sd, h: sh, floorHeight: sh, bay: 1.75, style: 'industrial', wall: PALETTE.brickDark, frame: PALETTE.white, glass: PALETTE.window, lit: 0, seed: 7, roof: PALETTE.concreteDark, blank: ['front', 'left'] }), { x: sx, y: y0, z: sz }));
  g.add(place(parapet({ w: sw, d: sd, h: 0.35, t: 0.2, material: stone }), { x: sx, y: y0 + sh, z: sz }));
  g.add(place(box(sw + 0.1, 0.5, 0.12, mat(POST_YELLOW)), { x: sx, y: y0 + sh - 0.55, z: shedFront }));
  g.add(place(flatSign({ text: 'PARCELS', w: 2.6, h: 0.45, depth: 0.06, bg: POST_YELLOW, fg: POST_RED }), { x: sx, y: y0 + sh - 0.53, z: shedFront + 0.05 }));
  // yellow band + name on the back and the street-end side too
  g.add(place(box(sw + 0.1, 0.5, 0.12, mat(POST_YELLOW)), { x: sx, y: y0 + sh - 0.55, z: sz - sd / 2 }));
  g.add(place(flatSign({ text: 'PARCELS', w: 2.6, h: 0.45, depth: 0.06, bg: POST_YELLOW, fg: POST_RED }), { x: sx, y: y0 + sh - 0.53, z: sz - sd / 2 - 0.05, ry: 180 }));
  g.add(place(box(0.12, 0.5, sd + 0.1, mat(POST_YELLOW)), { x: sx + sw / 2, y: y0 + sh - 0.55, z: sz }));
  g.add(place(flatSign({ text: 'PARCELS', w: 2.6, h: 0.45, depth: 0.06, bg: POST_YELLOW, fg: POST_RED }), { x: sx + sw / 2 + 0.05, y: y0 + sh - 0.53, z: sz, ry: 90 }));
  // dock platform with bumpers, shutters and canopy
  const dockH = 0.9, dockD = 1.0;
  g.add(place(box(sw, dockH, dockD, mat(PALETTE.concrete)), { x: sx, y: y0, z: shedFront + dockD / 2 }));
  g.add(place(box(sw, 0.12, 0.08, surface('hazard', PALETTE.yellow, { size: 0.6 })), { x: sx, y: y0 + dockH - 0.12, z: shedFront + dockD + 0.03 }));
  for (const dx of [-0.85, 0.85]) {
    g.add(place(rollerShutter({ w: 1.35, h: 2.1 }), { x: sx + dx, y: y0 + dockH, z: shedFront }));
    for (const bx of [-0.55, 0.55]) g.add(place(box(0.18, 0.4, 0.15, mat(PALETTE.black)), { x: sx + dx + bx, y: y0 + 0.35, z: shedFront + dockD + 0.07 }));
  }
  g.add(place(box(sw + 0.2, 0.12, 1.5, mat(PALETTE.steelLight)), { x: sx, y: y0 + 3.15, z: shedFront + 0.75 }));
  g.add(place(box(sw + 0.2, 0.2, 0.06, mat(POST_RED)), { x: sx, y: y0 + 3.07, z: shedFront + 1.5 }));
  g.add(place(parcelPallet(), { x: sx - 1.0, y: y0 + dockH, z: shedFront + 0.55 }));
  g.add(place(rollCage(), { x: sx + 0.15, y: y0 + dockH, z: shedFront + 0.45 }));

  // yard: asphalt with bay lines and two delivery vans backed up to the dock
  const yardZ0 = shedFront + dockD, yardZ1 = 5.0;
  g.add(place(patch(sw + 0.3, yardZ1 - yardZ0, 'asphalt'), { x: sx + 0.15, y: y0, z: (yardZ0 + yardZ1) / 2 }));
  for (const lx of [sx - 1.75, sx, sx + 1.75]) g.add(place(box(0.08, 0.02, 3.4, mat(PALETTE.roadLine)), { x: lx, y: y0 + 0.05, z: yardZ0 + 1.9 }));
  g.add(place(postVan(), { x: sx - 0.85, y: y0 + 0.05, z: yardZ0 + 1.7, ry: -90, s: 0.68 }));
  g.add(place(postVan(), { x: sx + 0.9, y: y0 + 0.05, z: yardZ0 + 2.35, ry: -90, s: 0.68 }));

  // ---- forecourt: pillar boxes, lamp, bench, planters
  g.add(place(patch(mw + 0.4, 5 - front, 'cobbles'), { x: mx - 0.2 + 0.1, y: y0, z: (front + 5) / 2 }));
  g.add(place(pillarBox(), { x: mx - 1.1, y: y0 + 0.05, z: 3.4 }));
  g.add(place(pillarBox(), { x: mx + 1.1, y: y0 + 0.05, z: 3.4 }));
  // stamp machine against the wall
  g.add(place(box(0.6, 1.4, 0.4, mat(POST_RED)), { x: mx + 2.6, y: y0, z: front + 0.25 }));
  g.add(place(box(0.4, 0.3, 0.05, emissive(PALETTE.glassSky, 0.4)), { x: mx + 2.6, y: y0 + 0.9, z: front + 0.47 }));
  g.add(place(bench({ w: 1.5 }), { x: mx - 2.2, y: y0, z: front + 0.55 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.6, y: y0, z: 4.5 }));
  for (const px of [mx - 3.0 + 0.55, 0.8]) {
    g.add(place(box(0.9, 0.45, 0.9, stoneDark), { x: px, y: y0, z: 4.5 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: Math.round(px * 10) }), { x: px, y: y0 + 0.45, z: 4.5 }));
  }
  return g;
}

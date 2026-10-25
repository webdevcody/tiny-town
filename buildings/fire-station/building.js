import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, pyramidRoof, box, cylinder, sphere, place, group,
  flag, signTexture, textured, tree, hedge, streetLamp, bench, surface, mat, metal, emissive, rooftopUnits, door,
} from '../../src/lib/index.js';

const FIRE_RED = '#d42a1e';

// Sign board whose text texture spans the whole front face (lib sign() maps UVs in metres).
function plate({ text, w, h, bg, fg, depth = 0.1, border = null }) {
  const tw = 256, th = Math.max(16, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, depth / 2 + 0.005);
  return group(box(w, h, depth, mat(bg)), face);
}

// Fire engine, ~4.8 m long, nose towards +z (origin = centre of its footprint, on the ground).
function fireEngine() {
  const red = mat(FIRE_RED, { roughness: 0.4, metalness: 0.3 });
  const white = mat(PALETTE.white);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const shutter = metal(PALETTE.steelLight, { roughness: 0.4 });
  const chrome = metal(PALETTE.chrome, { roughness: 0.25 });
  const black = mat(PALETTE.black);
  const L = 4.8, W = 1.9;
  const g = new THREE.Group();
  // chassis + rear body
  g.add(place(box(W - 0.1, 0.25, L - 0.2, mat(PALETTE.darkGrey)), { y: 0.3 }));
  g.add(place(box(W, 1.55, 3.2, red), { y: 0.5, z: -0.75 }));
  // roller-shutter lockers on both sides
  for (const sx of [-1, 1]) {
    for (const z of [-1.7, -0.75, 0.2]) {
      g.add(place(box(0.04, 0.95, 0.8, shutter), { x: sx * (W / 2 + 0.01), y: 0.68, z }));
    }
    g.add(place(box(0.03, 0.14, 3.2, white), { x: sx * (W / 2 + 0.02), y: 1.72, z: -0.75 }));
  }
  // cab
  const cabZ = 1.55, cabD = 1.5;
  g.add(place(box(W, 1.75, cabD, red), { y: 0.5, z: cabZ }));
  g.add(place(box(W - 0.2, 0.6, 0.05, glassM), { y: 1.5, z: cabZ + cabD / 2 + 0.01 }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.05, 0.5, 0.6, glassM), { x: sx * (W / 2 + 0.01), y: 1.55, z: cabZ + 0.35 }));
    g.add(place(box(0.05, 0.5, 0.5, glassM), { x: sx * (W / 2 + 0.01), y: 1.55, z: cabZ - 0.35 }));
    g.add(place(box(0.03, 0.14, cabD, white), { x: sx * (W / 2 + 0.02), y: 1.0, z: cabZ }));
  }
  // grille, bumper, headlights
  g.add(place(box(1.0, 0.45, 0.05, chrome), { y: 0.75, z: cabZ + cabD / 2 + 0.01 }));
  g.add(place(box(W + 0.05, 0.22, 0.18, chrome), { y: 0.35, z: cabZ + cabD / 2 + 0.05 }));
  for (const sx of [-1, 1]) g.add(place(box(0.28, 0.18, 0.05, emissive('#fff6d0', 0.8)), { x: sx * 0.72, y: 0.85, z: cabZ + cabD / 2 + 0.02 }));
  // light bar on the cab roof
  g.add(place(box(1.3, 0.12, 0.3, black), { y: 2.25, z: cabZ + 0.2 }));
  g.add(place(box(0.55, 0.16, 0.26, emissive('#3a7bff', 1.4)), { x: -0.33, y: 2.33, z: cabZ + 0.2 }));
  g.add(place(box(0.55, 0.16, 0.26, emissive('#ff3020', 1.4)), { x: 0.33, y: 2.33, z: cabZ + 0.2 }));
  // ladder on the roof: two rails with rungs, resting on posts
  const lad = new THREE.Group();
  for (const sx of [-0.38, 0.38]) lad.add(place(box(0.08, 0.12, 4.2, shutter), { x: sx }));
  for (let i = 0; i < 12; i++) lad.add(place(box(0.76, 0.05, 0.06, shutter), { y: 0.03, z: -2 + i * 0.36 }));
  g.add(place(lad, { y: 2.2, z: 0.0 }));
  g.add(place(box(0.9, 0.18, 0.25, black), { y: 2.05, z: -1.95 }));
  // hose reel at the back
  const reel = cylinder(0.32, 0.32, 0.35, mat(PALETTE.yellow), 12);
  reel.rotation.z = Math.PI / 2;
  g.add(place(group(reel), { y: 1.25, z: -L / 2 + 0.1 }));
  // wheels
  for (const z of [1.4, -1.0, -1.85]) for (const sx of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 12);
    wg.rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(wg, black);
    wheel.position.set(sx * (W / 2 - 0.1), 0.42, z);
    g.add(wheel);
    g.add(place(cylinder(0.18, 0.18, 0.02, chrome, 8), { x: sx * (W / 2 + 0.06), y: 0.42, z, rz: 90 }));
  }
  return g;
}

// Red sectional garage door with panel ribs and a strip of small windows.
function garageDoor(w, h, open = false) {
  const g = new THREE.Group();
  const frameM = mat(PALETTE.white);
  g.add(place(box(w + 0.2, h + 0.15, 0.06, frameM), { z: 0.03 }));
  if (open) {
    g.add(place(box(w, h, 0.08, mat('#1d1a18')), { z: 0.05 }));
    g.add(place(box(w, 0.45, 0.12, mat(FIRE_RED)), { y: h - 0.45, z: 0.07 }));
    return g;
  }
  g.add(place(box(w, h, 0.1, mat(FIRE_RED, { roughness: 0.45 })), { z: 0.06 }));
  const rib = mat('#a81c14');
  for (let i = 1; i < 6; i++) g.add(place(box(w, 0.05, 0.13, rib), { y: (h * i) / 6, z: 0.06 }));
  for (let i = 0; i < 4; i++) {
    const ww = (w - 0.5) / 4;
    g.add(place(box(ww - 0.08, 0.3, 0.13, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { x: -w / 2 + 0.25 + ww * (i + 0.5), y: h * 0.62, z: 0.07 }));
  }
  return g;
}

// 1x1 tile (10 x 10 m). Front (street, apron) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'concrete'));

  const brick = { style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.45, windowH: 0.55, lit: 0.15, seed: 7, roof: PALETTE.concreteDark };
  const trim = mat(PALETTE.cream);

  // ---- engine hall: tall ground floor (garage) + one office storey
  const hx = -0.9, hz = -1.6, hw = 7.6, hd = 5.6;
  const gfH = 4.0, upH = 3.0;
  g.add(place(facadeBlock({ w: hw, d: hd, h: gfH, floorHeight: gfH, bay: 2.5, ...brick, blank: ['front'] }), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.2, 0.3, hd + 0.2, trim), { x: hx, y: y0 + gfH - 0.05, z: hz }));
  g.add(place(facadeBlock({ w: hw, d: hd, floors: 1, bay: 1.9, ...brick, seed: 8 }), { x: hx, y: y0 + gfH + 0.25, z: hz }));
  const roofY = y0 + gfH + 0.25 + upH;
  g.add(place(box(hw + 0.25, 0.25, hd + 0.25, trim), { x: hx, y: roofY, z: hz }));
  g.add(place(parapet({ w: hw, d: hd, h: 0.55, t: 0.25, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: hx, y: roofY + 0.25, z: hz }));
  g.add(place(box(hw - 0.5, 0.04, hd - 0.5, surface('gravel', PALETTE.gravel, { size: 3 })), { x: hx, y: roofY + 0.25, z: hz }));
  g.add(place(rooftopUnits({ w: hw - 2, d: hd - 1.5, count: 2, seed: 4, material: mat(PALETTE.steelLight) }), { x: hx - 1, y: roofY + 0.29, z: hz }));
  // back door with a small canopy
  g.add(place(door({ w: 1.0, h: 2.2, color: FIRE_RED }), { x: hx - 2.2, y: y0, z: hz - hd / 2, ry: 180 }));
  g.add(place(box(1.6, 0.12, 0.8, trim), { x: hx - 2.2, y: y0 + 2.5, z: hz - hd / 2 - 0.4 }));

  // three garage doors between cream pilasters; the middle one is open
  const doorW = 2.0, doorH = 3.0, frontZ = hz + hd / 2;
  for (let i = 0; i < 4; i++) {
    const px = hx - hw / 2 + 0.2 + i * (doorW + 0.4);
    g.add(place(box(0.4, doorH + 0.1, 0.16, trim), { x: px, y: y0, z: frontZ + 0.08 }));
  }
  for (let i = 0; i < 3; i++) {
    const dx = hx - hw / 2 + 0.4 + doorW / 2 + i * (doorW + 0.4);
    g.add(place(garageDoor(doorW, doorH, i === 1), { x: dx, y: y0, z: frontZ }));
  }
  // station sign on a cream lintel above the doors + number badge on the parapet
  g.add(place(box(hw, gfH - doorH - 0.05, 0.2, trim), { x: hx, y: y0 + doorH + 0.1 - 0.05, z: frontZ + 0.1 }));
  g.add(place(plate({ text: 'FIRE STATION', w: 5.6, h: 0.7, bg: FIRE_RED, fg: '#ffffff', depth: 0.1 }), { x: hx, y: y0 + doorH + 0.17, z: frontZ + 0.25 }));
  g.add(place(box(1.6, 1.3, 0.3, trim), { x: hx, y: roofY + 0.25, z: frontZ - 0.02 }));
  g.add(place(box(1.0, 0.15, 0.4, trim), { x: hx, y: roofY + 1.55, z: frontZ - 0.02 }));
  g.add(place(plate({ text: '7', w: 0.8, h: 0.8, bg: FIRE_RED, fg: '#ffffff', depth: 0.08, border: PALETTE.yellow }), { x: hx, y: roofY + 0.5, z: frontZ + 0.15 }));
  // siren on the roof
  g.add(place(cylinder(0.06, 0.06, 1.2, metal(PALETTE.steelDark), 6), { x: hx + 2.6, y: roofY + 0.25, z: hz - 1.6 }));
  g.add(place(cylinder(0.3, 0.18, 0.35, metal(PALETTE.steelLight), 8), { x: hx + 2.6, y: roofY + 1.45, z: hz - 1.6 }));

  // ---- hose-drying tower at the back right
  const tx = 3.9, tz = -2.7, tw = 2.0, td = 2.4, tH = 10.5;
  g.add(place(facadeBlock({ w: tw, d: td, h: tH, floorHeight: 3.5, bay: 1.2, ...brick, windowW: 0.4, windowH: 0.45, seed: 9 }), { x: tx, y: y0, z: tz }));
  for (const yy of [gfH, gfH + 3.5]) g.add(place(box(tw + 0.15, 0.2, td + 0.15, trim), { x: tx, y: y0 + yy, z: tz }));
  // open louvred belfry-style top where hoses hang to dry
  const topY = y0 + tH;
  g.add(place(box(tw + 0.25, 0.25, td + 0.25, trim), { x: tx, y: topY, z: tz }));
  const louvre = mat(PALETTE.woodDark);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(box(0.3, 1.5, 0.3, surface('brick', PALETTE.brick, { size: 1 })), { x: tx + sx * (tw / 2 - 0.15), y: topY + 0.25, z: tz + sz * (td / 2 - 0.15) }));
  }
  g.add(place(box(tw - 0.6, 1.5, td - 0.6, mat('#2a2522')), { x: tx, y: topY + 0.25, z: tz }));
  for (let i = 0; i < 4; i++) {
    g.add(place(box(tw - 0.6, 0.1, 0.12, louvre), { x: tx, y: topY + 0.45 + i * 0.35, z: tz + td / 2 - 0.3 }));
    g.add(place(box(0.12, 0.1, td - 0.6, louvre), { x: tx + tw / 2 - 0.3, y: topY + 0.45 + i * 0.35, z: tz }));
    g.add(place(box(0.12, 0.1, td - 0.6, louvre), { x: tx - tw / 2 + 0.3, y: topY + 0.45 + i * 0.35, z: tz }));
  }
  g.add(place(box(tw + 0.25, 0.2, td + 0.25, trim), { x: tx, y: topY + 1.75, z: tz }));
  g.add(place(pyramidRoof({ w: tw + 0.1, d: td + 0.1, h: 1.6, overhang: 0.2, material: surface('roofTiles', PALETTE.roofSlate, { size: 1.5 }) }), { x: tx, y: topY + 1.95, z: tz }));
  g.add(place(flag({ h: 2.2, color: FIRE_RED, color2: PALETTE.white }), { x: tx, y: topY + 3.3, z: tz, ry: 180 }));
  // hoses hanging down the tower's street face from a davit arm
  const hoseFace = tz + td / 2;
  g.add(place(box(tw - 0.2, 0.15, 0.35, metal(PALETTE.steelDark)), { x: tx, y: topY - 0.4, z: hoseFace + 0.17 }));
  const hoseM = mat('#efe6cc', { roughness: 0.9 });
  for (const [i, len] of [[-1, 4.2], [0, 5.4], [1, 3.6]]) {
    g.add(place(box(0.16, len, 0.08, hoseM), { x: tx + i * 0.5, y: topY - 0.4 - len, z: hoseFace + 0.25 }));
    g.add(place(box(0.2, 0.14, 0.12, metal(PALETTE.chrome)), { x: tx + i * 0.5, y: topY - 0.55 - len, z: hoseFace + 0.25 }));
  }
  // small side door into the tower
  g.add(place(box(0.95, 2.15, 0.08, mat(PALETTE.white)), { x: tx, y: y0, z: hoseFace + 0.03 }));
  g.add(place(box(0.8, 2.05, 0.12, mat(FIRE_RED)), { x: tx, y: y0, z: hoseFace + 0.05 }));

  // ---- apron with the engine pulling out of the middle bay
  const apronD = 5 - frontZ;
  g.add(place(patch(hw, apronD, 'asphalt'), { x: hx, y: y0, z: frontZ + apronD / 2 }));
  const yellow = mat(PALETTE.yellow);
  for (let i = 0; i < 4; i++) {
    const lx = hx - hw / 2 + 0.2 + i * (doorW + 0.4);
    g.add(place(box(0.12, 0.02, apronD - 0.4, yellow), { x: lx, y: y0 + 0.05, z: frontZ + apronD / 2 }));
  }
  g.add(place(box(hw, 0.03, 0.35, surface('hazard', PALETTE.yellow, { size: 1 })), { x: hx, y: y0 + 0.04, z: frontZ + 0.25 }));
  g.add(place(fireEngine(), { x: hx, y: y0 + 0.05, z: frontZ + 1.4 }));

  // ---- side yard: hydrant, cones, lamp, bench, greenery
  const hydrant = group(
    cylinder(0.16, 0.18, 0.6, mat(FIRE_RED), 10),
    place(sphere(0.16, mat(FIRE_RED), 10), { y: 0.48 }),
    place(box(0.5, 0.12, 0.12, mat(FIRE_RED)), { y: 0.35 }),
  );
  g.add(place(hydrant, { x: 3.4, y: y0, z: 3.8 }));
  for (const [cx, cz] of [[-4.5, 4.6], [-4.5, 3.6]]) {
    g.add(place(group(
      box(0.4, 0.05, 0.4, mat(PALETTE.black)),
      place(cylinder(0.04, 0.17, 0.55, mat(PALETTE.orange), 10), { y: 0.05 }),
      place(cylinder(0.11, 0.13, 0.1, mat(PALETTE.white), 10), { y: 0.3 }),
    ), { x: cx, y: y0, z: cz }));
  }
  g.add(place(patch(2.0, 6.0, 'grass'), { x: 4.0, y: y0, z: 1.9 }));
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 12 }), { x: 4.1, y: y0, z: 0.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 13 }), { x: 4.4, y: y0, z: 2.4 }));
  g.add(place(bench({ w: 1.3 }), { x: 4.3, y: y0, z: 3.1, ry: -90 }));
  g.add(place(streetLamp({ h: 4 }), { x: 4.5, y: y0, z: 4.6, ry: 180 }));
  g.add(place(hedge({ w: 2.2, h: 0.8, d: 0.5 }), { x: 3.9, y: y0, z: -4.65 }));
  g.add(place(flag({ h: 5.5, color: PALETTE.navy, color2: PALETTE.white }), { x: 3.2, y: y0, z: 4.6 }));
  return g;
}

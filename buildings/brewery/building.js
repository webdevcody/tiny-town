import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, mansardRoof, box, cylinder, cone, sphere, place, group,
  dome, tank, pipeRun, door, sign, fence, tree, car, streetLamp, bench,
  surface, mat, glass, emissive, metal, shade, textured, signTexture,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left: malt tower with hoist. Middle: brewhouse hall with copper vats behind
// tall arched windows. Right: cobbled yard with chimney, tanks and barrels.

const COPPER = '#c8743a';
const PAINT = '#2f5a3c'; // Victorian green ironwork / window frames

const brickM = surface('brick', PALETTE.brick, { size: 1.2 });
const stoneM = mat(PALETTE.sandstone);
const slateM = surface('roofTiles', PALETTE.roofSlate, { size: 1.6 });
const copperM = mat(COPPER, { metalness: 0.35, roughness: 0.35, emissive: '#a0552a', emissiveIntensity: 0.55 });
const copperDarkM = mat(shade(COPPER, -0.25), { metalness: 0.45, roughness: 0.4 });
const paintM = mat(PAINT);
const woodM = mat(PALETTE.wood);
const hoopM = metal(PALETTE.steelDark);

const brickFacade = { style: 'brick', wall: PALETTE.brick, frame: PALETTE.cream, glass: PALETTE.window, bay: 1.8, lit: 0.15, seed: 52 };

/** Text sign facing +z (own UVs: the full texture spans the face). */
function signBoard({ text, w, h, bg = PAINT, fg = '#f4e3b0', border = '#d8b25a', depth = 0.15, double = false }) {
  const tw = 256, th = Math.max(16, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Small vintage brewery lorry with a flatbed of barrels, length along X (cab at +x). */
function dray(color) {
  const body = mat(color, { roughness: 0.5, metalness: 0.2 });
  const g = new THREE.Group();
  g.add(place(box(4.2, 0.35, 1.7, mat(PALETTE.darkGrey)), { y: 0.4 }));
  g.add(place(box(1.3, 1.3, 1.7, body), { x: 1.45, y: 0.75 }));
  g.add(place(box(0.6, 0.55, 1.6, body), { x: 2.35, y: 0.75 }));
  g.add(place(box(0.05, 0.55, 1.4, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 2.11, y: 1.35 }));
  g.add(place(box(0.8, 0.5, 1.74, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 1.55, y: 1.4 }));
  g.add(place(box(2.9, 0.12, 1.8, woodM), { x: -0.65, y: 0.75 }));
  for (const sz of [-1, 1]) g.add(place(box(2.9, 0.35, 0.06, mat(shade(color, 0.1))), { x: -0.65, y: 0.87, z: sz * 0.87 }));
  for (const [x, z] of [[-1.6, -0.42], [-1.6, 0.42], [-0.7, -0.42], [-0.7, 0.42], [0.2, -0.42], [0.2, 0.42]]) {
    g.add(place(barrel(0.34, 0.8), { x, y: 0.87, z }));
  }
  g.add(place(barrel(0.34, 0.8), { x: -1.15, y: 1.67, z: 0 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [1.5, -1.4]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.4, 0.4, 0.25, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.4, sz * 0.8);
    g.add(wheel);
  }
  return g;
}

/** Upright barrel, base at y = 0. */
function barrel(r = 0.38, h = 0.95, m = woodM) {
  const g = group(cylinder(r * 0.88, r * 0.88, h, m, 10));
  g.add(place(cylinder(r, r, h * 0.5, m, 10), { y: h * 0.25 }));
  for (const y of [0.12, 0.5, 0.82]) g.add(place(cylinder(r * (y === 0.5 ? 1.03 : 0.95), r * (y === 0.5 ? 1.03 : 0.95), 0.06, hoopM, 10), { y: h * y }));
  g.add(place(cylinder(r * 0.82, r * 0.82, 0.02, mat(PALETTE.woodLight), 10), { y: h }));
  return g;
}

/** Barrel lying on its side, axis along X, resting on y = 0. */
function lyingBarrel(r = 0.38, h = 0.95) {
  const b = place(barrel(r, h), { y: -h / 2 });
  return place(group(b), { y: r, rz: 90 });
}

/** Half-disc (arched window head) facing +z, flat edge on y = 0. */
function halfDisc(r, depth, m) {
  const geo = new THREE.CylinderGeometry(r, r, depth, 14, 1, false, Math.PI / 2, Math.PI);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, m);
}

/** Copper brew kettle on a brick plinth with a flue pipe. */
function kettle({ r = 1.2, h = 2.4, plinth = 0.7, flue = 0 } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(r + 0.15, r + 0.15, plinth, brickM, 16));
  g.add(place(cylinder(r, r * 0.92, h, copperM, 18), { y: plinth }));
  g.add(place(cylinder(r + 0.04, r + 0.04, 0.12, copperDarkM, 18), { y: plinth + h * 0.7 }));
  g.add(place(dome({ radius: r, height: r * 0.55, material: copperM, segments: 18 }), { y: plinth + h }));
  const top = plinth + h + r * 0.45;
  if (flue > 0) {
    g.add(place(cylinder(0.2, 0.28, flue - top, copperM, 10), { y: top }));
    g.add(place(cylinder(0.2, 0.2, 0.35, copperM, 10), { y: flue }));
    g.add(place(cone(0.5, 0.3, copperDarkM, 10), { y: flue + 0.35 }));
  } else {
    g.add(place(cylinder(0.25, 0.3, 0.6, copperM, 10), { y: top - 0.1 }));
  }
  // manway hatch facing the windows
  g.add(place(box(0.6, 0.5, 0.1, copperDarkM), { y: plinth + h * 0.55, z: r * 0.95 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'cobbles'));

  // street pavement along the front
  g.add(place(patch(20, 1.5, 'paved'), { y: y0, z: 4.25 }));

  // ---------------------------------------------------------------- malt tower
  const tx = -7.2, tz = -1.6, tw = 4.8, td = 6, tFloors = 4;
  const tH = tFloors * 3;
  g.add(place(facadeBlock({ w: tw, d: td, floors: tFloors, ...brickFacade, windowW: 0.42, windowH: 0.55, roof: PALETTE.roofSlate }), { x: tx, y: y0, z: tz }));
  // stone plinth, string courses, cornice
  g.add(place(box(tw + 0.2, 0.6, td + 0.2, stoneM), { x: tx, y: y0, z: tz }));
  for (const yy of [3, 6, 9]) g.add(place(box(tw + 0.12, 0.18, td + 0.12, stoneM), { x: tx, y: y0 + yy - 0.09, z: tz }));
  g.add(place(box(tw + 0.5, 0.4, td + 0.5, stoneM), { x: tx, y: y0 + tH, z: tz }));
  g.add(place(mansardRoof({ w: tw + 0.3, d: td + 0.3, h: 2.6, inset: 1.0, material: slateM, topMaterial: mat(PALETTE.roofSlate) }), { x: tx, y: y0 + tH + 0.4, z: tz }));
  // louvred ventilator cupola + weather vane
  const cupY = y0 + tH + 3.0;
  g.add(place(box(1.6, 1.3, 1.6, mat(PALETTE.white)), { x: tx, y: cupY, z: tz }));
  for (let i = 0; i < 4; i++) g.add(place(box(1.64, 0.08, 1.64, mat(PALETTE.darkGrey)), { x: tx, y: cupY + 0.25 + i * 0.27, z: tz }));
  g.add(place(cone(1.25, 1.2, mat(PALETTE.roofGreen), 4), { x: tx, y: cupY + 1.3, z: tz, ry: 45 }));
  g.add(place(cylinder(0.04, 0.04, 1.0, hoopM, 4), { x: tx, y: cupY + 2.4, z: tz }));
  g.add(place(box(0.7, 0.25, 0.04, hoopM), { x: tx + 0.2, y: cupY + 3.0, z: tz }));
  // malt hoist: beam, pulley, rope and a sack above the loading doors
  const tFront = tz + td / 2;
  g.add(place(box(0.25, 0.25, 1.6, woodM), { x: tx, y: y0 + tH - 1.65, z: tFront + 0.7 }));
  g.add(place(box(0.06, 3.0, 0.06, mat(PALETTE.hay)), { x: tx, y: y0 + tH - 4.65, z: tFront + 1.3 }));
  g.add(place(box(0.7, 0.8, 0.5, mat(PALETTE.beige)), { x: tx, y: y0 + tH - 5.4, z: tFront + 1.3 }));
  for (const f of [1, 2, 3]) g.add(place(door({ w: 1.2, h: 2.0, color: PAINT }), { x: tx, y: y0 + f * 3 + 0.3, z: tFront }));
  g.add(place(door({ w: 1.6, h: 2.4, color: PAINT }), { x: tx, y: y0 + 0.6, z: tFront }));
  g.add(place(box(2.0, 0.6, 0.8, stoneM), { x: tx, y: y0, z: tFront + 0.4 }));
  // name board on the tower
  g.add(place(signBoard({ text: 'BREWERY', w: 4.4, h: 0.9 }), { x: tx, y: y0 + tH - 1.25, z: tFront + 0.05 }));

  // ------------------------------------------------------- brewhouse hall
  const hx = -0.2, hz = -1.0, hw = 9, hd = 7, hH = 8;
  const hl = hx - hw / 2, hr = hx + hw / 2, hf = hz + hd / 2, hb = hz - hd / 2;
  const t = 0.4;
  const hallFacade = { ...brickFacade, floorHeight: 4, bay: 2.2, windowH: 0.6, seed: 53 };
  // back, left and right walls (thin facade blocks so the hall is hollow)
  g.add(place(facadeBlock({ w: hw, d: t, h: hH, ...hallFacade }), { x: hx, y: y0, z: hb + t / 2 }));
  g.add(place(box(t, hH, hd, brickM), { x: hl + t / 2, y: y0, z: hz }));
  g.add(place(box(t, hH, hd, brickM), { x: hr - t / 2, y: y0, z: hz }));
  // tiled floor and warm lit back wall inside
  g.add(place(box(hw - 2 * t, 0.06, hd - 2 * t, mat(PALETTE.paving)), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw - 2 * t, hH - 0.4, 0.05, emissive('#e0a860', 0.25)), { x: hx, y: y0, z: hb + t + 0.03 }));

  // front wall: three tall round-headed windows between brick piers
  const winW = 2.0, winB = 1.0, winT = 5.9;
  const winXs = [-2.9, 0, 2.9].map((o) => hx + o);
  const frontZ = hf - t / 2;
  g.add(place(box(hw, winB, t, brickM), { x: hx, y: y0, z: frontZ }));
  g.add(place(box(hw, hH - winT, t, brickM), { x: hx, y: y0 + winT, z: frontZ }));
  const edges = [hl, ...winXs.flatMap((x) => [x - winW / 2, x + winW / 2]), hr];
  for (let i = 0; i < edges.length; i += 2) {
    const pw = edges[i + 1] - edges[i];
    g.add(place(box(pw, winT - winB, t, brickM), { x: (edges[i] + edges[i + 1]) / 2, y: y0 + winB, z: frontZ }));
  }
  const glassM = glass(PALETTE.glassSky, { opacity: 0.08 });
  const fanM = glass(PALETTE.glassBlue);
  for (const x of winXs) {
    const wy = y0 + winB, wh = winT - winB - winW / 2;
    g.add(place(box(winW, wh, 0.05, glassM), { x, y: wy, z: frontZ }));
    // arch head: stone ring + fanlight over the brick band
    g.add(place(halfDisc(winW / 2 + 0.3, 0.1, stoneM), { x, y: wy + wh, z: hf + 0.02 }));
    g.add(place(halfDisc(winW / 2, 0.1, fanM), { x, y: wy + wh, z: hf + 0.06 }));
    g.add(place(box(0.24, 0.4, 0.14, stoneM), { x, y: wy + wh + winW / 2 + 0.05, z: hf + 0.07 }));
    // glazing bars
    g.add(place(box(0.08, wh, 0.08, paintM), { x, y: wy, z: hf - 0.15 }));
    for (const f of [0.33, 0.66]) g.add(place(box(winW, 0.08, 0.08, paintM), { x, y: wy + wh * f, z: hf - 0.15 }));
    g.add(place(box(winW, 0.08, 0.08, paintM), { x, y: wy + wh - 0.04, z: hf - 0.15 }));
    // stone sill
    g.add(place(box(winW + 0.4, 0.18, 0.35, stoneM), { x, y: wy - 0.18, z: hf + 0.1 }));
  }
  // stone plinth band, string course, cornice
  g.add(place(box(hw + 0.1, 0.5, hd + 0.1, stoneM), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.3, 0.35, hd + 0.3, stoneM), { x: hx, y: y0 + hH - 0.35, z: hz }));
  // copper vats inside, one per window, flues through the roof
  for (const [i, x] of winXs.entries()) {
    g.add(place(kettle({ r: i === 1 ? 1.3 : 1.15, h: i === 1 ? 2.8 : 2.5, flue: i === 1 ? 0 : 12.8 }), { x, y: y0, z: hz + 1.1 }));
  }
  // copper pipework between the vats
  g.add(place(pipeRun([[winXs[0], 3.4, hz - 0.4], [winXs[2], 3.4, hz - 0.4]], 0.1, copperM), { y: y0 }));
  // slate gable roof with a long louvred ventilator on the ridge
  const roofH = 3.4;
  g.add(place(gableRoof({ w: hw, d: hd, h: roofH, overhang: 0.35, ridge: 'x', material: slateM, gableMaterial: brickM }), { x: hx, y: y0 + hH, z: hz }));
  const ventY = y0 + hH + roofH - 0.4;
  g.add(place(box(4.4, 1.4, 1.5, mat(PALETTE.white)), { x: hx, y: ventY, z: hz }));
  for (let i = 0; i < 4; i++) g.add(place(box(4.44, 0.08, 1.54, mat(PALETTE.darkGrey)), { x: hx, y: ventY + 0.25 + i * 0.3, z: hz }));
  g.add(place(gableRoof({ w: 4.4, d: 1.5, h: 0.7, overhang: 0.25, ridge: 'x', material: slateM, gableMaterial: mat(PALETTE.white) }), { x: hx, y: ventY + 1.4, z: hz }));
  // round oculus window in the yard-side gable
  g.add(place(cylinder(0.85, 0.85, 0.1, stoneM, 16), { x: hr + 0.02, y: y0 + hH + 1.3, z: hz, rz: 90 }));
  g.add(place(cylinder(0.62, 0.62, 0.1, fanM, 16), { x: hr + 0.06, y: y0 + hH + 1.3, z: hz, rz: 90 }));
  // two windows over the cart door
  for (const z of [hz - 1.9, hz + 1.6]) {
    g.add(place(box(0.08, 1.8, 1.0, mat(PALETTE.window)), { x: hr + 0.02, y: y0 + 4.8, z }));
    g.add(place(halfDisc(0.5, 0.08, mat(PALETTE.window)), { x: hr + 0.02, y: y0 + 6.6, z, ry: 90 }));
    g.add(place(box(0.3, 0.15, 1.3, stoneM), { x: hr + 0.1, y: y0 + 4.65, z }));
  }
  // big arched cart door on the yard side
  g.add(place(door({ w: 2.2, h: 3.0, color: PAINT }), { x: hr, y: y0 + 0.5, z: hz - 0.3, ry: 90 }));
  g.add(place(halfDisc(1.35, 0.12, stoneM), { x: hr + 0.02, y: y0 + 3.5, z: hz - 0.3, ry: 90 }));

  // ------------------------------------------------------------- yard
  const yx0 = hr, yx1 = 10;
  // square brick chimney with stone bands
  const cx = 5.8, cz = -3.6;
  g.add(place(box(2.4, 1.2, 2.4, stoneM), { x: cx, y: y0, z: cz }));
  g.add(place(box(1.8, 19, 1.8, brickM), { x: cx, y: y0 + 1.2, z: cz }));
  for (const yy of [8, 14]) g.add(place(box(1.95, 0.3, 1.95, stoneM), { x: cx, y: y0 + yy, z: cz }));
  g.add(place(box(2.2, 0.8, 2.2, mat(PALETTE.brickDark)), { x: cx, y: y0 + 20.2, z: cz }));
  g.add(place(box(1.2, 0.05, 1.2, mat(PALETTE.black)), { x: cx, y: y0 + 21.0, z: cz }));
  // flue from the hall into the chimney
  g.add(pipeRun([[hr, y0 + 6, cz], [cx - 0.9, y0 + 6, cz]], 0.3, metal(PALETTE.steelDark)));

  // two steel fermenting tanks on legs along the back of the yard
  for (const z of [-3.6, -1.1]) {
    g.add(place(tank({ radius: 1.1, h: 3.4, roof: 'dome', legs: 4, legHeight: 1.0 }), { x: 8.6, y: y0, z }));
    g.add(place(box(0.08, 3.0, 0.5, mat(PALETTE.steelDark)), { x: 7.48, y: y0 + 1.2, z }));
  }
  g.add(pipeRun([[8.6, y0 + 4.75, -3.6], [8.6, y0 + 5.2, -2.35], [8.6, y0 + 4.75, -1.1]], 0.08, metal(PALETTE.steel)));
  g.add(pipeRun([[7.5, y0 + 3.6, -1.1], [hr, y0 + 3.6, -1.1]], 0.1, metal(PALETTE.steel)));

  // pyramid of lying barrels between the chimney and the cart door
  const bx = 5.6, bz = -1.6;
  for (let row = 0; row < 3; row++) {
    for (let i = 0; i < 3 - row; i++) {
      g.add(place(group(lyingBarrel()), { x: bx, y: y0 + row * 0.66, z: bz - (2 - row) * 0.39 + i * 0.78 }));
    }
  }
  // loose barrels by the yard wall
  for (const [x, z] of [[4.8, 2.75], [5.5, 2.9], [9.3, 2.75]]) g.add(place(barrel(), { x, y: y0, z }));
  // dray lorry loaded with barrels, backed up to the cart door
  g.add(place(dray(PAINT), { x: 7.4, y: y0, z: 1.3 }));

  // low brick yard wall with iron railings and a gateway
  g.add(place(box(1.6, 0.9, 0.3, brickM), { x: yx0 + 0.8, y: y0, z: 3.35 }));
  g.add(place(box(0.3, 0.9, 8.3, brickM), { x: yx1 - 0.2, y: y0, z: -0.75 }));
  g.add(place(fence({ w: 8.3, d: 0.1, h: 0.6, style: 'railing', color: PAINT, sides: ['front'] }), { x: yx1 - 0.2, y: y0 + 0.9, z: -0.75, ry: 90 }));
  g.add(place(fence({ w: 1.6, d: 0.1, h: 0.6, style: 'railing', color: PAINT, sides: ['front'] }), { x: yx0 + 0.8, y: y0 + 0.9, z: 3.35 }));
  for (const x of [yx0 + 1.7, yx1 - 0.2]) {
    g.add(place(box(0.5, 1.8, 0.5, brickM), { x, y: y0, z: 3.35 }));
    g.add(place(box(0.6, 0.15, 0.6, stoneM), { x, y: y0 + 1.8, z: 3.35 }));
    g.add(place(sphere(0.18, stoneM, 8), { x, y: y0 + 1.95, z: 3.35 }));
  }
  // iron arch over the gateway with the brewery name
  g.add(place(box(yx1 - yx0 - 2.1, 0.1, 0.1, paintM), { x: (yx0 + 1.7 + yx1 - 0.2) / 2, y: y0 + 3.0, z: 3.35 }));
  for (const x of [yx0 + 1.7, yx1 - 0.2]) g.add(place(box(0.1, 1.05, 0.1, paintM), { x, y: y0 + 1.95, z: 3.35 }));
  g.add(place(signBoard({ text: 'TINY ALES', w: 3.0, h: 0.6, depth: 0.08, double: true }), { x: (yx0 + 1.7 + yx1 - 0.2) / 2, y: y0 + 3.1, z: 3.35 }));

  // ------------------------------------------------------------- street side
  for (const x of [-9.2, 3.3]) g.add(place(streetLamp({ h: 4.2 }), { x, y: y0, z: 4.6, ry: 90 }));
  g.add(place(bench({ w: 1.6 }), { x: -1.0, y: y0, z: 4.4 }));
  // hanging pub-style sign on a bracket by the tower door
  g.add(place(box(0.1, 0.1, 1.2, paintM), { x: -4.3, y: y0 + 3.4, z: hf + 0.6 }));
  g.add(place(signBoard({ text: 'ALE', w: 0.9, h: 0.9, depth: 0.08, double: true }), { x: -4.3, y: y0 + 2.4, z: hf + 0.85, ry: 90 }));
  // planters with hop bines climbing the hall front
  for (const x of [hx - 1.45, hx + 1.45]) {
    g.add(place(box(0.8, 0.5, 0.6, woodM), { x, y: y0, z: hf + 0.4 }));
    g.add(place(box(0.5, 4.2, 0.12, mat(PALETTE.foliageLight)), { x, y: y0 + 0.5, z: hf + 0.12 }));
    for (const [dy, dx] of [[1.2, -0.1], [2.4, 0.1], [3.6, -0.05]]) {
      g.add(place(sphere(0.28, mat(PALETTE.foliage), 6), { x: x + dx, y: y0 + 0.5 + dy, z: hf + 0.22 }));
    }
  }
  // a tree and bushes in the back corner behind the tower
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 5 }), { x: -9.2, y: y0, z: -4.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 6 }), { x: -5.2, y: y0, z: -4.7 }));
  return g;
}

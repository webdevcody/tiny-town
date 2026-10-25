import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, cylinder, cone, sphere, taperedBlock, place, group,
  mat, metal, glass, emissive, surface, textured, signTexture, canvasTexture,
  car, streetLamp, tree, rooftopUnits, MAT,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). A six-lane motorway runs along Z through a row of
// toll booths under a long canopy. Northbound lanes (x > 0) drive towards -Z
// and queue on the front (+Z) side; southbound lanes (x < 0) drive towards +Z
// and queue on the back.

const CAR_S = 0.65;          // car scale used across the town
const LANE = 2.2;            // lane width
const ISLAND = 1.0;          // booth island width
const MEDIAN = 1.2;          // central island width
const EDGE = MEDIAN / 2 + 3 * LANE + 2 * ISLAND; // 9.2: outer edge of the carriageway
const ISL_L = 5.0;           // island length along Z
const CANOPY_Y = 3.3;        // canopy underside above the road
const CANOPY_D = 4.7;

// lane centres / island centres on the +X side (mirror for -X)
const laneX = [0, 1, 2].map((i) => MEDIAN / 2 + LANE / 2 + i * (LANE + ISLAND));
const islandX = [1, 2].map((i) => MEDIAN / 2 + i * LANE + (i - 0.5) * ISLAND);

// Box with 0..1 UVs per face (lib box() UVs are in metres, which shrinks sign text).
function panel(w, h, d, face, side, back = side) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const s = typeof side === 'string' ? mat(side) : side;
  return new THREE.Mesh(geo, [s, s, s, s, face, back]);
}

function signFace(tex, glow = 0.2) {
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
}

function laneSign(text, bg) {
  return signFace(signTexture(text, { bg, fg: '#ffffff', width: 256, height: 80, border: '#ffffff' }));
}

const signalTex = (kind) => canvasTexture(64, 64, (ctx, W, H) => {
  ctx.fillStyle = '#111418';
  ctx.fillRect(0, 0, W, H);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  if (kind === 'go') {
    ctx.strokeStyle = '#3dff6a';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.moveTo(32, 10); ctx.lineTo(32, 52);
    ctx.moveTo(14, 34); ctx.lineTo(32, 52); ctx.lineTo(50, 34);
    ctx.stroke();
  } else {
    ctx.strokeStyle = '#ff3030';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(14, 14); ctx.lineTo(50, 50);
    ctx.moveTo(50, 14); ctx.lineTo(14, 50);
    ctx.stroke();
  }
}, { key: 'toll-plaza:signal-' + kind, repeat: false });

const priceTex = () => canvasTexture(160, 200, (ctx, W, H) => {
  ctx.fillStyle = '#1d4fa8';
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = 6;
  ctx.strokeRect(5, 5, W - 10, H - 10);
  ctx.fillStyle = '#ffd21f';
  ctx.font = 'bold 46px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('TOLL', W / 2, 38);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('CAR', 16, 92);
  ctx.fillText('VAN', 16, 128);
  ctx.fillText('HGV', 16, 164);
  ctx.textAlign = 'right';
  ctx.fillText('2.50', W - 16, 92);
  ctx.fillText('4.00', W - 16, 128);
  ctx.fillText('7.50', W - 16, 164);
}, { key: 'toll-plaza:prices', repeat: false });

// Glazed toll booth, ~0.8 x 1.9 x 1.7 m, long side along Z.
function booth() {
  const body = mat(PALETTE.cream);
  const trim = mat(PALETTE.red);
  const glassM = glass(PALETTE.glassSky);
  return group(
    box(0.82, 0.95, 1.7, body),
    place(box(0.78, 0.75, 1.62, glassM), { y: 0.95 }),
    // corner posts
    ...[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) =>
      place(box(0.07, 0.75, 0.07, body), { x: sx * 0.38, y: 0.95, z: sz * 0.79 })),
    place(box(0.86, 0.25, 1.74, trim), { y: 1.7 }),
    place(box(1.0, 0.08, 1.9, mat(PALETTE.white)), { y: 1.95 }),
    // cash trays on both sides
    place(box(1.0, 0.05, 0.3, metal(PALETTE.steelLight)), { y: 0.95, z: -0.3 }),
    // tiny rooftop beacon
    place(cylinder(0.08, 0.08, 0.14, emissive(PALETTE.orange, 0.9), 8), { y: 2.03, z: 0.6 }),
  );
}

// Island with kerb, hazard-striped attenuator noses and bollards.
function island(w, len) {
  const g = group(box(w, 0.2, len, mat(PALETTE.concrete)));
  g.add(place(box(w + 0.04, 0.06, len + 0.04, mat(PALETTE.lightGrey)), { y: 0.0 }));
  for (const s of [-1, 1]) {
    g.add(place(box(w * 0.8, 0.55, 0.55, MAT.hazard), { y: 0.2, z: s * (len / 2 - 0.3) }));
    g.add(place(box(w * 0.82, 0.06, 0.57, mat(PALETTE.black)), { y: 0.75, z: s * (len / 2 - 0.3) }));
    g.add(place(cylinder(0.08, 0.08, 0.8, mat(PALETTE.yellow), 8), { x: -w * 0.3, y: 0.2, z: s * (len / 2 - 0.85) }));
    g.add(place(cylinder(0.08, 0.08, 0.8, mat(PALETTE.yellow), 8), { x: w * 0.3, y: 0.2, z: s * (len / 2 - 0.85) }));
  }
  return g;
}

// Barrier arm hinged at the origin, reaching along +X. open = raised.
function barrier(len, open) {
  const post = group(
    box(0.28, 0.85, 0.28, mat(PALETTE.yellow)),
    place(box(0.3, 0.12, 0.3, mat(PALETTE.black)), { y: 0.85 }),
  );
  const arm = place(box(len, 0.1, 0.1, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.6 })), { x: len / 2, y: -0.05 });
  const tip = place(box(0.08, 0.14, 0.12, emissive(PALETTE.red, 0.8)), { x: len - 0.06, y: -0.07 });
  const pivot = group(arm, tip);
  pivot.position.set(0.05, 0.75, 0);
  pivot.rotation.z = open ? THREE.MathUtils.degToRad(80) : 0;
  return group(post, pivot);
}

// Small traffic light on a post, faces +Z. go = green lit.
function trafficLight(go) {
  const dark = mat(PALETTE.darkGrey);
  return group(
    cylinder(0.05, 0.05, 1.2, dark, 6),
    place(box(0.26, 0.55, 0.16, mat(PALETTE.black)), { y: 1.2 }),
    place(sphere(0.08, go ? mat('#2b2b2b') : emissive('#ff2a2a', 1.2), 8), { y: 1.53, z: 0.06 }),
    place(sphere(0.08, go ? emissive('#2bff55', 1.2) : mat('#2b2b2b'), 8), { y: 1.27, z: 0.06 }),
  );
}

function guardRail(len) {
  const g = group();
  const steel = metal(PALETTE.steelLight);
  g.add(place(box(0.06, 0.26, len, steel), { y: 0.42 }));
  for (let z = -len / 2 + 0.3; z <= len / 2; z += 1.6) g.add(place(box(0.1, 0.62, 0.1, metal(PALETTE.steelDark)), { z }));
  return g;
}

function trafficCone() {
  return group(
    box(0.4, 0.04, 0.4, mat(PALETTE.black)),
    place(cone(0.15, 0.55, mat(PALETTE.orange), 8), { y: 0.04 }),
    place(cylinder(0.085, 0.11, 0.1, mat(PALETTE.white), 8), { y: 0.26 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'asphalt'));

  const white = mat(PALETTE.white);
  const paint = mat('#f4f4ee');
  const yellowPaint = mat(PALETTE.yellow);
  const ry = y0 + 0.005;

  // ---- road markings ----------------------------------------------------
  for (const s of [-1, 1]) {
    // solid edge lines + grassy verge beyond the guard rail
    g.add(place(box(0.15, 0.02, 10, paint), { x: s * (EDGE - 0.1), y: ry }));
    g.add(place(patch(10 - EDGE - 0.2, 10, 'grass', 0.08), { x: s * (EDGE + 0.2 + (10 - EDGE - 0.2) / 2), y: y0 }));
    g.add(place(guardRail(10), { x: s * (EDGE + 0.15), y: y0 }));
    // yellow lines either side of the central barrier
    g.add(place(box(0.12, 0.02, 10, yellowPaint), { x: s * (MEDIAN / 2 - 0.05), y: ry }));
    // dashed lane lines beyond the islands
    for (const ix of islandX) {
      for (const zs of [-1, 1]) {
        for (let k = 0; k < 2; k++) {
          const z = zs * (ISL_L / 2 + 0.55 + k * 1.2);
          g.add(place(box(0.12, 0.02, 0.6, paint), { x: s * ix, y: ry, z }));
        }
      }
    }
    // stop lines at the barriers, and painted chevron-ish arrows on the approach
    for (const lx of laneX) {
      const exitZ = s > 0 ? -1.35 : 1.35;
      g.add(place(box(LANE - 0.2, 0.02, 0.18, paint), { x: s * lx, y: ry, z: exitZ - s * 0.25 }));
      const az = s > 0 ? 4.1 : -4.1;
      g.add(place(box(0.14, 0.02, 0.9, paint), { x: s * lx, y: ry, z: az }));
      const head = place(box(0.14, 0.02, 0.55, paint), { x: s * lx + 0.18, y: ry, z: az - s * 0.5, ry: 35 * s });
      const head2 = place(box(0.14, 0.02, 0.55, paint), { x: s * lx - 0.18, y: ry, z: az - s * 0.5, ry: -35 * s });
      g.add(head, head2);
    }
  }

  // ---- islands, median barrier --------------------------------------------
  g.add(place(island(MEDIAN, ISL_L + 0.4), { y: y0 }));
  for (const zs of [-1, 1]) {
    const len = 5 - (ISL_L + 0.4) / 2;
    g.add(place(taperedBlock({ w: 0.55, d: len, h: 0.65, topW: 0.22, topD: len, material: mat(PALETTE.concrete), topMaterial: mat(PALETTE.lightGrey) }), { y: y0, z: zs * (5 - len / 2) }));
  }
  for (const s of [-1, 1]) for (const ix of islandX) g.add(place(island(ISLAND, ISL_L), { x: s * ix, y: y0 }));

  // ---- booths, barriers, island traffic lights ----------------------------
  const islandTop = y0 + 0.2;
  const boothXs = [0, ...islandX, ...islandX.map((x) => -x)];
  for (const bx of boothXs) g.add(place(booth(), { x: bx, y: islandTop }));

  // lane state: [closed, barrierOpen] per lane, inner -> outer
  const north = [[false, false], [false, false], [true, false]];
  const south = [[false, false], [false, false], [false, true]];
  const armLen = LANE - 0.3;
  for (let i = 0; i < 3; i++) {
    // northbound lane i: booth island on its -X side, exit towards -Z
    const nIslandEdge = laneX[i] - LANE / 2 - 0.15;
    g.add(place(barrier(armLen, north[i][1]), { x: nIslandEdge, y: islandTop, z: -1.45 }));
    g.add(place(trafficLight(north[i][1]), { x: nIslandEdge, y: islandTop, z: -1.05 }));
    // southbound lane i: booth island on its +X side, exit towards +Z
    const sIslandEdge = -laneX[i] + LANE / 2 + 0.15;
    g.add(place(barrier(armLen, south[i][1]), { x: sIslandEdge, y: islandTop, z: 1.45, ry: 180 }));
    g.add(place(trafficLight(south[i][1]), { x: sIslandEdge, y: islandTop, z: 1.05, ry: 180 }));
  }

  // ---- canopy -------------------------------------------------------------
  const canopyW = 2 * EDGE + 0.4;
  const cy = y0 + CANOPY_Y;
  const colM = metal(PALETTE.steelLight);
  for (const bx of boothXs) {
    for (const zs of [-1, 1]) g.add(place(box(0.24, CANOPY_Y - 0.2, 0.24, colM), { x: bx, y: islandTop, z: zs * 1.55 }));
  }
  g.add(place(boxFaces(canopyW, 0.75, CANOPY_D, { sides: white, top: mat(PALETTE.lightGrey), bottom: mat(PALETTE.concrete) }), { y: cy }));
  g.add(place(box(canopyW + 0.06, 0.16, CANOPY_D + 0.06, mat(PALETTE.red)), { y: cy + 0.06 }));
  // roof: raised edge, panel seams, plant boxes at the ends
  const roofY = cy + 0.75;
  const edgeM = mat(PALETTE.white);
  for (const zs of [-1, 1]) g.add(place(box(canopyW, 0.18, 0.18, edgeM), { y: roofY, z: zs * (CANOPY_D / 2 - 0.09) }));
  for (const xs of [-1, 1]) g.add(place(box(0.18, 0.18, CANOPY_D, edgeM), { x: xs * (canopyW / 2 - 0.09), y: roofY }));
  for (let x = -canopyW / 2 + 1.6; x < canopyW / 2 - 1; x += 1.6) g.add(place(box(0.06, 0.03, CANOPY_D - 0.4, mat(PALETTE.concrete)), { x, y: roofY }));
  for (const xs of [-1, 1]) g.add(place(rooftopUnits({ w: 3.2, d: 2.6, count: 3, seed: 5 + xs }), { x: xs * 6.8, y: roofY }));
  // downlights under the deck
  for (const lx of laneX) for (const s of [-1, 1]) {
    g.add(place(box(1.2, 0.04, 0.3, emissive(PALETTE.windowLit, 0.7)), { x: s * lx, y: cy - 0.04, z: 0 }));
  }
  // crown sign on the roof
  const crown = signFace(signTexture('TOLL PLAZA', { bg: '#1d4fa8', fg: '#ffd21f', width: 512, height: 88, border: '#ffffff' }), 0.25);
  for (const px of [-2.4, 2.4]) g.add(place(box(0.18, 0.5, 0.18, metal(PALETTE.steelDark)), { x: px, y: cy + 0.75 }));
  g.add(place(panel(7.0, 1.2, 0.22, crown, '#1d4fa8', crown), { y: cy + 1.2 }));
  // lane-type boards on both fascias, signals hung under the deck edge
  const types = [['CASH', '#2f8a3a'], ['CARDS', '#1d4fa8'], ['E-TAG', '#e07b12']];
  const go = signFace(signalTex('go'), 1.0);
  const stop = signFace(signalTex('stop'), 1.0);
  const housing = mat('#1a1d22');
  for (let i = 0; i < 3; i++) {
    const face = laneSign(...types[i]);
    for (const s of [-1, 1]) {
      g.add(place(panel(1.7, 0.52, 0.06, face, types[i][1], face), { x: s * laneX[i], y: cy + 0.12, z: CANOPY_D / 2 + 0.04 }));
      g.add(place(panel(1.7, 0.52, 0.06, face, types[i][1], face), { x: s * laneX[i], y: cy + 0.12, z: -CANOPY_D / 2 - 0.04 }));
    }
    // northbound signal faces +Z, southbound faces -Z
    const nf = north[i][0] ? stop : go;
    const sf = south[i][0] ? stop : go;
    g.add(place(box(0.08, 0.2, 0.08, housing), { x: laneX[i], y: cy - 0.2, z: CANOPY_D / 2 - 0.25 }));
    g.add(place(panel(0.6, 0.6, 0.14, nf, housing), { x: laneX[i], y: cy - 0.8, z: CANOPY_D / 2 - 0.25 }));
    g.add(place(box(0.08, 0.2, 0.08, housing), { x: -laneX[i], y: cy - 0.2, z: -CANOPY_D / 2 + 0.25 }));
    g.add(place(panel(0.6, 0.6, 0.14, housing, housing, sf), { x: -laneX[i], y: cy - 0.8, z: -CANOPY_D / 2 + 0.25 }));
  }

  // ---- traffic ------------------------------------------------------------
  const N = 90, S = -90; // car() faces +X; ry 90 -> heading -Z (northbound)
  const cars = [
    // northbound: paying at the booth + queue on the front approach
    [laneX[0], 0.1, N, PALETTE.red, 'car'],
    [laneX[0], 3.4, N, PALETTE.blue, 'car'],
    [laneX[1], 0.0, N, PALETTE.white, 'van'],
    [laneX[1], 3.6, N, PALETTE.yellow, 'taxi'],
    [laneX[0], -3.6, N, PALETTE.green, 'car'],          // just paid, driving off
    // southbound: paying + queue on the back approach
    [-laneX[0], -0.1, S, PALETTE.orange, 'car'],
    [-laneX[0], -3.4, S, PALETTE.purple, 'car'],
    [-laneX[1], -0.1, S, PALETTE.navy, 'car'],
    [-laneX[1], -3.6, S, PALETTE.red, 'van'],
    [-laneX[2], 3.5, S, PALETTE.lightGrey, 'car'],      // through the open barrier
  ];
  for (const [x, z, r, color, kind] of cars) g.add(place(car({ color, kind }), { x, y: y0, z, ry: r, s: CAR_S }));

  // closed lane: cones taper across the approach
  for (let k = 0; k < 4; k++) g.add(place(trafficCone(), { x: laneX[2] + 0.75 - k * 0.45, y: y0, z: 4.6 - k * 0.6 }));

  // ---- verges: lamps, price boards, shrubs ---------------------------------
  for (const s of [-1, 1]) {
    for (const zs of [-1, 1]) g.add(place(streetLamp({ h: 5.2 }), { x: s * 9.65, y: y0, z: zs * 3.4, ry: s > 0 ? 180 : 0 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 7 + s }), { x: s * 9.65, y: y0, z: 0.4 * s }));
  }
  // price boards facing each approach
  const price = signFace(priceTex(), 0.2);
  for (const s of [-1, 1]) {
    const bx = s * 9.55, bz = s * 4.55;
    const pole = metal(PALETTE.steelDark);
    g.add(place(box(0.1, 2.0, 0.1, pole), { x: bx - 0.35, y: y0, z: bz }));
    g.add(place(box(0.1, 2.0, 0.1, pole), { x: bx + 0.35, y: y0, z: bz }));
    g.add(place(panel(1.0, 1.25, 0.08, s > 0 ? price : mat('#1d4fa8'), '#1d4fa8', s > 0 ? mat('#1d4fa8') : price), { x: bx, y: y0 + 1.6, z: bz }));
  }
  return g;
}

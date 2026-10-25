import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, barrelRoof, taperedBlock, box, cylinder, place,
  tree, hedge, bench, streetLamp, mat, glass, emissive, surface,
} from '../../src/lib/index.js';
import { bigSign, monorailCar, curvedRamp } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z. The guideway runs along X
// at the back of the lot so it lines up with neighbouring monorail tiles.
const BEAM_Z = -3.2;   // guideway centreline
const BEAM_TOP = 4.2;  // top of the concrete beam
const DECK = 4.6;      // platform floor height
const DECK_X = 5.5;    // platform half-length
const DECK_Z0 = -1.6, DECK_Z1 = 1.8;
const ROOF_Y = DECK + 3.4; // springing line of the glass vault

const TEAL = '#1d9fb4';

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  const concrete = surface('concrete', PALETTE.concrete, { size: 4 });
  const white = mat(PALETTE.white, { roughness: 0.5 });
  const whiteSteel = mat(PALETTE.frame, { roughness: 0.35, metalness: 0.3 });
  const railM = mat(PALETTE.steelLight, { roughness: 0.3, metalness: 0.6 });
  const glassRail = mat(PALETTE.glassSky, { roughness: 0.1, metalness: 0.3, transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  const deckTop = surface('paving', PALETTE.lightGrey, { size: 2 });

  // --- ground: green strip under the guideway, plaza paving at the front
  g.add(place(patch(20, 1.3, 'grass'), { y: y0, z: -4.35 }));
  g.add(place(patch(3.6, 2.2, 'cobbles'), { y: y0, z: 2.6 }));
  for (const x of [-6, -2.2, 2.2, 6]) g.add(place(hedge({ w: 2.2, h: 0.7, d: 0.7 }), { x, y: y0, z: -4.45 }));

  // --- guideway: concrete box beam on T-pylons, full lot length
  g.add(place(box(20, 1.3, 0.9, concrete), { y: y0 + BEAM_TOP - 1.3, z: BEAM_Z }));
  g.add(place(box(20, 0.06, 0.94, mat(PALETTE.steelDark)), { y: y0 + BEAM_TOP - 0.2, z: BEAM_Z }));
  for (const x of [-8.2, 0, 8.2]) {
    g.add(place(taperedBlock({ w: 0.75, d: 0.75, h: BEAM_TOP - 1.9, topW: 0.75, topD: 0.75, material: concrete }), { x, y: y0, z: BEAM_Z }));
    g.add(place(taperedBlock({ w: 0.75, d: 0.75, h: 0.6, topW: 1.1, topD: 1.7, material: concrete }), { x, y: y0 + BEAM_TOP - 1.9, z: BEAM_Z }));
    g.add(place(box(1.0, 0.25, 1.0, mat(PALETTE.concreteDark)), { x, y: y0, z: BEAM_Z }));
  }

  // --- the train: two cars straddling the beam, noses out
  const carOpts = {
    body: mat(PALETTE.white, { roughness: 0.35, metalness: 0.15 }),
    stripe: mat(TEAL, { roughness: 0.4 }),
    glassM: mat(PALETTE.glassDark, { roughness: 0.15, metalness: 0.5 }),
    skirt: mat(PALETTE.darkGrey),
  };
  const trainY = y0 + BEAM_TOP - 0.6;
  g.add(place(monorailCar(carOpts), { x: -7.8, y: trainY, z: BEAM_Z }));
  g.add(place(monorailCar(carOpts), { x: 7.8, y: trainY, z: BEAM_Z, ry: 180 }));
  g.add(place(box(0.5, 2.6, 2.3, mat(PALETTE.darkGrey)), { y: trainY + 0.3, z: BEAM_Z }));

  // --- ticket hall under the deck
  g.add(place(facadeBlock({ w: 8, d: 2.6, h: DECK - 0.45, floorHeight: DECK - 0.45, style: 'curtain', glass: PALETTE.glassSky, frame: PALETTE.frame, bay: 1.6, lit: 0.25, seed: 7, roof: PALETTE.concreteDark }), { y: y0, z: 0.2 }));
  g.add(place(box(2.6, 2.7, 0.12, railM), { y: y0, z: 1.55 }));
  g.add(place(box(2.3, 2.5, 0.16, mat(PALETTE.glassBlue, { roughness: 0.15, metalness: 0.4 })), { y: y0, z: 1.55 }));
  g.add(place(box(0.08, 2.5, 0.2, railM), { y: y0, z: 1.55 }));
  g.add(place(box(3.2, 0.2, 1.0, whiteSteel), { y: y0 + 2.9, z: 1.95 }));

  // --- platform deck on round columns
  g.add(place(box(DECK_X * 2, 0.45, DECK_Z1 - DECK_Z0, [white, white, deckTop, white, white, white]), { y: y0 + DECK - 0.45, z: (DECK_Z0 + DECK_Z1) / 2 }));
  g.add(place(box(DECK_X * 2, 0.12, 0.08, emissive('#bff3ff', 0.6)), { y: y0 + DECK - 0.3, z: DECK_Z1 + 0.04 }));
  g.add(place(box(DECK_X * 2, 0.02, 0.3, mat(PALETTE.yellow)), { y: y0 + DECK, z: DECK_Z0 + 0.3 }));
  for (const x of [-5, 5]) for (const z of [-1.1, 1.3]) {
    g.add(place(cylinder(0.25, 0.25, DECK - 0.45, white, 12), { x, y: y0, z }));
  }
  // glass balustrade: front edge, and the deck ends either side of the ramp landings
  const balustrade = (len, along) => {
    const grp = new THREE.Group();
    const w = along === 'x' ? len : 0.06, d = along === 'x' ? 0.06 : len;
    grp.add(box(w, 1.0, d, glassRail));
    grp.add(place(box(along === 'x' ? len : 0.1, 0.08, along === 'x' ? 0.1 : len, railM), { y: 1.0 }));
    return grp;
  };
  g.add(place(balustrade(DECK_X * 2, 'x'), { y: y0 + DECK, z: DECK_Z1 - 0.05 }));
  for (const s of [-1, 1]) {
    g.add(place(balustrade(0.9, 'z'), { x: s * (DECK_X - 0.05), y: y0 + DECK, z: -1.15 }));
    g.add(place(balustrade(1.1, 'z'), { x: s * (DECK_X - 0.05), y: y0 + DECK, z: 1.25 }));
  }
  // platform furniture
  for (const x of [-3.2, 3.2]) g.add(place(bench({ w: 1.6 }), { x, y: y0 + DECK, z: 0.9, ry: 180 }));
  g.add(place(box(0.5, 1.4, 0.4, mat(TEAL)), { x: 0, y: y0 + DECK, z: 1.2 }));
  g.add(place(box(0.4, 0.5, 0.05, emissive('#bff3ff', 0.7)), { x: 0, y: y0 + DECK + 0.75, z: 0.98 }));

  // --- glass vault over platform and train
  const span = 6.65, roofZ = -1.625, roofLen = 12.6;
  g.add(place(barrelRoof({ w: roofLen, d: span, h: 1.6, axis: 'x', material: glass(PALETTE.glassTeal, { opacity: 0.4 }), endMaterial: glass(PALETTE.glassTeal, { opacity: 0.35 }) }), { y: y0 + ROOF_Y, z: roofZ }));
  for (let i = 0; i <= 6; i++) {
    const x = -roofLen / 2 + 0.15 + ((roofLen - 0.3) * i) / 6;
    g.add(place(barrelRoof({ w: 0.25, d: span + 0.08, h: 1.64, axis: 'x', material: whiteSteel, endMaterial: whiteSteel }), { x, y: y0 + ROOF_Y, z: roofZ }));
  }
  for (const z of [roofZ - span / 2, roofZ + span / 2]) {
    g.add(place(box(roofLen + 0.3, 0.4, 0.3, whiteSteel), { y: y0 + ROOF_Y - 0.4, z }));
  }
  g.add(place(box(roofLen, 0.1, 0.25, emissive('#e8fbff', 0.8)), { y: y0 + ROOF_Y + 1.62, z: roofZ }));
  // columns: front ones on the deck, back ones from the ground behind the train
  for (const x of [-5.3, -1.9, 1.9, 5.3]) {
    g.add(place(cylinder(0.14, 0.14, ROOF_Y - DECK - 0.4, whiteSteel, 8), { x, y: y0 + DECK, z: roofZ + span / 2 }));
    g.add(place(cylinder(0.13, 0.16, ROOF_Y - 0.4, whiteSteel, 8), { x, y: y0, z: roofZ - span / 2 }));
  }
  // station sign hanging from the front eave
  g.add(place(bigSign({ text: 'MONORAIL', w: 6.4, h: 0.85, bg: TEAL, fg: '#ffffff' }), { y: y0 + ROOF_Y - 1.25, z: roofZ + span / 2 + 0.05 }));

  // --- curving access ramps: out along the street front, a U-turn round the
  // lot end, then back onto the end of the platform deck
  const rampOpts = {
    width: 1.4, deck: deckTop, side: white, glassM: glassRail, rail: railM, colM: white, y0,
  };
  for (const s of [-1, 1]) {
    const pts = [];
    const x0 = 1.5, xT = 7.0, zF = 4.2, r = 2.1;
    for (let i = 0; i <= 6; i++) pts.push({ x: s * (x0 + ((xT - x0) * i) / 6), z: zF });
    for (let i = 1; i <= 14; i++) {
      const t = (Math.PI * i) / 14;
      pts.push({ x: s * (xT + r * Math.sin(t)), z: zF - r + r * Math.cos(t) });
    }
    for (let i = 1; i <= 2; i++) pts.push({ x: s * (xT - ((xT - DECK_X) * i) / 2), z: 0 });
    let total = 0;
    const dist = [0];
    for (let i = 1; i < pts.length; i++) { total += Math.hypot(pts[i].x - pts[i - 1].x, pts[i].z - pts[i - 1].z); dist.push(total); }
    pts.forEach((p, i) => { p.y = DECK * Math.min(1, dist[i] / (total - 0.6)); });
    g.add(curvedRamp(pts, rampOpts));
    // planter + slim tree in the eye of the U-turn
    g.add(place(cylinder(0.9, 0.9, 0.5, mat(PALETTE.concreteDark), 14), { x: s * xT, y: y0, z: zF - r }));
    g.add(place(tree({ kind: 'poplar', h: 4.5, seed: 30 + s }), { x: s * xT, y: y0 + 0.5, z: zF - r }));
  }

  // --- street plaza: totem, lamps, bench, bins, bushes under the train
  g.add(place(box(0.7, 3.4, 0.3, mat(PALETTE.navy)), { x: -2.6, y: y0, z: 2.4 }));
  g.add(place(bigSign({ text: 'M', w: 0.6, h: 0.6, d: 0.06, bg: TEAL, fg: '#ffffff', glow: 0.5 }), { x: -2.6, y: y0 + 2.6, z: 2.56 }));
  g.add(place(bench({ w: 1.5 }), { x: 2.7, y: y0, z: 2.5, ry: 180 }));
  g.add(place(cylinder(0.22, 0.2, 0.8, mat(PALETTE.darkGrey), 8), { x: 1.6, y: y0, z: 2.6 }));
  for (const x of [-1.2, 1.2]) g.add(place(streetLamp({ h: 3.6 }), { x, y: y0, z: 3.25, ry: x > 0 ? 180 : 0 }));
  for (const x of [-9.2, 9.2]) g.add(place(tree({ kind: 'bush', h: 1.3, seed: 50 + x }), { x, y: y0, z: -1.6 }));
  for (const x of [-6.6, 6.6]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: 70 + x }), { x, y: y0, z: -1.5 }));

  return g;
}

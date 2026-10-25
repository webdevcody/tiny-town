import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, box, beam, place, group, mat, metal, surface, emissive, cylinder,
  container, truck, streetLamp, sign,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). The quay runs along Z; the water is the east (+x) strip.
// The crane rides on two rails along Z and its boom reaches out over the water along +X.
const HALF_W = TILE;        // 10
const HALF_D = TILE / 2;    // 5
const QUAY_EDGE = 4.2;      // x of the quay wall
const QUAY_H = 1.1;         // quay deck above the water slab

const RAIL_LAND = -4.2;     // x of the landside rail
const RAIL_SEA = 2.6;       // x of the waterside rail
const GAUGE = 3.6;          // legs at z = ±GAUGE
const PORTAL_H = 11;        // top of the legs above the quay deck
const BOOM_Y = 12.2;        // underside of the boom above the quay deck
const BOOM_H = 1.1;
const BOOM_Z = 1.25;        // the two boom girders sit at z = ±BOOM_Z
const BOOM_X0 = -9.7, BOOM_X1 = 9.85;
const APEX_X = RAIL_LAND + 1.2, APEX_Y = 21;

function quay(g) {
  const deck = surface('concrete', PALETTE.concrete, { size: 6 });
  const wall = mat(PALETTE.concreteDark);
  const qw = QUAY_EDGE + HALF_W;
  g.add(place(box(qw, QUAY_H, 2 * HALF_D, [wall, wall, deck, wall, wall, wall]), { x: -HALF_W + qw / 2, y: LOT_HEIGHT }));
  const y = LOT_HEIGHT + QUAY_H;

  // hazard strip along the quay edge + yellow lane lines
  g.add(place(box(0.5, 0.03, 2 * HALF_D, surface('hazard', PALETTE.yellow, { size: 1 })), { x: QUAY_EDGE - 0.3, y }));
  const paint = mat(PALETTE.yellow);
  for (const x of [-1.6, 0.9]) g.add(place(box(0.12, 0.02, 2 * HALF_D, paint), { x, y }));
  const white = mat(PALETTE.white);
  for (const z of [-3.8, -1.4, 1, 3.4]) g.add(place(box(1.4, 0.02, 0.12, white), { x: -0.35, y, z }));

  // rails on sleepers-in-concrete
  const railM = metal(PALETTE.steelLight, { roughness: 0.4 });
  const bed = mat(PALETTE.darkGrey);
  for (const x of [RAIL_LAND, RAIL_SEA]) {
    g.add(place(box(0.6, 0.02, 2 * HALF_D, bed), { x, y }));
    g.add(place(box(0.14, 0.14, 2 * HALF_D, railM), { x, y }));
  }

  // rubber fenders on the quay wall + bollards on the edge
  const rubber = mat(PALETTE.black);
  for (const z of [-3.6, 0, 3.6]) {
    g.add(place(box(0.35, 0.9, 1.1, rubber), { x: QUAY_EDGE + 0.17, y: LOT_HEIGHT + 0.1, z }));
  }
  const bollM = mat(PALETTE.darkGrey);
  for (const z of [-1.8, 1.8]) {
    g.add(place(cylinder(0.2, 0.22, 0.45, bollM, 8), { x: QUAY_EDGE - 0.35, y, z }));
    g.add(place(cylinder(0.3, 0.3, 0.1, bollM, 8), { x: QUAY_EDGE - 0.35, y: y + 0.45, z }));
  }
  return y;
}

// Wheel bogie that rides the rail, centred on the rail.
function bogie() {
  const body = mat(PALETTE.yellow);
  const dark = mat(PALETTE.darkGrey);
  const g = group(place(box(0.9, 0.55, 2.4, body), { y: 0.3 }));
  for (const z of [-0.8, 0, 0.8]) {
    const geo = new THREE.CylinderGeometry(0.28, 0.28, 0.6, 10);
    geo.rotateZ(Math.PI / 2);
    const w = new THREE.Mesh(geo, dark);
    w.position.set(0, 0.28, z);
    g.add(w);
  }
  g.add(place(box(1.2, 0.35, 0.9, body), { y: 0.85 }));
  return g;
}

function crane(g, y) {
  const red = mat(PALETTE.red, { roughness: 0.55 });
  const redDark = mat('#9e2620', { roughness: 0.6 });
  const white = mat(PALETTE.white);
  const steel = metal(PALETTE.steelDark);
  const top = y + PORTAL_H;
  const by = y + BOOM_Y;

  // legs (with bogies) and portal beams
  const legW = 0.7;
  for (const x of [RAIL_LAND, RAIL_SEA]) {
    for (const z of [-GAUGE, GAUGE]) {
      g.add(place(bogie(), { x, y, z }));
      g.add(place(box(legW, PORTAL_H - 1.2, legW, red), { x, y: y + 1.2, z }));
    }
    // sill beam along Z low down, portal beam at the top
    g.add(place(box(0.6, 0.7, 2 * GAUGE + legW, red), { x, y: y + 1.2 }));
    g.add(place(box(0.9, 1.0, 2 * GAUGE + legW, red), { x, y: top - 1.0 }));
  }
  for (const z of [-GAUGE, GAUGE]) {
    // portal girder joining land and sea legs, plus a knee brace
    g.add(place(box(RAIL_SEA - RAIL_LAND + legW, 1.0, 0.8, red), { x: (RAIL_LAND + RAIL_SEA) / 2, y: top - 1.0, z }));
    g.add(beam([RAIL_LAND, y + 5.5, z], [RAIL_LAND + 2.2, top - 1.0, z], 0.35, red));
    g.add(beam([RAIL_SEA, y + 5.5, z], [RAIL_SEA - 2.2, top - 1.0, z], 0.35, red));
    // boom supports: short posts from the portal up to the boom
    for (const x of [RAIL_LAND, RAIL_SEA]) g.add(place(box(0.5, BOOM_Y - PORTAL_H, 0.5, red), { x, y: top, z: Math.sign(z) * BOOM_Z }));
  }
  for (const x of [RAIL_LAND, RAIL_SEA]) g.add(place(box(0.6, 0.5, 2 * GAUGE, red), { x, y: top }));

  // boom: two box girders with white walkways, boom tip hinge
  for (const z of [-BOOM_Z, BOOM_Z]) {
    g.add(place(box(BOOM_X1 - BOOM_X0, BOOM_H, 0.55, red), { x: (BOOM_X0 + BOOM_X1) / 2, y: by, z }));
    g.add(place(box(BOOM_X1 - BOOM_X0, 0.08, 0.35, white), { x: (BOOM_X0 + BOOM_X1) / 2, y: by + BOOM_H, z: z + Math.sign(z) * 0.45 }));
    g.add(place(box(BOOM_X1 - BOOM_X0, 0.35, 0.05, steel), { x: (BOOM_X0 + BOOM_X1) / 2, y: by + BOOM_H + 0.08, z: z + Math.sign(z) * 0.62 }));
  }
  for (let x = BOOM_X0 + 0.6; x <= BOOM_X1 - 0.3; x += 2.4) g.add(place(box(0.35, 0.35, 2 * BOOM_Z, redDark), { x, y: by + BOOM_H - 0.35 }));
  g.add(place(box(0.5, BOOM_H + 0.3, 2 * BOOM_Z + 0.6, redDark), { x: BOOM_X1 - 0.25, y: by - 0.15 }));
  // hinge joint where the boom lifts (just seaside of the sea leg)
  g.add(place(cylinder(0.45, 0.45, 2 * BOOM_Z + 0.9, redDark, 10), { x: RAIL_SEA + 1.2, y: by + 0.55, z: -(BOOM_Z + 0.45), rx: 90 }));

  // A-frame: two raking legs per side meeting at the apex, with a cross-head
  const apexZ = 1.1;
  for (const s of [-1, 1]) {
    g.add(beam([RAIL_LAND, by + BOOM_H, s * BOOM_Z], [APEX_X, y + APEX_Y, s * apexZ], 0.55, red));
    g.add(beam([RAIL_SEA, by + BOOM_H, s * BOOM_Z], [APEX_X, y + APEX_Y, s * apexZ], 0.55, red));
    g.add(beam([(RAIL_LAND + APEX_X) / 2, by + BOOM_H + (APEX_Y - BOOM_Y - BOOM_H) / 2, s * (BOOM_Z + apexZ) / 2],
      [(RAIL_SEA + APEX_X) / 2, by + BOOM_H + (APEX_Y - BOOM_Y - BOOM_H) / 2, s * (BOOM_Z + apexZ) / 2], 0.3, red));
  }
  g.add(place(box(1.2, 0.8, 2 * apexZ + 0.6, redDark), { x: APEX_X, y: y + APEX_Y - 0.3 }));
  g.add(place(box(0.5, 0.5, 0.5, emissive('#ff5040', 1)), { x: APEX_X, y: y + APEX_Y + 0.5 }));

  // forestays to the boom tip and backstays to the tail
  const cable = metal(PALETTE.steelDark);
  for (const s of [-1, 1]) {
    g.add(beam([APEX_X + 0.3, y + APEX_Y, s * apexZ], [BOOM_X1 - 0.4, by + BOOM_H, s * BOOM_Z], 0.16, cable));
    g.add(beam([APEX_X + 0.3, y + APEX_Y - 0.3, s * apexZ], [RAIL_SEA + 3.4, by + BOOM_H, s * BOOM_Z], 0.14, cable));
    g.add(beam([APEX_X - 0.3, y + APEX_Y, s * apexZ], [BOOM_X0 + 1.6, by + BOOM_H, s * BOOM_Z], 0.2, red));
  }

  // machinery house on the back of the boom, with a company sign
  const mh = box(4.2, 2.2, 1.9, [mat(PALETTE.white), mat(PALETTE.white), mat(PALETTE.lightGrey), mat(PALETTE.white), mat(PALETTE.white), mat(PALETTE.white)]);
  g.add(place(mh, { x: BOOM_X0 + 2.6, y: by + BOOM_H }));
  for (const x of [-1.3, 0, 1.3]) g.add(place(box(0.6, 0.6, 0.06, mat(PALETTE.glassDark)), { x: BOOM_X0 + 2.6 + x, y: by + BOOM_H + 1.2, z: 0.97 }));
  g.add(place(sign({ text: 'TINY PORT', w: 3.6, h: 0.7, bg: PALETTE.navy, fg: '#ffffff' }), { x: BOOM_X0 + 2.6, y: by + BOOM_H + 2.25, z: 0 }));
  g.add(place(sign({ text: 'TINY PORT', w: 3.6, h: 0.7, bg: PALETTE.navy, fg: '#ffffff' }), { x: BOOM_X0 + 2.6, y: by + BOOM_H + 2.25, z: 0, ry: 180 }));
  // counterweight under the tail
  g.add(place(box(1.4, 1.3, 2 * BOOM_Z + 0.5, mat(PALETTE.concreteDark)), { x: BOOM_X0 + 0.8, y: by - 1.3 }));

  // trolley with the operator cab, running under the boom over the water
  const tx = 6.6;
  g.add(place(box(2.2, 0.6, 2 * BOOM_Z + 0.8, mat(PALETTE.steelLight)), { x: tx, y: by - 0.6 }));
  const cab = group(
    box(1.6, 1.5, 1.4, mat(PALETTE.white)),
    place(box(1.65, 0.8, 1.45, mat(PALETTE.glassBlue, { roughness: 0.2, metalness: 0.3 })), { y: 0.25 }),
  );
  g.add(place(cab, { x: tx - 0.6, y: by - 2.3, z: BOOM_Z + 0.2 }));

  // hoist ropes, spreader and the hoisted container
  const cy = y + 3.4; // underside of the hoisted container
  const spY = cy + 2.6;
  for (const [dx, dz] of [[-0.6, -1.6], [0.6, -1.6], [-0.6, 1.6], [0.6, 1.6]]) {
    g.add(beam([tx + dx * 0.6, by - 0.6, dz * 0.5], [tx + dx, spY + 0.35, dz], 0.06, cable));
  }
  g.add(place(box(2.4, 0.35, 6.3, mat(PALETTE.yellow)), { x: tx, y: spY }));
  g.add(place(box(0.9, 0.5, 0.9, mat(PALETTE.darkGrey)), { x: tx, y: spY + 0.35 }));
  g.add(place(container({ color: PALETTE.blue }), { x: tx, y: cy, ry: 90 }));

  // deck plate under the machinery house
  g.add(place(box(4.6, 0.2, 2 * BOOM_Z, mat(PALETTE.steelDark)), { x: BOOM_X0 + 2.6, y: by + BOOM_H - 0.2 }));
}

function yard(g, y) {
  // container stacks on the landside under the backreach
  const cols = [PALETTE.orange, PALETTE.green, PALETTE.navy, PALETTE.red, PALETTE.lightGrey, PALETTE.yellow, PALETTE.rust];
  const stacks = [
    { z: -3.1, n: 3 },
    { z: -0.5, n: 2 },
  ];
  let k = 0;
  for (const { z, n } of stacks) {
    for (let i = 0; i < n; i++) {
      g.add(place(container({ color: cols[k++ % cols.length] }), { x: -7.15, y: y + i * 2.6, z }));
    }
  }

  // container truck in the lane under the portal, waiting for the box
  g.add(place(truck({ color: PALETTE.yellow, trailerColor: PALETTE.green }), { x: -0.35, y, z: 0.4, ry: -90, s: 0.62 }));
  // terminal tractor parked by the stacks
  const tt = group(
    place(box(1.4, 1.5, 1.4, mat(PALETTE.orange)), { x: 0.3, y: 0.35 }),
    place(box(0.05, 0.6, 1.1, mat(PALETTE.glassDark)), { x: 1.02, y: 1.1 }),
    place(box(2.4, 0.35, 1.3, mat(PALETTE.darkGrey)), { x: -0.4, y: 0.25 }),
  );
  g.add(place(tt, { x: -7.2, y, z: 3.6, ry: 0 }));

  // floodlights and traffic cones
  g.add(place(streetLamp({ h: 6 }), { x: -9.6, y, z: 1.6 }));
  g.add(place(streetLamp({ h: 6 }), { x: 3.6, y, z: -4.6, ry: 180 }));
  const cone = mat(PALETTE.orange);
  for (const z of [4.4, 2.8]) g.add(place(cylinder(0.02, 0.18, 0.5, cone, 6), { x: 0.9, y, z }));
}

function water(g) {
  // a little harbour tug nosing along the quay
  const hull = mat(PALETTE.navy);
  const tug = group(
    place(box(3.6, 0.6, 1.6, hull), { y: 0 }),
    place(box(0.9, 0.6, 1.2, hull), { x: 2.0, y: 0.05, s: 1 }),
    place(box(1.4, 0.9, 1.1, mat(PALETTE.white)), { x: 0.2, y: 0.6 }),
    place(box(1.0, 0.5, 0.9, mat(PALETTE.white)), { x: 0.4, y: 1.5 }),
    place(box(1.05, 0.25, 0.95, mat(PALETTE.glassDark)), { x: 0.4, y: 1.6 }),
    place(cylinder(0.18, 0.18, 0.8, mat(PALETTE.red), 8), { x: -0.5, y: 1.5 }),
    place(box(3.65, 0.15, 1.65, mat(PALETTE.black)), { y: 0.1 }),
  );
  g.add(place(tug, { x: 8.9, y: LOT_HEIGHT, z: -2.3, ry: 90 }));
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'water'));
  const y = quay(g);
  crane(g, y);
  yard(g, y);
  water(g);
  return g;
}

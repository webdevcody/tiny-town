import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, place, group, beam, cylinder, gableRoof, windowPanel, door,
  surface, mat, metal, glass, emissive, field, tree, fence, car, streetLamp,
} from '../../src/lib/index.js';
import { board, barrier, crossingLights, semaphore, warningSign, telegraphPole } from './props.js';

// 1x1 tile (10 x 10 m). Front (street side) faces +z.
// A double-track railway runs along x, a road crosses it along z, and the
// signal box stands in the front-left corner watching over the crossing.
const H = TILE / 2;
const TRACKS = [-2.4, 0];           // track centres (z)
const BALLAST = [-3.7, 1.3];        // ballast bed extent (z)
const ROAD = [0.6, 4.0];            // road extent (x)
const GAUGE = 0.72;                 // half the rail spacing

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  railway(g, y0);
  road(g, y0);
  signalBox(g, y0);
  crossingKit(g, y0);
  lineside(g, y0);
  return g;
}

function railway(g, y0) {
  const [bz0, bz1] = BALLAST;
  const ballast = surface('gravel', '#8f877a', { size: 2.5 });
  g.add(place(box(TILE, 0.12, bz1 - bz0, ballast), { y: y0, z: (bz0 + bz1) / 2 }));
  const sleeperM = mat('#5b4634');
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  const railFoot = mat(PALETTE.rust);
  const [rx0, rx1] = ROAD;
  for (const tz of TRACKS) {
    for (let x = -H + 0.3; x < H; x += 0.62) {
      if (x > rx0 - 0.2 && x < rx1 + 0.2) continue;
      g.add(place(box(0.26, 0.07, 2.2, sleeperM), { x, y: y0 + 0.12, z: tz }));
    }
    for (const s of [-1, 1]) {
      g.add(place(box(TILE, 0.05, 0.14, railFoot), { y: y0 + 0.19, z: tz + s * GAUGE }));
      g.add(place(box(TILE, 0.07, 0.08, railM), { y: y0 + 0.24, z: tz + s * GAUGE }));
    }
  }
  // signal wires & rodding run from the box along the lineside
  const rodM = metal(PALETTE.steel);
  for (let x = -4.7; x <= -0.3; x += 0.55) g.add(place(box(0.08, 0.2, 0.08, mat(PALETTE.woodDark)), { x, y: y0 + 0.12, z: bz1 - 0.15 }));
  for (const dz of [-0.04, 0.04]) g.add(place(box(4.5, 0.03, 0.03, rodM), { x: -2.5, y: y0 + 0.28, z: bz1 - 0.15 + dz }));
}

function road(g, y0) {
  const [rx0, rx1] = ROAD;
  const rw = rx1 - rx0, rc = (rx0 + rx1) / 2;
  const [bz0, bz1] = BALLAST;
  const white = mat(PALETTE.roadLine);
  // approaches
  g.add(place(patch(rw, H - bz1, 'asphalt', 0.1), { x: rc, y: y0, z: (H + bz1) / 2 }));
  g.add(place(patch(rw, bz0 + H, 'asphalt', 0.1), { x: rc, y: y0, z: (bz0 - H) / 2 }));
  // crossing deck flush with the rail heads
  const deck = surface('asphalt', '#3d3d42', { size: 3, roughness: 0.95 });
  g.add(place(box(rw, 0.27, bz1 - bz0, deck), { x: rc, y: y0, z: (bz0 + bz1) / 2 }));
  // short ramps onto the deck
  for (const [z, s] of [[bz1 + 0.25, 1], [bz0 - 0.25, -1]]) {
    g.add(place(box(rw, 0.1, 0.5, deck), { x: rc, y: y0 + 0.1, z, rx: s * 18 }));
  }
  // rails pass through the deck (flangeways)
  const railM = metal(PALETTE.steelLight, { roughness: 0.3 });
  for (const tz of TRACKS) for (const s of [-1, 1]) {
    g.add(place(box(rw, 0.02, 0.1, railM), { x: rc, y: y0 + 0.27, z: tz + s * GAUGE }));
    g.add(place(box(rw, 0.021, 0.05, mat(PALETTE.black)), { x: rc, y: y0 + 0.27, z: tz + s * GAUGE - s * 0.09 }));
  }
  // yellow box markings across the deck edges, white edge lines, centre dashes, stop lines
  const yellow = mat(PALETTE.yellow);
  for (const x of [rx0 + 0.12, rx1 - 0.12]) g.add(place(box(0.1, 0.01, bz1 - bz0, white), { x, y: y0 + 0.27, z: (bz0 + bz1) / 2 }));
  for (let z = bz0 - 0.6; z - 0.6 > -H; z -= 1.3) g.add(place(box(0.1, 0.01, 0.6, white), { x: rc, y: y0 + 0.1, z: z - 0.3 }));
  for (let z = bz1 + 0.9; z + 0.6 < H; z += 1.3) g.add(place(box(0.1, 0.01, 0.6, white), { x: rc, y: y0 + 0.1, z: z + 0.3 }));
  g.add(place(box(rw / 2 - 0.1, 0.01, 0.22, white), { x: rc + rw / 4, y: y0 + 0.1, z: 2.4 }));
  g.add(place(box(rw / 2 - 0.1, 0.01, 0.22, white), { x: rc - rw / 4, y: y0 + 0.1, z: bz0 - 0.75 }));
  // "keep clear" zig-zag hint: yellow edge bars where road meets deck
  for (const z of [bz1 - 0.08, bz0 + 0.08]) g.add(place(box(rw, 0.012, 0.12, yellow), { x: rc, y: y0 + 0.27, z }));
  // car waiting at the lowered barrier, northbound in the right lane
  g.add(place(car({ color: PALETTE.blue }), { x: rc + rw / 4, y: y0 + 0.1, z: 3.75, ry: 90, s: 0.6 }));
}

function signalBox(g, y0) {
  const bx = -2.9, bz = 3.1, w = 3.2, d = 2.5;
  const baseH = 2.4, upH = 2.4;
  const yb = y0 + baseH;
  const brick = surface('brick', PALETTE.brick, { size: 1 });
  const cream = mat(PALETTE.cream);
  const brown = surface('planks', '#6a3a26', { size: 1.2 });

  // gravel yard round the box
  g.add(place(patch(4.4, 3.6, 'gravel'), { x: bx + 0.4, y: y0, z: bz + 0.05 }));

  // brick locking room
  g.add(place(box(w + 0.1, 0.35, d + 0.1, mat(PALETTE.brickDark)), { x: bx, y: y0, z: bz }));
  g.add(place(box(w, baseH, d, brick), { x: bx, y: y0, z: bz }));
  g.add(place(box(w + 0.12, 0.12, d + 0.12, mat(PALETTE.stone)), { x: bx, y: yb - 0.12, z: bz }));
  for (const [face, ry] of [[1, 0], [-1, 180]]) {
    const z = bz + face * d / 2;
    for (const x of [-1.05, 1.05]) {
      g.add(place(windowPanel({ w: 0.62, h: 0.8, frame: PALETTE.cream }), { x: bx + x, y: y0 + 0.65, z, ry }));
      g.add(place(box(0.86, 0.12, 0.12, mat(PALETTE.stone)), { x: bx + x, y: y0 + 1.55, z: z + face * 0.04 }));
    }
    // nameboard on both long sides
    g.add(place(board({ text: 'TINY TOWN', w: 2.3, h: 0.42, bg: '#1f2a44', fg: '#ffffff', depth: 0.06 }), { x: bx, y: y0 + 1.78, z: z + face * 0.04, ry }));
  }
  g.add(place(door({ w: 0.75, h: 1.35, color: PALETTE.woodDark, frame: PALETTE.cream }), { x: bx, y: y0 + 0.2, z: bz + d / 2 }));

  // fire buckets on the west end
  g.add(place(box(0.06, 0.12, 1.4, mat(PALETTE.woodDark)), { x: bx - w / 2 - 0.03, y: y0 + 1.55, z: bz }));
  for (const dz of [-0.45, 0, 0.45]) {
    g.add(place(cylinder(0.15, 0.11, 0.3, mat(PALETTE.red), 8), { x: bx - w / 2 - 0.17, y: y0 + 1.22, z: bz + dz }));
    g.add(place(box(0.24, 0.02, 0.24, mat('#e8e2c8')), { x: bx - w / 2 - 0.17, y: y0 + 1.5, z: bz + dz }));
  }

  // timber operating floor: panelled dado, continuous glazing, fascia
  const dado = 0.8, glassH = 1.3;
  g.add(place(box(w + 0.16, 0.1, d + 0.16, cream), { x: bx, y: yb, z: bz }));
  g.add(place(box(w, dado, d, brown), { x: bx, y: yb + 0.1, z: bz }));
  g.add(place(box(w - 0.1, glassH, d - 0.1, glass(PALETTE.glassSky, { opacity: 0.5 })), { x: bx, y: yb + 0.1 + dado, z: bz }));
  g.add(place(box(w + 0.04, 0.3, d + 0.04, cream), { x: bx, y: yb + 0.1 + dado + glassH, z: bz }));
  // sill and transom bars
  for (const y of [yb + 0.1 + dado, yb + 0.1 + dado + 0.88]) g.add(place(box(w + 0.06, 0.07, d + 0.06, cream), { x: bx, y, z: bz }));
  // mullions round all four sides
  const gy = yb + 0.1 + dado;
  const mull = (x, z) => g.add(place(box(0.07, glassH, 0.07, cream), { x, y: gy, z }));
  for (let i = 0; i <= 6; i++) {
    const x = bx - w / 2 + (i * w) / 6;
    mull(x, bz + d / 2); mull(x, bz - d / 2);
  }
  for (let i = 1; i < 5; i++) {
    const z = bz - d / 2 + (i * d) / 5;
    mull(bx - w / 2, z); mull(bx + w / 2, z);
  }
  // lever frame inside, seen through the glass
  const lever = ['#c8322b', '#c8322b', '#e9c31f', '#232326', '#c8322b', '#2f6fbf', '#c8322b', '#e9c31f', '#c8322b', '#232326'];
  g.add(place(box(w - 0.6, 0.25, 0.3, mat(PALETTE.darkGrey)), { x: bx, y: yb + 0.1 + dado, z: bz - 0.55 }));
  lever.forEach((c, i) => {
    const x = bx - (w - 0.8) / 2 + (i * (w - 0.8)) / (lever.length - 1);
    const pulled = i % 3 === 1;
    g.add(beam([x, yb + 0.35 + dado, bz - 0.55], [x, yb + 1.25 + dado, bz - 0.55 + (pulled ? 0.45 : -0.15)], 0.06, mat(c, { roughness: 0.4 })));
  });
  // block instruments shelf
  g.add(place(box(w - 0.6, 0.25, 0.25, mat(PALETTE.woodDark)), { x: bx, y: yb + 0.1 + dado + 1.0, z: bz - d / 2 + 0.2 }));
  // a warm lamp inside
  g.add(place(box(0.25, 0.15, 0.25, emissive(PALETTE.windowLit, 1.2)), { x: bx + 0.6, y: yb + 0.1 + dado + glassH - 0.2, z: bz }));

  // slate gable roof with cream bargeboards and finials
  const ry0 = yb + 0.1 + dado + glassH + 0.3;
  const rh = 1.3, ov = 0.45;
  g.add(place(gableRoof({ w, d, h: rh, overhang: ov, ridge: 'x', material: surface('roofTiles', PALETTE.roofSlate, { size: 1.5 }), gableMaterial: cream }), { x: bx, y: ry0, z: bz }));
  const drop = (ov * rh) / (d / 2);
  for (const s of [-1, 1]) {
    const x = bx + s * (w / 2 + ov + 0.04);
    for (const zs of [-1, 1]) g.add(beam([x, ry0 - drop - 0.1, bz + zs * (d / 2 + ov)], [x, ry0 + rh + 0.05, bz], 0.13, cream));
    g.add(place(cylinder(0.03, 0.06, 0.55, cream, 6), { x, y: ry0 + rh, z: bz }));
  }
  g.add(place(box(w + 2 * ov, 0.1, 0.12, mat(PALETTE.roofBlack)), { x: bx, y: ry0 + rh - 0.04, z: bz }));
  // stove pipe
  g.add(place(cylinder(0.09, 0.09, 1.1, mat(PALETTE.black), 8), { x: bx - 0.9, y: ry0 + 0.6, z: bz - 0.5 }));
  g.add(place(cylinder(0.16, 0.12, 0.14, mat(PALETTE.black), 8), { x: bx - 0.9, y: ry0 + 1.7, z: bz - 0.5 }));

  // window-cleaning gallery on the track side
  const steel = metal(PALETTE.darkGrey);
  const gz = bz - d / 2 - 0.3;
  g.add(place(box(w, 0.06, 0.55, steel), { x: bx, y: yb + 0.04, z: gz }));
  g.add(place(box(w, 0.05, 0.05, cream), { x: bx, y: yb + 1.0, z: gz - 0.25 }));
  for (let i = 0; i <= 5; i++) g.add(place(box(0.05, 0.95, 0.05, cream), { x: bx - w / 2 + 0.03 + (i * (w - 0.06)) / 5, y: yb + 0.05, z: gz - 0.25 }));
  for (const x of [bx - w / 2 + 0.2, bx + w / 2 - 0.2]) g.add(beam([x, yb - 0.6, bz - d / 2], [x, yb, gz - 0.2], 0.07, steel));

  // external staircase on the east end, up to the operating-floor door
  const sx0 = bx + w / 2 + 0.05, sx1 = sx0 + 0.85, sxc = (sx0 + sx1) / 2;
  const landZ0 = bz - d / 2, landZ1 = landZ0 + 1.0;
  const footZ = 4.85;
  const timber = mat(PALETTE.woodDark);
  g.add(place(box(0.85, 0.1, 1.0, timber), { x: sxc, y: yb, z: (landZ0 + landZ1) / 2 }));
  for (const z of [landZ0 + 0.1, landZ1 - 0.05]) g.add(place(box(0.1, baseH, 0.1, timber), { x: sx1 - 0.05, y: y0, z }));
  const steps = 11;
  for (let i = 0; i < steps; i++) {
    const t = (i + 0.5) / steps;
    g.add(place(box(0.75, 0.05, 0.28, mat(PALETTE.wood)), { x: sxc, y: y0 + t * baseH, z: footZ - t * (footZ - landZ1) }));
  }
  for (const x of [sx0 + 0.04, sx1 - 0.04]) g.add(beam([x, y0 + 0.05, footZ], [x, yb + 0.05, landZ1], 0.08, timber));
  g.add(beam([sx1 - 0.04, y0 + 0.95, footZ], [sx1 - 0.04, yb + 0.95, landZ1], 0.06, cream));
  g.add(place(box(0.05, 0.05, 1.0, cream), { x: sx1 - 0.04, y: yb + 0.95, z: (landZ0 + landZ1) / 2 }));
  for (const z of [landZ0 + 0.05, landZ1]) g.add(place(box(0.05, 0.95, 0.05, cream), { x: sx1 - 0.04, y: yb, z }));
  g.add(place(door({ w: 0.7, h: 1.95, color: '#6a3a26', frame: PALETTE.cream }), { x: bx + w / 2, y: yb + 0.1, z: (landZ0 + landZ1) / 2 + 0.05, ry: 90 }));

  // signalman's garden: picket fence, flowers, bush, coal bunker, bike
  g.add(place(patch(3.2, 0.5, field('flowers', { size: 2 })), { x: bx, y: y0, z: 4.6 }));
  g.add(place(fence({ w: 3.9, d: 0.1, h: 0.7, style: 'picket', sides: ['front'] }), { x: bx + 0.35, y: y0, z: H - 0.3 - 0.05 }));
  g.add(place(box(0.9, 0.7, 0.6, mat(PALETTE.concreteDark)), { x: -4.4, y: y0, z: 1.9 + 0.1 }));
  g.add(place(box(0.9, 0.12, 0.6, mat(PALETTE.black)), { x: -4.4, y: y0 + 0.7, z: 2.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 }), { x: -4.55, y: y0, z: 4.55 }));
}

function crossingKit(g, y0) {
  const [rx0, rx1] = ROAD;
  const [bz0, bz1] = BALLAST;
  const rw = rx1 - rx0;
  const wx = rx0 - 0.3, ex = rx1 + 0.35;
  // south approach: barrier from the west post, lights both sides facing +z
  g.add(place(crossingLights({ litLeft: true }), { x: wx, y: y0, z: bz1 + 0.25 }));
  g.add(place(crossingLights({ litLeft: true }), { x: ex, y: y0, z: bz1 + 0.25 }));
  g.add(place(barrier({ len: rw - 0.05 }), { x: wx, y: y0, z: bz1 + 0.75 }));
  // north approach: barrier from the east post, lights facing -z
  g.add(place(crossingLights({ litLeft: false }), { x: ex, y: y0, z: bz0 - 0.25, ry: 180 }));
  g.add(place(crossingLights({ litLeft: false }), { x: wx, y: y0, z: bz0 - 0.25, ry: 180 }));
  g.add(place(barrier({ len: rw - 0.05 }), { x: ex, y: y0, z: bz0 - 0.75, ry: 180 }));
  // warning sign on the southern approach
  g.add(place(warningSign(), { x: ex + 0.15, y: y0, z: 4.6 }));
}

function lineside(g, y0) {
  const [bz0, bz1] = BALLAST;
  // semaphores: west one cleared for the eastbound train, east one at danger
  g.add(place(semaphore({ clear: true }), { x: -4.35, y: y0, z: bz0 - 0.65, ry: -90 }));
  g.add(place(semaphore({ clear: false }), { x: 4.62, y: y0, z: 2.75, ry: 90 }));
  // lineside fence along the north edge
  g.add(place(fence({ w: 5.2, d: 0.1, h: 0.9, style: 'wire', sides: ['front'] }), { x: -2.4, y: y0, z: -H + 0.2 }));
  // telegraph pole with wires along the line
  const px = -1.4, pz = -H + 0.55, ph = 5.5;
  g.add(place(telegraphPole({ h: ph }), { x: px, y: y0, z: pz }));
  const wireM = mat(PALETTE.black);
  for (const [y, w] of [[ph - 0.15, 1.4], [ph - 0.65, 1.1]]) {
    for (let i = 0; i < 4; i++) {
      const z = pz - w / 2 + 0.12 + (i * (w - 0.24)) / 3;
      g.add(beam([-H, y0 + y - 0.25, z], [px, y0 + y + 0.02, z], 0.025, wireM));
      g.add(beam([px, y0 + y + 0.02, z], [H, y0 + y - 0.3, z], 0.025, wireM));
    }
  }
  // relay cabinet and lamp by the crossing
  g.add(place(box(0.8, 1.2, 0.5, mat(PALETTE.steelLight)), { x: -0.6, y: y0, z: bz0 - 0.55 }));
  g.add(place(box(0.86, 0.06, 0.56, mat(PALETTE.steel)), { x: -0.6, y: y0 + 1.2, z: bz0 - 0.55 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -0.05, y: y0, z: 4.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 8 }), { x: 4.55, y: y0, z: -4.6 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 3 }), { x: -3.3, y: y0, z: -4.55 }));
}

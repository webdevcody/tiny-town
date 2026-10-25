import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, gableRoof, parapet, door, box, cylinder, place, mat, metal,
  surface, lattice, beam, fence, tree, solarPanel, rooftopUnits, streetLamp,
} from '../../src/lib/index.js';
import {
  plate, stevensonScreen, rainGauge, sunshineRecorder, cupAnemometer, windVane,
  windsock, weatherBalloon, beacon,
} from './instruments.js';

// 1x1 tile (10 x 10 m). Front (gate) faces +z.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const white = mat(PALETTE.white);
  const concrete = mat(PALETTE.concrete);

  // --- radar tower (back right): concrete shaft, railed deck, geodesic radome
  const tx = 2.75, tz = -2.8, tw = 3.2, th = 2 * FLOOR;
  g.add(place(facadeBlock({
    w: tw, d: tw, floors: 2, style: 'punched', wall: PALETTE.concrete, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.35, windowH: 0.45, bay: 1.6, seed: 4, blank: ['front'],
  }), { x: tx, y: y0, z: tz }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.navy }), { x: tx, y: y0, z: tz + tw / 2 }));
  g.add(place(plate({ text: 'WEATHER', w: 2.8, h: 0.75, bg: PALETTE.navy }), { x: tx, y: y0 + 4.75, z: tz + tw / 2 }));
  const deckY = y0 + th;
  g.add(place(box(tw + 0.4, 0.25, tw + 0.4, concrete), { x: tx, y: deckY, z: tz }));
  g.add(place(fence({ w: tw + 0.3, d: tw + 0.3, h: 0.8, style: 'railing', color: PALETTE.yellow }), { x: tx, y: deckY + 0.25, z: tz }));
  const domeR = 1.9;
  const radome = new THREE.Mesh(
    new THREE.IcosahedronGeometry(domeR, 2),
    mat(PALETTE.white, { roughness: 0.45 })
  );
  radome.position.set(tx, deckY + 0.25 + 1.0, tz);
  g.add(radome);
  g.add(place(cylinder(1.55, 1.6, 0.35, mat(PALETTE.lightGrey), 16), { x: tx, y: deckY + 0.25, z: tz }));
  g.add(place(cylinder(0.03, 0.03, 0.6, metal(PALETTE.steelLight), 6), { x: tx, y: deckY + 0.25 + 1.0 + domeR - 0.05, z: tz }));
  g.add(place(beacon(), { x: tx, y: deckY + 0.25 + 1.0 + domeR + 0.5, z: tz }));

  // --- operations office (back left)
  const ox = -1.65, oz = -2.85, ow = 5.6, od = 3.1;
  g.add(place(facadeBlock({
    w: ow, d: od, floors: 1, style: 'ribbon', wall: PALETTE.cream, frame: PALETTE.navy,
    glass: PALETTE.glassSky, seed: 7, blank: ['right'], roof: PALETTE.roofGrey,
  }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: ow, d: od, h: 0.45, t: 0.2, material: mat(PALETTE.white) }), { x: ox, y: y0 + FLOOR, z: oz }));
  g.add(place(door({ w: 1.1, h: 2.2, color: PALETTE.navy }), { x: 0.2, y: y0, z: oz + od / 2 }));
  g.add(place(box(1.8, 0.12, 1.0, white), { x: 0.2, y: y0 + 2.45, z: oz + od / 2 + 0.5 }));
  g.add(place(solarPanel({ w: 1.6, d: 0.9, tilt: 25, height: 0.3 }), { x: ox - 1.4, y: y0 + FLOOR, z: oz + 0.6 }));
  g.add(place(solarPanel({ w: 1.6, d: 0.9, tilt: 25, height: 0.3 }), { x: ox + 0.4, y: y0 + FLOOR, z: oz + 0.6 }));
  g.add(place(rooftopUnits({ w: 1.6, d: 1.0, count: 2, seed: 3 }), { x: ox + 1.6, y: y0 + FLOOR, z: oz - 0.7 }));
  // small rooftop dish (satellite data link)
  const dish = new THREE.Mesh(new THREE.SphereGeometry(0.45, 12, 6, 0, Math.PI * 2, 0, Math.PI / 3.2), mat(PALETTE.white, { side: THREE.DoubleSide }));
  g.add(place(cylinder(0.05, 0.05, 0.6, metal(PALETTE.steel), 6), { x: ox - 2.1, y: y0 + FLOOR, z: oz - 0.8 }));
  g.add(place(dish, { x: ox - 2.1, y: y0 + FLOOR + 1.0, z: oz - 0.8, rx: 145 }));

  // --- tall anemometer mast between office and enclosure
  const mx = -4.15, mz = -0.65, mh = 8.4;
  // red/white painted bands
  const band = mh / 3;
  for (let i = 0; i < 3; i++) {
    const m = metal(i % 2 ? PALETTE.white : PALETTE.red);
    g.add(place(lattice({ w: 0.45, h: band, thickness: 0.07, segments: 3, material: m }), { x: mx, y: y0 + i * band, z: mz }));
  }
  g.add(place(box(0.1, 0.1, 1.6, metal(PALETTE.steelLight)), { x: mx, y: y0 + mh, z: mz }));
  g.add(place(cupAnemometer({ r: 0.4, spin: 0.4 }), { x: mx, y: y0 + mh + 0.05, z: mz - 0.75 }));
  g.add(place(windVane({ len: 0.9 }), { x: mx, y: y0 + mh + 0.05, z: mz + 0.75, ry: -35 }));
  g.add(place(box(0.08, 0.08, 1.0, metal(PALETTE.steelLight)), { x: mx, y: y0 + mh * 0.55, z: mz }));
  g.add(place(cupAnemometer({ r: 0.32, spin: 1.1 }), { x: mx, y: y0 + mh * 0.55 + 0.05, z: mz + 0.45 }));
  g.add(place(beacon(), { x: mx, y: y0 + mh + 0.6, z: mz }));
  g.add(place(cylinder(0.03, 0.03, 0.5, metal(PALETTE.steelLight), 6), { x: mx, y: y0 + mh + 0.1, z: mz }));
  const wire = mat(PALETTE.darkGrey);
  for (const [ax, az] of [[-0.45, 0.6], [0.9, 0.45], [0.7, -0.5]]) {
    g.add(beam([mx, y0 + mh * 0.7, mz], [mx + ax, y0, mz + az], 0.025, wire));
  }

  // --- instrument enclosure (front left): short grass, white picket fence
  const ex = -2.6, ez = 1.95, ew = 3.5, ed = 3.7;
  g.add(place(patch(ew, ed, mat(PALETTE.grassLight)), { x: ex, y: y0, z: ez }));
  g.add(place(fence({ w: ew, d: ed, h: 0.7, style: 'picket', gap: 0.9 }), { x: ex, y: y0, z: ez }));
  g.add(place(stevensonScreen(), { x: ex - 0.85, y: y0, z: ez - 0.9 }));
  g.add(place(stevensonScreen(), { x: ex + 0.75, y: y0, z: ez - 0.9 }));
  g.add(place(rainGauge(), { x: ex - 1.2, y: y0, z: ez + 0.9 }));
  g.add(place(rainGauge(), { x: ex - 0.55, y: y0, z: ez + 1.1 }));
  g.add(place(sunshineRecorder(), { x: ex + 1.05, y: y0, z: ez + 0.8 }));
  // stepping slabs
  for (let i = 0; i < 3; i++) g.add(place(patch(0.5, 0.4, 'paved'), { x: ex + 0.05, y: y0 + 0.02, z: ez + 0.35 + i * 0.55 }));

  // --- balloon-launch shed (front right): tall corrugated hangar, big doors
  const sx = 3.0, sz = 0.85, sw = 2.8, sd = 2.8, sh = 3.6;
  const clad = surface('corrugated', PALETTE.plasterBlue, { size: 1 });
  g.add(place(box(sw, sh, sd, clad), { x: sx, y: y0, z: sz }));
  g.add(place(gableRoof({ w: sw, d: sd, h: 0.9, overhang: 0.2, ridge: 'z', material: surface('corrugated', PALETTE.roofRed, { size: 1 }), gableMaterial: clad }), { x: sx, y: y0 + sh, z: sz }));
  g.add(place(box(2.0, 2.75, 0.08, mat(PALETTE.orange)), { x: sx, y: y0, z: sz + sd / 2 }));
  g.add(place(box(0.05, 2.75, 0.1, mat(shadeDark())), { x: sx, y: y0, z: sz + sd / 2 + 0.02 }));
  for (const yy of [1.0, 2.0]) g.add(place(box(2.0, 0.05, 0.1, mat(shadeDark())), { x: sx, y: y0 + yy, z: sz + sd / 2 + 0.02 }));
  g.add(place(plate({ text: 'BALLOONS', w: 2.3, h: 0.6, bg: PALETTE.white, fg: PALETTE.navy, border: PALETTE.navy }), { x: sx, y: y0 + 2.88, z: sz + sd / 2 }));
  // hydrogen cylinders on a rack by the shed
  const gas = metal(PALETTE.green, { roughness: 0.5 });
  for (let i = 0; i < 4; i++) {
    g.add(place(cylinder(0.13, 0.13, 1.3, gas, 10), { x: 1.25, y: y0, z: -0.15 + i * 0.32 }));
    g.add(place(cylinder(0.05, 0.08, 0.12, metal(PALETTE.steelLight), 6), { x: 1.25, y: y0 + 1.3, z: -0.15 + i * 0.32 }));
  }
  g.add(place(box(0.08, 0.06, 1.4, metal(PALETTE.darkGrey)), { x: 1.08, y: y0 + 0.9, z: 0.33 }));

  // launch pad with a just-released radiosonde balloon
  g.add(place(patch(2.9, 1.9, 'concrete'), { x: sx, y: y0, z: 3.55 }));
  g.add(place(cylinder(0.75, 0.75, 0.02, mat(PALETTE.yellow), 20), { x: sx, y: y0 + 0.05, z: 3.55 }));
  g.add(place(cylinder(0.6, 0.6, 0.03, concrete, 20), { x: sx, y: y0 + 0.05, z: 3.55 }));
  g.add(place(weatherBalloon({ r: 1.0, line: 2.4 }), { x: sx + 0.3, y: y0 + 4.6, z: 3.3 }));

  // --- grounds: path, perimeter fence, gate sign, windsock, planting
  g.add(place(patch(1.3, 6.0, 'paved'), { x: 0.2, y: y0, z: 1.75 }));
  g.add(place(fence({ w: TILE - 0.5, d: TILE - 0.5, h: 1.3, style: 'wire', gap: 1.6 }), { x: 0.2 - 0.2, y: y0 }));
  for (const gx of [-0.85, 0.85]) g.add(place(box(0.18, 1.6, 0.18, mat(PALETTE.darkGrey)), { x: gx, y: y0, z: TILE / 2 - 0.25 }));
  // gate sign on two posts, left of the gate
  g.add(place(box(0.1, 1.0, 0.1, mat(PALETTE.darkGrey)), { x: -3.4, y: y0, z: 4.45 }));
  g.add(place(box(0.1, 1.0, 0.1, mat(PALETTE.darkGrey)), { x: -1.6, y: y0, z: 4.45 }));
  g.add(place(plate({ text: 'WEATHER STATION', w: 2.6, h: 0.6, bg: PALETTE.navy, border: PALETTE.white }), { x: -2.5, y: y0 + 0.85, z: 4.5 }));
  g.add(place(windsock({ h: 3.6 }), { x: -1.0, y: y0, z: 4.35, ry: 20 }));
  g.add(place(streetLamp({ h: 3.4 }), { x: 1.0, y: y0, z: 2.4, ry: 180 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 8 }), { x: -4.4, y: y0, z: 4.3 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: 1.25, y: y0, z: 4.25 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 10 }), { x: 4.4, y: y0, z: -0.95 }));
  g.add(place(tree({ kind: 'cone', h: 3.2, seed: 12 }), { x: 0.95, y: y0, z: -0.75 }));
  return g;
}

function shadeDark() {
  return '#a9541a';
}

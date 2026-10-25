import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, SWATCHES,
  lot, patch, box, boxFaces, place, group, cylinder, extrude, taperedBlock, beam, lattice,
  facadeBlock, barrelRoof, door, streetLamp, bench, tree, flag, car, truck,
  mat, metal, glass, emissive, surface, textured, signTexture, rng, MAT,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z, the harbour is at the back (-z).
// The lot is water; the quay is a raised concrete block along the front and a pier on the east.

const LAND = LOT_HEIGHT + 0.4; // top of the quay
const WATER = LOT_HEIGHT;

// Sign with 0..1 UVs on the front face, so the text fills it at any size
// (the lib's sign() uses metre UVs and shrinks text on faces over 1 m).
function bigSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.12, border = null, double = false } = {}) {
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// Ferry hull planform: stern at +x, pointed bow at -x. k widens it slightly.
function hullPts(k = 0) {
  const hw = 1.7 + k;
  return [[4.4 + k, hw], [-6.5, hw], [-8.6 - k, 1.0 + k], [-9.7 - k, 0], [-8.6 - k, -1.0 - k], [-6.5, -hw], [4.4 + k, -hw]];
}

function lifeboat() {
  const orange = mat(PALETTE.orange);
  return group(
    place(box(1.3, 0.3, 0.5, orange), {}),
    place(box(1.0, 0.18, 0.4, mat(PALETTE.white)), { y: 0.3 }),
  );
}

// Ro-ro car ferry, local origin at the waterline centre of its hull. Stern (open) at +x.
function ferry() {
  const g = new THREE.Group();
  const white = mat(PALETTE.white);
  const navy = mat(PALETTE.navy);
  const deck = mat('#5f8a6e');
  const dark = mat('#1d2129');

  // hull: navy below, red boot stripe, white car-deck sides, green deck on top
  g.add(extrude(hullPts(), 0.65, navy));
  g.add(place(extrude(hullPts(0.02), 0.12, mat(PALETTE.red)), { y: 0.65 }));
  g.add(place(extrude(hullPts(0.01), 1.58, white, deck), { y: 0.77 }));
  // bulwark along the bow
  g.add(place(box(0.08, 0.35, 2.0, white), { x: -8.6, y: 2.35 }));
  // open stern: dark car deck behind the raised visor
  g.add(place(box(0.06, 1.3, 2.9, dark), { x: 4.43, y: 0.8 }));
  g.add(place(box(0.25, 0.2, 3.4, white), { x: 4.3, y: 2.15 }));
  // stern door frame posts
  for (const z of [-1.55, 1.55]) g.add(place(box(0.3, 1.4, 0.3, white), { x: 4.3, y: 0.77, z }));

  // company name on both hull sides
  const name = bigSign('TINY TOWN FERRIES', 7.5, 0.7, { bg: PALETTE.white, fg: PALETTE.navy, depth: 0.04 });
  g.add(place(name, { x: -1.6, y: 1.2, z: 1.72 }));
  g.add(place(name.clone(), { x: -1.6, y: 1.2, z: -1.72, ry: 180 }));
  // portholes row on car deck sides
  for (let i = 0; i < 7; i++) {
    for (const z of [-1.73, 1.73]) g.add(place(box(0.35, 0.22, 0.03, mat(PALETTE.window)), { x: -5.6 + i * 1.5, y: 2.0, z }));
  }

  // passenger deck: ribbon windows
  const ss = { style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.15, seed: 7, floorHeight: 1.5, bay: 1.2, roof: '#5f8a6e' };
  g.add(place(facadeBlock({ w: 9.0, d: 3.0, h: 1.5, ...ss }), { x: -2.1, y: 2.35 }));
  // passenger door for the walkway (+z side)
  g.add(place(box(0.8, 1.1, 0.04, dark), { x: 0.9, y: 2.4, z: 1.51 }));
  // railings round the open aft deck
  const rail = mat(PALETTE.white);
  for (const z of [-1.62, 1.62]) g.add(place(box(1.9, 0.06, 0.05, rail), { x: 3.3, y: 2.85, z }));
  for (let i = 0; i < 6; i++) for (const z of [-1.62, 1.62]) g.add(place(box(0.05, 0.5, 0.05, rail), { x: 2.4 + i * 0.38, y: 2.35, z }));

  // bridge with wings and a dark window band facing forward
  const by = 3.85;
  g.add(place(facadeBlock({ w: 2.6, d: 2.6, h: 1.1, ...ss, floorHeight: 1.1, bay: 0.9, lit: 0 }), { x: -5.3, y: by }));
  g.add(place(box(1.0, 0.7, 3.9, white), { x: -5.9, y: by + 0.2 }));
  g.add(place(box(0.04, 0.35, 3.8, mat(PALETTE.glassDark)), { x: -6.41, y: by + 0.5 }));
  g.add(place(box(2.8, 0.12, 4.0, white), { x: -5.4, y: by + 1.1 }));
  // radar mast
  g.add(place(cylinder(0.05, 0.07, 1.6, metal(PALETTE.steelLight), 6), { x: -5.0, y: by + 1.2 }));
  g.add(place(box(0.12, 0.1, 1.2, mat(PALETTE.white)), { x: -5.0, y: by + 2.2 }));
  g.add(place(box(0.08, 0.08, 0.8, metal(PALETTE.steelDark)), { x: -5.0, y: by + 2.65 }));
  // sun deck benches + lifeboats along both sides
  for (const x of [-3.4, -1.5]) {
    for (const z of [-1.25, 1.25]) {
      g.add(place(lifeboat(), { x, y: by + 0.15, z }));
      g.add(place(box(0.08, 0.6, 0.08, metal(PALETTE.steelDark)), { x: x - 0.55, y: by, z: z * 1.05 }));
      g.add(place(box(0.08, 0.6, 0.08, metal(PALETTE.steelDark)), { x: x + 0.55, y: by, z: z * 1.05 }));
    }
  }
  for (const z of [-1.5, 1.5]) g.add(place(box(5.2, 0.05, 0.05, rail), { x: -1.4, y: by + 0.55, z }));
  // funnel: red with a black top and a yellow band
  const fx = 1.2;
  g.add(place(taperedBlock({ w: 1.6, d: 1.2, h: 1.6, topW: 1.3, topD: 1.0, material: mat(PALETTE.red) }), { x: fx, y: by }));
  g.add(place(box(1.32, 0.25, 1.02, mat(PALETTE.yellow)), { x: fx, y: by + 0.95 }));
  g.add(place(box(1.3, 0.35, 1.0, mat(PALETTE.black)), { x: fx, y: by + 1.6 }));
  // foredeck: mooring winches and a bow mast
  for (const z of [-0.6, 0.6]) g.add(place(cylinder(0.22, 0.22, 0.35, mat(PALETTE.darkGrey), 8), { x: -7.6, y: 2.35, z }));
  g.add(place(cylinder(0.04, 0.05, 1.4, metal(PALETTE.steelLight), 6), { x: -9.0, y: 2.35 }));
  // aft deck: vent cowls and benches
  for (const z of [-0.9, 0.9]) g.add(place(cylinder(0.15, 0.18, 0.6, mat(PALETTE.white), 8), { x: 2.9, y: 2.35, z }));
  for (const z of [-1.2, 1.2]) g.add(place(bench({ w: 1.0 }), { x: 3.7, y: 2.35, z, s: 0.8, ry: 90 }));
  // sun deck benches
  for (const z of [-0.45, 0.45]) g.add(place(bench({ w: 1.4 }), { x: -0.5, y: by, z, s: 0.8 }));
  // anchors on the bow
  for (const z of [-1.32, 1.32]) g.add(place(box(0.4, 0.4, 0.06, dark), { x: -8.4, y: 1.6, z }));
  return g;
}

// Small check-in booth with a window band.
function booth() {
  return group(
    box(0.8, 1.3, 0.9, mat(PALETTE.white)),
    place(box(0.82, 0.45, 0.92, mat(PALETTE.glassDark)), { y: 0.7 }),
    place(box(1.0, 0.12, 1.1, mat(PALETTE.navy)), { y: 1.3 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const r = rng(77);
  g.add(lot([2, 1], 'water'));

  // ---- quay: main strip along the front + pier on the east
  const quayWall = surface('cobbles', PALETTE.stone, { size: 1.5 });
  const quayTop = MAT.concrete;
  const quay = (w, d, x, z) => place(boxFaces(w, LAND - LOT_HEIGHT, d, { sides: quayWall, top: quayTop }), { x, y: LOT_HEIGHT, z });
  g.add(quay(20, 5.6, 0, 2.2));
  g.add(quay(2.4, 4.4, 8.8, -2.8));
  // tide stain + black rubber fenders on the quay faces
  g.add(place(box(17.6, 0.12, 0.02, mat('#3d4a3f')), { x: -1.2, y: WATER, z: -0.61 }));
  for (const x of [-9, -6.5, -4, -1.5, 1, 3.5, 6]) g.add(place(box(0.35, 0.35, 0.12, mat(PALETTE.black)), { x, y: WATER + 0.02, z: -0.66 }));

  // ---- surfaces
  const y0 = LAND;
  g.add(place(patch(6.4, 1.6, 'paved'), { x: -6.8, y: y0, z: 4.2 }));            // terminal forecourt
  g.add(place(patch(13.7, 4.5, 'asphalt'), { x: 3.15, y: y0, z: 2.7 }));          // marshalling lanes
  g.add(place(patch(2.4, 5.0, 'asphalt'), { x: 8.8, y: y0, z: -2.5 }));           // pier roadway
  // lane lines (dashed) and stop line
  const line = mat(PALETTE.roadLine);
  for (const z of [2.0, 3.45]) for (let x = -1.2; x < 7.2; x += 1.2) g.add(place(box(0.6, 0.02, 0.1, line), { x, y: y0 + 0.05, z }));
  g.add(place(box(0.15, 0.02, 4.2, line), { x: 7.25, y: y0 + 0.05, z: 2.75 }));
  // yellow quay-edge safety line
  g.add(place(box(17.4, 0.02, 0.12, mat(PALETTE.yellow)), { x: -1.3, y: y0 + 0.01, z: -0.45 }));
  g.add(place(box(0.12, 0.02, 4.0, mat(PALETTE.yellow)), { x: 7.75, y: y0 + 0.05, z: -2.9 }));

  // ---- terminal hall: two glazed storeys with a blue wave roof
  const tx = -6.8, tz = 1.7, tw = 5.8, td = 3.8;
  g.add(place(facadeBlock({ w: tw, d: td, floors: 2, style: 'curtain', glass: PALETTE.glassTeal, frame: PALETTE.white, wall: PALETTE.white, bay: 1.5, lit: 0.2, seed: 31, roof: PALETTE.concrete }), { x: tx, y: y0, z: tz }));
  g.add(place(box(tw + 0.1, 0.35, td + 0.1, mat(PALETTE.white)), { x: tx, y: y0 + 2.85, z: tz }));
  g.add(place(box(tw + 0.5, 0.25, td + 0.6, mat(PALETTE.white)), { x: tx, y: y0 + 6, z: tz }));
  g.add(place(barrelRoof({ w: tw + 0.5, d: td + 0.6, h: 1.0, axis: 'x', material: mat(PALETTE.roofBlue), endMaterial: mat(PALETTE.white) }), { x: tx, y: y0 + 6.25, z: tz }));
  // big sign on the upper floor
  g.add(place(bigSign('FERRY TERMINAL', 5.2, 0.9, { bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.yellow }), { x: tx, y: y0 + 3.6, z: tz + td / 2 + 0.02 }));
  // entrance: glass doors under a canopy
  g.add(place(door({ w: 1.8, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.white }), { x: tx, y: y0, z: tz + td / 2 }));
  g.add(place(box(2.8, 0.15, 1.2, mat(PALETTE.roofBlue)), { x: tx, y: y0 + 2.55, z: tz + td / 2 + 0.6 }));
  for (const x of [tx - 1.2, tx + 1.2]) g.add(place(box(0.12, 2.55, 0.12, mat(PALETTE.white)), { x, y: y0, z: tz + td / 2 + 1.1 }));
  // departures board beside the door
  g.add(place(bigSign('DEPARTURES 14:30', 1.6, 0.45, { bg: '#111418', fg: PALETTE.orange, depth: 0.06 }), { x: tx - 2.1, y: y0 + 1.6, z: tz + td / 2 + 0.03 }));

  // ---- enclosed passenger walkway: along the quay, then a telescopic gangway onto the ferry
  const wy = 2.8; // walkway floor
  const tube = (w, h, d) => boxFaces(w, h, d, { sides: glass(PALETTE.glassBlue), top: mat(PALETTE.navy), bottom: metal(PALETTE.steelDark) });
  g.add(place(box(4.6, 0.2, 1.1, mat(PALETTE.white)), { x: -1.6, y: wy - 0.2, z: -0.1 }));
  g.add(place(tube(4.6, 1.15, 1.0), { x: -1.6, y: wy, z: -0.1 }));
  g.add(place(box(4.7, 0.15, 1.2, mat(PALETTE.navy)), { x: -1.6, y: wy + 1.15, z: -0.1 }));
  for (let x = -3.6; x <= 0.5; x += 0.82) g.add(place(box(0.08, 1.15, 1.04, mat(PALETTE.white)), { x, y: wy, z: -0.1 }));
  for (const x of [-2.9, -0.4]) g.add(place(box(0.25, wy - 0.2 - y0, 0.25, metal(PALETTE.steelDark)), { x, y: y0, z: -0.1 }));
  // gangway head (bellows) bridging to the ferry door
  g.add(place(boxFaces(1.0, 1.05, 1.15, { sides: mat('#3a3f47'), top: mat(PALETTE.navy) }), { x: 0.4, y: wy - 0.2, z: -1.05 }));
  g.add(place(box(1.1, 0.1, 1.2, mat(PALETTE.navy)), { x: 0.4, y: wy + 0.85, z: -1.05 }));

  // ---- the ferry, docked along the quay
  g.add(place(ferry(), { y: WATER, z: -3.05 }));

  // ---- linkspan: hinged steel ramp from the pier to the ferry's stern, lifted by a yellow gantry
  const lz = -3.05;
  const yellow = mat(PALETTE.yellow, { roughness: 0.6 });
  const steelDeck = surface('stripes', PALETTE.steelDark, { color2: PALETTE.steel, size: 0.5 });
  const ramp = (x1, y1, x2, y2, w, m) => {
    const len = Math.hypot(x2 - x1, y2 - y1);
    const a = Math.atan2(y2 - y1, x2 - x1);
    return place(box(len, 0.12, w, m), { x: (x1 + x2) / 2, y: (y1 + y2) / 2 - 0.12, z: lz, rz: THREE.MathUtils.radToDeg(a) });
  };
  g.add(ramp(5.1, 0.95, 7.65, LAND + 0.02, 2.4, steelDeck));       // linkspan deck
  g.add(ramp(4.4, WATER + 0.85, 5.5, 0.97, 2.2, metal(PALETTE.steelLight))); // ferry stern ramp
  g.add(place(box(0.5, 0.03, 2.4, MAT.hazard), { x: 7.45, y: LAND, z: lz }));
  for (const s of [-1, 1]) {
    const z = lz + s * 1.15;
    g.add(beam([5.2, 1.45, z], [7.6, 1.05, z], 0.08, yellow));
    for (const [x, yb] of [[5.3, 0.93], [6.45, 0.78], [7.55, 0.6]]) g.add(beam([x, yb, z], [x, yb + 0.5, z], 0.08, yellow));
  }
  // gantry towers on concrete dolphins, crossbeam with winch house, hoist rods
  const gx = 5.8;
  for (const z of [lz - 1.5, lz + 1.5]) {
    g.add(place(cylinder(0.45, 0.5, LAND - WATER, mat(PALETTE.concreteDark), 10), { x: gx, y: WATER, z }));
    g.add(place(lattice({ w: 0.6, d: 0.6, h: 3.9, thickness: 0.1, material: yellow }), { x: gx, y: LAND, z }));
  }
  g.add(place(box(0.7, 0.45, 3.7, yellow), { x: gx, y: LAND + 3.9, z: lz }));
  g.add(place(box(1.1, 0.7, 1.3, mat(PALETTE.white)), { x: gx, y: LAND + 4.35, z: lz }));
  g.add(place(box(1.2, 0.1, 1.4, mat(PALETTE.red)), { x: gx, y: LAND + 5.05, z: lz }));
  for (const s of [-1, 1]) g.add(beam([gx, LAND + 3.9, lz + s * 0.95], [gx, 0.85, lz + s * 0.95], 0.07, metal(PALETTE.steelDark)));

  // ---- check-in: booths between the lanes under a canopy
  const cx = -2.3;
  for (const z of [0.7, 2.05, 3.45, 4.6]) g.add(place(booth(), { x: cx, y: y0, z }));
  g.add(place(box(1.8, 0.25, 4.4, mat(PALETTE.navy)), { x: cx, y: y0 + 2.4, z: 2.65 }));
  g.add(place(box(1.9, 0.08, 4.5, mat(PALETTE.roofBlue)), { x: cx, y: y0 + 2.65, z: 2.65 }));
  for (const z of [0.7, 4.6]) g.add(place(box(0.12, 2.4, 0.12, mat(PALETTE.white)), { x: cx + 0.6, y: y0, z }));
  g.add(place(bigSign('CHECK-IN', 1.8, 0.5, { bg: PALETTE.yellow, fg: PALETTE.navy, depth: 0.06 }), { x: cx, y: y0 + 2.75, z: 4.86 }));
  // lane numbers
  for (const [i, z] of [[1, 1.3], [2, 2.75], [3, 4.2]]) {
    g.add(place(bigSign(String(i), 0.5, 0.5, { bg: PALETTE.green, fg: '#ffffff', depth: 0.05 }), { x: cx + 0.95, y: y0 + 1.85, z, ry: 90 }));
  }

  // ---- queued cars in three lanes, heading for the pier; one rolling onto the ferry
  const lanes = [1.3, 2.75, 4.2];
  const carS = 0.6;
  const placeCar = (x, z, opts, extra = {}) => g.add(place(car(opts), { x, y: y0 + 0.02, z, s: carS, ...extra }));
  for (let li = 0; li < 3; li++) {
    const z = lanes[li];
    if (li === 0) {
      g.add(place(truck({ color: PALETTE.red, trailerColor: PALETTE.white }), { x: 3.4, y: y0 + 0.02, z, s: carS }));
      placeCar(-0.3, z, { color: r.pick(SWATCHES.cars) });
      continue;
    }
    for (let k = 0; k < 3; k++) {
      if (li === 2 && k === 2) continue;
      const kind = r.chance(0.25) ? 'van' : 'car';
      placeCar(-0.3 + k * 2.9 + r.range(-0.2, 0.2), z, { color: r.pick(SWATCHES.cars), kind });
    }
  }
  placeCar(8.8, 1.8, { color: PALETTE.blue }, { ry: 90 });
  placeCar(8.8, -1.6, { color: PALETTE.white, kind: 'van' }, { ry: 90 });
  g.add(place(car({ color: PALETTE.green }), { x: 6.2, y: 0.88, z: lz, s: carS, rz: -5 }));

  // pier gate: boom barrier and control hut
  g.add(place(box(0.3, 1.0, 0.3, mat(PALETTE.white)), { x: 7.75, y: y0, z: 0.5 }));
  g.add(place(box(2.0, 0.1, 0.1, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.5 })), { x: 8.85, y: y0 + 0.85, z: 0.5 }));
  g.add(place(booth(), { x: 9.55, y: y0, z: 0.0 }));

  // ---- quay furniture: bollards, life ring, lamps
  for (const x of [-9.2, -5.2, -3.6, 2.2, 4.4]) {
    g.add(place(cylinder(0.12, 0.14, 0.35, mat(PALETTE.black), 8), { x, y: y0, z: -0.35 }));
    g.add(place(cylinder(0.18, 0.18, 0.06, mat(PALETTE.black), 8), { x, y: y0 + 0.35, z: -0.35 }));
  }
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.07, 6, 12), mat(PALETTE.orange));
  g.add(place(box(0.08, 1.0, 0.08, mat(PALETTE.woodDark)), { x: 6.5, y: y0, z: 0.2 }));
  g.add(place(ring, { x: 6.5, y: y0 + 0.7, z: 0.26 }));
  for (const x of [1.0, 5.0]) g.add(place(streetLamp({ h: 3.8 }), { x, y: y0, z: 0.45, ry: -90 }));
  g.add(place(streetLamp({ h: 3.8 }), { x: 9.7, y: y0, z: -4.4, ry: 180 }));

  // ---- forecourt: flags, bench, planters
  const flags = [[PALETTE.blue, PALETTE.white], [PALETTE.red, PALETTE.white], [PALETTE.navy, PALETTE.yellow]];
  flags.forEach(([c1, c2], i) => g.add(place(flag({ h: 4.2, color: c1, color2: c2 }), { x: -9.5 + i * 0.8, y: y0, z: 4.75, s: 0.85 })));
  g.add(place(bench({ w: 1.4 }), { x: -4.9, y: y0, z: 4.75, ry: 180 }));
  for (const [x, seed] of [[-8.6, 3], [-4.3, 5]]) {
    g.add(place(box(0.7, 0.35, 0.7, mat(PALETTE.stoneDark)), { x, y: y0, z: 4.3 }));
    g.add(place(tree({ kind: 'bush', h: 1.0, seed }), { x, y: y0 + 0.35, z: 4.3 }));
  }
  return g;
}

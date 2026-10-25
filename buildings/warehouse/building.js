import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, parapet, box, place, group, cylinder,
  door, tree, car, truck, fence, streetLamp, surface, mat, metal, emissive,
  canvasTexture, textured, shade, signTexture,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z, lorry yard on the east (+x) side.

const CLAD = '#c9d0d6';
const TRIM = PALETTE.roofBlue;

// horizontal slats of a roller shutter, 1 m per repeat
function rollerMat(color) {
  const tex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 16) {
      ctx.fillStyle = shade(color, -0.25);
      ctx.fillRect(0, y, w, 3);
      ctx.fillStyle = shade(color, 0.15);
      ctx.fillRect(0, y + 3, w, 2);
    }
  }, { key: 'warehouse:roller:' + color });
  return textured(tex, { roughness: 0.6, metalness: 0.2 });
}

// sign board with text on +z; lib sign() maps its texture per metre, so use 0..1 UVs here
function label({ text, w, h, bg, fg, border = null, depth = 0.15 }) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.max(16, Math.round(256 * h / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// roller door with a frame, on a wall facing +z
function rollerDoor(w, h, color = PALETTE.steelLight) {
  const frame = mat(PALETTE.darkGrey);
  return group(
    place(box(w + 0.3, h + 0.15, 0.08, frame), { z: 0.04 }),
    place(box(w, h, 0.12, rollerMat(color)), { z: 0.06 }),
    place(box(w + 0.4, 0.4, 0.4, mat(TRIM)), { y: h, z: 0.2 }), // roll housing
  );
}

// loading-dock door: black dock shelter, shutter, bumpers, yellow edge
function dockDoor() {
  const g = new THREE.Group();
  const seal = mat(PALETTE.roofBlack);
  g.add(place(box(3.1, 3.3, 0.5, seal), { y: 0.55, z: 0.25 }));
  g.add(place(box(2.3, 2.5, 0.1, rollerMat(PALETTE.yellow)), { y: 0.75, z: 0.52 }));
  g.add(place(box(2.6, 0.5, 0.6, mat(PALETTE.concreteDark)), { y: 0.05, z: 0.3 })); // dock leveller
  g.add(place(box(2.6, 0.08, 0.62, surface('hazard', PALETTE.yellow, { size: 1 })), { y: 0.55, z: 0.3 }));
  for (const x of [-1.1, 1.1]) g.add(place(box(0.3, 0.4, 0.25, seal), { x, y: 0.1, z: 0.72 }));
  g.add(place(box(0.25, 0.25, 0.1, emissive(PALETTE.green, 0.8)), { x: 1.75, y: 2.6, z: 0.05 }));
  return g;
}

function forklift(load) {
  const body = mat(PALETTE.orange, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const g = group(
    place(box(1.6, 0.8, 1.0, body), { y: 0.25 }),
    place(box(0.5, 0.5, 0.9, dark), { x: -0.55, y: 1.05 }), // counterweight seat
    place(box(0.06, 1.2, 0.06, dark), { x: 0.2, y: 1.05, z: 0.45 }),
    place(box(0.06, 1.2, 0.06, dark), { x: 0.2, y: 1.05, z: -0.45 }),
    place(box(0.06, 1.2, 0.06, dark), { x: -0.75, y: 1.05, z: 0.45 }),
    place(box(0.06, 1.2, 0.06, dark), { x: -0.75, y: 1.05, z: -0.45 }),
    place(box(1.1, 0.06, 1.0, body), { x: -0.27, y: 2.25 }),
    place(box(0.1, 2.2, 0.7, dark), { x: 0.85, y: 0.1 }), // mast
    place(box(1.1, 0.06, 0.15, dark), { x: 1.4, y: 0.15, z: 0.25 }),
    place(box(1.1, 0.06, 0.15, dark), { x: 1.4, y: 0.15, z: -0.25 }),
  );
  if (load) {
    g.add(place(box(1.1, 0.12, 0.9, mat(PALETTE.wood)), { x: 1.4, y: 0.25 }));
    g.add(place(box(1.0, 0.8, 0.85, mat(load)), { x: 1.4, y: 0.37 }));
  }
  for (const [x, z] of [[0.5, 0.5], [0.5, -0.5], [-0.5, 0.5], [-0.5, -0.5]]) {
    g.add(place(cylinder(0.25, 0.25, 0.2, PALETTE.black, 8), { x, y: 0.25, z: z > 0 ? z - 0.1 : z, rx: 90 }));
  }
  return g;
}

// stack of pallets with wrapped boxes
function palletStack(levels, color) {
  const g = new THREE.Group();
  const wood = mat(PALETTE.wood);
  for (let i = 0; i < levels; i++) {
    g.add(place(box(1.2, 0.15, 1.0, wood), { y: i * 1.05 }));
    g.add(place(box(1.1, 0.9, 0.9, mat(i % 2 ? shade(color, 0.12) : color)), { y: i * 1.05 + 0.15 }));
  }
  return g;
}

function lorry(cab, trailer, stripe) {
  const t = truck({ color: cab, trailerColor: trailer });
  t.add(place(box(7.22, 0.6, 2.54, mat(stripe)), { x: -1.4, y: 2.9 }));
  t.add(place(box(1.0, 0.3, 2.3, mat(shade(cab, -0.2))), { x: 3.6, y: 3.1 })); // roof spoiler
  return t;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'concrete'));

  // ---- main shed: x -7.2..3.0, z -4.6..2.8, 5.5 m walls, low-pitch gable roof
  const sx = -2.1, sz = -0.9, sw = 10.2, sd = 7.4, wallH = 5.5;
  const cladM = surface('corrugated', CLAD, { size: 0.6, roughness: 0.6, metalness: 0.2 });
  g.add(place(box(sw, wallH, sd, [cladM, cladM, mat(PALETTE.steelLight), cladM, cladM, cladM]), { x: sx, y: y0, z: sz }));
  g.add(place(box(sw + 0.1, 0.8, sd + 0.1, mat(PALETTE.concrete)), { x: sx, y: y0, z: sz })); // plinth
  g.add(place(box(sw + 0.16, 0.6, sd + 0.16, mat(TRIM)), { x: sx, y: y0 + wallH - 0.6, z: sz })); // fascia band
  const roofH = 1.2;
  const roofM = surface('corrugated', PALETTE.roofSlate, { size: 0.8, roughness: 0.55, metalness: 0.25 });
  g.add(place(gableRoof({ w: sw, d: sd, h: roofH, overhang: 0.3, ridge: 'x', material: roofM, gableMaterial: cladM }), { x: sx, y: y0 + wallH, z: sz }));
  // skylight strips on both slopes
  const slope = Math.atan2(roofH, sd / 2) * 180 / Math.PI;
  const skyM = mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 });
  for (const x of [-5.4, -2.1, 1.2]) {
    for (const s of [1, -1]) {
      g.add(place(box(1.2, 0.08, 2.4, skyM), { x, y: y0 + wallH + roofH / 2 + 0.06, z: sz + s * sd / 4, rx: s * slope }));
    }
  }
  // ridge vents
  for (const x of [-4.2, 0]) {
    g.add(place(cylinder(0.35, 0.35, 0.6, metal(PALETTE.steelLight), 10), { x, y: y0 + wallH + roofH - 0.05, z: sz }));
    g.add(place(cylinder(0.5, 0.45, 0.15, metal(PALETTE.steelDark), 10), { x, y: y0 + wallH + roofH + 0.55, z: sz }));
  }

  // ---- front (+z): two roller doors, people door, sign
  const fz = sz + sd / 2;
  g.add(place(rollerDoor(2.8, 3.6, PALETTE.steelLight), { x: -5.2, y: y0, z: fz }));
  g.add(place(rollerDoor(2.8, 3.6, PALETTE.steelLight), { x: -1.6, y: y0, z: fz }));
  g.add(place(door({ w: 0.9, h: 2.1, color: TRIM }), { x: 2.2, y: y0, z: fz }));
  g.add(place(label({ text: 'TINY FREIGHT', w: 4.4, h: 0.8, bg: TRIM, fg: '#ffffff', border: PALETTE.white }), { x: 0.3, y: y0 + 4.05, z: fz + 0.1 }));
  for (const x of [-6.75, -3.65, -3.15, -0.05]) {
    g.add(place(cylinder(0.12, 0.12, 0.9, PALETTE.yellow, 8), { x, y: y0, z: fz + 0.5 }));
  }

  // ---- east (+x) side: two raised loading docks under a canopy
  const ex = sx + sw / 2;
  const docks = [-2.75, 0.95];
  for (const z of docks) g.add(place(dockDoor(), { x: ex, y: y0, z, ry: 90 }));
  g.add(place(box(1.6, 0.2, 8.2, mat(TRIM)), { x: ex + 0.8, y: y0 + 4.2, z: sz + 0.15 }));
  g.add(place(box(0.05, 0.4, 8.2, emissive(PALETTE.windowLit, 0.4)), { x: ex + 0.2, y: y0 + 3.9, z: sz + 0.15 }));
  // the back of the shed: blank wall with a small door
  const bz = sz - sd / 2;
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.steelDark }), { x: -0.5, y: y0, z: bz, ry: 180 }));
  g.add(place(label({ text: 'TINY FREIGHT', w: 6, h: 1.1, bg: TRIM, fg: '#ffffff' }), { x: sx - 0.5, y: y0 + 3.4, z: bz - 0.1, ry: 180 }));
  for (const x of [-6.2, -5.0, 1.3, 2.4]) {
    g.add(place(box(0.9, 0.7, 0.08, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 })), { x, y: y0 + 3.6, z: bz - 0.04 }));
  }

  // ---- lorry yard (asphalt, guide lines) and lorries backed onto the docks
  g.add(place(patch(7.0, 10, surface('asphalt', PALETTE.asphalt, { size: 4 })), { x: 6.5, y: y0 }));
  const lineM = mat(PALETTE.yellow);
  for (const z of [-4.6, -0.85, 2.8]) g.add(place(box(6.6, 0.02, 0.12, lineM), { x: 6.6, y: y0 + 0.05, z }));
  const s = 0.68;
  g.add(place(lorry(PALETTE.red, PALETTE.white, PALETTE.red), { x: ex + 0.25 + 5.0 * s, y: y0 + 0.05, z: docks[0], s }));
  g.add(place(lorry(PALETTE.blue, PALETTE.white, PALETTE.blue), { x: ex + 0.25 + 5.0 * s, y: y0 + 0.05, z: docks[1], s }));
  g.add(place(streetLamp({ h: 4.5 }), { x: 9.6, y: y0, z: 4.6, ry: 180 }));

  // ---- front apron: forklift, pallets
  g.add(place(patch(10.2, 2.1, 'asphalt'), { x: sx, y: y0, z: 3.9 }));
  g.add(place(forklift(PALETTE.steelLight), { x: 0.9, y: y0 + 0.05, z: 4.1, ry: 160 }));
  g.add(place(palletStack(2, '#b88a52'), { x: -3.4, y: y0 + 0.05, z: 3.9 }));

  // ---- office annex on the west end: 2 storeys, ribbon windows
  const ox = -8.45, oz = 1.0, ow = 2.5, od = 3.6;
  g.add(place(facadeBlock({ w: ow, d: od, floors: 2, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassBlue, frame: PALETTE.steelLight, lit: 0.3, bay: 1.2, seed: 48, roof: PALETTE.concreteDark, blank: ['right'] }), { x: ox, y: y0, z: oz }));
  g.add(place(parapet({ w: ow, d: od, h: 0.4, material: mat(TRIM) }), { x: ox, y: y0 + 6, z: oz }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.glassDark }), { x: ox, y: y0, z: oz + od / 2 }));
  g.add(place(box(2.0, 0.15, 1.0, mat(TRIM)), { x: ox, y: y0 + 2.5, z: oz + od / 2 + 0.5 }));
  g.add(place(box(0.5, 0.4, 0.6, metal(PALETTE.steelLight)), { x: ox + 0.4, y: y0 + 6, z: oz - 0.6 })); // AC unit

  // parking for staff in front of the office
  g.add(place(patch(2.7, 2.1, 'asphalt'), { x: ox, y: y0, z: 3.9 }));
  g.add(place(car({ color: PALETTE.green }), { x: ox, y: y0 + 0.05, z: 3.95, s: 0.6 }));

  // ---- behind the office: grass strip, tree, bins, fence along the back
  g.add(place(patch(2.6, 3.9, 'grass'), { x: ox, y: y0, z: -2.65 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 48 }), { x: -8.6, y: y0, z: -3.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 49 }), { x: -9.3, y: y0, z: -1.4 }));
  g.add(place(box(1.4, 1.1, 0.9, mat(PALETTE.green)), { x: -7.95, y: y0, z: -1.3 }));
  g.add(place(box(1.5, 0.12, 1.0, mat(shade(PALETTE.green, -0.25))), { x: -7.95, y: y0 + 1.1, z: -1.3 }));
  g.add(place(fence({ w: 19.6, d: 9.6, h: 1.6, style: 'wire', sides: ['back'] }), { y: y0 }));
  g.add(place(fence({ w: 19.6, d: 4.3, h: 1.6, style: 'wire', sides: ['left'] }), { y: y0, z: -2.65 }));
  return g;
}

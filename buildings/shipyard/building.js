import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, beam, place, cylinder, mat, metal, emissive, water, surface, textured, signTexture,
  facadeBlock, gableRoof, shedRoof, door, streetLamp, tree,
} from '../../src/lib/index.js';
import { hull, keelBlocks, scaffold } from './hull.js';
import { goliathCrane } from './crane.js';

// 3x1 tiles (30 x 10 m). Front (street) faces +z.
// West end: harbour water. Middle: building berth with a half-built hull in
// scaffolding under a goliath crane. East end: plate shop, office, steel stock.

/** Sign plate with 0..1 UVs (text on +z face). */
function plateSign(w, h, text, bg, fg, d = 0.15) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round((512 * h) / w), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

/** Stack of steel plates on timber dunnage, length along X. */
function plateStack(w, d, layers, seed = 0) {
  const g = new THREE.Group();
  const shades = [PALETTE.steel, '#7f8a92', '#9aa3aa', '#6f777e'];
  const wood = mat(PALETTE.wood);
  for (const x of [-w / 2 + 0.3, 0, w / 2 - 0.3]) g.add(place(box(0.2, 0.18, d + 0.2, wood), { x }));
  let y = 0.18;
  for (let i = 0; i < layers; i++) {
    const t = 0.12;
    const off = ((i * 7 + seed) % 3 - 1) * 0.06;
    g.add(place(box(w, t, d, metal(shades[(i + seed) % shades.length], { roughness: 0.55 })), { x: off, y, z: -off }));
    y += t;
    if (i % 4 === 3) {
      for (const x of [-w / 2 + 0.3, w / 2 - 0.3]) g.add(place(box(0.15, 0.1, d + 0.1, wood), { x, y }));
      y += 0.1;
    }
  }
  return g;
}

/** Rack of I-beams / sections, length along X. */
function beamRack(len, n) {
  const g = new THREE.Group();
  const post = mat(PALETTE.blue);
  for (const x of [-len / 2 + 0.3, len / 2 - 0.3]) {
    g.add(place(box(0.15, 1.2, 1.2, post), { x }));
  }
  const rust = mat(PALETTE.rust);
  for (let i = 0; i < n; i++) {
    const z = -0.45 + (0.9 * i) / (n - 1);
    g.add(place(box(len, 0.3, 0.08, rust), { y: 0.45, z }));
    g.add(place(box(len, 0.04, 0.22, rust), { y: 0.45, z }));
    g.add(place(box(len, 0.04, 0.22, rust), { y: 0.71, z }));
  }
  return g;
}

/** Small yard worker in hi-vis. */
function worker(color = PALETTE.orange) {
  const g = new THREE.Group();
  g.add(place(box(0.32, 0.8, 0.22, mat(PALETTE.navy)), {}));
  g.add(place(box(0.42, 0.62, 0.28, mat(color)), { y: 0.8 }));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.15, 8, 6), mat(PALETTE.peach)), { y: 1.55 }));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.17, 8, 4, 0, Math.PI * 2, 0, Math.PI / 2), mat(PALETTE.white)), { y: 1.6 }));
  return g;
}

/** Forklift, forks towards +x. */
function forklift() {
  const g = new THREE.Group();
  const y = mat(PALETTE.orange);
  const dk = mat(PALETTE.darkGrey);
  g.add(place(box(1.8, 0.9, 1.1, y), { y: 0.3 }));
  g.add(place(box(0.7, 0.7, 1.1, dk), { x: -0.6, y: 1.2 }));
  for (const z of [-0.5, 0.5]) {
    g.add(beam([0.2, 1.2, z], [0.2, 2.2, z], 0.06, dk));
    g.add(beam([-0.7, 1.2, z], [-0.7, 2.2, z], 0.06, dk));
  }
  g.add(place(box(1.0, 0.06, 1.1, dk), { x: -0.25, y: 2.2 }));
  g.add(place(box(0.1, 2.2, 0.9, dk), { x: 1.0, y: 0.05 }));
  for (const z of [-0.3, 0.3]) g.add(place(box(1.1, 0.06, 0.12, dk), { x: 1.6, y: 0.1, z }));
  for (const x of [-0.55, 0.55]) for (const z of [-0.58, 0.58]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.2, 10).rotateX(Math.PI / 2), mat(PALETTE.black));
    w.position.set(x, 0.28, z);
    g.add(w);
  }
  return g;
}

/** Harbour tug, length along Z (bow towards +z). */
function tug() {
  const g = new THREE.Group();
  const hullM = mat(PALETTE.red);
  g.add(place(box(1.7, 0.7, 3.4, hullM), { y: -0.2 }));
  g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.85, 0.85, 0.7, 3).rotateY(Math.PI / 2).scale(1, 1, 0.7), hullM), { y: 0.15, z: 1.9 }));
  g.add(place(box(1.8, 0.2, 3.6, mat(PALETTE.black)), { y: 0.45 }));
  g.add(place(box(1.2, 0.8, 1.3, mat(PALETTE.white)), { y: 0.65, z: 0.2 }));
  g.add(place(box(1.0, 0.55, 0.9, mat(PALETTE.white)), { y: 1.45, z: 0.4 }));
  g.add(place(box(1.02, 0.25, 0.92, mat(PALETTE.glassDark)), { y: 1.65, z: 0.4 }));
  g.add(place(cylinder(0.2, 0.2, 0.9, mat(PALETTE.black), 8), { y: 1.0, z: -0.8 }));
  g.add(place(box(0.42, 0.2, 0.42, mat(PALETTE.yellow)), { y: 1.5, z: -0.8 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 1], 'concrete'));

  // ---- harbour basin at the west end ----
  const wx0 = -15, wx1 = -11.6;
  g.add(place(box(wx1 - wx0, 0.04, 10, water()), { x: (wx0 + wx1) / 2, y: y0 }));
  const quay = mat(PALETTE.concreteDark);
  g.add(place(box(wx1 - wx0, 0.45, 0.35, quay), { x: (wx0 + wx1) / 2, y: y0, z: 4.82 }));
  g.add(place(box(wx1 - wx0, 0.45, 0.35, quay), { x: (wx0 + wx1) / 2, y: y0, z: -4.82 }));
  g.add(place(box(0.35, 0.45, 10, quay), { x: wx0 + 0.18, y: y0 }));
  // quay edge (slipway runs out through it)
  for (const s of [1, -1]) g.add(place(box(0.4, 0.45, 1.7, quay), { x: wx1, y: y0, z: s * 4.0 }));
  for (const z of [-4.3, 4.3]) g.add(place(cylinder(0.14, 0.18, 0.45, mat(PALETTE.black), 8), { x: wx1 + 0.5, y: y0, z }));
  g.add(place(tug(), { x: -13.4, y: y0, z: -0.4, ry: 10 }));

  // ---- slipway / building berth ----
  const sx0 = wx1, sx1 = 5.8;
  g.add(place(patch(sx1 - sx0, 6.4, surface('concrete', PALETTE.concreteDark, { size: 4 })), { x: (sx0 + sx1) / 2, y: y0 }));
  // launching ways run out into the water
  for (const z of [-1.6, 1.6]) {
    g.add(place(box(sx1 - wx0 - 1.5, 0.12, 0.5, mat(PALETTE.woodDark)), { x: (wx0 + 1.5 + sx1) / 2, y: y0 + 0.02, z }));
  }
  // crane rails
  for (const z of [-4.8, 4.8]) {
    g.add(place(box(sx1 + 12.4 - 0.3, 0.12, 0.7, mat(PALETTE.concreteDark)), { x: (sx1 - 12.1) / 2, y: y0, z }));
    g.add(place(box(sx1 + 12.4 - 0.3, 0.1, 0.14, metal(PALETTE.steelDark)), { x: (sx1 - 12.1) / 2, y: y0 + 0.12, z }));
  }
  // rail end stops
  for (const x of [-11.9, 5.6]) for (const z of [-4.8, 4.8]) g.add(place(box(0.3, 0.6, 0.8, mat(PALETTE.red)), { x, y: y0, z }));

  // the ship
  const L = 16, B = 5, D = 4.2, hx = -3.2, kb = 0.9;
  g.add(place(keelBlocks({ L, B, h: kb }), { x: hx, y: y0 }));
  g.add(place(hull({ L, B, D, split: -1.2 }), { x: hx, y: y0 + kb }));
  // scaffolding along both sides of the unfinished aft body
  const scLen = 9.6, scX = hx - L / 2 + scLen / 2 + 0.2;
  g.add(place(scaffold({ len: scLen, h: 6.6, w: 0.9, lift: 1.8 }), { x: scX, y: y0, z: B / 2 + 0.35 }));
  g.add(place(scaffold({ len: scLen, h: 6.6, w: 0.9, lift: 1.8 }), { x: scX, y: y0, z: -B / 2 - 0.35, ry: 180 }));
  // stair tower at the stern
  g.add(place(scaffold({ len: 1.8, h: 6.6, w: 1.6, lift: 1.1 }), { x: hx - L / 2 - 0.5, y: y0, z: -0.8, ry: 90 }));
  // welders on the scaffold + spark glow
  const spark = emissive('#ffcf5a', 1.6);
  for (const [x, lift, s] of [[-8.6, 1, 1], [-5.0, 2, 1], [-7.2, 1, -1], [-3.6, 2, -1]]) {
    const yl = y0 + lift * 1.8 + 0.06;
    g.add(place(worker(lift === 2 ? PALETTE.yellow : PALETTE.orange), { x, y: yl, z: s * (B / 2 + 0.75), ry: s > 0 ? 180 : 0, s: 0.9 }));
    g.add(place(new THREE.Mesh(new THREE.IcosahedronGeometry(0.18, 0), spark), { x: x + 0.3, y: yl + 1.0, z: s * (B / 2 + 0.2) }));
  }

  // goliath crane straddling the berth, carrying a deckhouse block
  g.add(place(goliathCrane({ span: 9.6, h: 17.5, legSpread: 5, hookY: 12.2, text: 'TINY TOWN SHIPYARD' }), { x: -6.4, y: y0 }));

  // ---- plate shop (main fabrication shed) ----
  const shopX = 10.7, shopZ = -2.0, shopW = 8.2, shopD = 5.6, shopH = 6.4;
  const clad = { style: 'industrial', wall: '#6f8fa8', glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 2.7, seed: 7, lit: 0.2, roof: PALETTE.roofGrey };
  g.add(place(facadeBlock({ w: shopW, d: shopD, h: shopH, floorHeight: 3.2, ...clad }), { x: shopX, y: y0, z: shopZ }));
  g.add(place(gableRoof({ w: shopW, d: shopD, h: 1.8, overhang: 0.25, ridge: 'x', material: surface('corrugated', '#9aa6ae', { size: 1.2 }), gableMaterial: '#6f8fa8' }), { x: shopX, y: y0 + shopH, z: shopZ }));
  // roof ventilators along the ridge
  for (const dx of [-2.4, 0, 2.4]) g.add(place(box(0.9, 0.5, 0.9, mat(PALETTE.steelLight)), { x: shopX + dx, y: y0 + shopH + 1.6, z: shopZ }));
  // big roller door on the berth side, open, with plates being carried out
  const doorM = surface('corrugated', PALETTE.steelLight, { size: 0.6 });
  g.add(place(box(0.1, 4.6, 3.6, mat('#2a2e33')), { x: shopX - shopW / 2 - 0.02, y: y0, z: shopZ }));
  g.add(place(box(0.14, 1.0, 3.8, doorM), { x: shopX - shopW / 2 - 0.05, y: y0 + 4.0, z: shopZ }));
  g.add(place(box(0.25, 0.25, 4.2, mat(PALETTE.yellow)), { x: shopX - shopW / 2 - 0.12, y: y0 + 4.6, z: shopZ }));
  // front roller door + personnel door
  g.add(place(box(3.4, 4.0, 0.12, doorM), { x: shopX - 1.2, y: y0, z: shopZ + shopD / 2 + 0.02 }));
  g.add(place(box(3.8, 0.25, 0.25, mat(PALETTE.yellow)), { x: shopX - 1.2, y: y0 + 4.0, z: shopZ + shopD / 2 + 0.1 }));
  g.add(place(door({ w: 1.0, h: 2.2, color: PALETTE.red }), { x: shopX + 2.2, y: y0, z: shopZ + shopD / 2 }));
  g.add(place(plateSign(5.4, 1.0, 'PLATE SHOP', PALETTE.navy, '#ffffff'), { x: shopX, y: y0 + 4.9, z: shopZ + shopD / 2 + 0.1 }));
  // extraction stack on the back
  g.add(place(cylinder(0.35, 0.35, 9.5, metal(PALETTE.steel), 10), { x: shopX + 3.2, y: y0, z: shopZ - shopD / 2 + 0.7 }));
  g.add(place(cylinder(0.45, 0.45, 0.4, mat(PALETTE.red), 10), { x: shopX + 3.2, y: y0 + 9.5, z: shopZ - shopD / 2 + 0.7 }));

  // ---- site office / welding shop ----
  const offX = 13.3, offZ = 3.0, offW = 3.0, offD = 3.4;
  g.add(place(facadeBlock({ w: offW, d: offD, floors: 1, style: 'punched', wall: PALETTE.cream, frame: PALETTE.white, glass: PALETTE.window, bay: 1.5, windowW: 0.6, windowH: 0.45, lit: 0.3, seed: 3, roof: PALETTE.roofGrey }), { x: offX, y: y0, z: offZ }));
  g.add(place(shedRoof({ w: offW, d: offD, h: 0.7, overhang: 0.2, material: surface('corrugated', PALETTE.roofRed, { size: 0.8 }), wallMaterial: PALETTE.cream }), { x: offX, y: y0 + 3, z: offZ }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.blue }), { x: offX - offW / 2, y: y0, z: offZ + 0.6, ry: -90 }));
  g.add(place(plateSign(2.6, 0.55, 'OFFICE', PALETTE.white, PALETTE.navy, 0.08), { x: offX, y: y0 + 2.3, z: offZ + offD / 2 + 0.02 }));

  // ---- steel stockyard between berth and shop ----
  g.add(place(plateStack(2.4, 1.5, 9, 1), { x: 7.6, y: y0, z: 3.9 }));
  g.add(place(plateStack(2.2, 1.3, 6, 2), { x: 7.6, y: y0, z: 1.9 }));
  g.add(place(plateStack(2.2, 1.3, 12, 3), { x: 10.4, y: y0, z: 4.0 }));
  g.add(place(beamRack(2.6, 4), { x: 10.4, y: y0, z: 1.9 }));
  // open-fronted welding bay lean-to on the plate shop
  const ltX = shopX - 1.2, ltZ0 = shopZ + shopD / 2, ltD = 2.2, ltW = 3.4;
  const post = mat(PALETTE.blue);
  for (const dx of [-ltW / 2, ltW / 2]) g.add(place(box(0.15, 3.4, 0.15, post), { x: ltX + dx, y: y0, z: ltZ0 + ltD }));
  g.add(place(box(ltW, 0.2, 0.2, post), { x: ltX, y: y0 + 3.4, z: ltZ0 + ltD }));
  g.add(beam([ltX, y0 + 4.4, ltZ0], [ltX, y0 + 3.6, ltZ0 + ltD + 0.3], 0.05, post));
  g.add(place(box(ltW + 0.4, 0.08, Math.hypot(ltD + 0.3, 0.8), surface('corrugated', PALETTE.roofRed, { size: 0.8 })), { x: ltX, y: y0 + 3.95, z: ltZ0 + (ltD + 0.3) / 2, rx: Math.atan2(0.8, ltD + 0.3) * 180 / Math.PI }));
  g.add(place(worker(PALETTE.orange), { x: 9.6, y: y0, z: 1.15, ry: 160 }));
  g.add(place(new THREE.Mesh(new THREE.IcosahedronGeometry(0.16, 0), emissive('#ffcf5a', 1.6)), { x: 9.7, y: y0 + 0.8, z: 1.55 }));
  g.add(place(forklift(), { x: 4.3, y: y0, z: -3.8, ry: 180 }));
  // gas bottles by the berth
  for (let i = 0; i < 4; i++) {
    g.add(place(cylinder(0.14, 0.14, 1.2, mat(i % 2 ? PALETTE.green : PALETTE.blue), 8), { x: 4.6 + i * 0.32, y: y0, z: 4.2 }));
  }
  // floodlight mast + yard workers
  g.add(place(streetLamp({ h: 7 }), { x: 6.2, y: y0, z: -4.6, ry: 180 }));
  g.add(place(streetLamp({ h: 7 }), { x: -11.0, y: y0, z: -4.4 }));
  g.add(place(worker(PALETTE.orange), { x: 9.0, y: y0, z: 3.4, ry: 200 }));
  g.add(place(worker(PALETTE.yellow), { x: 3.4, y: y0, z: 3.8, ry: 60 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 8 }), { x: 14.5, y: y0, z: 4.7 }));
  return g;
}

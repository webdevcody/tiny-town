import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, metal, glass, surface, textured, canvasTexture, emissive,
  gableRoof, barrelRoof, awning, streetLamp, bench, tree, car, cylinder, sphere, beam, rng,
} from '../../src/lib/index.js';
import { vault, archRing, profileSlab, archProfile, halfDisc, person, umbrella, nameBoard } from './parts.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Iron-and-glass barrel vault running along X between two arched brick end walls,
// a brick clock pavilion on the street side and market stalls spilling outside.

const L = 14.8;        // vault length (x -7.4 .. 7.4)
const BAY = 1.48;      // rib spacing
const R = 3;           // vault radius = half the hall depth
const ZC = -1.4;       // hall centre line
const HW = 3.4;        // side wall height (vault springs here)

const IRON = '#2f5a46';            // Victorian green paintwork
const IRON_LIGHT = '#3f7559';

function vaultGlass() {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    const grd = ctx.createLinearGradient(0, 0, w, h);
    grd.addColorStop(0, '#b6d8ec');
    grd.addColorStop(1, '#86b6d6');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(255,255,255,0.25)';
    ctx.fillRect(8, 8, 18, h - 16);
    ctx.fillRect(72, 8, 18, h - 16);
    ctx.fillStyle = IRON;
    ctx.fillRect(0, 0, w, 6);
    ctx.fillRect(0, 0, 6, h);
    ctx.fillRect(62, 0, 4, h);
  }, { key: 'market-hall:vault-glass' });
  tex.repeat.set(1 / BAY, 1 / 1.0);
  return textured(tex, { roughness: 0.25, metalness: 0.3 });
}

function stall(r, { w = 2.2, d = 1.3, color }) {
  const g = new THREE.Group();
  const wood = mat(PALETTE.wood);
  // counter + skirt
  g.add(place(box(w - 0.2, 0.85, d - 0.35, wood), { z: 0.1 }));
  g.add(place(box(w - 0.15, 0.08, d - 0.25, mat(PALETTE.woodLight)), { y: 0.85, z: 0.1 }));
  // produce crates on the counter
  const goods = [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.foliageLight, PALETTE.purple, '#e05a7a', PALETTE.green];
  const n = 4;
  const cw = (w - 0.4) / n;
  for (let i = 0; i < n; i++) {
    const x = -w / 2 + 0.2 + cw * (i + 0.5);
    g.add(place(box(cw - 0.08, 0.18, 0.55, mat(PALETTE.woodLight)), { x, y: 0.93, z: 0.25 }));
    g.add(place(box(cw - 0.16, 0.08, 0.47, mat(r.pick(goods))), { x, y: 1.1, z: 0.25 }));
  }
  // posts + striped canvas roof
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.08, 2.2, 0.08, mat(PALETTE.white)), { x: sx * (w / 2 - 0.05), z: sz * (d / 2 - 0.05) }));
  }
  g.add(place(gableRoof({ w, d, h: 0.45, overhang: 0.15, ridge: 'x', material: surface('stripes', color, { color2: PALETTE.white, size: 1.2 }), gableMaterial: color }), { y: 2.2 }));
  // valance
  g.add(place(box(w + 0.3, 0.22, 0.04, mat(color)), { y: 2.0, z: d / 2 + 0.13 }));
  return g;
}

function crateStack(r, n) {
  const g = new THREE.Group();
  const goods = [PALETTE.red, PALETTE.orange, PALETTE.yellow, PALETTE.foliageLight, PALETTE.green];
  for (let i = 0; i < n; i++) {
    const y = i * 0.32;
    g.add(place(box(0.6, 0.3, 0.45, mat(PALETTE.woodLight)), { y, x: (i % 2) * 0.05 }));
    if (i === n - 1) g.add(place(box(0.5, 0.06, 0.37, mat(r.pick(goods))), { y: y + 0.3 }));
  }
  return g;
}

export default function build() {
  const r = rng(22);
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'cobbles'));

  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  const brickDark = mat(PALETTE.brickDark);
  const stone = mat(PALETTE.cream);
  const iron = metal(IRON, { roughness: 0.5 });
  const ironLight = metal(IRON_LIGHT, { roughness: 0.5 });
  const sideGlass = glass(PALETTE.glassDark);

  // paved floor under the hall
  g.add(place(patch(L + 1.2, 2 * R + 0.6, 'paved'), { y: y0, z: ZC }));

  // --- long side walls: brick plinth, glazed bays between iron columns ---
  for (const sz of [-1, 1]) {
    const z = ZC + sz * (R - 0.15);
    g.add(place(box(L, 0.9, 0.3, brick), { y: y0, z }));
    g.add(place(box(L, 0.08, 0.4, stone), { y: y0 + 0.9, z }));
    g.add(place(box(L, HW - 0.9 - 0.4, 0.1, sideGlass), { y: y0 + 0.98, z }));
    // glazing transom
    g.add(place(box(L, 0.1, 0.18, iron), { y: y0 + 2.4, z }));
    // eave beam / gutter
    g.add(place(box(L + 0.2, 0.42, 0.42, iron), { y: y0 + HW - 0.42, z: ZC + sz * (R - 0.05) }));
    for (let i = 0; i <= L / BAY + 0.01; i++) {
      const x = -L / 2 + i * BAY;
      g.add(place(box(0.2, HW - 0.42, 0.34, iron), { x, y: y0, z: ZC + sz * (R - 0.1) }));
    }
  }

  // --- the iron-and-glass barrel vault ---
  const yv = y0 + HW;
  g.add(place(vault({ L, R, segments: 16, material: vaultGlass() }), { y: yv, z: ZC }));
  for (let i = 0; i <= L / BAY + 0.01; i++) {
    const x = -L / 2 + i * BAY;
    g.add(place(archRing({ ri: R - 0.05, ro: R + 0.12, t: 0.16, segments: 16, material: iron }), { x, y: yv, z: ZC }));
  }
  // longitudinal purlins
  for (const a of [35, 70, 110, 145]) {
    const t = (a * Math.PI) / 180;
    g.add(place(box(L, 0.1, 0.1, ironLight), { y: yv + (R + 0.06) * Math.sin(t) - 0.05, z: ZC + (R + 0.06) * Math.cos(t) }));
  }

  // ridge lantern (raised louvred clerestory)
  const lanL = 10.4, lanD = 1.7;
  const yl = yv + R - 0.12;
  g.add(place(box(lanL, 0.75, lanD, surface('stripes', IRON, { color2: '#9fc4d8', size: 0.5 })), { y: yl, z: ZC }));
  g.add(place(box(lanL + 0.3, 0.1, lanD + 0.3, iron), { y: yl + 0.75, z: ZC }));
  g.add(place(barrelRoof({ w: lanL + 0.3, d: lanD + 0.3, h: 0.55, axis: 'x', material: iron, endMaterial: iron }), { y: yl + 0.85, z: ZC }));
  for (const sx of [-1, 1]) g.add(place(sphere(0.18, ironLight, 8), { x: sx * (lanL / 2 + 0.05), y: yl + 1.35, z: ZC }));

  // --- arched brick end walls with lunette windows and big doorways ---
  const ew = 2 * R + 0.7;     // end wall width
  const ewT = 0.5;
  for (const sx of [-1, 1]) {
    const x = sx * (L / 2 + ewT / 2);
    g.add(place(profileSlab(archProfile(ew, HW), ewT, brick, brickDark), { x, y: y0, z: ZC }));
    // stone coping following the arch + plinth band
    g.add(place(archRing({ ri: ew / 2 - 0.05, ro: ew / 2 + 0.22, t: ewT + 0.2, material: stone }), { x, y: y0 + HW, z: ZC }));
    g.add(place(box(ewT + 0.12, 0.5, ew, mat(PALETTE.stoneDark)), { x, y: y0, z: ZC }));
    // corner pilasters with caps
    for (const sz of [-1, 1]) {
      const z = ZC + sz * (ew / 2 - 0.05);
      g.add(place(box(ewT + 0.3, HW + 0.4, 0.62, brickDark), { x, y: y0, z }));
      g.add(place(box(ewT + 0.45, 0.22, 0.76, stone), { x, y: y0 + HW + 0.4, z }));
      g.add(place(sphere(0.22, stone, 8), { x, y: y0 + HW + 0.75, z }));
    }
    // finial at the apex
    g.add(place(box(0.5, 0.5, 0.5, stone), { x, y: y0 + HW + ew / 2 + 0.15, z: ZC }));
    g.add(place(sphere(0.25, mat(PALETTE.glassGold, { metalness: 0.6, roughness: 0.35 }), 8), { x, y: y0 + HW + ew / 2 + 0.8, z: ZC }));

    // face details on the outside of the wall (rotated so +z of the part points out along x)
    const fx = sx * (L / 2 + ewT + 0.01);
    // lunette (half-round fanlight) with radial glazing bars
    const lr = 2.0, ly = y0 + HW + 0.15;
    g.add(place(profileSlab(halfDisc(lr + 0.2), 0.1, stone), { x: fx, y: ly - 0.05, z: ZC }));
    g.add(place(profileSlab(halfDisc(lr), 0.16, glass(PALETTE.glassSky)), { x: fx + sx * 0.02, y: ly, z: ZC }));
    for (let k = 0; k <= 4; k++) {
      const a = (Math.PI * k) / 4;
      g.add(beam([fx + sx * 0.1, ly, ZC], [fx + sx * 0.1, ly + lr * Math.sin(a), ZC + lr * Math.cos(a)], 0.09, iron));
    }
    g.add(place(archRing({ ri: lr * 0.45, ro: lr * 0.45 + 0.09, t: 0.2, material: iron }), { x: fx, y: ly, z: ZC }));
    // arched doorway: stone surround, dark opening, open green doors
    const dw = 2.4, dh = 2.0;
    g.add(place(profileSlab(archProfile(dw + 0.5, dh), 0.1, stone), { x: fx, y: y0, z: ZC }));
    g.add(place(profileSlab(archProfile(dw, dh), 0.14, mat('#2a2622')), { x: fx + sx * 0.01, y: y0, z: ZC }));
    for (const sz of [-1, 1]) {
      g.add(place(box(0.08, dh, dw / 2, ironLight), { x: fx + sx * (0.05 + dw / 4), y: y0, z: ZC + sz * (dw / 2 + 0.25), ry: 0 }));
    }
    // wall lanterns
    for (const sz of [-1, 1]) {
      g.add(place(box(0.25, 0.4, 0.25, emissive(PALETTE.windowLit, 0.6)), { x: fx + sx * 0.2, y: y0 + 2.4, z: ZC + sz * 1.9 }));
      g.add(place(box(0.32, 0.08, 0.32, iron), { x: fx + sx * 0.2, y: y0 + 2.8, z: ZC + sz * 1.9 }));
    }
  }

  // --- brick clock pavilion on the street side ---
  const pw = 3.6, pd = 1.8, ph = HW + 2.0;
  const pz = ZC + R - pd / 2 + 0.6;
  g.add(place(box(pw, ph, pd, brick), { y: y0, z: pz }));
  for (const sx of [-1, 1]) g.add(place(box(0.45, ph + 0.1, pd + 0.12, brickDark), { x: sx * (pw / 2), y: y0, z: pz }));
  g.add(place(box(pw + 0.6, 0.25, pd + 0.3, stone), { y: y0 + ph, z: pz }));
  g.add(place(gableRoof({ w: pw, d: pd, h: 1.5, overhang: 0.3, ridge: 'z', material: surface('roofTiles', PALETTE.roofSlate, { size: 1.5 }), gableMaterial: brick }), { y: y0 + ph + 0.25, z: pz }));
  const pf = pz + pd / 2;
  // arched entrance
  g.add(place(profileSlab(archProfile(2.4, 1.9), 0.1, stone), { y: y0, z: pf, ry: -90 }));
  g.add(place(profileSlab(archProfile(1.9, 1.9), 0.14, mat('#2a2622')), { y: y0, z: pf + 0.01, ry: -90 }));
  // sign + clock
  g.add(place(nameBoard({ text: 'MARKET HALL', w: 3.0, h: 0.55, bg: IRON, fg: '#f3e2a8', border: '#f3e2a8' }), { y: y0 + 3.6, z: pf }));
  const clock = new THREE.Group();
  clock.add(place(cylinder(0.72, 0.72, 0.12, stone, 20), { rx: 90 }));
  clock.add(place(cylinder(0.6, 0.6, 0.14, mat(PALETTE.white), 20), { rx: 90 }));
  clock.add(place(box(0.06, 0.45, 0.04, mat(PALETTE.black)), { y: 0, z: 0.16 }));
  clock.add(place(box(0.32, 0.06, 0.04, mat(PALETTE.black)), { x: 0.14, y: 0, z: 0.16 }));
  g.add(place(clock, { y: y0 + ph - 0.8, z: pf + 0.02 }));
  // little cupola on the pavilion ridge
  g.add(place(box(0.7, 0.8, 0.7, stone), { y: y0 + ph + 1.3, z: pz }));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.55, 1.0, 4), mat(PALETTE.roofGreen)), { y: y0 + ph + 2.6, z: pz, ry: 45 }));
  g.add(place(cylinder(0.03, 0.03, 0.6, mat(PALETTE.glassGold), 4), { y: y0 + ph + 3.0, z: pz }));

  // --- stalls spilling out onto the street ---
  const colors = [PALETTE.red, PALETTE.green, PALETTE.blue, PALETTE.orange, PALETTE.purple, PALETTE.yellow];
  const stallZ = 3.55;
  [[-6.2, 0], [-3.4, 1], [3.4, 2], [6.2, 3]].forEach(([x, c]) => {
    g.add(place(stall(r, { color: colors[c] }), { x, y: y0, z: stallZ }));
  });
  // stalls along the back too
  [[-4.6, 4], [0, 5], [4.6, 0]].forEach(([x, c]) => {
    g.add(place(box(2.4, 0.9, 0.5, mat(PALETTE.wood)), { x, y: y0, z: -4.65 }));
    g.add(place(box(2.2, 0.1, 0.4, mat(r.pick([PALETTE.red, PALETTE.orange, PALETTE.foliageLight, PALETTE.yellow]))), { x, y: y0 + 0.9, z: -4.65 }));
    g.add(place(awning({ w: 2.6, depth: 0.55, drop: 0.3, color: colors[c] }), { x, y: y0 + 2.3, z: ZC - R - 0.2, ry: 180 }));
  });
  // crates and produce on the ground
  for (const [x, z, n] of [[-7.6, 4.3, 3], [-4.8, 4.6, 2], [1.7, 4.5, 2], [4.8, 4.7, 1], [7.6, 4.2, 2], [8.9, 2.2, 3]]) {
    g.add(place(crateStack(r, n), { x, y: y0, z, ry: r.range(-10, 10) }));
  }

  // west end: flower & cafe umbrellas
  const flowerCols = ['#e05a7a', PALETTE.yellow, PALETTE.white, PALETTE.purple, PALETTE.red];
  [[-9.0, -2.8, PALETTE.red], [-9.0, 0.6, PALETTE.yellow]].forEach(([x, z, col], i) => {
    g.add(place(umbrella({ r: 1.0, h: 2.2, color: col }), { x, y: y0, z }));
    g.add(place(box(1.0, 0.75, 0.9, mat(PALETTE.woodLight)), { x, y: y0, z }));
    for (let k = 0; k < 4; k++) {
      const bx = x - 0.3 + (k % 2) * 0.6, bz = z - 0.25 + Math.floor(k / 2) * 0.5;
      g.add(place(cylinder(0.14, 0.11, 0.25, mat(PALETTE.steelLight), 8), { x: bx, y: y0 + 0.75, z: bz }));
      g.add(place(sphere(0.2, mat(flowerCols[(k + i) % flowerCols.length]), 6), { x: bx, y: y0 + 1.05, z: bz }));
    }
  });
  g.add(place(tree({ kind: 'round', h: 4.2, seed: 7 }), { x: -8.75, y: y0, z: 3.6 }));

  // east end: delivery van and crates
  g.add(place(car({ kind: 'van', color: PALETTE.white }), { x: 8.95, y: y0, z: -2.3, ry: 90, s: 0.9 }));

  // street lamps & benches
  g.add(place(streetLamp({ h: 4.2 }), { x: -1.9, y: y0, z: 4.6, ry: 180 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 1.9, y: y0, z: 4.6 }));
  g.add(place(bench({ w: 1.4 }), { x: 9.0, y: y0, z: 4.2, ry: -90 }));

  // shoppers
  const shirts = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green, PALETTE.orange, PALETTE.white, PALETTE.purple];
  for (const [x, z, ry] of [[-6.0, 4.6, 180], [-3.0, 4.7, 160], [3.6, 4.6, 200], [0.6, 3.8, 20], [-0.8, 4.4, 90], [6.6, 4.7, 180], [-8.4, -1.2, 90], [9.3, 0.9, 0], [-7.6, 2.4, 45]]) {
    g.add(place(person({ shirt: r.pick(shirts), legs: r.pick([PALETTE.navy, PALETTE.darkGrey, PALETTE.woodDark]) }), { x, y: y0, z, ry }));
  }
  return g;
}

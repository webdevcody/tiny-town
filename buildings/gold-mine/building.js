import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, place, beam, cylinder, pipeRun, gableRoof, shedRoof, tank, tree,
  surface, mat, metal, emissive, water, door,
} from '../../src/lib/index.js';
import { rockyHill, smooth, hash, track, oreCart, trestle, bigSign, goldStack, barrel } from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Rocky hillside at the back with a timbered adit high in the cliff; ore carts run out
// onto a dump platform and along a trestle into a stepped stamp mill, whose tailings
// wash down a sluice into a settling pond. Assay office with gold bars at the front.

const lerp = (a, b, t) => a + (b - a) * t;

// adit (mine entrance) position and floor height above the lot
const AX = -5.5;
const AY = 3.9;
const ADIT_BACK = -5.2;
// waste-rock dump under the platform edge
const DUMP = { x: -5.6, z: 1.2, r: 3.6, h: 3.1 };

function hillHeight(x, z) {
  const t = smooth((x + 1.5) / 3.5); // 0 = high left cliff, 1 = lower ground behind the mill
  const zf = lerp(-1.4, -5.6, t); // foot of the cliff
  const d = zf - z;
  let h = lerp(8.2, 4.6, t) * smooth(d / 2.2);
  h += lerp(3.2, 1.6, t) * smooth((d - 3) / 4.5);
  // left flank wraps round towards the front as a lower rocky shoulder
  h = Math.max(h, 4.2 * smooth((-6.8 - x) / 2.6) * smooth((3.2 - z) / 3.5));
  // ease the hill down towards the back and side edges of the tile
  h *= (0.2 + 0.8 * smooth((10 - Math.abs(x)) / 3.2)) * (0.2 + 0.8 * smooth((10 + z) / 3.2));
  // rough it up
  h += (hash(Math.round(x * 2), Math.round(z * 2)) - 0.5) * 0.9 * Math.min(1, h / 1.5);
  // notch for the adit portal
  if (Math.abs(x - AX) < 1.3 && z > ADIT_BACK - 0.3) h = Math.min(h, AY - 0.1);
  // waste dump fan
  const dr = Math.hypot(x - DUMP.x, (z - DUMP.z) * 1.15);
  const dump = DUMP.h * (1 - dr / DUMP.r) + (hash(x * 3, z * 3) - 0.5) * 0.25;
  return Math.max(h, dump);
}

function hillColour(x, z, h, steep, r) {
  const dr = Math.hypot(x - DUMP.x, (z - DUMP.z) * 1.15);
  if (dr < DUMP.r * 0.95 && h < DUMP.h + 0.2 && z > -1.3) return ['#c9b68a', '#b9a479', '#d3c296', '#a8956c'][Math.floor(r * 4)];
  if (steep < 0.32 && h > 1.4) return [PALETTE.grass, PALETTE.grassDark, PALETTE.grassLight, '#8a8a45'][Math.floor(r * 4)];
  if (steep < 0.45 && h > 2.5 && r < 0.4) return '#7d8a45';
  return ['#a5835a', '#8e6f4c', '#b6956a', '#9a8b74', '#7e6a52', '#c0a070'][Math.floor(r * 6)];
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'dirt'));

  const wood = mat(PALETTE.woodDark);
  const woodLight = mat(PALETTE.wood);
  const planks = surface('planks', '#a47a4c', { size: 2 });
  const planksDark = surface('planks', '#8a5f3a', { size: 2 });
  const tin = surface('corrugated', PALETTE.rust, { size: 1.5 });
  const tinGrey = surface('corrugated', PALETTE.steel, { size: 1.5 });
  const dark = mat('#14110e');
  const winM = mat(PALETTE.window, { roughness: 0.3, metalness: 0.3 });

  // ---- hillside ------------------------------------------------------------
  g.add(place(rockyHill({ w: 20, d: 20, step: 0.5, height: hillHeight, colorAt: hillColour }), { y: y0 - 0.02 }));
  const onHill = (x, z) => y0 + hillHeight(x, z) - 0.1;

  // pines on the hilltop
  [[-7.6, -7.4, 5.5], [-5.4, -8.6, 4.6], [-2.8, -7.8, 5.2], [-0.2, -8.7, 4.2], [-8.4, -4.6, 4.0], [2.8, -8.6, 4.4], [8.8, -8.8, 3.8], [-1.0, -6.0, 3.6], [-4.2, -6.4, 3.2]]
    .forEach(([x, z, h], i) => g.add(place(tree({ kind: 'cone', h, seed: 40 + i, color: i % 2 ? PALETTE.foliageDark : PALETTE.foliage }), { x, y: onHill(x, z), z })));
  [[-9.0, 1.4], [-4.0, -6.0], [1.5, -7.2]].forEach(([x, z], i) => g.add(place(tree({ kind: 'bush', h: 1.0, seed: 60 + i }), { x, y: onHill(x, z), z })));
  // a few loose boulders
  [[-1.8, 3.4, 0.7], [-0.6, 4.4, 0.45], [-9.2, 4.6, 0.6]].forEach(([x, z, s], i) =>
    g.add(place(box(s, s * 0.7, s * 0.9, mat('#8e7a5e')), { x, y: y0, z, ry: i * 33 })));

  // ---- adit portal ---------------------------------------------------------
  const ay = y0 + AY;
  const pw = 3.0, ph = 3.2;
  const pz = -2.3; // portal face
  // timber-lined box running into the hill, black mouth
  g.add(place(box(pw + 0.4, ph, pz - ADIT_BACK, planksDark), { x: AX, y: ay, z: (pz + ADIT_BACK) / 2 }));
  g.add(place(box(pw - 0.8, ph - 0.7, 0.1, dark), { x: AX, y: ay, z: pz + 0.02 }));
  // portal set: posts, cap, header, struts
  for (const s of [-1, 1]) {
    g.add(place(box(0.38, ph - 0.4, 0.4, wood), { x: AX + s * (pw / 2 - 0.4), y: ay, z: pz + 0.15 }));
    g.add(beam([AX + s * (pw / 2 + 0.6), ay, pz + 0.9], [AX + s * (pw / 2 - 0.3), ay + ph - 0.6, pz + 0.2], 0.22, wood));
  }
  g.add(place(box(pw + 0.6, 0.45, 0.5, wood), { x: AX, y: ay + ph - 0.65, z: pz + 0.15 }));
  g.add(place(gableRoof({ w: pw + 0.6, d: 1.6, h: 0.9, overhang: 0.2, ridge: 'z', material: tin, gableMaterial: planksDark }), { x: AX, y: ay + ph - 0.2, z: pz - 0.35 }));
  g.add(place(bigSign({ text: 'MOTHER LODE', w: 2.9, h: 0.55, bg: PALETTE.woodDark, fg: '#ffd84a' }), { x: AX, y: ay + ph - 0.15, z: pz + 0.5 }));
  // lanterns either side of the mouth
  for (const s of [-1, 1]) g.add(place(box(0.2, 0.28, 0.2, emissive('#ffcf6a', 0.9)), { x: AX + s * 1.0, y: ay + 2.0, z: pz + 0.42 }));

  // dump platform in front of the adit, on posts
  const pfX0 = AX - 2.0, pfX1 = AX + 2.2, pfZ0 = pz - 0.2, pfZ1 = 0.7;
  g.add(place(box(pfX1 - pfX0, 0.2, pfZ1 - pfZ0, planks), { x: (pfX0 + pfX1) / 2, y: ay - 0.2, z: (pfZ0 + pfZ1) / 2 }));
  for (const x of [pfX0 + 0.15, AX, pfX1 - 0.15]) for (const z of [pfZ0 + 1.2, pfZ1 - 0.15]) {
    g.add(place(box(0.24, AY - 0.2, 0.24, wood), { x, y: y0, z }));
  }
  g.add(beam([pfX0 + 0.15, y0 + 0.3, pfZ1 - 0.15], [AX, ay - 0.3, pfZ1 - 0.15], 0.12, woodLight));
  g.add(beam([pfX1 - 0.15, y0 + 0.3, pfZ1 - 0.15], [AX, ay - 0.3, pfZ1 - 0.15], 0.12, woodLight));
  // railing on the left edge
  g.add(place(box(0.1, 1.0, pfZ1 - pfZ0, woodLight), { x: pfX0 + 0.05, y: ay, z: (pfZ0 + pfZ1) / 2 }));
  g.add(place(box(0.12, 0.1, pfZ1 - pfZ0, woodLight), { x: pfX0 + 0.05, y: ay + 1.0, z: (pfZ0 + pfZ1) / 2 }));
  // stop block at the dump edge
  g.add(place(box(1.2, 0.3, 0.3, wood), { x: AX, y: ay, z: pfZ1 - 0.2 }));

  // tracks: out of the adit to the dump edge, and across to the mill
  const TZ = -1.0; // trestle line
  g.add(place(track({ length: pfZ1 - 0.4 - (pz - 0.6) }), { x: AX, y: ay, z: pz - 0.6, ry: -90 }));
  const millX = 2.0;
  g.add(place(track({ length: millX - AX }), { x: AX, y: ay, z: TZ }));
  // carts
  g.add(place(oreCart({ seed: 1, color: PALETTE.rust }), { x: AX, y: ay + 0.1, z: pz - 0.2, ry: -90 }));
  g.add(place(oreCart({ seed: 2, color: PALETTE.steelDark, tipped: 38 }), { x: AX, y: ay + 0.1, z: pfZ1 - 1.0, ry: -90 }));
  g.add(place(oreCart({ seed: 3, color: PALETTE.rust }), { x: -2.0, y: ay + 0.1, z: TZ }));
  g.add(place(oreCart({ seed: 4, color: '#6d7a52' }), { x: -0.4, y: ay + 0.1, z: TZ }));

  // trestle from the platform to the mill
  g.add(place(trestle({ length: millX - pfX1, h: AY - 0.08, w: 1.6, bay: 1.6 }), { x: pfX1, y: y0, z: TZ }));

  // ---- stepped stamp mill ----------------------------------------------------
  const roofTrim = (w, d, x, y, z) => place(box(w, 0.14, d, wood), { x, y, z });
  // S1: ore bin & crusher house (tallest, against the hill)
  const s1 = { x: 5.8, z: -3.4, w: 7.6, d: 6.0, h: 8.6 };
  g.add(place(box(s1.w, s1.h, s1.d, planks), { x: s1.x, y: y0, z: s1.z }));
  g.add(place(gableRoof({ w: s1.w, d: s1.d, h: 2.2, overhang: 0.3, ridge: 'z', material: tin, gableMaterial: planks }), { x: s1.x, y: y0 + s1.h, z: s1.z }));
  g.add(roofTrim(s1.w + 0.1, s1.d + 0.1, s1.x, y0 + s1.h - 0.14, s1.z));
  // ore door where the trestle arrives
  g.add(place(box(0.1, 2.2, 1.6, dark), { x: millX - 0.04, y: ay, z: TZ }));
  g.add(place(box(0.3, 0.3, 2.2, wood), { x: millX - 0.1, y: ay + 2.2, z: TZ }));
  // S2: stamp battery house
  const s2 = { x: 6.0, z: 1.3, w: 7.2, d: 3.6, h: 5.6 };
  g.add(place(box(s2.w, s2.h, s2.d, planksDark), { x: s2.x, y: y0, z: s2.z }));
  g.add(place(gableRoof({ w: s2.w, d: s2.d, h: 1.5, overhang: 0.3, ridge: 'x', material: tinGrey, gableMaterial: planksDark }), { x: s2.x, y: y0 + s2.h, z: s2.z }));
  // battery housing on the ridge with stamp stems poking through
  const bx0 = 3.4, bx1 = 7.6;
  g.add(place(box(bx1 - bx0 + 0.6, 1.0, 1.3, planks), { x: (bx0 + bx1) / 2, y: y0 + s2.h + 1.0, z: s2.z }));
  g.add(place(gableRoof({ w: bx1 - bx0 + 0.6, d: 1.3, h: 0.5, overhang: 0.15, ridge: 'x', material: tin, gableMaterial: planks }), { x: (bx0 + bx1) / 2, y: y0 + s2.h + 2.0, z: s2.z }));
  const stemM = metal(PALETTE.steelLight, { roughness: 0.35 });
  for (let i = 0; i < 10; i++) {
    const x = bx0 + (i * (bx1 - bx0)) / 9;
    const lift = (i % 5) * 0.22;
    g.add(place(cylinder(0.07, 0.07, 1.9, stemM, 6), { x, y: y0 + s2.h + 2.0 + lift, z: s2.z }));
    g.add(place(cylinder(0.12, 0.12, 0.18, metal(PALETTE.steelDark), 6), { x, y: y0 + s2.h + 3.4 + lift, z: s2.z }));
  }
  // windows on S1 front (above the battery roof) & S2 right
  for (const x of [2.9, 8.7]) g.add(place(box(0.8, 1.0, 0.08, winM), { x, y: y0 + 7.2, z: s1.z + s1.d / 2 + 0.02 }));
  for (const z of [0.4, 2.2]) g.add(place(box(0.08, 0.9, 0.8, winM), { x: s2.x + s2.w / 2 + 0.02, y: y0 + 3.6, z }));
  for (const z of [-5.2, -3.4, -1.6]) {
    g.add(place(box(0.08, 1.0, 0.8, winM), { x: s1.x + s1.w / 2 + 0.02, y: y0 + 6.2, z }));
    g.add(place(box(0.08, 1.0, 0.8, winM), { x: millX - 0.02, y: y0 + 6.8, z }));
  }
  for (const x of [3.6, 5.8, 8.0]) g.add(place(box(0.8, 1.0, 0.08, winM), { x, y: y0 + 6.4, z: s1.z - s1.d / 2 - 0.02 }));
  // big iron flywheel on the right wall (drives the cam shaft)
  const iron = metal(PALETTE.roofBlack, { roughness: 0.5 });
  const fw = new THREE.Mesh(new THREE.TorusGeometry(1.15, 0.13, 6, 20), iron);
  fw.position.set(9.9, y0 + 3.5, s2.z);
  fw.rotation.y = Math.PI / 2;
  g.add(fw);
  for (let k = 0; k < 3; k++) {
    const a = (k * Math.PI) / 3;
    g.add(beam([9.9, y0 + 3.5 + Math.cos(a) * 1.1, s2.z + Math.sin(a) * 1.1], [9.9, y0 + 3.5 - Math.cos(a) * 1.1, s2.z - Math.sin(a) * 1.1], 0.1, iron));
  }
  g.add(place(cylinder(0.25, 0.25, 0.5, iron, 10), { x: 9.85, y: y0 + 3.5 - 0.25, z: s2.z, rz: 90 }));
  // iron stack for the boiler
  g.add(place(cylinder(0.28, 0.32, 5.0, metal(PALETTE.roofBlack), 10), { x: 8.9, y: y0 + s2.h, z: -0.1 }));
  g.add(place(cylinder(0.42, 0.3, 0.4, metal(PALETTE.roofBlack), 10), { x: 8.9, y: y0 + s2.h + 5.0, z: -0.1 }));
  // S3: amalgamation tables (lowest step)
  const s3 = { x: 6.2, z: 4.4, w: 6.4, d: 2.6, h: 3.0 };
  g.add(place(box(s3.w, s3.h, s3.d, planks), { x: s3.x, y: y0, z: s3.z }));
  g.add(place(shedRoof({ w: s3.w, d: s3.d, h: 1.1, overhang: 0.25, material: tin, wallMaterial: planks }), { x: s3.x, y: y0 + s3.h, z: s3.z }));
  g.add(place(door({ w: 1.4, h: 2.3, color: PALETTE.woodDark }), { x: 4.4, y: y0, z: s3.z + s3.d / 2 }));
  g.add(place(box(1.0, 0.9, 0.08, winM), { x: 6.6, y: y0 + 1.4, z: s3.z + s3.d / 2 + 0.02 }));
  // main sign on the battery house front, above the tables-house roof
  g.add(place(bigSign({ text: 'GOLD MINE', w: 5.8, h: 1.25, bg: PALETTE.woodDark, fg: '#ffd84a', border: '#ffd84a' }), { x: s2.x - 0.2, y: y0 + s3.h + 1.25, z: s2.z + s2.d / 2 + 0.02 }));

  // water tank on the hill + flume into the mill
  const tx = 7.6, tz = -8.4, ty = onHill(tx, tz);
  g.add(place(tank({ radius: 1.15, h: 1.9, roof: 'cone', material: planksDark }), { x: tx, y: ty + 1.2, z: tz }));
  for (const [dx, dz] of [[-0.7, -0.7], [0.7, -0.7], [-0.7, 0.7], [0.7, 0.7]]) g.add(place(box(0.2, 1.4, 0.2, wood), { x: tx + dx, y: onHill(tx + dx, tz + dz), z: tz + dz }));
  g.add(pipeRun([[tx - 0.6, ty + 1.5, tz + 0.9], [tx - 0.6, ty + 1.5, s1.z - s1.d / 2 - 0.05]], 0.12, metal(PALETTE.steelDark)));

  // ---- sluice + settling pond ----------------------------------------------
  const slZ = 7.4, slX0 = 8.6, slX1 = 0.9, slY0 = 1.7, slY1 = 0.75;
  const L = slX0 - slX1;
  const slope = Math.atan2(slY0 - slY1, L);
  const sl = new THREE.Group();
  sl.add(place(box(L, 0.08, 0.9, planksDark), { x: -L / 2 }));
  for (const s of [-1, 1]) sl.add(place(box(L, 0.4, 0.08, planks), { x: -L / 2, z: s * 0.45 }));
  sl.add(place(box(L, 0.04, 0.82, water()), { x: -L / 2, y: 0.18 }));
  for (let i = 1; i < 12; i++) sl.add(place(box(0.06, 0.25, 0.82, wood), { x: -(i * L) / 12 }));
  g.add(place(sl, { x: slX0, y: y0 + slY0, z: slZ, rz: (slope * 180) / Math.PI }));
  // legs
  for (let i = 0; i <= 5; i++) {
    const x = slX0 - (i * L) / 5;
    const hy = slY0 - (i * (slY0 - slY1)) / 5;
    for (const s of [-1, 1]) g.add(place(box(0.14, hy, 0.14, wood), { x, y: y0, z: slZ + s * 0.42 }));
  }
  // feed trough from the tables house
  g.add(place(box(0.7, 0.3, slZ - (s3.z + s3.d / 2), planksDark), { x: slX0 - 0.35, y: y0 + slY0 + 0.05, z: (slZ + s3.z + s3.d / 2) / 2 }));
  g.add(place(box(0.55, 0.04, slZ - (s3.z + s3.d / 2), water()), { x: slX0 - 0.35, y: y0 + slY0 + 0.3, z: (slZ + s3.z + s3.d / 2) / 2 }));
  // pond with plank edging
  const pd = { x: -1.4, z: 7.6, w: 4.2, d: 3.6 };
  g.add(place(box(pd.w + 0.4, 0.3, pd.d + 0.4, planksDark), { x: pd.x, y: y0, z: pd.z }));
  g.add(place(box(pd.w, 0.06, pd.d, water()), { x: pd.x, y: y0 + 0.26, z: pd.z }));
  // gold pans & a bucket by the sluice
  for (const [x, z] of [[3.0, 8.6], [4.2, 8.8]]) g.add(place(cylinder(0.35, 0.25, 0.1, metal(PALETTE.steel), 12), { x, y: y0, z }));

  // ---- assay office --------------------------------------------------------
  const of = { x: -7.4, z: 7.0, w: 4.0, d: 3.4, h: 2.9 };
  g.add(place(box(of.w, of.h, of.d, surface('planks', PALETTE.cream, { size: 2 })), { x: of.x, y: y0, z: of.z }));
  g.add(place(gableRoof({ w: of.w, d: of.d, h: 1.3, overhang: 0.3, ridge: 'x', material: tin, gableMaterial: surface('planks', PALETTE.cream, { size: 2 }) }), { x: of.x, y: y0 + of.h, z: of.z }));
  // false front with sign
  g.add(place(box(of.w + 0.2, 1.4, 0.15, planks), { x: of.x, y: y0 + of.h, z: of.z + of.d / 2 + 0.08 }));
  g.add(place(bigSign({ text: 'ASSAY OFFICE', w: 3.6, h: 0.75, bg: PALETTE.navy, fg: '#ffffff' }), { x: of.x, y: y0 + of.h + 0.3, z: of.z + of.d / 2 + 0.16 }));
  g.add(place(door({ w: 1.0, h: 2.1, color: PALETTE.green }), { x: of.x - 0.6, y: y0, z: of.z + of.d / 2 }));
  g.add(place(box(0.9, 0.9, 0.08, winM), { x: of.x + 0.9, y: y0 + 1.1, z: of.z + of.d / 2 + 0.02 }));
  g.add(place(box(0.08, 0.9, 0.9, winM), { x: of.x + of.w / 2 + 0.02, y: y0 + 1.1, z: of.z }));
  // porch boards + gold stacked outside
  g.add(place(box(of.w + 0.4, 0.15, 1.2, planks), { x: of.x, y: y0, z: of.z + of.d / 2 + 0.6 }));
  g.add(place(goldStack(), { x: -4.4, y: y0, z: 8.8 }));
  g.add(place(barrel(), { x: -9.3, y: y0, z: 9.3 }));
  g.add(place(barrel({ color: PALETTE.woodDark }), { x: -8.6, y: y0, z: 9.5 }));
  g.add(place(barrel(), { x: 1.5, y: y0, z: 5.2 }));
  g.add(place(box(0.8, 0.6, 0.6, woodLight), { x: 2.4, y: y0, z: 5.6, ry: 15 }));

  // ground spur into the battery house with a cart of concentrate
  g.add(place(track({ length: 2.4 - -2.0 }), { x: -2.0, y: y0, z: 2.2 }));
  g.add(place(box(0.1, 2.3, 1.4, dark), { x: 2.36, y: y0 + 0.1, z: 2.2 }));
  g.add(place(oreCart({ seed: 5, color: PALETTE.rust }), { x: 0.4, y: y0 + 0.1, z: 2.2 }));
  g.add(place(box(0.3, 0.6, 1.6, wood), { x: -2.1, y: y0, z: 2.2 }));

  // lamp posts
  for (const [x, z] of [[0.6, 9.4], [-3.2, 4.6]]) {
    g.add(place(box(0.14, 3.0, 0.14, wood), { x, y: y0, z }));
    g.add(place(box(0.3, 0.35, 0.3, emissive('#ffcf6a', 0.8)), { x, y: y0 + 3.0, z }));
  }
  return g;
}

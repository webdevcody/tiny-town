import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, dome, place, mat, surface, canvasTexture,
  tree, bench, streetLamp, door, hedge,
} from '../../src/lib/index.js';
import {
  STONE, STONE_DARK, stoneMat, trimMat, leadMat,
  arcade, archPanel, halfDome, smallDome, finial, minaret, fountain,
  wallMaterial, drumMaterial, plaque,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Back: prayer hall with central dome, east/west half-domes and corner turrets.
// Front: arcaded courtyard (domed bays) with an ablution fountain and a tall portal.
// Two pencil minarets stand where the hall meets the courtyard.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 2], 'grass'));

  const sm = stoneMat(), tm = trimMat();
  const roofMat = mat('#d9d2c0');

  // ---- prayer hall --------------------------------------------------------
  const HZ = -5.4, HW = 12, HD = 8, HH = 6;
  const plinth = 0.3;
  g.add(place(box(HW + 0.8, plinth, HD + 0.8, tm), { y: y0, z: HZ }));
  const hallWall = wallMaterial(2, HH);
  g.add(place(box(HW, HH, HD, [hallWall, hallWall, roofMat, roofMat, hallWall, hallWall]), { y: y0 + plinth, z: HZ }));
  const roofY = y0 + plinth + HH;
  g.add(place(box(HW + 0.3, 0.25, HD + 0.3, tm), { y: roofY - 0.2, z: HZ }));

  // central drum + dome
  const DR = 3.4, DH = 1.6;
  g.add(place(cylinder(DR, DR, DH, drumMaterial(DR, DH, 20), 20), { y: roofY, z: HZ }));
  g.add(place(cylinder(DR + 0.2, DR + 0.2, 0.18, tm, 20), { y: roofY + DH, z: HZ }));
  g.add(place(dome({ radius: DR + 0.15, height: 3.5, material: leadMat(), segments: 24 }), { y: roofY + DH + 0.18, z: HZ }));
  g.add(place(finial(1.6, 1.4), { y: roofY + DH + 0.18 + 3.45, z: HZ }));

  // half-domes buttressing the central dome east and west
  g.add(place(halfDome({ radius: 2.85, base: 0.9 }), { x: 3.0, y: roofY, z: HZ }));
  g.add(place(halfDome({ radius: 2.85, base: 0.9 }), { x: -3.0, y: roofY, z: HZ, ry: 180 }));

  // weight turrets at the corners of the dome base
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const t = place(new THREE.Group(), { x: sx * 3.5, y: roofY, z: HZ + sz * 3.4 });
    t.add(cylinder(0.42, 0.42, 2.4, sm, 8));
    t.add(place(cylinder(0.5, 0.5, 0.12, tm, 8), { y: 2.4 }));
    t.add(place(cone(0.48, 1.2, leadMat(), 8), { y: 2.52 }));
    t.add(place(finial(0.4, 0.45), { y: 3.6 }));
    g.add(t);
    // small corner domes over the side aisles
    g.add(place(smallDome(0.85), { x: sx * 5.0, y: roofY, z: HZ + sz * 3.05 }));
  }

  // hall entrance under the portico
  g.add(place(archPanel(2.4, 3.3, 0.1, tm), { y: y0 + plinth, z: HZ + HD / 2 }));
  g.add(place(archPanel(1.9, 3.0, 0.14, mat('#9a8b6c')), { y: y0 + plinth, z: HZ + HD / 2 }));
  g.add(place(door({ w: 1.5, h: 2.6, color: PALETTE.woodDark, frame: STONE_DARK }), { y: y0 + plinth, z: HZ + HD / 2 + 0.1 }));

  // ---- courtyard ----------------------------------------------------------
  const marble = surface('paving', '#e3ddcf', { size: 2 });
  g.add(place(patch(14, 10, marble), { y: y0, z: 3.6 }));
  const yc = y0 + 0.05;

  // portico (north row, taller) in front of the hall
  const PH = 4.4;
  g.add(place(arcade({ bays: 7, h: PH, material: sm }), { y: yc, z: 0.6 - 0.18 }));
  const endWall = wallMaterial(2, PH, { lower: false });
  for (const sx of [-1, 1]) g.add(place(box(0.36, PH, 2.0, endWall), { x: sx * 6.82, y: yc, z: -0.4 }));
  g.add(place(box(14.3, 0.3, 2.3, [tm, tm, roofMat, tm, tm, tm]), { y: yc + PH, z: -0.4 }));
  for (let i = 0; i < 7; i++) g.add(place(smallDome(0.76), { x: -6 + 2 * i, y: yc + PH + 0.3, z: -0.4 }));

  // east / west arcades
  const AH = 3.4;
  const sideWall = wallMaterial(2, AH, { lower: false });
  for (const sx of [-1, 1]) {
    g.add(place(arcade({ bays: 3, h: AH, material: sm }), { x: sx * (5 + 0.18), y: yc, z: 3.6, ry: 90 }));
    g.add(place(box(0.4, AH, 8.0, sideWall), { x: sx * 6.8, y: yc, z: 4.6 }));
    g.add(place(box(2.3, 0.3, 8.3, [tm, tm, roofMat, tm, tm, tm]), { x: sx * 6, y: yc + AH, z: 4.6 }));
    for (let i = 0; i < 4; i++) g.add(place(smallDome(0.74), { x: sx * 6, y: yc + AH + 0.3, z: 1.6 + 2 * i }));
  }

  // south arcade + outer wall either side of the portal
  g.add(place(arcade({ bays: 5, h: AH, material: sm }), { y: yc, z: 6.6 + 0.18 }));
  for (const sx of [-1, 1]) g.add(place(box(5.6, AH, 0.4, sideWall), { x: sx * 4.2, y: yc, z: 8.4 }));
  g.add(place(box(10, 0.3, 2.3, [tm, tm, roofMat, tm, tm, tm]), { y: yc + AH, z: 7.6 }));
  for (const x of [-4, -2, 2, 4]) g.add(place(smallDome(0.74), { x, y: yc + AH + 0.3, z: 7.6 }));

  // monumental portal on the street side
  const PW = 3.0, PT = 6.0, PZ0 = 6.5, PZ1 = 9.1;
  const portalWall = wallMaterial(PW, PT, { lower: false });
  g.add(place(box(PW, PT, PZ1 - PZ0, [portalWall, portalWall, roofMat, tm, sm, sm]), { y: yc, z: (PZ0 + PZ1) / 2 }));
  g.add(place(box(PW + 0.3, 0.25, PZ1 - PZ0 + 0.3, tm), { y: yc + PT - 0.1, z: (PZ0 + PZ1) / 2 }));
  for (let i = 0; i < 6; i++) g.add(place(box(0.22, 0.35, 0.22, tm), { x: -1.25 + i * 0.5, y: yc + PT + 0.15, z: PZ1 - 0.05 }));
  for (const zz of [PZ1, PZ0]) {
    const ry = zz === PZ1 ? 0 : 180;
    g.add(place(archPanel(2.3, 3.6, 0.08, tm), { y: yc, z: zz, ry }));
    g.add(place(archPanel(1.85, 3.4, 0.12, mat('#9a8b6c')), { y: yc, z: zz, ry }));
  }
  g.add(place(door({ w: 1.3, h: 2.4, color: PALETTE.woodDark, frame: STONE_DARK }), { y: yc, z: PZ1 + 0.1 }));
  g.add(place(plaque(calligraphy(), 2.3, 0.6), { y: yc + 4.75, z: PZ1 + 0.02 }));
  g.add(place(box(3.4, 0.15, 0.8, tm), { y: y0, z: PZ1 + 0.4 }));

  // ablution fountain in the middle of the courtyard
  g.add(place(fountain(), { y: yc, z: 3.6 }));
  for (const sx of [-1, 1]) for (const z of [1.5, 5.7]) {
    g.add(place(cylinder(0.5, 0.55, 0.4, tm, 8), { x: sx * 3.9, y: yc, z }));
    g.add(place(tree({ kind: 'round', h: 2.2, seed: 12 + z + sx, color: PALETTE.foliage }), { x: sx * 3.9, y: yc + 0.35, z }));
  }

  // ---- minarets -----------------------------------------------------------
  for (const sx of [-1, 1]) g.add(place(minaret(), { x: sx * 7.95, y: y0, z: -1.4 }));

  // ---- grounds ------------------------------------------------------------
  g.add(place(patch(20, 1.0, 'paved'), { y: y0, z: 9.5 }));
  g.add(place(patch(4.6, 0.9, 'paved'), { y: y0, z: 9.1 }));
  for (const sx of [-1, 1]) {
    g.add(place(streetLamp({ h: 4 }), { x: sx * 4.2, y: y0, z: 9.55, ry: sx > 0 ? 180 : 0 }));
    // cypresses along the hall
    for (const [z, h, seed] of [[-4.2, 6.5, 3], [-6.8, 7, 4], [-9.2, 6, 5]]) {
      g.add(place(tree({ kind: 'poplar', h, seed, color: PALETTE.foliageDark }), { x: sx * 8.6, y: y0, z }));
    }
    // garden beside the courtyard
    g.add(place(hedge({ w: 2.6, h: 0.7, d: 0.5 }), { x: sx * 8.6, y: y0, z: 8.7 }));
    g.add(place(tree({ kind: 'round', h: 5, seed: 7 + sx }), { x: sx * 8.5, y: y0, z: 5.6 }));
    g.add(place(tree({ kind: 'bush', h: 1.2, seed: 9 + sx }), { x: sx * 8.9, y: y0, z: 2.7 }));
    g.add(place(bench({ w: 1.5 }), { x: sx * 7.6, y: y0, z: 3.4, ry: sx * -90 }));
  }
  return g;
}

/** Green panel with gold pseudo-calligraphy for over the portal arch. */
function calligraphy() {
  return canvasTexture(256, 64, (ctx, W, H) => {
    ctx.fillStyle = '#1f6b4a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#e2bf4c';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    // flowing baseline with risers and loops
    ctx.moveTo(22, 44);
    for (let x = 22; x <= W - 22; x += 2) ctx.lineTo(x, 44 + Math.sin(x * 0.09) * 3);
    ctx.stroke();
    for (let i = 0; i < 9; i++) {
      const x = 30 + i * 24;
      ctx.beginPath();
      ctx.moveTo(x, 44);
      ctx.lineTo(x + 2, 16 + (i % 3) * 4);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 12, 36, 5, 0, Math.PI * 1.6);
      ctx.stroke();
    }
  }, { key: 'domed-mosque:calligraphy', repeat: false });
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, parapet, rooftopUnits, antenna,
  sign, tree, hedge, flag, streetLamp, bench, car, columns, door,
  mat, metal, glass, emissive, textured, canvasTexture,
} from '../../src/lib/index.js';

const RED = '#c8262c';
const SLAB_WALL = '#7d8fa3';  // grey-blue spandrels
const SLAB_GLASS = '#5d7792';

// The company mark: a white ring with a stylised "T" made of three stacked bars.
function drawMark(ctx, cx, cy, r) {
  ctx.strokeStyle = '#ffffff';
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(cx - r * 0.5, cy - r * 0.42, r, r * 0.22);
  ctx.fillRect(cx - r * 0.11, cy - r * 0.42, r * 0.22, r * 0.9);
}

// Long crown face: mark + company name.
function logoTexture() {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#9e1b20';
    ctx.fillRect(0, H - 10, W, 10);
    ctx.fillRect(0, 0, W, 6);
    drawMark(ctx, H * 0.62, H / 2, H * 0.36);
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(H * 0.5)}px sans-serif`;
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    ctx.fillText('TINYCORP', H * 1.18, H / 2 + 3);
  }, { key: 'corporate-hq:logo', repeat: false });
}

// Short crown face / monument: mark only.
function markTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = RED;
    ctx.fillRect(0, 0, W, H);
    drawMark(ctx, W / 2, H / 2, W * 0.36);
  }, { key: 'corporate-hq:mark', repeat: false });
}

// Box whose faces each map the full 0..1 texture (lib boxes use metre UVs).
// mats: { sides, top, bottom, front, back, left, right }
function decalBox(w, h, d, { sides, top, bottom, front, back, left, right }) {
  const geom = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const m = (x) => x ?? sides;
  return new THREE.Mesh(geom, [m(right), m(left), m(top), m(bottom ?? top), m(front), m(back)]);
}

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'paved'));

  const logo = textured(logoTexture(), { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: logoTexture() });
  const mark = textured(markTexture(), { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: markTexture() });
  const red = mat(RED);
  const stoneDark = mat(PALETTE.stoneDark);
  const steelM = metal(PALETTE.steelLight, { roughness: 0.35 });

  // ---- podium: 2 tall storeys, wide and shallow -------------------------
  const podW = 18, podD = 12, podZ = -2.5, podFH = 4, podH = 2 * podFH;
  const podFront = podZ + podD / 2;
  g.add(place(facadeBlock({ w: podW, d: podD, floors: 2, floorHeight: podFH, style: 'grid', wall: PALETTE.stone, glass: PALETTE.glassDark, frame: PALETTE.steelLight, bay: 3, lit: 0.3, seed: 31, roof: PALETTE.concreteDark }), { y: y0, z: podZ }));
  // glazed double-height lobby across the middle of the front
  g.add(place(box(8, podH - 0.6, 0.3, glass(PALETTE.glassSky)), { y: y0, z: podFront + 0.05 }));
  for (let i = 0; i <= 5; i++) g.add(place(box(0.14, podH - 0.6, 0.4, steelM), { x: -4 + i * 1.6, y: y0, z: podFront + 0.1 }));
  g.add(place(box(8, 0.14, 0.4, steelM), { y: y0 + podFH, z: podFront + 0.1 }));
  g.add(place(box(8.4, 0.6, 0.5, mat(PALETTE.stone)), { y: y0 + podH - 0.6, z: podFront + 0.05 }));
  g.add(place(door({ w: 2.2, h: 2.6, color: PALETTE.glassDark }), { y: y0, z: podFront + 0.2 }));
  // cantilevered entrance canopy with red fascia
  g.add(place(box(9, 0.35, 3, steelM), { y: y0 + 3.4, z: podFront + 1.5 }));
  g.add(place(box(9, 0.45, 0.12, red), { y: y0 + 3.35, z: podFront + 3.02 }));
  g.add(place(columns({ count: 2, length: 8, radius: 0.15, h: 3.4, material: steelM }), { y: y0, z: podFront + 2.6 }));
  // podium parapet: stone with a glass balustrade
  g.add(place(parapet({ w: podW, d: podD, h: 0.5, material: stoneDark }), { y: y0 + podH, z: podZ }));
  g.add(place(parapet({ w: podW - 0.1, d: podD - 0.1, h: 0.7, t: 0.06, material: glass(PALETTE.glassSky, { opacity: 0.5 }) }), { y: y0 + podH + 0.5, z: podZ }));

  // ---- slab tower -------------------------------------------------------
  const slabW = 15.6, slabD = 6, slabZ = -3.8, slabFloors = 13;
  const slabY = y0 + podH;
  const slabTop = slabY + slabFloors * FLOOR;
  g.add(place(facadeBlock({ w: slabW, d: slabD, floors: slabFloors, style: 'ribbon', wall: SLAB_WALL, glass: SLAB_GLASS, frame: PALETTE.steelLight, bay: 2, lit: 0.04, seed: 32, roof: PALETTE.concreteDark }), { y: slabY, z: slabZ }));
  // concrete service cores at both ends, a little proud and taller
  const coreM = mat('#8e99a5');
  for (const sx of [-1, 1]) {
    g.add(place(box(1.2, slabFloors * FLOOR + 1.2, 3.4, coreM), { x: sx * (slabW / 2 + 0.4), y: slabY, z: slabZ }));
    // thin vertical slot of glass up each core
    g.add(place(box(0.4, slabFloors * FLOOR - 2, 0.1, mat(PALETTE.glassDark)), { x: sx * (slabW / 2 + 1.01), y: slabY + 1, z: slabZ, ry: 90 }));
  }
  // horizontal mullion fins every 4 floors to read as a slab
  for (let f = 4; f < slabFloors; f += 4) {
    g.add(place(box(slabW + 0.1, 0.25, slabD + 0.3, mat(PALETTE.steelLight)), { y: slabY + f * FLOOR - 0.12, z: slabZ }));
  }

  // ---- red logo crown ---------------------------------------------------
  const crownW = slabW + 2.0, crownD = slabD + 0.8, crownH = 3.6;
  const crownY = slabTop + 1.2;
  g.add(place(box(slabW + 1.8, 0.4, slabD + 0.6, mat(PALETTE.concreteDark)), { y: slabTop + 0.8, z: slabZ }));
  g.add(place(decalBox(crownW, crownH, crownD, { left: mark, right: mark, front: logo, back: logo, top: mat(PALETTE.roofGrey), bottom: red }), { y: crownY, z: slabZ }));
  // white trim lines above and below the sign
  g.add(place(parapet({ w: crownW + 0.2, d: crownD + 0.2, h: 0.35, t: 0.25, material: mat(PALETTE.white) }), { y: crownY + crownH, z: slabZ }));
  g.add(place(box(crownW + 0.2, 0.2, crownD + 0.2, mat(PALETTE.white)), { y: crownY - 0.2, z: slabZ }));
  const crownTop = crownY + crownH;
  g.add(place(rooftopUnits({ w: 9, d: 4.5, count: 4, seed: 33 }), { y: crownTop, z: slabZ }));
  g.add(place(antenna({ h: 8, radius: 0.2 }), { x: 5.5, y: crownTop, z: slabZ - 1 }));
  g.add(place(antenna({ h: 5, radius: 0.15 }), { x: -6, y: crownTop, z: slabZ + 1.5 }));
  // window-cleaning gantry rail
  g.add(place(box(12, 0.3, 0.3, metal(PALETTE.steelDark)), { y: crownTop + 0.3, z: slabZ + crownD / 2 - 0.4 }));

  // ---- roof garden on the podium ----------------------------------------
  const gy = y0 + podH;
  // front terrace strip (between slab and podium edge)
  const frontZ0 = slabZ + slabD / 2, frontZ1 = podFront - 0.4;
  const fzc = (frontZ0 + frontZ1) / 2, fd = frontZ1 - frontZ0;
  g.add(place(patch(podW - 0.8, fd, 'grass'), { y: gy, z: fzc }));
  g.add(place(patch(podW - 0.8, 0.9, 'paved'), { y: gy + 0.01, z: fzc }));
  for (const x of [-7, -2.5, 2.5, 7]) g.add(place(tree({ kind: 'round', h: 3.2, seed: 40 + x }), { x, y: gy, z: fzc + 0.9 }));
  for (const x of [-4.8, 0, 4.8]) g.add(place(tree({ kind: 'bush', h: 1.1, seed: 50 + x }), { x, y: gy, z: fzc + 1.2 }));
  g.add(place(bench({ w: 1.4 }), { x: -4.8, y: gy, z: fzc - 0.9, ry: 0 }));
  g.add(place(bench({ w: 1.4 }), { x: 4.8, y: gy, z: fzc - 0.9, ry: 0 }));
  // side and back terraces
  for (const sx of [-1, 1]) {
    const x0 = slabW / 2 + 0.1, x1 = podW / 2 - 0.4;
    g.add(place(patch(x1 - x0, slabD + 2, 'grass'), { x: sx * (x0 + x1) / 2, y: gy, z: slabZ - 1 }));
    g.add(place(tree({ kind: 'cone', h: 2.6, seed: 60 + sx }), { x: sx * (x0 + x1) / 2, y: gy, z: slabZ - 2.6 }));
    g.add(place(tree({ kind: 'bush', h: 1, seed: 62 + sx }), { x: sx * (x0 + x1) / 2, y: gy, z: slabZ + 2.4 }));
  }
  const backZ = (podZ - podD / 2 + 0.4 + slabZ - slabD / 2) / 2;
  g.add(place(hedge({ w: slabW - 1, h: 0.7, d: 0.8 }), { y: gy, z: backZ }));
  // pergola over the front terrace benches
  const pergolaM = mat(PALETTE.woodDark);
  for (const sx of [-1, 1]) {
    for (const px of [-1.4, 1.4]) g.add(place(box(0.15, 2.3, 0.15, pergolaM), { x: sx * 4.8 + px, y: gy, z: fzc - 1.5 }));
    for (let i = 0; i < 5; i++) g.add(place(box(0.1, 0.12, 1.4, pergolaM), { x: sx * 4.8 - 1.4 + i * 0.7, y: gy + 2.3, z: fzc - 1.0 }));
  }

  // ---- entrance plaza ---------------------------------------------------
  const plazaZ0 = podFront, plazaZ1 = 10;
  g.add(place(patch(podW + 2, plazaZ1 - plazaZ0, 'cobbles'), { y: y0, z: (plazaZ0 + plazaZ1) / 2 }));
  // drop-off lane with a taxi
  g.add(place(patch(20, 2.6, 'asphalt'), { y: y0 + 0.01, z: 8.6 }));
  g.add(place(car({ kind: 'taxi' }), { x: -2.5, y: y0 + 0.06, z: 8.6, s: 0.8 }));
  g.add(place(car({ color: PALETTE.black }), { x: 5.5, y: y0 + 0.06, z: 8.6, s: 0.8 }));
  // logo monument sign
  g.add(place(box(3.2, 0.4, 0.9, stoneDark), { x: -6.6, y: y0, z: 6.6 }));
  g.add(place(decalBox(2.8, 1.6, 0.5, { sides: red, front: logo, back: logo }), { x: -6.6, y: y0 + 0.4, z: 6.6 }));
  // three flag poles
  for (const [i, x] of [4.8, 6.3, 7.8].entries()) {
    g.add(place(flag({ h: 6, color: i === 1 ? RED : PALETTE.white, color2: i === 1 ? PALETTE.white : RED }), { x, y: y0, z: 6.6 }));
  }
  // planters with trees at the corners, lamps, bollards
  for (const sx of [-1, 1]) {
    g.add(place(box(1.4, 0.5, 1.4, stoneDark), { x: sx * 8.2, y: y0, z: 4.5 }));
    g.add(place(tree({ kind: 'round', h: 5, seed: 70 + sx }), { x: sx * 8.2, y: y0 + 0.5, z: 4.5 }));
    g.add(place(streetLamp({ h: 4.5 }), { x: sx * 4.2, y: y0, z: 7.1, ry: sx > 0 ? 180 : 0 }));
  }
  for (let i = 0; i < 6; i++) {
    const x = -4.2 + (i % 3) * 0.9 + (i >= 3 ? 7.6 : 0) - (i >= 3 ? 1.8 : 0);
    g.add(place(cylinder(0.12, 0.12, 0.7, metal(PALETTE.steelDark), 6), { x, y: y0, z: 7.25 }));
  }
  // side yards: hedges along the lot edge
  for (const sx of [-1, 1]) {
    g.add(place(hedge({ w: podD - 1, h: 0.9, d: 0.6 }), { x: sx * 9.6, y: y0, z: podZ - 0.5, ry: 90 }));
  }
  g.add(place(hedge({ w: podW, h: 0.9, d: 0.6 }), { y: y0, z: -9.6 }));
  // light the lobby a little
  g.add(place(box(7.6, 0.1, 2, emissive(PALETTE.windowLit, 0.4)), { y: y0 + podFH - 0.2, z: podFront - 1 }));
  return g;
}

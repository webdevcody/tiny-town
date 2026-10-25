import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, place, mat, metal, surface, textured, canvasTexture, shade,
  taperedBlock, facadeBlock, fence, tree, pipeRun, pipe, ShapeBuilder, rng, streetLamp,
} from '../../src/lib/index.js';
import { bulldozer, compactor, binLorry, gull } from './vehicles.js';

// 2x2 tiles (20 x 20 m). Front (street, entrance + weighbridge) faces +z.

const LITTER = ['#f1eee6', '#2f6fbf', '#c8322b', '#e9c31f', '#3a9a4a', '#232326', '#9fb7c9', '#d8c39a', '#e27a1e', '#232326', '#f1eee6'];

// Rubbish texture: brown-grey base strewn with colourful bags, bottles and scraps.
function rubbishMat() {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    const r = rng(77);
    ctx.fillStyle = '#7d6e5a';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = shade('#7d6e5a', r.range(-0.3, 0.2));
      ctx.fillRect(r() * W, r() * H, r.range(6, 18), r.range(6, 18));
    }
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = r.pick(LITTER);
      const s = r.range(3, 9);
      ctx.save();
      ctx.translate(r() * W, r() * H);
      ctx.rotate(r() * Math.PI);
      ctx.fillRect(-s / 2, -s / 3, s, s * r.range(0.4, 0.9));
      ctx.restore();
    }
  }, { key: 'landfill:rubbish' });
  tex.repeat.set(1 / 3, 1 / 3);
  return textured(tex, { roughness: 0.95 });
}

// Sign on a box with 0..1 UVs so the texture fills the whole face (lib sign() shrinks over 1 m).
function bigSign(w, h, tex, back = PALETTE.steelDark) {
  const geo = new THREE.BoxGeometry(w, h, 0.15).translate(0, h / 2, 0);
  const side = mat(back);
  return new THREE.Mesh(geo, [side, side, side, side, textured(tex, { roughness: 0.6 }), side]);
}

function entranceSignTexture() {
  return canvasTexture(512, 160, (ctx, W, H) => {
    ctx.fillStyle = '#1f6b3a';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(8, 8, W - 16, H - 16);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 66px sans-serif';
    ctx.fillText('LANDFILL SITE', W / 2, H * 0.4);
    ctx.fillStyle = '#ffe36a';
    ctx.font = 'bold 28px sans-serif';
    ctx.fillText('TINY TOWN WASTE SERVICES', W / 2, H * 0.77);
  }, { key: 'landfill:entrance-sign', repeat: false });
}

function hutSignTexture() {
  return canvasTexture(256, 56, (ctx, W, H) => {
    ctx.fillStyle = '#e9c31f';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#232326';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('WEIGHBRIDGE', W / 2, H / 2 + 2);
  }, { key: 'landfill:hut-sign', repeat: false });
}

// Wedge ramp along Z: ground at z = +len/2, top (height h) at z = -len/2.
function ramp(w, len, h, topMat, sideMat) {
  const b = new ShapeBuilder();
  const W = w / 2, L = len / 2;
  b.quad([-W, 0, L], [W, 0, L], [W, h, -L], [-W, h, -L], 0);
  b.tri([W, 0, L], [W, 0, -L], [W, h, -L], 1);
  b.tri([-W, 0, -L], [-W, 0, L], [-W, h, -L], 1);
  b.quad([W, 0, -L], [-W, 0, -L], [-W, h, -L], [W, h, -L], 1);
  return new THREE.Mesh(b.build(), [topMat, sideMat]);
}

// Open skip (dumpster) for the public recycling bays, length along X.
function skip(color) {
  const m = mat(color, { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(taperedBlock({ w: 2.2, d: 1.5, h: 1.2, topW: 3.0, topD: 1.6, material: m, topMaterial: mat(shade(color, -0.5)) }));
  g.add(place(box(2.7, 0.06, 1.4, rubbishMat()), { y: 1.0 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const H = TILE; // 20 m lot -> half size 10
  const r = rng(4242);

  g.add(lot([2, 2], 'grass'));

  const grassCap = surface('grass', PALETTE.grass, { size: 4 });
  const grassCap2 = surface('grass', PALETTE.grassLight, { size: 4 });
  const soil = surface('gravel', PALETTE.mud, { size: 3 });
  const rubbish = rubbishMat();
  const gravelM = surface('gravel', PALETTE.gravel, { size: 3 });
  const steelM = metal(PALETTE.steel);

  // ---------------------------------------------------------------- the mound
  const cx = -2.5, cz = -3.3;
  const t1 = 2.0, t2 = 2.1;
  // tier 1: restored, grass-capped
  g.add(place(taperedBlock({ w: 14.8, d: 13, h: t1, topW: 12.2, topD: 10.4, material: grassCap, topMaterial: grassCap2 }), { x: cx, y: y0, z: cz }));
  // tier 2: intermediate soil cover
  g.add(place(taperedBlock({ w: 11.0, d: 9.2, h: t2, topW: 8.6, topD: 6.8, material: soil, topMaterial: rubbish }), { x: cx, y: y0 + t1, z: cz }));
  const topY = y0 + t1 + t2;

  // rubbish heaps on the active tipping cell
  g.add(place(taperedBlock({ w: 4.2, d: 2.6, h: 1.3, topW: 2.4, topD: 1.0, material: rubbish }), { x: -4.4, y: topY, z: -5.4 }));
  g.add(place(taperedBlock({ w: 2.4, d: 2.0, h: 0.9, topW: 1.0, topD: 0.8, material: rubbish }), { x: -1.0, y: topY, z: -5.7, ry: 15 }));

  // loose bin bags + bulky junk on top
  const bagM = [mat(PALETTE.black), mat('#3b3f46'), mat(PALETTE.blue), mat(PALETTE.white)];
  for (let i = 0; i < 26; i++) {
    const x = r.range(-6.4, 1.4), z = r.range(-6.4, -0.2);
    if (Math.hypot(x + 1.2, z + 3.4) < 2.0 || Math.hypot(x + 4.5, z + 1.3) < 2.4) continue;
    const s = r.range(0.25, 0.45);
    const bag = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 0), r.pick(bagM));
    bag.scale.set(1, 0.75, 1);
    bag.position.set(x, topY + s * 0.6, z);
    bag.rotation.set(r() * 3, r() * 3, 0);
    g.add(bag);
  }
  g.add(place(box(0.7, 1.4, 0.7, mat(PALETTE.white)), { x: 0.6, y: topY, z: -1.2, rz: 70 }));
  g.add(place(box(1.9, 0.25, 1.3, mat(PALETTE.plasterBlue)), { x: -0.2, y: topY, z: -0.6, ry: 30 }));
  g.add(place(box(1.6, 0.6, 0.7, mat(PALETTE.brick)), { x: -5.6, y: topY + 0.1, z: -4.0, ry: 50, rz: 12 }));

  // plant on the working face
  g.add(place(bulldozer(), { x: -1.2, y: topY, z: -3.3, ry: 90, s: 0.9 }));
  g.add(place(compactor(), { x: -4.5, y: topY, z: -1.4, ry: -8, s: 0.85 }));

  // mobile litter screens round the back of the cell
  const screen = (w) => fence({ w, d: 0.1, h: 2.4, style: 'wire', color: PALETTE.darkGrey, sides: ['front'] });
  g.add(place(screen(6.5), { x: -3.0, y: topY, z: -6.9 }));
  g.add(place(screen(5.4), { x: -6.6, y: topY, z: -3.6, ry: 90 }));

  // landfill gas vent pipes on the capped bench, with a header main
  const ventM = mat('#2f3a33');
  const capM = mat(PALETTE.orange);
  const vents = [[-7.4, 1.6], [-4.4, 1.6], [-1.4, 1.6], [1.6, 1.6], [-8.3, -1.9], [-8.3, -5.4], [-6.0, -8.2], [-2.6, -8.2], [0.6, -8.2], [3.3, -4.9]];
  for (const [x, z] of vents) {
    g.add(place(cylinder(0.14, 0.14, 1.7, ventM, 8), { x, y: y0 + t1, z }));
    g.add(place(cylinder(0.24, 0.24, 0.18, capM, 8), { x, y: y0 + t1 + 1.7, z }));
    g.add(place(box(0.5, 0.35, 0.5, mat(PALETTE.concrete)), { x, y: y0 + t1, z }));
  }
  const hy = y0 + t1 + 0.2;
  g.add(pipeRun([[-8.3, hy, 1.6], [-8.3, hy, -8.2], [3.2, hy, -8.2], [5.2, y0 + 0.25, -9.0], [6.6, y0 + 0.25, -9.0], [6.6, y0 + 0.25, -8.6]], 0.12, mat(PALETTE.yellow)));

  // haul road ramp up the east flank + landing onto the cell
  const rampX = 4.2, rampLen = 9.2, rampZ = 3.2 - rampLen / 2;
  g.add(place(ramp(2.8, rampLen, t1 + t2, gravelM, soil), { x: rampX, y: y0, z: rampZ }));
  g.add(place(box(4.6, t1 + t2, 2.4, [soil, soil, gravelM, soil, soil, soil]), { x: 3.3, y: y0, z: -7.1 }));
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    const z = 3.0 - t * (rampLen - 0.4), y = y0 + 0.2 + t * (t1 + t2) * ((rampLen - 0.4) / rampLen);
    g.add(place(box(0.14, 0.9, 0.14, mat(PALETTE.white)), { x: rampX + 1.5, y, z }));
    g.add(place(box(0.16, 0.2, 0.16, mat(PALETTE.red)), { x: rampX + 1.5, y: y + 0.9, z }));
  }

  // ------------------------------------------------- east strip: lagoon + gas flare
  // leachate lagoon with black liner
  g.add(place(box(3.8, 0.32, 6.2, mat(PALETTE.black)), { x: 7.8, y: y0, z: -0.6 }));
  g.add(place(box(3.2, 0.3, 5.6, mat('#4f5b30', { roughness: 0.35 })), { x: 7.8, y: y0 + 0.06, z: -0.6 }));
  g.add(pipe([5.9, y0 + 0.3, -2.8], [6.5, y0 + 0.3, -2.0], 0.1, mat(PALETTE.darkGrey)));

  // gas flare compound
  g.add(place(patch(3.8, 4.6, 'concrete'), { x: 7.9, y: y0, z: -7.5 }));
  g.add(place(fence({ w: 3.8, d: 4.6, h: 1.4, style: 'wire', color: PALETTE.steel, sides: ['front', 'left'] }), { x: 7.9, y: y0, z: -7.5 }));
  const flareM = mat(PALETTE.lightGrey);
  g.add(place(cylinder(0.55, 0.65, 5.4, flareM, 12), { x: 8.6, y: y0 + 0.05, z: -8.6 }));
  g.add(place(cylinder(0.58, 0.58, 0.5, mat(PALETTE.darkGrey), 12), { x: 8.6, y: y0 + 5.4, z: -8.6 }));
  g.add(place(cylinder(0.32, 0.4, 0.5, mat(PALETTE.orange, { emissive: PALETTE.orange, emissiveIntensity: 0.9 }), 8), { x: 8.6, y: y0 + 5.9, z: -8.6 }));
  g.add(place(cylinder(0.12, 0.25, 0.5, mat(PALETTE.yellow, { emissive: PALETTE.yellow, emissiveIntensity: 1 }), 8), { x: 8.6, y: y0 + 6.4, z: -8.6 }));
  // gas engine container with exhaust + radiator
  const engM = surface('corrugated', '#3d7a52', { size: 1.2 });
  g.add(place(box(1.8, 2.0, 3.0, [engM, engM, mat('#356b47'), engM, mat('#2f6040'), mat('#2f6040')]), { x: 7.3, y: y0 + 0.05, z: -6.6 }));
  g.add(place(cylinder(0.12, 0.12, 1.4, mat(PALETTE.steelDark), 8), { x: 7.6, y: y0 + 2.05, z: -7.6 }));
  g.add(place(box(1.2, 0.4, 1.2, mat(PALETTE.steelDark)), { x: 7.3, y: y0 + 2.05, z: -5.9 }));
  g.add(pipe([6.6, y0 + 0.25, -8.6], [8.6, y0 + 0.25, -8.6], 0.12, mat(PALETTE.yellow)));

  // ----------------------------------------------------- front yard: entrance
  const roadX = 4.2;
  g.add(place(patch(3.4, 7.0, 'asphalt'), { x: roadX, y: y0, z: 6.5 }));
  g.add(place(patch(3.4, 2.4, 'gravel'), { x: 8.0, y: y0, z: 6.5 }));
  // weighbridge deck with hazard-striped ends
  g.add(place(box(3.0, 0.12, 4.6, surface('corrugated', PALETTE.steel, { size: 0.6, metalness: 0.4 })), { x: roadX, y: y0 + 0.05, z: 7.0 }));
  for (const z of [4.6, 9.4]) g.add(place(box(3.0, 0.13, 0.3, surface('hazard', PALETTE.yellow, { size: 1 })), { x: roadX, y: y0 + 0.05, z }));
  // refuse lorry being weighed on its way in
  g.add(place(binLorry(), { x: roadX, y: y0 + 0.17, z: 6.7, ry: 90, s: 0.88 }));
  // barrier arm before the ramp
  g.add(place(box(0.35, 1.1, 0.35, mat(PALETTE.darkGrey)), { x: 6.2, y: y0, z: 3.9 }));
  g.add(place(box(3.4, 0.12, 0.12, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.8 })), { x: 4.4, y: y0 + 1.0, z: 3.9 }));

  // weighbridge hut (portakabin) with a big window onto the deck
  const hx = 0.6, hz = 7.5, hw = 3.4, hd = 2.6;
  g.add(place(box(hw + 0.2, 0.4, hd + 0.2, mat(PALETTE.concreteDark)), { x: hx, y: y0, z: hz }));
  g.add(place(facadeBlock({ w: hw, d: hd, h: 2.5, floorHeight: 2.5, style: 'punched', wall: PALETTE.plasterBlue, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.6, windowH: 0.45, bay: 1.7, roof: PALETTE.roofGrey }), { x: hx, y: y0 + 0.4, z: hz }));
  g.add(place(box(hw + 0.4, 0.2, hd + 0.4, mat(PALETTE.roofGrey)), { x: hx, y: y0 + 2.9, z: hz }));
  g.add(place(box(0.06, 1.0, 2.0, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 })), { x: hx + hw / 2 + 0.02, y: y0 + 1.6, z: hz }));
  g.add(place(box(0.9, 1.9, 0.06, mat(PALETTE.navy)), { x: hx - 0.8, y: y0 + 0.4, z: hz + hd / 2 + 0.02 }));
  g.add(place(box(1.2, 0.2, 0.8, mat(PALETTE.concrete)), { x: hx - 0.8, y: y0, z: hz + hd / 2 + 0.4 }));
  g.add(place(bigSign(3.0, 0.7, hutSignTexture()), { x: hx, y: y0 + 3.1, z: hz + hd / 2 - 0.1 }));
  g.add(place(cylinder(0.15, 0.15, 0.4, mat(PALETTE.steelLight), 8), { x: hx + 1.2, y: y0 + 3.1, z: hz - 0.6 }));

  // big entrance sign facing the street
  const signX = -6.0, signZ = 8.9;
  for (const dx of [-2.4, 2.4]) g.add(place(box(0.2, 2.6, 0.2, mat(PALETTE.steelDark)), { x: signX + dx, y: y0, z: signZ - 0.12 }));
  g.add(place(bigSign(5.8, 1.8, entranceSignTexture()), { x: signX, y: y0 + 1.1, z: signZ }));

  // public recycling skips by the mound foot
  g.add(place(patch(11.6, 2.8, 'gravel'), { x: -4.0, y: y0, z: 5.0 }));
  g.add(place(skip(PALETTE.green), { x: -8.0, y: y0 + 0.05, z: 5.0 }));
  g.add(place(skip(PALETTE.blue), { x: -4.6, y: y0 + 0.05, z: 5.0 }));
  g.add(place(skip(PALETTE.yellow), { x: -1.3, y: y0 + 0.05, z: 4.9, ry: -6 }));

  // yard lamp
  g.add(place(streetLamp({ h: 4.5 }), { x: 2.4, y: y0, z: 9.3, ry: 0 }));

  // perimeter palisade fence (gap for the entrance)
  const palisade = '#2f5a3a';
  g.add(place(fence({ w: H * 2 - 0.4, d: H * 2 - 0.4, h: 1.8, style: 'wire', color: palisade, sides: ['back', 'left', 'right'] }), { y: y0 }));
  g.add(place(fence({ w: 11.4, d: 0.1, h: 1.8, style: 'wire', color: palisade, sides: ['front'] }), { x: -4.1, y: y0, z: H - 0.2 }));
  g.add(place(fence({ w: 3.2, d: 0.1, h: 1.8, style: 'wire', color: palisade, sides: ['front'] }), { x: 8.2, y: y0, z: H - 0.2 }));
  for (const x of [2.1, 6.4]) g.add(place(box(0.3, 2.2, 0.3, mat(PALETTE.darkGrey)), { x, y: y0, z: H - 0.2 }));

  // screening trees in the corners
  g.add(place(tree({ kind: 'cone', h: 5.5, seed: 11 }), { x: -2.2, y: y0, z: 8.3 }));
  g.add(place(tree({ kind: 'round', h: 5, seed: 12 }), { x: 8.3, y: y0, z: 4.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 13 }), { x: -9.2, y: y0, z: 6.6 }));
  g.add(place(tree({ kind: 'cone', h: 4.5, seed: 14 }), { x: 8.6, y: y0, z: 8.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 15 }), { x: 6.2, y: y0, z: -4.3 }));

  // gulls wheeling over the tipping face, a few scavenging on the rubbish
  const flying = [[-4.5, 8.4, -4.0, 20], [-1.5, 9.6, -2.0, 130], [-3.0, 10.8, -5.6, 250], [0.6, 8.0, -4.8, 300], [-6.0, 9.2, -1.4, 80], [-2.2, 12.0, -3.2, 200], [1.8, 10.4, -1.6, 160], [-5.2, 11.4, -6.2, 340]];
  flying.forEach(([x, y, z, ry], i) => g.add(place(gull({ flap: 0.15 + (i % 3) * 0.2 }), { x, y: y0 + y, z, ry, rz: (i % 2 ? 8 : -8), s: 1.5 })));
  for (const [x, z, ry] of [[-3.6, -3.4, 30], [0.8, -2.0, 160], [-6.2, -3.4, 260], [-2.6, -6.0, 90], [-2.4, -0.4, 200]]) {
    g.add(place(gull({ sitting: true }), { x, y: topY + 0.45, z, ry, s: 1.4 }));
  }
  return g;
}

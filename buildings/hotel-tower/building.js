import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, group, parapet, rooftopUnits, tank,
  canvasTexture, textured, mat, metal, emissive, glass, door, flag, tree, hedge,
  streetLamp, bench, car, signTexture,
} from '../../src/lib/index.js';

// Big lit roof sign: glowing letters ringed with bulbs on a red panel.
function hotelSignTexture() {
  return canvasTexture(512, 160, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.font = 'bold 150px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 18;
    ctx.strokeStyle = '#b3121a';
    ctx.strokeText('HOTEL', W / 2, H / 2 + 8, W - 16);
    ctx.fillStyle = '#ffe873';
    ctx.fillText('HOTEL', W / 2, H / 2 + 8, W - 16);
  }, { key: 'hotel-tower:roof-letters', repeat: false });
}

// Free-standing lit letters (transparent canvas on a thin slab) readable from front and back.
function roofSign(w, h) {
  const tex = hotelSignTexture();
  const face = textured(tex, { transparent: true, alphaTest: 0.4, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.6 });
  const edge = textured(tex, { transparent: true, alphaTest: 2 });
  return signSlab(w, h, 0.06, [edge, edge, edge, edge, face, face]);
}

// Box with plain 0..1 UVs per face (lib box() UVs are in metres, which shrinks a non-repeating texture).
function signSlab(w, h, d, mats) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, mats);
}

// Canopy fascia sign with 0..1 UVs.
function fasciaSign(text, w, h) {
  const tex = signTexture(text, { bg: PALETTE.navy, fg: '#ffd34a', width: 512, height: Math.round(512 * h / w), border: '#ffd34a' });
  const face = textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.2 });
  const side = mat(PALETTE.navy);
  return signSlab(w, h, 0.15, [side, side, side, side, face, side]);
}

// Classical column: square plinth, shaft, capital.
function column(h, m) {
  return group(
    box(0.62, 0.3, 0.62, m),
    place(cylinder(0.22, 0.25, h - 0.6, m, 10), { y: 0.3 }),
    place(box(0.62, 0.3, 0.62, m), { y: h - 0.3 })
  );
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const cream = PALETTE.cream;
  const trim = mat(PALETTE.sandstone);
  const white = mat(PALETTE.white);
  const gold = mat(PALETTE.yellow, { metalness: 0.5, roughness: 0.4 });

  // tower: tall glazed lobby + 14 guest floors
  const tw = 7.0, td = 6.0, tz = -1.6;
  const front = tz + td / 2;
  const lobbyH = 4.2;
  const guestFloors = 14;
  g.add(place(facadeBlock({ w: tw, d: td, h: lobbyH, floorHeight: lobbyH, style: 'shop', wall: PALETTE.sandstone, glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.7, bay: 1.75, seed: 3, roof: PALETTE.concrete }), { y: y0, z: tz }));
  const gy = y0 + lobbyH;
  g.add(place(facadeBlock({ w: tw, d: td, floors: guestFloors, style: 'punched', wall: cream, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.56, bay: 1.75, lit: 0.12, seed: 18, roof: PALETTE.concreteDark }), { y: gy, z: tz }));
  const topY = gy + guestFloors * FLOOR;

  // projecting centre bays front and back (beige, with their own window column)
  for (const sz of [-1, 1]) {
    g.add(place(facadeBlock({ w: 2.2, d: 0.5, floors: guestFloors, style: 'punched', wall: PALETTE.beige, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.55, windowH: 0.6, bay: 1.1, lit: 0.15, seed: 19, roof: PALETTE.sandstone, blank: ['left', 'right'] }), { y: gy, z: tz + sz * (td / 2 + 0.25) }));
  }

  // corner pilasters, belt course over the lobby, bands every 5 floors, cornice
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.45, topY - y0, 0.45, trim), { x: sx * (tw / 2 - 0.1), y: y0, z: tz + sz * (td / 2 - 0.1) }));
  }
  g.add(place(box(tw + 0.4, 0.5, td + 0.4, trim), { y: gy - 0.2, z: tz }));
  for (const f of [5, 10]) g.add(place(box(tw + 0.2, 0.22, td + 0.2, trim), { y: gy + f * FLOOR - 0.11, z: tz }));
  g.add(place(box(tw + 0.6, 0.7, td + 0.6, trim), { y: topY, z: tz }));
  g.add(place(parapet({ w: tw + 0.2, d: td + 0.2, h: 0.6, t: 0.25, material: mat(cream) }), { y: topY + 0.7, z: tz }));

  // roof: lift motor room, water tank, units, the big HOTEL sign on a steel frame
  const ry = topY + 0.7;
  g.add(place(facadeBlock({ w: 3.4, d: 2.4, h: 2.4, floorHeight: 2.4, style: 'plain', wall: cream, roof: PALETTE.concreteDark }), { x: -1.4, y: ry, z: tz - 1.6 }));
  g.add(place(tank({ radius: 0.8, h: 1.4, roof: 'cone', legs: true, legHeight: 1.0 }), { x: 2.0, y: ry, z: tz - 1.8 }));
  g.add(place(rooftopUnits({ w: 3, d: 2, count: 2, seed: 7 }), { x: 1.4, y: ry, z: tz + 0.2 }));
  const steel = metal(PALETTE.steelDark);
  const signW = 7.2, signH = 2.8, signZ = front - 0.9, legH = 1.2;
  for (const x of [-2.6, 0, 2.6]) {
    g.add(place(box(0.18, legH + signH * 0.82, 0.18, steel), { x, y: ry, z: signZ - 0.3 }));
    g.add(place(box(0.14, 0.14, 1.4, steel), { x, y: ry + legH * 0.5, z: signZ - 0.3 }));
  }
  g.add(place(roofSign(signW, signH), { y: ry + legH, z: signZ }));
  g.add(place(box(signW + 0.3, 0.12, 0.6, steel), { y: ry + legH - 0.12, z: signZ }));

  // porte-cochere: columned canopy over the drop-off lane
  const cz0 = front, cz1 = 4.3, cw = 7.0, ch = 3.8;
  const cd = cz1 - cz0, cMid = (cz0 + cz1) / 2;
  for (const x of [-cw / 2 + 0.45, cw / 2 - 0.45]) {
    for (const z of [cz1 - 0.4, cz0 + 1.2]) g.add(place(column(ch, white), { x, y: y0, z }));
  }
  g.add(place(box(cw, 0.35, cd, white), { y: y0 + ch, z: cMid }));
  g.add(place(box(cw + 0.2, 0.45, 0.25, gold), { y: y0 + ch + 0.05, z: cz1 }));
  g.add(place(box(cw - 0.4, 0.4, cd - 0.4, trim), { y: y0 + ch + 0.35, z: cMid - 0.1 }));
  g.add(place(fasciaSign('GRAND HOTEL', 4.4, 0.6), { y: y0 + ch + 0.42, z: cz1 + 0.08 }));
  // underside lights
  for (const x of [-1.6, 0, 1.6]) g.add(place(box(0.5, 0.06, 0.5, emissive(PALETTE.windowLit, 1)), { x, y: y0 + ch - 0.06, z: cMid }));
  // three flags on the canopy
  const flagCols = [[PALETTE.red, PALETTE.white], [PALETTE.blue, PALETTE.white], [PALETTE.green, PALETTE.yellow]];
  flagCols.forEach(([c1, c2], i) => {
    g.add(place(flag({ h: 3.4, color: c1, color2: c2 }), { x: -2.6 + i * 2.1, y: y0 + ch + 0.35, z: cz1 - 0.2 }));
  });

  // drop-off lane, kerb, red carpet, entrance doors
  g.add(place(patch(10, cz1 - cz0 - 0.9, 'asphalt'), { y: y0, z: (cz0 + 0.9 + cz1) / 2 }));
  g.add(place(box(10, 0.04, 0.12, mat(PALETTE.white)), { y: y0 + 0.02, z: cMid + 0.45 }));
  g.add(place(box(cw - 1.6, 0.12, 0.9, mat(PALETTE.concrete)), { y: y0, z: cz0 + 0.45 }));
  g.add(place(box(1.4, 0.14, 0.9, mat('#a3161c')), { y: y0, z: cz0 + 0.45 }));
  g.add(place(door({ w: 1.6, h: 2.6, color: PALETTE.glassDark, frame: PALETTE.yellow }), { y: y0, z: front }));
  g.add(place(car({ kind: 'taxi' }), { x: 0.6, y: y0 + 0.05, z: cMid + 0.6, s: 0.62 }));

  // brass luggage trolley and doorman's podium by the door
  g.add(place(box(0.9, 0.08, 0.5, gold), { x: 1.6, y: y0 + 0.4, z: cz0 + 0.4 }));
  g.add(place(box(0.6, 0.5, 0.35, mat(PALETTE.navy)), { x: 1.5, y: y0 + 0.48, z: cz0 + 0.4 }));
  g.add(place(box(0.06, 1.2, 0.06, gold), { x: 1.15, y: y0, z: cz0 + 0.4 }));
  g.add(place(box(0.06, 1.2, 0.06, gold), { x: 2.05, y: y0, z: cz0 + 0.4 }));
  g.add(place(box(0.5, 1.1, 0.4, mat(PALETTE.woodDark)), { x: -1.5, y: y0, z: cz0 + 0.4 }));

  // front strip: planters with clipped bushes, lamps
  for (const x of [-4.3, 4.3]) {
    g.add(place(box(1.1, 0.5, 0.7, trim), { x, y: y0, z: 4.6 }));
    g.add(place(tree({ kind: 'bush', h: 1.0, seed: 20 + x }), { x, y: y0 + 0.5, z: 4.6 }));
  }
  g.add(place(streetLamp({ h: 4 }), { x: -3.6, y: y0, z: 4.75 }));
  g.add(place(streetLamp({ h: 4 }), { x: 3.6, y: y0, z: 4.75, ry: 180 }));

  // side gardens and back: hedges, trees, benches
  for (const sx of [-1, 1]) {
    const x = sx * 4.35;
    g.add(place(patch(1.3, 6.4, 'grass'), { x, y: y0, z: -1.6 }));
    g.add(place(hedge({ w: 6.0, h: 0.8, d: 0.4 }), { x: sx * 4.75, y: y0, z: -1.6, ry: 90 }));
    g.add(place(tree({ kind: 'poplar', h: 6, seed: 30 + sx }), { x, y: y0, z: 0.2 }));
    g.add(place(tree({ kind: 'cone', h: 3.4, seed: 40 + sx }), { x: sx * 4.25, y: y0, z: -3.5 }));
    g.add(place(bench({ w: 1.2 }), { x: sx * 4.1, y: y0, z: -1.6, ry: sx > 0 ? -90 : 90 }));
  }
  g.add(place(hedge({ w: 9.6, h: 0.8, d: 0.4 }), { y: y0, z: -4.8 }));
  return g;
}

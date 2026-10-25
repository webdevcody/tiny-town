import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, sphere, extrude, place, group, mat, surface, textured, canvasTexture, signTexture,
  gableRoof, shedRoof, pyramidRoof, chimney, columns, fence, stairs, door, windowPanel, flag,
  tree, hedge, bench, antenna, beam,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left half: timber clubhouse with front veranda and a side terrace.
// Right half: putting green with flags, a bunker and a putting golfer.

const ellipse = (cx, cz, rx, rz, n = 28, wobble = 0) =>
  Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2;
    const k = 1 + wobble * Math.sin(a * 3 + 0.7);
    return [cx + Math.cos(a) * rx * k, cz + Math.sin(a) * rz * k];
  });

/** Golf cart, length along X (front = +x), ~2.3 m long. */
function golfCart(color = PALETTE.white, bagColor = PALETTE.navy) {
  const body = mat(color, { roughness: 0.45 });
  const trim = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(place(box(2.3, 0.35, 1.15, body), { y: 0.22 }));
  g.add(place(box(0.55, 0.35, 1.1, body), { x: 0.85, y: 0.57 }));            // front cowl
  g.add(place(box(0.7, 0.15, 1.05, mat(PALETTE.woodDark)), { x: -0.05, y: 0.62 })); // seat
  g.add(place(box(0.15, 0.55, 1.05, mat(PALETTE.woodDark)), { x: -0.45, y: 0.62 })); // seat back
  for (const sx of [-0.55, 0.62]) for (const sz of [-0.5, 0.5]) {
    g.add(place(box(0.06, 1.2, 0.06, trim), { x: sx, y: 0.57, z: sz }));
  }
  g.add(place(box(1.55, 0.08, 1.3, body), { x: 0.05, y: 1.77 }));            // canopy
  g.add(place(box(0.05, 0.55, 1.0, mat(PALETTE.glassSky, { roughness: 0.2 })), { x: 0.64, y: 1.1 })); // windscreen
  // golf bag on the back
  const bag = place(cylinder(0.2, 0.2, 0.9, mat(bagColor), 8), { x: -0.95, y: 0.5, rz: 15 });
  g.add(bag);
  for (const dz of [-0.07, 0.07]) g.add(place(cylinder(0.04, 0.04, 0.25, metal(), 5), { x: -1.1, y: 1.35, z: dz, rz: 15 }));
  const wheelM = mat(PALETTE.black);
  for (const sx of [-0.75, 0.75]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.22, 0.22, 0.18, 10);
    wgeo.rotateX(Math.PI / 2);
    const w = new THREE.Mesh(wgeo, wheelM);
    w.position.set(sx, 0.22, sz * 0.55);
    g.add(w);
  }
  return g;
}

const metal = () => mat(PALETTE.steelLight, { metalness: 0.5, roughness: 0.4 });

/** Hole cup + pin with a small pennant (pennant flies towards +x). */
function pin(color) {
  return group(
    cylinder(0.16, 0.16, 0.02, mat(PALETTE.black), 10),
    cylinder(0.035, 0.035, 2.2, mat(PALETTE.white), 6),
    place(box(0.75, 0.48, 0.03, mat(color)), { x: 0.4, y: 1.68 })
  );
}

/** Small low-poly person. Faces +z. */
function person({ shirt = PALETTE.red, trousers = PALETTE.beige, cap = PALETTE.white } = {}) {
  const skin = mat('#e0b48c');
  return group(
    place(box(0.16, 0.85, 0.2, mat(trousers)), { x: -0.11 }),
    place(box(0.16, 0.85, 0.2, mat(trousers)), { x: 0.11 }),
    place(box(0.5, 0.7, 0.28, mat(shirt)), { y: 0.85 }),
    place(sphere(0.17, skin, 8), { y: 1.62 }),
    place(cylinder(0.18, 0.18, 0.09, mat(cap), 8), { y: 1.72 }),
    place(box(0.2, 0.03, 0.18, mat(cap)), { y: 1.74, z: 0.18 })
  );
}

/** Patio table with a parasol and two chairs. */
function parasolTable(color) {
  const white = mat(PALETTE.white);
  return group(
    cylinder(0.45, 0.45, 0.06, white, 10).translateY(0.72),
    cylinder(0.05, 0.05, 0.75, white, 6),
    cylinder(0.035, 0.035, 2.3, white, 6),
    place(cone(1.15, 0.45, mat(color), 8), { y: 1.95 }),
    place(box(0.42, 0.45, 0.42, mat(PALETTE.woodDark)), { x: -0.75 }),
    place(box(0.42, 0.45, 0.42, mat(PALETTE.woodDark)), { x: 0.75 })
  );
}

/**
 * Sign board with text facing +z. (Own version: box() UVs are in metres, so a
 * clamped sign texture on a box face only shows its top-left corner.)
 */
function textSign({ text, w, h, bg, fg = '#ffffff', border = null, depth = 0.15 }) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }));
  face.position.set(0, h / 2, depth / 2 + 0.01);
  return group(box(w, h, depth, mat(bg)), face);
}

const stripeTex = (a, b) => canvasTexture(64, 64, (ctx, w, h) => {
  ctx.fillStyle = a; ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = b; ctx.fillRect(0, 0, w / 2, h);
}, { key: 'golf-clubhouse:mow:' + a + b });

export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // ------------------------------------------------------------------ clubhouse
  const cx = -5.2, cz = -2.0, cw = 8.6, cd = 4.4;
  const plinthH = 0.45, wallH = 3.2;
  const wallTop = y0 + plinthH + wallH;
  const planks = surface('planks', PALETTE.woodLight, { size: 2 });
  const trimM = mat(PALETTE.white);
  const darkWood = mat(PALETTE.woodDark);
  const front = cz + cd / 2, back = cz - cd / 2, left = cx - cw / 2, right = cx + cw / 2;

  g.add(place(box(cw + 0.2, plinthH, cd + 0.2, surface('cobbles', PALETTE.stone, { size: 2 })), { x: cx, y: y0, z: cz }));
  g.add(place(box(cw, wallH, cd, planks), { x: cx, y: y0 + plinthH, z: cz }));
  // corner trim + eave band
  for (const sx of [left, right]) for (const sz of [back, front]) {
    g.add(place(box(0.22, wallH - 0.5, 0.22, trimM), { x: sx, y: y0 + plinthH, z: sz }));
  }
  g.add(place(box(cw + 0.1, 0.18, cd + 0.1, trimM), { x: cx, y: wallTop - 0.8, z: cz }));

  // windows: tall white-framed panes all round
  const winY = y0 + plinthH + 0.75;
  for (const wx of [-3.4, -1.9, 1.9, 3.4]) {
    g.add(place(windowPanel({ w: 1.0, h: 1.7, frame: PALETTE.white, glassColor: PALETTE.glassDark }), { x: cx + wx, y: winY, z: front }));
  }
  for (const wx of [-3.2, -1.1, 1.1, 3.2]) {
    g.add(place(windowPanel({ w: 1.0, h: 1.4, frame: PALETTE.white }), { x: cx + wx, y: winY + 0.3, z: back, ry: 180 }));
  }
  for (const wz of [-1.0, 1.0]) {
    g.add(place(windowPanel({ w: 1.0, h: 1.4, frame: PALETTE.white }), { x: left, y: winY + 0.3, z: cz + wz, ry: -90 }));
  }
  // right side: French doors onto the terrace
  g.add(place(door({ w: 1.5, h: 2.3, color: PALETTE.glassDark, frame: PALETTE.white }), { x: right, y: y0 + plinthH, z: cz - 0.6, ry: 90 }));
  g.add(place(windowPanel({ w: 1.0, h: 1.7, frame: PALETTE.white, glassColor: PALETTE.glassDark }), { x: right, y: winY, z: cz + 1.4, ry: 90 }));
  // main entrance: double doors
  g.add(place(door({ w: 1.7, h: 2.4, color: PALETTE.roofBrown, frame: PALETTE.white }), { x: cx, y: y0 + plinthH, z: front }));

  // main roof: green shingles, gables in timber
  const roofM = surface('shingles', '#3c7a4c', { size: 2 });
  g.add(place(gableRoof({ w: cw, d: cd, h: 2.5, overhang: 0.45, ridge: 'x', material: roofM, gableMaterial: planks }), { x: cx, y: wallTop, z: cz }));
  // cupola with weathervane on the ridge
  const cupY = wallTop + 2.5 - 0.35;
  g.add(place(box(1.1, 1.1, 1.1, trimM), { x: cx, y: cupY, z: cz }));
  for (const [dx, dz, ry] of [[0, 0.56, 0], [0, -0.56, 180], [0.56, 0, 90], [-0.56, 0, -90]]) {
    g.add(place(box(0.6, 0.6, 0.04, mat(PALETTE.woodDark)), { x: cx + dx, y: cupY + 0.3, z: cz + dz, ry }));
  }
  g.add(place(pyramidRoof({ w: 1.1, d: 1.1, h: 0.9, overhang: 0.15, material: roofM }), { x: cx, y: cupY + 1.1, z: cz }));
  g.add(place(antenna({ h: 1.0, light: false, material: mat(PALETTE.darkGrey) }), { x: cx, y: cupY + 2.0, z: cz }));
  g.add(place(box(0.55, 0.38, 0.04, mat(PALETTE.red)), { x: cx + 0.3, y: cupY + 2.6, z: cz })); // pin-flag weathervane
  // stone chimney
  g.add(place(chimney({ w: 0.8, h: 3.4, material: surface('cobbles', PALETTE.stone, { size: 1.5 }) }), { x: left + 1.3, y: wallTop + 0.3, z: back + 1.0 }));

  // ------------------------------------------------------------------ veranda + terrace
  const deckTop = y0 + plinthH;
  const deckM = surface('planks', PALETTE.wood, { size: 2 });
  const vFront = front + 2.4; // front veranda depth 2.4 m
  const tRight = right + 2.6; // side terrace width
  g.add(place(box(cw + 0.2, plinthH, vFront - front, deckM), { x: cx, y: y0, z: (front + vFront) / 2 }));
  g.add(place(box(tRight - right, plinthH, vFront - back - 0.1, deckM), { x: (right + tRight) / 2, y: y0, z: (back + 0.1 + vFront) / 2 }));
  // veranda roof on white posts
  const vd = vFront - front;
  g.add(place(shedRoof({ w: cw, d: vd, h: 0.6, overhang: 0.15, material: roofM, wallMaterial: trimM }), { x: cx, y: wallTop - 0.75, z: front + vd / 2 }));
  g.add(place(columns({ count: 6, length: cw - 0.3, radius: 0.1, h: wallH - 0.75, square: true, material: trimM }), { x: cx, y: deckTop, z: vFront - 0.15 }));
  // entrance pediment with the club sign
  g.add(place(gableRoof({ w: 3.2, d: vd + 0.1, h: 1.1, overhang: 0.2, ridge: 'z', material: roofM, gableMaterial: trimM }), { x: cx, y: wallTop - 0.75, z: front + vd / 2 + 0.05 }));
  g.add(place(textSign({ text: 'GOLF CLUB', w: 2.4, h: 0.6, bg: '#2f6b40', fg: '#ffffff', border: '#f1eee6' }), { x: cx, y: wallTop - 0.7, z: vFront + 0.25 }));
  // railings (white), gaps for the steps
  const rail = (w, x, z, ry = 0) => g.add(place(fence({ w, d: 0.1, h: 0.85, style: 'picket', color: PALETTE.white, sides: ['front'] }), { x, y: deckTop, z, ry }));
  rail(2.9, left + 1.55, vFront - 0.15);
  rail(2.9, cx + 1.45, vFront - 0.15);
  rail(vd - 0.3, left + 0.1, front + vd / 2, 90);
  rail(vFront - back - 1.6, tRight - 0.1, (back + vFront) / 2 - 0.65, 90);
  rail(tRight - right, (right + tRight) / 2, back + 0.05);
  // front steps + steps down to the green
  g.add(place(stairs({ w: 2.0, h: plinthH, d: 0.9, steps: 3, material: deckM }), { x: cx, y: y0, z: vFront + 0.45, ry: 0 }));
  g.add(place(stairs({ w: 1.4, h: plinthH, d: 0.9, steps: 3, material: deckM }), { x: tRight + 0.45, y: y0, z: vFront - 0.85, ry: 90 }));
  // terrace furniture
  g.add(place(parasolTable(PALETTE.roofGreen), { x: right + 1.3, y: deckTop, z: back + 1.4 }));
  g.add(place(parasolTable(PALETTE.white), { x: right + 1.3, y: deckTop, z: front + 0.6 }));
  // rocking benches on the veranda
  g.add(place(bench({ w: 1.6 }), { x: left + 1.6, y: deckTop, z: front + 0.55 }));
  g.add(place(bench({ w: 1.6 }), { x: cx + 2.4, y: deckTop, z: front + 0.55 }));
  // flower boxes under the back windows
  g.add(place(hedge({ w: cw - 0.6, h: 0.6, d: 0.5, color: PALETTE.foliageDark }), { x: cx, y: y0, z: back - 0.45 }));
  for (const fx of [-3.6, -1.2, 1.2, 3.6]) g.add(place(sphere(0.18, mat(PALETTE.red), 6), { x: cx + fx, y: y0 + 0.55, z: back - 0.55 }));

  // ------------------------------------------------------------------ cart park in front
  const parkZ = 3.95;
  g.add(place(patch(TILE + 1.4, TILE / 2 - vFront - 0.25, 'paved'), { x: cx + 0.6, y: y0, z: (vFront + TILE / 2 - 0.25) / 2 }));
  const cartColors = [PALETTE.white, PALETTE.white, PALETTE.cream, PALETTE.white];
  [left + 0.9, left + 2.4, cx + 2.0, cx + 3.5].forEach((x, i) => {
    g.add(place(golfCart(cartColors[i], [PALETTE.navy, PALETTE.red, PALETTE.black, PALETTE.green][i]), { x, y: y0 + 0.05, z: parkZ, ry: 90, s: 0.9 }));
  });
  // flagpole by the steps
  g.add(place(flag({ h: 6.5, color: PALETTE.roofGreen, color2: PALETTE.white }), { x: left - 0.25, y: y0, z: TILE / 2 - 0.35 }));

  // ------------------------------------------------------------------ putting green
  const gx = 6.0, gz = -0.4;
  g.add(extrude(ellipse(gx, gz, 4.0, 4.3, 32, 0.05), 0.04 + y0, mat(PALETTE.grassDark), textured(stripeTex('#5f9e3a', '#6daf45'), {})));
  const greenTex = stripeTex('#7cc24e', '#8fd25c');
  g.add(extrude(ellipse(gx, gz - 0.1, 3.4, 3.6, 32, 0.06), 0.08 + y0, mat('#6fb848'), textured(greenTex, {})));
  // sand bunker
  g.add(extrude(ellipse(8.5, 3.8, 1.25, 0.8, 16, 0.12), 0.09 + y0, mat(PALETTE.sand), surface('gravel', PALETTE.sand, { size: 2 })));
  g.add(place(box(0.03, 0.03, 1.4, mat(PALETTE.woodDark)), { x: 9.5, y: y0 + 0.12, z: 3.4, ry: 30 })); // rake
  const gTop = y0 + 0.08;
  g.add(place(pin(PALETTE.red), { x: 4.5, y: gTop, z: -2.3 }));
  g.add(place(pin(PALETTE.yellow), { x: 7.6, y: gTop, z: 0.4 }));
  g.add(place(pin(PALETTE.blue), { x: 4.7, y: gTop, z: 1.6 }));
  // golfers + balls
  g.add(place(person({ shirt: PALETTE.red, trousers: PALETTE.beige }), { x: 6.6, y: gTop, z: -0.8, ry: 60 }));
  g.add(beam([6.85, gTop + 0.95, -0.55], [7.15, gTop + 0.05, -0.35], 0.04, mat(PALETTE.steelLight)));
  g.add(place(person({ shirt: PALETTE.plasterBlue, trousers: PALETTE.navy, cap: PALETTE.navy }), { x: 3.4, y: gTop, z: -1.0, ry: 120 }));
  for (const [bx, bz] of [[7.3, -0.15], [5.2, -1.9], [8.0, 1.2]]) g.add(place(sphere(0.09, mat(PALETTE.white), 6), { x: bx, y: gTop, z: bz }));

  // club sign on a stone base at the corner of the cart park
  g.add(place(box(2.9, 0.5, 0.5, surface('cobbles', PALETTE.stone, { size: 1.5 })), { x: 1.0, y: y0, z: 4.6 }));
  g.add(place(textSign({ text: 'GOLF CLUB', w: 2.7, h: 0.8, bg: '#2f6b40', fg: '#ffffff', border: '#f1eee6' }), { x: 1.0, y: y0 + 0.5, z: 4.6 }));
  // cart path from the cart park round the front of the green
  g.add(place(patch(3.0, 1.4, 'paved'), { x: 3.8, y: y0, z: 4.15 }));
  g.add(place(golfCart(PALETTE.white, PALETTE.red), { x: 4.2, y: y0 + 0.05, z: 4.15, ry: 0 }));

  // ------------------------------------------------------------------ trees & greenery
  g.add(place(tree({ kind: 'cone', h: 5, seed: 4 }), { x: 8.7, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'cone', h: 4.6, seed: 7 }), { x: 2.0, y: y0, z: -3.7 }));
  g.add(place(tree({ kind: 'round', h: 3.8, seed: 9 }), { x: 8.9, y: y0, z: -1.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 }), { x: 6.1, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 13 }), { x: 2.3, y: y0, z: 2.6 }));
  g.add(place(bench({ w: 1.4 }), { x: 9.4, y: y0, z: 1.2, ry: -90 }));
  return g;
}

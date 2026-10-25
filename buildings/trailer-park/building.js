import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, sphere, place, group, mat, metal, surface, shade,
  barrelRoof, gableRoof, facadeBlock, door, windowPanel, awning, sign, beam,
  tree, hedge, fence, car, streetLamp,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Two rows of mobile homes either side of a dirt lane that opens onto the street.

/** Wooden picnic table with two benches, length along X. */
function picnicTable(color = PALETTE.wood) {
  const m = mat(color);
  const legs = mat(shade(color, -0.25));
  return group(
    place(box(1.5, 0.07, 0.7, m), { y: 0.72 }),
    place(box(1.5, 0.06, 0.25, m), { y: 0.42, z: 0.62 }),
    place(box(1.5, 0.06, 0.25, m), { y: 0.42, z: -0.62 }),
    place(box(0.08, 0.72, 1.4, legs), { x: -0.55 }),
    place(box(0.08, 0.72, 1.4, legs), { x: 0.55 }),
  );
}

/** Kettle barbecue grill. */
function grill() {
  const m = mat(PALETTE.black, { roughness: 0.5 });
  return group(
    place(box(0.05, 0.6, 0.05, m), { x: -0.15 }),
    place(box(0.05, 0.6, 0.05, m), { x: 0.15 }),
    place(sphere(0.3, m, 8), { y: 0.65 }),
  );
}

/** Plastic lawn chair. */
function lawnChair(color) {
  const m = mat(color, { roughness: 0.5 });
  return group(
    place(box(0.5, 0.06, 0.5, m), { y: 0.4 }),
    place(box(0.5, 0.5, 0.06, m), { y: 0.4, z: -0.24 }),
    place(box(0.06, 0.4, 0.5, m), { x: -0.22 }),
    place(box(0.06, 0.4, 0.5, m), { x: 0.22 }),
  );
}

/** Pink plastic lawn flamingo. */
function flamingo() {
  const pink = mat('#f07aa8', { roughness: 0.4 });
  return group(
    place(box(0.03, 0.5, 0.03, mat(PALETTE.black)), {}),
    place(sphere(0.18, pink, 6), { y: 0.6, s: 1 }),
    place(box(0.05, 0.35, 0.05, pink), { x: 0.12, y: 0.62 }),
    place(sphere(0.08, pink, 6), { x: 0.15, y: 0.98 }),
  );
}

/** Mailbox on a post, opening towards +z. */
function mailbox(color = PALETTE.steelLight) {
  return group(
    place(box(0.1, 1.0, 0.1, mat(PALETTE.woodDark)), {}),
    place(box(0.25, 0.25, 0.45, mat(color, { roughness: 0.4 })), { y: 1.0 }),
    place(box(0.03, 0.2, 0.05, mat(PALETTE.red)), { x: 0.14, y: 1.1, z: -0.1 }),
  );
}

/** Pair of white propane bottles. */
function propane() {
  const m = mat(PALETTE.white, { roughness: 0.4 });
  return group(
    place(cylinder(0.17, 0.17, 0.6, m, 8), { x: -0.2 }),
    place(cylinder(0.17, 0.17, 0.6, m, 8), { x: 0.2 }),
  );
}

/**
 * Single-wide mobile home: length along X, door side faces +z, origin centre base.
 * Two-tone body on a skirt, rounded tin roof, striped awning with posts, hitch.
 */
function mobileHome({ len = 5.6, wid = 2.5, color, trim = PALETTE.white, awningColor, doorX = 0.6, awningW = 3.2, awningD = 1.6, seed = 1, extras = {} }) {
  const g = new THREE.Group();
  const skirtH = 0.5, bodyH = 2.1, roofH = 0.28;
  const top = skirtH + bodyH;
  const body = mat(color, { roughness: 0.55 });
  const trimM = mat(trim, { roughness: 0.55 });
  const tin = metal(PALETTE.aluminium, { roughness: 0.5 });

  // skirt (lattice look) + body: coloured lower half, white upper band, accent stripe
  g.add(place(box(len - 0.3, skirtH, wid - 0.2, surface('planks', shade(color, -0.35), { size: 1 })), {}));
  g.add(place(box(len, bodyH, wid, trimM), { y: skirtH }));
  g.add(place(box(len + 0.04, 1.15, wid + 0.04, body), { y: skirtH }));
  g.add(place(box(len + 0.06, 0.12, wid + 0.06, mat(shade(color, -0.3))), { y: skirtH + 1.5 }));
  g.add(place(barrelRoof({ w: len + 0.1, d: wid + 0.1, h: roofH, axis: 'x', material: tin, endMaterial: trimM }), { y: top }));
  g.add(place(box(len + 0.12, 0.1, wid + 0.12, tin), { y: top - 0.05 }));

  // windows on the long sides and ends
  const winM = { w: 0.9, h: 0.7, frame: PALETTE.white };
  const fz = wid / 2 + 0.02;
  const frontWins = [-len / 2 + 0.9, doorX - 1.3, doorX + 1.2].filter((x) => x > -len / 2 + 0.5 && x < len / 2 - 0.5);
  for (const x of frontWins) g.add(place(windowPanel(winM), { x, y: skirtH + 1.0, z: fz }));
  for (const x of [-len / 2 + 1.0, 0, len / 2 - 1.0]) g.add(place(windowPanel(winM), { x, y: skirtH + 1.0, z: -fz, ry: 180 }));
  g.add(place(windowPanel({ w: 1.2, h: 0.6, frame: PALETTE.white }), { x: len / 2 + 0.02, y: skirtH + 1.1, ry: 90 }));
  g.add(place(windowPanel({ w: 1.2, h: 0.6, frame: PALETTE.white }), { x: -len / 2 - 0.02, y: skirtH + 1.1, ry: -90 }));

  // door + wooden step deck
  g.add(place(door({ w: 0.75, h: 1.8, color: shade(color, -0.2), frame: PALETTE.white }), { x: doorX, y: skirtH, z: wid / 2 }));
  g.add(place(box(1.3, skirtH - 0.05, 0.9, surface('planks', PALETTE.woodLight, { size: 1 })), { x: doorX, z: wid / 2 + 0.45 }));
  g.add(place(box(1.0, 0.22, 0.35, mat(PALETTE.wood)), { x: doorX, z: wid / 2 + 1.05 }));

  // awning with two posts
  const aY = top - 0.1;
  const aX = doorX - 0.2;
  g.add(place(awning({ w: awningW, depth: awningD, drop: 0.25, color: awningColor, color2: PALETTE.white }), { x: aX, y: aY, z: wid / 2 }));
  const postM = metal(PALETTE.aluminium);
  for (const sx of [-1, 1]) g.add(place(box(0.08, aY - 0.55, 0.08, postM), { x: aX + sx * (awningW / 2 - 0.1), z: wid / 2 + awningD - 0.05 }));

  // hitch tongue + propane at the -x end
  const steel = mat(PALETTE.darkGrey);
  g.add(beam([-len / 2, 0.45, 0.6], [-len / 2 - 0.9, 0.35, 0], 0.08, steel));
  g.add(beam([-len / 2, 0.45, -0.6], [-len / 2 - 0.9, 0.35, 0], 0.08, steel));
  g.add(place(box(0.1, 0.35, 0.1, steel), { x: -len / 2 - 0.85 }));
  g.add(place(propane(), { x: -len / 2 - 0.35, rz: 0, ry: 90 }));

  // roof AC unit, optional TV antenna / satellite dish
  g.add(place(box(0.8, 0.35, 0.7, mat(PALETTE.lightGrey)), { x: len / 2 - 1.2, y: top + roofH - 0.05 }));
  g.add(place(box(0.6, 0.04, 0.5, mat(PALETTE.darkGrey)), { x: len / 2 - 1.2, y: top + roofH + 0.3 }));
  if (extras.antenna) {
    const am = metal(PALETTE.steelLight);
    g.add(place(cylinder(0.03, 0.03, 1.3, am, 4), { x: -len / 2 + 1.0, y: top + 0.2 }));
    g.add(place(box(1.0, 0.04, 0.04, am), { x: -len / 2 + 1.0, y: top + 1.3 }));
    g.add(place(box(0.7, 0.04, 0.04, am), { x: -len / 2 + 1.0, y: top + 1.1, ry: 90 }));
  }
  if (extras.dish) {
    const dm = mat(PALETTE.white, { roughness: 0.4 });
    const dish = new THREE.Mesh(new THREE.SphereGeometry(0.35, 10, 4, 0, Math.PI * 2, 0, Math.PI / 3), dm);
    g.add(place(cylinder(0.03, 0.03, 0.5, dm, 4), { x: -len / 2 + 0.8, y: top + 0.1, z: -wid / 2 + 0.5 }));
    g.add(place(dish, { x: -len / 2 + 0.8, y: top + 0.55, z: -wid / 2 + 0.5, rx: 120 }));
  }
  return g;
}

/** Small laundry hut: block with corrugated gable roof, sign, door and vent. Faces +z. */
function laundryHut({ w = 3.6, d = 2.6 }) {
  const g = new THREE.Group();
  const wall = PALETTE.plasterBlue;
  g.add(facadeBlock({ w, d, h: 3.0, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.35, bay: 1.8, seed: 4, blank: ['front'] }));
  g.add(place(gableRoof({ w, d, h: 1.0, overhang: 0.3, ridge: 'x', material: surface('corrugated', PALETTE.roofRed, { size: 1.2 }), gableMaterial: wall }), { y: 3.0 }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.white, frame: PALETTE.navy }), { x: -0.7, z: d / 2 }));
  g.add(place(windowPanel({ w: 1.0, h: 0.8, frame: PALETTE.white }), { x: 0.9, y: 1.0, z: d / 2 }));
  g.add(place(sign({ text: 'LAUNDRY', w: 3.0, h: 0.7, bg: PALETTE.yellow, fg: PALETTE.navy, depth: 0.1 }), { y: 2.2, z: d / 2 + 0.06 }));
  g.add(place(box(1.0, 0.1, 0.5, mat(PALETTE.white)), { x: 0.9, y: 0.75, z: d / 2 + 0.25 })); // folding shelf
  g.add(place(cylinder(0.12, 0.12, 0.9, metal(PALETTE.steelLight), 8), { x: 1.1, y: 3.3, z: -0.5 })); // dryer vent
  g.add(place(cylinder(0.2, 0.2, 0.08, metal(PALETTE.steelDark), 8), { x: 1.1, y: 4.2, z: -0.5 }));
  return g;
}

/** Clothesline between two T-posts along X with coloured washing. */
function clothesline(len = 3.2) {
  const g = new THREE.Group();
  const pm = mat(PALETTE.steelLight);
  for (const sx of [-1, 1]) {
    g.add(place(box(0.08, 1.9, 0.08, pm), { x: sx * len / 2 }));
    g.add(place(box(0.08, 0.08, 0.7, pm), { x: sx * len / 2, y: 1.85 }));
  }
  const line = mat(PALETTE.white);
  for (const z of [-0.25, 0.25]) g.add(place(box(len, 0.02, 0.02, line), { y: 1.88, z }));
  const cols = [PALETTE.red, PALETTE.white, PALETTE.blue, PALETTE.yellow, '#f07aa8', PALETTE.green, PALETTE.orange];
  let x = -len / 2 + 0.4, i = 0;
  while (x < len / 2 - 0.4) {
    const w = 0.4 + (i % 3) * 0.15;
    const h = 0.5 + ((i * 7) % 4) * 0.1;
    const z = i % 2 ? 0.25 : -0.25;
    g.add(place(box(w, h, 0.03, mat(cols[i % cols.length])), { x: x + w / 2, y: 1.88 - h, z }));
    x += w + 0.15;
    i++;
  }
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const HW = TILE; // half width (20 m lot)
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // dirt lane along X, opening onto the street through a driveway
  const laneZ = -0.15, laneD = 1.9;
  g.add(place(patch(2 * HW - 2.4, laneD, 'dirt'), { y: y0, z: laneZ }));
  g.add(place(patch(2.6, 5.0 - laneZ - laneD / 2, 'dirt'), { x: -2.3, y: y0, z: (5.0 + laneZ + laneD / 2) / 2 }));

  // --- back row: three homes facing the lane --------------------------------
  const backZ = -3.45;
  const back = [
    { x: -6.4, color: '#7cc6c0', awningColor: PALETTE.green, doorX: 0.9, extras: { antenna: true } },
    { x: 0.0, color: PALETTE.plasterYellow, awningColor: PALETTE.orange, doorX: -0.8, extras: { dish: true } },
    { x: 6.4, color: '#e79aa8', awningColor: PALETTE.red, doorX: 0.7, extras: {} },
  ];
  for (const [i, t] of back.entries()) {
    g.add(place(patch(5.6, 3.9, 'gravel'), { x: t.x, y: y0, z: backZ + 0.75 }));
    g.add(place(mobileHome({ len: 5.0, wid: 2.3, ...t, awningD: 1.45, awningW: 2.8, seed: i }), { x: t.x + 0.45, y: y0, z: backZ }));
  }
  // back-row yard props
  g.add(place(picnicTable(), { x: -8.4, y: y0, z: -1.35 }));
  g.add(place(grill(), { x: -4.5, y: y0, z: -1.5 }));
  g.add(place(lawnChair(PALETTE.blue), { x: 1.4, y: y0, z: -1.4, ry: 160 }));
  g.add(place(lawnChair(PALETTE.red), { x: 2.2, y: y0, z: -1.4, ry: 200 }));
  g.add(place(picnicTable(PALETTE.woodLight), { x: 4.4, y: y0, z: -1.35 }));
  g.add(place(flamingo(), { x: 9.3, y: y0, z: -1.2 }));
  g.add(place(flamingo(), { x: 9.0, y: y0, z: -1.6, ry: 40 }));

  // --- front row: two homes + laundry hut facing the street ----------------
  const frontZ = 2.35;
  const front = [
    { x: -6.9, color: PALETTE.plasterBlue, awningColor: PALETTE.blue, doorX: 0.5, extras: { dish: true } },
    { x: 2.0, color: '#f2b36b', awningColor: PALETTE.green, doorX: -0.5, extras: { antenna: true } },
  ];
  for (const [i, t] of front.entries()) {
    g.add(place(patch(5.7, 3.6, 'gravel'), { x: t.x, y: y0, z: frontZ + 0.6 }));
    g.add(place(mobileHome({ len: 4.8, wid: 2.3, ...t, awningD: 1.3, awningW: 2.6, seed: 10 + i }), { x: t.x + 0.45, y: y0, z: frontZ }));
  }
  g.add(place(picnicTable(), { x: -8.6, y: y0, z: 4.3 }));
  g.add(place(flamingo(), { x: -4.7, y: y0, z: 4.5, ry: -30 }));
  g.add(place(grill(), { x: 4.3, y: y0, z: 4.4 }));
  g.add(place(lawnChair(PALETTE.yellow), { x: 0.0, y: y0, z: 4.2, ry: 20 }));

  // laundry hut + clothesline
  const hutX = 7.6, hutZ = 1.9;
  g.add(place(patch(4.4, 3.4, 'concrete'), { x: hutX, y: y0, z: hutZ + 0.25 }));
  g.add(place(laundryHut({ w: 3.6, d: 2.6 }), { x: hutX, y: y0 + 0.05, z: hutZ }));
  g.add(place(clothesline(3.4), { x: hutX, y: y0, z: 4.3 }));

  // entrance: sign, mailboxes, parked car, lamp
  g.add(place(group(
    place(box(0.12, 1.5, 0.12, mat(PALETTE.woodDark)), { x: -0.9 }),
    place(box(0.12, 1.5, 0.12, mat(PALETTE.woodDark)), { x: 0.9 }),
    place(sign({ text: 'SUNNY PINES', w: 2.2, h: 0.65, bg: PALETTE.green, fg: '#ffffff', depth: 0.1, double: true, border: PALETTE.yellow }), { y: 1.2 }),
  ), { x: -0.2, y: y0, z: 4.75 }));
  for (const [j, c] of [PALETTE.steelLight, PALETTE.red, PALETTE.steelLight, PALETTE.blue].entries()) {
    g.add(place(mailbox(c), { x: -4.75 + j * 0.3, y: y0, z: 4.55, s: 0.8 }));
  }
  g.add(place(car({ color: PALETTE.red }), { x: -2.3, y: y0 + 0.05, z: 2.3, ry: 90, s: 0.62 }));
  g.add(place(car({ color: PALETTE.steelLight, kind: 'van' }), { x: -1.3, y: y0 + 0.05, z: laneZ, s: 0.62 }));
  g.add(place(streetLamp({ h: 4 }), { x: 4.9, y: y0, z: 0.9, ry: 180 }));

  // greenery: hedge along the back, trees at the corners, bushes
  g.add(place(hedge({ w: 2 * HW - 0.6, h: 0.9, d: 0.5 }), { y: y0, z: -TILE / 2 + 0.3 }));
  g.add(place(fence({ w: 4.2, d: 0.1, h: 0.7, style: 'picket', sides: ['front'] }), { x: -7.0, y: y0, z: TILE / 2 - 0.25 }));
  g.add(place(tree({ kind: 'cone', h: 5.0, seed: 21 }), { x: -8.8, y: y0, z: laneZ }));
  g.add(place(tree({ kind: 'round', h: 4.5, seed: 22 }), { x: 8.6, y: y0, z: laneZ }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 24 }), { x: 3.3, y: y0, z: -4.2 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 25 }), { x: -3.1, y: y0, z: -4.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 26 }), { x: 5.2, y: y0, z: 4.6 }));
  return g;
}

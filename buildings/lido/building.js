import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, parapet, door, awning, flag, box, cylinder, cone, sphere, place, group,
  beam, pipe, pipeRun, lattice, pyramidRoof, gableRoof, tree, fence, hedge, bench,
  mat, metal, water, surface, textured, canvasTexture, signTexture,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Left: entrance pavilion with beach huts and a sunbed lawn behind it.
// Back row: lap pool, diving pool with a concrete diving tower, slide tower.
// Front: sunbed lawn with umbrellas, paddling pool, splash pool where the slides land.

const Y = LOT_HEIGHT;
const DECK = Y + 0.05;
const POOL_TOP = 0.3; // coping height above its base

const SKIN = ['#e8b48a', '#c98d62', '#8d5a3b', '#f1c9a5'];
const SWIM = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green, PALETTE.purple, PALETTE.orange, PALETTE.navy];

/** Pool basin with white coping; water top at 0.22, coping top at 0.3. */
function basin({ w, d, color = PALETTE.pool, coping = PALETTE.white, t = 0.3 }) {
  return group(
    parapet({ w: w + 2 * t, d: d + 2 * t, h: POOL_TOP, t, material: mat(coping) }),
    box(w, 0.22, d, water(color))
  );
}

/** Round paddling pool. */
function roundPool({ r, color = PALETTE.pool }) {
  return group(
    cylinder(r + 0.3, r + 0.3, 0.26, mat(PALETTE.white), 20),
    place(cylinder(r, r, 0.03, water(color), 20), { y: 0.25 })
  );
}

function stripeTexture(c1, c2, n) {
  return canvasTexture(64, 8, (ctx, W, H) => {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? c2 : c1;
      ctx.fillRect((i * W) / n, 0, W / n + 1, H);
    }
  }, { key: `lido:stripes:${c1}:${c2}:${n}`, repeat: false, nearest: true });
}

/** Beach umbrella: pole + 8-panel striped canopy. */
function umbrella({ color, color2 = PALETTE.white, h = 2.2, r = 1.0 }) {
  const canopy = textured(stripeTexture(color, color2, 8), { side: THREE.DoubleSide });
  const geo = new THREE.ConeGeometry(r, 0.45, 8);
  geo.translate(0, 0.225, 0);
  return group(
    cylinder(0.04, 0.04, h, mat(PALETTE.white), 6),
    place(new THREE.Mesh(geo, canopy), { y: h - 0.3 }),
    place(sphere(0.07, mat(color), 6), { y: h + 0.12 })
  );
}

/** Sign board; text on planes with 0..1 UVs (the lib sign() clamps its texture to 1 m). */
function board({ text, w, h, bg, fg = '#ffffff', border = null, depth = 0.15 }) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.round((256 * h) / w) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const g = group(box(w, h, depth, mat(bg)));
  for (const side of [1, -1]) {
    const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), face);
    pl.position.set(0, h / 2, side * (depth / 2 + 0.01));
    if (side < 0) pl.rotation.y = Math.PI;
    g.add(pl);
  }
  return g;
}

/** Smooth tube slide through the points. */
function tubeSlide(points, radius, color) {
  const curve = new THREE.CatmullRomCurve3(points.map((p) => new THREE.Vector3(...p)));
  const geo = new THREE.TubeGeometry(curve, points.length * 6, radius, 10, false);
  return new THREE.Mesh(geo, mat(color, { roughness: 0.35 }));
}

/** Sunbed lying along z, backrest at -z. Optional towel colour and sunbather. */
function sunbed({ towel, person = null }) {
  const frame = mat(PALETTE.white);
  const g = group(
    place(box(0.62, 0.25, 0.1, mat(PALETTE.lightGrey)), { z: 0.75 }),
    place(box(0.62, 0.25, 0.1, mat(PALETTE.lightGrey)), { z: -0.4 }),
    place(box(0.66, 0.08, 1.4, frame), { y: 0.25, z: 0.25 }),
    place(box(0.66, 0.08, 0.7, frame), { y: 0.45, z: -0.68, rx: 38 })
  );
  if (towel) g.add(place(box(0.5, 0.03, 1.2, mat(towel)), { y: 0.33, z: 0.25 }));
  if (person) {
    const skin = mat(person.skin);
    g.add(place(box(0.34, 0.16, 0.7, skin), { y: 0.36, z: 0.4 }));
    g.add(place(box(0.38, 0.18, 0.5, mat(person.suit)), { y: 0.36, z: -0.15 }));
    g.add(place(sphere(0.13, skin, 8), { y: 0.62, z: -0.55 }));
  }
  return g;
}

/** Standing person (~1.75 m), facing +z. */
function person({ skin, suit, shirt = null }) {
  const sk = mat(skin);
  return group(
    place(box(0.14, 0.8, 0.16, sk), { x: -0.1 }),
    place(box(0.14, 0.8, 0.16, sk), { x: 0.1 }),
    place(box(0.38, 0.22, 0.22, mat(suit)), { y: 0.72 }),
    place(box(0.38, 0.45, 0.22, shirt ? mat(shirt) : sk), { y: 0.94 }),
    place(box(0.1, 0.55, 0.12, sk), { x: -0.25, y: 0.82 }),
    place(box(0.1, 0.55, 0.12, sk), { x: 0.25, y: 0.82 }),
    place(sphere(0.14, sk, 8), { y: 1.55 })
  );
}

/** Swimmer: head + shoulders poking out of the water. */
function swimmer({ skin, cap }) {
  return group(
    place(box(0.4, 0.06, 0.2, mat(skin)), { y: 0 }),
    place(sphere(0.13, mat(skin), 8), { y: 0.1 }),
    place(sphere(0.135, mat(cap), 8, ), { y: 0.14 })
  );
}

function ring(color) {
  const geo = new THREE.TorusGeometry(0.38, 0.13, 6, 14);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, textured(stripeTexture(color, PALETTE.white, 8)));
}

/** Pool ladder: two bent chrome rails hooked over the coping, going into the water at -z. */
function ladder() {
  const m = metal(PALETTE.chrome, { roughness: 0.2 });
  const g = new THREE.Group();
  for (const x of [-0.25, 0.25]) g.add(pipeRun([[x, 0.25, 0.3], [x, 0.9, 0.3], [x, 0.9, -0.15], [x, 0.1, -0.35]], 0.035, m));
  return g;
}

/** Tall lifeguard chair facing +z. */
function lifeguardChair() {
  const w = mat(PALETTE.white);
  const g = new THREE.Group();
  for (const sx of [-1, 1]) {
    g.add(beam([sx * 0.4, 0, 0.4], [sx * 0.3, 2.0, 0.1], 0.08, w));
    g.add(beam([sx * 0.4, 0, -0.4], [sx * 0.3, 2.0, -0.3], 0.08, w));
  }
  for (let i = 1; i <= 4; i++) g.add(place(box(0.7, 0.05, 0.08, w), { y: i * 0.42, z: 0.4 - i * 0.07 }));
  g.add(place(box(0.75, 0.08, 0.6, mat(PALETTE.red)), { y: 2.0, z: -0.1 }));
  g.add(place(box(0.75, 0.7, 0.08, mat(PALETTE.red)), { y: 2.0, z: -0.42 }));
  g.add(place(umbrella({ color: PALETTE.red, h: 1.6, r: 0.75 }), { y: 2.0, z: -0.3 }));
  return g;
}

/** Concrete diving tower: platforms at three heights cantilevered to +z, ladder at the back. */
function divingTower() {
  const conc = mat('#e9e4da');
  const blue = mat(PALETTE.blue);
  const rail = metal(PALETTE.chrome, { roughness: 0.25 });
  const g = new THREE.Group();
  // central wall/column
  g.add(place(box(2.6, 5.0, 0.7, conc), { z: 0 }));
  g.add(place(box(2.7, 0.25, 0.8, blue), { y: 5.0 }));
  const platforms = [
    { x: -0.85, y: 1.6, len: 2.2, w: 0.9 },
    { x: 0.85, y: 3.2, len: 2.6, w: 0.9 },
    { x: 0, y: 5.0, len: 3.0, w: 1.2 },
  ];
  for (const p of platforms) {
    g.add(place(box(p.w, 0.22, p.len, conc), { x: p.x, y: p.y, z: p.len / 2 }));
    g.add(place(box(p.w + 0.04, 0.08, p.len + 0.02, blue), { x: p.x, y: p.y - 0.08, z: p.len / 2 }));
    // tapered strut under the cantilever
    g.add(beam([p.x, Math.max(0, p.y - 1.3), 0.35], [p.x, p.y, p.len * 0.6], 0.22, conc));
    for (const sx of [-1, 1]) {
      const rx = p.x + sx * (p.w / 2 - 0.05);
      g.add(pipe([rx, p.y + 0.95, 0.3], [rx, p.y + 0.95, p.len - 0.5], 0.035, rail));
      for (const z of [0.4, p.len - 0.5]) g.add(pipe([rx, p.y + 0.2, z], [rx, p.y + 0.95, z], 0.035, rail));
    }
  }
  // ladder up the back face
  for (const sx of [-0.3, 0.3]) g.add(pipe([sx, 0, -0.42], [sx, 5.9, -0.42], 0.04, rail));
  for (let y = 0.4; y < 5.8; y += 0.4) g.add(pipe([-0.3, y, -0.42], [0.3, y, -0.42], 0.025, rail));
  return g;
}

/** Springboard on a pedestal, board pointing to -z. */
function springboard() {
  return group(
    place(box(0.6, 0.6, 0.6, mat(PALETTE.blue)), { z: 0.3 }),
    place(box(0.5, 0.06, 2.0, mat(PALETTE.white)), { y: 0.62, z: -0.6 })
  );
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  // pale pool deck over the whole pool area
  const deckMat = surface('paving', '#e7dfcf', { size: 3 });
  g.add(place(patch(15.4, 5.9, deckMat), { x: 2.1, y: Y, z: -2.0 }));
  g.add(place(patch(4.6, 4.0, deckMat), { x: 7.6, y: Y, z: 2.95 }));

  // ---- lawns ----
  g.add(place(patch(10.8, 3.75, 'grass'), { x: -0.1, y: Y, z: 2.9 }));
  g.add(place(patch(3.4, 5.6, 'grass'), { x: -7.25, y: Y, z: -2.05 }));

  // ---- lap pool with lane ropes, starting blocks, ladders ----
  const lap = { x: -1.9, z: -2.3, w: 6.2, d: 3.4 };
  g.add(place(basin({ w: lap.w, d: lap.d, color: PALETTE.pool }), { x: lap.x, y: DECK, z: lap.z }));
  const ropeMat = surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.8 });
  for (const dz of [-0.85, 0, 0.85]) {
    g.add(place(box(lap.w, 0.07, 0.07, ropeMat), { x: lap.x, y: DECK + 0.21, z: lap.z + dz }));
  }
  for (const dz of [-1.275, -0.425, 0.425, 1.275]) {
    g.add(place(box(0.45, 0.45, 0.45, mat(PALETTE.white)), { x: lap.x - lap.w / 2 - 0.15, y: DECK + 0.1, z: lap.z + dz }));
    g.add(place(box(0.5, 0.06, 0.5, mat(PALETTE.blue)), { x: lap.x - lap.w / 2 - 0.12, y: DECK + 0.55, z: lap.z + dz }));
  }
  g.add(place(ladder(), { x: lap.x + 2.0, y: DECK, z: lap.z + lap.d / 2 }));
  g.add(place(ladder(), { x: lap.x + lap.w / 2, y: DECK, z: lap.z + 0.9, ry: -90 }));
  // swimmers in the lanes
  [[-3.6, -2.75], [-0.6, -1.9], [0.4, -2.75], [-2.2, -1.45]].forEach(([x, z], i) => {
    g.add(place(swimmer({ skin: SKIN[i % 4], cap: SWIM[(i * 3) % SWIM.length] }), { x, y: DECK + 0.2, z, ry: 90 }));
  });

  // ---- diving pool + tower + springboard ----
  const dive = { x: 3.6, z: -1.8, w: 3.2, d: 3.2 };
  g.add(place(basin({ w: dive.w, d: dive.d, color: '#2f9fcf' }), { x: dive.x, y: DECK, z: dive.z }));
  g.add(place(divingTower(), { x: dive.x, y: DECK, z: -4.5 }));
  g.add(place(springboard(), { x: dive.x + 0.9, y: DECK, z: dive.z + dive.d / 2 + 0.5 }));
  g.add(place(ladder(), { x: dive.x - 0.9, y: DECK, z: dive.z + dive.d / 2 }));
  g.add(place(person({ skin: SKIN[0], suit: PALETTE.red }), { x: dive.x, y: DECK + 5.22, z: -2.0 }));
  g.add(place(person({ skin: SKIN[2], suit: PALETTE.navy }), { x: dive.x + 0.9, y: DECK + 0.66, z: dive.z + dive.d / 2 + 0.5, ry: 180 }));

  // ---- splash pool + slide tower with two tube slides ----
  const splash = { x: 7.7, z: 2.2, w: 3.8, d: 3.0 };
  g.add(place(basin({ w: splash.w, d: splash.d, color: '#5ad8e6' }), { x: splash.x, y: DECK, z: splash.z }));
  const ringCols = [PALETTE.orange, PALETTE.pink ?? PALETTE.red, PALETTE.yellow];
  [[6.6, 2.9], [8.4, 3.0], [7.4, 1.6]].forEach(([x, z], i) => g.add(place(ring(ringCols[i]), { x, y: DECK + 0.22, z })));
  g.add(place(swimmer({ skin: SKIN[3], cap: PALETTE.green }), { x: 6.6, y: DECK + 0.2, z: 2.9 }));
  g.add(place(swimmer({ skin: SKIN[1], cap: PALETTE.yellow }), { x: 8.6, y: DECK + 0.2, z: 2.3 }));

  const tw = { x: 8.95, z: -3.95, s: 1.3, h: 6.0 };
  const towerMat = metal(PALETTE.blue, { roughness: 0.5 });
  g.add(place(lattice({ w: tw.s, h: tw.h, thickness: 0.14, segments: 4, material: towerMat }), { x: tw.x, y: DECK, z: tw.z }));
  g.add(place(box(tw.s + 0.3, 0.15, tw.s + 0.3, mat(PALETTE.lightGrey)), { x: tw.x, y: DECK + tw.h, z: tw.z }));
  g.add(place(box(tw.s, 0.12, tw.s, mat(PALETTE.lightGrey)), { x: tw.x, y: DECK + 4.0, z: tw.z }));
  g.add(place(fence({ w: tw.s + 0.3, d: tw.s + 0.3, h: 0.9, style: 'railing', color: PALETTE.white, sides: ['back', 'right', 'front'] }), { x: tw.x, y: DECK + tw.h + 0.15, z: tw.z }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.1, 2.0, 0.1, mat(PALETTE.white)), { x: tw.x + sx * 0.7, y: DECK + tw.h + 0.15, z: tw.z + sz * 0.7 }));
  }
  g.add(place(pyramidRoof({ w: 1.5, h: 0.9, overhang: 0.25, material: mat(PALETTE.red) }), { x: tw.x, y: DECK + tw.h + 2.15, z: tw.z }));
  g.add(place(flag({ h: 1.4, color: PALETTE.yellow, color2: PALETTE.red }), { x: tw.x, y: DECK + tw.h + 3.0, z: tw.z, ry: 180 }));
  // stair flight up the tower's front face
  for (let i = 0; i < 12; i++) {
    g.add(place(box(0.55, 0.06, 0.25, mat(PALETTE.lightGrey)), { x: tw.x + 0.3, y: DECK + 0.4 + i * 0.47, z: tw.z + tw.s / 2 + 0.15 - (i % 2) * 0.0 }));
  }

  // red helical tube slide
  const hc = { x: 7.3, z: -2.3, r: 1.3 };
  const red = [[tw.x - 0.5, DECK + tw.h + 0.25, tw.z + 0.45]];
  const a0 = Math.atan2(tw.z - hc.z, tw.x - hc.x);
  const a1 = Math.PI / 2 + Math.PI * 2;
  const steps = 30;
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const a = a0 + (a1 - a0) * t;
    red.push([hc.x + hc.r * Math.cos(a), DECK + tw.h - 0.2 - t * (tw.h - 1.6), hc.z + hc.r * Math.sin(a)]);
  }
  red.push([hc.x, DECK + 0.95, hc.z + hc.r + 1.0]);
  red.push([hc.x, DECK + 0.55, splash.z - splash.d / 2 + 0.4]);
  g.add(tubeSlide(red, 0.36, PALETTE.red));
  for (let i = 4; i < red.length - 1; i += 4) {
    const [x, y, z] = red[i];
    g.add(pipe([x, DECK, z], [x, y - 0.3, z], 0.07, metal(PALETTE.steelLight)));
  }

  // yellow wavy slide from the middle platform down the right edge
  const yel = [
    [tw.x + 0.5, DECK + 4.3, tw.z + 0.7],
    [9.45, DECK + 3.7, -2.6],
    [9.45, DECK + 3.0, -1.8],
    [9.45, DECK + 2.8, -1.3],
    [9.45, DECK + 2.0, -0.5],
    [9.45, DECK + 1.8, 0.0],
    [9.2, DECK + 1.05, 0.6],
    [8.9, DECK + 0.55, splash.z - splash.d / 2 + 0.5],
  ];
  g.add(tubeSlide(yel, 0.28, PALETTE.yellow));
  for (const i of [1, 3, 5]) {
    const [x, y, z] = yel[i];
    g.add(pipe([x, DECK, z], [x, y - 0.25, z], 0.06, metal(PALETTE.steelLight)));
  }

  // ---- entrance pavilion ----
  const pv = { x: -7.7, z: 2.3, w: 4.0, d: 3.6 };
  g.add(place(facadeBlock({
    w: pv.w, d: pv.d, floors: 1, style: 'punched', wall: PALETTE.white, frame: PALETTE.blue,
    glass: PALETTE.window, bay: 1.3, windowW: 0.55, windowH: 0.45, roof: PALETTE.concrete, seed: 4,
  }), { x: pv.x, y: Y, z: pv.z }));
  g.add(place(box(pv.w + 0.2, 0.45, pv.d + 0.2, mat(PALETTE.blue)), { x: pv.x, y: Y + FLOOR, z: pv.z }));
  g.add(place(parapet({ w: pv.w + 0.2, d: pv.d + 0.2, h: 0.25, t: 0.2, material: mat(PALETTE.white) }), { x: pv.x, y: Y + FLOOR + 0.45, z: pv.z }));
  g.add(place(box(pv.w + 0.22, 0.12, pv.d + 0.22, mat(PALETTE.lightBlue ?? '#8fd3f2')), { x: pv.x, y: Y + 0.75, z: pv.z }));
  g.add(place(door({ w: 1.6, h: 2.2, color: PALETTE.glassSky, frame: PALETTE.blue }), { x: pv.x, y: Y, z: pv.z + pv.d / 2 }));
  g.add(place(awning({ w: 2.6, depth: 0.9, drop: 0.35, color: PALETTE.blue, color2: PALETTE.white }), { x: pv.x, y: Y + 2.75, z: pv.z + pv.d / 2 }));
  // big LIDO sign on the roof
  for (const sx of [-1, 1]) g.add(place(box(0.12, 0.6, 0.12, metal(PALETTE.steelDark)), { x: pv.x + sx * 1.2, y: Y + FLOOR + 0.45, z: pv.z + pv.d / 2 - 0.3 }));
  g.add(place(board({ text: 'LIDO', w: 3.4, h: 1.1, bg: PALETTE.blue, border: '#ffffff' }), { x: pv.x, y: Y + FLOOR + 0.95, z: pv.z + pv.d / 2 - 0.3 }));
  for (const sx of [-1, 1]) g.add(place(flag({ h: 2.4, color: PALETTE.red, color2: PALETTE.white }), { x: pv.x + sx * (pv.w / 2 - 0.2), y: Y + FLOOR + 0.45, z: pv.z - pv.d / 2 + 0.3 }));
  // forecourt: lamps, bikes rack bench
  for (const sx of [-1, 1]) {
    g.add(place(box(0.6, 0.5, 0.6, mat(PALETTE.terracotta)), { x: pv.x + sx * 1.45, y: Y, z: 4.55 }));
    g.add(place(tree({ kind: 'bush', h: 0.8, seed: 12 + sx }), { x: pv.x + sx * 1.45, y: Y + 0.45, z: 4.55 }));
  }
  g.add(place(board({ text: 'OPEN 10-19', w: 0.9, h: 0.45, bg: PALETTE.yellow, fg: PALETTE.navy }), { x: pv.x + 1.4, y: Y + 1.3, z: pv.z + pv.d / 2 + 0.02 }));
  g.add(place(person({ skin: SKIN[1], suit: PALETTE.navy, shirt: PALETTE.yellow }), { x: pv.x + 0.6, y: Y, z: 4.75, ry: 180 }));

  // ---- beach huts along the left edge, facing +x ----
  const hutCols = [PALETTE.red, PALETTE.yellow, PALETTE.blue, PALETTE.green];
  hutCols.forEach((c, i) => {
    const z = -4.25 + i * 1.25;
    const hut = group(
      box(1.1, 2.0, 1.0, mat(PALETTE.white)),
      place(gableRoof({ w: 1.1, d: 1.0, h: 0.5, overhang: 0.1, ridge: 'x', material: mat(c), gableMaterial: PALETTE.white }), { y: 2.0 }),
      place(box(0.05, 1.7, 0.65, mat(c)), { x: 0.56 }),
    );
    g.add(place(hut, { x: -9.35, y: Y + 0.05, z }));
  });

  // ---- sunbeds + umbrellas ----
  const umbCols = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green, PALETTE.orange];
  const towels = [PALETTE.yellow, PALETTE.red, PALETTE.blue, PALETTE.white, PALETTE.green, PALETTE.purple];
  let n = 0;
  const bedPair = (x, z, ry = 0) => {
    const k = n++;
    const p1 = k % 3 === 0 ? { skin: SKIN[k % 4], suit: SWIM[k % SWIM.length] } : null;
    const p2 = k % 2 === 1 ? { skin: SKIN[(k + 2) % 4], suit: SWIM[(k + 3) % SWIM.length] } : null;
    g.add(place(sunbed({ towel: towels[k % towels.length], person: p1 }), { x: x - 0.45, y: Y + 0.05, z, ry }));
    g.add(place(sunbed({ towel: towels[(k + 2) % towels.length], person: p2 }), { x: x + 0.45, y: Y + 0.05, z, ry }));
    g.add(place(umbrella({ color: umbCols[k % umbCols.length] }), { x, y: Y + 0.05, z: z - 0.9 * (ry ? -1 : 1) }));
  };
  // front lawn
  bedPair(-4.3, 2.6);
  bedPair(-1.9, 2.6);
  bedPair(0.5, 2.6);
  // lawn behind the pavilion
  bedPair(-7.4, -3.0);
  g.add(place(sunbed({ towel: PALETTE.purple, person: { skin: SKIN[3], suit: PALETTE.red } }), { x: -7.0, y: Y + 0.05, z: -0.4, ry: 90 }));

  // paddling pool with a mushroom fountain
  g.add(place(roundPool({ r: 1.15, color: '#6ee0ee' }), { x: 3.1, y: Y + 0.05, z: 2.85 }));
  g.add(place(cylinder(0.08, 0.08, 0.9, mat(PALETTE.white), 8), { x: 3.1, y: Y + 0.25, z: 2.85 }));
  g.add(place(cone(0.6, 0.3, mat(PALETTE.red), 10), { x: 3.1, y: Y + 1.05, z: 2.85 }));
  g.add(place(person({ skin: SKIN[3], suit: PALETTE.yellow }), { x: 2.5, y: Y + 0.25, z: 3.2, ry: 60, s: 0.6 }));

  // lifeguard chair between the lap and diving pools, facing the lap pool
  g.add(place(lifeguardChair(), { x: 1.55, y: DECK, z: 0.35, ry: 200 }));
  g.add(place(person({ skin: SKIN[2], suit: PALETTE.red, shirt: PALETTE.red }), { x: 1.55, y: DECK + 2.05, z: 0.3, ry: 200, s: 0.9 }));
  // people on the deck
  g.add(place(person({ skin: SKIN[0], suit: PALETTE.blue }), { x: -5.4, y: DECK, z: 0.45, ry: 160 }));
  g.add(place(person({ skin: SKIN[2], suit: PALETTE.purple }), { x: 5.6, y: DECK, z: 1.2, ry: -110 }));

  // ---- boundary: railing along the street, hedge, palms ----
  g.add(place(fence({ w: 9.5, d: 0.1, h: 1.0, style: 'railing', color: PALETTE.white, sides: ['front'] }), { x: -0.85, y: Y, z: 4.82 }));
  g.add(place(fence({ w: 5.6, d: 0.1, h: 1.0, style: 'railing', color: PALETTE.white, sides: ['front'] }), { x: 7.1, y: Y, z: 4.82 }));
  g.add(place(hedge({ w: 15.2, h: 0.9, d: 0.4 }), { x: 2.15, y: Y, z: -4.82 }));
  g.add(place(tree({ kind: 'palm', h: 3.6, seed: 2 }), { x: -5.0, y: Y, z: 3.4 }));
  g.add(place(tree({ kind: 'palm', h: 3.8, seed: 5 }), { x: 4.75, y: Y, z: 3.3 }));
  g.add(place(tree({ kind: 'palm', h: 3.4, seed: 7 }), { x: -6.0, y: Y, z: -3.5 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 9 }), { x: 5.3, y: Y, z: 3.2 }));
  g.add(place(bench({ w: 1.4 }), { x: 1.6, y: Y, z: 4.3, ry: 180 }));
  return g;
}

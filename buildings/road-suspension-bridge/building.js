import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, boxFaces, place, taperedBlock, pipe, beam, cylinder,
  car, tree, streetLamp, surface, mat, metal, emissive, textured,
  canvasTexture, signTexture, ShapeBuilder,
} from '../../src/lib/index.js';

// 3x1 tiles (30 x 10 m). The road runs along X across a river; front faces +z.
const HX = 15;            // half length
const BANK = 11;          // river banks start at |x| = BANK
const RAMP = 14;          // road starts climbing at |x| = RAMP
const TX = 8;             // tower positions x = ±TX
const CZ = 4.1;           // cable / tower-leg plane z = ±CZ
const ROAD = 2.9;         // road half width (2 lanes)
const WALK = 3.6;         // deck half width incl. sidewalks

const y0 = LOT_HEIGHT;
const BANK_H = 1.2;
const ROAD_END = y0 + BANK_H + 0.06; // road level on the banks
const ROAD_TOP = y0 + 3.75;          // road level mid-span
const TOWER_TOP = y0 + 21;

const ORANGE = '#c8452c';
const ORANGE_DARK = '#9e3522';

// road surface height along the bridge: flat on the banks, smooth hump over the river
function deckY(x) {
  const t = Math.min(1, Math.max(0, (RAMP - Math.abs(x)) / RAMP));
  return ROAD_END + (ROAD_TOP - ROAD_END) * t * t * (3 - 2 * t);
}
function deckSlope(x) {
  const e = 0.05;
  return (deckY(x + e) - deckY(x - e)) / (2 * e);
}

// main cable height: parabola between the towers, sagging side spans down to the anchorages
const SADDLE = TOWER_TOP + 0.35;
const SAG_LOW = ROAD_TOP + 1.2;
const ANCHOR_X = 13.9;
const ANCHOR_Y = ROAD_END + 1.7;
function cableY(x) {
  const a = Math.abs(x);
  if (a <= TX) return SAG_LOW + (SADDLE - SAG_LOW) * (a / TX) ** 2;
  const t = (a - TX) / (ANCHOR_X - TX);
  return SADDLE + (ANCHOR_Y - SADDLE) * t - 0.9 * 4 * t * (1 - t);
}

// Slab following the curve of the deck, between z0..z1, from bottom(x) up to top(x).
// Material groups: 0 top, 1 sides/ends, 2 bottom. Top UVs: u = metres / uPeriod, v = 0..1 across.
function ribbon({ x0 = -HX, x1 = HX, z0, z1, top, bottom, n = 60, uPeriod = 4, materials, ends = true }) {
  const b = new ShapeBuilder();
  let s = 0;
  for (let i = 0; i < n; i++) {
    const xa = x0 + ((x1 - x0) * i) / n, xb = x0 + ((x1 - x0) * (i + 1)) / n;
    const ta = top(xa), tb = top(xb), ba = bottom(xa), bb = bottom(xb);
    const ds = Math.hypot(xb - xa, tb - ta);
    const ua = s / uPeriod, ub = (s + ds) / uPeriod;
    s += ds;
    b.quadUV([xa, ta, z1], [xb, tb, z1], [xb, tb, z0], [xa, ta, z0], [[ua, 1], [ub, 1], [ub, 0], [ua, 0]], 0);
    b.quad([xa, ba, z1], [xb, bb, z1], [xb, tb, z1], [xa, ta, z1], 1);
    b.quad([xb, bb, z0], [xa, ba, z0], [xa, ta, z0], [xb, tb, z0], 1);
    b.quad([xa, ba, z0], [xb, bb, z0], [xb, bb, z1], [xa, ba, z1], 2);
  }
  if (ends) {
    b.quad([x1, bottom(x1), z1], [x1, bottom(x1), z0], [x1, top(x1), z0], [x1, top(x1), z1], 1);
    b.quad([x0, bottom(x0), z0], [x0, bottom(x0), z1], [x0, top(x0), z1], [x0, top(x0), z0], 1);
  }
  const [mt, ms, mb] = materials;
  return new THREE.Mesh(b.build(), [mt, ms ?? mt, mb ?? ms ?? mt]);
}

// asphalt with white edge lines and a dashed yellow centre line (u along the road, v across)
function roadMaterial() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#4a4a50';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.07)';
      ctx.fillRect((i * 53) % W, (i * 31) % H, 2, 2);
    }
    ctx.fillStyle = '#f2f2ea';
    ctx.fillRect(0, H * 0.05, W, H * 0.035);
    ctx.fillRect(0, H * 0.915, W, H * 0.035);
    ctx.fillStyle = '#f0c419';
    ctx.fillRect(0, H * 0.48, W * 0.55, H * 0.045);
  }, { key: 'road-suspension-bridge:road' });
  return textured(tex, { roughness: 0.9 });
}

// a plaque with 0..1 UVs so the text fills the face (lib sign() shrinks on faces > 1 m)
function plaque(text, w, h, t = 0.08) {
  const geo = new THREE.BoxGeometry(t, h, w).translate(0, h / 2, 0);
  const m = textured(signTexture(text, { bg: '#1d3557', fg: '#ffffff', width: 512, height: 106, border: '#f1faee' }));
  const edge = mat('#1d3557');
  return new THREE.Mesh(geo, [m, m, edge, edge, edge, edge]);
}

// city bus, length along X, front to +x
function bus(color) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  g.add(place(box(7, 1.2, 2.4, body), { y: 0.35 }));
  g.add(place(box(6.9, 0.85, 2.42, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 })), { y: 1.55 }));
  g.add(place(box(0.08, 1.0, 2.0, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 3.5, y: 1.25 }));
  g.add(place(box(7, 0.35, 2.4, mat(PALETTE.white)), { y: 2.4 }));
  g.add(place(box(1.6, 0.25, 1.4, mat(PALETTE.lightGrey)), { x: -1.5, y: 2.75 }));
  for (const sx of [-2.2, 2.3]) for (const sz of [-1, 1]) {
    g.add(place(cylinder(0.45, 0.45, 0.3, mat(PALETTE.black), 10), { x: sx, y: 0.45, z: sz * 1.1, rx: 90 }));
  }
  return g;
}

// small motor launch, length along X, bow to +x
function launch(color) {
  const g = new THREE.Group();
  const hull = mat(color);
  g.add(place(box(3.2, 0.5, 1.2, hull), { y: 0 }));
  g.add(place(taperedBlock({ w: 0.5, d: 1.2, h: 1.0, topW: 0.1, topD: 0.2, material: hull }), { x: 1.6, rz: -90, y: 0.25 }));
  g.add(place(box(3.3, 0.08, 1.3, mat(PALETTE.white)), { x: 0.05, y: 0.5 }));
  g.add(place(box(1.2, 0.7, 0.9, mat(PALETTE.white)), { x: -0.2, y: 0.55 }));
  g.add(place(box(0.05, 0.4, 0.8, mat(PALETTE.glassDark)), { x: 0.42, y: 0.75 }));
  g.add(place(box(0.5, 0.05, 1.0, mat(PALETTE.white, { transparent: true, opacity: 0.6 })), { x: -2.2, y: -0.02 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 1], 'water'));

  const orange = mat(ORANGE, { roughness: 0.55 });
  const orangeDark = mat(ORANGE_DARK, { roughness: 0.6 });
  const concrete = mat(PALETTE.concrete);
  const concreteDark = mat(PALETTE.concreteDark);
  const walk = surface('paving', PALETTE.pavement ?? PALETTE.concrete, { size: 1.2 });
  const stone = surface('cobbles', PALETTE.stone, { size: 1.5 });
  const grass = surface('grass', PALETTE.grass, { size: 3 });

  // --- river banks with stone revetments -----------------------------------
  for (const sx of [-1, 1]) {
    const bw = HX - BANK;
    g.add(place(boxFaces(bw, BANK_H, 10, { sides: stone, top: grass }), { x: sx * (BANK + bw / 2), y: y0 }));
    // riverside steps of the revetment
    g.add(place(box(0.5, BANK_H * 0.45, 10, stone), { x: sx * (BANK - 0.25), y: y0 }));
    // road apron on the bank
    g.add(place(box(bw, 0.03, 2 * WALK, concrete), { x: sx * (BANK + bw / 2), y: y0 + BANK_H }));
  }

  // --- deck -----------------------------------------------------------------
  const roadTop = (x) => deckY(x);
  g.add(ribbon({ z0: -ROAD, z1: ROAD, top: roadTop, bottom: (x) => deckY(x) - 0.3, materials: [roadMaterial(), concreteDark], uPeriod: 4.5 }));
  for (const s of [-1, 1]) {
    const [z0, z1] = s > 0 ? [ROAD, WALK] : [-WALK, -ROAD];
    g.add(ribbon({ z0, z1, top: (x) => deckY(x) + 0.15, bottom: (x) => deckY(x) - 0.3, materials: [walk, concrete] }));
    // parapet + orange hand rail
    const [p0, p1] = s > 0 ? [WALK - 0.15, WALK] : [-WALK, -WALK + 0.15];
    g.add(ribbon({ z0: p0, z1: p1, top: (x) => deckY(x) + 0.75, bottom: (x) => deckY(x) + 0.15, materials: [mat(PALETTE.white), mat(PALETTE.lightGrey)] }));
    g.add(ribbon({ z0: p0 - 0.03, z1: p1 + 0.03, top: (x) => deckY(x) + 0.88, bottom: (x) => deckY(x) + 0.75, materials: [orange] }));
    // stiffening girder fascia over the river
    const [f0, f1] = s > 0 ? [WALK, WALK + 0.12] : [-WALK - 0.12, -WALK];
    g.add(ribbon({ x0: -BANK - 0.5, x1: BANK + 0.5, z0: f0, z1: f1, top: (x) => deckY(x) + 0.2, bottom: (x) => deckY(x) - 0.7, materials: [orange, orange, orangeDark] }));
  }
  // underside box girder (only where it clears the banks)
  g.add(ribbon({ x0: -BANK - 0.5, x1: BANK + 0.5, z0: -WALK + 0.1, z1: WALK - 0.1, top: (x) => deckY(x) - 0.3, bottom: (x) => deckY(x) - 0.85, materials: [mat('#5b4a44')] }));
  // cross beams under the deck
  for (let x = -10; x <= 10.01; x += 2) {
    g.add(place(box(0.25, 0.25, 2 * WALK - 0.2, orangeDark), { x, y: deckY(x) - 1.05 }));
  }

  // --- towers ---------------------------------------------------------------
  for (const sx of [-1, 1]) {
    const x = sx * TX;
    const pierTop = y0 + 1.1;
    // concrete pier with cutwaters
    g.add(place(box(2.6, pierTop, 9.6, concrete), { x }));
    g.add(place(box(2.7, 0.25, 9.7, concreteDark), { x, y: y0 + 0.05 }));
    for (const sz of [-1, 1]) {
      g.add(place(cylinder(1.3, 1.3, pierTop, concrete, 12), { x, z: sz * 3.7 }));
    }
    // legs, stepping in as they rise
    const steps = [[pierTop, deckY(x) + 6, 1.15], [deckY(x) + 6, deckY(x) + 12.5, 0.98], [deckY(x) + 12.5, TOWER_TOP, 0.82]];
    for (const sz of [-1, 1]) {
      for (const [ya, yb, w] of steps) {
        g.add(place(box(w, yb - ya, w, orange), { x, y: ya, z: sz * CZ }));
        g.add(place(box(w + 0.14, 0.25, w + 0.14, orangeDark), { x, y: yb - 0.25, z: sz * CZ }));
      }
      // vertical recess lines (shadow ribs) on the outer faces
      g.add(place(box(0.12, TOWER_TOP - pierTop - 0.4, 0.1, orangeDark), { x, y: pierTop, z: sz * (CZ + 0.58) }));
      for (const fx of [-1, 1]) g.add(place(box(0.08, TOWER_TOP - pierTop - 0.4, 0.12, orangeDark), { x: x + fx * 0.5, y: pierTop, z: sz * CZ }));
      // cable saddle housing + aviation light
      g.add(place(box(1.4, 0.55, 1.0, orangeDark), { x, y: TOWER_TOP, z: sz * CZ }));
      g.add(place(box(0.9, 0.25, 0.7, orange), { x, y: TOWER_TOP + 0.55, z: sz * CZ }));
      g.add(place(cylinder(0.12, 0.12, 0.6, metal(PALETTE.darkGrey), 6), { x, y: TOWER_TOP + 0.8, z: sz * CZ }));
      g.add(place(box(0.3, 0.3, 0.3, emissive('#ff3020', 1.2)), { x, y: TOWER_TOP + 1.4, z: sz * CZ }));
    }
    // portal struts between the legs
    const span = 2 * CZ;
    g.add(place(box(1.1, 0.9, span, orange), { x, y: deckY(x) - 2.0 }));
    for (const [yy, hh] of [[deckY(x) + 5.4, 1.3], [deckY(x) + 11.7, 1.3], [TOWER_TOP - 1.7, 1.7]]) {
      g.add(place(box(0.9, hh, span, orange), { x, y: yy }));
      g.add(place(box(1.0, 0.18, span, orangeDark), { x, y: yy - 0.18 }));
      // arched soffit look: small knee braces into the legs
      for (const sz of [-1, 1]) g.add(place(box(0.85, 0.7, 1.0, orange), { x, y: yy - 0.7, z: sz * (CZ - 0.95) }));
    }
    // name plaque on the lowest strut, facing the traffic
    g.add(place(plaque('TINY TOWN BRIDGE', 5.6, 1.15), { x: x + (sx > 0 ? 0.5 : -0.5), y: deckY(x) + 5.48 }));
    g.add(place(plaque('TINY TOWN BRIDGE', 5.6, 1.15), { x: x + (sx > 0 ? -0.5 : 0.5), y: deckY(x) + 5.48 }));
  }

  // --- main cables + hangers ------------------------------------------------
  const cableM = mat('#b8402a', { roughness: 0.5, metalness: 0.2 });
  const hangerM = mat('#d8705a', { roughness: 0.6 });
  for (const sz of [-1, 1]) {
    const z = sz * CZ;
    const pts = [];
    for (let x = -ANCHOR_X; x <= ANCHOR_X + 1e-6; x += 0.5) pts.push([x, cableY(x), z]);
    for (let i = 0; i < pts.length - 1; i++) g.add(pipe(pts[i], pts[i + 1], 0.17, cableM));
    for (let x = -13; x <= 13.01; x += 1) {
      if (Math.abs(Math.abs(x) - TX) < 0.6) continue;
      const top = cableY(x) - 0.12;
      const bot = deckY(x) + 0.1;
      if (top - bot < 0.3) continue;
      g.add(beam([x, top, z], [x, bot, sz * (WALK + 0.06)], 0.07, hangerM));
    }
    // anchorage blocks on each bank
    for (const sx of [-1, 1]) {
      g.add(place(taperedBlock({ w: 2.2, d: 1.25, h: ANCHOR_Y - (y0 + BANK_H) + 0.35, topW: 1.0, topD: 1.0, material: concrete, topMaterial: concreteDark }), { x: sx * 14.0, y: y0 + BANK_H, z: sz * 4.25 }));
      g.add(place(box(0.7, 0.7, 0.7, orangeDark), { x: sx * ANCHOR_X, y: ANCHOR_Y - 0.25, z }));
    }
  }

  // --- street lamps on the sidewalks ------------------------------------------
  for (const [x, sz] of [[-11, 1], [-4, -1], [3, 1], [11, -1], [-11, -1], [11, 1]]) {
    g.add(place(streetLamp({ h: 3.6 }), { x, y: deckY(x) + 0.15, z: sz * (WALK - 0.35), ry: sz > 0 ? 90 : -90 }));
  }

  // --- traffic ----------------------------------------------------------------
  // eastbound (+x) in the +z lane, westbound in the -z lane
  const traffic = [
    { x: -9.5, lane: 1, make: () => car({ color: PALETTE.red }) },
    { x: -2.2, lane: 1, make: () => car({ kind: 'taxi' }) },
    { x: 5.5, lane: 1, make: () => car({ color: PALETTE.blue, kind: 'van' }) },
    { x: 7.5, lane: -1, make: () => bus(PALETTE.red), s: 0.66 },
    { x: -4.2, lane: -1, make: () => car({ color: PALETTE.white }) },
    { x: -12.4, lane: -1, make: () => car({ color: PALETTE.yellow }) },
  ];
  for (const t of traffic) {
    const ang = (Math.atan(deckSlope(t.x)) * 180) / Math.PI;
    g.add(place(t.make(), {
      x: t.x, y: deckY(t.x) + 0.01, z: t.lane * 1.45,
      ry: t.lane > 0 ? 0 : 180, rz: t.lane > 0 ? ang : -ang, s: t.s ?? 0.68,
    }));
  }

  // --- river life + bank planting ---------------------------------------------
  g.add(place(launch(PALETTE.navy), { x: 2.5, y: y0 + 0.02, z: 4.25, ry: 8 }));
  g.add(place(launch(PALETTE.red), { x: -4, y: y0 + 0.02, z: -4.4, ry: 180, s: 0.7 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: 7 + sx * 3 + sz }), { x: sx * 11.9, y: y0 + BANK_H, z: sz * 4.4 }));
  }
  return g;
}

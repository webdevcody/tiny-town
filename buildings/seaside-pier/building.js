import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, sphere, place, group, beam, mat, metal, emissive, surface,
  textured, signTexture, canvasTexture, facadeBlock, prismBlock, taperedBlock, dome, door, bench, flag,
} from '../../src/lib/index.js';

// 3x1 tiles (30 x 10 m). The pier runs along +X out to sea; the land end
// (promenade) is at -X. Front (+Z) shows the long side of the pier.

const IRON = PALETTE.roofGreen;          // Victorian green-painted cast iron
const CREAM = PALETTE.cream;
const DECK_Y = 3.6;                      // top of the deck above the water
const DECK_T = 0.35;

// Text sign on a box with 0..1 UVs (lib sign() shrinks text on faces > 1 m).
function bigSign({ text, w, h, d = 0.15, bg, fg, border = null, glow = 0.25, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// Vertical red/white candy stripes for the helter-skelter tower.
function stripeMat(key, c1, c2, n) {
  const tex = canvasTexture(256, 16, (ctx, W, H) => {
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = i % 2 ? c2 : c1;
      ctx.fillRect((i * W) / n, 0, W / n + 1, H);
    }
  }, { key: 'seaside-pier:' + key, repeat: false });
  return textured(tex);
}

// Onion dome with a finial spike.
function onion(r, material) {
  const pts = [];
  const prof = [[0, 0], [0.85, 0.05], [1.08, 0.35], [1.0, 0.7], [0.62, 1.05], [0.25, 1.4], [0.06, 1.7], [0, 1.85]];
  for (const [x, y] of prof) pts.push(new THREE.Vector2(x * r, y * r));
  const m = new THREE.Mesh(new THREE.LatheGeometry(pts, 12), material);
  return group(m, place(cylinder(0.03, 0.05, r * 0.9, metal(PALETTE.glassGold)), { y: r * 1.75 }));
}

// Small octagonal kiosk: cream walls, arched dark windows, onion dome.
function kiosk({ r = 1.0, h = 2.6, wall = CREAM, roof = IRON, seed = 1, lit = 0.5 }) {
  const pts = [];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    pts.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const g = new THREE.Group();
  g.add(prismBlock({ points: pts, h, floorHeight: h, style: 'punched', wall, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.6, windowH: 0.62, bay: 0.75, lit, seed, roof: wall }));
  g.add(place(cylinder(r * 1.18, r * 1.18, 0.22, mat(IRON), 8), { y: h }));
  g.add(place(onion(r * 0.95, mat(roof, { flatShading: false, roughness: 0.5 })), { y: h + 0.22 }));
  return g;
}

// White railing with posts along X, length L.
function railing(L, h = 1.0) {
  const m = mat(PALETTE.white);
  const g = new THREE.Group();
  g.add(place(box(L, 0.08, 0.1, m), { y: h - 0.08 }));
  g.add(place(box(L, 0.05, 0.06, m), { y: h * 0.45 }));
  const n = Math.max(2, Math.round(L / 1.2) + 1);
  for (let i = 0; i < n; i++) g.add(place(box(0.08, h, 0.08, m), { x: -L / 2 + (L * i) / (n - 1) }));
  return g;
}

// Victorian lamp standard with twin globe lanterns.
function globeLamp(h = 3.4) {
  const iron = mat(IRON);
  const glow = emissive('#fff4c8', 0.9);
  return group(
    cylinder(0.1, 0.16, 0.5, iron, 8),
    place(cylinder(0.06, 0.08, h, iron, 6), { y: 0.5 }),
    place(box(1.0, 0.07, 0.07, iron), { y: h + 0.2 }),
    place(sphere(0.2, glow, 8), { x: -0.45, y: h + 0.05 }),
    place(sphere(0.2, glow, 8), { x: 0.45, y: h + 0.05 }),
    place(sphere(0.16, glow, 8), { y: h + 0.4 }),
  );
}

// Red-and-white life ring hung on the railing, facing +Z.
function lifeRing() {
  const t = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.09, 6, 12), stripeMat('ring', PALETTE.red, PALETTE.white, 8));
  return t;
}

// Striped deckchair (faces +X).
function deckchair(color) {
  return group(
    place(box(0.06, 0.4, 0.06, PALETTE.wood), { x: 0.35, z: -0.28 }),
    place(box(0.06, 0.4, 0.06, PALETTE.wood), { x: 0.35, z: 0.28 }),
    place(box(0.9, 0.04, 0.6, surface('stripes', color, { color2: PALETTE.white, size: 0.3 })), { x: -0.05, y: 0.4, rz: 35 }),
  );
}

// Helter-skelter: striped conical tower, pointed cap, spiral slide.
function helterSkelter() {
  const g = new THREE.Group();
  const H = 7.2, R = 1.15;
  const stripes = stripeMat('tower', PALETTE.red, PALETTE.white, 16);
  const tower = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.72, R, H, 16).translate(0, H / 2, 0), stripes);
  g.add(tower);
  // gallery at the top + pointed cap
  g.add(place(cylinder(R * 1.05, R * 1.05, 0.2, mat(PALETTE.white), 16), { y: H }));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    g.add(place(box(0.06, 0.8, 0.06, PALETTE.white), { x: Math.cos(a) * R, y: H + 0.2, z: Math.sin(a) * R }));
  }
  const capTex = stripeMat('cap', PALETTE.yellow, PALETTE.red, 12);
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(R * 1.25, 2.4, 12).translate(0, 1.2, 0), capTex), { y: H + 1.0 }));
  g.add(place(flag({ h: 1.4, color: PALETTE.blue, color2: PALETTE.white }), { y: H + 3.3, s: 0.6 }));
  // little doorway at the bottom
  g.add(place(door({ w: 0.9, h: 1.8, color: PALETTE.navy }), { z: R - 0.05 }));

  // spiral slide: 2.25 turns from the top gallery down to the deck
  const slide = mat(PALETTE.yellow);
  const lip = mat(PALETTE.blue);
  const turns = 2.25, N = 54, rr = R + 0.45;
  const top = H - 0.4, bot = 0.35;
  const P = (t) => {
    const a = Math.PI * 0.5 + t * turns * Math.PI * 2;
    const rad = rr - t * 0.15 * R;  // follow the taper roughly (tower narrows upward)
    return new THREE.Vector3(Math.cos(a) * (rad + (1 - t) * -0.2), top - (top - bot) * t, Math.sin(a) * (rad + (1 - t) * -0.2));
  };
  for (let i = 0; i < N; i++) {
    const a = P(i / N), b = P((i + 1) / N);
    const dx = b.x - a.x, dy = b.y - a.y, dz = b.z - a.z;
    const hl = Math.hypot(dx, dz);
    const len = Math.hypot(hl, dy) + 0.04;
    const mid = a.clone().add(b).multiplyScalar(0.5);
    const yaw = -Math.atan2(dz, dx), pitch = Math.atan2(dy, hl);
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.12, 0.85), slide);
    s.position.copy(mid);
    s.rotation.set(0, yaw, pitch);
    g.add(s);
    // outer lip
    const out = new THREE.Vector3(mid.x, 0, mid.z).normalize().multiplyScalar(0.42);
    const l = new THREE.Mesh(new THREE.BoxGeometry(len, 0.3, 0.07), lip);
    l.position.set(mid.x + out.x, mid.y + 0.15, mid.z + out.z);
    l.rotation.set(0, yaw, pitch);
    g.add(l);
  }
  // slide run-out mat
  const end = P(1);
  g.add(place(box(1.4, 0.1, 0.9, mat(PALETTE.purple)), { x: end.x + 0.3, y: 0, z: end.z }));
  return g;
}

// Arcade pavilion: cream hall with arched shop glazing, green mansard-ish roof,
// central dome and four onion-domed corner turrets.
function pavilion(w, d) {
  const g = new THREE.Group();
  const h = 4.2;
  g.add(facadeBlock({ w, d, h, floorHeight: h, style: 'shop', wall: CREAM, glass: PALETTE.glassDark, frame: PALETTE.white, lit: 0.7, bay: 1.6, seed: 31, roof: IRON }));
  // cornice + green roof
  g.add(place(box(w + 0.5, 0.35, d + 0.5, mat(PALETTE.white)), { y: h }));
  g.add(place(taperedBlock({ w: w + 0.2, d: d + 0.2, h: 1.6, topW: w - 2.2, topD: d - 2.2, material: surface('roofTiles', IRON, { size: 1.2 }), topMaterial: mat(IRON) }), { y: h + 0.35 }));
  // drum + central dome with lantern
  const drumY = h + 0.35 + 1.6;
  g.add(place(cylinder(1.6, 1.6, 0.9, mat(CREAM), 16), { y: drumY - 0.2 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(place(box(0.35, 0.5, 0.06, emissive(PALETTE.windowLit, 0.4)), { x: Math.cos(a) * 1.6, y: drumY + 0.0, z: Math.sin(a) * 1.6, ry: -THREE.MathUtils.radToDeg(a) + 90 }));
  }
  g.add(place(dome({ radius: 1.75, height: 1.9, material: mat(IRON, { flatShading: false, roughness: 0.5 }) }), { y: drumY + 0.7 }));
  g.add(place(cylinder(0.3, 0.3, 0.6, mat(PALETTE.white), 8), { y: drumY + 2.55 }));
  g.add(place(flag({ h: 2.2, color: PALETTE.red, color2: PALETTE.white }), { y: drumY + 3.1, s: 0.8 }));
  // corner turrets
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (w / 2), z = sz * (d / 2);
    g.add(place(cylinder(0.55, 0.55, h + 0.9, mat(CREAM), 10), { x, z }));
    g.add(place(cylinder(0.65, 0.65, 0.15, mat(PALETTE.white), 10), { x, y: h + 0.9, z }));
    g.add(place(onion(0.6, mat(IRON, { flatShading: false, roughness: 0.5 })), { x, y: h + 1.05, z }));
  }
  // front entrance canopy (striped) + big sign on the +Z face
  g.add(place(box(3.2, 0.15, 1.2, surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.6 })), { y: 2.7, z: d / 2 + 0.6 }));
  for (const x of [-1.5, 1.5]) g.add(place(cylinder(0.06, 0.06, 2.7, mat(IRON), 6), { x, z: d / 2 + 1.15 }));
  g.add(place(bigSign({ text: 'AMUSEMENTS', w: w - 2.2, h: 0.95, bg: PALETTE.navy, fg: PALETTE.yellow, border: PALETTE.yellow, glow: 0.45 }), { y: h - 1.05, z: d / 2 + 0.05 }));
  // back (seaward/north) side sign too, so the iso views from the north read it
  g.add(place(bigSign({ text: 'AMUSEMENTS', w: w - 2.2, h: 0.95, bg: PALETTE.navy, fg: PALETTE.yellow, border: PALETTE.yellow, glow: 0.45 }), { y: h - 1.05, z: -d / 2 - 0.05, ry: 180 }));
  // bulb strings along the cornice
  const bulb = emissive('#ffe27a', 1);
  for (let i = 0; i <= 12; i++) {
    const x = -w / 2 + (w * i) / 12;
    g.add(place(box(0.14, 0.14, 0.14, bulb), { x, y: h + 0.1, z: d / 2 + 0.28 }));
    g.add(place(box(0.14, 0.14, 0.14, bulb), { x, y: h + 0.1, z: -d / 2 - 0.28 }));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([3, 1], 'water'));

  const iron = mat(IRON);
  const ironDark = mat(PALETTE.foliageDark);
  const deckM = surface('planks', PALETTE.woodLight, { size: 2 });

  // --- land end: beach + stone sea wall with promenade ------------------
  g.add(place(patch(6, 10, 'sand', 0.12), { x: -10, y: y0 }));
  g.add(place(patch(2, 10, 'sand', 0.06), { x: -6.2, y: y0, s: [1, 0.6, 1] }));
  const promX0 = -15, promX1 = -12.2;
  const promW = promX1 - promX0, promCx = (promX0 + promX1) / 2;
  g.add(place(box(promW, DECK_Y - y0, 10, surface('brick', PALETTE.stone, { size: 1.4 })), { x: promCx, y: y0 }));
  g.add(place(box(promW, 0.06, 10, surface('paving', PALETTE.paving, { size: 2 })), { x: promCx, y: DECK_Y }));
  // promenade railing on the sea-wall edge (with a gap for the pier)
  for (const sz of [-1, 1]) {
    g.add(place(railing(3.2), { x: promX1 - 0.1, y: DECK_Y, z: sz * 3.3, ry: 90 }));
  }
  g.add(place(globeLamp(3.2), { x: promCx - 0.3, y: DECK_Y, z: -3.8, ry: 90 }));
  g.add(place(globeLamp(3.2), { x: promCx - 0.3, y: DECK_Y, z: 3.8, ry: 90 }));
  g.add(place(bench({ w: 1.6 }), { x: promX0 + 0.6, y: DECK_Y, z: -2.2, ry: 90 }));
  g.add(place(bench({ w: 1.6 }), { x: promX0 + 0.6, y: DECK_Y, z: 2.2, ry: 90 }));

  // beach props
  g.add(place(deckchair(PALETTE.blue), { x: -9.6, y: y0 + 0.12, z: 3.7 }));
  g.add(place(deckchair(PALETTE.red), { x: -9.4, y: y0 + 0.12, z: 2.8 }));
  g.add(place(deckchair(PALETTE.green), { x: -9.8, y: y0 + 0.12, z: -3.4 }));
  const umbrella = group(
    cylinder(0.04, 0.04, 2.0, mat(PALETTE.white), 6),
    place(new THREE.Mesh(new THREE.ConeGeometry(1.0, 0.5, 8).translate(0, 0.25, 0), stripeMat('umb', PALETTE.orange, PALETTE.white, 8)), { y: 1.75 }),
  );
  g.add(place(umbrella, { x: -8.4, y: y0 + 0.12, z: 3.4 }));
  g.add(place(box(1.6, 0.04, 0.8, mat(PALETTE.plasterBlue)), { x: -10.6, y: y0 + 0.12, z: -2.4, ry: 15 }));

  // --- deck plan ---------------------------------------------------------
  // [x0, x1, halfWidth]
  const sections = [
    [-12.2, -8.0, 4.6],  // entrance concourse
    [-8.0, 1.2, 2.4],    // neck
    [1.2, 14.8, 4.75],   // pier head
  ];
  const bumps = [[-3.6, 4.6]]; // side bump-outs for kiosks [x, halfWidth]
  const bumpW = 2.6;

  const deckBlock = (x0, x1, z0, z1) => {
    const w = x1 - x0, d = z1 - z0;
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
    g.add(place(box(w, DECK_T, d, deckM), { x: cx, y: DECK_Y - DECK_T, z: cz }));
    // white fascia girder under the deck edge
    g.add(place(box(w, 0.45, d - 0.1, mat(PALETTE.white)), { x: cx, y: DECK_Y - DECK_T - 0.45, z: cz }));
  };
  for (const [x0, x1, hw] of sections) deckBlock(x0, x1, -hw, hw);
  for (const [bx, hw] of bumps) for (const sz of [-1, 1]) {
    const zIn = sz * 2.4, zOut = sz * hw;
    deckBlock(bx - bumpW / 2, bx + bumpW / 2, Math.min(zIn, zOut), Math.max(zIn, zOut));
  }

  // --- iron legs + bracing ----------------------------------------------
  const legTop = DECK_Y - DECK_T - 0.45;
  const legs = (x, hw) => {
    for (const sz of [-1, 1]) {
      const z = sz * (hw - 0.45);
      g.add(place(cylinder(0.17, 0.24, legTop - y0, iron, 8), { x, y: y0, z }));
      g.add(place(cylinder(0.32, 0.32, 0.25, ironDark, 8), { x, y: y0, z }));
    }
    // cross bracing between the pair
    const zA = -(hw - 0.45), zB = hw - 0.45;
    g.add(beam([x, y0 + 0.5, zA], [x, legTop - 0.2, zB], 0.09, iron));
    g.add(beam([x, y0 + 0.5, zB], [x, legTop - 0.2, zA], 0.09, iron));
    g.add(beam([x, legTop - 0.2, zA], [x, legTop - 0.2, zB], 0.12, iron));
  };
  const legXs = [];
  for (let x = -11.2; x <= 14.3; x += 2.85) legXs.push(x);
  for (const x of legXs) {
    const hw = x < -8 ? 4.6 : x < 1.2 ? 2.4 : 4.75;
    legs(x, hw);
    if (hw > 4) legs(x, 2.4); // extra inner row under the wide parts
  }
  // longitudinal girders under the neck, with diagonal bracing between legs
  for (const sz of [-1, 1]) {
    const z = sz * (2.4 - 0.45);
    g.add(place(box(legXs[legXs.length - 1] - legXs[0], 0.2, 0.14, iron), { x: (legXs[0] + legXs[legXs.length - 1]) / 2, y: legTop - 0.35, z }));
    for (let i = 0; i < legXs.length - 1; i++) {
      g.add(beam([legXs[i], y0 + 0.7, z], [legXs[i + 1], legTop - 0.35, z], 0.08, iron));
    }
  }
  // kiosk bump-outs: extra legs
  for (const [bx, hw] of bumps) for (const sz of [-1, 1]) {
    g.add(place(cylinder(0.15, 0.22, legTop - y0, iron, 8), { x: bx, y: y0, z: sz * (hw - 0.45) }));
  }

  // --- railings + lamps around the deck edge ----------------------------
  const ry = DECK_Y;
  const edge = (x0, x1, z) => g.add(place(railing(x1 - x0), { x: (x0 + x1) / 2, y: ry, z }));
  const edgeZ = (z0, z1, x) => g.add(place(railing(Math.abs(z1 - z0)), { x, y: ry, z: (z0 + z1) / 2, ry: 90 }));
  // entrance concourse
  for (const sz of [-1, 1]) {
    edge(-12.2, -8.0, sz * 4.55);
    edgeZ(sz * 2.4, sz * 4.55, -8.0);
  }
  // neck (broken by the bump-outs)
  for (const sz of [-1, 1]) {
    edge(-8.0, -3.6 - bumpW / 2, sz * 2.35);
    edge(-3.6 + bumpW / 2, 1.2, sz * 2.35);
    edge(-3.6 - bumpW / 2, -3.6 + bumpW / 2, sz * 4.55);
    edgeZ(sz * 2.4, sz * 4.55, -3.6 - bumpW / 2);
    edgeZ(sz * 2.4, sz * 4.55, -3.6 + bumpW / 2);
  }
  // pier head
  for (const sz of [-1, 1]) {
    edge(1.2, 14.75, sz * 4.7);
    edgeZ(sz * 2.4, sz * 4.7, 1.2);
  }
  edgeZ(-4.7, 4.7, 14.7);

  for (const x of [-6.0, -1.2, 1.2 + 0.3]) for (const sz of [-1, 1]) {
    g.add(place(globeLamp(3.0), { x, y: ry, z: sz * 2.25, ry: 90 }));
  }
  for (const x of [5.0, 9.5, 14.4]) for (const sz of [-1, 1]) {
    g.add(place(globeLamp(3.0), { x, y: ry, z: sz * 4.6, ry: 90 }));
  }
  // life rings on the railings
  for (const [x, z, r] of [[-5.0, 2.42, 0], [-1.8, -2.42, 180], [7.4, 4.78, 0], [14.82, -2.0, 90]]) {
    g.add(place(lifeRing(), { x, y: ry + 0.55, z, ry: r }));
  }

  // --- entrance: twin toll kiosks + arch with name board ----------------
  for (const sz of [-1, 1]) {
    g.add(place(kiosk({ r: 1.05, h: 2.7, seed: sz + 5 }), { x: -10.1, y: ry, z: sz * 3.2 }));
  }
  const archX = -10.1;
  for (const sz of [-1, 1]) g.add(place(cylinder(0.14, 0.16, 4.3, iron, 8), { x: archX, y: ry, z: sz * 2.05 }));
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.05, 0.1, 6, 16, Math.PI), iron);
  g.add(place(arch, { x: archX, y: ry + 4.3, ry: 90 }));
  g.add(place(bigSign({ text: 'SEASIDE PIER', w: 4.0, h: 0.8, d: 0.12, bg: PALETTE.navy, fg: '#ffffff', border: PALETTE.glassGold, glow: 0.3, double: true }), { x: archX, y: ry + 3.45, ry: -90 }));
  // gilded crest on top of the arch
  g.add(place(sphere(0.28, metal(PALETTE.glassGold), 8), { x: archX, y: ry + 6.3 }));
  // turnstile gate bars
  for (const z of [-0.9, 0.9]) g.add(place(box(0.6, 1.0, 0.08, iron), { x: -11.2, y: ry, z }));

  // --- neck: side kiosks on the bump-outs + benches ---------------------
  const kioskColours = [[PALETTE.plasterBlue, PALETTE.roofGreen], [PALETTE.peach, PALETTE.roofGreen]];
  for (const [bx, hw] of bumps) for (const sz of [-1, 1]) {
    const [wall, roof] = kioskColours[sz < 0 ? 0 : 1];
    g.add(place(kiosk({ r: 0.95, h: 2.4, wall, roof, seed: 40 + sz }), { x: bx, y: ry, z: sz * (hw - 1.15) }));
  }
  // kiosk shop signs facing the walkway
  g.add(place(bigSign({ text: 'ROCK', w: 1.3, h: 0.4, d: 0.06, bg: PALETTE.pink, fg: PALETTE.white }), { x: -3.6, y: ry + 2.0, z: 2.55 + 0.4, ry: 180 }));
  g.add(place(bigSign({ text: 'TEAS', w: 1.3, h: 0.4, d: 0.06, bg: PALETTE.green, fg: PALETTE.white }), { x: -3.6, y: ry + 2.0, z: -2.55 - 0.4 }));
  // a "ROCK" board facing the street (+Z) side too
  g.add(place(bigSign({ text: 'ROCK', w: 1.3, h: 0.4, d: 0.06, bg: PALETTE.pink, fg: PALETTE.white }), { x: -3.6, y: ry + 2.0, z: 4.55 - 0.15 }));
  // benches back-to-back down the neck centre
  for (const x of [-6.4, -0.8]) {
    g.add(place(bench({ w: 1.5 }), { x, y: ry, z: 0.35 }));
    g.add(place(bench({ w: 1.5 }), { x, y: ry, z: -0.35, ry: 180 }));
  }

  // --- pier head: pavilion, helter-skelter, ice cream kiosk, telescopes -
  const pw = 8.4, pd = 5.2, px = 6.6, pz = -1.6;
  g.add(place(pavilion(pw, pd), { x: px, y: ry, z: pz }));
  g.add(place(helterSkelter(), { x: 12.6, y: ry, z: 2.6 }));
  // ice-cream stall
  const ice = group(
    box(1.6, 1.1, 1.0, mat(PALETTE.pink)),
    place(box(1.7, 0.08, 1.1, mat(PALETTE.white)), { y: 1.1 }),
    place(cylinder(0.04, 0.04, 1.2, mat(PALETTE.white), 6), { x: 0.3, y: 1.1 }),
    place(new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.5, 8).translate(0, 0.25, 0), stripeMat('ice', PALETTE.blue, PALETTE.white, 8)), { x: 0.3, y: 2.2 }),
    place(bigSign({ text: 'ICES', w: 1.4, h: 0.38, d: 0.05, bg: PALETTE.white, fg: PALETTE.red }), { y: 0.55, z: 0.51 }),
  );
  g.add(place(ice, { x: 3.0, y: ry, z: 3.4 }));
  // telescope on the seaward end
  const scope = group(
    cylinder(0.06, 0.1, 1.1, mat(PALETTE.darkGrey), 6),
    place(cylinder(0.12, 0.09, 0.7, metal(PALETTE.glassGold), 8), { y: 1.0, rz: -70 }),
  );
  g.add(place(scope, { x: 14.0, y: ry, z: -3.4 }));
  g.add(place(scope.clone(), { x: 14.0, y: ry, z: -1.6 }));
  // benches facing out to sea along the pier-head edge
  for (const x of [4.0, 8.6]) g.add(place(bench({ w: 1.6 }), { x, y: ry, z: 4.0 }));
  // a little fenced flower tub cluster near the pavilion door
  for (const x of [px - 2.6, px + 2.6]) {
    g.add(place(cylinder(0.35, 0.3, 0.45, mat(PALETTE.white), 8), { x, y: ry, z: pz + pd / 2 + 1.5 }));
    g.add(place(sphere(0.35, mat(PALETTE.red), 6), { x, y: ry + 0.3, z: pz + pd / 2 + 1.5 }));
  }
  // fishermen's corner: rods leaning on the far rail
  for (const z of [-4.3, -3.6]) {
    g.add(place(beam([0, 0, 0], [0.9, 2.2, 0.0], 0.03, mat(PALETTE.darkGrey)), { x: 13.7, y: ry, z }));
  }

  // --- sea: a couple of buoys and a moored rowing boat at the head -----
  const buoy = group(
    cylinder(0.32, 0.4, 0.5, mat(PALETTE.red), 8),
    place(cone(0.3, 0.5, mat(PALETTE.yellow), 8), { y: 0.5 }),
  );
  g.add(place(buoy, { x: 2.0, y: y0, z: -3.6 }));
  g.add(place(buoy.clone(), { x: -5.5, y: y0, z: 4.1 }));
  // white wave foam where the legs meet the water
  for (const x of legXs) if (x > -8) for (const sz of [-1, 1]) {
    g.add(place(cylinder(0.42, 0.42, 0.03, mat(PALETTE.white), 8), { x, y: y0, z: sz * ((x < 1.2 ? 2.4 : 4.75) - 0.45) }));
  }
  return g;
}

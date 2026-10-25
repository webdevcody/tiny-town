import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, place, group, beam, lattice, flag, streetLamp, bench,
  tree, car, hedge, ShapeBuilder, canvasTexture, textured, mat, metal, emissive, surface, shade, rng,
} from '../../src/lib/index.js';

// 4x3 tiles (40 x 30 m). Front (main entrance) faces +z.
//
// The bowl is a set of rounded-rectangle rings offset outwards from the pitch
// edge by t metres. Offsetting a rounded rectangle keeps its straight sides the
// same length, so every ring has the same vertex count and the aisles line up.

const HX0 = 11.5;          // pitch-side wall, half length (x)
const HZ0 = 7.3;           // pitch-side wall, half width (z)
const R0 = 2.5;            // pitch-side corner radius
const CORNER_SEGS = 6;
const SIDE_SEGS_X = 5;     // straight segments along the long sides
const SIDE_SEGS_Z = 3;

// tiers: t = offset from the pitch-side wall, y = height above the lot
const AD_H = 1.0;
const LOWER = { rows: 4, depth: 0.7, rise: 0.42, t0: 0, y0: AD_H };
const BOX_T = LOWER.rows * LOWER.depth;                       // 2.8
const BOX_Y = LOWER.y0 + (LOWER.rows - 1) * LOWER.rise;        // top of lower tier
const UPPER = { rows: 4, depth: 0.75, rise: 0.6, t0: BOX_T, y0: BOX_Y + 1.25 };
const T_OUT = UPPER.t0 + UPPER.rows * UPPER.depth;             // 5.8, outer wall
const TOP_Y = UPPER.y0 + (UPPER.rows - 1) * UPPER.rise;
const ROOF = { tBack: T_OUT + 0.35, tFront: 2.6, yBack: 8.3, yFront: 8.8, thick: 0.28 };
const WALL_H = 8.2;

const SEAT = PALETTE.red;
const SEAT_UP = '#b52a25';
const ACCENT = PALETTE.red;

/** Points [[x, z]] of the ring at offset t, counter-clockwise seen from above. */
function ring(t) {
  const r = R0 + t;
  const cx = HX0 - R0, cz = HZ0 - R0;
  const corners = [[cx, -cz], [-cx, -cz], [-cx, cz], [cx, cz]];
  const pts = [];
  corners.forEach(([ccx, ccz], c) => {
    for (let k = 0; k <= CORNER_SEGS; k++) {
      const a = ((c * 90 + (k * 90) / CORNER_SEGS) * Math.PI) / 180;
      pts.push([ccx + r * Math.cos(a), ccz - r * Math.sin(a)]);
    }
    // straight side towards the next corner (interior points only)
    const [nx, nz] = corners[(c + 1) % 4];
    const a1 = (((c + 1) * 90) * Math.PI) / 180;
    const from = pts[pts.length - 1];
    const to = [nx + r * Math.cos(a1), nz - r * Math.sin(a1)];
    const n = c % 2 === 0 ? SIDE_SEGS_X : SIDE_SEGS_Z;
    for (let s = 1; s < n; s++) pts.push([from[0] + ((to[0] - from[0]) * s) / n, from[1] + ((to[1] - from[1]) * s) / n]);
  });
  const cum = [0];
  for (let i = 1; i <= pts.length; i++) {
    const a = pts[i - 1], b = pts[i % pts.length];
    cum.push(cum[i - 1] + Math.hypot(b[0] - a[0], b[1] - a[1]));
  }
  return { pts, cum };
}

const N = ring(0).pts.length;
const at = (i) => (i + N) % N;

// Indices that carry a stair aisle: straight-side subdivisions and mid-corners.
function aisleIndices() {
  const out = [];
  let i = 0;
  for (let c = 0; c < 4; c++) {
    out.push(i + CORNER_SEGS / 2);
    i += CORNER_SEGS + 1;
    const n = c % 2 === 0 ? SIDE_SEGS_X : SIDE_SEGS_Z;
    for (let s = 1; s < n; s++) out.push(i + s - 1);
    i += n - 1;
  }
  return out;
}

// ---------------------------------------------------------------------------
// textures

function crowdTexture(key, seat) {
  return canvasTexture(128, 16, (ctx, w, h) => {
    const r = rng(key.length * 7 + 3);
    ctx.fillStyle = seat;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = shade(seat, -0.25);
    ctx.fillRect(0, h - 3, w, 3);
    const fans = [PALETTE.white, PALETTE.red, '#e8c39e', '#8a5a3c', PALETTE.yellow, PALETTE.navy, '#f0d0b0', PALETTE.blue];
    for (let x = 0; x < w; x += 4) {
      for (let y = 2; y < h - 4; y += 5) {
        if (r() < 0.55) {
          ctx.fillStyle = r.pick(fans);
          ctx.fillRect(x + 1, y, 2, 3);
        }
      }
    }
  }, { key: 'football-stadium:' + key });
}

function adsTexture() {
  return canvasTexture(512, 32, (ctx, w, h) => {
    const ads = [
      ['TINY COLA', PALETTE.red, '#ffffff'],
      ['TOWN FC', PALETTE.navy, '#ffd23a'],
      ['PIXEL BANK', '#2f9a4a', '#ffffff'],
      ['TRANSPORT CO', '#ffd23a', '#202020'],
    ];
    const pw = w / ads.length;
    ads.forEach(([text, bg, fg], i) => {
      ctx.fillStyle = bg;
      ctx.fillRect(i * pw, 0, pw, h);
      ctx.fillStyle = fg;
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, i * pw + pw / 2, h / 2 + 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(i * pw, 0, 2, h);
    });
  }, { key: 'football-stadium:ads' });
}

function boxesTexture() {
  return canvasTexture(64, 40, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#2b3a4a';
    ctx.fillRect(3, 8, w / 2 - 5, h - 14);
    ctx.fillRect(w / 2 + 2, 8, w / 2 - 5, h - 14);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillRect(w / 2 + 2, 8, w / 2 - 5, 6);
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, 0, w, 4);
  }, { key: 'football-stadium:boxes' });
}

// Outside wall, 4 m wide x WALL_H tall per repeat.
function facadeTexture() {
  return canvasTexture(128, 256, (ctx, w, h) => {
    const m = h / WALL_H; // px per metre
    const yy = (metres) => h - metres * m;
    ctx.fillStyle = '#e9e6df';
    ctx.fillRect(0, 0, w, h);
    // plinth + concrete ground floor with a turnstile gate
    ctx.fillStyle = '#b9b4aa';
    ctx.fillRect(0, yy(3.0), w, 3.0 * m);
    ctx.fillStyle = '#8f8a80';
    ctx.fillRect(0, yy(0.5), w, 0.5 * m);
    ctx.fillStyle = '#3a3d42';
    ctx.fillRect(w * 0.3, yy(2.4), w * 0.4, 2.4 * m);
    ctx.fillStyle = '#5a5e64';
    for (let y = 0.3; y < 2.4; y += 0.3) ctx.fillRect(w * 0.3, yy(y), w * 0.4, 1);
    // red band
    ctx.fillStyle = ACCENT;
    ctx.fillRect(0, yy(3.4), w, 0.4 * m);
    // concourse windows
    ctx.fillStyle = '#4d7fa8';
    ctx.fillRect(4, yy(5.3), w - 8, 1.3 * m);
    ctx.fillStyle = '#9cc3dd';
    ctx.fillRect(4, yy(5.3), w - 8, 0.3 * m);
    // vertical cladding ribs
    ctx.fillStyle = '#c9c6bf';
    for (let x = 0; x < w; x += w / 4) ctx.fillRect(x, 0, 2, yy(3.4));
    // top band
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, w, 0.9 * m);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0.9 * m - 3, w, 2);
  }, { key: 'football-stadium:facade' });
}

function pitchTexture(PX, PZ) {
  return canvasTexture(1024, Math.round((1024 * PZ) / PX), (ctx, w, h) => {
    const s = w / (2 * PX); // px per metre
    const stripes = 14;
    for (let i = 0; i < stripes; i++) {
      ctx.fillStyle = i % 2 ? '#4f9a35' : '#5fae40';
      ctx.fillRect((i * w) / stripes, 0, w / stripes + 1, h);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    const m = 0.25 * s;
    ctx.strokeRect(m, m, w - 2 * m, h - 2 * m);
    ctx.beginPath(); ctx.moveTo(w / 2, m); ctx.lineTo(w / 2, h - m); ctx.stroke();
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 1.9 * s, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(w / 2, h / 2, 5, 0, Math.PI * 2); ctx.fill();
    for (const side of [0, 1]) {
      const x0 = side ? w - m : m;
      const dir = side ? -1 : 1;
      const bw = 3.4 * s, bh = 8.2 * s, sw = 1.2 * s, sh = 4.2 * s;
      ctx.strokeRect(side ? x0 - bw : x0, h / 2 - bh / 2, bw, bh);
      ctx.strokeRect(side ? x0 - sw : x0, h / 2 - sh / 2, sw, sh);
      ctx.beginPath(); ctx.arc(x0 + dir * 2.4 * s, h / 2, 4, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath();
      ctx.arc(x0 + dir * 2.4 * s, h / 2, 1.9 * s, side ? Math.PI - 0.93 + Math.PI : -0.93, side ? Math.PI + 0.93 + Math.PI : 0.93);
      ctx.stroke();
    }
  }, { key: 'football-stadium:pitch', repeat: false });
}

function lampTexture() {
  return canvasTexture(64, 48, (ctx, w, h) => {
    ctx.fillStyle = '#30343a';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#fffbe0';
    for (let x = 0; x < 4; x++) for (let y = 0; y < 3; y++) {
      ctx.beginPath();
      ctx.arc(8 + x * 16, 8 + y * 16, 6, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { key: 'football-stadium:lamps', repeat: false });
}

function scoreTexture() {
  return canvasTexture(256, 96, (ctx, w, h) => {
    ctx.fillStyle = '#111418';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = ACCENT;
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, w - 6, h - 6);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.fillText('TOWN', w * 0.22, 30);
    ctx.fillText('CITY', w * 0.78, 30);
    ctx.fillStyle = '#ffd23a';
    ctx.font = 'bold 44px monospace';
    ctx.fillText('2 - 1', w / 2, 58);
    ctx.fillStyle = '#7fe07f';
    ctx.font = 'bold 18px monospace';
    ctx.fillText("78'", w / 2, 84);
  }, { key: 'football-stadium:score', repeat: false });
}

function signTex() {
  return canvasTexture(512, 48, (ctx, w, h) => {
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = '#ffd23a';
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, w - 4, h - 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 32px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('TINY TOWN STADIUM', w / 2, h / 2 + 2);
  }, { key: 'football-stadium:sign', repeat: false });
}

/** Box of w x h x d whose +z face shows the whole texture once (UV 0..1). */
function panel(w, h, d, tex, frame, glow = 0.5) {
  const b = new ShapeBuilder();
  const W = w / 2, z = d / 2 + 0.01;
  b.quadUV([-W, 0, z], [W, 0, z], [W, h, z], [-W, h, z], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  return group(box(w, h, d, frame), new THREE.Mesh(b.build(), face));
}

// ---------------------------------------------------------------------------
// bowl

function bowl() {
  const b = new ShapeBuilder();
  const G = { treadLow: 0, riserLow: 1, treadUp: 2, riserUp: 3, ads: 4, boxes: 5, backWall: 6, facade: 7, aisle: 8 };
  const mats = [
    textured(crowdTexture('crowd-low', SEAT)),
    mat(shade(SEAT, -0.35)),
    textured(crowdTexture('crowd-up', SEAT_UP)),
    mat(shade(SEAT_UP, -0.35)),
    textured(adsTexture(), { emissive: '#ffffff', emissiveIntensity: 0.1, emissiveMap: adsTexture() }),
    textured(boxesTexture()),
    mat('#d6d2c8'),
    textured(facadeTexture()),
    mat('#cfccc4'),
  ];
  const rings = new Map();
  const R = (t) => {
    if (!rings.has(t)) rings.set(t, ring(t));
    return rings.get(t);
  };

  // vertical band on ring t from y0 to y1; inward faces the pitch
  const band = (t, y0, y1, group, su, inward) => {
    const { pts, cum } = R(t);
    for (let i = 0; i < N; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[at(i + 1)];
      const ua = cum[i] / su, ub = cum[i + 1] / su;
      if (inward) {
        b.quadUV([bx, y0, bz], [ax, y0, az], [ax, y1, az], [bx, y1, bz], [[-ub, 0], [-ua, 0], [-ua, 1], [-ub, 1]], group);
      } else {
        b.quadUV([ax, y0, az], [bx, y0, bz], [bx, y1, bz], [ax, y1, az], [[ua, 0], [ub, 0], [ub, 1], [ua, 1]], group);
      }
    }
  };
  // flat ring between t1 (inner) and t2 (outer) at height y
  const tread = (t1, t2, y, group, su) => {
    const inn = R(t1).pts, out = R(t2).pts, mid = R((t1 + t2) / 2).cum;
    for (let i = 0; i < N; i++) {
      const j = at(i + 1);
      const u0 = mid[i] / su, u1 = mid[i + 1] / su;
      b.quadUV([out[i][0], y, out[i][1]], [out[j][0], y, out[j][1]], [inn[j][0], y, inn[j][1]], [inn[i][0], y, inn[i][1]],
        [[u0, 1], [u1, 1], [u1, 0], [u0, 0]], group);
    }
  };

  band(0, 0, AD_H, G.ads, 16, true);
  const aisles = aisleIndices();
  const tiers = [[LOWER, G.treadLow, G.riserLow], [UPPER, G.treadUp, G.riserUp]];
  for (const [tier, gt, gr] of tiers) {
    for (let k = 0; k < tier.rows; k++) {
      const t1 = tier.t0 + k * tier.depth, t2 = t1 + tier.depth;
      const y = tier.y0 + k * tier.rise;
      tread(t1, t2, y, gt, 4);
      if (k > 0) band(t1, y - tier.rise, y, gr, 4, true);
      // stair aisles
      for (const i of aisles) {
        const p1 = R(t1).pts[i], p2 = R(t2).pts[i];
        const pa = R(t1).pts[at(i - 1)], pb = R(t1).pts[at(i + 1)];
        let tx = pb[0] - pa[0], tz = pb[1] - pa[1];
        const tl = Math.hypot(tx, tz); tx = (tx / tl) * 0.3; tz = (tz / tl) * 0.3;
        let nx = p1[0] - p2[0], nz = p1[1] - p2[1];
        const nl = Math.hypot(nx, nz); nx = (nx / nl) * 0.03; nz = (nz / nl) * 0.03;
        const ya = y + 0.02;
        b.quad([p2[0] - tx, ya, p2[1] - tz], [p2[0] + tx, ya, p2[1] + tz], [p1[0] + tx, ya, p1[1] + tz], [p1[0] - tx, ya, p1[1] - tz], G.aisle);
        if (k > 0) {
          const qx = p1[0] + nx, qz = p1[1] + nz;
          b.quad([qx + tx, y - tier.rise, qz + tz], [qx - tx, y - tier.rise, qz - tz], [qx - tx, ya, qz - tz], [qx + tx, ya, qz + tz], G.aisle);
        }
      }
    }
  }
  // hospitality boxes between the tiers, back wall, outside facade
  band(BOX_T, BOX_Y, UPPER.y0, G.boxes, 2, true);
  band(T_OUT, TOP_Y, WALL_H, G.backWall, 4, true);
  band(T_OUT, 0, WALL_H, G.facade, 4, false);
  return new THREE.Mesh(b.build(), mats);
}

function roof() {
  const b = new ShapeBuilder();
  const { tBack, tFront, yBack, yFront, thick } = ROOF;
  const back = ring(tBack).pts, front = ring(tFront).pts;
  for (let i = 0; i < N; i++) {
    const j = at(i + 1);
    const B = (p, y) => [p[0], y, p[1]];
    // top (eave at the back first so the ribs run towards the pitch)
    b.quad(B(back[i], yBack), B(back[j], yBack), B(front[j], yFront), B(front[i], yFront), 0);
    // underside
    b.quad(B(back[j], yBack - thick), B(back[i], yBack - thick), B(front[i], yFront - thick), B(front[j], yFront - thick), 1);
    // fascia facing the pitch / outside
    b.quad(B(front[j], yFront - thick), B(front[i], yFront - thick), B(front[i], yFront + 0.12), B(front[j], yFront + 0.12), 2);
    b.quad(B(back[i], yBack - thick), B(back[j], yBack - thick), B(back[j], yBack), B(back[i], yBack), 3);
  }
  const top = surface('corrugated', '#f2f2ee', { size: 1.5 });
  const g = group(new THREE.Mesh(b.build(), [top, mat('#7d8188'), mat(ACCENT), mat('#f2f2ee')]));

  // cantilever trusses on top of the canopy
  const steel = metal('#e6e7ea');
  const rBack = ring(tBack - 0.25).pts, rFront = ring(tFront + 0.2).pts;
  for (const i of aisleIndices()) {
    const p = rBack[i], q = rFront[i];
    const mx = (p[0] * 0.45 + q[0] * 0.55), mz = (p[1] * 0.45 + q[1] * 0.55);
    const yTop = yBack + 1.7;
    g.add(beam([p[0], yBack, p[1]], [p[0], yTop, p[1]], 0.22, steel));
    g.add(beam([p[0], yTop, p[1]], [q[0], yFront + 0.05, q[1]], 0.18, steel));
    g.add(beam([mx, yBack + (yFront - yBack) * 0.55, mz], [p[0] * 0.75 + q[0] * 0.25, yBack + (yTop - yBack) * 0.75 + 0.1, p[1] * 0.75 + q[1] * 0.25], 0.12, steel));
  }
  return g;
}

// ---------------------------------------------------------------------------
// pitch & props

function goal() {
  const white = mat(PALETTE.white);
  const net = mat('#ffffff', { transparent: true, opacity: 0.45, side: THREE.DoubleSide });
  const W = 3.2, H = 1.25, D = 1.0;
  return group(
    place(box(0.14, H, 0.14, white), { z: W / 2 }),
    place(box(0.14, H, 0.14, white), { z: -W / 2 }),
    place(box(0.14, 0.14, W + 0.14, white), { y: H - 0.07 }),
    place(box(0.03, H * 0.8, W, net), { x: -D }),
    place(box(D, 0.03, W, net), { x: -D / 2, y: H - 0.05 }),
    place(box(D, H, 0.03, net), { x: -D / 2, z: W / 2 }),
    place(box(D, H, 0.03, net), { x: -D / 2, z: -W / 2 }),
  );
}

function player(shirt, shorts = PALETTE.white) {
  return group(
    place(box(0.32, 0.38, 0.22, PALETTE.black), { y: 0 }),
    place(box(0.36, 0.22, 0.26, shorts), { y: 0.36 }),
    place(box(0.44, 0.42, 0.3, shirt), { y: 0.56 }),
    place(sphere(0.14, '#e8c39e', 8), { y: 0.96 }),
  );
}

function floodlight(x, z, y0) {
  const g = new THREE.Group();
  const H = 15;
  g.add(place(box(1.8, 0.4, 1.8, PALETTE.concrete), { y: y0 }));
  g.add(place(lattice({ w: 1.4, topW: 0.55, h: H, segments: 8, thickness: 0.14, material: metal('#9aa0a8') }), { y: y0 + 0.4 }));
  const head = new THREE.Group();
  const frame = metal('#8a9099');
  const tilt = new THREE.Group();
  tilt.add(place(panel(3.6, 2.6, 0.35, lampTexture(), frame, 0.9), { y: -1.3 }));
  tilt.add(place(box(3.8, 0.12, 0.7, frame), { y: 1.3, z: 0.1 }));
  tilt.rotation.x = THREE.MathUtils.degToRad(28);
  head.add(tilt);
  head.add(place(box(0.25, 0.25, 0.9, frame), { y: -0.2, z: -0.45 }));
  head.position.set(0, y0 + 0.4 + H + 1.3, 0);
  head.rotation.y = Math.atan2(-x, -z);
  g.add(head);
  g.position.set(x, 0, z);
  return g;
}

function ticketBooth() {
  return group(
    box(1.6, 2.2, 1.2, mat(PALETTE.white)),
    place(box(1.2, 0.8, 0.05, mat(PALETTE.glassDark)), { y: 1.1, z: 0.6 }),
    place(box(1.9, 0.25, 1.5, mat(ACCENT)), { y: 2.2 }),
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([4, 3], 'paved'));

  // grass apron inside the bowl + striped pitch
  const apron = new ShapeBuilder();
  apron.poly(ring(0).pts.map(([x, z]) => [x, 0, z]));
  g.add(place(new THREE.Mesh(apron.build(), mat('#4c8a33')), { y: y0 + 0.02 }));
  const PX = HX0 - 1.0, PZ = HZ0 - 1.0;
  const pitch = new ShapeBuilder();
  pitch.quadUV([-PX, 0, PZ], [PX, 0, PZ], [PX, 0, -PZ], [-PX, 0, -PZ], [[0, 0], [1, 0], [1, 1], [0, 1]]);
  g.add(place(new THREE.Mesh(pitch.build(), textured(pitchTexture(PX, PZ))), { y: y0 + 0.05 }));

  g.add(place(bowl(), { y: y0 }));
  g.add(place(roof(), { y: y0 }));

  // goals, corner flags, players, ball
  const yp = y0 + 0.06;
  g.add(place(goal(), { x: -PX + 0.25, y: yp }));
  g.add(place(goal(), { x: PX - 0.25, y: yp, ry: 180 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(cylinder(0.04, 0.04, 1.0, mat(PALETTE.white), 5), { x: sx * (PX - 0.3), y: yp, z: sz * (PZ - 0.3) }));
    g.add(place(box(0.03, 0.3, 0.4, mat(PALETTE.yellow)), { x: sx * (PX - 0.3), y: yp + 0.7, z: sz * (PZ - 0.3) + 0.2 }));
  }
  const home = [[-8.6, 0], [-6, -2.8], [-6.2, 2.6], [-2.5, -1], [-1.5, 3.5], [1.2, 0.6], [3.5, -3]];
  const away = [[8.8, 0.3], [5.8, 2.2], [6, -2], [2.8, 1.8], [0.8, -2.5], [-3.8, 1.5], [4.6, 4.2]];
  home.forEach(([x, z], i) => g.add(place(player(i === 0 ? PALETTE.yellow : PALETTE.red), { x, y: yp, z, ry: 90 })));
  away.forEach(([x, z], i) => g.add(place(player(i === 0 ? '#2f9a4a' : PALETTE.blue, PALETTE.navy), { x, y: yp, z, ry: -90 })));
  g.add(place(player(PALETTE.black, PALETTE.black), { x: -0.5, y: yp, z: 1.2 }));
  g.add(place(sphere(0.2, mat(PALETTE.white), 8), { x: 2.0, y: yp, z: 0.9 }));

  // dugouts and players' tunnel on the south side
  const dug = mat(PALETTE.navy);
  for (const sx of [-1, 1]) {
    const d = group(
      box(3.0, 1.0, 0.12, dug),
      place(box(0.1, 1.0, 0.7, dug), { x: -1.45, z: 0.35 }),
      place(box(0.1, 1.0, 0.7, dug), { x: 1.45, z: 0.35 }),
      place(box(3.0, 0.08, 0.8, mat('#cfe4f0', { transparent: true, opacity: 0.6 })), { y: 1.0, z: 0.35 }),
      place(box(2.6, 0.4, 0.3, mat(PALETTE.red)), { z: 0.25 }),
    );
    g.add(place(d, { x: sx * 4, y: y0 + 0.02, z: HZ0 - 0.85, ry: 180 }));
  }
  g.add(place(box(1.6, 0.95, 0.06, mat('#22252a')), { y: y0, z: HZ0 - 0.03 }));

  // scoreboard on the north roof
  const sbFrame = mat(PALETTE.darkGrey);
  const sbZ = -(HZ0 + 4.6);
  const sbY = y0 + ROOF.yBack + (ROOF.yFront - ROOF.yBack) * 0.4;
  g.add(place(panel(7, 2.8, 0.4, scoreTexture(), sbFrame), { y: sbY + 1.2, z: sbZ }));
  for (const sx of [-2.5, 2.5]) g.add(place(box(0.3, 1.3, 0.3, sbFrame), { x: sx, y: sbY, z: sbZ }));

  // floodlight towers in the four corners
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(floodlight(sx * 17.6, sz * 12.6, y0));

  // main entrance: sign, canopy, ticket booths, flags, lamps
  const front = HZ0 + T_OUT;
  g.add(place(panel(12, 1.1, 0.2, signTex(), mat(PALETTE.navy), 0.2), { y: y0 + 5.9, z: front + 0.1 }));
  g.add(place(box(7, 0.25, 1.5, mat(ACCENT)), { y: y0 + 3.0, z: front + 0.75 }));
  for (const sx of [-3.2, 3.2]) g.add(place(cylinder(0.08, 0.08, 3.0, metal(PALETTE.steelLight), 6), { x: sx, y: y0, z: front + 1.35 }));
  g.add(place(patch(8, 1.9, 'cobbles'), { y: y0, z: front + 0.95 }));
  for (const sx of [-1, 1]) g.add(place(ticketBooth(), { x: sx * 6.2, y: y0, z: 14.1 }));
  const flagColors = [[PALETTE.red, PALETTE.white], [PALETTE.navy, PALETTE.white], [PALETTE.yellow, PALETTE.red], [PALETTE.blue, PALETTE.white]];
  [-13.5, -10.5, -8.6, 8.6, 10.5, 13.5].forEach((x, i) => {
    if (Math.abs(x) > 9) {
      const [c1, c2] = flagColors[i % flagColors.length];
      g.add(place(flag({ h: 6, color: c1, color2: c2 }), { x, y: y0, z: 14.4 }));
    } else {
      g.add(place(streetLamp({ h: 4.5 }), { x, y: y0, z: 14.4, ry: x > 0 ? 180 : 0 }));
    }
  });

  // landscaping: trees and benches on the long ends, hedges on the back
  for (const sx of [-1, 1]) {
    [-6, 0, 6].forEach((z, i) => {
      g.add(place(tree({ kind: 'round', h: 4.5, seed: 30 + i + (sx > 0 ? 7 : 0) }), { x: sx * 18.7, y: y0, z }));
    });
    for (const z of [-3, 3]) g.add(place(bench({ w: 1.4 }), { x: sx * 18.6, y: y0, z, ry: sx > 0 ? -90 : 90 }));
    g.add(place(tree({ kind: 'cone', h: 5.5, seed: 50 + sx }), { x: sx * 18.6, y: y0, z: 9.4 }));
    g.add(place(tree({ kind: 'cone', h: 5.5, seed: 60 + sx }), { x: sx * 18.6, y: y0, z: -9.4 }));
    g.add(place(tree({ kind: 'bush', h: 1.3, seed: 70 + sx }), { x: sx * 15.6, y: y0, z: 13.8 }));
    g.add(place(tree({ kind: 'bush', h: 1.3, seed: 80 + sx }), { x: sx * 15.6, y: y0, z: -13.8 }));
  }
  g.add(place(hedge({ w: 13, h: 0.9, d: 0.7 }), { y: y0, z: -14.5 }));

  // TV broadcast van and a team coach parked by the back corners
  const van = car({ color: PALETTE.white, kind: 'van' });
  van.add(place(cylinder(0.05, 0.05, 0.6, metal(PALETTE.steel), 6), { x: -0.8, y: 2.0 }));
  van.add(place(cylinder(0.55, 0.55, 0.08, mat(PALETTE.white), 12), { x: -0.8, y: 2.6, rz: 60 }));
  g.add(place(van, { x: 12.4, y: y0, z: -14.0 }));
  const coach = group(
    place(box(7.5, 2.4, 2.2, mat(PALETTE.navy)), { y: 0.4 }),
    place(box(7.3, 0.8, 2.25, mat(PALETTE.glassDark)), { y: 1.6 }),
    place(box(7.52, 0.25, 2.22, mat(PALETTE.red)), { y: 0.9 }),
    ...[-2.6, 2.4].flatMap((x) => [-1, 1].map((sz) => place(new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 0.25, 10).rotateX(Math.PI / 2), mat(PALETTE.black)), { x, y: 0.45, z: sz * 1.0 }))),
  );
  g.add(place(coach, { x: -11.4, y: y0, z: -13.9 }));
  return g;
}

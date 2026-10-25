import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, group, mat, metal, emissive, cylinder, sphere, pipe,
  parapet, rooftopUnits, textured, canvasTexture, streetLamp, car, sign, tree,
} from '../../src/lib/index.js';
import { uvBox, neonTexture, glowMat, mirrorTexture, person, stanchion, rope } from './parts.js';

const PINK = '#ff2fa8';
const VIOLET = '#a24bff';
const CYAN = '#2ee8ff';
const LIME = '#5dff4a';
const RED = '#ff3030';

// Stripe of neon segments with a stepped brightness so it reads as a chasing/pulsing tube.
function neonStripe(len, color, { t = 0.16, phase = 0, seg = 0.95 } = {}) {
  const g = new THREE.Group();
  const levels = [2.2, 1.5, 0.8, 1.5];
  const n = Math.max(1, Math.round(len / seg));
  const s = len / n;
  for (let i = 0; i < n; i++) {
    const m = emissive(color, levels[(i + phase) % levels.length]);
    g.add(place(box(s - 0.06, t, 0.08, m), { x: -len / 2 + s * (i + 0.5) }));
  }
  return g;
}

// Stripe wrapped around all four faces of a w x d block at height y (local to block centre).
function wrapStripe(w, d, y, color, phase, t) {
  const o = 0.04;
  return group(
    place(neonStripe(w, color, { t, phase }), { y, z: d / 2 + o }),
    place(neonStripe(w, color, { t, phase: phase + 2 }), { y, z: -d / 2 - o, ry: 180 }),
    place(neonStripe(d, color, { t, phase: phase + 1 }), { y, x: w / 2 + o, ry: 90 }),
    place(neonStripe(d, color, { t, phase: phase + 3 }), { y, x: -w / 2 - o, ry: -90 }),
  );
}

function laserBeam(from, to, color) {
  const m = mat(color, { emissive: color, emissiveIntensity: 2.4, transparent: true, opacity: 0.8 });
  return pipe(from, to, 0.09, m);
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // ---- the black box --------------------------------------------------------
  const W = 7.6, D = 6.0, H = 7.0;
  const bx = -0.6, bz = -1.4;
  const front = bz + D / 2; // z = 1.6
  const black = mat('#1b1823', { roughness: 0.85 });
  const blackTrim = mat('#2a2633', { roughness: 0.7 });
  const chrome = metal(PALETTE.chrome, { roughness: 0.25 });
  const yR = y0 + H;

  const club = new THREE.Group();
  club.add(box(W, H, D, black));
  club.add(place(box(W + 0.2, 0.35, D + 0.2, blackTrim), {})); // plinth
  // horizontal chasing stripes, all four sides
  club.add(wrapStripe(W, D, 3.0, PINK, 0, 0.18));
  club.add(wrapStripe(W, D, 3.55, VIOLET, 1, 0.14));
  club.add(wrapStripe(W, D, 4.1, CYAN, 2, 0.18));
  club.add(wrapStripe(W, D, H - 0.12, CYAN, 3, 0.12)); // cornice tube
  // vertical pinstripes on the sides and back (below the bands)
  for (const [side, len, rot] of [['x', D, 90], ['-x', D, -90], ['-z', W, 180]]) {
    const n = Math.floor(len / 0.95);
    for (let i = 0; i < n; i++) {
      const u = -len / 2 + (len / n) * (i + 0.5);
      const col = [PINK, VIOLET, CYAN][i % 3];
      const m = emissive(col, i % 2 ? 1.0 : 1.9);
      const post = box(0.12, 2.1, 0.08, m);
      if (side === 'x') club.add(place(post, { x: W / 2 + 0.04, y: 0.55, z: -u, ry: rot }));
      else if (side === '-x') club.add(place(post, { x: -W / 2 - 0.04, y: 0.55, z: u, ry: rot }));
      else club.add(place(post, { x: -u, y: 0.55, z: -D / 2 - 0.04, ry: rot }));
    }
  }
  g.add(place(club, { x: bx, y: y0, z: bz }));

  // big NEON sign across the upper front (0..1 UVs so the text fills the panel)
  const neonTex = neonTexture('neon-nightclub:sign', 'NEON', { color: '#ff4fc0', glow: '#ff2fa8', width: 512, height: 160, border: CYAN });
  g.add(place(uvBox(6.4, 2.0, 0.18, [black, black, black, black, glowMat(neonTex, 1.3), black]), { x: bx, y: y0 + 4.65, z: front + 0.09 }));

  // smaller NEON sign on the west wall, facing -x
  const sideFace = glowMat(neonTex, 1.3);
  g.add(place(uvBox(4.6, 1.45, 0.16, [black, black, black, black, sideFace, black]), { x: bx - W / 2 - 0.08, y: y0 + 4.85, z: bz, ry: -90 }));
  // neon cocktail glass on the east wall, facing +x
  const glassTex = canvasTexture(256, 256, (ctx, Wc, Hc) => {
    ctx.fillStyle = '#0d0b14';
    ctx.fillRect(0, 0, Wc, Hc);
    ctx.lineWidth = 12;
    ctx.lineCap = ctx.lineJoin = 'round';
    for (const blur of [30, 12, 0]) {
      ctx.shadowBlur = blur;
      ctx.shadowColor = CYAN;
      ctx.strokeStyle = '#8ff6ff';
      ctx.beginPath();
      ctx.moveTo(48, 50); ctx.lineTo(208, 50); ctx.lineTo(128, 140); ctx.closePath();
      ctx.moveTo(128, 140); ctx.lineTo(128, 210);
      ctx.moveTo(84, 214); ctx.lineTo(172, 214);
      ctx.stroke();
      ctx.shadowColor = PINK;
      ctx.strokeStyle = '#ff7fd0';
      ctx.beginPath();
      ctx.moveTo(150, 92); ctx.lineTo(196, 22);
      ctx.stroke();
      ctx.fillStyle = '#ff7fd0';
      ctx.beginPath();
      ctx.arc(150, 92, 14, 0, Math.PI * 2);
      ctx.fill();
    }
  }, { key: 'neon-nightclub:cocktail', repeat: false });
  g.add(place(uvBox(2.2, 2.2, 0.14, [black, black, black, black, glowMat(glassTex, 1.3), black]), { x: bx + W / 2 + 0.07, y: y0 + 4.55, z: bz - 0.6, ry: 90 }));

  // zigzag neon wave across the back wall
  const zig = 10, zw = (W - 1.0) / zig;
  for (let i = 0; i < zig; i++) {
    const x0 = bx + W / 2 - 0.5 - zw * i, x1 = x0 - zw;
    const ya = y0 + (i % 2 ? 6.2 : 5.1), yb = y0 + (i % 2 ? 5.1 : 6.2);
    g.add(pipe([x0, ya, bz - D / 2 - 0.06], [x1, yb, bz - D / 2 - 0.06], 0.08, emissive(i % 2 ? PINK : VIOLET, 2)));
  }

  // corner blade sign "CLUB", angled 45 deg so it reads from the front and both south views
  const bladeTex = neonTexture('neon-nightclub:blade', 'CLUB', { color: '#7df3ff', glow: CYAN, width: 128, height: 512, vertical: true, border: PINK });
  const bladeFace = glowMat(bladeTex, 1.3);
  const blade = group(
    place(uvBox(0.16, 4.0, 1.1, [bladeFace, bladeFace, black, black, black, black]), { y: 0 }),
    place(box(0.6, 0.1, 0.1, chrome), { x: -0.38, y: 3.6 }),
    place(box(0.6, 0.1, 0.1, chrome), { x: -0.38, y: 0.4 }),
  );
  // faces local ±x; turned to face south-east across the corner, brackets reach back to it
  g.add(place(blade, { x: bx + W / 2 + 0.45, y: y0 + 2.4, z: front + 0.45, ry: -45 }));

  // ---- entrance ---------------------------------------------------------------
  const doorX = -2.9;
  g.add(place(box(1.8, 2.5, 0.12, mat('#0c0b10', { roughness: 0.3, metalness: 0.4 })), { x: doorX, y: y0 + 0.35, z: front + 0.06 }));
  g.add(place(box(0.05, 2.4, 0.16, chrome), { x: doorX, y: y0 + 0.4, z: front + 0.08 }));
  g.add(place(box(0.06, 0.6, 0.06, chrome), { x: doorX - 0.15, y: y0 + 1.4, z: front + 0.16 }));
  g.add(place(box(0.06, 0.6, 0.06, chrome), { x: doorX + 0.15, y: y0 + 1.4, z: front + 0.16 }));
  // door frame in pink neon
  g.add(place(box(2.1, 0.12, 0.1, emissive(PINK, 2)), { x: doorX, y: y0 + 2.9, z: front + 0.08 }));
  g.add(place(box(0.12, 2.6, 0.1, emissive(PINK, 2)), { x: doorX - 1.0, y: y0 + 0.35, z: front + 0.08 }));
  g.add(place(box(0.12, 2.6, 0.1, emissive(PINK, 2)), { x: doorX + 1.0, y: y0 + 0.35, z: front + 0.08 }));
  // cantilevered canopy with a glowing violet underside edge
  g.add(place(box(2.6, 0.22, 1.7, blackTrim), { x: doorX, y: y0 + 2.62, z: front + 0.85 }));
  g.add(place(box(2.62, 0.08, 1.72, emissive(VIOLET, 1.8)), { x: doorX, y: y0 + 2.56, z: front + 0.85 }));
  g.add(pipe([doorX - 1.15, y0 + 2.75, front + 1.6], [doorX - 1.15, y0 + 4.0, front + 0.05], 0.04, chrome));
  g.add(pipe([doorX + 1.15, y0 + 2.75, front + 1.6], [doorX + 1.15, y0 + 4.0, front + 0.05], 0.04, chrome));
  // small VIP plate next to the door
  g.add(place(sign({ text: 'VIP', w: 0.7, h: 0.35, bg: '#111018', fg: '#ffd84a', depth: 0.06 }), { x: doorX + 1.45, y: y0 + 1.6, z: front }));

  // red carpet from the door to the street, gold-trimmed
  const carpetL = 5 - front;
  g.add(place(box(1.5, 0.04, carpetL, mat('#b3122e', { roughness: 0.95 })), { x: doorX, y: y0, z: front + carpetL / 2 }));
  g.add(place(box(1.6, 0.03, carpetL, mat('#d8b24a')), { x: doorX, y: y0, z: front + carpetL / 2 }));

  // velvet rope: along the carpet's east edge, then along the queue line
  const brass = metal('#d9b04a', { roughness: 0.3 });
  const velvet = mat('#a3001f', { roughness: 0.6 });
  const posts = [[-2.0, 4.6], [-2.0, 3.5], [-0.8, 3.5], [0.45, 3.5], [1.7, 3.5], [2.95, 3.5]];
  posts.forEach(([x, z]) => g.add(place(stanchion(brass), { x, y: y0, z })));
  for (let i = 0; i < posts.length - 1; i++) {
    const [ax, az] = posts[i], [cx, cz] = posts[i + 1];
    g.add(rope([ax, y0 + 0.88, az], [cx, y0 + 0.88, cz], 0.2, velvet));
  }
  // west side of carpet too
  for (const z of [3.5, 4.6]) g.add(place(stanchion(brass), { x: -3.8, y: y0, z }));
  g.add(rope([-3.8, y0 + 0.88, 3.5], [-3.8, y0 + 0.88, 4.6], 0.18, velvet));

  // the queue (between the wall and the rope), facing the door (-x)
  const queue = [[-1.35, 2.55], [-0.6, 2.75], [0.15, 2.5], [0.9, 2.7], [1.6, 2.5], [2.35, 2.75], [3.0, 2.45]];
  queue.forEach(([x, z], i) => g.add(place(person(100 + i * 7), { x, y: y0, z, ry: -90 + ((i * 37) % 50) - 25 })));
  // bouncer in black by the door, and a guest stepping in on the carpet
  g.add(place(person(5, { outfit: '#0a0a0e', legs: '#0a0a0e' }), { x: -2.0, y: y0, z: 2.2, ry: 20, s: 1.15 }));
  g.add(place(person(9, { outfit: '#f2e14b' }), { x: doorX + 0.2, y: y0 + 0.04, z: 3.0, ry: 180 }));

  // ---- side alley (east) -------------------------------------------------------
  const ax0 = bx + W / 2; // 3.2
  g.add(place(patch(5 - ax0, 6.6, 'asphalt'), { x: (ax0 + 5) / 2, y: y0, z: -1.7 }));
  // fire exit door + green EXIT light
  g.add(place(box(0.12, 2.2, 1.1, mat('#3a3f47')), { x: ax0 + 0.06, y: y0 + 0.35, z: -2.6 }));
  g.add(place(box(0.1, 0.25, 0.6, emissive(LIME, 1.6)), { x: ax0 + 0.08, y: y0 + 2.75, z: -2.6 }));
  // dumpster and crates
  g.add(place(box(1.1, 1.0, 1.8, mat('#2f6b3c', { roughness: 0.7 })), { x: 4.25, y: y0, z: -4.0 }));
  g.add(place(box(1.2, 0.12, 1.9, mat('#244f2d')), { x: 4.25, y: y0 + 1.0, z: -4.0, rz: 6 }));
  g.add(place(box(0.7, 0.6, 0.7, PALETTE.wood), { x: 4.4, y: y0, z: -1.4 }));
  g.add(place(box(0.6, 0.5, 0.6, PALETTE.woodDark), { x: 4.4, y: y0 + 0.6, z: -1.4, ry: 20 }));
  // party car parked at the alley mouth
  g.add(place(car({ color: '#e0218a' }), { x: 4.2, y: y0 + 0.05, z: 1.6, ry: 90, s: 0.7 }));
  // street lamps and a palm planter at the front corners
  g.add(place(streetLamp({ h: 4.4 }), { x: 4.6, y: y0, z: 3.9, ry: -90 }));
  g.add(place(box(0.9, 0.5, 0.9, blackTrim), { x: -4.2, y: y0, z: 4.2 }));
  g.add(place(box(0.92, 0.06, 0.92, emissive(CYAN, 1.6)), { x: -4.2, y: y0 + 0.5, z: 4.2 }));
  g.add(place(tree({ kind: 'palm', h: 4.6, seed: 12 }), { x: -4.2, y: y0 + 0.5, z: 4.2, s: 0.5 }));

  // ---- roof: parapet, gantry with giant disco ball, laser projectors --------------
  g.add(place(parapet({ w: W, d: D, h: 0.5, t: 0.25, material: blackTrim }), { x: bx, y: yR, z: bz }));
  g.add(place(rooftopUnits({ w: 3.0, d: 2.0, count: 2, seed: 4, material: mat(PALETTE.steelDark) }), { x: bx + 2.0, y: yR, z: bz - 1.8 }));

  // gantry
  const gx = bx, gz = bz + 0.2;
  const gTop = yR + 5.0;
  const steelBlack = metal('#2b2b33', { roughness: 0.5 });
  for (const dx of [-2.6, 2.6]) {
    g.add(place(box(0.25, gTop - yR, 0.25, steelBlack), { x: gx + dx, y: yR, z: gz }));
    g.add(pipe([gx + dx, yR, gz - 1.0], [gx + dx, yR + 2.0, gz], 0.06, steelBlack));
    g.add(pipe([gx + dx, yR, gz + 1.0], [gx + dx, yR + 2.0, gz], 0.06, steelBlack));
  }
  g.add(place(box(5.6, 0.3, 0.3, steelBlack), { x: gx, y: gTop - 0.3, z: gz }));
  // chasing lights along the gantry beam
  g.add(place(neonStripe(5.4, PINK, { t: 0.1, phase: 1, seg: 0.6 }), { x: gx, y: gTop - 0.2, z: gz + 0.17 }));
  g.add(place(neonStripe(5.4, PINK, { t: 0.1, phase: 3, seg: 0.6 }), { x: gx, y: gTop - 0.2, z: gz - 0.17, ry: 180 }));

  // disco ball on a chain
  const R = 1.55;
  const ballY = gTop - 1.2 - 2 * R;
  g.add(place(cylinder(0.05, 0.05, 1.2, chrome, 6), { x: gx, y: ballY + 2 * R - 0.05, z: gz }));
  const mirror = mirrorTexture();
  const ballMat = textured(mirror, { emissive: '#ffffff', emissiveMap: mirror, emissiveIntensity: 0.35, metalness: 0.65, roughness: 0.2 });
  g.add(place(sphere(R, ballMat, 22), { x: gx, y: ballY, z: gz }));
  g.add(place(cylinder(0.25, 0.25, 0.2, chrome, 10), { x: gx, y: ballY + 2 * R - 0.12, z: gz }));

  // laser projectors at the roof corners, beams fanning up and across the ball
  const corners = [
    [bx - W / 2 + 0.6, bz + D / 2 - 0.6, [LIME, CYAN]],
    [bx + W / 2 - 0.6, bz + D / 2 - 0.6, [RED, PINK]],
    [bx - W / 2 + 0.6, bz - D / 2 + 0.6, [VIOLET, LIME]],
    [bx + W / 2 - 0.6, bz - D / 2 + 0.6, [CYAN, RED]],
  ];
  corners.forEach(([cx, cz, cols], i) => {
    g.add(place(box(0.6, 0.35, 0.6, steelBlack), { x: cx, y: yR, z: cz }));
    g.add(place(box(0.45, 0.35, 0.45, mat('#3a3a44')), { x: cx, y: yR + 0.35, z: cz, ry: 45 }));
    const sy = yR + 0.6;
    const ex = (gx - cx), ez = (gz - cz);
    g.add(laserBeam([cx, sy, cz], [cx + ex * 1.55, sy + 5.6, cz + ez * 0.6], cols[0]));
    g.add(laserBeam([cx, sy, cz], [cx + ex * 0.5, sy + 6.2, cz + ez * 1.5], cols[1]));
    g.add(place(sphere(0.12, emissive(cols[0], 2.5), 8), { x: cx, y: sy - 0.12, z: cz }));
  });

  // roof access hut
  g.add(place(box(1.4, 2.2, 1.2, blackTrim), { x: bx - 2.6, y: yR, z: bz - 2.0 }));
  return g;
}

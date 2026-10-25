import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, hipRoof, gableRoof, pyramidRoof, chimney, door, windowPanel, sign,
  box, cylinder, sphere, cone, place, group, beam, pipe, fence, hedge, tree, bench, streetLamp,
  surface, mat, metal, textured, canvasTexture, stairs,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// School building on the west half, fenced playground with a painted court on the east half.

const KEY = 'primary-school';

// Flat textured decal (court markings, hopscotch) lying on the ground. Canvas top = -z.
function decal(w, d, tex, transparent = false) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), textured(tex, { roughness: 0.9, transparent }));
  m.rotation.x = -Math.PI / 2;
  return group(m);
}

function courtTexture() {
  return canvasTexture(512, 328, (ctx, W, H) => {
    ctx.fillStyle = '#b8553f'; // terracotta surround
    ctx.fillRect(0, 0, W, H);
    const m = 22;
    ctx.fillStyle = '#3d7bb8'; // blue playing area
    ctx.fillRect(m, m, W - 2 * m, H - 2 * m);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(m, m, W - 2 * m, H - 2 * m);
    // centre line + circle
    ctx.beginPath(); ctx.moveTo(W / 2, m); ctx.lineTo(W / 2, H - m); ctx.stroke();
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 38, 0, Math.PI * 2); ctx.stroke();
    // keys (painted) + free-throw semicircles + three-point arcs
    const kw = 92, kh = 96;
    for (const side of [0, 1]) {
      const x = side ? W - m - kw : m;
      ctx.fillStyle = '#d2603f';
      ctx.fillRect(x, H / 2 - kh / 2, kw, kh);
      ctx.strokeRect(x, H / 2 - kh / 2, kw, kh);
      const fx = side ? W - m - kw : m + kw;
      ctx.beginPath(); ctx.arc(fx, H / 2, kh / 2, side ? Math.PI / 2 : -Math.PI / 2, side ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke();
      const bx = side ? W - m : m;
      ctx.beginPath(); ctx.arc(bx, H / 2, 128, side ? Math.PI / 2 : -Math.PI / 2, side ? Math.PI * 1.5 : Math.PI / 2); ctx.stroke();
    }
  }, { key: `${KEY}:court`, repeat: false });
}

function hopscotchTexture() {
  return canvasTexture(64, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const cells = [[1], [2, 3], [4], [5, 6], [7], [8, 9], [10]];
    const ch = H / cells.length;
    const cols = ['#ffd84a', '#ff7a59', '#7fd36b', '#6bb8ff', '#d68cff'];
    cells.forEach((row, i) => {
      const y = H - (i + 1) * ch;
      const cw = row.length === 1 ? W * 0.5 : W * 0.5;
      row.forEach((n, j) => {
        const x = row.length === 1 ? W * 0.25 : j * cw;
        ctx.fillStyle = cols[(n - 1) % cols.length];
        ctx.fillRect(x + 2, y + 2, cw - 4, ch - 4);
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.strokeRect(x + 2, y + 2, cw - 4, ch - 4);
      });
    });
  }, { key: `${KEY}:hopscotch`, repeat: false });
}

function clockTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#2b2b2b';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7f3e6';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W / 2 - 8, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillRect(W / 2 + Math.cos(a) * 44 - 3, H / 2 + Math.sin(a) * 44 - 3, 6, 6);
    }
    ctx.strokeStyle = '#222';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W / 2, H / 2 - 36); ctx.stroke();
    ctx.lineWidth = 7;
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W / 2 + 24, H / 2 + 8); ctx.stroke();
  }, { key: `${KEY}:clock`, repeat: false });
}

function clock(r) {
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 24), textured(clockTexture(), { transparent: true }));
  face.position.z = 0.03;
  return group(face);
}

// Bell cupola for the roof ridge.
function cupola() {
  const white = mat(PALETTE.white);
  const g = group(place(box(1.5, 0.9, 1.5, white), {}));
  for (const [x, z] of [[-0.6, -0.6], [0.6, -0.6], [-0.6, 0.6], [0.6, 0.6]]) g.add(place(box(0.18, 1.1, 0.18, white), { x, y: 0.9, z }));
  g.add(place(cone(0.32, 0.55, metal(PALETTE.glassGold ?? '#c9a43a', { roughness: 0.35 }), 10), { y: 1.25 }));
  g.add(place(box(1.6, 0.16, 1.6, white), { y: 2.0 }));
  g.add(place(pyramidRoof({ w: 1.5, h: 1.2, overhang: 0.12, material: mat('#5f9e86', { roughness: 0.6, metalness: 0.2 }) }), { y: 2.16 }));
  g.add(place(cylinder(0.04, 0.04, 0.9, metal(PALETTE.darkGrey), 6), { y: 3.3 }));
  g.add(place(box(0.6, 0.04, 0.04, metal(PALETTE.darkGrey)), { y: 3.9 }));
  g.add(place(box(0.04, 0.04, 0.6, metal(PALETTE.darkGrey)), { y: 3.9 }));
  g.add(place(sphere(0.09, metal('#c9a43a'), 8), { y: 4.2 }));
  return g;
}

// Slide tower with ladder and chute running down towards +z.
function slide() {
  const post = mat(PALETTE.yellow);
  const g = new THREE.Group();
  const s = 1.1, ph = 1.5;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.12, 2.5, 0.12, post), { x: (x * s) / 2, z: (z * s) / 2 }));
  g.add(place(box(s + 0.1, 0.12, s + 0.1, mat(PALETTE.wood)), { y: ph }));
  g.add(place(box(s + 0.1, 0.35, 0.06, mat(PALETTE.blue)), { y: ph + 0.12, z: -s / 2 }));
  g.add(place(pyramidRoof({ w: s, h: 0.7, overhang: 0.15, material: mat(PALETTE.red) }), { y: 2.5 }));
  // ladder on the back
  g.add(beam([-0.3, 0, -s / 2 - 0.8], [-0.3, ph, -s / 2], 0.08, mat(PALETTE.blue)));
  g.add(beam([0.3, 0, -s / 2 - 0.8], [0.3, ph, -s / 2], 0.08, mat(PALETTE.blue)));
  for (let i = 1; i < 5; i++) {
    const t = i / 5;
    g.add(place(box(0.6, 0.05, 0.05, mat(PALETTE.blue)), { y: ph * t, z: -s / 2 - 0.8 * (1 - t) }));
  }
  // chute
  const len = 2.4, ang = Math.atan2(ph - 0.25, len);
  const chute = new THREE.Group();
  chute.add(place(box(0.62, 0.06, Math.hypot(len, ph - 0.25), mat(PALETTE.red)), { z: Math.hypot(len, ph - 0.25) / 2 }));
  chute.add(place(box(0.06, 0.22, Math.hypot(len, ph - 0.25), mat(PALETTE.red)), { x: -0.31, z: Math.hypot(len, ph - 0.25) / 2 }));
  chute.add(place(box(0.06, 0.22, Math.hypot(len, ph - 0.25), mat(PALETTE.red)), { x: 0.31, z: Math.hypot(len, ph - 0.25) / 2 }));
  chute.position.set(0, ph, s / 2);
  chute.rotation.x = ang;
  g.add(chute);
  g.add(place(box(0.62, 0.25, 0.4, mat(PALETTE.red)), { y: 0, z: s / 2 + len + 0.15 }));
  return g;
}

// A-frame swing set, beam along X.
function swings(len = 3.2, h = 2.3) {
  const frame = mat(PALETTE.green);
  const g = new THREE.Group();
  for (const x of [-len / 2, len / 2]) {
    g.add(beam([x, 0, -0.75], [x, h, 0], 0.1, frame));
    g.add(beam([x, 0, 0.75], [x, h, 0], 0.1, frame));
  }
  g.add(pipe([-len / 2 - 0.1, h, 0], [len / 2 + 0.1, h, 0], 0.07, frame));
  const seats = [PALETTE.red, PALETTE.yellow, PALETTE.blue];
  seats.forEach((c, i) => {
    const x = -len / 2 + (len * (i + 0.5)) / seats.length;
    const sy = 0.5;
    g.add(place(box(0.025, h - sy, 0.025, metal(PALETTE.steelLight)), { x: x - 0.2, y: sy }));
    g.add(place(box(0.025, h - sy, 0.025, metal(PALETTE.steelLight)), { x: x + 0.2, y: sy }));
    g.add(place(box(0.5, 0.06, 0.25, mat(c)), { x, y: sy }));
  });
  return g;
}

// Pipe-frame climbing cube (jungle gym).
function climbingFrame(nx = 3, nz = 2, ny = 2, cell = 0.7) {
  const m = mat(PALETTE.blue);
  const g = new THREE.Group();
  const X = (i) => -((nx * cell) / 2) + i * cell;
  const Z = (k) => -((nz * cell) / 2) + k * cell;
  for (let i = 0; i <= nx; i++) for (let k = 0; k <= nz; k++) g.add(place(cylinder(0.04, 0.04, ny * cell, m, 6), { x: X(i), z: Z(k) }));
  for (let j = 1; j <= ny; j++) {
    const y = j * cell;
    for (let k = 0; k <= nz; k++) g.add(pipe([X(0), y, Z(k)], [X(nx), y, Z(k)], 0.035, m));
    for (let i = 0; i <= nx; i++) g.add(pipe([X(i), y, Z(0)], [X(i), y, Z(nz)], 0.035, m));
  }
  // coloured deck on top
  g.add(place(box(cell * 2, 0.06, nz * cell, mat(PALETTE.orange)), { x: X(1), y: ny * cell }));
  return g;
}

function seesaw() {
  return group(
    place(box(0.3, 0.45, 0.3, mat(PALETTE.darkGrey)), {}),
    place(box(2.6, 0.08, 0.3, mat(PALETTE.orange)), { y: 0.4, rz: 10 }),
    place(box(0.06, 0.25, 0.3, mat(PALETTE.yellow)), { x: -1.1, y: 0.25 + 0.2 + 0.2 }),
    place(box(0.06, 0.25, 0.3, mat(PALETTE.yellow)), { x: 1.1, y: 0.05 + 0.2 }),
  );
}

function hoop() {
  const pole = metal(PALETTE.darkGrey);
  const g = group(place(cylinder(0.07, 0.08, 3.1, pole, 8), {}));
  g.add(place(box(0.5, 0.08, 0.08, pole), { x: 0.25, y: 2.9 }));
  g.add(place(box(0.06, 0.9, 1.3, mat(PALETTE.white)), { x: 0.5, y: 2.5 }));
  g.add(place(box(0.07, 0.4, 0.55, mat(PALETTE.red)), { x: 0.5, y: 2.6 }));
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.025, 6, 16), mat(PALETTE.orange));
  rim.rotation.x = Math.PI / 2;
  rim.position.set(0.78, 2.65, 0);
  g.add(rim);
  return g;
}

// Bicycle, wheels in the YZ plane (parked along Z).
function bike(color) {
  const fm = mat(color);
  const tm = mat(PALETTE.black);
  const g = new THREE.Group();
  for (const z of [-0.5, 0.5]) {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.045, 5, 12), tm);
    w.rotation.y = Math.PI / 2;
    w.position.set(0, 0.34, z);
    g.add(w);
  }
  g.add(beam([0, 0.34, -0.5], [0, 0.85, -0.12], 0.06, fm));
  g.add(beam([0, 0.34, -0.5], [0, 0.4, 0.05], 0.06, fm));
  g.add(beam([0, 0.4, 0.05], [0, 0.85, -0.12], 0.06, fm));
  g.add(beam([0, 0.4, 0.05], [0, 0.85, 0.4], 0.06, fm));
  g.add(beam([0, 0.85, -0.12], [0, 0.85, 0.4], 0.06, fm));
  g.add(beam([0, 0.34, 0.5], [0, 0.95, 0.42], 0.05, metal(PALETTE.steelLight)));
  g.add(place(box(0.5, 0.05, 0.05, metal(PALETTE.darkGrey)), { y: 0.95, z: 0.42 }));
  g.add(place(box(0.14, 0.06, 0.26, tm), { y: 0.9, z: -0.15 }));
  return g;
}

function bikeRack(n = 4) {
  const m = metal(PALETTE.steelLight);
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * 0.55;
    g.add(place(box(0.05, 0.7, 0.05, m), { x, z: -0.3 }));
    g.add(place(box(0.05, 0.7, 0.05, m), { x, z: 0.3 }));
    g.add(place(box(0.05, 0.05, 0.65, m), { x, y: 0.7 }));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  const brickWall = surface('brick', PALETTE.brick, { size: 2 });
  const stone = mat(PALETTE.white);
  const roofMat = surface('shingles', PALETTE.roofSlate, { size: 2 });

  // --- main school block -------------------------------------------------
  const cx = -4.45, cz = -1.75, w = 10.7, d = 6.0;
  const H = 2 * FLOOR;
  g.add(place(facadeBlock({
    w, d, floors: 2, style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window,
    windowW: 0.66, windowH: 0.62, bay: 2.15, lit: 0.12, seed: 31, roof: PALETTE.concreteDark,
  }), { x: cx, y: y0, z: cz }));
  // stone plinth, string course, cornice
  g.add(place(box(w + 0.14, 0.45, d + 0.14, mat(PALETTE.stone)), { x: cx, y: y0, z: cz }));
  g.add(place(box(w + 0.14, 0.18, d + 0.14, stone), { x: cx, y: y0 + FLOOR - 0.05, z: cz }));
  g.add(place(box(w + 0.3, 0.3, d + 0.3, stone), { x: cx, y: y0 + H - 0.1, z: cz }));
  g.add(place(hipRoof({ w: w + 0.1, d: d + 0.1, h: 2.6, overhang: 0.35, material: roofMat }), { x: cx, y: y0 + H + 0.2, z: cz }));
  for (const dx of [-3.6, 3.6]) {
    g.add(place(chimney({ w: 0.8, d: 0.8, h: 2.6, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: cx + dx, y: y0 + H + 0.9, z: cz - 1.4 }));
  }
  g.add(place(cupola(), { x: cx, y: y0 + H + 2.4, z: cz }));

  // --- entrance bay: projecting brick bay with a clock gable ------------
  const pw = 3.4, pz0 = cz + d / 2 - 1.6, pz1 = cz + d / 2 + 1.3;
  const pd = pz1 - pz0, pzc = (pz0 + pz1) / 2;
  const pH = H + 0.5;
  g.add(place(box(pw, pH, pd, brickWall), { x: cx, y: y0, z: pzc }));
  g.add(place(box(pw + 0.14, 0.45, pd + 0.14, mat(PALETTE.stone)), { x: cx, y: y0, z: pzc }));
  g.add(place(box(pw + 0.14, 0.18, pd + 0.14, stone), { x: cx, y: y0 + FLOOR - 0.05, z: pzc }));
  g.add(place(box(pw + 0.3, 0.3, pd + 0.3, stone), { x: cx, y: y0 + pH - 0.1, z: pzc }));
  // white quoins on the bay corners
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 6; i++) {
      g.add(place(box(0.32, 0.4, 0.32, stone), { x: cx + sx * (pw / 2 - 0.1), y: y0 + 0.5 + i * 0.95, z: pz1 - 0.1 }));
    }
  }
  g.add(place(gableRoof({ w: pw, d: pd, h: 2.3, overhang: 0.3, ridge: 'z', material: roofMat, gableMaterial: brickWall }), { x: cx, y: y0 + pH + 0.2, z: pzc }));
  g.add(place(clock(0.6), { x: cx, y: y0 + pH + 1.0, z: pz1 }));
  // double doors, fanlight, sign, upper window
  g.add(place(box(2.2, 2.9, 0.06, stone), { x: cx, y: y0 + 0.3, z: pz1 }));
  g.add(place(door({ w: 1.7, h: 2.3, color: PALETTE.navy, frame: PALETTE.white }), { x: cx, y: y0 + 0.3, z: pz1 + 0.02 }));
  g.add(place(box(0.05, 2.3, 0.16, mat(PALETTE.white)), { x: cx, y: y0 + 0.3, z: pz1 + 0.02 }));
  g.add(place(sign({ text: 'PRIMARY SCHOOL', w: 3.0, h: 0.55, bg: '#2d5e3e', fg: '#ffffff', depth: 0.1 }), { x: cx, y: y0 + FLOOR + 0.25, z: pz1 + 0.04 }));
  g.add(place(windowPanel({ w: 1.6, h: 1.4, frame: PALETTE.white }), { x: cx, y: y0 + FLOOR + 1.05, z: pz1 }));
  // porch canopy + steps
  g.add(place(box(2.8, 0.15, 1.2, stone), { x: cx, y: y0 + 2.75, z: pz1 + 0.6 }));
  g.add(place(stairs({ w: 2.6, h: 0.3, d: 0.9, steps: 2, material: mat(PALETTE.stone) }), { x: cx, y: y0, z: pz1 + 0.45 }));

  // side door onto the playground (+x end)
  const ex = cx + w / 2;
  g.add(place(door({ w: 1.2, h: 2.2, color: PALETTE.red, frame: PALETTE.white }), { x: ex, y: y0, z: cz + 2.05, ry: 90 }));
  g.add(place(box(1.0, 0.12, 1.8, stone), { x: ex + 0.5, y: y0 + 2.5, z: cz + 2.05 }));

  // --- front yard --------------------------------------------------------
  g.add(place(patch(2.4, 5 - pz1 - 0.9, 'paved'), { x: cx, y: y0, z: (pz1 + 0.9 + 5) / 2 }));
  g.add(place(patch(w - 0.6, 0.9, 'paved'), { x: cx, y: y0, z: cz + d / 2 + 0.45 }));
  // flagpole on a round plinth
  const fx = -8.0, fz = 3.4;
  g.add(place(cylinder(0.55, 0.65, 0.25, mat(PALETTE.concrete), 12), { x: fx, y: y0, z: fz }));
  g.add(place(cylinder(0.055, 0.08, 8.5, metal(PALETTE.steelLight), 8), { x: fx, y: y0 + 0.25, z: fz }));
  g.add(place(sphere(0.12, metal('#c9a43a'), 8), { x: fx, y: y0 + 8.75, z: fz }));
  g.add(place(box(1.9, 1.15, 0.03, surface('stripes', PALETTE.blue, { color2: PALETTE.white, size: 0.76 })), { x: fx + 0.98, y: y0 + 7.4, z: fz }));
  g.add(place(box(0.6, 0.48, 0.035, mat(PALETTE.red)), { x: fx + 0.33, y: y0 + 8.07, z: fz }));
  // low brick wall + hedges along the street with a gap for the path
  const wallMat = surface('brick', PALETTE.brickDark, { size: 1 });
  for (const [x0, x1] of [[-9.8, cx - 1.3], [cx + 1.3, 0.9]]) {
    g.add(place(box(x1 - x0, 0.55, 0.3, wallMat), { x: (x0 + x1) / 2, y: y0, z: 4.75 }));
    g.add(place(box(x1 - x0 + 0.06, 0.08, 0.38, stone), { x: (x0 + x1) / 2, y: y0 + 0.55, z: 4.75 }));
    g.add(place(hedge({ w: x1 - x0 - 0.2, h: 0.8, d: 0.5 }), { x: (x0 + x1) / 2, y: y0, z: 4.3 }));
  }
  for (const x of [cx - 1.3, cx + 1.3]) {
    g.add(place(box(0.45, 1.0, 0.45, wallMat), { x, y: y0, z: 4.75 }));
    g.add(place(sphere(0.2, stone, 8), { x, y: y0 + 1.15, z: 4.75 }));
  }
  g.add(place(sign({ text: 'TINY TOWN PRIMARY', w: 2.2, h: 0.55, bg: PALETTE.navy, fg: '#ffffff', depth: 0.08 }), { x: -1.4, y: y0 + 0.62, z: 4.92 }));
  g.add(place(tree({ kind: 'bush', h: 1.2, seed: 12 }), { x: -9.3, y: y0, z: 2.0 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 17 }), { x: -0.3, y: y0, z: 2.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 3 }), { x: -6.6, y: y0, z: 2.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 4 }), { x: -2.3, y: y0, z: 2.3 }));
  g.add(place(bench({ w: 1.5 }), { x: -2.0, y: y0, z: 3.6 }));
  g.add(place(bikeRack(4), { x: -6.6, y: y0, z: 3.6 }));
  [PALETTE.red, PALETTE.blue, PALETTE.yellow].forEach((c, i) => g.add(place(bike(c), { x: -6.6 - 0.825 + i * 0.55 + 0.27, y: y0, z: 3.6 })));
  g.add(place(streetLamp({ h: 3.8 }), { x: cx - 1.6, y: y0, z: 3.9, ry: 0 }));

  // --- playground (east half) -------------------------------------------
  const px0 = 0.95, px1 = 9.85, pcx = (px0 + px1) / 2, pdz = 9.7;
  g.add(place(patch(px1 - px0, pdz, 'asphalt', 0.04), { x: pcx, y: y0, z: 0 }));
  // painted basketball court at the back
  const cw = 7.9, cd = 5.0, ccx = 5.65, ccz = -2.2;
  g.add(place(decal(cw, cd, courtTexture()), { x: ccx, y: y0 + 0.05, z: ccz }));
  g.add(place(hoop(), { x: ccx - cw / 2 + 0.1, y: y0, z: ccz }));
  g.add(place(hoop(), { x: ccx + cw / 2 - 0.1, y: y0, z: ccz, ry: 180 }));
  // hopscotch next to the school
  g.add(place(decal(0.9, 3.4, hopscotchTexture(), true), { x: 2.45, y: y0 + 0.05, z: 2.6 }));
  // safety surface with play equipment
  const rx0 = 3.4, rx1 = 9.6, rz0 = 0.75, rz1 = 4.6;
  g.add(place(patch(rx1 - rx0, rz1 - rz0, mat('#c4573d', { roughness: 1 }), 0.07), { x: (rx0 + rx1) / 2, y: y0, z: (rz0 + rz1) / 2 }));
  g.add(place(box(rx1 - rx0 + 0.2, 0.15, 0.1, mat(PALETTE.wood)), { x: (rx0 + rx1) / 2, y: y0, z: rz0 - 0.05 }));
  g.add(place(slide(), { x: 4.3, y: y0 + 0.07, z: 1.7 }));
  g.add(place(swings(3.0, 2.3), { x: 7.9, y: y0 + 0.07, z: 3.7 }));
  g.add(place(climbingFrame(3, 2, 2, 0.65), { x: 8.4, y: y0 + 0.07, z: 1.55 }));
  g.add(place(seesaw(), { x: 6.2, y: y0 + 0.07, z: 1.5 }));
  // benches by the school wall, tree in the corner
  g.add(place(bench({ w: 1.5 }), { x: 1.45, y: y0, z: 2.6, ry: 90 }));
  // green wire fence round the playground with a gate on the street side
  g.add(place(fence({ w: px1 - px0 - 0.1, d: pdz - 0.1, h: 1.5, style: 'wire', color: '#2f7d4a', gap: 1.8, sides: ['front', 'back', 'right'] }), { x: pcx, y: y0, z: 0 }));
  g.add(place(fence({ w: 0.1, d: 4.6 - (cz + d / 2), h: 1.5, style: 'wire', color: '#2f7d4a', sides: ['left'] }), { x: px0 + 0.1, y: y0, z: (4.8 + cz + d / 2) / 2 + 0.05 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, place, group, mat, metal, textured, canvasTexture, signTexture,
  door, tree, hedge, bench, streetLamp, surface,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Three cube houses tipped onto a corner (body diagonal vertical) and balanced on
// hexagonal concrete stair pillars; a paved pedestrian walkway runs underneath.

const S = 4.4;                         // cube edge
const R = S * Math.sqrt(2 / 3);        // circumradius of the cube's hexagonal silhouette
const SPACING = S * Math.SQRT2 + 0.15; // neighbours meet edge to edge
const PILLAR_H = 3.3;
const PILLAR_R = 1.45;
const ROW_Z = -0.7;
const YELLOW = '#f4c51c';

// Cube face with a 2x2 window grid (the down-facing "walls").
function wallTexture() {
  return canvasTexture(256, 256, (ctx, W) => {
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = '#d9a90f';
    ctx.lineWidth = 3;
    for (let i = 1; i < 6; i++) {
      ctx.beginPath(); ctx.moveTo(0, (i * W) / 6); ctx.lineTo(W, (i * W) / 6); ctx.stroke();
    }
    const win = 82, gap = 26, o = (W - 2 * win - gap) / 2;
    for (const ix of [0, 1]) for (const iy of [0, 1]) {
      const x = o + ix * (win + gap), y = o + iy * (win + gap);
      ctx.fillStyle = '#f7f7f2';
      ctx.fillRect(x - 7, y - 7, win + 14, win + 14);
      const gr = ctx.createLinearGradient(x, y, x + win, y + win);
      gr.addColorStop(0, '#5f8fb8');
      gr.addColorStop(1, '#23405e');
      ctx.fillStyle = gr;
      ctx.fillRect(x, y, win, win);
      ctx.fillStyle = '#f7f7f2';
      ctx.fillRect(x + win / 2 - 3, y, 6, win);
      ctx.fillRect(x, y + win / 2 - 3, win, 6);
    }
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, W - 10);
  }, { key: 'cube-houses:wall', repeat: false });
}

// Cube face with cladding panels and one small window (the up-facing "roofs").
function roofTexture() {
  return canvasTexture(256, 256, (ctx, W) => {
    ctx.fillStyle = YELLOW;
    ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = '#cf9f0c';
    ctx.lineWidth = 3;
    for (let i = 1; i < 5; i++) {
      ctx.beginPath(); ctx.moveTo((i * W) / 5, 0); ctx.lineTo((i * W) / 5, W); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, (i * W) / 5); ctx.lineTo(W, (i * W) / 5); ctx.stroke();
    }
    const win = 60, x = (W - win) / 2;
    ctx.fillStyle = '#f7f7f2';
    ctx.fillRect(x - 7, x - 7, win + 14, win + 14);
    ctx.fillStyle = '#3d6a92';
    ctx.fillRect(x, x, win, win);
    ctx.fillStyle = '#9cc3e0';
    ctx.fillRect(x + 6, x + 6, 16, win - 12);
    ctx.strokeStyle = '#4a4a4a';
    ctx.lineWidth = 10;
    ctx.strokeRect(5, 5, W - 10, W - 10);
  }, { key: 'cube-houses:roof', repeat: false });
}

// Rotation that stands a cube on its (-,-,-) corner with one upper-ring corner pointing to +z,
// so from the street you see a window face below and two roof faces above.
function cubeRotation() {
  const up = new THREE.Vector3(0, 1, 0);
  const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(1, 1, 1).normalize(), up);
  const v = new THREE.Vector3(1, 1, -1).applyQuaternion(q);
  const a = Math.atan2(v.z, v.x) - Math.PI / 2;
  for (const ang of [a, -a]) {
    const qq = new THREE.Quaternion().setFromAxisAngle(up, ang).multiply(q);
    const t = new THREE.Vector3(1, 1, -1).applyQuaternion(qq);
    if (t.z > 0.99 * t.length() * Math.sqrt(2 / 3)) return qq;
  }
  return q;
}

function cubeHouse() {
  const wall = textured(wallTexture(), { roughness: 0.75 });
  const roof = textured(roofTexture(), { roughness: 0.75 });
  // BoxGeometry has 0..1 UVs per face. Slots: +x -x +y -y +z -z; the + faces end up on top.
  const m = new THREE.Mesh(new THREE.BoxGeometry(S, S, S), [roof, wall, roof, wall, roof, wall]);
  m.quaternion.copy(cubeRotation());
  m.position.y = (S * Math.sqrt(3)) / 2;
  // little glazed lantern on the top corner
  const cap = cylinder(0.05, 0.55, 0.45, mat('#f7f7f2'), 3);
  cap.position.y = S * Math.sqrt(3) - 0.42;
  return group(m, cap);
}

// Hexagonal concrete stair core with a front door and slit windows.
function pillar(n) {
  const concrete = mat(PALETTE.concrete);
  const apo = PILLAR_R * Math.cos(Math.PI / 6);
  const g = group(
    place(cylinder(PILLAR_R + 0.25, PILLAR_R + 0.25, 0.25, mat(PALETTE.concreteDark), 6), { ry: 30 }),
    place(cylinder(PILLAR_R, PILLAR_R, PILLAR_H, concrete, 6), { ry: 30 }),
    place(cylinder(PILLAR_R + 0.15, PILLAR_R, 0.35, mat('#d8d4ca'), 6), { y: PILLAR_H - 0.35, ry: 30 }),
  );
  g.add(place(door({ w: 0.95, h: 2.1, color: PALETTE.navy }), { y: 0.25, z: apo - 0.04 }));
  g.add(place(numberPlate(String(n)), { y: 2.55, z: apo }));
  const slit = mat(PALETTE.glassDark, { roughness: 0.25, metalness: 0.4 });
  for (const ang of [60, -60, 120, -120, 180]) {
    const r = THREE.MathUtils.degToRad(ang);
    g.add(place(box(0.32, 1.7, 0.06, slit), { x: Math.sin(r) * apo, y: 1.0, z: Math.cos(r) * apo, ry: ang }));
  }
  return g;
}

// Sign box with 0..1 UVs so the text fills the face (lib sign() shrinks on faces > 1 m).
function localSign(text, w, h, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, 0.1).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

function numberPlate(t) {
  return localSign(t, 0.4, 0.4, '#f7f7f2', '#222222');
}

function bike(color) {
  const tyre = mat(PALETTE.black);
  const frame = metal(color, { roughness: 0.5 });
  const wheel = new THREE.TorusGeometry(0.32, 0.04, 4, 10);
  const g = group();
  for (const x of [-0.5, 0.5]) {
    const w = new THREE.Mesh(wheel, tyre);
    w.position.set(x, 0.36, 0);
    g.add(w);
  }
  g.add(place(box(1.0, 0.06, 0.06, frame), { y: 0.62 }));
  g.add(place(box(0.06, 0.4, 0.06, frame), { x: -0.2, y: 0.36, rz: -20 }));
  g.add(place(box(0.06, 0.45, 0.06, frame), { x: 0.42, y: 0.4, rz: 15 }));
  g.add(place(box(0.25, 0.05, 0.1, mat(PALETTE.black)), { x: -0.22, y: 0.78 }));
  g.add(place(box(0.05, 0.05, 0.5, frame), { x: 0.48, y: 0.86 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = TILE;
  g.add(lot([2, 1], 'paved'));

  // pedestrian walkway under the cubes, kerbed planting strips either side
  g.add(place(patch(2 * half - 0.4, 4.6, 'cobbles'), { y: y0, z: ROW_Z }));
  g.add(place(box(2 * half - 0.4, 0.08, 0.12, mat('#e6e2d8')), { y: y0, z: ROW_Z + 2.36 }));
  g.add(place(box(2 * half - 0.4, 0.08, 0.12, mat('#e6e2d8')), { y: y0, z: ROW_Z - 2.36 }));
  // walkway paving bands
  const band = mat('#b25a3c');
  for (let x = -8.4; x <= 8.5; x += 2.1) g.add(place(box(0.35, 0.07, 4.4, band), { x, y: y0, z: ROW_Z }));

  // the cubes on their pillars
  for (let i = -1; i <= 1; i++) {
    const x = i * SPACING;
    g.add(place(pillar(i + 2), { x, y: y0, z: ROW_Z }));
    g.add(place(cubeHouse(), { x, y: y0 + PILLAR_H - 0.05, z: ROW_Z }));
  }

  // front pavement: door paths kept clear, planters with trees between them,
  // benches, lamps, a bike rack and the name sign
  const planter = mat(PALETTE.concreteDark);
  const soil = surface('grass', PALETTE.grass, { size: 2 });
  for (let i = -1; i <= 1; i++) g.add(place(patch(1.4, 2.6, 'paved'), { x: i * SPACING, y: y0, z: 3.4 }));
  for (const x of [-9.0, -2.6, 2.6, 9.0]) {
    g.add(place(box(1.6, 0.45, 1.3, planter), { x, y: y0, z: 4.0 }));
    g.add(place(box(1.4, 0.05, 1.1, soil), { x, y: y0 + 0.45, z: 4.0 }));
    g.add(place(tree({ kind: Math.abs(x) > 5 ? 'cone' : 'round', h: 3.4, seed: 30 + x }), { x, y: y0 + 0.45, z: 4.0 }));
  }
  g.add(place(bench({ w: 1.3 }), { x: -1.0, y: y0, z: 4.3 }));
  g.add(place(bench({ w: 1.3 }), { x: 1.0, y: y0, z: 4.3 }));
  for (const x of [-7.7, 7.7]) g.add(place(streetLamp({ h: 3.6 }), { x, y: y0, z: 4.6, ry: 90 }));
  // bike rack
  const rack = metal(PALETTE.steel);
  g.add(place(box(1.9, 0.08, 0.08, rack), { x: 4.7, y: y0 + 0.55, z: 2.35 }));
  [PALETTE.red, PALETTE.blue, PALETTE.green].forEach((c, i) => {
    g.add(place(bike(c), { x: 3.9 + i * 0.8, y: y0, z: 2.6, ry: 90, s: 0.85 }));
  });

  // name sign on two posts beside the walkway
  const post = metal(PALETTE.darkGrey);
  g.add(place(box(0.08, 1.2, 0.08, post), { x: -5.5, y: y0, z: 2.7 }));
  g.add(place(box(0.08, 1.2, 0.08, post), { x: -3.9, y: y0, z: 2.7 }));
  g.add(place(localSign('CUBE HOUSES', 1.9, 0.45, '#2b2b2b', YELLOW), { x: -4.7, y: y0 + 1.0, z: 2.72 }));

  // walkway furniture under the cubes
  for (const x of [-SPACING / 2, SPACING / 2]) {
    g.add(place(cylinder(0.7, 0.6, 0.5, planter, 6), { x, y: y0, z: ROW_Z - 1.5 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 50 + x }), { x, y: y0 + 0.5, z: ROW_Z - 1.5 }));
    g.add(place(cylinder(0.12, 0.12, 0.9, mat(PALETTE.darkGrey), 6), { x, y: y0, z: ROW_Z + 1.4 }));
  }

  // back: low hedge along the boundary
  g.add(place(hedge({ w: 2 * half - 0.6, h: 0.8, d: 0.6 }), { y: y0, z: -TILE / 2 + 0.35 }));
  return g;
}

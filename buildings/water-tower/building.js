import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, cone, sphere, place, pipe, beam, mat, metal, emissive, textured,
  canvasTexture, surface, door, windowPanel, fence, sign, tree, car, streetLamp, shade,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.

const PAINT = '#9fc6df';       // pale blue tank paint
const LEG = '#4f6b80';         // darker blue-grey steelwork
const INK = PALETTE.navy;      // logo lettering

// Tank side wrapped in a logo texture: four "TINY TOWN" copies, one facing
// each diagonal (= each iso camera). u = 0 is +z and runs towards +x.
function logoTexture() {
  return canvasTexture(1024, 224, (ctx, W, H) => {
    ctx.fillStyle = PAINT;
    ctx.fillRect(0, 0, W, H);
    // white trim bands top and bottom
    ctx.fillStyle = '#f4f6f7';
    ctx.fillRect(0, 0, W, H * 0.07);
    ctx.fillRect(0, H * 0.93, W, H * 0.07);
    ctx.fillStyle = shade(PAINT, -0.12);
    ctx.fillRect(0, H * 0.07, W, H * 0.015);
    ctx.fillRect(0, H * 0.915, W, H * 0.015);
    // faint vertical plate seams
    ctx.fillStyle = shade(PAINT, -0.05);
    for (let i = 0; i < 32; i++) ctx.fillRect((i * W) / 32, 0, 2, H);
    const copy = (cx) => {
      // water drop above the letters
      ctx.fillStyle = PALETTE.blue;
      ctx.beginPath();
      ctx.moveTo(cx, H * 0.12);
      ctx.bezierCurveTo(cx + 22, H * 0.24, cx + 18, H * 0.33, cx, H * 0.33);
      ctx.bezierCurveTo(cx - 18, H * 0.33, cx - 22, H * 0.24, cx, H * 0.12);
      ctx.fill();
      ctx.fillStyle = INK;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = 'bold 66px sans-serif';
      ctx.fillText('TINY', cx, H * 0.49);
      ctx.fillText('TOWN', cx, H * 0.77);
    };
    for (let k = 0; k < 4; k++) copy(((k + 0.5) * W) / 4);
  }, { key: 'water-tower:logo', repeat: false });
}

// Ellipsoidal bowl under the tank, from the tank wall (y = 0) down to the riser.
function bowl(R, depth, rMin, material) {
  const pts = [];
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const t = (i / n) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(rMin, R * Math.cos(t)), -depth * Math.sin(t)));
  }
  pts.reverse(); // lathe goes bottom -> top so normals face out
  return new THREE.Mesh(new THREE.LatheGeometry(pts, 32), material);
}

// Flat annulus with thickness (catwalk deck).
function ring(rIn, rOut, t, material, segments = 32) {
  const pts = [[rIn, 0], [rOut, 0], [rOut, t], [rIn, t], [rIn, 0]].map(([x, y]) => new THREE.Vector2(x, y));
  return new THREE.Mesh(new THREE.LatheGeometry(pts.reverse(), segments), material);
}

function torus(r, tube, material, y) {
  const geo = new THREE.TorusGeometry(r, tube, 5, 40);
  geo.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(geo, material);
  m.position.y = y;
  return m;
}

// Ladder between two points with rails offset sideways by `side` (a unit vector).
function ladder(a, b, side, material, { width = 0.5, step = 0.42 } = {}) {
  const g = new THREE.Group();
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), S = new THREE.Vector3(...side).multiplyScalar(width / 2);
  g.add(beam(A.clone().add(S), B.clone().add(S), 0.08, material));
  g.add(beam(A.clone().sub(S), B.clone().sub(S), 0.08, material));
  const n = Math.max(2, Math.round(A.distanceTo(B) / step));
  for (let i = 1; i < n; i++) {
    const p = A.clone().lerp(B, i / n);
    g.add(beam(p.clone().add(S), p.clone().sub(S), 0.05, material));
  }
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const H = TILE / 2;

  const paint = mat(PAINT, { roughness: 0.45, metalness: 0.15, flatShading: false });
  const paintDark = mat(shade(PAINT, -0.15), { roughness: 0.5, metalness: 0.15, flatShading: false });
  const legM = mat(LEG, { roughness: 0.5, metalness: 0.3 });
  const railM = mat(PALETTE.darkGrey, { roughness: 0.6 });
  const concrete = mat(PALETTE.concrete);

  // --- ground: grass lot, gravel compound, driveway --------------------------
  g.add(lot([1, 1], 'grass'));
  g.add(place(patch(8.6, 8.6, 'gravel'), { y: y0, z: -0.2 }));
  g.add(place(patch(2.6, 1.0, 'concrete'), { y: y0, z: 4.5 }));

  // --- tank geometry -----------------------------------------------------------
  const R = 3.7;                  // tank radius
  const yB = y0 + 15;             // tank wall bottom (catwalk level)
  const tH = 5;                   // tank wall height
  const yT = yB + tH;
  const riserR = 0.55;

  // wall with logo
  const sideGeo = new THREE.CylinderGeometry(R, R, tH, 32, 1, true);
  sideGeo.translate(0, tH / 2, 0);
  const side = new THREE.Mesh(sideGeo, textured(logoTexture(), { roughness: 0.45, metalness: 0.15, flatShading: false }));
  side.position.y = yB;
  g.add(side);
  // bulbous bottom
  g.add(place(bowl(R, 2.6, riserR + 0.1, paint), { y: yB }));
  // conical roof, vent cap, beacon
  g.add(place(cylinder(R + 0.08, R + 0.08, 0.18, paintDark, 32), { y: yT - 0.04 }));
  g.add(place(cylinder(0.55, R + 0.12, 1.7, paint, 32), { y: yT + 0.14 }));
  g.add(place(cylinder(0.55, 0.55, 0.35, paintDark, 16), { y: yT + 1.84 }));
  g.add(place(cone(0.8, 0.5, paintDark, 16), { y: yT + 2.19 }));
  g.add(place(cylinder(0.05, 0.06, 1.0, railM, 6), { y: yT + 2.6 }));
  g.add(place(sphere(0.2, emissive(PALETTE.red, 1.3), 8), { y: yT + 3.5 }));
  // roof hatch railing
  g.add(torus(1.25, 0.04, railM, yT + 1.85));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    g.add(place(box(0.06, 0.75, 0.06, railM), { x: Math.cos(a) * 1.25, y: yT + 1.15, z: Math.sin(a) * 1.25 }));
  }

  // --- catwalk (balcony) round the tank ------------------------------------------
  const cwOut = R + 0.85;
  g.add(place(ring(R - 0.1, cwOut, 0.14, mat(PALETTE.steelDark, { roughness: 0.6 })), { y: yB - 0.14 }));
  g.add(torus(cwOut - 0.05, 0.05, railM, yB + 1.0));
  g.add(torus(cwOut - 0.05, 0.035, railM, yB + 0.5));
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    g.add(place(box(0.07, 1.0, 0.07, railM), { x: Math.cos(a) * (cwOut - 0.05), y: yB, z: Math.sin(a) * (cwOut - 0.05) }));
  }
  // catwalk brackets
  for (let i = 0; i < 8; i++) {
    const a = ((i + 0.5) / 8) * Math.PI * 2;
    const c = Math.cos(a), s = Math.sin(a);
    g.add(beam([c * (R - 0.1), yB - 1.1, s * (R - 0.1)], [c * (cwOut - 0.1), yB - 0.14, s * (cwOut - 0.1)], 0.1, legM));
  }
  // cell antennas clamped to the railing
  for (const a of [Math.PI * 0.25, Math.PI * 1.0, Math.PI * 1.6]) {
    const c = Math.cos(a), s = Math.sin(a);
    g.add(place(box(0.35, 1.5, 0.18, mat(PALETTE.white)), { x: c * (cwOut + 0.1), y: yB + 0.3, z: s * (cwOut + 0.1), ry: -a * 180 / Math.PI + 90 }));
  }

  // --- four splayed legs with bracing ----------------------------------------------
  const foot = 3.3, top = R * 0.69; // leg x/z offsets at ground and at the tank
  const legAt = (sx, sz, y) => {
    const t = (y - y0) / (yB - y0);
    const o = foot + (top - foot) * t;
    return [sx * o, y, sz * o];
  };
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sx, sz] of corners) {
    g.add(place(box(1.0, 0.5, 1.0, concrete), { x: sx * foot, y: y0, z: sz * foot }));
    g.add(place(box(0.55, 0.12, 0.55, legM), { x: sx * foot, y: y0 + 0.5, z: sz * foot }));
    g.add(pipe(legAt(sx, sz, y0 + 0.5), legAt(sx, sz, yB + 0.4), 0.22, legM));
  }
  const levels = [y0 + 0.5, y0 + 5.4, y0 + 10.2, yB - 0.6];
  for (let l = 0; l < levels.length; l++) {
    for (let s = 0; s < 4; s++) {
      const [ax, az] = corners[s], [bx, bz] = corners[(s + 1) % 4];
      if (l > 0) g.add(pipe(legAt(ax, az, levels[l]), legAt(bx, bz, levels[l]), 0.1, legM));
      if (l < levels.length - 1) {
        g.add(beam(legAt(ax, az, levels[l]), legAt(bx, bz, levels[l + 1]), 0.09, legM));
        g.add(beam(legAt(bx, bz, levels[l]), legAt(ax, az, levels[l + 1]), 0.09, legM));
        // turnbuckle hub where the X crosses
        const m = legAt(ax, az, (levels[l] + levels[l + 1]) / 2), n = legAt(bx, bz, (levels[l] + levels[l + 1]) / 2);
        g.add(place(cylinder(0.14, 0.14, 0.2, legM, 8), { x: (m[0] + n[0]) / 2, y: m[1] - 0.1, z: (m[2] + n[2]) / 2 }));
      }
    }
  }

  // central riser pipe into the bowl
  const riserTop = yB - 2.5;
  g.add(place(cylinder(riserR, riserR, riserTop - y0, paintDark, 16), { y: y0 }));
  g.add(place(cylinder(riserR + 0.12, riserR + 0.12, 0.15, legM, 16), { y: y0 + 3.4 }));
  g.add(place(cylinder(riserR + 0.12, riserR + 0.12, 0.15, legM, 16), { y: y0 + 8.2 }));
  // overflow pipe down the back-left leg
  g.add(pipe([-R * 0.72 + 0.15, yB + 1.0, -R * 0.72 + 0.15], [-foot + 0.45, y0 + 0.6, -foot + 0.45], 0.09, mat(PALETTE.steel)));

  // --- ladders: up the front-right leg, then up the tank wall and roof -------------
  const out = new THREE.Vector3(1, 0, 1).normalize();
  const across = [out.z, 0, -out.x]; // perpendicular, horizontal
  const lb = legAt(1, 1, y0), lt = legAt(1, 1, yB - 0.14);
  const off = 0.42;
  g.add(ladder([lb[0] + out.x * off, y0, lb[2] + out.z * off], [lt[0] + out.x * off, yB + 1.0, lt[2] + out.z * off], across, railM));
  // safety cage hoops on the upper half
  for (let y = y0 + 4; y < yB - 0.3; y += 1.2) {
    const p = legAt(1, 1, y);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.03, 4, 12, Math.PI), railM);
    hoop.rotation.set(Math.PI / 2, 0, -Math.PI / 4);
    hoop.position.set(p[0] + out.x * (off + 0.05), y, p[2] + out.z * (off + 0.05));
    g.add(hoop);
  }
  // the wall/roof ladder sits on +x, between two logos
  const rw = R + 0.14;
  g.add(ladder([rw, yB, 0], [rw, yT, 0], [0, 0, 1], railM, { width: 0.45 }));
  g.add(ladder([R + 0.2, yT + 0.2, 0], [0.75, yT + 1.95, 0], [0, 0, 1], railM, { width: 0.45 }));

  // --- brick valve house under the tank ----------------------------------------------
  const brick = surface('brick', PALETTE.brick, { size: 1.5 });
  const vw = 2.6, vd = 2.2, vh = 2.6, vz = -0.3;
  g.add(place(box(vw, vh, vd, brick), { y: y0, z: vz }));
  g.add(place(box(vw + 0.3, 0.2, vd + 0.3, concrete), { y: y0 + vh, z: vz }));
  g.add(place(door({ w: 0.9, h: 2.0, color: PALETTE.green }), { x: -0.5, y: y0, z: vz + vd / 2 }));
  g.add(place(windowPanel({ w: 0.6, h: 0.6 }), { x: 0.65, y: y0 + 1.3, z: vz + vd / 2 }));
  g.add(place(windowPanel({ w: 0.7, h: 0.6 }), { x: vw / 2, y: y0 + 1.3, z: vz, ry: 90 }));
  g.add(place(box(0.6, 0.9, 0.3, mat(PALETTE.lightGrey)), { x: -vw / 2 - 0.15, y: y0 + 0.6, z: vz + 0.3 })); // electric box
  g.add(place(sign({ text: 'WATER WORKS', w: 1.6, h: 0.35, bg: PALETTE.blue, depth: 0.05 }), { x: 0.4, y: y0 + 2.15, z: vz + vd / 2 + 0.02 }));

  // --- yard: fence, gate, sign, van, lamp, greenery ----------------------------------
  g.add(place(fence({ w: TILE - 0.6, d: TILE - 0.6, h: 1.4, style: 'wire', gap: 2.6 }), { y: y0 }));
  for (const x of [-1.35, 1.35]) g.add(place(box(0.16, 1.7, 0.16, railM), { x, y: y0, z: H - 0.3 }));
  g.add(place(sign({ text: 'TINY TOWN WATER', w: 2.0, h: 0.5, bg: PALETTE.white, fg: INK, border: INK, depth: 0.06 }), { x: -2.6, y: y0 + 0.75, z: H - 0.2 }));
  g.add(place(car({ color: PALETTE.white, kind: 'van' }), { x: 1.1, y: y0 + 0.05, z: 2.4, s: 0.6 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 3.9, y: y0, z: 1.0, ry: 180 }));
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 7 }), { x: -4.0, y: y0, z: 0.4 }));
  g.add(place(tree({ kind: 'round', h: 4.0, seed: 12 }), { x: 0.6, y: y0, z: -4.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 3 }), { x: -3.9, y: y0, z: 3.7 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 5 }), { x: 3.9, y: y0, z: -2.0 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: -2.0, y: y0, z: -4.0 }));
  return g;
}

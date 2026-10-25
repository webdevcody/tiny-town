import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, sphere, extrude, place, group, mat, emissive, surface, textured,
  ShapeBuilder, tree, hedge, bench, chimney,
} from '../../src/lib/index.js';
import {
  COLORS, upperTexture, groundTexture, orielTexture, railTexture, friezeTexture, sunburstTexture, posterTexture,
} from './art.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Main block 8.4 x 6.2 m with rounded front corners, set back for a pavement.
const HW = 4.2;          // half width
const ZF = 2.2;          // front wall
const ZB = -4.0;         // back wall
const RC = 1.3;          // front corner radius
const GROUND = 3.6;      // ground storey height
const UPPER = 4;         // upper storeys (+ ground + mansard = 6 storeys)
const FH = 3;
const WALL_TOP = GROUND + UPPER * FH;   // 15.6
const ARC_SEG = 6;

/**
 * Outline of the main block offset by `o` (positive = outwards), as runs of
 * points walked clockwise seen from above (front left -> right, back round).
 * Each run carries the number of window bays it gets.
 */
function outline(o) {
  const hw = HW + o, zf = ZF + o, zb = ZB - o;
  const r = Math.max(0.15, RC + o);
  const cx = hw - r, cz = zf - r;
  const arc = (x0, a0, a1) => {
    const pts = [];
    for (let i = 0; i <= ARC_SEG; i++) {
      const a = a0 + ((a1 - a0) * i) / ARC_SEG;
      pts.push([x0 + r * Math.sin(a), cz + r * Math.cos(a)]);
    }
    return pts;
  };
  return [
    { pts: [[-cx, zf], [cx, zf]], bays: 3 },
    { pts: arc(cx, 0, Math.PI / 2), bays: 1 },
    { pts: [[hw, cz], [hw, zb]], bays: 2 },
    { pts: [[hw, zb], [-hw, zb]], bays: 4 },
    { pts: [[-hw, zb], [-hw, cz]], bays: 2 },
    { pts: arc(-cx, -Math.PI / 2, 0), bays: 1 },
  ];
}

function flat(runs) {
  const out = [];
  for (const run of runs) for (const p of run.pts) {
    const last = out[out.length - 1];
    if (!last || Math.hypot(last[0] - p[0], last[1] - p[1]) > 1e-6) out.push(p);
  }
  const f = out[0], l = out[out.length - 1];
  if (Math.hypot(f[0] - l[0], f[1] - l[1]) < 1e-6) out.pop();
  return out;
}

function runLength(pts) {
  let L = 0;
  for (let i = 1; i < pts.length; i++) L += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return L;
}

/**
 * Textured walls along runs. uSpan(run) = how many texture repeats across the
 * run, vSpan = repeats up the wall. Optional flat top in `topMat`.
 */
function walls(runs, h, material, { uSpan, vSpan = 1, topMat = null, closed = true } = {}) {
  const b = new ShapeBuilder();
  for (const run of runs) {
    const L = runLength(run.pts);
    const U = uSpan(run, L);
    let s = 0;
    for (let i = 1; i < run.pts.length; i++) {
      const [x1, z1] = run.pts[i - 1], [x2, z2] = run.pts[i];
      const len = Math.hypot(x2 - x1, z2 - z1);
      const u1 = (s / L) * U, u2 = ((s + len) / L) * U;
      b.quadUV([x1, 0, z1], [x2, 0, z2], [x2, h, z2], [x1, h, z1], [[u1, 0], [u2, 0], [u2, vSpan], [u1, vSpan]], 0);
      s += len;
    }
  }
  const mats = [material];
  if (topMat && closed) {
    const pts = flat(runs);
    const tris = THREE.ShapeUtils.triangulateShape(pts.map(([x, z]) => new THREE.Vector2(x, -z)), []);
    for (const [i, j, k] of tris) {
      const A = pts[i], B = pts[j], C = pts[k];
      const cross = (B[0] - A[0]) * (C[1] - A[1]) - (B[1] - A[1]) * (C[0] - A[0]);
      const up = cross < 0 ? [A, B, C] : [A, C, B];
      b.tri(...up.map(([x, z]) => [x, h, z]), 1);
    }
    mats.push(topMat);
  }
  return new THREE.Mesh(b.build(), mats);
}

/** Roof surface lofted between two outlines (same point count). */
function loft(lower, yl, upper, yu, material) {
  const b = new ShapeBuilder();
  const n = lower.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    b.quad([lower[i][0], yl, lower[i][1]], [lower[j][0], yl, lower[j][1]], [upper[j][0], yu, upper[j][1]], [upper[i][0], yu, upper[i][1]], 0);
  }
  return new THREE.Mesh(b.build(), material);
}

// ---------------------------------------------------------------------------
// wrought iron

/** Railing ribbon along an open polyline [[x,z]...] at height y, with a handrail. */
function railing(pts, y, h = 1.0) {
  const g = new THREE.Group();
  const pos = [], uv = [], idx = [];
  let s = 0;
  pts.forEach(([x, z], i) => {
    if (i) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]);
    pos.push(x, y, z, x, y + h, z);
    uv.push(s / 0.9, 0, s / 0.9, 1);
    if (i) { const a = 2 * (i - 1); idx.push(a, a + 2, a + 3, a, a + 3, a + 1); }
  });
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  g.add(new THREE.Mesh(geo, textured(railTexture(), { transparent: true, alphaTest: 0.35, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 })));
  const curve = new THREE.CatmullRomCurve3(pts.map(([x, z]) => new THREE.Vector3(x, y + h, z)), false, 'catmullrom', 0);
  g.add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(4, pts.length * 2), 0.055, 5, false), mat(COLORS.iron, { roughness: 0.5, metalness: 0.4 })));
  return g;
}

/** Half-ellipse points from the wall (z=0) out to +z, `w` wide, `d` deep. */
function bow(w, d, n = 10) {
  const pts = [];
  for (let i = 0; i <= n; i++) {
    const a = Math.PI - (i / n) * Math.PI;
    pts.push([(Math.cos(a) * w) / 2, Math.sin(a) * d]);
  }
  return pts;
}

/** Curved balcony in local coords: wall at z=0, sticks out to +z. */
function balcony(w, d) {
  const g = new THREE.Group();
  const curve = bow(w, d);
  const slab = curve.concat([[w / 2, -0.05], [-w / 2, -0.05]]);
  g.add(place(extrude(slab, 0.16, mat(COLORS.stone)), { y: -0.16 }));
  // curly stone consoles
  for (const x of [-w * 0.3, w * 0.3]) {
    g.add(place(box(0.16, 0.4, d * 0.7, mat(shade2)), { x, y: -0.56, z: d * 0.35 }));
  }
  g.add(railing(curve, 0, 0.95));
  return g;
}
const shade2 = '#c6b080';

// ---------------------------------------------------------------------------
// roof parts

/** Round "oeil-de-boeuf" dormer facing +z, front face at z=0. */
function dormer() {
  const w = 1.15, cheek = 0.75, depth = 1.6;
  const g = new THREE.Group();
  const wallM = mat(COLORS.wall);
  const zinc = mat(PALETTE.roofGreen, { roughness: 0.6, metalness: 0.2 });
  g.add(place(box(w, cheek, depth, wallM), { z: -depth / 2 }));
  const hood = new THREE.Mesh(new THREE.CylinderGeometry(w / 2 + 0.08, w / 2 + 0.08, depth + 0.1, 12, 1, false, -Math.PI / 2, Math.PI), [zinc, wallM]);
  hood.rotation.x = Math.PI / 2;
  hood.position.set(0, cheek, -depth / 2 + 0.05);
  g.add(hood);
  // round window in a stone ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.08, 6, 16), mat(COLORS.stone));
  ring.position.set(0, cheek * 0.85, 0.04);
  g.add(ring);
  const pane = new THREE.Mesh(new THREE.CircleGeometry(0.36, 16), mat(COLORS.glass, { roughness: 0.25, metalness: 0.4 }));
  pane.position.set(0, cheek * 0.85, 0.02);
  g.add(pane);
  g.add(place(box(0.05, 0.7, 0.04, mat(COLORS.frame)), { y: cheek * 0.85 - 0.35, z: 0.04 }));
  // little finial on the hood
  g.add(place(sphere(0.09, zinc, 6), { y: cheek + w / 2 + 0.02, z: 0 }));
  return g;
}

/** Art Nouveau lamp post: cast-iron shaft with two swan-neck arms and globes. */
function lampPost(h = 4) {
  const iron = mat(COLORS.ironGreen, { roughness: 0.5, metalness: 0.3 });
  const g = group(
    cylinder(0.2, 0.26, 0.5, iron, 8),
    place(cylinder(0.07, 0.11, h - 0.5, iron, 8), { y: 0.5 }),
  );
  for (const s of [-1, 1]) {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(0, h - 0.4, 0), new THREE.Vector3(s * 0.2, h + 0.5, 0), new THREE.Vector3(s * 0.65, h, 0));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.05, 5), iron));
    g.add(place(sphere(0.2, emissive('#ffe7a8', 0.7), 10), { x: s * 0.65, y: h - 0.4 }));
    g.add(place(cylinder(0.1, 0.06, 0.12, iron, 8), { x: s * 0.65, y: h - 0.22 }));
  }
  g.add(place(sphere(0.1, iron, 6), { y: h + 0.1 }));
  return g;
}

/** Parisian Morris advertising column. */
function morrisColumn() {
  const green = mat(COLORS.ironGreen, { roughness: 0.6 });
  const g = new THREE.Group();
  g.add(cylinder(0.62, 0.66, 0.35, green, 16));
  const drum = new THREE.CylinderGeometry(0.55, 0.55, 2.0, 16, 1, true).translate(0, 1.0, 0);
  g.add(place(new THREE.Mesh(drum, textured(posterTexture())), { y: 0.35 }));
  g.add(place(cylinder(0.68, 0.6, 0.25, green, 16), { y: 2.35 }));
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.62, 16, 6, 0, Math.PI * 2, 0, Math.PI / 2), green);
  cap.scale.y = 0.75;
  cap.position.y = 2.6;
  g.add(cap);
  g.add(place(sphere(0.1, mat(COLORS.gold, { metalness: 0.5, roughness: 0.4 }), 6), { y: 3.1 }));
  return g;
}

/** Stone urn with flowers. */
function urn(seed) {
  return group(
    cylinder(0.22, 0.16, 0.3, mat(COLORS.stone), 8),
    place(cylinder(0.38, 0.22, 0.4, mat(COLORS.stone), 10), { y: 0.3 }),
    place(tree({ kind: 'bush', h: 0.9, seed, color: '#c0505a' }), { y: 0.6 }),
  );
}

// ---------------------------------------------------------------------------

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const wallM = mat(COLORS.wall);
  const stoneM = mat(COLORS.stone);
  const stoneDarkM = mat(shade2);
  const upperM = textured(upperTexture());
  const groundM = textured(groundTexture());
  const orielM = textured(orielTexture());
  const friezeM = textured(friezeTexture());
  const roofTop = mat(PALETTE.roofGrey);

  const base = outline(0);
  const bays = (run) => run.bays / 3;  // textures hold 3 bays

  // --- walls -------------------------------------------------------------
  g.add(place(walls(base, GROUND, groundM, { uSpan: bays }), { y: y0 }));
  g.add(place(walls(base, UPPER * FH, upperM, { uSpan: bays, vSpan: UPPER / 2, topMat: roofTop }), { y: y0 + GROUND }));
  // plinth, stringcourse over the ground floor, mosaic frieze and cornice
  g.add(place(extrude(flat(outline(0.06)), 0.45, stoneDarkM), { y: y0 }));
  g.add(place(extrude(flat(outline(0.12)), 0.28, stoneM), { y: y0 + GROUND - 0.08 }));
  const friezeY = y0 + WALL_TOP;
  g.add(place(walls(outline(0.03), 0.75, friezeM, { uSpan: (r, L) => Math.max(1, Math.round(L / 2)), topMat: roofTop }), { y: friezeY }));
  g.add(place(extrude(flat(outline(0.15)), 0.12, stoneM), { y: friezeY + 0.75 }));
  g.add(place(extrude(flat(outline(0.38)), 0.22, stoneM), { y: friezeY + 0.87 }));
  const roofY = friezeY + 1.09;

  // --- mansard roof: steep slate lower slope, shallow zinc top -------------
  const slate = surface('shingles', '#5a6a7c', { size: 1.6 });
  const zincM = mat('#7e8a90', { roughness: 0.5, metalness: 0.3 });
  const mansH = 2.9, capH = 0.7;
  const r0 = flat(outline(0.3)), r1 = flat(outline(-0.85)), r2 = flat(outline(-2.0));
  g.add(loft(r0, roofY, r1, roofY + mansH, slate));
  g.add(loft(r1, roofY + mansH, r2, roofY + mansH + capH, zincM));
  g.add(place(extrude(r2, 0.02, zincM), { y: roofY + mansH + capH - 0.02 }));
  // zinc roll at the break of the mansard
  g.add(place(extrude(flat(outline(-0.8)), 0.12, mat(PALETTE.roofGreen, { roughness: 0.6, metalness: 0.2 })), { y: roofY + mansH - 0.06 }));
  // wrought-iron cresting along the roof top
  const crest = flat(outline(-2.05));
  g.add(railing(crest.concat([crest[0]]), roofY + mansH + capH, 0.45));

  // round dormers on the lower slope: placed where the slope is, facing out
  const slopeOff = (y) => 0.3 - (1.15 * y) / mansH;
  const dy = 0.35, dOff = slopeOff(dy) + 0.12;
  const dormers = [];
  for (const x of [-1.95, 1.95]) dormers.push([x, ZF + dOff, 0]);
  for (const z of [-0.5, -2.7]) { dormers.push([HW + dOff, z, 90]); dormers.push([-HW - dOff, z, -90]); }
  for (const x of [-3.15, -1.05, 1.05, 3.15]) dormers.push([x, ZB - dOff, 180]);
  for (const s of [-1, 1]) {
    const a = Math.PI / 4, rr = RC + dOff;
    dormers.push([s * (HW - RC + rr * Math.sin(a)), ZF - RC + rr * Math.cos(a), s * 45]);
  }
  for (const [x, z, ry] of dormers) g.add(place(dormer(), { x, y: roofY + dy, z, ry }));

  // chimney stacks with clay pots
  for (const s of [-1, 1]) {
    const cx = s * 2.6, cz = -2.5;
    const top = roofY + mansH + capH;
    g.add(place(chimney({ w: 0.8, d: 1.4, h: 1.6, material: surface('brick', PALETTE.brickDark, { size: 1 }) }), { x: cx, y: top - 0.6, z: cz }));
    for (const dz of [-0.4, 0, 0.4]) g.add(place(cylinder(0.12, 0.14, 0.4, mat(PALETTE.terracotta), 8), { x: cx, y: top + 1.0, z: cz + dz }));
  }

  // --- central oriel (bow window) over floors 2-5 --------------------------
  const ow = 2.5, od = 1.0;
  const orielPts = bow(ow, od, 10).map(([x, z]) => [x, ZF + z]);
  const orielRun = [{ pts: orielPts, bays: 3 }];
  const orielY = y0 + GROUND + 0.25;
  const orielH = WALL_TOP - GROUND - 0.25;
  g.add(place(walls(orielRun, orielH, orielM, { uSpan: () => 1, vSpan: orielH / FH, topMat: stoneM }), { y: orielY }));
  // corbel under the oriel: stepped stone brackets
  for (let i = 0; i < 3; i++) {
    const k = 1 - i * 0.25;
    const pts = bow(ow * k, od * k, 10).map(([x, z]) => [x, ZF + z]);
    g.add(place(extrude(pts.concat([[0, ZF - 0.01]]), 0.22, stoneDarkM), { y: orielY - 0.22 * (i + 1) }));
  }
  // cornice capping the oriel, balcony railing round its roof
  const orielCap = bow(ow + 0.3, od + 0.15, 10).map(([x, z]) => [x, ZF + z]);
  const capY = y0 + WALL_TOP;
  g.add(place(extrude(orielCap.concat([[0, ZF - 0.01]]), 0.3, stoneM), { y: capY }));
  g.add(railing(bow(ow + 0.1, od + 0.05, 10).map(([x, z]) => [x, ZF + z]), capY + 0.3, 0.9));

  // --- curved gable over the oriel, with sunburst mosaic --------------------
  const gw = 1.55, gH = 4.9, gz = ZF + 0.45, gDepth = 1.9;
  const shape = new THREE.Shape();
  shape.moveTo(-gw, 0);
  shape.lineTo(gw, 0);
  shape.lineTo(gw, 2.4);
  shape.bezierCurveTo(gw + 0.35, 3.0, gw * 0.55, 3.0, gw * 0.55, 3.6);
  shape.bezierCurveTo(gw * 0.55, 4.6, 0.25, gH, 0, gH);
  shape.bezierCurveTo(-0.25, gH, -gw * 0.55, 4.6, -gw * 0.55, 3.6);
  shape.bezierCurveTo(-gw * 0.55, 3.0, -gw - 0.35, 3.0, -gw, 2.4);
  shape.closePath();
  const gableGeo = new THREE.ExtrudeGeometry(shape, { depth: gDepth, bevelEnabled: false, curveSegments: 8 });
  // caps in cream, the curved top clad in green copper
  const gable = new THREE.Mesh(gableGeo, [wallM, mat(PALETTE.roofGreen, { roughness: 0.6, metalness: 0.2 })]);
  gable.position.set(0, capY + 0.3, gz - gDepth);
  g.add(gable);
  // moulded outline: a stone band just proud of the gable face
  const ePts = shape.getPoints(8).filter((p) => p.y > 0.01);
  const edgeCurve = new THREE.CatmullRomCurve3(ePts.map((p) => new THREE.Vector3(p.x, p.y, 0)), false, 'catmullrom', 0);
  g.add(place(new THREE.Mesh(new THREE.TubeGeometry(edgeCurve, 40, 0.1, 5), stoneM), { y: capY + 0.3, z: gz + 0.02 }));
  // french window onto the oriel balcony
  const gy = capY + 0.3;
  const winShape = new THREE.Shape();
  winShape.moveTo(-0.55, 0); winShape.lineTo(0.55, 0); winShape.lineTo(0.55, 1.75);
  winShape.absarc(0, 1.75, 0.55, 0, Math.PI, false); winShape.closePath();
  g.add(place(new THREE.Mesh(new THREE.ShapeGeometry(winShape, 8), mat(COLORS.frame)), { y: gy, z: gz + 0.01 }));
  const paneShape = new THREE.Shape();
  paneShape.moveTo(-0.42, 0.05); paneShape.lineTo(0.42, 0.05); paneShape.lineTo(0.42, 1.75);
  paneShape.absarc(0, 1.75, 0.42, 0, Math.PI, false); paneShape.closePath();
  g.add(place(new THREE.Mesh(new THREE.ShapeGeometry(paneShape, 8), emissive(COLORS.lit, 0.35)), { y: gy, z: gz + 0.02 }));
  g.add(place(box(0.06, 2.2, 0.03, mat(COLORS.frame)), { y: gy, z: gz + 0.03 }));
  // sunburst half-disc above
  const sun = new THREE.Mesh(new THREE.CircleGeometry(1.15, 18, 0, Math.PI), textured(sunburstTexture(), { roughness: 0.4, metalness: 0.2 }));
  sun.position.set(0, gy + 2.6, gz + 0.02);
  g.add(sun);
  g.add(place(box(2.5, 0.14, 0.14, stoneM), { y: gy + 2.53, z: gz + 0.05 }));
  // finial
  g.add(place(cylinder(0.08, 0.12, 0.4, mat(PALETTE.roofGreen), 6), { y: gy + gH - 0.05, z: gz - 0.1 }));
  g.add(place(sphere(0.16, mat(COLORS.gold, { metalness: 0.5, roughness: 0.4 }), 8), { y: gy + gH + 0.4, z: gz - 0.1 }));

  // --- wrought-iron balconies ------------------------------------------------
  // front bays either side of the oriel, every upper floor
  for (let f = 0; f < UPPER; f++) {
    const y = y0 + GROUND + f * FH;
    const deep = f % 2 === 0;
    for (const x of [-1.95, 1.95]) g.add(place(balcony(1.6, deep ? 0.7 : 0.45), { x, y: y + 0.02, z: ZF }));
  }
  // side bays, floors 2 and 4
  for (const f of [0, 2]) {
    const y = y0 + GROUND + f * FH;
    for (const z of [-0.33, -2.78]) {
      g.add(place(balcony(1.7, 0.6), { x: HW, y: y + 0.02, z, ry: 90 }));
      g.add(place(balcony(1.7, 0.6), { x: -HW, y: y + 0.02, z, ry: -90 }));
    }
  }
  // back: small balconies on floors 3 and 5
  for (const f of [1, 3]) {
    const y = y0 + GROUND + f * FH + 0.02;
    for (const x of f === 1 ? [-3.15, -1.05, 1.05, 3.15] : [-1.05, 1.05]) g.add(place(balcony(1.5, 0.5), { x, y, z: ZB, ry: 180 }));
  }
  // balconies wrapping the rounded corners, floors 2 and 5
  for (const f of [0, 3]) {
    const y = y0 + GROUND + f * FH + 0.02;
    for (const s of [-1, 1]) {
      const cx = s * (HW - RC), cz = ZF - RC;
      const inner = [], outer = [];
      for (let i = 0; i <= 8; i++) {
        const a = s * (0.12 + (i / 8) * (Math.PI / 2 - 0.24));
        inner.push([cx + RC * Math.sin(a), cz + RC * Math.cos(a)]);
        outer.push([cx + (RC + 0.65) * Math.sin(a), cz + (RC + 0.65) * Math.cos(a)]);
      }
      g.add(place(extrude(outer.concat(inner.slice().reverse()), 0.16, stoneM), { y: y - 0.16 }));
      g.add(railing([inner[0], ...outer, inner[8]], y, 0.95));
    }
  }

  // --- entrance: arched door under a Guimard-style glass marquise ------------
  const doorShape = new THREE.Shape();
  doorShape.moveTo(-0.75, 0); doorShape.lineTo(0.75, 0); doorShape.lineTo(0.75, 2.1);
  doorShape.absarc(0, 2.1, 0.75, 0, Math.PI, false); doorShape.closePath();
  g.add(place(new THREE.Mesh(new THREE.ExtrudeGeometry(doorShape, { depth: 0.12, bevelEnabled: false, curveSegments: 8 }), stoneDarkM), { y: y0, z: ZF }));
  const leaf = new THREE.Shape();
  leaf.moveTo(-0.6, 0); leaf.lineTo(0.6, 0); leaf.lineTo(0.6, 2.1);
  leaf.absarc(0, 2.1, 0.6, 0, Math.PI, false); leaf.closePath();
  g.add(place(new THREE.Mesh(new THREE.ShapeGeometry(leaf, 8), mat(COLORS.frame)), { y: y0, z: ZF + 0.13 }));
  const fanlight = new THREE.Mesh(new THREE.CircleGeometry(0.5, 12, 0, Math.PI), emissive(COLORS.lit, 0.4));
  fanlight.position.set(0, y0 + 2.1, ZF + 0.14);
  g.add(fanlight);
  g.add(place(box(0.05, 2.0, 0.04, mat(COLORS.gold, { metalness: 0.5 })), { y: y0, z: ZF + 0.15 }));
  // marquise: fan of glass on curly iron brackets
  const marq = new THREE.Mesh(new THREE.CircleGeometry(1.35, 16, 0, Math.PI), mat(PALETTE.glassTeal, { roughness: 0.2, metalness: 0.4, side: THREE.DoubleSide }));
  // the half-disc spans +y; tip it forward so it fans out over the steps
  marq.rotation.set(Math.PI / 2 - 0.18, 0, 0);
  marq.position.set(0, y0 + 3.15, ZF);
  g.add(marq);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1.35, 0.06, 5, 16, Math.PI), mat(COLORS.iron, { metalness: 0.4, roughness: 0.5 }));
  rim.rotation.set(Math.PI / 2 - 0.18, 0, 0);
  rim.position.copy(marq.position);
  g.add(rim);
  for (const s of [-1, 1]) {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(s * 0.9, y0 + 2.0, ZF), new THREE.Vector3(s * 0.95, y0 + 2.9, ZF + 0.3), new THREE.Vector3(s * 0.7, y0 + 2.95, ZF + 1.0));
    g.add(new THREE.Mesh(new THREE.TubeGeometry(c, 8, 0.06, 5), mat(COLORS.iron)));
  }
  // steps
  g.add(place(box(2.2, 0.12, 0.9, stoneM), { y: y0, z: ZF + 0.45 }));
  g.add(place(box(1.8, 0.12, 0.5, stoneM), { y: y0 + 0.12, z: ZF + 0.25 }));

  // --- street front: cobbles, lamp, Morris column, tree, bench, urns -------
  g.add(place(patch(10, 1.1, 'cobbles'), { y: y0, z: 4.45 }));
  g.add(place(patch(2.2, 1.0, 'cobbles'), { y: y0, z: ZF + 1.4 }));
  g.add(place(lampPost(4.2), { x: 2.3, y: y0, z: 4.3 }));
  g.add(place(morrisColumn(), { x: 4.05, y: y0, z: 3.95 }));
  g.add(place(box(1.1, 0.3, 1.1, stoneM), { x: -3.75, y: y0, z: 3.85 }));
  g.add(place(tree({ kind: 'round', h: 4.6, seed: 8 }), { x: -3.75, y: y0 + 0.3, z: 3.85 }));
  g.add(place(bench({ w: 1.6 }), { x: -2.3, y: y0, z: 4.3 }));
  for (const x of [-1.45, 1.45]) g.add(place(urn(x > 0 ? 4 : 5), { x, y: y0, z: ZF + 0.6 }));

  // --- side and back gardens ----------------------------------------------
  for (const s of [-1, 1]) {
    g.add(place(patch(0.7, 5.6, 'grass'), { x: s * 4.6, y: y0, z: -2.0 }));
    g.add(place(hedge({ w: 5.4, h: 0.9, d: 0.5 }), { x: s * 4.7, y: y0, z: -2.0, ry: 90 }));
  }
  g.add(place(patch(10, 0.9, 'grass'), { y: y0, z: -4.5 }));
  g.add(place(hedge({ w: 9.2, h: 1.0, d: 0.5 }), { y: y0, z: -4.7 }));
  for (const [x, seed] of [[-2.8, 21], [0.4, 22], [3.0, 23]]) {
    g.add(place(tree({ kind: 'bush', h: 1.3, seed }), { x, y: y0, z: -4.35 }));
  }
  return g;
}

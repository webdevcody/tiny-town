import * as THREE from 'three';
import { PALETTE, ShapeBuilder, mat, emissive, place, box, cylinder, textured, signTexture } from '../../src/lib/index.js';

// Local helpers for the monorail station.

/**
 * Sign board with 0..1 UVs so the text fills the whole face (the lib sign()
 * uses metre UVs, which shrinks text on faces over 1 m). Text faces +z.
 */
export function bigSign({ text, w, h, d = 0.15, bg = PALETTE.navy, fg = '#ffffff', font = 'bold', glow = 0.25 }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, font, width: tw, height: th });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Extrude a 2D [x, y] outline along z by `depth`, centred on z = 0. */
function extrudeXY(points, depth, material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -depth / 2);
  return new THREE.Mesh(geo, material);
}

/**
 * One monorail car, length along +x, nose at x = 0, flat coupling end at x = len.
 * Base (bottom of the skirt) at y = 0, body height h, width w.
 */
export function monorailCar({ len = 7.6, h = 3.1, w = 2.8, nose = 3.0, tip = 1.0, body, stripe, glassM, skirt }) {
  // x of the nose surface at height y (rounded bottom lip, long quarter-ellipse top)
  const noseX = (y) => {
    if (y <= tip) { const t = (tip - y) / tip; return 0.55 * (1 - Math.sqrt(Math.max(0, 1 - t * t))); }
    const t = (y - tip) / (h - tip);
    return nose * (1 - Math.sqrt(Math.max(0, 1 - t * t)));
  };
  // closed outline for the band y1..y2 (nose side sampled, flat tail end)
  const band = (y1, y2, inset = 0) => {
    const pts = [];
    const n = 8;
    for (let i = 0; i <= n; i++) { const y = y2 - ((y2 - y1) * i) / n; pts.push([noseX(y) + inset, y]); }
    pts.push([len, y1], [len, y2]);
    return pts;
  };
  const g = new THREE.Group();
  g.add(extrudeXY(band(0, h), w, body));
  g.add(extrudeXY(band(0, 0.5, 0.02), w + 0.04, skirt));
  g.add(extrudeXY(band(0.85, 1.2, 0.0), w + 0.04, stripe));
  g.add(extrudeXY(band(1.5, 2.5, -0.02), w + 0.06, glassM));
  g.add(extrudeXY(band(2.62, 2.72, 0.0), w + 0.04, stripe));
  // window mullions on both sides
  const mull = body;
  for (let x = 3.2; x < len - 0.3; x += 1.25) {
    for (const s of [-1, 1]) g.add(place(box(0.14, 1.0, 0.04, mull), { x, y: 1.5, z: s * (w / 2 + 0.04) }));
  }
  // platform-side (+z) and far-side doors
  for (const dx of [3.9, 6.4]) {
    for (const s of [-1, 1]) {
      g.add(place(box(1.2, 2.0, 0.06, mat(PALETTE.steelLight, { roughness: 0.4, metalness: 0.3 })), { x: dx, y: 0.75, z: s * (w / 2 + 0.03) }));
      g.add(place(box(0.5, 1.1, 0.08, glassM), { x: dx - 0.28, y: 1.45, z: s * (w / 2 + 0.04) }));
      g.add(place(box(0.5, 1.1, 0.08, glassM), { x: dx + 0.28, y: 1.45, z: s * (w / 2 + 0.04) }));
    }
  }
  // headlights at the nose
  for (const s of [-1, 1]) g.add(place(box(0.2, 0.18, 0.5, emissive('#fff6d0', 1.2)), { x: noseX(0.75) + 0.06, y: 0.66, z: s * 0.85 }));
  // teal roof stripe (reads from above) and equipment pods
  g.add(place(box(len - nose - 0.2, 0.04, 0.7, stripe), { x: (len + nose + 0.2) / 2, y: h }));
  g.add(place(box(2.6, 0.3, 1.5, mat(PALETTE.steelLight)), { x: len - 2.4, y: h }));
  g.add(place(box(1.0, 0.18, 1.1, mat(PALETTE.lightGrey)), { x: len - 4.6, y: h }));
  return g;
}

/**
 * Ramp ribbon following a list of centreline samples [{ x, z, y }], with
 * glass side panels, handrails and slim white support columns.
 */
export function curvedRamp(samples, { width = 1.4, thick = 0.3, deck, side, glassM, rail, colM, y0 = 0, columnEvery = 3 }) {
  const n = samples.length;
  const hw = width / 2;
  // horizontal normals
  const norms = samples.map((p, i) => {
    const a = samples[Math.max(0, i - 1)], b = samples[Math.min(n - 1, i + 1)];
    const tx = b.x - a.x, tz = b.z - a.z;
    const l = Math.hypot(tx, tz) || 1;
    return [-tz / l, tx / l];
  });
  const L = (i, off = 0) => [samples[i].x + norms[i][0] * (hw + off), samples[i].z + norms[i][1] * (hw + off)];
  const R = (i, off = 0) => [samples[i].x - norms[i][0] * (hw + off), samples[i].z - norms[i][1] * (hw + off)];
  const top = (i) => y0 + samples[i].y + 0.03;
  const bot = (i) => y0 + Math.max(0.01, samples[i].y - thick);

  const b = new ShapeBuilder();
  const gl = new ShapeBuilder();
  for (let i = 0; i < n - 1; i++) {
    const [l0x, l0z] = L(i), [l1x, l1z] = L(i + 1), [r0x, r0z] = R(i), [r1x, r1z] = R(i + 1);
    b.quad([l0x, top(i), l0z], [r0x, top(i), r0z], [r1x, top(i + 1), r1z], [l1x, top(i + 1), l1z], 0);
    b.quad([l0x, bot(i), l0z], [l1x, bot(i + 1), l1z], [r1x, bot(i + 1), r1z], [r0x, bot(i), r0z], 1);
    b.quad([l0x, bot(i), l0z], [l0x, top(i), l0z], [l1x, top(i + 1), l1z], [l1x, bot(i + 1), l1z], 1);
    b.quad([r0x, bot(i), r0z], [r1x, bot(i + 1), r1z], [r1x, top(i + 1), r1z], [r0x, top(i), r0z], 1);
    // glass balustrades just inside each edge
    for (const E of [L, R]) {
      const [ax, az] = E(i, -0.06), [bx, bz] = E(i + 1, -0.06);
      gl.quad([ax, top(i), az], [bx, top(i + 1), bz], [bx, top(i + 1) + 1.0, bz], [ax, top(i) + 1.0, az], 0);
    }
  }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(b.build(), [deck, side]));
  g.add(new THREE.Mesh(gl.build(), glassM));
  // handrails as thin boxes between samples
  for (const E of [L, R]) {
    for (let i = 0; i < n - 1; i++) {
      const [ax, az] = E(i, -0.06), [bx, bz] = E(i + 1, -0.06);
      const a = new THREE.Vector3(ax, top(i) + 1.05, az), c = new THREE.Vector3(bx, top(i + 1) + 1.05, bz);
      const len = a.distanceTo(c);
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, len + 0.04), rail);
      m.position.copy(a).add(c).multiplyScalar(0.5);
      m.lookAt(c);
      g.add(m);
    }
  }
  // support columns
  for (let i = columnEvery; i < n - 1; i += columnEvery) {
    const hgt = bot(i) - y0;
    if (hgt < 0.8) continue;
    g.add(place(cylinder(0.14, 0.16, hgt, colM, 8), { x: samples[i].x, y: y0, z: samples[i].z }));
  }
  return g;
}

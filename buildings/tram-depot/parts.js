// Local helpers for the tram depot: arched brick walls, vintage trams, track and
// overhead-wire runs. Kept in this folder so src/lib stays untouched.
import * as THREE from 'three';
import { PALETTE, place, box, group, mat, metal, emissive, textured, canvasTexture, signTexture, shade } from '../../src/lib/index.js';

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

// ---------------------------------------------------------------------------
// arched brick walls

function arcPoints(cx, cy, r, from, to, steps = 10) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const a = from + ((to - from) * i) / steps;
    pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
  }
  return pts;
}

/** Closed outline of an arch-topped opening (rect of height hr + semicircle). */
function archOutline(cx, y0, w, hr) {
  const r = w / 2;
  return [[cx - r, y0], [cx + r, y0], ...arcPoints(cx, y0 + hr, r, 0, Math.PI)];
}

/**
 * Brick wall in the local x/y plane, outer face at z = t, inner at z = 0.
 *   len, h          wall size; x runs -len/2..len/2
 *   gables          [{ c, w, h }] triangles on top (c = centre x)
 *   doors           [{ c, w, hr }] arch-topped notches from the ground
 *   windows         [{ c, y, w, hr }] arch-topped holes
 *   rounds          [{ c, y, r }] round holes
 */
export function brickWall({ len, h, t = 0.35, gables = [], doors = [], windows = [], rounds = [], material, reveal }) {
  const L = len / 2;
  const pts = [[-L, 0]];
  for (const d of [...doors].sort((a, b) => a.c - b.c)) {
    const r = d.w / 2;
    pts.push([d.c - r, 0], ...arcPoints(d.c, d.hr, r, Math.PI, 0), [d.c + r, 0]);
  }
  pts.push([L, 0], [L, h]);
  for (const gb of [...gables].sort((a, b) => b.c - a.c)) {
    pts.push([gb.c + gb.w / 2, h], [gb.c, h + gb.h], [gb.c - gb.w / 2, h]);
  }
  pts.push([-L, h]);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  for (const w of windows) shape.holes.push(new THREE.Path(archOutline(w.c, w.y, w.w, w.hr).map(([x, y]) => new THREE.Vector2(x, y))));
  for (const o of rounds) shape.holes.push(new THREE.Path(arcPoints(o.c, o.y, o.r, 0, Math.PI * 2, 16).slice(0, -1).map(([x, y]) => new THREE.Vector2(x, y))));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: t, bevelEnabled: false, curveSegments: 1 });
  return new THREE.Mesh(geo, [toMat(material), toMat(reveal ?? material)]);
}

/** U-shaped stone band round an arch (opening w, springing at hr), sticks out to +z by depth. */
export function archBand({ w, hr, band = 0.2, depth = 0.08, y0 = 0, material, keystone = true }) {
  const r = w / 2, R = r + band;
  // walk: outer left-bottom -> over the top -> right-bottom -> inner right -> back over -> inner left
  const pts = [[-R, y0], ...arcPoints(0, y0 + hr, R, Math.PI, 0, 12), [R, y0], [r, y0], ...arcPoints(0, y0 + hr, r, 0, Math.PI, 12), [-r, y0]];
  const shape = new THREE.Shape(pts.reverse().map(([x, y]) => new THREE.Vector2(x, y)));
  const m = toMat(material);
  const g = group(new THREE.Mesh(new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 1 }), m));
  if (keystone) g.add(place(box(band * 1.6, band * 1.9, depth + 0.06, m), { y: y0 + hr + r - band * 0.2 }));
  return g;
}

/** Arch-shaped flat panel with a 0..1 UV texture (glazing, fanlights). Faces +z. */
export function archPanel({ w, hr, material, y0 = 0 }) {
  const pts = archOutline(0, y0, w, hr);
  const shape = new THREE.Shape(pts.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ShapeGeometry(shape);
  const top = y0 + hr + w / 2;
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getX(i) + w / 2) / w, (pos.getY(i) - y0) / (top - y0));
  return new THREE.Mesh(geo, toMat(material));
}

/** Multi-pane industrial window texture (white glazing bars on dark glass). */
export function paneTexture(key, { cols = 4, rows = 7, glass = '#3a5470', bar = '#e9e4d6' } = {}) {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.fillStyle = glass;
    ctx.fillRect(0, 0, W, H);
    // a soft reflection streak
    ctx.fillStyle = 'rgba(160,200,230,0.25)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.75); ctx.lineTo(W * 0.6, H * 0.15); ctx.lineTo(W, H * 0.15); ctx.lineTo(W * 0.35, H * 0.75);
    ctx.fill();
    ctx.fillStyle = bar;
    const bw = 5;
    for (let i = 0; i <= cols; i++) ctx.fillRect((i * (W - bw)) / cols, 0, bw, H);
    for (let j = 0; j <= rows; j++) ctx.fillRect(0, (j * (H - bw)) / rows, W, bw);
  }, { key: 'tram-depot:pane:' + key, repeat: false });
}

/**
 * Sign board with 0..1 UVs so the text fills the whole face (the lib sign()
 * uses metre UVs and shrinks text on boards over 1 m). Text faces +z.
 */
export function bigSign({ text, w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null, double = false, glow = 0.15 }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// ---------------------------------------------------------------------------
// vintage tram (length along X, front = +x)

function tramSideTexture(lower, cream, key) {
  return canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = cream;
    ctx.fillRect(0, 0, W, H);
    // letterboard
    ctx.fillStyle = lower;
    ctx.fillRect(0, H * 0.06, W, H * 0.04);
    // windows
    const n = 7, x0 = W * 0.1, x1 = W * 0.9, gap = 7;
    const ww = (x1 - x0) / n;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = '#2b3a4c';
      ctx.fillRect(x0 + i * ww + gap / 2, H * 0.16, ww - gap, H * 0.36);
      ctx.fillStyle = 'rgba(170,205,230,0.35)';
      ctx.fillRect(x0 + i * ww + gap / 2, H * 0.16, ww - gap, H * 0.07);
    }
    // platform doors at each end
    ctx.fillStyle = '#2b3a4c';
    ctx.fillRect(W * 0.015, H * 0.16, W * 0.06, H * 0.62);
    ctx.fillRect(W * 0.925, H * 0.16, W * 0.06, H * 0.62);
    // waist panel
    ctx.fillStyle = lower;
    ctx.fillRect(W * 0.09, H * 0.58, W * 0.82, H * 0.36);
    ctx.strokeStyle = '#e2c25a';
    ctx.lineWidth = 3;
    ctx.strokeRect(W * 0.11, H * 0.63, W * 0.78, H * 0.26);
    // fleet crest
    ctx.fillStyle = '#e2c25a';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.76, H * 0.09, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = lower;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.76, H * 0.05, 0, Math.PI * 2);
    ctx.fill();
    // rubbing strip
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(0, H * 0.95, W, H * 0.05);
  }, { key: 'tram-depot:tramside:' + key, repeat: false });
}

function tramEndTexture(lower, cream, route, key) {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = cream;
    ctx.fillRect(0, 0, W, H);
    // destination box
    ctx.fillStyle = '#1d1d1d';
    ctx.fillRect(W * 0.18, H * 0.02, W * 0.64, H * 0.11);
    ctx.fillStyle = '#f5e7a0';
    ctx.font = `bold ${Math.round(H * 0.1)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(route, W / 2, H * 0.08);
    // three-pane windscreen
    ctx.fillStyle = '#2b3a4c';
    for (let i = 0; i < 3; i++) ctx.fillRect(W * (0.08 + i * 0.29), H * 0.18, W * 0.26, H * 0.34);
    // dash panel
    ctx.fillStyle = lower;
    ctx.fillRect(0, H * 0.57, W, H * 0.38);
    ctx.fillStyle = '#fff6c8';
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.72, H * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e2c25a';
    ctx.font = `bold ${Math.round(H * 0.14)}px sans-serif`;
    ctx.fillText(route, W * 0.5, H * 0.87);
    ctx.fillStyle = '#3a2a20';
    ctx.fillRect(0, H * 0.95, W, H * 0.05);
  }, { key: 'tram-depot:tramend:' + key + route, repeat: false });
}

/**
 * Single-deck vintage tram, ~8.6 m over the fenders, on two trucks.
 * Base at rail-top level (y = 0). Trolley pole rises towards +x to wireY.
 */
export function tram({ lower = '#7a1f22', cream = PALETTE.cream, route = '3', key = 'red', wireY = 4.6, pole = true } = {}) {
  const g = new THREE.Group();
  const L = 7.6, W = 2.1;
  const sideTex = tramSideTexture(lower, cream, key);
  const endTex = tramEndTexture(lower, cream, route, key);
  const sideM = textured(sideTex, { roughness: 0.55 });
  const endM = textured(endTex, { roughness: 0.55 });
  const roofM = mat(shade(cream, -0.25));
  const darkM = mat('#2a2a2c');
  const steelM = metal(PALETTE.steelDark);
  const bodyH = 2.45, bodyY = 0.75;

  // trucks + wheels
  for (const sx of [-1, 1]) {
    g.add(place(box(2.0, 0.5, 1.5, darkM), { x: sx * 2.3, y: 0.15 }));
    for (const wx of [-0.6, 0.6]) for (const sz of [-1, 1]) {
      const wg = new THREE.CylinderGeometry(0.36, 0.36, 0.14, 12).rotateX(Math.PI / 2);
      const wh = new THREE.Mesh(wg, steelM);
      wh.position.set(sx * 2.3 + wx, 0.36, sz * 0.62);
      g.add(wh);
    }
  }
  // underframe / lifeguard trays
  g.add(place(box(L - 0.2, 0.18, W - 0.2, darkM), { y: 0.6 }));
  for (const sx of [-1, 1]) g.add(place(box(0.5, 0.12, W - 0.4, darkM), { x: sx * (L / 2 + 0.3), y: 0.3 }));

  // body: sides on +-z, ends on +-x (BoxGeometry keeps 0..1 UVs per face)
  const bodyGeo = new THREE.BoxGeometry(L, bodyH, W).translate(0, bodyH / 2, 0);
  g.add(place(new THREE.Mesh(bodyGeo, [endM, endM, roofM, darkM, sideM, sideM]), { y: bodyY }));
  // open platform vestibules with rounded dash
  for (const sx of [-1, 1]) {
    const dash = new THREE.Mesh(new THREE.CylinderGeometry(W / 2 - 0.05, W / 2 - 0.05, 0.9, 12, 1, false, sx > 0 ? 0 : Math.PI, Math.PI).translate(0, 0.45, 0), mat(lower));
    dash.position.set(sx * L / 2, bodyY, 0);
    g.add(dash);
    g.add(place(box(0.08, 1.55, 0.08, steelM), { x: sx * (L / 2 + 0.85), y: bodyY + 0.9, z: 0.6 }));
    g.add(place(box(0.08, 1.55, 0.08, steelM), { x: sx * (L / 2 + 0.85), y: bodyY + 0.9, z: -0.6 }));
    // headlamp
    g.add(place(box(0.12, 0.22, 0.32, emissive('#fff2b0', 0.9)), { x: sx * (L / 2 + 1.0), y: bodyY + 0.5 }));
  }
  // roof canopy over body + platforms, clerestory with vents
  g.add(place(box(L + 2.2, 0.14, W + 0.12, roofM), { y: bodyY + bodyH }));
  g.add(place(box(L - 1.6, 0.32, 1.0, mat(shade(cream, -0.1))), { y: bodyY + bodyH + 0.14 }));
  g.add(place(box(L - 1.5, 0.06, 1.15, roofM), { y: bodyY + bodyH + 0.46 }));
  for (let i = 0; i < 5; i++) {
    for (const sz of [-1, 1]) g.add(place(box(0.5, 0.18, 0.04, mat('#3a4656')), { x: -2.2 + i * 1.1, y: bodyY + bodyH + 0.21, z: sz * 0.51 }));
  }
  // destination boxes on the canopy ends
  for (const sx of [-1, 1]) g.add(place(box(0.2, 0.32, 1.2, darkM), { x: sx * (L / 2 + 0.95), y: bodyY + bodyH + 0.14 }));

  // trolley pole: base on the roof, head on the contact wire
  const roofTop = bodyY + bodyH + 0.52;
  if (pole) {
    const bx = 0.6, by = roofTop;
    g.add(place(box(0.5, 0.25, 0.5, darkM), { x: bx, y: by }));
    const rise = wireY - (by + 0.25);
    const run = rise * 1.9;
    const a = new THREE.Vector3(bx, by + 0.2, 0), b = new THREE.Vector3(bx + run, wireY - 0.05, 0);
    const len = a.distanceTo(b);
    const pg = new THREE.CylinderGeometry(0.04, 0.06, len, 6);
    const pm = new THREE.Mesh(pg, mat('#1e1e1e'));
    pm.position.copy(a).add(b).multiplyScalar(0.5);
    pm.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(pm);
    g.add(place(box(0.25, 0.12, 0.15, mat('#1e1e1e')), { x: bx + run, y: wireY - 0.12 }));
  }
  g.userData.height = roofTop;
  return g;
}

// ---------------------------------------------------------------------------
// track and wire runs along a polyline of [x, z] points

/** Boxes laid along each segment of a polyline [[x, z]...], offset sideways by `off`. */
export function runAlong(points, { w, h, y = 0, off = 0, material }) {
  const g = new THREE.Group();
  const m = toMat(material);
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[i + 1];
    const dx = x2 - x1, dz = z2 - z1;
    const len = Math.hypot(dx, dz);
    const nx = -dz / len, nz = dx / len;
    const seg = box(len + 0.04, h, w, m);
    seg.position.set((x1 + x2) / 2 + nx * off, y, (z1 + z2) / 2 + nz * off);
    seg.rotation.y = Math.atan2(-dz, dx);
    g.add(seg);
  }
  return g;
}

/** Cubic bezier in x/z sampled into n segments. */
export function bezier(p0, p1, p2, p3, n = 10) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n, u = 1 - t;
    out.push([0, 1].map((k) => u * u * u * p0[k] + 3 * u * u * t * p1[k] + 3 * u * t * t * p2[k] + t * t * t * p3[k]));
  }
  return out;
}

/** Point on a polyline at a given x (first segment containing x). */
export function zAtX(points, x) {
  for (let i = 0; i < points.length - 1; i++) {
    const [x1, z1] = points[i], [x2, z2] = points[i + 1];
    if ((x >= x1 && x <= x2) || (x <= x1 && x >= x2)) return z1 + ((x - x1) / (x2 - x1 || 1)) * (z2 - z1);
  }
  return points[points.length - 1][1];
}

/** Vintage cast-iron traction pole: green, fluted base, ball finial. */
export function tractionPole({ h = 6, color = '#2f5a3a' } = {}) {
  const m = mat(color, { roughness: 0.6 });
  const g = new THREE.Group();
  const add = (geo, y) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.y = y;
    g.add(mesh);
  };
  add(new THREE.CylinderGeometry(0.2, 0.26, 1.0, 8).translate(0, 0.5, 0), 0);
  add(new THREE.CylinderGeometry(0.26, 0.26, 0.12, 8).translate(0, 0.06, 0), 1.0);
  add(new THREE.CylinderGeometry(0.1, 0.15, h - 1.0, 8).translate(0, (h - 1.0) / 2, 0), 1.0);
  add(new THREE.CylinderGeometry(0.17, 0.17, 0.1, 8).translate(0, 0.05, 0), h * 0.6);
  add(new THREE.SphereGeometry(0.17, 8, 6), h + 0.1);
  return g;
}

/** Thin wire (box) between two 3D points. */
export function wire(a, b, t = 0.06, material = '#1c1c1c') {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.BoxGeometry(t, len, t), toMat(material));
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  return m;
}

/** Old-fashioned lamp post with a square lantern. */
export function heritageLamp({ h = 3.8, color = '#2f5a3a' } = {}) {
  const m = mat(color, { roughness: 0.6 });
  return group(
    place(new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.6, 8).translate(0, 0.3, 0), m), {}),
    place(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.09, h - 0.6, 6).translate(0, (h - 0.6) / 2, 0), m), { y: 0.6 }),
    place(box(0.42, 0.06, 0.42, m), { y: h }),
    place(box(0.34, 0.5, 0.34, emissive('#ffe7a0', 0.8)), { y: h + 0.06 }),
    place(new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.3, 4).rotateY(Math.PI / 4).translate(0, 0.15, 0), m), { y: h + 0.56 })
  );
}

/** Round clock face (white dial, black hands) facing +z, 0..1 UVs. */
export function clock({ r = 0.45, key = 'tram-depot:clock' } = {}) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#2f5a3a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f6f1e0';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.fillRect(W / 2 + Math.cos(a) * W * 0.34 - 3, H / 2 + Math.sin(a) * H * 0.34 - 3, 6, 6);
    }
    ctx.strokeStyle = '#222'; ctx.lineWidth = 7; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W / 2, H * 0.2); ctx.stroke();
    ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2); ctx.lineTo(W * 0.7, H * 0.6); ctx.stroke();
  }, { key, repeat: false });
  const geo = new THREE.CircleGeometry(r, 20);
  return new THREE.Mesh(geo, textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.1, emissiveMap: tex }));
}

// Local helpers for the Domed Mosque: pointed arches, arcades, half-domes,
// minarets, the ablution fountain and the wall/drum window textures.
import * as THREE from 'three';
import {
  PALETTE, mat, metal, water, textured, canvasTexture, shade,
  box, cylinder, cone, sphere, dome, place, group,
} from '../../src/lib/index.js';

export const STONE = '#ebe4d2';
export const STONE_DARK = '#cbbf9f';
export const LEAD = '#6f88a6';
export const GOLD = '#d9b13b';
const GLASS = '#2d3f57';

export const stoneMat = () => mat(STONE);
export const trimMat = () => mat(STONE_DARK);
export const leadMat = () => mat(LEAD, { roughness: 0.55, metalness: 0.25, flatShading: false });
export const goldMat = () => metal(GOLD, { roughness: 0.3 });

// ---------------------------------------------------------------------------
// pointed arch outline

/** Points of a two-centred pointed arch from (-w/2, spring) over the apex to (w/2, spring). */
export function archPoints(w, spring, { k = 0.8, steps = 6 } = {}) {
  const half = w / 2;
  const r = w * k;
  const cx = -half + r;
  const a = Math.acos((half - r) / r); // angle where the left arc reaches x = 0
  const left = [];
  for (let i = 0; i <= steps; i++) {
    const t = Math.PI + (a - Math.PI) * (i / steps);
    left.push([cx + r * Math.cos(t), spring + r * Math.sin(t)]);
  }
  left[left.length - 1][0] = 0;
  const right = left.slice(0, -1).reverse().map(([x, y]) => [-x, y]);
  return [...left, ...right];
}

export function archApex(w, spring, k = 0.8) {
  const half = w / 2, r = w * k;
  return spring + r * Math.sin(Math.acos((half - r) / r));
}

/** Flat pointed-arch panel (door recess, niche), base at y = 0, facing +z, `t` thick. */
export function archPanel(w, spring, t, material) {
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  for (const [x, y] of archPoints(w, spring)) s.lineTo(x, y);
  s.lineTo(w / 2, 0);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 4 });
  return new THREE.Mesh(geo, typeof material === 'string' ? mat(material) : material);
}

/**
 * Arcade wall: `bays` pointed-arch openings, length bays*bay along X (centred),
 * height h, thickness t; front face at z = t/2.
 */
export function arcade({ bays, bay = 2, h, t = 0.35, open = 0.72, spring = 0.55, material }) {
  const L = bays * bay;
  const ow = bay * open;
  const hs = h * spring;
  const s = new THREE.Shape();
  s.moveTo(-L / 2, 0);
  for (let i = 0; i < bays; i++) {
    const cx = -L / 2 + bay * (i + 0.5);
    s.lineTo(cx - ow / 2, 0);
    for (const [x, y] of archPoints(ow, hs)) s.lineTo(cx + x, y);
    s.lineTo(cx + ow / 2, 0);
  }
  s.lineTo(L / 2, 0);
  s.lineTo(L / 2, h);
  s.lineTo(-L / 2, h);
  s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 4 });
  geo.translate(0, 0, -t / 2);
  return new THREE.Mesh(geo, material ?? stoneMat());
}

// ---------------------------------------------------------------------------
// domes

/** Half-dome (quarter sphere) on a half-round base wall; flat side in the x = 0 plane, bulges to +x. */
export function halfDome({ radius, base = 0.8, material, wallMat, segments = 16 }) {
  // built bulging to +z, then turned so the bulge points to +x
  const g = new THREE.Group();
  const baseGeo = new THREE.CylinderGeometry(radius, radius, base, segments, 1, true, -Math.PI / 2, Math.PI);
  baseGeo.translate(0, base / 2, 0);
  g.add(new THREE.Mesh(baseGeo, wallMat ?? stoneMat()));
  const sh = new THREE.SphereGeometry(radius * 1.04, segments, Math.max(4, segments / 3), 0, Math.PI, 0, Math.PI / 2);
  sh.scale(1, 0.95, 1);
  const shell = new THREE.Mesh(sh, material ?? leadMat());
  shell.position.y = base;
  g.add(shell);
  // tympanum wall closing the flat side
  const cap = new THREE.Mesh(new THREE.CircleGeometry(radius * 1.04, segments, 0, Math.PI), mat(STONE, { side: THREE.DoubleSide }));
  cap.position.y = base;
  g.add(cap);
  g.add(box(radius * 2, base, 0.05, STONE));
  g.rotation.y = Math.PI / 2;
  return group(g);
}

/** Gold finial with a crescent on top. Base at y = 0. */
export function finial(h = 1.6, s = 1) {
  const gm = goldMat();
  const g = group(
    cylinder(0.04 * s, 0.06 * s, h, gm, 6),
    place(sphere(0.16 * s, gm, 8), { y: h * 0.3 }),
    place(sphere(0.12 * s, gm, 8), { y: h * 0.55 }),
  );
  const arc = Math.PI * 1.45;
  const cr = new THREE.Mesh(new THREE.TorusGeometry(0.26 * s, 0.06 * s, 5, 12, arc), gm);
  cr.rotation.z = Math.PI / 2 - (arc + (Math.PI * 2 - arc) / 2);
  cr.position.y = h + 0.18 * s;
  g.add(cr);
  return g;
}

/** Small lead dome on a low octagonal drum, sitting on a roof. */
export function smallDome(r, { drum = 0.25 } = {}) {
  return group(
    cylinder(r * 0.92, r * 0.92, drum, stoneMat(), 8),
    place(dome({ radius: r, height: r * 0.9, material: leadMat(), segments: 12 }), { y: drum }),
    place(cylinder(0.03, 0.04, r * 0.6, goldMat(), 4), { y: drum + r * 0.85 }),
  );
}

// ---------------------------------------------------------------------------
// minaret

export function minaret({ base = 4.4, shaft = 8.5, upper = 3.2 } = {}) {
  const sm = stoneMat(), tm = trimMat();
  const g = new THREE.Group();
  g.add(box(1.7, base, 1.7, wallMaterial(1.7, base)));
  g.add(place(box(1.9, 0.25, 1.9, tm), { y: base }));
  let y = base + 0.25;
  // octagonal transition
  g.add(place(cylinder(0.62, 0.85, 0.7, sm, 8), { y }));
  y += 0.7;
  g.add(place(cylinder(0.56, 0.6, shaft, sm, 12), { y }));
  y += shaft;
  y = balcony(g, y, 1.0);
  g.add(place(cylinder(0.5, 0.53, upper, sm, 12), { y }));
  y += upper;
  y = balcony(g, y, 0.92);
  g.add(place(cylinder(0.46, 0.46, 1.1, sm, 12), { y }));
  // slit windows
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
    g.add(place(box(0.12, 0.55, 0.06, GLASS), { x: Math.sin(a) * 0.47, z: Math.cos(a) * 0.47, y: y + 0.3, ry: (a * 180) / Math.PI }));
  }
  y += 1.1;
  g.add(place(cylinder(0.62, 0.62, 0.12, tm, 12), { y }));
  y += 0.12;
  g.add(place(cone(0.6, 3.8, leadMat(), 12), { y }));
  g.add(place(finial(1.1, 0.8), { y: y + 3.6 }));
  g.userData.height = y + 3.6 + 1.4;
  return g;
}

function balcony(g, y, r) {
  const tm = trimMat();
  g.add(place(cylinder(r, 0.55, 0.55, tm, 12), { y }));
  y += 0.55;
  g.add(place(cylinder(r, r, 0.1, tm, 12), { y }));
  // pierced parapet: open-ended band + posts
  const band = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.45, 12, 1, true).translate(0, 0.225, 0), mat(STONE, { side: THREE.DoubleSide }));
  band.position.y = y + 0.1;
  g.add(band);
  g.add(place(cylinder(r + 0.03, r + 0.03, 0.08, tm, 12), { y: y + 0.55 }));
  return y + 0.1;
}

// ---------------------------------------------------------------------------
// ablution fountain (sadirvan)

export function fountain() {
  const sm = stoneMat(), tm = trimMat();
  const g = new THREE.Group();
  g.add(cylinder(1.75, 1.85, 0.2, tm, 8));
  g.add(place(cylinder(1.5, 1.5, 0.55, sm, 8), { y: 0.2 }));
  g.add(place(cylinder(1.32, 1.32, 0.04, water(), 8), { y: 0.7 }));
  // central marble drum with taps
  g.add(place(cylinder(0.65, 0.7, 1.25, mat('#f4f0e6'), 8), { y: 0.2 }));
  g.add(place(cylinder(0.72, 0.72, 0.1, tm, 8), { y: 1.45 }));
  g.add(place(sphere(0.35, mat('#f4f0e6'), 8), { y: 1.5 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.add(place(box(0.08, 0.08, 0.2, metal(GOLD)), { x: Math.sin(a) * 0.72, z: Math.cos(a) * 0.72, y: 0.95, ry: (a * 180) / Math.PI }));
    // canopy columns
    g.add(place(cylinder(0.08, 0.09, 2.4, sm, 6), { x: Math.sin(a) * 1.55, z: Math.cos(a) * 1.55, y: 0.2 }));
    // stone stools for washing
    g.add(place(cylinder(0.14, 0.14, 0.3, tm, 6), { x: Math.sin(a) * 1.9, z: Math.cos(a) * 1.9 }));
  }
  // octagonal canopy with wide eaves
  g.add(place(cylinder(2.0, 1.75, 0.22, mat(shade(STONE, -0.05)), 8), { y: 2.6 }));
  g.add(place(cone(2.05, 1.1, leadMat(), 8), { y: 2.82 }));
  g.add(place(finial(0.6, 0.6), { y: 3.85 }));
  return g;
}

// ---------------------------------------------------------------------------
// textures (UVs in metres; one texture tile = one window bay)

/** Mosque wall with two tiers of windows; one tile = bay x h metres. */
export function wallMaterial(bay, h, { lower = true } = {}) {
  const key = `domed-mosque:wall:${bay}:${h}:${lower}`;
  const tex = canvasTexture(128, Math.round((128 * h) / bay), (ctx, W, H) => {
    const px = W / bay; // pixels per metre
    const Y = (m) => H - m * px; // metres from bottom -> canvas y
    ctx.fillStyle = STONE;
    ctx.fillRect(0, 0, W, H);
    // stone courses
    ctx.strokeStyle = shade(STONE, -0.06);
    ctx.lineWidth = 1;
    for (let m = 0.5; m < h; m += 0.5) { ctx.beginPath(); ctx.moveTo(0, Y(m)); ctx.lineTo(W, Y(m)); ctx.stroke(); }
    // base course + cornice
    ctx.fillStyle = STONE_DARK;
    ctx.fillRect(0, Y(0.35), W, 0.35 * px);
    ctx.fillRect(0, Y(h), W, 0.3 * px);
    const archWin = (cx, bottom, w, hgt, col) => {
      const spring = bottom + hgt - w * 0.75;
      const pts = archPoints(w, spring);
      ctx.beginPath();
      ctx.moveTo((cx - w / 2) * px, Y(bottom));
      for (const [x, y] of pts) ctx.lineTo((cx + x) * px, Y(y));
      ctx.lineTo((cx + w / 2) * px, Y(bottom));
      ctx.closePath();
      ctx.fillStyle = col;
      ctx.fill();
    };
    const cx = bay / 2;
    if (lower && h > 4) {
      // lower window: rectangle with blind pointed tympanum above
      archWin(cx, 0.9, bay * 0.5, 2.1, STONE_DARK);
      ctx.fillStyle = GLASS;
      const ww = bay * 0.36;
      ctx.fillRect((cx - ww / 2) * px, Y(2.05), ww * px, 1.1 * px);
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect((cx - ww / 2 - 0.08) * px, Y(2.05), (ww + 0.16) * px, 0.08 * px);
      // string course
      ctx.fillStyle = STONE_DARK;
      ctx.fillRect(0, Y(h * 0.52), W, 0.14 * px);
      // upper arched window(s)
      archWin(cx, h * 0.6, bay * 0.36, h * 0.27, STONE_DARK);
      archWin(cx, h * 0.6 + 0.08, bay * 0.26, h * 0.27 - 0.16, GLASS);
    } else {
      // single small grilled window
      archWin(cx, h * 0.3, bay * 0.42, h * 0.45, STONE_DARK);
      archWin(cx, h * 0.3 + 0.08, bay * 0.3, h * 0.45 - 0.16, GLASS);
    }
  }, { key });
  tex.repeat.set(1 / bay, 1 / h);
  return textured(tex);
}

/** Dome drum with a ring of `count` arched windows; for a cylinder of radius r, height h. */
export function drumMaterial(r, h, count) {
  const circ = Math.PI * 2 * r;
  const key = `domed-mosque:drum:${r}:${h}:${count}`;
  const tex = canvasTexture(64, 96, (ctx, W, H) => {
    const bay = circ / count;
    const px = W / bay;
    const Y = (m) => H - m * (H / h);
    ctx.fillStyle = STONE;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = STONE_DARK;
    ctx.fillRect(0, Y(h), W, H * 0.08);
    ctx.fillRect(0, Y(0.15), W, H * 0.06);
    // buttress strip at the edge of each bay
    ctx.fillRect(0, 0, W * 0.1, H);
    const w = bay * 0.42;
    const pts = archPoints(w, h * 0.62);
    ctx.beginPath();
    ctx.moveTo((bay / 2 - w / 2) * px, Y(0.3));
    for (const [x, y] of pts) ctx.lineTo((bay / 2 + x) * px, Y(y));
    ctx.lineTo((bay / 2 + w / 2) * px, Y(0.3));
    ctx.closePath();
    ctx.fillStyle = GLASS;
    ctx.fill();
  }, { key });
  tex.repeat.set(count / circ, 1 / h);
  return textured(tex);
}

/** Large sign (0..1 UVs so text fills the face), faces +z. */
export function plaque(texture, w, h, d = 0.1) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const face = textured(texture);
  const side = mat(STONE_DARK);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

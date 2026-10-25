import * as THREE from 'three';
import { PALETTE, mat, cylinder, box, pipe, place } from '../../src/lib/index.js';

// Hemisphere shell keeping only the triangles for which keep(centroid) is true.
function shell(radius, keep, material) {
  const src = new THREE.SphereGeometry(radius, 64, 24, 0, Math.PI * 2, 0, Math.PI / 2).toNonIndexed();
  const p = src.attributes.position;
  const out = [];
  const c = new THREE.Vector3();
  for (let i = 0; i < p.count; i += 3) {
    c.set(
      (p.getX(i) + p.getX(i + 1) + p.getX(i + 2)) / 3,
      (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3,
      (p.getZ(i) + p.getZ(i + 1) + p.getZ(i + 2)) / 3,
    );
    if (!keep(c)) continue;
    for (let k = 0; k < 3; k++) out.push(p.getX(i + k), p.getY(i + k), p.getZ(i + k));
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(out, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

// Arc rail over the dome in the plane x = xOff, from the front base (+z) over
// the top to z = zEnd (negative = past the apex).
function slitRail(radius, xOff, zEnd, thick, material) {
  const rr = Math.sqrt(radius * radius - xOff * xOff);
  const end = Math.PI / 2 + Math.asin(Math.min(1, -zEnd / rr));
  const pts = [];
  for (let i = 0; i <= 24; i++) {
    const t = (end * i) / 24;
    pts.push(new THREE.Vector3(xOff, rr * Math.sin(t), rr * Math.cos(t)));
  }
  const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 32, thick, 4, false);
  return new THREE.Mesh(geo, material);
}

// Curved shutter panel lying on the sphere: |x| <= halfW, from z = zFrom
// (just past the apex) down the back to elevation `lowEl` (radians).
function shutter(radius, halfW, zFrom, lowEl, material) {
  const cols = 6, rows = 16;
  const pos = [];
  const pt = (i, j) => {
    const x = -halfW + (2 * halfW * i) / cols;
    const rr = Math.sqrt(radius * radius - x * x);
    const t0 = Math.PI / 2 + Math.asin(Math.min(1, -zFrom / rr));
    const t = t0 + ((Math.PI - lowEl - t0) * j) / rows;
    return [x, rr * Math.sin(t), rr * Math.cos(t)];
  };
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const a = pt(i, j), b = pt(i + 1, j), c = pt(i + 1, j + 1), d = pt(i, j + 1);
      pos.push(...a, ...b, ...c, ...a, ...c, ...d);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/**
 * White observatory dome on its drum, shutter slit open towards +z, with the
 * telescope inside pointing out of the slit. Base at y = 0.
 */
export function observatoryDome({ radius = 2.2, drumH = 2.2, slit = 1.15, altitude = 38, telescope = true, plinth = true } = {}) {
  const g = new THREE.Group();
  const white = mat(PALETTE.white, { roughness: 0.45, flatShading: false });
  const trim = mat(PALETTE.lightGrey, { roughness: 0.5, metalness: 0.2 });
  const dark = mat('#2c313b', { side: THREE.BackSide, roughness: 0.9, flatShading: false });
  const floorM = mat('#3d434d');
  const hw = slit / 2;
  const slitBack = -radius * 0.32;

  // drum: plinth, white wall, rotation rail
  if (plinth) g.add(cylinder(radius + 0.2, radius + 0.25, 0.35, mat(PALETTE.stoneDark), 32));
  g.add(cylinder(radius, radius, drumH, mat(PALETTE.white, { roughness: 0.6 }), 32));
  g.add(place(cylinder(radius + 0.08, radius + 0.08, 0.22, trim, 32), { y: drumH - 0.22 }));

  // drum windows (small portholes), door faces +z after the caller rotates
  const winM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  if (drumH > 1.5) for (const a of [-120, -60, 60, 120, 180]) {
    const rad = (a * Math.PI) / 180;
    g.add(place(box(0.55, 0.55, 0.12, winM), { x: Math.sin(rad) * radius, y: 1.15, z: Math.cos(rad) * radius, ry: a }));
  }

  // dome shell with the slit cut out, dark interior, shutter folded over the back
  const dg = new THREE.Group();
  dg.position.y = drumH;
  const inSlit = (c) => Math.abs(c.x) < hw && c.z > slitBack;
  dg.add(shell(radius, (c) => !inSlit(c), white));
  dg.add(shell(radius - 0.05, (c) => !inSlit(c), dark));
  dg.add(shutter(radius + 0.05, hw + 0.12, slitBack, 0.5, mat('#b4bac3', { roughness: 0.5, metalness: 0.3, flatShading: false })));
  for (const s of [-1, 1]) dg.add(slitRail(radius + 0.02, s * (hw + 0.04), slitBack, Math.min(0.09, radius * 0.04), trim));
  g.add(dg);

  // interior floor so the slit never shows through into the drum
  g.add(place(cylinder(radius - 0.06, radius - 0.06, 0.05, floorM, 32), { y: drumH }));
  if (!telescope) return g;

  // telescope: pier, fork, tube pointing out of the slit
  const ty = drumH + 0.05;
  const pierM = mat(PALETTE.steelDark, { roughness: 0.5, metalness: 0.4 });
  g.add(place(cylinder(0.3, 0.42, 0.5, pierM, 12), { y: ty }));
  g.add(place(cylinder(0.55, 0.55, 0.15, pierM, 16), { y: ty + 0.5 }));
  for (const s of [-1, 1]) g.add(place(box(0.14, 0.75, 0.4, mat(PALETTE.navy)), { x: s * 0.5, y: ty + 0.6 }));
  const pivot = new THREE.Vector3(0, ty + 1.15, 0);
  const alt = (altitude * Math.PI) / 180;
  const dir = new THREE.Vector3(0, Math.sin(alt), Math.cos(alt));
  const at = (t) => pivot.clone().addScaledVector(dir, t);
  const tubeM = mat('#f4f4f7', { roughness: 0.35, flatShading: false });
  const bandM = mat(PALETTE.navy, { roughness: 0.4 });
  g.add(pipe(at(-1.3), at(1.75), 0.36, tubeM));
  g.add(pipe(at(1.4), at(1.8), 0.42, bandM));         // dew shield / front ring
  g.add(pipe(at(-0.15), at(0.15), 0.4, bandM));         // trunnion band
  g.add(pipe(at(-1.4), at(-1.0), 0.4, bandM));          // mirror cell
  g.add(pipe(at(1.78), at(1.84), 0.3, mat('#111318')));  // aperture
  // finder scope on top of the tube
  const up = new THREE.Vector3(0, Math.cos(alt), -Math.sin(alt)).multiplyScalar(0.48);
  g.add(pipe(at(0.3).add(up), at(1.1).add(up), 0.1, tubeM));
  return g;
}

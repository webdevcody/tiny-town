import * as THREE from 'three';
import { box, cylinder, cone, place, pipe, beam, mat, emissive } from '../../src/lib/index.js';

export const COPPER = '#5fae94';
export const COPPER_DARK = '#468a74';
export const COPPER_LIGHT = '#7ec6ac';
export const GOLD = '#e9b43a';

// Lathe from a [y, r] profile, with vertical robe folds (radius rippled by angle)
// that fade out towards the top, squashed front-to-back by zScale.
function robeGeometry(profile, { segments = 28, folds = 9, depth = 0.07, foldTop = 5, zScale = 0.75 } = {}) {
  const pts = profile.map(([y, r]) => new THREE.Vector2(r, y));
  const geo = new THREE.LatheGeometry(pts, segments);
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const a = Math.atan2(z, x);
    const fade = Math.max(0, 1 - y / foldTop);
    const k = 1 + depth * fade * Math.cos(a * folds);
    p.setXYZ(i, x * k, y, z * k * zScale);
  }
  geo.computeVertexNormals();
  return geo;
}

function ball(r, material, scale = [1, 1, 1]) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), material);
  m.scale.set(...scale);
  return m;
}

/**
 * The copper lady, facing +z, feet at y = 0. Right arm (on -x) raises the torch,
 * left arm (on +x) holds the tablet. Roughly 11.7 m to the tip of the flame.
 */
export function statue() {
  const g = new THREE.Group();
  const cu = mat(COPPER, { roughness: 0.7 });
  const cuDark = mat(COPPER_DARK, { roughness: 0.75 });
  const cuLight = mat(COPPER_LIGHT, { roughness: 0.7 });
  const gold = mat(GOLD, { metalness: 0.5, roughness: 0.35 });
  const flameM = emissive('#ffcf4a', 0.9);

  // robe / body
  const robe = [
    [0, 0], [0, 1.08], [0.35, 1.02], [1.6, 0.9], [3.2, 0.8], [4.6, 0.76],
    [5.5, 0.8], [6.5, 0.84], [7.0, 0.74], [7.3, 0.42], [7.38, 0],
  ];
  g.add(new THREE.Mesh(robeGeometry(robe), cu));

  // toga sash from the left shoulder across the chest to the right hip
  g.add(beam([0.55, 6.95, 0.42], [-0.62, 4.3, 0.56], 0.34, cuDark));
  g.add(beam([0.55, 6.95, -0.42], [-0.5, 4.9, -0.56], 0.3, cuDark));
  // drape hanging over the left forearm
  g.add(place(box(0.5, 1.9, 0.5, cuDark), { x: 0.88, y: 3.9, z: 0.18, rz: 4 }));
  // right foot stepping forward under the hem
  g.add(place(box(0.42, 0.28, 0.7, cuDark), { x: -0.35, z: 0.75 }));

  // neck, head, hair bun
  g.add(place(cylinder(0.2, 0.24, 0.5, cu, 10), { y: 7.2 }));
  g.add(place(ball(0.42, cu, [0.95, 1.12, 1]), { y: 8.02 }));
  g.add(place(ball(0.22, cuDark), { y: 7.85, z: -0.36 }));
  // face: nose and brow
  g.add(place(box(0.1, 0.18, 0.12, cuLight), { y: 7.9, z: 0.42 }));

  // crown: diadem + seven rays fanned round the front
  g.add(place(cylinder(0.45, 0.43, 0.24, cuLight, 14), { y: 8.2 }));
  for (let i = 0; i < 7; i++) {
    const az = THREE.MathUtils.degToRad(-100 + (200 / 6) * i);
    const dir = new THREE.Vector3(Math.sin(az), 0.32, Math.cos(az)).normalize();
    const ray = cone(0.09, 0.95, cuLight, 4);
    ray.position.set(dir.x * 0.4, 8.32 + dir.y * 0.15, dir.z * 0.4);
    ray.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    g.add(ray);
  }

  // right arm raised: sleeve, forearm, hand
  const sh = [-0.7, 6.95, 0], el = [-0.92, 8.55, 0.05], wr = [-1.02, 9.95, 0.1];
  g.add(pipe(sh, el, 0.27, cu));
  g.add(pipe(el, wr, 0.2, cu));
  g.add(place(ball(0.3, cu), { x: sh[0], y: sh[1], z: sh[2] }));
  g.add(place(ball(0.25, cuDark, [1, 0.9, 1]), { x: el[0], y: el[1] - 0.2, z: el[2] })); // sleeve fold
  g.add(place(ball(0.2, cu), { x: wr[0], y: wr[1], z: wr[2] }));

  // torch: handle, gallery ring, gold cup and flame
  const tx = wr[0], tz = wr[2];
  g.add(place(cylinder(0.12, 0.1, 0.85, cuDark, 8), { x: tx, y: wr[1] - 0.25, z: tz }));
  g.add(place(cylinder(0.48, 0.48, 0.07, cuDark, 14), { x: tx, y: wr[1] + 0.58, z: tz }));
  g.add(place(cylinder(0.34, 0.16, 0.38, gold, 10), { x: tx, y: wr[1] + 0.6, z: tz }));
  g.add(place(cone(0.32, 0.85, flameM, 7), { x: tx, y: wr[1] + 0.98, z: tz }));
  g.add(place(cone(0.18, 0.55, emissive('#fff0a0', 1), 6), { x: tx + 0.1, y: wr[1] + 1.05, z: tz + 0.08 }));

  // left arm cradling the tablet
  const lsh = [0.7, 6.9, 0], lel = [0.96, 5.55, 0.12], lwr = [0.78, 6.05, 0.62];
  g.add(pipe(lsh, lel, 0.25, cu));
  g.add(pipe(lel, lwr, 0.19, cu));
  g.add(place(ball(0.28, cu), { x: lsh[0], y: lsh[1], z: lsh[2] }));
  g.add(place(ball(0.2, cu), { x: lel[0], y: lel[1], z: lel[2] }));
  const tablet = new THREE.Group();
  tablet.add(place(box(0.72, 1.35, 0.18, cuLight), { y: -0.67 }));
  tablet.add(place(box(0.5, 0.06, 0.04, cuDark), { y: 0.1, z: 0.1 })); // engraved line
  g.add(place(tablet, { x: 0.98, y: 6.6, z: 0.5, rz: -14, rx: -12, ry: -15 }));

  g.userData.height = wr[1] + 1.83;
  return g;
}

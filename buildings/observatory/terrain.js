import * as THREE from 'three';
import { PALETTE, shade, rng } from '../../src/lib/index.js';

// Deterministic value noise (no Math.random).
function hash(ix, iz) {
  let h = (ix * 374761393 + iz * 668265263) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x, z) {
  const ix = Math.floor(x), iz = Math.floor(z);
  const fx = x - ix, fz = z - iz;
  const sx = fx * fx * (3 - 2 * fx), sz = fz * fz * (3 - 2 * fz);
  const a = hash(ix, iz), b = hash(ix + 1, iz), c = hash(ix, iz + 1), d = hash(ix + 1, iz + 1);
  return (a + (b - a) * sx) + ((c + (d - c) * sx) - (a + (b - a) * sx)) * sz;
}
const smooth = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

/**
 * Rocky hill with a flat round summit.
 *   hillHeight(x, z) gives the terrain height (0 = lot top).
 * opts: cx, cz (summit centre), radius (flat top), H (height), half (tile half size),
 *       cut: optional (x, z, h) => h to carve things like a stair corridor.
 */
export function makeHill({ cx, cz, radius, H, half = 5, cut = null }) {
  return (x, z) => {
    const dx = x - cx, dz = z - cz;
    const ang = Math.atan2(dz, dx);
    // slope width: gentle towards the front (+z), steep cliffs at the back
    const front = Math.max(0, Math.sin(ang));
    const w = 1.15 + 0.9 * front + 0.25 * Math.sin(ang * 3 + 1.2);
    const rr = radius + 0.35 * (noise(Math.cos(ang) * 2 + 7, Math.sin(ang) * 2 + 3) - 0.5);
    const d = Math.hypot(dx, dz) - rr;
    let h;
    if (d <= 0) h = H;
    else {
      const t = d / w;
      h = H * (1 - smooth(t));
      // rocky ledges on the slope, zero at summit edge and foot
      const bump = Math.sin(Math.min(1, t) * Math.PI);
      h += bump * (noise(x * 1.7, z * 1.7) - 0.45) * 0.9;
      h = Math.round(h * 4) / 4 * 0.5 + h * 0.5; // terraced, chunky strata
    }
    // fade into the tile edge so the hill never pokes past the lot
    const edge = Math.min(half - Math.abs(x), half - Math.abs(z));
    h *= smooth(edge / 0.9);
    if (cut) h = cut(x, z, h);
    return Math.max(0, h);
  };
}

/**
 * Flat-shaded terrain mesh over the tile with per-face colours
 * (grass on gentle ground, bare rock on steep faces). Faces lying flat on
 * the lot are dropped so the lot's grass texture shows through.
 */
export function terrainMesh(heightAt, { half = 5, step = 0.25, y0 = 0, seed = 3 } = {}) {
  const n = Math.round((half * 2) / step);
  const pos = [], col = [];
  const grass = new THREE.Color(PALETTE.grass);
  const dry = new THREE.Color(shade(PALETTE.grass, 0.1)).lerp(new THREE.Color(PALETTE.dirt), 0.35);
  const rockA = new THREE.Color(PALETTE.stone);
  const rockB = new THREE.Color(PALETTE.stoneDark);
  const rockC = new THREE.Color('#8f8070');
  const r = rng(seed);
  const a = new THREE.Vector3(), b = new THREE.Vector3(), nrm = new THREE.Vector3();
  const tri = (p, q, s) => {
    if (p[1] < 0.02 && q[1] < 0.02 && s[1] < 0.02) return;
    a.set(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
    b.set(s[0] - p[0], s[1] - p[1], s[2] - p[2]);
    nrm.crossVectors(a, b).normalize();
    const avgH = (p[1] + q[1] + s[1]) / 3;
    let c;
    const jitter = r();
    if (nrm.y < 0.8) c = (jitter < 0.4 ? rockA : jitter < 0.75 ? rockC : rockB).clone();
    else if (avgH > 0.5) c = (jitter < 0.55 ? dry : rockA).clone().lerp(grass, 0.25);
    else c = grass.clone().lerp(dry, jitter * 0.6);
    c.offsetHSL(0, 0, (r() - 0.5) * 0.06);
    for (const pt of [p, q, s]) {
      pos.push(pt[0], pt[1] + y0 + 0.01, pt[2]);
      col.push(c.r, c.g, c.b);
    }
  };
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const x0 = -half + i * step, x1 = x0 + step;
      const z0 = -half + j * step, z1 = z0 + step;
      const p00 = [x0, heightAt(x0, z0), z0], p10 = [x1, heightAt(x1, z0), z0];
      const p01 = [x0, heightAt(x0, z1), z1], p11 = [x1, heightAt(x1, z1), z1];
      // counter-clockwise seen from above
      if ((i + j) % 2) { tri(p00, p01, p11); tri(p00, p11, p10); }
      else { tri(p00, p01, p10); tri(p10, p01, p11); }
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 0.95 }));
}

/** Chunky low-poly boulder, base roughly at y = 0. */
export function boulder(size, seed, material) {
  const r = rng(seed);
  const geo = new THREE.IcosahedronGeometry(size, 0);
  const p = geo.attributes.position;
  const salt = Math.floor(r() * 1000);
  for (let i = 0; i < p.count; i++) {
    // jitter by position so shared corners of the faces stay welded
    const k = 0.8 + hash(Math.round(p.getX(i) * 100) + salt, Math.round(p.getY(i) * 100) * 7 + Math.round(p.getZ(i) * 100) * 13) * 0.35;
    p.setXYZ(i, p.getX(i) * k, p.getY(i) * k * 0.7, p.getZ(i) * k);
  }
  geo.computeVertexNormals();
  geo.computeBoundingBox();
  const m = new THREE.Mesh(geo, material);
  m.position.y = -geo.boundingBox.min.y - size * 0.15; // sunk a little into the ground
  m.rotation.y = r() * Math.PI;
  const g = new THREE.Group();
  g.add(m);
  return g;
}

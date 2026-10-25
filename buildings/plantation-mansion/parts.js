// Local helpers for the plantation mansion: live oaks with Spanish moss and
// merged white balustrades.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PALETTE, rng, mat, cylinder, cone, beam, place } from '../../src/lib/index.js';

const MOSS = '#c6cbb2';

/**
 * Southern live oak: short fat trunk, long low limbs and a broad, flat,
 * lumpy crown with grey-green Spanish moss hanging underneath.
 * Origin = base of the trunk. Roughly 2*spread wide and `h` tall.
 */
export function liveOak({ h = 5, spread = 2.6, seed = 1 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const bark = mat('#4e3a28');
  const leaves = [mat(PALETTE.foliageDark), mat('#3a6e2a'), mat('#2a5520')];
  const moss = mat(MOSS);
  const trunkH = h * 0.38;
  g.add(cylinder(0.26, 0.4, trunkH, bark, 7));

  // big sprawling limbs
  const limbs = 4;
  for (let i = 0; i < limbs; i++) {
    const a = (i / limbs) * Math.PI * 2 + r() * 0.6;
    const len = spread * r.range(0.75, 0.95);
    g.add(beam([0, trunkH * 0.85, 0], [Math.cos(a) * len, trunkH + h * 0.18, Math.sin(a) * len], 0.2, bark));
  }

  // broad flattened crown: one big middle lump + a ring of lumps
  const lump = (x, y, z, rad, m) => {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(rad, 0), m);
    s.position.set(x, y, z);
    s.scale.set(1.15, 0.5, 1.15);
    s.rotation.y = r() * 3;
    g.add(s);
  };
  const crownY = trunkH + h * 0.32;
  lump(0, crownY + h * 0.1, 0, spread * 0.6, leaves[0]);
  const ring = 7;
  const mossAt = [];
  for (let i = 0; i < ring; i++) {
    const a = (i / ring) * Math.PI * 2 + r() * 0.4;
    const d = spread * r.range(0.55, 0.68);
    const x = Math.cos(a) * d, z = Math.sin(a) * d;
    const rad = spread * r.range(0.38, 0.46);
    lump(x, crownY + r.range(-0.15, 0.15), z, rad, leaves[i % 3]);
    const out = d + rad * 0.55;
    mossAt.push([Math.cos(a) * out, Math.sin(a) * out, crownY - rad * 0.2]);
    mossAt.push([Math.cos(a + 0.35) * d, Math.sin(a + 0.35) * d, crownY - rad * 0.35]);
    mossAt.push([x * 0.45, z * 0.45, crownY - rad * 0.4]);
  }

  // Spanish moss: long grey-green strands hanging from the crown
  for (const [x, z, y] of mossAt) {
    const len = r.range(1.3, 2.1);
    g.add(place(cone(r.range(0.13, 0.2), len, moss, 4), { x, y: y + 0.1, z, rx: 180, ry: r() * 90 }));
  }
  return g;
}

/**
 * White balustrade along +X, centred, base at y = 0.
 * Railings, bottom rail and balusters merged into one mesh.
 */
export function balustrade({ length, h = 1, spacing = 0.32, color = PALETTE.white } = {}) {
  const geos = [];
  const add = (w, hh, d, x, y) => geos.push(new THREE.BoxGeometry(w, hh, d).translate(x, y + hh / 2, 0));
  add(length, 0.1, 0.16, 0, h - 0.1);
  add(length, 0.08, 0.12, 0, 0.06);
  const n = Math.max(2, Math.round(length / spacing));
  for (let i = 0; i <= n; i++) add(0.06, h - 0.2, 0.06, -length / 2 + (length * i) / n, 0.12);
  return new THREE.Mesh(mergeGeometries(geos), mat(color));
}

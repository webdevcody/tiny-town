import * as THREE from 'three';
import { mat } from '../../src/lib/index.js';

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

// Round-headed arch outline with its base centre at the origin.
function archOutline(P, w, h) {
  const r = w / 2;
  P.moveTo(-r, 0);
  P.lineTo(r, 0);
  P.absarc(0, h - r, r, 0, Math.PI, false);
  P.lineTo(-r, 0);
  return P;
}

/**
 * Arched slab facing +z, base centre at the origin, `depth` thick towards +z.
 * With `t` > 0 it is a stone frame of that thickness around a w x h opening;
 * otherwise a solid arched panel (glass fill, blind arches).
 */
export function archSlab({ w, h, depth = 0.2, t = 0, material }) {
  const shape = archOutline(new THREE.Shape(), w + 2 * t, h + t);
  if (t > 0) shape.holes.push(archOutline(new THREE.Path(), w, h));
  const geom = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments: 8 });
  return new THREE.Mesh(geom, toMat(material));
}

// Rectangle with its four corners notched in by n: the classic postmodern re-entrant corner plan.
export function notched(w, d, n) {
  const x = w / 2, z = d / 2;
  return [
    [-x + n, z], [x - n, z], [x - n, z - n], [x, z - n], [x, -z + n], [x - n, -z + n],
    [x - n, -z], [-x + n, -z], [-x + n, -z + n], [-x, -z + n], [-x, z - n], [-x + n, z - n],
  ];
}

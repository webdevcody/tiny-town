import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, place, beam, mat, metal, emissive, textured, signTexture, canvasTexture,
} from '../../src/lib/index.js';

// reflector panels: concentric rings (v) and radial seams (u) on the lathe UVs
const PANELS = canvasTexture(256, 128, (ctx, w, h) => {
  ctx.fillStyle = PALETTE.white;
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = '#d6d3ca';
  for (const v of [0.35, 0.6, 0.82]) ctx.fillRect(0, Math.round(v * h) - 1, w, 2);
  for (let i = 0; i < 16; i++) ctx.fillRect(Math.round((i / 16) * w), Math.round(0.35 * h), 2, h);
}, { key: 'satellite-ground-station:panels' });
const DISH_WHITE = textured(PANELS, { side: THREE.DoubleSide, roughness: 0.55 });
const DISH_RIM = mat(PALETTE.offWhite, { roughness: 0.6 });
const STEEL_DARK = metal(PALETTE.steelDark);
const STEEL = metal(PALETTE.steelLight, { roughness: 0.5 });
const CONCRETE = mat(PALETTE.concrete);

/**
 * Steerable parabolic dish on a pedestal (wheel-and-track style yoke).
 * Base at y = 0. The reflector looks up, tilted to `elev` degrees above the
 * horizon and turned to `az` degrees about Y (0 = faces +Z).
 */
export function dishAntenna({ diameter = 6, elev = 45, az = 0, pedestalH = 3, depthRatio = 0.32, segments = 28, feed = 'quad' } = {}) {
  const R = diameter / 2;
  const depth = R * depthRatio;
  const f = (R * R) / (4 * depth);
  const g = new THREE.Group();

  // footing, pedestal, turntable
  g.add(cylinder(R * 0.42, R * 0.48, 0.35, CONCRETE, 12));
  g.add(place(cylinder(R * 0.22, R * 0.3, pedestalH - 0.35, mat(PALETTE.offWhite), 12), { y: 0.35 }));
  g.add(place(cylinder(R * 0.34, R * 0.34, 0.25, STEEL_DARK, 14), { y: pedestalH - 0.25 }));

  const azG = place(new THREE.Group(), { y: pedestalH, ry: az });
  g.add(azG);
  // yoke arms either side of the elevation axis (X)
  const armH = Math.max(0.6, R * 0.32);
  for (const sx of [-1, 1]) {
    azG.add(place(box(0.22, armH, R * 0.36, mat(PALETTE.offWhite)), { x: sx * R * 0.3 }));
  }
  azG.add(place(box(R * 0.66, 0.2, R * 0.4, mat(PALETTE.offWhite)), { y: 0 }));

  const tilt = place(new THREE.Group(), { y: armH * 0.8, rx: 90 - elev });
  azG.add(tilt);
  // elevation axle + hub + counterweight
  tilt.add(place(cylinder(0.12, 0.12, R * 0.7, STEEL_DARK, 8), { rz: 90, x: R * 0.35 }));
  tilt.add(place(box(R * 0.5, R * 0.22, R * 0.5, mat(PALETTE.lightGrey)), { y: -R * 0.08 }));
  tilt.add(place(box(R * 0.3, R * 0.18, R * 0.25, STEEL_DARK), { y: -R * 0.08, z: -R * 0.3 }));

  const hub = R * 0.16; // vertex height above the axle
  // back structure: frustum and radial ribs
  tilt.add(place(cylinder(R * 0.6, R * 0.25, hub + depth * 0.36, mat(PALETTE.lightGrey), 16), { y: 0 }));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    const rr = R * 0.97;
    tilt.add(beam([Math.cos(a) * R * 0.25, hub * 0.3, Math.sin(a) * R * 0.25], [Math.cos(a) * rr, hub + depth * 0.94 - 0.08, Math.sin(a) * rr], 0.09, STEEL));
  }

  // reflector
  const pts = [];
  const n = 8;
  for (let i = 0; i <= n; i++) {
    const r = Math.max(0.001, (R * i) / n);
    pts.push(new THREE.Vector2(r, (r * r) / (4 * f)));
  }
  const refl = new THREE.Mesh(new THREE.LatheGeometry(pts, segments), DISH_WHITE);
  refl.position.y = hub;
  tilt.add(refl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, Math.max(0.06, R * 0.025), 4, segments), DISH_RIM);
  rim.rotation.x = Math.PI / 2;
  rim.position.y = hub + depth;
  tilt.add(rim);

  // feed support struts + feed horn + subreflector at the focus
  const fy = hub + f * 0.92;
  const legs = feed === 'quad' ? 4 : 3;
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * Math.PI * 2 + Math.PI / 4;
    const rr = R * 0.82;
    const ly = hub + (rr * rr) / (4 * f);
    tilt.add(beam([Math.cos(a) * rr, ly, Math.sin(a) * rr], [Math.cos(a) * R * 0.08, fy, Math.sin(a) * R * 0.08], Math.max(0.07, R * 0.025), STEEL));
  }
  // Cassegrain horn rising from the vertex
  tilt.add(place(cylinder(R * 0.12, R * 0.07, R * 0.4, mat(PALETTE.lightGrey), 10), { y: hub }));
  tilt.add(place(cylinder(R * 0.16, R * 0.16, R * 0.05, mat(PALETTE.offWhite), 14), { y: fy }));
  return g;
}

/** Geodesic radome: faceted white ball on a short drum. Base at y = 0. */
export function radome({ radius = 2.6, drumR = 2.1, drumH = 1.4 } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(drumR + 0.25, drumR + 0.3, 0.3, CONCRETE, 18));
  g.add(place(cylinder(drumR, drumR, drumH, mat(PALETTE.offWhite), 18), { y: 0.3 }));
  g.add(place(cylinder(drumR + 0.08, drumR + 0.08, 0.15, STEEL_DARK, 18), { y: 0.3 + drumH - 0.15 }));
  const cy = 0.3 + drumH + Math.sqrt(radius * radius - drumR * drumR);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 2), mat(PALETTE.white, { roughness: 0.5 }));
  ball.position.y = cy;
  g.add(ball);
  // door into the drum (faces +Z)
  g.add(place(box(0.9, 1.1, 0.12, mat(PALETTE.steel)), { y: 0.3, z: drumR - 0.02 }));
  // aircraft warning light on the crown
  g.add(place(sphere(0.12, emissive(PALETTE.red, 1.2), 8), { y: cy + radius - 0.05 }));
  return g;
}

/** Flat sign with 0..1 UVs so text fills the face. Base at y = 0, text faces +Z. */
export function bigSign({ text, w, h, d = 0.12, bg = PALETTE.navy, fg = '#ffffff', border = null, texW = 512, texH = 96 }) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const plain = mat(bg);
  const face = textured(signTexture(text, { bg, fg, width: texW, height: texH, border }));
  return new THREE.Mesh(geo, [plain, plain, plain, plain, face, plain]);
}

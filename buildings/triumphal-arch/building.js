import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, box, cylinder, place, group, mat, emissive, surface, textured, shade,
  tree, streetLamp, bench, car, hedge, flag,
} from '../../src/lib/index.js';
import { STONE, reliefPanel, battlePanel, frieze, inscription, wreath } from './reliefs.js';
import { quadriga, BRONZE } from './quadriga.js';

// 1x1 tile (10 x 10 m). Front faces +z; the main arch runs north-south.
//
// A cobbled roundabout ring circles a raised island; the arch stands in the
// middle with smaller passages cut through its piers east-west.

const stone = mat(STONE, { roughness: 0.9 });
const stoneLight = mat(shade(STONE, 0.2), { roughness: 0.9 });
const stoneDark = mat(shade(STONE, -0.18), { roughness: 0.9 });

// Extrude a 2D THREE.Shape (x right, y up) by `depth` along +z, centred on z.
function extruded(shape, depth, material, curveSegments = 14) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: false, curveSegments });
  g.translate(0, 0, -depth / 2);
  return new THREE.Mesh(g, material);
}

// Flat textured panel with 0..1 UVs, facing +z, base at y = 0.
function panel(tex, w, h, depth = 0.06) {
  const g = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  const t = textured(tex, { roughness: 0.9 });
  return new THREE.Mesh(g, [stoneDark, stoneDark, stoneDark, stoneDark, t, stoneDark]);
}

// Box with 0..1 UVs per face (for friezes); mats in BoxGeometry order +x -x +y -y +z -z.
function uvBox(w, h, d, mats) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mats);
}

// Flat ring (annulus) lying on y = 0 with thickness t.
function ring(rIn, rOut, t, material, segments = 48) {
  const s = new THREE.Shape();
  s.absarc(0, 0, rOut, 0, Math.PI * 2, false);
  const hole = new THREE.Path();
  hole.absarc(0, 0, rIn, 0, Math.PI * 2, true);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: segments });
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, material);
}

// Ring sector between angles a0..a1 (radians, anticlockwise in x / -z).
function sector(rIn, rOut, a0, a1, t, material) {
  const s = new THREE.Shape();
  s.moveTo(Math.cos(a0) * rOut, Math.sin(a0) * rOut);
  s.absarc(0, 0, rOut, a0, a1, false);
  s.lineTo(Math.cos(a1) * rIn, Math.sin(a1) * rIn);
  s.absarc(0, 0, rIn, a1, a0, true);
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: t, bevelEnabled: false, curveSegments: 16 });
  g.rotateX(-Math.PI / 2);
  return new THREE.Mesh(g, material);
}

function disc(r, t, material, segments = 48) {
  return cylinder(r, r, t, material, segments);
}

function arch() {
  const g = new THREE.Group();
  const a = 1.0;          // main arch half-width
  const Wp = 1.6;         // pier width (x)
  const W = 2 * a + 2 * Wp; // 5.2
  const D = 2.6;          // depth (z)
  const Hb = 5.2;         // body height
  const Hs = 3.0;         // main arch springing
  const s = 0.48;         // side passage half-width
  const Hs2 = 1.9;        // side passage springing
  const px = a + Wp / 2;  // pier centre x

  // piers, each pierced by an east-west side passage
  const pierShape = new THREE.Shape();
  pierShape.moveTo(-D / 2, 0);
  pierShape.lineTo(-s, 0);
  pierShape.lineTo(-s, Hs2);
  pierShape.absarc(0, Hs2, s, Math.PI, 0, true);
  pierShape.lineTo(s, 0);
  pierShape.lineTo(D / 2, 0);
  pierShape.lineTo(D / 2, Hb);
  pierShape.lineTo(-D / 2, Hb);
  pierShape.closePath();
  for (const sx of [-1, 1]) {
    const pier = extruded(pierShape, Wp, stone);
    pier.rotation.y = Math.PI / 2;
    pier.position.x = sx * px;
    g.add(pier);
    // plinth around the pier foot (gap left for the side passage)
    for (const sz of [-1, 1]) {
      const pd = D / 2 - s + 0.1;
      g.add(place(box(Wp + 0.2, 0.45, pd, stoneDark), { x: sx * px, z: sz * (s + pd / 2 - 0.05) }));
      g.add(place(box(Wp + 0.24, 0.08, pd + 0.04, stoneLight), { x: sx * px, y: 0.45, z: sz * (s + pd / 2 - 0.05) }));
    }
  }

  // spandrel over the main arch, and the coffered vault soffit
  const span = new THREE.Shape();
  span.moveTo(-a, Hs);
  span.lineTo(-a, Hb);
  span.lineTo(a, Hb);
  span.lineTo(a, Hs);
  span.absarc(0, Hs, a, 0, Math.PI, false);
  span.closePath();
  g.add(extruded(span, D, stone, 20));
  const soffit = new THREE.Mesh(
    new THREE.CylinderGeometry(a - 0.02, a - 0.02, D - 0.02, 20, 1, true, Math.PI / 2, Math.PI).rotateX(Math.PI / 2),
    mat(shade(STONE, -0.3), { roughness: 0.95, side: THREE.BackSide })
  );
  soffit.position.y = Hs;
  g.add(soffit);

  // archivolt mouldings, keystones and impost bands on both faces
  const volt = new THREE.Shape();
  volt.absarc(0, 0, a + 0.22, 0, Math.PI, false);
  volt.lineTo(-a, 0);
  volt.absarc(0, 0, a, Math.PI, 0, true);
  volt.closePath();
  const sVolt = new THREE.Shape();
  sVolt.absarc(0, 0, s + 0.14, 0, Math.PI, false);
  sVolt.lineTo(-s, 0);
  sVolt.absarc(0, 0, s, Math.PI, 0, true);
  sVolt.closePath();
  for (const sz of [-1, 1]) {
    const zf = sz * (D / 2 + 0.04);
    g.add(place(extruded(volt, 0.08, stoneLight, 20), { y: Hs, z: zf }));
    g.add(place(box(0.34, 0.5, 0.2, stoneLight), { y: Hs + a - 0.12, z: sz * (D / 2 + 0.02) }));
    // impost band across both piers
    for (const sx of [-1, 1]) {
      g.add(place(box(Wp + 0.08, 0.18, 0.12, stoneLight), { x: sx * px, y: Hs - 0.18, z: sz * (D / 2 + 0.04) }));
      // tall sculpture group on the lower pier, battle scene above the impost
      g.add(place(panel(reliefPanel((sx + 1) + (sz + 1) / 2), 1.1, 1.95), { x: sx * px, y: 0.62, z: zf, ry: sz > 0 ? 0 : 180 }));
      g.add(place(panel(battlePanel((sx + 1) / 2 + sz + 1), 1.2, 1.1), { x: sx * px, y: Hs + 0.45, z: zf, ry: sz > 0 ? 0 : 180 }));
    }
    // spandrel roundels
    for (const sx of [-1, 1]) {
      const r = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.06, 14).rotateX(Math.PI / 2), stoneLight);
      r.position.set(sx * (a + 0.02), Hs + a + 0.62, sz * (D / 2 + 0.03));
      g.add(r);
    }
  }
  // side faces: passage archivolt + battle panel above it, impost band
  for (const sx of [-1, 1]) {
    const xf = sx * (W / 2 + 0.04);
    g.add(place(extruded(sVolt, 0.08, stoneLight, 14), { x: xf, y: Hs2, ry: 90 }));
    g.add(place(box(0.12, 0.18, D + 0.08, stoneLight), { x: xf, y: Hs - 0.18 }));
    g.add(place(panel(battlePanel(sx > 0 ? 0 : 3), 1.9, 1.15), { x: xf, y: Hs + 0.5, ry: sx * 90 }));
    // plinth faces on the ends
    g.add(place(box(0.2, 0.45, D + 0.2, stoneDark), { x: sx * (W / 2 + 0.05), z: 0 }));
  }

  // entablature: frieze band, dentils, cornice
  let y = Hb;
  const fFront = textured(frieze(512, 'front'), { roughness: 0.9 });
  const fSide = textured(frieze(256, 'side'), { roughness: 0.9 });
  g.add(place(uvBox(W + 0.04, 0.5, D + 0.04, [fSide, fSide, stone, stone, fFront, fFront]), { y }));
  y += 0.5;
  g.add(place(box(W + 0.16, 0.1, D + 0.16, stoneDark), { y }));
  y += 0.1;
  g.add(place(box(W + 0.36, 0.22, D + 0.36, stoneLight), { y }));
  y += 0.22;

  // attic: inscription front and back, wreaths at the ends
  const Ha = 1.3;
  const ins = textured(inscription('TINY TOWN', 'VICTORIAE · MMXXVI'), { roughness: 0.9 });
  const wr = textured(wreath(), { roughness: 0.9 });
  g.add(place(box(W, Ha, D, stone), { y }));
  for (const sz of [-1, 1]) {
    g.add(place(uvBox(W * 0.62, Ha * 0.78, 0.04, [stone, stone, stone, stone, ins, ins]), { y: y + Ha * 0.11, z: sz * (D / 2 + 0.02), ry: sz > 0 ? 0 : 180 }));
    // wreath roundels flanking the inscription
    for (const sx of [-1, 1]) {
      g.add(place(uvBox(0.72, 0.72, 0.04, [stone, stone, stone, stone, wr, wr]), { x: sx * (W / 2 - 0.5), y: y + 0.28, z: sz * (D / 2 + 0.02) }));
    }
  }
  for (const sx of [-1, 1]) {
    g.add(place(uvBox(0.04, 0.9, 0.9, [wr, wr, stone, stone, stone, stone]), { x: sx * (W / 2 + 0.02), y: y + 0.2 }));
  }
  y += Ha;
  g.add(place(box(W + 0.2, 0.16, D + 0.2, stoneLight), { y }));
  y += 0.16;

  // bronze quadriga on a stepped pedestal
  g.add(place(box(3.2, 0.22, 2.5, stoneDark), { y }));
  g.add(place(box(3.0, 0.08, 2.3, stoneLight), { y: y + 0.22 }));
  g.add(place(quadriga(), { y: y + 0.3, z: 0.05, s: 1.2 }));

  // eternal flame under the vault
  g.add(place(box(0.9, 0.12, 0.6, mat(PALETTE.stoneDark)), { y: 0 }));
  g.add(place(cylinder(0.16, 0.22, 0.25, BRONZE, 10), { y: 0.12 }));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.42, 6).translate(0, 0.21, 0), emissive('#ff9a2a', 1.4)), { y: 0.37 }));
  g.add(place(new THREE.Mesh(new THREE.ConeGeometry(0.07, 0.26, 6).translate(0, 0.13, 0), emissive('#ffe27a', 1.6)), { y: 0.4 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  // roundabout: kerbs, cobbled carriageway with a dashed lane line, approaches
  const R = 4.6, Ri = 3.3, yi = y0 + 0.16;
  const road = surface('cobbles', shade(PALETTE.asphalt, 0.12), { size: 1.4 });
  g.add(place(ring(Ri, R, 0.04, road, 64), { y: y0 }));
  const gap = Math.asin(1.3 / R);
  for (let q = 0; q < 4; q++) {
    const a0 = q * Math.PI / 2 + gap, a1 = (q + 1) * Math.PI / 2 - gap;
    g.add(place(sector(R, R + 0.14, a0, a1, 0.1, mat(PALETTE.concrete)), { y: y0 }));
  }
  for (const [x, z, w, d] of [[0, 4.8, 2.6, 0.5], [0, -4.8, 2.6, 0.5], [4.8, 0, 0.5, 2.6], [-4.8, 0, 0.5, 2.6]]) {
    g.add(place(box(w, 0.04, d, road), { x, y: y0, z }));
  }
  const lineM = mat(PALETTE.roadLine);
  for (let i = 0; i < 28; i++) {
    const t = (i / 28) * Math.PI * 2;
    const rm = (Ri + R) / 2;
    g.add(place(box(0.42, 0.02, 0.08, lineM), { x: Math.cos(t) * rm, y: y0 + 0.04, z: Math.sin(t) * rm, ry: -THREE.MathUtils.radToDeg(t) - 90 }));
  }

  // raised island: granite kerb, lawn ring, paved forecourt
  g.add(place(ring(Ri - 0.2, Ri, 0.16, mat(PALETTE.stone), 64), { y: y0 }));
  g.add(place(disc(Ri - 0.2, 0.12, surface('grass', PALETTE.grass, { size: 3 }), 48), { y: y0 + 0.04 }));
  g.add(place(box(2.4, 0.13, 2 * (Ri - 0.25), surface('paving', PALETTE.paving, { size: 2 })), { y: y0 + 0.04 }));
  g.add(place(box(5.8, 0.13, 3.3, surface('paving', PALETTE.paving, { size: 2 })), { y: y0 + 0.04 }));

  g.add(place(arch(), { y: yi }));

  // flowerbeds of red/white on the lawn, small bollards and lamps on the island
  for (const sz of [-1, 1]) {
    for (const sx of [-1, 1]) {
      g.add(place(hedge({ w: 0.9, h: 0.35, d: 0.5, color: PALETTE.foliageDark }), { x: sx * 2.15, y: yi, z: sz * 2.05, ry: sx * sz * 35 }));
      g.add(place(box(0.7, 0.12, 0.3, mat(PALETTE.red)), { x: sx * 2.15, y: yi + 0.35, z: sz * 2.05, ry: sx * sz * 35 }));
      g.add(place(tree({ kind: 'cone', h: 1.2, seed: 50 + sx + sz * 2, color: PALETTE.foliageDark }), { x: sx * 1.5, y: yi, z: sz * 2.6 }));
    }
  }

  // traffic on the roundabout (anticlockwise seen from above)
  const cars = [[40, PALETTE.blue, 'car'], [160, PALETTE.red, 'taxi'], [255, PALETTE.white, 'van'], [320, PALETTE.green, 'car']];
  for (const [deg, color, kind] of cars) {
    const t = THREE.MathUtils.degToRad(deg);
    const rm = (Ri + R) / 2;
    g.add(place(car({ color, kind }), { x: Math.cos(t) * rm, y: y0 + 0.04, z: Math.sin(t) * rm, ry: -deg - 90, s: 0.36 }));
  }

  // pavement corners: plane trees, lamps and benches
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(tree({ kind: 'round', h: 3.2, seed: 30 + sx * 3 + sz }), { x: sx * 4.15, y: y0, z: sz * 4.15 }));
    g.add(place(streetLamp({ h: 3.2 }), { x: sx * 4.65, y: y0, z: sz * 3.4, ry: sx > 0 ? 180 : 0 }));
  }
  for (const sx of [-1, 1]) g.add(place(bench({ w: 1.0 }), { x: sx * 3.4, y: y0, z: -4.6 }));

  // flagpoles at the ends of the island
  g.add(place(flag({ h: 3.6, color: PALETTE.blue, color2: PALETTE.white }), { x: 2.95, y: yi, z: 0, s: 0.8 }));
  g.add(place(flag({ h: 3.6, color: PALETTE.red, color2: PALETTE.white }), { x: -2.95, y: yi, z: 0, ry: 180, s: 0.8 }));
  return g;
}

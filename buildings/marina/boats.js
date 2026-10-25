import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, polygonArea, mat, metal, glass, surface,
  box, cylinder, beam, place, group, taperedBlock,
} from '../../src/lib/index.js';

// Boats for the marina. Every boat has its length along +X (bow at +X),
// origin at the centre of the waterline. Rotate with place(..., { ry }).

const toMat = (m) => (typeof m === 'string' ? mat(m) : m);

/** Deck outline (convex): flat transom at -X, pointed bow at +X. */
function outline(L, B, s = 1) {
  const l = (L / 2) * s, b = (B / 2) * s;
  const half = [
    [-l, b * 0.84], [-l * 0.2, b], [l * 0.4, b * 0.94], [l * 0.76, b * 0.6], [l, 0],
  ];
  const pts = [...half, ...half.slice(0, -1).reverse().map(([x, z]) => [x, -z])];
  return polygonArea(pts) < 0 ? pts.reverse() : pts;
}

/**
 * Tapered hull: narrow keel band (antifouling colour) up to a boot stripe,
 * flaring out to the deck outline. Groups: 0 bottom band, 1 topsides, 2 deck.
 */
export function hull({ L, B, h = 0.7, color = PALETTE.white, band = PALETTE.navy, deck = PALETTE.offWhite }) {
  const rings = [
    { y: 0, pts: outline(L * 0.86, B * 0.72, 1) },
    { y: h * 0.32, pts: outline(L * 0.93, B * 0.9, 1) },
    { y: h, pts: outline(L, B, 1) },
  ];
  const b = new ShapeBuilder();
  for (let r = 0; r < rings.length - 1; r++) {
    const lo = rings[r], hi = rings[r + 1];
    const n = lo.pts.length;
    for (let i = 0; i < n; i++) {
      const j = (i + 1) % n;
      b.quad(
        [lo.pts[i][0], lo.y, lo.pts[i][1]], [lo.pts[j][0], lo.y, lo.pts[j][1]],
        [hi.pts[j][0], hi.y, hi.pts[j][1]], [hi.pts[i][0], hi.y, hi.pts[i][1]], r
      );
    }
  }
  const top = rings[2].pts;
  b.poly(top.map(([x, z]) => [x, h, z]), 2);
  const mesh = new THREE.Mesh(b.build(), [toMat(band), toMat(color), toMat(deck)]);
  return mesh;
}

const sailMat = () => mat(PALETTE.white, { side: THREE.DoubleSide, roughness: 0.7 });

/** Flat triangle (double sided) in the X/Y plane. */
function triangle(a, b, c, material) {
  const s = new ShapeBuilder();
  s.tri(a, b, c, 0);
  return new THREE.Mesh(s.build(), material);
}

/**
 * Sailing yacht. sail: 'up' (main + jib hoisted) or 'furled' (cover on the boom).
 */
export function sailboat({ L = 4.6, B = 1.8, color = PALETTE.white, band = PALETTE.navy, cover = PALETTE.blue, sail = 'furled', mastH = 6.5, swing = 22 } = {}) {
  const h = 0.62;
  const g = group(hull({ L, B, h, color, band, deck: PALETTE.offWhite }));
  const teak = surface('planks', PALETTE.woodLight, { size: 1 });
  // cockpit (teak, recessed look) and coachroof with dark portholes
  g.add(place(box(L * 0.24, 0.05, B * 0.56, teak), { x: -L * 0.3, y: h }));
  g.add(place(box(L * 0.24 + 0.1, 0.22, 0.06, PALETTE.offWhite), { x: -L * 0.3, y: h, z: B * 0.3 }));
  g.add(place(box(L * 0.24 + 0.1, 0.22, 0.06, PALETTE.offWhite), { x: -L * 0.3, y: h, z: -B * 0.3 }));
  const cw = L * 0.34, cd = B * 0.58;
  g.add(place(taperedBlock({ w: cw, d: cd, h: 0.36, topW: cw * 0.86, topD: cd * 0.82, material: mat(PALETTE.white) }), { x: -L * 0.02, y: h }));
  g.add(place(box(cw * 0.7, 0.1, cd + 0.02, mat(PALETTE.window, { roughness: 0.3 })), { x: -L * 0.02, y: h + 0.14 }));
  // mast, boom, stays
  const mx = L * 0.1, deckY = h + 0.36;
  const al = metal(PALETTE.aluminium);
  g.add(place(cylinder(0.05, 0.07, mastH, al, 6), { x: mx, y: deckY }));
  g.add(place(box(0.5, 0.04, 0.04, al), { x: mx, y: deckY + mastH * 0.62 }));
  const boomY = deckY + 0.75, boomEnd = -L * 0.4;
  // boom (and mainsail) swing out to one side when the sail is up, so the
  // sail reads from every angle instead of only side-on
  const rig = place(group(beam([0, boomY, 0], [boomEnd - mx, boomY, 0], 0.07, al)), { x: mx, ry: sail === 'up' ? swing : 0 });
  g.add(rig);
  const wire = mat(PALETTE.darkGrey);
  g.add(beam([mx, deckY + mastH, 0], [L * 0.5, h + 0.05, 0], 0.025, wire));
  g.add(beam([mx, deckY + mastH, 0], [-L * 0.5, h + 0.05, 0], 0.025, wire));
  g.add(place(box(0.08, 0.3, 0.08, emissive_white()), { x: mx, y: deckY + mastH }));
  if (sail === 'up') {
    rig.add(triangle([-0.06, boomY + 0.05, 0], [boomEnd - mx, boomY + 0.05, 0], [-0.06, deckY + mastH - 0.2, 0], sailMat()));
    const side = Math.sign(swing) || 1;
    g.add(triangle([L * 0.47, h + 0.15, 0], [mx + 0.08, deckY + mastH * 0.86, 0], [mx - 0.25, deckY + 0.35, side * B * 0.4], sailMat()));
  } else {
    // sail cover zipped over the boom + furled jib along the forestay
    const len = mx - boomEnd - 0.1;
    g.add(place(box(len, 0.28, 0.26, mat(cover)), { x: (mx + boomEnd) / 2 - 0.05, y: boomY + 0.02 }));
    g.add(beam([mx + 0.1, deckY + mastH * 0.8, 0], [L * 0.45, h + 0.25, 0], 0.11, mat(cover)));
  }
  // pulpit rail at the bow, pushpit at the stern
  const rail = metal(PALETTE.steelLight);
  g.add(beam([L * 0.32, h + 0.4, B * 0.32], [L * 0.47, h + 0.4, 0], 0.03, rail));
  g.add(beam([L * 0.32, h + 0.4, -B * 0.32], [L * 0.47, h + 0.4, 0], 0.03, rail));
  g.add(beam([-L * 0.47, h + 0.45, B * 0.38], [-L * 0.47, h + 0.45, -B * 0.38], 0.03, rail));
  return g;
}

function emissive_white() {
  return mat(PALETTE.white, { emissive: PALETTE.white, emissiveIntensity: 0.4 });
}

/** Motor yacht with saloon, dark window band, flybridge and swim platform. */
export function motorYacht({ L = 5.4, B = 2.3, color = PALETTE.white, band = PALETTE.navy, accent = PALETTE.navy } = {}) {
  const h = 0.85;
  const g = group(hull({ L, B, h, color, band, deck: PALETTE.offWhite }));
  const white = mat(PALETTE.white);
  const dark = glass(PALETTE.glassDark);
  const teak = surface('planks', PALETTE.woodLight, { size: 1 });
  // swim platform + aft deck
  g.add(place(box(0.45, 0.08, B * 0.78, teak), { x: -L / 2 + 0.05, y: h * 0.45 }));
  g.add(place(box(L * 0.22, 0.04, B * 0.8, teak), { x: -L * 0.36, y: h }));
  // hull accent stripe
  g.add(place(box(L * 0.5, 0.1, B * 0.97, mat(accent)), { x: -L * 0.12, y: h - 0.24 }));
  // saloon
  const sw = L * 0.46, sd = B * 0.74, sx = -L * 0.04;
  g.add(place(taperedBlock({ w: sw, d: sd, h: 0.85, topW: sw * 0.9, topD: sd * 0.92, material: white }), { x: sx, y: h }));
  g.add(place(taperedBlock({ w: sw * 0.98, d: sd + 0.02, h: 0.38, topW: sw * 0.92, topD: sd * 0.96, material: dark }), { x: sx, y: h + 0.3 }));
  // sloped windscreen in front of the saloon
  g.add(place(taperedBlock({ w: 0.6, d: sd * 0.95, h: 0.55, topW: 0.05, topD: sd * 0.8, material: dark }), { x: sx + sw / 2 + 0.05, y: h }));
  // flybridge
  const fy = h + 0.85;
  g.add(place(box(sw * 0.7, 0.12, sd * 0.9, white), { x: sx - 0.1, y: fy }));
  g.add(place(taperedBlock({ w: 0.25, d: sd * 0.7, h: 0.3, topW: 0.08, topD: sd * 0.66, material: dark }), { x: sx + sw * 0.25, y: fy + 0.12 }));
  g.add(place(box(0.4, 0.35, 0.5, PALETTE.offWhite), { x: sx + sw * 0.08, y: fy + 0.12 }));
  const rail = metal(PALETTE.steelLight);
  g.add(beam([sx - sw * 0.45, fy + 0.5, sd * 0.42], [sx + sw * 0.1, fy + 0.5, sd * 0.42], 0.03, rail));
  g.add(beam([sx - sw * 0.45, fy + 0.5, -sd * 0.42], [sx + sw * 0.1, fy + 0.5, -sd * 0.42], 0.03, rail));
  // radar arch + mast
  g.add(place(box(0.15, 0.7, sd * 0.86, white), { x: sx - sw * 0.2, y: fy + 0.12 }));
  g.add(place(cylinder(0.18, 0.18, 0.12, white, 10), { x: sx - sw * 0.2, y: fy + 0.82 }));
  g.add(place(cylinder(0.03, 0.04, 1.1, metal(PALETTE.aluminium), 6), { x: sx - sw * 0.2, y: fy + 0.82 }));
  // foredeck rail
  g.add(beam([L * 0.12, h + 0.35, B * 0.42], [L * 0.47, h + 0.35, 0], 0.03, rail));
  g.add(beam([L * 0.12, h + 0.35, -B * 0.42], [L * 0.47, h + 0.35, 0], 0.03, rail));
  return g;
}

/** Small open dinghy / rowing boat with an outboard. */
export function dinghy({ L = 2.4, B = 1.0, color = PALETTE.orange } = {}) {
  const h = 0.38;
  const g = group(hull({ L, B, h, color, band: PALETTE.offWhite, deck: surface('planks', PALETTE.wood, { size: 0.8 }) }));
  g.add(place(box(0.25, 0.08, B * 0.8, PALETTE.woodLight), { x: 0, y: h }));
  g.add(place(box(0.25, 0.08, B * 0.8, PALETTE.woodLight), { x: -L * 0.3, y: h }));
  g.add(place(box(0.28, 0.45, 0.24, PALETTE.black), { x: -L / 2 - 0.1, y: h - 0.05 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, place, beam, cylinder, mat, metal, emissive, water, surface,
  canvasTexture, textured, signTexture, shade, rng, tree, streetLamp, flag, hedge,
} from '../../src/lib/index.js';

// Glass panes in a diamond lattice, drawn for one triangular pyramid face.
// UV: u runs along the base (0..1), v up to the apex at (0.5, 1).
function latticeTexture(n, seed) {
  return canvasTexture(512, 512, (ctx, W, H) => {
    const P = (u, v) => [u * W, H - v * H];
    const grad = ctx.createLinearGradient(0, H, W * 0.3, 0);
    grad.addColorStop(0, '#5d93b8');
    grad.addColorStop(0.55, '#8ec3e2');
    grad.addColorStop(1, '#d4ecf8');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // some panes show the lit office floors inside, others catch the sky
    const r = rng(seed);
    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        const roll = r();
        if (roll > 0.2) continue;
        const a = i / n, b = j / n, s = 1 / n;
        const corners = [[a, b], [a + s, b], [a + s, b + s], [a, b + s]].map(([p, q]) => P((p + q) / 2, q - p));
        ctx.fillStyle = roll < 0.07 ? '#f4dc8c' : roll < 0.13 ? '#e6f6ff' : '#4b7ea3';
        ctx.beginPath();
        corners.forEach(([x, y], k) => (k ? ctx.lineTo(x, y) : ctx.moveTo(x, y)));
        ctx.closePath();
        ctx.fill();
      }
    }
    // mullions: lines parallel to both slanted edges plus horizontal floor lines
    ctx.strokeStyle = '#e9eef2';
    ctx.lineWidth = 3;
    ctx.beginPath();
    for (let i = -n; i <= 2 * n; i++) {
      const t = i / n;
      ctx.moveTo(...P(t, 0)); ctx.lineTo(...P(t + 0.5, 1));
      ctx.moveTo(...P(t, 0)); ctx.lineTo(...P(t - 0.5, 1));
    }
    ctx.stroke();
    ctx.strokeStyle = '#4a5560';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let k = 1; k < n; k++) {
      ctx.moveTo(...P(0, k / n)); ctx.lineTo(...P(1, k / n));
    }
    ctx.stroke();
  }, { key: `glass-pyramid-office:lattice:${n}:${seed}`, repeat: false });
}

// Square pyramid with 0..1 UVs on each face so the lattice texture fits.
function glassPyramid({ base, h, n = 8, seed = 1 }) {
  const b = base / 2;
  const corners = [[-b, b], [b, b], [b, -b], [-b, -b]]; // front-left, front-right, back-right, back-left
  const pos = [], uv = [];
  for (let k = 0; k < 4; k++) {
    const [x0, z0] = corners[k], [x1, z1] = corners[(k + 1) % 4];
    pos.push(x0, 0, z0, x1, 0, z1, 0, h, 0);
    uv.push(0, 0, 1, 0, 0.5, 1);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const tex = latticeTexture(n, seed);
  const m = textured(tex, { roughness: 0.25, metalness: 0.25, emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.12 });
  const g = new THREE.Group();
  g.add(new THREE.Mesh(geo, m));
  // steel edge ribs and base frame
  const rib = metal(PALETTE.steelDark);
  const t = Math.max(0.05, base * 0.018);
  for (const [x, z] of corners) g.add(beam([x, 0, z], [0, h, 0], t, rib));
  for (let k = 0; k < 4; k++) {
    const [x0, z0] = corners[k], [x1, z1] = corners[(k + 1) % 4];
    g.add(beam([x0, t / 2, z0], [x1, t / 2, z1], t * 1.4, rib));
  }
  return g;
}

// Big monument sign with 0..1 UVs (lib sign() shrinks text on faces over 1 m).
function plaque(text, w, h, d, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.round(512 * h / w), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: 0.2 });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

// Vertical fountain jet with foam ring and spray.
function fountainJet(h) {
  const spray = mat('#d8f0ff', { transparent: true, opacity: 0.7, emissive: '#bfe4ff', emissiveIntensity: 0.3 });
  const foam = mat('#f6fbff', { emissive: '#ffffff', emissiveIntensity: 0.2 });
  return new THREE.Group().add(
    cylinder(0.32, 0.36, 0.05, foam, 10),
    cylinder(0.05, 0.08, h, spray, 6),
    place(cylinder(0.3, 0.06, 0.28, spray, 8), { y: h - 0.28 }),
    place(cylinder(0.22, 0.3, 0.12, spray, 8), { y: h }),
  );
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const half = TILE / 2;
  const granite = mat('#5f6168', { roughness: 0.5 });
  const graniteLight = mat('#9a9ca3', { roughness: 0.6 });
  const plazaStone = surface('paving', '#d8d0c0', { size: 2 });

  g.add(lot([1, 1], 'paved'));
  g.add(place(patch(TILE - 0.2, TILE - 0.2, plazaStone, 0.04), { y: y0 }));
  const yp = y0 + 0.04;

  // --- reflecting-pool moat around the pyramid island ------------------------
  const cz = -0.6;          // centre of pyramid + pool
  const outer = 8.6;        // outside of the pool rim
  const inner = 6.0;        // island
  const rimT = 0.25, rimH = 0.32;
  const O = outer / 2;
  g.add(place(box(outer - 2 * rimT, 0.18, outer - 2 * rimT, water('#3f9fd0')), { y: yp, z: cz }));
  g.add(place(box(outer, rimH, rimT, granite), { y: yp, z: cz - O + rimT / 2 }));
  g.add(place(box(rimT, rimH, outer, granite), { x: -O + rimT / 2, y: yp, z: cz }));
  g.add(place(box(rimT, rimH, outer, granite), { x: O - rimT / 2, y: yp, z: cz }));
  const gapW = 1.8, frontW = (outer - gapW) / 2;
  for (const s of [-1, 1]) g.add(place(box(frontW, rimH, rimT, granite), { x: s * (gapW / 2 + frontW / 2), y: yp, z: cz + O - rimT / 2 }));

  // island + entrance causeway
  g.add(place(box(inner, 0.34, inner, graniteLight), { y: yp, z: cz }));
  g.add(place(box(inner - 0.3, 0.02, inner - 0.3, plazaStone), { y: yp + 0.34, z: cz }));
  g.add(place(box(gapW, 0.33, O - inner / 2 + 0.05, plazaStone), { y: yp, z: cz + (O + inner / 2) / 2 }));
  const yi = yp + 0.36;

  // --- main glass pyramid ----------------------------------------------------
  const B = 5.2, H = 3.7;
  g.add(place(box(B + 0.3, 0.15, B + 0.3, granite), { y: yi, z: cz }));
  g.add(place(glassPyramid({ base: B, h: H, n: 12, seed: 7 }), { y: yi + 0.15, z: cz }));
  // gilded capstone
  const capAt = 0.86;
  g.add(place(glassCap(B * (1 - capAt) + 0.12, H * (1 - capAt) + 0.12), { y: yi + 0.15 + H * capAt - 0.06, z: cz }));

  // entrance vestibule with revolving door and logo
  const fz = cz + B / 2;
  const steel = metal(PALETTE.steelLight);
  g.add(place(box(1.5, 1.25, 0.9, mat('#2e4a60', { roughness: 0.2, metalness: 0.4 })), { y: yi, z: fz - 0.05 }));
  g.add(place(box(1.75, 0.14, 1.15, steel), { y: yi + 1.25, z: fz - 0.05 }));
  g.add(place(cylinder(0.42, 0.42, 1.15, mat('#a9d6ee', { roughness: 0.15, metalness: 0.3 }), 12), { y: yi, z: fz + 0.42 }));
  g.add(place(box(0.05, 1.15, 0.8, steel), { y: yi, z: fz + 0.42, ry: 35 }));
  g.add(place(plaque('PYRA CORP', 1.5, 0.3, 0.06, '#1d2b38', '#f2c94c'), { y: yi + 1.4, z: fz + 0.4 }));

  // --- satellite pyramids on pedestals in the pool corners -------------------
  const sc = O - rimT - 0.65;
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const x = sx * sc, z = cz + sz * sc;
    g.add(place(box(1.15, 0.36, 1.15, graniteLight), { x, y: yp, z }));
    g.add(place(glassPyramid({ base: 0.95, h: 0.72, n: 4, seed: 3 }), { x, y: yp + 0.36, z }));
  }

  // --- fountain jets along the sides and back of the moat --------------------
  const mid = (O - rimT + inner / 2) / 2;
  const jets = [];
  for (const t of [-1.5, 0, 1.5]) {
    jets.push([-mid, cz + t], [mid, cz + t], [t, cz - mid]);
  }
  jets.push([-2.2, cz + mid], [2.2, cz + mid]);
  jets.forEach(([x, z], i) => g.add(place(fountainJet(i % 3 === 2 ? 1.25 : 0.95), { x, y: yp + 0.17, z })));

  // --- front plaza: monument sign, flags, lamps, bollards --------------------
  const pz = cz + O; // front edge of the pool
  g.add(place(box(2.9, 0.25, 0.55, granite), { x: -3.1, y: yp, z: 4.45 }));
  g.add(place(plaque('PYRAMID HQ', 2.7, 0.7, 0.32, '#1d2b38', '#f2c94c'), { x: -3.1, y: yp + 0.25, z: 4.45 }));
  for (const [i, c] of [PALETTE.blue, PALETTE.red, PALETTE.yellow].entries()) {
    g.add(place(flag({ h: 3.6, color: c, color2: PALETTE.white }), { x: 1.7 + i * 0.85, y: yp, z: 4.35 }));
  }
  for (const s of [-1, 1]) {
    g.add(place(streetLamp({ h: 2.6 }), { x: s * 1.25, y: yp, z: pz + 0.7, ry: s > 0 ? 180 : 0 }));
    for (const dz of [0.25, 0.85]) g.add(place(cylinder(0.08, 0.1, 0.55, mat(PALETTE.darkGrey), 6), { x: s * 0.9, y: yp, z: pz + dz }));
  }

  // --- clipped trees and hedges in the side margins -------------------------
  for (const s of [-1, 1]) {
    g.add(place(hedge({ w: 7.6, h: 0.7, d: 0.45 }), { x: s * (half - 0.35), y: yp, z: cz - 0.2, ry: 90 }));
    for (const z of [-3.4, 0.4]) g.add(place(tree({ kind: 'cone', h: 2.6, seed: 20 + z + s }), { x: s * (half - 0.55), y: yp, z }));
  }
  g.add(place(hedge({ w: 8.2, h: 0.6, d: 0.35 }), { y: yp, z: -half + 0.22 }));
  return g;
}

// Small solid gold pyramid that caps the apex.
function glassCap(base, h) {
  const b = base / 2;
  const geo = new THREE.ConeGeometry(b * Math.SQRT2, h, 4, 1).rotateY(Math.PI / 4).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, metal(shade(PALETTE.yellow, -0.1), { roughness: 0.3 }));
}

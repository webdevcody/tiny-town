import * as THREE from 'three';
import {
  PALETTE, box, cylinder, place, group, beam, mat, metal, emissive, textured,
  canvasTexture, signTexture, surface, shade,
} from '../../src/lib/index.js';

// Local helpers for the data centre. Box UVs from the lib are in metres, so the
// big sign below builds its own 0..1-UV box to keep the text full size.

/** Large sign with text on the front (+z) face, base at y = 0. */
export function bigSign({ text, w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round(512 * h / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Precast concrete wall panels: 3 m wide, 1.5 m tall seams, slight tone variation. */
export function panelWall(color) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(color, 0.04);
    ctx.fillRect(0, 0, W / 2, H / 2);
    ctx.fillRect(W / 2, H / 2, W / 2, H / 2);
    ctx.fillStyle = shade(color, -0.22);
    ctx.fillRect(0, 0, W, 2);
    ctx.fillRect(0, H / 2, W, 2);
    ctx.fillRect(0, 0, 2, H);
    ctx.fillRect(W / 2, 0, 2, H);
  }, { key: 'data-centre:panels:' + color });
  tex.repeat.set(1 / 6, 1 / 3);
  return textured(tex, { roughness: 0.9 });
}

/** Chain-link mesh material (see-through). */
function meshMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = '#b9c1c7';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(W, H);
    ctx.moveTo(W, 0); ctx.lineTo(0, H);
    ctx.stroke();
  }, { key: 'data-centre:chainlink' });
  tex.repeat.set(1.4, 1.4);
  return textured(tex, { transparent: true, alphaTest: 0.25, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.4 });
}

/**
 * Security fence along a polyline of [x, z] points (base at y = 0).
 * top: 'arms' (outward-angled arms with 3 barbed wires) or 'razor' (concertina coil).
 * out: which side is "outside" for the arms (+1 = left of the walking direction).
 */
export function securityFence(points, { h = 2.4, top = 'arms', out = 1, postGap = 2.5 } = {}) {
  const g = new THREE.Group();
  const postM = metal(PALETTE.steelDark);
  const railM = metal(PALETTE.steel);
  const wireM = mat(PALETTE.darkGrey);
  const mesh = meshMat();
  const coilM = metal(PALETTE.steelLight);
  const coilGeo = new THREE.TorusGeometry(0.28, 0.025, 3, 10);
  for (let i = 0; i < points.length - 1; i++) {
    const [ax, az] = points[i], [bx, bz] = points[i + 1];
    const dx = bx - ax, dz = bz - az;
    const len = Math.hypot(dx, dz);
    const ux = dx / len, uz = dz / len;
    const nx = -uz * out, nz = ux * out; // outward normal
    const ang = Math.atan2(-dz, dx);
    const seg = new THREE.Group();
    seg.position.set((ax + bx) / 2, 0, (az + bz) / 2);
    seg.rotation.y = ang;
    seg.add(place(box(len, h - 0.1, 0.03, mesh), { y: 0.05 }));
    seg.add(place(box(len, 0.07, 0.07, railM), { y: h - 0.07 }));
    seg.add(place(box(len, 0.05, 0.05, railM), { y: 0.05 }));
    g.add(seg);
    const posts = Math.max(1, Math.round(len / postGap));
    for (let p = 0; p <= posts; p++) {
      const t = p / posts;
      const px = ax + dx * t, pz = az + dz * t;
      g.add(place(box(0.11, h, 0.11, postM), { x: px, z: pz }));
      if (top === 'arms') {
        const tip = [px + nx * 0.45, h + 0.45, pz + nz * 0.45];
        g.add(beam([px, h - 0.05, pz], tip, 0.06, postM));
      }
    }
    if (top === 'arms') {
      for (let k = 1; k <= 3; k++) {
        const o = 0.15 * k;
        g.add(beam([ax + nx * o, h - 0.05 + o, az + nz * o], [bx + nx * o, h - 0.05 + o, bz + nz * o], 0.025, wireM));
      }
    } else {
      const n = Math.round(len / 0.32);
      for (let k = 0; k <= n; k++) {
        const t = k / n;
        const ring = new THREE.Mesh(coilGeo, coilM);
        ring.position.set(ax + dx * t, h + 0.26, az + dz * t);
        ring.rotation.y = ang + Math.PI / 2 + (k % 2 ? 0.35 : -0.35);
        g.add(ring);
      }
    }
  }
  return g;
}

/** Sliding gate leaf (mesh panel in a steel frame), length along X, base at y = 0. */
export function gateLeaf({ w = 3, h = 2.2 } = {}) {
  const fm = metal(PALETTE.steelDark);
  return group(
    place(box(w, h - 0.1, 0.03, meshMat()), { y: 0.05 }),
    place(box(w, 0.09, 0.09, fm), { y: h - 0.09 }),
    place(box(w, 0.09, 0.09, fm), { y: 0.05 }),
    place(box(0.09, h, 0.09, fm), { x: -w / 2 }),
    place(box(0.09, h, 0.09, fm), { x: w / 2 }),
    beam([-w / 2, 0.1, 0], [w / 2, h - 0.1, 0], 0.06, fm),
  );
}

/** Air-cooled chiller: louvred base with a row of round fans on top. Length along X. */
export function chiller({ len = 2.2, d = 1.3, h = 1.0, fans = 2 } = {}) {
  const body = mat(PALETTE.offWhite, { roughness: 0.7 });
  const louvre = surface('corrugated', PALETTE.lightGrey, { size: 0.35 });
  const g = new THREE.Group();
  g.add(place(box(len, 0.15, d + 0.1, metal(PALETTE.steelDark)), {}));
  g.add(place(box(len, h, d, [body, body, body, body, louvre, louvre]), { y: 0.15 }));
  const shroud = mat(PALETTE.darkGrey);
  const blade = mat('#2b2e33');
  const step = len / fans;
  for (let i = 0; i < fans; i++) {
    const x = -len / 2 + step * (i + 0.5);
    const r = Math.min(step, d) * 0.4;
    g.add(place(cylinder(r, r, 0.22, shroud, 14), { x, y: 0.15 + h }));
    g.add(place(cylinder(r * 0.82, r * 0.82, 0.02, blade, 14), { x, y: 0.15 + h + 0.21 }));
    g.add(place(box(r * 1.6, 0.03, 0.12, mat(PALETTE.steel)), { x, y: 0.15 + h + 0.22, ry: 30 + i * 40 }));
    g.add(place(box(r * 1.6, 0.03, 0.12, mat(PALETTE.steel)), { x, y: 0.15 + h + 0.22, ry: 120 + i * 40 }));
  }
  return g;
}

/** Containerised diesel generator, length along Z. Exhaust stack at the back. */
export function generator({ w = 1.8, h = 2.3, d = 3.6, color = PALETTE.yellow, seed = 0 } = {}) {
  const body = mat(color, { roughness: 0.6 });
  const dark = mat(shade(color, -0.25));
  const grille = surface('corrugated', PALETTE.darkGrey, { size: 0.25 });
  const g = new THREE.Group();
  g.add(box(w + 0.3, 0.2, d + 0.3, mat(PALETTE.concreteDark)));
  g.add(place(box(w, h, d, body), { y: 0.2 }));
  g.add(place(box(w + 0.08, 0.12, d + 0.08, dark), { y: 0.2 + h }));
  // radiator grille on the front end, louvre doors on both long sides
  g.add(place(box(w * 0.8, h * 0.7, 0.06, grille), { y: 0.35, z: d / 2 }));
  for (const sx of [-1, 1]) {
    for (const dz of [-0.9, 0.5]) {
      g.add(place(box(0.05, h * 0.75, 1.1, dark), { x: sx * w / 2, y: 0.3, z: dz }));
      g.add(place(box(0.06, 0.6, 0.8, grille), { x: sx * w / 2, y: 0.3 + h * 0.4, z: dz }));
    }
  }
  // exhaust silencer + stack
  const steel = metal(PALETTE.steel);
  g.add(place(box(0.7, 0.45, 1.2, steel), { y: 0.32 + h, z: -d / 2 + 1.0 }));
  g.add(place(cylinder(0.15, 0.15, 1.3, metal(PALETTE.steelDark), 8), { x: 0.2, y: 0.32 + h, z: -d / 2 + 0.6 }));
  g.add(place(cylinder(0.2, 0.15, 0.12, mat('#2b2e33'), 8), { x: 0.2, y: 1.62 + h, z: -d / 2 + 0.6 }));
  // hazard stripe at the base of the front grille
  g.add(place(box(w, 0.12, 0.04, surface('hazard', PALETTE.yellow, { size: 0.5 })), { y: 0.2, z: d / 2 + 0.01 }));
  return g;
}

/** Horizontal diesel tank on two concrete saddles, length along X. */
export function fuelTank({ len = 3, r = 0.75, color = PALETTE.white } = {}) {
  const m = mat(color, { roughness: 0.5 });
  const g = new THREE.Group();
  for (const sx of [-1, 1]) g.add(place(box(0.4, r * 0.7, r * 1.6, mat(PALETTE.concreteDark)), { x: sx * len * 0.3 }));
  const tank = cylinder(r, r, len, m, 14);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(len / 2, r + 0.15, 0);
  g.add(tank);
  for (const sx of [-1, 1]) {
    const cap = cylinder(r * 0.98, r * 0.6, 0.18, m, 14);
    cap.rotation.z = -sx * Math.PI / 2;
    cap.position.set(sx * len / 2, r + 0.15, 0);
    g.add(cap);
  }
  // red band + manway + vent
  const band = cylinder(r + 0.02, r + 0.02, 0.25, mat(PALETTE.red), 14);
  band.rotation.z = Math.PI / 2;
  band.position.set(0.125, r + 0.15, 0);
  g.add(band);
  g.add(place(cylinder(0.22, 0.22, 0.2, metal(PALETTE.steelDark), 8), { x: len * 0.25, y: 2 * r + 0.1 }));
  g.add(place(cylinder(0.04, 0.04, 0.6, metal(PALETTE.steelDark), 6), { x: -len * 0.3, y: 2 * r + 0.1 }));
  return g;
}

/** CCTV pole with a camera (and a floodlight) pointing towards +X. */
export function cctvPole({ h = 4 } = {}) {
  const pm = metal(PALETTE.steelDark);
  return group(
    cylinder(0.06, 0.08, h, pm, 6),
    place(box(0.5, 0.06, 0.06, pm), { x: 0.2, y: h - 0.2 }),
    place(box(0.45, 0.2, 0.2, mat(PALETTE.offWhite)), { x: 0.45, y: h - 0.42 }),
    place(box(0.06, 0.14, 0.14, mat('#1d2024')), { x: 0.7, y: h - 0.39 }),
    place(box(0.3, 0.12, 0.4, emissive(PALETTE.windowLit, 0.6)), { x: 0.0, y: h }),
  );
}

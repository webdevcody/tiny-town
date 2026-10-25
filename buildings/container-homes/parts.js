import * as THREE from 'three';
import { PALETTE, box, place, group, mat, glass, metal, surface, shade, textured, canvasTexture } from '../../src/lib/index.js';

// Standard 20 ft ISO container, metres.
export const CL = 6.06;
export const CH = 2.6;
export const CW = 2.44;

const frameDark = () => mat(PALETTE.darkGrey);
const winGlass = () => glass(PALETTE.glassSky);

/**
 * Container converted into a home, length along X, base at y = 0.
 * openings: { front|back: [{ x, w, h, y, kind }], left|right: kind }
 *   side openings: kind 'window' | 'door' | 'wall' (floor-to-ceiling glass)
 *   ends (left = -x, right = +x): 'glazed' | 'cargo' | 'plain'
 */
export function containerHome({ color, length = CL, front = [], back = [], left = 'cargo', right = 'cargo', stencil }) {
  const L = length;
  const side = surface('corrugated', color, { size: 2.2, roughness: 0.7 });
  const endM = mat(shade(color, -0.12));
  const topM = surface('corrugated', shade(color, 0.06), { size: 1.4, roughness: 0.75 });
  const rail = mat(shade(color, -0.3));
  const g = group(place(box(L - 0.1, CH - 0.1, CW - 0.06, [endM, endM, topM, endM, side, side]), { y: 0.05 }));

  // corner posts and top/bottom rails make it read as a container
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.16, CH, 0.16, rail), { x: sx * (L / 2 - 0.08), z: sz * (CW / 2 - 0.08) }));
  for (const sz of [-1, 1]) for (const y of [0, CH - 0.12]) g.add(place(box(L, 0.12, 0.12, rail), { y, z: sz * (CW / 2 - 0.06) }));
  for (const sx of [-1, 1]) for (const y of [0, CH - 0.12]) g.add(place(box(0.12, 0.12, CW, rail), { x: sx * (L / 2 - 0.06), y }));

  // side openings, cut into the +z (front) / -z (back) walls
  const sideOpen = (list, dir) => {
    for (const o of list) {
      const h = o.h ?? (o.kind === 'window' ? 1.1 : 2.15);
      const y = o.y ?? (o.kind === 'window' ? 0.95 : 0.2);
      const z = dir * (CW / 2 - 0.02);
      const panel = group(
        place(box(o.w + 0.16, h + 0.16, 0.08, frameDark()), { y: y - 0.08 }),
        place(box(o.w, h, 0.1, o.kind === 'door' ? mat(PALETTE.woodDark) : winGlass()), { y }),
      );
      if (o.kind === 'door') panel.add(place(box(o.w * 0.5, h * 0.55, 0.12, winGlass()), { y: y + h * 0.35 }));
      if (o.kind === 'wall') for (let i = 1; i < Math.round(o.w / 1.1); i++) panel.add(place(box(0.06, h, 0.12, frameDark()), { x: -o.w / 2 + (o.w * i) / Math.round(o.w / 1.1), y }));
      if (o.kind === 'window') panel.add(place(box(o.w + 0.3, 0.08, 0.3, frameDark()), { y: y - 0.12, z: 0.1 }));
      g.add(place(panel, { x: o.x, z, ry: dir > 0 ? 0 : 180 }));
    }
  };
  sideOpen(front, 1);
  sideOpen(back, -1);

  // ends
  const end = (kind, dir) => {
    const x = dir * (L / 2 - 0.02);
    const e = new THREE.Group();
    if (kind === 'glazed') {
      e.add(place(box(CW - 0.2, CH - 0.24, 0.08, frameDark()), { y: 0.12 }));
      e.add(place(box(CW - 0.4, CH - 0.44, 0.1, winGlass()), { y: 0.22 }));
      e.add(place(box(0.07, CH - 0.44, 0.12, frameDark()), { y: 0.22 }));
      e.add(place(box(CW - 0.4, 0.07, 0.12, frameDark()), { y: 1.0 }));
    } else if (kind === 'cargo') {
      const barM = metal(PALETTE.steelLight);
      e.add(place(box(0.05, CH - 0.24, 0.1, rail), { y: 0.12 }));
      for (const bx of [-0.85, -0.3, 0.3, 0.85]) e.add(place(box(0.05, CH - 0.3, 0.14, barM), { x: bx, y: 0.15 }));
      for (const bx of [-0.58, 0.58]) e.add(place(box(0.14, 0.06, 0.16, barM), { x: bx, y: 1.2 }));
    }
    g.add(place(e, { x, ry: dir * 90 }));
  };
  end(left, -1);
  end(right, 1);

  if (stencil) {
    const tex = canvasTexture(512, 96, (ctx, W, H) => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = '#f4f1ea';
      ctx.font = 'bold 64px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(stencil.text, W / 2, H / 2);
    }, { key: 'container-homes:stencil:' + stencil.text, repeat: false });
    const decal = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.45), textured(tex, { transparent: true, alphaTest: 0.3 }));
    decal.position.set(stencil.x ?? 0, stencil.y ?? 2.0, (stencil.side ?? -1) * (CW / 2 + 0.03));
    if ((stencil.side ?? -1) < 0) decal.rotation.y = Math.PI;
    g.add(decal);
  }
  return g;
}

/** Steel railing along X from -len/2..len/2, glass infill optional. */
export function railing(len, { h = 1.0, glassy = false } = {}) {
  const m = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(len / 1.2) + 1);
  for (let i = 0; i < posts; i++) g.add(place(box(0.06, h, 0.06, m), { x: -len / 2 + (len * i) / (posts - 1) }));
  g.add(place(box(len, 0.06, 0.08, m), { y: h - 0.06 }));
  if (glassy) g.add(place(box(len, h * 0.75, 0.03, glass(PALETTE.glassTeal, { opacity: 0.45 })), { y: 0.06 }));
  else g.add(place(box(len, 0.04, 0.04, m), { y: h * 0.5 }));
  return g;
}

/** Railing round a w x d rectangle; sides subset of front/back/left/right. */
export function railingBox(w, d, sides = ['front', 'back', 'left', 'right'], opts) {
  const g = new THREE.Group();
  if (sides.includes('front')) g.add(place(railing(w, opts), { z: d / 2 }));
  if (sides.includes('back')) g.add(place(railing(w, opts), { z: -d / 2 }));
  if (sides.includes('left')) g.add(place(railing(d, opts), { x: -w / 2, ry: 90 }));
  if (sides.includes('right')) g.add(place(railing(d, opts), { x: w / 2, ry: 90 }));
  return g;
}

/** Open steel stair, rises towards +X over run, total rise h, width w. Base at y = 0, x = 0. */
export function steelStair({ run, h, w = 1.0, color = PALETTE.darkGrey }) {
  const m = mat(color);
  const tread = mat(PALETTE.steelLight);
  const g = new THREE.Group();
  const steps = Math.max(3, Math.round(h / 0.2));
  for (let i = 0; i < steps; i++) {
    g.add(place(box(run / steps + 0.05, 0.05, w - 0.1, tread), { x: (run * (i + 0.5)) / steps, y: (h * (i + 1)) / steps - 0.05 }));
  }
  const len = Math.hypot(run, h);
  const ang = THREE.MathUtils.radToDeg(Math.atan2(h, run));
  for (const sz of [-1, 1]) {
    const stringer = place(box(len, 0.22, 0.06, m), { rz: ang });
    stringer.position.set(run / 2, h / 2 - 0.16, sz * w / 2);
    g.add(stringer);
    const hand = place(box(len, 0.05, 0.05, m), { rz: ang });
    hand.position.set(run / 2, h / 2 + 0.95, sz * w / 2);
    g.add(hand);
    for (const t of [0.15, 0.5, 0.85]) g.add(place(box(0.05, 1.0, 0.05, m), { x: run * t, y: h * t, z: sz * w / 2 }));
  }
  return g;
}

/** Spiral stair around a pole at the origin, from y = 0 to h, starting at angle a0 (deg). */
export function spiralStair({ h, r = 0.9, turns = 1, a0 = 0, color = PALETTE.darkGrey }) {
  const m = mat(color);
  const tread = mat(PALETTE.steelLight);
  const g = new THREE.Group();
  g.add(place(box(0.14, h + 1.0, 0.14, m)));
  const steps = Math.round(h / 0.2);
  for (let i = 0; i < steps; i++) {
    const a = a0 + (360 * turns * i) / steps;
    const s = place(box(r, 0.05, 0.36, tread), { x: 0, y: (h * (i + 1)) / steps - 0.05, ry: a });
    s.position.set(Math.cos(THREE.MathUtils.degToRad(a)) * r / 2, s.position.y, -Math.sin(THREE.MathUtils.degToRad(a)) * r / 2);
    g.add(s);
    if (i % 2 === 0) g.add(place(box(0.04, 1.0, 0.04, m), { x: Math.cos(THREE.MathUtils.degToRad(a)) * r, y: (h * (i + 1)) / steps, z: -Math.sin(THREE.MathUtils.degToRad(a)) * r }));
  }
  return g;
}

/** Wooden planter box with a bush of greenery on top. */
export function planter(w, d, { h = 0.45, leaf = PALETTE.foliage } = {}) {
  return group(
    box(w, h, d, surface('planks', PALETTE.wood, { size: 1 })),
    place(box(w - 0.1, 0.12, d - 0.1, mat(leaf)), { y: h }),
  );
}

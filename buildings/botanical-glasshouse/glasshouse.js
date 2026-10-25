import * as THREE from 'three';
import { ShapeBuilder, canvasTexture, mat } from '../../src/lib/index.js';

// Glazing: pale green panes with white-painted iron glazing bars. The bars sit
// on the u = 0 / v = 0 edges of every pane, and every facet of the shapes below
// starts a new pane row, so facet edges always read as iron ribs.
export function glazing({ tint = '#b5e8cf', bar = '#f6f6ee', pane = 0.9, opacity = 0.32 } = {}) {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = tint;
    ctx.globalAlpha = opacity;
    ctx.fillRect(0, 0, W, H);
    ctx.globalAlpha = 0.25;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(10, 8, 6, H - 16); // a little sheen
    ctx.globalAlpha = 1;
    ctx.fillStyle = bar;
    ctx.fillRect(0, 0, 4, H); // u = 0 bar
    ctx.fillRect(0, H - 4, W, 4); // v = 0 bar (canvas bottom)
  }, { key: `botanical-glasshouse:glazing:${tint}:${bar}:${opacity}` });
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / pane, 1 / pane);
  t.needsUpdate = true;
  return mat('#ffffff', { map: t, transparent: true, depthWrite: false, roughness: 0.25, side: THREE.FrontSide });
}

// Profile [[a, y], ...] of a vault cross-section: a = offset across the span.
export function vaultProfile({ span, wall, h, steps = 8 }) {
  const S = span / 2;
  const pts = [[S, 0], [S, wall]];
  for (let i = 1; i < steps; i++) {
    const t = (i / steps) * Math.PI;
    pts.push([S * Math.cos(t), wall + h * Math.sin(t)]);
  }
  pts.push([-S, wall], [-S, 0]);
  return pts;
}

/** Glazed vault running along X (centred), cross-section from vaultProfile(). */
export function vault({ len, profile, material }) {
  const b = new ShapeBuilder();
  const L = len / 2;
  for (let i = 0; i < profile.length - 1; i++) {
    const [z0, y0] = profile[i];
    const [z1, y1] = profile[i + 1];
    b.quad([-L, y0, z0], [L, y0, z0], [L, y1, z1], [-L, y1, z1]);
  }
  return new THREE.Mesh(b.build(), material);
}

/**
 * Surface of revolution around Y from a profile [[r, y], ...] (bottom to top).
 * phi = 0 points at +z, increasing towards +x. `segments` facets over `arc` degrees.
 */
export function revolve({ profile, segments = 8, start = 0, arc = 360, material }) {
  const b = new ShapeBuilder();
  const a0 = THREE.MathUtils.degToRad(start);
  const da = THREE.MathUtils.degToRad(arc) / segments;
  const P = (r, y, a) => [r * Math.sin(a), y, r * Math.cos(a)];
  for (let s = 0; s < segments; s++) {
    const p0 = a0 + s * da, p1 = p0 + da;
    for (let i = 0; i < profile.length - 1; i++) {
      const [r0, y0] = profile[i];
      const [r1, y1] = profile[i + 1];
      if (r1 < 1e-4) b.tri(P(r0, y0, p0), P(r0, y0, p1), [0, y1, 0]);
      else if (r0 < 1e-4) continue;
      else b.quad(P(r0, y0, p0), P(r0, y0, p1), P(r1, y1, p1), P(r1, y1, p0));
    }
  }
  return new THREE.Mesh(b.build(), material);
}

/** Quarter-ellipse profile from (r, y) curving in to (rTop, y + h). */
export function curveIn(r, y, rTop, h, steps = 5) {
  const pts = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * (Math.PI / 2);
    pts.push([rTop + (r - rTop) * Math.cos(t), y + h * Math.sin(t)]);
  }
  return pts;
}

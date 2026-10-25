import * as THREE from 'three';
import {
  PALETTE, place, box, cylinder, beam, mat, metal, textured, signTexture, taperedBlock, rng, shade,
} from '../../src/lib/index.js';

/**
 * Sign board with 0..1 UVs on the +z face, so the text fills boards wider than 1 m
 * (the lib sign() uses metre UVs and shrinks the text).
 */
export function bigSign({ text, w, h, depth = 0.15, bg = PALETTE.red, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Red gondola cabin hanging below a haul-rope grip. Origin = grip point on the rope. */
export function gondola({ color = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.45, metalness: 0.2 });
  const dark = metal(PALETTE.steelDark);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const cw = 1.25, cd = 1.35, ch = 1.45, hang = 0.55;
  const top = -hang - 0.12;           // top of cabin roof
  const base = top - ch;              // underside of cabin
  // grip + hanger arm
  g.add(place(box(0.22, 0.24, 0.5, dark), { y: -0.12 }));
  g.add(place(box(0.1, hang, 0.1, dark), { y: -hang - 0.06 }));
  // roof cap
  g.add(place(taperedBlock({ w: cw, d: cd, h: 0.22, topW: cw * 0.6, topD: cd * 0.6, material: mat(PALETTE.lightGrey), topMaterial: mat(PALETTE.lightGrey) }), { y: top - 0.22 }));
  // body: lower panel, window band, upper band
  g.add(place(box(cw, 0.62, cd, body), { y: base }));
  g.add(place(box(cw - 0.04, 0.55, cd - 0.04, glassM), { y: base + 0.62 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.1, 0.55, 0.1, body), { x: sx * (cw / 2 - 0.05), y: base + 0.62, z: sz * (cd / 2 - 0.05) }));
  }
  g.add(place(box(cw, 0.06, cd, body), { y: base + 0.85 })); // mullion line across windows
  g.add(place(box(cw, ch - 1.17, cd, body), { y: base + 1.17 }));
  g.add(place(box(cw + 0.02, 0.08, cd + 0.02, mat(PALETTE.white)), { y: base + 0.48 })); // white stripe
  g.add(place(box(cw * 0.85, 0.08, cd * 0.85, mat(shade(color, -0.35))), { y: base - 0.08 }));
  return g;
}

/** Horizontal bullwheel: rim, spokes and hub. Origin = wheel centre. */
export function bullwheel({ radius = 1.5, color = PALETTE.yellow } = {}) {
  const g = new THREE.Group();
  const m = mat(color, { roughness: 0.5, metalness: 0.2 });
  const rim = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.13, 6, 28), m);
  rim.rotation.x = Math.PI / 2;
  g.add(rim);
  // rope groove ring (dark) on the outside of the rim
  const rope = new THREE.Mesh(new THREE.TorusGeometry(radius + 0.1, 0.05, 4, 28), metal(PALETTE.darkGrey));
  rope.rotation.x = Math.PI / 2;
  g.add(rope);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.26;
    g.add(beam([0, 0, 0], [Math.cos(a) * radius, 0, Math.sin(a) * radius], 0.12, m));
  }
  g.add(place(cylinder(0.32, 0.32, 0.35, m, 10), { y: -0.17 }));
  return g;
}

/** Tubular cable-car support tower with crossarm and sheave trains. Origin = foot; returns { group, top }. */
export function ropewayPylon({ h = 7, span = 3, color = PALETTE.steelLight } = {}) {
  const g = new THREE.Group();
  const m = metal(color, { roughness: 0.5 });
  const dark = metal(PALETTE.darkGrey);
  g.add(place(box(1.2, 0.5, 1.2, mat(PALETTE.concrete)), { y: -0.3 }));
  g.add(cylinder(0.2, 0.32, h, m, 10));
  // crossarm with a yellow stripe
  const armY = h - 0.1;
  g.add(place(box(span + 1.3, 0.32, 0.38, m), { y: armY }));
  g.add(place(box(0.5, 0.5, 0.5, m), { y: armY - 0.3 }));
  // sheave trains: a cradle with four wheels at each rope
  for (const sx of [-1, 1]) {
    const x = sx * span / 2;
    g.add(place(box(0.24, 0.12, 1.5, dark), { x, y: armY + 0.32 }));
    for (let i = 0; i < 4; i++) {
      const wg = new THREE.CylinderGeometry(0.13, 0.13, 0.08, 10).rotateZ(Math.PI / 2);
      const w = new THREE.Mesh(wg, mat(PALETTE.yellow));
      w.position.set(x, armY + 0.5, -0.55 + i * 0.37);
      g.add(w);
    }
    g.add(place(box(0.08, 0.2, 0.08, dark), { x, y: armY + 0.12 }));
  }
  // maintenance ladder up the column
  for (const sx of [-1, 1]) g.add(beam([sx * 0.18, 0.3, 0.36], [sx * 0.18, armY, 0.3], 0.04, dark));
  for (let y = 0.6; y < armY; y += 0.45) g.add(place(box(0.36, 0.03, 0.03, dark), { y, z: 0.33 }));
  // warning light
  g.add(place(box(0.2, 0.2, 0.2, mat(PALETTE.red, { emissive: PALETTE.red, emissiveIntensity: 0.6 })), { y: armY + 0.32 }));
  return { group: g, top: armY + 0.62 };
}

/**
 * Low-poly hillside heightfield over x0..x1, z0..z1 with flat-shaded faces coloured
 * by height (grass -> rock -> snow). heightAt(x, z) gives the surface height above base.
 */
export function hillside({ x0, x1, z0, z1, nx, nz, heightAt, seed = 1, snowLine = 3, rockLine = 0.8 }) {
  const r = rng(seed);
  const pts = [];
  for (let j = 0; j <= nz; j++) {
    const row = [];
    for (let i = 0; i <= nx; i++) {
      const x = x0 + (x1 - x0) * i / nx;
      const z = z0 + (z1 - z0) * j / nz;
      const edge = i === 0 || j === 0 || i === nx || j === nz;
      let y = heightAt(x, z);
      if (!edge && y > 0.3) y += r.range(-0.25, 0.25) * Math.min(1, y);
      row.push([x, Math.max(0, y), z]);
    }
    pts.push(row);
  }
  const pos = [];
  const col = [];
  const c = new THREE.Color();
  const pickColor = (avgY, maxY) => {
    if (maxY > snowLine && avgY > snowLine - 0.5) return r.chance(0.15) ? '#dfe6ea' : '#f4f6f6';
    if (avgY > rockLine) return r.pick([PALETTE.stone, PALETTE.stoneDark, shade(PALETTE.stone, -0.08), PALETTE.gravel]);
    if (avgY > rockLine * 0.55) return r.pick([PALETTE.grassDark, PALETTE.stoneDark, PALETTE.grass]);
    return r.pick([PALETTE.grass, PALETTE.grass, PALETTE.grassDark]);
  };
  const tri = (a, b, cc) => {
    const avg = (a[1] + b[1] + cc[1]) / 3;
    const mx = Math.max(a[1], b[1], cc[1]);
    c.set(pickColor(avg, mx));
    for (const p of [a, b, cc]) { pos.push(...p); col.push(c.r, c.g, c.b); }
  };
  for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) {
    const a = pts[j][i], b = pts[j][i + 1], d = pts[j + 1][i], e = pts[j + 1][i + 1];
    // z grows with j; CCW seen from above (+y)
    if ((i + j) % 2 === 0) { tri(a, d, e); tri(a, e, b); } else { tri(a, d, b); tri(b, d, e); }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat('#ffffff', { vertexColors: true, roughness: 0.95 }));
}

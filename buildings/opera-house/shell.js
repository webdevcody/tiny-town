import * as THREE from 'three';
import { PALETTE, ShapeBuilder, canvasTexture, textured, mat, beam } from '../../src/lib/index.js';

// White ceramic tiles in a chevron pattern, like the real sails.
function tileTexture() {
  return canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#f6f3ea';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ebe6d8';
    ctx.fillRect(0, 0, w / 2, h / 2);
    ctx.fillRect(w / 2, h / 2, w / 2, h / 2);
    ctx.strokeStyle = '#d9d3c2';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, h / 2); ctx.lineTo(w / 2, 0); ctx.lineTo(w, h / 2);
    ctx.moveTo(0, h); ctx.lineTo(w / 2, h / 2); ctx.lineTo(w, h);
    ctx.stroke();
  }, { key: 'opera-house:tiles' });
}

export function shellMaterial() {
  return textured(tileTexture(), { side: THREE.DoubleSide, roughness: 0.55 });
}

/**
 * One sail-shaped shell. Its back is a point on the ground at z = 0; it opens
 * towards +z, where the cross-section is a pointed arch of half-width `halfW`
 * and height `h`, `len` metres from the back. The open face leans forward by
 * `lean` at the apex and is filled with folded bronze glass and mullions.
 */
export function sailShell({ len, halfW, h, lean = 1, segT = 14, segV = 20, glazing = true }) {
  const g = new THREE.Group();
  const width = (t) => halfW * Math.pow(Math.sin((t * Math.PI) / 2), 0.55);
  const height = (t) => h * Math.sin((t * Math.PI) / 2);
  const archY = (v, b) => b * Math.pow(Math.max(0, 1 - Math.abs(v)), 0.5);
  const P = (t, v) => {
    const y = archY(v, height(t));
    return [width(t) * v, y, t * len + (lean * y) / h * t * t];
  };

  const sb = new ShapeBuilder();
  for (let i = 0; i < segT; i++) {
    const t0 = i / segT, t1 = (i + 1) / segT;
    for (let j = 0; j < segV; j++) {
      const v0 = -1 + (2 * j) / segV, v1 = -1 + (2 * (j + 1)) / segV;
      const uvs = [[v0, t0], [v1, t0], [v1, t1], [v0, t1]].map(([v, t]) => [v * halfW * 1.4, t * len * 1.2]);
      sb.quadUV(P(t0, v0), P(t0, v1), P(t1, v1), P(t1, v0), uvs);
    }
  }
  g.add(new THREE.Mesh(sb.build(), shellMaterial()));

  // thick rim along the open edge and a rib along the ridge
  const rim = mat('#fbf9f2');
  for (let j = 0; j < segV; j++) {
    const v0 = -1 + (2 * j) / segV, v1 = -1 + (2 * (j + 1)) / segV;
    g.add(beam(P(1, v0), P(1, v1), 0.32, rim));
  }
  for (let i = 2; i < segT; i++) g.add(beam(P((i - 1) / segT, 0), P(i / segT, 0), 0.16, rim));

  if (glazing) {
    // folded glass wall a little inside the rim: two planes meeting in a vertical crease
    const inset = 0.35;
    const front = (v) => { const p = P(1, v); return [p[0] * 0.97, p[1] * 0.97, p[2] - inset]; };
    const crease = [0, 0, len - inset + 0.9];
    const creaseTop = front(0);
    const gb = new ShapeBuilder();
    const n = segV / 2;
    for (let j = 0; j < n; j++) {
      // left half (v -1..0) and right half (v 0..1), fanned from the crease foot
      const a = front(-1 + j / n), b = front(-1 + (j + 1) / n);
      gb.tri(crease, a, b);
      const c = front(j / n), d = front((j + 1) / n);
      gb.tri(crease, c, d);
    }
    const gmesh = new THREE.Mesh(gb.build(), mat('#6e5233', { side: THREE.DoubleSide, roughness: 0.25, metalness: 0.4, emissive: '#a8743a', emissiveIntensity: 0.25 }));
    g.add(gmesh);
    // mullions fanning up from the crease foot
    const mull = mat(PALETTE.darkGrey);
    g.add(beam(crease, creaseTop, 0.12, mull));
    for (const v of [-0.75, -0.5, -0.25, 0.25, 0.5, 0.75]) g.add(beam(crease, front(v), 0.09, mull));
    // transoms: rings of the fan at fixed fractions
    for (const f of [0.35, 0.65]) {
      const lerp = (p) => [crease[0] + (p[0] - crease[0]) * f, crease[1] + (p[1] - crease[1]) * f, crease[2] + (p[2] - crease[2]) * f];
      for (let j = 0; j < segV; j += 2) g.add(beam(lerp(front(-1 + (2 * j) / segV)), lerp(front(-1 + (2 * (j + 2)) / segV)), 0.07, mull));
    }
    // entrance doors at the foot
    g.add(beam([-1.2, 1.1, len - inset + 0.95], [1.2, 1.1, len - inset + 0.95], 0.05, mat(PALETTE.darkGrey)));
  }
  return g;
}

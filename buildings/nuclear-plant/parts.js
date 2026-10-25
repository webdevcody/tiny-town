import * as THREE from 'three';
import { PALETTE, mat, place, beam, canvasTexture, textured } from '../../src/lib/index.js';

/**
 * Hyperbolic cooling tower shell on an open ring of X-braced legs.
 * Base on y = 0. r(y) = throat * sqrt(1 + ((y - throatY) / b)^2).
 */
export function coolingTower({ baseR = 6.4, throatR = 3.9, topR = 4.4, h = 26, legH = 1.6, segments = 40, color = PALETTE.concrete } = {}) {
  const g = new THREE.Group();
  const shellH = h - legH;
  // solve the hyperbola so it passes through baseR at 0 and topR at shellH
  const kb = (baseR / throatR) ** 2 - 1;
  const kt = (topR / throatR) ** 2 - 1;
  // throatY / b = sqrt(kb), (shellH - throatY) / b = sqrt(kt)
  const b = shellH / (Math.sqrt(kb) + Math.sqrt(kt));
  const ty = b * Math.sqrt(kb);
  const rAt = (y) => throatR * Math.sqrt(1 + ((y - ty) / b) ** 2);
  const n = 16;
  const outer = [];
  const inner = [];
  for (let i = 0; i <= n; i++) {
    const y = (shellH * i) / n;
    outer.push(new THREE.Vector2(rAt(y), y));
    inner.push(new THREE.Vector2(rAt(y) - 0.3, y));
  }
  const smooth = { flatShading: false, roughness: 0.95 };
  const outerM = mat(color, smooth);
  const innerM = mat('#6f6c66', { ...smooth, side: THREE.BackSide });
  const shell = new THREE.Mesh(new THREE.LatheGeometry(outer, segments), outerM);
  const shellIn = new THREE.Mesh(new THREE.LatheGeometry(inner, segments), innerM);
  // weathered band near the lip and a rim ring
  const lip = [];
  for (let i = 0; i <= 3; i++) {
    const y = shellH - 2.4 + (2.4 * i) / 3;
    lip.push(new THREE.Vector2(rAt(y) + 0.03, y));
  }
  const band = new THREE.Mesh(new THREE.LatheGeometry(lip, segments), mat('#a29e95', smooth));
  const rim = new THREE.Mesh(new THREE.RingGeometry(topR - 0.3, topR + 0.03, segments), mat('#d6d2c8'));
  rim.rotation.x = -Math.PI / 2;
  rim.position.y = shellH + 0.01;
  for (const m of [shell, shellIn, band, rim]) {
    m.position.y += legH;
    g.add(m);
  }
  // X-braced legs
  const legM = mat(PALETTE.concreteDark);
  const legs = 28;
  for (let i = 0; i < legs; i++) {
    const a0 = (i / legs) * Math.PI * 2;
    const a1 = ((i + 1) / legs) * Math.PI * 2;
    const r = baseR - 0.15;
    g.add(beam([Math.cos(a0) * r, 0, Math.sin(a0) * r], [Math.cos(a1) * r, legH, Math.sin(a1) * r], 0.22, legM));
    g.add(beam([Math.cos(a1) * r, 0, Math.sin(a1) * r], [Math.cos(a0) * r, legH, Math.sin(a0) * r], 0.22, legM));
  }
  // basin: dark water at the foot, ring wall
  const basin = new THREE.Mesh(new THREE.CircleGeometry(baseR - 0.3, segments), mat('#3c5a66', { roughness: 0.3 }));
  basin.rotation.x = -Math.PI / 2;
  basin.position.y = 0.35;
  g.add(basin);
  g.userData.topY = h;
  g.userData.topR = topR;
  return g;
}

/** Billowing steam plume of overlapping soft spheres, base on y = 0. */
export function steamPlume({ r = 3.6, seed = 1, drift = [1, 0.4] } = {}) {
  const g = new THREE.Group();
  const m = mat('#f4f4f2', { flatShading: false, roughness: 1, transparent: true, opacity: 0.9, emissive: '#ffffff', emissiveIntensity: 0.12 });
  let s = seed * 9301 + 49297;
  const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  const puffs = [
    [0, 0.4, 0, 1.0], [0.9, 1.8, 0.6, 0.9], [-0.8, 1.5, -0.6, 0.8],
    [1.9, 3.2, -0.2, 0.8], [0.6, 3.6, 1.0, 0.7], [3.0, 4.4, 0.8, 0.65],
    [2.2, 5.4, -0.5, 0.5], [4.0, 5.6, 0.2, 0.45],
  ];
  for (const [px, py, pz, ps] of puffs) {
    const geo = new THREE.SphereGeometry(r * ps * (0.9 + rnd() * 0.2), 14, 10);
    const p = new THREE.Mesh(geo, m);
    p.position.set(px * drift[0] + (rnd() - 0.5) * 0.6, py, pz + px * drift[1] + (rnd() - 0.5) * 0.6);
    p.scale.y = 0.7;
    g.add(p);
  }
  return g;
}

/** Yellow radiation-trefoil warning plaque material. */
export function trefoilMat() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#f2c81e';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = '#1b1b1b';
    const cx = W / 2, cy = H / 2;
    for (let i = 0; i < 3; i++) {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / 3;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, W * 0.4, a - Math.PI / 6, a + Math.PI / 6);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = '#f2c81e';
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.arc(cx, cy, W * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'nuclear-plant:trefoil', repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
}

/** Oil-cooled transformer: tank with radiator fins and three bushings. Front +Z. */
export function transformer() {
  const g = new THREE.Group();
  const body = mat('#7c8a7a', { roughness: 0.6 });
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.4, 2.0, 1.6), body), { y: 1.15 }));
  g.add(place(new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.15, 2.0), mat(PALETTE.concrete)), { y: 0.075 }));
  const fin = mat('#6a776a');
  for (let i = 0; i < 6; i++) {
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.5), fin), { x: -1.0 + i * 0.4, y: 1.1, z: 1.05 }));
    g.add(place(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.6, 0.5), fin), { x: -1.0 + i * 0.4, y: 1.1, z: -1.05 }));
  }
  const bush = mat('#8d5a3a', { roughness: 0.4 });
  for (const x of [-0.7, 0, 0.7]) {
    const c = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.1, 8), bush);
    c.position.set(x, 2.7, 0);
    g.add(c);
  }
  return g;
}

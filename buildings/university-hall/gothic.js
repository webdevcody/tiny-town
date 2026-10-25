// Collegiate-gothic parts that src/lib does not have: lancet-window facades,
// pointed-arch arcades, battlements, corner turrets and a clock face.
import * as THREE from 'three';
import {
  PALETTE, FLOOR, boxGeometry, canvasTexture, shade, textured, mat, box, cylinder, cone, group, place,
} from '../../src/lib/index.js';

// Draw a pointed (gothic) arch outline: springs at y = top + rise, apex at y = top.
function lancetPath(ctx, x, top, w, h, rise) {
  ctx.beginPath();
  ctx.moveTo(x, top + h);
  ctx.lineTo(x, top + rise);
  ctx.quadraticCurveTo(x, top + rise * 0.25, x + w / 2, top);
  ctx.quadraticCurveTo(x + w, top + rise * 0.25, x + w, top + rise);
  ctx.lineTo(x + w, top + h);
  ctx.closePath();
}

/**
 * One bay x one storey of honey stone with a leaded lancet window.
 * kind: 'storey' (one lancet per floor) or 'hall' (tall twin-light window with tracery).
 */
export function lancetTexture({ wall = PALETTE.sandstone, kind = 'storey', lit = false } = {}) {
  const W = 64, H = kind === 'hall' ? 160 : 96;
  return canvasTexture(W, H, (ctx, w, h) => {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, w, h);
    // ashlar courses
    ctx.fillStyle = shade(wall, -0.1);
    for (let y = 6; y < h; y += 8) ctx.fillRect(0, y, w, 1);
    for (let y = 0, row = 0; y < h; y += 8, row++) {
      for (let x = (row % 2) * 10; x < w; x += 20) ctx.fillRect(x, y, 1, 7);
    }
    const ww = kind === 'hall' ? 34 : 24;
    const x = (w - ww) / 2;
    const top = kind === 'hall' ? 14 : 16;
    const wh = kind === 'hall' ? h - 30 : h - 32;
    const rise = ww * 0.75;
    // stone surround + hood mould
    ctx.fillStyle = shade(wall, 0.22);
    lancetPath(ctx, x - 4, top - 5, ww + 8, wh + 9, rise + 2);
    ctx.fill();
    ctx.fillStyle = shade(wall, -0.3);
    ctx.fillRect(x - 6, top + wh + 3, ww + 12, 4); // sill shadow
    ctx.fillStyle = shade(wall, 0.3);
    ctx.fillRect(x - 6, top + wh + 1, ww + 12, 3); // sill
    // glass
    const g = ctx.createLinearGradient(0, top, 0, top + wh);
    g.addColorStop(0, lit ? PALETTE.windowLit : '#3d5878');
    g.addColorStop(1, lit ? shade(PALETTE.windowLit, -0.2) : '#24344a');
    ctx.fillStyle = g;
    lancetPath(ctx, x, top, ww, wh, rise);
    ctx.fill();
    // leading: mullion(s), transoms, diamond quarries hint
    ctx.fillStyle = shade(wall, 0.15);
    if (kind === 'hall') {
      ctx.fillRect(w / 2 - 1.5, top + rise * 0.6, 3, wh - rise * 0.6);
      for (let y = top + rise + 18; y < top + wh - 4; y += 26) ctx.fillRect(x, y, ww, 2);
      // tracery: small circle in the head
      ctx.strokeStyle = shade(wall, 0.15);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(w / 2, top + rise * 0.45, 5, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.fillRect(w / 2 - 1, top + rise * 0.5, 2, wh - rise * 0.5);
      ctx.fillRect(x, top + rise + 10, ww, 2);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x + 2, top + rise, 3, wh - rise - 2);
  }, { key: `university-hall:lancet:${wall}:${kind}:${lit}` });
}

/**
 * Box with lancet windows on its sides (same contract as facadeBlock: base at y = 0).
 *   gothicBlock({ w, d, h, floorHeight, bay, wall, kind, roof, blank: ['left', ...] })
 */
export function gothicBlock({ w, d, h, floorHeight = FLOOR, bay = 3, wall = PALETTE.sandstone, kind = 'storey', roof = PALETTE.roofSlate, blank = [] }) {
  const geom = boxGeometry(w, h, d);
  const uv = geom.attributes.uv;
  const widths = [d, d, w, w, w, w];
  for (let i = 0; i < uv.count; i++) {
    const f = Math.floor(i / 4);
    if (f === 2 || f === 3) continue;
    const nb = Math.max(1, Math.round(widths[f] / bay));
    uv.setXY(i, (uv.getX(i) * nb) / widths[f], uv.getY(i) / floorHeight);
  }
  const fm = textured(lancetTexture({ wall, kind }));
  const plain = mat(wall);
  const side = (n) => (blank.includes(n) ? plain : fm);
  const r = typeof roof === 'string' ? mat(roof) : roof;
  return new THREE.Mesh(geom, [side('right'), side('left'), r, r, side('front'), side('back')]);
}

/**
 * Wall pierced by a row of pointed arches, open at the bottom (cloister arcade).
 * Length along X, thickness along Z, centred; base at y = 0.
 *   arcade({ length, h, bays, pier, spring, depth, material })
 */
export function arcade({ length, h, bays, pier = 0.5, spring = 1.8, depth = 0.45, material }) {
  const open = (length - pier * (bays + 1)) / bays;
  const L = length / 2;
  const s = new THREE.Shape();
  s.moveTo(-L, 0);
  const steps = 5;
  for (let i = 0; i < bays; i++) {
    const left = -L + pier * (i + 1) + open * i;
    const right = left + open;
    const mid = (left + right) / 2;
    const rise = Math.min(open * 0.72, h - spring - 0.25);
    s.lineTo(left, 0);
    s.lineTo(left, spring);
    for (let k = 1; k <= steps; k++) {
      const t = k / steps;
      s.lineTo(left + (mid - left) * (1 - Math.cos((t * Math.PI) / 2)), spring + rise * Math.sin((t * Math.PI) / 2));
    }
    for (let k = steps - 1; k >= 0; k--) {
      const t = k / steps;
      s.lineTo(right - (right - mid) * (1 - Math.cos((t * Math.PI) / 2)), spring + rise * Math.sin((t * Math.PI) / 2));
    }
    s.lineTo(right, 0);
  }
  s.lineTo(L, 0);
  s.lineTo(L, h);
  s.lineTo(-L, h);
  s.lineTo(-L, 0);
  const geom = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 1 });
  geom.translate(0, 0, -depth / 2);
  const m = typeof material === 'string' ? mat(material) : material;
  return new THREE.Mesh(geom, m);
}

/** Crenellated parapet (merlons) round a w x d rectangle; base at y = 0. */
export function battlements({ w, d, h = 0.9, t = 0.35, merlon = 0.6, material }) {
  const g = new THREE.Group();
  const m = typeof material === 'string' ? mat(material) : material;
  g.add(place(box(w, h * 0.45, t, m), { z: d / 2 - t / 2 }));
  g.add(place(box(w, h * 0.45, t, m), { z: -d / 2 + t / 2 }));
  g.add(place(box(t, h * 0.45, d - 2 * t, m), { x: w / 2 - t / 2 }));
  g.add(place(box(t, h * 0.45, d - 2 * t, m), { x: -w / 2 + t / 2 }));
  const row = (len, fn) => {
    const n = Math.max(2, Math.round(len / (merlon * 2)));
    for (let i = 0; i < n; i++) fn(-len / 2 + merlon / 2 + ((len - merlon) * i) / (n - 1));
  };
  row(w, (x) => {
    g.add(place(box(merlon, h * 0.55, t, m), { x, y: h * 0.45, z: d / 2 - t / 2 }));
    g.add(place(box(merlon, h * 0.55, t, m), { x, y: h * 0.45, z: -d / 2 + t / 2 }));
  });
  row(d, (z) => {
    g.add(place(box(t, h * 0.55, merlon, m), { x: w / 2 - t / 2, y: h * 0.45, z }));
    g.add(place(box(t, h * 0.55, merlon, m), { x: -w / 2 + t / 2, y: h * 0.45, z }));
  });
  return g;
}

/** Slim pinnacle: square shaft with a tall pointed cap. */
export function pinnacle({ r = 0.3, h = 2.2, material, capMaterial }) {
  return group(
    box(r * 2, h * 0.4, r * 2, material),
    place(cone(r * 1.15, h * 0.6, capMaterial ?? material, 4), { y: h * 0.4, ry: 45 })
  );
}

/** Octagonal corner turret with an ogee-ish lead cap. */
export function turret({ r = 0.6, h = 8, wall, cap = PALETTE.roofSlate, gold = PALETTE.glassGold }) {
  return group(
    cylinder(r, r, h, wall, 8),
    place(cylinder(r * 1.18, r * 1.18, 0.35, shade(wall, 0.15), 8), { y: h }),
    place(cone(r * 1.1, r * 3.2, cap, 8), { y: h + 0.35 }),
    place(cylinder(0.05, 0.05, 0.6, gold, 4), { y: h + 0.35 + r * 3.2 - 0.1 })
  );
}

/** Round clock face (facing +z) with Roman-ish ticks and gilded hands. */
export function clockFace({ r = 1.1 } = {}) {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#1f2f4d';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9b75a';
    ctx.beginPath();
    ctx.arc(64, 64, 62, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f3ecd8';
    ctx.beginPath();
    ctx.arc(64, 64, 54, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#20232a';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.save();
      ctx.translate(64 + Math.sin(a) * 46, 64 - Math.cos(a) * 46);
      ctx.rotate(a);
      ctx.fillRect(-2, -6, 4, 12);
      ctx.restore();
    }
    ctx.strokeStyle = '#20232a';
    ctx.lineCap = 'round';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64 + 22, 64 - 14); // hour hand ~ 2 o'clock
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(64, 64);
    ctx.lineTo(64, 64 - 40); // minute hand at 12
    ctx.stroke();
  }, { key: 'university-hall:clock', repeat: false });
  const face = textured(tex);
  const rim = mat('#d9b75a', { metalness: 0.4, roughness: 0.4 });
  const geom = new THREE.CylinderGeometry(r, r, 0.12, 20);
  geom.rotateX(Math.PI / 2);
  // planar uvs for the front cap
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / (2 * r) + 0.5, pos.getY(i) / (2 * r) + 0.5);
  return new THREE.Mesh(geom, [rim, face, rim]);
}

// Gothic helpers for the cathedral: pointed-arch solids, lancet-window walls,
// rose windows, flying buttresses and copper roofing. Local to this building.
import * as THREE from 'three';
import { canvasTexture, textured, mat, shade, place, group, box, cone } from '../../src/lib/index.js';

export const STONE = '#cfc2a0';
export const STONE_D = '#a6977a';
export const STONE_L = '#e6dcc2';
export const COPPER = '#4f9476';
export const GLASS = '#26406e';

const PX = 24; // texture pixels per metre

// ---------------------------------------------------------------------------
// pointed arches

/** Pointed (gothic) arch outline in the XY plane: base centred on x = 0, y = 0. */
export function archShape(w, spring, k = 1) {
  const r = k * w;
  const c = r - w / 2; // arc centres sit at x = ±(w/2 - r)
  const tApex = Math.acos(c / r);
  const s = new THREE.Shape();
  s.moveTo(-w / 2, 0);
  s.lineTo(w / 2, 0);
  s.lineTo(w / 2, spring);
  const n = 8;
  for (let i = 1; i <= n; i++) {
    const t = (tApex * i) / n;
    s.lineTo(-c + r * Math.cos(t), spring + r * Math.sin(t));
  }
  for (let i = n - 1; i >= 0; i--) {
    const t = (tApex * i) / n;
    s.lineTo(c - r * Math.cos(t), spring + r * Math.sin(t));
  }
  s.lineTo(-w / 2, 0);
  return s;
}

export function archRise(w, k = 1) {
  const r = k * w;
  const c = r - w / 2;
  return Math.sqrt(r * r - c * c);
}

/** Pointed-arch slab: base centred, sticks out towards +z by `depth`. */
export function archSlab(w, spring, depth, material, k = 1) {
  const geo = new THREE.ExtrudeGeometry(archShape(w, spring, k), { depth, bevelEnabled: false, curveSegments: 4 });
  return new THREE.Mesh(geo, typeof material === 'string' ? mat(material) : material);
}

/** Any closed XY outline extruded along +z from z = 0 to depth. */
export function slabXY(points, depth, material) {
  const s = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  return new THREE.Mesh(geo, typeof material === 'string' ? mat(material) : material);
}

/** Gothic portal (faces +z): stepped archivolts, wooden door, gable (wimperg) above. */
export function portal({ w = 2.4, spring = 2.6, gable = true } = {}) {
  const g = new THREE.Group();
  const rise = archRise(w + 1.6);
  g.add(archSlab(w + 1.6, spring, 0.45, STONE_L));
  g.add(archSlab(w + 0.9, spring, 0.55, STONE_D));
  g.add(archSlab(w + 0.4, spring, 0.62, STONE_L));
  g.add(archSlab(w, spring, 0.7, '#5a3a22'));
  // tympanum line + door split
  g.add(place(box(w, 0.12, 0.05, mat(STONE_D)), { y: spring, z: 0.7 }));
  g.add(place(box(0.08, spring, 0.05, mat('#3b2615')), { z: 0.7 }));
  if (gable) {
    const top = spring + rise + 1.4;
    const half = (w + 2) / 2;
    g.add(slabXY([[-half, spring + 0.4], [half, spring + 0.4], [0, top]], 0.3, STONE_L));
    g.add(place(pinnacle(0.22, 1.1), { y: top - 0.25, z: 0.15 }));
  }
  return g;
}

/** Small stone pinnacle: square shaft with a pointed cap. */
export function pinnacle(r = 0.3, h = 1.6, material) {
  const m = material ?? mat(STONE_L);
  return group(
    place(box(r * 1.6, h * 0.45, r * 1.6, m), {}),
    place(cone(r * 1.1, h * 0.6, m, 4), { y: h * 0.45, ry: 45 }),
  );
}

// ---------------------------------------------------------------------------
// textures

function ashlar(ctx, w, h, color) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);
  ctx.strokeStyle = shade(color, -0.12);
  ctx.lineWidth = 1;
  const course = 0.6 * PX;
  let row = 0;
  for (let y = h; y > 0; y -= course, row++) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(w, y + 0.5);
    ctx.stroke();
    const off = row % 2 ? 0.6 * PX : 0;
    for (let x = off; x < w; x += 1.2 * PX) {
      ctx.beginPath();
      ctx.moveTo(x + 0.5, y);
      ctx.lineTo(x + 0.5, y - course);
      ctx.stroke();
    }
  }
}

function archPath(ctx, cx, yBottom, w, yTop) {
  // canvas coords: y grows downwards; yTop < yBottom
  const rise = archRise(w);
  const spring = yTop + rise;
  const r = w;
  const c = r - w / 2;
  const tApex = Math.acos(c / r);
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, yBottom);
  ctx.lineTo(cx - w / 2, spring);
  const n = 10;
  for (let i = 0; i <= n; i++) {
    const tt = (tApex * i) / n;
    ctx.lineTo(cx + c - r * Math.cos(tt), spring - r * Math.sin(tt));
  }
  for (let i = n - 1; i >= 0; i--) {
    const tt = (tApex * i) / n;
    ctx.lineTo(cx - c + r * Math.cos(tt), spring - r * Math.sin(tt));
  }
  ctx.lineTo(cx + w / 2, yBottom);
  ctx.closePath();
}

function stainedGlass(ctx, x0, y0, x1, y1, seed, kind) {
  const grd = ctx.createLinearGradient(0, y0, 0, y1);
  if (kind === 'louvre') {
    ctx.fillStyle = '#2b2622';
    ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
    ctx.fillStyle = '#6b5f50';
    for (let y = y0 + 4; y < y1; y += 5) ctx.fillRect(x0, y, x1 - x0, 2);
    return;
  }
  grd.addColorStop(0, '#3a5aa0');
  grd.addColorStop(1, GLASS);
  ctx.fillStyle = grd;
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  // little coloured panes
  let s = seed;
  const colors = ['#b8333a', '#d9a23a', '#3f7fbf', '#7a3f8f', '#4c9a6a'];
  for (let y = y0 + 2; y < y1; y += 5) {
    for (let x = x0 + 1; x < x1; x += 4) {
      s = (s * 9301 + 49297) % 233280;
      if (s / 233280 < 0.35) {
        ctx.fillStyle = colors[s % colors.length];
        ctx.fillRect(x, y, 2, 2);
      }
    }
  }
}

/**
 * One bay of stone wall with a lancet window, tiled along a wall.
 * opts: bw (bay width m), h (wall height m), sill, top (apex height m), ww (window width m),
 *       twin (two lights + oculus), kind ('glass'|'louvre'|'blind'), bands ([y...] string courses)
 */
export function bayTexture({ bw, h, sill, top, ww, twin = false, kind = 'glass', bands = [], wall = STONE }) {
  const key = 'gothic-cathedral:bay:' + JSON.stringify({ bw, h, sill, top, ww, twin, kind, bands, wall });
  return canvasTexture(Math.round(bw * PX), Math.round(h * PX), (ctx, W, H) => {
    ashlar(ctx, W, H, wall);
    const sx = W / bw, sy = H / h;
    const Y = (m) => H - m * sy;
    for (const b of bands) {
      ctx.fillStyle = shade(wall, 0.18);
      ctx.fillRect(0, Y(b + 0.15), W, 0.3 * sy);
      ctx.fillStyle = shade(wall, -0.3);
      ctx.fillRect(0, Y(b - 0.15), W, 0.12 * sy);
    }
    if (kind === 'none') return;
    const cx = W / 2;
    const w = ww * sx;
    // deep reveal
    ctx.fillStyle = shade(wall, -0.35);
    archPath(ctx, cx, Y(sill) + 2, w + 6, Y(top) - 3);
    ctx.fill();
    ctx.fillStyle = shade(wall, 0.2);
    archPath(ctx, cx, Y(sill), w + 2, Y(top) - 1);
    ctx.fill();
    ctx.save();
    archPath(ctx, cx, Y(sill), w, Y(top));
    ctx.clip();
    if (kind === 'blind') {
      ctx.fillStyle = shade(wall, -0.18);
      ctx.fillRect(0, 0, W, H);
    } else {
      stainedGlass(ctx, cx - w / 2, Y(top), cx + w / 2, Y(sill), Math.round(bw * 100 + h * 7), kind);
    }
    ctx.restore();
    if (twin && kind !== 'blind') {
      // central mullion + oculus
      ctx.strokeStyle = shade(wall, 0.15);
      ctx.lineWidth = Math.max(2, w * 0.08);
      ctx.beginPath();
      ctx.moveTo(cx, Y(sill));
      ctx.lineTo(cx, Y(top) + archRise(w) * 0.85);
      ctx.stroke();
      const r = w * 0.2;
      ctx.beginPath();
      ctx.arc(cx, Y(top) + archRise(w) * 0.55, r, 0, Math.PI * 2);
      ctx.stroke();
    } else if (kind === 'glass') {
      ctx.strokeStyle = shade(wall, 0.1);
      ctx.lineWidth = 1;
      for (let y = Y(sill) - 0.8 * sy; y > Y(top) + archRise(w) * 0.6; y -= 0.8 * sy) {
        ctx.beginPath();
        ctx.moveTo(cx - w / 2, y);
        ctx.lineTo(cx + w / 2, y);
        ctx.stroke();
      }
    }
  });
}

/** Plane (facing +z) of tiled lancet bays, base centred at y = 0. */
export function windowWall(len, h, opts) {
  const n = Math.max(1, Math.round(len / (opts.bay ?? 3)));
  const bw = Math.round((len / n) * 100) / 100;
  const tex = bayTexture({ ...opts, bw, h });
  const geo = new THREE.PlaneGeometry(len, h);
  geo.translate(0, h / 2, 0);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * n);
  return new THREE.Mesh(geo, textured(tex, { roughness: 0.85 }));
}

/**
 * Put window walls on the faces of a block.
 * block: { x, z, w, d, y, h }; sides: subset of ['front','back','left','right'].
 */
export function dressBlock(block, sides, opts) {
  const g = new THREE.Group();
  const { x = 0, z = 0, w, d, y = 0, h } = block;
  const e = 0.03;
  for (const s of sides) {
    if (s === 'front') g.add(place(windowWall(w, h, opts), { x, y, z: z + d / 2 + e }));
    if (s === 'back') g.add(place(windowWall(w, h, opts), { x, y, z: z - d / 2 - e, ry: 180 }));
    if (s === 'right') g.add(place(windowWall(d, h, opts), { x: x + w / 2 + e, y, z, ry: 90 }));
    if (s === 'left') g.add(place(windowWall(d, h, opts), { x: x - w / 2 - e, y, z, ry: -90 }));
  }
  return g;
}

/** Rose window disc facing +z (stone ring, petals of stained glass). */
export function roseWindow(r) {
  const tex = canvasTexture(256, 256, (ctx, W) => {
    const c = W / 2;
    ctx.fillStyle = STONE_L;
    ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = shade(STONE, -0.3);
    ctx.beginPath();
    ctx.arc(c, c, c - 4, 0, Math.PI * 2);
    ctx.fill();
    const n = 12;
    const rg = ctx.createRadialGradient(c, c, 10, c, c, c - 14);
    rg.addColorStop(0, '#d9a23a');
    rg.addColorStop(0.25, '#b8333a');
    rg.addColorStop(0.55, '#2f55a8');
    rg.addColorStop(1, '#1d3470');
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(c, c, c - 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = STONE_L;
    ctx.lineWidth = 5;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(c + Math.cos(a) * 26, c + Math.sin(a) * 26);
      ctx.lineTo(c + Math.cos(a) * (c - 14), c + Math.sin(a) * (c - 14));
      ctx.stroke();
      // petal circles
      const a2 = a + Math.PI / n;
      ctx.beginPath();
      ctx.arc(c + Math.cos(a2) * 78, c + Math.sin(a2) * 78, 17, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(c, c, 26, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, c - 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#f0c850';
    ctx.beginPath();
    ctx.arc(c, c, 10, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'gothic-cathedral:rose', repeat: false });
  const disc = new THREE.Mesh(new THREE.CircleGeometry(r, 32), textured(tex, { roughness: 0.5 }));
  const ring = new THREE.Mesh(new THREE.CylinderGeometry(r + 0.35, r + 0.35, 0.25, 32), mat(STONE_L));
  ring.rotation.x = Math.PI / 2;
  ring.position.z = 0.02;
  disc.position.z = 0.16;
  return group(ring, disc);
}

/** Standing-seam copper with patina streaks. UVs in metres. */
export function copperMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = COPPER;
    ctx.fillRect(0, 0, W, H);
    let s = 7;
    for (let i = 0; i < 40; i++) {
      s = (s * 9301 + 49297) % 233280;
      const x = s % W;
      s = (s * 9301 + 49297) % 233280;
      const y = s % H;
      ctx.fillStyle = i % 2 ? shade(COPPER, 0.12) : shade(COPPER, -0.08);
      ctx.fillRect(x, y, 6, 10);
    }
    ctx.fillStyle = shade(COPPER, 0.18);
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 3, H);
    ctx.fillStyle = shade(COPPER, -0.2);
    for (let x = 3; x < W; x += 16) ctx.fillRect(x, 0, 1, H);
  }, { key: 'gothic-cathedral:copper' });
  tex.repeat.set(0.5, 0.5);
  return textured(tex, { roughness: 0.55, metalness: 0.15 });
}

/**
 * Flying buttress arching from an outer pier (x = xOut, top at yOut) to the wall
 * (x = xIn, landing at yIn). Works for xOut on either side. Thickness along z.
 */
export function flyer({ xOut, xIn, yOut, yIn, t = 0.5, dOut = 2.4, dIn = 1.1, sag = 2.8, material }) {
  const dir = Math.sign(xIn - xOut);
  const span = Math.abs(xIn - xOut);
  const pts = [[xOut, yOut - dOut], [xOut, yOut], [xIn, yIn], [xIn, yIn - dIn]];
  // curved underside back towards the pier
  const n = 8;
  for (let i = 1; i < n; i++) {
    const u = i / n;
    const x = xIn - dir * span * u;
    const yLine = yIn - dIn + (yOut - dOut - (yIn - dIn)) * u;
    const y = yLine + sag * Math.sin(u * Math.PI * 0.5) * (1 - u); // arched soffit
    pts.push([x, y]);
  }
  const m = slabXY(pts, t, material ?? mat(STONE));
  m.position.z = -t / 2;
  return m;
}

/** Stepped buttress pier with a pinnacle on top (size along x = w, along z = d). */
export function pier({ w = 1.4, d = 0.8, h = 11, material }) {
  const m = material ?? mat(STONE);
  const g = new THREE.Group();
  g.add(box(w, h * 0.55, d, m));
  g.add(place(box(w * 0.8, h * 0.45, d * 0.85, m), { y: h * 0.55 }));
  g.add(place(box(w * 0.9, 0.18, d, mat(STONE_D)), { y: h * 0.55 - 0.1 }));
  g.add(place(pinnacle(0.32, 2.6), { y: h }));
  return g;
}


// Local helpers for the Japanese Ryokan Inn: curved kawara roofs, shoji walls,
// garden textures and small props. Nothing here touches src/lib.
import * as THREE from 'three';
import {
  PALETTE, ShapeBuilder, canvasTexture, signTexture, textured, mat, emissive, water,
  box, cylinder, cone, sphere, beam, place, group, shade,
} from '../../src/lib/index.js';

export const C = {
  kawara: '#6c7279',
  kawaraDark: '#4a4f56',
  timber: '#4a3020',
  timberMid: '#6b4a2e',
  cedar: '#8a5d38',
  deck: '#a87c4e',
  plaster: '#ece4cf',
  paper: '#f6efda',
  paperLit: '#ffdf96',
  vermilion: '#c8402a',
  indigo: '#26375e',
  rock: '#8d8a84',
  rockDark: '#6c6a66',
  moss: '#5e8a3a',
  pine: '#2f5a2a',
  maple: '#c9472b',
  onsen: '#7fcbc4',
  bamboo: '#8fae4a',
};

// ---------------------------------------------------------------------------
// textures / materials

function repeatTex(tex, sx, sy) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(sx, sy);
  t.needsUpdate = true;
  return t;
}

/** Grey kawara tiles: rounded cover-tile columns running down the slope, 1 texture = 1 m. */
export function kawaraMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = C.kawaraDark;
    ctx.fillRect(0, 0, W, H);
    const cols = 4;
    const cw = W / cols;
    for (let i = 0; i < cols; i++) {
      const g = ctx.createLinearGradient(i * cw, 0, (i + 1) * cw, 0);
      g.addColorStop(0, shade(C.kawara, -0.35));
      g.addColorStop(0.35, shade(C.kawara, 0.18));
      g.addColorStop(0.6, C.kawara);
      g.addColorStop(1, shade(C.kawara, -0.3));
      ctx.fillStyle = g;
      ctx.fillRect(i * cw + 1, 0, cw - 2, H);
    }
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    for (let y = 0; y < H; y += 16) ctx.fillRect(0, y, W, 2);
  }, { key: 'japanese-ryokan:kawara' });
  return textured(tex, { side: THREE.DoubleSide, roughness: 0.7 });
}

/** Gable infill: dark timber lattice over white plaster. UVs in metres. */
export function gableMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = C.plaster;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = C.timber;
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 5, H);
    ctx.fillRect(0, H - 6, W, 6);
  }, { key: 'japanese-ryokan:gable' });
  return textured(tex, { side: THREE.DoubleSide });
}

/**
 * One timber-frame bay (posts at both edges) for a storey. The texture is
 * mapped one-bay-per-repeat by bayWall().
 *   kind 'ground': wood skirting, sliding shoji, plaster band
 *   kind 'upper':  plaster dado (hidden by the pent roof), shoji windows, plaster band
 */
export function bayTexture(kind, lit = false) {
  return canvasTexture(96, 192, (ctx, W, H) => {
    ctx.fillStyle = C.plaster;
    ctx.fillRect(0, 0, W, H);
    const paper = lit ? C.paperLit : C.paper;
    const shoji = (x0, y0, x1, y1, cols, rows) => {
      ctx.fillStyle = paper;
      ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      ctx.fillStyle = C.timberMid;
      for (let i = 0; i <= cols; i++) ctx.fillRect(x0 + ((x1 - x0) * i) / cols - 1, y0, 2, y1 - y0);
      for (let j = 0; j <= rows; j++) ctx.fillRect(x0, y0 + ((y1 - y0) * j) / rows - 1, x1 - x0, 2);
      ctx.fillStyle = C.timber;
      ctx.fillRect(W / 2 - 2, y0, 4, y1 - y0); // meeting stiles of the two sliding panels
    };
    if (kind === 'ground') {
      // koshiita: dark wood skirting boards
      ctx.fillStyle = C.cedar;
      ctx.fillRect(0, H * 0.8, W, H * 0.2);
      ctx.fillStyle = shade(C.cedar, -0.25);
      for (let x = 0; x < W; x += 12) ctx.fillRect(x, H * 0.8, 2, H * 0.2);
      shoji(8, H * 0.24, W - 8, H * 0.78, 4, 6);
      ctx.fillStyle = C.timber;
      ctx.fillRect(0, H * 0.2, W, 9); // nageshi beam
      ctx.fillRect(0, H * 0.77, W, 8); // sill
    } else {
      shoji(8, H * 0.12, W - 8, H * 0.56, 4, 4);
      // wooden balustrade in front of the windows
      ctx.fillStyle = C.timber;
      ctx.fillRect(0, H * 0.1, W, 6);
      ctx.fillRect(0, H * 0.5, W, 7);
      ctx.fillStyle = C.timberMid;
      for (let x = 6; x < W; x += 10) ctx.fillRect(x, H * 0.5, 3, H * 0.12);
      ctx.fillStyle = C.timber;
      ctx.fillRect(0, H * 0.62, W, 6);
    }
    // posts at the bay edges + eave beam
    ctx.fillStyle = C.timber;
    ctx.fillRect(0, 0, 6, H);
    ctx.fillRect(W - 6, 0, 6, H);
    ctx.fillRect(0, 0, W, 7);
  }, { key: `japanese-ryokan:bay:${kind}:${lit}` });
}

/**
 * Box of walls whose faces show whole bays of `tex` (no metre UVs: each face
 * gets round(length / bay) repeats across, one repeat up).
 */
export function bayWall(w, h, d, { tex, sideTex = tex, bay = 1.5, top = C.timber }) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const nx = Math.max(1, Math.round(w / bay));
  const nz = Math.max(1, Math.round(d / bay));
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) {
    const face = Math.floor(i / 4);
    const s = face < 2 ? nz : face < 4 ? 1 : nx;
    uv.setX(i, uv.getX(i) * s);
  }
  const front = textured(repeatTex(tex, 1, 1));
  const side = textured(repeatTex(sideTex, 1, 1));
  const topM = mat(top);
  return new THREE.Mesh(geo, [side, side, topM, topM, front, front]);
}

/** Flat plane with 0..1 UVs (lying on the ground, facing up). */
export function groundDecal(w, d, tex, opts = {}) {
  const geo = new THREE.PlaneGeometry(w, d).rotateX(-Math.PI / 2);
  return new THREE.Mesh(geo, textured(tex, opts));
}

/** Raked gravel (karesansui) texture: parallel rake lines with ripples round the rocks. */
export function rakedGravelTex(rocks, aspect) {
  const W = 512, H = Math.round(512 / aspect);
  return canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = '#ddd8cb';
    ctx.fillRect(0, 0, W, H);
    // fine grain
    ctx.fillStyle = 'rgba(120,112,100,0.18)';
    for (let i = 0; i < 1400; i++) {
      const x = (i * 97.31) % W, y = (i * 53.17 + (i % 7) * 13) % H;
      ctx.fillRect(x, y, 2, 2);
    }
    const lineCol = 'rgba(120,110,95,0.6)';
    const hiCol = 'rgba(255,255,255,0.6)';
    // parallel lines, skipping the ripple zones round each rock
    const zone = (r) => r.r * W + 22 * (r.ripple ?? 3) + 8;
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, 0, W, H);
    for (const r of rocks) {
      ctx.moveTo(r.u * W + zone(r), r.v * H);
      ctx.arc(r.u * W, r.v * H, zone(r), 0, Math.PI * 2, true);
    }
    ctx.clip('evenodd');
    for (let y = 8; y < H; y += 22) {
      ctx.fillStyle = lineCol; ctx.fillRect(0, y, W, 6);
      ctx.fillStyle = hiCol; ctx.fillRect(0, y + 6, W, 4);
    }
    ctx.restore();
    // concentric ripples
    for (const r of rocks) {
      for (let k = 1; k <= (r.ripple ?? 3); k++) {
        const R = r.r * W + 22 * k - 4;
        ctx.lineWidth = 6;
        ctx.strokeStyle = lineCol;
        ctx.beginPath(); ctx.arc(r.u * W, r.v * H, R, 0, Math.PI * 2); ctx.stroke();
        ctx.lineWidth = 4;
        ctx.strokeStyle = hiCol;
        ctx.beginPath(); ctx.arc(r.u * W, r.v * H, R + 5, 0, Math.PI * 2); ctx.stroke();
      }
    }
  }, { key: 'japanese-ryokan:raked', repeat: false });
}

/** Indigo noren curtain with the ♨ hot-spring mark (drawn, no font needed) and slits. */
export function norenTex() {
  return canvasTexture(256, 128, (ctx, W, H) => {
    ctx.fillStyle = C.indigo;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(C.indigo, -0.4);
    ctx.fillRect(0, 0, W, 10);
    // slits between the three panels
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    for (const x of [W / 3, (2 * W) / 3]) ctx.fillRect(x - 2, 22, 4, H - 22);
    // ♨: bowl + three wavy steam lines
    const cx = W / 2, cy = H * 0.72;
    ctx.strokeStyle = '#ffffff';
    ctx.lineCap = 'round';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 34, 16, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.lineWidth = 6;
    for (const dx of [-18, 0, 18]) {
      ctx.beginPath();
      ctx.moveTo(cx + dx, cy - 22);
      ctx.bezierCurveTo(cx + dx - 10, cy - 32, cx + dx + 10, cy - 42, cx + dx, cy - 56);
      ctx.stroke();
    }
  }, { key: 'japanese-ryokan:noren', repeat: false });
}

/** See-through bamboo lattice fence (yotsume-gaki), 1 texture = 1 m wide, full height. */
function bambooFenceTex() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = C.bamboo;
    for (let x = 2; x < W; x += 8) ctx.fillRect(x, 0, 5, H);
    ctx.fillStyle = shade(C.bamboo, -0.3);
    for (let x = 2; x < W; x += 8) for (let y = 10; y < H; y += 22) ctx.fillRect(x, y, 5, 2);
    ctx.fillStyle = '#5b4a2a';
    for (const y of [8, 30, 52]) ctx.fillRect(0, y, W, 4);
  }, { key: 'japanese-ryokan:bamboo-fence' });
}

/** Bamboo screen fence along +X from x=0 to x=len, height h, facing +Z. */
export function bambooFence(len, h) {
  const geo = new THREE.PlaneGeometry(len, h).translate(len / 2, h / 2, 0);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * Math.round(len / 1.0));
  const m = new THREE.Mesh(geo, textured(bambooFenceTex(), { transparent: false, alphaTest: 0.5, side: THREE.DoubleSide }));
  const g = group(m);
  const post = mat(C.timberMid);
  const n = Math.max(1, Math.round(len / 2));
  for (let i = 0; i <= n; i++) g.add(place(box(0.12, h + 0.1, 0.12, post), { x: (len * i) / n }));
  g.add(place(box(len, 0.08, 0.14, mat('#5b4a2a')), { x: len / 2, y: h }));
  return g;
}

/**
 * Local sign with 0..1 UVs (the lib sign() shrinks text on faces over 1 m).
 * Text faces +Z, base at y = 0.
 */
export function plaque({ text, w, h, d = 0.08, bg = C.timber, fg = '#f3e6c4', border = '#c9a45a' }) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const tex = signTexture(text, { bg, fg, border, width: 512, height: Math.round(512 * (h / w)) });
  const edge = mat(bg);
  const face = textured(tex);
  return new THREE.Mesh(geo, [edge, edge, edge, edge, face, edge]);
}

// ---------------------------------------------------------------------------
// curved roofs

/**
 * Generic ring roof: a stack of rectangles ring(t) = { x0, x1, z0, z1, y } for
 * t = ts[0..n], connected by quads round all four sides. Corners of the low
 * rings lift by `flare` (the upturned Japanese eave). Vertical quads (the
 * irimoya gable) get the gable material. Also adds a fascia and a soffit back
 * to the wall rectangle `wall` at y = 0.
 */
function ringRoof({ ring, ts, flare = 0.35, segU = 8, segV = 4, tile, gable, fasciaMat, soffitMat, fascia = 0.2, wall }) {
  const b = new ShapeBuilder();
  const edges = [
    (r, s) => [r.x0 + (r.x1 - r.x0) * s, r.z1, 'x'],
    (r, s) => [r.x1, r.z1 + (r.z0 - r.z1) * s, 'z'],
    (r, s) => [r.x1 + (r.x0 - r.x1) * s, r.z0, 'x'],
    (r, s) => [r.x0, r.z0 + (r.z1 - r.z0) * s, 'z'],
  ];
  const segs = [segU, segV, segU, segV];
  const pt = (t, r, e, s) => {
    const [x, z] = edges[e](r, s);
    const k = Math.abs(2 * s - 1);
    const lift = flare * Math.pow(Math.max(0, 1 - t / 0.6), 2) * Math.pow(k, 3);
    return [x, r.y + lift, z];
  };
  const rings = ts.map((t) => ring(t));
  // slope length per ring step (for v texture coordinate)
  const vAt = [0];
  for (let j = 1; j < rings.length; j++) {
    const a = rings[j - 1], c = rings[j];
    vAt.push(vAt[j - 1] + Math.hypot(c.z1 - a.z1, c.y - a.y, c.x1 - a.x1));
  }
  for (let e = 0; e < 4; e++) {
    for (let j = 0; j < rings.length - 1; j++) {
      for (let k = 0; k < segs[e]; k++) {
        const s0 = k / segs[e], s1 = (k + 1) / segs[e];
        const A = pt(ts[j], rings[j], e, s0), B = pt(ts[j], rings[j], e, s1);
        const Cc = pt(ts[j + 1], rings[j + 1], e, s1), D = pt(ts[j + 1], rings[j + 1], e, s0);
        const axis = edges[e](rings[j], 0)[2];
        const u = (p) => (axis === 'x' ? p[0] : p[2]);
        const vertical = axis === 'x'
          ? Math.abs(rings[j].z1 - rings[j + 1].z1) < 1e-4
          : Math.abs(rings[j].x1 - rings[j + 1].x1) < 1e-4;
        if (vertical) {
          b.quadUV(A, B, Cc, D, [[u(A), A[1]], [u(B), B[1]], [u(Cc), Cc[1]], [u(D), D[1]]], 1);
        } else {
          b.quadUV(A, B, Cc, D, [[u(A), vAt[j]], [u(B), vAt[j]], [u(Cc), vAt[j + 1]], [u(D), vAt[j + 1]]], 0);
        }
      }
    }
    // fascia + soffit along the eave ring
    for (let k = 0; k < segs[e]; k++) {
      const s0 = k / segs[e], s1 = (k + 1) / segs[e];
      const A = pt(ts[0], rings[0], e, s0), B = pt(ts[0], rings[0], e, s1);
      const Al = [A[0], A[1] - fascia, A[2]], Bl = [B[0], B[1] - fascia, B[2]];
      b.quad(Al, Bl, B, A, 2);
      if (wall) {
        const wa = edges[e]({ ...wall }, s0), wb = edges[e]({ ...wall }, s1);
        b.quad([wa[0], 0, wa[1]], [wb[0], 0, wb[1]], Bl, Al, 3);
      }
    }
  }
  const geo = b.build();
  return new THREE.Mesh(geo, [tile, gable ?? tile, fasciaMat, soffitMat]);
}

const ease = (t) => 0.42 * t + 0.58 * t * t; // concave (sori) roof profile

/**
 * Irimoya (hip-and-gable) roof with a curved profile and upturned corners.
 * Ridge along X. w, d = wall size; base y = 0 = wall top. gableAt = 0..1 where
 * the hips stop and the vertical gable starts (1 = plain hip roof, 0 = gable roof).
 */
export function irimoyaRoof({ w, d, h, overhang = 0.8, gableAt = 0.5, flare = 0.4, segU = 10, ridge = true }) {
  const W = w / 2 + overhang, D = d / 2 + overhang;
  const minHalfW = Math.max(0.0, W - D);
  const ring = (t) => {
    const hd = D * (1 - t);
    const hw = Math.max(minHalfW, W - Math.min(t, gableAt) * D);
    return { x0: -hw, x1: hw, z0: -hd, z1: hd, y: h * ease(t) };
  };
  const ts = [];
  const nLow = 6, nHigh = 3;
  for (let i = 0; i <= nLow; i++) ts.push((gableAt * i) / nLow);
  if (gableAt < 1) for (let i = 1; i <= nHigh; i++) ts.push(gableAt + ((1 - gableAt) * i) / nHigh);
  if (gableAt === 0) ts.shift();
  const tsU = [...new Set(ts.map((t) => +t.toFixed(5)))];
  const dark = mat(C.kawaraDark);
  const g = group(ringRoof({
    ring, ts: tsU, flare, segU, segV: 4, tile: kawaraMat(), gable: gableMat(),
    fasciaMat: dark, soffitMat: mat(C.timberMid, { side: THREE.DoubleSide }),
    wall: { x0: -w / 2, x1: w / 2, z0: -d / 2, z1: d / 2 },
  }));
  // hip ridges (follow the curved corners) and barge boards on the gable
  const ridgeM = mat(C.kawaraDark);
  const corner = (t, sx, sz) => {
    const r = ring(t);
    const k = 1;
    const lift = flare * Math.pow(Math.max(0, 1 - t / 0.6), 2) * k;
    return [sx > 0 ? r.x1 : r.x0, r.y + lift + 0.08, sz > 0 ? r.z1 : r.z0];
  };
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    for (let j = 0; j < tsU.length - 1; j++) {
      const thick = tsU[j] < gableAt ? 0.22 : 0.16;
      g.add(beam(corner(tsU[j], sx, sz), corner(tsU[j + 1], sx, sz), thick, ridgeM));
    }
  }
  if (ridge) {
    const top = ring(1);
    const len = top.x1 - top.x0 + 0.4;
    g.add(place(box(len, 0.32, 0.36, ridgeM), { y: h - 0.08 }));
    g.add(place(box(len - 0.1, 0.08, 0.42, mat(C.plaster)), { y: h + 0.08 }));
    for (const sx of [-1, 1]) {
      // onigawara: ridge-end tiles, slightly raised and flared
      g.add(place(box(0.28, 0.6, 0.5, ridgeM), { x: sx * (len / 2), y: h - 0.12 }));
      g.add(place(box(0.18, 0.18, 0.62, ridgeM), { x: sx * (len / 2 + 0.06), y: h + 0.4 }));
    }
  }
  return g;
}

/**
 * Mokoshi / hisashi pent roof skirting a wall rectangle: from an outer eave
 * rectangle up to the wall at height h. Base y = 0 = eave height.
 */
export function pentRoof({ wall, outer, h = 0.8, flare = 0.3, segU = 10 }) {
  const lerp = (a, b, t) => a + (b - a) * t;
  const ring = (t) => ({
    x0: lerp(outer.x0, wall.x0, t), x1: lerp(outer.x1, wall.x1, t),
    z0: lerp(outer.z0, wall.z0, t), z1: lerp(outer.z1, wall.z1, t),
    y: h * ease(t),
  });
  const ts = [0, 0.25, 0.5, 0.75, 1];
  const dark = mat(C.kawaraDark);
  // soffit runs back to the wall at eave height: wall rect "at y = 0"
  return ringRoof({
    ring, ts, flare, segU, segV: 4, tile: kawaraMat(), fasciaMat: dark,
    soffitMat: mat(C.timberMid, { side: THREE.DoubleSide }), wall, fascia: 0.18,
  });
}

// ---------------------------------------------------------------------------
// props

/** Stone lantern (kasuga-doro). */
export function stoneLantern(s = 1) {
  const st = mat('#a8a49a');
  const stD = mat('#8c887f');
  const g = group(
    place(cylinder(0.32, 0.38, 0.18, stD, 6), {}),
    place(cylinder(0.1, 0.13, 0.75, st, 8), { y: 0.18 }),
    place(cylinder(0.26, 0.2, 0.14, stD, 6), { y: 0.93 }),
    place(box(0.34, 0.32, 0.34, emissive('#ffd98a', 0.6)), { y: 1.07 }),
    place(cylinder(0.04, 0.42, 0.28, st, 6), { y: 1.39 }),
    place(sphere(0.08, stD, 6), { y: 1.7 }),
  );
  for (const [x, z] of [[-0.15, -0.15], [0.15, -0.15], [-0.15, 0.15], [0.15, 0.15]]) g.add(place(box(0.07, 0.32, 0.07, st), { x, y: 1.07, z }));
  g.scale.setScalar(s);
  return g;
}

/** Rock: a squashed low-poly dodecahedron. */
export function rock(r, { color = C.rock, sy = 0.6, ry = 0, moss = false } = {}) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(color));
  m.scale.set(1, sy, 0.85);
  m.position.y = r * sy * 0.75;
  m.rotation.y = ry;
  const g = group(m);
  if (moss) {
    const ms = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.05, r * 1.15, 0.12, 7), mat(C.moss));
    g.add(ms);
  }
  return g;
}

/** Niwaki-style pruned pine: leaning trunk with flat cloud pads. */
export function cloudPine(h = 4, lean = 1) {
  const trunk = mat('#5a4030');
  const leaf = mat(C.pine);
  const leafL = mat('#3d7030');
  const g = new THREE.Group();
  const p0 = [0, 0, 0], p1 = [0.35 * lean, h * 0.45, 0.1], p2 = [-0.1 * lean, h * 0.8, -0.05];
  g.add(beam(p0, p1, 0.26, trunk));
  g.add(beam(p1, p2, 0.2, trunk));
  const pads = [
    [p2[0], h * 0.86, p2[2], 1.0],
    [p1[0] + 0.9 * lean, h * 0.58, 0.2, 0.85],
    [p1[0] - 0.8 * lean, h * 0.5, -0.2, 0.75],
    [p1[0] + 0.2, h * 0.36, 0.5, 0.6],
  ];
  pads.forEach(([x, y, z, s], i) => {
    if (i === 1) g.add(beam(p1, [x, y - 0.1, z], 0.12, trunk));
    if (i === 2) g.add(beam([p1[0] * 0.7, h * 0.35, 0], [x, y - 0.1, z], 0.12, trunk));
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.8 * s, 0), i % 2 ? leafL : leaf);
    m.scale.set(1.35, 0.42, 1.15);
    m.position.set(x, y, z);
    m.rotation.y = i * 0.9;
    g.add(m);
  });
  return g;
}

/** Japanese maple: slim trunk, layered red crown. */
export function maple(h = 3.4, color = C.maple) {
  const g = new THREE.Group();
  const trunk = mat('#5a3d2a');
  g.add(beam([0, 0, 0], [0.15, h * 0.5, 0], 0.14, trunk));
  const cols = [color, shade(color, 0.15), shade(color, -0.12)];
  const blobs = [[0.15, h * 0.62, 0, 1.0], [0.6, h * 0.55, 0.3, 0.7], [-0.4, h * 0.58, -0.2, 0.75], [0.1, h * 0.82, 0.1, 0.7]];
  blobs.forEach(([x, y, z, s], i) => {
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.24 * s, 0), mat(cols[i % 3]));
    m.scale.set(1.2, 0.7, 1.1);
    m.position.set(x, y, z);
    m.rotation.set(i, i * 2, 0);
    g.add(m);
  });
  return g;
}

/** Clump of bamboo canes with leafy tops. */
export function bambooClump(h = 5, n = 6, seed = 1) {
  const g = new THREE.Group();
  const cane = mat(C.bamboo);
  const leaf = mat('#4f8a32');
  for (let i = 0; i < n; i++) {
    const a = i * 2.39 + seed, r = 0.1 + (i % 3) * 0.12;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    const hh = h * (0.8 + ((i * 37 + seed * 11) % 10) / 45);
    g.add(beam([x, 0, z], [x * 1.3, hh, z * 1.3], 0.07, cane));
    const m = new THREE.Mesh(new THREE.IcosahedronGeometry(0.42, 0), leaf);
    m.scale.set(1, 1.6, 1);
    m.position.set(x * 1.3, hh - 0.35, z * 1.3);
    g.add(m);
  }
  return g;
}

/** Red paper lantern (chochin) hanging from y = 0 downwards. */
export function chochin() {
  const red = emissive('#e0442c', 0.35);
  const m = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), red);
  m.scale.set(1, 1.35, 1);
  m.position.y = -0.32;
  return group(
    place(cylinder(0.11, 0.11, 0.05, mat(PALETTE.black), 8), { y: -0.08 }),
    m,
    place(cylinder(0.11, 0.11, 0.05, mat(PALETTE.black), 8), { y: -0.62 }),
  );
}

/** Koi: small elongated fish lying on the water, along X. */
export function koi(color, spot = null) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 4), mat(color));
  body.scale.set(2.3, 0.4, 1);
  g.add(body);
  g.add(place(box(0.14, 0.03, 0.18, mat(color)), { x: -0.32, y: -0.01 }));
  if (spot) g.add(place(box(0.12, 0.05, 0.12, mat(spot)), { x: 0.06 }));
  return g;
}

/** Puff of onsen steam. */
export function steamPuff(r) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), mat('#ffffff', { transparent: true, opacity: 0.5, depthWrite: false }));
  m.scale.set(1, 0.85, 1);
  return m;
}

/** Wooden bath bucket (oke). */
export function oke() {
  return group(
    cylinder(0.17, 0.14, 0.22, mat(PALETTE.woodLight), 10),
    place(cylinder(0.175, 0.175, 0.03, mat(C.timber), 10), { y: 0.15 }),
  );
}

/** Irregular water body with a rim, top at y. */
export function pondShape(points, { depth = 0.15, color = PALETTE.water, rimColor = C.rockDark }) {
  const shape = new THREE.Shape(points.map(([x, z]) => new THREE.Vector2(x, -z)));
  const geo = new THREE.ShapeGeometry(shape).rotateX(-Math.PI / 2);
  // metre UVs for the tiling water texture
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  const surf = new THREE.Mesh(geo, water(color));
  surf.position.y = depth;
  const bed = new THREE.Mesh(geo.clone(), mat(shade(color, -0.5)));
  bed.position.y = 0.02;
  return group(bed, surf);
}

export { cone };

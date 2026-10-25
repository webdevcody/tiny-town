// Local helpers for the skate park: graffiti textures, a full-face sign,
// half-pipe, bowl, wedge ramps and little skaters.
import * as THREE from 'three';
import {
  PALETTE, rng, mat, metal, textured, canvasTexture, signTexture,
  box, cylinder, sphere, place, group,
} from '../../src/lib/index.js';

const SPRAY = ['#e8344a', '#ff9f1c', '#ffd23f', '#3ec46d', '#2bb3e0', '#7a4dd8', '#ff5fb4', '#16d6c0'];

/**
 * Concrete wall covered in bubble-letter pieces, tags and drips.
 * `words` are spread evenly across the width; `lowBand` keeps them in the
 * lower part of the wall (for the half-pipe sides, whose middle is low).
 */
export function graffitiTexture(key, { words, width = 512, height = 128, base = '#a9a59c', seed = 1, lowBand = false }) {
  return canvasTexture(width, height, (ctx, W, H) => {
    const r = rng(seed);
    ctx.fillStyle = base;
    ctx.fillRect(0, 0, W, H);
    // faint concrete blotches
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(0,0,0,${r.range(0.03, 0.08)})`;
      ctx.fillRect(r.range(0, W), r.range(0, H), r.range(4, 30), r.range(2, 12));
    }
    // background spray clouds
    for (let i = 0; i < 14; i++) {
      ctx.fillStyle = r.pick(SPRAY);
      ctx.globalAlpha = 0.55;
      ctx.beginPath();
      ctx.ellipse(r.range(0, W), lowBand ? r.range(H * 0.55, H) : r.range(0, H), r.range(10, 34), r.range(8, 22), 0, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
    // pieces
    const n = words.length;
    words.forEach((word, i) => {
      const slot = W / n;
      const cx = slot * (i + 0.5) + r.range(-slot * 0.08, slot * 0.08);
      const big = word.length <= 3;
      let size = H * (lowBand && word.small ? 0.3 : big ? 0.62 : 0.5);
      const text = typeof word === 'string' ? word : word.text;
      if (typeof word !== 'string' && word.size) size = H * word.size;
      const cy = typeof word !== 'string' && word.y != null ? H * word.y : (lowBand ? H * 0.68 : H * 0.52);
      ctx.font = `bold italic ${size}px sans-serif`;
      while (ctx.measureText(text).width > slot * 0.92 && size > 8) {
        size -= 2;
        ctx.font = `bold italic ${size}px sans-serif`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.lineJoin = 'round';
      const fill = SPRAY[(seed * 3 + i * 5) % SPRAY.length];
      const outline = SPRAY[(seed * 3 + i * 5 + 3) % SPRAY.length];
      // 3D shadow, fat outline, fill, highlight
      ctx.fillStyle = '#1a1a22';
      ctx.fillText(text, cx + size * 0.08, cy + size * 0.08);
      ctx.strokeStyle = '#111';
      ctx.lineWidth = size * 0.28;
      ctx.strokeText(text, cx, cy);
      ctx.strokeStyle = outline;
      ctx.lineWidth = size * 0.16;
      ctx.strokeText(text, cx, cy);
      ctx.fillStyle = fill;
      ctx.fillText(text, cx, cy);
      ctx.strokeStyle = 'rgba(255,255,255,0.7)';
      ctx.lineWidth = Math.max(1, size * 0.04);
      ctx.strokeText(text, cx - size * 0.03, cy - size * 0.04);
      // drips
      ctx.fillStyle = fill;
      for (let k = 0; k < 4; k++) {
        const dx = cx + r.range(-slot * 0.3, slot * 0.3);
        ctx.fillRect(dx, cy + size * 0.3, Math.max(2, size * 0.04), r.range(size * 0.2, size * 0.6));
      }
    });
    // little black tags
    ctx.fillStyle = '#16161c';
    ctx.font = `bold ${H * 0.12}px sans-serif`;
    for (let i = 0; i < 5; i++) {
      ctx.fillText(r.pick(['ZK', 'R4D', 'OLLIE', 'K!D', 'TT', '360']), r.range(W * 0.05, W * 0.95), lowBand ? r.range(H * 0.85, H * 0.95) : r.range(H * 0.1, H * 0.95));
    }
  }, { key: 'skate-park:graffiti:' + key, repeat: false });
}

/** Box with 0..1 UVs per face (so a texture fills a whole face), base at y = 0. */
export function uvBox(w, h, d, materials) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, materials);
}

/** Readable sign of any size: text texture fills the +Z face (and -Z when double). */
export function bigSign({ text, w, h, depth = 0.15, bg, fg, border = null, double = false }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

/** Wall panel whose +Z face shows a texture stretched over the whole face. */
export function muralPanel(tex, w, h, depth = 0.06) {
  const face = textured(tex);
  const side = mat('#a9a59c');
  return uvBox(w, h, depth, [side, side, side, side, face, side]);
}

/**
 * Half-pipe running along X. Two quarter pipes (radius R, a short vert
 * extension) with decks at both ends, a flat bottom raised by `base`.
 * The ±Z side walls carry `sideMat` (UVs 0..1 across the whole wall).
 */
export function halfPipe({ L, W, R, vert = 0.2, deck, base = 0.25, topMat, sideMat }) {
  const H = base + R + vert;
  const pts = [];
  const x0 = -L / 2;
  pts.push([x0, 0], [x0, H], [x0 + deck, H], [x0 + deck, base + R]);
  const segs = 10;
  for (let i = 1; i <= segs; i++) {
    const a = (Math.PI / 2) * (i / segs); // 0 = vertical, 90deg = bottom
    pts.push([x0 + deck + R - R * Math.cos(a), base + R - R * Math.sin(a)]);
  }
  const right = pts.slice(1).map(([x, y]) => [-x, y]).reverse();
  // left side goes up, across, down to the bottom; mirror back up the right
  const outline = [...pts, ...right, [L / 2, 0]];
  const shape = new THREE.Shape(outline.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: W, bevelEnabled: false, curveSegments: 1 });
  geo.translate(0, 0, -W / 2);
  // side caps: stretch UVs 0..1 over the wall so the graffiti fits
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (const grp of geo.groups) {
    if (grp.materialIndex !== 0) continue;
    for (let i = grp.start; i < grp.start + grp.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      // back wall reads mirrored otherwise
      const u = z > 0 ? (x + L / 2) / L : 1 - (x + L / 2) / L;
      uv.setXY(i, u, y / H);
    }
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  const g = group(new THREE.Mesh(geo, [sideMat, topMat]));
  g.userData = { H, base, deckX: L / 2 - deck / 2 };
  return g;
}

/** Point on the left quarter pipe of halfPipe() at angle phi (0 = bottom, 90 = vertical), plus tilt. */
export function halfPipeSpot({ L, R, deck, base = 0.25 }, phiDeg, side = -1) {
  const p = THREE.MathUtils.degToRad(phiDeg);
  const xc = -L / 2 + deck + R;
  const x = xc - R * Math.sin(p);
  const y = base + R - R * Math.cos(p);
  return side < 0 ? { x, y, rz: -phiDeg } : { x: -x, y, rz: phiDeg };
}

/**
 * Round concrete bowl set into a square raised deck (side `size`).
 * Bowl radius R, transition radius Rt, deck height H. Deck sides use sideMat.
 */
export function bowl({ size, R, Rt, H, topMat, sideMat, innerMat, copingMat }) {
  const g = new THREE.Group();
  // deck: square with a round hole, extruded up
  const s = size / 2;
  const shape = new THREE.Shape([new THREE.Vector2(-s, -s), new THREE.Vector2(s, -s), new THREE.Vector2(s, s), new THREE.Vector2(-s, s)]);
  const hole = new THREE.Path();
  hole.absarc(0, 0, R + 0.03, 0, Math.PI * 2, true);
  shape.holes.push(hole);
  const dg = new THREE.ExtrudeGeometry(shape, { depth: H, bevelEnabled: false, curveSegments: 28 });
  dg.rotateX(-Math.PI / 2); // extrude along +Y; shape y -> -z
  // outer walls: UVs 0..1 per side so the murals fill each face
  const pos = dg.attributes.position, uv = dg.attributes.uv;
  for (const grp of dg.groups) {
    if (grp.materialIndex !== 1) continue;
    for (let t = grp.start; t < grp.start + grp.count; t += 3) {
      // which wall is this triangle on? (corner vertices are shared by two)
      const zs = [0, 1, 2].map((k) => pos.getZ(t + k));
      const onZ = Math.abs(zs[0] - zs[1]) < 1e-3 && Math.abs(zs[0] - zs[2]) < 1e-3;
      for (let i = t; i < t + 3; i++) {
        const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
        const along = onZ ? (z > 0 ? x + s : s - x) : (x > 0 ? s - z : z + s);
        uv.setXY(i, along / size, y / H);
      }
    }
  }
  uv.needsUpdate = true;
  dg.computeVertexNormals();
  // cap group (0) is the deck top; side group (1) includes the hole wall (hidden by the lathe)
  g.add(new THREE.Mesh(dg, [topMat, sideMat]));

  // lathe bowl: flat bottom then a quarter-circle up to vertical
  const prof = [new THREE.Vector2(0.001, 0.02)];
  const flat = R - Rt;
  prof.push(new THREE.Vector2(flat, 0.02));
  const segs = 8;
  for (let i = 1; i <= segs; i++) {
    const a = (Math.PI / 2) * (i / segs);
    prof.push(new THREE.Vector2(flat + Rt * Math.sin(a), 0.02 + Rt - Rt * Math.cos(a)));
  }
  prof.push(new THREE.Vector2(R, H));
  const lg = new THREE.LatheGeometry(prof, 32);
  g.add(new THREE.Mesh(lg, innerMat));
  // steel coping ring
  const ring = new THREE.Mesh(new THREE.TorusGeometry(R, 0.06, 4, 32).rotateX(Math.PI / 2), copingMat);
  ring.position.y = H;
  g.add(ring);
  return g;
}

/** Wedge ramp: rises along +X from 0 to h over length l, width w (along Z). Base centred. */
export function wedge(l, h, w, material) {
  const shape = new THREE.Shape([new THREE.Vector2(-l / 2, 0), new THREE.Vector2(l / 2, 0), new THREE.Vector2(l / 2, h)]);
  const geo = new THREE.ExtrudeGeometry(shape, { depth: w, bevelEnabled: false });
  geo.translate(0, 0, -w / 2);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

/** Skateboard along X, base at y = 0. */
export function skateboard(color = PALETTE.red) {
  const wheel = mat(PALETTE.cream);
  return group(
    place(box(0.82, 0.05, 0.22, color), { y: 0.09 }),
    place(box(0.1, 0.06, 0.3, wheel), { x: -0.26 }),
    place(box(0.1, 0.06, 0.3, wheel), { x: 0.26 }),
    place(box(0.06, 0.04, 0.12, metal(PALETTE.steelLight)), { x: -0.26, y: 0.05 }),
    place(box(0.06, 0.04, 0.12, metal(PALETTE.steelLight)), { x: 0.26, y: 0.05 }),
  );
}

/**
 * Skater, standing sideways on a board along X, facing +Z. Feet at y = 0.
 * pose: 'ride' (arms out, knees bent), 'stand' (board under arm), 'air' (crouched, grabbing).
 */
export function skater({ shirt, pants = PALETTE.navy, skin = '#e0b48a', hat = null, board = PALETTE.red, pose = 'ride' }) {
  const g = new THREE.Group();
  const sh = mat(shirt), pa = mat(pants), sk = mat(skin), shoe = mat('#202020');
  const crouch = pose === 'air' ? 0.3 : pose === 'ride' ? 0.1 : 0;
  const feet = pose === 'stand' ? 0 : 0.14;
  if (pose !== 'stand') g.add(skateboard(board));
  const legH = 0.82 - crouch;
  const spread = pose === 'stand' ? 0.12 : 0.24;
  for (const sx of [-spread, spread]) {
    g.add(place(box(0.18, 0.1, 0.24, shoe), { x: sx, y: feet }));
    g.add(place(box(0.17, legH, 0.18, pa), { x: sx, y: feet + 0.08, rz: pose === 'stand' ? 0 : sx > 0 ? 6 : -6 }));
  }
  const hip = feet + 0.08 + legH;
  g.add(place(box(0.46, 0.62, 0.26, sh), { y: hip - 0.04, rz: pose === 'air' ? 12 : 0 }));
  const shoulder = hip + 0.52;
  g.add(place(sphere(0.15, sk, 8), { y: shoulder + 0.06 }));
  if (hat) g.add(place(cylinder(0.16, 0.17, 0.1, mat(hat), 8), { y: shoulder + 0.24 }));
  if (pose === 'stand') {
    g.add(place(box(0.13, 0.58, 0.13, sh), { x: -0.29, y: shoulder - 0.56 }));
    g.add(place(box(0.13, 0.58, 0.13, sh), { x: 0.29, y: shoulder - 0.56 }));
    g.add(place(skateboard(board), { x: 0.42, y: shoulder - 0.75, z: 0.05, rz: 90, rx: 90, s: 0.9 }));
  } else if (pose === 'air') {
    g.add(place(box(0.13, 0.55, 0.13, sh), { x: -0.3, y: shoulder - 0.05, rz: 130 }));
    g.add(place(box(0.13, 0.62, 0.13, sh), { x: 0.24, y: shoulder - 0.1, rz: 160 }));
  } else {
    g.add(place(box(0.13, 0.58, 0.13, sh), { x: -0.28, y: shoulder - 0.1, rz: 105 }));
    g.add(place(box(0.13, 0.58, 0.13, sh), { x: 0.28, y: shoulder - 0.1, rz: -105 }));
  }
  return g;
}

/** Round handrail / grind rail between two points with posts down to y = 0 (local). */
export function rail(from, to, posts, material) {
  const g = new THREE.Group();
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const len = a.distanceTo(b);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, len, 8), material);
  bar.position.copy(a).add(b).multiplyScalar(0.5);
  bar.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  g.add(bar);
  for (let i = 0; i < posts; i++) {
    const t = posts === 1 ? 0.5 : 0.08 + (0.84 * i) / (posts - 1);
    const p = a.clone().lerp(b, t);
    g.add(place(cylinder(0.04, 0.04, p.y, material, 6), { x: p.x, z: p.z, y: 0 }));
  }
  return g;
}

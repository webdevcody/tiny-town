// Local helpers for the Glamping Yurt Camp: textures on 0..1-UV geometry
// (the lib's box()/cylinder() use metre UVs), yurts, campfire, rustic props.
import * as THREE from 'three';
import {
  PALETTE, place, box, cylinder, cone, group, mat, metal, emissive, surface,
  textured, canvasTexture, signTexture, shade,
} from '../../src/lib/index.js';

const DEG = 180 / Math.PI;

/** Box with base at y = 0 and 0..1 UVs per face (for signs and painted doors). */
export function uvBox(w, h, d, material) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, material);
}

/** Flat sign facing +Z with legible text (0..1 UVs, so no shrinking on big faces). */
export function bigSign({ text, w, h, bg, fg = '#ffffff', border = null, depth = 0.12 }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, face]);
}

/** Heading (degrees, for place({ ry })) that turns local +Z towards (dx, dz). */
export function headingTo(dx, dz) {
  return Math.atan2(dx, dz) * DEG;
}

/** Painted yurt door texture: coloured panels with a folk-art diamond. */
function doorTexture(color) {
  return canvasTexture(64, 128, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 4;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.beginPath();
    ctx.moveTo(W / 2, 18);
    ctx.lineTo(W - 14, H / 2);
    ctx.lineTo(W / 2, H - 18);
    ctx.lineTo(14, H / 2);
    ctx.closePath();
    ctx.fillStyle = shade(color, 0.35);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = PALETTE.yellow;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'glamping-yurts:door:' + color, repeat: false });
}

/** Ornamental band round the top of the yurt wall (repeating zig-zag). */
function bandTexture(color) {
  return canvasTexture(512, 32, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.yellow;
    ctx.fillRect(0, 2, W, 3);
    ctx.fillRect(0, H - 5, W, 3);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    const n = 16;
    for (let i = 0; i <= n * 2; i++) {
      const x = (i * W) / (n * 2);
      const y = i % 2 ? 9 : H - 9;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
  }, { key: 'glamping-yurts:band:' + color, repeat: false });
}

/** Felt wall with faint lattice (khana) showing through, repeated round the wall. */
function feltTexture() {
  return canvasTexture(256, 64, (ctx, W, H) => {
    ctx.fillStyle = '#f4f1ea';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(150,135,110,0.22)';
    ctx.lineWidth = 2;
    for (let x = -H; x < W + H; x += 16) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(x + H, 0); ctx.lineTo(x, H); ctx.stroke();
    }
  }, { key: 'glamping-yurts:felt', repeat: true });
}

/** Roof felt: radial rafters (uni) as darker stripes. */
function roofTexture() {
  return canvasTexture(256, 32, (ctx, W, H) => {
    ctx.fillStyle = '#ebe6db';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = 'rgba(120,105,85,0.28)';
    for (let x = 0; x < W; x += 16) ctx.fillRect(x, 0, 2, H);
  }, { key: 'glamping-yurts:roof', repeat: true });
}

/** Cylinder side with 0..1 UVs, base at y = 0. */
function uvCylinder(rTop, rBottom, h, material, segments = 16, openEnded = false) {
  const geo = new THREE.CylinderGeometry(rTop, rBottom, h, segments, 1, openEnded).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, material);
}

/**
 * One glamping yurt on a timber deck. Door faces local +Z.
 *   r: wall radius, color: door / band colour, porch: deck in front of the door.
 */
export function yurt({ r = 1.5, wallH = 1.6, color = PALETTE.red, seed = 0, chairs = true } = {}) {
  const g = new THREE.Group();
  const deckM = surface('planks', PALETTE.woodLight, { size: 1.2 });
  const deckSide = mat(PALETTE.woodDark);
  const deckH = 0.3;

  // round deck + porch out front
  g.add(new THREE.Mesh(
    new THREE.CylinderGeometry(r + 0.3, r + 0.3, deckH, 12).translate(0, deckH / 2, 0),
    [deckSide, deckM, deckSide]
  ));
  g.add(place(box(2.1, deckH, 1.1, [deckSide, deckSide, deckM, deckSide, deckSide, deckSide]), { y: 0, z: r + 0.35 }));
  // porch rail posts
  for (const sx of [-1, 1]) g.add(place(box(0.08, 0.7, 0.08, deckSide), { x: sx * 0.98, y: deckH, z: r + 0.82 }));

  const y = deckH;
  // felt wall
  const feltTex = feltTexture();
  const felt = textured(feltTex, { roughness: 0.95 });
  const wall = uvCylinder(r, r, wallH, felt, 18, true);
  g.add(place(wall, { y }));
  // repeat the lattice 8x round the wall (scale the UVs; the texture is shared)
  const uv = wall.geometry.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * 8);

  // colourful ornamental band near the top of the wall + rope tension band
  g.add(place(uvCylinder(r + 0.02, r + 0.02, 0.28, textured(bandTexture(color)), 18, true), { y: y + wallH - 0.42 }));
  g.add(place(cylinder(r + 0.025, r + 0.025, 0.05, mat(PALETTE.woodDark), 18), { y: y + 0.45 }));

  // conical roof with overhang, crown ring (toono) and skylight dome
  const roofH = 1.0;
  const roofTex = roofTexture();
  const roof = uvCylinder(0.34, r + 0.18, roofH, [textured(roofTex, { roughness: 0.95 }), mat('#ebe6db'), mat('#ebe6db')], 18, false);
  g.add(place(roof, { y: y + wallH - 0.02 }));
  // eave lip
  g.add(place(cylinder(r + 0.2, r + 0.2, 0.08, mat('#d9d3c6'), 18), { y: y + wallH - 0.06 }));
  g.add(place(cylinder(0.38, 0.38, 0.14, mat(PALETTE.wood), 12), { y: y + wallH + roofH - 0.04 }));
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(0.32, 10, 5, 0, Math.PI * 2, 0, Math.PI / 2),
    mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.3 })
  );
  sky.position.y = y + wallH + roofH + 0.08;
  g.add(sky);

  // stove pipe through the roof on the back side
  const pipeM = metal(PALETTE.darkGrey);
  g.add(place(cylinder(0.07, 0.07, 1.4, pipeM, 6), { x: -0.55, y: y + wallH + 0.2, z: -0.55 }));
  g.add(place(cone(0.16, 0.12, pipeM, 6), { x: -0.55, y: y + wallH + 1.6, z: -0.55 }));

  // painted door in a timber frame, slightly proud of the curved wall
  const doorW = 0.78, doorH = 1.3;
  const frameM = mat(PALETTE.woodDark);
  g.add(place(box(doorW + 0.2, doorH + 0.12, 0.3, frameM), { y, z: r - 0.1 }));
  const dTex = doorTexture(color);
  const dSide = mat(color);
  g.add(place(uvBox(doorW, doorH, 0.12, [dSide, dSide, dSide, dSide, textured(dTex), dSide]), { y, z: r + 0.06 }));
  // little windows either side (felt flaps rolled up over mesh)
  const winM = mat(PALETTE.window);
  for (const a of [-55, 55, 125, -125]) {
    const t = (a * Math.PI) / 180;
    g.add(place(box(0.55, 0.42, 0.06, winM), { x: Math.sin(t) * (r + 0.01), y: y + 0.65, z: Math.cos(t) * (r + 0.01), ry: a }));
    const roll = place(cylinder(0.06, 0.06, 0.62, mat(shade(color, 0.2)), 6), { x: -0.31, rz: -90 });
    g.add(place(group(roll), { x: Math.sin(t) * (r + 0.07), y: y + 1.07, z: Math.cos(t) * (r + 0.07), ry: a }));
  }

  // lantern by the door
  g.add(place(box(0.06, 1.3, 0.06, frameM), { x: 0.75, y, z: r + 0.75 }));
  g.add(place(box(0.18, 0.22, 0.18, emissive(PALETTE.windowLit, 0.9)), { x: 0.75, y: y + 1.3, z: r + 0.75 }));
  g.add(place(box(0.24, 0.05, 0.24, mat(PALETTE.black)), { x: 0.75, y: y + 1.52, z: r + 0.75 }));

  // deck chairs on the porch
  if (chairs) {
    const chairColor = seed % 2 ? PALETTE.white : PALETTE.woodLight;
    g.add(place(deckChair(chairColor), { x: -0.65, y, z: r + 0.45, ry: 160 + seed * 7 }));
  }
  return g;
}

/** Adirondack-style deck chair facing +Z. */
export function deckChair(color = PALETTE.white) {
  const m = mat(color);
  return group(
    place(box(0.55, 0.08, 0.55, m), { y: 0.3 }),
    place(box(0.55, 0.65, 0.07, m), { y: 0.3, z: -0.3, rx: -15 }),
    place(box(0.08, 0.06, 0.6, m), { x: -0.3, y: 0.52 }),
    place(box(0.08, 0.06, 0.6, m), { x: 0.3, y: 0.52 }),
    place(box(0.06, 0.52, 0.06, m), { x: -0.3, z: 0.25 }),
    place(box(0.06, 0.52, 0.06, m), { x: 0.3, z: 0.25 }),
    place(box(0.06, 0.3, 0.06, m), { x: -0.25, z: -0.22 }),
    place(box(0.06, 0.3, 0.06, m), { x: 0.25, z: -0.22 })
  );
}

/** Wooden boardwalk between two ground points [x, z], slightly raised. */
export function boardwalk(a, b, w = 1.0, y = 0) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const len = Math.hypot(dx, dz);
  const deck = surface('planks', PALETTE.wood, { size: 1.0 });
  const side = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  g.add(box(w, 0.16, len, [side, side, deck, side, side, side]));
  // edge joists
  for (const s of [-1, 1]) g.add(place(box(0.08, 0.2, len, side), { x: s * (w / 2 - 0.02) }));
  return place(g, { x: (a[0] + b[0]) / 2, y, z: (a[1] + b[1]) / 2, ry: headingTo(dx, dz) });
}

/** Campfire: stone ring, crossed logs, flames, ember glow. */
export function campfire() {
  const g = new THREE.Group();
  const stoneM = [mat(PALETTE.stone), mat(PALETTE.stoneDark), mat(shade(PALETTE.stone, 0.15))];
  const n = 12;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.2, 0), stoneM[i % 3]);
    s.scale.set(1.2, 0.8, 1);
    s.position.set(Math.cos(t) * 0.75, 0.14, Math.sin(t) * 0.75);
    s.rotation.y = t;
    g.add(s);
  }
  g.add(place(cylinder(0.62, 0.62, 0.04, mat('#3a2a20'), 12), { y: 0 }));
  g.add(place(cylinder(0.45, 0.45, 0.06, emissive('#ff7a1a', 0.6), 10), { y: 0.02 }));
  const logM = mat(PALETTE.trunk);
  // teepee of logs
  for (let i = 0; i < 5; i++) {
    const t = (i / 5) * Math.PI * 2;
    g.add(place(cylinder(0.05, 0.07, 0.9, logM, 5), { x: Math.cos(t) * 0.3, z: Math.sin(t) * 0.3, rx: Math.sin(t) * 28, rz: -Math.cos(t) * 28 }));
  }
  // flames
  g.add(place(cone(0.32, 1.0, emissive('#ff6a10', 1.0), 6), { y: 0.05 }));
  g.add(place(cone(0.2, 1.3, emissive('#ffb020', 1.0), 6), { x: 0.06, y: 0.05, z: 0.04 }));
  g.add(place(cone(0.1, 1.55, emissive('#fff0a0', 1.0), 5), { x: -0.03, y: 0.1 }));
  return g;
}

/** Log seat (half-buried log) along X. */
export function logSeat(len = 1.6) {
  const m = mat(PALETTE.wood);
  const end = mat(PALETTE.woodLight);
  const log = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, len, 8), [m, end, end]);
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.2;
  return group(log);
}

/** Split-rail timber fence segment along X, centred. */
export function railFence(len, h = 0.9) {
  const m = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(len / 2) + 1);
  for (let i = 0; i < posts; i++) g.add(place(box(0.14, h, 0.14, m), { x: -len / 2 + (len * i) / (posts - 1) }));
  for (const yy of [h * 0.4, h * 0.8]) g.add(place(box(len, 0.08, 0.08, mat(PALETTE.wood)), { y: yy }));
  return g;
}

/** Short post lantern for walkways. */
export function postLantern(h = 1.1) {
  return group(
    box(0.08, h, 0.08, mat(PALETTE.woodDark)),
    place(box(0.16, 0.2, 0.16, emissive(PALETTE.windowLit, 0.9)), { y: h }),
    place(cone(0.16, 0.12, mat(PALETTE.black), 4), { y: h + 0.2, ry: 45 })
  );
}

/** String of fairy lights hanging between two points [x, y, z]. */
export function fairyLights(a, b, sag = 0.4, bulbs = 9) {
  const g = new THREE.Group();
  const bulbM = [emissive('#ffe27a', 1.0), emissive('#ff9a5a', 1.0), emissive('#9ae0ff', 1.0)];
  const wireM = mat(PALETTE.black);
  const pts = [];
  for (let i = 0; i <= bulbs + 1; i++) {
    const t = i / (bulbs + 1);
    pts.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t - Math.sin(t * Math.PI) * sag, a[2] + (b[2] - a[2]) * t]);
  }
  for (let i = 0; i < pts.length - 1; i++) {
    const p = new THREE.Vector3(...pts[i]), q = new THREE.Vector3(...pts[i + 1]);
    const len = p.distanceTo(q);
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, len, 3), wireM);
    seg.position.copy(p).add(q).multiplyScalar(0.5);
    seg.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
    g.add(seg);
    if (i > 0) {
      const bulb = new THREE.Mesh(new THREE.OctahedronGeometry(0.07, 0), bulbM[i % 3]);
      bulb.position.set(pts[i][0], pts[i][1] - 0.06, pts[i][2]);
      g.add(bulb);
    }
  }
  return g;
}

/** Thin rod between two points [x, y, z] (ropes, guy lines). */
export function rod(a, b, radius, material) {
  const p = new THREE.Vector3(...a), q = new THREE.Vector3(...b);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, p.distanceTo(q), 4), material);
  m.position.copy(p).add(q).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
  return m;
}

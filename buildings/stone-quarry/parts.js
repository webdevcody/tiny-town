// Local props for the Stone Quarry: rock textures, excavator, haul truck,
// jaw crusher, inclined conveyor and a big sign with 0..1 UVs.
import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, place, beam, mat, metal, textured,
  canvasTexture, signTexture, shade, rng, ShapeBuilder, taperedBlock, surface,
} from '../../src/lib/index.js';

// ---------------------------------------------------------------------------
// materials

const texCache = new Map();
function tiledTex(key, size, draw) {
  const k = key + size;
  if (!texCache.has(k)) {
    const t = canvasTexture(128, 128, draw, { key }).clone();
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1 / size, 1 / size);
    t.needsUpdate = true;
    texCache.set(k, t);
  }
  return texCache.get(k);
}

/** Quarried rock face: horizontal strata, drill lines and cracks. */
export function rockFace(color = '#9a968e', size = 3) {
  const tex = tiledTex('stone-quarry:rock:' + color, size, (ctx, W, H) => {
    const r = rng(17);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    let y = 0;
    while (y < H) {
      const bh = r.int(6, 18);
      ctx.fillStyle = shade(color, r.range(-0.12, 0.1));
      ctx.fillRect(0, y, W, bh);
      ctx.fillStyle = shade(color, -0.28);
      ctx.fillRect(0, y + bh - 1, W, 1);
      y += bh;
    }
    // vertical drill/blast lines
    for (let i = 0; i < 9; i++) {
      const x = r.int(0, W);
      ctx.fillStyle = shade(color, -0.22);
      ctx.fillRect(x, r.int(0, H / 2), 1, r.int(H / 4, H));
    }
    // chunky lighter/darker blocks
    for (let i = 0; i < 26; i++) {
      ctx.fillStyle = shade(color, r.range(-0.18, 0.16));
      ctx.fillRect(r.int(0, W), r.int(0, H), r.int(4, 14), r.int(3, 8));
    }
  });
  return textured(tex, { roughness: 0.95 });
}

/** Crushed stone top surface (benches, pit floor). */
export function crushed(color = '#aaa59b', size = 3) {
  const tex = tiledTex('stone-quarry:crushed:' + color, size, (ctx, W, H) => {
    const r = rng(29);
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 420; i++) {
      ctx.fillStyle = shade(color, r.range(-0.25, 0.2));
      const s = r.int(1, 4);
      ctx.fillRect(r.int(0, W), r.int(0, H), s, s);
    }
  });
  return textured(tex, { roughness: 1 });
}

// ---------------------------------------------------------------------------
// big sign with 0..1 UVs (lib sign() shrinks text on faces over 1 m)

export function bigSign({ text, w, h, d = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

// ---------------------------------------------------------------------------
// vehicles

const yellowM = () => mat(PALETTE.yellow, { roughness: 0.5 });
const darkM = () => mat(PALETTE.darkGrey);
const glassM = () => mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });

function wheel(r, w, m) {
  const geo = new THREE.CylinderGeometry(r, r, w, 12);
  geo.rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, m);
}

/**
 * Tracked excavator facing +X. boom: 'dig' (bucket down in front) or 'raise'.
 * ~5.5 m long with boom, 2.4 m wide, 3.5 m tall.
 */
export function excavator({ color = PALETTE.yellow, pose = 'dig', slew = 0 } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const dark = darkM();
  // undercarriage
  for (const z of [-0.85, 0.85]) {
    g.add(place(box(3.2, 0.75, 0.65, dark), { z }));
    g.add(place(box(3.4, 0.12, 0.7, mat(PALETTE.black)), { z, y: 0.68 }));
  }
  g.add(place(box(1.6, 0.45, 1.2, dark), { y: 0.35 }));
  // slewing upper structure
  const up = new THREE.Group();
  up.position.y = 0.8;
  up.rotation.y = (slew * Math.PI) / 180;
  g.add(up);
  up.add(place(box(2.6, 1.0, 2.2, body), { x: -0.35 }));
  up.add(place(box(0.7, 0.9, 2.2, mat(shade(color, -0.25))), { x: -1.75 }));       // counterweight
  up.add(place(box(1.0, 0.25, 0.7, dark), { x: -0.9, y: 1.0, z: -0.55 }));         // engine hood
  up.add(place(box(0.6, 0.5, 0.1, dark), { x: -0.9, y: 1.0, z: -0.1 }));           // exhaust guard
  // cab
  up.add(place(box(1.1, 1.15, 0.95, body), { x: 0.35, y: 1.0, z: 0.62 }));
  up.add(place(box(0.06, 0.75, 0.8, glassM()), { x: 0.92, y: 1.3, z: 0.62 }));
  up.add(place(box(0.8, 0.55, 0.06, glassM()), { x: 0.4, y: 1.5, z: 1.11 }));
  // boom + stick + bucket
  const bz = -0.25;
  const pivot = [0.7, 1.0, bz];
  const elbow = pose === 'dig' ? [2.7, 2.9, bz] : [2.4, 3.4, bz];
  const tip = pose === 'dig' ? [3.9, 0.2, bz] : [3.7, 1.6, bz];
  up.add(beam(pivot, elbow, 0.42, body));
  up.add(beam(elbow, tip, 0.32, body));
  up.add(beam([0.9, 0.6, bz], [(pivot[0] + elbow[0]) / 2, (pivot[1] + elbow[1]) / 2 - 0.15, bz], 0.14, metal(PALETTE.steelLight)));
  up.add(beam([elbow[0] - 0.3, elbow[1] + 0.2, bz], [(elbow[0] + tip[0]) / 2 + 0.2, (elbow[1] + tip[1]) / 2, bz], 0.12, metal(PALETTE.steelLight)));
  const bucket = place(box(0.9, 0.75, 1.0, mat(PALETTE.steelDark)), { x: tip[0] + 0.2, y: tip[1] - 0.95, z: bz, rz: pose === 'dig' ? 20 : -35 });
  up.add(bucket);
  return g;
}

/**
 * Rigid haul (dump) truck facing +X, ~5.6 m long, 2.7 m wide.
 * tip: bed angle in degrees, load: rock in the bed.
 */
export function dumpTruck({ color = PALETTE.yellow, tip = 0, load = true } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const dark = darkM();
  const tyre = mat(PALETTE.black);
  g.add(place(box(4.8, 0.45, 1.3, dark), { y: 0.55 }));
  for (const x of [1.75, -1.45]) for (const z of [-1.0, 1.0]) {
    const w = wheel(0.62, 0.62, tyre);
    w.position.set(x, 0.62, z);
    g.add(w);
    const hub = wheel(0.3, 0.64, mat(PALETTE.steelLight));
    hub.position.set(x, 0.62, z);
    g.add(hub);
  }
  // engine + deck + cab (cab on the left side, as on real haul trucks)
  g.add(place(box(1.0, 1.05, 1.5, body), { x: 2.25, y: 0.75 }));
  g.add(place(box(0.08, 0.6, 1.2, dark), { x: 2.77, y: 0.95 }));               // grille
  g.add(place(box(1.4, 0.12, 2.7, body), { x: 2.1, y: 1.8 }));                // deck
  g.add(place(box(1.0, 1.0, 0.95, body), { x: 2.05, y: 1.92, z: -0.85 }));     // cab
  g.add(place(box(0.06, 0.55, 0.8, glassM()), { x: 2.57, y: 2.25, z: -0.85 }));
  g.add(place(box(0.7, 0.5, 0.06, glassM()), { x: 2.05, y: 2.3, z: -1.33 }));
  // tipping bed, hinged at the rear
  const bed = new THREE.Group();
  bed.position.set(-2.45, 1.1, 0);
  bed.rotation.z = (tip * Math.PI) / 180;
  g.add(bed);
  const L = 4.0;
  bed.add(place(box(L, 0.15, 2.6, body), { x: L / 2 }));
  for (const z of [-1.25, 1.25]) bed.add(place(box(L, 1.25, 0.1, body), { x: L / 2, z }));
  bed.add(place(box(0.12, 1.55, 2.6, body), { x: L - 0.06 }));
  bed.add(place(box(1.05, 0.1, 2.6, body), { x: L + 0.45, y: 1.45 }));          // canopy over cab
  for (let i = 0; i < 3; i++) bed.add(place(box(0.08, 1.2, 0.04, mat(shade(color, -0.2))), { x: 0.8 + i * 1.2, z: 1.31 }));
  if (load) bed.add(place(rockHeap(1.6, 0.9, 7), { x: L / 2 + 0.2, y: 0.15, s: 1 }));
  return g;
}

/** Low-poly lumpy heap of broken rock (stretched cone). */
export function rockHeap(r, h, seed = 1, color = '#8f8a82') {
  const geo = new THREE.ConeGeometry(r, h, 7, 2);
  const p = geo.attributes.position;
  const R = rng(seed);
  for (let i = 0; i < p.count; i++) {
    if (p.getY(i) < h / 2 - 0.01) {
      p.setX(i, p.getX(i) * R.range(0.85, 1.15));
      p.setZ(i, p.getZ(i) * R.range(0.85, 1.15));
      if (p.getY(i) > -h / 2 + 0.01) p.setY(i, p.getY(i) + R.range(-0.08, 0.08) * h);
    }
  }
  geo.translate(0, h / 2, 0);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat(color, { roughness: 1 }));
}

/** Boulder (irregular dodecahedron), base at y = 0. */
export function boulder(r, seed = 1, color = '#8a857c') {
  const geo = new THREE.DodecahedronGeometry(r, 0);
  const p = geo.attributes.position;
  const R = rng(seed);
  const jitter = new Map();
  for (let i = 0; i < p.count; i++) {
    const k = `${p.getX(i).toFixed(3)},${p.getY(i).toFixed(3)},${p.getZ(i).toFixed(3)}`;
    if (!jitter.has(k)) jitter.set(k, R.range(0.8, 1.15));
    const j = jitter.get(k);
    p.setXYZ(i, p.getX(i) * j, p.getY(i) * j * 0.75, p.getZ(i) * j);
  }
  geo.computeBoundingBox();
  geo.translate(0, -geo.boundingBox.min.y, 0);
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat(color, { roughness: 1 }));
}

/** Conical stockpile with gravel texture. */
export function stockpile(r, h, color) {
  return cone(r, h, crushed(color, 1.5), 12);
}

// ---------------------------------------------------------------------------
// plant

/**
 * Jaw crusher on a raised steel frame. Feed hopper on the -X side, discharge
 * underneath towards +X. ~5 m long, 3 m wide, 4.4 m tall.
 */
export function crusher({ color = '#2f86a8' } = {}) {
  const g = new THREE.Group();
  const steel = metal(PALETTE.steelDark);
  const body = mat(color, { roughness: 0.55 });
  const deckY = 1.7;
  // legs + bracing
  for (const x of [-1.9, 0, 1.9]) for (const z of [-1.1, 1.1]) g.add(place(box(0.22, deckY, 0.22, steel), { x, z }));
  for (const z of [-1.1, 1.1]) g.add(beam([-1.9, 0.2, z], [0, deckY, z], 0.12, steel), beam([1.9, 0.2, z], [0, deckY, z], 0.12, steel));
  g.add(place(box(4.4, 0.3, 2.6, steel), { y: deckY }));
  // feed hopper (funnel) full of rock
  g.add(place(taperedBlock({ w: 1.5, d: 1.5, h: 1.5, topW: 2.7, topD: 2.5, material: body, topMaterial: crushed('#8f8a82', 1) }), { x: -1.1, y: deckY + 0.3 }));
  g.add(place(box(2.8, 0.12, 0.12, mat(shade(color, -0.25))), { x: -1.1, y: deckY + 1.75, z: 1.25 }));
  // crusher housing with flywheels
  g.add(place(box(1.5, 1.7, 1.5, body), { x: 0.9, y: deckY + 0.3 }));
  g.add(place(box(1.7, 0.2, 1.7, mat(shade(color, -0.2))), { x: 0.9, y: deckY + 2.0 }));
  for (const z of [-0.95, 0.95]) {
    const fw = wheel(0.75, 0.18, mat(PALETTE.darkGrey));
    fw.position.set(0.9, deckY + 1.1, z);
    g.add(fw);
  }
  // motor + control cabin
  g.add(place(box(0.9, 0.8, 0.8, metal(PALETTE.blue, { roughness: 0.5 })), { x: 1.9, y: deckY + 0.3, z: -0.6 }));
  g.add(place(box(1.2, 1.5, 1.1, mat(PALETTE.white)), { x: 1.6, y: deckY + 0.3, z: 0.65 }));
  g.add(place(box(0.06, 0.5, 0.8, glassM()), { x: 2.22, y: deckY + 1.0, z: 0.65 }));
  g.add(place(box(1.3, 0.1, 1.2, mat(PALETTE.steelDark)), { x: 1.6, y: deckY + 1.8, z: 0.65 }));
  // walkway railing on the front edge
  const rail = mat(PALETTE.yellow);
  for (let i = 0; i < 6; i++) g.add(place(box(0.06, 0.9, 0.06, rail), { x: -2.1 + i * 0.84, y: deckY + 0.3, z: 1.28 }));
  g.add(place(box(4.3, 0.06, 0.06, rail), { y: deckY + 1.2, z: 1.28 }));
  // ladder
  for (const z of [1.15, 1.55]) g.add(place(box(0.06, deckY + 0.3, 0.06, rail), { x: 2.3, z }));
  for (let i = 1; i < 6; i++) g.add(place(box(0.05, 0.05, 0.4, rail), { x: 2.3, y: i * 0.32, z: 1.35 }));
  return g;
}

/**
 * Inclined belt conveyor from `from` to `to` ([x,y,z], belt top), with legs down
 * to groundAt(x, z). Gravel on the belt.
 */
export function conveyor(from, to, { width = 0.9, groundAt = () => 0, legEvery = 3.2, color = PALETTE.steel } = {}) {
  const g = new THREE.Group();
  const [x0, y0, z0] = from;
  const [x1, y1, z1] = to;
  const dx = x1 - x0, dy = y1 - y0, dz = z1 - z0;
  const horiz = Math.hypot(dx, dz);
  const L = Math.hypot(horiz, dy);
  const belt = new THREE.Group();
  belt.position.set(x0, y0, z0);
  belt.rotation.order = 'YZX';
  belt.rotation.y = Math.atan2(-dz, dx);
  belt.rotation.z = Math.atan2(dy, horiz);
  g.add(belt);
  const frame = metal(color);
  belt.add(place(box(L, 0.35, width + 0.2, frame), { x: L / 2, y: -0.42 }));
  belt.add(place(box(L, 0.08, width, mat(PALETTE.black)), { x: L / 2, y: -0.08 }));
  belt.add(place(box(L * 0.92, 0.12, width * 0.5, crushed('#b3ada2', 1)), { x: L / 2, y: 0 }));
  // walkway side rail
  belt.add(place(box(L, 0.05, 0.05, mat(PALETTE.yellow)), { x: L / 2, y: 0.5, z: width / 2 + 0.35 }));
  for (let t = 0.5; t < L; t += 1.6) belt.add(place(box(0.05, 0.9, 0.05, mat(PALETTE.yellow)), { x: t, y: -0.4, z: width / 2 + 0.35 }));
  // head drum
  const drum = wheel(0.3, width + 0.25, mat(PALETTE.darkGrey));
  drum.position.set(L, -0.15, 0);
  belt.add(drum);
  // legs
  const n = Math.max(1, Math.floor(L / legEvery));
  for (let i = 1; i <= n; i++) {
    const t = i / (n + 0.4);
    const x = x0 + dx * t, z = z0 + dz * t, top = y0 + dy * t - 0.75;
    const gy = groundAt(x, z);
    if (top - gy < 0.3) continue;
    for (const s of [-1, 1]) {
      const ox = (Math.sin(belt.rotation.y) * s * width) / 2;
      const oz = (Math.cos(belt.rotation.y) * s * width) / 2;
      g.add(place(box(0.16, top - gy, 0.16, frame), { x: x + ox, y: gy, z: z + oz }));
    }
  }
  return g;
}

/** Floodlight mast. */
export function floodlight(h = 7) {
  const g = new THREE.Group();
  g.add(cylinder(0.08, 0.12, h, metal(PALETTE.steelLight), 6));
  g.add(place(box(1.2, 0.08, 0.1, metal(PALETTE.steelDark)), { y: h }));
  for (const x of [-0.4, 0.4]) g.add(place(box(0.35, 0.3, 0.25, mat('#fff6cc', { emissive: '#fff6cc', emissiveIntensity: 0.6 })), { x, y: h + 0.08, z: 0.05 }));
  return g;
}


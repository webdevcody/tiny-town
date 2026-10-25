import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, place, group, mat, metal, surface, textured,
  canvasTexture, signTexture, shade, rng, barrelRoof,
} from '../../src/lib/index.js';

export const PIG_PINK = '#f0a3ae';
const SNOUT_PINK = '#dd7f8c';
const MUD = PALETTE.mud;

/** Ellipsoid centred at the origin. */
function ellipsoid(rx, ry, rz, material, segments = 10) {
  const g = new THREE.SphereGeometry(1, segments, Math.max(6, Math.round(segments * 0.7)));
  g.scale(rx, ry, rz);
  return new THREE.Mesh(g, typeof material === 'string' ? mat(material) : material);
}

/** Repeat a shared canvas texture every `size` metres (UVs in metres). */
function tiledTexture(tex, size) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / size);
  t.needsUpdate = true;
  return t;
}

/** Trampled pen mud: wet dark patches, drier ridges and hoof prints. */
export function mudMaterial() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(77);
    ctx.fillStyle = MUD;
    ctx.fillRect(0, 0, W, H);
    const blob = (color, n, rMin, rMax) => {
      ctx.fillStyle = color;
      for (let i = 0; i < n; i++) {
        const x = r() * W, y = r() * H, rx = r.range(rMin, rMax), ry = rx * r.range(0.5, 1);
        for (const [dx, dy] of [[0, 0], [W, 0], [-W, 0], [0, H], [0, -H]]) {
          ctx.beginPath();
          ctx.ellipse(x + dx, y + dy, rx, ry, r() * Math.PI, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };
    blob(shade(MUD, 0.07), 18, 5, 14);
    blob(shade(MUD, -0.12), 16, 4, 12);
    blob('#4f3a25', 5, 4, 9);
    // hoof prints
    ctx.fillStyle = shade(MUD, -0.3);
    for (let i = 0; i < 40; i++) {
      const x = r() * W, y = r() * H;
      ctx.fillRect(x, y, 2, 3);
      ctx.fillRect(x + 3, y, 2, 3);
    }
  }, { key: 'pig-farm:mud' });
  return textured(tiledTexture(tex, 3), { roughness: 0.95 });
}

/** Galvanised corrugated sheet with ridges along V (texture repeats per `pitch` stripes). */
function corrugatedTexture() {
  return canvasTexture(16, 64, (ctx, W, H) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      const y = (i * H) / n;
      const grad = ctx.createLinearGradient(0, y, 0, y + H / n);
      grad.addColorStop(0, '#e9eef1');
      grad.addColorStop(0.5, '#a7b1b8');
      grad.addColorStop(1, '#e9eef1');
      ctx.fillStyle = grad;
      ctx.fillRect(0, y, W, H / n);
    }
  }, { key: 'pig-farm:corrugated' });
}

/**
 * Curved corrugated pig ark: half-barrel shelter with plywood ends and a
 * dark doorway facing +z. Long axis along z.
 */
export function pigArk({ w = 1.8, d = 2.2, h = 1.15, endColor = '#b98d58' } = {}) {
  const t = corrugatedTexture().clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, d / 1.0); // ~8 ridges per metre along the length
  t.needsUpdate = true;
  const sheet = textured(t, { roughness: 0.45, metalness: 0.35 });
  const g = group(barrelRoof({ w, d, h, axis: 'z', material: sheet, endMaterial: mat(endColor), segments: 8 }));
  const wood = mat(PALETTE.woodDark);
  // skids
  for (const x of [-w / 2 + 0.05, w / 2 - 0.05]) g.add(place(box(0.14, 0.12, d + 0.3, wood), { x }));
  // doorway + straw spilling out
  g.add(place(box(w * 0.42, h * 0.6, 0.04, mat('#2a1f17')), { z: d / 2 + 0.01 }));
  g.add(place(box(w * 0.6, 0.06, 0.5, mat(PALETTE.hay)), { z: d / 2 + 0.25 }));
  // ridge cap strip
  g.add(place(box(0.14, 0.04, d + 0.02, metal(PALETTE.steel)), { y: h - 0.02 }));
  return g;
}

/**
 * Pink pig facing +x, about 1.35 m long. pose: 'stand' | 'lie' | 'eat' (head down).
 */
export function pig({ pose = 'stand', color = PIG_PINK, spots = false } = {}) {
  const body = mat(color);
  const dark = mat(SNOUT_PINK);
  const g = new THREE.Group();
  const lie = pose === 'lie';
  const by = lie ? 0.3 : 0.6;
  g.add(place(ellipsoid(0.64, lie ? 0.3 : 0.36, 0.38, body), { y: by }));
  if (spots) {
    g.add(place(ellipsoid(0.22, 0.2, 0.3, mat('#3a3330'), 8), { x: -0.2, y: by + 0.12 }));
    g.add(place(ellipsoid(0.16, 0.14, 0.22, mat('#3a3330'), 8), { x: 0.25, y: by + 0.18, z: 0.1 }));
  }
  if (!lie) {
    const legM = body, hoofM = mat(shade(MUD, -0.1));
    for (const x of [-0.36, 0.36]) for (const z of [-0.18, 0.18]) {
      g.add(place(box(0.15, 0.36, 0.15, legM), { x, z }));
      g.add(place(box(0.16, 0.12, 0.16, hoofM), { x, z })); // muddy trotters
    }
  }
  const eat = pose === 'eat';
  const hx = 0.66, hy = lie ? 0.32 : eat ? 0.42 : 0.68;
  g.add(place(ellipsoid(0.27, 0.25, 0.27, body), { x: hx, y: hy }));
  // snout disc
  g.add(place(cylinder(0.13, 0.13, 0.14, dark, 10), { x: hx + 0.25, y: hy - 0.05, rz: -90 }));
  g.add(place(box(0.02, 0.04, 0.03, mat('#5b2b33')), { x: hx + 0.395, y: hy - 0.05, z: 0.05 }));
  g.add(place(box(0.02, 0.04, 0.03, mat('#5b2b33')), { x: hx + 0.395, y: hy - 0.05, z: -0.05 }));
  // eyes
  for (const z of [-0.12, 0.12]) g.add(place(box(0.05, 0.05, 0.05, mat('#1e1a18')), { x: hx + 0.2, y: hy + 0.08, z }));
  // floppy ears
  for (const z of [-0.15, 0.15]) g.add(place(cone(0.1, 0.2, dark, 4), { x: hx + 0.05, y: hy + 0.17, z, rz: -55, rx: z > 0 ? 20 : -20 }));
  // curly tail
  const tail = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 4, 8, Math.PI * 1.6), body);
  g.add(place(tail, { x: -0.67, y: by + 0.12, ry: 90 }));
  return g;
}

/** Farmer in overalls and a straw hat carrying a feed bucket in the right hand. Faces +z, ~1.85 m. */
export function farmer() {
  const skin = mat('#e2b48c');
  const shirt = mat('#c23b2e');
  const denim = mat('#3d5f96');
  const boot = mat('#2f4a2a');
  const straw = mat('#e2c46a');
  const g = new THREE.Group();
  for (const x of [-0.12, 0.12]) {
    g.add(place(box(0.17, 0.32, 0.27, boot), { x, z: 0.03 }));
    g.add(place(box(0.18, 0.58, 0.2, denim), { x, y: 0.3 }));
  }
  g.add(place(box(0.48, 0.62, 0.28, shirt), { y: 0.86 }));
  g.add(place(box(0.42, 0.34, 0.3, denim), { y: 0.84 })); // overall waist
  g.add(place(box(0.3, 0.3, 0.06, denim), { y: 1.12, z: 0.13 })); // bib
  for (const x of [-0.1, 0.1]) g.add(place(box(0.05, 0.3, 0.3, denim), { x, y: 1.16 })); // straps
  // arms
  g.add(place(box(0.13, 0.6, 0.15, shirt), { x: -0.31, y: 0.88, rz: -6 }));
  g.add(place(box(0.13, 0.6, 0.15, shirt), { x: 0.31, y: 0.88, rz: 4 }));
  g.add(place(box(0.12, 0.12, 0.12, skin), { x: -0.34, y: 0.78 }));
  g.add(place(box(0.12, 0.12, 0.12, skin), { x: 0.34, y: 0.78 }));
  // head + straw hat
  g.add(place(box(0.12, 0.08, 0.12, skin), { y: 1.47 }));
  g.add(place(box(0.27, 0.3, 0.27, skin), { y: 1.53 }));
  g.add(place(box(0.28, 0.06, 0.04, mat('#6b4a2b')), { y: 1.6, z: 0.13 })); // brow/eyes band shadow
  g.add(place(cylinder(0.33, 0.33, 0.04, straw, 14), { y: 1.78 }));
  g.add(place(cylinder(0.16, 0.18, 0.18, straw, 12), { y: 1.8 }));
  g.add(place(cylinder(0.185, 0.185, 0.05, mat(PALETTE.red), 12), { y: 1.81 }));
  // bucket hanging from the right hand
  const steel = metal(PALETTE.steelLight, { roughness: 0.35 });
  const bucket = group(
    cylinder(0.18, 0.14, 0.32, steel, 12),
    place(cylinder(0.165, 0.165, 0.02, mat(PALETTE.hay), 12), { y: 0.27 }),
  );
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.015, 4, 10, Math.PI), metal(PALETTE.steelDark));
  bucket.add(place(handle, { y: 0.32 }));
  g.add(place(bucket, { x: 0.36, y: 0.42 }));
  return g;
}

/** Hopper-bottom feed bin on legs with a ladder, galvanised. */
export function feedBin({ radius = 1.0, h = 3.8, legH = 1.9 } = {}) {
  const galv = surface('corrugated', PALETTE.steelLight, { size: 0.8, metalness: 0.35, roughness: 0.5 });
  const steel = metal(PALETTE.steel);
  const dark = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  const hopperH = 1.0;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    g.add(place(box(0.12, legH + 0.2, 0.12, dark), { x: x * radius * 0.72, z: z * radius * 0.72 }));
  }
  // cross bracing
  g.add(place(box(radius * 1.44, 0.08, 0.08, dark), { y: 0.6, z: radius * 0.72 }));
  g.add(place(box(radius * 1.44, 0.08, 0.08, dark), { y: 0.6, z: -radius * 0.72 }));
  g.add(place(box(0.08, 0.08, radius * 1.44, dark), { y: 0.6, x: radius * 0.72 }));
  g.add(place(box(0.08, 0.08, radius * 1.44, dark), { y: 0.6, x: -radius * 0.72 }));
  g.add(place(cylinder(radius, 0.18, hopperH, steel, 16), { y: legH - hopperH }));
  g.add(place(cylinder(0.2, 0.2, 0.3, dark, 8), { y: legH - hopperH - 0.25 })); // boot
  g.add(place(cylinder(radius, radius, h, galv, 18), { y: legH }));
  g.add(place(cylinder(radius + 0.05, radius + 0.05, 0.1, steel, 18), { y: legH }));
  g.add(place(cone(radius * 1.06, radius * 0.75, steel, 18), { y: legH + h }));
  g.add(place(cylinder(0.25, 0.25, 0.14, dark, 10), { y: legH + h + radius * 0.68 }));
  // pink band with a little pig badge feel
  g.add(place(cylinder(radius + 0.02, radius + 0.02, 0.35, mat(PIG_PINK), 18), { y: legH + h - 0.7 }));
  // ladder on the +x side
  const lx = radius + 0.12;
  for (const z of [-0.18, 0.18]) g.add(place(box(0.05, legH + h, 0.05, dark), { x: lx, z, y: 0.2 }));
  for (let y = 0.6; y < legH + h; y += 0.35) g.add(place(box(0.04, 0.04, 0.36, dark), { x: lx, y }));
  return g;
}

/** Wooden post-and-rail fence segment along +x from 0 to len. */
export function railFence(len, { h = 0.95, color = '#8a6038', spacing = 1.2 } = {}) {
  const m = mat(color);
  const g = new THREE.Group();
  const posts = Math.max(2, Math.round(len / spacing) + 1);
  for (let i = 0; i < posts; i++) g.add(place(box(0.12, h, 0.12, m), { x: (len * i) / (posts - 1) }));
  for (const y of [h * 0.35, h * 0.78]) g.add(place(box(len, 0.1, 0.05, m), { x: len / 2, y }));
  return g;
}

/** Galvanised tube gate (swings around its hinge at the origin, along +x). */
export function tubeGate(len, { h = 1.0 } = {}) {
  const m = metal(PALETTE.steelLight, { roughness: 0.35 });
  const g = new THREE.Group();
  for (const y of [0.15, 0.4, 0.65, 0.9]) g.add(place(box(len, 0.05, 0.05, m), { x: len / 2, y }));
  g.add(place(box(0.06, h, 0.06, m), {}));
  g.add(place(box(0.06, h, 0.06, m), { x: len }));
  return g;
}

/** Long galvanised feed trough with feed in it. Long axis along x. */
export function trough({ len = 2, w = 0.5, h = 0.35, fill = '#b98a3e' } = {}) {
  const steel = metal(PALETTE.steel);
  return group(
    box(len, h, w, [steel, steel, mat(fill), steel, steel, steel]),
    place(box(len + 0.04, 0.06, 0.05, metal(PALETTE.steelDark)), { y: h - 0.03, z: w / 2 }),
    place(box(len + 0.04, 0.06, 0.05, metal(PALETTE.steelDark)), { y: h - 0.03, z: -w / 2 }),
  );
}

/** Farm sign on two posts; board uses a 0..1-UV box so the text fills the face. */
export function farmSign({ text = 'PIG FARM', w = 2.6, h = 0.8, postH = 1.1 } = {}) {
  const tex = signTexture(text, { bg: PIG_PINK, fg: '#4a2c1c', width: 256, height: Math.round(256 * h / w), border: '#4a2c1c' });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const wood = mat(PALETTE.woodDark);
  const geo = new THREE.BoxGeometry(w, h, 0.1).translate(0, h / 2, 0);
  const board = new THREE.Mesh(geo, [wood, wood, wood, wood, face, face]);
  return group(
    place(box(0.14, postH + h, 0.14, wood), { x: -w / 2 + 0.25, z: -0.1 }),
    place(box(0.14, postH + h, 0.14, wood), { x: w / 2 - 0.25, z: -0.1 }),
    place(board, { y: postH }),
  );
}

/** Wheelbarrow full of straw; wheel towards +x. */
export function wheelbarrow() {
  const tray = mat('#3f7f4a');
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(place(box(0.9, 0.3, 0.6, tray), { y: 0.35 }));
  g.add(place(box(0.8, 0.12, 0.5, mat(PALETTE.hay)), { y: 0.62 }));
  g.add(place(cylinder(0.2, 0.2, 0.08, dark, 10), { x: 0.55, y: 0.2, rx: 90 }));
  for (const z of [-0.22, 0.22]) {
    g.add(place(box(1.5, 0.05, 0.05, mat(PALETTE.woodDark)), { x: -0.2, y: 0.35, z }));
    g.add(place(box(0.05, 0.35, 0.05, dark), { x: -0.3, z }));
  }
  return g;
}

/** Stack of small rectangular straw bales. */
export function strawStack() {
  const hay = surface('stripes', PALETTE.hay, { color2: shade(PALETTE.hay, -0.08), size: 0.3 });
  const g = new THREE.Group();
  const bale = () => box(1.0, 0.42, 0.5, hay);
  for (const z of [-0.26, 0.26]) for (const x of [-0.52, 0.52]) g.add(place(bale(), { x, z }));
  for (const z of [-0.26, 0.26]) g.add(place(bale(), { z, y: 0.42 }));
  g.add(place(bale(), { y: 0.84, ry: 90 }));
  return g;
}

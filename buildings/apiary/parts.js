import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, group, place, mat, metal, textured, signTexture, canvasTexture, shade, rng,
} from '../../src/lib/index.js';

export const HIVE_COLOURS = ['#f2c230', '#6fb7e0', '#f08fb0', '#7fd1a8', '#f39a3c', '#ffffff', '#b59ddb', '#e8584a'];

/**
 * Sign board whose front face has 0..1 UVs, so the text fills the whole face
 * (lib sign() uses metre UVs and shrinks text on boards over 1 m).
 */
export function flatSign({ text, w, h, depth = 0.08, bg = PALETTE.yellow, fg = PALETTE.black, border = null, double = false }) {
  const tw = 256;
  const th = Math.max(32, Math.round(tw * (h / w)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

/** Grass speckled with wildflowers; `size` metres per repeat. */
export function meadowMaterial(size = 2.5) {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    const r = rng(77);
    ctx.fillStyle = '#6fae45';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 900; i++) {
      ctx.fillStyle = shade('#6fae45', (r() - 0.5) * 0.35);
      ctx.fillRect(r() * W, r() * H, 2 + r() * 3, 2 + r() * 3);
    }
    const flowers = ['#ffffff', '#f7d43a', '#e84a5f', '#b07cd8', '#f59ac0', '#ffffff', '#ff9f2e', '#5b8de0'];
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = flowers[i % flowers.length];
      const s = 2 + r() * 3;
      ctx.fillRect(r() * W, r() * H, s, s);
    }
  }, { key: 'apiary:meadow' });
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / size);
  t.needsUpdate = true;
  return textured(t, { roughness: 0.95 });
}

/** Tuft of wildflowers: green clump with coloured heads on top. */
export function flowerClump(r, s = 1) {
  const g = new THREE.Group();
  g.add(place(sphere(0.16 * s, mat(r.pick(['#5f9e3a', '#4f8a32', '#78b84a']))), { y: -0.06, s: 1 }));
  const cols = ['#ffffff', '#f7d43a', '#e84a5f', '#b07cd8', '#f59ac0', '#ff9f2e', '#5b8de0'];
  const c = mat(r.pick(cols));
  const n = r.int(3, 5);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + r();
    g.add(place(box(0.13 * s, 0.1 * s, 0.13 * s, c), { x: Math.cos(a) * 0.12 * s, y: (0.16 + r() * 0.14) * s, z: Math.sin(a) * 0.13 * s }));
  }
  return g;
}

/** Lavender bush: grey-green mound with purple spikes. */
export function lavender(r, s = 1) {
  const g = new THREE.Group();
  const base = new THREE.Mesh(new THREE.IcosahedronGeometry(0.35 * s, 0), mat('#7f9a6e'));
  base.scale.set(1.2, 0.6, 1.2);
  base.position.y = 0.15 * s;
  g.add(base);
  const p = mat('#8e6cc9');
  for (let i = 0; i < 7; i++) {
    const a = (i / 7) * Math.PI * 2 + r() * 0.4;
    const rad = (i === 0 ? 0 : 0.22) * s;
    g.add(place(box(0.08 * s, 0.35 * s, 0.08 * s, p), { x: Math.cos(a) * rad, y: 0.25 * s, z: Math.sin(a) * rad }));
  }
  return g;
}

/**
 * Langstroth beehive: stand, bottom board with landing board, stacked boxes
 * (each its own colour), and a lid. Entrance faces +z.
 *   hive({ colours: [...], roof: 'flat' | 'gable', open })
 */
export function hive({ colours, roof = 'flat', roofColour = '#e9e9e4', open = false }) {
  const W = 0.72, D = 0.62, BH = 0.3;
  const wood = mat(PALETTE.woodDark);
  const g = new THREE.Group();
  // cinder-block style legs
  g.add(place(box(0.14, 0.3, D - 0.05, mat(PALETTE.concrete)), { x: -W / 2 + 0.1 }));
  g.add(place(box(0.14, 0.3, D - 0.05, mat(PALETTE.concrete)), { x: W / 2 - 0.1 }));
  // bottom board + landing board
  g.add(place(box(W, 0.06, D + 0.1, wood), { y: 0.3, z: 0.05 }));
  g.add(place(box(W - 0.1, 0.03, 0.14, mat(PALETTE.wood)), { y: 0.33, z: D / 2 + 0.1, rx: 12 }));
  let y = 0.36;
  const dark = mat('#2b2118');
  colours.forEach((c, i) => {
    const m = mat(c);
    g.add(place(box(W, BH, D, m), { y }));
    // hand holds on the sides
    g.add(place(box(W + 0.02, 0.05, 0.18, mat(shade(c, -0.3))), { y: y + BH * 0.55 }));
    if (i === 0) g.add(place(box(W * 0.55, 0.05, 0.02, dark), { y: y + 0.01, z: D / 2 }));
    y += BH;
  });
  if (open) {
    // frames sticking up out of the open top box
    for (let i = 0; i < 4; i++) g.add(place(box(0.03, 0.12, D - 0.08, mat(PALETTE.wood)), { x: -0.2 + i * 0.13, y }));
    return g;
  }
  if (roof === 'gable') {
    const rm = mat(roofColour);
    const r1 = box(W / 2 + 0.16, 0.05, D + 0.16, rm);
    const r2 = box(W / 2 + 0.16, 0.05, D + 0.16, rm);
    g.add(place(box(W + 0.04, 0.08, D + 0.04, mat(shade(colours[colours.length - 1], -0.1))), { y }));
    r1.geometry = r1.geometry.clone().translate(-(W / 2 + 0.16) / 2, 0, 0);
    r2.geometry = r2.geometry.clone().translate((W / 2 + 0.16) / 2, 0, 0);
    g.add(place(r1, { y: y + 0.35, rz: 32 }));
    g.add(place(r2, { y: y + 0.35, rz: -32 }));
    // gable ends
    const tri = new THREE.Shape([new THREE.Vector2(-W / 2 - 0.02, 0), new THREE.Vector2(W / 2 + 0.02, 0), new THREE.Vector2(0, 0.25)]);
    const tg = new THREE.ExtrudeGeometry(tri, { depth: D, bevelEnabled: false }).translate(0, 0, -D / 2);
    g.add(place(new THREE.Mesh(tg, mat('#ffffff')), { y: y + 0.08 }));
  } else {
    g.add(place(box(W + 0.1, 0.12, D + 0.1, metal(roofColour, { roughness: 0.5 })), { y }));
  }
  return g;
}

/** Traditional straw skep (coiled dome) with a small entrance. Entrance faces +z. */
export function skep(s = 1) {
  const straw = mat(PALETTE.hay);
  const band = mat(shade(PALETTE.hay, -0.25));
  const g = new THREE.Group();
  const rings = [[0.36, 0.13], [0.34, 0.12], [0.3, 0.11], [0.24, 0.1], [0.16, 0.08], [0.07, 0.06]];
  let y = 0;
  rings.forEach(([rad, h], i) => {
    g.add(place(cylinder(rad * 0.94 * s, rad * s, h * s, i % 2 ? band : straw, 10), { y: y * s }));
    y += h * 0.92;
  });
  g.add(place(box(0.14 * s, 0.07 * s, 0.05 * s, mat('#2b2118')), { y: 0.01, z: 0.34 * s }));
  return g;
}

/** Beekeeper in a white suit, gloves, wide-brimmed hat with black veil. Faces +z. */
export function beekeeper({ holding = 'smoker' } = {}) {
  const suit = mat('#f6f6f2');
  const suitShade = mat('#dcdcd6');
  const glove = mat('#e3c27a');
  const boot = mat('#f0f0f0');
  const veil = mat('#2a2a2a', { roughness: 1 });
  const g = new THREE.Group();
  // boots + legs
  for (const x of [-0.12, 0.12]) {
    g.add(place(box(0.16, 0.18, 0.26, boot), { x, z: 0.03 }));
    g.add(place(box(0.17, 0.72, 0.2, suit), { x, y: 0.16 }));
  }
  // torso (zip line) + hood
  g.add(place(box(0.48, 0.66, 0.28, suit), { y: 0.86 }));
  g.add(place(box(0.03, 0.6, 0.02, suitShade), { y: 0.88, z: 0.145 }));
  g.add(place(box(0.5, 0.06, 0.3, suitShade), { y: 0.95 }));
  // arms forward holding something
  for (const x of [-0.29, 0.29]) {
    g.add(place(box(0.13, 0.42, 0.14, suit), { x, y: 1.1 }));
    g.add(place(box(0.13, 0.13, 0.38, suit), { x, y: 1.08, z: 0.2 }));
    g.add(place(box(0.15, 0.15, 0.12, glove), { x, y: 1.06, z: 0.44 }));
  }
  // head: veil cylinder, hat
  g.add(place(cylinder(0.17, 0.2, 0.3, veil, 10), { y: 1.52 }));
  g.add(place(cylinder(0.33, 0.33, 0.03, suit, 14), { y: 1.82 }));
  g.add(place(cylinder(0.17, 0.19, 0.16, suit, 12), { y: 1.84 }));
  if (holding === 'smoker') {
    const sm = metal(PALETTE.steelLight, { roughness: 0.4 });
    g.add(place(cylinder(0.09, 0.09, 0.3, sm, 10), { x: 0.29, y: 1.1, z: 0.52 }));
    g.add(place(cone(0.09, 0.12, sm, 10), { x: 0.29, y: 1.4, z: 0.52 }));
    g.add(place(box(0.1, 0.2, 0.06, mat(PALETTE.woodDark)), { x: 0.17, y: 1.1, z: 0.52 }));
    const smoke = mat('#e6e6e6', { transparent: true, opacity: 0.7 });
    [[0.32, 1.62, 0.55, 0.09], [0.38, 1.82, 0.6, 0.12], [0.46, 2.05, 0.66, 0.15]].forEach(([x, y, z, rr]) => g.add(place(sphere(rr, smoke), { x, y, z })));
  } else if (holding === 'frame') {
    g.add(place(box(0.62, 0.34, 0.04, mat(PALETTE.wood)), { y: 0.95, z: 0.5 }));
    g.add(place(box(0.54, 0.26, 0.05, mat('#e3a21a')), { y: 0.99, z: 0.5 }));
  }
  return g;
}

/** Honey jar: amber glass with a gingham-ish lid. */
export function jar(s = 1, lid = PALETTE.red) {
  return group(
    cylinder(0.07 * s, 0.07 * s, 0.16 * s, mat('#e89a16', { roughness: 0.25, metalness: 0.1, emissive: '#7a4400', emissiveIntensity: 0.25 }), 8),
    place(cylinder(0.075 * s, 0.075 * s, 0.04 * s, mat(lid), 8), { y: 0.16 * s })
  );
}

export { rng };

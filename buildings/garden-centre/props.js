// Local props for the garden centre: big sign, potted plants, display benches,
// compost pallets, plant trolleys, display sheds and the glass plant hall.
import * as THREE from 'three';
import {
  PALETTE, rng, box, cylinder, cone, place, beam, gableRoof, door,
  mat, metal, surface, textured, canvasTexture, signTexture, shade,
} from '../../src/lib/index.js';

export const GREEN = '#2f6b3a';
export const GREEN_DARK = '#234f2c';
export const FLOWER_COLOURS = ['#e0405a', '#f2d23c', '#f08a2a', '#b45ad0', '#ffffff', '#ff7fb0', '#d93030', '#5a7fe0'];

/** Sign with 0..1 UVs on its front face, so the text fills the whole board. */
export function bigSign({ text, w, h, depth = 0.15, bg = GREEN, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Leaf logo disc (faces +Z). */
export function leafLogo({ r = 0.6, depth = 0.1 } = {}) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = '#f4efe0';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.foliageLight;
    ctx.beginPath();
    ctx.ellipse(W / 2, H / 2, W * 0.36, H * 0.18, -Math.PI / 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = GREEN_DARK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(W * 0.24, H * 0.76);
    ctx.lineTo(W * 0.7, H * 0.3);
    ctx.stroke();
    ctx.lineWidth = 8;
    ctx.strokeStyle = GREEN;
    ctx.strokeRect(4, 4, W - 8, H - 8);
  }, { key: 'garden-centre:leaf', repeat: false });
  const face = textured(tex);
  const side = mat(GREEN);
  const geo = new THREE.BoxGeometry(r * 2, r * 2, depth).translate(0, r, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

function blob(r, color, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 0), mat(color));
  m.scale.set(sx, sy, sz);
  return m;
}

/**
 * Potted plant. kind: 'shrub' | 'conifer' | 'flower' | 'tree' | 'palm'
 */
export function pottedPlant({ kind = 'shrub', h = 1, seed = 1, pot = PALETTE.terracotta, color } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const pr = kind === 'flower' ? 0.16 : Math.max(0.16, h * 0.17);
  const ph = pr * 1.1;
  g.add(cylinder(pr, pr * 0.78, ph, mat(pot), 8));
  const top = ph;
  const leaf = color ?? r.pick([PALETTE.foliage, PALETTE.foliageDark, PALETTE.foliageLight]);
  if (kind === 'conifer') {
    g.add(place(cone(h * 0.24, h - ph, mat(leaf), 7), { y: top }));
  } else if (kind === 'flower') {
    g.add(place(blob(0.2, PALETTE.foliageLight, 1, 0.6, 1), { y: top + 0.05 }));
    g.add(place(blob(0.15, color ?? r.pick(FLOWER_COLOURS), 1.1, 0.55, 1.1), { y: top + 0.16 }));
  } else if (kind === 'tree') {
    g.add(cylinder(0.04, 0.05, h * 0.6, mat(PALETTE.trunk), 5));
    g.add(place(blob(h * 0.24, leaf, 1, 1.1, 1), { y: h * 0.72 }));
  } else if (kind === 'palm') {
    g.add(cylinder(0.05, 0.07, h * 0.75, mat(PALETTE.trunk), 5));
    for (let i = 0; i < 5; i++) {
      const f = box(h * 0.4, 0.05, h * 0.1, mat(PALETTE.foliageLight));
      f.geometry = f.geometry.clone().translate(h * 0.18, 0, 0);
      f.position.y = h * 0.75;
      f.rotation.set(0, (i / 5) * Math.PI * 2 + r() * 0.4, -0.4);
      g.add(f);
    }
  } else {
    g.add(place(blob(h * 0.38, leaf, 1.1, 0.95, 1.05), { y: top + h * 0.3, ry: r() * 90 }));
    if (r() < 0.5) g.add(place(blob(h * 0.13, r.pick(FLOWER_COLOURS), 1, 0.7, 1), { x: h * 0.15, y: top + h * 0.55, z: h * 0.12 }));
  }
  return g;
}

/** Slatted display bench (length along X) covered in small flowering pots. */
export function plantBench({ w = 4, d = 1.1, h = 0.75, seed = 1, rows = 2 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const wood = mat(PALETTE.woodLight);
  const legM = metal(PALETTE.steelDark);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.08, h, 0.08, legM), { x: sx * (w / 2 - 0.12), z: sz * (d / 2 - 0.1) }));
  }
  g.add(place(box(w, 0.08, d, surface('planks', PALETTE.woodLight, { size: 1 })), { y: h - 0.08 }));
  g.add(place(box(w, 0.06, d, wood), { y: 0.18 }));
  const n = Math.max(2, Math.round(w / 0.42));
  for (let row = 0; row < rows; row++) {
    const z = rows === 1 ? 0 : -d / 2 + d * (row + 0.5) / rows;
    // each run of pots shares one flower colour, like a real bench of bedding plants
    const c = r.pick(FLOWER_COLOURS);
    for (let i = 0; i < n; i++) {
      const x = -w / 2 + w * (i + 0.5) / n;
      g.add(place(pottedPlant({ kind: 'flower', seed: seed * 31 + i + row * 7, pot: PALETTE.black, color: r.chance(0.8) ? c : r.pick(FLOWER_COLOURS) }), { x, y: h, z, s: 0.9 }));
    }
  }
  return g;
}

/** Stepped (tiered) display stand facing +Z. */
export function tieredStand({ w = 3, steps = 3, seed = 3 } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const step = 0.45;
  for (let i = 0; i < steps; i++) {
    const y = 0.3 + i * 0.35;
    const z = (steps - 1 - i) * step - ((steps - 1) * step) / 2;
    g.add(place(box(w, y, step, mat(PALETTE.woodLight)), { z }));
    const n = Math.round(w / 0.4);
    const c = r.pick(FLOWER_COLOURS);
    for (let k = 0; k < n; k++) {
      g.add(place(pottedPlant({ kind: 'flower', seed: seed * 17 + i * 5 + k, pot: PALETTE.terracotta, color: r.chance(0.7) ? c : r.pick(FLOWER_COLOURS) }), { x: -w / 2 + w * (k + 0.5) / n, y, z, s: 0.85 }));
    }
  }
  return g;
}

/** Pallet stacked with compost / bark bags. */
export function compostPallet({ layers = 4, seed = 1, colors = ['#3d5a2a', '#6b4326'] } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  g.add(box(1.2, 0.15, 1.0, mat(PALETTE.wood)));
  const label = canvasTexture(64, 32, (ctx, W, H) => {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.foliageLight;
    ctx.fillRect(0, H * 0.55, W, H * 0.45);
  }, { key: 'garden-centre:bag', repeat: false });
  for (let l = 0; l < layers; l++) {
    const c = colors[l % colors.length];
    const side = mat(c);
    const top = mat(shade(c, 0.12));
    const lab = textured(label);
    const rot = l % 2 === 0;
    for (let k = 0; k < 2; k++) {
      const bag = box(rot ? 0.56 : 1.15, 0.17, rot ? 0.96 : 0.47, [side, side, top, side, lab, side]);
      bag.position.set(rot ? (k - 0.5) * 0.58 : 0, 0.15 + l * 0.18, rot ? 0 : (k - 0.5) * 0.49);
      bag.rotation.y = (r() - 0.5) * 0.08;
      g.add(bag);
    }
  }
  return g;
}

/** Two-deck flatbed plant trolley (length along X, handle at -X). */
export function plantTrolley({ seed = 1, load = true, color = GREEN } = {}) {
  const r = rng(seed);
  const g = new THREE.Group();
  const m = metal(color, { roughness: 0.5 });
  const wheel = mat(PALETTE.black);
  for (const x of [-0.5, 0.5]) for (const z of [-0.26, 0.26]) g.add(place(box(0.12, 0.12, 0.05, wheel), { x, z }));
  g.add(place(box(1.25, 0.05, 0.6, m), { y: 0.14 }));
  g.add(place(box(1.25, 0.04, 0.6, m), { y: 0.62 }));
  for (const x of [-0.6, 0.6]) for (const z of [-0.28, 0.28]) g.add(place(box(0.03, 0.5, 0.03, m), { x, y: 0.14, z }));
  // handle
  for (const z of [-0.28, 0.28]) g.add(place(box(0.04, 0.6, 0.04, m), { x: -0.62, y: 0.62, z }));
  g.add(place(box(0.05, 0.05, 0.62, m), { x: -0.62, y: 1.2 }));
  if (load) {
    for (let i = 0; i < 3; i++) {
      const kind = r.pick(['flower', 'shrub', 'flower']);
      g.add(place(pottedPlant({ kind, h: 0.55, seed: seed * 13 + i, pot: PALETTE.black }), { x: -0.35 + i * 0.37, y: 0.66, z: (r() - 0.5) * 0.2, s: 0.9 }));
    }
    g.add(place(compostBag(r.pick(['#3d5a2a', '#6b4326'])), { y: 0.17 }));
  }
  return g;
}

function compostBag(c) {
  return box(0.95, 0.16, 0.45, mat(c));
}

/** Little timber display shed with a felt gable roof; door faces +Z. */
export function gardenShed({ w = 2.2, d = 1.8, h = 1.9, wall = PALETTE.wood, roof = PALETTE.roofBlack, trim = PALETTE.white } = {}) {
  const g = new THREE.Group();
  g.add(box(w + 0.1, 0.12, d + 0.1, mat(PALETTE.concreteDark)));
  g.add(place(box(w, h, d, surface('planks', wall, { size: 1 })), { y: 0.12 }));
  g.add(place(gableRoof({ w, d, h: 0.8, overhang: 0.18, ridge: 'z', material: mat(roof), gableMaterial: surface('planks', wall, { size: 1 }) }), { y: 0.12 + h }));
  g.add(place(door({ w: 0.8, h: 1.6, color: shade(wall, -0.25), frame: trim }), { x: -w * 0.2, y: 0.12, z: d / 2 }));
  // window with cross bars
  g.add(place(box(0.6, 0.55, 0.05, mat(trim)), { x: w * 0.27, y: 0.12 + 0.9, z: d / 2 }));
  g.add(place(box(0.5, 0.45, 0.06, mat(PALETTE.window)), { x: w * 0.27, y: 0.12 + 0.95, z: d / 2 }));
  g.add(place(box(0.04, 0.45, 0.08, mat(trim)), { x: w * 0.27, y: 0.12 + 0.95, z: d / 2 }));
  // side window
  g.add(place(box(0.05, 0.5, 0.7, mat(trim)), { x: w / 2, y: 0.12 + 0.95 }));
  g.add(place(box(0.06, 0.4, 0.6, mat(PALETTE.window)), { x: w / 2, y: 0.12 + 1.0 }));
  return g;
}

/**
 * Glass-roofed plant hall: low brick plinth, glazed walls with green steel
 * frames, glass gable roof (ridge along X) with rafters and a ridge vent.
 * Base at y = 0, centred.
 */
export function glassHall({ w, d, wallH = 3.2, roofH = 2, bay = 1.6, plinth = 0.7 }) {
  const g = new THREE.Group();
  const frameM = metal(GREEN, { roughness: 0.45 });
  const glassWall = mat('#bfe0e8', { transparent: true, opacity: 0.32, roughness: 0.1, metalness: 0.3, depthWrite: false });
  const glassRoof = mat('#cfeaf0', { transparent: true, opacity: 0.42, roughness: 0.1, metalness: 0.35, depthWrite: false, side: THREE.DoubleSide });
  const brick = surface('brick', PALETTE.brickBrown, { size: 2 });

  g.add(box(w, plinth, d, [brick, brick, mat(PALETTE.paving), brick, brick, brick]));
  // glazing: four separate panels so the inside stays visible
  const gh = wallH - plinth;
  g.add(place(box(w, gh, 0.04, glassWall), { y: plinth, z: d / 2 }));
  g.add(place(box(w, gh, 0.04, glassWall), { y: plinth, z: -d / 2 }));
  g.add(place(box(0.04, gh, d, glassWall), { x: w / 2, y: plinth }));
  g.add(place(box(0.04, gh, d, glassWall), { x: -w / 2, y: plinth }));

  // posts round the walls
  const nx = Math.max(2, Math.round(w / bay));
  const nz = Math.max(2, Math.round(d / bay));
  const xs = [], zs = [];
  for (let i = 0; i <= nx; i++) xs.push(-w / 2 + (w * i) / nx);
  for (let i = 0; i <= nz; i++) zs.push(-d / 2 + (d * i) / nz);
  for (const x of xs) for (const z of [-d / 2, d / 2]) g.add(place(box(0.12, wallH, 0.12, frameM), { x, z }));
  for (const z of zs.slice(1, -1)) for (const x of [-w / 2, w / 2]) g.add(place(box(0.12, wallH, 0.12, frameM), { x, z }));
  // rails: plinth top, mid transom, eaves
  for (const y of [plinth, plinth + gh * 0.55, wallH - 0.1]) {
    const t = y === wallH - 0.1 ? 0.16 : 0.08;
    g.add(place(box(w + 0.12, t, 0.12, frameM), { y, z: d / 2 }));
    g.add(place(box(w + 0.12, t, 0.12, frameM), { y, z: -d / 2 }));
    g.add(place(box(0.12, t, d, frameM), { x: w / 2, y }));
    g.add(place(box(0.12, t, d, frameM), { x: -w / 2, y }));
  }

  // glass roof + rafters on every post line + ridge vent
  g.add(place(gableRoof({ w, d, h: roofH, overhang: 0.15, ridge: 'x', material: glassRoof, gableMaterial: glassRoof }), { y: wallH }));
  const ov = 0.15, drop = (ov * roofH) / (d / 2);
  for (const x of xs) {
    g.add(beam([x, wallH - drop, d / 2 + ov], [x, wallH + roofH, 0], 0.1, frameM));
    g.add(beam([x, wallH - drop, -d / 2 - ov], [x, wallH + roofH, 0], 0.1, frameM));
  }
  // gable-end mullions
  for (const sx of [-1, 1]) {
    for (const z of [-d / 4, 0, d / 4]) {
      const top = wallH + roofH * (1 - Math.abs(z) / (d / 2));
      g.add(beam([sx * w / 2, wallH, z], [sx * w / 2, top, z], 0.08, frameM));
    }
  }
  // purlins halfway up each slope
  for (const sz of [-1, 1]) {
    g.add(beam([-w / 2 - ov, wallH + roofH * 0.5, sz * d / 4], [w / 2 + ov, wallH + roofH * 0.5, sz * d / 4], 0.07, frameM));
  }
  // ridge vent lantern
  g.add(place(box(w * 0.8, 0.35, 0.7, frameM), { y: wallH + roofH - 0.05 }));
  g.add(place(box(w * 0.8 + 0.1, 0.08, 0.85, mat(PALETTE.offWhite)), { y: wallH + roofH + 0.3 }));
  return g;
}


/** Display of empty terracotta pots of different sizes, a few stacked. */
export function potDisplay() {
  const g = new THREE.Group();
  const pot = mat(PALETTE.terracotta);
  const soil = mat(shade(PALETTE.terracotta, -0.45));
  const one = (r, x, y, z) => {
    g.add(place(cylinder(r, r * 0.75, r * 1.1, pot, 10), { x, y, z }));
    g.add(place(cylinder(r * 0.85, r * 0.85, 0.02, soil, 10), { x, y: y + r * 1.1, z }));
  };
  one(0.45, -0.6, 0, 0);
  one(0.38, 0.35, 0, -0.15);
  one(0.3, 0.2, 0, 0.6);
  one(0.25, -0.65, 0.5, 0);
  one(0.18, 0.95, 0, 0.4);
  return g;
}

// Local toy-themed parts for the Toy Factory: teddy bear, alphabet blocks,
// toy bricks, gift boxes, lollipops, conveyor and a rainbow-letter sign.
import * as THREE from 'three';
import {
  PALETTE, place, box, cylinder, sphere, mat, metal, textured, canvasTexture, shade, surface,
} from '../../src/lib/index.js';

export const CANDY = {
  pink: '#f39ac0',
  hotPink: '#e8508f',
  mint: '#8fdcc0',
  lemon: '#f7dc5a',
  sky: '#7cc3ee',
  lilac: '#b79ce6',
  orange: '#f4964a',
  red: '#e2463f',
  cream: '#fff4dc',
};

/** Box with base at y = 0 and 0..1 UVs per face (for canvas textures that must fill a face). */
export function uvBox(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

/** Lit-looking material for a canvas texture (signs, printed faces). */
function printed(tex, glow = 0.15) {
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
}

// ---------------------------------------------------------------------------
// rainbow-letter sign

const RAINBOW = [CANDY.red, CANDY.orange, '#e0b400', '#3fae55', '#2f86d6', '#8a55c8'];

export function rainbowSign({ text, w, h, bg = CANDY.cream, border = CANDY.hotPink, depth = 0.2 }) {
  const W = 512, H = Math.max(32, Math.round(512 / (w / h)));
  const tex = canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    const lw = Math.max(4, H * 0.09);
    ctx.strokeStyle = border;
    ctx.lineWidth = lw;
    ctx.strokeRect(lw / 2, lw / 2, W - lw, H - lw);
    let size = H * 0.68;
    ctx.font = `900 ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.88 && size > 8) {
      size -= 1;
      ctx.font = `900 ${size}px sans-serif`;
    }
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'left';
    let x = (W - ctx.measureText(text).width) / 2;
    let i = 0;
    ctx.lineJoin = 'round';
    for (const ch of text) {
      const cw = ctx.measureText(ch).width;
      if (ch !== ' ') {
        ctx.lineWidth = size * 0.12;
        ctx.strokeStyle = '#ffffff';
        ctx.strokeText(ch, x, H / 2 + H * 0.04);
        ctx.fillStyle = RAINBOW[i++ % RAINBOW.length];
        ctx.fillText(ch, x, H / 2 + H * 0.04);
      }
      x += cw;
    }
  }, { key: `toy-factory:sign:${text}:${w}x${h}`, repeat: false });
  const side = mat(border);
  const face = printed(tex, 0.2);
  return uvBox(w, h, depth, [side, side, side, side, face, side]);
}

// ---------------------------------------------------------------------------
// gift-wrapped toy boxes

function giftTexture(color, ribbon) {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(color, 0.18);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) if ((i + j) % 2 === 0) {
      ctx.beginPath();
      ctx.arc(8 + i * 16, 8 + j * 16, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillStyle = ribbon;
    ctx.fillRect(W * 0.42, 0, W * 0.16, H);
    ctx.fillRect(0, H * 0.42, W, H * 0.16);
  }, { key: `toy-factory:gift:${color}:${ribbon}`, repeat: false });
}

export const GIFTS = [
  [CANDY.red, CANDY.lemon], [CANDY.sky, '#ffffff'], [CANDY.lemon, CANDY.hotPink],
  [CANDY.mint, CANDY.red], [CANDY.lilac, CANDY.lemon], [CANDY.orange, CANDY.sky], [CANDY.hotPink, '#ffffff'],
];

export function giftBox(size, i = 0, { h = size } = {}) {
  const [c, rb] = GIFTS[i % GIFTS.length];
  const m = printed(giftTexture(c, rb), 0.08);
  const g = new THREE.Group();
  g.add(uvBox(size, h, size, m));
  // bow
  const bow = mat(rb);
  g.add(place(sphere(size * 0.13, bow, 6), { x: -size * 0.12, y: h - size * 0.05 }));
  g.add(place(sphere(size * 0.13, bow, 6), { x: size * 0.12, y: h - size * 0.05 }));
  return g;
}

// ---------------------------------------------------------------------------
// alphabet blocks and toy bricks (the chimneys)

function letterTexture(letter, color) {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = CANDY.cream;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = color;
    ctx.lineWidth = 9;
    ctx.strokeRect(4.5, 4.5, W - 9, H - 9);
    ctx.fillStyle = color;
    ctx.font = '900 42px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(letter, W / 2, H / 2 + 3);
  }, { key: `toy-factory:letter:${letter}:${color}`, repeat: false });
}

export function alphabetBlock(size, letter, color) {
  const face = printed(letterTexture(letter, color), 0.12);
  const top = printed(letterTexture('', color), 0.12);
  return uvBox(size, size, size, [face, face, top, top, face, face]);
}

/** Plastic toy brick (w along X, d along Z) with studs on top. */
export function toyBrick(w, h, d, color, { studs = true } = {}) {
  const m = mat(color, { roughness: 0.35 });
  const g = new THREE.Group();
  g.add(box(w, h, d, m));
  if (studs) {
    const nx = Math.max(1, Math.round(w / 0.7)), nz = Math.max(1, Math.round(d / 0.7));
    for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
      g.add(place(cylinder(0.17, 0.17, 0.14, m, 8), { x: (i - (nx - 1) / 2) * (w / nx), y: h, z: (j - (nz - 1) / 2) * (d / nz) }));
    }
  }
  return g;
}

/** Cluster of soft pastel smoke puffs rising from the origin. */
export function puffs(colors, seed = 1) {
  const g = new THREE.Group();
  const pts = [[0, 0.2, 0, 0.55], [0.35, 0.9, 0.15, 0.7], [0.9, 1.7, 0.2, 0.85], [1.6, 2.6, 0.1, 0.95]];
  pts.forEach(([x, y, z, r], i) => {
    g.add(place(sphere(r, mat(colors[(i + seed) % colors.length], { roughness: 1, flatShading: false }), 10), { x, y, z }));
  });
  return g;
}

// ---------------------------------------------------------------------------
// giant teddy bear, sitting, facing +Z, waving with its right paw (+X)

export function teddy() {
  const fur = mat('#b0713c', { roughness: 0.95 });
  const light = mat('#ecc796', { roughness: 0.95 });
  const dark = mat('#2b1b12', { roughness: 0.4 });
  const bowM = mat(CANDY.red, { roughness: 0.5 });
  const g = new THREE.Group();
  const ell = (r, m, [sx, sy, sz], pos, seg = 14) => {
    const s = place(sphere(r, m, seg), pos);
    s.scale.set(sx, sy, sz);
    return s;
  };

  // body + tummy
  g.add(ell(1.5, fur, [1, 1.2, 0.9], { y: 0 }));
  g.add(ell(1.0, light, [0.95, 1.15, 0.55], { y: 0.45, z: 0.8 }));

  // legs sticking forward, round foot pads
  for (const sx of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.68, 1.7, 12).rotateX(Math.PI / 2), fur);
    leg.position.set(sx * 0.9, 0.62, 1.15);
    g.add(leg);
    g.add(ell(0.66, fur, [1, 1, 0.6], { x: sx * 0.9, y: -0.04, z: 2.0 }));
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.46, 0.46, 0.08, 12).rotateX(Math.PI / 2), light);
    pad.position.set(sx * 0.9, 0.62, 2.4);
    g.add(pad);
  }

  // arms: pivot at the shoulder, left hangs down, right waves
  for (const [sx, angle] of [[-1, -28], [1, 145]]) {
    const arm = new THREE.Group();
    arm.add(ell(0.5, fur, [1, 2.0, 1], { y: -1.8 }));
    arm.add(ell(0.36, light, [1, 0.5, 1], { y: -1.85, z: 0.25 }));
    arm.position.set(sx * 1.2, 3.0, 0.15);
    arm.rotation.z = THREE.MathUtils.degToRad(angle);
    g.add(arm);
  }

  // head
  const hy = 3.05;
  g.add(ell(1.3, fur, [1.05, 0.95, 0.95], { y: hy }));
  g.add(ell(0.55, light, [1.1, 0.8, 0.85], { y: hy + 0.5, z: 0.95 }));
  g.add(ell(0.2, dark, [1.3, 0.9, 1], { y: hy + 1.0, z: 1.4 }, 8));
  for (const sx of [-1, 1]) {
    g.add(ell(0.15, dark, [1, 1.2, 1], { x: sx * 0.45, y: hy + 1.25, z: 1.08 }, 8));
    g.add(ell(0.52, fur, [1, 1, 0.6], { x: sx * 1.0, y: hy + 1.85 }));
    g.add(ell(0.32, light, [1, 1, 0.5], { x: sx * 1.0, y: hy + 1.95, z: 0.18 }));
  }

  // red bow tie
  for (const sx of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.75, 4).rotateZ((sx * Math.PI) / 2), bowM);
    wing.position.set(sx * 0.4, hy - 0.05, 1.05);
    g.add(wing);
  }
  g.add(place(sphere(0.18, bowM, 8), { y: hy - 0.22, z: 1.12 }));
  return g;
}

// ---------------------------------------------------------------------------
// lollipop tree

function swirlTexture(c1, c2) {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = c1;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = c2;
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let t = 0; t < Math.PI * 7; t += 0.1) {
      const r = t * 1.45;
      ctx.lineTo(W / 2 + Math.cos(t) * r, H / 2 + Math.sin(t) * r);
    }
    ctx.stroke();
  }, { key: `toy-factory:swirl:${c1}:${c2}`, repeat: false });
}

export function lollipop({ h = 3.2, r = 0.9, c1 = CANDY.hotPink, c2 = '#ffffff', ry = 0 } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(0.08, 0.08, h, mat('#ffffff'), 6));
  const face = printed(swirlTexture(c1, c2), 0.1);
  const disc = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.3, 20).rotateX(Math.PI / 2), [mat(c1), face, face]);
  disc.position.y = h + r * 0.8;
  disc.rotation.y = THREE.MathUtils.degToRad(ry);
  g.add(disc);
  return g;
}

// ---------------------------------------------------------------------------
// conveyor belt along X, centred on the origin, belt top at height h

export function conveyor(len, { h = 1.1, w = 1.0 } = {}) {
  const g = new THREE.Group();
  const frame = metal(CANDY.lemon, { roughness: 0.5 });
  const leg = metal(PALETTE.steelDark);
  g.add(place(box(len, 0.12, w, surface('stripes', '#3b3d44', { color2: '#2a2b30', size: 0.5 })), { y: h - 0.12 }));
  for (const sz of [-1, 1]) g.add(place(box(len, 0.3, 0.1, frame), { y: h - 0.24, z: sz * (w / 2 + 0.05) }));
  const n = Math.max(2, Math.round(len / 1.8) + 1);
  for (let i = 0; i < n; i++) {
    const x = -len / 2 + 0.2 + (i * (len - 0.4)) / (n - 1);
    for (const sz of [-1, 1]) g.add(place(box(0.12, h - 0.24, 0.12, leg), { x, z: sz * (w / 2 - 0.05) }));
    g.add(place(box(0.08, 0.08, w, leg), { x, y: 0.35 }));
  }
  return g;
}

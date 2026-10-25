// Candy-themed parts for the Candy Factory: textures, lollipop chimneys,
// a giant candy cane, a wrapped bonbon, wrapper-livery lorries and a big sign.
import * as THREE from 'three';
import { PALETTE, canvasTexture, signTexture, textured, mat, place, group, box, cylinder, shade } from '../../src/lib/index.js';

export const CANDY = {
  pink: '#f4a6c6',
  hotPink: '#e8559a',
  mint: '#9fe3c8',
  mintDark: '#5cc59f',
  lemon: '#f7e38a',
  lilac: '#c9a9e8',
  sky: '#a9d4f0',
  cream: '#fff6ee',
  red: '#d8283a',
};

// --- textures -------------------------------------------------------------

/** Diagonal stripes, for helical candy-cane / candy-stick wraps. */
function diagonalStripes(color, color2) {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = color2;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color;
    for (let k = -2; k <= 2; k++) {
      const o = k * W;
      ctx.beginPath();
      ctx.moveTo(o, 0);
      ctx.lineTo(o + W * 0.45, 0);
      ctx.lineTo(o + W * 1.45, H);
      ctx.lineTo(o + W, H);
      ctx.closePath();
      ctx.fill();
    }
  }, { key: `candy-factory:diag:${color}:${color2}` });
}

/** Lollipop swirl: N arms twisting in towards the centre. */
function swirlTexture(color, color2) {
  return canvasTexture(256, 256, (ctx, W, H) => {
    const cx = W / 2, cy = H / 2, R = W / 2;
    ctx.fillStyle = color2;
    ctx.fillRect(0, 0, W, H);
    const arms = 4;
    const steps = 48;
    for (let s = steps; s > 0; s--) {
      const r = (R * s) / steps;
      const twist = (s / steps) * Math.PI * 2.2;
      for (let a = 0; a < arms; a++) {
        const start = twist + (a * Math.PI * 2) / arms;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, start, start + Math.PI / arms);
        ctx.closePath();
        ctx.fillStyle = color;
        ctx.fill();
      }
      // repaint the next ring in the base colour so arms can twist
      if (s > 1) {
        ctx.beginPath();
        ctx.arc(cx, cy, (R * (s - 1)) / steps, 0, Math.PI * 2);
        ctx.fillStyle = color2;
        ctx.fill();
      }
    }
    ctx.lineWidth = 6;
    ctx.strokeStyle = shade(color, -0.2);
    ctx.beginPath();
    ctx.arc(cx, cy, R - 3, 0, Math.PI * 2);
    ctx.stroke();
  }, { key: `candy-factory:swirl:${color}:${color2}`, repeat: false });
}

/** Sweet-wrapper livery for lorry trailers: polka dots + a wrapped sweet + name. */
function wrapperTexture(bg, dot, sweet, text) {
  return canvasTexture(512, 192, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = dot;
    for (let y = 12; y < H; y += 32) {
      for (let x = (y / 32) % 2 ? 28 : 12; x < W; x += 32) {
        ctx.beginPath();
        ctx.arc(x, y, 6, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    // wrapped sweet on the left
    const cx = 110, cy = H / 2;
    ctx.fillStyle = shade(sweet, -0.1);
    for (const s of [-1, 1]) {
      ctx.beginPath();
      ctx.moveTo(cx + s * 50, cy);
      ctx.lineTo(cx + s * 100, cy - 42);
      ctx.lineTo(cx + s * 92, cy);
      ctx.lineTo(cx + s * 100, cy + 42);
      ctx.closePath();
      ctx.fill();
    }
    ctx.fillStyle = sweet;
    ctx.beginPath();
    ctx.ellipse(cx, cy, 58, 44, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.ellipse(cx - 18, cy - 16, 16, 9, -0.4, 0, Math.PI * 2);
    ctx.fill();
    // name
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = shade(bg, -0.45);
    ctx.lineWidth = 8;
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText(text, 350, cy + 4);
    ctx.fillText(text, 350, cy + 4);
  }, { key: `candy-factory:wrapper:${bg}:${text}`, repeat: false });
}

// --- parts ----------------------------------------------------------------

/** Box with 0..1 UVs on every face (so a texture fills each face once), base at y=0. */
function unitBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

/**
 * Big sign with readable text; text faces +z. Works around the lib sign(),
 * whose metre UVs shrink the text on faces wider than 1 m.
 */
export function bigSign({ text, w, h, bg, fg = '#ffffff', border = null, depth = 0.25, double = false }) {
  const tw = 512;
  const tex = signTexture(text, { bg, fg, width: tw, height: Math.max(32, Math.round(tw * h / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  return unitBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

/** Straight tube with helical stripes, base at y=0. */
function stripedTube(r, h, color, color2, turnsPerMetre = 0.5, segments = 14) {
  const geo = new THREE.CylinderGeometry(r, r, h, segments, 1).translate(0, h / 2, 0);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * h * turnsPerMetre * 2);
  const m = textured(diagonalStripes(color, color2), { roughness: 0.35 });
  return new THREE.Mesh(geo, [m, mat(color2), mat(color2)]);
}

/**
 * Giant candy cane: shaft of height h, hook curling towards -x. Base at y=0.
 */
export function candyCane({ h = 10, r = 0.42, hook = 1.3, color = CANDY.red, color2 = '#ffffff' } = {}) {
  const g = new THREE.Group();
  g.add(stripedTube(r, h, color, color2, 0.6));
  const arc = Math.PI;
  const torus = new THREE.TorusGeometry(hook, r, 10, 18, arc);
  const len = hook * arc;
  const uv = torus.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len * 0.6 * 2);
  // TorusGeometry's uv.x runs along the tube; swap to match the diagonal texture
  for (let i = 0; i < uv.count; i++) { const u = uv.getX(i), v = uv.getY(i); uv.setXY(i, v, u); }
  const cane = new THREE.Mesh(torus, textured(diagonalStripes(color, color2), { roughness: 0.35 }));
  cane.position.set(-hook, h, 0);
  g.add(cane);
  const tip = stripedTube(r, 0.8, color, color2, 0.6);
  tip.position.set(-2 * hook, h - 0.8, 0);
  g.add(tip);
  const end = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), mat(color2));
  end.position.set(-2 * hook, h - 0.8, 0);
  g.add(end);
  return g;
}

/**
 * Lollipop chimney: candy-striped stack of height h carrying a swirl disc,
 * with a short vent on top. Disc faces ±z. Returns the group; the vent top
 * is at userData.top.
 */
export function lollipopChimney({ h = 12, radius = 1.6, stick = 0.32, color = CANDY.hotPink, color2 = '#ffffff', stickColor = CANDY.pink } = {}) {
  const g = new THREE.Group();
  g.add(cylinder(stick * 1.6, stick * 1.9, 0.8, mat(shade(stickColor, -0.15)), 12));
  g.add(place(stripedTube(stick, h, stickColor, '#ffffff', 0.5, 12), { y: 0.8 }));
  const discY = 0.8 + h + radius * 0.85;
  const thick = 0.55;
  const geo = new THREE.CylinderGeometry(radius, radius, thick, 28, 1);
  geo.rotateX(Math.PI / 2);
  const swirl = textured(swirlTexture(color, color2), { roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.05, emissiveMap: swirlTexture(color, color2) });
  const disc = new THREE.Mesh(geo, [mat(shade(color, -0.1), { roughness: 0.3 }), swirl, swirl]);
  disc.position.y = discY;
  g.add(disc);
  // vent pipe poking out of the top of the lollipop
  const ventY = discY + radius - 0.2;
  g.add(place(cylinder(0.28, 0.32, 0.9, mat(PALETTE.steelLight, { metalness: 0.4, roughness: 0.4 }), 10), { y: ventY }));
  g.add(place(cylinder(0.36, 0.36, 0.14, mat(CANDY.lemon), 10), { y: ventY + 0.8 }));
  g.userData.top = ventY + 0.94;
  return g;
}

/** Plume of pink candy-floss smoke drifting towards +x (base at y=0). */
export function pinkSmoke({ puffs = 6, drift = 0.6, start = 0.55 } = {}) {
  const g = new THREE.Group();
  const shades = ['#ff9fcb', '#ffb6d8', '#ff8fc2'];
  let y = start, x = 0, s = start;
  for (let i = 0; i < puffs; i++) {
    const m = mat(shades[i % shades.length], { transparent: true, opacity: 0.95 - i * 0.06, roughness: 1, emissive: '#ff7fb8', emissiveIntensity: 0.35 });
    const p = new THREE.Mesh(new THREE.IcosahedronGeometry(s, 1), m);
    p.position.set(x, y, (i % 2 ? 0.2 : -0.2) * s);
    p.scale.set(1.15, 0.9, 1);
    g.add(p);
    y += s * 1.25;
    x += drift * (0.6 + i * 0.25);
    s *= 1.18;
  }
  return g;
}

/** Wrapped bonbon on its side (axis along x), resting on y=0. */
export function bonbon({ r = 1.2, color = CANDY.lilac, wrapper = CANDY.lemon } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.SphereGeometry(r, 18, 12), mat(color, { roughness: 0.25, metalness: 0.1 }));
  body.scale.set(1.3, 1, 1);
  body.position.y = r;
  g.add(body);
  const wm = mat(wrapper, { roughness: 0.3, metalness: 0.2 });
  for (const s of [-1, 1]) {
    // pinched twist, then a fanned-out frill
    const twist = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.18, r * 0.4, r * 0.5, 10), wm);
    twist.rotation.z = (s * Math.PI) / 2;
    twist.position.set(s * r * 1.45, r, 0);
    g.add(twist);
    const frill = new THREE.Mesh(new THREE.ConeGeometry(r * 0.8, r * 0.9, 10, 1, true), mat(wrapper, { roughness: 0.3, metalness: 0.2, side: THREE.DoubleSide }));
    frill.rotation.z = (s * Math.PI) / 2;
    frill.position.set(s * r * 1.95, r, 0);
    g.add(frill);
  }
  return g;
}

/**
 * Small lorry with a sweet-wrapper livery on the trailer. Length along x
 * (~6.6 m), cab at +x.
 */
export function wrapperLorry({ cab = CANDY.hotPink, bg = CANDY.pink, dot = '#ffffff', sweet = CANDY.lilac, text = 'SWEETS' } = {}) {
  const g = new THREE.Group();
  const L = 4.8, H = 2.4, W = 2.1;
  const tex = wrapperTexture(bg, dot, sweet, text);
  const side = textured(tex, { roughness: 0.6 });
  const end = mat(bg);
  const roof = mat(CANDY.cream);
  // trailer: wrapper art on both long sides (+z / -z)
  const trailer = unitBox(L, H, W, [end, end, roof, mat(PALETTE.darkGrey), side, side]);
  trailer.position.set(-0.6, 0.75, 0);
  g.add(trailer);
  // twisted wrapper "bow" at the back of the trailer
  const bow = mat(shade(bg, -0.12));
  for (const s of [-1, 1]) {
    const fan = new THREE.Mesh(new THREE.ConeGeometry(0.75, 0.5, 4), bow);
    fan.rotation.set(0, 0, Math.PI / 2);
    fan.position.set(-0.6 - L / 2 - 0.12, 0.75 + H / 2 + s * 0.55, 0);
    g.add(fan);
  }
  g.add(place(box(0.35, 0.35, 0.35, mat(CANDY.lemon)), { x: -0.6 - L / 2 - 0.12, y: 0.75 + H / 2 - 0.17 }));
  // chassis + cab
  g.add(place(box(6.4, 0.3, 1.8, mat(PALETTE.darkGrey)), { x: 0.1, y: 0.45 }));
  g.add(place(box(1.6, 2.1, 2.1, mat(cab, { roughness: 0.4, metalness: 0.2 })), { x: 2.45, y: 0.6 }));
  g.add(place(box(0.06, 0.8, 1.8, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { x: 3.26, y: 1.6 }));
  g.add(place(box(0.08, 0.3, 1.9, mat(PALETTE.chrome, { metalness: 0.6, roughness: 0.3 })), { x: 3.27, y: 0.7 }));
  for (const sz of [-1, 1]) {
    g.add(place(box(0.9, 0.6, 0.05, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 2.55, y: 1.65, z: sz * 1.06 }));
    for (const x of [2.4, -1.4, -2.3]) {
      const wgeo = new THREE.CylinderGeometry(0.45, 0.45, 0.3, 10).rotateX(Math.PI / 2);
      const wheel = new THREE.Mesh(wgeo, mat(PALETTE.black));
      wheel.position.set(x, 0.45, sz * 0.92);
      g.add(wheel);
    }
  }
  return g;
}

/** Small decorative lollipop for flower beds (disc faces ±z). */
export function gardenLollipop({ h = 1.6, r = 0.45, color = CANDY.hotPink, color2 = '#ffffff' } = {}) {
  const geo = new THREE.CylinderGeometry(r, r, 0.16, 16).rotateX(Math.PI / 2);
  const swirl = textured(swirlTexture(color, color2), { roughness: 0.3 });
  const disc = new THREE.Mesh(geo, [mat(color), swirl, swirl]);
  disc.position.y = h + r * 0.8;
  return group(cylinder(0.05, 0.05, h, mat('#ffffff'), 6), disc);
}

/** Gumdrop bush: sugar-coated dome. */
export function gumdrop({ r = 0.45, color = CANDY.mint } = {}) {
  const geo = new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2);
  const m = new THREE.Mesh(geo, mat(color, { roughness: 0.6 }));
  m.scale.y = 1.2;
  return m;
}

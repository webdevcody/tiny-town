import * as THREE from 'three';
import {
  PALETTE, box, cylinder, place, group, mat, metal, emissive, textured, canvasTexture, signTexture, pipe,
} from '../../src/lib/index.js';

// Box with 0..1 UVs on every face (base at y = 0). The lib's box() has UVs in
// metres, which shrinks clamped sign textures on faces over 1 m.
export function uvBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

// Text sign facing +Z (full-size text at any width).
export function bigSign({ text, w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null, double = false, glow = 0.2 }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

// Painted soundstage number: dark disc with "STAGE" and a huge number, on a
// transparent decal facing +Z.
export function stageNumber(n, { size = 3.2, disc = '#1f2a44', fg = '#f4ead2' } = {}) {
  const tex = canvasTexture(256, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = disc;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.47, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = fg;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.41, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = fg;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText('STAGE', W / 2, H * 0.26);
    ctx.font = 'bold 150px sans-serif';
    ctx.fillText(String(n), W / 2, H * 0.6);
  }, { key: `tv-studios:stage-${n}`, repeat: false });
  const m = textured(tex, { transparent: true, alphaTest: 0.4 });
  return new THREE.Mesh(new THREE.PlaneGeometry(size, size).translate(0, size / 2, 0), m);
}

// Satellite dish on a pedestal; bowl opens up and tilted towards +Z.
export function dish({ r = 1, tilt = 45, pedestal = 0.8, color = PALETTE.white } = {}) {
  const R = r / Math.sin(0.6);
  const geo = new THREE.SphereGeometry(R, 16, 4, 0, Math.PI * 2, 0, 0.6);
  geo.rotateX(Math.PI);
  geo.translate(0, R, 0);
  const shellM = mat(color, { side: THREE.DoubleSide, roughness: 0.5 });
  const bowl = new THREE.Group();
  bowl.add(new THREE.Mesh(geo, shellM));
  const depth = R - R * Math.cos(0.6);
  const feedM = metal(PALETTE.steelDark);
  bowl.add(pipe([0, 0, 0], [0, r * 1.05, 0], r * 0.04, feedM));
  bowl.add(place(box(r * 0.18, r * 0.18, r * 0.18, feedM), { y: r * 1.0 }));
  bowl.rotation.x = THREE.MathUtils.degToRad(tilt);
  bowl.position.y = pedestal + depth * 0.3;
  return group(cylinder(r * 0.12, r * 0.18, pedestal + 0.1, metal(PALETTE.steelLight), 8), bowl);
}

// Outside-broadcast truck, length along X, cab at +X. Livery on both sides.
export function obTruck({ len = 6, w = 2.2, color = PALETTE.red, text = 'TTV  OB 1', dishR = 0, mast = true } = {}) {
  const g = new THREE.Group();
  const white = mat(PALETTE.white, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const cabL = 1.6;
  const bodyL = len - cabL - 0.15;
  const bodyX = -len / 2 + bodyL / 2;
  const cabX = len / 2 - cabL / 2;
  // chassis + wheels
  g.add(place(box(len - 0.3, 0.35, w - 0.3, dark), { y: 0.35 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [cabX, bodyX - bodyL * 0.15, bodyX - bodyL * 0.35]) for (const s of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10).rotateX(Math.PI / 2);
    const wh = new THREE.Mesh(wg, wheelM);
    wh.position.set(x, 0.42, s * (w / 2 - 0.15));
    g.add(wh);
  }
  // cab
  g.add(place(box(cabL, 1.9, w, mat(color, { roughness: 0.45, metalness: 0.2 })), { x: cabX, y: 0.55 }));
  g.add(place(box(0.05, 0.75, w - 0.3, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 })), { x: len / 2 + 0.01, y: 1.55 }));
  for (const s of [-1, 1]) g.add(place(box(0.7, 0.6, 0.05, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: cabX + 0.3, y: 1.6, z: s * (w / 2 + 0.01) }));
  g.add(place(box(0.08, 0.25, w - 0.2, emissive(PALETTE.windowLit, 0.6)), { x: len / 2 + 0.02, y: 0.75 }));
  // box body with livery
  const bodyH = 2.5;
  const livery = canvasTexture(512, 128, (ctx, W, H) => {
    ctx.fillStyle = '#f6f6f2';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(W * 0.55, H); ctx.lineTo(W * 0.75, 0); ctx.lineTo(W, 0); ctx.lineTo(W, H); ctx.fill();
    ctx.fillStyle = '#1f2a44';
    ctx.fillRect(0, H * 0.78, W, H * 0.1);
    ctx.fillStyle = '#1f2a44';
    ctx.font = 'bold 54px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W * 0.05, H * 0.42);
  }, { key: `tv-studios:livery:${color}:${text}`, repeat: false });
  const liv = textured(livery);
  g.add(place(uvBox(bodyL, bodyH, w, [white, white, white, white, liv, liv]), { x: bodyX, y: 0.55 }));
  // roof kit: AC units, folded mast, optional dish
  const roofY = 0.55 + bodyH;
  g.add(place(box(0.8, 0.35, 0.8, mat(PALETTE.lightGrey)), { x: bodyX - bodyL / 2 + 0.6, y: roofY }));
  g.add(place(box(0.5, 0.3, 0.9, mat(PALETTE.lightGrey)), { x: bodyX + 0.2, y: roofY }));
  if (mast) {
    g.add(pipe([bodyX - bodyL / 2 + 1.2, roofY + 0.25, 0.55], [bodyX + bodyL / 2 - 0.2, roofY + 0.25, 0.55], 0.1, metal(PALETTE.steelLight)));
    g.add(place(box(0.35, 0.3, 0.35, mat(PALETTE.darkGrey)), { x: bodyX + bodyL / 2 - 0.2, y: roofY + 0.1, z: 0.55 }));
  }
  if (dishR) g.add(place(dish({ r: dishR, tilt: 50, pedestal: 0.35 }), { x: bodyX + bodyL * 0.15, y: roofY, ry: 90 }));
  // stabiliser legs
  for (const x of [bodyX - bodyL / 2 + 0.4, bodyX + bodyL / 2 - 0.4]) for (const s of [-1, 1]) {
    g.add(place(box(0.15, 0.4, 0.15, mat(PALETTE.yellow)), { x, z: s * (w / 2 + 0.05) }));
  }
  return g;
}

// Studio light on a stand, head aimed at +Z.
export function lightStand({ h = 2.6 } = {}) {
  const m = metal(PALETTE.darkGrey);
  return group(
    pipe([0, 0, 0], [0, h, 0], 0.05, m),
    pipe([-0.45, 0, -0.35], [0, 0.9, 0], 0.035, m),
    pipe([0.45, 0, -0.35], [0, 0.9, 0], 0.035, m),
    pipe([0, 0, 0.5], [0, 0.9, 0], 0.035, m),
    place(box(0.6, 0.5, 0.45, mat(PALETTE.black)), { y: h - 0.1 }),
    place(box(0.5, 0.4, 0.05, emissive('#fff4c8', 1.0)), { y: h - 0.05, z: 0.24 }),
  );
}

// Film camera on a tripod, lens towards +Z.
export function filmCamera() {
  const m = metal(PALETTE.darkGrey);
  return group(
    pipe([-0.4, 0, -0.3], [0, 1.3, 0], 0.04, m),
    pipe([0.4, 0, -0.3], [0, 1.3, 0], 0.04, m),
    pipe([0, 0, 0.45], [0, 1.3, 0], 0.04, m),
    place(box(0.5, 0.55, 0.8, mat(PALETTE.black)), { y: 1.3 }),
    place(cylinder(0.16, 0.16, 0.45, mat(PALETTE.darkGrey), 10), { y: 1.57, z: 0.4, rx: 90 }),
    place(cylinder(0.28, 0.28, 0.08, mat(PALETTE.darkGrey), 12), { x: 0, y: 1.95, z: -0.15, rz: 90 }),
    place(cylinder(0.28, 0.28, 0.08, mat(PALETTE.darkGrey), 12), { x: 0, y: 1.95, z: 0.25, rz: 90 }),
  );
}

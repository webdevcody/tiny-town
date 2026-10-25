// Local railway props for the signal box & level crossing.
// All parts follow the lib convention: origin at the centre of the base.
import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, beam, place, group, taperedBlock,
  mat, metal, emissive, textured, canvasTexture, signTexture,
} from '../../src/lib/index.js';

// Box with 0..1 UVs per face (the lib's box() uses metre UVs, which shrinks
// clamped textures on faces wider than 1 m).
export function uvBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

/** Text board, readable on +z (and -z if double). */
export function board({ text, w, h, bg = PALETTE.black, fg = '#ffffff', depth = 0.08, double = false }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

const stripeTex = () => canvasTexture(256, 16, (ctx, W, H) => {
  const n = 8;
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = i % 2 ? '#f4f1ea' : '#d0302a';
    ctx.fillRect((W * i) / n, 0, W / n + 1, H);
  }
}, { key: 'signal-box-crossing:boom', repeat: false });

const armTex = () => canvasTexture(128, 32, (ctx, W, H) => {
  ctx.fillStyle = '#c8322b';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(W * 0.72, 0, W * 0.09, H);
}, { key: 'signal-box-crossing:arm', repeat: false });

const crossTex = () => canvasTexture(128, 24, (ctx, W, H) => {
  ctx.fillStyle = '#d0302a';
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = '#f4f1ea';
  ctx.fillRect(4, 4, W - 8, H - 8);
}, { key: 'signal-box-crossing:cross', repeat: false });

const warnTex = () => canvasTexture(128, 112, (ctx, W, H) => {
  ctx.clearRect(0, 0, W, H);
  const tri = (inset, color) => {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(W / 2, inset * 1.4);
    ctx.lineTo(W - inset, H - inset);
    ctx.lineTo(inset, H - inset);
    ctx.closePath();
    ctx.fill();
  };
  tri(2, '#d0302a');
  tri(16, '#f4f1ea');
  // a little gate / fence pictogram
  ctx.fillStyle = '#232326';
  ctx.fillRect(W * 0.3, H * 0.6, W * 0.4, H * 0.05);
  ctx.fillRect(W * 0.3, H * 0.72, W * 0.4, H * 0.05);
  for (let i = 0; i < 4; i++) ctx.fillRect(W * (0.31 + i * 0.12), H * 0.52, W * 0.04, H * 0.3);
}, { key: 'signal-box-crossing:warn', repeat: false });

/** Lowered barrier: grey mechanism housing at the origin, striped boom along +x. */
export function barrier({ len = 3.6 } = {}) {
  const grey = mat(PALETTE.steelLight);
  const boomFace = textured(stripeTex());
  const g = group(
    place(box(0.5, 0.95, 0.45, grey), {}),
    place(box(0.56, 0.08, 0.5, mat(PALETTE.darkGrey)), { y: 0.95 }),
    place(box(0.18, 0.25, 0.5, mat(PALETTE.yellow)), { x: -0.16, y: 0.3 }),
  );
  const boom = uvBox(len, 0.14, 0.12, [mat('#f4f1ea'), mat('#d0302a'), boomFace, boomFace, boomFace, boomFace]);
  boom.position.set(0.25 + len / 2, 0.82, 0);
  g.add(boom);
  // counterweight stub and boom lamps
  g.add(place(box(0.55, 0.22, 0.2, mat(PALETTE.darkGrey)), { x: -0.38, y: 0.78 }));
  for (const t of [0.35, 0.7, 0.97]) {
    g.add(place(box(0.1, 0.1, 0.16, emissive('#ff3b2a', t > 0.9 ? 1.6 : 0.9)), { x: 0.25 + len * t, y: 0.96 }));
  }
  // drop skirt near the tip, so the boom doesn't look like a bare stick
  g.add(place(box(0.08, 0.45, 0.08, mat('#f4f1ea')), { x: 0.25 + len - 0.1, y: 0.38 }));
  return g;
}

/** Flashing-light post with a St Andrew's cross, facing +z. litLeft picks the lamp that is on. */
export function crossingLights({ litLeft = true } = {}) {
  const pole = metal(PALETTE.steel);
  const black = mat(PALETTE.black);
  const on = emissive('#ff2a1a', 2.2);
  const off = mat('#5a1712', { roughness: 0.4 });
  const g = group(
    place(box(0.35, 0.15, 0.35, mat(PALETTE.concrete)), {}),
    cylinder(0.07, 0.08, 3.25, pole, 8),
  );
  // crossbuck
  const cm = textured(crossTex());
  for (const rz of [32, -32]) {
    const plank = uvBox(1.25, 0.2, 0.05, [cm, cm, cm, cm, cm, cm]);
    plank.geometry.translate(0, -0.1, 0);
    g.add(place(plank, { y: 2.85, z: 0.1, rz }));
  }
  // twin red lamps on a black backboard with hoods
  g.add(place(box(1.15, 0.45, 0.06, black), { y: 1.95, z: 0.1 }));
  g.add(place(box(0.14, 0.12, 0.08, black), { y: 2.4, z: 0.05 }));
  for (const [x, lit] of [[-0.32, litLeft], [0.32, !litLeft]]) {
    const lens = cylinder(lit ? 0.18 : 0.15, lit ? 0.18 : 0.15, 0.08, lit ? on : off, 12);
    lens.rotation.x = Math.PI / 2;
    lens.position.set(x, 2.175, 0.15);
    g.add(lens);
    g.add(place(box(0.38, 0.05, 0.22, black), { x, y: 2.36, z: 0.22 }));
  }
  // small "phone" sign & bell box
  g.add(place(box(0.28, 0.22, 0.2, mat(PALETTE.darkGrey)), { y: 1.3, z: 0.1 }));
  return g;
}

/** Semaphore signal, facing +z, arm towards +x. clear = arm lowered 45°. */
export function semaphore({ h = 6.2, clear = false } = {}) {
  const white = mat('#f1eee6');
  const black = mat(PALETTE.black);
  const g = group(
    place(box(0.5, 0.2, 0.5, mat(PALETTE.concreteDark)), {}),
    place(taperedBlock({ w: 0.26, d: 0.26, h, topW: 0.17, topD: 0.17, material: white, topMaterial: white }), { y: 0.2 }),
    place(box(0.3, 0.9, 0.3, black), { y: 0.2 }),
    place(box(0.28, 0.08, 0.28, black), { y: h + 0.2 }),
    place(cone(0.1, 0.35, black, 6), { y: h + 0.28 }),
  );
  // the arm, pivoting at the post
  const ay = h - 0.9;
  const face = textured(armTex());
  const red = mat('#c8322b');
  const arm = uvBox(1.25, 0.26, 0.05, [red, red, red, red, face, mat('#f1eee6')]);
  arm.geometry.translate(1.25 / 2 + 0.1, -0.13, 0);
  const pivot = new THREE.Group();
  pivot.position.set(0, ay, 0.16);
  pivot.rotation.z = THREE.MathUtils.degToRad(clear ? -45 : 0);
  pivot.add(arm);
  // spectacle plate with red and green glasses on the inner side
  const spec = new THREE.Group();
  spec.add(place(box(0.34, 0.6, 0.04, black), { x: -0.08, y: -0.55 }));
  const lensOn = emissive(clear ? '#3dff6a' : '#ff2a1a', 2);
  const red2 = clear ? mat('#7a1a14') : lensOn;
  const green2 = clear ? lensOn : mat('#1d4a2a');
  for (const [y, m] of [[-0.25, red2], [-0.43, green2]]) {
    const l = cylinder(0.09, 0.09, 0.05, m, 10);
    l.rotation.x = Math.PI / 2;
    l.position.set(-0.08, y, 0.03);
    spec.add(l);
  }
  pivot.add(spec);
  g.add(pivot);
  g.add(place(box(0.18, 0.18, 0.18, black), { x: 0.05, y: ay, z: 0.18 }));
  // lamp case behind the spectacle
  g.add(place(box(0.22, 0.3, 0.2, black), { x: -0.08, y: ay - 0.75, z: 0.05 }));
  // ladder and lamp platform at the back
  const lm = metal(PALETTE.steelDark);
  for (const x of [-0.17, 0.17]) g.add(beam([x, 0.4, -0.32], [x, ay - 0.95, -0.32], 0.04, lm));
  for (let y = 0.7; y < ay - 1.0; y += 0.38) g.add(place(box(0.34, 0.03, 0.03, lm), { y, z: -0.32 }));
  g.add(place(box(0.7, 0.05, 0.55, lm), { y: ay - 1.0, z: -0.12 }));
  g.add(place(box(0.7, 0.04, 0.04, lm), { y: ay - 0.45, z: -0.38 }));
  for (const x of [-0.33, 0.33]) g.add(place(box(0.04, 0.55, 0.04, lm), { x, y: ay - 1.0, z: -0.38 }));
  return g;
}

/** Triangular "gated level crossing" warning sign on a post, facing +z. */
export function warningSign() {
  const tex = warnTex();
  const face = textured(tex, { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.7), face);
  plate.position.set(0, 2.05, 0.05);
  return group(
    cylinder(0.04, 0.04, 2.0, metal(PALETTE.steel), 6),
    plate,
  );
}

/** Lineside telegraph pole with two crossarms; wires run along x. */
export function telegraphPole({ h = 5.5 } = {}) {
  const wood = mat(PALETTE.woodDark);
  const g = group(cylinder(0.09, 0.12, h, wood, 7));
  for (const [y, w] of [[h - 0.25, 1.4], [h - 0.75, 1.1]]) {
    g.add(place(box(0.1, 0.1, w, wood), { y }));
    for (let i = 0; i < 4; i++) {
      const z = -w / 2 + 0.12 + (i * (w - 0.24)) / 3;
      g.add(place(cylinder(0.04, 0.04, 0.12, mat(PALETTE.white), 6), { y: y + 0.1, z }));
    }
  }
  return g;
}

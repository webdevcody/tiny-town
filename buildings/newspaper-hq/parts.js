import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, place, group, mat, metal, emissive, textured, surface,
  canvasTexture, signTexture, car,
} from '../../src/lib/index.js';

// Local props for the newspaper HQ. Signs use BoxGeometry/PlaneGeometry (0..1 UVs)
// so the text fills the face instead of shrinking into a corner like lib sign().

/** Flat sign with readable text on the +z face. Base at y = 0. */
export function panelSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', border = null, depth = 0.15, double = false, glow = 0.15 } = {}) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border, font: 'bold' });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

function letterTexture(ch, color) {
  return canvasTexture(128, 256, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    const size = H * 0.92;
    ctx.font = `900 ${size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const tw = ctx.measureText(ch).width;
    const sx = Math.min(1, (W * 0.9) / Math.max(tw, 1));
    ctx.translate(W / 2, H / 2 + H * 0.04);
    ctx.scale(sx, 1);
    ctx.lineJoin = 'round';
    ctx.lineWidth = 14;
    ctx.strokeStyle = '#fff6dc';
    ctx.strokeText(ch, 0, 0);
    ctx.fillStyle = color;
    ctx.fillText(ch, 0, 0);
  }, { key: `newspaper-hq:letter:${ch}:${color}`, repeat: false });
}

/**
 * Giant free-standing rooftop letters on a steel frame, facing +z.
 * Spans `w` along X, letters `h` tall, base at y = 0, frame behind at -z.
 */
export function rooftopLetters(text, { w, h = 2.4, lift = 0.7, color = '#d2261b' } = {}) {
  const g = new THREE.Group();
  const n = text.length;
  const pitch = w / n;
  const lw = pitch * 0.96;
  const steel = metal(PALETTE.steelDark);
  for (let i = 0; i < n; i++) {
    const ch = text[i];
    if (ch === ' ') continue;
    const x = -w / 2 + pitch * (i + 0.5);
    const tex = letterTexture(ch, color);
    const front = textured(tex, { transparent: false, alphaTest: 0.5, emissive: color, emissiveIntensity: 0.35, emissiveMap: tex });
    const backM = textured(tex, { transparent: false, alphaTest: 0.5, side: THREE.DoubleSide, color: '#6e1a14' });
    const geo = new THREE.PlaneGeometry(lw, h).translate(0, h / 2, 0);
    // a darker second layer just behind fakes letter depth and shows from the back
    g.add(place(new THREE.Mesh(geo, backM), { x: x + 0.06, y: lift - 0.06, z: -0.14 }));
    g.add(place(new THREE.Mesh(geo, front), { x, y: lift, z: 0 }));
  }
  // steel frame: two rails, posts, raking braces
  const fz = -0.35;
  for (const y of [lift + h * 0.22, lift + h * 0.78]) g.add(place(box(w, 0.14, 0.14, steel), { y, z: fz }));
  const posts = Math.max(2, Math.round(w / 2.2));
  for (let i = 0; i <= posts; i++) {
    const x = -w / 2 + 0.1 + ((w - 0.2) * i) / posts;
    g.add(place(box(0.16, lift + h * 0.85, 0.16, steel), { x, z: fz }));
    g.add(place(box(0.12, 0.12, 1.8, steel), { x, y: 0, z: fz - 0.9 }));
    const brace = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1, 0.1), steel);
    const a = new THREE.Vector3(x, lift + h * 0.7, fz), b = new THREE.Vector3(x, 0, fz - 1.7);
    brace.position.copy(a).add(b).multiplyScalar(0.5);
    brace.scale.y = a.distanceTo(b);
    brace.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
    g.add(brace);
  }
  return g;
}

/** Round clock face on the +z side of a wall. Origin at the centre of the dial. */
export function clockFace(r = 0.8) {
  const tex = canvasTexture(128, 128, (ctx, W) => {
    const c = W / 2;
    ctx.fillStyle = '#c9a24a';
    ctx.fillRect(0, 0, W, W);
    ctx.fillStyle = '#fbf6e6';
    ctx.beginPath(); ctx.arc(c, c, c * 0.86, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#222';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      ctx.beginPath(); ctx.arc(c + Math.sin(a) * c * 0.7, c - Math.cos(a) * c * 0.7, i % 3 === 0 ? 6 : 3, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = '#222'; ctx.lineCap = 'round';
    ctx.lineWidth = 7; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c + c * 0.32, c - c * 0.18); ctx.stroke();
    ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(c, c); ctx.lineTo(c - c * 0.05, c - c * 0.58); ctx.stroke();
  }, { key: 'newspaper-hq:clock', repeat: false });
  const rim = mat('#c9a24a', { metalness: 0.4, roughness: 0.4 });
  const geo = new THREE.CylinderGeometry(r, r, 0.16, 24).rotateX(Math.PI / 2);
  return new THREE.Mesh(geo, [rim, textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex }), rim]);
}

/** Newsprint roll. standing: axis vertical, base at y=0; otherwise axis along `axis` ('x'|'z'), resting on y=0. */
export function paperRoll({ r = 0.45, len = 1.3, standing = false, axis = 'z' } = {}) {
  const paper = mat('#f3efe2', { roughness: 0.9 });
  const end = mat('#e2dccb');
  const core = mat(PALETTE.woodLight);
  const geo = new THREE.CylinderGeometry(r, r, len, 14);
  const cgeo = new THREE.CylinderGeometry(r * 0.22, r * 0.22, len + 0.04, 8);
  const roll = new THREE.Group();
  roll.add(new THREE.Mesh(geo, [paper, end, end]));
  roll.add(new THREE.Mesh(cgeo, core));
  if (standing) roll.position.y = len / 2;
  else {
    roll.position.y = r;
    if (axis === 'z') roll.rotation.x = Math.PI / 2;
    else roll.rotation.z = Math.PI / 2;
  }
  return group(roll);
}

/** Pyramid of lying rolls, axis along Z, centred on the origin. */
export function rollStack({ r = 0.45, len = 1.3, base = 3 } = {}) {
  const g = new THREE.Group();
  for (let row = 0; row < base; row++) {
    const count = base - row;
    for (let i = 0; i < count; i++) {
      const x = (i - (count - 1) / 2) * r * 2.02;
      g.add(place(paperRoll({ r, len }), { x, y: row * r * 1.72 }));
    }
  }
  return g;
}

/** Small yellow forklift, forks pointing +x. */
export function forklift() {
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(place(box(1.5, 0.7, 1.0, body), { y: 0.25 }));
  g.add(place(box(0.5, 0.45, 0.9, dark), { x: -0.55, y: 0.95 }));
  for (const [x, z] of [[-0.6, -0.42], [-0.6, 0.42], [0.1, -0.42], [0.1, 0.42]]) g.add(place(box(0.08, 1.1, 0.08, dark), { x, y: 0.95, z }));
  g.add(place(box(0.9, 0.06, 1.0, dark), { x: -0.25, y: 2.05 }));
  g.add(place(box(0.08, 2.4, 0.9, dark), { x: 0.8 }));
  for (const z of [-0.3, 0.3]) g.add(place(box(1.0, 0.06, 0.12, dark), { x: 1.3, y: 0.15, z }));
  for (const [x, z] of [[-0.45, -0.5], [-0.45, 0.5], [0.45, -0.5], [0.45, 0.5]]) {
    g.add(place(new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.2, 8).rotateX(Math.PI / 2), mat(PALETTE.black)), { x, y: 0.25, z }));
  }
  return g;
}

/** Delivery van (lib car van) with the paper's name on both flanks. Nose points +x. */
export function deliveryVan({ color = PALETTE.navy, text = 'TINY TIMES', fg = '#ffffff' } = {}) {
  const g = group(car({ color, kind: 'van' }));
  const len = 4.8;
  for (const side of [1, -1]) {
    g.add(place(panelSign(text, len * 0.66, 0.55, { bg: color, fg, depth: 0.04 }), { x: -len * 0.1, y: 1.25, z: side * 0.885, ry: side > 0 ? 0 : 180 }));
  }
  g.add(place(box(len * 0.75 + 0.02, 0.12, 1.77, mat(PALETTE.red)), { x: -len * 0.1, y: 1.05 }));
  return g;
}

/** Classic wooden rooftop water tank on a steel stand. */
export function waterTank({ r = 1.1, h = 2.2, legH = 1.6 } = {}) {
  const wood = surface('planks', PALETTE.wood, { size: 1 });
  const steel = metal(PALETTE.steelDark);
  const g = new THREE.Group();
  for (const [x, z] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.add(place(box(0.14, legH, 0.14, steel), { x: x * r * 0.62, z: z * r * 0.62 }));
  g.add(place(box(r * 1.5, 0.12, r * 1.5, steel), { y: legH }));
  g.add(place(cylinder(r, r, h, wood, 14), { y: legH + 0.12 }));
  for (const y of [0.4, 1.1, 1.8]) g.add(place(cylinder(r + 0.03, r + 0.03, 0.07, steel, 14), { y: legH + 0.12 + y * (h / 2.2) }));
  g.add(place(cone(r + 0.1, 0.8, mat(PALETTE.woodDark), 14), { y: legH + 0.12 + h }));
  return g;
}

/** Row of coin-op newspaper vending boxes facing +z. */
export function newsBoxes(colors = [PALETTE.red, PALETTE.blue, PALETTE.yellow, PALETTE.green]) {
  const g = new THREE.Group();
  colors.forEach((c, i) => {
    const x = (i - (colors.length - 1) / 2) * 0.62;
    g.add(place(box(0.08, 0.5, 0.08, PALETTE.darkGrey), { x }));
    g.add(place(box(0.55, 0.75, 0.5, mat(c, { roughness: 0.5 })), { x, y: 0.5 }));
    g.add(place(box(0.42, 0.32, 0.04, emissive('#f4f0e2', 0.2)), { x, y: 0.82, z: 0.26 }));
  });
  return g;
}

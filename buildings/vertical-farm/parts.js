import * as THREE from 'three';
import { PALETTE, place, box, cylinder, cone, sphere, mat, metal, emissive, textured, canvasTexture, signTexture } from '../../src/lib/index.js';

/** Dark plum frame for slabs and columns. */
export const FRAME = '#4a3f58';

/** Sign board with 0..1 UVs on the +z face, so the text fills the whole board. Base at y = 0. */
export function boardSign({ text, w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null, glow = 0.25 }) {
  const tw = 512;
  const th = Math.max(32, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, face]);
}

/** Rows of leafy rosettes (UVs are metres, one repeat per metre). */
export function greensMaterial() {
  const tex = canvasTexture(64, 32, (ctx, W, H) => {
    ctx.fillStyle = '#3f8a26';
    ctx.fillRect(0, 0, W, H);
    for (let i = 0; i < 4; i++) {
      const cx = (i + 0.5) * (W / 4);
      for (const [r, c] of [[7, '#4f9a2c'], [5, '#78c23e'], [2.5, '#b4e26a']]) {
        ctx.fillStyle = c;
        ctx.beginPath();
        ctx.arc(cx, H * 0.55, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, { key: 'vertical-farm:greens' });
  return textured(tex, { emissive: '#3a7a20', emissiveIntensity: 0.6 });
}

/** One hydroponic storey: slab, glowing core, racks of greens with LED bars, tinted glass skin. */
export function hydroFloor({ w, d, h }) {
  const g = new THREE.Group();
  const slabT = 0.28;
  g.add(box(w + 0.5, slabT, d + 0.5, mat(FRAME)));
  // lit band on the slab edge, glowing floor inside
  g.add(place(box(w + 0.54, 0.1, d + 0.54, emissive('#ff5ad9', 1)), { y: slabT - 0.14 }));
  g.add(place(box(w - 0.1, 0.02, d - 0.1, emissive('#9b3fb8', 0.7)), { y: slabT }));

  const inner = h - slabT;
  const y = slabT;
  // glowing service core
  g.add(place(box(1.8, inner, 1.8, mat('#4a2466', { emissive: '#a24fe8', emissiveIntensity: 0.8 })), { y }));
  // pink LED ceiling panel
  g.add(place(box(w - 0.3, 0.06, d - 0.3, emissive('#f070e8', 0.8)), { y: y + inner - 0.08 }));

  const shelf = metal(PALETTE.steelDark);
  const post = metal(PALETTE.steelDark);
  const greens = greensMaterial();
  const ledA = emissive('#ff4fd0', 1.5);
  const ledB = emissive('#c27bff', 1.5);
  const tiers = [0.25, 1.0, 1.75];
  const rack = (len) => {
    const r = new THREE.Group();
    tiers.forEach((ty, i) => {
      r.add(place(box(len, 0.05, 0.6, shelf), { y: ty }));
      r.add(place(box(len - 0.1, 0.32, 0.5, greens), { y: ty + 0.05 }));
      r.add(place(box(len - 0.1, 0.16, 0.45, i % 2 ? ledB : ledA), { y: ty + 0.56 }));
    });
    for (const sx of [-1, 1]) r.add(place(box(0.06, inner - 0.2, 0.6, post), { x: sx * (len / 2 - 0.03) }));
    return r;
  };
  const inset = 0.55;
  const lenX = w - 2 * inset - 0.7;
  const lenZ = d - 2 * inset - 0.7;
  g.add(place(rack(lenX), { y, z: d / 2 - inset }));
  g.add(place(rack(lenX), { y, z: -d / 2 + inset }));
  g.add(place(rack(lenZ), { y, x: w / 2 - inset, ry: 90 }));
  g.add(place(rack(lenZ), { y, x: -w / 2 + inset, ry: 90 }));

  // glass skin
  const glassM = mat('#c77aec', { transparent: true, opacity: 0.14, roughness: 0.7, metalness: 0, emissive: '#d04de8', emissiveIntensity: 0.4, depthWrite: false });
  g.add(place(box(w, inner, d, glassM), { y }));
  return g;
}

/** Rooftop wind vane: mast, compass arms, gold arrow with tail fin. Arrow points along +x. */
export function windVane({ h = 4 } = {}) {
  const g = new THREE.Group();
  const iron = metal('#2e2a33', { roughness: 0.5 });
  const gold = metal('#d9a93a', { roughness: 0.3 });
  g.add(cylinder(0.25, 0.32, 0.4, iron, 8));
  g.add(cylinder(0.07, 0.09, h, iron, 8));
  // compass cross
  const cy = h * 0.62;
  g.add(place(box(2.2, 0.08, 0.08, iron), { y: cy }));
  g.add(place(box(0.08, 0.08, 2.2, iron), { y: cy }));
  for (const [x, z] of [[1.1, 0], [-1.1, 0], [0, 1.1], [0, -1.1]]) g.add(place(sphere(0.14, gold, 8), { x, y: cy - 0.07, z }));
  g.add(place(sphere(0.2, gold, 10), { y: h - 0.2 }));
  // arrow
  const ay = h + 0.1;
  g.add(place(box(2.8, 0.1, 0.1, gold), { x: 0.1, y: ay }));
  const head = cone(0.32, 0.8, gold, 4);
  head.rotation.z = -Math.PI / 2;
  head.position.set(1.5, ay + 0.05, 0);
  g.add(head);
  const fin = new THREE.Shape([new THREE.Vector2(0, 0), new THREE.Vector2(-1.0, 0.0), new THREE.Vector2(-1.3, 0.75), new THREE.Vector2(-0.3, 0.45)]);
  const finGeo = new THREE.ExtrudeGeometry(fin, { depth: 0.05, bevelEnabled: false }).translate(-0.9, -0.2, -0.025);
  g.add(place(new THREE.Mesh(finGeo, gold), { y: ay + 0.05 }));
  // little leaf on the mast: it's a farm
  const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.3, 8, 6).scale(1, 0.35, 0.6), mat(PALETTE.foliageLight));
  g.add(place(leaf, { x: 0.3, y: h * 0.3, rz: 30 }));
  return g;
}

/** Produce crate full of greens. */
export function crate({ color = PALETTE.wood, produce = '#6cbf3a' } = {}) {
  const g = new THREE.Group();
  g.add(box(0.6, 0.35, 0.45, mat(color)));
  g.add(place(box(0.52, 0.08, 0.38, mat(produce)), { y: 0.33 }));
  return g;
}

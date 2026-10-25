import * as THREE from 'three';
import {
  PALETTE, box, cylinder, cone, sphere, group, place, beam, mat, metal, emissive,
  textured, canvasTexture, signTexture, gableRoof,
} from '../../src/lib/index.js';

// Box with 0..1 UVs per face (lib box() UVs are in metres, which shrinks
// clamped textures on faces over 1 m). Base at y = 0.
export function uvBox(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

// Flat sign, text on +Z face, readable at any size.
export function plate({ text, w, h, depth = 0.12, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return uvBox(w, h, depth, [side, side, side, side, face, side]);
}

// White louvred slats, drawn to cover one face of a uvBox.
function louvreTexture() {
  return canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, W, H);
    const n = 7;
    for (let i = 0; i < n; i++) {
      const y = ((i + 0.55) / n) * H;
      ctx.fillStyle = '#a9a69c';
      ctx.fillRect(3, y, W - 6, 3);
      ctx.fillStyle = '#d5d2c8';
      ctx.fillRect(3, y + 3, W - 6, 2);
    }
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 3, H);
    ctx.fillRect(W - 3, 0, 3, H);
  }, { key: 'weather-station:louvre', repeat: false });
}

// Stevenson screen: louvred white box on four legs with a small pitched roof.
export function stevensonScreen() {
  const white = mat(PALETTE.white);
  const louvre = textured(louvreTexture());
  const legH = 1.05, w = 1.0, h = 0.75, d = 0.75;
  const g = new THREE.Group();
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.08, legH, 0.08, white), { x: sx * (w / 2 - 0.08), z: sz * (d / 2 - 0.08) }));
  }
  g.add(place(box(0.9, 0.05, 0.05, white), { y: 0.35, z: d / 2 - 0.08 }));
  g.add(place(box(0.9, 0.05, 0.05, white), { y: 0.35, z: -d / 2 + 0.08 }));
  g.add(place(box(w + 0.06, 0.05, d + 0.06, white), { y: legH }));
  g.add(place(uvBox(w, h, d, [louvre, louvre, white, white, louvre, louvre]), { y: legH + 0.05 }));
  g.add(place(gableRoof({ w, d, h: 0.22, overhang: 0.08, ridge: 'x', material: white, gableMaterial: white }), { y: legH + 0.05 + h }));
  // door handle on the front
  g.add(place(box(0.12, 0.04, 0.03, mat(PALETTE.darkGrey)), { y: legH + 0.4, z: d / 2 + 0.01 }));
  return g;
}

// Rain gauge: copper funnel on a short cylinder.
export function rainGauge() {
  const body = metal('#3f7a63', { roughness: 0.5 });
  return group(
    cylinder(0.16, 0.16, 0.45, body, 12),
    place(cylinder(0.2, 0.14, 0.12, metal(PALETTE.rust, { roughness: 0.4 }), 12), { y: 0.45 })
  );
}

// Campbell-Stokes sunshine recorder: glass ball on a white pedestal.
export function sunshineRecorder() {
  return group(
    box(0.35, 0.9, 0.35, mat(PALETTE.white)),
    place(box(0.5, 0.06, 0.4, metal(PALETTE.steel)), { y: 0.9 }),
    place(cylinder(0.22, 0.22, 0.05, metal(PALETTE.rust), 12), { y: 0.96, rx: 90, z: 0.0 }),
    place(sphere(0.18, mat(PALETTE.glassSky, { roughness: 0.1, metalness: 0.4, flatShading: false }), 12), { y: 0.96 })
  );
}

// Three-cup anemometer, hub at the origin, spinning about Y.
export function cupAnemometer({ r = 0.45, spin = 0 } = {}) {
  const m = metal(PALETTE.steelLight);
  const cupM = mat(PALETTE.black);
  const g = group(cylinder(0.06, 0.08, 0.3, m, 8), place(cone(0.1, 0.15, m, 8), { y: 0.3 }));
  for (let i = 0; i < 3; i++) {
    const a = spin + (i * Math.PI * 2) / 3;
    const x = Math.cos(a) * r, z = Math.sin(a) * r;
    g.add(beam([0, 0.22, 0], [x, 0.22, z], 0.035, m));
    // cup: half sphere opening sideways
    const cup = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 6, 0, Math.PI), cupM);
    cup.rotation.y = -a;
    cup.position.set(x, 0.22, z);
    g.add(cup);
  }
  return g;
}

// Wind vane: arrow pointing along +X, pivot at origin.
export function windVane({ len = 1.0 } = {}) {
  const m = metal(PALETTE.darkGrey);
  const g = group(cylinder(0.04, 0.05, 0.25, m, 6));
  g.add(place(box(len, 0.05, 0.05, m), { y: 0.22 }));
  g.add(place(cone(0.11, 0.25, mat(PALETTE.red), 6), { x: len / 2, y: 0.245, rz: -90 }));
  g.add(place(box(0.3, 0.3, 0.03, mat(PALETTE.red)), { x: -len / 2 + 0.1, y: 0.1 }));
  return g;
}

// Striped windsock on a pole, blowing towards +X.
export function windsock({ h = 4 } = {}) {
  const pole = metal(PALETTE.steelLight);
  const g = group(cylinder(0.05, 0.07, h, pole, 6));
  g.add(place(box(0.05, 0.05, 0.4, pole), { y: h - 0.05 }));
  const stripes = [PALETTE.orange, PALETTE.white, PALETTE.orange, PALETTE.white, PALETTE.orange];
  let x = 0.05, rad = 0.3;
  for (const c of stripes) {
    const seg = cylinder(rad * 0.86, rad, 0.3, mat(c), 10);
    g.add(place(seg, { x, y: h - 0.1, rz: -90 + 4 }));
    x += 0.3; rad *= 0.86;
  }
  return g;
}

// Weather balloon with parachute and radiosonde hanging below; origin at the sonde.
export function weatherBalloon({ r = 1.0, line = 2.6 } = {}) {
  const g = new THREE.Group();
  const balloon = sphere(r, mat('#fbfaf5', { roughness: 0.35, flatShading: false }), 16);
  balloon.scale.set(1, 1.15, 1);
  g.add(place(balloon, { y: line }));
  g.add(place(cone(0.12, 0.25, mat('#fbfaf5'), 8), { y: line - 0.15, rx: 180 }));
  const string = mat(PALETTE.lightGrey);
  g.add(beam([0, 0.2, 0], [0, line, 0], 0.025, string));
  // parachute
  g.add(place(cone(0.32, 0.3, mat(PALETTE.red), 8), { y: line * 0.55 }));
  // radiosonde
  g.add(box(0.28, 0.22, 0.22, mat(PALETTE.orange)));
  g.add(place(box(0.02, 0.35, 0.02, metal(PALETTE.steelLight)), { y: -0.35 }));
  return g;
}

// Red aviation light.
export function beacon() {
  return sphere(0.13, emissive(PALETTE.red, 1.2), 8);
}

import * as THREE from 'three';
import {
  PALETTE, box, cylinder, sphere, place, group, mat, metal, emissive, textured,
  surface, canvasTexture, signTexture, lattice, pyramidRoof, shade,
} from '../../src/lib/index.js';

// Local military props for the Army Barracks. Vehicles face +z (nose / gun towards +z).

export const OLIVE = '#5e6b38';
export const OLIVE_DARK = '#454f29';
export const KHAKI = '#b9a46e';
export const CANVAS = '#7b7a4c';

export const TANK = '#4f5b30';
const oliveM = () => mat(OLIVE, { roughness: 0.7 });
const tankM = () => mat(TANK, { roughness: 0.7 });
const oliveDarkM = () => mat(OLIVE_DARK, { roughness: 0.75 });

// box with 0..1 UVs on each face, base at y = 0 (for signs and flags; lib box() UVs are in metres)
export function uvBox(w, h, d, material) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), material);
}

/** Big legible sign, text on +z (and -z when double). */
export function bigSign({ text, w, h, d = 0.12, bg = OLIVE_DARK, fg = '#ffffff', border = PALETTE.yellow, double = false }) {
  const px = 64;
  const face = textured(signTexture(text, { bg, fg, border, width: Math.round(px * w * 1.6), height: Math.round(px * h * 1.6) }));
  const edge = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [edge, edge, edge, edge, face, double ? face : edge]);
}

/** Main battle tank, about 2.6 x 6.5 m (gun included), gun towards +z. */
export function tank({ turretRy = 0 } = {}) {
  const g = new THREE.Group();
  const trackM = mat(PALETTE.darkGrey, { roughness: 0.9 });
  const wheelM = mat(PALETTE.black);
  const L = 5.2;
  for (const sx of [-1, 1]) {
    g.add(place(box(0.62, 0.85, L, trackM), { x: sx * 1.0, y: 0.05 }));
    for (let i = 0; i < 6; i++) {
      const wg = new THREE.CylinderGeometry(0.33, 0.33, 0.1, 10).rotateZ(Math.PI / 2);
      const w = new THREE.Mesh(wg, wheelM);
      w.position.set(sx * 1.33, 0.42, -L / 2 + 0.55 + (i * (L - 1.1)) / 5);
      g.add(w);
    }
    // track guard / skirt
    g.add(place(box(0.7, 0.08, L + 0.1, tankM()), { x: sx * 1.02, y: 0.9 }));
  }
  // hull: lower box + sloped glacis
  g.add(place(box(1.4, 0.75, L - 0.2, tankM()), { y: 0.25 }));
  g.add(place(box(2.7, 0.42, L - 0.8, tankM()), { y: 0.95, z: -0.3 }));
  const glacis = box(2.7, 0.08, 1.0, tankM());
  g.add(place(glacis, { y: 0.98, z: L / 2 - 0.55, rx: 22 }));
  // engine deck grille
  g.add(place(box(1.8, 0.05, 1.2, mat(OLIVE_DARK)), { y: 1.37, z: -1.9 }));
  // turret
  const tur = new THREE.Group();
  tur.add(place(cylinder(0.95, 1.1, 0.62, tankM(), 8), {}));
  tur.add(place(box(1.6, 0.5, 0.9, tankM()), { y: 0.06, z: -1.0 }));
  tur.add(place(cylinder(0.32, 0.36, 0.22, oliveDarkM(), 8), { x: 0.4, y: 0.62, z: -0.2 }));
  tur.add(place(box(0.5, 0.36, 0.5, oliveDarkM()), { y: 0.13, z: 0.95 }));
  const barrel = cylinder(0.09, 0.11, 3.0, metal(OLIVE_DARK, { roughness: 0.6 }), 8);
  tur.add(place(barrel, { y: 0.32, z: 1.1, rx: 90 }));
  tur.add(place(cylinder(0.14, 0.14, 0.35, oliveDarkM(), 8), { y: 0.32, z: 3.75, rx: 90 }));
  tur.add(place(cylinder(0.02, 0.02, 1.4, mat(PALETTE.black), 4), { x: -0.55, y: 0.6, z: -0.6 }));
  tur.rotation.y = THREE.MathUtils.degToRad(turretRy);
  tur.position.set(0, 1.37, -0.2);
  g.add(tur);
  return g;
}

/** Canvas-covered army truck, about 2.4 x 7 m, cab towards +z. */
export function armyTruck() {
  const g = new THREE.Group();
  const body = oliveM();
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  // chassis
  g.add(place(box(2.0, 0.3, 6.6, mat(PALETTE.darkGrey)), { y: 0.65 }));
  // cab
  g.add(place(box(2.3, 1.4, 1.7, body), { y: 0.95, z: 2.25 }));
  g.add(place(box(2.3, 0.8, 0.9, body), { y: 0.95, z: 3.25 }));
  g.add(place(box(2.0, 0.6, 0.05, glassM), { y: 1.62, z: 3.11 }));
  g.add(place(box(1.6, 0.35, 0.06, mat(PALETTE.darkGrey)), { y: 1.1, z: 3.71 }));
  for (const sx of [-1, 1]) g.add(place(box(0.06, 0.5, 0.9, glassM), { x: sx * 1.16, y: 1.65, z: 2.4 }));
  // cargo bed + canvas tilt (barrel top)
  g.add(place(box(2.4, 0.7, 4.3, oliveDarkM()), { y: 0.95, z: -1.0 }));
  g.add(place(box(2.4, 0.9, 4.2, mat(CANVAS, { roughness: 0.95 })), { y: 1.65, z: -1.05 }));
  // half cylinder: axis -> x, shell up (as in barrelRoof), then axis -> z
  const tilt = new THREE.CylinderGeometry(1.2, 1.2, 4.2, 12, 1, false, 0, Math.PI).rotateZ(Math.PI / 2).rotateY(Math.PI / 2);
  const tm = new THREE.Mesh(tilt, mat(CANVAS, { roughness: 0.95 }));
  tm.scale.set(1, 0.45, 1);
  tm.position.set(0, 2.55, -1.05);
  g.add(tm);
  // wheels
  const wheelM = mat(PALETTE.black);
  for (const z of [2.6, -0.9, -2.3]) for (const sx of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 10).rotateZ(Math.PI / 2);
    const w = new THREE.Mesh(wg, wheelM);
    w.position.set(sx * 1.0, 0.5, z);
    g.add(w);
  }
  return g;
}

/** Open-top jeep, about 1.8 x 3.6 m, facing +z. */
export function jeep() {
  const g = new THREE.Group();
  const body = oliveM();
  g.add(place(box(1.7, 0.6, 3.4, body), { y: 0.45 }));
  g.add(place(box(1.6, 0.5, 0.06, mat(PALETTE.glassDark)), { y: 1.05, z: 0.5, rx: -10 }));
  g.add(place(box(1.4, 0.35, 0.6, mat(OLIVE_DARK)), { y: 1.0, z: -0.3 }));
  g.add(place(cylinder(0.3, 0.3, 0.2, mat(PALETTE.black), 8), { y: 0.75, z: -1.75, rx: 90 }));
  for (const z of [1.1, -1.1]) for (const sx of [-1, 1]) {
    const wg = new THREE.CylinderGeometry(0.38, 0.38, 0.3, 10).rotateZ(Math.PI / 2);
    const w = new THREE.Mesh(wg, mat(PALETTE.black));
    w.position.set(sx * 0.85, 0.38, z);
    g.add(w);
  }
  return g;
}

/** Soldier figure (~1.8 m) facing +z. */
export function soldier({ salute = false } = {}) {
  const skin = mat('#e0b48a');
  const uni = mat(OLIVE, { roughness: 0.9 });
  const g = group(
    place(box(0.22, 0.85, 0.24, mat(OLIVE_DARK)), { x: -0.12 }),
    place(box(0.22, 0.85, 0.24, mat(OLIVE_DARK)), { x: 0.12 }),
    place(box(0.56, 0.65, 0.3, uni), { y: 0.85 }),
    place(sphere(0.15, skin, 6), { y: 1.48 }),
    place(cylinder(0.19, 0.2, 0.14, uni, 8), { y: 1.62 })
  );
  for (const sx of [-1, 1]) {
    const up = salute && sx > 0;
    g.add(place(box(0.14, 0.62, 0.16, uni), { x: sx * 0.35, y: up ? 1.2 : 0.88, rz: up ? 120 : 0 }));
  }
  return g;
}

/** Wooden guard watchtower, ~9.5 m tall. */
export function watchtower({ h = 6.5, w = 2.6 } = {}) {
  const g = new THREE.Group();
  const timber = mat(PALETTE.woodDark);
  g.add(lattice({ w: w + 0.4, h, topW: w - 0.2, segments: 3, thickness: 0.2, material: timber }));
  // cabin
  const cw = w + 0.4;
  g.add(place(box(cw + 0.6, 0.2, cw + 0.6, mat(PALETTE.wood)), { y: h }));
  // half walls, open windows, corner posts
  for (const [x, z, ww, dd] of [[0, cw / 2, cw, 0.12], [0, -cw / 2, cw, 0.12], [cw / 2, 0, 0.12, cw], [-cw / 2, 0, 0.12, cw]]) {
    g.add(place(box(ww, 1.1, dd, surface('planks', PALETTE.wood, { size: 1.5 })), { x, y: h + 0.2, z }));
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.14, 2.2, 0.14, timber), { x: sx * cw / 2, y: h + 0.2, z: sz * cw / 2 }));
  g.add(place(box(cw - 0.2, 1.0, cw - 0.2, mat(PALETTE.window)), { y: h + 1.3 }));
  g.add(place(pyramidRoof({ w: cw, d: cw, h: 1.2, overhang: 0.45, material: surface('corrugated', OLIVE_DARK, { size: 1 }) }), { y: h + 2.4 }));
  // searchlight on the roof front corner
  g.add(place(cylinder(0.05, 0.05, 0.5, metal(PALETTE.steelDark), 6), { x: cw / 2 - 0.1, y: h + 1.3, z: cw / 2 + 0.1 }));
  g.add(place(cylinder(0.28, 0.22, 0.4, metal(PALETTE.steelDark), 10), { x: cw / 2 - 0.1, y: h + 1.8, z: cw / 2 + 0.1, rx: 70 }));
  g.add(place(cylinder(0.2, 0.2, 0.05, emissive(PALETTE.windowLit, 1.0), 10), { x: cw / 2 - 0.1, y: h + 1.98, z: cw / 2 + 0.26, rx: 70 }));
  // ladder up the front
  const lm = mat(PALETTE.wood);
  for (const sx of [-0.3, 0.3]) g.add(place(box(0.08, h + 0.2, 0.08, lm), { x: sx, z: w / 2 + 0.55, rx: -5 }));
  for (let y = 0.4; y < h; y += 0.6) g.add(place(box(0.6, 0.06, 0.06, lm), { y, z: w / 2 + 0.55 - y * 0.087 }));
  return g;
}

/** Ring of sandbags (rectangle) with an opening at the front. */
export function sandbagWall({ w, d, h = 0.9, gap = 1.2 }) {
  const m = mat(KHAKI, { roughness: 1 });
  const g = new THREE.Group();
  const layer = 0.3;
  for (let y = 0, i = 0; y < h - 0.01; y += layer, i++) {
    const s = 1 - i * 0.06;
    g.add(place(box(w, layer, 0.5 * s, m), { y, z: -d / 2 }));
    g.add(place(box(0.5 * s, layer, d, m), { x: -w / 2, y }));
    g.add(place(box(0.5 * s, layer, d, m), { x: w / 2, y }));
    const seg = (w - gap) / 2;
    g.add(place(box(seg, layer, 0.5 * s, m), { x: -w / 2 + seg / 2, y, z: d / 2 }));
    g.add(place(box(seg, layer, 0.5 * s, m), { x: w / 2 - seg / 2, y, z: d / 2 }));
  }
  return g;
}

/** Flag with 0..1 UVs drawn on a canvas, waves towards +x. */
export function flagPole({ h = 10 } = {}) {
  const tex = canvasTexture(192, 128, (ctx, W, H) => {
    ctx.fillStyle = '#2f6a3a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c8322b';
    ctx.fillRect(0, 0, W * 0.33, H);
    ctx.fillStyle = '#e9c31f';
    // five-point star
    const cx = W * 0.64, cy = H / 2, R = H * 0.3, r = R * 0.4;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const a = -Math.PI / 2 + (i * Math.PI) / 5;
      const rr = i % 2 ? r : R;
      ctx.lineTo(cx + rr * Math.cos(a), cy + rr * Math.sin(a));
    }
    ctx.closePath();
    ctx.fill();
  }, { key: 'army-barracks:flag', repeat: false });
  const fm = textured(tex, { side: THREE.DoubleSide });
  const g = group(
    cylinder(0.06, 0.09, h, metal(PALETTE.steelLight), 8),
    place(sphere(0.13, mat(PALETTE.yellow), 8), { y: h }),
  );
  const fl = uvBox(2.4, 1.6, 0.04, [mat('#2f6a3a'), mat('#2f6a3a'), mat('#2f6a3a'), mat('#2f6a3a'), fm, fm]);
  g.add(place(fl, { x: 1.27, y: h - 1.75 }));
  return g;
}

/** Steel oil drum. */
export function drum(color = OLIVE) {
  return group(cylinder(0.3, 0.3, 0.9, mat(color, { roughness: 0.6 }), 10), place(cylinder(0.31, 0.31, 0.05, mat(shade(color, -0.25)), 10), { y: 0.45 }));
}

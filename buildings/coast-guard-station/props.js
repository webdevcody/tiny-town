// Local props for the Coast Guard Station: big signs with 0..1 UVs, the
// helipad deck, the orange lifeboat, the rescue helicopter and small bits.
import * as THREE from 'three';
import {
  PALETTE, canvasTexture, textured, mat, metal, emissive, box, cylinder, cone, sphere, extrude, place, group,
} from '../../src/lib/index.js';

const NAVY = PALETTE.navy;
const ORANGE = '#f0701e';

/** Board with a texture stretched over the +z face (0..1 UVs, unlike lib sign()). */
export function flatSign(tex, { w, h, depth = 0.12, edge = NAVY }) {
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(edge);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Navy board, white lettering, orange/blue racing stripe on the left. */
export function stationSignTexture(text, key) {
  return canvasTexture(512, 112, (ctx, W, H) => {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, W, H);
    // slanted racing stripe
    ctx.fillStyle = ORANGE;
    ctx.beginPath();
    ctx.moveTo(18, H); ctx.lineTo(58, 0); ctx.lineTo(88, 0); ctx.lineTo(48, H); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(52, H); ctx.lineTo(92, 0); ctx.lineTo(100, 0); ctx.lineTo(60, H); ctx.fill();
    ctx.fillStyle = '#ffffff';
    let size = H * 0.62;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(text).width > W - 130 && size > 8) ctx.font = `bold ${--size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, (W + 100) / 2, H / 2 + 3);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(3, 3, W - 6, H - 6);
  }, { key, repeat: false });
}

/** Square helipad deck: yellow edge, white circle, big red-cross-free H, 0..1 UVs on top. */
export function padDeck(size, h = 0.2) {
  const tex = canvasTexture(256, 256, (ctx, W) => {
    ctx.fillStyle = '#3d4046';
    ctx.fillRect(0, 0, W, W);
    ctx.strokeStyle = PALETTE.yellow;
    ctx.lineWidth = 14;
    ctx.strokeRect(7, 7, W - 14, W - 14);
    // dashed inner edge
    ctx.fillStyle = '#ffffff';
    for (let i = 0; i < 8; i++) {
      const t = 28 + i * 27;
      ctx.fillRect(t, 24, 14, 5); ctx.fillRect(t, W - 29, 14, 5);
      ctx.fillRect(24, t, 5, 14); ctx.fillRect(W - 29, t, 5, 14);
    }
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 9;
    ctx.beginPath(); ctx.arc(W / 2, W / 2, W * 0.34, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = PALETTE.yellow;
    const s = W * 0.4, x0 = W / 2 - s / 2, y0 = W / 2 - s / 2, bar = s * 0.22;
    ctx.fillRect(x0, y0, bar, s);
    ctx.fillRect(x0 + s - bar, y0, bar, s);
    ctx.fillRect(x0, W / 2 - bar / 2, s, bar);
  }, { key: 'coast-guard-station:pad', repeat: false });
  const geo = new THREE.BoxGeometry(size, h, size).translate(0, h / 2, 0);
  const side = mat(PALETTE.concrete);
  return new THREE.Mesh(geo, [side, side, textured(tex), side, side, side]);
}

/** Orange all-weather lifeboat, bow towards +x, keel at y = 0 (about 3.4 m long). */
export function lifeboat() {
  const hull = [[-1.6, -0.6], [0.75, -0.6], [1.8, 0], [0.75, 0.6], [-1.6, 0.6]];
  const inner = hull.map(([x, z]) => [x * 0.94, z * 0.8]);
  const orange = mat(ORANGE, { roughness: 0.5 });
  const white = mat(PALETTE.white);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = group(
    extrude(inner, 0.32, mat(NAVY)),
    place(extrude(hull, 0.08, white), { y: 0.3 }),
    place(extrude(hull, 0.42, orange, mat(PALETTE.darkGrey)), { y: 0.38 }),
    // wheelhouse with a band of windows and white roof
    place(box(1.5, 0.7, 0.96, orange), { x: -0.35, y: 0.8 }),
    place(box(1.52, 0.24, 0.98, glassM), { x: -0.35, y: 1.12 }),
    place(box(0.06, 0.26, 0.9, glassM), { x: 0.41, y: 1.1 }),
    place(box(1.62, 0.08, 1.04, white), { x: -0.35, y: 1.5 }),
    // mast, radar bar and blue light
    place(box(0.1, 0.55, 0.1, white), { x: -0.2, y: 1.58 }),
    place(box(0.08, 0.06, 0.7, white), { x: -0.2, y: 1.95 }),
    place(box(0.5, 0.06, 0.1, mat(PALETTE.darkGrey)), { x: -0.2, y: 2.12 }),
    place(sphere(0.08, emissive('#5aa8ff', 1.2), 6), { x: -0.2, y: 2.18 }),
    // bow rail and stern guard
    place(box(0.9, 0.05, 0.05, mat(PALETTE.steelLight)), { x: 1.0, y: 1.05, z: 0.38, ry: 28 }),
    place(box(0.9, 0.05, 0.05, mat(PALETTE.steelLight)), { x: 1.0, y: 1.05, z: -0.38, ry: -28 }),
    place(box(0.06, 0.25, 1.1, mat(PALETTE.steelLight)), { x: -1.5, y: 0.8 }),
  );
  // white hull lettering stripes
  for (const z of [0.605, -0.605]) g.add(place(box(1.2, 0.1, 0.01, white), { x: -0.5, y: 0.58, z }));
  return g;
}

/** Red-and-white search & rescue helicopter, nose towards +x, skids at y = 0. */
export function helicopter() {
  const red = mat(PALETTE.red, { roughness: 0.45, metalness: 0.2 });
  const white = mat(PALETTE.white, { roughness: 0.45 });
  const dark = mat(PALETTE.darkGrey);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.15, metalness: 0.6 });
  const g = group(
    // skids + struts
    place(box(2.1, 0.07, 0.09, dark), { x: 0.15, z: 0.5 }),
    place(box(2.1, 0.07, 0.09, dark), { x: 0.15, z: -0.5 }),
    ...[-0.4, 0.6].flatMap((x) => [place(box(0.07, 0.3, 1.0, dark), { x, y: 0.05 })]),
    // cabin
    place(box(1.9, 0.95, 1.05, red), { x: 0.05, y: 0.3 }),
    place(box(1.92, 0.18, 1.07, white), { x: 0.05, y: 0.6 }),
    place(box(0.55, 0.7, 0.95, red), { x: 1.25, y: 0.33 }),
    place(box(0.5, 0.42, 0.97, glassM), { x: 1.27, y: 0.6 }),
    place(box(0.6, 0.32, 1.07, glassM), { x: 0.55, y: 0.78 }),
    // engine hump, rotor mast, tail boom, fin and tail rotor
    place(box(1.1, 0.32, 0.7, white), { x: -0.15, y: 1.25 }),
    place(cylinder(0.07, 0.07, 0.3, dark, 6), { y: 1.55 }),
    place(box(1.9, 0.32, 0.26, red), { x: -1.75, y: 0.8 }),
    place(box(0.5, 0.8, 0.08, white), { x: -2.6, y: 0.8 }),
    place(box(0.3, 0.06, 0.9, red), { x: -2.55, y: 0.85 }),
    place(cylinder(0.32, 0.32, 0.03, dark, 10), { x: -2.6, y: 1.15, z: 0.07, rx: 90 }),
  );
  for (const ry of [20, 110]) g.add(place(box(4.2, 0.04, 0.18, dark), { y: 1.85, ry }));
  g.add(place(cylinder(0.12, 0.12, 0.08, dark, 8), { y: 1.82 }));
  g.add(place(sphere(0.06, emissive(PALETTE.red, 1.2), 6), { x: -0.2, y: 1.42 }));
  return g;
}

/** Windsock on a pole; sock blows towards +x. */
export function windsock(h = 3) {
  const g = group(cylinder(0.04, 0.06, h, metal(PALETTE.steelLight), 6));
  const cols = [ORANGE, PALETTE.white, ORANGE];
  for (let i = 0; i < 3; i++) {
    const r0 = 0.22 - i * 0.05;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(r0 - 0.05, r0, 0.35, 8, 1, true), mat(cols[i], { side: THREE.DoubleSide }));
    seg.rotation.z = -Math.PI / 2 - 0.15;
    seg.position.set(0.2 + i * 0.35, h - 0.2 - i * 0.05, 0);
    g.add(seg);
  }
  return g;
}

/** Lifebuoy on a small post (faces +z). */
export function lifebuoyStand() {
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.08, 6, 12), mat(ORANGE));
  ring.position.y = 0.85;
  return group(box(0.1, 1.2, 0.1, mat(PALETTE.white)), ring);
}

/** Mooring bollard. */
export function bollard() {
  const m = mat(PALETTE.black);
  return group(cylinder(0.12, 0.14, 0.4, m, 8), place(cylinder(0.18, 0.18, 0.06, m, 8), { y: 0.4 }));
}

/** Navigation buoy: red can with a light. */
export function buoy() {
  return group(
    cylinder(0.4, 0.45, 0.3, mat(PALETTE.red), 10),
    place(cone(0.3, 0.9, mat(PALETTE.red), 8), { y: 0.3 }),
    place(box(0.5, 0.12, 0.05, mat(PALETTE.white)), { y: 0.6 }),
    place(sphere(0.1, emissive(PALETTE.red, 1.3), 6), { y: 1.25 }),
  );
}

/** Breakwater rock. */
export function rock(r, seed) {
  const m = new THREE.Mesh(new THREE.DodecahedronGeometry(r, 0), mat(seed % 2 ? PALETTE.stone : PALETTE.stoneDark));
  m.rotation.y = seed * 0.9;
  m.scale.set(1.2, 0.7, 1);
  m.position.y = r * 0.72;
  return group(m);
}

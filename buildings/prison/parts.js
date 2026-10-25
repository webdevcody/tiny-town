import * as THREE from 'three';
import {
  PALETTE, canvasTexture, signTexture, textured, mat, metal, emissive, shade,
  extrudeGeometry, box, cylinder, sphere, place, group, pyramidRoof,
} from '../../src/lib/index.js';

// ---------------------------------------------------------------------------
// textures

/** One cell bay (1.5 m x 1 storey): pale concrete with a narrow barred slit window. */
function cellTexture(wall) {
  return canvasTexture(64, 128, (ctx, W, H) => {
    ctx.fillStyle = wall;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(wall, -0.12);
    ctx.fillRect(0, H - 8, W, 8); // floor band
    ctx.fillStyle = shade(wall, -0.25);
    ctx.fillRect(18, 26, 28, 62); // deep reveal
    ctx.fillStyle = '#232a33';
    ctx.fillRect(21, 29, 22, 56);
    ctx.fillStyle = '#d4d8dc';
    for (const x of [25, 31, 37]) ctx.fillRect(x, 29, 3, 56);
    ctx.fillRect(21, 54, 22, 3);
    ctx.fillStyle = shade(wall, 0.15);
    ctx.fillRect(16, 86, 32, 5); // sill
  }, { key: `prison:cell:${wall}` });
}

/** One 3 m panel of the perimeter wall, full height: seams, top band, rain streaks. */
function wallTexture(color) {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = shade(color, -0.06);
    for (const [x, w] of [[18, 6], [52, 4], [83, 7], [104, 3]]) ctx.fillRect(x, 10, w, H * 0.55);
    ctx.fillStyle = shade(color, -0.22);
    ctx.fillRect(0, 0, W, 9); // coping shadow
    ctx.fillRect(0, 0, 3, H); // panel seam
    ctx.fillRect(W - 2, 0, 2, H);
    ctx.fillStyle = shade(color, -0.12);
    ctx.fillRect(0, H - 14, W, 14); // plinth
  }, { key: `prison:wall:${color}` });
}

// ---------------------------------------------------------------------------
// meshes

/** Box with its base on y=0 whose side faces repeat a texture every `panel` metres (v = 0..1 over height). */
export function panelBox(w, h, d, sideMat, topMat, panel = 3) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const uv = geo.attributes.uv;
  const su = [d, d, 0, 0, w, w];
  for (let f = 0; f < 6; f++) {
    if (f === 2 || f === 3) continue;
    const n = Math.max(1, Math.round(su[f] / panel));
    for (let i = f * 4; i < f * 4 + 4; i++) uv.setX(i, uv.getX(i) * n);
  }
  return new THREE.Mesh(geo, [sideMat, sideMat, topMat, topMat, sideMat, sideMat]);
}

export function perimeterWall(w, h, d, color = '#a3a6a8') {
  const side = textured(wallTexture(color));
  return panelBox(w, h, d, side, mat(shade(color, -0.2)), 3);
}

/** Polygon block of cell storeys, one barred window per 1.5 m bay. */
export function cellBlock(points, floors, { wall = '#ddd6c6', roof = PALETTE.concreteDark, floorHeight = 3 } = {}) {
  const geo = extrudeGeometry(points, floors * floorHeight, {
    wallUV: (len) => [Math.max(1, Math.round(len / 1.5)), floors],
  });
  const pos = geo.attributes.position;
  const uv = geo.attributes.uv;
  for (let i = geo.groups[0].count; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  const r = mat(roof);
  return new THREE.Mesh(geo, [textured(cellTexture(wall)), r, r]);
}

/** Sign with 0..1 UVs on the front (+z) face, so big boards keep full-size text. */
export function bigSign({ text, w, h, d = 0.2, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Coil of razor wire along X, centred on the origin. */
export function razorWire(len, { r = 0.22, spacing = 0.35 } = {}) {
  const m = metal(PALETTE.steelLight, { roughness: 0.35 });
  const geo = new THREE.TorusGeometry(r, 0.025, 3, 10);
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / spacing));
  for (let i = 0; i <= n; i++) {
    const t = new THREE.Mesh(geo, m);
    t.position.set(-len / 2 + (len * i) / n, r, 0);
    t.rotation.y = Math.PI / 2 + 0.35;
    g.add(t);
  }
  return g;
}

/** Wall-top wire: angled brackets with the coil on top. Inside of the prison is -z. */
export function wireTop(len) {
  const g = new THREE.Group();
  const m = metal(PALETTE.steelDark);
  const n = Math.max(2, Math.round(len / 2.5));
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    g.add(place(box(0.06, 0.7, 0.06, m), { x, rx: -25 }));
  }
  g.add(place(razorWire(len), { y: 0.45, z: -0.25 }));
  return g;
}

/** Corner watchtower: concrete shaft, glazed guard cabin, pyramid roof, searchlight. */
export function watchtower({ h = 7.6, light = 45 } = {}) {
  const concrete = mat('#9a9d9f');
  const dark = mat(PALETTE.darkGrey);
  const g = new THREE.Group();
  g.add(box(1.7, h, 1.7, concrete));
  for (let y = 1.8; y < h - 1; y += 1.9) g.add(place(box(1.76, 0.12, 1.76, mat('#888b8d')), { y }));
  g.add(place(box(0.5, 0.9, 0.06, mat(PALETTE.window)), { y: h - 2.4, z: 0.86 }));
  // cabin
  g.add(place(box(2.6, 0.25, 2.6, concrete), { y: h }));
  g.add(place(box(2.4, 0.8, 2.4, mat('#b4b6b8')), { y: h + 0.25 }));
  g.add(place(box(2.3, 1.0, 2.3, mat(PALETTE.glassDark, { roughness: 0.15, metalness: 0.5 })), { y: h + 1.05 }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.14, 1.0, 0.14, dark), { x: sx * 1.13, y: h + 1.05, z: sz * 1.13 }));
  g.add(place(box(2.4, 0.2, 2.4, mat('#b4b6b8')), { y: h + 2.05 }));
  g.add(place(pyramidRoof({ w: 2.4, d: 2.4, h: 1.0, overhang: 0.15, material: mat(PALETTE.roofSlate) }), { y: h + 2.25 }));
  // searchlight on a bracket at the top, aimed into the compound
  const lamp = group(
    place(box(0.1, 0.35, 0.1, dark), {}),
    place(cylinder(0.26, 0.2, 0.45, dark, 10), { y: 0.35, rx: 90, z: 0.22 }),
    place(cylinder(0.24, 0.24, 0.04, emissive('#fff6cc', 1.2), 10), { y: 0.35, rx: 90, z: 0.47 }),
  );
  g.add(place(lamp, { y: h + 3.25, ry: light }));
  return g;
}

/** Tiny person: jumpsuit colour body + head. */
export function person(color, { arms = false } = {}) {
  const m = mat(color);
  const g = group(
    place(box(0.16, 0.75, 0.18, mat(shade(color, -0.2))), { x: -0.11 }),
    place(box(0.16, 0.75, 0.18, mat(shade(color, -0.2))), { x: 0.11 }),
    place(box(0.5, 0.7, 0.3, m), { y: 0.72 }),
    place(sphere(0.17, mat('#d9a77f'), 8), { y: 1.42 }),
  );
  if (arms) {
    g.add(place(box(0.12, 0.6, 0.12, m), { x: -0.31, y: 1.3 }));
    g.add(place(box(0.12, 0.6, 0.12, m), { x: 0.31, y: 1.3 }));
  }
  return g;
}

/** Concrete court with painted basketball half-court lines (w along X, d along Z, hoop at -x end). */
export function courtSurface(w, d) {
  const tex = canvasTexture(256, Math.round((256 * d) / w), (ctx, W, H) => {
    ctx.fillStyle = '#7f8f9a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#b55a3c';
    ctx.fillRect(0, H * 0.33, W * 0.24, H * 0.34); // key
    ctx.strokeStyle = '#f2efe6';
    ctx.lineWidth = 3;
    ctx.strokeRect(4, 4, W - 8, H - 8);
    ctx.strokeRect(4, H * 0.33, W * 0.24, H * 0.34);
    ctx.beginPath();
    ctx.arc(W * 0.24, H / 2, H * 0.17, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(10, H / 2, H * 0.42, -Math.PI / 2, Math.PI / 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.78, 4);
    ctx.lineTo(W * 0.78, H - 4);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.78, H / 2, H * 0.17, 0, Math.PI * 2);
    ctx.stroke();
  }, { key: `prison:court:${w}x${d}`, repeat: false });
  const geo = new THREE.BoxGeometry(w, 0.06, d).translate(0, 0.03, 0);
  const side = mat('#7f8f9a');
  return new THREE.Mesh(geo, [side, side, textured(tex), side, side, side]);
}

/** Basketball hoop on a pole, backboard facing +x. */
export function hoop() {
  const m = metal(PALETTE.steelDark);
  return group(
    cylinder(0.07, 0.07, 2.9, m, 6),
    place(box(0.6, 0.06, 0.06, m), { x: 0.3, y: 2.85 }),
    place(box(0.05, 0.9, 1.2, mat(PALETTE.white)), { x: 0.6, y: 2.5 }),
    place(new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.03, 4, 10).rotateX(Math.PI / 2), mat(PALETTE.orange)), { x: 0.85, y: 2.75 }),
  );
}

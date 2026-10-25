import * as THREE from 'three';
import {
  PALETTE, box, cylinder, extrude, place, group, mat, metal, emissive, textured, signTexture, surface, tree,
} from '../../src/lib/index.js';

// Board sign with 0..1 UVs (lib sign() shrinks text on faces over 1 m). Text faces +z, base at y = 0.
export function boardSign(text, w, h, { bg = PALETTE.white, fg = PALETTE.black, border = null, depth = 0.08, double = false, key } = {}) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.max(16, Math.round((256 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

const deg = (rad) => THREE.MathUtils.radToDeg(rad);

/**
 * One mitre-gate leaf with its balance beam.
 *   hinge, apex: [x, z]; the leaf spans hinge -> apex, the beam sticks out behind the hinge.
 *   bottom/top: y of the leaf; beamLen: how far the beam reaches over the bank.
 *   Walkway + handrail go on the +x (downstream) face.
 */
export function gateLeaf({ hinge, apex, bottom, top, groundY, beamLen = 3, paddle = true }) {
  const g = new THREE.Group();
  const [hx, hz] = hinge;
  const dx = apex[0] - hx, dz = apex[1] - hz;
  const L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L;
  let nx = uz, nz = -ux; // normal towards +x
  if (nx < 0) { nx = -nx; nz = -nz; }
  const ry = deg(Math.atan2(-uz, ux));
  const at = (t, n = 0) => ({ x: hx + ux * t + nx * n, z: hz + uz * t + nz * n });

  const timber = surface('planks', '#3a3029', { size: 1.2 });
  const black = mat('#242220');
  const white = mat(PALETTE.white);
  const h = top - bottom;

  // leaf body, heel & mitre posts, painted white top rail
  g.add(place(box(L, h, 0.26, timber), { ...at(L / 2), y: bottom, ry }));
  g.add(place(box(0.3, h + 0.08, 0.34, black), { ...at(0.12), y: bottom, ry }));
  g.add(place(box(0.24, h + 0.08, 0.32, black), { ...at(L - 0.1), y: bottom, ry }));
  g.add(place(box(L, 0.1, 0.3, white), { ...at(L / 2), y: top, ry }));
  // diagonal brace and horizontal rails on the downstream face
  for (const f of [0.3, 0.62]) g.add(place(box(L - 0.3, 0.12, 0.06, black), { ...at(L / 2, 0.15), y: bottom + h * f, ry }));

  // walkway plank + handrail on the downstream side
  g.add(place(box(L, 0.07, 0.42, mat(PALETTE.woodLight)), { ...at(L / 2, 0.34), y: top - 0.45, ry }));
  for (const t of [0.15, L / 2, L - 0.15]) g.add(place(box(0.06, 0.95, 0.06, white), { ...at(t, 0.52), y: top - 0.45, ry }));
  g.add(place(box(L, 0.06, 0.07, white), { ...at(L / 2, 0.52), y: top + 0.46, ry }));

  // paddle gear (rack + spindle) on the leaf
  if (paddle) {
    const p = at(L * 0.55, 0.05);
    g.add(place(box(0.22, 0.55, 0.22, black), { ...p, y: top + 0.1, ry }));
    g.add(place(cylinder(0.05, 0.05, 0.25, metal(PALETTE.steelLight), 6), { ...p, y: top + 0.65 }));
  }

  // balance beam: heavy black timber over the bank, white-painted end
  const bl = beamLen + 0.4;
  const bc = at(-(bl / 2) + 0.4);
  g.add(place(box(bl, 0.34, 0.34, black), { ...bc, y: top + 0.1, ry }));
  g.add(place(box(0.55, 0.36, 0.36, white), { ...at(-beamLen + 0.27), y: top + 0.09, ry }));
  // brick foot-grips where the keeper pushes the beam
  g.add(place(box(0.9, 0.05, 1.8, surface('brick', PALETTE.brickDark, { size: 1 })), { ...at(-beamLen + 0.35), y: groundY, ry }));
  return g;
}

/** Thin white sheet of water leaking through a gate leaf (on its +x face). */
export function gateLeaks({ hinge, apex, from, to }) {
  const g = new THREE.Group();
  const [hx, hz] = hinge;
  const dx = apex[0] - hx, dz = apex[1] - hz;
  const L = Math.hypot(dx, dz);
  const ux = dx / L, uz = dz / L;
  let nx = uz, nz = -ux;
  if (nx < 0) { nx = -nx; nz = -nz; }
  const ry = deg(Math.atan2(-uz, ux));
  const spray = mat('#f4fbff', { transparent: true, opacity: 0.75, roughness: 0.3 });
  for (const [t, w] of [[0.35, 0.22], [0.75, 0.3], [0.95, 0.16]]) {
    const x = hx + ux * L * t + nx * 0.2, z = hz + uz * L * t + nz * 0.2;
    g.add(place(box(w, to - from, 0.05, spray), { x, z, y: from, ry }));
    g.add(place(box(w + 0.35, 0.03, 0.55, spray), { x: x + nx * 0.2, z: z + nz * 0.2, y: from, ry }));
  }
  return g;
}

/** Painted narrowboat, length along x (bow at +x), base at the waterline-0.3. */
export function narrowboat({ len = 8, w = 1.9, name = 'ROSIE' } = {}) {
  const g = new THREE.Group();
  const L = len / 2, W = w / 2;
  const hull = [[-L, -W + 0.1], [-L + 0.25, -W], [L - 1.3, -W], [L, 0], [L - 1.3, W], [-L + 0.25, W], [-L, W - 0.1]];
  const black = mat('#1c1c1e');
  const green = mat('#1f5c3c');
  const red = mat('#b3312a');
  const cream = mat('#efe2b8');
  const yellow = mat('#e8c246');

  g.add(extrude(hull, 0.75, black));
  // red/cream gunwale bands
  g.add(place(extrude(hull, 0.1, red), { y: 0.75 }));
  g.add(place(extrude(hull.map(([x, z]) => [x * 0.995, z * 1.0]), 0.06, cream), { y: 0.6 }));

  // cabin
  const cx0 = -L + 0.75, cx1 = L - 1.9;
  const cl = cx1 - cx0, cmx = (cx0 + cx1) / 2;
  const cw = w - 0.3;
  g.add(place(box(cl, 0.95, cw, green), { x: cmx, y: 0.85 }));
  g.add(place(box(cl + 0.12, 0.08, cw + 0.14, yellow), { x: cmx, y: 1.68 }));
  g.add(place(box(cl + 0.1, 0.1, cw + 0.12, red), { x: cmx, y: 1.8 }));
  // cabin roof pattern: cream centre stripe
  g.add(place(box(cl - 0.4, 0.02, 0.5, cream), { x: cmx, y: 1.9 }));
  // portholes / windows both sides
  const glassM = mat('#f6dc7a', { emissive: '#7a5a10', emissiveIntensity: 0.3 });
  for (let i = 0; i < 5; i++) {
    const x = cx0 + 1.3 + i * ((cl - 1.6) / 4);
    for (const s of [1, -1]) g.add(place(box(0.42, 0.3, 0.04, glassM), { x, y: 1.22, z: s * (cw / 2 + 0.01) }));
  }
  // name panel near the stern (both sides)
  const nameBoard = boardSign(name, 1.4, 0.5, { bg: '#b3312a', fg: '#f3d36a', depth: cw + 0.04, double: true, key: 'canal-lock:boat' });
  g.add(place(nameBoard, { x: cx0 + 0.65, y: 1.12 }));
  // stern doors
  g.add(place(box(0.04, 0.75, 0.9, red), { x: cx0 - 0.01, y: 0.88 }));

  // front well deck: cratch board + sheeted cover
  g.add(place(box(0.08, 0.9, 1.0, cream), { x: L - 1.45, y: 0.85 }));
  g.add(place(box(0.95, 0.12, w - 0.2, green), { x: cx1 + 0.5, y: 1.2, rz: -18 }));
  g.add(place(cylinder(0.12, 0.12, 0.08, emissive('#fff4c0', 0.6), 8), { x: L - 0.6, y: 0.85 }));

  // roof clutter: stove chimney with brass bands, flowerpots, water can, life ring
  const brass = metal('#c99a3a', { roughness: 0.35 });
  g.add(place(cylinder(0.1, 0.1, 0.75, black, 8), { x: cx0 + 1.1, y: 1.9, z: -0.2 }));
  g.add(place(cylinder(0.12, 0.12, 0.06, brass, 8), { x: cx0 + 1.1, y: 2.25, z: -0.2 }));
  g.add(place(cylinder(0.12, 0.12, 0.06, brass, 8), { x: cx0 + 1.1, y: 2.6, z: -0.2 }));
  for (const [x, seed, c] of [[cmx - 0.6, 3, '#d8458a'], [cmx + 0.2, 4, '#f2b632'], [cmx + 1.0, 5, '#e05c3a']]) {
    g.add(place(box(0.32, 0.25, 0.32, mat(PALETTE.terracotta)), { x, y: 1.9, z: 0.25 }));
    g.add(place(tree({ kind: 'bush', h: 0.45, seed, color: c }), { x, y: 2.12, z: 0.25 }));
  }
  g.add(place(box(0.3, 0.3, 0.2, mat(PALETTE.red)), { x: cx1 - 0.4, y: 1.9, z: -0.35 }));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.08, 6, 12), mat(PALETTE.orange));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(cx1 - 1.2, 1.97, -0.35);
  g.add(ring);
  // gangplank
  g.add(place(box(2.2, 0.05, 0.3, mat(PALETTE.wood)), { x: cmx - 0.4, y: 1.92, z: 0.6 }));

  // stern: tiller, rudder post, rear deck
  g.add(place(box(0.7, 0.05, w - 0.3, mat(PALETTE.woodDark)), { x: -L + 0.38, y: 0.75 }));
  g.add(place(cylinder(0.05, 0.05, 0.7, brass, 6), { x: -L + 0.12, y: 0.75 }));
  const tillerBar = box(1.1, 0.07, 0.07, mat('#d6b46a'));
  g.add(place(tillerBar, { x: -L + 0.55, y: 1.42, rz: 8 }));
  g.add(place(cylinder(0.06, 0.06, 0.18, red, 6), { x: -L + 1.08, y: 1.48 }));
  return g;
}

/** Simple washing line with a few clothes, along x. */
export function washingLine(len = 3) {
  const post = mat(PALETTE.woodDark);
  const g = group(
    place(box(0.1, 1.8, 0.1, post), { x: -len / 2 }),
    place(box(0.1, 1.8, 0.1, post), { x: len / 2 }),
    place(box(len, 0.02, 0.02, mat(PALETTE.lightGrey)), { y: 1.75 })
  );
  const cols = [PALETTE.white, '#5a8fd6', '#e05c5c', PALETTE.yellow, PALETTE.white];
  for (let i = 0; i < cols.length; i++) {
    const w = i % 2 ? 0.45 : 0.6;
    g.add(place(box(w, 0.55 + (i % 3) * 0.1, 0.03, mat(cols[i])), { x: -len / 2 + 0.45 + i * ((len - 0.9) / (cols.length - 1)), y: 1.75 - 0.6 - (i % 3) * 0.1 }));
  }
  return g;
}

/** Black canal bollard with a white top. */
export function bollard() {
  return group(
    cylinder(0.13, 0.15, 0.45, mat('#242220'), 8),
    place(cylinder(0.17, 0.13, 0.08, mat(PALETTE.white), 8), { y: 0.45 })
  );
}

/** Red/white life ring on a post. */
export function lifebuoyPost() {
  const g = group(place(box(0.12, 1.4, 0.12, mat(PALETTE.woodDark)), {}));
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.09, 6, 12), mat(PALETTE.red));
  ring.position.set(0, 1.05, 0.12);
  g.add(ring);
  for (const a of [0, 90, 180, 270]) {
    const r = THREE.MathUtils.degToRad(a + 45);
    g.add(place(box(0.14, 0.14, 0.2, mat(PALETTE.white)), { x: Math.cos(r) * 0.3, y: 1.05 + Math.sin(r) * 0.3 - 0.07, z: 0.12 }));
  }
  return g;
}

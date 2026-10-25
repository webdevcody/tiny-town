import * as THREE from 'three';
import {
  PALETTE, box, cylinder, sphere, extrude, beam, place, group, mat, metal, emissive,
  textured, signTexture, canvasTexture,
} from '../../src/lib/index.js';

/**
 * Sign board with 0..1 UVs on the front (+z) face, so the text fills the whole
 * face at any size (the lib sign() uses metre UVs and shrinks text over 1 m).
 */
export function bigSign({ text, w, h, depth = 0.15, bg = PALETTE.navy, fg = '#ffffff', border = null }) {
  const th = 64;
  const tw = Math.min(1024, Math.round((th * w) / h / 16) * 16);
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/** Label texture for a tin can: coloured band, white stripe, a little fish. */
function canLabel(color, key) {
  return canvasTexture(128, 64, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#f4f0e4';
    ctx.fillRect(0, H * 0.36, W, H * 0.28);
    ctx.fillStyle = '#3a6fa8';
    for (let i = 0; i < 4; i++) {
      const cx = W * (0.125 + i * 0.25), cy = H / 2;
      ctx.beginPath();
      ctx.ellipse(cx, cy, W * 0.06, H * 0.09, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.moveTo(cx + W * 0.05, cy);
      ctx.lineTo(cx + W * 0.1, cy - H * 0.1);
      ctx.lineTo(cx + W * 0.1, cy + H * 0.1);
      ctx.fill();
    }
  }, { key: `fish-cannery:label:${key}`, repeat: false });
}

/** Cylinder whose side texture wraps exactly once (0..1 UVs), base at y = 0. */
function labelledCylinder(r, h, sideMat, capMat, segments = 12) {
  const geo = new THREE.CylinderGeometry(r, r, h, segments).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [sideMat, capMat, capMat]);
}

/** Giant tin can (e.g. a painted water tank), base at y = 0. */
export function giantCan({ r = 1.2, h = 2.2, color = PALETTE.red, key = 'giant' } = {}) {
  const tin = metal(PALETTE.chrome, { roughness: 0.3 });
  return group(
    cylinder(r * 1.03, r * 1.03, 0.12, tin, 20),
    place(labelledCylinder(r, h - 0.24, textured(canLabel(color, key)), tin, 20), { y: 0.12 }),
    place(cylinder(r * 1.03, r * 1.03, 0.12, tin, 20), { y: h - 0.12 }),
    place(cylinder(r * 0.25, r * 0.25, 0.08, metal(PALETTE.steel), 8), { x: r * 0.5, y: h }),
  );
}

/** Wooden pallet with a pyramid of tin cans (3 layers). Footprint ~1.2 x 1.0. */
export function canPallet({ color = PALETTE.red, key = 'red', layers = 3 } = {}) {
  const g = group(place(box(1.2, 0.14, 1.0, mat(PALETTE.woodLight)), {}));
  const side = textured(canLabel(color, key));
  const tin = metal(PALETTE.chrome, { roughness: 0.35 });
  const cr = 0.14, ch = 0.26;
  let y = 0.14;
  for (let l = 0; l < layers; l++) {
    const nx = 4 - l, nz = 3 - l;
    for (let i = 0; i < nx; i++) for (let k = 0; k < nz; k++) {
      g.add(place(labelledCylinder(cr, ch, side, tin, 8), { x: (i - (nx - 1) / 2) * 0.29, y, z: (k - (nz - 1) / 2) * 0.29 }));
    }
    y += ch;
  }
  return g;
}

/** Stack of plastic fish crates. */
export function crateStack({ color = PALETTE.blue, n = 3 } = {}) {
  const m = mat(color, { roughness: 0.6 });
  const g = group();
  for (let i = 0; i < n; i++) g.add(place(box(0.8, 0.3, 0.55, m), { y: i * 0.32 }));
  g.add(place(box(0.7, 0.04, 0.45, mat('#c9d6dc', { roughness: 0.3 })), { y: n * 0.32 - 0.04 }));
  return g;
}

/** Bollard (mooring post). */
export function bollard() {
  const m = mat(PALETTE.black, { roughness: 0.5 });
  return group(cylinder(0.14, 0.16, 0.45, m, 8), place(cylinder(0.2, 0.2, 0.08, m, 8), { y: 0.45 }));
}

/** Seagull: white body, grey wings in a shallow V, wingspan ~1.1 m. flying=false folds the wings. */
export function gull({ flying = true, flap = 18 } = {}) {
  const white = mat('#f6f6f2', { roughness: 0.6 });
  const wing = mat('#b9bec4', { roughness: 0.6 });
  const tip = mat(PALETTE.black);
  const beak = mat(PALETTE.yellow);
  const g = group();
  const body = sphere(0.14, white, 8);
  body.scale.set(2.2, 1, 1);
  g.add(body);
  g.add(place(sphere(0.09, white, 8), { x: 0.28, y: 0.12 }));
  g.add(place(box(0.12, 0.04, 0.04, beak), { x: 0.42, y: 0.18 }));
  g.add(place(box(0.16, 0.03, 0.14, wing), { x: -0.36, y: 0.12 }));
  if (flying) {
    for (const s of [-1, 1]) {
      const w = group(
        place(box(0.26, 0.03, 0.42, wing), { z: s * 0.21 }),
        place(box(0.22, 0.03, 0.14, tip), { x: -0.02, z: s * 0.49 }),
      );
      w.position.set(0.02, 0.15, 0);
      w.rotation.x = THREE.MathUtils.degToRad(s * -flap);
      g.add(w);
    }
  } else {
    for (const s of [-1, 1]) g.add(place(box(0.34, 0.1, 0.04, wing), { x: -0.06, y: 0.12, z: s * 0.13 }));
    g.add(place(box(0.03, 0.12, 0.03, beak), { x: 0, y: -0.1 }));
  }
  return g;
}

/** Car tyre fender, hangs on a vertical face. */
function tyre() {
  const geo = new THREE.TorusGeometry(0.22, 0.09, 6, 10);
  return new THREE.Mesh(geo, mat(PALETTE.black, { roughness: 0.9 }));
}

/**
 * Fishing trawler, bow towards +x, length L along X, beam B. Base at y = 0 (waterline).
 * Wheelhouse forward, working deck aft with a hold hatch, stern A-frame gantry,
 * net drum, a mast with outrigger booms, buoys and tyre fenders on the port (+z) side.
 */
export function trawler({ L = 9, B = 2.8, hull = PALETTE.navy, trim = PALETTE.white, gantryColor = PALETTE.orange, netColor = PALETTE.green, boomSpread = 1.6, seed = 0 } = {}) {
  const g = group();
  const hb = B / 2;
  const plan = (k) => [[-L / 2 + 0.1, -hb * k], [L * 0.15, -hb * k], [L * 0.38, -hb * 0.6 * k], [L / 2, 0], [L * 0.38, hb * 0.6 * k], [L * 0.15, hb * k], [-L / 2 + 0.1, hb * k], [-L / 2, 0]];
  const deckM = mat(PALETTE.woodLight);
  // hull: red boot-top at the waterline, coloured topsides, white rubbing strake
  g.add(extrude(plan(0.9), 0.3, mat(PALETTE.roofRed)));
  g.add(place(extrude(plan(1), 0.95, mat(hull, { roughness: 0.5 }), deckM), { y: 0.3 }));
  g.add(place(extrude(plan(1.03), 0.14, mat(trim)), { y: 1.18 }));
  // bulwark round the deck
  const bw = (k) => [[-L / 2 + 0.15, -hb * k], [L * 0.15, -hb * k], [L * 0.38, -hb * 0.6 * k], [L / 2 - 0.15, 0]];
  for (const s of [-1, 1]) {
    const pts = bw(0.94).map(([x, z]) => [x, z * s]);
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, z1] = pts[i], [x2, z2] = pts[i + 1];
      g.add(beam([x1, 1.5, z1], [x2, 1.5, z2], 0.12, mat(hull)));
    }
  }
  // raised forecastle
  const fc = [[L * 0.15, -hb * 0.95], [L * 0.38, -hb * 0.58], [L / 2 - 0.05, 0], [L * 0.38, hb * 0.58], [L * 0.15, hb * 0.95]];
  g.add(place(extrude(fc, 0.45, mat(hull, { roughness: 0.5 }), deckM), { y: 1.25 }));
  // hull number on both bows
  const numTex = signTexture(`TT ${12 + seed * 31}`, { bg: hull, fg: '#ffffff', width: 128, height: 40 });
  for (const s of [-1, 1]) {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.44), textured(numTex));
    n.position.set(-L * 0.02, 0.82, s * (hb + 0.01));
    if (s < 0) n.rotation.y = Math.PI;
    g.add(n);
  }

  // wheelhouse
  const wx = L * 0.08, ww = 2.1, wd = B * 0.68, wh = 1.7;
  const white = mat(PALETTE.white);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 });
  g.add(place(box(ww, wh, wd, white), { x: wx, y: 1.25 }));
  g.add(place(box(0.08, 0.55, wd - 0.3, glassM), { x: wx + ww / 2, y: 1.25 + 0.95 }));
  for (const s of [-1, 1]) {
    g.add(place(box(ww - 0.5, 0.5, 0.08, glassM), { x: wx + 0.1, y: 1.25 + 0.95, z: s * wd / 2 }));
    g.add(place(box(0.6, 1.1, 0.06, mat(PALETTE.steelDark)), { x: wx - 0.55, y: 1.25, z: s * wd / 2 }));
  }
  g.add(place(box(ww + 0.35, 0.14, wd + 0.25, mat(trim === PALETTE.white ? PALETTE.lightGrey : trim)), { x: wx + 0.1, y: 1.25 + wh }));
  // mast, radar, lights
  const mastTop = 1.25 + wh + 3.2;
  const mastM = metal(PALETTE.steelLight);
  g.add(place(cylinder(0.07, 0.1, mastTop - 1.25 - wh, mastM, 6), { x: wx - 0.3, y: 1.25 + wh }));
  g.add(place(box(0.9, 0.08, 0.12, mat(PALETTE.darkGrey)), { x: wx + 0.2, y: 1.25 + wh + 0.6 }));
  g.add(place(box(0.06, 0.06, 1.2, mastM), { x: wx - 0.3, y: mastTop - 0.9 }));
  g.add(place(sphere(0.08, emissive('#fff2b0', 0.8), 6), { x: wx - 0.3, y: mastTop }));
  // outrigger booms (raised), from the mast foot outwards
  for (const s of [-1, 1]) {
    g.add(beam([wx - 0.4, 1.5 + wh, s * 0.3], [wx - 1.2, mastTop - 0.1, s * boomSpread], 0.1, mastM));
    g.add(beam([wx - 0.3, mastTop - 0.5, 0], [wx - 1.2, mastTop - 0.1, s * boomSpread], 0.03, mat(PALETTE.darkGrey)));
  }

  // working deck: fish hold hatch, net drum, stern gantry
  g.add(place(box(1.4, 0.3, 1.2, mat(PALETTE.steelDark)), { x: -L * 0.12, y: 1.25 }));
  g.add(place(box(1.1, 0.05, 0.9, mat(PALETTE.black)), { x: -L * 0.12, y: 1.55 }));
  const gx = -L / 2 + 0.55, gy = 1.25;
  const gM = mat(gantryColor, { roughness: 0.5 });
  const drumGeo = new THREE.CylinderGeometry(0.5, 0.5, B * 0.6, 12).rotateX(Math.PI / 2);
  const drum = new THREE.Mesh(drumGeo, mat(netColor, { roughness: 0.95 }));
  drum.position.set(gx + 1.3, gy + 0.75, 0);
  g.add(drum);
  for (const s of [-1, 1]) {
    g.add(place(box(0.25, 0.8, 0.12, gM), { x: gx + 1.3, y: gy, z: s * B * 0.32 }));
    g.add(beam([gx, gy, s * hb * 0.8], [gx + 0.35, gy + 3.0, s * hb * 0.7], 0.18, gM));
  }
  g.add(place(box(0.25, 0.25, B * 1.45, gM), { x: gx + 0.35, y: gy + 2.95 }));
  g.add(place(box(0.2, 0.6, 0.2, mat(PALETTE.darkGrey)), { x: gx + 0.35, y: gy + 2.35 }));
  // trawl doors hanging on the gantry legs
  for (const s of [-1, 1]) g.add(place(box(0.9, 0.6, 0.1, mat(PALETTE.rust)), { x: gx + 0.3, y: gy + 0.2, z: s * (hb + 0.08) }));
  // orange buoys and tyre fenders
  for (const [bx, bz] of [[-L * 0.3, -hb * 0.6], [-L * 0.25, hb * 0.6], [L * 0.32, 0.25]]) {
    g.add(place(sphere(0.22, mat(PALETTE.orange, { roughness: 0.5 }), 8), { x: bx, y: bx > 0 ? 1.7 : 1.25, z: bz }));
  }
  for (const fx of [-L * 0.3, -L * 0.05, L * 0.2]) {
    const t = tyre();
    t.position.set(fx, 0.9, hb * (fx > L * 0.15 ? 0.95 : 1) + 0.08);
    g.add(t);
  }
  return g;
}

/**
 * Inclined belt conveyor from `from` (low end) to `to` (high end), both [x, y, z]
 * at belt level, with side rails, rollers, a support leg, and a few fish on the belt.
 */
export function conveyor(from, to, { width = 0.8, legs = [], cargo = 'fish' } = {}) {
  const g = group();
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const dir = b.clone().sub(a);
  const len = dir.length();
  const frame = group();
  const belt = mat('#2b2b2e', { roughness: 0.9 });
  const rail = mat(PALETTE.yellow, { roughness: 0.5 });
  frame.add(place(box(len, 0.12, width, belt), { x: len / 2, y: -0.12 }));
  for (const s of [-1, 1]) frame.add(place(box(len, 0.28, 0.08, rail), { x: len / 2, y: -0.22, z: s * (width / 2 + 0.04) }));
  const fish = mat('#b8c4cc', { roughness: 0.3, metalness: 0.4 });
  const cans = metal(PALETTE.chrome, { roughness: 0.3 });
  for (let t = 0.6; t < len - 0.4; t += 0.7) {
    if (cargo === 'fish') {
      frame.add(place(box(0.42, 0.1, 0.14, fish), { x: t, z: ((t * 7) % 3 - 1) * 0.18, ry: (t * 53) % 40 - 20 }));
    } else {
      frame.add(place(cylinder(0.12, 0.12, 0.2, cans, 8), { x: t, z: -0.15 }));
      frame.add(place(cylinder(0.12, 0.12, 0.2, cans, 8), { x: t + 0.3, z: 0.15 }));
    }
  }
  frame.position.copy(a);
  frame.rotation.order = 'YZX';
  frame.rotation.y = Math.atan2(-dir.z, dir.x);
  frame.rotation.z = Math.atan2(dir.y, Math.hypot(dir.x, dir.z));
  g.add(frame);
  const legM = metal(PALETTE.steelDark);
  for (const [x, y0, z] of legs) {
    const t = Math.hypot(x - a.x, z - a.z) / Math.hypot(dir.x, dir.z);
    const top = a.y + dir.y * t - 0.3;
    for (const s of [-1, 1]) {
      const off = new THREE.Vector3(-dir.z, 0, dir.x).normalize().multiplyScalar(s * width * 0.45);
      g.add(place(box(0.1, top - y0, 0.1, legM), { x: x + off.x, y: y0, z: z + off.z }));
    }
  }
  return g;
}

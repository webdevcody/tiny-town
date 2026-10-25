import * as THREE from 'three';
import {
  PALETTE, place, box, cylinder, cone, beam, mat, metal, textured,
  canvasTexture, signTexture, rng,
} from '../../src/lib/index.js';

/**
 * Sign with 0..1 UVs on the front face, so the text fills any size
 * (the lib's sign() uses metre UVs and shrinks text on faces over 1 m).
 * Text faces +Z, base at y = 0.
 */
export function bigSign({ text, w, h, bg = PALETTE.navy, fg = '#ffffff', depth = 0.12, border = null }) {
  const tw = 512;
  const tex = signTexture(text, { bg, fg, width: tw, height: Math.max(32, Math.round((tw * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

/** Dark net water with fish silhouettes, drawn on a disc (0..1 UVs). */
function penWaterTexture(seed) {
  return canvasTexture(128, 128, (ctx, W, H) => {
    const r = rng(seed);
    const grd = ctx.createRadialGradient(W / 2, H / 2, 4, W / 2, H / 2, W / 2);
    grd.addColorStop(0, '#1d4f5c');
    grd.addColorStop(1, '#2b6f78');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);
    // net mesh
    ctx.strokeStyle = 'rgba(20,30,30,0.35)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= W; i += 8) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(W, i); ctx.stroke();
    }
    // fish
    for (let i = 0; i < 26; i++) {
      const a = r() * Math.PI * 2, d = Math.sqrt(r()) * W * 0.4;
      const x = W / 2 + Math.cos(a) * d, y = H / 2 + Math.sin(a) * d;
      const rot = a + Math.PI / 2 + r.range(-0.4, 0.4);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(rot);
      ctx.fillStyle = r.pick(['#c9d4d8', '#e0b8a4', '#aebdc4']);
      ctx.beginPath(); ctx.ellipse(0, 0, 5, 2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(-4, 0); ctx.lineTo(-8, -2.5); ctx.lineTo(-8, 2.5); ctx.fill();
      ctx.restore();
    }
    // feeding splash ripples
    ctx.strokeStyle = 'rgba(255,255,255,0.7)';
    ctx.lineWidth = 2;
    for (const rr of [6, 12, 18]) {
      ctx.beginPath(); ctx.arc(W / 2 + 6, H / 2 - 4, rr, 0, Math.PI * 2); ctx.stroke();
    }
  }, { key: `fish-farm:pen-water:${seed}`, repeat: false });
}

function ring(radius, tube, material, radial = 6, seg = 32) {
  const g = new THREE.TorusGeometry(radius, tube, radial, seg);
  g.rotateX(Math.PI / 2);
  return new THREE.Mesh(g, material);
}

/**
 * Round floating fish pen ("sea cage"): double black HDPE float ring,
 * handrail on stanchions, dark netted water full of fish and a conical
 * bird net on a centre pole. Origin = centre at the water surface.
 */
export function fishPen({ radius = 2, seed = 1, netH = 2.2 } = {}) {
  const hdpe = mat('#26282b', { roughness: 0.6 });
  const rail = metal(PALETTE.steelLight);
  const g = new THREE.Group();

  const disc = new THREE.Mesh(new THREE.CircleGeometry(radius - 0.12, 32).rotateX(-Math.PI / 2), textured(penWaterTexture(seed)));
  disc.position.y = 0.03;
  g.add(disc);

  g.add(place(ring(radius, 0.14, hdpe), { y: 0.1 }));
  g.add(place(ring(radius + 0.32, 0.14, hdpe), { y: 0.1 }));
  // grating walk between the two float pipes
  const walk = new THREE.Mesh(new THREE.RingGeometry(radius, radius + 0.32, 32, 1).rotateX(-Math.PI / 2), mat(PALETTE.steel, { side: THREE.DoubleSide }));
  walk.position.y = 0.22;
  g.add(walk);
  // handrail
  const rh = 0.95;
  g.add(place(ring(radius - 0.02, 0.04, rail, 4), { y: rh }));
  const posts = 12;
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    g.add(place(box(0.07, rh, 0.07, rail), { x: Math.cos(a) * (radius - 0.02), y: 0.2, z: Math.sin(a) * (radius - 0.02) }));
  }
  // bird net: centre pole + translucent cone + ribs
  const top = rh + netH;
  g.add(cylinder(0.05, 0.07, top + 0.25, rail, 6));
  const net = new THREE.Mesh(
    new THREE.ConeGeometry(radius - 0.02, netH, 16, 1, true).translate(0, rh + netH / 2, 0),
    mat('#3a4146', { transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })
  );
  g.add(net);
  const ribM = mat('#3a4146');
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
    g.add(beam([Math.cos(a) * (radius - 0.02), rh, Math.sin(a) * (radius - 0.02)], [0, top, 0], 0.035, ribM));
  }
  // orange marker buoys on the outer ring
  const buoy = mat(PALETTE.orange);
  const r = rng(seed + 10);
  for (let i = 0; i < 3; i++) {
    const a = r() * Math.PI * 2;
    const s = new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), buoy);
    s.position.set(Math.cos(a) * (radius + 0.55), 0.08, Math.sin(a) * (radius + 0.55));
    g.add(s);
  }
  return g;
}

/**
 * Feed barge: boxy steel hull, white control house with windows, two feed
 * hoppers on the roof, a small loading crane and a radio mast. Long axis Z.
 * Origin = centre at the waterline.
 */
export function feedBarge({ w = 2.4, l = 5.6 } = {}) {
  const hull = mat('#2f5f8f', { roughness: 0.6 });
  const deck = mat(PALETTE.darkGrey);
  const white = mat(PALETTE.white);
  const yellow = mat(PALETTE.yellow);
  const winM = mat(PALETTE.window, { roughness: 0.2, metalness: 0.4 });
  const g = new THREE.Group();
  g.add(place(box(w, 0.75, l, [hull, hull, deck, hull, hull, hull]), { y: -0.15 }));
  g.add(place(box(w + 0.04, 0.12, l + 0.04, mat(PALETTE.red)), { y: -0.1 })); // boot-top
  const dy = 0.6;
  // control house
  const hw = w - 0.5, hl = l * 0.62, hh = 1.6;
  const hz = -l * 0.12;
  g.add(place(box(hw, hh, hl, white), { y: dy, z: hz }));
  g.add(place(box(hw + 0.2, 0.1, hl + 0.2, mat(PALETTE.steelDark)), { y: dy + hh, z: hz }));
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      g.add(place(box(0.04, 0.45, 0.5, winM), { x: sx * (hw / 2 + 0.01), y: dy + 0.85, z: hz - hl / 2 + 0.5 + i * ((hl - 1) / 3) }));
    }
  }
  g.add(place(box(hw - 0.4, 0.45, 0.04, winM), { y: dy + 0.85, z: hz + hl / 2 + 0.01 }));
  g.add(place(box(0.7, 1.3, 0.04, mat(PALETTE.steelDark)), { x: hw / 2 - 0.5, y: dy, z: hz + hl / 2 + 0.01 }));
  // feed hoppers on the roof
  const ry = dy + hh + 0.1;
  for (const z of [hz - hl * 0.25, hz + hl * 0.22]) {
    g.add(place(cylinder(0.65, 0.65, 0.9, yellow, 14), { y: ry + 0.3, z }));
    g.add(place(cone(0.65, 0.35, yellow, 14), { y: ry + 1.2, z }));
    g.add(place(cone(0.65, -0.3, mat(PALETTE.steel), 14), { y: ry + 0.3, z }));
    for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.08, 0.32, 0.08, metal(PALETTE.steelDark)), { x: sx * 0.4, y: ry, z: z + sz * 0.4 }));
  }
  // rooftop rail
  g.add(place(box(hw + 0.2, 0.05, 0.05, metal(PALETTE.steelLight)), { y: ry + 0.5, z: hz + hl / 2 + 0.05 }));
  // crane on the front deck
  const cz = l / 2 - 0.7;
  const craneM = mat(PALETTE.orange);
  g.add(place(cylinder(0.18, 0.22, 1.8, craneM, 8), { x: -w / 2 + 0.5, y: dy, z: cz }));
  g.add(beam([-w / 2 + 0.5, dy + 1.7, cz], [w / 2 - 0.4, dy + 2.4, cz - 0.6], 0.14, craneM));
  g.add(beam([w / 2 - 0.4, dy + 2.4, cz - 0.6], [w / 2 - 0.4, dy + 1.4, cz - 0.6], 0.025, mat(PALETTE.black)));
  g.add(place(box(0.25, 0.2, 0.25, mat(PALETTE.black)), { x: w / 2 - 0.4, y: dy + 1.2, z: cz - 0.6 }));
  // feed bags on deck
  for (let i = 0; i < 3; i++) g.add(place(box(0.5, 0.4, 0.5, mat(PALETTE.cream)), { x: -w / 2 + 0.6 + i * 0.55, y: dy, z: l / 2 - 0.3 }));
  // mast
  g.add(place(cylinder(0.04, 0.05, 2.2, metal(PALETTE.steelLight), 6), { x: -hw / 2 + 0.3, y: ry, z: hz - hl / 2 + 0.3 }));
  g.add(place(box(0.6, 0.05, 0.05, metal(PALETTE.steelLight)), { x: -hw / 2 + 0.3, y: ry + 1.7, z: hz - hl / 2 + 0.3 }));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.08, 6, 4), mat(PALETTE.red, { emissive: PALETTE.red, emissiveIntensity: 0.8 })), { x: -hw / 2 + 0.3, y: ry + 2.2, z: hz - hl / 2 + 0.3 }));
  // fenders
  for (const z of [-l / 3, 0, l / 3]) g.add(place(cylinder(0.15, 0.15, 0.5, mat(PALETTE.black), 8), { x: -w / 2 - 0.12, y: -0.1, z }));
  return g;
}

/** Stack of blue fish bins (tubs), base at y = 0. */
export function fishBins({ n = 3, color = PALETTE.blue } = {}) {
  const m = mat(color, { roughness: 0.5 });
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) g.add(place(box(1.1, 0.5, 0.8, m), { y: i * 0.52 }));
  g.add(place(box(1.0, 0.04, 0.7, mat('#d8eef4')), { y: n * 0.52 - 0.04 }));
  return g;
}


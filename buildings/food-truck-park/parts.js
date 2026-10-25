import * as THREE from 'three';
import {
  PALETTE, box, place, group, cylinder, cone, sphere, beam, awning, barrelRoof, shedRoof,
  mat, metal, emissive, textured, surface, canvasTexture, signTexture, shade,
} from '../../src/lib/index.js';

// Sign board with text on the +z face (and -z when double). Built on a plain
// BoxGeometry so each face has 0..1 UVs: the lib sign() stretches its texture
// in metres, which shrinks text on boards wider than 1 m.
export function board(text, { w, h, depth = 0.08, bg = PALETTE.navy, fg = '#ffffff', border = null, double = true, glow = 0.2 }) {
  const tw = 512;
  const th = Math.max(32, Math.round((tw * h) / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: glow, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, double ? face : side]);
}

// Painted livery for the street-side (-z) flank of a truck: colour, accent
// stripes and a white roundel with the truck's name.
function liveryTexture(name, color, accent, fg) {
  return canvasTexture(512, 360, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = accent;
    ctx.fillRect(0, H * 0.78, W, H * 0.1);
    ctx.fillStyle = shade(color, -0.25);
    ctx.fillRect(0, H * 0.9, W, H * 0.1);
    // name panel
    const px = W * 0.1, py = H * 0.2, pw = W * 0.8, ph = H * 0.42, r = ph * 0.3;
    ctx.fillStyle = '#fbf6ea';
    ctx.beginPath();
    ctx.moveTo(px + r, py);
    ctx.arcTo(px + pw, py, px + pw, py + ph, r);
    ctx.arcTo(px + pw, py + ph, px, py + ph, r);
    ctx.arcTo(px, py + ph, px, py, r);
    ctx.arcTo(px, py, px + pw, py, r);
    ctx.fill();
    ctx.strokeStyle = accent;
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.fillStyle = fg;
    let size = ph * 0.62;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(name).width > pw * 0.86 && size > 8) {
      size -= 2;
      ctx.font = `bold ${size}px sans-serif`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(name, W / 2, py + ph / 2 + 4);
  }, { key: `food-truck-park:livery:${name}:${color}`, repeat: false });
}

function wheel(r, wdt) {
  const geo = new THREE.CylinderGeometry(r, r, wdt, 12);
  geo.rotateX(Math.PI / 2);
  return group(
    new THREE.Mesh(geo, mat(PALETTE.black)),
    place(new THREE.Mesh(new THREE.CylinderGeometry(r * 0.5, r * 0.5, wdt + 0.02, 8).rotateX(Math.PI / 2), mat(PALETTE.lightGrey)), {})
  );
}

// Serving hatch, counter and propped-open awning on the +z flank at x = cx.
function servingSide({ cx, z, y, w, accent }) {
  const g = new THREE.Group();
  g.add(place(box(w + 0.14, 0.82, 0.03, metal(PALETTE.steelLight)), { x: cx, y: y - 0.06, z: z + 0.015 }));
  g.add(place(box(w, 0.7, 0.04, emissive('#ffcf7a', 0.55)), { x: cx, y, z: z + 0.03 }));
  // menu panel inside the window
  g.add(place(box(w * 0.4, 0.3, 0.02, mat(PALETTE.black)), { x: cx - w * 0.22, y: y + 0.3, z: z + 0.06 }));
  g.add(place(box(w + 0.2, 0.06, 0.34, metal(PALETTE.steelLight)), { x: cx, y: y - 0.06, z: z + 0.17 }));
  g.add(place(awning({ w: w + 0.3, depth: 0.75, drop: 0.22, color: accent, color2: '#ffffff' }), { x: cx, y: y + 0.95, z }));
  return g;
}

/**
 * Food truck, length along X (~3.4 m), serving hatch on the +z side.
 * kind 'van': step van with a cab at +x. kind 'trailer': towed concession
 * trailer with a rounded roof and a tow hitch at +x.
 */
export function foodTruck({ kind = 'van', name, color, accent, signBg, signFg, liveryFg, awningColor, prop = null }) {
  const g = new THREE.Group();
  const W = 1.6;
  const body = mat(color, { roughness: 0.5, metalness: 0.15 });
  const dark = mat(PALETTE.darkGrey);
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const livery = textured(liveryTexture(name, color, accent, liveryFg ?? signFg), { roughness: 0.5 });

  if (kind === 'van') {
    for (const x of [-1.0, 1.15]) for (const s of [-1, 1]) g.add(place(wheel(0.3, 0.22), { x, y: 0.3, z: s * 0.7 }));
    g.add(place(box(3.2, 0.2, 1.4, dark), { y: 0.25 }));
    // box body
    const bodyGeo = new THREE.BoxGeometry(2.5, 1.8, W).translate(0, 0.9, 0);
    g.add(place(new THREE.Mesh(bodyGeo, [body, body, mat(shade(color, 0.25)), body, body, livery]), { x: -0.45, y: 0.45 }));
    // cab
    g.add(place(box(0.9, 1.4, W, body), { x: 1.25, y: 0.45 }));
    g.add(place(box(0.92, 0.04, W + 0.02, mat(shade(color, 0.25))), { x: 1.25, y: 1.85 }));
    g.add(place(box(0.05, 0.55, 1.3, glassM), { x: 1.71, y: 1.15 }));
    g.add(place(box(0.45, 0.45, W + 0.04, glassM), { x: 1.2, y: 1.2 }));
    g.add(place(box(0.1, 0.24, W, metal(PALETTE.steelDark)), { x: 1.74, y: 0.3 }));
    for (const s of [-1, 1]) g.add(place(box(0.04, 0.14, 0.22, emissive('#fff4c8', 0.6)), { x: 1.72, y: 0.66, z: s * 0.55 }));
    // stripe along both flanks
    g.add(place(box(3.42, 0.14, W + 0.02, mat(accent)), { y: 0.62 }));
    // rear doors + gas bottles
    g.add(place(box(0.03, 1.4, 1.1, mat(shade(color, -0.12))), { x: -1.71, y: 0.6 }));
    for (const s of [-1, 1]) g.add(place(cylinder(0.13, 0.13, 0.55, mat(PALETTE.steelLight), 8), { x: -1.88, y: 0.15, z: s * 0.35 }));
    g.add(servingSide({ cx: -0.5, z: W / 2, y: 1.3, w: 1.5, accent: awningColor ?? accent }));
    g.add(place(box(0.45, 0.16, 0.45, metal(PALETTE.steel)), { x: -1.35, y: 2.25, z: -0.45 }));
  } else {
    for (const s of [-1, 1]) {
      g.add(place(wheel(0.3, 0.2), { x: -0.1, y: 0.3, z: s * 0.7 }));
      g.add(place(box(0.8, 0.08, 0.3, dark), { x: -0.1, y: 0.68, z: s * 0.72 }));
    }
    // body: two-tone with a rounded roof
    const bodyGeo = new THREE.BoxGeometry(2.8, 1.6, W).translate(0, 0.8, 0);
    g.add(place(new THREE.Mesh(bodyGeo, [body, body, body, body, body, livery]), { x: -0.2, y: 0.5 }));
    g.add(place(box(2.82, 0.4, W + 0.02, mat(accent)), { x: -0.2, y: 0.5 }));
    g.add(place(barrelRoof({ w: 2.8, d: W, h: 0.35, axis: 'x', material: mat(shade(color, 0.2), { roughness: 0.4, metalness: 0.3 }), endMaterial: body }), { x: -0.2, y: 2.1 }));
    // tow hitch and jack stand
    g.add(beam([1.2, 0.55, 0.55], [1.95, 0.5, 0], 0.08, dark));
    g.add(beam([1.2, 0.55, -0.55], [1.95, 0.5, 0], 0.08, dark));
    g.add(place(cylinder(0.05, 0.05, 0.5, dark, 6), { x: 1.85, y: 0 }));
    // corner stabiliser legs
    for (const x of [-1.5, 1.1]) for (const s of [-1, 1]) g.add(place(box(0.08, 0.5, 0.08, dark), { x, y: 0, z: s * 0.65 }));
    g.add(servingSide({ cx: -0.2, z: W / 2, y: 1.35, w: 1.7, accent: awningColor ?? accent }));
  }

  // roof sign, on short posts, readable from both sides
  const roofY = kind === 'van' ? 2.25 : 2.4;
  const sx = kind === 'van' ? (prop === 'icecream' ? -0.85 : -0.45) : -0.2;
  const sw = kind === 'van' ? (prop === 'icecream' ? 1.6 : 2.3) : 2.3;
  for (const dx of [-sw / 3, sw / 3]) g.add(place(box(0.06, 0.18, 0.06, dark), { x: sx + dx, y: roofY - 0.02 }));
  g.add(place(board(name, { w: sw, h: 0.55, bg: signBg, fg: signFg, border: signFg }), { x: sx, y: roofY + 0.14 }));

  if (prop === 'icecream') {
    const cm = mat('#d9a35a');
    const c = cone(0.28, 0.75, cm, 10);
    c.rotation.x = Math.PI;
    g.add(place(c, { x: 0.45, y: roofY + 0.78 }));
    g.add(place(sphere(0.32, mat('#f4a6c4'), 10), { x: 0.45, y: roofY + 0.6 }));
    g.add(place(sphere(0.26, mat('#fbf3e0'), 10), { x: 0.45, y: roofY + 1.05 }));
    g.add(place(sphere(0.06, mat(PALETTE.red), 6), { x: 0.45, y: roofY + 1.55 }));
  } else if (prop === 'chimney') {
    g.add(place(cylinder(0.11, 0.11, 0.9, metal(PALETTE.steelDark), 8), { x: -1.2, y: roofY - 0.1, z: -0.45 }));
    g.add(place(cone(0.2, 0.15, metal(PALETTE.steelDark), 8), { x: -1.2, y: roofY + 0.8, z: -0.45 }));
  }
  return g;
}

/** Picnic table with two benches, length along X. */
export function picnicTable({ top = PALETTE.wood, frame = PALETTE.woodDark } = {}) {
  const tm = mat(top);
  const fm = mat(frame);
  const g = group(
    place(box(1.5, 0.07, 0.75, tm), { y: 0.72 }),
    place(box(1.5, 0.06, 0.26, tm), { y: 0.42, z: 0.62 }),
    place(box(1.5, 0.06, 0.26, tm), { y: 0.42, z: -0.62 })
  );
  for (const x of [-0.55, 0.55]) {
    g.add(beam([x, 0, 0.7], [x, 0.74, 0.12], 0.07, fm));
    g.add(beam([x, 0, -0.7], [x, 0.74, -0.12], 0.07, fm));
    g.add(place(box(0.07, 0.06, 1.5, fm), { x, y: 0.36 }));
  }
  return g;
}

/** Festoon light strand sagging between two points [x,y,z]. */
export function lightStrand(a, b, { sag = 0.35, spacing = 0.5, colors, seed = 0 } = {}) {
  const g = new THREE.Group();
  const wire = mat(PALETTE.black);
  const at = (t) => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t - sag * 4 * t * (1 - t),
    a[2] + (b[2] - a[2]) * t,
  ];
  const segs = 6;
  for (let i = 0; i < segs; i++) g.add(beam(at(i / segs), at((i + 1) / segs), 0.035, wire));
  const len = Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const n = Math.max(2, Math.round(len / spacing));
  for (let i = 1; i < n; i++) {
    const p = at(i / n);
    const c = colors[(i + seed) % colors.length];
    g.add(place(sphere(0.085, emissive(c, 0.9), 6), { x: p[0], y: p[1] - 0.17, z: p[2] }));
  }
  return g;
}

/** Small plank bar shack facing +z: open bar window, counter, stools, kegs. */
export function barShack() {
  const g = new THREE.Group();
  const w = 2.4, d = 1.9, h = 2.3;
  const planks = surface('planks', '#4f8fa6', { size: 1.2 });
  const trim = mat(PALETTE.white);
  const wood = mat(PALETTE.woodDark);
  // deck
  g.add(box(2.8, 0.14, 2.5, surface('planks', PALETTE.wood, { size: 1 })));
  const y = 0.14;
  // back + side walls
  g.add(place(box(w, h, 0.12, planks), { y, z: -d / 2 + 0.06 }));
  for (const s of [-1, 1]) g.add(place(box(0.12, h, d, planks), { x: s * (w / 2 - 0.06), y }));
  // front: low wall, open window, header
  g.add(place(box(w, 1.0, 0.12, planks), { y, z: d / 2 - 0.06 }));
  g.add(place(box(w, 0.35, 0.12, planks), { y: y + h - 0.35, z: d / 2 - 0.06 }));
  // lit interior with a bottle shelf on the back wall
  g.add(place(box(w - 0.24, h - 0.1, d - 0.2, mat('#5a3b26')), { y }));
  g.add(place(box(w - 0.3, 0.9, 0.02, emissive('#ffc56b', 0.55)), { y: y + 1.0, z: -d / 2 + 0.13 }));
  const bottles = ['#3a8a3a', '#a8462f', '#e9c31f', '#6f9fca', '#7a4d9a', '#e27a1e'];
  for (let i = 0; i < 9; i++) {
    g.add(place(box(0.09, 0.24, 0.09, mat(bottles[i % bottles.length], { roughness: 0.3 })), { x: -0.9 + i * 0.225, y: y + 1.32, z: -d / 2 + 0.2 }));
  }
  g.add(place(box(w - 0.3, 0.05, 0.25, wood), { y: y + 1.3, z: -d / 2 + 0.2 }));
  // bar counter sticking out of the window
  g.add(place(box(w + 0.2, 0.08, 0.5, mat(PALETTE.woodDark)), { y: y + 1.0, z: d / 2 + 0.1 }));
  // beer taps
  for (const x of [-0.3, 0, 0.3]) g.add(place(box(0.05, 0.3, 0.05, metal(PALETTE.chrome)), { x, y: y + 1.08, z: d / 2 - 0.05 }));
  // corner trims
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(place(box(0.14, h, 0.14, trim), { x: sx * (w / 2 - 0.05), y, z: sz * (d / 2 - 0.05) }));
  // tin shed roof, high at the back
  g.add(place(shedRoof({ w, d, h: 0.45, overhang: 0.25, material: surface('corrugated', PALETTE.red, { size: 1 }), wallMaterial: planks }), { y: y + h }));
  // BAR sign on the front edge
  g.add(place(board('BAR', { w: 1.3, h: 0.5, bg: PALETTE.yellow, fg: PALETTE.red, border: PALETTE.red, glow: 0.35 }), { y: y + h + 0.05, z: d / 2 + 0.3, rx: -12 }));
  // painted sign on the back wall
  g.add(place(board('COLD BEER', { w: 1.7, h: 0.45, depth: 0.04, bg: PALETTE.white, fg: '#2f6fbf', double: false, glow: 0.1 }), { y: y + 1.2, z: -d / 2 - 0.02, ry: 180 }));
  // stools along the counter
  for (const x of [-0.75, 0, 0.75]) {
    g.add(place(cylinder(0.04, 0.05, 0.72, metal(PALETTE.steelDark), 6), { x, y: 0.14, z: d / 2 + 0.6 }));
    g.add(place(cylinder(0.19, 0.19, 0.07, mat(PALETTE.red), 10), { x, y: 0.86, z: d / 2 + 0.6 }));
  }
  // kegs stacked by the side wall
  const keg = metal(PALETTE.steelLight, { roughness: 0.35 });
  g.add(place(cylinder(0.22, 0.22, 0.5, keg, 10), { x: w / 2 + 0.3, y: 0.14, z: 0.5 }));
  g.add(place(cylinder(0.22, 0.22, 0.5, keg, 10), { x: w / 2 + 0.3, y: 0.14, z: -0.05 }));
  g.add(place(cylinder(0.22, 0.22, 0.5, keg, 10), { x: w / 2 + 0.3, y: 0.64, z: 0.22 }));
  return g;
}

/** Folding A-frame menu board. */
export function menuBoard() {
  const fm = mat(PALETTE.woodDark);
  const bm = mat('#2b3a2e');
  const g = new THREE.Group();
  for (const s of [-1, 1]) {
    const p = place(box(0.5, 0.75, 0.04, bm), { z: s * 0.12, rx: s * 12 });
    g.add(p);
  }
  g.add(place(box(0.54, 0.04, 0.3, fm), { y: 0.72 }));
  return g;
}

/** Wheelie bin pair (rubbish + recycling). */
export function bins() {
  return group(
    place(box(0.55, 0.85, 0.55, mat(PALETTE.darkGrey)), { x: -0.32 }),
    place(box(0.6, 0.06, 0.6, mat(PALETTE.black)), { x: -0.32, y: 0.85 }),
    place(box(0.55, 0.85, 0.55, mat(PALETTE.blue)), { x: 0.32 }),
    place(box(0.6, 0.06, 0.6, mat(PALETTE.navy)), { x: 0.32, y: 0.85 })
  );
}

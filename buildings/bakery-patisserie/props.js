import * as THREE from 'three';
import {
  PALETTE, box, cylinder, sphere, group, place, beam, mat, metal, textured, canvasTexture,
} from '../../src/lib/index.js';

export const PINK = '#ec7fa6';
export const PINK_DARK = '#c2507c';
export const PINK_PALE = '#f6c6d6';
export const CREAM = '#fbf3e6';
export const CHOC = '#6b3e26';
export const GOLD = '#dc9a3e';
export const GOLD_DARK = '#b06b26';

/**
 * Sign board with 0..1 UVs on its faces, so the texture fills the whole front
 * at any size (the lib sign() squeezes text on boards wider than 1 m).
 * Text faces +z; origin at the centre of the base.
 */
export function bigSign({ w, h, depth = 0.15, key, draw, side = PINK_DARK, double = false, px = 512 }) {
  const tex = canvasTexture(px, Math.max(16, Math.round((px * h) / w)), draw, { key: `bakery-patisserie:${key}`, repeat: false });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const s = mat(side);
  const geo = new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [s, s, s, s, face, double ? face : s]);
}

/** Script lettering on a pink board with a white border. */
export function scriptSign(text, { w, h, key, bg = PINK, fg = '#ffffff', depth = 0.15, double = false }) {
  return bigSign({
    w, h, depth, key, double,
    draw: (ctx, W, H) => {
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = fg;
      ctx.lineWidth = Math.max(3, H * 0.07);
      ctx.strokeRect(H * 0.1, H * 0.1, W - H * 0.2, H - H * 0.2);
      ctx.fillStyle = fg;
      let size = H * 0.66;
      ctx.font = `italic bold ${size}px serif`;
      while (ctx.measureText(text).width > W * 0.86 && size > 8) {
        size -= 1;
        ctx.font = `italic bold ${size}px serif`;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, W / 2, H / 2 + H * 0.04);
    },
  });
}

/**
 * Croissant: a crescent tube swept along an arc in the XY plane, horns pointing
 * down, fat in the middle with rolled lobes and darker creases between them.
 * Origin at the arc centre; spans about 2*R*sin(span) wide.
 */
export function croissant({ R = 1, r = 0.42, lobes = 5, span = 68, depthScale = 0.85, rings = 60, sides = 10 } = {}) {
  const pos = [], col = [], idx = [];
  const light = new THREE.Color(GOLD), dark = new THREE.Color(GOLD_DARK), tip = new THREE.Color('#c7822f');
  const a0 = THREE.MathUtils.degToRad(span);
  for (let i = 0; i <= rings; i++) {
    const t = (i / rings) * 2 - 1;
    const a = t * a0;
    const lobe = Math.abs(Math.cos(((t + 1) / 2) * lobes * Math.PI));
    const crease = lobe < 0.25;
    const rr = Math.max(0.02, r * (1 - 0.8 * Math.abs(t) ** 1.6) * (0.8 + 0.2 * Math.sqrt(lobe)));
    const cx = R * Math.sin(a), cy = R * Math.cos(a);
    const nx = Math.sin(a), ny = Math.cos(a);
    const c = crease ? dark : Math.abs(t) > 0.8 ? tip : light;
    for (let j = 0; j < sides; j++) {
      const b = (j / sides) * Math.PI * 2;
      const u = Math.cos(b) * rr, v = Math.sin(b) * rr * depthScale;
      pos.push(cx + nx * u, cy + ny * u, v);
      col.push(c.r, c.g, c.b);
    }
  }
  for (let i = 0; i < rings; i++) for (let j = 0; j < sides; j++) {
    const a = i * sides + j, b = i * sides + ((j + 1) % sides), c = a + sides, d = b + sides;
    idx.push(a, b, c, b, d, c);
  }
  // end caps
  for (const [ring, flip] of [[0, true], [rings, false]]) {
    const ci = pos.length / 3;
    let sx = 0, sy = 0;
    for (let j = 0; j < sides; j++) { sx += pos[(ring * sides + j) * 3]; sy += pos[(ring * sides + j) * 3 + 1]; }
    pos.push(sx / sides, sy / sides, 0);
    col.push(tip.r, tip.g, tip.b);
    for (let j = 0; j < sides; j++) {
      const a = ring * sides + j, b = ring * sides + ((j + 1) % sides);
      flip ? idx.push(ci, b, a) : idx.push(ci, a, b);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  geo.setIndex(idx);
  geo.computeVertexNormals();
  return group(new THREE.Mesh(geo, mat('#ffffff', { vertexColors: true, roughness: 0.6 })));
}

/** Small croissant lying flat (horns towards +z), for shelves and tables. */
export function miniCroissant(size = 0.22) {
  const c = croissant({ R: size, r: size * 0.55, lobes: 3, rings: 18, sides: 6, depthScale: 0.7 });
  c.rotation.x = -Math.PI / 2;
  c.position.y = size * 0.3;
  return group(c);
}

/** Layer cake, optionally on a stand. kind picks colours. */
export function cake(kind = 0, { stand = true, s = 1 } = {}) {
  const kinds = [
    [PINK_PALE, CREAM, PALETTE.red],
    [CHOC, '#8a5232', PALETTE.red],
    [CREAM, PINK, '#ffffff'],
    ['#a8dcc4', CREAM, PINK],
    ['#f2dc7a', CREAM, PALETTE.orange],
  ];
  const [a, b, top] = kinds[kind % kinds.length];
  const g = new THREE.Group();
  let y = 0;
  if (stand) {
    g.add(cylinder(0.04, 0.07, 0.08, mat('#ffffff'), 8));
    g.add(place(cylinder(0.22, 0.22, 0.02, mat('#ffffff'), 12), { y: 0.08 }));
    y = 0.1;
  }
  g.add(place(cylinder(0.18, 0.18, 0.13, mat(a), 12), { y }));
  g.add(place(cylinder(0.185, 0.185, 0.025, mat(b), 12), { y: y + 0.13 }));
  g.add(place(cylinder(0.12, 0.12, 0.1, mat(a), 12), { y: y + 0.155 }));
  g.add(place(cylinder(0.125, 0.125, 0.02, mat(b), 12), { y: y + 0.255 }));
  g.add(place(sphere(0.04, mat(top), 6), { y: y + 0.27 }));
  g.scale.setScalar(s);
  return g;
}

/** Stack of macarons in assorted pastels. */
export function macarons(seed = 0) {
  const cols = [PINK, '#a8dcc4', '#f2dc7a', '#c7a6e0', CHOC, PINK_PALE];
  const g = new THREE.Group();
  for (let i = 0; i < 4; i++) {
    g.add(place(cylinder(0.07, 0.07, 0.05, mat(cols[(i + seed) % cols.length]), 8), { x: (i % 2) * 0.02 - 0.01, y: i * 0.055 }));
  }
  return g;
}

/** Bistro chair, faces +z. */
export function bistroChair(color = PALETTE.darkGrey) {
  const m = mat(color);
  return group(
    place(cylinder(0.025, 0.03, 0.45, m, 5), {}),
    place(cylinder(0.2, 0.2, 0.05, m, 10), { y: 0.45 }),
    place(box(0.38, 0.38, 0.04, m), { y: 0.5, z: -0.18 }),
    place(box(0.38, 0.06, 0.06, mat(PINK)), { y: 0.86, z: -0.18 }),
  );
}

/** Round bistro table with a pastry plate and two cups. */
export function bistroTable(seed = 0) {
  const iron = mat(PALETTE.darkGrey);
  const top = mat(CREAM);
  const g = group(
    cylinder(0.25, 0.25, 0.03, iron, 8),
    place(cylinder(0.04, 0.04, 0.7, iron, 6), {}),
    place(cylinder(0.42, 0.42, 0.04, top, 14), { y: 0.7 }),
    place(cylinder(0.14, 0.14, 0.02, mat('#ffffff'), 10), { y: 0.74, x: 0.08 }),
    place(cake(seed, { stand: false, s: 0.45 }), { y: 0.76, x: 0.08 }),
    place(cylinder(0.05, 0.04, 0.08, mat('#ffffff'), 8), { y: 0.74, x: -0.2, z: 0.14 }),
    place(cylinder(0.05, 0.04, 0.08, mat(PINK_PALE), 8), { y: 0.74, x: -0.16, z: -0.18 }),
  );
  return g;
}

/** Chalkboard A-frame menu, faces +z. */
export function chalkboard() {
  const tex = canvasTexture(64, 96, (ctx, W, H) => {
    ctx.fillStyle = '#9c6b3f';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#2d3a33';
    ctx.fillRect(5, 5, W - 10, H - 10);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 13px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Menu', W / 2, 22);
    ctx.fillStyle = PINK_PALE;
    for (let i = 0; i < 5; i++) ctx.fillRect(12, 34 + i * 10, 26 + ((i * 7) % 14), 3);
  }, { key: 'bakery-patisserie:chalk', repeat: false });
  const face = textured(tex);
  const wood = mat(PALETTE.wood);
  const board = () => new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.04).translate(0, 0.425, 0), [wood, wood, wood, wood, face, wood]);
  const f = board();
  f.rotation.x = -0.18;
  f.position.z = 0.08;
  const b = board();
  b.rotation.x = 0.18;
  b.position.z = -0.08;
  b.rotation.y = Math.PI;
  return group(f, b);
}

/** Delivery cargo bike (bakfiets) with a pink box at the front. Length along +x (front). */
export function cargoBike() {
  const frame = mat(PINK_DARK);
  const tyre = mat(PALETTE.black);
  const wheel = (x) => {
    const w = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.05, 6, 16), tyre);
    w.position.set(x, 0.35, 0);
    const hub = place(cylinder(0.05, 0.05, 0.08, metal(PALETTE.steelLight), 6), { x, y: 0.35, z: -0.04, rx: 90 });
    return group(w, hub);
  };
  const tex = canvasTexture(128, 96, (ctx, W, H) => {
    ctx.fillStyle = PINK;
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 5;
    ctx.strokeRect(6, 6, W - 12, H - 12);
    ctx.fillStyle = GOLD;
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.62, 30, Math.PI * 1.1, Math.PI * 1.9);
    ctx.lineWidth = 16;
    ctx.strokeStyle = GOLD;
    ctx.stroke();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'italic bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('Pâtisserie', W / 2, H * 0.82);
  }, { key: 'bakery-patisserie:bikebox', repeat: false });
  const logo = textured(tex);
  const pk = mat(PINK);
  const top = mat(CREAM);
  // box: +x, -x, top, bottom, +z, -z
  const crate = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.55, 0.62).translate(0, 0.275, 0), [pk, pk, top, pk, logo, logo]);
  crate.position.set(0.55, 0.42, 0);
  const g = group(
    wheel(1.05), wheel(-0.75),
    crate,
    beam([1.05, 0.35, 0], [0.55, 0.42, 0], 0.06, frame),
    beam([0.15, 0.42, 0], [-0.75, 0.35, 0], 0.07, frame),
    beam([-0.35, 0.95, 0], [-0.75, 0.35, 0], 0.06, frame),
    beam([-0.35, 0.95, 0], [0.15, 0.42, 0], 0.06, frame),
    beam([0.05, 1.05, 0], [0.15, 0.42, 0], 0.06, frame),
    place(box(0.28, 0.07, 0.16, mat(PALETTE.black)), { x: -0.37, y: 0.95 }),
    place(box(0.06, 0.06, 0.6, mat(PALETTE.black)), { x: 0.05, y: 1.05 }),
  );
  return g;
}

/** Stack of plastic bread crates. */
export function crates(n = 3, color = PINK_DARK) {
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    g.add(place(box(0.7, 0.28, 0.5, mat(color)), { y: i * 0.3 }));
    g.add(place(box(0.6, 0.04, 0.42, mat(GOLD)), { y: i * 0.3 + 0.27 }));
  }
  return g;
}

/** Wheelie bin. */
export function bin(color = PALETTE.roofGreen) {
  return group(
    box(0.6, 0.95, 0.65, mat(color)),
    place(box(0.66, 0.06, 0.72, mat(PALETTE.darkGrey)), { y: 0.95 }),
  );
}

/** Victorian-style street lamp with a lantern head. */
export function lanternLamp(h = 3.4) {
  const m = mat(PALETTE.roofBlack);
  return group(
    cylinder(0.14, 0.18, 0.3, m, 8),
    place(cylinder(0.05, 0.07, h, m, 6), { y: 0.3 }),
    place(cylinder(0.2, 0.12, 0.08, m, 8), { y: h + 0.25 }),
    place(box(0.28, 0.38, 0.28, mat(PALETTE.windowLit, { emissive: PALETTE.windowLit, emissiveIntensity: 0.8 })), { y: h + 0.33 }),
    place(cylinder(0.02, 0.24, 0.18, m, 4), { y: h + 0.71, ry: 45 }),
  );
}

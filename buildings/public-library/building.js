import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, cylinder, place, group, hipRoof, gableRoof, stairs, door,
  tree, hedge, bench, flag, mat, metal, emissive, textured, canvasTexture, shade,
} from '../../src/lib/index.js';

// Public Library — 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Classical limestone hall on a rusticated podium: a six-column portico with a
// pediment, broad steps flanked by two stone lions, tall arched windows,
// a balustraded cornice and a low copper roof.

const LIME = '#e6d9b8'; // limestone walls
const TRIM = '#f4eedc'; // columns, cornices, window surrounds
const PLINTH = '#b9ad95'; // podium / step cheeks
const LION = '#bdae8c';

// --- textures -------------------------------------------------------------

// Large ashlar blocks: 4 m per repeat, 0.5 m courses.
function ashlar(color, key) {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, W, H);
    const rows = 8, rh = H / rows;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 ? 16 : 0;
      for (let x = -off; x < W; x += 32) {
        ctx.fillStyle = shade(color, ((r * 7 + x) % 5 - 2) * 0.012);
        ctx.fillRect(x + 1, r * rh + 1, 30, rh - 2);
      }
      ctx.fillStyle = shade(color, -0.14);
      ctx.fillRect(0, r * rh, W, 1);
      for (let x = -off; x < W; x += 32) ctx.fillRect(x, r * rh, 1, rh);
    }
  }, { key });
  tex.repeat.set(0.25, 0.25);
  return textured(tex, { roughness: 0.9 });
}

// --- local parts ----------------------------------------------------------

const geoCache = new Map();
// Round-headed outline (rectangle of height hRect topped by a semicircle), extruded along +z.
function archGeo(w, hRect, depth) {
  const key = `${w}|${hRect}|${depth}`;
  if (!geoCache.has(key)) {
    const s = new THREE.Shape();
    s.moveTo(-w / 2, 0);
    s.lineTo(w / 2, 0);
    s.lineTo(w / 2, hRect);
    s.absarc(0, hRect, w / 2, 0, Math.PI, false);
    s.lineTo(-w / 2, 0);
    geoCache.set(key, new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false, curveSegments: 10 }));
  }
  return geoCache.get(key);
}

// Tall arched window on a wall face; origin = bottom centre, sticks out towards +z.
function archWindow({ w = 1.2, h = 4, glassM, trimM, barM }) {
  const hRect = h - w / 2;
  const g = group(
    new THREE.Mesh(archGeo(w + 0.4, hRect, 0.08), trimM),
    place(new THREE.Mesh(archGeo(w, hRect, 0.06), glassM), { z: 0.06 }),
    place(box(0.07, h - 0.08, 0.05, barM), { z: 0.13 }),
    place(box(w, 0.07, 0.05, barM), { y: hRect, z: 0.13 }),
    place(box(w, 0.07, 0.05, barM), { y: hRect * 0.5, z: 0.13 }),
    place(box(0.32, 0.42, 0.16, trimM), { y: h + 0.02 }), // keystone
    place(box(w + 0.6, 0.14, 0.28, trimM), { y: -0.14 }), // sill
  );
  return g;
}

// Reclining guardian lion facing +z; origin = base centre. ~1.6 m long.
function lion(m, dark) {
  return group(
    place(box(0.72, 0.5, 1.5, m), { z: -0.1 }), // body
    place(box(0.8, 0.72, 0.62, m), { z: -0.5 }), // haunches
    place(box(0.22, 0.18, 0.62, m), { x: -0.22, z: 0.78 }), // front paws
    place(box(0.22, 0.18, 0.62, m), { x: 0.22, z: 0.78 }),
    place(box(0.9, 0.95, 0.6, m), { y: 0.25, z: 0.35 }), // chest + mane
    place(box(0.52, 0.5, 0.4, m), { y: 0.62, z: 0.72 }), // head
    place(box(0.32, 0.22, 0.2, m), { y: 0.66, z: 0.98 }), // muzzle
    place(box(0.1, 0.06, 0.04, dark), { y: 0.82, z: 0.93 + 0.0, x: -0.13 }), // eyes
    place(box(0.1, 0.06, 0.04, dark), { y: 0.82, z: 0.93, x: 0.13 }),
    place(box(0.12, 0.1, 0.07, dark), { y: 0.78, z: 1.08 }), // nose
    place(box(0.12, 0.12, 0.7, m), { x: 0.44, y: 0.05, z: -0.6, ry: -15 }), // tail
  );
}

// Balustrade around a w x d rectangle (origin = base centre).
function balustrade(w, d, h, m) {
  const g = new THREE.Group();
  const rail = 0.18;
  for (const [len, x, z, ry] of [[w, 0, d / 2, 0], [w, 0, -d / 2, 0], [d, w / 2, 0, 90], [d, -w / 2, 0, 90]]) {
    g.add(place(box(len + 0.3, 0.16, 0.36, m), { x, z, ry }));
    g.add(place(box(len + 0.3, rail, 0.4, m), { x, y: h - rail, z, ry }));
    const n = Math.max(2, Math.round(len / 0.42));
    for (let i = 0; i < n; i++) {
      const t = -len / 2 + (len * (i + 0.5)) / n;
      const p = place(box(0.13, h - 0.34, 0.13, m), { y: 0.16 });
      if (ry) p.position.set(x, 0.16, t); else p.position.set(t, 0.16, z);
      g.add(p);
    }
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.42, h + 0.08, 0.42, m), { x: sx * w / 2, z: sz * d / 2 }));
  }
  return g;
}

// Flat text panel facing +z, origin = bottom centre. Uses 0..1 UVs so the
// whole canvas maps onto the panel (box UVs are in metres).
function textPanel(text, w, h, { bg, fg, family = 'serif', key }) {
  const W = 512, H = Math.max(24, Math.round((512 * h) / w));
  const tex = canvasTexture(W, H, (ctx) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = fg;
    let size = H * 0.72;
    ctx.font = `bold ${size}px ${family}`;
    while (ctx.measureText(text).width > W * 0.92 && size > 6) {
      size -= 1;
      ctx.font = `bold ${size}px ${family}`;
    }
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key, repeat: false });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { roughness: 0.9 }));
  m.position.y = h / 2;
  return group(m);
}

// Small book-return drop box.
function bookDrop() {
  return group(
    box(0.7, 1.0, 0.6, mat(PALETTE.navy)),
    place(cylinder(0.35, 0.35, 0.6, mat(PALETTE.navy), 12), { y: 1.0, z: 0.3, rx: 90 }),
    place(box(0.45, 0.07, 0.04, mat(PALETTE.black)), { y: 0.8, z: 0.3 }),
    place(box(0.5, 0.22, 0.03, mat(PALETTE.white)), { y: 0.5, z: 0.31 }),
  );
}

// Bicycle rack with a couple of bikes, length along X.
function bikeRack(n, colors) {
  const m = metal(PALETTE.steelLight);
  const g = new THREE.Group();
  g.add(box(0.06 + 0.7 * (n - 1) + 0.4, 0.05, 0.06, m));
  for (let i = 0; i < n; i++) {
    const x = -0.35 * (n - 1) + i * 0.7;
    g.add(place(box(0.05, 0.75, 0.6, m), { x }));
    if (colors[i]) {
      const c = mat(colors[i]);
      const tyre = mat(PALETTE.black);
      g.add(place(cylinder(0.3, 0.3, 0.05, tyre, 10), { x: x + 0.12, y: 0.3, z: -0.5, rz: 90 }));
      g.add(place(cylinder(0.3, 0.3, 0.05, tyre, 10), { x: x + 0.12, y: 0.3, z: 0.5, rz: 90 }));
      g.add(place(box(0.05, 0.06, 0.95, c), { x: x + 0.12, y: 0.62 }));
      g.add(place(box(0.05, 0.4, 0.06, c), { x: x + 0.12, y: 0.32, z: -0.1 }));
      g.add(place(box(0.45, 0.04, 0.05, mat(PALETTE.darkGrey)), { x: x + 0.12, y: 0.8, z: 0.42 }));
    }
  }
  return g;
}

// --- build ----------------------------------------------------------------

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const HW = TILE, HD = TILE / 2; // half extents of the 20 x 10 lot

  const wallM = ashlar(LIME, 'public-library:ashlar');
  const podM = ashlar(PLINTH, 'public-library:podium');
  const trimM = mat(TRIM);
  const glassM = mat('#34506e', { roughness: 0.25, metalness: 0.35 });
  const litM = emissive('#ffdf9a', 0.45);
  const barM = mat(TRIM);
  const copper = mat(PALETTE.roofGreen, { roughness: 0.6 });
  const lionM = mat(LION);
  const darkM = mat(PALETTE.darkGrey);

  g.add(lot([2, 1], 'grass'));

  // ---- main hall -------------------------------------------------------
  const bw = 16, bd = 5.6, bz = -1.7; // wall block (z from -4.5 to 1.1)
  const front = bz + bd / 2, back = bz - bd / 2;
  const podH = 1.1;
  const yF = y0 + podH; // hall floor level
  const wallH = 6.2;
  const yTop = yF + wallH;

  // rusticated podium + plinth course
  g.add(place(box(bw + 0.6, podH, bd + 0.6, podM), { y: y0, z: bz }));
  g.add(place(box(bw + 0.75, 0.18, bd + 0.75, trimM), { y: yF - 0.12, z: bz }));
  // walls
  g.add(place(box(bw, wallH, bd, wallM), { y: yF, z: bz }));
  // corner pilasters + front wing pilasters
  for (const sx of [-1, 1]) {
    for (const x of [sx * (bw / 2 - 0.25), sx * 4.25, sx * 6.1]) {
      g.add(place(box(0.55, wallH, 0.2, trimM), { x, y: yF, z: front + 0.08 }));
    }
    g.add(place(box(0.2, wallH, 0.55, trimM), { x: sx * (bw / 2 + 0.08), y: yF, z: back + 0.25 }));
    g.add(place(box(0.2, wallH, 0.55, trimM), { x: sx * (bw / 2 + 0.08), y: yF, z: front - 0.25 }));
  }
  // entablature: frieze, cornice, balustrade
  g.add(place(box(bw + 0.3, 0.55, bd + 0.3, trimM), { y: yTop, z: bz }));
  g.add(place(box(bw + 0.4, 0.08, bd + 0.4, mat(shade(TRIM, -0.12))), { y: yTop + 0.55, z: bz }));
  g.add(place(box(bw + 0.8, 0.3, bd + 0.8, trimM), { y: yTop + 0.63, z: bz }));
  const yCor = yTop + 0.93;
  g.add(place(balustrade(bw, bd, 0.85, trimM), { y: yCor, z: bz }));
  // low copper hipped roof with a glazed reading-room lantern
  g.add(place(box(bw - 0.4, 0.1, bd - 0.4, mat(PALETTE.concreteDark)), { y: yCor, z: bz }));
  g.add(place(hipRoof({ w: bw - 1.2, d: bd - 1.2, h: 1.5, overhang: 0, material: copper }), { y: yCor, z: bz }));
  g.add(place(box(4.2, 0.9, 1.4, glassM), { y: yCor + 1.0, z: bz }));
  g.add(place(hipRoof({ w: 4.4, d: 1.6, h: 0.5, overhang: 0.1, material: copper }), { y: yCor + 1.9, z: bz }));
  for (const x of [-1.4, 0, 1.4]) g.add(place(box(0.08, 0.9, 1.45, trimM), { x, y: yCor + 1.0, z: bz }));

  // ---- arched windows ---------------------------------------------------
  const win = (lit) => archWindow({ w: 1.25, h: 4.1, glassM: lit ? litM : glassM, trimM, barM });
  const sillY = yF + 0.9;
  // front wings
  for (const x of [-7.05, -5.15, 5.15, 7.05]) {
    g.add(place(win(x === -5.15), { x, y: sillY, z: front }));
    g.add(place(box(0.8, 0.5, 0.06, glassM), { x, y: y0 + 0.35, z: front + 0.3 })); // basement light
  }
  // back
  for (const x of [-6.6, -4.2, -1.6, 1.6, 4.2, 6.6]) {
    g.add(place(win(x === 1.6), { x, y: sillY, z: back, ry: 180 }));
    g.add(place(box(0.8, 0.5, 0.06, glassM), { x, y: y0 + 0.35, z: back - 0.3 }));
  }
  g.add(place(door({ w: 1.2, h: 2.2, color: PALETTE.woodDark }), { x: 0, y: y0, z: back - 0.3, ry: 180 }));
  // sides
  for (const sx of [-1, 1]) {
    for (const z of [bz - 1.3, bz + 1.3]) {
      g.add(place(win(sx > 0 && z > bz), { x: sx * bw / 2, y: sillY, z, ry: sx * 90 }));
      g.add(place(box(0.06, 0.5, 0.8, glassM), { x: sx * (bw / 2 + 0.3), y: y0 + 0.35, z }));
    }
  }

  // ---- portico -----------------------------------------------------------
  const pw = 8.4; // portico width
  const pFront = 3.35; // front edge of the portico floor
  const pDepth = pFront - front;
  // portico floor (continuation of the podium)
  g.add(place(box(pw + 0.6, podH, pDepth, podM), { y: y0, z: front + pDepth / 2 }));
  g.add(place(box(pw + 0.75, 0.18, pDepth + 0.1, trimM), { y: yF - 0.12, z: front + pDepth / 2 }));
  // entrance wall details behind the columns
  g.add(place(new THREE.Mesh(archGeo(2.6, 2.9, 0.1), trimM), { y: yF, z: front }));
  g.add(place(new THREE.Mesh(archGeo(2.1, 2.7, 0.08), mat(PALETTE.woodDark)), { y: yF, z: front + 0.1 }));
  g.add(place(new THREE.Mesh(archGeo(1.6, 0.6, 0.06), litM), { y: yF + 2.75, z: front + 0.14 })); // fanlight
  g.add(place(box(0.08, 2.6, 0.06, mat(PALETTE.brickBrown)), { y: yF, z: front + 0.2 }));
  g.add(place(box(0.12, 0.12, 0.08, mat(PALETTE.yellow)), { x: -0.18, y: yF + 1.1, z: front + 0.2 }));
  g.add(place(box(0.12, 0.12, 0.08, mat(PALETTE.yellow)), { x: 0.18, y: yF + 1.1, z: front + 0.2 }));
  for (const x of [-2.6, 2.6]) g.add(place(win(false), { x, y: sillY + 0.3, z: front, s: [1, 0.85, 1] }));
  // six columns
  const colZ = pFront - 0.5;
  const colH = wallH - 0.6;
  const n = 6;
  for (let i = 0; i < n; i++) {
    const x = -pw / 2 + 0.5 + (i * (pw - 1)) / (n - 1);
    g.add(place(box(0.86, 0.22, 0.86, trimM), { x, y: yF, z: colZ }));
    g.add(place(cylinder(0.3, 0.36, colH, trimM, 12), { x, y: yF + 0.22, z: colZ }));
    g.add(place(cylinder(0.42, 0.3, 0.2, trimM, 12), { x, y: yF + 0.22 + colH, z: colZ }));
    g.add(place(box(0.9, 0.18, 0.9, trimM), { x, y: yTop - 0.18, z: colZ }));
  }
  // portico entablature with the name on the frieze
  const eD = pDepth + 0.2;
  g.add(place(box(pw + 0.3, 0.55, eD, trimM), { y: yTop, z: front + eD / 2 - 0.1 }));
  g.add(place(textPanel('PUBLIC  LIBRARY', 6.6, 0.5, { bg: TRIM, fg: '#4b4336', key: 'public-library:frieze' }), { y: yTop + 0.03, z: pFront + 0.11 }));
  g.add(place(box(pw + 0.4, 0.08, eD + 0.1, mat(shade(TRIM, -0.12))), { y: yTop + 0.55, z: front + eD / 2 - 0.05 }));
  g.add(place(box(pw + 0.8, 0.3, eD + 0.3, trimM), { y: yTop + 0.63, z: front + eD / 2 }));
  // pediment: copper gable with a stone tympanum + clock roundel
  const pedD = pDepth + 2.2;
  g.add(place(gableRoof({ w: pw + 0.4, d: pedD, h: 1.9, overhang: 0.25, ridge: 'z', material: copper, gableMaterial: TRIM }), { y: yCor, z: pFront + 0.25 - pedD / 2 }));
  g.add(place(cylinder(0.42, 0.42, 0.08, mat(PALETTE.white), 16), { y: yCor + 0.75, z: pFront + 0.27, rx: 90 }));
  g.add(place(cylinder(0.5, 0.5, 0.06, mat(PALETTE.roofGreen), 16), { y: yCor + 0.75, z: pFront + 0.24, rx: 90 }));
  g.add(place(box(0.05, 0.3, 0.03, mat(PALETTE.black)), { y: yCor + 0.75, z: pFront + 0.37 }));
  g.add(place(box(0.22, 0.05, 0.03, mat(PALETTE.black)), { x: 0.1, y: yCor + 0.75, z: pFront + 0.37 }));
  // acroterion + flag on the ridge
  g.add(place(box(0.5, 0.35, 0.5, trimM), { y: yCor + 1.85, z: pFront + 0.1 }));
  g.add(place(flag({ h: 3.2, color: PALETTE.blue, color2: PALETTE.blue }), { y: yCor + 2.2, z: pFront - 0.4 }));

  // ---- broad steps + lions -------------------------------------------------
  const stepD = 1.45;
  g.add(place(stairs({ w: pw + 0.6, h: podH, d: stepD, steps: 6, material: mat(shade(PLINTH, 0.12)) }), { y: y0, z: pFront + stepD / 2 }));
  for (const sx of [-1, 1]) {
    const cx = sx * (pw / 2 + 0.95);
    const cz = (pFront + stepD + front) / 2;
    const cd = pFront + stepD - front;
    // step cheek wall
    g.add(place(box(1.3, podH + 0.15, cd, podM), { x: cx, y: y0, z: cz }));
    g.add(place(box(1.45, 0.15, cd + 0.1, trimM), { x: cx, y: y0 + podH + 0.15, z: cz }));
    // lion on its pedestal, gazing out over the street
    g.add(place(box(1.15, 0.45, 2.0, podM), { x: cx, y: y0 + podH + 0.3, z: pFront + stepD - 1.15 }));
    g.add(place(lion(lionM, darkM), { x: cx, y: y0 + podH + 0.75, z: pFront + stepD - 1.25, s: 1.15 }));
    // lamp standards at the foot of the steps
    g.add(place(cylinder(0.12, 0.16, 3.2, metal(PALETTE.darkGrey), 8), { x: sx * (pw / 2 + 2.0), y: y0, z: 4.3 }));
    g.add(place(sphereLamp(), { x: sx * (pw / 2 + 2.0), y: y0 + 3.2, z: 4.3 }));
  }

  // ---- grounds -------------------------------------------------------------
  // paved forecourt in front of the steps and a path round to the back door
  g.add(place(patch(2 * HW, 1.2, 'paved'), { y: y0, z: HD - 0.6 }));
  // flower beds with clipped hedges in front of the wings
  for (const sx of [-1, 1]) {
    const bx = sx * 7.7;
    g.add(place(box(4.0, 0.25, 2.0, mat(PALETTE.stoneDark)), { x: bx, y: y0, z: 2.75 }));
    g.add(place(box(3.8, 0.27, 1.8, mat(PALETTE.mud)), { x: bx, y: y0, z: 2.75 }));
    g.add(place(hedge({ w: 3.6, h: 0.55, d: 0.5 }), { x: bx, y: y0 + 0.25, z: 2.15 }));
    for (let i = 0; i < 6; i++) {
      const c = [PALETTE.red, PALETTE.yellow, PALETTE.white, PALETTE.purple, PALETTE.red, PALETTE.orange][(i + (sx > 0 ? 2 : 0)) % 6];
      g.add(place(box(0.35, 0.3, 0.35, mat(c)), { x: bx - 1.55 + i * 0.62, y: y0 + 0.27, z: 3.15 + (i % 2) * 0.2 }));
    }
    // slim poplars and shrubs in the narrow side strips
    g.add(place(tree({ kind: 'poplar', h: 6.5, seed: 30 + sx }), { x: sx * 9.1, y: y0, z: -3.3 }));
    g.add(place(tree({ kind: 'poplar', h: 5.5, seed: 40 + sx }), { x: sx * 9.15, y: y0, z: -0.9 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 50 + sx }), { x: sx * 9.25, y: y0, z: 1.0 }));
  }
  // forecourt furniture
  g.add(place(bench({ w: 1.6 }), { x: -7.6, y: y0, z: 4.45, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 7.6, y: y0, z: 4.45, ry: 180 }));
  g.add(place(bookDrop(), { x: 9.3, y: y0, z: 4.3 }));
  g.add(place(bikeRack(3, [PALETTE.red, null, PALETTE.blue]), { x: -9.25, y: y0, z: 3.9, ry: 90, s: 0.85 }));
  // notice board by the forecourt
  g.add(place(group(
    place(box(0.1, 1.6, 0.1, mat(PALETTE.woodDark)), { x: -0.55 }),
    place(box(0.1, 1.6, 0.1, mat(PALETTE.woodDark)), { x: 0.55 }),
    place(box(1.3, 0.7, 0.08, mat(PALETTE.navy)), { y: 0.75 }),
    place(textPanel('LIBRARY', 1.2, 0.6, { bg: PALETTE.navy, fg: '#ffffff', family: 'sans-serif', key: 'public-library:board' }), { y: 0.8, z: 0.05 }),
  ), { x: 5.3, y: y0, z: 4.6 }));
  return g;
}

// Globe lamp head for the lamp standards.
function sphereLamp() {
  return group(
    place(box(0.3, 0.1, 0.3, metal(PALETTE.darkGrey)), {}),
    place(new THREE.Mesh(new THREE.SphereGeometry(0.28, 10, 8), emissive('#fff1c4', 0.7)), { y: 0.35 }),
  );
}

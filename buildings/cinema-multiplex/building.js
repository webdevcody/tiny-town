import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, sphere, place, group, door,
  tree, streetLamp, bench, beam, pipe, glass, signTexture, mat, metal, emissive, textured, canvasTexture, rng,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// A windowless dark auditorium box, a two-storey glass foyer in front, a bulb-lit
// marquee over the doors, a big MULTIPLEX sign, neon bands and lit poster frames.

const DARK = '#3a3346';
const DARK_TOP = '#2b2832';
const NEON_PINK = '#ff3fa4';
const NEON_CYAN = '#3fe6ff';
const MARQUEE_RED = '#c3212e';
const BULB = '#ffe27a';

// dark cladding with faint vertical panel joints (2 m per repeat; box UVs are metres)
function cladding() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = DARK;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#433c50';
    ctx.fillRect(0, 0, 2, H);
    ctx.fillRect(W / 2, 0, 2, H);
    ctx.fillStyle = '#332d3e';
    ctx.fillRect(0, H - 2, W, 2);
  }, { key: 'cinema-multiplex:cladding' });
  tex.repeat.set(0.5, 0.5);
  return textured(tex, { roughness: 0.9 });
}

// flat plane with 0..1 UVs (lib boxes have metre UVs), faces +z, origin bottom centre
function panel(tex, w, h, glow = 0.4) {
  const m = textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow });
  const geo = new THREE.PlaneGeometry(w, h);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, m);
}

// movie poster artwork: gradient sky, a big shape, a title
const POSTERS = [
  { a: '#1b2a6b', b: '#e8508a', fg: '#ffd84a', title: 'STAR RUN', shape: 'planet' },
  { a: '#0d0d12', b: '#b3141b', fg: '#ffffff', title: 'NIGHTFALL', shape: 'moon' },
  { a: '#1e7a4a', b: '#f2d046', fg: '#1a1a1a', title: 'JUNGLE', shape: 'hill' },
  { a: '#38a0e0', b: '#fff2b0', fg: '#d0262e', title: 'TOON TOWN', shape: 'sun' },
  { a: '#442060', b: '#ff8a3c', fg: '#ffffff', title: 'SPEED 9', shape: 'stripes' },
  { a: '#0f3a4a', b: '#3fe6ff', fg: '#ffffff', title: 'DEEP BLUE', shape: 'wave' },
];
function posterTexture(i) {
  const p = POSTERS[i % POSTERS.length];
  return canvasTexture(96, 144, (ctx, W, H) => {
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, p.a);
    grad.addColorStop(1, p.b);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = p.fg;
    if (p.shape === 'planet' || p.shape === 'sun' || p.shape === 'moon') {
      ctx.beginPath();
      ctx.arc(W / 2, H * 0.4, W * (p.shape === 'moon' ? 0.22 : 0.3), 0, Math.PI * 2);
      ctx.fill();
      if (p.shape === 'planet') {
        ctx.strokeStyle = p.fg;
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.ellipse(W / 2, H * 0.4, W * 0.45, W * 0.1, -0.3, 0, Math.PI * 2);
        ctx.stroke();
      }
    } else if (p.shape === 'hill') {
      ctx.beginPath();
      ctx.moveTo(0, H * 0.7);
      ctx.lineTo(W * 0.35, H * 0.25);
      ctx.lineTo(W * 0.6, H * 0.5);
      ctx.lineTo(W * 0.8, H * 0.35);
      ctx.lineTo(W, H * 0.7);
      ctx.fill();
    } else if (p.shape === 'stripes') {
      for (let k = 0; k < 4; k++) ctx.fillRect(0, H * (0.2 + k * 0.1), W * (0.9 - k * 0.15), H * 0.05);
    } else {
      for (let k = 0; k < 3; k++) {
        ctx.beginPath();
        for (let x = 0; x <= W; x += 4) ctx.lineTo(x, H * (0.3 + k * 0.12) + Math.sin(x / 8 + k) * 5);
        ctx.lineTo(W, H * (0.36 + k * 0.12));
        ctx.lineTo(0, H * (0.36 + k * 0.12));
        ctx.fill();
      }
    }
    // a dark figure silhouette in front
    ctx.fillStyle = 'rgba(0,0,0,0.75)';
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.56, W * 0.08, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(W / 2 - W * 0.12, H * 0.62, W * 0.24, H * 0.18);
    // title
    ctx.fillStyle = p.fg;
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.title, W / 2, H * 0.88);
  }, { key: 'cinema-multiplex:poster' + i, repeat: false });
}

// framed, back-lit poster case on a wall; faces +z, origin bottom centre on the wall
function posterFrame(i, { w = 1.5, h = 2.2, y = 0.7 } = {}) {
  const frameM = metal(PALETTE.chrome, { roughness: 0.3 });
  return group(
    place(box(w + 0.24, h + 0.24, 0.12, frameM), { y: y - 0.12 }),
    place(panel(posterTexture(i), w, h, 0.55), { y, z: 0.125 }),
    place(box(w + 0.3, 0.1, 0.25, frameM), { y: y + h + 0.12 }),
    place(box(w * 0.8, 0.05, 0.12, emissive('#fff6d8', 1)), { y: y + h + 0.07, z: 0.18 }),
  );
}

// marquee fascia: red board, rows of bulbs top and bottom, white letterboard
function marqueeTexture(text, sub) {
  return canvasTexture(512, 96, (ctx, W, H) => {
    ctx.fillStyle = MARQUEE_RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = BULB;
    for (let x = 8; x < W; x += 16) {
      ctx.beginPath(); ctx.arc(x, 8, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(x, H - 8, 4.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#fbf6e8';
    ctx.fillRect(14, 18, W - 28, H - 36);
    ctx.fillStyle = '#16131c';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText(text, W / 2, sub ? H * 0.4 : H / 2);
    if (sub) {
      ctx.fillStyle = MARQUEE_RED;
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(sub, W / 2, H * 0.68);
    }
  }, { key: 'cinema-multiplex:marquee:' + text + sub, repeat: false });
}

// big glowing letters on the dark wall
function letterSignTexture(text) {
  return canvasTexture(512, 112, (ctx, W, H) => {
    ctx.fillStyle = '#231f2b';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = NEON_PINK;
    ctx.lineWidth = 5;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 76px sans-serif';
    ctx.lineWidth = 8;
    ctx.lineJoin = 'round';
    ctx.strokeStyle = MARQUEE_RED;
    ctx.strokeText(text, W / 2, H / 2 + 4);
    ctx.fillStyle = BULB;
    ctx.fillText(text, W / 2, H / 2 + 4);
  }, { key: 'cinema-multiplex:letters:' + text, repeat: false });
}

// tall vertical totem sign: letters stacked top to bottom
function totemTexture(text) {
  return canvasTexture(64, 320, (ctx, W, H) => {
    ctx.fillStyle = MARQUEE_RED;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = BULB;
    for (let y = 8; y < H; y += 16) {
      ctx.beginPath(); ctx.arc(6, y, 3.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(W - 6, y, 3.5, 0, Math.PI * 2); ctx.fill();
    }
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 40px sans-serif';
    const step = H / (text.length + 0.4);
    [...text].forEach((ch, k) => ctx.fillText(ch, W / 2, step * (k + 0.7)));
  }, { key: 'cinema-multiplex:totem:' + text, repeat: false });
}

// neon band wrapped round a w x d box
function neonBand(w, d, h, color, intensity = 1.3) {
  return box(w + 0.12, h, d + 0.12, emissive(color, intensity));
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const r = rng(20);
  const g = new THREE.Group();
  g.add(lot([2, 1], 'paved'));

  const clad = cladding();
  const roofM = mat(DARK_TOP);
  const darkBox = (w, h, d) => box(w, h, d, [clad, clad, roofM, roofM, clad, clad]);

  // ---- auditorium box (windowless) ----
  const bw = 17, bd = 5.6, bz = -1.6, bh = 10;          // z -4.4 .. 1.2
  const front = bz + bd / 2;
  g.add(place(darkBox(bw, bh, bd), { y: y0, z: bz }));
  // taller stadium-seating hall at the back left
  const tw = 7.6, td = 4.4, tx = -4.7, tz = -2.2, th = 12.5;
  g.add(place(darkBox(tw, th, td), { x: tx, y: y0, z: tz }));
  // coping
  g.add(place(box(bw + 0.2, 0.35, bd + 0.2, mat('#4a4356')), { y: y0 + bh - 0.25, z: bz }));
  g.add(place(box(tw + 0.2, 0.35, td + 0.2, mat('#4a4356')), { x: tx, y: y0 + th - 0.25, z: tz }));

  // neon stripes round both volumes
  g.add(place(neonBand(bw, bd, 0.2, NEON_PINK), { y: y0 + 9.0, z: bz }));
  g.add(place(neonBand(bw, bd, 0.14, NEON_CYAN), { y: y0 + 9.45, z: bz }));
  g.add(place(neonBand(tw, td, 0.2, NEON_CYAN), { x: tx, y: y0 + 11.6, z: tz }));
  g.add(place(neonBand(bw, bd, 0.12, NEON_CYAN), { y: y0 + 0.35, z: bz }));
  // slanted neon stripes on the side walls
  for (const sx of [-1, 1]) {
    for (let k = 0; k < 3; k++) {
      g.add(place(box(0.08, 0.14, bd / Math.cos(Math.PI / 12) - 0.1, emissive(k === 1 ? NEON_CYAN : NEON_PINK, 1.3)), {
        x: sx * (bw / 2 + 0.04), y: y0 + 4.6 + k * 0.55, z: bz, rx: 15,
      }));
    }
  }

  // ---- big lit MULTIPLEX sign on the front face above the foyer ----
  g.add(place(box(11.4, 2.5, 0.3, mat('#231f2b')), { y: y0 + 6.35, z: front + 0.15 }));
  g.add(place(panel(letterSignTexture('MULTIPLEX'), 11.2, 2.3, 0.9), { y: y0 + 6.45, z: front + 0.31 }));

  // ---- glass foyer: see-through, with a lit lobby, mezzanine and escalator ----
  const fw = 12, fd = 2.6, fz = front + fd / 2;          // z 1.2 .. 3.8
  const ffront = fz + fd / 2;
  const fh = 6;
  const chrome = metal(PALETTE.chrome, { roughness: 0.3 });
  const warm = emissive('#fff0c8', 0.8);
  g.add(place(box(fw, 0.08, fd, mat('#e6dccb')), { y: y0, z: fz }));                      // terrazzo floor
  g.add(place(box(fw + 0.3, 0.3, fd + 0.15, [chrome, chrome, mat(PALETTE.concrete), warm, chrome, chrome]), { y: y0 + fh, z: fz + 0.05 }));
  g.add(place(box(fw + 0.06, 0.1, fd + 0.06, emissive(NEON_CYAN, 1.2)), { y: y0 + fh - 0.1, z: fz }));
  // mezzanine along the back with a glass balustrade
  const mzD = 1.2;
  const slab = mat('#d8d0c2');
  g.add(place(box(fw - 0.1, 0.25, mzD, [slab, slab, slab, warm, slab, slab]), { y: y0 + 2.9, z: front + mzD / 2 }));
  g.add(place(box(1.4, 0.25, fd - 0.3, [slab, slab, slab, warm, slab, slab]), { x: fw / 2 - 0.75, y: y0 + 2.9, z: front + (fd - 0.3) / 2 }));
  g.add(place(box(fw - 1.6, 0.9, 0.04, glass(PALETTE.glassSky, { opacity: 0.4 })), { x: -0.75, y: y0 + 3.15, z: front + mzD }));
  g.add(place(box(fw - 1.6, 0.06, 0.08, chrome), { x: -0.75, y: y0 + 4.05, z: front + mzD }));
  // escalator rising to the mezzanine landing
  const ez = front + mzD + 0.65;
  g.add(beam([0.6, y0 + 0.2, ez], [fw / 2 - 1.4, y0 + 3.05, ez], 0.9, mat(PALETTE.steelDark)));
  g.add(beam([0.6, y0 + 0.75, ez + 0.45], [fw / 2 - 1.4, y0 + 3.6, ez + 0.45], 0.1, mat('#16131c')));
  g.add(beam([0.6, y0 + 0.75, ez - 0.45], [fw / 2 - 1.4, y0 + 3.6, ez - 0.45], 0.1, mat('#16131c')));
  // concession stand with lit menu boards
  g.add(place(box(4.2, 1.05, 0.7, mat(MARQUEE_RED)), { x: -3.2, y: y0, z: front + 0.4 }));
  g.add(place(box(4.3, 0.08, 0.8, mat(PALETTE.white)), { x: -3.2, y: y0 + 1.05, z: front + 0.4 }));
  g.add(place(box(0.6, 0.55, 0.45, mat('#ffe9a8', { emissive: '#ffcc55', emissiveIntensity: 0.6 })), { x: -4.6, y: y0 + 1.13, z: front + 0.35 }));
  ['POPCORN', 'SODA', 'NACHOS'].forEach((t, k) => {
    g.add(place(panel(signTexture(t, { bg: '#16131c', fg: BULB, width: 128, height: 48 }), 1.25, 0.5, 0.9), { x: -4.6 + k * 1.4, y: y0 + 1.85, z: front + 0.02 }));
  });
  // posters up on the mezzanine wall
  [[-4.6, 0], [-2.6, 3], [-0.6, 5]].forEach(([x, i]) => {
    g.add(place(posterFrame(i, { w: 1.2, h: 1.7, y: 3.55 }), { x, y: y0, z: front }));
  });
  // glass skin + mullions
  const skin = glass(PALETTE.glassTeal, { opacity: 0.32 });
  g.add(place(box(fw, fh, 0.05, skin), { y: y0, z: ffront }));
  for (const sx of [-1, 1]) g.add(place(box(0.05, fh, fd, skin), { x: sx * fw / 2, y: y0, z: fz }));
  const mull = metal(PALETTE.steelLight);
  for (let k = 0; k <= 8; k++) g.add(place(box(0.12, fh, 0.12, mull), { x: -fw / 2 + k * (fw / 8), y: y0, z: ffront }));
  for (const sx of [-1, 1]) g.add(place(box(0.12, fh, 0.12, mull), { x: sx * fw / 2, y: y0, z: front + fd / 2 }));
  for (const yy of [0, 2.9, 4.6]) {
    g.add(place(box(fw + 0.1, 0.12, 0.12, mull), { y: y0 + yy, z: ffront }));
    for (const sx of [-1, 1]) g.add(place(box(0.12, 0.12, fd, mull), { x: sx * fw / 2, y: y0 + yy, z: fz }));
  }
  // entrance doors
  for (const x of [-1.5, 0, 1.5]) {
    g.add(place(box(1.3, 2.5, 0.1, glass(PALETTE.glassDark, { opacity: 0.6 })), { x, y: y0, z: ffront + 0.04 }));
    g.add(place(box(0.06, 0.6, 0.06, chrome), { x: x + 0.45, y: y0 + 0.9, z: ffront + 0.12 }));
  }
  g.add(place(box(4.6, 0.12, 0.14, mull), { y: y0 + 2.5, z: ffront + 0.04 }));

  // ---- marquee canopy over the doors ----
  const mw = 9, md = 1.15, mh = 1.25, my = y0 + 3.0;
  const mz = ffront + md / 2;
  const redM = mat(MARQUEE_RED);
  g.add(place(box(mw, mh, md, [redM, redM, redM, emissive('#fff1c4', 0.9), redM, redM]), { y: my, z: mz }));
  const fascia = panel(marqueeTexture('NOW SHOWING', '8 SCREENS  ·  3D  ·  IMAX'), mw, mh, 0.6);
  g.add(place(fascia, { y: my, z: mz + md / 2 + 0.01 }));
  for (const sx of [-1, 1]) {
    // bulb rows on the canopy ends
    const end = panel(marqueeTexture('CINEMA', ''), md, mh, 0.6);
    g.add(place(end, { x: sx * (mw / 2 + 0.01), y: my, z: mz, ry: sx * 90 }));
  }

  // ---- poster frames ----
  let pi = 0;
  for (const sx of [-1, 1]) {
    // front wall either side of the foyer
    g.add(place(posterFrame(pi++, { w: 1.5, h: 2.3, y: 0.9 }), { x: sx * 7.25, y: y0, z: front }));
    // along the side walls
    for (const z of [-3.1, -0.4]) {
      g.add(place(posterFrame(pi++, { w: 1.5, h: 2.3, y: 0.9 }), { x: sx * bw / 2, y: y0, z: bz + z + 1.6, ry: sx * 90 }));
    }
  }
  // two posters behind the foyer glass, on the box face above the side doors
  g.add(place(posterFrame(4, { w: 1.6, h: 2.2, y: 3.4 }), { x: -7.25, y: y0, z: front }));
  g.add(place(posterFrame(5, { w: 1.6, h: 2.2, y: 3.4 }), { x: 7.25, y: y0, z: front }));

  // ---- totem sign at the front right corner ----
  const totX = 9.0, totZ = 2.3;
  g.add(place(box(1.0, 0.4, 0.8, mat(PALETTE.concreteDark)), { x: totX, y: y0, z: totZ }));
  g.add(place(box(0.8, 6.2, 0.5, redM), { x: totX, y: y0 + 0.4, z: totZ }));
  for (const [ry, dx, dz] of [[0, 0, 0.26], [180, 0, -0.26], [90, 0.41, 0], [-90, -0.41, 0]]) {
    const wv = Math.abs(dx) > 0 ? 0.5 : 0.8;
    g.add(place(panel(totemTexture('CINEMA'), wv, 6.0, 0.6), { x: totX + dx, y: y0 + 0.5, z: totZ + dz, ry }));
  }
  g.add(place(box(1.0, 0.2, 0.7, emissive(NEON_PINK, 1.2)), { x: totX, y: y0 + 6.6, z: totZ }));
  g.add(place(sphere(0.3, emissive(BULB, 1.3), 10), { x: totX, y: y0 + 6.8, z: totZ }));

  // ---- back: fire exits ----
  const back = bz - bd / 2;
  for (const x of [-5.5, 4.5]) {
    g.add(place(door({ w: 1.6, h: 2.3, color: PALETTE.steelDark }), { x, y: y0, z: back, ry: 180 }));
    g.add(place(box(0.7, 0.3, 0.1, emissive('#2fd060', 1)), { x, y: y0 + 2.6, z: back - 0.05 }));
  }
  // slanted neon stripes and louvred vents on the back wall
  for (let k = 0; k < 3; k++) {
    g.add(place(box(bw / Math.cos(Math.PI / 12) - 0.6, 0.14, 0.08, emissive(k === 1 ? NEON_CYAN : NEON_PINK, 1.3)), {
      y: y0 + 4.6 + k * 0.55, z: back - 0.04, rz: 8,
    }));
  }
  for (const x of [-1.5, 1.5, 6]) {
    g.add(place(box(1.6, 1.0, 0.08, mat(PALETTE.steelDark)), { x, y: y0 + 7.3, z: back - 0.04 }));
    for (let k = 0; k < 4; k++) g.add(place(box(1.5, 0.06, 0.14, mat(PALETTE.steel)), { x, y: y0 + 7.42 + k * 0.22, z: back - 0.07 }));
  }

  // ---- roof plant ----
  const plant = mat(PALETTE.lightGrey);
  const fan = mat(PALETTE.darkGrey);
  for (const [x, z, w, d, h] of [[1.8, -3.2, 2.2, 1.6, 1.1], [4.6, -3.2, 2.2, 1.6, 1.1], [6.4, -0.2, 1.6, 1.6, 0.8]]) {
    g.add(place(box(w, h, d, plant), { x, y: y0 + bh, z }));
    g.add(place(cylinder(0.5, 0.5, 0.12, fan, 10), { x, y: y0 + bh + h, z }));
  }
  g.add(pipe([1.8, y0 + bh + 0.5, -2.2], [1.8, y0 + bh + 0.5, 0.2], 0.25, metal(PALETTE.steel)));
  g.add(pipe([1.8, y0 + bh + 0.5, 0.2], [4.6, y0 + bh + 0.5, 0.2], 0.25, metal(PALETTE.steel)));
  // projection-booth vents on the tall hall
  g.add(place(box(2.4, 1.0, 1.6, plant), { x: tx - 1.6, y: y0 + th, z: tz - 0.6 }));
  g.add(place(cylinder(0.35, 0.35, 1.4, mat(PALETTE.steel), 8), { x: tx + 1.8, y: y0 + th, z: tz - 0.8 }));
  g.add(place(cylinder(0.5, 0.35, 0.3, mat(PALETTE.steelDark), 8), { x: tx + 1.8, y: y0 + th + 1.4, z: tz - 0.8 }));

  // ---- forecourt ----
  g.add(place(patch(fw + 2, 1.2, mat('#7a2030')), { y: y0, z: ffront + 0.6 }));        // red carpet strip
  // queue stanchions with red rope
  const postM = metal(PALETTE.chrome, { roughness: 0.25 });
  const ropeM = mat(MARQUEE_RED);
  const posts = [-5, -3.6, -2.6];
  for (const sx of [-1, 1]) {
    for (const x of posts) g.add(place(cylinder(0.05, 0.08, 0.95, postM, 6), { x: sx * -x, y: y0 + 0.05, z: ffront + 0.9 }));
    for (let k = 0; k < posts.length - 1; k++) {
      const x0 = sx * -posts[k], x1 = sx * -posts[k + 1];
      g.add(place(box(Math.abs(x1 - x0), 0.06, 0.06, ropeM), { x: (x0 + x1) / 2, y: y0 + 0.8, z: ffront + 0.9 }));
    }
  }
  // moviegoers queueing and strolling
  const skins = ['#e8b98f', '#a8724a', '#f0cfa8', '#6b4630'];
  const clothes = [PALETTE.blue, PALETTE.yellow, PALETTE.purple, PALETTE.green, PALETTE.white, PALETTE.orange, PALETTE.navy];
  [[-4.3, 4.45], [-3.1, 4.3], [-2.2, 4.5], [-0.6, 4.6], [3.2, 4.35], [4.4, 4.5], [-6.0, 3.0], [7.9, 4.3], [-2.8, 2.6], [1.0, 2.0], [-4.4, 1.5]].forEach(([x, z], i) => {
    g.add(place(cylinder(0.17, 0.21, 1.15, mat(clothes[i % clothes.length]), 7), { x, y: y0 + 0.05, z }));
    g.add(place(sphere(0.15, mat(skins[i % skins.length]), 7), { x, y: y0 + 1.33, z }));
  });
  // popcorn cart (left)
  const cx = -8.9, cz = 2.6;
  g.add(place(box(1.0, 0.9, 0.7, mat(MARQUEE_RED)), { x: cx, y: y0 + 0.25, z: cz }));
  g.add(place(box(0.9, 0.7, 0.6, mat('#ffe9a8', { emissive: '#ffcc55', emissiveIntensity: 0.5 })), { x: cx, y: y0 + 1.15, z: cz }));
  g.add(place(box(1.2, 0.12, 0.9, mat(PALETTE.white)), { x: cx, y: y0 + 1.85, z: cz }));
  for (const sx of [-1, 1]) g.add(place(cylinder(0.22, 0.22, 0.1, mat(PALETTE.black), 10), { x: cx + sx * 0.38, y: y0 + 0.22, z: cz + 0.3, rx: 90 }));

  // planters with trees, lamps and benches in the side strips
  for (const sx of [-1, 1]) {
    g.add(place(box(1.2, 0.5, 1.2, mat(PALETTE.stoneDark)), { x: sx * 9.25, y: y0, z: sx < 0 ? 4.3 : -0.7 }));
    g.add(place(tree({ kind: 'poplar', h: 5, seed: sx > 0 ? 4 : 9 }), { x: sx * 9.25, y: y0 + 0.5, z: sx < 0 ? 4.3 : -0.7 }));
    g.add(place(streetLamp({ h: 4.2 }), { x: sx * 6.8, y: y0, z: 4.75, ry: sx > 0 ? 180 : 0 }));
  }
  g.add(place(bench({ w: 1.5 }), { x: -9.3, y: y0, z: 0.6, ry: 90 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 }), { x: -9.3, y: y0, z: -2.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: 9.3, y: y0, z: -3.6 }));
  // dumpster behind on the right, bike rack on the left
  g.add(place(box(1.0, 1.0, 1.4, mat(PALETTE.green)), { x: 9.3, y: y0, z: -2.2 }));
  g.add(place(box(1.08, 0.1, 1.48, mat(PALETTE.darkGrey)), { x: 9.3, y: y0 + 1.0, z: -2.2 }));
  for (let k = 0; k < 4; k++) {
    g.add(place(box(0.06, 0.6, 0.9, metal(PALETTE.steel)), { x: -9.6 + r.range(-0.02, 0.02), y: y0, z: -3.9 + k * 0.45 }));
  }
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, boxFaces, place, group, cylinder, cone, beam,
  gableRoof, door, windowPanel, tree, streetLamp, fence, truck,
  mat, metal, surface, textured, canvasTexture, signTexture, shade, cylinderGeometry,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Timber mill shed in the middle, log yard + infeed deck on the left (-x),
// sawdust silo fed by an inclined conveyor on the right, plank stacks in front.

const TIMBER = '#8f5a34';
const BARK = '#5e4129';
const CUT = '#e2bf86';
const SAWDUST = '#d8b779';

// vertical board-and-batten cladding, one repeat = 2 x 2 m
function boardMat() {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    const n = 8;
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = shade(TIMBER, ((i * 37) % 11) / 55 - 0.09);
      ctx.fillRect((i * w) / n, 0, w / n, h);
    }
    for (let i = 0; i < n; i++) {
      ctx.fillStyle = shade(TIMBER, -0.38);
      ctx.fillRect((i * w) / n, 0, 2, h);
      ctx.fillStyle = shade(TIMBER, 0.12);
      ctx.fillRect((i * w) / n + 2, 0, 1, h);
    }
  }, { key: 'sawmill:boards' });
  tex.repeat.set(0.5, 0.5);
  return textured(tex);
}

// plank ends seen on the short face of a lumber stack
function endGrainMat() {
  const tex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = shade(CUT, -0.45);
    ctx.fillRect(0, 0, w, h);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 4; x++) {
      ctx.fillStyle = shade(CUT, ((x * 3 + y * 5) % 7) / 40 - 0.05);
      ctx.fillRect(x * 16 + 1, y * 32 + 2, 14, 28);
    }
  }, { key: 'sawmill:endgrain' });
  tex.repeat.set(1, 1);
  return textured(tex);
}

// text sign facing +z; box UVs are in metres, so stretch the texture over the face
function nameBoard({ text, w, h, bg, fg, border }) {
  const tex = signTexture(text, { bg, fg, border, width: 256, height: Math.round(256 * h / w) }).clone();
  tex.repeat.set(1 / w, 1 / h);
  tex.needsUpdate = true;
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return box(w, h, 0.15, [side, side, side, side, face, side]);
}

// log lying along X, centred on its axis; base of the log at y = 0
function log(len, r, seed = 0) {
  const geo = cylinderGeometry(r, r * 0.92, len, 9);
  geo.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(geo, [mat(shade(BARK, ((seed * 7) % 5) / 40 - 0.05)), mat(CUT), mat(CUT)]);
  m.rotation.z = Math.PI / 2;
  m.position.y = r;
  return group(m);
}

// triangular pile of logs along X: rows bottom..top
function logPile(len, r, rows, seed = 1) {
  const g = new THREE.Group();
  const d = r * 2;
  for (let row = 0; row < rows; row++) {
    const n = rows - row + 1;
    for (let i = 0; i < n; i++) {
      const z = (i - (n - 1) / 2) * d;
      const jitter = (((seed + row * 5 + i * 3) % 7) - 3) * 0.06;
      g.add(place(log(len - Math.abs(jitter) * 2, r * (0.92 + ((i + row) % 3) * 0.04), seed + i + row), { x: jitter, y: row * d * 0.86, z }));
    }
  }
  return g;
}

// sticker-stacked pile of sawn planks, length along X
function lumberStack(len, depth, layers) {
  const g = new THREE.Group();
  const plank = surface('planks', '#d9b276', { size: 1.2 });
  const top = surface('planks', '#e0bd85', { size: 1.2 });
  const ends = endGrainMat();
  const sticker = mat(PALETTE.woodDark);
  const lh = 0.28, sh = 0.07;
  const bx = [-len / 2 + 0.3, 0, len / 2 - 0.3];
  for (const x of bx) g.add(place(box(0.18, 0.16, depth + 0.1, sticker), { x }));
  let y = 0.16;
  for (let i = 0; i < layers; i++) {
    g.add(place(boxFaces(len, lh, depth, { sides: plank, left: ends, right: ends, top }), { y }));
    y += lh;
    if (i < layers - 1) {
      for (const x of bx) g.add(place(box(0.08, sh, depth + 0.06, sticker), { x, y }));
      y += sh;
    }
  }
  return g;
}

// small yellow forklift, forks towards +x
function forklift() {
  const g = new THREE.Group();
  const body = mat(PALETTE.yellow, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  g.add(place(box(1.9, 0.75, 1.1, body), { y: 0.25 }));
  g.add(place(box(0.5, 0.45, 1.1, dark), { x: -0.75, y: 1.0 }));        // counterweight
  g.add(place(box(0.5, 0.35, 0.5, dark), { x: -0.1, y: 1.0 }));          // seat
  for (const [x, z] of [[0.45, 0.5], [0.45, -0.5], [-0.65, 0.5], [-0.65, -0.5]]) {
    g.add(beam([x, 1.0, z], [x, 2.15, z], 0.07, dark));
  }
  g.add(place(box(1.2, 0.06, 1.1, body), { x: -0.1, y: 2.15 }));         // overhead guard
  g.add(place(box(0.12, 2.6, 0.9, metal(PALETTE.steelDark)), { x: 1.0, y: 0.15 })); // mast
  const wheel = mat(PALETTE.black);
  for (const x of [0.55, -0.6]) for (const z of [0.58, -0.58]) {
    const w = cylinder(0.3, 0.3, 0.22, wheel, 10);
    g.add(place(group(place(w, { z: -0.11, rx: 90 })), { x, y: 0.3, z }));
  }
  return g;
}

// inclined belt conveyor between world points a (tail) and b (head)
function conveyor(a, b, y0) {
  const g = new THREE.Group();
  const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2];
  const run = Math.hypot(dx, dz);
  const L = Math.hypot(run, dy);
  const frame = metal(PALETTE.steelDark);
  const yellow = mat(PALETTE.orange, { roughness: 0.6 });
  const inner = new THREE.Group();
  inner.add(place(box(L, 0.35, 0.9, yellow), { x: L / 2, y: -0.35 }));         // stringer
  inner.add(place(box(L, 0.06, 0.7, mat(PALETTE.black)), { x: L / 2, y: 0 }));   // belt
  inner.add(place(box(L, 0.05, 1.1, surface('corrugated', PALETTE.steel, { size: 0.8 })), { x: L / 2, y: 0.55 })); // hood
  for (let i = 0; i <= Math.round(L / 1.2); i++) {
    const x = Math.min(L, i * 1.2);
    for (const z of [0.5, -0.5]) inner.add(beam([x, 0, z], [x, 0.55, z], 0.05, frame));
  }
  // sawdust riding on the belt
  for (let i = 1; i < L - 0.5; i += 0.9) inner.add(place(box(0.5, 0.08, 0.45, mat(SAWDUST)), { x: i, y: 0.06 }));
  const pitch = new THREE.Group();
  pitch.rotation.z = Math.atan2(dy, run);
  pitch.add(inner);
  const yaw = new THREE.Group();
  yaw.rotation.y = Math.atan2(-dz, dx);
  yaw.position.set(...a);
  yaw.add(pitch);
  g.add(yaw);
  // trestle legs
  for (const t of [0.35, 0.72]) {
    const x = a[0] + dx * t, z = a[2] + dz * t, y = a[1] + dy * t - 0.75;
    const nx = -dz / run * 0.45, nz = dx / run * 0.45;
    g.add(beam([x + nx, y0, z + nz], [x + nx, y, z + nz], 0.14, frame));
    g.add(beam([x - nx, y0, z - nz], [x - nx, y, z - nz], 0.14, frame));
    g.add(beam([x + nx, y0 + 0.4, z + nz], [x - nx, y - 0.2, z - nz], 0.08, frame));
  }
  // head housing over the silo
  g.add(place(box(1.0, 0.9, 1.0, yellow), { x: b[0], y: b[1] - 0.5, z: b[2] }));
  g.add(place(box(0.5, 0.6, 0.5, frame), { x: b[0], y: b[1] - 1.1, z: b[2] }));
  return g;
}

// elevated sawdust silo: legs, hopper cone, corrugated bin, conical roof
function sawdustSilo({ r = 1.5, legH = 2.0, hopperH = 1.0, h = 2.9 } = {}) {
  const g = new THREE.Group();
  const body = surface('corrugated', '#b9c3c9', { size: 1, metalness: 0.3, roughness: 0.55 });
  const steel = metal(PALETTE.steel);
  const dark = metal(PALETTE.steelDark);
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + (i * Math.PI) / 2;
    g.add(place(box(0.2, legH + hopperH, 0.2, dark), { x: Math.cos(a) * r * 0.85, z: Math.sin(a) * r * 0.85 }));
  }
  for (const [ax, az] of [[1, 0], [0, 1]]) {
    const k = r * 0.85 * Math.SQRT1_2;
    g.add(beam([-k * (ax || 1), 0.3, -k * (az || 1)], [k * (ax ? 1 : -1), legH, k * (az ? 1 : -1)], 0.08, dark));
  }
  g.add(place(cylinder(r, 0.35, hopperH, steel, 16), { y: legH }));
  g.add(place(cylinder(0.3, 0.3, 0.6, dark, 10), { y: legH - 0.6 }));         // discharge spout
  g.add(place(cylinder(r, r, h, body, 18), { y: legH + hopperH }));
  g.add(place(cylinder(r + 0.06, r + 0.06, 0.15, steel, 18), { y: legH + hopperH + h - 0.15 }));
  g.add(place(cone(r * 1.06, 0.7, steel, 18), { y: legH + hopperH + h }));
  // ladder up the side (+x)
  const lx = r + 0.25;
  for (const z of [-0.22, 0.22]) g.add(beam([lx, legH, z], [lx, legH + hopperH + h + 0.3, z], 0.05, dark));
  for (let y = legH + 0.2; y < legH + hopperH + h; y += 0.35) g.add(beam([lx, y, -0.22], [lx, y, 0.22], 0.04, dark));
  // painted band + label
  g.add(place(cylinder(r + 0.02, r + 0.02, 0.35, mat(PALETTE.red), 18), { y: legH + hopperH + h - 0.9 }));
  return g;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'dirt'));
  g.add(place(patch(9.6, 3.6, 'gravel'), { x: -0.6, y: y0, z: 3.15 }));
  g.add(place(patch(5.6, 9.6, 'gravel'), { x: 7.0, y: y0, z: 0 }));

  // ---- mill shed -------------------------------------------------------
  const sx = -0.5, sz = -1.6, sw = 9, sd = 5.6, wallH = 4.2;
  const front = sz + sd / 2, left = sx - sw / 2, right = sx + sw / 2;
  const boards = boardMat();
  const trim = mat(PALETTE.woodDark);
  const dark = mat('#2a1e15');
  g.add(place(box(sw + 0.2, 0.4, sd + 0.2, mat(PALETTE.concrete)), { x: sx, y: y0, z: sz }));
  g.add(place(boxFaces(sw, wallH, sd, { sides: boards, top: trim }), { x: sx, y: y0 + 0.4, z: sz }));
  const roofY = y0 + 0.4 + wallH;
  const roofMat = surface('corrugated', '#56707e', { size: 1.4, metalness: 0.2, roughness: 0.6 });
  g.add(place(gableRoof({ w: sw, d: sd, h: 2.2, overhang: 0.45, ridge: 'x', material: roofMat, gableMaterial: boards }), { x: sx, y: roofY, z: sz }));
  // ridge ventilator
  g.add(place(box(5, 0.55, 0.9, boards), { x: sx, y: roofY + 1.9, z: sz }));
  g.add(place(gableRoof({ w: 5, d: 0.9, h: 0.4, overhang: 0.2, ridge: 'x', material: roofMat, gableMaterial: boards }), { x: sx, y: roofY + 2.45, z: sz }));
  // corner posts and belly band
  for (const [x, z] of [[left, front], [right, front], [left, sz - sd / 2], [right, sz - sd / 2]]) {
    g.add(place(box(0.3, wallH, 0.3, trim), { x, y: y0 + 0.4, z }));
  }
  for (const zz of [sz - sd / 2 - 0.05]) g.add(place(box(sw + 0.1, 0.18, 0.1, trim), { x: sx, y: y0 + 2.6, z: zz }));
  for (const xx of [left - 0.05, right + 0.05]) g.add(place(box(0.1, 0.18, sd + 0.1, trim), { x: xx, y: y0 + 2.6, z: sz }));
  // back and gable windows
  for (const x of [-3.2, -0.5, 2.2]) g.add(place(windowPanel({ w: 1.0, h: 0.9, frame: PALETTE.white }), { x, y: y0 + 1.4, z: sz - sd / 2, ry: 180 }));
  g.add(place(windowPanel({ w: 0.9, h: 0.8, frame: PALETTE.white }), { x: left, y: y0 + 4.6, z: sz, ry: -90 }));
  g.add(place(windowPanel({ w: 0.9, h: 0.8, frame: PALETTE.white }), { x: right, y: y0 + 4.6, z: sz, ry: 90 }));
  g.add(place(windowPanel({ w: 1.0, h: 0.9, frame: PALETTE.white }), { x: right, y: y0 + 1.4, z: -3.0, ry: 90 }));

  // front: big sawing bay with an outfeed roller table, sliding door, windows
  const bayX = -2.6, bayW = 3.2, bayH = 2.7;
  g.add(place(box(bayW, bayH, 0.12, dark), { x: bayX, y: y0 + 0.4, z: front }));
  g.add(place(box(bayW + 0.3, 0.2, 0.2, trim), { x: bayX, y: y0 + 0.4 + bayH, z: front + 0.05 }));
  g.add(place(box(5.2, 0.12, 0.12, metal(PALETTE.steelDark)), { x: bayX + 1.6, y: y0 + 0.4 + bayH + 0.3, z: front + 0.12 })); // door rail
  const slide = new THREE.Group();
  slide.add(box(1.9, bayH + 0.1, 0.12, boards));
  slide.add(place(box(1.9, 0.14, 0.16, trim), { y: 0.3 }));
  slide.add(place(box(1.9, 0.14, 0.16, trim), { y: bayH - 0.3 }));
  slide.add(beam([-0.85, 0.35, 0.08], [0.85, bayH - 0.35, 0.08], 0.14, trim));
  g.add(place(slide, { x: bayX + bayW / 2 + 1.05, y: y0 + 0.4, z: front + 0.12 }));
  g.add(place(nameBoard({ text: 'SAWMILL', w: 3.4, h: 0.75, bg: '#f2e2b8', fg: '#5a2e12', border: '#5a2e12' }), { x: bayX, y: y0 + 0.4 + bayH + 0.25, z: front + 0.02 }));
  g.add(place(windowPanel({ w: 1.0, h: 1.0, frame: PALETTE.white }), { x: 1.9, y: y0 + 1.5, z: front }));
  g.add(place(door({ w: 0.9, h: 2.1, color: PALETTE.green, frame: PALETTE.white }), { x: 3.15, y: y0 + 0.4, z: front }));
  g.add(place(box(1.3, 0.4, 0.7, mat(PALETTE.concrete)), { x: 3.15, y: y0, z: front + 0.4 }));
  // roller table carrying a fresh-sawn cant out of the bay
  const steelDk = metal(PALETTE.steelDark);
  const tableL = 3.4, tz = front + tableL / 2;
  for (const x of [bayX - 0.6, bayX + 0.6]) {
    g.add(place(box(0.12, 0.12, tableL, steelDk), { x, y: y0 + 0.75, z: tz }));
    for (const z of [front + 0.4, front + tableL - 0.2]) g.add(place(box(0.1, 0.75, 0.1, steelDk), { x, y: y0, z }));
  }
  for (let z = front + 0.3; z < front + tableL; z += 0.4) {
    const rl = cylinder(0.07, 0.07, 1.3, metal(PALETTE.steelLight), 8);
    g.add(place(group(place(rl, { x: 0.65, rz: 90 })), { x: bayX, y: y0 + 0.9, z }));
  }
  g.add(place(boxFaces(0.6, 0.45, 3.0, { sides: mat(CUT), front: mat(shade(CUT, 0.08)), top: mat(shade(CUT, 0.04)) }), { x: bayX, y: y0 + 0.97, z: front + 1.1 }));

  // left gable: log infeed opening and chain deck
  const deckZ = -3.1;
  g.add(place(box(0.12, 1.8, 2.4, dark), { x: left - 0.02, y: y0 + 0.6, z: deckZ }));
  g.add(place(box(0.2, 0.2, 2.8, trim), { x: left - 0.05, y: y0 + 2.4, z: deckZ }));
  const deckA = -9.6, deckLen = left - deckA - 0.1;
  const tilt = Math.atan2(0.5, deckLen);
  const deck = new THREE.Group();
  for (const z of [-1.1, 0, 1.1]) deck.add(place(box(deckLen, 0.18, 0.18, mat(PALETTE.red)), { x: deckLen / 2, z }));
  for (const z of [-1.1, 1.1]) deck.add(place(box(deckLen, 0.35, 0.1, steelDk), { x: deckLen / 2, y: -0.3, z: z * 1.1 }));
  for (let i = 0; i < 4; i++) {
    const L = 2.3 + (i % 2) * 0.2;
    deck.add(place(group(place(log(L, 0.26, i), { ry: 90 })), { x: 0.6 + i * 1.05, y: 0.18 }));
  }
  const deckG = new THREE.Group();
  deckG.add(deck);
  deck.rotation.z = tilt;
  g.add(place(deckG, { x: deckA, y: y0 + 0.75, z: deckZ }));
  for (const x of [deckA + 0.3, deckA + deckLen * 0.55]) for (const z of [-1.2, 1.2]) {
    g.add(place(box(0.14, 0.75 + (x - deckA) * Math.tan(tilt) - 0.25, 0.14, steelDk), { x, y: y0, z: deckZ + z }));
  }

  // ---- log yard (left) ------------------------------------------------
  g.add(place(logPile(4.0, 0.34, 4, 3), { x: -7.6, y: y0, z: 0.0 }));
  const pile2 = logPile(2.4, 0.3, 3, 8);
  g.add(place(pile2, { x: -7.7, y: y0, z: 3.4, ry: 90 }));
  g.add(place(log(3.2, 0.32, 2), { x: -4.2, y: y0, z: 4.3, ry: 18 }));
  // bark mulch heap
  g.add(place(cone(0.9, 0.7, mat(shade(BARK, -0.05)), 9), { x: -9.2, y: y0, z: 1.9 }));

  // ---- sawdust silo + conveyor (right) --------------------------------
  const siloX = 7.9, siloZ = -2.7;
  const silo = sawdustSilo({ r: 1.5, legH: 2.0, hopperH: 1.0, h: 2.9 });
  g.add(place(silo, { x: siloX, y: y0, z: siloZ }));
  const siloTop = y0 + 2.0 + 1.0 + 2.9 + 0.7;
  g.add(conveyor([right + 0.2, y0 + 2.6, 0.2], [siloX, siloTop + 0.9, siloZ], y0));
  // conveyor tail hopper on the shed's right gable
  g.add(place(box(0.7, 1.0, 1.4, metal(PALETTE.steel)), { x: right + 0.3, y: y0 + 2.0, z: 0.2 }));
  // sawdust spilled under the silo spout + heap with wheelbarrow
  g.add(place(cylinder(0.3, 1.1, 0.45, mat(SAWDUST), 12), { x: siloX, y: y0, z: siloZ }));
  g.add(place(cone(1.1, 0.9, mat(SAWDUST), 12), { x: 5.3, y: y0, z: -4.0 }));

  // ---- plank stacks + forklift (front right) --------------------------
  g.add(place(lumberStack(3.4, 1.2, 4), { x: 5.0, y: y0, z: 2.4 }));
  g.add(place(lumberStack(3.4, 1.2, 3), { x: 5.0, y: y0, z: 4.15 }));
  g.add(place(lumberStack(2.4, 1.1, 5), { x: 8.6, y: y0, z: 2.4 }));
  g.add(place(lumberStack(2.4, 1.1, 2), { x: 8.6, y: y0, z: 4.1 }));
  const fk = forklift();
  fk.add(place(lumberStack(1.4, 0.9, 1), { x: 1.75, y: 0.3, ry: 90 }));
  for (const z of [-0.3, 0.3]) fk.add(place(box(1.2, 0.05, 0.12, metal(PALETTE.steelDark)), { x: 1.65, y: 0.3, z }));
  g.add(place(fk, { x: 0.6, y: y0, z: 3.4, ry: 0 }));

  // ---- odds and ends --------------------------------------------------
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.7, y: y0, z: 2.4 }));
  g.add(place(tree({ kind: 'cone', h: 5, seed: 11 }), { x: 8.9, y: y0, z: 0.3 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: 4.8, y: y0, z: -2.2 }));
  g.add(place(fence({ w: 19.4, d: 9.4, h: 1.0, style: 'wire', sides: ['back'] }), { y: y0 }));
  return g;
}

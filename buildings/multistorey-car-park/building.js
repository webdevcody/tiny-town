import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, box, place, mat, metal, emissive, surface, car, door,
  streetLamp, tree, hedge, canvasTexture, signTexture, textured, cylinder,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z.
// Open parking structure on the left 16 m, stair tower + entrance lane on the right.

const LEVEL = 2.8;             // deck-to-deck height
const LEVELS = 4;              // decks above ground (the last one is the open roof deck)
const SLAB = 0.35;
const X0 = -9.6, X1 = 6.4;     // parking structure extent along x
const Z0 = -4.6, Z1 = 4.6;     // and along z
const AISLE = 1.3;             // half-width of the central driving aisle
const COLS_X = [-9.4, -5.4, -1.4, 2.6, 6.2];
const CAR_SCALE = 0.62;

// Scissor ramps in the aisle: even ramps rise towards +x on the left half, odd ramps towards -x on the right half.
const RAMP_A = [-8.7, -1.6];
const RAMP_B = [-1.2, 5.7];
const rampSpan = (i) => (i % 2 === 0 ? RAMP_A : RAMP_B);

const concrete = () => surface('concrete', PALETTE.concrete, { size: 6 });
const deckTop = () => surface('asphalt', '#6d6d70', { size: 4, roughness: 0.95 });

/** Sloped slab between two points along x (y measured at the top surface). */
function rampSlab(xa, ya, xb, yb, width, thick, material) {
  const len = Math.hypot(xb - xa, yb - ya);
  const geo = new THREE.BoxGeometry(len, thick, width);
  geo.translate(0, -thick / 2, 0);
  const m = new THREE.Mesh(geo, material);
  m.position.set((xa + xb) / 2, (ya + yb) / 2, 0);
  m.rotation.z = Math.atan2(yb - ya, xb - xa);
  return m;
}

/** Painted arrow on a deck pointing towards +x (flat, 0.02 thick). */
function arrow(len = 1.6) {
  const m = mat(PALETTE.roadLine);
  const g = new THREE.Group();
  g.add(place(box(len * 0.6, 0.02, 0.22, m), { x: -len * 0.2 }));
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.42, 0.02, 3), m);
  head.position.set(len * 0.2, 0.01, 0);
  g.add(head);
  return g;
}

/** Glazed stair-tower face: blue glass with zig-zag flights and landings. */
function stairGlassTexture() {
  return canvasTexture(128, 512, (ctx, W, H) => {
    ctx.fillStyle = '#4f86b8';
    ctx.fillRect(0, 0, W, H);
    const flights = 5;
    const fh = H / flights;
    ctx.strokeStyle = '#d9d4c7';
    ctx.lineWidth = 9;
    for (let i = 0; i < flights; i++) {
      const y0 = H - i * fh;
      ctx.beginPath();
      if (i % 2 === 0) { ctx.moveTo(10, y0 - 12); ctx.lineTo(W - 10, y0 - fh * 0.5); }
      else { ctx.moveTo(W - 10, y0 - 12); ctx.lineTo(10, y0 - fh * 0.5); }
      ctx.stroke();
      ctx.fillStyle = '#d9d4c7';
      ctx.fillRect(0, y0 - 10, W, 10);
    }
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, H * 0.25); ctx.lineTo(W * 0.5, 0); ctx.lineTo(W * 0.8, 0); ctx.lineTo(0, H * 0.4);
    ctx.fill();
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 6;
    ctx.strokeRect(0, 0, W, H);
    ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  }, { key: 'multistorey-car-park:stair-glass', repeat: false });
}

/** Box (base at y = 0) with 0..1 UVs on every face, so a non-repeating texture fills each face. */
function unitBox(w, h, d, materials) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), materials);
}

/** Sign board, text on +z (and -z if double). Like the lib sign() but the text fills the whole face at any size. */
function board({ text, w, h, bg = PALETTE.blue, fg = '#ffffff', depth = 0.15, double = false, border = null }) {
  const tw = 256, th = Math.max(16, Math.round(tw / (w / h)));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return unitBox(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

/** Blue square "P" parking sign, both faces. */
function pSign(size = 1.6, depth = 0.2) {
  return board({ text: 'P', w: size, h: size, depth, double: true, border: '#ffffff' });
}

export default function build() {
  const r = rng(66);
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  const slabM = concrete();
  const colM = mat(PALETTE.concrete);
  const edgeM = mat('#cfcac0');
  const stripeM = mat(PALETTE.blue);
  const lineM = mat(PALETTE.roadLine);
  const yellowM = mat(PALETTE.yellow);
  const W = X1 - X0, CX = (X0 + X1) / 2;

  // ---- ground level floor: asphalt with an entry lane on the right
  g.add(place(box(W, 0.06, Z1 - Z0, deckTop()), { x: CX, y: y0 }));
  g.add(place(patch(3.0, 6.4, 'asphalt'), { x: 8.2, y: y0, z: 1.8 }));
  g.add(place(patch(3.6, 2.6, 'asphalt'), { x: 8.0, y: y0, z: 0 }));

  const parkRow = (level, yTop) => {
    // bays: 2 per column gap, front and back rows; cars nose-in from the aisle
    for (let c = 0; c < COLS_X.length - 1; c++) {
      const xa = COLS_X[c], xb = COLS_X[c + 1];
      const bw = (xb - xa) / 2;
      for (const side of [-1, 1]) {
        const zc = side * (AISLE + 1.45);
        for (let b = 0; b <= 2; b++) {
          g.add(place(box(0.08, 0.02, 2.6, lineM), { x: xa + b * bw, y: yTop + 0.01, z: zc }));
        }
        for (let b = 0; b < 2; b++) {
          if (!r.chance(level === LEVELS ? 0.45 : 0.7)) continue;
          const c3 = car({ color: r.pick(['#c0392b', '#2f6fbf', '#f2f2f2', '#2b2b2b', '#e9c31f', '#7f8c8d', '#2e8b57', '#c9d3db', '#e67e22']), kind: r.chance(0.12) ? 'van' : 'car' });
          c3.scale.setScalar(CAR_SCALE);
          g.add(place(c3, { x: xa + (b + 0.5) * bw, y: yTop + 0.02, z: zc, ry: side > 0 ? -90 : 90 }));
        }
      }
    }
  };

  // ---- decks
  for (let lv = 0; lv <= LEVELS; lv++) {
    const yTop = y0 + 0.06 + lv * LEVEL;
    if (lv > 0) {
      // slab with a hole over the ramp arriving from below
      const [hx0, hx1] = rampSpan(lv - 1);
      const top = deckTop();
      const mats = [slabM, slabM, top, slabM, slabM, slabM];
      const piece = (x0, x1, z0, z1) => {
        if (x1 - x0 < 0.01 || z1 - z0 < 0.01) return;
        g.add(place(new THREE.Mesh(new THREE.BoxGeometry(x1 - x0, SLAB, z1 - z0).translate(0, SLAB / 2, 0), mats),
          { x: (x0 + x1) / 2, y: yTop - SLAB, z: (z0 + z1) / 2 }));
      };
      piece(X0, X1, Z0, -AISLE);
      piece(X0, X1, AISLE, Z1);
      piece(X0, hx0, -AISLE, AISLE);
      piece(hx1, X1, -AISLE, AISLE);

      // spandrel walls round the deck edge, with a blue band
      const sh = 1.0, st = 0.22;
      const runs = [
        { w: W, d: st, x: CX, z: Z1 - st / 2 },
        { w: W, d: st, x: CX, z: Z0 + st / 2 },
        { w: st, d: Z1 - Z0, x: X0 + st / 2, z: 0 },
        { w: st, d: Z1 - Z0, x: X1 - st / 2, z: 0 },
      ];
      for (const s of runs) {
        g.add(place(box(s.w, sh, s.d, edgeM), { x: s.x, y: yTop - SLAB, z: s.z }));
        g.add(place(box(s.w + 0.04, 0.22, s.d + 0.04, stripeM), { x: s.x, y: yTop + sh - SLAB - 0.32, z: s.z }));
      }
      // ramp guard kerbs on the long sides of the hole
      for (const zs of [-AISLE, AISLE]) g.add(place(box(hx1 - hx0, 0.5, 0.15, edgeM), { x: (hx0 + hx1) / 2, y: yTop, z: zs }));
    }

    // columns up to the next deck (not above the roof deck)
    if (lv < LEVELS) {
      const ch = LEVEL - SLAB;
      for (const x of COLS_X) for (const z of [Z0 + 0.2, -AISLE - 0.12, AISLE + 0.12, Z1 - 0.2]) {
        g.add(place(box(0.34, ch, 0.34, colM), { x, y: yTop, z }));
      }
    }

    // ramp up to the next deck
    if (lv < LEVELS) {
      const [ra, rb] = rampSpan(lv);
      const up = lv % 2 === 0;
      const rampM = surface('asphalt', '#7a7a7c', { size: 4 });
      const xa = up ? ra : rb, xb = up ? rb : ra;
      g.add(rampSlab(xa, yTop + (lv === 0 ? 0.03 : 0), xb, yTop + LEVEL, AISLE * 2 - 0.1, lv === 0 ? 0.12 : 0.3, rampM));
      // yellow edge lines on the ramp
      for (const zs of [-AISLE + 0.2, AISLE - 0.2]) {
        const ln = rampSlab(xa, yTop + 0.02, xb, yTop + LEVEL + 0.02, 0.1, 0.02, yellowM);
        ln.position.z = zs;
        g.add(ln);
      }
      // painted arrow before the ramp foot
      g.add(place(arrow(1.6), { x: up ? xa - 0.6 : xa + 0.6, y: yTop, ry: up ? 0 : 180 }));
    }

    parkRow(lv, yTop);
  }

  // ---- roof deck extras: lamp posts and a ramp-exit arrow
  const roofY = y0 + 0.06 + LEVELS * LEVEL;
  for (const [x, z, ry] of [[-7.4, Z1 - 0.4, -90], [0.6, Z1 - 0.4, -90], [-7.4, Z0 + 0.4, 90], [0.6, Z0 + 0.4, 90]]) {
    g.add(place(streetLamp({ h: 3.2 }), { x, y: roofY, z, ry }));
  }

  // ---- stair & lift tower (back right)
  const TX = 8.2, TZ = -3.05, TW = 3.0, TD = 3.1;
  const towerH = LEVELS * LEVEL + 2.9;
  const brick = surface('brick', PALETTE.brick, { size: 1.2 });
  const glassFace = textured(stairGlassTexture(), { roughness: 0.3, metalness: 0.2 });
  const roofM = mat(PALETTE.concreteDark);
  g.add(place(box(TW, towerH, TD, [brick, brick, roofM, roofM, brick, brick]), { x: TX, y: y0, z: TZ }));
  // glazed stair window on the front (+z) and right (+x) faces
  g.add(place(unitBox(1.1, towerH - 3.2, 0.08, glassFace), { x: TX + 0.75, y: y0 + 2.8, z: TZ + TD / 2 + 0.03 }));
  g.add(place(unitBox(0.08, towerH - 3.2, 1.2, glassFace), { x: TX + TW / 2 + 0.03, y: y0 + 2.8, z: TZ - 0.75 }));
  // concrete corner piers and cap
  for (const [dx, dz] of [[-1, 1], [1, 1], [1, -1], [-1, -1]]) {
    g.add(place(box(0.3, towerH + 0.2, 0.3, colM), { x: TX + dx * (TW / 2 - 0.1), y: y0, z: TZ + dz * (TD / 2 - 0.1) }));
  }
  g.add(place(box(TW + 0.3, 0.35, TD + 0.3, colM), { x: TX, y: y0 + towerH, z: TZ }));
  // lift motor room on top
  g.add(place(box(1.6, 1.2, 1.6, mat(PALETTE.concrete)), { x: TX - 0.5, y: y0 + towerH + 0.35, z: TZ - 0.4 }));
  // ground floor door + canopy
  g.add(place(door({ w: 1.1, h: 2.1, color: PALETTE.steelLight }), { x: TX + 0.5, y: y0, z: TZ + TD / 2 }));
  g.add(place(box(1.8, 0.12, 0.9, stripeM), { x: TX + 0.5, y: y0 + 2.35, z: TZ + TD / 2 + 0.45 }));
  // big P signs at the top of the tower
  g.add(place(pSign(1.5, 0.12), { x: TX - 0.6, y: y0 + towerH - 2.4, z: TZ + TD / 2 + 0.08 }));
  g.add(place(pSign(1.5, 0.12), { x: TX + TW / 2 + 0.08, y: y0 + towerH - 2.4, z: TZ + 0.65, ry: 90 }));

  // ---- entrance: barrier, ticket machine, height bar, signs
  const entX = X1 + 0.15;
  // height-limit gantry over the aisle entry
  const gantryM = mat(PALETTE.yellow);
  g.add(place(box(0.2, 2.3, 0.2, gantryM), { x: entX + 0.9, y: y0, z: -AISLE - 0.05 }));
  g.add(place(box(0.2, 2.3, 0.2, gantryM), { x: entX + 0.9, y: y0, z: AISLE + 0.05 }));
  g.add(place(box(0.22, 0.35, AISLE * 2 + 0.3, surface('hazard', PALETTE.yellow, { size: 0.8 })), { x: entX + 0.9, y: y0 + 2.3 }));
  // barrier arm in/out
  const armM = surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 0.6 });
  for (const [z, len] of [[0.6, 1.1], [-0.6, 1.1]]) {
    g.add(place(box(0.35, 1.0, 0.35, mat(PALETTE.yellow)), { x: entX + 2.3, y: y0, z: z + (z > 0 ? 0.6 : -0.6) }));
  }
  g.add(place(box(0.1, 0.1, 1.2, armM), { x: entX + 2.3, y: y0 + 0.9, z: 0.6 }));
  g.add(place(box(0.1, 0.1, 1.2, armM), { x: entX + 2.3, y: y0 + 0.9, z: -0.6 }));
  // ticket machine
  g.add(place(box(0.45, 1.3, 0.4, mat(PALETTE.steelLight)), { x: entX + 2.9, y: y0, z: 1.6 }));
  g.add(place(box(0.3, 0.3, 0.05, emissive('#7fd4ff', 0.6)), { x: entX + 2.65, y: y0 + 0.9, z: 1.6, ry: -90 }));
  // "CAR PARK" sign over the entrance on the first-deck spandrel (right end) and front fascia
  g.add(place(board({ text: 'CAR PARK', w: 2.6, h: 0.7, depth: 0.1 }), { x: X1 + 0.06, y: y0 + LEVEL - 0.3, z: 0, ry: 90 }));
  g.add(place(board({ text: 'CAR PARK', w: 4.4, h: 0.9, bg: PALETTE.navy, depth: 0.1 }), { x: -1.4, y: y0 + LEVEL - 0.42, z: Z1 + 0.08 }));
  // P pylon at the street corner
  g.add(place(cylinder(0.08, 0.1, 3.2, metal(PALETTE.steelDark), 8), { x: 9.4, y: y0, z: 4.55 }));
  g.add(place(pSign(1.1, 0.12), { x: 9.4, y: y0 + 3.0, z: 4.55, ry: -30 }));
  // entry/exit arrows on the lane
  g.add(place(arrow(1.4), { x: 7.6, y: y0 + 0.05, z: 3.2, ry: 90 }));
  g.add(place(arrow(1.4), { x: 8.8, y: y0 + 0.05, z: 3.2, ry: -90 }));
  g.add(place(box(0.1, 0.02, 3.4, lineM), { x: 8.2, y: y0 + 0.05, z: 3.2 }));

  // ---- pedestrian side: pay machine, bollards, planting
  g.add(place(box(0.5, 1.5, 0.4, mat(PALETTE.blue)), { x: 9.55, y: y0, z: -0.9, ry: -90 }));
  g.add(place(box(0.08, 0.35, 0.3, emissive('#ffe680', 0.6)), { x: 9.3, y: y0 + 0.9, z: -0.9 }));
  for (let i = 0; i < 4; i++) g.add(place(cylinder(0.09, 0.09, 0.8, yellowM, 6), { x: 6.85, y: y0, z: 2.0 + i * 0.85 }));
  g.add(place(hedge({ w: W - 1.0, h: 0.6, d: 0.35 }), { x: CX - 0.5, y: y0, z: 4.82 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 12 }), { x: 9.55, y: y0, z: 1.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: X1 - 0.2, y: y0, z: 4.55 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 6.85, y: y0, z: 4.75, ry: 0 }));

  return g;
}

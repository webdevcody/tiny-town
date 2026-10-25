import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  group, lot, patch, facadeBlock, box, place, cylinder, pipe, beam, lattice, tree, car, streetLamp,
  sign, surface, mat, metal, water, emissive, ShapeBuilder, canvasTexture, textured, shade, rng,
} from '../../src/lib/index.js';

// 3x1 tiles (30 x 10 m). Front (downstream) faces +z, the reservoir lies behind (-z).
// A concrete arch dam spans the valley between two grassy hillsides; the arch bows
// upstream. Gated spillway right of centre, turbine house at the toe on the left.

const y0 = LOT_HEIGHT;
const H = 9; // dam crest height above the lot
const SPILL = 7; // spillway crest height
const POOL = 8; // reservoir level
const R = 24; // upstream face radius
const ZC = -3.2 + R; // arch centre (downstream, off-tile)
const T_BASE = 2.8, T_TOP = 1.6; // wall thickness at base / crest
const THETA = Math.asin(12.6 / R); // half angle: ends bury into the hills

// arch point at angle a and radius r -> [x, z]
const arc = (a, r) => [r * Math.sin(a), ZC - r * Math.cos(a)];
const thick = (h) => T_BASE + (T_TOP - T_BASE) * (h / H);
const angleAt = (x) => Math.asin(x / R);

// --- local textures -------------------------------------------------------

function tiledTex(tex, sx, sy = sx) {
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / sx, 1 / sy);
  t.needsUpdate = true;
  return t;
}

// cast-concrete with lift lines and contraction joints (one repeat = 4 x 3 m)
function damConcrete() {
  const tex = canvasTexture(128, 96, (ctx, w, h) => {
    ctx.fillStyle = '#c9c4b8';
    ctx.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let i = 0; i < 260; i++) {
      ctx.fillStyle = r.chance(0.5) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.06)';
      ctx.fillRect(r.int(0, w), r.int(0, h), r.int(2, 8), r.int(1, 4));
    }
    ctx.fillStyle = 'rgba(80,74,64,0.35)';
    ctx.fillRect(0, 0, w, 2); // lift line
    ctx.fillRect(0, h / 2, w, 1);
    ctx.fillRect(0, 0, 2, h); // contraction joint
    ctx.fillStyle = 'rgba(90,96,90,0.18)'; // streaks
    for (let i = 0; i < 6; i++) ctx.fillRect(r.int(4, w - 4), 0, 2, r.int(h / 3, h));
  }, { key: 'hydro-dam:concrete' });
  return textured(tiledTex(tex, 4, 3), { roughness: 0.9 });
}

// white-water streaks running down the spillway chute (v runs downhill)
function cascadeMat() {
  const tex = canvasTexture(64, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#9fd8ec');
    g.addColorStop(1, '#e8f7fc');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = r.chance(0.6) ? 'rgba(255,255,255,0.85)' : 'rgba(110,190,220,0.6)';
      ctx.fillRect(r.int(0, w), r.int(0, h), r.int(1, 4), r.int(12, 50));
    }
  }, { key: 'hydro-dam:cascade' });
  return textured(tiledTex(tex, 2, 4), { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex, roughness: 0.3 });
}

// cut-away of the reservoir at the back tile edge: water darkening with depth over a silt bed
function reservoirSection() {
  const tex = canvasTexture(64, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#5cc0de');
    g.addColorStop(0.08, '#3ea6c8');
    g.addColorStop(0.7, '#1f5f86');
    g.addColorStop(0.78, '#6e5236');
    g.addColorStop(1, '#5e4630');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, h);
    const r = rng(11);
    ctx.fillStyle = 'rgba(255,255,255,0.18)';
    for (let i = 0; i < 18; i++) ctx.fillRect(r.int(0, w), r.int(4, h * 0.6), r.int(6, 18), 1);
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    for (let i = 0; i < 30; i++) ctx.fillRect(r.int(0, w), r.int(h * 0.8, h), r.int(2, 6), r.int(1, 3));
  }, { key: 'hydro-dam:section' });
  const t = tex.clone();
  t.wrapS = THREE.RepeatWrapping;
  t.wrapT = THREE.ClampToEdgeWrapping;
  t.needsUpdate = true;
  return textured(t, { roughness: 0.4 });
}

function foamMat() {
  const tex = canvasTexture(64, 64, (ctx, w, h) => {
    ctx.fillStyle = '#7cc6de';
    ctx.fillRect(0, 0, w, h);
    const r = rng(5);
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = r.chance(0.7) ? 'rgba(255,255,255,0.9)' : 'rgba(200,240,250,0.8)';
      ctx.beginPath();
      ctx.arc(r.int(0, w), r.int(0, h), r.range(1, 4), 0, Math.PI * 2);
      ctx.fill();
    }
  }, { key: 'hydro-dam:foam' });
  return textured(tiledTex(tex, 3), { roughness: 0.3 });
}

// --- local geometry helpers -----------------------------------------------

// Heightfield hillside: top surface over [x0,x1] x [z0,z1] plus skirts down to 0.
function terrain(x0, x1, z0, z1, nx, nz, hf, topM, sideM) {
  const b = new ShapeBuilder();
  const X = (i) => x0 + ((x1 - x0) * i) / nx;
  const Z = (j) => z0 + ((z1 - z0) * j) / nz;
  const P = (i, j) => [X(i), hf(X(i), Z(j)), Z(j)];
  for (let i = 0; i < nx; i++) {
    for (let j = 0; j < nz; j++) {
      b.tri(P(i, j), P(i, j + 1), P(i + 1, j + 1), 0);
      b.tri(P(i, j), P(i + 1, j + 1), P(i + 1, j), 0);
    }
  }
  const skirt = (a, c) => {
    if (a[1] < 0.01 && c[1] < 0.01) return;
    b.quad([a[0], 0, a[2]], [c[0], 0, c[2]], c, a, 1);
  };
  for (let i = 0; i < nx; i++) {
    skirt(P(i, nz), P(i + 1, nz)); // front
    skirt(P(i + 1, 0), P(i, 0)); // back
  }
  for (let j = 0; j < nz; j++) {
    skirt(P(nx, j + 1), P(nx, j)); // right
    skirt(P(0, j), P(0, j + 1)); // left
  }
  return new THREE.Mesh(b.build(), [topM, sideM]);
}

// One curved band of the dam between angles a0..a1 and heights h0..h1.
function damBand(b, a0, a1, h0, h1, segs, { top = true, up = true, down = true } = {}) {
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segs, t1 = a0 + ((a1 - a0) * (i + 1)) / segs;
    const U = (a, h) => { const [x, z] = arc(a, R); return [x, h, z]; };
    const D = (a, h) => { const [x, z] = arc(a, R - thick(h)); return [x, h, z]; };
    if (up) b.quad(U(t1, h0), U(t0, h0), U(t0, h1), U(t1, h1), 0); // upstream face (-z)
    if (down) b.quad(D(t0, h0), D(t1, h0), D(t1, h1), D(t0, h1), 0); // downstream face (+z)
    if (top) b.quad(D(t0, h1), D(t1, h1), U(t1, h1), U(t0, h1), 1);
  }
}

// Curved strip offset just outside the downstream face (cascading water).
function chute(a0, a1, h0, h1, off, material, segs = 3) {
  const b = new ShapeBuilder();
  for (let i = 0; i < segs; i++) {
    const t0 = a0 + ((a1 - a0) * i) / segs, t1 = a0 + ((a1 - a0) * (i + 1)) / segs;
    const D = (a, h) => { const [x, z] = arc(a, R - thick(h) - off); return [x, h, z]; };
    b.quadUV(D(t0, h0), D(t1, h0), D(t1, h1), D(t0, h1), [[0, 0], [1, 0], [1, 1], [0, 1]].map(([u, v]) => [u * (t1 - t0) * R / 2, v * 1.5]));
  }
  return new THREE.Mesh(b.build(), material);
}

// Object placed on the arch: at angle a, radius r, rotated to face downstream.
function onArc(obj, a, r, y, ry = 0) {
  const [x, z] = arc(a, r);
  return place(group(obj), { x, y, z, ry: ry - THREE.MathUtils.radToDeg(a) });
}

export default function build() {
  const g = new THREE.Group();
  g.add(lot([3, 1], 'grass'));

  const concrete = damConcrete();
  const concreteDark = mat(PALETTE.concreteDark);
  const steelM = metal(PALETTE.steelDark);
  const gateM = mat('#3f6f8f', { roughness: 0.5, metalness: 0.3 });
  const railM = mat(PALETTE.white);
  const grassM = surface('grass', PALETTE.grass, { size: 4 });
  const earthM = mat(shade(PALETTE.dirt, -0.1));
  const waterM = water(PALETTE.water);
  const deepM = water(PALETTE.waterDeep);

  // --- valley sides: hills at both ends, high at the back -----------------
  const hill = (x, z) => {
    const ax = Math.abs(x);
    const sx = THREE.MathUtils.clamp((ax - 10.2) / 2.6, 0, 1);
    const sz = THREE.MathUtils.clamp((4.8 - z) / 4.2, 0.18, 1);
    return y0 + (H + 1.2) * Math.pow(sx, 0.8) * sz + (sx > 0 ? 0.02 : 0);
  };
  g.add(terrain(-15, -10, -5, 5, 8, 12, hill, grassM, earthM));
  g.add(terrain(10, 15, -5, 5, 8, 12, hill, grassM, earthM));

  // --- reservoir: raised water body behind the arch -----------------------
  {
    const pts = [[-13.5, -5], [13.5, -5]];
    for (let i = 0; i <= 16; i++) {
      const a = THETA - (2 * THETA * i) / 16;
      const [x, z] = arc(a, R - 0.05);
      pts.push([x, z]);
    }
    const shape = new ShapeBuilder();
    // top water surface
    const b = new THREE.Mesh(
      (() => {
        const geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))));
        geo.rotateX(-Math.PI / 2);
        return geo;
      })(),
      deepM
    );
    b.position.y = y0 + POOL;
    g.add(b);
    // cut earth face at the back tile edge
    shape.quadUV([13.5, 0, -5], [-13.5, 0, -5], [-13.5, y0 + POOL, -5], [13.5, y0 + POOL, -5], [[0, 0], [9, 0], [9, 1], [0, 1]]);
    g.add(new THREE.Mesh(shape.build(), reservoirSection()));
    // a little floating debris boom in front of the spillway
    const boomR = R + 1.2;
    for (let i = 0; i < 9; i++) {
      const a = angleAt(1.5) + (i / 8) * (angleAt(8.5) - angleAt(1.5));
      g.add(onArc(box(0.7, 0.25, 0.25, mat(i % 2 ? PALETTE.orange : PALETTE.white)), a, boomR, y0 + POOL - 0.05));
    }
  }

  // --- the arch dam --------------------------------------------------------
  const sA0 = angleAt(1.6), sA1 = angleAt(8.6); // spillway section
  {
    const b = new ShapeBuilder();
    damBand(b, -THETA, sA0, 0, H, 14);
    damBand(b, sA1, THETA, 0, H, 6);
    damBand(b, sA0, sA1, 0, SPILL, 6);
    const m = new THREE.Mesh(b.build(), [concrete, concreteDark]);
    m.position.y = y0;
    g.add(m);
  }

  // crest road: asphalt deck with white railings both sides, lamps
  {
    const b = new ShapeBuilder();
    const segs = 24;
    for (let i = 0; i < segs; i++) {
      const t0 = -THETA + (2 * THETA * i) / segs, t1 = -THETA + (2 * THETA * (i + 1)) / segs;
      const A = (a, r) => { const [x, z] = arc(a, r); return [x, 0, z]; };
      b.quad(A(t0, R - T_TOP - 0.35), A(t1, R - T_TOP - 0.35), A(t1, R + 0.2), A(t0, R + 0.2), 0);
    }
    const deck = new THREE.Mesh(b.build(), mat(PALETTE.asphalt, { roughness: 0.95 }));
    deck.position.y = y0 + H + 0.02;
    g.add(deck);
    // deck edge slab to cover the spillway opening (road bridge over the gates)
    const bb = new ShapeBuilder();
    damBand(bb, sA0, sA1, H - 0.6, H, 6, { up: true, down: true, top: false });
    g.add(place(new THREE.Mesh(bb.build(), concreteDark), { y: y0 }));
    // railings
    for (const r of [R + 0.15, R - T_TOP - 0.3]) {
      const n = 26;
      let prev = null;
      for (let i = 0; i <= n; i++) {
        const a = -THETA * 0.93 + (2 * THETA * 0.93 * i) / n;
        const [x, z] = arc(a, r);
        const p = [x, y0 + H + 0.8, z];
        g.add(place(box(0.08, 0.8, 0.08, railM), { x, y: y0 + H, z }));
        if (prev) g.add(beam(prev, p, 0.07, railM));
        prev = p;
      }
    }
    for (const x of [-9, -3.5, 10]) g.add(onArc(place(streetLamp({ h: 3 }), { ry: 90 }), angleAt(x), R - T_TOP - 0.25, y0 + H));
    g.add(onArc(place(car({ color: PALETTE.red }), { s: 0.55 }), angleAt(-6.5), R - 0.95, y0 + H + 0.02));
    g.add(onArc(place(car({ color: PALETTE.blue, kind: 'van' }), { s: 0.55, ry: 180 }), angleAt(11), R - 0.35, y0 + H + 0.02));
  }

  // spillway piers, radial gates and hoist houses
  {
    const nb = 4;
    const pierA = (k) => sA0 + ((sA1 - sA0) * k) / nb;
    for (let k = 0; k <= nb; k++) {
      const a = pierA(k);
      const len = thick(SPILL) + 0.9;
      // pier nose sticks out upstream, body along the chute
      g.add(onArc(box(0.7, H + 1.8 - SPILL + 0.1, len, concrete), a, R - thick(SPILL) / 2 + 0.45, y0 + SPILL - 0.1));
      g.add(onArc(box(0.75, 0.3, len + 0.1, concreteDark), a, R - thick(SPILL) / 2 + 0.45, y0 + H + 1.8));
      // training walls running down the face
      for (let h = 0; h < SPILL; h += 1.75) {
        g.add(onArc(box(0.5, 1.75, 0.6, concrete), a, R - thick(h + 0.9) - 0.15, y0 + h));
      }
    }
    // gantry beam + hoist houses above the piers
    for (let k = 0; k < nb; k++) {
      const a = (pierA(k) + pierA(k + 1)) / 2;
      const span = (pierA(k + 1) - pierA(k)) * R - 0.7;
      const open = k === 1 || k === 2;
      g.add(onArc(box(span * 0.7, 1.0, 1.2, mat(PALETTE.cream)), a, R - 0.1, y0 + H + 2.1));
      g.add(onArc(box(span * 0.7 + 0.2, 0.14, 1.4, mat(PALETTE.roofGreen)), a, R - 0.1, y0 + H + 3.1));
      g.add(onArc(box(0.45, 0.4, 0.05, mat(PALETTE.window)), a, R + 0.52, y0 + H + 2.4));
      g.add(onArc(box(0.45, 0.4, 0.05, mat(PALETTE.window)), a, R - 0.72, y0 + H + 2.4, 180));
      // gate: closed sits on the spillway crest, open is hoisted up under the gantry
      const gy = open ? y0 + H - 0.6 + 0.05 : y0 + SPILL;
      const gh = open ? 1.9 : POOL - SPILL + 0.5;
      g.add(onArc(box(span, gh, 0.25, gateM), a, R + 0.35, gy));
      for (let s = 0.4; s < gh; s += 0.5) g.add(onArc(box(span, 0.08, 0.12, steelM), a, R + 0.52, gy + s));
      if (open) {
        // water spilling over the crest and down the face
        const da = 0.35 / R;
        const a0 = pierA(k) + da, a1 = pierA(k + 1) - da;
        g.add(chute(a0, a1, 0, SPILL + 0.15, 0.08, cascadeMat()));
        const lip = new ShapeBuilder();
        for (const [t0, t1] of [[a0, a1]]) {
          const P = (a, r, h) => { const [x, z] = arc(a, r); return [x, h, z]; };
          lip.quad(P(t0, R - thick(SPILL) - 0.08, SPILL + 0.15), P(t1, R - thick(SPILL) - 0.08, SPILL + 0.15), P(t1, R + 0.3, POOL - 0.1), P(t0, R + 0.3, POOL - 0.1));
        }
        g.add(place(new THREE.Mesh(lip.build(), cascadeMat()), { y: y0 }));
      }
    }
  }

  // --- stilling basin and river flowing out to the front --------------------
  const toeZ = (x) => arc(angleAt(x), R - T_BASE)[1];
  {
    const bx0 = 1.2, bx1 = 9.0;
    const pts = [];
    for (let i = 0; i <= 8; i++) {
      const x = bx0 + ((bx1 - bx0) * i) / 8;
      pts.push([x, toeZ(x) - 0.2]);
    }
    // basin outline downstream of the toe, narrowing into the river
    pts.push([bx1, 3.0], [7.6, 5], [2.4, 5], [bx0, 3.0]);
    const basin = new THREE.Mesh(
      (() => {
        const geo = new THREE.ShapeGeometry(new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z))));
        geo.rotateX(-Math.PI / 2);
        return geo;
      })(),
      waterM
    );
    basin.position.y = y0 + 0.08;
    g.add(basin);
    // concrete basin walls
    g.add(place(box(0.35, 0.6, 3.5, concrete), { x: bx0 - 0.15, y: y0, z: 1.3, ry: 0 }));
    g.add(place(box(0.35, 0.6, 2.6, concrete), { x: bx1 + 0.15, y: y0, z: 1.7 }));
    // foam where the chutes land
    for (const x of [3.9, 5.75]) {
      const a = angleAt(x);
      g.add(onArc(box(2.0, 0.12, 1.6, foamMat()), a, R - T_BASE - 0.8, y0 + 0.06));
    }
    g.add(place(box(4.2, 0.1, 1.2, foamMat()), { x: 4.9, y: y0 + 0.06, z: 2.8 }));
    // rocks along the river banks
    const r = rng(19);
    for (let i = 0; i < 10; i++) {
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.25, 0.5), 0), mat(r.pick([PALETTE.stone, PALETTE.stoneDark, PALETTE.gravel])));
      const left = i % 2 === 0;
      const z = r.range(2.2, 4.7);
      s.position.set(left ? r.range(0.4, 1.3) : r.range(8.4, 9.4), y0 + 0.1, z);
      s.scale.y = 0.6;
      g.add(s);
    }
  }

  // --- turbine house at the toe, left of the spillway -----------------------
  {
    const cx = -4.8;
    const a = angleAt(cx);
    const ry = -THREE.MathUtils.radToDeg(a);
    const [hx, hz] = arc(a, R - T_BASE - 1.55);
    const hw = 8.6, hd = 3.0, hh = 4.4;
    const house = new THREE.Group();
    house.add(facadeBlock({ w: hw, d: hd, h: hh, floorHeight: hh / 2, style: 'industrial', wall: PALETTE.brick, glass: PALETTE.window, frame: PALETTE.offWhite, bay: 1.45, windowW: 0.55, windowH: 0.62, lit: 0.25, seed: 31, roof: PALETTE.concreteDark, blank: ['back'] }));
    // flat roof with parapet + crane rail
    house.add(place(box(hw + 0.3, 0.35, hd + 0.3, concreteDark), { y: hh }));
    house.add(place(box(hw - 0.6, 0.6, 0.25, mat(PALETTE.yellow)), { y: hh + 0.35, z: -0.6 }));
    house.add(place(box(1.6, 0.9, 1.4, mat(PALETTE.steelLight)), { x: -2.8, y: hh + 0.35, z: 0.6 }));
    house.add(place(box(1.6, 0.9, 1.4, mat(PALETTE.steelLight)), { x: 2.8, y: hh + 0.35, z: 0.6 }));
    // name board and big roller doors
    house.add(place(sign({ text: 'HYDRO POWER', w: 4.2, h: 0.7, bg: PALETTE.navy, fg: '#ffffff' }), { y: hh - 0.9, z: hd / 2 + 0.05 }));
    house.add(place(box(1.8, 2.2, 0.08, surface('corrugated', PALETTE.steelLight, { size: 1 })), { x: 3.4, y: 0, z: hd / 2 + 0.02 }));
    house.add(place(box(1.8, 0.12, 0.6, concreteDark), { x: 3.4, y: 2.3, z: hd / 2 + 0.3 }));
    // tailrace outflow arches with churned water
    for (const x of [-3.2, -1.0, 1.2]) {
      house.add(place(box(1.6, 0.9, 0.12, mat('#1c2a33')), { x, y: 0, z: hd / 2 + 0.02 }));
    }
    house.add(place(box(6.8, 0.1, 1.4, foamMat()), { x: -1.0, y: 0.03, z: hd / 2 + 0.7 }));
    g.add(place(house, { x: hx, y: y0, z: hz, ry }));

    // tailrace channel running from the house to the river
    g.add(place(patch(5.6, 1.0, 'water'), { x: -2.4, y: y0, z: 4.45 }));
    g.add(place(box(5.8, 0.35, 0.25, concrete), { x: -2.4, y: y0, z: 3.85 + 0.0 + 0 - 0.0 }));
    g.add(place(patch(2.0, 0.6, 'water'), { x: 1.4, y: y0 + 0.01, z: 4.7 }));

    // penstocks: three steel pipes down the dam face into the house roof
    for (const x of [-7.6, -4.6, -1.6]) {
      const aa = angleAt(x);
      const top = arc(aa, R - thick(7.6) - 0.35);
      const bot = arc(aa, R - T_BASE - 0.9);
      const pm = metal(PALETTE.rust, { roughness: 0.6 });
      g.add(pipe([top[0], y0 + 7.6, top[1]], [bot[0], y0 + 4.6, bot[1]], 0.42, pm));
      g.add(onArc(box(1.2, 1.0, 0.8, concreteDark), aa, R - thick(7.6) - 0.3, y0 + 7.2)); // intake block
    }
    // intake towers / trash racks on the reservoir side
    for (const x of [-7.6, -4.6, -1.6]) {
      g.add(onArc(box(1.4, H - POOL + 0.6, 0.6, concrete), angleAt(x), R + 0.3, y0 + POOL - 0.3));
      g.add(onArc(box(1.2, 0.4, 0.08, steelM), angleAt(x), R + 0.62, y0 + POOL + 0.1));
    }
  }

  // --- transformers + pylon on the left hill, control hut on the right hill --
  {
    const ty = hill(-13.4, 3.2);
    g.add(place(box(2.8, 0.2, 2.6, concrete), { x: -13.0, y: ty - 0.05, z: 3.2 }));
    for (const z of [2.5, 3.9]) {
      g.add(place(box(1.0, 1.1, 0.9, mat(PALETTE.steel)), { x: -13.2, y: ty + 0.15, z }));
      for (const dx of [-0.3, 0, 0.3]) g.add(place(cylinder(0.06, 0.08, 0.6, mat(PALETTE.white), 6), { x: -13.2 + dx, y: ty + 1.25, z }));
      g.add(place(box(0.15, 0.9, 0.8, mat(PALETTE.steelDark)), { x: -12.6, y: ty + 0.2, z }));
    }
    const py = hill(-13.2, -1.5);
    g.add(place(lattice({ w: 1.4, h: 8.5, topW: 0.45, segments: 4, thickness: 0.1, material: metal(PALETTE.steel) }), { x: -13.2, y: py, z: -1.5 }));
    g.add(place(box(0.15, 0.15, 4.2, metal(PALETTE.steel)), { x: -13.2, y: py + 7.2, z: -1.5 }));
    g.add(place(box(0.15, 0.15, 3.0, metal(PALETTE.steel)), { x: -13.2, y: py + 8.3, z: -1.5 }));
    for (const [z, y] of [[-3.5, 7.2], [0.5, 7.2], [-2.9, 8.3], [-0.1, 8.3]]) {
      g.add(place(cylinder(0.08, 0.08, 0.5, mat(PALETTE.white), 6), { x: -13.2, y: py + y - 0.5, z }));
    }
    // cables from the transformers up to the pylon
    for (const z of [-3.5, 0.5]) g.add(beam([-13.2, ty + 1.5, 3.2], [-13.2, py + 6.7, z], 0.04, mat(PALETTE.black)));

    // control building on the right abutment, at crest level
    const cy = hill(13.3, -2.0);
    g.add(place(facadeBlock({ w: 3.0, d: 2.8, floors: 1, style: 'punched', wall: PALETTE.cream, glass: PALETTE.window, frame: PALETTE.white, bay: 1.5, lit: 0.3, seed: 4, roof: PALETTE.concreteDark }), { x: 13.3, y: cy - 0.1, z: -2.2 }));
    g.add(place(box(3.3, 0.25, 3.1, mat(PALETTE.roofRed)), { x: 13.3, y: cy - 0.1 + 3, z: -2.2 }));
    g.add(place(cylinder(0.05, 0.05, 2.2, metal(PALETTE.steelLight), 6), { x: 14.3, y: cy + 2.9, z: -3.0 }));
    g.add(place(box(0.7, 0.45, 0.04, mat(PALETTE.blue)), { x: 14.65, y: cy + 4.6, z: -3.0 }));
  }

  // --- trees and rocks on the hills ---------------------------------------
  {
    const spots = [
      [-14.0, -4.0, 'cone'], [-11.9, -4.0, 'cone'], [-13.6, 0.9, 'cone'], [-11.4, 3.5, 'round'], [-14.2, 4.3, 'bush'],
      [11.8, -3.6, 'cone'], [14.0, 0.8, 'cone'], [12.0, 1.8, 'cone'], [13.1, 3.4, 'round'], [11.2, 4.3, 'bush'],
      [-9.6, 4.4, 'bush'], [9.8, 3.8, 'bush'],
    ];
    spots.forEach(([x, z, kind], i) => {
      g.add(place(tree({ kind, h: kind === 'bush' ? 1.2 : 4 + (i % 3) * 0.6, seed: 40 + i }), { x, y: hill(x, z) - 0.05, z }));
    });
    const r = rng(23);
    for (let i = 0; i < 8; i++) {
      const left = i % 2 === 0;
      const x = (left ? -1 : 1) * r.range(11.0, 14.6), z = r.range(-3.5, 4.5);
      const s = new THREE.Mesh(new THREE.IcosahedronGeometry(r.range(0.35, 0.7), 0), mat(r.pick([PALETTE.stone, PALETTE.stoneDark])));
      s.position.set(x, hill(x, z), z);
      s.scale.y = 0.6;
      g.add(s);
    }
    // small viewing spot with a lamp at the front-left grass
    g.add(place(streetLamp({ h: 3 }), { x: -9.4, y: y0, z: 2.6, ry: -90 }));
  }

  return g;
}

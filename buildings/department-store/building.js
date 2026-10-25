import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, prismBlock, facadeCylinder, extrude, box, cylinder, cone, sphere, place, group,
  dome, awning, door, rooftopUnits, taperedBlock, flag, streetLamp, bench, tree,
  mat, metal, glass, surface, textured, canvasTexture, signTexture, rng, shade,
} from '../../src/lib/index.js';

// 2x1 tiles (20 x 10 m). Front (street) faces +z; the clock turret sits on the front-right corner.

const GF = 4.5; // tall ground floor with the display windows
const UF = 3.2; // three upper sales floors
const UPPER = 3;
const ATTIC = 3; // fifth storey above the main cornice
const CORNICE_Y = GF + UPPER * UF; // 14.1
const ATTIC_Y = CORNICE_Y + 0.5;
const TOP_Y = ATTIC_Y + ATTIC; // 17.6
const ROOF_Y = TOP_Y + 0.5; // 18.1

// main block: X0..X1 x Z0..Z1 with the front-right corner cut off (the turret covers it)
const X0 = -8.8, X1 = 8.8, Z0 = -4.6, Z1 = 2.6, CUT = 2.4;
const K = Math.tan(Math.PI / 8);
function outline(m = 0) {
  return [
    [X0 - m, Z1 + m], [X1 - CUT + K * m, Z1 + m], [X1 + m, Z1 - CUT + K * m], [X1 + m, Z0 - m], [X0 - m, Z0 - m],
  ];
}

// clock turret
const TX = 7.0, TZ = 0.8, TR = 2.2;

const STONE = PALETTE.cream;
const TRIM = shade(PALETTE.cream, -0.12);
const CANOPY = PALETTE.green;
const CANOPY2 = shade(PALETTE.green, -0.22);
const BRONZE = '#2f4a3a';

const upperFacade = { style: 'punched', wall: STONE, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.62, windowH: 0.68, bay: 2.4, lit: 0.18, seed: 19 };
const atticFacade = { ...upperFacade, windowW: 0.36, windowH: 0.5, lit: 0.1, seed: 23 };

// Box with 0..1 UVs on every face (lib boxes use metre UVs, which clamp one-off canvas textures).
function unitBox(w, h, d, materials) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, materials);
}

// Text board facing +z.
function board({ text, w, h, depth = 0.15, bg = BRONZE, fg = '#f2d27a', border = null }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.2, emissiveMap: tex });
  const side = mat(bg);
  return unitBox(w, h, depth, [side, side, side, side, face, side]);
}

// lit shop window full of mannequins, with a small-paned transom on top
function displayTexture(seed) {
  return canvasTexture(128, 160, (ctx, W, H) => {
    const r = rng(seed);
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, '#fff1c4');
    grad.addColorStop(1, '#e3b56a');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    // back drape
    ctx.fillStyle = r.pick(['#b8484a', '#4a6fa8', '#7a4d9a', '#3a8a5a']);
    ctx.globalAlpha = 0.35;
    ctx.fillRect(0, 34, W, 70);
    ctx.globalAlpha = 1;
    // floor
    ctx.fillStyle = '#8a5a3a';
    ctx.fillRect(0, H - 22, W, 22);
    // mannequins
    const n = 3;
    for (let i = 0; i < n; i++) {
      const cx = 22 + i * 42 + r.range(-4, 4);
      const top = 54 + r.range(-4, 6);
      const col = r.pick([PALETTE.red, PALETTE.blue, PALETTE.purple, PALETTE.orange, PALETTE.green, '#e8e0d0', PALETTE.navy, '#d06a9a']);
      ctx.fillStyle = '#3a3030';
      ctx.fillRect(cx - 1, H - 40, 3, 20);
      ctx.fillRect(cx - 8, H - 22, 17, 3);
      ctx.fillStyle = col;
      ctx.beginPath();
      ctx.moveTo(cx - 7, top + 10);
      ctx.lineTo(cx + 7, top + 10);
      ctx.lineTo(cx + 13, H - 40);
      ctx.lineTo(cx - 13, H - 40);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = shade(col, -0.25);
      ctx.fillRect(cx - 7, top + 10, 14, 6);
      ctx.fillStyle = '#f2e6d8';
      ctx.beginPath();
      ctx.arc(cx, top + 3, 6, 0, Math.PI * 2);
      ctx.fill();
      if (r.chance(0.5)) {
        ctx.fillStyle = r.pick(['#2a2a2a', '#b03030', '#e9c31f']);
        ctx.fillRect(cx - 8, top - 5, 16, 3);
        ctx.fillRect(cx - 5, top - 9, 10, 5);
      }
    }
    // transom lights
    ctx.fillStyle = '#3a5068';
    ctx.fillRect(0, 0, W, 28);
    ctx.fillStyle = '#ffe2a0';
    for (let i = 0; i < 6; i++) ctx.fillRect(4 + i * 21, 5, 17, 18);
    // frame + mullion
    ctx.fillStyle = BRONZE;
    ctx.fillRect(0, 26, W, 5);
    ctx.fillRect(0, 0, W, 3);
    ctx.fillRect(0, 0, 4, H);
    ctx.fillRect(W - 4, 0, 4, H);
    ctx.fillRect(W / 2 - 2, 28, 4, H);
  }, { key: `department-store:display:${seed}`, repeat: false });
}

const displayMats = [11, 12, 13, 14].map((s) => {
  const t = displayTexture(s);
  return textured(t, { emissive: '#ffffff', emissiveIntensity: 0.45, emissiveMap: t });
});

// display window with granite stall riser and bronze surround; faces +z
function displayWindow(w, h, variant) {
  const frame = mat(BRONZE);
  const face = displayMats[variant % displayMats.length];
  return group(
    place(box(w + 0.3, 0.55, 0.22, mat(PALETTE.darkGrey)), {}),
    place(box(w + 0.3, h + 0.2, 0.12, frame), { y: 0.45 }),
    place(unitBox(w, h, 0.18, [frame, frame, frame, frame, face, frame]), { y: 0.55 }),
  );
}

// glazed double doors in a bronze frame with a transom sign; faces +z
function entrance(w, h, label) {
  const frame = mat(BRONZE);
  const glassM = mat(shade(PALETTE.windowLit, -0.15), { emissive: PALETTE.windowLit, emissiveIntensity: 0.35 });
  const g = group(
    place(box(w + 0.5, h + 1.0, 0.14, frame), {}),
    place(box(w / 2 - 0.12, h - 0.2, 0.2, glassM), { x: -w / 4, y: 0.1 }),
    place(box(w / 2 - 0.12, h - 0.2, 0.2, glassM), { x: w / 4, y: 0.1 }),
    place(box(0.08, h - 0.2, 0.24, frame), { x: -w / 4, y: 0.1 }),
    place(box(0.08, h - 0.2, 0.24, frame), { x: w / 4, y: 0.1 }),
    place(board({ text: label, w: w + 0.2, h: 0.6, depth: 0.1 }), { y: h + 0.2, z: 0.14 }),
    place(box(w + 1.2, 0.15, 0.9, mat(PALETTE.stoneDark)), { y: -0.15, z: 0.4 }),
  );
  return g;
}

// thin walls along the edges of a polygon (parapets, bands)
function edgeWalls(points, h, t, material) {
  const g = new THREE.Group();
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const ang = Math.atan2(-(z2 - z1), x2 - x1) * (180 / Math.PI);
    g.add(place(box(len + t, h, t, material), { x: (x1 + x2) / 2, z: (z1 + z2) / 2, ry: ang }));
  }
  return g;
}

function clockFace() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const c = W / 2;
    ctx.fillStyle = '#c9a64a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#fbf6e8';
    ctx.beginPath();
    ctx.arc(c, c, c * 0.86, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#232326';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const big = i % 3 === 0;
      ctx.save();
      ctx.translate(c + Math.sin(a) * c * 0.7, c - Math.cos(a) * c * 0.7);
      ctx.rotate(a);
      ctx.fillRect(-(big ? 4 : 2), -(big ? 9 : 6), big ? 8 : 4, big ? 18 : 12);
      ctx.restore();
    }
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#232326';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c + c * 0.3, c - c * 0.28); // hour hand ~ 1:50
    ctx.stroke();
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(c, c);
    ctx.lineTo(c - c * 0.38, c - c * 0.46);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(c, c, 5, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'department-store:clock', repeat: false });
  const m = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.25, emissiveMap: tex });
  const face = new THREE.Mesh(new THREE.CircleGeometry(1, 24), m);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.09, 4, 24), mat('#c9a64a', { metalness: 0.5, roughness: 0.4 }));
  return group(place(face, { z: 0.03 }), rim);
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'paved'));

  const ashlar = surface('brick', shade(STONE, -0.14), { size: 2.4 });
  const trimM = mat(TRIM);
  const stoneM = mat(STONE);
  const roofM = mat(PALETTE.roofGrey);

  // --- main block -------------------------------------------------------
  g.add(place(extrude(outline(0), GF, ashlar, roofM), { y: y0 }));
  g.add(place(extrude(outline(0.15), 0.5, trimM), { y: y0 + GF - 0.5 })); // fascia band
  g.add(place(prismBlock({ points: outline(0), floors: UPPER, floorHeight: UF, ...upperFacade, roof: PALETTE.roofGrey }), { y: y0 + GF }));
  // string courses between the sales floors
  for (let f = 1; f < UPPER; f++) g.add(place(extrude(outline(0.08), 0.18, trimM), { y: y0 + GF + f * UF - 0.09 }));
  g.add(place(extrude(outline(0.2), 0.2, trimM), { y: y0 + CORNICE_Y }));
  g.add(place(extrude(outline(0.4), 0.3, stoneM), { y: y0 + CORNICE_Y + 0.2 }));
  g.add(place(prismBlock({ points: outline(0), floors: 1, floorHeight: ATTIC, ...atticFacade }), { y: y0 + ATTIC_Y }));
  g.add(place(extrude(outline(0.25), 0.2, trimM), { y: y0 + TOP_Y }));
  g.add(place(extrude(outline(0.45), 0.3, stoneM, roofM), { y: y0 + TOP_Y + 0.2 }));
  g.add(place(edgeWalls(outline(0.3), 0.8, 0.3, stoneM), { y: y0 + ROOF_Y }));
  g.add(place(edgeWalls(outline(0.3), 0.12, 0.45, trimM), { y: y0 + ROOF_Y + 0.8 }));

  // corner quoins on the left end
  for (const z of [Z0, Z1]) {
    g.add(place(box(0.6, UPPER * UF, 0.6, stoneM), { x: X0 + 0.2, y: y0 + GF, z: z - Math.sign(z) * 0.2 }));
  }

  // --- clock turret --------------------------------------------------------
  const T = (o) => ({ ...o, x: TX + (o.x ?? 0), z: TZ + (o.z ?? 0) });
  g.add(place(cylinder(TR, TR, GF, ashlar, 24), T({ y: y0 })));
  g.add(place(cylinder(TR + 0.15, TR + 0.15, 0.5, trimM, 24), T({ y: y0 + GF - 0.5 })));
  g.add(place(facadeCylinder({ radius: TR, floors: UPPER, floorHeight: UF, segments: 24, ...upperFacade, bay: 2.0 }), T({ y: y0 + GF })));
  g.add(place(cylinder(TR + 0.2, TR + 0.2, 0.2, trimM, 24), T({ y: y0 + CORNICE_Y })));
  g.add(place(cylinder(TR + 0.4, TR + 0.4, 0.3, stoneM, 24), T({ y: y0 + CORNICE_Y + 0.2 })));
  g.add(place(facadeCylinder({ radius: TR, floors: 1, floorHeight: ATTIC, segments: 24, ...atticFacade, bay: 2.0 }), T({ y: y0 + ATTIC_Y })));
  g.add(place(cylinder(TR + 0.25, TR + 0.25, 0.2, trimM, 24), T({ y: y0 + TOP_Y })));
  g.add(place(cylinder(TR + 0.45, TR + 0.45, 0.3, stoneM, 24), T({ y: y0 + TOP_Y + 0.2 })));
  // clock stage above the roof line
  const CR = TR - 0.2, clockY = ROOF_Y + 0.2, clockH = 2.8;
  g.add(place(cylinder(CR, CR, clockH, stoneM, 24), T({ y: y0 + clockY })));
  for (let i = 0; i < 4; i++) {
    const a = 45 + i * 90;
    const rad = (a * Math.PI) / 180;
    g.add(place(clockFace(), T({ x: Math.sin(rad) * (CR + 0.02), y: y0 + clockY + clockH / 2, z: Math.cos(rad) * (CR + 0.02), ry: a, s: 0.95 })));
  }
  g.add(place(cylinder(CR + 0.25, CR + 0.25, 0.3, trimM, 24), T({ y: y0 + clockY + clockH })));
  const domeY = clockY + clockH + 0.3;
  const copper = mat(PALETTE.roofGreen, { roughness: 0.5, metalness: 0.2 });
  g.add(place(dome({ radius: CR, height: 2.6, material: copper }), T({ y: y0 + domeY })));
  // lantern + finial
  g.add(place(cylinder(0.45, 0.45, 0.9, stoneM, 8), T({ y: y0 + domeY + 2.4 })));
  g.add(place(cone(0.6, 0.9, copper, 8), T({ y: y0 + domeY + 3.3 })));
  g.add(place(cylinder(0.04, 0.06, 1.6, metal(PALETTE.glassGold), 6), T({ y: y0 + domeY + 4.1 })));
  g.add(place(sphere(0.16, metal(PALETTE.glassGold), 8), T({ y: y0 + domeY + 5.6 })));

  // corner entrance under the clock, facing the street corner
  {
    const a = 45, rad = Math.PI / 4;
    const ex = TX + Math.sin(rad) * (TR - 0.05), ez = TZ + Math.cos(rad) * (TR - 0.05);
    g.add(place(entrance(2.0, 2.9, 'ENTRANCE'), { x: ex, y: y0 + 0.15, z: ez, ry: a }));
    // curved green canopy wrapping the turret
    const cr = TR + 0.9, t0 = (10 * Math.PI) / 180, tl = (70 * Math.PI) / 180;
    const canopyM = mat(CANOPY);
    const slab = new THREE.Mesh(new THREE.CylinderGeometry(cr, cr, 0.35, 12, 1, false, t0, tl).translate(0, 0.175, 0), canopyM);
    const valance = new THREE.Mesh(new THREE.CylinderGeometry(cr + 0.02, cr + 0.02, 0.45, 12, 1, true, t0, tl).translate(0, -0.05, 0), mat(CANOPY2));
    g.add(place(group(slab, valance), T({ y: y0 + 3.7 })));
  }

  // --- ground floor shopfronts (aligned with the window bays above) ---------
  const winH = 3.0;
  const shop = (x, z, ry, w, variant) => {
    const a = (ry * Math.PI) / 180;
    const nx = Math.sin(a), nz = Math.cos(a);
    const px = (o) => ({ x: x + nx * o, z: z + nz * o });
    g.add(place(displayWindow(w, winH, variant), { ...px(0), y: y0, ry }));
    g.add(place(awning({ w: w + 0.3, depth: 1.25, drop: 0.5, color: CANOPY, color2: CANOPY2 }), { ...px(0), y: y0 + 4.05, ry }));
  };
  const frontBay = (X1 - CUT - X0) / 6;
  for (let i = 0; i < 6; i++) {
    const x = X0 + frontBay * (i + 0.5);
    if (i === 2) {
      g.add(place(entrance(2.0, 2.9, 'HARTLEY\'S'), { x, y: y0 + 0.15, z: Z1 }));
      g.add(place(awning({ w: 3.0, depth: 1.7, drop: 0.55, color: CANOPY, color2: CANOPY2 }), { x, y: y0 + 4.15, z: Z1 }));
    } else if (i === 5) {
      shop(x - 0.35, Z1, 0, 1.2, 1);
    } else {
      shop(x, Z1, 0, 2.05, i);
    }
  }
  // side shopfronts
  shop(X1, -3.4, 90, 2.0, 2);
  shop(X1, -1.35, 90, 1.1, 0);
  for (let i = 0; i < 3; i++) shop(X0, Z0 + 2.4 * (i + 0.5), -90, 2.0, i + 1);

  // pilasters between the bays of the sales floors
  const pil = mat(shade(STONE, 0.04));
  const pilH = CORNICE_Y - GF;
  for (let i = 1; i < 6; i++) g.add(place(box(0.4, pilH, 0.16, pil), { x: X0 + frontBay * i, y: y0 + GF, z: Z1 + 0.08 }));
  for (const z of [Z0 + 2.4, Z0 + 4.8]) g.add(place(box(0.16, pilH, 0.4, pil), { x: X0 - 0.08, y: y0 + GF, z }));
  g.add(place(box(0.16, pilH, 0.4, pil), { x: X1 + 0.08, y: y0 + GF, z: Z0 + 2.4 }));

  // back: goods-in door and staff door
  g.add(place(box(3.2, 3.2, 0.12, mat(PALETTE.steel)), { x: -4, y: y0, z: Z0 - 0.06 }));
  for (let i = 1; i < 7; i++) g.add(place(box(3.2, 0.05, 0.16, mat(PALETTE.steelDark)), { x: -4, y: y0 + i * 0.45, z: Z0 - 0.06 }));
  g.add(place(door({ w: 1.1, h: 2.3, color: BRONZE }), { x: 3, y: y0, z: Z0, ry: 180 }));

  // shop name on the fascia and a big name board on the roof
  g.add(place(board({ text: 'HARTLEY\'S', w: 7, h: 1.5, depth: 0.25, border: '#c9a64a' }), { x: -2, y: y0 + ROOF_Y + 0.9, z: Z1 + 0.1 }));
  for (const x of [-4.8, 0.8]) g.add(place(box(0.15, 0.9, 0.15, mat(PALETTE.darkGrey)), { x, y: y0 + ROOF_Y + 0.4, z: Z1 - 0.1 }));

  // --- roof -----------------------------------------------------------------
  const ry = y0 + ROOF_Y;
  // atrium skylight
  g.add(place(box(6.4, 0.4, 3.4, stoneM), { x: -2, y: ry, z: -1.2 }));
  g.add(place(taperedBlock({ w: 6.0, d: 3.0, h: 1.4, topW: 4.6, topD: 0.4, material: glass(PALETTE.glassSky), topMaterial: mat(PALETTE.steelLight) }), { x: -2, y: ry + 0.4, z: -1.2 }));
  // lift motor room
  g.add(place(box(2.6, 2.2, 2.4, stoneM), { x: 2.8, y: ry, z: -2.8 }));
  g.add(place(box(2.8, 0.2, 2.6, trimM), { x: 2.8, y: ry + 2.2, z: -2.8 }));
  g.add(place(rooftopUnits({ w: 4.5, d: 5, count: 4, seed: 31 }), { x: -6.6, y: ry, z: -1.4 }));
  // flags
  g.add(place(flag({ h: 4, color: CANOPY, color2: CANOPY2 }), { x: -8.6, y: ry + 0.9, z: Z1 }));
  g.add(place(flag({ h: 4, color: CANOPY, color2: CANOPY2 }), { x: -8.6, y: ry + 0.9, z: Z0 }));

  // --- pavement props --------------------------------------------------------
  g.add(place(patch(5.5, 4.0, 'cobbles'), { x: 7.2, y: y0, z: 3.0 }));
  for (const x of [-8.4, -3.0, 3.0]) g.add(place(streetLamp({ h: 4.4 }), { x, y: y0, z: 4.6 }));
  g.add(place(bench({ w: 1.6 }), { x: -6.0, y: y0, z: 4.4, ry: 180 }));
  g.add(place(bench({ w: 1.6 }), { x: 0.0, y: y0, z: 4.4, ry: 180 }));
  for (const x of [-8.0, -4.4, 1.6, 4.6]) {
    g.add(place(box(1.0, 0.5, 0.8, mat(PALETTE.stoneDark)), { x, y: y0, z: 4.45 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: Math.round(x * 7) }), { x, y: y0 + 0.5, z: 4.45 }));
  }
  // potted bay trees either side of the corner entrance
  for (const [px, pz] of [[5.3, 3.3], [9.4, -0.9]]) {
    g.add(place(cylinder(0.4, 0.32, 0.6, mat(PALETTE.stoneDark), 10), { x: px, y: y0, z: pz }));
    g.add(place(tree({ kind: 'cone', h: 1.8, seed: Math.round(px * 10) }), { x: px, y: y0 + 0.6, z: pz }));
  }
  // bollards
  for (const x of [6.0, 7.0]) g.add(place(cylinder(0.12, 0.14, 0.8, mat(PALETTE.darkGrey), 8), { x, y: y0, z: 4.7 }));
  return g;
}

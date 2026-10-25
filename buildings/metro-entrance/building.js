import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, box, beam, cylinder, place, group, stairs, surface, mat, metal, glass, emissive,
  textured, canvasTexture, tree, bench, streetLamp, hedge,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
//
// Nothing may go below y = 0, so the plaza is a raised granite deck (DECK m high)
// reached by broad steps from the street; the metro stairwell is cut into the
// deck and ends at a dark portal where the stairs carry on underground.

const DECK = 1.2;
const HALF = TILE / 2 - 0.05;

// ---------------------------------------------------------------------------
// textures (flat planes with 0..1 UVs so the whole canvas shows once)

function panel(w, h, tex, glow = 0.35) {
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: glow }));
}

function mTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.yellow;
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.43, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.navy;
    ctx.font = `bold ${Math.round(H * 0.62)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('M', W / 2, H / 2 + H * 0.03);
  }, { key: 'metro-entrance:m', repeat: false });
}

function textTexture(text, bg, fg) {
  return canvasTexture(256, 64, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = fg;
    ctx.font = `bold ${Math.round(H * 0.6)}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key: `metro-entrance:text:${text}:${bg}:${fg}`, repeat: false });
}

// Stairs carrying on down into the dark, painted on the portal at the bottom.
function portalTexture() {
  return canvasTexture(128, 96, (ctx, W, H) => {
    ctx.fillStyle = '#0d0e12';
    ctx.fillRect(0, 0, W, H);
    const steps = 9;
    for (let i = 0; i < steps; i++) {
      const t = i / steps;
      const y0 = H * (1 - t * 0.78);
      const y1 = H * (1 - (i + 1) / steps * 0.78);
      const inset = W * 0.22 * t;
      const g = Math.round(150 * (1 - t) ** 1.6 + 14);
      ctx.fillStyle = `rgb(${g},${g},${g + 4})`;
      ctx.fillRect(inset, y1, W - inset * 2, (y0 - y1) * 0.62);
      ctx.fillStyle = PALETTE.yellow;
      ctx.globalAlpha = 0.8 * (1 - t);
      ctx.fillRect(inset, y1, W - inset * 2, 2);
      ctx.globalAlpha = 1;
    }
    // lit ceiling strip deep inside
    ctx.fillStyle = '#fff2c0';
    ctx.globalAlpha = 0.7;
    ctx.fillRect(W * 0.38, H * 0.06, W * 0.24, 3);
    ctx.globalAlpha = 1;
  }, { key: 'metro-entrance:portal', repeat: false });
}

// ---------------------------------------------------------------------------
// props

/** Inverted-U bike hoop in the X-Y plane. */
function bikeHoop(m) {
  return group(
    place(box(0.06, 0.8, 0.06, m), { x: -0.32 }),
    place(box(0.06, 0.8, 0.06, m), { x: 0.32 }),
    place(box(0.7, 0.06, 0.06, m), { y: 0.78 })
  );
}

/** Low-poly bicycle, length along X (front wheel at +x). */
function bicycle(color) {
  const tyre = mat(PALETTE.black);
  const frame = mat(color);
  const r = 0.33;
  const wheel = (x) => {
    const w = new THREE.Mesh(new THREE.TorusGeometry(r, 0.045, 4, 14), tyre);
    w.position.set(x, r, 0);
    return w;
  };
  const rear = [-0.52, r, 0], front = [0.52, r, 0];
  const crank = [-0.05, 0.36, 0], seat = [-0.2, 0.82, 0], head = [0.36, 0.86, 0];
  const t = 0.05;
  return group(
    wheel(-0.52), wheel(0.52),
    beam(rear, crank, t, frame), beam(crank, seat, t, frame), beam(rear, seat, t, frame),
    beam(seat, head, t, frame), beam(crank, head, t, frame), beam(head, front, t, frame),
    place(box(0.24, 0.06, 0.12, mat(PALETTE.black)), { x: seat[0] - 0.02, y: seat[1] + 0.02 }),
    place(box(0.06, 0.06, 0.5, mat(PALETTE.darkGrey)), { x: head[0] - 0.04, y: head[1] + 0.1 })
  );
}

/** The M totem: tall pole with a lit M cube and a METRO plate. */
function totem() {
  const pole = mat(PALETTE.darkGrey);
  const navy = mat(PALETTE.navy);
  const g = group(
    box(0.5, 0.25, 0.5, mat(PALETTE.stoneDark)),
    place(box(0.2, 4.0, 0.2, pole), { y: 0.25 }),
    place(box(1.1, 1.1, 1.1, navy), { y: 4.15 }),
    place(box(1.16, 0.08, 1.16, mat(PALETTE.yellow)), { y: 4.07 }),
    place(box(1.16, 0.08, 1.16, mat(PALETTE.yellow)), { y: 5.25 }),
    place(box(0.36, 1.25, 0.12, navy), { y: 2.55 })
  );
  const m = mTexture();
  for (const ry of [0, 90, 180, 270]) {
    const p = panel(1.0, 1.0, m, 0.45);
    const a = THREE.MathUtils.degToRad(ry);
    p.position.set(Math.sin(a) * 0.556, 4.7, Math.cos(a) * 0.556);
    p.rotation.y = a;
    g.add(p);
  }
  const plate = textTexture('METRO', PALETTE.navy, '#ffffff');
  for (const ry of [0, 180]) {
    const p = panel(1.2, 0.3, plate, 0.3);
    p.scale.set(1, 1, 1);
    const a = THREE.MathUtils.degToRad(ry);
    // vertical plate: rotate the text to run top-to-bottom
    p.rotation.set(0, a, Math.PI / 2 * (ry ? -1 : 1));
    p.position.set(0, 3.17, Math.cos(a) * 0.065);
    g.add(p);
  }
  return g;
}

/** City map / info board on two legs, faces +z. */
function mapBoard() {
  const frame = mat(PALETTE.navy);
  const tex = canvasTexture(96, 128, (ctx, W, H) => {
    ctx.fillStyle = '#f4f1e6';
    ctx.fillRect(0, 0, W, H);
    const lines = [[PALETTE.red, 20, 10, 70, 118], [PALETTE.blue, 8, 60, 90, 50], [PALETTE.green, 30, 120, 80, 8], [PALETTE.yellow, 85, 20, 12, 100]];
    ctx.lineWidth = 5;
    for (const [c, x0, y0, x1, y1] of lines) {
      ctx.strokeStyle = c;
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y1);
      ctx.stroke();
    }
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(0, 0, W, 16);
  }, { key: 'metro-entrance:map', repeat: false });
  const g = group(
    place(box(0.08, 1.9, 0.08, frame), { x: -0.45 }),
    place(box(0.08, 1.9, 0.08, frame), { x: 0.45 }),
    place(box(0.98, 1.3, 0.1, frame), { y: 0.6 })
  );
  for (const ry of [0, 180]) {
    const p = panel(0.86, 1.15, tex, 0.25);
    const a = THREE.MathUtils.degToRad(ry);
    p.position.set(0, 1.25, Math.cos(a) * 0.055);
    p.rotation.y = a;
    g.add(p);
  }
  return g;
}

/** Glass lift shaft (to the platform), door faces +x. */
function lift() {
  const steel = metal(PALETTE.steelDark);
  const h = 2.8, s = 1.6;
  const g = group(
    box(s, h, s, glass(PALETTE.glassTeal, { opacity: 0.55 })),
    place(box(s + 0.12, 0.3, s + 0.12, steel), { y: h }),
    place(box(s + 0.1, 0.12, s + 0.1, steel), { y: 0 }),
    place(box(0.5, 0.4, s - 0.6, mat(PALETTE.darkGrey)), { y: 0.12 }), // car inside
    place(box(0.06, 2.1, 0.9, mat(PALETTE.steelLight, { metalness: 0.6, roughness: 0.3 })), { x: s / 2 + 0.03, y: 0.12 })
  );
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) g.add(place(box(0.1, h, 0.1, steel), { x: x * s / 2, z: z * s / 2 }));
  const sign = textTexture('LIFT', PALETTE.navy, '#ffffff');
  const p = panel(0.9, 0.24, sign, 0.4);
  p.rotation.y = Math.PI / 2;
  p.position.set(s / 2 + 0.07, h + 0.15, 0);
  g.add(p);
  return g;
}

function planterTree(seed, h = 5) {
  return group(
    box(1.3, 0.5, 1.3, mat(PALETTE.stoneDark)),
    place(patch(1.1, 1.1, 'dirt'), { y: 0.46 }),
    place(tree({ kind: 'round', h, seed }), { y: 0.5 })
  );
}

function bin() {
  return group(
    cylinder(0.22, 0.2, 0.75, mat(PALETTE.green), 10),
    place(cylinder(0.24, 0.24, 0.06, mat(PALETTE.darkGrey), 10), { y: 0.75 })
  );
}

// ---------------------------------------------------------------------------

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  const top = y0 + DECK;
  g.add(lot([1, 1], 'paved'));

  const granite = surface('concrete', PALETTE.stone, { size: 3 });
  const deckTop = surface('paving', '#cfc8b8', { size: 2.5 });
  const deckMat = [granite, granite, deckTop, granite, granite, granite];
  const tiles = surface('brick', PALETTE.white, { size: 0.8 });
  const stepMat = mat(PALETTE.concrete);
  const nosing = mat(PALETTE.yellow);
  const steel = metal(PALETTE.steelDark);
  const roofGlass = glass(PALETTE.glassSky, { opacity: 0.5 });
  const sideGlass = glass(PALETTE.glassSky, { opacity: 0.35 });

  // stairwell opening in the deck
  const px0 = -3.7, px1 = -0.7, pxc = (px0 + px1) / 2, pw = px1 - px0;
  const pFront = 3.4, pBack = -1.6;
  const deckFront = 3.55; // street steps run from here to the lot edge

  // --- raised plaza deck, built around the opening -------------------------
  const deckBox = (x0, x1, z0, z1) => place(box(x1 - x0, DECK, z1 - z0, deckMat), { x: (x0 + x1) / 2, y: y0, z: (z0 + z1) / 2 });
  g.add(deckBox(-HALF, px0, -HALF, deckFront));
  g.add(deckBox(px1, HALF, -HALF, deckFront));
  g.add(deckBox(px0, px1, -HALF, pBack));
  g.add(deckBox(px0, px1, pFront, deckFront));
  // broad steps up from the street, with a dark kerb line
  g.add(place(stairs({ w: HALF * 2, h: DECK, d: HALF - deckFront, steps: 4, material: granite }), { y: y0, z: (HALF + deckFront) / 2 }));
  const edge = mat(PALETTE.stoneDark);
  const stepRun = (HALF - deckFront) / 4;
  for (let i = 0; i < 4; i++) {
    g.add(place(box(HALF * 2, 0.03, 0.1, edge), { y: y0 + DECK * (i + 1) / 4, z: HALF - (i + 1) * stepRun + 0.05 }));
  }
  // dark coping round the other three edges of the deck
  g.add(place(box(HALF * 2 + 0.1, 0.14, 0.3, edge), { y: top - 0.1, z: -HALF + 0.1 }));
  for (const s of [-1, 1]) g.add(place(box(0.3, 0.14, HALF + deckFront, edge), { x: s * (HALF - 0.1), y: top - 0.1, z: (deckFront - HALF) / 2 }));

  // --- stairwell: white tiled walls, steps with yellow nosings, landing ---
  g.add(place(box(0.04, DECK, pFront - pBack, tiles), { x: px0 + 0.02, y: y0, z: (pFront + pBack) / 2 }));
  g.add(place(box(0.04, DECK, pFront - pBack, tiles), { x: px1 - 0.02, y: y0, z: (pFront + pBack) / 2 }));
  g.add(place(box(pw, DECK, 0.04, tiles), { x: pxc, y: y0, z: pBack + 0.02 }));
  const steps = 8, rise = DECK / steps, run = 0.42;
  const sw = pw - 0.08;
  for (let i = 0; i < steps - 1; i++) {
    const h = DECK - (i + 1) * rise;
    const zf = pFront - (i + 1) * run;
    const zb = pFront - i * run;
    g.add(place(box(sw, h, zb - zf, stepMat), { x: pxc, y: y0, z: (zf + zb) / 2 }));
    g.add(place(box(sw, 0.02, 0.07, nosing), { x: pxc, y: y0 + h, z: zf + 0.035 }));
  }
  const stepsEnd = pFront - steps * run;
  g.add(place(patch(sw, stepsEnd - pBack, surface('paving', PALETTE.concreteDark, { size: 1.5 }), 0.02), { x: pxc, y: y0, z: (stepsEnd + pBack) / 2 }));
  // portal at the bottom: stairs carry on into the dark
  const portalFrame = mat(PALETTE.navy);
  g.add(place(box(2.5, 1.08, 0.06, portalFrame), { x: pxc, y: y0, z: pBack + 0.07 }));
  g.add(place(panel(2.2, 0.98, portalTexture(), 0.05), { x: pxc, y: y0 + 0.49, z: pBack + 0.11 }));
  // handrails down both sides and the middle
  const rail = metal(PALETTE.steelLight);
  for (const x of [px0 + 0.12, px1 - 0.12, pxc]) {
    g.add(beam([x, top + 0.9, pFront], [x, y0 + 0.9, stepsEnd], 0.06, rail));
    g.add(beam([x, y0 + 0.9, stepsEnd], [x, y0 + 0.9, pBack + 0.3], 0.06, rail));
  }
  for (const z of [pFront - 0.05, stepsEnd + 0.1]) {
    const y = z > 0 ? top : y0;
    g.add(place(box(0.05, 0.9, 0.05, rail), { x: pxc, y, z }));
  }

  // --- low granite parapet round the opening ------------------------------
  const parH = 0.5, parT = 0.2;
  const parMat = mat(PALETTE.stoneDark);
  g.add(place(box(parT, parH, pFront - pBack + parT, parMat), { x: px0 - parT / 2, y: top, z: (pFront + pBack - parT) / 2 }));
  g.add(place(box(parT, parH, pFront - pBack + parT, parMat), { x: px1 + parT / 2, y: top, z: (pFront + pBack - parT) / 2 }));
  g.add(place(box(pw + parT * 2, parH, parT, parMat), { x: pxc, y: top, z: pBack - parT / 2 }));

  // --- glass canopy on a steel frame --------------------------------------
  const cx0 = px0 - parT / 2, cx1 = px1 + parT / 2;
  const cz0 = pBack - parT / 2, cz1 = pFront - 0.1;
  const yFront = top + 3.0, yBack = top + 2.55;
  const roofY = (z) => yBack + (yFront - yBack) * (z - cz0) / (cz1 - cz0);
  const postTop = top + parH;
  for (const x of [cx0, cx1]) {
    for (const z of [cz0, (cz0 + cz1) / 2, cz1]) {
      g.add(place(box(0.14, roofY(z) - postTop, 0.14, steel), { x, y: postTop, z }));
    }
    // edge beam
    g.add(beam([x, roofY(cz0 - 0.4) + 0.06, cz0 - 0.4], [x, roofY(cz1 + 0.4) + 0.06, cz1 + 0.4], 0.16, steel));
    // glass side screens above the parapet
    const zm = (cz0 + cz1) / 2;
    g.add(place(box(0.04, 1.75, cz1 - cz0, sideGlass), { x, y: postTop, z: zm }));
    g.add(place(box(0.06, 0.06, cz1 - cz0, steel), { x, y: postTop + 1.75, z: zm }));
  }
  g.add(place(box(cx1 - cx0, 1.75, 0.04, sideGlass), { x: pxc, y: postTop, z: cz0 }));
  // cross rafters + lit strips underneath
  const lamp = emissive(PALETTE.windowLit, 0.9);
  const nr = 6;
  for (let i = 0; i < nr; i++) {
    const z = cz0 - 0.4 + (cz1 - cz0 + 0.8) * i / (nr - 1);
    g.add(place(box(cx1 - cx0 + 0.3, 0.12, 0.1, steel), { x: pxc, y: roofY(z), z }));
    if (i > 0 && i < nr - 1) g.add(place(box(cx1 - cx0 - 0.6, 0.05, 0.12, lamp), { x: pxc, y: roofY(z) - 0.05, z }));
  }
  // the glass roof itself (tilted slab)
  const len = Math.hypot(cz1 - cz0 + 0.8, yFront - yBack);
  const tilt = Math.atan2(yFront - yBack, cz1 - cz0) * 180 / Math.PI;
  g.add(place(box(cx1 - cx0 + 0.4, 0.05, len, roofGlass), { x: pxc, y: roofY((cz0 + cz1) / 2) + 0.1, z: (cz0 + cz1) / 2, rx: -tilt }));
  // METRO fascia sign at the front of the canopy, M roundel above it
  g.add(place(box(cx1 - cx0 + 0.3, 0.5, 0.1, mat(PALETTE.navy)), { x: pxc, y: yFront - 0.5, z: cz1 + 0.45 }));
  g.add(place(panel(2.4, 0.42, textTexture('METRO', PALETTE.navy, '#ffffff'), 0.35), { x: pxc - 0.35, y: yFront - 0.25, z: cz1 + 0.51 }));
  g.add(place(panel(0.46, 0.46, mTexture(), 0.45), { x: px1 - 0.25, y: yFront - 0.25, z: cz1 + 0.51 }));

  // --- plaza props ---------------------------------------------------------
  g.add(place(totem(), { x: 0.35, y: top, z: 2.85 }));
  g.add(place(mapBoard(), { x: 0.3, y: top, z: -0.9, ry: 90 }));

  // bike racks with parked bikes
  const hoopMat = metal(PALETTE.steelLight);
  const bikeColours = [PALETTE.red, PALETTE.blue, null, PALETTE.yellow, PALETTE.green];
  bikeColours.forEach((c, i) => {
    const z = -1.4 + i * 0.85;
    g.add(place(bikeHoop(hoopMat), { x: 3.55, y: top, z }));
    if (c) g.add(place(bicycle(c), { x: 3.6, y: top, z: z + 0.16 }));
  });
  g.add(place(patch(2.4, 4.6, surface('paving', PALETTE.concreteDark, { size: 1.2 }), 0.02), { x: 3.6, y: top, z: 0.3 }));

  // benches facing the bikes, bin, lamps
  g.add(place(bench({ w: 1.6 }), { x: 0.9, y: top, z: 1.0, ry: 90 }));
  g.add(place(bin(), { x: 1.9, y: top, z: 2.95 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: 4.55, y: top, z: 3.15, ry: 180 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.5, y: top, z: -4.5, ry: -45 }));

  // back of the plaza: glass lift down to the platform, planters, bench
  g.add(place(lift(), { x: pxc - 0.2, y: top, z: -3.75 }));
  g.add(place(planterTree(12, 4.8), { x: 1.0, y: top, z: -3.6 }));
  g.add(place(planterTree(17, 5.2), { x: 3.7, y: top, z: -3.6 }));
  g.add(place(bench({ w: 1.5 }), { x: 2.35, y: top, z: -4.25 }));

  // planter strip with a hedge alongside the stairwell
  g.add(place(box(0.95, 0.4, 4.6, mat(PALETTE.stoneDark)), { x: -4.4, y: top, z: 0.8 }));
  g.add(place(hedge({ w: 4.4, h: 0.7, d: 0.75 }), { x: -4.4, y: top + 0.4, z: 0.8, ry: 90 }));
  return g;
}

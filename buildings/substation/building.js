import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, TILE,
  lot, patch, facadeBlock, parapet, box, cylinder, place, group, beam,
  lattice, truss, fence, sign, door, streetLamp, car, tree,
  mat, metal, canvasTexture, textured,
} from '../../src/lib/index.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// Back: incoming-line gantry. Middle: three-phase busbars on post insulators.
// Front-middle: two transformers split by a firewall. Front: gate + control hut.

const PORCELAIN = '#8a4f2e';
const TRAFO = '#7b8a78';

const porcelain = () => mat(PORCELAIN, { roughness: 0.35 });
const steelM = () => metal(PALETTE.steel);
const darkM = () => metal(PALETTE.steelDark);
const wireM = () => mat('#3a3d40', { roughness: 0.6 });
const busM = () => metal(PALETTE.aluminium, { roughness: 0.3 });

/** Stacked-disc porcelain insulator, base at y = 0. */
function insulator(h = 1, r = 0.16, sheds = 5) {
  const m = porcelain();
  const g = group(cylinder(r * 0.45, r * 0.45, h, m, 8));
  for (let i = 0; i < sheds; i++) {
    g.add(place(cylinder(r, r, h * 0.07, m, 10), { y: (h * (i + 0.6)) / (sheds + 0.2) }));
  }
  g.add(place(cylinder(r * 0.6, r * 0.6, 0.06, steelM(), 8), { y: h - 0.03 }));
  return g;
}

/** Thin conductor between two points. */
const wire = (a, b, t = 0.05) => beam(a, b, t, wireM());

/** Yellow "high voltage" warning plate with a lightning bolt, faces +z. */
function dangerSign(w = 0.6, h = 0.45) {
  const tex = canvasTexture(128, 96, (ctx, W, H) => {
    ctx.fillStyle = '#f2c230';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#1b1b1b';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, W - 6, H - 6);
    ctx.fillStyle = '#1b1b1b';
    ctx.beginPath();
    ctx.moveTo(W * 0.56, H * 0.12);
    ctx.lineTo(W * 0.36, H * 0.55);
    ctx.lineTo(W * 0.5, H * 0.55);
    ctx.lineTo(W * 0.42, H * 0.9);
    ctx.lineTo(W * 0.66, H * 0.42);
    ctx.lineTo(W * 0.52, H * 0.42);
    ctx.closePath();
    ctx.fill();
  }, { key: 'substation:danger', repeat: false });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.1, emissiveMap: tex });
  const side = mat('#f2c230');
  return box(w, h, 0.04, [side, side, side, side, face, side]);
}

/** Oil-filled power transformer on a concrete pad. Radiator banks on the ±x sides. */
function transformer({ flip = false } = {}) {
  const g = new THREE.Group();
  const body = mat(TRAFO, { roughness: 0.55, metalness: 0.2 });
  const bodyDark = mat('#5f6d5c', { roughness: 0.6, metalness: 0.2 });
  const bw = 1.9, bd = 1.6, bh = 2.1, py = 0.2;

  g.add(box(3.3, py, 2.5, mat(PALETTE.concrete)));                     // pad
  g.add(place(box(bw + 0.3, 0.12, bd + 0.3, bodyDark), { y: py }));    // skid
  g.add(place(box(bw, bh, bd, body), { y: py + 0.12 }));               // tank
  g.add(place(box(bw + 0.12, 0.12, bd + 0.12, bodyDark), { y: py + 0.12 + bh })); // lid flange
  const top = py + 0.24 + bh;

  // radiator banks: vertical fins with header pipes, both sides
  for (const s of [-1, 1]) {
    const x0 = s * (bw / 2 + 0.12);
    for (let i = 0; i < 6; i++) {
      const z = -0.62 + i * 0.25;
      g.add(place(box(0.42, 1.6, 0.07, bodyDark), { x: x0 + s * 0.21, y: py + 0.35, z }));
    }
    g.add(place(box(0.5, 0.1, 1.45, body), { x: x0 + s * 0.21, y: py + 1.95 }));
    g.add(place(box(0.5, 0.1, 1.45, body), { x: x0 + s * 0.21, y: py + 0.3 }));
  }

  // HV bushings (tall, back row), LV bushings (short, front row)
  const hv = [];
  for (let i = -1; i <= 1; i++) {
    const x = i * 0.6, z = -0.45;
    g.add(place(insulator(1.25, 0.15, 6), { x, y: top, z }));
    hv.push([x, top + 1.25, z]);
    g.add(place(insulator(0.55, 0.1, 3), { x: x * 0.8 + 0.1, y: top, z: 0.45 }));
  }
  g.add(place(insulator(0.55, 0.1, 3), { x: -0.62, y: top, z: 0.45 }));

  // conservator tank on brackets
  const cx = flip ? -0.55 : 0.55;
  const cons = cylinder(0.28, 0.28, 1.5, body, 12);
  cons.rotation.z = Math.PI / 2;
  cons.position.set(cx + 0.75, top + 1.25, 0.1);
  g.add(cons);
  for (const dx of [-0.5, 0.5]) g.add(place(box(0.08, 1.0, 0.08, bodyDark), { x: cx + dx, y: top, z: 0.1 }));
  g.add(beam([cx - 0.2, top + 1.0, 0.1], [cx - 0.2, top, -0.2], 0.06, bodyDark)); // Buchholz pipe

  // marshalling cabinet + rating plate on the street side
  g.add(place(box(0.55, 0.8, 0.25, mat(PALETTE.steelLight)), { x: 0.5, y: py + 0.5, z: bd / 2 + 0.12 }));
  g.add(place(dangerSign(0.42, 0.32), { x: -0.45, y: py + 1.2, z: bd / 2 }));
  g.userData.hv = hv;
  return g;
}

/** Steel H-stand carrying three post insulators along z (one per phase). */
function busSupport(phasesZ, h = 2.7) {
  const g = new THREE.Group();
  const zs = [phasesZ[0] - 0.25, phasesZ[phasesZ.length - 1] + 0.25];
  for (const z of zs) {
    g.add(place(box(0.5, 0.15, 0.5, mat(PALETTE.concreteDark)), { z }));
    g.add(place(box(0.2, h, 0.2, steelM()), { z }));
  }
  g.add(place(box(0.24, 0.24, zs[1] - zs[0] + 0.2, steelM()), { y: h - 0.24, z: (zs[0] + zs[1]) / 2 }));
  g.add(beam([0, 0.3, zs[0]], [0, h - 0.3, zs[1]], 0.08, steelM()));
  for (const z of phasesZ) g.add(place(insulator(1.0, 0.15, 5), { y: h, z }));
  return g;
}

export default function build() {
  const y0 = LOT_HEIGHT;
  const H = TILE / 2;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'gravel'));

  // driveway from the gate, concrete aprons
  g.add(place(patch(2.6, 3.0, 'concrete'), { x: -2.7, y: y0, z: 3.5 }));
  g.add(place(patch(8.6, 0.6, 'concrete'), { x: 0, y: y0, z: 2.25 }));

  // ---- gantry at the back: two lattice towers and a truss crossbeam --------
  const gz = -3.9, gh = 6.6;
  for (const x of [-3.9, 3.9]) {
    g.add(place(box(1.0, 0.25, 1.0, mat(PALETTE.concreteDark)), { x, y: y0, z: gz }));
    g.add(place(lattice({ w: 0.7, d: 0.7, h: gh, topW: 0.45, topD: 0.45, segments: 6, thickness: 0.1, material: darkM() }), { x, y: y0 + 0.25, z: gz }));
    g.add(place(cylinder(0.05, 0.08, 1.4, darkM(), 6), { x, y: y0 + 0.25 + gh, z: gz })); // earth-wire peak
  }
  g.add(place(truss({ length: 8.2, w: 0.5, h: 0.6, segments: 8, thickness: 0.09, material: darkM() }), { x: -4.1, y: y0 + gh - 0.35, z: gz }));
  // earth wire between peaks
  g.add(wire([-3.9, y0 + gh + 1.6, gz], [3.9, y0 + gh + 1.6, gz], 0.03));

  // three-phase busbars: tubes along x carried on H-stands
  const phases = [-2.35, -1.8, -1.25];
  const busY = y0 + 2.7 + 1.0;
  for (const x of [-3.6, 0, 3.6]) g.add(place(busSupport(phases), { x, y: y0 }));
  for (const z of phases) {
    const t = cylinder(0.07, 0.07, 7.6, busM(), 8);
    t.rotation.z = Math.PI / 2;
    t.position.set(3.8, busY + 0.05, z);
    g.add(t);
  }

  // strain insulator strings hanging off the gantry, droppers to the busbars
  const phaseX = [-1.8, 0, 1.8];
  phaseX.forEach((x, i) => {
    const sy = y0 + gh - 0.35;
    const str = insulator(0.9, 0.13, 6);
    g.add(place(str, { x, y: sy, z: gz + 0.3, rx: 180 })); // hangs downwards
    const end = [x, sy - 0.9, gz + 0.3];
    g.add(wire(end, [x, busY + 0.05, phases[i]]));
    // incoming line heading out of the yard
    g.add(wire([x, sy - 0.05, gz - 0.25], [x, sy + 0.1, -H + 0.1]));
  });

  // ---- transformers with a firewall between -------------------------------
  const tz = 0.75;
  const trafos = [
    { x: -2.35, t: transformer({ flip: false }) },
    { x: 2.35, t: transformer({ flip: true }) },
  ];
  for (const { x, t } of trafos) {
    g.add(place(t, { x, y: y0, z: tz }));
    // droppers from busbars down to the HV bushings
    t.userData.hv.forEach(([bx, by, bz], i) => {
      g.add(wire([x + bx, busY + 0.05, phases[i]], [x + bx, y0 + by, tz + bz]));
    });
  }
  g.add(place(box(0.35, 3.6, 2.6, mat(PALETTE.concrete)), { x: 0, y: y0, z: tz })); // firewall
  g.add(place(box(0.45, 0.12, 2.7, mat(PALETTE.concreteDark)), { x: 0, y: y0 + 3.6, z: tz }));

  // ---- control hut ---------------------------------------------------------
  const hx = 2.4, hz = 3.6, hw = 3.8, hd = 2.0;
  g.add(place(facadeBlock({
    w: hw, d: hd, h: 2.8, style: 'brick', wall: PALETTE.brick, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.4, windowH: 0.45, bay: 1.9, seed: 7, roof: PALETTE.roofGrey,
    blank: ['left'],
  }), { x: hx, y: y0, z: hz }));
  g.add(place(parapet({ w: hw, d: hd, h: 0.35, t: 0.18, material: mat(PALETTE.concreteDark) }), { x: hx, y: y0 + 2.8, z: hz }));
  g.add(place(door({ w: 0.9, h: 2.05, color: PALETTE.steelDark }), { x: hx - 0.7, y: y0, z: hz + hd / 2 }));
  g.add(place(box(0.8, 0.45, 0.6, mat(PALETTE.steelLight)), { x: hx + 0.9, y: y0 + 2.8, z: hz - 0.2 })); // AC unit
  g.add(place(sign({ text: 'SUBSTATION', w: 2.2, h: 0.5, bg: PALETTE.navy }), { x: hx + 0.65, y: y0 + 2.2, z: hz + hd / 2 + 0.02 }));
  // cable trench from hut to the yard
  g.add(place(box(0.5, 0.08, 1.2, mat(PALETTE.concreteDark)), { x: 1.2, y: y0, z: 2.2 }));

  // ---- fence with gate --------------------------------------------------
  const fh = 2.0, fm = PALETTE.steelLight;
  const fw = TILE - 0.3;
  g.add(place(fence({ w: fw, d: fw, h: fh, style: 'wire', color: fm, sides: ['back', 'left', 'right'] }), { y: y0 }));
  const gateL = -4.0, gateR = -1.4;
  const segL = gateL + fw / 2, segR = fw / 2 - gateR;
  g.add(place(fence({ w: segL, d: 0, h: fh, style: 'wire', color: fm, sides: ['front'] }), { x: -fw / 2 + segL / 2, y: y0, z: fw / 2 }));
  g.add(place(fence({ w: segR, d: 0, h: fh, style: 'wire', color: fm, sides: ['front'] }), { x: gateR + segR / 2, y: y0, z: fw / 2 }));
  for (const x of [gateL, gateR]) g.add(place(box(0.16, fh + 0.2, 0.16, darkM()), { x, y: y0, z: fw / 2 }));
  // chain-link mesh infill
  const mesh = mat(PALETTE.steel, { transparent: true, opacity: 0.3 });
  const panel = (len) => box(len, fh - 0.1, 0.02, mesh);
  g.add(place(panel(fw), { y: y0 + 0.05, z: -fw / 2 }));
  g.add(place(panel(fw), { x: -fw / 2, y: y0 + 0.05, ry: 90 }));
  g.add(place(panel(fw), { x: fw / 2, y: y0 + 0.05, ry: 90 }));
  g.add(place(panel(segL), { x: -fw / 2 + segL / 2, y: y0 + 0.05, z: fw / 2 }));
  g.add(place(panel(segR), { x: gateR + segR / 2, y: y0 + 0.05, z: fw / 2 }));
  // gate leaves swung open inwards
  const leaf = () => group(
    place(box(1.25, 0.06, 0.06, darkM()), { x: 0.62, y: 0.15 }),
    place(box(1.25, 0.06, 0.06, darkM()), { x: 0.62, y: fh - 0.1 }),
    place(box(0.06, fh - 0.1, 0.06, darkM()), { x: 1.22, y: 0.1 }),
    place(box(1.2, fh - 0.3, 0.02, mat(PALETTE.steelLight, { transparent: true, opacity: 0.45 })), { x: 0.62, y: 0.2 }),
  );
  g.add(place(leaf(), { x: gateL + 0.05, y: y0, z: fw / 2, ry: 70 }));
  g.add(place(leaf(), { x: gateR - 0.05, y: y0, z: fw / 2, ry: 110 }));
  // warning signs on the fence
  for (const x of [-4.4, -0.6, 3.6]) g.add(place(dangerSign(0.55, 0.42), { x, y: y0 + 1.1, z: fw / 2 + 0.05 }));
  for (const z of [-2.5, 1.5]) {
    g.add(place(dangerSign(0.55, 0.42), { x: fw / 2 + 0.05, y: y0 + 1.1, z, ry: 90 }));
    g.add(place(dangerSign(0.55, 0.42), { x: -fw / 2 - 0.05, y: y0 + 1.1, z, ry: -90 }));
  }

  // ---- props --------------------------------------------------------------
  g.add(place(car({ color: PALETTE.orange, kind: 'van' }), { x: -2.7, y: y0 + 0.05, z: 3.4, ry: 90, s: 0.55 }));
  g.add(place(streetLamp({ h: 4.2 }), { x: -4.4, y: y0, z: 2.0, rx: 0, ry: 0 }));
  g.add(place(box(0.7, 1.1, 0.45, mat(PALETTE.steelLight)), { x: -4.2, y: y0, z: -0.6 })); // kiosk
  g.add(place(box(0.7, 1.1, 0.45, mat(PALETTE.steelLight)), { x: 4.2, y: y0, z: -0.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 4 }), { x: 4.5, y: y0, z: 2.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 9 }), { x: 0.4, y: y0, z: 4.5 }));
  return g;
}

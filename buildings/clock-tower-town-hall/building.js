import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, hipRoof, gableRoof, pyramidRoof, chimney, box, cylinder, sphere, place,
  surface, field, mat, metal, textured, canvasTexture, sign, columns, stairs, fence, tree,
  hedge, bench, windowPanel, cone, emissive, door,
} from '../../src/lib/index.js';

// Clock face on a square stone panel, drawn once and cached.
function clockTexture() {
  return canvasTexture(128, 128, (ctx, W, H) => {
    const c = W / 2;
    ctx.fillStyle = PALETTE.cream;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c9b88f';
    ctx.fillRect(0, 0, W, 4);
    ctx.fillRect(0, H - 4, W, 4);
    ctx.fillRect(0, 0, 4, H);
    ctx.fillRect(W - 4, 0, 4, H);
    // gilded rim + white dial
    ctx.fillStyle = '#c9a23a';
    ctx.beginPath(); ctx.arc(c, c, 58, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#232326';
    ctx.beginPath(); ctx.arc(c, c, 53, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#f7f3e6';
    ctx.beginPath(); ctx.arc(c, c, 50, 0, Math.PI * 2); ctx.fill();
    // hour marks
    ctx.fillStyle = '#232326';
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const big = i % 3 === 0;
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(a);
      ctx.fillRect(big ? -3 : -2, -47, big ? 6 : 4, big ? 12 : 8);
      ctx.restore();
    }
    // hands at ten past ten
    const hand = (a, len, wdt) => {
      ctx.save();
      ctx.translate(c, c);
      ctx.rotate(a);
      ctx.fillRect(-wdt / 2, -len, wdt, len + 6);
      ctx.restore();
    };
    hand((10.17 / 12) * Math.PI * 2, 28, 6);
    hand((2 / 12) * Math.PI * 2, 40, 4);
    ctx.beginPath(); ctx.arc(c, c, 5, 0, Math.PI * 2); ctx.fill();
  }, { key: 'clock-tower-town-hall:clock', repeat: false });
}

// Square clock panel facing +z (plane with 0..1 UVs so the dial maps once), origin at its base.
function clockFace(size) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), textured(clockTexture()));
  m.position.y = size / 2;
  return new THREE.Group().add(m);
}

// Alternating stone quoin blocks up a wall corner (origin at the corner, on the ground).
function quoins(h, stoneMat, { size = 0.42, block = 0.36, gap = 0.3 } = {}) {
  const g = new THREE.Group();
  let i = 0;
  for (let y = 0.05; y + block <= h + 0.01; y += block + gap, i++) {
    const long = i % 2 === 0;
    g.add(place(box(long ? size * 1.5 : size, block, long ? size : size * 1.5, stoneMat), {
      x: long ? -size * 0.25 : 0, y, z: long ? 0 : -size * 0.25,
    }));
  }
  return g;
}

// Arched double door in a stone surround; sticks out to +z.
function archedDoor(stoneMat) {
  const wood = mat(PALETTE.woodDark);
  return new THREE.Group().add(
    place(box(2.5, 3.4, 0.1, stoneMat), { z: 0.05 }),
    place(box(1.7, 2.3, 0.18, wood), { z: 0.09 }),
    place(cylinder(0.85, 0.85, 0.18, wood, 16), { y: 2.3, z: 0.18, rx: 90 }),
    place(box(0.06, 2.3, 0.22, mat(PALETTE.black)), { z: 0.11 }),
    place(box(0.5, 0.35, 0.24, stoneMat), { y: 3.05, z: 0.12 }) // keystone
  );
}

// Civic banner: navy field with a gold border and a gold town seal, on a pole. Flies to +x.
function townFlag(h) {
  const tex = canvasTexture(64, 40, (ctx, W, H) => {
    ctx.fillStyle = '#e2b53a';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = PALETTE.navy;
    ctx.fillRect(4, 4, W - 8, H - 8);
    ctx.fillStyle = '#e2b53a';
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 10, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = PALETTE.red;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, 6, 0, Math.PI * 2); ctx.fill();
  }, { key: 'clock-tower-town-hall:flag', repeat: false });
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 1.25), textured(tex, { side: THREE.DoubleSide }));
  cloth.position.set(1.0, h - 0.7, 0);
  return new THREE.Group().add(cylinder(0.05, 0.07, h, metal(PALETTE.steelLight), 6), cloth);
}

// Victorian lamp post with a glowing globe.
function lanternLamp(h = 3.4) {
  const iron = mat(PALETTE.black);
  return new THREE.Group().add(
    cylinder(0.16, 0.2, 0.4, iron, 8),
    cylinder(0.06, 0.08, h, iron, 6),
    place(sphere(0.26, emissive(PALETTE.windowLit, 0.8), 10), { y: h + 0.15 }),
    place(cone(0.22, 0.22, iron, 8), { y: h + 0.38 })
  );
}

// 2x1 tiles (20 x 10 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 1], 'grass'));

  const stone = mat(PALETTE.cream);
  const stoneDark = mat('#c9b88f');
  const slate = surface('shingles', PALETTE.roofSlate, { size: 1.6 });
  const brickMat = surface('brick', PALETTE.brick, { size: 1.2 });
  const brickFacade = {
    style: 'brick', wall: PALETTE.brick, frame: PALETTE.white, glass: PALETTE.window,
    windowW: 0.46, windowH: 0.62, lit: 0.15, seed: 36, roof: PALETTE.roofSlate,
  };

  const P = 0.5;              // stone plinth
  const base = y0 + P;
  const FH = 3.3;             // tall civic storeys
  const eave = base + 2 * FH;

  // --- main block: two brick storeys, hipped slate roof ----------------------
  const mw = 17, md = 6, mz = -1.7;
  g.add(place(box(mw + 0.3, P, md + 0.3, stoneDark), { y: y0, z: mz }));
  g.add(place(facadeBlock({ w: mw, d: md, floors: 2, floorHeight: FH, bay: 2.1, ...brickFacade }), { y: base, z: mz }));
  g.add(place(box(mw + 0.2, 0.22, md + 0.2, stone), { y: base + FH - 0.12, z: mz }));
  g.add(place(box(mw + 0.4, 0.4, md + 0.4, stone), { y: eave - 0.4, z: mz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(quoins(2 * FH - 0.4, stone), { x: sx * (mw / 2 - 0.12), y: base, z: mz + sz * (md / 2 - 0.12), ry: sx * sz > 0 ? 0 : 90 }));
  }
  const roofH = 3.2;
  g.add(place(hipRoof({ w: mw, d: md, h: roofH, overhang: 0.35, material: slate }), { y: eave, z: mz }));

  // dormers on the front slope
  for (const x of [-6.2, -4.2, 4.2, 6.2]) {
    const dz = mz + md / 2 - 0.45;
    g.add(place(box(1.3, 1.5, 1.8, brickMat), { x, y: eave + 0.25, z: dz - 0.9 }));
    g.add(place(windowPanel({ w: 0.7, h: 0.9, frame: PALETTE.white }), { x, y: eave + 0.6, z: dz }));
    g.add(place(gableRoof({ w: 1.3, d: 1.8, h: 0.7, overhang: 0.12, ridge: 'z', material: slate, gableMaterial: stone }), { x, y: eave + 1.75, z: dz - 0.9 }));
  }
  // rear service door with a little canopy
  g.add(place(door({ w: 1.2, h: 2.3, color: PALETTE.woodDark }), { x: 4.2, y: base, z: mz - md / 2, ry: 180 }));
  g.add(place(box(1.8, 0.15, 0.5, stone), { x: 4.2, y: base + 2.55, z: mz - md / 2 - 0.25 }));
  // chimneys on the back slope
  for (const x of [-6.5, 6.5]) {
    g.add(place(chimney({ w: 0.8, d: 0.6, h: 2.8, material: brickMat, capMaterial: stone }), { x, y: eave + 1.2, z: mz - 1.6 }));
  }

  // --- entrance pavilion with pediment ---------------------------------------
  const pw = 5.6, pd = 2.4, pz = 1.9, pf = pz + pd / 2;
  g.add(place(box(pw + 0.3, P, pd + 0.15, stoneDark), { y: y0, z: pz + 0.07 }));
  g.add(place(facadeBlock({ w: pw, d: pd, floors: 2, floorHeight: FH, bay: 1.85, ...brickFacade, seed: 37 }), { y: base, z: pz }));
  g.add(place(box(pw + 0.2, 0.22, pd + 0.1, stone), { y: base + FH - 0.12, z: pz + 0.05 }));
  g.add(place(box(pw + 0.5, 0.4, pd + 0.25, stone), { y: eave - 0.4, z: pz + 0.12 }));
  for (const sx of [-1, 1]) g.add(place(quoins(2 * FH - 0.4, stone), { x: sx * (pw / 2 - 0.12), y: base, z: pf - 0.12, ry: sx > 0 ? 0 : 90 }));
  g.add(place(gableRoof({ w: pw + 0.3, d: pd + 0.25, h: 1.9, overhang: 0.25, ridge: 'z', material: slate, gableMaterial: stone }), { y: eave, z: pz + 0.12 }));
  // oculus in the pediment
  g.add(place(cylinder(0.42, 0.42, 0.12, stoneDark, 16), { y: eave + 0.75, z: pf + 0.25, rx: 90 }));
  g.add(place(cylinder(0.3, 0.3, 0.14, mat(PALETTE.window), 16), { y: eave + 0.75, z: pf + 0.27, rx: 90 }));

  g.add(place(archedDoor(stone), { y: base, z: pf }));

  // portico: platform, steps, columns, entablature with sign, balcony on top
  g.add(place(box(4.4, P, 0.9, stoneDark), { y: y0, z: pf + 0.45 }));
  g.add(place(stairs({ w: 4.4, h: P, d: 0.9, steps: 3, material: stone }), { y: y0, z: pf + 1.35 }));
  g.add(place(columns({ count: 2, length: 3.4, radius: 0.22, h: 3.2, material: stone }), { y: base, z: pf + 0.6 }));
  for (const x of [-1.7, 1.7]) g.add(place(box(0.6, 0.2, 0.6, stoneDark), { x, y: base, z: pf + 0.6 }));
  g.add(place(box(4.2, 0.5, 0.95, stone), { y: base + 3.2, z: pf + 0.47 }));
  g.add(place(sign({ text: 'TOWN HALL', w: 3.4, h: 0.42, bg: PALETTE.cream, fg: '#3a2a20', depth: 0.06 }), { y: base + 3.24, z: pf + 0.96 }));
  g.add(place(fence({ w: 4.0, d: 0.85, h: 0.7, style: 'railing', color: PALETTE.black, sides: ['front', 'left', 'right'] }), { y: base + 3.7, z: pf + 0.47 }));
  g.add(place(windowPanel({ w: 1.0, h: 2.0, frame: PALETTE.white }), { y: base + 3.75, z: pf }));

  // --- central clock tower -----------------------------------------------------
  const tw = 4.2, tz = -1.2;
  const shaftTop = base + 4 * FH;
  g.add(place(facadeBlock({ w: tw, d: tw, floors: 4, floorHeight: FH, bay: 4, ...brickFacade, windowW: 0.32, windowH: 0.62, seed: 38 }), { y: base, z: tz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(quoins(4 * FH - 0.1, stone), { x: sx * (tw / 2 - 0.12), y: base, z: tz + sz * (tw / 2 - 0.12), ry: sx * sz > 0 ? 0 : 90 }));
  }
  g.add(place(box(tw + 0.4, 0.4, tw + 0.4, stone), { y: shaftTop, z: tz }));
  // clock stage
  const cs = 4.4, csY = shaftTop + 0.4, csH = 3.8;
  g.add(place(box(cs, csH, cs, stone), { y: csY, z: tz }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.55, csH, 0.55, stoneDark), { x: sx * (cs / 2 - 0.2), y: csY, z: tz + sz * (cs / 2 - 0.2) }));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const off = cs / 2 + 0.02;
    g.add(place(clockFace(3.1), { x: Math.sin(a) * off, y: csY + 0.35, z: tz + Math.cos(a) * off, ry: i * 90 }));
  }
  const corniceY = csY + csH;
  g.add(place(box(cs + 0.5, 0.25, cs + 0.5, stoneDark), { y: corniceY, z: tz }));
  g.add(place(box(cs + 0.7, 0.25, cs + 0.7, stone), { y: corniceY + 0.25, z: tz }));

  // open belfry with a bronze bell
  const bY = corniceY + 0.5, bH = 2.7, bw = 3.8;
  g.add(place(box(bw - 0.4, bH, bw - 0.4, mat('#3b2b24')), { y: bY, z: tz })); // shadowed interior
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.8, bH, 0.8, stone), { x: sx * (bw / 2 - 0.4), y: bY, z: tz + sz * (bw / 2 - 0.4) }));
  }
  for (let i = 0; i < 4; i++) {
    const a = (i * Math.PI) / 2;
    const off = bw / 2 - 0.1;
    // arch head + low balustrade on each side
    g.add(place(box(bw, 0.55, 0.2, stone), { x: Math.sin(a) * off, y: bY + bH - 0.55, z: tz + Math.cos(a) * off, ry: i * 90 }));
    g.add(place(box(bw, 0.5, 0.2, stone), { x: Math.sin(a) * off, y: bY, z: tz + Math.cos(a) * off, ry: i * 90 }));
    const arch = new THREE.Group().add(place(cylinder(0.75, 0.75, 0.22, mat('#3b2b24'), 14), { z: -0.1, rx: 90 }));
    g.add(place(arch, { x: Math.sin(a) * (off + 0.02), y: bY + bH - 0.55, z: tz + Math.cos(a) * (off + 0.02), ry: i * 90 }));
  }
  const bronze = metal('#b08d3a', { roughness: 0.35 });
  g.add(place(cylinder(0.32, 0.6, 0.9, bronze, 12), { y: bY + 0.95, z: tz + 1.7 - 0.05 }));
  g.add(place(box(bw + 0.4, 0.3, bw + 0.4, stone), { y: bY + bH, z: tz }));

  // slate spire, finial and flag
  const spY = bY + bH + 0.3, spH = 6.2;
  g.add(place(pyramidRoof({ w: bw, d: bw, h: spH, overhang: 0.15, material: slate }), { y: spY, z: tz }));
  g.add(place(sphere(0.22, metal(PALETTE.glassGold, { roughness: 0.3 }), 10), { y: spY + spH - 0.2, z: tz }));
  g.add(place(townFlag(3.6), { y: spY + spH - 0.05, z: tz }));

  // --- forecourt & gardens ----------------------------------------------------
  g.add(place(patch(20, 1.5, 'cobbles'), { y: y0, z: 4.25 }));
  g.add(place(patch(4.4, 0.2, 'cobbles'), { y: y0, z: 3.4 }));
  for (const sx of [-1, 1]) {
    // flower beds edged with low hedges in front of each wing
    const bx = sx * 5.6;
    g.add(place(box(4.6, 0.25, 1.5, field('flowers', { size: 2 })), { x: bx, y: y0, z: 2.45 }));
    g.add(place(hedge({ w: 4.8, h: 0.5, d: 0.35 }), { x: bx, y: y0, z: 3.35 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 20 + sx }), { x: sx * 3.4, y: y0, z: 2.5 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 22 + sx }), { x: sx * 7.8, y: y0, z: 2.5 }));
    // lamps flanking the steps, benches on the forecourt
    g.add(place(lanternLamp(), { x: sx * 3.6, y: y0, z: 4.6 }));
    g.add(place(bench({ w: 1.6 }), { x: sx * 5.6, y: y0, z: 4.1, ry: 180 }));
    // trees at the ends of the lot
    g.add(place(tree({ kind: 'round', h: 5.2, seed: 30 + sx }), { x: sx * 8.4, y: y0, z: 3.0 }));
    g.add(place(tree({ kind: 'cone', h: 5.5, seed: 33 + sx }), { x: sx * 8.7, y: y0, z: -2.6 }));
  }
  return g;
}

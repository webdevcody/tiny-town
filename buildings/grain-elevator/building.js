import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, gableRoof, shedRoof, box, cylinder, place, pipe, beam,
  door, tree, fence, hayBale, mat, metal, textured, canvasTexture,
  shade, surface,
} from '../../src/lib/index.js';

// Slip-formed concrete: faint horizontal pour lines and soft vertical weathering streaks.
function siloConcrete() {
  const tex = canvasTexture(128, 128, (ctx, w, h) => {
    ctx.fillStyle = '#cbc6b9';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(90,85,75,0.16)';
    for (let y = 0; y < h; y += 16) ctx.fillRect(0, y, w, 2);
    const streaks = [[6, 0.10], [27, 0.07], [49, 0.12], [70, 0.06], [92, 0.09], [113, 0.07]];
    for (const [x, a] of streaks) {
      const grd = ctx.createLinearGradient(0, 0, 0, h);
      grd.addColorStop(0, `rgba(80,75,65,${a})`);
      grd.addColorStop(1, 'rgba(80,75,65,0)');
      ctx.fillStyle = grd;
      ctx.fillRect(x, 0, 5, h);
    }
  }, { key: 'grain-elevator:silo' });
  tex.repeat.set(1 / 4, 1 / 4);
  return textured(tex, { roughness: 0.9 });
}

// Painted lettering panel; the text texture spans the whole front face (+z).
function letterBoard(text, w, h, { bg = PALETTE.offWhite, fg = PALETTE.red, depth = 0.1 } = {}) {
  const tw = 512, th = Math.max(32, Math.round((tw * h) / w));
  const tex = canvasTexture(tw, th, (ctx, W, H) => {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = fg;
    let size = H * 0.78;
    ctx.font = `bold ${size}px sans-serif`;
    while (ctx.measureText(text).width > W * 0.92 && size > 6) ctx.font = `bold ${--size}px sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(text, W / 2, H / 2 + H * 0.04);
  }, { key: `grain-elevator:board:${text}:${bg}:${fg}:${w}x${h}`, repeat: false });
  const geo = new THREE.BoxGeometry(w, h, depth);
  geo.translate(0, h / 2, 0);
  const side = mat(bg);
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.1, emissiveMap: tex });
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

// Small grain truck: cab + open hopper trailer heaped with wheat. Length along X (cab at +x).
function grainTruck({ color = PALETTE.red } = {}) {
  const g = new THREE.Group();
  const body = mat(color, { roughness: 0.5 });
  const dark = mat(PALETTE.darkGrey);
  g.add(place(box(5.6, 0.3, 1.7, dark), { x: -0.1, y: 0.45 }));
  // cab
  g.add(place(box(1.5, 1.6, 1.8, body), { x: 2.0, y: 0.6 }));
  g.add(place(box(0.05, 0.6, 1.5, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 2.76, y: 1.4 }));
  g.add(place(box(0.5, 0.6, 1.6, body), { x: 2.95, y: 0.6 }));
  // hopper trailer
  const hop = mat(PALETTE.steelLight, { roughness: 0.4, metalness: 0.3 });
  g.add(place(box(3.8, 1.3, 1.9, hop), { x: -0.85, y: 0.75 }));
  g.add(place(box(3.6, 0.12, 1.7, mat(PALETTE.wheat)), { x: -0.85, y: 2.0 }));
  g.add(place(box(2.4, 0.2, 1.2, mat(PALETTE.hay)), { x: -0.85, y: 2.05 }));
  for (const x of [-2.25, -1.5, -0.6, 0.3]) g.add(place(box(0.08, 1.3, 1.95, mat(shade(PALETTE.steelLight, -0.15))), { x, y: 0.75 }));
  const wheelGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 10);
  wheelGeo.rotateX(Math.PI / 2);
  for (const x of [2.1, -0.2, -1.2, -2.2]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(wheelGeo, mat(PALETTE.black));
    w.position.set(x, 0.42, sz * 0.85);
    g.add(w);
  }
  return g;
}

// Steel ladder with safety cage rings, up a wall face (+z outward).
function ladder(h, m) {
  const g = new THREE.Group();
  g.add(place(box(0.06, h, 0.06, m), { x: -0.22 }));
  g.add(place(box(0.06, h, 0.06, m), { x: 0.22 }));
  for (let y = 2.4; y < h; y += 1.0) g.add(place(box(0.56, 0.05, 0.05, m), { y, z: 0.35 }));
  for (const x of [-0.28, 0.28]) g.add(place(box(0.05, h - 2.4, 0.05, m), { x, y: 2.4, z: 0.35 }));
  return g;
}

// 1x1 tile (10 x 10 m). Front (street) faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'gravel'));

  const concrete = siloConcrete();
  const concDark = mat(PALETTE.concreteDark);
  const concTop = mat(shade(PALETTE.concrete, 0.1));
  const steel = metal(PALETTE.steelDark, { roughness: 0.5 });
  const rustM = mat(PALETTE.rust);

  // ---- silo cluster: 3 x 2 slip-form concrete bins ----
  const R = 1.22, H = 13;
  const cols = [-3.75, -1.3, 1.15];
  const rows = [-3.45, -1.0];
  const siloTop = y0 + 0.4 + H;
  for (const x of cols) for (const z of rows) {
    g.add(place(cylinder(R + 0.08, R + 0.08, 0.4, concDark, 20), { x, y: y0, z }));        // footing ring
    g.add(place(cylinder(R, R, H, concrete, 20), { x, y: y0 + 0.4, z }));
    g.add(place(cylinder(R + 0.04, R + 0.04, 0.25, concTop, 20), { x, y: siloTop - 0.25, z })); // top ring
  }
  // star bins between the silos (fill the gaps on the outside faces)
  for (const x of [(cols[0] + cols[1]) / 2, (cols[1] + cols[2]) / 2]) {
    g.add(place(box(0.9, H, 1.6, concrete), { x, y: y0 + 0.4, z: (rows[0] + rows[1]) / 2 }));
  }
  // roof deck over the bins
  const deckW = cols[2] - cols[0] + 2 * R, deckD = rows[1] - rows[0] + 2 * R;
  const deckX = (cols[0] + cols[2]) / 2, deckZ = (rows[0] + rows[1]) / 2;
  g.add(place(box(deckW - 0.6, 0.3, deckD - 0.6, concTop), { x: deckX, y: siloTop - 0.05, z: deckZ }));

  // gallery (conveyor house) running along the silo tops
  const galW = deckW - 0.3, galY = siloTop + 0.25;
  g.add(place(facadeBlock({ w: galW, d: 1.5, h: 2.1, floorHeight: 2.1, style: 'industrial', wall: PALETTE.offWhite, frame: PALETTE.steelLight, glass: PALETTE.window, bay: 1.4, seed: 7, roof: PALETTE.roofGrey }), { x: deckX - 0.1, y: galY, z: deckZ }));
  g.add(place(gableRoof({ w: galW, d: 1.5, h: 0.5, overhang: 0.12, ridge: 'x', material: mat(PALETTE.roofGrey), gableMaterial: PALETTE.offWhite }), { x: deckX - 0.1, y: galY + 2.1, z: deckZ }));
  // railing posts along deck edges
  for (const z of [rows[0] - R + 0.4, rows[1] + R - 0.4]) {
    g.add(place(box(deckW - 0.8, 0.06, 0.06, steel), { x: deckX, y: siloTop + 1.0, z }));
    for (let x = cols[0] - R + 0.5; x < cols[2] + R - 0.3; x += 1.2) g.add(place(box(0.06, 1.0, 0.06, steel), { x, y: siloTop, z }));
  }

  // ---- working house: tall concrete tower with the elevator head house on top ----
  const whX = 3.55, whZ = -2.2, whW = 2.7, whD = 5.0, whH = 18;
  g.add(place(facadeBlock({ w: whW, d: whD, h: whH, floorHeight: 3.6, style: 'punched', wall: '#d6d1c5', frame: PALETTE.concreteDark, glass: PALETTE.window, windowW: 0.22, windowH: 0.3, bay: 2.6, seed: 3, lit: 0.05, roof: PALETTE.concrete, blank: ['left'] }), { x: whX, y: y0, z: whZ }));
  // vertical pilaster strips on the front
  for (const dx of [-whW / 2 + 0.12, whW / 2 - 0.12]) g.add(place(box(0.25, whH, 0.2, concDark), { x: whX + dx, y: y0, z: whZ + whD / 2 + 0.02 }));
  // head house: narrower, taller cupola with red-trimmed gable roof
  const hhY = y0 + whH, hhW = 2.3, hhD = 3.0, hhH = 3.4;
  g.add(place(facadeBlock({ w: hhW, d: hhD, h: hhH, floorHeight: hhH, style: 'industrial', wall: PALETTE.offWhite, frame: PALETTE.steelLight, glass: PALETTE.window, bay: 1.1, seed: 9, roof: PALETTE.roofRed }), { x: whX, y: hhY, z: whZ + 0.4 }));
  g.add(place(gableRoof({ w: hhW, d: hhD, h: 1.0, overhang: 0.2, ridge: 'z', material: surface('corrugated', PALETTE.roofRed, { size: 1.5 }), gableMaterial: PALETTE.offWhite }), { x: whX, y: hhY + hhH, z: whZ + 0.4 }));
  g.add(place(box(whW + 0.1, 0.4, whD + 0.1, concTop), { x: whX, y: hhY - 0.2, z: whZ }));
  // company lettering on the working house front
  g.add(place(letterBoard('CO-OP', 1.4, 0.65, { bg: PALETTE.red, fg: '#ffffff', depth: 0.05 }), { x: whX - 0.4, y: y0 + whH - 1.6, z: whZ + whD / 2 + 0.02 }));
  // big painted band on the gallery-facing side of the silos
  g.add(place(letterBoard('TINY TOWN GRAIN', deckW - 0.4, 0.9, { depth: 0.2 }), { x: deckX, y: siloTop, z: rows[1] + R - 0.25 }));

  // bucket-elevator leg running up the outside of the working house (rust-red casing)
  const legX = whX + 0.75, legZ = whZ + whD / 2 + 0.3;
  const legTop = y0 + whH + 2.4;
  g.add(place(box(0.7, legTop - y0 - 3.4, 0.55, rustM), { x: legX, y: y0 + 3.4, z: legZ }));
  g.add(place(box(0.8, 0.9, 1.35, rustM), { x: legX - 0.05, y: legTop - 0.1, z: legZ - 0.45 }));

  // distribution spouts from the head house down to the silo gallery
  const spoutM = metal(PALETTE.steelLight, { roughness: 0.45 });
  g.add(pipe([whX - hhW / 2, hhY + 2.4, whZ + 0.4], [cols[2] + 0.6, galY + 2.3, deckZ], 0.16, spoutM));
  g.add(place(box(2.4, 0.5, 0.6, mat(PALETTE.offWhite)), { x: whX - whW / 2 - 0.4, y: galY + 0.6, z: deckZ }));

  // ---- truck loading chute: angled spout from the working house over the drive ----
  const chuteTop = [whX - 0.4, y0 + 10.5, whZ + whD / 2];
  const chuteBot = [0.6, y0 + 4.1, 2.45];
  g.add(pipe(chuteTop, chuteBot, 0.24, rustM));
  g.add(place(cylinder(0.18, 0.3, 0.9, rustM, 10), { x: chuteBot[0], y: chuteBot[1] - 0.8, z: chuteBot[2] }));
  g.add(place(box(1.2, 0.8, 0.5, rustM), { x: chuteTop[0], y: chuteTop[1] - 0.4, z: chuteTop[2] + 0.2 }));
  // steel support frame for the chute
  g.add(beam([0.6 - 0.9, y0, 3.5], [0.6, y0 + 4.2, 2.45], 0.14, steel));
  g.add(beam([0.6 + 0.9, y0, 3.5], [0.6, y0 + 4.2, 2.45], 0.14, steel));
  g.add(beam([-0.3, y0 + 2.1, 3.0], [1.5, y0 + 2.1, 3.0], 0.1, steel));

  // ---- receiving shed at the foot of the working house (trucks dump here) ----
  const rsX = 3.6, rsZ = 1.55, rsW = 2.6, rsD = 2.4;
  g.add(place(facadeBlock({ w: rsW, d: rsD, h: 3.2, floorHeight: 3.2, style: 'plain', wall: PALETTE.offWhite, roof: PALETTE.roofGrey, blank: ['front'] }), { x: rsX, y: y0, z: rsZ }));
  g.add(place(shedRoof({ w: rsW, d: rsD, h: 0.6, overhang: 0.1, material: surface('corrugated', PALETTE.roofGrey, { size: 1.5 }), wallMaterial: PALETTE.offWhite }), { x: rsX, y: y0 + 3.2, z: rsZ }));
  g.add(place(box(1.9, 2.6, 0.06, mat(PALETTE.darkGrey)), { x: rsX, y: y0, z: rsZ + rsD / 2 }));
  for (let i = 1; i < 6; i++) g.add(place(box(1.9, 0.04, 0.1, mat(PALETTE.grey)), { x: rsX, y: y0 + i * 0.44, z: rsZ + rsD / 2 }));
  g.add(place(letterBoard('DUMP', 1.4, 0.4, { bg: PALETTE.yellow, fg: PALETTE.black, depth: 0.05 }), { x: rsX, y: y0 + 2.7, z: rsZ + rsD / 2 + 0.04 }));
  g.add(place(patch(2.6, 2.15, 'concrete'), { x: rsX, y: y0, z: 3.85 }));

  // ---- scale house / office at the gate ----
  const ohX = -3.5, ohZ = 2.65;
  g.add(place(facadeBlock({ w: 2.6, d: 2.0, h: 2.6, floorHeight: 2.6, style: 'punched', wall: PALETTE.plasterGreen, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.5, windowH: 0.45, bay: 1.3, seed: 4, lit: 0.3, roof: PALETTE.roofBrown, blank: ['back'] }), { x: ohX, y: y0, z: ohZ }));
  g.add(place(gableRoof({ w: 2.6, d: 2.0, h: 0.9, overhang: 0.25, ridge: 'x', material: surface('roofTiles', PALETTE.roofRed, { size: 1.5 }), gableMaterial: PALETTE.plasterGreen }), { x: ohX, y: y0 + 2.6, z: ohZ }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.woodDark }), { x: ohX + 0.7, y: y0, z: ohZ + 1.0 }));
  g.add(place(letterBoard('SCALE', 1.3, 0.35, { bg: PALETTE.navy, fg: '#ffffff', depth: 0.05 }), { x: ohX - 0.45, y: y0 + 2.15, z: ohZ + 1.02 }));

  // weighbridge platform + loading lane under the chute
  g.add(place(patch(5.4, 2.2, 'concrete'), { x: 0.55, y: y0, z: 2.55 }));
  g.add(place(box(4.6, 0.08, 1.9, mat(PALETTE.steel, { metalness: 0.4, roughness: 0.5 })), { x: 0.55, y: y0 + 0.05, z: 2.55 }));
  g.add(place(grainTruck({ color: PALETTE.red }), { x: 0.55, y: y0 + 0.13, z: 2.55 }));

  // spilled grain heap + sacks beside the receiving shed
  g.add(place(cylinder(0.05, 0.9, 0.7, mat(PALETTE.wheat), 10), { x: -1.95, y: y0, z: 4.35 }));
  for (const [x, z] of [[-1.0, 4.45], [-0.6, 4.6], [-0.8, 4.2]]) g.add(place(box(0.55, 0.35, 0.35, mat(PALETTE.beige)), { x, y: y0, z }));
  g.add(place(box(0.5, 0.35, 0.35, mat(PALETTE.beige)), { x: -0.8, y: y0 + 0.35, z: 4.45 }));

  // ladders up the silos and the working house
  g.add(place(ladder(H + 0.4, steel), { x: cols[0], y: y0, z: rows[1] + R + 0.05 }));

  // ---- landscaping: fence, hay bales, trees ----
  g.add(place(fence({ w: 9.6, d: 9.6, h: 1.0, style: 'wire', sides: ['back', 'left'] }), { y: y0 }));
  g.add(place(hayBale({ r: 0.55 }), { x: -4.4, y: y0, z: 4.4 }));
  g.add(place(hayBale({ r: 0.55 }), { x: -3.2, y: y0, z: 4.4 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 12 }), { x: -4.0, y: y0, z: 1.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 13 }), { x: -2.0, y: y0, z: 1.2 }));
  return g;
}

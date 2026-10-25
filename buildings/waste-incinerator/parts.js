import * as THREE from 'three';
import {
  PALETTE, canvasTexture, signTexture, textured, mat, metal, emissive, box, place, cylinder, shade,
} from '../../src/lib/index.js';

// Bright mosaic colours for the painted facade, low (cool) to high (warm).
export const MOSAIC = ['#2f68c4', '#2fa3c9', '#3fae5a', '#9cc43a', '#f0cc2e', '#f2902a', '#dd4b31', '#c84a8c'];

const PX = 16; // texture pixels per metre

/**
 * Canvas texture for one face of a painted block: a grid of coloured tiles that
 * runs cool to warm diagonally, with white grout, a few white tiles and
 * optional dark glazing bands. bands = [[y0, y1], ...] in metres from the base.
 */
function mosaicTexture(key, wm, hm, { seed = 1, cell = 1.25, shift = 0, bands = [], white = 0.18 } = {}) {
  return canvasTexture(Math.max(16, Math.round(wm * PX)), Math.max(16, Math.round(hm * PX)), (ctx, W, H) => {
    let s = seed * 9301 + 49297;
    const r = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    ctx.fillStyle = PALETTE.white;
    ctx.fillRect(0, 0, W, H);
    const cols = Math.max(1, Math.round(wm / cell)), rows = Math.max(1, Math.round(hm / cell));
    const cw = W / cols, ch = H / rows;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const up = (rows - 1 - j) / Math.max(1, rows - 1); // 0 bottom .. 1 top
      const t = up * 0.75 + ((i + shift) / Math.max(1, cols)) * 0.35 + (r() - 0.5) * 0.3;
      const idx = Math.max(0, Math.min(MOSAIC.length - 1, Math.floor(t * MOSAIC.length)));
      ctx.fillStyle = r() < white ? PALETTE.white : MOSAIC[idx];
      ctx.fillRect(i * cw + 1, j * ch + 1, cw - 2, ch - 2);
    }
    for (const [y0, y1] of bands) {
      const top = H - (y1 / hm) * H, bot = H - (y0 / hm) * H;
      ctx.fillStyle = PALETTE.steelLight;
      ctx.fillRect(0, top - 2, W, bot - top + 4);
      ctx.fillStyle = PALETTE.glassDark;
      ctx.fillRect(0, top, W, bot - top);
      ctx.fillStyle = 'rgba(160,200,235,0.35)';
      ctx.fillRect(0, top, W, (bot - top) * 0.35);
      ctx.fillStyle = PALETTE.steelLight;
      for (let x = 0; x < W; x += PX * 1.5) ctx.fillRect(x, top, 2, bot - top);
    }
  }, { key, repeat: false });
}

/** Box (base at y = 0) with 0..1 UVs per face so each face shows its own mosaic. */
export function paintedBlock(name, w, h, d, { seed = 1, bands = [], roof = PALETTE.concreteDark, white } = {}) {
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  const face = (tag, fw, sd, sh) => textured(mosaicTexture(`waste-incinerator:${name}:${tag}`, fw, h, { seed: seed + sd, shift: sh, bands, white }), { roughness: 0.75 });
  const roofM = mat(roof);
  return new THREE.Mesh(geo, [face('px', d, 1, 4), face('nx', d, 2, 0), roofM, roofM, face('pz', w, 3, 0), face('nz', w, 4, 2)]);
}

/** Readable sign: BoxGeometry has 0..1 UVs, so the text fills the face at any size. Text faces +Z. */
export function bigSign({ text, w, h, depth = 0.2, bg = PALETTE.navy, fg = '#ffffff', border = null, key }) {
  const tw = 512, th = Math.max(16, Math.round(tw * h / w));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

function wheel(x, z, r = 0.48) {
  const g = new THREE.CylinderGeometry(r, r, 0.32, 12);
  g.rotateX(Math.PI / 2);
  const m = new THREE.Mesh(g, mat(PALETTE.black));
  m.position.set(x, r, z);
  return m;
}

/** Refuse collection lorry, ~6.4 m long along X, cab at +X. */
export function refuseLorry({ body = '#3c9a4a', stripe = PALETTE.yellow, cab = PALETTE.white } = {}) {
  const g = new THREE.Group();
  const bodyM = mat(body, { roughness: 0.5, metalness: 0.2 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  g.add(place(box(6.0, 0.35, 1.9, mat(PALETTE.darkGrey)), { x: 0, y: 0.45 }));
  // cab (low-entry city cab)
  g.add(place(box(1.7, 1.95, 2.3, mat(cab, { roughness: 0.45 })), { x: 2.25, y: 0.55 }));
  g.add(place(box(0.06, 0.95, 2.0, glassM), { x: 3.12, y: 1.35 }));
  g.add(place(box(1.0, 0.7, 2.32, glassM), { x: 2.35, y: 1.6 }));
  g.add(place(box(0.08, 0.25, 2.1, mat(PALETTE.darkGrey)), { x: 3.12, y: 0.65 }));
  g.add(place(box(0.25, 0.14, 0.4, emissive(PALETTE.orange, 0.9)), { x: 2.0, y: 2.5 }));
  // compactor body: tall box with rounded top
  g.add(place(box(4.0, 2.2, 2.4, bodyM), { x: -0.45, y: 0.8 }));
  const roofGeo = new THREE.CylinderGeometry(1.2, 1.2, 4.0, 12, 1, false, 0, Math.PI);
  roofGeo.rotateZ(Math.PI / 2);
  roofGeo.scale(1, 0.3, 1);
  const roofMesh = new THREE.Mesh(roofGeo, bodyM);
  roofMesh.position.set(-0.45, 3.0, 0);
  g.add(roofMesh);
  g.add(place(box(4.02, 0.32, 2.42, mat(stripe)), { x: -0.45, y: 1.3 }));
  // rear loader / hopper (slanted tailgate)
  const tail = place(box(0.9, 2.5, 2.4, mat(shade(body, -0.25))), { x: -2.75, y: 0.6 });
  tail.rotation.z = THREE.MathUtils.degToRad(-12);
  g.add(tail);
  g.add(place(box(0.5, 0.6, 2.1, metal(PALETTE.steelDark)), { x: -3.0, y: 0.75 }));
  for (const z of [-1.0, 1.0]) {
    g.add(wheel(2.2, z));
    g.add(wheel(-0.9, z));
    g.add(wheel(-2.0, z));
  }
  return g;
}

/** Stainless flue stack with rainbow bands, gold sphere viewing deck and red aviation tip. */
export function flueStack({ h = 34, r = 0.95, rTop = 0.75, ballY = 24, ballR = 1.7 } = {}) {
  const g = new THREE.Group();
  const steelM = mat('#d3d9de', { roughness: 0.45, metalness: 0.25 });
  const rAt = (y) => r + (rTop - r) * (y / h);
  g.add(cylinder(rAt(h), r, h, steelM, 16));
  // rainbow bands below the sphere
  const bandH = 0.7;
  MOSAIC.forEach((c, i) => {
    const y = ballY - ballR - 1.2 - (MOSAIC.length - i) * bandH;
    g.add(place(cylinder(rAt(y + bandH) + 0.04, rAt(y) + 0.04, bandH, mat(c), 16), { y }));
  });
  // gold sphere with a viewing-deck ring and windows
  const goldM = metal(PALETTE.glassGold, { roughness: 0.25 });
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(ballR, 20, 14), goldM), { y: ballY }));
    g.add(place(cylinder(ballR + 0.02, ballR + 0.02, 0.5, mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.4 }), 20), { y: ballY + 0.15 }));
  // red/white aviation tip and dark mouth
  g.add(place(cylinder(rTop + 0.05, rAt(h - 1.4) + 0.05, 1.4, mat(PALETTE.red), 16), { y: h - 1.4 }));
  g.add(place(cylinder(rTop + 0.12, rTop + 0.12, 0.25, mat(PALETTE.steelDark), 16), { y: h }));
  g.add(place(cylinder(rTop * 0.8, rTop * 0.8, 0.05, mat(PALETTE.black), 12), { y: h + 0.25 }));
  g.add(place(box(0.2, 0.2, 0.2, emissive(PALETTE.red, 1)), { x: rTop + 0.15, y: h - 0.6 }));
  return g;
}

/** Bottle bank / recycling bin, ~1.5 m. */
export function recyclingBin(color) {
  const g = new THREE.Group();
  g.add(box(1.3, 1.4, 1.2, mat(color, { roughness: 0.5 })));
  g.add(place(box(1.4, 0.15, 1.3, mat(shade(color, -0.25))), { y: 1.4 }));
  g.add(place(cylinder(0.18, 0.18, 0.06, mat(PALETTE.black), 10), { y: 1.55 }));
  g.add(place(box(0.5, 0.5, 0.02, mat(PALETTE.white)), { y: 0.6, z: 0.61 }));
  return g;
}

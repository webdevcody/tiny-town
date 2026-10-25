// Shared, cached materials. Same arguments -> same material instance, which
// keeps the gallery fast and draw calls low.
//
// All lib geometry uses UVs measured in METRES, so textured materials made with
// surface() tile at a real-world size regardless of how big the mesh is.

import * as THREE from 'three';
import { PALETTE } from './palette.js';
import { surfaceTexture, facadeTexture, fieldTexture } from './textures.js';

const cache = new Map();

function cached(key, make) {
  if (!cache.has(key)) cache.set(key, make());
  return cache.get(key);
}

/**
 * Plain flat-shaded material.
 *   mat('#c03030')
 *   mat(PALETTE.brick, { roughness: 0.9 })
 * options: roughness (0.85), metalness (0), emissive, emissiveIntensity,
 *          transparent, opacity, side, flatShading (true), map
 */
export function mat(color = PALETTE.white, opts = {}) {
  const key = 'mat:' + color + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v));
  return cached(key, () =>
    new THREE.MeshStandardMaterial({
      color,
      roughness: 0.85,
      metalness: 0,
      flatShading: true,
      ...opts,
    })
  );
}

/** Reflective glass (opaque by default; pass { opacity: 0.6 } for see-through). */
export function glass(color = PALETTE.glassBlue, { opacity = 1 } = {}) {
  return mat(color, {
    roughness: 0.12,
    metalness: 0.55,
    transparent: opacity < 1,
    opacity,
    flatShading: false,
  });
}

/** Brushed metal. */
export function metal(color = PALETTE.steel, { roughness = 0.4 } = {}) {
  return mat(color, { roughness, metalness: 0.65 });
}

/** Self-lit material for neon, lamps, screens. */
export function emissive(color = PALETTE.windowLit, intensity = 1) {
  return mat(color, { emissive: color, emissiveIntensity: intensity, roughness: 0.6 });
}

/** Water surface. */
export function water(color = PALETTE.water) {
  return cached('water:' + color, () =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: tiled(surfaceTexture('water', color), 6),
      roughness: 0.15,
      metalness: 0.2,
    })
  );
}

function tiled(tex, size) {
  // textures are shared/cached; clone so each repeat size gets its own
  // (clones share the underlying image, so this is cheap)
  const t = tex.clone();
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / size, 1 / size);
  t.needsUpdate = true;
  return t;
}

/**
 * Tiling textured material (see textures.surfaceTexture for kinds).
 *   surface('roofTiles', PALETTE.terracotta)
 *   surface('corrugated', PALETTE.steel, { size: 3 })
 *   surface('stripes', PALETTE.red, { color2: PALETTE.white, size: 2 })
 * size = metres covered by one texture repeat (default 4).
 */
export function surface(kind, color, { size = 4, color2, seed, roughness = 0.85, metalness = 0 } = {}) {
  const key = 'surface:' + JSON.stringify({ kind, color, size, color2, seed, roughness, metalness });
  return cached(key, () =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: tiled(surfaceTexture(kind, color, { color2, seed }), size),
      roughness,
      metalness,
      flatShading: true,
    })
  );
}

/** Crop field material. crop: wheat | corn | cabbage | vineyard | sunflower | plowed | orchard | flowers */
export function field(crop = 'wheat', { size = 8, seed } = {}) {
  return cached('field:' + crop + size + seed, () =>
    new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: tiled(fieldTexture(crop, { seed }), size),
      roughness: 0.95,
      flatShading: true,
    })
  );
}

/**
 * Facade material (window grid). Prefer facadeBlock()/facadeCylinder()/prismBlock()
 * which set up UVs so one texture cell = one bay x one storey.
 * Options are the same as textures.facadeTexture().
 */
export function facade(opts = {}) {
  const key = 'facade:' + JSON.stringify(opts);
  return cached(key, () => {
    const tex = facadeTexture(opts);
    const isGlass = opts.style === 'curtain';
    const m = new THREE.MeshStandardMaterial({
      color: '#ffffff',
      map: tex,
      roughness: isGlass ? 0.25 : 0.85,
      metalness: isGlass ? 0.35 : 0,
      flatShading: true,
    });
    m.userData.cols = tex.userData.cols;
    m.userData.rows = tex.userData.rows;
    return m;
  });
}

/** Material from any texture you made with canvasTexture(). */
export function textured(texture, opts = {}) {
  return cached('tex:' + texture.uuid + JSON.stringify(opts, (k, v) => (v && v.isTexture ? v.uuid : v)), () =>
    new THREE.MeshStandardMaterial({ color: '#ffffff', map: texture, roughness: 0.8, flatShading: true, ...opts })
  );
}

/**
 * Ready-made plain materials. MAT.concrete, MAT.glass, MAT.steel, ...
 * (Getters, so nothing is created until used.)
 */
export const MAT = {
  get white() { return mat(PALETTE.white); },
  get concrete() { return mat(PALETTE.concrete); },
  get concreteDark() { return mat(PALETTE.concreteDark); },
  get asphalt() { return mat(PALETTE.asphalt, { roughness: 0.95 }); },
  get pavement() { return mat(PALETTE.pavement); },
  get brick() { return surface('brick', PALETTE.brick, { size: 2 }); },
  get stone() { return mat(PALETTE.stone); },
  get wood() { return mat(PALETTE.wood); },
  get woodDark() { return mat(PALETTE.woodDark); },
  get roofRed() { return surface('roofTiles', PALETTE.roofRed, { size: 2 }); },
  get roofSlate() { return surface('shingles', PALETTE.roofSlate, { size: 2 }); },
  get roofGrey() { return mat(PALETTE.roofGrey); },
  get roofGreen() { return mat(PALETTE.roofGreen, { roughness: 0.6, metalness: 0.2 }); },
  get glass() { return glass(PALETTE.glassBlue); },
  get glassDark() { return glass(PALETTE.glassDark); },
  get window() { return mat(PALETTE.window, { roughness: 0.3, metalness: 0.3 }); },
  get windowLit() { return emissive(PALETTE.windowLit, 0.6); },
  get steel() { return metal(PALETTE.steel); },
  get steelDark() { return metal(PALETTE.steelDark); },
  get aluminium() { return metal(PALETTE.aluminium, { roughness: 0.3 }); },
  get rust() { return mat(PALETTE.rust); },
  get corrugated() { return surface('corrugated', PALETTE.steelLight, { size: 2, metalness: 0.3, roughness: 0.6 }); },
  get water() { return water(); },
  get pool() { return water(PALETTE.pool); },
  get foliage() { return mat(PALETTE.foliage); },
  get foliageDark() { return mat(PALETTE.foliageDark); },
  get foliageLight() { return mat(PALETTE.foliageLight); },
  get trunk() { return mat(PALETTE.trunk); },
  get grass() { return surface('grass', PALETTE.grass, { size: 4 }); },
  get dirt() { return surface('gravel', PALETTE.dirt, { size: 4 }); },
  get gravel() { return surface('gravel', PALETTE.gravel, { size: 3 }); },
  get sand() { return surface('gravel', PALETTE.sand, { size: 4 }); },
  get paving() { return surface('paving', PALETTE.paving, { size: 4 }); },
  get hazard() { return surface('hazard', PALETTE.yellow, { size: 1 }); },
  get solar() { return surface('solar', '#1d2c4a', { size: 1, roughness: 0.25, metalness: 0.4 }); },
  get black() { return mat(PALETTE.black); },
  get red() { return mat(PALETTE.red); },
  get yellow() { return mat(PALETTE.yellow); },
};

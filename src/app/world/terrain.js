// Ground, roads and trees for the world view. Everything repeated is an
// InstancedMesh: one draw call per tile kind / road shape / tree part.

import * as THREE from 'three';
import { TILE, PALETTE, SWATCHES, canvasTexture, shade, rng, field } from '../../lib/index.js';

const PX = 128; // texture pixels per tile

function noise(ctx, W, H, color, r, n = 220, amt = 0.05, size = 3) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = shade(color, r() < 0.5 ? amt : -amt);
    ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), size, size);
  }
}

function tileTexture(key, draw) {
  const tex = canvasTexture(PX, PX, draw, { key: 'world:' + key });
  tex.anisotropy = 8;
  return tex;
}

/** Grass with a faint tile grid, OpenTTD style. Repeats once per tile. */
function grassTexture() {
  return tileTexture('grass', (ctx, W, H) => {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, W, H);
    noise(ctx, W, H, PALETTE.grass, rng('world-grass'), 260, 0.07);
    ctx.fillStyle = shade(PALETTE.grass, -0.12);
    ctx.fillRect(0, 0, W, 1);
    ctx.fillRect(0, 0, 1, H);
  });
}

/** Neutral light tile, tinted per instance (plazas, yards, park lawns). */
function lotTexture() {
  return tileTexture('lot', (ctx, W, H) => {
    ctx.fillStyle = '#e6e6e6';
    ctx.fillRect(0, 0, W, H);
    noise(ctx, W, H, '#e6e6e6', rng('world-lot'), 300, 0.06, 2);
    ctx.strokeStyle = '#c4c4c4';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  });
}

const KERB = 18; // sidewalk width in texture pixels (~1.4 m)

function asphalt(ctx, W, H) {
  ctx.fillStyle = PALETTE.asphalt;
  ctx.fillRect(0, 0, W, H);
  noise(ctx, W, H, PALETTE.asphalt, rng('world-asphalt'), 260, 0.05, 2);
}

function sidewalk(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.pavement;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = shade(PALETTE.pavement, -0.18);
  // kerb edge on the road side is drawn by the caller's geometry; add slab joints
  for (let i = x; i < x + w; i += 16) ctx.fillRect(i, y, 1, h);
  for (let j = y; j < y + h; j += 16) ctx.fillRect(x, j, w, 1);
}

/** Straight road running along U (east-west); rotate the instance for north-south. */
function straightTexture() {
  return tileTexture('road-straight', (ctx, W, H) => {
    asphalt(ctx, W, H);
    sidewalk(ctx, 0, 0, W, KERB);
    sidewalk(ctx, 0, H - KERB, W, KERB);
    ctx.fillStyle = shade(PALETTE.pavement, -0.35);
    ctx.fillRect(0, KERB, W, 2);
    ctx.fillRect(0, H - KERB - 2, W, 2);
    ctx.fillStyle = PALETTE.roadLine;
    for (let x = 8; x < W; x += 64) ctx.fillRect(x, H / 2 - 2, 36, 4);
  });
}

/** Junction tile for a given set of connected sides (n, e, s, w). */
function junctionTexture(links) {
  const id = ['n', 'e', 's', 'w'].map((k) => (links[k] ? k : '-')).join('');
  return tileTexture('road-junction-' + id, (ctx, W, H) => {
    asphalt(ctx, W, H);
    // corner sidewalks always; closed sides get a full sidewalk
    sidewalk(ctx, 0, 0, KERB, KERB);
    sidewalk(ctx, W - KERB, 0, KERB, KERB);
    sidewalk(ctx, 0, H - KERB, KERB, KERB);
    sidewalk(ctx, W - KERB, H - KERB, KERB, KERB);
    if (!links.n) sidewalk(ctx, 0, 0, W, KERB);
    if (!links.s) sidewalk(ctx, 0, H - KERB, W, KERB);
    if (!links.w) sidewalk(ctx, 0, 0, KERB, H);
    if (!links.e) sidewalk(ctx, W - KERB, 0, KERB, H);
    // zebra crossings on open sides of real junctions
    const open = ['n', 'e', 's', 'w'].filter((k) => links[k]).length;
    if (open >= 3) {
      ctx.fillStyle = '#e9e9e2';
      for (let t = KERB + 4; t < W - KERB - 4; t += 10) {
        if (links.n) ctx.fillRect(t, 2, 6, 12);
        if (links.s) ctx.fillRect(t, H - 14, 6, 12);
        if (links.w) ctx.fillRect(2, t, 12, 6);
        if (links.e) ctx.fillRect(W - 14, t, 12, 6);
      }
    }
  });
}

/** Flat tile geometry (TILE x TILE) facing up, UVs 0..1 (or metres with uvScale). */
function tileGeometry(uvScale = 1) {
  const g = new THREE.PlaneGeometry(TILE, TILE);
  g.rotateX(-Math.PI / 2);
  if (uvScale !== 1) {
    const uv = g.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * uvScale, uv.getY(i) * uvScale);
  }
  return g;
}

function instanced(geometry, material, transforms, { colors = null, shadow = false } = {}) {
  const mesh = new THREE.InstancedMesh(geometry, material, transforms.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  transforms.forEach((t, i) => {
    q.setFromAxisAngle(up, t.ry ?? 0);
    m.compose(new THREE.Vector3(t.x, t.y ?? 0, t.z), q, new THREE.Vector3(t.sx ?? 1, t.sy ?? 1, t.sz ?? 1));
    mesh.setMatrixAt(i, m);
    if (colors) mesh.setColorAt(i, colors[i]);
  });
  mesh.instanceMatrix.needsUpdate = true;
  mesh.computeBoundingSphere();
  mesh.receiveShadow = true;
  mesh.castShadow = shadow;
  return mesh;
}

/** What to put on the empty tiles of a block, by district ground type. */
const GROUND = {
  plaza: { color: PALETTE.paving, trees: [0, 1], kinds: ['round'] },
  park: { color: PALETTE.grassLight, trees: [2, 5], kinds: ['round', 'round', 'cone'] },
  meadow: { crop: true, trees: [0, 0], kinds: [] },
  yard: { color: PALETTE.concrete, trees: [0, 1], kinds: ['cone'] },
};

/**
 * Build the terrain for a town plan.
 * toWorld(tx, tz) -> { x, z } = world centre of tile (tx, tz).
 * Returns { group, bounds: { x0, z0, x1, z1 } } where bounds is the slab rectangle in world units.
 */
export function buildTerrain(plan, toWorld, { margin = 6 } = {}) {
  const group = new THREE.Group();
  group.name = 'terrain';
  const r = rng('world-terrain');

  // --- ground slab -----------------------------------------------------------
  const nx = plan.tilesX + margin * 2;
  const nz = plan.tilesZ + margin * 2;
  const grass = grassTexture().clone();
  grass.repeat.set(nx, nz);
  grass.needsUpdate = true;
  const topM = new THREE.MeshStandardMaterial({ color: '#ffffff', map: grass, roughness: 1 });
  const sideM = new THREE.MeshStandardMaterial({ color: shade(PALETTE.dirt, -0.05), roughness: 1, flatShading: true });
  const depth = 6;
  const slab = new THREE.Mesh(new THREE.BoxGeometry(nx * TILE, depth, nz * TILE), [sideM, sideM, topM, sideM, sideM, sideM]);
  const c0 = toWorld(-margin, -margin);
  const c1 = toWorld(plan.tilesX + margin - 1, plan.tilesZ + margin - 1);
  slab.position.set((c0.x + c1.x) / 2, -depth / 2 - 0.02, (c0.z + c1.z) / 2);
  slab.receiveShadow = true;
  slab.name = 'ground';
  group.add(slab);
  const bounds = { x0: c0.x - TILE / 2, z0: c0.z - TILE / 2, x1: c1.x + TILE / 2, z1: c1.z + TILE / 2 };

  // --- roads -----------------------------------------------------------------
  const roadGeo = tileGeometry();
  const straight = [];
  const junctions = new Map();
  const occupied = new Set();
  for (const rd of plan.roads) {
    occupied.add(rd.tx + ',' + rd.tz);
    const p = toWorld(rd.tx, rd.tz);
    if (rd.kind === 'junction') {
      const id = ['n', 'e', 's', 'w'].map((k) => (rd.links[k] ? k : '-')).join('');
      if (!junctions.has(id)) junctions.set(id, { links: rd.links, list: [] });
      junctions.get(id).list.push({ x: p.x, y: 0.04, z: p.z });
    } else {
      straight.push({ x: p.x, y: 0.04, z: p.z, ry: rd.kind === 'z' ? Math.PI / 2 : 0 });
    }
  }
  const roadMat = (tex) => new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex, roughness: 0.95 });
  const roads = new THREE.Group();
  roads.name = 'roads';
  roads.add(instanced(roadGeo, roadMat(straightTexture()), straight));
  for (const { links, list } of junctions.values()) roads.add(instanced(roadGeo, roadMat(junctionTexture(links)), list));
  group.add(roads);

  // --- block filler: empty tiles get a lot surface and some trees ------------
  const lotTiles = [];
  const lotColors = [];
  const cropTiles = new Map();
  const trees = [];
  for (const b of plan.blocks) {
    const gd = GROUND[b.district.ground] ?? GROUND.park;
    for (const [tx, tz] of b.empty) {
      occupied.add(tx + ',' + tz);
      const p = toWorld(tx, tz);
      if (gd.crop) {
        const crop = r.pick(['wheat', 'wheat', 'cabbage', 'corn', 'plowed']);
        if (!cropTiles.has(crop)) cropTiles.set(crop, []);
        cropTiles.get(crop).push({ x: p.x, y: 0.03, z: p.z, ry: r() < 0.5 ? 0 : Math.PI / 2 });
        continue;
      }
      lotTiles.push({ x: p.x, y: 0.03, z: p.z });
      lotColors.push(new THREE.Color(shade(gd.color, (r() - 0.5) * 0.06)));
      const n = Math.round(gd.trees[0] + r() * (gd.trees[1] - gd.trees[0]));
      for (let k = 0; k < n; k++) {
        trees.push({ x: p.x + (r() - 0.5) * TILE * 0.75, z: p.z + (r() - 0.5) * TILE * 0.75, kind: r.pick(gd.kinds), h: 5 + r() * 3 });
      }
    }
  }
  if (lotTiles.length) {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', map: lotTexture(), roughness: 0.95 });
    group.add(instanced(tileGeometry(), m, lotTiles, { colors: lotColors }));
  }
  for (const [crop, list] of cropTiles) group.add(instanced(tileGeometry(TILE), field(crop), list));

  // --- countryside: woods and copses around (and inside the corners of) town
  for (const p of plan.placements) for (let z = p.tz; z < p.tz + p.d; z++) for (let x = p.tx; x < p.tx + p.w; x++) occupied.add(x + ',' + z);
  const wood = (x, z) => {
    // cheap smooth-ish noise from a few sines: clumps of forest with clearings
    return Math.sin(x * 0.37 + 1.3) * Math.cos(z * 0.29 - 0.7) + Math.sin((x + z) * 0.17) * 0.6 + Math.cos(x * 0.11 - z * 0.23) * 0.4;
  };
  for (let tz = -margin; tz < plan.tilesZ + margin; tz++) {
    for (let tx = -margin; tx < plan.tilesX + margin; tx++) {
      if (occupied.has(tx + ',' + tz)) continue;
      // keep a clear verge right next to the town roads
      if (occupied.has(tx + 1 + ',' + tz) || occupied.has(tx - 1 + ',' + tz) || occupied.has(tx + ',' + (tz + 1)) || occupied.has(tx + ',' + (tz - 1))) {
        if (r() < 0.7) continue;
      }
      const w = wood(tx, tz);
      const n = w > 0.55 ? 3 + Math.floor(r() * 3) : w > 0.1 ? (r() < 0.45 ? 1 : 0) : r() < 0.06 ? 1 : 0;
      const p = toWorld(tx, tz);
      for (let k = 0; k < n; k++) {
        trees.push({ x: p.x + (r() - 0.5) * TILE * 0.9, z: p.z + (r() - 0.5) * TILE * 0.9, kind: r() < 0.45 ? 'cone' : 'round', h: 5 + r() * 5 });
      }
    }
  }
  group.add(buildTrees(trees, r));
  return { group, bounds, treeCount: trees.length };
}

/** All trees as three InstancedMeshes: trunks, round crowns, conifer crowns. */
function buildTrees(trees, r) {
  const g = new THREE.Group();
  g.name = 'trees';
  const trunkGeo = new THREE.CylinderGeometry(0.22, 0.32, 1, 6).translate(0, 0.5, 0);
  const roundGeo = new THREE.IcosahedronGeometry(1, 0);
  const coneGeo = new THREE.ConeGeometry(1, 1, 7).translate(0, 0.5, 0);
  const leafM = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.9, flatShading: true });
  const trunkM = new THREE.MeshStandardMaterial({ color: PALETTE.trunk, roughness: 0.9, flatShading: true });
  const trunks = [], rounds = [], cones = [];
  const roundCol = [], coneCol = [];
  for (const t of trees) {
    const ry = r() * Math.PI * 2;
    if (t.kind === 'cone') {
      trunks.push({ x: t.x, z: t.z, sy: t.h * 0.25, ry });
      cones.push({ x: t.x, y: t.h * 0.18, z: t.z, sx: t.h * 0.24, sy: t.h * 0.85, sz: t.h * 0.24, ry });
      coneCol.push(new THREE.Color(shade(PALETTE.foliageDark, (r() - 0.5) * 0.2)));
    } else {
      trunks.push({ x: t.x, z: t.z, sy: t.h * 0.45, ry });
      rounds.push({ x: t.x, y: t.h * 0.62, z: t.z, sx: t.h * 0.32, sy: t.h * 0.3, sz: t.h * 0.32, ry });
      roundCol.push(new THREE.Color(shade(r.pick(SWATCHES.foliage), (r() - 0.5) * 0.16)));
    }
  }
  if (trunks.length) g.add(instanced(trunkGeo, trunkM, trunks, { shadow: true }));
  if (rounds.length) g.add(instanced(roundGeo, leafM, rounds, { colors: roundCol, shadow: true }));
  if (cones.length) g.add(instanced(coneGeo, leafM, cones, { colors: coneCol, shadow: true }));
  return g;
}

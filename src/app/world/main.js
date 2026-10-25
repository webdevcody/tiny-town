// World view: every building on one isometric map, grouped into districts.
//   world.html            whole town
//   world.html?b=<slug>   fly to a building and select it
//   world.html?stats      (always on) FPS / draw-call overlay; window.__world for scripts
import * as THREE from 'three';
import { BUILDINGS, buildBuilding } from '../registry.js';
import { createRenderer, createScene, fitSun } from '../stage.js';
import { TILE } from '../../lib/index.js';
import { planTown } from './layout.js';
import { WorldBatcher, buildingIdOf } from './merge.js';
import { buildTerrain } from './terrain.js';
import { IsoCameraRig, ISO_AZIMUTH, ISO_ELEVATION } from './camera.js';

const $ = (id) => document.getElementById(id);
const canvas = $('view-canvas');
const params = new URLSearchParams(location.search);
const BACKGROUND = '#202a38';

const renderer = createRenderer({ canvas, width: innerWidth, height: innerHeight });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
// the town never moves: render the shadow map once, not every frame
renderer.shadowMap.autoUpdate = false;
const scene = createScene(renderer);
scene.background = new THREE.Color(BACKGROUND);
const rig = new IsoCameraRig(canvas);
rig.resize(innerWidth / innerHeight);

const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/** [{ entry, obj, box, height, center, radius, district }] indexed by id */
const buildings = [];
let pickables = [];
let selected = -1;
const highlight = new THREE.Group();
scene.add(highlight);
const labels = [];

// --- loading -----------------------------------------------------------------

async function load() {
  const progress = $('progress');
  const t0 = performance.now();
  for (let i = 0; i < BUILDINGS.length; i++) {
    const entry = BUILDINGS[i];
    try {
      const t = performance.now();
      const obj = await buildBuilding(entry);
      const box = new THREE.Box3().setFromObject(obj);
      buildings.push({ id: buildings.length, entry, obj, height: box.max.y, ms: performance.now() - t });
    } catch (err) {
      console.error(entry.slug, err);
    }
    if (i % 4 === 3 || i === BUILDINGS.length - 1) {
      progress.style.width = `${(((i + 1) / BUILDINGS.length) * 80).toFixed(1)}%`;
      $('loading-text').textContent = `Building ${i + 1} / ${BUILDINGS.length}: ${entry.meta.name}`;
      await new Promise((r) => setTimeout(r, 0));
    }
  }
  const buildMs = performance.now() - t0;

  // --- plan the town and place every building --------------------------------
  const plan = planTown(buildings.map((b) => ({ id: b.id, category: b.entry.meta.category, footprint: b.entry.meta.footprint, height: b.height })));
  const toWorld = (tx, tz) => ({ x: (tx + 0.5 - plan.tilesX / 2) * TILE, z: (tz + 0.5 - plan.tilesZ / 2) * TILE });
  $('loading-text').textContent = 'Merging meshes…';
  await new Promise((r) => setTimeout(r, 0));

  const batcher = new WorldBatcher();
  for (const p of plan.placements) {
    const b = buildings[p.id];
    const x = (p.tx + p.w / 2 - plan.tilesX / 2) * TILE;
    const z = (p.tz + p.d / 2 - plan.tilesZ / 2) * TILE;
    b.obj.position.set(x, 0, z);
    b.obj.rotation.y = p.rot;
    b.obj.updateMatrixWorld(true);
    b.box = new THREE.Box3().setFromObject(b.obj);
    b.center = b.box.getCenter(new THREE.Vector3());
    b.radius = b.box.getSize(new THREE.Vector3()).length() / 2;
    b.district = p.district;
    batcher.add(b.obj, b.id, p.chunk);
    b.obj = null; // the merged meshes replace it
  }
  const sourceMeshes = batcher.stats.meshes;
  const t1 = performance.now();
  const { meshes, loose } = batcher.build();
  const mergeMs = performance.now() - t1;
  const town = new THREE.Group();
  town.name = 'buildings';
  town.add(...meshes, ...loose);
  scene.add(town);
  pickables = meshes;

  const terrain = buildTerrain(plan, toWorld);
  scene.add(terrain.group);

  // --- light & camera -----------------------------------------------------------
  const townBox = new THREE.Box3();
  for (const b of buildings) if (b.box) townBox.union(b.box);
  townBox.expandByPoint(new THREE.Vector3(terrain.bounds.x0, 0, terrain.bounds.z0));
  townBox.expandByPoint(new THREE.Vector3(terrain.bounds.x1, 0, terrain.bounds.z1));
  fitSun(scene, townBox);
  const sun = scene.userData.sun;
  sun.shadow.mapSize.set(4096, 4096);
  sun.shadow.normalBias = 0.12;
  sun.shadow.bias = -0.0006;
  renderer.shadowMap.needsUpdate = true;

  const center = new THREE.Vector3((terrain.bounds.x0 + terrain.bounds.x1) / 2, 0, (terrain.bounds.z0 + terrain.bounds.z1) / 2);
  const cityBox = new THREE.Box3();
  for (const b of buildings) if (b.box) cityBox.union(b.box);
  rig.setFrame(fitHalfHeight(cityBox, center), innerWidth / innerHeight);
  rig.controls.maxZoom = rig.halfHeight / 8;
  rig.setHome(center, 1);
  rig.setView({ target: center, azimuth: ISO_AZIMUTH, elevation: ISO_ELEVATION, zoom: 1 });

  // --- district labels --------------------------------------------------------
  for (const d of plan.districts) {
    const el = document.createElement('div');
    el.className = 'district-label';
    el.textContent = d.name;
    $('labels').append(el);
    const p = new THREE.Vector3((d.center[0] - plan.tilesX / 2) * TILE, 4, (d.center[1] - plan.tilesZ / 2) * TILE);
    labels.push({ el, p, district: d });
  }

  const info = {
    buildings: buildings.length,
    sourceMeshes,
    mergedMeshes: meshes.length,
    triangles: meshes.reduce((s, m) => s + m.geometry.index.count / 3, 0),
    trees: terrain.treeCount,
    roadTiles: plan.roads.length,
    tiles: [plan.tilesX, plan.tilesZ],
    districts: plan.districts.map((d) => ({ name: d.name, blocks: d.blocks, buildings: d.buildings })),
    buildMs: Math.round(buildMs),
    mergeMs: Math.round(mergeMs),
    batch: batcher.stats,
    slowest: buildings.slice().sort((a, b) => b.ms - a.ms).slice(0, 5).map((b) => `${b.entry.slug} ${Math.round(b.ms)}ms`),
  };
  window.__world.info = info;
  console.log('world', info);

  renderHud();
  $('loading').remove();
  const slug = params.get('b');
  if (slug) {
    const b = buildings.find((x) => x.entry.slug === slug);
    if (b) select(b.id, { fly: true });
  }
  window.__world.ready = true;
}

/** Half-height (world units) that fits the town at the default iso view, any of the four quarter turns. */
function fitHalfHeight(box, center) {
  const cam = new THREE.OrthographicCamera();
  let halfH = 1;
  const aspect = innerWidth / innerHeight;
  for (const az of [45, 135, 225, 315]) {
    const a = THREE.MathUtils.degToRad(az), e = THREE.MathUtils.degToRad(ISO_ELEVATION);
    cam.position.copy(center).add(new THREE.Vector3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)).multiplyScalar(100));
    cam.lookAt(center);
    cam.updateMatrixWorld();
    for (let i = 0; i < 8; i++) {
      const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
      p.applyMatrix4(cam.matrixWorldInverse);
      halfH = Math.max(halfH, Math.abs(p.y) * 1.04, (Math.abs(p.x) / aspect) * 1.04);
    }
  }
  return halfH;
}

// --- selection ------------------------------------------------------------------

function select(id, { fly = false } = {}) {
  selected = id;
  highlight.clear();
  const panel = $('info');
  if (id < 0) {
    panel.hidden = true;
    history.replaceState(null, '', location.pathname);
    return;
  }
  const b = buildings[id];
  const m = b.entry.meta;
  const size = b.box.getSize(new THREE.Vector3());
  // outline box + footprint frame
  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.BoxGeometry(size.x + 0.6, size.y + 0.6, size.z + 0.6)),
    new THREE.LineBasicMaterial({ color: '#f2c14e', depthTest: false, transparent: true, opacity: 0.9 })
  );
  edges.position.copy(b.center);
  edges.renderOrder = 10;
  highlight.add(edges);
  panel.hidden = false;
  panel.innerHTML = `
    <button class="close" id="info-close" title="Close">×</button>
    <h3>${esc(m.name)}</h3>
    <div class="row"><span class="badge">${esc(m.category)}</span> ${m.footprint[0]}×${m.footprint[1]} tiles · ${esc(b.district.name)}</div>
    <div class="row">${esc(m.description ?? '')}</div>
    <div class="row">${size.y.toFixed(0)} m tall · <code>${esc(b.entry.slug)}</code></div>
    <div class="row links"><a href="./view.html?b=${encodeURIComponent(b.entry.slug)}">Open in viewer →</a></div>`;
  $('info-close').onclick = () => select(-1);
  history.replaceState(null, '', `?b=${encodeURIComponent(b.entry.slug)}`);
  if (fly) rig.flyTo(new THREE.Vector3(b.center.x, Math.min(b.center.y, 25), b.center.z), b.radius);
}

const raycaster = new THREE.Raycaster();
let down = null;
canvas.addEventListener('pointerdown', (e) => {
  down = { x: e.clientX, y: e.clientY, button: e.button };
});
canvas.addEventListener('pointerup', (e) => {
  if (!down || down.button !== 0 || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
  const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  raycaster.setFromCamera(ndc, rig.camera);
  const hit = raycaster.intersectObjects(pickables, false)[0];
  select(hit ? buildingIdOf(hit) : -1);
});

// --- HUD ------------------------------------------------------------------------

function renderHud() {
  $('count').textContent = `${buildings.length} buildings · ${new Set(buildings.map((b) => b.entry.meta.category)).size} districts`;
  $('rot-left').onclick = () => rig.rotate(-1);
  $('rot-right').onclick = () => rig.rotate(1);
  $('reset').onclick = () => {
    select(-1);
    rig.reset();
  };
  $('toggle-labels').onchange = (e) => ($('labels').hidden = !e.target.checked);
  $('toggle-shadows').onchange = (e) => {
    scene.userData.sun.castShadow = e.target.checked;
    renderer.shadowMap.needsUpdate = true;
  };

  const search = $('search');
  const results = $('results');
  let matches = [];
  let active = 0;
  const show = () => {
    const q = search.value.trim().toLowerCase();
    if (!q) {
      results.hidden = true;
      return;
    }
    matches = buildings
      .map((b) => {
        const m = b.entry.meta;
        const name = m.name.toLowerCase();
        const score = name.startsWith(q) ? 0 : name.includes(q) ? 1 : `${b.entry.slug} ${m.category} ${b.district.name} ${m.description}`.toLowerCase().includes(q) ? 2 : -1;
        return { b, score };
      })
      .filter((x) => x.score >= 0)
      .sort((a, b) => a.score - b.score || a.b.entry.meta.name.localeCompare(b.b.entry.meta.name))
      .slice(0, 12)
      .map((x) => x.b);
    active = 0;
    results.hidden = false;
    results.innerHTML = matches.length
      ? matches.map((b, i) => `<li data-i="${i}" class="${i === active ? 'on' : ''}">${esc(b.entry.meta.name)}<span>${esc(b.entry.meta.category)}</span></li>`).join('')
      : '<li class="none">No matches</li>';
  };
  const go = (i) => {
    const b = matches[i];
    if (!b) return;
    select(b.id, { fly: true });
    results.hidden = true;
    search.blur();
  };
  search.oninput = show;
  search.onfocus = show;
  search.onkeydown = (e) => {
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      active = (active + (e.key === 'ArrowDown' ? 1 : -1) + matches.length) % Math.max(1, matches.length);
      results.querySelectorAll('li').forEach((li, i) => li.classList.toggle('on', i === active));
      e.preventDefault();
    } else if (e.key === 'Enter') go(active);
    else if (e.key === 'Escape') {
      results.hidden = true;
      search.blur();
    }
  };
  results.onpointerdown = (e) => {
    const li = e.target.closest('li[data-i]');
    if (li) go(Number(li.dataset.i));
  };
  search.onblur = () => setTimeout(() => (results.hidden = true), 150);
  addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== search) {
      search.focus();
      e.preventDefault();
    } else if (e.key === 'Escape' && document.activeElement !== search) select(-1);
  });
}

// --- frame loop ---------------------------------------------------------------------

const stats = { fps: 0, frames: 0, since: performance.now(), frameMs: 0 };
const v = new THREE.Vector3();
let last = performance.now();

function frame() {
  const now = performance.now();
  const dt = Math.min(0.1, (now - last) / 1000);
  last = now;
  rig.update(dt);
  const t = performance.now();
  renderer.render(scene, rig.camera);
  stats.frameMs = performance.now() - t;
  stats.frames++;
  if (now - stats.since >= 500) {
    stats.fps = (stats.frames * 1000) / (now - stats.since);
    stats.frames = 0;
    stats.since = now;
    const i = renderer.info.render;
    $('stats').textContent = `${stats.fps.toFixed(stats.fps < 10 ? 1 : 0)} fps · ${i.calls} draw calls · ${(i.triangles / 1e6).toFixed(2)}M tris`;
  }
  if (!$('labels').hidden) {
    for (const l of labels) {
      v.copy(l.p).project(rig.camera);
      const visible = v.z < 1 && Math.abs(v.x) < 1.1 && Math.abs(v.y) < 1.1;
      l.el.style.display = visible ? '' : 'none';
      if (visible) l.el.style.transform = `translate(-50%, -50%) translate(${((v.x + 1) / 2) * innerWidth}px, ${((1 - v.y) / 2) * innerHeight}px)`;
    }
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  rig.resize(innerWidth / innerHeight);
});

// hooks for scripts/world-shots.mjs and debugging
window.__world = {
  ready: false,
  rig,
  renderer,
  get stats() {
    return { fps: stats.fps, frameMs: stats.frameMs, ...renderer.info.render, geometries: renderer.info.memory.geometries, textures: renderer.info.memory.textures };
  },
  select: (slug, fly = true) => {
    const b = buildings.find((x) => x.entry.slug === slug);
    if (b) select(b.id, { fly });
    return !!b;
  },
  buildings: () => buildings.map((b) => ({ slug: b.entry.slug, name: b.entry.meta.name, category: b.entry.meta.category, height: b.height, center: b.center?.toArray() })),
};

renderer.setAnimationLoop(frame);
load().catch((err) => {
  console.error(err);
  $('loading-text').textContent = 'Failed: ' + err.message;
});

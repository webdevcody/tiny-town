import * as THREE from 'three';
import { BUILDINGS, buildBuilding } from './registry.js';
import { CATALOGUE } from './catalogue.js';
import { createRenderer, stageBuilding, frameOrtho } from './stage.js';

const THUMB_W = 400;
const THUMB_H = 300;

const grid = document.getElementById('grid');
const filters = document.getElementById('filters');
const count = document.getElementById('count');

const built = new Map(BUILDINGS.map((b) => [b.slug, b]));
// built buildings first (in catalogue order), then planned ones, then extras not in the catalogue
const entries = [
  ...CATALOGUE.filter((c) => built.has(c.slug)).map((c) => ({ ...built.get(c.slug), planned: false })),
  ...BUILDINGS.filter((b) => !CATALOGUE.some((c) => c.slug === b.slug)).map((b) => ({ ...b, planned: false })),
  ...CATALOGUE.filter((c) => !built.has(c.slug)).map((c) => ({
    slug: c.slug,
    planned: true,
    meta: { name: c.name, category: c.category, footprint: c.footprint, description: c.look },
  })),
];

count.textContent = `${BUILDINGS.length} built · ${CATALOGUE.length} in the catalogue`;

const categories = [...new Set(entries.map((e) => e.meta.category))].sort();
const state = { category: 'all', query: '', showPlanned: true };

function chip(label, value) {
  const b = document.createElement('button');
  b.className = 'chip' + (state.category === value ? ' on' : '');
  b.textContent = label;
  b.onclick = () => {
    state.category = value;
    renderFilters();
    applyFilters();
  };
  return b;
}

function renderFilters() {
  filters.innerHTML = '';
  filters.append(chip('All', 'all'));
  for (const c of categories) filters.append(chip(c, c));
  const label = document.createElement('label');
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.checked = state.showPlanned;
  cb.onchange = () => {
    state.showPlanned = cb.checked;
    applyFilters();
  };
  label.append(cb, 'show planned');
  filters.append(label);
  const search = document.createElement('input');
  search.type = 'search';
  search.placeholder = 'Search buildings…';
  search.value = state.query;
  search.oninput = () => {
    state.query = search.value.toLowerCase();
    applyFilters();
  };
  filters.append(search);
}

const cards = [];
for (const e of entries) {
  const el = document.createElement(e.planned ? 'div' : 'a');
  el.className = 'card' + (e.planned ? ' planned' : '');
  if (!e.planned) el.href = `./view.html?b=${encodeURIComponent(e.slug)}`;
  const [fw, fd] = e.meta.footprint;
  el.innerHTML = `
    <div class="thumb">${e.planned ? 'planned' : 'rendering…'}</div>
    <div class="info">
      <div class="name"></div>
      <div class="meta"><span class="badge"></span><span>${fw}×${fd} tiles</span><span class="slug"></span></div>
      <div class="desc"></div>
    </div>`;
  el.querySelector('.name').textContent = e.meta.name;
  el.querySelector('.badge').textContent = e.meta.category;
  el.querySelector('.slug').textContent = e.slug;
  el.querySelector('.desc').textContent = e.meta.description;
  grid.append(el);
  cards.push({ e, el });
}

function applyFilters() {
  for (const { e, el } of cards) {
    const text = `${e.slug} ${e.meta.name} ${e.meta.description}`.toLowerCase();
    const visible =
      (state.category === 'all' || e.meta.category === state.category) &&
      (!state.query || text.includes(state.query)) &&
      (state.showPlanned || !e.planned);
    el.style.display = visible ? '' : 'none';
  }
}

renderFilters();
applyFilters();

// --- thumbnails: one shared offscreen renderer, rendered one at a time -------
const renderer = createRenderer({ width: THUMB_W, height: THUMB_H, preserveDrawingBuffer: true });
const camera = new THREE.OrthographicCamera();
const queue = [];
let busy = false;

async function pump() {
  if (busy) return;
  busy = true;
  while (queue.length) {
    const { e, el } = queue.shift();
    const thumb = el.querySelector('.thumb');
    try {
      const obj = await buildBuilding(e);
      const { scene, box } = stageBuilding(renderer, obj, e.meta.footprint);
      frameOrtho(camera, box, 'iso-se', THUMB_W / THUMB_H);
      renderer.render(scene, camera);
      const img = new Image();
      img.alt = e.meta.name;
      img.src = renderer.domElement.toDataURL('image/png');
      thumb.replaceChildren(img);
    } catch (err) {
      console.error(err);
      el.classList.add('error');
      thumb.textContent = `error: ${err.message}`;
    }
    await new Promise((r) => setTimeout(r, 0));
  }
  busy = false;
}

const io = new IntersectionObserver(
  (items) => {
    for (const it of items) {
      if (!it.isIntersecting) continue;
      io.unobserve(it.target);
      const card = cards.find((c) => c.el === it.target);
      queue.push(card);
    }
    pump();
  },
  { rootMargin: '300px' }
);
for (const c of cards) if (!c.e.planned) io.observe(c.el);

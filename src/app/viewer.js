import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUILDINGS, findBuilding, buildBuilding } from './registry.js';
import { createRenderer, stageBuilding, viewDirection, VIEW_NAMES, countTriangles } from './stage.js';

const canvas = document.getElementById('view-canvas');
const hud = document.getElementById('hud');
const params = new URLSearchParams(location.search);
const slug = params.get('b') ?? BUILDINGS[0]?.slug;
const entry = slug && findBuilding(slug);

const renderer = createRenderer({ canvas, width: innerWidth, height: innerHeight });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 0.1, 5000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.02;

let scene = new THREE.Scene();
let box = new THREE.Box3(new THREE.Vector3(-5, 0, -5), new THREE.Vector3(5, 10, 5));

function goTo(view) {
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2;
  const dist = radius / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2)) * 1.05;
  const dir = viewDirection(view === 'top' ? 'iso-se' : view);
  if (view === 'top') dir.set(0, 1, 0.001).normalize();
  camera.position.copy(center).addScaledVector(dir, dist);
  controls.target.copy(center);
  controls.update();
}

function esc(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
}

function renderHud(obj) {
  const m = entry.meta;
  const size = new THREE.Box3().setFromObject(obj).getSize(new THREE.Vector3());
  hud.innerHTML = `
    <a href="./">← gallery</a> · <a href="./world.html?b=${encodeURIComponent(entry.slug)}">show in world</a>
    <h2>${esc(m.name)}</h2>
    <div class="row"><span class="badge">${esc(m.category)}</span> &nbsp;${m.footprint[0]}×${m.footprint[1]} tiles · <code>${esc(entry.slug)}</code></div>
    <div class="row">${esc(m.description)}</div>
    <div class="row">${size.x.toFixed(1)} × ${size.z.toFixed(1)} m, ${size.y.toFixed(1)} m tall · ${countTriangles(obj).toLocaleString()} triangles</div>
    <div class="views">${VIEW_NAMES.map((v) => `<button data-view="${v}">${v}</button>`).join('')}
      <button id="spin">auto-rotate</button></div>
    <select id="pick">${BUILDINGS.map((b) => `<option value="${esc(b.slug)}" ${b.slug === entry.slug ? 'selected' : ''}>${esc(b.meta.name)}</option>`).join('')}</select>`;
  hud.querySelectorAll('[data-view]').forEach((b) => (b.onclick = () => goTo(b.dataset.view)));
  hud.querySelector('#spin').onclick = () => (controls.autoRotate = !controls.autoRotate);
  hud.querySelector('#pick').onchange = (e) => (location.search = `?b=${encodeURIComponent(e.target.value)}`);
}

async function main() {
  if (!entry) {
    hud.innerHTML = `<a href="./">← gallery</a><p class="err">Unknown building "${esc(slug ?? '')}".</p>`;
    return;
  }
  document.title = `${entry.meta.name} — Tiny Town`;
  try {
    const obj = await buildBuilding(entry);
    ({ scene, box } = stageBuilding(renderer, obj, entry.meta.footprint));
    renderHud(obj);
    goTo('iso-se');
  } catch (err) {
    console.error(err);
    hud.innerHTML = `<a href="./">← gallery</a><h2>${esc(entry.meta.name)}</h2><p class="err">${esc(err.stack || err)}</p>`;
  }
}

addEventListener('resize', () => {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
});

renderer.setAnimationLoop(() => {
  controls.update();
  renderer.render(scene, camera);
});

main();

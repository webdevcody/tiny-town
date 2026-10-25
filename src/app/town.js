// Every built building laid out on one map, separated by roads.
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { BUILDINGS, buildBuilding } from './registry.js';
import { createRenderer, createScene, prepare, fitSun, createGround } from './stage.js';
import { TILE, PALETTE, surface, box, place } from '../lib/index.js';

const canvas = document.getElementById('view-canvas');
const hud = document.getElementById('hud');
const renderer = createRenderer({ canvas, width: innerWidth, height: innerHeight });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
const scene = createScene(renderer);
const camera = new THREE.PerspectiveCamera(30, innerWidth / innerHeight, 1, 20000);
const controls = new OrbitControls(camera, canvas);
controls.enableDamping = true;
controls.maxPolarAngle = Math.PI / 2 - 0.05;

async function main() {
  const loaded = [];
  for (const entry of BUILDINGS) {
    try {
      loaded.push({ entry, obj: await buildBuilding(entry) });
    } catch (err) {
      console.error(entry.slug, err);
    }
  }
  // shelf packing in tile units: blocks separated by 1-tile roads
  loaded.sort((a, b) => b.entry.meta.footprint[1] - a.entry.meta.footprint[1]);
  const totalArea = loaded.reduce((s, l) => s + (l.entry.meta.footprint[0] + 1) * (l.entry.meta.footprint[1] + 1), 0);
  const rowWidth = Math.max(8, Math.ceil(Math.sqrt(totalArea) * 1.2));
  let x = 1, z = 1, rowDepth = 0;
  const placed = [];
  for (const l of loaded) {
    const [fw, fd] = l.entry.meta.footprint;
    if (x + fw > rowWidth) {
      x = 1;
      z += rowDepth + 1;
      rowDepth = 0;
    }
    placed.push({ ...l, tx: x, tz: z });
    x += fw + 1;
    rowDepth = Math.max(rowDepth, fd);
  }
  const mapW = rowWidth + 1;
  const mapD = z + rowDepth + 1;
  const ox = (-mapW * TILE) / 2, oz = (-mapD * TILE) / 2;
  const town = new THREE.Group();
  const road = surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 });
  // road grid: full-width roads between rows and around the map
  const roadsZ = new Set([0]);
  const roadsX = new Set();
  for (const p of placed) {
    roadsZ.add(p.tz - 1);
    roadsZ.add(p.tz + p.entry.meta.footprint[1]);
    roadsX.add(p.tx - 1);
    roadsX.add(p.tx + p.entry.meta.footprint[0]);
  }
  for (const rz of roadsZ) town.add(place(box(mapW * TILE, 0.08, TILE * 0.8, road), { x: 0, z: oz + (rz + 0.5) * TILE }));
  for (const p of placed) {
    const [fw, fd] = p.entry.meta.footprint;
    for (const rx of [p.tx - 1, p.tx + fw]) {
      town.add(place(box(TILE * 0.8, 0.07, fd * TILE, road), { x: ox + (rx + 0.5) * TILE, z: oz + (p.tz + fd / 2) * TILE }));
    }
    p.obj.position.set(ox + (p.tx + fw / 2) * TILE, 0, oz + (p.tz + fd / 2) * TILE);
    town.add(p.obj);
  }
  prepare(town);
  scene.add(town);
  const bb = new THREE.Box3().setFromObject(town);
  scene.add(createGround(Math.max(mapW, mapD) + Math.ceil((bb.max.y * 6) / TILE) + 8, [mapW, mapD]));
  fitSun(scene, bb);
  scene.userData.sun.shadow.mapSize.set(4096, 4096);
  const c = bb.getCenter(new THREE.Vector3());
  c.y *= 0.5;
  const r = bb.getSize(new THREE.Vector3()).length() / 2;
  const dist = r / Math.sin(THREE.MathUtils.degToRad(camera.fov / 2));
  camera.position.copy(c).addScaledVector(new THREE.Vector3(1, 0.85, 1).normalize(), dist);
  controls.target.copy(c);
  hud.innerHTML = `<a href="./">← gallery</a><h2>Tiny Town</h2><div class="row">${placed.length} buildings · drag to orbit, scroll to zoom</div>`;
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

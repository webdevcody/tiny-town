// Page driven by scripts/shots.mjs (puppeteer). Renders one building from every
// preset view with a fixed, bounding-box based orthographic framing.
import * as THREE from 'three';
import { findBuilding, buildBuilding } from './registry.js';
import { createRenderer, stageBuilding, frameOrtho, VIEW_NAMES } from './stage.js';

window.__renderShots = async (slug, width = 800, height = 600) => {
  const entry = findBuilding(slug);
  if (!entry) throw new Error(`No building "${slug}" (is there a buildings/${slug}/building.js?)`);
  const canvas = document.getElementById('c');
  const renderer = createRenderer({ canvas, width, height, preserveDrawingBuffer: true });
  const obj = await buildBuilding(entry);
  const { scene, box } = stageBuilding(renderer, obj, entry.meta.footprint);
  const camera = new THREE.OrthographicCamera();
  const out = {};
  for (const view of VIEW_NAMES) {
    frameOrtho(camera, box, view, width / height);
    renderer.render(scene, camera);
    out[view] = canvas.toDataURL('image/png');
  }
  renderer.dispose();
  return out;
};
window.__shotsReady = true;

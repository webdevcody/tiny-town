// Shared rendering setup for the gallery, viewer and screenshot pages:
// renderer, lighting, ground tile and bounding-box based camera framing.

import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { TILE, PALETTE, canvasTexture, shade, rng } from '../lib/index.js';

export const BACKGROUND = '#bcd7e6';

/** Camera presets. az = degrees around Y from +Z (front) towards +X, el = elevation in degrees. */
export const VIEWS = {
  'iso-ne': { az: 135, el: 30 },
  'iso-nw': { az: -135, el: 30 },
  'iso-se': { az: 45, el: 30 },
  'iso-sw': { az: -45, el: 30 },
  front: { az: 0, el: 8 },
  top: { az: 0, el: 90 },
};
export const VIEW_NAMES = Object.keys(VIEWS);

export function createRenderer({ canvas, width, height, preserveDrawingBuffer = false } = {}) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer, alpha: false });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  return renderer;
}

const envCache = new WeakMap();

/** Scene with sky colour, hemisphere + sun light and a soft environment for reflections. */
export function createScene(renderer) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(BACKGROUND);
  if (!envCache.has(renderer)) {
    const pmrem = new THREE.PMREMGenerator(renderer);
    envCache.set(renderer, pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
    pmrem.dispose();
  }
  scene.environment = envCache.get(renderer);
  scene.environmentIntensity = 0.45;

  const hemi = new THREE.HemisphereLight('#e4f1ff', '#6d8a4a', 1.1);
  scene.add(hemi);

  const sun = new THREE.DirectionalLight('#fff3dc', 2.4);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.04;
  scene.add(sun);
  scene.add(sun.target);
  scene.userData.sun = sun;
  return scene;
}

/** Point the sun at a bounding box and fit its shadow camera around it. */
export function fitSun(scene, box) {
  const sun = scene.userData.sun;
  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());
  const radius = Math.max(size.length() / 2, TILE);
  const dir = new THREE.Vector3(0.45, 1.0, 0.75).normalize();
  sun.position.copy(center).addScaledVector(dir, radius * 3);
  sun.target.position.copy(center);
  const cam = sun.shadow.camera;
  cam.left = -radius * 1.3;
  cam.right = radius * 1.3;
  cam.top = radius * 1.3;
  cam.bottom = -radius * 1.3;
  cam.near = 0.1;
  cam.far = radius * 6;
  cam.updateProjectionMatrix();
}

/** Enable shadows on every mesh. */
export function prepare(obj) {
  obj.traverse((o) => {
    if (o.isMesh) {
      o.castShadow = true;
      o.receiveShadow = true;
    }
  });
  return obj;
}

let groundTex = null;
function groundTexture() {
  if (!groundTex) {
    groundTex = canvasTexture(128, 128, (ctx, W, H) => {
      ctx.fillStyle = PALETTE.grass;
      ctx.fillRect(0, 0, W, H);
      const r = rng('ground');
      for (let i = 0; i < 160; i++) {
        ctx.fillStyle = r() < 0.5 ? shade(PALETTE.grass, 0.06) : shade(PALETTE.grass, -0.06);
        ctx.fillRect(Math.floor(r() * W), Math.floor(r() * H), 3, 3);
      }
      ctx.fillStyle = shade(PALETTE.grass, -0.14);
      ctx.fillRect(0, 0, W, 1);
      ctx.fillRect(0, 0, 1, H);
    }, { key: 'app:ground' });
  }
  return groundTex;
}

/**
 * Grass ground with a faint tile grid, slightly below y=0 so building lots sit on it.
 * `tilesAcross` = size of the square in tiles (should be even for footprints with
 * even sizes and odd for odd sizes, so grid lines meet the footprint corners).
 */
export function createGround(tilesAcross, footprint = [1, 1]) {
  const g = new THREE.Group();
  const nx = tilesAcross + ((tilesAcross + footprint[0]) % 2);
  const nz = tilesAcross + ((tilesAcross + footprint[1]) % 2);
  const tex = groundTexture().clone();
  tex.repeat.set(nx, nz);
  tex.offset.set(0, 0);
  tex.needsUpdate = true;
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(nx * TILE, nz * TILE),
    new THREE.MeshStandardMaterial({ color: '#d6d6d6', map: tex, roughness: 1 })
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = -0.02;
  mesh.receiveShadow = true;
  g.add(mesh);
  // footprint outline
  const [fw, fd] = footprint;
  const outline = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(fw * TILE, fd * TILE)),
    new THREE.LineBasicMaterial({ color: shade(PALETTE.grass, -0.35) })
  );
  outline.rotation.x = -Math.PI / 2;
  outline.position.y = 0.0;
  g.add(outline);
  return g;
}

/** Box covering both the building and its footprint rectangle. */
export function framingBox(obj, footprint = [1, 1]) {
  const box = new THREE.Box3().setFromObject(obj);
  const [fw, fd] = footprint;
  box.expandByPoint(new THREE.Vector3((-fw * TILE) / 2, 0, (-fd * TILE) / 2));
  box.expandByPoint(new THREE.Vector3((fw * TILE) / 2, 0, (fd * TILE) / 2));
  return box;
}

export function viewDirection(viewName) {
  const v = VIEWS[viewName] ?? VIEWS['iso-se'];
  const az = THREE.MathUtils.degToRad(v.az);
  const el = THREE.MathUtils.degToRad(Math.min(v.el, 89.999));
  return new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
}

/**
 * Orthographic camera framing `box` from a preset view so that the box fills
 * the frame (with `margin`) at the given aspect ratio.
 */
export function frameOrtho(camera, box, viewName, aspect, margin = 0.08) {
  const center = box.getCenter(new THREE.Vector3());
  const radius = box.getSize(new THREE.Vector3()).length() / 2 || 1;
  const dir = viewDirection(viewName);
  camera.position.copy(center).addScaledVector(dir, radius * 4);
  camera.up.set(0, 1, 0);
  if (viewName === 'top') camera.up.set(0, 0, -1);
  camera.lookAt(center);
  camera.updateMatrixWorld();
  const inv = camera.matrixWorldInverse;
  const min = new THREE.Vector2(Infinity, Infinity);
  const max = new THREE.Vector2(-Infinity, -Infinity);
  for (let i = 0; i < 8; i++) {
    const p = new THREE.Vector3(i & 1 ? box.max.x : box.min.x, i & 2 ? box.max.y : box.min.y, i & 4 ? box.max.z : box.min.z);
    p.applyMatrix4(inv);
    min.min(new THREE.Vector2(p.x, p.y));
    max.max(new THREE.Vector2(p.x, p.y));
  }
  let w = max.x - min.x;
  let h = max.y - min.y;
  const cx = (max.x + min.x) / 2;
  const cy = (max.y + min.y) / 2;
  w *= 1 + margin * 2;
  h *= 1 + margin * 2;
  if (w / h > aspect) h = w / aspect;
  else w = h * aspect;
  camera.left = cx - w / 2;
  camera.right = cx + w / 2;
  camera.top = cy + h / 2;
  camera.bottom = cy - h / 2;
  camera.near = 0.1;
  camera.far = radius * 10;
  camera.updateProjectionMatrix();
  return camera;
}

/**
 * Build a ready-to-render stage around a building object:
 * scene with lights + ground + the building, sun fitted, framing box computed.
 */
export function stageBuilding(renderer, obj, footprint = [1, 1]) {
  const scene = createScene(renderer);
  prepare(obj);
  scene.add(obj);
  const box = framingBox(obj, footprint);
  const size = box.getSize(new THREE.Vector3());
  const span = Math.max(footprint[0], footprint[1]) + 6;
  // big enough that even tall towers never show the ground's edge in iso views
  const tilesAcross = Math.max(span, Math.ceil((Math.max(size.x, size.z) * 3 + size.y * 4.5) / TILE));
  scene.add(createGround(tilesAcross, footprint));
  fitSun(scene, box);
  return { scene, box };
}

/** Count triangles in an object (for stats). */
export function countTriangles(obj) {
  let tris = 0;
  obj.traverse((o) => {
    if (o.isMesh && o.geometry) {
      const g = o.geometry;
      tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    }
  });
  return Math.round(tris);
}

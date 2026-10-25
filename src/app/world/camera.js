// Isometric camera rig: an OrthographicCamera at the classic OpenTTD angle
// (2:1 dimetric = 30° elevation, 45° azimuth), quarter-turn rotation, free
// orbit, wheel zoom, right-drag / keyboard panning and animated fly-to.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export const ISO_ELEVATION = 30; // degrees above the ground (2:1 pixel iso)
export const ISO_AZIMUTH = 45; // degrees from +Z towards +X: looking at the town from the south-east

const DEG = Math.PI / 180;
const DISTANCE = 2000; // ortho: distance only matters for clipping
const PAN_KEYS = {
  KeyW: [0, -1], ArrowUp: [0, -1],
  KeyS: [0, 1], ArrowDown: [0, 1],
  KeyA: [-1, 0], ArrowLeft: [-1, 0],
  KeyD: [1, 0], ArrowRight: [1, 0],
};

const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function shortestAngle(from, to) {
  let d = (to - from) % (Math.PI * 2);
  if (d > Math.PI) d -= Math.PI * 2;
  if (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export class IsoCameraRig {
  constructor(canvas) {
    this.canvas = canvas;
    this.camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 1, DISTANCE * 3);
    this.halfHeight = 100; // world units visible above/below the target at zoom 1
    this.home = { target: new THREE.Vector3(), zoom: 1 };
    this.controls = new OrbitControls(this.camera, canvas);
    const c = this.controls;
    c.enableDamping = true;
    c.dampingFactor = 0.12;
    c.screenSpacePanning = false; // pan across the ground, not the screen plane
    c.zoomToCursor = true;
    c.minPolarAngle = 10 * DEG;
    c.maxPolarAngle = 80 * DEG;
    c.minZoom = 0.6;
    c.maxZoom = 40;
    c.zoomSpeed = 1.2;
    c.mouseButtons = { LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN };
    this.keys = new Set();
    this.anim = null;
    this.aspect = 1;
    this._onKeyDown = (e) => this._key(e, true);
    this._onKeyUp = (e) => this._key(e, false);
    addEventListener('keydown', this._onKeyDown);
    addEventListener('keyup', this._onKeyUp);
    addEventListener('blur', () => this.keys.clear());
    this.setView({ target: this.home.target, azimuth: ISO_AZIMUTH, elevation: ISO_ELEVATION, zoom: 1 });
  }

  /** Visible area: world units from the centre of the screen to the top edge at zoom 1. */
  setFrame(halfHeight, aspect) {
    this.halfHeight = halfHeight;
    this.resize(aspect);
  }

  resize(aspect) {
    this.aspect = aspect;
    const cam = this.camera;
    cam.top = this.halfHeight;
    cam.bottom = -this.halfHeight;
    cam.left = -this.halfHeight * aspect;
    cam.right = this.halfHeight * aspect;
    cam.updateProjectionMatrix();
  }

  setHome(target, zoom = 1) {
    this.home = { target: target.clone(), zoom };
  }

  get azimuth() {
    const off = this.camera.position.clone().sub(this.controls.target);
    return Math.atan2(off.x, off.z);
  }

  get elevation() {
    const off = this.camera.position.clone().sub(this.controls.target);
    return Math.asin(THREE.MathUtils.clamp(off.y / off.length(), -1, 1));
  }

  /** Jump to a view (angles in degrees). */
  setView({ target, azimuth, elevation, zoom }) {
    this.anim = null;
    this._apply(target, azimuth * DEG, elevation * DEG, zoom);
  }

  _apply(target, az, el, zoom) {
    const c = this.controls;
    c.target.copy(target);
    const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
    this.camera.position.copy(target).addScaledVector(dir, DISTANCE);
    this.camera.zoom = zoom;
    this.camera.updateProjectionMatrix();
    this.camera.lookAt(target);
  }

  /** Animate to a view. Any field left out keeps its current value. Angles in degrees. */
  animateTo({ target, azimuth, elevation, zoom, duration = 0.8 } = {}) {
    const az0 = this.azimuth;
    const el0 = this.elevation;
    this.anim = {
      t: 0,
      duration,
      from: { target: this.controls.target.clone(), az: az0, el: el0, zoom: this.camera.zoom },
      to: {
        target: target ? target.clone() : this.controls.target.clone(),
        az: azimuth === undefined ? az0 : az0 + shortestAngle(az0, azimuth * DEG),
        el: elevation === undefined ? el0 : elevation * DEG,
        zoom: THREE.MathUtils.clamp(zoom ?? this.camera.zoom, this.controls.minZoom, this.controls.maxZoom),
      },
    };
  }

  /** Quarter turn (dir = +1 clockwise seen from above, -1 anticlockwise), snapped to the iso diagonals. */
  rotate(dir) {
    const base = this.anim ? this.anim.to.az / DEG : this.azimuth / DEG;
    const snapped = Math.round((base - ISO_AZIMUTH) / 90) * 90 + ISO_AZIMUTH;
    const target = this.anim ? this.anim.to.target : this.controls.target;
    this.animateTo({ target, azimuth: snapped + dir * 90, elevation: ISO_ELEVATION, duration: 0.55 });
    // keep the end angle unwrapped so repeated presses keep turning the same way
    this.anim.to.az = this.anim.from.az + shortestAngle(this.anim.from.az, (snapped + dir * 90) * DEG);
  }

  reset() {
    this.animateTo({ target: this.home.target, azimuth: ISO_AZIMUTH, elevation: ISO_ELEVATION, zoom: this.home.zoom, duration: 0.9 });
  }

  /** Fly to a point, zooming so that `radius` world units fill a good part of the view. */
  flyTo(point, radius) {
    const zoom = this.halfHeight / Math.max(radius * 1.6, 14);
    this.animateTo({ target: point, zoom, duration: 1.0 });
  }

  _key(e, down) {
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    if (PAN_KEYS[e.code]) {
      if (down) this.keys.add(e.code);
      else this.keys.delete(e.code);
      e.preventDefault();
      return;
    }
    if (!down) return;
    if (e.code === 'KeyQ') this.rotate(-1);
    else if (e.code === 'KeyE') this.rotate(1);
    else if (e.code === 'KeyR') this.reset();
    else if (e.code === 'Equal' || e.code === 'NumpadAdd') this.animateTo({ zoom: this.camera.zoom * 1.5, duration: 0.25 });
    else if (e.code === 'Minus' || e.code === 'NumpadSubtract') this.animateTo({ zoom: this.camera.zoom / 1.5, duration: 0.25 });
  }

  /** Call once per frame with the frame time in seconds. */
  update(dt) {
    if (this.anim) {
      const a = this.anim;
      a.t = Math.min(1, a.t + dt / a.duration);
      const k = ease(a.t);
      const target = a.from.target.clone().lerp(a.to.target, k);
      const az = a.from.az + (a.to.az - a.from.az) * k;
      const el = a.from.el + (a.to.el - a.from.el) * k;
      const zoom = Math.exp(Math.log(a.from.zoom) + (Math.log(a.to.zoom) - Math.log(a.from.zoom)) * k);
      this._apply(target, az, el, zoom);
      if (a.t >= 1) this.anim = null;
    }
    if (this.keys.size) {
      let mx = 0, mz = 0;
      for (const k of this.keys) {
        mx += PAN_KEYS[k][0];
        mz += PAN_KEYS[k][1];
      }
      if (mx || mz) {
        this.anim = null;
        // screen right / screen up projected onto the ground
        const az = this.azimuth;
        const right = new THREE.Vector3(Math.cos(az), 0, -Math.sin(az));
        const fwd = new THREE.Vector3(-Math.sin(az), 0, -Math.cos(az));
        const speed = (this.halfHeight / this.camera.zoom) * 1.1 * dt;
        const move = right.multiplyScalar(mx * speed).addScaledVector(fwd, -mz * speed);
        this.controls.target.add(move);
        this.camera.position.add(move);
      }
    }
    if (!this.anim) this.controls.update(dt);
  }

  dispose() {
    removeEventListener('keydown', this._onKeyDown);
    removeEventListener('keyup', this._onKeyUp);
    this.controls.dispose();
  }
}

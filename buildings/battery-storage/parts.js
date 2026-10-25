import * as THREE from 'three';
import {
  PALETTE, canvasTexture, textured, mat, metal, emissive, box, cylinder, place, group,
} from '../../src/lib/index.js';

// Box with 0..1 UVs on every face (lib box() uses metre UVs, which shrinks
// clamped textures into a corner). Base at y = 0. mats: +x, -x, top, bottom, +z, -z.
export function uvBox(w, h, d, mats) {
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), mats);
}

// ---------------------------------------------------------------------------
// textures

function louvre(ctx, x, y, w, h, n, bg = '#b9bcbf', line = '#6f7479') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = line;
  for (let i = 0; i < n; i++) ctx.fillRect(x + 1, y + 1 + (i * (h - 2)) / n, w - 2, Math.max(1, (h / n) * 0.45));
  ctx.strokeStyle = line;
  ctx.lineWidth = 1;
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
}

function hazard(ctx, cx, cy, s) {
  ctx.fillStyle = '#e9c31f';
  ctx.beginPath();
  ctx.moveTo(cx, cy - s * 0.55);
  ctx.lineTo(cx + s * 0.55, cy + s * 0.45);
  ctx.lineTo(cx - s * 0.55, cy + s * 0.45);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#232326';
  ctx.lineWidth = Math.max(1, s * 0.08);
  ctx.stroke();
  // lightning bolt
  ctx.fillStyle = '#232326';
  ctx.beginPath();
  ctx.moveTo(cx + s * 0.06, cy - s * 0.3);
  ctx.lineTo(cx - s * 0.14, cy + s * 0.08);
  ctx.lineTo(cx + s * 0.02, cy + s * 0.08);
  ctx.lineTo(cx - s * 0.06, cy + s * 0.38);
  ctx.lineTo(cx + s * 0.14, cy - s * 0.04);
  ctx.lineTo(cx - s * 0.02, cy - s * 0.04);
  ctx.closePath();
  ctx.fill();
}

// Long side of a battery enclosure: a row of cabinet doors with vents.
export function batterySideMat(doors = 4) {
  const tex = canvasTexture(384, 288, (ctx, W, H) => {
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, W, H);
    // top trim + brand stripe
    ctx.fillStyle = '#d9d7d0';
    ctx.fillRect(0, 0, W, 14);
    ctx.fillStyle = '#2f8f6a';
    ctx.fillRect(0, 16, W, 7);
    const dw = W / doors;
    for (let i = 0; i < doors; i++) {
      const x = i * dw;
      ctx.strokeStyle = '#9fa2a5';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 5, 30, dw - 10, H - 46);
      ctx.strokeStyle = '#e2e0da';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 11, 36, dw - 22, H - 58);
      louvre(ctx, x + 18, 50, dw - 36, 40, 7, '#d6d7d6', '#8d9196');
      louvre(ctx, x + 18, H - 82, dw - 36, 46, 8, '#d6d7d6', '#8d9196');
      // handle
      ctx.fillStyle = '#4a4d52';
      ctx.fillRect(x + dw - 24, H * 0.45, 6, 34);
      // status label
      ctx.fillStyle = '#c9cacc';
      ctx.fillRect(x + 20, H * 0.45, 30, 18);
    }
    hazard(ctx, dw * 0.5, H * 0.56, 34);
    // plinth shadow
    ctx.fillStyle = '#8f9093';
    ctx.fillRect(0, H - 10, W, 10);
  }, { key: `battery-storage:side${doors}`, repeat: false });
  return textured(tex, { roughness: 0.6 });
}

export function batteryEndMat() {
  const tex = canvasTexture(128, 192, (ctx, W, H) => {
    ctx.fillStyle = '#ebe9e2';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#d9d7d0';
    ctx.fillRect(0, 0, W, 10);
    ctx.fillStyle = '#2f8f6a';
    ctx.fillRect(0, 11, W, 5);
    louvre(ctx, 14, 30, W - 28, 60, 10, '#d0d1d0', '#80858a');
    ctx.fillStyle = '#c8322b';
    ctx.fillRect(W / 2 - 14, 104, 28, 20); // fire panel
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(W / 2 - 9, 110, 18, 3);
    louvre(ctx, 14, H - 54, W - 28, 40, 6, '#d0d1d0', '#80858a');
    ctx.fillStyle = '#8f9093';
    ctx.fillRect(0, H - 7, W, 7);
  }, { key: 'battery-storage:end', repeat: false });
  return textured(tex, { roughness: 0.6 });
}

export function fanTopMat() {
  const tex = canvasTexture(64, 64, (ctx, W, H) => {
    ctx.fillStyle = '#b7babd';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#34373b';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.42, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#9ea3a8';
    ctx.lineWidth = 2;
    for (const r of [0.18, 0.3, 0.4]) {
      ctx.beginPath();
      ctx.arc(W / 2, H / 2, W * r, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (let i = 0; i < 4; i++) {
      const a = (i * Math.PI) / 4;
      ctx.beginPath();
      ctx.moveTo(W / 2 - Math.cos(a) * W * 0.42, H / 2 - Math.sin(a) * W * 0.42);
      ctx.lineTo(W / 2 + Math.cos(a) * W * 0.42, H / 2 + Math.sin(a) * W * 0.42);
      ctx.stroke();
    }
    ctx.fillStyle = '#6f7479';
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, W * 0.08, 0, Math.PI * 2);
    ctx.fill();
  }, { key: 'battery-storage:fan', repeat: false });
  return textured(tex, { roughness: 0.5 });
}

export function inverterFaceMat() {
  const tex = canvasTexture(192, 256, (ctx, W, H) => {
    ctx.fillStyle = '#9fb3bf';
    ctx.fillRect(0, 0, W, H);
    for (const x of [0, W / 2]) {
      ctx.strokeStyle = '#5f7380';
      ctx.lineWidth = 3;
      ctx.strokeRect(x + 5, 8, W / 2 - 10, H - 20);
      louvre(ctx, x + 14, 22, W / 2 - 28, 70, 10, '#8aa0ad', '#4e5f6a');
      louvre(ctx, x + 14, H - 82, W / 2 - 28, 60, 8, '#8aa0ad', '#4e5f6a');
      ctx.fillStyle = '#2d3238';
      ctx.fillRect(x + W / 2 - 18, H * 0.47, 5, 26);
    }
    hazard(ctx, W * 0.25, H * 0.5, 30);
    // display
    ctx.fillStyle = '#1d2a33';
    ctx.fillRect(W * 0.6, H * 0.43, 34, 22);
    ctx.fillStyle = '#5fe08a';
    ctx.fillRect(W * 0.6 + 4, H * 0.43 + 5, 20, 4);
    ctx.fillRect(W * 0.6 + 4, H * 0.43 + 12, 12, 4);
  }, { key: 'battery-storage:inverter', repeat: false });
  return textured(tex, { roughness: 0.55 });
}

// Big entrance sign: battery icon + text.
export function storageSignMat() {
  const tex = canvasTexture(512, 136, (ctx, W, H) => {
    ctx.fillStyle = '#1f6b46';
    ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 6;
    ctx.strokeRect(5, 5, W - 10, H - 10);
    // battery icon
    const bx = 24, by = 30, bw = 92, bh = 76;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(bx, by, bw, bh);
    ctx.fillRect(bx + bw, by + bh * 0.3, 10, bh * 0.4);
    ctx.fillStyle = '#1f6b46';
    ctx.fillRect(bx + 7, by + 7, bw - 14, bh - 14);
    ctx.fillStyle = '#9be36a';
    for (let i = 0; i < 3; i++) ctx.fillRect(bx + 12 + i * 25, by + 12, 19, bh - 24);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.font = 'bold 44px sans-serif';
    ctx.fillText('BATTERY', 142, H * 0.34);
    ctx.font = 'bold 38px sans-serif';
    ctx.fillText('STORAGE', 142, H * 0.72);
    ctx.fillStyle = '#e9c31f';
    ctx.font = 'bold 30px sans-serif';
    ctx.fillText('48 MWh', 352, H * 0.72);
  }, { key: 'battery-storage:sign', repeat: false });
  return textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
}

export function dangerSignMat() {
  const tex = canvasTexture(128, 96, (ctx, W, H) => {
    ctx.fillStyle = '#f4f2ec';
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#c8322b';
    ctx.fillRect(0, 0, W, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('DANGER', W / 2, 16);
    hazard(ctx, W / 2, 64, 52);
  }, { key: 'battery-storage:danger', repeat: false });
  return textured(tex);
}

function chainLinkTex() {
  return canvasTexture(32, 32, (ctx, W, H) => {
    ctx.clearRect(0, 0, W, H);
    ctx.strokeStyle = 'rgba(205,212,216,0.95)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, H / 2); ctx.lineTo(W / 2, 0); ctx.lineTo(W, H / 2); ctx.lineTo(W / 2, H); ctx.closePath();
    ctx.stroke();
  }, { key: 'battery-storage:chainlink', repeat: true });
}

// ---------------------------------------------------------------------------
// parts

/** White battery enclosure (Megapack-ish), length along X, doors on both long sides. */
export function batteryUnit({ len = 3.0, h = 2.3, d = 1.6, light = PALETTE.green } = {}) {
  const side = batterySideMat(4);
  const end = batteryEndMat();
  const top = mat('#dcdad3');
  const g = group();
  g.add(place(box(len + 0.2, 0.15, d + 0.2, mat(PALETTE.concrete)), {}));
  g.add(place(uvBox(len, h, d, [end, end, top, top, side, side]), { y: 0.15 }));
  // roof cap + thermal (fan) units on top
  g.add(place(box(len + 0.08, 0.08, d + 0.08, mat('#e7e5de')), { y: 0.15 + h }));
  const fan = fanTopMat();
  const housing = mat('#c9cacc');
  for (const x of [-len / 4, len / 4]) {
    g.add(place(uvBox(0.95, 0.2, 0.95, [housing, housing, fan, housing, housing, housing]), { x, y: 0.23 + h }));
  }
  // status lights on both sides
  for (const z of [d / 2 + 0.02, -d / 2 - 0.02]) {
    g.add(place(box(0.12, 0.12, 0.04, emissive(light, 1.4)), { x: len / 2 - 0.25, y: 0.15 + h - 0.35, z }));
  }
  return g;
}

/** Power-conversion (inverter) cabinet: louvred doors face ±Z, little rain hood. */
export function inverterCabinet({ w = 0.95, h = 2.0, d = 1.5 } = {}) {
  const face = inverterFaceMat();
  const body = mat('#8fa4b1');
  const g = group();
  g.add(place(box(w + 0.2, 0.15, d + 0.2, mat(PALETTE.concrete)), {}));
  g.add(place(uvBox(w, h, d, [body, body, body, body, face, face]), { y: 0.15 }));
  g.add(place(box(w + 0.2, 0.08, d + 0.3, mat('#6f8593')), { y: 0.15 + h }));
  g.add(place(box(w * 0.5, 0.25, d * 0.5, metal(PALETTE.steel)), { y: 0.23 + h }));
  return g;
}

/** Pad-mounted step-up transformer: tank, radiator fins, bushings, conservator. */
export function transformer() {
  const tankM = mat('#6f8a7c', { roughness: 0.6 });
  const finM = mat('#5f7a6c', { roughness: 0.6 });
  const g = group();
  g.add(place(box(2.9, 0.2, 2.0, mat(PALETTE.concreteDark)), {}));
  const y = 0.2;
  g.add(place(box(1.5, 1.6, 1.1, tankM), { y }));
  g.add(place(box(1.6, 0.1, 1.2, finM), { y: y + 1.6 }));
  // radiator banks on ±x
  for (const sx of [-1, 1]) {
    for (let i = 0; i < 5; i++) {
      g.add(place(box(0.42, 1.25, 0.05, finM), { x: sx * 0.96, y: y + 0.15, z: -0.4 + i * 0.2 }));
    }
    g.add(place(box(0.42, 0.08, 0.9, finM), { x: sx * 0.96, y: y + 1.32 }));
  }
  // conservator tank on the back
  const cons = cylinder(0.22, 0.22, 1.2, tankM, 12);
  cons.rotation.z = Math.PI / 2;
  cons.position.set(0.6, y + 2.15, -0.35);
  g.add(cons);
  g.add(place(box(0.08, 0.35, 0.08, finM), { x: -0.35, y: y + 1.7, z: -0.35 }));
  g.add(place(box(0.08, 0.35, 0.08, finM), { x: 0.35, y: y + 1.7, z: -0.35 }));
  // HV bushings (brown porcelain) + LV bushings
  const porcelain = mat('#7a4a2e', { roughness: 0.4 });
  for (const x of [-0.45, 0, 0.45]) {
    g.add(place(cylinder(0.08, 0.11, 0.75, porcelain, 8), { x, y: y + 1.7, z: 0.15 }));
    for (let k = 0; k < 3; k++) g.add(place(cylinder(0.15, 0.15, 0.05, porcelain, 8), { x, y: y + 1.8 + k * 0.2, z: 0.15 }));
    g.add(place(cylinder(0.04, 0.04, 0.18, metal(PALETTE.steelLight), 6), { x, y: y + 2.45, z: 0.15 }));
  }
  // danger plate on the front
  g.add(place(uvBox(0.5, 0.38, 0.03, [mat(PALETTE.white), mat(PALETTE.white), mat(PALETTE.white), mat(PALETTE.white), dangerSignMat(), mat(PALETTE.white)]), { y: y + 0.7, z: 0.56 }));
  return g;
}

/**
 * Chain-link security fence along X, length len, with posts and a barbed-wire
 * top that leans towards +Z (outwards when the fence faces +Z). Centred on x = 0.
 */
export function securityFence({ len, h = 2.0, post = PALETTE.steelDark } = {}) {
  const g = group();
  const pm = metal(post);
  const n = Math.max(1, Math.round(len / 2.4));
  for (let i = 0; i <= n; i++) {
    const x = -len / 2 + (len * i) / n;
    g.add(place(box(0.09, h, 0.09, pm), { x }));
    const arm = box(0.05, 0.45, 0.05, pm);
    arm.position.set(x, h, 0);
    arm.rotation.x = 0.6;
    g.add(arm);
  }
  g.add(place(box(len, 0.06, 0.06, pm), { y: h - 0.06 }));
  g.add(place(box(len, 0.04, 0.04, pm), { y: 0.1 }));
  // barbed wires on the arms
  const wire = mat('#6f7479');
  for (const k of [0.2, 0.36]) {
    g.add(place(box(len, 0.025, 0.025, wire), { y: h + Math.cos(0.6) * k, z: Math.sin(0.6) * k }));
  }
  // mesh
  const geo = new THREE.PlaneGeometry(len, h - 0.1).translate(0, (h - 0.1) / 2 + 0.05, 0);
  const uv = geo.attributes.uv;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * len * 4, uv.getY(i) * (h - 0.1) * 4);
  g.add(new THREE.Mesh(geo, textured(chainLinkTex(), { transparent: true, alphaTest: 0.3, side: THREE.DoubleSide, roughness: 0.5, metalness: 0.3 })));
  return g;
}

/** Floodlight pole with a CCTV camera. Lamp head points to +X. */
export function lightPole({ h = 5 } = {}) {
  const pm = metal(PALETTE.darkGrey);
  return group(
    cylinder(0.06, 0.09, h, pm, 6),
    place(box(0.6, 0.07, 0.07, pm), { x: 0.28, y: h - 0.05 }),
    place(box(0.35, 0.22, 0.4, mat(PALETTE.darkGrey)), { x: 0.55, y: h - 0.2 }),
    place(box(0.3, 0.04, 0.34, emissive(PALETTE.windowLit, 0.9)), { x: 0.55, y: h - 0.23 }),
    place(box(0.32, 0.16, 0.16, mat(PALETTE.white)), { x: -0.16, y: h - 0.7 }),
    place(box(0.06, 0.1, 0.1, mat(PALETTE.black)), { x: -0.35, y: h - 0.67 })
  );
}

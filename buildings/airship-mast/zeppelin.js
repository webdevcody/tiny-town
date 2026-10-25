import * as THREE from 'three';
import { PALETTE, box, beam, place, mat, metal, canvasTexture, textured, shade } from '../../src/lib/index.js';

// Hull radius along the axis, t = 0 at the nose, 1 at the tail.
export function hullRadius(t, R) {
  if (t <= 0) return 0;
  if (t < 0.28) return R * Math.sqrt(1 - ((0.28 - t) / 0.28) ** 2);
  if (t < 0.5) return R;
  const k = (t - 0.5) / 0.5;
  return R * Math.max(0.04, Math.cos((k * Math.PI) / 2) ** 0.85);
}

// Silver skin: girder panel lines, the name on both flanks and a row of
// passenger windows low down at the front. u runs round the hull (0 = keel,
// 0.25 = -z flank, 0.5 = top, 0.75 = +z flank), v runs nose (0) -> tail (1).
function skinTexture(name) {
  return canvasTexture(1024, 1024, (ctx, W, H) => {
    ctx.fillStyle = '#d9dde2';
    ctx.fillRect(0, 0, W, H);
    // a little shading towards the keel so the hull reads round
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, 'rgba(90,100,115,0.35)');
    grad.addColorStop(0.25, 'rgba(255,255,255,0)');
    grad.addColorStop(0.5, 'rgba(255,255,255,0.25)');
    grad.addColorStop(0.75, 'rgba(255,255,255,0)');
    grad.addColorStop(1, 'rgba(90,100,115,0.35)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#9aa3ad';
    for (let i = 0; i < 28; i++) ctx.fillRect(Math.round((i * W) / 28), 0, 3, H);
    for (let j = 1; j < 18; j++) ctx.fillRect(0, Math.round((j * H) / 18), W, 4);
    // red cheat line along both flanks
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(W * 0.25 + 70, 0, 16, H);
    ctx.fillRect(W * 0.75 - 86, 0, 16, H);
    // passenger deck windows, lower front quarter
    for (const [u, dir] of [[0.25, -1], [0.75, 1]]) {
      const x = W * u + dir * 105;
      for (let k = 0; k < 9; k++) {
        const y = H * (1 - 0.22) - k * 34;
        ctx.fillStyle = '#2b3a4d';
        ctx.fillRect(x - 12, y - 22, 24, 22);
        ctx.fillStyle = '#ffe9a8';
        ctx.fillRect(x - 9, y - 19, 18, 8);
      }
    }
    // the name, upright on both flanks
    ctx.fillStyle = '#1e2b4a';
    ctx.font = 'bold 96px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (const [u, rot] of [[0.25, Math.PI / 2], [0.75, -Math.PI / 2]]) {
      ctx.save();
      ctx.translate(W * u, H * 0.47);
      ctx.rotate(rot);
      ctx.fillText(name, 0, 0, H * 0.5);
      ctx.restore();
    }
  }, { key: 'airship-mast:skin:' + name, repeat: false });
}

function fin(points, thickness, material) {
  const shape = new THREE.Shape(points.map(([x, y]) => new THREE.Vector2(x, y)));
  const geo = new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false });
  geo.translate(0, 0, -thickness / 2);
  return new THREE.Mesh(geo, material);
}

/**
 * Rigid airship lying along +x: nose tip at the origin, tail at x = length,
 * hull axis at y = 0.
 */
export function zeppelin({ length = 10.4, radius = 1.5, name = 'TINY TOWN' } = {}) {
  const g = new THREE.Group();
  const L = length, R = radius;

  // hull: lathe around y, then laid along +x
  const pts = [];
  const n = 40;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push(new THREE.Vector2(i === n ? 0 : hullRadius(t, R), t * L));
  }
  const geo = new THREE.LatheGeometry(pts, 28, Math.PI / 2);
  geo.rotateZ(-Math.PI / 2);
  const skin = textured(skinTexture(name), { roughness: 0.45, metalness: 0.35, flatShading: false });
  g.add(new THREE.Mesh(geo, skin));

  // nose cap and mooring spindle
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 8), metal(PALETTE.steelDark));
  cap.position.set(0.22, 0, 0);
  cap.scale.set(0.8, 1, 1);
  g.add(cap);

  // tail fins (cruciform): red with a white rudder strip
  const finM = mat(PALETTE.red, { roughness: 0.6 });
  const rudM = mat(PALETTE.white, { roughness: 0.6 });
  const span = 1.45;
  const finPts = [[L - 3.0, 0.2], [L - 0.15, 0.2], [L - 0.15, span], [L - 1.25, span]];
  const rudPts = [[L - 0.75, 0.2], [L - 0.05, 0.2], [L - 0.05, span - 0.05], [L - 0.75, span - 0.05]];
  for (let k = 0; k < 4; k++) {
    const f = new THREE.Group();
    f.add(fin(finPts, 0.1, finM));
    f.add(fin(rudPts, 0.14, rudM));
    f.rotation.x = (k * Math.PI) / 2;
    g.add(f);
  }

  // control car under the bow
  const gx = L * 0.2;
  const gy = -hullRadius(0.2, R);
  const carM = mat(PALETTE.cream);
  const winM = mat(PALETTE.glassDark, { roughness: 0.25, metalness: 0.4 });
  g.add(place(box(1.5, 0.35, 0.62, carM), { x: gx, y: gy - 0.2 }));
  g.add(place(box(1.45, 0.3, 0.66, winM), { x: gx, y: gy - 0.5 }));
  g.add(place(box(1.5, 0.12, 0.62, mat(shade(PALETTE.cream, -0.2))), { x: gx, y: gy - 0.62 }));
  const bowGlass = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.31, 0.42, 10, 1, false, 0, Math.PI), winM);
  bowGlass.position.set(gx - 0.72, gy - 0.6, 0);
  bowGlass.rotation.y = Math.PI / 2;
  bowGlass.scale.set(1, 1, 0.8);
  bowGlass.translateY(0.21);
  g.add(bowGlass);
  g.add(place(box(0.1, 0.25, 0.1, metal(PALETTE.steelDark)), { x: gx + 0.4, y: gy - 0.95 }));
  g.add(place(new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), mat(PALETTE.black)), { x: gx + 0.4, y: gy - 1.02 }));

  // engine cars on outriggers, with propellers at the back
  const nacM = mat(PALETTE.lightGrey, { roughness: 0.5, metalness: 0.3 });
  const strutM = metal(PALETTE.steelDark);
  const propM = mat(PALETTE.darkGrey);
  for (const [t, side] of [[0.5, 1], [0.5, -1], [0.66, 1], [0.66, -1]]) {
    const x = L * t;
    const r = hullRadius(t, R);
    const ang = -Math.PI / 4.2;
    const out = r + 0.55;
    const py = Math.sin(ang) * out;
    const pz = Math.cos(ang) * out * side;
    const nac = new THREE.Mesh(new THREE.SphereGeometry(0.26, 10, 8), nacM);
    nac.scale.set(2.4, 1, 1);
    nac.position.set(x, py, pz);
    g.add(nac);
    const hy = Math.sin(ang) * (r - 0.1);
    const hz = Math.cos(ang) * (r - 0.1) * side;
    g.add(beam([x - 0.25, hy, hz], [x - 0.15, py, pz], 0.07, strutM));
    g.add(beam([x + 0.25, hy, hz], [x + 0.15, py, pz], 0.07, strutM));
    for (const a of [0, Math.PI / 2]) {
      const blade = box(0.04, 0.7, 0.09, propM);
      blade.geometry = blade.geometry.clone().translate(0, -0.35, 0);
      blade.position.set(x + 0.64, py, pz);
      blade.rotation.x = a + Math.PI / 4;
      g.add(blade);
    }
  }
  return g;
}

import * as THREE from 'three';
import { PALETTE, box, mat, metal, emissive, textured, signTexture } from '../../src/lib/index.js';

/**
 * One stainless-steel hood shell: a pointed-arch cross-section (in XY) swept
 * along Z, pinched to a point at both ends so it reads like a helmet / sail.
 * Base at y = 0, centred on the origin.
 */
export function shell({ L = 6, hw = 0.8, hh = 3, rings = 14, arch = 7, material }) {
  const pos = [];
  const ringPts = [];
  for (let i = 0; i <= rings; i++) {
    const zn = -1 + (2 * i) / rings;
    // superellipse taper: blunt middle, rounded ends that sweep down to the deck
    const s = Math.pow(Math.max(0, 1 - Math.pow(Math.abs(zn), 2.4)), 1 / 2.4);
    const z = (zn * L) / 2;
    const pts = [];
    for (let j = 0; j <= arch * 2; j++) {
      const t = j <= arch ? j / arch : (2 * arch - j) / arch; // 0 base -> 1 apex -> 0 base
      const side = j <= arch ? 1 : -1;
      const x = side * hw * s * (1 - Math.pow(t, 1.7));
      const y = hh * (0.25 + 0.75 * s) * t;
      pts.push([x, y, z]);
    }
    ringPts.push(pts);
  }
  for (let i = 0; i < rings; i++) {
    const a = ringPts[i], b = ringPts[i + 1];
    for (let j = 0; j < a.length - 1; j++) {
      // CCW seen from outside (away from the hood's axis)
      pos.push(...a[j], ...b[j + 1], ...b[j]);
      pos.push(...a[j], ...a[j + 1], ...b[j + 1]);
    }
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, material);
  return m;
}

/** Plain sign with 0..1 UVs so the text fills the face (lib sign() shrinks over 1 m). */
export function bigSign({ text, w, h, d = 0.12, bg = PALETTE.navy, fg = '#ffffff', key }) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [side, side, side, side, face, side]);
}

/**
 * Rotating sector gate spanning `span` along X, pivoting about the X axis at
 * the origin. angle 0 = closed (curved skin stands vertical, facing -Z /
 * upstream); 90 = swung right up out of the water for maintenance.
 */
export function sectorGate({ span, R = 2.1, sweep = 90, angle = 0, skinColor = PALETTE.steelLight, armColor = PALETTE.yellow }) {
  const g = new THREE.Group();
  const skinM = mat(skinColor, { metalness: 0.35, roughness: 0.45, side: THREE.DoubleSide });
  const ribM = metal(PALETTE.steelDark);
  const armM = mat(armColor, { roughness: 0.6 });
  const t0 = THREE.MathUtils.degToRad(180 - sweep / 2), tl = THREE.MathUtils.degToRad(sweep);

  // curved skin: cylinder segment whose axis runs along X
  const skin = new THREE.CylinderGeometry(R, R, span, 14, 1, true, t0, tl).rotateZ(-Math.PI / 2);
  g.add(new THREE.Mesh(skin, skinM));
  // inner skin (gates are hollow D-sections) and horizontal stiffeners
  const inner = new THREE.CylinderGeometry(R - 0.35, R - 0.35, span, 10, 1, true, t0, tl).rotateZ(-Math.PI / 2);
  g.add(new THREE.Mesh(inner, mat(PALETTE.steel, { side: THREE.DoubleSide })));
  const ribs = 5;
  for (let i = 0; i < ribs; i++) {
    const th = t0 + (tl * (i + 0.5)) / ribs;
    const rib = box(span, 0.07, 0.06, ribM);
    // point on skin: y = R sin(th) , z = R cos(th) (theta from +Z towards +Y after rotation)
    // after rotateZ(-90deg) a skin point at theta is (x, -R sin(theta), R cos(theta))
    rib.position.set(0, -(R + 0.03) * Math.sin(th), (R + 0.03) * Math.cos(th));
    rib.rotation.x = th;
    g.add(rib);
  }
  // end plates: closed D-shaped sides with radial arms back to the pivot discs
  for (const sx of [-1, 1]) {
    const x = sx * (span / 2 - 0.1);
    const plate = new THREE.CylinderGeometry(R, R, 0.15, 14, 1, false, t0, tl).rotateZ(-Math.PI / 2).translate(x, 0, 0);
    g.add(new THREE.Mesh(plate, armM));
    // pivot disc (the big yellow wheel in the pier face)
    const disc = new THREE.CylinderGeometry(1.15, 1.15, 0.3, 20).rotateZ(Math.PI / 2).translate(sx * (span / 2 + 0.05), 0, 0);
    g.add(new THREE.Mesh(disc, armM));
    const hub = new THREE.CylinderGeometry(0.35, 0.35, 0.42, 10).rotateZ(Math.PI / 2).translate(sx * (span / 2 + 0.05), 0, 0);
    g.add(new THREE.Mesh(hub, ribM));
  }
  // red "gate closed" lamps along the top lip
  const lip = t0 + tl;
  for (const sx of [-0.3, 0.3]) {
    const l = box(0.2, 0.2, 0.2, emissive('#ff3020', 1.2));
    l.position.set(sx * span, -R * Math.sin(lip), R * Math.cos(lip));
    g.add(l);
  }
  g.rotation.x = THREE.MathUtils.degToRad(angle);
  // wrapper so place() (which resets rotation) keeps the gate angle
  const outer = new THREE.Group();
  outer.add(g);
  return outer;
}

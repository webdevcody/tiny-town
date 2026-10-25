import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, cylinder, cone, place, group, lattice, beam, pipe, mat, metal, emissive, glass, textured,
  signTexture, facadeBlock, dome, facadeCylinder, parapet, awning, door, fence, tree, streetLamp, bench, flag, surface,
} from '../../src/lib/index.js';
import { zeppelin } from './zeppelin.js';

// 1x1 tile (10 x 10 m). Front (street) faces +z.
// The mast stands in the back-left corner; the airship is moored nose-first to
// its head and lies along the diagonal, tail over the front-right corner where
// it rides on a weight car on a curved rail.

const DEG = Math.PI / 180;
const DIR = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2); // mast -> tail

// Sign with 0..1 UVs so the text fills the whole face (lib sign() uses metre UVs).
function panelSign({ text, w, h, d = 0.15, bg, fg, border }) {
  const tex = signTexture(text, { bg, fg, border, width: 512, height: Math.max(32, Math.round((512 * h) / w)) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

// Cylinder whose axis points from `from` towards `to` (open cone when radii differ).
function orientedCylinder(from, to, rFrom, rTo, material, segments = 12) {
  const a = new THREE.Vector3(...from);
  const b = new THREE.Vector3(...to);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(rTo, rFrom, a.distanceTo(b), segments), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'grass'));

  const steel = metal(PALETTE.steel);
  const steelDark = metal(PALETTE.steelDark);
  const concrete = mat(PALETTE.concrete);

  // ---- mooring mast ------------------------------------------------------
  const MX = -3.8, MZ = -3.8;
  const plinthH = 0.4;
  const mastH = 11.8;
  const deckY = y0 + plinthH + mastH;
  const axisY = deckY + 0.85; // airship centreline
  g.add(place(patch(4.2, 4.2, 'concrete'), { x: MX + 0.75, y: y0, z: MZ + 0.75 }));
  g.add(place(box(2.9, plinthH, 2.9, mat(PALETTE.concreteDark)), { x: MX, y: y0, z: MZ }));
  g.add(place(lattice({ w: 2.5, h: mastH, topW: 1.0, segments: 7, thickness: 0.16, material: steel }), { x: MX, y: y0 + plinthH, z: MZ }));
  // lift shaft up the middle, with a little entrance hut at its foot
  g.add(place(box(0.55, mastH, 0.55, mat(PALETTE.steelLight, { roughness: 0.5 })), { x: MX, y: y0 + plinthH, z: MZ }));
  for (let i = 1; i < 6; i++) g.add(place(box(0.58, 0.18, 0.58, emissive(PALETTE.windowLit, 0.5)), { x: MX, y: y0 + plinthH + i * 1.9, z: MZ }));
  g.add(place(box(1.3, 2.3, 1.1, mat(PALETTE.red)), { x: MX, y: y0 + plinthH, z: MZ + 0.55 }));
  g.add(place(box(1.5, 0.15, 1.3, steelDark), { x: MX, y: y0 + plinthH + 2.3, z: MZ + 0.55 }));
  g.add(place(door({ w: 0.8, h: 1.9, color: PALETTE.cream }), { x: MX, y: y0 + plinthH, z: MZ + 1.1 }));

  // head: round deck with railing, mooring drum, arm and cup
  g.add(place(cylinder(1.25, 0.7, 0.35, steelDark, 16), { x: MX, y: deckY - 0.35, z: MZ }));
  g.add(place(cylinder(1.25, 1.25, 0.08, mat(PALETTE.darkGrey), 16), { x: MX, y: deckY, z: MZ }));
  const railM = mat(PALETTE.white);
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    g.add(place(box(0.06, 0.9, 0.06, railM), { x: MX + Math.cos(a) * 1.18, y: deckY, z: MZ + Math.sin(a) * 1.18 }));
  }
  const rail = new THREE.Mesh(new THREE.TorusGeometry(1.18, 0.04, 4, 24), railM);
  rail.rotation.x = Math.PI / 2;
  rail.position.set(MX, deckY + 0.9, MZ);
  g.add(rail);
  g.add(place(cylinder(0.45, 0.5, 1.3, mat(PALETTE.red), 12), { x: MX, y: deckY, z: MZ }));
  g.add(place(cylinder(0.55, 0.55, 0.12, steelDark, 12), { x: MX, y: deckY + 1.3, z: MZ }));
  g.add(place(cylinder(0.04, 0.04, 0.9, steelDark, 4), { x: MX, y: deckY + 1.42, z: MZ }));
  g.add(place(cone(0.14, 0.14, emissive('#ff3b30', 1.2), 8), { x: MX, y: deckY + 2.3, z: MZ }));
  const noseDist = 0.95;
  const at = (dist, y) => [MX + DIR.x * dist, y, MZ + DIR.z * dist];
  g.add(orientedCylinder(at(0.3, axisY), at(0.62, axisY), 0.12, 0.12, steelDark, 8));
  g.add(orientedCylinder(at(0.55, axisY), at(0.8, axisY), 0.14, 0.42, mat(PALETTE.yellow, { side: THREE.DoubleSide }), 12));

  // ---- the airship -------------------------------------------------------
  const L = 10.3;
  const R = 1.5;
  const ship = zeppelin({ length: L, radius: R, name: 'TINY TOWN' });
  g.add(place(ship, { x: MX + DIR.x * noseDist, y: axisY, z: MZ + DIR.z * noseDist, ry: -45 }));

  // tail weight car on a curved rail centred on the mast
  const tailDist = noseDist + L - 0.75;
  const railR = tailDist;
  const ballast = mat(PALETTE.gravel ?? PALETTE.stone);
  const railMetal = metal(PALETTE.steelDark);
  const sleeperM = mat(PALETTE.woodDark);
  const a0 = 37, a1 = 53, steps = 6;
  for (let i = 0; i < steps; i++) {
    const am = (a0 + ((i + 0.5) * (a1 - a0)) / steps) * DEG;
    const seg = (railR * (a1 - a0) * DEG) / steps;
    g.add(place(box(1.7, 0.08, seg + 0.05, ballast), { x: MX + Math.cos(am) * railR, y: y0, z: MZ + Math.sin(am) * railR, ry: -am / DEG }));
  }
  for (let i = 0; i <= 9; i++) {
    const a = (a0 + (i * (a1 - a0)) / 9) * DEG;
    g.add(place(box(1.4, 0.06, 0.2, sleeperM), { x: MX + Math.cos(a) * railR, y: y0 + 0.08, z: MZ + Math.sin(a) * railR, ry: -a / DEG }));
  }
  for (const off of [-0.45, 0.45]) {
    const r = railR + off;
    for (let i = 0; i < steps; i++) {
      const aa = (a0 + (i * (a1 - a0)) / steps) * DEG;
      const ab = (a0 + ((i + 1) * (a1 - a0)) / steps) * DEG;
      g.add(beam([MX + Math.cos(aa) * r, y0 + 0.2, MZ + Math.sin(aa) * r], [MX + Math.cos(ab) * r, y0 + 0.2, MZ + Math.sin(ab) * r], 0.08, railMetal));
    }
  }
  const tx = MX + DIR.x * railR, tz = MZ + DIR.z * railR;
  const carM = mat(PALETTE.brick);
  const trolley = group(
    place(box(1.2, 0.25, 1.4, steelDark), { y: 0.2 }),
    place(box(1.0, 0.7, 1.1, carM), { y: 0.45 }),
    place(box(0.5, 0.25, 0.5, steelDark), { y: 1.15 }),
  );
  for (const sx of [-0.45, 0.45]) for (const sz of [-0.45, 0.45]) {
    const wgeo = new THREE.CylinderGeometry(0.17, 0.17, 0.1, 8);
    wgeo.rotateZ(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, mat(PALETTE.black));
    wheel.position.set(sx, 0.22, sz * 1.1);
    trolley.add(wheel);
  }
  g.add(place(trolley, { x: tx, y: y0 + 0.08, z: tz, ry: -45 }));
  // tether up to the lower fin
  const finD = noseDist + L - 0.7;
  const finBottom = [MX + DIR.x * finD, axisY - 1.4, MZ + DIR.z * finD];
  g.add(beam([tx, y0 + 1.4, tz], finBottom, 0.06, mat(PALETTE.black)));

  // ---- passenger pavilion ------------------------------------------------
  const PX = -1.7, PZ = 2.3, PW = 3.4, PD = 3.0, PH = 3.4;
  const pav = { style: 'shop', wall: PALETTE.cream, glass: PALETTE.glassSky, frame: PALETTE.white, lit: 0.35, seed: 4, roof: PALETTE.concrete, floorHeight: PH, bay: 1.6 };
  g.add(place(patch(6.2, 4.6, 'paved'), { x: -1.9, y: y0, z: 2.6 }));
  g.add(place(facadeBlock({ w: PW, d: PD, floors: 1, ...pav }), { x: PX, y: y0, z: PZ }));
  g.add(place(facadeCylinder({ radius: PD / 2 - 0.05, floors: 1, segments: 16, ...pav }), { x: PX - PW / 2, y: y0, z: PZ }));
  // deck roof: navy band, railing and a little look-out kiosk
  const band = mat(PALETTE.navy);
  g.add(place(box(PW, 0.35, PD + 0.1, band), { x: PX, y: y0 + PH, z: PZ }));
  g.add(place(cylinder(PD / 2, PD / 2, 0.35, band, 16), { x: PX - PW / 2, y: y0 + PH, z: PZ }));
  g.add(place(parapet({ w: PW, d: PD, h: 0.5, t: 0.08, material: mat(PALETTE.white) }), { x: PX, y: y0 + PH + 0.35, z: PZ }));
  g.add(place(cylinder(0.85, 0.85, 0.85, glass(PALETTE.glassSky), 12), { x: PX - PW / 2, y: y0 + PH + 0.35, z: PZ }));
  g.add(place(cylinder(1.0, 1.0, 0.12, mat(PALETTE.white), 12), { x: PX - PW / 2, y: y0 + PH + 1.2, z: PZ }));
  g.add(place(dome({ radius: 0.8, height: 0.55, material: mat(PALETTE.roofGreen) }), { x: PX - PW / 2, y: y0 + PH + 1.32, z: PZ }));
  g.add(place(cylinder(0.03, 0.03, 0.7, steelDark, 4), { x: PX - PW / 2, y: y0 + PH + 1.8, z: PZ }));
  g.add(place(flag({ h: 2.4, color: PALETTE.red, color2: PALETTE.white }), { x: PX + 1.2, y: y0 + PH + 0.35, z: PZ - 0.9 }));
  // front: sign, canopy, doors
  g.add(place(panelSign({ text: 'AIRSHIPS', w: 2.6, h: 0.75, bg: PALETTE.navy, fg: '#ffd84a', border: '#ffd84a' }), { x: PX + 0.2, y: y0 + PH + 0.35, z: PZ + PD / 2 + 0.02 }));
  g.add(place(awning({ w: 2.4, depth: 1.0, drop: 0.3, color: PALETTE.red, color2: PALETTE.white }), { x: PX + 0.2, y: y0 + 2.7, z: PZ + PD / 2 }));
  g.add(place(door({ w: 1.3, h: 2.3, color: PALETTE.glassDark }), { x: PX + 0.2, y: y0, z: PZ + PD / 2 }));

  // covered walkway pavilion -> mast
  const wx = -3.0, wz0 = PZ - PD / 2, wz1 = MZ + 1.35;
  const wLen = wz0 - wz1;
  g.add(place(patch(1.6, wLen, 'concrete'), { x: wx, y: y0, z: (wz0 + wz1) / 2 }));
  g.add(place(box(1.7, 0.12, wLen, mat(PALETTE.navy)), { x: wx, y: y0 + 2.4, z: (wz0 + wz1) / 2 }));
  for (const z of [wz1 + 0.3, (wz0 + wz1) / 2, wz0 - 0.2]) for (const sx of [-0.75, 0.75]) {
    g.add(place(box(0.1, 2.4, 0.1, mat(PALETTE.white)), { x: wx + sx, y: y0, z }));
  }

  // ---- gas store, windsock and grounds ----------------------------------
  const gasM = mat('#7a9a5a', { roughness: 0.5, metalness: 0.2 });
  const capM = mat(PALETTE.yellow);
  for (let i = 0; i < 3; i++) {
    const z = -4.3 + i * 0.95;
    g.add(place(cylinder(0.38, 0.38, 2.8, gasM, 12), { x: 4.4, y: y0 + 0.55, z, rz: 90 }));
    g.add(place(cylinder(0.39, 0.39, 0.3, capM, 12), { x: 1.6, y: y0 + 0.55, z, rz: 90 }));
    for (const x of [2.2, 3.9]) g.add(place(box(0.15, 0.3, 0.7, steelDark), { x, y: y0, z }));
  }
  g.add(pipe([1.4, y0 + 0.55, -4.4], [1.4, y0 + 0.55, -2.3], 0.08, metal(PALETTE.yellow)));
  g.add(place(fence({ w: 4.0, d: 3.4, h: 1.0, style: 'wire', sides: ['back', 'right', 'front'] }), { x: 2.85, y: y0, z: -3.3 }));

  // windsock
  g.add(place(cylinder(0.05, 0.07, 4.2, metal(PALETTE.steelLight), 6), { x: 4.4, y: y0, z: -0.6 }));
  const sockM = surface('stripes', PALETTE.orange, { color2: PALETTE.white, size: 0.5 });
  const sock = orientedCylinder([4.4, y0 + 3.9, -0.6], [3.2, y0 + 3.55, -0.2], 0.24, 0.12, sockM, 10);
  g.add(sock);

  // street front: path, fence, lamps, bench, trees
  g.add(place(patch(1.4, 1.2, 'paved'), { x: PX + 0.2, y: y0, z: 4.4 }));
  g.add(place(fence({ w: 9.6, d: 0.1, h: 0.7, style: 'railing', sides: ['front'], gap: 1.6 }), { x: 0, y: y0, z: 4.8 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -0.3, y: y0, z: 4.3, ry: 180 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -4.4, y: y0, z: 4.3 }));
  g.add(place(bench({ w: 1.4 }), { x: 0.8, y: y0, z: 0.6, ry: -90 }));
  g.add(place(tree({ kind: 'round', h: 3.6, seed: 7 }), { x: -0.6, y: y0, z: -3.6 }));
  g.add(place(tree({ kind: 'cone', h: 3.6, seed: 8 }), { x: 3.9, y: y0, z: 0.4 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 9 }), { x: -1.4, y: y0, z: -2.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 10 }), { x: 0.6, y: y0, z: 4.2 }));
  g.add(place(tree({ kind: 'bush', h: 1.1, seed: 11 }), { x: -4.6, y: y0, z: 0.3 }));
  return g;
}

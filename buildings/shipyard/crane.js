import * as THREE from 'three';
import { PALETTE, mat, metal, box, beam, place, cylinder, textured, signTexture } from '../../src/lib/index.js';

// Goliath gantry crane straddling the slipway. Rails run along X at z = ±span/2,
// the twin box girders span Z at the top, the crab (trolley) rides on top of them.

/** Box with 0..1 UVs whose +x / -x faces carry the text (lib sign() shrinks text on wide faces). */
function girderSign(w, h, d, text, bg, fg) {
  const tex = signTexture(text, { bg, fg, width: 1024, height: Math.round((1024 * h) / d) });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.12, emissiveMap: tex });
  const side = mat(bg);
  const geo = new THREE.BoxGeometry(w, h, d).translate(0, h / 2, 0);
  return new THREE.Mesh(geo, [face, face, side, side, side, side]);
}

export function goliathCrane({ span = 9.6, h = 17, legSpread = 5, text = 'TINY TOWN SHIPYARD', hookY = 8 } = {}) {
  const g = new THREE.Group();
  const yellow = mat(PALETTE.yellow, { roughness: 0.55 });
  const yellowDark = mat('#c9a414', { roughness: 0.6 });
  const dark = mat(PALETTE.darkGrey);
  const steel = metal(PALETTE.steelDark);
  const zs = span / 2;
  const gh = 2.2; // girder depth
  const gTop = h;
  const gBot = h - gh;

  for (const s of [1, -1]) {
    const z = s * zs;
    // bogies on the rails
    g.add(place(box(legSpread + 1.2, 0.7, 0.9, yellowDark), { y: 0.35, z }));
    for (const x of [-legSpread / 2 - 0.2, -legSpread / 2 + 0.6, legSpread / 2 - 0.6, legSpread / 2 + 0.2]) {
      const wg = new THREE.CylinderGeometry(0.33, 0.33, 0.5, 10).rotateX(Math.PI / 2);
      const wh = new THREE.Mesh(wg, dark);
      wh.position.set(x, 0.33, z);
      g.add(wh);
    }
    // A-frame legs
    for (const sx of [-1, 1]) {
      g.add(beam([sx * legSpread / 2, 1.0, z], [sx * 0.9, gBot, z], 0.75, yellow));
    }
    // leg cross ties
    for (const y of [5.5, 11]) {
      const k = (y - 1) / (gBot - 1);
      const half = legSpread / 2 + (0.9 - legSpread / 2) * k;
      g.add(beam([-half, y, z], [half, y, z], 0.45, yellow));
    }
  }

  // twin box girders spanning Z, with the sign plates on the outer faces
  for (const sx of [-1, 1]) {
    g.add(place(box(0.9, gh, span + 0.9, yellow), { x: sx * 0.95, y: gBot }));
    g.add(place(girderSign(0.06, 1.3, span - 0.6, text, PALETTE.yellow, PALETTE.navy), { x: sx * 1.43, y: gBot + 0.45 }));
  }
  // end ties over the legs
  for (const s of [1, -1]) g.add(place(box(3.2, gh + 0.2, 0.9, yellowDark), { y: gBot - 0.1, z: s * zs }));
  // walkway + handrails on top
  g.add(place(box(2.8, 0.08, span + 0.9, steel), { y: gTop }));
  for (const sx of [-1, 1]) {
    g.add(beam([sx * 1.4, gTop + 0.9, -zs - 0.4], [sx * 1.4, gTop + 0.9, zs + 0.4], 0.06, mat(PALETTE.white)));
    for (let z = -zs; z <= zs + 0.01; z += span / 6) g.add(beam([sx * 1.4, gTop, z], [sx * 1.4, gTop + 0.9, z], 0.05, mat(PALETTE.white)));
  }

  // crab / trolley riding on the girders, with the hoist machinery house
  const cz = 0.6;
  g.add(place(box(3.0, 0.6, 2.6, yellowDark), { y: gTop + 0.08, z: cz }));
  g.add(place(box(2.4, 1.8, 2.0, mat(PALETTE.white)), { y: gTop + 0.68, z: cz }));
  g.add(place(box(2.6, 0.15, 2.2, mat(PALETTE.red)), { y: gTop + 2.48, z: cz }));
  g.add(place(box(0.05, 0.5, 1.2, mat(PALETTE.glassDark)), { x: 1.22, y: gTop + 1.4, z: cz }));
  // operator cab hung under one end
  g.add(place(box(1.6, 1.8, 1.8, mat(PALETTE.white)), { x: 0, y: gBot - 1.9, z: -zs + 1.6 }));
  g.add(place(box(1.62, 0.8, 1.82, mat(PALETTE.glassBlue, { roughness: 0.2, metalness: 0.4 })), { x: 0, y: gBot - 1.1, z: -zs + 1.6 }));
  // beacon lights
  for (const s of [1, -1]) g.add(place(cylinder(0.15, 0.15, 0.3, mat(PALETTE.red, { emissive: PALETTE.red, emissiveIntensity: 1 }), 8), { y: gTop + 0.08, z: s * (zs + 0.2) }));

  // hoist ropes and hook block, carrying a hull block
  const rope = mat(PALETTE.black);
  for (const dx of [-0.35, 0.35]) for (const dz of [-0.35, 0.35]) g.add(beam([dx, gTop, cz + dz], [dx * 0.6, hookY + 1.2, cz + dz * 0.6], 0.05, rope));
  g.add(place(box(0.9, 0.9, 0.9, mat(PALETTE.orange)), { y: hookY + 0.4, z: cz }));
  g.add(place(box(0.25, 0.5, 0.25, steel), { y: hookY - 0.1, z: cz }));
  // spreader + slings
  g.add(place(box(3.4, 0.3, 0.4, yellowDark), { y: hookY - 0.6, z: cz }));
  const bw = 3.6, bd = 4.2, bh = 2.2, by = hookY - 3.4;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.add(beam([sx * 1.6, hookY - 0.6, cz], [sx * (bw / 2 - 0.2), by + bh, cz + sz * (bd / 2 - 0.2)], 0.04, rope));
  // the hull block: a prefabricated deckhouse unit in primer
  const blockM = mat('#b86a3c');
  g.add(place(box(bw, bh, bd, blockM), { y: by, z: cz }));
  g.add(place(box(bw - 0.6, 0.12, bd - 0.6, mat('#8a5236')), { y: by + bh, z: cz }));
  for (const z of [-1.2, 0, 1.2]) g.add(place(box(bw + 0.04, 0.5, 0.6, mat(PALETTE.glassDark)), { y: by + 1.2, z: cz + z }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, place, tank, pipe, pipeRun,
  tree, car, fence, streetLamp, surface, mat, metal, water, emissive,
  textured, signTexture, door, barrelRoof,
} from '../../src/lib/index.js';

// Sign with 0..1 UVs so the text fills the whole face (lib sign() shrinks on faces > 1 m).
function bigSign(text, w, h, { bg = PALETTE.navy, fg = '#ffffff', depth = 0.15 } = {}) {
  const tex = signTexture(text, { bg, fg, width: 512, height: Math.max(32, Math.round((512 * h) / w)), border: fg });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return new THREE.Mesh(new THREE.BoxGeometry(w, h, depth).translate(0, h / 2, 0), [side, side, side, side, face, side]);
}

// Reverse-osmosis rack: stacked white pressure vessels along X in a blue steel frame.
function roRack({ len = 4.2, rows = 4, cols = 2, gap = 0.36 }) {
  const g = new THREE.Group();
  const frame = metal(PALETTE.blue, { roughness: 0.5 });
  const vessel = mat(PALETTE.white, { roughness: 0.45 });
  const capM = mat(PALETTE.lightGrey);
  const rackW = (cols - 1) * gap + 0.4;
  for (let c = 0; c < cols; c++) {
    const z = -((cols - 1) * gap) / 2 + c * gap;
    for (let r = 0; r < rows; r++) {
      const y = 0.35 + r * gap;
      const v = cylinder(0.14, 0.14, len, vessel, 10);
      v.rotation.z = Math.PI / 2;
      v.position.set(0, y, z);
      g.add(v);
      for (const s of [-1, 1]) {
        const cap = cylinder(0.16, 0.16, 0.08, capM, 10);
        cap.rotation.z = Math.PI / 2;
        cap.position.set(s * (len / 2 + 0.02), y, z);
        g.add(cap);
      }
    }
  }
  const top = 0.35 + rows * gap;
  for (const x of [-len / 2 + 0.25, 0, len / 2 - 0.25]) {
    for (const s of [-1, 1]) g.add(place(box(0.08, top, 0.08, frame), { x, z: (s * rackW) / 2 }));
    g.add(place(box(0.08, 0.08, rackW, frame), { x, y: top - 0.08 }));
    g.add(place(box(0.08, 0.08, rackW, frame), { x, y: 0.12 }));
  }
  // manifold headers at both ends
  for (const s of [-1, 1]) g.add(place(box(0.14, top - 0.2, rackW - 0.05, metal(PALETTE.steel)), { x: s * (len / 2 + 0.12), y: 0.15 }));
  return g;
}

// 2x1 tiles (20 x 10 m). Front (street) faces +z, the sea is at the back (-z).
export default function build() {
  const ys = LOT_HEIGHT; // sea level (top of the lot)
  const g = new THREE.Group();
  g.add(lot([2, 1], 'concrete'));
  const seaD = 2.5, seaZ = -5 + seaD / 2, quayZ = -5 + seaD;
  // land platform: everything on land sits 0.5 m above the sea, with a quay wall at the back
  const landD = 10 - seaD;
  g.add(place(box(20, 0.5, landD, [mat(PALETTE.concreteDark), mat(PALETTE.concreteDark), surface('concrete', PALETTE.concrete, { size: 6 }), mat(PALETTE.concreteDark), mat(PALETTE.concreteDark), mat(PALETTE.concreteDark)]), { y: ys, z: quayZ + landD / 2 }));
  const y0 = ys + 0.5;

  const steel = metal(PALETTE.steel);
  const blueSteel = metal(PALETTE.blue, { roughness: 0.5 });
  const pipeBlue = mat(PALETTE.blue, { roughness: 0.5 });
  const pipeGrey = mat(PALETTE.steelLight, { roughness: 0.5 });
  const brineM = mat('#7a8a5a', { roughness: 0.6 });
  const roofM = surface('corrugated', PALETTE.roofBlue, { size: 1.2, metalness: 0.2, roughness: 0.6 });

  // ---- sea strip along the back with a quay wall and rock armour
  g.add(place(box(20, 0.04, seaD, water(PALETTE.water)), { y: ys, z: seaZ }));
  g.add(place(box(20, 0.12, 0.3, mat(PALETTE.yellow)), { y: y0, z: quayZ + 0.15 }));
  for (let i = 0; i < 12; i++) {
    const x = -9.4 + i * 1.7;
    if (Math.abs(x + 7.7) < 1.1 || Math.abs(x - 9.3) < 1.1) continue;
    g.add(place(box(0.8, 0.3, 0.45, mat(i % 2 ? PALETTE.stone : PALETTE.stoneDark)), { x, y: ys, z: quayZ - 0.25, ry: i * 23 }));
  }
  // mooring bollards on the quay
  for (const x of [-4.5, 0.5, 5.5]) g.add(place(cylinder(0.14, 0.18, 0.4, mat(PALETTE.darkGrey), 8), { x, y: y0, z: quayZ + 0.5 }));

  // ---- seawater intake: offshore intake head, big pipe to the pump house
  const ix = -7.7;
  g.add(place(cylinder(0.75, 0.85, 0.7, mat(PALETTE.concrete), 12), { x: ix, y: ys, z: -4.2 }));
  g.add(place(cylinder(0.7, 0.7, 0.12, metal(PALETTE.steelDark), 12), { x: ix, y: ys + 0.7, z: -4.2 }));
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.add(place(box(0.08, 0.5, 0.08, metal(PALETTE.steelDark)), { x: ix + Math.cos(a) * 0.62, y: ys + 0.2, z: -4.2 + Math.sin(a) * 0.62 }));
  }
  g.add(place(cylinder(0.12, 0.2, 0.9, mat(PALETTE.yellow), 8), { x: ix + 1.2, y: ys, z: -4.5 }));
  g.add(place(cylinder(0.05, 0.05, 0.25, emissive(PALETTE.orange, 0.8), 6), { x: ix + 1.2, y: ys + 0.9, z: -4.5 }));
  g.add(pipeRun([[ix, ys + 0.45, -3.7], [ix, y0 + 0.45, -2.6], [ix, y0 + 0.45, -2.3]], 0.4, pipeBlue));
  g.add(place(box(1.1, 0.45, 0.3, mat(PALETTE.concreteDark)), { x: ix, y: ys, z: -3.3 }));
  // intake pump house
  g.add(place(facadeBlock({ w: 3.6, d: 3.4, h: 3.6, floorHeight: 3.6, style: 'industrial', wall: PALETTE.concrete, glass: PALETTE.glassBlue, frame: PALETTE.steelDark, bay: 1.8, seed: 3, roof: PALETTE.concreteDark }), { x: -8.0, y: y0, z: -0.7 }));
  g.add(place(box(3.65, 0.4, 3.45, mat(PALETTE.blue)), { x: -8.0, y: y0 + 3.6, z: -0.7 }));
  g.add(place(box(1.4, 0.7, 1.2, mat(PALETTE.lightGrey)), { x: -8.5, y: y0 + 4.0, z: -1.2 }));
  g.add(place(cylinder(0.25, 0.25, 0.9, metal(PALETTE.steel), 8), { x: -7.1, y: y0 + 4.0, z: -0.3 }));
  g.add(place(door({ w: 1.6, h: 2.4, color: PALETTE.blue }), { x: -8.0, y: y0, z: 1.0 }));
  g.add(place(bigSign('INTAKE', 2.4, 0.55, { bg: PALETTE.blue }), { x: -8.0, y: y0 + 2.75, z: 1.06 }));

  // ---- long membrane hall (closed), back row
  const hx = 0.3, hz = -1.35, hw = 10.6, hd = 2.9, hh = 4.2;
  g.add(place(facadeBlock({ w: hw, d: hd, h: hh, floorHeight: hh, style: 'ribbon', wall: PALETTE.white, glass: PALETTE.glassTeal, frame: PALETTE.steelLight, bay: 1.3, seed: 7, roof: PALETTE.concrete }), { x: hx, y: y0, z: hz }));
  g.add(place(box(hw + 0.05, 0.5, hd + 0.05, mat(PALETTE.blue)), { x: hx, y: y0 + hh - 0.5, z: hz }));
  g.add(place(barrelRoof({ w: hw, d: hd, h: 0.8, axis: 'x', material: roofM, endMaterial: PALETTE.white }), { x: hx, y: y0 + hh, z: hz }));
  // rooftop sign on posts, facing the street
  const sy = y0 + hh + 0.5;
  for (const x of [-2.6, 0, 2.6]) g.add(place(box(0.1, 0.5, 0.1, metal(PALETTE.darkGrey)), { x: hx + x, y: sy - 0.2, z: hz }));
  g.add(place(bigSign('DESALINATION', 7.0, 1.1, { bg: PALETTE.blue }), { x: hx, y: sy + 0.25, z: hz }));

  // ---- open rack hall: canopy on posts over RO pressure-vessel racks, front row
  const rx = -0.6, rz = 1.55, rw = 8.8, rd = 2.5, rh = 3.0;
  for (const x of [-rw / 2 + 0.15, -rw / 6, rw / 6, rw / 2 - 0.15]) for (const s of [-1, 1]) {
    g.add(place(box(0.18, rh, 0.18, blueSteel), { x: rx + x, y: y0, z: rz + s * (rd / 2 - 0.15) }));
  }
  for (const s of [-1, 1]) g.add(place(box(rw + 0.3, 0.25, 0.2, blueSteel), { x: rx, y: y0 + rh, z: rz + s * (rd / 2 - 0.15) }));
  for (let i = 0; i < 12; i++) g.add(place(box(0.14, 0.12, rd + 0.3, mat(PALETTE.steelLight)), { x: rx - rw / 2 + 0.35 + i * ((rw - 0.7) / 11), y: y0 + rh + 0.25, z: rz }));
  g.add(place(box(rw, 0.1, rd, mat(PALETTE.concreteDark)), { x: rx, y: y0, z: rz }));
  g.add(place(roRack({ len: 3.6, rows: 5, cols: 3, gap: 0.42 }), { x: rx - 2.15, y: y0 + 0.1, z: rz }));
  g.add(place(roRack({ len: 3.6, rows: 5, cols: 3, gap: 0.42 }), { x: rx + 2.15, y: y0 + 0.1, z: rz }));
  // high-pressure pumps (orange) at the rack ends
  for (const x of [rx - 4.25, rx + 4.25]) {
    g.add(place(box(0.5, 0.5, 0.9, mat(PALETTE.orange)), { x, y: y0 + 0.1, z: rz + 0.3 }));
    g.add(place(box(0.4, 0.4, 0.5, metal(PALETTE.darkGrey)), { x, y: y0 + 0.1, z: rz - 0.5 }));
  }

  // ---- pipe bridge between the halls (feed, permeate, brine)
  const pz = 0.0;
  for (const x of [-5.8, -2.5, 1.0, 4.5]) g.add(place(box(0.15, 2.6, 0.15, steel), { x, y: y0, z: pz }));
  g.add(pipe([-6.2, y0 + 2.3, pz - 0.15], [6.2, y0 + 2.3, pz - 0.15], 0.17, pipeBlue));
  g.add(pipe([-6.2, y0 + 2.3, pz + 0.18], [7.6, y0 + 2.3, pz + 0.18], 0.13, pipeGrey));
  g.add(pipe([-5.8, y0 + 2.62, pz], [6.6, y0 + 2.62, pz], 0.11, brineM));
  // feed from pump house up onto the bridge
  g.add(pipeRun([[-6.2, y0 + 1.2, -0.3], [-6.2, y0 + 2.3, -0.15]], 0.17, pipeBlue));

  // ---- blue product-water tanks
  const tankM = mat(PALETTE.blue, { roughness: 0.45 });
  const t1 = { x: 7.9, z: 1.5 }, t2 = { x: 7.3, z: -1.5 };
  g.add(place(tank({ radius: 1.5, h: 3.6, roof: 'dome', material: tankM }), { x: t1.x, y: y0, z: t1.z }));
  g.add(place(tank({ radius: 1.25, h: 3.0, roof: 'dome', material: tankM }), { x: t2.x, y: y0, z: t2.z }));
  for (const [t, r, h] of [[t1, 1.5, 3.6], [t2, 1.25, 3.0]]) {
    for (const yy of [1.0, 2.2]) g.add(place(cylinder(r + 0.03, r + 0.03, 0.12, mat(PALETTE.white), 20), { x: t.x, y: y0 + yy * (h / 3.6), z: t.z }));
    g.add(place(box(0.08, h, 0.4, metal(PALETTE.steelDark)), { x: t.x - r - 0.05, y: y0, z: t.z }));
  }
  g.add(place(bigSign('H2O', 1.5, 0.6, { bg: PALETTE.white, fg: PALETTE.blue, depth: 0.06 }), { x: t1.x, y: y0 + 1.5, z: t1.z + 1.5 }));
  // permeate line down into the tanks
  g.add(pipeRun([[7.6, y0 + 2.3, 0.18], [7.6, y0 + 2.3, 0.6], [7.6, y0 + 3.4, 0.6]], 0.13, pipeGrey));

  // ---- brine outfall: pipe over the quay down into a foaming diffuser plume
  const bx = 9.3;
  g.add(pipeRun([[6.6, y0 + 2.62, 0], [bx, y0 + 2.62, 0], [bx, y0 + 0.5, 0], [bx, y0 + 0.5, -2.2], [bx, ys + 0.3, -2.8], [bx, ys + 0.1, -3.3]], 0.2, brineM));
  g.add(place(box(1.2, 0.8, 0.5, mat(PALETTE.concreteDark)), { x: bx, y: ys, z: -2.75 }));
  const foam = mat('#e8f6f8', { transparent: true, opacity: 0.85, roughness: 0.4 });
  g.add(place(cylinder(1.0, 1.1, 0.06, foam, 14), { x: bx - 0.6, y: ys + 0.01, z: -4.0 }));
  g.add(place(cylinder(0.55, 0.6, 0.06, foam, 12), { x: bx - 1.9, y: ys + 0.01, z: -4.5 }));
  g.add(place(cylinder(0.4, 0.4, 0.06, foam, 10), { x: bx + 0.3, y: ys + 0.01, z: -4.6 }));
  // warning board on piles out in the water
  for (const x of [5.4, 6.8]) g.add(place(cylinder(0.08, 0.08, 1.5, mat(PALETTE.woodDark), 6), { x, y: ys, z: -4.3 }));
  g.add(place(bigSign('BRINE OUTFALL', 2.0, 0.5, { bg: PALETTE.red }), { x: 6.1, y: ys + 1.1, z: -4.3, ry: 180 }));

  // ---- front: service road, gate, sign, palms, lamps, vehicles
  g.add(place(patch(20, 1.8, 'asphalt'), { y: y0, z: 3.85 }));
  g.add(place(patch(20, 0.2, mat(PALETTE.white)), { y: y0 + 0.01, z: 2.98 }));
  g.add(place(car({ color: PALETTE.white }), { x: 3.4, y: y0, z: 3.4, s: 0.6 }));
  g.add(place(car({ color: PALETTE.yellow, kind: 'van' }), { x: -4.0, y: y0, z: 3.9, ry: 180, s: 0.6 }));
  g.add(place(fence({ w: 19.6, d: 0.1, h: 0.9, style: 'wire', sides: ['front'] }), { y: y0, z: 4.85 }));
  g.add(place(bigSign('AQUA DESAL', 3.4, 0.9, { bg: PALETTE.blue }), { x: -7.5, y: y0 + 1.1, z: 4.7 }));
  for (const x of [-8.9, -6.1]) g.add(place(box(0.12, 1.1, 0.12, metal(PALETTE.darkGrey)), { x, y: y0, z: 4.7 }));
  for (const [x, s] of [[5.9, 32], [8.4, 33]]) g.add(place(tree({ kind: 'palm', h: 3.4, seed: s }), { x, y: y0, z: 2.8 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: -5.4, y: y0, z: 2.6 }));
  g.add(place(streetLamp({ h: 3.6 }), { x: 4.8, y: y0, z: 2.6, ry: 180 }));
  // small control kiosk by the gate
  g.add(place(facadeBlock({ w: 1.8, d: 1.5, h: 2.6, floorHeight: 2.6, style: 'punched', wall: PALETTE.cream, glass: PALETTE.window, frame: PALETTE.white, bay: 0.9, seed: 4, roof: PALETTE.blue }), { x: -8.6, y: y0, z: 2.2 }));
  return g;
}

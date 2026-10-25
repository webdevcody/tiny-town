import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT, rng,
  lot, patch, facadeBlock, gableRoof, box, cylinder, place, pipe,
  dome, cone, fence, tree, hayBale, sign, door, windowPanel, surface, mat, metal, shade,
} from '../../src/lib/index.js';
import { cow, tractor, ladder, milkChurn } from './props.js';

// 2x1 tiles (20 x 10 m). Front (lane / street) faces +z.
// Back row: long open-fronted cow shed, white milking parlour, blue feed silo.
// Front row: fenced paddock with grazing cows, gravel yard, round slurry tank.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([2, 1], 'grass'));

  // ---- cow shed (back left) ----------------------------------------------
  const sx = -4.25, sz = -2.45, sw = 10.9, sd = 4.5, eave = 3.0, plinth = 0.9;
  const boards = surface('planks', PALETTE.brick, { size: 1.5 });
  const block = surface('concrete', PALETTE.concrete, { size: 2 });
  const postM = metal(PALETTE.steelDark);
  const shed = new THREE.Group();
  shed.add(patch(sw, sd, 'concrete'));
  // back wall: concrete plinth + red timber boarding
  shed.add(place(box(sw, plinth, 0.25, block), { z: -sd / 2 + 0.125 }));
  shed.add(place(box(sw, eave - plinth, 0.18, boards), { y: plinth, z: -sd / 2 + 0.1 }));
  // gable ends
  for (const s of [-1, 1]) {
    shed.add(place(box(0.25, plinth, sd, block), { x: s * (sw / 2 - 0.125) }));
    shed.add(place(box(0.18, eave - plinth, sd, boards), { x: s * (sw / 2 - 0.1), y: plinth }));
  }
  // front: low feed wall, open above with steel posts (cows visible inside)
  shed.add(place(box(sw, plinth, 0.25, block), { z: sd / 2 - 0.125 }));
  const bays = 5;
  for (let i = 0; i <= bays; i++) {
    shed.add(place(box(0.2, eave - plinth, 0.2, postM), { x: -sw / 2 + 0.15 + (i * (sw - 0.3)) / bays, y: plinth, z: sd / 2 - 0.12 }));
  }
  shed.add(place(box(sw, 0.3, 0.22, postM), { y: eave - 0.3, z: sd / 2 - 0.12 }));
  // feed barrier rail
  shed.add(place(box(sw - 0.4, 0.08, 0.1, metal(PALETTE.yellow, { roughness: 0.5 })), { y: plinth + 0.55, z: sd / 2 - 0.12 }));
  // dark interior so the open front reads as a shed
  shed.add(place(box(sw - 0.6, 0.02, sd - 0.6, mat(PALETTE.mud)), { y: 0.05 }));
  // roof: grey corrugated with raised ridge vent
  const roofM = surface('corrugated', PALETTE.roofGrey, { size: 1.2, metalness: 0.2 });
  shed.add(place(gableRoof({ w: sw, d: sd, h: 1.6, overhang: 0.45, ridge: 'x', material: roofM, gableMaterial: boards }), { y: eave }));
  shed.add(place(box(sw - 1, 0.3, 0.7, mat(PALETTE.roofSlate)), { y: eave + 1.5 }));
  shed.add(place(box(sw - 1, 0.08, 1.0, roofM), { y: eave + 1.8 }));
  // clear rooflight strips on both slopes
  const slope = (Math.atan2(1.6, sd / 2) * 180) / Math.PI;
  const lightM = mat(PALETTE.glassSky, { roughness: 0.3, metalness: 0.2 });
  for (let i = 0; i < 4; i++) {
    const lx = -sw / 2 + 1.6 + i * ((sw - 3.2) / 3);
    for (const s of [-1, 1]) {
      shed.add(place(box(0.9, 0.05, 1.8, lightM), { x: lx, y: eave + 0.8 + 0.02, z: s * (sd / 4), rx: s * slope }));
    }
  }
  // small windows high on the back wall
  for (let i = 0; i < 5; i++) {
    shed.add(place(windowPanel({ w: 0.9, h: 0.5 }), { x: -sw / 2 + 1.3 + i * ((sw - 2.6) / 4), y: 2.0, z: -sd / 2 - 0.01, ry: 180 }));
  }
  // big sliding door on the west gable
  shed.add(place(door({ w: 2.6, h: 2.6, color: PALETTE.white }), { x: -sw / 2 - 0.02, z: -0.3, ry: -90 }));
  shed.add(place(box(0.14, 0.1, 3.4, postM), { x: -sw / 2 - 0.12, y: 2.75, z: -0.3 }));
  // cows inside, heads towards the feed barrier
  const cr = rng(95);
  [-4.1, -2.3, -0.4, 1.6, 3.6].forEach((cx, i) => {
    shed.add(place(cow({ seed: 20 + i, head: i % 2 ? 'black' : 'white' }), { x: cx, y: 0.05, z: 0.55 + cr.range(-0.2, 0.2), ry: -90 }));
  });
  [-3.2, 0.7, 3.4].forEach((cx, i) => {
    shed.add(place(cow({ seed: 40 + i }), { x: cx, y: 0.05, z: -1.25, ry: i % 2 ? 180 : 0 }));
  });
  g.add(place(shed, { x: sx, y: y0, z: sz }));

  // feed trough with silage along the shed front
  const tz = sz + sd / 2 + 0.35;
  g.add(place(box(sw - 0.6, 0.45, 0.55, block), { x: sx, y: y0, z: tz }));
  g.add(place(box(sw - 0.8, 0.06, 0.4, mat(PALETTE.ochre)), { x: sx, y: y0 + 0.42, z: tz }));

  // ---- milking parlour (white, red roof, gable to the street) -------------
  const px = 3.9, pz = -2.75, pw = 4.6, pd = 3.9;
  g.add(place(facadeBlock({
    w: pw, d: pd, floors: 1, style: 'punched', wall: PALETTE.white, frame: PALETTE.white,
    glass: PALETTE.window, windowW: 0.45, windowH: 0.35, bay: 1.6, seed: 9, blank: ['front', 'left'],
  }), { x: px, y: y0, z: pz }));
  g.add(place(box(pw + 0.1, 0.35, pd + 0.1, mat(PALETTE.concreteDark)), { x: px, y: y0, z: pz }));
  g.add(place(gableRoof({ w: pw, d: pd, h: 1.7, overhang: 0.35, ridge: 'z', material: surface('roofTiles', PALETTE.roofRed, { size: 1.5 }), gableMaterial: PALETTE.white }), { x: px, y: y0 + 3, z: pz }));
  const pf = pz + pd / 2;
  g.add(place(door({ w: 1.6, h: 2.3, color: PALETTE.roofBlue }), { x: px - 0.9, y: y0, z: pf }));
  g.add(place(windowPanel({ w: 1.0, h: 0.8 }), { x: px + 1.2, y: y0 + 1.2, z: pf }));
  g.add(place(sign({ text: 'DAIRY', w: 2.2, h: 0.7, bg: PALETTE.navy, fg: '#ffffff', depth: 0.08 }), { x: px, y: y0 + 3.35, z: pf + 0.02 }));
  // vent cowl on the roof ridge
  g.add(place(cylinder(0.25, 0.3, 0.7, metal(PALETTE.steel), 8), { x: px, y: y0 + 4.4, z: pz - 0.8 }));
  g.add(place(cone(0.45, 0.35, PALETTE.steelDark, 10), { x: px, y: y0 + 5.1, z: pz - 0.8 }));

  // stainless bulk milk tank on stands beside the parlour door
  const steelM = metal(PALETTE.chrome, { roughness: 0.25 });
  const mt = new THREE.Group();
  const tankGeo = new THREE.CylinderGeometry(0.65, 0.65, 2.2, 14);
  tankGeo.rotateZ(Math.PI / 2);
  const tankMesh = new THREE.Mesh(tankGeo, steelM);
  tankMesh.position.y = 1.15;
  mt.add(tankMesh);
  for (const s of [-1, 1]) {
    const capGeo = new THREE.SphereGeometry(0.65, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    capGeo.scale(1, 0.35, 1);
    capGeo.rotateZ((-s * Math.PI) / 2);
    const cap = new THREE.Mesh(capGeo, steelM);
    cap.position.set(s * 1.1, 1.15, 0);
    mt.add(cap);
    for (const t of [-1, 1]) mt.add(place(box(0.1, 0.6, 0.1, postM), { x: s * 0.75, z: t * 0.4 }));
  }
  mt.add(place(cylinder(0.25, 0.25, 0.2, steelM, 10), { y: 1.75 }));
  g.add(place(mt, { x: px + 0.6, y: y0, z: pf + 1.05 }));
  g.add(place(milkChurn(), { x: px - 2.0, y: y0, z: pf + 0.5 }));
  g.add(place(milkChurn(), { x: px - 1.7, y: y0, z: pf + 0.8 }));

  // ---- feed silo (Harvestore blue) -----------------------------------------
  const silx = 8.2, silz = -2.8, silr = 1.45, silh = 10.5;
  const siloM = surface('corrugated', PALETTE.roofBlue, { size: 1.5, metalness: 0.3, roughness: 0.5 });
  g.add(place(cylinder(silr + 0.15, silr + 0.15, 0.4, block, 18), { x: silx, y: y0, z: silz }));
  g.add(place(cylinder(silr, silr, silh, siloM, 18), { x: silx, y: y0 + 0.4, z: silz }));
  for (const hb of [3, 6.5]) g.add(place(cylinder(silr + 0.04, silr + 0.04, 0.2, mat(PALETTE.white), 18), { x: silx, y: y0 + 0.4 + hb, z: silz }));
  g.add(place(dome({ radius: silr, height: 1.0, material: mat(PALETTE.white, { flatShading: false }), segments: 18 }), { x: silx, y: y0 + 0.4 + silh, z: silz }));
  g.add(place(ladder(silh + 0.6), { x: silx, y: y0 + 0.4, z: silz + silr + 0.1 }));
  // auger pipe from the silo over the parlour into the shed
  const augM = metal(PALETTE.steelLight, { roughness: 0.4 });
  g.add(pipe([silx - silr + 0.1, y0 + 9.5, silz], [1.3, y0 + 4.9, silz + 0.4], 0.16, augM));
  g.add(pipe([1.3, y0 + 4.9, silz + 0.4], [-0.2, y0 + 4.6, silz + 0.4], 0.16, augM));
  g.add(place(cylinder(0.3, 0.3, 0.6, augM, 8), { x: silx - silr - 0.05, y: y0 + 9.2, z: silz }));

  // ---- gravel yard + track to the street ------------------------------------
  g.add(place(patch(4.1, 5.0, 'gravel'), { x: 3.75, y: y0, z: 2.45 }));
  g.add(place(patch(3.6, 1.6, 'gravel'), { x: 7.9, y: y0, z: -0.25 }));
  g.add(place(tractor({ color: PALETTE.green }), { x: 3.1, y: y0 + 0.05, z: 3.0, ry: 70 }));

  // ---- slurry tank (round, concrete) ----------------------------------------
  const stx = 7.55, stz = 2.65, str = 2.05, sth = 1.7;
  const st = new THREE.Group();
  st.add(cylinder(str, str, sth, surface('concrete', PALETTE.concreteDark, { size: 1.5 }), 22));
  st.add(place(cylinder(str - 0.2, str - 0.2, 0.03, mat(PALETTE.mud, { roughness: 0.4 }), 22), { y: sth }));
  st.add(place(cylinder(str - 0.7, str - 0.7, 0.03, mat(shade(PALETTE.mud, -0.12), { roughness: 0.4 }), 22), { y: sth + 0.01 }));
  // safety rail on posts
  const railM = metal(PALETTE.yellow, { roughness: 0.5 });
  const posts = 12;
  for (let i = 0; i < posts; i++) {
    const a = (i / posts) * Math.PI * 2;
    st.add(place(box(0.06, 0.9, 0.06, railM), { x: Math.cos(a) * (str - 0.06), y: sth, z: Math.sin(a) * (str - 0.06) }));
  }
  const ringGeo = new THREE.TorusGeometry(str - 0.06, 0.04, 4, 24);
  ringGeo.rotateX(Math.PI / 2);
  const ring = new THREE.Mesh(ringGeo, railM);
  ring.position.y = sth + 0.88;
  st.add(ring);
  st.add(place(ladder(sth + 0.9), { z: str + 0.05 }));
  g.add(place(st, { x: stx, y: y0, z: stz }));
  // slurry pipe from the shed along the yard
  g.add(pipe([1.3, y0 + 0.25, -0.05], [stx - str + 0.05, y0 + 0.25, -0.05], 0.12, mat(PALETTE.darkGrey)));
  g.add(pipe([stx - str + 0.05, y0 + 0.25, -0.05], [stx - str * 0.7, y0 + 1.6, stz - str * 0.7], 0.12, mat(PALETTE.darkGrey)));

  // round bales between silo and slurry tank
  const hayWrap = mat(PALETTE.hay);
  [[6.5, -0.45], [7.95, -0.45], [9.35, -0.45]].forEach(([hx, hz], i) => {
    const b = hayBale({ r: 0.62 });
    if (i === 2) b.material = mat(PALETTE.black, { roughness: 0.3 }); // wrapped silage bale
    else b.material = hayWrap;
    g.add(place(b, { x: hx, y: y0, z: hz }));
  });
  g.add(place(hayBale({ r: 0.62 }), { x: 7.2, y: y0 + 1.15, z: -0.45 }));

  // ---- paddock ---------------------------------------------------------------
  const pkx = -4.3, pkz = 2.75, pkw = 10.6, pkd = 4.1;
  g.add(place(patch(pkw, pkd, mat(PALETTE.grassLight), 0.02), { x: pkx, y: y0, z: pkz }));
  g.add(place(patch(2.4, 1.3, 'dirt'), { x: -0.2, y: y0 + 0.01, z: 1.35 }));
  g.add(place(fence({ w: pkw, d: pkd, h: 1.0, style: 'picket', color: PALETTE.woodLight, sides: ['front', 'left'] }), { x: pkx, y: y0, z: pkz }));
  // post-and-rail on the yard side with an open gate
  g.add(place(fence({ w: 2.6, d: 0.1, h: 1.0, style: 'wire', color: PALETTE.woodDark, sides: ['front'] }), { x: pkx + pkw / 2, y: y0, z: pkz + 0.75, ry: 90 }));
  g.add(place(box(1.6, 1.0, 0.06, metal(PALETTE.steel)), { x: pkx + pkw / 2 + 0.8, y: y0 + 0.05, z: pkz - 0.6, ry: -35 }));
  // water trough + hay ring feeder
  g.add(place(box(1.8, 0.55, 0.6, metal(PALETTE.steel)), { x: -8.3, y: y0, z: 1.3 }));
  g.add(place(box(1.6, 0.04, 0.45, mat(PALETTE.water)), { x: -8.3, y: y0 + 0.52, z: 1.3 }));
  g.add(place(cylinder(0.9, 0.9, 1.0, mat(PALETTE.hay), 12), { x: -2.0, y: y0, z: 3.3 }));
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    g.add(place(box(0.06, 1.05, 0.06, metal(PALETTE.red)), { x: -2.0 + Math.cos(a) * 0.95, y: y0, z: 3.3 + Math.sin(a) * 0.95 }));
  }
  const hoop = new THREE.TorusGeometry(0.95, 0.05, 4, 20);
  hoop.rotateX(Math.PI / 2);
  for (const hy of [0.4, 1.0]) {
    const m = new THREE.Mesh(hoop, metal(PALETTE.red));
    m.position.set(-2.0, y0 + hy, 3.3);
    g.add(m);
  }
  // grazing cows
  const grazers = [
    [-6.6, 3.4, 20], [-4.6, 2.2, -150], [-0.4, 3.9, 200], [-7.6, 2.0, 60], [-3.6, 4.0, 10],
  ];
  grazers.forEach(([cx, cz, ry], i) => {
    g.add(place(cow({ seed: 60 + i, head: i % 2 ? 'black' : 'white', graze: i % 3 === 0 }), { x: cx, y: y0 + 0.05, z: cz, ry }));
  });
  // shade tree in the paddock corner + bushes behind the silo
  g.add(place(tree({ kind: 'round', h: 4.8, seed: 12 }), { x: -8.4, y: y0, z: 3.6 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 14 }), { x: 9.3, y: y0, z: -4.4 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 15 }), { x: 5.2, y: y0, z: 4.5 }));

  return g;
}

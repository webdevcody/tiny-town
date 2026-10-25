import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, facadeBlock, facadeCylinder, gableRoof, dome, box, cylinder, sphere, cone, place, group,
  parapet, stairs, door, sign, flag, streetLamp, bench, tree, hedge, mat, metal, water, shade,
} from '../../src/lib/index.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// Stone podium -> two-storey hall with balustrade -> attic -> colonnaded drum -> copper dome -> lantern.

const STONE = mat(PALETTE.offWhite);
const TRIM = mat(PALETTE.white);
const PLINTH = mat(PALETTE.stone);
const COPPER = mat(PALETTE.roofGreen, { roughness: 0.5, metalness: 0.2, flatShading: false });
const GOLD = metal(PALETTE.glassGold, { roughness: 0.3 });

/** Classical column with square base and capital, base at y=0. */
function column(h, r = 0.32) {
  return group(
    box(r * 2.6, 0.25, r * 2.6, TRIM),
    place(cylinder(r * 0.85, r, h - 0.55, STONE, 10), { y: 0.25 }),
    place(box(r * 2.7, 0.3, r * 2.7, TRIM), { y: h - 0.3 })
  );
}

/** Ring of columns around the y axis. */
function colonnadeRing(count, radius, h, r) {
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    g.add(place(column(h, r), { x: Math.cos(a) * radius, z: Math.sin(a) * radius }));
  }
  return g;
}

/** Row of balusters + rail along X (balustrade). */
function balustrade(len, h = 0.8, step = 0.45) {
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(len / step));
  for (let i = 0; i <= n; i++) g.add(place(box(0.16, h - 0.15, 0.16, STONE), { x: -len / 2 + (len * i) / n }));
  g.add(place(box(len + 0.2, 0.15, 0.32, TRIM), { y: h - 0.15 }));
  return g;
}

/** Balustrade around a w x d rectangle. */
function balustradeRect(w, d, h) {
  return group(
    place(balustrade(w, h), { z: d / 2 }),
    place(balustrade(w, h), { z: -d / 2 }),
    place(balustrade(d, h), { x: w / 2, ry: 90 }),
    place(balustrade(d, h), { x: -w / 2, ry: 90 })
  );
}

export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([2, 2], 'grass'));

  // --- layout -------------------------------------------------------------
  const plinthH = 1.2;
  const hallW = 15, hallD = 9.5, hallZ = -4.25; // hall spans z -9 .. 0.5
  const hallFront = hallZ + hallD / 2;
  const floorH = 3.6, nFloors = 2;
  const hallH = floorH * nFloors;
  const yp = y0 + plinthH; // top of podium

  // podium (rusticated stone base) with a front terrace for the portico
  g.add(place(box(hallW + 1.2, plinthH, hallD + 1.2, PLINTH), { y: y0, z: hallZ }));
  g.add(place(box(hallW + 1.4, 0.15, hallD + 1.4, TRIM), { y: y0 + plinthH - 0.15, z: hallZ }));
  const porW = 9.2, porD = 3.8;
  const porZ = hallFront + porD / 2;
  g.add(place(box(porW + 0.8, plinthH, porD, PLINTH), { y: y0, z: porZ }));
  g.add(place(box(porW + 1.0, 0.15, porD + 0.1, TRIM), { y: y0 + plinthH - 0.15, z: porZ }));

  // --- main hall ----------------------------------------------------------
  const facadeStyle = {
    style: 'punched', wall: PALETTE.offWhite, frame: PALETTE.white, glass: PALETTE.window,
    windowW: 0.42, windowH: 0.62, bay: 2.5, lit: 0.15, seed: 35, roof: PALETTE.concrete,
  };
  g.add(place(facadeBlock({ w: hallW, d: hallD, floors: nFloors, floorHeight: floorH, ...facadeStyle }), { y: yp, z: hallZ }));
  // string course between floors, corner pilasters
  g.add(place(box(hallW + 0.2, 0.25, hallD + 0.2, TRIM), { y: yp + floorH - 0.12, z: hallZ }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.7, hallH, 0.7, TRIM), { x: sx * (hallW / 2 - 0.25), y: yp, z: hallZ + sz * (hallD / 2 - 0.25) }));
  }
  // entablature / cornice
  const corY = yp + hallH;
  g.add(place(box(hallW + 0.4, 0.7, hallD + 0.4, TRIM), { y: corY, z: hallZ }));
  g.add(place(box(hallW + 0.8, 0.25, hallD + 0.8, STONE), { y: corY + 0.7, z: hallZ }));
  const roofY = corY + 0.95;
  g.add(place(balustradeRect(hallW + 0.4, hallD + 0.4, 0.85), { y: roofY, z: hallZ }));

  // --- portico ------------------------------------------------------------
  const colH = hallH;
  const nCols = 6;
  const colFrontZ = hallFront + porD - 0.6;
  for (let i = 0; i < nCols; i++) {
    const x = -porW / 2 + 0.5 + ((porW - 1) * i) / (nCols - 1);
    g.add(place(column(colH, 0.36), { x, y: yp, z: colFrontZ }));
    if (i === 0 || i === nCols - 1) g.add(place(column(colH, 0.36), { x, y: yp, z: colFrontZ - 1.5 }));
  }
  // entablature with name frieze
  const entY = yp + colH;
  g.add(place(box(porW + 0.2, 0.95, porD, TRIM), { y: entY, z: porZ }));
  g.add(place(sign({ text: 'CITY HALL', w: 5.6, h: 0.65, bg: PALETTE.white, fg: '#5b5446', depth: 0.06 }), { y: entY + 0.15, z: porZ + porD / 2 }));
  g.add(place(box(porW + 0.5, 0.2, porD + 0.3, STONE), { y: entY + 0.95, z: porZ + 0.15 }));
  // pediment
  const pedY = entY + 1.15;
  g.add(place(gableRoof({ w: porW + 0.2, d: porD + 0.7, h: 2.1, overhang: 0.25, ridge: 'z', material: mat(PALETTE.roofGrey), gableMaterial: STONE }), { y: pedY, z: porZ + 0.35 }));
  // clock in the tympanum
  g.add(place(cylinder(0.55, 0.55, 0.08, TRIM, 16), { y: pedY + 0.75, z: porZ + porD / 2 + 0.75, rx: 90 }));
  g.add(place(cylinder(0.42, 0.42, 0.1, mat(PALETTE.navy), 16), { y: pedY + 0.75, z: porZ + porD / 2 + 0.78, rx: 90 }));
  // acroterion statues
  g.add(place(sphere(0.3, GOLD, 8), { y: pedY + 2.1, z: porZ + porD / 2 + 0.6 }));
  // grand doors behind the columns
  g.add(place(door({ w: 2.2, h: 3.6, color: PALETTE.woodDark }), { y: yp, z: hallFront }));
  g.add(place(door({ w: 1.3, h: 2.6, color: PALETTE.woodDark }), { x: -2.8, y: yp, z: hallFront }));
  g.add(place(door({ w: 1.3, h: 2.6, color: PALETTE.woodDark }), { x: 2.8, y: yp, z: hallFront }));

  // rear service door with a few steps down from the podium
  g.add(place(door({ w: 1.4, h: 2.6, color: PALETTE.woodDark }), { y: yp, z: hallZ - hallD / 2, ry: 180 }));
  g.add(place(stairs({ w: 2, h: plinthH, d: 0.6, steps: 4, material: PLINTH }), { y: y0, z: hallZ - hallD / 2 - 0.9, ry: 180 }));

  // wide front steps (rise towards -z) with stone cheek walls
  const stepD = 2.6, stepW = 11;
  const stepZ = hallFront + porD + stepD / 2;
  g.add(place(stairs({ w: stepW, h: plinthH, d: stepD, steps: 6, material: mat(PALETTE.offWhite) }), { y: y0, z: stepZ }));
  for (const sx of [-1, 1]) {
    g.add(place(box(0.6, plinthH + 0.4, stepD, PLINTH), { x: sx * (stepW / 2 + 0.3), y: y0, z: stepZ }));
    g.add(place(sphere(0.35, STONE, 8), { x: sx * (stepW / 2 + 0.3), y: y0 + plinthH + 0.4, z: stepZ + stepD / 2 - 0.4 }));
  }

  // --- dome ---------------------------------------------------------------
  const domeZ = hallZ;
  // square attic
  g.add(place(box(9, 1.6, 7.5, STONE), { y: roofY, z: domeZ }));
  g.add(place(box(9.3, 0.25, 7.8, TRIM), { y: roofY + 1.6, z: domeZ }));
  const drumY = roofY + 1.85;
  const drumR = 3.4, drumH = 3.6;
  // drum: windowed core inside a ring of columns
  g.add(place(cylinder(drumR + 0.9, drumR + 0.9, 0.4, TRIM, 24), { y: drumY, z: domeZ }));
  g.add(place(facadeCylinder({ radius: drumR, h: drumH, floorHeight: drumH, segments: 24, style: 'punched', wall: PALETTE.offWhite, frame: PALETTE.white, glass: PALETTE.window, windowW: 0.45, windowH: 0.7, bay: 2.2, lit: 0.2, seed: 7, roof: PALETTE.offWhite }), { y: drumY + 0.4, z: domeZ }));
  g.add(place(colonnadeRing(16, drumR + 0.55, drumH, 0.2), { y: drumY + 0.4, z: domeZ }));
  g.add(place(cylinder(drumR + 0.85, drumR + 0.85, 0.55, TRIM, 24), { y: drumY + 0.4 + drumH, z: domeZ }));
  const domeY = drumY + 0.95 + drumH;
  g.add(place(cylinder(drumR + 0.3, drumR + 0.3, 0.6, STONE, 24), { y: domeY, z: domeZ }));
  // copper dome with ribs
  const domeR = drumR + 0.25, domeH = 4.2;
  g.add(place(dome({ radius: domeR, height: domeH, material: COPPER, segments: 32 }), { y: domeY + 0.6, z: domeZ }));
  const ribM = mat(shade(PALETTE.roofGreen, -0.18));
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const pts = [];
    for (let k = 0; k <= 8; k++) {
      const t = (k / 8) * (Math.PI / 2);
      const rr = Math.cos(t) * (domeR + 0.04), yy = Math.sin(t) * domeH;
      pts.push(new THREE.Vector3(Math.cos(a) * rr, yy, Math.sin(a) * rr));
    }
    for (let k = 0; k < 7; k++) {
      const p = pts[k], q = pts[k + 1];
      const len = p.distanceTo(q);
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.14, len, 0.14), ribM);
      rib.position.copy(p).add(q).multiplyScalar(0.5);
      rib.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), q.clone().sub(p).normalize());
      g.add(place(group(rib), { y: domeY + 0.6, z: domeZ }));
    }
  }
  // lantern
  const lanY = domeY + 0.6 + domeH - 0.3;
  g.add(place(cylinder(1.0, 1.0, 0.3, TRIM, 12), { y: lanY, z: domeZ }));
  g.add(place(cylinder(0.75, 0.75, 1.4, mat(PALETTE.window), 12), { y: lanY + 0.3, z: domeZ }));
  g.add(place(colonnadeRing(8, 0.85, 1.4, 0.09), { y: lanY + 0.3, z: domeZ }));
  g.add(place(cylinder(1.0, 1.0, 0.25, TRIM, 12), { y: lanY + 1.7, z: domeZ }));
  g.add(place(dome({ radius: 0.9, height: 0.8, material: COPPER, segments: 16 }), { y: lanY + 1.95, z: domeZ }));
  g.add(place(cylinder(0.06, 0.08, 0.9, GOLD, 6), { y: lanY + 2.7, z: domeZ }));
  g.add(place(sphere(0.2, GOLD, 8), { y: lanY + 3.5, z: domeZ }));

  // glazed skylights on the flat roof either side of the dome
  for (const sx of [-1, 1]) {
    g.add(place(box(2.2, 0.35, 5, TRIM), { x: sx * 5.9, y: roofY, z: hallZ }));
    g.add(place(gableRoof({ w: 1.8, d: 4.6, h: 0.7, overhang: 0.05, ridge: 'z', material: mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 }), gableMaterial: TRIM }), { x: sx * 5.9, y: roofY + 0.35, z: hallZ }));
  }

  // flagpole on the roof behind the dome
  g.add(place(flag({ h: 4, color: PALETTE.red, color2: PALETTE.white }), { x: 0, y: roofY, z: hallZ - hallD / 2 + 0.7 }));

  // --- grounds ------------------------------------------------------------
  // front plaza with paths
  const plazaZ0 = stepZ + stepD / 2;
  g.add(place(patch(20, 10 - plazaZ0, 'paved'), { y: y0, z: (plazaZ0 + 10) / 2 }));
  g.add(place(patch(stepW + 1.4, 0.6, 'cobbles'), { y: y0, z: plazaZ0 + 0.3 }));
  // side paths
  for (const sx of [-1, 1]) g.add(place(patch(1.6, 17 - (10 - plazaZ0), 'paved'), { x: sx * 9.0, y: y0, z: plazaZ0 - (17 - (10 - plazaZ0)) / 2 }));

  // fountain basins either side of the plaza
  for (const sx of [-1, 1]) {
    const fx = sx * 7.6, fz = plazaZ0 + 1.1;
    g.add(place(cylinder(1.25, 1.35, 0.45, STONE, 16), { x: fx, y: y0, z: fz }));
    g.add(place(cylinder(1.05, 1.05, 0.06, water(), 16), { x: fx, y: y0 + 0.42, z: fz }));
    g.add(place(cylinder(0.15, 0.2, 0.9, STONE, 8), { x: fx, y: y0 + 0.45, z: fz }));
    g.add(place(cylinder(0.45, 0.2, 0.15, STONE, 10), { x: fx, y: y0 + 1.35, z: fz }));
    g.add(place(cone(0.3, 0.6, water(PALETTE.water), 8), { x: fx, y: y0 + 1.5, z: fz }));
  }

  // flagpoles framing the steps
  for (const sx of [-1, 1]) {
    g.add(place(cylinder(0.3, 0.35, 0.3, PLINTH, 8), { x: sx * 4.3, y: y0, z: 9.0 }));
    g.add(place(flag({ h: 7, color: sx < 0 ? PALETTE.blue : PALETTE.red, color2: PALETTE.white }), { x: sx * 4.3, y: y0 + 0.3, z: 9.0, ry: sx < 0 ? 0 : 180 }));
  }

  // lamps and benches on the plaza
  for (const sx of [-1, 1]) {
    g.add(place(streetLamp({ h: 4 }), { x: sx * 6.6, y: y0, z: 9.2, ry: sx > 0 ? 180 : 0 }));
    g.add(place(bench({ w: 1.6 }), { x: sx * 2.0, y: y0, z: 9.3, ry: 180 }));
  }

  // side lawns: clipped hedges, conifers and round trees
  for (const sx of [-1, 1]) {
    g.add(place(hedge({ w: 13, h: 0.9, d: 0.6, color: PALETTE.foliageDark }), { x: sx * 9.65, y: y0, z: -3.0, ry: 90 }));
    for (const [z, k] of [[-0.5, 1], [-6, 2]]) {
      g.add(place(tree({ kind: 'cone', h: 4.5, seed: 50 + k + (sx > 0 ? 10 : 0) }), { x: sx * 8.85, y: y0, z }));
    }
    g.add(place(tree({ kind: 'round', h: 5.2, seed: 70 + sx }), { x: sx * 8.2, y: y0, z: -8.3 }));
    g.add(place(tree({ kind: 'bush', h: 1.1, seed: 80 + sx }), { x: sx * 7.0, y: y0, z: 3.0 }));
    g.add(place(tree({ kind: 'bush', h: 1.0, seed: 82 + sx }), { x: sx * 5.6, y: y0, z: 3.2 }));
  }
  // back hedge with a gap for the rear service door
  for (const sx of [-1, 1]) {
    g.add(place(hedge({ w: 7.6, h: 0.9, d: 0.6 }), { x: sx * 5.4, y: y0, z: -9.65 }));
    g.add(place(tree({ kind: 'bush', h: 0.9, seed: 90 + sx }), { x: sx * 2.6, y: y0, z: -9.4 }));
  }
  g.add(place(patch(2.4, 1.0, 'paved'), { y: y0, z: -9.5 }));
  return g;
}

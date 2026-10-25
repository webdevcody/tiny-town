// Building blocks. Every function returns a THREE.Object3D whose origin is the
// centre of its base (y = 0), so you build by placing parts with place():
//
//   const g = group(
//     place(facadeBlock({ w: 8, d: 8, floors: 3 }), { x: 0 }),
//     place(hipRoof({ w: 8, d: 8, h: 3 }), { y: floors(3) }),
//   );
//
// Sizes are in metres (1 tile = TILE = 10 m, 1 storey = FLOOR = 3 m).

import * as THREE from 'three';
import { TILE, FLOOR, LOT_HEIGHT } from './units.js';
import { PALETTE, SWATCHES } from './palette.js';
import { rng as makeRng } from './random.js';
import { boxGeometry, cylinderGeometry, ShapeBuilder, extrudeGeometry, polygonArea } from './geometry.js';
import { mat, glass, metal, emissive, water, surface, field as fieldMat, facade, textured, MAT } from './materials.js';
import { signTexture, shade } from './textures.js';

// ---------------------------------------------------------------------------
// basics

function toMat(m, fallback = PALETTE.white) {
  if (m == null) return mat(fallback);
  if (typeof m === 'string') return mat(m);
  return m;
}

/** Group several objects: group(a, b, c). Nulls are skipped. */
export function group(...children) {
  const g = new THREE.Group();
  for (const c of children.flat()) if (c) g.add(c);
  return g;
}

/**
 * Position / rotate / scale an object and return it.
 *   place(obj, { x, y, z, ry, rx, rz, s })   rotations in DEGREES, s = uniform scale or [sx,sy,sz]
 */
export function place(obj, { x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s = null } = {}) {
  obj.position.set(x, y, z);
  obj.rotation.set(THREE.MathUtils.degToRad(rx), THREE.MathUtils.degToRad(ry), THREE.MathUtils.degToRad(rz));
  if (s != null) Array.isArray(s) ? obj.scale.set(...s) : obj.scale.setScalar(s);
  return obj;
}

/** Box with base at y=0. material may be a Material or a colour string. */
export function box(w, h, d, material) {
  return new THREE.Mesh(boxGeometry(w, h, d), toMat(material));
}

/**
 * Box with different materials per face.
 *   boxFaces(w, h, d, { sides, top, bottom, front, back, left, right })
 */
export function boxFaces(w, h, d, { sides, top, bottom, front, back, left, right } = {}) {
  const s = toMat(sides);
  const mats = [toMat(right ?? s), toMat(left ?? s), toMat(top ?? s), toMat(bottom ?? top ?? s), toMat(front ?? s), toMat(back ?? s)];
  return new THREE.Mesh(boxGeometry(w, h, d), mats);
}

/** Cylinder / truncated cone with base at y=0. */
export function cylinder(rTop, rBottom, h, material, segments = 16) {
  return new THREE.Mesh(cylinderGeometry(rTop, rBottom, h, segments), toMat(material));
}

/** Cone with base at y=0. */
export function cone(r, h, material, segments = 12) {
  return new THREE.Mesh(cylinderGeometry(0.0001, r, h, segments), toMat(material));
}

/** Sphere resting on y=0 (centre at y=r). */
export function sphere(r, material, segments = 12) {
  const g = new THREE.SphereGeometry(r, segments, Math.max(6, Math.round(segments * 0.66)));
  g.translate(0, r, 0);
  return new THREE.Mesh(g, toMat(material));
}

/** Vertical extrusion of a polygon [[x,z],...]. Groups: walls, top, bottom. */
export function extrude(points, h, material, topMaterial) {
  const m = toMat(material);
  return new THREE.Mesh(extrudeGeometry(points, h), [m, toMat(topMaterial ?? m), m]);
}

/**
 * Tapered block / frustum: base w x d, top topW x topD, height h.
 * Good for plinths, mansard roofs, tapering towers, cooling-tower-ish shapes.
 */
export function taperedBlock({ w, d, h, topW = w * 0.6, topD = d * 0.6, material, topMaterial }) {
  const b = new ShapeBuilder();
  const W = w / 2, D = d / 2, tw = topW / 2, td = topD / 2;
  b.quad([-W, 0, D], [W, 0, D], [tw, h, td], [-tw, h, td], 0); // front
  b.quad([W, 0, -D], [-W, 0, -D], [-tw, h, -td], [tw, h, -td], 0); // back
  b.quad([W, 0, D], [W, 0, -D], [tw, h, -td], [tw, h, td], 0); // right
  b.quad([-W, 0, -D], [-W, 0, D], [-tw, h, td], [-tw, h, -td], 0); // left
  if (topW > 0.001 || topD > 0.001) b.quad([-tw, h, td], [tw, h, td], [tw, h, -td], [-tw, h, -td], 1);
  b.quad([-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D], 2);
  const m = toMat(material, PALETTE.concrete);
  return new THREE.Mesh(b.build(), [m, toMat(topMaterial ?? m), m]);
}

// ---------------------------------------------------------------------------
// facades (window grids)

function facadeOpts(o) {
  const keys = ['style', 'wall', 'glass', 'frame', 'lit', 'windowW', 'windowH', 'shutters', 'seed', 'cols', 'rows'];
  const out = {};
  for (const k of keys) if (o[k] !== undefined) out[k] = o[k];
  return out;
}

function scaleFaceUV(geom, ranges, faceWidths, bay, nFloors, cols, rows) {
  // ranges: list of [startVertex, count, faceIndex]
  const uv = geom.attributes.uv;
  for (const [start, count, fi] of ranges) {
    const nb = Math.max(1, Math.round(faceWidths[fi] / bay));
    for (let i = start; i < start + count; i++) {
      uv.setXY(i, (uv.getX(i) * nb) / cols, (uv.getY(i) * nFloors) / rows);
    }
  }
}

/**
 * A box-shaped block of storeys with a window-grid facade on all four sides.
 *
 *   facadeBlock({
 *     w, d,                 footprint in metres
 *     floors = 3,           number of storeys   (or h = metres)
 *     floorHeight = FLOOR,
 *     bay = 3,              approx. window spacing in metres (rounded so windows fit exactly)
 *     style = 'punched',    'punched'|'ribbon'|'curtain'|'grid'|'brick'|'industrial'|'shop'|'plain'
 *     wall, glass, frame, lit, windowW, windowH, shutters, seed   -> see facadeTexture()
 *     roof = PALETTE.concreteDark,  colour/material of the top face
 *     blank = [],           sides drawn as plain wall: any of 'front','back','left','right'
 *   })
 */
export function facadeBlock(o) {
  const { w, d, floorHeight = FLOOR, bay = 3, roof = PALETTE.concreteDark, blank = [] } = o;
  const nFloors = o.h != null ? o.h / floorHeight : o.floors ?? 3;
  const h = nFloors * floorHeight;
  const fm = facade(facadeOpts(o));
  const { cols, rows } = fm.userData;
  const geom = boxGeometry(w, h, d);
  // restore 0..1 uvs then scale to whole bays / floors
  const uv = geom.attributes.uv;
  const sizes = [[d, h], [d, h], [w, d], [w, d], [w, h], [w, h]];
  for (let i = 0; i < uv.count; i++) {
    const [su, sv] = sizes[Math.floor(i / 4)];
    uv.setXY(i, uv.getX(i) / su, uv.getY(i) / sv);
  }
  scaleFaceUV(geom, [[0, 4, 0], [4, 4, 1], [16, 4, 4], [20, 4, 5]], [d, d, w, w, w, w], bay, nFloors, cols, rows);
  // top/bottom back to metres
  for (let i = 8; i < 16; i++) uv.setXY(i, uv.getX(i) * w, uv.getY(i) * d);
  const plain = facade({ ...facadeOpts(o), style: 'plain' });
  const side = (name) => (blank.includes(name) ? plain : fm);
  const roofM = toMat(roof);
  const mesh = new THREE.Mesh(geom, [side('right'), side('left'), roofM, roofM, side('front'), side('back')]);
  mesh.userData.height = h;
  return mesh;
}

/**
 * Round tower with a window-grid facade.
 *   facadeCylinder({ radius, floors | h, floorHeight, bay, segments = 24, style, wall, glass, ..., roof })
 * radiusTop optional for a slight taper.
 */
export function facadeCylinder(o) {
  const { radius, radiusTop = radius, floorHeight = FLOOR, bay = 3, segments = 24, roof = PALETTE.concreteDark } = o;
  const nFloors = o.h != null ? o.h / floorHeight : o.floors ?? 3;
  const h = nFloors * floorHeight;
  const fm = facade(facadeOpts(o));
  const { cols, rows } = fm.userData;
  const g = new THREE.CylinderGeometry(radiusTop, radius, h, segments, 1);
  g.translate(0, h / 2, 0);
  const nb = Math.max(1, Math.round((Math.PI * (radius + radiusTop)) / bay));
  const uv = g.attributes.uv;
  const sideCount = (segments + 1) * 2;
  for (let i = 0; i < sideCount; i++) uv.setXY(i, (uv.getX(i) * nb) / cols, (uv.getY(i) * nFloors) / rows);
  const roofM = toMat(roof);
  const mesh = new THREE.Mesh(g, [fm, roofM, roofM]);
  mesh.userData.height = h;
  return mesh;
}

/**
 * Any polygon footprint [[x,z], ...] extruded into storeys with a window-grid facade.
 * Great for L-shapes, octagons, wedge towers, setback tiers.
 *   prismBlock({ points, floors | h, floorHeight, bay, style, wall, glass, ..., roof })
 */
export function prismBlock(o) {
  const { points, floorHeight = FLOOR, bay = 3, roof = PALETTE.concreteDark } = o;
  const nFloors = o.h != null ? o.h / floorHeight : o.floors ?? 3;
  const h = nFloors * floorHeight;
  const fm = facade(facadeOpts(o));
  const { cols, rows } = fm.userData;
  const geom = extrudeGeometry(points, h, {
    wallUV: (len) => [Math.max(1, Math.round(len / bay)) / cols, nFloors / rows],
  });
  // top/bottom: planar uvs in metres
  const pos = geom.attributes.position;
  const uv = geom.attributes.uv;
  const wallCount = geom.groups[0].count;
  for (let i = wallCount; i < pos.count; i++) uv.setXY(i, pos.getX(i), pos.getZ(i));
  const roofM = toMat(roof);
  const mesh = new THREE.Mesh(geom, [fm, roofM, roofM]);
  mesh.userData.height = h;
  return mesh;
}

/**
 * Stack of facade blocks: optional distinct ground floor + upper floors.
 *   tower({ w, d, floors, ground: { style: 'shop', wall: ... }, ...upperFacadeOpts })
 * Returns a Group; group.userData.height = total height.
 */
export function tower(o) {
  const { ground = null, floors: n = 4, floorHeight = FLOOR } = o;
  const g = new THREE.Group();
  let y = 0;
  if (ground) {
    const gh = ground.floorHeight ?? floorHeight * 1.2;
    const gb = facadeBlock({ ...o, ...ground, h: undefined, floors: 1, floorHeight: gh });
    g.add(gb);
    y = gh;
  }
  const upper = facadeBlock({ ...o, h: undefined, floors: ground ? n - 1 : n });
  upper.position.y = y;
  g.add(upper);
  g.userData.height = y + upper.userData.height;
  return g;
}

// ---------------------------------------------------------------------------
// roofs (base at y=0 = top of the walls; w/d = wall footprint)

/**
 * Pitched roof with two slopes.
 *   gableRoof({ w, d, h, overhang = 0.4, ridge = 'x', material, gableMaterial })
 * ridge 'x' = ridge runs along X (gables face left/right); 'z' = gables face front/back.
 * gableMaterial: material/colour of the triangular ends (usually the wall).
 */
export function gableRoof({ w, d, h, overhang = 0.4, ridge = 'x', material, gableMaterial }) {
  const roofM = material ?? surface('roofTiles', PALETTE.roofRed, { size: 2 });
  const gm = toMat(gableMaterial ?? PALETTE.cream);
  const b = new ShapeBuilder();
  // build with ridge along x, rotate later if needed
  const L = (ridge === 'x' ? w : d) / 2;
  const S = (ridge === 'x' ? d : w) / 2;
  const Lo = L + overhang, So = S + overhang;
  const drop = (overhang * h) / S; // keep the slope through the overhang
  // front slope (+z)
  b.quad([-Lo, -drop, So], [Lo, -drop, So], [Lo, h, 0], [-Lo, h, 0], 0);
  // back slope
  b.quad([Lo, -drop, -So], [-Lo, -drop, -So], [-Lo, h, 0], [Lo, h, 0], 0);
  // underside
  b.quad([-Lo, -drop, So], [-Lo, h, 0], [Lo, h, 0], [Lo, -drop, So], 2);
  b.quad([Lo, -drop, -So], [Lo, h, 0], [-Lo, h, 0], [-Lo, -drop, -So], 2);
  // gables (at the wall plane)
  b.tri([L, 0, S], [L, 0, -S], [L, h, 0], 1);
  b.tri([-L, 0, -S], [-L, 0, S], [-L, h, 0], 1);
  const mesh = new THREE.Mesh(b.build(), [toMat(roofM), gm, toMat(PALETTE.woodDark)]);
  if (ridge === 'z') mesh.rotation.y = Math.PI / 2;
  return ridge === 'z' ? group(mesh) : mesh;
}

/**
 * Hipped roof (slopes on all four sides). Becomes a pyramid when w === d.
 *   hipRoof({ w, d, h, overhang = 0.4, material })
 */
export function hipRoof({ w, d, h, overhang = 0.4, material }) {
  const roofM = toMat(material ?? surface('roofTiles', PALETTE.roofRed, { size: 2 }));
  const W = w / 2 + overhang, D = d / 2 + overhang;
  const inset = Math.min(W, D);
  const rx = Math.max(0, W - inset), rz = Math.max(0, D - inset);
  const b = new ShapeBuilder();
  b.quad([-W, 0, D], [W, 0, D], [rx, h, rz], [-rx, h, rz], 0);
  b.quad([W, 0, -D], [-W, 0, -D], [-rx, h, -rz], [rx, h, -rz], 0);
  b.quad([W, 0, D], [W, 0, -D], [rx, h, -rz], [rx, h, rz], 0);
  b.quad([-W, 0, -D], [-W, 0, D], [-rx, h, rz], [-rx, h, -rz], 0);
  b.quad([-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D], 1);
  return new THREE.Mesh(b.build(), [roofM, toMat(PALETTE.woodDark)]);
}

/** Pyramid roof / spire base. */
export function pyramidRoof({ w, d = w, h, overhang = 0.3, material }) {
  const roofM = toMat(material ?? PALETTE.roofSlate);
  const W = w / 2 + overhang, D = d / 2 + overhang;
  const b = new ShapeBuilder();
  const top = [0, h, 0];
  b.tri([-W, 0, D], [W, 0, D], top, 0);
  b.tri([W, 0, D], [W, 0, -D], top, 0);
  b.tri([W, 0, -D], [-W, 0, -D], top, 0);
  b.tri([-W, 0, -D], [-W, 0, D], top, 0);
  b.quad([-W, 0, -D], [W, 0, -D], [W, 0, D], [-W, 0, D], 0);
  return new THREE.Mesh(b.build(), roofM);
}

/**
 * Single-slope roof, high at the back (-z), low at the front (+z).
 *   shedRoof({ w, d, h, overhang = 0.3, material, wallMaterial })
 */
export function shedRoof({ w, d, h, overhang = 0.3, material, wallMaterial }) {
  const roofM = toMat(material ?? PALETTE.roofGrey);
  const wm = toMat(wallMaterial ?? PALETTE.cream);
  const W = w / 2, D = d / 2;
  const b = new ShapeBuilder();
  b.quad([-W - overhang, 0, D + overhang], [W + overhang, 0, D + overhang], [W + overhang, h, -D - overhang], [-W - overhang, h, -D - overhang], 0);
  b.quad([-W - overhang, 0, D + overhang], [-W - overhang, h, -D - overhang], [W + overhang, h, -D - overhang], [W + overhang, 0, D + overhang], 0);
  // side wall infill
  const hb = (h * (2 * D + overhang)) / (2 * D + 2 * overhang);
  const hf = (h * overhang) / (2 * D + 2 * overhang);
  b.quad([W, 0, D], [W, 0, -D], [W, hb, -D], [W, hf, D], 1);
  b.quad([-W, 0, D], [W, 0, D], [W, hf, D], [-W, hf, D], 1);
  b.quad([-W, 0, -D], [-W, 0, D], [-W, hf, D], [-W, hb, -D], 1);
  b.quad([W, 0, -D], [-W, 0, -D], [-W, hb, -D], [W, hb, -D], 1);
  return new THREE.Mesh(b.build(), [roofM, wm]);
}

/** Mansard roof: steep lower slopes and a flat top. */
export function mansardRoof({ w, d, h, inset = 1.2, overhang = 0.2, material, topMaterial }) {
  return taperedBlock({
    w: w + overhang * 2,
    d: d + overhang * 2,
    h,
    topW: Math.max(0.1, w - inset * 2),
    topD: Math.max(0.1, d - inset * 2),
    material: material ?? surface('shingles', PALETTE.roofSlate, { size: 2 }),
    topMaterial: topMaterial ?? PALETTE.roofGrey,
  });
}

/**
 * Dome sitting on y=0.
 *   dome({ radius, height = radius, material, segments = 24, drum = 0, drumMaterial })
 * drum = height of a cylindrical drum below the dome.
 */
export function dome({ radius, height = radius, material, segments = 24, drum = 0, drumMaterial }) {
  const g = new THREE.Group();
  if (drum > 0) g.add(cylinder(radius, radius, drum, drumMaterial ?? PALETTE.stone, segments));
  const geo = new THREE.SphereGeometry(radius, segments, Math.round(segments / 2), 0, Math.PI * 2, 0, Math.PI / 2);
  geo.scale(1, height / radius, 1);
  const m = new THREE.Mesh(geo, toMat(material ?? mat(PALETTE.roofGreen, { roughness: 0.5, metalness: 0.2, flatShading: false })));
  m.position.y = drum;
  g.add(m);
  return g;
}

/**
 * Half-cylinder (barrel vault) roof, curved along `axis` ('x' = vault runs along X).
 *   barrelRoof({ w, d, h, axis = 'x', material, endMaterial, segments = 12 })
 */
export function barrelRoof({ w, d, h, axis = 'x', material, endMaterial, segments = 12 }) {
  const len = axis === 'x' ? w : d;
  const span = axis === 'x' ? d : w;
  const geo = new THREE.CylinderGeometry(span / 2, span / 2, len, segments * 2, 1, false, 0, Math.PI);
  // cylinder axis = y; rotate so the axis lies along x and the half shell faces up
  geo.rotateZ(Math.PI / 2); // axis -> x, half shell -> +y
  geo.scale(1, h / (span / 2), 1);
  if (axis === 'z') geo.rotateY(Math.PI / 2);
  const m = new THREE.Mesh(geo, [toMat(material ?? MAT.corrugated), toMat(endMaterial ?? PALETTE.concrete), toMat(endMaterial ?? PALETTE.concrete)]);
  return m;
}

/**
 * Factory sawtooth roof. Teeth run along X; vertical glazed faces point north (-z).
 *   sawtoothRoof({ w, d, h = 2.5, teeth = 4, material, glassMaterial })
 */
export function sawtoothRoof({ w, d, h = 2.5, teeth = 4, material, glassMaterial }) {
  const b = new ShapeBuilder();
  const W = w / 2;
  const step = d / teeth;
  for (let i = 0; i < teeth; i++) {
    const z0 = d / 2 - i * step; // front edge of tooth (low)
    const z1 = z0 - step; // back edge (high, glazed)
    b.quad([-W, 0, z0], [W, 0, z0], [W, h, z1], [-W, h, z1], 0);
    b.quad([W, 0, z1], [-W, 0, z1], [-W, h, z1], [W, h, z1], 1);
    b.tri([W, 0, z0], [W, 0, z1], [W, h, z1], 2);
    b.tri([-W, 0, z1], [-W, 0, z0], [-W, h, z1], 2);
  }
  return new THREE.Mesh(b.build(), [
    toMat(material ?? surface('corrugated', PALETTE.roofGrey, { size: 2 })),
    toMat(glassMaterial ?? glass(PALETTE.glassSky)),
    toMat(PALETTE.concrete),
  ]);
}

/** Low wall around the edge of a flat roof. Place at the roof height. */
export function parapet({ w, d, h = 0.8, t = 0.3, material }) {
  const m = toMat(material ?? PALETTE.concrete);
  return group(
    place(box(w, h, t, m), { z: d / 2 - t / 2 }),
    place(box(w, h, t, m), { z: -d / 2 + t / 2 }),
    place(box(t, h, d - 2 * t, m), { x: w / 2 - t / 2 }),
    place(box(t, h, d - 2 * t, m), { x: -w / 2 + t / 2 })
  );
}

/** Scatter of AC units, vents and a stair hut for flat roofs (inside w x d). */
export function rooftopUnits({ w, d, count = 4, seed = 1, material }) {
  const r = makeRng(seed);
  const m = toMat(material ?? PALETTE.lightGrey);
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const uw = r.range(1, 2.4), ud = r.range(1, 2.4), uh = r.range(0.6, 1.4);
    const x = r.range(-w / 2 + uw / 2 + 0.4, w / 2 - uw / 2 - 0.4);
    const z = r.range(-d / 2 + ud / 2 + 0.4, d / 2 - ud / 2 - 0.4);
    const unit = place(box(uw, uh, ud, m), { x, z });
    g.add(unit);
    if (r.chance(0.5)) g.add(place(cylinder(uw * 0.25, uw * 0.25, 0.15, PALETTE.darkGrey, 10), { x, y: uh, z }));
  }
  return g;
}

/** Helipad marking on a flat roof. */
export function helipad({ size = 8 }) {
  const tex = signTexture('H', { bg: '#3a3d42', fg: '#ffffff', width: 128, height: 128, border: PALETTE.yellow });
  return box(size, 0.12, size, [mat('#3a3d42'), mat('#3a3d42'), textured(tex), mat('#3a3d42'), mat('#3a3d42'), mat('#3a3d42')]);
}

// ---------------------------------------------------------------------------
// structures & details

/** Brick chimney with a cap. */
export function chimney({ w = 0.8, d = w, h = 2, material, capMaterial } = {}) {
  return group(
    box(w, h, d, material ?? surface('brick', PALETTE.brickDark, { size: 1 })),
    place(box(w + 0.2, 0.2, d + 0.2, toMat(capMaterial ?? PALETTE.stoneDark)), { y: h })
  );
}

/**
 * Industrial smokestack (tapered) with coloured bands near the top.
 *   smokestack({ radius = 1.4, topRadius = 0.9, h = 24, color, bandColor, bands = 2 })
 */
export function smokestack({ radius = 1.4, topRadius = 0.9, h = 24, color = PALETTE.concrete, bandColor = PALETTE.red, bands = 2, segments = 14 } = {}) {
  const g = new THREE.Group();
  const lerpR = (y) => radius + (topRadius - radius) * (y / h);
  const bandH = h * 0.06;
  const bodyH = h - bands * 2 * bandH;
  g.add(cylinder(lerpR(bodyH), radius, bodyH, color, segments));
  let y = bodyH;
  for (let i = 0; i < bands * 2; i++) {
    const c = i % 2 === 0 ? bandColor : color;
    g.add(place(cylinder(lerpR(y + bandH), lerpR(y), bandH, c, segments), { y }));
    y += bandH;
  }
  g.add(place(cylinder(topRadius * 0.8, topRadius * 0.8, 0.1, PALETTE.black, segments), { y: h }));
  return g;
}

/**
 * Storage tank.
 *   tank({ radius = 3, h = 6, material, roof: 'dome'|'cone'|'flat', legs = 0, legHeight })
 * legs > 0 puts the tank on that many legs (water tower).
 */
export function tank({ radius = 3, h = 6, material, roof = 'dome', legs = 0, legHeight = 8, segments = 20 } = {}) {
  const m = toMat(material ?? metal(PALETTE.steelLight, { roughness: 0.5 }));
  const g = new THREE.Group();
  const base = legs > 0 ? legHeight : 0;
  g.add(place(cylinder(radius, radius, h, m, segments), { y: base }));
  if (roof === 'dome') g.add(place(dome({ radius, height: radius * 0.35, material: m, segments }), { y: base + h }));
  else if (roof === 'cone') g.add(place(cone(radius * 1.02, radius * 0.5, m, segments), { y: base + h }));
  if (legs > 0) {
    const lm = metal(PALETTE.steelDark);
    for (let i = 0; i < legs; i++) {
      const a = (i / legs) * Math.PI * 2;
      const lx = Math.cos(a) * radius * 0.8, lz = Math.sin(a) * radius * 0.8;
      g.add(place(cylinder(0.18, 0.22, legHeight, lm, 6), { x: lx, z: lz }));
    }
    g.add(place(cylinder(0.3, 0.3, legHeight, lm, 8), { y: 0 }));
  }
  return g;
}

/** Spherical gas tank on legs. */
export function sphereTank({ radius = 4, legs = 8, material } = {}) {
  const m = toMat(material ?? mat(PALETTE.white, { roughness: 0.5, flatShading: false }));
  const g = new THREE.Group();
  const lift = radius * 0.6;
  g.add(place(sphere(radius, m, 20), { y: lift }));
  const lm = metal(PALETTE.steelDark);
  for (let i = 0; i < legs; i++) {
    const a = (i / legs) * Math.PI * 2;
    g.add(place(cylinder(0.2, 0.2, lift + radius, lm, 6), { x: Math.cos(a) * radius * 0.92, z: Math.sin(a) * radius * 0.92 }));
  }
  return g;
}

/** Farm / cement silo: cylinder with a domed or conical cap. */
export function silo({ radius = 2.5, h = 12, material, roofMaterial, roof = 'dome' } = {}) {
  const m = toMat(material ?? surface('corrugated', PALETTE.steelLight, { size: 2, metalness: 0.3, roughness: 0.6 }));
  const rm = toMat(roofMaterial ?? metal(PALETTE.steel));
  const g = group(cylinder(radius, radius, h, m, 18));
  if (roof === 'dome') g.add(place(dome({ radius, height: radius * 0.6, material: rm, segments: 18 }), { y: h }));
  else g.add(place(cone(radius * 1.05, radius * 0.8, rm, 18), { y: h }));
  return g;
}

/**
 * Row of columns along X (or Z), centred.
 *   columns({ count, length, radius = 0.35, h, axis = 'x', material, square = false })
 */
export function columns({ count, length, radius = 0.35, h, axis = 'x', material, square = false }) {
  const m = toMat(material ?? PALETTE.white);
  const g = new THREE.Group();
  for (let i = 0; i < count; i++) {
    const t = count === 1 ? 0 : -length / 2 + (length * i) / (count - 1);
    const c = square ? box(radius * 2, h, radius * 2, m) : cylinder(radius, radius, h, m, 10);
    if (axis === 'x') c.position.x = t;
    else c.position.z = t;
    g.add(c);
  }
  return g;
}

/**
 * Sloped awning that sticks out towards +z. Origin = back top edge (fix it to the wall).
 *   awning({ w, depth = 1.4, drop = 0.5, color = red, color2 = white })
 */
export function awning({ w, depth = 1.4, drop = 0.5, color = PALETTE.red, color2 = PALETTE.white }) {
  const m = surface('stripes', color, { color2, size: 1.2 });
  const b = new ShapeBuilder();
  const W = w / 2;
  b.quad([-W, -drop, depth], [W, -drop, depth], [W, 0, 0], [-W, 0, 0], 0);
  b.quad([-W, -drop, depth], [-W, 0, 0], [W, 0, 0], [W, -drop, depth], 0);
  b.quad([-W, -drop - 0.3, depth], [W, -drop - 0.3, depth], [W, -drop, depth], [-W, -drop, depth], 0);
  return new THREE.Mesh(b.build(), m);
}

/** Door slab (0.12 thick), sticks out towards +z from z=0. */
export function door({ w = 1.1, h = 2.2, color = PALETTE.woodDark, frame = PALETTE.frame } = {}) {
  return group(
    place(box(w + 0.2, h + 0.1, 0.08, frame), { z: 0.04 }),
    place(box(w, h, 0.12, color), { z: 0.06 })
  );
}

/** Flat window panel (0.08 thick) on a wall; sticks out towards +z. */
export function windowPanel({ w = 1.2, h = 1.4, glassColor = PALETTE.window, frame = PALETTE.frame, lit = false } = {}) {
  return group(
    place(box(w + 0.2, h + 0.2, 0.06, frame), { z: 0.03 }),
    place(box(w, h, 0.1, lit ? emissive(PALETTE.windowLit, 0.5) : mat(glassColor, { roughness: 0.2, metalness: 0.4 })), { z: 0.05 })
  );
}

/**
 * Sign board with text on the front (+z) face (and back if double).
 *   sign({ text, w = 4, h = 1, bg, fg, depth = 0.2, double = false })
 */
export function sign({ text, w = 4, h = 1, bg = PALETTE.navy, fg = '#ffffff', depth = 0.2, double = false, border = null }) {
  const aspect = w / h;
  const tw = 256;
  const th = Math.max(16, Math.round(tw / aspect));
  const tex = signTexture(text, { bg, fg, width: tw, height: th, border });
  const face = textured(tex, { emissive: '#ffffff', emissiveIntensity: 0.15, emissiveMap: tex });
  const side = mat(bg);
  return box(w, h, depth, [side, side, side, side, face, double ? face : side]);
}

/** Billboard on two posts. */
export function billboard({ text = 'TINY TOWN', w = 6, h = 2.5, poleH = 4, bg = PALETTE.yellow, fg = PALETTE.black } = {}) {
  const pm = metal(PALETTE.steelDark);
  return group(
    place(box(0.25, poleH, 0.25, pm), { x: -w / 3 }),
    place(box(0.25, poleH, 0.25, pm), { x: w / 3 }),
    place(sign({ text, w, h, bg, fg, depth: 0.25, double: true }), { y: poleH })
  );
}

/** Thin mast with an optional red light on top. */
export function antenna({ h = 6, radius = 0.08, light = true, material } = {}) {
  const g = group(cylinder(radius * 0.5, radius, h, material ?? metal(PALETTE.steelLight), 6));
  if (light) g.add(place(sphere(0.18, emissive(PALETTE.red, 1.2), 8), { y: h - 0.1 }));
  return g;
}

/** Pointed spire (cone on a short octagonal base). */
export function spire({ radius = 1, h = 8, material, baseHeight = 0.6 } = {}) {
  const m = toMat(material ?? mat(PALETTE.roofGreen, { roughness: 0.5, metalness: 0.2 }));
  return group(cylinder(radius, radius, baseHeight, m, 8), place(cone(radius, h, m, 8), { y: baseHeight }));
}

/**
 * Lattice tower / pylon / crane mast: 4 legs with X-bracing.
 *   lattice({ w = 2, d = w, h = 20, topW = w, topD = d, segments = auto, thickness = 0.15, material })
 */
export function lattice({ w = 2, d = w, h = 20, topW = w, topD = d, segments, thickness = 0.15, material } = {}) {
  const m = toMat(material ?? metal(PALETTE.steelDark));
  const n = segments ?? Math.max(1, Math.round(h / Math.max(w, 1.5)));
  const g = new THREE.Group();
  const corner = (y, sx, sz) => {
    const t = y / h;
    return new THREE.Vector3((sx * (w + (topW - w) * t)) / 2, y, (sz * (d + (topD - d) * t)) / 2);
  };
  const signs = [[1, 1], [1, -1], [-1, -1], [-1, 1]];
  for (const [sx, sz] of signs) g.add(beam(corner(0, sx, sz), corner(h, sx, sz), thickness, m));
  for (let i = 0; i <= n; i++) {
    const y0 = (h * i) / n;
    for (let s = 0; s < 4; s++) {
      const [ax, az] = signs[s];
      const [bx, bz] = signs[(s + 1) % 4];
      g.add(beam(corner(y0, ax, az), corner(y0, bx, bz), thickness * 0.7, m));
      if (i < n) {
        const y1 = (h * (i + 1)) / n;
        g.add(beam(corner(y0, ax, az), corner(y1, bx, bz), thickness * 0.6, m));
        g.add(beam(corner(y0, bx, bz), corner(y1, ax, az), thickness * 0.6, m));
      }
    }
  }
  return g;
}

/**
 * Horizontal truss beam along X from x=0 to x=length (crane jib, bridge girder, gantry).
 *   truss({ length, w = 1.2, h = 1.2, segments = auto, thickness = 0.12, material })
 * Origin at the start of the truss, bottom chord at y = 0.
 */
export function truss({ length, w = 1.2, h = 1.2, segments, thickness = 0.12, material }) {
  const m = toMat(material ?? metal(PALETTE.yellow));
  const n = segments ?? Math.max(1, Math.round(length / h));
  const g = new THREE.Group();
  const P = (x, y, z) => new THREE.Vector3(x, y, z);
  const W = w / 2;
  for (const [y, z] of [[0, W], [0, -W], [h, W], [h, -W]]) g.add(beam(P(0, y, z), P(length, y, z), thickness, m));
  for (let i = 0; i <= n; i++) {
    const x = (length * i) / n;
    g.add(beam(P(x, 0, W), P(x, h, W), thickness * 0.7, m));
    g.add(beam(P(x, 0, -W), P(x, h, -W), thickness * 0.7, m));
    g.add(beam(P(x, h, W), P(x, h, -W), thickness * 0.7, m));
    if (i < n) {
      const x1 = (length * (i + 1)) / n;
      g.add(beam(P(x, 0, W), P(x1, h, W), thickness * 0.6, m));
      g.add(beam(P(x, 0, -W), P(x1, h, -W), thickness * 0.6, m));
    }
  }
  return g;
}

/** Square beam between two points (THREE.Vector3 or [x,y,z]). */
export function beam(from, to, thickness = 0.15, material) {
  const a = Array.isArray(from) ? new THREE.Vector3(...from) : from;
  const b = Array.isArray(to) ? new THREE.Vector3(...to) : to;
  const len = a.distanceTo(b);
  const geo = new THREE.BoxGeometry(thickness, len, thickness);
  const m = new THREE.Mesh(geo, toMat(material ?? metal(PALETTE.steelDark)));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
  return m;
}

/** Round pipe between two points. */
export function pipe(from, to, radius = 0.3, material) {
  const a = Array.isArray(from) ? new THREE.Vector3(...from) : from;
  const b = Array.isArray(to) ? new THREE.Vector3(...to) : to;
  const len = a.distanceTo(b);
  const geo = new THREE.CylinderGeometry(radius, radius, len, 10);
  const m = new THREE.Mesh(geo, toMat(material ?? metal(PALETTE.steel)));
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3().subVectors(b, a).normalize());
  return m;
}

/** Pipe following a polyline [[x,y,z], ...] with joint spheres. */
export function pipeRun(points, radius = 0.3, material) {
  const m = toMat(material ?? metal(PALETTE.steel));
  const g = new THREE.Group();
  for (let i = 0; i < points.length - 1; i++) g.add(pipe(points[i], points[i + 1], radius, m));
  for (let i = 1; i < points.length - 1; i++) {
    const s = new THREE.Mesh(new THREE.SphereGeometry(radius * 1.15, 10, 8), m);
    s.position.set(...points[i]);
    g.add(s);
  }
  return g;
}

/** Steps rising towards -z (walk up from the +z side). Centred on a w x d footprint. */
export function stairs({ w = 2, h = 1, d = 2, steps = 5, material } = {}) {
  const m = toMat(material ?? PALETTE.concrete);
  const g = new THREE.Group();
  for (let i = 0; i < steps; i++) {
    const sh = (h * (i + 1)) / steps;
    const sd = d * (1 - i / steps);
    g.add(place(box(w, sh, sd, m), { z: -d / 2 + sd / 2 }));
  }
  return g;
}

// ---------------------------------------------------------------------------
// ground & landscaping

const SURFACES = {
  grass: () => surface('grass', PALETTE.grass, { size: 4 }),
  paved: () => surface('paving', PALETTE.paving, { size: 4 }),
  concrete: () => surface('concrete', PALETTE.concrete, { size: 6 }),
  asphalt: () => surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 }),
  dirt: () => surface('gravel', PALETTE.dirt, { size: 4 }),
  sand: () => surface('gravel', PALETTE.sand, { size: 4 }),
  gravel: () => surface('gravel', PALETTE.gravel, { size: 3 }),
  cobbles: () => surface('cobbles', PALETTE.stone, { size: 2 }),
  water: () => water(),
};

/** Surface names accepted by lot(): grass paved concrete asphalt dirt sand gravel cobbles water */
export const LOT_SURFACES = Object.keys(SURFACES);

/**
 * The ground slab of a building's tile(s): exactly footprint * TILE, LOT_HEIGHT thick.
 *   lot([2, 1], 'paved')
 * Put everything else on top of it (y = LOT_HEIGHT).
 */
export function lot(footprint, surfaceName = 'grass') {
  const [fw, fd] = footprint;
  const w = fw * TILE, d = fd * TILE;
  const top = SURFACES[surfaceName] ? SURFACES[surfaceName]() : toMat(surfaceName);
  const side = mat(shade(PALETTE.dirt, -0.1));
  return box(w, LOT_HEIGHT, d, [side, side, top, side, side, side]);
}

/** Flat patch (paths, yards, plazas) 0.05 thick. surfaceName as for lot(), or a material. */
export function patch(w, d, surfaceName = 'paved', thickness = 0.05) {
  const top = SURFACES[surfaceName] ? SURFACES[surfaceName]() : toMat(surfaceName);
  return box(w, thickness, d, top);
}

/**
 * Low-poly tree. kind: 'round' | 'cone' | 'poplar' | 'palm' | 'bush' | 'autumn'
 *   tree({ kind = 'round', h = 6, seed = 1, color })
 */
export function tree({ kind = 'round', h = 6, seed = 1, color } = {}) {
  const r = makeRng(seed);
  const g = new THREE.Group();
  const trunkM = mat(PALETTE.trunk);
  const leaf = mat(color ?? (kind === 'autumn' ? PALETTE.autumn : r.pick(SWATCHES.foliage)));
  if (kind === 'bush') {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.5, 0), leaf);
    s.scale.set(1.2, 0.8, 1.1);
    s.position.y = h * 0.35;
    g.add(s);
    return g;
  }
  if (kind === 'palm') {
    g.add(cylinder(h * 0.035, h * 0.05, h, trunkM, 6));
    for (let i = 0; i < 6; i++) {
      const frond = box(h * 0.45, 0.08, h * 0.12, leaf);
      frond.geometry = frond.geometry.clone().translate(h * 0.22, 0, 0);
      frond.position.y = h;
      frond.rotation.set(0, (i / 6) * Math.PI * 2 + r() * 0.3, -0.35);
      g.add(frond);
    }
    return g;
  }
  const trunkH = kind === 'cone' ? h * 0.2 : h * 0.35;
  g.add(cylinder(h * 0.04, h * 0.06, trunkH + 0.2, trunkM, 6));
  if (kind === 'cone') {
    g.add(place(cone(h * 0.28, h * 0.5, leaf, 7), { y: trunkH }));
    g.add(place(cone(h * 0.22, h * 0.4, leaf, 7), { y: trunkH + h * 0.35 }));
  } else if (kind === 'poplar') {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.18, 0), leaf);
    s.scale.set(1, 2.6, 1);
    s.position.y = trunkH + h * 0.33;
    g.add(s);
  } else {
    const s = new THREE.Mesh(new THREE.IcosahedronGeometry(h * 0.32, 0), leaf);
    s.position.y = trunkH + h * 0.28;
    s.rotation.set(r() * 3, r() * 3, 0);
    g.add(s);
  }
  return g;
}

/**
 * Randomly scatter copies of make(r, i) inside a w x d rectangle.
 *   scatter({ w, d, count, seed, minGap = 1.5, avoid: [{x, z, w, d}], make: (r, i) => tree({ seed: i }) })
 * avoid = rectangles (centre + size) to keep clear.
 */
export function scatter({ w, d, count, seed = 1, minGap = 1.5, avoid = [], make }) {
  const r = makeRng(seed);
  const g = new THREE.Group();
  const pts = [];
  let tries = 0;
  while (pts.length < count && tries++ < count * 40) {
    const x = r.range(-w / 2, w / 2), z = r.range(-d / 2, d / 2);
    if (avoid.some((a) => Math.abs(x - a.x) < a.w / 2 && Math.abs(z - a.z) < a.d / 2)) continue;
    if (pts.some(([px, pz]) => Math.hypot(px - x, pz - z) < minGap)) continue;
    pts.push([x, z]);
    const o = make(r, pts.length - 1);
    o.position.x += x;
    o.position.z += z;
    o.rotation.y += r() * Math.PI * 2;
    g.add(o);
  }
  return g;
}

/** Box hedge. */
export function hedge({ w, h = 1, d = 0.8, color = PALETTE.foliageDark } = {}) {
  return box(w, h, d, color);
}

/**
 * Fence around a w x d rectangle (centred) or along one side.
 *   fence({ w, d, h = 1, style = 'picket'|'wire'|'wall'|'railing', color, sides = ['front','back','left','right'], gap = 0 })
 * gap = width of an opening in the middle of the front side.
 */
export function fence({ w, d, h = 1, style = 'picket', color, sides = ['front', 'back', 'left', 'right'], gap = 0 } = {}) {
  const c = color ?? { picket: PALETTE.white, wire: PALETTE.steel, wall: PALETTE.stone, railing: PALETTE.darkGrey }[style];
  const m = toMat(c);
  const g = new THREE.Group();
  const run = (len, makeAt) => {
    if (style === 'wall') return [makeAt(box(len, h, 0.3, m), 0)];
    const parts = [];
    const posts = Math.max(2, Math.round(len / (style === 'picket' ? 0.5 : 2.5)) + 1);
    for (let i = 0; i < posts; i++) {
      const t = -len / 2 + (len * i) / (posts - 1);
      parts.push(makeAt(box(0.1, h, 0.1, m), t));
    }
    const rails = style === 'wire' ? [h * 0.3, h * 0.6, h * 0.95] : [h * 0.3, h * 0.8];
    for (const ry of rails) {
      const rail = makeAt(box(len, style === 'wire' ? 0.03 : 0.08, 0.05, m), 0);
      rail.position.y = ry;
      parts.push(rail);
    }
    return parts;
  };
  const side = (name, len, x, z, rot) => {
    if (!sides.includes(name)) return;
    const segs = name === 'front' && gap > 0 ? [[-(len + gap) / 4, (len - gap) / 2], [(len + gap) / 4, (len - gap) / 2]] : [[0, len]];
    for (const [off, l] of segs) {
      const sg = new THREE.Group();
      for (const p of run(l, (o, t) => ((o.position.x = t), o))) sg.add(p);
      sg.rotation.y = rot;
      sg.position.set(x + (rot === 0 ? off : 0), 0, z + (rot !== 0 ? off : 0));
      g.add(sg);
    }
  };
  side('front', w, 0, d / 2, 0);
  side('back', w, 0, -d / 2, 0);
  side('left', d, -w / 2, 0, Math.PI / 2);
  side('right', d, w / 2, 0, Math.PI / 2);
  return g;
}

/** Swimming pool with coping. Top at y = 0.3. */
export function pool({ w = 4, d = 2.5, color = PALETTE.pool } = {}) {
  const coping = mat(PALETTE.white);
  return group(
    parapet({ w: w + 0.6, d: d + 0.6, h: 0.3, t: 0.3, material: coping }),
    place(box(w, 0.22, d, water(color)), { y: 0 })
  );
}

/** Small car, length along X. kind: 'car' | 'van' | 'taxi' */
export function car({ color = PALETTE.red, kind = 'car' } = {}) {
  const body = mat(color === 'taxi' || kind === 'taxi' ? PALETTE.yellow : color, { roughness: 0.4, metalness: 0.3 });
  const glassM = mat(PALETTE.glassDark, { roughness: 0.2, metalness: 0.5 });
  const g = new THREE.Group();
  const len = kind === 'van' ? 4.8 : 4.2;
  g.add(place(box(len, 0.75, 1.8, body), { y: 0.3 }));
  if (kind === 'van') {
    g.add(place(box(len * 0.75, 1.0, 1.75, body), { x: -len * 0.1, y: 1.05 }));
    g.add(place(box(0.05, 0.6, 1.5, glassM), { x: len * 0.275, y: 1.25 }));
  } else {
    g.add(place(box(len * 0.5, 0.6, 1.6, glassM), { x: -len * 0.05, y: 1.05 }));
    g.add(place(box(len * 0.48, 0.06, 1.62, body), { x: -len * 0.05, y: 1.62 }));
  }
  const wheelM = mat(PALETTE.black);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.33, 0.33, 0.25, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(sx * len * 0.32, 0.33, sz * 0.85);
    g.add(wheel);
  }
  return g;
}

/** Lorry with box trailer, length along X (~10 m). */
export function truck({ color = PALETTE.blue, trailerColor = PALETTE.white } = {}) {
  const g = new THREE.Group();
  g.add(place(box(2.4, 2.6, 2.4, mat(color, { roughness: 0.5 })), { x: 3.6, y: 0.5 }));
  g.add(place(box(0.05, 1, 2, mat(PALETTE.glassDark, { roughness: 0.2 })), { x: 4.82, y: 1.9 }));
  g.add(place(box(7.2, 2.9, 2.5, mat(trailerColor)), { x: -1.4, y: 0.9 }));
  const wheelM = mat(PALETTE.black);
  for (const x of [3.6, -0.5, -3.5]) for (const sz of [-1, 1]) {
    const wgeo = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 10);
    wgeo.rotateX(Math.PI / 2);
    const wheel = new THREE.Mesh(wgeo, wheelM);
    wheel.position.set(x, 0.5, sz * 1.05);
    g.add(wheel);
  }
  return g;
}

/** Shipping container, length along X. length 6.1 (20ft) or 12.2 (40ft). */
export function container({ color = PALETTE.red, length = 6.1 } = {}) {
  const side = surface('corrugated', color, { size: 1.2, roughness: 0.7 });
  const end = mat(shade(color, -0.15));
  return box(length, 2.6, 2.44, [end, end, mat(shade(color, 0.05)), end, side, side]);
}

/** Street lamp (~5 m) with a glowing head. Arm points towards +x. */
export function streetLamp({ h = 5 } = {}) {
  const m = metal(PALETTE.darkGrey);
  return group(
    cylinder(0.07, 0.1, h, m, 6),
    place(box(1, 0.08, 0.08, m), { x: 0.45, y: h }),
    place(box(0.5, 0.15, 0.3, emissive(PALETTE.windowLit, 0.8)), { x: 0.85, y: h - 0.12 })
  );
}

/** Park bench, length along X. */
export function bench({ w = 1.8 } = {}) {
  const wood = mat(PALETTE.wood);
  const iron = mat(PALETTE.darkGrey);
  return group(
    place(box(w, 0.08, 0.45, wood), { y: 0.42 }),
    place(box(w, 0.4, 0.06, wood), { y: 0.5, z: -0.22 }),
    place(box(0.06, 0.45, 0.45, iron), { x: -w / 2 + 0.1 }),
    place(box(0.06, 0.45, 0.45, iron), { x: w / 2 - 0.1 })
  );
}

/** Flag pole with a flag that waves towards +x. */
export function flag({ h = 6, color = PALETTE.red, color2 = PALETTE.white } = {}) {
  return group(
    cylinder(0.05, 0.07, h, metal(PALETTE.steelLight), 6),
    place(box(1.6, 1, 0.03, surface('stripes', color, { color2, size: 0.8 })), { x: 0.8, y: h - 1.05 })
  );
}

/** Tilted solar panel on a frame. Faces +z (south) by default. */
export function solarPanel({ w = 3, d = 1.6, tilt = 25, height = 0.6 } = {}) {
  const panel = box(w, 0.08, d, [mat(PALETTE.steel), mat(PALETTE.steel), MAT.solar, mat(PALETTE.steel), mat(PALETTE.steel), mat(PALETTE.steel)]);
  panel.position.y = height + (d / 2) * Math.sin(THREE.MathUtils.degToRad(tilt));
  panel.rotation.x = THREE.MathUtils.degToRad(tilt);
  const legM = metal(PALETTE.steelDark);
  return group(
    panel,
    place(box(0.1, height, 0.1, legM), { x: -w / 2 + 0.3, z: d / 3 }),
    place(box(0.1, height, 0.1, legM), { x: w / 2 - 0.3, z: d / 3 }),
    place(box(0.1, height + d * 0.8 * Math.sin(THREE.MathUtils.degToRad(tilt)), 0.1, legM), { x: -w / 2 + 0.3, z: -d / 3 }),
    place(box(0.1, height + d * 0.8 * Math.sin(THREE.MathUtils.degToRad(tilt)), 0.1, legM), { x: w / 2 - 0.3, z: -d / 3 })
  );
}

/**
 * Asphalt parking area with painted bays and some parked cars.
 *   parkingLot({ w, d, seed = 1, fill = 0.6, rows: auto })
 * Bays are 2.5 m wide along X, 5 m deep, arranged in rows along Z.
 */
export function parkingLot({ w, d, seed = 1, fill = 0.6 } = {}) {
  const r = makeRng(seed);
  const g = new THREE.Group();
  g.add(box(w, 0.06, d, surface('asphalt', PALETTE.asphalt, { size: 4, roughness: 0.95 })));
  const lineM = mat(PALETTE.roadLine);
  const rows = Math.max(1, Math.floor(d / 6));
  const bays = Math.max(1, Math.floor((w - 0.5) / 2.5));
  for (let row = 0; row < rows; row++) {
    const z0 = -d / 2 + (d / rows) * (row + 0.5);
    for (let i = 0; i <= bays; i++) {
      const x = -((bays * 2.5) / 2) + i * 2.5;
      g.add(place(box(0.1, 0.02, 4.6, lineM), { x, y: 0.06, z: z0 }));
      if (i < bays && r.chance(fill)) {
        const c = car({ color: r.pick(SWATCHES.cars) });
        place(c, { x: x + 1.25, y: 0.06, z: z0, ry: 90 + (r.chance(0.5) ? 180 : 0) });
        c.scale.setScalar(0.95);
        g.add(c);
      }
    }
  }
  return g;
}

/** Crop field patch (0.12 thick). crop: wheat corn cabbage vineyard sunflower plowed orchard flowers */
export function cropField({ w, d, crop = 'wheat', seed } = {}) {
  const top = fieldMat(crop, { seed });
  const side = mat(PALETTE.dirt);
  return box(w, 0.12, d, [side, side, top, side, side, side]);
}

/**
 * Hay bale (round). Lies along X.
 */
export function hayBale({ r = 0.7 } = {}) {
  const geo = new THREE.CylinderGeometry(r, r, r * 1.4, 12);
  geo.rotateZ(Math.PI / 2);
  geo.translate(0, r, 0);
  return new THREE.Mesh(geo, mat(PALETTE.hay));
}

// re-export so buildings can `import { ... } from '../../src/lib/index.js'` everything
export { polygonArea };

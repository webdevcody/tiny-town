import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, hipRoof, pyramidRoof, chimney, door, windowPanel, box, cylinder, sphere,
  place, pool, car, surface, mat,
} from '../../src/lib/index.js';
import {
  archWall, palm, cypress, olive, bougainvillea, pot, lounger, parasol, pergola, fountain, gateLeaf,
} from './parts.js';

// 2x2 tiles (20 x 20 m). Front (street) faces +z.
// An L-shaped villa hugs the back-left corner: a two-storey main wing along the
// back with an arched loggia opening onto the pool terrace, a single-storey
// west wing holding the front door, and a belvedere tower where they meet.
// A whitewashed garden wall with an iron gate encloses forecourt, pool and garden.
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  const add = (o, p) => g.add(place(o, p));
  g.add(lot([2, 2], 'grass'));

  const WHITE = '#f6f3ec';
  const SHUTTER = '#2f7d95';
  const wallM = mat(WHITE);
  const trimM = mat('#e2dccd');
  const roofM = surface('roofTiles', PALETTE.terracotta, { size: 2 });
  const cotto = surface('paving', '#c9764a', { size: 1.2, color2: '#b4623a' });
  const travertine = surface('paving', '#e6d8b8', { size: 2, color2: '#d6c6a2' });
  const fac = {
    style: 'punched', wall: WHITE, frame: PALETTE.white, glass: PALETTE.window, shutters: SHUTTER,
    windowW: 0.38, windowH: 0.55, bay: 2.3, lit: 0.08, seed: 31, roof: PALETTE.concreteDark,
  };

  // ---------------------------------------------------------------- ground
  // pool terrace (travertine), forecourt (gravel), loggia floor (cotto)
  add(patch(12.95, 7.9, travertine), { x: 3.175, y: y0, z: 0.65 });
  add(patch(9.1, 5.05, 'gravel'), { x: -5.05, y: y0, z: 7.12 });
  add(patch(2.0, 5.05, travertine), { x: -6.05, y: y0 + 0.01, z: 7.12 });
  add(cylinder(1.9, 1.9, 0.06, travertine, 20), { x: -6.05, y: y0, z: 7.0 });
  add(patch(7.5, 2.2, cotto), { x: 0.45, y: y0, z: -4.4 });

  // ---------------------------------------------------------------- the L
  // main wing: ground floor recessed behind the loggia, full-depth upper floor
  add(facadeBlock({ w: 13, d: 3.3, floors: 1, ...fac }), { x: -2.3, y: y0, z: -7.15 });
  add(facadeBlock({ w: 13, d: 5.5, floors: 1, ...fac, seed: 32 }), { x: -2.3, y: y0 + FLOOR, z: -6.05 });
  add(box(13, 0.1, 5.5, trimM), { x: -2.3, y: y0 + FLOOR - 0.05, z: -6.05 });
  add(box(13.3, 0.2, 5.8, wallM), { x: -2.3, y: y0 + 2 * FLOOR - 0.1, z: -6.05 });
  add(hipRoof({ w: 13, d: 5.5, h: 1.9, overhang: 0.55, material: roofM }), { x: -2.3, y: y0 + 2 * FLOOR + 0.1, z: -6.05 });
  add(chimney({ w: 0.8, d: 0.8, h: 2.2, material: wallM }), { x: 1.6, y: y0 + 2 * FLOOR + 0.3, z: -7.4 });
  add(pyramidRoof({ w: 0.9, d: 0.9, h: 0.35, overhang: 0.12, material: roofM }), { x: 1.6, y: y0 + 2 * FLOOR + 2.5, z: -7.4 });

  // west wing (front door on its gable end)
  add(facadeBlock({ w: 5.5, d: 9.5, floors: 1, ...fac, seed: 33, blank: ['front'] }), { x: -6.05, y: y0, z: -0.75 });
  add(box(5.8, 0.2, 7.6, wallM), { x: -6.05, y: y0 + FLOOR - 0.1, z: 0.35 });
  add(hipRoof({ w: 5.5, d: 7.3, h: 1.6, overhang: 0.5, material: roofM }), { x: -6.05, y: y0 + FLOOR + 0.1, z: 0.35 });

  // arched loggia along the pool side of the main wing
  add(archWall({ n: 3, archW: 1.9, pier: 0.45, spring: 1.75, h: FLOOR, t: 0.4, material: wallM, capital: trimM }), { x: 0.45, y: y0, z: -3.5 });
  add(archWall({ n: 1, archW: 1.1, pier: 0.35, spring: 1.75, h: FLOOR, t: 0.4, material: wallM, capital: trimM }), { x: 4.0, y: y0, z: -4.6, ry: 90 });
  // loggia furniture: long table, benches, hanging lanterns
  add(box(3.2, 0.75, 0.9, PALETTE.woodDark), { x: 0.45, y: y0, z: -4.5 });
  for (const dz of [-0.75, 0.75]) add(box(3.0, 0.42, 0.35, PALETTE.wood), { x: 0.45, y: y0, z: -4.5 + dz });
  for (const x of [-1.9, 0.45, 2.8]) add(box(0.25, 0.35, 0.25, mat('#ffd98a', { emissive: '#ffb84a', emissiveIntensity: 0.6 })), { x, y: y0 + 2.35, z: -4.4 });

  // balcony with iron railing above the loggia, French windows
  add(box(2.6, 0.15, 0.9, wallM), { x: 0.45, y: y0 + FLOOR, z: -2.85 });
  for (let i = 0; i <= 10; i++) add(box(0.04, 0.9, 0.04, PALETTE.black), { x: 0.45 - 1.25 + i * 0.25, y: y0 + FLOOR + 0.15, z: -2.45 });
  add(box(2.6, 0.06, 0.06, PALETTE.black), { x: 0.45, y: y0 + FLOOR + 1.05, z: -2.45 });
  for (const sx of [-1, 1]) add(box(0.06, 0.06, 0.9, PALETTE.black), { x: 0.45 + sx * 1.27, y: y0 + FLOOR + 1.05, z: -2.85 });
  add(windowPanel({ w: 1.2, h: 2.1 }), { x: 0.45, y: y0 + FLOOR + 0.15, z: -3.3 });
  for (const sx of [-1, 1]) add(box(0.6, 2.1, 0.08, SHUTTER), { x: 0.45 + sx * 0.95, y: y0 + FLOOR + 0.15, z: -3.26 });

  // belvedere tower at the corner of the L
  const tx = -6.05, tz = -6.05, ts = 3.6;
  add(facadeBlock({ w: ts, d: ts, floors: 3, ...fac, bay: 1.8, seed: 34 }), { x: tx, y: y0, z: tz });
  const by = y0 + 3 * FLOOR;
  add(box(ts + 0.3, 0.2, ts + 0.3, trimM), { x: tx, y: by, z: tz });
  add(box(ts - 0.2, 0.05, ts - 0.2, cotto), { x: tx, y: by + 0.2, z: tz });
  const bw = { n: 2, archW: 1.1, pier: 0.47, spring: 1.25, h: 2.2, t: 0.3, material: wallM, capital: trimM };
  add(archWall(bw), { x: tx, y: by + 0.2, z: tz + ts / 2 - 0.15 });
  add(archWall(bw), { x: tx, y: by + 0.2, z: tz - ts / 2 + 0.15, ry: 180 });
  add(archWall(bw), { x: tx + ts / 2 - 0.15, y: by + 0.2, z: tz, ry: 90 });
  add(archWall(bw), { x: tx - ts / 2 + 0.15, y: by + 0.2, z: tz, ry: -90 });
  add(box(ts + 0.3, 0.2, ts + 0.3, wallM), { x: tx, y: by + 2.4, z: tz });
  add(pyramidRoof({ w: ts, d: ts, h: 1.6, overhang: 0.45, material: roofM }), { x: tx, y: by + 2.6, z: tz });

  // front door: arched, with lamps, shuttered windows and lemon pots
  const fz = 4.0;
  add(box(1.9, 2.75, 0.1, trimM), { x: -6.05, y: y0, z: fz + 0.05 });
  add(door({ w: 1.3, h: 2.2, color: '#6b3f22', frame: trimM }), { x: -6.05, y: y0, z: fz });
  const archTop = new THREE.Mesh(new THREE.CylinderGeometry(0.65, 0.65, 0.12, 12, 1, false, -Math.PI / 2, Math.PI), mat('#6b3f22'));
  archTop.rotation.x = Math.PI / 2;
  archTop.position.set(-6.05, y0 + 2.2, fz + 0.08);
  g.add(archTop);
  add(box(2.4, 0.15, 1.0, wallM), { x: -6.05, y: y0, z: fz + 0.5 });
  for (const sx of [-1, 1]) {
    add(box(0.18, 0.3, 0.18, PALETTE.black), { x: -6.05 + sx * 1.15, y: y0 + 2.2, z: fz + 0.12 });
    add(box(0.12, 0.18, 0.12, mat('#ffe7a0', { emissive: '#ffcc66', emissiveIntensity: 0.5 })), { x: -6.05 + sx * 1.15, y: y0 + 2.26, z: fz + 0.14 });
    const wx = -6.05 + sx * 1.85;
    add(windowPanel({ w: 0.8, h: 1.3 }), { x: wx, y: y0 + 0.9, z: fz });
    for (const ss of [-1, 1]) add(box(0.4, 1.3, 0.06, SHUTTER), { x: wx + ss * 0.62, y: y0 + 0.9, z: fz + 0.04 });
    add(pot({ plant: 'lemon', seed: sx + 3 }), { x: -6.05 + sx * 1.0, y: y0, z: fz + 1.35 });
  }

  // ---------------------------------------------------------------- pool area
  add(pool({ w: 8, d: 3.4, color: '#3fc8e0' }), { x: 3.7, y: y0 + 0.05, z: 0.4 });
  // steps + ladder + float
  for (let i = 0; i < 3; i++) add(box(1.8, 0.07, 0.35, mat('#bfeef5')), { x: -0.3 + 0.95, y: y0 + 0.1 + i * 0.03, z: 1.95 - i * 0.35 });
  for (const dz of [-0.25, 0.25]) add(box(0.05, 0.75, 0.05, PALETTE.chrome), { x: 7.55, y: y0 + 0.05, z: 0.4 + dz });
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.14, 6, 12), mat('#f05a5a'));
  ring.rotation.x = Math.PI / 2;
  ring.position.set(5.2, y0 + 0.3, 0.9);
  g.add(ring);
  // loungers + parasols on the south side, more under the loggia arches
  for (const x of [0.3, 1.5, 5.6, 6.8]) add(lounger(), { x, y: y0 + 0.05, z: 3.55 });
  add(parasol({ color2: '#2f7fae' }), { x: 0.9, y: y0 + 0.05, z: 3.4 });
  add(parasol({ color2: '#e8a33a' }), { x: 6.2, y: y0 + 0.05, z: 3.4 });
  add(box(0.6, 0.45, 0.6, PALETTE.white), { x: 3.5, y: y0 + 0.05, z: 3.6 });
  for (const [x, z, s] of [[-2.6, -2.6, 1], [9.0, -0.8, 2], [9.0, 2.0, 3], [3.5, -2.7, 4]]) add(pot({ seed: s }), { x, y: y0 + 0.05, z });

  // ---------------------------------------------------------------- pergola corner
  add(patch(4.6, 5.0, cotto), { x: 7.1, y: y0, z: -6.4 });
  add(pergola({ w: 4.2, d: 4.4, h: 2.6 }), { x: 7.1, y: y0, z: -6.4 });
  add(cylinder(0.75, 0.75, 0.08, PALETTE.white, 12), { x: 7.1, y: y0 + 0.75, z: -6.4 });
  add(cylinder(0.08, 0.15, 0.75, PALETTE.darkGrey, 6), { x: 7.1, y: y0, z: -6.4 });
  for (let i = 0; i < 4; i++) {
    const an = (i * Math.PI) / 2 + 0.4;
    add(box(0.45, 0.45, 0.45, PALETTE.woodLight), { x: 7.1 + Math.cos(an) * 1.15, y: y0, z: -6.4 + Math.sin(an) * 1.15 });
    add(box(0.45, 0.5, 0.08, PALETTE.woodLight), { x: 7.1 + Math.cos(an) * 1.4, y: y0 + 0.45, z: -6.4 + Math.sin(an) * 1.4, ry: -THREE.MathUtils.radToDeg(an) + 90 });
  }

  // ---------------------------------------------------------------- forecourt
  add(fountain({ r: 1.1 }), { x: -6.05, y: y0 + 0.05, z: 7.0 });
  add(car({ color: '#c8322b' }), { x: -2.2, y: y0 + 0.05, z: 6.6, ry: 90, s: 0.75 });
  add(pot({ seed: 7 }), { x: -8.9, y: y0, z: 4.9 });

  // ---------------------------------------------------------------- front garden
  // lavender rows and olive trees
  const lav = mat('#8b6cc2');
  const lavLeaf = mat('#6f8f5a');
  for (let row = 0; row < 4; row++) {
    const z = 5.7 + row * 0.95;
    add(box(4.2, 0.25, 0.55, lavLeaf), { x: 1.75, y: y0, z });
    for (let i = 0; i < 7; i++) {
      const b = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), lav);
      b.scale.set(1, 0.85, 1);
      b.position.set(-0.15 + i * 0.63, y0 + 0.4, z + ((i + row) % 2 ? 0.05 : -0.05));
      g.add(b);
    }
  }
  add(olive({ h: 4.0, seed: 2 }), { x: 5.6, y: y0, z: 7.6 });
  add(olive({ h: 3.4, seed: 5 }), { x: 8.3, y: y0, z: 5.9 });
  add(olive({ h: 3.0, seed: 9 }), { x: 8.5, y: y0, z: 8.7 });
  add(patch(9.9, 0.6, 'gravel'), { x: 4.6, y: y0, z: 5.0 });

  // ---------------------------------------------------------------- trees
  add(palm({ h: 7.5, lean: 0.9, dir: 200, seed: 1 }), { x: 8.1, y: y0, z: -2.3 });
  add(palm({ h: 6.4, lean: 0.7, dir: 160, seed: 2 }), { x: 7.9, y: y0, z: 3.7 });
  add(palm({ h: 8.2, lean: 1.0, dir: 30, seed: 3 }), { x: -2.3, y: y0, z: 2.7 });
  for (const [x, z, h] of [[-8.95, 8.95, 5.8], [-3.05, 9.0, 6.2], [4.2, -9.1, 5.6]]) add(cypress({ h }), { x, y: y0, z });

  // ---------------------------------------------------------------- garden wall + gate
  const WH = 1.4, WT = 0.3, E = 9.8;
  const coping = mat(PALETTE.terracotta);
  const plinthM = mat('#d8cdb4');
  const wallRun = (len, x, z, ry) => {
    add(box(len, WH, WT, wallM), { x, y: y0, z, ry });
    add(box(len + 0.02, 0.3, WT + 0.06, plinthM), { x, y: y0, z, ry });
    add(box(len + 0.04, 0.12, WT + 0.14, coping), { x, y: y0 + WH, z, ry });
  };
  wallRun(2 * E + WT, 0, -E, 0);
  wallRun(2 * E - WT, -E, 0, 90);
  wallRun(2 * E - WT, E, 0, 90);
  const gx0 = -7.75, gx1 = -4.35; // gate opening
  wallRun(gx0 - 0.6 + E + WT / 2, (gx0 - 0.6 - E - WT / 2) / 2, E, 0);
  wallRun(E + WT / 2 - (gx1 + 0.6), (E + WT / 2 + gx1 + 0.6) / 2, E, 0);
  for (const px of [gx0 - 0.3, gx1 + 0.3]) {
    add(box(0.6, 1.9, 0.6, wallM), { x: px, y: y0, z: E });
    add(box(0.74, 0.12, 0.74, coping), { x: px, y: y0 + 1.9, z: E });
    add(cylinder(0.12, 0.22, 0.35, coping, 8), { x: px, y: y0 + 2.02, z: E });
    add(sphere(0.2, coping, 8), { x: px, y: y0 + 2.3, z: E });
  }
  add(gateLeaf({ w: 1.7, h: 1.5 }), { x: gx0, y: y0, z: E, ry: 65 });
  add(gateLeaf({ w: 1.7, h: 1.5 }), { x: gx1, y: y0, z: E, ry: 115 });

  // bougainvillea spilling over walls and climbing the house
  for (const [x, y, z, s, seed] of [
    [-3.0, 0, 3.7, 1.1, 1], [-3.05, 0, -2.9, 1.0, 2], [-1.3, WH - 0.5, E - 0.7, 1.0, 3],
    [3.0, WH - 0.5, E - 0.65, 0.9, 4], [E - 0.95, WH - 0.5, 0.2, 0.9, 5], [-8.4, 0, 4.6, 0.9, 6],
    [E - 0.95, WH - 0.5, -2.6, 0.9, 7], [-1.2, WH - 0.5, -E + 0.65, 0.9, 8],
  ]) add(bougainvillea({ s, seed }), { x, y: y0 + y, z });

  return g;
}

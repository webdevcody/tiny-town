import * as THREE from 'three';
import {
  PALETTE, LOT_HEIGHT,
  lot, patch, box, place, mat, metal, surface, gableRoof, beam,
  hayBale, tree, fence, door, pipe, cylinder,
} from '../../src/lib/index.js';
import { tractor, plough, fuelTank, drum, squareBale } from './props.js';

// 1x1 tile (10 x 10 m). Open front of the shed faces +z (street side).
export default function build() {
  const y0 = LOT_HEIGHT;
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));

  const wallM = surface('corrugated', '#aeb7be', { size: 1.5, metalness: 0.3, roughness: 0.6 });
  const roofM = surface('corrugated', '#9c4632', { size: 1.5, metalness: 0.2, roughness: 0.7 });
  const postM = metal(PALETTE.steelDark);
  const baseM = mat(PALETTE.concrete);

  // shed box: x -4.5..2.9, z -4.5..0.7
  const sx = -0.8, sz = -1.9, sw = 7.4, sd = 5.2, eave = 3.4;
  const L = sx - sw / 2, R = sx + sw / 2, B = sz - sd / 2, F = sz + sd / 2;

  // yard: packed dirt apron in front + gravel strip on the east side
  g.add(place(patch(9.6, 4.0, 'dirt'), { x: 0, y: y0, z: 2.9 }));
  g.add(place(patch(1.9, 5.6, 'gravel'), { x: 4.0, y: y0, z: -1.9 }));
  // tractor ruts leading out of the left bay
  for (const dx of [-0.8, 0.8]) g.add(place(patch(0.45, 4.1, mat('#6b5236'), 0.07), { x: -2.65 + dx, y: y0, z: 2.9 }));

  // concrete floor slab
  g.add(place(box(sw, 0.12, sd, mat(PALETTE.concreteDark ?? '#8d8d88')), { x: sx, y: y0, z: sz }));
  const fy = y0 + 0.12;

  // walls: back, left, right (corrugated steel on a low concrete plinth)
  const t = 0.12;
  g.add(place(box(sw, 0.4, t + 0.04, baseM), { x: sx, y: fy, z: B + t / 2 }));
  g.add(place(box(sw, eave - 0.4, t, wallM), { x: sx, y: fy + 0.4, z: B + t / 2 }));
  for (const x of [L + t / 2, R - t / 2]) {
    g.add(place(box(t + 0.04, 0.4, sd, baseM), { x, y: fy, z: sz }));
    g.add(place(box(t, eave - 0.4, sd, wallM), { x, y: fy + 0.4, z: sz }));
  }
  // translucent daylight band along the top of the walls
  const bandM = mat('#e8eed8', { roughness: 0.3, transparent: true, opacity: 0.85 });
  g.add(place(box(sw - 0.1, 0.5, t + 0.03, bandM), { x: sx, y: fy + eave - 0.75, z: B + t / 2 }));
  for (const x of [L + t / 2, R - t / 2]) g.add(place(box(t + 0.03, 0.5, sd - 0.1, bandM), { x, y: fy + eave - 0.75, z: sz }));
  // roof (gable, ridge along x) with corrugated sheets and steel gable ends
  g.add(place(gableRoof({ w: sw, d: sd, h: 1.4, overhang: 0.35, ridge: 'x', material: roofM, gableMaterial: wallM }), { x: sx, y: fy + eave, z: sz }));
  g.add(place(box(sw + 0.75, 0.1, 0.1, postM), { x: sx, y: fy + eave + 1.38, z: sz })); // ridge cap

  // clear roof-light sheets on both slopes
  const pitch = (Math.atan2(1.4, sd / 2) * 180) / Math.PI;
  for (const x of [sx - 2.2, sx + 0.6]) for (const s of [-1, 1]) {
    g.add(place(box(0.7, 0.04, 1.9, mat('#b4c8cf', { roughness: 0.25, metalness: 0.3 })), { x, y: fy + eave + 0.7 + 0.03, z: sz + s * 1.3, rx: s * pitch }));
  }

  // gutters on both eaves, downpipes + water butt on the back wall
  const gutM = mat('#4b5258', { roughness: 0.5 });
  const drop = (0.35 * 1.4) / (sd / 2);
  for (const z of [F + 0.42, B - 0.42]) g.add(place(box(sw + 0.7, 0.14, 0.14, gutM), { x: sx, y: fy + eave - drop - 0.1, z }));
  for (const x of [L + 0.35, R - 0.35]) g.add(pipe([x, fy + eave - drop - 0.05, B - 0.42], [x, y0 + 0.1, B - 0.12], 0.07, gutM));
  g.add(place(cylinder(0.32, 0.32, 0.9, mat('#3f6f3a'), 12), { x: L + 0.35, y: y0, z: B - 0.25 }));
  // ladder leaning on the back wall + electrics box
  for (const dx of [-0.25, 0.25]) g.add(beam([0.6 + dx, y0, B - 0.4], [0.6 + dx, fy + eave - 0.3, B - 0.05], 0.06, mat(PALETTE.aluminium)));
  for (let i = 1; i < 9; i++) {
    const k = i / 9;
    g.add(place(box(0.5, 0.04, 0.04, mat(PALETTE.aluminium)), { x: 0.6, y: y0 + k * (eave - 0.15), z: B - 0.4 + k * 0.35 }));
  }
  g.add(place(box(0.5, 0.6, 0.15, mat(PALETTE.lightGrey)), { x: -1.6, y: fy + 1.3, z: B - 0.075 }));

  // open front: steel portal posts + eave beam + knee braces
  const posts = [L + 0.1, sx, R - 0.1];
  for (const x of posts) g.add(place(box(0.22, eave, 0.22, postM), { x, y: fy, z: F - 0.11 }));
  g.add(place(box(sw, 0.3, 0.24, postM), { x: sx, y: fy + eave - 0.3, z: F - 0.11 }));
  for (const x of posts) for (const s of [-1, 1]) {
    if ((x === posts[0] && s < 0) || (x === posts[2] && s > 0)) continue;
    g.add(beam([x, fy + eave - 1.0, F - 0.11], [x + s * 0.7, fy + eave - 0.3, F - 0.11], 0.1, postM));
  }
  // yellow/black hazard wraps on the post bases
  for (const x of posts) g.add(place(box(0.26, 0.6, 0.26, surface('hazard', PALETTE.yellow, { size: 0.6 })), { x, y: fy, z: F - 0.11 }));
  // roof purlins visible from under the eaves
  for (const z of [B + 1.2, sz, F - 1.2]) g.add(place(box(sw - 0.2, 0.12, 0.1, postM), { x: sx, y: fy + eave + (1 - Math.abs(z - sz) / (sd / 2)) * 1.4 - 0.25, z }));
  // a strip light under the eave
  g.add(place(box(0.8, 0.08, 0.15, mat('#fff4c8', { emissive: '#ffeaa0', emissiveIntensity: 0.6 })), { x: sx, y: fy + eave - 0.4, z: F - 0.3 }));

  // left bay: green tractor, nose out
  g.add(place(tractor({ color: '#3d8a3a', hubColor: PALETTE.yellow }), { x: -2.65, y: fy, z: -0.75, ry: -90 }));
  // right bay: plough + workbench, tool board, drums
  g.add(place(plough({ color: '#2f6db5' }), { x: 0.5, y: y0 + 0.05, z: 1.0, ry: -100 }));
  g.add(place(box(2.2, 0.9, 0.6, mat(PALETTE.woodDark)), { x: 1.0, y: fy, z: B + 0.45 }));
  g.add(place(box(1.6, 0.9, 0.05, mat(PALETTE.wood)), { x: 1.0, y: fy + 1.3, z: B + 0.15 }));
  g.add(place(box(0.5, 0.3, 0.35, mat(PALETTE.red)), { x: 0.4, y: fy + 0.9, z: B + 0.45 })); // toolbox
  g.add(place(drum({ color: PALETTE.blue }), { x: 2.35, y: fy, z: B + 0.45 }));
  g.add(place(drum({ color: PALETTE.orange }), { x: 2.35, y: fy, z: B + 1.1 }));

  // hay stacked in the back-left corner inside (square bales)
  for (let i = 0; i < 2; i++) for (let k = 0; k < 2; k++) g.add(place(squareBale(), { x: -3.85, y: fy + k * 0.45, z: B + 0.75 + i * 0.6, ry: 90 }));

  // east side: diesel tank on its stand + drums
  g.add(place(fuelTank({ color: PALETTE.red, length: 2.4, radius: 0.55, standH: 1.1 }), { x: 4.0, y: y0, z: -3.0, ry: -90 }));
  g.add(place(drum({ color: PALETTE.red }), { x: 3.75, y: y0, z: 0.75 }));
  g.add(place(drum({ color: PALETTE.green }), { x: 4.4, y: y0, z: 0.95 }));
  g.add(place(drum({ color: PALETTE.red }), { x: 4.1, y: y0, z: 0.2 }));
  // side door + step on the east wall
  g.add(place(door({ w: 0.95, h: 2.1, color: '#3d6e8f' }), { x: R, y: fy, z: -0.9, ry: 90 }));
  g.add(place(box(0.5, 0.12, 1.2, baseM), { x: R + 0.25, y: y0, z: -0.9 }));

  // front-left: round hay bale stack (pyramid) + loose square bales
  const hr = 0.62;
  for (const z of [2.3, 3.6]) g.add(place(hayBale({ r: hr }), { x: -3.9, y: y0, z, ry: 90 }));
  g.add(place(hayBale({ r: hr }), { x: -3.9, y: y0 + hr * 1.6, z: 2.95, ry: 90 }));
  g.add(place(hayBale({ r: hr }), { x: -2.9, y: y0, z: 4.1 }));
  g.add(place(squareBale(), { x: -0.9, y: y0, z: 4.2, ry: 15 }));

  // fence along the west and back edges, a tree in the east-front corner
  g.add(place(fence({ w: 9.6, d: 9.6, h: 0.9, style: 'wire', color: PALETTE.woodDark, sides: ['left'] }), { y: y0 }));
  g.add(place(tree({ kind: 'cone', h: 4.2, seed: 9 }), { x: 3.9, y: y0, z: 3.9 }));
  g.add(place(tree({ kind: 'bush', h: 1.0, seed: 4 }), { x: 2.7, y: y0, z: 4.5 }));
  g.add(place(tree({ kind: 'bush', h: 0.9, seed: 5 }), { x: -4.4, y: y0, z: -4.6 }));
  return g;
}

import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT, ShapeBuilder, polygonArea, shade, canvasTexture, textured,
  lot, patch, prismBlock, box, cylinder, sphere, place, beam, facade, glass, mat, metal, emissive,
  antenna, sign, tree, hedge, streetLamp, bench, columns,
} from '../../src/lib/index.js';

const GOLD = PALETTE.glassGold;
const BRONZE = '#6e5230';
const TRIM = '#d9bf7a';

// Square of side s centred on the origin with its corners cut by c (CCW from above).
function chamfered(s, c) {
  const h = s / 2;
  const pts = [[-h + c, h], [h - c, h], [h, h - c], [h, -h + c], [h - c, -h], [-h + c, -h], [-h, -h + c], [-h, h - c]];
  return polygonArea(pts) < 0 ? pts.reverse() : pts;
}

// Prism whose top is a plane sloping along z: height hFront at z = zFront, hBack at z = zBack.
// Walls carry the facade material with the same bay/floor UVs as prismBlock, so the window grid
// runs straight up into the slanted crown. Returns a mesh with [walls, roof] materials.
function slantedPrism({ points, hFront, hBack, zFront, zBack, wallMat, roofMat, bay }) {
  const { cols, rows } = wallMat.userData;
  const hAt = (z) => hFront + ((z - zFront) / (zBack - zFront)) * (hBack - hFront);
  const b = new ShapeBuilder();
  for (let i = 0; i < points.length; i++) {
    const [x1, z1] = points[i];
    const [x2, z2] = points[(i + 1) % points.length];
    const len = Math.hypot(x2 - x1, z2 - z1);
    const su = Math.max(1, Math.round(len / bay)) / cols;
    const h1 = hAt(z1), h2 = hAt(z2);
    b.quadUV([x1, 0, z1], [x2, 0, z2], [x2, h2, z2], [x1, h1, z1],
      [[0, 0], [su, 0], [su, h2 / FLOOR / rows], [0, h1 / FLOOR / rows]], 0);
  }
  // convex top: fan, ordered so the normal points up
  const top = points.map(([x, z]) => [x, hAt(z), z]);
  const [a, p, q] = top;
  const ny = (p[2] - a[2]) * (q[0] - a[0]) - (p[0] - a[0]) * (q[2] - a[2]);
  b.poly(ny > 0 ? top : top.slice().reverse(), 1);
  const mesh = new THREE.Mesh(b.build(), [wallMat, roofMat]);
  mesh.userData.hAt = hAt;
  return mesh;
}

// Sloping roof glazing: gold panes with bronze glazing bars, 2 x 2 panes per 3.6 m repeat.
function roofGlazing() {
  const tex = canvasTexture(128, 128, (ctx, W, H) => {
    const n = 2, c = W / n;
    for (let i = 0; i < n; i++) {
      for (let j = 0; j < n; j++) {
        const grad = ctx.createLinearGradient(i * c, j * c, (i + 1) * c, (j + 1) * c);
        grad.addColorStop(0, shade(GOLD, 0.45));
        grad.addColorStop(0.55, GOLD);
        grad.addColorStop(1, shade(GOLD, -0.35));
        ctx.fillStyle = grad;
        ctx.fillRect(i * c, j * c, c, c);
      }
    }
    ctx.fillStyle = BRONZE;
    for (let k = 0; k <= n; k++) {
      ctx.fillRect(k * c - 3, 0, 6, H);
      ctx.fillRect(0, k * c - 3, W, 6);
    }
  }, { key: 'gold-glass-tower:roof' });
  tex.repeat.set(1 / 3.6, 1 / 3.6);
  return textured(tex, { roughness: 0.2, metalness: 0.45 });
}

// 1x1 tile (10 x 10 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const tz = -0.8;              // tower centre, pushed back to leave a front plaza
  const S = 8.0, C = 1.6;       // shaft side / chamfer
  const at = (o, p) => place(o, { ...p, z: (p.z ?? 0) + tz });

  // dark stone plinth
  g.add(at(prismBlock({ points: chamfered(S + 0.6, C + 0.25), h: 0.35, floorHeight: 0.35, style: 'plain', wall: PALETTE.stoneDark, roof: PALETTE.stone }), { y: y0 }));
  const yb = y0 + 0.35;

  // lobby: tall bronze-framed storey, recessed under the shaft
  const lobbyH = 4.2;
  g.add(at(prismBlock({ points: chamfered(S - 0.6, C - 0.2), floors: 1, floorHeight: lobbyH, style: 'grid', wall: BRONZE, glass: PALETTE.glassDark, frame: TRIM, lit: 0.7, bay: 1.6, seed: 3, roof: BRONZE }), { y: yb }));
  // gold transfer band over the lobby
  g.add(at(prismBlock({ points: chamfered(S + 0.25, C + 0.1), h: 0.6, floorHeight: 0.6, style: 'plain', wall: TRIM, roof: TRIM }), { y: yb + lobbyH }));

  // shaft: gold curtain wall
  const curtain = { style: 'curtain', glass: GOLD, frame: BRONZE, lit: 0.1, seed: 31 };
  const bay = 1.8;
  const shaftFloors = 8;
  const ys = yb + lobbyH + 0.6;
  g.add(at(prismBlock({ points: chamfered(S, C), floors: shaftFloors, bay, ...curtain }), { y: ys }));
  // bronze spandrel bands every 4 floors
  for (let f = 4; f < shaftFloors; f += 4) {
    g.add(at(prismBlock({ points: chamfered(S + 0.15, C + 0.05), h: 0.3, floorHeight: 0.3, style: 'plain', wall: BRONZE, roof: BRONZE }), { y: ys + f * FLOOR - 0.15 }));
  }
  // vertical gold fins on the four chamfered corners
  const finM = metal(TRIM, { roughness: 0.3 });
  const sh = shaftFloors * FLOOR;
  const ci = S / 2 - C / 2 + 0.05;
  for (const [sx, sz] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
    g.add(at(box(0.22, sh, 0.22, finM), { x: sx * ci, y: ys, z: sz * ci }));
  }

  // slanted crown: low at the front (+z), high at the back
  const yc = ys + sh;
  const crownPts = chamfered(S, C);
  const hFront = 1.0, hBack = 9.0;
  const crown = slantedPrism({ points: crownPts, hFront, hBack, zFront: S / 2, zBack: -S / 2, wallMat: facade(curtain), roofMat: roofGlazing(), bay });
  g.add(at(crown, { y: yc }));
  const hAt = crown.userData.hAt;

  // gold rim round the sloping edge + mullions down the slope
  const rimM = metal(BRONZE, { roughness: 0.3 });
  for (let i = 0; i < crownPts.length; i++) {
    const [x1, z1] = crownPts[i];
    const [x2, z2] = crownPts[(i + 1) % crownPts.length];
    g.add(at(beam([x1, hAt(z1) + 0.05, z1], [x2, hAt(z2) + 0.05, z2], 0.4, rimM), { y: yc }));
  }
  // warm lit band where the crown starts
  const band = prismBlock({ points: chamfered(S + 0.12, C + 0.04), h: 0.35, floorHeight: 0.35, style: 'plain', roof: TRIM });
  band.material = [emissive('#ffd27a', 0.7), mat(TRIM), mat(TRIM)];
  g.add(at(band, { y: yc - 0.35 }));

  // mast on the high back edge
  g.add(at(box(1.2, 0.8, 0.8, mat(PALETTE.steelDark)), { y: yc + hBack - 0.3, z: -S / 2 + 0.7 }));
  g.add(at(antenna({ h: 7, radius: 0.12 }), { y: yc + hBack + 0.4, z: -S / 2 + 0.7 }));

  // entrance canopy + sign
  const fz = tz + (S - 0.6) / 2;     // lobby front face
  const canM = mat(BRONZE, { metalness: 0.4, roughness: 0.4 });
  g.add(place(box(4.2, 0.3, 2.0, canM), { y: y0 + 3.2, z: fz + 1.0 }));
  g.add(place(box(4.3, 0.08, 2.1, metal(TRIM)), { y: y0 + 3.5, z: fz + 1.0 }));
  g.add(place(columns({ count: 2, length: 3.6, radius: 0.1, h: 3.2, material: metal(TRIM) }), { y: y0, z: fz + 1.8 }));
  g.add(place(sign({ text: 'GOLD GLASS', w: 3.6, h: 0.55, bg: BRONZE, fg: '#ffe7a6' }), { y: y0 + 3.6, z: fz + 1.9 }));
  // revolving door
  g.add(place(cylinder(0.75, 0.75, 2.4, glass(PALETTE.glassDark), 12), { y: yb, z: fz + 0.1 }));
  g.add(place(cylinder(0.8, 0.8, 0.15, metal(TRIM), 12), { y: yb + 2.4, z: fz + 0.1 }));
  // entrance mat
  g.add(place(patch(3.6, 2.2, 'cobbles'), { y: y0, z: fz + 1.0 }));

  // front plaza: corner planters with trees, lamps, benches, a gold sphere sculpture
  const planterM = mat(PALETTE.stoneDark);
  for (const x of [-3.9, 3.9]) {
    g.add(place(box(1.6, 0.5, 1.6, planterM), { x, y: y0, z: 4.0 }));
    g.add(place(tree({ kind: 'round', h: 4.2, seed: x > 0 ? 7 : 11 }), { x, y: y0 + 0.5, z: 4.0 }));
    g.add(place(streetLamp({ h: 3.6 }), { x: x * 0.68, y: y0, z: 4.6, ry: x > 0 ? 180 : 0 }));
  }
  g.add(place(bench({ w: 1.4 }), { x: -3.9, y: y0, z: 2.4, ry: 90 }));
  g.add(place(bench({ w: 1.4 }), { x: 3.9, y: y0, z: 2.4, ry: -90 }));

  // sides and back: low hedges and shrubs
  for (const x of [-4.68, 4.68]) {
    g.add(place(hedge({ w: 0.5, h: 0.7, d: 5.2 }), { x, y: y0, z: -2.0 }));
  }
  for (const [x, z, s] of [[-4.2, -4.4, 3], [4.2, -4.4, 5]]) {
    g.add(place(tree({ kind: 'bush', h: 1.3, seed: s }), { x, y: y0, z }));
  }
  return g;
}


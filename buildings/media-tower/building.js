import * as THREE from 'three';
import {
  PALETTE, FLOOR, LOT_HEIGHT,
  lot, patch, facadeBlock, box, cylinder, sphere, place, group, parapet,
  rooftopUnits, antenna, sign, tree, car, streetLamp, bench,
  mat, metal, emissive, textured, canvasTexture,
} from '../../src/lib/index.js';

const SCREEN_GLOW = 0.3;

// Video wall frame: a bright broadcast with a skyline picture, LIVE badge and news ticker.
function newsScreenTexture() {
  return canvasTexture(256, 160, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#2b6fe0');
    sky.addColorStop(0.55, '#ff8a3c');
    sky.addColorStop(1, '#ffd34d');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    // sun
    ctx.fillStyle = '#fff4b0';
    ctx.beginPath();
    ctx.arc(w * 0.68, h * 0.55, 26, 0, Math.PI * 2);
    ctx.fill();
    // skyline silhouette
    ctx.fillStyle = '#2a1840';
    const towers = [[0, 60], [22, 85], [40, 50], [58, 100], [80, 70], [104, 115], [128, 64], [146, 90], [170, 55], [190, 105], [214, 72], [236, 88]];
    for (const [x, th] of towers) ctx.fillRect(x, h - 30 - th * 0.6, 20, th * 0.6 + 30);
    // LIVE badge
    ctx.fillStyle = '#e8202a';
    ctx.fillRect(10, 10, 54, 24);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('LIVE', 16, 23);
    // channel bug
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.fillRect(w - 60, 10, 50, 24);
    ctx.fillStyle = '#1b2f6b';
    ctx.font = 'bold 16px sans-serif';
    ctx.fillText('TTV', w - 50, 23);
    // ticker
    ctx.fillStyle = '#c4141c';
    ctx.fillRect(0, h - 30, 64, 30);
    ctx.fillStyle = '#ffd400';
    ctx.fillRect(64, h - 30, w - 64, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('NEWS', 10, h - 15);
    ctx.fillStyle = '#1a1a1a';
    ctx.fillText('TINY TOWN GROWS!', 74, h - 15);
  }, { key: 'media-tower:news', repeat: false });
}

// Side screen: a loud advert with bold colour blocks.
function adScreenTexture() {
  return canvasTexture(192, 160, (ctx, w, h) => {
    ctx.fillStyle = '#7b1fd1';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ff3fa4';
    ctx.beginPath();
    ctx.moveTo(0, h);
    ctx.lineTo(w, h * 0.25);
    ctx.lineTo(w, h);
    ctx.fill();
    ctx.fillStyle = '#25e0ff';
    ctx.beginPath();
    ctx.arc(w * 0.3, h * 0.38, 34, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 34px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText('FIZZ!', w * 0.62, h * 0.66);
    ctx.fillStyle = '#ffe14a';
    ctx.fillRect(w * 0.22, h * 0.82, w * 0.56, 12);
  }, { key: 'media-tower:ad', repeat: false });
}

// West screen: weather report.
function weatherScreenTexture() {
  return canvasTexture(192, 160, (ctx, w, h) => {
    const sky = ctx.createLinearGradient(0, 0, 0, h);
    sky.addColorStop(0, '#1e90ff');
    sky.addColorStop(1, '#7fd4ff');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffd21f';
    ctx.beginPath();
    ctx.arc(58, 62, 30, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    for (const [x, y, r] of [[78, 82, 20], [100, 76, 24], [122, 86, 18]]) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.fillRect(78, 86, 46, 18);
    ctx.font = 'bold 40px sans-serif';
    ctx.textBaseline = 'middle';
    ctx.fillText('22°', 120, 40);
    ctx.fillStyle = '#0d2a5c';
    ctx.fillRect(0, h - 34, w, 34);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px sans-serif';
    ctx.fillText('WEATHER', 14, h - 17);
  }, { key: 'media-tower:weather', repeat: false });
}

// LED ticker band that wraps the podium.
function tickerTexture() {
  return canvasTexture(512, 32, (ctx, w, h) => {
    ctx.fillStyle = '#0c0c14';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffb21e';
    ctx.font = 'bold 22px monospace';
    ctx.textBaseline = 'middle';
    ctx.fillText('TTV NEWS  +++  WEATHER 22°  +++  SPORTS  +++  ', 6, h / 2 + 1);
  }, { key: 'media-tower:ticker', repeat: true });
}

const screenMat = (tex) => textured(tex, { emissive: '#ffffff', emissiveMap: tex, emissiveIntensity: SCREEN_GLOW, roughness: 0.5 });

// Box with plain 0..1 UVs on every face (lib boxes use metre UVs), base at y = 0.
function uvBox(w, h, d, materials) {
  const geo = new THREE.BoxGeometry(w, h, d);
  geo.translate(0, h / 2, 0);
  return new THREE.Mesh(geo, materials);
}

// Flat panel of size w x h whose picture faces +Z (or +X with face: 'x'), dark bezel on the rest.
function screen(w, h, tex, face = 'z', depth = 0.35) {
  const bezel = mat(PALETTE.black, { roughness: 0.5 });
  const pic = screenMat(tex);
  const g = new THREE.Group();
  if (face === 'z') {
    g.add(box(w + 0.5, h + 0.5, depth, bezel));
    g.add(place(uvBox(w, h, 0.05, [bezel, bezel, bezel, bezel, pic, bezel]), { y: 0.25, z: depth / 2 }));
  } else {
    // face 'x' shows the picture on +X, face '-x' on -X
    const s = face === 'x' ? 1 : -1;
    g.add(box(depth, h + 0.5, w + 0.5, bezel));
    const mats = s > 0 ? [pic, bezel, bezel, bezel, bezel, bezel] : [bezel, pic, bezel, bezel, bezel, bezel];
    g.add(place(uvBox(0.05, h, w, mats), { y: 0.25, x: s * depth / 2 }));
  }
  return g;
}

function satelliteDish(r = 0.9) {
  const m = mat(PALETTE.white, { roughness: 0.4 });
  const post = metal(PALETTE.steelDark);
  const dish = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 6, 0, Math.PI * 2, 0, Math.PI * 0.32), m);
  dish.material.side = THREE.DoubleSide;
  dish.rotation.x = Math.PI; // bowl opens upward...
  const head = new THREE.Group();
  head.add(place(dish, { y: r }));
  head.add(place(cylinder(0.03, 0.03, r * 0.9, post, 4), { y: 0.1 }));
  head.rotation.x = THREE.MathUtils.degToRad(50); // ...then tilt to the sky
  return group(
    cylinder(0.08, 0.1, 0.9, post, 6),
    place(head, { y: 0.9 })
  );
}

// 1x1 tile (10 x 10 m). Front faces +z.
export default function build() {
  const g = new THREE.Group();
  const y0 = LOT_HEIGHT;
  g.add(lot([1, 1], 'paved'));

  const dark = PALETTE.darkGrey;
  const black = mat(PALETTE.black, { roughness: 0.45 });

  // podium: 3 tall storeys, dark stone with smoked glass
  const podW = 9.4, podD = 7.2, podZ = -1.3, podFH = 3.8, podFloors = 3, podH = podFH * podFloors;
  const podFront = podZ + podD / 2;
  g.add(place(facadeBlock({ w: podW, d: podD, floors: podFloors, floorHeight: podFH, style: 'grid', wall: dark, glass: PALETTE.glassDark, frame: PALETTE.black, bay: 2.4, lit: 0.25, seed: 33, roof: PALETTE.concreteDark }), { y: y0, z: podZ }));
  g.add(place(parapet({ w: podW, d: podD, h: 0.5, t: 0.25, material: black }), { y: y0 + podH, z: podZ }));

  // the huge video wall across the podium front, above the entrance
  const scrW = 8.4, scrH = 6.4, scrY = y0 + 4.2;
  g.add(place(screen(scrW, scrH, newsScreenTexture()), { y: scrY, z: podFront + 0.18 }));
  // second screen wrapping the east side
  g.add(place(screen(5.6, 5.6, adScreenTexture(), 'x'), { x: podW / 2 + 0.18, y: y0 + 4.6, z: podZ + 0.4 }));

  // weather screen on the west side
  g.add(place(screen(4.6, 3.8, weatherScreenTexture(), '-x'), { x: -podW / 2 - 0.18, y: y0 + 5.4, z: podZ + 0.9 }));

  // LED ticker band around the podium top
  const tick = tickerTexture();
  const tickMat = (len) => {
    const t = tick.clone();
    t.needsUpdate = true;
    t.repeat.set(len / 9, 1);
    return screenMat(t);
  };
  const tickY = y0 + podH - 0.9;
  const tm = tickMat(podW), ts = tickMat(podD);
  g.add(place(uvBox(podW + 0.12, 0.7, podD + 0.12, [ts, ts, black, black, tm, tm]), { y: tickY, z: podZ }));

  // entrance: glass doors under a black canopy with a lit sign
  const ex = -2.1;
  g.add(place(box(2.8, 2.6, 0.1, mat(PALETTE.glassSky, { roughness: 0.2, metalness: 0.4 })), { x: ex, y: y0, z: podFront + 0.06 }));
  g.add(place(box(3.4, 0.3, 1.6, black), { x: ex, y: y0 + 3, z: podFront + 0.8 }));
  g.add(place(box(3.4, 0.08, 1.6, emissive('#e8f6ff', 0.6)), { x: ex, y: y0 + 2.95, z: podFront + 0.8 }));
  g.add(place(sign({ text: 'TTV', w: 1.6, h: 0.55, bg: '#c4141c', fg: '#ffffff' }), { x: ex, y: y0 + 3.3, z: podFront + 1.4 }));

  // tower: dark curtain wall with black corner fins
  const twW = 7.4, twD = 6, twZ = -1.7, twFloors = 9;
  const twY = y0 + podH + 0.5;
  const twH = twFloors * FLOOR;
  g.add(place(box(twW + 0.4, 0.5, twD + 0.4, black), { y: y0 + podH, z: twZ }));
  g.add(place(facadeBlock({ w: twW, d: twD, floors: twFloors, style: 'curtain', glass: '#26303f', frame: '#14161c', bay: 1.85, lit: 0.08, seed: 34, roof: PALETTE.darkGrey }), { y: twY, z: twZ }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    g.add(place(box(0.45, twH, 0.45, black), { x: sx * twW / 2, y: twY, z: twZ + sz * twD / 2 }));
  }
  // thin LED pinstripes every few floors
  const cyan = emissive('#2ee6ff', 1.1), magenta = emissive('#ff2fb4', 1.1);
  const ring = (led) => [led, led, black, black, led, led]; // glowing sides, dark top
  for (let f = 3; f < twFloors; f += 3) {
    g.add(place(box(twW + 0.5, 0.18, twD + 0.5, ring(cyan)), { y: twY + f * FLOOR - 0.09, z: twZ }));
  }

  // LED crown: stepped tiers, each topped with a glowing band
  let cy = twY + twH;
  const tiers = [
    { w: twW + 0.6, d: twD + 0.6, h: 0.8, led: magenta },
    { w: 6.2, d: 4.9, h: 2.4, led: cyan },
    { w: 4.8, d: 3.6, h: 2.0, led: magenta },
    { w: 3.2, d: 2.4, h: 1.6, led: cyan },
  ];
  for (const t of tiers) {
    g.add(place(box(t.w, t.h, t.d, black), { y: cy, z: twZ }));
    g.add(place(box(t.w + 0.12, 0.6, t.d + 0.12, ring(t.led)), { y: cy + t.h - 0.6, z: twZ }));
    // vertical LED strips on the tier corners
    if (t.h > 1) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      g.add(place(box(0.16, t.h - 0.6, 0.16, t.led === cyan ? magenta : cyan), { x: sx * (t.w / 2 + 0.02), y: cy, z: twZ + sz * (t.d / 2 + 0.02) }));
    }
    cy += t.h;
  }
  g.add(place(cylinder(0.35, 0.45, 1.2, black, 8), { y: cy, z: twZ }));
  g.add(place(antenna({ h: 9, radius: 0.18 }), { y: cy + 1.2, z: twZ }));
  g.add(place(sphere(0.25, cyan, 8), { y: cy + 5, z: twZ }));

  // tower roof hardware beside the crown tiers is hidden; put dishes on the podium roof
  const podRoof = y0 + podH;
  g.add(place(satelliteDish(0.9), { x: -3.4, y: podRoof, z: podFront - 0.9, ry: 20 }));
  g.add(place(satelliteDish(0.65), { x: -1.6, y: podRoof, z: podFront - 0.7, ry: -15 }));
  g.add(place(rooftopUnits({ w: 3, d: 1.2, count: 2, seed: 7, material: mat(PALETTE.steelLight) }), { x: 2.6, y: podRoof, z: podFront - 0.8 }));

  // plaza: cobbles in front of the screen, broadcast van, bench, lamps, small trees
  g.add(place(patch(9.6, podFront > 4 ? 0.5 : 4.9 - podFront, 'cobbles'), { y: y0, z: (podFront + 4.9) / 2 + 0.1 }));
  const van = car({ color: PALETTE.white, kind: 'van' });
  van.add(place(box(4.8, 0.08, 0.12, mat('#c4141c')), { y: 0.75, z: 0.92 }));
  van.add(place(satelliteDish(0.5), { x: -0.8, y: 2.05 }));
  van.add(place(cylinder(0.05, 0.05, 2.4, metal(PALETTE.steelLight), 4), { x: 1.4, y: 2.05 }));
  g.add(place(van, { x: 2.35, y: y0, z: 3.9 }));
  g.add(place(bench({ w: 1.5 }), { x: -2.1, y: y0, z: 4.55, ry: 180 }));
  g.add(place(streetLamp({ h: 4 }), { x: -4.5, y: y0, z: 4.6 }));
  g.add(place(box(0.9, 0.45, 0.9, mat(PALETTE.stoneDark)), { x: -4.4, y: y0, z: 3.0 }));
  g.add(place(tree({ kind: 'bush', h: 1.3, seed: 12 }), { x: -4.4, y: y0 + 0.45, z: 3.0 }));
  return g;
}

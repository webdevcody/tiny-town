# Contributing a building

> **Run `npm run setup` first on any new box.** It installs npm dependencies,
> headless Chrome and its system libraries (via `sudo apt-get` when needed),
> renders a test shot, and ends with `SETUP PASS` or `SETUP FAIL: <reason>`.
> It is idempotent: a second run skips everything and takes ~10 s.

Tiny Town is being built by many agents at once: **one building per PR**, all
PRs mergeable in any order with zero conflicts. That only works if every PR
stays inside its own folder.

## The rules

1. **Touch only `buildings/<slug>/`.** Nothing else, not even a typo fix.
2. **Add no dependencies.** Do not change `package.json` or `package-lock.json`.
3. **Do not edit shared files:** `src/lib/**` (frozen), `src/app/**`, `index.html`,
   `view.html`, `town.html`, `shots.html`, `vite.config.js`, `scripts/**`,
   `CATALOGUE.md`, `README.md`, this file. The gallery finds your building on
   its own; there is no list to register it in.
4. Use the **slug, name, category and footprint from [CATALOGUE.md](CATALOGUE.md)**.
5. Run **`npm run check -- <slug>`** and **`npm run shots -- <slug>`** before
   opening the PR, and commit the shots.
6. PR title: **`Building: <Name>`** (e.g. `Building: Brick Cottage`).
7. PR body embeds the shot PNGs (template below).

If you think `src/lib` is missing something, build it locally in your own folder
(e.g. `buildings/<slug>/parts.js`) instead of changing the lib.

## Workflow

```bash
npm run setup                    # once per box; must print SETUP PASS
git checkout -b building/<slug>
mkdir -p buildings/<slug>
# write buildings/<slug>/meta.json and buildings/<slug>/building.js
npm run dev                      # open http://localhost:5173/view.html?b=<slug>
npm run check -- <slug>          # must print ✓
npm run shots -- <slug>          # writes buildings/<slug>/shots/*.png
# look at the PNGs, iterate, re-run shots
git add buildings/<slug>
git commit -m "Building: <Name>"
git push -u origin building/<slug>
```

## Folder layout

```
buildings/<slug>/
  building.js     required: default-exports build()
  meta.json       required
  shots/          written by `npm run shots` (iso-ne, iso-nw, iso-se, iso-sw, front, top .png)
  *.js            optional helper modules, imported relatively from building.js
```

Only `.js/.mjs`, `meta.json`, `.png/.jpg` and `.md` files are allowed.

### meta.json

```json
{
  "name": "Brick Cottage",
  "category": "residential",
  "footprint": [1, 1],
  "description": "Small single-storey red-brick cottage with a steep slate gable roof, chimney and a picket-fenced garden."
}
```

`category` is one of `residential, commercial, office, civic, industrial,
transport, utilities, leisure, farm`. `footprint` is `[w, d]` in tiles (w along X, d along Z).

### building.js — the contract

```js
import * as THREE from 'three';
import { PALETTE, FLOOR, LOT_HEIGHT, lot, facadeBlock, hipRoof, place } from '../../src/lib/index.js';

export default function build() {
  const g = new THREE.Group();
  g.add(lot([1, 1], 'grass'));                       // ground slab = whole footprint
  const y = LOT_HEIGHT;                              // build on top of the lot
  g.add(place(facadeBlock({ w: 7, d: 6, floors: 2, wall: PALETTE.cream }), { y }));
  g.add(place(hipRoof({ w: 7, d: 6, h: 2.5 }), { y: y + 2 * FLOOR }));
  return g;
}
```

- **Default export** a function that **synchronously returns a `THREE.Group`**. It
  receives `{ slug, meta }` but does not need them.
- **Origin = centre of the footprint, on the ground (y = 0).** Nothing below y = 0.
- **Fit the footprint:** everything within `±w*TILE/2` on X and `±d*TILE/2` on Z
  (0.3 m tolerance). 1 world unit = 1 metre, `TILE = 10`, `FLOOR = 3`.
- **Front faces +Z** (south). That is the `front` shot and the street side.
- **Deterministic:** no `Math.random()`; use `rng(seed)` from the lib.
- **Imports allowed:** `three`, `three/addons/...`, `../../src/lib/index.js`
  (or any file in `src/lib`), and files inside your own folder. Nothing else:
  no other packages, no other buildings, no `fetch`, no `import.meta.glob`.
- Make canvas textures with `canvasTexture()` from the lib, never
  `document.createElement('canvas')` (check runs in Node without a DOM).
- Budget: aim for **< 120k triangles and < 4000 meshes** (check warns above that,
  fails above 300k triangles). Lib materials are cached, so reuse is free.

`npm run check -- <slug>` enforces all of the above, plus that your branch has
no changes outside `buildings/<slug>/` (compared with `origin/main`; pass
`--no-git` to skip that part).

## Style guide (OpenTTD-ish)

Look at the reference: an OpenTTD-style isometric city. Aim for:

- Bright, slightly saturated colours from `PALETTE`; chunky, readable forms.
- Clearly visible window grids (`facadeBlock`, `prismBlock`, `facadeCylinder`).
- Every building sits on a `lot()` and has some life around it: trees, cars,
  fences, signs, lamps, parking, crops… matching the building.
- Details should read from the iso views at 800×600; skip tiny invisible detail.
- Fill the footprint sensibly (gardens, yards, plazas) — the lot is the tile.

## Shots

`npm run shots -- <slug>` starts a Vite server, opens `shots.html` in headless
Chrome with **software WebGL (SwiftShader)** and writes six 800×600 PNGs
(256-colour, ~50–150 KB each): `iso-ne`, `iso-nw`, `iso-se`, `iso-sw`
(orthographic, 30° elevation, camera in that corner), `front` (from +Z, 8°
elevation) and `top`. Framing is computed from the bounding box of your
building plus its footprint, so all buildings are shot the same way.

- One building takes ~7–10 s including server + browser start-up.
- `npm run shots` with no slug re-shoots every building (only do that on main).
- `--size=1200x900` changes the resolution (keep the default for PRs).
- Needs Chrome's system libraries; `npm run setup` installs them. To do it by hand on Debian/Ubuntu:
  ```bash
  sudo apt-get install -y libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \
    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 \
    libcairo2 libx11-xcb1 libxshmfence1 libdbus-1-3 fonts-liberation
  npx puppeteer browsers install chrome-headless-shell   # if the browser download was skipped
  ```
  Chrome flags used: `--use-angle=swiftshader --enable-unsafe-swiftshader --use-gl=angle --ignore-gpu-blocklist --no-sandbox`.

## PR template

Title: `Building: <Name>`

```markdown
Adds **<Name>** (`<slug>`, <category>, <w>x<d> tiles).

<one or two sentences about the design>

| iso-se | iso-sw |
|---|---|
| ![iso-se](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/iso-se.png) | ![iso-sw](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/iso-sw.png) |
| **iso-ne** | **iso-nw** |
| ![iso-ne](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/iso-ne.png) | ![iso-nw](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/iso-nw.png) |
| **front** | **top** |
| ![front](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/front.png) | ![top](https://raw.githubusercontent.com/webdevcody/tiny-town/<branch>/buildings/<slug>/shots/top.png) |

- [x] `npm run check -- <slug>` passes
- [x] only `buildings/<slug>/` is changed
```

`<branch>` is your PR branch name as-is (slashes are fine, e.g. `building/brick-cottage`).

---

# `src/lib` API guide

Import everything from `../../src/lib/index.js`. All parts return an
`Object3D` whose **origin is the centre of its base**; position them with
`place()`. Sizes are metres. Any `material` argument also accepts a colour string.

### Units & randomness — `units.js`, `random.js`

| export | meaning |
|---|---|
| `TILE` (10), `FLOOR` (3), `LOT_HEIGHT` (0.15) | metres per tile / storey / lot slab |
| `tiles(n)`, `floors(n)` | `n * TILE`, `n * FLOOR` |
| `footprintSize([w, d])` | `{ width, depth, halfW, halfD }` in metres |
| `rng(seed)` | deterministic RNG: `r()`, `r.range(a,b)`, `r.int(a,b)`, `r.pick(arr)`, `r.chance(p)`, `r.shuffle(arr)` |

### Colours — `palette.js`

`PALETTE.<name>`: ground (`grass, dirt, sand, gravel, asphalt, concrete, pavement, paving`…),
walls (`white, cream, beige, sandstone, peach, pink, brick, brickDark, brickBrown, stone, plasterBlue`…),
roofs (`roofRed, terracotta, roofBrown, roofSlate, roofGrey, roofGreen, roofBlue, roofBlack, thatch`),
glass/metal (`glassBlue, glassSky, glassTeal, glassGreen, glassDark, glassGold, glassBronze, window, windowLit, frame, steel, steelLight, steelDark, aluminium, rust, chrome`),
nature (`wood, woodDark, trunk, foliage, foliageDark, foliageLight, autumn, hay, wheat, water, pool`),
accents (`red, orange, yellow, green, blue, navy, purple, black, darkGrey, grey, lightGrey`).
`SWATCHES.houseWalls | roofs | bricks | glass | containers | cars | awnings | foliage` are arrays for `r.pick()`.

### Materials — `materials.js` (cached; same args → same instance)

| export | notes |
|---|---|
| `mat(color, opts)` | flat-shaded `MeshStandardMaterial`; opts: `roughness, metalness, emissive, transparent, opacity, side…` |
| `glass(color, { opacity })` | reflective glass |
| `metal(color, { roughness })` | metallic |
| `emissive(color, intensity)` | neon, lamps, screens, lit windows |
| `water(color)` | rippled water |
| `surface(kind, color, { size, color2, seed, roughness, metalness })` | tiling texture, `size` metres per repeat. kinds: `brick roofTiles shingles corrugated planks paving cobbles grass gravel asphalt concrete water solar stripes hazard` |
| `field(crop, { size })` | crop rows: `wheat corn cabbage vineyard sunflower plowed orchard flowers` |
| `facade(opts)` | window-grid material (use the facade parts instead) |
| `textured(texture, opts)` | material from your own `canvasTexture()` |
| `MAT.*` | presets: `white concrete concreteDark asphalt pavement brick stone wood woodDark roofRed roofSlate roofGrey roofGreen glass glassDark window windowLit steel steelDark aluminium rust corrugated water pool foliage foliageDark foliageLight trunk grass dirt gravel sand paving hazard solar black red yellow` |

### Textures — `textures.js`

| export | notes |
|---|---|
| `canvasTexture(w, h, (ctx, w, h) => {...}, { key, repeat, nearest })` | your own canvas texture; works in Node. Give a unique `key` like `'<slug>:logo'` |
| `facadeTexture(opts)` | window grid (see `facadeBlock`) |
| `surfaceTexture(kind, color, opts)`, `fieldTexture(crop)` | raw textures behind `surface()` / `field()` |
| `signTexture(text, { bg, fg, font, width, height, border })` | text on a background |
| `shade(hex, amt)` | lighten (`amt > 0`) / darken (`amt < 0`) a colour |

### Facades (window grids) — `parts.js`

Common facade options: `style` (`'punched' | 'ribbon' | 'curtain' | 'grid' | 'brick' | 'industrial' | 'shop' | 'plain'`),
`wall, glass, frame` colours, `lit` (0..1 lit windows), `windowW, windowH` (fraction of a bay, punched/brick),
`shutters` (colour), `seed`, `bay` (window spacing in m, rounded to fit), `floorHeight` (default `FLOOR`),
`roof` (top-face colour/material). Windows always line up with whole storeys and bays.

| export | notes |
|---|---|
| `facadeBlock({ w, d, floors \| h, …facade, blank: ['left','back'…] })` | box of storeys; `blank` sides get a plain wall (party walls, garage fronts) |
| `facadeCylinder({ radius, radiusTop, floors \| h, segments, …facade })` | round tower |
| `prismBlock({ points: [[x,z]…], floors \| h, …facade })` | any polygon footprint: L-shapes, chamfered/octagonal towers, wedges |
| `tower({ w, d, floors, ground: { style: 'shop', … }, …facade })` | ground floor + upper floors stack (`group.userData.height`) |

### Roofs (base y = 0 = top of the walls; `w, d` = wall footprint)

| export | notes |
|---|---|
| `gableRoof({ w, d, h, overhang, ridge: 'x' \| 'z', material, gableMaterial })` | two slopes; `gableMaterial` = wall colour for the triangles |
| `hipRoof({ w, d, h, overhang, material })` | four slopes (pyramid when square) |
| `pyramidRoof({ w, d, h, overhang, material })` | four slopes to a point |
| `shedRoof({ w, d, h, overhang, material, wallMaterial })` | single slope, high at the back |
| `mansardRoof({ w, d, h, inset, material, topMaterial })` | steep sides, flat top |
| `dome({ radius, height, material, drum, drumMaterial })` | hemisphere, optional drum |
| `barrelRoof({ w, d, h, axis, material, endMaterial })` | half-cylinder vault (halls, stations, hangars) |
| `sawtoothRoof({ w, d, h, teeth, material, glassMaterial })` | factory roof, glazing faces north |
| `parapet({ w, d, h, t, material })` | low wall round a flat roof |
| `rooftopUnits({ w, d, count, seed })` | AC boxes / vents |
| `helipad({ size })` | H pad |

### Geometry & basics

| export | notes |
|---|---|
| `group(...objs)`, `place(obj, { x, y, z, rx, ry, rz, s })` | rotations in **degrees** |
| `box(w, h, d, material)` | base at y = 0; `material` may be an array of 6 (`+x, -x, top, bottom, +z front, -z back`) |
| `boxFaces(w, h, d, { sides, top, bottom, front, back, left, right })` | per-face materials |
| `cylinder(rTop, rBottom, h, material, segments)`, `cone(r, h, …)`, `sphere(r, …)` | base on y = 0 |
| `extrude(points, h, material, topMaterial)` | vertical prism from `[[x,z]…]` |
| `taperedBlock({ w, d, h, topW, topD, material, topMaterial })` | frustum: plinths, tapering towers |
| `beam(from, to, thickness, material)`, `pipe(from, to, radius, material)`, `pipeRun(points, radius)` | between points `[x,y,z]` |
| `lattice({ w, d, h, topW, topD, segments, thickness })` | braced tower: pylons, masts, crane towers |
| `truss({ length, w, h, segments })` | horizontal braced girder along +X from the origin |
| `ShapeBuilder` | custom low-poly meshes: `.quad(a,b,c,d, group)`, `.tri()`, `.poly()`, `.build()`; CCW from outside, UVs in metres |
| `boxGeometry`, `cylinderGeometry`, `extrudeGeometry`, `polygonArea` | raw geometry helpers |

### Details & props

| export | notes |
|---|---|
| `chimney({ w, d, h })`, `smokestack({ radius, topRadius, h, color, bandColor, bands })` | |
| `tank({ radius, h, roof: 'dome'\|'cone'\|'flat', legs, legHeight })`, `sphereTank({ radius, legs })`, `silo({ radius, h, roof })` | |
| `columns({ count, length, radius, h, axis, square })` | colonnades, canopy posts |
| `awning({ w, depth, drop, color, color2 })` | striped, origin at its back top edge, sticks out to +Z |
| `door({ w, h, color })`, `windowPanel({ w, h, lit })` | thin slabs sticking out to +Z — place on a wall face |
| `sign({ text, w, h, bg, fg, double })`, `billboard({ text, w, h, poleH })` | text faces +Z |
| `antenna({ h, light })`, `spire({ radius, h })`, `flag({ h, color, color2 })`, `streetLamp({ h })`, `bench({ w })` | |
| `stairs({ w, h, d, steps })` | rises towards -Z |
| `solarPanel({ w, d, tilt })` | faces +Z |
| `car({ color, kind: 'car'\|'van'\|'taxi' })`, `truck({ color, trailerColor })`, `container({ color, length })` | length along X |

### Ground & landscaping

| export | notes |
|---|---|
| `lot([w, d], surface)` | the tile slab, exactly the footprint; surfaces `LOT_SURFACES`: `grass paved concrete asphalt dirt sand gravel cobbles water` |
| `patch(w, d, surface)` | thin paths, yards, plazas on top of the lot |
| `tree({ kind: 'round'\|'cone'\|'poplar'\|'palm'\|'bush'\|'autumn', h, seed, color })` | low-poly trees |
| `scatter({ w, d, count, seed, minGap, avoid: [{x,z,w,d}], make: (r, i) => obj })` | random placement inside a rectangle |
| `hedge({ w, h, d })`, `fence({ w, d, h, style: 'picket'\|'wire'\|'wall'\|'railing', sides, gap })` | |
| `pool({ w, d })` | swimming pool with coping |
| `parkingLot({ w, d, seed, fill })` | asphalt, bay lines, parked cars |
| `cropField({ w, d, crop })`, `hayBale({ r })` | farms |

The two example buildings, [`buildings/suburban-house-pool`](buildings/suburban-house-pool/building.js)
and [`buildings/glass-skyscraper`](buildings/glass-skyscraper/building.js), show
these helpers in use.

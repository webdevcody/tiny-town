#!/usr/bin/env node
// npm run check -- <slug> [<slug> ...]   check specific buildings (+ git scope check)
// npm run check                          check every building
//
// Fails when a building:
//   - imports/references anything outside buildings/<slug>/ and src/lib/
//     (the `three` package and three/addons/* are allowed)
//   - has a missing/invalid meta.json
//   - does not default-export a function that returns a THREE.Group
//   - is not centred on its footprint / sits below the ground / is not deterministic
//   - (single slug, inside git) changes files outside buildings/<slug>/
// Flags: --no-git  skip the git scope check.

import * as THREE from 'three';
import { readdir, readFile, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative, dirname, extname, sep } from 'node:path';
import { pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';
import { TILE } from '../src/lib/units.js';

const ROOT = resolve(import.meta.dirname, '..');
const BUILDINGS_DIR = join(ROOT, 'buildings');
const LIB_DIR = join(ROOT, 'src', 'lib');

export const CATEGORIES = ['residential', 'commercial', 'office', 'civic', 'industrial', 'transport', 'utilities', 'leisure', 'farm'];
const VIEWS = ['iso-ne', 'iso-nw', 'iso-se', 'iso-sw', 'front', 'top'];
const ALLOWED_EXT = new Set(['.js', '.mjs', '.json', '.png', '.jpg', '.jpeg', '.md']);
const FOOTPRINT_TOLERANCE = 0.3; // metres a building may poke out of its footprint
const GROUND_TOLERANCE = 0.05; // metres below y=0 allowed

const args = process.argv.slice(2);
const noGit = args.includes('--no-git');
const requested = args.filter((a) => !a.startsWith('--')).map((a) => a.replace(/^buildings\//, '').replace(/\/$/, ''));

async function walk(dir) {
  const out = [];
  for (const d of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, d.name);
    if (d.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

function isInside(file, dir) {
  const rel = relative(dir, file);
  return rel && !rel.startsWith('..') && !rel.startsWith(sep) && !/^[a-zA-Z]:/.test(rel);
}

// ---------------------------------------------------------------------------
// static import analysis

const SPECIFIER_PATTERNS = [
  /\bimport\s+[^'"`;]*?\bfrom\s*(['"`])([^'"`]+)\1/g, // import x from '...'
  /\bimport\s*(['"`])([^'"`]+)\1/g, // import '...'
  /\bexport\s+[^'"`;]*?\bfrom\s*(['"`])([^'"`]+)\1/g, // export ... from '...'
  /\bimport\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, // import('...')
  /\brequire\s*\(\s*(['"`])([^'"`]+)\1\s*\)/g, // require('...')
  /\bnew\s+URL\s*\(\s*(['"`])([^'"`]+)\1/g, // new URL('...', import.meta.url)
];

function stripComments(src) {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|[^:'"`\\])\/\/.*$/gm, '$1');
}

function checkSpecifier(spec, file, slugDir, problems) {
  const relFile = relative(ROOT, file);
  if (spec === 'three' || spec.startsWith('three/addons/') || spec.startsWith('three/examples/jsm/')) return;
  let target;
  if (spec.startsWith('./') || spec.startsWith('../')) target = resolve(dirname(file), spec);
  else if (spec.startsWith('/')) target = join(ROOT, spec);
  else {
    problems.push(`${relFile}: imports "${spec}" — only 'three', 'three/addons/*', your own folder and src/lib are allowed (no new dependencies)`);
    return;
  }
  if (isInside(target, slugDir) || isInside(target, LIB_DIR)) {
    if (!existsSync(target)) problems.push(`${relFile}: "${spec}" does not exist`);
    return;
  }
  problems.push(`${relFile}: references "${spec}" outside buildings/${relative(BUILDINGS_DIR, slugDir)}/ and src/lib/`);
}

async function checkSources(slug, slugDir, problems, warnings) {
  const files = await walk(slugDir);
  for (const f of files) {
    const rel = relative(slugDir, f);
    const ext = extname(f).toLowerCase();
    if (!ALLOWED_EXT.has(ext)) problems.push(`buildings/${slug}/${rel}: file type ${ext || '(none)'} not allowed`);
    if (ext === '.json' && rel !== 'meta.json') problems.push(`buildings/${slug}/${rel}: only meta.json is allowed as JSON`);
    if (/(^|\/)(package\.json|node_modules)/.test(rel)) problems.push(`buildings/${slug}/${rel}: no packages inside a building`);
    const size = (await stat(f)).size;
    if (size > 1024 * 1024) warnings.push(`buildings/${slug}/${rel} is ${Math.round(size / 1024)} KB — keep files small`);
    if (ext !== '.js' && ext !== '.mjs') continue;
    const raw = await readFile(f, 'utf8');
    const src = stripComments(raw);
    for (const re of SPECIFIER_PATTERNS) {
      re.lastIndex = 0;
      for (const m of src.matchAll(re)) checkSpecifier(m[2], f, slugDir, problems);
    }
    if (/\bimport\s*\(\s*[^'"`\s)]/.test(src)) problems.push(`buildings/${slug}/${rel}: dynamic import() with a non-literal path`);
    if (/import\.meta\.glob/.test(src)) problems.push(`buildings/${slug}/${rel}: import.meta.glob is not allowed in buildings`);
    if (/\bfetch\s*\(/.test(src)) problems.push(`buildings/${slug}/${rel}: fetch() is not allowed — buildings must be self-contained`);
    if (/Math\.random\s*\(/.test(src)) problems.push(`buildings/${slug}/${rel}: Math.random() makes shots non-deterministic — use rng(seed) from src/lib`);
    if (/document\.createElement\s*\(\s*['"]canvas/.test(src)) problems.push(`buildings/${slug}/${rel}: use canvasTexture() from src/lib instead of document.createElement('canvas') (it must work in Node for npm run check)`);
  }
  return files;
}

// ---------------------------------------------------------------------------
// meta.json

async function checkMeta(slug, slugDir, problems, warnings, catalogue) {
  const p = join(slugDir, 'meta.json');
  if (!existsSync(p)) {
    problems.push(`buildings/${slug}/meta.json is missing`);
    return null;
  }
  let meta;
  try {
    meta = JSON.parse(await readFile(p, 'utf8'));
  } catch (err) {
    problems.push(`buildings/${slug}/meta.json is not valid JSON: ${err.message}`);
    return null;
  }
  const where = `buildings/${slug}/meta.json`;
  if (typeof meta !== 'object' || Array.isArray(meta) || !meta) {
    problems.push(`${where}: must be an object`);
    return null;
  }
  if (typeof meta.name !== 'string' || !meta.name.trim()) problems.push(`${where}: "name" must be a non-empty string`);
  if (!CATEGORIES.includes(meta.category)) problems.push(`${where}: "category" must be one of ${CATEGORIES.join(', ')}`);
  const fp = meta.footprint;
  if (!Array.isArray(fp) || fp.length !== 2 || !fp.every((n) => Number.isInteger(n) && n >= 1 && n <= 6))
    problems.push(`${where}: "footprint" must be [w, d] with integer tiles 1..6`);
  if (typeof meta.description !== 'string' || meta.description.trim().length < 10) problems.push(`${where}: "description" must be a sentence (≥ 10 chars)`);
  const extra = Object.keys(meta).filter((k) => !['name', 'category', 'footprint', 'description'].includes(k));
  if (extra.length) warnings.push(`${where}: unknown keys ${extra.join(', ')}`);
  const c = catalogue.get(slug);
  if (!c) warnings.push(`${slug} is not in CATALOGUE.md`);
  else {
    if (c.category !== meta.category) warnings.push(`${where}: category "${meta.category}" differs from CATALOGUE.md ("${c.category}")`);
    if (Array.isArray(fp) && c.footprint.join('x') !== fp.join('x'))
      warnings.push(`${where}: footprint ${fp.join('x')} differs from CATALOGUE.md (${c.footprint.join('x')})`);
  }
  return meta;
}

// ---------------------------------------------------------------------------
// runtime: build it in Node and inspect the result

function summarize(obj) {
  const box = new THREE.Box3().setFromObject(obj, true);
  let meshes = 0, tris = 0, bad = 0;
  obj.traverse((o) => {
    if (!o.isMesh) return;
    meshes++;
    const g = o.geometry;
    if (!g || !g.attributes?.position) {
      bad++;
      return;
    }
    tris += (g.index ? g.index.count : g.attributes.position.count) / 3;
    const arr = g.attributes.position.array;
    for (let i = 0; i < arr.length; i++) if (!Number.isFinite(arr[i])) {
      bad++;
      break;
    }
    if (!o.material) bad++;
  });
  return { box, meshes, tris: Math.round(tris), bad };
}

async function checkRuntime(slug, slugDir, meta, problems, warnings) {
  const file = join(slugDir, 'building.js');
  if (!existsSync(file)) {
    problems.push(`buildings/${slug}/building.js is missing`);
    return null;
  }
  let mod;
  try {
    mod = await import(pathToFileURL(file).href);
  } catch (err) {
    problems.push(`buildings/${slug}/building.js failed to import: ${err.message}`);
    return null;
  }
  if (typeof mod.default !== 'function') {
    problems.push(`buildings/${slug}/building.js must \`export default function build() { ... }\``);
    return null;
  }
  const run = () => mod.default({ slug, meta });
  let obj;
  try {
    obj = run();
  } catch (err) {
    problems.push(`build() threw: ${err.stack?.split('\n').slice(0, 3).join('\n    ') ?? err}`);
    return null;
  }
  if (obj && typeof obj.then === 'function') {
    problems.push('build() must return a THREE.Group synchronously (not a Promise)');
    return null;
  }
  if (!(obj instanceof THREE.Group)) {
    problems.push(`build() must return a THREE.Group (got ${obj?.constructor?.name ?? typeof obj})`);
    return null;
  }
  const s = summarize(obj);
  if (s.meshes === 0 || s.box.isEmpty()) {
    problems.push('build() returned an empty group');
    return s;
  }
  if (s.bad) problems.push(`${s.bad} mesh(es) have missing geometry/material or NaN positions`);
  const size = s.box.getSize(new THREE.Vector3());
  if (s.box.min.y < -GROUND_TOLERANCE) problems.push(`building goes below the ground: min y = ${s.box.min.y.toFixed(2)} (origin must be on the ground, y = 0)`);
  if (size.y < 0.5) problems.push(`building is only ${size.y.toFixed(2)} m tall`);
  if (meta && Array.isArray(meta.footprint)) {
    const hw = (meta.footprint[0] * TILE) / 2 + FOOTPRINT_TOLERANCE;
    const hd = (meta.footprint[1] * TILE) / 2 + FOOTPRINT_TOLERANCE;
    const { min, max } = s.box;
    if (min.x < -hw || max.x > hw || min.z < -hd || max.z > hd)
      problems.push(
        `building does not fit its ${meta.footprint.join('x')} footprint centred on the origin: ` +
          `x ${min.x.toFixed(2)}..${max.x.toFixed(2)} (limit ±${hw.toFixed(2)}), z ${min.z.toFixed(2)}..${max.z.toFixed(2)} (limit ±${hd.toFixed(2)})`
      );
  }
  if (s.tris > 300000) problems.push(`${s.tris} triangles — far too heavy (limit 300k)`);
  else if (s.tris > 120000) warnings.push(`${s.tris} triangles — consider simplifying (aim for < 120k)`);
  if (s.meshes > 4000) warnings.push(`${s.meshes} meshes — consider merging/simplifying (aim for < 4000)`);
  // determinism
  try {
    const s2 = summarize(run());
    if (s2.tris !== s.tris || !s2.box.equals(s.box)) problems.push('build() is not deterministic (two calls gave different results) — use rng(seed)');
  } catch (err) {
    problems.push(`second build() call threw: ${err.message}`);
  }
  return s;
}

// ---------------------------------------------------------------------------
// git scope: a building PR may only touch buildings/<slug>/

function gitScope(slug, problems, notes) {
  const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
  try {
    git('rev-parse', '--git-dir');
  } catch {
    notes.push('not a git checkout — skipped scope check');
    return;
  }
  let base;
  for (const ref of ['origin/main', 'main']) {
    try {
      base = git('merge-base', 'HEAD', ref);
      break;
    } catch {}
  }
  if (!base) {
    notes.push('no origin/main to compare with — skipped scope check (git fetch origin main)');
    return;
  }
  const changed = new Set(
    [
      git('diff', '--name-only', base),
      git('diff', '--name-only', '--cached', base),
      git('ls-files', '--others', '--exclude-standard'),
    ]
      .join('\n')
      .split('\n')
      .filter(Boolean)
  );
  const outside = [...changed].filter((f) => !f.startsWith(`buildings/${slug}/`));
  if (outside.length && changed.size > 0) {
    // on main itself (base === HEAD and nothing changed) this is empty
    problems.push(`files changed outside buildings/${slug}/ (a building PR may only touch its own folder):\n    ` + outside.join('\n    '));
  }
}

// ---------------------------------------------------------------------------

async function loadCatalogue() {
  const p = join(ROOT, 'CATALOGUE.md');
  const map = new Map();
  if (!existsSync(p)) return map;
  for (const line of (await readFile(p, 'utf8')).split('\n')) {
    if (!/^\|\s*\d+\s*\|/.test(line)) continue;
    const c = line.split('|').slice(1, -1).map((s) => s.trim());
    map.set(c[1].replace(/`/g, ''), { name: c[2], category: c[3], footprint: c[4].split('x').map(Number) });
  }
  return map;
}

async function main() {
  const catalogue = await loadCatalogue();
  let slugs = requested;
  if (!slugs.length) {
    slugs = (await readdir(BUILDINGS_DIR, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
  }
  let failed = 0;
  for (const slug of slugs) {
    const problems = [], warnings = [], notes = [];
    const slugDir = join(BUILDINGS_DIR, slug);
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug)) problems.push(`slug "${slug}" must be lowercase kebab-case`);
    if (!existsSync(slugDir)) {
      console.log(`✗ ${slug}\n    buildings/${slug}/ does not exist`);
      failed++;
      continue;
    }
    await checkSources(slug, slugDir, problems, warnings);
    const meta = await checkMeta(slug, slugDir, problems, warnings, catalogue);
    const s = await checkRuntime(slug, slugDir, meta, problems, warnings);
    const missingShots = VIEWS.filter((v) => !existsSync(join(slugDir, 'shots', `${v}.png`)));
    if (missingShots.length) warnings.push(`missing shots: ${missingShots.join(', ')} — run: npm run shots -- ${slug}`);
    if (requested.length === 1 && !noGit) gitScope(slug, problems, notes);

    const stats = s?.box && !s.box.isEmpty()
      ? (() => {
          const sz = s.box.getSize(new THREE.Vector3());
          return ` (${sz.x.toFixed(1)}×${sz.z.toFixed(1)}×${sz.y.toFixed(1)} m, ${s.meshes} meshes, ${s.tris} tris)`;
        })()
      : '';
    console.log(`${problems.length ? '✗' : '✓'} ${slug}${stats}`);
    for (const p of problems) console.log(`    ✗ ${p}`);
    for (const w of warnings) console.log(`    ⚠ ${w}`);
    for (const n of notes) console.log(`    · ${n}`);
    if (problems.length) failed++;
  }
  console.log(failed ? `\n${failed} building(s) failed the check` : `\nall ${slugs.length} building(s) passed`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

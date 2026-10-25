#!/usr/bin/env node
// npm run world -- [--out=<dir>] [--size=1600x1000] [--seconds=6] [--close=<slug>]
//
// Opens world.html in headless Chrome (software WebGL, like `npm run shots`),
// measures FPS and renderer.info draw calls, and writes three screenshots:
// world-wide.png (whole town), world-close.png (fly-to close-up) and
// world-rotated.png (one quarter turn). Default output: docs/world/.

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import { mkdir, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// same software-WebGL flags as scripts/shots.mjs (importing it would run it)
const CHROME_ARGS = ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--use-gl=angle', '--ignore-gpu-blocklist', '--enable-webgl'];

const ROOT = resolve(import.meta.dirname, '..');
const opts = { out: join(ROOT, 'docs', 'world'), width: 1600, height: 1000, seconds: 6, close: null };
for (const a of process.argv.slice(2)) {
  if (a.startsWith('--out=')) opts.out = resolve(a.slice(6));
  else if (a.startsWith('--size=')) [opts.width, opts.height] = a.slice(7).split('x').map(Number);
  else if (a.startsWith('--seconds=')) opts.seconds = Number(a.slice(10));
  else if (a.startsWith('--close=')) opts.close = a.slice(8);
}

const server = await createServer({ root: ROOT, logLevel: 'error', server: { host: '127.0.0.1', port: 0, hmr: false }, clearScreen: false });
await server.listen();
const { port } = server.httpServer.address();
const browser = await puppeteer.launch({ headless: 'shell', args: CHROME_ARGS, protocolTimeout: 600000 });
let code = 0;
try {
  const page = await browser.newPage();
  page.on('pageerror', (e) => console.error('  page error:', e.message));
  page.on('console', (m) => m.type() === 'error' && console.error('  console:', m.text()));
  await page.setViewport({ width: opts.width, height: opts.height });
  const t0 = Date.now();
  const open = async () => {
    await page.goto(`http://127.0.0.1:${port}/world.html`, { waitUntil: 'load', timeout: 300000 });
    await page.waitForFunction('window.__world && window.__world.ready === true', { timeout: 300000, polling: 500 });
  };
  try {
    await open();
  } catch (err) {
    // Vite may reload the page once after optimising dependencies
    if (!/context was destroyed|detached/i.test(err.message)) throw err;
    await open();
  }
  const info = await page.evaluate(() => window.__world.info);
  console.log(`loaded in ${((Date.now() - t0) / 1000).toFixed(1)}s:`, JSON.stringify(info));

  const measure = (label) =>
    page.evaluate(async (seconds) => {
      const w = window.__world;
      await new Promise((r) => setTimeout(r, 1500)); // settle (first frames compile shaders)
      let frames = 0;
      const start = performance.now();
      await new Promise((resolve) => {
        const tick = () => {
          frames++;
          if (performance.now() - start < seconds * 1000) requestAnimationFrame(tick);
          else resolve();
        };
        requestAnimationFrame(tick);
      });
      const s = w.stats;
      return { fps: +((frames * 1000) / (performance.now() - start)).toFixed(1), drawCalls: s.calls, triangles: s.triangles, frameMs: +s.frameMs.toFixed(1), geometries: s.geometries, textures: s.textures };
    }, opts.seconds).then((r) => {
      console.log(`${label}: ${JSON.stringify(r)}`);
      return r;
    });
  const shoot = async (name) => {
    await new Promise((r) => setTimeout(r, 400));
    const file = join(opts.out, name);
    await writeFile(file, await page.screenshot({ type: 'png' }));
    console.log(`  → ${file}`);
  };
  await mkdir(opts.out, { recursive: true });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));

  const results = { info };
  results.wide = await measure('wide');
  await shoot('world-wide.png');

  await page.keyboard.press('KeyE');
  await wait(2500);
  results.rotated = await measure('rotated');
  await shoot('world-rotated.png');

  await page.evaluate(() => window.__world.rig.reset());
  await wait(2500);
  const slug = opts.close ?? (await page.evaluate(() => {
    const b = window.__world.buildings().filter((x) => x.category === 'office').sort((a, b) => b.height - a.height);
    return (b[0] ?? window.__world.buildings()[0]).slug;
  }));
  await page.evaluate((s) => window.__world.select(s), slug);
  await wait(3000);
  results.close = await measure(`close-up (${slug})`);
  await shoot('world-close.png');
  await writeFile(join(opts.out, 'stats.json'), JSON.stringify(results, null, 2) + '\n');
} catch (err) {
  console.error('✗', err.message);
  code = 1;
} finally {
  await browser.close();
  await server.close();
}
process.exit(code);

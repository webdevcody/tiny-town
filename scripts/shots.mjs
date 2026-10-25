#!/usr/bin/env node
// npm run shots -- <slug> [<slug> ...] [--size=800x600]
// npm run shots                     (all buildings)
// --out=<dir>  write to <dir>/<slug>/ instead of buildings/<slug>/shots/ (used by npm run setup)
//
// Starts a Vite dev server, opens shots.html in headless Chrome with SOFTWARE
// WebGL (SwiftShader, no GPU needed), renders every preset view with a fixed
// bounding-box framing and writes buildings/<slug>/shots/<view>.png.

import { createServer } from 'vite';
import puppeteer from 'puppeteer';
import UPNG from 'upng-js';
import { mkdir, writeFile, readdir, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve, relative } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const BUILDINGS_DIR = join(ROOT, 'buildings');

export const CHROME_ARGS = [
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--use-angle=swiftshader',
  '--enable-unsafe-swiftshader',
  '--use-gl=angle',
  '--ignore-gpu-blocklist',
  '--enable-webgl',
];

// 256-colour palette PNG: visually identical for these flat low-poly renders, ~5x smaller.
function quantize(png) {
  const img = UPNG.decode(png);
  const rgba = UPNG.toRGBA8(img)[0];
  return Buffer.from(UPNG.encode([rgba], img.width, img.height, 256));
}

function parseArgs(argv) {
  const opts = { slugs: [], width: 800, height: 600, out: null };
  for (const a of argv) {
    if (a.startsWith('--size=')) {
      const [w, h] = a.slice(7).split('x').map(Number);
      opts.width = w;
      opts.height = h;
    } else if (a.startsWith('--out=')) {
      opts.out = resolve(a.slice(6));
    } else if (!a.startsWith('--')) opts.slugs.push(a.replace(/^buildings\//, '').replace(/\/$/, ''));
  }
  return opts;
}

async function allSlugs() {
  const dirs = await readdir(BUILDINGS_DIR, { withFileTypes: true });
  return dirs.filter((d) => d.isDirectory() && existsSync(join(BUILDINGS_DIR, d.name, 'building.js'))).map((d) => d.name).sort();
}

async function main() {
  const t0 = Date.now();
  const opts = parseArgs(process.argv.slice(2));
  const slugs = opts.slugs.length ? opts.slugs : await allSlugs();
  for (const s of slugs) {
    if (!existsSync(join(BUILDINGS_DIR, s, 'building.js'))) {
      console.error(`✗ buildings/${s}/building.js not found`);
      process.exit(1);
    }
  }

  const server = await createServer({
    root: ROOT,
    logLevel: 'error',
    server: { host: '127.0.0.1', port: 0, strictPort: false, hmr: false },
    clearScreen: false,
  });
  await server.listen();
  const { port } = server.httpServer.address();
  const url = `http://127.0.0.1:${port}/shots.html`;

  let browser;
  try {
    browser = await puppeteer.launch({ headless: 'shell', args: CHROME_ARGS });
  } catch (err) {
    await server.close();
    console.error('✗ Could not start headless Chrome:\n' + err.message.split('\n').slice(0, 4).join('\n'));
    console.error(
      '\nOn Debian/Ubuntu install the Chrome runtime libraries with:\n' +
        '  sudo apt-get install -y libglib2.0-0 libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2 \\\n' +
        '    libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libasound2 libpango-1.0-0 \\\n' +
        '    libcairo2 libx11-xcb1 libxshmfence1 libdbus-1-3 fonts-liberation\n' +
        'and make sure the browser is downloaded: npx puppeteer browsers install chrome-headless-shell'
    );
    process.exit(1);
  }

  let failed = 0;
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
    await page.setViewport({ width: opts.width, height: opts.height });

    const load = async () => {
      await page.goto(url, { waitUntil: 'load', timeout: 120000 });
      await page.waitForFunction('window.__shotsReady === true', { timeout: 120000 });
    };
    await load();

    for (const slug of slugs) {
      const t = Date.now();
      let shots;
      for (let attempt = 0; attempt < 2 && !shots; attempt++) {
        try {
          shots = await page.evaluate((s, w, h) => window.__renderShots(s, w, h), slug, opts.width, opts.height);
        } catch (err) {
          // Vite may reload the page once after optimising dependencies
          if (attempt === 0 && /context was destroyed|Target closed|not a function/.test(err.message)) {
            await load();
            continue;
          }
          console.error(`✗ ${slug}: ${err.message.split('\n')[0]}`);
          for (const e of errors.splice(0)) console.error('    ' + e);
          failed++;
          break;
        }
      }
      if (!shots) continue;
      const dir = opts.out ? join(opts.out, slug) : join(BUILDINGS_DIR, slug, 'shots');
      await mkdir(dir, { recursive: true });
      let bytes = 0;
      for (const [view, dataUrl] of Object.entries(shots)) {
        const file = join(dir, `${view}.png`);
        await writeFile(file, quantize(Buffer.from(dataUrl.split(',')[1], 'base64')));
        bytes += (await stat(file)).size;
      }
      console.log(`✓ ${slug}: ${Object.keys(shots).length} shots → ${dir.startsWith(ROOT) ? relative(ROOT, dir) : dir}/ (${Math.round(bytes / 1024)} KB, ${((Date.now() - t) / 1000).toFixed(1)}s)`);
      for (const e of errors.splice(0)) console.warn('  ⚠ ' + e);
    }
  } finally {
    await browser.close();
    await server.close();
  }
  console.log(`done in ${((Date.now() - t0) / 1000).toFixed(1)}s`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

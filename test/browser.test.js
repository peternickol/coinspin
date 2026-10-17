import assert from 'node:assert/strict';
import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const chromeCandidates = [
  process.env.CHROME_PATH,
  '/root/.cache/ms-playwright/chromium-1148/chrome-linux/chrome',
  '/root/.hermes/tools/chromium-1208/chrome-linux64/chrome',
].filter(Boolean);

async function loadChromium() {
  const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
  if (!chrome) return null;
  const modules = [
    'playwright',
    'playwright-core',
    '/root/.bun/install/cache/playwright-core@1.63.0@@@1/index.mjs',
  ];
  for (const specifier of modules) {
    try {
      const imported = await import(specifier);
      if (imported.chromium) return { chromium: imported.chromium, chrome };
    } catch {
      // Try the next install of Playwright.
    }
  }
  return null;
}

async function serve(directory) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url, 'http://127.0.0.1');
    if (url.pathname === '/favicon.ico') {
      response.writeHead(204);
      response.end();
      return;
    }
    const decoded = decodeURIComponent(url.pathname);
    const file = path.resolve(directory, `.${decoded}`);
    if (file !== directory && !file.startsWith(directory + path.sep)) {
      response.writeHead(403);
      response.end();
      return;
    }
    const target = fs.existsSync(file) && fs.statSync(file).isDirectory()
      ? path.join(file, 'index.html')
      : file;
    fs.readFile(target, (error, data) => {
      if (error) {
        response.writeHead(404);
        response.end('not found');
        return;
      }
      const types = {
        '.js': 'text/javascript',
        '.html': 'text/html',
        '.css': 'text/css',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.svg': 'image/svg+xml',
      };
      const type = types[path.extname(target)] || 'application/octet-stream';
      response.writeHead(200, { 'content-type': type, 'cache-control': 'no-store' });
      response.end(data);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  return { server, url: `http://127.0.0.1:${server.address().port}` };
}

function frameName(url) {
  const match = url.match(/coin-(\d+)\.jpe?g/);
  return match ? Number(match[1]) : 0;
}

test('a click loads the open frame and its neighbors', { timeout: 60000 }, async (t) => {
  const loaded = await loadChromium();
  if (!loaded) {
    t.skip('Chromium is not installed');
    return;
  }
  const { chromium, chrome } = loaded;
  const { server, url } = await serve(root);
  const browser = await chromium.launch({
    executablePath: chrome,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });
  const errors = [];
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    const requested = [];
    page.on('request', (request) => requested.push(request.url()));
    page.on('pageerror', (error) => errors.push(String(error)));
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    await page.goto(`${url}/demo/index.html`, { waitUntil: 'networkidle' });
    await page.waitForSelector('#case .coinspin-start img');
    await page.waitForFunction(() => {
      const logo = document.querySelector('.brand img');
      return logo && logo.complete && logo.naturalWidth > 0;
    });
    assert.equal(await page.evaluate(() => window.CoinSpin?.name), 'CoinSpin');
    await page.waitForFunction(() => {
      const image = document.querySelector('#case .coinspin-start img');
      return image && image.complete && image.naturalWidth > 0;
    });

    const before = requested.map(frameName).filter((frame) => frame > 1);
    assert.deepEqual(before, []);
    assert.equal(await page.locator('#case canvas').count(), 0);
    assert.equal(await page.locator('#coinspin-style').count(), 1);
    assert.equal(await page.locator('#marked .coinspin-hint svg').count(), 1);
    assert.equal(await page.locator('#marked .coinspin-orbit').count(), 1);

    await page.locator('#case .coinspin-start').click();
    await page.waitForSelector('#case canvas');
    await page.waitForFunction(() => document.querySelector('#case .coinspin-stage')?.getAttribute('aria-valuenow') === '1');
    await page.waitForTimeout(200);

    const opened = new Set(requested.map(frameName).filter((frame) => frame > 0));
    assert.ok(opened.has(2), `missing neighbor 2 in ${[...opened].join(',')}`);
    assert.ok(opened.has(12), `missing neighbor 12 in ${[...opened].join(',')}`);
    assert.equal(opened.has(6), false);
    const painted = await page.evaluate(() => {
      const canvas = document.querySelector('#case canvas');
      const data = canvas.getContext('2d').getImageData(0, 0, canvas.width, canvas.height).data;
      let ink = 0;
      for (let i = 3; i < data.length; i += 16) if (data[i] > 0) ink += 1;
      return ink;
    });
    assert.ok(painted > 10, `canvas ink ${painted}`);
    assert.equal(await page.locator('#case').getAttribute('class'), 'coinspin is-open');

    const box = await page.locator('#case .coinspin-stage').boundingBox();
    await page.mouse.move(box.x + 30, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width * 0.7, box.y + box.height / 2, { steps: 8 });
    await page.waitForFunction(() => {
      const stage = document.querySelector('#case .coinspin-stage');
      const orbit = getComputedStyle(document.querySelector('#case .coinspin-orbit')).opacity;
      const hint = getComputedStyle(document.querySelector('#case .coinspin-hint')).opacity;
      return stage.classList.contains('is-dragging')
        && document.querySelector('#case').classList.contains('is-turned')
        && orbit === '0'
        && hint === '0';
    });
    await page.mouse.up();
    await page.waitForFunction(() => {
      const stage = document.querySelector('#case .coinspin-stage');
      const orbit = getComputedStyle(document.querySelector('#case .coinspin-orbit')).opacity;
      return !stage.classList.contains('is-dragging')
        && document.querySelector('#case').classList.contains('is-turned')
        && stage.getAttribute('aria-valuenow') !== '1'
        && orbit === '1';
    });
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }
});

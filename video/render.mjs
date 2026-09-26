#!/usr/bin/env node
/*
 * Renders index.html to an MP4, one frame at a time.
 *
 *   node video/render.mjs                 full film → video/out/soteria-one-school-day.mp4
 *   node video/render.mjs --stills 7,15   PNG stills at those seconds → video/out/still-*.png
 *   node video/render.mjs --preview       serve the preview at http://localhost:4173
 *   node video/render.mjs --from 14 --to 22   render only part (for quick checks)
 *
 * Frames are split across workers, each piping PNGs into its own ffmpeg; the
 * pieces are joined and the soundtrack (video/out/soundtrack.wav, built by
 * music.py) is muxed in if it exists.
 */
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawn, execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(DIR, 'out');
const film = JSON.parse(fs.readFileSync(path.join(DIR, 'film.json'), 'utf8'));
const { width: W, height: H, fps: FPS } = film.output;

const args = process.argv.slice(2);
const opt = (name, dflt) => {
  const i = args.indexOf('--' + name);
  return i < 0 ? dflt : args[i + 1] ?? true;
};

/* ── Tools ───────────────────────────────────────────────────────── */

function loadPlaywright() {
  const req = createRequire(import.meta.url);
  const tries = ['playwright', '@playwright/test'];
  try { tries.push(path.join(execFileSync('npm', ['root', '-g']).toString().trim(), 'playwright')); } catch {}
  for (const t of tries) {
    try { return req(t); } catch {}
  }
  throw new Error('Playwright not found. Run `npm i -D playwright` (or install it globally).');
}

function findFfmpeg() {
  if (process.env.FFMPEG) return process.env.FFMPEG;
  for (const cmd of [['ffmpeg', ['-version']], ['python3', ['-c', 'import imageio_ffmpeg as i;print(i.get_ffmpeg_exe())']]]) {
    try {
      const out = execFileSync(cmd[0], cmd[1], { stdio: ['ignore', 'pipe', 'ignore'] }).toString().trim();
      return cmd[0] === 'ffmpeg' ? 'ffmpeg' : out;
    } catch {}
  }
  throw new Error('ffmpeg not found. Install it, or `pip install imageio-ffmpeg`, or set FFMPEG=/path/to/ffmpeg.');
}

/* ── Static server (fetch() of film.json needs http, not file://) ── */

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.woff2': 'font/woff2', '.wav': 'audio/wav', '.png': 'image/png' };
function serve(port = 0) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const p = path.join(DIR, decodeURIComponent(new URL(req.url, 'http://x').pathname));
      if (!p.startsWith(DIR) || !fs.existsSync(p) || fs.statSync(p).isDirectory()) {
        if (req.url === '/' || req.url.startsWith('/?')) return fs.createReadStream(path.join(DIR, 'index.html')).pipe(res);
        res.writeHead(404); return res.end();
      }
      res.writeHead(200, { 'content-type': TYPES[path.extname(p)] || 'application/octet-stream' });
      fs.createReadStream(p).pipe(res);
    });
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function openPage(browser, url) {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', (e) => console.error('page error:', e.message));
  await page.goto(url);
  await page.waitForFunction(() => window.__ready === true, null, { timeout: 30000 });
  return page;
}

/* ── Main ────────────────────────────────────────────────────────── */

fs.mkdirSync(OUT, { recursive: true });

if (args.includes('--preview')) {
  const server = await serve(Number(opt('port', 4173)));
  console.log(`Preview: http://localhost:${server.address().port}/  (add ?t=12 to jump)`);
} else {
  const server = await serve();
  const url = `http://127.0.0.1:${server.address().port}/index.html?render`;
  const { chromium } = loadPlaywright();
  const exe = process.env.CHROMIUM || undefined;
  const browser = await chromium.launch({ executablePath: exe, args: ['--font-render-hinting=none', '--disable-lcd-text'] });

  try {
    if (opt('stills')) {
      const page = await openPage(browser, url);
      for (const t of String(opt('stills')).split(',').map(Number)) {
        await page.evaluate((t) => window.seek(t), t);
        const file = path.join(OUT, `still-${t.toFixed(2).padStart(5, '0')}.png`);
        await page.screenshot({ path: file });
        console.log(file);
      }
    } else {
      const ffmpeg = findFfmpeg();
      const from = Number(opt('from', 0)), to = Number(opt('to', film.duration));
      const first = Math.round(from * FPS), total = Math.round((to - from) * FPS);
      const workers = Math.max(1, Math.min(Number(opt('workers', Math.min(4, os.cpus().length))), total));
      const per = Math.ceil(total / workers);
      const started = Date.now();
      let done = 0;

      const parts = await Promise.all(Array.from({ length: workers }, async (_, w) => {
        const a = first + w * per, b = Math.min(first + total, a + per);
        const file = path.join(OUT, `part-${w}.mp4`);
        const page = await openPage(browser, url);
        const enc = spawn(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-',
          '-c:v', 'libx264', '-preset', 'slow', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(FPS), file], { stdio: ['pipe', 'inherit', 'inherit'] });
        const closed = new Promise((res, rej) => enc.on('close', (c) => (c ? rej(new Error('ffmpeg exited ' + c)) : res())));
        for (let f = a; f < b; f++) {
          await page.evaluate((t) => window.seek(t), f / FPS);
          const png = await page.screenshot({ type: 'png' });
          if (!enc.stdin.write(png)) await new Promise((r) => enc.stdin.once('drain', r));
          if (++done % 60 === 0) process.stdout.write(`\r${done}/${total} frames · ${((Date.now() - started) / 1000).toFixed(0)}s`);
        }
        enc.stdin.end();
        await closed;
        await page.close();
        return file;
      }));
      console.log(`\r${total}/${total} frames · ${((Date.now() - started) / 1000).toFixed(0)}s`);

      const list = path.join(OUT, 'parts.txt');
      fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join('\n'));
      const silent = path.join(OUT, 'video-silent.mp4');
      execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', silent]);
      parts.forEach((p) => fs.unlinkSync(p));
      fs.unlinkSync(list);

      const name = opt('out', from === 0 && to === film.duration ? 'soteria-one-school-day.mp4' : `clip-${from}-${to}.mp4`);
      const final = path.join(OUT, name);
      const wav = path.join(OUT, 'soundtrack.wav');
      if (fs.existsSync(wav)) {
        execFileSync(ffmpeg, ['-y', '-loglevel', 'error', '-i', silent, '-ss', String(from), '-t', String(to - from), '-i', wav,
          '-map', '0:v', '-map', '1:a', '-c:v', 'copy', '-c:a', 'aac', '-b:a', '256k', '-movflags', '+faststart', '-shortest', final]);
        fs.unlinkSync(silent);
      } else {
        fs.renameSync(silent, final);
        console.log('(no soundtrack.wav yet — run `python3 video/music.py` for sound)');
      }
      console.log(final);
    }
  } finally {
    await browser.close();
    server.close();
  }
}

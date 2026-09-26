#!/usr/bin/env node
/*
 * Screenshots of the REAL client, for checking the film against.
 *
 * The film's screens are rebuilt by hand (scenes.js, app.css). This renders
 * the actual app with the same story, so the two can be compared side by
 * side whenever the product changes:
 *
 *   # 1. the client, pointed at a host this script intercepts
 *   NEXT_PUBLIC_API_URL=http://api.mock/api npx next dev -p 3001
 *   # 2. every reference shot → video/out/reference/*.png
 *   node video/reference/capture.mjs            (or: … capture.mjs gate atrisk)
 *
 * No API or database is needed: requests to api.mock are answered from
 * fixtures.mjs, and any endpoint it does not know is listed so it can be added.
 */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(HERE, '..', 'out', 'reference');
const CLIENT = process.env.CLIENT_URL ?? 'http://localhost:3001';
const require = createRequire(path.join(HERE, '..', '..', 'package.json'));
const { chromium } = require('playwright');
const fixtures = (await import('./fixtures.mjs')).default;

const DESK = [1440, 900], PHONE = [390, 844];
const SHOTS = {
  dashboard: { path: '/', size: [1440, 2600] },
  register: { path: '/me/classes/arm-jss2-gold/register', role: 'educator', size: [390, 1500], act: async (p) => { await p.locator('label[title=Absent]').nth(4).click(); await p.getByText('Not known', { exact: true }).first().click(); await p.evaluate(() => scrollTo(0, 0)); } },
  atrisk: { path: '/attendance/at-risk' },
  logcontact: { path: '/attendance/at-risk', act: (p) => p.getByRole('button', { name: /Log contact/ }).first().click() },
  gate: { path: '/attendance/gate', size: [1440, 1100], act: async (p) => { await p.fill('#gate-search', 'Chiamaka'); await p.getByRole('button', { name: /Obi, Chiamaka/ }).click(); await p.getByText('Mr Chidi Okafor').click(); } },
  invoice: { path: '/fees/invoices/inv-tobi', size: [1440, 1000] },
  bill: { path: '/invoice/7fk2Qx9', size: PHONE },
  'record-payment': { path: '/fees/payments', size: [1440, 1000], act: async (p) => { await p.getByRole('button', { name: /Record a payment/ }).click(); await p.locator('#payments-page-who-it-is-for').click(); await p.getByRole('option', { name: /Tobi/ }).click(); await p.fill('#amount', '85000'); } },
  ledger: { path: '/ledger', size: [1440, 1000], act: async (p) => { await p.getByRole('tab', { name: 'Journal' }).click(); await p.getByText(/Adeyemi, Tobi/).first().click(); } },
  payrun: { path: '/payroll/pp9', size: [1440, 1000] },
  mypay: { path: '/me', role: 'educator', size: [390, 1100] },
};

fs.mkdirSync(OUT, { recursive: true });
const browser = await chromium.launch();
const wanted = process.argv.slice(2).length ? process.argv.slice(2) : Object.keys(SHOTS);
for (const name of wanted) {
  const shot = SHOTS[name];
  if (!shot) { console.error(`unknown shot: ${name}`); continue; }
  const role = shot.role ?? 'tenant_owner';
  const [w, hgt] = shot.size ?? DESK;
  const user = fixtures.user(role);
  const ctx = await browser.newContext({ viewport: { width: w, height: hgt } });
  // Signed in the way startSession() leaves a browser: token in storage, cookies for the middleware.
  await ctx.addCookies([
    { name: 'auth-token', value: 'true', url: CLIENT },
    { name: 'user-roles', value: encodeURIComponent(JSON.stringify(user.systemRoles)), url: CLIENT },
  ]);
  await ctx.addInitScript((u) => {
    localStorage.setItem('auth-token', 'mock');
    localStorage.setItem('auth-store', JSON.stringify({ state: { user: u, token: 'mock', isAuthenticated: true }, version: 0 }));
  }, user);
  const misses = new Set();
  await ctx.route('http://api.mock/**', (route) => {
    const req = route.request();
    const url = new URL(req.url());
    const p = url.pathname.replace(/^\/api/, '');
    const body = fixtures.handle(req.method(), p, url.searchParams, role, req.postData());
    if (body === undefined) {
      misses.add(`${req.method()} ${p}${url.search}`);
      return route.fulfill({ status: 404, contentType: 'application/json', body: '{"message":"not in fixtures"}' });
    }
    return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
  });
  const page = await ctx.newPage();
  await page.goto(CLIENT + shot.path, { waitUntil: 'networkidle', timeout: 120000 });
  await page.waitForTimeout(1200);
  if (shot.act) { await shot.act(page); await page.waitForTimeout(1000); }
  const file = path.join(OUT, `${name}.png`);
  await page.screenshot({ path: file });
  console.log(file + (misses.size ? `\n  not in fixtures: ${[...misses].join(', ')}` : ''));
  await ctx.close();
}
await browser.close();

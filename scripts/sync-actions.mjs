#!/usr/bin/env node
/**
 * Pull the API's action registry into src/lib/auth/actions.generated.json.
 *
 * The registry lives in the API (src/common/access/actions.ts); the client
 * reads a generated copy for two things the live session cannot give it: the
 * edge middleware (no API call per request) and the type of an Action name,
 * so can('payroll.aprove') is a compile error.
 *
 *   npm run sync:actions                       # API checked out at ../soteria-management
 *   API_DIR=/path/to/api npm run sync:actions
 *   API_URL=https://… API_TOKEN=… npm run sync:actions   # from a running API
 *
 * CI does not run this; the audit (audit-actors.py --gaps) fails when the
 * committed copy and the API disagree.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const OUT = 'src/lib/auth/actions.generated.json';
const apiDir = path.resolve(process.env.API_DIR ?? '../soteria-management');

let registry;
if (process.env.API_URL) {
    const res = await fetch(`${process.env.API_URL.replace(/\/$/, '')}/auth/actions`, {
        headers: { Authorization: `Bearer ${process.env.API_TOKEN ?? ''}` },
    });
    if (!res.ok) throw new Error(`GET /auth/actions: ${res.status}`);
    const body = await res.json();
    registry = Object.fromEntries(Object.entries(body).sort(([a], [b]) => a.localeCompare(b)));
} else if (existsSync(path.join(apiDir, 'scripts/export-actions.ts'))) {
    registry = JSON.parse(
        execFileSync('npm', ['run', '-s', 'actions:export'], { cwd: apiDir, encoding: 'utf8' }),
    );
} else {
    console.error(`No API at ${apiDir}. Set API_DIR, or API_URL and API_TOKEN.`);
    process.exit(1);
}

writeFileSync(OUT, JSON.stringify(registry, null, 2) + '\n');
console.log(`${OUT}: ${Object.keys(registry).length} actions.`);

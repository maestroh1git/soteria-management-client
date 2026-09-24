#!/usr/bin/env node
/**
 * ESLint, ratcheted.
 *
 * The client carries lint debt older than CI (mostly React Compiler findings:
 * setState inside effects, impure calls during render). Failing every build on
 * it would mean CI never goes green; ignoring it means it grows. So the debt is
 * recorded per file and rule in .eslint-baseline.json, and CI fails when any
 * count rises or a new one appears. Fixing debt lowers the numbers; run
 * `npm run lint:baseline` to lock the improvement in.
 *
 *   node scripts/lint-ratchet.mjs            # check (CI)
 *   node scripts/lint-ratchet.mjs --update   # rewrite the baseline
 */
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import path from 'node:path';

const BASELINE = '.eslint-baseline.json';
const root = process.cwd();

let raw;
try {
    raw = execFileSync('npx', ['eslint', '.', '-f', 'json'], {
        encoding: 'utf8',
        maxBuffer: 64 * 1024 * 1024,
    });
} catch (err) {
    // ESLint exits 1 when it finds errors; the JSON is still on stdout.
    raw = err.stdout;
    if (!raw) throw err;
}

const counts = {};
for (const file of JSON.parse(raw)) {
    const rel = path.relative(root, file.filePath);
    for (const m of file.messages) {
        const key = `${rel} :: ${m.ruleId ?? 'parse-error'}`;
        counts[key] = (counts[key] ?? 0) + 1;
    }
}

if (process.argv.includes('--update')) {
    const sorted = Object.fromEntries(Object.entries(counts).sort());
    writeFileSync(BASELINE, JSON.stringify(sorted, null, 2) + '\n');
    console.log(`Baseline written: ${Object.keys(sorted).length} file/rule pairs.`);
    process.exit(0);
}

const baseline = existsSync(BASELINE) ? JSON.parse(readFileSync(BASELINE, 'utf8')) : {};
const worse = Object.entries(counts)
    .filter(([key, n]) => n > (baseline[key] ?? 0))
    .map(([key, n]) => `  ${key}: ${baseline[key] ?? 0} → ${n}`);
const better = Object.entries(baseline).filter(([key, n]) => (counts[key] ?? 0) < n);

if (worse.length) {
    console.error(`Lint got worse in ${worse.length} place(s):\n${worse.join('\n')}`);
    console.error('\nFix these, or if a rule change is intended, run `npm run lint:baseline`.');
    process.exit(1);
}
console.log(
    `Lint: no new problems.` +
        (better.length
            ? ` ${better.length} file/rule pair(s) improved — run \`npm run lint:baseline\` to lock it in.`
            : ''),
);

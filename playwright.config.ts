import { defineConfig, devices } from '@playwright/test';

/**
 * Persona smoke tests (ROADMAP-EXECUTION.md, C0.2).
 *
 * Needs a running API with a seeded school and a running client:
 *
 *   # API repo
 *   npm run seed:greenfield && npm run seed:personas -- --out=/tmp/personas.json
 *   # this repo
 *   npm run build && npm start -- -p 3001
 *   PERSONAS_FILE=/tmp/personas.json npm run test:personas
 *
 * See e2e/README.md for the whole setup.
 */
export default defineConfig({
    testDir: './e2e',
    globalSetup: './e2e/global-setup.ts',
    // Every persona's sidebar is independent, but the sign-ins in global setup
    // are paced for the API's throttle, so there is little to gain from more.
    workers: 2,
    timeout: 180_000,
    expect: { timeout: 15_000 },
    reporter: [['list']],
    use: {
        baseURL: process.env.CLIENT_URL ?? 'http://localhost:3001',
        viewport: { width: 1280, height: 900 },
        trace: 'retain-on-failure',
    },
    projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 900 } } }],
});

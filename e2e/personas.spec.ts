import { test, expect, type Page } from '@playwright/test';
import { API_URL, loadPersonas, storageFor } from './personas';

/**
 * Every persona opens every page in their own sidebar, and nothing refuses them.
 *
 * The contract from ROADMAP-EXECUTION.md: a route admits exactly the people its
 * data admits. So for each persona, each sidebar link must load without the API
 * answering 401, 403 or 5xx, without an uncaught page error, and without the
 * middleware bouncing them to `?unauthorized=true`. Before Wave 1 this failed
 * for the Payroll Officer, Approver, Finance Admin, Viewer and form teacher —
 * the findings A1, A2, A4 and A9 in the system map.
 */

const personas = loadPersonas();

/** Watch one page for the ways a screen can refuse the person looking at it. */
function watch(page: Page) {
    const problems: string[] = [];
    page.on('response', (res) => {
        const url = res.url();
        if (!url.startsWith(API_URL)) return;
        const s = res.status();
        if (s === 401 || s === 403 || s >= 500) {
            problems.push(`${s} ${res.request().method()} ${url.slice(API_URL.length)}`);
        }
    });
    page.on('pageerror', (err) => problems.push(`page error: ${err.message}`));
    return problems;
}

async function settle(page: Page) {
    await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => {});
}

for (const persona of personas.filter((p) => p.key !== 'parent')) {
    test.describe(`${persona.label} (${persona.roles.join(', ')})`, () => {
        test.use({ storageState: storageFor(persona.key) });

        test('every page in their sidebar loads for them', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/');
            await settle(page);
            const hrefs = await page
                .locator('aside nav a[href]')
                .evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
            expect(hrefs.length, 'a sidebar with something in it').toBeGreaterThan(0);

            const failures: string[] = [];
            for (const href of ['/', ...hrefs.filter((h) => h !== '/')]) {
                problems.length = 0;
                await page.goto(href);
                await settle(page);
                if (page.url().includes('unauthorized=true')) {
                    failures.push(`${href}: bounced as unauthorized`);
                }
                for (const p of problems) failures.push(`${href}: ${p}`);
            }
            expect(failures, failures.join('\n')).toEqual([]);
        });
    });
}

test.describe('Parent', () => {
    test.skip(!personas.some((p) => p.key === 'parent'), 'no parent persona');
    test.use({ storageState: storageFor('parent') });

    test('sees their children and each child’s page', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/portal');
        await settle(page);
        const children = await page
            .locator('main a[href^="/portal/"]')
            .evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
        expect(children.length).toBeGreaterThan(0);
        for (const href of children) {
            await page.goto(href);
            await settle(page);
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });
});

test.describe('Sign-in form', () => {
    test('signs a persona in and lands them in the product', async ({ page }) => {
        const persona = personas.find((p) => p.key === 'employee') ?? personas[0];
        await page.goto('/login');
        await page.locator('input[name="email"]').fill(persona.email);
        await page.locator('input[name="password"]').fill(persona.password);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL((url) => !url.pathname.startsWith('/login'), {
            timeout: 60_000,
        });
        await expect(page.locator('main')).toBeVisible();
    });
});

/**
 * The paths Wave 1 repaired, walked end to end. Each is one finding from the
 * system map, checked from the side of the person it stopped.
 */
test.describe('Paths repaired in Wave 1', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('A9: a form teacher holding only Employee', () => {
        test.skip(!has('formteacher'), 'no formteacher persona');
        test.use({ storageState: storageFor('formteacher') });

        test('goes from My Classes into their class and on to its register', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/me/classes');
            await settle(page);
            await page.locator('main h2 a[href^="/me/classes/"]').first().click();
            await page.waitForURL(/\/me\/classes\/[0-9a-f-]{36}$/);
            await settle(page);
            await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
            await expect(page.getByText('The class', { exact: true })).toBeVisible();

            await page
                .locator('main a[href$="/register"]')
                .first()
                .click();
            await page.waitForURL(/\/register$/);
            await settle(page);
            expect(page.url()).not.toContain('unauthorized');
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('A1: a Payroll Officer adding an employee', () => {
        test.skip(!has('payroll'), 'no payroll persona');
        test.use({ storageState: storageFor('payroll') });

        test('gets a role picker with positions in it', async ({ page }) => {
            const problems = watch(page);
            const roles = page.waitForResponse(
                (r) => r.url().startsWith(`${API_URL}/roles`) && r.request().method() === 'GET',
            );
            await page.goto('/employees/new');
            const res = await roles;
            expect(res.status()).toBe(200);
            expect((await res.json()).length).toBeGreaterThan(0);
            await settle(page);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('A2/A3: an Approver opening a pay run', () => {
        test.skip(!has('approver'), 'no approver persona');
        test.use({ storageState: storageFor('approver') });

        test('reaches the run, and is not offered processing or payment', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/payroll');
            await settle(page);
            // Rows open their run on click (the shared row-click rule, #58).
            const run = page.locator('main table tbody tr').first();
            const count = await run.count();
            test.skip(count === 0, 'no pay run seeded');
            await run.click();
            await page.waitForURL(/\/payroll\/[0-9a-f-]{36}/);
            await settle(page);
            await expect(page.getByRole('button', { name: /process payroll/i })).toHaveCount(0);
            await expect(page.getByRole('button', { name: /as paid/i })).toHaveCount(0);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('A3: a Registrar reading fees', () => {
        test.skip(!has('registrar'), 'no registrar persona');
        test.use({ storageState: storageFor('registrar') });

        test('sees the fees and none of the finance office’s buttons', async ({ page }) => {
            await page.goto('/fees');
            await settle(page);
            await expect(page.getByRole('button', { name: /copy from another/i })).toHaveCount(0);
            await page.goto('/fees/invoices');
            await settle(page);
            await expect(page.getByRole('button', { name: /bill the term/i })).toHaveCount(0);
            await page.goto('/fees/payments');
            await settle(page);
            await expect(page.getByRole('button', { name: /record a payment/i })).toHaveCount(0);
        });
    });
});

test.describe('Fixed after Wave 3', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('Report exports download with the login attached', () => {
        test.skip(!has('admin'), 'no admin persona');
        test.use({ storageState: storageFor('admin') });

        // They used to open a bare URL in a new tab, which carries no token:
        // every export was a 401 page instead of a file.
        test('CSV arrives as a file', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/reports');
            await settle(page);
            const [file] = await Promise.all([
                page.waitForEvent('download'),
                page.getByRole('button', { name: /^csv$/i }).click(),
            ]);
            expect(file.suggestedFilename()).toMatch(/\.csv$/);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

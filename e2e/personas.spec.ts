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
            const hrefs: string[] = await page
                .locator('aside nav a[href]')
                .evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
            expect(hrefs.length, 'a sidebar with something in it').toBeGreaterThan(0);

            // Setup is one sidebar entry standing for many pages; open each
            // one this person is shown there, too.
            if (hrefs.includes('/setup')) {
                await page.goto('/setup');
                await settle(page);
                const setupLinks = await page
                    .locator('main a[data-setup-link]')
                    .evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
                hrefs.push(...setupLinks.filter((h) => !hrefs.includes(h)));
            }

            const failures: string[] = [];
            const queue = ['/', ...hrefs.filter((h) => h !== '/')];
            for (const href of queue) {
                problems.length = 0;
                await page.goto(href);
                await settle(page);
                if (page.url().includes('unauthorized=true')) {
                    failures.push(`${href}: bounced as unauthorized`);
                }
                // A hub's tabs (Fees…) are pages too: open each one shown.
                const tabs = await page
                    .locator('main nav[data-subnav] a[href]')
                    .evaluateAll((as) => as.map((a) => a.getAttribute('href') as string));
                for (const t of tabs) if (!queue.includes(t)) queue.push(t);
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

    test('finds the way back and downloads a child’s attendance', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/portal');
        await settle(page);
        await page.locator('main a[href^="/portal/"]').first().click();
        await settle(page);
        await expect(
            page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Your children' }),
        ).toBeVisible();
        const [file] = await Promise.all([
            page.waitForEvent('download'),
            page.getByRole('button', { name: 'Download attendance' }).click(),
        ]);
        expect(file.suggestedFilename()).toMatch(/_attendance\.csv$/);
        expect(problems, problems.join('\n')).toEqual([]);
    });

    test('reads a child’s bills and opens one, with its PDF (5.12)', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/portal');
        await settle(page);
        await page.locator('main a[href^="/portal/"]').first().click();
        await settle(page);
        await expect(page.getByText('Bills', { exact: true })).toBeVisible();
        const bill = page.locator('main a[href^="/invoice/"]').first();
        test.skip((await bill.count()) === 0, 'this child has no bills in the seed');
        const pdf = await page.locator('main a[href$="/pdf"]').first().getAttribute('href');
        expect(pdf).toMatch(/\/invoice\/[0-9a-f-]{36}\/pdf$/);
        await bill.click();
        await page.waitForURL(/\/invoice\/[0-9a-f-]{36}$/);
        await expect(page.getByText(/^(Still to pay|Paid in full)$/).first()).toBeVisible();
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

test.describe('Wave 4: pages that moved into Setup', () => {
    const has = (key: string) => personas.some((p) => p.key === key);
    test.skip(!has('admin'), 'no admin persona');
    test.use({ storageState: storageFor('admin') });

    // Bookmarks and links in old emails keep working.
    for (const [from, to] of [
        ['/settings', '/setup/organisation'],
        ['/roles', '/setup/positions'],
        ['/banks', '/setup/bank-list'],
    ]) {
        test(`${from} lands on ${to}`, async ({ page }) => {
            await page.goto(from);
            await expect(page).toHaveURL(new RegExp(`${to}$`));
            await expect(page.getByRole('navigation', { name: 'Breadcrumb' })).toContainText('Setup');
        });
    }
});

test.describe('Sidebar sections fold, and one link is current', () => {
    const has = (key: string) => personas.some((p) => p.key === key);
    test.skip(!has('admin'), 'no admin persona');
    test.use({ storageState: storageFor('admin') });

    test('only the closest link is marked current', async ({ page }) => {
        const sidebar = page.locator('aside nav');
        await page.goto('/me/classes');
        await settle(page);
        // My Pay (/me) and My Classes (/me/classes) both used to light up.
        await expect(sidebar.locator('a[aria-current="page"]')).toHaveCount(1);
        await page.goto('/me/classes');
        await settle(page);
        await expect(sidebar.locator('a[aria-current="page"]')).toHaveText('My Classes');
    });

    test('a folded section stays folded, and opens when you go into it', async ({ page }) => {
        const sidebar = page.locator('aside nav');
        await page.goto('/fees/invoices');
        await settle(page);
        const insight = sidebar.getByRole('button', { name: /insight/i });
        await insight.click();
        await expect(insight).toHaveAttribute('aria-expanded', 'false');
        await expect(sidebar.getByRole('link', { name: 'Reports' })).toBeHidden();

        await page.reload();
        await settle(page);
        await expect(sidebar.getByRole('button', { name: /insight/i })).toHaveAttribute('aria-expanded', 'false');
        // The section holding the page you are on is open.
        await expect(sidebar.getByRole('link', { name: 'Fees' })).toBeVisible();

        await page.goto('/reports');
        await settle(page);
        await expect(sidebar.getByRole('button', { name: /insight/i })).toHaveAttribute('aria-expanded', 'true');
        await expect(sidebar.getByRole('link', { name: 'Reports' })).toBeVisible();
    });
});

test.describe('Team & access', () => {
    const has = (key: string) => personas.some((p) => p.key === key);
    test.skip(!has('admin'), 'no admin persona');
    test.use({ storageState: storageFor('admin') });

    test('lists who can sign in, and narrows by access', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/setup/team');
        await settle(page);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Team & access');
        const rows = page.locator('main table tbody tr');
        const all = await rows.count();
        expect(all).toBeGreaterThan(1);
        // The access chips are a view by access: one click narrows the list.
        await page.getByRole('button', { name: /^Approver \d+$/ }).click();
        await expect(rows).not.toHaveCount(all);
        await expect(page.locator('main table tbody')).toContainText('Approver');
        expect(problems, problems.join('\n')).toEqual([]);
    });

    test('the organisation page no longer carries the team', async ({ page }) => {
        await page.goto('/setup/organisation');
        await settle(page);
        await expect(page.getByRole('tab', { name: /team/i })).toHaveCount(0);
        await expect(page.getByRole('heading', { level: 1 })).toHaveText('Organisation');
    });
});

test.describe('Fees hub', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('the finance office', () => {
        test.skip(!has('finance'), 'no finance persona');
        test.use({ storageState: storageFor('finance') });

        test('has one Fees entry, and every part of the fee cycle as a tab', async ({ page }) => {
            await page.goto('/fees/invoices');
            await settle(page);
            const sidebar = page.locator('aside nav');
            await expect(sidebar.getByRole('link', { name: 'Invoices' })).toHaveCount(0);
            await expect(sidebar.locator('a[aria-current="page"]')).toHaveText('Fees');
            const tabs = page.locator('main nav[data-subnav] a');
            await expect(tabs).toHaveText([
                'Price list',
                'Invoices',
                'Receipts',
                'Concessions',
                'Optional fees',
                'Arrears',
            ]);
            await expect(page.locator('main nav[data-subnav] a[aria-current="page"]')).toHaveText('Invoices');
        });
    });

    test.describe('an Approver', () => {
        test.skip(!has('approver'), 'no approver persona');
        test.use({ storageState: storageFor('approver') });

        test('can open concessions to decide them, and nothing else of Fees', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/fees/concessions');
            await settle(page);
            expect(page.url()).not.toContain('unauthorized');
            await expect(page.getByRole('heading', { level: 1 })).toHaveText('Concessions');
            await expect(page.getByRole('button', { name: /raise a concession/i })).toHaveCount(0);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('Approvals inbox', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('an Approver', () => {
        test.skip(!has('approver'), 'no approver persona');
        test.use({ storageState: storageFor('approver') });

        test('has one queue for every decision, counted in the sidebar', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/approvals');
            await settle(page);
            await expect(page.getByRole('heading', { level: 1 })).toHaveText('Approvals');
            await expect(page.locator('aside nav').getByRole('link', { name: /^Approvals/ })).toBeVisible();
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('an Employee', () => {
        test.skip(!has('employee'), 'no employee persona');
        test.use({ storageState: storageFor('employee') });

        test('is not shown an inbox they have nothing in', async ({ page }) => {
            await page.goto('/');
            await settle(page);
            await expect(page.locator('aside nav').getByRole('link', { name: /^Approvals/ })).toHaveCount(0);
        });
    });
});

/** Open the first record a list links to, e.g. `/employees/<id>`. */
async function openFirst(page: Page, list: string, prefix: string) {
    await page.goto(list);
    await settle(page);
    const href = await page
        .locator(`main a[href^="${prefix}"]`)
        .evaluateAll((as, p) => {
            const ids = as
                .map((a) => a.getAttribute('href') as string)
                .filter((h) => /^[0-9a-f-]{36}/.test(h.slice(p.length)));
            return ids[0] ?? null;
        }, prefix);
    expect(href, `a record linked from ${list}`).not.toBeNull();
    await page.goto(href!.split('?')[0]);
    await settle(page);
}

/** Every tab on a record, clicked in turn: their names, and anything refused. */
async function clickEveryTab(page: Page, problems: string[]) {
    const tabs = page.locator('main [role="tablist"]').first().getByRole('tab');
    const names = (await tabs.allInnerTexts()).map((t) => t.replace(/\s*\(\d+\)$/, '').trim());
    for (let i = 0; i < names.length; i++) {
        await tabs.nth(i).click();
        await settle(page);
    }
    expect(problems, problems.join('\n')).toEqual([]);
    return names;
}

test.describe('Record hubs (C4.4–C4.6)', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('a Payroll Officer on a staff record', () => {
        test.skip(!has('payroll'), 'no payroll persona');
        test.use({ storageState: storageFor('payroll') });

        test('sees every part of their employment as a tab, and each loads', async ({ page }) => {
            const problems = watch(page);
            await openFirst(page, '/employees', '/employees/');
            const names = await clickEveryTab(page, problems);
            expect(names).toEqual(['Overview', 'Pay setup', 'Bank', 'Payslips', 'Loans', 'Leave', 'History']);
        });
    });

    test.describe('an Admin on a staff record', () => {
        test.skip(!has('admin'), 'no admin persona');
        test.use({ storageState: storageFor('admin') });

        test('also sees their sign-in and access', async ({ page }) => {
            const problems = watch(page);
            await openFirst(page, '/employees', '/employees/');
            const names = await clickEveryTab(page, problems);
            expect(names).toContain('Access');
        });
    });

    test.describe('a Registrar on a pupil record', () => {
        test.skip(!has('registrar'), 'no registrar persona');
        test.use({ storageState: storageFor('registrar') });

        test('reads the account and the admission, and may invite a parent', async ({ page }) => {
            const problems = watch(page);
            await openFirst(page, '/students', '/students/');
            const names = await clickEveryTab(page, problems);
            expect(names).toEqual(['Bio', 'Guardians', 'Fees', 'Medical', 'Documents', 'Admission']);
        });
    });

    test.describe('an Educator on a pupil record', () => {
        test.skip(!has('educator'), 'no educator persona');
        test.use({ storageState: storageFor('educator') });

        test('reads their attendance and awards, not their fees', async ({ page }) => {
            const problems = watch(page);
            await openFirst(page, '/students', '/students/');
            const names = await clickEveryTab(page, problems);
            expect(names).toContain('Class & attendance');
            expect(names).toContain('Awards');
            expect(names).not.toContain('Fees');
        });
    });

    test.describe('an Approver on a pay run', () => {
        test.skip(!has('approver'), 'no approver persona');
        test.use({ storageState: storageFor('approver') });

        test('checks the variance and the adjustments, and nothing that is not theirs', async ({ page }) => {
            const problems = watch(page);
            await openFirst(page, '/payroll', '/payroll/');
            const names = await clickEveryTab(page, problems);
            expect(names).toEqual(['Salaries', 'Adjustments', 'Variance']);
        });
    });

    test.describe('a Payroll Officer', () => {
        test.skip(!has('payroll'), 'no payroll persona');
        test.use({ storageState: storageFor('payroll') });

        test('finds payslips on the run, and the old page takes them there', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/payslips');
            await page.waitForURL(/\/payroll\/[0-9a-f-]{36}\?tab=payslips/);
            await settle(page);
            await expect(page.getByRole('tab', { name: 'Payslips', selected: true })).toBeVisible();
            await expect(page.locator('aside nav').getByRole('link', { name: 'Payslips' })).toHaveCount(0);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('My Pay (5.6)', () => {
    test.skip(!personas.some((p) => p.key === 'employee'), 'no employee persona');
    test.use({ storageState: storageFor('employee') });

    test('an employee can ask for a loan or an advance', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/me');
        await settle(page);
        await page.getByRole('button', { name: /ask for a loan or advance/i }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByRole('heading', { name: /ask for a loan or advance/i })).toBeVisible();
        await expect(dialog.getByLabel('Amount')).toBeVisible();
        await dialog.getByRole('button', { name: /cancel/i }).click();
        expect(problems, problems.join('\n')).toEqual([]);
    });
});

test.describe('Today (C4.8) and the class week (5.4)', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('a form teacher', () => {
        test.skip(!has('formteacher'), 'no formteacher persona');

        test('lands on their classes when they sign in', async ({ page }) => {
            const persona = personas.find((p) => p.key === 'formteacher')!;
            await page.goto('/login');
            await page.locator('input[name="email"]').fill(persona.email);
            await page.locator('input[name="password"]').fill(persona.password);
            await page.locator('button[type="submit"]').click();
            await page.waitForURL(/\/me\/classes$/, { timeout: 60_000 });
            await expect(page.getByRole('heading', { level: 1 })).toHaveText('My classes');
        });

        test.describe('in their class', () => {
            test.use({ storageState: storageFor('formteacher') });

            test('reads the week, pupil by day, and downloads it', async ({ page }) => {
                const problems = watch(page);
                await page.goto('/me/classes');
                await settle(page);
                await expect(page.getByText(/signed out today/i).first()).toBeVisible();
                await page.locator('main h2 a[href^="/me/classes/"]').first().click();
                await page.waitForURL(/\/me\/classes\/[0-9a-f-]{36}$/);
                await settle(page);
                const week = page.locator('table').filter({ has: page.locator('caption') });
                await expect(week.locator('thead th')).toHaveCount(6);
                await page.getByRole('button', { name: 'Previous week' }).click();
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

    test.describe('someone who runs the school', () => {
        test.skip(!has('admin'), 'no admin persona');

        test('still lands on the dashboard', async ({ page }) => {
            const persona = personas.find((p) => p.key === 'admin')!;
            await page.goto('/login');
            await page.locator('input[name="email"]').fill(persona.email);
            await page.locator('input[name="password"]').fill(persona.password);
            await page.locator('button[type="submit"]').click();
            await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });
            expect(new URL(page.url()).pathname).toBe('/');
        });
    });

    test.describe('the attendance office', () => {
        test.skip(!has('attendance'), 'no attendance persona');
        test.use({ storageState: storageFor('attendance') });

        test('downloads the whole school’s register', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/attendance');
            await settle(page);
            const [file] = await Promise.all([
                page.waitForEvent('download'),
                page.getByRole('button', { name: /download csv/i }).click(),
            ]);
            expect(file.suggestedFilename()).toMatch(/^attendance_.*\.csv$/);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('Feedback round (5.10, 5.15, 5.16)', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('the admissions office', () => {
        test.skip(!has('admissions'), 'no admissions persona');
        test.use({ storageState: storageFor('admissions') });

        test('reads the assessment diary a week at a time', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/admissions');
            await settle(page);
            await page.locator('aside nav').getByRole('link', { name: 'Assessment diary' }).click();
            await page.waitForURL(/\/admissions\/diary$/);
            await settle(page);
            await expect(page.getByRole('heading', { level: 1 })).toHaveText('Assessment diary');
            await page.getByRole('button', { name: 'Next week' }).click();
            await settle(page);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('a registrar', () => {
        test.skip(!has('registrar'), 'no registrar persona');
        test.use({ storageState: storageFor('registrar') });

        test('chooses which class a new question set is for', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/admissions/question-sets');
            await settle(page);
            await page.getByRole('button', { name: /publish a new set/i }).click();
            await expect(page.getByRole('dialog').getByLabel('For')).toBeVisible();
            expect(problems, problems.join('\n')).toEqual([]);
        });

        test('finds a pupil by surname first, and every name opens a record', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/students');
            await settle(page);
            const first = page.locator('main table a[href^="/students/"]').filter({ hasText: ',' }).first();
            await expect(first).toBeVisible();
            const name = (await first.innerText()).trim();
            const [surname, given] = name.split(',').map((s) => s.trim());
            await page.getByPlaceholder(/name or admission/i).fill(`${given} ${surname}`);
            await settle(page);
            await expect(page.locator('main table a[href^="/students/"]').filter({ hasText: surname }).first()).toBeVisible();
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('Homes (C4.10)', () => {
    const has = (key: string) => personas.some((p) => p.key === key);

    test.describe('an Approver', () => {
        test.skip(!has('approver'), 'no approver persona');
        test.use({ storageState: storageFor('approver') });

        test('is shown what waits on them first, one step from it', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/');
            await settle(page);
            const waiting = page.getByRole('region', { name: 'Waiting on you' });
            await expect(waiting).toBeVisible();
            await expect(waiting.getByRole('link', { name: /decisions? waiting on you/i })).toHaveAttribute('href', '/approvals');
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('the bursar', () => {
        test.skip(!has('finance'), 'no finance persona');
        test.use({ storageState: storageFor('finance') });

        test('sees money first: fees and spend against budget', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/');
            await settle(page);
            await expect(page.getByText('Spend against budget')).toBeVisible();
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('Contact log (5.5)', () => {
    const has = (key: string) => personas.some((p) => p.key === key);
    const note = `Persona test ${Date.now()}: spoke to mother, back Monday`;
    let pupil = '';

    test.describe.configure({ mode: 'serial' });

    test.describe('the attendance office', () => {
        test.skip(!has('attendance'), 'no attendance persona');
        test.use({ storageState: storageFor('attendance') });

        test('writes down a call from the follow-up list', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/attendance/at-risk');
            await settle(page);
            const row = page.locator('main tbody tr').filter({ hasText: 'None yet' }).first();
            pupil = ((await row.locator('td').first().innerText()).split('\n')[0] ?? '').trim();
            await row.getByRole('button', { name: 'Log contact' }).click();
            const dialog = page.getByRole('dialog');
            await dialog.getByLabel('What came of it').fill(note);
            await dialog.getByRole('button', { name: 'Save contact' }).click();
            await expect(dialog).toBeHidden();
            await expect(
                page.locator('main tbody tr').filter({ hasText: pupil }).first(),
            ).toContainText('Spoke to them');
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('an admin', () => {
        test.skip(!has('admin') || !has('attendance'), 'no admin or attendance persona');
        test.use({ storageState: storageFor('admin') });

        test('reads what was said on the pupil’s record', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/attendance/at-risk');
            await settle(page);
            await page
                .locator('main tbody tr')
                .filter({ hasText: pupil })
                .first()
                .locator('a[href^="/students/"]')
                .first()
                .click();
            await settle(page);
            await page.getByRole('tab', { name: 'Attendance' }).click();
            await expect(page.getByText(note)).toBeVisible();
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });

    test.describe('a viewer', () => {
        test.skip(!has('viewer'), 'no viewer persona');
        test.use({ storageState: storageFor('viewer') });

        test('reads the follow-up list, and does not log a contact', async ({ page }) => {
            const problems = watch(page);
            await page.goto('/attendance/at-risk');
            await settle(page);
            await expect(page.getByRole('heading', { name: 'Pupils to follow up' })).toBeVisible();
            await expect(page.locator('main tbody tr').first()).toBeVisible();
            await expect(page.getByRole('button', { name: 'Log contact' })).toHaveCount(0);
            expect(problems, problems.join('\n')).toEqual([]);
        });
    });
});

test.describe('Bank reconciliation (5.8)', () => {
    test.skip(!personas.some((p) => p.key === 'finance'), 'no finance persona');
    test.use({ storageState: storageFor('finance') });

    test('undoes a wrong match and lets the obvious ones match again', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/banking');
        await settle(page);
        const open = page.locator('main tbody tr').filter({ hasText: 'Reconciling' }).first();
        test.skip((await open.count()) === 0, 'no open statement in the seed');
        await open.locator('a[href^="/banking/"]').first().click();
        await settle(page);

        const notInBooks = page.getByText(/^Not in the books \((\d+)\)$/);
        const count = async () => Number((await notInBooks.innerText()).match(/\d+/)![0]);
        const before = await count();

        const matched = page.getByText(/^Matched \((\d+)\)$/);
        await expect(matched).toBeVisible();
        await page.getByRole('button', { name: 'Undo match' }).first().click();
        await expect.poll(count).toBeGreaterThan(before);

        await page.getByRole('button', { name: 'Match the obvious ones' }).click();
        await expect.poll(count).toBe(before);

        // Posting a line asks what it was before anything is written.
        await page.getByRole('button', { name: 'Post' }).first().click();
        const dialog = page.getByRole('dialog');
        await expect(dialog.getByText('Put this in the books')).toBeVisible();
        await dialog.getByRole('button', { name: 'Post and match' }).click();
        await expect(dialog.getByText('Choose what it was.')).toBeVisible();
        await dialog.getByRole('button', { name: 'Cancel' }).click();
        expect(problems, problems.join('\n')).toEqual([]);
    });
});

test.describe('Admissions housekeeping (5.10)', () => {
    test.skip(!personas.some((p) => p.key === 'registrar'), 'no registrar persona');
    test.use({ storageState: storageFor('registrar') });

    test('sets what a class asks for, then takes it away again', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/admissions/criteria');
        await settle(page);
        const row = page.locator('main tbody tr').filter({ hasText: 'None set' }).first();
        test.skip((await row.count()) === 0, 'every class already has criteria');
        const level = (await row.locator('td').first().innerText()).trim();

        await row.getByRole('button', { name: 'Set criteria' }).click();
        const dialog = page.getByRole('dialog');
        await dialog.getByLabel('Youngest (years)').fill('5');
        await dialog.getByLabel('Oldest (years)').fill('4');
        await dialog.getByRole('button', { name: 'Save criteria' }).click();
        await expect(dialog.getByText('The oldest cannot be younger than the youngest.')).toBeVisible();
        await dialog.getByLabel('Oldest (years)').fill('6.5');
        await dialog.getByLabel('Lowest exam score (%)').fill('55');
        await dialog.getByRole('button', { name: 'Save criteria' }).click();
        await expect(dialog).toBeHidden();

        const saved = page.locator('main tbody tr').filter({ hasText: level }).first();
        await expect(saved).toContainText('5 to 6½ years');
        await expect(saved).toContainText('55%');

        await saved.getByRole('button', { name: `Remove the criteria for ${level}` }).click();
        await page.getByRole('button', { name: 'Remove criteria' }).click();
        await expect(page.locator('main tbody tr').filter({ hasText: level }).first()).toContainText('None set');
        expect(problems, problems.join('\n')).toEqual([]);
    });

    test('sees what is past its retention date before anything is deleted', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/admissions/retention');
        await settle(page);
        await expect(page.getByRole('heading', { name: 'Applications to delete' })).toBeVisible();
        const rows = await page.locator('main tbody tr a[href^="/admissions/"]').count();
        if (rows === 0) {
            await expect(page.getByText('Nothing is due for deletion').first()).toBeVisible();
            await expect(page.getByRole('button', { name: /^Delete/ })).toBeDisabled();
        }
        expect(problems, problems.join('\n')).toEqual([]);
    });
});

test.describe('A family answers from their link (5.11)', () => {
    test.skip(!personas.some((p) => p.key === 'registrar'), 'no registrar persona');

    test('sends a birth certificate and accepts the place, and the office sees both', async ({ page, request, browser }) => {
        const problems = watch(page);
        const registrar = personas.find((p) => p.key === 'registrar')!;
        const login = await request.post(`${API_URL}/auth/login`, {
            data: { email: registrar.email, password: registrar.password },
        });
        const auth = { Authorization: `Bearer ${(await login.json()).token}` };
        const { slug } = await (await request.get(`${API_URL}/tenants/me`, { headers: auth })).json();
        const school = await (await request.get(`${API_URL}/public/schools/${slug}`)).json();

        // A fresh application each run, so the test can be run again.
        const applied = await request.post(`${API_URL}/public/schools/${slug}/applications`, {
            data: {
                classLevelId: school.levels[0].id,
                firstName: 'Persona',
                lastName: `Family${Date.now()}`,
                dateOfBirth: '2018-02-02',
                gender: 'FEMALE',
                guardianFirstName: 'Test',
                guardianLastName: 'Guardian',
                guardianPhone: '08030000001',
                guardianRelationship: 'MOTHER',
            },
        });
        // The public form is rate-limited per address; a refusal here says so
        // rather than surfacing as a missing row further down.
        expect(applied.ok(), `apply: ${applied.status()} ${await applied.text()}`).toBe(true);
        const { accessToken } = await applied.json();
        const list = await (await request.get(`${API_URL}/admissions/applications`, { headers: auth })).json();
        const application = list.find((a: { accessToken: string }) => a.accessToken === accessToken);
        const offered = await request.patch(`${API_URL}/admissions/applications/${application.id}/status`, {
            headers: auth,
            data: { status: 'OFFERED', offerExpiresAt: new Date(Date.now() + 7 * 86_400_000).toISOString() },
        });
        expect(offered.ok()).toBe(true);

        await page.goto(`/application/${accessToken}`);
        await expect(page.getByText('A place has been offered')).toBeVisible();

        await page.getByLabel('File').setInputFiles({
            name: 'birth-certificate.pdf',
            mimeType: 'application/pdf',
            buffer: Buffer.from('%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF\n'),
        });
        await page.getByRole('button', { name: 'Send' }).click();
        await expect(page.getByText('birth-certificate.pdf')).toBeVisible();

        await page.getByRole('button', { name: 'Accept the place' }).click();
        await expect(page.getByText('Place accepted')).toBeVisible();
        await expect(page.getByRole('button', { name: 'Accept the place' })).toHaveCount(0);

        const office = await (
            await request.get(`${API_URL}/admissions/applications/${application.id}`, { headers: auth })
        ).json();
        expect(office.status).toBe('ACCEPTED');
        const docs = await (
            await request.get(`${API_URL}/admissions/applications/${application.id}/documents`, { headers: auth })
        ).json();
        expect(docs.map((d: { kind: string }) => d.kind)).toEqual(['BIRTH_CERTIFICATE']);
        expect(problems, problems.join('\n')).toEqual([]);

        // And the registrar finds it on the application, in the app.
        const officeContext = await browser.newContext({ storageState: storageFor('registrar') });
        const officePage = await officeContext.newPage();
        const officeProblems = watch(officePage);
        await officePage.goto(`/admissions/${application.id}`);
        await settle(officePage);
        await expect(officePage.getByRole('button', { name: 'birth-certificate.pdf', exact: true })).toBeVisible();
        expect(officeProblems, officeProblems.join('\n')).toEqual([]);
        await officeContext.close();
    });
});

test.describe('Platform console: setting up an organisation (5.13)', () => {
    // There is no platform persona: the operator is made by the API's
    // create:super-admin CLI. Set PLATFORM_EMAIL / PLATFORM_PASSWORD to run this.
    const email = process.env.PLATFORM_EMAIL;
    const password = process.env.PLATFORM_PASSWORD;
    test.skip(!email || !password, 'no platform operator configured');

    test('creates an organisation, invites its owner, and lists it', async ({ page }) => {
        const problems = watch(page);
        await page.goto('/login');
        await page.locator('input[name="email"]').fill(email!);
        await page.locator('input[name="password"]').fill(password!);
        await page.locator('button[type="submit"]').click();
        await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 60_000 });

        const name = `Persona College ${Date.now()}`;
        await page.goto('/admin/tenants');
        await settle(page);
        await page.getByRole('button', { name: 'Set up an organisation' }).click();
        const form = page.getByRole('dialog');
        await form.getByRole('button', { name: 'Create and invite' }).click();
        await expect(form.getByText('Give the organisation its name.')).toBeVisible();
        await form.getByLabel('Name', { exact: true }).fill(name);
        await form.getByLabel('Owner’s first name').fill('Test');
        await form.getByLabel('Owner’s surname').fill('Owner');
        await form.getByLabel('Owner’s email').fill(`owner.${Date.now()}@persona.test`);
        await form.getByRole('button', { name: 'Create and invite' }).click();

        await expect(page.getByText(`${name} is set up`)).toBeVisible();
        await page.getByRole('button', { name: 'Done' }).click();
        await expect(page.locator('main tbody tr').filter({ hasText: name })).toHaveCount(1);
        expect(problems, problems.join('\n')).toEqual([]);
    });
});

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

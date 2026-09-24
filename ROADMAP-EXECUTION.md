# Roadmap execution — one consistent application

_Executes the roadmap in the System Map
(https://claude.ai/artifact/NBmWe8LBgDvnrcinDtJLhP), mapped 24 Sep 2026
against client `10575ff` and API `soteria-management@1d4d774`. Finding ids
(A1–A9) and section numbers refer to that map._

The map found the API sound and the space between the two repositories broken:
23 page × role pairs where a screen shows actions or data the API refuses, 16
where a route blocks what the API allows, 27 hooks no screen calls, and a
navigation organised by module rather than by job. This plan fixes all of it and
leaves behind the checks that stop it coming back.

It is written as pull requests. Each PR has a repository (**S** = `soteria-management`,
**C** = `soteria-management-client`), the files it touches, what "done" means, and
the test that proves it. Waves are ordered by dependency; PRs inside a wave can
run in parallel unless a dependency is named.

---

## 0. Rules every PR follows

These are the decisions that make the application consistent. A PR that breaks
one is not finished, whatever else it does.

1. **The server owns who may do what**, as it already owns which transitions are
   legal (FRONTEND-PHASE3 §1). Screens ask `can('payroll.approve')`; they never
   list roles. `hasRole([...])` in a page or component is a lint error once
   Wave 2 lands.
2. **"Your own things" are decided by identity, not role.** A form teacher's
   class, an employee's pay, a parent's children. The service checks
   ownership; no system role gates them. (The API already does this for
   `my-classes`; Wave 1 finishes the job for the register and roster.)
3. **A route admits exactly the people its data admits.** Route roles are
   generated from the actions a page needs, never hand-written.
4. **Every name is a link to its record.** A person, pupil, invoice, loan or
   class shown anywhere is an `EntityLink`.
5. **One of each.** One page header, one table, one money formatter (tenant
   currency), one date formatter, one status badge map, one confirm dialog,
   one form dialog, one empty/error/loading state. A second copy is a lint
   error or a review block.
6. **A feature is not done until its actor can reach it.** An exported hook
   with no caller fails CI. (This is the gap class ACTORS-OWNERSHIP-ACTIONS.md
   named, one layer further out than `audit-actors.py` currently looks.)
7. **Setup is not daily work.** Configuration lives in one Setup hub; the
   sidebar is for the jobs people do every day.

---

## 1. The screen contract

Every screen in the application meets this list by the end of Wave 4. The
page-by-page table in §8 tracks it.

| # | Item | Standard |
|---|---|---|
| S1 | Header | `<PageHeader title description actions back>`; one `<h1>` style |
| S2 | Breadcrumb | Generated from the nav tree and record names |
| S3 | Actions | Rendered only when `can(action)`; destructive ones confirm through `ConfirmDialog` |
| S4 | Lists | `DataTable`: server pagination, toolbar filters, row click to the record (#58), row action menu named after the subject (#59) |
| S5 | Tabs | Stored in `?tab=`; back, refresh and shared links keep the place |
| S6 | States | `LoadingSkeleton`, `EmptyState` (with the next action), `ErrorState` (with retry) |
| S7 | Money | `<Money>` / `formatMoney()` in the tenant's currency; no `₦` literals |
| S8 | Dates | `utils/dates` only |
| S9 | Links | People, pupils, invoices, loans, classes, users rendered as `EntityLink` |
| S10 | Status | `StatusBadge` from one registry covering every status enum |
| S11 | Forms | `FormDialog` (react-hook-form + zod), server errors mapped to fields, toast copy "Saved", "Approved", never "Success!" |
| S12 | Org type | School-only content gated on `orgTypes` |
| S13 | Phone width | Usable at 400px; tables become cards |
| S14 | Words | The glossary in §7 |
| S15 | Data access | Through `features/<domain>/hooks`; no API calls from pages |

---

## 2. Decisions needed before Wave 1 ends

These are policy, not code. Each has a recommendation; the owner decides.

| # | Question | Recommendation |
|---|---|---|
| D1 | Keep job-role **permissions** (`PermissionsGuard`)? | Retire them. One mechanism. Keep the table for a later fine-grained model if a customer asks. |
| D2 | May **Approvers** approve loans? Today only Owner/Admin can. | Yes: loans are exactly what an Approver is for. |
| D3 | Separation of duties for **concessions, loans, invoices** | Concessions: raise by Finance/Registrar, approve by Owner/Admin/Approver. Loans: as D2. Invoices: unchanged. |
| D4 | May **Registrars** invite parents to the portal? | Yes, through a dedicated endpoint that can only create PARENT accounts for linked guardians. |
| D5 | Who **downloads the bank payment file**? | Keep Owner/Admin/Finance; hide the button from Payroll Officers (preview only). |
| D6 | What does an **Educator** see of the pupil list? | Default "my class", switch to "whole school" (API unchanged until timetables). |
| D7 | **Pupil or student?** | "Pupil" in primary tenants, "Student" in secondary, set per tenant; one term per screen, from a glossary helper. If one word: "Student" (it is the API's word). |
| D8 | **Payment gateway** for parents | Paystack (NGN, card + transfer), behind a feature flag. Wave 5. |

---

## 3. Wave 0 — Safety net (3–4 days)

Nothing in the client is tested or checked in CI today. That is the first thing
to change, because every later wave is a refactor.

| PR | Repo | Change | Done when |
|---|---|---|---|
| **C0.1** Client CI | C | `.github/workflows/ci.yml`: `npm ci`, `eslint`, `tsc --noEmit`, `next build` on every PR. Fix the existing lint baseline first (or `--max-warnings` at today's count and ratchet down). | A PR with a type error goes red. |
| **S0.1** Persona seed | S | `src/seeds/personas.seed.ts`: one demo school with one user per role, plus the traps: a form teacher holding only `EMPLOYEE`, an Admin without `full_access`, a parent with two children. `npm run seed:personas`. | Each login works locally; credentials documented in the seed file. |
| **C0.2** Persona smoke tests | C | Playwright (`e2e/personas.spec.ts`; use `/opt/pw-browsers` locally). For each persona: sign in, open every sidebar entry, **fail on any 403 response or error state during load**, and click nothing destructive. Runs against a local API with S0.1. | Today it reproduces the map: A1, A2, A4, A9 fail. It is the acceptance test for Wave 1. |
| **S0.2** Audit in CI | S | CI job checks out the client repo as a sibling and runs `scripts/audit-actors.py --gaps` (the doc says it "cannot run in CI"; a second `actions/checkout` makes it possible). | The audit runs on every API PR. |

---

## 4. Wave 1 — Unblock (1 week)

Stop people hitting walls. Mostly deletions and small gates. Finding ids in
brackets.

### API

| PR | Change | Files | Test |
|---|---|---|---|
| **S1.1** `/roles` on RolesGuard (A1, D1) | Remove `@UseGuards(PermissionsGuard)` / `@Permissions` from the role and permission controllers. Reads `O A P V`, writes `O A`. `/permissions` reads `O A`. | `modules/employees/controllers/role.controller.ts:23-24`, `permission.controller.ts` | e2e: Payroll Officer lists roles (200); Viewer creates one (403); Admin without `full_access` manages roles (200). |
| **S1.2** Payroll reads for approvers (A2) | `GET /pay-periods`, `/current`, `/:id` add `F Ap`; `GET /payroll/salaries`, `/:id`, `/status-summary` add `F`. | `payroll/controllers/pay-period.controller.ts:51-92`, `payroll.controller.ts` | e2e per role. |
| **S1.3** Identity-first class access (A9) | Drop `@Roles(MARK)` from `GET/POST /attendance/register`; the service authorises (admin, officer, or form teacher of that arm) on **both** read and write. Add `GET /attendance/my-classes/:armId`: roster, medical alerts and today's departures, for the form teacher, identity-scoped. | `attendance/controllers/attendance.controller.ts:61-66,93,110`, `attendance.service.ts:337-343` | e2e: EMPLOYEE-only form teacher reads and marks own arm (200), another arm (403); officer any arm (200). |
| **S1.4** Loans approvable by Approver (D2) | `PATCH /loans/:id/approve|reject` add `Ap`. | `loans/controllers/loan.controller.ts:86-97` | e2e. |

### Client

| PR | Change | Files | Depends |
|---|---|---|---|
| **C1.1** Interim `can()` (A3) | `src/lib/auth/actions.ts`: action → roles, copied from the API's `@Roles` (one entry per write the client calls). `useCan()`. Gate every button listed in A3: payroll approve/process/pay, loan approve/reject/disburse/create, leave request + types, all fee writes, expense transitions, Invite to portal, Recognise. | the pages named in A3 | — |
| **C1.2** Route map matches the API (A5) | Add `P` to `/reports`; `V` to payroll, payslips, loans, leave, tax-rules, banks (read-only now that C1.1 hides writes); `T AT V` to at-risk and calendar (read); `R` to arrears. Remove nothing. | `lib/auth/route-roles.ts` | C1.1 |
| **C1.3** Dashboard asks only what it may (A4) | Each widget gated on its own action (`reports.yearEnd`, `reports.loans`, `payroll.readSalaries`, `fees.summary`, `attendance.daySummary`); fees widget and attendance tile stop firing for everyone. | `app/(dashboard)/page.tsx:71-156`, `components/dashboard/*` | C1.1 |
| **C1.4** Educator path (A9) | `/me/classes/[armId]`: roster + medical alerts + signed-out-today (S1.3 endpoint), Recognise, "Take the register". Register reachable at `/me/classes/[armId]/register` (reuses `RegisterScreen`), exempt from the route map like `/me`. My Classes links to both. | `app/(dashboard)/me/classes/**`, `attendance/register-screen.tsx` | S1.3 |
| **C1.5** Say why, find things | Toast on `?unauthorized=true` ("That page isn't available to your role"). ⌘K built from `filterNavigation()`. | `app/(dashboard)/page.tsx`, `components/common/command-menu.tsx` | — |
| **C1.6** One session writer (A6, part) | `startSession(authResponse)` beside `clearSession()`; the five auth pages call it; register now writes `user-roles`. | `lib/utils/session.ts`, `app/(auth)/*/page.tsx` | — |

**Wave 1 exit:** C0.2 passes for every persona; the matrix in the System Map has
no `!` or `✕` cells.

---

## 5. Wave 2 — Guarantee (1.5 weeks)

Make the Wave 1 fixes impossible to undo by accident.

| PR | Repo | Change |
|---|---|---|
| **S2.1** Action registry | S | `src/common/access/actions.ts`: every action named once (`payroll.approve: [O, A, Ap]`). New `@Can('payroll.approve')` decorator sets `@Roles` from it. Mechanical migration of all 41 `@Roles` controllers; a unit test walks the router (DiscoveryService) and fails if any handler uses raw `@Roles`. |
| **S2.2** Session endpoint | S | `GET /auth/session` → `{ user, systemRoles, tenant, capabilities: string[], identity: { employeeId, formTeacherOf: armId[], guardianId } }`, fresh from the database (JwtStrategy already reloads roles per request, so this is cheap). |
| **S2.3** Actions JSON | S | `GET /auth/actions` → the registry. `npm run actions:export` writes `actions.json` for the client. |
| **S2.4** Transitions for the caller | S | `allowedTransitions` on expenses, invoices, applications, assessments filtered by the caller's actions (`allowedTransitionsFor(actor)`), so an Approver is never offered Submit or Pay. |
| **C2.1** `useSession` / `useCan` from the server | C | Replace C1.1's copied map with S2.2. Refetch on window focus and after any role change in Settings; rewrite the `user-roles` cookie from it (A6 done). |
| **C2.2** Generated route map | C | `src/lib/auth/route-manifest.ts`: each route names the action it needs to load (`/payroll → payroll.readPeriods`). `npm run sync:actions` pulls S2.3 into `actions.generated.json`; `route-roles.ts` becomes a function of the two. Hand-written role lists are gone. |
| **C2.3** Lint the rules | C | ESLint `no-restricted-syntax`: `hasRole(` and `.systemRoles` outside `lib/auth`; `'₦'` and `toLocaleString('en-NG'` outside `lib/utils`; `api.` imports in `app/**`. |
| **S2.5** Audit extensions | S | `audit-actors.py` adds: (a) every `can('x')` and manifest action exists in the registry; (b) every exported client hook has a caller outside `lib/hooks`; (c) every route's roles ⊆ read roles of its manifest action. Wired into S0.2's CI job. |

**Wave 2 exit:** changing a role on one `@Roles` updates the button, the route
and the sidebar without a client edit; CI fails on a hook nobody calls.

---

## 6. Wave 3 — Foundations for consistency (1.5 weeks)

The shared pieces the reorganisation is built from. Each lands with one page
migrated as the reference; the rest migrate in Wave 4.

| PR | Change | Replaces |
|---|---|---|
| **C3.1** `PageHeader` + `Breadcrumbs` | Title, description, actions slot, back link; crumbs from nav-config + record names. | 7 `<h1>` styles across 64 headings |
| **C3.2** `DataTable` v2 | Server pagination, toolbar filters, `rowHref`, row action menu, sticky header, empty/error/loading built in, card layout under 640px. | hand-written `<table>`s on 38 pages |
| **C3.3** Money and dates | `useTenantCurrency()` from the tenant's country; `<Money>`, `formatMoney`, `formatSignedMoney`; codemod for the 17 local helpers and 19 `₦` files. `utils/dates` absorbs the 7 local formatters. | S7, S8 |
| **C3.4** `EntityLink` | `EmployeeLink`, `StudentLink`, `InvoiceLink`, `LoanLink`, `ClassLink`, `UserLink`, each respecting `can()` (plain text when you can't open it). | every plain-text name |
| **C3.5** `useTabParam` | Tabs in `?tab=` (Classes already does it; generalise it). | 9 pages |
| **C3.6** `StatusBadge` registry | One map: salary, pay period, loan, leave, adjustment, payslip, invoice, receipt, concession, application, assessment, expense, statement, KYB, student. | per-page badge maps |
| **C3.7** `FormDialog` + copy guide | One dialog pattern, zod schemas beside the feature, server errors to fields; toast wording. | ad hoc dialogs |
| **C3.8** Feature folders | `src/features/<domain>/{api,hooks,types,components,screens}`; route files become one-line wrappers. Moved per domain in Wave 4 (strangler, not big bang). Roles, Departments and Salary Components get hooks (today they call the API from the page). Payroll types leave `types/api.ts`; school types leave their API files. | S15 |
| **C3.9** Icons and glossary | Unique icon per nav entry; `lib/copy/glossary.ts` (§7) with the D7 pupil/student helper. | 5 reused icons, mixed vocabulary |

---

## 7. Glossary (S14)

| Use | Not | Why |
|---|---|---|
| Staff (nav), employee (the record) | mixing both for the list | "People" was renamed to Staff in Phase 3 for a reason |
| Pupil / Student per D7 | both on one screen | 232 "student" vs 80 "pupil" today |
| Position | "Role" for a job | frees "role" for access |
| Access | "System role" in the UI | what the software lets you touch |
| Educator | Teacher | the school's word (the stored value stays `academic.teacher`) |
| Receipt | Payment (for fees received) | the route is `/fees/payments`, the nav says Receipts; keep the word, redirect the route |
| Bank reconciliation | "Bank" | "Bank" and "Banks" sit side by side today |
| Bank list | "Banks" | it is the list of banks staff are paid into |
| Pay run | Payroll (for one period) | Payroll is the module |

---

## 8. Wave 4 — Reorganise (3 weeks)

The navigation and hubs from System Map §11. Old URLs redirect
(`next.config.ts` `redirects()`), so bookmarks and emailed links keep working.

| PR | Change | Absorbs |
|---|---|---|
| **C4.1** Navigation | Eight groups, 22 entries: Me · Home · People · Admissions · School day · Pay · Money · Insight, plus Setup. ⌘K and mobile drawer from the same tree. | `nav-config.tsx` |
| **C4.2** Setup hub `/setup` | Sections: Organisation, Branding, Team & access, Structure (departments, positions, grades), Pay rules (salary components, tax rules, bank list, countries, payroll settings), School year (sessions, terms, levels, arms, calendar), Events. Owner/Admin (+ the relevant officer per section via `can()`). | settings, departments, roles, grades, salary-components, tax-rules, banks, events, classes (setup half), calendar (edit) |
| **C4.3** Team & access | People with their access and their employee record side by side; view by access; pending invites; deactivate (`useDeleteUser` → deactivate); activity (`useUserActivity`). | Settings → Team |
| **C4.4** Staff record hub | Tabs: Overview, Pay setup, Bank, Payslips, Loans, Leave, Access, History. | employees/[id]; unused `useEmployeeLoans`, `usePayslipsByEmployee`, `useLeaveBalances` |
| **C4.5** Pupil record hub | Tabs: Bio, Guardians, Class & attendance, Fees, Awards, Medical, Documents, Admission. | students/[id]; `useStatement`, `useStudentSummary` |
| **C4.6** Pay run hub | Tabs: Salaries, Adjustments, Payslips, Bank file, Ledger check, Variance. `/payslips` → redirect. | payroll/[id], payslips; `/payroll/variance` |
| **C4.7** Fees hub | Tabs: Price list, Invoices, Receipts, Concessions, Optional fees, Arrears. Four nav entries become one. | fees, invoices, payments, arrears |
| **C4.8** Teacher "Today" | `/me/classes` grows into the form teacher's home: register status, needs a word, signed out today, quick award; the week × pupil attendance grid on each class. Teachers land here. | me/classes, classes/[armId] (for teachers) |
| **C4.9** Approvals inbox | `/approvals`: salaries, adjustments, leave, expenses, concessions, loans, each filtered by `can()`; counts in the sidebar. | five approval screens |
| **C4.10** Persona homes | The dashboard composes widgets by capability; each persona gets a sensible default (bursar: collections vs expected, debtors, spend vs budget, unreconciled lines). | `app/(dashboard)/page.tsx` |
| **C4.11** Portal, public, console | Same `PageHeader`, `DataTable`, `Money`, `StatusBadge` in `/portal`, `/apply`, `/application`, `/invoice`, `/admin`. | 12 pages |

### Page-by-page migration

Every page, where it ends up and which contract items it needs. ✔ means it
already meets that item.

| Page today | Becomes | Wave | Contract work |
|---|---|---|---|
| `/` | Home (persona widgets) | 1, 4 | S3 widgets by `can()`, S7 |
| `/me` | Me → My Pay | 4 | S1, S4 payslips table, S7, add loan request (Wave 5) |
| `/me/leave` | Me → My Leave | 4 | S1, S4, S7 |
| `/me/profile` | Me → My Profile | 4 | S1 |
| `/me/classes` | Me → Today | 1, 4 | C1.4, C4.8 |
| `/students` | People → Students | 4 | S1, S4 (already `DataTable` ✔), S9, D6 default filter |
| `/students/[id]` | Student record hub | 4 | C4.5, S3 invite/recognise, S5 |
| `/students/new`, `/students/import` | People → Students (actions) | 4 | S1, S11 |
| `/admissions` | Admissions | 4 | S1, S4, S10 |
| `/admissions/[id]` | Application | 4 | S1, S9 (link to pupil), S10 |
| `/admissions/question-sets` | Admissions → Question sets tab | 4 | S5 |
| `/classes` | Setup → School year (setup) | 4 | S5 ✔, S1 |
| `/classes/[armId]` | Class (from Today and School year) | 1, 4 | S3 Recognise, S9 |
| `/attendance` | School day → Register | 1, 4 | S1 |
| `/attendance/gate` | School day → Gate | 4 | S1, S13 tablet layout |
| `/attendance/at-risk` | School day → Follow up | 1, 4 | S4, S9, contact log (Wave 5) |
| `/attendance/calendar` | Setup → School year → Calendar (edit); read view for staff | 1, 4 | S3 |
| `/awards` | School day → Awards | 4 | S4, S9 |
| `/fees` | Money → Fees → Price list | 4 | C4.7, S3, S7 |
| `/fees/invoices` | Fees → Invoices | 4 | S3, S4, S7, S9 |
| `/fees/invoices/[id]` | Invoice | 4 | S1, S7, S9 |
| `/fees/payments` | Fees → Receipts | 4 | S3, S4, S7, S9, allocate (Wave 5) |
| `/fees/arrears` | Fees → Arrears | 4 | S4, S7, S9 |
| `/employees` | People → Staff | 4 | S1, S4 (already `DataTable` ✔), S9 |
| `/employees/[id]` | Staff record hub | 4 | C4.4, S5 |
| `/employees/[id]/edit`, `/new`, `/import` | Staff (actions) | 1, 4 | A1 fixed by S1.1, S11 |
| `/roles` | Setup → Structure → Positions | 1, 4 | S4, S11, rename |
| `/departments` | Setup → Structure | 4 | S4, S11, S15 |
| `/grades` | Setup → Structure | 4 | S4, S11 |
| `/leave` | Pay → Leave approvals | 1, 4 | S3, S4, S9 |
| `/events` | Setup → Events | 4 | S4, S11 |
| `/salary-components` | Setup → Pay rules | 4 | S4, S11, S15 |
| `/banks` | Setup → Pay rules → Bank list | 4 | S4 |
| `/tax-rules` | Setup → Pay rules | 4 | S4, S7 |
| `/payroll` | Pay → Pay runs | 1, 4 | S3, S4, S7 |
| `/payroll/[payPeriodId]` | Pay run hub | 1, 4 | C4.6, S3, S9 |
| `/payslips` | redirect → Pay run → Payslips | 4 | — |
| `/loans` | Pay → Loans & advances | 1, 4 | S3, S4, S7, S9 |
| `/loans/[id]` | Loan | 1, 4 | S3, S7, S9 |
| `/ledger` | Money → Ledger | 4 | S4, S5, S7 |
| `/expenses` | Money → Expenses | 2, 4 | S2.4, S4, S7 |
| `/budgets` | Money → Budgets | 4 | S4, S7 |
| `/banking`, `/banking/[id]` | Money → Bank reconciliation | 4 | S4, S7, unmatch (Wave 5) |
| `/reports` | Insight → Reports | 1, 4 | S3 per tab, S5, exports (Wave 5) |
| `/audit-logs` | Insight → Audit log | 4 | S4, S9 |
| `/settings` | Setup (split into sections) | 4 | C4.2, C4.3 |
| `/portal`, `/portal/[studentId]` | Portal | 4 | C4.11, invoices (Wave 5) |
| `/apply/[slug]`, `/application/[token]`, `/invoice/[token]` | Public | 4 | C4.11 |
| `/admin/*` (5 pages) | Platform console | 4 | C4.11, S4 |
| `(auth)/*` (6 pages) | Sign-in | 1 | C1.6 |

---

## 9. Wave 5 — Finish what is built (3–4 weeks, parallel after Wave 3)

Every item already has an API route, most already have a hook.

| PR | Repo | Feature | Lives in |
|---|---|---|---|
| **5.1** | C (+S for D3) | Fee concessions: raise, approve, reject; sibling candidates | Fees → Concessions; Student → Fees |
| **5.2** | C | Optional fees per pupil (subscriptions) | Student → Fees |
| **5.3** | C | Allocate a receipt across invoices; remove one price | Fees → Receipts; Price list |
| **5.4** | C | Student attendance tab (term strip, reasons, lates); class week grid; export for Educators on their own class (S: add form-teacher path to `/attendance/export`) | Student record, Today |
| **5.5** | C | Follow-up contact log ("called mother, sick") (S: new table + endpoint) | Follow up, Student record |
| **5.6** | S+C | Staff loan and advance requests: `POST /me/loans` into the existing PENDING flow | Me → My Pay |
| **5.7** | C | Exports: reports CSV/Excel, attendance CSV, parent attendance export | Reports, Register, Portal |
| **5.8** | C | Bank reconciliation: unmatch, auto-match, post a line | Bank reconciliation |
| **5.9** | S+C | Registrar parent invite (D4): `POST /students/guardians/:id/invite` | Student → Guardians |
| **5.10** | C | Admissions: criteria editor, duplicates merge, retention due / purge | Admissions tabs |
| **5.11** | S+C | Public offer accept/decline and document upload on the status page | `/application/[token]` |
| **5.12** | C | Parent portal: invoices with PDFs; later Paystack checkout (D8) | Portal |
| **5.13** | C | Platform: create a tenant for a customer | `/admin/tenants` |
| **5.14** | C | Delete dead code: `useGrade`, `useTaxRulesList`, `usePayPeriodsList`, `useBirthdaysThisMonth` (if the feed covers it), unused API functions (`getDepartment`, `getRole`, `getSalaryComponent`, `getSettingByKey`, `getTaxRule`, `getPayslipDownloadUrl`) | — |

---

## 10. Sequence and effort

```
Wave 0 ──► Wave 1 ──► Wave 2 ──► Wave 4 (reorganise)
                 └──► Wave 3 ──┘      ▲
                           └──► Wave 5 (features, per hub as it lands)
```

| Wave | Effort (one developer) | Calendar with API + client in parallel |
|---|---|---|
| 0 Safety net | 3–4 days | week 1 |
| 1 Unblock | 5 days | week 2 |
| 2 Guarantee | 7 days | weeks 3–4 |
| 3 Foundations | 7 days | weeks 3–4 |
| 4 Reorganise | 15 days | weeks 5–7 |
| 5 Finish | 15–20 days | weeks 6–9 |

About nine weeks for two developers, or twelve for one. Wave 1 alone removes
every hard block in the map and is worth shipping before anything else.

---

## 11. How we know it is done

| Measure | Today | Target | Checked by |
|---|---|---|---|
| Page × role pairs showing refused actions or data | 23 | 0 | C0.2 persona tests |
| Pairs the route blocks though the API allows | 16 | 0 (or a recorded decision) | S2.5 audit (c) |
| Exported hooks with no caller | 27 | 0 | S2.5 audit (b) |
| `hasRole([...])` outside `lib/auth` | ~20 | 0 | C2.3 lint |
| `<h1>` styles | 7 | 1 | C3.1 + review |
| Hand-written `<table>`s | 38 | 0 | lint after C4 |
| `₦` literals / local money helpers | 19 / 17 | 0 / 0 | C2.3 lint |
| Tabs not in the URL | 9 of 10 | 0 | review |
| Sidebar entries | 36 | 22 | C4.1 |
| `audit-actors.py --gaps` | 0 (blind to the above) | 0 with S2.5 checks | CI |

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| The redirect map misses a link someone emailed | Redirects for every old route (§8); log 404s for a month |
| Capability refactor on 41 controllers breaks a route | S2.1 is mechanical, and the router-walking test plus existing e2e suites cover it; land it controller by controller |
| Identity-first register opens reads too wide | S1.3 authorises the GET in the service too, with e2e for "other arm → 403" |
| Two repos drift during Waves 2–4 | `actions.json` is generated, and S0.2 runs the audit on every API PR |
| Staff relearn the navigation | Old URLs redirect; ⌘K finds pages by old names too; ship C4.1 at a term boundary |

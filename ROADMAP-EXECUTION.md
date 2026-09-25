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

## Progress

| Wave | Status | Where |
|---|---|---|
| 0 Safety net | **Done** 24 Sep | client CI + lint ratchet + persona tests (this repo); `seed:personas` + audit in CI (API) |
| 1 Unblock | **Done** 24 Sep | same two pull requests |
| 2 Guarantee | **Done** 24 Sep | branch `claude/zealous-keller-5aeha8` in both repos |
| 3 Foundations | **Done** 24 Sep | same branches |
| 4 Reorganise | **Done** 25 Sep | branch `claude/zealous-keller-5aeha8` |
| 5 Finish | **Done** 25 Sep, except 5.12b Paystack checkout: **planned**, §9 | same |
| 6 Other organisation types | **Planned**, §9b: modules enforced on the server, then core-only readiness, then shared additions, then packs per signed customer | — |

Wave 1's exit test passes: all 17 persona tests are green against a seeded
school (every persona's sidebar loads with no 401/403/5xx and no page error,
plus the four repaired paths walked end to end), and the API's access suite
passes 26/26. Its first 19 tests were run against the code before Wave 1, and
15 of them failed there.

### Wave 2 and 3 exit

- **One registry, enforced.** 82 actions in the API's
  `src/common/access/actions.ts`; all 349 endpoints use `@Can`, with exactly
  the roles they had before, and a test fails on any raw `@Roles`. The client
  generates its copy (`npm run sync:actions`); the audit fails when the two
  differ, when the client names an action that does not exist, or when an
  exported hook has no caller (the 25 known ones were removed in 5.14).
- **Exit test ("change a role once, everything follows"):** route roles are
  derived from the manifest plus the registry — the same 39 routes and roles
  as the hand-written map they replaced; `can()` answers from
  `GET /auth/session`, refetched on focus and after an access change, which
  also rewrites the middleware's cookie. `hasRole(`, `.systemRoles`, `₦`,
  locale-specific formatting and API calls from `app/` are lint errors
  (the last three held flat by the ratchet until Wave 4 moves those screens).
- **Checks:** persona tests 17/17 against the rebuilt API and client; API
  unit 808/808, e2e 510 passed (2 skipped) across 45 suites; audit 0
  findings; client typecheck clean, lint ratchet down from 70 to 51
  file/rule pairs.
- **Wave 3 references:** Employees (PageHeader, breadcrumbs), Loans
  (DataTable v2), Departments (FormDialog, feature folder, hooks), Positions
  (glossary, copy), the employee record (`?tab=`), payroll and loans
  (statuses). Money, dates and statuses were converted everywhere, not only on
  the reference pages: 16 local money helpers, 20 date formatters and 14
  status maps are gone.

### Found and fixed in Waves 2–3

- **Every tab could be told a list was empty when a filter hid it**, and
  most lists could not be searched. Every list someone works from now has
  search and the filters that fit it (§1, S4); invoices and pay runs search
  on the server, which the API now supports.
- **Admissions counts read 0** for every stage but the one filtered to.
- **Imports hid the API's reason** for refusing a file ("Import failed").
- **Arrears offered Finance a link to a pupil record** it cannot open.
- **A guardian logging in was sent to the staff dashboard** for the
  middleware to bounce; login, invites and resets now share one rule.
- **The department form had no control** for its head or parent department.
- **`node dist/main` would not start** once a dev script joined the build.

### Wave 4 so far

- **Two findings fixed first.** Loan, salary and bulk approval recorded the
  approver the browser sent; they now record the signed-in user (the field is
  accepted and ignored until old clients are gone). Report exports opened a
  URL without the login and were always a 401; they now download through the
  API client. Both have tests.
- **C4.1 Navigation.** Me · Home · People · Admissions · School day · Pay ·
  Money · Insight · Setup, one tree for the sidebar, mobile drawer and ⌘K
  (which also lists every Setup page by name).
- **C4.2 Setup.** `/setup` is one door to Organisation (organisation & access,
  events), Structure (departments, positions, grades), Pay rules (salary
  components, tax rules, bank list) and School year (sessions & terms,
  classes, calendar); each person sees only the pages they may open. Eight
  pages moved under `/setup/*`; the old URLs redirect permanently
  (`MOVED_ROUTES`, next.config.ts), and every moved page has a Setup
  breadcrumb.
- **Found on the way:** the audit's sidebar check matched single quotes only,
  and the sidebar uses double quotes, so it had never checked anything. It
  now reads both, plus the Setup sections.
- **Checks:** persona tests 21/21 (each persona also opens every Setup page
  they are shown; old URLs land on the new ones); API unit 808/808, e2e 512
  passed (2 skipped); audit 0; lint ratchet 45 file/rule pairs.
- **C4.3 Team & access** (`/setup/team`): everyone who can sign in, their
  staff record, access and status; access chips as the view by access;
  change access, activity, resend a waiting invite (new
  `POST /users/:id/resend-invite`), deactivate or reactivate. Organisation
  keeps profile, branding and reference data, with tabs in `?tab=`.
- **C4.7 Fees hub**: one sidebar entry, tabs Price list · Invoices ·
  Receipts · Concessions · Optional fees · Arrears (`SectionTabs`, for the
  next hubs). With it, Wave 5's fee items:
  - **5.1 Concessions** under D3: raised by Finance or the Registrar,
    decided by the Owner, an Admin or an Approver, never by whoever raised
    it; sibling suggestions, never applied automatically.
  - **5.2 Optional fees**: who takes transport, lunch, clubs, with a
    per-pupil price.
  - **5.3** Apply a receipt's credit to unpaid invoices; clear a price cell
    to remove a price.
- **C4.9 Approvals** (`/approvals`, `GET /approvals`): pay runs, pay
  adjustments, leave, loans, expenses and concessions waiting on you, decided
  in place; a live count in the sidebar.
- **Access changes this round:** concessions follow D3 (new
  `fees.concessions.*` actions); Finance may search the roll
  (`students.list`) to pick whom a concession or payment is for, not open
  the record.
- **Checks:** persona tests 29/29; API unit 808/808, e2e 523 passed (2
  skipped); audit 0 (16 hooks still unbuilt, down from 25); lint ratchet 44.
- **C4.4 Staff record**: Overview · Pay setup · Bank · Payslips · Loans ·
  Leave · Access · History, each tab shown to whoever may read it. Loans
  opens the new-loan form with the person chosen; Access invites, changes
  access, resends and shows activity for this one person.
- **C4.5 Pupil record**: Bio · Guardians · Class & attendance · Fees ·
  Awards · Medical · Documents · Admission, under the shared PageHeader.
  - **5.4 (the pupil half)**: the term's rate, lates, absences and streaks,
    a strip of every marked day, each absence or late with its reason. The
    class week grid and the Educator's own-class export go with C4.8.
  - Fees: owed, unapplied credit, optional fees, concessions (raise one
    here) and the statement. Admission: the application the pupil came in
    on (`GET /admissions/applications?studentId=`).
  - **5.9 (D4)**: `POST /users/guardians/:id/invite` (`guardians.invite`:
    Owner, Admin, Registrar) only ever creates a PARENT login, and only for
    a guardian of a pupil here; Invite to portal uses it.
- **C4.6 Pay run**: Salaries · Adjustments · Payslips · Bank file · Ledger
  check · Variance. Payslips moved onto the run; Variance reads
  `GET /payroll/variance/:id`, which nothing called. `/payslips` lands on
  the latest run's Payslips tab and left the sidebar.
- **5.6 Loan requests**: My Pay lists loans owed or waiting and offers
  "Ask for a loan or advance" (`POST /me/loans`, interest-free, PENDING,
  the borrower from the token).
- **Nobody decides their own loan or leave**: the API refuses it (403) and
  the approvals inbox, loan page and leave list show it as yours.
- **Found by the new persona tests:** an Approver opening a pay run was
  refused the staff list (the raise-adjustment form loaded it for
  everyone); pay runs could only be opened with a mouse. Both fixed.
- **Checks:** persona tests 36/36 (each record's every tab, per persona);
  API unit 811/811, e2e 532 passed (2 skipped); audit 0 (12 hooks still
  unbuilt); lint ratchet 41.
- **C4.8 Today**: a form teacher who does not also run part of the school
  lands on My Classes at sign-in (`landingAfterSignIn` asks the session which
  classes are theirs). Each class shows the register, who has signed out
  today (`signedOutToday` on `GET /attendance/my-classes`), who needs a
  word, and a step to recognise a pupil or read the week.
- **5.4, the class half**: the week grid on each class (`GET
  /attendance/my-classes/:armId/week`): a row per pupil, a column per day,
  each cell's letter as well as its colour, holidays shown as such. A form
  teacher exports their own class as CSV; `GET /attendance/export` now lets
  them, and only for their class (`assertCanExport`).
- **5.7, attendance CSV**: the office downloads the register for any dates,
  the whole school or one class, from the Register page.
- **Checks:** persona tests 40/40; API unit 811/811, e2e 537 passed (2
  skipped); audit 0; lint ratchet 41.
### Feedback round 1

| Feedback | Where it falls | Done |
|---|---|---|
| Absent vs excused, and their reasons | 5.4 | The register explains both (unauthorised vs authorised); "Away" is "Absent" everywhere; summaries count both; the class week lists each absence and late with its reason |
| Name order, search and lists | C3.7 copy guide | Lists read "Surname, First" and sort by surname; titles "First Surname" (`lib/utils/names`, docs/COPY.md); search matches a full name in either order, client and API (`whereWordsMatch`); fee lists too |
| Attendance history on the pupil page | C4.5 / 5.4 | The Class & attendance tab (for those who read attendance) |
| Click anyone to open their profile | C3.4 | Registers, rosters, alerts, awards, fees lists, reports, staff and pupil tables link each name |
| Classes show filled/total seats | C4.2 | "24/30 seats", and a full class says so (`enrolled` on `GET /academics/arms`) |
| Admissions grouped by class level | 5.10 | A row of classes with counts; the list sorts by class, then surname |
| Special needs on the application | 5.15 (new) | Done, above |
| Copy with feedback after applying | 5.11 | `CopyButton` says "Copied" (number and link; also the admissions and invite links) |
| Question sets per class | 5.10 | A set per class level or the default; booking uses the candidate's class's set |
| Assessment schedules for the admissions officer | 5.16 (new) | Done, above; `GET /admissions/assessors` lets the office pick an assessor without the staff list |

- **Also found:** support notes carried from admissions at enrolment were
  never shown anywhere; the pupil's Medical tab and the class alerts show
  them now.
- **Checks:** persona tests 43/43; API unit 814/814, e2e 547 passed (2
  skipped); audit 0; three migrations (SupportNeeds, QuestionSetsPerClass,
  AssessmentDuration).
- **Decision (Sep 25):** Registrars do not see a pupil's attendance history
  for now (`attendance.report` stays as it is); revisit if feedback asks.

### C4.10 Persona homes

- **Waiting on you**, at the top of every home, from `GET /home`: decisions
  (the approvals inbox), my classes' registers not yet taken, registers
  across the school, applications to consider, sittings today, pay runs due
  within a fortnight, bank lines to reconcile, overdue invoices (count and
  amount), and my own requests still pending. Each counted only for whom
  it is theirs; only counts above zero, so no row of zeros.
- **Whose home leads with what:** the bursar's with money (fees, and the
  new spend-against-budget widget), the registrar's with the school; the
  payroll office keeps the payroll figures first; an employee keeps My Pay.
  Every widget still gates itself on what the person may read.
- Without approved payroll, the home no longer hides the rest of the
  school (attendance, the roll, fees, budgets).
- **Checks:** persona tests 45/45; API unit 814/814, e2e 551 passed (2
  skipped); audit 0; lint ratchet clean.

### C4.11 Portal, public pages and console

- **Parent portal:** `PageHeader` on both pages; a child's page has the
  trail back to "Your children" (outside the app's sections the page's own
  crumbs are the whole trail). The account history is a `DataTable` with
  formatted dates (it printed raw ISO dates); "Nothing owed" and the days to
  know about are `StatusBadge`s (new `balance` kind).
- **5.7, parent attendance export:** "Download attendance" on a child's
  page saves that child's term as CSV from the existing
  `GET /portal/children/:id/attendance/export`.
- **Public pages:** the invoice's dates go through `utils/dates` (the due
  date and payments were raw ISO); payments received are a `DataTable`; the
  bill's own lines stay a document table, as they add up to a total. The
  apply, status and invoice pages now load through hooks
  (`lib/hooks/use-public.ts`), which clears three of the lint baseline's
  held errors. The status page keeps its plain-language sentences rather
  than a badge: it is written for a parent, not an office.
- **Console:** all five pages on `PageHeader`; tenants, the overview's
  recent tenants, the KYB queue and the audit log on `DataTable` (shared
  tenant columns in `features/admin`); tenant active/suspended and audit
  actions and categories join the status registry (new `tenant`,
  `auditAction`, `auditCategory` kinds). The school's own audit log uses
  the same audit kinds, so its two private colour maps are gone, and
  `KybBadge` is replaced by `StatusBadge`. The console's audit log pages
  and filters on the server as before.
- **Checks:** persona tests 46/46 (new: a parent finds the way back and
  downloads a child's attendance); console and public pages walked in
  Chromium as a super-admin and anonymously, with no page errors or failed
  requests; audit 0; lint ratchet clean (baseline 37 pairs).

**Wave 4 is done.**

### 5.5 Contact log

- **What:** a row per contact with a pupil's family: how (call, message,
  meeting, home visit), with whom, whether it got through ("no answer" is
  its own outcome, so it reads as a reason to try again), when, and what
  came of it. New table `student_contacts` (tenant-isolated, in the RLS
  coverage suite); `GET` and `POST /students/:id/contacts`.
- **Follow up:** the list is on `PageHeader` and `DataTable` with server
  pages, a **Last contact** column (outcome, date, who) and a **Log
  contact** action on each row. The list shows when and who, never the
  note: it is read by Finance and Viewers too, and notes are often about a
  child's health.
- **Pupil record:** "Contact with the family" on the Attendance tab, newest
  first, with "Log a contact".
- **Who:** new actions `contacts.read` and `contacts.log`, both Owner,
  Admin, Attendance Officer and Educator. The attendance office logs from
  the list (it does not open pupil records); the notes are read on the
  record.
- **Found, not fixed here:** every write's request body goes into the audit
  log, so contact notes (like medical record changes before them) are
  stored there in full. Needs a redaction list in the audit interceptor;
  raised as its own task.
- **Checks:** API unit 815/815, e2e 556 passed (2 skipped) including the
  new contacts suite; drift check clean; audit 0. Persona tests 49/49 (new:
  the attendance office logs a call from the list, an admin reads it on the
  record, a viewer gets no log button); one run hit a React #418 on
  `/approvals` under load, which passed twice on rerun and is raised as its
  own task.

### 5.8 Bank reconciliation

- **Unmatch:** the statement screen lists what is already **Matched**,
  grouped by match, each with **Undo match** while the statement is open.
  Before, a match (including one made by "Match the obvious ones") could
  not be seen or undone, although the API allowed it.
- **Auto-match and post a line** were already on the screen; posting is
  now a `FormDialog` that says what is missing and takes an optional
  description for the journal entry, and **Sign off** asks for
  confirmation, since a signed-off statement cannot be changed.
- **Screens:** the statements list is a `DataTable` with a status filter
  and search; both screens use `PageHeader`, `StatusBadge` and formatted
  dates (they printed ISO dates); amounts no longer wrap their sign onto
  its own line.
- Client only: the API already had unmatch, auto-match and posting.
- **Not fixed here:** the verdict sentence comes from the API with the
  amount unformatted ("2500000.00 cannot be accounted for…").
- **Checks:** persona tests 50/50 (new: the finance office undoes a match,
  lets "Match the obvious ones" put it back, and is asked what a line was
  before it is posted); typecheck and lint ratchet clean.

### 5.10 Admissions: criteria, duplicates, retention

- **Criteria** (`/admissions/criteria`, in the Admissions menu): each class
  level's standard for a session: an age range (in years, as of the
  session's start), a lowest exam score, whether an interview is needed,
  and notes. Set and removed by the registrar (`admissions.setQuestions`),
  read by everyone who assesses. Advisory, as the API already was: an
  application shows how the candidate measures up and nothing is refused.
- **Duplicates:** an application with the same name and date of birth as
  another shows "May be the same child" at the top, with the other
  application's number, stage, date and phone. The office can keep the
  other one and withdraw this one, noted "Duplicate of 0001"; nothing is
  copied across (the API has no merge, and moving assessments and
  documents between applications is a larger change). An application that
  has itself ended is never offered as the one to keep.
- **Retention** (`/admissions/retention`, `admissions.decide`): the
  unsuccessful applications past the date the school keeps them to, and
  one confirmed "Delete for good". The admissions list says when any are
  due. Nothing is deleted on a timer.
- **Found on the way:** the API's actors audit checks the client's `main`,
  and 5.8 started calling `useUnmatch`, which the audit still listed as
  never called; the next API pull request would have failed. Taken off the
  list in this round's API change.
- **Checks:** persona tests 52/52 (new: the registrar sets a class's
  criteria, is told when the oldest is younger than the youngest, and
  removes them again; the retention list before anything is deleted); a
  duplicate filed through the public form showed on the application and
  was withdrawn as one in the browser; audit 0; typecheck and lint
  ratchet clean.

### 5.11 The family's link: answer an offer, send papers

- **Offer:** a family holding their application link can **Accept the
  place** or **Decline** it (declining asks first) while the offer is live.
  `POST /public/applications/:token/offer` makes the office's own move
  through the same rulebook, under the tenant the token proves; an offer
  past its deadline is refused even before the nightly sweep marks it
  expired. The office's decision notes are left as they were.
- **Papers:** the same page takes a birth certificate, immunisation record,
  last school's report, photograph, parent's ID or something else
  (`POST /public/applications/:token/documents`): bytes sniffed, 5 MB, ten
  per application, and only while the application is open. The page lists
  what was sent by name; the link can send papers, never fetch them back.
- **The office sees them:** the application page gained a **Documents**
  section (it had none: papers attached to an application were invisible
  until enrolment moved them to the pupil). The pupil record's documents
  panel is now one shared `DocumentsPanel`, keyed by owner, and the
  pupil-only document hooks and API functions are gone.
- **Guard rails the change met:** the public-route registry (every
  `@Public()` route must say how it reaches data under RLS) and the
  allow-list of fields the public status response may carry both failed
  until the new routes and fields were written into them, as intended.
- **Checks:** API unit 815/815; e2e 565 passed (2 skipped), nine new in
  the public admissions suite (accept once, decline closes the link, a
  lapsed offer, a bad answer, a birth certificate reaching the office, the
  office's kinds and a disguised file refused, the limit of ten, an unreal
  link); drift clean; audit 0. Persona tests 53/53 (new: a family sends a
  birth certificate and accepts the place from their link, and the
  registrar finds the file on the application).

### 5.12 Parent portal: bills and their PDFs

- **Bills** on each child's portal page: every issued invoice, newest
  first, with its term, number, due date, total and what is still to pay
  ("Nothing owed" when settled), and a **PDF** link. A bill opens the same
  page the school's own message links to (`/invoice/:token`), so there is
  one way to read a bill and one access rule to get right.
- New `GET /portal/children/:studentId/invoices`, behind the same
  guardian-owns-child check as the statement; drafts and cancelled bills are
  left out; totals use the same arithmetic as the portal's "owed" figure,
  and a test holds the two to agree.
- **Not yet: Paystack (D8).** Online payment needs the school's Paystack
  keys, a webhook the API can receive from outside, and a decision on who
  pays the card fee; it stays behind its feature flag for a later round.
- **Checks:** API unit 815/815, e2e 569 passed (2 skipped), four new in the
  fee payments suite (each bill's sums and link, a cancelled bill left
  out, agreement with the portal's own total, refusal for another family's
  child and for staff); drift clean; audit 0. Persona tests 54/54 (new: a
  parent reads a child's bills, has a PDF link, and opens one).

### 5.13 Platform: set up an organisation for a customer

- **Set up an organisation** on the console's Tenants page: name, kind
  (school, company, hospital…), an optional web address, and the owner's
  name and email. It creates the organisation with its starter
  departments, positions, pay components and chart of accounts, and
  invites the owner, who chooses their own password; the operator never
  knows it. When email is not set up, the console shows the one-use link
  with Copy.
- New `POST /platform/tenants` (`tenants.manage`, super-admin only), the
  same order as self-registration: an owner email with a login already is
  refused before anything is made; if the invite fails anyway, the new
  organisation is removed so the operator can try again; defaults are
  provisioned in the new organisation's own scope; the creation is
  audited. The old `POST /tenants` still makes only the bare row and is not
  what the console uses: an organisation nobody can sign into is the dead
  end registration was rewritten to prevent.
- **Checks:** API unit 815/815, e2e 573 passed (2 skipped), four new in the
  platform console suite (a school set up with its chart of accounts and
  an owner who accepts the invite and signs in; a taken owner email
  refused with nothing left behind; a taken web address refused; a school
  owner refused); drift clean; audit 0. Persona tests 55/55 (new: the
  operator sets up an organisation from the console; it runs when
  `PLATFORM_EMAIL` and `PLATFORM_PASSWORD` name an operator, as there is
  no platform persona).

### 5.14 Dead code

- Removed the hooks nothing called (`useUpdateSchoolDay`, `useUser`,
  `useGrade`, `useUpdateAdjustment`, `useGuardians`,
  `useBirthdaysThisMonth`, `usePayslip`, `useGeneratePayslip`,
  `useExpense`, `useSpendByAccount`, `useBudgets`) and the API functions
  only they used, with `getDepartment`, `getRole`, `getSalaryComponent`,
  `getSettingByKey`, `getTaxRule` and `getPayslipDownloadUrl`: 21 files,
  240 lines. `useTaxRulesList` and `usePayPeriodsList` stay: onboarding
  calls them. The audit's list of known uncalled hooks is now empty, so
  any new one fails it.

### 5.17 Positions carry default access

- A position's **Default access** replaces its Permissions (which gated
  nothing since D1): a set of access roles, e.g. Head Teacher → Educator,
  Approver. Ownership, the platform operator and Parent can never be
  defaults, and setting them needs `users.manage`, since it gives access
  to people.
- Someone's access is the position's roles plus their own. It is worked
  out on sign-in, on the session, and on every request (the JWT strategy
  reloads the user), so changing a position changes everyone in it on
  their next click, with nothing to sign out of. Only a login linked to an
  **active** employee inherits: someone who has left loses it.
- A person's own roles are kept apart and never touched by a position.
  Team & access shows inherited roles as locked (dashed, with the
  position's name), in the list and in Change access; an own role that the
  position also gives is marked so it can be unticked. Filters and counts
  go by what people may actually do. The staff record's Access tab shows
  both.
- Changing a position's access with people in it asks first: "The 3
  people in Head Teacher will have Approver … Access given to them
  individually is not changed."
- API: `roles.access_roles` (migration), `PositionAccessService`,
  `/auth/session` returns `ownRoles` and `positionAccess`, `/users` returns
  `positionAccess`, `/roles` returns `staffCount`. `permissionIds` is gone
  from the position DTOs (the audit flagged it as writable with no
  control).
- Fixed on the way: an empty salary band stopped a position being saved
  ("expected number, received NaN").
- **Checks:** API unit 815/815; e2e 580 passed (2 skipped), 7 new
  (access arrives on the same token after a change; the session and team
  list report it, without secrets; own roles survive position changes;
  Owner, operator, Parent and unknown roles refused; a leaver loses it;
  a non-manager refused); drift clean; audit 0. Persona tests 55 passed (the console one skipped: no operator)
  (new: a position given Approver, someone hired into it shown with a
  locked Approver, and a change confirmed for "1 person" and followed in
  Team & access).

### Payslip and loans (after Wave 5)

- **The payslip is one A4 page, always.** Earnings and deductions side by
  side, year to date as one strip, the footer at the foot of the page; when
  a month will not fit, explanations give way before any figure does. The
  naira sign prints (Liberation Sans, shipped with the API, so invoices and
  receipts gain it too); loans read "Staff loan, 3 of 12"; notes read "8% of
  gross salary (₦513,000)"; lines keep one order for everyone
  (`salary_details.sort_order`); a net that is not gross minus deductions
  says why.
- **Loans are never forgiven by a short month.** The balance falls by what
  was taken; the rest is arrears (`loans.arrears`), added to next month's
  deduction. Each repayment records what was due beside what was taken, and
  is PAID, PARTIAL or MISSED; a discarded run restores both.
- **A monthly limit on loan deductions, on by default:** at most a third of
  gross pay (the school can change it in Setup → Organisation). Payroll
  holds each month to it and carries the rest; the payslip names it; an
  approver is warned before approving a loan over it.
- Found on the way: an Approver opening a loan was refused its History (the
  audit log); History is now asked for, and shown, only for those who may
  read it (`audit.entityHistory`, on loans and staff records).
- **What may be borrowed, checked when it is asked for** (by the employee
  or the payroll office), each a school setting with a default: a loan over
  at most 12 months; an advance of at most the monthly limit's share of
  gross pay (so it comes back on the next payday); a loan of at most 3
  months' gross pay. Over them, the request is refused with the reason and
  the figure allowed; the forms show each person's limits before they ask
  (`GET /me/loan-limits`, `GET /loans/limits/:employeeId`). All four limits
  sit together in Setup → Organisation → Loans and advances.

Left in Wave 5: Paystack checkout, now planned in full as 5.12b (§9).

### Left for later waves

- 35 screens still render hand-written tables (the working lists among them
  with `ListFilters` above); Wave 4 moves each to DataTable with its domain.
- Payroll and school types still live in `types/api.ts` and the API files
  (C3.8's type moves happen per domain in Wave 4).
- `UserLink` was not built: a login is shown on its staff record's Access
  tab, so links go to the staff record.

### What Wave 1 turned up that the map had not

Running the persona tests before fixing anything found more than the map did.
All of it was fixed in the same pull requests:

- **No one outside payroll could request leave.** My Leave read
  `GET /leave/types` (O A P Ap V). New `GET /me/leave/types`.
- **React #418 on nearly every screen.** The auth store rehydrates in the root
  layout's effect, but pages hydrate later inside `loading.tsx` boundaries, so
  their first render already knew the user (and the tenant) and disagreed
  with the server's HTML. New `useHydrated()`; `useAuth` reports signed-out
  until the component has hydrated.
- **Registrars could not choose a class's educator**, and the Classes screen
  403'd for Educators: it loaded the whole staff list to print one name per
  class. Arms now carry `formTeacherName`; new `GET /academics/educators`
  (id, name, position, department) for the picker.
- **The Gate could not find a pupil** for an Attendance Officer
  (`GET /students` now admits them; the full record still does not).
- **Departments were unreadable to those who pick one** (Payroll on the
  employee form, Finance on budgets). Reads now O A P F Ap V.
- **A form teacher holding only Employee could not recognise their own
  pupils.** Awards are now granted by identity as well as role
  (`AwardService.assertCanGrant`).
- **Any tenant owner could write the global `permissions` table.** Writes are
  super-admin only.
- **Any tenant's Owner/Admin could add, edit or delete `countries` and
  `payroll_settings`**, global tables shared by every tenant. Writes are now
  super-admin only (API #64), and Settings no longer offers them to anyone
  else (client #63; since Wave 2, `can('countries.manage')` and
  `can('settings.manage')`).

### Found, not fixed (outside Waves 0–1)

- **Loan approval takes `approverId` from the request body**, so the recorded
  approver is whatever the client sends. The server should use the caller.
- **Report exports open a bare URL** (`window.open(getExportCsvUrl(…))`), which
  carries no token, so they cannot authenticate. Belongs with the Wave 5
  exports work.
- 26 pre-existing lint errors (React Compiler rules), held flat by the
  ratchet; down from 37.

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
| S4 | Lists | `DataTable`: server pagination, toolbar filters, row click to the record (#58), row action menu named after the subject (#59). **Filters:** a search box saying what it searches, plus a filter for each thing people sort that list by — its status (from the registry), the record it belongs to (class, position, account, pay run) and its kind; "No X match" when a filter hides everything. Paged lists filter on the server. |
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

## 2. Decisions

These are policy, not code. **All eight recommendations were accepted on 24
Sep.** D1, D2 and D5 are done in Wave 1; the rest land with the wave named.

| # | Question | Decision |
|---|---|---|
| D1 | Keep job-role **permissions** (`PermissionsGuard`)? | Retire them. One mechanism. Keep the table for a later fine-grained model if a customer asks. |
| D2 | May **Approvers** approve loans? Today only Owner/Admin can. | Yes: loans are exactly what an Approver is for. |
| D3 | Separation of duties for **concessions, loans, invoices** | Concessions: raise by Finance/Registrar, approve by Owner/Admin/Approver. Loans: as D2. Invoices: unchanged. |
| D4 | May **Registrars** invite parents to the portal? | Yes, through a dedicated endpoint that can only create PARENT accounts for linked guardians. |
| D5 | Who **downloads the bank payment file**? | Keep Owner/Admin/Finance; hide the button from Payroll Officers (preview only). |
| D6 | What does an **Educator** see of the pupil list? | Default "my class", switch to "whole school" (API unchanged until timetables). |
| D7 | **Pupil or student?** | "Pupil" in primary tenants, "Student" in secondary, set per tenant; one term per screen, from a glossary helper. If one word: "Student" (it is the API's word). |
| D8 | **Payment gateway** for parents | Paystack (NGN, card + transfer), hosted checkout, 5.12b. There is no feature-flag system: each school switches it on in Setup, and no Paystack key on the API means no Pay button anywhere. |
| D9 | **Whose Paystack account** | Soteria's, with a **sub-account per school**; Paystack settles each school's money straight to the school's bank. Schools need no keys or Paystack setup, there is one webhook, and Soteria never holds the money. A school's KYB must be approved first. |
| D10 | **Who pays the card fee** | **The parent**, shown as its own line ("Bill ₦250,000 + processing ₦2,000"). The school receives the bill in full. Soteria's cut is 0% for now; the split allows one later. |
| D11 | **What stops a hospital calling `/students`?** | Today, nothing: school pages are only hidden in the menu. Each tenant gets **modules**, from its type and switchable by the operator, and the API refuses a module the tenant lacks (6.0). |
| D12 | **When to build a type's own features** | Only with a signed pilot customer of that type, as the school side was shaped by a real school. Until then they get the shared core. |

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
| **5.12** | C | Parent portal: invoices with PDFs | Portal |
| **5.12b** | S+C | Paystack checkout (D8–D10): parents pay bills online, receipted and posted on Paystack's word, settled into the bank reconciliation | Portal → Bills, `/invoice/[token]`, Setup → Online payments |
| **5.13** | C | Platform: create a tenant for a customer | `/admin/tenants` |
| **5.15** | S+C | Support needs on the application (sight/glasses, hearing, mobility, learning, speech, social, medical, other, notes), carried to the pupil and the class's alerts | Apply form, application, Student → Medical |
| **5.16** | S+C | Assessment diary: slots with a duration, no double booking of an assessor or a child, the candidate's details and question set beside each sitting | Admissions → Assessment diary |
| **5.14** | C | Delete dead code: `useGrade`, `useTaxRulesList`, `usePayPeriodsList`, `useBirthdaysThisMonth` (if the feed covers it), unused API functions (`getDepartment`, `getRole`, `getSalaryComponent`, `getSettingByKey`, `getTaxRule`, `getPayslipDownloadUrl`) | — |
| **5.17** | S+C | Positions carry default access: everyone in a position has its access roles on top of their own, worked out on every request | Setup → Positions, Team & access, staff record → Access |

### 5.12b Paystack checkout — plan

**What it does.** A parent pays one or more bills online, from the portal or
from the bill link the school's messages send (`/invoice/[token]`), so a
family without a portal login can pay too. The receipt, its postings and the
bill's new balance appear within a minute, with no one keying anything, and
the next day's settlement matches one line on the bank statement.

**Decisions** (D8–D10):

| Question | Answer |
|---|---|
| Card fee | Paid by the parent, as a line of its own. Grossed up so the school gets the bill in full: total = (bill + flat fee) ÷ (1 − rate), capped at bill + cap. Today's local rate is 1.5% + ₦100 (the ₦100 waived under ₦2,500), capped at ₦2,000. Confirm at go-live; it lives in config, not code. |
| Account | Soteria's Paystack account with one sub-account per school (`bearer: subaccount`, Soteria's share 0%). |
| Card data | Never seen: Paystack's hosted checkout. |
| What a parent may pay | The full balance of the bills they pick, by default; part payments down to ₦1,000. Money over a bill's balance lands as an unallocated credit, as a receipt already does. |
| Switch | Per school in Setup; nowhere at all without `PAYSTACK_SECRET_KEY`. |

**What is already there.** `FeePaymentService.record()` allocates, posts
and refuses a reference already receipted, which makes a repeated webhook
harmless. `PaymentMethod.ONLINE` is reserved for it. The public bill link and
the portal's bills exist (5.12). Bank reconciliation matches statement lines
(5.8). Column encryption exists for the bank account number. Missing: raw
request bodies (needed to check Paystack's signature), a clearing account and
anything that talks to Paystack.

**The books.**

| When | Debit | Credit |
|---|---|---|
| Paystack says it is paid | **Paystack clearing** (new asset account): total less Paystack's actual fee; **Payment processing charges**: the actual fee | **Fees receivable**: the bill amount; **Processing fees recovered**: the surcharge |
| Paystack settles (daily job reading its settlements) | Bank | Paystack clearing |

The fee and the surcharge net to within kobo, and both are visible. The
clearing account standing at zero proves nothing went missing between a
parent's payment and the school's bank.

**The flow.**

1. **Setup → Online payments** (new action `payments.configure`: Owner,
   Finance Admin). Pick the bank and type the account number; Paystack reads
   back the account name, and the school confirms it (a mistyped account
   fails here, not on payday). The school's KYB must be approved. The
   sub-account is created and its code kept; the account number is encrypted.
2. **Pay.** `POST /portal/children/:studentId/checkout` (guardian-owns-child,
   as the bills) and `POST /public/invoices/:token/checkout` record a
   **payment intent**: a reference of our own, the bills and amounts it pays,
   the bill total, the surcharge, PENDING. Paystack's initialise call returns
   its checkout page, and the parent goes there.
3. **Webhook.** `POST /webhooks/paystack`, public, throttled, registered in
   `public-routes.spec.ts`. It checks the HMAC-SHA512 signature over the raw
   body, finds the intent by reference, then asks Paystack's verify endpoint
   for the amount, currency (NGN) and status, never trusting the webhook body
   alone. It locks the intent, marks it PAID and calls `record()` (ONLINE,
   Paystack's reference, the clearing account, the intent's allocations), in
   one transaction. A second delivery finds the reference receipted and does
   nothing. A wrong amount posts nothing: the intent is flagged and the
   bursar told.
4. **Back from Paystack.** `/pay/return?reference=…` verifies too, so a slow
   webhook does not leave the parent wondering. It shows "Paid: receipt
   R-00123" with the PDF, and the receipt is emailed.
5. **Clean-up job** every 15 minutes: an intent PENDING for over 10 minutes
   is verified; after 24 hours it is marked EXPIRED.
6. **Disputes and refunds.** `charge.dispute.create` flags the receipt and
   tells the bursar. "Refund to card" on an online receipt goes through the
   Approvals inbox, then voids the receipt (reversed, never deleted) and
   calls Paystack's refund.

**The school sees** receipts marked Online in Fees → Receipts, the
surcharge nowhere on the bill's balance, and the clearing account in the
ledger. **The parent sees** a Pay button on each unpaid bill, the fee before
they commit, and a receipt at the end.

**Tests.** API e2e against a Paystack stub (`PAYSTACK_BASE_URL`): intent →
signed webhook → one receipt and its postings; the same webhook twice, one
receipt; a bad signature, 401; a changed amount, nothing posted and the
intent flagged; another family's child, 403; a school not switched on, no
checkout; settlement moves clearing to bank; the clean-up job expires and
recovers intents. Persona: a parent pays a bill in the stub checkout and sees
it paid. Unit: the gross-up at the ₦2,500 threshold and the cap.

**Needed before going live** (the build and every test run in Paystack's
test mode without them):

1. Soteria's Paystack business account, approved for live payments (CAC
   registration), and its secret key in the API's environment.
2. The API at a public HTTPS address, with the webhook URL registered in the
   Paystack dashboard.
3. Each pilot school's settlement account, and its KYB approved.

**Effort** 1½–2 weeks. **Done when** a parent pays a real bill in live mode,
the receipt and postings appear within a minute, and the next day's
settlement reconciles.

---

## 9b. Wave 6 — Other organisation types

The school is covered, pending feedback from real use. The other types
(`HOSPITAL`, `CORPORATE`, `NGO`, `GOVERNMENT`, `NONPROFIT`, `HOSPITALITY`,
`OTHER`) already have the shared core: staff, pay runs (PAYE, pension, NHF),
loans, leave, expenses, budgets, bank reconciliation, the ledger, reports,
approvals, access and self-service. Provisioning already gives each type its
own starting departments, positions and pay-component groups.

School-only today: pupils, admissions, classes, attendance, awards, fees and
the parent portal. They are hidden from other types **only in the menus**;
the API never reads the organisation type.

| PR | Repo | What | Effort |
|---|---|---|---|
| **6.0** | S+C | **Modules enforced on the server** (D11). Each tenant has modules (`core`, `school`; later `grants`, `rostering`…), starting from its type and switchable by the operator in the console. `@RequiresModule('school')` on every school controller; the action registry leaves out a module's actions for tenants without it, so menus, Setup, access roles and `useCan` follow with no lists kept by hand. School access roles (Educator, Registrar, Admissions, Attendance, Parent) belong to `school`. Tests: a hospital tenant gets 403 on every school route; the audit fails on a school controller without the guard. | 1 week |
| **6.1** | S+C | **Core-only readiness.** `seed:personas --org-type=CORPORATE` and the full persona sweep against it. The school's words out of shared screens (dashboard tiles, "term" in pay and leave, "School calendar" as the only calendar). A getting-started checklist per type. **Corporate and Other can be sold from here.** | 1 week |
| **6.2** | S+C | **Shared additions**, built once for every type: cost centres / projects on pay runs, expenses, budgets and the ledger (grants, wards, outlets); hourly and shift pay from imported timesheets, with overtime rules; casual and contract workers paid by the day or the job; reminders for expiring licences, certificates and contracts. | 2–3 weeks |
| **6.3** | S+C | **Type packs**, one at a time, each only with a signed pilot (D12). | 2–3 weeks each |

**6.3 packs:**

| Type | Pack | Out of scope |
|---|---|---|
| NGO / Nonprofit | Restricted funds by grant; donor budget against actual; grant reports; spending checked against the funds available | Fundraising CRM |
| Hospital | Duty rosters; on-call, night and hazard allowances; locum pay; licence tracking | Patient billing and medical records: integrate, never build |
| Hospitality | Service-charge pool shared out; daily pay for casuals; seasonal staff | Bookings, point of sale |
| Government | Salary tables by grade level and step; promotions with arrears; the government payroll's formats if a customer needs them | — |

**Order:** 6.0 → 6.1, and sell Corporate/Other. Then 6.2's cost centres and
shift pay. Then the pack for whichever non-school customer signs first.

**Each phase is done** when that type's persona sweep, the audit, drift and
the full e2e suite pass, as for Waves 1–5.

---

## 10. Sequence and effort

```
Wave 0 ──► Wave 1 ──► Wave 2 ──► Wave 4 (reorganise)
                 └──► Wave 3 ──┘      ▲
                           └──► Wave 5 (features, per hub as it lands)
                                      └──► 5.12b Paystack
Wave 6: 6.0 modules ──► 6.1 core-only ──► 6.2 shared additions ──► 6.3 packs (per customer)
```

| Wave | Effort (one developer) | Calendar with API + client in parallel |
|---|---|---|
| 0 Safety net | 3–4 days | week 1 |
| 1 Unblock | 5 days | week 2 |
| 2 Guarantee | 7 days | weeks 3–4 |
| 3 Foundations | 7 days | weeks 3–4 |
| 4 Reorganise | 15 days | weeks 5–7 |
| 5 Finish | 15–20 days | weeks 6–9 |
| 5.12b Paystack | 7–10 days | then; live once D9's account and a public API exist |
| 6.0–6.1 Modules, core-only | 10 days | alongside 5.12b |
| 6.2 Shared additions | 10–15 days | after 6.1 |
| 6.3 Each pack | 10–15 days | when a customer signs |

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
| School routes a non-school tenant can call | all of them | 0 | 6.0 e2e + audit |
| Online payments without a receipt after 15 minutes | — | 0 | 5.12b clean-up job |
| Paystack clearing balance after settlement | — | ₦0 | ledger, daily |

---

## 12. Risks

| Risk | Mitigation |
|---|---|
| The redirect map misses a link someone emailed | Redirects for every old route (§8); log 404s for a month |
| Capability refactor on 41 controllers breaks a route | S2.1 is mechanical, and the router-walking test plus existing e2e suites cover it; land it controller by controller |
| Identity-first register opens reads too wide | S1.3 authorises the GET in the service too, with e2e for "other arm → 403" |
| Two repos drift during Waves 2–4 | `actions.json` is generated, and S0.2 runs the audit on every API PR |
| Staff relearn the navigation | Old URLs redirect; ⌘K finds pages by old names too; ship C4.1 at a term boundary |
| A Paystack webhook is lost or late | The return page verifies too, and the clean-up job verifies anything PENDING after 10 minutes |
| A webhook is forged or replayed | Signature over the raw body, then Paystack's verify call; a reference is receipted once |
| Paystack changes its fees | Rate, flat fee, threshold and cap are config; the actual fee is posted from Paystack's own figure |
| Chargebacks land on Soteria's account (D9) | Dispute webhook flags the receipt and tells the school; refunds go through Approvals |
| A school route is added without its module guard | The 6.0 audit check fails CI |
| A type pack is built on guesses | D12: only with a signed pilot |

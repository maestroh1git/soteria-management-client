# Frontend for Phase 3 — plan

_The backend for Admissions is closed. The UI is not: only the student registry
has screens. This is what is missing, and the decisions worth making before
writing any of it._

Phase 3's estimate covered backend only. This was never counted, so it is not
scope creep — it is scope that was never scoped.

---

## 0. What exists, and what does not

| Area | Backend | UI |
|---|---|---|
| Payroll, employees, leave, loans, payslips, reports | ✅ | ✅ |
| Student registry — roster, detail, medical, guardians, import | ✅ | ✅ |
| **Academic structure** — sessions, terms, class levels, arms | ✅ | ❌ |
| **Admissions pipeline** — applications, decisions, offers | ✅ | ❌ |
| **Enrolment** | ✅ | ❌ |
| **Public application form** | ✅ | ❌ |

An API client and hooks for academics exist, added for the class dropdown on
the student form. There are no pages.

### The gap that blocks the others

**A school cannot use the student registry at all without the academics UI.**
Every path through it needs a class arm, and nothing can create one:

- the import validates `class` against existing arms, so every row fails;
- `/students/new` shows an empty class dropdown;
- enrolment requires a `classArmId`.

The import page says "No classes are set up yet" and then offers no way to set
one up. So the roster is not yet usable by a registrar, whatever the endpoints
can do. Academics goes first for that reason alone.

---

## 1. The decision that stops the frontend rotting: the server owns the rules

An application moves through eleven states with a rulebook
(`application-transitions.ts`) saying which moves are legal from where. The
registrar's screen has to offer exactly those.

The obvious implementation — a status dropdown listing all eleven — is wrong in
a specific way: it invites a registrar to attempt a move the server will refuse,
and turns a 409 into the normal way of discovering the rules. The next
implementation, hardcoding the legal moves in the React component, is worse: it
duplicates the rulebook, and the copy will drift the first time the real one
changes. Nobody will notice, because a stale copy shows *fewer* options and
looks like a UI quirk rather than a bug.

**So the server tells the client what is possible.** `allowedTransitions` is
exposed on the application itself, computed from the same `allowedFrom()` the
service enforces with. The UI renders its buttons from that array and knows
nothing about admissions rules.

This costs a getter. It means the rulebook has exactly one definition, and a
change to it updates every screen without anyone editing a component.

The same principle covers the rest: where a rule is non-trivial, the client asks
rather than re-implements. Enrolment's guardian candidates come from the preview
endpoint, not from a phone-matching function written again in TypeScript.

---

## 2. This is a multi-tenant product, and not every tenant is a school

`organizationType` is `SCHOOL | HOSPITAL | CORPORATE | NGO | GOVERNMENT |
NONPROFIT | HOSPITALITY | OTHER`, and `useAuth` already exposes it — the sidebar
uses it for the subtitle.

**Students and Admissions must not appear for a hospital.** Nothing about the
current nav prevents it, because until now every feature applied to every
tenant. That stops being true with this phase, and a hospital administrator
seeing "Admissions" would reasonably conclude the product was not built for
them.

Nav entries therefore gain an `orgTypes` filter alongside `roles`. School
features are gated to `SCHOOL`; everything existing is unchanged and unfiltered.

---

## 3. Information architecture

The navigation is still payroll-shaped. "People" holds Employees, Roles,
Departments, Grades and Leave — which was fine when employees were the only
people in the system. Students are people too, and a group called "People" that
excludes children is a small lie that gets more confusing as the school side
grows.

```
Overview      Dashboard
School        Students · Admissions · Classes        [SCHOOL only]
Staff         Employees · Roles · Departments · Grades · Leave
Finance       Payroll · Salary Components · Loans · Tax Rules
Reporting     Payslips · Reports
System        Settings · Audit Logs
```

**People → Staff.** More accurate for every tenant type once students exist, and
the rename is cheap now and expensive later.

---

## 4. The public form is a different kind of screen

Everything else in this app is a dashboard behind a login, used on a laptop by
somebody paid to be there. The application form is the opposite: unauthenticated,
used once, by a parent, on a phone, and it is the first thing anyone outside the
school ever sees of the product.

Consequences worth deciding in advance:

- **Its own route group**, outside `(dashboard)`. No sidebar, no auth guard, no
  tenant context.
- **Mobile-first.** Nigerian parents will fill this on a phone. The dashboard can
  stay desktop-first; this cannot.
- **One page, grouped in sections**, not a wizard. A wizard hides how much is
  left and costs taps; a single scrollable form with clear headings lets someone
  see the whole ask before starting.
- **The receipt matters.** After submitting, the parent gets an application
  number and a private link. If they lose that link there is no recovery path —
  so it is shown large, with the number, and framed as something to keep.

Route shape:

```
/apply/[slug]              the form
/application/[token]       progress, keyed by the token
```

`/application/[token]` deliberately does not carry the school slug: the parent
has a link, not an address, and the token identifies the school by itself.

---

## 5. Who each screen is for

The roles exist; the screens have to match them or the roles are decoration.

| Screen | Who |
|---|---|
| Admissions pipeline | `admissions.registrar`, `admissions.officer` (read + scores) |
| Decisions, offers, enrolment | `admissions.registrar` only |
| Classes | `tenant_owner`, `ADMIN`, `admissions.registrar` |
| Class register + medical alerts | + `academic.teacher` |
| Students | all of the above |

**`academic.teacher` currently has almost no reason to log in.** It can reach the
student roster and nothing else — no class-centric view, and no sight of the
medical alerts that were the whole argument for collecting that data. A class
detail page showing its register and its alerts is what makes that role real,
and it uses an endpoint that already exists.

---

## 6. Stages

### F1 — Academics (unblocks everything)
- `/classes` — levels and arms, with capacity and occupancy
- `/classes/[armId]` — the register: children in the class, **medical alerts
  first**, form teacher
- Sessions and terms — a settings-shaped screen, not a daily one
- Nav restructure + org-type gating

**Done when:** a registrar can create a session, a level and an arm from the UI,
and the student import stops saying there are no classes.

### F2 — Admissions pipeline
- `/admissions` — the queue, filterable by status, grouped by what needs doing
- `/admissions/[id]` — one application, with actions rendered from
  `allowedTransitions`
- Assessment scoring, offer with expiry, reject with a reason
- Enrolment: preview → guardian gate → confirm, reusing the pattern from the
  student import and the guardian dialog
- The public form's link, surfaced where the registrar will look for it

**Done when:** the cohort in `admissions-cohort.e2e-spec.ts` can be run entirely
through the UI.

### F3 — Public form
- `/apply/[slug]` — mobile-first, one page
- `/application/[token]` — progress
- Its own layout, no dashboard shell

**Done when:** a parent can apply and check back without an account, on a phone.

---

## 7. What this plan excludes

- **Parent portal** — deferred past Phase 4 in the roadmap. Guardian accounts
  exist in outline (`principal_type`); a portal is not this.
- **Timetables, attendance, report cards** — the Academic module, later.
- **Fees** — Phase 4. Nothing here shows money.
- **Document upload on the form** — the backend has no storage for it, and §6
  of the backend plan deliberately deferred building any.
- **Assessment scheduling as logistics** — a date and a score go through the
  pipeline; invitations and timetables do not exist and are not faked here.

---

## 8. Risks

| Risk | Mitigation |
|---|---|
| The transition rulebook drifts into the client | Server exposes `allowedTransitions`; the UI has no rules of its own (§1) |
| A hospital tenant sees school features | `orgTypes` on nav entries (§2) |
| The public form is unusable on a phone | Mobile-first, tested at narrow widths; it is the only screen where this is the primary case |
| A parent loses the link and cannot recover it | The receipt is deliberate and prominent; recovery by email is Phase 4 work when there is a mail path worth trusting |
| Enrolment's guardian gate becomes a 409 the UI just shows | Preview first, candidates rendered, choice required — the pattern already used twice (§6, F2) |

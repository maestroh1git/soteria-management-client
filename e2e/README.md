# Persona smoke tests

Every kind of person signs in, opens every page in their own sidebar, and
nothing refuses them: no 401, 403 or 5xx from the API, no uncaught page error
(React #418 included), no bounce to `?unauthorized=true`. A second group walks
the specific paths Wave 1 of `ROADMAP-EXECUTION.md` repaired.

They need the API and a seeded school, so they run locally rather than in CI.

## One-time setup

In the API repo (`soteria-management`), with a local Postgres:

```bash
npm run build && npm run start:prod        # or: npm run start:dev
# register a school once, e.g. POST /api/auth/register with organizationType SCHOOL
npm run seed                               # base data (countries, permissions)
npm run seed:greenfield                    # a term's worth of school
npm run seed:personas -- --out=/tmp/personas.json
```

`seed:personas` gives one login per role, plus the traps (a form teacher who
holds only EMPLOYEE, an Educator who is also a form teacher, a plain Admin, a
parent with several children). All share one password, printed at the end.

## Each run

In this repo:

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000/api npm run build
npm start -- -p 3001
PERSONAS_FILE=/tmp/personas.json npm run test:personas
```

Test against a production build: the hydration errors this suite catches only
appear there. `CLIENT_URL` and `API_URL` override the defaults
(`http://localhost:3001`, `http://localhost:3000/api`).

Sign-ins go through the API in global setup, paced for its throttle (five
auth requests a minute), so the first minute or two is waiting. The login
form itself is exercised once.

## When it fails

Each failure names the page and the refused request, e.g.

```
/payroll: 403 GET /pay-periods
```

That is a screen offering someone data or an action the API will not give
them. Fix it in one of three places: the route manifest
(`src/lib/auth/route-manifest.ts`) if the page reads the wrong action, `can()`
(`src/lib/hooks/use-can.ts`) if the page should hide the action, or the API's
action registry (`src/common/access/actions.ts`, then `npm run sync:actions`
here) if they should be allowed.

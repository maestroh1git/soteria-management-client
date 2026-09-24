import { ACTIONS, type Action } from './actions';
import { ROUTE_MANIFEST, type RouteNeed } from './route-manifest';

/**
 * Which roles may reach which route. Read by the middleware and the sidebar.
 *
 * Generated, not written: each route names the action that reads its data
 * (route-manifest.ts), and its roles are the ones the API's registry gives
 * that action (actions.generated.json, `npm run sync:actions`). Until Wave 2
 * this map was a hand-written copy of the API's role lists — the copy that
 * drifted into 15 unguarded routes and 23 screens offering refused actions.
 *
 * Every entry admits the people the API lets read the page's data — no more,
 * no fewer — and the pages hide the actions a reader may not take through
 * `can()` (lib/hooks/use-can).
 *
 * `undefined` means every authenticated user. A route that is absent is not
 * guarded here — see ROUTE_ROLES_EXEMPT below for the ones where that is a
 * decision rather than an oversight.
 */
function rolesFor(need: RouteNeed): string[] | undefined {
  if (need === 'signedIn') return undefined;
  if (need === 'guardians') return ['PARENT'];
  const actions: readonly Action[] = typeof need === 'string' ? [need] : need;
  return [...new Set(actions.flatMap((a) => ACTIONS[a]))];
}

export const ROUTE_ROLES: Record<string, string[] | undefined> =
  Object.fromEntries(
    Object.entries(ROUTE_MANIFEST).map(([route, need]) => [
      route,
      rolesFor(need),
    ]),
  );

/**
 * Routes with no entry above, on purpose.
 *
 * `/me/*` resolves its subject from the token — self-service, the parent portal
 * and a form teacher's own classes all answer "your own things" and return
 * nothing to anyone else. A role gate there adds no protection and has already
 * done harm once: gating `/me/classes` on `academic.teacher` hid a teacher's own
 * class from them, because being an Educator is a job role on the employee
 * record and does not grant that system role.
 */
export const ROUTE_ROLES_EXEMPT = ["/me"];

/**
 * The entry guarding a path: exact match first, then the LONGEST matching
 * prefix.
 *
 * Longest wins because first-match order handed a nested route the roles of its
 * parent — with both '/attendance' and '/attendance/gate' in the map, a route
 * under the gate would have inherited the wider register roles.
 */
export function routeRolesFor(pathname: string): {
  roles: string[] | undefined;
  key: string | null;
} {
  if (pathname in ROUTE_ROLES) {
    return { roles: ROUTE_ROLES[pathname], key: pathname };
  }
  let best: string | null = null;
  for (const route of Object.keys(ROUTE_ROLES)) {
    if (route === "/" || !pathname.startsWith(route + "/")) continue;
    if (!best || route.length > best.length) best = route;
  }
  return { roles: best ? ROUTE_ROLES[best] : undefined, key: best };
}

import registry from './actions.generated.json';

/**
 * Who may do what — the API's action registry, as the client knows it.
 *
 * Generated, never edited: `npm run sync:actions` copies the API's
 * src/common/access/actions.ts into actions.generated.json. Wave 1 kept a
 * hand-written copy here, which is how screens and endpoints drift apart
 * (system map, A3), and the audit now fails when the copy is stale.
 *
 * Screens do not read this directly. They ask `can('payroll.approve')`
 * (lib/hooks/use-can), which answers from the signed-in person's own
 * capabilities as the API reports them (GET /auth/session) — current even when
 * their access changed after they signed in. This map is the fallback until the
 * session loads, and what the edge middleware and the route map use.
 *
 * Plain module, no React: the middleware reads it.
 */

export type Action = keyof typeof registry;

export const ACTIONS: Record<Action, readonly string[]> = registry;

/** Whether a set of system roles may perform an action. */
export function rolesCan(roles: readonly string[], action: Action): boolean {
    const allowed = ACTIONS[action];
    return !!allowed && roles.some((r) => allowed.includes(r));
}

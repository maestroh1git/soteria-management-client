'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};

/**
 * False while this component is hydrating, true from the render after.
 *
 * The auth store is replayed from localStorage in an effect (see
 * `StoreHydration`), which is late enough for the root layout but not for a
 * page: pages sit inside `loading.tsx` Suspense boundaries that hydrate AFTER
 * the layout's effects have run. By then the store already holds the user, so
 * a page's first client render showed the buttons its role allows while the
 * server's HTML, rendered signed-out, did not — React error #418 on nearly
 * every screen, caught by the persona smoke tests.
 *
 * `useSyncExternalStore` reads the server snapshot (false) during hydration and
 * the client snapshot (true) straight after, so anything gated on it renders
 * exactly what the server did first, then catches up.
 */
export function useHydrated(): boolean {
    return useSyncExternalStore(
        subscribe,
        () => true,
        () => false,
    );
}

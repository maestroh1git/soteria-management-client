'use client';

import { useCallback, useSyncExternalStore } from 'react';

/**
 * Whether a CSS media query matches, kept live as the window resizes or a
 * tablet turns.
 *
 * `serverValue` is what the server rendered and what hydration reads; the real
 * answer follows on the next render. Pick the one most screens will have so
 * the correction is rarely visible.
 */
export function useMediaQuery(query: string, serverValue = true): boolean {
    const subscribe = useCallback(
        (onChange: () => void) => {
            const mql = window.matchMedia(query);
            mql.addEventListener('change', onChange);
            return () => mql.removeEventListener('change', onChange);
        },
        [query],
    );
    return useSyncExternalStore(
        subscribe,
        () => window.matchMedia(query).matches,
        () => serverValue,
    );
}

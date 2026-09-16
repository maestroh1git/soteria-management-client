'use client';

import { useEffect } from 'react';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';

/**
 * Replays the persisted stores out of localStorage, once.
 *
 * Both stores are created with `skipHydration` so the client's first render is
 * the signed-out, uncollapsed shell the server rendered — see the note in
 * `auth-store.ts`. Nothing reads storage until this effect runs, which is after
 * React has finished matching the server HTML, so the mismatch cannot happen.
 *
 * The cost is a single extra render: the shell paints signed-out for one frame
 * and then fills in. That is strictly less flicker than today, where React
 * discards the server tree and rebuilds the entire page from scratch.
 *
 * Deliberately NOT read by the API client — that reads the `auth-token` key
 * directly, so requests are authenticated whether or not this has run yet.
 */
export function StoreHydration() {
    useEffect(() => {
        useAuthStore.persist.rehydrate();
        useUIStore.persist.rehydrate();
    }, []);

    return null;
}

'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

/**
 * Which tab is showing, kept in the URL as `?tab=` (ROADMAP-EXECUTION.md, C3.5).
 *
 * A tab held in state is lost on refresh, cannot be linked to and is skipped by
 * the back button; the onboarding checklist and the completeness panel both
 * need to send people to a tab, not a page. Classes did this by hand; this is
 * that, for every tabbed screen.
 *
 * An unknown or missing value reads as the first tab. Other query parameters
 * are kept; the history entry is replaced, not pushed, so back leaves the page
 * rather than stepping through tabs.
 */
export function useTabParam<T extends string>(
    tabs: readonly T[],
    param = 'tab',
): [T, (next: string) => void] {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const raw = searchParams.get(param);
    const current = (tabs as readonly string[]).includes(raw ?? '')
        ? (raw as T)
        : tabs[0];

    const setTab = useCallback(
        (next: string) => {
            const params = new URLSearchParams(searchParams.toString());
            if (next === tabs[0]) params.delete(param);
            else params.set(param, next);
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
        },
        [router, pathname, searchParams, tabs, param],
    );

    return [current, setTab];
}

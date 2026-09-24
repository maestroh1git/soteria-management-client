'use client';

import { useAuth } from '@/lib/hooks/use-auth';
import { SETUP_SECTIONS, type SetupSection } from './sections';

/**
 * The Setup sections this person may open, for this kind of organisation. The
 * hub and ⌘K both read it, so a page you can jump to is a page you can see.
 */
export function useSetupSections(): SetupSection[] {
    const { mayReach, tenantOrgType } = useAuth();
    return SETUP_SECTIONS.map((s) => ({
        ...s,
        links: s.links.filter(
            (l) =>
                mayReach(l.href.split('?')[0]) &&
                (!l.orgTypes || (tenantOrgType !== null && l.orgTypes.includes(tenantOrgType))),
        ),
    })).filter((s) => s.links.length > 0);
}

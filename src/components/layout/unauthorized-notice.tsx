'use client';

import { useEffect } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

/**
 * Says why you are here when the middleware turned you away.
 *
 * A page your role does not cover redirects to the dashboard with
 * `?unauthorized=true`. Nothing read that parameter, so a person who followed a
 * link landed on the dashboard with no idea what had happened. Now they are
 * told, once, and the parameter is cleared so a refresh does not repeat it.
 */
export function UnauthorizedNotice() {
    const params = useSearchParams();
    const pathname = usePathname();
    const router = useRouter();
    const denied = params.get('unauthorized') === 'true';

    useEffect(() => {
        if (!denied) return;
        toast.info('That page isn’t available with your access', {
            description:
                'You’ve been brought to your dashboard. If you need it, ask an administrator.',
        });
        const rest = new URLSearchParams(params);
        rest.delete('unauthorized');
        const qs = rest.toString();
        router.replace(qs ? `${pathname}?${qs}` : pathname);
    }, [denied, params, pathname, router]);

    return null;
}

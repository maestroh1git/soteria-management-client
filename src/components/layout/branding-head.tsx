'use client';

import { useEffect } from 'react';
import { useBranding } from '@/lib/hooks/use-branding';
import { brandingImageUrl } from '@/lib/api/branding';

/**
 * Applies the tenant's brand to the document: swaps the favicon for the
 * uploaded one and exposes the primary colour as `--brand-primary` for any
 * accent that wants it. Renders nothing.
 */
export function BrandingHead() {
    const { data: branding } = useBranding();
    const faviconUrl = brandingImageUrl(branding?.faviconUrl);
    const primary = branding?.primaryColor ?? null;

    useEffect(() => {
        if (!faviconUrl) return;
        // Reuse an existing icon link if there is one, else create it. Keep a
        // reference so we can restore on unmount (e.g. logging out).
        const links = Array.from(
            document.querySelectorAll<HTMLLinkElement>("link[rel~='icon']"),
        );
        const previous = links.map((l) => ({ el: l, href: l.href }));
        let link = links[0];
        if (!link) {
            link = document.createElement('link');
            link.rel = 'icon';
            document.head.appendChild(link);
        }
        link.href = faviconUrl;
        return () => {
            for (const { el, href } of previous) el.href = href;
        };
    }, [faviconUrl]);

    useEffect(() => {
        const root = document.documentElement;
        if (primary) root.style.setProperty('--brand-primary', primary);
        else root.style.removeProperty('--brand-primary');
        return () => {
            root.style.removeProperty('--brand-primary');
        };
    }, [primary]);

    return null;
}

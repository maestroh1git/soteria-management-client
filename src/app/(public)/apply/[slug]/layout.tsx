import type { Metadata } from 'next';
import type { ReactNode } from 'react';

const API =
    process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * This link gets forwarded round WhatsApp, so what unfurls there matters more
 * than any search ranking: a parent should see the school's name, not the name
 * of the payroll product it happens to run on.
 */
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;

    let school: string | null = null;
    try {
        const res = await fetch(`${API}/public/schools/${slug}`, {
            next: { revalidate: 300 },
        });
        if (res.ok) {
            const body = await res.json();
            school = body?.name ?? body?.data?.name ?? null;
        }
    } catch {
        // A metadata lookup must never take the page down with it.
    }

    const title = school ? `Apply to ${school}` : 'Apply for admission';
    const description = school
        ? `Submit an application for admission to ${school}. No account needed.`
        : 'Submit an application for admission. No account needed.';

    return {
        title,
        description,
        openGraph: { title, description, type: 'website' },
        twitter: { card: 'summary', title, description },
    };
}

export default function ApplyLayout({ children }: { children: ReactNode }) {
    return <>{children}</>;
}

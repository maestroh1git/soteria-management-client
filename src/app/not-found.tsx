import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const metadata = { title: 'Page not found' };

/**
 * A mistyped admissions link is the likeliest way someone lands here — a parent
 * with a broken WhatsApp forward, not a staff member. So this says what to do
 * next in plain words rather than showing a framework default.
 */
export default function NotFound() {
    return (
        <main className="flex min-h-screen items-center justify-center bg-muted/30 px-4">
            <div className="w-full max-w-md space-y-4 rounded-lg border bg-background p-8 text-center">
                <p className="text-sm font-medium text-muted-foreground">404</p>
                <h1 className="text-2xl font-semibold">We couldn&apos;t find that page</h1>
                <p className="text-sm text-muted-foreground">
                    The link may be mistyped or out of date. If a school sent you an
                    admissions or invoice link, ask them to send it again — those links
                    are one per family and can expire.
                </p>
                <div className="flex justify-center gap-2 pt-2">
                    <Link href="/">
                        <Button>Go to the dashboard</Button>
                    </Link>
                    <Link href="/login">
                        <Button variant="outline">Sign in</Button>
                    </Link>
                </div>
            </div>
        </main>
    );
}

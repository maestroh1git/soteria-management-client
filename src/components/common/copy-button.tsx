'use client';

import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * Copies `text` and says so: the label turns to "Copied" for a moment, and a
 * screen reader hears it. A copy button that gives no sign it worked gets
 * pressed three times and still isn't trusted.
 */
export function CopyButton({
    text,
    label = 'Copy',
    size = 'sm',
    variant = 'outline',
    className,
}: {
    text: string;
    label?: string;
    size?: 'sm' | 'default';
    variant?: 'outline' | 'default' | 'ghost';
    className?: string;
}) {
    const [state, setState] = useState<'idle' | 'copied' | 'failed'>('idle');
    useEffect(() => {
        if (state === 'idle') return;
        const t = setTimeout(() => setState('idle'), 2000);
        return () => clearTimeout(t);
    }, [state]);

    return (
        <Button
            type="button"
            size={size}
            variant={variant}
            className={className}
            onClick={async () => {
                try {
                    await navigator.clipboard.writeText(text);
                    setState('copied');
                } catch {
                    setState('failed');
                }
            }}
        >
            {state === 'copied' ? (
                <Check className="mr-2 h-4 w-4 text-emerald-600" />
            ) : (
                <Copy className="mr-2 h-4 w-4" />
            )}
            <span aria-live="polite">
                {state === 'copied' ? 'Copied' : state === 'failed' ? 'Select and copy it' : label}
            </span>
        </Button>
    );
}

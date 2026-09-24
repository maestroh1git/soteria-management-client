'use client';

import { useMutation, useQueryClient, type QueryKey } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/api-error';

/**
 * A change to a list of records, said the same way everywhere (docs/COPY.md):
 * refresh what it changed, one past-tense toast ("Department added"), and a
 * refusal either on the form (`inForm`, shown by FormDialog) or in a toast.
 */
export function useResourceMutation<V, R = unknown>(
    fn: (v: V) => Promise<R>,
    {
        invalidate,
        success,
        inForm = false,
    }: {
        invalidate: QueryKey[];
        success: string | ((v: V) => string);
        inForm?: boolean;
    },
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: fn,
        onSuccess: (_, v) => {
            invalidate.forEach((queryKey) => qc.invalidateQueries({ queryKey }));
            toast.success(typeof success === 'function' ? success(v) : success);
        },
        onError: inForm
            ? undefined
            : (err) =>
                  toast.error(getApiErrorMessage(err, 'That could not be done. Please try again.')),
    });
}

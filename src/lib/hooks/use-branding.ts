import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getBranding,
    updateBrandingColors,
    uploadLogo,
    uploadFavicon,
    removeLogo,
} from '../api/branding';

/** The current tenant's branding — colours + image URLs. Cached; every viewer
 *  reads it (the sidebar and favicon use it), so it changes rarely. */
export function useBranding() {
    return useQuery({
        queryKey: ['branding'],
        queryFn: getBranding,
        staleTime: 10 * 60 * 1000,
    });
}

function useInvalidateBranding() {
    const qc = useQueryClient();
    return () => qc.invalidateQueries({ queryKey: ['branding'] });
}

export function useUpdateBrandingColors() {
    const invalidate = useInvalidateBranding();
    return useMutation({
        mutationFn: updateBrandingColors,
        onSuccess: () => {
            invalidate();
            toast.success('Brand colours saved');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not save colours'),
    });
}

export function useUploadLogo() {
    const invalidate = useInvalidateBranding();
    return useMutation({
        mutationFn: uploadLogo,
        onSuccess: () => {
            invalidate();
            toast.success('Logo updated');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not upload logo'),
    });
}

export function useUploadFavicon() {
    const invalidate = useInvalidateBranding();
    return useMutation({
        mutationFn: uploadFavicon,
        onSuccess: () => {
            invalidate();
            toast.success('Favicon updated');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not upload favicon'),
    });
}

export function useRemoveLogo() {
    const invalidate = useInvalidateBranding();
    return useMutation({
        mutationFn: removeLogo,
        onSuccess: () => {
            invalidate();
            toast.success('Logo removed');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not remove logo'),
    });
}

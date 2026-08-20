import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getApplications,
    getApplication,
    transitionApplication,
    getEnrolmentPreview,
    enrolApplication,
    expireLapsedOffers,
    type ApplicationStatus,
} from '../api/admissions';

export function useApplications(
    filters?: { status?: string },
    enabled = true,
) {
    return useQuery({
        queryKey: ['admissions', 'applications', filters],
        queryFn: () => getApplications(filters),
        enabled,
    });
}

export function useApplication(id: string) {
    return useQuery({
        queryKey: ['admissions', 'applications', id],
        queryFn: () => getApplication(id),
        enabled: !!id,
    });
}

export function useTransitionApplication(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: {
            status: ApplicationStatus;
            notes?: string;
            offerExpiresAt?: string;
            assessmentDate?: string;
            assessmentScore?: number;
        }) => transitionApplication(id, dto),
        onSuccess: (application) => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success(`Moved to ${application.status.replace(/_/g, ' ')}`);
        },
        // The server refuses an illegal move by naming what WAS possible. Worth
        // surfacing verbatim rather than replacing with something vaguer.
        onError: (e: Error) => toast.error(e.message || 'Could not update'),
    });
}

export function useEnrolmentPreview(id: string, classArmId?: string) {
    return useQuery({
        queryKey: ['admissions', 'applications', id, 'enrolment', classArmId],
        queryFn: () => getEnrolmentPreview(id, classArmId),
        enabled: !!id,
    });
}

export function useEnrol(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: {
            classArmId: string;
            guardianId?: string;
            allowOverCapacity?: boolean;
            admissionDate?: string;
        }) => enrolApplication(id, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            qc.invalidateQueries({ queryKey: ['students'] });
        },
        onError: (e: Error) => toast.error(e.message || 'Could not enrol'),
    });
}

export function useExpireOffers() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: expireLapsedOffers,
        onSuccess: (expired) => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success(
                expired.length
                    ? `${expired.length} lapsed offer(s) expired — those places are free again`
                    : 'No offers have lapsed',
            );
        },
        onError: (e: Error) => toast.error(e.message || 'Could not expire offers'),
    });
}

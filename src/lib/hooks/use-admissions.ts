import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getApplications,
    getApplication,
    transitionApplication,
    getEnrolmentPreview,
    enrolApplication,
    expireLapsedOffers,
    getAssessments,
    scheduleAssessment,
    rescheduleAssessment,
    completeAssessment,
    settleAssessment,
    type ApplicationStatus,
    type AssessmentOutcome,
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

// ── Assessments ──────────────────────────────────────────────────────────────

export function useAssessments(applicationId: string) {
    return useQuery({
        queryKey: ['admissions', 'applications', applicationId, 'assessments'],
        queryFn: () => getAssessments(applicationId),
        enabled: !!applicationId,
    });
}

/**
 * One mutation for every change to a sitting.
 *
 * They all invalidate the same two things — the sittings and the application,
 * because booking the first one moves the pipeline — and they all surface the
 * server's refusal verbatim. It names what WAS possible, which is more use
 * than anything this layer could invent.
 */
function useAssessmentMutation<TArgs>(
    applicationId: string,
    run: (args: TArgs) => Promise<unknown>,
    success: string,
) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: run,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success(success);
        },
        onError: (e: Error) => toast.error(e.message || 'Could not update'),
    });
}

export function useScheduleAssessment(applicationId: string) {
    return useAssessmentMutation(
        applicationId,
        (dto: Parameters<typeof scheduleAssessment>[1]) =>
            scheduleAssessment(applicationId, dto),
        'Booked',
    );
}

export function useRescheduleAssessment(applicationId: string) {
    return useAssessmentMutation(
        applicationId,
        ({ id, ...dto }: { id: string; scheduledFor: string; location?: string }) =>
            rescheduleAssessment(id, dto),
        'Moved',
    );
}

export function useCompleteAssessment(applicationId: string) {
    return useAssessmentMutation(
        applicationId,
        ({
            id,
            ...dto
        }: {
            id: string;
            score?: number;
            outcome?: AssessmentOutcome;
            notes?: string;
        }) => completeAssessment(id, dto),
        'Recorded',
    );
}

export function useSettleAssessment(applicationId: string) {
    return useAssessmentMutation(
        applicationId,
        ({
            id,
            what,
            notes,
        }: {
            id: string;
            what: 'no-show' | 'cancel';
            notes?: string;
        }) => settleAssessment(id, what, notes),
        'Updated',
    );
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getApplications,
    getApplication,
    transitionApplication,
    getEnrolmentPreview,
    enrolApplication,
    expireLapsedOffers,
    remindExpiringOffers,
    getAssessments,
    scheduleAssessment,
    rescheduleAssessment,
    completeAssessment,
    settleAssessment,
    getFlags,
    raiseFlag,
    clearFlag,
    getCriteriaVerdict,
    getInterviewTemplates,
    createInterviewTemplate,
    retireInterviewTemplate,
    getAssessmentAnswers,
    type AnswerInput,
    type ApplicationStatus,
    type AssessmentOutcome,
    type FlagKind,
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

export function useRemindOffers() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: remindExpiringOffers,
        onSuccess: (warned) => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success(
                warned.length
                    ? `${warned.length} family/families reminded their offer is about to lapse`
                    : 'Nobody is due a reminder — everyone near a deadline has had one',
            );
        },
        onError: (e: Error) =>
            toast.error(e.message || 'Could not send the reminders'),
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
            answers?: AnswerInput[];
        }) => completeAssessment(id, dto),
        'Recorded',
    );
}

/**
 * The question sets this school has published.
 *
 * Read as a list rather than one by id: a sitting is answered against the
 * template it was BOOKED against, which may since have been retired, and the
 * list carries those too.
 */
export function useInterviewTemplates(enabled = true) {
    return useQuery({
        queryKey: ['admissions', 'interview-templates'],
        queryFn: getInterviewTemplates,
        enabled,
    });
}

/**
 * Publishing a set, and standing one down.
 *
 * Both invalidate every admissions query rather than just the template list:
 * which questions are in force decides what the record-interview dialog asks,
 * so a stale list there would put questions to a panel that the school has
 * stopped asking.
 */
export function useCreateInterviewTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createInterviewTemplate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success('Published. This is now the set in force.');
        },
        onError: (e: Error) =>
            toast.error(e.message || 'Could not publish that set'),
    });
}

export function useRetireInterviewTemplate() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: retireInterviewTemplate,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success('Retired. Interviews already run against it are kept.');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not retire it'),
    });
}

export function useAssessmentAnswers(assessmentId: string | null) {
    return useQuery({
        queryKey: ['admissions', 'assessments', assessmentId, 'answers'],
        queryFn: () => getAssessmentAnswers(assessmentId!),
        enabled: !!assessmentId,
    });
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

// ── Vetting and criteria ─────────────────────────────────────────────────────

export function useFlags(applicationId: string) {
    return useQuery({
        queryKey: ['admissions', 'applications', applicationId, 'flags'],
        queryFn: () => getFlags(applicationId),
        enabled: !!applicationId,
    });
}

export function useRaiseFlag(applicationId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: { kind: FlagKind; detail?: string }) =>
            raiseFlag(applicationId, dto),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success('Raised');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not raise it'),
    });
}

export function useClearFlag(applicationId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: string) => clearFlag(id),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['admissions'] });
            toast.success('Cleared');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not clear it'),
    });
}

export function useCriteriaVerdict(applicationId: string) {
    return useQuery({
        queryKey: ['admissions', 'applications', applicationId, 'criteria'],
        queryFn: () => getCriteriaVerdict(applicationId),
        enabled: !!applicationId,
    });
}

import api from './client';

export type ApplicationStatus =
    | 'APPLIED'
    | 'ASSESSMENT_SCHEDULED'
    | 'ASSESSED'
    | 'OFFERED'
    | 'ACCEPTED'
    | 'ENROLLED'
    | 'REJECTED'
    | 'WAITLISTED'
    | 'OFFER_DECLINED'
    | 'OFFER_EXPIRED'
    | 'WITHDRAWN';

export interface AdmissionApplication {
    id: string;
    applicationNumber: string;
    status: ApplicationStatus;
    /**
     * What the server says may happen next, computed from the same rulebook it
     * enforces with. The UI renders its actions from this and knows no
     * admissions rules of its own.
     */
    allowedTransitions: ApplicationStatus[];
    firstName: string;
    middleName: string | null;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    previousSchool: string | null;
    guardianFirstName: string;
    guardianLastName: string;
    guardianPhone: string;
    guardianEmail: string | null;
    guardianRelationship: string;
    offerExpiresAt: string | null;
    decisionNotes: string | null;
    retentionExpiresAt: string | null;
    studentId: string | null;
    createdAt: string;
    classLevel?: { id: string; name: string };
    session?: { id: string; name: string };
}

export interface EnrolmentPreview {
    childName: string;
    guardianName: string;
    guardianPhone: string;
    possibleGuardians: Array<{
        id: string;
        name: string;
        phone: string;
        children: number;
    }>;
    capacity: number | null;
    enrolled: number;
}

export async function getApplications(filters?: {
    status?: string;
}): Promise<AdmissionApplication[]> {
    const qs =
        filters?.status && filters.status !== 'all'
            ? `?status=${filters.status}`
            : '';
    return (await api.get(
        `/admissions/applications${qs}`,
    )) as unknown as AdmissionApplication[];
}

export async function getApplication(
    id: string,
): Promise<AdmissionApplication> {
    return (await api.get(
        `/admissions/applications/${id}`,
    )) as unknown as AdmissionApplication;
}

export async function transitionApplication(
    id: string,
    dto: {
        status: ApplicationStatus;
        notes?: string;
        offerExpiresAt?: string;
    },
): Promise<AdmissionApplication> {
    return (await api.patch(
        `/admissions/applications/${id}/status`,
        dto,
    )) as unknown as AdmissionApplication;
}

export async function getEnrolmentPreview(
    id: string,
    classArmId?: string,
): Promise<EnrolmentPreview> {
    const qs = classArmId ? `?classArmId=${classArmId}` : '';
    return (await api.get(
        `/admissions/applications/${id}/enrolment-preview${qs}`,
    )) as unknown as EnrolmentPreview;
}

export async function enrolApplication(
    id: string,
    dto: {
        classArmId: string;
        guardianId?: string;
        allowOverCapacity?: boolean;
        admissionDate?: string;
    },
): Promise<{ studentId: string; admissionNumber: string }> {
    return (await api.post(
        `/admissions/applications/${id}/enrol`,
        dto,
    )) as unknown as { studentId: string; admissionNumber: string };
}

export async function expireLapsedOffers(): Promise<AdmissionApplication[]> {
    return (await api.post(
        '/admissions/applications/offers/expire',
        {},
    )) as unknown as AdmissionApplication[];
}

// ── Assessments ──────────────────────────────────────────────────────────────

export type AssessmentKind = 'ENTRANCE_EXAM' | 'INTERVIEW';
export type AssessmentMode = 'IN_PERSON' | 'ONLINE';
export type AssessmentStatus =
    | 'SCHEDULED'
    | 'COMPLETED'
    | 'NO_SHOW'
    | 'CANCELLED';
export type AssessmentOutcome = 'RECOMMEND' | 'BORDERLINE' | 'DECLINE';

export interface AdmissionAssessment {
    id: string;
    applicationId: string;
    kind: AssessmentKind;
    mode: AssessmentMode;
    status: AssessmentStatus;
    scheduledFor: string;
    location: string | null;
    assessorId: string | null;
    /** Numeric in the database, and therefore a string here. Never parsed. */
    score: string | null;
    outcome: AssessmentOutcome | null;
    notes: string | null;
    completedAt: string | null;
    isOpen: boolean;
    /**
     * From the same rulebook the server refuses with. The screen renders its
     * actions from this and knows no rules of its own.
     */
    allowedTransitions: AssessmentStatus[];
}

export async function getAssessments(
    applicationId: string,
): Promise<AdmissionAssessment[]> {
    return (
        await api.get(`/admissions/applications/${applicationId}/assessments`)
    ).data;
}

export async function scheduleAssessment(
    applicationId: string,
    dto: {
        kind: AssessmentKind;
        mode?: AssessmentMode;
        scheduledFor: string;
        location?: string;
    },
): Promise<AdmissionAssessment> {
    return (
        await api.post(
            `/admissions/applications/${applicationId}/assessments`,
            dto,
        )
    ).data;
}

export async function rescheduleAssessment(
    id: string,
    dto: { scheduledFor: string; location?: string },
): Promise<AdmissionAssessment> {
    return (await api.patch(`/admissions/assessments/${id}/reschedule`, dto))
        .data;
}

export async function completeAssessment(
    id: string,
    dto: { score?: number; outcome?: AssessmentOutcome; notes?: string },
): Promise<AdmissionAssessment> {
    return (await api.patch(`/admissions/assessments/${id}/complete`, dto))
        .data;
}

export async function settleAssessment(
    id: string,
    what: 'no-show' | 'cancel',
    notes?: string,
): Promise<AdmissionAssessment> {
    return (await api.patch(`/admissions/assessments/${id}/${what}`, { notes }))
        .data;
}

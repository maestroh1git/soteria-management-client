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

/**
 * Warn families whose offers are about to lapse.
 *
 * Runs nightly too. Safe to press: a family already warned about this offer
 * is not warned again.
 */
export async function remindExpiringOffers(): Promise<AdmissionApplication[]> {
    return (await api.post(
        '/admissions/applications/offers/remind',
        {},
    )) as unknown as AdmissionApplication[];
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
    /**
     * The question set this interview was booked against, fixed at booking so
     * a template edited afterwards cannot change what the sitting covered.
     * Null on an exam, and on an interview booked when nothing was active.
     */
    templateId: string | null;
    /**
     * That set, by name. Null on an exam, and on an interview booked while
     * nothing was in force.
     */
    templateName: string | null;
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
    return (await api.get(
        `/admissions/applications/${applicationId}/assessments`,
    )) as unknown as AdmissionAssessment[];
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
    return (await api.post(
        `/admissions/applications/${applicationId}/assessments`,
        dto,
    )) as unknown as AdmissionAssessment;
}

export async function rescheduleAssessment(
    id: string,
    dto: { scheduledFor: string; location?: string },
): Promise<AdmissionAssessment> {
    return (await api.patch(
        `/admissions/assessments/${id}/reschedule`,
        dto,
    )) as unknown as AdmissionAssessment;
}

export async function completeAssessment(
    id: string,
    dto: {
        score?: number;
        outcome?: AssessmentOutcome;
        notes?: string;
        answers?: AnswerInput[];
    },
): Promise<AdmissionAssessment> {
    return (await api.patch(
        `/admissions/assessments/${id}/complete`,
        dto,
    )) as unknown as AdmissionAssessment;
}

export async function settleAssessment(
    id: string,
    what: 'no-show' | 'cancel',
    notes?: string,
): Promise<AdmissionAssessment> {
    return (await api.patch(`/admissions/assessments/${id}/${what}`, {
        notes,
    })) as unknown as AdmissionAssessment;
}

// ── The questions a panel asks ───────────────────────────────────────────────

export type QuestionKind = 'TEXT' | 'RATING_1_5' | 'YES_NO';

export interface InterviewQuestion {
    id: string;
    templateId: string;
    prompt: string;
    kind: QuestionKind;
    sortOrder: number;
    required: boolean;
}

export interface InterviewTemplate {
    id: string;
    name: string;
    active: boolean;
    createdAt: string;
    questions?: InterviewQuestion[];
    /** Sittings that have happened. What a set is kept for. */
    interviewsRun: number;
    /**
     * Sittings still to come. Retiring a set does not cancel these and does
     * not change what they ask, so these are the families who will still be
     * asked questions the school has just stopped asking.
     */
    interviewsBooked: number;
}

/** What was said at one sitting, in the words it was asked in. */
export interface InterviewResponse {
    id: string;
    assessmentId: string;
    questionId: string | null;
    /**
     * The prompt as it stood when the question was put. The template may have
     * been reworded or retired since; the answer still reads as it was given.
     */
    promptSnapshot: string;
    answerText: string | null;
    rating: number | null;
}

export interface AnswerInput {
    questionId: string;
    answerText?: string;
    rating?: number;
}

/** One candidate interviewed on a set, and enough to open their application. */
export interface TemplateInterview {
    assessmentId: string;
    status: AssessmentStatus;
    outcome: AssessmentOutcome | null;
    scheduledFor: string;
    applicationId: string;
    applicationNumber: string;
    candidate: string;
    applicationStatus: ApplicationStatus;
    classLevel: string | null;
}

/** Which candidates were interviewed on one set — the count, made of people. */
export async function getTemplateInterviews(
    templateId: string,
): Promise<TemplateInterview[]> {
    return (await api.get(
        `/admissions/interview-templates/${templateId}/interviews`,
    )) as unknown as TemplateInterview[];
}

/** Every question set, the active one first. */
export async function getInterviewTemplates(): Promise<InterviewTemplate[]> {
    return (await api.get(
        '/admissions/interview-templates',
    )) as unknown as InterviewTemplate[];
}

export async function createInterviewTemplate(dto: {
    name: string;
    questions: Array<{
        prompt: string;
        kind?: QuestionKind;
        required?: boolean;
    }>;
}): Promise<InterviewTemplate> {
    return (await api.post(
        '/admissions/interview-templates',
        dto,
    )) as unknown as InterviewTemplate;
}

/** Stops the school asking these. Interviews already run against it are kept. */
export async function retireInterviewTemplate(
    id: string,
): Promise<InterviewTemplate> {
    return (await api.patch(
        `/admissions/interview-templates/${id}/retire`,
        {},
    )) as unknown as InterviewTemplate;
}

export async function getAssessmentAnswers(
    assessmentId: string,
): Promise<InterviewResponse[]> {
    return (await api.get(
        `/admissions/assessments/${assessmentId}/answers`,
    )) as unknown as InterviewResponse[];
}

// ── Vetting and criteria ─────────────────────────────────────────────────────

export type FlagKind =
    | 'SPECIAL_NEEDS'
    | 'TALENT'
    | 'SIBLING'
    | 'STAFF_CHILD';

export interface AdmissionFlag {
    id: string;
    applicationId: string;
    kind: FlagKind;
    detail: string | null;
    raisedBy: string | null;
    createdAt: string;
}

export interface CriteriaCheck {
    code: 'AGE' | 'EXAM_SCORE' | 'INTERVIEW' | 'CAPACITY';
    met: boolean;
    expected: string;
    actual: string;
}

export interface CriteriaVerdict {
    checks: CriteriaCheck[];
    metCount: number;
    total: number;
    allMet: boolean;
}

export async function getFlags(
    applicationId: string,
): Promise<AdmissionFlag[]> {
    return (await api.get(
        `/admissions/applications/${applicationId}/flags`,
    )) as unknown as AdmissionFlag[];
}

export async function raiseFlag(
    applicationId: string,
    dto: { kind: FlagKind; detail?: string },
): Promise<AdmissionFlag> {
    return (await api.post(
        `/admissions/applications/${applicationId}/flags`,
        dto,
    )) as unknown as AdmissionFlag;
}

export async function clearFlag(id: string): Promise<void> {
    await api.delete(`/admissions/flags/${id}`);
}

/**
 * Null when the school has set no standard for this level — which is a
 * different answer from "meets none of it", and shown differently.
 */
export async function getCriteriaVerdict(
    applicationId: string,
): Promise<CriteriaVerdict | null> {
    const verdict = (await api.get(
        `/admissions/applications/${applicationId}/criteria`,
    )) as unknown as CriteriaVerdict | null;
    return verdict && Object.keys(verdict).length > 0 ? verdict : null;
}

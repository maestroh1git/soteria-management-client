import api from './client';
import { saveBlob } from '@/lib/utils/download';
import type { Student, StudentMedical } from './students';

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED';

export type AbsenceReason =
    | 'ILLNESS'
    | 'APPOINTMENT'
    | 'FAMILY'
    | 'TRAVEL'
    | 'BEREAVEMENT'
    | 'RELIGIOUS'
    | 'SUSPENDED'
    | 'UNKNOWN';

export type DayType =
    | 'TEACHING'
    | 'HOLIDAY'
    | 'BREAK'
    | 'EXAM'
    | 'CLOSURE'
    | 'WEEKEND';

export type DepartureReason =
    | 'MEDICAL'
    | 'APPOINTMENT'
    | 'ILLNESS'
    | 'FAMILY'
    | 'DISCIPLINARY'
    | 'ACTIVITY'
    | 'OTHER';

/** Shown to a teacher in the order the picker lists them. */
export const ABSENCE_REASON_LABELS: Record<AbsenceReason, string> = {
    ILLNESS: 'Illness',
    APPOINTMENT: 'Appointment',
    FAMILY: 'Family reason',
    TRAVEL: 'Travelling',
    BEREAVEMENT: 'Bereavement',
    RELIGIOUS: 'Religious observance',
    SUSPENDED: 'Suspended',
    UNKNOWN: 'Not known',
};

export const DEPARTURE_REASON_LABELS: Record<DepartureReason, string> = {
    MEDICAL: 'Medical',
    APPOINTMENT: 'Appointment',
    ILLNESS: 'Taken ill',
    FAMILY: 'Family reason',
    DISCIPLINARY: 'Sent home',
    ACTIVITY: 'School activity',
    OTHER: 'Other',
};

export const DAY_TYPE_LABELS: Record<DayType, string> = {
    TEACHING: 'Teaching day',
    HOLIDAY: 'Holiday',
    BREAK: 'Break',
    EXAM: 'Exams',
    CLOSURE: 'Closed',
    WEEKEND: 'Weekend',
};

export interface RosterPupil {
    studentId: string;
    admissionNumber: string;
    firstName: string;
    lastName: string;
    status: AttendanceStatus | null;
    reasonCode: AbsenceReason | null;
    reasonNote: string | null;
    minutesLate: number | null;
    markId: string | null;
    recordedAt: string | null;
    recordedByName: string | null;
}

export interface RegisterView {
    classArmId: string;
    className: string;
    date: string;
    dayType: DayType | null;
    termId: string | null;
    termName: string | null;
    markable: boolean;
    blockedReason: string | null;
    alreadyMarked: boolean;
    canAmend: boolean;
    pupils: RosterPupil[];
}

export interface SubmitMark {
    studentId: string;
    status: AttendanceStatus;
    reasonCode?: AbsenceReason;
    reasonNote?: string;
    minutesLate?: number;
}

export interface SubmitResult {
    created: number;
    corrected: number;
    unchanged: number;
    rejected: Array<{ studentId: string; reason: string }>;
    conflicts: Array<{ studentId: string; name: string; changedBy: string | null }>;
    warnings: string[];
}

export interface SchoolDay {
    id: string;
    termId: string;
    calendarDate: string;
    dayType: DayType;
    note: string | null;
}

export interface DaySummary {
    date: string;
    dayType: DayType | null;
    isTeachingDay: boolean;
    enrolled: number;
    inSchool: number;
    rate: number;
    armsTotal: number;
    armsNotTaken: Array<{ classArmId: string; className: string }>;
    arms: Array<{
        classArmId: string;
        className: string;
        enrolled: number;
        present: number;
        late: number;
        absent: number;
        excused: number;
        marked: number;
        taken: boolean;
    }>;
}

export interface StudentSummary {
    studentId: string;
    termId: string;
    termName: string;
    teachingDays: number;
    present: number;
    late: number;
    absent: number;
    excused: number;
    unmarked: number;
    attendanceRate: number;
    unauthorisedRate: number;
    currentStreak: number;
    longestStreak: number;
}

export interface AtRiskPupil {
    studentId: string;
    firstName: string;
    lastName: string;
    admissionNumber: string;
    className: string;
    inSchool: number;
    absent: number;
    teachingDays: number;
    attendanceRate: number;
    guardianName: string | null;
    guardianPhone: string | null;
    /** When the family was last contacted, and by whom (5.5); what was said is on the record. */
    lastContact: { at: string; reached: boolean; by: string | null } | null;
}

export interface MyClass {
    classArmId: string;
    className: string;
    enrolled: number;
    registerTaken: boolean;
    markable: boolean;
    blockedReason: string | null;
    present: number;
    late: number;
    absent: number;
    excused: number;
    termRate: number | null;
    needsAWord: AtRiskPupil[];
    /** Pupils of this class signed out at the gate today. */
    signedOutToday: number;
}

export interface Collector {
    guardianId: string;
    name: string;
    relationship: string;
    phone: string;
    isPrimary: boolean;
    canCollect: boolean;
    blockedReason: string | null;
}

export interface Departure {
    id: string;
    studentId: string;
    pupilName: string;
    admissionNumber: string;
    className: string | null;
    departedAt: string;
    returnedAt: string | null;
    reasonCode: DepartureReason;
    reasonNote: string | null;
    collectedBy: string | null;
    collectedByRelationship: string | null;
    wasOverride: boolean;
    overrideReason: string | null;
}

export interface Paginated<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

// ── Register ────────────────────────────────────────────────────────────────

export async function getRegister(
    classArmId: string,
    date: string,
): Promise<RegisterView> {
    return (await api.get('/attendance/register', {
        params: { classArmId, date },
    })) as unknown as RegisterView;
}

export async function submitRegister(dto: {
    classArmId: string;
    date: string;
    marks: SubmitMark[];
    correctionNote?: string;
}): Promise<SubmitResult> {
    return (await api.post('/attendance/register', dto)) as unknown as SubmitResult;
}

/**
 * One class I teach: its roster, the medical facts a teacher must know, and
 * who has been signed out at the gate today (GET /attendance/my-classes/:armId).
 * Identity-first: the class's form teacher may open it whatever their system
 * roles, as may the office and Educators.
 */
export interface MyClassView {
    classArmId: string;
    className: string;
    pupils: Student[];
    medicalAlerts: Array<{ student: Student; medical: StudentMedical }>;
    signedOutToday: Departure[];
}

export async function getMyClass(armId: string): Promise<MyClassView> {
    return (await api.get(`/attendance/my-classes/${armId}`)) as unknown as MyClassView;
}

export async function getMyClasses(): Promise<{
    date: string;
    dayType: DayType | null;
    termId: string | null;
    classes: MyClass[];
}> {
    return (await api.get('/attendance/my-classes')) as unknown as {
        date: string;
        dayType: DayType | null;
        termId: string | null;
        classes: MyClass[];
    };
}

export async function getDaySummary(date?: string): Promise<DaySummary> {
    return (await api.get('/attendance/summary/day', {
        params: date ? { date } : undefined,
    })) as unknown as DaySummary;
}

/** One mark as recorded, corrections included (the older one is not current). */
export interface MarkHistoryItem {
    id: string;
    date: string;
    status: AttendanceStatus;
    reasonCode: AbsenceReason | null;
    reasonNote: string | null;
    minutesLate: number | null;
    source: string;
    recordedAt: string;
    correctionNote: string | null;
    isCurrent: boolean;
    recordedByName: string | null;
}

/** One pupil's marks between two dates, newest first. */
export async function getMarkHistory(params: {
    studentId: string;
    from: string;
    to: string;
    limit?: number;
}): Promise<{ items: MarkHistoryItem[]; total: number }> {
    return (await api.get('/attendance/marks', {
        params: { limit: 200, ...params },
    })) as unknown as { items: MarkHistoryItem[]; total: number };
}

export async function getStudentSummary(
    studentId: string,
    termId: string,
): Promise<StudentSummary> {
    return (await api.get(`/attendance/summary/student/${studentId}`, {
        params: { termId },
    })) as unknown as StudentSummary;
}

export async function getAtRisk(params: {
    termId: string;
    threshold?: number;
    page?: number;
    limit?: number;
    classArmId?: string;
}): Promise<Paginated<AtRiskPupil> & { teachingDays: number }> {
    return (await api.get('/attendance/at-risk', { params })) as unknown as Paginated<
        AtRiskPupil
    > & { teachingDays: number };
}

// ── Calendar ────────────────────────────────────────────────────────────────

export async function getCalendar(termId: string): Promise<SchoolDay[]> {
    return (await api.get('/attendance/calendar', {
        params: { termId },
    })) as unknown as SchoolDay[];
}

export async function generateCalendar(
    termId: string,
): Promise<{ created: number; skipped: number; teaching: number }> {
    return (await api.post('/attendance/calendar/generate', {
        termId,
    })) as unknown as { created: number; skipped: number; teaching: number };
}

export async function setCalendarRange(dto: {
    termId: string;
    from: string;
    to: string;
    dayType: DayType;
    note?: string;
}): Promise<{ updated: number }> {
    return (await api.patch('/attendance/calendar/range', dto)) as unknown as {
        updated: number;
    };
}

// ── The gate ────────────────────────────────────────────────────────────────

export async function getCollectors(studentId: string): Promise<Collector[]> {
    return (await api.get(
        `/attendance/departures/collectors/${studentId}`,
    )) as unknown as Collector[];
}

export async function getDepartures(
    date?: string,
    classArmId?: string,
): Promise<Departure[]> {
    return (await api.get('/attendance/departures', {
        params: { date, classArmId },
    })) as unknown as Departure[];
}

export async function recordDeparture(dto: {
    studentId: string;
    reasonCode: DepartureReason;
    reasonNote?: string;
    collectedByGuardianId?: string;
    collectedByName?: string;
    collectedByRelationship?: string;
    overrideReason?: string;
}): Promise<Departure> {
    return (await api.post('/attendance/departures', dto)) as unknown as Departure;
}

export async function recordReturn(id: string): Promise<Departure> {
    return (await api.patch(
        `/attendance/departures/${id}/return`,
        {},
    )) as unknown as Departure;
}

// ── Awards ──────────────────────────────────────────────────────────────────

export interface StudentAward {
    id: string;
    title: string;
    description: string | null;
    category: string;
    awardedOn: string;
    visibleToParent: boolean;
}

export type AwardCategory =
    | 'ACADEMIC'
    | 'SPORT'
    | 'CHARACTER'
    | 'ATTENDANCE'
    | 'ARTS'
    | 'LEADERSHIP'
    | 'GENERAL';

export const AWARD_CATEGORY_LABELS: Record<AwardCategory, string> = {
    ACADEMIC: 'Academic',
    SPORT: 'Sport',
    CHARACTER: 'Character',
    ATTENDANCE: 'Attendance',
    ARTS: 'Arts',
    LEADERSHIP: 'Leadership',
    GENERAL: 'General',
};

/** One row of the school-wide list: the award, the pupil and who gave it. */
export interface AwardFeedRow {
    id: string;
    title: string;
    description: string | null;
    category: AwardCategory;
    awardedOn: string;
    visibleToParent: boolean;
    studentId: string;
    pupilName: string;
    admissionNumber: string;
    className: string | null;
    awardedByName: string | null;
}

export async function getAwardFeed(params: {
    termId?: string;
    classArmId?: string;
    category?: AwardCategory;
    awardedBy?: string;
    page?: number;
    limit?: number;
}): Promise<Paginated<AwardFeedRow>> {
    return (await api.get('/awards', { params })) as unknown as Paginated<AwardFeedRow>;
}

export async function deleteAward(
    studentId: string,
    awardId: string,
): Promise<void> {
    await api.delete(`/students/${studentId}/awards/${awardId}`);
}

export async function getAwards(studentId: string): Promise<StudentAward[]> {
    return (await api.get(
        `/students/${studentId}/awards`,
    )) as unknown as StudentAward[];
}

export async function createAward(
    studentId: string,
    dto: {
        title: string;
        description?: string;
        category?: string;
        awardedOn: string;
        termId?: string;
        visibleToParent?: boolean;
    },
): Promise<StudentAward> {
    return (await api.post(
        `/students/${studentId}/awards`,
        dto,
    )) as unknown as StudentAward;
}

/** A class, Monday to Friday: each pupil's current mark per day (5.4). */
export interface ClassWeek {
    classArmId: string;
    className: string;
    from: string;
    to: string;
    days: Array<{ date: string; dayType: string | null }>;
    pupils: Array<{
        studentId: string;
        firstName: string;
        lastName: string;
        admissionNumber: string;
        marks: Record<string, AttendanceStatus>;
        /** Why, by day, for the days away or late. */
        reasons: Record<string, { reasonCode: AbsenceReason | null; minutesLate: number | null }>;
    }>;
}

export async function getClassWeek(armId: string, date: string): Promise<ClassWeek> {
    return (await api.get(`/attendance/my-classes/${armId}/week`, {
        params: { date },
    })) as unknown as ClassWeek;
}

/**
 * The register as CSV. The office may export the whole school; a form teacher
 * their own class (the API decides).
 */
export async function downloadAttendance(params: {
    from: string;
    to: string;
    classArmId?: string;
    /** For the file name: "Primary 4 Gold". */
    label?: string;
}): Promise<void> {
    const { label, ...query } = params;
    const data = await api.get('/attendance/export', { params: query, responseType: 'blob' });
    const stem = (label ?? 'attendance').replace(/[^\w-]+/g, '-').toLowerCase();
    saveBlob(data as unknown as BlobPart, `${stem}_${params.from}_to_${params.to}.csv`, 'text/csv');
}

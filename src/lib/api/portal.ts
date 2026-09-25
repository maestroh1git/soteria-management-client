import api from './client';
import { saveBlob } from '@/lib/utils/download';

export interface PortalChild {
    id: string;
    name: string;
    admissionNumber: string;
    className: string | null;
    /** Who takes this child's class. Null where the school has not said. */
    formTeacher: string | null;
    status: string;
    /** Owed across every issued invoice. A string, like every amount. */
    outstanding: string;
}

export interface StatementEntry {
    date: string;
    description: string;
    charge: string | null;
    payment: string | null;
    balance: string;
}

export interface ChildStatement {
    student: { id: string; name: string; admissionNumber: string };
    entries: StatementEntry[];
    balance: string;
    unallocatedCredit: string;
}

export async function getMyChildren(): Promise<PortalChild[]> {
    return (await api.get('/portal/children')) as unknown as PortalChild[];
}

export async function getChildStatement(
    studentId: string,
): Promise<ChildStatement> {
    return (await api.get(
        `/portal/children/${studentId}/statement`,
    )) as unknown as ChildStatement;
}

export interface ParentAttendanceDay {
    date: string;
    status: 'PRESENT' | 'LATE' | 'ABSENT' | 'EXCUSED' | null;
    reasonCode: string | null;
    minutesLate: number | null;
}

/**
 * A child's attendance as their own parent sees it.
 *
 * There is no `reasonNote` here and there must never be: it holds the school's
 * internal note, which will contain health detail. The API projects it away;
 * this type is the second place that rule is visible.
 */
export interface ParentAttendance {
    studentId: string;
    termId: string;
    termName: string;
    formTeacher: string | null;
    className: string | null;
    teachingDays: number;
    inSchool: number;
    sentence: string;
    attendanceRate: number;
    unauthorisedAbsences: number;
    currentStreak: number;
    longestStreak: number;
    days: ParentAttendanceDay[];
    badges: Array<{
        id: string;
        name: string;
        description: string;
        icon: string;
    }>;
    awards: Array<{
        id: string;
        title: string;
        description: string | null;
        category: string;
        awardedOn: string;
    }>;
}

export async function getChildAttendance(
    studentId: string,
    termId?: string,
): Promise<ParentAttendance | null> {
    return (await api.get(`/portal/children/${studentId}/attendance`, {
        params: termId ? { termId } : undefined,
    })) as unknown as ParentAttendance | null;
}

/**
 * One child's attendance as CSV, for their own parent (ROADMAP-EXECUTION.md,
 * 5.7). The same days the screen shows, and nothing it does not.
 */
export async function downloadChildAttendance(params: {
    studentId: string;
    /** For the file name: the child's name. */
    name: string;
    termId?: string;
}): Promise<void> {
    const data = await api.get(`/portal/children/${params.studentId}/attendance/export`, {
        params: params.termId ? { termId: params.termId } : undefined,
        responseType: 'blob',
    });
    const stem = params.name.replace(/[^\w-]+/g, '-').toLowerCase();
    saveBlob(data as unknown as BlobPart, `${stem}_attendance.csv`, 'text/csv');
}

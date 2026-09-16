import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    createAward,
    deleteAward,
    getAwardFeed,
    generateCalendar,
    getAtRisk,
    getAwards,
    getCalendar,
    getCollectors,
    getDaySummary,
    getDepartures,
    getMyClasses,
    getRegister,
    getStudentSummary,
    recordDeparture,
    recordReturn,
    setCalendarRange,
    submitRegister,
    updateSchoolDay,
    type SubmitResult,
} from '../api/attendance';

/**
 * The register is the one query in this app that must never serve a stale
 * answer: a teacher looking at yesterday's marks would take today's register
 * over the top of them. Everything else here caches normally.
 */
export function useRegister(classArmId?: string, date?: string) {
    return useQuery({
        queryKey: ['attendance', 'register', classArmId, date],
        queryFn: () => getRegister(classArmId!, date!),
        enabled: !!classArmId && !!date,
        staleTime: 0,
        gcTime: 0,
    });
}

export function useMyClasses() {
    return useQuery({
        queryKey: ['attendance', 'my-classes'],
        queryFn: getMyClasses,
        staleTime: 30 * 1000,
    });
}

export function useDaySummary(date?: string) {
    return useQuery({
        queryKey: ['attendance', 'summary', 'day', date ?? 'today'],
        queryFn: () => getDaySummary(date),
        staleTime: 60 * 1000,
    });
}

export function useStudentSummary(studentId?: string, termId?: string) {
    return useQuery({
        queryKey: ['attendance', 'summary', 'student', studentId, termId],
        queryFn: () => getStudentSummary(studentId!, termId!),
        enabled: !!studentId && !!termId,
    });
}

export function useAtRisk(params: {
    termId?: string;
    threshold?: number;
    page?: number;
    classArmId?: string;
}) {
    return useQuery({
        queryKey: ['attendance', 'at-risk', params],
        queryFn: () =>
            getAtRisk({
                termId: params.termId!,
                threshold: params.threshold,
                page: params.page,
                classArmId: params.classArmId,
            }),
        enabled: !!params.termId,
    });
}

export function useSubmitRegister() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: submitRegister,
        onSuccess: (result: SubmitResult) => {
            // Counts, not "Saved": the teacher needs to see what actually
            // landed, especially when some rows were refused.
            const parts: string[] = [];
            if (result.created) parts.push(`${result.created} marked`);
            if (result.corrected) parts.push(`${result.corrected} corrected`);
            if (result.unchanged) parts.push(`${result.unchanged} unchanged`);
            toast.success(`Register saved — ${parts.join(', ') || 'nothing changed'}`);

            for (const w of result.warnings) toast.warning(w);
            if (result.rejected.length) {
                toast.error(
                    `${result.rejected.length} could not be saved: ${result.rejected[0].reason}`,
                );
            }
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useCalendar(termId?: string) {
    return useQuery({
        queryKey: ['attendance', 'calendar', termId],
        queryFn: () => getCalendar(termId!),
        enabled: !!termId,
        staleTime: 5 * 60 * 1000,
    });
}

export function useGenerateCalendar() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: generateCalendar,
        onSuccess: (r) => {
            toast.success(
                r.created === 0
                    ? 'The calendar for this term is already complete. Nothing was changed.'
                    : `Calendar created — ${r.teaching} teaching days of ${r.created}.`,
            );
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useUpdateSchoolDay() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            id,
            ...dto
        }: {
            id: string;
            dayType: Parameters<typeof updateSchoolDay>[1]['dayType'];
            note?: string;
        }) => updateSchoolDay(id, dto),
        onSuccess: () => {
            toast.success('Calendar updated');
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useSetCalendarRange() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: setCalendarRange,
        onSuccess: (r) => {
            toast.success(`${r.updated} days updated`);
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useCollectors(studentId?: string) {
    return useQuery({
        queryKey: ['attendance', 'collectors', studentId],
        queryFn: () => getCollectors(studentId!),
        enabled: !!studentId,
    });
}

export function useDepartures(date?: string) {
    return useQuery({
        queryKey: ['attendance', 'departures', date ?? 'today'],
        queryFn: () => getDepartures(date),
        staleTime: 15 * 1000,
    });
}

export function useRecordDeparture() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: recordDeparture,
        onSuccess: () => {
            toast.success('Signed out');
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useRecordReturn() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: recordReturn,
        onSuccess: () => {
            toast.success('Signed back in');
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

export function useAwards(studentId?: string) {
    return useQuery({
        queryKey: ['attendance', 'awards', studentId],
        queryFn: () => getAwards(studentId!),
        enabled: !!studentId,
    });
}

export function useCreateAward(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (dto: Parameters<typeof createAward>[1]) =>
            createAward(studentId, dto),
        onSuccess: () => {
            toast.success('Award recorded');
            qc.invalidateQueries({ queryKey: ['attendance', 'awards', studentId] });
        },
    });
}

/** Awards across the school — prize-giving, and whether recognition lands evenly. */
export function useAwardFeed(params: Parameters<typeof getAwardFeed>[0]) {
    return useQuery({
        queryKey: ['attendance', 'award-feed', params],
        queryFn: () => getAwardFeed(params),
    });
}

export function useDeleteAward(studentId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (awardId: string) => deleteAward(studentId, awardId),
        onSuccess: () => {
            toast.success('Award withdrawn');
            qc.invalidateQueries({ queryKey: ['attendance'] });
        },
    });
}

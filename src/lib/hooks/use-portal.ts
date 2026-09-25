import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { getApiErrorMessage } from '@/lib/utils/api-error';
import {
    downloadChildAttendance,
    getChildAttendance,
    getChildStatement,
    getMyChildren,
} from '../api/portal';

/** The children on this parent's account. */
export function useMyChildren() {
    return useQuery({ queryKey: ['portal', 'children'], queryFn: getMyChildren });
}

export function useChildStatement(studentId?: string) {
    return useQuery({
        queryKey: ['portal', 'children', studentId, 'statement'],
        queryFn: () => getChildStatement(studentId!),
        enabled: !!studentId,
    });
}

/** One child's attendance, their badges and the awards the school shared. */
export function useChildAttendance(studentId?: string, termId?: string) {
    return useQuery({
        queryKey: ['portal', 'children', studentId, 'attendance', termId],
        queryFn: () => getChildAttendance(studentId!, termId),
        enabled: !!studentId,
    });
}

/** Save one child's attendance as a spreadsheet. */
export function useDownloadChildAttendance() {
    return useMutation({
        mutationFn: downloadChildAttendance,
        onError: (err) =>
            toast.error(getApiErrorMessage(err, 'The attendance could not be downloaded.')),
    });
}

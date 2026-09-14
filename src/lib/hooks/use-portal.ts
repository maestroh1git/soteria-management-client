import { useQuery } from '@tanstack/react-query';
import { getChildStatement, getMyChildren } from '../api/portal';

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

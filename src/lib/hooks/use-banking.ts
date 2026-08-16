import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    autoMatch,
    completeStatement,
    createStatement,
    getReconciliationReport,
    getStatement,
    getStatements,
    matchLines,
    postStatementLine,
    unmatchGroup,
} from '../api/banking';

export function useStatements() {
    return useQuery({
        queryKey: ['banking', 'statements'],
        queryFn: getStatements,
    });
}

export function useStatement(id?: string) {
    return useQuery({
        queryKey: ['banking', 'statements', id],
        queryFn: () => getStatement(id!),
        enabled: !!id,
    });
}

export function useReconciliationReport(id?: string) {
    return useQuery({
        queryKey: ['banking', 'statements', id, 'report'],
        queryFn: () => getReconciliationReport(id!),
        enabled: !!id,
    });
}

export function useCreateStatement() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createStatement,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banking'] });
            toast.success('Statement imported');
        },
    });
}

export function useMatchLines(statementId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: {
            statementLineIds: string[];
            journalLineIds: string[];
        }) => matchLines(statementId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banking'] });
        },
    });
}

export function useUnmatch(statementId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (groupId: string) => unmatchGroup(statementId, groupId),
        onSuccess: () => qc.invalidateQueries({ queryKey: ['banking'] }),
    });
}

export function useAutoMatch(statementId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => autoMatch(statementId),
        onSuccess: (result) => {
            qc.invalidateQueries({ queryKey: ['banking'] });
            // Say what was LEFT as well as what was done. A count of matches
            // alone reads as "finished" when it usually is not.
            toast.success(
                `${result.matched} matched` +
                    (result.ambiguous
                        ? `, ${result.ambiguous} need a person to decide`
                        : ''),
            );
        },
    });
}

export function usePostStatementLine(statementId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            lineId,
            ...data
        }: {
            lineId: string;
            accountId: string;
            description?: string;
        }) => postStatementLine(statementId, lineId, data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banking'] });
            qc.invalidateQueries({ queryKey: ['finance'] });
            toast.success('Posted and matched');
        },
    });
}

export function useCompleteStatement(statementId: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: () => completeStatement(statementId),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['banking'] });
            toast.success('Reconciliation signed off');
        },
    });
}

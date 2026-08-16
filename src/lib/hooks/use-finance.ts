import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
    getAccounts,
    getTrialBalance,
    getJournalEntries,
    getJournalEntry,
    getPayrollCheck,
    getExpenses,
    getExpense,
    createExpense,
    expenseAction,
    payExpense,
    getSpendByAccount,
    getBudgets,
    getBudgetVariance,
    createBudget,
    deleteBudget,
    getIncomeStatement,
} from '../api/finance';

// ── Ledger ──────────────────────────────────────────────────────────────────

export function useAccounts(asOf?: string) {
    return useQuery({
        queryKey: ['ledger', 'accounts', asOf],
        queryFn: () => getAccounts(asOf),
    });
}

export function useTrialBalance(asOf?: string) {
    return useQuery({
        queryKey: ['ledger', 'trial-balance', asOf],
        queryFn: () => getTrialBalance(asOf),
    });
}

export function useJournalEntries(filters?: {
    from?: string;
    to?: string;
    sourceType?: string;
    accountId?: string;
}) {
    return useQuery({
        queryKey: ['ledger', 'entries', filters],
        queryFn: () => getJournalEntries(filters),
    });
}

export function useJournalEntry(id: string | undefined) {
    return useQuery({
        queryKey: ['ledger', 'entries', id],
        queryFn: () => getJournalEntry(id!),
        enabled: !!id,
    });
}

/**
 * Payroll's numbers against the ledger's.
 *
 * Deliberately not cached hard: it is asked precisely when somebody suspects
 * the two have drifted, and a stale answer to that question is worthless.
 */
export function usePayrollCheck(payPeriodId: string | undefined) {
    return useQuery({
        queryKey: ['ledger', 'payroll-check', payPeriodId],
        queryFn: () => getPayrollCheck(payPeriodId!),
        enabled: !!payPeriodId,
        staleTime: 0,
    });
}

// ── Expenses ────────────────────────────────────────────────────────────────

export function useExpenses(status?: string) {
    return useQuery({
        queryKey: ['expenses', status],
        queryFn: () => getExpenses(status),
    });
}

export function useExpense(id: string | undefined) {
    return useQuery({
        queryKey: ['expenses', id],
        queryFn: () => getExpense(id!),
        enabled: !!id,
    });
}

export function useCreateExpense() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createExpense,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
            toast.success('Expense raised');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not raise it'),
    });
}

export function useExpenseAction(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: ({
            action,
            body,
        }: {
            action: 'submit' | 'approve' | 'reject' | 'cancel' | 'reopen';
            body?: Record<string, unknown>;
        }) => expenseAction(id, action, body),
        onSuccess: (expense) => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
            toast.success(`Now ${expense.status.toLowerCase()}`);
        },
        // The server refuses self-approval by name. Worth surfacing verbatim —
        // though the UI should have stopped it reaching here.
        onError: (e: Error) => toast.error(e.message || 'Could not do that'),
    });
}

export function usePayExpense(id: string) {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: payExpense.bind(null, id) as (dto: {
            paymentAccountId: string;
            paymentMethod: 'BANK_TRANSFER' | 'CASH' | 'CHEQUE';
            paymentReference?: string;
            paidOn?: string;
        }) => ReturnType<typeof payExpense>,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['expenses'] });
            // The ledger moved, so anything reading it is now stale.
            qc.invalidateQueries({ queryKey: ['ledger'] });
            qc.invalidateQueries({ queryKey: ['budgets'] });
            toast.success('Paid, and posted to the ledger');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not record payment'),
    });
}

export function useSpendByAccount(from?: string, to?: string) {
    return useQuery({
        queryKey: ['expenses', 'by-account', from, to],
        queryFn: () => getSpendByAccount(from, to),
    });
}

// ── Budgets ─────────────────────────────────────────────────────────────────

export function useBudgets() {
    return useQuery({ queryKey: ['budgets'], queryFn: getBudgets });
}

export function useBudgetVariance(filters?: {
    on?: string;
    departmentId?: string;
}) {
    return useQuery({
        queryKey: ['budgets', 'variance', filters],
        queryFn: () => getBudgetVariance(filters),
    });
}

export function useCreateBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: createBudget,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['budgets'] });
            toast.success('Budget set');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not set it'),
    });
}

export function useDeleteBudget() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: deleteBudget,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['budgets'] });
            toast.success('Budget removed');
        },
        onError: (e: Error) => toast.error(e.message || 'Could not remove it'),
    });
}

/**
 * What was earned and what it cost, over a period.
 *
 * The report the Phase 4 milestone is written in terms of, and the first one
 * that could not exist before fees — until then every posting this system made
 * was a cost or a liability.
 */
export function useIncomeStatement(from?: string, to?: string) {
    return useQuery({
        queryKey: ['finance', 'income-statement', from, to],
        queryFn: () => getIncomeStatement(from!, to!),
        enabled: !!from && !!to,
    });
}

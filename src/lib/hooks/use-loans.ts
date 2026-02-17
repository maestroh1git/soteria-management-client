import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { LoanFilters } from '@/lib/types/api';
import {
  getLoans,
  getLoan,
  applyForLoan,
  applyForAdvance,
  approveLoan,
  rejectLoan,
  disburseLoan,
  getLoanRepayments,
  getEmployeeLoans,
  type CreateLoanDto,
  type CreateAdvanceDto,
  type LoanApprovalDto,
} from '@/lib/api/loans';

// ── Queries ─────────────────────────────────────────────────

export function useLoans(filters?: LoanFilters) {
  return useQuery({
    queryKey: ['loans', filters],
    queryFn: () => getLoans(filters),
  });
}

export function useLoan(id: string) {
  return useQuery({
    queryKey: ['loans', id],
    queryFn: () => getLoan(id),
    enabled: !!id,
  });
}

export function useLoanRepayments(loanId: string) {
  return useQuery({
    queryKey: ['loans', loanId, 'repayments'],
    queryFn: () => getLoanRepayments(loanId),
    enabled: !!loanId,
  });
}

export function useEmployeeLoans(employeeId: string, status?: string) {
  return useQuery({
    queryKey: ['loans', 'employee', employeeId, status],
    queryFn: () => getEmployeeLoans(employeeId, status),
    enabled: !!employeeId,
  });
}

// ── Mutations ───────────────────────────────────────────────

export function useApplyForLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateLoanDto) => applyForLoan(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan application submitted');
    },
    onError: () => toast.error('Failed to submit loan application'),
  });
}

export function useApplyForAdvance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateAdvanceDto) => applyForAdvance(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Salary advance application submitted');
    },
    onError: () => toast.error('Failed to submit advance application'),
  });
}

export function useApproveLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: LoanApprovalDto }) => approveLoan(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan approved');
    },
    onError: () => toast.error('Failed to approve loan'),
  });
}

export function useRejectLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, notes }: { id: string; notes?: string }) => rejectLoan(id, notes),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan rejected');
    },
    onError: () => toast.error('Failed to reject loan'),
  });
}

export function useDisburseLoan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => disburseLoan(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['loans'] });
      toast.success('Loan disbursed');
    },
    onError: () => toast.error('Failed to disburse loan'),
  });
}

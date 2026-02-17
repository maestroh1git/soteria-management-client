import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import type { PayPeriodFilters, SalaryFilters } from '@/lib/types/api';
import {
  getPayPeriods,
  getPayPeriod,
  getCurrentPayPeriod,
  createPayPeriod,
  type CreatePayPeriodDto,
} from '@/lib/api/pay-periods';
import {
  processPayroll,
  getSalaries,
  getSalary,
  approveSalary,
  markSalaryAsPaid,
  bulkPayment,
  type ProcessPayrollDto,
  type SalaryApprovalDto,
  type SalaryPaymentDto,
  type BulkPaymentDto,
} from '@/lib/api/payroll';

// ── Pay Period queries ──────────────────────────────────────

export function usePayPeriods(filters?: PayPeriodFilters) {
  return useQuery({
    queryKey: ['pay-periods', filters],
    queryFn: () => getPayPeriods(filters),
  });
}

export function usePayPeriod(id: string) {
  return useQuery({
    queryKey: ['pay-periods', id],
    queryFn: () => getPayPeriod(id),
    enabled: !!id,
  });
}

export function useCurrentPayPeriod() {
  return useQuery({
    queryKey: ['pay-periods', 'current'],
    queryFn: getCurrentPayPeriod,
  });
}

export function useCreatePayPeriod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreatePayPeriodDto) => createPayPeriod(dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['pay-periods'] });
      toast.success('Pay period created');
    },
    onError: () => toast.error('Failed to create pay period'),
  });
}

// ── Payroll / Salary queries ────────────────────────────────

export function useSalaries(filters?: SalaryFilters) {
  return useQuery({
    queryKey: ['salaries', filters],
    queryFn: () => getSalaries(filters),
    enabled: !!filters?.payPeriodId,
  });
}

export function useSalary(id: string) {
  return useQuery({
    queryKey: ['salaries', id],
    queryFn: () => getSalary(id),
    enabled: !!id,
  });
}

export function useProcessPayroll() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: ProcessPayrollDto) => processPayroll(dto),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['salaries'] });
      qc.invalidateQueries({ queryKey: ['pay-periods'] });
      toast.success(
        `Payroll processed: ${result.processedCount} salaries calculated`,
      );
    },
    onError: () => toast.error('Failed to process payroll'),
  });
}

export function useApproveSalary() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SalaryApprovalDto }) =>
      approveSalary(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary approved');
    },
    onError: () => toast.error('Failed to approve salary'),
  });
}

export function useMarkAsPaid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: string; dto: SalaryPaymentDto }) =>
      markSalaryAsPaid(id, dto),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['salaries'] });
      toast.success('Salary marked as paid');
    },
    onError: () => toast.error('Failed to mark salary as paid'),
  });
}

export function useBulkPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (dto: BulkPaymentDto) => bulkPayment(dto),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['salaries'] });
      toast.success(
        `Bulk payment: ${result.successful.length} successful, ${result.failed.length} failed`,
      );
    },
    onError: () => toast.error('Bulk payment failed'),
  });
}

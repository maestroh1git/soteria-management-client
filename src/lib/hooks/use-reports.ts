import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  generatePayslip,
  generateBulkPayslips,
  sendPayslipEmail,
  sendBulkEmails,
  getPayslipsByEmployee,
  getPayslipsByPayPeriod,
  getPayslip,
} from '@/lib/api/payslips';
import {
  getMonthlySummary,
  getTaxSummary,
  getLoanPortfolio,
  getDepartmentCost,
  getYearEndReport,
} from '@/lib/api/reports';
import { getSalaries } from '@/lib/api/payroll';

// ── Payslip queries ─────────────────────────────────────────

export function usePayslipsByEmployee(employeeId: string) {
  return useQuery({
    queryKey: ['payslips', 'employee', employeeId],
    queryFn: () => getPayslipsByEmployee(employeeId),
    enabled: !!employeeId,
  });
}

export function usePayslipsByPayPeriod(payPeriodId: string) {
  return useQuery({
    queryKey: ['payslips', 'pay-period', payPeriodId],
    queryFn: () => getPayslipsByPayPeriod(payPeriodId),
    enabled: !!payPeriodId,
  });
}

export function usePayslip(id: string) {
  return useQuery({
    queryKey: ['payslips', id],
    queryFn: () => getPayslip(id),
    enabled: !!id,
  });
}

// ── Payslip mutations ───────────────────────────────────────

export function useGeneratePayslip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (salaryId: string) => generatePayslip(salaryId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payslips'] });
      toast.success('Payslip generated');
    },
    onError: () => toast.error('Failed to generate payslip'),
  });
}

export function useGenerateBulkPayslips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payPeriodId: string) => generateBulkPayslips(payPeriodId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['payslips'] });
      toast.success(`Generated ${result.generated} payslips` + (result.failed ? `, ${result.failed} failed` : ''));
    },
    onError: () => toast.error('Failed to generate payslips'),
  });
}

export function useSendPayslipEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sendPayslipEmail(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['payslips'] });
      toast.success('Payslip email sent');
    },
    onError: () => toast.error('Failed to send payslip email'),
  });
}

export function useSendBulkEmails() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payPeriodId: string) => sendBulkEmails(payPeriodId),
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['payslips'] });
      toast.success(`Sent ${result.sent} emails` + (result.failed ? `, ${result.failed} failed` : ''));
    },
    onError: () => toast.error('Failed to send payslip emails'),
  });
}

// ── Report queries ──────────────────────────────────────────

export function useMonthlySummary(month?: number, year?: number) {
  return useQuery({
    queryKey: ['reports', 'monthly-summary', month, year],
    queryFn: () => getMonthlySummary(month, year),
  });
}

export function useTaxSummary(year?: number) {
  return useQuery({
    queryKey: ['reports', 'tax-summary', year],
    queryFn: () => getTaxSummary(year),
  });
}

export function useLoanPortfolio() {
  return useQuery({
    queryKey: ['reports', 'loan-portfolio'],
    queryFn: () => getLoanPortfolio(),
  });
}

export function useDepartmentCost(month?: number, year?: number) {
  return useQuery({
    queryKey: ['reports', 'department-cost', month, year],
    queryFn: () => getDepartmentCost(month, year),
  });
}

export function useYearEndReport(year?: number) {
  return useQuery({
    queryKey: ['reports', 'year-end', year],
    queryFn: () => getYearEndReport(year),
  });
}

// ── Payroll queries (dashboard) ────────────────────────────

export function useRecentSalaries(limit = 5) {
  return useQuery({
    queryKey: ['payroll', 'salaries', 'recent', limit],
    queryFn: () => getSalaries({ limit }),
  });
}

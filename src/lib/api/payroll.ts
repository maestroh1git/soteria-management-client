import api from './client';
import type {
  Salary,
  SalaryFilters,
  PaginatedResponse,
  PayrollProcessResult,
  BulkPaymentResult,
} from '@/lib/types/api';

// ── DTOs ────────────────────────────────────────────────────
export interface ProcessPayrollDto {
  payPeriodId: string;
  dryRun?: boolean;
}

export interface SalaryApprovalDto {
  approverId: string;
  notes?: string;
}

export interface SalaryPaymentDto {
  paymentReference: string;
  notes?: string;
}

export interface BulkPaymentDto {
  payments: Array<{ salaryId: string; paymentReference: string }>;
}

// ── API calls ───────────────────────────────────────────────
export async function processPayroll(dto: ProcessPayrollDto): Promise<PayrollProcessResult> {
  return await api.post('/payroll/process', dto) as unknown as PayrollProcessResult;
}

export async function getSalaries(filters?: SalaryFilters): Promise<PaginatedResponse<Salary>> {
  return await api.get('/payroll/salaries', { params: filters }) as unknown as PaginatedResponse<Salary>;
}

export async function getSalary(id: string): Promise<Salary> {
  return await api.get(`/payroll/salaries/${id}`) as unknown as Salary;
}

export async function approveSalary(id: string, dto: SalaryApprovalDto): Promise<Salary> {
  return await api.patch(`/payroll/salaries/${id}/approve`, dto) as unknown as Salary;
}

export async function markSalaryAsPaid(id: string, dto: SalaryPaymentDto): Promise<Salary> {
  return await api.patch(`/payroll/salaries/${id}/pay`, dto) as unknown as Salary;
}

export async function bulkPayment(dto: BulkPaymentDto): Promise<BulkPaymentResult> {
  return await api.post('/payroll/bulk-payment', dto) as unknown as BulkPaymentResult;
}

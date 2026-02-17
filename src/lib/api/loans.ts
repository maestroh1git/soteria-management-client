import api from './client';
import type { Loan, LoanRepayment, LoanFilters } from '@/lib/types/api';

// ── DTOs ────────────────────────────────────────────────────
export interface CreateLoanDto {
  employeeId: string;
  amount: number;
  interestRate: number;
  termMonths: number;
  reason?: string;
}

export interface CreateAdvanceDto {
  employeeId: string;
  amount: number;
  reason?: string;
}

export interface LoanApprovalDto {
  approverId: string;
  notes?: string;
}

// ── API calls ───────────────────────────────────────────────
export async function getLoans(filters?: LoanFilters): Promise<Loan[]> {
  return await api.get('/loans', { params: filters }) as unknown as Loan[];
}

export async function getLoan(id: string): Promise<Loan> {
  return await api.get(`/loans/${id}`) as unknown as Loan;
}

export async function applyForLoan(dto: CreateLoanDto): Promise<Loan> {
  return await api.post('/loans', dto) as unknown as Loan;
}

export async function applyForAdvance(dto: CreateAdvanceDto): Promise<Loan> {
  return await api.post('/loans/advances', dto) as unknown as Loan;
}

export async function approveLoan(id: string, dto: LoanApprovalDto): Promise<Loan> {
  return await api.patch(`/loans/${id}/approve`, dto) as unknown as Loan;
}

export async function rejectLoan(id: string, notes?: string): Promise<Loan> {
  return await api.patch(`/loans/${id}/reject`, { notes }) as unknown as Loan;
}

export async function disburseLoan(id: string): Promise<Loan> {
  return await api.patch(`/loans/${id}/disburse`, {}) as unknown as Loan;
}

export async function getLoanRepayments(id: string): Promise<LoanRepayment[]> {
  return await api.get(`/loans/${id}/repayments`) as unknown as LoanRepayment[];
}

export async function getEmployeeLoans(employeeId: string, status?: string): Promise<Loan[]> {
  return await api.get(`/loans/employee/${employeeId}`, { params: { status } }) as unknown as Loan[];
}

import api from './client';
import { saveBlob } from '@/lib/utils/download';
import type {
  MonthlySummary,
  TaxSummary,
  LoanPortfolioReport,
  DepartmentCostReport,
  YearEndReport,
} from '@/lib/types/api';

export interface ReportFilters {
  month?: number;
  year?: number;
  reportType?: string;
}

// ── Report queries ──────────────────────────────────────────

export async function getMonthlySummary(month?: number, year?: number): Promise<MonthlySummary> {
  return await api.get('/reports/monthly-summary', { params: { month, year } }) as unknown as MonthlySummary;
}

export async function getTaxSummary(year?: number): Promise<TaxSummary> {
  return await api.get('/reports/tax-summary', { params: { year } }) as unknown as TaxSummary;
}

export async function getLoanPortfolio(): Promise<LoanPortfolioReport> {
  return await api.get('/reports/loan-portfolio') as unknown as LoanPortfolioReport;
}

export async function getDepartmentCost(month?: number, year?: number): Promise<DepartmentCostReport> {
  return await api.get('/reports/department-cost', { params: { month, year } }) as unknown as DepartmentCostReport;
}

/** Fees in against payroll cost, month by month, both from the ledger. */
export interface FeesVsPayrollReport {
  /** Oldest first, ending with the current month. Money as strings. */
  months: Array<{ year: number; month: number; feesIn: string; payrollCost: string }>;
}

export async function getFeesVsPayroll(months = 6): Promise<FeesVsPayrollReport> {
  return await api.get('/reports/fees-vs-payroll', { params: { months } }) as unknown as FeesVsPayrollReport;
}

export async function getYearEndReport(year?: number): Promise<YearEndReport> {
  return await api.get('/reports/year-end', { params: { year } }) as unknown as YearEndReport;
}

// ── Export URLs ──────────────────────────────────────────────

/**
 * A report as a file, downloaded with the login attached. These used to be
 * URLs opened in a new tab, which carry no token, so every export was a 401.
 */
export async function downloadReport(
  format: 'csv' | 'excel',
  filters: ReportFilters,
): Promise<void> {
  const params: Record<string, string> = {};
  if (filters.month) params.month = String(filters.month);
  if (filters.year) params.year = String(filters.year);
  if (filters.reportType) params.reportType = filters.reportType;
  const data = await api.get(`/reports/export/${format}`, {
    params,
    responseType: 'blob',
  });
  const stem = `${filters.reportType ?? 'report'}-${filters.year ?? ''}-${String(filters.month ?? '').padStart(2, '0')}`;
  saveBlob(
    data as unknown as BlobPart,
    `${stem}.${format === 'csv' ? 'csv' : 'xlsx'}`,
    format === 'csv'
      ? 'text/csv'
      : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  );
}

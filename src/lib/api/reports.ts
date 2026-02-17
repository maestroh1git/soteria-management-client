import api from './client';
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

export async function getYearEndReport(year?: number): Promise<YearEndReport> {
  return await api.get('/reports/year-end', { params: { year } }) as unknown as YearEndReport;
}

// ── Export URLs ──────────────────────────────────────────────

export function getExportCsvUrl(filters: ReportFilters): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const params = new URLSearchParams();
  if (filters.month) params.set('month', String(filters.month));
  if (filters.year) params.set('year', String(filters.year));
  if (filters.reportType) params.set('reportType', filters.reportType);
  return `${baseUrl}/reports/export/csv?${params.toString()}`;
}

export function getExportExcelUrl(filters: ReportFilters): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  const params = new URLSearchParams();
  if (filters.month) params.set('month', String(filters.month));
  if (filters.year) params.set('year', String(filters.year));
  if (filters.reportType) params.set('reportType', filters.reportType);
  return `${baseUrl}/reports/export/excel?${params.toString()}`;
}

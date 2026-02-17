import api from './client';
import type { Payslip } from '@/lib/types/api';

// ── API calls ───────────────────────────────────────────────

export async function generatePayslip(salaryId: string): Promise<Payslip> {
  return await api.post(`/payslips/generate/${salaryId}`) as unknown as Payslip;
}

export async function generateBulkPayslips(payPeriodId: string): Promise<{ generated: number; failed: number }> {
  return await api.post(`/payslips/generate-bulk/${payPeriodId}`) as unknown as { generated: number; failed: number };
}

export async function sendPayslipEmail(id: string): Promise<Payslip> {
  return await api.post(`/payslips/${id}/send`) as unknown as Payslip;
}

export async function sendBulkEmails(payPeriodId: string): Promise<{ sent: number; failed: number }> {
  return await api.post(`/payslips/send-bulk/${payPeriodId}`) as unknown as { sent: number; failed: number };
}

export async function getPayslipsByEmployee(employeeId: string): Promise<Payslip[]> {
  return await api.get(`/payslips/employee/${employeeId}`) as unknown as Payslip[];
}

export async function getPayslipsByPayPeriod(payPeriodId: string): Promise<Payslip[]> {
  return await api.get(`/payslips/pay-period/${payPeriodId}`) as unknown as Payslip[];
}

export async function getPayslip(id: string): Promise<Payslip> {
  return await api.get(`/payslips/${id}`) as unknown as Payslip;
}

/**
 * Download URL uses the access token, no auth header needed.
 * Returns the full URL for direct browser download.
 */
export function getPayslipDownloadUrl(accessToken: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
  return `${baseUrl}/payslips/download/${accessToken}`;
}
